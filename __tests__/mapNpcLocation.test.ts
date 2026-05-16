import { describe, expect, it } from 'vitest';
import {
    NPC属于地图视图,
    NPC显式位置命中任一,
    选择NPC匹配地图节点,
} from '../utils/mapNpcLocation';

const nodes = [
    { ID: 'inn', 名称: '悦来客栈' },
    { ID: 'smith', 名称: '铁匠铺' },
] as any;

describe('地图 NPC 位置匹配', () => {
    it('会把同一城镇内有明确当前位置的 NPC 分配到对应建筑', () => {
        const npc = { 姓名: '张铁匠', 当前位置: '铁匠铺', 是否在场: false };

        const matched = 选择NPC匹配地图节点(npc, nodes, {
            env: { 小地点: '东市坊', 具体地点: '悦来客栈' },
            currentLocationName: '悦来客栈',
        });

        expect(matched?.ID).toBe('smith');
    });

    it('只写是否在场的 NPC 会兜底到当前具体地点', () => {
        const npc = { 姓名: '小二', 是否在场: true };

        const matched = 选择NPC匹配地图节点(npc, nodes, {
            env: { 小地点: '东市坊', 具体地点: '悦来客栈' },
            currentLocationName: '悦来客栈',
        });

        expect(matched?.ID).toBe('inn');
    });

    it('有明确远处位置的 NPC 不会因为是否在场兜底到当前房间', () => {
        const npc = { 姓名: '巡城卫', 当前位置: '城门', 是否在场: true };

        expect(NPC显式位置命中任一(npc, ['悦来客栈'])).toBe(false);
        expect(NPC属于地图视图(npc, [], {
            env: { 小地点: '东市坊', 具体地点: '悦来客栈' },
            currentLocationName: '悦来客栈',
            viewNodeName: '悦来客栈',
            viewPathNames: ['中原', '洛阳城', '东市坊', '悦来客栈'],
        })).toBe(false);
    });
});

