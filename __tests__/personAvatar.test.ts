import { describe, expect, it } from 'vitest';
import { 提取人物头像图片记录, 提取人物头像资源引用 } from '../utils/personAvatar';

describe('personAvatar', () => {
    it('prefers the selected player avatar record when restoring from a save', () => {
        const character = {
            头像图片URL: '',
            图片档案: {
                已选头像图片ID: 'avatar-selected',
                最近生图结果: { id: 'portrait-recent', 构图: '半身', 状态: 'success', 图片URL: 'https://img.example/portrait.webp' },
                生图历史: [
                    { id: 'avatar-old', 构图: '头像', 状态: 'success', 图片URL: 'https://img.example/old.webp' },
                    {
                        id: 'avatar-selected',
                        构图: '头像',
                        状态: 'success',
                        本地路径: 'wuxia-asset://avatar-selected',
                        图片URL: 'https://img.example/selected.webp'
                    }
                ]
            }
        };

        expect(提取人物头像图片记录(character)?.id).toBe('avatar-selected');
        expect(提取人物头像资源引用(character)).toBe('wuxia-asset://avatar-selected');
    });
});
