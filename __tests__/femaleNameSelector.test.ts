import { describe, expect, it } from 'vitest';
import { 女性人名选择器列表, 判断女性姓名来自姓名库, 重命名重复女性NPC列表, 选择唯一女性姓名 } from '../utils/femaleNameSelector';

describe('female name selector', () => {
    it('loads the user-provided female name selector as a unique pool', () => {
        expect(女性人名选择器列表.length).toBeGreaterThan(9000);
        expect(new Set(女性人名选择器列表).size).toBe(女性人名选择器列表.length);
    });

    it('chooses unused names from the selector', () => {
        const selected = 选择唯一女性姓名({
            usedNames: 女性人名选择器列表.slice(0, 20),
            seed: 'same-seed'
        });

        expect(女性人名选择器列表).toContain(selected);
        expect(女性人名选择器列表.slice(0, 20)).not.toContain(selected);
    });

    it('keeps the first stable female real name and only repairs duplicates/placeholders', () => {
        const list = 重命名重复女性NPC列表([
            { id: 'a', 姓名: '林清雪', 性别: '女', 身份: '师姐' },
            { id: 'b', 姓名: '林清雪', 性别: '女', 身份: '药堂弟子' },
            { id: 'c', 姓名: '林清雪', 性别: '男', 身份: '男弟子' },
            { id: 'd', 姓名: '角色3', 性别: '女', 身份: '侍女' }
        ]);

        expect(list[0].姓名).toBe('林清雪');
        expect(list[2].姓名).toBe('林清雪');
        expect(list[1].姓名).not.toBe('林清雪');
        expect(list[3].姓名).not.toBe('角色3');
        expect(女性人名选择器列表).toContain(list[1].姓名);
        expect(女性人名选择器列表).toContain(list[3].姓名);
        const femaleNames = [list[0], list[1], list[3]].map((item) => item.姓名);
        expect(new Set(femaleNames).size).toBe(femaleNames.length);
    });

    it('does not rewrite an existing stable female name just because it is outside the pool', () => {
        const [npc] = 重命名重复女性NPC列表([
            { id: 'short_given_name', 姓名: '婉儿', 性别: '女', 身份: '贴身侍女' }
        ]);

        expect(npc.姓名).toBe('婉儿');
        expect(判断女性姓名来自姓名库(npc.姓名)).toBe(false);
        expect(npc.曾用名).toBeUndefined();
    });
});
