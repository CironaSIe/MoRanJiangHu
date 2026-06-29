import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../functions/api/image-backend/openai-image-proxy/[[path]]';
import { onRequestGet } from '../functions/api/image-backend/fetch-image';

describe('OpenAI image runtime proxy', () => {
    it('does not duplicate /v1 when the target base already includes /v1', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequest({
            request: new Request('https://msjh.example/api/image-backend/openai-image-proxy/v1/images/generations?url=https%3A%2F%2Fcdn.moe-atelier.site%2Fv1', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer sk-test',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: 'gpt-image-2', prompt: 'test' })
            }),
            params: { path: ['v1', 'images', 'generations'] }
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://cdn.moe-atelier.site/v1/images/generations');
    });

    it('proxies APIMart async image task polling requests', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            code: 200,
            data: {
                status: 'completed',
                result: {
                    images: ['https://getapib.org/image/generated-ok.png']
                }
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequest({
            request: new Request('https://msjh.example/api/image-backend/openai-image-proxy/v1/tasks/task_apimart_123?url=https%3A%2F%2Fapi.apimart.ai%2Fv1', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer sk-test',
                    Accept: 'application/json'
                }
            }),
            params: { path: ['v1', 'tasks', 'task_apimart_123'] }
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.apimart.ai/v1/tasks/task_apimart_123');
        expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
    });
});

describe('image backend temporary image fetch proxy', () => {
    it('downloads public HTTP temporary image URLs and returns image bytes', async () => {
        const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const fetchMock = vi.fn(async () => new Response(imageBytes, {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.example/api/image-backend/fetch-image?url=http%3A%2F%2F70.39.197.55%3A3000%2Fgenerated%2Ftest.png')
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('http://70.39.197.55:3000/generated/test.png');
    });

    it('rejects private network temporary image URLs', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.example/api/image-backend/fetch-image?url=http%3A%2F%2F127.0.0.1%3A3000%2Fgenerated%2Ftest.png')
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
