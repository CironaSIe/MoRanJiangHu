import { tryDbBucket } from '../_shared/dbStore';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const WORKSHOP_PREFIX = 'moranjianghu/workshop/modules';
const MAX_MODULE_BYTES = 2 * 1024 * 1024;
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const encoder = new TextEncoder();

type WorkshopModuleEntry = {
    id: string;
    type: 'topic' | 'world_rules' | 'opening' | 'ability' | 'comfy_workflow';
    formatVersion?: number;
    workshopKind?: 'standard_module';
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    payload: Record<string, unknown>;
    contentBlocks?: Array<{
        id: string;
        title: string;
        purpose: string;
        content: string;
        injectionTarget?: 'manualWorldPrompt' | 'manualRealmPrompt' | 'openingExtraRequirement' | 'imageWorkflow' | 'referenceOnly';
    }>;
    usagePrompt?: string;
    safetyNotes?: string[];
    injectionPreview: string[];
    preset?: unknown;
    contributor: string;
    createdAt: string;
    updatedAt: string;
    sha256: string;
    r2Key: string;
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
        headers: { ...JSON_HEADERS, ...CORS_HEADERS, 'Cache-Control': 'no-store' }
    })
);

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const getBucket = (env: any): any => {
    const dbBucket = tryDbBucket(env, 'workshop_data');
    if (dbBucket) return dbBucket;
    const candidate = env?.WORKSHOP_R2 || env?.CNB_SYNC_R2;
    if (!candidate || typeof candidate.get !== 'function' || typeof candidate.put !== 'function') return null;
    return candidate;
};

const getPrefix = (env: any): string => (
    readString(env?.WORKSHOP_MODULES_PREFIX) || WORKSHOP_PREFIX
).replace(/^\/+|\/+$/g, '') || WORKSHOP_PREFIX;

const bytesToHex = (bytes: ArrayBuffer): string => (
    Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, '0')).join('')
);

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

const sortValue = (value: unknown): unknown => {
    if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(sortValue);
    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
            const sorted = sortValue((value as Record<string, unknown>)[key]);
            if (sorted !== undefined) acc[key] = sorted;
            return acc;
        }, {});
    }
    return null;
};

const normalizeFingerprintText = (value: unknown): string => String(value ?? '').trim().replace(/\s+/g, ' ');

const normalizeFingerprintList = (value: unknown): string[] => (
    Array.isArray(value) ? value.map(normalizeFingerprintText).filter(Boolean) : []
);

const buildContentFingerprint = (entry: Pick<WorkshopModuleEntry, 'type' | 'title' | 'subtitle' | 'description' | 'tags' | 'payload' | 'injectionPreview' | 'preset' | 'contentBlocks' | 'usagePrompt' | 'safetyNotes'>): string => (
    JSON.stringify(sortValue({
        type: entry.type,
        title: normalizeFingerprintText(entry.title),
        subtitle: normalizeFingerprintText(entry.subtitle),
        description: normalizeFingerprintText(entry.description),
        tags: normalizeFingerprintList(entry.tags),
        payload: entry.payload || {},
        contentBlocks: entry.contentBlocks || [],
        usagePrompt: normalizeFingerprintText(entry.usagePrompt),
        safetyNotes: normalizeFingerprintList(entry.safetyNotes),
        injectionPreview: normalizeFingerprintList(entry.injectionPreview),
        preset: entry.preset || null
    }))
);

const sanitizeText = (value: unknown, maxLength: number): string => readString(value).replace(/\s+/g, ' ').slice(0, maxLength);

const sanitizeTags = (value: unknown): string[] => (
    Array.isArray(value) ? value.map((item) => sanitizeText(item, 20)).filter(Boolean).slice(0, 12) : []
);

const sanitizeContentBlocks = (value: unknown): WorkshopModuleEntry['contentBlocks'] => (
    Array.isArray(value)
        ? value.map((block: any) => {
            const injectionTarget = block?.injectionTarget;
            return {
                id: sanitizeText(block?.id, 60),
                title: sanitizeText(block?.title, 80),
                purpose: sanitizeText(block?.purpose, 200),
                content: readString(block?.content).slice(0, 20000),
                injectionTarget: injectionTarget === 'manualWorldPrompt' || injectionTarget === 'manualRealmPrompt' || injectionTarget === 'openingExtraRequirement' || injectionTarget === 'imageWorkflow' || injectionTarget === 'referenceOnly'
                    ? injectionTarget
                    : undefined
            };
        }).filter((block) => block.id && block.title && block.content).slice(0, 24)
        : undefined
);

