import { describe, expect, it } from 'vitest';

import { onRequestGet } from '../functions/api/apk/version/[file]';
import { onRequestGet as onLatestApkRequestGet } from '../functions/api/apk/latest.apk';

describe('APK B2 provider', () => {
    it('redirects the current versioned APK to the public B2 object URL', async () => {
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.523.apk?provider=b2'),
            params: { file: 'MoRanJiangHu-v1.0.523.apk' },
            env: {
                MORAN_B2_DISTRIBUTION_BASE_URL: 'https://obs1.bacon159.pp.ua',
                MORAN_B2_DISTRIBUTION_RELEASE_PREFIX: 'moranjianghu',
                RELEASE_MANIFEST: {
                    get: async () => ({
                        latest: {
                            versionCode: 523,
                            versionName: '1.0.523',
                            preferredApkProvider: 'b2',
                            b2ApkUrl: 'https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.523.apk?provider=b2',
                            apkUrls: [
                                'https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.523.apk?provider=b2'
                            ]
                        }
                    })
                }
            }
        } as any);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('https://obs1.bacon159.pp.ua/moranjianghu/MoRanJiangHu-v1.0.523.apk');
        expect(response.headers.get('X-Moran-Apk-Source')).toBe('b2-redirect');
    });

    it('uses GitHub Release for latest.apk when the manifest prefers GitHub', async () => {
        const response = await onLatestApkRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/apk/latest.apk'),
            env: {
                RELEASE_MANIFEST: {
                    get: async () => ({
                        latest: {
                            versionCode: 529,
                            versionName: '1.0.529',
                            preferredApkProvider: 'github'
                        }
                    })
                }
            }
        } as any);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.529/MoRanJiangHu-v1.0.529.apk');
        expect(response.headers.get('X-Moran-Apk-Source')).toBe('github-release');
    });

    it('uses GitHub Release for the versioned APK when the manifest prefers GitHub', async () => {
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.529.apk'),
            params: { file: 'MoRanJiangHu-v1.0.529.apk' },
            env: {
                RELEASE_MANIFEST: {
                    get: async () => ({
                        latest: {
                            versionCode: 529,
                            versionName: '1.0.529',
                            preferredApkProvider: 'github'
                        }
                    })
                }
            }
        } as any);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('https://github.com/ypq123456789/MoRanJiangHu/releases/download/v1.0.529/MoRanJiangHu-v1.0.529.apk');
        expect(response.headers.get('X-Moran-Apk-Source')).toBe('github-release');
    });
});
