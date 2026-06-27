import {
    APK_CORS_HEADERS,
    APK_LATEST_CACHE_CONTROL,
    buildB2ApkRedirect,
    buildGitHubApkRedirect,
    buildOneDriveApkRedirect,
    buildVersionedApkFileName,
    buildTextResponse,
    normalizeObjectKey,
    readManifestPayload,
    readManifestPreferredApkProvider,
    readManifestVersionName,
    readReleaseObjectPrefix
} from './_shared';

const handleLatestApkRequest = async ({ request, env }: any): Promise<Response> => {
    try {
        const manifest = await readManifestPayload(env);
        const versionName = readManifestVersionName(manifest?.payload);
        const versionedFileName = buildVersionedApkFileName(versionName);
        const fileName = versionedFileName || 'MoRanJiangHu-latest.apk';
        const prefix = readReleaseObjectPrefix(env);
        const key = normalizeObjectKey(`${prefix}/${versionedFileName || 'latest.apk'}`);
        const requestedProvider = new URL(request.url).searchParams.get('provider');
        const provider = requestedProvider || readManifestPreferredApkProvider(manifest?.payload);
        if (provider === 'onedrive') {
            const oneDriveResponse = await buildOneDriveApkRedirect(env, fileName, APK_LATEST_CACHE_CONTROL);
            if (oneDriveResponse) return oneDriveResponse;
            return buildTextResponse('OneDrive APK not available', 502);
        }
        if (provider === 'github') {
            const githubResponse = buildGitHubApkRedirect(versionName, fileName, APK_LATEST_CACHE_CONTROL);
            if (githubResponse) return githubResponse;
            return buildTextResponse('GitHub Release APK not available', 502);
        }
        return buildB2ApkRedirect(env, key, fileName, APK_LATEST_CACHE_CONTROL);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export const onRequestGet = handleLatestApkRequest;
export const onRequestHead = handleLatestApkRequest;
