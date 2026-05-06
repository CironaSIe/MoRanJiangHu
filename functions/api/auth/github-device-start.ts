import { buildAuthJsonResponse, handleAuthOptions, postGitHubOAuthForm } from './_shared';

export function onRequestOptions(): Response {
    return handleAuthOptions();
}

export async function onRequestPost({ env }: any) {
    try {
        const { GITHUB_CLIENT_ID } = env;
        if (!GITHUB_CLIENT_ID) {
            return buildAuthJsonResponse({ error: 'Missing GITHUB_CLIENT_ID env variable in Cloudflare' }, 500);
        }

        const { response, data } = await postGitHubOAuthForm('https://github.com/login/device/code', {
            client_id: GITHUB_CLIENT_ID,
            scope: 'repo'
        });

        if (!response.ok) {
            return buildAuthJsonResponse({ error: data.error_description || data.error || 'Failed to start GitHub device flow' }, response.status);
        }

        return buildAuthJsonResponse({
            device_code: data.device_code,
            user_code: data.user_code,
            verification_uri: data.verification_uri,
            verification_uri_complete: data.verification_uri_complete,
            expires_in: data.expires_in,
            interval: data.interval
        });
    } catch (error: any) {
        return buildAuthJsonResponse({ error: error?.message || 'Unknown GitHub device flow error' }, 500);
    }
}
