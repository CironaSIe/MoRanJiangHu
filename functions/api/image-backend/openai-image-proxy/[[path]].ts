const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
};

const JSON_HEADERS = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json'
};

const readString = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const isPrivateHostname = (hostname: string): boolean => {
    const lower = hostname.toLowerCase();
    if (lower === 'localhost' || lower === '0.0.0.0') return true;
    if (/^127\./.test(lower) || /^10\./.test(lower) || /^192\.168\./.test(lower)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
    if (/^\[?::1\]?$/.test(lower)) return true;
    return false;
};

const isAllowedTargetBase = (value: string): boolean => {
    try {
        const url = new URL(value);
        if (!/^https:$/i.test(url.protocol)) return false;
        if (isPrivateHostname(url.hostname)) return false;
        return true;
    } catch {
        return false;
    }
};

const normalizePath = (pathRaw: unknown): string => {
    const pathParam = Array.isArray(pathRaw) ? pathRaw.join('/') : readString(pathRaw || '');
    const path = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
    if (/^\/(?:v1\/)?images\/(?:generations|edits)$/i.test(path)) return path;
    if (/^\/(?:v1\/)?tasks\/[^/?#]+$/i.test(path)) return path;
    return '';
};

const buildTargetUrl = (targetBaseRaw: string, path: string, requestUrl: URL): string => {
    const targetBase = new URL(targetBaseRaw.replace(/\/+$/, ''));
    const basePath = targetBase.pathname.replace(/\/+$/, '');
    const normalizedPath = (() => {
        if (basePath.endsWith('/v1') && path.startsWith('/v1/')) return path.replace(/^\/v1/i, '');
        if (path.startsWith('/v1/')) return path;
        return `${basePath.endsWith('/v1') ? '' : '/v1'}${path}`;
    })();
    targetBase.pathname = `${basePath}${normalizedPath}`;
    targetBase.search = '';
    requestUrl.searchParams.forEach((value, key) => {
        if (key !== 'url') targetBase.searchParams.append(key, value);
    });
    targetBase.hash = '';
    return targetBase.toString();
};

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: JSON_HEADERS
    })
);

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequest({ request, params }: any): Promise<Response> {
    const method = request.method.toUpperCase();
    if (method === 'OPTIONS') return onRequestOptions();
    if (method !== 'POST' && method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    const requestUrl = new URL(request.url);
    const targetBase = readString(requestUrl.searchParams.get('url'));
    const path = normalizePath(params?.path);
    if (!targetBase || !isAllowedTargetBase(targetBase) || !path) {
        return jsonResponse({
            error: 'OpenAI image proxy target URL is invalid or not allowed.'
        }, 400);
    }

    const authorization = request.headers.get('authorization');
    if (!authorization) {
        return jsonResponse({ error: 'Missing Authorization header.' }, 401);
    }

    const headers = new Headers();
    headers.set('Authorization', authorization);
    headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
    headers.set('Accept', request.headers.get('accept') || 'application/json');

    const targetUrl = buildTargetUrl(targetBase, path, requestUrl);
    const response = await fetch(targetUrl, {
        method,
        headers,
        body: method === 'GET' ? undefined : request.body
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    ['content-type', 'cache-control'].forEach((key) => {
        const value = response.headers.get(key);
        if (value) responseHeaders.set(key, value);
    });
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
    });
}
