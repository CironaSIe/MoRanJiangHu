import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.join(process.cwd(), 'scripts', 'publish-release-github.mjs');

describe('GitHub release publish script', () => {
    it('uploads the versioned APK asset when creating a new release', () => {
        const source = readFileSync(scriptPath, 'utf8');
        const createStart = source.indexOf("spawnSync('gh', [\n    'release', 'create'");
        const createEnd = source.indexOf("], { encoding: 'utf8', timeout: 600000 });", createStart);
        const createCommand = source.slice(createStart, createEnd);

        expect(createStart).toBeGreaterThanOrEqual(0);
        expect(createEnd).toBeGreaterThan(createStart);
        expect(createCommand).toContain('uploadApkPath');
        expect(createCommand).not.toContain('apkPath,');
    });
});
