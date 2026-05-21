import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.MORAN_JUDGMENT_E2E_PORT || 4184);
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
        const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.setContent([
            '<!doctype html>',
            '<html><head><meta charset="utf-8" /></head>',
            '<body><div id="root"></div><script type="module" src="/tests/fixtures/judgment-render-harness.jsx"></script></body></html>'
        ].join(''), { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.body.dataset.e2eReady === 'true', null, { timeout: 30_000 });
        await page.waitForSelector('[data-judgment-card="true"]', { timeout: 30_000 });

        const result = await page.evaluate(() => {
            const judgmentCards = Array.from(document.querySelectorAll('[data-judgment-card="true"]'));
            const narratorBlocks = Array.from(document.querySelectorAll('.narrator-renderer'));
            const leakedBody = '杨培强翻开账册，一目十行。';
            return {
                judgmentCardCount: judgmentCards.length,
                narratorBlockCount: narratorBlocks.length,
                judgmentText: judgmentCards.map((node) => node.textContent || '').join('\n'),
                narratorText: narratorBlocks.map((node) => node.textContent || '').join('\n'),
                leakedBodyInsideJudgment: judgmentCards.some((node) => (node.textContent || '').includes(leakedBody)),
                leakedBodyInsideNarrator: narratorBlocks.some((node) => (node.textContent || '').includes(leakedBody))
            };
        });

        if (
            result.judgmentCardCount !== 1
            || result.narratorBlockCount < 2
            || result.leakedBodyInsideJudgment
            || !result.leakedBodyInsideNarrator
            || !result.judgmentText.includes('成功')
            || !result.judgmentText.includes('洞察')
        ) {
            throw new Error(`Judgment render E2E failed: ${JSON.stringify(result, null, 2)}`);
        }

        console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    } finally {
        if (browser) await browser.close().catch(() => undefined);
        await server.close().catch(() => undefined);
    }
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
