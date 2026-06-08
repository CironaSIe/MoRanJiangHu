import type { OpeningConfig, 角色数据结构 } from '../types';
import type { 角色金钱 } from '../models/character';
import { 推断单位仙侠 } from './realmDisplay';
import { 获取题材模式配置, 题材是否仙侠 } from './topicModeProfiles';
import type { ModeRuntimeProfile } from '../models/system';

export type 货币显示模式 = 'wuxia' | 'xianxia' | 'fantasy' | 'urban' | 'modern' | 'apocalypse' | 'infinite';

export const 仙侠货币汇率说明 = '1 中品灵石 = 1000 下品灵石；1 上品灵石 = 100 中品灵石 = 100000 下品灵石。';

export type 货币槽位配置 = {
    key: keyof 角色金钱;
    label: string;
    fullLabel: string;
};

export type 世界观货币卡片信息 = {
    title: string;
    summary: string;
    exchangeHint: string;
};

export const 获取世界观货币槽位 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 货币槽位配置[] => {
    const mode = 获取货币显示模式(openingConfig, character);
    const slots: Array<keyof 角色金钱> = ['金元宝', '银子', '铜钱'];
    return slots.map((key) => ({
        key,
        label: 获取货币单位标签(key, mode, openingConfig?.modeRuntimeProfile),
        fullLabel: 获取货币完整单位标签(key, mode, openingConfig?.modeRuntimeProfile)
    }));
};

export const 获取世界观主货币说明 = (profile?: ModeRuntimeProfile | null): string => (
    typeof profile?.economy?.primaryCurrency === 'string' && profile.economy.primaryCurrency.trim()
        ? profile.economy.primaryCurrency.trim()
        : ''
);

export const 获取世界观货币汇率说明 = (profile?: ModeRuntimeProfile | null, mode?: 货币显示模式): string => {
    const explicit = typeof profile?.economy?.exchangeRules === 'string' ? profile.economy.exchangeRules.trim() : '';
    if (explicit) return explicit;
    if (mode === 'xianxia') return 仙侠货币汇率说明;
    if (mode === 'fantasy') return '1 金币 = 100 银币；1 银币 = 100 铜币。';
    if (mode === 'infinite') return '1 C级支线剧情 = 100 D级支线剧情；1 D级支线剧情 = 1000 奖励点。';
    return '底层统一按主货币折算，展示口径跟随当前世界观。';
};

export const 获取世界观货币摘要 = (
    profile?: ModeRuntimeProfile | null,
    mode: 货币显示模式 = 'wuxia'
): string => {
    const primary = 获取世界观主货币说明(profile);
    if (primary) return primary;
    if (mode === 'xianxia') return '当前世界以灵石体系结算，大额与高阶资源默认按灵石折算。';
    if (mode === 'fantasy') return '当前世界以金币、银币、铜币结算，常见交易统一按王国币制显示。';
    if (mode === 'urban' || mode === 'modern') return '当前世界以现代账户、信用点或现金口径结算。';
    if (mode === 'apocalypse') return '当前世界以营地信用、物资票和安全通行牌结算。';
    if (mode === 'infinite') return '当前世界以奖励点和支线剧情作为核心结算资源。';
    return '当前世界默认使用银钱体系，所有结算会自动折回统一账本。';
};

export const 获取世界观货币卡片信息 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 世界观货币卡片信息 => {
    const mode = 获取货币显示模式(openingConfig, character);
    const profile = openingConfig?.modeRuntimeProfile;
    return {
        title: mode === 'infinite' ? '主神结算' : '货币口径',
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

export const 获取货币显示模式 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 货币显示模式 => {
    const mode = 获取题材模式配置(openingConfig?.题材模式).currencyDisplayMode;
    if (推断单位仙侠(character) && mode === 'wuxia') return 'xianxia';
    return mode;
};

export const 获取货币单位标签 = (
    key: keyof 角色金钱,
    mode: 货币显示模式 = 'wuxia',
    profile?: ModeRuntimeProfile | null
): string => {
    const customPrimary = 获取世界观主货币说明(profile);
    if (customPrimary && key === '铜钱') return customPrimary;
    if (mode === 'xianxia') {
        if (key === '金元宝') return '上品灵石';
        if (key === '银子') return '中品灵石';
        return '下品灵石';
    }
    if (mode === 'urban' || mode === 'modern') {
        if (key === '金元宝') return '十万元账户';
        if (key === '银子') return '千元账户';
        return '信用点';
    }
    if (mode === 'apocalypse') {
        if (key === '金元宝') return '安全通行牌';
        if (key === '银子') return '物资票';
        return '营地信用点';
    }
    if (mode === 'infinite') {
        if (key === '金元宝') return 'C级支线剧情';
        if (key === '银子') return 'D级支线剧情';
        return '奖励点';
    }
    if (mode === 'fantasy') {
        if (key === '金元宝') return '金币';
        if (key === '银子') return '银币';
        return '铜币';
    }
    if (key === '金元宝') return '元宝';
    if (key === '银子') return '银';
    return '铜';
};

export const 获取货币完整单位标签 = (
    key: keyof 角色金钱,
    mode: 货币显示模式 = 'wuxia',
    profile?: ModeRuntimeProfile | null
): string => {
    if (mode !== 'wuxia') return 获取货币单位标签(key, mode, profile);
    const customPrimary = 获取世界观主货币说明(profile);
    if (customPrimary && key === '铜钱') return customPrimary;
    if (key === '金元宝') return '金元宝';
    if (key === '银子') return '银子';
    return '铜钱';
};

export const 格式化角色金钱行 = (
    money?: Partial<角色金钱> | null,
    mode: 货币显示模式 = 'wuxia',
    profile?: ModeRuntimeProfile | null
): string => {
    const normalized = {
        金元宝: Number(money?.金元宝) || 0,
        银子: Number(money?.银子) || 0,
        铜钱: Number(money?.铜钱) || 0
    };
    return [
        `${获取货币单位标签('金元宝', mode, profile)} ${normalized.金元宝}`,
        `${获取货币单位标签('银子', mode, profile)} ${normalized.银子}`,
        `${获取货币单位标签('铜钱', mode, profile)} ${normalized.铜钱}`
    ].join(' / ');
};
