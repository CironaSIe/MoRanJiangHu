const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const readString = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const isAllowedComfyUrl = (value: string, allowAnyUrl: boolean): boolean => {
    try {
        const url = new URL(value);
        if (!/^https?:$/i.test(url.protocol)) return false;
        if (allowAnyUrl) return true;
        return /(^|\.)cnb\.run$/i.test(url.hostname)
            || /(^|\.)cnb\.space$/i.test(url.hostname);
    } catch {
        return false;
    }
};

const buildTargetUrl = (baseUrlRaw: string, pathRaw: string, requestUrl: URL): string => {
    const base = new URL(baseUrlRaw);
    const path = pathRaw.startsWith('/') ? pathRaw : `/${pathRaw}`;
    const target = new URL(base.toString());
    target.pathname = `${target.pathname.replace(/\/+$/, '')}${path}`;
    target.search = '';
    requestUrl.searchParams.forEach((value, key) => {
        if (key !== 'url') {
            target.searchParams.append(key, value);
        }
    });
    target.hash = '';
    return target.toString();
};

const buildJsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
        }
    })
);

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequest({ request, params, env }: any): Promise<Response> {
    const requestUrl = new URL(request.url);
    const targetBase = readString(requestUrl.searchParams.get('url'));
    const allowAnyUrl = readString(env?.CNB_SYNC_ALLOW_ANY_URL).toLowerCase() === 'true';
    const pathParam = params?.path;
    const path = Array.isArray(pathParam)
        ? pathParam.join('/')
        : readString(pathParam || '');

    if (!targetBase || !isAllowedComfyUrl(targetBase, allowAnyUrl)) {
        return buildJsonResponse({
            error: 'ComfyUI proxy target URL is invalid or not allowed.'
        }, 400);
    }

    const method = request.method.toUpperCase();
    if (!['GET', 'POST', 'DELETE'].includes(method)) {
        return buildJsonResponse({ error: 'Method not allowed.' }, 405);
    }

    const targetUrl = buildTargetUrl(targetBase.replace(/\/+$/, ''), path || '/', requestUrl);
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    const authorization = request.headers.get('authorization');
    if (contentType) headers.set('Content-Type', contentType);
    if (authorization) headers.set('Authorization', authorization);
    headers.set('Accept', request.headers.get('accept') || '*/*');

    const response = await fetch(targetUrl, {
        method,
        headers,
        body: method === 'GET' ? undefined : request.body
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    const passthroughHeaders = [
        'content-type',
        'content-length',
        'cache-control',
        'etag',
        'last-modified'
    ];
    passthroughHeaders.forEach((key) => {
        const value = response.headers.get(key);
        if (value) responseHeaders.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
    });
}
