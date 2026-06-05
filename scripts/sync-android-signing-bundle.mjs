import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const action = process.argv[2] || '';
const releaseInfo = JSON.parse(fs.readFileSync(path.join(rootDir, 'release.config.json'), 'utf8'));

const readEnv = (name, fallback = '') => String(process.env[name] || fallback).trim();
const endpoint = readEnv('MORAN_OSS_ENDPOINT', 'https://s3.hi168.com').replace(/\/+$/, '');
const bucket = readEnv('MORAN_OSS_BUCKET');
const accessKey = readEnv('MORAN_OSS_ACCESS_KEY');
const secretKey = readEnv('MORAN_OSS_SECRET_KEY');
const region = readEnv('MORAN_OSS_REGION', 'auto');
const prefix = readEnv('MORAN_OSS_RELEASE_PREFIX', releaseInfo.r2Prefix || 'moranjianghu').replace(/^\/+|\/+$/g, '');
const objectKey = readEnv('MORAN_SIGNING_BUNDLE_KEY', `${prefix}/private/android-signing-bundle.v1.json.enc`);
const requestTimeoutMs = Math.max(1000, Number(process.env.MORAN_OSS_TIMEOUT_MS || 2 * 60 * 1000));
const passphrase = readEnv('MORAN_SIGNING_BUNDLE_PASSPHRASE') || secretKey;
const service = 's3';

const signingFiles = [
  'android/keystore.properties',
  'android/app/moranjianghu-release.jks'
];

if (!bucket || !accessKey || !secretKey) {
  throw new Error('Missing MORAN_OSS_BUCKET, MORAN_OSS_ACCESS_KEY, or MORAN_OSS_SECRET_KEY.');
}
if (!passphrase) {
  throw new Error('Missing MORAN_SIGNING_BUNDLE_PASSPHRASE or MORAN_OSS_SECRET_KEY.');
}

