import { describe, expect, it } from 'vitest';
import { 计算历史游玩回合数, 读取存档游玩回合数 } from '../utils/saveTurn';

describe('存档回合数统计', () => {
    it('只统计真实游玩回合，不把系统消息和变量规划消息算进显示回合', () => {
        const history: any[] = [
            { role: 'user', content: '开局' },
            { role: 'assistant', structuredResponse: { logs: [{ sender: '旁白', text: '第一回合' }] } },
            { role: 'system', content: '[世界演变] 更新' },
            { role: 'assistant', content: '规划分析', structuredResponse: undefined },
            { role: 'user', content: '继续' },
            { role: 'assistant', structuredResponse: { logs: [{ sender: '旁白', text: '第二回合' }] } },
            { role: 'system', content: '[规划分析] 更新' },
            { role: 'user', content: '继续' },
            { role: 'assistant', structuredResponse: { logs: [{ sender: '旁白', text: '第三回合' }] } }
        ];

        expect(history).toHaveLength(9);
        expect(计算历史游玩回合数(history)).toBe(3);
        expect(读取存档游玩回合数({ 历史记录: history } as any)).toBe(3);
    });

    it('优先使用存档元数据里的回合数，兼容摘要列表不带完整历史', () => {
        expect(读取存档游玩回合数({ 元数据: { 游戏回合数: 4 }, 历史记录: [] } as any)).toBe(4);
    });

    it('完整存档有历史时以真实正文回合为准，避免把旧元数据误显示为历史条数', () => {
        const history: any[] = [
            { role: 'assistant', structuredResponse: { logs: [] } },
            { role: 'system', content: '[变量生成] 更新' },
            { role: 'assistant', content: '规划分析' },
            { role: 'assistant', structuredResponse: { logs: [] } },
            { role: 'system', content: '[世界推演] 更新' },
            { role: 'assistant', structuredResponse: { logs: [] } }
        ];
        expect(读取存档游玩回合数({ 元数据: { 游戏回合数: 8 }, 历史记录: history } as any)).toBe(3);
    });
});
