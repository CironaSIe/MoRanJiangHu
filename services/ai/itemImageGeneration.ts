import type { 接口设置结构, 物品生图结果 } from '../../types';
import type { 游戏物品 } from '../../models/item';
import type { 当前可用接口结构 } from '../../utils/apiConfig';
import { 获取文生图接口配置, 接口配置是否可用 } from '../../utils/apiConfig';
import { 合并物品图片档案 } from '../../utils/itemImage';
import { 默认NSFWComfyUI工作流JSON } from '../../data/defaultComfyWorkflow';
import { 查找结构化物品 } from '../../data/structuredItemLibrary';
import { generateImageByPrompt, persistImageAssetLocally } from './image';

type 物品生图来源位置 = '背包' | '拍卖行';

export interface 物品图标生成选项 {
    source?: 'auto' | 'manual' | 'retry';
    sourceLocation?: 物品生图来源位置;
    force?: boolean;
    size?: string;
    extraPrompt?: string;
    imageApi?: 当前可用接口结构 | null;
    signal?: AbortSignal;
    recordId?: string;
}

export interface 物品图标生成结果 {
    nextItem: 游戏物品;
    imageRecord: 物品生图结果;
    prompt: string;
    imageApi: 当前可用接口结构;
}

const 读取文本 = (value: unknown, fallback = '') => (
    typeof value === 'string' ? value.trim() : fallback
);

const 构建物品生图接口配置 = (imageApi: 当前可用接口结构 | null): 当前可用接口结构 | null => {
    if (!imageApi) return null;
    if (imageApi?.图片后端类型 !== 'comfyui') return imageApi;
    const workflow = 读取文本(imageApi.ComfyUI工作流JSON);
    // 当前 CNB 的 NunchakuZImageDiTLoader 对部分 z_image_turbo_bf16 模型会抛 KeyError: 'weight'。
    // 物品图标优先稳定产出，因此避开该节点，复用已验证可执行的 mPMix + Lightning 工作流。
    if (!/NunchakuZImageDiTLoader/i.test(workflow)) return imageApi;
    return {
        ...imageApi,
        ComfyUI工作流JSON: 默认NSFWComfyUI工作流JSON
    };
};

/**
 * 仅用于写入 `视觉描述` 字段的原始文本。
 * 注意：物品生图的 prompt 必须避免出现"名称:X 类型:Y 品质:Z"这种结构化中文键值对，
 * 否则大量模型会直接把它当成要画在图上的文字/标签 (历史事故：青钢剑图上出现 "名称:青钢剑 类型:武型 品质:良品")。
 * 这里只保留描述性自然语言，不保留字段标签。
 */
export const 构建物品视觉描述 = (item: any): string => {
    const parts: string[] = [];
    const structured = 查找结构化物品(
        读取文本(item?.规范物品名称)
        || 读取文本(item?.预设物品名称)
        || 读取文本(item?.标准物品名称)
        || 读取文本(item?.基础物品名称)
        || 读取文本(item?.图片匹配名称)
        || 读取文本(item?.名称)
    );
    if (structured?.生图描述) parts.push(structured.生图描述);
    if (Array.isArray(structured?.视觉标签) && structured.视觉标签.length > 0) {
        parts.push(`结构化材质与物品：${structured.视觉标签.join('，')}`);
    }
    const 描述 = 读取文本(item?.描述);
    if (描述) parts.push(描述);
    if (Array.isArray(item?.词条列表) && item.词条列表.length > 0) {
        const 词条文案 = item.词条列表
            .map((entry: any) => [entry?.名称, entry?.属性, entry?.数值].filter(Boolean).join(' '))
            .filter(Boolean)
            .join('；');
        if (词条文案) parts.push(词条文案);
    }
    const 来源 = 读取文本(item?.来源描述);
    if (来源) parts.push(来源);
    const 关联 = 读取文本(item?.关联事件);
    if (关联) parts.push(关联);
    return parts.join('\n');
};

const 获取渲染风格要求 = (style: string): string => {
    switch (style) {
        case '写实道具':
            return 'photorealistic single prop product photography, isolated physical object, real metal leather cloth wood or paper materials, studio lighting, tactile surface detail, neutral matte background, clean product composition';
        case '像素图标':
            return 'high-end pixel art item icon, crisp silhouette, readable at small size, clean transparent-style asset presentation';
        case '3D渲染':
            return 'stylized 3D single prop render, centered product lighting, soft shadow, clean asset presentation';
        case '国风插画':
        default:
            return 'Chinese wuxia illustration style, ink wash texture, refined golden rim light';
    }
};

const 物品类型转英文 = (type: string): string => {
    const map: Record<string, string> = {
        '武器': 'weapon', '武型': 'weapon', '剑': 'sword', '刀': 'saber',
        '防具': 'armor', '盔甲': 'armor', '衣服': 'garment',
        '消耗品': 'consumable', '丹药': 'medicinal pill', '药': 'medicine',
        '材料': 'crafting material', '符箓': 'talisman', '秘籍': 'scroll',
        '法宝': 'xianxia magical artifact', '法器': 'xianxia magical artifact',
        '任务': 'key item', '杂物': 'miscellaneous object',
        '饰品': 'accessory', '暗器': 'hidden weapon'
    };
    for (const [cn, en] of Object.entries(map)) {
        if (type.includes(cn)) return en;
    }
    return 'prop';
};

