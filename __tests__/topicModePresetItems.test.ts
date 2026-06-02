import { describe, expect, it } from 'vitest';
import type { 物品类型 } from '../models/item';
import type { 题材模式类型 } from '../models/system';
import { 预置物品图片列表 } from '../data/presetItemImages';
import {
    结构化物品库,
    获取题材模式预设物品库,
    题材模式预设物品名称清单,
} from '../data/structuredItemLibrary';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

const 必备类型覆盖: Record<题材模式类型, 物品类型[]> = {
    武侠: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '杂物'],
    仙侠: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '法宝', '杂物'],
    西方奇幻: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '杂物'],
    灵气复苏: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '法宝', '杂物'],
    都市修仙: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '法宝', '杂物'],
    现代都市: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '杂物'],
    末日丧尸: ['武器', '防具', '消耗品', '材料', '秘籍', '任务道具', '杂物'],
    无限流: ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '任务道具', '法宝', '杂物'],
};

describe('题材模式预设物品清单', () => {
    it('每个题材模式都有覆盖主要物品类型的规范清单', () => {
        for (const mode of 题材模式顺序) {
            const items = 获取题材模式预设物品库(mode);
            const types = new Set(items.map((item) => item.类型));

            expect(items.length, `${mode} 清单不能为空`).toBeGreaterThan(0);
            for (const type of 必备类型覆盖[mode]) {
                expect(types.has(type), `${mode} 缺少 ${type}`).toBe(true);
            }
        }
    });

    it('清单中的名称都存在于结构化物品库，且所有结构化条目至少归属一个题材模式', () => {
        const structuredNames = new Set(结构化物品库.map((item) => item.名称));
        const assignedNames = new Set<string>();

        for (const [mode, names] of Object.entries(题材模式预设物品名称清单)) {
            const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
            expect(duplicateNames, `${mode} 有重复物品`).toEqual([]);
            for (const name of names) {
                expect(structuredNames.has(name), `${mode} 引用了不存在的物品 ${name}`).toBe(true);
                assignedNames.add(name);
            }
        }

        const unassigned = 结构化物品库
            .filter((item) => !assignedNames.has(item.名称))
            .map((item) => item.名称);
        expect(unassigned).toEqual([]);
    });

    it('结构化物品库全部有图床预置图，避免运行时重复生图', () => {
        const imageNames = new Set(
            预置物品图片列表
                .filter((item) => /^https?:\/\//.test(item.图片URL))
                .map((item) => item.名称)
        );
        const missingImages = 结构化物品库
            .filter((item) => !imageNames.has(item.名称))
            .map((item) => item.名称);

        expect(missingImages).toEqual([]);
    });

    it('现代与末日预设清单不混入古风修仙基础补给', () => {
        const forbidden = ['辟谷丹', '回气丹', '凝元丹', '破境丹', '紫铜丹炉', '玄铁丹炉'];
        for (const mode of ['现代都市', '末日丧尸'] as 题材模式类型[]) {
            const names = 获取题材模式预设物品库(mode).map((item) => item.名称);
            for (const name of forbidden) {
                expect(names, `${mode} 不应包含 ${name}`).not.toContain(name);
            }
        }
    });

    it('无限流预设清单支持跨题材主神兑换物资', () => {
        const names = 获取题材模式预设物品库('无限流').map((item) => item.名称);
        expect(names).toContain('轮回者腕表');
        expect(names).toContain('主神能量碎片');
        expect(names).toContain('基因锁训练手册');
        expect(names).toContain('枪械速成模块');
        expect(names).toContain('病毒抑制剂');
        expect(names).toContain('感染检测卡');
        expect(names).toContain('玉骨扇');
        expect(names).toContain('下品灵石');
        expect(names).toContain('治疗药水');
    });
});
