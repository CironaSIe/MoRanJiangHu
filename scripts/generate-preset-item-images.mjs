/**
 * 批量生成预置物品图片并上传到 R2 CDN
 *
 * 用法:
 *   node scripts/generate-preset-item-images.mjs --api-key <KEY> [--base-url <URL>] [--model <MODEL>] [--concurrency <N>] [--dry-run] [--only <filename>]
 *
 * 环境变量 (可替代命令行参数):
 *   OPENAI_API_KEY / IMAGE_API_KEY   - 文生图 API Key
 *   IMAGE_API_BASE_URL               - 文生图 API 地址 (默认 https://api.openai.com/v1)
 *   IMAGE_MODEL                      - 模型名 (默认 gpt-image-1)
 *
 * 依赖: wrangler 已登录 (用于 R2 上传)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, '.tmp-preset-images');

// ─── 物品列表 (从 presetItemImages.ts 提取) ─────────────────────────────────

const items = [
  { filename: 'weapon-sword-fine-01.png', name: '青钢剑', type: '武器', quality: '良品', desc: 'a fine steel jian sword with blue-green tinted blade, simple crossguard, leather-wrapped handle' },
  { filename: 'weapon-sword-fine-02.png', name: '精钢长剑', type: '武器', quality: '良品', desc: 'a refined steel long jian sword, polished mirror blade with faint hexagonal ridge, brass crossguard with simple ornament, dark leather cord wrapped grip, brass pommel cap, practical martial sword, clean craftsmanship' },
  { filename: 'weapon-sword-top-01.png', name: '玄铁重剑', type: '武器', quality: '极品', desc: 'a massive dark iron heavy sword, thick blade with no edge, raw brutal weight, dark metal surface' },
  { filename: 'weapon-sword-superior-01.png', name: '碧水长剑', type: '武器', quality: '上品', desc: 'an elegant long sword with water-blue blade, flowing wave patterns etched on steel, jade pommel' },
  { filename: 'weapon-sword-mythic-01.png', name: '断水剑', type: '武器', quality: '绝世', desc: 'a legendary thin blade that seems to cut through water itself, ethereal glow, impossibly sharp edge, ancient craftsmanship' },
  { filename: 'weapon-sword-common-01.png', name: '锈铁剑', type: '武器', quality: '凡品', desc: 'a rusty old iron sword, pitted blade with orange rust spots, worn wooden handle, cheap and neglected' },
  { filename: 'weapon-saber-fine-01.png', name: '柳叶刀', type: '武器', quality: '良品', desc: 'a willow-leaf saber with curved single-edged blade, brass guard, wooden scabbard' },
  { filename: 'weapon-saber-superior-01.png', name: '鬼头大刀', type: '武器', quality: '上品', desc: 'a large broad dao with ghost-head ring pommel, heavy chopping blade, iron fittings, intimidating presence' },
  { filename: 'weapon-saber-mythic-01.png', name: '雪饮狂刀', type: '武器', quality: '绝世', desc: 'a legendary wild saber with frost-white blade edge, blood groove, cold mist emanating, masterwork steel' },
  { filename: 'weapon-spear-fine-01.png', name: '白蜡杆枪', type: '武器', quality: '良品', desc: 'a Chinese spear with white wax wood shaft, leaf-shaped steel spearhead, red tassel below the blade' },
  { filename: 'weapon-spear-top-01.png', name: '霸王枪', type: '武器', quality: '极品', desc: 'a heavy war spear with broad crescent blade, thick iron shaft, dragon engravings, imposing and powerful' },
  { filename: 'weapon-staff-common-01.png', name: '齐眉棍', type: '武器', quality: '凡品', desc: 'a plain wooden staff at eyebrow height, smooth hardwood, simple iron caps on both ends' },
  { filename: 'weapon-bow-superior-01.png', name: '铁胎弓', type: '武器', quality: '上品', desc: 'a powerful composite bow with iron-core limbs, horn and sinew layers, silk bowstring, superior craftsmanship' },
  { filename: 'weapon-hidden-fine-01.png', name: '袖箭', type: '武器', quality: '良品', desc: 'a wrist-mounted sleeve arrow launcher, compact brass mechanism, spring-loaded, concealed weapon' },
  { filename: 'weapon-hidden-superior-01.png', name: '毒针', type: '武器', quality: '上品', desc: 'a set of thin silver needles with dark poison coating on tips, stored in a silk-lined case' },
  { filename: 'armor-heavy-top-01.png', name: '玄铁护甲', type: '防具', quality: '极品', desc: 'a full dark iron chest armor with layered plates, riveted construction, heavy and impenetrable' },
  { filename: 'armor-chain-superior-01.png', name: '锁子甲', type: '防具', quality: '上品', desc: 'a fine chainmail shirt with interlocking iron rings, flexible yet protective, worn over cloth padding' },
  { filename: 'armor-soft-mythic-01.png', name: '软猬甲', type: '防具', quality: '绝世', desc: 'a legendary soft inner armor covered in tiny steel barbs, looks like silk but deflects blades, hidden protection' },
  { filename: 'armor-cloth-common-01.png', name: '布衣', type: '防具', quality: '凡品', desc: 'a simple coarse cloth robe, plain undyed fabric, commoner garment, no protection' },
  { filename: 'armor-training-common-01.png', name: '青色练功服', type: '防具', quality: '凡品', desc: 'a single folded dark teal green training uniform, traditional Chinese wuxia practice robe, cotton fabric with knotted frog buttons down the front, simple crossed collar, loose sleeves, plain fabric sash beside it, neatly laid flat on neutral background, no person wearing, isolated garment only' },
  { filename: 'armor-pants-common-01.png', name: '粗布长裤', type: '防具', quality: '凡品', desc: 'a pair of loose wide-leg coarse cloth trousers, undyed beige linen fabric, traditional Chinese wuxia martial arts pants, cord waistband, plain folded flat on neutral background, isolated garment only, no person' },
  { filename: 'armor-shoes-common-01.png', name: '旧布鞋', type: '防具', quality: '凡品', desc: 'a single pair of worn old Chinese cloth shoes, beige canvas upper with black cotton trim, thin multi-layered cloth sole, traditional rural footwear, slightly dirty and frayed, placed side by side on neutral background, isolated objects' },
  { filename: 'armor-robe-fine-01.png', name: '青衫', type: '防具', quality: '良品', desc: 'a scholar blue-green cotton robe, neat stitching, simple but dignified, literati style' },
  { filename: 'armor-bracer-fine-01.png', name: '护腕', type: '防具', quality: '良品', desc: 'a pair of leather bracers with metal studs, forearm protection, buckle straps' },
  { filename: 'pill-bigu-common-01.png', name: '辟谷丹', type: '消耗品', quality: '凡品', desc: 'a small brown medicinal pill in a simple clay jar, fasting pill that suppresses hunger' },
  { filename: 'pill-huiqi-common-01.png', name: '回气丹', type: '消耗品', quality: '凡品', desc: 'a pale white qi-recovery pill in a small porcelain bottle, faint herbal scent' },
  { filename: 'pill-ningyuan-fine-01.png', name: '凝元丹', type: '消耗品', quality: '良品', desc: 'a translucent amber pill with swirling inner energy visible, stored in jade container' },
  { filename: 'pill-pojing-top-01.png', name: '破境丹', type: '消耗品', quality: '极品', desc: 'a radiant golden breakthrough pill with crackling energy surface, precious wooden box lined with silk' },
  { filename: 'pill-dahuan-mythic-01.png', name: '大还丹', type: '消耗品', quality: '绝世', desc: 'a legendary crimson healing pill glowing with inner light, stored in an ancient jade gourd, supreme medicine' },
  { filename: 'medicine-jinchuang-common-01.png', name: '金创药', type: '消耗品', quality: '凡品', desc: 'a small cloth pouch of yellow-brown wound powder, hemostatic herbal medicine for cuts' },
  { filename: 'medicine-jiedu-fine-01.png', name: '解毒散', type: '消耗品', quality: '良品', desc: 'a paper packet of green antidote powder, pungent herbal smell, detoxification medicine' },
  { filename: 'pill-xuming-top-01.png', name: '续命丹', type: '消耗品', quality: '极品', desc: 'a deep red life-extending pill with golden flecks, stored in a sealed bronze case, emergency medicine' },
  { filename: 'material-ore-superior-01.png', name: '寒铁矿', type: '材料', quality: '上品', desc: 'a chunk of cold iron ore with frost crystals on surface, dark blue-grey metallic rock, cold to touch' },
  { filename: 'material-herb-top-01.png', name: '千年灵芝', type: '材料', quality: '极品', desc: 'a thousand-year lingzhi mushroom with deep red cap and golden spore dust, growing on ancient wood' },
  { filename: 'material-animal-fine-01.png', name: '蛇胆', type: '材料', quality: '良品', desc: 'a dark green snake gallbladder in a small glass vial, medicinal ingredient, slightly translucent' },
  { filename: 'material-gem-superior-01.png', name: '玄冰石', type: '材料', quality: '上品', desc: 'a crystal of dark ice that never melts, deep blue translucent stone with frost aura, cold energy within' },
  { filename: 'material-herb-superior-01.png', name: '百年何首乌', type: '材料', quality: '上品', desc: 'a century-old he shou wu root in humanoid shape, dark brown with fibrous texture, rare herb' },
  { filename: 'material-wood-fine-01.png', name: '铁木', type: '材料', quality: '良品', desc: 'a section of ironwood timber, extremely dense dark grain, heavier than water, hard as metal' },
  { filename: 'material-leather-common-01.png', name: '兽皮', type: '材料', quality: '凡品', desc: 'a piece of rough animal hide, tan colored, partially cured, basic crafting leather' },
  { filename: 'scroll-sword-common-01.png', name: '基础剑法残卷', type: '秘籍', quality: '凡品', desc: 'a torn and incomplete bamboo scroll with basic sword technique diagrams, faded ink' },
  { filename: 'scroll-inner-fine-01.png', name: '吐纳心法', type: '秘籍', quality: '良品', desc: 'a well-preserved paper scroll with breathing cultivation method, neat calligraphy, silk ribbon tie' },
  { filename: 'scroll-agility-fine-01.png', name: '轻身术', type: '秘籍', quality: '良品', desc: 'a thin silk scroll depicting lightness movement techniques, figure illustrations showing leaping poses' },
  { filename: 'scroll-defense-superior-01.png', name: '金钟罩', type: '秘籍', quality: '上品', desc: 'a thick bound manual with golden bell cover illustration, iron body defense technique, heavy paper' },
  { filename: 'scroll-legendary-01.png', name: '九阳真经', type: '秘籍', quality: '传说', desc: 'a legendary scripture on ancient yellowed parchment, radiating warm golden light, supreme internal art' },
  { filename: 'accessory-jade-fine-01.png', name: '玉佩', type: '饰品', quality: '良品', desc: 'a carved white jade pendant with cloud motif, smooth polished surface, silk cord' },
  { filename: 'accessory-hairpin-fine-01.png', name: '银簪', type: '饰品', quality: '良品', desc: 'a silver hairpin with delicate floral tip design, polished mirror finish, elegant and simple' },
  { filename: 'accessory-amulet-superior-01.png', name: '护身符', type: '饰品', quality: '上品', desc: 'a protective talisman on yellow paper with red cinnabar characters, sealed in a brocade pouch' },
  { filename: 'accessory-pearl-top-01.png', name: '夜明珠', type: '饰品', quality: '极品', desc: 'a luminous night pearl glowing soft blue-green in darkness, perfectly spherical, on a carved stand' },
  { filename: 'misc-firestarter-common-01.png', name: '火折子', type: '杂物', quality: '凡品', desc: 'a bamboo fire starter tube with smoldering tinder inside, brass cap, portable fire tool' },
  { filename: 'misc-rope-common-01.png', name: '绳索', type: '杂物', quality: '凡品', desc: 'a coil of hemp rope, rough braided fiber, practical utility item' },
  { filename: 'misc-map-fine-01.png', name: '地图', type: '杂物', quality: '良品', desc: 'a hand-drawn map on aged paper showing mountains rivers and paths, ink brush cartography' },
  { filename: 'misc-silver-common-01.png', name: '银两', type: '杂物', quality: '凡品', desc: 'a small pile of silver ingots and loose silver pieces, Chinese sycee boat-shaped currency' },
];

// ─── 参数解析 ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : undefined;
};
const hasFlag = (name) => args.includes(`--${name}`);

const apiKey = getArg('api-key') || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY;
const baseUrl = (getArg('base-url') || process.env.IMAGE_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const model = getArg('model') || process.env.IMAGE_MODEL || 'gpt-image-1';
const concurrency = parseInt(getArg('concurrency') || '1', 10);
const dryRun = hasFlag('dry-run');
const onlyFile = getArg('only');
const skipExisting = hasFlag('skip-existing');
const noUpload = hasFlag('no-upload');

const R2_BUCKET = 'quark-downloads-bacon';
const R2_PREFIX = 'moranjianghu/item-images';

if (!apiKey && !dryRun) {
  console.error('错误: 请提供 --api-key 或设置 IMAGE_API_KEY / OPENAI_API_KEY 环境变量');
  process.exit(1);
}

// ─── 提示词构建 ──────────────────────────────────────────────────────────────

const qualityMap = { '传说': 'legendary', '绝世': 'mythic', '极品': 'top grade', '上品': 'superior', '良品': 'fine', '凡品': 'common' };
const typeMap = { '武器': 'weapon', '防具': 'armor', '消耗品': 'consumable', '材料': 'crafting material', '秘籍': 'scroll', '饰品': 'accessory', '杂物': 'miscellaneous object' };

function buildPrompt(item) {
  return [
    'photorealistic product photo of a single physical game prop, centered on a plain neutral background, realistic materials and soft shadow',
    'photorealistic single prop product photography, isolated physical object only, real metal leather cloth wood or paper materials, studio lighting, tactile surface detail, neutral matte background, no card design, no UI icon layout, no poster layout, no ink painting, no guofeng illustration, no text, no letters, no label, no inscription, no logo, no watermark',
    `a single ${qualityMap[item.quality] || 'common'} ${typeMap[item.type] || 'prop'} prop`,
    `form and materials: ${item.desc}`,
    'absolutely no text, no letters, no numbers, no Chinese characters, no captions, no labels, no watermarks, no logos, no UI, no card frame, no badges'
  ].join('\n');
}

// ─── 图片生成 ────────────────────────────────────────────────────────────────

async function generateImage(item) {
  const prompt = buildPrompt(item);

  if (dryRun) {
    console.log(`[DRY-RUN] ${item.filename}: ${item.name}`);
    console.log(`  prompt: ${prompt.slice(0, 120)}...`);
    return null;
  }

  const body = {
    model,
    prompt,
    n: 1,
    size: '1024x1024',
  };

  // gpt-image 系列用 response_format
  if (model.startsWith('gpt-image')) {
    body.response_format = 'b64_json';
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const data = json.data?.[0];

  if (data?.b64_json) {
    return Buffer.from(data.b64_json, 'base64');
  } else if (data?.url) {
    const imgRes = await fetch(data.url);
    if (!imgRes.ok) throw new Error(`下载图片失败: ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error('API 返回无图片数据');
}

// ─── R2 上传 ─────────────────────────────────────────────────────────────────

function uploadToR2(filename, localPath) {
  const r2Key = `${R2_BUCKET}/${R2_PREFIX}/${filename}`;
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, [
    'wrangler', 'r2', 'object', 'put', r2Key,
    '--file', localPath,
    '--content-type', 'image/png',
    '--cache-control', 'public, max-age=31536000, immutable',
    '--remote'
  ], { cwd: rootDir, stdio: 'pipe', shell: process.platform === 'win32' });

  if (result.status !== 0) {
    const err = result.stderr?.toString() || result.stdout?.toString() || '';
    throw new Error(`R2 上传失败 ${filename}: ${err.slice(0, 200)}`);
  }
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

async function processItem(item, index, total) {
  const localPath = path.join(outDir, item.filename);
  const tag = `[${index + 1}/${total}]`;

  if (skipExisting && fs.existsSync(localPath)) {
    console.log(`${tag} 跳过已存在: ${item.filename} (${item.name})`);
    if (!noUpload && !dryRun) uploadToR2(item.filename, localPath);
    return;
  }

  console.log(`${tag} 生成: ${item.filename} (${item.name})`);
  const buf = await generateImage(item);
  if (!buf) return; // dry-run

  fs.writeFileSync(localPath, buf);
  console.log(`${tag} 已保存: ${localPath} (${(buf.length / 1024).toFixed(1)} KB)`);

  if (!noUpload) {
    uploadToR2(item.filename, localPath);
    console.log(`${tag} 已上传 R2: ${R2_PREFIX}/${item.filename}`);
  }
}

async function main() {
  const targetItems = onlyFile ? items.filter(i => i.filename === onlyFile) : items;

  if (targetItems.length === 0) {
    console.error(`未找到匹配的物品: ${onlyFile}`);
    process.exit(1);
  }

  console.log(`\n预置物品图片生成器`);
  console.log(`─────────────────────────────────`);
  console.log(`目标: ${targetItems.length} 张图片`);
  console.log(`模型: ${model}`);
  console.log(`API:  ${baseUrl}`);
  console.log(`并发: ${concurrency}`);
  console.log(`上传: ${noUpload ? '否' : '是 → R2'}`);
  console.log(`模式: ${dryRun ? 'DRY-RUN' : '正式生成'}`);
  console.log(`─────────────────────────────────\n`);

  if (!dryRun) fs.mkdirSync(outDir, { recursive: true });

  // 按并发数分批执行
  for (let i = 0; i < targetItems.length; i += concurrency) {
    const batch = targetItems.slice(i, i + concurrency);
    await Promise.all(batch.map((item, j) => processItem(item, i + j, targetItems.length)));
  }

  console.log(`\n✓ 完成! 共处理 ${targetItems.length} 张图片`);
  if (!dryRun && !noUpload) {
    console.log(`  CDN 路径: /api/item-images/{filename}.png`);
    console.log(`  R2 路径:  ${R2_PREFIX}/`);
  }
}

main().catch(err => {
  console.error('致命错误:', err.message);
  process.exit(1);
});
