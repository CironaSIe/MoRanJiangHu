import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyImportWithReload } from '../utils/lazyImportWithReload';

describe('lazyImportWithReload', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('does not refresh the page when a deployed chunk is no longer available', async () => {
        const reload = vi.fn();
        vi.stubGlobal('window', {
            location: { reload },
            sessionStorage: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn()
            }
        });

        await expect(lazyImportWithReload('game-panel', async () => {
            throw new TypeError('Failed to fetch dynamically imported module');
        })).rejects.toMatchObject({
            name: 'DynamicImportDeferredReloadError'
        });

        expect(reload).not.toHaveBeenCalled();
    });
});
