import { describe, expect, it } from 'vitest';
import { 构建角色锚点绑定选项, 主角角色锚点绑定ID } from '../utils/characterAnchorOptions';

describe('构建角色锚点绑定选项', () => {
    it('不会把主控角色锚点标成已失效', () => {
        const options = 构建角色锚点绑定选项({
            npcList: [],
            anchors: [{
                id: 'anchor-player',
                npcId: 主角角色锚点绑定ID,
                名称: '主角角色锚点'
            }],
            playerName: '沈墨'
        });

        expect(options).toEqual([{
            id: 主角角色锚点绑定ID,
            label: '沈墨 · 主控角色',
            是否失效: false,
            是否主控角色: true
        }]);
    });

    it('普通 NPC 锚点找不到角色时仍标成已失效', () => {
        const options = 构建角色锚点绑定选项({
            npcList: [],
            anchors: [{
                id: 'anchor-old',
                npcId: 'npc-old',
                名称: '旧友锚点'
            }]
        });

        expect(options).toEqual([{
            id: 'npc-old',
            label: '旧友锚点 · 已失效',
            是否失效: true,
            是否主控角色: false
        }]);
    });
});
