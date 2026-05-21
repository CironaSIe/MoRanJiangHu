import React from 'react';
import type { 存档结构 } from '../../../types';
import {
    云端游玩风险提示文本,
    已确认云端游玩风险,
    设置云端游玩风险确认,
    读取云端游玩会话,
    注册云端游玩账号,
    登录云端游玩账号,
    清除云端游玩会话,
    启用对象存储云端游玩模式,
    清除对象存储云端游玩模式,
    已启用对象存储云端游玩模式,
    读取云端存档清单,
    读取缓存云端存档清单,
    复制全部本地存档到云端,
    导入云端存档到本地,
    保存云端存档为本地文件,
    下载云端存档包,
    删除云端存档节点,
    type 云端游玩账号,
    type 云端存档清单,
    type 云端存档摘要,
    type 云端下载进度,
    type 云端上传进度
} from '../../../services/cloudPlayService';
import {
    读取对象存储同步配置,
    测试对象存储连接,
    列出对象存储云存档,
    下载对象存储云存档,
    增量同步到对象存储,
    type 对象存储云存档元数据,
    type 对象存储同步进度,
    type 对象存储同步配置
} from '../../../services/objectStorageSync';
import * as dbService from '../../../services/dbService';
import { 导出ZIP存档文件 } from '../../../services/saveArchiveService';

interface Props {
    onClose: () => void;
    onLoadGame: (save: 存档结构) => void | Promise<void>;
    onStartNewGame?: () => void;
    onConfigureObjectStorage?: () => void;
}

const formatTime = (value: string | number | undefined): string => {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '未知时间';
    const pad2 = (num: number) => Math.trunc(num).toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const formatBytes = (bytes?: number): string => {
    if (!Number.isFinite(bytes || 0) || !bytes) return '未知大小';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const clampPercent = (value: number | undefined): number => {
    if (!Number.isFinite(value || NaN)) return 0;
    return Math.max(0, Math.min(100, Math.round(value || 0)));
};

type 云端时间树节点 = 云端存档摘要 & { children: 云端时间树节点[] };
type 对象存储时间树节点 = 对象存储云存档元数据 & { children: 对象存储时间树节点[] };

const 估算云端复制进度 = (progress: 云端上传进度 | null): number => {
    if (!progress) return 0;
    const total = Math.max(1, Number(progress.total || 0));
    const current = Math.max(0, Number(progress.current || 0));
    const base = progress.total ? ((Math.max(0, current - 1) / total) * 100) : 0;
    const inner = clampPercent(progress.percent) / total;
    return clampPercent(progress.stage === 'done' ? 100 : base + inner);
};

const 估算对象存储复制进度 = (progress: 对象存储同步进度 | null): number => {
    if (!progress) return 0;
    if (progress.stage === 'done') return 100;
    const stageBase: Record<对象存储同步进度['stage'], number> = {
        prepare: 8,
        directory: 4,
        upload: 45,
        download: 45,
        manifest: 88,
        done: 100
    };
    const total = Math.max(1, Number(progress.total || 0));
    const current = Math.max(0, Number(progress.current || 0));
    const within = progress.total ? Math.min(35, (current / total) * 35) : 0;
    return clampPercent((stageBase[progress.stage] || 0) + within);
};

const buildSeriesKey = (item: 云端存档摘要): string => item.seriesId || item.rootCloudId || item.title || item.cloudId;
const buildObjectSeriesKey = (item: 对象存储云存档元数据): string => item.seriesId || item.rootHash || item.title || item.id;

const buildCloudSaveTrees = (saves: 云端存档摘要[]): Array<{ key: string; title: string; latest: 云端存档摘要; roots: 云端时间树节点[]; count: number; totalBytes: number }> => {
    const groups = new Map<string, 云端存档摘要[]>();
    saves.forEach((item) => {
        const key = buildSeriesKey(item);
        groups.set(key, [...(groups.get(key) || []), item]);
    });
    return [...groups.entries()].map(([key, items]) => {
        const nodes = new Map<string, 云端时间树节点>();
        items.forEach((item) => nodes.set(item.cloudId, { ...item, children: [] }));
        const roots: 云端时间树节点[] = [];
        nodes.forEach((node) => {
            const parent = node.parentCloudId ? nodes.get(node.parentCloudId) : undefined;
            if (parent) parent.children.push(node);
            else roots.push(node);
        });
        const sortNodes = (list: 云端时间树节点[]) => {
            list.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
            list.forEach((node) => sortNodes(node.children));
        };
        sortNodes(roots);
        const latest = [...items].sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))[0];
        return {
            key,
            title: latest?.title || '未知角色',
            latest,
            roots,
            count: items.length,
            totalBytes: items.reduce((sum, item) => sum + Math.max(0, Number(item.packageSize || 0)), 0)
        };
    }).sort((a, b) => Number(b.latest?.timestamp || 0) - Number(a.latest?.timestamp || 0));
};

