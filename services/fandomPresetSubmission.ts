import type { OpeningConfig, WorldGenConfig, 小说拆分数据集结构 } from '../types';
import { 构建同步API地址 } from '../utils/nativeRuntime';

export type 同人世界观预设提交结果 = {
    ok: boolean;
    pullRequestUrl?: string;
    branch?: string;
    message?: string;
};

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 截断文本 = (value: unknown, maxLength: number): string => {
    const text = 读取文本(value);
    return text.length > maxLength ? `${text.slice(0, maxLength)}\n\n...（已截断）` : text;
};

const 构建数据集公开摘要 = (dataset?: 小说拆分数据集结构 | null) => {
    if (!dataset) return null;
    return {
        标题: 读取文本(dataset.标题),
        作品名: 读取文本(dataset.作品名),
        来源类型: dataset.来源类型,
        总章节数: dataset.总章节数,
        原始文本长度: dataset.原始文本长度,
        原始文本摘要: 截断文本(dataset.原始文本摘要, 1200),
        当前阶段概括: 截断文本(dataset.当前阶段概括, 3000),
        核心角色摘要: (dataset.核心角色摘要 || []).slice(0, 30).map((item) => 截断文本(item, 500)),
        核心角色: (dataset.核心角色 || []).slice(0, 80),
        角色档案: (dataset.角色档案 || []).slice(0, 120),
        势力档案: (dataset.势力档案 || []).slice(0, 80),
        地图地点档案: (dataset.地图地点档案 || []).slice(0, 120),
        分段摘要: (dataset.分段列表 || []).slice(0, 24).map((segment) => ({
            标题: 读取文本(segment.标题),
            章节范围: 读取文本(segment.章节范围),
            章节标题: (segment.章节标题 || []).slice(0, 12),
            是否开局组: segment.是否开局组 === true,
            原文摘要: 截断文本(segment.原文摘要, 1200),
            本组概括: 截断文本(segment.本组概括, 1800),
            开局已成立事实: (segment.开局已成立事实 || []).slice(0, 20),
            原著硬约束: (segment.原著硬约束 || []).slice(0, 20).map((item) => 截断文本(item.内容, 600)),
            登场角色: (segment.登场角色 || []).slice(0, 40),
            角色档案: (segment.角色档案 || []).slice(0, 40),
            势力档案: (segment.势力档案 || []).slice(0, 30),
            地图地点档案: (segment.地图地点档案 || []).slice(0, 40)
        })),
        注入树摘要: (dataset.注入树 || []).slice(0, 40).map((node) => ({
            标题: 读取文本(node.标题),
            类型: node.类型,
            目标链路: node.目标链路,
            内容: 截断文本(node.内容, 1200)
        }))
    };
};

export const 提交同人世界观预设 = async (params: {
    worldConfig: WorldGenConfig;
    openingConfig: OpeningConfig;
    dataset?: 小说拆分数据集结构 | null;
    submitterNote?: string;
}): Promise<同人世界观预设提交结果> => {
    const worldName = 读取文本(params.worldConfig.worldName);
    const workTitle = 读取文本(params.openingConfig.同人融合.作品名)
        || 读取文本(params.dataset?.作品名)
        || 读取文本(params.dataset?.标题)
        || worldName;
    const manualWorldPrompt = 读取文本(params.worldConfig.manualWorldPrompt);

    if (!workTitle) {
        throw new Error('请先填写同人作品名，或选择一个包含作品名的小说分解数据集。');
    }
    if (!manualWorldPrompt && !读取文本(params.worldConfig.worldExtraRequirement) && !params.dataset) {
        throw new Error('请先提供手动世界观提示词、世界观额外要求，或选择小说分解数据集。');
    }

    const response = await fetch(构建同步API地址('/api/fandom-presets/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workTitle,
            worldName: worldName || workTitle,
            worldPrompt: manualWorldPrompt,
            worldExtraRequirement: 读取文本(params.worldConfig.worldExtraRequirement),
            realmPrompt: 读取文本(params.worldConfig.manualRealmPrompt),
            openingConfig: params.openingConfig,
            datasetSummary: 构建数据集公开摘要(params.dataset),
            submitterNote: 截断文本(params.submitterNote, 1200),
            submittedAt: new Date().toISOString()
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `提交失败（HTTP ${response.status}）`);
    }
    return payload as 同人世界观预设提交结果;
};
