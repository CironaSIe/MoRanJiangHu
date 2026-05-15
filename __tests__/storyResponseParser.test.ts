import { describe, expect, it } from 'vitest';
import { parseStoryRawText } from '../services/ai/storyResponseParser';
import { 规范化可渲染对白日志 } from '../utils/dialogueLogNormalizer';

describe('storyResponseParser', () => {
    it('does not fold variable plan or short memory into body fallback', () => {
        const parsed = parseStoryRawText([
            '<变量规划>',
            '角色状态需要初始化。',
            '</变量规划>',
            '正文：',
            '【旁白】忠伯推开柴门，向院中望去。',
            '短期记忆：',
            '忠伯在院中现身。',
            '命令：',
            'set 环境.具体地点 = "柴门小院"'
        ].join('\n'), { enableTagRepair: false });

        expect(parsed.logs).toEqual([
            { sender: '旁白', text: '忠伯推开柴门，向院中望去。' }
        ]);
        expect(parsed.t_var_plan).toBe('角色状态需要初始化。');
        expect(parsed.shortTerm).toBe('忠伯在院中现身。');
    });

    it('cuts residual protocol blocks out of a malformed body block', () => {
        const parsed = parseStoryRawText([
            '<正文>',
            '【旁白】忠伯推开柴门，向院中望去。',
            '短期记忆：',
            '忠伯在院中现身。',
            '变量规划：',
            '环境地点发生变化。',
            '</正文>',
            '<短期记忆>忠伯在院中现身。</短期记忆>'
        ].join('\n'));

        expect(parsed.logs).toEqual([
            { sender: '旁白', text: '忠伯推开柴门，向院中望去。' }
        ]);
        expect(parsed.shortTerm).toBe('忠伯在院中现身。');
    });

    it('removes leaked opening initialization tables from rendered body', () => {
        const parsed = parseStoryRawText([
            '<正文>',
            '### 1. 角色初始化',
            '- **基础信息**：姓名“杨培强”，性别“男”。',
            '- **天赋列表**（完整承接建档）：',
            '- [0] 名称：福星高照｜描述：命数偏吉。',
            '### 4. 门派与任务初始化',
            '- **玩家门派**：ID: none, 名称: 无门无派。',
            '- **任务列表**：',
            '- [Task001] 晨间问安：当前状态“进行中”。',
            '【旁白】窗纸被晨光照得微亮，院外传来木桶落地的轻响。',
            '</正文>',
            '<短期记忆>主角在晨间醒来。</短期记忆>'
        ].join('\n'));

        expect(parsed.logs).toEqual([
            { sender: '旁白', text: '窗纸被晨光照得微亮，院外传来木桶落地的轻响。' }
        ]);
    });

    it('removes colon-suffixed opening initialization lists from body tail', () => {
        const parsed = parseStoryRawText([
            '<正文>',
            '【旁白】杨培强在自家后院晨练结束，杨青儿送来温水。林婉清随林家长辈登门拜访。',
            '1. 角色初始化：',
            '- 姓名：杨培强｜境界：开脉境三重（累计境界值：3）｜内力：30/30｜经验：150/300',
            '- 六维：力量 5 / 敏捷 5 / 体质 5 / 根骨 5 / 悟性 5 / 福源 5',
            '- 装备：[ID:Item001] 青色练功服（穿戴：胸部/腹部/四肢）',
            '2. 环境初始化：',
            '- 时间：0001:01:01:06:15（1年1月1日卯时一刻）',
            '- 地点：中州 -> 杨家堡 -> 杨府 -> 后院演武场',
            '3. 社交初始化：',
            '- [NPC001] 杨青儿：16岁，杨培强亲妹，身份：杨府小姐。',
            '4. 门派与任务初始化：',
            '- 玩家门派：[ID:Org001] 杨家堡。职位：少主/长子。',
            '- 任务列表：[ID:Task001] 前厅探秘。状态：进行中。',
            '</正文>',
            '<短期记忆>林家登门，杨培强准备去前厅。</短期记忆>'
        ].join('\n'));

        expect(parsed.logs).toEqual([
            { sender: '旁白', text: '杨培强在自家后院晨练结束，杨青儿送来温水。林婉清随林家长辈登门拜访。' }
        ]);
    });

    it('splits quoted dialogue embedded in narrator lines into character logs', () => {
        const parsed = parseStoryRawText([
            '<正文>',
            '【旁白】晨风卷过演武场，杨镇远负手站在石阶前，沉声道：“剑势散了，脚下也浮。再走一遍。”',
            '【旁白】杨培强收剑回身，说道：“侄儿明白。”杨镇远点了点头，目光仍落在剑尖上。',
            '</正文>',
            '<短期记忆>杨镇远在演武场考校杨培强剑法。</短期记忆>'
        ].join('\n'));

        expect(parsed.logs).toEqual([
            { sender: '旁白', text: '晨风卷过演武场，杨镇远负手站在石阶前' },
            { sender: '杨镇远', text: '剑势散了，脚下也浮。再走一遍。' },
            { sender: '旁白', text: '杨培强收剑回身' },
            { sender: '杨培强', text: '侄儿明白。' },
            { sender: '旁白', text: '杨镇远点了点头，目光仍落在剑尖上。' }
        ]);
    });

    it('keeps only fully quoted single-speaker text as character bubbles for rendering', () => {
        const rendered = 规范化可渲染对白日志([
            { sender: '杨培强', text: '“弟子，领命。”\n\n风，渐渐停了。\n\n铅灰色的云层开始散去。' },
            { sender: '众人齐声', text: '“遵命！”' },
            { sender: '杨镇远', text: '风声穿过长廊。' },
            { sender: '杨青儿', text: '“哥，小心些。”' }
        ]);

        expect(rendered).toEqual([
            { sender: '杨培强', text: '“弟子，领命。”' },
            { sender: '旁白', text: '风，渐渐停了。\n\n铅灰色的云层开始散去。\n“遵命！”\n风声穿过长廊。' },
            { sender: '杨青儿', text: '“哥，小心些。”' }
        ]);
    });
});
