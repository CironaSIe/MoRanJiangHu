import {
    APK_LATEST_CACHE_CONTROL,
    APK_CORS_HEADERS,
    buildVersionedApkFileName,
    buildTextResponse,
    readReleaseBaseUrl,
    readManifestPayload,
    readManifestVersionName
} from './_shared';

const DEFAULT_GITHUB_RELEASE_ACCELERATORS = [
    'https://gh.ddlc.top',
    'https://gh-proxy.com',
    'https://gh-proxy.ygxz.in',
    'https://ghfast.top'
];

const buildGitHubReleaseDownloadUrl = (versionName: string, fileName: string): string => (
    `https://github.com/ypq123456789/MoRanJiangHu/releases/download/v${versionName}/${fileName}`
);

const buildGitHubAcceleratedUrls = (versionName: string, fileName: string): string[] => {
    if (!versionName || !fileName) return [];
    const directUrl = buildGitHubReleaseDownloadUrl(versionName, fileName);
    return DEFAULT_GITHUB_RELEASE_ACCELERATORS.map((baseUrl) => `${baseUrl}/${directUrl}`);
};

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
        // KV manifest 有两种格式，使用兼容的 versionName 读取函数
        const versionName = readManifestVersionName(payload);
        const baseUrl = readReleaseBaseUrl(request, env);
        const versionedFileName = buildVersionedApkFileName(versionName);
        const stableApkUrl = versionedFileName
            ? `${baseUrl}/api/apk/version/${encodeURIComponent(versionedFileName)}`
            : `${baseUrl}/api/apk/latest.apk`;
        const stableManifestUrl = `${baseUrl}/api/apk/latest.json`;
        const latestApkUrl = `${baseUrl}/api/apk/latest.apk`;
        const b2ApkUrl = versionedFileName
            ? `${baseUrl}/api/apk/version/${encodeURIComponent(versionedFileName)}?provider=b2`
            : `${baseUrl}/api/apk/latest.apk?provider=b2`;
        const oneDriveApkUrl = `${baseUrl}/api/apk/latest.apk?provider=onedrive`;
        const githubApkUrl = versionedFileName
            ? `${baseUrl}/api/apk/version/${encodeURIComponent(versionedFileName)}?provider=github`
            : `${baseUrl}/api/apk/latest.apk?provider=github`;
        const githubDirectApkUrl = versionedFileName ? buildGitHubReleaseDownloadUrl(versionName, versionedFileName) : '';
        const githubAcceleratedApkUrls = versionedFileName ? buildGitHubAcceleratedUrls(versionName, versionedFileName) : [];
        const nextPayload = {
            ...payload,
            latest: {
                ...payload?.latest,
                versionName,
                versionCode: payload?.latest?.versionCode || payload?.versionCode,
                apkUrl: stableApkUrl,
                directApkUrl: latestApkUrl,
                apkUrls: [
                    latestApkUrl,
                    stableApkUrl,
                    b2ApkUrl,
                    githubApkUrl,
                    ...githubAcceleratedApkUrls,
                    oneDriveApkUrl
                ].filter(Boolean),
                r2ApkUrl: '',
                hi168ApkUrl: '',
                b2ApkUrl,
                githubApkUrl,
                githubDirectApkUrl,
                githubAcceleratedApkUrls,
                oneDriveApkUrl,
                latestApkUrl,
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
