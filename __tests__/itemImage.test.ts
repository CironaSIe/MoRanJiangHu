import { describe, expect, it } from 'vitest';
import { 获取物品已选图标地址 } from '../utils/itemImage';
import { 构建物品图提示词, 构建物品负面提示词 } from '../services/ai/itemImageGeneration';

describe('item image preset fallback', () => {
    const expectHostedPreset = (url: string | undefined) => {
        expect(url).toMatch(/^https:\/\/image1?\.bacon159\.pp\.ua\/file\/.+\.png$/);
    };

    it('uses safe preset icons for known starter equipment instead of stale generated images', () => {
        const item: any = {
            ID: 'Item001',
            名称: '精钢长剑',
            类型: '武器',
            品质: '良品',
            图片档案: {
                最近生图结果: {
                    id: 'bad_generated_spear',
                    状态: 'success',
                    图片URL: 'https://example.com/wrong-spear.png',
                    构图: '物品图标'
                },
                生图历史: [
                    {
                        id: 'bad_generated_spear',
                        状态: 'success',
                        图片URL: 'https://example.com/wrong-spear.png',
                        构图: '物品图标'
                    }
                ],
                已选图标图片ID: 'bad_generated_spear'
            }
        };

        expectHostedPreset(获取物品已选图标地址(item));
    });

    it('uses distinct starter clothing presets for pants and shoes', () => {
        const pants: any = { 名称: '粗布长裤', 类型: '防具', 品质: '凡品' };
        const shoes: any = { 名称: '旧布鞋', 类型: '防具', 品质: '凡品' };

        const pantsIcon = 获取物品已选图标地址(pants);
        const shoesIcon = 获取物品已选图标地址(shoes);

        expectHostedPreset(pantsIcon);
        expectHostedPreset(shoesIcon);
        expect(pantsIcon).not.toBe(shoesIcon);
    });

    it('uses generated local presets for structured item library names', () => {
        const sword: any = { 名称: '钢剑', 类型: '武器', 品质: '良品' };
        const armor: any = { 名称: '钢盔甲', 类型: '防具', 品质: '良品' };

        expectHostedPreset(获取物品已选图标地址(sword));
        expectHostedPreset(获取物品已选图标地址(armor));
        expect(获取物品已选图标地址(sword)).not.toBe(获取物品已选图标地址(armor));
    });

    it('uses normative preset names when the display name follows the story flavor', () => {
        const item: any = {
            名称: '杨氏断门刀',
            规范物品名称: '钢刀',
            类型: '武器',
            品质: '良品'
        };

        expectHostedPreset(获取物品已选图标地址(item));
    });

    it('uses preset image first for every exact preset name', () => {
        const item: any = {
            ID: 'Item002',
            名称: '青钢剑',
            类型: '武器',
            品质: '良品',
            图片档案: {
                最近生图结果: {
                    id: 'custom_icon',
                    状态: 'success',
                    图片URL: 'https://example.com/custom-sword.png',
                    构图: '物品图标'
                },
                生图历史: [
                    {
                        id: 'custom_icon',
                        状态: 'success',
                        图片URL: 'https://example.com/custom-sword.png',
                        构图: '物品图标'
                    }
                ],
                已选图标图片ID: 'custom_icon'
            }
        };

        expectHostedPreset(获取物品已选图标地址(item));
    });

    it('does not use a preset image when the Chinese name differs by even one character', () => {
        const item: any = {
            ID: 'Item003',
            名称: '精铁长剑',
            类型: '武器',
            品质: '良品',
            图片档案: {
                最近生图结果: {
                    id: 'generated_exact_for_custom_name',
                    状态: 'success',
                    图片URL: 'https://example.com/generated-custom-sword.png',
                    构图: '物品图标'
                },
                生图历史: [
                    {
                        id: 'generated_exact_for_custom_name',
                        状态: 'success',
                        图片URL: 'https://example.com/generated-custom-sword.png',
                        构图: '物品图标'
                    }
                ],
                已选图标图片ID: 'generated_exact_for_custom_name'
            }
        };

        expect(获取物品已选图标地址(item)).toBe('https://example.com/generated-custom-sword.png');
    });

    it('normalizes whitespace when matching structured preset names', () => {
        const item: any = {
            名称: ' 精钢长剑 ',
            类型: '武器',
            品质: '良品',
            图片档案: {
                最近生图结果: {
                    id: 'generated_for_spaced_name',
                    状态: 'success',
                    图片URL: 'https://example.com/generated-spaced-name.png',
                    构图: '物品图标'
                }
            }
        };

        expectHostedPreset(获取物品已选图标地址(item));
    });

    it('treats item-hosted image URLs as existing icons so auto generation can skip them', () => {
        const item: any = {
            ID: 'ItemRemote001',
            名称: '无名玉佩',
            类型: '饰品',
            品质: '良品',
            图床链接: 'https://cdn.example.com/items/jade-pendant.png'
        };

        expect(获取物品已选图标地址(item)).toBe('https://cdn.example.com/items/jade-pendant.png');
    });
});

