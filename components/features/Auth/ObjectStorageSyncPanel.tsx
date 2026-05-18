import React, { useEffect, useState } from 'react';
import * as dbService from '../../../services/dbService';
import {
    保存对象存储同步配置,
    下载对象存储云存档,
    下载设置自对象存储,
    增量导入对象存储云存档,
    列出对象存储云存档,
    增量同步到对象存储,
    上传设置到对象存储,
    测试对象存储连接,
    读取对象存储同步摘要,
    读取对象存储同步配置,
    type 对象存储云存档元数据,
    type 对象存储同步进度,
    type 对象存储同步配置,
    type 对象存储同步摘要
} from '../../../services/objectStorageSync';

const 初始配置: 对象存储同步配置 = { endpoint: 'https://s3.hi168.com', bucket: '', accessKey: '', secretKey: '', username: '', prefix: 'MoRanJiangHu' };

const formatTime = (value?: string | null): string => {
    if (!value) return '从未同步';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad2 = (n: number) => Math.trunc(n).toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const buildCloudSaveLabel = (item: 对象存储云存档元数据): string => {
    const device = item.deviceLabel || (item.deviceType === 'phone' ? '手机' : '电脑');
    const hashTail = (item.hash || '').replace(/[^a-f0-9]/gi, '').slice(-8);
    return `${item.title || '未知角色'} · #${hashTail || '--------'} · ${device} · ${formatTime(item.syncedAt || item.savedAt)} · v${item.appVersion || '未知版本'}`;
};

const readConfig = (config: 对象存储同步配置): 对象存储同步配置 => ({
    endpoint: config.endpoint.trim(),
    bucket: config.bucket.trim(),
    accessKey: config.accessKey.trim(),
    secretKey: config.secretKey,
    username: config.username?.trim() || '',
    prefix: config.prefix?.trim() || 'MoRanJiangHu'
});

export const ObjectStorageSyncPanel: React.FC = () => {
    const [config, setConfig] = useState<对象存储同步配置>(初始配置);
    const [cloudSaves, setCloudSaves] = useState<对象存储云存档元数据[]>([]);
    const [selectedCloudSaveId, setSelectedCloudSaveId] = useState('');
    const [summary, setSummary] = useState<对象存储同步摘要 | null>(null);
    const [status, setStatus] = useState('填写 对象存储 信息后即可同步');
    const [busy, setBusy] = useState(false);
    const [busyTask, setBusyTask] = useState('');
    const [progress, setProgress] = useState<对象存储同步进度 | null>(null);

    useEffect(() => {
        void (async () => {
            const saved = await 读取对象存储同步配置();
            if (!saved) return;
            setConfig(saved);
            setStatus('已读取本机 对象存储 配置');
        })();
    }, []);

    const persistConfig = async (): Promise<对象存储同步配置> => {
        const next = readConfig(config);
        await 保存对象存储同步配置(next);
        setConfig(next);
        return next;
    };

    const refreshCloud = async (nextConfig?: 对象存储同步配置) => {
        const active = nextConfig || await persistConfig();
        setStatus('正在读取对象存储云端清单');
        setSummary(null);
        setCloudSaves([]);
        setSelectedCloudSaveId('');
        const [nextSummary, list] = await Promise.all([
            读取对象存储同步摘要(active),
            列出对象存储云存档(active)
        ]);
        setSummary(nextSummary);
        setCloudSaves(list);
        setSelectedCloudSaveId((current) => current && list.some((item) => item.id === current) ? current : (list[0]?.id || ''));
        setStatus(`已读取云端：${list.length} 个存档${nextSummary.settings ? `，设置包 ${formatTime(nextSummary.settings.syncedAt)} · v${nextSummary.settings.appVersion}` : '，暂无设置包'}`);
    };

    const runTask = async (taskName: string, task: () => Promise<void>, failPrefix: string) => {
        if (busy) return;
        setBusy(true);
        setBusyTask(taskName);
        setProgress(null);
        try {
            await task();
        } catch (error: any) {
            console.error(error);
            window.alert(`${failPrefix}：${error?.message || '未知错误'}`);
        } finally {
            setBusy(false);
            setBusyTask('');
            setProgress(null);
        }
    };

    const readProgress = (value: 对象存储同步进度) => {
        setProgress(value);
        setStatus(value.message);
    };

    const buttonContent = (taskName: string, idleText: string): React.ReactNode => (
        busy && busyTask === taskName
            ? <span className="inline-flex items-center justify-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />处理中</span>
            : idleText
    );

    const handleSaveConfig = () => runTask('save-config', async () => {
        await persistConfig();
        setStatus('对象存储 配置已保存到本机');
    }, '保存 对象存储 配置失败');

    const handleTest = () => runTask('test', async () => {
        const active = await persistConfig();
        setStatus('正在测试 对象存储 连接');
        await 测试对象存储连接(active);
        await refreshCloud(active);
        setStatus('对象存储 连接成功');
    }, '对象存储 连接失败');

    const handleUploadSaves = () => runTask('upload-saves', async () => {
        if (!window.confirm('这会把当前本机的全部存档增量同步到 对象存储，已存在的相同内容会自动跳过。是否继续？')) return;
        const active = await persistConfig();
        const result = await 增量同步到对象存储(active, undefined, readProgress);
        await refreshCloud(active);
        window.alert(`对象存储 存档同步完成：上传 ${result.uploaded} 个（其中更新 ${result.updated || 0} 个），跳过 ${result.skipped} 个，云端去重 ${result.deduped || 0} 个。`);
    }, '对象存储 存档同步失败');

    const handleUploadSettings = () => runTask('upload-settings', async () => {
        if (!window.confirm('这会把当前本机的全部游戏设置和设置引用的素材上传到 对象存储，不包含存档。是否继续？')) return;
        const active = await persistConfig();
        const metadata = await 上传设置到对象存储(active, readProgress);
        await refreshCloud(active);
        window.alert(`对象存储 设置上传完成：${formatTime(metadata.syncedAt)}。`);
    }, '对象存储 设置上传失败');

    const handleUploadSavesAndSettings = () => runTask('upload-saves-settings', async () => {
        if (!window.confirm('这会把当前本机的全部存档、全部游戏设置和设置引用的素材上传到 对象存储。是否继续？')) return;
        const active = await persistConfig();
        const saveResult = await 增量同步到对象存储(active, undefined, readProgress);
        const metadata = await 上传设置到对象存储(active, readProgress);
        await refreshCloud(active);
        window.alert(`对象存储 存档和设置上传完成：存档上传 ${saveResult.uploaded} 个（其中更新 ${saveResult.updated || 0} 个），跳过 ${saveResult.skipped} 个，云端去重 ${saveResult.deduped || 0} 个；设置 ${formatTime(metadata.syncedAt)}。`);
    }, '对象存储 存档和设置上传失败');

    const handleImportSave = () => runTask('import-save', async () => {
        const selected = cloudSaves.find((item) => item.id === selectedCloudSaveId);
        if (!selected) {
            window.alert('请先选择一个云端存档。');
            return;
        }
        if (!window.confirm(`将云端存档导入本地：${buildCloudSaveLabel(selected)}。是否继续？`)) return;
        const active = await persistConfig();
        const { save } = await 下载对象存储云存档(active, selected, readProgress);
        const result = await dbService.导入存档数据({ saves: [save] }, { 覆盖现有: false });
        window.alert(`云端存档已导入本地：新增 ${result.imported} 条，跳过 ${result.skipped} 条。`);
    }, '对象存储 存档读取失败');

    const handleImportAllSaves = () => runTask('import-all-saves', async () => {
        if (cloudSaves.length <= 0) {
            window.alert('云端暂无可导入的存档，请先刷新云端列表。');
            return;
        }
        if (!window.confirm(`将以“合并+去重”方式增量导入云端全部 ${cloudSaves.length} 个存档，不会清空本地存档。是否继续？`)) return;
        const active = await persistConfig();
        const result = await 增量导入对象存储云存档(active, cloudSaves, readProgress);
        window.alert(`云端存档增量导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条。`);
    }, '对象存储 存档增量导入失败');

    const handleRestoreSettings = () => runTask('restore-settings', async () => {
        if (!window.confirm('这会下载 对象存储 云端设置并覆盖当前本机全部设置，且不可撤销。是否继续？')) return;
        const active = await persistConfig();
        const result = await 下载设置自对象存储(active, readProgress);
        if (result.success) {
            window.alert(`对象存储 设置恢复完成：设置 ${result.importedSettingCount}/${result.settingCount}，页面即将刷新。`);
            window.location.reload();
            return;
        }
        window.alert(`对象存储 设置恢复失败：${result.stageLabel} - ${result.error || '未知错误'}`);
    }, '对象存储 设置恢复失败');

    const handleImportAllSavesAndSettings = () => runTask('import-all-saves-settings', async () => {
        if (cloudSaves.length <= 0 && !summary?.settings) {
            window.alert('云端暂无可导入的存档或设置，请先刷新云端列表。');
            return;
        }
        if (!window.confirm('这会增量导入对象存储云端全部存档，并下载云端设置覆盖当前本机全部设置。设置恢复后页面会刷新，是否继续？')) return;
        const active = await persistConfig();
        let saveResult = { imported: 0, skipped: 0 };
        if (cloudSaves.length > 0) {
            saveResult = await 增量导入对象存储云存档(active, cloudSaves, readProgress);
        }
        if (summary?.settings) {
            const settingsResult = await 下载设置自对象存储(active, readProgress);
            if (settingsResult.success) {
                window.alert(`对象存储 存档和设置下载完成：新增存档 ${saveResult.imported} 条，跳过 ${saveResult.skipped} 条；设置 ${settingsResult.importedSettingCount}/${settingsResult.settingCount}，页面即将刷新。`);
                window.location.reload();
                return;
            }
            window.alert(`对象存储 设置恢复失败：${settingsResult.stageLabel} - ${settingsResult.error || '未知错误'}；存档已导入 ${saveResult.imported} 条，跳过 ${saveResult.skipped} 条。`);
            return;
        }
        window.alert(`对象存储 存档下载完成：新增 ${saveResult.imported} 条，跳过 ${saveResult.skipped} 条；云端暂无设置包。`);
    }, '对象存储 存档和设置下载失败');

    return (
        <div className="rounded-2xl border border-sky-700/25 bg-sky-50/80 p-4 shadow-[0_10px_24px_rgba(12,74,110,0.08)]">
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/10 pb-3">
                <div>
                    <div className="text-lg font-serif font-bold tracking-[0.18em] text-sky-950">对象存储云同步</div>
                    <div className="mt-1 text-xs leading-5 text-sky-900/75">使用 S3 兼容对象存储增量同步存档，也可单独同步全部游戏设置。</div>
                </div>
                <span className="rounded-full border border-sky-700/25 bg-white/70 px-2 py-1 text-[10px] tracking-[0.16em] text-sky-900">OSS</span>
            </div>

            <div className="mt-4 grid gap-2">
                <input value={config.endpoint} onChange={(event) => setConfig((prev) => ({ ...prev, endpoint: event.target.value }))} placeholder="对象存储端点，例如 https://s3.hi168.com" className="rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-sm text-sky-950 outline-none focus:border-sky-700" />
                <input value={config.bucket} onChange={(event) => setConfig((prev) => ({ ...prev, bucket: event.target.value }))} placeholder="存储桶名" className="rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-sm text-sky-950 outline-none focus:border-sky-700" />
                <input value={config.username || ''} onChange={(event) => setConfig((prev) => ({ ...prev, username: event.target.value }))} placeholder="OSS 用户名称（可选，仅用于标记）" autoComplete="username" className="rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-sm text-sky-950 outline-none focus:border-sky-700" />
                <input value={config.accessKey} onChange={(event) => setConfig((prev) => ({ ...prev, accessKey: event.target.value }))} placeholder="OSS Access Key" autoComplete="username" className="rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-sm text-sky-950 outline-none focus:border-sky-700" />
                <input value={config.secretKey} onChange={(event) => setConfig((prev) => ({ ...prev, secretKey: event.target.value }))} placeholder="OSS Secret Key" type="password" autoComplete="current-password" className="rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-sm text-sky-950 outline-none focus:border-sky-700" />
                <input value={config.prefix || ''} onChange={(event) => setConfig((prev) => ({ ...prev, prefix: event.target.value }))} placeholder="目录前缀，默认 MoRanJiangHu" className="rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-sm text-sky-950 outline-none focus:border-sky-700" />
            </div>

            <div className="mt-3 rounded-xl border border-sky-900/10 bg-white/70 px-3 py-2 text-xs leading-5 text-sky-950/75">
                <div>{status}</div>
                {progress?.total ? (
                    <div className="mt-2">
                        <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                            <div
                                className="h-full rounded-full bg-sky-700 transition-all"
                                style={{ width: `${Math.min(100, Math.max(4, ((progress.current || 0) / progress.total) * 100))}%` }}
                            />
                        </div>
                        <div className="mt-1 text-[11px] text-sky-950/65">{progress.current || 0}/{progress.total}</div>
                    </div>
                ) : null}
                <div>云端存档：{summary ? `${summary.saveCount} 个` : '未读取'} · 云端设置：{summary?.settings ? `${formatTime(summary.settings.syncedAt)} · v${summary.settings.appVersion}` : '暂无'}</div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={handleSaveConfig} disabled={busy} className="rounded-lg border border-sky-700/30 bg-white/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-sky-900 hover:bg-sky-100 disabled:opacity-50">{buttonContent('save-config', '保存配置')}</button>
                <button onClick={handleTest} disabled={busy} className="rounded-lg border border-sky-700/30 bg-white/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-sky-900 hover:bg-sky-100 disabled:opacity-50">{buttonContent('test', '测试/刷新')}</button>
                <button onClick={handleUploadSaves} disabled={busy} className="rounded-lg border border-emerald-700/30 bg-emerald-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-emerald-900 hover:bg-emerald-200 disabled:opacity-50">{buttonContent('upload-saves', '上传全部存档')}</button>
                <button onClick={handleUploadSettings} disabled={busy} className="rounded-lg border border-amber-700/30 bg-amber-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-amber-900 hover:bg-amber-200 disabled:opacity-50">{buttonContent('upload-settings', '上传全部设置')}</button>
                <button onClick={handleUploadSavesAndSettings} disabled={busy} className="rounded-lg border border-indigo-700/30 bg-indigo-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-indigo-900 hover:bg-indigo-200 disabled:opacity-50 sm:col-span-2">{buttonContent('upload-saves-settings', '上传存档+设置')}</button>
            </div>

            <div className="mt-4 grid gap-2">
                <select value={selectedCloudSaveId} onChange={(event) => setSelectedCloudSaveId(event.target.value)} className="min-w-0 rounded-lg border border-sky-800/20 bg-white/85 px-3 py-2 text-xs text-sky-950 outline-none focus:border-sky-700">
                    <option value="">选择云端存档</option>
                    {cloudSaves.map((item) => (
                        <option key={item.id} value={item.id}>{buildCloudSaveLabel(item)}</option>
                    ))}
                </select>
                <div className="grid gap-2 sm:grid-cols-2">
                    <button onClick={handleImportSave} disabled={busy || !selectedCloudSaveId} className="rounded-lg border border-sky-700/30 bg-sky-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-sky-900 hover:bg-sky-200 disabled:opacity-50">{buttonContent('import-save', '导入所选存档')}</button>
                    <button onClick={handleImportAllSaves} disabled={busy || cloudSaves.length <= 0} className="rounded-lg border border-emerald-700/30 bg-emerald-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-emerald-900 hover:bg-emerald-200 disabled:opacity-50">{buttonContent('import-all-saves', '增量导入全部存档')}</button>
                    <button onClick={handleRestoreSettings} disabled={busy || !summary?.settings} className="rounded-lg border border-violet-700/30 bg-violet-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-violet-900 hover:bg-violet-200 disabled:opacity-50">{buttonContent('restore-settings', '恢复全部设置')}</button>
                    <button onClick={handleImportAllSavesAndSettings} disabled={busy || (cloudSaves.length <= 0 && !summary?.settings)} className="rounded-lg border border-indigo-700/30 bg-indigo-100/80 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-indigo-900 hover:bg-indigo-200 disabled:opacity-50">{buttonContent('import-all-saves-settings', '下载存档+设置')}</button>
                </div>
            </div>
        </div>
    );
};
