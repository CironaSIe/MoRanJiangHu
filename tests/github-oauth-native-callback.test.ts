import { describe, expect, it } from 'vitest';
import { __githubOAuthTestUtils } from '../hooks/useGitHubOAuth';

describe('GitHub OAuth APK 回调兜底', () => {
    it('网页桥接回调会把 pending state 带进 deep link', () => {
        const callbackUrl = 'https://msjh.bacon159.pp.ua/oauth/github/callback?code=abc&state=native%3Astate-123';
        const deepLink = __githubOAuthTestUtils.buildNativeBridgeDeepLink(callbackUrl);
        const url = new URL(deepLink || '');

        expect(url.protocol).toBe('com.moranjianghu.game:');
        expect(url.searchParams.get('code')).toBe('abc');
        expect(url.searchParams.get('state')).toBe('native:state-123');
        expect(url.searchParams.get('oauth_pending')).toBeTruthy();
    });

    it('pending state 丢失时可从 native 回调恢复交换所需状态', () => {
        const callbackUrl = 'com.moranjianghu.game://oauth/github/callback?code=abc&state=native%3Astate-123';
        const pending = __githubOAuthTestUtils.createFallbackPendingStateFromCallback(callbackUrl);

        expect(pending?.state).toBe('native:state-123');
        expect(pending?.clientType).toBe('web');
        expect(pending?.redirectUri).toBe('https://msjh.bacon159.pp.ua/oauth/github/callback');
        expect(pending?.expectedCallbackUris).toContain('com.moranjianghu.game://oauth/github/callback');
    });
});
