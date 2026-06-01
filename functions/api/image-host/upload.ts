const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const DEFAULT_IMAGE_HOST_BASE = 'https://image1.bacon159.pp.ua';
const MAX_RESPONSE_SNIPPET = 1200;
const PICUI_BASE = 'https://picui.cn';
const XQD_UPLOAD_URL = 'https://tuchuang.xqd.cn/api/upload';

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

const readText = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const readSetCookies = (headers: Headers): string[] => {
    const maybeHeaders = headers as Headers & { getSetCookie?: () => string[] };
    if (typeof maybeHeaders.getSetCookie === 'function') {
        return maybeHeaders.getSetCookie();
    }
    const single = headers.get('set-cookie');
    return single ? [single] : [];
};

const buildCookieHeader = (headers: Headers): string => (
    readSetCookies(headers)
        .map((cookie) => cookie.split(';')[0]?.trim())
        .filter(Boolean)
        .join('; ')
);

const readFormFile = async (request: Request): Promise<{ file: Blob; fileName: string }> => {
    const form = await request.formData();
    const value = form.get('file') || form.get('image');
    if (!(value instanceof Blob) || value.size <= 0) {
        throw new Error('No image file found in multipart form');
    }
    const fileName = readText((value as File).name) || `moranjianghu-image-${Date.now()}.png`;
    return { file: value, fileName };
};

const extractPicuiCsrfToken = (html: string): string => (
    html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)/i)?.[1] || ''
);

const normalizePicuiPayload = (payload: any): any => {
    const data = payload?.data || {};
    const url = readText(data?.links?.url)
        || readText(data?.links?.thumbnail_url)
        || readText(data?.url);
    if (!payload?.status || !url) {
        throw new Error(readText(payload?.message) || 'PicUI upload response has no URL');
    }
    return {
        success: true,
        url,
        id: data?.id,
        size: Number(data?.size || 0) * 1024 || undefined,
        storage: 'picui',
        file: {
            id: data?.id,
            url,
            size: Number(data?.size || 0) * 1024 || undefined,
            storage: 'picui',
            mime: data?.mimetype
        },
        links: {
            download: url,
            delete: data?.links?.delete_url
        },
        upstream: payload
    };
};

const normalizeXqdPayload = (payload: any): any => {
    const data = payload?.data || {};
    const url = readText(data?.url);
    if (Number(payload?.code) !== 200 || !url) {
        throw new Error(readText(payload?.msg) || 'XQD upload response has no URL');
    }
    return {
        success: true,
        url,
        id: data?.id,
        size: Number(data?.size || 0) || undefined,
        storage: 'tuchuang-xqd',
        file: {
            id: data?.id,
            url,
            size: Number(data?.size || 0) || undefined,
            storage: 'tuchuang-xqd',
            mime: data?.mime
        },
        links: {
            download: url
        },
        upstream: payload
    };
};

const readJsonResponse = async (response: Response, provider: string): Promise<any> => {
    const text = await response.text();
    let payload: any = null;
    try {
        payload = text ? JSON.parse(text.replace(/^\uFEFF/, '')) : null;
    } catch {
        throw new Error(`${provider} returned non-JSON response: ${text.slice(0, MAX_RESPONSE_SNIPPET)}`);
    }
    if (!response.ok) {
        throw new Error(`${provider} returned HTTP ${response.status}: ${text.slice(0, MAX_RESPONSE_SNIPPET)}`);
    }
    return payload;
};

