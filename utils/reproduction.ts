import { normalizeCanonicalGameTime, 环境时间转标准串, 结构化时间转标准串 } from '../hooks/useGame/timeUtils';

type 标准时间片段 = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

export type 孕产推进选项 = {
    当前时间?: unknown;
    事件文本?: string;
    父亲姓名?: string;
};

const 每月天数 = 31;
const 每年天数 = 12 * 每月天数;
const 默认周期天数 = 28;
const 默认生理期天数 = 5;
const 默认怀胎天数 = 10 * 每月天数;

const 月份中文 = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const 男孩名 = ['承安', '怀瑾', '临川', '照尘', '知远', '明砚'];
const 女孩名 = ['清宁', '望舒', '明珠', '云笙', '知微', '若棠'];

const 取文本 = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const 限制整数 = (value: unknown, fallback: number, min: number, max: number): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(n)));
};

const two = (value: number): string => Math.trunc(value).toString().padStart(2, '0');

const 稳定哈希数字 = (text: string): number => {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const 稳定随机 = (seed: string): number => 稳定哈希数字(seed) / 0xffffffff;

export const 规范化孕产时间 = (input?: unknown): string | null => {
    if (typeof input === 'string') return normalizeCanonicalGameTime(input) || null;
    return 环境时间转标准串(input) || 结构化时间转标准串(input) || null;
};

const 解析中文小数字 = (value: string): number | null => {
    const text = value.trim();
    if (/^\d+$/.test(text)) return Number(text);
    const map: Record<string, number> = {
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
        十: 10
    };
    if (map[text]) return map[text];
    if (/^十[一二两三四五六七八九]$/.test(text)) return 10 + (map[text.slice(1)] || 0);
    if (/^[一二两三四五六七八九]十$/.test(text)) return (map[text.slice(0, 1)] || 0) * 10;
    if (/^[一二两三四五六七八九]十[一二两三四五六七八九]$/.test(text)) {
        return (map[text.slice(0, 1)] || 0) * 10 + (map[text.slice(2)] || 0);
    }
    return null;
};

const 提取体内射精次数 = (text: string): number => {
    const source = text.replace(/\s+/g, '');
    if (!source) return 1;
    const patterns = [
        /(?:内射|中出|射进|射入|体内射精)[^。！？\n\r]{0,12}(\d+|[一二两三四五六七八九十]{1,3})次/u,
        /(\d+|[一二两三四五六七八九十]{1,3})次[^。！？\n\r]{0,12}(?:内射|中出|射进|射入|体内射精)/u
    ];
    for (const pattern of patterns) {
        const match = source.match(pattern);
        const count = match?.[1] ? 解析中文小数字(match[1]) : null;
        if (count && count > 0) return 限制整数(count, 1, 1, 30);
    }
    if (/(?:多次|数次|反复|一再)(?:[^。！？\n\r]{0,12})?(?:内射|中出|射进|射入|体内射精)|(?:内射|中出|射进|射入|体内射精)(?:[^。！？\n\r]{0,12})?(?:多次|数次|反复|一再)/u.test(source)) {
        return 3;
    }
    return 1;
};

const 解析标准时间 = (input?: unknown): 标准时间片段 | null => {
    const canonical = 规范化孕产时间(input);
    if (!canonical) return null;
    const match = canonical.match(/^(\d{1,6}):(\d{2}):(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5])
    };
};

const 时间转分钟值 = (input?: unknown): number | null => {
    const parsed = 解析标准时间(input);
    if (!parsed) return null;
    return (((((parsed.year - 1) * 12) + (parsed.month - 1)) * 每月天数 + (parsed.day - 1)) * 24 + parsed.hour) * 60 + parsed.minute;
};

const 分钟值转时间 = (minutesValue: number): string => {
    const safeMinutes = Math.max(0, Math.trunc(minutesValue));
    const totalDays = Math.floor(safeMinutes / (24 * 60));
    const minuteOfDay = safeMinutes % (24 * 60);
    const year = Math.floor(totalDays / 每年天数) + 1;
    const dayOfYear = totalDays % 每年天数;
    const month = Math.floor(dayOfYear / 每月天数) + 1;
    const day = (dayOfYear % 每月天数) + 1;
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    return `${year}:${two(month)}:${two(day)}:${two(hour)}:${two(minute)}`;
};