const 物品名称是否柔性服装 = (name: string): boolean => (
    /弟子服|门派服|内门服|外门服|制式服|练功服|武服|劲装|布衣|布衫|青衫|衣服|衣裳|衣物|服装|长衫|短衫|衫|袍|法袍|道袍|僧衣|寝衣|内衬|内衣|裤|长裤|短裤|裙|鞋|靴|袜|披风|斗篷|罩衫|外袍|长袍|便服|常服/.test(name)
);

const 物品是否柔性服装 = (item: any): boolean => {
    const name = 读取文本(item?.名称);
    if (物品名称是否柔性服装(name)) return true;
    const type = 读取文本(item?.类型);
    const equipSlot = [
        item?.装备位置,
        item?.当前装备部位,
        Array.isArray(item?.覆盖部位) ? item.覆盖部位.join(' ') : item?.覆盖部位
    ].map((value) => 读取文本(value)).join(' ');
    return /衣服|服装|内衬|鞋履/.test(type)
        || (/内衬|腿部|足部|胸部/.test(equipSlot) && 物品名称是否柔性服装(`${name}${equipSlot}`));
};

const 物品是否浅色月白服装 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return 物品是否柔性服装(item) && /月白|月白色|牙白|霜白|素白|白衣|白袍|白色/.test(text);
};

const 物品是否门派弟子服 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return 物品是否柔性服装(item) && /弟子服|门派服|内门服|外门服|制式服|门派弟子|内门弟子|外门弟子/.test(text);
};

const 物品是否可穿戴护甲 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /战术背心|防弹背心|防刺背心|负重背心|战术护具|防弹衣|软甲|内甲|宝甲|甲衣|护身甲|护心甲|胸甲|背甲|护甲|铠甲|甲胄|皮甲|锁子甲|链甲|鳞甲/.test(text)
        || (/防具/.test(text) && /甲片|护身|护胸|贴身|内穿|穿戴|甲衣|胸腹|躯干/.test(text));
};

const 物品是否现代枪械 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /自动步枪|突击步枪|步枪|手枪|霰弹枪|散弹枪|冲锋枪|狙击枪|机枪|枪械|火器|弹匣|枪托|枪管|扳机|消音器|瞄准镜|子弹|弹药|AK|AR-?15|M4|M16/i.test(text);
};

const 物品是否战术背心 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /战术背心|防弹背心|防刺背心|负重背心|MOLLE|模块化织带|弹挂背心|防弹衣/i.test(text);
};

const 物品是否布鞋 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /布鞋|旧布鞋|千层底|布靴|麻鞋|草鞋/.test(text);
};

const 物品是否绷带敷料 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /绷带|纱布|布条|包扎布|止血布|敷料|药棉|棉布卷|白布卷/.test(text);
};

const 物品是否坐骑生物 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /坐骑|骏马|马匹|马\b|黑马|白马|赤兔|的卢|汗血|乌骓|青骢|黄骠|驴|骡|骆驼|牦牛/.test(text);
};

const 物品是否武器 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return 物品是否现代枪械(item)
        || /武器|武型|主手|副手|暗器|兵器|刀|短刀|匕首|剑|长剑|短剑|弓|弩|箭|枪|矛|戟|棍|棒|杖|斧|锤|鞭|刃|飞刀|袖箭|镖/.test(text);
};

const 物品是否折扇 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.装备位置,
        item?.当前装备部位,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /扇|折扇|玉骨扇|纸扇|团扇|羽扇|法扇/u.test(text);
};

const 物品是否古代药物 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /丹药|药丸|药散|散剂|药粉|药膏|膏药|药液|伤药|止血|凝血|金疮|解毒|疗伤|丸|散\b|膏\b/.test(text);
};

const 物品是否草药植物 = (item: any): boolean => {
    const text = [
        item?.名称,
        item?.类型,
        item?.描述,
        item?.视觉描述,
        Array.isArray(item?.视觉标签) ? item.视觉标签.join(' ') : ''
    ].map((value) => 读取文本(value)).join(' ');
    return /冰莲|雪莲|莲花|莲\b|灵芝|人参|血参|药草|灵草|仙草|毒草|药材|草药|花瓣|花蕊|花朵|花\b|灵花|异花|奇花|根茎|藤蔓|叶片|果实|灵果/.test(text);
};

const 物品品质转英文 = (quality: string): string => {
    const map: Record<string, string> = {
        '传说': 'legendary', '绝世': 'mythic', '极品': 'top grade',
        '稀有': 'rare', '珍品': 'rare', '良品': 'fine', '精品': 'fine',
        '普通': 'common', '凡品': 'common', '杂物': 'cheap'
    };
    for (const [cn, en] of Object.entries(map)) {
        if (quality.includes(cn)) return en;
    }
    return 'common';
};

