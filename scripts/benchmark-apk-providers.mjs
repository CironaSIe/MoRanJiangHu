import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const releaseInfo = JSON.parse(fs.readFileSync(path.join(rootDir, 'release.config.json'), 'utf8'));
const websiteBaseUrl = String(process.env.MORAN_RELEASE_BENCHMARK_BASE_URL || releaseInfo.websiteUrl || '').replace(/\/+$/, '');
const versionedFileName = `MoRanJiangHu-v${releaseInfo.versionName}.apk`;
const outputDir = path.join(rootDir, 'output');
fs.mkdirSync(outputDir, { recursive: true });

if (!websiteBaseUrl) {
  throw new Error('Missing website URL for APK provider benchmark.');
}

const providers = [
  {
    provider: 'r2',
    url: `${websiteBaseUrl}/api/apk/version/${encodeURIComponent(versionedFileName)}?provider=r2`
  },
  {
    provider: 'hi168',
    url: `${websiteBaseUrl}/api/apk/version/${encodeURIComponent(versionedFileName)}?provider=hi168`
  }
];

const timeoutMs = Math.max(1000, Number(process.env.MORAN_APK_PROVIDER_BENCHMARK_TIMEOUT_MS || 120000));
const expectedSize = Number(process.env.MORAN_APK_PROVIDER_BENCHMARK_EXPECTED_SIZE || 0);

const download = async ({ provider, url }) => {
  const target = path.join(outputDir, `apk-provider-benchmark-${provider}.apk`);
  try {
    fs.rmSync(target, { force: true });
  } catch {}
  const started = performance.now();
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`${provider} download failed: HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const elapsedMs = performance.now() - started;
  const bytes = Buffer.from(arrayBuffer);
  fs.writeFileSync(target, bytes);
  if (expectedSize > 0 && bytes.byteLength !== expectedSize) {
    throw new Error(`${provider} size mismatch: got ${bytes.byteLength}, expected ${expectedSize}`);
  }
  return {
    provider,
    url,
    bytes: bytes.byteLength,
    elapsedMs: Math.round(elapsedMs),
    mbps: Number(((bytes.byteLength * 8) / 1024 / 1024 / (elapsedMs / 1000)).toFixed(2)),
    output: target
  };
};

const results = [];
for (const provider of providers) {
  try {
    results.push(await download(provider));
  } catch (error) {
    results.push({
      provider: provider.provider,
      url: provider.url,
      error: error?.message || String(error)
    });
  }
}

const successful = results
  .filter((item) => !item.error)
  .sort((a, b) => b.mbps - a.mbps);
const preferredApkProvider = successful[0]?.provider || 'r2';

const report = {
  versionName: releaseInfo.versionName,
  versionCode: releaseInfo.versionCode,
  benchmarkedAt: new Date().toISOString(),
  preferredApkProvider,
  results
};

const reportPath = path.join(outputDir, `apk-provider-benchmark-v${releaseInfo.versionName}.json`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
console.log(`Preferred APK provider: ${preferredApkProvider}`);
console.log(`Report: ${reportPath}`);