const uploadToPicui = async (file: Blob, fileName: string): Promise<any> => {
    const home = await fetch(`${PICUI_BASE}/`, {
        method: 'GET',
        headers: {
            Accept: 'text/html,application/xhtml+xml'
        }
    });
    if (!home.ok) throw new Error(`PicUI home returned HTTP ${home.status}`);
    const html = await home.text();
    const csrf = extractPicuiCsrfToken(html);
    if (!csrf) throw new Error('PicUI CSRF token not found');
    const cookie = buildCookieHeader(home.headers);
    const form = new FormData();
    form.append('file', file, fileName);
    const response = await fetch(`${PICUI_BASE}/upload`, {
        method: 'POST',
        headers: {
            Accept: 'application/json, text/plain, */*',
            'X-CSRF-TOKEN': csrf,
            'X-Requested-With': 'XMLHttpRequest',
            ...(cookie ? { Cookie: cookie } : {})
        },
        body: form
    });
    const payload = await readJsonResponse(response, 'PicUI');
    return normalizePicuiPayload(payload);
};

const uploadToXqd = async (file: Blob, fileName: string): Promise<any> => {
    const form = new FormData();
    form.append('image', file, fileName);
    const response = await fetch(XQD_UPLOAD_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json, text/plain, */*'
        },
        body: form
    });
    const payload = await readJsonResponse(response, 'XQD');
    return normalizeXqdPayload(payload);
};

const uploadImageWithFallback = async (
    request: Request,
    providers: string[],
    requestId: string,
    startedAt: number
): Promise<Response> => {
    const { file, fileName } = await readFormFile(request);
    const errors: Array<{ provider: string; message: string }> = [];
    for (const provider of providers) {
        try {
            const payload = provider === 'picui'
                ? await uploadToPicui(file, fileName)
                : await uploadToXqd(file, fileName);
            return buildJsonResponse({
                ...payload,
                requestId,
                elapsedMs: Date.now() - startedAt,
                fallbackErrors: errors
            }, 200, {
                'X-Moran-Image-Proxy-Request-Id': requestId,
                'X-Moran-Image-Upstream-Status': '200',
                'X-Moran-Image-Provider': provider,
                'X-Moran-Image-Proxy-Elapsed-Ms': String(Date.now() - startedAt)
            });
        } catch (error: any) {
            errors.push({ provider, message: error?.message || String(error) });
            console.warn('[image-host-upload] provider failed', {
                requestId,
                provider,
                elapsedMs: Date.now() - startedAt,
                error: error?.message || String(error)
            });
        }
    }
    return buildJsonResponse({
        success: false,
        error: errors.map((item) => `${item.provider}: ${item.message}`).join(' | ') || 'Image fallback upload failed',
        requestId,
        upstreamStatus: 502,
        elapsedMs: Date.now() - startedAt,
        fallbackErrors: errors
    }, 502, {
        'X-Moran-Image-Proxy-Request-Id': requestId,
        'X-Moran-Image-Upstream-Status': '502',
        'X-Moran-Image-Proxy-Elapsed-Ms': String(Date.now() - startedAt)
    });
};

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

        const url = new URL(request.url);
        const storage = url.searchParams.get('storage')?.trim() || '';
        const kind = url.searchParams.get('kind')?.trim() || '';
        if (kind === 'image' || storage === 'picui' || storage === 'tuchuang-xqd' || storage === 'xqd') {
            const providers = storage === 'picui'
                ? ['picui']
                : (storage === 'tuchuang-xqd' || storage === 'xqd')
                    ? ['tuchuang-xqd']
                    : ['picui', 'tuchuang-xqd'];
            return uploadImageWithFallback(request, providers, requestId, startedAt);
        }

        const token = typeof env?.IMAGE_HOST_TOKEN === 'string' ? env.IMAGE_HOST_TOKEN.trim() : '';
        if (!token) {
            return buildJsonResponse({ success: false, error: 'IMAGE_HOST_TOKEN is not configured', requestId }, 503);
        }

        const base = normalizeImageHostBase(env?.IMAGE_HOST_BASE);
        const upstreamStorage = storage || 'telegram';
        const upstreamUrl = `${base}/api/v1/upload?storage=${encodeURIComponent(upstreamStorage)}`;

        const contentLength = request.headers.get('Content-Length') || request.headers.get('content-length') || '';
        console.info('[image-host-upload] proxy start', {
            requestId,
            storage: upstreamStorage,
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
