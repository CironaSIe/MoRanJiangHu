const 取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 否定设定正则 = /^(?:false|0|否|不是|不|无|没有|暂无|暂无记录|无记录|未记录|未知|不详|普通|正常|无扶她设定|非扶她|无男娘设定|非男娘|无相关设定)$/iu;

const 是否肯定设定 = (value: unknown, keyword: string): boolean => {
    const text = 取文本(value);
    if (!text || 否定设定正则.test(text)) return false;
    if (new RegExp(`(?:非|无|不是|没有)${keyword}`, 'u').test(text)) return false;
    return text.includes(keyword);
};

export const NPC是否扶她 = (npc: any): boolean => {
    const gender = 取文本(npc?.性别);
    return gender.includes('扶她') || 是否肯定设定(npc?.扶她设定, '扶她');
};

export const NPC是否男娘 = (npc: any): boolean => {
    const gender = 取文本(npc?.性别);
    return gender.includes('男娘') || 是否肯定设定(npc?.男娘设定, '男娘');
};

export const NPC是否男性或男娘 = (npc: any): boolean => {
    const gender = 取文本(npc?.性别);
    return gender === '男'
        || gender === '男性'
        || NPC是否男娘(npc)
        || NPC是否扶她(npc);
};

export const NPC是否女性 = (npc: any): boolean => {
    const gender = 取文本(npc?.性别);
    return gender === '女' || gender === '女性';
};
