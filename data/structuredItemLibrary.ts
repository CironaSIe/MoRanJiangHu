import type { 物品品质, 物品类型 } from '../models/item';

export interface 结构化物品条目 {
    名称: string;
    材质?: string;
    物品: string;
    类型: 物品类型;
    品质: 物品品质;
    装备位置?: string;
    武器子类?: string;
    视觉标签: string[];
    生图描述: string;
}

const 武器材质 = [
    { 名称: '木', 品质: '凡品', 标签: ['wood', 'plain wooden'] },
    { 名称: '竹', 品质: '凡品', 标签: ['bamboo', 'lightweight'] },
    { 名称: '铁', 品质: '凡品', 标签: ['dark iron', 'rough forged metal'] },
    { 名称: '钢', 品质: '良品', 标签: ['polished steel', 'refined metal'] },
    { 名称: '精钢', 品质: '良品', 标签: ['refined steel', 'clean craftsmanship'] },
    { 名称: '寒铁', 品质: '上品', 标签: ['cold iron', 'frosted dark metal'] },
    { 名称: '玄铁', 品质: '极品', 标签: ['black iron', 'heavy dark metal'] },
    { 名称: '乌金', 品质: '极品', 标签: ['blackened gold alloy', 'dark metallic sheen'] },
] as const;

const 防具材质 = [
    { 名称: '粗布', 品质: '凡品', 标签: ['coarse cloth', 'plain textile'] },
    { 名称: '布', 品质: '凡品', 标签: ['cloth', 'woven fabric'] },
    { 名称: '皮', 品质: '凡品', 标签: ['leather', 'stitched hide'] },
    { 名称: '铁', 品质: '良品', 标签: ['iron plates', 'riveted metal'] },
    { 名称: '钢', 品质: '良品', 标签: ['steel plates', 'polished metal'] },
    { 名称: '精钢', 品质: '上品', 标签: ['refined steel armor', 'clean bright plates'] },
    { 名称: '寒铁', 品质: '上品', 标签: ['cold iron armor', 'frosted metal'] },
    { 名称: '玄铁', 品质: '极品', 标签: ['black iron armor', 'heavy dark plates'] },
    { 名称: '乌金', 品质: '极品', 标签: ['blackened gold armor', 'dark flexible scales'] },
] as const;

const 武器模板 = [
    { 物品: '剑', 子类: '剑' },
    { 物品: '长剑', 子类: '剑' },
    { 物品: '短剑', 子类: '剑' },
    { 物品: '刀', 子类: '刀' },
    { 物品: '短刀', 子类: '刀' },
    { 物品: '匕首', 子类: '暗器' },
    { 物品: '枪', 子类: '枪' },
    { 物品: '矛', 子类: '枪' },
    { 物品: '棍', 子类: '棍' },
    { 物品: '杖', 子类: '棍' },
    { 物品: '弓', 子类: '暗器' },
    { 物品: '弩', 子类: '暗器' },
    { 物品: '飞刀', 子类: '暗器' },
    { 物品: '袖箭', 子类: '暗器' },
] as const;

const 防具模板 = [
    { 物品: '盔甲', 位置: '胸部' },
    { 物品: '护甲', 位置: '胸部' },
    { 物品: '软甲', 位置: '胸部' },
    { 物品: '护腕', 位置: '手部' },
    { 物品: '护腿', 位置: '腿部' },
    { 物品: '护膝', 位置: '腿部' },
    { 物品: '头盔', 位置: '头部' },
    { 物品: '发冠', 位置: '头部' },
    { 物品: '靴', 位置: '足部' },
    { 物品: '鞋', 位置: '足部' },
    { 物品: '草鞋', 位置: '足部' },
    { 物品: '长衫', 位置: '胸部' },
    { 物品: '练功服', 位置: '胸部' },
    { 物品: '长裤', 位置: '腿部' },
] as const;

