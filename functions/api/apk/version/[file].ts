import {
    APK_CORS_HEADERS,
    APK_VERSIONED_CACHE_CONTROL,
    buildSignedObjectUrl,
    buildTextResponse,
    normalizeObjectKey,
    readManifestPayload,
    readReleaseObjectPrefix
} from '../_shared';

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

const pickVersionedFileName = (request: Request, params: any): string => {
    const raw = typeof params?.file === 'string'
        ? params.file
        : new URL(request.url).pathname.split('/').pop() || '';
    const decoded = decodeURIComponent(raw);
    if (!/^MoRanJiangHu-v[0-9A-Za-z._-]+\.apk$/.test(decoded)) {
        throw new Error('APK version file name is invalid');
    }
    return decoded;
};

export async function onRequestGet({ request, env, params }: any): Promise<Response> {
    try {
        const fileName = pickVersionedFileName(request, params);
        const manifest = await readManifestPayload(env);
        const expectedFileName = manifest?.payload?.latest?.versionName
            ? `MoRanJiangHu-v${String(manifest.payload.latest.versionName).trim().replace(/[^0-9A-Za-z._-]/g, '')}.apk`
            : '';
        if (expectedFileName && fileName !== expectedFileName) {
            return buildTextResponse('APK version is no longer current', 404);
        }

        const key = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/${fileName}`);
        try {
            const signedUrl = await buildSignedObjectUrl(env, key, 1800);
            const upstream = await fetch(signedUrl, { headers: { Accept: 'application/vnd.android.package-archive,*/*' } });
            if (upstream.ok && upstream.body) {
                const headers = new Headers({
                    'Content-Type': 'application/vnd.android.package-archive',
                    'Cache-Control': APK_VERSIONED_CACHE_CONTROL,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    ...APK_CORS_HEADERS
                });
                const contentLength = upstream.headers.get('Content-Length');
                if (contentLength) headers.set('Content-Length', contentLength);
                const etag = upstream.headers.get('ETag');
                if (etag) headers.set('ETag', etag);
                const lastModified = upstream.headers.get('Last-Modified');
                if (lastModified) headers.set('Last-Modified', lastModified);
                return new Response(upstream.body, { status: 200, headers });
            }
        } catch (error) {
            console.warn('Versioned APK object storage download failed, falling back to R2:', error);
        }

        const r2Object = env?.CNB_SYNC_R2 ? await env.CNB_SYNC_R2.get(key) : null;
        if (r2Object) {
            const headers = new Headers({
                'Content-Type': 'application/vnd.android.package-archive',
                'Cache-Control': APK_VERSIONED_CACHE_CONTROL,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                ...APK_CORS_HEADERS
            });
            r2Object.writeHttpMetadata?.(headers);
            if (r2Object.etag) headers.set('ETag', r2Object.etag);
            return new Response(r2Object.body, { status: 200, headers });
        }

        return buildTextResponse('APK version not found', 404);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Versioned APK download failed', 502);
    }
}

export const onRequestHead = onRequestGet;
