import { chromium } from 'playwright';

const targetUrl = process.argv[2] || 'http://127.0.0.1:4173/';
const expectedVersion = process.argv[3] || '';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });

try {
  await page.route('**/api/apk/latest.apk**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="MoRanJiangHu-e2e.apk"',
        'Cache-Control': 'no-store'
      },
      body: Buffer.from('fake apk payload for download e2e')
    });
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2_000);

  const bodyText = await page.locator('body').innerText({ timeout: 15_000 });
  if (expectedVersion && !bodyText.includes(expectedVersion)) {
    throw new Error(`首页未显示预期版本 ${expectedVersion}`);
  }

  const closeButton = page.getByRole('button', { name: '关闭更新日志', exact: true });
  if (await closeButton.count()) {
    await closeButton.click({ timeout: 10_000 });
  } else {
    const fallbackCloseButton = page.getByRole('button', { name: '×', exact: true });
    if (await fallbackCloseButton.count()) {
      await fallbackCloseButton.click({ timeout: 10_000 });
    }
  }

  const downloadButton = page.getByRole('button', { name: 'APK 下载', exact: true });
  await downloadButton.waitFor({ state: 'visible', timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await downloadButton.click();
  const download = await downloadPromise;
  if (/latest\.apk/i.test(page.url())) {
    throw new Error(`点击 APK 下载后页面发生跳转：${page.url()}`);
  }
  const suggestedFilename = download.suggestedFilename();
  if (!/\.apk$/i.test(suggestedFilename)) {
    throw new Error(`下载文件名不是 APK：${suggestedFilename}`);
  }

  console.log(JSON.stringify({
    ok: true,
    targetUrl,
    suggestedFilename,
    finalUrl: page.url()
  }, null, 2));
} finally {
  await browser.close();
}
