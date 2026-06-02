import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateImageByPrompt } from '../services/ai/image';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('Grok2Api image generation compatibility', () => {
    it('sends OpenAI-compatible image payload fields accepted by Grok2Api', async () => {
        let requestedUrl = '';
        let requestBody: any = null;
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            requestedUrl = String(input);
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { url: 'https://image.example/grok-result.png' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await generateImageByPrompt('一只在太空漂浮的猫', {
            id: 'grok2api',
            名称: 'Grok2Api',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'http://localhost:8000',
            apiKey: 'test-key',
            model: 'grok-imagine-image',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any, undefined, {
            尺寸: '1792x1024'
        });

        expect(requestedUrl).toBe('http://localhost:8000/v1/images/generations');
        expect(requestBody).toMatchObject({
            model: 'grok-imagine-image',
            n: 1,
            size: '1792x1024',
            response_format: 'url'
        });
        expect(requestBody.prompt).toContain('一只在太空漂浮的猫');
        expect(result.图片URL).toBe('https://image.example/grok-result.png');
    });

    it('parses Grok2Api base64 response_format aliases into data URLs', async () => {
        let requestBody: any = null;
        vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { base64: 'aGVsbG8=' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }));

        const result = await generateImageByPrompt('测试 base64 返回', {
            id: 'grok2api',
            名称: 'Grok2Api',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'http://localhost:8000',
            apiKey: 'test-key',
            model: 'grok-imagine-image',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'base64'
        } as any);

        expect(requestBody.response_format).toBe('base64');
        expect(result.图片URL).toBe('data:image/png;base64,aGVsbG8=');
    });
});
