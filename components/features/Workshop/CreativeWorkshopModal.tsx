import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 创意工坊模块分区, type 创意工坊模块条目, type 创意工坊模块类型 } from '../../../data/creativeWorkshopModules';
import { 合并去重开局预设方案, 标准化开局预设方案, 自定义开局预设存储键 } from '../../../utils/customNewGamePresets';
import * as dbService from '../../../services/dbService';
import {
    已启用创意工坊模块存储键,
    下载创意工坊模块,
    发布创意工坊模块,
    导入本地创意工坊模块,
    列出创意工坊模块
} from '../../../services/creativeWorkshop';

interface Props {
    open: boolean;
    onClose: () => void;
    onNovelDecomposition: () => void;
}

type 来源筛选 = 'all' | 'builtin' | 'cloud' | 'local';

const 下载JSON = (entry: 创意工坊模块条目) => {
    const payload = {
        schema: 'moranjianghu-creative-workshop-module',
        version: 1,
        exportedAt: new Date().toISOString(),
        module: entry
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${entry.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
};

const 复制文本 = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

const 构建模块摘要 = (entry: 创意工坊模块条目): string => [
    `《${entry.title}》`,
    entry.description,
    `标签：${entry.tags.join('、')}`,
    '',
    '注入预览：',
    ...(entry.injectionPreview?.length ? entry.injectionPreview : [`模块数据：${JSON.stringify(entry.payload, null, 2)}`])
].join('\n');

const 读取已启用模块 = (): Record<创意工坊模块类型, string> => {
    try {
        const parsed = JSON.parse(localStorage.getItem(已启用创意工坊模块存储键) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {} as Record<创意工坊模块类型, string>;
    } catch {
        return {} as Record<创意工坊模块类型, string>;
    }
};

const CreativeWorkshopModal: React.FC<Props> = ({ open, onClose, onNovelDecomposition }) => {
    const [activeType, setActiveType] = useState<创意工坊模块类型>('topic');
    const [sourceFilter, setSourceFilter] = useState<来源筛选>('all');
    const [entries, setEntries] = useState<创意工坊模块条目[]>([]);
    const [enabledMap, setEnabledMap] = useState<Record<创意工坊模块类型, string>>({});
    const [expandedId, setExpandedId] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState('');
    const [contributor, setContributor] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const activeEntries = useMemo(
        () => entries.filter((entry) => entry.type === activeType && (sourceFilter === 'all' || entry.source === sourceFilter)),
        [activeType, entries, sourceFilter]
    );

    const refreshEntries = async () => {
        setLoading(true);
        try {
            setEntries(await 列出创意工坊模块());
        } catch (error: any) {
            setStatus(`读取创意工坊失败：${error?.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setEnabledMap(读取已启用模块());
        void refreshEntries();
    }, [open]);

    if (!open) return null;

    const 启用模块 = async (entry: 创意工坊模块条目) => {
        setBusyId(entry.id);
        try {
            const module = await 下载创意工坊模块(entry);
            const next = { ...enabledMap, [module.type]: module.id };
            localStorage.setItem(已启用创意工坊模块存储键, JSON.stringify(next));
            setEnabledMap(next);
            if (module.preset) await 安装到开局预设(module, true);
            setStatus(`已启用「${module.title}」。同一分区每次只启用一个模块，切换会覆盖旧选择。`);
        } catch (error: any) {
            setStatus(`启用失败：${error?.message || '未知错误'}`);
        } finally {
            setBusyId('');
        }
    };

    const 安装到开局预设 = async (entry: 创意工坊模块条目, silent = false) => {
        if (!entry.preset) {
            if (!silent) setStatus('该模块只提供规则摘要，可下载 JSON、复制注入摘要或启用为工坊规则。');
            return;
        }
        const normalized = 标准化开局预设方案(entry.preset);
        if (!normalized) {
            if (!silent) setStatus('模块预设格式不完整，暂时无法安装。');
            return;
        }
        const saved = await dbService.读取设置(自定义开局预设存储键).catch(() => []);
        const nextList = 合并去重开局预设方案([
            ...(Array.isArray(saved) ? saved : []),
            normalized
        ]);
        await dbService.保存设置(自定义开局预设存储键, nextList);
        if (!silent) setStatus(`已安装「${entry.title}」到新建游戏的开局预设方案。`);
    };

    const 发布模块 = async (entry: 创意工坊模块条目) => {
        setBusyId(entry.id);
        try {
            const published = await 发布创意工坊模块({ module: entry, contributor });
            setStatus(`已发布到社区工坊：${published.title}。`);
            await refreshEntries();
        } catch (error: any) {
            setStatus(`发布失败：${error?.message || '未知错误'}`);
        } finally {
            setBusyId('');
        }
    };

    const 导入JSON文件 = async (file: File | null | undefined) => {
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            const module = 导入本地创意工坊模块(parsed.module || parsed);
            setStatus(`已导入本地模块「${module.title}」，可以预览、启用或再发布到社区。`);
            await refreshEntries();
        } catch (error: any) {
            setStatus(`导入失败：${error?.message || 'JSON 格式不正确'}`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[430] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-wuxia-gold/25 bg-[linear-gradient(180deg,rgba(28,20,10,0.98),rgba(6,6,6,0.98))] shadow-[0_26px_90px_rgba(0,0,0,0.65)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-wuxia-gold/10 px-5 py-4">
                    <div>
                        <div className="text-xs font-mono tracking-[0.28em] text-wuxia-gold">CREATIVE WORKSHOP</div>
                        <h2 className="mt-2 text-lg font-serif font-bold tracking-[0.18em] text-wuxia-gold">创意工坊</h2>
                        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-50/75">
                            玩家贡献内容的总入口。题材、世界规则、开局和能力体系都能发布到社区，其他玩家可以下载、导入，并在同类模块里一键切换启用。
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-black/30 text-xl text-amber-100 transition-colors hover:border-amber-300/50 hover:text-white" aria-label="关闭创意工坊" title="关闭">×</button>
                </div>

                <div className="max-h-[calc(92vh-118px)] overflow-y-auto p-5">
                    <button type="button" onClick={() => { onClose(); onNovelDecomposition(); }} className="mb-4 w-full rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-left transition-colors hover:bg-emerald-500/15">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-bold tracking-[0.14em] text-emerald-300">小说分解模块</div>
                                <div className="mt-2 text-xs leading-5 text-gray-300">导入、拆章、续跑、注入校对、发布和下载小说分解分享 ZIP。</div>
                            </div>
                            <div className="shrink-0 border border-emerald-500/30 px-2 py-1 text-[10px] tracking-[0.14em] text-emerald-200">进入工作台</div>
                        </div>
                    </button>

                    <div className="mb-4 grid gap-2 sm:grid-cols-4">
                        {创意工坊模块分区.map((section) => (
                            <button key={section.id} type="button" onClick={() => setActiveType(section.id)} className={`rounded-xl border p-3 text-left transition-colors ${activeType === section.id ? 'border-wuxia-gold/50 bg-wuxia-gold/15 text-wuxia-gold' : 'border-white/10 bg-white/[0.03] text-gray-200 hover:border-wuxia-gold/30'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-bold">{section.title}</div>
                                    {enabledMap[section.id] && <span className="text-[10px] text-emerald-300">已启用</span>}
                                </div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">{section.description}</div>
                            </button>
                        ))}
                    </div>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'builtin', 'cloud', 'local'] as 来源筛选[]).map((source) => (
                                <button key={source} type="button" onClick={() => setSourceFilter(source)} className={`rounded-lg border px-3 py-1.5 text-xs ${sourceFilter === source ? 'border-wuxia-gold/50 bg-wuxia-gold/15 text-wuxia-gold' : 'border-white/10 text-gray-300 hover:border-white/25'}`}>
                                    {source === 'all' ? '全部' : source === 'builtin' ? '官方预设' : source === 'cloud' ? '社区贡献' : '本地导入'}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input value={contributor} onChange={(event) => setContributor(event.target.value)} placeholder="贡献者署名" className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/40" />
                            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void 导入JSON文件(event.target.files?.[0])} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-200 hover:border-white/25">导入 JSON</button>
                            <button type="button" onClick={() => void refreshEntries()} disabled={loading} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-200 hover:border-white/25 disabled:opacity-50">{loading ? '刷新中' : '刷新社区'}</button>
                        </div>
                    </div>

                    {status && <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{status}</div>}

                    <div className="grid gap-3 lg:grid-cols-2">
                        {activeEntries.map((entry) => {
                            const enabled = enabledMap[entry.type] === entry.id;
                            const expanded = expandedId === entry.id;
                            return (
                                <div key={`${entry.source || 'builtin'}:${entry.id}`} className={`rounded-xl border p-4 ${enabled ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/25'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-serif font-bold text-gray-100">{entry.title}</h3>
                                            <div className="mt-1 text-xs text-wuxia-gold/80">{entry.subtitle}</div>
                                            <div className="mt-1 text-[11px] text-gray-500">{entry.source === 'cloud' ? '社区贡献' : entry.source === 'local' ? '本地导入' : '官方预设'} · {entry.contributor || '匿名'}</div>
                                        </div>
                                        <div className={`shrink-0 border px-2 py-0.5 text-[10px] ${enabled ? 'border-emerald-500/40 text-emerald-200' : 'border-white/15 text-gray-300'}`}>{enabled ? '已启用' : '可切换'}</div>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-gray-300">{entry.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {entry.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-300">{tag}</span>)}
                                    </div>
                                    {expanded && (
                                        <div className="mt-3 rounded-lg border border-wuxia-gold/15 bg-black/30 p-3">
                                            <div className="text-xs font-bold tracking-[0.14em] text-wuxia-gold">注入预览</div>
                                            <ul className="mt-2 space-y-1 text-xs leading-5 text-gray-300">
                                                {(entry.injectionPreview?.length ? entry.injectionPreview : [`payload：${JSON.stringify(entry.payload, null, 2)}`]).map((line, index) => <li key={index}>{line}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                        <button type="button" onClick={() => void 启用模块(entry)} disabled={Boolean(busyId)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50">{busyId === entry.id ? '处理中' : enabled ? '重新启用' : '启用/切换'}</button>
                                        <button type="button" onClick={() => void 安装到开局预设(entry)} className="rounded-lg border border-wuxia-gold/30 bg-wuxia-gold/10 px-3 py-2 text-xs text-wuxia-gold hover:bg-wuxia-gold/15">安装预设</button>
                                        <button type="button" onClick={() => setExpandedId(expanded ? '' : entry.id)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">{expanded ? '收起预览' : '预览注入'}</button>
                                        <button type="button" onClick={() => 下载JSON(entry)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">下载 JSON</button>
                                        <button type="button" onClick={() => void 复制文本(构建模块摘要(entry)).then((ok) => setStatus(ok ? `已复制「${entry.title}」注入摘要。` : '复制失败，请改用下载 JSON。'))} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">复制摘要</button>
                                        <button type="button" onClick={() => void 发布模块(entry)} disabled={Boolean(busyId)} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 hover:bg-sky-500/15 disabled:opacity-50">贡献社区</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreativeWorkshopModal;