const normalizeType = (value: unknown): WorkshopModuleEntry['type'] | '' => (
    value === 'topic' || value === 'world_rules' || value === 'opening' || value === 'ability' || value === 'comfy_workflow' ? value : ''
);

const buildId = (type: string): string => {
    const random = crypto.getRandomValues(new Uint8Array(5));
    const suffix = Array.from(random).map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
    const stamp = new Date(Date.now() + CHINA_TIMEZONE_OFFSET_MS).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return `CWM-${type.toUpperCase()}-${stamp}-${suffix}`;
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
    if (!bucket) throw new Error('创意工坊存储未配置');
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

const requireOwner = (entry: WorkshopModuleEntry, user: CloudPlayUser): void => {
    if (!entry.ownerUserId) throw new Error('旧版匿名投稿暂不支持在线编辑或删除。');
    if (entry.ownerUserId !== user.userId) throw new Error('只能编辑或删除自己的投稿。');
};

const buildKeys = (env: any, id: string) => {
    const prefix = getPrefix(env);
    return {
        moduleKey: `${prefix}/entries/${id}.json`,
        indexKey: `${prefix}/index/latest.json`
    };
};

const readIndex = async (env: any): Promise<WorkshopModuleEntry[]> => {
    const bucket = getBucket(env);
    if (!bucket) return [];
    const object = await bucket.get(`${getPrefix(env)}/index/latest.json`);
    if (!object) return [];
    const parsed = await object.json<{ entries?: WorkshopModuleEntry[] }>().catch(() => null);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
};

const writeIndex = async (env: any, entries: WorkshopModuleEntry[]): Promise<void> => {
    const bucket = getBucket(env);
    if (!bucket) return;
    const payload = JSON.stringify({ schema: 'moranjianghu-creative-workshop-modules', version: 1, updatedAt: new Date().toISOString(), entries }, null, 2);
    await bucket.put(`${getPrefix(env)}/index/latest.json`, payload, {
        httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'no-store,no-cache,max-age=0,must-revalidate' }
    });
};

