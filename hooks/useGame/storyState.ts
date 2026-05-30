import type {
    WorldGenConfig,
    世界数据结构,
    战斗状态结构,
    详细门派结构,
    剧情系统结构,
    剧情规划结构,
    女主剧情规划结构,
    同人剧情规划结构,
    同人女主剧情规划结构,
    环境信息结构,
    聊天记录结构,
    角色数据结构,
    记忆系统结构,
    OpeningConfig
} from '../../types';
import { 补齐世界地图空间字段 } from '../../utils/mapSpatial';
import { 职位等级排序 } from '../../models/sect';
import type { 任务结构, 任务状态 } from '../../models/task';
import { 归一化六维到境界预算 } from '../../utils/attributeBudget';
import { 修复开局伙伴社交列表 } from '../../utils/openingCompanion';
import { buildWorldMapLayersFromDraft } from '../../utils/newGameDiy';
import { 构建默认技艺 } from '../../utils/skillDefaults';

export type 开场命令基态 = {
    角色: 角色数据结构;
    环境: 环境信息结构;
    社交: any[];
    世界: 世界数据结构;
    战斗: 战斗状态结构;
    玩家门派: 详细门派结构;
    任务列表: any[];
    约定列表: any[];
    剧情: 剧情系统结构;
    剧情规划: 剧情规划结构;
    女主剧情规划?: 女主剧情规划结构;
    同人剧情规划?: 同人剧情规划结构;
    同人女主剧情规划?: 同人女主剧情规划结构;
};

const 取文本 = (value: any, fallback = ''): string => (
    typeof value === 'string' ? value.trim() : fallback
);

const 取数字 = (value: any, fallback = 0): number => {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
};

const 生成稳定哈希 = (text: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const 按种子取项 = <T,>(items: T[], seed: number, offset = 0): T => (
    items[Math.abs(seed + offset) % items.length]
);

const 含幕后生成占位文本 = (value: any): boolean => (
    typeof value === 'string' && /待\s*AI|AI\s*生成|请由AI|开局模板|不得沿用固定|待AI生成|待AI评定|待AI评估/u.test(value)
);

const 门派职位贡献门槛: Record<string, number> = {
    杂役弟子: 0,
    外门弟子: 100,
    内门弟子: 350,
    真传弟子: 900,
    执事: 1600,
    长老: 3200,
    副掌门: 6500,
    掌门: 12000,
};

const 标准门派职位列表 = ['杂役弟子', '外门弟子', '内门弟子', '真传弟子', '执事', '长老', '副掌门', '掌门'];

const 补全门派职位 = (source: any, totalContribution = 0, fallback = '无'): string => {
    const customOrganizationKind = 推导组织语义(source);
    const explicitCustomRank = [
        source?.玩家职位,
        source?.门派职位,
        source?.弟子等级,
        source?.弟子级别,
        source?.弟子身份,
        source?.身份,
    ].map((item) => 取文本(item)).find(Boolean);
    if (customOrganizationKind && explicitCustomRank && !标准门派职位列表.includes(explicitCustomRank)) {
        return explicitCustomRank;
    }
    let contributionRank = fallback !== '无' || totalContribution > 0 ? '杂役弟子' : '无';
    Object.entries(门派职位贡献门槛).forEach(([rank, required]) => {
        if (totalContribution >= required) contributionRank = rank;
    });
    const candidates = [
        source?.玩家职位,
        source?.门派职位,
        source?.弟子等级,
        source?.弟子级别,
        source?.弟子身份,
        source?.身份,
        fallback,
    ].map((item) => 取文本(item)).filter(Boolean);
    const exact = candidates.find((item) => 标准门派职位列表.includes(item));
    if (exact) {
        const exactRequired = 门派职位贡献门槛[exact] ?? 0;
        if (totalContribution < exactRequired) return contributionRank;
        return (职位等级排序[contributionRank] || 0) > (职位等级排序[exact] || 0) ? contributionRank : exact;
    }
    const matched = candidates
        .map((item) => 标准门派职位列表.find((rank) => item.includes(rank)))
        .find(Boolean);
    if (matched) {
        const matchedRequired = 门派职位贡献门槛[matched] ?? 0;
        if (totalContribution < matchedRequired) return contributionRank;
        return (职位等级排序[contributionRank] || 0) > (职位等级排序[matched] || 0) ? contributionRank : matched;
    }
    if (fallback !== '无') {
        return (职位等级排序[contributionRank] || 0) > (职位等级排序[fallback] || 0) ? contributionRank : fallback;
    }
    return contributionRank;
};

const 取布尔 = (value: any, fallback = false): boolean => (
    typeof value === 'boolean' ? value : fallback
);

const 取字符串数组 = (value: any): string[] => (
    Array.isArray(value)
        ? value
            .map((item) => 取文本(item))
            .filter(Boolean)
        : []
);

const 无门派文本集合 = new Set(['', 'none', '无', '无门派', '无门无派', '尚未加入任何门派', '江湖散人', '散修', '无所属门派']);

export const 是否无门派标识 = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    const normalized = typeof value === 'string' ? value.trim().replace(/\s+/g, '') : String(value).trim();
    return 无门派文本集合.has(normalized);
};

type 组织题材 = '营地' | '组织' | '宗门' | '门派' | '';

const 推导组织语义 = (source?: any, openingConfig?: OpeningConfig): 组织题材 => {
    const explicit = 取文本(source?.组织语义 || source?.组织类型 || source?.题材组织类型);
    if (['营地', '组织', '宗门', '门派'].includes(explicit)) return explicit as 组织题材;
    if (openingConfig?.题材模式 === '末日丧尸') return '营地';
    if (openingConfig?.题材模式 === '现代都市') return '组织';
    if (openingConfig?.题材模式 === '仙侠') return '宗门';
    const text = [
        source?.ID,
        source?.名称,
        source?.玩家职位,
        source?.门派职位,
        source?.简介,
        ...(Array.isArray(source?.门规) ? source.门规 : []),
        ...(Array.isArray(source?.兑换列表) ? source.兑换列表.map((item: any) => `${item?.物品名称 || ''}${item?.类型 || ''}${item?.要求职位 || ''}`) : []),
        ...(Array.isArray(source?.藏经阁列表) ? source.藏经阁列表.map((item: any) => `${item?.名称 || ''}${item?.类型 || ''}${item?.简介 || ''}${item?.要求职位 || ''}`) : []),
        ...(Array.isArray(source?.重要成员) ? source.重要成员.map((item: any) => `${item?.身份 || ''}${item?.境界 || ''}${item?.简介 || ''}`) : [])
    ].map((item) => 取文本(item)).filter(Boolean).join(' ');
    if (/末日|丧尸|感染|尸群|营地|避难|安全点|据点|车队|哨站|救援站|搜救|巡逻|后勤|弹药|口粮|净水|燃油|维修|隔离/u.test(text)) return '营地';
    if (/现代|都市|公司|项目组|事务所|社区中心|门店|合作团队|合同|客户|技术成员|行政联系人|外勤成员|电脑|手机|培训|项目/u.test(text)) return '组织';
    if (/仙宗|剑宗|道院|灵门|玄府|真宫|炼气|筑基|灵根|灵力|符箓|御气/u.test(text)) return '宗门';
    return '';
};

const 规范化章节时间校准 = (value: any): 剧情系统结构['章节时间校准'] => (
    Array.isArray(value)
        ? value
            .map((item: any) => ({
                关联分解组: Math.max(1, 取数字(item?.关联分解组, 1)),
                原始起始时间: 取文本(item?.原始起始时间),
                校准后起始时间: 取文本(item?.校准后起始时间),
                校准来源时间: 取文本(item?.校准来源时间)
            }))
            .filter((item) => item.原始起始时间 || item.校准后起始时间)
        : []
);

const 取数字数组 = (value: any): number[] => (
    Array.isArray(value)
        ? value
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item))
        : []
);

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const 创建开场空白角色 = (): 角色数据结构 => ({
    姓名: '',
    头像图片URL: '',
    性别: '男',
    年龄: 16,
    出生日期: '',
    外貌: '',
    性格: '',
    称号: '',
    境界: '',
    境界层级: 1,
    灵根: '',
    灵根资质: '',
    当前灵力: 0,
    最大灵力: 0,
    当前神识: 0,
    最大神识: 0,
    丹田状态: '',
    道基状态: '',
    心魔值: 0,
    功德: 0,
    业力: 0,
    天赋列表: [],
    出身背景: { 名称: '', 描述: '', 效果: '' },
    所属门派ID: 'none',
    门派职位: '无',
    门派贡献: 0,
    金钱: { 金元宝: 0, 银子: 0, 铜钱: 0 },
    当前精力: 0,
    最大精力: 0,
    当前内力: 0,
    最大内力: 0,
    当前饱腹: 0,
    最大饱腹: 0,
    当前口渴: 0,
    最大口渴: 0,
    当前负重: 0,
    最大负重: 0,
    当前坐标X: 0,
    当前坐标Y: 0,
    力量: 0,
    敏捷: 0,
    体质: 0,
    根骨: 0,
    悟性: 0,
    福源: 0,
    头部当前血量: 0,
    头部最大血量: 0,
    头部状态: '',
    胸部当前血量: 0,
    胸部最大血量: 0,
    胸部状态: '',
    腹部当前血量: 0,
    腹部最大血量: 0,
    腹部状态: '',
    左手当前血量: 0,
    左手最大血量: 0,
    左手状态: '',
    右手当前血量: 0,
    右手最大血量: 0,
    右手状态: '',
    左腿当前血量: 0,
    左腿最大血量: 0,
    左腿状态: '',
    右腿当前血量: 0,
    右腿最大血量: 0,
    右腿状态: '',
    装备: {
        头部: '无',
        胸部: '无',
        盔甲: '无',
        内衬: '无',
        腿部: '无',
        手部: '无',
        足部: '无',
        主武器: '无',
        副武器: '无',
        暗器: '无',
        背部: '无',
        腰部: '无',
        坐骑: '无'
    },
    物品列表: [],
    功法列表: [],
    技艺: 构建默认技艺('武侠'),
    当前经验: 0,
    升级经验: 0,
    玩家BUFF: [],
    突破条件: []
});

export const 创建空门派状态 = (): 详细门派结构 => ({
    ID: 'none',
    名称: '无门无派',
    简介: '尚未加入任何门派。',
    门规: [],
    门派资金: 0,
    门派物资: 0,
    建设度: 0,
    门派等级: '无',
    门派规模: '无',
    弟子总数: 0,
    战力分布: {},
    财富评级: '无',
    月俸规则: {
        基础俸禄: 0,
        贡献系数: 0,
        规模系数: 0,
        发放说明: '未加入门派时没有月俸。'
    },
    上次俸禄月份: '',
    玩家职位: '无',
    玩家贡献: 0,
    累计贡献: 0,
    任务列表: [],
    兑换列表: [],
    藏经阁列表: [],
    重要成员: []
});

export const 创建占位门派状态 = (charData: 角色数据结构): 详细门派结构 => {
    if (是否无门派标识(charData?.所属门派ID) || (charData?.门派职位 !== undefined && 是否无门派标识(charData?.门派职位))) {
        return 创建空门派状态();
    }
    return {
        ...创建空门派状态(),
        ID: charData.所属门派ID,
        玩家职位: 补全门派职位(charData, 取数字(charData.门派贡献), '杂役弟子'),
        玩家贡献: 取数字(charData.门派贡献),
        累计贡献: 取数字(charData.门派贡献)
    };
};

