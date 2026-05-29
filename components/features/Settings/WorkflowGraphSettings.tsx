import React, { useEffect, useMemo, useState } from 'react';
import { 功能模型占位配置结构, 接口设置结构, 单接口配置结构 } from '../../../types';
import GameButton from '../../ui/GameButton';
import InlineSelect from '../../ui/InlineSelect';
import {
    获取主剧情接口配置,
    获取剧情回忆接口配置,
    获取文章优化接口配置,
    获取变量计算接口配置,
    获取世界演变接口配置,
    获取规划分析接口配置,
    获取地图自动更新接口配置,
    获取记忆总结接口配置,
    获取记忆精炼接口配置,
    获取小说拆分接口配置,
    接口配置是否可用,
    规范化接口设置
} from '../../../utils/apiConfig';

type StageStatus = 'enabled' | 'disabled' | 'fallback' | 'blocked';

type FlowStage = {
    id: string;
    title: string;
    subtitle: string;
    row: number;
    order: number;
    status: StageStatus;
    channel: string;
    channelId: string;
    model: string;
    note: string;
    localOnly?: boolean;
    configTab?: string;
    modelConfig?: StageModelConfig;
};

type PlaceholderKey = keyof 功能模型占位配置结构;

type StageModelConfig = {
    kind: 'main' | 'placeholder';
    title: string;
    modelKey?: PlaceholderKey;
    channelKey?: PlaceholderKey;
    baseUrlKey?: PlaceholderKey;
    apiKeyKey?: PlaceholderKey;
    enableKeys?: PlaceholderKey[];
    fallbackModel?: string;
};

const trim = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

const statusText: Record<StageStatus, string> = {
    enabled: '已启用',
    disabled: '未启用',
    fallback: '跟随',
    blocked: '未就绪'
};

const statusClass: Record<StageStatus, string> = {
    enabled: 'border-emerald-400/45 bg-emerald-950/25 text-emerald-100',
    disabled: 'border-gray-700 bg-black/25 text-gray-400',
    fallback: 'border-sky-400/35 bg-sky-950/20 text-sky-100',
    blocked: 'border-amber-400/45 bg-amber-950/25 text-amber-100'
};

const resolveChannelId = (settings: 接口设置结构, channelName: string): string => {
    return settings.configs.find((cfg) => cfg.名称 === channelName)?.id || '';
};

const buildStage = (
    settings: 接口设置结构,
    params: {
        id: string;
        title: string;
        subtitle: string;
        row: number;
        order: number;
        enabled: boolean;
        fallback?: boolean;
        api: ReturnType<typeof 获取主剧情接口配置>;
        note: string;
        localOnly?: boolean;
        showNoteWhenDisabled?: boolean;
        configTab?: string;
        modelConfig?: StageModelConfig;
    }
): FlowStage => {
    const available = params.localOnly || 接口配置是否可用(params.api);
    const channel = trim(params.api?.名称) || '未配置渠道';
    return {
        id: params.id,
        title: params.title,
        subtitle: params.subtitle,
        row: params.row,
        order: params.order,
        status: params.enabled
            ? (available ? (params.fallback ? 'fallback' : 'enabled') : 'blocked')
            : 'disabled',
        channel: params.localOnly ? '本地状态处理' : channel,
        channelId: resolveChannelId(settings, channel),
        model: params.localOnly ? '不调用 AI' : (trim(params.api?.model) || '未选择模型'),
        note: params.enabled || params.showNoteWhenDisabled ? params.note : '当前开关关闭，本阶段不会执行。',
        localOnly: params.localOnly,
        configTab: params.configTab,
        modelConfig: params.modelConfig
    };
};

