import type { TavernCommand } from '../types';
import { normalizeStateCommandKey } from './stateHelpers';

type 路径片段 = string | number;

export type 变量命令校验结果 = {
    allowed: boolean;
    reason?: string;
    normalizedKey: string;
};

const 变量登记根路径 = [
    '角色',
    '环境',
    '社交',
    '世界',
    '战斗',
    '剧情',
    '剧情规划',
    '女主剧情规划',
    '同人剧情规划',
    '同人女主剧情规划',
    '玩家门派',
    '任务列表',
    '约定列表',
    '记忆系统'
] as const;

const 解析路径片段 = (rawPath: string): 路径片段[] => {
    const tokens: 路径片段[] = [];
    const regex = /([^. \[\]]+)|\[(\d+)\]/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(rawPath || ''))) {
        if (match[1]) tokens.push(match[1]);
        if (match[2] !== undefined) tokens.push(Number(match[2]));
    }
    return tokens;
};

const 提取根路径 = (normalizedKey: string): { root: string; rest: string } | null => {
    for (const root of 变量登记根路径) {
        const exact = `gameState.${root}`;
        if (normalizedKey === exact) return { root, rest: '' };
        if (normalizedKey.startsWith(`${exact}.`)) return { root, rest: normalizedKey.slice(exact.length + 1) };
        if (normalizedKey.startsWith(`${exact}[`)) return { root, rest: normalizedKey.slice(exact.length) };
    }
    return null;
};

const 读取路径值 = (source: any, tokens: 路径片段[]): { exists: boolean; value: any; parent: any; lastToken?: 路径片段 } => {
    let current = source;
    let parent: any = undefined;
    let lastToken: 路径片段 | undefined;
    for (const token of tokens) {
        if (current === undefined || current === null) {
            return { exists: false, value: undefined, parent, lastToken: token };
        }
        parent = current;
        lastToken = token;
        if (typeof token === 'number') {
            if (!Array.isArray(current) || token < 0 || token >= current.length) {
                return { exists: false, value: undefined, parent, lastToken };
            }
            current = current[token];
            continue;
        }
        if (typeof current !== 'object' || !(token in current)) {
            return { exists: false, value: undefined, parent, lastToken };
        }
        current = current[token];
    }
    return { exists: true, value: current, parent, lastToken };
};

const 在同数组对象中存在字段 = (rootValue: any, tokens: 路径片段[]): boolean => {
    const lastToken = tokens[tokens.length - 1];
    if (typeof lastToken !== 'string') return false;

    for (let index = tokens.length - 2; index >= 0; index -= 1) {
        if (typeof tokens[index] !== 'number') continue;
        const arrayPath = tokens.slice(0, index);
        const arrayRead = 读取路径值(rootValue, arrayPath);
        if (!Array.isArray(arrayRead.value)) return false;
        return arrayRead.value.some((item: any) => item && typeof item === 'object' && !Array.isArray(item) && lastToken in item);
    }

    return false;
};

const 社交NPC可新增字段 = new Set([
    '名器档案'
]);

const 是允许新增社交NPC字段 = (root: string, tokens: 路径片段[]): boolean => {
    if (root !== '社交') return false;
    if (tokens.length < 2) return false;
    if (typeof tokens[0] !== 'number') return false;
    const field = tokens[1];
    return typeof field === 'string' && 社交NPC可新增字段.has(field);
};

const 收集变量路径 = (value: any, prefix: string, result: string[], depth: number) => {
    result.push(prefix);
    if (depth <= 0 || value === null || value === undefined || typeof value !== 'object') return;

    if (Array.isArray(value)) {
        if (value.length > 0) {
            result.push(`${prefix}[]`);
            收集变量路径(value[0], `${prefix}[0]`, result, depth - 1);
        }
        return;
    }

    Object.keys(value).sort((left, right) => left.localeCompare(right, 'zh-CN')).forEach((key) => {
        收集变量路径(value[key], `${prefix}.${key}`, result, depth - 1);
    });
};

export const 构建变量路径登记表 = (
    stateLike: Record<string, any>,
    options?: { maxDepth?: number; maxLines?: number }
): string[] => {
    const maxDepth = Math.max(1, options?.maxDepth ?? 4);
    const maxLines = Math.max(20, options?.maxLines ?? 220);
    const result: string[] = [];

    for (const root of 变量登记根路径) {
        if (!(root in (stateLike || {}))) continue;
        收集变量路径((stateLike as any)[root], root, result, maxDepth);
        if (result.length >= maxLines) break;
    }

    return Array.from(new Set(result)).slice(0, maxLines);
};

export const 构建变量路径登记提示 = (stateLike: Record<string, any>): string => {
    const paths = 构建变量路径登记表(stateLike);
    if (paths.length === 0) return '';
    return [
        '【变量路径登记表】',
        '- 下面是当前存档允许变量模型直接写入的路径索引；不要自造根路径、分类名或字段名。',
        '- `set/add/delete` 只能写入登记表中已存在的路径；数组新增请对登记表中的数组路径使用 `push`。',
        '- 若必须新增人物、任务、约定等条目，请 `push` 到对应数组；条目内部字段应沿用同类条目的既有字段。',
        '- 不在登记表中的字段视为未登记变量，本回合不要写入。',
        '',
        ...paths.map((path) => `- ${path}`)
    ].join('\n');
};

export const 校验变量命令是否登记 = (
    cmd: TavernCommand,
    stateLike: Record<string, any>
): 变量命令校验结果 => {
    const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '');
    const parsed = 提取根路径(normalizedKey);
    if (!parsed) {
        return { allowed: false, normalizedKey, reason: '根路径未登记' };
    }

    const rootValue = (stateLike || {})[parsed.root];
    if (rootValue === undefined) {
        return { allowed: false, normalizedKey, reason: `根路径 ${parsed.root} 不存在` };
    }

    const tokens = 解析路径片段(parsed.rest);
    if (tokens.length === 0) {
        return { allowed: true, normalizedKey };
    }

    const read = 读取路径值(rootValue, tokens);
    if (read.exists) {
        if (cmd.action === 'push' && !Array.isArray(read.value)) {
            return { allowed: false, normalizedKey, reason: 'push 目标不是数组' };
        }
        return { allowed: true, normalizedKey };
    }

    if ((cmd.action === 'set' || cmd.action === 'add') && (在同数组对象中存在字段(rootValue, tokens) || 是允许新增社交NPC字段(parsed.root, tokens))) {
        return { allowed: true, normalizedKey };
    }

    return { allowed: false, normalizedKey, reason: '目标路径未登记' };
};
