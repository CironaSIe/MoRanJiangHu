import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    isImageBackendRecentlyUnavailable,
    pickPreferredDiscoveredImageBackend,
    recordImageBackendConnectionFailure,
    sortDiscoveredImageBackendsByPreference
} from '../services/ai/imageBackendRegistry';

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => store.set(key, value)),
        removeItem: vi.fn((key: string) => store.delete(key)),
    };
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('imageBackendRegistry', () => {
    it('keeps the selected discovered backend id synced when its URL changes', () => {
        const result = pickPreferredDiscoveredImageBackend([
            {
                id: 'cnb-main',
                url: 'https://new-8188.cnb.run/',
                lastHeartbeatAt: '2026-05-16T10:20:00.000Z',
                backendType: 'comfyui'
            } as any
        ], 'main', {
            id: 'cnb-main',
            url: 'https://old-8188.cnb.run'
        }, {});

        expect(result?.id).toBe('cnb-main');
        expect(result?.url).toBe('https://new-8188.cnb.run/');
    });

    it('deprioritizes ComfyUI backends recently marked unavailable', () => {
        vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
        recordImageBackendConnectionFailure('https://bad-8188.cnb.run/');

        expect(isImageBackendRecentlyUnavailable('https://bad-8188.cnb.run')).toBe(true);

        const sorted = sortDiscoveredImageBackendsByPreference([
            { id: 'bad', url: 'https://bad-8188.cnb.run', backendType: 'comfyui' } as any,
            { id: 'good', url: 'https://good-8188.cnb.run', backendType: 'comfyui' } as any,
        ], 'global');

        expect(sorted[0]?.id).toBe('good');
    });
});
