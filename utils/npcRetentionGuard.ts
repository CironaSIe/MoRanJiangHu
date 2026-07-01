import type { TavernCommand } from '../types';
import { normalizeStateCommandKey } from './stateHelpers';

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 规范化NPC键 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '').toLowerCase()
        : ''
);

const 读取NPC键列表 = (npc: any): string[] => {
    if (!npc || typeof npc !== 'object' || Array.isArray(npc)) return [];
    return [
        npc.id,
        npc.ID,
        npc.姓名,
        npc.名称,
        ...(Array.isArray(npc.曾用名) ? npc.曾用名 : [])
    ]
        .map(规范化NPC键)
        .filter(Boolean);
};

const NPC互相匹配 = (left: any, right: any): boolean => {
    const leftKeys = 读取NPC键列表(left);
    const rightKeys = new Set(读取NPC键列表(right));
    return leftKeys.length > 0 && leftKeys.some((key) => rightKeys.has(key));
};

const 是普通对象 = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

/** 判断一个文本值是否"实质为空"（空字符串、纯空白、null、undefined） */
export const 实质为空文本 = (value: unknown): boolean => (
    value === undefined || value === null || (typeof value === 'string' && !value.trim())
);

/** 判断一个姓名/名称值是否是自动生成的占位名（如 "角色0"、"角色1"、"未命名功法1"、"势力 1"、"npc_0" 等） */
export const 是否占位名 = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false; // 空字符串不是占位名，由调用方决定是否保护
    return /^(角色|未命名功法|未命名武功|势力\s*)\d+$/u.test(trimmed)
        || /^npc_\d+$/i.test(trimmed)
        || /^FCT-\d+$/i.test(trimmed);
};

/** 判断值是否为空或占位（用于深合并中的空值保护） */
export const 是否无效值 = (value: unknown): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && !value.trim()) return true;
    return 是否占位名(value);
};

/** 需要在深合并中做空值保护的关键字段（名称类字段） */
const 名称保护字段 = new Set(['姓名', '名称', 'name', 'Name', 'ID', 'id']);

// 需要合并而非替换的数组字段（AI可能只返回增量更新）
const 需要合并的数组字段 = new Set(['记忆', '总结记忆', 'BUFF', 'DEBUFF', '关系网变量', '技艺', '天赋列表', '首次亲密记录', '回忆档案', '物品列表', '功法列表']);

const 深合并保留NPC字段 = (previous: any, next: any): any => {
    if (!是普通对象(next)) return 深拷贝(next);
    const result = 是普通对象(previous) ? 深拷贝(previous) : {};
    Object.entries(next).forEach(([key, value]) => {
        if (value === undefined) return;
        // 名称字段空值保护：当新值为空或占位名，且旧值有真实名称时，保留旧值
        if (名称保护字段.has(key) && 实质为空文本(value) && !实质为空文本(result[key]) && !是否占位名(result[key])) {
            return; // 保留旧的真实名称，不覆盖
        }
        // 名称字段占位名保护：当新值是占位名但旧值有真实名称时，保留旧值
        if (名称保护字段.has(key) && 是否占位名(value) && !是否占位名(result[key]) && !实质为空文本(result[key])) {
            return; // 保留旧的真实名称，不用占位名覆盖
        }
        // 数组字段合并策略：特定字段追加合并，其他字段直接替换
        if (Array.isArray(value) && Array.isArray(result[key]) && 需要合并的数组字段.has(key)) {
            result[key] = [...result[key], ...深拷贝(value)];
            return;
        }
        if (是普通对象(result[key]) && 是普通对象(value)) {
            result[key] = 深合并保留NPC字段(result[key], value);
            return;
        }
        result[key] = 深拷贝(value);
    });
    return result;
};

