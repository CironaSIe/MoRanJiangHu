import { describe, expect, it } from 'vitest';
import { 创意工坊模块分区, 创意工坊模块列表 } from '../data/creativeWorkshopModules';
import { 标准化开局预设方案 } from '../utils/customNewGamePresets';

describe('creativeWorkshopModules', () => {
    it('规划分区均有当前可用模块', () => {
        const sectionIds = 创意工坊模块分区.map((section) => section.id);
        expect(sectionIds).toEqual(['topic', 'world_rules', 'opening', 'ability']);
        for (const sectionId of sectionIds) {
            expect(创意工坊模块列表.some((entry) => entry.type === sectionId)).toBe(true);
        }
    });

    it('可安装模块都能标准化为新建游戏开局预设', () => {
        const installable = 创意工坊模块列表.filter((entry) => entry.preset);
        expect(installable.length).toBeGreaterThanOrEqual(4);
        for (const entry of installable) {
            const normalized = 标准化开局预设方案(entry.preset);
            expect(normalized?.id).toBe(entry.preset?.id);
            expect(normalized?.openingConfig?.题材模式).toBeTruthy();
        }
    });
});
