import {
    APK_CORS_HEADERS,
    buildSignedObjectUrl,
    buildTextResponse,
    normalizeObjectKey
} from '../apk/_shared';

const PRESET_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PRESET_IMAGE_PATTERN = /^s3_[0-9]+_[0-9a-z]+\.(png|jpe?g|webp|gif|bmp)$/i;

const readPresetImageKey = (request: Request, params: any): string => {
    const rawParam = Array.isArray(params?.path)
        ? params.path.join('/')
        : typeof params?.path === 'string'
            ? params.path
            : '';
    const rawPath = rawParam || new URL(request.url).pathname.replace(/^\/api\/preset-image\/?/i, '');
    const decoded = decodeURIComponent(rawPath).replace(/^\/+/, '');
    if (!PRESET_IMAGE_PATTERN.test(decoded)) {
        throw new Error('Preset image key is invalid');
    }
    return normalizeObjectKey(decoded);
};

const toHeadResponse = (response: Response): Response => (
    new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers })
);

const buildPresetImageResponse = async (
    context: any,
    method: 'GET' | 'HEAD'
): Promise<Response> => {
    const { request, env } = context;
    try {
        const key = readPresetImageKey(request, context.params);
        const cache = method === 'GET' && typeof caches !== 'undefined' ? caches.default : null;
        const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
        if (cache) {
            const cached = await cache.match(cacheKey);
            if (cached) {
                const headers = new Headers(cached.headers);
                headers.set('X-Moran-Preset-Image-Cache', 'hit');
                return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
            }
        }

        const signedUrl = await buildSignedObjectUrl(env, key, 1800, method);
        const upstream = await fetch(signedUrl, {
            method,
            headers: {
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });
        if (!upstream.ok) {
            return buildTextResponse(`Preset image not found: ${upstream.status}`, upstream.status);
        }

        const headers = new Headers();
        const contentType = upstream.headers.get('Content-Type') || '';
        if (contentType) headers.set('Content-Type', contentType);
        const contentLength = upstream.headers.get('Content-Length');
        if (contentLength) headers.set('Content-Length', contentLength);
        const etag = upstream.headers.get('ETag');
        if (etag) headers.set('ETag', etag);
        const lastModified = upstream.headers.get('Last-Modified');
        if (lastModified) headers.set('Last-Modified', lastModified);
        headers.set('Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('CDN-Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('Cloudflare-CDN-Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('X-Moran-Preset-Image-Cache', 'miss');
        Object.entries(APK_CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));

        const response = new Response(method === 'HEAD' ? null : upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers
        });
        if (cache && method === 'GET') {
            context.waitUntil?.(cache.put(cacheKey, response.clone()));
        }
        return method === 'HEAD' ? toHeadResponse(response) : response;
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Preset image proxy failed', 502);
    }
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export const onRequestGet = (context: any): Promise<Response> => buildPresetImageResponse(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => buildPresetImageResponse(context, 'HEAD');
