import type { 开局预设方案结构 } from './newGamePresets';
import { 题材模式配置表, 题材模式顺序 } from '../utils/topicModeProfiles';

export type 创意工坊模块类型 = 'topic' | 'world_rules' | 'opening' | 'ability';
export type 创意工坊模块来源 = 'builtin' | 'cloud' | 'local';

export interface 创意工坊模块条目 {
    id: string;
    type: 创意工坊模块类型;
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    payload: Record<string, unknown>;
    injectionPreview: string[];
    preset?: 开局预设方案结构;
    source?: 创意工坊模块来源;
    contributor?: string;
    createdAt?: string;
    updatedAt?: string;
    downloadUrl?: string;
    sha256?: string;
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

const 题材默认角色: Record<keyof typeof 题材模式配置表, { 姓名: string; 背景: string; 天赋: string[]; 开局补充: string }> = {
    武侠: { 姓名: '沈砚', 背景: '门派外门', 天赋: ['稳扎稳打', '人情练达'], 开局补充: '第一幕从镖局、门派外门、药铺或江湖小镇切入，保持武侠尺度。' },
    仙侠: { 姓名: '沈玄', 背景: '宗门旧徒', 天赋: ['药灵体', '静心观微'], 开局补充: '第一幕从低阶宗门、坊市或灵田压力切入，不直接赠送高阶法宝。' },
    灵气复苏: { 姓名: '林澈', 背景: '城市学生', 天赋: ['灵觉敏锐', '耐苦心性'], 开局补充: '第一幕从校园、医院、研究点或异常封控现场切入，保留现代社会惯性。' },
    都市修仙: { 姓名: '许临安', 背景: '都市散修', 天赋: ['静心观微', '经商嗅觉'], 开局补充: '第一幕从公司、家族、人脉债务或城市暗市切入，不要直接进入成熟宗门社会。' },
    现代都市: { 姓名: '周行', 背景: '普通职员', 天赋: ['人情练达', '稳扎稳打'], 开局补充: '第一幕从现实工作、家庭、人情、商业或城市案件切入，不写成超凡常态。' },
    末日丧尸: { 姓名: '陈砾', 背景: '维修工', 天赋: ['稳扎稳打', '独行者'], 开局补充: '第一幕从安全屋、医院遗址、商超搜索或营地冲突切入。' }
};

const 构建题材模块 = (mode: keyof typeof 题材模式配置表): 创意工坊模块条目 => {
    const profile = 题材模式配置表[mode];
    const actor = 题材默认角色[mode];
    return {
        id: `topic-${profile.value}`,
        type: 'topic',
        title: `${profile.shortLabel}题材模板`,
        subtitle: `${profile.worldSizeLabel}、${profile.dynastyLabel}、${profile.tianjiaoLabel}`,
        description: `把新开局切换到${profile.label}口径，注入货币、地图空间、势力关系和基础叙事边界。`,
        tags: [profile.shortLabel, profile.currencyDisplayMode, profile.group],
        payload: profile,
        injectionPreview: [
            `worldConfig.worldExtraRequirement：${profile.worldDefaults.worldExtraRequirement}`,
            `worldConfig.manualWorldPrompt：${profile.promptLines.join(' / ')}`,
            `openingConfig.题材模式：${mode}`,
            `货币/市场口径：${profile.currencyExchangePrompt}`
        ],
        source: 'builtin',
        contributor: '官方',
        preset: 构建题材预设(`workshop_topic_${profile.value}`, `工坊·${profile.shortLabel}`, `${profile.label}开局模板。`, mode, 构建角色(actor.姓名, actor.背景, actor.天赋), actor.开局补充)
    };
};

const 构建世界规则模块 = (mode: keyof typeof 题材模式配置表): 创意工坊模块条目 => {
    const profile = 题材模式配置表[mode];
    return {
        id: `world-rules-${profile.value}`,
        type: 'world_rules',
        title: `${profile.shortLabel}世界规则`,
        subtitle: `${profile.auctionName}、${profile.marketVerb}`,
        description: `为${profile.label}补齐世界边界、交易折价、地图组织和资源规则。`,
        tags: [profile.shortLabel, '世界规则', '货币'],
        payload: {
            worldExtraRequirement: profile.worldDefaults.worldExtraRequirement,
            currencyExchangePrompt: profile.currencyExchangePrompt,
            marketVerb: profile.marketVerb,
            mapPrompt: profile.mapPrompt
        },
        injectionPreview: [
            `worldConfig.worldExtraRequirement：${profile.worldDefaults.worldExtraRequirement}`,
            `货币折算提示：${profile.currencyExchangePrompt}`,
            `地图生成提示：${profile.mapPrompt}`,
            `市场行为词：${profile.marketVerb}`
        ],
        source: 'builtin',
        contributor: '官方',
        preset: 构建题材预设(`workshop_world_rules_${profile.value}`, `工坊·${profile.shortLabel}世界规则`, `${profile.label}世界规则包。`, mode, 构建角色(题材默认角色[mode].姓名, 题材默认角色[mode].背景, 题材默认角色[mode].天赋), profile.worldDefaults.worldExtraRequirement)
    };
};

const 构建开局模块 = (mode: keyof typeof 题材模式配置表): 创意工坊模块条目 => {
    const profile = 题材模式配置表[mode];
    const actor = 题材默认角色[mode];
    const preset = 构建题材预设(`workshop_opening_${profile.value}`, `工坊·${profile.shortLabel}开局配置`, `${profile.label}开局关系和切入模板。`, mode, 构建角色(actor.姓名, actor.背景, actor.天赋), actor.开局补充);
    return {
        id: `opening-${profile.value}`,
        type: 'opening',
        title: `${profile.shortLabel}开局配置`,
        subtitle: `${preset.openingConfig?.初始关系模板 || '关系锚点'}、${preset.openingConfig?.开局切入偏好 || '第一幕切入'}`,
        description: `为${profile.label}注入第一幕切入、关系侧重、组织生成和同行者约束。`,
        tags: [profile.shortLabel, '开局配置', '关系'],
        payload: preset.openingConfig ? { ...preset.openingConfig } : {},
        injectionPreview: [
            `openingConfig.题材模式：${mode}`,
            `openingConfig.初始关系模板：${preset.openingConfig?.初始关系模板 || ''}`,
            `openingConfig.关系侧重：${(preset.openingConfig?.关系侧重 || []).join('、')}`,
            `openingExtraRequirement：${actor.开局补充}`
        ],
        source: 'builtin',
        contributor: '官方',
        preset
    };
};

const 构建能力模块 = (mode: keyof typeof 题材模式配置表): 创意工坊模块条目 => {
    const profile = 题材模式配置表[mode];
    const manualRealmPrompt = mode === '武侠'
        ? '能力体系：外功、内功、轻功、招式、医毒、机关与兵器熟练度；高手仍受体力、伤势、距离、兵器和江湖规矩限制。'
        : mode === '仙侠'
        ? '境界体系：练气、筑基、金丹、元婴、化神。每个大境界分初期/中期/后期/圆满；突破需要资源、心境、功法契合与风险。'
        : mode === '灵气复苏'
        ? '能力体系：未觉醒、灵感初启、觉醒者、稳定者、领域雏形；现代科研、封控和副作用必须参与约束。'
        : mode === '都市修仙'
        ? '能力体系：炼体、引气、凝神、筑基、金丹；修行必须和现代身份、资源渠道、人脉风险并存。'
        : mode === '现代都市'
        ? '成长体系：职业技能、人脉信用、资产管理、心理韧性和社会资源；不要常态化超凡力量。'
        : '能力体系：普通幸存者、熟练搜寻者、营地骨干、感染适应者、区域领袖；感染、伤病、弹药和信任限制成长速度。';
    const actor = 题材默认角色[mode];
    const preset = 构建题材预设(`workshop_ability_${profile.value}`, `工坊·${profile.shortLabel}能力体系`, `${profile.label}能力边界包。`, mode, 构建角色(actor.姓名, actor.背景, actor.天赋));
    return {
        id: `ability-${profile.value}`,
        type: 'ability',
        title: `${profile.shortLabel}能力体系`,
        subtitle: profile.skillNames.slice(0, 4).join('、'),
        description: `为${profile.label}注入成长边界、技能方向和手动能力/境界提示词。`,
        tags: [profile.shortLabel, '能力体系', '成长边界'],
        payload: { manualRealmPrompt, skillNames: profile.skillNames },
        injectionPreview: [
            `worldConfig.manualRealmPrompt：${manualRealmPrompt}`,
            `可用技艺：${profile.skillNames.join('、')}`,
            `能力边界：${profile.promptLines.join(' / ')}`
        ],
        source: 'builtin',
        contributor: '官方',
        preset: {
            ...preset,
            worldConfig: {
                ...preset.worldConfig,
                manualRealmPrompt
            }
        }
    };
};

export const 创意工坊模块列表: 创意工坊模块条目[] = [
    ...题材模式顺序.map(构建题材模块),
    ...题材模式顺序.map(构建世界规则模块),
    ...题材模式顺序.map(构建开局模块),
    ...题材模式顺序.map(构建能力模块),
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
        injectionPreview: [
            `worldConfig.worldExtraRequirement：${题材模式配置表.末日丧尸.worldDefaults.worldExtraRequirement}`,
            `货币折算提示：${题材模式配置表.末日丧尸.currencyExchangePrompt}`,
            `市场行为词：${题材模式配置表.末日丧尸.marketVerb}`
        ],
        source: 'builtin',
        contributor: '官方',
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
        injectionPreview: [
            'openingConfig.初始关系模板：师门牵引',
            'openingConfig.关系侧重：师门、友情',
            'openingConfig.开局生成门派/同门：true'
        ],
        source: 'builtin',
        contributor: '官方',
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
            manualRealmPrompt: '境界体系：练气、筑基、金丹、元婴、化神。每个大境界分初期/中期/后期/圆满；突破需要资源、心境、功法契合与风险。不要让跨大境界胜利变成常态，法宝、丹药和秘境收益必须有代价。'
        },
        injectionPreview: [
            'worldConfig.manualRealmPrompt：练气、筑基、金丹、元婴、化神。',
            '覆盖方式：安装为开局预设后写入世界配置的手动境界提示词。',
            '边界要求：突破需要资源、心境、功法契合与风险。'
        ],
        source: 'builtin',
        contributor: '官方',
        preset: {
            ...构建题材预设('workshop_ability_xianxia_manual_realm', '工坊·标准仙侠境界体系', '带手动境界提示词的仙侠能力体系包。', '仙侠', 构建角色('陆云川', '散修遗孤', ['灵觉敏锐', '耐苦心性'])),
            worldConfig: {
                ...题材模式配置表.仙侠.worldDefaults,
                difficulty: 'normal',
                manualWorldPrompt: 题材模式配置表.仙侠.promptLines.join('\n'),
                manualRealmPrompt: '境界体系：练气、筑基、金丹、元婴、化神。每个大境界分初期/中期/后期/圆满；突破需要资源、心境、功法契合与风险。不要让跨大境界胜利变成常态，法宝、丹药和秘境收益必须有代价。'
            }
        }
    }
];
