import React from 'react';
import type { 本地图片图床迁移状态, 本地图片图床迁移资源状态 } from '../../../services/dbService';

interface Props {
    status: 本地图片图床迁移状态;
    compact?: boolean;
}

const 阶段文案: Record<本地图片图床迁移状态['stage'], string> = {
    idle: '等待扫描',
    scanning: '扫描中',
    running: '迁移中',
    completed: '已完成',
    partial_failed: '部分失败',
    failed: '失败'
};

const 阶段样式: Record<本地图片图床迁移状态['stage'], string> = {
    idle: 'border-slate-700 text-slate-300 bg-slate-950/40',
    scanning: 'border-sky-700 text-sky-300 bg-sky-950/30',
    running: 'border-amber-700 text-amber-300 bg-amber-950/25',
    completed: 'border-emerald-700 text-emerald-300 bg-emerald-950/25',
    partial_failed: 'border-orange-700 text-orange-300 bg-orange-950/25',
    failed: 'border-red-700 text-red-300 bg-red-950/30'
};

const 格式化时间 = (value?: string): string => {
    if (!value) return '未记录';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未记录';
    return date.toLocaleString();
};

const 统计项: React.FC<{ label: string; value: React.ReactNode; compact?: boolean; tone?: 'normal' | 'good' | 'warn' | 'danger' }> = ({ label, value, compact = false, tone = 'normal' }) => {
    const toneClass = {
        normal: 'border-wuxia-gold/15 bg-black/35 text-gray-200',
        good: 'border-emerald-900/40 bg-emerald-950/10 text-emerald-300',
        warn: 'border-amber-900/40 bg-amber-950/10 text-amber-300',
        danger: 'border-red-900/40 bg-red-950/10 text-red-300'
    }[tone];

    return (
        <div className={`rounded border ${toneClass} ${compact ? 'p-2' : 'p-3'}`}>
            <div className="text-[10px] text-wuxia-gold/50 tracking-widest font-serif">{label}</div>
            <div className={`${compact ? 'text-base' : 'text-xl'} font-semibold mt-1`}>{value}</div>
        </div>
    );
};

const 资源状态文案: Record<本地图片图床迁移资源状态['status'], string> = {
    pending_upload: '待上传图床',
    uploaded: '已上传',
    pending_backup: '待补本地',
    backed_up: '已补本地',
    local_only: '仅本地',
    remote_only: '仅图床',
    complete: '图床+本地',
    failed: '失败'
};

const 状态点: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <span className={`rounded-full border px-2 py-0.5 ${ok ? 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300' : 'border-red-800/50 bg-red-950/25 text-red-300'}`}>
        {label}{ok ? '有' : '缺'}
    </span>
);