export const 合并保留既有NPC列表 = (
    previousList: any[],
    nextList: any[],
    playerName?: string
): { 列表: any[]; 恢复数量: number; 恢复名称: string[]; 合并数量: number; 是否变更: boolean } => {
    const previous = Array.isArray(previousList) ? previousList : [];
    const next = Array.isArray(nextList) ? nextList : [];
    if (previous.length <= 0) return { 列表: next, 恢复数量: 0, 恢复名称: [], 合并数量: 0, 是否变更: false };

    const result = 深拷贝(next);
    const restoredNames: string[] = [];
    let mergedCount = 0;
    const playerNormKey = playerName ? 规范化NPC键(playerName) : '';

    // 预建 ID → index 映射，用于当姓名匹配失败时用 ID 做第二道匹配
    const nextIdMap = new Map<string, number>();
    result.forEach((npc: any, idx: number) => {
        const id = 规范化NPC键(npc?.id || npc?.ID);
        if (id) nextIdMap.set(id, idx);
    });

    previous.forEach((npc, index) => {
        if (!npc || typeof npc !== 'object' || Array.isArray(npc)) return;
        // 跳过与主角同名的NPC，防止主角被NPC化
        if (playerNormKey) {
            const npcKey = 规范化NPC键(npc?.姓名);
            if (npcKey && npcKey === playerNormKey) return;
        }
        // 第一道匹配：用 NPC互相匹配（基于 id + 姓名键列表）
        let existingIndex = result.findIndex((candidate) => NPC互相匹配(npc, candidate));
        // 第二道匹配：用稳定 ID 匹配（当 NPC互相匹配 因为占位名导致姓名不匹配时）
        if (existingIndex < 0) {
            const npcId = 规范化NPC键(npc?.id || npc?.ID);
            if (npcId && nextIdMap.has(npcId)) {
                existingIndex = nextIdMap.get(npcId)!;
            }
        }
        if (existingIndex >= 0) {
            result[existingIndex] = 深合并保留NPC字段(npc, result[existingIndex]);
            mergedCount += 1;
            return;
        }
        const insertIndex = Math.max(0, Math.min(index, result.length));
        result.splice(insertIndex, 0, 深拷贝(npc));
        const label = typeof npc?.姓名 === 'string' && npc.姓名.trim()
            ? npc.姓名.trim()
            : (typeof npc?.id === 'string' ? npc.id.trim() : `社交[${index}]`);
        restoredNames.push(label);
    });

    return {
        列表: result,
        恢复数量: restoredNames.length,
        恢复名称: restoredNames,
        合并数量: mergedCount,
        是否变更: restoredNames.length > 0 || mergedCount > 0
    };
};

const 读取命令动作 = (cmd: any): string => (
    typeof cmd?.action === 'string' && cmd.action.trim()
        ? cmd.action.trim()
        : 'set'
);

const 读取命令路径 = (cmd: any): string => (
    normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '')
);

const 命令路径指向社交整项 = (normalizedKey: string): boolean => (
    /^gameState\.社交(?:$|\[\d+\]$)/.test(normalizedKey)
);

const 命令路径指向社交数组 = (normalizedKey: string): boolean => normalizedKey === 'gameState.社交';

const 命令描述 = (cmd: any): string => {
    const action = 读取命令动作(cmd);
    const key = 读取命令路径(cmd) || String(cmd?.key || '');
    return `${action} ${key}`;
};

export const 检测社交删除风险命令 = (
    commands: TavernCommand[] | any[],
    currentSocial: any[]
): string[] => {
    const social = Array.isArray(currentSocial) ? currentSocial : [];
    if (!Array.isArray(commands) || commands.length <= 0 || social.length <= 0) return [];

    const issues: string[] = [];
    commands.forEach((cmd: any) => {
        const action = 读取命令动作(cmd);
        const normalizedKey = 读取命令路径(cmd);
        if (!normalizedKey.startsWith('gameState.社交')) return;

        if (action === 'delete' && 命令路径指向社交整项(normalizedKey)) {
            issues.push(`${命令描述(cmd)} 会删除既有 NPC`);
            return;
        }

        if (action === 'delete') {
            const slotMatch = normalizedKey.match(/^gameState\.社交\[(\d+)\]$/);
            if (slotMatch) {
                const index = Number(slotMatch[1]);
                const currentNpc = social[index];
                if (currentNpc) {
                    const label = currentNpc?.姓名 || currentNpc?.id || `社交[${index}]`;
                    issues.push(`${命令描述(cmd)} 会删除既有 NPC：${label}`);
                }
            }
            return;
        }

        if (action === 'set' && 命令路径指向社交数组(normalizedKey)) {
            if (!Array.isArray(cmd?.value)) {
                issues.push(`${命令描述(cmd)} 会把社交列表替换为非数组`);
                return;
            }
            const retained = 合并保留既有NPC列表(social, cmd.value);
            if (retained.恢复数量 > 0) {
                issues.push(`${命令描述(cmd)} 缺失既有 NPC：${retained.恢复名称.join('、')}`);
            }
            return;
        }

        const slotMatch = normalizedKey.match(/^gameState\.社交\[(\d+)\]$/);
        if (action === 'set' && slotMatch) {
            const index = Number(slotMatch[1]);
            const currentNpc = social[index];
            if (!currentNpc) return;
            const nextValue = cmd?.value;
            if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
                issues.push(`${命令描述(cmd)} 会清空既有 NPC`);
                return;
            }
            if (!NPC互相匹配(currentNpc, nextValue)) {
                const label = currentNpc?.姓名 || currentNpc?.id || `社交[${index}]`;
                issues.push(`${命令描述(cmd)} 会替换既有 NPC：${label}`);
            }
        }
    });

    return issues;
};

export const 命令存在社交删除风险 = (cmd: TavernCommand | any, currentSocial: any[]): boolean => (
    检测社交删除风险命令([cmd], currentSocial).length > 0
);