const normalizeModule = async (raw: any, contributorInput = '', owner?: CloudPlayUser, anonymous = false): Promise<WorkshopModuleEntry> => {
    const module = raw?.module && typeof raw.module === 'object' ? raw.module : raw;
    const type = normalizeType(module?.type);
    if (!type) throw new Error('模块类型不支持');
    const title = sanitizeText(module?.title, 80);
    if (!title) throw new Error('模块标题不能为空');
    const createdAt = new Date().toISOString();
    const id = buildId(type);
    const payload = module?.payload && typeof module.payload === 'object' && !Array.isArray(module.payload) ? module.payload : {};
    if (type !== 'comfy_workflow' && !readString((payload as any).suiteId)) {
        throw new Error('题材模板、世界规则和能力体系必须作为同一个完整模式包贡献，请在创意工坊表单中一次填写三段内容。');
    }
    const entry: Omit<WorkshopModuleEntry, 'sha256' | 'r2Key'> = {
        id,
        type,
        title,
        subtitle: sanitizeText(module?.subtitle, 100),
        description: sanitizeText(module?.description, 500),
        tags: sanitizeTags(module?.tags),
        payload,
        formatVersion: Number(module?.formatVersion) === 2 ? 2 : undefined,
        workshopKind: module?.workshopKind === 'standard_module' ? 'standard_module' : undefined,
        contentBlocks: sanitizeContentBlocks(module?.contentBlocks),
        usagePrompt: sanitizeText(module?.usagePrompt, 500),
        safetyNotes: Array.isArray(module?.safetyNotes) ? module.safetyNotes.map((item: unknown) => sanitizeText(item, 200)).filter(Boolean).slice(0, 12) : [],
        injectionPreview: Array.isArray(module?.injectionPreview) ? module.injectionPreview.map((item: unknown) => sanitizeText(item, 400)).filter(Boolean).slice(0, 12) : [],
        preset: module?.preset && typeof module.preset === 'object' ? module.preset : undefined,
        contributor: anonymous ? '匿名玩家' : (sanitizeText(contributorInput || module?.contributor, 40) || owner?.username || '匿名玩家'),
        createdAt,
        updatedAt: createdAt,
        ownerUserId: owner?.userId,
        ownerUsername: owner?.username,
        anonymous
    };
    const json = JSON.stringify(entry);
    if (encoder.encode(json).byteLength > MAX_MODULE_BYTES) throw new Error('模块 JSON 过大，请控制在 2MB 内');
    const keys = buildKeys({}, id);
    return { ...entry, sha256: await sha256HexText(json), r2Key: keys.moduleKey };
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        const url = new URL(request.url);
        const action = readString(url.searchParams.get('action'));
        const entries = await readIndex(env);
        if (action === 'download') {
            const id = readString(url.searchParams.get('id'));
            const entry = entries.find((item) => item.id === id);
            if (!entry) return jsonResponse({ error: '未找到该创意工坊模块' }, 404);
            return jsonResponse({ ok: true, module: entry });
        }
        return jsonResponse({ ok: true, entries });
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
            if (!target) return jsonResponse({ ok: false, error: '未找到该创意工坊模块' }, 404);
            requireOwner(target, user);
            if (action === 'delete') {
                const nextEntries = existingEntries.filter((item) => item.id !== id);
                await writeIndex(env, nextEntries);
                return jsonResponse({ ok: true, deleted: true });
            }
            const patch = body?.patch && typeof body.patch === 'object' ? body.patch : {};
            const anonymous = body?.anonymous === true;
            const updated: WorkshopModuleEntry = {
                ...target,
                title: sanitizeText(patch.title, 80) || target.title,
                subtitle: sanitizeText(patch.subtitle, 100) || target.subtitle,
                description: sanitizeText(patch.description, 500) || target.description,
                tags: Array.isArray(patch.tags) ? sanitizeTags(patch.tags) : target.tags,
                contributor: anonymous ? '匿名玩家' : (sanitizeText(patch.contributor, 40) || user.username),
                anonymous,
                updatedAt: new Date().toISOString()
            };
            await bucket.put(updated.r2Key, JSON.stringify(updated, null, 2), {
                httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'public, max-age=300' },
                customMetadata: { sha256: updated.sha256, workshopId: updated.id }
            });
            const nextEntries = [updated, ...existingEntries.filter((item) => item.id !== updated.id)].slice(0, 500);
            await writeIndex(env, nextEntries);
            return jsonResponse({ ok: true, entry: updated });
        }

        const owner = await authenticateWorkshopUser(env, body?.auth);
        const entry = await normalizeModule(body, body?.contributor, owner, body?.anonymous === true);
        const keys = buildKeys(env, entry.id);
        const finalEntry = { ...entry, r2Key: keys.moduleKey };
        const fingerprint = buildContentFingerprint(finalEntry);
        const officialFingerprints = Array.isArray(body?.officialFingerprints) ? body.officialFingerprints.filter((item: unknown) => typeof item === 'string') : [];
        if (officialFingerprints.includes(fingerprint)) {
            return jsonResponse({ ok: false, error: '该模块与官方预设完全一致，无需重复贡献社区。' }, 409);
        }
        if (existingEntries.some((item) => buildContentFingerprint(item) === fingerprint)) {
            return jsonResponse({ ok: false, error: '社区工坊已存在内容完全相同的模块。' }, 409);
        }
        await bucket.put(keys.moduleKey, JSON.stringify(finalEntry, null, 2), {
            httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'public, max-age=300' },
            customMetadata: { sha256: finalEntry.sha256, workshopId: finalEntry.id }
        });
        const nextEntries = [finalEntry, ...existingEntries.filter((item) => item.id !== finalEntry.id)].slice(0, 500);
        await writeIndex(env, nextEntries);
        return jsonResponse({
            ok: true,
            entry: finalEntry,
            downloadUrl: `/api/workshop/modules?action=download&id=${encodeURIComponent(finalEntry.id)}`
        });
    } catch (error: any) {
        return jsonResponse({ error: error?.message || '发布创意工坊失败' }, 500);
    }
}
