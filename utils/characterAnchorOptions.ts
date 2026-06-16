export const 主角角色锚点绑定ID = '__player__';

type 角色锚点绑定NPC = {
    id?: unknown;
    姓名?: unknown;
};

type 角色锚点绑定记录 = {
    npcId?: unknown;
    名称?: unknown;
};

export type 角色锚点绑定选项 = {
    id: string;
    label: string;
    是否失效: boolean;
    是否主控角色: boolean;
};

const 取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const 构建角色锚点绑定选项 = (params: {
    npcList?: 角色锚点绑定NPC[];
    anchors?: 角色锚点绑定记录[];
    playerName?: unknown;
}): 角色锚点绑定选项[] => {
    const optionMap = new Map<string, 角色锚点绑定选项>();
    const anchors = Array.isArray(params.anchors) ? params.anchors : [];
    const playerName = 取文本(params.playerName) || '主角';
    const hasPlayerAnchor = anchors.some((anchor) => 取文本(anchor?.npcId) === 主角角色锚点绑定ID);
    const hasPlayerCharacter = Boolean(取文本(params.playerName));

    if (hasPlayerCharacter || hasPlayerAnchor) {
        optionMap.set(主角角色锚点绑定ID, {
            id: 主角角色锚点绑定ID,
            label: `${playerName} · 主控角色`,
            是否失效: false,
            是否主控角色: true
        });
    }

    (Array.isArray(params.npcList) ? params.npcList : []).forEach((npc) => {
        const npcId = 取文本(npc?.id);
        if (!npcId) return;
        optionMap.set(npcId, {
            id: npcId,
            label: 取文本(npc?.姓名) || npcId,
            是否失效: false,
            是否主控角色: false
        });
    });

    anchors.forEach((anchor) => {
        const npcId = 取文本(anchor?.npcId);
        if (!npcId || optionMap.has(npcId)) return;
        const fallbackName = 取文本(anchor?.名称) || npcId;
        optionMap.set(npcId, {
            id: npcId,
            label: `${fallbackName} · 已失效`,
            是否失效: true,
            是否主控角色: false
        });
    });

    return Array.from(optionMap.values());
};
