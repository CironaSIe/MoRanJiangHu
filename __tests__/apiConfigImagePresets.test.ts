import { describe, expect, it } from 'vitest';
import { 获取词组转化器预设上下文, 获取文生图接口配置, 规范化接口设置 } from '../utils/apiConfig';

describe('image artist prompt presets', () => {
    it('adds GPT image presets to new and legacy image settings', () => {
        const settings = 规范化接口设置({
            功能模型占位: {
                画师串预设列表: [{
                    id: 'custom_artist',
                    名称: '玩家自定义',
                    适用范围: 'npc',
                    画师串: '',
                    正面提示词: 'custom positive',
                    负面提示词: '',
                    createdAt: 1,
                    updatedAt: 1
                }]
            }
        });

        const presets = settings.功能模型占位.画师串预设列表;
        expect(presets.some((item) => item.id === 'gpt_image2_wuxia_cg_all')).toBe(true);
        expect(presets.some((item) => item.id === 'gpt_image2_scene_clean')).toBe(true);
        expect(presets.some((item) => item.id === 'gpt_image2_premium_cg_all')).toBe(true);
        expect(presets.some((item) => item.id === 'custom_artist')).toBe(true);
        expect(presets.find((item) => item.id === 'gpt_image2_wuxia_cg_all')?.正面提示词)
            .toContain('High-end Chinese fantasy CG illustration style');
        expect(presets.find((item) => item.id === 'gpt_image2_scene_clean')?.负面提示词)
            .toContain('typography');
        expect(presets.find((item) => item.id === 'gpt_image2_premium_cg_all')?.正面提示词)
            .toContain('premium CG key visual');
        expect(presets.find((item) => item.id === 'gpt_image2_premium_cg_all')?.负面提示词)
            .toContain('phone photo');
    });

    it('forces GPT image models away from chat completions and onto image generations', () => {
        const settings = 规范化接口设置({
            activeConfigId: 'main',
            configs: [{
                id: 'main',
                名称: '主接口',
                供应商: 'openai_compatible',
                baseUrl: 'https://cdn.moe-atelier.site',
                apiKey: 'sk-test',
                model: 'gpt-4o',
                maxTokens: 2000,
                temperature: 0.7
            }],
            功能模型占位: {
                文生图功能启用: true,
                文生图后端类型: 'openai',
                文生图模型使用模型: 'gpt-image-2',
                文生图模型API地址: 'https://cdn.moe-atelier.site',
                文生图模型API密钥: 'sk-test',
                文生图接口路径模式: 'preset',
                文生图预设接口路径: 'openai_chat'
            }
        });

        const imageConfig = 获取文生图接口配置(settings, { 忽略文生图总开关: true });

        expect(imageConfig?.图片预设接口路径).toBe('openai_images');
        expect(imageConfig?.图片接口路径).toBe('/v1/images/generations');
    });

    it('uses the GPT Image 2 premium CG transformer bundle automatically', () => {
        const settings = 规范化接口设置({
            功能模型占位: {
                文生图后端类型: 'openai',
                文生图模型使用模型: 'gpt-image-2',
                场景生图后端类型: 'openai',
                场景生图模型使用模型: 'gpt-image-2'
            }
        });

        const npcContext = 获取词组转化器预设上下文(settings, 'npc');
        const sceneContext = 获取词组转化器预设上下文(settings, 'scene');
        const judgeContext = 获取词组转化器预设上下文(settings, 'scene_judge', 'default', { 包含输出格式提示词: false });

        expect(settings.功能模型占位.模型词组转化器预设列表
            .some((item) => item.id === 'transformer_model_bundle_gpt_image2_premium_cg')).toBe(true);
        expect(settings.功能模型占位.词组转化器提示词预设列表
            .some((item) => item.id === 'transformer_gpt_image2_premium_cg_npc')).toBe(true);
        expect(npcContext.AI角色定制提示词).toContain('GPT Image 2');
        expect(npcContext.相关提示词).toContain('顶级 CG 主视觉角色提示词整理器');
        expect(sceneContext.相关提示词).toContain('高级游戏 CG 关键帧');
        expect(judgeContext.相关提示词).toContain('顶级 CG 主视觉质感');
        expect(sceneContext.词组序列化策略).toBe('flat');
    });
});
