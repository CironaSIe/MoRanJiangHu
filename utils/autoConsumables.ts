import type { 游戏物品, 角色数据结构 } from '../types';
import { 获取题材模式配置 } from './topicModeProfiles';

type AutoConsumableTemplate = {
    id: string;
    name: string;
    description: string;
    visual: string;
    value: number;
    count: number;
    effects: { 目标属性: string; 数值: number }[];
};

type 自动丹药预设选项 = {
    启用饱腹口渴系统?: boolean;
    题材模式?: unknown;
};

const AUTO_CONSUMABLES: AutoConsumableTemplate[] = [
    {
        id: 'auto_pill_bigu',
        name: '辟谷丹',
        description: '门派常备行走丹药，可补饱腹与水分，适合长途赶路时自动服用。',
        visual: 'realistic wuxia travel ration pill, small matte tan herbal pellet in a dark ceramic dish, dry grain powder, practical sect supply, no text',
        value: 80,
        count: 3,
        effects: [
            { 目标属性: '当前饱腹', 数值: 55 },
            { 目标属性: '当前水分', 数值: 55 }
        ]
    },
    {
        id: 'auto_pill_huiqi',
        name: '回气丹',
        description: '补回精力的常用丹药，精力过低时会自动服用。',
        visual: 'realistic wuxia energy recovery pill, warm amber herbal pellet, faint golden vapor, dark lacquer medicine case, no text',
        value: 120,
        count: 2,
        effects: [{ 目标属性: '当前精力', 数值: 60 }]
    },
    {
        id: 'auto_pill_ningyuan',
        name: '凝元丹',
        description: '温养丹田、恢复内力的丹药，内力过低时会自动服用。',
        visual: 'realistic wuxia inner energy pill, smooth jade green medicinal pellet, subtle mist, black porcelain vial, premium prop icon, no text',
        value: 160,
        count: 2,
        effects: [{ 目标属性: '当前内力', 数值: 70 }]
    },
    {
        id: 'auto_pill_pojing',
        name: '破境丹',
        description: '突破小境界时消耗的护脉丹药，经验满足突破条件后会自动服用。',
        visual: 'realistic wuxia breakthrough pill, dark crimson medicinal pellet with fine gold cracks, sealed jade pill box, dramatic rim light, no text',
        value: 500,
        count: 1,
        effects: [{ 目标属性: '突破', 数值: 1 }]
    }
];

const APOCALYPSE_CONSUMABLES: AutoConsumableTemplate[] = [
    {
        id: 'auto_survival_water',
        name: '饮水瓶',
        description: '营地常备饮水，水分过低时会自动饮用。',
        visual: 'scratched reusable water bottle filled with clean water, apocalypse survival gear, no label',
        value: 40,
        count: 2,
        effects: [{ 目标属性: '当前水分', 数值: 55 }]
    },
    {
        id: 'auto_survival_biscuit',
        name: '压缩饼干',
        description: '便携口粮，饱腹过低时会自动食用。',
        visual: 'plain compressed ration biscuits in torn unlabeled foil packet, no readable text',
        value: 55,
        count: 3,
        effects: [{ 目标属性: '当前饱腹', 数值: 50 }]
    },
    {
        id: 'auto_survival_first_aid',
        name: '医用绷带',
        description: '基础外伤处理物资，精力过低时会自动用于简单处理。',
        visual: 'roll of clean medical bandage and gauze pads, no label or text',
        value: 70,
        count: 2,
        effects: [{ 目标属性: '当前精力', 数值: 45 }]
    }
];

const MODERN_CONSUMABLES: AutoConsumableTemplate[] = [
    {
        id: 'auto_modern_first_aid',
        name: '急救包',
        description: '现代急救用品，精力过低时会自动用于简单处理。',
        visual: 'compact first aid kit opened to show bandages and medical supplies, no readable labels',
        value: 120,
        count: 1,
        effects: [{ 目标属性: '当前精力', 数值: 45 }]
    }
];

const 获取自动消耗品模板 = (options?: 自动丹药预设选项): AutoConsumableTemplate[] => {
    const profile = 获取题材模式配置(options?.题材模式);
    if (profile.group === 'apocalypse') {
        const templates = APOCALYPSE_CONSUMABLES;
        if (options?.启用饱腹口渴系统 === false) {
            return templates.filter((template) => !template.effects.some((effect) => effect.目标属性 === '当前饱腹' || effect.目标属性 === '当前水分'));
        }
        return templates;
    }
    if (profile.group === 'modern') return MODERN_CONSUMABLES;
    if (options?.启用饱腹口渴系统 === false) {
        return AUTO_CONSUMABLES.filter((template) => !template.effects.some((effect) => effect.目标属性 === '当前饱腹' || effect.目标属性 === '当前水分'));
    }
    return AUTO_CONSUMABLES;
};

const 取文本 = (value: unknown, fallback = ''): string => (
    typeof value === 'string' ? value.trim() : fallback
);

const 取数字 = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const 创建自动消耗品 = (template: AutoConsumableTemplate): 游戏物品 => ({
    ID: template.id,
    名称: template.name,
    描述: template.description,
    类型: '消耗品',
    品质: template.name === '破境丹' ? '良品' : '凡品',
    重量: 0.05,
    堆叠数量: template.count,
    是否可堆叠: true,
    最大堆叠: 99,
    价值: template.value,
    当前耐久: 1,
    最大耐久: 1,
    词条列表: [],
    使用效果: template.effects,
    视觉描述: template.visual,
    视觉描述来源: '默认消耗品写实预设',
    视觉标签: ['写实道具', '自动消耗品', '可复用图标'],
    毒性: template.name === '破境丹' ? 2 : 0,
    物品来源类型: '未知',
    来源描述: '系统按题材模式、生存与突破规则预设的基础消耗品。'
} as 游戏物品);

