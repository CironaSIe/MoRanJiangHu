import 女性人名选择器原始文本 from '../女性人名选择器?raw';

const 规范化姓名键 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

const 稳定哈希 = (text: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

export const 女性人名选择器列表 = Array.from(new Set(
    女性人名选择器原始文本
        .split(/\r?\n/)
        .map(规范化姓名键)
        .filter((name) => name.length > 0)
));

const 女性人名选择器集合 = new Set(女性人名选择器列表);

const 女性性别正则 = /女|女性|女子|少女|女修|姑娘|妇人|夫人|娘子|侍女|丫鬟/;
const 非女性性别正则 = /男娘|男性|男子|少年|男修|公子|汉子|男/;
const 占位女性姓名正则 = /^(?:角色|同门|随行者|新NPC|未命名NPC|未命名|未知|无名|女子|少女|女修|姑娘|侍女|丫鬟)\d*$/;
const 模板化女性姓名正则 = /^(?:苏婉儿|婉儿|林清雪|清雪|柳若嫣|若嫣|灵儿|月儿|芷若|小雅|小柔|小蝶|小环|小翠)$/;

export const 判断女性名称目标 = (npc: any): boolean => {
    const sex = 规范化姓名键(npc?.性别 ?? npc?.gender);
    if (!sex) return false;
    if (非女性性别正则.test(sex) && !女性性别正则.test(sex)) return false;
    return 女性性别正则.test(sex);
};

export const 判断女性姓名来自姓名库 = (value: unknown): boolean => {
    const name = 规范化姓名键(value);
    return Boolean(name && 女性人名选择器集合.has(name));
};

export const 选择唯一女性姓名 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
}): string => {
    const used = new Set(Array.from(params?.usedNames || []).map(规范化姓名键).filter(Boolean));
    if (女性人名选择器列表.length === 0) return `女性${used.size + 1}`;
    const start = 稳定哈希(params?.seed || `female-${used.size}`) % 女性人名选择器列表.length;
    for (let offset = 0; offset < 女性人名选择器列表.length; offset += 1) {
        const candidate = 女性人名选择器列表[(start + offset) % 女性人名选择器列表.length];
        if (candidate && !used.has(candidate)) return candidate;
    }
    const base = 女性人名选择器列表[start] || '女性';
    let suffix = used.size + 1;
    while (used.has(`${base}${suffix}`)) suffix += 1;
    return `${base}${suffix}`;
};

export const 选择女性姓名候选列表 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
    count?: number;
}): string[] => {
    const used = new Set(Array.from(params?.usedNames || []).map(规范化姓名键).filter(Boolean));
    const count = Math.max(1, Math.min(
        Number.isFinite(Number(params?.count)) ? Math.floor(Number(params?.count)) : 100,
        女性人名选择器列表.length || 1
    ));
    if (女性人名选择器列表.length === 0) return [];
    const start = 稳定哈希(params?.seed || `female-candidates-${used.size}`) % 女性人名选择器列表.length;
    const candidates: string[] = [];
    for (let offset = 0; offset < 女性人名选择器列表.length && candidates.length < count; offset += 1) {
        const candidate = 女性人名选择器列表[(start + offset) % 女性人名选择器列表.length];
        if (!candidate || used.has(candidate) || candidates.includes(candidate)) continue;
        candidates.push(candidate);
    }
    if (candidates.length >= count) return candidates;
    for (const candidate of 女性人名选择器列表) {
        if (candidates.length >= count) break;
        if (!candidate || used.has(candidate) || candidates.includes(candidate)) continue;
        candidates.push(candidate);
    }
    return candidates;
};

export const 重命名重复女性NPC列表 = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    const usedNames = new Set<string>();
    return list.map((npc, index) => {
        const name = 规范化姓名键(npc?.姓名);
        const isFemaleTarget = 判断女性名称目标(npc);
        if (!isFemaleTarget) {
            if (name) usedNames.add(name);
            return npc;
        }

        const shouldRename = !name
            || 占位女性姓名正则.test(name)
            || 模板化女性姓名正则.test(name)
            || (npc?.是否主要角色 === true && !判断女性姓名来自姓名库(name))
            || usedNames.has(name);
        if (!shouldRename) {
            usedNames.add(name);
            return { ...npc, 姓名: name };
        }

        const nextName = 选择唯一女性姓名({
            usedNames,
            seed: [
                npc?.id,
                npc?.姓名,
                npc?.身份,
                npc?.简介,
                npc?.境界,
                index
            ].map(规范化姓名键).join('|')
        });
        usedNames.add(nextName);
        const 曾用名 = Array.isArray(npc?.曾用名)
            ? Array.from(new Set([...npc.曾用名.map(规范化姓名键).filter(Boolean), name].filter(Boolean)))
            : (name ? [name] : undefined);
        return {
            ...npc,
            姓名: nextName,
            ...(曾用名 && 曾用名.length > 0 ? { 曾用名 } : {})
        };
    });
};
