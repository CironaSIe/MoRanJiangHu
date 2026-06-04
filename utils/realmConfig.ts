import type { ModeRuntimeProfile, 题材模式类型 } from '../models/system';
import { 获取题材模式配置 } from './topicModeProfiles';

export interface 境界配置 {
    levelNames: string[];
    parseRules: Array<{ pattern: string; level: number }>;
    stageNames?: string[];
    tierAliases?: Record<string, string>;
    format?: string;
}

const 默认武侠境界: 境界配置 = {
    levelNames: [
        '开脉境一重', '开脉境二重', '开脉境三重', '开脉境四重',
        '聚息境一重', '聚息境二重', '聚息境三重', '聚息境四重',
        '归元境一重', '归元境二重', '归元境三重', '归元境四重',
        '御劲境一重', '御劲境二重', '御劲境三重', '御劲境四重',
        '化罡境一重', '化罡境二重', '化罡境三重', '化罡境四重',
        '通玄初期', '通玄中期', '通玄圆满',
        '神照境', '返真境', '天人境'
    ],
    stageNames: ['开脉', '聚息', '归元', '御劲', '化罡'],
    tierAliases: { 初期: '一', 前期: '一', 中期: '二', 后期: '三', 圆满: '四', 一: '一', 二: '二', 两: '二', 三: '三', 四: '四', '1': '一', '2': '二', '3': '三', '4': '四' },
    format: '{stage}境{tier}重',
    parseRules: [
        { pattern: '凡人|普通|未入道|无修为', level: 1 },
        { pattern: '炼体|锻体|开脉|通脉', level: 1 },
        { pattern: '聚息|聚气|凝气', level: 5 },
        { pattern: '筑基|归元', level: 9 },
        { pattern: '御劲|凝真|玄照', level: 13 },
        { pattern: '化罡|金丹|玄丹', level: 17 },
        { pattern: '通玄|元婴', level: 21 },
        { pattern: '神照|化神', level: 27 },
        { pattern: '返真|炼虚', level: 33 },
        { pattern: '合体', level: 38 },
        { pattern: '大乘|渡劫', level: 43 }
    ]
};

