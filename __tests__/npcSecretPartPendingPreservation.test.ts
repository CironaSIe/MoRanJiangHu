import { describe, expect, it, vi } from 'vitest';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';
import {
    标准化香闺秘档部位结果,
    合并NPC图片档案,
    创建NPC图片状态工作流
} from '../hooks/useGame/npcImageStateWorkflow';

vi.mock('../services/ai/image', () => ({
    buildNpcSecretPartDirectImagePrompt: vi.fn(() => ({ 原始描述: 'desc', 生图词组: 'prompt' })),
    构建最终图片提示词: vi.fn(() => ({ 最终正向提示词: 'pos', 最终负向提示词: 'neg' })),
    generateImageByPrompt: vi.fn(() => { throw new Error('backend offline'); }),
    generateNpcSecretPartImagePrompt: vi.fn(),
    persistImageAssetLocally: vi.fn(),
    修复部位特写底部缩略图栏: vi.fn((r: any) => r),
    构建角色锚点注入提示词: vi.fn(() => '')
}));

vi.mock('../utils/apiConfig', () => ({
    获取词组转化器预设上下文: () => ({ AI角色定制提示词: '' })
}));

vi.mock('../utils/imageGenerationRetry', () => ({
    生图最大自动重试次数: 0,
    执行生图模型调用带重试: async (runner: () => Promise<any>) => runner()
}));

