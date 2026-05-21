import {
    APK_LATEST_CACHE_CONTROL,
    APK_CORS_HEADERS,
    buildVersionedApkFileName,
    buildSignedObjectUrl,
    buildTextResponse,
    normalizeObjectKey,
    readReleaseBaseUrl,
    readManifestPayload,
    readReleaseObjectPrefix
} from './_shared';

const pickHeaders = (source: Headers): Headers => {
    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': APK_LATEST_CACHE_CONTROL,
        ...APK_CORS_HEADERS
    });
    ['ETag', 'Last-Modified'].forEach((name) => {
        const value = source.get(name);
        if (value) headers.set(name, value);
    });
    return headers;
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        const manifest = await readManifestPayload(env);
        if (!manifest) return buildTextResponse('APK manifest not found', 404);
        const payload = manifest.payload;
        const baseUrl = readReleaseBaseUrl(request, env);
        const versionedFileName = buildVersionedApkFileName(payload?.latest?.versionName);
        const stableApkUrl = versionedFileName
            ? `${baseUrl}/api/apk/version/${encodeURIComponent(versionedFileName)}`
            : `${baseUrl}/api/apk/latest.apk`;
        const directApkKey = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/${versionedFileName || 'latest.apk'}`);
        const directApkUrl = await buildSignedObjectUrl(env, directApkKey, 3600);
        const stableManifestUrl = `${baseUrl}/api/apk/latest.json`;
        const nextPayload = {
            ...payload,
            latest: {
                ...(payload?.latest || {}),
                apkUrl: directApkUrl || stableApkUrl,
                directApkUrl: directApkUrl || undefined,
                apkUrls: [
                    directApkUrl,
                    stableApkUrl,
                    `${baseUrl}/api/apk/latest.apk`
                ].filter(Boolean),
                latestApkUrl: `${baseUrl}/api/apk/latest.apk`,
                manifestUrl: stableManifestUrl
            }
        };
        return new Response(JSON.stringify(nextPayload, null, 2), {
            status: 200,
            headers: pickHeaders(manifest.sourceHeaders)
        });
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK manifest proxy failed', 502);
    }
}

export const onRequestHead = onRequestGet;
