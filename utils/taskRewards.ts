import type { GameResponse } from '../types';

type RewardState = {
    角色: any;
    环境?: any;
    玩家门派?: any;
    任务列表: any[];
};

type RewardResult = {
    state: RewardState;
    changed: boolean;
    rewardLogs: string[];
};

const 取文本 = (value: unknown, fallback = ''): string => (
    typeof value === 'string' ? value.trim() : fallback
);

const 取数字 = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 稳定哈希文本 = (text: string): string => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
};

const 技艺等级由熟练度 = (value: number): string => {
    if (value <= 0) return '未入门';
    if (value < 25) return '入门';
    if (value < 45) return '初窥';
    if (value < 65) return '小成';
    if (value < 85) return '大成';
    return '登堂';
};

const 解析奖励片段 = (raw: string): string[] => (
    raw
        .split(/[，,、；;]/)
        .map((item) => item.trim())
        .filter(Boolean)
);

const 创建任务奖励物品 = (name: string, count: number, taskKey: string, index: number) => {
    const itemName = name.replace(/[【】\[\]]/g, '').trim();
    const itemType = /秘籍|手册|教程|功法|谱$|诀$/.test(itemName)
        ? '秘籍'
        : /钥匙|令牌|通行|凭证|徽章|证件/.test(itemName)
            ? '任务道具'
            : /绷带|药|药品|净水|饮水|食物|压缩饼干|口粮|急救包|补给/.test(itemName)
                ? '消耗品'
                : '材料';
    return {
        ID: `task_reward_${稳定哈希文本(`${taskKey}|${itemName}`)}_${index}`,
        名称: itemName,
        描述: '任务奖励获得。',
        类型: itemType,
        品质: '凡品',
        重量: 0.1,
        堆叠数量: Math.max(1, Math.trunc(count)),
        是否可堆叠: true,
        最大堆叠: 99,
        价值: 0,
        当前耐久: 0,
        最大耐久: 0,
        词条列表: [],
        物品来源类型: '任务奖励',
        来源描述: '任务奖励',
        视觉唯一性: '普通'
    };
};

const 奖励日志已存在 = (response: GameResponse, taskTitle: string): boolean => {
    const logs = Array.isArray(response.logs) ? response.logs : [];
    return logs.some((log: any) => {
        const text = 取文本(log?.text);
        return log?.sender === '奖励' && text.includes(`「${taskTitle}」`) && text.includes('奖励到账');
    });
};

