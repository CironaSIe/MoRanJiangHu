import { RELEASE_INFO } from '../data/releaseInfo';
import { isNativeCapacitorEnvironment } from '../utils/nativeRuntime';

const ONLINE_SESSION_ID_KEY = 'moranjianghu.onlineSessionId';
const HEARTBEAT_PATH = '/api/admin/online';
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

const readSessionId = (): string => {
    try {
        const existing = window.localStorage.getItem(ONLINE_SESSION_ID_KEY);
        if (existing && /^[a-zA-Z0-9._:-]{8,96}$/.test(existing)) return existing;
        const bytes = new Uint8Array(12);
        window.crypto?.getRandomValues?.(bytes);
        const random = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('') || Math.random().toString(36).slice(2);
        const next = `web_${Date.now().toString(36)}_${random}`;
        window.localStorage.setItem(ONLINE_SESSION_ID_KEY, next);
        return next;
    } catch {
        return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    }
};

const buildHeartbeatPayload = (sessionId: string) => ({
    sessionId,
    path: `${window.location.pathname}${window.location.search}`.slice(0, 240),
    referrer: document.referrer || '',
    versionName: RELEASE_INFO.versionName,
    versionCode: RELEASE_INFO.versionCode,
    platform: isNativeCapacitorEnvironment() ? 'capacitor-android' : 'web'
});

const sendHeartbeat = async (sessionId: string): Promise<void> => {
    await fetch(HEARTBEAT_PATH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildHeartbeatPayload(sessionId)),
        keepalive: true,
        cache: 'no-store'
    }).catch(() => undefined);
};

export const startOnlinePresenceHeartbeat = (): (() => void) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined;
    if (window.location.pathname.startsWith('/admin/')) return () => undefined;

    const sessionId = readSessionId();
    let stopped = false;
    let timer: ReturnType<typeof window.setInterval> | null = null;

    const tick = () => {
        if (stopped || document.visibilityState === 'hidden') return;
        void sendHeartbeat(sessionId);
    };

    tick();
    timer = window.setInterval(tick, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        stopped = true;
        if (timer) window.clearInterval(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
};
