import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const releaseInfo = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'release.config.json'), 'utf8')
);

const apkPath = path.resolve(
  process.argv[2] || path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
);

if (!fs.existsSync(apkPath)) {
  throw new Error(`APK not found: ${apkPath}`);
}

const bucket = releaseInfo.r2Bucket;
const prefix = String(releaseInfo.r2Prefix || '').replace(/^\/+|\/+$/g, '');
const manifestKey = `${bucket}/${prefix}/latest.json`;
const keepVersionedApkCount = Math.max(1, Number(process.env.MORAN_R2_KEEP_VERSIONED_APKS || 5));
const legacyDownloadBaseUrl = String(process.env.MORAN_R2_PUBLIC_BASE_URL || `https://download.bacon.de5.net/${prefix}`)
  .replace(/\/+$/, '');
const legacyManifestUrl = `${legacyDownloadBaseUrl}/latest.json`;
const readEnv = (name, fallback = '') => String(process.env[name] || fallback).trim();
const s3Endpoint = readEnv('MORAN_OSS_ENDPOINT', 'https://s3.hi168.com').replace(/\/+$/, '');
const s3Bucket = readEnv('MORAN_OSS_BUCKET');
const s3Prefix = readEnv('MORAN_OSS_RELEASE_PREFIX', releaseInfo.r2Prefix || 'moranjianghu').replace(/^\/+|\/+$/g, '');
const normalizeKey = (key) => key.replace(/^\/+/, '').replace(/\/+/g, '/');
const encodeKey = (key) => normalizeKey(key)
  .split('/')
  .map((part) => encodeURIComponent(part))
  .join('/');
const s3PublicUrl = (key) => {
  if (!s3Bucket) return '';
  return `${s3Endpoint}/${encodeURIComponent(s3Bucket)}/${encodeKey(key)}`;
};
const hi168VersionedApkUrl = s3PublicUrl(`${s3Prefix}/MoRanJiangHu-v${releaseInfo.versionName}.apk`);
const hi168LatestApkUrl = s3PublicUrl(`${s3Prefix}/latest.apk`);
const versionedApkUrl = readEnv('MORAN_RELEASE_VERSIONED_APK_URL', releaseInfo.apkDownloadUrl || hi168VersionedApkUrl);
const legacyLatestApkUrl = readEnv('MORAN_RELEASE_LATEST_APK_URL', releaseInfo.apkDownloadUrl || hi168LatestApkUrl);
const apkBuffer = fs.readFileSync(apkPath);
const apkSha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex');
const apkSize = apkBuffer.byteLength;

const manifest = {
  latest: {
    versionCode: releaseInfo.versionCode,
    versionName: releaseInfo.versionName,
    apkSha256,
    apkSize,
    releaseChannel: releaseInfo.releaseChannel,
    websiteUrl: releaseInfo.websiteUrl,
    githubRepoUrl: releaseInfo.githubRepoUrl,
    releaseNotesUrl: releaseInfo.releaseNotesUrl,
    apkUrl: `${versionedApkUrl}?v=${encodeURIComponent(releaseInfo.versionName)}-${encodeURIComponent(String(releaseInfo.versionCode))}`,
    latestApkUrl: legacyLatestApkUrl,
    manifestUrl: legacyManifestUrl,
    publishedAt: releaseInfo.releasePublishedAt || new Date().toISOString(),
    changes: Array.isArray(releaseInfo.releaseNotes) ? releaseInfo.releaseNotes : []
  },
  history: Array.isArray(releaseInfo.releaseHistory) ? releaseInfo.releaseHistory : []
};

const manifestPath = path.join(os.tmpdir(), `moranjianghu-release-${Date.now()}.json`);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const runWrangler = (args, options = {}) => {
  const result = spawnSync(command, ['wrangler', ...args], {
    cwd: rootDir,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: process.platform === 'win32',
    timeout: Number(process.env.MORAN_WRANGLER_TIMEOUT_MS || 10 * 60 * 1000),
    env: {
      ...process.env,
      HTTP_PROXY: '',
      HTTPS_PROXY: '',
      ALL_PROXY: ''
    },
    encoding: 'utf8'
  });
  if (result.error && result.error.code === 'ETIMEDOUT') {
    throw new Error(`Wrangler command timed out: ${args.join(' ')}`);
  }
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`Wrangler command failed: ${args.join(' ')}`);
  }
  return options.capture
    ? { ok: result.status === 0, stdout: result.stdout || '', stderr: result.stderr || '' }
    : result.status === 0;
};

const readCloudflareAccountId = () => {
  const fromEnv = String(process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '').trim();
  if (/^[a-f0-9]{32}$/i.test(fromEnv)) return fromEnv;
  const result = runWrangler(['whoami'], { capture: true, allowFailure: true });
  const match = `${result.stdout}\n${result.stderr}`.match(/│[^│]*│\s*([a-f0-9]{32})\s*│/i);
  return match ? match[1] : '';
};

const buildCloudflareHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    return headers;
  }
  const email = String(process.env.CLOUDFLARE_EMAIL || '').trim();
  const key = String(process.env.CLOUDFLARE_API_KEY || '').trim();
  if (email && key) {
    headers['X-Auth-Email'] = email;
    headers['X-Auth-Key'] = key;
  }
  return headers;
};