const buildObjectStorageSaveTrees = (saves: 对象存储云存档元数据[]): Array<{ key: string; title: string; latest: 对象存储云存档元数据; roots: 对象存储时间树节点[]; count: number; totalBytes: number }> => {
    const groups = new Map<string, 对象存储云存档元数据[]>();
    saves.forEach((item) => {
        const key = buildObjectSeriesKey(item);
        groups.set(key, [...(groups.get(key) || []), item]);
    });
    return [...groups.entries()].map(([key, items]) => {
        const nodes = new Map<string, 对象存储时间树节点>();
        items.forEach((item) => nodes.set(item.hash || item.id, { ...item, children: [] }));
        const roots: 对象存储时间树节点[] = [];
        nodes.forEach((node) => {
            const parent = node.parentHash ? nodes.get(node.parentHash) : undefined;
            if (parent) parent.children.push(node);
            else roots.push(node);
        });
        const sortNodes = (list: 对象存储时间树节点[]) => {
            list.sort((a, b) => Number(a.saveTimestamp || 0) - Number(b.saveTimestamp || 0));
            list.forEach((node) => sortNodes(node.children));
        };
        sortNodes(roots);
        const latest = [...items].sort((a, b) => Number(b.saveTimestamp || 0) - Number(a.saveTimestamp || 0))[0];
        return {
            key,
            title: latest?.title || '未知角色',
            latest,
            roots,
            count: items.length,
            totalBytes: items.reduce((sum, item) => sum + Math.max(0, Number(item.size || 0)), 0)
        };
    }).sort((a, b) => Number(b.latest?.saveTimestamp || 0) - Number(a.latest?.saveTimestamp || 0));
};

