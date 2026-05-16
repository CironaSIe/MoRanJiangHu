import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const zip = unzipSync(readFileSync('.tmp-release-assets/WuXia_Save_Data.zip'));
const saveName = Object.keys(zip).find((name) => name.startsWith('saves/') && name.endsWith('.json'));
const baseSave = JSON.parse(strFromU8(zip[saveName]));

const closeReleaseNotesIfOpen = async (page) => {
    const closeButton = page.locator('button[aria-label="关闭更新日志"], button[aria-label="鍏抽棴鏇存柊鏃ュ織"]');
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

const makeBattleSave = () => {
    const save = structuredClone(baseSave);
    save.id = 'battle-order-display-e2e';
    save.元数据 = {
        ...(save.元数据 || {}),
        名称: '战斗顺序显示验证'
    };
    save.战斗 = {
        是否战斗中: true,
        敌方: [
            {
                名字: '寇二',
                境界: '开脉一重',
                当前血量: 80,
                最大血量: 100,
                当前精力: 50,
                最大精力: 60,
                当前内力: 10,
                最大内力: 20,
                攻击力: 12,
                防御力: 8,
                敏捷: 8,
                技能: ['短刀突刺'],
            },
            {
                名字: '寨主',
                境界: '开脉二重',
                当前血量: 120,
                最大血量: 120,
                当前精力: 55,
                最大精力: 70,
                当前内力: 18,
                最大内力: 30,
                攻击力: 18,
                防御力: 12,
                敏捷: 14,
                技能: ['劈山刀'],
            },
        ],
    };
    return save;
};

const injectSaveAndReload = async (page) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await closeReleaseNotesIfOpen(page);
    await page.evaluate(async (payload) => {
        const req = indexedDB.open('WuxiaGameDB', 2);
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
            const tx = db.transaction(['saves'], 'readwrite');
            const store = tx.objectStore('saves');
            store.clear();
            store.put(payload);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }, makeBattleSave());
    await page.reload({ waitUntil: 'networkidle' });
};

test('战斗面板展示按身法排序的具体行动顺序', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
        localStorage.setItem('moranjianghu.releaseNotesSuppressDate', new Date().toISOString().slice(0, 10));
    });

    await injectSaveAndReload(page);
    await expect.poll(() => clickByTexts(page, ['重入江湖', '读取进度', '继续游戏', '读取', '载入'])).toBe(true);
    await page.waitForTimeout(700);
    await page.locator('[class*="cursor-pointer"]', { hasText: /MANUAL|手动快照/ }).first().click({ timeout: 5000, force: true });
    await page.waitForTimeout(300);
    await expect.poll(() => clickByTexts(page, ['加载此存档', '读取此存档', '载入存档', '确认读取', '读取', '进入江湖'])).toBe(true);
    await page.waitForTimeout(2500);
    await expect.poll(() => clickByTexts(page, ['战斗'])).toBe(true);

    await expect(page.getByText('行动顺序（按身法排列）')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('寇二').first()).toBeVisible();
    await expect(page.getByText('寨主').first()).toBeVisible();
    await expect(page.getByText(/身法\s+\d+/).first()).toBeVisible();
    await expect(page.getByText('暂无可排序的行动单位')).toHaveCount(0);
});
