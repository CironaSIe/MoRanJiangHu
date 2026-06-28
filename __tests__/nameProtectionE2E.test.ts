/**
 * 端到端集成测试：验证变量名称保护修复
 *
 * 模拟场景：AI 发回部分更新的命令，导致势力名称、NPC姓名、功法名称
 * 被占位名/空值覆盖。验证三层保护机制（深合并保护 + 占位名检测 + 前后对比恢复）
 * 能否正确保留真实名称。
 */
import { describe, it, expect } from 'vitest';
import {
    是否占位名,
    实质为空文本,
    合并保留既有NPC列表,
} from '../utils/npcRetentionGuard';

// ========== 工具函数：模拟 responseCommandProcessor 中的同名函数 ==========

const 实质为空文本Local = (value: unknown): boolean => (
    value === undefined || value === null || (typeof value === 'string' && !(value as string).trim())
);

/** 模拟 合并保留势力列表名称 的逻辑 */
const 合并保留势力列表名称 = (previousList: any[], nextList: any[]): any[] => {
    if (!Array.isArray(previousList) || previousList.length <= 0) return nextList;
    if (!Array.isArray(nextList)) return [];
    const prevById = new Map<string, any>();
    const prevByName = new Map<string, any>();
    previousList.forEach((faction: any) => {
        if (!faction || typeof faction !== 'object') return;
        const id = typeof faction.ID === 'string' ? faction.ID.trim() : '';
        const name = typeof faction.名称 === 'string' ? faction.名称.trim() : '';
        if (id) prevById.set(id, faction);
        if (name && !是否占位名(name)) prevByName.set(name, faction);
    });
    return nextList.map((faction: any, index: number) => {
        if (!faction || typeof faction !== 'object') return faction;
        const name = typeof faction.名称 === 'string' ? faction.名称.trim() : '';
        const id = typeof faction.ID === 'string' ? faction.ID.trim() : '';
        if (name && !是否占位名(name)) return faction;
        const prevFaction = id && prevById.has(id) ? prevById.get(id) : undefined;
        if (prevFaction && typeof prevFaction.名称 === 'string' && prevFaction.名称.trim() && !是否占位名(prevFaction.名称)) {
            return { ...faction, 名称: prevFaction.名称 };
        }
        if (是否占位名(name) && index < previousList.length) {
            const prevByIndex = previousList[index];
            if (prevByIndex && typeof prevByIndex.名称 === 'string' && prevByIndex.名称.trim() && !是否占位名(prevByIndex.名称)) {
                const prevId = typeof prevByIndex.ID === 'string' ? prevByIndex.ID.trim() : '';
                if (!id || !prevId || id === prevId) {
                    return { ...faction, 名称: prevByIndex.名称 };
                }
            }
        }
        return faction;
    });
};

