import React from 'react';
import GameButton from '../ui/GameButton';
import { GitHubSyncButton } from '../features/Auth/GitHubSyncButton';
import { RELEASE_INFO } from '../../data/releaseInfo';
import { checkForAppUpdate, downloadLatestApkPackage, openExternalUrl } from '../../services/appUpdate';
import { fetchOnlinePresencePublicStats, type OnlinePresencePublicStats } from '../../services/onlinePresence';
import { isNativeCapacitorEnvironment, setNativeSystemBarsHidden } from '../../utils/nativeRuntime';
import { ThemePreset } from '../../types';

const hasFullscreenElement = () => {
    const doc = document as Document & {
        webkitFullscreenElement?: Element;
        msFullscreenElement?: Element;
    };

    return !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
    );
};

const requestBrowserFullscreen = async () => {
    const doc = document as Document & {
        webkitFullscreenElement?: Element;
        webkitExitFullscreen?: () => Promise<void> | void;
        msFullscreenElement?: Element;
        msExitFullscreen?: () => Promise<void> | void;
    };

    const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
    };

    const isFullscreen = hasFullscreenElement();

    if (!isFullscreen) {
        const enter = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
        if (enter) {
            try {
                await Promise.resolve(enter.call(root));
                await setNativeSystemBarsHidden(true);
            } catch (err: unknown) {
                console.error('进入全屏失败:', err);
            }
        }
        return;
    }

    const exit = document.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (exit) {
        try {
            await Promise.resolve(exit.call(document));
            await setNativeSystemBarsHidden(false);
        } catch (err: unknown) {
            console.error('退出全屏失败:', err);
        }
    }
};

interface Props {
    onStart: () => void;
    onLoad: () => void;
    onCloudPlay: () => void;
    onImageManager: () => void;
    onWorldbookManager: () => void;
    onNovelDecomposition: () => void;
    onSettings: () => void;
    onOpenReleaseNotes: () => void;
    currentTheme: ThemePreset;
    onThemeChange: (theme: ThemePreset) => void;
    hasSave: boolean;
}

const actionButtonStyle: React.CSSProperties = {
    fontFamily: 'var(--ui-按钮-font-family, inherit)',
    fontSize: 'var(--ui-按钮-font-size, 14px)',
    lineHeight: 'var(--ui-按钮-line-height, 1.2)'
};

const DISCORD_PROJECT_THREAD_URL = 'https://discord.com/channels/1380075940285124724/1507996890304872630';
const DISCORD_PROJECT_THREAD_TOOLTIP = '本项目已开独立贴，请点赞支持；反馈问题也请去这里。';

const 公益站支持入口 = [
    {
        名称: 'Telegram 支持',
        url: 'https://t.me/+kJrkNKRHmZk0ZDk9',
        说明: '邀请 1 位客户，可获得 1 个 Plus 日抛号。'
    },
    {
        名称: 'FreeModel',
        url: 'https://freemodel.dev/invite/FRE-fa0068d9',
        说明: '注册可得 1 个月 Pro，双方各得 5 美元额度；Pro 额度按 5 小时和 7 天窗口刷新。'
    },
    {
        名称: 'DenXio',
        url: 'https://api.denxio.top/register?tbe_invite_code=5U5Q',
        说明: '注册后进群按兑换码可得 20 美元，我方可得 10 美元，倍率 0.2。'
    },
    {
        名称: 'Cooree',
        url: 'https://new.cooree.de/register?aff=0p3B',
        说明: '客户注册约得 50 美元，我方得 5 美元；低于 2 美元可到 nc.cooree.de 自助补。'
    }
];

const 友情链接 = [
    {
        名称: '域管家',
        url: 'https://sanpin.ltd/',
        图像: 'https://sanpin.ltd/favicon.svg?v=1.9.119',
        说明: '一个美观且实用的域名管理平台'
    },
    {
        名称: '追更宝',
        url: 'https://quark.bacon123.eu.org/',
        图像: 'https://cdn.nodeimage.com/i/qbOErTgaVwIXG2tHNWikXjHZuLHG0qEw.webp',
        说明: '夸克自动追更下载'
    }
];

