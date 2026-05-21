import { chromium } from '@playwright/test';

const targetUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(targetUrl, { waitUntil: 'load' });
  const releaseClose = page.getByRole('button', { name: '关闭更新日志' });
  if (await releaseClose.count()) await releaseClose.click();

  await page.getByRole('button', { name: '云端游玩' }).click();
  await page.getByText('风险提示').waitFor({ timeout: 10000 });
  await page.getByText('云端游玩所有数据都存在云端').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: '我不用TG图床存储，我要用自己的对象存储' }).waitFor({ timeout: 10000 });

  await page.evaluate(() => {
    localStorage.setItem('moranjianghu.cloudPlay.session.v1', JSON.stringify({
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      session: {
        userId: 'CP-E2E',
        username: 'e2e-user',
        password: 'e2e-password',
        clientSalt: 'e2e-salt',
        manifestUrl: '',
        manifestUpdatedAt: ''
      }
    }));
    localStorage.setItem('moranjianghu.cloudPlay.objectStorageMode.v1', 'true');
  });

  const rawSession = await page.evaluate(() => JSON.parse(localStorage.getItem('moranjianghu.cloudPlay.session.v1') || 'null'));
  const objectStorageMode = await page.evaluate(() => localStorage.getItem('moranjianghu.cloudPlay.objectStorageMode.v1'));
  if (!rawSession?.expiresAt || rawSession.expiresAt - Date.now() < 6.9 * 24 * 60 * 60 * 1000) {
    throw new Error('TG 云端游玩登录态没有写入约 7 天有效期。');
  }
  if (objectStorageMode !== 'true') {
    throw new Error('对象存储云端游玩没有写入本地存储方式选择。');
  }

  await page.evaluate(() => {
    localStorage.setItem('moranjianghu.cloudPlay.riskAcknowledged.v1', 'true');
  });
  await page.reload({ waitUntil: 'load' });
  const releaseCloseAfterObjectReload = page.getByRole('button', { name: '关闭更新日志' });
  if (await releaseCloseAfterObjectReload.count()) await releaseCloseAfterObjectReload.click();
  await page.getByRole('button', { name: '云端游玩' }).click();
  const restoredSessionInObjectMode = await page.evaluate(() => JSON.parse(localStorage.getItem('moranjianghu.cloudPlay.session.v1') || 'null'));
  if (restoredSessionInObjectMode?.session?.username !== 'e2e-user') {
    throw new Error('切换到对象存储后不应清除 TG 图床登录态。');
  }

  await page.evaluate(() => {
    localStorage.setItem('moranjianghu.cloudPlay.riskAcknowledged.v1', 'true');
    localStorage.removeItem('moranjianghu.cloudPlay.objectStorageMode.v1');
    localStorage.setItem('moranjianghu.cloudPlay.session.v1', JSON.stringify({
      expiresAt: Date.now() - 1000,
      session: {
        userId: 'CP-OLD',
        username: 'expired',
        password: 'expired-password',
        clientSalt: 'expired-salt'
      }
    }));
  });

  await page.reload({ waitUntil: 'load' });
  const releaseCloseAfterReload = page.getByRole('button', { name: '关闭更新日志' });
  if (await releaseCloseAfterReload.count()) await releaseCloseAfterReload.click();
  await page.getByRole('button', { name: '云端游玩' }).click();
  await page.getByRole('button', { name: '登录云端' }).waitFor({ timeout: 10000 });

  console.log(JSON.stringify({
    ok: true,
    targetUrl,
    riskNotice: true,
    objectStorageButton: true,
    sevenDaySession: true,
    tgSessionSurvivesObjectStorageMode: true,
    expiredSessionReturnsToLogin: true,
    objectStorageMode: true
  }));
} finally {
  await browser.close();
}
