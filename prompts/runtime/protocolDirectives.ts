import type { 提示词结构 } from '../../types';
import { 核心_输出格式 } from '../core/format';
import { 核心_行动选项规范 } from '../core/actionOptions';

const 获取提示词内容 = (promptPool: 提示词结构[], id: string): string => {
    const hit = promptPool.find((item) => item.id === id);
    return typeof hit?.内容 === 'string' ? hit.内容.trim() : '';
};

export const 获取输出协议提示词 = (promptPool: 提示词结构[]): string => {
    return 获取提示词内容(promptPool, 'core_format')
        || (typeof 核心_输出格式?.内容 === 'string' ? 核心_输出格式.内容.trim() : '');
};

export const 获取行动选项提示词 = (
    promptPool: 提示词结构[],
    enabled: boolean
): string => {
    if (!enabled) return '';
    return 获取提示词内容(promptPool, 'core_action_options')
        || (typeof 核心_行动选项规范?.内容 === 'string' ? 核心_行动选项规范.内容.trim() : '');
};

export const 构建字数要求提示词 = (minLength: number): string => {
    const safeValue = Number.isFinite(minLength) ? Math.max(50, Math.floor(minLength)) : 450;
    return [
        '<字数>',
        `本次输出的<正文>标签内正文是硬性最低字数要求，必须达到${safeValue}字以上。`,
        '若上下文、模型习惯或旧提示里出现“1000字左右”“简洁输出”“摘要”等限制，一律以本条为准。',
        '不得用总结、提纲、列表或省略号替代正文扩写；正文不足时继续补足环境、动作、心理、对话、NPC反应与事件承接，直到达到最低字数。',
        '</字数>'
    ].join('\n');
};

export const 构建免责声明输出要求提示词 = (): string => {
    return [
        '请在回合末尾输出 <disclaimer>...</disclaimer> 标签。',
        '免责声明放在 <剧情规划> 之后；若本回合无 <剧情规划> 但有 <变量规划>，则放在 <变量规划> 之后；若两者都无，则放在 <短期记忆> 之后，并保持 <正文> 内容连续。'
    ].join('\n');
};
