import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LeftPanel from '../components/layout/LeftPanel';
import { 默认游戏设置 } from '../utils/gameSettings';
import { 获取世界观简短货币汇率说明, 获取世界观货币槽位 } from '../utils/currencyDisplay';
import { 规范化模式运行时配置 } from '../utils/modeRuntimeProfile';

const 无限流运行时配置 = 规范化模式运行时配置(undefined, '无限流');

const 无限流开局配置 = {
    配置约束启用: true,
    题材模式: '无限流',
    modeRuntimeProfile: 无限流运行时配置,
    初始关系模板: '独行少系',
    关系侧重: ['利益'],
    开局切入偏好: '风波前夜',
    开局生成门派: true,
    开局生成同门: true,
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
} as any;

const makeInfiniteCharacter = () => ({
    姓名: '林越',
    称号: '候补轮回者',
    境界: '基因锁一阶',
    头像图片URL: '',
    头部当前血量: 30,
    头部最大血量: 30,
    头部状态: '正常',
    胸部当前血量: 45,
    胸部最大血量: 45,
    胸部状态: '正常',
    腹部当前血量: 40,
    腹部最大血量: 40,
    腹部状态: '正常',
    左手当前血量: 20,
    左手最大血量: 20,
    左手状态: '正常',
    右手当前血量: 20,
    右手最大血量: 20,
    右手状态: '正常',
    左腿当前血量: 20,
    左腿最大血量: 20,
    左腿状态: '正常',
    右腿当前血量: 20,
    右腿最大血量: 20,
    右腿状态: '正常',
    当前精力: 88,
    最大精力: 120,
    当前内力: 0,
    最大内力: 0,
    当前饱腹: 0,
    最大饱腹: 0,
    当前口渴: 0,
    最大口渴: 0,
    当前经验: 189,
    升级经验: 650,
    玩家BUFF: [],
    装备: {
        头部: '无',
        胸部: '无',
        背部: '无',
        腰部: '无',
        腿部: '无',
        足部: '无',
        手部: '无',
        主武器: '无',
        副武器: '无',
        暗器: '无',
        坐骑: '无'
    },
    物品列表: [],
    金钱: {
        金元宝: 0,
        银子: 5,
        铜钱: 2000
    }
} as any);

describe('货币显示', () => {
    it('无限流左侧栏货币槽位使用短标签而不是提示词长文', () => {
        const slots = 获取世界观货币槽位(无限流开局配置, makeInfiniteCharacter());
        expect(slots.map((slot) => slot.label)).toEqual(['C级支线剧情', 'D级支线剧情', '奖励点']);
        expect(slots[2].label).not.toContain('所有兑换、强化、修复');
        expect(slots[2].label).not.toContain('不要使用银子');
    });

    it('无限流左侧栏只显示简短换算说明', () => {
        expect(获取世界观简短货币汇率说明(无限流运行时配置, 'infinite')).toBe('1 C级支线剧情 = 100 D级支线剧情 = 100000 奖励点');
    });

    it('无限流角色面板不应渲染货币提示词长文', () => {
        const html = renderToStaticMarkup(
            <LeftPanel
                角色={makeInfiniteCharacter()}
                openingConfig={无限流开局配置}
                gameConfig={{ ...默认游戏设置, 启用修炼体系: false, 启用饱腹口渴系统: false }}
            />
        );
        expect(html).toContain('C级支线剧情');
        expect(html).toContain('D级支线剧情');
        expect(html).toContain('奖励点');
        expect(html).toContain('1 C级支线剧情 = 100 D级支线剧情 = 100000 奖励点');
        expect(html).not.toContain('所有兑换、强化、修复、造人和高级物资交易都通过主神商城结算');
        expect(html).not.toContain('底层统一货币：铜钱=奖励点');
    });
});