export const 结算已完成任务奖励 = (
    params: {
        response: GameResponse;
        state: RewardState;
        normalizeRole?: (raw?: any, options?: any) => any;
        roleNormalizeOptions?: Record<string, unknown>;
    }
): RewardResult => {
    const response = params.response;
    const state: RewardState = {
        ...params.state,
        角色: 深拷贝(params.state.角色 || {}),
        玩家门派: 深拷贝(params.state.玩家门派 || {}),
        任务列表: Array.isArray(params.state.任务列表) ? 深拷贝(params.state.任务列表) : []
    };
    const role = state.角色 || {};
    const sect = state.玩家门派 || {};
    role.金钱 = role.金钱 && typeof role.金钱 === 'object' ? role.金钱 : { 金元宝: 0, 银子: 0, 铜钱: 0 };
    role.物品列表 = Array.isArray(role.物品列表) ? role.物品列表 : [];
    role.技艺 = Array.isArray(role.技艺) ? role.技艺 : [];

    let changed = false;
    const visibleRewardLogs: string[] = [];
    const responseLogs = Array.isArray(response.logs) ? response.logs : [];
    response.logs = responseLogs;

    state.任务列表 = state.任务列表.map((task: any, taskIndex: number) => {
        if (!task || typeof task !== 'object') return task;
        if (task.当前状态 !== '已完成' || task.奖励已发放 === true) return task;

        const taskTitle = 取文本(task.标题, `任务${taskIndex + 1}`);
        const taskKey = `${取文本(task.类型)}|${taskTitle}|${取文本(task.发布人)}|${taskIndex}`;
        const issuer = 取文本(task.奖励发放人)
            || 取文本(task.发布人)
            || 取文本(sect.名称)
            || '任务发布人';
        const rewardDescriptions = Array.isArray(task.奖励描述)
            ? task.奖励描述.map((item: any) => 取文本(item)).filter(Boolean)
            : [];
        const rewardRecords: string[] = [];
        const itemRewards: any[] = [];

        rewardDescriptions.flatMap(解析奖励片段).forEach((part, rewardIndex) => {
            const contributionMatch = part.match(/(?:门派贡献|营地贡献|组织信用|贡献点|资源额度|信用额度)\s*[+＋]\s*(\d+)/u);
            if (contributionMatch) {
                const amount = Math.max(0, Math.trunc(Number(contributionMatch[1])));
                if (amount > 0) {
                    const previousCurrentContribution = Math.max(0, 取数字(sect.玩家贡献));
                    const previousTotalContribution = Math.max(0, 取数字(sect.累计贡献), previousCurrentContribution);
                    sect.玩家贡献 = previousCurrentContribution + amount;
                    sect.累计贡献 = previousTotalContribution + amount;
                    role.门派贡献 = Math.max(0, 取数字(role.门派贡献)) + amount;
                    rewardRecords.push(`${contributionMatch[0].replace(/\s+/g, ' ')}`);
                    changed = true;
                }
                return;
            }

            const moneyMatch = part.match(/(金元宝|元宝|银子|银两|铜钱)\s*[+＋]\s*(\d+)/u);
            if (moneyMatch) {
                const key = moneyMatch[1] === '元宝' ? '金元宝' : moneyMatch[1] === '银两' ? '银子' : moneyMatch[1];
                const amount = Math.max(0, Math.trunc(Number(moneyMatch[2])));
                if (amount > 0) {
                    role.金钱[key] = Math.max(0, 取数字(role.金钱[key])) + amount;
                    rewardRecords.push(`${key} +${amount}`);
                    changed = true;
                }
                return;
            }

            const attrMatch = part.match(/(?:可分配属性点|属性点)\s*[+＋]\s*(\d+)/u);
            if (attrMatch) {
                const amount = Math.max(0, Math.trunc(Number(attrMatch[1])));
                if (amount > 0) {
                    role.可分配属性点 = Math.max(0, 取数字(role.可分配属性点)) + amount;
                    rewardRecords.push(`可分配属性点 +${amount}`);
                    changed = true;
                }
                return;
            }

            const skillMatch = part.match(/^([\u4e00-\u9fa5A-Za-z0-9_·]{1,12})(?:技能|技艺)?熟练度\s*[+＋]\s*(\d+)$/u)
                || part.match(/^([\u4e00-\u9fa5A-Za-z0-9_·]{1,12})(?:技能|技艺)\s*[+＋]\s*(\d+)$/u);
            if (skillMatch && !/贡献|信用|额度|属性点|铜钱|银子|元宝/.test(skillMatch[1])) {
                const skillName = skillMatch[1].trim();
                const amount = Math.max(0, Math.trunc(Number(skillMatch[2])));
                if (skillName && amount > 0) {
                    const current = role.技艺.find((item: any) => 取文本(item?.名称) === skillName);
                    if (current) {
                        current.熟练度 = Math.min(100, Math.max(0, 取数字(current.熟练度)) + amount);
                        current.等级 = 技艺等级由熟练度(current.熟练度);
                    } else {
                        const proficiency = Math.min(100, amount);
                        role.技艺.push({
                            名称: skillName,
                            等级: 技艺等级由熟练度(proficiency),
                            熟练度: proficiency,
                            描述: '任务奖励带来的实践积累。'
                        });
                    }
                    rewardRecords.push(`${skillName}熟练度 +${amount}`);
                    changed = true;
                }
                return;
            }

            const itemMatch = part.match(/^(.+?)\s*(?:x|×|\*)\s*(\d+)$/iu);
            if (itemMatch) {
                const itemName = itemMatch[1].trim();
                const count = Math.max(1, Math.trunc(Number(itemMatch[2])));
                if (itemName) {
                    itemRewards.push(创建任务奖励物品(itemName, count, taskKey, rewardIndex));
                    rewardRecords.push(`${itemName} x${count}`);
                    changed = true;
                }
            }
        });

        if (itemRewards.length > 0) {
            role.物品列表.push(...itemRewards);
        }

        const finalRecords = rewardRecords.length > 0 ? rewardRecords : ['奖励说明已确认'];
        if (!奖励日志已存在(response, taskTitle)) {
            const completionText = `【任务完成】「${taskTitle}」已由${issuer}确认完成。`;
            const rewardText = `【奖励到账】「${taskTitle}」由${issuer}发放：${finalRecords.join('、')}。背包、贡献、技艺和属性点已同步更新。`;
            response.logs.push({ sender: '奖励', text: completionText });
            response.logs.push({ sender: '奖励', text: rewardText });
            visibleRewardLogs.push(completionText, rewardText);
        }

        changed = true;
        return {
            ...task,
            奖励已发放: true,
            奖励发放时间: 取文本(state.环境?.时间) || new Date().toISOString(),
            奖励发放人: issuer,
            奖励到账记录: [
                ...(Array.isArray(task.奖励到账记录) ? task.奖励到账记录 : []),
                ...finalRecords
            ]
        };
    });

    if (changed && params.normalizeRole) {
        state.角色 = params.normalizeRole(role, {
            当前时间: state.环境,
            事件文本: visibleRewardLogs.join('\n'),
            ...params.roleNormalizeOptions
        });
    } else {
        state.角色 = role;
    }
    state.玩家门派 = sect;
    return { state, changed, rewardLogs: visibleRewardLogs };
};
