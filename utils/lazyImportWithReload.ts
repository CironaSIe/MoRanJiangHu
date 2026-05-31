const DYNAMIC_IMPORT_FAILURE_PATTERNS = [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'error loading dynamically imported module',
    'ChunkLoadError',
    'Loading chunk'
];

export const isDynamicImportFetchError = (error: unknown): boolean => {
    const message = error instanceof Error
        ? `${error.name} ${error.message}`
        : String(error || '');

    return message.includes('DynamicImportDeferredReloadError')
        || DYNAMIC_IMPORT_FAILURE_PATTERNS.some((pattern) => message.includes(pattern));
};

export const lazyImportWithReload = async <T>(
    importKey: string,
    loader: () => Promise<T>
): Promise<T> => {
    try {
        return await loader();
    } catch (error) {
        if (typeof window === 'undefined' || !isDynamicImportFetchError(error)) {
            throw error;
        }

        const reloadSafeError = new Error(
            `功能模块 ${importKey} 暂时无法加载。可能是版本刚更新导致旧页面仍在运行；为避免打断当前游玩，系统不会自动刷新页面。请先手动保存进度，方便时再刷新进入新版本。`
        );
        reloadSafeError.name = 'DynamicImportDeferredReloadError';
        (reloadSafeError as Error & { cause?: unknown }).cause = error;
        throw reloadSafeError;
    }
};
