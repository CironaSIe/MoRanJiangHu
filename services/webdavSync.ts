import { RELEASE_INFO } from '../data/releaseInfo';
import type { 存档结构 } from '../types';
import { 设置键 } from '../utils/settingsSchema';
import { 构建同步API地址 } from '../utils/nativeRuntime';
import { extractSettingsSyncData, restoreSettingsSyncData, type 云同步恢复结果 } from './githubSync';
import { 导出ZIP存档文件, 解析ZIP存档文件 } from './saveArchiveService';
import * as dbService from './dbService';

const WEBDAV_ROOT_DIR = 'MoRanJiangHu';
const WEBDAV_SAVES_DIR = 'saves';
const WEBDAV_MANIFEST_FILE = 'manifest.json';
const WEBDAV_MANIFEST_FORMAT = 'moranjianghu-webdav-manifest';
const WEBDAV_PACKAGE_FORMAT = 'moranjianghu-webdav-save-package';
const WEBDAV_SETTINGS_PACKAGE_FORMAT = 'moranjianghu-webdav-settings-package';
const WEBDAV_MANIFEST_VERSION = 1;
const WEBDAV_SETTINGS_FILE = 'settings.json';
const WEBDAV_PROXY_PATH = '/api/webdav-proxy';
const PRIMARY_SYNC_API_BASE = 'https://msjh.bacon159.pp.ua';

export interface WebDAV同步配置 {
    url: string;
    username: string;
    password: string;
}

export interface WebDAV云存档元数据 {
    id: string;
    fileName: string;
    title: string;
    type: 'manual' | 'auto';
    saveTimestamp: number;
    savedAt: string;
    syncedAt: string;
    deviceType: 'phone' | 'computer';
    deviceLabel: string;
    appVersion: string;
    versionCode: number;
    hash: string;
    size: number;
    location: string;
    gameTime: string;
}

interface WebDAV清单结构 {
    format: typeof WEBDAV_MANIFEST_FORMAT;
    version: number;
    updatedAt: string;
    saves: WebDAV云存档元数据[];
    settings?: WebDAV设置同步元数据 | null;
}

interface WebDAV存档包 {
    format: typeof WEBDAV_PACKAGE_FORMAT;
    version: number;
    metadata: WebDAV云存档元数据;
    archiveBase64: string;
}

export interface WebDAV增量同步结果 {
    uploaded: number;
    skipped: number;
    total: number;
}

export interface WebDAV设置同步元数据 {
    fileName: string;
    syncedAt: string;
    deviceType: 'phone' | 'computer';
    deviceLabel: string;
    appVersion: string;
    versionCode: number;
    hash: string;
    size: number;
}

interface WebDAV设置包 {
    format: typeof WEBDAV_SETTINGS_PACKAGE_FORMAT;
    version: number;
    metadata: WebDAV设置同步元数据;
    archiveBase64: string;
}

export interface WebDAV同步摘要 {
    saveCount: number;
    updatedAt: string | null;
    settings: WebDAV设置同步元数据 | null;
}

const 读取文本 = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 规范化配置 = (value: unknown): WebDAV同步配置 | null => {
    const raw = value as Partial<WebDAV同步配置> | null;
    if (!raw || typeof raw !== 'object') return null;
    const url = 读取文本(raw.url).replace(/\/+$/, '');
    const username = 读取文本(raw.username);
    const password = typeof raw.password === 'string' ? raw.password : '';
    if (!url || !username || !password) return null;
    return { url, username, password };
};

export const 读取WebDAV同步配置 = async (): Promise<WebDAV同步配置 | null> => (
    规范化配置(await dbService.读取设置(设置键.WebDAV同步配置))
);

export const 保存WebDAV同步配置 = async (config: WebDAV同步配置): Promise<void> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    await dbService.保存设置(设置键.WebDAV同步配置, normalized);
};

const 基础认证头 = (config: WebDAV同步配置): string => {
    const raw = `${config.username}:${config.password}`;
    const encoded = btoa(unescape(encodeURIComponent(raw)));
    return `Basic ${encoded}`;
};

const 编码路径段 = (segment: string): string => encodeURIComponent(segment).replace(/%2F/gi, '/');

const 构建WebDAV地址 = (config: WebDAV同步配置, segments: string[] = []): string => {
    const suffix = segments.map(编码路径段).join('/');
    return suffix ? `${config.url}/${suffix}` : config.url;
};

const 读取错误详情 = async (response: Response): Promise<string> => {
    const text = await response.text().catch(() => '');
    return text ? ` - ${text.replace(/\s+/g, ' ').slice(0, 180)}` : '';
};

