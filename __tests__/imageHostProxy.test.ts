import { describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../functions/api/image-host/download';
import { onRequestPost } from '../functions/api/image-host/upload';

describe('image host proxy', () => {
    it('streams upload bodies to the upstream image host', async () => {
        const body = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]));
                controller.close();
            }
        });
        const request = new Request('https://msjh.bacon159.pp.ua/api/image-host/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=test'
            },
            body,
            duplex: 'half'
        } as RequestInit);
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestPost({
            request,
            env: {
                IMAGE_HOST_TOKEN: 'token',
                IMAGE_HOST_BASE: 'https://image.bacon159.pp.ua'
            }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('X-Moran-Image-Proxy-Request-Id')).toMatch(/^imgup_/);
        expect(response.headers.get('X-Moran-Image-Upstream-Status')).toBe('200');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://image1.bacon159.pp.ua/api/v1/upload?storage=telegram');
        expect(fetchMock.mock.calls[0][1]?.body).toBeInstanceOf(ArrayBuffer);
        expect(new Uint8Array(fetchMock.mock.calls[0][1]?.body as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('returns diagnostic details when upstream upload fails', async () => {
        const request = new Request('https://msjh.bacon159.pp.ua/api/image-host/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=test',
                'Content-Length': '12345'
            },
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    controller.close();
                }
            }),
            duplex: 'half'
        } as RequestInit);
        vi.stubGlobal('fetch', vi.fn(async () => new Response('error code: 1102', { status: 500, statusText: 'Internal Error' })));

        const response = await onRequestPost({
            request,
            env: {
                IMAGE_HOST_TOKEN: 'token',
                IMAGE_HOST_BASE: 'https://image.bacon159.pp.ua'
            }
        });
        const payload = await response.json() as any;

        expect(response.status).toBe(500);
        expect(payload.error).toContain('1102');
        expect(payload.requestId).toMatch(/^imgup_/);
        expect(payload.upstreamStatus).toBe(500);
        expect(payload.contentLength).toBe('12345');
    });

    it('falls back from authenticated api file urls to public file urls', async () => {
        const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const fetchMock = vi.fn(async (url: string) => {
            if (url.includes('/api/v1/file/abc123')) {
                return new Response('Image download failed: 503', { status: 503 });
            }
            return new Response(imageBytes, {
                status: 200,
                headers: { 'Content-Type': 'image/png' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/image-host/download?url=https%3A%2F%2Fimage.bacon159.pp.ua%2Fapi%2Fv1%2Ffile%2Fabc123'),
            env: {
                IMAGE_HOST_TOKEN: 'token',
                IMAGE_HOST_BASE: 'https://image.bacon159.pp.ua'
            }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchMock.mock.calls[0][0]).toBe('https://image1.bacon159.pp.ua/api/v1/file/abc123');
        expect(fetchMock.mock.calls[1][0]).toBe('https://image1.bacon159.pp.ua/api/v1/file/abc123');
        expect(fetchMock.mock.calls[2][0]).toBe('https://image1.bacon159.pp.ua/api/v1/file/abc123');
        expect(fetchMock.mock.calls[3][0]).toBe('https://image1.bacon159.pp.ua/file/abc123');
    });
});
