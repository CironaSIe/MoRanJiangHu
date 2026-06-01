const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const MAX_FILE_BYTES = 128 * 1024 * 1024;
const DEFAULT_IMAGE_HOST_BASE = 'https://image1.bacon159.pp.ua';
const DIRECT_IMAGE_HOST_PATTERN = /(^|\.)picui\.ogmua\.cn$|^imgurloss\.xqd\.cn$/i;

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

const buildTextResponse = (message: string, status = 400): Response => (
    new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...CORS_HEADERS
        }
    })
);

const isAllowedImageHostUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return /^https?:$/i.test(url.protocol)
            && (/^image1\.bacon159\.pp\.ua$/i.test(url.hostname)
                || /^image\.bacon159\.pp\.ua$/i.test(url.hostname)
                || DIRECT_IMAGE_HOST_PATTERN.test(url.hostname))
            && (/^\/file\//i.test(url.pathname) || /^\/api\/v1\/file\//i.test(url.pathname) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(url.pathname));
    } catch {
        return false;
    }
};

const isDirectImageHostUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return DIRECT_IMAGE_HOST_PATTERN.test(url.hostname);
    } catch {
        return false;
    }
};

const readImageHostToken = (env: any): string => (
    typeof env?.IMAGE_HOST_TOKEN === 'string' ? env.IMAGE_HOST_TOKEN.trim() : ''
);

const readImageHostBase = (env: any): string => (
    normalizeImageHostBase(env?.IMAGE_HOST_BASE)
);