type 在线人数小时点 = {
    hour: string;
    label: string;
    count: number;
};

const 在线人数历史存储键 = 'moranjianghu.onlineHourlyHistory';

const 读取在线人数历史 = (): 在线人数小时点[] => {
    try {
        const raw = window.localStorage.getItem(在线人数历史存储键);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((item) => ({
                hour: typeof item?.hour === 'string' ? item.hour : '',
                label: typeof item?.label === 'string' ? item.label : '',
                count: Math.max(0, Number(item?.count) || 0)
            }))
            .filter((item) => item.hour && item.label)
            .slice(-24);
    } catch {
        return [];
    }
};

const 写入在线人数小时点 = (stats: OnlinePresencePublicStats): 在线人数小时点[] => {
    const date = stats.serverTime ? new Date(stats.serverTime) : new Date();
    if (Number.isNaN(date.getTime())) return 读取在线人数历史();
    date.setMinutes(0, 0, 0);
    const hour = date.toISOString();
    const label = `${date.getHours().toString().padStart(2, '0')}:00`;
    const nextPoint: 在线人数小时点 = {
        hour,
        label,
        count: Math.max(0, Number(stats.onlineCount) || 0)
    };
    const history = 读取在线人数历史().filter((item) => item.hour !== hour);
    const next = [...history, nextPoint].sort((a, b) => a.hour.localeCompare(b.hour)).slice(-24);
    try {
        window.localStorage.setItem(在线人数历史存储键, JSON.stringify(next));
    } catch {
        // Ignore storage failures; the live counter still works.
    }
    return next;
};

const 从服务端在线历史转换 = (stats: OnlinePresencePublicStats): 在线人数小时点[] => (
    Array.isArray(stats.hourlyHistory)
        ? stats.hourlyHistory
            .map((item) => ({
                hour: typeof item.hour === 'string' ? item.hour : '',
                label: 格式化在线人数时间标签(item.hour, false),
                count: Math.max(0, Number(item.onlineCount) || 0)
            }))
            .filter((item) => item.hour)
            .sort((left, right) => left.hour.localeCompare(right.hour))
            .slice(-24)
        : []
);

const 格式化在线人数时间标签 = (hour: string, includeDate: boolean) => {
    const date = new Date(hour);
    if (Number.isNaN(date.getTime())) return '--:--';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = `${date.getHours().toString().padStart(2, '0')}:00`;
    return includeDate ? `${month}/${day} ${time}` : time;
};

