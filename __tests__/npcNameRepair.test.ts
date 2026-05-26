import { describe, expect, it } from 'vitest';
import { 女性人名选择器列表 } from '../utils/femaleNameSelector';
import { 修复旧姓名库误改NPC姓名列表 } from '../utils/npcNameRepair';

describe('legacy NPC name repair', () => {
    it('restores old AI-generated names from aliases when the current name came from the local library', () => {
        const libraryName = 女性人名选择器列表.find((name) => name !== '沈若嫣') || '林婉儿';
        const result = 修复旧姓名库误改NPC姓名列表([
            {
                id: 'npc_1',
                姓名: libraryName,
                性别: '女',
                身份: '山庄二小姐',
                曾用名: ['沈若嫣'],
                记忆: ['沈若嫣曾在青云山庄救过主角。']
            }
        ]);

        expect(result.已修复数量).toBe(1);
        expect(result.列表[0].姓名).toBe('沈若嫣');
        expect(result.列表[0].曾用名).toContain(libraryName);
        expect(result.列表[0].曾用名).not.toContain('沈若嫣');
    });

    it('does not rewrite NPCs without alias evidence', () => {
        const libraryName = 女性人名选择器列表[0];
        const source = [
            {
                id: 'npc_2',
                姓名: libraryName,
                性别: '女',
                身份: '新登场修士'
            }
        ];
        const result = 修复旧姓名库误改NPC姓名列表(source);

        expect(result.已修复数量).toBe(0);
        expect(result.列表).toBe(source);
    });

    it('does not touch male NPCs or placeholder aliases', () => {
        const libraryName = 女性人名选择器列表[0];
        const result = 修复旧姓名库误改NPC姓名列表([
            { 姓名: libraryName, 性别: '男', 曾用名: ['萧问舟'] },
            { 姓名: libraryName, 性别: '女', 曾用名: ['未命名NPC'] }
        ]);

        expect(result.已修复数量).toBe(0);
        expect(result.列表[0].姓名).toBe(libraryName);
        expect(result.列表[1].姓名).toBe(libraryName);
    });
});
