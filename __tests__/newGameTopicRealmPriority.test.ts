import { describe, expect, it } from 'vitest';
import { 选择开局境界体系来源 } from '../hooks/useGame/worldGenerationWorkflow';
import { 构建开局配置提示词, 构建题材模式提示词 } from '../prompts/runtime/openingConfig';
import { 规范化开局配置 } from '../utils/openingConfig';

describe('新开局题材模式与手动境界优先级', () => {
    it('仙侠题材启用开局配置时，手动境界提示词优先于固定仙侠境界', () => {
        const source = 选择开局境界体系来源({
            启用修炼体系: true,
            手动境界提示词: '<境界体系>凡骨境 -> 入道境 -> 星河境</境界体系>',
            是仙侠题材: true,
            启用同人境界: false
        });

        expect(source).toBe('manual');
    });

    it('关闭开局配置时，题材模式仍然保留仙侠货币口径，但不注入开局关系约束', () => {
        const config = 规范化开局配置({
            配置约束启用: false,
            题材模式: '仙侠'
        });

        const topicPrompt = 构建题材模式提示词(config);
        const openingPrompt = 构建开局配置提示词(config);

        expect(topicPrompt).toContain('题材模式：仙侠世界');
        expect(topicPrompt).toContain('下品/中品/上品灵石');
        expect(topicPrompt).not.toContain('金元宝/银子/铜钱');
        expect(openingPrompt).toBe('');
    });
});
