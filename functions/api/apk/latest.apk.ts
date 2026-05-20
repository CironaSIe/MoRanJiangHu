import {
    APK_CORS_HEADERS,
    buildSignedObjectUrl,
    buildTextResponse,
    normalizeObjectKey,
    readReleaseObjectPrefix
} from './_shared';

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export async function onRequestGet({ env }: any): Promise<Response> {
    try {
        const key = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/latest.apk`);
        try {
            const signedUrl = await buildSignedObjectUrl(env, key, 1800);
            const upstream = await fetch(signedUrl, { headers: { Accept: 'application/vnd.android.package-archive,*/*' } });
            if (upstream.ok && upstream.body) {
                const headers = new Headers({
                    'Content-Type': 'application/vnd.android.package-archive',
                    'Cache-Control': 'no-store,no-cache,max-age=0,must-revalidate',
                    'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                    ...APK_CORS_HEADERS
                });
                const contentLength = upstream.headers.get('Content-Length');
                if (contentLength) headers.set('Content-Length', contentLength);
                const etag = upstream.headers.get('ETag');
                if (etag) headers.set('ETag', etag);
                return new Response(upstream.body, { status: 200, headers });
            }
        } catch (error) {
            console.warn('APK object storage download failed, falling back to R2:', error);
        }
        const r2Object = env?.CNB_SYNC_R2 ? await env.CNB_SYNC_R2.get(key) : null;
        if (r2Object) {
            const headers = new Headers({
                'Content-Type': 'application/vnd.android.package-archive',
                'Cache-Control': 'no-store,no-cache,max-age=0,must-revalidate',
                'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                ...APK_CORS_HEADERS
            });
            r2Object.writeHttpMetadata?.(headers);
            if (r2Object.etag) headers.set('ETag', r2Object.etag);
            return new Response(r2Object.body, { status: 200, headers });
        }
        const signedUrl = await buildSignedObjectUrl(env, key, 1800);
        return Response.redirect(signedUrl, 302);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}

export const onRequestHead = onRequestGet;
