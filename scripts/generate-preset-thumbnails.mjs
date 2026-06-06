import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { chromium } from 'playwright';

const rootDir = path.resolve(import.meta.dirname, '..');
const feedbackPath = path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json');

const s3Endpoint = (process.env.MORAN_OSS_ENDPOINT || 'https://s3.hi168.com').replace(/\/+$/, '');
const s3Bucket = process.env.MORAN_OSS_BUCKET || '';
const s3AccessKey = process.env.MORAN_OSS_ACCESS_KEY || '';
const s3SecretKey = process.env.MORAN_OSS_SECRET_KEY || '';
const s3Region = process.env.MORAN_OSS_REGION || 'auto';
const s3Prefix = (process.env.MORAN_OSS_PRESET_PREFIX || 'MoRanJiangHu/preset-items').replace(/^\/+|\/+$/g, '');
const s3CacheControl = process.env.MORAN_OSS_PRESET_THUMB_CACHE_CONTROL || 'public, max-age=86400, stale-while-revalidate=604800';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const force = args.includes('--force');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1]) || 1) : Number.POSITIVE_INFINITY;
const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
const concurrency = Math.max(1, Math.min(8, Number(concurrencyArg?.split('=')[1] || 4) || 4));
const sizeArg = args.find(arg => arg.startsWith('--size='));
const thumbSize = Math.max(160, Math.min(640, Number(sizeArg?.split('=')[1] || 360) || 360));
const qualityArg = args.find(arg => arg.startsWith('--quality='));
const thumbQuality = Math.max(0.45, Math.min(0.92, Number(qualityArg?.split('=')[1] || 0.78) || 0.78));

if (apply && (!s3Bucket || !s3AccessKey || !s3SecretKey)) {
  throw new Error('Missing MORAN_OSS_BUCKET, MORAN_OSS_ACCESS_KEY, or MORAN_OSS_SECRET_KEY environment variable.');
}

const normalizeS3Key = (key) => key.replace(/^\/+/, '').replace(/\/+/g, '/');
const encodeS3Key = (key) => normalizeS3Key(key).split('/').map(part => encodeURIComponent(part)).join('/');
const s3ObjectUrl = (key) => new URL(`${s3Endpoint}/${encodeURIComponent(s3Bucket)}/${encodeS3Key(key)}`);
const safeObjectName = (name) => String(name || 'item').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'item';
const thumbnailKeyForName = (name) => normalizeS3Key(`${s3Prefix}/thumbs/${safeObjectName(name)}.webp`);
const thumbnailUrlForName = (name) => s3ObjectUrl(thumbnailKeyForName(name)).toString();

const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();
const hmacHex = (key, value) => crypto.createHmac('sha256', key).update(value).digest('hex');
const sha256Hex = (body) => crypto.createHash('sha256').update(body).digest('hex');
const formatAmzDate = (date) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
};
const s3SigningKey = (dateStamp) => {
  const kDate = hmac(Buffer.from(`AWS4${s3SecretKey}`, 'utf8'), dateStamp);
  const kRegion = hmac(kDate, s3Region);
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
};
const buildS3SignedHeaders = ({ method, url, body, contentType }) => {
  const { amzDate, dateStamp } = formatAmzDate(new Date());
  const bodyHash = sha256Hex(body);
  const canonicalHeaders = [
    `cache-control:${s3CacheControl}\n`,
    `content-type:${contentType}\n`,
    `host:${url.host}\n`,
    'x-amz-acl:public-read\n',
    `x-amz-content-sha256:${bodyHash}\n`,
    `x-amz-date:${amzDate}\n`
  ].join('');
  const signedHeaders = 'cache-control;content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, url.pathname, '', canonicalHeaders, signedHeaders, bodyHash].join('\n');
  const credentialScope = `${dateStamp}/${s3Region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
  const signature = hmacHex(s3SigningKey(dateStamp), stringToSign);
  return {
    'Cache-Control': s3CacheControl,
    'Content-Type': contentType,
    'x-amz-acl': 'public-read',
    'X-Amz-Content-Sha256': bodyHash,
    'X-Amz-Date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${s3AccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
};

const putS3Object = ({ url, headers, body }) => new Promise((resolve, reject) => {
  const transport = url.protocol === 'http:' ? http : https;
  const request = transport.request(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Length': body.byteLength },
    timeout: 90000
  }, (response) => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if ((response.statusCode || 0) < 200 || (response.statusCode || 0) >= 300) {
        reject(new Error(`hi168 PUT failed (${response.statusCode}): ${text.slice(0, 240)}`));
      } else {
        resolve({ text, status: response.statusCode || 0 });
      }
    });
  });
  request.on('timeout', () => request.destroy(new Error('hi168 PUT timed out')));
  request.on('error', reject);
  request.end(body);
});

const existsPublicly = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

const downloadImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download failed ${response.status}: ${url}`);
  const contentType = response.headers.get('content-type') || 'image/png';
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, contentType };
};

