import {
    APK_CORS_HEADERS,
    buildSignedObjectUrl,
    normalizeObjectKey
} from '../apk/_shared';

const PRESET_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PRESET_IMAGE_ERROR_CACHE_CONTROL = 'public, max-age=60';
const LISTING_CACHE_CONTROL = 'public, max-age=3600';
const S3_KEY_PATTERN = /^s3_[0-9]+_[0-9a-z]+\.(png|jpe?g|webp|gif|bmp)$/i;
const ANY_IMAGE_PATTERN = /^[\p{L}\p{N} _\-().]+\.png$/u;
const ANY_THUMB_PATTERN = /^thumbs\/[\p{L}\p{N} _\-().]+\.(webp|png|jpg)$/u;

const readPresetImagePath = (request: Request, params: any): string => {
    const rawParam = Array.isArray(params?.path)
        ? params.path.join('/')
        : typeof params?.path === 'string'
            ? params.path
            : '';
    const rawPath = rawParam || new URL(request.url).pathname.replace(/^\/api\/preset-image\/?/i, '');
    return decodeURIComponent(rawPath).replace(/^\/+/, '');
};

const buildErrorResponse = (message: string, status = 400): Response => (
    new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': PRESET_IMAGE_ERROR_CACHE_CONTROL,
            ...APK_CORS_HEADERS
        }
    })
);

interface OneDriveSignMap {
    [fileName: string]: string;
}

/**
 * Fetch the directory listing from OpenList and extract a filename -> sign mapping.
 * Cached at the Cloudflare edge for 1 hour.
 */
const fetchOneDriveSignMap = async (
    env: any,
    subPath: string,
    cache: Cache | null
): Promise<OneDriveSignMap> => {
    const baseUrl = env.MORAN_OPENLIST_BASE_URL || 'https://openlist.bacon.de5.net';
    const authToken = env.MORAN_OPENLIST_AUTH_TOKEN;
    if (!authToken) throw new Error('OPENLIST_AUTH_TOKEN not configured');

    const mapCacheKey = new Request(
        `${baseUrl}/__cache__/sign-map/${encodeURIComponent(subPath)}`,
        { method: 'GET' }
    );
    if (cache) {
        const cached = await cache.match(mapCacheKey);
        if (cached) {
            return cached.json() as Promise<OneDriveSignMap>;
        }
    }

    const listPath = subPath === 'thumbs'
        ? '/Onedrive/MoRanJiangHu/preset-items/thumbs'
        : '/Onedrive/MoRanJiangHu/preset-items';

    const listBody = JSON.stringify({
        path: listPath,
        password: '',
        page: 1,
        per_page: 1000,
        refresh: false
    });

    const listResp = await fetch(`${baseUrl}/api/fs/list`, {
        method: 'POST',
        headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
        },
        body: listBody
    });
    if (!listResp.ok) throw new Error(`OpenList list failed: ${listResp.status}`);
    const listJson = await listResp.json() as any;
    if (listJson.code !== 200) throw new Error(listJson.message || 'OpenList error');

    const mapping: OneDriveSignMap = {};
    for (const item of (listJson.data?.content || [])) {
        if (!item.is_dir && item.sign) {
            mapping[item.name] = item.sign;
        }
    }

    if (cache) {
        cache.put(
            mapCacheKey,
            new Response(JSON.stringify(mapping), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': LISTING_CACHE_CONTROL
                }
            })
        );
    }

    return mapping;
};

/**
 * Proxy a preset image through OpenList's OneDrive path.
 * Supports both full-size images and thumbnails.
 */
const proxyFromOneDrive = async (
    env: any,
    decodedPath: string,
    cache: Cache | null,
    request: Request
): Promise<Response> => {
    const baseUrl = env.MORAN_OPENLIST_BASE_URL || 'https://openlist.bacon.de5.net';
    const authToken = env.MORAN_OPENLIST_AUTH_TOKEN;
    if (!authToken) throw new Error('OPENLIST_AUTH_TOKEN not configured');

    const isThumb = decodedPath.startsWith('thumbs/');
    const fileName = isThumb ? decodedPath.replace(/^thumbs\//, '') : decodedPath;
    const subPath = isThumb ? 'thumbs' : 'main';

    const signMap = await fetchOneDriveSignMap(env, subPath, cache);
    const sign = signMap[fileName];
    if (!sign) throw new Error(`File not found on OneDrive: ${fileName}`);

    const oneDrivePath = isThumb
        ? `/Onedrive/MoRanJiangHu/preset-items/thumbs/${encodeURIComponent(fileName)}`
        : `/Onedrive/MoRanJiangHu/preset-items/${encodeURIComponent(fileName)}`;

    const downloadUrl = `${baseUrl}/p${oneDrivePath}?sign=${encodeURIComponent(sign)}`;
    const upstream = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
    });
    if (!upstream.ok) throw new Error(`OneDrive download failed: ${upstream.status}`);

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
    headers.set('X-Moran-Preset-Image-Source', 'onedrive');
    Object.entries(APK_CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));

    return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers
    });
};

