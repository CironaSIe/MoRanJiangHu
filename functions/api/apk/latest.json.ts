import {
    APK_CORS_HEADERS,
    buildSignedObjectUrl,
    buildTextResponse,
    normalizeObjectKey,
    readReleaseBaseUrl,
    readReleaseObjectPrefix
} from './_shared';

const pickHeaders = (source: Headers): Headers => {
    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store,no-cache,max-age=0,must-revalidate',
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
        const prefix = readReleaseObjectPrefix(env);
        const r2Object = env?.CNB_SYNC_R2
            ? await env.CNB_SYNC_R2.get(normalizeObjectKey(`${prefix}/latest.json`))
            : null;
        if (r2Object) {
            const payload = await r2Object.json();
            const baseUrl = readReleaseBaseUrl(request, env);
            const stableApkUrl = `${baseUrl}/api/apk/latest.apk`;
            const stableManifestUrl = `${baseUrl}/api/apk/latest.json`;
            const nextPayload = {
                ...payload,
                latest: {
                    ...(payload?.latest || {}),
                    apkUrl: stableApkUrl,
                    manifestUrl: stableManifestUrl
                }
            };
            const headers = new Headers({
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store,no-cache,max-age=0,must-revalidate',
                ...APK_CORS_HEADERS
            });
            if (r2Object.etag) headers.set('ETag', r2Object.etag);
            return new Response(JSON.stringify(nextPayload, null, 2), {
                status: 200,
                headers
            });
        }
        const manifestUrl = await buildSignedObjectUrl(env, normalizeObjectKey(`${prefix}/latest.json`), 300);
        const upstream = await fetch(manifestUrl, { headers: { Accept: 'application/json' } });
        if (!upstream.ok) {
            return buildTextResponse(`APK manifest fetch failed: ${upstream.status}`, upstream.status);
        }
        const payload = await upstream.json();
        const baseUrl = readReleaseBaseUrl(request, env);
        const stableApkUrl = `${baseUrl}/api/apk/latest.apk`;
        const stableManifestUrl = `${baseUrl}/api/apk/latest.json`;
        const nextPayload = {
            ...payload,
            latest: {
                ...(payload?.latest || {}),
                apkUrl: stableApkUrl,
                manifestUrl: stableManifestUrl
            }
        };
        return new Response(JSON.stringify(nextPayload, null, 2), {
            status: 200,
            headers: pickHeaders(upstream.headers)
        });
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK manifest proxy failed', 502);
    }
}

export const onRequestHead = onRequestGet;
