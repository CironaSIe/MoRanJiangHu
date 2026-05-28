import type {
    OpeningConfig,
    初始伙伴配置结构,
    同人角色替换规则结构,
    游戏难度,
    初始关系模板类型,
    关系侧重类型,
    开局切入偏好类型,
    题材模式类型,
    同人来源类型,
    同人融合强度类型
} from '../types';
import { 获取题材模式配置, 获取题材模式选项, 规范化题材模式 } from './topicModeProfiles';

export const 新开局步骤列表 = ['世界观', '天赋背景', '角色基础', '开局伙伴', '开局配置', '确认生成'] as const;

export const 属性键列表 = ['力量', '敏捷', '体质', '根骨', '悟性', '福源'] as const;
export const 默认属性值 = 3;
export const 属性最小值 = 3;
export const 属性最大值 = 10;
export type 属性分配结构 = Record<typeof 属性键列表[number], number>;

export type 难度设定结构 = {
    id: 游戏难度;
    label: string;
    shortLabel: string;
    description: string;
    起始属性点: number;
    天赋重Roll次数: number;
    判定修正: number;
    敌方强度: string;
    资源压力: string;
    失败代价: string;
    推荐人群: string;
};

export const 难度设定表: Record<游戏难度, 难度设定结构> = {
    relaxed: {
        id: 'relaxed',
        label: '轻松',
        shortLabel: '剧情模式',
        description: '适合先看世界、轻松体验剧情推进，资源与失败压力最低。',
        起始属性点: 38,
        天赋重Roll次数: 12,
        判定修正: 3,
        敌方强度: '敌人更保守，跨级压力下降',
        资源压力: '经验、掉落与恢复更宽松',
        失败代价: '多为轻伤、少量损耗或可补救后果',
        推荐人群: '想体验剧情、探索设定或测试新开局'
    },
    easy: {
        id: 'easy',
        label: '简单',
        shortLabel: '稳健养成',
        description: '适合正常养成但保留较高容错，资源循环比较顺。',
        起始属性点: 34,
        天赋重Roll次数: 8,
        判定修正: 1,
        敌方强度: '敌人略弱，普通冲突更好处理',
        资源压力: '收益略高，物价略低，恢复较稳定',
        失败代价: '会受伤或损失资源，但大多能补救',
        推荐人群: '第一次正式开档或想少一点折磨'
    },
    normal: {
        id: 'normal',
        label: '正常',
        shortLabel: '标准江湖',
        description: '标准体验，强调风险、收益、关系与代价之间的平衡。',
        起始属性点: 30,
        天赋重Roll次数: 5,
        判定修正: 0,
        敌方强度: '敌人按标准强度行动',
        资源压力: '收益与消耗按标准江湖压力结算',
        失败代价: '失败会带来伤势、关系或剧情门控损失',
        推荐人群: '想体验默认平衡的长期存档'
    },
    hard: {
        id: 'hard',
        label: '困难',
        shortLabel: '高压实战',
        description: '更看重路线规划、补给、人情和战术判断，失误更疼。',
        起始属性点: 26,
        天赋重Roll次数: 3,
        判定修正: -1,
        敌方强度: '敌人更积极，攻防与追击压力提升',
        资源压力: '收益减少，物价偏高，恢复更慢',
        失败代价: '更容易留下长期后遗症或丢失关键机会',
        推荐人群: '熟悉系统后想要更硬的生存压力'
    },
    extreme: {
        id: 'extreme',
        label: '极限',
        shortLabel: '残酷求生',
        description: '高风险挑战，任何错误都可能滚成不可逆后果。',
        起始属性点: 22,
        天赋重Roll次数: 1,
        判定修正: -3,
        敌方强度: '敌人强势且世界反应更严酷',
        资源压力: '收益稀缺，消耗和物价压力最高',
        失败代价: '可能触发重伤、残废、清算或主线断裂',
        推荐人群: '想要硬核求生和高失败代价'
    }
};

export const 难度总属性点映射: Record<游戏难度, number> = {
    relaxed: 难度设定表.relaxed.起始属性点,
    easy: 难度设定表.easy.起始属性点,
    normal: 难度设定表.normal.起始属性点,
    hard: 难度设定表.hard.起始属性点,
    extreme: 难度设定表.extreme.起始属性点
};

