import type { GameResponse, TavernCommand } from '../types';
import { normalizeStateCommandKey } from './stateHelpers';

const 死亡状态字段正则 = /(?:状态|生死状态|生命状态|关系状态|DEBUFF|死亡|死因|死亡原因|死亡描述)$/u;
const 死亡判定词正则 = /死亡|已故|身亡|阵亡|战死|气绝|断气|毙命|亡故|丧命|殒命|死去|死了|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|化为飞灰|尸骨无存|尸体|遗体|残尸/u;
const 死亡状态名称正则 = /^(?:死亡|已死|身亡|阵亡|战死|气绝|断气|毙命|亡故|丧命|殒命|已故)$/u;
const 死亡状态效果正则 = /角色已死亡|气血归零|不能继续作为在场行动角色|已故不可调度|生死状态[^。！？\n\r]{0,8}死亡|生命状态[^。！？\n\r]{0,8}死亡/u;
const 非死亡否定词正则 = /昏死|濒死|重伤|险些身亡|差点死|未死|没有死亡|并未死亡|尚未死亡|假死|失踪|下落不明|状态未知|要死了|爽死了|舒服死了|羞死了|吓死了|笑死了|累死了|疼死了/u;
const 死因字段正则 = /(?:死因|死亡原因|死亡描述|死亡记录|死因说明|生死状态说明)$/u;
const 死因线索正则 = /死因|死亡原因|因.{1,24}(?:死亡|身亡|丧命|毙命|气绝|断气|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|尸骨无存)|(?:被|遭|受).{1,24}(?:杀|杀死|击杀|斩杀|处决|咬伤|感染|毒|刺穿|重创|打到|打成|轰成|轰杀|碾碎|湮灭|毁灭)|中毒|感染|失血|窒息|休克|伤势过重|致命|头部|胸口|胸部|腹部|切口|断口|一分为二|切成两截|断成两截|心脉|经脉尽断|爆炸|坠落|溺水|烧死|冻死|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|化为飞灰|尸骨无存/u;

const 命令值文本 = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
};

const 提取响应文本 = (response: GameResponse | undefined): string => {
    if (!response) return '';
    const logs = Array.isArray((response as any).logs)
        ? (response as any).logs.map((log: any) => [log?.sender, log?.text].filter(Boolean).join('：')).join('\n')
        : '';
    return [
        logs,
        typeof (response as any).content === 'string' ? (response as any).content : '',
        typeof (response as any).text === 'string' ? (response as any).text : '',
        typeof (response as any).rawText === 'string' ? (response as any).rawText : ''
    ].filter(Boolean).join('\n');
};

const 规范化姓名键 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

