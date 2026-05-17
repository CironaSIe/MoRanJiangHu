#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 默认ComfyUI工作流JSON, 默认NSFWComfyUI工作流JSON } from '../data/defaultComfyWorkflow.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'assets', 'item-presets');
const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
};

const COMFY_URL = getArg('comfy').replace(/\/+$/, '');
const ONLY = getArg('only');
const WIDTH = Number(getArg('width', '768')) || 768;
const HEIGHT = Number(getArg('height', '768')) || 768;
const STEPS = Number(getArg('steps', '4')) || 4;
const CFG = Number(getArg('cfg', '1')) || 1;
const SAMPLER = getArg('sampler', 'euler');
const SCHEDULER = getArg('scheduler', 'simple');
const WORKFLOW = getArg('workflow', 'normal');

if (!COMFY_URL) throw new Error('Missing --comfy');

const common = 'photorealistic product photo of a single physical wuxia inventory item, centered on warm neutral parchment, realistic material texture, studio lighting, soft shadow, clean silhouette, no text, no letters, no logo, no watermark, no UI, no card frame';
const negative = 'text, letters, numbers, chinese characters, caption, label, watermark, logo, signature, ui, card frame, border, badge, collage, person, human, hand, feet, face, modern plastic, blurry, low quality, jpeg artifacts';

const targets = [
  { name: '金创药', filename: '金创药.png', seed: 951001, prompt: `${common}, traditional wound medicine powder, yellow brown crushed herbal powder spilling from a folded paper packet and rough linen pouch tied with string, ancient battlefield first aid prop, loose powder grains and dried herbs, no bottle, no jar` },
  { name: '钢剑', filename: '钢剑.png', seed: 951002, prompt: `${common}, refined polished steel Chinese jian sword, straight double edged blade, visible central ridge, simple brass guard, dark leather wrapped handle, practical martial sword` },
  { name: '铁剑', filename: '铁剑.png', seed: 951003, prompt: `${common}, rough forged iron Chinese jian sword, dark metal blade, simple worn wooden grip, utilitarian martial weapon` },
  { name: '木剑', filename: '木剑.png', seed: 951004, prompt: `${common}, plain wooden practice jian sword, carved hardwood blade and handle, training weapon, visible wood grain` },
  { name: '钢盔甲', filename: '钢盔甲.png', seed: 951005, prompt: `${common}, wearable steel armor vest, chest and back panels, shoulder straps, arm openings, waist hem, polished riveted plates, torso armor only` },
  { name: '铁盔甲', filename: '铁盔甲.png', seed: 951006, prompt: `${common}, rough iron armor vest, dark riveted metal plates, torso protection, shoulder straps, arm openings, waist hem` },
  { name: '草鞋', filename: '草鞋.png', seed: 951007, prompt: `${common}, a pair of empty woven straw sandals placed side by side, rustic ancient footwear, visible straw weave and simple ties, no feet` },
];

const inject = (value, replacements) => {
  if (typeof value === 'string') {
    const exact = replacements[value];
    if (exact !== undefined) return exact;
    return Object.entries(replacements).reduce((text, [key, replacement]) => text.replaceAll(key, String(replacement)), value);
  }
  if (Array.isArray(value)) return value.map((item) => inject(item, replacements));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, inject(child, replacements)]));
  }
  return value;
};

const buildWorkflow = (item) => inject(JSON.parse(WORKFLOW === 'fallback' ? 默认NSFWComfyUI工作流JSON : 默认ComfyUI工作流JSON), {
  '__PROMPT__': item.prompt,
  '__NEGATIVE_PROMPT__': negative,
  '__WIDTH__': WIDTH,
  '__HEIGHT__': HEIGHT,
  '__SEED__': item.seed,
  '__STEPS__': STEPS,
  '__CFG__': CFG,
  '__SAMPLER__': SAMPLER,
  '__SCHEDULER__': SCHEDULER,
});

async function submitPrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: `mrjh-structured-${Math.random().toString(36).slice(2, 10)}` }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /prompt ${res.status}: ${text.slice(0, 800)}`);
  const json = JSON.parse(text);
  if (!json.prompt_id) throw new Error(`Bad response: ${text.slice(0, 800)}`);
  return json.prompt_id;
}

async function waitForHistory(promptId, timeoutMs = 240000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    if (res.ok) {
      const json = await res.json();
      const entry = json?.[promptId];
      if (entry?.status?.completed) return entry;
      if (entry?.status?.status_str === 'error') throw new Error(JSON.stringify(entry.status.messages).slice(0, 1200));
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Timed out waiting for ComfyUI result');
}

const extractOutputFile = (entry) => {
  for (const output of Object.values(entry?.outputs || {})) {
    if (Array.isArray(output?.images) && output.images[0]) return output.images[0];
  }
  return null;
};

async function downloadView(fileRef) {
  const qs = new URLSearchParams({
    filename: fileRef.filename,
    subfolder: fileRef.subfolder || '',
    type: fileRef.type || 'output',
  });
  const res = await fetch(`${COMFY_URL}/view?${qs.toString()}`);
  if (!res.ok) throw new Error(`GET /view ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

await fs.mkdir(outDir, { recursive: true });
const stats = await fetch(`${COMFY_URL}/system_stats`).then((r) => r.json());
console.log(`ComfyUI ${stats.system?.comfyui_version || 'unknown'} ready`);
const selected = ONLY ? targets.filter((item) => item.name === ONLY || item.filename === ONLY) : targets;
for (const item of selected) {
  console.log(`[${item.name}] generating...`);
  const promptId = await submitPrompt(buildWorkflow(item));
  console.log(`  prompt_id=${promptId}`);
  const history = await waitForHistory(promptId);
  const fileRef = extractOutputFile(history);
  if (!fileRef) throw new Error('No output image');
  const buf = await downloadView(fileRef);
  const localPath = path.join(outDir, item.filename);
  await fs.writeFile(localPath, buf);
  console.log(`  saved ${localPath} ${(buf.length / 1024).toFixed(1)}KB`);
}