export const 获取难度设定 = (difficulty?: 游戏难度): 难度设定结构 => (
    难度设定表[difficulty || 'normal'] || 难度设定表.normal
);

export const 初始关系模板选项: Array<{ value: 初始关系模板类型; label: string; hint: string }> = [
    { value: '独行少系', label: '独行少系', hint: '初始社交网收束为 1~2 人，更偏向孤身闯荡。' },
    { value: '家族牵引', label: '家族牵引', hint: '优先生成家人、族人、旧宅与家业压力。' },
    { value: '师门牵引', label: '师门牵引', hint: '优先生成师父、同门、门规与门内承接。' },
    { value: '世家官门', label: '世家官门', hint: '偏向门第、人脉、礼法与现实资源网络。' },
    { value: '青梅旧识', label: '青梅旧识', hint: '优先生成旧交、故人和情感承接线。' },
    { value: '旧仇旧债', label: '旧仇旧债', hint: '开局社会关系带着旧账、旧怨与压力源。' }
];

export const 关系侧重选项: Array<{ value: 关系侧重类型; label: string }> = [
    { value: '亲情', label: '亲情' },
    { value: '友情', label: '友情' },
    { value: '师门', label: '师门' },
    { value: '情缘', label: '情缘' },
    { value: '利益', label: '利益' },
    { value: '仇怨', label: '仇怨' }
];

export const 开局切入偏好选项: Array<{ value: 开局切入偏好类型; label: string; hint: string }> = [
    { value: '日常低压', label: '日常低压', hint: '优先从生活流、环境感和轻关系起步。' },
    { value: '在途起手', label: '在途起手', hint: '开局落在赶路、渡口、驿路、山道等途中场景。' },
    { value: '家宅起手', label: '家宅起手', hint: '优先落在卧房、院落、铺面、旧宅等内场。' },
    { value: '门派起手', label: '门派起手', hint: '优先落在山门、偏院、堂口、习武地等门派场景。' },
    { value: '风波前夜', label: '风波前夜', hint: '允许有将起未起的异动，但仍保持第一幕克制。' }
];

export type 题材开局配置文案 = {
    intro: string;
    relationHelper: string;
    organizationEnabled: boolean;
    organizationTitle: string;
    organizationDescription: string;
    memberTitle: string;
    memberDescription: string;
    organizationOffHint: string;
    relationLabels: Partial<Record<关系侧重类型, string>>;
    cutInLabels: Partial<Record<开局切入偏好类型, { label: string; hint: string }>>;
    promptBoundary: string;
};

