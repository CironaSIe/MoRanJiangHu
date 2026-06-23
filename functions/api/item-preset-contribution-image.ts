import { tryDbBucket } from './_shared/dbStore';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

type ContributionDocument = {
    id: string;
    imageKey: string;
    imageContentType: string;
};

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const getBucket = (env: any): any => {
    const dbBucket = tryDbBucket(env, 'preset_contributions');
    if (dbBucket) return dbBucket;
    const candidate = env?.ITEM_PRESET_CONTRIBUTIONS_R2 || env?.CNB_SYNC_R2;
    if (!candidate || typeof candidate.get !== 'function') return null;
    return candidate;
};

const getPrefix = (env: any): string => {
    const raw = readString(env?.ITEM_PRESET_CONTRIBUTIONS_PREFIX) || 'moranjianghu/item-preset-contributions';
    return raw.replace(/^\/+|\/+$/g, '') || 'moranjianghu/item-preset-contributions';
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

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS
        }
    })
);

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        if (!isAuthorizedAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const bucket = getBucket(env);
        if (!bucket) return jsonResponse({ error: 'Contribution storage is not configured' }, 500);
        const url = new URL(request.url);
        const id = readString(url.searchParams.get('id'));
        if (!id) return jsonResponse({ error: 'Missing contribution id' }, 400);
        const indexObject = await bucket.get(`${getPrefix(env)}/index/${id}.json`);
        if (!indexObject) return jsonResponse({ error: 'Contribution not found' }, 404);
        const index = await indexObject.json<{ key?: string }>().catch(() => null);
        const docKey = readString(index?.key);
        const docObject = docKey ? await bucket.get(docKey) : null;
        const doc = docObject ? await docObject.json<ContributionDocument>().catch(() => null) : null;
        if (!doc?.imageKey) return jsonResponse({ error: 'Contribution image not found' }, 404);
        const imageObject = await bucket.get(doc.imageKey);
        if (!imageObject) return jsonResponse({ error: 'Contribution image not found' }, 404);
        return new Response(imageObject.body, {
            status: 200,
            headers: {
                'Content-Type': doc.imageContentType || 'image/png',
                'Cache-Control': 'private, max-age=60',
                ...CORS_HEADERS
            }
        });
    } catch (error: any) {
        return jsonResponse({ error: error?.message || 'Read contribution image failed' }, 500);
    }
}
