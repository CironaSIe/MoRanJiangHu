import { describe, expect, it } from 'vitest';
import { 补齐世界地图空间字段 } from '../utils/mapSpatial';
import { 规范化任务列表自动结算 } from '../utils/taskCompat';

describe('用户反馈问题端到端回归', () => {
    it('会合并无限流同一生存倒计时任务，避免重复出现存活至天亮类任务', () => {
        const tasks = 规范化任务列表自动结算([
            {
                ID: 'main-survive',
                标题: '主神任务倒计时',
                类型: '主线',
                描述: '任务世界《荒怨民宅》：存活至天亮。',
                发布人: '主神',
                当前状态: '进行中',
                目标列表: [{ 描述: '在荒怨民宅中存活24小时', 当前进度: 0, 总需进度: 1 }]
            },
            {
                ID: 'dup-survive-title',
                标题: '存活至天亮',
                类型: '支线',
                描述: '团队成员提醒所有轮回者撑过第一夜。',
                发布人: '资深者',
                当前状态: '进行中',
                目标列表: [{ 描述: '活到天亮', 当前进度: 0, 总需进度: 1 }]
            },
            {
                ID: 'dup-survive-24h',
                标题: '在荒怨民宅中存活24小时',
                类型: '支线',
                描述: '轮回小队重复记录的主线任务。',
                发布人: '队长',
                当前状态: '进行中',
                目标列表: [{ 描述: '第一夜不要死亡', 当前进度: 0, 总需进度: 1 }]
            }
        ]);

        expect(tasks).toHaveLength(1);
        expect(tasks[0].标题).toBe('主神任务倒计时');
    });

    it('同一个角色只保留一个最细地图落点，不会同时出现在父级和子级', () => {
        const world = 补齐世界地图空间字段({
            地图层级: [
                { ID: 'world', 名称: '主神空间', 层级: '寰宇', 网格宽度: 40, 网格高度: 30 },
                { ID: 'hall', 名称: '主神大厅', 层级: '大地点', 父级ID: 'world', 网格宽度: 32, 网格高度: 24 },
                { ID: 'room', 名称: '队伍休息室', 层级: '子地点', 父级ID: 'hall', 网格宽度: 20, 网格高度: 16 }
            ],
            地图建筑: [],
            地图道路: [],
            地图人物: [
                { ID: 'p-parent', 名称: '林越', 关联NPC: 'player-1', 所在层级ID: 'hall', 坐标: { x: 6, y: 6 }, 是否当前玩家: true },
                { ID: 'p-leaf', 名称: '林越', 关联NPC: 'player-1', 所在层级ID: 'room', 坐标: { x: 9, y: 9 }, 是否当前玩家: true },
                { ID: 'npc-parent', 名称: '叶青', 关联NPC: 'npc-ye-qing', 所在层级ID: 'hall', 坐标: { x: 8, y: 8 } },
                { ID: 'npc-leaf', 名称: '叶青', 关联NPC: 'npc-ye-qing', 所在层级ID: 'room', 坐标: { x: 10, y: 10 } }
            ]
        } as any);

        const playerSpots = world.地图人物.filter((person: any) => person.关联NPC === 'player-1');
        const npcSpots = world.地图人物.filter((person: any) => person.关联NPC === 'npc-ye-qing');

        expect(playerSpots).toHaveLength(1);
        expect(playerSpots[0].所在层级ID).toBe('room');
        expect(npcSpots).toHaveLength(1);
        expect(npcSpots[0].所在层级ID).toBe('room');
    });
});