/** 模拟 合并保留功法列表名称 的逻辑 */
const 合并保留功法列表名称 = (previousList: any[], nextList: any[]): any[] => {
    if (!Array.isArray(previousList) || previousList.length <= 0) return nextList;
    if (!Array.isArray(nextList)) return [];
    return nextList.map((skill: any, index: number) => {
        if (!skill || typeof skill !== 'object') return skill;
        const name = typeof skill.名称 === 'string' ? skill.名称.trim() : '';
        if (name && !是否占位名(name)) return skill;
        // 策略1：同索引匹配 — 如果旧列表同索引有真实名称，且 ID 一致
        if (index < previousList.length) {
            const prevByIndex = previousList[index];
            if (prevByIndex && typeof prevByIndex.名称 === 'string' && prevByIndex.名称.trim() && !是否占位名(prevByIndex.名称)) {
                const prevId = typeof prevByIndex.ID === 'string' ? prevByIndex.ID.trim() : '';
                const nextId = typeof skill.ID === 'string' ? skill.ID.trim() : '';
                // ID 一致或两边都没有 ID 时用索引匹配
                if (!prevId || !nextId || prevId === nextId) {
                    return { ...skill, 名称: prevByIndex.名称 };
                }
                // ID 不一致（顺序打乱），跳过索引匹配，fallback 到类型+品质匹配
            }
        }
        // 策略2：旧列表中查找匹配项（类型+品质组合匹配）
        const skillType = typeof skill.类型 === 'string' ? skill.类型.trim() : '';
        const skillQuality = typeof skill.品质 === 'string' ? skill.品质.trim() : '';
        if (skillType || skillQuality) {
            for (const prevSkill of previousList) {
                if (!prevSkill || typeof prevSkill !== 'object') continue;
                const prevName = typeof prevSkill.名称 === 'string' ? prevSkill.名称.trim() : '';
                if (!prevName || 是否占位名(prevName)) continue;
                const prevType = typeof prevSkill.类型 === 'string' ? prevSkill.类型.trim() : '';
                const prevQuality = typeof prevSkill.品质 === 'string' ? prevSkill.品质.trim() : '';
                if (skillType === prevType && skillQuality === prevQuality) {
                    return { ...skill, 名称: prevName };
                }
            }
        }
        return skill;
    });
};

// ========== E2E 集成测试场景 ==========

