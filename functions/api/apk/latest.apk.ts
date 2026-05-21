import {
    APK_CORS_HEADERS,
    APK_LATEST_CACHE_CONTROL,
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
            return new Response(null, {
                status: 302,
                headers: {
                    Location: signedUrl,
                    'Cache-Control': APK_LATEST_CACHE_CONTROL,
                    'Content-Type': 'application/vnd.android.package-archive',
                    'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                    'X-Moran-Apk-Source': 'hi168-redirect',
                    ...APK_CORS_HEADERS
                }
            });
        } catch (error) {
            console.warn('APK object storage download failed, falling back to R2:', error);
        }
        const r2Object = env?.CNB_SYNC_R2 ? await env.CNB_SYNC_R2.get(key) : null;
        if (r2Object) {
            const headers = new Headers({
                'Content-Type': 'application/vnd.android.package-archive',
                'Cache-Control': APK_LATEST_CACHE_CONTROL,
                'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                ...APK_CORS_HEADERS
            });
            r2Object.writeHttpMetadata?.(headers);
            if (r2Object.etag) headers.set('ETag', r2Object.etag);
            return new Response(r2Object.body, { status: 200, headers });
        }
        return buildTextResponse('APK latest object not found', 404);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}

export async function onRequestHead({ env }: any): Promise<Response> {
    try {
        const key = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/latest.apk`);
        const signedUrl = await buildSignedObjectUrl(env, key, 1800, 'HEAD');
        return new Response(null, {
            status: 302,
            headers: {
                Location: signedUrl,
                'Cache-Control': APK_LATEST_CACHE_CONTROL,
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                'X-Moran-Apk-Source': 'hi168-redirect',
                ...APK_CORS_HEADERS
            }
        });
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}
