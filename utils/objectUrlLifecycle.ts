import { recordDiagnosticLog } from '../services/diagnosticLog';

type ObjectUrlSource = {
    source: string;
    kind?: string;
    detail?: Record<string, unknown>;
};

type ObjectUrlEntry = ObjectUrlSource & {
    sequence: number;
    bytes: number;
    type: string;
    createdAt: number;
};

let objectUrlSequence = 0;
const activeObjectUrls = new Map<string, ObjectUrlEntry>();

const 截短URL = (url: string): string => {
    if (url.length <= 32) return url;
    return `${url.slice(0, 12)}...${url.slice(-12)}`;
};

const 记录ObjectURL生命周期 = (
    event: 'create' | 'revoke',
    url: string,
    payload: Record<string, unknown>
) => {
    recordDiagnosticLog('info', ['objectUrl.lifecycle', {
        event,
        url: 截短URL(url),
        activeCount: activeObjectUrls.size,
        ...payload
    }]);
};

export const 创建并记录ObjectURL = (blob: Blob, meta: ObjectUrlSource): string => {
    const url = URL.createObjectURL(blob);
    const entry: ObjectUrlEntry = {
        ...meta,
        sequence: ++objectUrlSequence,
        bytes: blob.size,
        type: blob.type || '',
        createdAt: Date.now()
    };
    activeObjectUrls.set(url, entry);
    记录ObjectURL生命周期('create', url, {
        sequence: entry.sequence,
        source: entry.source,
        kind: entry.kind,
        bytes: entry.bytes,
        type: entry.type,
        detail: entry.detail
    });
    return url;
};

export const 释放并记录ObjectURL = (url: string | null | undefined, meta: ObjectUrlSource): void => {
    if (typeof url !== 'string' || !url.startsWith('blob:')) return;
    const entry = activeObjectUrls.get(url);
    try {
        URL.revokeObjectURL(url);
    } finally {
        activeObjectUrls.delete(url);
        记录ObjectURL生命周期('revoke', url, {
            sequence: entry?.sequence,
            source: meta.source,
            originalSource: entry?.source,
            kind: meta.kind || entry?.kind,
            matchedCreate: Boolean(entry),
            bytes: entry?.bytes,
            type: entry?.type,
            lifetimeMs: entry ? Date.now() - entry.createdAt : undefined,
            detail: {
                ...(entry?.detail || {}),
                ...(meta.detail || {})
            }
        });
    }
};
