import React, { useMemo, useState } from 'react';
import { 创意工坊模块分区, 创意工坊模块列表, type 创意工坊模块条目, type 创意工坊模块类型 } from '../../../data/creativeWorkshopModules';
import { 合并去重开局预设方案, 标准化开局预设方案, 自定义开局预设存储键 } from '../../../utils/customNewGamePresets';
import * as dbService from '../../../services/dbService';

interface Props {
    open: boolean;
    onClose: () => void;
    onNovelDecomposition: () => void;
}

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
    `【${entry.title}】`,
    entry.description,
    `标签：${entry.tags.join('、')}`,
    `模块数据：${JSON.stringify(entry.payload, null, 2)}`
].join('\n');

const CreativeWorkshopModal: React.FC<Props> = ({ open, onClose, onNovelDecomposition }) => {
    const [activeType, setActiveType] = useState<创意工坊模块类型>('topic');
    const [status, setStatus] = useState('');
    const activeEntries = useMemo(
        () => 创意工坊模块列表.filter((entry) => entry.type === activeType),
        [activeType]
    );

    if (!open) return null;

    const 安装到开局预设 = async (entry: 创意工坊模块条目) => {
        if (!entry.preset) {
            setStatus('该模块只提供规则摘要，可下载 JSON 或复制注入摘要。');
            return;
        }
        const normalized = 标准化开局预设方案(entry.preset);
        if (!normalized) {
            setStatus('模块预设格式不完整，暂时无法安装。');
            return;
        }
        const saved = await dbService.读取设置(自定义开局预设存储键).catch(() => []);
        const nextList = 合并去重开局预设方案([
            ...(Array.isArray(saved) ? saved : []),
            normalized
        ]);
        await dbService.保存设置(自定义开局预设存储键, nextList);
        setStatus(`已安装「${entry.title}」到新建游戏的开局预设方案。`);
    };

    return (
        <div className="fixed inset-0 z-[430] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-wuxia-gold/25 bg-[linear-gradient(180deg,rgba(28,20,10,0.98),rgba(6,6,6,0.98))] shadow-[0_26px_90px_rgba(0,0,0,0.65)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-wuxia-gold/10 px-5 py-4">
                    <div>
                        <div className="text-xs font-mono tracking-[0.28em] text-wuxia-gold">CREATIVE WORKSHOP</div>
                        <h2 className="mt-2 text-lg font-serif font-bold tracking-[0.18em] text-wuxia-gold">创意工坊</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-50/75">
                            玩家贡献内容的总入口。小说分解、题材模板、世界规则、开局配置和能力体系都已拆成可用模块；可下载 JSON、复制注入摘要，或安装到新建游戏开局预设。
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-black/30 text-xl text-amber-100 transition-colors hover:border-amber-300/50 hover:text-white"
                        aria-label="关闭创意工坊"
                        title="关闭"
                    >
                        ×
                    </button>
                </div>

                <div className="max-h-[calc(92vh-118px)] overflow-y-auto p-5">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onNovelDecomposition();
                        }}
                        className="mb-4 w-full rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-left transition-colors hover:bg-emerald-500/15"
                    >
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
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => setActiveType(section.id)}
                                className={`rounded-xl border p-3 text-left transition-colors ${activeType === section.id ? 'border-wuxia-gold/50 bg-wuxia-gold/15 text-wuxia-gold' : 'border-white/10 bg-white/[0.03] text-gray-200 hover:border-wuxia-gold/30'}`}
                            >
                                <div className="text-sm font-bold">{section.title}</div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">{section.description}</div>
                            </button>
                        ))}
                    </div>

                    {status && (
                        <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                            {status}
                        </div>
                    )}

                    <div className="grid gap-3 lg:grid-cols-2">
                        {activeEntries.map((entry) => (
                            <div key={entry.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-serif font-bold text-gray-100">{entry.title}</h3>
                                        <div className="mt-1 text-xs text-wuxia-gold/80">{entry.subtitle}</div>
                                    </div>
                                    <div className="shrink-0 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-200">当前可用</div>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-gray-300">{entry.description}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {entry.tags.map((tag) => (
                                        <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-300">{tag}</span>
                                    ))}
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    <button type="button" onClick={() => void 安装到开局预设(entry)} className="rounded-lg border border-wuxia-gold/30 bg-wuxia-gold/10 px-3 py-2 text-xs text-wuxia-gold hover:bg-wuxia-gold/15">
                                        安装预设
                                    </button>
                                    <button type="button" onClick={() => 下载JSON(entry)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">
                                        下载 JSON
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void 复制文本(构建模块摘要(entry)).then((ok) => setStatus(ok ? `已复制「${entry.title}」注入摘要。` : '复制失败，请改用下载 JSON。'))}
                                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25"
                                    >
                                        复制摘要
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreativeWorkshopModal;
