import type { 存档结构 } from '../types';

const readText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 截断连线文本 = (value: string): string => {
    const normalized = readText(value).replace(/\s+/g, ' ');
    if (!normalized) return '';
    return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
};

const 读取历史用户输入 = (save: Partial<存档结构>, startIndex = 0): string => {
    const history = Array.isArray(save.历史记录) ? save.历史记录 : [];
    const user = history.slice(Math.max(0, startIndex)).find((item: any) => item?.role === 'user' && readText(item.content));
    return 截断连线文本((user as any)?.content || '');
};

export const 计算谱系短哈希 = (value: string): string => {
    let left = 0x811c9dc5;
    let right = 0x01000193;
    for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index);
        left ^= code;
        left = Math.imul(left, 0x01000193);
        right ^= code + index;
        right = Math.imul(right, 0x811c9dc5);
    }
    return `${(left >>> 0).toString(16).padStart(8, '0')}${(right >>> 0).toString(16).padStart(8, '0')}`;
};

export const 读取存档系列ID = (save: Partial<存档结构>): string => {
    const existing = readText((save.元数据 as any)?.存档系列ID);
    if (existing) return existing;
    const history = Array.isArray(save.历史记录) ? save.历史记录 : [];
    const firstHistory = history[0] || null;
    const env: any = save.环境信息 || {};
    const seed = {
        title: readText(save.角色数据?.姓名),
        initialTime: readText(save.游戏初始时间),
        firstHistory,
        firstLocation: readText(env.具体地点 || env.小地点 || env.中地点 || env.大地点)
    };
    return `series-${计算谱系短哈希(JSON.stringify(seed))}`;
};

export const 读取存档谱系哈希 = (save: Partial<存档结构>): string => (
    readText((save.元数据 as any)?.存档哈希)
);

export const 选择存档父节点 = (
    save: Partial<存档结构>,
    candidates: Array<Partial<存档结构>>
): Partial<存档结构> | null => {
    const seriesId = 读取存档系列ID(save);
    const currentHash = 读取存档谱系哈希(save);
    const historyCount = Array.isArray(save.历史记录) ? save.历史记录.length : 0;
    const timestamp = Number(save.时间戳 || 0);
    const explicitParentHash = readText((save.元数据 as any)?.存档父节点哈希);
    if (explicitParentHash) {
        const explicit = candidates.find((item) => 读取存档谱系哈希(item) === explicitParentHash);
        if (explicit) return explicit;
    }
    return candidates
        .filter((item) => 读取存档谱系哈希(item) && 读取存档谱系哈希(item) !== currentHash)
        .filter((item) => 读取存档系列ID(item) === seriesId)
        .filter((item) => (Array.isArray(item.历史记录) ? item.历史记录.length : 0) <= historyCount)
        .filter((item) => Number(item.时间戳 || 0) <= timestamp || timestamp <= 0)
        .sort((a, b) => {
            const byHistory = (Array.isArray(b.历史记录) ? b.历史记录.length : 0) - (Array.isArray(a.历史记录) ? a.历史记录.length : 0);
            if (byHistory !== 0) return byHistory;
            return Number(b.时间戳 || 0) - Number(a.时间戳 || 0);
        })[0] || null;
};

export const 补全存档谱系元数据 = <T extends Partial<存档结构>>(
    save: T,
    candidates: Array<Partial<存档结构>> = []
): T => {
    const metadata: Record<string, unknown> = {
        ...((save.元数据 && typeof save.元数据 === 'object') ? save.元数据 : {})
    };
    const seriesId = readText(metadata.存档系列ID) || 读取存档系列ID({ ...save, 元数据: metadata } as Partial<存档结构>);
    metadata.存档系列ID = seriesId;
    const parent = 选择存档父节点({ ...save, 元数据: metadata } as Partial<存档结构>, candidates);
    const parentHash = parent ? 读取存档谱系哈希(parent) : '';
    const parentHistoryCount = parent && Array.isArray(parent.历史记录) ? parent.历史记录.length : 0;
    const branchInput = parent ? 读取历史用户输入(save, parentHistoryCount) : 读取历史用户输入(save, 0);
    const rootHash = parent
        ? readText((parent.元数据 as any)?.存档根节点哈希) || parentHash
        : readText(metadata.存档根节点哈希) || readText(metadata.存档哈希);
    metadata.存档父节点哈希 = parentHash || '';
    metadata.存档根节点哈希 = rootHash || readText(metadata.存档哈希);
    metadata.存档谱系深度 = parent ? Math.max(0, Number((parent.元数据 as any)?.存档谱系深度 || 0) + 1) : 0;
    metadata.存档分支输入 = branchInput || (parent ? '继续游玩' : '开局');
    metadata.存档谱系版本 = 1;
    return {
        ...save,
        元数据: metadata as any
    };
};