const 物品名称转英文描述 = (name: string): string => {
    // 常见武侠物品名称到英文视觉描述的映射
    const map: Record<string, string> = {
        '采药短刀': 'short herbal-gathering knife, small rusty utility blade with a simple wooden handle, handheld cutting tool for harvesting herbs, blade and handle clearly visible',
        '短刀': 'short knife, compact single edged metal blade, simple hilt and handle',
        '匕首': 'dagger, short double edged metal blade, hilt and grip',
        '长剑': 'jian sword, long straight metal blade with guard and handle',
        '短剑': 'short jian sword, straight compact metal blade with guard and handle',
        '飞刀': 'throwing knife, slim metal blade, small handle, hidden weapon prop',
        '袖箭': 'sleeve dart launcher or small dart projectile, hidden weapon prop',
        '弩箭': 'crossbow bolt, slender wooden shaft with metal arrowhead and fletching',
        '自动步枪': 'worn modern assault rifle, black metal firearm receiver, barrel, magazine, stock, trigger guard, scratched tactical finish, clearly a rifle not a spear',
        '突击步枪': 'modern assault rifle, firearm barrel, magazine, stock, receiver and grip clearly visible',
        '步枪': 'modern rifle firearm, long gun body with stock, barrel, receiver and magazine',
        '手枪': 'modern pistol firearm, compact handgun with grip, trigger guard, slide and barrel',
        '霰弹枪': 'modern shotgun firearm, pump or break-action body with stock and barrel',
        '散弹枪': 'modern shotgun firearm, pump or break-action body with stock and barrel',
        '冲锋枪': 'modern submachine gun firearm, compact receiver, magazine, grip and stock',
        '狙击枪': 'modern sniper rifle firearm, long barrel, scope, stock and magazine',
        '战术背心': 'wearable tactical vest, MOLLE webbing, shoulder straps, front buckles, pouch panels, torso garment shape, no shield',
        '防弹背心': 'wearable bulletproof vest, soft ballistic torso vest with shoulder straps and front panels, no shield',
        '负重背心': 'wearable load-bearing tactical vest, fabric torso gear with pouches and straps, no shield',
        '弓': 'traditional bow weapon, curved wooden bow with taut string',
        '弩': 'ancient crossbow weapon, wooden stock and bow limbs',
        '枪': 'spear weapon, long shaft with metal spearhead',
        '矛': 'spear weapon, long polearm with pointed metal head',
        '棍': 'staff weapon, long wooden fighting staff',
        '杖': 'staff weapon, carved wooden staff',
        '斧': 'battle axe, metal axe head with wooden handle',
        '锤': 'war hammer, heavy metal hammer head with handle',
        '鞭': 'flexible whip weapon, braided leather or metal chain',
        '剑': 'jian sword, straight metal blade with guard and handle',
        '刀': 'saber knife weapon, curved or single edged metal blade with hilt and handle',
        '玉骨扇': 'folded jade-rib hand fan, elegant Chinese fan with pale jade ribs and silk or paper fan leaf, decorative tassel, no blade',
        '折扇': 'folded Chinese hand fan with visible ribs and paper or silk fan leaf, decorative tassel, no blade',
        '纸扇': 'folded paper hand fan with bamboo ribs, no blade',
        '羽扇': 'feather fan, layered feathers on a short handle, no blade',
        '灵石': 'raw translucent spirit stone crystal mineral with soft inner glow',
        '灵晶': 'dense faceted spirit crystal with concentrated inner glow',
        '妖丹': 'round beast core crystal with layered inner glow, cultivation material',
        '玉简': 'bundle of jade slips tied with silk cord, abstract unreadable etched marks',
        '符箓': 'single talisman paper charm with abstract unreadable ink strokes',
        '符': 'single talisman paper charm with abstract unreadable ink strokes',
        '飞剑': 'slender xianxia flying sword artifact, ceremonial decorative prop, no person',
        '葫芦': 'jade or lacquered gourd magical vessel with cork stopper and silk cord',
        '铃': 'small bronze magical bell artifact with cord and tassel',
        '宝镜': 'round bronze magical mirror artifact with polished cloudy surface',
        '阵盘': 'round jade or bronze array disk with abstract geometric grooves, no readable text',
        '罗盘': 'bronze spirit compass artifact with central pointer and abstract rings',
        '丹炉': 'small three-legged alchemy furnace with lid and handles',
        '储物袋': 'small embroidered drawstring storage pouch, cultivation artifact bag',
        '储物戒': 'single storage ring artifact with gemstone, photographed alone, no hand',
        '灵兽袋': 'small spirit beast pouch made of leather and brocade, no animal visible',
        '法袍': 'soft cultivation robe laid flat, woven fabric and trim, no person',
        '法冠': 'cultivation hair crown accessory, jade or metal headwear prop, no person',
        '法靴': 'pair of empty cloth cultivation boots side by side, visible hollow openings',
        '乌金软甲': 'wearable blackened gold soft armor vest, flexible torso protection, fine overlapping dark metal scales sewn onto black cloth, sleeveless martial arts body armor',
        '软甲': 'wearable soft armor vest, flexible torso protection, overlapping small armor scales sewn onto cloth, sleeveless martial arts body armor',
        '内甲': 'wearable inner armor vest, thin flexible torso protection worn under robes, cloth-backed armor panels',
        '宝甲': 'wearable ornate armor vest, protective torso garment with fitted chest and waist panels',
        '甲衣': 'wearable armored garment, torso-shaped protective clothing with arm openings and waist hem',
        '护身甲': 'wearable protective armor vest for the torso, fitted chest and back panels',
        '护心甲': 'wearable heart-protecting breast armor, compact torso armor plate on a cloth backing',
        '练功服': 'cloth kung fu training uniform, soft fabric robe and trousers, folded garment',
        '武服': 'cloth martial arts uniform, soft fabric outfit, folded garment',
        '劲装': 'fitted cloth martial arts outfit, soft fabric clothing',
        '布衣': 'plain cloth robe, soft fabric garment',
        '布衫': 'plain cloth shirt robe, soft fabric garment',
        '青衫': 'blue green cloth robe, soft fabric garment',
        '长衫': 'long cloth robe, soft fabric garment',
        '道袍': 'taoist cloth robe, soft flowing fabric garment',
        '内门弟子服': 'inner sect disciple uniform robe, soft cloth garment, folded pale fabric with subtle trim, cloth-only clothing item',
        '弟子服': 'sect disciple uniform robe, soft cloth garment, folded pale fabric with trim, cloth-only clothing item',
        '门派服': 'sect uniform robe, soft cloth garment, folded fabric with trim, cloth-only clothing item',
        '外袍': 'outer cloth robe, soft flowing fabric garment',
        '长袍': 'long robe, soft fabric garment',
        '内衬': 'inner cloth lining garment, soft fabric clothing',
        '长裤': 'cloth trousers, folded fabric clothing',
        '旧草鞋': 'a pair of old straw sandals, woven straw footwear, two worn empty sandals placed side by side',
        '草鞋': 'a pair of straw sandals, woven straw footwear, two empty sandals placed side by side',
        '旧布鞋': 'a pair of old cloth shoes, worn fabric footwear, two empty shoes placed side by side',
        '布鞋': 'cloth shoes, woven fabric upper, layered stitched cloth sole, soft worn fabric footwear',
        '靴': 'boots, leather or cloth footwear',
        '绷带': 'rolled medical bandage, folded white cloth strip roll, gauze bandage spool, clean first-aid fabric supply',
        '纱布': 'folded sterile gauze pads and rolled gauze bandage, white medical dressing cloth',
        '止血布': 'folded hemostatic cloth dressing, white fabric bandage roll, first-aid supply',
        '木牌': 'wooden plaque tablet', '身份木牌': 'wooden identity plaque with carved text',
        '令牌': 'metal command token', '腰牌': 'waist badge token',
        '铜牌': 'bronze badge', '铁牌': 'iron plaque',
        '玉佩': 'jade pendant', '玉牌': 'jade plaque',
        '信物': 'keepsake token', '印章': 'seal stamp',
        '钥匙': 'ornate key', '锦囊': 'silk pouch',
        '卷轴': 'scroll', '书信': 'letter scroll',
        '地图': 'map scroll', '银票': 'silver banknote',
        '食盒': 'wooden food box', '酒壶': 'wine gourd',
        '灯笼': 'paper lantern', '火折子': 'fire starter flint',
        '绳索': 'hemp rope', '包袱': 'cloth bundle',
        '银两': 'silver ingots', '铜钱': 'copper coins',
        '凝血散': 'ancient hemostatic medicinal powder in a small folded paper packet or ceramic medicine vial, herbal powder for stopping bleeding',
        '金疮药': 'ancient wound medicine powder in a small ceramic medicine bottle or folded paper packet',
        '止血散': 'ancient hemostatic powder in a folded paper packet, herbal medicinal powder',
        '解毒散': 'ancient antidote powder in a folded paper packet or ceramic medicine vial',
        '幽冥冰莲': 'rare mystical ice lotus flower, dark blue translucent lotus petals, frosted botanical herb, glowing cold aura, intact flower bloom and stem',
        '冰莲': 'ice lotus flower, translucent blue white lotus petals, frosted botanical herb, intact flower bloom and stem',
        '雪莲': 'snow lotus flower, pale white alpine medicinal flower, layered petals, botanical herb specimen',
        '血参': 'red ginseng root medicinal herb, branching natural root shape, organic plant texture',
        '人参': 'ginseng root medicinal herb, branching natural root shape, organic plant texture',
        '灵芝': 'lingzhi mushroom medicinal herb, glossy red brown fungus cap, organic botanical specimen',
        '骏马': 'real living horse, full body animal, natural coat and mane',
        '马匹': 'real living horse, full body animal, natural coat and mane',
        '黑马': 'real living black horse, full body animal, natural coat and mane',
        '白马': 'real living white horse, full body animal, natural coat and mane',
        '赤兔': 'real living chestnut red horse, full body animal, natural coat and mane',
        '的卢': 'real living horse, full body animal, natural coat and mane',
        '汗血': 'real living Akhal-Teke style horse, full body animal, natural coat and mane',
        '乌骓': 'real living dark horse, full body animal, natural coat and mane',
        '青骢': 'real living dapple gray horse, full body animal, natural coat and mane',
        '黄骠': 'real living dun horse, full body animal, natural coat and mane',
        '驴': 'real living donkey, full body animal, natural fur',
        '骡': 'real living mule, full body animal, natural fur',
        '骆驼': 'real living camel, full body animal, natural fur',
        '牦牛': 'real living yak, full body animal, natural fur',
    };
    for (const [cn, en] of Object.entries(map)) {
        if (name.includes(cn)) return en;
    }
    // 通用关键词推断
    if (/扇|折扇|玉骨扇|纸扇|团扇|羽扇|法扇/u.test(name)) return 'folded Chinese hand fan prop, visible fan ribs and fan leaf, decorative tassel, no blade';
    if (/灵石|灵晶|晶石|矿石|妖丹/.test(name)) return 'raw cultivation mineral or crystal core specimen with natural glow, no text';
    if (/玉简|剑诀|心法|功法|入门|心得/.test(name)) return 'bundle of jade slips tied with silk cord, abstract unreadable etched marks and diagrams';
    if (/符箓|火球符|冰锥符|雷光符|金刚符|神行符|隐身符|传音符|传送符/.test(name)) return 'single talisman paper charm with abstract unreadable ink strokes, no readable characters';
    if (/阵盘|罗盘/.test(name)) return 'round cultivation array disk or compass artifact with abstract geometric grooves, no readable text';
    if (/丹炉/.test(name)) return 'small three-legged alchemy furnace with lid and handles, tabletop bronze or iron cultivation tool';
    if (/储物袋|灵兽袋/.test(name)) return 'small embroidered drawstring pouch cultivation treasure, no animal visible';
    if (/储物戒/.test(name)) return 'single ring magical artifact, photographed alone, no hand';
    if (/葫芦|铃|宝镜|镜|索/.test(name)) return 'xianxia magical artifact treasure prop, ancient Chinese material, clear single object silhouette';
    if (/暗器|兵器|刀|短刀|匕首|剑|弓|弩|箭|枪|矛|戟|棍|棒|杖|斧|锤|鞭|刃|镖/.test(name)) return 'traditional wuxia weapon prop, metal blade or weapon body with visible handle, hilt, shaft or grip';
    if (/牌|令|符/.test(name)) return 'wooden or metal plaque token';
    if (/壶|瓶|罐/.test(name)) return 'ceramic or metal container vessel';
    if (/匣|盒|箱/.test(name)) return 'wooden box or case';
    if (/书|卷|册|经/.test(name)) return 'ancient book or scroll';
    if (/袋|囊|包/.test(name)) return 'cloth pouch or bag';
    if (/丹|药|散|丸|膏/.test(name)) return 'ancient medicinal item, herbal powder or pills stored in a folded paper packet, cloth sachet, or small ceramic medicine vial';
    if (/冰莲|雪莲|莲|花|草|参|芝|根|藤|果|叶/.test(name)) return 'botanical medicinal herb specimen, natural plant or flower form, organic petals leaves roots or stems';
    if (/软甲|内甲|宝甲|甲衣|护身甲|护心甲|胸甲|背甲|护甲|铠甲|甲胄|皮甲|锁子甲|链甲|鳞甲/.test(name)) return 'wearable torso armor vest, protective garment shape, arm openings, shoulder straps, chest and back panels, waist hem';
    if (物品名称是否柔性服装(name)) return 'soft cloth martial arts garment, folded fabric clothing';
    return '';
};

