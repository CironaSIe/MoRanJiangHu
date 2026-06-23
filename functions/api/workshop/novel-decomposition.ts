import { tryDbBucket } from '../_shared/dbStore';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const WORKSHOP_PREFIX = 'moranjianghu/workshop/novel-decomposition';
const MAX_ZIP_BYTES = 64 * 1024 * 1024;
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const encoder = new TextEncoder();

type WorkshopEntry = {
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
    r2Key: string;
    hi168Key?: string;
    hi168Url?: string;
    ownerUserId?: string;
    ownerUsername?: string;
    anonymous?: boolean;
};

type CloudPlayUser = {
    userId: string;
    username: string;
    usernameKey: string;
    passwordSalt: string;
    passwordHash: string;
};

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...CORS_HEADERS,
            'Cache-Control': 'no-store'
        }
    })
);

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const getBucket = (env: any): any => {
    const dbBucket = tryDbBucket(env, 'workshop_novel_data');
    if (dbBucket) return dbBucket;
    const candidate = env?.WORKSHOP_R2 || env?.CNB_SYNC_R2;
    if (!candidate || typeof candidate.get !== 'function' || typeof candidate.put !== 'function') return null;
    return candidate;
};

const getPrefix = (env: any): string => (
    readString(env?.WORKSHOP_NOVEL_DECOMPOSITION_PREFIX) || WORKSHOP_PREFIX
).replace(/^\/+|\/+$/g, '') || WORKSHOP_PREFIX;

const getChinaDateKey = (date = new Date()): string => (
    new Date(date.getTime() + CHINA_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
);

const sanitizeFilename = (value: unknown, fallback: string): string => {
    const safe = readString(value)
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 80);
    return (safe || fallback).replace(/\.zip$/i, '') + '.zip';
};

const sanitizeText = (value: unknown, maxLength: number): string => readString(value).replace(/\s+/g, ' ').slice(0, maxLength);

const normalizeWorkTitle = (value: unknown, maxLength = 80): string => {
    const text = sanitizeText(value, maxLength * 2);
    const bracketMatch = text.match(/《\s*([^《》]{1,120}?)\s*》/);
    const candidate = bracketMatch?.[1] || text;
    return candidate
        .replace(/[《》]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
};

const decodeBase64 = (value: unknown): Uint8Array => {
    const text = readString(value).replace(/^data:application\/zip;base64,/i, '').replace(/\s+/g, '');
    if (!text) throw new Error('缺少 ZIP 内容');
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    if (bytes.byteLength <= 0) throw new Error('ZIP 内容为空');
    if (bytes.byteLength > MAX_ZIP_BYTES) throw new Error('ZIP 过大，请控制在 64MB 以内');
    return bytes;
};

const bytesToHex = (bytes: ArrayBuffer): string => (
    Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, '0')).join('')
);

const sha256HexBytes = async (bytes: Uint8Array): Promise<string> => (
    bytesToHex(await crypto.subtle.digest('SHA-256', bytes))
);

const hmac = async (key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> => {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
};

const sha256HexText = async (value: string): Promise<string> => (
    bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
);

const hmacHex = async (secret: string, value: string): Promise<string> => {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return bytesToHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
};

const timingSafeEqual = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
    return diff === 0;
};

