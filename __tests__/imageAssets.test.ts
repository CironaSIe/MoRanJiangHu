import { describe, expect, it } from 'vitest';
import { 提取图片资源引用列表 } from '../hooks/useImageAssetPrefetch';
import {
    创建图片资源引用,
    注册远程图片兜底引用,
    图片资源记录含可恢复地址
} from '../utils/imageAssets';

describe('imageAssets', () => {
    it('treats successful local or remote image records as recoverable without requiring a warm cache', () => {
        expect(图片资源记录含可恢复地址({ 本地路径: 'wuxia-asset://npc-avatar-1' })).toBe(true);
        expect(图片资源记录含可恢复地址({ 图片URL: 'https://image.bacon159.pp.ua/api/v1/file/abc' })).toBe(true);
        expect(图片资源记录含可恢复地址({ 本地路径: '' })).toBe(false);
    });

    it('extracts local fallback refs for remote image-host URLs', () => {
        const remoteUrl = 'https://image.bacon159.pp.ua/api/v1/file/npc-avatar-remote.png';
        const fallbackRef = 创建图片资源引用('npc-avatar-fallback');
        注册远程图片兜底引用(remoteUrl, fallbackRef);

        expect(提取图片资源引用列表({ 图片URL: remoteUrl })).toContain(fallbackRef);
    });
});
