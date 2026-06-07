import { test, expect } from '@playwright/test';
import { __测试__构建图片端点 } from '../services/ai/imageTasks.ts';

test('APK NovelAI proxy URL uses deployed API and live proxy does not return HTML fallback', async ({ request }) => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    Capacitor: {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
    },
    location: {
      protocol: 'https:',
      hostname: 'localhost',
      origin: 'https://localhost',
    },
  };

  let endpoint;
  try {
    endpoint = __测试__构建图片端点('https://image.novelai.net', '/ai/generate-image');
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }

  expect(endpoint).toMatch(/^https:\/\/.+\/api\/novelai\/ai\/generate-image$/);
  expect(endpoint).not.toContain('localhost');

  const proxyRouteProbe = 'https://msjh.bacon159.pp.ua/api/novelai/unsupported-probe';
  const response = await request.fetch(proxyRouteProbe, {
    method: 'OPTIONS',
    headers: {
      Accept: 'application/json',
    },
    timeout: 30000,
  });
  const contentType = response.headers()['content-type'] || '';
  const text = await response.text();

  expect(contentType.toLowerCase()).not.toContain('text/html');
  expect(text.trim().slice(0, 80).toLowerCase()).not.toContain('<!doctype html');
  expect(response.status()).toBe(204);
});
