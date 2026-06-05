import { describe, expect, it } from 'vitest';
import { 数值_修炼体系 } from '../prompts/stats/cultivation';
import { 应用境界体系区块替换, 构建同人运行时提示词包, 获取硬编码仙侠境界名称, 校验境界体系提示词完整性, 解析境界映射值 } from '../prompts/runtime/fandom';
import { 解析境界体系提示词内容 } from '../services/ai/storyTasks';
import { buildRealmPromptFromDraft } from '../utils/newGameDiy';
import { 获取单位境界显示 } from '../utils/realmDisplay';

const 仙侠开局 = { 题材模式: '仙侠' } as any;

describe('xianxia hardcoded realm system', () => {
    it('uses the fixed xianxia mapping instead of AI or wuxia realm names', () => {
        const bundle = 构建同人运行时提示词包({
            openingConfig: 仙侠开局,
            realmPrompt: '【境界映射母板】\n1 => 开脉境一重\n11 => 归元境三重'
        });

        expect(bundle.境界母板补丁).toContain('1 => 炼气一层');
        expect(bundle.境界母板补丁).toContain('11 => 炼气十一层');
        expect(bundle.境界母板补丁).toContain('16 => 筑基圆满');
        expect(bundle.境界母板补丁).toContain('24 => 元婴圆满');
        expect(bundle.境界母板补丁).not.toContain('累计值11');
        expect(bundle.境界母板补丁).not.toContain('开脉境一重');
    });

    it('replaces cultivation protocol blocks with xianxia terms', () => {
        const bundle = 构建同人运行时提示词包({ openingConfig: 仙侠开局 });
        const content = 应用境界体系区块替换(数值_修炼体系.内容, bundle);

        expect(content).toContain('【仙侠修炼体系');
        expect(content).toContain('炼气十一层');
        expect(content).toContain('筑基圆满');
        expect(content).toContain('元婴圆满');
        expect(content).toContain('仙侠硬边界');
        expect(content).not.toContain('开脉境（`1~4`）');
        expect(content).not.toContain('文案从“X境N重”');
    });

    it('maps and displays xianxia realm names from level values', () => {
        expect(获取硬编码仙侠境界名称(3)).toBe('炼气三层');
        expect(解析境界映射值('筑基圆满', { openingConfig: 仙侠开局 })).toBe(16);
        expect(获取单位境界显示({ 境界: '开脉境三重', 境界层级: 3, 灵根: '火灵根' }, '未知', { forceXianxia: true })).toBe('炼气三层');
        expect(获取单位境界显示({ 境界: '未知境界', 境界层级: 13, 灵根: '火灵根' }, '未知', { forceXianxia: true })).toBe('筑基初期');
        expect(获取单位境界显示({ 境界层级: 17, 当前灵力: 1 }, '未知境界', { forceXianxia: true })).toBe('金丹初期');
    });

    it('does not force xianxia realm labels in explicit infinite-flow saves', () => {
        const openingConfig = { 题材模式: '无限流' } as any;
        expect(获取单位境界显示(
            { 境界: '轮回新人', 境界层级: 1, 当前灵力: 20, 最大灵力: 20, 当前神识: 12, 最大神识: 12 },
            '未知境界',
            { openingConfig, forceXianxia: true }
        )).toBe('轮回新人');
        expect(获取单位境界显示(
            { 境界层级: 1, 当前灵力: 20, 最大灵力: 20 },
            '未知境界',
            { openingConfig, forceXianxia: true }
        )).not.toBe('炼气一层');
    });

    it('can read a custom realm prompt by level when the stored realm text is missing', () => {
        const realmPrompt = [
            '【境界映射母板】',
            '1 => 凡骨一阶',
            '2 => 凡骨二阶',
            '3 => 星火初燃'
        ].join('\n');

        expect(获取单位境界显示({ 境界: '未知', 境界层级: 3 }, '未知境界', { realmPrompt })).toBe('星火初燃');
    });

    it('generates a complete validated realm prompt from DIY rows', () => {
        const prompt = buildRealmPromptFromDraft({
            rows: [
                { id: 'r1', name: '炼体', level: 1, power: '凡俗武者', breakthrough: '打熬筋骨', parameters: '气血', description: '低武起点' },
                { id: 'r5', name: '凝气', level: 5, power: '内息成形', breakthrough: '内息贯通', parameters: '内息', description: '可催动内劲' },
                { id: 'r9', name: '筑基', level: 9, power: '根基初成', breakthrough: '道基稳定', parameters: '灵力', description: '修仙入门' }
            ],
            updatedAt: Date.now()
        });

        const validation = 校验境界体系提示词完整性(prompt);
        expect(validation.ok).toBe(true);
        expect(validation.normalizedText).toContain('【境界映射母板】');
        expect(validation.normalizedText).toContain('【九阶命名与能力边界】');
    });

    it('accepts topic hard-boundary aliases and normalizes them for storage', () => {
        const prompt = [
            '【境界映射母板】',
            '1 => 觉醒一阶',
            '2 => 觉醒二阶',
            '3 => 觉醒三阶',
            '4 => 觉醒四阶',
            '5 => 强化一阶',
            '6 => 强化二阶',
            '7 => 强化三阶',
            '8 => 强化四阶',
            '9 => 蜕变一阶',
            '10 => 蜕变二阶',
            '11 => 蜕变三阶',
            '12 => 蜕变四阶',
            '13 => 破限一阶',
            '14 => 破限二阶',
            '15 => 破限三阶',
            '16 => 破限四阶',
            '17 => 领域一阶',
            '18 => 领域二阶',
            '19 => 领域三阶',
            '20 => 领域四阶',
            '21 => 灾变初阶',
            '22 => 灾变中阶',
            '24 => 灾变圆满',
            '27 => 天灾级',
            '33 => 末日级',
            '43 => 终局级',
            '',
            '【九阶命名与能力边界】',
            '- 九阶命名顺序固定：',
            '  - 觉醒（`1~4`）',
            '  - 强化（`5~8`）',
            '  - 蜕变（`9~12`）',
            '  - 破限（`13~16`）',
            '  - 领域（`17~20`）',
            '  - 灾变（`21 / 22 / 24`）',
            '  - 天灾级（`27`）',
            '  - 末日级（`33`）',
            '  - 终局级（`43`）',
            '- 境界能力边界：',
            '  - 所有能力受体能、感染风险、资源与环境限制。',
            '【境界差距口径】',
            '- 小差距：`1~2`；明显差距：`3~5`；压制差距：`6~9`；断层差距：`10+`。',
            '【终点文案】',
            '- 当前境界文案位于本段终点写法：`觉醒四阶 / 强化四阶 / 蜕变四阶 / 破限四阶 / 领域四阶 / 灾变圆满 / 天灾级 / 末日级 / 终局级`',
            '【阶段推进表】',
            '- 觉醒：`1→2→3→4`',
            '- 强化：`5→6→7→8`',
            '- 蜕变：`9→10→11→12`',
            '- 破限：`13→14→15→16`',
            '- 领域：`17→18→19→20`',
            '- 灾变：`21→22→24`',
            '【大境突破表】',
            '- `4→5`',
            '- `8→9`',
            '- `12→13`',
            '- `16→17`',
            '- `20→21`',
            '- `24→27`',
            '- `27→33`',
            '- `33→43`',
            '【题材硬边界】',
            '- 末日能力不能无代价清场，必须受补给、感染、伤势和噪音约束。'
        ].join('\n');

        const validation = 校验境界体系提示词完整性(prompt);
        expect(validation.ok).toBe(true);
        expect(validation.normalizedText).toContain('【武侠硬边界】');
        expect(validation.normalizedText).toContain('末日能力不能无代价清场');
    });

    it('repairs incomplete streamed fandom realm drafts into a complete prompt', () => {
        const prompt = 解析境界体系提示词内容([
            '流式草稿',
            '这是一个偏末世的异能成长体系，低阶靠体能与感知，高阶也不能无代价清场。',
            '【题材硬边界】',
            '- 能力受感染风险、补给、伤势、噪声和同伴协作限制。'
        ].join('\n'));

        const validation = 校验境界体系提示词完整性(prompt);
        expect(validation.ok).toBe(true);
        expect(prompt).toContain('【境界映射母板】');
        expect(prompt).toContain('1 => 开脉境一重');
        expect(prompt).toContain('43 => 天人境');
        expect(prompt).toContain('【武侠硬边界】');
    });
});
