import type { WorldGenConfig, 题材模式类型 } from '../models/system';
import {
    题材模式配置表,
    题材模式顺序,
    type 题材模式配置,
    type 题材模式分组
} from '../data/workshopThemes/topicModeThemeData';

export { 题材模式配置表, 题材模式顺序 };
export type { 题材模式配置, 题材模式分组 };

export const 规范化题材模式 = (mode?: unknown): 题材模式类型 => (
    mode === '灵气修仙'
        ? '灵气复苏'
        : mode === '末世丧尸'
            ? '末日丧尸'
            : typeof mode === 'string' && Object.prototype.hasOwnProperty.call(题材模式配置表, mode)
                ? mode as 题材模式类型
                : '武侠'
);

export const 获取题材模式配置 = (mode?: unknown): 题材模式配置 => (
    题材模式配置表[规范化题材模式(mode)]
);

export const 题材是否仙侠 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'xianxia' || group === 'urban_xianxia';
};

export const 题材是否现代 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'urban_xianxia' || group === 'modern' || group === 'apocalypse';
};

export const 获取题材模式选项 = () => (
    题材模式顺序.map((value) => {
        const profile = 题材模式配置表[value];
        return { value, label: profile.label, hint: profile.hint };
    })
);

export const 合并题材世界默认值 = (
    mode: 题材模式类型,
    previous?: Partial<WorldGenConfig>
): Partial<WorldGenConfig> => ({
    ...previous,
    ...获取题材模式配置(mode).worldDefaults,
    manualWorldPrompt: previous?.manualWorldPrompt || '',
    manualRealmPrompt: previous?.manualRealmPrompt || '',
    difficulty: previous?.difficulty || 'normal'
});
