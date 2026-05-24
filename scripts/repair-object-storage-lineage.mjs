import crypto from 'node:crypto';

const endpoint = (process.env.MORAN_OSS_ENDPOINT || 'https://s3.hi168.com').replace(/\/+$/, '');
const bucket = process.env.MORAN_OSS_BUCKET;
const accessKey = process.env.MORAN_OSS_ACCESS_KEY;
const secretKey = process.env.MORAN_OSS_SECRET_KEY;
const region = process.env.MORAN_OSS_REGION || 'auto';
const prefix = (process.env.MORAN_OSS_PREFIX || 'MoRanJiangHu').replace(/^\/+|\/+$/g, '') || 'MoRanJiangHu';
const apply = process.argv.includes('--apply');

if (!bucket || !accessKey || !secretKey) {
    throw new Error('Missing MORAN_OSS_BUCKET, MORAN_OSS_ACCESS_KEY, or MORAN_OSS_SECRET_KEY.');
}

const readText = (value) => (typeof value === 'string' ? value.trim() : '');
const readTurn = (item) => {
    const value = Number(item?.turnCount);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
};
const readTime = (item) => {
    const savedAt = Date.parse(readText(item?.savedAt));
    if (Number.isFinite(savedAt)) return savedAt;
    const timestamp = Number(item?.saveTimestamp || 0);
    if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;
    const syncedAt = Date.parse(readText(item?.syncedAt));
    return Number.isFinite(syncedAt) ? syncedAt : 0;
};
const objectKey = (...parts) => [prefix, ...parts].filter(Boolean).join('/').replace(/\/+/g, '/');
const encodePath = (path) => path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
const sha256Hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
const buildSigningKey = (dateStamp) => hmac(hmac(hmac(hmac(Buffer.from(`AWS4${secretKey}`), dateStamp), region), 's3'), 'aws4_request');