const buildAuthenticatedApiUrl = (targetUrl: string, env: any): string => {
    const url = new URL(targetUrl);
    if (/^image\.bacon159\.pp\.ua$/i.test(url.hostname)) {
        url.hostname = 'image1.bacon159.pp.ua';
    }
    const fileMatch = url.pathname.match(/^\/file\/([^/?#]+)/i);
    if (!fileMatch) return url.toString();
    const fileId = decodeURIComponent(fileMatch[1] || '').trim();
    if (!fileId) return targetUrl;
    return `${readImageHostBase(env)}/api/v1/file/${encodeURIComponent(fileId)}`;
};

const buildPublicFileUrl = (targetUrl: string, env: any): string => {
    const url = new URL(targetUrl);
    if (/^image\.bacon159\.pp\.ua$/i.test(url.hostname)) {
        url.hostname = 'image1.bacon159.pp.ua';
    }
    const fileMatch = url.pathname.match(/^\/api\/v1\/file\/([^/?#]+)/i);
    if (!fileMatch) return url.toString();
    const fileId = decodeURIComponent(fileMatch[1] || '').trim();
    if (!fileId) return targetUrl;
    return `${readImageHostBase(env)}/file/${encodeURIComponent(fileId)}`;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (
    url: string,
    headers: Record<string, string>,
    attempts = 3
): Promise<Response> => {
    let lastResponse: Response | null = null;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers
            });
            if (response.ok) return response;
            lastResponse = response;
            if (response.status < 500 && response.status !== 408 && response.status !== 429) return response;
        } catch (error) {
            lastError = error;
        }
        if (attempt < attempts) await sleep(Math.min(2500, 400 * attempt * attempt));
    }
    if (lastResponse) return lastResponse;
    throw lastError || new Error('Image host fetch failed');
};

const sniffImageContentType = (bytes: Uint8Array): string => {
    if (bytes.length >= 8
        && bytes[0] === 0x89
        && bytes[1] === 0x50
        && bytes[2] === 0x4e
        && bytes[3] === 0x47
        && bytes[4] === 0x0d
        && bytes[5] === 0x0a
        && bytes[6] === 0x1a
        && bytes[7] === 0x0a) {
        return 'image/png';
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg';
    }
    if (bytes.length >= 12
        && bytes[0] === 0x52
        && bytes[1] === 0x49
        && bytes[2] === 0x46
        && bytes[3] === 0x46
        && bytes[8] === 0x57
        && bytes[9] === 0x45
        && bytes[10] === 0x42
        && bytes[11] === 0x50) {
        return 'image/webp';
    }
    if (bytes.length >= 6) {
        const header = String.fromCharCode(...bytes.slice(0, 6));
        if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
    }
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
        return 'image/bmp';
    }
    return '';
};

const fetchImageHostFile = async (targetUrl: string, env: any): Promise<Response> => {
    const publicHeaders = {
        Accept: 'image/*,application/octet-stream,*/*;q=0.8'
    };
    if (isDirectImageHostUrl(targetUrl)) {
        return fetchWithRetry(targetUrl, publicHeaders);
    }

    const token = readImageHostToken(env);
    const authenticatedHeaders: Record<string, string> = {
        Accept: 'image/*,application/octet-stream,*/*;q=0.8'
    };
    if (token) authenticatedHeaders.Authorization = `Bearer ${token}`;

    const candidates: Array<{ url: string; headers: Record<string, string> }> = [];
    const normalizedTargetUrl = buildAuthenticatedApiUrl(targetUrl, env);
    const authenticatedUrl = buildAuthenticatedApiUrl(normalizedTargetUrl, env);
    if (token) candidates.push({ url: authenticatedUrl, headers: authenticatedHeaders });

    const publicFileUrl = buildPublicFileUrl(normalizedTargetUrl, env);
    if (publicFileUrl !== normalizedTargetUrl) {
        candidates.push({ url: publicFileUrl, headers: publicHeaders });
    } else if (authenticatedUrl !== normalizedTargetUrl) {
        candidates.push({ url: normalizedTargetUrl, headers: publicHeaders });
    } else {
        candidates.push({ url: normalizedTargetUrl, headers: token ? authenticatedHeaders : publicHeaders });
    }

    const seen = new Set<string>();
    let lastResponse: Response | null = null;
    let lastError: unknown = null;
    for (const candidate of candidates) {
        if (seen.has(candidate.url)) continue;
        seen.add(candidate.url);
        try {
            const response = await fetchWithRetry(candidate.url, candidate.headers);
            if (response.ok) return response;
            lastResponse = response;
        } catch (error) {
            lastError = error;
        }
    }
    if (lastError && !lastResponse) throw lastError;
    return lastResponse || new Response('Image download failed', { status: 502 });
};

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        const url = new URL(request.url);
        const targetUrl = (url.searchParams.get('url') || '').trim();
        const fileMode = url.searchParams.get('type') === 'file';
        if (!targetUrl || !isAllowedImageHostUrl(targetUrl)) {
            return buildTextResponse('Invalid image host URL', 400);
        }

        const upstream = await fetchImageHostFile(targetUrl, env);
        if (!upstream.ok) {
            return buildTextResponse(`Image download failed: ${upstream.status}`, upstream.status);
        }
        const contentType = upstream.headers.get('Content-Type') || '';
        const length = Number(upstream.headers.get('Content-Length') || 0);
        const maxBytes = fileMode ? MAX_FILE_BYTES : MAX_IMAGE_BYTES;
        if (Number.isFinite(length) && length > maxBytes) {
            return buildTextResponse(fileMode ? 'File is too large' : 'Image is too large', 413);
        }
        const bytes = await upstream.arrayBuffer();
        if (bytes.byteLength > maxBytes) {
            return buildTextResponse(fileMode ? 'File is too large' : 'Image is too large', 413);
        }
        const sniffedContentType = sniffImageContentType(new Uint8Array(bytes));
        const outputContentType = fileMode
            ? (contentType || 'application/octet-stream')
            : (/^image\//i.test(contentType) ? contentType : sniffedContentType);
        if (!outputContentType) {
            return buildTextResponse(`Upstream response is not an image (${contentType || 'unknown'})`, 415);
        }

        return new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': outputContentType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
                ...CORS_HEADERS
            }
        });
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Image download proxy failed', 502);
    }
}
