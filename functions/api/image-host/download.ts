const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const DEFAULT_IMAGE_HOST_BASE = 'https://image.bacon159.pp.ua';

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
            && /(^|\.)image\.bacon159\.pp\.ua$/i.test(url.hostname)
            && (/^\/file\//i.test(url.pathname) || /^\/api\/v1\/file\//i.test(url.pathname) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(url.pathname));
    } catch {
        return false;
    }
};

const readImageHostToken = (env: any): string => (
    typeof env?.IMAGE_HOST_TOKEN === 'string' ? env.IMAGE_HOST_TOKEN.trim() : ''
);

const readImageHostBase = (env: any): string => (
    typeof env?.IMAGE_HOST_BASE === 'string' && env.IMAGE_HOST_BASE.trim()
        ? env.IMAGE_HOST_BASE.trim().replace(/\/+$/, '')
        : DEFAULT_IMAGE_HOST_BASE
);

const buildAuthenticatedApiUrl = (targetUrl: string, env: any): string => {
    const url = new URL(targetUrl);
    const fileMatch = url.pathname.match(/^\/file\/([^/?#]+)/i);
    if (!fileMatch) return targetUrl;
    const fileId = decodeURIComponent(fileMatch[1] || '').trim();
    if (!fileId) return targetUrl;
    return `${readImageHostBase(env)}/api/v1/file/${encodeURIComponent(fileId)}`;
};

const buildPublicFileUrl = (targetUrl: string, env: any): string => {
    const url = new URL(targetUrl);
    const fileMatch = url.pathname.match(/^\/api\/v1\/file\/([^/?#]+)/i);
    if (!fileMatch) return targetUrl;
    const fileId = decodeURIComponent(fileMatch[1] || '').trim();
    if (!fileId) return targetUrl;
    return `${readImageHostBase(env)}/file/${encodeURIComponent(fileId)}`;
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
    const token = readImageHostToken(env);
    const authenticatedHeaders: Record<string, string> = {
        Accept: 'image/*,application/octet-stream,*/*;q=0.8'
    };
    if (token) authenticatedHeaders.Authorization = `Bearer ${token}`;
    const publicHeaders = {
        Accept: 'image/*,application/octet-stream,*/*;q=0.8'
    };

    const candidates: Array<{ url: string; headers: Record<string, string> }> = [];
    const authenticatedUrl = buildAuthenticatedApiUrl(targetUrl, env);
    if (token) candidates.push({ url: authenticatedUrl, headers: authenticatedHeaders });

    const publicFileUrl = buildPublicFileUrl(targetUrl, env);
    if (publicFileUrl !== targetUrl) {
        candidates.push({ url: publicFileUrl, headers: publicHeaders });
    } else if (authenticatedUrl !== targetUrl) {
        candidates.push({ url: targetUrl, headers: publicHeaders });
    } else {
        candidates.push({ url: targetUrl, headers: token ? authenticatedHeaders : publicHeaders });
    }

    const seen = new Set<string>();
    let lastResponse: Response | null = null;
    for (const candidate of candidates) {
        if (seen.has(candidate.url)) continue;
        seen.add(candidate.url);
        const response = await fetch(candidate.url, {
            method: 'GET',
            headers: candidate.headers
        });
        if (response.ok) return response;
        lastResponse = response;
    }
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
        if (!targetUrl || !isAllowedImageHostUrl(targetUrl)) {
            return buildTextResponse('Invalid image host URL', 400);
        }

        const upstream = await fetchImageHostFile(targetUrl, env);
        if (!upstream.ok) {
            return buildTextResponse(`Image download failed: ${upstream.status}`, upstream.status);
        }
        const contentType = upstream.headers.get('Content-Type') || '';
        const length = Number(upstream.headers.get('Content-Length') || 0);
        if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) {
            return buildTextResponse('Image is too large', 413);
        }
        const bytes = await upstream.arrayBuffer();
        if (bytes.byteLength > MAX_IMAGE_BYTES) {
            return buildTextResponse('Image is too large', 413);
        }
        const sniffedContentType = sniffImageContentType(new Uint8Array(bytes));
        const outputContentType = /^image\//i.test(contentType) ? contentType : sniffedContentType;
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