const s3Fetch = async (method, key, body = '') => {
    const url = new URL(endpoint);
    url.pathname = [url.pathname.replace(/\/+$/, ''), encodeURIComponent(bucket), encodePath(key)]
        .filter(Boolean)
        .join('/')
        .replace(/\/+/g, '/');
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const bodyHash = sha256Hex(body);
    const headers = {
        host: url.host,
        'x-amz-content-sha256': bodyHash,
        'x-amz-date': amzDate
    };
    if (method !== 'GET') headers['content-type'] = 'application/json; charset=utf-8';
    const signedHeaderNames = Object.keys(headers).sort();
    const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers[name]}\n`).join('');
    const signedHeaders = signedHeaderNames.join(';');
    const canonicalRequest = [method, url.pathname, '', canonicalHeaders, signedHeaders, bodyHash].join('\n');
    const scope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
    const signature = crypto.createHmac('sha256', buildSigningKey(dateStamp)).update(stringToSign).digest('hex');
    const response = await fetch(url, {
        method,
        headers: {
            ...headers,
            authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
        },
        body: method === 'GET' ? undefined : body
    });
    if (!response.ok) {
        throw new Error(`${method} ${key} failed: ${response.status} ${await response.text()}`);
    }
    return response;
};

const summarize = (saves) => {
    const groups = new Map();
    for (const item of saves) {
        const key = readText(item.seriesId) || `legacy:${readText(item.title) || 'unknown'}`;
        groups.set(key, [...(groups.get(key) || []), item]);
    }
    const rows = [];
    let invalidNewRoots = 0;
    let missingParents = 0;
    for (const [key, items] of groups) {
        const hashes = new Set(items.map((item) => readText(item.hash)).filter(Boolean));
        const roots = items.filter((item) => {
            const parentHash = readText(item.parentHash);
            return !parentHash || !hashes.has(parentHash);
        });
        const turns = items.map(readTurn).filter((value) => value !== null);
        const isNew = Boolean(readText(items[0]?.seriesId));
        const badRoots = isNew ? roots.filter((item) => readTurn(item) !== 0) : [];
        invalidNewRoots += badRoots.length;
        missingParents += items.filter((item) => {
            const parentHash = readText(item.parentHash);
            return parentHash && !hashes.has(parentHash);
        }).length;
        rows.push({
            key,
            title: readText(items[0]?.title),
            count: items.length,
            turns: turns.length ? `${Math.min(...turns)}..${Math.max(...turns)}` : 'null',
            roots: roots.length,
            rootTurns: roots.map((item) => readTurn(item)),
            missingParents: items.filter((item) => {
                const parentHash = readText(item.parentHash);
                return parentHash && !hashes.has(parentHash);
            }).length,
            invalidNewRoots: badRoots.length
        });
    }
    rows.sort((a, b) => b.invalidNewRoots - a.invalidNewRoots || b.count - a.count || a.key.localeCompare(b.key));
    return {
        total: saves.length,
        series: groups.size,
        invalidNewRoots,
        missingParents,
        rows
    };
};

const repairManifest = (manifest) => {
    const next = JSON.parse(JSON.stringify(manifest));
    const saves = Array.isArray(next.saves) ? next.saves : [];
    const byHash = new Map(saves.map((item) => [readText(item.hash), item]).filter(([hash]) => hash));
    const bySeries = new Map();
    for (const item of saves) {
        const seriesId = readText(item.seriesId);
        if (!seriesId) continue;
        bySeries.set(seriesId, [...(bySeries.get(seriesId) || []), item]);
    }
    const invalidSeriesIds = new Set();
    for (const [seriesId, items] of bySeries) {
        const hashes = new Set(items.map((item) => readText(item.hash)).filter(Boolean));
        const roots = items.filter((item) => {
            const parentHash = readText(item.parentHash);
            return !parentHash || !hashes.has(parentHash);
        });
        const hasInvalidRoot = roots.some((item) => readTurn(item) !== 0);
        const hasMissingParent = items.some((item) => {
            const parentHash = readText(item.parentHash);
            return parentHash && !hashes.has(parentHash);
        });
        if (hasInvalidRoot || hasMissingParent) invalidSeriesIds.add(seriesId);
    }

    const continuation = saves.filter((item) => {
        const seriesId = readText(item.seriesId);
        if (!seriesId || !invalidSeriesIds.has(seriesId)) return false;
        if (readText(item.branchInput) === '开局') return false;
        const turn = readTurn(item);
        const parentHash = readText(item.parentHash);
        const hasParent = parentHash && byHash.has(parentHash);
        return turn !== 0 || !hasParent;
    });

    const referencedLegacyRoots = [];
    const referencedRootHashes = new Set(continuation.map((item) => readText(item.rootHash)).filter(Boolean));
    for (const hash of referencedRootHashes) {
        const item = byHash.get(hash);
        if (item && !readText(item.seriesId)) referencedLegacyRoots.push(item);
    }

    const repairedNodes = Array.from(new Map([...referencedLegacyRoots, ...continuation].map((item) => [readText(item.hash), item])).values())
        .sort((a, b) => readTime(a) - readTime(b));
    const rootHash = readText(repairedNodes[0]?.hash);
    const repairedSeriesId = continuation.length
        ? `series-recovered-${rootHash.slice(0, 16) || readText(continuation[0]?.rootHash || continuation[0]?.hash).slice(0, 16)}`
        : '';
    repairedNodes.forEach((item, index) => {
        item.seriesId = repairedSeriesId;
        item.rootHash = rootHash;
        item.parentHash = index === 0 ? '' : readText(repairedNodes[index - 1].hash);
        item.lineageDepth = index;
        item.turnCount = index;
        item.branchInput = index === 0 ? '开局' : (readText(item.branchInput) || '继续游玩');
    });

    for (const item of saves) {
        if (!readText(item.seriesId)) continue;
        if (readText(item.branchInput) !== '开局') continue;
        const parentHash = readText(item.parentHash);
        const turn = readTurn(item);
        if (!parentHash && turn !== 0) {
            item.turnCount = 0;
            item.rootHash = readText(item.hash);
            item.lineageDepth = 0;
        }
    }

    next.updatedAt = new Date().toISOString();
    return {
        manifest: next,
        repairedSeriesId,
        repairedNodeCount: repairedNodes.length,
        repairedRootHash: rootHash
    };
};

const manifestKey = objectKey('manifest.json');
const manifest = await (await s3Fetch('GET', manifestKey)).json();
const before = summarize(manifest.saves || []);
const repaired = repairManifest(manifest);
const after = summarize(repaired.manifest.saves || []);

const report = {
    mode: apply ? 'apply' : 'dry-run',
    backupKey: null,
    repairedSeriesId: repaired.repairedSeriesId,
    repairedRootHash: repaired.repairedRootHash,
    repairedNodeCount: repaired.repairedNodeCount,
    before: {
        total: before.total,
        series: before.series,
        invalidNewRoots: before.invalidNewRoots,
        missingParents: before.missingParents,
        topRows: before.rows.slice(0, 12)
    },
    after: {
        total: after.total,
        series: after.series,
        invalidNewRoots: after.invalidNewRoots,
        missingParents: after.missingParents,
        topRows: after.rows.slice(0, 12)
    }
};

if (apply) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const backupKey = objectKey('manifest-backups', `manifest-before-lineage-repair-${stamp}.json`);
    report.backupKey = backupKey;
    await s3Fetch('PUT', backupKey, JSON.stringify(manifest, null, 2));
    await s3Fetch('PUT', manifestKey, JSON.stringify(repaired.manifest, null, 2));
}

console.log(JSON.stringify(report, null, 2));
