import React, { useEffect, useMemo, useState } from 'react';
import { 世界数据结构 } from '../../../models/world';
import { 环境信息结构 } from '../../../models/environment';

interface Props {
    world: 世界数据结构;
    env: 环境信息结构;
    socialList?: any[];
    debugEnabled?: boolean;
    onClose: () => void;
}

const 归一化文本 = (value: string | undefined | null) => (value || '').trim().replace(/\s+/g, '').toLowerCase();

const MobileMapModal: React.FC<Props> = ({ world, env, socialList = [], debugEnabled = false, onClose }) => {
    const maps = Array.isArray(world?.地图) ? world.地图 : [];
    const buildings = Array.isArray(world?.建筑) ? world.建筑 : [];
    const 当前地点归一 = 归一化文本(env?.具体地点 || '');
    const 当前层级 = {
        大: 归一化文本(env?.大地点 || ''),
        中: 归一化文本(env?.中地点 || ''),
        小: 归一化文本(env?.小地点 || '')
    };

    const 默认地图索引 = useMemo(() => {
        const bySmallName = maps.findIndex((m: any) => 归一化文本(m?.名称) === 当前层级.小);
        if (bySmallName >= 0) return bySmallName;

        const byBelong = maps.findIndex((m: any) => (
            归一化文本(m?.归属?.大地点) === 当前层级.大
            && 归一化文本(m?.归属?.中地点) === 当前层级.中
            && 归一化文本(m?.归属?.小地点) === 当前层级.小
        ));
        if (byBelong >= 0) return byBelong;

        const byCurrentPlace = maps.findIndex((m: any) => {
            const key = 归一化文本(m?.名称);
            return !!key && !!当前地点归一 && (当前地点归一.includes(key) || key.includes(当前地点归一));
        });
        return byCurrentPlace >= 0 ? byCurrentPlace : 0;
    }, [maps, 当前地点归一, 当前层级.大, 当前层级.中, 当前层级.小]);

    const [selectedMapIndex, setSelectedMapIndex] = useState(默认地图索引);
    const [activeTab, setActiveTab] = useState<'atlas' | 'buildings' | 'npc_debug'>('atlas');

    useEffect(() => {
        setSelectedMapIndex(默认地图索引);
    }, [默认地图索引]);

    const 当前地图 = selectedMapIndex >= 0 ? maps[selectedMapIndex] || null : null;
    const 当前地图内部建筑名 = useMemo(() => {
        if (!当前地图 || !Array.isArray(当前地图.内部建筑)) return [];
        return 当前地图.内部建筑.filter((name: any) => typeof name === 'string' && name.trim().length > 0);
    }, [当前地图]);

    const 当前地图建筑列表 = useMemo(() => {
        if (当前地图内部建筑名.length === 0) return [];
        return buildings.filter((building: any) => {
            const name = 归一化文本(building?.名称);
            return 当前地图内部建筑名.some((raw: string) => 归一化文本(raw) === name);
        });
    }, [buildings, 当前地图内部建筑名]);

    const 命中建筑列表 = useMemo(() => {
        if (!当前地点归一) return [];
        return buildings.filter((building: any) => {
            const 名称归一 = 归一化文本(building?.名称);
            if (!名称归一) return false;
            return 当前地点归一 === 名称归一
                || 当前地点归一.includes(名称归一)
                || 名称归一.includes(当前地点归一);
        });
    }, [buildings, 当前地点归一]);

    const npcDebugRows = useMemo(() => {
        const currentKeys = [
            env?.具体地点,
            env?.小地点,
            env?.中地点,
            env?.大地点,
            当前地图?.名称,
            ...(当前地图内部建筑名 || [])
        ].map((item) => 归一化文本(String(item || ''))).filter(Boolean);
        const rows = (Array.isArray(socialList) ? socialList : []).map((npc: any, index: number) => {
            const rawLocationText = [
                npc?.当前位置,
                npc?.所在地点,
                npc?.具体地点,
                npc?.地点,
                npc?.位置,
                npc?.归属?.大地点,
                npc?.归属?.中地点,
                npc?.归属?.小地点
            ].map((item) => String(item || '')).filter(Boolean).join(' / ');
            const normalizedLocation = 归一化文本(rawLocationText);
            const normalizedNpcText = 归一化文本(JSON.stringify({
                位置: rawLocationText,
                简介: npc?.简介,
                身份: npc?.身份
            }));
            const hitKeys = currentKeys.filter((key) => (
                Boolean(key) && (
                    normalizedLocation.includes(key)
                    || (normalizedLocation && key.includes(normalizedLocation))
                    || normalizedNpcText.includes(key)
                )
            ));
            const explicitPresent = npc?.是否在场 === true;
            return {
                id: npc?.id || npc?.姓名 || `mobile-npc-debug-${index}`,
                姓名: npc?.姓名 || '未命名',
                身份: npc?.身份 || '未知身份',
                rawLocationText,
                explicitPresent,
                hitKeys,
                finalVisible: explicitPresent || hitKeys.length > 0
            };
        });
        return {
            candidates: rows,
            matched: rows.filter((item) => item.hitKeys.length > 0),
            explicitPresent: rows.filter((item) => item.explicitPresent),
            finalVisible: rows.filter((item) => item.finalVisible)
        };
    }, [socialList, env?.具体地点, env?.小地点, env?.中地点, env?.大地点, 当前地图?.名称, 当前地图内部建筑名]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 md:hidden animate-fadeIn">
            <div className="bg-ink-black/95 border border-wuxia-gold/30 w-full max-w-[680px] h-[88vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-2xl">
                <div className="h-12 shrink-0 border-b border-gray-800/60 bg-black/40 flex items-center justify-between px-4">
                    <div>
                        <div className="text-wuxia-gold font-serif font-bold text-base tracking-[0.2em]">堪舆图鉴</div>
                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">当前地点 · {env?.具体地点 || '未知之境'}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-gray-700 text-gray-400 hover:text-wuxia-red hover:border-wuxia-red transition-all"
                    >
                        ×
                    </button>
                </div>

                <div className="shrink-0 border-b border-gray-800/60 bg-black/30 px-3 py-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('atlas')}
                            className={`px-3 py-2 rounded-full border text-[11px] transition-colors ${
                                activeTab === 'atlas' ? 'border-wuxia-gold/60 bg-wuxia-gold/10 text-wuxia-gold' : 'border-gray-800 text-gray-500'
                            }`}
                        >
                            地图图鉴 <span className="ml-1 font-mono">{maps.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('buildings')}
                            className={`px-3 py-2 rounded-full border text-[11px] transition-colors ${
                                activeTab === 'buildings' ? 'border-wuxia-gold/60 bg-wuxia-gold/10 text-wuxia-gold' : 'border-gray-800 text-gray-500'
                            }`}
                        >
                            命中建筑 <span className="ml-1 font-mono">{命中建筑列表.length}</span>
                        </button>
                        {debugEnabled && <button
                            onClick={() => setActiveTab('npc_debug')}
                            className={`px-3 py-2 rounded-full border text-[11px] transition-colors ${
                                activeTab === 'npc_debug' ? 'border-wuxia-gold/60 bg-wuxia-gold/10 text-wuxia-gold' : 'border-gray-800 text-gray-500'
                            }`}
                        >
                            NPC 调试 <span className="ml-1 font-mono">{npcDebugRows.finalVisible.length}</span>
                        </button>}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-ink-wash/5">
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                        <div className="rounded-xl border border-gray-800 bg-black/30 px-3 py-2">
                            大地点
                            <div className="mt-1 text-gray-200">{env?.大地点 || '未知'}</div>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-black/30 px-3 py-2">
                            中地点
                            <div className="mt-1 text-gray-200">{env?.中地点 || '未知'}</div>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-black/30 px-3 py-2">
                            小地点
                            <div className="mt-1 text-gray-200">{env?.小地点 || '未知'}</div>
                        </div>
                    </div>

                    {activeTab === 'atlas' && (
                        <>
                            {当前地图 ? (
                                <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-lg text-wuxia-gold font-serif font-bold">{当前地图.名称 || '未具名之地'}</div>
                                            <div className="text-[10px] text-gray-500 mt-1">坐标 {当前地图.坐标 || '暂不可考'}</div>
                                        </div>
                                        <div className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-wuxia-gold/30 bg-wuxia-gold/10 text-wuxia-gold">
                                            图内建筑 {当前地图内部建筑名.length}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                                        <div className="text-[10px] text-gray-500 tracking-[0.25em] mb-2">归属地界</div>
                                        <div className="flex flex-wrap gap-2 text-[11px] text-gray-200">
                                            <span className="px-2 py-1 rounded border border-gray-700 bg-black/30">{当前地图?.归属?.大地点 || '无'}</span>
                                            <span className="px-2 py-1 rounded border border-gray-700 bg-black/30">{当前地图?.归属?.中地点 || '无'}</span>
                                            <span className="px-2 py-1 rounded border border-gray-700 bg-black/30">{当前地图?.归属?.小地点 || '无'}</span>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-wuxia-gold/20 bg-wuxia-gold/5 p-3">
                                        <div className="text-[10px] text-wuxia-gold/70 tracking-[0.25em] mb-2">风物志</div>
                                        <div className="text-[11px] text-gray-200 leading-relaxed font-serif">{当前地图.描述 || '这片区域尚无风物记载。'}</div>
                                    </div>

                                    <div className="rounded-xl border border-cyan-900/30 bg-cyan-950/15 p-3">
                                        <div className="text-[10px] text-cyan-300/80 tracking-[0.25em] mb-2">图内声明建筑</div>
                                        {当前地图内部建筑名.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {当前地图内部建筑名.map((name, idx) => (
                                                    <span key={`${name}-${idx}`} className="px-2 py-1 rounded-full border border-cyan-800/40 bg-black/30 text-[10px] text-cyan-100">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-500">暂无内部建筑声明</div>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                                        <div className="text-[10px] text-gray-500 tracking-[0.25em] mb-2">已建档匹配建筑</div>
                                        {当前地图建筑列表.length > 0 ? (
                                            <div className="space-y-2">
                                                {当前地图建筑列表.map((building: any, idx: number) => (
                                                    <div key={`${building?.名称 || idx}`} className="rounded-lg border border-gray-800 bg-black/20 px-3 py-2">
                                                        <div className="text-[11px] text-gray-200">{building?.名称 || `建筑 ${idx + 1}`}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">{building?.描述 || '暂无描述'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-500">暂无匹配建筑档案</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black/40 border border-gray-800 rounded-xl px-4 py-10 text-center text-gray-600 text-sm">
                                    暂无地图数据
                                </div>
                            )}

                            <div className="bg-black/40 border border-gray-800 rounded-xl p-3 space-y-2">
                                <div className="text-[10px] text-gray-500 tracking-[0.3em] px-1">地图列表</div>
                                {maps.length > 0 ? (
                                    maps.map((item: any, idx: number) => {
                                        const selected = idx === selectedMapIndex;
                                        return (
                                            <button
                                                key={`${item?.名称 || idx}`}
                                                onClick={() => setSelectedMapIndex(idx)}
                                                className={`w-full text-left p-3 border rounded-lg transition-all ${
                                                    selected ? 'border-wuxia-gold/50 bg-wuxia-gold/5' : 'border-gray-800 bg-white/[0.02] hover:bg-white/[0.05]'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className={`text-sm font-serif font-bold truncate ${selected ? 'text-wuxia-gold' : 'text-gray-200'}`}>
                                                            {item?.名称 || `地界 ${idx + 1}`}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-1 truncate">
                                                            {item?.坐标 || '未知坐标'} · {(Array.isArray(item?.内部建筑) ? item.内部建筑.length : 0)} 建筑
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border border-gray-800 bg-black/30 text-gray-400">
                                                        {item?.归属?.小地点 || '未归属'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-gray-600 text-xs py-8">暂无地图</div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'buildings' && (
                        <div className="bg-black/40 border border-gray-800 rounded-xl p-3 space-y-3">
                            <div className="text-[10px] text-gray-500 tracking-[0.3em] px-1">当前地点命中建筑</div>
                            {命中建筑列表.length > 0 ? (
                                命中建筑列表.map((building: any, idx: number) => (
                                    <div key={`${building?.名称 || idx}`} className="rounded-xl border border-wuxia-gold/20 bg-wuxia-gold/5 p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-sm text-wuxia-gold font-serif font-bold">{building?.名称 || `建筑 ${idx + 1}`}</div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-wuxia-gold/30 bg-black/20 text-wuxia-gold">
                                                已命中
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-gray-300 leading-relaxed mt-2">{building?.描述 || '暂无描述'}</div>
                                        <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-gray-400">
                                            <span className="px-2 py-1 rounded border border-gray-800 bg-black/20">{building?.归属?.大地点 || '?'}</span>
                                            <span className="px-2 py-1 rounded border border-gray-800 bg-black/20">{building?.归属?.中地点 || '?'}</span>
                                            <span className="px-2 py-1 rounded border border-gray-800 bg-black/20">{building?.归属?.小地点 || '?'}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-600 text-xs py-10">
                                    当前具体地点未命中任何建筑档案
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'npc_debug' && (
                        <div className="bg-black/40 border border-sky-500/25 rounded-xl p-3 space-y-3">
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1"><div className="text-gray-500">候选</div><div className="text-gray-100">{npcDebugRows.candidates.length}</div></div>
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1"><div className="text-gray-500">命中</div><div className="text-sky-200">{npcDebugRows.matched.length}</div></div>
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1"><div className="text-gray-500">在场</div><div className="text-emerald-200">{npcDebugRows.explicitPresent.length}</div></div>
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1"><div className="text-gray-500">最终</div><div className="text-wuxia-gold">{npcDebugRows.finalVisible.length}</div></div>
                            </div>
                            <div className="text-[11px] text-sky-100/55 px-1">用于排查 NPC 为什么没有出现在当前地图或场景。</div>
                            {npcDebugRows.candidates.length > 0 ? (
                                npcDebugRows.candidates.map((npc) => (
                                    <div key={npc.id} className={`rounded-lg border p-3 text-xs ${npc.finalVisible ? 'border-emerald-500/25 bg-emerald-950/10' : 'border-white/10 bg-black/25'}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-gray-100">{npc.姓名}</span>
                                            <span className={npc.finalVisible ? 'text-emerald-300' : 'text-gray-500'}>{npc.finalVisible ? '会显示' : '未命中'}</span>
                                        </div>
                                        <div className="mt-1 text-gray-500">身份：{npc.身份}</div>
                                        <div className="mt-1 text-gray-500">位置：{npc.rawLocationText || '未写入位置字段'}</div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {npc.explicitPresent && <span className="rounded border border-emerald-400/30 bg-emerald-950/30 px-1.5 py-0.5 text-emerald-200">是否在场</span>}
                                            {npc.hitKeys.map((key) => <span key={key} className="rounded border border-sky-400/30 bg-sky-950/30 px-1.5 py-0.5 text-sky-200">命中 {key}</span>)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-600 text-xs py-10">暂无 NPC 候选数据</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileMapModal;