export const 游戏时间加天数 = (input: unknown, days: number): string | null => {
    const minutes = 时间转分钟值(input);
    if (minutes == null) return null;
    return 分钟值转时间(minutes + Math.trunc(days) * 24 * 60);
};

const 比较游戏时间 = (left: unknown, right: unknown): number | null => {
    const l = 时间转分钟值(left);
    const r = 时间转分钟值(right);
    if (l == null || r == null) return null;
    return l - r;
};

const 间隔天数 = (left: unknown, right: unknown): number | null => {
    const l = 时间转分钟值(left);
    const r = 时间转分钟值(right);
    if (l == null || r == null) return null;
    return Math.floor((l - r) / (24 * 60));
};

const 读取周期基准时间 = (npc: any, womb: any, currentTime: string): string => {
    const cycle = womb?.生理周期 && typeof womb.生理周期 === 'object' ? womb.生理周期 : {};
    const explicit = 规范化孕产时间(cycle?.上次开始日期 || cycle?.基准日期 || npc?.生日);
    if (explicit) return explicit;
    const current = 解析标准时间(currentTime);
    const offset = 稳定哈希数字(`${npc?.id || ''}|${npc?.姓名 || ''}|cycle`) % 默认周期天数;
    const base = current ? `${current.year}:01:01:00:00` : '1:01:01:00:00';
    return 游戏时间加天数(base, offset) || base;
};

export const 推断生理周期 = (
    npc: any,
    womb: any,
    eventTime: unknown,
    eventText?: string
): { 是否生理期: boolean; 周期第几天: number; 周期天数: number; 生理期天数: number; 基准日期: string } => {
    const cycle = womb?.生理周期 && typeof womb.生理周期 === 'object' ? womb.生理周期 : {};
    const 周期天数 = 限制整数(cycle?.周期天数, 默认周期天数, 18, 60);
    const 生理期天数 = 限制整数(cycle?.生理期天数, 默认生理期天数, 1, Math.min(10, 周期天数));
    const textMarked = /(?:生理期|经期|月事|行经|癸水|天癸|排卵期|受孕期)/u.test(eventText || '');
    const currentTime = 规范化孕产时间(eventTime);
    if (!currentTime) {
        return {
            是否生理期: textMarked,
            周期第几天: 0,
            周期天数,
            生理期天数,
            基准日期: '未知时间'
        };
    }
    const 基准日期 = 读取周期基准时间(npc, womb, currentTime);
    const diff = 间隔天数(currentTime, 基准日期);
    const 周期第几天 = diff == null ? 0 : ((diff % 周期天数) + 周期天数) % 周期天数;
    return {
        是否生理期: textMarked || 周期第几天 < 生理期天数,
        周期第几天,
        周期天数,
        生理期天数,
        基准日期
    };
};

export const 计算受孕概率 = (params: { 次数?: number; 是否生理期?: boolean }): number => {
    const count = 限制整数(params.次数, 1, 1, 30);
    if (!params.是否生理期) return 0;
    const probability = 1 - Math.pow(1 - 0.12, count);
    return Math.max(0, Math.min(0.85, Number(probability.toFixed(4))));
};

const 标准化内射记录 = (item: any): any | null => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const 日期 = 规范化孕产时间(item?.日期) || 取文本(item?.日期) || '未知时间';
    const 怀孕判定日 = 规范化孕产时间(item?.怀孕判定日) || 取文本(item?.怀孕判定日) || 日期;
    const 描述 = 取文本(item?.描述);
    if (!日期 && !描述 && !怀孕判定日) return null;
    return {
        日期,
        描述,
        怀孕判定日,
        次数: 限制整数(item?.次数, 1, 1, 30),
        ...(typeof item?.是否生理期 === 'boolean' ? { 是否生理期: item.是否生理期 } : {}),
        ...(Number.isFinite(Number(item?.受孕概率)) ? { 受孕概率: Math.max(0, Math.min(1, Number(item.受孕概率))) } : {}),
        ...(取文本(item?.父亲姓名) ? { 父亲姓名: 取文本(item.父亲姓名) } : {}),
        ...(取文本(item?.判定结果) ? { 判定结果: 取文本(item.判定结果) } : {}),
        ...(取文本(item?.受孕时间) ? { 受孕时间: 取文本(item.受孕时间) } : {})
    };
};

