import { describe, expect, it } from 'vitest';
import { 补全缺失游戏初始时间, 从历史与回忆恢复游戏初始时间 } from '../hooks/useGame';

describe('游戏初始时间兼容恢复', () => {
    it('已有游戏初始时间时不会用其他时间覆盖', () => {
        const recovered = 补全缺失游戏初始时间(
            '1:01:01:08:00',
            [
                { role: 'assistant', content: '后续剧情', timestamp: 1, gameTime: '1:01:10:12:00' }
            ] as any,
            {
                回忆档案: [{ 回合: 1, 记录时间: '1:01:02:06:00' }],
                即时记忆: [],
                短期记忆: [],
                中期记忆: [],
                长期记忆: []
            } as any
        );

        expect(recovered).toBeNull();
    });

    it('缺失游戏初始时间时优先从历史记录中恢复最早 gameTime', () => {
        const recovered = 补全缺失游戏初始时间(
            '',
            [
                { role: 'user', content: '开始', timestamp: 1, gameTime: '342:05:08:23:00' },
                { role: 'assistant', content: '翌日', timestamp: 2, gameTime: '342:05:09:02:30' }
            ] as any,
            undefined
        );

        expect(recovered).toBe('342:05:08:23:00');
    });

    it('缺失游戏初始时间且历史没有可靠时间时可从开局回忆恢复', () => {
        const recovered = 从历史与回忆恢复游戏初始时间(
            [
                { role: 'assistant', content: '没有时间', timestamp: 1 }
            ] as any,
            {
                回忆档案: [
                    { 名称: '【回忆002】', 回合: 2, 记录时间: '1:01:03:08:00' },
                    { 名称: '【回忆001】', 回合: 1, 记录时间: '1:01:02:07:30' }
                ],
                即时记忆: [],
                短期记忆: [],
                中期记忆: [],
                长期记忆: []
            } as any
        );

        expect(recovered).toBe('1:01:02:07:30');
    });

    it('开局回忆存在但没有有效时间时，会继续使用其它回忆档案作为后备候选', () => {
        const recovered = 从历史与回忆恢复游戏初始时间(
            [],
            {
                回忆档案: [
                    { 名称: '【回忆001】', 回合: 1, 记录时间: '未知' },
                    { 名称: '【回忆002】', 回合: 2, 记录时间: '1:01:02:07:30' }
                ],
                即时记忆: [],
                短期记忆: [],
                中期记忆: [],
                长期记忆: []
            } as any
        );

        expect(recovered).toBe('1:01:02:07:30');
    });

    it('缺失游戏初始时间且历史/回忆都无可靠时间时不会补写当前环境时间', () => {
        const recovered = 补全缺失游戏初始时间(
            '',
            [
                { role: 'assistant', content: '缺少 gameTime', timestamp: 1 },
                { role: 'user', content: '继续', timestamp: 2, gameTime: '未知时间' }
            ] as any,
            {
                回忆档案: [{ 名称: '【回忆001】', 回合: 1, 记录时间: '未知' }],
                即时记忆: [],
                短期记忆: [],
                中期记忆: [],
                长期记忆: []
            } as any
        );

        expect(recovered).toBeNull();
    });

    it('当前环境时间已推进到第10天时，缺失初始时间也不会被误补成当前时间', () => {
        const currentEnvTime = '1:01:10:13:30';
        const recovered = 补全缺失游戏初始时间('', [], {
            回忆档案: [],
            即时记忆: [],
            短期记忆: [],
            中期记忆: [],
            长期记忆: []
        } as any);

        expect(recovered).toBeNull();
        expect(recovered).not.toBe(currentEnvTime);
    });
});
