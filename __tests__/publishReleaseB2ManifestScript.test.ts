import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.join(process.cwd(), 'scripts', 'publish-release-b2.mjs');

describe('B2 release publish manifest script', () => {
    it('does not default the APK manifest to the decommissioned hi168 provider', () => {
        const source = readFileSync(scriptPath, 'utf8');

        expect(source).not.toContain("readEnv('MORAN_RELEASE_PREFERRED_APK_PROVIDER', 'hi168')");
        expect(source).toContain("readEnv('MORAN_RELEASE_PREFERRED_APK_PROVIDER', 'b2')");
        expect(source).not.toContain('...orderedProviderUrls,\n      providerApkUrls.github');
        expect(source).toContain("readEnv('GITHUB_RELEASE_ACCELERATORS', 'https://gh.ddlc.top,https://gh-proxy.com,https://gh-proxy.ygxz.in,https://ghfast.top')");
    });
});
