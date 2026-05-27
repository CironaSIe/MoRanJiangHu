import { describe, expect, it } from 'vitest';
import { 数值_修炼体系 } from '../prompts/stats/cultivation';
import { 应用境界体系区块替换, 构建同人运行时提示词包, 获取硬编码仙侠境界名称, 校验境界体系提示词完整性, 解析境界映射值 } from '../prompts/runtime/fandom';
import { buildRealmPromptFromDraft } from '../utils/newGameDiy';
import { 获取单位境界显示 } from '../utils/realmDisplay';

const 仙侠开局 = { 题材模式: '仙侠' } as any;

describe('xianxia hardcoded realm system', () => {
    it('uses the fixed xianxia mapping instead of AI or wuxia realm names', () => {
        const bundle = 构建同人运行时提示词包({
            openingConfig: 仙侠开局,
            realmPrompt: '【境界映射母板】\n1 => 开脉境一重\n11 => 归元境三重'
        });

        expect(bundle.境界母板补丁).toContain('1 => 炼气一层');
        expect(bundle.境界母板补丁).toContain('11 => 炼气十一层');
        expect(bundle.境界母板补丁).toContain('16 => 筑基圆满');
        expect(bundle.境界母板补丁).toContain('24 => 元婴圆满');
        expect(bundle.境界母板补丁).not.toContain('累计值11');
        expect(bundle.境界母板补丁).not.toContain('开脉境一重');
    });

    it('replaces cultivation protocol blocks with xianxia terms', () => {
        const bundle = 构建同人运行时提示词包({ openingConfig: 仙侠开局 });
        const content = 应用境界体系区块替换(数值_修炼体系.内容, bundle);

        expect(content).toContain('【仙侠修炼体系');
        expect(content).toContain('炼气十一层');
        expect(content).toContain('筑基圆满');
        expect(content).toContain('元婴圆满');
        expect(content).toContain('仙侠硬边界');
        expect(content).not.toContain('开脉境（`1~4`）');
        expect(content).not.toContain('文案从“X境N重”');
    });

    it('maps and displays xianxia realm names from level values', () => {
        expect(获取硬编码仙侠境界名称(3)).toBe('炼气三层');
        expect(解析境界映射值('筑基圆满', { openingConfig: 仙侠开局 })).toBe(16);
        expect(获取单位境界显示({ 境界: '开脉境三重', 境界层级: 3, 灵根: '火灵根' }, '未知', { forceXianxia: true })).toBe('炼气三层');
        expect(获取单位境界显示({ 境界: '未知境界', 境界层级: 13, 灵根: '火灵根' }, '未知', { forceXianxia: true })).toBe('筑基初期');
        expect(获取单位境界显示({ 境界层级: 17, 当前灵力: 1 }, '未知境界', { forceXianxia: true })).toBe('金丹初期');
    });

    it('can read a custom realm prompt by level when the stored realm text is missing', () => {
        const realmPrompt = [
            '【境界映射母板】',
            '1 => 凡骨一阶',
            '2 => 凡骨二阶',
            '3 => 星火初燃'
        ].join('\n');

        expect(获取单位境界显示({ 境界: '未知', 境界层级: 3 }, '未知境界', { realmPrompt })).toBe('星火初燃');
    });

    it('generates a complete validated realm prompt from DIY rows', () => {
        const prompt = buildRealmPromptFromDraft({
            rows: [
                { id: 'r1', name: '炼体', level: 1, power: '凡俗武者', breakthrough: '打熬筋骨', parameters: '气血', description: '低武起点' },
                { id: 'r5', name: '凝气', level: 5, power: '内息成形', breakthrough: '内息贯通', parameters: '内息', description: '可催动内劲' },
                { id: 'r9', name: '筑基', level: 9, power: '根基初成', breakthrough: '道基稳定', parameters: '灵力', description: '修仙入门' }
            ],
            updatedAt: Date.now()
        });

        const validation = 校验境界体系提示词完整性(prompt);
        expect(validation.ok).toBe(true);
        expect(validation.normalizedText).toContain('【境界映射母板】');
        expect(validation.normalizedText).toContain('【九阶命名与能力边界】');
    });
});
