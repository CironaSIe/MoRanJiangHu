import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateImageByPrompt } from '../services/ai/image';
import { isImageBackendRecentlyUnavailable } from '../services/ai/imageBackendRegistry';

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => store.set(key, value)),
        removeItem: vi.fn((key: string) => store.delete(key)),
    };
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('ComfyUI unavailable backend detection', () => {
    it('marks a CNB ComfyUI URL unavailable when /prompt returns the app HTML page', async () => {
        vi.stubGlobal('window', {
            localStorage: createLocalStorageMock(),
            location: {
                protocol: 'https:',
                origin: 'https://msjh.bacon159.pp.ua',
            },
        });
        vi.stubGlobal('fetch', vi.fn(async () => new Response(
            '<!DOCTYPE html><html><head><title>墨色江湖</title></head><body>墨色江湖</body></html>',
            { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
        )));

        await expect(generateImageByPrompt('test item', {
            id: 'test',
            名称: 'ComfyUI test',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://bad-8188.cnb.run',
            apiKey: '',
            model: '',
            图片后端类型: 'comfyui',
            图片接口路径: '/prompt',
            图片响应格式: 'url',
            ComfyUI工作流JSON: '{"1":{"class_type":"CLIPTextEncode","inputs":{"text":"__PROMPT__"}}}',
        } as any)).rejects.toThrow(/HTML|prompt_id|不可用|失效/);

        expect(isImageBackendRecentlyUnavailable('https://bad-8188.cnb.run')).toBe(true);
    });

    it('tries a direct CNB ComfyUI request before falling back to the public proxy in native APK', async () => {
        vi.stubGlobal('window', {
            localStorage: createLocalStorageMock(),
            location: {
                protocol: 'https:',
                origin: 'https://localhost',
            },
            Capacitor: {
                isNativePlatform: () => true,
            },
        });
        const calls: string[] = [];
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            calls.push(url);
            if (url === 'https://live-8188.cnb.run/prompt') {
                throw new TypeError('Failed to fetch');
            }
            if (url.startsWith('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/prompt')) {
                return new Response(JSON.stringify({ prompt_id: 'p1' }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            if (url.startsWith('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/history/p1')) {
                return new Response(JSON.stringify({
                    p1: {
                        status: { status_str: 'success', completed: true },
                        outputs: {
                            save: { images: [{ filename: 'ok.png', subfolder: '', type: 'output' }] },
                        },
                    },
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            throw new Error(`unexpected fetch ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await generateImageByPrompt('test item', {
            id: 'test',
            名称: 'ComfyUI test',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://live-8188.cnb.run',
            apiKey: '',
            model: '',
            图片后端类型: 'comfyui',
            图片接口路径: '/prompt',
            图片响应格式: 'url',
            ComfyUI工作流JSON: '{"1":{"class_type":"CLIPTextEncode","inputs":{"text":"__PROMPT__"}}}',
        } as any);

        expect(result.图片URL).toBe('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/view?filename=ok.png&subfolder=&type=output&url=https%3A%2F%2Flive-8188.cnb.run');
        expect(calls[0]).toBe('https://live-8188.cnb.run/prompt');
        expect(calls[1]).toBe('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/prompt?url=https%3A%2F%2Flive-8188.cnb.run');
        expect(calls[2]).toBe('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/history/p1?url=https%3A%2F%2Flive-8188.cnb.run');
    });
});
