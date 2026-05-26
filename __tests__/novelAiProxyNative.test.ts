import { afterEach, describe, expect, it, vi } from 'vitest';
import { __测试__构建图片端点 } from '../services/ai/imageTasks';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('NovelAI proxy endpoint selection', () => {
    it('uses the remote website proxy when running inside the APK localhost shell', () => {
        vi.stubGlobal('window', {
            Capacitor: {
                isNativePlatform: () => true,
                getPlatform: () => 'android'
            },
            location: {
                protocol: 'https:',
                hostname: 'localhost',
                origin: 'https://localhost'
            }
        });

        const endpoint = __测试__构建图片端点('https://image.novelai.net', '/ai/generate-image');
        expect(endpoint).toMatch(/^https:\/\/.+\/api\/novelai\/ai\/generate-image$/);
        expect(endpoint).not.toContain('localhost');
    });

    it('keeps the relative proxy path for local web development', () => {
        vi.stubGlobal('window', {
            location: {
                protocol: 'http:',
                hostname: '127.0.0.1',
                origin: 'http://127.0.0.1:4173'
            }
        });

        expect(__测试__构建图片端点('https://image.novelai.net', '/ai/generate-image'))
            .toBe('/api/novelai/ai/generate-image');
    });
});
