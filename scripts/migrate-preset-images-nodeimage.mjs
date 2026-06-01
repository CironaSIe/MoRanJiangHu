import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const rootDir = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(rootDir, 'data', 'presetItemImages.ts');
const feedbackPath = path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json');
const outputDir = path.join(rootDir, 'output');
const reportPath = path.join(outputDir, 'nodeimage-preset-migration.json');
const apiUrl = 'https://api.nodeimage.com/api/upload';
const oldUrlPattern = /https:\/\/image\d?\.bacon159\.pp\.ua\/file\/[^'"\s,}]+/g;

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const concurrencyArg = process.argv.find(arg => arg.startsWith('--concurrency='));
const concurrency = Math.max(1, Number(concurrencyArg?.split('=')[1] || 3) || 3);
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Math.max(0, Number(limitArg.split('=')[1]) || 0) : 0;
const delayArg = process.argv.find(arg => arg.startsWith('--delay-ms='));
const delayMs = Math.max(0, Number(delayArg?.split('=')[1] || (concurrency === 1 ? 3200 : 0)) || 0);

const apiKey = process.env.NODEIMAGE_API_KEY || process.env.NODE_IMAGE_API_KEY || '';
if (!apiKey) {
  throw new Error('Missing NODEIMAGE_API_KEY environment variable.');
}

const ensureOutput = async () => {
  await fs.mkdir(outputDir, { recursive: true });
};

const readReport = async () => {
  try {
    return JSON.parse(await fs.readFile(reportPath, 'utf8'));
  } catch {
    return { generatedAt: '', entries: [] };
  }
};

const writeReport = async (entries) => {
  await ensureOutput();
  const payload = JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'nodeimage',
    entries
  }, null, 2);
  const tempPath = `${reportPath}.tmp`;
  await fs.writeFile(tempPath, payload, 'utf8');
  await fs.rename(tempPath, reportPath).catch(async () => {
    await fs.rm(reportPath, { force: true }).catch(() => undefined);
    await fs.rename(tempPath, reportPath);
  });
};

const collectUrls = async () => {
  const files = [registryPath, feedbackPath];
  const urls = new Set();
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    for (const match of text.matchAll(oldUrlPattern)) {
      urls.add(match[0]);
    }
  }
  return Array.from(urls);
};

