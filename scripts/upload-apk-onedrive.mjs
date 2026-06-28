import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

const readEnv = (name, fallback = '') => String(process.env[name] || fallback).trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const defaultTargetsForVersion = (versionName) => [
  {
    filePath: '/Onedrive/MoRanJiangHu/releases/latest.apk',
    cacheControl: 'public, max-age=3600, stale-while-revalidate=86400'
  },
  {
    filePath: `/Onedrive/MoRanJiangHu/releases/MoRanJiangHu-v${versionName}.apk`,
    cacheControl: 'public, max-age=86400, stale-while-revalidate=604800'
  }
];

const shouldRetryUploadError = (error) => {
  const message = String(error?.message || error || '');
  const code = String(error?.code || error?.cause?.code || '');
  return [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNABORTED',
    'EAI_AGAIN',
    'fetch failed',
    'timeout',
    '5'
  ].some((needle) => code.includes(needle) || message.includes(needle));
};

export const uploadApkToOpenList = async ({
  apkBytes,
  versionName,
  baseUrl = 'https://openlist.bacon.de5.net',
  authToken,
  timeoutMs = 10 * 60 * 1000,
  maxAttempts = 4,
  fetchImpl = fetch,
  onRetry = () => {}
}) => {
  if (!authToken) throw new Error('Missing MORAN_OPENLIST_AUTH_TOKEN.');
  if (!versionName) throw new Error('release.config.json versionName is empty.');
  if (!apkBytes?.byteLength) throw new Error('APK bytes are empty.');

  const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, '');
  const targets = defaultTargetsForVersion(versionName);

  const putFile = async ({ filePath, cacheControl }) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetchImpl(`${normalizedBaseUrl}/api/fs/put`, {
          method: 'PUT',
          headers: {
            Authorization: authToken,
            'File-Path': filePath,
            'Content-Type': 'application/vnd.android.package-archive',
            'Cache-Control': cacheControl
          },
          body: apkBytes,
          signal: AbortSignal.timeout(timeoutMs)
        });
        const text = await response.text().catch(() => '');
        let payload = null;
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(`OpenList upload returned non-JSON for ${filePath}: HTTP ${response.status} ${text.slice(0, 160)}`);
        }
        if (!response.ok || payload?.code !== 200) {
          throw new Error(`OpenList upload failed for ${filePath}: HTTP ${response.status} ${text.slice(0, 300)}`);
        }
        return;
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts || !shouldRetryUploadError(error)) break;
        onRetry({ filePath, attempt, maxAttempts, error });
        await sleep(Math.min(30000, 1000 * 2 ** (attempt - 1)));
      }
    }
    throw lastError;
  };

  for (const target of targets) {
    await putFile(target);
  }

  return {
    ok: true,
    latestPath: targets[0].filePath,
    versionedPath: targets[1].filePath,
    bytes: apkBytes.byteLength,
    versionName
  };
};

const uploadApkToOpenListWithCurl = ({
  apkPath,
  versionName,
  baseUrl,
  authToken,
  timeoutMs
}) => {
  if (!authToken) throw new Error('Missing MORAN_OPENLIST_AUTH_TOKEN.');
  if (!versionName) throw new Error('release.config.json versionName is empty.');
  if (!fs.existsSync(apkPath)) throw new Error(`APK not found: ${apkPath}`);

  const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, '');
  const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const targets = defaultTargetsForVersion(versionName);
  const maxTimeSeconds = String(Math.ceil(timeoutMs / 1000));

  for (const target of targets) {
    console.log(`[OpenList] uploading ${target.filePath}...`);
    const result = spawnSync(curl, [
      '--fail',
      '--silent',
      '--show-error',
      '--location',
      '--retry', '5',
      '--retry-delay', '3',
      '--retry-all-errors',
      '--max-time', maxTimeSeconds,
      '-X', 'PUT',
      '-H', `Authorization: ${authToken}`,
      '-H', `File-Path: ${target.filePath}`,
      '-H', 'Content-Type: application/vnd.android.package-archive',
      '-H', `Cache-Control: ${target.cacheControl}`,
      '--data-binary', `@${apkPath}`,
      `${normalizedBaseUrl}/api/fs/put`
    ], {
      cwd: rootDir,
      encoding: 'utf8',
      timeout: timeoutMs + 60 * 1000
    });

    if (result.status !== 0) {
      throw new Error(`OpenList curl upload failed for ${target.filePath}: ${(result.stderr || result.stdout || '').slice(0, 500)}`);
    }

    const payload = JSON.parse(result.stdout || '{}');
    if (payload?.code !== 200) {
      throw new Error(`OpenList curl upload rejected for ${target.filePath}: ${(result.stdout || '').slice(0, 500)}`);
    }
  }

  const bytes = fs.statSync(apkPath).size;
  return {
    ok: true,
    latestPath: targets[0].filePath,
    versionedPath: targets[1].filePath,
    bytes,
    versionName
  };
};

if (isMain) {
  const baseUrl = readEnv('MORAN_OPENLIST_BASE_URL', 'https://openlist.bacon.de5.net');
  const authToken = readEnv('MORAN_OPENLIST_AUTH_TOKEN');
  const apkPath = path.resolve(
    process.argv[2] || path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  );
  const releaseInfo = JSON.parse(fs.readFileSync(path.join(rootDir, 'release.config.json'), 'utf8'));
  const versionName = String(releaseInfo.versionName || '').trim();
  const timeoutMs = Math.max(1000, Number(process.env.MORAN_OPENLIST_UPLOAD_TIMEOUT_MS || 10 * 60 * 1000));

  if (!fs.existsSync(apkPath)) throw new Error(`APK not found: ${apkPath}`);
  const result = uploadApkToOpenListWithCurl({
    apkPath,
    versionName,
    baseUrl,
    authToken,
    timeoutMs
  });

  console.log(JSON.stringify(result, null, 2));
}
