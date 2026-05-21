const encoder = new TextEncoder();

export const APK_CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

export const APK_LATEST_CACHE_CONTROL = 'no-store,no-cache,max-age=0,must-revalidate';
export const APK_VERSIONED_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const readEnvString = (env: any, name: string, fallback = ''): string => (
    typeof env?.[name] === 'string' && env[name].trim() ? env[name].trim() : fallback
);

export const readReleaseBaseUrl = (request: Request, env: any): string => {
    const configured = readEnvString(env, 'MORAN_RELEASE_BASE_URL');
    if (configured) return configured.replace(/\/+$/, '');
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
};

export const buildTextResponse = (message: string, status = 400): Response => (
    new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
            ...APK_CORS_HEADERS
        }
    })
);

export const normalizeObjectKey = (value: string): string => (
    value.replace(/^\/+/, '').replace(/\/+/g, '/')
);

export const encodeS3Path = (value: string): string => value
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('/');

const bytesToHex = (bytes: ArrayBuffer): string => (
    Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, '0')).join('')
);

const sha256Hex = async (data: string): Promise<string> => (
    bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(data)))
);

const hmac = async (key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> => {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
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

export const buildSignedObjectUrl = async (env: any, key: string, expiresSeconds = 1800): Promise<string> => {
    const endpoint = readEnvString(env, 'MORAN_OSS_ENDPOINT', 'https://s3.hi168.com').replace(/\/+$/, '');
    const bucket = readEnvString(env, 'MORAN_OSS_BUCKET');
    const accessKey = readEnvString(env, 'MORAN_OSS_ACCESS_KEY');
    const secretKey = readEnvString(env, 'MORAN_OSS_SECRET_KEY');
    const region = readEnvString(env, 'MORAN_OSS_REGION', 'auto');
    const service = 's3';
    if (!bucket || !accessKey || !secretKey) throw new Error('APK object storage credentials are not configured');

    const target = new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodeS3Path(normalizeObjectKey(key))}`);
    const { amzDate, dateStamp } = formatAmzDate(new Date());
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    target.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    target.searchParams.set('X-Amz-Credential', `${accessKey}/${credentialScope}`);
    target.searchParams.set('X-Amz-Date', amzDate);
    target.searchParams.set('X-Amz-Expires', String(Math.max(60, Math.min(604800, expiresSeconds))));
    target.searchParams.set('X-Amz-SignedHeaders', 'host');

    const canonicalQuery = Array.from(target.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
        .join('&');
    const canonicalRequest = [
        'GET',
        target.pathname,
        canonicalQuery,
        `host:${target.host}\n`,
        'host',
        'UNSIGNED-PAYLOAD'
    ].join('\n');
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        await sha256Hex(canonicalRequest)
    ].join('\n');
    const signingKey = await deriveSigningKey(secretKey, dateStamp, region, service);
    const signature = bytesToHex(await hmac(signingKey, stringToSign));
    target.searchParams.set('X-Amz-Signature', signature);
    return target.toString();
};

export const readReleaseObjectPrefix = (env: any): string => (
    readEnvString(env, 'MORAN_OSS_RELEASE_PREFIX', 'moranjianghu').replace(/^\/+|\/+$/g, '') || 'moranjianghu'
);

export const buildVersionedApkFileName = (versionName: unknown): string => {
    const safeVersion = typeof versionName === 'string'
        ? versionName.trim().replace(/[^0-9A-Za-z._-]/g, '')
        : '';
    return safeVersion ? `MoRanJiangHu-v${safeVersion}.apk` : '';
};

export const readManifestPayload = async (env: any): Promise<{ payload: any; sourceHeaders: Headers; etag?: string } | null> => {
    const prefix = readReleaseObjectPrefix(env);
    const key = normalizeObjectKey(`${prefix}/latest.json`);
    const r2Object = env?.CNB_SYNC_R2 ? await env.CNB_SYNC_R2.get(key) : null;
    if (r2Object) {
        const headers = new Headers();
        r2Object.writeHttpMetadata?.(headers);
        if (r2Object.etag) headers.set('ETag', r2Object.etag);
        return {
            payload: await r2Object.json(),
            sourceHeaders: headers,
            etag: r2Object.etag
        };
    }

    const manifestUrl = await buildSignedObjectUrl(env, key, 300);
    const upstream = await fetch(manifestUrl, { headers: { Accept: 'application/json' } });
    if (!upstream.ok) {
        throw new Error(`APK manifest fetch failed: ${upstream.status}`);
    }
    return {
        payload: await upstream.json(),
        sourceHeaders: upstream.headers,
        etag: upstream.headers.get('ETag') || undefined
    };
};
