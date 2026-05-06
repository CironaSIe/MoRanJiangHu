const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
};

const buildJsonResponse = (payload: unknown, status = 200): Response => {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS
        }
    });
};

const buildNovelAiUrl = (request: Request): string => {
    const url = new URL(request.url);
    const upstreamPath = url.pathname.replace(/^\/api\/novelai/i, '') || '/ai/generate-image';
    if (!upstreamPath.startsWith('/ai/')) {
        throw new Error('Unsupported NovelAI proxy path');
    }
    return `https://image.novelai.net${upstreamPath}${url.search}`;
};

const buildForwardHeaders = (request: Request): Headers => {
    const headers = new Headers();
    const authorization = request.headers.get('Authorization')?.trim() || '';
    const contentType = request.headers.get('Content-Type')?.trim() || 'application/json';
    const accept = request.headers.get('Accept')?.trim() || 'application/zip';

    if (authorization) {
        headers.set('Authorization', authorization);
    }
    headers.set('Content-Type', contentType);
    headers.set('Accept', accept);
    return headers;
};

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestPost({ request }: any): Promise<Response> {
    try {
        const targetUrl = buildNovelAiUrl(request);
        const upstreamResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: buildForwardHeaders(request),
            body: await request.arrayBuffer()
        });
        const responseHeaders = new Headers(upstreamResponse.headers);
        responseHeaders.delete('content-length');
        Object.entries(CORS_HEADERS).forEach(([key, value]) => responseHeaders.set(key, value));

        return new Response(await upstreamResponse.arrayBuffer(), {
            status: upstreamResponse.status,
            headers: responseHeaders
        });
    } catch (error: any) {
        return buildJsonResponse({
            error: 'NovelAI proxy failed',
            detail: error?.message || String(error)
        }, 502);
    }
}
