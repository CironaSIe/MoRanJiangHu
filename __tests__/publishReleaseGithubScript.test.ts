import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.join(process.cwd(), 'scripts', 'publish-release-github.mjs');

describe('GitHub release publish script', () => {
    it('uploads the versioned APK asset when creating a new release', () => {
        const source = readFileSync(scriptPath, 'utf8');
        const createCommandMatch = source.match(/spawnSync\('gh', \[\s*'release', 'create'[\s\S]*?\], \{ encoding: 'utf8', timeout: 600000 \}\);/);
        const createCommand = createCommandMatch?.[0] || '';

        expect(createCommand, '未找到 gh release create 命令块，请检查 publish-release-github.mjs 的创建发布逻辑').not.toBe('');
        expect(createCommand).toContain('uploadApkPath');
        expect(createCommand).not.toContain('apkPath,');
    });
});
