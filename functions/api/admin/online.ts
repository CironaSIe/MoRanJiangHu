const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

type OnlineSessionRecord = {
    id: string;
    firstSeenAt: string;
    lastSeenAt: string;
    ip: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    colo?: string;
    userAgent?: string;
    path?: string;
    referrer?: string;
    versionName?: string;
    versionCode?: number;
    platform?: string;
    imageStats?: OnlineImageStats;
    heartbeatCount: number;
};

type OnlineRegistry = {
    sessions: OnlineSessionRecord[];
};

type MigrationStatusSummary = {
    stage?: string;
    totalAssets?: number;
    processedAssets?: number;
    migratedAssets?: number;
    failedAssets?: number;
    retryLater?: boolean;
    updatedAt?: string;
    completedAt?: string;
    lastMessage?: string;
    lastError?: string;
};

type OnlineImageStats = {
    totalAssets: number;
    referencedAssets: number;
    localImageAssets: number;
    localImageBytes: number;
    remoteImageAssets: number;
    migrationStatus?: MigrationStatusSummary;
};

type OnlineUserRecord = {
    id: string;
    ip: string;
    online: boolean;
    sessionCount: number;
    firstSeenAt: string;
    lastSeenAt: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    colo?: string;
    userAgents: string[];
    paths: string[];
    referrers: string[];
    versionName?: string;
    versionCode?: number;
    platform?: string;
    heartbeatCount: number;
    imageStats?: OnlineImageStats;
};

const ONLINE_R2_PREFIX = 'moranjianghu/online';
const REGISTRY_FILE = 'sessions.json';
const SESSION_TTL_MS = 2 * 60 * 1000;
const SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 500;
const HEARTBEAT_MIN_INTERVAL_MS = 20 * 1000;

const buildJsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...CORS_HEADERS
        }
    })
);

const readString = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const toPositiveInt = (value: unknown, fallback: number): number => {
    const parsed = Math.floor(Number(value));
    return parsed > 0 ? parsed : fallback;
};

const toNonNegativeInt = (value: unknown, fallback = 0): number => {
    const parsed = Math.floor(Number(value));
    return parsed >= 0 ? parsed : fallback;
};

const getBucket = (env: any): R2Bucket | null => {
    const candidate = env?.ONLINE_SESSIONS_R2 || env?.CNB_SYNC_R2;
    if (!candidate || typeof candidate.get !== 'function' || typeof candidate.put !== 'function') return null;
    return candidate as R2Bucket;
};

const getPrefix = (env: any): string => (
    readString(env?.ONLINE_SESSIONS_R2_PREFIX) || ONLINE_R2_PREFIX
).replace(/^\/+|\/+$/g, '') || ONLINE_R2_PREFIX;

const getRegistryKey = (env: any): string => `${getPrefix(env)}/${REGISTRY_FILE}`;

const getSessionTtlMs = (env: any): number => Math.max(30, toPositiveInt(env?.ONLINE_SESSION_TTL_SECONDS, SESSION_TTL_MS / 1000)) * 1000;

const getAdminPassword = (env: any): string => readString(env?.ONLINE_ADMIN_PASSWORD);

const readBearerToken = (request: Request): string => {
    const authHeader = readString(request.headers.get('Authorization'));
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || '';
};

const getClientIp = (request: Request): string => {
    const direct = readString(request.headers.get('CF-Connecting-IP'));
    if (direct) return direct;
    const forwarded = readString(request.headers.get('X-Forwarded-For'));
    if (forwarded) return forwarded.split(',')[0]?.trim() || '';
    return readString(request.headers.get('X-Real-IP'));
};

const isAdminRequest = (request: Request, env: any): boolean => {
    const password = getAdminPassword(env);
    if (!password) return false;
    return readBearerToken(request) === password;
};

const readRequestJson = async (request: Request): Promise<any> => {
    const text = await request.text();
    if (!text) return {};
    if (text.length > 16384) throw new Error('请求体过大');
    return JSON.parse(text);
};

const sanitizeMigrationStatus = (value: unknown): MigrationStatusSummary | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const source = value as Record<string, unknown>;
    return {
        stage: readString(source.stage).slice(0, 40),
        totalAssets: toNonNegativeInt(source.totalAssets),
        processedAssets: toNonNegativeInt(source.processedAssets),
        migratedAssets: toNonNegativeInt(source.migratedAssets),
        failedAssets: toNonNegativeInt(source.failedAssets),
        retryLater: Boolean(source.retryLater),
        updatedAt: readString(source.updatedAt).slice(0, 40),
        completedAt: readString(source.completedAt).slice(0, 40),
        lastMessage: readString(source.lastMessage).slice(0, 120),
        lastError: readString(source.lastError).slice(0, 120)
    };
};

