const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * 1.38);
const DAILY_LIMIT = 100;
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const ITEM_TYPES = new Set(['武器', '防具', '鞋履', '饰品', '秘籍', '丹药', '材料', '杂物', '法宝', '符箓', '阵盘']);
const ITEM_QUALITIES = new Set(['普通', '精良', '稀有', '史诗', '传说', '绝世', '神话']);

type ContributionStatus = 'pending' | 'approved' | 'rejected' | 'uploaded' | 'deleted';

type ContributionDocument = {
    id: string;
    createdAt: string;
    updatedAt: string;
    status: ContributionStatus;
    itemName: string;
    itemType: string;
    quality: string;
    contributor?: string;
    contact?: string;
    note?: string;
    imageKey: string;
    imageContentType: string;
    imageSize: number;
    imageSha256: string;
    client?: Record<string, string>;
    review?: {
        reviewedAt: string;
        reviewer?: string;
        action: ContributionStatus;
        note?: string;
        imageHostUrl?: string;
    };
};

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...CORS_HEADERS
        }
    })
);

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const getBucket = (env: any): R2Bucket | null => {
    const candidate = env?.ITEM_PRESET_CONTRIBUTIONS_R2 || env?.CNB_SYNC_R2;
    if (!candidate || typeof candidate.get !== 'function' || typeof candidate.put !== 'function') return null;
    return candidate as R2Bucket;
};

const getPrefix = (env: any): string => {
    const raw = readString(env?.ITEM_PRESET_CONTRIBUTIONS_PREFIX) || 'moranjianghu/item-preset-contributions';
    return raw.replace(/^\/+|\/+$/g, '') || 'moranjianghu/item-preset-contributions';
};

const getChinaDateKey = (date = new Date()): string => (
    new Date(date.getTime() + CHINA_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
);

const getClientIp = (request: Request): string => {
    const direct = readString(request.headers.get('CF-Connecting-IP'));
    if (direct) return direct;
    const forwarded = readString(request.headers.get('X-Forwarded-For'));
    if (forwarded) return forwarded.split(',')[0]?.trim() || '';
    return readString(request.headers.get('X-Real-IP')) || 'unknown';
};

const sha256HexBytes = async (bytes: Uint8Array): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const sha256HexText = async (value: string): Promise<string> => sha256HexBytes(new TextEncoder().encode(value));

const buildReporterKey = async (request: Request, body: any): Promise<string> => {
    const deviceId = readString(body?.deviceId);
    if (deviceId) return `device-${await sha256HexText(deviceId)}`;
    return `fallback-${await sha256HexText(`${getClientIp(request)}\n${readString(request.headers.get('User-Agent'))}`)}`;
};

const buildContributionId = (): string => {
    const random = crypto.getRandomValues(new Uint8Array(5));
    const suffix = Array.from(random).map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
    const stamp = new Date(Date.now() + CHINA_TIMEZONE_OFFSET_MS).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return `IPIC-${stamp}-${suffix}`;
};

const sanitizeName = (value: unknown): string => {
    const text = readString(value).replace(/\s+/g, ' ');
    if (text.length < 1 || text.length > 40) throw new Error('物品名称需为 1-40 个字符。');
    return text;
};

const sanitizeOptional = (value: unknown, maxLength: number): string => readString(value).slice(0, maxLength);

const readRequestJson = async (request: Request): Promise<any> => {
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) throw new Error('图片过大，请压缩到 8MB 以内。');
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new Error('图片过大，请压缩到 8MB 以内。');
    return JSON.parse(text);
};