export const 获取题材开局配置文案 = (mode?: 题材模式类型): 题材开局配置文案 => {
    const profile = 获取题材模式配置(mode);
    if (profile.group === 'apocalypse') {
        return {
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式；末日题材会按幸存者语境生成关系与场景。',
            relationHelper: '会优先影响初始幸存者关系网的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成营地',
            organizationDescription: '开启后第0回合会生成可承接的营地、避难所、车队、军方残部或幸存者小队。',
            memberTitle: '开局生成队友',
            memberDescription: '开启后生成初始队友、营地成员、临时同行者或幸存者关系名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '队伍', 友情: '互助', 利益: '物资', 仇怨: '冲突' },
            cutInLabels: {
                在途起手: { label: '转移起手', hint: '开局落在转移、搜刮、撤离、车队或封锁线附近。' },
                家宅起手: { label: '避难点起手', hint: '优先落在家中、避难所、仓库、药房或临时安全屋。' },
                门派起手: { label: '营地起手', hint: '优先落在幸存者营地、临时据点、军方残部或安全区边缘。' }
            },
            promptBoundary: '末日丧尸开局不得生成古代门派、宗门、师门、同门、山门、藏经阁或门派贡献语感；兼容变量 `玩家门派` 只能承载营地、避难所、车队、军方残部、医疗点、黑市网络或幸存者小队。'
        };
    }
    if (profile.group === 'modern') {
        return {
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式；现代都市会按现实社会语境生成关系与场景。',
            relationHelper: '会优先影响初始现实社交网、职场/家庭/城市关系的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成组织',
            organizationDescription: '开启后第0回合会生成可承接的公司、学校、社区、项目组、门店或合作团队。',
            memberTitle: '开局生成成员',
            memberDescription: '开启后生成联系人、同事、亲友、邻里、合作对象或组织成员名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '职场', 情缘: '情感', 利益: '合作', 仇怨: '矛盾' },
            cutInLabels: {
                在途起手: { label: '通勤起手', hint: '开局落在通勤、出差、路口、地铁、网约车或城市移动途中。' },
                家宅起手: { label: '住处起手', hint: '优先落在出租屋、家中、小区、店铺或办公室。' },
                门派起手: { label: '组织起手', hint: '优先落在公司、学校、社区、项目组、门店或合作现场。' }
            },
            promptBoundary: '现代都市开局不得生成古代门派、宗门、师门、同门、山门、藏经阁、门派贡献或江湖门派任务；兼容变量 `玩家门派` 只能承载公司、学校、社区、家庭、媒体、项目组、店铺、合作团队等现实社会结构。'
        };
    }
    if (profile.group === 'urban_xianxia') {
        return {
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和隐秘组织/同道生成。',
            relationHelper: '会优先影响初始社交网、现实身份与隐秘圈层的情绪结构。',
            organizationEnabled: true,
            organizationTitle: profile.value === '灵气复苏' ? '开局生成机构' : '开局生成隐门',
            organizationDescription: profile.value === '灵气复苏'
                ? '开启后可生成研究小组、临时管控机构、觉醒者互助点或异常处理小队，而不是古代门派。'
                : '开启后可生成隐秘修行家族、暗线组织、同道据点或都市隐门。',
            memberTitle: profile.value === '灵气复苏' ? '开局生成协作者' : '开局生成同道',
            memberDescription: profile.value === '灵气复苏'
                ? '开启后生成协作者、调查员、研究员、觉醒者同伴或互助者名录。'
                : '开启后生成同道、师承联系人、家族成员或暗线伙伴名录。',
            organizationOffHint: '',
            relationLabels: { 师门: profile.value === '灵气复苏' ? '机构' : '隐门', 利益: '资源', 仇怨: '旧怨' },
            cutInLabels: {
                在途起手: { label: '城市途中', hint: '开局落在通勤、调查、转移、赶赴异常点或城市途中场景。' },
                家宅起手: { label: '住处起手', hint: '优先落在住处、学校、医院、公司、店铺或家族据点。' },
                门派起手: { label: profile.value === '灵气复苏' ? '机构起手' : '隐门起手', hint: profile.value === '灵气复苏' ? '优先落在研究机构、管控点、互助点或异常处理现场。' : '优先落在隐门据点、家族内场、暗市入口或修行圈碰头处。' }
            },
            promptBoundary: '现代/都市修行题材不得把普通社会直接写成古代山门宗门；若生成组织，必须贴合研究机构、管控点、隐秘家族、暗市、公司学校或都市据点等现代场景。'
        };
    }
    if (profile.group === 'xianxia') {
        return {
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和宗门/同道生成。',
            relationHelper: '会优先影响初始修真社交网的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成宗门',
            organizationDescription: '开启后第0回合会直接拥有可用宗门、仙坊或修真势力承接。',
            memberTitle: '开局生成同道',
            memberDescription: '开启后会生成师长、同门、道友或宗门外缘人物名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '宗门' },
            cutInLabels: {
                在途起手: { label: '行旅起手', hint: '开局落在赶路、飞舟、坊市路口、山道或秘境入口途中。' },
                家宅起手: { label: '洞府起手', hint: '优先落在洞府、院落、仙坊住处、家族旧宅等内场。' },
                门派起手: { label: '宗门起手', hint: '优先落在山门、外门院、讲经堂、演法台或宗门任务现场。' }
            },
            promptBoundary: '仙侠开局可以生成宗门、师长、同门、道友与坊市关系，但应使用修真/宗门语境，不要写成现代公司或末日营地。'
        };
    }
    return {
        intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和初始门派生成。',
        relationHelper: '会优先影响初始社交网的情绪结构。',
        organizationEnabled: true,
        organizationTitle: '开局生成门派',
        organizationDescription: '开启后第0回合会直接拥有可用门派，而不是只靠旧存档兜底。',
        memberTitle: '开局生成同门',
        memberDescription: '开启后会生成多层次同门名录，少数主要角色加若干普通同门。',
        organizationOffHint: '',
        relationLabels: {},
        cutInLabels: {},
        promptBoundary: '武侠开局可以生成门派、师门、同门、帮会或江湖关系，但不要越界写成仙侠宗门飞升、现代公司制度或末日营地。'
    };
};

