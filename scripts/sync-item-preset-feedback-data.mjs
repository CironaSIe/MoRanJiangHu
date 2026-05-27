import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'presetItemImages.ts');
const structuredLibraryPath = path.join(root, 'data', 'structuredItemLibrary.ts');
const outputPath = path.join(root, 'public', 'assets', 'item-preset-feedback-data.json');

const source = fs.readFileSync(sourcePath, 'utf8');
const structuredLibrary = fs.readFileSync(structuredLibraryPath, 'utf8');
const itemPattern = /\{\s*名称:\s*'([^']+)'\s*,\s*类型:\s*'([^']+)'\s*,\s*品质:\s*'([^']+)'\s*,\s*图片URL:\s*'([^']+)'\s*\}/g;

const topicModes = ['武侠', '仙侠', '灵气复苏', '都市修仙', '现代都市', '末日丧尸'];

function extractNamesFromConstArray(sourceText, constName) {
  const start = sourceText.indexOf(`const ${constName}`);
  if (start < 0) return [];
  const arrayStart = sourceText.indexOf('[', start);
  const arrayEnd = sourceText.indexOf('];', arrayStart);
  if (arrayStart < 0 || arrayEnd < 0) return [];
  return Array.from(sourceText.slice(arrayStart, arrayEnd).matchAll(/名称:\s*'([^']+)'/g), (match) => match[1]);
}

const xianxiaExclusiveNames = new Set(extractNamesFromConstArray(structuredLibrary, '仙侠预设物品'));
const modernNames = new Set(extractNamesFromConstArray(structuredLibrary, '现代预设物品'));
const apocalypseNames = new Set(extractNamesFromConstArray(structuredLibrary, '末日预设物品'));

const xianxiaExtraNames = new Set(['玉骨扇']);
const apocalypseModernFallbackNames = new Set(['智能手机', '急救包', '维修工具箱', '多功能工具钳', '备用电池组', '防护口罩', '运动鞋']);

const modernPattern = /(智能手机|手机|录音笔|笔记本电脑|电脑|急救包|防割手套|银行卡|现金|信封|合同|证件|U盘|车钥匙|维修|工具箱|工具钳|电子元件|备用电池|防身喷雾|警棍|夹克|防护口罩|运动鞋|急救手册|电脑维修手册|便携检测仪|防护服|异常样本盒|灵能探测器|灵气抑制贴|银戒指|怀表)/;
const apocalypsePattern = /(罐头|净水|电筒|弩机|抗生素|饮水瓶|汽油|压缩饼干|绷带|止血带|过滤|干电池|滤芯|太阳能|弹药|护目镜|防毒面具|撬棍|战术背心|消音弩|求生|营地|无线电|防水火柴|感染)/;
const xianxiaPattern = /(引气丹|聚灵丹|筑基丹|结金丹|凝婴丹|化神丹|淬体丹|洗髓丹|护脉丹|回灵丹|培元丹|灵石|灵晶|赤阳石|星辰砂|空冥石|雷击木|灵竹|月华草|凝露草|血参|朱果|妖丹|炼气诀|筑基心得|御剑术|小五行术|太乙剑诀|炼丹|符箓|火球符|冰锥符|雷光符|金刚符|神行符|隐身符|传音符|传送符|飞剑|葫芦|养魂铃|镇魂铃|玄光镜|八卦镜|缚妖索|储物袋|储物戒|灵兽袋|阵盘|罗盘|丹炉|炼器锤|法袍|法冠|法靴|宗门|秘境|传承玉符|洞府)/;

function isModernItem(name) {
  return modernNames.has(name) || modernPattern.test(name);
}

function isApocalypseItem(name) {
  return apocalypseNames.has(name) || apocalypsePattern.test(name);
}

function isXianxiaExclusiveItem(name) {
  return xianxiaExclusiveNames.has(name) || xianxiaExtraNames.has(name) || xianxiaPattern.test(name);
}

function categoriesForItem(item) {
  const name = item.name;
  const modern = isModernItem(name);
  const apocalypse = isApocalypseItem(name);
  const xianxiaExclusive = isXianxiaExclusiveItem(name);
  const premodern = !modern && !apocalypse;
  const xianxiaModeItem = premodern || xianxiaExclusive;
  const categories = new Set();

  if (premodern && !xianxiaExclusive) categories.add('武侠');
  if (xianxiaModeItem) categories.add('仙侠');
  if (modern || xianxiaModeItem) categories.add('灵气复苏');
  if (modern || xianxiaModeItem) categories.add('都市修仙');
  if (modern) categories.add('现代都市');
  if (apocalypse || apocalypseModernFallbackNames.has(name)) categories.add('末日丧尸');
  if (!categories.size) categories.add('武侠');

  return topicModes.filter((mode) => categories.has(mode));
}

const items = [];
const seen = new Set();
for (const match of source.matchAll(itemPattern)) {
  const [, name, type, quality, src] = match;
  if (seen.has(name)) continue;
  seen.add(name);
  const item = {
    name,
    type,
    quality,
    src,
    source: /^https?:\/\//i.test(src) ? '远程图' : '本地',
  };
  for (const category of categoriesForItem(item)) {
    items.push({
      id: `${category}:${name}`,
      ...item,
      category,
    });
  }
}

if (!items.length) {
  throw new Error(`No preset item images parsed from ${sourcePath}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log(`Synced ${items.length} item preset feedback entries to ${outputPath}`);
