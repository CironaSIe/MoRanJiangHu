const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const DEFAULT_IMAGE_HOST_BASE = 'https://image1.bacon159.pp.ua';
const MAX_RESPONSE_SNIPPET = 1200;

const normalizeImageHostBase = (value: unknown): string => {
    const raw = typeof value === 'string' && value.trim()
        ? value.trim().replace(/\/+$/, '')
        : DEFAULT_IMAGE_HOST_BASE;
    try {
        const url = new URL(raw);
        if (/^image\.bacon159\.pp\.ua$/i.test(url.hostname)) {
            url.hostname = 'image1.bacon159.pp.ua';
            return url.toString().replace(/\/+$/, '');
        }
        return raw;
    } catch {
        return DEFAULT_IMAGE_HOST_BASE;
    }
};

const buildJsonResponse = (payload: unknown, status = 200, extraHeaders?: Record<string, string>): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...(extraHeaders || {}),
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
    const requestId = `imgup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();
    try {
        const contentType = request.headers.get('Content-Type') || request.headers.get('content-type') || '';
        if (!/^multipart\/form-data\b/i.test(contentType)) {
            return buildJsonResponse({ success: false, error: '请求必须使用 multipart/form-data 格式', requestId }, 400);
        }

        const token = typeof env?.IMAGE_HOST_TOKEN === 'string' ? env.IMAGE_HOST_TOKEN.trim() : '';
        if (!token) {
            return buildJsonResponse({ success: false, error: 'IMAGE_HOST_TOKEN is not configured', requestId }, 503);
        }

        const base = normalizeImageHostBase(env?.IMAGE_HOST_BASE);
        const url = new URL(request.url);
        const storage = url.searchParams.get('storage')?.trim() || 'telegram';
        const upstreamUrl = `${base}/api/v1/upload?storage=${encodeURIComponent(storage)}`;

        const contentLength = request.headers.get('Content-Length') || request.headers.get('content-length') || '';
        console.info('[image-host-upload] proxy start', {
            requestId,
            storage,
            contentType,
            contentLength,
            upstreamUrl
        });

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
        responseHeaders.set('X-Moran-Image-Proxy-Request-Id', requestId);
        responseHeaders.set('X-Moran-Image-Upstream-Status', String(upstreamResponse.status));
        responseHeaders.set('X-Moran-Image-Proxy-Elapsed-Ms', String(Date.now() - startedAt));

        if (!upstreamResponse.ok) {
            const text = await upstreamResponse.text().catch(() => '');
            const snippet = text.slice(0, MAX_RESPONSE_SNIPPET);
            console.warn('[image-host-upload] upstream failed', {
                requestId,
                status: upstreamResponse.status,
                statusText: upstreamResponse.statusText,
                elapsedMs: Date.now() - startedAt,
                contentLength,
                snippet
            });
            const elapsedMs = Date.now() - startedAt;
            return buildJsonResponse({
                success: false,
                error: snippet || `上游图床返回 HTTP ${upstreamResponse.status}`,
                requestId,
                upstreamStatus: upstreamResponse.status,
                upstreamStatusText: upstreamResponse.statusText,
                elapsedMs,
                contentLength
            }, upstreamResponse.status, {
                'X-Moran-Image-Proxy-Request-Id': requestId,
                'X-Moran-Image-Upstream-Status': String(upstreamResponse.status),
                'X-Moran-Image-Proxy-Elapsed-Ms': String(elapsedMs)
            });
        }

        console.info('[image-host-upload] proxy done', {
            requestId,
            status: upstreamResponse.status,
            elapsedMs: Date.now() - startedAt,
            contentLength
        });

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers: responseHeaders
        });
    } catch (error: any) {
        console.error('[image-host-upload] proxy exception', {
            requestId,
            elapsedMs: Date.now() - startedAt,
            error: error?.message || String(error)
        });
        const elapsedMs = Date.now() - startedAt;
        return buildJsonResponse({
            success: false,
            error: 'Image host upload proxy failed',
            detail: error?.message || String(error),
            requestId,
            elapsedMs
        }, 502, {
            'X-Moran-Image-Proxy-Request-Id': requestId,
            'X-Moran-Image-Proxy-Elapsed-Ms': String(elapsedMs)
        });
    }
}