const decodeDataUrl = (value: unknown): { bytes: Uint8Array; contentType: string } => {
    const text = readString(value);
    const match = text.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=\s]+)$/i);
    if (!match) throw new Error('请上传 PNG、JPG 或 WebP 图片。');
    const contentType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const binary = atob(match[2].replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    if (bytes.byteLength <= 0 || bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('图片大小需在 8MB 以内。');
    return { bytes, contentType };
};

const extensionFor = (contentType: string): string => {
    if (contentType === 'image/jpeg') return 'jpg';
    if (contentType === 'image/webp') return 'webp';
    return 'png';
};

const buildKeys = (env: any, id: string, createdAt: string, imageContentType?: string) => {
    const prefix = getPrefix(env);
    const [year, month, day] = getChinaDateKey(new Date(createdAt)).split('-');
    const base = `${prefix}/${year}/${month}/${day}/${id}`;
    return {
        docKey: `${base}.json`,
        imageKey: `${base}.${extensionFor(imageContentType || 'image/png')}`,
        indexKey: `${prefix}/index/${id}.json`
    };
};

const buildRateKey = (env: any, date: string, reporterKey: string): string => `${getPrefix(env)}/rate/${date}/${reporterKey}.json`;

const enforceDailyLimit = async (request: Request, env: any, body: any): Promise<{ remaining: number }> => {
    const bucket = getBucket(env);
    if (!bucket) return { remaining: DAILY_LIMIT - 1 };
    const today = getChinaDateKey();
    const reporterKey = await buildReporterKey(request, body);
    const key = buildRateKey(env, today, reporterKey);
    const existing = await bucket.get(key);
    const parsed = existing ? await existing.json<{ count?: number }>().catch(() => null) : null;
    const count = Math.max(0, Math.floor(Number(parsed?.count) || 0));
    if (count >= DAILY_LIMIT) throw new Error(`今天贡献次数已达上限（${DAILY_LIMIT} 张），请明天再试。`);
    const nextCount = count + 1;
    await bucket.put(key, JSON.stringify({ date: today, count: nextCount, updatedAt: new Date().toISOString() }), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });
    return { remaining: DAILY_LIMIT - nextCount };
};