const 创建默认门派任务列表 = (sectName: string, seed = 0, openingConfig?: OpeningConfig): 详细门派结构['任务列表'] => {
    const isApocalypse = openingConfig?.题材模式 === '末日丧尸';
    const isModern = openingConfig?.题材模式 === '现代都市';
    const location = isApocalypse
        ? 按种子取项(['营地外哨', '废弃商超', '临时药房', '封锁线路口', '净水点', '车队停靠点'], seed, 3)
        : isModern
            ? 按种子取项(['办公室', '社区门口', '客户现场', '地铁站口', '合作门店', '资料室'], seed, 3)
            : 按种子取项(['山门外市集', '旧驿道', '外务堂', '藏经阁前院', '灵田边', '后山栈道'], seed, 3);
    const trouble = isApocalypse
        ? 按种子取项(['补给短缺', '夜巡空档', '伤员隔离', '路线失联', '噪音引尸', '燃油不足'], seed, 7)
        : isModern
            ? 按种子取项(['客户催办', '资料缺口', '邻里矛盾', '预算卡点', '外勤变故', '舆情压力'], seed, 7)
            : 按种子取项(['商队纠纷', '药材短缺', '散修试探', '旧账未清', '阵纹失修', '弟子争执'], seed, 7);
    const issuer = isApocalypse ? '营地值班组' : isModern ? '组织协调人' : '外务堂';
    const rewardItem = isApocalypse ? '净水包 x1' : isModern ? '交通卡 x1' : '辟谷丹 x1';
    const trialTitle = isApocalypse ? '结伴搜救' : isModern ? '外勤协作' : '门中历练';
    const trialDesc = isApocalypse
        ? `${sectName}安排成员结伴处理外出风险，目标会随附近尸群、物资点和路线变化，可从队友名录中挑选同行者。`
        : isModern
            ? `${sectName}安排成员结伴处理外勤事务，目标会随客户、社区和城市事件变化，可从成员名录中挑选协作者。`
            : `${sectName}安排年轻弟子结伴历练，目标会随附近局势变化，可从同门名录中挑选同行者。`;
    return [
    {
        id: 'sect_default_patrol',
        标题: `${location}巡查`,
        描述: `${sectName}近日受${trouble}牵动，${issuer}需要成员去${location}查明缘由，并把结果回报。`,
        类型: '日常',
        难度: '1星',
        发布日期: '1:01:01:00:00',
        截止日期: '1:01:03:23:59',
        刷新日期: '每日',
        奖励贡献: 35,
        奖励资金: 80,
        奖励物品: [rewardItem],
        当前状态: '可接取'
    },
    {
        id: 'sect_default_gather',
        标题: `${trouble}委托`,
        描述: `${sectName}内部正在处理${trouble}，此事牵连主角当前处境与成员关系，适合接下后顺势追查。`,
        类型: '建设',
        难度: '1星',
        发布日期: '1:01:01:00:00',
        截止日期: '1:01:05:23:59',
        刷新日期: '每旬',
        奖励贡献: 55,
        奖励资金: 120,
        奖励物品: [isApocalypse ? '消毒绷带 x1' : isModern ? '急救包 x1' : '回气丹 x1'],
        当前状态: '可接取'
    },
    {
        id: 'sect_default_trial',
        标题: trialTitle,
        描述: trialDesc,
        类型: '历练',
        难度: '2星',
        发布日期: '1:01:01:00:00',
        截止日期: '1:01:10:23:59',
        刷新日期: '每月',
        奖励贡献: 120,
        奖励资金: 260,
        奖励物品: [isApocalypse ? '备用电池组 x1' : isModern ? '备用手机 x1' : '凝元丹 x1'],
        当前状态: '可接取'
    }
];
};

const 门派任务状态转任务状态 = (status: string): 任务状态 => {
    if (status === '已完成') return '已完成';
    if (status === '已失败' || status === '已过期') return '已失败';
    return '进行中';
};

const 从门派任务创建通用任务列表 = (sectName: string, missions: 详细门派结构['任务列表'], openingConfig?: OpeningConfig): 任务结构[] => {
    const isTopicOrganization = openingConfig?.题材模式 === '末日丧尸' || openingConfig?.题材模式 === '现代都市';
    return (
    Array.isArray(missions) ? missions.map((mission) => ({
        标题: 取文本(mission?.标题, isTopicOrganization ? '组织事务' : '门派差遣'),
        描述: 取文本(mission?.描述, `${sectName}交付的一桩${isTopicOrganization ? '组织事务' : '门中事务'}。`),
        类型: isTopicOrganization ? '支线' : '门派',
        发布人: sectName,
        发布地点: sectName,
        推荐境界: 取文本(mission?.难度, isTopicOrganization ? '按组织事务' : '按门派差遣'),
        截止时间: 取文本(mission?.截止日期) || undefined,
        当前状态: 门派任务状态转任务状态(取文本(mission?.当前状态)),
        目标列表: [{
            描述: 取文本(mission?.描述, mission?.标题 || (isTopicOrganization ? '处理组织事务' : '处理门派事务')),
            当前进度: mission?.当前状态 === '已完成' ? 1 : 0,
            总需进度: 1,
            完成状态: mission?.当前状态 === '已完成'
        }],
        奖励描述: [
            mission?.奖励贡献 ? (isTopicOrganization ? `组织信用 +${mission.奖励贡献}` : `门派贡献 +${mission.奖励贡献}`) : '',
            mission?.奖励资金 ? (isTopicOrganization ? `资源额度 +${mission.奖励资金}` : `铜钱 +${mission.奖励资金}`) : '',
            ...(Array.isArray(mission?.奖励物品) ? mission.奖励物品 : [])
        ].filter(Boolean),
        剧情暗线: `${isTopicOrganization ? '组织事务' : '门派任务'}：${sectName}的「${取文本(mission?.标题, isTopicOrganization ? '组织事务' : '门派差遣')}」必须结合当前剧情、地点、在场人物与${isTopicOrganization ? '组织近况' : '门派近况'}推进。`
    })) : []
);
};

const 任务去重键 = (task: any): string => [
    取文本(task?.类型),
    取文本(task?.标题),
    Array.isArray(task?.目标列表) ? task.目标列表.map((item: any) => 取文本(item?.描述)).join('|') : 取文本(task?.描述)
].join('::').replace(/\s+/g, '');