const 构建物品视觉主体描述 = (item: any): string => {
    const name = 读取文本(item?.名称);
    const isLivingMount = 物品是否坐骑生物(item);
    const isFan = 物品是否折扇(item);
    const isModernFirearm = 物品是否现代枪械(item);
    const isTacticalVest = 物品是否战术背心(item);
    const isWeapon = !isFan && 物品是否武器(item);
    const isClothShoe = 物品是否布鞋(item);
    const isBandageDressing = 物品是否绷带敷料(item);
    const isSoftGarment = 物品是否柔性服装(item);
    const isPaleMoonWhiteGarment = 物品是否浅色月白服装(item);
    const isSectDiscipleUniform = 物品是否门派弟子服(item);
    const isWearableArmor = !isSoftGarment && 物品是否可穿戴护甲(item);
    const isAncientMedicine = 物品是否古代药物(item);
    const isBotanicalHerb = !isWeapon && !isAncientMedicine && 物品是否草药植物(item);
    const typeEn = isLivingMount ? 'living mount animal' : isFan ? 'folded Chinese hand fan' : isModernFirearm ? 'modern firearm' : isWeapon ? 'traditional wuxia weapon' : isSoftGarment ? 'cloth garment' : isTacticalVest ? 'wearable tactical vest' : isWearableArmor ? 'wearable torso armor vest' : isAncientMedicine ? 'ancient medicinal powder or pills' : isBotanicalHerb ? 'botanical medicinal herb' : 物品类型转英文(读取文本(item?.类型, '物品'));
    const qualityEn = 物品品质转英文(读取文本(item?.品质, '普通'));
    const nameEn = 物品名称转英文描述(name);
    const description = 读取文本(item?.视觉描述 || item?.描述);
    const tags = Array.isArray(item?.视觉标签)
        ? item.视觉标签.map((tag: unknown) => 读取文本(tag)).filter(Boolean).join(', ')
        : '';
    return [
        isLivingMount
            ? (nameEn ? `a single real living ${qualityEn} mount animal, ${nameEn}` : `a single real living ${qualityEn} ${typeEn}`)
            : (nameEn ? `a single ${qualityEn} ${nameEn}` : `a single ${qualityEn} ${typeEn} prop`),
        isLivingMount ? 'alive organic animal anatomy, natural fur coat, visible eyes, nostrils, mane or tail, standing on real ground, full body animal portrait' : '',
        isFan ? 'strict hand fan prop: folded or half-open fan, visible ribs, silk or paper leaf, jade/bamboo/wood spine, decorative tassel; absolutely no sword blade, no knife, no spearhead' : '',
        isModernFirearm ? 'strict modern firearm prop: rifle or gun receiver, barrel, stock, magazine, grip and trigger guard clearly visible; the silhouette must be a firearm, not a spear or polearm' : '',
        isWeapon && !isModernFirearm ? 'strict traditional weapon prop: blade, edge, hilt, handle, grip, shaft or scabbard clearly visible; if the name mentions gathering herbs, render the cutting tool itself, not herbs or plants' : '',
        isClothShoe ? 'strict footwear prop: a pair of empty shoes or sandals placed side by side, visible soles and woven fabric or straw texture, unworn product still life' : '',
        isBandageDressing ? 'strict first-aid dressing prop: standalone rolled bandage or folded gauze cloth, white fabric strip spool, clean product still life' : '',
        isSoftGarment ? 'soft textile clothing item, fabric seams, cloth folds, woven texture, flexible silhouette' : '',
        isPaleMoonWhiteGarment ? 'moon-white pale ivory fabric, light-colored cloth, clean soft textile surface, bright gentle robe color' : '',
        isSectDiscipleUniform ? 'Chinese sect disciple uniform robe, ceremonial training clothing, fabric collar and trim, cloth sash, cloth-only garment design' : '',
        isTacticalVest ? 'strict wearable tactical vest garment: MOLLE webbing, shoulder straps, front zipper or buckles, pouch panels, fabric torso vest shape, arm openings, displayed alone as gear' : '',
        isWearableArmor && !isTacticalVest ? 'strict wearable armor garment: torso vest shape, chest panel, back panel, shoulder straps, arm openings, waist hem, fitted to human upper body silhouette, displayed flat or on a simple invisible dress form' : '',
        isAncientMedicine ? 'ancient Chinese medicine presentation, herbal powder or pills, folded paper packet, cloth sachet, small ceramic medicine vial, apothecary prop, pre-modern wuxia era' : '',
        isBotanicalHerb ? 'strict botanical herb or flower specimen: organic petals, leaves, roots or stems, natural plant anatomy, no manufactured device, no electronics' : '',
        description ? `form and materials: ${description}` : '',
        tags ? `material cues: ${tags}` : ''
    ].filter(Boolean).join('\n');
};

