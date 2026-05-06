const JSON_HEADERS = {
    'Content-Type': 'application/json'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-GitHub-Token, X-GitHub-Upload-Url'
};

const buildJsonResponse = (payload: unknown, status = 200): Response => {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...CORS_HEADERS
        }
    });
};

const isValidUploadUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'uploads.github.com';
    } catch {
        return false;
    }
};

const decodeBase64 = (value: string): Uint8Array => {
    const normalized = value.replace(/\s+/g, '');
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
};

const readUploadBody = async (request: Request, fallbackContentType: string): Promise<{ body: ArrayBuffer; contentType: string }> => {
    const encoding = request.headers.get('X-WuXia-Upload-Encoding')?.trim().toLowerCase() || '';
    if (encoding === 'base64-json') {
        const payload = await request.json().catch(() => null) as { base64?: unknown; contentType?: unknown } | null;
        const base64 = typeof payload?.base64 === 'string' ? payload.base64 : '';
        if (!base64.trim()) {
            throw new Error('Missing base64 upload body');
        }
        const bytes = decodeBase64(base64);
        return {
            body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
            contentType: typeof payload?.contentType === 'string' && payload.contentType.trim()
                ? payload.contentType.trim()
                : fallbackContentType
        };
    }

    return {
        body: await request.arrayBuffer(),
        contentType: fallbackContentType
    };
};

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestPost({ request }: any): Promise<Response> {
    try {
        const token = request.headers.get('X-GitHub-Token')?.trim() || '';
        const uploadUrl = request.headers.get('X-GitHub-Upload-Url')?.trim() || '';
        const contentType = request.headers.get('Content-Type')?.trim() || 'application/octet-stream';

        if (!token) {
            return buildJsonResponse({ error: 'Missing X-GitHub-Token header' }, 400);
        }

        if (!uploadUrl || !isValidUploadUrl(uploadUrl)) {
            return buildJsonResponse({ error: 'Invalid GitHub upload URL' }, 400);
        }

        const uploadBody = await readUploadBody(request, contentType);
        if (!uploadBody.body || uploadBody.body.byteLength === 0) {
            return buildJsonResponse({ error: 'Empty upload body' }, 400);
        }

        const upstreamResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': uploadBody.contentType,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'WuXia-Cloud-Sync'
            },
            body: uploadBody.body
        });

        const responseText = await upstreamResponse.text();
        return new Response(responseText, {
            status: upstreamResponse.status,
            headers: {
                ...JSON_HEADERS,
                ...CORS_HEADERS
            }
        });
    } catch (error: any) {
        return buildJsonResponse({ error: error?.message || 'Unknown upload proxy error' }, 500);
    }
}
