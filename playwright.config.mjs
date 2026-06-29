import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['tests/**/*.spec.mjs', 'e2e/**/*.pw.mjs'],
  testIgnore: ['**/fixtures/**', '**/e2e-current.spec.mjs'],
  fullyParallel: false,
  reporter: 'line',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
