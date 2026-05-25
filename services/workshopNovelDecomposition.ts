import { 内置小说分解创意工坊模块 } from '../data/builtinNovelDecompositionWorkshop';

export interface 小说分解创意工坊条目 {
    id: string;
    title: string;
    workName: string;
    contributor: string;
    note: string;
    createdAt: string;
    updatedAt: string;
    fileName: string;
    size: number;
    sha256: string;
    chapterCount: number;
    segmentCount: number;
    sourceType: string;
    tags: string[];
    source?: 'builtin' | 'cloud';
    downloadUrl?: string;
}

export interface 发布小说分解创意工坊参数 {
    zipBlob: Blob;
    fileName: string;
    title: string;
    workName: string;
    contributor?: string;
    note?: string;
    chapterCount?: number;
    segmentCount?: number;
    sourceType?: string;
    tags?: string[];
}

export interface 发布小说分解创意工坊结果 {
    entry: 小说分解创意工坊条目;
    downloadUrl: string;
}

const API_PATH = '/api/workshop/novel-decomposition';

const 读取响应JSON = async (response: Response): Promise<any> => {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { error: text };
    }
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
    }
    return btoa(binary);
};

export const 列出小说分解创意工坊模块 = async (): Promise<小说分解创意工坊条目[]> => {
    const response = await fetch(API_PATH, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `读取创意工坊失败：${response.status}`);
    }
    const cloudEntries = (Array.isArray(payload?.entries) ? payload.entries : [])
        .map((entry: 小说分解创意工坊条目) => ({ ...entry, source: 'cloud' as const }));
    const seen = new Set(内置小说分解创意工坊模块.map((entry) => entry.id));
    return [
        ...内置小说分解创意工坊模块,
        ...cloudEntries.filter((entry: 小说分解创意工坊条目) => !seen.has(entry.id))
    ];
};

export const 发布小说分解创意工坊模块 = async (
    params: 发布小说分解创意工坊参数
): Promise<发布小说分解创意工坊结果> => {
    const response = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            fileName: params.fileName,
            title: params.title,
            workName: params.workName,
            contributor: params.contributor || '',
            note: params.note || '',
            chapterCount: params.chapterCount || 0,
            segmentCount: params.segmentCount || 0,
            sourceType: params.sourceType || '',
            tags: params.tags || [],
            zipBase64: await blobToBase64(params.zipBlob)
        })
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `发布创意工坊失败：${response.status}`);
    }
    return {
        entry: payload.entry,
        downloadUrl: payload.downloadUrl || `${API_PATH}?action=download&id=${encodeURIComponent(payload.entry?.id || '')}`
    };
};

export const 下载小说分解创意工坊模块 = async (id: string): Promise<Blob> => {
    const builtin = 内置小说分解创意工坊模块.find((entry) => entry.id === id);
    const response = await fetch(builtin?.downloadUrl || `${API_PATH}?action=download&id=${encodeURIComponent(id)}`);
    if (!response.ok) {
        const payload = await 读取响应JSON(response);
        throw new Error(payload?.error || `下载创意工坊模块失败：${response.status}`);
    }
    return response.blob();
};
