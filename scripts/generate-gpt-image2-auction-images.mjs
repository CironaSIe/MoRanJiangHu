#!/usr/bin/env node
/**
 * Regenerate default auction item images with a GPT-image compatible endpoint.
 *
 * Secrets are read from GPT_IMAGE_API_KEY / IMAGE_API_KEY / OPENAI_API_KEY.
 * Do not pass API keys as command-line args.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const auctionServicePath = path.join(rootDir, 'services', 'auctionHouse.ts');
const imageMapPath = path.join(rootDir, 'data', 'defaultAuctionItemImages.ts');
const outDir = path.join(rootDir, 'public', 'assets', 'auction-items');

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const apiKey = String(process.env.GPT_IMAGE_API_KEY || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || '').trim();
const baseUrl = (getArg('base-url') || process.env.GPT_IMAGE_API_BASE || process.env.IMAGE_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const model = getArg('model', process.env.GPT_IMAGE_MODEL || process.env.IMAGE_MODEL || 'gpt-image-2');
const size = getArg('size', '1024x1024');
const only = getArg('only');
const limit = Math.max(0, Number(getArg('limit', '0')) || 0);
const start = Math.max(0, Number(getArg('start', '0')) || 0);
const skipExisting = hasFlag('skip-existing');
const dryRun = hasFlag('dry-run');
const requestTimeoutMs = Math.max(30000, Number(getArg('request-timeout-ms', '180000')) || 180000);
const concurrency = Math.max(1, Math.min(3, Number(getArg('concurrency', '1')) || 1));

if (!apiKey && !dryRun) {
  throw new Error('Missing GPT_IMAGE_API_KEY / IMAGE_API_KEY / OPENAI_API_KEY');
}

const imageEndpoint = (base) => {
  if (/\/v1\/images\/generations$/i.test(base) || /\/images\/generations$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/images/generations`;
  return `${base}/v1/images/generations`;
};

const qualityMap = {
  传说: 'legendary',
  绝世: 'mythic',
  极品: 'top grade',
  上品: 'superior',
  良品: 'fine',
  凡品: 'common',
};

const typeMap = {
  武器: 'decorative wuxia weapon prop replica',
  防具: 'armor or protective clothing prop',
  饰品: 'accessory or jewelry prop',
  消耗品: 'alchemy medicine consumable prop',
  材料: 'crafting material specimen',
  秘籍: 'martial arts manual, scroll, or jade-slip scripture prop',
  法宝: 'xianxia cultivation magical treasure artifact prop',
};

const promptHint = (item) => {
  const name = item.名称;
  if (/丹炉/.test(name)) return 'Must be a small three-legged alchemy furnace with lid and handles, no fire scene, no person.';
  if (/符箓/.test(name)) return 'Must be one talisman charm with abstract unreadable ink strokes, no readable characters.';
  if (/阵盘/.test(name)) return 'Must be one round array disk with abstract geometric grooves, physical object only.';
  if (/玉简/.test(name)) return 'Must be jade slips tied with silk cord, abstract etched marks, no readable text.';
  if (/灵石/.test(name)) return 'Must be a small drawstring bag with several glowing spirit crystals visible.';
  if (/飞剑/.test(name)) return 'Must be a small elegant flying sword artifact, decorative replica, no person holding it.';
  if (/储物戒/.test(name)) return 'Must be one ring artifact photographed alone, no hand or finger.';
  if (/法袍/.test(name)) return 'Garment only, laid flat or gently folded, no person wearing it, no mannequin.';
  if (/丹|灵液/.test(name)) return 'Must clearly be ancient Chinese alchemy medicine in a small bottle, vial, cup, or pill case.';
  if (/弩/.test(name)) return 'Must clearly be an ancient crossbow mechanism prop, not a gun, no modern parts.';
  if (/残页|拓本|丹方/.test(name)) return 'Must be aged paper or scroll with abstract diagrams and unreadable marks, no real readable text.';
  return '';
};

const buildPrompt = (item) => [
  'Create one high-quality inventory image for a wuxia/xianxia RPG auction item.',
  'Photorealistic product photo of a single physical prop, centered, isolated on warm neutral parchment background, soft studio lighting, tactile material detail, soft shadow, clear silhouette.',
  `Item name: ${item.名称}.`,
  `Item class: ${qualityMap[item.品质] || item.品质} ${typeMap[item.类型] || item.类型}.`,
  `Form and materials: ${item.描述}.`,
  promptHint(item),
  'No people, no hands, no face, no full body, no UI, no card frame, no border, no collage, no text, no letters, no numbers, no Chinese characters, no calligraphy, no labels, no logo, no watermark.',
].filter(Boolean).join('\n');

const parseAuctionTemplates = async () => {
  const source = await fs.readFile(auctionServicePath, 'utf8');
  const entries = [];
  const pattern = /\{\s*名称:\s*'([^']+)'\s*,\s*类型:\s*'([^']+)'\s*,\s*品质:\s*'([^']+)'\s*,\s*描述:\s*'([^']+)'/g;
  for (const match of source.matchAll(pattern)) {
    entries.push({ 名称: match[1], 类型: match[2], 品质: match[3], 描述: match[4] });
  }
  return entries;
};

const parseImageMap = async () => {
  const source = await fs.readFile(imageMapPath, 'utf8');
  const map = new Map();
  const pattern = /(?:'([^']+)'|([A-Za-z0-9_\u4e00-\u9fa5·]+)):\s*'\/assets\/auction-items\/([^']+)'/g;
  for (const match of source.matchAll(pattern)) {
    map.set(match[1] || match[2], match[3]);
  }
  return map;
};

const fetchWithTimeout = async (url, options) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const decodeImageData = async (entry) => {
  if (entry?.b64_json) return Buffer.from(entry.b64_json, 'base64');
  if (entry?.url) {
    const res = await fetchWithTimeout(entry.url, {});
    if (!res.ok) throw new Error(`download generated image failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error('image API returned no image data');
};

const generate = async (item) => {
  const body = { model, prompt: buildPrompt(item), n: 1, size };
  const res = await fetchWithTimeout(imageEndpoint(baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`image API ${res.status}: ${text.slice(0, 800)}`);
  }
  const json = await res.json();
  return decodeImageData(json.data?.[0]);
};

const main = async () => {
  await fs.mkdir(outDir, { recursive: true });
  const [templates, imageMap] = await Promise.all([parseAuctionTemplates(), parseImageMap()]);
  let targets = templates
    .map((item) => ({ ...item, filename: imageMap.get(item.名称) }))
    .filter((item) => item.filename);
  if (only) targets = targets.filter((item) => item.名称 === only || item.filename === only);
  targets = targets.slice(start, limit > 0 ? start + limit : undefined);
  console.log(`Auction image generation: ${targets.length} item(s), model=${model}, size=${size}, concurrency=${concurrency}`);
  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length) {
      const index = cursor++;
      const item = targets[index];
    const filePath = path.join(outDir, item.filename);
    if (skipExisting) {
      try {
        await fs.access(filePath);
        console.log(`[${index + 1}/${targets.length}] skip existing ${item.名称} -> ${item.filename}`);
        continue;
      } catch {
        // generate missing
      }
    }
    console.log(`[${index + 1}/${targets.length}] generate ${item.名称} -> ${item.filename}`);
    if (dryRun) continue;
    const buf = await generate(item);
    await fs.writeFile(filePath, buf);
    console.log(`  saved ${(buf.length / 1024).toFixed(1)} KB`);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
