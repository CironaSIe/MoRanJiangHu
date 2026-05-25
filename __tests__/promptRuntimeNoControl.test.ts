import { describe, expect, it } from 'vitest';
import { 写作_防止说话 } from '../prompts/writing/noControl';
import { 默认游戏设置 } from '../utils/gameSettings';
import { 构建运行时提示词池, 酒馆预设包含防抢话 } from '../hooks/useGame/promptRuntime';

const basePromptPool = [
    { id: 'core_world', 标题: '世界', 内容: 'world', 类型: '核心设定', 启用: true },
    写作_防止说话
] as any[];

describe('NoControl 防抢话运行时注入', () => {
    it('默认开启内置防抢话提示词', () => {
        const result = 构建运行时提示词池(basePromptPool, {
            ...默认游戏设置,
            启用防止说话: true
        } as any);

        expect(result.promptPool.find((item) => item.id === 'write_no_control')?.启用).toBe(true);
    });

    it('酒馆预设已有防抢话时内置规则让步', () => {
        const config = {
            ...默认游戏设置,
            启用防止说话: true,
            启用酒馆预设模式: true,
            酒馆预设角色ID: 100001,
            酒馆预设: {
                prompts: [
                    {
                        identifier: 'main',
                        name: '玩家边界',
                        role: 'system',
                        content: 'NoControl：禁止代写玩家言行，不替玩家发言。',
                        system_prompt: true
                    }
                ],
                prompt_order: [
                    {
                        character_id: 100001,
                        order: [{ identifier: 'main', enabled: true }]
                    }
                ]
            }
        } as any;

        expect(酒馆预设包含防抢话(config)).toBe(true);
        const result = 构建运行时提示词池(basePromptPool, config);
        expect(result.promptPool.find((item) => item.id === 'write_no_control')?.启用).toBe(false);
    });
});
