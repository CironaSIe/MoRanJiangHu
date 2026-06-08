import React from 'react';
import type { 开局生成性别类型 } from '../../../types';
import { 开局生成性别选项, 规范化开局生成性别列表 } from '../../../utils/openingConfig';

interface Props {
    value: 开局生成性别类型[];
    locked?: boolean;
    onChange: (value: 开局生成性别类型[]) => void;
    compact?: boolean;
}

const GeneratedGenderSelector: React.FC<Props> = ({ value, locked = false, onChange, compact = false }) => {
    const normalized = 规范化开局生成性别列表(value);
    const allSelected = normalized.length === 开局生成性别选项.length;
    const selectedSet = new Set(normalized);
    const buttonBase = compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

    const apply = (next: 开局生成性别类型[]) => {
        if (locked) return;
        onChange(规范化开局生成性别列表(next));
    };

    const toggle = (gender: 开局生成性别类型) => {
        if (selectedSet.has(gender)) {
            if (normalized.length <= 1) return;
            apply(normalized.filter((item) => item !== gender));
            return;
        }
        apply([...normalized, gender]);
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={locked}
                    onClick={() => apply(开局生成性别选项.map((item) => item.value))}
                    className={`rounded-full border ${buttonBase} transition-all ${
                        allSelected
                            ? 'border-wuxia-gold bg-wuxia-gold/15 text-wuxia-gold'
                            : 'border-gray-700 bg-black/30 text-gray-300 hover:border-wuxia-gold/40'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    全选性别
                </button>
                {开局生成性别选项.map((item) => {
                    const active = selectedSet.has(item.value);
                    return (
                        <button
                            key={item.value}
                            type="button"
                            disabled={locked}
                            onClick={() => toggle(item.value)}
                            className={`rounded-full border ${buttonBase} transition-all ${
                                active
                                    ? 'border-wuxia-cyan bg-wuxia-cyan/10 text-wuxia-cyan'
                                    : 'border-gray-700 bg-black/30 text-gray-300 hover:border-wuxia-cyan/40'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
            <div className="text-[11px] leading-5 text-gray-500">
                {locked
                    ? `该模式包已锁定：只允许 AI 生成 ${normalized.join('、')} 性别的新角色。`
                    : `AI 新生成的 NPC、开局伙伴、组织成员和路人只能从 ${normalized.join('、')} 中选择；主角性别仍以玩家设置为准。`}
            </div>
        </div>
    );
};

export default GeneratedGenderSelector;