const 无材质物品: 结构化物品条目[] = [
    { 名称: '金创药', 物品: '金创药', 类型: '消耗品', 品质: '凡品', 视觉标签: ['wound powder', 'paper packet', 'ceramic vial'], 生图描述: 'ancient wound medicine powder in a small paper packet or ceramic vial' },
    { 名称: '回气丹', 物品: '回气丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medicine pill', 'porcelain bottle'], 生图描述: 'small qi recovery medicinal pills in a porcelain bottle' },
    { 名称: '辟谷丹', 物品: '辟谷丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medicine pill', 'clay jar'], 生图描述: 'small fasting medicinal pills in a simple clay jar' },
    { 名称: '凝元丹', 物品: '凝元丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['amber pill', 'jade case'], 生图描述: 'translucent amber cultivation pill stored in a small jade case' },
    { 名称: '破境丹', 物品: '破境丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['golden pill', 'wooden medicine box'], 生图描述: 'golden breakthrough pill in a silk lined wooden box' },
    { 名称: '大还丹', 物品: '大还丹', 类型: '消耗品', 品质: '绝世', 视觉标签: ['crimson pill', 'jade gourd'], 生图描述: 'legendary crimson healing pill glowing softly in a jade gourd' },
    { 名称: '解毒散', 物品: '解毒散', 类型: '消耗品', 品质: '良品', 视觉标签: ['green powder', 'paper packet'], 生图描述: 'green antidote powder in a folded paper packet' },
    { 名称: '续命丹', 物品: '续命丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['red pill', 'bronze case'], 生图描述: 'deep red life extending pill with golden flecks in a bronze case' },
    { 名称: '寒铁矿', 材质: '寒铁', 物品: '矿石', 类型: '材料', 品质: '上品', 视觉标签: ['cold iron ore', 'frost crystals'], 生图描述: 'chunk of cold iron ore with frost crystals on the surface' },
    { 名称: '铁木', 材质: '铁木', 物品: '木材', 类型: '材料', 品质: '良品', 视觉标签: ['dark dense wood', 'hard grain'], 生图描述: 'section of dense dark ironwood timber with heavy grain' },
    { 名称: '兽皮', 物品: '兽皮', 类型: '材料', 品质: '凡品', 视觉标签: ['animal hide', 'rough leather'], 生图描述: 'rough cured animal hide used as crafting leather' },
    { 名称: '千年灵芝', 物品: '千年灵芝', 类型: '材料', 品质: '极品', 视觉标签: ['lingzhi mushroom', 'rare herb'], 生图描述: 'thousand year lingzhi mushroom with glossy red cap and golden spores' },
    { 名称: '百年何首乌', 物品: '百年何首乌', 类型: '材料', 品质: '上品', 视觉标签: ['he shou wu root', 'medicinal herb'], 生图描述: 'century old he shou wu root with fibrous natural texture' },
    { 名称: '蛇胆', 物品: '蛇胆', 类型: '材料', 品质: '良品', 视觉标签: ['snake gall', 'small vial'], 生图描述: 'dark green snake gall medicinal ingredient in a small vial' },
    { 名称: '基础剑法残卷', 物品: '秘籍残卷', 类型: '秘籍', 品质: '凡品', 视觉标签: ['torn scroll', 'faded ink'], 生图描述: 'torn incomplete sword manual scroll with faded technique drawings' },
    { 名称: '吐纳心法', 物品: '秘籍', 类型: '秘籍', 品质: '良品', 视觉标签: ['paper scroll', 'breathing manual'], 生图描述: 'well preserved breathing cultivation scroll tied with silk ribbon' },
    { 名称: '轻身术', 物品: '秘籍', 类型: '秘籍', 品质: '良品', 视觉标签: ['silk scroll', 'movement manual'], 生图描述: 'thin silk scroll depicting lightness skill movement diagrams' },
    { 名称: '玉佩', 物品: '玉佩', 类型: '饰品', 品质: '良品', 视觉标签: ['white jade', 'silk cord'], 生图描述: 'carved white jade pendant with cloud motif and silk cord' },
    { 名称: '银簪', 材质: '银', 物品: '簪', 类型: '饰品', 品质: '良品', 视觉标签: ['silver hairpin', 'floral tip'], 生图描述: 'polished silver hairpin with delicate floral tip' },
    { 名称: '护身符', 物品: '护身符', 类型: '饰品', 品质: '上品', 视觉标签: ['talisman', 'brocade pouch'], 生图描述: 'protective talisman sealed inside a brocade pouch' },
    { 名称: '夜明珠', 物品: '夜明珠', 类型: '饰品', 品质: '极品', 视觉标签: ['glowing pearl', 'carved stand'], 生图描述: 'luminous night pearl glowing blue green on a carved stand' },
    { 名称: '火折子', 物品: '火折子', 类型: '杂物', 品质: '凡品', 视觉标签: ['bamboo fire starter', 'tinder'], 生图描述: 'bamboo fire starter tube with smoldering tinder and brass cap' },
    { 名称: '绳索', 物品: '绳索', 类型: '杂物', 品质: '凡品', 视觉标签: ['hemp rope', 'coil'], 生图描述: 'coil of rough braided hemp rope' },
    { 名称: '地图', 物品: '地图', 类型: '杂物', 品质: '良品', 视觉标签: ['aged paper map', 'ink routes'], 生图描述: 'hand drawn map on aged paper showing mountains rivers and paths' },
    { 名称: '银两', 材质: '银', 物品: '银两', 类型: '杂物', 品质: '凡品', 视觉标签: ['silver ingots', 'currency'], 生图描述: 'small pile of Chinese silver ingots and loose silver pieces' },
];

const 生成材质物品 = (): 结构化物品条目[] => {
    const weapons = 武器材质.flatMap((material) => 武器模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '武器' as const,
        品质: material.品质 as 物品品质,
        武器子类: template.子类,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品} weapon, clear blade or body, visible grip and fittings`
    })));
    const armors = 防具材质.flatMap((material) => 防具模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品} armor or clothing item, isolated product prop, visible material texture`
    })));
    return [...weapons, ...armors, ...无材质物品];
};

