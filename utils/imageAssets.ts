type 图片资源结构 = {
    图片URL?: string;
    本地路径?: string;
};

export type 图片冗余字段清理结果 = {
    visitedNodes: number;
    removedFields: number;
    removedStringChars: number;
    truncated: boolean;
};

const 图片资源引用前缀 = 'wuxia-asset://';
const 图片资源缓存 = new Map<string, string>();
const 图片资源缓存最大条目数 = 80;
const 图片资源缓存最大字符数 = 42 * 1024 * 1024;
let 图片资源缓存字符数 = 0;
const 远程图片兜底缓存键 = 'moranjianghu.remoteImageFallbacks.v1';
const 远程图片兜底最大数量 = 600;
let 远程图片兜底缓存: Record<string, string> | null = null;
const 图片冗余响应字段 = new Set([
    '原始响应',
    'rawResponse',
    'rawText',
    'responseText',
    'fullResponse',
    'debugResponse',
    'base64',
    'b64_json',
    'image_base64',
    'dataUrl',
    'dataURL',
    'data_url',
    '图片Base64',
    '图片数据'
]);
const 图片展示地址字段 = new Set(['图片URL', '本地路径', '头像图片URL', '背景图片']);
const 图片冗余长文本阈值 = 512 * 1024;
const 图片记录描述长文本阈值 = 32 * 1024;

const 读取文本 = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const 是否图片冗余响应字段 = (key: string, value: unknown): boolean => {
    if (图片冗余响应字段.has(key)) return true;
    if (
        key === '原始描述'
        && typeof value === 'string'
        && value.length > 图片记录描述长文本阈值
    ) {
        return true;
    }
    if (
        typeof value === 'string'
        && value.length > 图片冗余长文本阈值
        && !图片展示地址字段.has(key)
    ) {
        return true;
    }
    const lowerKey = key.toLowerCase();
    if (
        typeof value === 'string'
        && value.length > 128 * 1024
        && (
            lowerKey.includes('base64')
            || lowerKey.includes('response')
            || lowerKey.includes('dataurl')
            || lowerKey.includes('data_url')
            || key.includes('原始响应')
            || key.includes('图片数据')
        )
    ) {
        return true;
    }
    return false;
};

const 移除浅层图片冗余字段 = <T extends Record<string, unknown>>(asset: T): T => {
    Object.keys(asset).forEach((key) => {
        if (是否图片冗余响应字段(key, asset[key])) {
            delete asset[key];
        }
    });
    return asset;
};

export const 清理内嵌图片冗余字段 = (
    value: unknown,
    options: { maxNodes?: number } = {}
): 图片冗余字段清理结果 => {
    const maxNodes = Math.max(100, Number(options.maxNodes) || 60000);
    const seen = new WeakSet<object>();
    const stack: unknown[] = [value];
    const result: 图片冗余字段清理结果 = {
        visitedNodes: 0,
        removedFields: 0,
        removedStringChars: 0,
        truncated: false
    };

    while (stack.length > 0) {
        if (result.visitedNodes >= maxNodes) {
            result.truncated = true;
            break;
        }
        const current = stack.pop();
        result.visitedNodes += 1;
        if (!current || typeof current !== 'object') continue;
        if (seen.has(current as object)) continue;
        seen.add(current as object);

        if (Array.isArray(current)) {
            for (let index = current.length - 1; index >= 0; index -= 1) {
                stack.push(current[index]);
            }
            continue;
        }

        Object.entries(current as Record<string, unknown>).forEach(([key, child]) => {
            if (是否图片冗余响应字段(key, child)) {
                result.removedFields += 1;
                if (typeof child === 'string') result.removedStringChars += child.length;
                delete (current as Record<string, unknown>)[key];
                return;
            }
            if (child && typeof child === 'object') stack.push(child);
        });
    }

    return result;
};

export const 是否图片资源引用 = (value: unknown): boolean => (
    读取文本(value).startsWith(图片资源引用前缀)
);

export const 创建图片资源引用 = (assetId: string): string => {
    const normalized = 读取文本(assetId);
    return normalized ? `${图片资源引用前缀}${normalized}` : '';
};

export const 解析图片资源引用ID = (value: unknown): string => {
    const text = 读取文本(value);
    return text.startsWith(图片资源引用前缀) ? text.slice(图片资源引用前缀.length) : '';
};

export const 注册图片资源缓存 = (assetId: string, dataUrl: string): void => {
    const ref = 创建图片资源引用(assetId);
    const normalized = 读取文本(dataUrl);
    if (!ref || !normalized) return;
    const existing = 图片资源缓存.get(ref);
    if (existing) {
        图片资源缓存字符数 -= existing.length;
        图片资源缓存.delete(ref);
    }
    图片资源缓存.set(ref, normalized);
    图片资源缓存字符数 += normalized.length;
    while (
        图片资源缓存.size > 图片资源缓存最大条目数
        || 图片资源缓存字符数 > 图片资源缓存最大字符数
    ) {
        const oldestKey = 图片资源缓存.keys().next().value;
        if (!oldestKey) break;
        const oldestValue = 图片资源缓存.get(oldestKey) || '';
        图片资源缓存.delete(oldestKey);
        图片资源缓存字符数 -= oldestValue.length;
    }
};

export const 批量注册图片资源缓存 = (entries: Array<{ id: string; dataUrl: string }>): void => {
    if (!Array.isArray(entries)) return;
    entries.forEach((item) => 注册图片资源缓存(item?.id, item?.dataUrl));
};

export const 清空图片资源缓存 = (): void => {
    图片资源缓存.clear();
    图片资源缓存字符数 = 0;
};

