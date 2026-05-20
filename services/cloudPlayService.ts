import type { 存档结构 } from '../types';
import * as dbService from './dbService';
import { 导出ZIP存档文件, 解析ZIP存档文件 } from './saveArchiveService';
import { 上传Blob到图床, buildImageHostProxyUrl } from './imageHostService';
import {
    读取对象存储同步配置,
    增量同步到对象存储,
    type 对象存储同步配置
} from './objectStorageSync';

const CLOUD_PLAY_API_PATH = '/api/cloud-play';
const SESSION_KEY = 'moranjianghu.cloudPlay.session.v1';
const OBJECT_STORAGE_MODE_KEY = 'moranjianghu.cloudPlay.objectStorageMode.v1';
const RISK_ACK_KEY = 'moranjianghu.cloudPlay.riskAcknowledged.v1';
const PBKDF2_ITERATIONS = 160000;
const CLOUD_PLAY_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export const 云端游玩风险提示文本 = '云端游玩所有数据都存在云端，公益项目使用TG图床，如果频道被封可能存在数据丢失的风险，请做好本地备份工作，数据丢失概不负责。';

export type 云端游玩账号 = {
    userId: string;
    username: string;
    password: string;
    clientSalt: string;
    manifestUrl?: string;
    manifestUpdatedAt?: string;
};

export type 云端存档摘要 = {
    cloudId: string;
    syncHash: string;
    title: string;
    type: 'auto' | 'manual';
    timestamp: number;
    savedAt: string;
    location: string;
    gameTime: string;
    historyCount: number;
    packageUrl: string;
    packageSize?: number;
    sha256: string;
};

export type 云端存档清单 = {
    format: 'moranjianghu-cloud-play';
    version: 1;
    userId: string;
    username: string;
    updatedAt: string;
    saves: 云端存档摘要[];
};

type ApiUser = Omit<云端游玩账号, 'password'>;
type 持久云端游玩会话 = {
    expiresAt: number;
    session: 云端游玩账号;
};

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const randomBytes = (length: number): Uint8Array => crypto.getRandomValues(new Uint8Array(length));

const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        const chunk = bytes.subarray(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
};

const arrayBufferToBytes = (buffer: ArrayBuffer): Uint8Array => new Uint8Array(buffer);