export const 结构化物品库: 结构化物品条目[] = 生成材质物品();

const 规范化名称 = (value: string): string => (
    String(value || '').trim().replace(/[·•・\s_\-—]+/g, '').replace(/青钢/g, '钢')
);

export const 查找结构化物品 = (itemName: string): 结构化物品条目 | null => {
    const normalized = 规范化名称(itemName);
    if (!normalized) return null;
    return 结构化物品库.find((entry) => 规范化名称(entry.名称) === normalized) || null;
};

export const 构建结构化物品库提示词摘要 = (): string => {
    const sampleNames = 结构化物品库
        .filter((entry) => ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '杂物'].includes(entry.类型))
        .slice(0, 120)
        .map((entry) => entry.名称)
        .join('、');
    return [
        '## 7. 结构化物品库优先规则',
        '- 生成任何新物品前，先在“材质 + 物品”结构中选择最接近的条目：如 `钢盔甲`、`铁盔甲`、`钢剑`、`铁剑`、`木剑`、`草鞋`。',
        '- 消耗品、秘籍、材料、杂物可以没有材质前缀，如 `金创药`、`回气丹`、`基础剑法残卷`、`火折子`。',
        '- 若剧情需要的物品能落入库中，名称必须使用库中规范名称，材质写进名称和描述，避免同义词乱造导致预设图无法复用。',
        '- 只有库中没有合适条目、且剧情确有特殊性时，才允许自由生成新名称；新名称也应保持“材质 + 物品”或“清晰物品名”的结构。',
        `- 当前可参考的常用结构化条目示例：${sampleNames}。`
    ].join('\n');
};
