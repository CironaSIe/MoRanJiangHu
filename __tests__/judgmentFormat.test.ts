import { describe, expect, it } from 'vitest';
import { 拆分判定日志与后续正文, 根据差额校正判定结果, 提取判定日志前缀, 是否判定日志文本 } from '../utils/judgmentFormat';

describe('judgment log detection', () => {
    it('recognizes custom bracketed judgment categories with score and result fields', () => {
        const line = '【参悟】温习青木诀｜触发对象 玩家:杨培强｜判定值 14/难度 8｜基础 B(+10,悟性与根骨资质)｜环境 E(+2,静室与凝神香辅助)｜状态 S(+1,精力饱满)｜幸运 L(+1)｜结果=成功';

        expect(是否判定日志文本(line)).toBe(true);
        expect(提取判定日志前缀(line)).toBe('【参悟】');
    });

    it('does not treat ordinary bracketed narration as a judgment card', () => {
        expect(是否判定日志文本('【青木诀】书页泛起淡淡青光，屋内香烟袅袅。')).toBe(false);
    });

    it('splits leaked narration after a judgment result', () => {
        const line = '[洞察]查阅账目漏洞｜触发对象 玩家:杨培强｜判定值 11/难度 8｜结果=成功 杨培强翻开账册。';

        expect(拆分判定日志与后续正文(line)).toEqual({
            judgmentText: '[洞察]查阅账目漏洞｜触发对象 玩家:杨培强｜判定值 11/难度 8｜结果=成功',
            trailingBody: '杨培强翻开账册。'
        });
    });
});

describe('judgment result correction', () => {
    it('uses numeric delta over inconsistent result text', () => {
        expect(根据差额校正判定结果('大成功', -8)).toBe('失败');
        expect(根据差额校正判定结果('成功', -21)).toBe('大失败');
        expect(根据差额校正判定结果('失败', 20)).toBe('大成功');
    });

    it('preserves combat-specific result words', () => {
        expect(根据差额校正判定结果('格挡', -8)).toBe('格挡');
    });
});
