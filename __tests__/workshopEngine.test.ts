import { describe, expect, it } from 'vitest';
import {
    创建主题默认世界配置,
    创建主题默认开局配置,
    获取创意工坊角色默认值,
    获取创意工坊新开局步骤列表,
    解析创意工坊主题配置
} from '../utils/workshopEngine';
import { 题材模式配置表 } from '../data/workshopThemes/topicModeThemeData';

describe('创意工坊主题引擎', () => {
    it('从默认主题生成旧版兼容的新建存档流程', () => {
        const steps = 获取创意工坊新开局步骤列表();

        expect(steps.map((step) => step.id)).toEqual(['world', 'backgrounds', 'character', 'companion', 'opening', 'confirm']);
        expect(steps.map((step) => step.label)).toEqual(['世界观', '天赋背景', '角色基础', '开局伙伴', '开局配置', '确认生成']);
    });

    it('默认世界、角色和开局配置由主题文件提供', () => {
        const world = 创建主题默认世界配置('武侠');
        const role = 获取创意工坊角色默认值();
        const opening = 创建主题默认开局配置('武侠');

        expect(world.worldName).toBe('太古界');
        expect(world.modeRuntimeProfile?.identity.baseMode).toBe('武侠');
        expect(role.appearance).toContain('黑发黑眸');
        expect(opening.初始伙伴?.关系).toBe('自幼相识的同行伙伴');
        expect(opening.modeRuntimeProfile?.identity.baseMode).toBe('武侠');
    });

    it('能规范化不完整主题配置并补齐必要步骤', () => {
        const theme = 解析创意工坊主题配置({
            id: 'custom',
            title: '自定义主题',
            description: '测试主题',
            creationFlow: [{ id: 'world', label: '世界设定' }] as any
        });

        expect(theme.id).toBe('custom');
        expect(theme.creationFlow.some((step) => step.id === 'confirm')).toBe(true);
        expect(theme.creationFlow.find((step) => step.id === 'world')?.label).toBe('世界设定');
    });

    it('官方题材模式数据已从工具层剥离到主题数据文件', () => {
        expect(Object.keys(题材模式配置表)).toContain('武侠');
        expect(题材模式配置表.仙侠.worldDefaults.worldExtraRequirement).toContain('灵石');
    });
});
