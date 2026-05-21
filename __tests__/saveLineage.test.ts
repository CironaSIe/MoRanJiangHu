import { describe, expect, it } from 'vitest';
import { 补全存档谱系元数据 } from '../utils/saveLineage';

describe('存档谱系补全', () => {
    it('云端导入存档已带父节点时，不因本地暂缺父节点而降级成根节点', () => {
        const save: any = {
            类型: 'auto',
            时间戳: 1779000003000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '武馆' },
            历史记录: [
                { role: 'user', content: '第一回合' },
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '第二回合' },
                { role: 'assistant', structuredResponse: { logs: [] } }
            ],
            元数据: {
                存档哈希: 'cccccccccccccccc',
                存档系列ID: 'series-test',
                存档父节点哈希: 'bbbbbbbbbbbbbbbb',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档谱系深度: 2,
                存档分支输入: '继续修炼'
            }
        };

        const normalized = 补全存档谱系元数据(save, []);

        expect(normalized.元数据.存档父节点哈希).toBe('bbbbbbbbbbbbbbbb');
        expect(normalized.元数据.存档根节点哈希).toBe('aaaaaaaaaaaaaaaa');
        expect(normalized.元数据.存档谱系深度).toBe(2);
        expect(normalized.元数据.存档分支输入).toBe('继续修炼');
    });
});
