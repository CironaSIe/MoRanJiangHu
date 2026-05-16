import { describe, expect, it } from 'vitest';
import { 获取图片展示地址, 获取图片资源文本地址, 注册图片资源缓存, 注册远程图片兜底引用 } from '../utils/imageAssets';

describe('imageAssets', () => {
    it('falls back to remote image url when local asset ref is not cached', () => {
        const remoteUrl = 'https://image.bacon159.pp.ua/file/example.png';

        expect(获取图片展示地址({
            本地路径: 'wuxia-asset://missing-local-cache',
            图片URL: remoteUrl
        })).toBe(remoteUrl);
    });

    it('prefers cached local fallback for remote image host urls', () => {
        const remoteUrl = 'https://image.bacon159.pp.ua/file/example-local-first.png';
        const localDataUrl = 'data:image/png;base64,bG9jYWw=';

        注册图片资源缓存('local-first-asset', localDataUrl);
        注册远程图片兜底引用(remoteUrl, 'local-first-asset');

        expect(获取图片资源文本地址(remoteUrl)).toBe(localDataUrl);
        expect(获取图片展示地址({ 图片URL: remoteUrl })).toBe(localDataUrl);
    });
});
