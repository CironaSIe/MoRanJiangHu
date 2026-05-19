import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const zip = unzipSync(readFileSync('.tmp-release-assets/WuXia_Save_Data.zip'));
const saveName = Object.keys(zip).find((name) => name.startsWith('saves/') && name.endsWith('.json'));
const baseSave = JSON.parse(strFromU8(zip[saveName]));

const closeReleaseNotesIfOpen = async (page) => {
    const closeButton = page.locator('button[aria-label="关闭更新日志"]');
    await closeButton.waitFor({ state: 'visible', timeout: 2500 }).catch(() => {});
    if (await closeButton.count() && await closeButton.first().isVisible().catch(() => false)) {
        await closeButton.first().click({ timeout: 3000, force: true });
        await closeButton.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
};

const clickByTexts = async (page, texts) => {
    for (const text of texts) {
        const button = page.getByRole('button', { name: new RegExp(text) }).first();
        if (await button.count() && await button.isVisible().catch(() => false)) {
            await button.click({ timeout: 3000, force: true });
            return true;
        }
        const locator = page.getByText(text, { exact: false }).first();
        if (await locator.count() && await locator.isVisible().catch(() => false)) {
            await locator.click({ timeout: 3000, force: true });
            return true;
        }
    }
    return false;
};

const makeSave = (id, name, timestamp) => ({
    ...structuredClone(baseSave),
    id,
    类型: 'manual',
    时间戳: timestamp,
    角色数据: {
        ...(baseSave.角色数据 || {}),
        姓名: name,
    },
    元数据: {
        ...(baseSave.元数据 || {}),
        名称: name,
    },
});

const makeSummary = (save) => ({
    id: save.id,
    类型: save.类型,
    时间戳: save.时间戳,
    元数据: {
        ...(save.元数据 || {}),
        现实保存时间戳: save.时间戳,
        现实保存时间ISO: new Date(save.时间戳).toISOString(),
    },
    游戏初始时间: save.游戏初始时间,
    角色数据: {
        姓名: save.角色数据?.姓名,
        境界: save.角色数据?.境界,
        境界层级: save.角色数据?.境界层级,
    },
    环境信息: save.环境信息
        ? {
            时间: save.环境信息.时间,
            年: save.环境信息.年,
            月: save.环境信息.月,
            日: save.环境信息.日,
            时: save.环境信息.时,
            分: save.环境信息.分,
            大地点: save.环境信息.大地点,
            中地点: save.环境信息.中地点,
            小地点: save.环境信息.小地点,
            具体地点: save.环境信息.具体地点,
        }
        : undefined,
});

const injectSavesAndReload = async (page) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await closeReleaseNotesIfOpen(page);
    await page.evaluate(async (payload) => {
        const req = indexedDB.open('WuxiaGameDB', 3);
        const db = await new Promise((resolve, reject) => {
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('image_assets')) db.createObjectStore('image_assets', { keyPath: 'id' });
            };
        });
        await new Promise((resolve, reject) => {
            const tx = db.transaction(['saves', 'save_summaries'], 'readwrite');
            const store = tx.objectStore('saves');
            const summaryStore = tx.objectStore('save_summaries');
            store.clear();
            summaryStore.clear();
            for (const item of payload) {
                store.put(item.save);
                summaryStore.put(item.summary);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }, [
        makeSave(9001, '单档导出甲', 1713600000000),
        makeSave(9002, '单档导出乙', 1713686400000),
    ].map((save) => ({ save, summary: makeSummary(save) })));
    await page.reload({ waitUntil: 'networkidle' });
};

test('可以只导出选中的单个存档', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
        localStorage.setItem('moranjianghu.releaseNotesSuppressDate', new Date().toISOString().slice(0, 10));
    });

    await injectSavesAndReload(page);
    await expect.poll(() => clickByTexts(page, ['重入江湖', '读取进度', '继续游戏', '读取', '载入'])).toBe(true);

    const targetCard = page.locator('[class*="border-gray-700"]', { hasText: '单档导出甲' }).first();
    await expect(targetCard).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '导出全部存档' })).toBeVisible();
    await expect(targetCard.getByRole('button', { name: '导出此档' })).toHaveCount(1);

    const downloadPromise = page.waitForEvent('download');
    await targetCard.getByRole('button', { name: '导出此档' }).click({ force: true });
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^wuxia-save-manual-.*单档导出甲\.zip$/);

    const downloadedPath = await download.path();
    const exportedZip = unzipSync(readFileSync(downloadedPath));
    const manifest = JSON.parse(strFromU8(exportedZip['manifest.json']));

    expect(manifest.saves).toHaveLength(1);
    expect(manifest.saves[0].标题).toBe('单档导出甲');
    expect(manifest.saves[0].标题).not.toBe('单档导出乙');
});
