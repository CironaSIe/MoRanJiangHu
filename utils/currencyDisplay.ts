import type { OpeningConfig, 角色数据结构 } from '../types';
import type { 角色金钱 } from '../models/character';
import { 推断单位仙侠 } from './realmDisplay';
import { 获取题材模式配置, 题材是否仙侠 } from './topicModeProfiles';
import type { ModeRuntimeProfile } from '../models/system';

export type 货币显示模式 = 'wuxia' | 'xianxia' | 'fantasy' | 'urban' | 'modern' | 'apocalypse' | 'infinite';
export type 货币层级键 = '上层货币' | '中层货币' | '底层货币';
export type 兼容货币键 = 货币层级键 | '金元宝' | '银子' | '铜钱';

export const 仙侠货币汇率说明 = '1 上品灵石 = 100 中品灵石；1 中品灵石 = 1000 下品灵石。';

export type 货币槽位配置 = {
    key: 货币层级键;
    label: string;
    fullLabel: string;
};

export type 世界观货币卡片信息 = {
    title: string;
    summary: string;
    exchangeHint: string;
};

type 货币层级配置 = {
    key: 货币层级键;
    label: string;
    fullLabel: string;
    multiplier: number;
};

const 货币层级顺序: 货币层级键[] = ['上层货币', '中层货币', '底层货币'];
const 旧货币键映射: Record<兼容货币键, 货币层级键> = {
    上层货币: '上层货币',
    中层货币: '中层货币',
    底层货币: '底层货币',
    金元宝: '上层货币',
    银子: '中层货币',
    铜钱: '底层货币'
};

const 默认旧别名标签: Record<货币层级键, string> = {
    上层货币: '金元宝',
    中层货币: '银子',
    底层货币: '铜钱'
};

const 读取可用于UI的短货币文案 = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (!text || text.length > 24) return '';
    if (/底层统一货币|不要使用|通过.+结算|；|。/u.test(text)) return '';
    return text;
};

const 读取正整数汇率 = (value: unknown, fallback: number): number => {
    const numeric = Math.floor(Number(value));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
};

const 归一化货币键 = (key: 兼容货币键): 货币层级键 => 旧货币键映射[key] || '底层货币';

const 读取货币数值 = (money: Partial<角色金钱> | null | undefined, key: 货币层级键): number => {
    const direct = Number(money?.[key]);
    if (Number.isFinite(direct)) return Math.max(0, Math.trunc(direct));
    const legacyKey = 默认旧别名标签[key] as '金元宝' | '银子' | '铜钱';
    const legacy = Number(money?.[legacyKey]);
    return Number.isFinite(legacy) ? Math.max(0, Math.trunc(legacy)) : 0;
};

const 获取默认货币层级配置 = (mode: 货币显示模式): {
    upperName: string;
    middleName: string;
    lowerName: string;
    upperFullName: string;
    middleFullName: string;
    lowerFullName: string;
    upperToMiddleRate: number;
    middleToLowerRate: number;
} => {
    if (mode === 'xianxia') {
        return {
            upperName: '上品灵石',
            middleName: '中品灵石',
            lowerName: '下品灵石',
            upperFullName: '上品灵石',
            middleFullName: '中品灵石',
            lowerFullName: '下品灵石',
            upperToMiddleRate: 100,
            middleToLowerRate: 1000
        };
    }
    if (mode === 'fantasy') {
        return {
            upperName: '金币',
            middleName: '银币',
            lowerName: '铜币',
            upperFullName: '金币',
            middleFullName: '银币',
            lowerFullName: '铜币',
            upperToMiddleRate: 100,
            middleToLowerRate: 100
        };
    }
    if (mode === 'urban' || mode === 'modern') {
        return {
            upperName: '十万元账户',
            middleName: '千元账户',
            lowerName: '信用点',
            upperFullName: '十万元账户',
            middleFullName: '千元账户',
            lowerFullName: '信用点',
            upperToMiddleRate: 100,
            middleToLowerRate: 1000
        };
    }
    if (mode === 'apocalypse') {
        return {
            upperName: '安全通行牌',
            middleName: '物资票',
            lowerName: '营地信用点',
            upperFullName: '安全通行牌',
            middleFullName: '物资票',
            lowerFullName: '营地信用点',
            upperToMiddleRate: 100,
            middleToLowerRate: 1000
        };
    }
    if (mode === 'infinite') {
        return {
            upperName: 'C级支线剧情',
            middleName: 'D级支线剧情',
            lowerName: '奖励点',
            upperFullName: 'C级支线剧情',
            middleFullName: 'D级支线剧情',
            lowerFullName: '奖励点',
            upperToMiddleRate: 100,
            middleToLowerRate: 1000
        };
    }
    return {
        upperName: '元宝',
        middleName: '银',
        lowerName: '铜钱',
        upperFullName: '金元宝',
        middleFullName: '银子',
        lowerFullName: '铜钱',
        upperToMiddleRate: 100,
        middleToLowerRate: 1000
    };
};

