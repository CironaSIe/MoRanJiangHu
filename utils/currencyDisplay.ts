import type { OpeningConfig, 角色数据结构 } from '../types';
import type { 角色金钱 } from '../models/character';
import { 推断单位仙侠 } from './realmDisplay';
import { 获取题材模式配置, 题材是否仙侠 } from './topicModeProfiles';

export type 货币显示模式 = 'wuxia' | 'xianxia' | 'urban' | 'modern' | 'apocalypse';

export const 仙侠货币汇率说明 = '1 中品灵石 = 1000 下品灵石；1 上品灵石 = 100 中品灵石 = 100000 下品灵石。';

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
    mode: 货币显示模式 = 'wuxia'
): string => {
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
    if (key === '金元宝') return '元宝';
    if (key === '银子') return '银';
    return '铜';
};

export const 获取货币完整单位标签 = (
    key: keyof 角色金钱,
    mode: 货币显示模式 = 'wuxia'
): string => {
    if (mode !== 'wuxia') return 获取货币单位标签(key, mode);
    if (key === '金元宝') return '金元宝';
    if (key === '银子') return '银子';
    return '铜钱';
};

export const 格式化角色金钱行 = (
    money?: Partial<角色金钱> | null,
    mode: 货币显示模式 = 'wuxia'
): string => {
    const normalized = {
        金元宝: Number(money?.金元宝) || 0,
        银子: Number(money?.银子) || 0,
        铜钱: Number(money?.铜钱) || 0
    };
    return [
        `${获取货币单位标签('金元宝', mode)} ${normalized.金元宝}`,
        `${获取货币单位标签('银子', mode)} ${normalized.银子}`,
        `${获取货币单位标签('铜钱', mode)} ${normalized.铜钱}`
    ].join(' / ');
};
