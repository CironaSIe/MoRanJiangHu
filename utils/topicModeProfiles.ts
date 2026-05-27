import type { WorldGenConfig, 题材模式类型 } from '../models/system';

export type 题材模式分组 = 'wuxia' | 'xianxia' | 'urban_xianxia' | 'modern' | 'apocalypse';

export interface 题材模式配置 {
    value: 题材模式类型;
    label: string;
    shortLabel: string;
    hint: string;
    group: 题材模式分组;
    worldDefaults: Pick<WorldGenConfig, 'worldName' | 'worldSize' | 'dynastySetting' | 'sectDensity' | 'tianjiaoSetting' | 'worldExtraRequirement'>;
    worldSizeLabel: string;
    worldSizeHint: string;
    dynastyLabel: string;
    dynastyHint: string;
    densityLabel: string;
    densityOptions: Array<{ value: WorldGenConfig['sectDensity']; label: string }>;
    densityPromptLabel: string;
    tianjiaoLabel: string;
    auctionName: string;
    marketVerb: string;
    currencyPrompt: string;
    currencyDisplayMode: 'wuxia' | 'xianxia' | 'urban' | 'modern' | 'apocalypse';
    currencyExchangePrompt: string;
    mapPrompt: string;
    skillNames: string[];
    backgroundSuggestions: string[];
    talentSuggestions: string[];
    presetItemKeywords: string[];
    promptLines: string[];
}