const 构建WebDAV代理地址 = (): string => {
    const configured = 构建同步API地址(WEBDAV_PROXY_PATH);
    if (/^https?:\/\//i.test(configured)) return configured;
    if (typeof window === 'undefined') return configured;

    const hostname = window.location.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (hostname && hostname !== 'msjh.bacon159.pp.ua' && !isLocalhost) {
        return `${PRIMARY_SYNC_API_BASE}${WEBDAV_PROXY_PATH}`;
    }
    return configured;
};

const 等待 = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const 是否可重试代理错误 = (status: number, detail: string): boolean => (
    status === 502 && /network connection lost|fetch failed|networkerror|connection reset|econnreset|timeout/i.test(detail)
);

const 克隆响应 = async (response: Response): Promise<Response> => (
    new Response(await response.text().catch(() => ''), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    })
);

const 是否WebDAV锁定响应 = (response: Response): boolean => response.status === 423;

const webdavFetch = async (
    config: WebDAV同步配置,
    method: string,
    segments: string[] = [],
    init?: { headers?: Record<string, string>; body?: BodyInit | null }
): Promise<Response> => {
    let lastTransientFailure: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(构建WebDAV代理地址(), {
            method: 'POST',
            headers: {
                'X-WebDAV-Method': method,
                'X-WebDAV-Target-Url': 构建WebDAV地址(config, segments),
                Authorization: 基础认证头(config),
                ...init?.headers
            },
            body: init?.body ?? null
        });
        if (response.status !== 502) return response;

        const cloned = await 克隆响应(response);
        const detail = await cloned.clone().text().catch(() => '');
        if (!是否可重试代理错误(response.status, detail)) return cloned;
        lastTransientFailure = cloned;
        await 等待(450 * (attempt + 1));
    }
    return lastTransientFailure || new Response('WebDAV proxy request failed', { status: 502 });
};

const 确保集合 = async (config: WebDAV同步配置, segments: string[]): Promise<void> => {
    let lastLockedResponse: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const response = await webdavFetch(config, 'MKCOL', segments);
        if ([200, 201, 204, 405].includes(response.status)) return;
        if (!是否WebDAV锁定响应(response)) {
            throw new Error(`创建 WebDAV 目录失败：${response.status}${await 读取错误详情(response)}`);
        }
        lastLockedResponse = await 克隆响应(response);
        await 等待(500 * (attempt + 1));
    }
    const response = lastLockedResponse || new Response('WebDAV directory is locked', { status: 423 });
    throw new Error(`创建 WebDAV 目录失败：${response.status}${await 读取错误详情(response)}`);
};

const 确保WebDAV目录结构 = async (config: WebDAV同步配置): Promise<void> => {
    await 确保集合(config, [WEBDAV_ROOT_DIR]);
    await 确保集合(config, [WEBDAV_ROOT_DIR, WEBDAV_SAVES_DIR]);
};

const 读取远端清单 = async (config: WebDAV同步配置): Promise<WebDAV清单结构> => {
    const response = await webdavFetch(config, 'GET', [WEBDAV_ROOT_DIR, WEBDAV_MANIFEST_FILE]);
    if (response.status === 404) {
        return {
            format: WEBDAV_MANIFEST_FORMAT,
            version: WEBDAV_MANIFEST_VERSION,
            updatedAt: new Date().toISOString(),
            saves: [],
            settings: null
        };
    }
    if (!response.ok) {
        throw new Error(`读取 WebDAV 云存档清单失败：${response.status}${await 读取错误详情(response)}`);
    }
    const parsed = await response.json().catch(() => null) as WebDAV清单结构 | null;
    if (parsed?.format !== WEBDAV_MANIFEST_FORMAT || !Array.isArray(parsed?.saves)) {
        throw new Error('WebDAV 云存档清单格式无效');
    }
    return {
        format: WEBDAV_MANIFEST_FORMAT,
        version: Number(parsed.version) || WEBDAV_MANIFEST_VERSION,
        updatedAt: 读取文本(parsed.updatedAt) || new Date().toISOString(),
        saves: parsed.saves.filter((item) => 读取文本(item?.id) && 读取文本(item?.fileName)),
        settings: parsed.settings?.fileName ? parsed.settings : null
    };
};

const 写入远端清单 = async (config: WebDAV同步配置, manifest: WebDAV清单结构): Promise<void> => {
    const response = await webdavFetch(config, 'PUT', [WEBDAV_ROOT_DIR, WEBDAV_MANIFEST_FILE], {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
            ...manifest,
            updatedAt: new Date().toISOString()
        }, null, 2)
    });
    if (!response.ok) {
        throw new Error(`写入 WebDAV 云存档清单失败：${response.status}${await 读取错误详情(response)}`);
    }
};

