import { describe, expect, it } from 'vitest';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';

describe('NPC 占位姓名归一化', () => {
    it('保留已经稳定的主要女性角色姓名，即使不在候选姓名库', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_custom_heroine',
                姓名: '顾明棠',
                性别: '女',
                身份: '玩家手动改名的同行者',
                简介: '顾明棠已经随主角同行多日。',
                是否主要角色: true,
                好感度: 80
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(1);
        expect(result[0].姓名).toBe('顾明棠');
    });

    it('保留老存档里已经存在的模板女性名', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_template_name',
                姓名: '苏婉儿',
                性别: '女',
                身份: '新登场女修',
                简介: '老存档中已经存在的模板名档案。',
                是否主要角色: true
            },
            {
                id: 'npc_custom_name',
                姓名: '沈折枝',
                性别: '女',
                身份: '已稳定承接的旧识',
                简介: '沈折枝此前已经正式登场。',
                是否主要角色: true
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(2);
        expect(result[0].姓名).toBe('苏婉儿');
        expect(result[1].姓名).toBe('沈折枝');
    });

    it('重复模板女性名会合并到单一稳定档案，避免同名 NPC 分裂', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_template_first',
                姓名: '苏婉儿',
                性别: '女',
                身份: '老存档角色一',
                简介: '老存档已经生成的模板名。',
                是否主要角色: true
            },
            {
                id: 'npc_template_second',
                姓名: '苏婉儿',
                性别: '女',
                身份: '老存档角色二',
                简介: '另一个老存档模板名角色。',
                是否主要角色: true
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(1);
        expect(result[0].姓名).toBe('苏婉儿');
        expect(result[0].id).toBe('npc_template_first');
        expect(result[0].简介).toContain('另一个老存档模板名角色');
    });

    it('重复稳定姓名会绑定到同一个人物档案，保留原 id', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_first',
                姓名: '顾明棠',
                性别: '女',
                身份: '先登场的主要角色',
                简介: '顾明棠已经建立稳定档案。',
                是否主要角色: true
            },
            {
                id: 'npc_second',
                姓名: '顾明棠',
                性别: '女',
                身份: '后登场的同名女修',
                简介: '另一个同名角色。',
                是否主要角色: true
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(1);
        expect(result[0].姓名).toBe('顾明棠');
        expect(result[0].id).toBe('npc_first');
        expect(result[0].简介).toContain('另一个同名角色');
    });

    it('把黑衣女人后续真名吸收到原档案', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_placeholder_woman',
                姓名: '黑衣女人',
                性别: '女',
                身份: '潜入永安宫的黑衣女子',
                简介: '在永安宫偏殿救下主角的黑衣女人。',
                当前位置: '永安宫偏殿',
                位置路径: '京城 > 永安宫 > 偏殿',
                好感度: 12,
                记忆: [{ 内容: '在永安宫偏殿与主角照面。', 时间: '0001:01:01:08:00' }]
            },
            {
                id: 'npc_linyuan',
                姓名: '林婉儿',
                性别: '女',
                身份: '潜入永安宫的黑衣女子',
                简介: '林婉儿正是此前在永安宫偏殿出现的黑衣女人。',
                当前位置: '永安宫偏殿',
                位置路径: '京城 > 永安宫 > 偏殿',
                好感度: 16,
                记忆: [{ 内容: '向主角承认自己名叫林婉儿。', 时间: '0001:01:01:08:10' }]
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('npc_placeholder_woman');
        expect(result[0].姓名).toBe('林婉儿');
        expect(result[0].简介).toContain('黑衣女人');
        expect(result[0].记忆.map((item: any) => item.内容).join('\n')).toContain('林婉儿');
    });

    it('把职责占位名后续真名吸收到原档案', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_yongan_eunuch',
                姓名: '永安宫掌事太监',
                性别: '男',
                身份: '永安宫掌事太监',
                简介: '负责迎送秀女入宫的掌事太监。',
                当前位置: '永安宫',
                位置路径: '京城 > 永安宫',
                记忆: [{ 内容: '在永安宫门前清点名册。', 时间: '0001:01:01:09:00' }]
            },
            {
                id: 'npc_xiaoduo',
                姓名: '萧铎',
                性别: '男',
                身份: '永安宫掌事太监',
                简介: '萧铎就是永安宫掌事太监，负责迎送秀女入宫。',
                当前位置: '永安宫',
                位置路径: '京城 > 永安宫',
                记忆: [{ 内容: '报上姓名萧铎。', 时间: '0001:01:01:09:05' }]
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('npc_yongan_eunuch');
        expect(result[0].姓名).toBe('萧铎');
        expect(result[0].身份).toContain('掌事太监');
    });

    it('不把两个没有占位关系的真名 NPC 合并', () => {
        const result = 规范化社交列表([
            {
                id: 'npc_linyuan',
                姓名: '林婉儿',
                性别: '女',
                身份: '永安宫宫女',
                简介: '永安宫值守宫女。',
                当前位置: '永安宫'
            },
            {
                id: 'npc_suxin',
                姓名: '苏清',
                性别: '女',
                身份: '永安宫宫女',
                简介: '永安宫另一名值守宫女。',
                当前位置: '永安宫'
            }
        ], { 合并同名: false });

        expect(result).toHaveLength(2);
        expect(result.map((item) => item.姓名)).toEqual(['林婉儿', '苏清']);
    });
});
