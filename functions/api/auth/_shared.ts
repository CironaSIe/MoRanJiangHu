const JSON_HEADERS = {
    'Content-Type': 'application/json'
};

export const AUTH_CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export const buildAuthJsonResponse = (payload: unknown, status = 200): Response => {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...AUTH_CORS_HEADERS
        }
    });
};

export const handleAuthOptions = (): Response => {
    return new Response(null, {
        status: 204,
        headers: AUTH_CORS_HEADERS
    });
};

export const postGitHubOAuthForm = async (
    url: string,
    params: Record<string, string>
): Promise<{ response: Response; data: any }> => {
    const body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
            body.set(key, value.trim());
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MoRanJiangHu-Cloud-Sync'
        },
        body
    });

    const rawText = await response.text();
    try {
        return {
            response,
            data: rawText ? JSON.parse(rawText) : {}
        };
    } catch {
        const preview = rawText.replace(/\s+/g, ' ').trim().slice(0, 180);
        return {
            response,
            data: {
                error: response.ok ? 'invalid_json_response' : 'github_oauth_upstream_error',
                error_description: preview || `GitHub OAuth upstream returned HTTP ${response.status}`
            }
        };
    }
};
