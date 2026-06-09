import type { 聊天记录结构 } from '../types';

export const 获取最新AI消息 = (history: 聊天记录结构[] | undefined | null): 聊天记录结构 | null => {
    const source = Array.isArray(history) ? history : [];
    for (let index = source.length - 1; index >= 0; index -= 1) {
        const item = source[index];
        if (item?.role === 'assistant') return item;
    }
    return null;
};

export const 最新AI消息可继续变量生成 = (history: 聊天记录结构[] | undefined | null): boolean => {
    const latestAssistant = 获取最新AI消息(history);
    if (!latestAssistant) return false;
    if (latestAssistant.structuredResponse) return true;
    return typeof latestAssistant.rawJson === 'string' && latestAssistant.rawJson.trim().length > 0;
};

export const 恢复原文疑似带结构标签 = (rawText: string | undefined | null): boolean => (
    /<\s*(?:thinking|think|正文|短期记忆|命令|行动选项|judge)(?:\s|>)/i.test(String(rawText || ''))
);
