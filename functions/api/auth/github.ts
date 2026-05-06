import { buildAuthJsonResponse, handleAuthOptions, postGitHubOAuthForm } from './_shared';

export function onRequestOptions(): Response {
    return handleAuthOptions();
}

export async function onRequestPost({ request, env }: any) {
    try {
        const { code, redirectUri, clientType } = await request.json();

        if (!code) {
            return buildAuthJsonResponse({ error: 'Missing authorization code' }, 400);
        }

        const usingNativeClient = clientType === 'native';
        const clientId = usingNativeClient ? env.GITHUB_NATIVE_CLIENT_ID : env.GITHUB_CLIENT_ID;
        const clientSecret = usingNativeClient ? env.GITHUB_NATIVE_CLIENT_SECRET : env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return buildAuthJsonResponse({
                error: usingNativeClient
                    ? 'Missing GITHUB_NATIVE_CLIENT_ID or GITHUB_NATIVE_CLIENT_SECRET env variables in Cloudflare'
                    : 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET env variables in Cloudflare'
            }, 500);
        }

        const { response: tokenResponse, data: tokenData } = await postGitHubOAuthForm('https://github.com/login/oauth/access_token', {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            ...(typeof redirectUri === 'string' && redirectUri.trim()
                ? { redirect_uri: redirectUri.trim() }
                : {})
        });

        if (!tokenResponse.ok) {
            return buildAuthJsonResponse({ error: tokenData.error_description || tokenData.error || 'GitHub OAuth token exchange failed' }, tokenResponse.status);
        }

        if (tokenData.error) {
            return buildAuthJsonResponse({ error: tokenData.error_description || tokenData.error }, 400);
        }

        return buildAuthJsonResponse({ access_token: tokenData.access_token });
    } catch (error: any) {
        return buildAuthJsonResponse({ error: error?.message || 'Unknown GitHub OAuth error' }, 500);
    }
}
