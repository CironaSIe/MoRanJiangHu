import React, { useEffect, useRef, useState } from 'react';
import * as dbService from '../../../services/dbService';
import { 导出ZIP存档文件, 解析ZIP存档文件 } from '../../../services/saveArchiveService';
import { 存档结构 } from '../../../types';
import { parseJsonWithRepair } from '../../../utils/jsonRepair';
import { isNativeCapacitorEnvironment } from '../../../utils/nativeRuntime';
import { buildSaveDebugSummary, recordSaveLoadError, recordSaveLoadTrace } from '../../../utils/saveLoadTrace';
import GameButton from '../../ui/GameButton';

interface Props {
    onClose: () => void;
    onLoadGame: (save: 存档结构) => void | Promise<void>;
    onSaveGame?: () => void | Promise<void>;
    mode: 'save' | 'load';
    requestConfirm?: (options: { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }) => Promise<boolean>;
}

type 存档列表项 = dbService.存档摘要结构;

const SaveLoadModal: React.FC<Props> = ({ onClose, onLoadGame, onSaveGame, mode, requestConfirm }) => {
    const [saves, setSaves] = useState<存档列表项[]>([]);
    const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('manual');
    const pageSize = isNativeCapacitorEnvironment() ? 24 : 80;
    const [visibleSaveCount, setVisibleSaveCount] = useState(pageSize);
    const [hasMoreSaves, setHasMoreSaves] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [saveProtectionEnabled, setSaveProtectionEnabled] = useState(false);
    const [transferMessage, setTransferMessage] = useState('');
    const [hydratingVisibleSummaries, setHydratingVisibleSummaries] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const hydratedSummaryIdsRef = useRef<Set<number>>(new Set());
    const hydratedSummaryCountRef = useRef(0);
    const hydrateRunningRef = useRef(false);

    useEffect(() => {
        void loadSaves(true);
    }, []);

    useEffect(() => {
        if (hydrateRunningRef.current || syncing) return;
        const native = isNativeCapacitorEnvironment();
        const hydrateLimit = native ? pageSize : 40;
        const hydrateCandidates = saves.slice(0, hydrateLimit);
        const nextTarget = hydrateCandidates.find((save) => (
            是旧版缺摘要存档(save)
            && typeof save.id === 'number'
            && !hydratedSummaryIdsRef.current.has(save.id)
        ));
        if (!nextTarget || typeof nextTarget.id !== 'number') {
            if (native && transferMessage.startsWith('正在恢复存档列表详情')) {
                setTransferMessage('存档列表详情已恢复。');
            }
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(() => {
            const id = nextTarget.id as number;
            hydrateRunningRef.current = true;
            hydratedSummaryIdsRef.current.add(id);
            hydratedSummaryCountRef.current += 1;
            recordSaveLoadTrace('modal.summaryHydrate.start', {
                id,
                activeTab,
                native,
                count: hydratedSummaryCountRef.current
            });
            if (native) {
                const missingTotal = hydrateCandidates.filter((save) => 是旧版缺摘要存档(save)).length;
                setTransferMessage(`正在恢复存档列表详情：${hydratedSummaryCountRef.current} / ${hydratedSummaryCountRef.current + Math.max(0, missingTotal - 1)}`);
            }
            void dbService.补全存档摘要(id)
                .then((summary) => {
                    recordSaveLoadTrace('modal.summaryHydrate.done', {
                        id,
                        hasSummary: Boolean(summary),
                        historyCount: summary?.元数据?.历史记录条数,
                        type: summary?.类型
                    });
                    if (cancelled || !summary) return;
                    setSaves((current) => current.map((item) => item.id === id ? summary : item));
                })
                .catch((error) => {
                    recordSaveLoadError('modal.summaryHydrate.error', error, { id, activeTab });
                    console.warn('补全旧存档摘要失败:', error);
                })
                .finally(() => {
                    recordSaveLoadTrace('modal.summaryHydrate.finally', { id, activeTab });
                    hydrateRunningRef.current = false;
                });
        }, native ? 260 : 80);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [saves, pageSize, syncing, transferMessage]);

    useEffect(() => {
        setVisibleSaveCount(pageSize);
    }, [activeTab, pageSize, saves.length]);

    useEffect(() => {
        void loadSaves(true);
    }, [activeTab]);

    const loadSaves = async (reset = true) => {
        setLoading(true);
        const startAt = Date.now();
        try {
            const usePagedNativeList = isNativeCapacitorEnvironment();
            const offset = reset ? 0 : saves.length;
            const type = activeTab === 'auto' ? 'auto' : 'manual';
            recordSaveLoadTrace('modal.list.start', {
                reset,
                activeTab,
                offset,
                pageSize,
                usePagedNativeList
            });
            const [list, protect] = await Promise.all([
                usePagedNativeList
                    ? dbService.读取存档摘要列表({ limit: pageSize, offset, 类型: type })
                    : dbService.读取存档摘要列表(),
                dbService.读取存档保护状态()
            ]);
            recordSaveLoadTrace('modal.list.done', {
                reset,
                activeTab,
                count: list.length,
                missingSummaryCount: list.filter((item) => 是旧版缺摘要存档(item)).length,
                firstId: list[0]?.id,
                lastId: list[list.length - 1]?.id,
                elapsedMs: Date.now() - startAt
            });
            setSaves((current) => reset ? list : [...current, ...list]);
            setHasMoreSaves(usePagedNativeList && list.length >= pageSize);
            setSaveProtectionEnabled(protect);
        } catch (error) {
            recordSaveLoadError('modal.list.error', error, {
                reset,
                activeTab,
                elapsedMs: Date.now() - startAt
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const 读取地点文本 = (save: 存档列表项): string => {
        const env = save.环境信息 || ({} as any);
        const list = [env.具体地点, env.小地点, env.中地点, env.大地点]
            .map((item: any) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean);
        return list[0] || '未知地点';
    };

    const 读取时间文本 = (save: 存档列表项): string => {
        const env = save.环境信息 || ({} as any);
        const timeText = typeof (env as any)?.时间 === 'string' ? (env as any).时间.trim() : '';
        if (timeText) return timeText;
        const 年 = Number((env as any)?.年);
        const 月 = Number((env as any)?.月);
        const 日 = Number((env as any)?.日);
        const 时 = Number((env as any)?.时);
        const 分 = Number((env as any)?.分);
        const pad2 = (n: number) => Math.trunc(n).toString().padStart(2, '0');
        if ([年, 月, 日, 时, 分].every(Number.isFinite)) {
            return `${Math.trunc(年)}:${pad2(月)}:${pad2(日)}:${pad2(时)}:${pad2(分)}`;
        }
        const saveDate = new Date(save.时间戳);
        if (Number.isNaN(saveDate.getTime())) return '未知时间';
        return `${saveDate.getFullYear()}:${pad2(saveDate.getMonth() + 1)}:${pad2(saveDate.getDate())}:${pad2(saveDate.getHours())}:${pad2(saveDate.getMinutes())}`;
    };

    const 读取现实保存时间文本 = (save: 存档列表项): string => {
        if (是旧版缺摘要存档(save)) return '正在恢复详情';
        const timestamp = Number(save.元数据?.现实保存时间戳 || save.时间戳 || 0);
        if (!Number.isFinite(timestamp) || timestamp <= 0) return '保存时间未知';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '保存时间未知';
        const pad2 = (n: number) => Math.trunc(n).toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    };

    const 构建存档标题 = (save: 存档列表项): string => {
        if (是旧版缺摘要存档(save)) return '正在恢复详情';
        const roleName = typeof save.角色数据?.姓名 === 'string' ? save.角色数据.姓名.trim() : '';
        return roleName || '未知角色';
    };

    const 构建安全文件名片段 = (value: string, fallback: string): string => {
        const normalized = value
            .trim()
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
        return normalized || fallback;
    };

    const 构建存档摘要 = (save: 存档列表项): string => {
        if (是旧版缺摘要存档(save)) return '正在读取存档摘要，请稍候';
        const historyCount = typeof save.元数据?.历史记录条数 === 'number'
            ? save.元数据.历史记录条数
            : (Array.isArray(save.历史记录) ? save.历史记录.length : 0);
        const tags: string[] = [
            save.类型 === 'auto' ? '自动快照' : '手动快照',
            `保存于 ${读取现实保存时间文本(save)}`,
            `历史 ${historyCount} 条`
        ];
        if (save.元数据?.历史记录是否裁剪) {
            tags.push('已裁剪');
        }
        return tags.join(' · ');
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (saveProtectionEnabled) {
            alert('存档保护已开启，请先在“设置-数据存储”中关闭后再删除存档。');
            return;
        }
        const ok = requestConfirm
            ? await requestConfirm({ title: '删除存档', message: '确定删除此存档吗？', confirmText: '删除', danger: true })
            : true;
        if (!ok) return;
        await dbService.删除存档(id);
        await loadSaves();
    };

    const 读取完整存档 = async (save: 存档列表项): Promise<存档结构> => {
        const id = typeof save.id === 'number' ? save.id : 0;
        if (!id) throw new Error('存档 ID 缺失，无法读取完整存档。');
        const startAt = Date.now();
        recordSaveLoadTrace('modal.fullRead.start', {
            id,
            type: save.类型,
            listHistoryCount: save.元数据?.历史记录条数,
            activeTab
        });
        const fullSave = await dbService.读取存档(id);
        if (!fullSave) throw new Error('存档不存在或已被删除。');
        recordSaveLoadTrace('modal.fullRead.done', {
            id,
            elapsedMs: Date.now() - startAt,
            save: buildSaveDebugSummary(fullSave)
        });
        return fullSave;
    };

    const handleLoadClick = async (save: 存档列表项) => {
        if (mode !== 'load') return;
        const id = typeof save.id === 'number' ? save.id : 0;
        const startAt = Date.now();
        recordSaveLoadTrace('modal.loadClick.start', {
            id,
            type: save.类型,
            activeTab,
            listHistoryCount: save.元数据?.历史记录条数,
            missingSummary: 是旧版缺摘要存档(save)
        });
        const ok = requestConfirm
            ? await requestConfirm({
                title: '读取存档',
                message: `读取存档：${构建存档标题(save)}（${读取地点文本(save)}）？`,
                confirmText: '读取'
            })
            : true;
        recordSaveLoadTrace('modal.loadClick.confirm', { id, ok });
        if (!ok) return;
        try {
            setSyncing(true);
            setTransferMessage(`正在读取：${构建存档标题(save)}`);
            const fullSave = await 读取完整存档(save);
            recordSaveLoadTrace('modal.loadClick.beforeOnLoad', {
                id,
                elapsedMs: Date.now() - startAt,
                save: buildSaveDebugSummary(fullSave)
            });
            await Promise.resolve(onLoadGame(fullSave));
            recordSaveLoadTrace('modal.loadClick.afterOnLoad', {
                id,
                elapsedMs: Date.now() - startAt
            });
        } catch (error: any) {
            recordSaveLoadError('modal.loadClick.error', error, {
                id,
                elapsedMs: Date.now() - startAt
            });
            console.error(error);
            alert(`读取失败：${error?.message || '未知错误'}`);
        } finally {
            recordSaveLoadTrace('modal.loadClick.finally', {
                id,
                elapsedMs: Date.now() - startAt
            });
            setSyncing(false);
            setTransferMessage('');
        }
    };

    const handleSave = async () => {
        if (!onSaveGame || syncing) return;
        setSyncing(true);
        setTransferMessage('');
        try {
            await Promise.resolve(onSaveGame());
            setActiveTab('manual');
            await loadSaves();
        } catch (error: any) {
            console.error(error);
            alert(`保存失败：${error?.message || '未知错误'}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleHydrateVisibleSummaries = async () => {
        if (hydratingVisibleSummaries || syncing) return;
        const targets = visibleSaves
            .filter((save) => 是旧版缺摘要存档(save))
            .map((save) => save.id)
            .filter((id): id is number => typeof id === 'number');
        if (targets.length <= 0) return;

        setHydratingVisibleSummaries(true);
        setTransferMessage(`正在恢复当前页存档详情：0 / ${targets.length}`);
        let completed = 0;
        try {
            for (const id of targets) {
                recordSaveLoadTrace('modal.manualSummaryHydrate.itemStart', { id, completed, total: targets.length });
                const summary = await dbService.补全存档摘要(id);
                completed += 1;
                recordSaveLoadTrace('modal.manualSummaryHydrate.itemDone', {
                    id,
                    completed,
                    total: targets.length,
                    hasSummary: Boolean(summary),
                    historyCount: summary?.元数据?.历史记录条数
                });
                if (summary) {
                    setSaves((current) => current.map((item) => item.id === id ? summary : item));
                }
                setTransferMessage(`正在恢复当前页存档详情：${completed} / ${targets.length}`);
                await new Promise((resolve) => window.setTimeout(resolve, isNativeCapacitorEnvironment() ? 700 : 120));
            }
            setTransferMessage('当前页存档详情已恢复。');
        } catch (error: any) {
            console.error(error);
            setTransferMessage(`恢复详情中断：${error?.message || '未知错误'}`);
        } finally {
            setHydratingVisibleSummaries(false);
        }
    };

    const blobToBase64 = async (blob: Blob): Promise<string> => (
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                const commaIndex = result.indexOf(',');
                resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
            };
            reader.onerror = () => reject(reader.error || new Error('读取导出文件失败'));
            reader.readAsDataURL(blob);
        })
    );

    const saveArchiveToDevice = async (blob: Blob, fileName: string): Promise<boolean> => {
        const runtime = typeof window !== 'undefined' ? (window as any) : undefined;
        const filesystem = runtime?.Capacitor?.Plugins?.Filesystem;
        if (!filesystem?.writeFile) return false;

        await filesystem.writeFile({
            path: fileName,
            data: await blobToBase64(blob),
            directory: 'DOCUMENTS',
            recursive: false
        });
        return true;
    };

    const downloadArchiveBlob = async (blob: Blob, fileName: string): Promise<void> => {
        if (await saveArchiveToDevice(blob, fileName)) {
            setTransferMessage(`已导出到设备文档目录：${fileName}`);
            alert(`导出完成：${fileName}\n已保存到设备文档目录。`);
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        setTransferMessage(`已开始下载：${fileName}`);
    };

    const handleExportAll = async () => {
        if (syncing) return;
        setSyncing(true);
        setTransferMessage('正在整理全部存档包...');
        try {
            const blob = await 导出ZIP存档文件();
            const stamp = new Date().toISOString().replace(/[:]/g, '-');
            const fileName = `wuxia-saves-${stamp}.zip`;
            await downloadArchiveBlob(blob, fileName);
        } catch (error: any) {
            console.error(error);
            setTransferMessage(`导出失败：${error?.message || '未知错误'}`);
            alert(`导出失败：${error?.message || '未知错误'}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleExportOne = async (save: 存档列表项, event: React.MouseEvent) => {
        event.stopPropagation();
        if (syncing) return;
        setSyncing(true);
        const title = 构建存档标题(save);
        setTransferMessage(`正在整理单个存档：${title}`);
        try {
            const fullSave = await 读取完整存档(save);
            const blob = await 导出ZIP存档文件({ saves: [fullSave] });
            const stamp = new Date(save.时间戳 || Date.now()).toISOString().replace(/[:]/g, '-');
            const titlePart = 构建安全文件名片段(title, 'save');
            const typePart = save.类型 === 'auto' ? 'auto' : 'manual';
            const fileName = `wuxia-save-${typePart}-${stamp}-${titlePart}.zip`;
            await downloadArchiveBlob(blob, fileName);

        } catch (error: any) {
            console.error(error);
            setTransferMessage(`导出失败：${error?.message || '未知错误'}`);
            alert(`导出失败：${error?.message || '未知错误'}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleTriggerImport = () => {
        if (syncing) return;
        setTransferMessage('请选择要导入的 ZIP 或 JSON 存档文件。');
        fileInputRef.current?.click();
    };

    const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.currentTarget.value = '';
        if (!file) return;

        const ok = requestConfirm
            ? await requestConfirm({
                title: '导入存档',
                message: `将导入文件“${file.name}”，并以“合并+去重”方式写入本地存档，是否继续？`,
                confirmText: '继续导入'
            })
            : true;
        if (!ok) {
            setTransferMessage('已取消导入。');
            return;
        }

        setSyncing(true);
        setTransferMessage(`正在导入：${file.name}`);
        try {
            let payload: unknown;
            let repairedTip = '';
            if (/\.zip$/i.test(file.name) || /application\/zip/i.test(file.type)) {
                payload = await 解析ZIP存档文件(file);
            } else {
                const fileText = await file.text();
                const parsed = parseJsonWithRepair<any>(fileText);
                if (!parsed.value) {
                    throw new Error(parsed.error || 'JSON 解析失败');
                }
                payload = parsed.value;
                repairedTip = parsed.usedRepair ? '\n检测到文件存在格式问题，已本地自动修复后导入。' : '';
            }

            const result = await dbService.导入存档数据(payload, { 覆盖现有: false });
            await loadSaves();
            setActiveTab('manual');

            setTransferMessage(`导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条。`);
            alert(`导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条。${repairedTip}`);
        } catch (error: any) {
            console.error(error);
            setTransferMessage(`导入失败：${error?.message || '未知错误'}`);
            alert(`导入失败：${error?.message || '未知错误'}`);
        } finally {
            setSyncing(false);
        }
    };

    const 是旧版缺摘要存档 = (save: 存档列表项): boolean => Boolean((save.元数据 as any)?.摘要缺失);

    const filteredSaves = saves.filter((save) => {
        if (是旧版缺摘要存档(save)) return true;
        if (activeTab === 'auto') return save.类型 === 'auto';
        return save.类型 !== 'auto';
    });
    const visibleSaves = filteredSaves.slice(0, visibleSaveCount);
    const hasMoreRenderedSaves = visibleSaveCount < filteredSaves.length;
    const busy = loading || syncing;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-ink-black/95 border border-wuxia-gold/30 w-full max-w-4xl h-[600px] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] rounded-2xl relative overflow-hidden">

                <div className="h-16 shrink-0 border-b border-gray-800/50 bg-black/40 flex items-center justify-between px-6 relative z-50">
                    <h3 className="text-wuxia-gold font-serif font-bold text-2xl tracking-[0.3em] drop-shadow-md" style={{ fontFamily: 'var(--ui-页面标题-font-family, inherit)', fontSize: 'var(--ui-页面标题-font-size, 28px)', lineHeight: 'var(--ui-页面标题-line-height, 1.2)' }}>
                        {mode === 'save' ? '铭刻时光' : '时光回溯'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl" style={{ fontFamily: 'var(--ui-按钮-font-family, inherit)' }}>×</button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {mode === 'save' && (
                        <div className="w-[30%] bg-black/20 border-r border-gray-800/50 p-6 flex flex-col gap-4">
                            <h4 className="text-wuxia-gold font-bold text-sm uppercase tracking-widest" style={{ fontFamily: 'var(--ui-分组标题-font-family, inherit)', fontSize: 'var(--ui-分组标题-font-size, 18px)' }}>手动存档</h4>
                            <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: 'var(--ui-辅助文本-font-family, inherit)', fontSize: 'var(--ui-辅助文本-font-size, 12px)', lineHeight: 'var(--ui-辅助文本-line-height, 1.5)' }}>
                                手动与自动存档都会完整保存全部内容。导出时会按 ZIP 拆分为图片、聊天记录、游戏数据三个目录。
                            </p>
                            <GameButton onClick={() => { void handleSave(); }} disabled={!onSaveGame || busy} variant="primary" className="w-full">
                                立即保存
                            </GameButton>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col bg-ink-wash/5">
                        <div className="px-6 pt-4 pb-3 border-b border-gray-800/50 flex justify-end gap-2">
                            {isNativeCapacitorEnvironment() && saves.some((save) => 是旧版缺摘要存档(save)) && (
                                <GameButton
                                    onClick={() => { void handleHydrateVisibleSummaries(); }}
                                    disabled={busy || hydratingVisibleSummaries}
                                    variant="secondary"
                                    className="px-4 py-2 text-xs"
                                >
                                    恢复当前页详情
                                </GameButton>
                            )}
                            <GameButton
                                onClick={() => { void handleExportAll(); }}
                                disabled={busy}
                                variant="secondary"
                                className="px-4 py-2 text-xs"
                            >
                                导出全部存档
                            </GameButton>
                            <GameButton
                                onClick={handleTriggerImport}
                                disabled={busy}
                                variant="secondary"
                                className="px-4 py-2 text-xs"
                            >
                                导入存档
                            </GameButton>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip,.json,application/zip,application/json,text/plain"
                                className="absolute h-px w-px opacity-0 pointer-events-none"
                                aria-label="选择要导入的存档文件"
                                onChange={(e) => { void handleImportFileChange(e); }}
                            />
                        </div>
                        {transferMessage && (
                            <div className="px-6 py-2 text-[11px] text-wuxia-cyan bg-wuxia-cyan/10 border-b border-wuxia-cyan/25">
                                {transferMessage}
                            </div>
                        )}
                        {saveProtectionEnabled && (
                            <div className="px-6 py-2 text-[11px] text-emerald-300 bg-emerald-900/10 border-b border-emerald-800/30">
                                存档保护已开启，当前禁止删除存档。
                            </div>
                        )}

                        <div className="flex border-b border-gray-800/50">
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`flex-1 py-3 text-sm font-bold tracking-widest transition-colors ${activeTab === 'manual' ? 'bg-wuxia-gold/10 text-wuxia-gold border-b-2 border-wuxia-gold' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                手动存档
                            </button>
                            <button
                                onClick={() => setActiveTab('auto')}
                                className={`flex-1 py-3 text-sm font-bold tracking-widest transition-colors ${activeTab === 'auto' ? 'bg-wuxia-gold/10 text-wuxia-gold border-b-2 border-wuxia-gold' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                自动存档
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                            {filteredSaves.length === 0 && !loading && (
                                <div className="text-center text-gray-600 py-10">暂无记录</div>
                            )}
                            {loading && (
                                <div className="text-center text-gray-500 py-10">读取中...</div>
                            )}

                            {visibleSaves.map((save) => (
                                <div
                                    key={save.id}
                                    onClick={() => { void handleLoadClick(save); }}
                                    className={`relative bg-black/40 border border-gray-700 p-4 rounded-lg group transition-all flex flex-col gap-2 ${mode === 'load' ? 'cursor-pointer hover:border-wuxia-gold/50 hover:bg-black/60' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-1.5 rounded border ${是旧版缺摘要存档(save) ? 'border-gray-500 text-gray-300' : (save.类型 === 'auto' ? 'border-blue-500 text-blue-400' : 'border-wuxia-gold text-wuxia-gold')}`}>
                                                {是旧版缺摘要存档(save) ? '恢复中' : (save.类型 === 'auto' ? 'AUTO' : 'MANUAL')}
                                            </span>
                                            <span className="font-bold text-gray-200 text-sm">{构建存档标题(save)}</span>
                                            <span className="text-xs text-gray-500">
                                                {save.角色数据?.境界 || '未知境界'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-600 font-mono text-right" style={{ fontFamily: 'var(--ui-等宽信息-font-family, inherit)', fontSize: 'var(--ui-等宽信息-font-size, 12px)' }}>
                                            {读取现实保存时间文本(save)}
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-400 border-l-2 border-gray-700 pl-2">
                                        {读取地点文本(save)} · 游戏内 {读取时间文本(save)}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        {构建存档摘要(save)}
                                    </div>

                                    <button
                                        onClick={(event) => { void handleExportOne(save, event); }}
                                        className="absolute bottom-4 right-4 rounded border border-wuxia-cyan/35 bg-black/50 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-wuxia-cyan opacity-0 transition-all hover:border-wuxia-cyan hover:bg-wuxia-cyan/15 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="只导出这一条存档"
                                        disabled={busy}
                                    >
                                        导出此档
                                    </button>

                                    <button
                                        onClick={(e) => { void handleDelete(save.id, e); }}
                                        className={`absolute top-4 right-4 transition-colors ${
                                            saveProtectionEnabled
                                                ? 'text-gray-700 opacity-40 cursor-not-allowed'
                                                : 'text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100'
                                        }`}
                                        title={saveProtectionEnabled ? '存档保护已开启' : '删除'}
                                        disabled={saveProtectionEnabled}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {(hasMoreRenderedSaves || hasMoreSaves) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasMoreRenderedSaves) {
                                            setVisibleSaveCount((count) => count + pageSize);
                                        } else {
                                            void loadSaves(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full rounded-lg border border-wuxia-cyan/35 bg-black/30 px-4 py-3 text-xs font-semibold tracking-wider text-wuxia-cyan transition-colors hover:border-wuxia-cyan hover:bg-wuxia-cyan/15"
                                >
                                    加载更多存档（已显示 {visibleSaves.length} 条）
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveLoadModal;