export const 获取题材关系侧重选项 = (mode?: 题材模式类型): Array<{ value: 关系侧重类型; label: string }> => {
    const copy = 获取题材开局配置文案(mode);
    return 关系侧重选项.map((item) => ({ ...item, label: copy.relationLabels[item.value] || item.label }));
};

export const 获取题材开局切入偏好选项 = (mode?: 题材模式类型): Array<{ value: 开局切入偏好类型; label: string; hint: string }> => {
    const copy = 获取题材开局配置文案(mode);
    return 开局切入偏好选项.map((item) => ({ ...item, ...(copy.cutInLabels[item.value] || {}) }));
};

export const 题材模式选项: Array<{ value: 题材模式类型; label: string; hint: string }> = 获取题材模式选项();

export const 同人来源类型选项: Array<{ value: 同人来源类型; label: string }> = [
    { value: '小说', label: '小说' },
    { value: '动漫', label: '动漫' },
    { value: '游戏', label: '游戏' },
    { value: '影视', label: '影视' }
];

export const 同人融合强度选项: Array<{ value: 同人融合强度类型; label: string; hint: string }> = [
    { value: '轻度映射', label: '轻度映射', hint: '只借设定气质与世界母题，不直接搬角色。' },
    { value: '中度混编', label: '中度混编', hint: '允许部分势力、设定和风格直接进入原创世界。' },
    { value: '显性同台', label: '显性同台', hint: '允许原著角色或势力直接以世界母本形式存在。' }
];

export const 默认开局配置 = (): OpeningConfig => ({
    配置约束启用: true,
    题材模式: '武侠',
    初始关系模板: '师门牵引',
    关系侧重: ['师门', '友情'],
    开局切入偏好: '日常低压',
    开局生成门派: true,
    开局生成同门: true,
    初始伙伴: 默认初始伙伴配置(),
    同人融合: {
        enabled: false,
        作品名: '',
        来源类型: '小说',
        融合强度: '轻度映射',
        保留原著角色: false,
        启用角色替换: false,
        替换目标角色名: '',
        附加替换角色名列表: [],
        附加角色替换规则列表: [],
        启用附加小说: false,
        附加小说数据集ID: ''
    }
});

export const 默认初始伙伴配置 = (): 初始伙伴配置结构 => ({
    enabled: true,
    头像图片URL: '',
    图片档案: undefined,
    姓名: '',
    性别: '女',
    年龄: 18,
    出生月: 1,
    出生日: 1,
    外貌: '眉眼清亮，衣着利落，随身带着惯用行囊。',
    性格: '稳重可靠，重诺守信，遇事会主动提醒主角风险。',
    属性: 创建默认属性分配(),
    背景名称: '',
    背景描述: '',
    背景效果: '',
    天赋列表: [],
    关系: '自幼相识的同行伙伴',
    备注: ''
});

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const 角色替换名称分隔正则 = /[\r\n,，、;；]+/u;

export const 规范化角色替换名称列表 = (value: unknown): string[] => {
    const rawList = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(角色替换名称分隔正则)
            : [];
    const result: string[] = [];
    const seen = new Set<string>();
    rawList.forEach((item) => {
        const name = 读取文本(item);
        if (!name || seen.has(name)) return;
        seen.add(name);
        result.push(name);
    });
    return result;
};

export const 规范化角色替换规则列表 = (value: unknown): 同人角色替换规则结构[] => {
    const source = Array.isArray(value) ? value : [];
    const result: 同人角色替换规则结构[] = [];
    source.forEach((item) => {
        const 原名称 = 读取文本((item as 同人角色替换规则结构 | null | undefined)?.原名称);
        const 替换为 = 读取文本((item as 同人角色替换规则结构 | null | undefined)?.替换为);
        if (!原名称 || !替换为) return;
        result.push({ 原名称, 替换为 });
    });
    return result;
};

