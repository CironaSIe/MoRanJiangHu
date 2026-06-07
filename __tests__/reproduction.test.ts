import { describe, expect, it } from 'vitest';
import {
    构建体内射精记录,
    推进社交孕产状态,
    计算受孕概率
} from '../utils/reproduction';

const 构建成年女性 = (overrides: any = {}) => ({
    id: 'npc_test_1',
    姓名: '赵青1',
    性别: '女',
    年龄: 22,
    境界: '炼气一层',
    身份: '青云门弟子',
    是否在场: true,
    是否队友: false,
    是否主要角色: true,
    好感度: 60,
    关系状态: '伴侣',
    简介: '用于孕产系统测试的成年女性角色。',
    记忆: [],
    ...overrides
});

describe('reproduction system', () => {
    it('raises conception probability as internal ejaculation count increases during menstrual period', () => {
        const once = 计算受孕概率({ 次数: 1, 是否生理期: true });
        const threeTimes = 计算受孕概率({ 次数: 3, 是否生理期: true });

        expect(once).toBeGreaterThan(0);
        expect(threeTimes).toBeGreaterThan(once);
        expect(计算受孕概率({ 次数: 10, 是否生理期: false })).toBe(0);
    });

    it('records menstrual-period facts with the parsed count and probability', () => {
        const npc = 构建成年女性();
        const record = 构建体内射精记录({
            npc,
            子宫: {
                生理周期: {
                    基准日期: '1:01:01:00:00',
                    周期天数: 28,
                    生理期天数: 5
                }
            },
            日期: '1:01:01:00:00',
            描述: '生理期内同一阶段发生三次体内射精事件。',
            父亲姓名: '杨培强',
            事件文本: '生理期内同一阶段发生三次体内射精事件。'
        });

        expect(record.次数).toBe(3);
        expect(record.是否生理期).toBe(true);
        expect(record.受孕概率).toBe(计算受孕概率({ 次数: 3, 是否生理期: true }));
    });

    it('settles pregnancy and creates one child NPC when pregnancy reaches birth time', () => {
        const mother = 构建成年女性({
            子宫: {
                状态: '未受孕',
                宫口状态: '稳定',
                生理周期: {
                    基准日期: '1:01:01:00:00',
                    周期天数: 28,
                    生理期天数: 5
                },
                内射记录: [
                    {
                        日期: '1:01:01:00:00',
                        描述: '测试',
                        怀孕判定日: '1:01:01:00:00',
                        次数: 30,
                        是否生理期: true,
                        父亲姓名: '杨培强',
                        判定结果: '未判定'
                    }
                ]
            }
        });

        const pregnantList = 推进社交孕产状态([mother], {
            当前时间: '1:01:01:00:00',
            事件文本: '',
            父亲姓名: '杨培强'
        });
        const pregnantMother = pregnantList[0];

        expect(pregnantMother.子宫.妊娠).toMatchObject({
            已生产: false,
            父亲姓名: '杨培强'
        });
        expect(pregnantMother.子宫.妊娠.预计生产时间).toBeTruthy();

        const birthList = 推进社交孕产状态(pregnantList, {
            当前时间: pregnantMother.子宫.妊娠.预计生产时间,
            事件文本: '',
            父亲姓名: '杨培强'
        });

        expect(birthList).toHaveLength(2);
        expect(birthList[0].子宫.状态).toBe('产后恢复');
        expect(birthList[0].子宫.妊娠.已生产).toBe(true);
        expect(birthList[0].子宫.产后记录[0].子嗣ID).toBe(birthList[1].id);
        expect(birthList[1]).toMatchObject({
            年龄: 0,
            关系状态: '子嗣'
        });

        const repeated = 推进社交孕产状态(birthList, {
            当前时间: pregnantMother.子宫.妊娠.预计生产时间,
            事件文本: '',
            父亲姓名: '杨培强'
        });
        expect(repeated.filter((npc: any) => npc?.关系状态 === '子嗣')).toHaveLength(1);
    });

    it('allows explicit time-acceleration birth before the original due date', () => {
        const pregnantMother = 构建成年女性({
            子宫: {
                状态: '妊娠一月',
                宫口状态: '妊娠期闭合',
                内射记录: [],
                妊娠: {
                    状态: '妊娠一月',
                    受孕时间: '1:01:01:00:00',
                    预计生产时间: '1:11:01:00:00',
                    父亲姓名: '杨培强',
                    已生产: false
                }
            }
        });

        const result = 推进社交孕产状态([pregnantMother], {
            当前时间: '1:02:01:00:00',
            事件文本: '她借时间加速秘法催生，提前生产并诞下一名孩子。',
            父亲姓名: '杨培强'
        });

        expect(result).toHaveLength(2);
        expect(result[0].子宫.状态).toBe('产后恢复');
        expect(result[1].关系状态).toBe('子嗣');
    });
});
