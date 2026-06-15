import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nativeRuntimeMock = vi.hoisted(() => ({ native: false }));

vi.mock('../utils/nativeRuntime', () => ({
    isNativeCapacitorEnvironment: () => nativeRuntimeMock.native
}));

const decodeBase64Utf8 = (value: string): string => Buffer.from(value, 'base64').toString('utf8');

describe('prompt export', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        nativeRuntimeMock.native = false;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('writes prompt JSON through Capacitor Filesystem in the APK runtime', async () => {
        nativeRuntimeMock.native = true;
        const writeFile = vi.fn(async () => undefined);
        vi.stubGlobal('window', {
            Capacitor: {
                Plugins: {
                    Filesystem: { writeFile }
                }
            }
        });

        const { 导出提示词到文件 } = await import('../utils/promptExport');
        const result = await 导出提示词到文件([
            { id: 'p1', 标题: '生图提示词', 内容: '正面提示', 类型: '自定义', 启用: true }
        ] as any);

        expect(result.method).toBe('file');
        expect(result.fileName).toBe('wuxia_prompts.json');
        expect(writeFile).toHaveBeenCalledTimes(1);
        expect(writeFile.mock.calls[0][0]).toMatchObject({
            path: 'wuxia_prompts.json',
            directory: 'DOCUMENTS',
            recursive: false
        });
        expect(JSON.parse(decodeBase64Utf8(writeFile.mock.calls[0][0].data))).toEqual([
            { id: 'p1', 标题: '生图提示词', 内容: '正面提示', 类型: '自定义', 启用: true }
        ]);
    });

    it('keeps the browser download path outside native runtime', async () => {
        const click = vi.fn();
        const anchor: any = { click, href: '', download: '' };
        const createElement = vi.fn(() => anchor);
        const createObjectURL = vi.fn(() => 'blob:prompt-export');
        const revokeObjectURL = vi.fn();
        vi.stubGlobal('document', { createElement });
        vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
        vi.stubGlobal('setTimeout', vi.fn((callback: () => void) => {
            callback();
            return 1;
        }));

        const { 导出提示词到文件 } = await import('../utils/promptExport');
        const result = await 导出提示词到文件([
            { id: 'p2', 标题: '浏览器提示词', 内容: '负面提示', 类型: '自定义', 启用: true }
        ] as any);

        expect(result.method).toBe('download');
        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(anchor.href).toBe('blob:prompt-export');
        expect(anchor.download).toBe('wuxia_prompts.json');
        expect(click).toHaveBeenCalledTimes(1);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:prompt-export');
    });
});
