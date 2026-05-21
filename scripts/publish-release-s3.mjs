import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

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

const readEnv = (name, fallback = '') => String(process.env[name] || fallback).trim();
const endpoint = readEnv('MORAN_OSS_ENDPOINT', 'https://s3.hi168.com').replace(/\/+$/, '');
const bucket = readEnv('MORAN_OSS_BUCKET');
const accessKey = readEnv('MORAN_OSS_ACCESS_KEY');
const secretKey = readEnv('MORAN_OSS_SECRET_KEY');
const prefix = readEnv('MORAN_OSS_RELEASE_PREFIX', releaseInfo.r2Prefix || 'moranjianghu').replace(/^\/+|\/+$/g, '');
const region = readEnv('MORAN_OSS_REGION', 'auto');
const usePublicReadAcl = readEnv('MORAN_OSS_PUBLIC_READ_ACL', '0') === '1';
const service = 's3';
const requestTimeoutMs = Math.max(1000, Number(process.env.MORAN_OSS_TIMEOUT_MS || 10 * 60 * 1000));

if (!bucket || !accessKey || !secretKey) {
  throw new Error('Missing MORAN_OSS_BUCKET, MORAN_OSS_ACCESS_KEY, or MORAN_OSS_SECRET_KEY.');
}

const normalizeKey = (key) => key.replace(/^\/+/, '').replace(/\/+/g, '/');
const encodeKey = (key) => normalizeKey(key)
  .split('/')
  .map((part) => encodeURIComponent(part))
  .join('/');
const objectUrl = (key) => new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodeKey(key)}`);
const publicUrl = (key) => objectUrl(key).toString();

const latestKey = normalizeKey(`${prefix}/latest.apk`);
const versionedKey = normalizeKey(`${prefix}/MoRanJiangHu-v${releaseInfo.versionName}.apk`);
const versionedFileName = path.basename(versionedKey);
const manifestKey = normalizeKey(`${prefix}/latest.json`);
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
    apkUrl: `${String(releaseInfo.websiteUrl || '').replace(/\/+$/, '')}/api/apk/version/${encodeURIComponent(versionedFileName)}`,
    latestApkUrl: `${String(releaseInfo.websiteUrl || '').replace(/\/+$/, '')}/api/apk/latest.apk`,
    manifestUrl: publicUrl(manifestKey),
    publishedAt: releaseInfo.releasePublishedAt || new Date().toISOString(),
    changes: Array.isArray(releaseInfo.releaseNotes) ? releaseInfo.releaseNotes : []
  },
  history: Array.isArray(releaseInfo.releaseHistory) ? releaseInfo.releaseHistory : []
};

const manifestPath = path.join(os.tmpdir(), `moranjianghu-release-s3-${Date.now()}.json`);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const sha256Hex = (body) => crypto.createHash('sha256').update(body).digest('hex');
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();
const hmacHex = (key, value) => crypto.createHmac('sha256', key).update(value).digest('hex');
const formatAmzDate = (date) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
};
const signingKey = (dateStamp) => {
  const kDate = hmac(Buffer.from(`AWS4${secretKey}`, 'utf8'), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
};

const cacheControl = 'no-store,no-cache,max-age=0,must-revalidate';

const buildSignedHeaders = ({ method, url, body, contentType }) => {
  const { amzDate, dateStamp } = formatAmzDate(new Date());
  const bodyHash = sha256Hex(body);
  const query = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const canonicalHeaders = [
    `cache-control:${cacheControl}\n`,
    `content-type:${contentType}\n`,
    `host:${url.host}\n`,
    `x-amz-content-sha256:${bodyHash}\n`,
    usePublicReadAcl ? 'x-amz-acl:public-read\n' : '',
    `x-amz-date:${amzDate}\n`
  ].join('');
  const signedHeaders = usePublicReadAcl
    ? 'cache-control;content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date'
    : 'cache-control;content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    url.pathname,
    query,
    canonicalHeaders,
    signedHeaders,
    bodyHash
  ].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');
  const signature = hmacHex(signingKey(dateStamp), stringToSign);

  return {
    'Cache-Control': cacheControl,
    'Content-Type': contentType,
    ...(usePublicReadAcl ? { 'x-amz-acl': 'public-read' } : {}),
    'X-Amz-Content-Sha256': bodyHash,
    'X-Amz-Date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
};

const putObject = async ({ key, filePath, body, contentType }) => {
  const bytes = body || fs.readFileSync(filePath);
  const url = objectUrl(key);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...buildSignedHeaders({ method: 'PUT', url, body: bytes, contentType })
      },
      body: bytes,
      signal: controller.signal
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PUT ${key} failed (${response.status}): ${text.slice(0, 500)}`);
    }
  } finally {
    clearTimeout(timer);
  }
};

await putObject({
  key: latestKey,
  filePath: apkPath,
  contentType: 'application/vnd.android.package-archive'
});
await putObject({
  key: versionedKey,
  filePath: apkPath,
  contentType: 'application/vnd.android.package-archive'
});
await putObject({
  key: manifestKey,
  filePath: manifestPath,
  contentType: 'application/json'
});

console.log(`S3 publish complete:
- ${publicUrl(latestKey)}
- ${publicUrl(manifestKey)}
- ${publicUrl(versionedKey)}
- apkSha256=${apkSha256}
- apkSize=${apkSize}`);
