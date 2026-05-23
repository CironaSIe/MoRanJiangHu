import type { 对象存储云存档元数据 } from '../services/objectStorageSync';

export type 对象存储时间树节点 = 对象存储云存档元数据 & { children: 对象存储时间树节点[] };

export interface 对象存储时间树系列 {
    key: string;
    title: string;
    latest: 对象存储云存档元数据;
    roots: 对象存储时间树节点[];
    count: number;
    displayCount: number;
    collapsedCount: number;
    totalBytes: number;
}

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 读取开局片段 = (item: 对象存储云存档元数据): string => {
    const raw = 读取文本((item as any).openingSnippet || (item as any).首回合正文片段 || item.branchInput);
    return raw.replace(/\s+/g, '').slice(0, 20);
};

const 读取时间戳 = (value: unknown): number => {
    const text = 读取文本(value);
    if (!text) return 0;
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : 0;
};

const 读取同步排序时间 = (item: 对象存储云存档元数据): number => (
    读取时间戳(item.syncedAt)
    || 读取时间戳(item.savedAt)
    || Number(item.saveTimestamp || 0)
);

const 读取存档发生时间 = (item: 对象存储云存档元数据): number => (
    读取时间戳(item.savedAt)
    || Number(item.saveTimestamp || 0)
    || 读取时间戳(item.syncedAt)
);

const 读取回合数 = (item: 对象存储云存档元数据): number => {
    const value = Number(item.turnCount || 0);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
};

const 解析游戏时间 = (value: unknown): number[] => {
    const text = 读取文本(value);
    if (!text) return [];
    const parts = text
        .split(/[:：]/)
        .map((part) => Number(part.replace(/[^\d.-]/g, '')))
        .filter((part) => Number.isFinite(part));
    return parts.length > 0 ? parts : [];
};

