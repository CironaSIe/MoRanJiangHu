import { describe, expect, it } from 'vitest';
import { 执行响应命令处理 } from '../hooks/useGame/responseCommandProcessor';
import {
    规范化环境信息,
    规范化社交列表,
    规范化角色物品容器映射
} from '../hooks/useGame/stateTransforms';
import { 提取命中女性姓名黑名单 } from '../utils/femaleNameSelector';
import { 构建女性姓名候选提示词 } from '../utils/femaleNameCandidatePrompt';
import { 校验响应未命中女性姓名黑名单 } from '../hooks/useGame/sendWorkflow';

const 读取端到端AI配置 = () => {
    const baseUrl = process.env.MORAN_E2E_AI_BASE_URL?.trim();
    const apiKey = process.env.MORAN_E2E_AI_API_KEY?.trim();
    const model = process.env.MORAN_E2E_AI_MODEL?.trim();
    return baseUrl && apiKey && model ? { baseUrl, apiKey, model } : null;
};

describe('AI returned female name e2e', () => {
    it('keeps an AI raw non-blacklisted female name without local name-pool rewriting', () => {
        const candidatePrompt = 构建女性姓名候选提示词({
            usedNames: ['苏婉儿', '婉儿', '林清雪'],
            seed: '端测少侠|端测州|前厅',
            count: 100
        });
        const aiReturnedName = '谢听澜';
        const response = {
            logs: [
                { sender: aiReturnedName, text: '少侠，我随你同去。' }
            ],
            tavern_commands: [
                {
                    action: 'push' as const,
                    key: '社交',
                    value: {
                        id: 'npc_ai_su_waner',
                        姓名: aiReturnedName,
                        性别: '女',
                        年龄: 18,
                        身份: '主要女角色',
                        是否主要角色: true,
                        是否在场: true,
                        简介: 'AI 在本回合返回的主要女角色。'
                    }
                }
            ]
        };

        const result = 执行响应命令处理(
            response,
            {
                角色: 规范化角色物品容器映射({ 姓名: '端测少侠', 装备: {}, 物品列表: [] }),
                环境: 规范化环境信息({ 时间: '1:01:01:08:00', 大地点: '端测州', 具体地点: '前厅' }),
                社交: [],
                世界: { 地图层级: [] } as any,
                战斗: {} as any,
                玩家门派: {} as any,
                任务列表: [],
                约定列表: [],
                剧情: {} as any,
                剧情规划: {} as any
            },
            {
                规范化环境信息,
                规范化社交列表,
                规范化世界状态: (raw?: any) => raw || { 地图层级: [] },
                规范化战斗状态: (raw?: any) => raw || {},
                规范化门派状态: (raw?: any) => raw || {},
                规范化剧情状态: (raw?: any) => raw || {},
                规范化剧情规划状态: (raw?: any) => raw || {},
                规范化女主剧情规划状态: (raw?: any) => raw,
                规范化同人剧情规划状态: (raw?: any) => raw,
                规范化同人女主剧情规划状态: (raw?: any) => raw,
                规范化角色物品容器映射,
                战斗结束自动清空: (battle: any) => battle
            },
            { applyState: false }
        );

        const npc = result.社交.find((item: any) => item?.id === 'npc_ai_su_waner');
        console.info(`[AI姓名端到端] 模拟AI原始返回=${aiReturnedName}；最终入库=${npc?.姓名}`);
        expect(candidatePrompt).toContain('女性新角色姓名黑名单');
        expect(candidatePrompt).toContain('苏婉儿');
        expect(candidatePrompt).not.toContain('候选姓名（100个）');
        expect(aiReturnedName).not.toBe('苏婉儿');
        expect(npc?.姓名).toBe(aiReturnedName);
        expect(提取命中女性姓名黑名单(npc?.姓名)).toHaveLength(0);
        expect(npc?.曾用名 || []).not.toContain(aiReturnedName);
        expect(npc?.对白登场).toBe(true);
        expect(npc?.自动补全头像).toBe(true);
    });

    it('rejects a newly generated template name before it can be committed', () => {
        const aiReturnedName = '苏婉儿';
        const response = {
            logs: [
                { sender: aiReturnedName, text: '少侠，我随你同去。' }
            ],
            tavern_commands: [
                {
                    action: 'push' as const,
                    key: '社交',
                    value: {
                        id: 'npc_ai_su_waner_fallback',
                        姓名: aiReturnedName,
                        性别: '女',
                        年龄: 18,
                        身份: '主要女角色',
                        是否主要角色: true,
                        是否在场: true,
                        简介: 'AI 忽略候选池后返回的模板名。'
                    }
                }
            ]
        };

        expect(() => 校验响应未命中女性姓名黑名单(response as any, JSON.stringify(response), '主剧情'))
            .toThrow('女性模板姓名黑名单');
    });

    it.skipIf(!读取端到端AI配置())('uses the configured external AI endpoint to create a non-blacklisted name', async () => {
        const config = 读取端到端AI配置();
        if (!config) throw new Error('missing e2e AI config');
        const candidatePrompt = 构建女性姓名候选提示词({
            usedNames: ['苏婉儿', '婉儿', '林清雪'],
            seed: '真实端测少侠|端测州|前厅',
            count: 100
        });
        const response = await fetch(`${config.baseUrl.replace(/\/+$/u, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: '你只负责创造一个不在黑名单里的中文女性姓名。必须只输出姓名本身，不要解释，不要加标点。'
                    },
                    {
                        role: 'user',
                        content: `${candidatePrompt}\n\n请创造一个适合“主要女角色、同行伙伴、可靠但有江湖锋芒”的姓名。只输出姓名。`
                    }
                ]
            })
        });
        expect(response.ok).toBe(true);
        const json = await response.json() as any;
        const rawContent = String(json?.choices?.[0]?.message?.content || '');
        const aiReturnedName = rawContent.trim().replace(/^["'“”‘’`\s]+|["'“”‘’`\s]+$/g, '').split(/[\s,，。；;：:\n\r]+/u).find(Boolean) || '';
        const commandResponse = {
            logs: [
                { sender: aiReturnedName, text: '少侠，我随你同去。' }
            ],
            tavern_commands: [
                {
                    action: 'push' as const,
                    key: '社交',
                    value: {
                        id: 'npc_live_ai_name',
                        姓名: aiReturnedName,
                        性别: '女',
                        年龄: 18,
                        身份: '主要女角色',
                        是否主要角色: true,
                        是否在场: true,
                        简介: '外部 AI 端到端返回的主要女角色。'
                    }
                }
            ]
        };
        const result = 执行响应命令处理(
            commandResponse,
            {
                角色: 规范化角色物品容器映射({ 姓名: '真实端测少侠', 装备: {}, 物品列表: [] }),
                环境: 规范化环境信息({ 时间: '1:01:01:08:00', 大地点: '端测州', 具体地点: '前厅' }),
                社交: [],
                世界: { 地图层级: [] } as any,
                战斗: {} as any,
                玩家门派: {} as any,
                任务列表: [],
                约定列表: [],
                剧情: {} as any,
                剧情规划: {} as any
            },
            {
                规范化环境信息,
                规范化社交列表,
                规范化世界状态: (raw?: any) => raw || { 地图层级: [] },
                规范化战斗状态: (raw?: any) => raw || {},
                规范化门派状态: (raw?: any) => raw || {},
                规范化剧情状态: (raw?: any) => raw || {},
                规范化剧情规划状态: (raw?: any) => raw || {},
                规范化女主剧情规划状态: (raw?: any) => raw,
                规范化同人剧情规划状态: (raw?: any) => raw,
                规范化同人女主剧情规划状态: (raw?: any) => raw,
                规范化角色物品容器映射,
                战斗结束自动清空: (battle: any) => battle
            },
            { applyState: false }
        );
        const npc = result.社交.find((item: any) => item?.id === 'npc_live_ai_name');
        console.info(`[AI姓名真实端到端] AI原始输出=${rawContent.trim()}；提取姓名=${aiReturnedName}；最终入库=${npc?.姓名}`);
        expect(aiReturnedName).toMatch(/^[\u4e00-\u9fa5]{2,4}$/u);
        expect(提取命中女性姓名黑名单(aiReturnedName)).toHaveLength(0);
        expect(npc?.姓名).toBe(aiReturnedName);
    }, 120000);
});