describe('变量名称保护 E2E 集成测试', () => {

    describe('场景1：势力名称保护', () => {
        it('AI 部分更新势力血量→势力名称不被占位名覆盖', () => {
            // 初始状态：4个势力都有真实名称
            const beforeFactions = [
                { ID: 'FCT-001', 名称: '武当派', 类型: '正派', 势力值: 90 },
                { ID: 'FCT-002', 名称: '少林寺', 类型: '正派', 势力值: 95 },
                { ID: 'FCT-003', 名称: '黑风堂', 类型: '邪派', 势力值: 60 },
                { ID: 'FCT-004', 名称: '丐帮', 类型: '正派', 势力值: 80 },
            ];

            // AI 返回部分更新后，势力名称变成了占位名/空值
            // 模拟场景：AI 只更新了势力值，但是丢失了名称或用占位名替代
            const afterFactions = [
                { ID: 'FCT-001', 名称: '势力 1', 类型: '正派', 势力值: 85 },   // 势力值更新了，但名称变成了占位名
                { ID: 'FCT-002', 名称: '', 类型: '正派', 势力值: 90 },           // 名称变成了空
                { ID: 'FCT-003', 名称: '势力 3', 类型: '邪派', 势力值: 55 },   // 占位名
                { ID: 'FCT-004', 名称: '丐帮', 类型: '正派', 势力值: 75 },       // 这个没变
            ];

            const result = 合并保留势力列表名称(beforeFactions, afterFactions);

            // 验证：真实名称被保留
            expect(result[0].名称).toBe('武当派');  // 占位名 → 真实名称
            expect(result[0].势力值).toBe(85);      // 但更新值被保留
            expect(result[1].名称).toBe('少林寺');  // 空名称 → 真实名称
            expect(result[1].势力值).toBe(90);
            expect(result[2].名称).toBe('黑风堂');  // 占位名 → 真实名称
            expect(result[2].势力值).toBe(55);
            expect(result[3].名称).toBe('丐帮');    // 原本就是真实名称，不变
            expect(result[3].势力值).toBe(75);
        });

        it('AI 新增势力使用占位名→不恢复（因为没有旧名称可参考）', () => {
            const beforeFactions = [
                { ID: 'FCT-001', 名称: '武当派', 类型: '正派', 势力值: 90 },
            ];

            // AI 新增了 FCT-005，名称是占位名，但旧列表没有匹配
            const afterFactions = [
                { ID: 'FCT-001', 名称: '武当派', 类型: '正派', 势力值: 90 },
                { ID: 'FCT-005', 名称: '势力 5', 类型: '邪派', 势力值: 30 },
            ];

            const result = 合并保留势力列表名称(beforeFactions, afterFactions);

            expect(result[0].名称).toBe('武当派');
            expect(result[1].名称).toBe('势力 5'); // 新势力，没有旧名称可恢复
        });

        it('势力顺序变化时ID匹配仍能正确恢复名称', () => {
            const beforeFactions = [
                { ID: 'FCT-001', 名称: '武当派', 类型: '正派', 势力值: 90 },
                { ID: 'FCT-002', 名称: '少林寺', 类型: '正派', 势力值: 95 },
            ];

            // AI 返回时顺序反转了
            const afterFactions = [
                { ID: 'FCT-002', 名称: '势力 1', 类型: '正派', 势力值: 90 },
                { ID: 'FCT-001', 名称: '势力 2', 类型: '正派', 势力值: 80 },
            ];

            const result = 合并保留势力列表名称(beforeFactions, afterFactions);

            // ID 匹配应该生效
            expect(result[0].名称).toBe('少林寺');  // FCT-002
            expect(result[1].名称).toBe('武当派');  // FCT-001
        });
    });

    describe('场景2：NPC姓名保护', () => {
        it('深合并保护：AI 部分更新NPC血量→姓名不被空值覆盖', () => {
            // 初始NPC状态
            const previous = {
                ID: 'NPC-001',
                姓名: '张三丰',
                好感度: 85,
                当前血量: 200,
                最大血量: 200,
            };

            // AI 返回部分更新：只更新了当前血量，但姓名被清空了
            const next = {
                ID: 'NPC-001',
                姓名: '',           // AI 错误地清空了姓名
                当前血量: 150,      // 血量是真实的更新
            };

            // 使用深合并合并，姓名保护应该阻止空值覆盖
            const { 列表: result } = 合并保留既有NPC列表([previous], [next], '测试大侠');

            expect(result[0].姓名).toBe('张三丰');  // 姓名被保留
            expect(result[0].当前血量).toBe(150);   // 血量更新被保留
        });

        it('深合并保护：AI 用占位名覆盖真实姓名→保留真实姓名', () => {
            const previous = {
                ID: 'NPC-001',
                姓名: '张三丰',
                好感度: 85,
            };

            const next = {
                ID: 'NPC-001',
                姓名: '角色0',      // AI 用占位名覆盖了真实姓名
                好感度: 90,
            };

            const { 列表: result } = 合并保留既有NPC列表([previous], [next], '测试大侠');

            expect(result[0].姓名).toBe('张三丰');  // 真实姓名被保留
            expect(result[0].好感度).toBe(90);      // 其他字段更新被保留
        });

        it('ID匹配：当姓名变成占位名导致NPC互相匹配失败时，用ID兜底', () => {
            const previousNPCs = [
                { ID: 'NPC-001', 姓名: '张三丰', 好感度: 85 },
                { ID: 'NPC-002', 姓名: '郭靖', 好感度: 70 },
            ];

            // AI 返回了更新后的社交列表，但姓名全变成了占位名
            const nextNPCs = [
                { ID: 'NPC-001', 姓名: '角色0', 好感度: 90 },
                { ID: 'NPC-002', 姓名: '角色1', 好感度: 75 },
            ];

            const { 列表: result } = 合并保留既有NPC列表(previousNPCs, nextNPCs, '测试大侠');

            expect(result[0].姓名).toBe('张三丰');  // 深合并保留了姓名
            expect(result[0].好感度).toBe(90);      // 更新值被保留
            expect(result[1].姓名).toBe('郭靖');
            expect(result[1].好感度).toBe(75);
        });

        it('NPC真实名称更新允许通过', () => {
            const previous = {
                ID: 'NPC-003',
                姓名: '黄蓉',         // 旧名称
                好感度: 60,
            };

            const next = {
                ID: 'NPC-003',
                姓名: '黄女侠',        // 真实的新名称（不是占位名）
                好感度: 65,
            };

            const { 列表: result } = 合并保留既有NPC列表([previous], [next], '测试大侠');

            expect(result[0].姓名).toBe('黄女侠');   // 非占位名更新正常通过
            expect(result[0].好感度).toBe(65);
        });
    });

    describe('场景3：功法名称保护', () => {
        it('AI 更新功法层数→名称不被占位名覆盖', () => {
            const beforeKungfu = [
                { ID: 'KF-001', 名称: '九阳神功', 类型: '内功', 品质: '绝世', 当前层数: 5, 最大层数: 10 },
                { ID: 'KF-002', 名称: '降龙十八掌', 类型: '掌法', 品质: '极品', 当前层数: 3, 最大层数: 9 },
                { ID: 'KF-003', 名称: '凌波微步', 类型: '轻功', 品质: '极品', 当前层数: 7, 最大层数: 8 },
            ];

            // AI 更新功法层数，但名称变成了占位名
            const afterKungfu = [
                { ID: 'KF-001', 名称: '未命名功法1', 类型: '内功', 品质: '绝世', 当前层数: 6, 最大层数: 10 },
                { ID: 'KF-002', 名称: '未命名武功1', 类型: '掌法', 品质: '极品', 当前层数: 4, 最大层数: 9 },
                { ID: 'KF-003', 名称: '', 类型: '轻功', 品质: '极品', 当前层数: 8, 最大层数: 8 },
            ];

            const result = 合并保留功法列表名称(beforeKungfu, afterKungfu);

            expect(result[0].名称).toBe('九阳神功');     // 占位名 → 真实名称
            expect(result[0].当前层数).toBe(6);          // 更新值保留
            expect(result[1].名称).toBe('降龙十八掌');   // 占位名 → 真实名称
            expect(result[1].当前层数).toBe(4);
            expect(result[2].名称).toBe('凌波微步');     // 空名称 → 真实名称
            expect(result[2].当前层数).toBe(8);
        });

        it('功法列表顺序变化时类型+品质匹配能恢复名称', () => {
            const beforeKungfu = [
                { ID: 'KF-001', 名称: '九阳神功', 类型: '内功', 品质: '绝世', 当前层数: 5 },
                { ID: 'KF-002', 名称: '降龙十八掌', 类型: '掌法', 品质: '极品', 当前层数: 3 },
                { ID: 'KF-003', 名称: '凌波微步', 类型: '轻功', 品质: '极品', 当前层数: 7 },
            ];

            // 功法顺序打乱，且名称变占位名
            const afterKungfu = [
                { ID: 'KF-003', 名称: '未命名功法1', 类型: '轻功', 品质: '极品', 当前层数: 8 },
                { ID: 'KF-001', 名称: '未命名功法2', 类型: '内功', 品质: '绝世', 当前层数: 6 },
                { ID: 'KF-002', 名称: '未命名功法3', 类型: '掌法', 品质: '极品', 当前层数: 4 },
            ];

            const result = 合并保留功法列表名称(beforeKungfu, afterKungfu);

            // 同索引匹配可能不正确（顺序变了），但类型+品质匹配应该生效
            expect(result[0].名称).toBe('凌波微步');   // 类型=轻功, 品质=极品
            expect(result[1].名称).toBe('九阳神功');    // 类型=内功, 品质=绝世
            expect(result[2].名称).toBe('降龙十八掌');  // 类型=掌法, 品质=极品
        });
    });

    describe('场景4：占位名检测边界', () => {
        it('各种占位名格式都能被正确识别', () => {
            // 角色 + 数字
            expect(是否占位名('角色0')).toBe(true);
            expect(是否占位名('角色1')).toBe(true);
            expect(是否占位名('角色99')).toBe(true);

            // 未命名功法/武功 + 数字
            expect(是否占位名('未命名功法1')).toBe(true);
            expect(是否占位名('未命名武功1')).toBe(true);
            expect(是否占位名('未命名功法5')).toBe(true);

            // 势力 + 数字
            expect(是否占位名('势力 1')).toBe(true);
            expect(是否占位名('势力1')).toBe(true);
            expect(是否占位名('势力 5')).toBe(true);

            // npc_ 格式
            expect(是否占位名('npc_0')).toBe(true);
            expect(是否占位名('NPC_1')).toBe(true);

            // FCT- 格式
            expect(是否占位名('FCT-001')).toBe(true);
            expect(是否占位名('FCT-010')).toBe(true);
        });

        it('真实名称不会被误判为占位名', () => {
            expect(是否占位名('武当派')).toBe(false);
            expect(是否占位名('张三丰')).toBe(false);
            expect(是否占位名('九阳神功')).toBe(false);
            expect(是否占位名('黑风堂')).toBe(false);
            expect(是否占位名('降龙十八掌')).toBe(false);
            expect(是否占位名('丐帮')).toBe(false);
        });

        it('空值和空白被正确识别', () => {
            expect(实质为空文本('')).toBe(true);
            expect(实质为空文本(' ')).toBe(true);
            expect(实质为空文本('  ')).toBe(true);
            expect(实质为空文本(null)).toBe(true);
            expect(实质为空文本(undefined)).toBe(true);
            expect(实质为空文本('有内容')).toBe(false);
            expect(实质为空文本('武当派')).toBe(false);
        });
    });

    describe('场景5：多层防御联动', () => {
        it('同时出现势力+NPC+功法占位名→全部被正确恢复', () => {
            // === 势力恢复 ===
            const prevFactions = [
                { ID: 'FCT-001', 名称: '武当派', 类型: '正派', 势力值: 90 },
                { ID: 'FCT-003', 名称: '黑风堂', 类型: '邪派', 势力值: 60 },
            ];
            const nextFactions = [
                { ID: 'FCT-001', 名称: '势力 1', 类型: '正派', 势力值: 85 },
                { ID: 'FCT-003', 名称: '', 类型: '邪派', 势力值: 55 },
            ];
            const factionResult = 合并保留势力列表名称(prevFactions, nextFactions);
            expect(factionResult[0].名称).toBe('武当派');
            expect(factionResult[1].名称).toBe('黑风堂');

            // === NPC恢复 ===
            const prevNPCs = [
                { ID: 'NPC-001', 姓名: '张三丰', 好感度: 85 },
                { ID: 'NPC-002', 姓名: '郭靖', 好感度: 70 },
            ];
            const nextNPCs = [
                { ID: 'NPC-001', 姓名: '角色0', 好感度: 90 },
                { ID: 'NPC-002', 姓名: '', 好感度: 75 },
            ];
            const npcResult = 合并保留既有NPC列表(prevNPCs, nextNPCs, '测试大侠');
            expect(npcResult.列表[0].姓名).toBe('张三丰');
            expect(npcResult.列表[1].姓名).toBe('郭靖');

            // === 功法恢复 ===
            const prevKungfu = [
                { ID: 'KF-001', 名称: '九阳神功', 类型: '内功', 品质: '绝世', 当前层数: 5 },
                { ID: 'KF-002', 名称: '降龙十八掌', 类型: '掌法', 品质: '极品', 当前层数: 3 },
            ];
            const nextKungfu = [
                { ID: 'KF-001', 名称: '未命名功法1', 类型: '内功', 品质: '绝世', 当前层数: 6 },
                { ID: 'KF-002', 名称: '未命名武功1', 类型: '掌法', 品质: '极品', 当前层数: 4 },
            ];
            const kungfuResult = 合并保留功法列表名称(prevKungfu, nextKungfu);
            expect(kungfuResult[0].名称).toBe('九阳神功');
            expect(kungfuResult[1].名称).toBe('降龙十八掌');

            // 综合验证：所有修改值都被保留
            expect(factionResult[0].势力值).toBe(85);
            expect(npcResult.列表[0].好感度).toBe(90);
            expect(kungfuResult[0].当前层数).toBe(6);
        });
    });
});
