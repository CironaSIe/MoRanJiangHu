const IMAGE_HOST_UPLOAD_PROXY_PATH = '/api/image-host/upload';
const DEFAULT_IMAGE_HOST_BASE = 'https://image.bacon159.pp.ua';
const DEFAULT_SYNC_API_BASE = 'https://msjh.bacon159.pp.ua';
const MAX_DIRECT_UPLOAD_BYTES = 2.5 * 1024 * 1024;
const MAX_OPTIMIZED_IMAGE_EDGE = 1600;
const OPTIMIZED_IMAGE_QUALITY = 0.82;

export interface 图床上传结果 {
    url: string;
    id?: string;
    size?: number;
    storage?: string;
}

const readEnvText = (value: unknown): string => (
    typeof value === 'string' ? value.trim().replace(/\/+$/, '') : ''
);

export const buildImageHostProxyUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const configuredBase = readEnvText((import.meta as any).env?.VITE_SYNC_API_BASE_URL);
    if (configuredBase) return `${configuredBase}${normalizedPath}`;
    if (typeof window === 'undefined') return normalizedPath;
    if (/^https?:$/i.test(window.location.protocol)) return normalizedPath;
    return `${DEFAULT_SYNC_API_BASE}${normalizedPath}`;
};

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

const 估算DataUrl字节数 = (dataUrl: string): number => {
    const commaIndex = dataUrl.indexOf(',');
    const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1).replace(/\s+/g, '') : dataUrl;
    return Math.floor((base64.length * 3) / 4);
};

const blob转DataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('读取压缩图片失败'));
    reader.readAsDataURL(blob);
});

const 加载DataUrl图片 = (dataUrl: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('解析待上传图片失败'));
    image.src = dataUrl;
});

const 优化待上传DataUrl = async (dataUrl: string): Promise<string> => {
    if (估算DataUrl字节数(dataUrl) <= MAX_DIRECT_UPLOAD_BYTES) return dataUrl;
    if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
        return dataUrl;
    }

    const image = await 加载DataUrl图片(dataUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) return dataUrl;

    const scale = Math.min(1, MAX_OPTIMIZED_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const optimizedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', OPTIMIZED_IMAGE_QUALITY);
    });
    if (!optimizedBlob || optimizedBlob.size <= 0 || optimizedBlob.size >= 估算DataUrl字节数(dataUrl)) {
        return dataUrl;
    }
    return blob转DataUrl(optimizedBlob);
};

const 读取下载链接 = (payload: any): string => {
    const candidates = [
        payload?.links?.download,
        payload?.data?.links?.download,
        payload?.download,
        payload?.download_url,
        payload?.downloadUrl,
        payload?.data?.download,
        payload?.data?.download_url,
        payload?.data?.downloadUrl,
        payload?.data?.url,
        payload?.data?.file?.url,
        payload?.file?.links?.download,
        payload?.file?.download,
        payload?.file?.download_url,
        payload?.file?.downloadUrl,
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
    if (downloadUrl) return downloadUrl;
    if (!fileId) return '';
    return `${DEFAULT_IMAGE_HOST_BASE}/api/v1/file/${encodeURIComponent(fileId)}`;
};

export const 上传DataUrl到图床 = async (dataUrl: string, options?: { fileName?: string }): Promise<图床上传结果> => {
    const normalized = 读取文本(dataUrl);
    if (!normalized || !是否DataUrl(normalized)) {
        throw new Error('只支持上传 data URL 图片');
    }

    const uploadDataUrl = await 优化待上传DataUrl(normalized).catch(() => normalized);
    const { blob, mimeType } = dataUrl转Blob(uploadDataUrl);
    const extension = 推断扩展名(mimeType);
    const fileName = 读取文本(options?.fileName) || `moranjianghu-image-${Date.now()}.${extension}`;
    const form = new FormData();
    form.append('file', blob, fileName);

    const response = await fetch(buildImageHostProxyUrl(IMAGE_HOST_UPLOAD_PROXY_PATH), {
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
