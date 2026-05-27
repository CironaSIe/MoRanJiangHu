import { describe, expect, it } from 'vitest';
import { 规范化角色物品容器映射, 规范化社交列表 } from '../hooks/useGame/stateTransforms';
import { 构建默认技艺, 获取默认技艺名称 } from '../utils/skillDefaults';

describe('skill defaults', () => {
    it('uses wuxia life and jianghu skills by default', () => {
        expect(获取默认技艺名称('武侠')).toEqual(['医术', '毒术', '机关', '采集', '鉴定', '易容', '潜行', '经商']);
        expect(构建默认技艺('武侠').map((item) => item.名称)).not.toContain('炼丹');
        expect(构建默认技艺('武侠').map((item) => item.名称)).not.toContain('炼器');
    });

    it('keeps alchemy and artifact crafting for xianxia mode only', () => {
        expect(获取默认技艺名称('仙侠')).toEqual(['炼器', '炼丹', '医术', '阵法', '符箓', '机关', '采集', '鉴定']);
        expect(获取默认技艺名称('灵气复苏')).toEqual(['急救', '驾驶', '维修', '调查', '谈判', '计算机', '采集', '鉴定']);
        expect(获取默认技艺名称('灵气修仙' as any)).toEqual(['急救', '驾驶', '维修', '调查', '谈判', '计算机', '采集', '鉴定']);
        expect(获取默认技艺名称('都市修仙')).toEqual(['急救', '驾驶', '维修', '调查', '谈判', '计算机', '潜行', '鉴定']);
    });

    it('uses modern and apocalypse skill sets for non-ancient modes', () => {
        expect(获取默认技艺名称('现代都市')).toEqual(['急救', '驾驶', '维修', '调查', '谈判', '计算机', '经商', '鉴定']);
        expect(获取默认技艺名称('末日丧尸')).toEqual(['急救', '维修', '驾驶', '搜索', '潜行', '射击', '近战', '谈判']);
    });

    it('does not inject xianxia crafting skills when normalizing empty wuxia role and npc skills', () => {
        const role = 规范化角色物品容器映射({ 姓名: '端测少侠', 技艺: [] });
        const [npc] = 规范化社交列表([{ 姓名: '赵青', 性别: '男', 技艺: [] }], { 合并同名: false });
        const roleNames = role.技艺.map((item) => item.名称);
        const npcNames = (npc.技艺 || []).map((item: any) => item.名称);

        expect(roleNames).toEqual(expect.arrayContaining(['医术', '毒术', '机关', '采集', '鉴定', '易容', '潜行', '经商']));
        expect(npcNames).toEqual(expect.arrayContaining(['医术', '毒术', '机关', '采集', '鉴定', '易容', '潜行', '经商']));
        expect(roleNames).not.toContain('炼丹');
        expect(roleNames).not.toContain('炼器');
        expect(npcNames).not.toContain('炼丹');
        expect(npcNames).not.toContain('炼器');
    });
});
