import type { OpeningConfig } from '../../types';
import { 构建修炼体系附加块 } from '../../utils/promptFeatureToggles';

export const 是否仙侠开局模式 = (openingConfig?: OpeningConfig | null): boolean => (
    openingConfig?.题材模式 === '仙侠'
);

export const 构建题材模式提示词 = (openingConfig?: OpeningConfig | null): string => {
    const mode = openingConfig?.题材模式 === '仙侠' ? '仙侠' : '武侠';
    if (mode === '仙侠') {
        return [
            '【题材模式：仙侠】',
            '- 本存档以仙侠/修真为核心题材，后续世界观、开场、变量、规划、世界演变与战斗判定都必须承接仙侠口径。',
            '- 能力边界允许灵气、灵根、灵力、神识、法宝、术法、神通、阵法、符箓、丹药、灵材、秘境、宗门修真与天劫/心魔/因果代价。',
            '- 仙侠不是福利模式：高阶功法、法宝、灵材、秘境收益和跨境胜利都必须有稀缺度、门槛、代价、风险或势力后果。',
            '- 主角与重要 NPC 应维护修仙字段：灵根、灵根资质、当前灵力/最大灵力、当前神识/最大神识、丹田状态、道基状态、心魔值、功德、业力。',
            '- 仙侠模式仍沿用现有变量树、境界层级、品质枚举和战斗结算口径；不要另造根路径或第二套不可落地字段。'
        ].join('\n');
    }
    return [
        '【题材模式：武侠】',
        '- 本存档以武侠/江湖为核心题材，能力边界收束在门派、内力、武学、身法、器械、医毒、机关、江湖势力与凡俗社会秩序内。',
        '- 不把世界写成仙侠常态法术轰击、常态御空飞行、飞升位面或高频法宝斗法；若有玄异，也应保持稀少、暧昧、代价明确。'
    ].join('\n');
};

export const 构建开局配置提示词 = (openingConfig?: OpeningConfig | null): string => {
    if (!openingConfig) return '';
    const 关系侧重 = Array.isArray(openingConfig.关系侧重) && openingConfig.关系侧重.length > 0
        ? openingConfig.关系侧重.join('、')
        : '无';
    return [
        '【本次开局配置约束】',
        构建题材模式提示词(openingConfig),
        `- 关系侧重：${关系侧重}。生成初始社交网时，应优先让人物结构与关系情绪落在这些方向上。`,
        `- 开局切入偏好：${openingConfig.开局切入偏好}。第一幕镜头与气氛优先贴近该切入方式，不要无痕偏离。`,
        '- 若开局偏好与建档、世界观存在冲突，以建档硬约束和 world_prompt 为上位，但仍应尽量保留关系侧重与切入偏好的方向。'
    ].join('\n');
};

export const 构建世界观同人融合提示词 = (openingConfig?: OpeningConfig | null): string => {
    const fandom = openingConfig?.同人融合;
    const title = typeof fandom?.作品名 === 'string' ? fandom.作品名.trim() : '';
    if (!fandom?.enabled || !title) return '';
    const rolePolicy = fandom.保留原著角色
        ? `允许原著角色、原著势力或其直接变体进入世界母本，但仍要保证本项目${是否仙侠开局模式(openingConfig) ? '仙侠修真' : '武侠'}成长体系与长期叙事可运行。`
        : '只吸收原著世界观母题、气质、势力逻辑、地理审美或价值冲突，不直接保留原著角色实体。';
    return [
        '【同人融合世界观要求】',
        `- 参考来源：${title}（${fandom.来源类型}）。`,
        `- 融合强度：${fandom.融合强度}。`,
        `- 角色保留策略：${rolePolicy}`,
        '- 此要求只作用于 world_prompt 生成，不要在世界观阶段写成粉丝设定清单、角色介绍或剧情提纲。',
        '- 融合后的结果仍必须是当前存档可长期运行的原创世界母本，并兼容本项目既有成长口径。',
        构建修炼体系附加块('- 若启用修炼体系，结果还必须兼容本项目既有境界口径。')
    ].join('\n');
};
