import { describe, expect, it } from 'vitest';
import { 数值_修炼体系 } from '../prompts/stats/cultivation';
import { 应用境界体系区块替换, 构建同人运行时提示词包, 获取硬编码仙侠境界名称, 解析境界映射值 } from '../prompts/runtime/fandom';
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
    });
});
