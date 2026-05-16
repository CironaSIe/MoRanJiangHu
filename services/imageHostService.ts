const IMAGE_HOST_UPLOAD_PROXY_PATH = '/api/image-host/upload';

export interface 图床上传结果 {
    url: string;
    id?: string;
    size?: number;
    storage?: string;
}

const 读取文本 = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const 是否DataUrl = (value: string): boolean => /^data:[^;,]+;base64,/i.test(value);

const 推断扩展名 = (mimeType: string): string => {
    const normalized = mimeType.toLowerCase();
    if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
    if (normalized.includes('webp')) return 'webp';
    if (normalized.includes('gif')) return 'gif';
    if (normalized.includes('bmp')) return 'bmp';
    return 'png';
};

const dataUrl转Blob = (dataUrl: string): { blob: Blob; mimeType: string } => {
    const match = dataUrl.match(/^data:([^;,]+);base64,(.*)$/i);
    if (!match) throw new Error('图片 data URL 格式无效');
    const mimeType = match[1] || 'image/png';
    const base64 = (match[2] || '').replace(/\s+/g, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return { blob: new Blob([bytes], { type: 'application/octet-stream' }), mimeType };
};

const 读取下载链接 = (payload: any): string => {
    const candidates = [
        payload?.links?.download,
        payload?.data?.links?.download,
        payload?.file?.url,
        payload?.url
    ];
    return candidates.map(读取文本).find(Boolean) || '';
};

const 读取文件ID = (payload: any): string => (
    读取文本(payload?.file?.id)
    || 读取文本(payload?.id)
    || 读取文本(payload?.data?.file?.id)
    || 读取文本(payload?.data?.id)
);

const 构建稳定下载链接 = (payload: any): string => {
    const downloadUrl = 读取下载链接(payload);
    const fileId = 读取文件ID(payload);
    if (!fileId) return downloadUrl;
    try {
        const origin = new URL(downloadUrl).origin;
        return `${origin}/file/${encodeURIComponent(fileId)}`;
    } catch {
        return downloadUrl;
    }
};

export const 上传DataUrl到图床 = async (dataUrl: string, options?: { fileName?: string }): Promise<图床上传结果> => {
    const normalized = 读取文本(dataUrl);
    if (!normalized || !是否DataUrl(normalized)) {
        throw new Error('只支持上传 data URL 图片');
    }

    const { blob, mimeType } = dataUrl转Blob(normalized);
    const extension = 推断扩展名(mimeType);
    const fileName = 读取文本(options?.fileName) || `moranjianghu-image-${Date.now()}.${extension}`;
    const form = new FormData();
    form.append('file', blob, fileName);

    const response = await fetch(IMAGE_HOST_UPLOAD_PROXY_PATH, {
        method: 'POST',
        body: form
    });
    const text = await response.text();
    let payload: any = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = null;
    }
    if (!response.ok || payload?.success === false) {
        const message = 读取文本(payload?.error?.message) || 读取文本(payload?.error) || text.slice(0, 160) || `HTTP ${response.status}`;
        throw new Error(`图床上传失败：${message}`);
    }

    const url = 构建稳定下载链接(payload);
    if (!url) {
        throw new Error('图床上传失败：响应中没有下载链接');
    }
    return {
        url,
        id: 读取文件ID(payload) || undefined,
        size: typeof payload?.file?.size === 'number' ? payload.file.size : undefined,
        storage: 读取文本(payload?.file?.storage) || undefined
    };
};
