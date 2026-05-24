import {
    APK_CORS_HEADERS,
    APK_LATEST_CACHE_CONTROL,
    buildR2ApkResponse,
    buildSignedObjectUrl,
    buildVersionedApkHeaders,
    buildTextResponse,
    normalizeObjectKey,
    pickApkProvider,
    readManifestPayload,
    readReleaseObjectPrefix
} from '../_shared';

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

const toHeadResponse = (response: Response): Response => (
    new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers })
);

const objectExists = async (env: any, key: string): Promise<boolean> => {
    const signedHeadUrl = await buildSignedObjectUrl(env, key, 1800, 'HEAD');
    const response = await fetch(signedHeadUrl, { method: 'HEAD' });
    return response.ok;
};

const buildLatestApkRedirect = async (env: any, fileName: string, method: 'GET' | 'HEAD'): Promise<Response> => {
    const key = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/latest.apk`);
    const signedUrl = await buildSignedObjectUrl(env, key, 1800, method);
    return new Response(null, {
        status: 302,
        headers: {
            Location: signedUrl,
            'Content-Type': 'application/vnd.android.package-archive',
            'Cache-Control': APK_LATEST_CACHE_CONTROL,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'X-Moran-Apk-Source': 'hi168-latest-fallback',
            ...APK_CORS_HEADERS
        }
    });
};

const buildHi168LatestApkRedirect = async (env: any, fileName: string, method: 'GET' | 'HEAD'): Promise<Response> => {
    const key = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/latest.apk`);
    const signedUrl = await buildSignedObjectUrl(env, key, 1800, method);
    return new Response(null, {
        status: 302,
        headers: {
            Location: signedUrl,
            'Content-Type': 'application/vnd.android.package-archive',
            'Cache-Control': APK_LATEST_CACHE_CONTROL,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'X-Moran-Apk-Source': 'hi168-latest-redirect',
            ...APK_CORS_HEADERS
        }
    });
};

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

const handleVersionedApkRequest = async (context: any, method: 'GET' | 'HEAD'): Promise<Response> => {
    const { request, env, params } = context;
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
        const preferredProvider = pickApkProvider(request, manifest?.payload);
        if (preferredProvider === 'r2') {
            const r2Response = await buildR2ApkResponse(env, key, fileName, method, 'r2-preferred');
            if (r2Response) return r2Response;
        }
        if (preferredProvider === 'hi168') {
            return buildHi168LatestApkRedirect(env, fileName, method);
        }
        try {
            const signedUrl = await buildSignedObjectUrl(env, key, 1800, method);
            if (!(await objectExists(env, key))) {
                console.warn(`Versioned APK object missing, falling back to latest.apk: ${key}`);
                return buildLatestApkRedirect(env, fileName, method);
            }
            return new Response(null, {
                status: 302,
                headers: {
                    Location: signedUrl,
                    ...Object.fromEntries(buildVersionedApkHeaders(fileName, undefined, 'hi168-redirect'))
                }
            });
        } catch (error) {
            console.warn('Versioned APK object storage download failed, falling back to R2:', error);
        }

        const r2Response = await buildR2ApkResponse(env, key, fileName, method, 'r2-fallback');
        if (r2Response) return r2Response;

        return buildTextResponse('APK version not found', 404);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Versioned APK download failed', 502);
    }
};

export const onRequestGet = (context: any): Promise<Response> => handleVersionedApkRequest(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => handleVersionedApkRequest(context, 'HEAD');