const sanitizeImageStats = (value: unknown, fallback?: OnlineImageStats): OnlineImageStats | undefined => {
    if (!value || typeof value !== 'object') return fallback;
    const source = value as Record<string, unknown>;
    return {
        totalAssets: toNonNegativeInt(source.totalAssets, fallback?.totalAssets || 0),
        referencedAssets: toNonNegativeInt(source.referencedAssets, fallback?.referencedAssets || 0),
        localImageAssets: toNonNegativeInt(source.localImageAssets, fallback?.localImageAssets || 0),
        localImageBytes: toNonNegativeInt(source.localImageBytes, fallback?.localImageBytes || 0),
        remoteImageAssets: toNonNegativeInt(source.remoteImageAssets, fallback?.remoteImageAssets || 0),
        migrationStatus: sanitizeMigrationStatus(source.migrationStatus) || fallback?.migrationStatus
    };
};

const readRegistry = async (env: any): Promise<OnlineRegistry> => {
    const bucket = getBucket(env);
    if (!bucket) return { sessions: [] };
    const object = await bucket.get(getRegistryKey(env));
    if (!object) return { sessions: [] };
    try {
        const parsed = await object.json() as Partial<OnlineRegistry>;
        return {
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions.filter((item: any) => item && typeof item === 'object') as OnlineSessionRecord[] : []
        };
    } catch {
        return { sessions: [] };
    }
};

const writeRegistry = async (env: any, registry: OnlineRegistry): Promise<void> => {
    const bucket = getBucket(env);
    if (!bucket) throw new Error('ONLINE_SESSIONS_R2/CNB_SYNC_R2 is not configured');
    await bucket.put(getRegistryKey(env), JSON.stringify(registry), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });
};

const sanitizeSessionId = (value: unknown): string => (
    readString(value).replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 96)
);

const buildSessionId = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const suffix = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `web_${Date.now().toString(36)}_${suffix}`;
};

const cleanupSessions = (sessions: OnlineSessionRecord[], nowMs: number): OnlineSessionRecord[] => (
    sessions
        .filter((item) => {
            const lastSeenMs = Date.parse(item.lastSeenAt || item.firstSeenAt || '');
            return Number.isFinite(lastSeenMs) && nowMs - lastSeenMs <= SESSION_RETENTION_MS;
        })
        .sort((left, right) => Date.parse(right.lastSeenAt || '') - Date.parse(left.lastSeenAt || ''))
        .slice(0, MAX_SESSIONS)
);

const chooseLatestMigrationStatus = (left?: MigrationStatusSummary, right?: MigrationStatusSummary): MigrationStatusSummary | undefined => {
    if (!left) return right;
    if (!right) return left;
    const leftTime = Date.parse(left.updatedAt || left.completedAt || '');
    const rightTime = Date.parse(right.updatedAt || right.completedAt || '');
    if (!Number.isFinite(leftTime)) return right;
    if (!Number.isFinite(rightTime)) return left;
    return rightTime >= leftTime ? right : left;
};

const mergeImageStats = (current: OnlineImageStats | undefined, next: OnlineImageStats | undefined): OnlineImageStats | undefined => {
    if (!current) return next;
    if (!next) return current;
    return {
        totalAssets: Math.max(current.totalAssets || 0, next.totalAssets || 0),
        referencedAssets: Math.max(current.referencedAssets || 0, next.referencedAssets || 0),
        localImageAssets: Math.max(current.localImageAssets || 0, next.localImageAssets || 0),
        localImageBytes: Math.max(current.localImageBytes || 0, next.localImageBytes || 0),
        remoteImageAssets: Math.max(current.remoteImageAssets || 0, next.remoteImageAssets || 0),
        migrationStatus: chooseLatestMigrationStatus(current.migrationStatus, next.migrationStatus)
    };
};

const uniqueLimited = (values: string[], value: string, limit = 4): string[] => {
    const text = readString(value);
    if (!text || values.includes(text)) return values;
    return [...values, text].slice(0, limit);
};