const deriveSigningKey = async (secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> => {
    const kDate = await hmac(encoder.encode(`AWS4${secretKey}`), dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    return hmac(kService, 'aws4_request');
};

const formatAmzDate = (date: Date): { amzDate: string; dateStamp: string } => {
    const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    return { amzDate: iso, dateStamp: iso.slice(0, 8) };
};

const encodeS3Path = (value: string): string => value
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('/');

const buildHi168PublicUrl = (env: any, key: string): string => {
    const endpoint = readString(env?.MORAN_OSS_ENDPOINT) || 'https://s3.hi168.com';
    const bucket = readString(env?.MORAN_OSS_BUCKET);
    if (!bucket) return '';
    return `${endpoint.replace(/\/+$/, '')}/${encodeURIComponent(bucket)}/${encodeS3Path(key)}`;
};

const getCloudPlayPrefix = (env: any): string => (
    readString(env?.CLOUD_PLAY_R2_PREFIX) || 'moranjianghu/cloud-play'
).replace(/^\/+|\/+$/g, '') || 'moranjianghu/cloud-play';

const sanitizeUsername = (value: unknown): string => {
    const username = readString(value).replace(/\s+/g, '');
    if (username.length < 3 || username.length > 32) throw new Error('请先用有效联机用户名登录。');
    if (!/^[\p{L}\p{N}_-]+$/u.test(username)) throw new Error('联机用户名格式无效。');
    return username;
};

const sanitizePassword = (value: unknown): string => {
    const password = typeof value === 'string' ? value : '';
    if (password.length < 6 || password.length > 128) throw new Error('请先用有效联机密码登录。');
    return password;
};

const authenticateWorkshopUser = async (env: any, auth: any): Promise<CloudPlayUser> => {
    const bucket = getBucket(env);
    if (!bucket) throw new Error('创意工坊存储未配置。');
    const username = sanitizeUsername(auth?.username);
    const password = sanitizePassword(auth?.password);
    const usernameKey = await sha256HexText(username.toLowerCase());
    const object = await bucket.get(`${getCloudPlayPrefix(env)}/users/${usernameKey}.json`);
    if (!object) throw new Error('请先登录联机账号后再管理创意工坊投稿。');
    const user = await object.json<CloudPlayUser>().catch(() => null);
    if (!user?.passwordSalt || !user.passwordHash) throw new Error('账号数据损坏。');
    const passwordHash = await hmacHex(user.passwordSalt, `${usernameKey}\n${password}`);
    if (!timingSafeEqual(passwordHash, user.passwordHash)) throw new Error('联机账号或密码错误。');
    return user;
};

const requireOwner = (entry: WorkshopEntry, user: CloudPlayUser): void => {
    if (!entry.ownerUserId) throw new Error('旧版匿名投稿暂不支持在线编辑或删除。');
    if (entry.ownerUserId !== user.userId) throw new Error('只能编辑或删除自己的投稿。');
};

const putHi168Object = async (env: any, key: string, body: Uint8Array | string, contentType: string): Promise<string> => {
    const endpoint = readString(env?.MORAN_OSS_ENDPOINT) || 'https://s3.hi168.com';
    const bucket = readString(env?.MORAN_OSS_BUCKET);
    const accessKey = readString(env?.MORAN_OSS_ACCESS_KEY);
    const secretKey = readString(env?.MORAN_OSS_SECRET_KEY);
    if (!bucket || !accessKey || !secretKey) return '';

    const target = new URL(`${endpoint.replace(/\/+$/, '')}/${encodeURIComponent(bucket)}/${encodeS3Path(key)}`);
    const bodyBytes = typeof body === 'string' ? encoder.encode(body) : body;
    const bodyHash = await sha256HexBytes(bodyBytes);
    const { amzDate, dateStamp } = formatAmzDate(new Date());
    const region = readString(env?.MORAN_OSS_REGION) || 'auto';
    const service = 's3';
    const canonicalHeaders = [
        `content-type:${contentType}\n`,
        `host:${target.host}\n`,
        `x-amz-content-sha256:${bodyHash}\n`,
        `x-amz-date:${amzDate}\n`
    ].join('');
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = ['PUT', target.pathname, '', canonicalHeaders, signedHeaders, bodyHash].join('\n');
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256HexText(canonicalRequest)].join('\n');
    const signingKey = await deriveSigningKey(secretKey, dateStamp, region, service);
    const signature = bytesToHex(await hmac(signingKey, stringToSign));

    const response = await fetch(target, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'x-amz-content-sha256': bodyHash,
            'x-amz-date': amzDate,
            Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
        },
        body: bodyBytes
    });
    if (!response.ok) throw new Error(`hi168 上传失败：${response.status} ${await response.text().catch(() => '')}`);
    return buildHi168PublicUrl(env, key);
};