const readBearerToken = (request: Request): string => {
    const match = readString(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || '';
};

const isAuthorizedAdmin = (request: Request, env: any): boolean => {
    const token = readString(env?.ITEM_PRESET_CONTRIBUTION_ADMIN_TOKEN) || readString(env?.DIAGNOSTIC_REPORT_READ_TOKEN);
    if (!token) return true;
    return readBearerToken(request) === token;
};

const findContribution = async (env: any, id: string): Promise<{ doc: ContributionDocument; docKey: string; indexKey: string } | null> => {
    const bucket = getBucket(env);
    if (!bucket) return null;
    const indexKey = `${getPrefix(env)}/index/${id}.json`;
    const indexObject = await bucket.get(indexKey);
    if (!indexObject) return null;
    const index = await indexObject.json<{ key?: string }>().catch(() => null);
    const docKey = readString(index?.key);
    if (!docKey) return null;
    const docObject = await bucket.get(docKey);
    if (!docObject) return null;
    const doc = await docObject.json<ContributionDocument>().catch(() => null);
    return doc ? { doc, docKey, indexKey } : null;
};

const listContributions = async (env: any, limit: number, status?: string): Promise<ContributionDocument[]> => {
    const bucket = getBucket(env);
    if (!bucket) return [];
    const page = await bucket.list({ prefix: `${getPrefix(env)}/index/`, limit: Math.min(100, Math.max(1, limit * 2)) });
    const rows = await Promise.all(page.objects.map(async (object) => {
        const indexObject = await bucket.get(object.key);
        return indexObject ? indexObject.json<{ id?: string; createdAt?: string }>().catch(() => null) : null;
    }));
    const ids = rows
        .filter((row): row is { id: string; createdAt?: string } => Boolean(row?.id))
        .sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
        .map(row => row.id);
    const docs = (await Promise.all(ids.map(id => findContribution(env, id)))).map(item => item?.doc).filter(Boolean) as ContributionDocument[];
    return docs.filter(item => !status || item.status === status).slice(0, limit);
};

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        if (!isAuthorizedAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const url = new URL(request.url);
        const id = readString(url.searchParams.get('id'));
        if (id) {
            const found = await findContribution(env, id);
            if (!found) return jsonResponse({ error: 'Contribution not found' }, 404);
            return jsonResponse({ ok: true, contribution: found.doc });
        }
        const status = readString(url.searchParams.get('status'));
        return jsonResponse({
            ok: true,
            contributions: await listContributions(env, Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30)), status)
        });
    } catch (error: any) {
        return jsonResponse({ error: error?.message || 'List contributions failed' }, 500);
    }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
    try {
        const bucket = getBucket(env);
        if (!bucket) return jsonResponse({ error: 'Contribution storage is not configured' }, 500);
        const url = new URL(request.url);
        const action = readString(url.searchParams.get('action'));
        const body = await readRequestJson(request);

        if (action === 'review' || action === 'delete') {
            if (!isAuthorizedAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
            const id = readString(body?.id);
            const found = await findContribution(env, id);
            if (!found) return jsonResponse({ error: 'Contribution not found' }, 404);
            const nextStatus = action === 'delete' ? 'deleted' : readString(body?.status) as ContributionStatus;
            if (!['approved', 'rejected', 'uploaded', 'deleted'].includes(nextStatus)) throw new Error('Unsupported review status');
            const updated: ContributionDocument = {
                ...found.doc,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
                review: {
                    reviewedAt: new Date().toISOString(),
                    reviewer: sanitizeOptional(body?.reviewer, 80),
                    action: nextStatus,
                    note: sanitizeOptional(body?.note, 500),
                    imageHostUrl: sanitizeOptional(body?.imageHostUrl, 500)
                }
            };
            await bucket.put(found.docKey, JSON.stringify(updated, null, 2), { httpMetadata: { contentType: 'application/json; charset=utf-8' } });
            if (action === 'delete') {
                await bucket.delete(found.doc.imageKey).catch(() => undefined);
            }
            return jsonResponse({ ok: true, id, status: updated.status });
        }

        const itemName = sanitizeName(body?.itemName);
        const itemType = readString(body?.itemType);
        const quality = readString(body?.quality);
        if (!ITEM_TYPES.has(itemType)) throw new Error('请选择有效的物品类型。');
        if (!ITEM_QUALITIES.has(quality)) throw new Error('请选择有效的品质。');
        const { bytes, contentType } = decodeDataUrl(body?.imageDataUrl);
        const rate = await enforceDailyLimit(request, env, body);
        const createdAt = new Date().toISOString();
        const id = buildContributionId();
        const keys = buildKeys(env, id, createdAt, contentType);
        const imageSha256 = await sha256HexBytes(bytes);
        const doc: ContributionDocument = {
            id,
            createdAt,
            updatedAt: createdAt,
            status: 'pending',
            itemName,
            itemType,
            quality,
            contributor: sanitizeOptional(body?.contributor, 80),
            contact: sanitizeOptional(body?.contact, 120),
            note: sanitizeOptional(body?.note, 600),
            imageKey: keys.imageKey,
            imageContentType: contentType,
            imageSize: bytes.byteLength,
            imageSha256,
            client: {
                ipHash: await sha256HexText(getClientIp(request)),
                userAgent: sanitizeOptional(request.headers.get('User-Agent'), 240),
                language: sanitizeOptional(body?.language, 60)
            }
        };
        await bucket.put(keys.imageKey, bytes, {
            httpMetadata: {
                contentType,
                cacheControl: 'private, max-age=0, no-store'
            },
            customMetadata: {
                contributionId: id,
                itemName,
                itemType,
                quality,
                sha256: imageSha256
            }
        });
        await bucket.put(keys.docKey, JSON.stringify(doc, null, 2), { httpMetadata: { contentType: 'application/json; charset=utf-8' } });
        await bucket.put(keys.indexKey, JSON.stringify({ id, key: keys.docKey, createdAt, status: doc.status }), {
            httpMetadata: { contentType: 'application/json; charset=utf-8' }
        });
        return jsonResponse({ ok: true, id, status: doc.status, remainingToday: rate.remaining });
    } catch (error: any) {
        return jsonResponse({ error: error?.message || 'Submit contribution failed' }, 400);
    }
}
