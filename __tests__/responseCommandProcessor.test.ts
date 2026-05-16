import { describe, expect, it } from 'vitest';
import { 执行响应命令处理, 响应命令处理状态 } from '../hooks/useGame/responseCommandProcessor';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';

const 构建基础状态 = (): 响应命令处理状态 => ({
    角色: { 姓名: '杨培强' } as any,
    环境: {} as any,
    社交: [],
    世界: {} as any,
    战斗: {} as any,
    玩家门派: {} as any,
    任务列表: [],
    约定列表: [],
    剧情: {} as any,
    剧情规划: {} as any
});

const deps = {
    规范化环境信息: (value?: any) => value || {},
    规范化社交列表,
    规范化世界状态: (value?: any) => value || {},
    规范化战斗状态: (value?: any) => value || {},
    规范化门派状态: (value?: any) => value || {},
    规范化剧情状态: (value?: any) => value || {},
    规范化剧情规划状态: (value?: any) => value || {},
    规范化女主剧情规划状态: (value?: any) => value,
    规范化同人剧情规划状态: (value?: any) => value,
    规范化同人女主剧情规划状态: (value?: any) => value,
    规范化角色物品容器映射: (value?: any) => value || {},
    战斗结束自动清空: (value?: any) => value || {}
};

describe('responseCommandProcessor dialogue social sync', () => {
    it('adds non-player dialogue speakers to social as dialogue NPCs for avatar backfill', () => {
        const state = 构建基础状态();
        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '院门外有人轻叩。' },
                { sender: '杨青儿', text: '兄长，前厅来客了。' },
                { sender: '杨培强', text: '我这就去。' },
                { sender: '【判定】', text: '无判定。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交).toHaveLength(1);
        expect(result.社交[0]).toMatchObject({
            姓名: '杨青儿',
            身份: '剧情对话人物',
            是否主要角色: false,
            是否在场: true,
            对白登场: true,
            自动补全头像: true
        });
        expect(result.社交[0].id).toMatch(/^npc_dialogue_/);
    });

    it('keeps existing social NPCs instead of duplicating dialogue speakers', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([{ id: 'npc_yang_qinger', 姓名: '杨青儿', 性别: '女' }], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '杨青儿', text: '兄长。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交).toHaveLength(1);
        expect(result.社交[0].id).toBe('npc_yang_qinger');
        expect(result.社交[0].对白登场).toBe(true);
        expect(result.社交[0].自动补全头像).toBe(true);
    });

    it('does not add narration fragments as dialogue NPCs', () => {
        const state = 构建基础状态();
        const result = 执行响应命令处理({
            logs: [
                { sender: '只能强辩', text: '我并非有意隐瞒。' },
                { sender: '杨青儿', text: '兄长，先别急。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交.map((npc: any) => npc.姓名)).toEqual(['杨青儿']);
    });
});

describe('responseCommandProcessor current scene presence sync', () => {
    it('keeps only NPCs confirmed in the current response as present', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            { id: 'npc_shen_ruoyan', 姓名: '沈若嫣', 性别: '女', 是否在场: false },
            { id: 'npc_bandit_a', 姓名: '水贼头目', 性别: '男', 是否在场: true },
            { id: 'npc_guard_a', 姓名: '兵器库守卫', 性别: '男', 是否在场: true }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '站在杨长风身侧的沈若嫣，那双清冷的桃花眼中，终于绽放出一抹明亮。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交.find((npc: any) => npc.姓名 === '沈若嫣')?.是否在场).toBe(true);
        expect(result.社交.find((npc: any) => npc.姓名 === '水贼头目')?.是否在场).toBe(false);
        expect(result.社交.find((npc: any) => npc.姓名 === '兵器库守卫')?.是否在场).toBe(false);
    });

    it('treats dialogue speakers as present and explicit offscreen mentions as absent', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            { id: 'npc_yang_qinger', 姓名: '杨青儿', 性别: '女', 是否在场: false },
            { id: 'npc_zhao_pingan', 姓名: '赵平安', 性别: '男', 是否在场: true }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '杨青儿', text: '兄长，账册已经带来了。' },
                { sender: '旁白', text: '赵平安仍在山门外待命，并不在堂中。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交.find((npc: any) => npc.姓名 === '杨青儿')?.是否在场).toBe(true);
        expect(result.社交.find((npc: any) => npc.姓名 === '赵平安')?.是否在场).toBe(false);
    });
});

describe('responseCommandProcessor team companion fallback', () => {
    it('marks named present companions as teammates when the story has them follow orders', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            { id: 'npc_chen_san', 姓名: '陈三', 性别: '男', 身份: '同门弟子', 是否在场: false, 是否队友: false },
            { id: 'npc_li_si', 姓名: '李四', 性别: '男', 身份: '同门弟子', 是否在场: false, 是否队友: false }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '杨培强带着陈三、李四随队潜入水中，沉声命他们出列听令。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交.find((npc: any) => npc.姓名 === '陈三')?.是否队友).toBe(true);
        expect(result.社交.find((npc: any) => npc.姓名 === '陈三')?.是否在场).toBe(true);
        expect(result.社交.find((npc: any) => npc.姓名 === '李四')?.是否队友).toBe(true);
        expect(result.社交.find((npc: any) => npc.姓名 === '李四')?.是否在场).toBe(true);
    });

    it('expands explicitly accompanying unnamed disciples into individual teammates', () => {
        const state = 构建基础状态();

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '杨培强率领十一名满身泥污的精锐弟子一同行动，众人随队听令。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        const companions = result.社交.filter((npc: any) => npc.是否队友 === true);
        expect(companions).toHaveLength(11);
        expect(companions.map((npc: any) => npc.姓名)).toEqual(
            Array.from({ length: 11 }, (_, index) => `随行者${index + 1}`)
        );
        expect(result.社交.some((npc: any) => npc.身份 === '随行队伍')).toBe(false);
    });

    it('renames an unnamed follower placeholder when the story later reveals their name', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            { id: 'npc_companion_old_1', 姓名: '随行者1', 性别: '未知', 身份: '随行者', 是否在场: true, 是否队友: true },
            { id: 'npc_companion_old_2', 姓名: '随行者2', 性别: '未知', 身份: '随行者', 是否在场: true, 是否队友: true }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '顾清河', text: '我来开路。' },
                { sender: '旁白', text: '顾清河仍随队听令，与另一名同门一同行动。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        const companions = result.社交.filter((npc: any) => npc.是否队友 === true);
        expect(companions).toHaveLength(2);
        expect(companions.some((npc: any) => npc.姓名 === '顾清河')).toBe(true);
        expect(companions.some((npc: any) => npc.姓名 === '随行者1')).toBe(false);
        expect(companions.some((npc: any) => npc.姓名 === '随行者2')).toBe(true);
    });

    it('does not rename follower placeholders with hostile dialogue senders', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            { id: 'npc_companion_old_1', 姓名: '随行者1', 性别: '未知', 身份: '随行者', 是否在场: true, 是否队友: true },
            { id: 'npc_enemy_guard', 姓名: '慕容氏守卫', 性别: '男', 身份: '守卫', 是否在场: true, 是否队友: false }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '慕容氏守卫', text: '站住，休想过去！' },
                { sender: '旁白', text: '慕容氏守卫拔刀拦住去路，敌方阵列围住杨培强。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交.find((npc: any) => npc.姓名 === '慕容氏守卫')?.是否队友).toBe(false);
        expect(result.社交.find((npc: any) => npc.姓名 === '随行者1')?.是否队友).toBe(true);
    });
});

