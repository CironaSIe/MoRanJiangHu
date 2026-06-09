import { describe, expect, it } from 'vitest';
import { 构建词组转化性别硬约束 } from '../hooks/useGame/npcImageWorkflow';

describe('npc image workflow age constraints', () => {
    it('does not force cultivation longevity characters to look old', async () => {
        const constraint = 构建词组转化性别硬约束('女', 1000, {
            性别: '女',
            年龄: 1000,
            身份: '元婴女修',
            境界: '元婴境',
            简介: '修行多年，驻颜有术，看起来依旧年轻。',
            外貌: '容貌清艳，神情沉静。'
        });

        expect(constraint).toContain('不要机械按真实岁数画成老人');
        expect(constraint).toContain('若正文或设定明确驻颜过头、幼态外观，也允许保留这种表现');
        expect(constraint).not.toContain('不得幼化');
        expect(constraint).not.toContain('禁止画成明显更老的成年人');
    });

    it('uses four-base-gender constraints for femboy characters', async () => {
        const constraint = 构建词组转化性别硬约束('男娘', 22, {
            性别: '男娘',
            年龄: 22,
            身份: '戏班名伶',
            简介: '男身女相，台上常作闺秀装束。'
        });

        expect(constraint).toContain('输入资料中的性别是“男娘”');
        expect(constraint).toContain('不要改成普通壮汉');
        expect(constraint).toContain('femboy');
        expect(constraint).toContain('extremely feminine face');
        expect(constraint).toContain('youthful appearance');
    });

    it('keeps futanari defaults youthful and female-led', () => {
        const constraint = 构建词组转化性别硬约束('扶她', 28, {
            性别: '扶她',
            年龄: 28,
            身份: '女将军',
            简介: '英气逼人，却仍以美貌示人。'
        });

        expect(constraint).toContain('futanari');
        expect(constraint).toContain('youthful beautiful appearance');
        expect(constraint).toContain('heroic beauty');
        expect(constraint).toContain('女性主体');
        expect(constraint).toContain('日常默认不应主动露出');
    });
});
