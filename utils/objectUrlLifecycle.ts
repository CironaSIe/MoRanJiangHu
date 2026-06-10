type ObjectUrlSource = {
    source: string;
    kind?: string;
    detail?: Record<string, unknown>;
};

type ObjectUrlEntry = ObjectUrlSource & {
    sequence: number;
    bytes: number;
    type: string;
    createdAt: number;
};

let objectUrlSequence = 0;
const activeObjectUrls = new Map<string, ObjectUrlEntry>();

const 截短URL = (url: string): string => {
    if (url.length <= 32) return url;
    return `${url.slice(0, 12)}...${url.slice(-12)}`;
};

const 记录ObjectURL生命周期 = (
    event: 'create' | 'revoke',
    url: string,
    payload: Record<string, unknown>
) => {
    const 事件 = event === 'create' ? '创建' : '释放';
    try {
        console.info('[对象URL生命周期]', {
            事件,
            URL: 截短URL(url),
            活跃数量: activeObjectUrls.size,
            ...payload
        });
    } catch {
        // Diagnostic logging must never affect object URL cleanup.
    }
};

export const 创建并记录ObjectURL = (blob: Blob, meta: ObjectUrlSource): string => {
    const url = URL.createObjectURL(blob);
    const entry: ObjectUrlEntry = {
        ...meta,
        sequence: ++objectUrlSequence,
        bytes: blob.size,
        type: blob.type || '',
        createdAt: Date.now()
    };
    activeObjectUrls.set(url, entry);
    记录ObjectURL生命周期('create', url, {
        序号: entry.sequence,
        来源: entry.source,
        类型: entry.kind,
        字节数: entry.bytes,
        MIME类型: entry.type,
        详情: entry.detail
    });
    return url;
};

export const 释放并记录ObjectURL = (url: string | null | undefined, meta: ObjectUrlSource): void => {
    if (typeof url !== 'string' || !url.startsWith('blob:')) return;
    const entry = activeObjectUrls.get(url);
    try {
        URL.revokeObjectURL(url);
    } finally {
        activeObjectUrls.delete(url);
        记录ObjectURL生命周期('revoke', url, {
            序号: entry?.sequence,
            来源: meta.source,
            原始来源: entry?.source,
            类型: meta.kind || entry?.kind,
            是否匹配创建记录: Boolean(entry),
            字节数: entry?.bytes,
            MIME类型: entry?.type,
            存活毫秒: entry ? Date.now() - entry.createdAt : undefined,
            详情: {
                ...(entry?.detail || {}),
                ...(meta.detail || {})
            }
        });
    }
};

export const 延迟释放并记录ObjectURL = (
    url: string | null | undefined,
    meta: ObjectUrlSource,
    delayMs: number
): void => {
    if (typeof url !== 'string' || !url.startsWith('blob:')) return;
    const release = () => 释放并记录ObjectURL(url, {
        ...meta,
        detail: {
            ...(meta.detail || {}),
            delayMs
        }
    });
    if (typeof globalThis.setTimeout === 'function' && delayMs > 0) {
        globalThis.setTimeout(release, delayMs);
        return;
    }
    release();
};