const 去重开局任务列表 = (tasks: 任务结构[]): 任务结构[] => {
    const seen = new Set<string>();
    return tasks.filter((task) => {
        const key = 任务去重键(task);
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const 创建开局主线任务 = (sect: 详细门派结构, openingConfig?: OpeningConfig): 任务结构 => {
    const topic = openingConfig?.题材模式;
    const organizationName = 是否无门派标识(sect?.ID) ? '' : 取文本(sect?.名称);
    const publisher = organizationName || (topic === '末日丧尸' ? '求生本能' : topic === '现代都市' ? '现实处境' : topic === '仙侠' ? '问道路引' : '江湖因缘');
    const location = organizationName || (topic === '末日丧尸' ? '临时落脚点' : topic === '现代都市' ? '当前城市' : topic === '仙侠' ? '当前落脚处' : '当前落脚处');
    if (topic === '末日丧尸') {
        return {
            标题: '守住第一夜',
            描述: `${publisher}的第一晚还不稳，主角需要确认水源、药品、哨位和撤离路线，先把能活到天亮的基础秩序立起来。`,
            类型: '主线',
            发布人: publisher,
            发布地点: location,
            推荐境界: '新手求生',
            当前状态: '进行中',
            目标列表: [{
                描述: '确认一处可用水源、一份基础急救物资和夜间警戒安排。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }],
            奖励描述: ['组织信用 +80', '净水包 x1', '急救熟练度 +8', '可分配属性点 +1'],
            剧情暗线: '主线：第一夜奖励必须由营地值班者、队友或主角亲自清点发放；完成时正文要写清谁确认、谁递交物资，以及净水包和成长点已经到账。'
        };
    }
    if (topic === '现代都市') {
        return {
            标题: '站稳第一步',
            描述: `${publisher}当前有一件小但必须处理的现实事务，主角需要先完成一次可信交付，证明自己能在这座城市里站稳。`,
            类型: '主线',
            发布人: publisher,
            发布地点: location,
            推荐境界: '现实起步',
            当前状态: '进行中',
            目标列表: [{
                描述: '完成一次现场确认、资料交接或关键沟通。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }],
            奖励描述: ['组织信用 +60', '交通卡 x1', '谈判熟练度 +6', '可分配属性点 +1'],
            剧情暗线: '主线：完成后要由负责人、合作方或现场联系人确认成果，并在正文里写清交通卡、信用和技艺成长如何交到主角手上。'
        };
    }
    if (topic === '仙侠') {
        return {
            标题: '问道初途',
            描述: `${publisher}给出的第一条路并不宏大，主角需要先完成一次入门试炼，确认自身资质、心性与眼前道途的承接。`,
            类型: '主线',
            发布人: publisher,
            发布地点: location,
            推荐境界: '入门',
            当前状态: '进行中',
            目标列表: [{
                描述: '完成一次入门试炼、灵气感应或基础差遣。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }],
            奖励描述: ['门派贡献 +80', '清心丹 x1', '鉴定熟练度 +8', '可分配属性点 +1'],
            剧情暗线: '主线：完成后要由师长、执事或引路人当面确认并发放奖励；物品、贡献、技艺成长与可分配属性点都要在正文和变量里落实。'
        };
    }
    return {
        标题: '初入江湖',
        描述: `${publisher}交到眼前的第一件事并不惊天动地，却足以让主角开始在江湖里留下自己的脚印。`,
        类型: '主线',
        发布人: publisher,
        发布地点: location,
        推荐境界: '初入江湖',
        当前状态: '进行中',
        目标列表: [{
            描述: '完成一次眼前差遣、拜访或小规模历练。',
            当前进度: 0,
            总需进度: 1,
            完成状态: false
        }],
        奖励描述: ['门派贡献 +70', '金疮药 x1', '医术熟练度 +6', '可分配属性点 +1'],
        剧情暗线: '主线：完成后要由发布人或见证者确认成果，并在正文里写清奖励如何交付、物品如何入包、技艺和属性点如何提升。'
    };
};

const 确保开局主线任务 = (tasks: 任务结构[], sect: 详细门派结构, openingConfig?: OpeningConfig): 任务结构[] => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    if (safeTasks.some((task) => 取文本(task?.类型) === '主线')) return safeTasks;
    return [创建开局主线任务(sect, openingConfig), ...safeTasks];
};

const 创建默认聚宝阁商品 = (): 详细门派结构['兑换列表'] => ([
    { id: 'sect_shop_bigu', 物品名称: '辟谷丹', 类型: '丹药', 兑换价格: 30, 库存: 12, 要求职位: '杂役弟子' },
    { id: 'sect_shop_huiqi', 物品名称: '回气丹', 类型: '丹药', 兑换价格: 70, 库存: 8, 要求职位: '外门弟子' },
    { id: 'sect_shop_ningyuan', 物品名称: '凝元丹', 类型: '丹药', 兑换价格: 120, 库存: 6, 要求职位: '外门弟子' },
    { id: 'sect_shop_pojing', 物品名称: '破境丹', 类型: '丹药', 兑换价格: 320, 库存: 2, 要求职位: '内门弟子' },
    { id: 'sect_shop_practice_sword', 物品名称: '青锋短剑', 类型: '装备', 兑换价格: 160, 库存: 3, 要求职位: '外门弟子' }
]);

const 创建默认仙侠聚宝阁商品 = (): 详细门派结构['兑换列表'] => ([
    { id: 'sect_shop_bigu_xx', 物品名称: '辟谷丹', 类型: '丹药', 兑换价格: 30, 库存: 12, 要求职位: '杂役弟子' },
    { id: 'sect_shop_yinqi', 物品名称: '引气丹', 类型: '丹药', 兑换价格: 80, 库存: 8, 要求职位: '外门弟子' },
    { id: 'sect_shop_juling', 物品名称: '聚灵丹', 类型: '丹药', 兑换价格: 140, 库存: 6, 要求职位: '外门弟子' },
    { id: 'sect_shop_zhuji', 物品名称: '筑基丹', 类型: '丹药', 兑换价格: 420, 库存: 2, 要求职位: '内门弟子' },
    { id: 'sect_shop_hunyuan', 物品名称: '混元丹', 类型: '丹药', 兑换价格: 760, 库存: 1, 要求职位: '真传弟子' },
    { id: 'sect_shop_qingxin', 物品名称: '清心丹', 类型: '丹药', 兑换价格: 180, 库存: 4, 要求职位: '外门弟子' },
    { id: 'sect_shop_fan', 物品名称: '玉骨扇', 类型: '法器', 兑换价格: 260, 库存: 1, 要求职位: '外门弟子' }
]);

const 创建默认营地物资列表 = (): 详细门派结构['兑换列表'] => ([
    { id: 'camp_supply_water', 物品名称: '净水包', 类型: '材料', 兑换价格: 20, 库存: 18, 要求职位: '营地成员' },
    { id: 'camp_supply_bandage', 物品名称: '消毒绷带', 类型: '材料', 兑换价格: 35, 库存: 10, 要求职位: '营地成员' },
    { id: 'camp_supply_battery', 物品名称: '备用电池组', 类型: '材料', 兑换价格: 60, 库存: 6, 要求职位: '巡逻队员' },
    { id: 'camp_supply_tool', 物品名称: '维修工具箱', 类型: '装备', 兑换价格: 120, 库存: 2, 要求职位: '维修工' },
    { id: 'camp_supply_mask', 物品名称: '防护口罩', 类型: '装备', 兑换价格: 45, 库存: 12, 要求职位: '营地成员' }
] as any);

const 创建默认现代组织资源列表 = (): 详细门派结构['兑换列表'] => ([
    { id: 'org_supply_phone', 物品名称: '备用手机', 类型: '装备', 兑换价格: 80, 库存: 3, 要求职位: '成员' },
    { id: 'org_supply_card', 物品名称: '交通卡', 类型: '材料', 兑换价格: 25, 库存: 12, 要求职位: '成员' },
    { id: 'org_supply_contract', 物品名称: '合同文件', 类型: '材料', 兑换价格: 40, 库存: 6, 要求职位: '行政联系人' },
    { id: 'org_supply_kit', 物品名称: '急救包', 类型: '材料', 兑换价格: 70, 库存: 4, 要求职位: '外勤成员' },
    { id: 'org_supply_laptop', 物品名称: '笔记本电脑', 类型: '装备', 兑换价格: 240, 库存: 1, 要求职位: '技术成员' }
] as any);

const 提取门派典籍前缀 = (sectName: string): string => {
    const compact = 取文本(sectName, '本门').replace(/(山庄|剑派|武馆|仙宗|剑宗|道院|灵门|玄府|真宫|宗|派|门|帮|堂|堡|庄|院|府)$/u, '');
    return compact || 取文本(sectName, '本门');
};

const 创建默认藏经阁列表 = (sectName = '本门', openingConfig?: OpeningConfig): NonNullable<详细门派结构['藏经阁列表']> => {
    const seed = 生成稳定哈希(`${sectName}|${openingConfig?.题材模式 || ''}|藏经阁`);
    const prefix = 提取门派典籍前缀(sectName);
    if (openingConfig?.题材模式 === '末日丧尸') {
        return [
            {
                id: `camp_doc_${生成稳定哈希(`${sectName}|infection`).toString(36)}`,
                名称: `${prefix}感染防护手册`,
                类型: '防护训练',
                品阶: '基础',
                简介: `${sectName}整理的隔离、咬伤处理、血污清理和噪音控制流程，适合新成员先读。`,
                要求职位: '营地成员',
                要求累计贡献: 0
            },
            {
                id: `camp_doc_${生成稳定哈希(`${sectName}|shooting`).toString(36)}`,
                名称: `${prefix}基础枪械演练`,
                类型: '射击训练',
                品阶: '进阶',
                简介: `${sectName}用于教授持枪姿势、短点射、换弹、枪声管控和弹药节约的演练资料。`,
                要求职位: '外勤成员',
                要求累计贡献: 120
            },
            {
                id: `camp_doc_${生成稳定哈希(`${sectName}|rescue`).toString(36)}`,
                名称: `${prefix}搜救路线课`,
                类型: '搜救训练',
                品阶: '进阶',
                简介: `${sectName}标注安全屋、物资点、尸群绕行线和撤离信号，供一线搜救队复盘使用。`,
                要求职位: '搜救队员',
                要求累计贡献: 260
            }
        ] as any;
    }
    if (openingConfig?.题材模式 === '现代都市') {
        return [
            {
                id: `org_doc_${生成稳定哈希(`${sectName}|coordination`).toString(36)}`,
                名称: `${prefix}现场协调手册`,
                类型: '培训资料',
                品阶: '基础',
                简介: `${sectName}沉淀的沟通、记录、排期和风险报备方法，帮助成员把现实事务办稳。`,
                要求职位: '成员',
                要求累计贡献: 0
            },
            {
                id: `org_doc_${生成稳定哈希(`${sectName}|tech`).toString(36)}`,
                名称: `${prefix}设备维护课`,
                类型: '技能培训',
                品阶: '进阶',
                简介: `${sectName}用于教授电脑、手机、监控和常用设备排障的内部培训资料。`,
                要求职位: '技术成员',
                要求累计贡献: 120
            },
            {
                id: `org_doc_${生成稳定哈希(`${sectName}|field`).toString(36)}`,
                名称: `${prefix}外勤应急指南`,
                类型: '外勤训练',
                品阶: '进阶',
                简介: `${sectName}整理的路线规划、现场沟通、急救和突发事件留证流程。`,
                要求职位: '外勤成员',
                要求累计贡献: 260
            }
        ] as any;
    }
    const isXianxia = openingConfig?.题材模式 === '仙侠';
    const martialStyle = 按种子取项(
        isXianxia
            ? ['剑诀', '玄功', '御气诀', '灵息诀', '符剑诀']
            : ['剑法', '刀法', '拳谱', '掌法', '枪诀', '腿法'],
        seed
    );
    const innerStyle = 按种子取项(
        isXianxia ? ['凝真心法', '归元诀', '清虚吐纳篇', '抱朴灵息法'] : ['养息功', '归元心法', '听风内功', '沉炉劲'],
        seed,
        7
    );
    const movementStyle = 按种子取项(
        isXianxia ? ['流云步', '踏星步', '御风身法', '轻烟遁法'] : ['轻身步', '掠影步', '燕回身法', '穿林步'],
        seed,
        13
    );
    return [
        {
            id: `sect_lib_${生成稳定哈希(`${sectName}|entry`).toString(36)}`,
            名称: `${prefix}入门${martialStyle}`,
            类型: martialStyle.includes('步') || martialStyle.includes('身') ? '身法' : '功法',
            品阶: '凡品',
            简介: `${sectName}给新进弟子打基础的入门典籍，招路贴合本门传承，不再沿用固定青云模板。`,
            要求职位: '杂役弟子',
            要求累计贡献: 0
        },
        {
            id: `sect_lib_${生成稳定哈希(`${sectName}|inner`).toString(36)}`,
            名称: `${prefix}${innerStyle}`,
            类型: '心法',
            品阶: '良品',
            简介: `${sectName}藏经阁常见的内修法门，用来稳住气息与根基。`,
            要求职位: '外门弟子',
            要求累计贡献: 120
        },
        {
            id: `sect_lib_${生成稳定哈希(`${sectName}|movement`).toString(36)}`,
            名称: `${prefix}${movementStyle}`,
            类型: '身法',
            品阶: '良品',
            简介: `${sectName}弟子外出行走时常修的身法，重在趋避、追击与赶路。`,
            要求职位: '外门弟子',
            要求累计贡献: 260
        }
    ];
};

const 功法品质权重: Record<string, number> = { 凡品: 1, 良品: 2, 上品: 3, 极品: 4, 绝世: 5, 传说: 6 };

const 从藏经阁条目创建功法 = (book: any, sectName: string) => {
    const bookName = 取文本(book?.名称, '未命名典籍');
    const inferredType = bookName.includes('剑') ? '剑法' : 取文本(book?.类型, '功法');
    const typeMap: Record<string, string> = { 功法: '招式', 剑法: '招式', 刀法: '招式', 拳法: '招式', 身法: '轻功', 心法: '内功', 杂学: '被动' };
    const quality = 功法品质权重[取文本(book?.品阶)] ? 取文本(book?.品阶) : '凡品';
    return {
        ID: `sect_${取文本(book?.id, bookName)}`,
        来源藏经ID: 取文本(book?.id),
        名称: bookName,
        描述: 取文本(book?.简介, '藏经阁所藏典籍。'),
        类型: typeMap[inferredType] || '招式',
        品质: quality,
        来源: `${sectName || '门派'}藏经阁`,
        当前重数: 1,
        最高重数: 10,
        当前熟练度: 0,
        升级经验: 100,
        突破条件: '勤修不辍，实战参悟',
        境界限制: 取文本(book?.要求职位, '无'),
        大成方向: '稳固根基',
        圆满效果: `${bookName}圆满后可强化对应武学表现。`,
        武器限制: [],
        消耗类型: inferredType === '心法' ? '内力' : '精力',
        消耗数值: 0,
        施展耗时: '1息',
        冷却时间: '0息',
        基础伤害: 0,
        加成属性: inferredType === '身法' ? '敏捷' : inferredType === '心法' ? '根骨' : '力量',
        加成系数: 0,
        内力系数: inferredType === '心法' ? 1 : 0,
        伤害类型: inferredType === '心法' ? '内功' : '物理',
        目标类型: '自身',
        最大目标数: 1,
        重数描述映射: [{ 重数: 1, 描述: 取文本(book?.简介, '初窥门径。') }],
        附带效果: [],
        被动修正: [],
        境界特效: []
    };
};

const 创建开局散修基础功法 = (charData: 角色数据结构) => {
    const backgroundName = 取文本((charData as any)?.出身背景?.名称);
    const source = backgroundName ? `${backgroundName}旧学` : '开局经历';
    return {
        ID: 'opening_basic_breath',
        名称: '基础吐纳诀',
        描述: '由既有修炼经历沉淀出的入门吐纳法，足以解释主角开局内力与境界来源。',
        类型: '内功',
        品质: '凡品',
        来源: source,
        当前重数: 1,
        最高重数: 6,
        当前熟练度: 0,
        升级经验: 100,
        突破条件: '日常吐纳，循序渐进',
        境界限制: '无',
        大成方向: '稳固内息',
        圆满效果: '圆满后可略微提升内力恢复与修炼稳定性。',
        武器限制: [],
        消耗类型: '内力',
        消耗数值: 0,
        施展耗时: '1刻',
        冷却时间: '0息',
        基础伤害: 0,
        加成属性: '根骨',
        加成系数: 0,
        内力系数: 1,
        伤害类型: '内功',
        目标类型: '自身',
        最大目标数: 1,
        重数描述映射: [{ 重数: 1, 描述: '初步梳理气息，稳住丹田。' }],
        附带效果: [],
        被动修正: [],
        境界特效: []
    };
};

const 主角开局应有基础功法 = (charData: 角色数据结构): boolean => {
    const existing = Array.isArray((charData as any)?.功法列表) && (charData as any).功法列表.length > 0;
    if (existing) return false;
    const realmText = 取文本((charData as any)?.境界);
    const backgroundText = [
        取文本((charData as any)?.称号),
        取文本((charData as any)?.出身背景?.名称),
        取文本((charData as any)?.出身背景?.描述)
    ].join(' ');
    const impossibleText = `${realmText} ${backgroundText}`;
    if (/凡人|普通人|未入境|未修炼|不会武|不会功法|不通武艺/u.test(impossibleText)) return false;
    return 取数字((charData as any)?.当前内力) > 0
        || 取数字((charData as any)?.最大内力) > 0
        || 取数字((charData as any)?.境界层级) > 0
        || Boolean(realmText && !/无|未知|凡人|未入境/u.test(realmText));
};

const 补齐开局仙侠字段 = (charData: 角色数据结构, openingConfig?: OpeningConfig): 角色数据结构 => {
    if (openingConfig?.题材模式 !== '仙侠') return charData;
    const role = { ...(charData as any) };
    const rank = Math.max(1, 取数字(role.境界层级, 1));
    const rootText = `${取文本(role.灵根)} ${取文本(role.灵根资质)}`.trim();
    return {
        ...role,
        灵根: 取文本(role.灵根, '未鉴定灵根'),
        灵根资质: rootText ? 取文本(role.灵根资质, '普通') : '未鉴定',
        最大灵力: Math.max(0, 取数字(role.最大灵力, Math.ceil(24 + 取数字(role.根骨, 0) * 4 + 取数字(role.悟性, 0) * 3 + rank * 12))),
        当前灵力: Math.max(0, 取数字(role.当前灵力, Math.ceil(24 + 取数字(role.根骨, 0) * 4 + 取数字(role.悟性, 0) * 3 + rank * 12))),
        最大神识: Math.max(0, 取数字(role.最大神识, Math.ceil(12 + 取数字(role.悟性, 0) * 4 + rank * 8))),
        当前神识: Math.max(0, 取数字(role.当前神识, Math.ceil(12 + 取数字(role.悟性, 0) * 4 + rank * 8))),
        丹田状态: 取文本(role.丹田状态, '稳定'),
        道基状态: 取文本(role.道基状态, rank > 1 ? '已筑基痕迹' : '未筑道基'),
        心魔值: Math.max(0, 取数字(role.心魔值, 0)),
        功德: 取数字(role.功德, 0),
        业力: 取数字(role.业力, 0)
    } as 角色数据结构;
};

const 补齐开局角色功法 = (charData: 角色数据结构, sect: 详细门派结构): 角色数据结构 => {
    const currentSkills = Array.isArray((charData as any)?.功法列表) ? 深拷贝((charData as any).功法列表) : [];
    if (currentSkills.length > 0) return { ...charData, 功法列表: currentSkills };
    if (['营地', '组织'].includes(推导组织语义(sect))) {
        return { ...charData, 功法列表: currentSkills };
    }
    if (!sect || 是否无门派标识(sect.ID) || !Array.isArray(sect.藏经阁列表) || sect.藏经阁列表.length === 0) {
        return { ...charData, 功法列表: currentSkills };
    }
    const contribution = Math.max(取数字((charData as any)?.门派贡献, 0), 取数字(sect.累计贡献, 0), 取数字(sect.玩家贡献, 0));
    const availableBook = sect.藏经阁列表.find((book: any) => 取数字(book?.要求累计贡献, 0) <= contribution) || sect.藏经阁列表[0];
    if (!availableBook) return { ...charData, 功法列表: currentSkills };
    return { ...charData, 功法列表: [从藏经阁条目创建功法(availableBook, sect.名称)] };
};

const 补齐门派重要成员 = (sourceMembers: unknown): 详细门派结构['重要成员'] => {
    if (!Array.isArray(sourceMembers)) return [];
    const usedIds = new Set<string>();
    const members = sourceMembers
        .filter((item) => item && typeof item === 'object')
        .filter((item: any) => {
            const memberId = 取文本(item?.id);
            if (memberId && usedIds.has(memberId)) return false;
            if (memberId) usedIds.add(memberId);
            return true;
        });
    return members as 详细门派结构['重要成员'];
};

const 生成开局门派名称 = (charData: 角色数据结构, openingConfig?: OpeningConfig): string => {
    if (!是否无门派标识(charData?.所属门派ID)) return 取文本(charData.所属门派ID);
    const seed = 生成稳定哈希([
        取文本(charData?.姓名),
        取文本((charData as any)?.出身背景?.名称),
        取文本(openingConfig?.初始关系模板),
        取文本(openingConfig?.开局切入偏好),
        (openingConfig?.关系侧重 || []).join('|'),
        取文本(openingConfig?.题材模式)
    ].join('|'));
    const prefix = openingConfig?.题材模式 === '末日丧尸'
        ? ['曙光', '北桥', '南仓', '临江', '铁栅', '白塔', '灰港', '星火']
        : openingConfig?.题材模式 === '现代都市'
            ? ['青橙', '远行', '明德', '星河', '安桥', '启明', '合众', '南城']
        : openingConfig?.题材模式 === '仙侠'
        ? ['青崖', '玄衡', '云岫', '烬霞', '澄霄', '归藏', '天炉', '寒照']
        : ['折柳', '玄墨', '听潮', '照影', '归雁', '松风', '问剑', '长鲸'];
    const suffix = openingConfig?.题材模式 === '末日丧尸'
        ? ['营地', '避难所', '车队', '安全点', '哨站', '救援站']
        : openingConfig?.题材模式 === '现代都市'
            ? ['公司', '项目组', '事务所', '社区中心', '门店', '合作团队']
        : openingConfig?.题材模式 === '仙侠'
        ? ['仙宗', '剑宗', '道院', '灵门', '玄府', '真宫']
        : ['山庄', '门', '帮', '武馆', '剑派', '堂'];
    return `${按种子取项(prefix, seed)}${按种子取项(suffix, seed, 11)}`;
};

const 创建默认同门名录 = (sectName: string, openingConfig?: OpeningConfig): 详细门派结构['重要成员'] => {
    if (openingConfig?.开局生成同门 === false) return [];
    const seed = 生成稳定哈希(`${sectName}|${openingConfig?.题材模式 || ''}|同门`);
    const surnames = ['沈', '顾', '林', '陆', '许', '程', '韩', '苏', '叶', '周', '秦', '赵'];
    const givenNames = ['照临', '清砚', '明棠', '砚舟', '若衡', '怀瑾', '听澜', '云笙', '承岳', '知微', '景行', '映雪'];
    const isApocalypse = openingConfig?.题材模式 === '末日丧尸';
    const isModern = openingConfig?.题材模式 === '现代都市';
    const roles = isApocalypse
        ? ['营地负责人', '物资管理员', '巡逻队员', '医护志愿者', '维修工', '前哨哨兵', '搜救队员', '临时同行者']
        : isModern
            ? ['项目负责人', '资深同事', '行政联系人', '技术成员', '外勤成员', '合作伙伴', '社区联络人', '实习成员']
            : ['掌事师叔', '外务执事', '内门师兄', '内门师姐', '外门弟子', '外门弟子', '杂役弟子', '藏经阁值守'];
    const count = 6 + (seed % 5);
    return Array.from({ length: count }, (_, index) => {
        const name = `${按种子取项(surnames, seed, index * 3)}${按种子取项(givenNames, seed, index * 5 + 1)}`;
        const identity = 按种子取项(roles, seed, index * 7 + 2);
        const duty = isApocalypse
            ? 按种子取项(['物资清点', '外围巡逻', '伤员照护', '路线侦察', '设备维护', '夜间值守'], seed, index)
            : isModern
                ? 按种子取项(['客户沟通', '现场协调', '资料整理', '技术支持', '外勤跑动', '资源对接'], seed, index)
                : 按种子取项(['外务传令', '照看新弟子', '巡守山门', '整理典籍', '采办物资', '维持门规'], seed, index);
        return {
            id: `sect_member_opening_${生成稳定哈希(`${sectName}|${name}|${index}`).toString(36)}`,
            姓名: name,
            性别: index % 3 === 1 ? '女' : '男',
            年龄: identity.includes('执事') || identity.includes('掌事') ? 34 + (seed + index) % 18 : 16 + (seed + index) % 12,
            境界: isApocalypse
                ? 按种子取项(['普通幸存者', '老练幸存者', '一线搜救者', '营地骨干'], seed, index)
                : isModern
                    ? 按种子取项(['普通人', '熟练从业者', '项目骨干', '现实关系核心'], seed, index)
                    : openingConfig?.题材模式 === '仙侠'
                        ? 按种子取项(['炼气中期', '炼气后期', '筑基初期', '炼气初期'], seed, index)
                        : 按种子取项(['锻体境', '开脉境', '凝气境', '内息小成'], seed, index),
            身份: identity,
            简介: `${sectName}${identity}，负责${duty}。`
        };
    });
};

const 题材资料库是否违和 = (items: any[], organizationKind: 组织题材): boolean => {
    if (!Array.isArray(items) || items.length === 0) return false;
    const text = JSON.stringify(items);
    if (organizationKind === '营地') {
        return /藏经阁|功法|心法|身法|剑法|刀法|拳谱|掌法|弟子|宗门|门派|吐纳|丹田|内功|轻功/u.test(text);
    }
    if (organizationKind === '组织') {
        return /藏经阁|功法|心法|身法|剑法|刀法|拳谱|掌法|弟子|宗门|门派|吐纳|丹田|内功|轻功/u.test(text);
    }
    return false;
};

const 题材兑换列表是否违和 = (items: any[], organizationKind: 组织题材): boolean => {
    if (!Array.isArray(items) || items.length === 0) return false;
    const text = JSON.stringify(items);
    if (organizationKind === '营地' || organizationKind === '组织') {
        return /辟谷丹|回气丹|凝元丹|破境丹|筑基丹|引气丹|聚灵丹|混元丹|玉骨扇|丹炉|法器|灵石/u.test(text);
    }
    return false;
};

const 按人数平衡分布 = (total: number, entries: Array<[string, number]>): Record<string, number> => {
    const safeTotal = Math.max(0, Math.floor(total));
    if (safeTotal <= 0) return {};
    const result: Record<string, number> = {};
    let used = 0;
    entries.forEach(([key, value]) => {
        const count = Math.max(0, Math.floor(value));
        result[key] = count;
        used += count;
    });
    const diff = safeTotal - used;
    if (diff !== 0 && entries.length > 0) {
        const target = entries[0][0];
        result[target] = Math.max(0, (result[target] || 0) + diff);
    }
    return result;
};

const 创建开局门派种子数据 = (
    charData: 角色数据结构,
    openingConfig?: OpeningConfig
) => {
    const sectName = 生成开局门派名称(charData, openingConfig);
    const seed = 生成稳定哈希(`${sectName}|${取文本(charData?.姓名)}|${取文本((charData as any)?.出身背景?.名称)}`);
    const isXianxia = openingConfig?.题材模式 === '仙侠';
    const isApocalypse = openingConfig?.题材模式 === '末日丧尸';
    const isModern = openingConfig?.题材模式 === '现代都市';
    const total = 36 + (seed % 185);
    const funds = 1800 + (seed % 9000);
    const material = 420 + (seed % 1800);
    const build = 220 + (seed % 720);
    const ideals = isApocalypse
        ? ['隔离优先，物资登记，结伴行动', '守住净水、药品与撤离路线', '不隐瞒伤情，不制造无谓噪音', '互保夜巡，遇险先救活人']
        : isModern
            ? ['守约履责，信息透明，互相兜底', '按合同做事，按人情留余地', '问题不过夜，资源要留痕', '把事情办成，也把人照顾到']
        : isXianxia
        ? ['守正炼心，护持一方灵脉', '以剑问道，以戒束身', '扶危济困，斩妖护民', '内修清明，外守山河']
        : ['扶危济困，守信重义', '以武立身，以义束众', '护商路，平乡难，重同门', '练武不欺弱，行事有担当'];
    return {
        sectName,
        seed,
        total,
        funds,
        material,
        build,
        intro: isApocalypse
            ? `${sectName}${按种子取项(['占据旧商场侧翼', '守着一处净水点', '依托临时车队转移', '靠近封锁线边缘'], seed, 5)}，行动准则是${按种子取项(ideals, seed, 9)}。`
            : isModern
                ? `${sectName}${按种子取项(['扎根城市街区', '围绕一个长期项目运转', '由熟人和合作方维系', '近来事务压力上升'], seed, 5)}，行事准则是${按种子取项(ideals, seed, 9)}。`
                : `${sectName}${按种子取项(['立于山城要道', '据守旧岭山门', '传承数代', '近年声势渐起'], seed, 5)}，宗旨是${按种子取项(ideals, seed, 9)}。`,
        rules: isApocalypse
            ? ['伤情与感染风险必须登记', 按种子取项(['外出搜刮必须结伴', '夜间噪音严格管控', '药品弹药统一记录'], seed, 13), '路线、哨位和物资点不得私自泄露']
            : isModern
                ? ['合作事项必须留痕', 按种子取项(['外勤风险要提前报备', '客户与邻里关系不得私自激化', '资金和资料流向必须清楚'], seed, 13), '成员隐私和关键资料不得外泄']
                : [
                    '不可同门相残',
                    按种子取项(['任务所得须如实登记', '外出历练须回报见闻', '不得借门派名义欺压百姓'], seed, 13),
                    '藏经阁典籍不得私自外传'
                ],
        organizationKind: isApocalypse ? '营地' : isModern ? '组织' : isXianxia ? '宗门' : '门派'
    };
};

const 推导门派规模数据 = (source: any, displayName: string) => {
    const organizationKind = 推导组织语义(source);
    const isApocalypse = organizationKind === '营地';
    const isModern = organizationKind === '组织';
    const rawTotal = 取数字(source?.弟子总数 ?? source?.成员总数 ?? source?.门人总数, 0);
    const importantCount = Array.isArray(source?.重要成员) ? source.重要成员.length : 0;
    const total = Math.max(rawTotal, importantCount);
    const funds = 取数字(source?.门派资金, 1200);
    const material = 取数字(source?.门派物资, 350);
    const build = 取数字(source?.建设度, 180);
    const score = total * 2 + Math.floor(funds / 500) + Math.floor(material / 80) + Math.floor(build / 50);
    const rawLevel = 含幕后生成占位文本(source?.门派等级) ? '' : 取文本(source?.门派等级);
    const rawScale = 含幕后生成占位文本(source?.门派规模) ? '' : 取文本(source?.门派规模);
    const rawWealth = 含幕后生成占位文本(source?.财富评级) ? '' : 取文本(source?.财富评级);
    const level = rawLevel
        || (isApocalypse
            ? (score >= 120 ? '大型安全区' : score >= 70 ? '稳定营地' : score >= 35 ? '小型据点' : score >= 12 ? '临时营地' : '求生小队')
            : isModern
                ? (score >= 120 ? '成熟组织' : score >= 70 ? '稳定团队' : score >= 35 ? '小型团队' : score >= 12 ? '临时项目组' : '个人协作点')
                : (score >= 120 ? '一流大派' : score >= 70 ? '二流门派' : score >= 35 ? '三流门派' : score >= 12 ? '地方小派' : '草创门派'));
    const scale = rawScale
        || (isApocalypse
            ? (total >= 500 ? '大型安全区' : total >= 120 ? '中型营地' : total >= 30 ? '小型营地' : '临时小队')
            : isModern
                ? (total >= 500 ? '集团级组织' : total >= 120 ? '中型组织' : total >= 30 ? '小型组织' : '小团队')
                : (total >= 500 ? '大宗门' : total >= 120 ? '中型门派' : total >= 30 ? '小型门派' : '草创小门'));
    const wealth = rawWealth
        || (isApocalypse
            ? (funds >= 30000 ? '补给充足' : funds >= 10000 ? '库存稳定' : funds >= 2500 ? '勉强周转' : '严重短缺')
            : isModern
                ? (funds >= 30000 ? '现金流充足' : funds >= 10000 ? '运转稳定' : funds >= 2500 ? '预算有限' : '资金紧张')
                : (funds >= 30000 ? '富甲一方' : funds >= 10000 ? '殷实' : funds >= 2500 ? '尚可' : '拮据'));
    const rawDistribution = source?.战力分布 && typeof source.战力分布 === 'object' && !Array.isArray(source.战力分布)
        ? source.战力分布
        : {};
    const fallbackDistribution = total > 0
        ? isApocalypse
            ? 按人数平衡分布(total, [
                ['后勤', total * 0.35],
                ['巡逻', total * 0.25],
                ['医疗维修', total * 0.18],
                ['搜救战斗', total * 0.16],
                ['指挥骨干', total >= 30 ? Math.max(1, total * 0.04) : 0]
            ])
            : isModern
                ? 按人数平衡分布(total, [
                    ['基础成员', total * 0.45],
                    ['执行成员', total * 0.30],
                    ['专业骨干', total * 0.18],
                    ['管理协调', total * 0.06],
                    ['核心负责人', total >= 30 ? Math.max(1, total * 0.01) : 0]
                ])
                : 按人数平衡分布(total, [
                    ['凡俗', total * 0.45],
                    ['入门', total * 0.35],
                    ['中坚', total * 0.16],
                    ['高手', total * 0.035],
                    ['顶尖', total >= 80 ? Math.max(1, total * 0.005) : 0]
                ])
        : {};
    const stipend = source?.月俸规则 && typeof source.月俸规则 === 'object' && !Array.isArray(source.月俸规则)
        ? source.月俸规则
        : {};
    return {
        门派等级: level,
        门派规模: scale,
        弟子总数: total,
        战力分布: Object.keys(rawDistribution).length > 0 ? rawDistribution : fallbackDistribution,
        财富评级: wealth,
        月俸规则: {
            基础俸禄: 取数字(stipend?.基础俸禄, level.includes('一流') ? 900 : level.includes('二流') ? 500 : level.includes('三流') ? 260 : 120),
            贡献系数: 取数字(stipend?.贡献系数, 0.08),
            规模系数: 取数字(stipend?.规模系数, total >= 500 ? 1.6 : total >= 120 ? 1.25 : total >= 30 ? 1 : 0.75),
            发放说明: 取文本(stipend?.发放说明, isApocalypse
                ? `${displayName}按贡献、岗位、风险和库存情况分配口粮、药品、弹药、燃油或通行资源。`
                : isModern
                    ? `${displayName}按岗位、贡献、项目预算和合作关系结算工资、补贴、分成或资源支持。`
                    : `${displayName}按月根据职位、累计贡献、贡献等级、门派规模与财富状况发放俸禄。`)
        },
        上次俸禄月份: 取文本(source?.上次俸禄月份)
    };
};

export const 创建开局门派状态 = (
    charData: 角色数据结构,
    openingConfig?: OpeningConfig
): 详细门派结构 => {
    const shouldCreateSect = openingConfig?.开局生成门派 !== false;
    if (!shouldCreateSect) return 创建空门派状态();

    const seedData = 创建开局门派种子数据(charData, openingConfig);
    const baseName = seedData.sectName;
    const contribution = Math.max(0, 取数字(charData?.门派贡献, 0));
    const isApocalypse = openingConfig?.题材模式 === '末日丧尸';
    const isModern = openingConfig?.题材模式 === '现代都市';
    const sourceRank = 取文本((charData as any)?.门派职位);
    const playerRank = isApocalypse
        ? (是否无门派标识(sourceRank) ? '营地成员' : sourceRank)
        : isModern
            ? (是否无门派标识(sourceRank) ? '成员' : sourceRank)
            : 补全门派职位(charData, contribution, '外门弟子');
    const isXianxia = openingConfig?.题材模式 === '仙侠';
    const normalized = 规范化门派状态({
        ID: baseName,
        名称: baseName,
        玩家职位: playerRank,
        玩家贡献: contribution,
        累计贡献: contribution,
        简介: seedData.intro,
        门规: seedData.rules,
        门派资金: seedData.funds,
        门派物资: seedData.material,
        建设度: seedData.build,
        组织语义: seedData.organizationKind,
        弟子总数: seedData.total,
        兑换列表: isApocalypse ? 创建默认营地物资列表() : isModern ? 创建默认现代组织资源列表() : isXianxia ? 创建默认仙侠聚宝阁商品() : 创建默认聚宝阁商品(),
        藏经阁列表: 创建默认藏经阁列表(baseName, openingConfig),
        任务列表: [],
        重要成员: 创建默认同门名录(baseName, openingConfig)
    });
    return normalized;
};

export const 规范化门派状态 = (raw?: any): 详细门派结构 => {
    const base = 创建空门派状态();
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const organizationKind = 推导组织语义(source);
    const isApocalypseOrganization = organizationKind === '营地';
    const isModernOrganization = organizationKind === '组织';
    const id = 取文本(source?.ID, base.ID);
    const name = 取文本(source?.名称, base.名称);
    const playerRankSource = 取文本(source?.玩家职位, base.玩家职位);
    const hasExplicitInactiveMarker = (
        (source?.ID !== undefined && 是否无门派标识(id))
        || (source?.名称 !== undefined && 是否无门派标识(name))
        || (source?.玩家职位 !== undefined && 是否无门派标识(playerRankSource))
    );
    const hasActiveMarker = !是否无门派标识(id) || (!是否无门派标识(name) && name !== base.名称) || !是否无门派标识(playerRankSource);
    const isActiveSect = hasActiveMarker && !hasExplicitInactiveMarker;
    if (!isActiveSect) return base;
    const displayName = isActiveSect && name === base.名称 ? (id === 'none' ? '青云山庄' : id) : name;
    const playerContribution = 取数字(source?.玩家贡献, base.玩家贡献);
    const totalContribution = Math.max(
        playerContribution,
        取数字(source?.累计贡献 ?? source?.历史贡献 ?? source?.累计生成贡献, playerContribution)
    );
    const playerRank = 补全门派职位(source, totalContribution, isActiveSect ? '杂役弟子' : base.玩家职位);
    const scaleData = 推导门派规模数据(source, displayName);
    const defaultLibraryConfig = isApocalypseOrganization
        ? ({ 题材模式: '末日丧尸' } as OpeningConfig)
        : isModernOrganization
            ? ({ 题材模式: '现代都市' } as OpeningConfig)
            : organizationKind === '宗门'
                ? ({ 题材模式: '仙侠' } as OpeningConfig)
                : undefined;
    const rawLibrary = Array.isArray(source?.藏经阁列表) ? source.藏经阁列表 : [];
    const shouldReplaceLibrary = 题材资料库是否违和(rawLibrary, organizationKind);
    const rawExchange = Array.isArray(source?.兑换列表) ? source.兑换列表 : [];
    const shouldReplaceExchange = 题材兑换列表是否违和(rawExchange, organizationKind);
    const safeIntro = typeof source?.简介 === 'string' && source.简介.trim() && !含幕后生成占位文本(source.简介)
        ? source.简介.trim()
        : isApocalypseOrganization
            ? `${displayName}在灾后维持一处可承接的幸存者关系网，围绕补给、巡逻、救援、隔离和路线选择运转。`
            : isModernOrganization
                ? `${displayName}在现代城市中维持一组可承接的现实关系，围绕工作、合作、资源、人情和城市事务运转。`
                : `${displayName}立足一方，门中事务围绕修行、贡献、同门互助与外务历练展开。`;
    const safeRules = Array.isArray(source?.门规) && source.门规.length > 0
        ? source.门规.map((item: any) => 取文本(item)).filter((item: string) => item && !含幕后生成占位文本(item))
        : [];
    const safeTasks = Array.isArray(source?.任务列表)
        ? source.任务列表.filter((item: any) => !含幕后生成占位文本(item?.标题) && !含幕后生成占位文本(item?.描述))
        : [];
    return {
        ID: id,
        名称: displayName,
        组织语义: organizationKind || undefined,
        简介: isActiveSect ? safeIntro : base.简介,
        门规: safeRules.length > 0
            ? safeRules
            : (isActiveSect
                ? isApocalypseOrganization
                    ? ['伤情与感染风险必须登记', '外出搜刮必须结伴', '路线、哨位和物资点不得私自泄露']
                    : isModernOrganization
                        ? ['合作事项必须留痕', '资金和资料流向必须清楚', '成员隐私和关键资料不得外泄']
                        : ['不可同门相残', '任务所得须如实登记', '藏经阁典籍不得私自外传']
                : []),
        门派资金: 取数字(source?.门派资金, isActiveSect ? 1200 : base.门派资金),
        门派物资: 取数字(source?.门派物资, isActiveSect ? 350 : base.门派物资),
        建设度: 取数字(source?.建设度, isActiveSect ? 180 : base.建设度),
        ...scaleData,
        玩家职位: playerRank,
        玩家贡献: playerContribution,
        累计贡献: totalContribution,
        任务列表: safeTasks,
        兑换列表: Array.isArray(source?.兑换列表) && source.兑换列表.length > 0
            ? (shouldReplaceExchange
                ? (isApocalypseOrganization ? 创建默认营地物资列表() : isModernOrganization ? 创建默认现代组织资源列表() : source.兑换列表)
                : source.兑换列表)
            : (isActiveSect
                ? isApocalypseOrganization
                    ? 创建默认营地物资列表()
                    : isModernOrganization
                        ? 创建默认现代组织资源列表()
                        : 创建默认聚宝阁商品()
                : []),
        藏经阁列表: Array.isArray(source?.藏经阁列表) && source.藏经阁列表.length > 0
            ? (shouldReplaceLibrary ? 创建默认藏经阁列表(displayName, defaultLibraryConfig) : source.藏经阁列表)
            : (isActiveSect ? 创建默认藏经阁列表(displayName, defaultLibraryConfig) : []),
        重要成员: isActiveSect ? 补齐门派重要成员(source?.重要成员) : []
    };
};

export const 保护开局生成门派状态 = <T extends { 玩家门派?: any; 角色?: any }>(
    nextState: T,
    baseState: { 玩家门派?: any; 角色?: any },
    openingConfig?: OpeningConfig
): T => {
    const baseSect = 规范化门派状态(baseState?.玩家门派);
    const nextSect = 规范化门派状态(nextState?.玩家门派);
    const shouldKeepGeneratedSect = openingConfig?.开局生成门派 !== false
        && !是否无门派标识(baseSect.ID)
        && 是否无门派标识(nextSect.ID);
    if (!shouldKeepGeneratedSect) return nextState;

    const nextRole = nextState?.角色 && typeof nextState.角色 === 'object'
        ? {
            ...nextState.角色,
            所属门派ID: baseSect.ID,
            门派职位: baseSect.玩家职位,
            门派贡献: Math.max(
                取数字(nextState.角色?.门派贡献),
                取数字(baseSect.玩家贡献),
                取数字(baseSect.累计贡献)
            )
        }
        : nextState?.角色;

    return {
        ...nextState,
        玩家门派: baseSect,
        角色: nextRole
    };
};

export const 创建开场空白环境 = (): 环境信息结构 => ({
    时间: '1:01:01:00:00',
    大地点: '',
    中地点: '',
    小地点: '',
    具体地点: '',
    节日: null,
    天气: { 天气: '', 结束日期: '1:01:01:00:00' },
    环境变量: []
});

const 规范化地点归属 = (raw?: any) => ({
    大地点: 取文本(raw?.大地点),
    中地点: 取文本(raw?.中地点),
    小地点: 取文本(raw?.小地点)
});

export const 创建开场空白世界 = (): 世界数据结构 => ({
    活跃NPC列表: [],
    待执行事件: [],
    进行中事件: [],
    已结算事件: [],
    世界镜头规划: [],
    江湖史册: [],
    地图: [],
    建筑: [],
    地图层级: [],
    地图建筑: [],
    地图道路: [],
    地图人物: [],
    势力列表: [],
    势力互动历史: [],
    拍卖行待投放物品: []
});

export const 规范化世界状态 = (raw?: any): 世界数据结构 => {
    const world = raw && typeof raw === 'object' ? raw : {};
    const normalizedWorld: 世界数据结构 = {
        活跃NPC列表: Array.isArray(world?.活跃NPC列表)
            ? world.活跃NPC列表
                .map((item: any) => ({
                    姓名: 取文本(item?.姓名),
                    所属势力: 取文本(item?.所属势力),
                    当前位置: 取文本(item?.当前位置),
                    位置路径: 取文本(item?.位置路径),
                    当前状态: 取文本(item?.当前状态),
                    当前行动: 取文本(item?.当前行动),
                    行动开始时间: 取文本(item?.行动开始时间),
                    行动结束时间: 取文本(item?.行动结束时间)
                }))
                .filter((item) => item.姓名 || item.当前状态 || item.当前行动)
            : [],
        待执行事件: Array.isArray(world?.待执行事件)
            ? world.待执行事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    类型: 取文本(item?.类型),
                    事件说明: 取文本(item?.事件说明),
                    计划执行时间: 取文本(item?.计划执行时间),
                    最早执行时间: 取文本(item?.最早执行时间),
                    最晚执行时间: 取文本(item?.最晚执行时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    执行后影响: 取字符串数组(item?.执行后影响),
                    错过后影响: 取字符串数组(item?.错过后影响),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        进行中事件: Array.isArray(world?.进行中事件)
            ? world.进行中事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    类型: 取文本(item?.类型),
                    事件说明: 取文本(item?.事件说明),
                    开始时间: 取文本(item?.开始时间),
                    预计结束时间: 取文本(item?.预计结束时间),
                    当前进展: 取文本(item?.当前进展),
                    已产生影响: 取字符串数组(item?.已产生影响),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        已结算事件: Array.isArray(world?.已结算事件)
            ? world.已结算事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    类型: 取文本(item?.类型),
                    事件说明: 取文本(item?.事件说明),
                    结算时间: 取文本(item?.结算时间),
                    事件结果: 取字符串数组(item?.事件结果),
                    长期影响: 取字符串数组(item?.长期影响),
                    是否进入史册: 取布尔(item?.是否进入史册),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        世界镜头规划: Array.isArray(world?.世界镜头规划)
            ? world.世界镜头规划
                .map((item: any) => ({
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    触发条件: 取字符串数组(item?.触发条件),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.镜头标题 || item.镜头内容)
            : [],
        江湖史册: Array.isArray(world?.江湖史册)
            ? world.江湖史册
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    归档时间: 取文本(item?.归档时间),
                    归档内容: 取字符串数组(item?.归档内容),
                    长期影响: 取字符串数组(item?.长期影响),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分歧线: 取字符串数组(item?.关联分歧线)
                }))
                .filter((item) => item.标题 || item.归档内容.length > 0)
            : [],
        地图: Array.isArray(world?.地图)
            ? world.地图
                .map((item: any) => ({
                    名称: 取文本(item?.名称),
                    坐标: 取文本(item?.坐标),
                    描述: 取文本(item?.描述),
                    归属: 规范化地点归属(item?.归属),
                    内部建筑: 取字符串数组(item?.内部建筑)
                }))
                .filter((item) => item.名称 || item.描述)
            : [],
        建筑: Array.isArray(world?.建筑)
            ? world.建筑
                .map((item: any) => ({
                    名称: 取文本(item?.名称),
                    描述: 取文本(item?.描述),
                    归属: 规范化地点归属(item?.归属)
                }))
                .filter((item) => item.名称 || item.描述)
            : [],
        地图层级: Array.isArray(world?.地图层级) ? world.地图层级 : [],
        地图建筑: Array.isArray(world?.地图建筑) ? world.地图建筑 : [],
        地图道路: Array.isArray(world?.地图道路) ? world.地图道路 : [],
        地图人物: Array.isArray(world?.地图人物) ? world.地图人物 : [],
        // 势力系统（旧存档兼容：缺失时默认为空数组）
        势力列表: Array.isArray(world?.势力列表) ? world.势力列表 : [],
        势力互动历史: Array.isArray(world?.势力互动历史) ? world.势力互动历史 : [],
        拍卖行待投放物品: Array.isArray(world?.拍卖行待投放物品) ? world.拍卖行待投放物品 : []
    };

    // 不再调用补齐——旧坐标系统已废弃，新地图系统不需要空间坐标补全
    return normalizedWorld;
};

export const 创建开场空白战斗 = (): 战斗状态结构 => ({
    是否战斗中: false,
    敌方: []
});

const 读取敌方境界阶位 = (enemy: any): number => {
    const text = [enemy?.境界, enemy?.简介, enemy?.名字].map((value) => 取文本(value)).join(' ');
    const compact = text.replace(/\s+/g, '');
    const 四段境界名称 = ['开脉', '聚息', '归元', '御劲', '化罡'];
    const realmBase: Record<string, number> = { 开脉: 0, 聚息: 4, 归元: 8, 御劲: 12, 化罡: 16 };
    const stageTextMap: Record<string, number> = {
        初期: 1,
        前期: 1,
        中期: 2,
        后期: 3,
        圆满: 4,
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4
    };
    const stageMatch = compact.match(new RegExp(`(${四段境界名称.join('|')})境?(初期|前期|中期|后期|圆满|第?[一二两三四1-4](?:重|层))`));
    if (stageMatch) {
        const stageRaw = stageMatch[2].replace(/^第/, '').replace(/[重层]$/, '');
        return Math.max(1, (realmBase[stageMatch[1]] || 0) + (stageTextMap[stageRaw] || 1));
    }
    let rank = 1;
    [
        [/凡人|普通|未入道|无修为/, 1],
        [/炼体|锻体|开脉|通脉/, 1],
        [/聚息|聚气|凝气/, 5],
        [/筑基|归元/, 9],
        [/御劲|凝真|玄照/, 13],
        [/化罡|金丹|玄丹/, 17],
        [/通玄|元婴/, 21],
        [/神照|化神/, 27],
        [/返真|炼虚/, 33],
        [/合体/, 38],
        [/大乘|渡劫/, 24]
    ].forEach(([pattern, value]) => {
        if ((pattern as RegExp).test(text)) rank = Math.max(rank, value as number);
    });
    if (/后期|圆满|巅峰/.test(text)) rank += 1;
    return Math.max(1, rank);
};

const 规范化敌方基础属性 = (rawEnemy: any) => {
    const rank = 读取敌方境界阶位(rawEnemy);
    const text = [rawEnemy?.名字, rawEnemy?.境界, rawEnemy?.简介, ...(Array.isArray(rawEnemy?.技能) ? rawEnemy.技能 : [])].map((value) => 取文本(value)).join(' ');
    const realmLevel = Math.max(1, Math.ceil(取数字(rawEnemy?.境界层级, rank)), rank);
    const attrs = 归一化六维到境界预算(rawEnemy, {
        境界层级: realmLevel,
        偏向权重: {
            力量: /刀|斧|锤|拳|猛|力/.test(text) ? 3 : 0,
            敏捷: /剑|刺|影|弓|暗器|快/.test(text) ? 3 : 0,
            体质: /盾|甲|体|横练|护/.test(text) ? 3 : 0,
            根骨: /内功|道|术|气|长老/.test(text) ? 3 : 0,
            悟性: /术|阵|符|谋|智|师/.test(text) ? 3 : 0
        }
    });
    return {
        ...attrs,
        境界层级: realmLevel
    };
};

const 规范化敌方条目 = (rawEnemy: any): 战斗状态结构['敌方'][number] => {
    const attrs = 规范化敌方基础属性(rawEnemy);
    return {
        名字: 取文本(rawEnemy?.名字),
        境界: 取文本(rawEnemy?.境界),
        简介: 取文本(rawEnemy?.简介),
        技能: 取字符串数组(rawEnemy?.技能),
        ...attrs,
        战斗力: 取数字(rawEnemy?.战斗力, Math.ceil(attrs.力量 * 1.5 + attrs.敏捷 * 0.8 + attrs.境界层级 * 4)),
        防御力: 取数字(rawEnemy?.防御力, Math.ceil(attrs.体质 * 1.3 + attrs.根骨 * 0.9 + attrs.境界层级 * 3)),
        当前血量: 取数字(rawEnemy?.当前血量, Math.ceil(72 + attrs.体质 * 4.2 + attrs.根骨 * 2.4 + attrs.力量 * 1.2 + attrs.境界层级 * 12)),
        最大血量: 取数字(rawEnemy?.最大血量, Math.ceil(72 + attrs.体质 * 4.2 + attrs.根骨 * 2.4 + attrs.力量 * 1.2 + attrs.境界层级 * 12)),
        当前精力: 取数字(rawEnemy?.当前精力, Math.ceil(36 + attrs.体质 * 3.2 + attrs.根骨 * 2.2 + attrs.境界层级 * 9)),
        最大精力: 取数字(rawEnemy?.最大精力, Math.ceil(36 + attrs.体质 * 3.2 + attrs.根骨 * 2.2 + attrs.境界层级 * 9)),
        当前内力: 取数字(rawEnemy?.当前内力, Math.ceil(18 + attrs.根骨 * 3.6 + attrs.悟性 * 3.2 + attrs.境界层级 * 10)),
        最大内力: 取数字(rawEnemy?.最大内力, Math.ceil(18 + attrs.根骨 * 3.6 + attrs.悟性 * 3.2 + attrs.境界层级 * 10))
    };
};

export const 规范化战斗状态 = (raw?: any): 战斗状态结构 => {
    const battle = raw && typeof raw === 'object' ? raw : {};
    return {
        是否战斗中: battle?.是否战斗中 === true,
        敌方: Array.isArray(battle?.敌方)
            ? battle.敌方.map(规范化敌方条目).filter((item) => item.名字 || item.简介)
            : []
    };
};

export const 创建开场空白剧情 = (): 剧情系统结构 => ({
    当前章节: {
        标题: '',
        当前分解组: 1,
        原著章节标题: '',
        原著推进状态: '未开始',
        原著换章条件: [],
        原著切换说明: [],
        已完成摘要: [],
        当前待解问题: [],
        切章后沉淀要点: []
    },
    下一章预告: {
        标题: '',
        大纲: [],
        进入条件: [],
        风险提示: []
    },
    历史卷宗: [],
    章节时间校准: []
});

export const 规范化剧情状态 = (raw?: any): 剧情系统结构 => {
    const story = raw && typeof raw === 'object' ? raw : {};
    const chapter = story?.当前章节 && typeof story.当前章节 === 'object' ? story.当前章节 : {};
    const preview = story?.下一章预告 && typeof story.下一章预告 === 'object' ? story.下一章预告 : {};
    return {
        当前章节: {
            标题: 取文本(chapter?.标题),
            当前分解组: Math.max(1, 取数字(chapter?.当前分解组, 1)),
            原著章节标题: 取文本(chapter?.原著章节标题),
            原著推进状态: chapter?.原著推进状态 === '已完成'
                ? '已完成'
                : chapter?.原著推进状态 === '推进中'
                    ? '推进中'
                    : '未开始',
            原著换章条件: 取字符串数组(chapter?.原著换章条件),
            原著切换说明: 取字符串数组(chapter?.原著切换说明),
            已完成摘要: 取字符串数组(chapter?.已完成摘要),
            当前待解问题: 取字符串数组(chapter?.当前待解问题),
            切章后沉淀要点: 取字符串数组(chapter?.切章后沉淀要点)
        },
        下一章预告: {
            标题: 取文本(preview?.标题),
            大纲: 取字符串数组(preview?.大纲),
            进入条件: 取字符串数组(preview?.进入条件),
            风险提示: 取字符串数组(preview?.风险提示)
        },
        历史卷宗: Array.isArray(story?.历史卷宗)
            ? story.历史卷宗
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    所属章节范围: 取文本(item?.所属章节范围),
                    所属分解组: Math.max(1, 取数字(item?.所属分解组, 1)),
                    章节总结: 取字符串数组(item?.章节总结),
                    延续事项: 取字符串数组(item?.延续事项),
                    关系变化: 取字符串数组(item?.关系变化),
                    势力变化: 取字符串数组(item?.势力变化),
                    地点变化: 取字符串数组(item?.地点变化),
                    资源变化: 取字符串数组(item?.资源变化),
                    分歧线变化: 取字符串数组(item?.分歧线变化),
                    记录时间: 取文本(item?.记录时间)
                }))
                .filter((item) => item.标题 || item.章节总结.length > 0)
            : [],
        章节时间校准: 规范化章节时间校准(story?.章节时间校准)
    };
};

export const 创建空剧情规划 = (): 剧情规划结构 => ({
    当前章目标: [],
    当前章任务: [],
    跨章延续事项: [],
    待触发事件: [],
    镜头规划: [],
    换章规则: {
        本章完成判定: [],
        允许切章条件: [],
        禁止切章条件: [],
        切章后需沉淀内容: [],
        切章后需清空字段: [],
        切章后需重建字段: []
    }
});

export const 规范化剧情规划状态 = (raw?: any): 剧情规划结构 => {
    const plan = raw && typeof raw === 'object' ? raw : {};
    const chapterRule = plan?.换章规则 && typeof plan.换章规则 === 'object' ? plan.换章规则 : {};
    return {
        当前章目标: 取字符串数组(plan?.当前章目标),
        当前章任务: Array.isArray(plan?.当前章任务)
            ? plan.当前章任务
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    任务说明: 取文本(item?.任务说明),
                    计划执行时间: 取文本(item?.计划执行时间),
                    最早执行时间: 取文本(item?.最早执行时间),
                    最晚执行时间: 取文本(item?.最晚执行时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    执行动作: 取字符串数组(item?.执行动作),
                    完成判定: 取字符串数组(item?.完成判定),
                    失败后转移: 取字符串数组(item?.失败后转移),
                    完成后沉淀: 取字符串数组(item?.完成后沉淀),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联势力: 取字符串数组(item?.关联势力),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.标题 || item.任务说明)
            : [],
        跨章延续事项: Array.isArray(plan?.跨章延续事项)
            ? plan.跨章延续事项
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    延续原因: 取字符串数组(item?.延续原因),
                    当前状态: 取字符串数组(item?.当前状态),
                    延续到何时: 取文本(item?.延续到何时),
                    后续接续条件: 取字符串数组(item?.后续接续条件),
                    终止条件: 取字符串数组(item?.终止条件)
                }))
                .filter((item) => item.标题 || item.当前状态.length > 0)
            : [],
        待触发事件: Array.isArray(plan?.待触发事件)
            ? plan.待触发事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    事件说明: 取文本(item?.事件说明),
                    计划触发时间: 取文本(item?.计划触发时间),
                    最早触发时间: 取文本(item?.最早触发时间),
                    最晚触发时间: 取文本(item?.最晚触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    成功结果: 取字符串数组(item?.成功结果),
                    失败结果: 取字符串数组(item?.失败结果),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        镜头规划: Array.isArray(plan?.镜头规划)
            ? plan.镜头规划
                .map((item: any) => ({
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    关联任务: 取字符串数组(item?.关联任务),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.镜头标题 || item.镜头内容)
            : [],
        换章规则: {
            本章完成判定: 取字符串数组(chapterRule?.本章完成判定),
            允许切章条件: 取字符串数组(chapterRule?.允许切章条件),
            禁止切章条件: 取字符串数组(chapterRule?.禁止切章条件),
            切章后需沉淀内容: 取字符串数组(chapterRule?.切章后需沉淀内容),
            切章后需清空字段: 取字符串数组(chapterRule?.切章后需清空字段),
            切章后需重建字段: 取字符串数组(chapterRule?.切章后需重建字段)
        }
    };
};

export const 创建空女主剧情规划 = (): 女主剧情规划结构 => ({
    阶段推进: [],
    女主条目: [],
    女主互动事件: [],
    女主镜头规划: []
});

export const 规范化女主剧情规划状态 = (raw?: any): 女主剧情规划结构 | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const plan = raw;
    return {
        阶段推进: Array.isArray(plan?.阶段推进)
            ? plan.阶段推进
                .map((item: any) => ({
                    阶段名: 取文本(item?.阶段名),
                    阶段目标: 取字符串数组(item?.阶段目标),
                    主推女主: 取字符串数组(item?.主推女主),
                    次推女主: 取字符串数组(item?.次推女主),
                    禁止越级对象: 取字符串数组(item?.禁止越级对象),
                    关联剧情任务: 取字符串数组(item?.关联剧情任务),
                    阶段完成判定: 取字符串数组(item?.阶段完成判定),
                    切换条件: 取字符串数组(item?.切换条件)
                }))
                .filter((item) => item.阶段名 || item.阶段目标.length > 0)
            : [],
        女主条目: Array.isArray(plan?.女主条目)
            ? plan.女主条目
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    类型: 取文本(item?.类型),
                    当前关系状态: 取文本(item?.当前关系状态),
                    当前阶段: 取文本(item?.当前阶段),
                    已成立事实: 取字符串数组(item?.已成立事实),
                    阶段目标: 取字符串数组(item?.阶段目标),
                    推进方式: 取字符串数组(item?.推进方式),
                    阻断因素: 取字符串数组(item?.阻断因素),
                    允许突破条件: 取字符串数组(item?.允许突破条件),
                    失败后回退: 取字符串数组(item?.失败后回退)
                }))
                .filter((item) => item.女主姓名)
            : [],
        女主互动事件: Array.isArray(plan?.女主互动事件)
            ? plan.女主互动事件
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    事件名: 取文本(item?.事件名),
                    事件说明: 取文本(item?.事件说明),
                    计划触发时间: 取文本(item?.计划触发时间),
                    最早触发时间: 取文本(item?.最早触发时间),
                    最晚触发时间: 取文本(item?.最晚触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    成功结果: 取字符串数组(item?.成功结果),
                    失败结果: 取字符串数组(item?.失败结果),
                    关联剧情任务: 取字符串数组(item?.关联剧情任务),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.女主姓名 || item.事件名)
            : [],
        女主镜头规划: Array.isArray(plan?.女主镜头规划)
            ? plan.女主镜头规划
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    触发条件: 取字符串数组(item?.触发条件),
                    关联事件: 取字符串数组(item?.关联事件),
                    关联剧情任务: 取字符串数组(item?.关联剧情任务),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.女主姓名 || item.镜头标题)
            : []
    };
};