export const 合并内射记录值 = (leftRaw?: any, rightRaw?: any): any[] => {
    const merged = new Map<string, any>();
    const pushList = (raw: any) => {
        if (!Array.isArray(raw)) return;
        raw.forEach((item) => {
            const normalized = 标准化内射记录(item);
            if (!normalized) return;
            const key = `${normalized.日期}__${normalized.描述}`;
            const previous = merged.get(key);
            merged.set(key, previous ? { ...previous, ...normalized } : normalized);
        });
    };
    pushList(leftRaw);
    pushList(rightRaw);
    return Array.from(merged.values());
};

const 标准化生理周期 = (raw: any): any => {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return {
        周期天数: 限制整数(source?.周期天数, 默认周期天数, 18, 60),
        生理期天数: 限制整数(source?.生理期天数, 默认生理期天数, 1, 10),
        ...(规范化孕产时间(source?.基准日期) ? { 基准日期: 规范化孕产时间(source.基准日期) } : {}),
        ...(规范化孕产时间(source?.上次开始日期) ? { 上次开始日期: 规范化孕产时间(source.上次开始日期) } : {})
    };
};

const 标准化妊娠档案 = (raw: any): any | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const 受孕时间 = 规范化孕产时间(raw?.受孕时间) || 取文本(raw?.受孕时间);
    const 预计生产时间 = 规范化孕产时间(raw?.预计生产时间) || 取文本(raw?.预计生产时间);
    if (!受孕时间 && !预计生产时间 && !取文本(raw?.状态)) return undefined;
    return {
        状态: 取文本(raw?.状态) || '妊娠一月',
        ...(受孕时间 ? { 受孕时间 } : {}),
        ...(预计生产时间 ? { 预计生产时间 } : {}),
        ...(取文本(raw?.父亲姓名) ? { 父亲姓名: 取文本(raw.父亲姓名) } : {}),
        ...(Number.isFinite(Number(raw?.受孕概率)) ? { 受孕概率: Math.max(0, Math.min(1, Number(raw.受孕概率))) } : {}),
        ...(Number.isFinite(Number(raw?.来源记录数)) ? { 来源记录数: Math.max(1, Math.trunc(Number(raw.来源记录数))) } : {}),
        ...(typeof raw?.已生产 === 'boolean' ? { 已生产: raw.已生产 } : {}),
        ...(规范化孕产时间(raw?.生产时间) ? { 生产时间: 规范化孕产时间(raw.生产时间) } : {}),
        ...(取文本(raw?.子嗣ID) ? { 子嗣ID: 取文本(raw.子嗣ID) } : {}),
        ...(取文本(raw?.子嗣姓名) ? { 子嗣姓名: 取文本(raw.子嗣姓名) } : {})
    };
};

const 标准化生产记录 = (raw: any): any[] => (
    Array.isArray(raw)
        ? raw.map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
            const 生产时间 = 规范化孕产时间(item?.生产时间) || 取文本(item?.生产时间);
            const 子嗣ID = 取文本(item?.子嗣ID);
            if (!生产时间 && !子嗣ID) return null;
            return {
                生产时间: 生产时间 || '未知时间',
                ...(子嗣ID ? { 子嗣ID } : {}),
                ...(取文本(item?.子嗣姓名) ? { 子嗣姓名: 取文本(item.子嗣姓名) } : {}),
                ...(取文本(item?.父亲姓名) ? { 父亲姓名: 取文本(item.父亲姓名) } : {})
            };
        }).filter(Boolean)
        : []
);

export const 标准化子宫档案值 = (raw: any): any | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const 妊娠 = 标准化妊娠档案(raw?.妊娠);
    const 产后记录 = 标准化生产记录(raw?.产后记录);
    return {
        状态: 取文本(raw?.状态) || (妊娠 && !妊娠.已生产 ? 妊娠.状态 : '未受孕'),
        宫口状态: 取文本(raw?.宫口状态) || '稳定',
        生理周期: 标准化生理周期(raw?.生理周期),
        内射记录: 合并内射记录值(raw?.内射记录),
        ...(妊娠 ? { 妊娠 } : {}),
        ...(产后记录.length > 0 ? { 产后记录 } : {})
    };
};

