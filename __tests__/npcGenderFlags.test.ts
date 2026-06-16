import { describe, expect, it } from 'vitest';
import { NPC是否扶她, NPC是否男性或男娘 } from '../utils/npcGenderFlags';

describe('npcGenderFlags', () => {
    it('does not treat negative futanari notes as true', () => {
        const npc = { 性别: '男', 扶她设定: 'false', 男娘设定: '无' };

        expect(NPC是否扶她(npc)).toBe(false);
        expect(NPC是否男性或男娘(npc)).toBe(true);
    });

    it('recognizes explicit futanari identity from gender or affirmative notes', () => {
        expect(NPC是否扶她({ 性别: '扶她' })).toBe(true);
        expect(NPC是否扶她({ 性别: '男', 扶她设定: '扶她身份与身体结构明确。' })).toBe(true);
        expect(NPC是否男性或男娘({ 性别: '女', 扶她设定: '扶她身份与身体结构明确。' })).toBe(true);
    });
});