export const 创建空同人剧情规划 = (): 同人剧情规划结构 => ({
    当前对齐信息: {
        当前分解组: 1,
        当前章节范围: '',
        当前章节标题: [],
        当前承接方式: '',
        当前原著状态: [],
        当前已形成偏转: []
    },
    当前章目标: [],
    当前章任务: [],
    分歧线: [],
    待触发事件: [],
    镜头规划: [],
    换组规则: {
        当前组完成判定: [],
        下一组进入条件: [],
        禁止换组条件: [],
        换组后沉淀内容: [],
        换组后需清空字段: [],
        换组后需重建字段: []
    }
});

export const 规范化同人剧情规划状态 = (raw?: any): 同人剧情规划结构 | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const plan = raw;
    const align = plan?.当前对齐信息 && typeof plan.当前对齐信息 === 'object' ? plan.当前对齐信息 : {};
    const switchRule = plan?.换组规则 && typeof plan.换组规则 === 'object' ? plan.换组规则 : {};
    return {
        当前对齐信息: {
            当前分解组: Math.max(1, 取数字(align?.当前分解组, 1)),
            当前章节范围: 取文本(align?.当前章节范围),
            当前章节标题: 取字符串数组(align?.当前章节标题),
            当前承接方式: 取文本(align?.当前承接方式),
            当前原著状态: 取字符串数组(align?.当前原著状态),
            当前已形成偏转: 取字符串数组(align?.当前已形成偏转)
        },
        当前章目标: 取字符串数组(plan?.当前章目标),
        当前章任务: Array.isArray(plan?.当前章任务)
            ? plan.当前章任务
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    任务说明: 取文本(item?.任务说明),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联原著事件: 取字符串数组(item?.关联原著事件),
                    保持不变的原著基线: 取字符串数组(item?.保持不变的原著基线),
                    当前偏转点: 取字符串数组(item?.当前偏转点),
                    计划执行时间: 取文本(item?.计划执行时间),
                    最早执行时间: 取文本(item?.最早执行时间),
                    最晚执行时间: 取文本(item?.最晚执行时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    执行动作: 取字符串数组(item?.执行动作),
                    完成判定: 取字符串数组(item?.完成判定),
                    偏转后果: 取字符串数组(item?.偏转后果),
                    未偏转后果: 取字符串数组(item?.未偏转后果),
                    完成后沉淀: 取字符串数组(item?.完成后沉淀),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.标题 || item.任务说明)
            : [],
        分歧线: Array.isArray(plan?.分歧线)
            ? plan.分歧线
                .map((item: any) => ({
                    分歧线名: 取文本(item?.分歧线名),
                    起点事件: 取文本(item?.起点事件),
                    关联分解组: 取数字数组(item?.关联分解组),
                    偏转原因: 取字符串数组(item?.偏转原因),
                    与原著不同之处: 取字符串数组(item?.与原著不同之处),
                    当前阶段: 取文本(item?.当前阶段),
                    影响范围: 取字符串数组(item?.影响范围),
                    下一步扩大条件: 取字符串数组(item?.下一步扩大条件),
                    回收条件: 取字符串数组(item?.回收条件),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.分歧线名 || item.起点事件)
            : [],
        待触发事件: Array.isArray(plan?.待触发事件)
            ? plan.待触发事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    事件说明: 取文本(item?.事件说明),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联原著事件: 取字符串数组(item?.关联原著事件),
                    计划触发时间: 取文本(item?.计划触发时间),
                    最早触发时间: 取文本(item?.最早触发时间),
                    最晚触发时间: 取文本(item?.最晚触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    触发后影响: 取字符串数组(item?.触发后影响),
                    错过后影响: 取字符串数组(item?.错过后影响),
                    若偏转则转入哪条分歧线: 取字符串数组(item?.若偏转则转入哪条分歧线),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        镜头规划: Array.isArray(plan?.镜头规划)
            ? plan.镜头规划
                .map((item: any) => ({
                    镜头标题: 取文本(item?.镜头标题),
                    关联分解组: 取数字数组(item?.关联分解组),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    触发条件: 取字符串数组(item?.触发条件),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    作用: 取字符串数组(item?.作用),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.镜头标题 || item.镜头内容)
            : [],
        换组规则: {
            当前组完成判定: 取字符串数组(switchRule?.当前组完成判定),
            下一组进入条件: 取字符串数组(switchRule?.下一组进入条件),
            禁止换组条件: 取字符串数组(switchRule?.禁止换组条件),
            换组后沉淀内容: 取字符串数组(switchRule?.换组后沉淀内容),
            换组后需清空字段: 取字符串数组(switchRule?.换组后需清空字段),
            换组后需重建字段: 取字符串数组(switchRule?.换组后需重建字段)
        }
    };
};

export const 创建空同人女主剧情规划 = (): 同人女主剧情规划结构 => ({
    阶段推进: [],
    女主条目: [],
    女主互动事件: [],
    女主镜头规划: []
});

export const 规范化同人女主剧情规划状态 = (raw?: any): 同人女主剧情规划结构 | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const plan = raw;
    return {
        阶段推进: Array.isArray(plan?.阶段推进)
            ? plan.阶段推进
                .map((item: any) => ({
                    阶段名: 取文本(item?.阶段名),
                    关联分解组: 取数字数组(item?.关联分解组),
                    主推女主: 取字符串数组(item?.主推女主),
                    次推女主: 取字符串数组(item?.次推女主),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    阶段目标: 取字符串数组(item?.阶段目标),
                    禁止越级对象: 取字符串数组(item?.禁止越级对象),
                    完成判定: 取字符串数组(item?.完成判定),
                    切换条件: 取字符串数组(item?.切换条件)
                }))
                .filter((item) => item.阶段名 || item.阶段目标.length > 0)
            : [],
        女主条目: Array.isArray(plan?.女主条目)
            ? plan.女主条目
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    类型: 取文本(item?.类型),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联原著关系线: 取字符串数组(item?.关联原著关系线),
                    保持不变的原著基线: 取字符串数组(item?.保持不变的原著基线),
                    当前偏转点: 取字符串数组(item?.当前偏转点),
                    所属分歧线: 取字符串数组(item?.所属分歧线),
                    当前关系状态: 取文本(item?.当前关系状态),
                    当前阶段: 取文本(item?.当前阶段),
                    已成立事实: 取字符串数组(item?.已成立事实),
                    阶段目标: 取字符串数组(item?.阶段目标),
                    推进方式: 取字符串数组(item?.推进方式),
                    阻断因素: 取字符串数组(item?.阻断因素),
                    允许突破条件: 取字符串数组(item?.允许突破条件),
                    失败后回退: 取字符串数组(item?.失败后回退)
                }))
                .filter((item) => item.女主姓名)
            : [],
        女主互动事件: Array.isArray(plan?.女主互动事件)
            ? plan.女主互动事件
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    事件名: 取文本(item?.事件名),
                    事件说明: 取文本(item?.事件说明),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联原著事件: 取字符串数组(item?.关联原著事件),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    计划触发时间: 取文本(item?.计划触发时间),
                    最早触发时间: 取文本(item?.最早触发时间),
                    最晚触发时间: 取文本(item?.最晚触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    成功结果: 取字符串数组(item?.成功结果),
                    失败结果: 取字符串数组(item?.失败结果),
                    与主剧情联动: 取字符串数组(item?.与主剧情联动),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.女主姓名 || item.事件名)
            : [],
        女主镜头规划: Array.isArray(plan?.女主镜头规划)
            ? plan.女主镜头规划
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    关联分解组: 取数字数组(item?.关联分解组),
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    触发条件: 取字符串数组(item?.触发条件),
                    关联事件: 取字符串数组(item?.关联事件),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.女主姓名 || item.镜头标题)
            : []
    };
};