export const 获取同人角色替换规则列表 = (
    config?: OpeningConfig | null,
    playerName?: string
): 同人角色替换规则结构[] => {
    const ruleMap = new Map<string, string>();
    const resolvedPlayerName = 读取文本(playerName);
    const 写入规则 = (原名称: unknown, 替换为: unknown) => {
        const sourceName = 读取文本(原名称);
        const replacementName = 读取文本(替换为);
        if (!sourceName || !replacementName || sourceName === replacementName) return;
        ruleMap.set(sourceName, replacementName);
    };

    写入规则(config?.同人融合?.替换目标角色名, resolvedPlayerName);
    规范化角色替换名称列表(config?.同人融合?.附加替换角色名列表)
        .forEach((name) => 写入规则(name, resolvedPlayerName));
    规范化角色替换规则列表(config?.同人融合?.附加角色替换规则列表)
        .forEach((rule) => 写入规则(rule.原名称, rule.替换为));

    return Array.from(ruleMap.entries()).map(([原名称, 替换为]) => ({ 原名称, 替换为 }));
};

export const 格式化角色替换规则摘要 = (
    rules: 同人角色替换规则结构[],
    options?: { maxItems?: number }
): string => {
    const list = 规范化角色替换规则列表(rules).map((rule) => `${rule.原名称} -> ${rule.替换为}`);
    if (list.length <= 0) return '';
    const maxItems = Math.max(1, Math.floor(options?.maxItems || 3));
    if (list.length <= maxItems) return list.join('；');
    return `${list.slice(0, maxItems).join('；')} 等${list.length}项`;
};

export const 获取难度总属性点 = (difficulty?: 游戏难度): number => (
    获取难度设定(difficulty).起始属性点
);

export const 创建默认属性分配 = (): 属性分配结构 => ({
    力量: 默认属性值,
    敏捷: 默认属性值,
    体质: 默认属性值,
    根骨: 默认属性值,
    悟性: 默认属性值,
    福源: 默认属性值
});

export const 计算属性总点数 = (attributes: Partial<属性分配结构>): number => (
    属性键列表.reduce((sum, key) => sum + (Number.isFinite(attributes[key]) ? Number(attributes[key]) : 默认属性值), 0)
);

export const 创建平均属性分配 = (totalBudget: number): 属性分配结构 => {
    const next = 创建默认属性分配();
    let remaining = Math.max(0, Math.floor(totalBudget) - 计算属性总点数(next));
    let index = 0;
    while (remaining > 0 && 属性键列表.some((key) => next[key] < 属性最大值)) {
        const key = 属性键列表[index % 属性键列表.length];
        if (next[key] < 属性最大值) {
            next[key] += 1;
            remaining -= 1;
        }
        index += 1;
    }
    return next;
};

export const 创建随机属性分配 = (totalBudget: number, random: () => number = Math.random): 属性分配结构 => {
    const next = 创建默认属性分配();
    let remaining = Math.max(0, Math.floor(totalBudget) - 计算属性总点数(next));
    while (remaining > 0 && 属性键列表.some((key) => next[key] < 属性最大值)) {
        const availableKeys = 属性键列表.filter((key) => next[key] < 属性最大值);
        const key = availableKeys[Math.floor(random() * availableKeys.length)] || availableKeys[0];
        next[key] += 1;
        remaining -= 1;
    }
    return next;
};

const 规范化属性分配 = (value: any) => {
    const fallback = 创建默认属性分配();
    const result = { ...fallback };
    属性键列表.forEach((key) => {
        const num = Number(value?.[key]);
        result[key] = Number.isFinite(num)
            ? Math.max(属性最小值, Math.min(属性最大值, Math.floor(num)))
            : fallback[key];
    });
    return result;
};

const 规范化天赋列表 = (value: unknown): 初始伙伴配置结构['天赋列表'] => (
    Array.isArray(value)
        ? value
            .map((item: any) => ({
                名称: 读取文本(item?.名称),
                描述: 读取文本(item?.描述),
                效果: 读取文本(item?.效果)
            }))
            .filter((item) => item.名称 && item.描述 && item.效果)
            .slice(0, 3)
        : []
);