export const 合并子宫档案值 = (leftRaw: any, rightRaw: any): any | undefined => {
    const left = 标准化子宫档案值(leftRaw);
    const right = 标准化子宫档案值(rightRaw);
    if (!left && !right) return undefined;
    const records = 合并内射记录值(left?.内射记录, right?.内射记录);
    const rightPregnancy = right?.妊娠;
    const leftPregnancy = left?.妊娠;
    const 妊娠 = rightPregnancy && !rightPregnancy.已生产
        ? rightPregnancy
        : (leftPregnancy && !leftPregnancy.已生产 ? leftPregnancy : (rightPregnancy || leftPregnancy));
    const 产后记录 = 标准化生产记录([...(left?.产后记录 || []), ...(right?.产后记录 || [])])
        .filter((item, index, list) => list.findIndex((candidate) => candidate.子嗣ID === item.子嗣ID && candidate.生产时间 === item.生产时间) === index);
    return {
        状态: 取文本(right?.状态) || 取文本(left?.状态) || '未受孕',
        宫口状态: 取文本(right?.宫口状态) || 取文本(left?.宫口状态) || '稳定',
        生理周期: { ...(left?.生理周期 || {}), ...(right?.生理周期 || {}) },
        内射记录: records,
        ...(妊娠 ? { 妊娠 } : {}),
        ...(产后记录.length > 0 ? { 产后记录 } : {})
    };
};

export const 构建体内射精记录 = (params: {
    npc: any;
    子宫?: any;
    日期: unknown;
    描述: string;
    父亲姓名?: string;
    事件文本?: string;
}): any => {
    const 日期 = 规范化孕产时间(params.日期) || 取文本(params.日期) || '未知时间';
    const cycle = 推断生理周期(params.npc, params.子宫 || {}, 日期, params.事件文本);
    const 次数 = 提取体内射精次数(`${params.描述 || ''} ${params.事件文本 || ''}`);
    return {
        日期,
        描述: params.描述,
        怀孕判定日: 日期,
        次数,
        是否生理期: cycle.是否生理期,
        受孕概率: 计算受孕概率({ 次数, 是否生理期: cycle.是否生理期 }),
        判定结果: '未判定',
        ...(取文本(params.父亲姓名) ? { 父亲姓名: 取文本(params.父亲姓名) } : {})
    };
};

const 是否女性可孕NPC = (npc: any): boolean => {
    const gender = 取文本(npc?.性别);
    const age = Number(npc?.年龄);
    return (gender === '女' || gender === '扶她') && Number.isFinite(age) && age >= 18;
};

const 妊娠月份状态 = (conceptionTime: string, currentTime: string): string => {
    const days = Math.max(0, 间隔天数(currentTime, conceptionTime) ?? 0);
    const month = Math.max(1, Math.min(10, Math.floor(days / 每月天数) + 1));
    return `妊娠${月份中文[month - 1] || '十'}月`;
};

const 时间加速正则 = /(?:时间|岁月|光阴|时光).{0,10}(?:加速|催化|压缩|秘法|阵法|法术)|(?:催生|催产|提前生育|提前生产)/u;
const 生产事实正则 = /(?:生产|分娩|临盆|诞下|产下|产子|产女|生下|出生|降生|催生|催产|提前生育|提前生产)/u;

const 构建子嗣ID = (mother: any, pregnancy: any, birthTime: string): string => {
    const seed = [mother?.id, mother?.姓名, pregnancy?.受孕时间, birthTime, pregnancy?.父亲姓名].map(取文本).join('|');
    return `child_${稳定哈希数字(seed).toString(36)}`;
};

const 构建子嗣姓名 = (mother: any, pregnancy: any, gender: string): string => {
    const father = 取文本(pregnancy?.父亲姓名);
    const motherName = 取文本(mother?.姓名);
    const surnameSource = /^[\u4e00-\u9fa5]{2,6}$/.test(father) && father !== '主角'
        ? father
        : motherName;
    const surname = surnameSource ? surnameSource.slice(0, 1) : '云';
    const pool = gender === '女' ? 女孩名 : 男孩名;
    return `${surname}${pool[稳定哈希数字(`${mother?.id}|${pregnancy?.受孕时间}|${gender}`) % pool.length]}`;
};