const buildId = (): string => {
    const random = crypto.getRandomValues(new Uint8Array(5));
    const suffix = Array.from(random).map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
    const stamp = new Date(Date.now() + CHINA_TIMEZONE_OFFSET_MS).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return `NDW-${stamp}-${suffix}`;
};

const buildKeys = (env: any, id: string, createdAt: string, fileName: string) => {
    const prefix = getPrefix(env);
    const [year, month, day] = getChinaDateKey(new Date(createdAt)).split('-');
    const base = `${prefix}/packages/${year}/${month}/${day}/${id}`;
    return {
        zipKey: `${base}/${fileName}`,
        docKey: `${prefix}/entries/${id}.json`,
        indexKey: `${prefix}/index/latest.json`
    };
};

const readIndex = async (env: any): Promise<WorkshopEntry[]> => {
    const bucket = getBucket(env);
    if (!bucket) return [];
    const object = await bucket.get(`${getPrefix(env)}/index/latest.json`);
    if (!object) return [];
    const parsed = await object.json<{ entries?: WorkshopEntry[] }>().catch(() => null);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
};

const writeIndex = async (env: any, entries: WorkshopEntry[]): Promise<void> => {
    const bucket = getBucket(env);
    if (!bucket) return;
    const payload = JSON.stringify({ schema: 'moranjianghu-novel-decomposition-workshop', version: 1, updatedAt: new Date().toISOString(), entries }, null, 2);
    await bucket.put(`${getPrefix(env)}/index/latest.json`, payload, {
        httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'no-store,no-cache,max-age=0,must-revalidate' }
    });
    await putHi168Object(env, `${getPrefix(env)}/index/latest.json`, payload, 'application/json; charset=utf-8').catch(() => '');
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        const url = new URL(request.url);
        const action = readString(url.searchParams.get('action'));
        if (action === 'download') {
            const id = readString(url.searchParams.get('id'));
            const entries = await readIndex(env);
            const entry = entries.find((item) => item.id === id);
            if (!entry) return jsonResponse({ error: '未找到该创意工坊模块' }, 404);
            const bucket = getBucket(env);
            const object = bucket ? await bucket.get(entry.r2Key) : null;
            if (!object) return jsonResponse({ error: '模块 ZIP 暂不可下载' }, 404);
            return new Response(object.body, {
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="${entry.fileName.replace(/"/g, '')}"`,
                    'Cache-Control': 'public, max-age=300',
                    ...CORS_HEADERS
                }
            });
        }
        return jsonResponse({ ok: true, entries: await readIndex(env) });
    } catch (error: any) {
        return jsonResponse({ error: error?.message || '读取创意工坊失败' }, 500);
    }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
    try {
        const bucket = getBucket(env);
        if (!bucket) return jsonResponse({ error: '创意工坊存储未配置' }, 500);
        const body = await request.json();
        const action = readString(body?.action) || 'create';
        const existingEntries = await readIndex(env);

        if (action === 'update' || action === 'delete') {
            const user = await authenticateWorkshopUser(env, body?.auth);
            const id = readString(body?.id);
            const target = existingEntries.find((item) => item.id === id);
            if (!target) return jsonResponse({ ok: false, error: '未找到该小说分解模块。' }, 404);
            requireOwner(target, user);
            if (action === 'delete') {
                await writeIndex(env, existingEntries.filter((item) => item.id !== id));
                return jsonResponse({ ok: true, deleted: true });
            }
            const patch = body?.patch && typeof body.patch === 'object' ? body.patch : {};
            const anonymous = body?.anonymous === true;
            const updated: WorkshopEntry = {
                ...target,
                title: normalizeWorkTitle(patch.title) || target.title,
                workName: normalizeWorkTitle(patch.workName) || normalizeWorkTitle(patch.title) || target.workName,
                contributor: anonymous ? '匿名玩家' : (sanitizeText(patch.contributor, 40) || user.username),
                note: sanitizeText(patch.note, 500),
                tags: Array.isArray(patch.tags) ? patch.tags.map((item: unknown) => sanitizeText(item, 20)).filter(Boolean).slice(0, 12) : target.tags,
                anonymous,
                updatedAt: new Date().toISOString()
            };
            const keys = buildKeys(env, updated.id, updated.createdAt, updated.fileName);
            await bucket.put(keys.docKey, JSON.stringify(updated, null, 2), {
                httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'no-store' }
            });
            await putHi168Object(env, keys.docKey, JSON.stringify(updated, null, 2), 'application/json; charset=utf-8').catch(() => '');
            const nextEntries = [updated, ...existingEntries.filter((item) => item.id !== updated.id)].slice(0, 200);
            await writeIndex(env, nextEntries);
            return jsonResponse({ ok: true, entry: updated });
        }

        const zipBytes = decodeBase64(body?.zipBase64);
        const owner = await authenticateWorkshopUser(env, body?.auth);
        const id = buildId();
        const createdAt = new Date().toISOString();
        const title = normalizeWorkTitle(body?.title) || normalizeWorkTitle(body?.workName) || '未命名小说分解模块';
        const workName = normalizeWorkTitle(body?.workName) || title;
        const fileName = sanitizeFilename(body?.fileName, `${workName}_${id}`);
        const keys = buildKeys(env, id, createdAt, fileName);
        const sha256 = await sha256HexBytes(zipBytes);
        const entry: WorkshopEntry = {
            id,
            title,
            workName,
            contributor: sanitizeText(body?.contributor, 40),
            note: sanitizeText(body?.note, 500),
            createdAt,
            updatedAt: createdAt,
            fileName,
            size: zipBytes.byteLength,
            sha256,
            chapterCount: Math.max(0, Math.floor(Number(body?.chapterCount) || 0)),
            segmentCount: Math.max(0, Math.floor(Number(body?.segmentCount) || 0)),
            sourceType: sanitizeText(body?.sourceType, 30),
            tags: Array.isArray(body?.tags) ? body.tags.map((item: unknown) => sanitizeText(item, 20)).filter(Boolean).slice(0, 12) : [],
            r2Key: keys.zipKey,
            hi168Key: keys.zipKey,
            ownerUserId: owner?.userId,
            ownerUsername: owner?.username,
            anonymous: body?.anonymous === true
        };
        entry.contributor = entry.anonymous ? '匿名玩家' : (sanitizeText(body?.contributor, 40) || owner?.username || '');

        await bucket.put(keys.zipKey, zipBytes, {
            httpMetadata: { contentType: 'application/zip', cacheControl: 'public, max-age=31536000, immutable' },
            customMetadata: { sha256, workshopId: id }
        });
        entry.hi168Url = await putHi168Object(env, keys.zipKey, zipBytes, 'application/zip').catch(() => '');

        await bucket.put(keys.docKey, JSON.stringify(entry, null, 2), {
            httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'no-store' }
        });
        await putHi168Object(env, keys.docKey, JSON.stringify(entry, null, 2), 'application/json; charset=utf-8').catch(() => '');

        const nextEntries = [entry, ...existingEntries.filter((item) => item.id !== id)].slice(0, 200);
        await writeIndex(env, nextEntries);

        return jsonResponse({
            ok: true,
            entry,
            downloadUrl: `/api/workshop/novel-decomposition?action=download&id=${encodeURIComponent(id)}`
        });
    } catch (error: any) {
        return jsonResponse({ error: error?.message || '发布创意工坊失败' }, 500);
    }
}