export const 读取图片资源缓存 = (value: unknown): string => {
    const ref = 读取文本(value);
    if (!ref) return '';
    const cached = 图片资源缓存.get(ref) || '';
    if (cached) {
        图片资源缓存.delete(ref);
        图片资源缓存.set(ref, cached);
    }
    return cached;
};

const 读取远程图片兜底缓存 = (): Record<string, string> => {
    if (远程图片兜底缓存) return 远程图片兜底缓存;
    if (typeof localStorage === 'undefined') {
        远程图片兜底缓存 = {};
        return 远程图片兜底缓存;
    }
    try {
        const parsed = JSON.parse(localStorage.getItem(远程图片兜底缓存键) || '{}');
        远程图片兜底缓存 = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        远程图片兜底缓存 = {};
    }
    return 远程图片兜底缓存;
};

const 写入远程图片兜底缓存 = (fallbacks: Record<string, string>): void => {
    远程图片兜底缓存 = fallbacks;
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(远程图片兜底缓存键, JSON.stringify(fallbacks));
    } catch {
        // 兜底映射不可写时，内存缓存仍然可用于本次页面会话。
    }
};

export const 注册远程图片兜底引用 = (remoteUrl: unknown, assetIdOrRef: unknown): void => {
    const remote = 读取文本(remoteUrl);
    const assetId = 解析图片资源引用ID(assetIdOrRef) || 读取文本(assetIdOrRef);
    if (!/^https?:\/\//i.test(remote) || !assetId) return;
    const fallbacks = { ...读取远程图片兜底缓存(), [remote]: assetId };
    const entries = Object.entries(fallbacks);
    if (entries.length > 远程图片兜底最大数量) {
        写入远程图片兜底缓存(Object.fromEntries(entries.slice(entries.length - 远程图片兜底最大数量)));
        return;
    }
    写入远程图片兜底缓存(fallbacks);
};

export const 读取远程图片兜底映射 = (): Record<string, string> => ({
    ...读取远程图片兜底缓存()
});

export const 读取远程图片兜底资源ID = (remoteUrl: unknown): string => {
    const remote = 读取文本(remoteUrl);
    if (!remote) return '';
    return 读取文本(读取远程图片兜底缓存()[remote]);
};

export const 读取远程图片本地兜底地址 = (remoteUrl: unknown): string => {
    const assetId = 读取远程图片兜底资源ID(remoteUrl);
    if (!assetId) return '';
    return 读取图片资源缓存(创建图片资源引用(assetId));
};

export const 读取图片资源远程兜底地址 = (assetIdOrRef: unknown): string => {
    const assetId = 解析图片资源引用ID(assetIdOrRef) || 读取文本(assetIdOrRef);
    if (!assetId) return '';
    const entry = Object.entries(读取远程图片兜底缓存()).find(([, fallbackId]) => 读取文本(fallbackId) === assetId);
    return entry?.[0] || '';
};

export const 读取远程图片兜底资源ID集合 = (): Set<string> => (
    new Set(Object.values(读取远程图片兜底缓存()).map(读取文本).filter(Boolean))
);

export const 获取图片展示地址 = (asset?: 图片资源结构 | null): string => {
    const local = 读取文本(asset?.本地路径);
    if (local) {
        const localUrl = 获取图片资源文本地址(local);
        if (localUrl) return localUrl;
    }
    const imageUrl = 读取文本(asset?.图片URL);
    if (imageUrl) return 获取图片资源文本地址(imageUrl);
    return '';
};

export const 图片资源记录含可恢复地址 = (asset?: 图片资源结构 | null): boolean => {
    if (!asset || typeof asset !== 'object') return false;
    const local = 读取文本(asset?.本地路径);
    if (local) return true;
    const imageUrl = 读取文本(asset?.图片URL);
    if (imageUrl) return true;
    return Boolean(获取图片展示地址(asset));
};

export const 获取图片资源文本地址 = (value: unknown): string => {
    const text = 读取文本(value);
    if (!text) return '';
    if (/^https?:\/\//i.test(text)) {
        const localFallback = 读取远程图片本地兜底地址(text);
        if (localFallback) return localFallback;
    }
    if (是否图片资源引用(text)) {
        const local = 读取图片资源缓存(text);
        if (local) return local;
        return 读取图片资源远程兜底地址(text);
    }
    return text;
};

export const 压缩图片资源字段 = <T extends 图片资源结构 | null | undefined>(asset: T): T => {
    if (!asset || typeof asset !== 'object') return asset;
    const compactAsset = 移除浅层图片冗余字段({ ...(asset as Record<string, unknown>) }) as T & 图片资源结构;
    const 本地路径 = 读取文本(asset.本地路径);
    const 图片URL = 读取文本(asset.图片URL);
    if (!本地路径 && !图片URL) return compactAsset as T;
    if (!本地路径) {
        return {
            ...compactAsset,
            图片URL: 图片URL || undefined
        };
    }
    return {
        ...compactAsset,
        本地路径,
        图片URL: undefined
    };
};

export const 是否存在本地图片副本 = (asset?: 图片资源结构 | null): boolean => (
    读取文本(asset?.本地路径).length > 0
);

export const 是否远程图片地址 = (value: unknown): boolean => (
    /^https?:\/\//i.test(读取文本(value))
);

export const 格式化本地图片描述 = (value: unknown): string => {
    const text = 读取文本(value);
    if (!text) return '未保存本地副本';
    if (是否图片资源引用(text)) return '应用内图片资源';
    if (/^data:image\//i.test(text)) return '应用内本地缓存';
    return text;
};
