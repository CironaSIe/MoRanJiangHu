import { describe, expect, it } from 'vitest';
import { pickPreferredDiscoveredImageBackend } from '../services/ai/imageBackendRegistry';

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
});