const CloudPlayModal: React.FC<Props> = ({ onClose, onLoadGame, onStartNewGame, onConfigureObjectStorage }) => {
    const [riskAccepted, setRiskAccepted] = React.useState(() => 已确认云端游玩风险());
    const [session, setSession] = React.useState<云端游玩账号 | null>(() => 读取云端游玩会话());
    const [storageMode, setStorageMode] = React.useState<'tg' | 'object'>(() => 已启用对象存储云端游玩模式() ? 'object' : 'tg');
    const [objectStorageConfig, setObjectStorageConfig] = React.useState<对象存储同步配置 | null>(null);
    const [objectStorageSaves, setObjectStorageSaves] = React.useState<对象存储云存档元数据[]>([]);
    const [mode, setMode] = React.useState<'login' | 'register'>('login');
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [manifest, setManifest] = React.useState<云端存档清单 | null>(null);
    const [busy, setBusy] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState<云端上传进度 | null>(null);
    const [objectUploadProgress, setObjectUploadProgress] = React.useState<对象存储同步进度 | null>(null);
    const [downloadProgress, setDownloadProgress] = React.useState<云端下载进度 | null>(null);
    const cloudSaveTrees = React.useMemo(() => buildCloudSaveTrees(manifest?.saves || []), [manifest]);
    const objectStorageSaveTrees = React.useMemo(() => buildObjectStorageSaveTrees(objectStorageSaves), [objectStorageSaves]);

    const manifestRef = React.useRef<云端存档清单 | null>(null);
    React.useEffect(() => {
        manifestRef.current = manifest;
    }, [manifest]);

    const refreshManifest = React.useCallback(async (targetSession = session) => {
        if (!targetSession) return;
        setBusy('refresh');
        try {
            const next = await 读取云端存档清单(targetSession);
            setManifest(next);
            setMessage(next.saves.length > 0 ? `已读取 ${next.saves.length} 个云端存档。` : '当前云端还没有存档。');
        } catch (error: any) {
            const cached = manifestRef.current || 读取缓存云端存档清单(targetSession);
            if (cached) setManifest(cached);
            setMessage(cached
                ? `读取云端存档失败：${error?.message || '未知错误'}。已保留上次成功读取的 ${cached.saves.length} 个云端存档，稍后可重试刷新。`
                : `读取云端存档失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    }, [session]);

    React.useEffect(() => {
        if (riskAccepted && session && storageMode === 'tg') {
            void refreshManifest(session);
        }
    }, [riskAccepted, session, storageMode, refreshManifest]);

    React.useEffect(() => {
        if (!riskAccepted || !已启用对象存储云端游玩模式()) return;
        void handleUseObjectStorage(false);
    }, [riskAccepted]);

    const handleAcceptRisk = () => {
        设置云端游玩风险确认();
        setRiskAccepted(true);
    };

    const handleUseTgStorage = () => {
        清除对象存储云端游玩模式();
        setStorageMode('tg');
        setObjectStorageConfig(null);
        setObjectStorageSaves([]);
        const savedSession = session || 读取云端游玩会话();
        if (savedSession) {
            setSession(savedSession);
            setMessage('已切换为 TG 图床云端游玩。');
            void refreshManifest(savedSession);
        } else {
            setMessage('已切换为 TG 图床模式，请登录账号后继续。');
        }
    };

    const handleUseObjectStorage = async (openConfigOnFailure = true) => {
        setBusy('object-storage-check');
        setMessage('正在检查对象存储配置...');
        try {
            const config = await 读取对象存储同步配置();
            if (!config) {
                setMessage('尚未配置对象存储，正在打开配置页。');
                if (openConfigOnFailure) onConfigureObjectStorage?.();
                return;
            }
            await 测试对象存储连接(config);
            const list = await 列出对象存储云存档(config);
            启用对象存储云端游玩模式();
            setObjectStorageConfig(config);
            setObjectStorageSaves(list);
            setStorageMode('object');
            setRiskAccepted(true);
            setMessage(list.length > 0 ? `对象存储连接成功，已读取 ${list.length} 个云端存档。` : '对象存储连接成功，当前云端还没有存档。');
        } catch (error: any) {
            setMessage(`对象存储不可用：${error?.message || '未知错误'}。正在打开配置页。`);
            if (openConfigOnFailure) onConfigureObjectStorage?.();
        } finally {
            setBusy('');
        }
    };

    const handleAuth = async () => {
        setBusy('auth');
        setMessage('');
        try {
            const nextSession = mode === 'register'
                ? await 注册云端游玩账号(username, password)
                : await 登录云端游玩账号(username, password);
            setSession(nextSession);
            setUsername('');
            setPassword('');
            setMessage(mode === 'register' ? '注册成功，已进入云端游玩。' : '登录成功。');
            await refreshManifest(nextSession);
        } catch (error: any) {
            setMessage(`${mode === 'register' ? '注册' : '登录'}失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleLogout = () => {
        清除云端游玩会话();
        清除对象存储云端游玩模式();
        setSession(null);
        setManifest(null);
        setMessage('已退出云端游玩。');
    };

    const handleCopyLocal = async () => {
        if (!session) return;
        setBusy('copy');
        setUploadProgress({ stage: 'manifest', current: 0, total: 0, percent: 1, message: '正在准备复制本地存档到 TG 图床云端...' });
        setMessage('正在复制本地存档到云端...');
        try {
            const result = await 复制全部本地存档到云端(session, (progress) => {
                setUploadProgress(progress);
                setMessage(progress.message);
            });
            setSession(result.session);
            setMessage(`复制完成：新增 ${result.uploaded} 个，跳过重复 ${result.skipped} 个。`);
            await refreshManifest(result.session);
        } catch (error: any) {
            const cached = manifest || 读取缓存云端存档清单(session);
            if (cached) setManifest(cached);
            setMessage(cached
                ? `复制失败：${error?.message || '未知错误'}。已有云端存档列表已保留（${cached.saves.length} 个），本次失败不会删除云端旧存档。`
                : `复制失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleLoadCloudSave = async (item: 云端存档摘要) => {
        if (!session) return;
        setBusy(`load:${item.cloudId}`);
        setDownloadProgress(null);
        setMessage('正在下载并解密云端存档...');
        try {
            const payload = await 下载云端存档包(session, item, (progress) => {
                setDownloadProgress(progress);
                setMessage(progress.message);
            });
            const save = payload.saves[0];
            if (!save) throw new Error('云端存档包内没有可读取的存档。');
            await Promise.resolve(onLoadGame(save));
            onClose();
        } catch (error: any) {
            setMessage(`载入失败：${error?.message || '未知错误'}`);
        } finally {
            setDownloadProgress(null);
            setBusy('');
        }
    };

    const handleImportCloudSave = async (item: 云端存档摘要) => {
        if (!session) return;
        setBusy(`import:${item.cloudId}`);
        setDownloadProgress(null);
        setMessage('正在导入云端存档到本地...');
        try {
            const result = await 导入云端存档到本地(session, item);
            setMessage(`导入完成：新增 ${result.imported} 个，跳过重复 ${result.skipped} 个。`);
        } catch (error: any) {
            setMessage(`导入失败：${error?.message || '未知错误'}`);
        } finally {
            setDownloadProgress(null);
            setBusy('');
        }
    };

    const handleExportCloudSave = async (item: 云端存档摘要) => {
        if (!session) return;
        setBusy(`export:${item.cloudId}`);
        setMessage('正在准备本地下载文件...');
        try {
            await 保存云端存档为本地文件(session, item);
            setMessage('已开始下载云端存档 ZIP。');
        } catch (error: any) {
            setMessage(`导出失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleDeleteCloudSave = async (item: 云端存档摘要) => {
        if (!session) return;
        if (!window.confirm(`确定删除云端时间节点「${item.title} ${formatTime(item.savedAt)}」吗？如果它下面还有后续节点，系统会自动重写后续差分链。`)) return;
        setBusy(`delete:${item.cloudId}`);
        setMessage('正在删除云端时间节点并重写后续差分链...');
        try {
            const result = await 删除云端存档节点(session, item);
            setSession(result.session);
            setManifest(result.manifest);
            setMessage(result.rebased > 0
                ? `已删除该时间节点，并重写 ${result.rebased} 个后续节点的差分链。`
                : '已删除该云端时间节点。');
        } catch (error: any) {
            setMessage(`删除失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleRefreshObjectStorage = async () => {
        if (!objectStorageConfig) return;
        setBusy('object-refresh');
        setMessage('正在刷新对象存储云端存档...');
        try {
            await 测试对象存储连接(objectStorageConfig);
            const list = await 列出对象存储云存档(objectStorageConfig);
            setObjectStorageSaves(list);
            setMessage(list.length > 0 ? `已读取 ${list.length} 个对象存储云端存档。` : '对象存储云端暂无存档。');
        } catch (error: any) {
            setMessage(`刷新对象存储失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleCopyLocalToObjectStorage = async () => {
        if (!objectStorageConfig) return;
        setBusy('object-copy');
        setObjectUploadProgress({ stage: 'directory', message: '正在准备复制本地存档到对象存储...' });
        setMessage('正在复制本地存档到对象存储...');
        try {
            const result = await 增量同步到对象存储(objectStorageConfig, undefined, (progress) => {
                setObjectUploadProgress(progress);
                setMessage(progress.message);
            });
            const list = await 列出对象存储云存档(objectStorageConfig);
            setObjectStorageSaves(list);
            setMessage(`复制完成：上传 ${result.uploaded} 个，跳过重复 ${result.skipped} 个，云端去重 ${result.deduped || 0} 个。`);
        } catch (error: any) {
            setMessage(`复制失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleLoadObjectStorageSave = async (item: 对象存储云存档元数据) => {
        if (!objectStorageConfig) return;
        setBusy(`object-load:${item.id}`);
        setMessage('正在读取对象存储云端存档...');
        try {
            const { save } = await 下载对象存储云存档(objectStorageConfig, item, (progress) => setMessage(progress.message));
            await Promise.resolve(onLoadGame(save));
            onClose();
        } catch (error: any) {
            setMessage(`载入失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleImportObjectStorageSave = async (item: 对象存储云存档元数据) => {
        if (!objectStorageConfig) return;
        setBusy(`object-import:${item.id}`);
        setMessage('正在导入对象存储云端存档到本地...');
        try {
            const { save } = await 下载对象存储云存档(objectStorageConfig, item, (progress) => setMessage(progress.message));
            const result = await dbService.导入存档数据({ saves: [save] }, { 覆盖现有: false });
            setMessage(`导入完成：新增 ${result.imported} 个，跳过重复 ${result.skipped} 个。`);
        } catch (error: any) {
            setMessage(`导入失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const handleExportObjectStorageSave = async (item: 对象存储云存档元数据) => {
        if (!objectStorageConfig) return;
        setBusy(`object-export:${item.id}`);
        setMessage('正在准备对象存储存档下载文件...');
        try {
            const { save } = await 下载对象存储云存档(objectStorageConfig, item, (progress) => setMessage(progress.message));
            const blob = await 导出ZIP存档文件({ saves: [save], includeImages: true });
            const safeTitle = (item.title || 'object-save').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').slice(0, 40) || 'object-save';
            const url = URL.createObjectURL(blob);
            try {
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `墨染江湖_对象存储存档_${safeTitle}_${(item.hash || item.id).slice(-8)}.zip`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
            } finally {
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            setMessage('已开始下载对象存储存档 ZIP。');
        } catch (error: any) {
            setMessage(`导出失败：${error?.message || '未知错误'}`);
        } finally {
            setBusy('');
        }
    };

    const renderObjectStorageCard = (item: 对象存储时间树节点): React.ReactNode => (
        <div className="w-[min(16rem,calc(100vw-4rem))] shrink-0 snap-start border border-sky-400/15 bg-black/25 px-3 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-serif text-sm font-bold text-paper-white">{item.title || '未知角色'}</span>
                <span className={`border px-1.5 py-0.5 text-[10px] ${item.seriesId ? 'border-emerald-400/25 text-emerald-200' : 'border-amber-400/25 text-amber-200'}`}>
                    {item.seriesId ? '新谱系' : '旧存档'}
                </span>
            </div>
            <div className="mt-1 text-xs leading-5 text-gray-400">
                {item.type === 'auto' ? '自动存档' : '手动存档'} · {item.location || '未知地点'} · {item.gameTime || '未知时间'}
            </div>
            <div className="text-[11px] text-gray-500">
                {formatTime(item.syncedAt || item.savedAt)} · {formatBytes(item.size)} · #{(item.hash || item.id).slice(-8)}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
                <button type="button" disabled={busy === `object-load:${item.id}`} onClick={() => { void handleLoadObjectStorageSave(item); }} className="border border-wuxia-gold/40 bg-wuxia-gold/10 px-2.5 py-1.5 text-xs text-wuxia-gold hover:bg-wuxia-gold/20 disabled:opacity-50">
                    {busy === `object-load:${item.id}` ? '读取中...' : '选择游玩'}
                </button>
                <button type="button" disabled={busy === `object-import:${item.id}`} onClick={() => { void handleImportObjectStorageSave(item); }} className="border border-emerald-400/30 px-2.5 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50">
                    导入
                </button>
                <button type="button" disabled={busy === `object-export:${item.id}`} onClick={() => { void handleExportObjectStorageSave(item); }} className="border border-sky-400/30 px-2.5 py-1.5 text-xs text-sky-100 hover:bg-sky-500/10 disabled:opacity-50">
                    下载
                </button>
            </div>
        </div>
    );

    const renderCloudCard = (item: 云端时间树节点): React.ReactNode => (
        <div className="w-[min(16rem,calc(100vw-4rem))] shrink-0 snap-start border border-wuxia-gold/15 bg-black/25 px-3 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-serif text-sm font-bold text-paper-white">{item.title}</span>
                {item.packageFormat === 'delta' && <span className="border border-emerald-400/20 px-1.5 py-0.5 text-[10px] text-emerald-200">差分</span>}
                {item.packageFormat === 'snapshot' && <span className="border border-sky-400/20 px-1.5 py-0.5 text-[10px] text-sky-200">快照</span>}
                <span className={`border px-1.5 py-0.5 text-[10px] ${item.seriesId ? 'border-emerald-400/25 text-emerald-200' : 'border-amber-400/25 text-amber-200'}`}>
                    {item.seriesId ? '新谱系' : '旧存档'}
                </span>
            </div>
            <div className="mt-1 text-xs leading-5 text-gray-400">
                {item.type === 'auto' ? '自动存档' : '手动存档'} · {item.location} · {item.gameTime} · 历史 {item.historyCount} 条
            </div>
            <div className="text-[11px] text-gray-500">
                {formatTime(item.savedAt)} · {formatBytes(item.packageSize)} · #{item.syncHash.slice(0, 8)}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
                <button type="button" disabled={busy === `load:${item.cloudId}`} onClick={() => { void handleLoadCloudSave(item); }} className="border border-wuxia-gold/40 bg-wuxia-gold/10 px-2.5 py-1.5 text-xs text-wuxia-gold hover:bg-wuxia-gold/20 disabled:opacity-50">
                    {busy === `load:${item.cloudId}` ? '读取中...' : '选择游玩'}
                </button>
                <button type="button" disabled={busy === `import:${item.cloudId}`} onClick={() => { void handleImportCloudSave(item); }} className="border border-emerald-400/30 px-2.5 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50">
                    导入
                </button>
                <button type="button" disabled={busy === `export:${item.cloudId}`} onClick={() => { void handleExportCloudSave(item); }} className="border border-sky-400/30 px-2.5 py-1.5 text-xs text-sky-100 hover:bg-sky-500/10 disabled:opacity-50">
                    下载
                </button>
                <button type="button" disabled={busy === `delete:${item.cloudId}`} onClick={() => { void handleDeleteCloudSave(item); }} className="border border-red-400/30 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50">
                    {busy === `delete:${item.cloudId}` ? '删除中...' : '删除'}
                </button>
            </div>
        </div>
    );

    const renderObjectStorageNode = (item: 对象存储时间树节点, root = false): React.ReactNode => (
        <div key={item.id} className="inline-flex flex-col items-start">
            <div className="flex items-center">
                {!root && (
                    <div className="flex w-14 shrink-0 items-center sm:w-20" aria-hidden="true">
                        <div className="h-px flex-1 bg-sky-400/40" />
                        <div className="h-2 w-2 rotate-45 border-r border-t border-sky-300/75" />
                    </div>
                )}
                {renderObjectStorageCard(item)}
            </div>
            {item.children.length > 0 && (
                <div className="ml-28 mt-3 flex items-start gap-4 border-t border-sky-400/20 pt-3 sm:ml-32">
                    {item.children.map((child) => renderObjectStorageNode(child))}
                </div>
            )}
        </div>
    );

    const renderCloudNode = (item: 云端时间树节点, root = false): React.ReactNode => (
        <div key={item.cloudId} className="inline-flex flex-col items-start">
            <div className="flex items-center">
                {!root && (
                    <div className="flex w-14 shrink-0 items-center sm:w-20" aria-hidden="true">
                        <div className="h-px flex-1 bg-wuxia-gold/40" />
                        <div className="h-2 w-2 rotate-45 border-r border-t border-wuxia-gold/75" />
                    </div>
                )}
                {renderCloudCard(item)}
            </div>
            {item.children.length > 0 && (
                <div className="ml-28 mt-3 flex items-start gap-4 border-t border-wuxia-gold/20 pt-3 sm:ml-32">
                    {item.children.map((child) => renderCloudNode(child))}
                </div>
            )}
        </div>
    );

    const disabled = Boolean(busy);

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-wuxia-gold/30 bg-ink-black/95 text-paper-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-wuxia-gold/20 px-5 py-4">
                <div>
                    <div className="font-serif text-lg font-bold tracking-[0.2em] text-wuxia-gold">云端游玩</div>
                    <div className="mt-1 text-xs text-gray-400">自动同步存档，可从云端选择进度继续游玩</div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="h-9 w-9 border border-red-400/40 bg-red-900/40 text-red-100 transition-colors hover:bg-red-800/70"
                    title="关闭"
                >
                    X
                </button>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
                {!riskAccepted ? (
                    <div className="mx-auto max-w-2xl border border-amber-400/35 bg-amber-950/30 p-5">
                        <div className="font-serif text-base font-bold tracking-[0.16em] text-amber-200">风险提示</div>
                        <p className="mt-4 text-sm leading-7 text-amber-50">{云端游玩风险提示文本}</p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="border border-gray-500/50 px-4 py-2 text-sm text-gray-200 hover:bg-white/5">
                                取消
                            </button>
                            <button type="button" onClick={handleAcceptRisk} className="border border-amber-300/50 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-500/25">
                                我已了解风险
                            </button>
                            <button type="button" disabled={busy === 'object-storage-check'} onClick={() => { void handleUseObjectStorage(); }} className="border border-sky-300/50 bg-sky-500/15 px-4 py-2 text-sm font-bold text-sky-100 hover:bg-sky-500/25 disabled:opacity-50">
                                {busy === 'object-storage-check' ? '检查中...' : '我不用TG图床存储，我要用自己的对象存储'}
                            </button>
                        </div>
                    </div>
                ) : storageMode === 'object' ? (
                    <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border border-sky-400/20 bg-sky-500/10 px-4 py-3">
                            <div>
                                <div className="text-sm text-sky-100">当前使用：自己的对象存储</div>
                                <div className="mt-1 text-xs text-sky-100/60">{objectStorageConfig?.bucket || '未配置'} · {objectStorageConfig?.prefix || 'MoRanJiangHu'}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {onStartNewGame && (
                                    <button type="button" onClick={onStartNewGame} className="border border-wuxia-gold/40 bg-wuxia-gold/10 px-3 py-2 text-xs font-bold text-wuxia-gold hover:bg-wuxia-gold/20">
                                        开启新存档
                                    </button>
                                )}
                                <button type="button" disabled={busy === 'object-refresh'} onClick={() => { void handleRefreshObjectStorage(); }} className="border border-sky-400/35 px-3 py-2 text-xs text-sky-100 hover:bg-sky-500/10 disabled:opacity-50">
                                    刷新云存档
                                </button>
                                <button type="button" disabled={busy === 'object-copy'} onClick={() => { void handleCopyLocalToObjectStorage(); }} className="border border-emerald-400/35 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50">
                                    本地一键复制到对象存储
                                </button>
                                <button type="button" disabled={busy === 'object-storage-check'} onClick={() => { 清除对象存储云端游玩模式(); onConfigureObjectStorage?.(); }} className="border border-gray-500/40 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 disabled:opacity-50">
                                    修改对象存储配置
                                </button>
                                <button type="button" disabled={busy === 'object-storage-check'} onClick={handleUseTgStorage} className="border border-amber-400/35 px-3 py-2 text-xs text-amber-100 hover:bg-amber-500/10 disabled:opacity-50">
                                    切换到TG图床
                                </button>
                            </div>
                        </div>

                        {objectUploadProgress && busy === 'object-copy' && (
                            <div className="border border-sky-400/25 bg-sky-950/20 px-4 py-3 text-sm text-sky-50">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span>{objectUploadProgress.message}</span>
                                    <span className="text-xs text-sky-100/70">
                                        {objectUploadProgress.current && objectUploadProgress.total ? `${objectUploadProgress.current}/${objectUploadProgress.total}` : objectUploadProgress.stage}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                                    <div
                                        className="h-full rounded-full bg-sky-300 transition-all duration-300"
                                        style={{ width: `${估算对象存储复制进度(objectUploadProgress)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {objectStorageSaveTrees.length <= 0 ? (
                                <div className="border border-dashed border-sky-400/25 px-4 py-8 text-center text-sm text-gray-400">
                                    对象存储云端暂无存档。可以开启新存档，或先把本地存档复制到对象存储。
                                    {onStartNewGame && (
                                        <button type="button" onClick={onStartNewGame} className="mx-auto mt-4 block border border-wuxia-gold/40 bg-wuxia-gold/10 px-4 py-2 text-xs font-bold text-wuxia-gold hover:bg-wuxia-gold/20">
                                            开启新存档
                                        </button>
                                    )}
                                </div>
                            ) : (
                                objectStorageSaveTrees.map((series) => (
                                    <div key={series.key} className="min-w-0 border border-sky-400/20 bg-black/15 p-3">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/10 pb-2">
                                            <div>
                                                <div className="font-serif text-sm font-bold tracking-[0.12em] text-sky-100">{series.title}</div>
                                                <div className="mt-1 text-[11px] text-gray-500">
                                                    时间树 {series.count} 个节点 · 云端包合计 {formatBytes(series.totalBytes)} · 最新 {formatTime(series.latest?.syncedAt || series.latest?.savedAt)}
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-gray-500">同一起始存档已归并为一个系列</div>
                                        </div>
                                        <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain pb-3 touch-pan-x custom-scrollbar">
                                            <div className="inline-flex min-w-full snap-x snap-mandatory items-start gap-4 px-1">
                                                {series.roots.map((root) => renderObjectStorageNode(root, true))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : !session ? (
                    <div className="mx-auto max-w-md border border-wuxia-gold/20 bg-black/35 p-5">
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setMode('login')} className={`flex-1 border px-3 py-2 text-sm ${mode === 'login' ? 'border-wuxia-gold bg-wuxia-gold/15 text-wuxia-gold' : 'border-gray-600 text-gray-300'}`}>
                                登录
                            </button>
                            <button type="button" onClick={() => setMode('register')} className={`flex-1 border px-3 py-2 text-sm ${mode === 'register' ? 'border-wuxia-gold bg-wuxia-gold/15 text-wuxia-gold' : 'border-gray-600 text-gray-300'}`}>
                                注册
                            </button>
                        </div>
                        <label className="mt-5 block text-xs tracking-[0.16em] text-gray-400">用户名</label>
                        <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full border border-wuxia-gold/20 bg-black/50 px-3 py-2 text-sm text-paper-white outline-none focus:border-wuxia-gold" />
                        <label className="mt-4 block text-xs tracking-[0.16em] text-gray-400">密码</label>
                        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full border border-wuxia-gold/20 bg-black/50 px-3 py-2 text-sm text-paper-white outline-none focus:border-wuxia-gold" />
                        <button type="button" disabled={disabled} onClick={() => { void handleAuth(); }} className="mt-5 w-full border border-wuxia-gold/40 bg-wuxia-gold/15 px-4 py-3 font-serif text-sm font-bold tracking-[0.18em] text-wuxia-gold hover:bg-wuxia-gold/25 disabled:opacity-50">
                            {busy === 'auth' ? '处理中...' : mode === 'register' ? '注册并进入' : '登录云端'}
                        </button>
                        <button type="button" disabled={busy === 'object-storage-check'} onClick={() => { void handleUseObjectStorage(); }} className="mt-3 w-full border border-sky-400/35 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20 disabled:opacity-50">
                            切换到自己的对象存储
                        </button>
                    </div>
                ) : (
                    <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border border-wuxia-gold/15 bg-black/30 px-4 py-3">
                            <div>
                                <div className="text-sm text-wuxia-gold">当前账号：{session.username}</div>
                                <div className="mt-1 text-xs text-gray-500">ID：{session.userId}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {onStartNewGame && (
                                    <button type="button" onClick={onStartNewGame} className="border border-wuxia-gold/40 bg-wuxia-gold/10 px-3 py-2 text-xs font-bold text-wuxia-gold hover:bg-wuxia-gold/20">
                                        开启新存档
                                    </button>
                                )}
                                <button type="button" disabled={busy === 'refresh'} onClick={() => { void refreshManifest(); }} className="border border-sky-400/35 px-3 py-2 text-xs text-sky-100 hover:bg-sky-500/10 disabled:opacity-50">
                                    刷新云存档
                                </button>
                                <button type="button" disabled={busy === 'copy'} onClick={() => { void handleCopyLocal(); }} className="border border-emerald-400/35 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50">
                                    本地一键复制到云端
                                </button>
                                <button type="button" onClick={handleLogout} className="border border-gray-500/40 px-3 py-2 text-xs text-gray-200 hover:bg-white/5">
                                    退出账号
                                </button>
                                <button type="button" disabled={busy === 'object-storage-check'} onClick={() => { void handleUseObjectStorage(); }} className="border border-sky-400/35 px-3 py-2 text-xs text-sky-100 hover:bg-sky-500/10 disabled:opacity-50">
                                    切换到对象存储
                                </button>
                            </div>
                        </div>

                        {uploadProgress && busy === 'copy' && (
                            <div className="border border-emerald-400/25 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-50">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span>{uploadProgress.message}</span>
                                    <span className="text-xs text-emerald-100/70">
                                        {uploadProgress.current && uploadProgress.total ? `${uploadProgress.current}/${uploadProgress.total} · ` : ''}
                                        {uploadProgress.attempt ? `第 ${uploadProgress.attempt}/${uploadProgress.maxAttempts || uploadProgress.attempt} 次 · ` : ''}
                                        {uploadProgress.uploadBytes ? formatBytes(uploadProgress.uploadBytes) : ''}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                                    <div
                                        className="h-full rounded-full bg-emerald-300 transition-all duration-300"
                                        style={{ width: `${估算云端复制进度(uploadProgress)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {downloadProgress && busy.startsWith('load:') && (
                            <div className="border border-sky-400/25 bg-sky-950/20 px-4 py-3 text-sm text-sky-50">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span>{downloadProgress.message}</span>
                                    <span className="text-xs text-sky-100/70">
                                        {downloadProgress.current && downloadProgress.total ? `${downloadProgress.current}/${downloadProgress.total} · ` : ''}
                                        {downloadProgress.attempt ? `第 ${downloadProgress.attempt}/${downloadProgress.maxAttempts || downloadProgress.attempt} 次` : ''}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs leading-6 text-sky-100/70">
                                    TG 图床偶尔会短暂返回 500，系统会自动重试；只要这里仍在显示读取进度，请先等待完成。
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {cloudSaveTrees.length <= 0 ? (
                                <div className="border border-dashed border-wuxia-gold/25 px-4 py-8 text-center text-sm text-gray-400">
                                    暂无云端存档。可以开启新存档，或先把本地存档复制到云端。
                                    {onStartNewGame && (
                                        <button type="button" onClick={onStartNewGame} className="mx-auto mt-4 block border border-wuxia-gold/40 bg-wuxia-gold/10 px-4 py-2 text-xs font-bold text-wuxia-gold hover:bg-wuxia-gold/20">
                                            开启新存档
                                        </button>
                                    )}
                                </div>
                            ) : (
                                cloudSaveTrees.map((series) => (
                                    <div key={series.key} className="min-w-0 border border-wuxia-gold/20 bg-black/15 p-3">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-wuxia-gold/10 pb-2">
                                            <div>
                                                <div className="font-serif text-sm font-bold tracking-[0.12em] text-wuxia-gold">{series.title}</div>
                                                <div className="mt-1 text-[11px] text-gray-500">
                                                    时间树 {series.count} 个节点 · 云端包合计 {formatBytes(series.totalBytes)} · 最新 {formatTime(series.latest?.savedAt)}
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-gray-500">同一起始存档已归并为一个系列</div>
                                        </div>
                                        <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain pb-3 touch-pan-x custom-scrollbar">
                                            <div className="inline-flex min-w-full snap-x snap-mandatory items-start gap-4 px-1">
                                                {series.roots.map((root) => renderCloudNode(root, true))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {message && (
                <div className="border-t border-wuxia-gold/15 bg-black/50 px-5 py-3 text-sm text-gray-200">
                    {message}
                </div>
            )}
        </div>
    );
};

export default CloudPlayModal;
