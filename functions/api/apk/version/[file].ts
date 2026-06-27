import {
    APK_CORS_HEADERS,
    buildB2ApkRedirect,
    buildGitHubApkRedirect,
    buildVersionedApkFileName,
    buildOneDriveApkRedirect,
    buildTextResponse,
    normalizeObjectKey,
    readManifestPayload,
    readManifestPreferredApkProvider,
    readManifestVersionName,
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

const handleVersionedApkRequest = async (context: any, _method: 'GET' | 'HEAD'): Promise<Response> => {
    const { request, env, params } = context;
    try {
        const fileName = pickVersionedFileName(request, params);
        const manifest = await readManifestPayload(env);
        const versionName = readManifestVersionName(manifest?.payload);
        const expectedFileName = buildVersionedApkFileName(versionName);
        if (expectedFileName && fileName !== expectedFileName) {
            return buildTextResponse('APK version is no longer current', 404);
        }

        const requestedProvider = new URL(request.url).searchParams.get('provider');
        const provider = requestedProvider || readManifestPreferredApkProvider(manifest?.payload);
        if (provider === 'onedrive') {
            const oneDriveResponse = await buildOneDriveApkRedirect(env, fileName);
            if (oneDriveResponse) return oneDriveResponse;
            return buildTextResponse('OneDrive APK not available', 502);
        }
        if (provider === 'github') {
            const githubResponse = buildGitHubApkRedirect(versionName, fileName);
            if (githubResponse) return githubResponse;
            return buildTextResponse('GitHub Release APK not available', 502);
        }

        const key = normalizeObjectKey(`${readReleaseObjectPrefix(env)}/${fileName}`);
        return buildB2ApkRedirect(env, key, fileName);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Versioned APK download failed', 502);
    }
};

export const onRequestGet = (context: any): Promise<Response> => handleVersionedApkRequest(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => handleVersionedApkRequest(context, 'HEAD');