const makeThumbnail = async (page, source) => {
  const base64 = source.bytes.toString('base64');
  const dataUrl = `data:${source.contentType};base64,${base64}`;
  const thumbDataUrl = await page.evaluate(async ({ dataUrl: input, size, quality }) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('thumbnail image decode failed'));
      img.src = input;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, size, size);
    const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const x = Math.round((size - width) / 2);
    const y = Math.round((size - height) / 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, x, y, width, height);
    return canvas.toDataURL('image/webp', quality);
  }, { dataUrl, size: thumbSize, quality: thumbQuality });
  return Buffer.from(thumbDataUrl.split(',')[1] || '', 'base64');
};

const runPool = async (items, worker) => {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
};

const feedback = JSON.parse(await fs.readFile(feedbackPath, 'utf8'));
const uniqueItems = [];
const seen = new Set();
for (const item of feedback) {
  const name = String(item.name || '').trim();
  const src = String(item.src || '').trim();
  if (!name || !src || seen.has(name)) continue;
  seen.add(name);
  uniqueItems.push({ name, src, thumbSrc: thumbnailUrlForName(name), key: thumbnailKeyForName(name) });
}

const planned = [];
for (const item of uniqueItems) {
  const exists = !force && await existsPublicly(item.thumbSrc);
  if (!exists) planned.push(item);
  if (planned.length >= limit) break;
}

console.log(JSON.stringify({
  apply,
  force,
  feedbackEntries: feedback.length,
  uniqueItems: uniqueItems.length,
  planned: planned.length,
  thumbSize,
  thumbQuality,
  concurrency
}, null, 2));

if (apply && planned.length) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const pages = await Promise.all(Array.from({ length: Math.min(concurrency, planned.length) }, () => context.newPage()));
  let pageIndex = 0;
  let done = 0;
  await runPool(planned, async (item) => {
    const page = pages[pageIndex % pages.length];
    pageIndex += 1;
    const source = await downloadImage(item.src);
    const thumb = await makeThumbnail(page, source);
    const url = s3ObjectUrl(item.key);
    await putS3Object({
      url,
      body: thumb,
      headers: buildS3SignedHeaders({ method: 'PUT', url, body: thumb, contentType: 'image/webp' })
    });
    done += 1;
    console.log(`[thumb ${done}/${planned.length}] ${item.name} ${source.bytes.length} -> ${thumb.length}`);
  });
  await browser.close();
}

let changed = 0;
for (const item of feedback) {
  if (!item?.name) continue;
  const nextThumb = thumbnailUrlForName(item.name);
  if (item.thumbSrc !== nextThumb) {
    item.thumbSrc = nextThumb;
    changed += 1;
  }
}

if (apply && changed) {
  await fs.writeFile(feedbackPath, `${JSON.stringify(feedback, null, 2)}\n`, 'utf8');
}

console.log(`Feedback thumbSrc updated: ${apply ? changed : 0}${apply ? '' : ' (dry run)'}`);
