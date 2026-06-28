import { describe, expect, it } from 'vitest';
import { __releaseNotesTestUtils } from '../components/ui/ReleaseNotesModal';

describe('更新日志历史记录兼容', () => {
    it('历史版本 releaseNotes 为字符串时会转换为变更列表', () => {
        const history = __releaseNotesTestUtils.buildNormalizedHistory({
            versionCode: 534,
            versionName: '1.0.534',
            releasePublishedAt: '2026-06-28T10:00:00.000+08:00',
            releaseNotes: ['最新版本说明'],
            releaseHistory: [
                {
                    versionCode: 533,
                    versionName: '1.0.533',
                    releasePublishedAt: '2026-06-27T10:00:00.000+08:00',
                    releaseNotes: '历史版本说明'
                }
            ]
        } as any);

        expect(history[1].changes).toEqual(['历史版本说明']);
    });
});
