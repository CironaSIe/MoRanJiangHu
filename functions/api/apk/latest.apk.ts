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
        const signedUrl = await buildSignedObjectUrl(env, key, 1800);
        return Response.redirect(signedUrl, 302);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}

export const onRequestHead = onRequestGet;
