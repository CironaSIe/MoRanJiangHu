import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    下载小说分解创意工坊模块,
    列出小说分解创意工坊模块,
    发布小说分解创意工坊模块
} from '../services/workshopNovelDecomposition';

describe('workshopNovelDecomposition', () => {
    const originalWindow = globalThis.window;

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.stubGlobal('window', originalWindow);
    });

    it('uses deployed workshop API endpoints inside the APK runtime', async () => {
        vi.stubGlobal('window', {
            location: {
                protocol: 'capacitor:',
                hostname: 'localhost'
            },
            Capacitor: {
                isNativePlatform: () => true,
                getPlatform: () => 'android'
            }
        });
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            ok: true,
            entries: [{
                id: 'cloud-demo',
                title: '测试模块',
                workName: '测试作品',
                contributor: 'tester',
                note: '',
                createdAt: '2026-05-27T00:00:00+08:00',
                updatedAt: '2026-05-27T00:00:00+08:00',
                fileName: 'demo.zip',
                size: 10,
                sha256: 'abc',
                chapterCount: 1,
                segmentCount: 1,
                sourceType: 'novel',
                tags: [],
                downloadUrl: '/api/workshop/novel-decomposition?action=download&id=cloud-demo'
            }]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const entries = await 列出小说分解创意工坊模块();

        expect(fetchMock.mock.calls[0][0]).toBe('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition');
        const cloudEntry = entries.find((entry) => entry.id === 'cloud-demo');
        expect(cloudEntry?.downloadUrl).toBe('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition?action=download&id=cloud-demo');
    });

    it('keeps same-origin workshop API endpoints on web origins', async () => {
        vi.stubGlobal('window', {
            location: {
                protocol: 'https:',
                hostname: 'msjh.bacon159.pp.ua',
                origin: 'https://msjh.bacon159.pp.ua'
            }
        });
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, entries: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        await 列出小说分解创意工坊模块();

        expect(fetchMock.mock.calls[0][0]).toBe('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition');
    });

    it('normalizes published and downloaded module URLs for the APK runtime', async () => {
        vi.stubGlobal('window', {
            location: {
                protocol: 'capacitor:',
                hostname: 'localhost'
            },
            Capacitor: {
                isNativePlatform: () => true,
                getPlatform: () => 'android'
            }
        });
        const fetchMock = vi.fn(async (url: string) => {
            if (String(url).includes('action=download')) {
                return new Response(new Blob(['zip']));
            }
            return new Response(JSON.stringify({
                ok: true,
                entry: {
                    id: 'published-demo',
                    title: '已发布模块',
                    workName: '测试作品',
                    tags: []
                },
                downloadUrl: '/api/workshop/novel-decomposition?action=download&id=published-demo'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => key === 'moranjianghu.cloudPlay.session.v1'
                ? JSON.stringify({
                    expiresAt: Date.now() + 60000,
                    session: {
                        userId: 'test-user',
                        username: 'tester',
                        password: 'secret',
                        clientSalt: 'salt'
                    }
                })
                : null,
            setItem: vi.fn(),
            removeItem: vi.fn()
        });

        const result = await 发布小说分解创意工坊模块({
            zipBlob: new Blob(['zip']),
            fileName: 'demo.zip',
            title: '已发布模块',
            workName: '测试作品'
        });
        await 下载小说分解创意工坊模块('published-demo');

        expect(result.downloadUrl).toBe('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition?action=download&id=published-demo');
        expect(fetchMock.mock.calls[1][0]).toBe('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition?action=download&id=published-demo');
    });
});
