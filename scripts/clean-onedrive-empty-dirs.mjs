// Fast-delete all moranjianghu N directories from OneDrive root via OpenList API
import process from 'node:process';

const AUTH_TOKEN = process.env.MORAN_OPENLIST_AUTH_TOKEN || '';
const BASE_URL = (process.env.MORAN_OPENLIST_BASE_URL || 'https://openlist.bacon.de5.net').replace(/\/+$/, '');
const ROOT_PATH = '/Onedrive';
const PER_PAGE = 200;
const BATCH_SIZE = 20;

if (!AUTH_TOKEN) {
  console.error('MORAN_OPENLIST_AUTH_TOKEN not set');
  process.exit(1);
}

const headers = {
  'Authorization': AUTH_TOKEN,
  'Content-Type': 'application/json',
};

async function listDir(path, page = 1) {
  const resp = await fetch(`${BASE_URL}/api/fs/list`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ path, password: '', page, per_page: PER_PAGE, refresh: false }),
  });
  if (!resp.ok) throw new Error(`list failed: ${resp.status}`);
  return resp.json();
}

async function removeDir(parentPath, name) {
  const resp = await fetch(`${BASE_URL}/api/fs/remove`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ dir: parentPath, names: [name] }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`remove ${name} failed: ${resp.status} ${text.slice(0, 100)}`);
  }
  return resp.json();
}

async function collectAllTargetDirs() {
  const allDirs = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const json = await listDir(ROOT_PATH, page);
    const total = json?.data?.total || 0;
    const items = json?.data?.content || [];
    totalPages = Math.ceil(total / PER_PAGE);

    for (const item of items) {
      if (item.is_dir && /^moranjianghu\s+\d+$/i.test(item.name)) {
        allDirs.push(item.name);
      }
    }

    if (page === 1) console.log(`Root: ${total} items, ${totalPages} pages`);
    page++;
  }

  return allDirs;
}

async function main() {
  console.log('Collecting moranjianghu N directories...');
  const targets = await collectAllTargetDirs();
  console.log(`Found ${targets.length} directories to delete`);

  let deleted = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(name => removeDir(ROOT_PATH, name))
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        deleted++;
      } else {
        failed++;
        failures.push(`${batch[j]}: ${results[j].reason?.message || 'unknown'}`);
      }
    }

    console.log(`  Progress: ${deleted} deleted, ${failed} failed (of ${i + batch.length}/${targets.length})`);
  }

  console.log(`\nDone: ${deleted} deleted, ${failed} failed.`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const f of failures.slice(0, 10)) console.log(`  ${f}`);
    if (failures.length > 10) console.log(`  ... and ${failures.length - 10} more`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
