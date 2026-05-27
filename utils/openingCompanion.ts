import type { NPC结构, OpeningConfig, 角色数据结构 } from '../types';

const 规范化文本键 = (value: unknown): string => (
    typeof value === 'string' ? value.trim().replace(/\s+/g, '').toLowerCase() : ''
);

const 取文本 = (value: unknown, fallback = ''): string => (
    typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const 清理标点文本 = (value: unknown, fallback = ''): string => (
    取文本(value, fallback)
        .replace(/([。！？!?；;])\1+/g, '$1')
        .trim()
);

const 句子化 = (label: string, value: unknown): string => {
    const text = 清理标点文本(value)
        .replace(/[。！？!?；;]+$/g, '');
    return text ? `${label}${text}。` : '';
};

const 取数字 = (value: unknown, fallback = 0): number => {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
};

const 稳定哈希文本 = (text: string): string => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
};

const 读取伙伴 = (openingConfig?: OpeningConfig) => {
    const partner = openingConfig?.初始伙伴;
    const name = 取文本(partner?.姓名);
    if (!partner || partner.enabled === false || !name) return null;
    return { partner, name };
};

export const 生成开局伙伴ID = (openingConfig?: OpeningConfig, playerName?: string): string => {
    const data = 读取伙伴(openingConfig);
    if (!data) return '';
    const relation = 取文本(data.partner.关系, '开局伙伴');
    return `npc_opening_partner_${稳定哈希文本(`${playerName || ''}|${data.name}|${relation}`)}`;
};

export const 构建初始伙伴NPC = (
    openingConfig?: OpeningConfig,
    player?: Partial<角色数据结构>
): NPC结构 | null => {
    const data = 读取伙伴(openingConfig);
    if (!data) return null;
    const { partner, name } = data;
    const relation = 取文本(partner.关系, '开局伙伴');
    const birthday = `${取数字(partner.出生月, 1)}月${取数字(partner.出生日, 1)}日`;
    const attrs = partner.属性 || {};
    const maxHp = Math.max(60, 取数字(attrs.体质, 10) * 10);
    const maxEnergy = Math.max(60, 取数字(attrs.体质, 10) * 8);
    const maxInternal = Math.max(20, (取数字(attrs.根骨, 10) + 取数字(attrs.悟性, 10)) * 4);
    const location = 取文本((player as any)?.当前位置 || (player as any)?.当前地点 || (player as any)?.具体地点, '主角身边');
    const introParts = [
        `${name}是主角的${relation}。`,
        句子化('外貌：', partner.外貌),
        句子化('性格：', partner.性格),
        句子化('备注：', partner.备注)
    ].filter(Boolean);

    return {
        id: 生成开局伙伴ID(openingConfig, 取文本(player?.姓名)),
        姓名: name,
        曾用名: [],
        性别: partner.性别 === '男' ? '男' : '女',
        年龄: 取数字(partner.年龄, 18),
        生日: birthday,
        境界: '未知境界',
        身份: relation,
        当前位置: location,
        当前地点: location,
        位置路径: location,
        是否在场: true,
        是否队友: true,
        是否主要角色: true,
        好感度: 60,
        关系状态: relation,
        简介: introParts.join('') || `${name}是开局已存在的随行伙伴。`,
        头像图片URL: 取文本(partner.头像图片URL),
        图片档案: partner.图片档案 && typeof partner.图片档案 === 'object' ? partner.图片档案 : undefined,
        核心性格特征: 清理标点文本(partner.性格, '与主角关系密切，愿意同行。'),
        天赋列表: Array.isArray(partner.天赋列表)
            ? partner.天赋列表.map((item) => ({
                名称: 取文本(item?.名称, '未命名天赋'),
                描述: 取文本(item?.描述, '开局伙伴建档天赋。'),
                效果: 取文本(item?.效果, '待剧情展开。')
            }))
            : [],
        出身背景: {
            名称: 取文本(partner.背景名称, '开局伙伴'),
            描述: 取文本(partner.背景描述, '由玩家在开局伙伴页设定。'),
            效果: 取文本(partner.背景效果, '影响开局关系与能力倾向。')
        },
        力量: 取数字(attrs.力量, 10),
        敏捷: 取数字(attrs.敏捷, 10),
        体质: 取数字(attrs.体质, 10),
        根骨: 取数字(attrs.根骨, 10),
        悟性: 取数字(attrs.悟性, 10),
        福源: 取数字(attrs.福源, 10),
        攻击力: Math.max(1, 取数字(attrs.力量, 10) * 2),
        防御力: Math.max(1, 取数字(attrs.体质, 10)),
        当前血量: maxHp,
        最大血量: maxHp,
        当前精力: maxEnergy,
        最大精力: maxEnergy,
        当前内力: maxInternal,
        最大内力: maxInternal,
        头部当前血量: 20,
        头部最大血量: 20,
        头部状态: '正常',
        胸部当前血量: 30,
        胸部最大血量: 30,
        胸部状态: '正常',
        腹部当前血量: 30,
        腹部最大血量: 30,
        腹部状态: '正常',
        左手当前血量: 20,
        左手最大血量: 20,
        左手状态: '正常',
        右手当前血量: 20,
        右手最大血量: 20,
        右手状态: '正常',
        左腿当前血量: 25,
        左腿最大血量: 25,
        左腿状态: '正常',
        右腿当前血量: 25,
        右腿最大血量: 25,
        右腿状态: '正常',
        当前装备: {},
        背包: [],
        BUFF: [],
        DEBUFF: [],
        技艺: [],
        外貌描写: 清理标点文本(partner.外貌),
        记忆: []
    };
};

