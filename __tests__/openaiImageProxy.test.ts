import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../functions/api/image-backend/openai-image-proxy/[[path]]';

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
});
