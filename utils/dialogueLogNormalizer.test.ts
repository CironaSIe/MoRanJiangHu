import { describe, expect, it } from 'vitest';

import { 规范化可渲染对白日志 } from './dialogueLogNormalizer';

describe('规范化可渲染对白日志', () => {
    it('保留重复出现的显式角色标签，不把第二句降级为旁白', () => {
        const logs = 规范化可渲染对白日志([
            { sender: '旁白', text: '霍青鸾朝沈砚清望过去。他在等她说完。' },
            { sender: '霍青鸾', text: '"我与沈砚清，自十六岁圆房起，结为夫妇。十四载。"' },
            { sender: '霍青鸾', text: '自今日起，解。' },
            { sender: '旁白', text: '这一个解字砸在议事堂青砖地上。' }
        ]);

        expect(logs).toEqual([
            { sender: '旁白', text: '霍青鸾朝沈砚清望过去。他在等她说完。' },
            { sender: '霍青鸾', text: '"我与沈砚清，自十六岁圆房起，结为夫妇。十四载。"\n自今日起，解。' },
            { sender: '旁白', text: '这一个解字砸在议事堂青砖地上。' }
        ]);
    });
});
