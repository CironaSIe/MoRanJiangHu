import { describe, expect, it, vi } from 'vitest';
import { uploadApkToOpenList } from '../scripts/upload-apk-onedrive.mjs';

describe('OneDrive APK 上传重试', () => {
    it('遇到临时连接重置后会重试同一个文件', async () => {
        const retrySpy = vi.fn();
        const fetchImpl = vi
            .fn()
            .mockRejectedValueOnce(Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNRESET' } }))
            .mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ code: 200 })
            });

        const result = await uploadApkToOpenList({
            apkBytes: Buffer.from('apk-bytes'),
            versionName: '1.0.535',
            baseUrl: 'https://openlist.example',
            authToken: 'token',
            timeoutMs: 1000,
            maxAttempts: 2,
            fetchImpl,
            onRetry: retrySpy
        });

        expect(result.ok).toBe(true);
        expect(fetchImpl).toHaveBeenCalledTimes(3);
        expect(retrySpy).toHaveBeenCalledWith(expect.objectContaining({
            filePath: '/Onedrive/MoRanJiangHu/releases/latest.apk',
            attempt: 1,
            maxAttempts: 2
        }));
    });
});
