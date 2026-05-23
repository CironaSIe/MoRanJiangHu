import { describe, expect, it, vi } from 'vitest';
import { 标准化功法列表, 规范化社交列表 } from '../hooks/useGame/stateTransforms';
import { 执行正文润色 } from '../hooks/useGame/bodyPolish';
import * as textAIService from '../services/ai/text';

vi.mock('../services/ai/text', () => ({
    generatePolishedBody: vi.fn(),
    StoryResponseParseError: class StoryResponseParseError extends Error {}
}));

vi.mock('../utils/apiConfig', () => ({
    获取文章优化接口配置: vi.fn(() => ({
        apiKey: 'test-key',
        model: 'test-model',
        baseUrl: 'https://example.com',
        供应商: 'openai',
        协议覆盖: 'auto'
    })),
    接口配置是否可用: vi.fn(() => true)
}));

describe('功法品质校准', () => {
    it('会把高品质功法补成匹配的数值和效果结构', () => {
        const list = 标准化功法列表([
            {
                ID: 'k1',
                名称: '太虚剑典',
                类型: '外功',
                品质: '绝世',
                描述: '很强的剑法',
                当前重数: 1,
                最高重数: 2,
                升级经验: 30,
                基础伤害: 5,
                加成系数: 0.1,
                内力系数: 0.1,
                附带效果: [],
                被动修正: [],
                重数描述映射: [],
                境界特效: []
            }
        ]);

        expect(list).toHaveLength(1);
        const kungfu = list[0];
        expect(kungfu.最高重数).toBeGreaterThanOrEqual(10);
        expect(kungfu.升级经验).toBeGreaterThanOrEqual(650);
        expect(kungfu.基础伤害).toBeGreaterThanOrEqual(65);
        expect(kungfu.加成系数).toBeGreaterThanOrEqual(1.75);
        expect(kungfu.内力系数).toBeGreaterThanOrEqual(1.2);
        expect(kungfu.圆满效果).toContain('绝世');
        expect(kungfu.重数描述映射.length).toBeGreaterThan(0);
        expect(kungfu.附带效果.length + kungfu.被动修正.length).toBeGreaterThan(0);
    });
});

describe('NPC 指令字段保留', () => {
    it('不会在规范化时丢掉当前任务和去向字段', () => {
        const list = 规范化社交列表([
            {
                id: 'npc_1',
                姓名: '沈青岚',
                身份: '同伴',
                当前任务: '去东门接应',
                行动意图: '前往东门',
                待执行指令: '先去东门等候',
                指令来源: '玩家',
                指令时间: '2026-05-23 13:00',
                预期汇合地点: '临安城东门',
                是否在场: false
            }
        ]);

        expect(list[0]).toMatchObject({
            当前任务: '去东门接应',
            行动意图: '前往东门',
            待执行指令: '先去东门等候',
            指令来源: '玩家',
            指令时间: '2026-05-23 13:00',
            预期汇合地点: '临安城东门'
        });
    });
});

describe('正文优化重试', () => {
    it('在第一次扩写仍偏短时会自动再试一次并接受达标结果', async () => {
        vi.mocked(textAIService.generatePolishedBody)
            .mockResolvedValueOnce({
                bodyText: '短文草稿短文草稿短文草稿短文草稿短文草稿短文草稿短文草稿短文草稿',
                rawText: 'first'
            } as any)
            .mockResolvedValueOnce({
                bodyText: '这是一段足够长的扩写正文。'.repeat(20),
                rawText: 'second'
            } as any);

        const result = await 执行正文润色(
            { logs: [{ sender: '旁白', text: '原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文' }] } as any,
            '<正文>原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文</正文>',
            {
                apiConfig: {
                    功能模型占位: {
                        文章优化独立模型开关: true,
                        文章优化使用模型: 'test-model',
                        文章优化API地址: 'https://example.com',
                        文章优化API密钥: 'test-key'
                    }
                },
                prompts: [],
                gameConfig: {},
                环境: {} as any,
                剧情: {} as any,
                社交: [],
                战斗: {} as any,
                角色: {} as any,
                文章优化已开启: true,
                深拷贝: (value: any) => JSON.parse(JSON.stringify(value))
            } as any,
            { allowExpansionForLength: true, minLength: 80 }
        );

        expect(vi.mocked(textAIService.generatePolishedBody)).toHaveBeenCalledTimes(2);
        expect(result.applied).toBe(true);
        expect(result.response.body_optimized).toBe(true);
        expect(result.rawText).toBe('second');
    });
});
