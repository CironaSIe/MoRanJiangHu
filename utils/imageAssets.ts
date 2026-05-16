type 图片资源结构 = {
    图片URL?: string;
    本地路径?: string;
};

const 图片资源引用前缀 = 'wuxia-asset://';
const 图片资源缓存 = new Map<string, string>();
const 远程图片兜底缓存键 = 'moranjianghu.remoteImageFallbacks.v1';
const 远程图片兜底最大数量 = 600;
let 远程图片兜底缓存: Record<string, string> | null = null;

const 读取文本 = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

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
    图片资源缓存.set(ref, normalized);
};

export const 批量注册图片资源缓存 = (entries: Array<{ id: string; dataUrl: string }>): void => {
    if (!Array.isArray(entries)) return;
    entries.forEach((item) => 注册图片资源缓存(item?.id, item?.dataUrl));
};

export const 清空图片资源缓存 = (): void => {
    图片资源缓存.clear();
};

export const 读取图片资源缓存 = (value: unknown): string => {
    const ref = 读取文本(value);
    return ref ? (图片资源缓存.get(ref) || '') : '';
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

export const 获取图片资源文本地址 = (value: unknown): string => {
    const text = 读取文本(value);
    if (!text) return '';
    if (/^https?:\/\//i.test(text)) {
        const localFallback = 读取远程图片本地兜底地址(text);
        if (localFallback) return localFallback;
    }
    return 是否图片资源引用(text) ? 读取图片资源缓存(text) : text;
};

export const 压缩图片资源字段 = <T extends 图片资源结构 | null | undefined>(asset: T): T => {
    if (!asset || typeof asset !== 'object') return asset;
    const 本地路径 = 读取文本(asset.本地路径);
    const 图片URL = 读取文本(asset.图片URL);
    if (!本地路径 && !图片URL) return asset;
    if (!本地路径) {
        return {
            ...asset,
            图片URL: 图片URL || undefined
        };
    }
    return {
        ...asset,
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
