import { describe, expect, it } from 'vitest';
import { 补齐世界地图空间字段 } from '../utils/mapSpatial';

const 点在矩形内 = (point: { x: number; y: number }, rect: { minX: number; maxX: number; minY: number; maxY: number }) => (
    point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY
);

const 正交线段穿过矩形 = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    rect: { minX: number; maxX: number; minY: number; maxY: number }
) => {
    if (from.x === to.x) {
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        return from.x >= rect.minX && from.x <= rect.maxX && maxY >= rect.minY && minY <= rect.maxY;
    }
    if (from.y === to.y) {
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        return from.y >= rect.minY && from.y <= rect.maxY && maxX >= rect.minX && minX <= rect.maxX;
    }
    return true;
};

describe('地图空间道路规划', () => {
    it('会把模型给出的斜线道路改成避让建筑的正交路径', () => {
        const world = 补齐世界地图空间字段({
            地图层级: [{
                ID: 'layer_test',
                名称: '青松门',
                层级: '具体地点',
                网格宽度: 24,
                网格高度: 18,
                锚点坐标: { x: 0, y: 0 }
            }],
            地图建筑: [{
                ID: 'hall',
                名称: '宗门大殿',
                所在层级ID: 'layer_test',
                四角坐标: [
                    { x: 8, y: 5 },
                    { x: 16, y: 5 },
                    { x: 16, y: 12 },
                    { x: 8, y: 12 }
                ]
            }],
            地图道路: [{
                ID: 'bad_road',
                名称: '穿殿斜路',
                所在层级ID: 'layer_test',
                路径点: [
                    { x: 2, y: 2 },
                    { x: 22, y: 16 }
                ]
            }]
        } as any);
        const road = world.地图道路.find((item: any) => item.ID === 'bad_road')!;
        const rect = { minX: 7.9, maxX: 16.1, minY: 4.9, maxY: 12.1 };

        expect(road.路径点.length).toBeGreaterThan(2);
        road.路径点.forEach((point: any, index: number) => {
            expect(点在矩形内(point, rect)).toBe(false);
            const next = road.路径点[index + 1];
            if (!next) return;
            expect(point.x === next.x || point.y === next.y).toBe(true);
            expect(正交线段穿过矩形(point, next, rect)).toBe(false);
        });
    });
});