export const 题材模式配置表: Record<题材模式类型, 题材模式配置> = {
    武侠: {
        value: '武侠',
        label: '武侠世界',
        shortLabel: '武侠',
        hint: '江湖、门派、内力、武学与凡俗尺度成长。',
        group: 'wuxia',
        worldDefaults: {
            worldName: '墨澜江湖',
            worldSize: '九州宏大',
            dynastySetting: '王朝边地不稳，官府、帮派、门派与商路势力互相牵制。',
            sectDensity: '适中',
            tianjiaoSetting: '年轻一代以武学根基、实战胆识、师承资源和江湖名声分出高下。',
            worldExtraRequirement: '货币以铜钱、银子、金元宝为主，武学交易常用人情、门派贡献、镖银、药材和兵器折价；不要使用灵石或现代货币。'
        },
        worldSizeLabel: '江湖版图',
        worldSizeHint: '决定门派、城镇、关隘、水路与荒野的叙事尺度。',
        dynastyLabel: '王朝局势',
        dynastyHint: '朝廷、地方豪强、门派、帮会、商路与民间秩序。',
        densityLabel: '门派密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (隐世不出)' },
            { value: '适中', label: '适中 (数大门派)' },
            { value: '林立', label: '林立 (百家争鸣)' }
        ],
        densityPromptLabel: '门派密度',
        tianjiaoLabel: '少侠/高手设定',
        auctionName: '天下拍卖行',
        marketVerb: '流入拍卖行',
        currencyPrompt: '普通交易使用铜钱、银子、金元宝；大额江湖交易可折算为镖银、人情、药材、兵器或门派贡献。',
        currencyDisplayMode: 'wuxia',
        currencyExchangePrompt: '底层统一货币：1 金元宝 = 100 银子 = 100000 铜钱；1 银子 = 1000 铜钱。正文可写镖银、人情、药材或兵器折价，但结算时统一折回铜钱/银子/金元宝。',
        mapPrompt: '世界版图应按城镇、门派、山道、关隘、渡口、黑市、野外险地等江湖空间组织。',
        skillNames: ['医术', '毒术', '机关', '采集', '鉴定', '易容', '潜行', '经商'],
        backgroundSuggestions: ['镖局少东家', '门派外门', '江湖游侠', '药铺学徒', '寒门书生'],
        talentSuggestions: ['长途脚力', '人情练达', '稳扎稳打', '静心观微', '耐苦心性'],
        presetItemKeywords: ['刀剑', '护腕', '金创药', '秘籍残卷', '玉佩', '玄铁'],
        promptLines: [
            '本存档以武侠/江湖为核心题材，能力边界收束在门派、内力、武学、身法、器械、医毒、机关、江湖势力与凡俗社会秩序内。',
            '不把世界写成仙侠常态法术轰击、常态御空飞行、飞升位面或高频法宝斗法；若有玄异，也应保持稀少、暧昧、代价明确。'
        ]
    },
    仙侠: {
        value: '仙侠',
        label: '仙侠世界',
        shortLabel: '仙侠',
        hint: '古典仙侠世界，宗门、灵根、坊市、秘境与凡俗王朝并立。',
        group: 'xianxia',
        worldDefaults: {
            worldName: '玄衡界',
            worldSize: '九州宏大',
            dynastySetting: '凡俗王朝与修真宗门并立，灵脉复苏后各地争夺灵田、秘境与传承。',
            sectDensity: '林立',
            tianjiaoSetting: '灵根资质、道心、功法契合度和机缘共同决定成长速度，天骄并起但资源稀缺。',
            worldExtraRequirement: '修真交易以灵石、丹药、符箓、法器和功法贡献折价；凡俗交易可保留银钱口径，但不要让宗门核心交易使用现代货币。'
        },
        worldSizeLabel: '修真版图',
        worldSizeHint: '决定王朝、灵脉、宗门、坊市、秘境和禁地的叙事尺度。',
        dynastyLabel: '凡俗/宗门格局',
        dynastyHint: '凡俗王朝、修真宗门、坊市、散修、秘境资源与灵脉归属。',
        densityLabel: '宗门密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (隐世不出)' },
            { value: '适中', label: '适中 (数大宗门)' },
            { value: '林立', label: '林立 (百宗争道)' }
        ],
        densityPromptLabel: '宗门密度',
        tianjiaoLabel: '灵根/天骄设定',
        auctionName: '灵宝拍卖行',
        marketVerb: '流入坊市拍卖',
        currencyPrompt: '修真交易统一使用下品/中品/上品灵石；凡俗小额银钱只作为生活描写，重要结算折回灵石体系。',
        currencyDisplayMode: 'xianxia',
        currencyExchangePrompt: '底层统一货币：铜钱=下品灵石，银子=中品灵石，金元宝=上品灵石；1 中品灵石 = 1000 下品灵石，1 上品灵石 = 100 中品灵石 = 100000 下品灵石。',
        mapPrompt: '世界版图应按王朝、灵脉、宗门、坊市、秘境入口、洞府、禁地与凡俗城镇组织。',
        skillNames: ['炼器', '炼丹', '医术', '阵法', '符箓', '机关', '采集', '鉴定'],
        backgroundSuggestions: ['宗门旧徒', '散修遗孤', '灵田佃户', '坊市学徒', '修真家族旁支'],
        talentSuggestions: ['药灵体', '静心观微', '稳扎稳打', '灵觉敏锐', '耐苦心性'],
        presetItemKeywords: ['灵石', '飞剑', '丹药', '符箓', '阵盘', '玉简'],
        promptLines: [
            '本存档以仙侠/修真为核心题材，后续世界观、开场、变量、规划、世界演变与战斗判定都必须承接仙侠口径。',
            '能力边界允许灵气、灵根、灵力、神识、法宝、术法、神通、阵法、符箓、丹药、灵材、秘境、宗门修真与天劫/心魔/因果代价。',
            '高阶功法、法宝、灵材、秘境收益和跨境胜利都必须有稀缺度、门槛、代价、风险或势力后果。',
            '主角与重要 NPC 应维护修仙字段：灵根、灵根资质、当前灵力/最大灵力、当前神识/最大神识、丹田状态、道基状态、心魔值、功德、业力。'
        ]
    },
    灵气复苏: {
        value: '灵气复苏',
        label: '灵气复苏',
        shortLabel: '复苏',
        hint: '现代都市突然灵气复苏，普通社会正在被修行可能性改写。',
        group: 'urban_xianxia',
        worldDefaults: {
            worldName: '海川灵潮',
            worldSize: '弹丸之地',
            dynastySetting: '现代城市原本正常运转，近期灵气突然复苏，学校、医院、公司、治安系统、研究机构和民间觉醒者都在仓促适应。',
            sectDensity: '适中',
            tianjiaoSetting: '第一批觉醒者以灵感、体质、信息渠道、社会资源和风险承受力拉开差距，体系尚未稳定。',
            worldExtraRequirement: '本局是现代灵气复苏：复苏前日常经济使用人民币/电子支付，复苏后新兴修行交易可逐步出现灵晶、资源配给、研究额度、异常物资和情报；不要开局就写成成熟古代宗门社会。'
        },
        worldSizeLabel: '复苏版图',
        worldSizeHint: '决定城区、校园、医院、研究所、异常点、临时管制区和新兴暗市范围。',
        dynastyLabel: '现代复苏格局',
        dynastyHint: '城市制度、研究机构、治安系统、觉醒者组织、民间互助会和新兴暗市。',
        densityLabel: '觉醒者组织密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (刚有传闻)' },
            { value: '适中', label: '适中 (组织萌芽)' },
            { value: '林立', label: '密集 (多方抢先)' }
        ],
        densityPromptLabel: '觉醒者组织密度',
        tianjiaoLabel: '觉醒/社会资源设定',
        auctionName: '复苏暗市',
        marketVerb: '流入复苏暗市',
        currencyPrompt: '复苏前日常消费使用人民币、银行卡和电子支付；复苏后修行交易逐步使用灵晶、异常物资、研究额度、情报和人情，普通社会不会一夜之间改用古代银钱。',
        currencyDisplayMode: 'urban',
        currencyExchangePrompt: '底层统一货币：铜钱=复苏信用点，银子=千元账户/研究额度，金元宝=十万元账户/高阶资源额度；1 千元账户 = 1000 复苏信用点，1 十万元账户 = 100 千元账户 = 100000 复苏信用点。灵晶和异常物资可按稀缺度折回信用点。',
        mapPrompt: '世界版图应按城区、校园、医院、研究所、异常点、临时管制区、觉醒者据点、复苏暗市和城郊灵气节点组织。',
        skillNames: ['急救', '驾驶', '维修', '调查', '谈判', '计算机', '采集', '鉴定'],
        backgroundSuggestions: ['大学生', '急诊实习生', '研究助理', '社区志愿者', '公司职员'],
        talentSuggestions: ['灵觉敏锐', '过目不忘', '静心观微', '市井耳目', '稳扎稳打'],
        presetItemKeywords: ['手机', '检测仪', '古玉', '灵晶', '急救包', '防护服'],
        promptLines: [
            '本存档以现代灵气复苏为核心题材：故事开始时现代社会仍存在，灵气与修行可能性是突然出现或刚被确认的新变量。',
            '不要把开局直接写成成熟古代宗门社会；组织、暗市、修炼法和资源价格应有从混乱到成型的过程。',
            '主角与重要觉醒者可逐步维护修仙字段；普通人、公司、医院、学校和治安系统仍按现代逻辑行动。'
        ]
    },
    都市修仙: {
        value: '都市修仙',
        label: '都市修仙',
        shortLabel: '都市修仙',
        hint: '现代城市表面正常运转，暗处有修行家族、异人圈和灵气节点。',
        group: 'urban_xianxia',
        worldDefaults: {
            worldName: '临海市',
            worldSize: '弹丸之地',
            dynastySetting: '现代都市表面由公司、学校、医院、治安系统与社区秩序运转，暗处有修行家族、民间异人和灵气节点。',
            sectDensity: '稀少',
            tianjiaoSetting: '修行天赋隐藏在现代身份之后，资源包括现金、人脉、房产、药材渠道、古物和少量灵石。',
            worldExtraRequirement: '本局是现代都市修仙：日常消费必须使用人民币/现金/银行卡/电子支付等现代货币；修行圈高端交易可少量使用灵石、法器、符箓、药材、人情和情报，不要让普通超市、公交、医院使用银子铜钱。'
        },
        worldSizeLabel: '都市版图',
        worldSizeHint: '决定城区、学校、医院、公司、城郊、灵气节点和暗市的范围。',
        dynastyLabel: '现代社会格局',
        dynastyHint: '城市制度、公司学校、治安系统、修行家族、异人圈与灰色渠道。',
        densityLabel: '隐秘修行圈密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (传闻级)' },
            { value: '适中', label: '适中 (暗线可查)' },
            { value: '林立', label: '密集 (多方暗涌)' }
        ],
        densityPromptLabel: '隐秘修行圈密度',
        tianjiaoLabel: '天赋/社会资源设定',
        auctionName: '异闻暗市',
        marketVerb: '流入异闻暗市',
        currencyPrompt: '普通生活、工资、租房、交通和医院账单必须使用人民币、银行卡、电子支付；修行圈交易才可使用灵石、法器、符箓、药材、人情和情报。',
        currencyDisplayMode: 'urban',
        currencyExchangePrompt: '底层统一货币：铜钱=信用点/元级记账，银子=千元账户，金元宝=十万元账户；1 千元账户 = 1000 信用点，1 十万元账户 = 100 千元账户 = 100000 信用点。灵石、法器、药材和情报按圈内估值折回信用点。',
        mapPrompt: '世界版图应按城区、校园、医院、写字楼、城中村、古玩街、郊区灵气节点、暗市和隐秘洞府组织。',
        skillNames: ['急救', '驾驶', '维修', '调查', '谈判', '计算机', '潜行', '鉴定'],
        backgroundSuggestions: ['大学生', '急诊实习生', '古玩店学徒', '公司社畜', '修行家族旁支'],
        talentSuggestions: ['过目不忘', '静心观微', '市井耳目', '灵觉敏锐', '人情练达'],
        presetItemKeywords: ['手机', '银行卡', '古玉', '符箓', '药材', '灵石'],
        promptLines: [
            '本存档以都市修仙为核心题材：现代社会制度、交通、手机、互联网、人民币和现实职业逻辑必须成立，修行圈隐藏在暗处。',
            '普通人社会不默认知道修仙；修行资源、灵石、法器和符箓只在隐秘圈层、家族、暗市或特殊事件中流通。',
            '主角与重要修行者仍应维护修仙字段；但日常消费、身份背景和社会后果必须按现代城市逻辑处理。'
        ]
    },
    现代都市: {
        value: '现代都市',
        label: '现代都市',
        shortLabel: '都市',
        hint: '非古代、低玄或无玄现代生活，强调职业、人际、城市制度和现实货币。',
        group: 'modern',
        worldDefaults: {
            worldName: '海川市',
            worldSize: '弹丸之地',
            dynastySetting: '现代城市由企业、学校、社区、医院、媒体和治安系统构成，阶层流动、人情关系和职业压力共同推进剧情。',
            sectDensity: '稀少',
            tianjiaoSetting: '优势来自学历、技能、人脉、信息差、资金调度和心理韧性，不默认出现宗门修真。',
            worldExtraRequirement: '本局为现代都市现实/低玄题材：日常经济只使用人民币、工资、存款、欠款、合同、银行卡、电子支付等现代概念；不要使用银子、铜钱、灵石、宗门贡献作为普通货币。'
        },
        worldSizeLabel: '城市版图',
        worldSizeHint: '决定城区、社区、商圈、学校、公司、医院、郊区与交通网络范围。',
        dynastyLabel: '现代社会格局',
        dynastyHint: '企业、学校、社区、医院、媒体、治安系统、家庭与职业压力。',
        densityLabel: '组织/圈层密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (小圈层)' },
            { value: '适中', label: '适中 (多圈交错)' },
            { value: '林立', label: '密集 (派系复杂)' }
        ],
        densityPromptLabel: '组织/圈层密度',
        tianjiaoLabel: '能力/社会资源设定',
        auctionName: '二手交易所',
        marketVerb: '流入二手市场',
        currencyPrompt: '经济活动使用人民币、工资、银行卡、电子支付、合同、债务和信用；不要把银子、铜钱、灵石、宗门贡献写成普通货币。',
        currencyDisplayMode: 'modern',
        currencyExchangePrompt: '底层统一货币：铜钱=信用点/元级记账，银子=千元账户，金元宝=十万元账户；1 千元账户 = 1000 信用点，1 十万元账户 = 100 千元账户 = 100000 信用点。工资、债务、合同和现金都统一折回信用点。',
        mapPrompt: '世界版图应按城市行政区、社区、商圈、写字楼、学校、医院、城郊、交通站点和灰色渠道组织。',
        skillNames: ['急救', '驾驶', '维修', '调查', '谈判', '计算机', '经商', '鉴定'],
        backgroundSuggestions: ['寒门子弟', '公司职员', '实习记者', '合租青年', '小店店主'],
        talentSuggestions: ['账房脑子', '人情练达', '静心观微', '市井耳目', '稳扎稳打'],
        presetItemKeywords: ['手机', '笔记本电脑', '银行卡', '合同', '录音笔', '急救包'],
        promptLines: [
            '本存档以现代都市为核心题材：现实城市制度、职业压力、家庭关系、交通、手机、互联网、人民币和法律后果必须成立。',
            '不要默认古代王朝、宗门修真、灵石货币、门派贡献或江湖黑话；若出现低玄异常，也必须嵌入现代社会后果。'
        ]
    },
    末日丧尸: {
        value: '末日丧尸',
        label: '末日丧尸',
        shortLabel: '末日',
        hint: '现代秩序崩塌后的感染、生存、物资、营地和地下黑市。',
        group: 'apocalypse',
        worldDefaults: {
            worldName: '灰潮纪元',
            worldSize: '九州宏大',
            dynastySetting: '现代城市秩序因感染潮崩塌，幸存者营地、军方残部、掠夺团和医疗机构遗址争夺物资与安全区。',
            sectDensity: '稀少',
            tianjiaoSetting: '优势来自体能、冷静、求生技能、医疗知识、装备维护、团队信任和稀缺物资管理。',
            worldExtraRequirement: '本局为现代末日丧尸：交易以食物、饮水、药品、弹药、电池、燃油、工具、情报和安全通行权为主；旧货币仅作废纸或少数营地记账单位，不要使用银子、铜钱、灵石。'
        },
        worldSizeLabel: '废土版图',
        worldSizeHint: '决定城市废墟、郊区、避难所、公路、封锁线、医院和资源点范围。',
        dynastyLabel: '灾后秩序格局',
        dynastyHint: '幸存者营地、军方残部、掠夺团、医疗遗址、物资点和感染区。',
        densityLabel: '幸存者营地密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (孤岛求生)' },
            { value: '适中', label: '适中 (营地互通)' },
            { value: '林立', label: '密集 (多方割据)' }
        ],
        densityPromptLabel: '幸存者营地密度',
        tianjiaoLabel: '求生/感染压力设定',
        auctionName: '地下黑市',
        marketVerb: '流入地下黑市',
        currencyPrompt: '交易以食物、饮水、药品、弹药、电池、燃油、工具、情报、安全通行权和营地信用为主；旧纸币只可作为少数营地记账或废纸，不使用银子、铜钱、灵石。',
        currencyDisplayMode: 'apocalypse',
        currencyExchangePrompt: '底层统一货币：铜钱=营地信用点，银子=物资票，金元宝=安全通行牌；1 物资票 = 1000 营地信用点，1 安全通行牌 = 100 物资票 = 100000 营地信用点。食水、药品、弹药、燃油和情报按稀缺度折回营地信用点。',
        mapPrompt: '世界版图应按感染区、医院、商超、仓库、避难所、公路、封锁线、营地、地下黑市和资源点组织。',
        skillNames: ['急救', '维修', '驾驶', '搜索', '潜行', '射击', '近战', '谈判'],
        backgroundSuggestions: ['退役军人', '急诊医生', '汽修工', '仓储管理员', '社区志愿者'],
        talentSuggestions: ['耐苦心性', '静心观微', '长途脚力', '军阵直觉', '药理敏感'],
        presetItemKeywords: ['急救包', '罐头', '净水片', '电池', '燃油', '手电', '弩机'],
        promptLines: [
            '本存档以现代末日丧尸为核心题材：感染风险、噪音、补给、伤病、团队信任、营地政治与路线选择是主要压力。',
            '不要写古代王朝、宗门、灵石、银钱江湖交易；社会秩序应表现为现代设施残骸、幸存者营地、军方残部、掠夺团、地下黑市和隔离区。',
            '交易和奖励优先表现为物资、药品、弹药、电池、燃油、工具、情报、安全通行权或营地信用。'
        ]
    }
};

