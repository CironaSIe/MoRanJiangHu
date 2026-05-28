const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const WORKSHOP_PREFIX = 'moranjianghu/workshop/modules';
const MAX_MODULE_BYTES = 512 * 1024;
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const encoder = new TextEncoder();

type WorkshopModuleEntry = {
    id: string;
    type: 'topic' | 'world_rules' | 'opening' | 'ability';
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    payload: Record<string, unknown>;
    injectionPreview: string[];
    preset?: unknown;
    contributor: string;
    createdAt: string;
    updatedAt: string;
    sha256: string;
    r2Key: string;
};

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: { ...JSON_HEADERS, ...CORS_HEADERS, 'Cache-Control': 'no-store' }
    })
);

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const getBucket = (env: any): R2Bucket | null => {
    const candidate = env?.WORKSHOP_R2 || env?.CNB_SYNC_R2;
    if (!candidate || typeof candidate.get !== 'function' || typeof candidate.put !== 'function') return null;
    return candidate as R2Bucket;
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

const sanitizeText = (value: unknown, maxLength: number): string => readString(value).replace(/\s+/g, ' ').slice(0, maxLength);

const sanitizeTags = (value: unknown): string[] => (
    Array.isArray(value) ? value.map((item) => sanitizeText(item, 20)).filter(Boolean).slice(0, 12) : []
);

const normalizeType = (value: unknown): WorkshopModuleEntry['type'] | '' => (
    value === 'topic' || value === 'world_rules' || value === 'opening' || value === 'ability' ? value : ''
);

const buildId = (type: string): string => {
    const random = crypto.getRandomValues(new Uint8Array(5));
    const suffix = Array.from(random).map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
    const stamp = new Date(Date.now() + CHINA_TIMEZONE_OFFSET_MS).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return `CWM-${type.toUpperCase()}-${stamp}-${suffix}`;
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

const normalizeModule = async (raw: any, contributorInput = ''): Promise<WorkshopModuleEntry> => {
    const module = raw?.module && typeof raw.module === 'object' ? raw.module : raw;
    const type = normalizeType(module?.type);
    if (!type) throw new Error('模块类型不支持');
    const title = sanitizeText(module?.title, 80);
    if (!title) throw new Error('模块标题不能为空');
    const createdAt = new Date().toISOString();
    const id = buildId(type);
    const payload = module?.payload && typeof module.payload === 'object' && !Array.isArray(module.payload) ? module.payload : {};
    const entry: Omit<WorkshopModuleEntry, 'sha256' | 'r2Key'> = {
        id,
        type,
        title,
        subtitle: sanitizeText(module?.subtitle, 100),
        description: sanitizeText(module?.description, 500),
        tags: sanitizeTags(module?.tags),
        payload,
        injectionPreview: Array.isArray(module?.injectionPreview) ? module.injectionPreview.map((item: unknown) => sanitizeText(item, 400)).filter(Boolean).slice(0, 12) : [],
        preset: module?.preset && typeof module.preset === 'object' ? module.preset : undefined,
        contributor: sanitizeText(contributorInput || module?.contributor, 40) || '匿名玩家',
        createdAt,
        updatedAt: createdAt
    };
    const json = JSON.stringify(entry);
    if (encoder.encode(json).byteLength > MAX_MODULE_BYTES) throw new Error('模块 JSON 过大，请控制在 512KB 内');
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
        const entry = await normalizeModule(body, body?.contributor);
        const keys = buildKeys(env, entry.id);
        const finalEntry = { ...entry, r2Key: keys.moduleKey };
        await bucket.put(keys.moduleKey, JSON.stringify(finalEntry, null, 2), {
            httpMetadata: { contentType: 'application/json; charset=utf-8', cacheControl: 'public, max-age=300' },
            customMetadata: { sha256: finalEntry.sha256, workshopId: finalEntry.id }
        });
        const nextEntries = [finalEntry, ...(await readIndex(env)).filter((item) => item.id !== finalEntry.id)].slice(0, 500);
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
