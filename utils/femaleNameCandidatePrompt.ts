import { 选择女性姓名候选列表 } from './femaleNameSelector';

const 默认禁用模板名 = [
    '苏婉儿',
    '婉儿',
    '林清雪',
    '清雪',
    '柳若嫣',
    '若嫣',
    '灵儿',
    '月儿',
    '芷若',
    '小雅',
    '小柔',
    '小蝶',
    '小环',
    '小翠'
];

const 规范化姓名 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

export const 构建女性姓名候选提示词 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
    count?: number;
}): string => {
    const candidates = 选择女性姓名候选列表({
        usedNames: params?.usedNames,
        seed: params?.seed,
        count: params?.count ?? 100
    });
    if (candidates.length <= 0) return '';

    return [
        '【女性新角色姓名候选池】',
        '- 当本次输出需要创建、命名或确认新的女性 NPC、主要女性角色、女主、侍女、师姐、女修、姑娘、夫人等女性人物时，必须从下方候选姓名中选择一个真实姓名。',
        '- 禁止自造新的女性姓名；禁止使用“苏婉儿/婉儿/林清雪/清雪/柳若嫣/若嫣/灵儿/月儿/芷若/小雅/小柔/小蝶/小环/小翠”等模板名或小名。',
        '- 正文对白框 sender、`<变量规划>` 中的人物称呼、变量命令里的 `社交[i].姓名` 必须使用同一个候选姓名；代称可写入身份、简介、记忆或曾用名，不得写进姓名。',
        '- 若候选名已被当前存档使用，请改选列表中未使用的另一个候选名；同一存档内女性真实姓名不得重复。',
        `- 候选姓名（${candidates.length}个）：${candidates.join('、')}`
    ].join('\n');
};

export const 收集女性姓名候选已用名 = (stateLike?: any): string[] => {
    const used = new Set<string>();
    const push = (value: unknown) => {
        const name = 规范化姓名(value);
        if (name) used.add(name);
    };
    const social = Array.isArray(stateLike?.社交) ? stateLike.社交 : [];
    social.forEach((npc: any) => {
        push(npc?.姓名);
        if (Array.isArray(npc?.曾用名)) npc.曾用名.forEach(push);
    });
    push(stateLike?.角色?.姓名);
    默认禁用模板名.forEach(push);
    return Array.from(used);
};
