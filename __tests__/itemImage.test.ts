import { describe, expect, it } from 'vitest';
import { 获取物品已选图标地址 } from '../utils/itemImage';

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
});
