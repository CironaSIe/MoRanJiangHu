import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(rootDir, 'android');
const task = process.argv[2] || 'assembleRelease';
const extraArgs = process.argv.slice(3);
const isWindows = process.platform === 'win32';
const gradleWrapper = isWindows ? 'gradlew.bat' : './gradlew';
const gradlePath = path.join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(gradlePath)) {
  throw new Error(`Gradle wrapper not found: ${gradlePath}`);
}

if (!isWindows) {
  try {
    fs.chmodSync(gradlePath, 0o755);
  } catch (error) {
    console.warn(`Unable to chmod android/gradlew; continuing: ${error?.message || error}`);
  }
}

const result = spawnSync(gradleWrapper, [task, ...extraArgs], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWindows
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
