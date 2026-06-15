import { 提示词结构 } from '../types';
import { isNativeCapacitorEnvironment } from './nativeRuntime';
import { 创建并记录ObjectURL, 延迟释放并记录ObjectURL } from './objectUrlLifecycle';

export type 提示词导出结果 = {
    method: 'file' | 'download';
    fileName: string;
    message: string;
};

const 提示词导出文件名 = 'wuxia_prompts.json';

const 编码Base64 = (content: string): string => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(content, 'utf8').toString('base64');
    }
    return btoa(unescape(encodeURIComponent(content)));
};

const 读取原生文件系统插件 = (): any => {
    if (!isNativeCapacitorEnvironment()) return null;
    const runtime = typeof window !== 'undefined' ? (window as any) : undefined;
    return runtime?.Capacitor?.Plugins?.Filesystem || null;
};

export const 导出提示词到文件 = async (prompts: 提示词结构[]): Promise<提示词导出结果> => {
    const content = JSON.stringify(Array.isArray(prompts) ? prompts : [], null, 2);
    const filesystem = 读取原生文件系统插件();

    if (filesystem?.writeFile) {
        try {
            await filesystem.writeFile({
                path: 提示词导出文件名,
                data: 编码Base64(content),
                directory: 'DOCUMENTS',
                recursive: false
            });
            return {
                method: 'file',
                fileName: 提示词导出文件名,
                message: `已导出到设备文档目录：${提示词导出文件名}`
            };
        } catch (error) {
            console.error('提示词原生文件导出失败，尝试浏览器下载兜底:', error);
        }
    }

    if (typeof document === 'undefined') {
        throw new Error('当前环境无法导出提示词文件');
    }

    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = 创建并记录ObjectURL(blob, {
        source: 'promptExport.导出提示词到文件',
        kind: 'prompt-export',
        detail: { promptCount: Array.isArray(prompts) ? prompts.length : 0 }
    });
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 提示词导出文件名;
    anchor.click();
    延迟释放并记录ObjectURL(url, {
        source: 'promptExport.导出提示词到文件',
        kind: 'prompt-export',
        detail: { reason: 'download-clicked' }
    }, 1000);

    return {
        method: 'download',
        fileName: 提示词导出文件名,
        message: `已开始下载：${提示词导出文件名}`
    };
};