export const 创建开场基础状态 = (charData: 角色数据结构, worldConfig: WorldGenConfig, openingConfig?: OpeningConfig) => {
    const 玩家门派 = 创建开局门派状态(charData, openingConfig);
    const 门派任务 = 是否无门派标识(玩家门派.ID)
        ? []
        : 从门派任务创建通用任务列表(
            玩家门派.名称,
            创建默认门派任务列表(玩家门派.名称, 生成稳定哈希(`${玩家门派.ID}|opening_tasks`), openingConfig),
            openingConfig
        );
    const 角色基态 = 补齐开局角色功法(深拷贝(charData), 玩家门派) as any;
    if (!是否无门派标识(玩家门派.ID)) {
        角色基态.所属门派ID = 玩家门派.ID;
        角色基态.门派职位 = 玩家门派.玩家职位;
        角色基态.门派贡献 = 玩家门派.玩家贡献;
    }
    const 角色 = 补齐开局仙侠字段(角色基态, openingConfig);
    const 社交 = 修复开局伙伴社交列表([], openingConfig, 角色);
    const 世界 = 创建开场空白世界();
    const 地图草稿层级 = Array.isArray(worldConfig?.mapDiyDraft?.nodes) && worldConfig.mapDiyDraft.nodes.length > 0
        ? buildWorldMapLayersFromDraft(worldConfig.mapDiyDraft)
        : [];
    if (地图草稿层级.length > 0) {
        世界.地图层级 = 地图草稿层级 as any;
    }
    const 开局任务 = 去重开局任务列表(确保开局主线任务(门派任务, 玩家门派, openingConfig));
    return {
        角色,
        环境: 创建开场空白环境(),
        游戏初始时间: '',
        社交,
        世界,
        战斗: 创建开场空白战斗(),
        玩家门派,
        任务列表: 开局任务,
        约定列表: [],
        剧情: 创建开场空白剧情(),
        剧情规划: 创建空剧情规划(),
        女主剧情规划: undefined as 女主剧情规划结构 | undefined,
        同人剧情规划: undefined as 同人剧情规划结构 | undefined,
        同人女主剧情规划: undefined as 同人女主剧情规划结构 | undefined
    };
};

