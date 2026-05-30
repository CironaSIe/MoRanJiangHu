import type { GameLog } from '../types';

import { 是否判定日志文本 } from './judgmentFormat';

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
const Judge标签残留正则 = /(?:<|&lt;)\s*\/?\s*judge\s*(?:>|&gt;)/i;
const Judge数值残留正则 = /^判定值\s*[+\-]?\d+(?:\.\d+)?\s*\/\s*难度\s*[+\-]?\d+(?:\.\d+)?/m;
const 完整判定文本特征正则 = /判定值|结果\s*[=:：]|[｜|]/;
const 指节泛白套话正则 = /(?:[左右双两]?(?:手|手指|指尖|手背|拳头)?[^。！？!?；;\n]{0,12})?指节(?:处|间|上)?[^。！？!?；;\n]{0,18}(?:泛|透|发|浮|呈|显|露|沁|泛起|透出|发出)[^。！？!?；;\n]{0,12}(?:白|苍白|灰白|惨白|青白|失血色|没有血色)[^。！？!?；;\n]{0,12}/gu;

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

const 清理正文套话 = (value: string): string => (
    (value || '')
        .replace(指节泛白套话正则, '手指收紧')
        .replace(/([。！？!?；;])\1+/g, '$1')
        .replace(/([。！？!?；;])([”」』])/g, '$1$2')
        .replace(/([”」』])([。！？!?；;])\2+/g, '$1$2')
);

const 拆分过长旁白段落 = (sender: string, value: string): string => {
    const text = 清理正文套话(value).trim();
    if (sender !== '旁白' || text.length < 220 || /\n\s*\n/.test(text)) return text;
    const units = text.match(/[^。！？!?；;\n]+[。！？!?；;]?|\n+/g) || [text];
    const paragraphs: string[] = [];
    let current = '';
    units.forEach((unit) => {
        const piece = unit.trim();
        if (!piece) return;
        if (current && current.length + piece.length > 150) {
            paragraphs.push(current);
            current = piece;
            return;
        }
        current = current ? `${current}${piece}` : piece;
    });
    if (current) paragraphs.push(current);
    return paragraphs.length > 1 ? paragraphs.join('\n\n') : text;
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
        const text = 拆分过长旁白段落(sender, item?.text || '');
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

const 是否有效角色说话人 = (sender: string): boolean => {
    const normalizedSender = 清理说话人(sender);
    return Boolean(normalizedSender && !非单一说话人正则.test(normalizedSender) && !泛称说话人正则.test(normalizedSender));
};

const 含有引号对白 = (text: string): boolean => {
    const source = (text || '').trim();
    if (!source) return false;
    return /[“"「『][^”"」』\n]{1,500}[”"」』]/.test(source);
};

const 是否Judge残留文本 = (text: string): boolean => {
    const source = (text || '').trim();
    if (!source) return false;
    return Judge标签残留正则.test(source) || Judge数值残留正则.test(source);
};

const 人物动作动词正则 = /^(?:将|把|给|向|对|朝|走|站|坐|停|回|转|看|望|抬|低|点|摇|皱|叹|笑|沉|伸|握|按|收|拔|举|放|推|扶|拂|敛|挑|倒|取|递|开口|提醒|解释|说道|说|道|问|答)/;
const 无标签言语引导正则 = /^(.{1,32}?)(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:，,]\s*(.{2,500})$/;
const 口语起始正则 = /^(?:我|我们|咱|咱们|你|你们|他|她|此事|这事|那就|若|如果|既然|今日|今天|明日|明天|昨日|昨天|现在|眼下|先|别|不要|必须|可以|应该|不是|恐怕|看来|听我|放心|等等|走|快|慢着|且慢|好|嗯|不行|没错|自然|当然|只要)/;
const 叙事动作特征正则 = /(?:走到|来到|回到|站在|坐在|望向|看向|拿起|放下|推开|打开|穿过|掠过|落在|映在|吹过|响起|传来|升起|落下|归鞘|倒了|喝了|吃了|伸手|抬手|皱眉|点头|摇头|叹息|沉默|停下|转身)/;

const 提取动作行说话人 = (line: string): string => {
    const text = (line || '').trim();
    for (let length = 4; length >= 2; length -= 1) {
        const name = text.slice(0, length);
        if (!/^[\u4e00-\u9fff]{2,4}$/.test(name)) continue;
        if (人物动作动词正则.test(text.slice(length))) {
            const cleaned = 清理说话人(name);
            if (cleaned) return cleaned;
        }
    }
    return '';
};

const 是否像无标签口语 = (line: string): boolean => {
    const text = (line || '').trim();
    if (text.length < 6 || text.length > 220) return false;
    if (含有引号对白(text) || 是否Judge残留文本(text)) return false;
    if (拟声词正则.test(text)) return false;
    if (叙事动作特征正则.test(text) && !/[我你咱]/.test(text)) return false;
    return 口语起始正则.test(text) || /[？?！!]$/.test(text) || /(?:吧|吗|呢|啊|罢|了)$/.test(text);
};

const 拆分旁白夹杂无标签对白 = (log: GameLog): GameLog[] => {
    const source = typeof log?.text === 'string' ? log.text.replace(/\r\n/g, '\n') : '';
    if (!source || !source.includes('\n')) return [log];

    const result: GameLog[] = [];
    let pendingSpeaker = '';
    for (const rawLine of source.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;

        const guided = line.match(无标签言语引导正则);
        const guidedSpeaker = 清理说话人(guided?.[1] || '');
        if (guided && guidedSpeaker) {
            result.push({ sender: guidedSpeaker, text: (guided[2] || '').trim() });
            pendingSpeaker = guidedSpeaker;
            continue;
        }

        if (pendingSpeaker && 是否像无标签口语(line)) {
            result.push({ sender: pendingSpeaker, text: line });
            pendingSpeaker = '';
            continue;
        }

        result.push({ sender: '旁白', text: line });
        pendingSpeaker = 提取动作行说话人(line);
    }

    return result.length > 1 ? 合并相邻同发送者(result) : [log];
};

export const 规范化可渲染对白日志 = (logs: GameLog[] | undefined): GameLog[] => {
    const normalized = (Array.isArray(logs) ? logs : []).flatMap((item) => {
        const rawSender = (item?.sender || '旁白').trim() || '旁白';
        const rawText = typeof item?.text === 'string' ? item.text.trim() : String(item?.text ?? '').trim();
        const text = 拆分过长旁白段落(rawSender === '旁白' ? '旁白' : 清理说话人(rawSender) || '旁白', rawText);
        if (是否Judge残留文本(text)) return [];
        if (是否判定日志文本(rawSender) || 是否判定日志文本(text)) {
            if (是否判定日志文本(rawSender) && !完整判定文本特征正则.test(text)) return [];
            return [{ sender: rawSender, text }];
        }
        const sender = 清理说话人(rawSender) || '旁白';
        if (!text) return [];
        if (sender === '旁白') return [{ sender, text }];
        if (sender === '奖励') return [{ sender, text }];
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

        if (是否有效角色说话人(sender) && 含有引号对白(text)) {
            return [{ sender, text }];
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
            const text = 拆分过长旁白段落(sender, typeof item?.text === 'string' ? item.text : String(item?.text ?? ''));
            const log = { sender, text };
            if (sender !== '旁白') return [log];
            return 拆分旁白夹杂对白(log, knownSpeakers)
                .flatMap((part) => part.sender === '旁白' ? 拆分旁白夹杂无标签对白(part) : [part]);
        });
    return 合并相邻同发送者(normalized);
};