const 响应明确确认NPC死亡 = (responseText: string, npcName: string): boolean => {
    if (!responseText || !npcName) return false;
    const compact = responseText.replace(/\s+/g, '');
    if (非死亡否定词正则.test(compact)) return false;
    const escapedName = npcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escapedName}.{0,60}(?:死亡|已故|身亡|阵亡|战死|气绝|断气|毙命|亡故|丧命|殒命|死去|死了|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|化为飞灰|尸骨无存|尸体|遗体|残尸|一分为二|切成两截|断成两截|再无(?:气息|生机))|(?:死亡|已故|身亡|阵亡|战死|气绝|断气|毙命|亡故|丧命|殒命|死去|死了|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|化为飞灰|尸骨无存|尸体|遗体|残尸).{0,60}${escapedName}`, 'u').test(compact);
};

const 响应明确给出NPC死因 = (responseText: string, npcName: string): boolean => {
    if (!responseText || !npcName) return false;
    const compact = responseText.replace(/\s+/g, '');
    const nameIndex = compact.indexOf(npcName);
    const scope = nameIndex >= 0
        ? compact.slice(Math.max(0, nameIndex - 80), nameIndex + npcName.length + 120)
        : compact;
    return 死因线索正则.test(scope);
};

const 收集NPC死亡命令状态 = (commands: TavernCommand[]) => {
    const byIndex = new Map<number, {
        death: boolean;
        hpZero: boolean;
        commandCause: boolean;
        deathCommandIndices: Set<number>;
    }>();

    const ensure = (index: number) => {
        const existing = byIndex.get(index);
        if (existing) return existing;
        const next = { death: false, hpZero: false, commandCause: false, deathCommandIndices: new Set<number>() };
        byIndex.set(index, next);
        return next;
    };

    commands.forEach((cmd: any, commandIndex) => {
        const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '').replace(/^gameState\./, '');
        const match = normalizedKey.match(/^社交\[(\d+)\](?:\.(.+))?$/u);
        if (!match) return;
        const index = Number(match[1]);
        if (!Number.isInteger(index) || index < 0) return;
        const field = match[2] || '';
        const valueText = 命令值文本(cmd?.value);
        const state = ensure(index);
        const wholeObject = !field;

        const isHpZero = (field === '当前血量' && Number(cmd?.value) === 0) || (wholeObject && Number(cmd?.value?.当前血量) === 0);
        const isDeath = (死亡状态字段正则.test(field) || wholeObject) && 死亡判定词正则.test(valueText) && !非死亡否定词正则.test(valueText);
        const isCause = (死因字段正则.test(field) || wholeObject) && 死因线索正则.test(valueText) && !非死亡否定词正则.test(valueText);

        if (isHpZero) state.hpZero = true;
        if (isDeath) state.death = true;
        if (isCause) state.commandCause = true;
        if (isHpZero || isDeath || isCause) state.deathCommandIndices.add(commandIndex);
    });

    return byIndex;
};

export const 检测NPC死亡判定风险命令 = (
    commands: TavernCommand[],
    currentSocial: any[],
    response?: GameResponse
): string[] => {
    if (!Array.isArray(commands) || !Array.isArray(currentSocial)) return [];
    const responseText = 提取响应文本(response);
    const byIndex = 收集NPC死亡命令状态(commands);

    const issues: string[] = [];
    byIndex.forEach((state, index) => {
        if (!state.death) return;
        const name = 规范化姓名键(currentSocial[index]?.姓名) || `社交[${index}]`;
        const responseDeath = 响应明确确认NPC死亡(responseText, name);
        const responseCause = 响应明确给出NPC死因(responseText, name);
        if (responseDeath && (state.commandCause || responseCause)) return;
        const missing: string[] = [];
        if (!state.hpZero) missing.push('当前血量归零');
        if (!responseDeath) missing.push('正文明确死亡');
        if (!state.commandCause && !responseCause) missing.push('明确死因');
        if (missing.length > 0) {
            issues.push(`${name} 缺少${missing.join('、')}`);
        }
    });
    return issues;
};

export const 状态效果是死亡判定 = (item: any): boolean => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const 名称 = typeof item?.名称 === 'string' ? item.名称.trim() : '';
    const 效果 = typeof item?.效果 === 'string' ? item.效果.trim() : '';
    return 死亡状态名称正则.test(名称) || 死亡状态效果正则.test(效果);
};

export const 提取NPC死亡风险命令索引 = (
    commands: TavernCommand[],
    currentSocial: any[],
    response?: GameResponse
): Set<number> => {
    if (!Array.isArray(commands) || !Array.isArray(currentSocial)) return new Set();
    const responseText = 提取响应文本(response);
    const risky = new Set<number>();
    const byIndex = 收集NPC死亡命令状态(commands);

    byIndex.forEach((state, index) => {
        if (!state.death) return;
        const name = 规范化姓名键(currentSocial[index]?.姓名) || `社交[${index}]`;
        const hasEnoughEvidence = 响应明确确认NPC死亡(responseText, name)
            && (state.commandCause || 响应明确给出NPC死因(responseText, name));
        if (hasEnoughEvidence) return;
        state.deathCommandIndices.forEach((commandIndex) => risky.add(commandIndex));
    });

    return risky;
};
