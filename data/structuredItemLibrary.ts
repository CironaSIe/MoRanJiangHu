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

const 金属防具材质 = [
    { 名称: '铁', 品质: '良品', 标签: ['iron plates', 'riveted metal'] },
    { 名称: '钢', 品质: '良品', 标签: ['steel plates', 'polished metal'] },
    { 名称: '精钢', 品质: '上品', 标签: ['refined steel armor', 'clean bright plates'] },
    { 名称: '寒铁', 品质: '上品', 标签: ['cold iron armor', 'frosted metal'] },
    { 名称: '玄铁', 品质: '极品', 标签: ['black iron armor', 'heavy dark plates'] },
    { 名称: '乌金', 品质: '极品', 标签: ['blackened gold armor', 'dark flexible scales'] },
] as const;

const 布衣材质 = [
    { 名称: '粗布', 品质: '凡品', 标签: ['coarse cloth', 'plain textile'] },
    { 名称: '布', 品质: '凡品', 标签: ['cloth', 'woven fabric'] },
] as const;

const 皮革防具材质 = [
    { 名称: '皮', 品质: '凡品', 标签: ['leather', 'stitched hide'] },
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

const 硬防具模板 = [
    { 物品: '盔甲', 位置: '胸部' },
    { 物品: '护甲', 位置: '胸部' },
    { 物品: '软甲', 位置: '胸部' },
    { 物品: '护腕', 位置: '手部' },
    { 物品: '护腿', 位置: '腿部' },
    { 物品: '护膝', 位置: '腿部' },
    { 物品: '头盔', 位置: '头部' },
    { 物品: '发冠', 位置: '头部' },
] as const;

const 金属足具模板 = [
    { 物品: '靴', 位置: '足部' },
    { 物品: '鞋', 位置: '足部' },
] as const;

const 布衣模板 = [
    { 物品: '长衫', 位置: '胸部' },
    { 物品: '练功服', 位置: '胸部' },
    { 物品: '长裤', 位置: '腿部' },
    { 物品: '鞋', 位置: '足部' },
] as const;

const 皮革模板 = [
    { 物品: '护甲', 位置: '胸部' },
    { 物品: '软甲', 位置: '胸部' },
    { 物品: '护腕', 位置: '手部' },
    { 物品: '护腿', 位置: '腿部' },
    { 物品: '护膝', 位置: '腿部' },
    { 物品: '靴', 位置: '足部' },
    { 物品: '鞋', 位置: '足部' },
] as const;

const 无材质物品: 结构化物品条目[] = [
    { 名称: '金创药', 物品: '金创药', 类型: '消耗品', 品质: '凡品', 视觉标签: ['wound powder', 'paper packet', 'ceramic vial'], 生图描述: 'ancient wound medicine powder in a small paper packet or ceramic vial' },
    { 名称: '回气丹', 物品: '回气丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medicine pill', 'porcelain bottle'], 生图描述: 'small qi recovery medicinal pills in a porcelain bottle' },
    { 名称: '辟谷丹', 物品: '辟谷丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medicine pill', 'clay jar'], 生图描述: 'small fasting medicinal pills in a simple clay jar' },
    { 名称: '引气丹', 物品: '引气丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['pale blue pill', 'porcelain vial', 'spirit qi'], 生图描述: 'pale blue qi-guiding cultivation pills in a small unmarked porcelain vial, faint mist aura, no writing' },
    { 名称: '聚灵丹', 物品: '聚灵丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['green pill', 'jade bottle', 'spirit light'], 生图描述: 'round green spirit-gathering cultivation pills in a small jade bottle, subtle glowing aura, no writing' },
    { 名称: '凝元丹', 物品: '凝元丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['amber pill', 'jade case'], 生图描述: 'translucent amber cultivation pill stored in a small jade case' },
    { 名称: '筑基丹', 物品: '筑基丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['golden pill', 'jade case', 'foundation establishment'], 生图描述: 'golden foundation-establishment cultivation pill in a silk lined jade case, refined elixir glow, no label or text' },
    { 名称: '结金丹', 物品: '结金丹', 类型: '消耗品', 品质: '绝世', 视觉标签: ['deep gold pill', 'black jade box', 'core formation'], 生图描述: 'deep golden core-formation elixir pill in a black jade box, restrained spiritual glow, no writing' },
    { 名称: '凝婴丹', 物品: '凝婴丹', 类型: '消耗品', 品质: '传说', 视觉标签: ['violet pill', 'white jade case', 'nascent soul'], 生图描述: 'violet nascent-soul condensation elixir in a white jade case, ethereal aura, no text' },
    { 名称: '化神丹', 物品: '化神丹', 类型: '消耗品', 品质: '传说', 视觉标签: ['silver pill', 'spirit mist', 'ancient jade box'], 生图描述: 'silver spirit-transformation elixir pill in an ancient jade box, soft celestial mist, no writing' },
    { 名称: '清心丹', 物品: '清心丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['white pill', 'plain ceramic bowl', 'calming elixir'], 生图描述: 'small white calming cultivation pills in a plain ceramic bowl, clean apothecary still life, no writing' },
    { 名称: '破境丹', 物品: '破境丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['golden pill', 'wooden medicine box'], 生图描述: 'golden breakthrough pill in a silk lined wooden box' },
    { 名称: '大还丹', 物品: '大还丹', 类型: '消耗品', 品质: '绝世', 视觉标签: ['crimson pill', 'jade gourd'], 生图描述: 'legendary crimson healing pills in a plain jade gourd or small unmarked medicine bowl, no seal, no writing' },
    { 名称: '解毒散', 物品: '解毒散', 类型: '消耗品', 品质: '良品', 视觉标签: ['green medicinal powder', 'unmarked paper packet'], 生图描述: 'green antidote powder spilling from a plain unmarked folded paper packet, no writing' },
    { 名称: '续命丹', 物品: '续命丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['red pill', 'bronze case'], 生图描述: 'deep red life extending pill with golden flecks in a bronze case' },
    { 名称: '寒铁矿', 材质: '寒铁', 物品: '矿石', 类型: '材料', 品质: '上品', 视觉标签: ['cold iron ore', 'frost crystals'], 生图描述: 'single chunk of cold iron ore with frost crystals on the surface, raw mineral only, no label' },
    { 名称: '铁木', 材质: '铁木', 物品: '木材', 类型: '材料', 品质: '良品', 视觉标签: ['dark dense wood', 'hard grain'], 生图描述: 'section of dense dark ironwood timber with heavy grain' },
    { 名称: '兽皮', 物品: '兽皮', 类型: '材料', 品质: '凡品', 视觉标签: ['animal hide', 'rough leather'], 生图描述: 'rough cured animal hide used as crafting leather' },
    { 名称: '千年灵芝', 物品: '千年灵芝', 类型: '材料', 品质: '极品', 视觉标签: ['lingzhi mushroom', 'rare herb'], 生图描述: 'single thousand year lingzhi mushroom with glossy red cap and golden spores, botanical specimen only, no label' },
    { 名称: '百年何首乌', 物品: '百年何首乌', 类型: '材料', 品质: '上品', 视觉标签: ['he shou wu root', 'medicinal herb'], 生图描述: 'century old he shou wu root with fibrous natural texture' },
    { 名称: '蛇胆', 物品: '蛇胆', 类型: '材料', 品质: '良品', 视觉标签: ['snake gallbladder organ', 'translucent dark green bile sac', 'medicinal ingredient', 'small porcelain dish'], 生图描述: 'one translucent dark green snake gallbladder organ, oval bile sac medicinal ingredient, placed on a small shallow white porcelain dish, wet glossy membrane, no snake body, no worm, no eel, no vial, no bottle' },
    { 名称: '基础剑法残卷', 物品: '秘籍残卷', 类型: '秘籍', 品质: '凡品', 视觉标签: ['torn scroll', 'faded ink diagram'], 生图描述: 'torn incomplete martial arts manual scroll with abstract faded practice diagrams, no readable writing' },
    { 名称: '吐纳心法', 物品: '秘籍', 类型: '秘籍', 品质: '良品', 视觉标签: ['paper scroll', 'breathing manual', 'ink diagrams', 'unreadable calligraphy strokes'], 生图描述: 'well preserved ancient cultivation scroll tied with silk ribbon, opened to show dense black ink-like unreadable calligraphy strokes and breathing meridian diagrams, clearly not blank, no readable real text' },
    { 名称: '轻身术', 物品: '秘籍', 类型: '秘籍', 品质: '良品', 视觉标签: ['silk scroll', 'movement manual'], 生图描述: 'thin silk martial arts scroll with abstract movement diagram silhouettes, no readable writing' },
    { 名称: '金钟罩', 物品: '秘籍', 类型: '秘籍', 品质: '上品', 视觉标签: ['ancient stitched book', 'martial arts manual', 'ink diagrams', 'aged paper'], 生图描述: 'ancient Chinese stitched martial arts book, blue cloth cover partly open, yellowed pages filled with black ink-like unreadable calligraphy strokes and body training diagrams, old book style, no readable real text' },
    { 名称: '九阳真经', 物品: '秘籍', 类型: '秘籍', 品质: '传说', 视觉标签: ['legendary scroll', 'martial arts scripture', 'golden silk scroll', 'ink calligraphy strokes'], 生图描述: 'legendary martial arts scripture scroll opened on parchment, golden silk edges, yellowed paper filled with dense black ink-like unreadable calligraphy strokes and red meridian diagrams, clearly a written scroll, no readable real text' },
    { 名称: '玉佩', 物品: '玉佩', 类型: '饰品', 品质: '良品', 视觉标签: ['white jade', 'silk cord'], 生图描述: 'carved white jade pendant with cloud motif and silk cord' },
    { 名称: '银簪', 材质: '银', 物品: '簪', 类型: '饰品', 品质: '良品', 视觉标签: ['silver hairpin', 'floral tip'], 生图描述: 'polished silver hairpin with delicate floral tip' },
    { 名称: '护身符', 物品: '护身符', 类型: '饰品', 品质: '上品', 视觉标签: ['talisman', 'plain brocade pouch'], 生图描述: 'protective talisman sealed inside a plain brocade pouch with geometric embroidery, no writing' },
    { 名称: '夜明珠', 物品: '夜明珠', 类型: '饰品', 品质: '极品', 视觉标签: ['glowing pearl', 'carved stand'], 生图描述: 'luminous night pearl glowing blue green on a carved stand' },
    { 名称: '玉骨扇', 物品: '玉骨扇', 类型: '法宝', 品质: '上品', 视觉标签: ['jade ribs', 'folded fan', 'silk fan leaf', 'tassel'], 生图描述: 'elegant folded Chinese hand fan with pale jade ribs, silk fan leaf and tassel, clearly a fan accessory, no blade' },
    { 名称: '火折子', 物品: '火折子', 类型: '杂物', 品质: '凡品', 视觉标签: ['bamboo fire starter', 'tinder'], 生图描述: 'bamboo fire starter tube with smoldering tinder and brass cap' },
    { 名称: '绳索', 物品: '绳索', 类型: '杂物', 品质: '凡品', 视觉标签: ['hemp rope', 'coil'], 生图描述: 'coil of rough braided hemp rope' },
    { 名称: '地图', 物品: '地图', 类型: '杂物', 品质: '良品', 视觉标签: ['aged paper map', 'ink routes'], 生图描述: 'hand drawn map on aged paper showing mountains rivers and paths' },
    { 名称: '银两', 材质: '银', 物品: '银两', 类型: '杂物', 品质: '凡品', 视觉标签: ['silver ingots', 'currency'], 生图描述: 'small pile of Chinese silver ingots and loose silver pieces' },
    { 名称: '草鞋', 物品: '草鞋', 类型: '防具', 品质: '凡品', 装备位置: '足部', 视觉标签: ['straw sandals', 'woven straw footwear'], 生图描述: 'a pair of empty woven straw sandals, rustic ancient footwear, visible straw weave and simple ties' },
];

const 仙侠预设物品: 结构化物品条目[] = [
    { 名称: '淬体丹', 物品: '淬体丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['bronze pill', 'body tempering elixir', 'ceramic vial'], 生图描述: 'bronze body-tempering cultivation pills in a small unmarked ceramic vial, pre-modern apothecary still life, no writing' },
    { 名称: '洗髓丹', 物品: '洗髓丹', 类型: '消耗品', 品质: '上品', 视觉标签: ['white jade pill', 'marrow cleansing elixir', 'jade box'], 生图描述: 'white jade marrow-cleansing cultivation pill in a silk lined jade box, subtle spiritual mist, no writing' },
    { 名称: '护脉丹', 物品: '护脉丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['pale gold pill', 'meridian protection', 'porcelain bowl'], 生图描述: 'pale gold meridian-protecting cultivation pills in a small porcelain bowl, refined apothecary prop, no label' },
    { 名称: '回灵丹', 物品: '回灵丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['blue green pill', 'spiritual recovery', 'jade bottle'], 生图描述: 'blue green spirit-recovery pills in a small jade bottle, faint qi glow, no writing' },
    { 名称: '培元丹', 物品: '培元丹', 类型: '消耗品', 品质: '上品', 视觉标签: ['amber pill', 'foundation nurturing', 'wooden case'], 生图描述: 'amber yuan-nourishing cultivation pills in a dark wooden medicine case, no readable text' },
    { 名称: '下品灵石', 物品: '灵石', 类型: '材料', 品质: '凡品', 视觉标签: ['spirit stone', 'pale crystal', 'raw mineral'], 生图描述: 'single pale translucent low grade spirit stone crystal, raw mineral with soft inner glow, no label' },
    { 名称: '中品灵石', 物品: '灵石', 类型: '材料', 品质: '良品', 视觉标签: ['spirit stone', 'blue crystal', 'raw mineral'], 生图描述: 'single blue translucent mid grade spirit stone crystal, raw mineral with clean inner glow, no label' },
    { 名称: '上品灵石', 物品: '灵石', 类型: '材料', 品质: '上品', 视觉标签: ['spirit stone', 'clear crystal', 'high grade mineral'], 生图描述: 'single clear high grade spirit stone crystal with bright inner light, raw mineral only, no text' },
    { 名称: '极品灵石', 物品: '灵石', 类型: '材料', 品质: '极品', 视觉标签: ['spirit stone', 'rainbow crystal', 'top grade mineral'], 生图描述: 'single top grade spirit stone crystal with subtle rainbow refraction, raw mineral specimen, no label' },
    { 名称: '灵晶', 物品: '灵晶', 类型: '材料', 品质: '极品', 视觉标签: ['spirit crystal', 'faceted crystal', 'dense qi'], 生图描述: 'dense faceted spirit crystal with concentrated inner glow, isolated raw cultivation material, no writing' },
    { 名称: '赤阳石', 物品: '矿石', 类型: '材料', 品质: '上品', 视觉标签: ['red sun stone', 'warm ore', 'orange crystal'], 生图描述: 'single red-orange sunstone ore chunk with warm glow and mineral veins, no label' },
    { 名称: '星辰砂', 物品: '矿砂', 类型: '材料', 品质: '上品', 视觉标签: ['star sand', 'silver grains', 'small dish'], 生图描述: 'small shallow dish of silver star-like mineral sand grains, crafting material, no writing' },
    { 名称: '空冥石', 物品: '矿石', 类型: '材料', 品质: '极品', 视觉标签: ['void stone', 'dark violet mineral', 'space ore'], 生图描述: 'single dark violet void stone ore with faint nebula-like inclusions, raw mineral only, no text' },
    { 名称: '雷击木', 物品: '木材', 类型: '材料', 品质: '上品', 视觉标签: ['lightning-struck wood', 'charred grain', 'crafting timber'], 生图描述: 'piece of lightning-struck wood with charred dark grain and pale inner streaks, natural timber material, no label' },
    { 名称: '灵竹', 物品: '竹材', 类型: '材料', 品质: '良品', 视觉标签: ['spirit bamboo', 'green bamboo segment', 'crafting material'], 生图描述: 'fresh green spirit bamboo segments with subtle natural sheen, crafting material still life, no writing' },
    { 名称: '月华草', 物品: '灵草', 类型: '材料', 品质: '良品', 视觉标签: ['moonlight herb', 'silver leaves', 'botanical specimen'], 生图描述: 'single moonlight herb specimen with silver-green leaves and small pale blossoms, botanical cultivation material, no label' },
    { 名称: '凝露草', 物品: '灵草', 类型: '材料', 品质: '凡品', 视觉标签: ['dew herb', 'green leaves', 'water drops'], 生图描述: 'green dew-gathering herb with clear droplets on leaves, botanical specimen only, no text' },
    { 名称: '血参', 物品: '灵药', 类型: '材料', 品质: '上品', 视觉标签: ['red ginseng', 'medicinal root', 'rare herb'], 生图描述: 'deep red blood ginseng root with branching organic texture, rare medicinal herb specimen, no label' },
    { 名称: '朱果', 物品: '灵果', 类型: '材料', 品质: '极品', 视觉标签: ['vermilion fruit', 'red fruit', 'spirit fruit'], 生图描述: 'single glossy vermilion spirit fruit with small leaves, pre-modern botanical treasure, no text' },
    { 名称: '妖丹', 物品: '妖丹', 类型: '材料', 品质: '极品', 视觉标签: ['demon core', 'round crystal core', 'monster core'], 生图描述: 'single round beast core crystal with layered inner glow, cultivation material displayed on a small stand, no writing' },
    { 名称: '炼气诀', 物品: '玉简', 类型: '秘籍', 品质: '凡品', 视觉标签: ['jade slip', 'cultivation manual', 'unreadable marks'], 生图描述: 'bundle of pale green jade slips tied with silk cord, ancient cultivation manual, abstract unreadable etched marks, no real text' },
    { 名称: '筑基心得', 物品: '玉简', 类型: '秘籍', 品质: '良品', 视觉标签: ['jade slip', 'foundation notes', 'unreadable marks'], 生图描述: 'small bundle of warm white jade slips with silk tie, foundation-establishment cultivation notes, abstract unreadable marks only' },
    { 名称: '御剑术', 物品: '玉简', 类型: '秘籍', 品质: '上品', 视觉标签: ['jade slip', 'sword technique', 'spirit manual'], 生图描述: 'green jade slip bundle for sword-riding technique, faint aura, etched abstract unreadable diagrams, no text' },
    { 名称: '小五行术', 物品: '玉简', 类型: '秘籍', 品质: '良品', 视觉标签: ['jade slip', 'five elements', 'colored cords'], 生图描述: 'jade slip cultivation manual with five colored silk cords, abstract unreadable elemental diagrams, no real writing' },
    { 名称: '太乙剑诀', 物品: '玉简', 类型: '秘籍', 品质: '极品', 视觉标签: ['jade slip', 'sword scripture', 'gold cord'], 生图描述: 'refined white jade slip bundle tied with gold silk cord, sword scripture aura, abstract unreadable etchings, no text' },
    { 名称: '炼丹初解', 物品: '玉简', 类型: '秘籍', 品质: '良品', 视觉标签: ['jade slip', 'alchemy manual', 'small furnace diagram'], 生图描述: 'jade slip alchemy manual beside a tiny unmarked bronze furnace charm, abstract unreadable diagrams, no text' },
    { 名称: '符箓入门', 物品: '玉简', 类型: '秘籍', 品质: '凡品', 视觉标签: ['jade slip', 'talisman manual', 'yellow cord'], 生图描述: 'jade slip talisman manual tied with yellow cord, abstract unreadable strokes and diagrams, no real writing' },
    { 名称: '火球符', 物品: '符箓', 类型: '消耗品', 品质: '凡品', 视觉标签: ['yellow talisman paper', 'red strokes', 'fire charm'], 生图描述: 'single yellow talisman paper charm with abstract red ink strokes and warm fire aura, no readable characters' },
    { 名称: '冰锥符', 物品: '符箓', 类型: '消耗品', 品质: '凡品', 视觉标签: ['blue talisman paper', 'cold aura', 'ice charm'], 生图描述: 'single blue-white talisman paper charm with abstract ink strokes and frost aura, no readable text' },
    { 名称: '雷光符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['purple talisman paper', 'lightning charm', 'ink strokes'], 生图描述: 'single purple talisman paper charm with abstract silver ink strokes and subtle lightning glow, no readable text' },
    { 名称: '金刚符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['gold talisman paper', 'protective charm', 'ink strokes'], 生图描述: 'single gold talisman paper charm with abstract dark ink strokes and protective glow, no real characters' },
    { 名称: '神行符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['yellow talisman paper', 'swift charm', 'wind aura'], 生图描述: 'single yellow talisman charm with abstract flowing ink strokes and light wind aura, no readable text' },
    { 名称: '隐身符', 物品: '符箓', 类型: '消耗品', 品质: '上品', 视觉标签: ['pale talisman paper', 'stealth charm', 'soft glow'], 生图描述: 'single pale translucent talisman paper charm with abstract gray ink strokes and soft vanishing aura, no readable text' },
    { 名称: '传音符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['small talisman paper', 'message charm', 'blue thread'], 生图描述: 'small folded talisman paper charm tied with blue thread, abstract unreadable marks, communication charm still life' },
    { 名称: '传送符', 物品: '符箓', 类型: '消耗品', 品质: '极品', 视觉标签: ['silver talisman paper', 'teleport charm', 'ring pattern'], 生图描述: 'single silver talisman paper charm with abstract circular ink pattern and spatial glow, no readable characters' },
    { 名称: '青竹飞剑', 物品: '飞剑', 类型: '法宝', 品质: '良品', 视觉标签: ['flying sword', 'bamboo green blade', 'jade hilt'], 生图描述: 'slender decorative cultivation flying sword artifact with bamboo-green sheath and jade hilt, ceremonial prop, no blood, no person' },
    { 名称: '寒霜飞剑', 物品: '飞剑', 类型: '法宝', 品质: '上品', 视觉标签: ['flying sword', 'frosted blade', 'white jade hilt'], 生图描述: 'slender frosted cultivation flying sword artifact with white jade hilt, cold aura, decorative ceremonial prop, no person' },
    { 名称: '紫电飞剑', 物品: '飞剑', 类型: '法宝', 品质: '极品', 视觉标签: ['flying sword', 'violet lightning', 'dark scabbard'], 生图描述: 'refined violet lightning flying sword artifact with dark scabbard and silver fittings, ceremonial display prop, no person' },
    { 名称: '青玉葫芦', 物品: '葫芦', 类型: '法宝', 品质: '上品', 视觉标签: ['green jade gourd', 'magic vessel', 'silk cord'], 生图描述: 'green jade cultivation gourd vessel with silk cord and cork stopper, elegant magic treasure prop, no writing' },
    { 名称: '养魂铃', 物品: '铃铛', 类型: '法宝', 品质: '上品', 视觉标签: ['soul bell', 'bronze bell', 'red cord'], 生图描述: 'small bronze soul-nourishing bell treasure tied with red cord, antique patina, no text' },
    { 名称: '镇魂铃', 物品: '铃铛', 类型: '法宝', 品质: '极品', 视觉标签: ['soul-suppressing bell', 'dark bronze', 'jade bead'], 生图描述: 'dark bronze soul-suppressing bell with jade bead and old tassel, cultivation magic treasure prop, no writing' },
    { 名称: '玄光镜', 物品: '宝镜', 类型: '法宝', 品质: '极品', 视觉标签: ['mystic mirror', 'bronze mirror', 'round artifact'], 生图描述: 'round bronze mystic light mirror artifact with cloudy polished surface and carved rim, no readable characters' },
    { 名称: '八卦镜', 物品: '宝镜', 类型: '法宝', 品质: '上品', 视觉标签: ['bagua mirror', 'bronze mirror', 'protective artifact'], 生图描述: 'round protective bronze mirror artifact with abstract geometric rim motifs, no readable characters or real text' },
    { 名称: '缚妖索', 物品: '法索', 类型: '法宝', 品质: '上品', 视觉标签: ['binding rope', 'gold cord', 'talisman knots'], 生图描述: 'coiled golden binding rope magic treasure with simple knot charms and tassels, no readable talisman text' },
    { 名称: '储物袋', 物品: '储物袋', 类型: '法宝', 品质: '良品', 视觉标签: ['storage pouch', 'embroidered cloth bag', 'drawstring'], 生图描述: 'small embroidered cloth storage pouch with drawstring and jade bead, cultivation inventory treasure, no writing' },
    { 名称: '储物戒', 物品: '储物戒', 类型: '法宝', 品质: '上品', 视觉标签: ['storage ring', 'silver ring', 'tiny gemstone'], 生图描述: 'single silver storage ring with small green gemstone, cultivation artifact accessory, no hand, no text' },
    { 名称: '灵兽袋', 物品: '灵兽袋', 类型: '法宝', 品质: '上品', 视觉标签: ['spirit beast pouch', 'leather pouch', 'tassel'], 生图描述: 'small spirit beast pouch made of soft leather and brocade, drawstring and tassel, no animal visible, no writing' },
    { 名称: '聚灵阵盘', 物品: '阵盘', 类型: '法宝', 品质: '上品', 视觉标签: ['array disk', 'jade disk', 'geometric grooves'], 生图描述: 'round jade spirit-gathering array disk with carved abstract geometric grooves and inlaid stones, no readable text' },
    { 名称: '护山阵盘', 物品: '阵盘', 类型: '法宝', 品质: '极品', 视觉标签: ['array disk', 'bronze jade disk', 'protective formation'], 生图描述: 'large bronze and jade protective array disk with abstract concentric geometric grooves, no readable characters' },
    { 名称: '寻灵罗盘', 物品: '罗盘', 类型: '法宝', 品质: '良品', 视觉标签: ['spirit compass', 'bronze compass', 'pointer'], 生图描述: 'small bronze spirit-seeking compass with central pointer and abstract carved rings, no readable text' },
    { 名称: '紫铜丹炉', 物品: '丹炉', 类型: '法宝', 品质: '良品', 视觉标签: ['alchemy furnace', 'purple bronze', 'three legs'], 生图描述: 'small three-legged purple bronze alchemy furnace with lid and handles, tabletop cultivation tool, no text' },
    { 名称: '玄铁丹炉', 物品: '丹炉', 类型: '法宝', 品质: '极品', 视觉标签: ['alchemy furnace', 'black iron', 'three legs'], 生图描述: 'heavy three-legged black iron alchemy furnace with lid, carved abstract cloud motifs, no readable characters' },
    { 名称: '炼器锤', 物品: '炼器锤', 类型: '法宝', 品质: '良品', 视觉标签: ['artifact forging hammer', 'bronze hammer', 'wood handle'], 生图描述: 'small artifact-forging hammer with bronze head and dark wooden handle, cultivation crafting tool, no text' },
    { 名称: '青云法袍', 物品: '法袍', 类型: '防具', 品质: '良品', 装备位置: '胸部', 视觉标签: ['cultivation robe', 'blue green fabric', 'cloud trim'], 生图描述: 'blue-green cultivation robe laid flat, soft woven fabric with abstract cloud trim, no person, no readable text' },
    { 名称: '月白法袍', 物品: '法袍', 类型: '防具', 品质: '上品', 装备位置: '胸部', 视觉标签: ['cultivation robe', 'moon white fabric', 'silver trim'], 生图描述: 'moon-white cultivation robe laid flat with silver trim and soft fabric folds, no person, no text' },
    { 名称: '玄纹法冠', 物品: '法冠', 类型: '防具', 品质: '上品', 装备位置: '头部', 视觉标签: ['cultivation crown', 'dark jade', 'hair crown'], 生图描述: 'dark jade cultivation hair crown accessory with simple geometric motifs, isolated headwear prop, no person' },
    { 名称: '避尘靴', 物品: '法靴', 类型: '防具', 品质: '良品', 装备位置: '足部', 视觉标签: ['cultivation boots', 'cloth boots', 'white soles'], 生图描述: 'pair of empty clean cloth cultivation boots placed side by side, visible hollow openings and stitched soles, no feet' },
];

const 现代预设物品: 结构化物品条目[] = [
    { 名称: '智能手机', 物品: '智能手机', 类型: '杂物', 品质: '良品', 视觉标签: ['smartphone', 'cracked screen', 'modern device'], 生图描述: 'used modern smartphone with a slightly cracked screen, isolated product prop, no readable text' },
    { 名称: '录音笔', 物品: '录音笔', 类型: '杂物', 品质: '上品', 视觉标签: ['digital voice recorder', 'investigation tool'], 生图描述: 'small black digital voice recorder on a desk, modern investigation prop, no readable text' },
    { 名称: '笔记本电脑', 物品: '笔记本电脑', 类型: '杂物', 品质: '上品', 视觉标签: ['laptop', 'modern electronics'], 生图描述: 'closed slim laptop with worn edges, modern urban prop, no logo, no readable text' },
    { 名称: '急救包', 物品: '急救包', 类型: '消耗品', 品质: '良品', 视觉标签: ['first aid kit', 'medical supplies'], 生图描述: 'compact first aid kit opened to show bandages and medical supplies, no readable labels' },
    { 名称: '防割手套', 物品: '防割手套', 类型: '防具', 品质: '良品', 装备位置: '手部', 视觉标签: ['cut resistant gloves', 'work safety gear'], 生图描述: 'pair of grey cut-resistant work gloves, modern safety gear, isolated product photo' },
    { 名称: '古玉残佩', 物品: '古玉残佩', 类型: '饰品', 品质: '上品', 视觉标签: ['ancient jade pendant', 'modern antique market'], 生图描述: 'small incomplete antique jade pendant on a dark cloth, subtle mysterious aura, no text' },
];

const 末日预设物品: 结构化物品条目[] = [
    { 名称: '罐头包', 物品: '罐头包', 类型: '消耗品', 品质: '凡品', 视觉标签: ['canned food', 'survival supplies'], 生图描述: 'small bundle of dented canned food for survival, no readable labels' },
    { 名称: '净水片', 物品: '净水片', 类型: '消耗品', 品质: '良品', 视觉标签: ['water purification tablets', 'survival medicine'], 生图描述: 'small blister pack of water purification tablets beside a metal cup, no readable text' },
    { 名称: '手摇电筒', 物品: '手摇电筒', 类型: '杂物', 品质: '良品', 视觉标签: ['hand crank flashlight', 'survival tool'], 生图描述: 'worn hand-crank flashlight with scratches, apocalypse survival gear, no logo' },
    { 名称: '弩机组件', 物品: '弩机组件', 类型: '武器', 品质: '上品', 视觉标签: ['crossbow parts', 'silent weapon'], 生图描述: 'mechanical crossbow limb and trigger components on a rough table, no person' },
    { 名称: '抗生素散盒', 物品: '抗生素散盒', 类型: '消耗品', 品质: '上品', 视觉标签: ['antibiotics', 'medical cache'], 生图描述: 'scattered unlabeled antibiotic blister packs and small medicine box, survival medical supplies, no readable text' },
    { 名称: '汽油桶', 物品: '汽油桶', 类型: '材料', 品质: '良品', 视觉标签: ['fuel canister', 'survival resource'], 生图描述: 'red metal fuel canister with scratches and dirt, isolated apocalypse resource prop, no readable text' },
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
    const hardArmors = 金属防具材质.flatMap((material) => 硬防具模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品} armor or clothing item, isolated product prop, visible material texture`
    })));
    const metalFootwear = 金属防具材质.flatMap((material) => 金属足具模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a pair of ${material.标签.join(', ')} wuxia ${template.物品}, armored footwear only, two empty shoes or boots lying side by side on a tabletop, visible hollow openings, low product photo angle, no vertical leg armor, no legs, no greaves, no pants, no mannequin, no full armor suit, no straw, no cloth sandals`
    })));
    const clothItems = 布衣材质.flatMap((material) => 布衣模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品}, soft textile item only, isolated product prop, visible woven fabric texture`
    })));
    const leatherItems = 皮革防具材质.flatMap((material) => 皮革模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品}, leather defensive gear or footwear, isolated product prop, visible stitched hide texture`
    })));
    return [...weapons, ...hardArmors, ...metalFootwear, ...clothItems, ...leatherItems, ...无材质物品, ...仙侠预设物品, ...现代预设物品, ...末日预设物品];
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
        .filter((entry) => ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '法宝', '任务道具', '杂物', '杂项'].includes(entry.类型))
        .slice(0, 120)
        .map((entry) => entry.名称)
        .join('、');
    return [
        '## 7. 结构化物品库优先规则',
        '- 生成任何新物品前，先在结构化物品库中选择最接近的“规范物品名称”：如 `钢盔甲`、`铁盔甲`、`钢剑`、`铁剑`、`木剑`、`草鞋`。',
        '- 消耗品、秘籍、材料、杂物可以没有材质前缀，如 `金创药`、`回气丹`、`基础剑法残卷`、`火折子`。',
        '- 规范物品名称必须和真实材质语义一致：`精钢鞋`就是精钢鞋，`草鞋`就是草鞋，不要写成 `钢草鞋`、`精钢草鞋`、`寒铁草鞋`；布衣不要写成 `钢长衫`、`玄铁练功服`。',
        '- 若剧情需要有门派、家族、出处或招式感，可以在展示名称中发挥，但底层规范物品仍应能对应库中条目。例如规范物品是 `钢刀`，展示名可以写 `杨氏断门刀`，描述里说明它是一柄杨氏家族传下的钢刀。',
        '- 物品图片、装备识别和预设复用以规范物品名称为准；剧情化展示名只负责风味，不应破坏规范物品映射。',
        '- 只有库中没有合适条目、且剧情确有特殊性时，才允许自由生成新规范名称；新规范名称也应保持材质和物品本体一致。',
        `- 当前可参考的常用结构化条目示例：${sampleNames}。`
    ].join('\n');
};