export const 获取货币显示模式 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 货币显示模式 => {
    const mode = 获取题材模式配置(openingConfig?.题材模式).currencyDisplayMode;
    if (推断单位仙侠(character) && mode === 'wuxia') return 'xianxia';
    return mode;
};

export const 获取世界观货币层级配置 = (
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): 货币层级配置[] => {
    const fallback = 获取默认货币层级配置(mode);
    const tiers = profile?.economy?.currencyTiers;
    const lowerName = 读取可用于UI的短货币文案(tiers?.lowerName)
        || 读取可用于UI的短货币文案(profile?.economy?.accountingUnit)
        || fallback.lowerName;
    const middleName = 读取可用于UI的短货币文案(tiers?.middleName) || fallback.middleName;
    const upperName = 读取可用于UI的短货币文案(tiers?.upperName) || fallback.upperName;
    const middleToLowerRate = 读取正整数汇率(tiers?.middleToLowerRate, fallback.middleToLowerRate);
    const upperToMiddleRate = 读取正整数汇率(tiers?.upperToMiddleRate, fallback.upperToMiddleRate);
    return [
        {
            key: '上层货币',
            label: upperName,
            fullLabel: upperName || fallback.upperFullName,
            multiplier: upperToMiddleRate * middleToLowerRate
        },
        {
            key: '中层货币',
            label: middleName,
            fullLabel: middleName || fallback.middleFullName,
            multiplier: middleToLowerRate
        },
        {
            key: '底层货币',
            label: lowerName,
            fullLabel: lowerName || fallback.lowerFullName,
            multiplier: 1
        }
    ];
};

export const 创建兼容角色金钱 = (money?: Partial<角色金钱> | null): 角色金钱 => {
    const normalized = {
        上层货币: 读取货币数值(money, '上层货币'),
        中层货币: 读取货币数值(money, '中层货币'),
        底层货币: 读取货币数值(money, '底层货币')
    };
    return {
        ...normalized,
        金元宝: normalized.上层货币,
        银子: normalized.中层货币,
        铜钱: normalized.底层货币
    };
};

export const 获取货币兼容字段路径 = (key: 货币层级键): string[] => [
    `角色.金钱.${key}`,
    `角色.金钱.${默认旧别名标签[key]}`
];

export const 获取货币层级倍率 = (
    key: 兼容货币键,
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): number => {
    const normalizedKey = 归一化货币键(key);
    return 获取世界观货币层级配置(profile, mode).find((item) => item.key === normalizedKey)?.multiplier || 1;
};

export const 获取世界观货币槽位 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 货币槽位配置[] => {
    const mode = 获取货币显示模式(openingConfig, character);
    return 获取世界观货币层级配置(openingConfig?.modeRuntimeProfile, mode).map((item) => ({
        key: item.key,
        label: item.label,
        fullLabel: item.fullLabel
    }));
};

export const 获取货币单位标签 = (
    key: 兼容货币键,
    mode: 货币显示模式 = 'wuxia',
    profile?: ModeRuntimeProfile | null
): string => {
    const normalizedKey = 归一化货币键(key);
    return 获取世界观货币层级配置(profile, mode).find((item) => item.key === normalizedKey)?.label || '';
};