export const 规范化初始伙伴配置 = (raw?: any): 初始伙伴配置结构 => {
    const fallback = 默认初始伙伴配置();
    return {
        enabled: raw?.enabled !== false,
        头像图片URL: 读取文本(raw?.头像图片URL),
        图片档案: raw?.图片档案 && typeof raw.图片档案 === 'object' && !Array.isArray(raw.图片档案)
            ? raw.图片档案
            : undefined,
        姓名: 读取文本(raw?.姓名),
        性别: 读取文本(raw?.性别) || fallback.性别,
        年龄: Number.isFinite(Number(raw?.年龄)) ? Math.max(1, Math.floor(Number(raw.年龄))) : fallback.年龄,
        出生月: Number.isFinite(Number(raw?.出生月)) ? Math.max(1, Math.min(12, Math.floor(Number(raw.出生月)))) : fallback.出生月,
        出生日: Number.isFinite(Number(raw?.出生日)) ? Math.max(1, Math.min(30, Math.floor(Number(raw.出生日)))) : fallback.出生日,
        外貌: 读取文本(raw?.外貌) || fallback.外貌,
        性格: 读取文本(raw?.性格) || fallback.性格,
        属性: 规范化属性分配(raw?.属性),
        背景名称: 读取文本(raw?.背景名称),
        背景描述: 读取文本(raw?.背景描述),
        背景效果: 读取文本(raw?.背景效果),
        天赋列表: 规范化天赋列表(raw?.天赋列表),
        关系: 读取文本(raw?.关系) || fallback.关系,
        备注: 读取文本(raw?.备注)
    };
};

export const 规范化开局配置 = (raw?: any): OpeningConfig => {
    const fallback = 默认开局配置();
    const 题材模式 = 规范化题材模式(raw?.题材模式 || fallback.题材模式);
    const 初始关系模板 = 初始关系模板选项.some((item) => item.value === raw?.初始关系模板)
        ? raw.初始关系模板
        : fallback.初始关系模板;
    const 关系侧重 = Array.isArray(raw?.关系侧重)
        ? raw.关系侧重
            .map((item: unknown) => 读取文本(item))
            .filter((item: string): item is 关系侧重类型 => 关系侧重选项.some((option) => option.value === item))
            .slice(0, 2)
        : fallback.关系侧重;
    const 开局切入偏好 = 开局切入偏好选项.some((item) => item.value === raw?.开局切入偏好)
        ? raw.开局切入偏好
        : fallback.开局切入偏好;
    const 来源类型 = 同人来源类型选项.some((item) => item.value === raw?.同人融合?.来源类型)
        ? raw.同人融合.来源类型
        : fallback.同人融合.来源类型;
    const 融合强度 = 同人融合强度选项.some((item) => item.value === raw?.同人融合?.融合强度)
        ? raw.同人融合.融合强度
        : fallback.同人融合.融合强度;
    const 同人融合启用 = raw?.同人融合?.enabled === true;
    const 启用附加小说 = 同人融合启用 && raw?.同人融合?.启用附加小说 === true;

    return {
        配置约束启用: raw?.配置约束启用 !== false,
        题材模式,
        初始关系模板,
        关系侧重: 关系侧重.length > 0 ? 关系侧重 : fallback.关系侧重,
        开局切入偏好,
        开局生成门派: raw?.开局生成门派 !== false,
        开局生成同门: raw?.开局生成同门 !== false,
        初始伙伴: 规范化初始伙伴配置(raw?.初始伙伴 ?? fallback.初始伙伴),
        同人融合: {
            enabled: 同人融合启用,
            作品名: 读取文本(raw?.同人融合?.作品名),
            来源类型,
            融合强度,
            保留原著角色: raw?.同人融合?.保留原著角色 === true,
            启用角色替换: raw?.同人融合?.启用角色替换 === true,
            替换目标角色名: 读取文本(raw?.同人融合?.替换目标角色名),
            附加替换角色名列表: 规范化角色替换名称列表(raw?.同人融合?.附加替换角色名列表),
            附加角色替换规则列表: 规范化角色替换规则列表(raw?.同人融合?.附加角色替换规则列表),
            启用附加小说,
            附加小说数据集ID: 启用附加小说 ? 读取文本(raw?.同人融合?.附加小说数据集ID) : ''
        }
    };
};

export const 规范化可选开局配置 = (raw?: any): OpeningConfig | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    return 规范化开局配置(raw);
};