const 构建子嗣NPC = (mother: any, pregnancy: any, birthTime: string): any => {
    const gender = 稳定哈希数字(`${mother?.id}|${pregnancy?.受孕时间}|gender`) % 2 === 0 ? '男' : '女';
    const id = 构建子嗣ID(mother, pregnancy, birthTime);
    const name = 构建子嗣姓名(mother, pregnancy, gender);
    const motherName = 取文本(mother?.姓名) || '其母';
    const fatherName = 取文本(pregnancy?.父亲姓名) || '未知父亲';
    return {
        id,
        姓名: name,
        性别: gender,
        年龄: 0,
        生日: birthTime,
        境界: '未入道',
        身份: `${motherName}之${gender === '女' ? '女' : '子'}`,
        是否在场: mother?.是否在场 === true,
        是否队友: false,
        是否主要角色: false,
        好感度: 0,
        关系状态: '子嗣',
        简介: `${name}于${birthTime}出生，母亲为${motherName}，父亲为${fatherName}。`,
        记忆: [
            {
                时间: birthTime,
                内容: `出生于${birthTime}。`
            }
        ],
        当前位置: mother?.当前位置,
        当前地点: mother?.当前地点,
        位置路径: mother?.位置路径
    };
};

const 结算受孕 = (npc: any, womb: any, currentTime: string): any => {
    if (womb?.妊娠 && !womb.妊娠.已生产) return womb;
    const pending = (Array.isArray(womb?.内射记录) ? womb.内射记录 : [])
        .filter((record: any) => !record?.判定结果 || record.判定结果 === '未判定' || record.判定结果 === '待判定')
        .filter((record: any) => {
            const compare = 比较游戏时间(record?.怀孕判定日 || record?.日期, currentTime);
            return compare !== null && compare <= 0;
        });
    if (pending.length <= 0) return womb;

    const 生理期内记录 = pending.filter((record: any) => (
        record?.是否生理期 === true || 推断生理周期(npc, womb, record?.日期, record?.描述).是否生理期
    ));
    const count = 生理期内记录.reduce((sum: number, record: any) => sum + 限制整数(record?.次数, 1, 1, 30), 0);
    const probability = 计算受孕概率({ 次数: count, 是否生理期: 生理期内记录.length > 0 });
    const seed = [
        npc?.id,
        npc?.姓名,
        currentTime,
        ...pending.map((record: any) => `${record?.日期}:${record?.描述}:${record?.父亲姓名}`)
    ].join('|');
    const conceived = probability > 0 && 稳定随机(seed) <= probability;
    const conceptionRecord = 生理期内记录[0] || pending[0];
    const markedRecords = (womb.内射记录 || []).map((record: any) => {
        if (!pending.includes(record)) return record;
        return {
            ...record,
            是否生理期: record?.是否生理期 ?? 推断生理周期(npc, womb, record?.日期, record?.描述).是否生理期,
            受孕概率: probability,
            判定结果: conceived ? '已受孕' : '未受孕',
            ...(conceived ? { 受孕时间: conceptionRecord?.日期 || currentTime } : {})
        };
    });
    if (!conceived) return { ...womb, 内射记录: markedRecords, 状态: '未受孕' };

    const offset = (稳定哈希数字(seed) % 21) - 10;
    const 受孕时间 = 规范化孕产时间(conceptionRecord?.日期) || currentTime;
    const 预计生产时间 = 游戏时间加天数(受孕时间, 默认怀胎天数 + offset) || currentTime;
    const 妊娠 = {
        状态: 妊娠月份状态(受孕时间, currentTime),
        受孕时间,
        预计生产时间,
        父亲姓名: 取文本(conceptionRecord?.父亲姓名) || '主角',
        受孕概率: probability,
        来源记录数: pending.length,
        已生产: false
    };
    return {
        ...womb,
        状态: 妊娠.状态,
        宫口状态: '妊娠期闭合',
        内射记录: markedRecords,
        妊娠
    };
};