export const 补齐自动丹药预设 = (items: any[], options?: 自动丹药预设选项): any[] => {
    const next = Array.isArray(items) ? [...items] : [];
    const names = new Set(next.map((item) => 取文本(item?.名称)).filter(Boolean));
    获取自动消耗品模板(options).forEach((template) => {
        if (!names.has(template.name)) {
            next.push(创建自动消耗品(template));
            names.add(template.name);
        }
    });
    return next;
};

/**
 * 这些 ID 专门留给系统按生存与突破规则预设的基础丹药。
 * 用来判断：角色用完后，不应该在下一回合被补齐逻辑再次塞回来。
 */
export const 自动预设丹药ID集合 = new Set([
    ...AUTO_CONSUMABLES,
    ...APOCALYPSE_CONSUMABLES,
    ...MODERN_CONSUMABLES
].map((template) => template.id));
export const 自动预设丹药名称集合 = new Set(AUTO_CONSUMABLES.map((template) => template.name));
export const 全部自动预设消耗品名称集合 = new Set([
    ...AUTO_CONSUMABLES,
    ...APOCALYPSE_CONSUMABLES,
    ...MODERN_CONSUMABLES
].map((template) => template.name));
export const 古风丹药预设名称集合 = 自动预设丹药名称集合;
export const 生存补给预设名称集合 = new Set(['辟谷丹', '饮水瓶', '压缩饼干']);

const 匹配效果 = (item: any, target: string): number => {
    const effects = Array.isArray(item?.使用效果) ? item.使用效果 : [];
    return effects.reduce((sum: number, effect: any) => {
        const key = 取文本(effect?.目标属性);
        if (key === target || (target === '当前口渴' && key === '当前水分')) {
            return sum + 取数字(effect?.数值);
        }
        return sum;
    }, 0);
};

const 夹取 = (value: number, min: number, max: number): number => {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
};

const 消耗一颗 = (items: any[], item: any): void => {
    const count = Math.max(1, 取数字(item?.堆叠数量, 1));
    item.堆叠数量 = count - 1;
    if (item.堆叠数量 <= 0) {
        const index = items.indexOf(item);
        if (index >= 0) items.splice(index, 1);
    }
};

export const 执行自动丹药补给 = (role: 角色数据结构): string[] => {
    const corrections: string[] = [];
    const roleLike = role as any;
    const items = Array.isArray(roleLike.物品列表) ? roleLike.物品列表 : [];

    const autoUseResource = (
        label: string,
        currentKey: keyof 角色数据结构,
        maxKey: keyof 角色数据结构,
        effectTarget: string,
        thresholdRatio: number
    ) => {
        const current = 取数字(roleLike[currentKey]);
        const max = Math.max(0, 取数字(roleLike[maxKey]));
        if (max <= 0 || current / max > thresholdRatio) return;
        const item = items.find((candidate) => 取文本(candidate?.类型) === '消耗品' && 匹配效果(candidate, effectTarget) > 0 && 取数字(candidate?.堆叠数量, 1) > 0);
        if (!item) return;
        const gain = 匹配效果(item, effectTarget);
        roleLike[currentKey] = 夹取(current + gain, 0, max);
        消耗一颗(items, item);
        corrections.push(`${label}过低，自动服用${取文本(item?.名称, '丹药')}(${current} -> ${roleLike[currentKey]})`);
    };

    autoUseResource('精力', '当前精力', '最大精力', '当前精力', 0.2);
    autoUseResource('内力', '当前内力', '最大内力', '当前内力', 0.2);
    autoUseResource('饱腹', '当前饱腹', '最大饱腹', '当前饱腹', 0.25);
    autoUseResource('水分', '当前口渴', '最大口渴', '当前口渴', 0.25);

    const exp = 取数字(roleLike.当前经验);
    const required = Math.max(0, 取数字(roleLike.升级经验));
    if (required > 0 && exp >= required) {
        const pill = items.find((item) => 取文本(item?.名称) === '破境丹' && 取数字(item?.堆叠数量, 1) > 0);
        if (pill) {
            const oldLevel = Math.max(0, 取数字(roleLike.境界层级, 1));
            roleLike.境界层级 = oldLevel + 1;
            roleLike.当前经验 = Math.max(0, exp - required);
            roleLike.升级经验 = Math.max(required + 50, Math.ceil(required * 1.35 + 120));
            roleLike.当前精力 = 夹取(取数字(roleLike.当前精力) + Math.round(取数字(roleLike.最大精力) * 0.35), 0, 取数字(roleLike.最大精力));
            roleLike.当前内力 = 夹取(取数字(roleLike.当前内力) + Math.round(取数字(roleLike.最大内力) * 0.35), 0, 取数字(roleLike.最大内力));
            消耗一颗(items, pill);
            corrections.push(`经验已满，自动服用破境丹突破(${oldLevel} -> ${roleLike.境界层级})`);
        }
    }

    roleLike.物品列表 = items;
    return corrections;
};
