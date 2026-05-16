import { describe, expect, it, vi } from 'vitest';
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
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][1]?.body).toBe(body);
    });
});