const 是否疑似同一开局伙伴 = (npc: any, seed: NPC结构, openingConfig?: OpeningConfig): boolean => {
    if (!npc) return false;
    const nameKey = 规范化文本键(seed.姓名);
    const npcKeys = [npc.id, npc.ID, npc.姓名, npc.名称, ...(Array.isArray(npc.曾用名) ? npc.曾用名 : [])].map(规范化文本键);
    if (npcKeys.includes(规范化文本键(seed.id)) || npcKeys.includes(nameKey)) return true;

    const data = 读取伙伴(openingConfig);
    const relation = 规范化文本键(data?.partner.关系);
    const birthday = 规范化文本键(seed.生日);
    const text = [
        npc.身份,
        npc.关系状态,
        npc.简介,
        npc.当前任务,
        npc.行动意图
    ].map(规范化文本键).join('|');
    const sameProfile = (
        规范化文本键(npc.性别) === 规范化文本键(seed.性别)
        && 取数字(npc.年龄, -1) === seed.年龄
        && (!birthday || 规范化文本键(npc.生日).includes(birthday))
    );
    const companionFlag = npc.是否队友 === true || npc.是否主要角色 === true || npc.是否在场 === true;
    return companionFlag && sameProfile && Boolean(relation && text.includes(relation));
};

export const 修复开局伙伴社交列表 = (
    socialList: any[],
    openingConfig?: OpeningConfig,
    player?: Partial<角色数据结构>
): any[] => {
    const seed = 构建初始伙伴NPC(openingConfig, player);
    if (!seed) return Array.isArray(socialList) ? socialList : [];

    const source = Array.isArray(socialList) ? socialList : [];
    let merged: any | null = null;
    const next: any[] = [];

    source.forEach((npc) => {
        if (是否疑似同一开局伙伴(npc, seed, openingConfig)) {
            const seedArchive = seed.图片档案 && typeof seed.图片档案 === 'object' ? seed.图片档案 : undefined;
            const mergedArchive = merged?.图片档案 && typeof merged.图片档案 === 'object' ? merged.图片档案 : undefined;
            const npcArchive = npc?.图片档案 && typeof npc.图片档案 === 'object' ? npc.图片档案 : undefined;
            merged = {
                ...seed,
                ...merged,
                ...npc,
                id: seed.id,
                姓名: seed.姓名,
                头像图片URL: 取文本(npc?.头像图片URL, 取文本(merged?.头像图片URL, 取文本(seed.头像图片URL))),
                图片档案: npcArchive || mergedArchive || seedArchive,
                曾用名: Array.from(new Set([
                    ...(Array.isArray(seed.曾用名) ? seed.曾用名 : []),
                    ...(Array.isArray(merged?.曾用名) ? merged.曾用名 : []),
                    ...(Array.isArray(npc?.曾用名) ? npc.曾用名 : []),
                    取文本(npc?.姓名) && 取文本(npc?.姓名) !== seed.姓名 ? 取文本(npc?.姓名) : ''
                ].filter(Boolean))),
                性别: seed.性别,
                年龄: seed.年龄,
                生日: seed.生日,
                是否队友: true,
                是否主要角色: true,
                关系状态: 取文本(npc?.关系状态, seed.关系状态) || seed.关系状态
            };
            return;
        }
        next.push(npc);
    });

    return [merged || seed, ...next];
};
