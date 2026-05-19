import { describe, expect, it, vi } from 'vitest';
import { 创建手动图片动作工作流 } from '../hooks/useGame/image/manualImageActionsWorkflow';

const 创建依赖 = (socialList: any[]) => ({
    获取社交列表: () => socialList,
    记录后台手动生图监控: vi.fn(),
    记录后台私密生图监控: vi.fn(),
    推送右下角提示: vi.fn(),
    执行单个NPC生图: vi.fn(async () => undefined),
    执行NPC香闺秘档部位生图: vi.fn(async () => undefined)
});

describe('manualImageActionsWorkflow', () => {
    it('全部生成时男娘主要角色只生成男性两处特写', async () => {
        const deps = 创建依赖([{
            id: 'npc_femboy',
            姓名: '霁月',
            性别: '男娘',
            是否主要角色: true,
            男娘设定: '女性化衣着与气质明确。',
            肉棒描述: '已有私密档案。',
            屁穴描述: '已有后庭档案。',
            图片档案: {}
        }]);
        const workflow = 创建手动图片动作工作流(deps);

        await workflow.generateNpcSecretPartImage('npc_femboy', '全部');

        expect(deps.执行NPC香闺秘档部位生图).toHaveBeenCalledTimes(2);
        expect(deps.执行NPC香闺秘档部位生图).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'npc_femboy' }), '屁穴', undefined);
        expect(deps.执行NPC香闺秘档部位生图).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'npc_femboy' }), '肉棒', undefined);
        expect(deps.推送右下角提示).toHaveBeenCalledWith(expect.objectContaining({
            title: '香闺秘档特写生成完成',
            message: '霁月的两处特写已全部写入图片档案。'
        }));
    });
});
