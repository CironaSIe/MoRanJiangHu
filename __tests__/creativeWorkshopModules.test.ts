import { describe, expect, it } from 'vitest';
import { 创意工坊模块分区, 创意工坊模块列表 } from '../data/creativeWorkshopModules';
import { 标准化开局预设方案 } from '../utils/customNewGamePresets';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('creativeWorkshopModules', () => {
    it('规划分区均有当前可用模块', () => {
        const sectionIds = 创意工坊模块分区.map((section) => section.id);
        expect(sectionIds).toEqual(['topic', 'world_rules', 'opening', 'ability', 'comfy_workflow']);
        for (const sectionId of sectionIds) {
            expect(创意工坊模块列表.some((entry) => entry.type === sectionId)).toBe(true);
        }
    });

    it('每个题材模式都有四类官方预设模块', () => {
        for (const mode of 题材模式顺序) {
            for (const type of ['topic', 'world_rules', 'opening', 'ability'] as const) {
                const matches = 创意工坊模块列表.filter((entry) => (
                    entry.source === 'builtin'
                    && entry.type === type
                    && entry.preset?.openingConfig?.题材模式 === mode
                ));
                expect(matches.length, `${mode}/${type}`).toBeGreaterThanOrEqual(1);
            }
        }
    });

    it('每个分区恰好对应六个官方题材模式模块', () => {
        for (const type of ['topic', 'world_rules', 'opening', 'ability'] as const) {
            const entries = 创意工坊模块列表.filter((entry) => entry.source === 'builtin' && entry.type === type);
            expect(entries.length, type).toBe(题材模式顺序.length);
            expect(new Set(entries.map((entry) => entry.preset?.openingConfig?.题材模式))).toEqual(new Set(题材模式顺序));
        }
    });

    it('末日生化感染规则已整合进末日世界规则模块', () => {
        expect(创意工坊模块列表.some((entry) => entry.id === 'world-rules-zombie-classic')).toBe(false);
        const zombieWorldRules = 创意工坊模块列表.find((entry) => entry.id === 'world-rules-末日丧尸');
        expect(zombieWorldRules?.title).toBe('末日丧尸世界规则');
        expect(zombieWorldRules?.injectionPreview.join('\n')).toContain('感染机制');
        expect(zombieWorldRules?.injectionPreview.join('\n')).toContain('营地规则');
    });

    it('每个模块都提供注入预览', () => {
        for (const entry of 创意工坊模块列表) {
            expect(entry.injectionPreview?.length, entry.id).toBeGreaterThan(0);
        }
    });

    it('可安装模块都能标准化为新建游戏开局预设', () => {
        const installable = 创意工坊模块列表.filter((entry) => entry.preset);
        expect(installable.length).toBeGreaterThanOrEqual(题材模式顺序.length * 4);
        for (const entry of installable) {
            const normalized = 标准化开局预设方案(entry.preset);
            expect(normalized?.id).toBe(entry.preset?.id);
            expect(normalized?.openingConfig?.题材模式).toBeTruthy();
        }
    });
});