export const 题材模式顺序: 题材模式类型[] = ['武侠', '仙侠', '灵气复苏', '都市修仙', '现代都市', '末日丧尸'];

export const 规范化题材模式 = (mode?: unknown): 题材模式类型 => (
    mode === '灵气修仙'
        ? '灵气复苏'
        : typeof mode === 'string' && Object.prototype.hasOwnProperty.call(题材模式配置表, mode)
        ? mode as 题材模式类型
        : '武侠'
);

export const 获取题材模式配置 = (mode?: unknown): 题材模式配置 => (
    题材模式配置表[规范化题材模式(mode)]
);

export const 题材是否仙侠 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'xianxia' || group === 'urban_xianxia';
};

export const 题材是否现代 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'urban_xianxia' || group === 'modern' || group === 'apocalypse';
};

export const 获取题材模式选项 = () => (
    题材模式顺序.map((value) => {
        const profile = 题材模式配置表[value];
        return { value, label: profile.label, hint: profile.hint };
    })
);

export const 合并题材世界默认值 = (
    mode: 题材模式类型,
    previous?: Partial<WorldGenConfig>
): Partial<WorldGenConfig> => ({
    ...previous,
    ...获取题材模式配置(mode).worldDefaults,
    manualWorldPrompt: previous?.manualWorldPrompt || '',
    manualRealmPrompt: previous?.manualRealmPrompt || '',
    difficulty: previous?.difficulty || 'normal'
});