const WorkflowGraphSettings: React.FC<{
    settings: 接口设置结构;
    onSave?: (settings: 接口设置结构) => void;
    onNavigate?: (tab: string) => void;
}> = ({ settings, onSave, onNavigate }) => {
    const [form, setForm] = useState<接口设置结构>(() => 规范化接口设置(settings));
    const [modelOptionsByStage, setModelOptionsByStage] = useState<Record<string, string[]>>({});
    const [loadingStageId, setLoadingStageId] = useState('');
    const [stageMessages, setStageMessages] = useState<Record<string, string>>({});

    useEffect(() => {
        setForm(规范化接口设置(settings));
    }, [settings]);

    const normalized = useMemo(() => 规范化接口设置(form), [form]);
    const feature = normalized.功能模型占位;
    const mainApi = 获取主剧情接口配置(normalized);

    const persistForm = (updater: (prev: 接口设置结构) => 接口设置结构) => {
        setForm((prev) => {
            const next = 规范化接口设置(updater(规范化接口设置(prev)));
            onSave?.(next);
            return next;
        });
    };

    const setStageMessage = (stageId: string, message: string) => {
        setStageMessages((prev) => ({ ...prev, [stageId]: message }));
    };

    const stages = useMemo<FlowStage[]>(() => {
        const recallApi = 获取剧情回忆接口配置(normalized);
        const polishApi = 获取文章优化接口配置(normalized);
        const variableApi = 获取变量计算接口配置(normalized);
        const worldApi = 获取世界演变接口配置(normalized);
        const planningApi = 获取规划分析接口配置(normalized);
        const mapApi = 获取地图自动更新接口配置(normalized);
        const memorySummaryApi = 获取记忆总结接口配置(normalized);
        const memoryRefineApi = 获取记忆精炼接口配置(normalized);
        const novelApi = 获取小说拆分接口配置(normalized);

        return [
            buildStage(normalized, {
                id: 'input',
                title: '玩家输入',
                subtitle: '本回合选择与上下文',
                row: 0,
                order: 0,
                enabled: true,
                fallback: true,
                api: mainApi,
                note: '收集当前存档、记忆、世界书、变量和玩家输入。'
            }),
            buildStage(normalized, {
                id: 'recall',
                title: '剧情回忆',
                subtitle: '正文前检索',
                row: 1,
                order: 0,
                enabled: Boolean(feature.剧情回忆独立模型开关),
                api: recallApi,
                configTab: 'recall',
                modelConfig: {
                    kind: 'placeholder',
                    title: '剧情回忆',
                    modelKey: '剧情回忆使用模型',
                    channelKey: '剧情回忆渠道ID',
                    baseUrlKey: '剧情回忆API地址',
                    apiKeyKey: '剧情回忆API密钥',
                    enableKeys: ['剧情回忆独立模型开关']
                },
                showNoteWhenDisabled: true,
                note: `第 ${Math.max(1, Number(feature.剧情回忆最早触发回合) || 10)} 回合起可触发；${Boolean(feature.剧情回忆独立模型开关) ? '结果会注入主剧情上下文。' : '当前开关关闭，本阶段不会执行。'}`
            }),
            buildStage(normalized, {
                id: 'main',
                title: '主剧情',
                subtitle: '生成正文和基础命令',
                row: 2,
                order: 0,
                enabled: true,
                api: mainApi,
                configTab: 'api',
                modelConfig: { kind: 'main', title: '主剧情' },
                note: '核心正文阶段，后续阶段主要依赖它的正文、命令和模拟状态。'
            }),
            buildStage(normalized, {
                id: 'polish',
                title: '文章优化',
                subtitle: '正文润色',
                row: 3,
                order: 0,
                enabled: Boolean(feature.文章优化独立模型开关),
                api: polishApi,
                configTab: 'polish',
                modelConfig: {
                    kind: 'placeholder',
                    title: '文章优化',
                    modelKey: '文章优化使用模型',
                    channelKey: '文章优化渠道ID',
                    baseUrlKey: '文章优化API地址',
                    apiKeyKey: '文章优化API密钥',
                    enableKeys: ['文章优化独立模型开关']
                },
                note: '依赖主剧情原始正文；与变量生成渠道分离时可并行，合并时只影响展示正文。'
            }),
            buildStage(normalized, {
                id: 'variable',
                title: '变量生成',
                subtitle: '补全状态命令',
                row: 3,
                order: 1,
                enabled: Boolean(feature.变量计算独立模型开关),
                api: variableApi,
                configTab: 'variable_model',
                modelConfig: {
                    kind: 'placeholder',
                    title: '变量生成',
                    modelKey: '变量计算使用模型',
                    channelKey: '变量计算渠道ID',
                    baseUrlKey: '变量计算API地址',
                    apiKeyKey: '变量计算API密钥',
                    enableKeys: ['变量计算独立模型开关']
                },
                note: '依赖主剧情原始响应，产出的命令会进入后续模拟状态；与文章优化可并行。'
            }),
            buildStage(normalized, {
                id: 'world',
                title: '动态世界',
                subtitle: '世界演变',
                row: 4,
                order: 0,
                enabled: feature.世界演变功能启用 !== false && Boolean(feature.世界演变独立模型开关),
                api: worldApi,
                configTab: 'world_evolution',
                modelConfig: {
                    kind: 'placeholder',
                    title: '动态世界',
                    modelKey: '世界演变使用模型',
                    channelKey: '世界演变渠道ID',
                    baseUrlKey: '世界演变API地址',
                    apiKeyKey: '世界演变API密钥',
                    enableKeys: ['世界演变功能启用', '世界演变独立模型开关']
                },
                note: '依赖变量生成后的快照；与规划、地图渠道分离时可并行。'
            }),
            buildStage(normalized, {
                id: 'planning',
                title: '规划分析',
                subtitle: '剧情规划修订',
                row: 4,
                order: 1,
                enabled: feature.规划分析功能启用 !== false && (
                    Boolean(feature.规划分析独立模型开关)
                    || Boolean(feature.剧情规划独立模型开关)
                    || Boolean(feature.女主规划独立模型开关)
                ),
                api: planningApi,
                configTab: 'planning_model',
                modelConfig: {
                    kind: 'placeholder',
                    title: '规划分析',
                    modelKey: '规划分析使用模型',
                    channelKey: '规划分析渠道ID',
                    baseUrlKey: '规划分析API地址',
                    apiKeyKey: '规划分析API密钥',
                    enableKeys: ['规划分析功能启用', '规划分析独立模型开关']
                },
                note: '依赖变量生成后的快照；并行后按固定顺序合并命令。'
            }),
            buildStage(normalized, {
                id: 'map',
                title: '地图更新',
                subtitle: '地点树增量',
                row: 4,
                order: 2,
                enabled: feature.地图生成功能启用 !== false,
                fallback: !feature.地图自动更新独立模型开关,
                api: mapApi,
                configTab: 'map_model',
                modelConfig: {
                    kind: 'placeholder',
                    title: '地图更新',
                    modelKey: '地图自动更新使用模型',
                    channelKey: '地图自动更新渠道ID',
                    baseUrlKey: '地图自动更新API地址',
                    apiKeyKey: '地图自动更新API密钥',
                    enableKeys: ['地图生成功能启用', '地图自动更新独立模型开关']
                },
                note: '依赖变量生成后的快照；最后只应用地图层级命令。'
            }),
            buildStage(normalized, {
                id: 'apply',
                title: '最终落盘',
                subtitle: '合并命令并存档',
                row: 5,
                order: 0,
                enabled: true,
                fallback: true,
                api: mainApi,
                localOnly: true,
                note: '不调用 AI；汇总正文、变量、世界、规划、地图命令后写入本地状态。'
            }),
            buildStage(normalized, {
                id: 'summary',
                title: '记忆总结',
                subtitle: '阈值触发',
                row: 9,
                order: 0,
                enabled: Boolean(feature.记忆总结独立模型开关),
                fallback: !feature.记忆总结独立模型开关,
                api: memorySummaryApi,
                configTab: 'memory_summary_model',
                modelConfig: {
                    kind: 'placeholder',
                    title: '记忆总结',
                    modelKey: '记忆总结使用模型',
                    channelKey: '记忆总结渠道ID',
                    baseUrlKey: '记忆总结API地址',
                    apiKeyKey: '记忆总结API密钥',
                    enableKeys: ['记忆总结独立模型开关']
                },
                note: '达到记忆阈值后触发，不属于每回合主队列。'
            }),
            buildStage(normalized, {
                id: 'refine',
                title: '记忆精炼',
                subtitle: '手动整理',
                row: 9,
                order: 1,
                enabled: Boolean(feature.记忆精炼独立模型开关),
                fallback: !feature.记忆精炼独立模型开关,
                api: memoryRefineApi,
                configTab: 'memory_refine_model',
                modelConfig: {
                    kind: 'placeholder',
                    title: '记忆精炼',
                    modelKey: '记忆精炼使用模型',
                    channelKey: '记忆精炼渠道ID',
                    baseUrlKey: '记忆精炼API地址',
                    apiKeyKey: '记忆精炼API密钥',
                    enableKeys: ['记忆精炼独立模型开关']
                },
                note: '由回忆整理入口触发，可复用记忆总结或独立渠道。'
            }),
            buildStage(normalized, {
                id: 'novel',
                title: '小说分解',
                subtitle: '数据集构建',
                row: 9,
                order: 2,
                enabled: Boolean(feature.小说拆分功能启用),
                fallback: !feature.小说拆分独立模型开关,
                api: novelApi,
                configTab: 'novel_decomposition',
                modelConfig: {
                    kind: 'placeholder',
                    title: '小说分解',
                    modelKey: '小说拆分使用模型',
                    channelKey: '小说拆分渠道ID',
                    baseUrlKey: '小说拆分API地址',
                    apiKeyKey: '小说拆分API密钥',
                    enableKeys: ['小说拆分功能启用', '小说拆分独立模型开关']
                },
                note: '离线/后台数据处理阶段，不会自动等同于注入世界观。'
            })
        ];
    }, [feature, mainApi, normalized]);

    const mainPipeline = stages.filter((stage) => stage.row <= 6);
    const sidePipeline = stages.filter((stage) => stage.row === 9);
    const rows = Array.from(new Set(mainPipeline.map((stage) => stage.row))).map((row) => (
        mainPipeline.filter((stage) => stage.row === row).sort((a, b) => a.order - b.order)
    ));

    const parallelCandidates = [
        {
            titles: '动态世界 / 规划分析 / 地图更新',
            possible: true,
            reason: '代码已解耦为同一份变量后快照；三者渠道都不同且接口可用时会并行，否则按左到右顺序串行。',
            channels: ['world', 'planning', 'map']
        },
        {
            titles: '文章优化 / 变量生成',
            possible: true,
            reason: '代码已改为同读主剧情原始快照；两者渠道不同且接口可用时并行，否则按左到右顺序串行。',
            channels: ['polish', 'variable']
        }
    ].map((item) => {
        const related = item.channels
            .map((id) => stages.find((stage) => stage.id === id))
            .filter((stage): stage is FlowStage => Boolean(stage));
        const enabled = related.filter((stage) => stage.status === 'enabled' || stage.status === 'fallback');
        const channelIds = enabled.map((stage) => stage.channelId || stage.channel).filter(Boolean);
        const hasSeparateChannels = enabled.length > 1 && new Set(channelIds).size === enabled.length;
        return {
            ...item,
            hasSeparateChannels,
            channelsText: enabled.map((stage) => `${stage.title}:${stage.channel}`).join('，') || '暂无启用阶段'
        };
    });

    const getSelectedConfig = (channelId?: string): 单接口配置结构 | null => (
        normalized.configs.find((cfg) => cfg.id === channelId) || normalized.configs[0] || null
    );

    const updatePlaceholderStage = (stage: FlowStage, patch: Partial<功能模型占位配置结构>) => {
        const cfg = stage.modelConfig;
        if (!cfg || cfg.kind !== 'placeholder') return;
        persistForm((prev) => ({
            ...prev,
            功能模型占位: {
                ...prev.功能模型占位,
                ...((cfg.enableKeys || []).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<string, unknown>) as Partial<功能模型占位配置结构>),
                ...patch
            }
        }));
    };

    const updateMainChannel = (channelId: string) => {
        const nextConfig = normalized.configs.find((cfg) => cfg.id === channelId) || normalized.configs[0] || null;
        persistForm((prev) => ({
            ...prev,
            activeConfigId: channelId || prev.activeConfigId,
            功能模型占位: {
                ...prev.功能模型占位,
                主剧情使用模型: trim(nextConfig?.model) || prev.功能模型占位.主剧情使用模型
            }
        }));
    };

    const updateMainModel = (model: string) => {
        const activeId = normalized.activeConfigId || normalized.configs[0]?.id || '';
        persistForm((prev) => ({
            ...prev,
            configs: prev.configs.map((cfg) => cfg.id === activeId ? { ...cfg, model, updatedAt: Date.now() } : cfg),
            功能模型占位: { ...prev.功能模型占位, 主剧情使用模型: model }
        }));
    };

    const fetchModelsForStage = async (stage: FlowStage) => {
        const cfg = stage.modelConfig;
        if (!cfg) return;
        const selectedChannelId = cfg.kind === 'main'
            ? (normalized.activeConfigId || normalized.configs[0]?.id || '')
            : trim(normalized.功能模型占位[cfg.channelKey!]) || normalized.activeConfigId || normalized.configs[0]?.id || '';
        const selectedConfig = getSelectedConfig(selectedChannelId);
        const resolvedBaseUrl = cfg.kind === 'placeholder' ? trim(normalized.功能模型占位[cfg.baseUrlKey!]) || trim(selectedConfig?.baseUrl) : trim(selectedConfig?.baseUrl);
        const resolvedApiKey = cfg.kind === 'placeholder' ? trim(normalized.功能模型占位[cfg.apiKeyKey!]) || trim(selectedConfig?.apiKey) : trim(selectedConfig?.apiKey);
        if (!resolvedBaseUrl || !resolvedApiKey) {
            setStageMessage(stage.id, '请先选择有 Base URL 和 API Key 的渠道。');
            return;
        }
        setLoadingStageId(stage.id);
        setStageMessage(stage.id, '');
        try {
            const base = resolvedBaseUrl.replace(/\/+$/, '');
            const normalizedBase = base.replace(/\/v1$/i, '');
            const candidateUrls = Array.from(new Set([
                `${normalizedBase}/v1/models`,
                `${normalizedBase}/models`,
                `${base}/models`
            ]));
            for (const url of candidateUrls) {
                const res = await fetch(url, { headers: { Authorization: `Bearer ${resolvedApiKey}` } });
                if (!res.ok) continue;
                const data = await res.json();
                if (Array.isArray(data?.data)) {
                    const models = data.data.map((m: any) => trim(m?.id)).filter(Boolean);
                    setModelOptionsByStage((prev) => ({ ...prev, [stage.id]: models }));
                    setStageMessage(stage.id, '模型列表已刷新。');
                    return;
                }
            }
            setStageMessage(stage.id, '获取失败：返回格式错误。');
        } catch (error: any) {
            setStageMessage(stage.id, `获取失败：${error?.message || '网络异常'}`);
        } finally {
            setLoadingStageId('');
        }
    };

    const stageInlineSelector = (stage: FlowStage) => {
        const cfg = stage.modelConfig;
        if (!cfg || stage.localOnly) return null;
        const selectedChannelId = cfg.kind === 'main'
            ? (normalized.activeConfigId || normalized.configs[0]?.id || '')
            : trim(normalized.功能模型占位[cfg.channelKey!]) || normalized.activeConfigId || normalized.configs[0]?.id || '';
        const selectedConfig = getSelectedConfig(selectedChannelId);
        const modelValue = cfg.kind === 'main'
            ? trim(selectedConfig?.model || normalized.功能模型占位.主剧情使用模型)
            : trim(normalized.功能模型占位[cfg.modelKey!]) || trim(selectedConfig?.model) || trim(mainApi?.model);
        const modelOptions = Array.from(new Set([
            ...(modelOptionsByStage[stage.id] || []),
            modelValue,
            trim(selectedConfig?.model),
            trim(mainApi?.model)
        ].filter(Boolean)));
        return (
            <div className="mt-2 space-y-1" onClick={(event) => event.stopPropagation()}>
                <InlineSelect
                    value={selectedChannelId}
                    options={normalized.configs.map((cfgItem) => ({
                        value: cfgItem.id,
                        label: `${cfgItem.名称 || '未命名渠道'}${trim(cfgItem.model) ? ` · ${trim(cfgItem.model)}` : ''}`
                    }))}
                    onChange={(channelId) => {
                        const nextConfig = getSelectedConfig(channelId);
                        if (cfg.kind === 'main') {
                            updateMainChannel(channelId);
                        } else {
                            updatePlaceholderStage(stage, {
                                [cfg.channelKey!]: channelId,
                                [cfg.modelKey!]: trim(nextConfig?.model) || modelValue || trim(mainApi?.model)
                            } as Partial<功能模型占位配置结构>);
                        }
                        setModelOptionsByStage((prev) => ({ ...prev, [stage.id]: [] }));
                    }}
                    disabled={normalized.configs.length === 0 || !onSave}
                    placeholder="选择渠道"
                    buttonClassName="min-h-0 border-gray-700 bg-black/35 px-2 py-1 text-[10px]"
                />
                <div className="flex gap-1">
                    <div className="min-w-0 flex-1">
                        <InlineSelect
                            value={modelValue}
                            options={modelOptions.map((model) => ({ value: model, label: model }))}
                            onChange={(model) => {
                                if (cfg.kind === 'main') {
                                    updateMainModel(model);
                                } else {
                                    updatePlaceholderStage(stage, { [cfg.modelKey!]: model } as Partial<功能模型占位配置结构>);
                                }
                            }}
                            disabled={modelOptions.length === 0 || !onSave}
                            placeholder="选择模型"
                            buttonClassName="min-h-0 border-gray-700 bg-black/35 px-2 py-1 text-[10px]"
                        />
                    </div>
                    <GameButton
                        onClick={() => fetchModelsForStage(stage)}
                        variant="secondary"
                        className="shrink-0 px-2 py-1 text-[10px]"
                        disabled={!onSave || loadingStageId === stage.id}
                    >
                        {loadingStageId === stage.id ? '...' : '刷'}
                    </GameButton>
                </div>
                {stageMessages[stage.id] && <div className="truncate text-[10px] text-wuxia-cyan">{stageMessages[stage.id]}</div>}
            </div>
        );
    };

    const stageCard = (stage: FlowStage) => {
        const clickable = Boolean(stage.configTab && onNavigate);
        const className = `h-[194px] w-[210px] shrink-0 overflow-hidden rounded border px-3 py-2 text-left shadow-inner transition ${statusClass[stage.status]} ${
            clickable ? 'hover:-translate-y-0.5 hover:border-wuxia-gold/70' : ''
        }`;
        const content = (
            <>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-[13px] font-bold tracking-[0.12em] text-white">{stage.title}</div>
                    <div className="mt-0.5 text-[10px] text-gray-400">{stage.subtitle}</div>
                </div>
                <span className="shrink-0 rounded border border-white/15 bg-black/25 px-1.5 py-0.5 text-[10px] text-current">
                    {statusText[stage.status]}
                </span>
            </div>
            <div className="mt-1 space-y-0.5 text-[10px] leading-4">
                <div className="truncate text-gray-300">渠道：<span className="text-wuxia-cyan">{stage.channel}</span></div>
                <div className="truncate text-gray-300">模型：<span className="text-wuxia-gold">{stage.model}</span></div>
                {stageInlineSelector(stage)}
                <div className="max-h-[28px] overflow-hidden text-gray-500">{stage.note}</div>
                {clickable && (
                    <button
                        type="button"
                        className="pt-0.5 text-[10px] text-wuxia-gold hover:text-yellow-200"
                        onClick={() => stage.configTab && onNavigate?.(stage.configTab)}
                    >
                        完整配置
                    </button>
                )}
            </div>
            </>
        );
        return <div key={stage.id} className={className}>{content}</div>;
    };

    return (
        <div className="space-y-6 text-sm animate-fadeIn">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-wuxia-gold/30 pb-3">
                <div>
                    <h3 className="text-wuxia-gold font-serif font-bold text-xl">生成流程图</h3>
                    <p className="mt-2 text-xs text-gray-400">
                        展示当前配置下每个生成阶段的启用状态、渠道和模型；同一排代表已支持并行判定的阶段。
                    </p>
                </div>
                <div className="rounded border border-wuxia-cyan/30 bg-wuxia-cyan/10 px-3 py-2 text-[11px] text-wuxia-cyan">
                    想真正并行，请给同排阶段配置不同渠道；同渠道会被视为排队链路。
                </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-wuxia-gold/20 bg-black/25 p-3 custom-scrollbar">
                <div className="min-w-[760px] space-y-2">
                    {rows.map((row, index) => {
                        const enabledRow = row.filter((stage) => stage.status === 'enabled' || stage.status === 'fallback');
                        const rowChannels = enabledRow.map((stage) => stage.channelId || stage.channel).filter(Boolean);
                        const canParallel = row.length > 1 && enabledRow.length > 1 && new Set(rowChannels).size === rowChannels.length;
                        return (
                            <React.Fragment key={`row-${index}`}>
                                <div className="flex items-stretch justify-center gap-2">
                                    {row.map((stage, stageIndex) => (
                                        <React.Fragment key={stage.id}>
                                            {stageIndex > 0 && (
                                                <div className={`flex w-8 items-center justify-center text-2xl font-black ${canParallel ? 'text-emerald-500' : 'text-amber-600'}`}>
                                                    →
                                                </div>
                                            )}
                                            {stageCard(stage)}
                                        </React.Fragment>
                                    ))}
                                </div>
                                {index < rows.length - 1 && (
                                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                                        <span className="h-px w-20 bg-gray-700" />
                                        <span className="text-2xl leading-none">↓</span>
                                        <span>{row.length > 1 ? (canParallel ? '并行汇合后继续' : '同渠道或未启用，左到右排队') : '继续'}</span>
                                        <span className="h-px w-20 bg-gray-700" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-wuxia-cyan/20 bg-black/20 p-4">
                    <div className="text-xs font-bold text-wuxia-cyan">并行判定</div>
                    <div className="mt-3 space-y-2">
                        {parallelCandidates.map((hint) => (
                            <div key={hint.titles} className="rounded border border-gray-800 bg-black/25 p-3 text-[11px]">
                                <div className="text-gray-200">{hint.titles}</div>
                                <div className={hint.possible && hint.hasSeparateChannels ? 'mt-1 text-emerald-300' : 'mt-1 text-amber-300'}>
                                    {hint.possible && hint.hasSeparateChannels
                                        ? '当前可并行：阶段依赖已解耦，且启用阶段使用了不同渠道。'
                                        : '当前仍按单向链路排队。'}
                                </div>
                                <div className="mt-1 text-gray-500">{hint.reason}</div>
                                <div className="mt-1 text-gray-500">{hint.channelsText}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-md border border-wuxia-gold/20 bg-black/20 p-4">
                    <div className="text-xs font-bold text-wuxia-gold">旁路流程</div>
                    <div className="mt-3 flex min-w-0 flex-wrap justify-center gap-2">
                        {sidePipeline.map(stageCard)}
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-gray-800 bg-black/20 p-4 text-[11px] leading-6 text-gray-400">
                当前主链路为：剧情回忆、主剧情，然后文章优化/变量生成进入并行判定，再由变量生成后的状态进入动态世界/规划分析/地图更新并行判定。
                同排阶段都启用且使用不同渠道时会并行；否则仍按拓扑图中左到右、上到下的单向顺序执行。最终落盘是本地状态合并，不调用 AI。
            </div>
        </div>
    );
};

export default WorkflowGraphSettings;