const 按模式获取默认境界配置 = (模式?: 题材模式类型 | null): 境界配置 => {
    const group = 获取题材模式配置(模式).group;
    if (group === 'apocalypse') {
        return {
            levelNames: [
                '幸存者一阶', '幸存者二阶', '幸存者三阶', '幸存者四阶',
                '适应者一阶', '适应者二阶', '适应者三阶', '适应者四阶',
                '营地骨干一阶', '营地骨干二阶', '营地骨干三阶', '营地骨干四阶',
                '战术专家一阶', '战术专家二阶', '战术专家三阶', '战术专家四阶',
                '营地统领一阶', '营地统领二阶', '营地统领三阶', '营地统领四阶',
                '灾区王牌初阶', '灾区王牌中阶', '灾区王牌圆满',
                '区域支柱', '末日领袖', '人类火种'
            ],
            stageNames: ['幸存者', '适应者', '营地骨干', '战术专家', '营地统领'],
            tierAliases: { 一: '一', 二: '二', 两: '二', 三: '三', 四: '四', '1': '一', '2': '二', '3': '三', '4': '四' },
            format: '{stage}{tier}阶',
            parseRules: [
                { pattern: '凡人|普通|平民', level: 1 },
                { pattern: '幸存者|新手', level: 1 },
                { pattern: '适应者|熟练', level: 5 },
                { pattern: '营地骨干|精英', level: 9 },
                { pattern: '战术专家|专家', level: 13 },
                { pattern: '营地统领|大师', level: 17 },
                { pattern: '灾区王牌|传奇', level: 21 },
                { pattern: '区域支柱|英雄', level: 24 },
                { pattern: '末日领袖', level: 25 },
                { pattern: '人类火种', level: 26 }
            ],
        };
    }
    if (group === 'urban' || group === 'modern') {
        return {
            levelNames: [
                '普通人一阶', '普通人二阶', '普通人三阶', '普通人四阶',
                '熟练者一阶', '熟练者二阶', '熟练者三阶', '熟练者四阶',
                '专家一阶', '专家二阶', '专家三阶', '专家四阶',
                '骨干一阶', '骨干二阶', '骨干三阶', '骨干四阶',
                '精英一阶', '精英二阶', '精英三阶', '精英四阶',
                '王牌初阶', '王牌中阶', '王牌圆满',
                '传奇级', '城市级', '时代级'
            ],
            stageNames: ['普通人', '熟练者', '专家', '骨干', '精英'],
            tierAliases: { 一: '一', 二: '二', 两: '二', 三: '三', 四: '四', '1': '一', '2': '二', '3': '三', '4': '四' },
            format: '{stage}{tier}阶',
            parseRules: [
                { pattern: '凡人|普通|平民', level: 1 },
                { pattern: '普通人|新手', level: 1 },
                { pattern: '熟练者|初级', level: 5 },
                { pattern: '专家|中级', level: 9 },
                { pattern: '骨干|高级', level: 13 },
                { pattern: '精英|资深', level: 17 },
                { pattern: '王牌|大师', level: 21 },
                { pattern: '传奇|超越', level: 24 }
            ],
        };
    }
    if (group === 'fantasy') {
        return {
            levelNames: [
                '见习一阶', '见习二阶', '见习三阶', '见习四阶',
                '初阶一阶', '初阶二阶', '初阶三阶', '初阶四阶',
                '中阶一阶', '中阶二阶', '中阶三阶', '中阶四阶',
                '高阶一阶', '高阶二阶', '高阶三阶', '高阶四阶',
                '大师一阶', '大师二阶', '大师三阶', '大师四阶',
                '英雄初阶', '英雄中阶', '英雄圆满',
                '传奇级', '史诗级', '神话级'
            ],
            stageNames: ['见习', '初阶', '中阶', '高阶', '大师'],
            tierAliases: { 一: '一', 二: '二', 两: '二', 三: '三', 四: '四', '1': '一', '2': '二', '3': '三', '4': '四' },
            format: '{stage}{tier}阶',
            parseRules: [
                { pattern: '凡人|平民|普通', level: 1 },
                { pattern: '见习|学徒', level: 1 },
                { pattern: '初阶|初级', level: 5 },
                { pattern: '中阶|中级', level: 9 },
                { pattern: '高阶|高级', level: 13 },
                { pattern: '大师|专家', level: 17 },
                { pattern: '英雄|传奇', level: 21 },
                { pattern: '史诗|神话', level: 24 }
            ],
        };
    }
    if (group === 'infinite') {
        return {
            levelNames: [
                '新人一阶', '新人二阶', '新人三阶', '新人四阶',
                '资深一阶', '资深二阶', '资深三阶', '资深四阶',
                '精英一阶', '精英二阶', '精英三阶', '精英四阶',
                '轮回者一阶', '轮回者二阶', '轮回者三阶', '轮回者四阶',
                '基因锁一阶', '基因锁二阶', '基因锁三阶', '基因锁四阶',
                '超凡初阶', '超凡中阶', '超凡圆满',
                '半神级', '真神级', '主神级'
            ],
            stageNames: ['新人', '资深', '精英', '轮回者', '基因锁'],
            tierAliases: { 一: '一', 二: '二', 两: '二', 三: '三', 四: '四', '1': '一', '2': '二', '3': '三', '4': '四' },
            format: '{stage}{tier}阶',
            parseRules: [
                { pattern: '新人|新手', level: 1 },
                { pattern: '资深|初级', level: 5 },
                { pattern: '精英|中级', level: 9 },
                { pattern: '轮回者|高级', level: 13 },
                { pattern: '基因锁|资深', level: 17 },
                { pattern: '超凡|大师', level: 21 },
                { pattern: '半神|神话', level: 24 }
            ]
        };
    }
    if (group === 'xianxia') {
        return {
            levelNames: [
                '练气一层', '练气二层', '练气三层', '练气四层',
                '练气五层', '练气六层', '练气七层', '练气八层',
                '练气九层', '练气十层', '练气十一层', '练气十二层',
                '筑基初期', '筑基中期', '筑基后期', '筑基圆满',
                '金丹初期', '金丹中期', '金丹后期', '金丹圆满',
                '元婴初期', '元婴中期', '元婴后期', '元婴圆满',
                '化神初期', '化神中期', '化神后期', '化神圆满',
                '炼虚初期', '炼虚中期', '炼虚后期', '炼虚圆满',
                '合体初期', '合体中期', '合体后期', '合体圆满',
                '大乘初期', '大乘中期', '大乘后期', '大乘圆满',
                '渡劫初期', '渡劫中期', '渡劫后期', '渡劫圆满'
            ],
            stageNames: ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'],
            tierAliases: { 初期: '初期', 前期: '初期', 中期: '中期', 后期: '后期', 圆满: '圆满', '一': '一层', '二': '二层', '三': '三层', '四': '四层' },
            format: '{stage}{tier}',
            parseRules: [
                { pattern: '凡人|普通|未入道|无修为', level: 1 },
                { pattern: '炼气|练气', level: 1 },
                { pattern: '筑基', level: 13 },
                { pattern: '金丹', level: 17 },
                { pattern: '元婴', level: 21 },
                { pattern: '化神', level: 25 },
                { pattern: '炼虚', level: 29 },
                { pattern: '合体', level: 33 },
                { pattern: '大乘', level: 37 },
                { pattern: '渡劫', level: 41 }
            ]
        };
    }
    return 默认武侠境界;
};

