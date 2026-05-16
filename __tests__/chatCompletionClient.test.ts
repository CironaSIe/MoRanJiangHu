import { describe, expect, it } from 'vitest';
import { 应用Claude兼容末尾User修正, type 通用消息 } from '../services/ai/chatCompletionClient';
import type { 当前可用接口结构 } from '../utils/apiConfig';

const baseConfig: 当前可用接口结构 = {
    id: 'test',
    名称: 'test',
    供应商: 'openai_compatible',
    协议覆盖: 'auto',
    baseUrl: 'https://example.com/v1',
    apiKey: 'test-key',
    model: 'test-model'
};

describe('chatCompletionClient Claude compatible message normalization', () => {
    it('appends a user turn when Claude-like models end with assistant COT pseudo history', () => {
        const messages: 通用消息[] = [
            { role: 'system', content: '规则' },
            { role: 'assistant', content: '<think>好的思考结束</think>' }
        ];

        const normalized = 应用Claude兼容末尾User修正(messages, {
            ...baseConfig,
            model: 'claude-opus-4.6'
        });

        expect(normalized).toHaveLength(3);
        expect(normalized.at(-1)?.role).toBe('user');
        expect(normalized.at(-1)?.content).toContain('继续执行');
    });

    it('leaves normal OpenAI-compatible messages unchanged', () => {
        const messages: 通用消息[] = [
            { role: 'system', content: '规则' },
            { role: 'assistant', content: '<think>好的思考结束</think>' }
        ];

        const normalized = 应用Claude兼容末尾User修正(messages, {
            ...baseConfig,
            model: 'gpt-4.1'
        });

        expect(normalized).toBe(messages);
    });
});
