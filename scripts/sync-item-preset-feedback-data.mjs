import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'presetItemImages.ts');
const outputPath = path.join(root, 'public', 'assets', 'item-preset-feedback-data.json');

const source = fs.readFileSync(sourcePath, 'utf8');
const itemPattern = /\{\s*名称:\s*'([^']+)'\s*,\s*类型:\s*'([^']+)'\s*,\s*品质:\s*'([^']+)'\s*,\s*图片URL:\s*'([^']+)'\s*\}/g;
const xianxiaNames = new Set([
  '引气丹', '聚灵丹', '筑基丹', '结金丹', '凝婴丹', '化神丹', '清心丹', '玉骨扇', '淬体丹', '洗髓丹', '护脉丹', '回灵丹', '培元丹',
  '下品灵石', '中品灵石', '上品灵石', '极品灵石', '灵晶', '赤阳石', '星辰砂', '空冥石', '雷击木', '灵竹', '月华草', '凝露草', '血参', '朱果', '妖丹',
  '炼气诀', '筑基心得', '御剑术', '小五行术', '太乙剑诀', '炼丹初解', '符箓入门',
  '火球符', '冰锥符', '雷光符', '金刚符', '神行符', '隐身符', '传音符', '传送符',
  '青竹飞剑', '寒霜飞剑', '紫电飞剑', '青玉葫芦', '养魂铃', '镇魂铃', '玄光镜', '八卦镜', '缚妖索', '储物袋', '储物戒', '灵兽袋', '聚灵阵盘', '护山阵盘', '寻灵罗盘',
  '紫铜丹炉', '玄铁丹炉', '炼器锤', '青云法袍', '月白法袍', '玄纹法冠', '避尘靴'
]);

const items = [];
const seen = new Set();
for (const match of source.matchAll(itemPattern)) {
  const [, name, type, quality, src] = match;
  if (seen.has(name)) continue;
  seen.add(name);
  items.push({
    name,
    type,
    quality,
    src,
    category: xianxiaNames.has(name) ? '仙侠' : '武侠',
    source: /^https?:\/\//i.test(src) ? '远程图' : '本地',
  });
}

if (!items.length) {
  throw new Error(`No preset item images parsed from ${sourcePath}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log(`Synced ${items.length} item preset feedback entries to ${outputPath}`);
