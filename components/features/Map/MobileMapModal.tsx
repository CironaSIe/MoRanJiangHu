import React from 'react';
import { 世界数据结构 } from '../../../models/world';
import { 环境信息结构 } from '../../../models/environment';
import type { 题材界面文案 } from '../../../utils/resourceLabels';
import LocationBrowser from './LocationBrowser';

interface Props {
    world: 世界数据结构;
    env: 环境信息结构;
    socialList?: any[];
    playerName?: string;
    debugEnabled?: boolean;
    onClose: () => void;
    onOpenPerson?: (person: any) => void;
    onRegenerateMap?: () => Promise<boolean>;
    onInsertCommand?: (text: string) => void;
    rawResponse?: string;
    uiLabels?: 题材界面文案;
}

const MobileMapModal: React.FC<Props> = ({ world, env, onClose, onRegenerateMap, onInsertCommand, rawResponse, socialList, playerName, uiLabels }) => (
    <div className="fixed inset-0 z-[220] flex items-stretch justify-center bg-black/95 p-0 backdrop-blur-sm md:hidden animate-fadeIn">
        <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden border border-wuxia-gold/20 bg-[#0b0907]/95 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-wuxia-gold/10 bg-black/70 px-3">
                <div className="min-w-0">
                    <div className="truncate font-serif text-lg font-bold tracking-[0.22em] text-wuxia-gold">{uiLabels?.标题?.地图 || '江湖舆图'}</div>
                    <div className="truncate text-[10px] tracking-[0.16em] text-[#bba77b]">{env?.具体地点 || env?.小地点 || uiLabels?.标题?.地图未知地点 || '未知之境'}</div>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 bg-black/50 text-gray-300 transition-all hover:border-wuxia-red hover:text-wuxia-red"
                    aria-label="关闭地图"
                >
                    ×
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <LocationBrowser
                    world={world}
                    env={env}
                    onRegenerateMap={onRegenerateMap}
                    onInsertCommand={onInsertCommand}
                    rawResponse={rawResponse}
                    socialList={socialList}
                    playerName={playerName}
                    compact
                />
            </div>
        </div>
    </div>
);

export default MobileMapModal;
