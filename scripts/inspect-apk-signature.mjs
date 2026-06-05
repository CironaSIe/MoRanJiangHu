import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultApkPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const expectedReleaseCertSha256 = '0c638692591300750ccc17cb828b5223bb9a5ef333095714377a6cd5adcbe48c';

const args = process.argv.slice(2);
const apkPathArg = args.find((arg) => !arg.startsWith('--'));
const expectedArg = args.find((arg) => arg.startsWith('--expected-cert-sha256='));
const expectedCertSha256 = String(
  expectedArg?.split('=').slice(1).join('=') ||
  process.env.MORAN_EXPECTED_APK_CERT_SHA256 ||
  expectedReleaseCertSha256
).replace(/[^a-f0-9]/gi, '').toLowerCase();
const apkPath = path.resolve(apkPathArg || defaultApkPath);

if (!fs.existsSync(apkPath)) {
  throw new Error(`APK not found: ${apkPath}`);
}

const executableExists = (filePath) => {
  try {
    return Boolean(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

const latestApksignerFromSdk = () => {
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === 'win32' ? path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk') : '',
    process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Android', 'sdk') : '',
    process.platform !== 'win32' && process.platform !== 'darwin' ? path.join(os.homedir(), 'Android', 'Sdk') : ''
  ].filter(Boolean);
  const executableName = process.platform === 'win32' ? 'apksigner.bat' : 'apksigner';

  for (const sdkRoot of sdkRoots) {
    const buildToolsDir = path.join(sdkRoot, 'build-tools');
    if (!fs.existsSync(buildToolsDir)) continue;
    const candidates = fs.readdirSync(buildToolsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(buildToolsDir, entry.name, executableName))
      .filter(executableExists)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    if (candidates[0]) return candidates[0];
  }
  return '';
};

const apksignerPath = process.env.APKSIGNER_PATH || latestApksignerFromSdk() || 'apksigner';
const apksignerArgs = ['verify', '--verbose', '--print-certs', apkPath];
const javaExecutable = process.env.JAVA_EXECUTABLE || 'java';
const apksignerJar = apksignerPath.toLowerCase().endsWith('.bat')
  ? path.join(path.dirname(apksignerPath), 'lib', 'apksigner.jar')
  : '';
const useApksignerJar = executableExists(apksignerJar);
const command = useApksignerJar ? javaExecutable : apksignerPath;
const commandArgs = useApksignerJar ? ['-jar', apksignerJar, ...apksignerArgs] : apksignerArgs;
const result = spawnSync(command, commandArgs, {
  cwd: rootDir,
  encoding: 'utf8',
  env: {
    ...process.env,
    PATH: process.env.PATH || process.env.Path || '',
    Path: process.env.Path || process.env.PATH || ''
  },
  timeout: Number(process.env.MORAN_APKSIGNER_TIMEOUT_MS || 60 * 1000)
});

if (result.error) {
  throw result.error;
}

const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
const certificateSha256Matches = Array.from(
  combinedOutput.matchAll(/Signer #(\d+) certificate SHA-256 digest:\s*([a-f0-9:]+)/gi)
).map((match) => ({
  signer: Number(match[1]),
  sha256: match[2].replace(/:/g, '').toLowerCase()
}));
const signerSchemes = {
  v1: /Verified using v1 scheme \(JAR signing\):\s*true/i.test(combinedOutput),
  v2: /Verified using v2 scheme \(APK Signature Scheme v2\):\s*true/i.test(combinedOutput),
  v3: /Verified using v3 scheme \(APK Signature Scheme v3\):\s*true/i.test(combinedOutput),
  v4: /Verified using v4 scheme \(APK Signature Scheme v4\):\s*true/i.test(combinedOutput)
};
const certificateSha256 = certificateSha256Matches[0]?.sha256 || '';
const matchesExpectedCert = Boolean(expectedCertSha256 && certificateSha256 === expectedCertSha256);
const payload = {
  ok: result.status === 0 && certificateSha256Matches.length > 0,
  apkPath,
  apksignerPath,
  verified: result.status === 0,
  signerSchemes,
  certificateSha256,
  certificateSha256Matches,
  expectedCertSha256,
  matchesExpectedCert
};

console.log(JSON.stringify(payload, null, 2));

if (result.status !== 0 || !payload.ok || (expectedCertSha256 && !matchesExpectedCert)) {
  process.exitCode = 1;
}