export const 获取境界配置 = (模式?: 题材模式类型 | null, runtimeProfile?: ModeRuntimeProfile | null): 境界配置 => {
    const workshop = runtimeProfile?.ability?.realmConfig;
    if (workshop && Array.isArray(workshop.levelNames) && workshop.levelNames.length > 0) {
        return {
            levelNames: workshop.levelNames,
            parseRules: Array.isArray(workshop.parseRules) ? workshop.parseRules : [],
            stageNames: workshop.levelNames.map(n => n.replace(/[境\s]/, '').replace(/[一二两三四1-4][重层阶]?$/, '')).filter((v, i, a) => a.indexOf(v) === i),
            tierAliases: { 一: '一', 二: '二', 两: '二', 三: '三', 四: '四', '1': '一', '2': '二', '3': '三', '4': '四' },
            format: '{stage}{tier}'
        };
    }
    return 按模式获取默认境界配置(模式);
};

const 中文数字映射: Record<string, string> = { '1': '一', '2': '二', '3': '三', '4': '四', 一: '一', 二: '二', 两: '二', 三: '三', 四: '四' };
const 阶段映射: Record<string, string> = { 初期: '一', 前期: '一', 中期: '二', 后期: '三', 圆满: '四' };

const 查找完整境界层级 = (text: string, cfg: 境界配置): number => {
    const compactText = (text || '').replace(/\s+/g, '');
    if (!compactText || !Array.isArray(cfg.levelNames)) return 0;
    const matchedIndex = cfg.levelNames
        .map((name, index) => ({ name: String(name || '').replace(/\s+/g, ''), index }))
        .filter(item => item.name)
        .sort((a, b) => b.name.length - a.name.length)
        .find(item => compactText.includes(item.name))?.index;
    return typeof matchedIndex === 'number' ? matchedIndex + 1 : 0;
};

export const 规范化境界显示文本 = (value: unknown, fallback = '', cfg?: 境界配置): string => {
    const config = cfg || 默认武侠境界;
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return fallback;
    const compact = text.replace(/\s+/g, '');
    if (config.stageNames && config.format) {
        const stagePattern = config.stageNames.join('|');
        const tierKeys = Object.keys(config.tierAliases || {}).join('|');
        const stageMatch = compact.match(new RegExp(`^(${stagePattern})境?(${tierKeys})$`));
        if (stageMatch) {
            const tier = (config.tierAliases || {})[stageMatch[2]] || stageMatch[2];
            return config.format.replace('{stage}', stageMatch[1]).replace('{tier}', tier);
        }
        const numericMatch = compact.match(new RegExp(`^(${stagePattern})境?第?([一二两三四1-4])(?:重|层)$`));
        if (numericMatch) {
            const tier = 中文数字映射[numericMatch[2]] || numericMatch[2];
            return config.format.replace('{stage}', numericMatch[1]).replace('{tier}', tier);
        }
    }
    return text;
};

export const 获取境界层级 = (textRaw: string, cfg?: 境界配置): number => {
    const config = cfg || 默认武侠境界;
    const text = [textRaw].map(v => typeof v === 'string' ? v : '').join(' ').replace(/\s+/g, '');
    if (!text) return 1;
    const exactLevel = 查找完整境界层级(text, config);
    if (exactLevel > 0) return exactLevel;
    if (config.stageNames && config.tierAliases && config.levelNames.length > 0) {
        const stagePattern = config.stageNames.join('|');
        const tierKeys = Object.keys(config.tierAliases).join('|');
        const stageMatch = text.match(new RegExp(`(${stagePattern})境?(${tierKeys})`));
        if (stageMatch) {
            const tier = config.tierAliases[stageMatch[2]] || stageMatch[2];
            const formatted = config.format
                ? config.format.replace('{stage}', stageMatch[1]).replace('{tier}', tier)
                : `${stageMatch[1]}${tier}`;
            const formattedLevel = 查找完整境界层级(formatted, config);
            if (formattedLevel > 0) return formattedLevel;
        }
    }
    let rank = 1;
    (config.parseRules || []).forEach(({ pattern, level }) => {
        if (new RegExp(pattern).test(text)) rank = Math.max(rank, level);
    });
    if (/寨主|庄主|掌门|宗主|长老|供奉|统领|首领/.test(text)) rank += 2;
    if (/后期|圆满|巅峰/.test(text)) rank += 1;
    return Math.max(1, rank);
};

export const 获取境界名称列表 = (cfg?: 境界配置): string[] => {
    const config = cfg || 默认武侠境界;
    return config.levelNames || [];
};