const aggregateUsersByIp = (sessions: OnlineSessionRecord[], nowMs: number, ttlMs: number): OnlineUserRecord[] => {
    const users = new Map<string, OnlineUserRecord>();
    sessions.forEach((session) => {
        const ip = readString(session.ip) || 'unknown';
        const id = ip;
        const lastSeenMs = Date.parse(session.lastSeenAt || '');
        const firstSeenMs = Date.parse(session.firstSeenAt || session.lastSeenAt || '');
        const online = Number.isFinite(lastSeenMs) && nowMs - lastSeenMs <= ttlMs;
        const existing = users.get(id);
        if (!existing) {
            users.set(id, {
                id,
                ip,
                online,
                sessionCount: 1,
                firstSeenAt: session.firstSeenAt,
                lastSeenAt: session.lastSeenAt,
                country: session.country,
                region: session.region,
                city: session.city,
                timezone: session.timezone,
                colo: session.colo,
                userAgents: session.userAgent ? [session.userAgent] : [],
                paths: session.path ? [session.path] : [],
                referrers: session.referrer ? [session.referrer] : [],
                versionName: session.versionName,
                versionCode: session.versionCode,
                platform: session.platform,
                heartbeatCount: session.heartbeatCount || 0,
                imageStats: session.imageStats
            });
            return;
        }

        existing.online = existing.online || online;
        existing.sessionCount += 1;
        existing.heartbeatCount += session.heartbeatCount || 0;
        existing.userAgents = uniqueLimited(existing.userAgents, session.userAgent || '');
        existing.paths = uniqueLimited(existing.paths, session.path || '');
        existing.referrers = uniqueLimited(existing.referrers, session.referrer || '');
        existing.imageStats = mergeImageStats(existing.imageStats, session.imageStats);

        const existingFirstMs = Date.parse(existing.firstSeenAt || '');
        if (Number.isFinite(firstSeenMs) && (!Number.isFinite(existingFirstMs) || firstSeenMs < existingFirstMs)) {
            existing.firstSeenAt = session.firstSeenAt;
        }
        const existingLastMs = Date.parse(existing.lastSeenAt || '');
        if (Number.isFinite(lastSeenMs) && (!Number.isFinite(existingLastMs) || lastSeenMs > existingLastMs)) {
            existing.lastSeenAt = session.lastSeenAt;
            existing.country = session.country;
            existing.region = session.region;
            existing.city = session.city;
            existing.timezone = session.timezone;
            existing.colo = session.colo;
            existing.versionName = session.versionName;
            existing.versionCode = session.versionCode;
            existing.platform = session.platform;
        }
    });
    return Array.from(users.values()).sort((left, right) => Date.parse(right.lastSeenAt || '') - Date.parse(left.lastSeenAt || ''));
};

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    if (!isAdminRequest(request, env)) {
        return buildJsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const nowMs = Date.now();
    const ttlMs = getSessionTtlMs(env);
    const registry = await readRegistry(env);
    const sessions = cleanupSessions(registry.sessions, nowMs);
    const onlineSessions = sessions.filter((item) => {
        const lastSeenMs = Date.parse(item.lastSeenAt || '');
        return Number.isFinite(lastSeenMs) && nowMs - lastSeenMs <= ttlMs;
    });
    const users = aggregateUsersByIp(sessions, nowMs, ttlMs);
    const onlineUsers = users.filter((item) => item.online);

    return buildJsonResponse({
        success: true,
        serverTime: new Date(nowMs).toISOString(),
        onlineCount: onlineUsers.length,
        totalRecentCount: users.length,
        ttlSeconds: Math.round(ttlMs / 1000),
        users: onlineUsers,
        recentUsers: users.slice(0, 100),
        sessions: onlineSessions,
        recentSessions: sessions.slice(0, 100)
    });
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
    try {
        const bucket = getBucket(env);
        if (!bucket) return buildJsonResponse({ success: false, error: 'Online session storage is not configured' }, 503);

        const body = await readRequestJson(request);
        const now = new Date();
        const nowMs = now.getTime();
        const nowIso = now.toISOString();
        const sessionId = sanitizeSessionId(body?.sessionId) || buildSessionId();
        const registry = await readRegistry(env);
        const sessions = cleanupSessions(registry.sessions, nowMs);
        const existingIndex = sessions.findIndex((item) => item.id === sessionId);
        const existing = existingIndex >= 0 ? sessions[existingIndex] : null;
        const existingLastSeenMs = existing ? Date.parse(existing.lastSeenAt || '') : 0;

        if (existing && Number.isFinite(existingLastSeenMs) && nowMs - existingLastSeenMs < HEARTBEAT_MIN_INTERVAL_MS) {
            return buildJsonResponse({
                success: true,
                sessionId,
                serverTime: nowIso,
                accepted: false,
                nextHeartbeatSeconds: Math.ceil((HEARTBEAT_MIN_INTERVAL_MS - (nowMs - existingLastSeenMs)) / 1000)
            });
        }

        const cf = (request as any).cf || {};
        const nextRecord: OnlineSessionRecord = {
            id: sessionId,
            firstSeenAt: existing?.firstSeenAt || nowIso,
            lastSeenAt: nowIso,
            ip: getClientIp(request),
            country: readString(cf.country),
            region: readString(cf.region) || readString(cf.regionCode),
            city: readString(cf.city),
            timezone: readString(cf.timezone),
            colo: readString(cf.colo),
            userAgent: readString(request.headers.get('User-Agent')).slice(0, 240),
            path: readString(body?.path).slice(0, 240),
            referrer: readString(body?.referrer).slice(0, 240),
            versionName: readString(body?.versionName).slice(0, 40),
            versionCode: toPositiveInt(body?.versionCode, existing?.versionCode || 0) || undefined,
            platform: readString(body?.platform).slice(0, 80),
            imageStats: sanitizeImageStats(body?.imageStats, existing?.imageStats),
            heartbeatCount: (existing?.heartbeatCount || 0) + 1
        };

        if (existingIndex >= 0) {
            sessions[existingIndex] = nextRecord;
        } else {
            sessions.unshift(nextRecord);
        }
        await writeRegistry(env, { sessions: cleanupSessions(sessions, nowMs) });

        return buildJsonResponse({
            success: true,
            sessionId,
            serverTime: nowIso,
            accepted: true,
            nextHeartbeatSeconds: 30
        });
    } catch (error: any) {
        return buildJsonResponse({
            success: false,
            error: 'Online session heartbeat failed',
            detail: error?.message || String(error)
        }, 500);
    }
}
