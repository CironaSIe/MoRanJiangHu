import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.MORAN_IMAGE_FALLBACK_E2E_PORT || 4183);
const baseUrl = `http://127.0.0.1:${port}/`;

const run = async () => {
    const server = await createServer({
        root: repoRoot,
        logLevel: 'error',
        server: {
            host: '127.0.0.1',
            port,
            strictPort: true
        }
    });

    let browser;
    try {
        await server.listen();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

        const result = await page.evaluate(async () => {
            const [imageAssets, dbService, prefetch] = await Promise.all([
                import('/utils/imageAssets.ts'),
                import('/services/dbService.ts'),
                import('/hooks/useImageAssetPrefetch.ts')
            ]);

            const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
            const assetId = `e2e_avatar_${Date.now()}`;
            const assetRef = imageAssets.创建图片资源引用(assetId);
            const remoteUrl = `https://image.bacon159.pp.ua/api/v1/file/e2e-avatar-${Date.now()}.png`;

            const openDb = () => new Promise((resolve, reject) => {
                const request = indexedDB.open('WuxiaGameDB', 3);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        db.createObjectStore('saves', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('save_summaries')) {
                        db.createObjectStore('save_summaries', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('settings')) {
                        db.createObjectStore('settings', { keyPath: 'key' });
                    }
                    if (!db.objectStoreNames.contains('image_assets')) {
                        db.createObjectStore('image_assets', { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const db = await openDb();
            await new Promise((resolve, reject) => {
                const transaction = db.transaction(['image_assets'], 'readwrite');
                transaction.objectStore('image_assets').put({ id: assetId, dataUrl, createdAt: Date.now() });
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });

            imageAssets.注册远程图片兜底引用(remoteUrl, assetId);
            imageAssets.清空图片资源缓存();

            const before = imageAssets.获取图片资源文本地址(remoteUrl);
            const extractedRefs = prefetch.提取图片资源引用列表({
                社交: [{ 姓名: '端到端头像', 图片URL: remoteUrl }]
            });
            const loadedDataUrl = await dbService.读取图片资源(assetRef);
            const after = imageAssets.获取图片资源文本地址(remoteUrl);

            const img = new Image();
            const loadResult = await new Promise((resolve) => {
                img.onload = () => resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = () => resolve({ ok: false, width: img.naturalWidth, height: img.naturalHeight });
                img.src = after;
            });

            db.close();
            return {
                ok: before === remoteUrl
                    && extractedRefs.includes(assetRef)
                    && loadedDataUrl === dataUrl
                    && after === dataUrl
                    && loadResult.ok === true,
                beforeUsesRemote: before === remoteUrl,
                extractedRefs,
                assetRef,
                loadedFromIndexedDb: loadedDataUrl === dataUrl,
                afterUsesLocalDataUrl: after === dataUrl,
                imageLoaded: loadResult
            };
        });

        if (!result.ok) {
            throw new Error(`Image fallback E2E failed: ${JSON.stringify(result, null, 2)}`);
        }
        console.log(JSON.stringify(result, null, 2));
    } finally {
        if (browser) await browser.close().catch(() => undefined);
        await server.close().catch(() => undefined);
    }
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
