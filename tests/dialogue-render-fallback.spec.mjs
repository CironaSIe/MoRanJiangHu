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
            await button.click({ timeout: 3000 });
            return true;
        }
        const locator = page.getByText(text, { exact: false }).first();
        if (await locator.count() && await locator.isVisible().catch(() => false)) {
            await locator.click({ timeout: 3000 });
            return true;
        }
    }
    return false;
};

const makeDialogueFallbackSave = () => {
    const save = structuredClone(baseSave);
    save.id = 'dialogue-render-fallback';
    save.元数据 = {
        ...(save.元数据 || {}),
        名称: '对话框兜底测试'
    };
    save.历史记录 = [
        {
            role: 'user',
            content: '端到端检查对话框兜底'
        },
        {
            role: 'assistant',
            content: 'Structured Response',
            structuredResponse: {
                logs: [
                    {
                        sender: '杨培强',
                        text: '“弟子，领命。”\n\n风，渐渐停了。\n\n铅灰色的云层开始散去。'
                    },
                    {
                        sender: '众人齐声',
                        text: '“遵命！”'
                    },
                    {
                        sender: '杨青儿',
                        text: '“哥，小心些。”'
                    }
                ],
                shortTerm: '端到端检查对话框兜底。'
            }
        }
    ];
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
    }, makeDialogueFallbackSave());
    await page.reload({ waitUntil: 'networkidle' });
};

test('角色对话框只渲染完整引号对白，串入叙事会回落为旁白', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
        localStorage.setItem('moranjianghu.releaseNotesSuppressDate', new Date().toISOString().slice(0, 10));
    });

    await injectSaveAndReload(page);
    await clickByTexts(page, ['重入江湖', '读取进度', '继续游戏', '读取', '载入']);
    await page.waitForTimeout(700);
    await clickByTexts(page, ['对话框兜底测试', 'dialogue-render-fallback', '手动快照']);
    await page.waitForTimeout(300);
    await clickByTexts(page, ['加载此存档', '读取此存档', '载入存档', '确认读取', '读取', '进入江湖']);

    await expect(page.locator('.chat-character-name', { hasText: '杨培强' })).toHaveCount(1, { timeout: 10000 });
    await expect(page.locator('.chat-character-name', { hasText: '杨青儿' })).toHaveCount(1);
    await expect(page.locator('.chat-character-name', { hasText: '众人齐声' })).toHaveCount(0);

    const firstBubbleText = await page.locator('.chat-character-name', { hasText: '杨培强' })
        .locator('xpath=ancestor::div[contains(@class,"flex-col")]/following-sibling::div[1]')
        .first()
        .innerText();
    expect(firstBubbleText.trim()).toBe('“弟子，领命。”');

    const narratorText = await page.locator('.narrator-renderer').allInnerTexts();
    expect(narratorText.join('\n')).toContain('风，渐渐停了。');
    expect(narratorText.join('\n')).toContain('铅灰色的云层开始散去。');
    expect(narratorText.join('\n')).toContain('“遵命！”');
});
