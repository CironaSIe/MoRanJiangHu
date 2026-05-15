import { 天赋结构 } from '../types';

export const 天赋抽卡数量 = 6;
export const 出身抽卡数量 = 4;

const 洗牌 = <T,>(items: T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

type 可抽卡条目 = { 名称: string };

export const 抽取卡牌 = <T extends 可抽卡条目>(候选列表: T[], count: number): T[] => {
    const targetCount = Math.max(0, Math.min(count, 候选列表.length));
    if (targetCount <= 0) return [];
    return 洗牌(候选列表).slice(0, targetCount);
};

export const 补全抽卡名称列表 = <T extends 可抽卡条目>(
    原名称列表: string[],
    候选列表: T[],
    count: number
): string[] => {
    const targetCount = Math.max(0, Math.min(count, 候选列表.length));
    if (targetCount <= 0) return [];

    const 候选名称集合 = new Set(候选列表.map((item) => item.名称));
    const 已保留名称集合 = new Set<string>();
    const 保留名称列表 = 原名称列表.filter((name) => {
        if (!候选名称集合.has(name) || 已保留名称集合.has(name)) return false;
        已保留名称集合.add(name);
        return true;
    });

    if (保留名称列表.length >= targetCount) {
        return 保留名称列表.slice(0, targetCount);
    }

    const 补充列表 = 抽取卡牌(
        候选列表.filter((item) => !已保留名称集合.has(item.名称)),
        targetCount - 保留名称列表.length
    ).map((item) => item.名称);

    return [...保留名称列表, ...补充列表];
};

export const 根据名称映射抽卡 = <T extends 可抽卡条目>(名称列表: string[], 候选列表: T[]): T[] => {
    const map = new Map(候选列表.map((item) => [item.名称, item]));
    return 名称列表
        .map((name) => map.get(name))
        .filter((item): item is T => Boolean(item));
};

export const 抽取天赋卡牌 = (候选列表: 天赋结构[], count = 天赋抽卡数量): 天赋结构[] => 抽取卡牌(候选列表, count);

export const 补全天赋抽卡名称列表 = (
    原名称列表: string[],
    候选列表: 天赋结构[],
    count = 天赋抽卡数量
): string[] => 补全抽卡名称列表(原名称列表, 候选列表, count);

export const 根据名称映射天赋抽卡 = (名称列表: string[], 候选列表: 天赋结构[]): 天赋结构[] => 根据名称映射抽卡(名称列表, 候选列表);