export const 构建物品负面提示词 = (item: any): string => {
    const isFan = 物品是否折扇(item);
    const isModernFirearm = 物品是否现代枪械(item);
    const isTacticalVest = 物品是否战术背心(item);
    const isWeapon = !isFan && 物品是否武器(item);
    const isSoftGarment = 物品是否柔性服装(item);
    const isPaleMoonWhiteGarment = 物品是否浅色月白服装(item);
    const isWearableArmor = !isSoftGarment && 物品是否可穿戴护甲(item);
    const isClothShoe = 物品是否布鞋(item);
    const isBandageDressing = 物品是否绷带敷料(item);
    const isLivingMount = 物品是否坐骑生物(item);
    const isAncientMedicine = 物品是否古代药物(item);
    const isBotanicalHerb = !isWeapon && !isAncientMedicine && 物品是否草药植物(item);
    return [
        isLivingMount ? 'rider, saddle covering the body, harness covering the body, cart, carriage, vehicle, boat' : 'person, human, face, hand, foot, feet, body part, skin, portrait, headshot, framed portrait, photo frame, picture frame',
        isLivingMount ? 'toy horse, plastic horse, resin figurine, statue, sculpture, ceramic, porcelain, model horse, miniature, collectible figurine, carousel horse, rocking horse, fake animal, mannequin, doll, glossy plastic, product prop, studio toy photography' : '',
        isLivingMount ? '' : 'toy, plastic figurine, resin model, statue, sculpture, mannequin',
        isFan ? 'sword, saber, knife, dagger, blade, spear, spearhead, arrowhead, metal cutting edge, sharpened weapon, polearm, staff weapon' : '',
        'text, typography, letters, words, numbers, caption, label, plaque, sign, inscription, Chinese characters, English letters, calligraphy, seal, stamp, logo, watermark, signature, title, poster text',
        'game controller, gamepad, joystick, console controller, d-pad, analog stick, buttons, electronic device, gadget, plastic controller, remote control, keyboard, mouse',
        isModernFirearm ? 'spear, polearm, lance, staff, sword, saber, knife, medieval weapon, fantasy weapon, wooden shaft, spearhead, bow, crossbow, shield, helmet, armor suit' : 'modern weapon, firearm, gun, rifle, pistol, shotgun, assault rifle, sniper rifle, machine gun, firearm stock, trigger guard, gun barrel, magazine, bullet, ammunition, grenade, rocket launcher, cannon, sci-fi weapon, futuristic weapon, tactical gear, modern military, plastic gun, mechanical firearm',
        isTacticalVest ? 'shield only, medieval shield, riot shield, round shield, kite shield, helmet only, spear, polearm, sword, breastplate-only medieval armor, full armor suit, hard cuirass without fabric straps' : '',
        isWearableArmor ? 'sword, saber, knife, dagger, blade, spear, staff, scabbard, sheath, hilt, handle, pommel, long narrow weapon, umbrella, baton, column, tower, statue, helmet only, shield only' : '',
        isWeapon ? 'flower, plant, potted plant, bonsai, grass, herb specimen, petals, leaves as main subject, vase, flowerpot, medicine bottle, pill packet' : '',
        'item card, game card, trading card, UI overlay, interface, badge, quality badge, rarity badge, speech bubble, dialogue box, border frame, decorative frame',
        'white background, cluttered background, ink wash, guofeng illustration, Chinese painting, brush strokes, anime, cartoon, flat illustration',
        isSoftGarment ? 'armor, cuirass, breastplate, metal armor, metal plates, gauntlet, shield, helmet, hard shell, leather jacket, shiny leather garment, black armor, dark armor, lamellar armor, scale armor' : '',
        isPaleMoonWhiteGarment ? 'black clothing, dark outfit, black robe, dark robe, black fabric, dark fabric, black leather, dark leather' : '',
        isAncientMedicine ? 'weapon, blade, sword, dagger, knife, armor plate, metal weapon, hardware tool, industrial object, modern container, syringe, capsule bottle, plastic medical bottle, laboratory vial' : '',
        isBotanicalHerb ? 'machine, mechanism, tool, container, box, bottle, vial, weapon, armor, toy, controller, manufactured object, plastic, metal gadget' : '',
        isClothShoe ? 'feet, toes, legs, socks, person wearing shoes, shoe model, leather dress shoe, polished leather shoe, oxford shoe, loafer, business shoe, high heel, glossy leather, hard stacked heel' : '',
        isBandageDressing ? 'patient, wounded person, nurse, doctor, face, portrait, hand wrapping bandage, arm, leg, injury, blood, hospital bed, medical scene, photo frame, framed portrait' : ''
    ].filter(Boolean).join(', ');
};