const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const 导入加密密钥 = async (session: 云端游玩账号): Promise<CryptoKey> => {
    const material = await crypto.subtle.importKey(
        'raw',
        TEXT_ENCODER.encode(`${session.username}\n${session.password}`),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: TEXT_ENCODER.encode(session.clientSalt),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

const 加密字节 = async (bytes: Uint8Array, session: 云端游玩账号): Promise<Uint8Array> => {
    const iv = randomBytes(12);
    const key = await 导入加密密钥(session);
    const encrypted = arrayBufferToBytes(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
    const payload = {
        format: 'moranjianghu-cloud-play-encrypted',
        version: 1,
        algorithm: 'AES-GCM',
        kdf: 'PBKDF2-SHA256',
        iterations: PBKDF2_ITERATIONS,
        iv: bytesToBase64(iv),
        data: bytesToBase64(encrypted)
    };
    return TEXT_ENCODER.encode(JSON.stringify(payload));
};

const 解密字节 = async (payloadBytes: Uint8Array, session: 云端游玩账号): Promise<Uint8Array> => {
    const payload = JSON.parse(TEXT_DECODER.decode(payloadBytes));
    if (payload?.format !== 'moranjianghu-cloud-play-encrypted') throw new Error('云端存档包格式不受支持。');
    const iv = base64ToBytes(readString(payload.iv));
    const data = base64ToBytes(readString(payload.data));
    const key = await 导入加密密钥(session);
    return arrayBufferToBytes(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data));
};

const callCloudPlayApi = async (action: string, body: Record<string, unknown>): Promise<any> => {
    const response = await fetch(`${buildImageHostProxyUrl(CLOUD_PLAY_API_PATH)}?action=${encodeURIComponent(action)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body)
    });
    const text = await response.text();
    let payload: any = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = null;
    }
    if (!response.ok || payload?.ok === false) {
        throw new Error(readString(payload?.error) || text.slice(0, 160) || `HTTP ${response.status}`);
    }
    return payload;
};

const 保存会话 = (session: 云端游玩账号): void => {
    const payload: 持久云端游玩会话 = {
        expiresAt: Date.now() + CLOUD_PLAY_SESSION_TTL_MS,
        session
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
};

const 读取有效云端会话载荷 = (): 持久云端游玩会话 | null => {
    try {
        const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        const payload: 持久云端游玩会话 = parsed?.session ? parsed : {
            session: parsed,
            expiresAt: 0
        };
        if (!payload?.session?.username || !payload.session?.password || !payload.session?.clientSalt) return null;
        if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return payload;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
};

export const 读取云端游玩会话 = (): 云端游玩账号 | null => {
    return 读取有效云端会话载荷()?.session || null;
};

export const 清除云端游玩会话 = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

export const 启用对象存储云端游玩模式 = (): void => {
    localStorage.setItem(OBJECT_STORAGE_MODE_KEY, 'true');
    localStorage.removeItem(SESSION_KEY);
};

export const 清除对象存储云端游玩模式 = (): void => {
    localStorage.removeItem(OBJECT_STORAGE_MODE_KEY);
};

export const 读取对象存储云端游玩配置 = async (): Promise<对象存储同步配置 | null> => {
    if (localStorage.getItem(OBJECT_STORAGE_MODE_KEY) !== 'true') return null;
    return 读取对象存储同步配置();
};

export const 已确认云端游玩风险 = (): boolean => localStorage.getItem(RISK_ACK_KEY) === 'true';

export const 设置云端游玩风险确认 = (): void => {
    localStorage.setItem(RISK_ACK_KEY, 'true');
};

export const 注册云端游玩账号 = async (username: string, password: string): Promise<云端游玩账号> => {
    const payload = await callCloudPlayApi('register', { username, password });
    const user = payload.user as ApiUser;
    const session = { ...user, password };
    保存会话(session);
    return session;
};

export const 登录云端游玩账号 = async (username: string, password: string): Promise<云端游玩账号> => {
    const payload = await callCloudPlayApi('login', { username, password });
    const user = payload.user as ApiUser;
    const session = { ...user, password };
    保存会话(session);
    return session;
};

const 更新云端清单地址 = async (session: 云端游玩账号, manifestUrl: string): Promise<云端游玩账号> => {
    const payload = await callCloudPlayApi('update-manifest', {
        username: session.username,
        password: session.password,
        manifestUrl
    });
    const user = payload.user as ApiUser;
    const nextSession = { ...session, ...user, password: session.password };
    保存会话(nextSession);
    return nextSession;
};

const 空清单 = (session: 云端游玩账号): 云端存档清单 => ({
    format: 'moranjianghu-cloud-play',
    version: 1,
    userId: session.userId,
    username: session.username,
    updatedAt: new Date().toISOString(),
    saves: []
});

export const 读取云端存档清单 = async (session: 云端游玩账号): Promise<云端存档清单> => {
    const manifestUrl = readString(session.manifestUrl);
    if (!manifestUrl) return 空清单(session);
    const response = await fetch(manifestUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`读取云端存档清单失败：HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.format !== 'moranjianghu-cloud-play' || !Array.isArray(payload?.saves)) {
        throw new Error('云端存档清单格式无效。');
    }
    return {
        format: 'moranjianghu-cloud-play',
        version: 1,
        userId: readString(payload.userId) || session.userId,
        username: readString(payload.username) || session.username,
        updatedAt: readString(payload.updatedAt) || new Date().toISOString(),
        saves: payload.saves
    };
};

const 读取地点文本 = (save: Partial<存档结构>): string => {
    const env: any = save.环境信息 || {};
    return [env.具体地点, env.小地点, env.中地点, env.大地点]
        .map(readString)
        .find(Boolean) || '未知地点';
};

const 读取时间文本 = (save: Partial<存档结构>): string => {
    const env: any = save.环境信息 || {};
    const direct = readString(env.时间);
    if (direct) return direct;
    const values = [env.年, env.月, env.日, env.时, env.分].map((item) => Number(item));
    if (values.every(Number.isFinite)) {
        const pad2 = (value: number) => Math.trunc(value).toString().padStart(2, '0');
        return `${Math.trunc(values[0])}:${pad2(values[1])}:${pad2(values[2])}:${pad2(values[3])}:${pad2(values[4])}`;
    }
    return '未知时间';
};

const 构建云端摘要 = (save: 存档结构, packageUrl: string, packageSize: number | undefined, sha256: string): 云端存档摘要 => {
    const syncHash = dbService.计算存档同步哈希(save);
    return {
        cloudId: `${save.类型 === 'auto' ? 'auto' : 'manual'}-${syncHash.slice(0, 16)}`,
        syncHash,
        title: readString(save.角色数据?.姓名) || '未知角色',
        type: save.类型 === 'auto' ? 'auto' : 'manual',
        timestamp: Number(save.时间戳) || Date.now(),
        savedAt: new Date(Number(save.元数据?.现实保存时间戳 || save.时间戳 || Date.now())).toISOString(),
        location: 读取地点文本(save),
        gameTime: 读取时间文本(save),
        historyCount: Array.isArray(save.历史记录) ? save.历史记录.length : 0,
        packageUrl,
        packageSize,
        sha256
    };
};

const 上传清单 = async (session: 云端游玩账号, manifest: 云端存档清单): Promise<云端游玩账号> => {
    const normalized: 云端存档清单 = {
        ...manifest,
        format: 'moranjianghu-cloud-play',
        version: 1,
        userId: session.userId,
        username: session.username,
        updatedAt: new Date().toISOString(),
        saves: [...manifest.saves].sort((a, b) => b.timestamp - a.timestamp)
    };
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
    const uploaded = await 上传Blob到图床(blob, { fileName: `moranjianghu-cloud-manifest-${session.userId}-${Date.now()}.json` });
    return 更新云端清单地址(session, uploaded.url);
};

export const 上传单个存档到云端 = async (
    session: 云端游玩账号,
    save: 存档结构,
    currentManifest?: 云端存档清单
): Promise<{ session: 云端游玩账号; manifest: 云端存档清单; uploaded: boolean }> => {
    const manifest = currentManifest || await 读取云端存档清单(session);
    const syncHash = dbService.计算存档同步哈希(save);
    if (manifest.saves.some((item) => item.syncHash === syncHash)) {
        return { session, manifest, uploaded: false };
    }
    const zipBlob = await 导出ZIP存档文件({ saves: [save], includeImages: true });
    const zipBytes = arrayBufferToBytes(await zipBlob.arrayBuffer());
    const encryptedBytes = await 加密字节(zipBytes, session);
    const encryptedHash = await sha256Hex(encryptedBytes);
    const packageBlob = new Blob([encryptedBytes], { type: 'application/octet-stream' });
    const uploaded = await 上传Blob到图床(packageBlob, {
        fileName: `moranjianghu-cloud-save-${session.userId}-${syncHash.slice(0, 12)}.mjc`
    });
    const nextManifest: 云端存档清单 = {
        ...manifest,
        saves: [
            构建云端摘要(save, uploaded.url, uploaded.size, encryptedHash),
            ...manifest.saves.filter((item) => item.syncHash !== syncHash)
        ]
    };
    const nextSession = await 上传清单(session, nextManifest);
    return { session: nextSession, manifest: { ...nextManifest, updatedAt: new Date().toISOString() }, uploaded: true };
};

let 后台同步队列: Promise<unknown> = Promise.resolve();

export const 后台同步存档到云端 = (save: 存档结构): void => {
    const session = 读取云端游玩会话();
    if (!session) {
        后台同步队列 = 后台同步队列
            .catch(() => undefined)
            .then(async () => {
                const objectStorageConfig = await 读取对象存储云端游玩配置();
                if (!objectStorageConfig) return;
                await 增量同步到对象存储(objectStorageConfig, [save]);
            })
            .catch((error) => {
                console.warn('对象存储云端游玩自动同步失败:', error);
            });
        return;
    }
    后台同步队列 = 后台同步队列
        .catch(() => undefined)
        .then(async () => {
            const result = await 上传单个存档到云端(session, save);
            if (result.session) 保存会话(result.session);
        })
        .catch((error) => {
            console.warn('云端游玩自动同步失败:', error);
        });
};

export const 复制全部本地存档到云端 = async (
    session: 云端游玩账号,
    onProgress?: (message: string) => void
): Promise<{ uploaded: number; skipped: number; total: number; session: 云端游玩账号 }> => {
    const localSaves = await dbService.读取存档列表();
    let manifest = await 读取云端存档清单(session);
    let activeSession = session;
    let uploaded = 0;
    let skipped = 0;
    const knownHashes = new Set(manifest.saves.map((item) => item.syncHash));
    for (let index = 0; index < localSaves.length; index += 1) {
        const save = localSaves[index];
        const syncHash = dbService.计算存档同步哈希(save);
        if (knownHashes.has(syncHash)) {
            skipped += 1;
            continue;
        }
        onProgress?.(`正在复制 ${index + 1}/${localSaves.length}：${readString(save.角色数据?.姓名) || '未知角色'}`);
        const result = await 上传单个存档到云端(activeSession, save, manifest);
        activeSession = result.session;
        manifest = result.manifest;
        knownHashes.add(syncHash);
        if (result.uploaded) uploaded += 1;
        else skipped += 1;
    }
    保存会话(activeSession);
    return { uploaded, skipped, total: localSaves.length, session: activeSession };
};

export const 下载云端存档包 = async (session: 云端游玩账号, item: 云端存档摘要): Promise<dbService.存档导出结构> => {
    const response = await fetch(item.packageUrl);
    if (!response.ok) throw new Error(`下载云端存档失败：HTTP ${response.status}`);
    const encryptedBytes = arrayBufferToBytes(await response.arrayBuffer());
    const hash = await sha256Hex(encryptedBytes);
    if (item.sha256 && hash !== item.sha256) throw new Error('云端存档校验失败，文件可能不完整。');
    const zipBytes = await 解密字节(encryptedBytes, session);
    return 解析ZIP存档文件(new Blob([zipBytes], { type: 'application/zip' }));
};

export const 导入云端存档到本地 = async (session: 云端游玩账号, item: 云端存档摘要): Promise<dbService.存档导入结果> => {
    const payload = await 下载云端存档包(session, item);
    return dbService.导入存档数据(payload, { 覆盖现有: false });
};

export const 保存云端存档为本地文件 = async (session: 云端游玩账号, item: 云端存档摘要): Promise<void> => {
    const payload = await 下载云端存档包(session, item);
    const blob = await 导出ZIP存档文件({ saves: payload.saves, includeImages: true });
    const safeTitle = (item.title || 'cloud-save').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').slice(0, 40) || 'cloud-save';
    const url = URL.createObjectURL(blob);
    try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `墨染江湖_云端存档_${safeTitle}_${item.syncHash.slice(0, 8)}.zip`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
};
