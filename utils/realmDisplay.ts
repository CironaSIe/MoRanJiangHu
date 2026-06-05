import { 获取境界映射名称, 获取硬编码仙侠境界名称 } from '../prompts/runtime/fandom';
import { 获取境界配置 } from './realmConfig';
import type { 境界配置 } from './realmConfig';

const 读取文本 = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const 默认武侠境界词 = /开脉|聚息|归元|御劲|化罡|通玄|神照|返真|天人|未知|未明|未定|不详|境界值|境界层级/;
const 仙侠境界词 = /凡人|未入道|炼气|筑基|金丹|元婴|化神|炼虚|合体/;
const 境界占位词 = /^(?:未知|未明|未定|不详|未知境界|未明境界|未定境界|境界值\s*\d*|境界层级\s*\d*)$/;

const 获取境界前缀集合 = (cfg: 境界配置): Set<string> => {
    const terms = new Set<string>();
    (cfg.stageNames || []).forEach(s => terms.add(s));
    cfg.levelNames.forEach(n => {
        const stripped = n.replace(/[一二三四五六七八九十\d百千万零]+[层重阶]?$/, '')
            .replace(/初期|中期|后期|圆满|巅峰|初阶|中阶|高阶$/, '');
        if (stripped) terms.add(stripped);
    });
    ['未知', '未明', '未定', '不详', '境界值', '境界层级'].forEach(t => terms.add(t));
    return terms;
};

const 动态境界正则缓存 = new Map<string, { known: RegExp; xianxia: RegExp }>();

const 获取动态境界正则 = (options?: { openingConfig?: any }): { known: RegExp; xianxia: RegExp } => {
    const mode = options?.openingConfig?.题材模式 as string || '';
    const cached = 动态境界正则缓存.get(mode);
    if (cached) return cached;
    const cfg = 获取境界配置(mode || null, null);
    const xianxiaCfg = 获取境界配置('仙侠', null);
    const knownTerms = [...获取境界前缀集合(cfg)];
    const xianxiaTerms = [...获取境界前缀集合(xianxiaCfg)];
    const result = {
        known: new RegExp(knownTerms.join('|'), 'i'),
        xianxia: new RegExp(xianxiaTerms.join('|'), 'i')
    };
    动态境界正则缓存.set(mode, result);
    return result;
};

const 提取境界映射 = (realmPrompt?: string): Array<{ level: number; label: string }> => {
    const text = 读取文本(realmPrompt);
    if (!text) return [];
    const block = text.match(/【境界映射母板】([\s\S]*?)(?=\n【|$)/)?.[1] || '';
    return block
        .split('\n')
        .map((line) => {
            const matched = line.trim().match(/^(\d{1,2})\s*(?:=>|=|:|：)\s*(.+)$/);
            if (!matched) return null;
            const level = Number(matched[1]);
            const label = matched[2].trim();
            return Number.isFinite(level) && label ? { level, label } : null;
        })
        .filter((item): item is { level: number; label: string } => Boolean(item));
};

export const 推断单位仙侠 = (unit: any): boolean => {
    if (!unit || typeof unit !== 'object') return false;
    const realm = 读取文本(unit?.境界);
    if (/炼气|筑基|金丹|元婴|化神|炼虚|合体/.test(realm)) return true;
    const textSignals = [
        读取文本(unit?.灵根),
        读取文本(unit?.灵根资质),
        读取文本(unit?.丹田状态),
        读取文本(unit?.道基状态)
    ].filter((text) => text && !/^(未鉴定|稳定|未筑道基|无|未知)$/.test(text));
    if (textSignals.length > 0) return true;
    return [
        unit?.当前灵力,
        unit?.最大灵力,
        unit?.当前神识,
        unit?.最大神识,
        unit?.心魔值,
        unit?.功德,
        unit?.业力
    ].some((value) => Number.isFinite(Number(value)) && Number(value) > 0);
};

export const 获取单位境界显示 = (
    unit: any,
    fallback = '未明境界',
    options?: { forceXianxia?: boolean; realmPrompt?: string; worldPrompt?: string; openingConfig?: any }
): string => {
    const raw = 读取文本(unit?.境界);
    const mappedRealm = 获取境界映射名称(unit?.境界层级, options);
    const hardcodedXianxia = 获取硬编码仙侠境界名称(unit?.境界层级);
    const explicitMode = 读取文本(options?.openingConfig?.题材模式);
    const level = Math.max(1, Number(unit?.境界层级) || 0);
    const topicMappedRealm = explicitMode && explicitMode !== '仙侠'
        ? 获取境界配置(explicitMode as any, options?.openingConfig?.modeRuntimeProfile || null).levelNames[level - 1] || ''
        : '';
    const allowXianxiaInference = !explicitMode || explicitMode === '仙侠' || explicitMode === '都市修仙';
    const shouldUseXianxia = allowXianxiaInference && (options?.forceXianxia === true || 推断单位仙侠(unit));
    const { known: currentKnownRegex, xianxia: currentXianxiaRegex } = 获取动态境界正则(options);
    if (shouldUseXianxia && hardcodedXianxia && (!raw || !currentXianxiaRegex.test(raw) || currentKnownRegex.test(raw))) {
        return hardcodedXianxia;
    }
    if (explicitMode && explicitMode !== '仙侠' && raw && !境界占位词.test(raw)) return raw;
    if (topicMappedRealm) return topicMappedRealm;
    if (raw && !currentKnownRegex.test(raw)) return raw;
    return mappedRealm || raw || hardcodedXianxia || fallback;
};

export const 构建境界速查摘要 = (
    realmPrompt?: string,
    openingConfig?: any
): string => {
    const mapping = 提取境界映射(realmPrompt);
    if (mapping.length === 0) {
        return '境界划分以本存档开局生成、导入或手动设置的境界体系为准；战斗面板仅展示角色当前境界与数值层级。';
    }
    const checkpoints = [1, 5, 9, 13, 17, 21, 27, 33, 43]
        .map((level) => mapping.find((item) => item.level === level))
        .filter((item): item is { level: number; label: string } => Boolean(item))
        .map((item) => `${item.level}=${item.label}`);
    const mode = 读取文本(openingConfig?.题材模式);
    const prefix = mode ? `${mode}本存档境界：` : '本存档境界：';
    return `${prefix}${checkpoints.join('；')}。角色变量与战斗面板均按这份境界映射显示。`;
};
