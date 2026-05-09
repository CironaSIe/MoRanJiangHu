import React from 'react';
import { 世界数据结构 } from '../../../models/world';
import { 环境信息结构 } from '../../../models/environment';
import GridMapScene from './GridMapScene';

interface Props {
    world: 世界数据结构;
    env: 环境信息结构;
    socialList?: any[];
    debugEnabled?: boolean;
    onClose: () => void;
}

const MobileMapModal: React.FC<Props> = ({ world, env, socialList = [], debugEnabled = false, onClose }) => (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/95 p-2 backdrop-blur-sm md:hidden animate-fadeIn">
        <div className="relative flex h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-wuxia-gold/20 bg-[#0b0907]/95 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-wuxia-gold/10 bg-black/70 px-4">
                <div className="min-w-0">
                    <div className="truncate font-serif text-lg font-bold tracking-[0.22em] text-wuxia-gold">江湖网格图</div>
                    <div className="truncate text-[10px] tracking-[0.16em] text-[#bba77b]">{env?.具体地点 || env?.小地点 || '未知之境'}</div>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 bg-black/50 text-gray-300 transition-all hover:border-wuxia-red hover:text-wuxia-red"
                    aria-label="关闭地图"
                >
                    ×
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
                <GridMapScene
                    world={world}
                    env={env}
                    socialList={socialList}
                    debugEnabled={debugEnabled}
                    compact
                />
            </div>
        </div>
    </div>
);

export default MobileMapModal;
