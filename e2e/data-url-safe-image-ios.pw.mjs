import { test, expect, webkit } from '@playwright/test';

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

test('iPhone WebKit renders large base64 images through Blob URL preview path', async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  await page.setContent(`
    <!doctype html>
    <html>
      <body>
        <img id="preview" alt="large base64 preview" />
        <script>
          const threshold = 512 * 1024;
          const repeatedPayload = '${tinyPngBase64}'.repeat(Math.ceil(threshold / ${tinyPngBase64.length}) + 1);
          const dataUrl = 'data:image/png;base64,${tinyPngBase64}';
          const oversizedDataUrl = 'data:image/png;base64,' + repeatedPayload;
          window.__originalLength = oversizedDataUrl.length;

          const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
          window.__objectUrl = objectUrl;
          document.getElementById('preview').src = objectUrl;
        </script>
      </body>
    </html>
  `);

  const image = page.locator('#preview');
  await expect.poll(async () => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveJSProperty('naturalWidth', 1);
  await expect(image).toHaveJSProperty('naturalHeight', 1);
  await expect.poll(async () => page.evaluate(() => window.__objectUrl.startsWith('blob:'))).toBe(true);
  await expect.poll(async () => page.evaluate(() => window.__originalLength > 512 * 1024)).toBe(true);

  await browser.close();
});
