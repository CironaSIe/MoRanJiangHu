import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateImageByPrompt, persistImageAssetLocally, __测试__重置远程图片限流器 } from '../services/ai/image';
import { 默认画师串预设列表 } from '../utils/apiConfig';

vi.mock('../services/dbService', () => ({
    保存图片资源: vi.fn(async () => 'wuxia-asset://saved-image')
}));

afterEach(() => {
    __测试__重置远程图片限流器();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('Grok2Api image generation compatibility', () => {
    it('keeps GPT Image 2 default negative presets free of moderation-triggering NSFW words', () => {
        const gptImagePresets = 默认画师串预设列表.filter((preset) => preset.id.startsWith('gpt_image2_'));
        expect(gptImagePresets.length).toBeGreaterThan(0);

        for (const preset of gptImagePresets) {
            expect(preset.负面提示词).not.toMatch(/\b(?:nsfw|nude|naked|explicit|sexualized|fetish)\b/i);
        }
    });

    it('requests base64 response_format for GPT image providers to avoid temporary image links', async () => {
        let requestBody: any = null;
        vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { url: 'https://image.example/gpt-result.png' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }));

        const result = await generateImageByPrompt('测试 GPT 图片模型', {
            id: 'gpt-image',
            名称: 'GPT Image',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://image.example',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any);

        expect(requestBody.response_format).toBe('b64_json');
        expect(requestBody.moderation).toBe('auto');
        expect(result.图片URL).toBe('https://image.example/gpt-result.png');
    });

    it('does not send unsupported response_format to the official GPT image endpoint', async () => {
        let requestBody: any = null;
        vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { b64_json: 'aGVsbG8=' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }));

        const result = await generateImageByPrompt('测试官方 GPT 图片模型', {
            id: 'official-gpt-image',
            名称: 'Official GPT Image',
            供应商: 'openai',
            协议覆盖: 'auto',
            baseUrl: 'https://api.openai.com',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any);

        expect(requestBody).not.toHaveProperty('response_format');
        expect(requestBody.moderation).toBe('auto');
        expect(result.图片URL).toBe('data:image/png;base64,aGVsbG8=');
    });

    it('does not send NSFW words in non-NSFW GPT image prompts even when user presets contain them', async () => {
        let requestBody: any = null;
        vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { url: 'https://image.example/gpt-result.png' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }));

        await generateImageByPrompt('peaceful bamboo courtyard, nude nsfw text should be stripped', {
            id: 'gpt-image',
            名称: 'GPT Image',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://image.example',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any, undefined, {
            构图: '场景',
            附加负面提示词: 'nsfw, nude, explicit, sexualized, fetish, watermark'
        });

        expect(requestBody.prompt).toContain('peaceful bamboo courtyard');
        expect(requestBody.prompt).not.toContain('Negative prompt:');
        expect(requestBody.prompt).not.toContain('watermark');
        expect(requestBody.prompt).not.toMatch(/\b(?:nsfw|nude|naked|explicit|sexualized|fetish)\b/i);
    });

    it('prefers base64 data when an image response also contains a temporary URL', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: [
                {
                    url: 'http://temporary.example/generated.png',
                    b64_json: 'aGVsbG8='
                }
            ]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        })));

        const result = await generateImageByPrompt('测试双格式返回', {
            id: 'gpt-image',
            名称: 'GPT Image',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://image.example',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any);

        expect(result.图片URL).toBe('data:image/png;base64,aGVsbG8=');
    });

    it('polls APIMart asynchronous image tasks and returns the completed image URL', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            const parsedUrl = new URL(url);
            if (parsedUrl.pathname.endsWith('/v1/images/generations')) {
                return new Response(JSON.stringify({
                    code: 200,
                    data: [
                        {
                            status: 'pending',
                            task_id: 'task_apimart_123'
                        }
                    ]
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                });
            }
            if (parsedUrl.pathname.endsWith('/v1/tasks/task_apimart_123')) {
                return new Response(JSON.stringify({
                    code: 200,
                    data: {
                        id: 'task_apimart_123',
                        status: 'completed',
                        result: {
                            images: [
                                {
                                    url: [
                                        'https://getapib.org/image/generated-ok.png'
                                    ]
                                }
                            ]
                        }
                    }
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                });
            }
            throw new Error(`unexpected fetch ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await generateImageByPrompt('测试 APIMart 异步图片任务', {
            id: 'apimart-gpt-image',
            名称: 'APIMart GPT Image',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://api.apimart.ai/v1',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any);

        expect(result.图片URL).toBe('https://getapib.org/image/generated-ok.png');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('downloads HTTP temporary image links through the same-origin image backend proxy before saving', async () => {
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            const requestedUrl = new URL(url, 'https://msjh.example');
            expect(requestedUrl.pathname).toBe('/api/image-backend/fetch-image');
            expect(requestedUrl.searchParams.get('url')).toBe('http://70.39.197.55:3000/generated/test.png');
            return new Response(pngBytes, {
                status: 200,
                headers: { 'content-type': 'image/png' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await persistImageAssetLocally({
            图片URL: 'http://70.39.197.55:3000/generated/test.png'
        });

        expect(result.本地路径).toBe('wuxia-asset://saved-image');
        expect(result.图片URL).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('downloads local ComfyUI HTTP image links directly instead of sending them to the public proxy', async () => {
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            expect(url).toBe('http://127.0.0.1:8188/view?filename=ok.png&type=output');
            return new Response(pngBytes, {
                status: 200,
                headers: { 'content-type': 'image/png' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await persistImageAssetLocally({
            图片URL: 'http://127.0.0.1:8188/view?filename=ok.png&type=output'
        });

        expect(result.本地路径).toBe('wuxia-asset://saved-image');
        expect(result.图片URL).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects text error payloads from temporary image links instead of saving blank images', async () => {
        const fetchMock = vi.fn(async () => new Response('file not found, The resource is valid for 2 hours', {
            status: 200,
            headers: { 'content-type': 'text/plain' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(persistImageAssetLocally({
            图片URL: 'https://img.fjk.qzz.io/v1/images/retrieve/expired.png'
        })).rejects.toThrow(/不是有效图片|临时图片地址已失效|text\/plain/i);
    });

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
