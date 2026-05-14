import { describe, expect, it } from 'vitest';
import { 执行响应命令处理, 响应命令处理状态 } from '../hooks/useGame/responseCommandProcessor';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';

const 构建基础状态 = (): 响应命令处理状态 => ({
    角色: { 姓名: '杨培强' } as any,
    环境: {} as any,
    社交: [],
    世界: {} as any,
    战斗: {} as any,
    玩家门派: {} as any,
    任务列表: [],
    约定列表: [],
    剧情: {} as any,
    剧情规划: {} as any
});

const deps = {
    规范化环境信息: (value?: any) => value || {},
    规范化社交列表,
    规范化世界状态: (value?: any) => value || {},
    规范化战斗状态: (value?: any) => value || {},
    规范化门派状态: (value?: any) => value || {},
    规范化剧情状态: (value?: any) => value || {},
    规范化剧情规划状态: (value?: any) => value || {},
    规范化女主剧情规划状态: (value?: any) => value,
    规范化同人剧情规划状态: (value?: any) => value,
    规范化同人女主剧情规划状态: (value?: any) => value,
    规范化角色物品容器映射: (value?: any) => value || {},
    战斗结束自动清空: (value?: any) => value || {}
};

describe('responseCommandProcessor dialogue social sync', () => {
    it('adds non-player dialogue speakers to social as dialogue NPCs for avatar backfill', () => {
        const state = 构建基础状态();
        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '院门外有人轻叩。' },
                { sender: '杨青儿', text: '兄长，前厅来客了。' },
                { sender: '杨培强', text: '我这就去。' },
                { sender: '【判定】', text: '无判定。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交).toHaveLength(1);
        expect(result.社交[0]).toMatchObject({
            姓名: '杨青儿',
            身份: '剧情对话人物',
            是否主要角色: false,
            是否在场: true,
            对白登场: true,
            自动补全头像: true
        });
        expect(result.社交[0].id).toMatch(/^npc_dialogue_/);
    });

    it('keeps existing social NPCs instead of duplicating dialogue speakers', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([{ id: 'npc_yang_qinger', 姓名: '杨青儿', 性别: '女' }], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '杨青儿', text: '兄长。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交).toHaveLength(1);
        expect(result.社交[0].id).toBe('npc_yang_qinger');
        expect(result.社交[0].对白登场).toBe(true);
        expect(result.社交[0].自动补全头像).toBe(true);
    });
});