describe('香闺秘档部位档案 pending 占位防御', () => {
    describe('标准化香闺秘档部位结果 (npcImageStateWorkflow)', () => {
        it('丢弃无 图片URL/本地路径 的 pending 占位', () => {
            const result = 标准化香闺秘档部位结果({
                id: 'npc_secret_chest_pending',
                部位: '胸部',
                构图: '部位特写',
                状态: 'pending',
                生图词组: 'old prompt',
                生成时间: 50
            }, '胸部');
            expect(result).toBeUndefined();
        });

        it('保留仍带可恢复地址的 pending 占位（旧图兜底）', () => {
            const result = 标准化香闺秘档部位结果({
                id: 'npc_secret_chest_pending',
                部位: '胸部',
                状态: 'pending',
                图片URL: 'https://example.com/old.png',
                生成时间: 50
            }, '胸部');
            expect(result?.图片URL).toBe('https://example.com/old.png');
            expect(result?.状态).toBe('pending');
        });

        it('保留 success 记录', () => {
            const result = 标准化香闺秘档部位结果({
                id: 'npc_secret_chest_ok',
                部位: '胸部',
                状态: 'success',
                图片URL: 'https://example.com/ok.png',
                生成时间: 100
            }, '胸部');
            expect(result?.图片URL).toBe('https://example.com/ok.png');
            expect(result?.状态).toBe('success');
        });
    });

    describe('规范化社交列表自动清理残留 pending 并回填历史', () => {
        it('清理部位档案里残留的空壳 pending，并从生图历史回填 success', () => {
            const chestSuccess = {
                id: 'npc_secret_chest_ok',
                部位: '胸部',
                构图: '部位特写',
                状态: 'success',
                图片URL: 'https://example.com/chest.png',
                生成时间: 1000
            };
            const [npc] = 规范化社交列表([
                {
                    id: 'npc_yyh',
                    姓名: '俞月荷',
                    性别: '女',
                    是否主要角色: true,
                    身份: '青云门弟子',
                    境界: '开脉第一重',
                    当前血量: 100,
                    最大血量: 100,
                    当前精力: 50,
                    最大精力: 50,
                    当前内力: 30,
                    最大内力: 30,
                    攻击力: 10,
                    防御力: 10,
                    当前装备: {},
                    背包: [],
                    图片档案: {
                        生图历史: [chestSuccess],
                        香闺秘档部位档案: {
                            胸部: {
                                id: 'npc_secret_chest_pending',
                                部位: '胸部',
                                构图: '部位特写',
                                状态: 'pending',
                                生图词组: 'stale prompt',
                                生成时间: 50
                            }
                        }
                    }
                }
            ], { 合并同名: false });

            const chest = npc.图片档案?.香闺秘档部位档案?.胸部;
            expect(chest?.图片URL).toBe('https://example.com/chest.png');
            expect(chest?.状态).toBe('success');
            expect(chest?.id).toBe('npc_secret_chest_ok');
        });

        it('多部位各有残留 pending 时全部清理并各自回填', () => {
            const chestSuccess = {
                id: 'chest_ok', 部位: '胸部', 构图: '部位特写', 状态: 'success',
                图片URL: 'https://example.com/chest.png', 生成时间: 1000
            };
            const vulvaSuccess = {
                id: 'vulva_ok', 部位: '小穴', 构图: '部位特写', 状态: 'success',
                图片URL: 'https://example.com/vulva.png', 生成时间: 1100
            };
            const anusSuccess = {
                id: 'anus_ok', 部位: '屁穴', 构图: '部位特写', 状态: 'success',
                图片URL: 'https://example.com/anus.png', 生成时间: 1200
            };
            const [npc] = 规范化社交列表([
                {
                    id: 'npc_multi',
                    姓名: '多部位测试',
                    性别: '女',
                    是否主要角色: true,
                    身份: '弟子',
                    境界: '开脉第一重',
                    当前血量: 100, 最大血量: 100,
                    当前精力: 50, 最大精力: 50,
                    当前内力: 30, 最大内力: 30,
                    攻击力: 10, 防御力: 10,
                    当前装备: {}, 背包: [],
                    图片档案: {
                        生图历史: [anusSuccess, vulvaSuccess, chestSuccess],
                        香闺秘档部位档案: {
                            胸部: { id: 'p1', 部位: '胸部', 状态: 'pending', 生图词组: 'x', 生成时间: 10 },
                            小穴: { id: 'p2', 部位: '小穴', 状态: 'pending', 生图词组: 'x', 生成时间: 20 },
                            屁穴: { id: 'p3', 部位: '屁穴', 状态: 'pending', 生图词组: 'x', 生成时间: 30 }
                        }
                    }
                }
            ], { 合并同名: false });

            expect(npc.图片档案?.香闺秘档部位档案?.胸部?.图片URL).toBe('https://example.com/chest.png');
            expect(npc.图片档案?.香闺秘档部位档案?.小穴?.图片URL).toBe('https://example.com/vulva.png');
            expect(npc.图片档案?.香闺秘档部位档案?.屁穴?.图片URL).toBe('https://example.com/anus.png');
        });
    });

    describe('生图工作流 pending 占位保留旧图', () => {
        const 创建工作流依赖 = (overrides: Record<string, any> = {}) => {
            let socialList: any[] = [];
            const 更新NPC香闺秘档部位结果 = vi.fn((npcKey: string, part: string, updater: (current: any) => any) => {
                socialList = socialList.map((npc) => {
                    if (npc.id !== npcKey) return npc;
                    const archive = npc.图片档案 || {};
                    const currentSecret = archive.香闺秘档部位档案 || {};
                    const next = updater(currentSecret[part] || undefined);
                    return {
                        ...npc,
                        图片档案: {
                            ...archive,
                            香闺秘档部位档案: { ...currentSecret, [part]: next }
                        }
                    };
                });
                return true;
            });
            return {
                socialListRef: { get: () => socialList, set: (v: any[]) => { socialList = v; } },
                deps: {
                    获取社交列表: () => socialList,
                    设置社交: (updater: any) => {
                        const result = updater(socialList);
                        if (result?.nextList) socialList = result.nextList;
                        else socialList = updater;
                    },
                    规范化社交列表: (list: any[]) => list,
                    执行社交自动存档: vi.fn(),
                    获取NPC唯一标识: (npc: any) => npc?.id || '',
                    设置NPC生图任务队列: vi.fn(),
                    加载图片AI服务: vi.fn(),
                    更新NPC香闺秘档部位结果,
                    写入NPC香闺秘档部位记录: vi.fn(() => true),
                    ...overrides
                }
            };
        };

        it('写 pending 占位时不覆盖已有 success 图的 图片URL/本地路径', async () => {
            const { 执行NPC香闺秘档部位生图工作流 } = await import('../hooks/useGame/npcSecretImageWorkflow');
            const { socialListRef, deps } = 创建工作流依赖({
                apiConfig: {},
                获取文生图接口配置: () => ({
                    图片后端类型: 'comfyui',
                    model: 'test-model',
                    baseUrl: 'http://localhost:8188',
                    画风: '写实',
                    供应商: 'other',
                    图片走OpenAI自定义格式: false,
                    自动切换提示: ''
                }),
                获取生图词组转化器接口配置: () => null,
                获取生图画师串预设: () => null,
                获取当前PNG画风预设: () => null,
                获取NPC角色锚点: () => null,
                获取词组转化器预设提示词: () => '',
                接口配置是否可用: () => true,
                读取文生图功能配置: () => ({ 总开关: true, NPC开关: true, 使用词组转化器: false }),
                NPC私密部位生图进行中集合: new Set<string>(),
                提取NPC香闺秘档部位生图数据: () => ({ 胸部描述: '丰满挺拔' }),
                创建NPC生图任务: (p: any) => p,
                生成NPC生图记录ID: () => 'record-pending-1',
                追加NPC生图任务: vi.fn(),
                更新NPC生图任务: vi.fn(),
                写入NPC图片历史记录: vi.fn(),
                写入NPC香闺秘档部位记录: vi.fn(() => true)
            });

            socialListRef.set([{
                id: 'npc_yyh',
                姓名: '俞月荷',
                性别: '女',
                图片档案: {
                    香闺秘档部位档案: {
                        胸部: {
                            id: 'old_success',
                            部位: '胸部',
                            状态: 'success',
                            图片URL: 'https://example.com/old-chest.png',
                            本地路径: 'wuxia-asset://old-chest',
                            生成时间: 900
                        }
                    }
                }
            }]);

            await expect(执行NPC香闺秘档部位生图工作流(
                { id: 'npc_yyh', 姓名: '俞月荷', 性别: '女' },
                '胸部',
                { source: 'manual' },
                deps as any
            )).rejects.toThrow('backend offline');

            const pendingCalls = deps.更新NPC香闺秘档部位结果.mock.calls;
            expect(pendingCalls.length).toBeGreaterThan(0);
            const pendingUpdater = pendingCalls[0][2] as (current: any) => any;
            const currentWithImage = {
                id: 'old_success',
                图片URL: 'https://example.com/old-chest.png',
                本地路径: 'wuxia-asset://old-chest',
                状态: 'success'
            };
            const pendingResult = pendingUpdater(currentWithImage);
            expect(pendingResult.图片URL).toBe('https://example.com/old-chest.png');
            expect(pendingResult.本地路径).toBe('wuxia-asset://old-chest');
            expect(pendingResult.状态).toBe('pending');
        });
    });

    describe('创建NPC图片状态工作流: pending 占位写入后旧图仍在', () => {
        const 获取生产式NPC唯一标识 = (npc: any, index?: number): string => {
            const id = typeof npc?.id === 'string' ? npc.id.trim() : '';
            if (id) return `id:${id}`;
            const name = typeof npc?.姓名 === 'string' ? npc.姓名.trim() : '';
            if (name) return `name:${name}`;
            return `index:${index ?? -1}`;
        };

        it('部位已有 success 图时，写入 pending 占位后标准化清理仍保留可展示记录', () => {
            let socialList: any[] = [{
                id: 'npc_yyh',
                姓名: '俞月荷',
                性别: '女',
                是否主要角色: true,
                图片档案: {
                    生图历史: [{
                        id: 'old_success',
                        部位: '胸部',
                        构图: '部位特写',
                        状态: 'success',
                        图片URL: 'https://example.com/old-chest.png',
                        生成时间: 900
                    }],
                    香闺秘档部位档案: {
                        胸部: {
                            id: 'old_success',
                            部位: '胸部',
                            状态: 'success',
                            图片URL: 'https://example.com/old-chest.png',
                            生成时间: 900
                        }
                    }
                }
            }];
            const workflow = 创建NPC图片状态工作流({
                设置社交: (updater: any) => { socialList = updater(socialList); },
                规范化社交列表: (list: any[]) => list,
                执行社交自动存档: vi.fn(),
                获取社交列表: () => socialList,
                获取NPC唯一标识: (npc: any) => npc?.id || '',
                设置NPC生图任务队列: vi.fn(),
                加载图片AI服务: vi.fn()
            } as any);

            workflow.更新NPC香闺秘档部位结果('npc_yyh', '胸部', (current) => ({
                ...current,
                状态: 'pending',
                生图词组: '',
                生成时间: Date.now()
            }));

            const merged = 合并NPC图片档案(socialList[0], socialList[0]);
            const chest = merged?.香闺秘档部位档案?.胸部;
            expect(chest?.图片URL).toBe('https://example.com/old-chest.png');
        });

        it('早期开局 name 标识的头像结果应写回后续带 id 的同名 NPC', () => {
            let socialList: any[] = [{
                id: 'npc_yuyuehe',
                姓名: '俞月荷',
                性别: '女',
                是否主要角色: true
            }];
            const autoSave = vi.fn();
            const workflow = 创建NPC图片状态工作流({
                设置社交: (updater: any) => { socialList = updater(socialList); },
                规范化社交列表: (list: any[]) => list,
                执行社交自动存档: autoSave,
                获取社交列表: () => socialList,
                获取NPC唯一标识: 获取生产式NPC唯一标识,
                设置NPC生图任务队列: vi.fn(),
                加载图片AI服务: vi.fn()
            } as any);

            workflow.更新NPC最近生图结果('name:俞月荷', (npc: any) => ({
                ...npc,
                最近生图结果: {
                    id: 'avatar_early',
                    NPC姓名: '俞月荷',
                    NPC性别: '女',
                    构图: '头像',
                    状态: 'success',
                    图片URL: 'https://example.com/avatar.png',
                    生成时间: 1000
                }
            }));

            expect(autoSave).toHaveBeenCalledTimes(1);
            expect(socialList[0].图片档案?.最近生图结果?.id).toBe('avatar_early');
            expect(socialList[0].图片档案?.已选头像图片ID).toBe('avatar_early');
        });

        it('开局伙伴稳定 ID 替换后，旧 id 私密部位结果应按姓名写回当前 NPC', () => {
            let socialList: any[] = [{
                id: 'npc_opening_partner_11pck2i',
                姓名: '俞月荷',
                性别: '女',
                是否主要角色: true,
                来源: '开局伙伴'
            }];
            const autoSave = vi.fn();
            const workflow = 创建NPC图片状态工作流({
                设置社交: (updater: any) => { socialList = updater(socialList); },
                规范化社交列表: (list: any[]) => list,
                执行社交自动存档: autoSave,
                获取社交列表: () => socialList,
                获取NPC唯一标识: 获取生产式NPC唯一标识,
                设置NPC生图任务队列: vi.fn(),
                加载图片AI服务: vi.fn()
            } as any);

            const updated = workflow.写入NPC香闺秘档部位记录('id:NPC001', '胸部', {
                id: 'old-id-secret-chest',
                部位: '胸部',
                构图: '部位特写',
                状态: 'success',
                本地路径: 'wuxia-asset://secret-chest',
                原始描述: JSON.stringify({
                    视觉相关字段: {
                        姓名: '俞月荷',
                        性别: '女'
                    }
                }),
                生成时间: 1000
            });

            expect(updated).toBe(true);
            expect(autoSave).toHaveBeenCalledTimes(1);
            expect(socialList[0].图片档案?.香闺秘档部位档案?.胸部?.id).toBe('old-id-secret-chest');
            expect(socialList[0].图片档案?.生图历史?.[0]?.id).toBe('old-id-secret-chest');
        });
    });
});
