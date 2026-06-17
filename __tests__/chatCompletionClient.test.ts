import { afterEach, describe, expect, it, vi } from 'vitest';
import { 应用Claude兼容末尾User修正, 请求模型文本, 是否流式连接中断错误消息, 规范化流式连接错误提示, 规范化请求模型名称, type 通用消息 } from '../services/ai/chatCompletionClient';
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
    afterEach(() => {
        vi.restoreAllMocks();
    });

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

    it('uses the Qianfan Coding chat completions path without inserting /v1', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{ message: { content: 'pong' } }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        const result = await 请求模型文本({
            ...baseConfig,
            baseUrl: 'https://qianfan.baidubce.com/v2/coding',
            model: 'deepseek-v3.2'
        }, [{ role: 'user', content: 'ping' }], {
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(result).toBe('pong');
        expect(fetchMock).toHaveBeenCalled();
        expect(String(fetchMock.mock.calls[0][0])).toBe('https://qianfan.baidubce.com/v2/coding/chat/completions');
    });

    it('strips Chinese display suffixes from OpenAI-compatible model ids before sending requests', async () => {
        expect(规范化请求模型名称('gemini-3.1-pro-high-search-真流-[星星公益站-CLI渠道]'))
            .toBe('gemini-3.1-pro-high-search');
        expect(规范化请求模型名称('deepseek-v3.2（公益渠道）')).toBe('deepseek-v3.2');

        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{ message: { content: 'pong' } }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        await 请求模型文本({
            ...baseConfig,
            model: 'gemini-3.1-pro-high-search-真流-[星星公益站-CLI渠道]'
        }, [{ role: 'user', content: 'ping' }], {
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        const requestBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
        expect(requestBody.model).toBe('gemini-3.1-pro-high-search');
    });

    it('uses Xiaomi MiMo headers and max_completion_tokens while ignoring reasoning_content', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{
                message: {
                    reasoning_content: '内部推理不应进入正文',
                    content: '小米正文正常返回'
                }
            }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        const result = await 请求模型文本({
            ...baseConfig,
            供应商: 'mimo_api',
            baseUrl: 'https://api.xiaomimimo.com/v1',
            apiKey: 'sk-mimo-test',
            model: 'mimo-v2.5-pro',
            maxTokens: 4096
        }, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(result).toBe('小米正文正常返回');
        expect(fetchMock).toHaveBeenCalled();
        expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.xiaomimimo.com/v1/chat/completions');

        const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;
        const headers = requestOptions.headers as Record<string, string>;
        expect(headers['api-key']).toBe('sk-mimo-test');
        expect(headers.Authorization).toBeUndefined();

        const requestBody = JSON.parse(String(requestOptions.body));
        expect(requestBody.max_completion_tokens).toBe(4096);
        expect(requestBody.max_tokens).toBeUndefined();
        expect(requestBody.temperature).toBe(1.0);
        expect(requestBody.top_p).toBe(0.95);
        expect(requestBody.thinking).toEqual({ type: 'disabled' });
    });

    it('allows Xiaomi MiMo top_p and temperature to follow player overrides within official ranges', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{
                message: {
                    content: '自定义超参正文'
                }
            }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        await 请求模型文本({
            ...baseConfig,
            供应商: 'mimo_token_plan',
            baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
            apiKey: 'tp-mimo-test',
            model: 'mimo-v2.5-pro',
            temperature: 1.8,
            topP: 0.72
        }, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        const requestBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
        expect(requestBody.temperature).toBe(1.5);
        expect(requestBody.top_p).toBe(0.72);
    });

    it('keeps Xiaomi MiMo two-turn chat history usable without leaking reasoning content', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify({
                choices: [{
                    message: {
                        reasoning_content: '第一回合思考',
                        content: '第一回合正文'
                    }
                }]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                choices: [{
                    message: {
                        reasoning_content: '第二回合思考',
                        content: '第二回合正文'
                    }
                }]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }));

        const mimoConfig: 当前可用接口结构 = {
            ...baseConfig,
            供应商: 'mimo_token_plan',
            baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
            apiKey: 'tp-mimo-test',
            model: 'mimo-v2.5-pro'
        };

        const first = await 请求模型文本(mimoConfig, [{ role: 'user', content: '第一回合' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });
        const second = await 请求模型文本(mimoConfig, [
            { role: 'user', content: '第一回合' },
            { role: 'assistant', content: first },
            { role: 'user', content: '第二回合' }
        ], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(first).toBe('第一回合正文');
        expect(second).toBe('第二回合正文');
        expect(first).not.toContain('思考');
        expect(second).not.toContain('思考');
        expect(fetchMock).toHaveBeenCalledTimes(2);

        const secondBody = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
        expect(secondBody.messages).toEqual([
            { role: 'user', content: '第一回合' },
            { role: 'assistant', content: '第一回合正文' },
            { role: 'user', content: '第二回合' }
        ]);
    });

    it('routes Gemini Deep Research models through the Interactions API', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify({
                id: 'interaction-123',
                status: 'in_progress'
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                id: 'interaction-123',
                status: 'completed',
                output_text: 'research-ok'
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }));

        const result = await 请求模型文本({
            ...baseConfig,
            供应商: 'gemini',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            model: 'models/deep-research-pro-preview-12-2025'
        }, [
            { role: 'system', content: '规则' },
            { role: 'user', content: '研究一下测试主题' }
        ], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(result).toBe('research-ok');
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[0][0])).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
        expect(String(fetchMock.mock.calls[1][0])).toBe('https://generativelanguage.googleapis.com/v1beta/interactions/interaction-123');

        const createOptions = fetchMock.mock.calls[0][1] as RequestInit;
        expect((createOptions.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
        expect((createOptions.headers as Record<string, string>)['Api-Revision']).toBe('2026-05-20');

        const requestBody = JSON.parse(String(createOptions.body));
        expect(requestBody.agent).toBe('deep-research-pro-preview-12-2025');
        expect(requestBody.input).toContain('【系统规则】');
        expect(requestBody.input).toContain('研究一下测试主题');
        expect(requestBody.agent_config.type).toBe('deep-research');
        expect(requestBody.background).toBe(true);
        expect(requestBody.store).toBe(true);
    });

    it('treats Android OkHttp stream truncation as a retryable transport error', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockRejectedValueOnce(new Error('unexpected end of stream on com.android.okhttp.Address@4ea9fa8e'))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                choices: [{ message: { content: 'retried-ok' } }]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }));

        const result = await 请求模型文本(baseConfig, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(result).toBe('retried-ok');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('normalizes Android stream truncation into a user-readable message', () => {
        const raw = 'unexpected end of stream on com.android.okhttp.Address@4ea9fa8e';

        expect(是否流式连接中断错误消息(raw)).toBe(true);
        expect(规范化流式连接错误提示(raw)).toContain('模型流式连接中途断开');
        expect(规范化流式连接错误提示(raw)).not.toContain('com.android.okhttp.Address');
    });
});
