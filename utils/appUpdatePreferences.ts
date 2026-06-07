import type { 游戏设置结构 } from '../types';

export const APK_AUTO_UPDATE_DISABLED_STORAGE_KEY = 'moranjianghu.apkAutoUpdateDisabled';

export const 读取APK自动更新禁用镜像 = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(APK_AUTO_UPDATE_DISABLED_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const 写入APK自动更新禁用镜像 = (disabled: boolean): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(APK_AUTO_UPDATE_DISABLED_STORAGE_KEY, disabled ? 'true' : 'false');
    } catch {
        // ignore storage failures
    }
};

export const APK仅手动更新已启用 = (
    config?: Partial<Pick<游戏设置结构, '禁用APK自动更新'>> | null
): boolean => (
    config?.禁用APK自动更新 === true || 读取APK自动更新禁用镜像()
);
