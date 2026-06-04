import { describe, expect, it } from 'vitest';

import { 获取境界配置, 获取境界名称列表, 获取境界层级 } from '../utils/realmConfig';

describe('realmConfig topic realm mapping', () => {
    it('maps xianxia full realm names to exact cumulative levels', () => {
        const cfg = 获取境界配置('仙侠' as any);

        expect(获取境界层级('练气五层', cfg)).toBe(5);
        expect(获取境界层级('筑基中期', cfg)).toBe(14);
        expect(获取境界层级('筑基圆满', cfg)).toBe(16);
        expect(获取境界层级('元婴后期', cfg)).toBe(23);
    });

    it('maps non-wuxia stage and tier names without collapsing to stage start', () => {
        const cfg = 获取境界配置('末日丧尸' as any);

        expect(获取境界层级('适应者二阶', cfg)).toBe(6);
        expect(获取境界层级('战术专家四阶', cfg)).toBe(16);
        expect(获取境界层级('灾区王牌中阶', cfg)).toBe(22);
    });

    it('returns full realm names for callers that need display candidates', () => {
        const cfg = 获取境界配置('仙侠' as any);

        expect(获取境界名称列表(cfg)).toContain('练气五层');
        expect(获取境界名称列表(cfg)).toContain('筑基圆满');
    });
});
