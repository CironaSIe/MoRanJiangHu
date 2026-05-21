import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const syncToObjectStorage = vi.fn();
const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn(() => {
            store.clear();
        })
    };
};

vi.mock('../services/dbService', () => ({
    计算存档同步哈希: vi.fn((save: any) => save?.元数据?.存档哈希 || 'abcd1234abcd1234'),
    读取存档列表: vi.fn(async () => [])
}));

vi.mock('../services/saveArchiveService', () => ({
    导出ZIP存档文件: vi.fn(async () => new Blob(['save'])),
    解析ZIP存档文件: vi.fn()
}));

vi.mock('../services/imageHostService', () => ({
    上传Blob到图床: vi.fn(async () => ({ url: 'https://image.example/save.mjc', size: 4 })),
    buildImageHostProxyUrl: (path: string) => path
}));

vi.mock('../services/objectStorageSync', () => ({
    读取对象存储同步配置: vi.fn(async () => ({
        endpoint: 'https://s3.example.com',
        bucket: 'bucket',
        accessKey: 'ak',
        secretKey: 'sk'
    })),
    增量同步到对象存储: (...args: any[]) => syncToObjectStorage(...args)
}));

describe('云端游玩存储模式', () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', createLocalStorageMock());
        syncToObjectStorage.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('对象存储选择状态优先于已存在 TG 会话，后台自动同步不会被 TG 抢走', async () => {
        const service = await import('../services/cloudPlayService');
        localStorage.setItem('moranjianghu.cloudPlay.session.v1', JSON.stringify({
            expiresAt: Date.now() + 60_000,
            session: {
                userId: 'u1',
                username: 'tg-user',
                password: 'pw',
                clientSalt: 'salt'
            }
        }));
        service.启用对象存储云端游玩模式();
        syncToObjectStorage.mockResolvedValueOnce({ uploaded: 1, skipped: 0, updated: 0, deduped: 0, total: 1 });

        expect(service.读取云端游玩存储模式()).toBe('object');
        service.后台同步存档到云端({
            id: 1,
            类型: 'auto',
            时间戳: 1779000000000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '武馆' },
            历史记录: [],
            元数据: { 存档哈希: 'abcd1234abcd1234' }
        } as any);

        await vi.waitFor(() => expect(syncToObjectStorage).toHaveBeenCalledTimes(1));
    });
});