const 安全文件名 = (value: string, fallback: string): string => {
    const normalized = value
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80);
    return normalized || fallback;
};

const pad2 = (value: number): string => Math.trunc(value).toString().padStart(2, '0');

const 格式化时间戳 = (timestamp: number): string => {
    const date = new Date(timestamp || Date.now());
    if (Number.isNaN(date.getTime())) return `${Date.now()}`;
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
};

const 读取地点文本 = (save: 存档结构): string => {
    const env = save.环境信息 || ({} as any);
    const list = [env.具体地点, env.小地点, env.中地点, env.大地点]
        .map((item: unknown) => 读取文本(item))
        .filter(Boolean);
    return list[0] || '未知地点';
};

const 读取时间文本 = (save: 存档结构): string => {
    const env = save.环境信息 || ({} as any);
    const text = 读取文本(env.时间);
    if (text) return text;
    return 格式化时间戳(Number(save.时间戳 || Date.now()));
};

const 获取设备类型 = (): WebDAV云存档元数据['deviceType'] => {
    if (typeof navigator === 'undefined') return 'computer';
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') ? 'phone' : 'computer';
};

const 获取设备标签 = (): string => (
    获取设备类型() === 'phone' ? '手机' : '电脑'
);

const 字节转Base64 = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
};

const base64转字节 = (value: string): Uint8Array => {
    const binary = atob(value.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
};

const 计算SHA256 = async (bytes: Uint8Array): Promise<string> => {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
        return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, '0')).join('');
    }
    let hash = 2166136261;
    for (const byte of bytes) {
        hash ^= byte;
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
};

const 构建云存档元数据 = async (save: 存档结构, archiveBytes: Uint8Array): Promise<WebDAV云存档元数据> => {
    const title = 读取文本(save.角色数据?.姓名) || '未知角色';
    const hash = await 计算SHA256(archiveBytes);
    const stamp = 格式化时间戳(Number(save.时间戳 || Date.now()));
    const id = `${save.类型 === 'auto' ? 'auto' : 'manual'}_${stamp}_${hash.slice(0, 12)}`;
    return {
        id,
        fileName: `${安全文件名(id, 'save')}.json`,
        title,
        type: save.类型 === 'auto' ? 'auto' : 'manual',
        saveTimestamp: Number(save.时间戳 || Date.now()),
        savedAt: new Date(Number(save.时间戳 || Date.now())).toISOString(),
        syncedAt: new Date().toISOString(),
        deviceType: 获取设备类型(),
        deviceLabel: 获取设备标签(),
        appVersion: RELEASE_INFO.versionName,
        versionCode: RELEASE_INFO.versionCode,
        hash,
        size: archiveBytes.length,
        location: 读取地点文本(save),
        gameTime: 读取时间文本(save)
    };
};

export const 测试WebDAV连接 = async (config: WebDAV同步配置): Promise<void> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    await 确保WebDAV目录结构(normalized);
    await 读取远端清单(normalized);
};

export const 读取WebDAV同步摘要 = async (config: WebDAV同步配置): Promise<WebDAV同步摘要> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    await 确保WebDAV目录结构(normalized);
    const manifest = await 读取远端清单(normalized);
    return {
        saveCount: manifest.saves.length,
        updatedAt: manifest.updatedAt || null,
        settings: manifest.settings || null
    };
};

export const 列出WebDAV云存档 = async (config: WebDAV同步配置): Promise<WebDAV云存档元数据[]> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    await 确保WebDAV目录结构(normalized);
    const manifest = await 读取远端清单(normalized);
    return [...manifest.saves].sort((a, b) => Number(b.saveTimestamp || 0) - Number(a.saveTimestamp || 0));
};

const 构建设置元数据 = async (bytes: Uint8Array): Promise<WebDAV设置同步元数据> => ({
    fileName: WEBDAV_SETTINGS_FILE,
    syncedAt: new Date().toISOString(),
    deviceType: 获取设备类型(),
    deviceLabel: 获取设备标签(),
    appVersion: RELEASE_INFO.versionName,
    versionCode: RELEASE_INFO.versionCode,
    hash: await 计算SHA256(bytes),
    size: bytes.length
});

export const 上传设置到WebDAV = async (config: WebDAV同步配置): Promise<WebDAV设置同步元数据> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    await 确保WebDAV目录结构(normalized);
    const manifest = await 读取远端清单(normalized);
    const bytes = await extractSettingsSyncData();
    const metadata = await 构建设置元数据(bytes);
    const packagePayload: WebDAV设置包 = {
        format: WEBDAV_SETTINGS_PACKAGE_FORMAT,
        version: WEBDAV_MANIFEST_VERSION,
        metadata,
        archiveBase64: 字节转Base64(bytes)
    };
    const response = await webdavFetch(normalized, 'PUT', [WEBDAV_ROOT_DIR, metadata.fileName], {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(packagePayload)
    });
    if (!response.ok) {
        throw new Error(`上传 WebDAV 设置包失败：${response.status}${await 读取错误详情(response)}`);
    }
    manifest.settings = metadata;
    await 写入远端清单(normalized, manifest);
    return metadata;
};

