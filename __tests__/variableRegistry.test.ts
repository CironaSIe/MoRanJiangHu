import { describe, expect, it } from 'vitest';
import { 构建变量路径登记提示, 校验变量命令是否登记 } from '../utils/variableRegistry';

const baseState = {
    角色: {
        姓名: '沈墨',
        当前精力: 80,
        状态: {
            外伤: '无'
        }
    },
    环境: {
        具体地点: '旧巷',
        天气: '阴'
    },
    社交: [
        {
            姓名: '阿青',
            关系状态: '同行',
            记忆: ['初见']
        }
    ],
    任务列表: [],
    约定列表: []
};

describe('variableRegistry', () => {
    it('allows registered scalar updates and registered array pushes', () => {
        expect(校验变量命令是否登记({
            action: 'set',
            key: '角色.当前精力',
            value: 60
        }, baseState).allowed).toBe(true);

        expect(校验变量命令是否登记({
            action: 'push',
            key: '社交[0].记忆',
            value: '一起避雨'
        }, baseState).allowed).toBe(true);
    });

    it('blocks unregistered fields that the variable model invents', () => {
        const result = 校验变量命令是否登记({
            action: 'set',
            key: '角色.哈基米灵感值',
            value: 999
        }, baseState);

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('目标路径未登记');
    });

    it('shows the registered paths in the prompt sent to the variable model', () => {
        const prompt = 构建变量路径登记提示(baseState);

        expect(prompt).toContain('【变量路径登记表】');
        expect(prompt).toContain('- 角色.当前精力');
        expect(prompt).toContain('- 社交[0].记忆');
    });
});
