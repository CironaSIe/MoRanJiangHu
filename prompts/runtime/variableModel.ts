import type { GameResponse } from '../../types';
import { 构建开局变量生成承接提示 } from './openingVariableGenerationInit';
import { 按功能开关过滤提示词内容, 构建修炼体系附加块 } from '../../utils/promptFeatureToggles';

const 渲染变量模板 = (template: string, variables: Record<string, string>): string => (
    (template || '').replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_match, key) => variables[key] ?? '')
);

const 格式化多段文本 = (text: string): string => (
    (text || '')
        .split('\n')
        .map((line) => line.replace(/\s+$/g, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
);

export const 构建变量模型身份提示词 = (): string => 格式化多段文本([
    '你是 WuXia 项目的“独立变量生成引擎”。',
    '你不写正文，不续写剧情，只负责把本回合已经成立的变量变化落成最终变量命令。'
].join('\n'));

export const 构建变量模型职责提示词 = (options?: { survivalNeedsEnabled?: boolean; cultivationSystemEnabled?: boolean }): string => {
    const survivalNeedsEnabled = options?.survivalNeedsEnabled !== false;
    const cultivationSystemEnabled = options?.cultivationSystemEnabled !== false;

    return 按功能开关过滤提示词内容(
        格式化多段文本([
            '【职责】',
            '1. 每回合都要完整审计“当前变量数据 + 本回合正文 + 本回合变量规划”，并生成本回合应落地的变量命令。',
            '2. 正文优先于 `<变量规划>`；`<变量规划>` 是主剧情给你的自然语言变量说明稿与落点提醒，不是命令区。',
            '3. 只承认本回合已经前台成立的变化；未来安排、后续承接、镜头余波、未发生结果都不提前写成变量。',
            '4. 命令必须最小、合法、可执行；能改字段就不重写整对象，能补最小结构就不扩写整棵子树。',
            '5. 你只生成本回合应新增落地的最终变量命令，不输出修补旧命令、替换旧命令或取消旧命令的额外语法。',
            '6. 若当前是开局回合，就把它视为首回合全域初始化审计：逐域复核正式变量树，并补齐第1回合最小完整可用状态。',
            '7. 每回合都要复核物品复数合理性：任务道具、调兵令、钥匙、密函、信物、契约、地图、令牌等唯一剧情物品不得堆叠，发现复数必须修正为 1。',
            '8. 每回合先提取本回合正文里的全部 `【角色名】` 对话框人物，排除旁白、判定、系统和主角后逐个核对 `社交[]`；有对白框的人物必须走变量生成建档/补档，不允许只停留在对话渲染层或“剧情对话人物”兜底身份。',
            '9. 对话框人物未命中既有 `社交[]` 时，必须 `push 社交 = {...}` 新建完整 NPC 档案；命中半残档时，必须补齐 `性别/年龄/境界/身份/简介/是否主要角色/是否在场/记忆/天赋列表/出身背景/当前装备/背包/BUFF/DEBUFF/技艺/战斗数值/七部位状态`，不能继续写“未知/不详/剧情对话人物”。',
            '10. 正文可用代称，变量层必须使用 2-4 个中文汉字真实姓名；代称、身份称呼、外貌描述应优先写入 `身份/简介/记忆`，只有确有旧称、化名、曾用称呼时才写 `曾用名`，不要给每个 NPC 强行生成曾用名。新建女性 NPC 时必须避开本回合注入的【女性新角色姓名黑名单】，不要使用“苏婉儿/苏婉清/林婉儿/婉儿/清雪/若嫣/灵儿/月儿”等模板名；有独立对白框的女性、长期关系对象、关键承接对象，要按 NPC 协议同步补齐外貌、身材、衣着、称呼、关系突破条件、私密档案和名器档案。',
            '11. 每回合都要复核主角与 NPC 档案：主角必须具备 `角色.技艺`，所有 NPC 必须具备天赋列表、出身背景、当前装备、背包、BUFF、DEBUFF、技艺、七部位血量与状态；技艺必须跟随题材模式：武侠偏医术、毒术、机关、采集、鉴定、易容、潜行、经商；仙侠偏炼器、炼丹、医术、阵法、符箓、机关、采集、鉴定；灵气复苏偏现代生存/调查技能并逐步引入灵气应用；都市修仙/现代都市偏急救、驾驶、维修、调查、谈判、计算机、潜行或经商；末日丧尸偏急救、维修、驾驶、搜索、潜行、射击、近战、谈判。',
            '12. 若本次开局配置或当前存档题材模式为仙侠、灵气复苏、都市修仙，主角与重要修行者/觉醒者还必须维护 `灵根/灵根资质/当前灵力/最大灵力/当前神识/最大神识/丹田状态/道基状态/心魔值/功德/业力`；术法、神通、法宝、阵法、符箓、神识探查等事件必须同步消耗或恢复灵力/神识。现代都市和末日丧尸不要凭空补修真字段。',
            '13. 货币语义必须跟随题材模式并保持底层统一换算：武侠用铜钱/银子/金元宝；仙侠用下品/中品/上品灵石；灵气复苏日常用人民币/电子支付，复苏交易用灵晶、异常物资、研究额度、情报并折回复苏信用点；都市修仙日常用人民币、电子支付，修行圈高端交易才用灵石/法器/药材/情报并折回信用点；现代都市只用人民币、合同、工资、债务等现代经济口径；末日丧尸以食物、饮水、药品、弹药、电池、燃油、工具、情报和营地信用为主。',
            '14. 技艺不是静态装饰：若正文或变量规划出现学习、试炼、炼制、采集、辨物、治伤、布阵、机关、符箓、丹器、找人学艺、读书学艺等事实，要按故事发展逻辑更新对应角色或 NPC 的技艺等级、熟练度与描述；初始技艺应由天赋列表、出身背景、身份职责和经历共同解释。',
            '15. 若正文或变量规划确认了新地点（世界/大洲/城镇/建筑/房间），要同步 push `世界.地图层级` 节点（名称/层级/父级ID/描述），六层结构：寰宇→大地点→中地点→小地点→区地点→子地点。旧坐标字段已废弃。',
            '16. 每回合都必须刷新当前镜头快照：先确认 `环境` 的当前描写视角/当前位置，再根据本回合正文与对白只把明确在当前现场、出声、行动、被镜头点到、站在主角身边的人设为 `社交[i].是否在场 = true`；同时为这些 NPC 写入 `社交[i].当前位置` 与 `社交[i].位置路径`，位置路径格式为“大地点 > 中地点 > 小地点 > 具体地点”。其余旧在场 NPC 若本回合没有被当前现场确认，必须自然设为 `false`。远端、留守、待命、传闻、背景名单、曾经出现过的人都不是在场。',
            '17. 若玩家或正文明确指挥/安排 NPC 去某地、留守、调查、送信、传话、护送、等待、返回、汇合或执行差事，必须写回该 NPC 的 `当前任务 / 行动意图 / 待执行指令 / 指令来源 / 指令时间`；若有去向或汇合点，还要写 `当前位置 / 位置路径 / 预期汇合地点`，并在离开当前镜头时设 `是否在场=false`。后续回合除非正文确认完成、取消、改派或 NPC 回到现场，不得清空这些指令字段。',
            '18. 写入 `社交[i]` 前必须先核对当前变量数据中该索引的 `id/姓名/身份/最近记忆` 是否就是正文或变量规划中的目标人物；若无法确认索引，不要把 A 的状态、死亡、伤势、位置、指令或私密事实写到 B 身上，应优先补记忆或跳过该条。',
            '19. `社交[i].姓名` 必须是该人物的真实姓名，使用 2-4 个中文汉字；女性新角色不得使用本回合注入的黑名单模板名，同一存档内不得重复。已经存在的姓名、玩家手动改过的姓名、正文已稳定承接的姓名必须原样保留，不得为了风格统一或“更合理”而改名；即使老存档里已有“苏婉儿/婉儿/清雪”等模板名，也不要主动重命名。只有当前姓名是占位/代称，且本回合正文明确揭示真名时，才允许 `set 社交[i].姓名`。禁止把“自己/他/她/对方/那人/黑衣女子/某护卫/自己已经没有”等代称、身份、短句或正文动作写进姓名。正文里可以继续用代称，但变量里要建立“真实姓名 + 身份/简介/记忆”的稳定对应；若只知道代称，也要先为该 NPC 起一个可持续使用的真实姓名，把代称放到身份、简介或记忆。`曾用名` 只用于真实存在的旧称、化名、曾用称呼，不得为了凑字段给每个 NPC 都写。',
            '20. 禁止删除、清空或整组替换既有 `社交`：不要输出 `delete 社交`、`delete 社交[i]`、`set 社交 = [...]` 或 `set 社交[i] = {...}` 来移除/替换已建档 NPC。即使角色死亡、离队、失踪、被关押或暂时退场，也只能更新 `是否在场/当前位置/状态/生死状态/记忆/当前任务` 等字段，保留档案让后续读档和回忆能承接。只有玩家本回合输入明确要求删除某个 NPC 时，才允许由前端手动删除流程处理，变量生成仍不要主动删。',
            '21. 若正文明确确认某个 NPC 死亡、身亡、阵亡、战死、气绝、断气、毙命或已故，必须同步写回该 NPC：`当前血量 = 0`、`是否在场 = false`、`状态/生死状态/生命状态 = "死亡"`，并在 `DEBUFF` 中保留“死亡”状态；“昏死、濒死、重伤、险些身亡、差点死、未死”不得按死亡处理。',
            ...(survivalNeedsEnabled
                ? [[
                    '22. 生理系统开启时，要把时间推进、休整、进食、饮水、赶路、熬战等事实对应到精力',
                    构建修炼体系附加块('、内力'),
                    '、饱腹、口渴等变量联动。'
                ].join('')]
                : [])
        ].join('\n')),
        { 启用修炼体系: cultivationSystemEnabled }
    );
};

export const 构建变量模型系统提示词 = (options?: {
    worldEvolutionEnabled?: boolean;
    worldEvolutionUpdated?: boolean;
    survivalNeedsEnabled?: boolean;
    cultivationSystemEnabled?: boolean;
}): string => 格式化多段文本([
    构建变量模型身份提示词(),
    '',
    构建变量模型职责提示词({
        survivalNeedsEnabled: options?.survivalNeedsEnabled !== false,
        cultivationSystemEnabled: options?.cultivationSystemEnabled !== false
    })
].join('\n'));

export const 构建变量模型输出格式提示词 = (): string => 格式化多段文本([
    '【输出格式】',
    '- 你必须且只允许输出 3 个顶层标签，顺序固定为：`<thinking>`、`<说明>`、`<命令>`。',
    '- `<thinking>` 内按当前变量生成 COT 完成思考，不要把命令写进 `<thinking>`。',
        '- `<说明>` 每行使用 `- ` 前缀，只写“本回合确认了哪些变化 / 为什么这样落命令 / 哪些变量域被更新”。',
        '- `<命令>` 中每行只允许 `add|set|push|delete 路径 = 值` 这一种体例。',
        '- `<命令>` 不写替换旧命令、取消旧命令、伪索引修补或其他补丁语法；只写本回合最终新增的变量命令。',
        '- 正常回合与开局回合都应尽量产生命令；只有正文确实没有形成任何已成立变量变化时，`<命令>` 才允许为空。',
        '- 标量优先 `set`；明确数值增减才使用 `add`；数组新增优先 `push`；整项移除才使用 `delete`。',
        '- `社交` 是长期角色档案，不允许用 `delete 社交`、`delete 社交[i]`、`set 社交 = [...]` 或 `set 社交[i] = {...}` 删除、清空、整组重写或替换既有 NPC。',
        '- `<命令>` 内部排序固定为“先 `set/add`，再 `push`，最后 `delete`”；若同一数组存在多个 `delete`，继续按索引从大到小逆序输出。'
    ].join('\n'));

export const 构建变量模型COT伪装提示词 = (): string => 格式化多段文本([
    '<think>',
    '思考已结束',
    '</think>',
    '好的，我会先在<thinking>中完成变量生成思考，再按协议输出<说明>与<命令>，只根据当前变量数据、本回合正文和本回合变量规划生成最终变量命令：'
].join('\n'));

export const 构建变量模型用户提示词模板 = (): string => [
    '当前任务：',
    '我大致描述内容：',
    '${taskDescription}',
    '',
    '以下是当前的变量数据信息：',
    '${stateJson}',
    '',
    '${responseLabel}',
    '${responseLogs}',
    '',
    '${variablePlanLabel}',
    '${variablePlanText}',
    '',
    '${openingRoundHint}',
    '${extraPromptBlock}'
].join('\n');

export const 构建开局变量模型任务提示词模板 = (): string => [
    '当前任务：',
    '我大致描述内容：',
    '${taskDescription}',
    '',
    '${responseLabel}',
    '${responseLogs}',
    '',
    '${variablePlanLabel}',
    '${variablePlanText}',
    '',
    '${openingRoundHint}',
    '${extraPromptBlock}'
].join('\n');

export const 构建变量模型任务提示词模板 = (options?: { openingTaskContext?: boolean }): string => (
    options?.openingTaskContext
        ? 构建开局变量模型任务提示词模板()
        : 构建变量模型用户提示词模板()
);

export const 构建变量模型用户附加规则提示词 = (): string => '';

const 格式化日志 = (response: GameResponse): string => {
    const logs = Array.isArray(response?.logs) ? response.logs : [];
    if (logs.length === 0) return '未提供正文，请按空正文处理。';
    return logs
        .map((log) => {
            const sender = typeof log?.sender === 'string' && log.sender.trim() ? log.sender.trim() : '旁白';
            const text = typeof log?.text === 'string' ? log.text.trim() : '';
            return text ? `【${sender}】${text}` : '';
        })
        .filter(Boolean)
        .join('\n');
};

const 清理标签包裹文本 = (text: string, tagNames: string[]): string => {
    let result = (text || '').trim();
    tagNames.forEach((tag) => {
        const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result
            .replace(new RegExp(`<\\s*${escaped}\\s*>`, 'gi'), '')
            .replace(new RegExp(`<\\s*/\\s*${escaped}\\s*>`, 'gi'), '')
            .trim();
    });
    return result;
};

const 格式化变量规划文本 = (response: GameResponse): string => {
    const source = typeof response?.t_var_plan === 'string' ? response.t_var_plan : '';
    const cleaned = 清理标签包裹文本(source, ['变量规划', 'variableplan', 'variable_planning', 'varplan']);
    return cleaned || '未提供显式变量规划，需完全依据正文与当前变量数据补全本回合变量命令。';
};

type 变量任务提示词参数 = {
    stateJson: string;
    response: GameResponse;
    extraPrompt?: string;
    isOpeningRound?: boolean;
    openingTaskContext?: {
        currentGameTime?: string;
        openingRoleSetupText?: string;
        openingPartnerSetupText?: string;
        openingConfigText?: string;
    };
};

export const 构建变量模型任务提示词 = (params: 变量任务提示词参数): string => {
    const extraPrompt = (params.extraPrompt || '').trim();
    const useOpeningTaskContext = Boolean(params.openingTaskContext);
    const taskDescription = useOpeningTaskContext
        ? '你需要根据第0回合正文、开局变量规划和开局承接信息进行完整的开局变量命令生成。'
        : '你需要根据本回合正文和变量规划进行完整的变量命令生成。';
    const responseLabel = useOpeningTaskContext
        ? '以下是第0回合完整正文：'
        : '以下是本回合正文：';
    const variablePlanLabel = useOpeningTaskContext
        ? '以下是第0回合完整变量规划（自然语言初始化说明稿）：'
        : '以下是本回合变量规划（自然语言变量说明稿）：';
    const openingRoundHint = useOpeningTaskContext
        ? 构建开局变量生成承接提示(params.openingTaskContext)
        : (
            params.isOpeningRound === true
                ? '【开局承接提示】\n- 当前是第0回合后的首轮变量生成；要把第1回合会读取的前台变量树逐域初始化到最小完整可用状态，不把它当普通补丁。'
                : ''
        );
    const extraPromptBlock = extraPrompt ? `【补充任务提示】\n${extraPrompt}` : '';

    return 格式化多段文本(渲染变量模板(构建变量模型任务提示词模板({
        openingTaskContext: useOpeningTaskContext
    }), {
        taskDescription,
        stateJson: (params.stateJson || '').trim() || '{}',
        responseLabel,
        responseLogs: 格式化日志(params.response),
        variablePlanLabel,
        variablePlanText: 格式化变量规划文本(params.response),
        openingRoundHint,
        extraPromptBlock
    }));
};

export const 构建变量模型用户提示词 = (params: 变量任务提示词参数): string => (
    构建变量模型任务提示词(params)
);
