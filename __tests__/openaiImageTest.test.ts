import { describe, expect, it, vi } from 'vitest';
import { 测试OpenAI兼容图片接口 } from '../services/ai/openaiImageTest';

describe('OpenAI-compatible image test generation', () => {
    it('submits a real GPT image prompt without forcing response_format and returns a preview image', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            data: [{ b64_json: 'iVBORw0KGgo=' }]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await 测试OpenAI兼容图片接口({
            rawBaseUrl: 'https://cdn.moe-atelier.site',
            apiKey: 'sk-test',
            model: 'gpt-image-2',
            path: '/v1/images/generations',
            label: 'OpenAI 兼容文生图接口',
            setTimeoutFn: ((handler: TimerHandler) => {
                void handler;
                return 1 as any;
            }) as any,
            clearTimeoutFn: (() => undefined) as any
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
        expect(requestBody).toMatchObject({
            model: 'gpt-image-2',
            n: 1,
            size: '1024x1024'
        });
        expect(requestBody.prompt).toContain('plain connection test image');
        expect(requestBody).not.toHaveProperty('response_format');
        expect(result.message).toContain('真实生图测试成功');
        expect(result.previewUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
    });

    it('forces GPT image test requests away from chat completions', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            data: [{ url: 'https://cdn.example.test/image.png' }]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        await 测试OpenAI兼容图片接口({
            rawBaseUrl: 'https://cdn.moe-atelier.site',
            apiKey: 'sk-test',
            model: 'gpt-image-2',
            path: '/v1/chat/completions',
            label: 'OpenAI 兼容文生图接口',
            setTimeoutFn: (() => 1 as any) as any,
            clearTimeoutFn: (() => undefined) as any
        });

        const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
        expect(requestedUrl.pathname).toBe('/api/image-backend/openai-image-proxy/v1/images/generations');
        expect(requestedUrl.searchParams.get('url')).toBe('https://cdn.moe-atelier.site');
        expect(requestedUrl.toString()).not.toContain('chat/completions');
    });
});
