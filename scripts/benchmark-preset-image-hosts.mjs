import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const migrationReportPath = path.join(rootDir, 'output', 'nodeimage-preset-migration.json');
const benchmarkReportPath = path.join(rootDir, 'output', 'nodeimage-preset-speed.json');
const sampleArg = process.argv.find(arg => arg.startsWith('--sample='));
const sampleSize = Math.max(1, Number(sampleArg?.split('=')[1] || 50) || 50);

const withTimeout = async (promiseFactory, ms, label) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${ms}ms`)), ms);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const measure = async (url) => {
  const startedAt = performance.now();
  let firstByteMs = 0;
  return withTimeout(async (signal) => {
    const response = await fetch(url, { signal, headers: { 'cache-control': 'no-cache' } });
    firstByteMs = performance.now() - startedAt;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = (await response.arrayBuffer()).byteLength;
    return {
      ok: true,
      status: response.status,
      bytes,
      firstByteMs: Math.round(firstByteMs),
      totalMs: Math.round(performance.now() - startedAt)
    };
  }, 30000, 'benchmark');
};

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[index];
};

const summarize = (items, key) => {
  const values = items.filter(item => item?.ok).map(item => item[key]).filter(Number.isFinite);
  return {
    count: values.length,
    avg: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0
  };
};

const migration = JSON.parse(await fs.readFile(migrationReportPath, 'utf8'));
const pairs = (migration.entries || [])
  .filter(entry => entry?.oldUrl && entry?.nodeimageUrl)
  .slice(0, sampleSize)
  .map(entry => ({ oldUrl: entry.oldUrl, nodeimageUrl: entry.nodeimageUrl }));

const results = [];
for (let index = 0; index < pairs.length; index += 1) {
  const pair = pairs[index];
  const oldResult = await measure(pair.oldUrl).catch(error => ({ ok: false, error: error?.message || String(error) }));
  const nodeimageResult = await measure(pair.nodeimageUrl).catch(error => ({ ok: false, error: error?.message || String(error) }));
  results.push({ ...pair, old: oldResult, nodeimage: nodeimageResult });
  console.log(`[${index + 1}/${pairs.length}] old=${oldResult.totalMs || oldResult.error} nodeimage=${nodeimageResult.totalMs || nodeimageResult.error}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  sampleSize: pairs.length,
  oldHost: {
    firstByteMs: summarize(results.map(item => item.old), 'firstByteMs'),
    totalMs: summarize(results.map(item => item.old), 'totalMs')
  },
  nodeimage: {
    firstByteMs: summarize(results.map(item => item.nodeimage), 'firstByteMs'),
    totalMs: summarize(results.map(item => item.nodeimage), 'totalMs')
  },
  results
};

await fs.mkdir(path.dirname(benchmarkReportPath), { recursive: true });
await fs.writeFile(benchmarkReportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({
  sampleSize: report.sampleSize,
  oldTotalAvgMs: report.oldHost.totalMs.avg,
  nodeimageTotalAvgMs: report.nodeimage.totalMs.avg,
  oldFirstByteAvgMs: report.oldHost.firstByteMs.avg,
  nodeimageFirstByteAvgMs: report.nodeimage.firstByteMs.avg,
  report: path.relative(rootDir, benchmarkReportPath).replace(/\\/g, '/')
}, null, 2));
