import {
    APK_CORS_HEADERS,
    APK_LATEST_CACHE_CONTROL,
    buildR2ApkResponse,
    buildSignedObjectUrl,
    buildVersionedApkFileName,
    buildTextResponse,
    normalizeObjectKey,
    pickApkProvider,
    readManifestPayload,
    readReleaseObjectPrefix
} from './_shared';

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        const manifest = await readManifestPayload(env);
        const versionedFileName = buildVersionedApkFileName(manifest?.payload?.latest?.versionName);
        const fileName = versionedFileName || 'MoRanJiangHu-latest.apk';
        const prefix = readReleaseObjectPrefix(env);
        const versionedKey = normalizeObjectKey(`${prefix}/${versionedFileName || 'latest.apk'}`);
        const latestKey = normalizeObjectKey(`${prefix}/latest.apk`);
        const selectedProvider = pickApkProvider(request, manifest?.payload);
        const key = selectedProvider === 'hi168' ? latestKey : versionedKey;
        if (selectedProvider === 'r2' && versionedFileName) {
            const r2Response = await buildR2ApkResponse(env, key, fileName, 'GET', 'r2-preferred');
            if (r2Response) return r2Response;
        }
        try {
            const signedUrl = await buildSignedObjectUrl(env, key, 1800);
            return new Response(null, {
                status: 302,
                headers: {
                    Location: signedUrl,
                    'Cache-Control': APK_LATEST_CACHE_CONTROL,
                    'Content-Type': 'application/vnd.android.package-archive',
                    'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                    'X-Moran-Apk-Source': versionedFileName ? 'hi168-versioned-redirect' : 'hi168-redirect',
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

export async function onRequestHead({ request, env }: any): Promise<Response> {
    try {
        const manifest = await readManifestPayload(env);
        const versionedFileName = buildVersionedApkFileName(manifest?.payload?.latest?.versionName);
        const fileName = versionedFileName || 'MoRanJiangHu-latest.apk';
        const prefix = readReleaseObjectPrefix(env);
        const versionedKey = normalizeObjectKey(`${prefix}/${versionedFileName || 'latest.apk'}`);
        const latestKey = normalizeObjectKey(`${prefix}/latest.apk`);
        const selectedProvider = pickApkProvider(request, manifest?.payload);
        const key = selectedProvider === 'hi168' ? latestKey : versionedKey;
        if (selectedProvider === 'r2' && versionedFileName) {
            const r2Response = await buildR2ApkResponse(env, key, fileName, 'HEAD', 'r2-preferred');
            if (r2Response) return r2Response;
        }
        const signedUrl = await buildSignedObjectUrl(env, key, 1800, 'HEAD');
        return new Response(null, {
            status: 302,
            headers: {
                Location: signedUrl,
                'Cache-Control': APK_LATEST_CACHE_CONTROL,
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Disposition': 'attachment; filename="MoRanJiangHu-latest.apk"',
                'X-Moran-Apk-Source': versionedFileName ? 'hi168-versioned-redirect' : 'hi168-redirect',
                ...APK_CORS_HEADERS
            }
        });
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}
