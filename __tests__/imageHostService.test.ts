import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildImageHostProxyUrl, 上传DataUrl到图床 } from '../services/imageHostService';

describe('imageHostService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('builds a stable file url when upload response only returns a file id', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            success: true,
            file: {
                id: 'abc 123',
                size: 12,
                storage: 'telegram'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })));

        const result = await 上传DataUrl到图床('data:image/png;base64,aGVsbG8=');

        expect(result).toMatchObject({
            url: 'https://image.bacon159.pp.ua/api/v1/file/abc%20123',
            id: 'abc 123',
            size: 12,
            storage: 'telegram'
        });
    });

    it('uses the deployed proxy when running inside a native app origin', () => {
        const originalWindow = globalThis.window;
        vi.stubGlobal('window', {
            location: {
                protocol: 'capacitor:',
                hostname: 'localhost'
            }
        });

        expect(buildImageHostProxyUrl('/api/image-host/upload')).toBe('https://msjh.bacon159.pp.ua/api/image-host/upload');

        vi.stubGlobal('window', originalWindow);
    });

    it('keeps same-origin proxy paths on web origins', () => {
        const originalWindow = globalThis.window;
        vi.stubGlobal('window', {
            location: {
                protocol: 'https:',
                hostname: 'msjh.bacon159.pp.ua'
            }
        });

        expect(buildImageHostProxyUrl('/api/image-host/upload')).toMatch(/^(https:\/\/msjh\.bacon159\.pp\.ua)?\/api\/image-host\/upload$/);

        vi.stubGlobal('window', originalWindow);
    });
});
