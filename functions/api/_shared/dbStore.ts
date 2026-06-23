// D1-backed storage that mimics the R2 bucket API surface.
// Existing code that calls bucket.get/put/list/delete works unchanged
// after swapping getBucket(env) → getDbBucket(env, 'table_name').

export type R2LikeBucket = {
    get: (key: string) => Promise<R2LikeObject | null>;
    put: (key: string, value: any, options?: any) => Promise<void>;
    list: (options: { prefix?: string; cursor?: string; limit?: number }) => Promise<R2LikeListResult>;
    delete: (key: string) => Promise<void>;
};

export type R2LikeObject = {
    key: string;
    json: <T = any>() => Promise<T>;
    text: () => Promise<string>;
    body: ReadableStream | null;
    size: number;
};

export type R2LikeListResult = {
    objects: R2LikeObject[];
    truncated: boolean;
    cursor?: string;
};

/**
 * Creates a D1 table for key-value storage if it doesn't exist.
 * Must be called once per table before first use.
 */
export const ensureTable = async (db: any, tableName: string): Promise<void> => {
    await db.prepare(
        `CREATE TABLE IF NOT EXISTS ${tableName} (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`
    ).run();
};

/**
 * Returns an R2-like bucket backed by D1.
 * Drop-in replacement for getBucket(env) in existing feature code.
 */
export const getDbBucket = (db: any, tableName: string): R2LikeBucket => {
    return {
        get: async (key: string): Promise<R2LikeObject | null> => {
            await ensureTable(db, tableName);
            const row: any = await db.prepare(
                `SELECT key, value FROM ${tableName} WHERE key = ?`
            ).bind(key).first();
            if (!row) return null;
            const raw = row.value || '';
            return {
                key: row.key,
                json: async <T = any>(): Promise<T> => JSON.parse(raw),
                text: async (): Promise<string> => raw,
                body: null,
                size: new TextEncoder().encode(raw).length
            };
        },

        put: async (key: string, value: any, _options?: any): Promise<void> => {
            await ensureTable(db, tableName);
            const json = typeof value === 'string' ? value : JSON.stringify(value);
            await db.prepare(
                `INSERT OR REPLACE INTO ${tableName} (key, value, updated_at) VALUES (?, ?, ?)`
            ).bind(key, json, new Date().toISOString()).run();
        },

        list: async (options: { prefix?: string; cursor?: string; limit?: number }): Promise<R2LikeListResult> => {
            await ensureTable(db, tableName);
            const prefix = options.prefix || '';
            const limit = Math.min(1000, Math.max(1, options.limit || 100));
            // Cursor-based pagination: cursor is the last key seen.
            let query: string;
            let binds: any[];
            if (options.cursor) {
                query = `SELECT key, value FROM ${tableName} WHERE key LIKE ? AND key > ? ORDER BY key ASC LIMIT ?`;
                binds = [`${prefix}%`, options.cursor, limit + 1];
            } else {
                query = `SELECT key, value FROM ${tableName} WHERE key LIKE ? ORDER BY key ASC LIMIT ?`;
                binds = [`${prefix}%`, limit + 1];
            }
            const rows: any = await db.prepare(query).bind(...binds).all();
            const results = (rows?.results || []).map((row: any) => {
                const raw = row.value || '';
                return {
                    key: row.key,
                    json: async <T = any>(): Promise<T> => JSON.parse(raw),
                    text: async (): Promise<string> => raw,
                    body: null as ReadableStream | null,
                    size: new TextEncoder().encode(raw).length
                };
            });
            const truncated = results.length > limit;
            const objects = truncated ? results.slice(0, limit) : results;
            return {
                objects,
                truncated,
                cursor: truncated ? objects[objects.length - 1]?.key : undefined
            };
        },

        delete: async (key: string): Promise<void> => {
            await ensureTable(db, tableName);
            await db.prepare(`DELETE FROM ${tableName} WHERE key = ?`).bind(key).run();
        }
    };
};

/**
 * Convenience: get an R2-like bucket from env, returning null if D1 is not configured.
 * Use this for graceful degradation when D1 might not be available.
 */
export const tryDbBucket = (env: any, tableName: string): R2LikeBucket | null => {
    const db = env?.DB;
    if (!db || typeof db.prepare !== 'function') return null;
    return getDbBucket(db, tableName);
};
