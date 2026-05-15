import type { GameLog } from '../types';

type NormalizeOptions = {
    knownSpeakers?: string[];
};

const 引号对白正则 = /[“"「『]([^”"」』\n]{1,500})[”"」』]/g;
const 开头引号正则 = /^[“"「『]/;
const 结尾引号正则 = /[”"」』]$/;
const 说话尾迹正则 = /(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:]?\s*$/;
const 语气修饰尾迹正则 = /(?:轻声|低声|沉声|冷声|温声|柔声|厉声|朗声|小声|淡淡|缓缓|忽然|忽地|笑着|苦笑着|皱眉|抬眼|侧首|回头|点头|摇头|叹息|压低声音)\s*$/;
const 泛称说话人正则 = /^(?:他|她|它|你|我|这人|那人|有人|众人|众弟子|众门人|众侍从|众士卒|众人齐声|众弟子齐声|众门人齐声|众侍从齐声|众士卒齐声|对方|男子|女子|少年|少女|老人|老者|汉子|侍女|侍从|弟子|门人|店小二)$/;
const 非单一说话人正则 = /^(?:旁白|判定|NSFW判定|系统|众人|众弟子|众门人|众侍从|众士卒|众人齐声|众弟子齐声|众门人齐声|众侍从齐声|众士卒齐声|所有人|全场|人群|群声|齐声|同门|弟子们|门人们)$/;
const 拟声词正则 = /^(?:啊+|呀+|唔+|嗯+|呃+|哼+|哈+|呵+|嘿+|咳+|轰+|砰+|啪+|咚+|铛+|嗡+|哗+|唰+|嗖+|吱+|喀+|咔+|沙+|呼+|呜+|嗷+|嘶+|噗+|扑通+|哗啦+|咔嚓+|轰隆+|咳咳+|哈哈+|呵呵+|嘿嘿+|呜呜+)[。！？!?…~～—-]*$/;

const 转义正则文本 = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const 清理说话人 = (value: string): string => {
    let text = (value || '')
        .replace(/[（(][^）)]{1,16}[）)]/g, '')
        .replace(/[【】\[\]「」『』“”"']/g, '')
        .trim();

    text = text.split(/[，,、；;。！？!?\s]/).filter(Boolean).pop() || text;
    for (let i = 0; i < 3; i += 1) {
        text = text
            .replace(说话尾迹正则, '')
            .replace(语气修饰尾迹正则, '')
            .trim();
    }
    text = text.replace(/^(?:那|这)(?=[\u4e00-\u9fff]{2,})/, '').trim();
    if (!text || text.length > 12) return '';
    if (/[：:，,。！？!?；;\n]/.test(text)) return '';
    if (非单一说话人正则.test(text) || 泛称说话人正则.test(text)) return '';
    return text;
};

const 取最近句段 = (text: string): string => {
    const source = (text || '').slice(-96);
    const parts = source.split(/[。！？!?；;\n]/);
    return (parts[parts.length - 1] || source).trim();
};

const 推断说话人 = (prefix: string, knownSpeakers: string[]): string => {
    const recent = 取最近句段(prefix);
    const normalizedKnown = knownSpeakers
        .map(item => (item || '').trim())
        .filter(item => item.length > 0)
        .sort((a, b) => b.length - a.length);

    let matchedName = '';
    let matchedIndex = -1;
    for (const speaker of normalizedKnown) {
        const index = recent.lastIndexOf(speaker);
        if (index >= 0 && index >= matchedIndex) {
            matchedName = speaker;
            matchedIndex = index;
        }
    }
    if (matchedName) return matchedName;

    const explicitMatch = recent.match(/([A-Za-z0-9_\u4e00-\u9fff·]{1,14})[^，,。！？!?；;\n]{0,10}(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:]?\s*$/);
    const cleaned = 清理说话人(explicitMatch?.[1] || '');
    if (cleaned) return cleaned;

    const withoutTailCue = recent.replace(/[^，,。！？!?；;\n]{0,12}(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:]?\s*$/, '');
    const possibleActionSegments = withoutTailCue.split(/[，,、\s]/).map(item => item.trim()).filter(Boolean).reverse();
    for (const segment of possibleActionSegments) {
        const actionNameMatch = segment.match(/^([\u4e00-\u9fff]{2,4})(?=负手|收剑|抬|回|点|看|站|坐|走|停|俯|侧|拱|抱|伸|皱|沉|笑|低|上前|退|转|放|握|按|举|落|扬|垂|敛|挑|拔|收|推|扶|拂|掠|倚|跪|躬|作|朝|向|对|把|将)/);
        const actionName = 清理说话人(actionNameMatch?.[1] || '');
        if (actionName) return actionName;
    }

    const genericMatch = recent.match(/(?:^|[，,、\s])((?:他|她|你|我|有人|众人|对方|男子|女子|少年|少女|老人|老者|汉子|侍女|侍从|弟子|门人|店小二))[^，,。！？!?；;\n]{0,10}(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:]?\s*$/);
    return 清理说话人(genericMatch?.[1] || '');
};

const 是否像说话引导 = (prefix: string, speaker: string): boolean => {
    const recent = 取最近句段(prefix);
    if (说话尾迹正则.test(recent)) return true;
    if (!speaker) return false;
    const escaped = 转义正则文本(speaker);
    return new RegExp(`${escaped}[\\s\\S]{0,18}(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\\s*[：:]?\\s*$`).test(recent);
};

const 移除尾部说话引导 = (text: string, speaker: string): string => {
    const source = text || '';
    const punctuationIndex = Math.max(
        source.lastIndexOf('，'),
        source.lastIndexOf(','),
        source.lastIndexOf('、'),
        source.lastIndexOf('\n')
    );
    const tail = source.slice(punctuationIndex + 1).trim();
    if (说话尾迹正则.test(tail)) {
        return (punctuationIndex >= 0 ? source.slice(0, punctuationIndex) : '').trim();
    }
    return source
        .replace(/(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:]?\s*$/, '')
        .trim();
};

const 合并相邻同发送者 = (logs: GameLog[]): GameLog[] => {
    const merged: GameLog[] = [];
    logs.forEach((item) => {
        const sender = (item?.sender || '旁白').trim() || '旁白';
        const text = (item?.text || '').trim();
        if (!text) return;
        const previous = merged[merged.length - 1];
        if (previous && previous.sender === sender) {
            previous.text = `${previous.text}\n${text}`.trim();
            return;
        }
        merged.push({ sender, text });
    });
    return merged;
};

const 查找首段闭合引号位置 = (text: string): number => {
    const source = (text || '').trim();
    if (!source) return -1;
    const open = source[0];
    const close = open === '“' ? '”'
        : open === '「' ? '」'
            : open === '『' ? '』'
                : open === '"' ? '"'
                    : '';
    if (!close) return -1;
    return source.indexOf(close, 1);
};

const 是完整引号对白 = (text: string): boolean => {
    const source = (text || '').trim();
    return Boolean(source && 开头引号正则.test(source) && 结尾引号正则.test(source) && 查找首段闭合引号位置(source) === source.length - 1);
};

const 剥离外层引号 = (text: string): string => {
    const source = (text || '').trim();
    if (!是完整引号对白(source)) return source;
    return source.slice(1, -1).trim();
};

const 是否无效角色对白 = (sender: string, text: string): boolean => {
    const normalizedSender = 清理说话人(sender);
    if (!normalizedSender || 非单一说话人正则.test(normalizedSender) || 泛称说话人正则.test(normalizedSender)) return true;
    const speech = 剥离外层引号(text);
    if (!speech || 拟声词正则.test(speech)) return true;
    if (/^(?:众人|众弟子|众门人|众侍从|众士卒|所有人|全场|人群).{0,8}(?:齐声|一起|同时)/.test(speech)) return true;
    return false;
};

export const 规范化可渲染对白日志 = (logs: GameLog[] | undefined): GameLog[] => {
    const normalized = (Array.isArray(logs) ? logs : []).flatMap((item) => {
        const sender = (item?.sender || '旁白').trim() || '旁白';
        const text = typeof item?.text === 'string' ? item.text.trim() : String(item?.text ?? '').trim();
        if (!text) return [];
        if (sender === '旁白') return [{ sender, text }];
        if (/^(【)?(?:判定|NSFW判定|先机|瞄准|接战|对撞|对抗|防御|化解|伤害|态势|反击|反馈|消耗|洞察|衰退)(】)?$/.test(sender)) {
            return [{ sender, text }];
        }
        if (是完整引号对白(text)) {
            return 是否无效角色对白(sender, text) ? [{ sender: '旁白', text }] : [{ sender, text }];
        }

        const closingIndex = 开头引号正则.test(text) ? 查找首段闭合引号位置(text) : -1;
        if (closingIndex > 0) {
            const quoted = text.slice(0, closingIndex + 1).trim();
            const rest = text.slice(closingIndex + 1).trim();
            const parts: GameLog[] = [];
            if (quoted && !是否无效角色对白(sender, quoted)) parts.push({ sender, text: quoted });
            else if (quoted) parts.push({ sender: '旁白', text: quoted });
            if (rest) parts.push({ sender: '旁白', text: rest });
            return parts;
        }

        return [{ sender: '旁白', text }];
    });
    return 合并相邻同发送者(normalized);
};

const 拆分旁白夹杂对白 = (log: GameLog, knownSpeakers: string[]): GameLog[] => {
    const source = typeof log?.text === 'string' ? log.text : '';
    if (!source || !/[“"「『]/.test(source)) return [log];

    const parts: GameLog[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null = null;
    引号对白正则.lastIndex = 0;

    while ((match = 引号对白正则.exec(source)) !== null) {
        const quoteStart = match.index;
        const quoteEnd = 引号对白正则.lastIndex;
        const speech = (match[1] || '').trim();
        const prefix = source.slice(0, quoteStart);
        const speaker = 推断说话人(prefix, knownSpeakers);

        if (!speech || !speaker || !是否像说话引导(prefix, speaker)) continue;

        const before = 移除尾部说话引导(source.slice(cursor, quoteStart), speaker);
        if (before.trim()) parts.push({ sender: '旁白', text: before.trim() });
        parts.push({ sender: speaker, text: speech });
        cursor = quoteEnd;
    }

    if (parts.length === 0) return [log];
    const after = source.slice(cursor).trim();
    if (after) parts.push({ sender: '旁白', text: after });
    return 合并相邻同发送者(parts);
};

export const 规范化对白日志 = (
    logs: GameLog[] | undefined,
    options?: NormalizeOptions
): GameLog[] => {
    const knownSpeakers = Array.from(new Set((options?.knownSpeakers || []).map(item => (item || '').trim()).filter(Boolean)));
    const normalized = (Array.isArray(logs) ? logs : [])
        .flatMap((item) => {
            const sender = (item?.sender || '旁白').trim() || '旁白';
            const text = typeof item?.text === 'string' ? item.text : String(item?.text ?? '');
            const log = { sender, text };
            if (sender !== '旁白') return [log];
            return 拆分旁白夹杂对白(log, knownSpeakers);
        });
    return 合并相邻同发送者(normalized);
};