export const 获取货币完整单位标签 = (
    key: 兼容货币键,
    mode: 货币显示模式 = 'wuxia',
    profile?: ModeRuntimeProfile | null
): string => {
    const normalizedKey = 归一化货币键(key);
    return 获取世界观货币层级配置(profile, mode).find((item) => item.key === normalizedKey)?.fullLabel || '';
};

export const 获取世界观主货币说明 = (profile?: ModeRuntimeProfile | null, mode: 货币显示模式 = 'wuxia'): string => (
    获取世界观货币层级配置(profile, mode)[2]?.label || ''
);

export const 获取世界观货币汇率说明 = (profile?: ModeRuntimeProfile | null, mode: 货币显示模式 = 'wuxia'): string => {
    const [upper, middle, lower] = 获取世界观货币层级配置(profile, mode);
    const middleToLower = middle?.multiplier || 1;
    const upperToMiddle = Math.max(1, Math.floor((upper?.multiplier || 1) / Math.max(1, middleToLower)));
    return `1 ${upper.fullLabel} = ${upperToMiddle} ${middle.fullLabel}；1 ${middle.fullLabel} = ${middleToLower} ${lower.fullLabel}。`;
};

export const 获取世界观简短货币汇率说明 = (
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): string => {
    const [upper, middle, lower] = 获取世界观货币层级配置(profile, mode);
    return `1 ${upper.label} = ${Math.max(1, Math.floor(upper.multiplier / Math.max(1, middle.multiplier)))} ${middle.label} = ${upper.multiplier} ${lower.label}`;
};

export const 获取世界观货币摘要 = (
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): string => {
    const [upper, middle, lower] = 获取世界观货币层级配置(profile, mode);
    return `当前世界使用 ${upper.fullLabel}、${middle.fullLabel}、${lower.fullLabel} 三级货币，系统会按相邻汇率自动折算。`;
};

export const 获取世界观货币卡片信息 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 世界观货币卡片信息 => {
    const mode = 获取货币显示模式(openingConfig, character);
    const profile = openingConfig?.modeRuntimeProfile;
    return {
        title: '货币体系',
        summary: 获取世界观货币摘要(profile, mode),
        exchangeHint: 获取世界观货币汇率说明(profile, mode)
    };
};

export const 是否仙侠货币模式 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): boolean => (
    题材是否仙侠(openingConfig?.题材模式)
    || 推断单位仙侠(character)
);

export const 规范化角色金钱 = 创建兼容角色金钱;

export const 计算角色货币底层总值 = (
    money?: Partial<角色金钱> | null,
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): number => {
    const normalized = 创建兼容角色金钱(money);
    return 货币层级顺序.reduce((sum, key) => (
        sum + 读取货币数值(normalized, key) * 获取货币层级倍率(key, profile, mode)
    ), 0);
};

export const 底层总值转角色金钱 = (
    value: number,
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): 角色金钱 => {
    const total = Math.max(0, Math.floor(Number(value) || 0));
    const [upper, middle] = 获取世界观货币层级配置(profile, mode);
    const 上层货币 = Math.floor(total / Math.max(1, upper.multiplier));
    const afterUpper = total - 上层货币 * Math.max(1, upper.multiplier);
    const 中层货币 = Math.floor(afterUpper / Math.max(1, middle.multiplier));
    const 底层货币 = afterUpper - 中层货币 * Math.max(1, middle.multiplier);
    return 创建兼容角色金钱({ 上层货币, 中层货币, 底层货币 });
};

export const 格式化角色金钱行 = (
    money?: Partial<角色金钱> | null,
    mode: 货币显示模式 = 'wuxia',
    profile?: ModeRuntimeProfile | null
): string => {
    const normalized = 创建兼容角色金钱(money);
    return 获取世界观货币层级配置(profile, mode)
        .map((slot) => `${slot.label} ${读取货币数值(normalized, slot.key)}`)
        .join(' / ');
};