export const 创建开场命令基态 = (openingBase?: Partial<ReturnType<typeof 创建开场基础状态>>): 开场命令基态 => ({
    角色: openingBase?.角色 ? 深拷贝(openingBase.角色) : 创建开场空白角色(),
    环境: openingBase?.环境 ? 深拷贝(openingBase.环境) : 创建开场空白环境(),
    社交: Array.isArray(openingBase?.社交) ? 深拷贝(openingBase.社交) : [],
    世界: openingBase?.世界 ? 深拷贝(openingBase.世界) : 创建开场空白世界(),
    战斗: openingBase?.战斗 ? 深拷贝(openingBase.战斗) : 创建开场空白战斗(),
    玩家门派: openingBase?.玩家门派 ? 规范化门派状态(openingBase.玩家门派) : 创建空门派状态(),
    任务列表: Array.isArray(openingBase?.任务列表) ? 深拷贝(openingBase.任务列表) : [],
    约定列表: Array.isArray(openingBase?.约定列表) ? 深拷贝(openingBase.约定列表) : [],
    剧情: openingBase?.剧情 ? 规范化剧情状态(openingBase.剧情) : 创建开场空白剧情(),
    剧情规划: openingBase?.剧情规划 ? 规范化剧情规划状态(openingBase.剧情规划) : 创建空剧情规划(),
    女主剧情规划: openingBase?.女主剧情规划 ? 规范化女主剧情规划状态(openingBase.女主剧情规划) : undefined,
    同人剧情规划: openingBase?.同人剧情规划 ? 规范化同人剧情规划状态(openingBase.同人剧情规划) : undefined,
    同人女主剧情规划: openingBase?.同人女主剧情规划 ? 规范化同人女主剧情规划状态(openingBase.同人女主剧情规划) : undefined
});

