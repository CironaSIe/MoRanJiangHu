import { describe, expect, it } from 'vitest';
import { 识别TXT章节标题行 } from '../services/novelStructureHeuristics';
import { 从原始文本提取章节 } from '../services/novelDecompositionPipeline';
import { 修复开局伙伴社交列表 } from '../utils/openingCompanion';
import { 构建中断流式草稿历史 } from '../hooks/useGame/sendWorkflow';

const 创建伙伴 = (姓名: string, 关系: string) => ({
    enabled: true,
    姓名,
    性别: '女',
    年龄: 18,
    出生月: 1,
    出生日: 1,
    外貌: '眉眼清亮。',
    性格: '可靠。',
    属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
    背景名称: '同行者',
    背景描述: '开局同行。',
    背景效果: '保持同行关系。',
    天赋列表: [],
    关系,
    备注: ''
});

describe('小说拆章与开局稳定性回归', () => {
    it('识别第1章点号标题并按章节拆分', () => {
        expect(识别TXT章节标题行('第1章.你已经死了！')?.层级).toBe('chapter');
        expect(识别TXT章节标题行('Chapter 2. The Gate')?.层级).toBe('chapter');

        const chapters = 从原始文本提取章节({
            id: 'dataset_test',
            标题: '测试小说',
            作品名: '测试小说',
            原始文本: [
                '第1章.你已经死了！',
                '风从破窗里灌进来，桌上的纸页被掀得猎猎作响。主角睁开眼时，耳边还残留着陌生人的惊呼，他很快意识到自己并不在熟悉的房间。',
                '他扶着墙站稳，确认门外脚步声越来越近，于是把散落的线索一件件收好。这个开端足够像正文，而不是目录。',
                '',
                '第2章：醒来之后',
                '天色已经亮了半边，街巷里有人压低声音谈论昨夜的火光。主角沿着青石路向前走，发现每个人看他的眼神都带着隐约的戒备。',
                '他没有立刻解释，只把昨夜记下的名字重新默念一遍。新的线索让局势变得更清楚，也把下一段行动推到了面前。'
            ].join('\n'),
            章节列表: [],
            分段列表: [],
            createdAt: 1,
            updatedAt: 1
        } as any);

        expect(chapters).toHaveLength(2);
        expect(chapters[0].标题).toContain('你已经死了');
        expect(chapters[1].标题).toContain('醒来之后');
    });

    it('开局伙伴列表会全部补齐为队友 NPC', () => {
        const fixed = 修复开局伙伴社交列表([], {
            题材模式: '武侠',
            初始关系模板: '青梅旧识',
            关系侧重: ['友情'],
            开局切入偏好: '日常低压',
            开局生成门派: true,
            开局生成同门: true,
            允许生成性别: ['男', '女', '男娘', '扶她'],
            初始伙伴列表: [创建伙伴('林清澜', '同门'), 创建伙伴('俞月荷', '旧识')],
            同人融合: {
                enabled: false,
                作品名: '',
                来源类型: '小说',
                融合强度: '轻度映射',
                保留原著角色: false,
                启用角色替换: false,
                替换目标角色名: '',
                附加替换角色名列表: [],
                附加角色替换规则列表: [],
                启用附加小说: false,
                附加小说数据集ID: ''
            }
        } as any, { 姓名: '主角', 当前位置: '山门' } as any);

        expect(fixed.map((npc) => npc.姓名)).toEqual(['林清澜', '俞月荷']);
        expect(fixed.every((npc) => npc.是否队友 === true && npc.是否主要角色 === true)).toBe(true);
    });

    it('流式主剧情失败时保留已输出正文草稿', () => {
        const history = 构建中断流式草稿历史({
            baseHistory: [{ role: 'user', content: '继续', timestamp: 1 } as any],
            draftText: '【旁白】这段正文已经流式输出，不应被失败吞掉。',
            draftTimestamp: 2,
            gameTime: '辰时',
            summary: '乾坤推演空闲超时'
        });

        expect(history).not.toBeNull();
        expect(history?.[1].role).toBe('assistant');
        expect(history?.[1].content).toContain('不应被失败吞掉');
        expect(history?.[2].content).toContain('已保留');
    });
});