const encodeObjectKeyForPath = (key) => key
  .split('/')
  .map((part) => encodeURIComponent(part))
  .join('/');

const cloudflareApiRequest = async (accountId, requestPath, options = {}) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}${requestPath}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildCloudflareHeaders(),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(Number(process.env.MORAN_CLOUDFLARE_API_TIMEOUT_MS || 60 * 1000))
  });
  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const message = body?.errors?.[0]?.message || bodyText.slice(0, 240) || response.statusText;
    throw new Error(`Cloudflare R2 API failed (${response.status}): ${message}`);
  }
  return body || {};
};

const listExistingVersionedApks = async () => {
  const accountId = readCloudflareAccountId();
  const hasAuth = Boolean(process.env.CLOUDFLARE_API_TOKEN || (process.env.CLOUDFLARE_EMAIL && process.env.CLOUDFLARE_API_KEY));
  if (!accountId || !hasAuth) {
    console.warn('[R2 cleanup] Cloudflare API credentials/account id unavailable; falling back to release history cleanup.');
    return null;
  }

  const objectPrefix = `${prefix}/MoRanJiangHu-v`;
  const objects = [];
  let cursor = '';
  do {
    const params = new URLSearchParams({
      prefix: objectPrefix,
      per_page: '1000'
    });
    if (cursor) params.set('cursor', cursor);
    const body = await cloudflareApiRequest(
      accountId,
      `/r2/buckets/${encodeURIComponent(bucket)}/objects?${params.toString()}`
    );
    objects.push(...(Array.isArray(body.result) ? body.result : []));
    cursor = body.result_info?.is_truncated ? String(body.result_info?.cursor || '') : '';
  } while (cursor);

  const pattern = new RegExp(`^${objectPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.+)\\.apk$`);
  return objects
    .map((item) => {
      const key = typeof item?.key === 'string' ? item.key : '';
      const match = key.match(pattern);
      return match ? {
        key,
        versionName: match[1],
        lastModified: typeof item?.last_modified === 'string' ? item.last_modified : '',
        size: Number(item?.size || 0)
      } : null;
    })
    .filter(Boolean);
};

const deleteR2ObjectByApi = async (key) => {
  const accountId = readCloudflareAccountId();
  if (!accountId) throw new Error('Cloudflare account id unavailable');
  await cloudflareApiRequest(
    accountId,
    `/r2/buckets/${encodeURIComponent(bucket)}/objects/${encodeObjectKeyForPath(key)}`,
    { method: 'DELETE' }
  );
};

if (!versionedApkUrl) {
  throw new Error('Missing hi168/versioned APK URL. Run release:s3 first or set MORAN_RELEASE_VERSIONED_APK_URL.');
}

runWrangler([
  'r2', 'object', 'put', manifestKey,
  '--file', manifestPath,
  '--content-type', 'application/json',
  '--cache-control', 'no-store,no-cache,max-age=0,must-revalidate',
  '--remote'
]);

const historyVersionNames = Array.from(new Set([
  releaseInfo.versionName,
  ...(Array.isArray(releaseInfo.releaseHistory) ? releaseInfo.releaseHistory.map((item) => item?.versionName) : [])
].filter(Boolean)));
const existingVersionedApks = await listExistingVersionedApks();
const versionedApkNames = existingVersionedApks
  ? existingVersionedApks
      .map((item) => item.versionName)
      .sort((a, b) => {
        const ai = historyVersionNames.indexOf(a);
        const bi = historyVersionNames.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return b.localeCompare(a, undefined, { numeric: true });
      })
  : historyVersionNames;
const keptVersionNames = new Set(versionedApkNames.slice(0, keepVersionedApkCount));
const staleVersionedApks = existingVersionedApks
  ? existingVersionedApks.filter((item) => !keptVersionNames.has(item.versionName))
  : versionedApkNames
      .filter((versionName) => !keptVersionNames.has(versionName))
      .map((versionName) => ({ versionName, key: `${prefix}/MoRanJiangHu-v${versionName}.apk` }));
let deletedCount = 0;

for (const item of staleVersionedApks) {
  try {
    if (existingVersionedApks) {
      await deleteR2ObjectByApi(item.key);
      console.log(`[R2 cleanup] deleted existing stale APK: ${item.key}`);
      deletedCount += 1;
    } else {
      const deleted = runWrangler([
        'r2', 'object', 'delete', `${bucket}/${item.key}`,
        '--remote',
        '--force'
      ], { allowFailure: true });
      if (deleted) deletedCount += 1;
    }
  } catch (error) {
    console.warn(`[R2 cleanup] failed to delete ${item.key}: ${error?.message || error}`);
  }
}

console.log(`R2 publish complete:
- latest APK URL: ${legacyLatestApkUrl}
- versioned APK URL: ${versionedApkUrl}
- ${releaseInfo.updateManifestUrl}
- apkSha256=${apkSha256}
- apkSize=${apkSize}
- uploadedApkBinaryToR2=false
- keptVersionedApks=${Array.from(keptVersionNames).join(', ')}
- existingVersionedApks=${existingVersionedApks ? existingVersionedApks.length : 'unknown'}
- staleVersionedApksDeleted=${deletedCount}`);
