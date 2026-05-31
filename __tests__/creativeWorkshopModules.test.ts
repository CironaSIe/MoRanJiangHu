import { describe, expect, it } from 'vitest';
import { 创意工坊模块分区, 创意工坊模块列表 } from '../data/creativeWorkshopModules';
import { 标准化开局预设方案 } from '../utils/customNewGamePresets';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('creativeWorkshopModules', () => {
    it('规划分区均有当前可用模块', () => {
        const sectionIds = 创意工坊模块分区.map((section) => section.id);
        expect(sectionIds).toEqual(['topic', 'comfy_workflow']);
        for (const sectionId of sectionIds) {
            expect(创意工坊模块列表.some((entry) => entry.type === sectionId)).toBe(true);
        }
    });

    it('每个题材模式都有一个整合后的官方模式包', () => {
        for (const mode of 题材模式顺序) {
            const matches = 创意工坊模块列表.filter((entry) => (
                entry.source === 'builtin'
                && entry.type === 'topic'
                && entry.preset?.openingConfig?.题材模式 === mode
            ));
            expect(matches.length, mode).toBeGreaterThanOrEqual(1);
            expect(matches[0].payload?.packagePart).toBe('mode_package');
            expect(Array.isArray(matches[0].modeWorldbooks), mode).toBe(true);
            expect(matches[0].modeWorldbooks?.[0]?.条目.length, mode).toBeGreaterThanOrEqual(3);
            expect(matches[0].payload?.modeWorldbooks).toEqual(matches[0].modeWorldbooks);
            expect(String(matches[0].payload?.manualWorldPrompt || '')).toBeTruthy();
            expect(String(matches[0].payload?.worldExtraRequirement || '')).toBeTruthy();
            expect(String(matches[0].payload?.manualRealmPrompt || '')).toBeTruthy();
        }
    });

    it('新建存档官方模式包恰好对应六个官方题材模式', () => {
        const entries = 创意工坊模块列表.filter((entry) => entry.source === 'builtin' && entry.contributor === '官方' && entry.type === 'topic');
        expect(entries.length).toBe(题材模式顺序.length);
        expect(new Set(entries.map((entry) => entry.preset?.openingConfig?.题材模式))).toEqual(new Set(题材模式顺序));
    });

    it('迁入的玩家题材按完整模式包提供单个整合模块', () => {
        for (const suiteId of ['community-trails-suite', 'community-crossover-wuxia-suite', 'community-rideress-suite', 'community-pokemon-suite']) {
            const entries = 创意工坊模块列表.filter((entry) => entry.payload?.suiteId === suiteId);
            expect(entries.length, suiteId).toBe(1);
            expect(entries[0].type, suiteId).toBe('topic');
            expect(entries[0].payload?.packagePart, suiteId).toBe('mode_package');
            expect(entries[0].modeWorldbooks?.[0]?.条目.some((entry) => entry.标题 === '世界规则'), suiteId).toBe(true);
            expect(entries[0].modeWorldbooks?.[0]?.条目.some((entry) => entry.标题 === '能力体系'), suiteId).toBe(true);
            expect(entries.every((entry) => entry.formatVersion === 2 && entry.workshopKind === 'standard_module'), suiteId).toBe(true);
        }
    });

    it('末日生化感染规则已整合进末日模式包', () => {
        expect(创意工坊模块列表.some((entry) => entry.id === 'world-rules-zombie-classic')).toBe(false);
        const zombiePackage = 创意工坊模块列表.find((entry) => entry.id === 'mode-package-末日丧尸');
        expect(zombiePackage?.title).toBe('末日模式包');
        expect(zombiePackage?.payload?.worldExtraRequirement).toContain('感染');
        expect(zombiePackage?.payload?.worldExtraRequirement).toContain('营地');
    });

    it('每个模块都提供注入预览', () => {
        for (const entry of 创意工坊模块列表) {
            expect(entry.injectionPreview?.length, entry.id).toBeGreaterThan(0);
        }
    });

    it('可安装模块都能标准化为新建游戏开局预设', () => {
        const installable = 创意工坊模块列表.filter((entry) => entry.preset);
        expect(installable.length).toBeGreaterThanOrEqual(题材模式顺序.length);
        for (const entry of installable) {
            const normalized = 标准化开局预设方案(entry.preset);
            expect(normalized?.id).toBe(entry.preset?.id);
            expect(normalized?.openingConfig?.题材模式).toBeTruthy();
        }
    });

    it('开局配置保留在新建存档流程，不作为创意工坊分区模块', () => {
        expect(创意工坊模块分区.some((section) => section.id === 'opening')).toBe(false);
        expect(创意工坊模块列表.some((entry) => entry.type === 'opening')).toBe(false);
    });
});
