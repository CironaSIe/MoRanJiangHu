import { describe, expect, it } from 'vitest';
import { 女性人名选择器列表, 判断女性姓名来自姓名库, 重命名重复女性NPC列表, 选择唯一女性姓名, 选择女性姓名候选列表 } from '../utils/femaleNameSelector';
import { 构建女性姓名候选提示词 } from '../utils/femaleNameCandidatePrompt';

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

    it('builds a stable 100-name candidate pool for AI to choose from', () => {
        const candidates = 选择女性姓名候选列表({
            usedNames: ['苏婉儿', '林清雪', '端测少侠'],
            seed: '端测少侠|端测州|前厅',
            count: 100
        });
        const prompt = 构建女性姓名候选提示词({
            usedNames: ['苏婉儿', '林清雪', '端测少侠'],
            seed: '端测少侠|端测州|前厅',
            count: 100
        });

        expect(candidates).toHaveLength(100);
        expect(new Set(candidates).size).toBe(100);
        expect(candidates).not.toContain('苏婉儿');
        expect(candidates).not.toContain('林清雪');
        expect(prompt).toContain('必须从下方候选姓名中选择');
        expect(prompt).toContain('禁止自造新的女性姓名');
        expect(prompt).toContain('候选姓名（100个）');
        expect(prompt).toContain(candidates[0]);
        expect(prompt).toContain(candidates[99]);
    });

    it('keeps the first non-template female real name and only repairs duplicates/placeholders', () => {
        const list = 重命名重复女性NPC列表([
            { id: 'a', 姓名: '慕容青鸾', 性别: '女', 身份: '师姐' },
            { id: 'b', 姓名: '慕容青鸾', 性别: '女', 身份: '药堂弟子' },
            { id: 'c', 姓名: '慕容青鸾', 性别: '男', 身份: '男弟子' },
            { id: 'd', 姓名: '角色3', 性别: '女', 身份: '侍女' }
        ]);

        expect(list[0].姓名).toBe('慕容青鸾');
        expect(list[2].姓名).toBe('慕容青鸾');
        expect(list[1].姓名).not.toBe('慕容青鸾');
        expect(list[3].姓名).not.toBe('角色3');
        expect(女性人名选择器列表).toContain(list[1].姓名);
        expect(女性人名选择器列表).toContain(list[3].姓名);
        const femaleNames = [list[0], list[1], list[3]].map((item) => item.姓名);
        expect(new Set(femaleNames).size).toBe(femaleNames.length);
    });

    it('rewrites template-like female names into the selector pool', () => {
        const [npc] = 重命名重复女性NPC列表([
            { id: 'short_given_name', 姓名: '婉儿', 性别: '女', 身份: '贴身侍女' }
        ]);

        expect(npc.姓名).not.toBe('婉儿');
        expect(判断女性姓名来自姓名库(npc.姓名)).toBe(true);
        expect(npc.曾用名).toContain('婉儿');
    });

    it('rewrites main female characters when their name is outside the selector pool', () => {
        const [npc] = 重命名重复女性NPC列表([
            { id: 'main_su_waner', 姓名: '苏婉儿', 性别: '女', 身份: '主要女角色', 是否主要角色: true }
        ]);

        expect(npc.姓名).not.toBe('苏婉儿');
        expect(判断女性姓名来自姓名库(npc.姓名)).toBe(true);
        expect(npc.曾用名).toContain('苏婉儿');
    });
});