describe('item image prompt classification', () => {
    it('renders damp cigarettes as a cigarette pack, not a pouch', () => {
        const item = {
            名称: '半包受潮的香烟',
            类型: '杂物',
            品质: '凡品',
            描述: '半包受潮后还能勉强点燃的旧香烟。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('opened damp cardboard cigarette pack');
        expect(prompt).toContain('visible bent cigarettes');
        expect(negativePrompt).toContain('leather pouch');
        expect(negativePrompt).toContain('drawstring bag');
    });

    it('treats training clothes as soft fabric garments even when item type is armor', () => {
        const prompt = 构建物品图提示词({
            名称: '灰黑练功服',
            类型: '防具',
            品质: '凡品',
            描述: '一套灰黑色的练功服，布料结实，适合日常练武。'
        });

        expect(prompt).toContain('cloth kung fu training uniform');
        expect(prompt).toContain('soft textile clothing item');
        expect(prompt).toContain('flexible drape');
        expect(prompt).not.toMatch(/\b(?:no|not)\b/i);
        expect(prompt).not.toContain('armor prop');
    });

    it('treats moon-white sect disciple clothes as pale cloth uniforms instead of black armor', () => {
        const item = {
            名称: '月白内门弟子服',
            类型: '防具',
            品质: '良品',
            装备位置: '胸部',
            描述: '月白色内门弟子制式服，布料细密，衣襟处有浅色纹饰。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('inner sect disciple uniform robe');
        expect(prompt).toContain('moon-white pale ivory fabric');
        expect(prompt).toContain('soft textile clothing item');
        expect(prompt).toContain('cloth-only garment design');
        expect(prompt).not.toContain('strict wearable armor item');
        expect(prompt).not.toContain('cuirass garment shape');
        expect(negativePrompt).toContain('black armor');
        expect(negativePrompt).toContain('dark armor');
        expect(negativePrompt).toContain('black clothing');
        expect(negativePrompt).toContain('dark robe');
    });

    it('renders modified crossbows as crossbows instead of polearms', () => {
        const item = {
            名称: '改装弩',
            类型: '武器',
            品质: '良品',
            描述: '用废旧零件重新调校的静音弩，适合末世近距离伏击。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('modified compact crossbow');
        expect(prompt).toContain('horizontal bow limbs');
        expect(prompt).toContain('stock, trigger');
        expect(prompt).not.toContain('spear weapon');
        expect(negativePrompt).toContain('polearm');
        expect(negativePrompt).toContain('staff');
    });

    it('treats old military uniforms as soft cloth garments instead of armor', () => {
        const item = {
            名称: '旧军装',
            类型: '防具',
            品质: '凡品',
            描述: '一套磨旧的军装，袖口已经起毛，只有基础遮蔽作用。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('worn modern military uniform');
        expect(prompt).toContain('soft textile clothing item');
        expect(prompt).not.toContain('strict wearable armor item');
        expect(negativePrompt).toContain('lamellar armor');
        expect(negativePrompt).toContain('metal plates');
    });

    it('keeps exclusions in the negative prompt for cloth shoes instead of the positive prompt', () => {
        const item = {
            名称: '千层底布鞋',
            类型: '防具',
            品质: '凡品',
            描述: '手纳的千层底布鞋，鞋面灰黑，适合长途赶路。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('cloth shoes');
        expect(prompt).not.toMatch(/\b(?:no|not)\b/i);
        expect(negativePrompt).toContain('leather dress shoe');
        expect(negativePrompt).toContain('polished leather shoe');
    });

    it('renders old straw sandals as empty footwear without people or feet', () => {
        const item = {
            名称: '旧草鞋',
            类型: '防具',
            品质: '凡品',
            描述: '一双磨旧的草鞋，草绳已经有些松散。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('old straw sandals');
        expect(prompt).toContain('strict empty footwear prop only');
        expect(prompt).toContain('unworn product still life');
        expect(prompt).not.toMatch(/\b(?:no|not)\b/i);
        expect(negativePrompt).toContain('feet');
        expect(negativePrompt).toContain('person wearing shoes');
    });

    it('renders bandages as dressing supplies without portraits or body parts', () => {
        const item = {
            名称: '绷带',
            类型: '消耗品',
            品质: '凡品',
            描述: '用于包扎伤口的干净布条。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('rolled medical bandage');
        expect(prompt).toContain('strict bandage dressing prop only');
        expect(prompt).toContain('first-aid supply still life');
        expect(prompt).not.toMatch(/\b(?:no|not)\b/i);
        expect(negativePrompt).toContain('framed portrait');
        expect(negativePrompt).toContain('body part');
        expect(negativePrompt).toContain('hand wrapping bandage');
    });

    it('keeps real defensive gear classified as armor', () => {
        const prompt = 构建物品图提示词({
            名称: '精铁护腕',
            类型: '防具',
            品质: '良品',
            描述: '一对精铁打造的护腕。'
        });

        expect(prompt).toContain('fine armor prop');
        expect(prompt).not.toContain('soft textile clothing item');
    });

    it('keeps herb-gathering knives classified as weapons despite herb wording', () => {
        const item = {
            名称: '采药短刀',
            类型: '武器',
            品质: '凡品',
            装备位置: '主手',
            描述: '用来割药草的短刀，略带锈迹。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('short herbal-gathering knife');
        expect(prompt).toContain('strict traditional wuxia weapon prop only');
        expect(prompt).toContain('blade, hilt, handle');
        expect(prompt).not.toContain('strict botanical herb or flower');
        expect(negativePrompt).toContain('potted plant');
        expect(negativePrompt).toContain('flowerpot');
        expect(negativePrompt).not.toContain('manufactured object');
    });

    it('treats mystical lotus materials as botanical herbs instead of generic game props', () => {
        const item = {
            名称: '幽冥冰莲',
            类型: '材料',
            品质: '传说',
            描述: '生长在极寒幽潭中的奇异莲花，花瓣如冰，散发幽蓝寒气。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('ice lotus flower');
        expect(prompt).toContain('strict botanical herb or flower');
        expect(prompt).not.toContain('game prop');
        expect(negativePrompt).toContain('game controller');
        expect(negativePrompt).toContain('electronic device');
        expect(negativePrompt).toContain('manufactured object');
    });

    it('renders modern assault rifles as firearms instead of ancient spears', () => {
        const item = {
            名称: '磨损的自动步枪',
            类型: '武器',
            品质: '良品',
            描述: '枪身磨损严重，弹匣和枪托仍可使用。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('modern assault rifle');
        expect(prompt).toContain('receiver, barrel, magazine, stock');
        expect(prompt).toContain('strict modern firearm prop only');
        expect(prompt).not.toContain('strict traditional wuxia weapon prop only');
        expect(negativePrompt).toContain('spear');
        expect(negativePrompt).toContain('polearm');
        expect(negativePrompt).not.toContain('modern weapon, firearm, gun');
    });

    it('renders tactical vests as wearable gear instead of shields', () => {
        const item = {
            名称: '战术背心',
            类型: '防具',
            品质: '良品',
            描述: '带有模块化织带和弹匣袋的旧战术背心。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('wearable tactical vest');
        expect(prompt).toContain('MOLLE webbing');
        expect(prompt).toContain('strict wearable tactical vest item');
        expect(negativePrompt).toContain('shield only');
        expect(negativePrompt).toContain('medieval shield');
    });
});