const 比较游戏时间 = (a: 对象存储云存档元数据, b: 对象存储云存档元数据): number => {
    const left = 解析游戏时间(a.gameTime);
    const right = 解析游戏时间(b.gameTime);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const diff = (left[index] || 0) - (right[index] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
};

const 比较进度顺序 = (a: 对象存储云存档元数据, b: 对象存储云存档元数据): number => {
    const leftTurn = 读取回合数(a);
    const rightTurn = 读取回合数(b);
    if (leftTurn > 0 || rightTurn > 0) {
        const turnDiff = leftTurn - rightTurn;
        if (turnDiff !== 0) return turnDiff;
        const gameTimeDiff = 比较游戏时间(a, b);
        if (gameTimeDiff !== 0) return gameTimeDiff;
    } else {
        const gameTimeDiff = 比较游戏时间(a, b);
        if (gameTimeDiff !== 0) return gameTimeDiff;
    }
    const happenedDiff = 读取存档发生时间(a) - 读取存档发生时间(b);
    if (happenedDiff !== 0) return happenedDiff;
    return 读取同步排序时间(a) - 读取同步排序时间(b);
};

const 比较代表新旧 = (a: 对象存储云存档元数据, b: 对象存储云存档元数据): number => {
    const syncDiff = 读取同步排序时间(a) - 读取同步排序时间(b);
    if (syncDiff !== 0) return syncDiff;
    const versionDiff = Number(a.versionCode || 0) - Number(b.versionCode || 0);
    if (versionDiff !== 0) return versionDiff;
    return Number(a.saveTimestamp || 0) - Number(b.saveTimestamp || 0);
};

const 读取对象存储展示系列键 = (item: 对象存储云存档元数据): string => {
    const seriesId = 读取文本(item.seriesId);
    const rootHash = 读取文本(item.rootHash);
    const openingSnippet = 读取开局片段(item);
    if (seriesId && openingSnippet) return `series:${seriesId}|opening:${openingSnippet}`;
    if (seriesId) return `series:${seriesId}`;
    if (rootHash && openingSnippet) return `root:${rootHash}|opening:${openingSnippet}`;
    if (rootHash) return `root:${rootHash}`;
    if (openingSnippet) return `opening:${openingSnippet}|title:${读取文本(item.title) || '未知角色'}`;
    return 读取文本(item.id) || `title:${读取文本(item.title) || 'unknown'}`;
};

const 读取自动存档展示键 = (item: 对象存储云存档元数据): string => {
    if (item.type !== 'auto') return '';
    const title = 读取文本(item.title) || '未知角色';
    const turn = 读取回合数(item);
    const gameTime = 读取文本(item.gameTime) || '未知时间';
    const location = 读取文本(item.location) || '未知地点';
    if (!turn && gameTime === '未知时间' && location === '未知地点') return '';
    return `auto:${title}|${turn}|${gameTime}|${location}`;
};

const 读取节点唯一键 = (item: 对象存储云存档元数据, index: number): string => {
    const autoKey = 读取自动存档展示键(item);
    if (autoKey) return autoKey;
    return `item:${读取文本(item.id) || 读取文本(item.hash) || index}`;
};

const 构建进度线节点 = (items: 对象存储云存档元数据[]): 对象存储时间树节点[] => {
    const byDisplayKey = new Map<string, { best: 对象存储云存档元数据; items: 对象存储云存档元数据[] }>();
    items.forEach((item, index) => {
        const key = 读取节点唯一键(item, index);
        const existing = byDisplayKey.get(key);
        if (!existing) {
            byDisplayKey.set(key, { best: item, items: [item] });
            return;
        }
        existing.items.push(item);
        if (比较代表新旧(item, existing.best) >= 0) {
            existing.best = item;
        }
    });

    const nodes = Array.from(byDisplayKey.values())
        .map(({ best }) => ({ ...best, children: [] } as 对象存储时间树节点))
        .sort(比较进度顺序);

    const byHash = new Map<string, 对象存储时间树节点>();
    nodes.forEach((node) => {
        const hash = 读取文本(node.hash);
        if (hash) byHash.set(hash, node);
    });

    const attached = new Set<对象存储时间树节点>();
    const roots: 对象存储时间树节点[] = [];
    for (const node of nodes) {
        const parentHash = 读取文本(node.parentHash);
        const parent = parentHash ? byHash.get(parentHash) : undefined;
        if (parent && parent !== node) {
            parent.children.push(node);
            attached.add(node);
        }
    }

    let previousVisible: 对象存储时间树节点 | null = null;
    for (const node of nodes) {
        if (!attached.has(node)) {
            if (previousVisible && 比较进度顺序(previousVisible, node) <= 0) {
                previousVisible.children.push(node);
                attached.add(node);
            } else {
                roots.push(node);
            }
        }
        previousVisible = node;
    }

    return roots;
};

export const 展开对象存储进度线 = (roots: 对象存储时间树节点[]): 对象存储时间树节点[] => {
    const result: 对象存储时间树节点[] = [];
    const visit = (node: 对象存储时间树节点): void => {
        result.push(node);
        node.children.forEach(visit);
    };
    roots.forEach(visit);
    return result;
};

export const 构建对象存储云存档时间树 = (saves: 对象存储云存档元数据[]): 对象存储时间树系列[] => {
    const groups = new Map<string, 对象存储云存档元数据[]>();
    saves.forEach((item) => {
        const key = 读取对象存储展示系列键(item);
        groups.set(key, [...(groups.get(key) || []), item]);
    });

    return Array.from(groups.entries())
        .map(([key, items]) => {
            const roots = 构建进度线节点(items);
            const nodes = 展开对象存储进度线(roots);
            const latest = nodes[nodes.length - 1] || [...items].sort((a, b) => 比较代表新旧(b, a))[0];
            return {
                key,
                title: latest?.title || items[0]?.title || '未知角色',
                latest,
                roots,
                count: items.length,
                displayCount: nodes.length,
                collapsedCount: Math.max(0, items.length - nodes.length),
                totalBytes: items.reduce((sum, item) => sum + Math.max(0, Number(item.size || 0)), 0)
            };
        })
        .filter((series) => Boolean(series.latest))
        .sort((a, b) => 比较进度顺序(b.latest, a.latest) || 比较代表新旧(b.latest, a.latest));
};
