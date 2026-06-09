import { describe, expect, it } from 'vitest';
import { 恢复原文疑似带结构标签, 最新AI消息可继续变量生成 } from '../utils/chatRecovery';

describe('聊天失败恢复工具', () => {
    it('只有最新 AI 回合带结构化结果或原始响应时才允许继续变量生成', () => {
        expect(最新AI消息可继续变量生成([
            { role: 'user', content: '继续' } as any,
            { role: 'assistant', content: '流式草稿', rawJson: '' } as any
        ])).toBe(false);

        expect(最新AI消息可继续变量生成([
            { role: 'user', content: '继续' } as any,
            { role: 'assistant', content: 'Structured Response', structuredResponse: { logs: [] } } as any
        ])).toBe(true);

        expect(最新AI消息可继续变量生成([
            { role: 'assistant', content: '已完成', rawJson: '<正文>正文</正文><短期记忆>无</短期记忆>' } as any,
            { role: 'system', content: '[系统提示]: 后台阶段失败' } as any
        ])).toBe(true);
    });

    it('能识别是否像可手动补全后恢复的标签原文', () => {
        expect(恢复原文疑似带结构标签('<正文>一段正文</正文><短期记忆>无</短期记忆>')).toBe(true);
        expect(恢复原文疑似带结构标签('<thinking>思考</thinking>\n<正文>正文')).toBe(true);
        expect(恢复原文疑似带结构标签('【旁白】只有一段普通草稿')).toBe(false);
        expect(恢复原文疑似带结构标签('')).toBe(false);
    });
});
