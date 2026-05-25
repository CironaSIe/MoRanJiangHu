import { 任务分类列表, type 任务结构, type 任务目标, type 任务类型 } from '../models/task';

const 取数字 = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

export const 任务目标已完成 = (objective: Partial<任务目标> | any): boolean => {
    if (!objective || typeof objective !== 'object') return false;
    if (objective.完成状态 === true) return true;
    const total = 取数字(objective.总需进度, 0);
    if (total <= 0) return false;
    return 取数字(objective.当前进度, 0) >= total;
};

const 任务类型集合 = new Set<string>(任务分类列表);

const 合并任务文本 = (task: any): string => [
    task?.类型,
    task?.标题,
    task?.描述,
    task?.发布人,
    task?.发布地点,
    task?.推荐境界,
    task?.剧情暗线,
    Array.isArray(task?.目标列表) ? task.目标列表.map((item: any) => item?.描述).join(' ') : '',
    Array.isArray(task?.奖励描述) ? task.奖励描述.join(' ') : ''
].filter(Boolean).join(' ');

export const 归一化任务类型 = (task: any): 任务类型 => {
    const rawType = typeof task?.类型 === 'string' ? task.类型.trim() : '';
    if (任务类型集合.has(rawType)) return rawType as 任务类型;
    const text = 合并任务文本(task);
    if (/门派|宗门|师门|同门|山门|藏经阁|聚宝阁|外务堂|戒律|贡献|俸禄/u.test(text)) return '门派';
    if (/悬赏|悬榜|通缉|赏金|缉拿|缉盗|追捕/u.test(text)) return '悬赏';
    if (/传闻|流言|风声|消息|打听|坊间|江湖传言/u.test(text)) return '传闻';
    if (/奇遇|偶遇|机缘|秘境|异象|突发|误入|邂逅/u.test(text)) return '奇遇';
    if (/主线|主剧情|核心|宿命|血仇|身世|家族旧案|命脉/u.test(text)) return '主线';
    return '支线';
};

export const 规范化任务自动结算 = (task: 任务结构 | any): 任务结构 | any => {
    if (!task || typeof task !== 'object') return task;
    const objectives = Array.isArray(task.目标列表)
        ? task.目标列表.map((objective: any) => {
            const done = 任务目标已完成(objective);
            const total = Math.max(0, 取数字(objective?.总需进度, 0));
            const current = Math.max(0, 取数字(objective?.当前进度, done ? total : 0));
            return {
                ...objective,
                当前进度: done && total > 0 ? Math.max(current, total) : current,
                完成状态: done,
            };
        })
        : [];
    const allObjectivesDone = objectives.length > 0 && objectives.every(任务目标已完成);
    const currentStatus = typeof task.当前状态 === 'string' && task.当前状态.trim()
        ? task.当前状态
        : '进行中';
    const shouldAutoComplete = allObjectivesDone && currentStatus !== '已完成' && currentStatus !== '已失败';
    return {
        ...task,
        类型: 归一化任务类型(task),
        当前状态: shouldAutoComplete ? '已完成' : currentStatus,
        目标列表: objectives,
    };
};

export const 规范化任务列表自动结算 = (tasks: any[]): any[] => (
    Array.isArray(tasks) ? tasks.map(规范化任务自动结算) : []
);