export const 构建物品图提示词 = (
    item: any,
    options?: { 画风?: string; 渲染风格?: string; 来源位置?: 物品生图来源位置 }
): string => {
    const style = options?.画风 || '写实';
    const renderStyle = options?.渲染风格 || '写实道具';
    const isLivingMount = 物品是否坐骑生物(item);
    const isFan = 物品是否折扇(item);
    const isModernFirearm = 物品是否现代枪械(item);
    const isTacticalVest = 物品是否战术背心(item);
    const isWeapon = !isFan && 物品是否武器(item);
    const isClothShoe = 物品是否布鞋(item);
    const isBandageDressing = 物品是否绷带敷料(item);
    const isSoftGarment = 物品是否柔性服装(item);
    const isPaleMoonWhiteGarment = 物品是否浅色月白服装(item);
    const isSectDiscipleUniform = 物品是否门派弟子服(item);
    const isWearableArmor = !isSoftGarment && 物品是否可穿戴护甲(item);
    const isAncientMedicine = 物品是否古代药物(item);
    const isBotanicalHerb = !isWeapon && !isAncientMedicine && 物品是否草药植物(item);
    const softGarmentGuard = isSoftGarment
        ? 'for clothing items: soft fabric garment laid flat or neatly folded, visible cloth weave, seams, wrinkles, flexible drape'
        : '';
    if (isLivingMount) {
        return [
            'photorealistic full-body portrait of one real living mount animal, alive animal, standing naturally on real ground, no rider',
            'natural animal anatomy, organic body, realistic fur coat, real eyes, nostrils, mane and tail, subtle muscle structure, natural posture',
            'outdoor natural light or neutral stable-yard light, clean background, clear silhouette, documentary animal photography',
            style === '写实' ? 'photorealistic' : style,
            构建物品视觉主体描述(item)
        ].filter(Boolean).join('\n');
    }
    // 精简 prompt：正向只描述目标画面，排除项交给独立负面提示词。
    return [
        renderStyle === '写实道具'
            ? (isModernFirearm || isTacticalVest
                ? 'photorealistic product photo of a single modern survival inventory item, centered on a plain neutral background, realistic materials and soft shadow'
                : 'photorealistic product photo of a single physical wuxia inventory item, centered on a plain neutral background, realistic materials and soft shadow')
            : (isModernFirearm || isTacticalVest
                ? 'single modern survival inventory item asset on a plain neutral background, centered composition, clean silhouette'
                : 'single wuxia inventory item asset on a plain neutral background, centered composition, clean silhouette'),
        获取渲染风格要求(renderStyle),
        style === '写实' ? 'photorealistic' : style,
        isFan ? 'strict Chinese hand fan prop only: folded or half-open fan, visible ribs and fan leaf, jade or bamboo frame, tassel, elegant accessory; no blade, no knife, no sword, no spear' : '',
        isModernFirearm ? 'strict modern firearm prop only: rifle or gun body with receiver, barrel, magazine, stock, grip and trigger guard; not a spear, not a polearm, not a sword' : '',
        isWeapon && !isModernFirearm ? 'strict traditional wuxia weapon prop only: blade, hilt, handle, grip, shaft or scabbard must be the main subject; herb-related words describe use or wear, not the object category' : '',
        isClothShoe ? 'strict empty footwear prop only: two unworn sandals or cloth shoes side by side, product still life' : '',
        isBandageDressing ? 'strict bandage dressing prop only: standalone rolled gauze bandage or folded cloth strips, first-aid supply still life' : '',
        isPaleMoonWhiteGarment ? 'strict color requirement: moon-white pale ivory cloth, light warm white fabric, soft non-metal textile, bright clean garment surface' : '',
        isSectDiscipleUniform ? 'strict sect uniform garment: inner-disciple robe or training uniform, cloth collar, sash, woven trim, folded or laid flat as clothing' : '',
        isAncientMedicine ? 'strict ancient wuxia medicine prop only: folded paper medicine packet, small cloth sachet, ceramic medicine vial, herbal powder or pills; absolutely pre-modern, no modern technology' : '',
        isBotanicalHerb ? 'strict botanical herb or flower only: natural plant specimen, visible petals leaves roots or stems, organic plant anatomy, not a manufactured object' : '',
        isTacticalVest ? 'strict wearable tactical vest item: fabric upper-body vest with MOLLE webbing, shoulder straps, front buckles or zipper, pouch panels, arm holes and waist hem; product photo of clothing-shaped protective gear, no shield' : '',
        isWearableArmor && !isTacticalVest ? 'strict wearable armor item: upper-body vest or cuirass garment shape, sleeveless torso armor with arm holes, shoulder straps, chest and back panels, waist hem; product photo of clothing-shaped protective gear' : '',
        构建物品视觉主体描述(item),
        softGarmentGuard,
        'plain neutral background, centered object, clear silhouette, product catalog lighting'
    ].filter(Boolean).join('\n');
};

