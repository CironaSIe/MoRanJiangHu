import { describe, expect, it } from 'vitest';

import { onRequestGet } from '../functions/api/apk/latest.json';

const buildRequest = () => new Request('https://msjh.bacon159.pp.ua/api/apk/latest.json');

const buildEnv = (payload: unknown) => ({
    RELEASE_MANIFEST: {
        get: async (key: string, type: string) => {
            expect(key).toBe('release-manifest/latest.json');
            expect(type).toBe('json');
            return payload;
        }
    }
});

describe('APK latest manifest proxy', () => {
    it('normalizes a flat KV manifest and adds B2, GitHub and OneDrive APK URLs', async () => {
        const response = await onRequestGet({
            request: buildRequest(),
            env: buildEnv({
                versionName: '1.0.528',
                versionCode: 528,
                releaseNotes: ['修复 APK 下载渠道']
            })
        } as any);

        expect(response.status).toBe(200);
        const payload = await response.json();

        expect(payload.versionName).toBe('1.0.528');
        expect(payload.latest.versionName).toBe('1.0.528');
        expect(payload.latest.versionCode).toBe(528);
        expect(payload.latest.b2ApkUrl).toBe('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.528.apk?provider=b2');
        expect(payload.latest.githubApkUrl).toBe('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.528.apk?provider=github');
        expect(payload.latest.githubAcceleratedApkUrls).toEqual([
            'https://gh.ddlc.top/https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.528/MoRanJiangHu-v1.0.528.apk',
            'https://gh-proxy.com/https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.528/MoRanJiangHu-v1.0.528.apk',
            'https://gh-proxy.ygxz.in/https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.528/MoRanJiangHu-v1.0.528.apk',
            'https://ghfast.top/https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.528/MoRanJiangHu-v1.0.528.apk'
        ]);
        expect(payload.latest.oneDriveApkUrl).toBe('https://msjh.bacon159.pp.ua/api/apk/latest.apk?provider=onedrive');
        expect(payload.latest.r2ApkUrl).toBe('');
        expect(payload.latest.hi168ApkUrl).toBe('');
        expect(payload.latest.apkUrls).toContain(payload.latest.githubApkUrl);
        expect(payload.latest.apkUrls).toContain(payload.latest.githubAcceleratedApkUrls[0]);
    });

    it('keeps nested latest manifest values and uses latest.versionName first', async () => {
        const response = await onRequestGet({
            request: buildRequest(),
            env: buildEnv({
                versionName: '1.0.527',
                versionCode: 527,
                latest: {
                    versionName: '1.0.528',
                    versionCode: 528,
                    releaseChannel: 'stable'
                },
                history: []
            })
        } as any);

        expect(response.status).toBe(200);
        const payload = await response.json();

        expect(payload.latest.versionName).toBe('1.0.528');
        expect(payload.latest.versionCode).toBe(528);
        expect(payload.latest.releaseChannel).toBe('stable');
        expect(payload.latest.apkUrls).toContain('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.528.apk?provider=github');
        expect(payload.latest.apkUrls).toContain('https://gh.ddlc.top/https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.528/MoRanJiangHu-v1.0.528.apk');
    });
});
