import { describe, expect, it } from 'vitest';
import { 校验主剧情正文最低字数, 获取主剧情正文不足信息, 统计正文字符数 } from '../hooks/useGame/sendWorkflow';
import { 评估润色长度结果 } from '../hooks/useGame/bodyPolish';
import { 构建主剧情请求参数, type 主剧情系统上下文 } from '../hooks/useGame/mainStoryRequest';
import { 构建字数要求提示词 } from '../prompts/runtime/protocolDirectives';
import { 默认游戏设置 } from '../utils/gameSettings';

describe('主剧情正文字数校验', () => {
    it('统计正文日志的可见字符数', () => {
        expect(统计正文字符数({
            logs: [
                { sender: '旁白', text: '  江风渐起。 ' },
                { sender: '苏清寒', text: '继续。' }
            ]
        })).toBe(8);
    });

    it('正文低于设置字数时抛出解析错误，交给自动重试或恢复流程处理', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '太短了。' }
            ]
        }, 50, '<正文>太短了。</正文>')).toThrow(/正文过短/);
    });

    it('正文低于设置字数时返回可供文章优化接管的不足信息', () => {
        expect(获取主剧情正文不足信息({
            logs: [
                { sender: '旁白', text: '大纲可用。' }
            ]
        }, 80)).toMatchObject({
            actual: 5,
            required: 80
        });
    });

    it('正文只差少量字数时会落入容错并保留为提示', () => {
        expect(获取主剧情正文不足信息({
            logs: [
                { sender: '旁白', text: 'x'.repeat(1934) }
            ]
        }, 2000)).toMatchObject({
            actual: 1934,
            required: 2000,
            shortage: 66,
            withinTolerance: true
        });

        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: 'x'.repeat(1934) }
            ]
        }, 2000, '<正文>略短但可读</正文>')).not.toThrow();
    });

    it('正文达到最低字数时通过', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '这是一段已经达到最低长度要求的正文内容，用来确认正常回合不会被误判为失败。江风穿过长街，灯影落在青石上，行人低声交谈，新的线索也随之展开。' }
            ]
        }, 50, '<正文>...</正文>')).not.toThrow();
    });

    it('文章优化不能把正常正文明显压缩成大纲', () => {
        expect(评估润色长度结果({
            sourceLength: 400,
            polishedLength: 220,
            requiredLength: 300
        })).toMatchObject({ ok: false });
    });

    it('短正文交给文章优化扩写时会按容错接受接近目标的结果', () => {
        expect(评估润色长度结果({
            sourceLength: 1800,
            polishedLength: 1934,
            requiredLength: 2000,
            allowExpansionForLength: true
        })).toMatchObject({ ok: true });

        expect(评估润色长度结果({
            sourceLength: 120,
            polishedLength: 180,
            requiredLength: 300,
            allowExpansionForLength: true
        })).toMatchObject({ ok: false });

        expect(评估润色长度结果({
            sourceLength: 120,
            polishedLength: 320,
            requiredLength: 300,
            allowExpansionForLength: true
        })).toMatchObject({ ok: true });
    });

    it('主剧情有序消息会把动态最低字数要求放到最终任务前', () => {
        const lengthPrompt = 构建字数要求提示词(1500);
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '',
                地图建筑状态: '',
                同人设定摘要: '',
                境界体系提示词: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '<字数>本次<正文>内的正文必须达到动态注入的最低字数要求。</字数>',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                战斗状态: '',
                门派状态: '',
                任务状态: '',
                约定状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: lengthPrompt,
                免责声明输出提示词: '',
                输出协议提示词: ''
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                字数要求: 1500,
                启用GPT模式: true,
                主剧情消息模式: 'GPT'
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://example.test/v1',
                model: 'gemini-test'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '继续剧情。'
        });

        const finalLengthEntryIndex = result.messageEntries.findIndex((entry) => entry.id === 'length_requirement_final');
        const startTaskIndex = result.messageEntries.findIndex((entry) => entry.id === 'start_task');

        expect(finalLengthEntryIndex).toBeGreaterThanOrEqual(0);
        expect(startTaskIndex).toBeGreaterThan(finalLengthEntryIndex);
        expect(result.messageEntries[finalLengthEntryIndex]).toMatchObject({
            role: 'user',
            content: expect.stringContaining('1500字以上')
        });
        expect(result.orderedMessages.some((message) => message.content.includes(lengthPrompt))).toBe(true);
    });

    it('酒馆预设模式也会注入动态最低字数要求', () => {
        const lengthPrompt = 构建字数要求提示词(2200);
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '世界书占位',
                地图建筑状态: '',
                同人设定摘要: '',
                境界体系提示词: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '<字数>旧字数提示会被运行时修正。</字数>',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                战斗状态: '',
                门派状态: '',
                任务状态: '',
                约定状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: lengthPrompt,
                免责声明输出提示词: '',
                输出协议提示词: ''
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                字数要求: 2200,
                启用酒馆预设模式: true,
                当前酒馆预设ID: 'travel',
                酒馆预设角色ID: 1,
                酒馆预设列表: [{
                    id: 'travel',
                    名称: '双人旅行',
                    角色ID: 1,
                    预设: {
                        spec: 'chara_card_v3',
                        prompts: [
                            { identifier: 'main', name: 'main', role: 'system', content: '固定预设' },
                            { identifier: 'worldInfoBefore', name: 'worldInfoBefore', role: 'system', content: '' },
                            { identifier: 'userInput', name: 'userInput', role: 'user', content: '' }
                        ],
                        prompt_order: [{
                            character_id: 1,
                            order: [
                                { identifier: 'main', enabled: true },
                                { identifier: 'worldInfoBefore', enabled: true },
                                { identifier: 'userInput', enabled: true }
                            ]
                        }]
                    } as any
                }]
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://example.test/v1',
                model: 'gemini-test'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '继续剧情。'
        });

        expect(result.tavernPresetModeEnabled).toBe(true);
        expect(result.orderedMessages.some((message) => message.content.includes('2200字以上'))).toBe(true);
    });
});