const 推进妊娠与生产 = (npc: any, womb: any, options: Required<孕产推进选项>): { npc: any; child?: any } => {
    const pregnancy = 标准化妊娠档案(womb?.妊娠);
    if (!pregnancy || pregnancy.已生产 || !pregnancy.受孕时间) return { npc: { ...npc, 子宫: womb } };
    const currentTime = 规范化孕产时间(options.当前时间) || pregnancy.预计生产时间 || pregnancy.受孕时间;
    const accelerated = 时间加速正则.test(options.事件文本);
    const explicitBirth = 生产事实正则.test(options.事件文本);
    const dueReached = pregnancy.预计生产时间 ? (比较游戏时间(currentTime, pregnancy.预计生产时间) ?? -1) >= 0 : false;
    const shouldBirth = dueReached || explicitBirth || (/催生|催产|提前生育|提前生产/u.test(options.事件文本) && accelerated);

    if (!shouldBirth && accelerated && pregnancy.预计生产时间) {
        const acceleratedDue = 游戏时间加天数(currentTime, 7) || currentTime;
        const keepOldDue = (比较游戏时间(acceleratedDue, pregnancy.预计生产时间) ?? 1) >= 0;
        const nextPregnancy = {
            ...pregnancy,
            状态: 妊娠月份状态(pregnancy.受孕时间, currentTime),
            预计生产时间: keepOldDue ? pregnancy.预计生产时间 : acceleratedDue,
            时间加速记录: `于${currentTime}受时间加速秘法影响，预产期提前。`
        };
        return { npc: { ...npc, 子宫: { ...womb, 状态: nextPregnancy.状态, 妊娠: nextPregnancy } } };
    }

    if (!shouldBirth) {
        const nextPregnancy = {
            ...pregnancy,
            状态: 妊娠月份状态(pregnancy.受孕时间, currentTime)
        };
        return { npc: { ...npc, 子宫: { ...womb, 状态: nextPregnancy.状态, 妊娠: nextPregnancy } } };
    }

    const child = 构建子嗣NPC(npc, pregnancy, currentTime);
    const birthRecord = {
        生产时间: currentTime,
        子嗣ID: child.id,
        子嗣姓名: child.姓名,
        父亲姓名: pregnancy.父亲姓名
    };
    const nextPregnancy = {
        ...pregnancy,
        状态: '已生产',
        已生产: true,
        生产时间: currentTime,
        子嗣ID: child.id,
        子嗣姓名: child.姓名
    };
    const nextWomb = {
        ...womb,
        状态: '产后恢复',
        宫口状态: '产后恢复',
        妊娠: nextPregnancy,
        产后记录: [...(womb.产后记录 || []), birthRecord]
            .filter((item, index, list) => list.findIndex((candidate) => candidate.子嗣ID === item.子嗣ID) === index)
    };
    return { npc: { ...npc, 子宫: nextWomb }, child };
};

export const 推进社交孕产状态 = (socialList: any[], options: 孕产推进选项): any[] => {
    if (!Array.isArray(socialList) || socialList.length <= 0) return socialList;
    const currentTime = 规范化孕产时间(options.当前时间) || '1:01:01:00:00';
    const fullOptions: Required<孕产推进选项> = {
        当前时间: currentTime,
        事件文本: options.事件文本 || '',
        父亲姓名: options.父亲姓名 || '主角'
    };
    const existingIds = new Set(socialList.map((npc: any) => 取文本(npc?.id)).filter(Boolean));
    const nextList: any[] = [];
    const children: any[] = [];

    socialList.forEach((npc) => {
        if (!npc || typeof npc !== 'object' || !是否女性可孕NPC(npc) || !npc.子宫) {
            nextList.push(npc);
            return;
        }
        const normalizedWomb = 标准化子宫档案值(npc.子宫);
        if (!normalizedWomb) {
            nextList.push(npc);
            return;
        }
        const judgedWomb = 结算受孕(npc, normalizedWomb, currentTime);
        const result = 推进妊娠与生产({ ...npc, 子宫: judgedWomb }, judgedWomb, fullOptions);
        nextList.push(result.npc);
        if (result.child && !existingIds.has(result.child.id)) {
            existingIds.add(result.child.id);
            children.push(result.child);
        }
    });

    return children.length > 0 ? [...nextList, ...children] : nextList;
};