export const 下载设置自WebDAV = async (config: WebDAV同步配置): Promise<云同步恢复结果> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    const manifest = await 读取远端清单(normalized);
    const fileName = manifest.settings?.fileName || WEBDAV_SETTINGS_FILE;
    const response = await webdavFetch(normalized, 'GET', [WEBDAV_ROOT_DIR, fileName]);
    if (!response.ok) {
        throw new Error(`下载 WebDAV 设置包失败：${response.status}${await 读取错误详情(response)}`);
    }
    const payload = await response.json().catch(() => null) as WebDAV设置包 | null;
    if (payload?.format !== WEBDAV_SETTINGS_PACKAGE_FORMAT || !读取文本(payload.archiveBase64)) {
        throw new Error('WebDAV 设置包格式无效');
    }
    return restoreSettingsSyncData(base64转字节(payload.archiveBase64));
};

export const 增量同步到WebDAV = async (config: WebDAV同步配置, saves?: 存档结构[]): Promise<WebDAV增量同步结果> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    await 确保WebDAV目录结构(normalized);
    const manifest = await 读取远端清单(normalized);
    const localSaves = Array.isArray(saves) ? saves : await dbService.读取存档列表();
    const knownHashes = new Set(manifest.saves.map((item) => item.hash).filter(Boolean));
    let uploaded = 0;
    let skipped = 0;

    for (const save of localSaves) {
        const saveCopy = 深拷贝(save);
        const archiveBlob = await 导出ZIP存档文件({ saves: [saveCopy] });
        const archiveBytes = new Uint8Array(await archiveBlob.arrayBuffer());
        const metadata = await 构建云存档元数据(saveCopy, archiveBytes);
        if (knownHashes.has(metadata.hash)) {
            skipped += 1;
            continue;
        }

        const packagePayload: WebDAV存档包 = {
            format: WEBDAV_PACKAGE_FORMAT,
            version: WEBDAV_MANIFEST_VERSION,
            metadata,
            archiveBase64: 字节转Base64(archiveBytes)
        };
        const response = await webdavFetch(normalized, 'PUT', [WEBDAV_ROOT_DIR, WEBDAV_SAVES_DIR, metadata.fileName], {
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(packagePayload)
        });
        if (!response.ok) {
            throw new Error(`上传 WebDAV 云存档失败：${response.status}${await 读取错误详情(response)}`);
        }

        manifest.saves = manifest.saves.filter((item) => item.hash !== metadata.hash && item.id !== metadata.id);
        manifest.saves.push(metadata);
        knownHashes.add(metadata.hash);
        uploaded += 1;
    }

    manifest.saves.sort((a, b) => Number(b.saveTimestamp || 0) - Number(a.saveTimestamp || 0));
    await 写入远端清单(normalized, manifest);
    return { uploaded, skipped, total: localSaves.length };
};

export const 下载WebDAV云存档 = async (
    config: WebDAV同步配置,
    item: WebDAV云存档元数据
): Promise<{ save: 存档结构; metadata: WebDAV云存档元数据 }> => {
    const normalized = 规范化配置(config);
    if (!normalized) throw new Error('请填写 WebDAV 地址、用户名和密码');
    const fileName = 读取文本(item.fileName);
    if (!fileName) throw new Error('云存档文件名无效');
    const response = await webdavFetch(normalized, 'GET', [WEBDAV_ROOT_DIR, WEBDAV_SAVES_DIR, fileName]);
    if (!response.ok) {
        throw new Error(`下载 WebDAV 云存档失败：${response.status}${await 读取错误详情(response)}`);
    }
    const payload = await response.json().catch(() => null) as WebDAV存档包 | null;
    if (payload?.format !== WEBDAV_PACKAGE_FORMAT || !读取文本(payload.archiveBase64)) {
        throw new Error('WebDAV 云存档包格式无效');
    }
    const archiveBytes = base64转字节(payload.archiveBase64);
    const archive = new Blob([archiveBytes], { type: 'application/zip' });
    const parsed = await 解析ZIP存档文件(archive);
    const save = Array.isArray(parsed.saves) ? parsed.saves[0] : null;
    if (!save) throw new Error('WebDAV 云存档包中没有有效存档');
    return { save, metadata: payload.metadata || item };
};
