import { test, expect } from '@playwright/test';

const adminUrl = process.env.ADMIN_TEST_BASE || 'http://127.0.0.1:4173/admin/online.html';

const mockPayload = {
  success: true,
  serverTime: '2026-05-16T08:20:00.000Z',
  onlineCount: 1,
  totalRecentCount: 2,
  ttlSeconds: 120,
  users: [
    {
      id: '11.6.148.57',
      ip: '11.6.148.57',
      online: true,
      country: 'CN',
      region: 'Zhejiang',
      city: 'Hangzhou',
      colo: 'SJC',
      timezone: 'Asia/Shanghai',
      firstSeenAt: '2026-05-16T08:05:00.000Z',
      lastSeenAt: '2026-05-16T08:19:45.000Z',
      sessionCount: 2,
      heartbeatCount: 64,
      versionName: '1.0.177',
      versionCode: 178,
      platform: 'web',
      paths: ['/'],
      userAgents: ['Mozilla/5.0 Admin Layout E2E'],
      imageStats: {
        localImageAssets: 5,
        localImageBytes: 3145728,
        remoteImageAssets: 7,
        migrationStatus: {
          stage: 'running',
          totalAssets: 10,
          processedAssets: 6,
          migratedAssets: 6,
          failedAssets: 0
        }
      }
    }
  ],
  recentUsers: [
    {
      id: '11.6.148.57',
      ip: '11.6.148.57',
      online: true,
      country: 'CN',
      region: 'Zhejiang',
      city: 'Hangzhou',
      colo: 'SJC',
      timezone: 'Asia/Shanghai',
      firstSeenAt: '2026-05-16T08:05:00.000Z',
      lastSeenAt: '2026-05-16T08:19:45.000Z',
      sessionCount: 2,
      heartbeatCount: 64,
      versionName: '1.0.177',
      versionCode: 178,
      platform: 'web',
      paths: ['/'],
      userAgents: ['Mozilla/5.0 Admin Layout E2E'],
      imageStats: {
        localImageAssets: 5,
        localImageBytes: 3145728,
        remoteImageAssets: 7,
        migrationStatus: {
          stage: 'running',
          totalAssets: 10,
          processedAssets: 6,
          migratedAssets: 6,
          failedAssets: 0
        }
      }
    },
    {
      id: '10.4.194.87',
      ip: '10.4.194.87',
      online: false,
      country: 'US',
      region: 'California',
      city: 'Los Angeles',
      colo: 'LAX',
      timezone: 'America/Los_Angeles',
      firstSeenAt: '2026-05-16T07:50:00.000Z',
      lastSeenAt: '2026-05-16T08:00:00.000Z',
      sessionCount: 1,
      heartbeatCount: 12,
      versionName: '1.0.176',
      versionCode: 177,
      platform: 'web',
      paths: ['/game'],
      userAgents: ['Mozilla/5.0 Offline User'],
      imageStats: {
        localImageAssets: 0,
        localImageBytes: 0,
        remoteImageAssets: 4,
        migrationStatus: {
          stage: 'completed',
          totalAssets: 4,
          processedAssets: 4,
          migratedAssets: 4,
          failedAssets: 0
        }
      }
    }
  ]
};

test('online admin table is readable and can filter to online users', async ({ page }) => {
  await page.route('**/api/admin/online', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(mockPayload)
    });
  });

  await page.goto(adminUrl);
  await page.getByLabel('管理密码').fill('Ypq159951@');
  await page.getByRole('button', { name: '进入管理页' }).click();

  await expect(page.getByRole('heading', { name: '在线用户监控' }).last()).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '本地图片' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '远程图片' })).toBeVisible();
  await expect(page.getByText('中国 · 浙江 · 杭州')).toBeVisible();
  await expect(page.getByText('节点：SJC')).toBeVisible();
  await expect(page.getByText('美国 · 加利福尼亚 · 洛杉矶')).toBeVisible();
  await expect(page.getByText('路径：')).toHaveCount(0);
  await expect(page.locator('#sessionRows tr')).toHaveCount(2);

  await page.getByLabel('只看在线').check();
  await expect(page.locator('#sessionRows tr')).toHaveCount(1);
  await expect(page.getByText('10.4.194.87')).toHaveCount(0);
});