export const 生成物品图标 = async (
    item: 游戏物品,
    apiConfig: 接口设置结构,
    options?: 物品图标生成选项
): Promise<物品图标生成结果> => {
    const imageApi = 构建物品生图接口配置(options?.imageApi || 获取文生图接口配置(apiConfig));
    if (!接口配置是否可用(imageApi)) {
        throw new Error('请先在设置的“文生图”中配置可用接口，再生成物品图。');
    }

    const feature = apiConfig?.功能模型占位;
    const style = feature?.自动物品生图画风 || '写实';
    const renderStyle = feature?.自动物品生图渲染风格 || '写实道具';
    const size = 读取文本(options?.size || feature?.自动物品生图分辨率, '1024x1024') || '1024x1024';
    const sourceLocation = options?.sourceLocation || '背包';
    const structuredItem = 查找结构化物品(读取文本((item as any)?.名称));
    const enrichedItem: 游戏物品 = {
        ...(item as any),
        ...(structuredItem ? {
            类型: (item as any)?.类型 || structuredItem.类型,
            品质: (item as any)?.品质 || structuredItem.品质,
            视觉标签: Array.from(new Set([
                ...(((item as any)?.视觉标签 && Array.isArray((item as any).视觉标签)) ? (item as any).视觉标签 : []),
                ...structuredItem.视觉标签
            ])),
        } : {}),
        视觉描述: 读取文本((item as any)?.视觉描述) || 构建物品视觉描述(item),
    };
    const enrichedItemIsSoftGarment = 物品是否柔性服装(enrichedItem);
    const enrichedItemIsLivingMount = 物品是否坐骑生物(enrichedItem);
    const enrichedItemIsModernFirearm = 物品是否现代枪械(enrichedItem);
    const enrichedItemIsTacticalVest = 物品是否战术背心(enrichedItem);
    const enrichedItemIsWeapon = 物品是否武器(enrichedItem);
    const enrichedItemIsClothShoe = 物品是否布鞋(enrichedItem);
    const enrichedItemIsBandageDressing = 物品是否绷带敷料(enrichedItem);
    const enrichedItemIsAncientMedicine = 物品是否古代药物(enrichedItem);
    const prompt = 构建物品图提示词(enrichedItem, {
        画风: style,
        渲染风格: renderStyle,
        来源位置: sourceLocation
    });
    const extraPrompt = 读取文本(options?.extraPrompt);
    const finalPrompt = extraPrompt
        ? `${prompt}\n\nuser requested extra visual direction:\n${extraPrompt}`
        : prompt;
    const rawResult = await generateImageByPrompt(finalPrompt, imageApi, options?.signal, {
        构图: '物品图标',
        尺寸: size,
        附加正向提示词: enrichedItemIsLivingMount
            ? 'real living animal, alive mount, full body animal portrait, natural fur, organic anatomy, standing on real ground, no toy, no statue'
            : enrichedItemIsModernFirearm
            ? 'single physical modern firearm prop, receiver, barrel, magazine, stock, grip and trigger guard clearly visible, not a spear, photorealistic product photo, neutral matte studio background'
            : enrichedItemIsTacticalVest
            ? 'single wearable tactical vest prop, MOLLE webbing, shoulder straps, front buckles, pouch panels, fabric torso gear, no shield, photorealistic product photo, neutral matte studio background'
            : enrichedItemIsWeapon
            ? 'single physical traditional wuxia weapon prop, blade and handle clearly visible, weapon silhouette, metal or wood materials, no plant as main subject, photorealistic product photo, neutral matte studio background'
            : enrichedItemIsClothShoe
            ? 'single pair of empty cloth shoes or straw sandals, footwear prop, side by side, unworn product still life, photorealistic product photo, neutral matte studio background'
            : enrichedItemIsBandageDressing
            ? 'rolled gauze bandage and folded white cloth dressing, standalone first-aid supply still life, photorealistic product photo, neutral matte studio background'
            : !enrichedItemIsAncientMedicine && 物品是否草药植物(enrichedItem)
            ? 'botanical medicinal herb specimen, natural plant anatomy, petals leaves roots or stems, single organic flower or herb, pre-modern wuxia material, photorealistic product photo, neutral matte studio background'
            : enrichedItemIsAncientMedicine
            ? 'ancient Chinese medicine prop, folded paper medicine packet, ceramic medicine vial, herbal powder or pills, pre-modern wuxia era, single physical object, photorealistic product photo, neutral matte studio background'
            : renderStyle === '写实道具'
            ? `single physical ${enrichedItemIsModernFirearm || enrichedItemIsTacticalVest ? 'modern survival' : 'wuxia'} inventory item, photorealistic product photo, centered product composition, neutral matte studio background, clean silhouette, realistic material${enrichedItemIsSoftGarment ? ', soft fabric garment, cloth folds, flexible drape' : ''}`
            : 'single physical object, centered composition, clean silhouette, plain asset presentation',
        附加负面提示词: 构建物品负面提示词(enrichedItem),
    });
    const localResult = await persistImageAssetLocally(rawResult);
    const imageRecord: 物品生图结果 = {
        id: options?.recordId || `item_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        图片URL: localResult.图片URL,
        本地路径: localResult.本地路径,
        生图词组: finalPrompt,
        最终正向提示词: localResult.最终正向提示词,
        最终负向提示词: localResult.最终负向提示词,
        原始描述: JSON.stringify(enrichedItem, null, 2),
        使用模型: imageApi.model || imageApi.图片后端类型 || 'image-model',
        生成时间: Date.now(),
        构图: '物品图标',
        画风: style as 物品生图结果['画风'],
        渲染风格: renderStyle as 物品生图结果['渲染风格'],
        尺寸: size,
        状态: 'success',
        来源: 'generated',
    };
    const nextItem: 游戏物品 = {
        ...(enrichedItem as any),
        视觉描述来源: (enrichedItem as any).视觉描述来源 || '规则生成',
        图片档案: 合并物品图片档案(enrichedItem, imageRecord),
    };

    return { nextItem, imageRecord, prompt, imageApi };
};
