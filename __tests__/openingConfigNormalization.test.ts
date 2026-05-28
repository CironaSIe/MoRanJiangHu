import { describe, expect, it } from 'vitest';
import { 获取题材预设天赋, 获取题材预设背景 } from '../data/presets';
import { 获取题材开局配置文案, 规范化开局配置 } from '../utils/openingConfig';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('开局配置题材边界', () => {
    it('末日丧尸会保留营地和队友生成开关', () => {
        const config = 规范化开局配置({
            题材模式: '末日丧尸',
            开局生成门派: true,
            开局生成同门: true,
            同人融合: {
                enabled: false,
                启用附加小说: true,
                附加小说数据集ID: 'novel-a'
            }
        });

        expect(config.开局生成门派).toBe(true);
        expect(config.开局生成同门).toBe(true);
        expect(config.同人融合.启用附加小说).toBe(false);
        expect(config.同人融合.附加小说数据集ID).toBe('');
    });

    it('末世丧尸作为旧称会规范化到末日丧尸', () => {
        const config = 规范化开局配置({
            题材模式: '末世丧尸'
        });

        expect(config.题材模式).toBe('末日丧尸');
    });

    it('末日丧尸界面文案不把组织显示成门派同门', () => {
        const copy = 获取题材开局配置文案('末日丧尸');

        expect(copy.organizationEnabled).toBe(true);
        expect(copy.organizationTitle).toBe('开局生成营地');
        expect(copy.memberTitle).toBe('开局生成队友');
        expect(copy.organizationDescription).toContain('营地');
        expect(copy.memberDescription).toContain('队友');
        expect(copy.cutInLabels.门派起手?.label).toBe('营地起手');
    });

    it('现代都市会把组织位显示为现实组织和成员', () => {
        const config = 规范化开局配置({
            题材模式: '现代都市',
            开局生成门派: true,
            开局生成同门: true
        });
        const copy = 获取题材开局配置文案('现代都市');

        expect(config.开局生成门派).toBe(true);
        expect(config.开局生成同门).toBe(true);
        expect(copy.organizationEnabled).toBe(true);
        expect(copy.organizationTitle).toBe('开局生成组织');
        expect(copy.memberTitle).toBe('开局生成成员');
        expect(copy.organizationDescription).toContain('公司');
    });

    it('每个题材都有 30 个官方背景和 30 个官方天赋', () => {
        题材模式顺序.forEach((mode) => {
            expect(获取题材预设背景(mode), mode).toHaveLength(30);
            expect(获取题材预设天赋(mode), mode).toHaveLength(30);
        });
    });
});