/**
 * Try legacy hi168 S3 presigned URL. Returns null if the key is not an S3 pattern
 * or if the upstream returns a non-OK response.
 */
const tryLegacyS3 = async (
    env: any,
    decodedPath: string,
    cache: Cache | null,
    request: Request,
    method: 'GET' | 'HEAD'
): Promise<Response | null> => {
    if (!S3_KEY_PATTERN.test(decodedPath)) return null;
    try {
        const key = normalizeObjectKey(`MoRanJiangHu/preset-items/${decodedPath}`);
        const signedUrl = await buildSignedObjectUrl(env, key, 1800, 'GET');
        const upstream = await fetch(signedUrl, {
            method: 'GET',
            headers: {
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });
        if (!upstream.ok) return null;

        const headers = new Headers();
        const contentType = upstream.headers.get('Content-Type') || '';
        if (contentType) headers.set('Content-Type', contentType);
        const contentLength = upstream.headers.get('Content-Length');
        if (contentLength) headers.set('Content-Length', contentLength);
        headers.set('Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('CDN-Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('Cloudflare-CDN-Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('X-Moran-Preset-Image-Cache', 'miss');
        headers.set('X-Moran-Preset-Image-Source', 'hi168-s3');
        Object.entries(APK_CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));

        return new Response(method === 'HEAD' ? null : upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers
        });
    } catch {
        return null;
    }
};

const buildPresetImageResponse = async (
    context: any,
    method: 'GET' | 'HEAD'
): Promise<Response> => {
    const { request, env } = context;
    try {
        const decodedPath = readPresetImagePath(request, context.params);

        if (!decodedPath) {
            return buildErrorResponse('Preset image path is empty', 400);
        }

        // Validate the path: accept full-size .png or thumbs/*.webp
        const isValid = ANY_IMAGE_PATTERN.test(decodedPath)
            || ANY_THUMB_PATTERN.test(decodedPath)
            || S3_KEY_PATTERN.test(decodedPath);
        if (!isValid) {
            return buildErrorResponse(`Invalid preset image path: ${decodedPath}`, 400);
        }

        // Edge cache lookup
        const cache = method === 'GET' && typeof caches !== 'undefined' ? caches.default : null;
        const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
        if (cache) {
            const cached = await cache.match(cacheKey);
            if (cached) {
                const headers = new Headers(cached.headers);
                headers.set('X-Moran-Preset-Image-Cache', 'hit');
                return method === 'HEAD'
                    ? new Response(null, { status: cached.status, statusText: cached.statusText, headers })
                    : new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
            }
        }

        // Try legacy hi168 S3 first for s3_ pattern keys
        if (S3_KEY_PATTERN.test(decodedPath)) {
            const legacyResponse = await tryLegacyS3(env, decodedPath, cache, request, method);
            if (legacyResponse) {
                if (cache && method === 'GET') {
                    context.waitUntil?.(cache.put(cacheKey, legacyResponse.clone()));
                }
                return legacyResponse;
            }
        }

        // Proxy through OpenList OneDrive
        const oneDriveResponse = await proxyFromOneDrive(env, decodedPath, cache, request);
        const finalResponse = method === 'HEAD'
            ? new Response(null, { status: oneDriveResponse.status, statusText: oneDriveResponse.statusText, headers: oneDriveResponse.headers })
            : oneDriveResponse;

        if (cache && method === 'GET') {
            context.waitUntil?.(cache.put(cacheKey, finalResponse.clone()));
        }
        return finalResponse;
    } catch (error: any) {
        return buildErrorResponse(error?.message || 'Preset image proxy failed', 502);
    }
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export const onRequestGet = (context: any): Promise<Response> => buildPresetImageResponse(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => buildPresetImageResponse(context, 'HEAD');
