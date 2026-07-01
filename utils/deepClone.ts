export const deepClone = <T>(value: T, seen?: WeakMap<object, unknown>): T => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    if (value instanceof Date) return new Date(value.getTime()) as unknown as T;

    if (value instanceof Set) {
        const cloned = new Set();
        value.forEach((item) => cloned.add(deepClone(item, seen)));
        return cloned as unknown as T;
    }

    if (value instanceof Map) {
        const cloned = new Map();
        value.forEach((val, key) => cloned.set(deepClone(key, seen), deepClone(val, seen)));
        return cloned as unknown as T;
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
        return value.slice(0, value.byteLength) as unknown as T;
    }

    if (Array.isArray(value)) {
        return value.map((item) => deepClone(item, seen)) as unknown as T;
    }

    if (!seen) seen = new WeakMap();
    if (seen.has(value as object)) return seen.get(value as object) as T;

    const cloned: Record<string, unknown> = {};
    seen.set(value as object, cloned);

    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            cloned[key] = deepClone((value as Record<string, unknown>)[key], seen);
        }
    }

    return cloned as T;
};
