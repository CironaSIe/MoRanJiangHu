import { afterEach, describe, expect, it, vi } from 'vitest';
import { 创建默认拍卖行状态, 清理并补货, 投放事件拍卖品, 保存拍卖行状态 } from '../services/auctionHouse';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('拍卖行默认补货', () => {
    it('新档默认拍卖行状态不自动生成系统拍品', () => {
        const state = 创建默认拍卖行状态();

        // 新档应该没有系统拍品，等待剧情触发
        expect(state.行情列表.length).toBeGreaterThan(0); // 行情仍然生成
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').length).toBe(0); // 没有拍品
        expect(state.最近补货时间).toBe(0); // 没有补货
    });

    it('剧情触发时允许系统补货', () => {
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

        // 剧情触发后应该有少量市场滚动补货
        expect(state.拍卖品列表.some((entry) => entry.卖家ID.startsWith('market_'))).toBe(true);
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').length).toBeGreaterThan(0);
    });

    it('系统补货每次只滚入少量拍品，不一次铺满', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true, 最大系统补货数量: 2 });

        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中')).toHaveLength(2);
    });
    
    it('系统补货时避免重复物品', () => {
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
        
        // 检查没有完全重复的物品
        const uniqueKeys = new Set(itemKeys);
        expect(uniqueKeys.size).toBe(itemKeys.length);
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
