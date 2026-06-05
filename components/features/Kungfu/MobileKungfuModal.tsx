import React, { useEffect, useMemo, useState } from 'react';
import { 功法结构 } from '../../../models/kungfu';
import { getRarityNameClass, getRarityStyles } from '../../ui/rarityStyles';
import { 获取题材界面文案 } from '../../../utils/resourceLabels';
import type { 题材模式类型 } from '../../../models/system';

interface Props {
    skills: 功法结构[];
    onClose: () => void;
    topicMode?: string;
}

const 获取移动功法文案 = (topicMode?: string) => {
    const labels = 获取题材界面文案(topicMode as 题材模式类型 | undefined).标题;
    return {
        title: labels.能力,
        learned: `已掌握${labels.能力}`,
        empty: labels.能力空状态,
        choose: labels.能力详情提示标题,
        unit: labels.能力等级单位,
        params: labels.能力参数标题,
        baseValue: labels.能力基础数值,
        energyFactor: labels.能力能量系数,
        castTime: labels.能力施展耗时,
        cooldown: labels.能力冷却时间,
        cost: labels.能力消耗,
        target: labels.能力范围,
        progress: labels.能力熟练标题,
        breakthrough: labels.能力提升条件,
        limit: labels.能力门槛,
        direction: labels.能力大成方向,
        maxed: labels.能力圆满,
        effects: labels.能力附带效果
    };
};

const MobileKungfuModal: React.FC<Props> = ({ skills, onClose, topicMode }) => {
    const 文案 = 获取移动功法文案(topicMode);
    const safeSkills = Array.isArray(skills) ? skills : [];
    const [selectedId, setSelectedId] = useState<string | null>(safeSkills.length > 0 ? safeSkills[0].ID : null);

    useEffect(() => {
        if (!selectedId || !safeSkills.some((s) => s.ID === selectedId)) {
            setSelectedId(safeSkills.length > 0 ? safeSkills[0].ID : null);
        }
    }, [selectedId, safeSkills]);

    const current = useMemo(
        () => safeSkills.find((s) => s.ID === selectedId) || null,
        [safeSkills, selectedId]
    );
    const effects = Array.isArray(current?.附带效果) ? current.附带效果 : [];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 md:hidden animate-fadeIn">
            <div className="bg-ink-black/95 border border-wuxia-gold/30 w-full max-w-[560px] h-[84vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-2xl">
                <div className="h-12 shrink-0 border-b border-gray-800/60 bg-black/40 flex items-center justify-between px-4">
                    <h3 className="text-wuxia-gold font-serif font-bold text-base tracking-[0.3em]">{文案.title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-gray-700 text-gray-400 hover:text-wuxia-red hover:border-wuxia-red transition-all"
                        title="关闭"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-ink-wash/5">
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 tracking-[0.2em] mb-2">{文案.learned}</div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {safeSkills.map((s) => {
                                const selected = s.ID === selectedId;
                                return (
                                    <button
                                        key={s.ID}
                                        onClick={() => setSelectedId(s.ID)}
                                        className={`min-w-[130px] p-2 border rounded-lg text-left ${
                                            selected ? 'border-wuxia-gold/60 bg-wuxia-gold/5' : 'border-gray-800 bg-black/30'
                                        }`}
                                    >
                                        <div className={`text-sm font-serif ${getRarityNameClass(s.品质)} ${selected ? 'font-bold' : ''}`}>{s.名称}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                            <span>{s.类型} · 第{s.当前重数}{文案.unit}</span>
                                            <span className={`${getRarityStyles(s.品质).text} ${getRarityStyles(s.品质).glow}`}>{s.品质}</span>
                                        </div>
                                    </button>
                                );
                            })}
                            {safeSkills.length === 0 && <div className="text-xs text-gray-600 py-6 w-full text-center">{文案.empty}</div>}
                        </div>
                    </div>

                    {current ? (
                        <>
                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className={`text-xl font-serif font-bold ${getRarityNameClass(current.品质)}`}>{current.名称}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">{current.来源}</div>
                                    </div>
                                    <div className="text-right text-[10px] text-gray-400">
                                        <div className={`inline-block px-1.5 py-0.5 rounded border ${getRarityStyles(current.品质).badge}`}>{current.品质}</div>
                                        <div className="mt-1">{current.类型}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-300 mt-3 leading-relaxed">{current.描述}</p>
                            </div>

                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-2">
                                <div className="text-[10px] text-gray-500 tracking-[0.2em]">{文案.params}</div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.baseValue}: {current.基础伤害}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.energyFactor}: x{current.内力系数}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.castTime}: {current.施展耗时}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.cooldown}: {current.冷却时间}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.cost}: {current.消耗数值}{current.消耗类型}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.target}: {current.目标类型}({current.最大目标数})</div>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                    <span>{文案.progress}</span>
                                    <span className="font-mono text-gray-300">{current.当前熟练度}/{current.升级经验}</span>
                                </div>
                                <div className="h-2 bg-gray-900 border border-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-wuxia-gold"
                                        style={{ width: `${Math.min((current.当前熟练度 / Math.max(current.升级经验, 1)) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2 mt-3 text-[11px]">
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.breakthrough}: {current.突破条件 || '无'}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.limit}: {current.境界限制 || '无'}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.direction}: {current.大成方向 || '暂无'}</div>
                                    <div className="border border-gray-800 rounded p-2 text-gray-300">{文案.maxed}: {current.圆满效果 || '暂无'}</div>
                                </div>
                            </div>

                            {effects.length > 0 && (
                                <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                    <div className="text-[10px] text-gray-500 tracking-[0.2em] mb-2">{文案.effects}</div>
                                    <div className="space-y-2">
                                        {effects.map((e, i) => (
                                            <div key={i} className="border border-gray-800 rounded p-2 text-[11px]">
                                                <div className="text-wuxia-cyan font-bold">{e.名称}</div>
                                                <div className="text-gray-400 mt-1">触发 {e.触发概率} · 持续 {e.持续时间}</div>
                                                <div className="text-gray-500 mt-1">间隔 {e.生效间隔} · 参数 {e.数值参数}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-gray-600 text-xs py-10">{文案.choose}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileKungfuModal;
