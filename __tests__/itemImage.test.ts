import { describe, expect, it } from 'vitest';
import { 获取物品已选图标地址 } from '../utils/itemImage';
import { 构建物品图提示词, 构建物品负面提示词 } from '../services/ai/itemImageGeneration';

describe('item image preset fallback', () => {
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

        expect(获取物品已选图标地址(item)).toBe('/assets/item-presets/精钢长剑.png');
    });

    it('uses distinct starter clothing presets for pants and shoes', () => {
        const pants: any = { 名称: '粗布长裤', 类型: '防具', 品质: '凡品' };
        const shoes: any = { 名称: '旧布鞋', 类型: '防具', 品质: '凡品' };

        expect(获取物品已选图标地址(pants)).toBe('/assets/item-presets/粗布长裤.png');
        expect(获取物品已选图标地址(shoes)).toBe('/assets/item-presets/旧布鞋.png');
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

        expect(获取物品已选图标地址(item)).toBe('https://cdn.nodeimage.com/i/MzHlups3ymlkKKeKdsWNYPR6BXM55aLG.png');
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

    it('does not normalize whitespace when matching preset names', () => {
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

        expect(获取物品已选图标地址(item)).toBe('https://example.com/generated-spaced-name.png');
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
});