export const 构建前端清空开场状态 = (
    openingBase: ReturnType<typeof 创建开场基础状态>
): ReturnType<typeof 创建开场基础状态> => ({
    ...openingBase,
    角色: 创建开场空白角色(),
    环境: 创建开场空白环境(),
    社交: [],
    世界: 创建开场空白世界(),
    战斗: 创建开场空白战斗(),
    玩家门派: 创建空门派状态(),
    任务列表: [],
    约定列表: [],
    剧情: 创建开场空白剧情(),
    剧情规划: 创建空剧情规划(),
    女主剧情规划: undefined,
    同人剧情规划: undefined,
    同人女主剧情规划: undefined
});

export const 创建空记忆系统 = (): 记忆系统结构 => ({
    回忆档案: [],
    即时记忆: [],
    短期记忆: [],
    中期记忆: [],
    长期记忆: []
});

export const 战斗结束自动清空 = (battleLike: any): 战斗状态结构 => {
    const battle = 规范化战斗状态(battleLike);
    const 存活敌方 = battle.敌方.filter((enemy) => enemy.当前血量 > 0 || enemy.最大血量 <= 0);
    if (battle.是否战斗中 !== true || 存活敌方.length <= 0) {
        return 创建开场空白战斗();
    }
    return {
        ...battle,
        敌方: 存活敌方
    };
};

export const 按回合窗口裁剪历史 = (sourceHistory: 聊天记录结构[], roundLimit: number): 聊天记录结构[] => {
    const history = Array.isArray(sourceHistory) ? sourceHistory : [];
    const normalizedLimit = Math.max(0, Math.floor(Number(roundLimit) || 0));
    if (normalizedLimit <= 0) return [];

    const turnAnchors = history
        .map((item, idx) => (item.role === 'assistant' && item.structuredResponse ? idx : -1))
        .filter((idx) => idx >= 0);

    if (turnAnchors.length <= normalizedLimit) return [...history];

    const firstVisibleTurnPos = turnAnchors.length - normalizedLimit;
    if (firstVisibleTurnPos <= 0) return [...history];

    const prevTurnAnchor = turnAnchors[firstVisibleTurnPos - 1];
    const sliceStart = Math.min(history.length, prevTurnAnchor + 1);
    return history.slice(sliceStart);
};
