import { describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestHead } from '../functions/api/preset-image/[[path]]';

const env = {
    MORAN_OSS_ENDPOINT: 'https://s3.hi168.com',
    MORAN_OSS_BUCKET: 'preset-bucket',
    MORAN_OSS_ACCESS_KEY: 'access-key',
    MORAN_OSS_SECRET_KEY: 'secret-key',
    MORAN_OSS_REGION: 'auto'
};

describe('preset image proxy', () => {
    it('fetches preset images from signed object storage keys', async () => {
        const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
        const fetchMock = vi.fn(async () => new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Length': String(bytes.length),
                ETag: '"abc"'
            }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/s3_1780319017390_91d7u9.jpg'),
            env,
            params: { path: 's3_1780319017390_91d7u9.jpg' },
            waitUntil: vi.fn()
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/jpeg');
        expect(response.headers.get('Cache-Control')).toContain('immutable');
        expect(response.headers.get('X-Moran-Preset-Image-Cache')).toBe('miss');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const signedUrl = new URL(fetchMock.mock.calls[0][0] as string);
        expect(signedUrl.origin).toBe('https://s3.hi168.com');
        expect(signedUrl.pathname).toBe('/preset-bucket/s3_1780319017390_91d7u9.jpg');
        expect(signedUrl.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    });

    it('rejects non preset-image keys', async () => {
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/../../secret.txt'),
            env,
            params: { path: '../../secret.txt' }
        });

        expect(response.status).toBe(502);
        expect(await response.text()).toContain('Preset image key is invalid');
    });

    it('supports HEAD without a response body', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(null, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': '123'
            }
        })));

        const response = await onRequestHead({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/s3_1780320519169_b6pg5i.png'),
            env,
            params: { path: 's3_1780320519169_b6pg5i.png' }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Length')).toBe('123');
        expect(await response.text()).toBe('');
    });
});
