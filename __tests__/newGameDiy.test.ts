import { describe, expect, it } from 'vitest';
import {
    buildWorldMapLayersFromDraft,
    buildWorldMapPromptFromDraft,
    normalizeWorldMapDraft,
    世界地图DIY层级选项,
} from '../utils/newGameDiy';
import type { WorldMapDiyDraft } from '../types';

describe('new game DIY map draft', () => {
    it('normalizes legacy form-only drafts', () => {
        const draft = normalizeWorldMapDraft({
            nodes: [
                {
                    id: 'DT-ROOT',
                    name: '诸天万界',
                    layer: '寰宇',
                    parentId: '',
                    description: '根节点',
                },
                {
                    id: 'DT-CONTINENT',
                    name: '青州',
                    layer: '中地点',
                    parentId: 'DT-ROOT',
                    description: '旧表单节点',
                },
            ],
            referenceOpacity: 0.8,
        });

        expect(draft.nodes).toHaveLength(2);
        expect(draft.features).toEqual([]);
        expect(draft.nodes[1].geometry?.type).toBe('polygon');
        expect(draft.canvas?.width).toBeGreaterThan(0);
        expect(draft.referenceTransform?.locked).toBe(true);
    });

    it('keeps customer layer labels mapped to the existing six-layer system', () => {
        const labels = 世界地图DIY层级选项.map((item) => item.label);

        expect(labels).toContain('星球/世界');
        expect(labels).toContain('大陆/板块');
        expect(labels).toContain('国家/区域');
        expect(世界地图DIY层级选项.map((item) => item.value)).toEqual([
            '寰宇',
            '大地点',
            '中地点',
            '小地点',
            '区地点',
            '子地点',
        ]);
    });

    it('converts only region and point nodes into formal map layers', () => {
        const draft: WorldMapDiyDraft = {
            enabled: true,
            nodes: [
                {
                    id: 'ROOT',
                    name: '诸天万界',
                    layer: '寰宇',
                    parentId: '',
                    description: '根',
                    geometry: { type: 'point', points: [{ x: 10, y: 10 }] },
                },
                {
                    id: 'CITY',
                    name: '青石城',
                    layer: '区地点',
                    parentId: 'ROOT',
                    description: '边城',
                    geometry: { type: 'point', points: [{ x: 160, y: 220 }] },
                },
            ],
            features: [
                {
                    id: 'ROAD-1',
                    type: 'road',
                    name: '青石官道',
                    parentId: 'CITY',
                    connectedNodeIds: ['CITY'],
                    points: [{ x: 20, y: 20 }, { x: 180, y: 220 }],
                    description: '商队常走的官道',
                    fields: { 旅行速度: '较快', 当前状态: '畅通' },
                },
                {
                    id: 'RIVER-1',
                    type: 'river',
                    name: '青水',
                    parentId: 'CITY',
                    points: [{ x: 40, y: 40 }, { x: 260, y: 260 }],
                },
            ],
        };

        const layers = buildWorldMapLayersFromDraft(draft);

        expect(layers).toHaveLength(2);
        expect(layers.map((layer) => layer.ID)).toEqual(['ROOT', 'CITY']);
        expect(layers.some((layer) => layer.ID === 'ROAD-1' || layer.ID === 'RIVER-1')).toBe(false);
        expect(layers[1].描述).toContain('青石官道');
        expect(layers[1].描述).toContain('青水');
    });

    it('does not emit formal map layers while DIY map is disabled', () => {
        const layers = buildWorldMapLayersFromDraft({
            enabled: false,
            nodes: [
                {
                    id: 'ROOT',
                    name: '诸天万界',
                    layer: '寰宇',
                    parentId: '',
                    description: '',
                },
            ],
        });

        expect(layers).toEqual([]);
    });

    it('serializes path features into the prompt for AI world generation', () => {
        const prompt = buildWorldMapPromptFromDraft({
            enabled: true,
            nodes: [
                {
                    id: 'ROOT',
                    name: '诸天万界',
                    layer: '寰宇',
                    parentId: '',
                    description: '根',
                },
            ],
            features: [
                {
                    id: 'MOUNTAIN',
                    type: 'mountain',
                    name: '断龙岭',
                    points: [{ x: 100, y: 100 }, { x: 300, y: 180 }],
                    fields: { 危险等级: '高', 交通阻断程度: '难以翻越' },
                },
            ],
        });

        expect(prompt).toContain('连接型地理要素');
        expect(prompt).toContain('断龙岭');
        expect(prompt).toContain('危险等级:高');
    });

    it('keeps narrative cores on DIY nodes and formal map layers', () => {
        const draft: WorldMapDiyDraft = {
            enabled: true,
            nodes: [
                {
                    id: 'ROOT',
                    name: '诸天万界',
                    layer: '寰宇',
                    parentId: '',
                    description: '根',
                    narrativeCore: '邪神苏醒倒计时四百天',
                },
                {
                    id: 'PLAIN',
                    name: '北原',
                    layer: '中地点',
                    parentId: 'ROOT',
                    description: '草原板块',
                    scaleFields: { narrativeCore: '寒潮驱使牧民南下，边境战争与难民潮正在酝酿' },
                },
            ],
        };

        const normalized = normalizeWorldMapDraft(draft);
        const prompt = buildWorldMapPromptFromDraft(normalized);
        const layers = buildWorldMapLayersFromDraft(normalized);

        expect(normalized.nodes[0].narrativeCore).toBe('邪神苏醒倒计时四百天');
        expect(prompt).toContain('舞台/叙事核心：邪神苏醒倒计时四百天');
        expect(layers[1].叙事核心).toBe('寒潮驱使牧民南下，边境战争与难民潮正在酝酿');
        expect(layers[1].描述).toContain('舞台/叙事核心');
    });
});