describe('responseCommandProcessor female relationship target major role fallback', () => {
    it('marks newly generated female攻略对象 as a major role in the same turn', () => {
        const state = 构建基础状态();
        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '杨培强决定把苏晚晴锁定为攻略对象，后续重点推进她的关系线。' }
            ],
            tavern_commands: [
                {
                    action: 'push',
                    key: '社交',
                    value: {
                        id: 'npc_su_wanqing',
                        姓名: '苏晚晴',
                        性别: '女',
                        年龄: 19,
                        身份: '新登场的医女',
                        是否在场: true,
                        是否队友: false,
                        是否主要角色: false,
                        好感度: 15,
                        关系状态: '攻略对象',
                        简介: '本回合新登场，并被主角列为攻略目标。',
                        记忆: []
                    }
                }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交.find((npc: any) => npc.姓名 === '苏晚晴')?.是否主要角色).toBe(true);
    });

    it('marks an existing female NPC as major when relationship is established by story fact', () => {
        const state = 构建基础状态();
        state.环境 = { 时间: '五月初二 夜' } as any;
        state.社交 = 规范化社交列表([
            {
                id: 'npc_luo_qingci',
                姓名: '洛青瓷',
                性别: '女',
                年龄: 20,
                身份: '剑阁弟子',
                是否在场: true,
                是否主要角色: false,
                关系状态: '同伴',
                记忆: []
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '这一夜后，杨培强与洛青瓷正式确立关系，她不再只是普通同伴。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].是否主要角色).toBe(true);
    });
});

describe('responseCommandProcessor equipment guard', () => {
    it('blocks silent equipment clearing without an explicit removal trigger', () => {
        const state = 构建基础状态();
        state.角色 = {
            姓名: '杨培强',
            装备: {
                头部: '青布头巾',
                主武器: '青钢剑',
                坐骑: '黑马'
            }
        } as any;

        const result = 执行响应命令处理({
            logs: [{ sender: '旁白', text: '他继续赶路，并未整理行装。' }],
            tavern_commands: [
                { action: 'set', key: '角色.装备', value: { 头部: '无', 主武器: '无', 坐骑: '无' } }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect((result.角色 as any).装备.头部).toBe('青布头巾');
        expect((result.角色 as any).装备.主武器).toBe('青钢剑');
        expect((result.角色 as any).装备.坐骑).toBe('黑马');
    });

    it('allows equipment clearing when the story explicitly says the item was sold or removed', () => {
        const state = 构建基础状态();
        state.角色 = {
            姓名: '杨培强',
            装备: {
                主武器: '青钢剑'
            }
        } as any;

        const result = 执行响应命令处理({
            logs: [{ sender: '旁白', text: '他把青钢剑卖给铁匠，换了几两碎银。' }],
            tavern_commands: [
                { action: 'set', key: '角色.装备.主武器', value: '无' }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect((result.角色 as any).装备.主武器).toBe('无');
    });
});

describe('responseCommandProcessor inventory guard', () => {
    it('blocks silent inventory clearing without an explicit removal trigger', () => {
        const state = 构建基础状态();
        state.角色 = {
            姓名: '杨培强',
            物品列表: [
                { ID: 'item_sword', 名称: '青钢剑', 数量: 1 },
                { ID: 'item_pill', 名称: '回气丹', 数量: 3 }
            ]
        } as any;

        const result = 执行响应命令处理({
            logs: [{ sender: '旁白', text: '他继续赶路，并未整理行囊。' }],
            tavern_commands: [
                { action: 'set', key: '角色.物品列表', value: [] }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect((result.角色 as any).物品列表.map((item: any) => item.名称)).toEqual(['青钢剑', '回气丹']);
    });

    it('preserves inventory when a full role set omits the inventory list', () => {
        const state = 构建基础状态();
        state.角色 = {
            姓名: '杨培强',
            境界: '聚息境一重',
            物品列表: [
                { ID: 'item_token', 名称: '门派令牌', 数量: 1 }
            ]
        } as any;

        const result = 执行响应命令处理({
            logs: [{ sender: '旁白', text: '他打坐调息，气息更稳。' }],
            tavern_commands: [
                { action: 'set', key: '角色', value: { 姓名: '杨培强', 境界: '聚息境二重' } }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect((result.角色 as any).境界).toBe('聚息境二重');
        expect((result.角色 as any).物品列表.map((item: any) => item.名称)).toEqual(['门派令牌']);
    });

    it('blocks non-array inventory values that would normalize into an empty list', () => {
        const state = 构建基础状态();
        state.角色 = {
            姓名: '杨培强',
            物品列表: [
                { ID: 'item_map', 名称: '江南水路图', 数量: 1 }
            ]
        } as any;

        const result = 执行响应命令处理({
            logs: [{ sender: '旁白', text: '他观察水路，并未丢弃随身物件。' }],
            tavern_commands: [
                { action: 'set', key: '角色.物品列表', value: '无' },
                { action: 'set', key: '角色', value: { 姓名: '杨培强', 物品列表: null } }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect((result.角色 as any).物品列表.map((item: any) => item.名称)).toEqual(['江南水路图']);
    });

    it('allows inventory clearing when the story explicitly says the items were discarded', () => {
        const state = 构建基础状态();
        state.角色 = {
            姓名: '杨培强',
            物品列表: [
                { ID: 'item_scrap', 名称: '破布条', 数量: 2 }
            ]
        } as any;

        const result = 执行响应命令处理({
            logs: [{ sender: '旁白', text: '他把背包里的破布条全部丢弃，只留下空空的行囊。' }],
            tavern_commands: [
                { action: 'set', key: '角色.物品列表', value: [] }
            ]
        } as any, state, deps, undefined, { applyState: false });

        expect((result.角色 as any).物品列表).toEqual([]);
    });
});

describe('responseCommandProcessor NSFW female state fallback', () => {
    it('adds a womb record when explicit internal ejaculation facts are present without commands', () => {
        const state = 构建基础状态();
        state.环境 = { 时间: '三月十五日 夜' } as any;
        state.社交 = 规范化社交列表([
            {
                id: 'npc_lin_waner',
                姓名: '林婉儿',
                性别: '女',
                年龄: 18,
                境界: '聚息境三重',
                身份: '师妹',
                是否在场: true,
                是否队友: false,
                是否主要角色: true,
                好感度: 60,
                关系状态: '师妹',
                简介: '活泼清丽的小师妹。',
                记忆: [],
                小穴描述: '无名器：未经人事，花唇闭合得严严实实。',
                是否处女: true,
                子宫: {
                    状态: '未受孕',
                    宫口状态: '紧致',
                    内射记录: []
                }
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '林婉儿', text: '我不行了……' },
                { sender: '旁白', text: '杨培强闷哼一声，精液尽数射入了少女最深处的子宫口。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].子宫.内射记录).toHaveLength(1);
        expect(result.社交[0].子宫.内射记录[0]).toMatchObject({
            日期: '三月十五日 夜',
            怀孕判定日: '待判定'
        });
        expect(result.社交[0].子宫.内射记录[0].描述).toContain('体内射精事件');
        expect(result.社交[0].是否处女).toBe(false);
        expect(result.社交[0].初夜夺取者).toBe('杨培强');
        expect(result.社交[0].初夜时间).toBe('三月十五日 夜');
        expect(result.社交[0].初夜描述).toContain('初次亲密关系');
        expect(result.社交[0].小穴描述).toContain('原“未经人事”状态失效');
        expect(result.社交[0].小穴描述).not.toContain('未经人事，');
    });

    it('does not duplicate the same inferred womb record when processing is repeated', () => {
        const state = 构建基础状态();
        state.环境 = { 时间: '三月十五日 夜' } as any;
        state.社交 = 规范化社交列表([
            {
                id: 'npc_lin_waner',
                姓名: '林婉儿',
                性别: '女',
                年龄: 18,
                境界: '聚息境三重',
                身份: '师妹',
                是否在场: true,
                是否队友: false,
                是否主要角色: true,
                好感度: 60,
                关系状态: '师妹',
                简介: '活泼清丽的小师妹。',
                记忆: [],
                子宫: {
                    状态: '未受孕',
                    宫口状态: '紧致',
                    内射记录: [
                        {
                            日期: '三月十五日 夜',
                            描述: '杨培强与其发生体内射精事件：精液尽数射入了少女最深处的子宫口。',
                            怀孕判定日: '待判定'
                        }
                    ]
                }
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '杨培强闷哼一声，精液尽数射入了少女最深处的子宫口。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].子宫.内射记录).toHaveLength(1);
    });

    it('updates first-night and private part state for explicit intercourse facts without ejaculation', () => {
        const state = 构建基础状态();
        state.环境 = { 时间: '三月十六日 清晨' } as any;
        state.社交 = 规范化社交列表([
            {
                id: 'npc_lin_waner',
                姓名: '林婉儿',
                性别: '女',
                年龄: 18,
                境界: '聚息境三重',
                身份: '师妹',
                是否在场: true,
                是否队友: false,
                是否主要角色: true,
                好感度: 60,
                关系状态: '师妹',
                简介: '活泼清丽的小师妹。',
                记忆: [],
                小穴描述: '无名器：尚未完全开发，未经人事。',
                是否处女: true,
                子宫: {
                    状态: '未受孕',
                    宫口状态: '紧致',
                    内射记录: []
                }
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '杨培强进入了林婉儿体内，她的初夜在这一刻成为已发生的事实。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].是否处女).toBe(false);
        expect(result.社交[0].初夜夺取者).toBe('杨培强');
        expect(result.社交[0].初夜时间).toBe('三月十六日 清晨');
        expect(result.社交[0].小穴描述).toContain('原“未经人事”状态失效');
        expect(result.社交[0].子宫.内射记录).toHaveLength(0);
    });
});

describe('responseCommandProcessor NPC death fallback', () => {
    it('sets named dead NPC health and death state when the story confirms death without commands', () => {
        const state = 构建基础状态();
        state.环境 = { 时间: '四月初一 黄昏' } as any;
        state.社交 = 规范化社交列表([
            {
                id: 'npc_zhao_yunting',
                姓名: '赵云廷',
                性别: '男',
                年龄: 28,
                身份: '同门竞争者',
                是否在场: true,
                当前血量: 423,
                最大血量: 423,
                DEBUFF: []
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '赵云廷被杨培强一剑贯穿心脉，当场身亡。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].当前血量).toBe(0);
        expect(result.社交[0].状态).toBe('死亡');
        expect(result.社交[0].生死状态).toBe('死亡');
        expect(result.社交[0].生命状态).toBe('死亡');
        expect(result.社交[0].是否在场).toBe(false);
        expect(result.社交[0].死亡时间).toBe('四月初一 黄昏');
        expect(result.社交[0].DEBUFF.some((item: any) => item?.名称 === '死亡')).toBe(true);
    });

    it('does not mark death for negated or near-death wording', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            {
                id: 'npc_zhao_yunting',
                姓名: '赵云廷',
                性别: '男',
                是否在场: true,
                当前血量: 423,
                最大血量: 423,
                DEBUFF: []
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '赵云廷险些身亡，却终究保住性命，只是重伤倒地。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].当前血量).toBe(423);
        expect(result.社交[0].是否在场).toBe(true);
        expect(result.社交[0].DEBUFF.some((item: any) => item?.名称 === '死亡')).toBe(false);
    });

    it('chooses the victim instead of the attacker when both NPC names appear', () => {
        const state = 构建基础状态();
        state.社交 = 规范化社交列表([
            {
                id: 'npc_lin_waner',
                姓名: '林婉儿',
                性别: '女',
                是否在场: true,
                当前血量: 200,
                最大血量: 200,
                DEBUFF: []
            },
            {
                id: 'npc_zhao_yunting',
                姓名: '赵云廷',
                性别: '男',
                是否在场: true,
                当前血量: 423,
                最大血量: 423,
                DEBUFF: []
            }
        ], { 合并同名: false });

        const result = 执行响应命令处理({
            logs: [
                { sender: '旁白', text: '林婉儿一剑杀死了赵云廷，血光溅在石阶上。' }
            ],
            tavern_commands: []
        } as any, state, deps, undefined, { applyState: false });

        expect(result.社交[0].当前血量).toBe(200);
        expect(result.社交[0].状态).toBeUndefined();
        expect(result.社交[1].当前血量).toBe(0);
        expect(result.社交[1].状态).toBe('死亡');
    });
});
