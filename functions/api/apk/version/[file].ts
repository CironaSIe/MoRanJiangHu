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

const buildVersionedApkHeaders = (fileName: string, sourceHeaders?: Headers, source = 'hi168'): Headers => {
    const headers = new Headers({
        'Content-Type': 'application/vnd.android.package-archive',
        'Cache-Control': APK_VERSIONED_CACHE_CONTROL,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Moran-Apk-Source': source,
        ...APK_CORS_HEADERS
    });
    const contentLength = sourceHeaders?.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);
    const etag = sourceHeaders?.get('ETag');
    if (etag) headers.set('ETag', etag);
    const lastModified = sourceHeaders?.get('Last-Modified');
    if (lastModified) headers.set('Last-Modified', lastModified);
    return headers;
};

const toHeadResponse = (response: Response): Response => (
    new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers })
);

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
        try {
            const signedUrl = await buildSignedObjectUrl(env, key, 1800, method);
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

        const r2Object = env?.CNB_SYNC_R2 ? await env.CNB_SYNC_R2.get(key) : null;
        if (r2Object) {
            const headers = buildVersionedApkHeaders(fileName, undefined, 'r2-fallback');
            r2Object.writeHttpMetadata?.(headers);
            if (r2Object.etag) headers.set('ETag', r2Object.etag);
            const response = new Response(r2Object.body, { status: 200, headers });
            return method === 'HEAD' ? toHeadResponse(response) : response;
        }

        return buildTextResponse('APK version not found', 404);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Versioned APK download failed', 502);
    }
};

export const onRequestGet = (context: any): Promise<Response> => handleVersionedApkRequest(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => handleVersionedApkRequest(context, 'HEAD');
