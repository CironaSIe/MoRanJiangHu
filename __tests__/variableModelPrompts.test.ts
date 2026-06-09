import { describe, expect, it } from 'vitest';
import { 构建变量模型任务提示词 } from '../prompts/runtime/variableModel';

describe('variableModel prompts', () => {
    it('injects dialogue candidate guidance without forcing every speaker into long-term social records', () => {
        const prompt = 构建变量模型任务提示词({
            stateJson: '{}',
            response: {
                logs: [
                    { sender: '旁白', text: '院门外有人轻叩。' },
                    { sender: '护院1', text: '老爷吩咐过，闲人不得入内。' },
                    { sender: '杨青儿', text: '兄长，前厅来客了。' }
                ],
                tavern_commands: []
            } as any
        });

        expect(prompt).toContain('【本回合对白候选角色列表】');
        expect(prompt).toContain('候选1：护院1');
        expect(prompt).toContain('候选2：杨青儿');
        expect(prompt).toContain('以下名字只表示“本回合在对白层出现过或被点名过的人物候选”');
        expect(prompt).toContain('不是已经确认必须长期建档的正式 NPC');
    });
});
