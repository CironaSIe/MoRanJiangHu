import { describe, expect, it } from 'vitest';

import { 选择最佳可用模型 } from '../components/features/Settings/ApiSettings';

describe('接口模型自动选择', () => {
    it('优先选择同渠道返回列表中版本号更大的高能力模型', () => {
        expect(选择最佳可用模型([
            'gemini-2.5-pro',
            'gemini-2.0-pro',
            'gemini-2.5-flash',
            'text-embedding-004'
        ])).toBe('gemini-2.5-pro');
    });

    it('不会在小米等非 GPT 渠道测试时硬保留 GPT 模型', () => {
        expect(选择最佳可用模型([
            'moonshot-v1-8k',
            'moonshot-v1-32k',
            'moonshot-v1-128k',
            'moonshot-v1-8k-vision-preview'
        ])).toBe('moonshot-v1-128k');
    });

    it('过滤空值并避开图片、语音和嵌入类模型', () => {
        expect(选择最佳可用模型([
            '',
            'gpt-image-2',
            'text-embedding-3-large',
            'gpt-5-mini',
            'gpt-5'
        ])).toBe('gpt-5');
    });
});
