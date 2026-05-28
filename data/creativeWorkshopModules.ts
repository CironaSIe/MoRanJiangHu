import type { 开局预设方案结构 } from './newGamePresets';
import { 题材模式配置表 } from '../utils/topicModeProfiles';

export type 创意工坊模块类型 = 'topic' | 'world_rules' | 'opening' | 'ability';

export interface 创意工坊模块条目 {
    id: string;
    type: 创意工坊模块类型;
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    payload: Record<string, unknown>;
    preset?: 开局预设方案结构;
}

const 通用属性 = {
    力量: 5,
    敏捷: 5,
    体质: 5,
    根骨: 5,
    悟性: 5,
    福源: 5
};

const 构建角色 = (姓名: string, 背景名称: string, 天赋名称列表: string[]): 开局预设方案结构['character'] => ({
    姓名,
    性别: '男',
    年龄: 18,
    出生月: 1,
    出生日: 1,
    外貌: '衣着利落，随身带着符合题材的基础行囊。',
    性格: '谨慎、可靠，遇事先观察局势再行动。',
    属性: { ...通用属性 },
    背景名称,
    天赋名称列表
});

const 构建题材预设 = (
    id: string,
    名称: string,
    简介: string,
    mode: keyof typeof 题材模式配置表,
    character: 开局预设方案结构['character'],
    openingExtraRequirement = ''
): 开局预设方案结构 => {
    const profile = 题材模式配置表[mode];
    return {
        id,
        名称,
        简介,
        worldConfig: {
            ...profile.worldDefaults,
            difficulty: 'normal',
            manualWorldPrompt: profile.promptLines.join('\n'),
            manualRealmPrompt: ''
        },
        character,
        openingConfig: {
            配置约束启用: true,
            题材模式: mode,
            初始关系模板: mode === '末日丧尸' ? '独行少系' : mode === '现代都市' ? '世家官门' : '师门牵引',
            关系侧重: mode === '末日丧尸' ? ['友情', '利益'] : ['师门', '友情'],
            开局切入偏好: mode === '末日丧尸' ? '风波前夜' : mode === '现代都市' ? '日常低压' : '门派起手',
            开局生成门派: mode !== '现代都市' && mode !== '末日丧尸',
            开局生成同门: mode !== '现代都市' && mode !== '末日丧尸',
            初始伙伴: {
                enabled: true,
                姓名: '',
                性别: '女',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '眉眼清亮，行动干练。',
                性格: '稳重可靠，愿意和主角共同承担风险。',
                属性: { ...通用属性 },
                背景名称: '',
                背景描述: '',
                背景效果: '',
                天赋列表: [],
                关系: '开局同行者',
                备注: ''
            },
            同人融合: {
                enabled: false,
                作品名: '',
                来源类型: '小说',
                融合强度: '轻度映射',
                保留原著角色: false,
                启用角色替换: false,
                替换目标角色名: '',
                附加替换角色名列表: [],
                附加角色替换规则列表: [],
                启用附加小说: false,
                附加小说数据集ID: ''
            }
        },
        openingStreaming: true,
        openingExtraRequirement
    };
};

export const 创意工坊模块分区: Array<{ id: 创意工坊模块类型; title: string; description: string }> = [
    { id: 'topic', title: '题材模板', description: '套用题材口径、货币、地图空间和基础提示词。' },
    { id: 'world_rules', title: '世界规则', description: '注入感染、文明密度、资源、市场和基础设施规则。' },
    { id: 'opening', title: '开局配置', description: '注入第一幕切入、关系锚点、组织和同行者约束。' },
    { id: 'ability', title: '能力体系', description: '注入境界、觉醒、堕化或非超凡成长边界。' }
];