const ImageMigrationStatusPanel: React.FC<Props> = ({ status, compact = false }) => {
    const total = Math.max(0, Number(status.totalAssets) || 0);
    const processed = Math.min(total, Math.max(0, Number(status.processedAssets) || 0));
    const percent = total > 0 ? Math.round((processed / total) * 100) : (status.stage === 'completed' ? 100 : 0);
    const isActive = status.stage === 'scanning' || status.stage === 'running';
    const gridClass = compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 md:grid-cols-4 gap-3';

    return (
        <div className={`space-y-4 ${compact ? '' : 'max-w-5xl'}`}>
            <div className="rounded border border-wuxia-gold/25 bg-black/45 p-4 md:p-5 shadow-[inset_0_0_25px_rgba(0,0,0,0.55)]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className={`${compact ? 'text-base' : 'text-2xl'} text-wuxia-gold font-serif tracking-widest text-shadow-glow`}>旧图迁移</div>
                        <div className="mt-2 text-xs md:text-sm text-gray-400 leading-relaxed">
                            旧存档中的本地图片会在后台自动上传到图床作为备份，游戏内仍优先使用本地图片。无需手动操作；失败时会保留原图并稍后自动重试。
                        </div>
                    </div>
                    <div className={`shrink-0 rounded-full border px-3 py-1 text-xs font-serif tracking-wider ${阶段样式[status.stage]}`}>
                        {阶段文案[status.stage]}
                    </div>
                </div>

                <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                        <span>{status.lastMessage || '等待自动迁移状态更新'}</span>
                        <span className="text-wuxia-gold/80">{total > 0 ? `${processed}/${total}` : `${percent}%`}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/70 border border-wuxia-gold/10 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${status.stage === 'failed' || status.stage === 'partial_failed' ? 'bg-red-500/80' : 'bg-wuxia-gold/80'} ${isActive ? 'animate-pulse' : ''}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className={gridClass}>
                <统计项 compact={compact} label="扫描资源" value={status.scannedAssets} />
                <统计项 compact={compact} label="引用资源" value={status.referencedAssets} />
                <统计项 compact={compact} label="图床链接" value={status.remoteImageAssets || 0} tone={(status.remoteImageAssets || 0) > 0 ? 'good' : 'normal'} />
                <统计项 compact={compact} label="待迁移" value={status.totalAssets} tone={status.totalAssets > 0 ? 'warn' : 'normal'} />
                <统计项 compact={compact} label="已迁移" value={status.migratedAssets} tone={status.migratedAssets > 0 ? 'good' : 'normal'} />
                <统计项 compact={compact} label="待补本地" value={status.localBackupMissingAssets || 0} tone={(status.localBackupMissingAssets || 0) > 0 ? 'warn' : 'normal'} />
                <统计项 compact={compact} label="已补本地" value={status.backedUpAssets || 0} tone={(status.backedUpAssets || 0) > 0 ? 'good' : 'normal'} />
                <统计项 compact={compact} label="已处理" value={status.processedAssets} />
                <统计项 compact={compact} label="更新存档" value={status.updatedSaves} tone={status.updatedSaves > 0 ? 'good' : 'normal'} />
                <统计项 compact={compact} label="更新设置" value={status.updatedSettings} tone={status.updatedSettings > 0 ? 'good' : 'normal'} />
                <统计项 compact={compact} label="失败" value={status.failedAssets} tone={status.failedAssets > 0 ? 'danger' : 'normal'} />
            </div>

            <div className="rounded border border-wuxia-gold/15 bg-black/30 p-3 text-xs text-gray-400 space-y-1">
                <div>开始时间：{格式化时间(status.startedAt)}</div>
                <div>最近更新：{格式化时间(status.updatedAt)}</div>
                <div>完成时间：{格式化时间(status.completedAt)}</div>
                {status.cleanedAssets > 0 && <div>已清理本地图片缓存：{status.cleanedAssets} 项</div>}
                {status.retryLater && <div className="text-amber-300">仍有图片等待下次自动重试。</div>}
                {status.lastError && <div className="text-red-300 break-words">最近错误：{status.lastError}</div>}
            </div>

            {Array.isArray(status.assetDetails) && status.assetDetails.length > 0 && (
                <div className="rounded border border-wuxia-gold/15 bg-black/30 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm text-wuxia-gold font-serif tracking-widest">图片兜底明细</div>
                        <div className="text-[10px] text-gray-500">最多显示 {status.assetDetails.length} 项</div>
                    </div>
                    <div className={`${compact ? 'max-h-72' : 'max-h-96'} overflow-auto space-y-2 pr-1`}>
                        {status.assetDetails.map((item) => (
                            <div key={item.key} className="rounded border border-wuxia-gold/10 bg-black/35 p-2 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1 truncate text-gray-200" title={item.remoteUrl || item.localAssetId || item.label}>
                                        {item.label}
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                                        <状态点 ok={item.hasRemote} label="图床" />
                                        <状态点 ok={item.hasLocal} label="本地" />
                                        <span className="rounded-full border border-wuxia-gold/20 bg-wuxia-gold/10 px-2 py-0.5 text-wuxia-gold/80">
                                            {资源状态文案[item.status] || item.status}
                                        </span>
                                    </div>
                                </div>
                                {item.remoteUrl && <div className="mt-1 truncate font-mono text-[10px] text-gray-500" title={item.remoteUrl}>图床：{item.remoteUrl}</div>}
                                {item.localAssetId && <div className="mt-1 truncate font-mono text-[10px] text-gray-500" title={item.localAssetId}>本地：{item.localAssetId}</div>}
                                {item.error && <div className="mt-1 break-words text-[10px] text-red-300">错误：{item.error}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageMigrationStatusPanel;
