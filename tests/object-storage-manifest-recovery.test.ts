import { describe, expect, it } from 'vitest';
import { __objectStorageSyncTestUtils } from '../services/objectStorageSync';

describe('对象存储 manifest 兼容恢复', () => {
    it('从 saves 目录里的对象存储包恢复云存档清单', async () => {
        const packagePayload = {
            format: 'moranjianghu-object-storage-save-package',
            version: 1,
            metadata: {
                id: 'manual_20260628_demo',
                fileName: 'manual_20260628_demo.json',
                title: '测试角色',
                type: 'manual',
                saveTimestamp: 1782640000000,
                savedAt: '2026-06-28T08:00:00.000Z',
                syncedAt: '2026-06-28T08:01:00.000Z',
                deviceType: 'computer',
                deviceLabel: '电脑',
                appVersion: '1.0.533',
                versionCode: 533,
                hash: 'abc123',
                size: 1234,
                location: '测试地点',
                gameTime: '辰时'
            },
            archiveBase64: 'UEsDBAo='
        };

        const manifest = await __objectStorageSyncTestUtils.recoverManifestFromSavePackages(
            ['MoRanJiangHu/saves/manual_20260628_demo.json'],
            async () => packagePayload
        );

        expect(manifest.saves).toHaveLength(1);
        expect(manifest.saves[0].id).toBe('manual_20260628_demo');
        expect(manifest.saves[0].fileName).toBe('manual_20260628_demo.json');
    });
});