const 在线人数折线图: React.FC<{ data: 在线人数小时点[]; current?: OnlinePresencePublicStats | null }> = ({ data, current }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const points = data.length > 0
        ? data
        : [{ hour: 'empty', label: '--:--', count: current?.onlineCount ?? 0 }];
    const pointDayKey = (item: 在线人数小时点) => {
        const date = new Date(item.hour);
        return Number.isNaN(date.getTime()) ? item.hour : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };
    const dayKeys = new Set(points.map(pointDayKey));
    const showDate = dayKeys.size > 1;
    const width = 280;
    const height = 112;
    const padX = 16;
    const padY = 12;
    const chartBottom = 78;
    const labelY = 101;
    const maxCount = Math.max(1, ...points.map((item) => item.count));
    const pointPosition = (item: 在线人数小时点, index: number) => {
        const x = points.length <= 1
            ? width / 2
            : padX + (index / (points.length - 1)) * (width - padX * 2);
        const y = chartBottom - (item.count / maxCount) * (chartBottom - padY);
        return { x, y };
    };
    const path = points.map((item, index) => {
        const { x, y } = pointPosition(item, index);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
    const hoveredPosition = hoveredPoint ? pointPosition(hoveredPoint, hoveredIndex ?? 0) : null;
    const formatAxisLabel = (item: 在线人数小时点, index: number) => {
        if (item.hour === 'empty') return { top: '', bottom: item.label };
        const date = new Date(item.hour);
        if (Number.isNaN(date.getTime())) return { top: '', bottom: item.label };
        if (!showDate) return { top: '', bottom: 格式化在线人数时间标签(item.hour, false) };
        const previousPoint = points[index - 1];
        const startsNewDateGroup = index === 0 || !previousPoint || pointDayKey(previousPoint) !== pointDayKey(item);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return {
            top: startsNewDateGroup ? `${month}/${day}` : '',
            bottom: 格式化在线人数时间标签(item.hour, false)
        };
    };

    return (
        <div className="landing-presence-panel relative z-10 flex h-full w-full flex-col items-center border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-center shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
            <div className="landing-presence-metrics grid w-full max-w-[430px] grid-cols-3 items-start gap-3">
                <div className="landing-presence-metric">
                    <div className="landing-presence-label text-[10px] tracking-[0.2em] text-emerald-200/80">在线人数</div>
                    <div className="landing-presence-online mt-1 font-mono text-2xl font-bold text-emerald-100">{current ? current.onlineCount : '--'}</div>
                </div>
                <div className="landing-presence-metric">
                    <div className="landing-presence-label landing-presence-label--peak text-[10px] tracking-[0.16em] text-emerald-200/70">24小时峰值</div>
                    <div className="landing-presence-peak-value mt-1 font-mono text-2xl font-bold text-emerald-100">{maxCount}</div>
                </div>
                <div className="landing-presence-metric">
                    <div className="landing-presence-label landing-presence-label--recent text-[10px] tracking-[0.2em] text-sky-200/70">最近游玩</div>
                    <div className="landing-presence-recent mt-1 font-mono text-2xl font-bold text-sky-100">{current ? current.totalRecentCount : '--'}</div>
                </div>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="landing-presence-chart mt-1 min-h-0 w-full max-w-[420px] flex-1 overflow-visible" role="img" aria-label="每小时在线人数折线图">
                <defs>
                    <linearGradient id="onlineLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--landing-presence-line-start, #34d399)" />
                        <stop offset="100%" stopColor="var(--landing-presence-line-end, #38bdf8)" />
                    </linearGradient>
                    <linearGradient id="onlineAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--landing-presence-area, #34d399)" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="var(--landing-presence-area, #34d399)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 1, 2].map((line) => {
                    const y = padY + line * ((chartBottom - padY) / 2);
                    return <line key={line} x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--landing-presence-grid, rgba(255,255,255,0.08))" strokeWidth="1" />;
                })}
                {points.length > 1 && (
                    <path d={`${path} L ${width - padX} ${chartBottom} L ${padX} ${chartBottom} Z`} fill="url(#onlineAreaGradient)" />
                )}
                <path d={path} fill="none" stroke="url(#onlineLineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {hoveredPoint && hoveredPosition && (
                    <g className="pointer-events-none">
                        <line
                            x1={hoveredPosition.x}
                            y1={hoveredPosition.y}
                            x2={hoveredPosition.x}
                            y2={labelY - 4}
                            className="landing-presence-hover-line"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                        />
                        <rect
                            x={Math.max(8, Math.min(width - 54, hoveredPosition.x - 23))}
                            y={Math.max(2, hoveredPosition.y - 28)}
                            width="46"
                            height="18"
                            rx="4"
                            className="landing-presence-tooltip-bg"
                        />
                        <text
                            x={Math.max(31, Math.min(width - 31, hoveredPosition.x))}
                            y={Math.max(14, hoveredPosition.y - 15)}
                            textAnchor="middle"
                            className="landing-presence-tooltip-text font-mono text-[9px]"
                        >
                            {hoveredPoint.count}人
                        </text>
                    </g>
                )}
                {points.map((item, index) => {
                    const { x, y } = pointPosition(item, index);
                    const axisLabel = formatAxisLabel(item, index);
                    const active = hoveredIndex === index;
                    return (
                        <g key={item.hour}>
                            <circle
                                cx={x}
                                cy={y}
                                r="12"
                                fill="transparent"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onFocus={() => setHoveredIndex(index)}
                                onBlur={() => setHoveredIndex(null)}
                                tabIndex={0}
                                role="img"
                                aria-label={`在线人数 ${item.count}`}
                                className="cursor-pointer"
                            />
                            {active ? (
                                <g className="pointer-events-none">
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="7"
                                        fill="var(--landing-presence-selected-fill, transparent)"
                                        stroke="var(--landing-presence-selected-stroke, #fef3c7)"
                                        strokeWidth="2.2"
                                    />
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="2.8"
                                        fill="var(--landing-presence-selected-stroke, #fef3c7)"
                                    />
                                </g>
                            ) : (
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={index === points.length - 1 ? 4 : 2.8}
                                    fill={index === points.length - 1 ? 'var(--landing-presence-current-dot, #fef3c7)' : 'var(--landing-presence-dot, #6ee7b7)'}
                                    className="pointer-events-none transition-all"
                                />
                            )}
                            {axisLabel.top && (
                                <text x={x} y={labelY - 9} textAnchor="middle" className="landing-presence-axis-date font-mono text-[7px]">
                                    {axisLabel.top}
                                </text>
                            )}
                            <text x={x} y={labelY} textAnchor="middle" className={`landing-presence-axis-label font-mono ${showDate ? 'text-[8px]' : 'text-[9px]'}`}>
                                {axisLabel.bottom}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const LandingPage: React.FC<Props> = ({
    onStart,
    onLoad,
    onCloudPlay,
    onImageManager,
    onWorldbookManager,
    onNovelDecomposition,
    onSettings,
    onOpenReleaseNotes,
    currentTheme,
    onThemeChange,
    hasSave
}) => {
    const isNativeApp = React.useMemo(() => isNativeCapacitorEnvironment(), []);
    const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
    const [presenceStats, setPresenceStats] = React.useState<OnlinePresencePublicStats | null>(null);
    const [presenceHistory, setPresenceHistory] = React.useState<在线人数小时点[]>([]);

    React.useEffect(() => {
        const syncSystemBars = () => {
            void setNativeSystemBarsHidden(hasFullscreenElement());
        };

        document.addEventListener('fullscreenchange', syncSystemBars);
        return () => {
            document.removeEventListener('fullscreenchange', syncSystemBars);
            void setNativeSystemBarsHidden(false);
        };
    }, []);

    React.useEffect(() => {
        setPresenceHistory(读取在线人数历史());
        let cancelled = false;
        const refresh = async () => {
            const stats = await fetchOnlinePresencePublicStats();
            if (!cancelled && stats) {
                setPresenceStats(stats);
                const serverHistory = 从服务端在线历史转换(stats);
                setPresenceHistory(serverHistory.length > 0 ? serverHistory : 写入在线人数小时点(stats));
            }
        };
        void refresh();
        const timer = window.setInterval(() => { void refresh(); }, 30000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, []);

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        try {
            await checkForAppUpdate();
        } catch (error: any) {
            window.alert(`开始更新失败：${error?.message || '未知错误'}`);
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const handleDownloadApk = async () => {
        setIsCheckingUpdate(true);
        try {
            await downloadLatestApkPackage();
        } catch (error: any) {
            window.alert(`下载 APK 失败：${error?.message || '未知错误'}`);
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    return (
        <div className="relative z-40 flex h-full w-full flex-col items-center overflow-y-auto rounded-xl bg-black px-4 pt-[max(var(--app-safe-top,env(safe-area-inset-top,0px)),12px)] pb-[calc(var(--app-safe-bottom,env(safe-area-inset-bottom,0px))+16px)]">
            <div className="absolute inset-0 bg-black" />

            <div className="relative z-20 mb-3 flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 pt-2 sm:justify-end md:mb-4">
                <button
                    type="button"
                    onClick={() => { void openExternalUrl(DISCORD_PROJECT_THREAD_URL); }}
                    className="landing-discord-thread-button min-h-[40px] border px-3 py-2 text-xs font-serif tracking-[0.16em] shadow-[0_0_18px_rgba(99,102,241,0.16)] transition-colors md:text-sm"
                    style={actionButtonStyle}
                    title={DISCORD_PROJECT_THREAD_TOOLTIP}
                    aria-label={DISCORD_PROJECT_THREAD_TOOLTIP}
                >
                    Discord 独立贴
                </button>

                <GitHubSyncButton floating={false} />

                {isNativeApp && (
                    <button
                        type="button"
                        onClick={() => { void handleCheckUpdate(); }}
                        className="min-h-[40px] border border-wuxia-gold/40 bg-black/60 px-3 py-2 text-xs font-serif tracking-[0.18em] text-wuxia-gold transition-colors hover:bg-black/80 md:text-sm"
                        style={actionButtonStyle}
                        title="检查 APK 更新"
                    >
                        {isCheckingUpdate ? '检查中...' : '检查更新'}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onThemeChange(currentTheme === 'day' ? 'ink' : 'day')}
                    className="min-h-[40px] border border-wuxia-cyan/40 bg-black/60 px-3 py-2 text-xs font-serif tracking-[0.18em] text-wuxia-cyan transition-colors hover:bg-black/80 md:text-sm"
                    style={actionButtonStyle}
                    title={currentTheme === 'day' ? '切换到黑夜模式' : '切换到白天模式'}
                >
                    {currentTheme === 'day' ? '黑夜模式' : '白天模式'}
                </button>

                <button
                    type="button"
                    onClick={() => { void requestBrowserFullscreen(); }}
                    className="min-h-[40px] border border-wuxia-gold/40 bg-black/60 px-3 py-2 text-xs font-serif tracking-[0.2em] text-wuxia-gold transition-colors hover:bg-black/80 md:text-sm"
                    style={actionButtonStyle}
                    title="切换全屏"
                >
                    全屏
                </button>
            </div>

            <div className="relative z-10 flex w-full max-w-[2200px] flex-1 flex-col items-center gap-6 pb-2 lg:block">
                <section className="landing-hero-section flex min-h-[calc(100vh-210px)] min-w-0 flex-col items-center justify-center animate-fadeIn lg:absolute lg:left-1/2 lg:top-[40%] lg:-translate-x-1/2 lg:-translate-y-1/2">
                    <div className="relative mb-8 flex w-full flex-col items-center">
                        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-wuxia-gold/5 blur-3xl" />

                        <h1
                            onClick={() => { void requestBrowserFullscreen(); }}
                            className="mb-6 cursor-pointer select-none bg-gradient-to-b from-gray-100 to-gray-500 bg-clip-text text-center font-serif text-7xl font-black tracking-[0.1em] text-transparent drop-shadow-2xl md:text-9xl"
                            style={{
                                fontFamily: 'var(--ui-页面标题-font-family, inherit)',
                                fontSize: 'var(--ui-页面标题-font-size, clamp(3rem,8vw,6rem))',
                                lineHeight: 'var(--ui-页面标题-line-height, 1.2)',
                                fontStyle: 'var(--ui-页面标题-font-style, normal)'
                            }}
                            title="点击切换全屏"
                        >
                            墨色江湖
                        </h1>

                        <div
                            className="-mt-3 mb-4 text-[10px] font-mono tracking-[0.3em] text-gray-600 opacity-60"
                            style={{
                                fontFamily: 'var(--ui-等宽信息-font-family, inherit)',
                                fontSize: 'var(--ui-等宽信息-font-size, 12px)',
                                lineHeight: 'var(--ui-等宽信息-line-height, 1.45)'
                            }}
                        >
                            VER {RELEASE_INFO.versionName} · APK {RELEASE_INFO.versionCode}
                        </div>

                        <div className="flex items-center gap-6 opacity-80">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-wuxia-red" />
                            <h2
                                className="text-shadow-sm text-xl font-bold uppercase tracking-[0.5em] text-wuxia-red md:text-2xl"
                                style={{
                                    fontFamily: 'var(--ui-分组标题-font-family, inherit)',
                                    lineHeight: 'var(--ui-分组标题-line-height, 1.35)'
                                }}
                            >
                                却又不止江湖
                            </h2>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-wuxia-red" />
                        </div>

                        <div className="mt-8 w-full max-w-2xl border-2 border-amber-400/70 bg-amber-950/35 px-4 py-4 text-center shadow-[0_0_28px_rgba(251,191,36,0.16)]">
                            <div className="text-sm font-bold tracking-[0.24em] text-amber-200 md:text-base">
                                bacon159 二创版本
                            </div>
                            <div className="mt-2 text-xs leading-6 text-amber-50/90 md:text-sm">
                                本版本的部分功能、设置项和本地数据结构可能与原版或其他二创版本不同，跨版本导入存档/设置前请务必备份；不同版本之间可能不兼容。
                            </div>
                            <div className="mt-3 border-t border-amber-300/25 pt-3 text-xs leading-6 text-amber-100/90 md:text-sm">
                                共创者：Ling（Discord：ling033487）
                            </div>
                        </div>
                    </div>

                    <div className="flex w-64 flex-col gap-3 animate-slide-in delay-100">
                        <GameButton onClick={onStart} variant="primary" className="py-4 text-lg shadow-lg">
                            踏入江湖
                        </GameButton>

                        <GameButton
                            onClick={onLoad}
                            variant="secondary"
                            className={`py-4 text-lg shadow-lg ${!hasSave ? 'cursor-not-allowed grayscale opacity-50' : ''}`}
                            disabled={!hasSave}
                        >
                            重入江湖
                        </GameButton>

                        <GameButton onClick={onCloudPlay} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-95 shadow-lg hover:opacity-100">
                            云端游玩
                        </GameButton>

                        <GameButton onClick={onImageManager} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-90 shadow-lg hover:opacity-100">
                            图片管理
                        </GameButton>

                        <GameButton onClick={onWorldbookManager} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-90 shadow-lg hover:opacity-100">
                            世界书管理
                        </GameButton>

                        <GameButton onClick={onNovelDecomposition} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-90 shadow-lg hover:opacity-100">
                            小说拆解
                        </GameButton>

                        <GameButton onClick={onSettings} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-80 shadow-lg hover:opacity-100">
                            设置
                        </GameButton>
                    </div>
                </section>

                <div className="landing-dashboard-row relative z-10 grid w-full max-w-[1440px] grid-cols-1 items-stretch gap-4 overflow-hidden animate-fadeIn lg:absolute lg:bottom-16 lg:left-1/2 lg:h-[224px] lg:max-h-[224px] lg:-translate-x-1/2 lg:grid-cols-[minmax(300px,400px)_minmax(380px,1fr)_minmax(300px,400px)]">
                    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-wuxia-gold/15 bg-black/45 px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-wuxia-gold/10 pb-2">
                            <div>
                                <div className="text-sm font-serif tracking-[0.24em] text-wuxia-gold">发布信息</div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Web / APK 当前统一版本 v{RELEASE_INFO.versionName}
                                </div>
                            </div>
                            <div className="text-xs font-mono tracking-[0.18em] text-gray-500">
                                APK CODE {RELEASE_INFO.versionCode}
                            </div>
                        </div>

                        <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => { void openExternalUrl(RELEASE_INFO.githubRepoUrl); }}
                                className="min-h-[38px] border border-wuxia-gold/25 bg-white/[0.03] px-3 py-2 text-xs tracking-[0.16em] text-wuxia-gold transition-colors hover:bg-white/[0.06]"
                            >
                                GitHub 项目
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void handleDownloadApk();
                                }}
                                className="min-h-[38px] border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs tracking-[0.16em] text-emerald-300 transition-colors hover:bg-emerald-500/15"
                            >
                                {isNativeApp ? (isCheckingUpdate ? '准备中...' : '下载 APK') : 'APK 下载'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { void openExternalUrl(RELEASE_INFO.releaseNotesUrl); }}
                                className="min-h-[38px] border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs tracking-[0.16em] text-sky-200 transition-colors hover:bg-sky-500/15"
                            >
                                更新日志
                            </button>
                            <button
                                type="button"
                                onClick={() => { void openExternalUrl((RELEASE_INFO as any).tutorialsUrl || '/tutorials.html'); }}
                                className="min-h-[38px] border border-wuxia-gold/25 bg-wuxia-gold/10 px-3 py-2 text-xs tracking-[0.16em] text-wuxia-gold transition-colors hover:bg-wuxia-gold/15"
                            >
                                教程中心
                            </button>
                            <button
                                type="button"
                                onClick={() => { void openExternalUrl('/item-preset-feedback.html'); }}
                                className="min-h-[38px] border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs tracking-[0.16em] text-fuchsia-200 transition-colors hover:bg-fuchsia-500/15 sm:col-span-2"
                            >
                                预设图反馈
                            </button>
                        </div>
                    </aside>

                    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                        <在线人数折线图 data={presenceHistory} current={presenceStats} />
                    </div>

                    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-500/20 bg-black/45 px-3 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                        <div className="text-xs font-serif tracking-[0.14em] text-wuxia-gold">
                            点击注册公益站支持开发项目
                        </div>
                        <div className="mt-1 text-[11px] leading-4 text-gray-300">
                            承诺：所有通过邀请获得的 aff 额度都会用于开发本项目。
                        </div>
                        <div className="mt-2 grid min-h-0 flex-1 grid-cols-4 gap-1.5 overflow-hidden">
                            {公益站支持入口.map((item) => (
                                <button
                                    key={item.url}
                                    type="button"
                                    onClick={() => { void openExternalUrl(item.url); }}
                                    className="min-h-0 border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-left text-[10px] text-amber-100 transition-colors hover:bg-amber-500/15"
                                    title={item.说明}
                                >
                                    <span className="block font-bold tracking-[0.04em] text-amber-200">{item.名称}</span>
                                    <span className="mt-1 block leading-[14px] text-amber-50/80">{item.说明}</span>
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>

            <div className="landing-friend-links relative z-10 mt-1 w-full max-w-6xl border-t border-white/10 pt-1.5 lg:absolute lg:bottom-3 lg:left-1/2 lg:h-[38px] lg:-translate-x-1/2">
                <div className="flex h-full flex-wrap items-center justify-center gap-2 overflow-visible">
                    <span className="text-[11px] tracking-[0.22em] text-gray-500">友情链接</span>
                    {友情链接.map((item) => (
                        <button
                            key={item.url}
                            type="button"
                            onClick={() => { void openExternalUrl(item.url); }}
                            className="inline-flex h-[28px] items-center gap-2 border border-white/10 bg-white/[0.04] px-2.5 text-left transition-colors hover:border-wuxia-gold/35 hover:bg-white/[0.07]"
                            title={item.说明}
                        >
                            <img src={item.图像} alt="" className="h-4 w-4 rounded object-cover" loading="lazy" />
                            <span className="text-xs font-bold tracking-[0.16em] text-gray-100">{item.名称}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="absolute top-10 right-20 h-32 w-32 rounded-full bg-black/50 opacity-40 blur-2xl" />
            <div className="absolute bottom-20 left-10 h-48 w-48 rounded-full bg-black/60 opacity-30 blur-3xl" />
        </div>
    );
};

export default LandingPage;