export const 创意工坊模块列表: 创意工坊模块条目[] = [
    {
        id: 'topic-xianxia-classic',
        type: 'topic',
        title: '古典仙侠模板',
        subtitle: '宗门、灵根、坊市、秘境',
        description: '把新开局切换到仙侠口径，包含灵石货币、修真地图、宗门关系和仙侠提示词。',
        tags: ['仙侠', '灵石', '宗门'],
        payload: 题材模式配置表.仙侠,
        preset: 构建题材预设('workshop_topic_xianxia_classic', '工坊·古典仙侠', '宗门、灵根、坊市、秘境并立的仙侠开局模板。', '仙侠', 构建角色('沈玄', '宗门旧徒', ['药灵体', '静心观微']), '第一幕从低阶宗门、坊市或灵田压力切入，不直接赠送高阶法宝。')
    },
    {
        id: 'topic-apocalypse-zombie',
        type: 'topic',
        title: '末日丧尸模板',
        subtitle: '感染、营地、物资、黑市',
        description: '把新开局切换到现代末日丧尸口径，避免银钱/灵石串台，强调补给与感染风险。',
        tags: ['末日', '丧尸', '物资'],
        payload: 题材模式配置表.末日丧尸,
        preset: 构建题材预设('workshop_topic_apocalypse_zombie', '工坊·末日丧尸', '现代秩序崩塌后的感染、生存物资和营地政治。', '末日丧尸', 构建角色('陈砾', '维修工', ['稳扎稳打', '独行者']), '第一幕从安全屋、医院遗址、商超搜索或营地冲突切入。')
    },
    {
        id: 'world-rules-zombie-classic',
        type: 'world_rules',
        title: '经典生化感染规则',
        subtitle: '咬伤/血液传播，噪音与气味拉仇恨',
        description: '补齐感染路径、防护、隔离、补给折价和营地信用规则，适合末日丧尸题材。',
        tags: ['感染机制', '噪音', '营地信用'],
        payload: {
            worldExtraRequirement: 题材模式配置表.末日丧尸.worldDefaults.worldExtraRequirement,
            currencyExchangePrompt: 题材模式配置表.末日丧尸.currencyExchangePrompt,
            marketVerb: 题材模式配置表.末日丧尸.marketVerb
        },
        preset: 构建题材预设('workshop_world_rules_zombie_classic', '工坊·经典生化感染规则', '带感染机制、噪音风险和物资交易口径的末日规则包。', '末日丧尸', 构建角色('韩野', '医生/护士', ['静心观微', '耐苦心性']), '感染规则：咬伤/血液传播；噪音、血腥味、光源和防护装备影响风险；交易以食水、药品、弹药、燃油、情报和通行权折价。')
    },
    {
        id: 'opening-low-pressure-sect',
        type: 'opening',
        title: '低阶宗门开局',
        subtitle: '师门牵引、同门承接、资源压力',
        description: '适合仙侠/灵气复苏，第一幕从低阶宗门和资源压力进入，避免开局过强。',
        tags: ['开局配置', '师门', '同门'],
        payload: {
            初始关系模板: '师门牵引',
            关系侧重: ['师门', '友情'],
            开局切入偏好: '门派起手',
            开局生成门派: true,
            开局生成同门: true
        },
        preset: 构建题材预设('workshop_opening_low_pressure_sect', '工坊·低阶宗门开局', '师门牵引、同门承接、资源压力清晰的低阶仙侠开局。', '仙侠', 构建角色('顾青衡', '宗门旧徒', ['稳扎稳打', '药灵体']), '开局必须落在低阶宗门或坊市边缘，资源紧张但目标明确。')
    },
    {
        id: 'ability-xianxia-manual-realm',
        type: 'ability',
        title: '标准仙侠境界体系',
        subtitle: '练气到化神，保留手动覆盖优先级',
        description: '提供可导入的手动境界提示词，玩家也可以继续覆盖为自定义体系。',
        tags: ['境界', '仙侠', '手动提示词'],
        payload: {
            manualRealmPrompt: '境界体系：练气、筑基、金丹、元婴、化神。每个大境界分初期/中期/后期/圆满；突破需要资源、心境、功法契合与风险。不要让跨大境胜利变成常态，法宝、丹药和秘境收益必须有代价。'
        },
        preset: {
            ...构建题材预设('workshop_ability_xianxia_manual_realm', '工坊·标准仙侠境界体系', '带手动境界提示词的仙侠能力体系包。', '仙侠', 构建角色('陆云川', '散修遗孤', ['灵觉敏锐', '耐苦心性'])),
            worldConfig: {
                ...题材模式配置表.仙侠.worldDefaults,
                difficulty: 'normal',
                manualWorldPrompt: 题材模式配置表.仙侠.promptLines.join('\n'),
                manualRealmPrompt: '境界体系：练气、筑基、金丹、元婴、化神。每个大境界分初期/中期/后期/圆满；突破需要资源、心境、功法契合与风险。不要让跨大境胜利变成常态，法宝、丹药和秘境收益必须有代价。'
            }
        }
    }
];
