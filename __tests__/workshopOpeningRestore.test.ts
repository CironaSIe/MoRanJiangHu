import { describe, expect, it } from 'vitest';
import { 获取快速重开运行时恢复参数, 构建预设直开恢复结果 } from '../utils/customNewGamePresets';
import { 创意工坊模块列表 } from '../data/creativeWorkshopModules';

describe('workshop opening restore helpers', () => {
    it('快速重开优先使用 runtimeSnapshot 中的恢复字段', () => {
        const restored = 获取快速重开运行时恢复参数({
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: true,
                同人融合: {
                    enabled: false,
                    作品名: '',
                    来源类型: '小说',
                    融合强度: '轻度映射',
                    保留原著角色: false,
                    启用角色替换: false,
                    替换目标角色名: '',
                    附加替换角色名列表: [],
                    附加角色替换规则列表: [],
                    启用附加小说: false,
                    附加小说数据集ID: ''
                },
                runtimeSnapshot: {
                    openingStreaming: false,
                    openingExtraPrompt: '来自快照的额外提示',
                    openingExtraRequirement: '来自快照的额外要求',
                    activeModuleExtraRules: '来自快照的模块规则'
                }
            },
            openingStreaming: true,
            openingExtraPrompt: '旧表层提示'
        });

        expect(restored.openingStreaming).toBe(false);
        expect(restored.openingExtraPrompt).toBe('来自快照的额外提示');
        expect(restored.openingExtraRequirement).toBe('来自快照的额外要求');
        expect(restored.activeModuleExtraRules).toBe('来自快照的模块规则');
    });

    it('预设直开恢复结果会过滤失效模块并保留有效运行时字段', () => {
        const restored = 构建预设直开恢复结果({
            id: 'direct-open-restore',
            名称: '直开恢复',
            简介: '测试直开恢复结果',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '',
                manualWorldPrompt: '',
                manualRealmPrompt: ''
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: true,
                同人融合: {
                    enabled: false,
                    作品名: '',
                    来源类型: '小说',
                    融合强度: '轻度映射',
                    保留原著角色: false,
                    启用角色替换: false,
                    替换目标角色名: '',
                    附加替换角色名列表: [],
                    附加角色替换规则列表: [],
                    启用附加小说: false,
                    附加小说数据集ID: ''
                },
                runtimeSnapshot: {
                    openingStreaming: false,
                    openingExtraRequirement: '来自快照的额外要求',
                    activeModuleExtraRules: '来自快照的模块规则',
                    modeWorldbooks: [{
                        id: 'topic-book',
                        标题: '题材口径',
                        描述: '题材说明',
                        常驻大纲: '',
                        启用: true,
                        内置: false,
                        条目: [],
                        创建时间: 0,
                        更新时间: 0
                    }],
                    workshopSelection: {
                        selectedMode: '武侠',
                        selectedModules: {
                            topic: 'builtin:topic-wuxia',
                            ability: 'missing:ability',
                            world_rules: 'builtin:world-rules-wuxia'
                        }
                    }
                }
            },
            openingStreaming: true,
            openingExtraRequirement: '旧值'
        }, {
            validModuleKeys: new Set(['builtin:topic-wuxia', 'builtin:world-rules-wuxia'])
        });

        expect(restored.openingStreaming).toBe(false);
        expect(restored.openingExtraRequirement).toBe('来自快照的额外要求');
        expect(restored.activeModuleExtraRules).toBe('来自快照的模块规则');
        expect(restored.modeWorldbooks?.map((item) => item.id)).toEqual(['topic-book']);
        expect(restored.workshopSelection).toEqual({
            selectedMode: '武侠',
            selectedModules: {
                topic: 'builtin:topic-wuxia',
                world_rules: 'builtin:world-rules-wuxia'
            }
        });
    });

    it('快速重开和预设直开会静默校准运行时派生状态且不重复污染文本字段', () => {
        const wuxiaTopic = 创意工坊模块列表.find((entry) => entry.source === 'builtin' && entry.id === 'mode-package-武侠');
        expect(wuxiaTopic).toBeTruthy();
        const openingConfig = {
            题材模式: '武侠' as const,
            初始关系模板: '随机邂逅' as const,
            关系侧重: ['友情'] as const,
            开局切入偏好: '市井起手' as const,
            开局生成门派: true,
            开局生成同门: true,
            modeRuntimeProfile: {
                ...(wuxiaTopic!.modeRuntimeProfile as any),
                identity: {
                    ...(wuxiaTopic!.modeRuntimeProfile as any).identity,
                    displayName: '旧显示名'
                }
            },
            同人融合: {
                enabled: false,
                作品名: '',
                来源类型: '小说' as const,
                融合强度: '轻度映射' as const,
                保留原著角色: false,
                启用角色替换: false,
                替换目标角色名: '',
                附加替换角色名列表: [],
                附加角色替换规则列表: [],
                启用附加小说: false,
                附加小说数据集ID: ''
            },
            runtimeSnapshot: {
                openingStreaming: false,
                openingExtraRequirement: '来自快照的额外要求',
                activeModuleExtraRules: '旧模块规则',
                modeWorldbooks: [{
                    id: 'stale-book',
                    标题: '过期世界书',
                    描述: '过期说明',
                    常驻大纲: '',
                    启用: true,
                    内置: false,
                    条目: [],
                    创建时间: 0,
                    更新时间: 0
                }],
                modeBackgrounds: [
                    { 名称: '过期背景', 描述: '过期描述', 效果: '过期效果' }
                ],
                modeTalents: [
                    { 名称: '过期天赋', 描述: '过期描述', 效果: '过期效果' }
                ],
                workshopSelection: {
                    selectedMode: '武侠',
                    selectedModules: {
                        topic: 'builtin:mode-package-武侠'
                    }
                }
            }
        };

        const runtimeRestored = 获取快速重开运行时恢复参数({
            openingConfig,
            openingStreaming: true,
            openingExtraPrompt: '旧表层提示',
            openingExtraRequirement: '旧额外要求',
            activeModuleExtraRules: '旧模块规则',
            validModuleKeys: new Set(['builtin:mode-package-武侠'])
        });

        expect(runtimeRestored.activeModuleExtraRules).not.toBe('旧模块规则');
        expect(runtimeRestored.modeWorldbooks?.map((item) => item.id)).toEqual(wuxiaTopic!.modeWorldbooks?.map((item) => item.id));
        expect(runtimeRestored.modeRuntimeProfile?.identity.displayName).toBe(wuxiaTopic!.modeRuntimeProfile?.identity.displayName);

        const directOpenRestored = 构建预设直开恢复结果({
            id: 'direct-open-controlled-replay',
            名称: '直开静默校准',
            简介: '测试直开静默校准',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '世界要求原文',
                manualWorldPrompt: '世界提示原文',
                manualRealmPrompt: '境界提示原文'
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打']
            },
            openingConfig,
            openingStreaming: true,
            openingExtraRequirement: '旧值'
        }, {
            validModuleKeys: new Set(['builtin:mode-package-武侠'])
        });

        expect(directOpenRestored.worldConfig.worldExtraRequirement).toBe('世界要求原文');
        expect(directOpenRestored.worldConfig.manualWorldPrompt).toBe('世界提示原文');
        expect(directOpenRestored.worldConfig.manualRealmPrompt).toBe('境界提示原文');
        expect(directOpenRestored.activeModuleExtraRules).not.toBe('旧模块规则');
        expect(directOpenRestored.modeWorldbooks?.map((item) => item.id)).toEqual(wuxiaTopic!.modeWorldbooks?.map((item) => item.id));
        expect(directOpenRestored.openingConfig?.modeRuntimeProfile?.identity.displayName).toBe(wuxiaTopic!.modeRuntimeProfile?.identity.displayName);
    });
});