const normalizeKey = (key) => key.replace(/^\/+/, '').replace(/\/+/g, '/');
const encodeKey = (key) => normalizeKey(key).split('/').map((part) => encodeURIComponent(part)).join('/');
const objectUrl = (key) => new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodeKey(key)}`);
const sha256Hex = (body) => crypto.createHash('sha256').update(body).digest('hex');
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();
const hmacHex = (key, value) => crypto.createHmac('sha256', key).update(value).digest('hex');
const formatAmzDate = (date) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
};
const signingKey = (dateStamp) => {
  const kDate = hmac(Buffer.from(`AWS4${secretKey}`, 'utf8'), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
};

const buildSignedHeaders = ({ method, url, body, contentType }) => {
  const { amzDate, dateStamp } = formatAmzDate(new Date());
  const bodyHash = sha256Hex(body);
  const query = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const canonicalHeaders = [
    `content-type:${contentType}\n`,
    `host:${url.host}\n`,
    `x-amz-content-sha256:${bodyHash}\n`,
    `x-amz-date:${amzDate}\n`
  ].join('');
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, url.pathname, query, canonicalHeaders, signedHeaders, bodyHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
  const signature = hmacHex(signingKey(dateStamp), stringToSign);
  return {
    'Content-Type': contentType,
    'X-Amz-Content-Sha256': bodyHash,
    'X-Amz-Date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
};

const requestWithBody = ({ method, url, headers, body }) => new Promise((resolve, reject) => {
  const transport = url.protocol === 'http:' ? http : https;
  const request = transport.request(url, {
    method,
    headers: { ...headers, 'Content-Length': body.byteLength },
    timeout: requestTimeoutMs
  }, (response) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const bytes = Buffer.concat(chunks);
      resolve({
        status: response.statusCode || 0,
        ok: (response.statusCode || 0) >= 200 && (response.statusCode || 0) < 300,
        headers: response.headers,
        bytes,
        text: bytes.toString('utf8')
      });
    });
  });
  request.on('timeout', () => request.destroy(new Error(`Request timed out after ${requestTimeoutMs}ms`)));
  request.on('error', reject);
  request.end(body);
});

const putObject = async (key, bytes) => {
  const url = objectUrl(key);
  const response = await requestWithBody({
    method: 'PUT',
    url,
    headers: buildSignedHeaders({ method: 'PUT', url, body: bytes, contentType: 'application/json' }),
    body: bytes
  });
  if (!response.ok) {
    throw new Error(`PUT ${key} failed (${response.status}): ${response.text.slice(0, 500)}`);
  }
};

const getObject = async (key) => {
  const url = objectUrl(key);
  const body = Buffer.alloc(0);
  const response = await requestWithBody({
    method: 'GET',
    url,
    headers: buildSignedHeaders({ method: 'GET', url, body, contentType: 'application/json' }),
    body
  });
  if (!response.ok) {
    throw new Error(`GET ${key} failed (${response.status}): ${response.text.slice(0, 500)}`);
  }
  return response.bytes;
};

const deriveEncryptionKey = (salt) => crypto.scryptSync(passphrase, salt, 32, {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
});

const encryptBundle = (payload) => {
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveEncryptionKey(salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    format: 'moran-android-signing-bundle',
    version: 1,
    encryptedAt: new Date().toISOString(),
    algorithm: 'aes-256-gcm',
    kdf: { name: 'scrypt', N: 32768, r: 8, p: 1, salt: salt.toString('base64') },
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64')
  };
};

const decryptBundle = (envelope) => {
  if (envelope?.format !== 'moran-android-signing-bundle' || envelope?.version !== 1) {
    throw new Error('Signing bundle format is not supported.');
  }
  const salt = Buffer.from(envelope.kdf?.salt || '', 'base64');
  const iv = Buffer.from(envelope.iv || '', 'base64');
  const tag = Buffer.from(envelope.tag || '', 'base64');
  const ciphertext = Buffer.from(envelope.ciphertext || '', 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveEncryptionKey(salt), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
};

const collectSigningFiles = () => signingFiles.map((relativePath) => {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Signing file not found: ${relativePath}`);
  }
  const bytes = fs.readFileSync(absolutePath);
  return {
    path: relativePath.replace(/\\/g, '/'),
    mode: relativePath.endsWith('.jks') ? 0o600 : 0o600,
    sha256: sha256Hex(bytes),
    base64: bytes.toString('base64')
  };
});

const upload = async () => {
  const payload = {
    createdAt: new Date().toISOString(),
    files: collectSigningFiles()
  };
  const envelope = encryptBundle(payload);
  const bytes = Buffer.from(`${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await putObject(objectKey, bytes);
  console.log(JSON.stringify({
    ok: true,
    action: 'upload',
    key: objectKey,
    files: payload.files.map((file) => ({ path: file.path, sha256: file.sha256 })),
    encryptedSha256: sha256Hex(bytes)
  }, null, 2));
};

const restore = async () => {
  const bytes = await getObject(objectKey);
  const envelope = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  const payload = decryptBundle(envelope);
  for (const file of payload.files || []) {
    if (!signingFiles.includes(file.path)) {
      throw new Error(`Unexpected signing file in bundle: ${file.path}`);
    }
    const target = path.join(rootDir, file.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const fileBytes = Buffer.from(file.base64, 'base64');
    if (sha256Hex(fileBytes) !== file.sha256) {
      throw new Error(`Restored file hash mismatch: ${file.path}`);
    }
    fs.writeFileSync(target, fileBytes, { mode: file.mode || 0o600 });
    try {
      fs.chmodSync(target, file.mode || 0o600);
    } catch {
      // Windows may ignore POSIX modes.
    }
  }
  console.log(JSON.stringify({
    ok: true,
    action: 'restore',
    key: objectKey,
    files: (payload.files || []).map((file) => ({ path: file.path, sha256: file.sha256 }))
  }, null, 2));
};

if (action === 'upload') {
  await upload();
} else if (action === 'restore') {
  await restore();
} else {
  throw new Error('Usage: node scripts/sync-android-signing-bundle.mjs <upload|restore>');
}
