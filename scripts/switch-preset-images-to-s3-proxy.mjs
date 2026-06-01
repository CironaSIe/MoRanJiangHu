import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const files = [
  path.join(rootDir, 'data', 'presetItemImages.ts'),
  path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json'),
];
const proxyBase = 'https://msjh.bacon159.pp.ua/api/preset-image';

const toProxyUrl = (rawUrl) => {
  const url = new URL(rawUrl);
  const match = url.pathname.match(/^\/(?:api\/v1\/)?file\/([^/?#]+)/i);
  if (!match) return rawUrl;
  const fileId = decodeURIComponent(match[1] || '').trim();
  const key = fileId.replace(/^s3:/i, '');
  if (!/^s3_[0-9]+_[0-9a-z]+\.(png|jpe?g|webp|gif|bmp)$/i.test(key)) return rawUrl;
  return `${proxyBase}/${encodeURIComponent(key)}`;
};

let total = 0;
for (const filePath of files) {
  let source = await fs.readFile(filePath, 'utf8');
  let changed = 0;
  source = source.replace(/https:\/\/image1\.bacon159\.pp\.ua\/(?:api\/v1\/)?file\/s3%3A[0-9A-Za-z_.-]+/g, (url) => {
    changed += 1;
    return toProxyUrl(url);
  });
  await fs.writeFile(filePath, source, 'utf8');
  total += changed;
  console.log(`${path.relative(rootDir, filePath).replace(/\\/g, '/')}: ${changed}`);
}
console.log(`total replacements: ${total}`);
