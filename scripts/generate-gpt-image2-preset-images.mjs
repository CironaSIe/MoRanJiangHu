#!/usr/bin/env node
/**
 * Generate two GPT-image candidates for every preset item, choose one, upload it,
 * and update data/presetItemImages.ts.
 *
 * Secrets are read from GPT_IMAGE_API_KEY / IMAGE_API_KEY / OPENAI_API_KEY.
 * Avoid passing keys on the command line so they do not land in shell history.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  结构化物品库,
  获取题材模式预设物品库,
  题材模式预设物品名称清单,
} from '../data/structuredItemLibrary.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const registryPath = path.join(rootDir, 'data', 'presetItemImages.ts');
const defaultOutDir = path.join(rootDir, 'output', 'gpt-image2-item-presets');

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const normalizeSecret = (value = '') => String(value).trim().replace(/^["']|["']$/g, '');
const apiKey = normalizeSecret(process.env.GPT_IMAGE_API_KEY || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || '');
const baseUrl = (getArg('base-url') || process.env.GPT_IMAGE_API_BASE || process.env.IMAGE_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const model = getArg('model', process.env.GPT_IMAGE_MODEL || process.env.IMAGE_MODEL || 'gpt-image-2');
const judgeModel = getArg('judge-model', process.env.GPT_IMAGE_JUDGE_MODEL || process.env.IMAGE_JUDGE_MODEL || '');
const outDir = path.resolve(rootDir, getArg('out-dir', defaultOutDir));
const size = getArg('size', '1024x1024');
const concurrency = Math.max(1, Math.min(4, Number(getArg('concurrency', '1')) || 1));
const start = Math.max(0, Number(getArg('start', '0')) || 0);
const limit = Math.max(0, Number(getArg('limit', '0')) || 0);
const only = getArg('only');
const dryRun = hasFlag('dry-run');
const noUpload = hasFlag('no-upload');
const noRegistry = hasFlag('no-registry');
const skipExisting = hasFlag('skip-existing');
const fromStructured = hasFlag('from-structured');
const missingRegistry = hasFlag('missing-registry');
const missingRemote = hasFlag('missing-remote');
const fallbackLocal = hasFlag('fallback-local');
const localOnly = hasFlag('local-only');
const modesArg = getArg('modes', getArg('mode', ''));
const uploadBase = getArg('upload-base', 'https://msjh.bacon159.pp.ua').replace(/\/+$/, '');
const uploadStorage = getArg('upload-storage', 'telegram');
const requestTimeoutMs = Math.max(30000, Number(getArg('request-timeout-ms', '180000')) || 180000);
const batchCandidates = hasFlag('batch-candidates');
const singleCandidate = hasFlag('single-candidate');
const imageRetries = Math.max(1, Number(getArg('image-retries', '3')) || 3);
const uploadRetries = Math.max(1, Number(getArg('upload-retries', '3')) || 3);

if (!apiKey && !dryRun && !localOnly && !fallbackLocal) {
  throw new Error('Missing GPT_IMAGE_API_KEY / IMAGE_API_KEY / OPENAI_API_KEY');
}

const imageEndpoint = (base) => {
  if (/\/v1\/images\/generations$/i.test(base)) return base;
  if (/\/images\/generations$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/images/generations`;
  return `${base}/v1/images/generations`;
};

const chatEndpoint = (base) => {
  if (/\/v1\/chat\/completions$/i.test(base)) return base;
  if (/\/chat\/completions$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
};

const safeFileName = (name) => name.replace(/[\\/:*?"<>|]/g, '_');

const parsePresetRegistry = async () => {
  const source = await fs.readFile(registryPath, 'utf8');
  const entries = [];
  const pattern = /\{\s*名称:\s*'([^']+)'\s*,\s*类型:\s*'([^']+)'\s*,\s*品质:\s*'([^']+)'\s*,\s*图片URL:\s*'([^']*)'\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    entries.push({
      名称: match[1],
      类型: match[2],
      品质: match[3],
      图片URL: match[4],
    });
  }
  return entries;
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
  武器: 'nonfunctional decorative martial arts equipment prop, ceremonial display replica',
  防具: 'armor, clothing, or protective gear',
  消耗品: 'medicine consumable',
  材料: 'crafting material',
  秘籍: 'martial arts manual or scroll',
  饰品: 'accessory',
  法宝: 'xianxia cultivation magic treasure artifact',
  任务道具: 'quest key item prop',
  杂物: 'miscellaneous inventory prop',
  杂项: 'miscellaneous inventory prop',
};

const itemSpecificPrompt = (item, structured) => {
  const name = item.名称;
  const object = structured?.物品 || name;
  if (name === '蛇胆') {
    return 'Must be one real snake gallbladder organ: a small oval dark green translucent bile sac on a shallow porcelain dish, wet glossy membrane, no snake body, no snake head, no worm, no eel, no bottle, no vial.';
  }
  if (/弩$/.test(name) || object === '弩') {
    return 'Must clearly be a compact nonfunctional display replica of an ancient crossbow: horizontal bow limbs, central stock, trigger shape, short bolt groove, viewed from a three-quarter top angle. Museum prop only, no projectile, not a gun, not armor.';
  }
  if (/弓$/.test(name) || object === '弓') {
    return 'Must clearly be a decorative traditional bow replica with curved limbs and string, shown as a museum prop. Not a crossbow, not a staff, not a blade.';
  }
  if (/扇/.test(name) || /扇/.test(object)) {
    return 'Must clearly be a Chinese hand fan: folded or half-open fan leaf, visible ribs, jade bamboo or wood spine, tassel. Absolutely no sword blade, no knife, no spearhead, no weapon shaft.';
  }
  if (/符|符箓/.test(name) || object === '符箓') {
    return 'Must be one talisman paper charm: yellow, blue, gold, silver, or pale paper with abstract unreadable ink strokes. No readable characters, no real text, no person.';
  }
  if (/玉简|诀|术|心得|初解|入门/.test(name) || object === '玉简') {
    return 'Must be a bundle of jade slips tied with silk cord, with abstract unreadable etched marks and diagrams. Not a paper book, not blank, no readable real text.';
  }
  if (/灵石|灵晶/.test(name) || object === '灵石' || object === '灵晶') {
    return 'Must be one raw translucent spirit crystal or mineral stone with inner glow. Mineral specimen only, no jewelry setting, no text.';
  }
  if (/阵盘|罗盘/.test(name) || /阵盘|罗盘/.test(object)) {
    return 'Must be a round array disk or compass artifact with abstract geometric grooves and a clear physical disk silhouette. No readable text or characters.';
  }
  if (/丹炉/.test(name) || object === '丹炉') {
    return 'Must be a small three-legged alchemy furnace with lid and handles, tabletop bronze or iron object. No fire scene, no person, no readable text.';
  }
  if (/储物袋|灵兽袋/.test(name) || /储物袋|灵兽袋/.test(object)) {
    return 'Must be a small drawstring pouch or brocade bag, isolated product still life. No animal visible, no person, no readable text.';
  }
  if (/储物戒/.test(name) || object === '储物戒') {
    return 'Must be one ring artifact photographed alone, no hand or finger, no readable text.';
  }
  if (item.类型 === '法宝') {
    return 'This is a xianxia cultivation magical artifact inventory prop: a single physical treasure object, elegant ancient Chinese materials, no person, no readable text.';
  }
  if (item.类型 === '武器') {
    return 'This is a nonfunctional decorative game prop replica for an inventory icon, blunt ceremonial display object, no blood, no violence, no injury, no person holding it.';
  }
  if (item.类型 === '秘籍') {
    return 'Must clearly look like an ancient martial arts manual, scroll, or stitched book with abstract unreadable ink marks and diagrams. It must not be blank and must not contain readable real text.';
  }
  if (/鞋|靴|草鞋/.test(name)) {
    return 'Footwear only: a pair of empty shoes or boots lying side by side, visible hollow openings. No legs, no feet inside, no pants, no mannequin, no vertical shin armor.';
  }
  if (/长衫|长裤|练功服|布衣|青衫/.test(name)) {
    return 'Garment only, laid flat or gently folded, no person wearing it, no mannequin, no body parts.';
  }
  return '';
};

const buildPrompt = (item) => {
  const structured = 结构化物品库.find((entry) => entry.名称 === item.名称);
  const material = structured?.材质 ? `material: ${structured.材质}` : '';
  const object = structured?.物品 ? `object category: ${structured.物品}` : '';
  const tags = Array.isArray(structured?.视觉标签) ? structured.视觉标签.join(', ') : '';
  const modernLike = tags && /modern|urban|laptop|smartphone|USB|battery|radio|survival|apocalypse|tool|detector|medical|ration|camp|protective|electronic/i.test(tags);
  const settingLine = modernLike
    ? 'Create a single high-quality inventory preset image for a Chinese narrative RPG with modern urban, spiritual-revival, or apocalypse modes.'
    : 'Create a single high-quality inventory preset image for a Chinese wuxia/xianxia RPG.';
  const description = String(structured?.生图描述 || `${item.名称}, ${item.类型}, ${item.品质}`)
    .replace(/\bweapon\b/gi, 'decorative prop replica')
    .replace(/\bbattle\b/gi, 'display')
    .replace(/\bsharp\b/gi, 'polished')
    .replace(/\bdeadly\b/gi, 'ceremonial');
  return [
    settingLine,
    [
      'Realistic product photography only: the image must look like a real camera photo of one tangible physical prop, not illustration.',
      'Centered isolated catalog shot on a warm neutral parchment or matte beige tabletop background, soft studio lighting, natural lens perspective, realistic shadow, realistic material texture, clear readable silhouette, object fills most of the frame.',
      'Use real-world surfaces such as metal, leather, cloth, wood, paper, stone, ceramic, plastic, rubber, glass, or worn survival materials as appropriate.'
    ].join(' '),
    `Item name: ${item.名称}.`,
    `Item class: ${qualityMap[item.品质] || item.品质} ${typeMap[item.类型] || item.类型}.`,
    material,
    object,
    `Form and materials: ${description}.`,
    tags ? `Visual tags: ${tags}.` : '',
    itemSpecificPrompt(item, structured),
    'No people, no hands, no face, no full body, no UI, no card frame, no border, no collage, no text, no letters, no numbers, no Chinese characters, no calligraphy, no labels, no logo, no watermark. Avoid icon style, 3D render, CGI, game concept art, guofeng illustration, anime, cartoon, painterly brushwork, vector art, plastic toy look, exaggerated glow, fantasy poster composition.',
  ].filter(Boolean).join('\n');
};

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const colorFromText = (value) => {
  let hash = 0;
  for (const ch of String(value || 'item')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return {
    main: `hsl(${hue} 42% 42%)`,
    light: `hsl(${hue} 58% 68%)`,
    dark: `hsl(${hue} 45% 25%)`,
  };
};

const iconSvgForItem = (item, tone) => {
  const name = item.名称 || '';
  const type = item.类型 || '';
  const stroke = `stroke="${tone.dark}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"`;
  const fill = `fill="${tone.main}"`;
  const soft = `fill="${tone.light}"`;
  if (/手机|录音笔|电脑|U盘|检测仪|探测器|电台|充电板/.test(name)) {
    if (/电脑/.test(name)) return `<rect x="250" y="315" width="520" height="330" rx="34" ${soft} ${stroke}/><rect x="205" y="665" width="610" height="48" rx="20" fill="${tone.dark}" opacity=".86"/><circle cx="510" cy="488" r="42" fill="#fff8" />`;
    if (/U盘/.test(name)) return `<rect x="330" y="390" width="320" height="170" rx="42" ${soft} ${stroke}/><rect x="650" y="432" width="90" height="86" rx="16" fill="${tone.dark}"/><circle cx="425" cy="475" r="28" fill="#fff8"/>`;
    if (/充电板/.test(name)) return `<rect x="240" y="335" width="540" height="360" rx="28" fill="#1f2937" ${stroke}/><path d="M300 395h420M300 485h420M300 575h420M405 350v320M510 350v320M615 350v320" stroke="#9bd7ff" stroke-width="10" opacity=".75"/>`;
    if (/电台/.test(name)) return `<rect x="300" y="370" width="420" height="280" rx="40" ${soft} ${stroke}/><path d="M650 360 750 210" ${stroke}/><circle cx="405" cy="510" r="60" fill="${tone.dark}" opacity=".85"/><rect x="500" y="440" width="135" height="78" rx="16" fill="#fff8"/>`;
    return `<rect x="335" y="235" width="350" height="555" rx="56" ${soft} ${stroke}/><rect x="382" y="310" width="256" height="360" rx="24" fill="#111827" opacity=".82"/><circle cx="510" cy="720" r="28" fill="#fff8"/>`;
  }
  if (/急救|抗生素|绷带|止血|净水片|抑制贴|防护口罩/.test(name)) {
    return `<rect x="280" y="345" width="460" height="340" rx="58" ${soft} ${stroke}/><path d="M510 420v190M415 515h190" stroke="#b91c1c" stroke-width="42" stroke-linecap="round"/><rect x="375" y="280" width="270" height="90" rx="38" fill="none" ${stroke}/>`;
  }
  if (/钥匙/.test(name)) {
    return `<circle cx="390" cy="430" r="105" fill="none" ${stroke}/><path d="M465 505 710 750M620 660l70-70M670 710l75-75" ${stroke}/>`;
  }
  if (/令牌|通行证|证件|检测卡|玉符|禁牌|古玉|玉佩/.test(name) || type === '饰品') {
    if (/戒|戒指/.test(name)) return `<circle cx="510" cy="515" r="180" fill="none" stroke="${tone.main}" stroke-width="62"/><circle cx="510" cy="515" r="92" fill="#f6e7c4"/><circle cx="510" cy="260" r="52" ${soft} ${stroke}/>`;
    if (/怀表/.test(name)) return `<circle cx="510" cy="525" r="180" ${soft} ${stroke}/><path d="M510 525l82-72M510 525l-55 95" ${stroke}/><path d="M510 345v-75M455 270h110" ${stroke}/>`;
    return `<path d="M510 235c120 68 185 150 185 280 0 140-85 235-185 285-100-50-185-145-185-285 0-130 65-212 185-280Z" ${soft} ${stroke}/><circle cx="510" cy="500" r="72" fill="#fff7" />`;
  }
  if (/合同|文牒|密函|凭证|手册|秘籍|玉简|诀|术|心得|初解|入门/.test(name) || type === '秘籍' || type === '任务道具') {
    if (/玉简/.test(name)) return `<g transform="translate(250 310)"><rect width="85" height="380" rx="30" ${soft} ${stroke}/><rect x="115" width="85" height="380" rx="30" ${soft} ${stroke}/><rect x="230" width="85" height="380" rx="30" ${soft} ${stroke}/><rect x="345" width="85" height="380" rx="30" ${soft} ${stroke}/><path d="M20 110h390M20 270h390" stroke="#8b5a2b" stroke-width="16"/></g>`;
    return `<path d="M305 255h390v530H305c-52 0-85-33-85-82V338c0-50 33-83 85-83Z" fill="#f7e5bd" ${stroke}/><path d="M320 350h285M320 440h340M320 530h300M320 620h250" stroke="${tone.main}" stroke-width="14" opacity=".55"/><path d="M695 255c-45 35-45 495 0 530" fill="none" ${stroke}/>`;
  }
  if (/工具箱|工具钳|撬棍|警棍|喷雾|弩|组件/.test(name) || type === '武器') {
    if (/弩/.test(name)) return `<path d="M250 370c150-85 370-85 520 0" fill="none" ${stroke}/><path d="M510 315v370M385 560h250M510 685l-90 95M510 685l90 95" ${stroke}/>`;
    if (/撬棍|警棍/.test(name)) return `<path d="M330 720 700 350" ${stroke}/><path d="M675 325c60 10 85 45 78 92" fill="none" ${stroke}/>`;
    if (/喷雾/.test(name)) return `<rect x="390" y="330" width="240" height="430" rx="54" ${soft} ${stroke}/><rect x="430" y="245" width="160" height="110" rx="30" fill="${tone.dark}"/><path d="M590 280h135" ${stroke}/>`;
    return `<rect x="260" y="430" width="500" height="265" rx="42" ${soft} ${stroke}/><rect x="350" y="335" width="320" height="120" rx="44" fill="none" ${stroke}/><path d="M330 560h360" stroke="#fff8" stroke-width="28"/>`;
  }
  if (/防护服|夹克|手套|鞋|靴|面具|护目镜|背心|口罩/.test(name) || type === '防具') {
    if (/鞋|靴/.test(name)) return `<path d="M240 620c120 20 230 15 320-35 38 48 100 72 220 80 22 72-15 110-105 110H330c-80 0-120-55-90-155Z" ${soft} ${stroke}/>`;
    if (/手套/.test(name)) return `<path d="M350 700V430c0-50 68-55 74-8v155-190c0-58 76-58 82 0v175-155c0-54 72-54 78 0v170-105c0-48 68-48 76 0v145c0 120-70 205-168 205h-55c-55 0-87-45-87-122Z" ${soft} ${stroke}/>`;
    if (/面具|口罩|护目镜/.test(name)) return `<path d="M305 460c75-95 335-95 410 0 35 145-50 270-205 270S270 605 305 460Z" ${soft} ${stroke}/><circle cx="430" cy="500" r="52" fill="#111827" opacity=".8"/><circle cx="590" cy="500" r="52" fill="#111827" opacity=".8"/><path d="M450 650h120" ${stroke}/>`;
    return `<path d="M510 245 675 345l-65 150v295H410V495l-65-150 165-100Z" ${soft} ${stroke}/><path d="M410 495h200M455 345l55 80 55-80" stroke="#fff8" stroke-width="16"/>`;
  }
  if (/罐头|饼干|饮水|水壶|滤芯|电池|弹药|汽油|样本|元件|材料|矿|灵石|灵晶/.test(name) || type === '材料' || type === '消耗品') {
    if (/汽油|桶/.test(name)) return `<path d="M370 310h250l90 100v340H330V410l40-100Z" ${soft} ${stroke}/><path d="M620 310v110h90M410 560h220" ${stroke}/>`;
    if (/电池/.test(name)) return `<rect x="300" y="395" width="400" height="260" rx="42" ${soft} ${stroke}/><rect x="700" y="465" width="55" height="120" rx="18" fill="${tone.dark}"/><path d="M430 525h160M510 445v160" stroke="#fff8" stroke-width="28"/>`;
    if (/罐头/.test(name)) return `<ellipse cx="510" cy="330" rx="170" ry="58" ${soft} ${stroke}/><path d="M340 330v330c0 32 75 58 170 58s170-26 170-58V330" ${soft} ${stroke}/><ellipse cx="510" cy="660" rx="170" ry="58" fill="none" ${stroke}/>`;
    return `<path d="M510 245 690 515 510 785 330 515 510 245Z" ${soft} ${stroke}/><path d="M430 520h160M510 440v160" stroke="#fff8" stroke-width="22" opacity=".6"/>`;
  }
  if (/铃|镜|阵盘|罗盘|丹炉|葫芦|袋|戒|法宝/.test(name) || type === '法宝') {
    if (/丹炉/.test(name)) return `<path d="M335 470h350v165c0 90-70 150-175 150s-175-60-175-150V470Z" ${soft} ${stroke}/><path d="M420 470c10-80 170-80 180 0M380 785l-55 85M640 785l55 85M510 785v90" ${stroke}/>`;
    if (/阵盘|罗盘|镜/.test(name)) return `<circle cx="510" cy="515" r="220" ${soft} ${stroke}/><circle cx="510" cy="515" r="120" fill="none" ${stroke}/><path d="M510 295v440M290 515h440M355 360l310 310M665 360 355 670" stroke="#fff8" stroke-width="12"/>`;
    return `<path d="M365 360c70-95 220-95 290 0l-50 390H415L365 360Z" ${soft} ${stroke}/><path d="M415 430h190M445 555h130" stroke="#fff8" stroke-width="18"/>`;
  }
  return `<circle cx="510" cy="515" r="220" ${soft} ${stroke}/><path d="M390 515h240M510 395v240" stroke="#fff8" stroke-width="30" stroke-linecap="round"/>`;
};

async function generateLocalFallbackImage(item) {
  const { default: sharp } = await import('sharp');
  const tone = colorFromText(`${item.名称}-${item.类型}-${item.品质}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="paper" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#fff8dc"/>
      <stop offset="100%" stop-color="#d8b77d"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="18" flood-color="#3b2410" flood-opacity=".28"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#paper)"/>
  <circle cx="512" cy="512" r="382" fill="#fff4d6" opacity=".55"/>
  <circle cx="512" cy="512" r="410" fill="none" stroke="#8b5a2b" stroke-width="16" opacity=".32"/>
  <g filter="url(#shadow)">${iconSvgForItem(item, tone)}</g>
  <title>${escapeXml(item.名称)}</title>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const decodeImageData = async (entry) => {
  if (entry?.b64_json) return Buffer.from(entry.b64_json, 'base64');
  if (entry?.url) {
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error(`download generated image failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error('image API returned no b64_json or url');
};

async function callImageApi(item) {
  const prompt = buildPrompt(item);
  if (singleCandidate) {
    const first = await callSingleImageApi(item, prompt);
    return [first, first];
  }
  if (!batchCandidates) {
    const first = await callSingleImageApi(item, prompt);
    const second = await callSingleImageApi(item, `${prompt}\nUse a clearly different angle and lighting while preserving exact item semantics.`);
    return [first, second];
  }
  const body = {
    model,
    prompt,
    n: 2,
    size,
  };
  let res = await fetchWithTimeout(imageEndpoint(baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status === 400) {
    const fallback = { ...body };
    delete fallback.response_format;
    res = await fetchWithTimeout(imageEndpoint(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(fallback),
    });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`image API ${res.status}: ${text.slice(0, 800)}`);
  }
  const json = await res.json();
  const data = Array.isArray(json.data) ? json.data : [];
  if (data.length < 2) {
    if (data.length === 1) {
      const second = await callSingleImageApi(item, `${prompt}\nAlternative composition, same object semantics.`);
      return [await decodeImageData(data[0]), second];
    }
    throw new Error('image API returned no candidates');
  }
  return Promise.all(data.slice(0, 2).map(decodeImageData));
}

async function callSingleImageApi(item, prompt) {
  return retryImageRequest(async () => {
    const body = { model, prompt, n: 1, size };
    const res = await fetchWithTimeout(imageEndpoint(baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`single image API ${res.status}: ${(await res.text()).slice(0, 800)}`);
    const json = await res.json();
    return decodeImageData(json.data?.[0]);
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`request timed out after ${requestTimeoutMs}ms`)), requestTimeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function retryImageRequest(fn) {
  let lastError = null;
  for (let attempt = 1; attempt <= imageRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      const retryable = /fetch failed|timed out|AbortError|single image API 429|Concurrency limit exceeded|rate_limit|single image API 5\d\d|upstream_error|token_revoked/i.test(message);
      if (!retryable || attempt >= imageRetries) break;
      const waitMs = /429|Concurrency limit exceeded|rate_limit/i.test(message) ? attempt * 90000 : attempt * 12000;
      console.warn(`  image retry ${attempt}/${imageRetries} after ${waitMs}ms: ${message.slice(0, 180)}`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function judgeCandidates(item, a, b) {
  if (!judgeModel) {
    return {
      choice: a.length >= b.length ? 'A' : 'B',
      method: 'byte-size-fallback',
      reason: 'No judge model configured; selected the more detailed/heavier PNG candidate.',
    };
  }
  const prompt = [
    `You are selecting an inventory icon for a wuxia RPG item: ${item.名称}.`,
    `Type: ${item.类型}; quality: ${item.品质}.`,
    'Choose A or B. Prefer the image that most clearly looks like realistic product photography of the named object as a single isolated prop, with no people, no text, no UI, no illustration style, and no semantic mismatch.',
    'Return compact JSON only: {"choice":"A","reason":"..."}',
  ].join('\n');
  try {
    const res = await fetch(chatEndpoint(baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: judgeModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${a.toString('base64')}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${b.toString('base64')}` } },
          ],
        }],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(`judge API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const text = String(json.choices?.[0]?.message?.content || '').trim();
    const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
    const choice = parsed.choice === 'B' ? 'B' : 'A';
    return { choice, method: 'vision-judge', reason: String(parsed.reason || '').slice(0, 240) };
  } catch (error) {
    return {
      choice: a.length >= b.length ? 'A' : 'B',
      method: 'byte-size-fallback-after-judge-error',
      reason: `Judge unavailable: ${error.message}`,
    };
  }
}

async function uploadImageToHost(item, buf) {
  if (noUpload) return `/assets/item-presets/${safeFileName(item.名称)}.png`;
  let lastError = null;
  for (let attempt = 1; attempt <= uploadRetries; attempt += 1) {
    try {
      const form = new FormData();
      form.append('file', new Blob([buf], { type: 'image/png' }), `${item.名称}.png`);
      const res = await fetchWithTimeout(`${uploadBase}/api/image-host/upload?storage=${encodeURIComponent(uploadStorage)}`, {
        method: 'POST',
        body: form,
      });
      const text = await res.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
      if (!res.ok || payload?.success === false) {
        throw new Error(`upload failed ${res.status}: ${String(payload?.error || text).slice(0, 500)}`);
      }
      const candidates = [
        payload?.links?.download,
        payload?.data?.links?.download,
        payload?.download,
        payload?.download_url,
        payload?.downloadUrl,
        payload?.data?.download,
        payload?.data?.download_url,
        payload?.data?.downloadUrl,
        payload?.data?.url,
        payload?.data?.file?.url,
        payload?.file?.links?.download,
        payload?.file?.download,
        payload?.file?.download_url,
        payload?.file?.downloadUrl,
        payload?.file?.url,
        payload?.url,
      ].map((value) => typeof value === 'string' ? value.trim() : '').find(Boolean);
      const id = payload?.file?.id || payload?.id || payload?.data?.file?.id || payload?.data?.id || '';
      const remoteUrl = candidates || (id ? `https://image.bacon159.pp.ua/api/v1/file/${encodeURIComponent(id)}` : '');
      if (!remoteUrl) throw new Error(`upload response has no url: ${text.slice(0, 500)}`);
      return remoteUrl;
    } catch (error) {
      lastError = error;
      if (attempt >= uploadRetries) break;
      const waitMs = attempt * 8000;
      console.warn(`  upload retry ${attempt}/${uploadRetries} after ${waitMs}ms: ${String(error?.message || error).slice(0, 180)}`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function updateRegistry(results) {
  if (noRegistry || results.length === 0) return;
  let source = await fs.readFile(registryPath, 'utf8');
  const existing = new Set([...source.matchAll(/名称:\s*'([^']+)'/g)].map((match) => match[1]));
  const newLines = [];
  let updateCount = 0;
  const escapeLiteral = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  for (const result of results) {
    const escaped = result.名称.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(\\{\\s*名称:\\s*'${escaped}'\\s*,\\s*类型:\\s*'[^']+'\\s*,\\s*品质:\\s*'[^']+'\\s*,\\s*图片URL:\\s*')[^']*('\\s*\\},)`);
    const next = source.replace(pattern, `$1${result.图片URL}$2`);
    if (next !== source) {
      source = next;
      updateCount += 1;
      continue;
    }
    if (!existing.has(result.名称)) {
      newLines.push(`    { 名称: '${escapeLiteral(result.名称)}', 类型: '${escapeLiteral(result.类型)}', 品质: '${escapeLiteral(result.品质)}', 图片URL: '${escapeLiteral(result.图片URL)}' },`);
      existing.add(result.名称);
      continue;
    }
    throw new Error(`registry entry could not be updated for ${result.名称}`);
  }
  if (newLines.length > 0) {
    const marker = '    // ─── 杂物/通用 ─────────────────────────────────────────────────────';
    if (!source.includes(marker)) throw new Error('presetItemImages.ts marker not found');
    const block = [
      '    // ─── 结构化物品库自动生成 ─────────────────────────────────────────',
      ...newLines,
      '',
    ].join('\n');
    source = source.replace(marker, `${block}${marker}`);
  }
  await fs.writeFile(registryPath, source, 'utf8');
  if (newLines.length || updateCount) {
    console.log(`  registry +${newLines.length}, updated=${updateCount}: data/presetItemImages.ts`);
  }
}

async function writeReviewHtml(records) {
  const rows = records.map((r) => {
    const relA = path.relative(rootDir, r.candidateA).replace(/\\/g, '/');
    const relB = path.relative(rootDir, r.candidateB).replace(/\\/g, '/');
    return `<article class="card">
      <h2>${r.名称}</h2>
      <p>${r.类型} / ${r.品质} / 选择 ${r.choice} / ${r.method}</p>
      <div class="pair">
        <figure class="${r.choice === 'A' ? 'selected' : ''}"><img src="../${relA}" loading="lazy"><figcaption>A</figcaption></figure>
        <figure class="${r.choice === 'B' ? 'selected' : ''}"><img src="../${relB}" loading="lazy"><figcaption>B</figcaption></figure>
      </div>
      <p class="reason">${r.reason}</p>
      <p class="url">${r.图片URL || ''}</p>
    </article>`;
  }).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>GPT Image 2 物品预设图对比</title>
  <style>
  body{font-family:system-ui,"Microsoft YaHei",sans-serif;background:#f3ead7;color:#352315;margin:0;padding:18px}
  h1{margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px}
  .card{background:#fff8ea;border:1px solid #d8bd8c;border-radius:8px;padding:10px;box-shadow:0 2px 8px #0001}
  h2{font-size:18px;margin:0 0 4px}.card p{margin:4px 0;font-size:12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  figure{margin:0;border:2px solid transparent;background:#ead9b8;border-radius:6px;overflow:hidden}
  figure.selected{border-color:#1f9d55;box-shadow:0 0 0 2px #1f9d5533}
  img{width:100%;aspect-ratio:1/1;object-fit:contain;display:block;background:#efe1c2}
  figcaption{text-align:center;font-weight:700;padding:4px}.reason{color:#6b4a28}.url{word-break:break-all;color:#6b7280}
  </style><h1>GPT Image 2 物品预设图对比</h1><div class="grid">${rows}</div>`;
  const htmlPath = path.join(outDir, 'review.html');
  await fs.writeFile(htmlPath, html, 'utf8');
  return htmlPath;
}

async function selectTargets() {
  const registryItems = await parsePresetRegistry();
  const registryMap = new Map(registryItems.map((item) => [item.名称, item]));
  let items = registryItems;
  if (fromStructured || modesArg) {
    const modeNames = modesArg
      ? modesArg.split(',').map((mode) => mode.trim()).filter(Boolean)
      : [];
    const validModes = new Set(Object.keys(题材模式预设物品名称清单));
    const sourceItems = modeNames.length > 0
      ? modeNames.flatMap((mode) => {
          if (!validModes.has(mode)) throw new Error(`Unknown topic mode: ${mode}`);
          return 获取题材模式预设物品库(mode);
        })
      : 结构化物品库;
    const seen = new Set();
    items = sourceItems
      .filter((item) => {
        if (seen.has(item.名称)) return false;
        seen.add(item.名称);
        return true;
      })
      .map((item) => ({
        名称: item.名称,
        类型: item.类型,
        品质: item.品质,
        图片URL: registryMap.get(item.名称)?.图片URL || '',
      }));
  }
  if (missingRegistry) {
    items = items.filter((item) => !registryMap.has(item.名称));
  }
  if (missingRemote) {
    items = items.filter((item) => !(registryMap.get(item.名称)?.图片URL || item.图片URL || '').trim());
  }
  if (only) {
    const terms = new Set(only.split(',').map((x) => x.trim()).filter(Boolean));
    items = items.filter((item) => terms.has(item.名称));
  }
  if (start) items = items.slice(start);
  if (limit) items = items.slice(0, limit);
  return items;
}

async function processItem(item, index, total) {
  const dir = path.join(outDir, safeFileName(item.名称));
  const candidateA = path.join(dir, 'A.png');
  const candidateB = path.join(dir, 'B.png');
  const selectedPath = path.join(dir, 'selected.png');
  const metaPath = path.join(dir, 'meta.json');
  console.log(`[${index + 1}/${total}] ${item.名称}`);
  await fs.mkdir(dir, { recursive: true });

  try {
    if (dryRun) {
      console.log(buildPrompt(item).slice(0, 500));
      return null;
    }

    let a;
    let b;
    if (localOnly) {
      a = await generateLocalFallbackImage(item);
      b = a;
    } else if (skipExisting) {
      try {
        [a, b] = await Promise.all([fs.readFile(candidateA), fs.readFile(candidateB)]);
      } catch (error) {
        if (fallbackLocal) {
          console.warn(`  image API/cache unavailable, using local fallback: ${error.message}`);
          a = await generateLocalFallbackImage(item);
          b = a;
        } else {
          [a, b] = await callImageApi(item);
        }
      }
    } else {
      try {
        [a, b] = await callImageApi(item);
      } catch (error) {
        if (!fallbackLocal) throw error;
        console.warn(`  image API failed, using local fallback: ${error.message}`);
        a = await generateLocalFallbackImage(item);
        b = a;
      }
    }
    await fs.writeFile(candidateA, a);
    await fs.writeFile(candidateB, b);
    const judged = await judgeCandidates(item, a, b);
    const selected = judged.choice === 'B' ? b : a;
    await fs.writeFile(selectedPath, selected);
    const 图片URL = await uploadImageToHost(item, selected);
    const record = {
      ...item,
      choice: judged.choice,
      method: judged.method,
      reason: judged.reason,
      图片URL,
      candidateA,
      candidateB,
      selectedPath,
      bytesA: a.length,
      bytesB: b.length,
    };
    await fs.writeFile(metaPath, JSON.stringify(record, null, 2), 'utf8');
    await updateRegistry([record]);
    return record;
  } catch (error) {
    const failed = {
      ...item,
      error: error.message,
      candidateA,
      candidateB,
      selectedPath,
    };
    await fs.writeFile(metaPath, JSON.stringify(failed, null, 2), 'utf8');
    console.error(`[FAILED] ${item.名称}: ${error.message}`);
    return failed;
  }
}

async function main() {
  const targets = await selectTargets();
  console.log(`GPT Image 2 preset generation`);
  console.log(`targets=${targets.length} model=${model} size=${size} base=${baseUrl} concurrency=${concurrency} upload=${!noUpload} judge=${judgeModel || 'fallback'} localOnly=${localOnly} fallbackLocal=${fallbackLocal}`);
  await fs.mkdir(outDir, { recursive: true });
  const results = [];
  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((item, j) => processItem(item, i + j, targets.length)));
    for (const result of batchResults) {
      if (result && !result.error) results.push(result);
    }
    await writeReviewHtml(results);
  }
  const htmlPath = await writeReviewHtml(results);
  await fs.writeFile(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log(`done=${results.length}`);
  console.log(`review=${htmlPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
