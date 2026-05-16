const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const DEFAULT_IMAGE_HOST_BASE = 'https://image.bacon159.pp.ua';

const buildJsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS
        }
    })
);

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
    try {
        const contentType = request.headers.get('Content-Type') || request.headers.get('content-type') || '';
        if (!/^multipart\/form-data\b/i.test(contentType)) {
            return buildJsonResponse({ success: false, error: '请求必须使用 multipart/form-data 格式' }, 400);
        }

        const token = typeof env?.IMAGE_HOST_TOKEN === 'string' ? env.IMAGE_HOST_TOKEN.trim() : '';
        if (!token) {
            return buildJsonResponse({ success: false, error: 'IMAGE_HOST_TOKEN is not configured' }, 503);
        }

        const base = (typeof env?.IMAGE_HOST_BASE === 'string' && env.IMAGE_HOST_BASE.trim())
            ? env.IMAGE_HOST_BASE.trim().replace(/\/+$/, '')
            : DEFAULT_IMAGE_HOST_BASE;
        const url = new URL(request.url);
        const storage = url.searchParams.get('storage')?.trim() || 'telegram';
        const upstreamUrl = `${base}/api/v1/upload?storage=${encodeURIComponent(storage)}`;

        const upstreamResponse = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: request.headers.get('Accept') || 'application/json',
                'Content-Type': contentType
            },
            body: request.body
        });

        const responseHeaders = new Headers(upstreamResponse.headers);
        responseHeaders.delete('content-length');
        Object.entries(CORS_HEADERS).forEach(([key, value]) => responseHeaders.set(key, value));

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers: responseHeaders
        });
    } catch (error: any) {
        return buildJsonResponse({
            success: false,
            error: 'Image host upload proxy failed',
            detail: error?.message || String(error)
        }, 502);
    }
}
