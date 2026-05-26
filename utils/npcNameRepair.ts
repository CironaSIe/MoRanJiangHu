import { 姓名含已知中文姓氏 } from './chineseName';
import {
    判断女性名称目标,
    判断女性姓名来自姓名库,
    判断模板化女性姓名
} from './femaleNameSelector';

const 规范化姓名 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

const 不可恢复姓名正则 = /^(?:角色|同门|随行者|新NPC|未命名NPC|未命名|未知|无名|女子|少女|女修|姑娘|侍女|丫鬟|路人|某人|她|他|你|我)\d*$/;

const 看起来像真实姓名 = (value: unknown): boolean => {
    const name = 规范化姓名(value);
    if (!name || 不可恢复姓名正则.test(name)) return false;
    if (!/^[\u4e00-\u9fa5]{2,6}$/u.test(name)) return false;
    return 姓名含已知中文姓氏(name) || 判断模板化女性姓名(name);
};

const 构建姓名证据文本 = (npc: any): string => {
    if (!npc || typeof npc !== 'object') return '';
    const { 姓名, 名称, name, 曾用名, ...rest } = npc;
    void 姓名;
    void 名称;
    void name;
    void 曾用名;
    try {
        return JSON.stringify(rest);
    } catch {
        return '';
    }
};

const 选择可恢复原名 = (npc: any, currentName: string): string => {
    const aliases = Array.isArray(npc?.曾用名) ? npc.曾用名 : [];
    const evidenceText = 构建姓名证据文本(npc);
    for (const alias of aliases) {
        const candidate = 规范化姓名(alias);
        if (!candidate || candidate === currentName) continue;
        if (!看起来像真实姓名(candidate)) continue;
        if (evidenceText.includes(candidate) || 姓名含已知中文姓氏(candidate) || 判断模板化女性姓名(candidate)) {
            return candidate;
        }
    }
    return '';
};

export interface 旧姓名库修复结果 {
    列表: any[];
    已修复数量: number;
}

export const 修复旧姓名库误改NPC姓名列表 = (list: any[]): 旧姓名库修复结果 => {
    if (!Array.isArray(list) || list.length === 0) {
        return { 列表: Array.isArray(list) ? list : [], 已修复数量: 0 };
    }

    let changed = false;
    let repairedCount = 0;
    const repairedList = list.map((npc) => {
        if (!npc || typeof npc !== 'object') return npc;
        if (!判断女性名称目标(npc)) return npc;

        const currentName = 规范化姓名(npc.姓名 ?? npc.名称 ?? npc.name);
        if (!currentName || !判断女性姓名来自姓名库(currentName)) return npc;

        const restoredName = 选择可恢复原名(npc, currentName);
        if (!restoredName) return npc;

        const aliases = Array.isArray(npc.曾用名) ? npc.曾用名.map(规范化姓名).filter(Boolean) : [];
        const nextAliases = Array.from(new Set([
            ...aliases.filter((alias) => alias !== restoredName),
            currentName
        ]));

        changed = true;
        repairedCount += 1;
        return {
            ...npc,
            姓名: restoredName,
            曾用名: nextAliases.length > 0 ? nextAliases : undefined
        };
    });

    return {
        列表: changed ? repairedList : list,
        已修复数量: repairedCount
    };
};
