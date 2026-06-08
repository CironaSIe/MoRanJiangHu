import { afterEach, describe, expect, it, vi } from 'vitest';
import { 创建默认拍卖行状态, 清理并补货, 投放事件拍卖品, 保存拍卖行状态 } from '../services/auctionHouse';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('拍卖行默认补货', () => {
    it('新档默认拍卖行状态会生成少量题材基础拍品', () => {
        const state = 创建默认拍卖行状态();

        expect(state.行情列表.length).toBeGreaterThan(0);
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').length).toBeGreaterThan(0);
        expect(state.最近补货时间).toBeGreaterThan(0);
    });

    it('剧情触发时只投放AI/世界事件给出的物品，不再附带系统补货', () => {
        const emptyState = {
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        };
        
        // 模拟剧情触发投放
        const state = 投放事件拍卖品(emptyState, {
            事件名称: '测试事件',
            来源描述: '测试来源',
            物品: {
                名称: '测试物品',
                类型: '武器',
                品质: '上品',
                价值: 1000
            }
        });

        expect(state.拍卖品列表.some((entry) => entry.卖家ID.startsWith('market_'))).toBe(false);
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中')).toHaveLength(1);
        expect(state.拍卖品列表[0].物品.名称).toBe('测试物品');
    });

    it('系统补货入口被调用时会补足基础拍品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true, 最大系统补货数量: 2 });

        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中')).toHaveLength(2);
        expect(state.最近补货时间).toBeGreaterThan(0);
    });
    
    it('系统补货不再生成重复物品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true });

        const itemKeys = state.拍卖品列表
            .filter((entry) => entry.状态 === '上架中')
            .map((entry) => `${entry.物品.名称}|${entry.物品.类型}|${entry.物品.品质}`);
        
        expect(itemKeys.length).toBeGreaterThan(0);
        expect(new Set(itemKeys).size).toBe(itemKeys.length);
    });

    it('系统补货不再生成杂物拍品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true });

        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').every((entry) => entry.物品.类型 !== '杂物' && entry.物品.类型 !== '杂项')).toBe(true);
    });

    it('武侠模式会按武侠补货并过滤事件投放中的仙侠拍品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true, 最大系统补货数量: 20, 目标在售数量: 20, 题材模式: '武侠' });

        const names = state.拍卖品列表.map((entry) => entry.物品.名称).join('|');
        expect(names).toMatch(/金疮药|精铁短刀|软皮护腕|基础吐纳手札/);
        expect(names).not.toMatch(/储物戒|飞剑|灵晶/);

        const blocked = 投放事件拍卖品(state, {
            事件名称: '武侠市集',
            题材模式: '武侠',
            物品: {
                名称: '储物戒',
                类型: '饰品',
                品质: '极品',
                价值: 42000
            }
        });
        expect(blocked.拍卖品列表.some((entry) => entry.物品.名称 === '储物戒')).toBe(false);
    });

    it('现代和末日模式使用题材市场物品池，并仍过滤古风仙侠事件拍品', () => {
        const modern = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true, 最大系统补货数量: 8, 目标在售数量: 8, 题材模式: '现代都市' });

        expect(modern.拍卖品列表.length).toBeGreaterThan(0);
        expect(JSON.stringify(modern.拍卖品列表)).toMatch(/急救包|工具钳|防割手套|录音笔/);

        const apocalypse = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true, 最大系统补货数量: 8, 目标在售数量: 8, 题材模式: '末日丧尸' });

        expect(apocalypse.拍卖品列表.length).toBeGreaterThan(0);
        expect(JSON.stringify(apocalypse.拍卖品列表)).toMatch(/净水片|防刺背心|手摇电筒|罐头补给包/);

        const blocked = 投放事件拍卖品(apocalypse, {
            事件名称: '营地黑市',
            题材模式: '末日丧尸',
            物品: {
                名称: '储物戒',
                类型: '饰品',
                品质: '极品',
                价值: 42000
            }
        });
        expect(blocked.拍卖品列表.some((entry) => entry.物品.名称 === '储物戒')).toBe(false);
    });

    it('localStorage 配额不足时不会打断应用加载', () => {
        const setItem = vi
            .fn()
            .mockImplementationOnce(() => {
                throw new DOMException('quota exceeded', 'QuotaExceededError');
            })
            .mockImplementationOnce(() => undefined);
        const removeItem = vi.fn();
        const localStorageMock = {
            length: 2,
            key: vi.fn((index: number) => [
                'moranjianghu_auction_house_v2:old',
                'moranjianghu_auction_house_v2:current',
            ][index] || null),
            setItem,
            removeItem,
        };
        vi.stubGlobal('window', { localStorage: localStorageMock });

        expect(() => 保存拍卖行状态({
            拍卖品列表: Array.from({ length: 120 }, (_, index) => ({
                ID: `auction_${index}`,
                物品: { ID: `item_${index}`, 名称: `测试物品${index}`, 类型: '武器', 品质: '上品', 价值: 1000 },
                卖家名称: '测试卖家',
                卖家ID: 'seller',
                起拍价: 100,
                一口价: 200,
                当前价格: 100,
                标价货币: '铜钱',
                状态: index % 2 === 0 ? '上架中' : '已下架',
                上架时间: index,
                过期时间: Date.now() + 1000,
                市场标签: ['测试'],
                来源描述: '测试',
            })),
            交易记录: Array.from({ length: 120 }, (_, index) => ({
                ID: `record_${index}`,
                类型: '事件投放',
                标题: `记录${index}`,
                描述: '测试',
                时间: index,
            })),
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0,
        }, 'current')).not.toThrow();

        expect(removeItem).toHaveBeenCalledWith('moranjianghu_auction_house_v2:old');
        expect(setItem).toHaveBeenCalledTimes(2);
    });
});