const withTimeout = async (promiseFactory, ms, label) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${ms}ms`)), ms);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const sniffImageType = (bytes, fallbackContentType = '') => {
  if (bytes?.[0] === 0xff && bytes?.[1] === 0xd8 && bytes?.[2] === 0xff) {
    return { contentType: 'image/jpeg', ext: 'jpg' };
  }
  if (bytes?.[0] === 0x89 && bytes?.[1] === 0x50 && bytes?.[2] === 0x4e && bytes?.[3] === 0x47) {
    return { contentType: 'image/png', ext: 'png' };
  }
  if (
    bytes?.[0] === 0x52 && bytes?.[1] === 0x49 && bytes?.[2] === 0x46 && bytes?.[3] === 0x46
    && bytes?.[8] === 0x57 && bytes?.[9] === 0x45 && bytes?.[10] === 0x42 && bytes?.[11] === 0x50
  ) {
    return { contentType: 'image/webp', ext: 'webp' };
  }
  if (/jpeg/i.test(fallbackContentType)) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (/webp/i.test(fallbackContentType)) return { contentType: 'image/webp', ext: 'webp' };
  return { contentType: 'image/png', ext: 'png' };
};

const extensionFromUrl = (url, contentType, extHint = '') => {
  if (extHint) return extHint;
  const ext = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (ext) return ext;
  if (/jpeg/i.test(contentType)) return 'jpg';
  if (/webp/i.test(contentType)) return 'webp';
  return 'png';
};

const filenameFor = (url, contentType, extHint = '') => {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  return `preset-${hash}.${extensionFromUrl(url, contentType, extHint)}`;
};

const extractStrings = (value, output = []) => {
  if (typeof value === 'string') {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) extractStrings(item, output);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) extractStrings(item, output);
  }
  return output;
};

const extractNodeImageUrl = (payload) => {
  const strings = extractStrings(payload);
  return strings.find(value => /^https?:\/\/[^ "'<>]+nodeimage\.com\/[^ "'<>]+/i.test(value))
    || strings.find(value => /^https?:\/\/[^ "'<>]+\.(?:png|jpg|jpeg|webp)(?:\?[^ "'<>]*)?$/i.test(value))
    || '';
};

const downloadImage = async (url) => {
  return withTimeout(async (signal) => {
    const response = await fetch(url, { signal, headers: { 'cache-control': 'no-cache' } });
    if (!response.ok) throw new Error(`download HTTP ${response.status}`);
    const responseContentType = response.headers.get('content-type') || 'image/png';
    const bytes = new Uint8Array(await response.arrayBuffer());
    const sniffed = sniffImageType(bytes, responseContentType);
    return { bytes, contentType: sniffed.contentType, ext: sniffed.ext };
  }, 30000, 'download');
};

const uploadImage = async (url, image) => {
  return withTimeout(async (signal) => {
    const form = new FormData();
    const blob = new Blob([image.bytes], { type: image.contentType });
    form.append('image', blob, filenameFor(url, image.contentType, image.ext));
    const response = await fetch(apiUrl, {
      method: 'POST',
      signal,
      headers: { 'X-API-Key': apiKey },
      body: form
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) throw new Error(`upload HTTP ${response.status}: ${text.slice(0, 240)}`);
    const nodeimageUrl = extractNodeImageUrl(payload);
    if (!nodeimageUrl) throw new Error(`upload response did not contain an image URL: ${text.slice(0, 240)}`);
    return { nodeimageUrl, payload };
  }, 60000, 'upload');
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadImageWithRetry = async (url, image) => {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await uploadImage(url, image);
    } catch (error) {
      lastError = error;
      const message = error?.message || String(error);
      if (!/HTTP 429|请求过于频繁|too many/i.test(message) || attempt === 5) break;
      await sleep(65000);
    }
  }
  throw lastError;
};

const runPool = async (items, worker) => {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item, index, items.length);
    }
  });
  await Promise.all(workers);
};

const replaceInFile = async (file, mapping) => {
  let source = await fs.readFile(file, 'utf8');
  let changed = 0;
  for (const [oldUrl, newUrl] of mapping.entries()) {
    if (!source.includes(oldUrl)) continue;
    source = source.split(oldUrl).join(newUrl);
    changed += 1;
  }
  await fs.writeFile(file, source, 'utf8');
  return changed;
};

await ensureOutput();
const report = await readReport();
const previous = new Map((report.entries || [])
  .filter(entry => entry?.oldUrl && entry?.nodeimageUrl)
  .map(entry => [entry.oldUrl, entry]));
const allUrls = await collectUrls();
const pending = allUrls.filter(url => !previous.has(url)).slice(0, limit || undefined);
const entries = [...previous.values()];
const failed = [];

console.log(`Preset image URLs: ${allUrls.length}; already uploaded: ${previous.size}; pending: ${pending.length}; apply=${apply}`);

await runPool(pending, async (oldUrl, done, total) => {
  if (delayMs > 0) await sleep(delayMs);
  const startedAt = Date.now();
  try {
    const image = await downloadImage(oldUrl);
    const uploaded = await uploadImageWithRetry(oldUrl, image);
    const entry = {
      oldUrl,
      nodeimageUrl: uploaded.nodeimageUrl,
      bytes: image.bytes.length,
      contentType: image.contentType,
      durationMs: Date.now() - startedAt
    };
    entries.push(entry);
    previous.set(oldUrl, entry);
    console.log(`[${done}/${total}] uploaded ${Math.round(image.bytes.length / 1024)} KiB`);
  } catch (error) {
    const entry = {
      oldUrl,
      error: error?.message || String(error),
      durationMs: Date.now() - startedAt
    };
    failed.push(entry);
    entries.push(entry);
    console.warn(`[${done}/${total}] failed: ${entry.error}`);
  }
  await writeReport(entries);
});

const successful = entries.filter(entry => entry?.oldUrl && entry?.nodeimageUrl);
const mapping = new Map(successful.map(entry => [entry.oldUrl, entry.nodeimageUrl]));
let changedFiles = [];
if (apply) {
  changedFiles = [
    { path: path.relative(rootDir, registryPath).replace(/\\/g, '/'), changed: await replaceInFile(registryPath, mapping) },
    { path: path.relative(rootDir, feedbackPath).replace(/\\/g, '/'), changed: await replaceInFile(feedbackPath, mapping) }
  ];
}

await writeReport(entries);
console.log(JSON.stringify({
  totalOldUrls: allUrls.length,
  uploaded: successful.length,
  failed: failed.length,
  apply,
  changedFiles,
  report: path.relative(rootDir, reportPath).replace(/\\/g, '/')
}, null, 2));
