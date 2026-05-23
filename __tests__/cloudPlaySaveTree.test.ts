import { describe, expect, it } from 'vitest';

import { 构建对象存储云存档时间树, 展开对象存储进度线 } from '../utils/cloudPlaySaveTree';

const makeItem = (patch: Partial<any>): any => ({
    id: patch.id || `${patch.hash}.json`,
    fileName: patch.fileName || `${patch.hash}.json`,
    title: '杨培强',
    type: 'auto',
    saveTimestamp: patch.saveTimestamp || 1779520000000,
    savedAt: new Date(patch.saveTimestamp || 1779520000000).toISOString(),
    syncedAt: patch.syncedAt || new Date((patch.saveTimestamp || 1779520000000) + 1000).toISOString(),
    deviceType: 'phone',
    deviceLabel: '手机',
    appVersion: '1.0.test',
    versionCode: 999,
    hash: patch.hash,
    parentHash: patch.parentHash,
    rootHash: patch.rootHash,
    seriesId: patch.seriesId,
    size: 1234,
    location: patch.location || '培强院正房',
    gameTime: patch.gameTime || '1:01:01:22:30',
    turnCount: patch.turnCount || 0,
    syncKey: patch.syncKey || `auto|${patch.saveTimestamp || 1779520000000}|杨培强`,
    ...patch
});

const flattenChildren = (items: ReturnType<typeof 展开对象存储进度线>) => (
    items.map((item) => ({ hash: item.hash, turn: item.turnCount, time: item.gameTime, children: item.children.length }))
);

describe('对象存储云端游玩进度线', () => {
    it('按谱系根区分同名角色，并把同谱系重复自动节点整理成单线', () => {
        const trees = 构建对象存储云存档时间树([
            makeItem({ hash: 'root-old', rootHash: 'root-a', seriesId: 'series-a', turnCount: 6, gameTime: '1:01:01:22:30', saveTimestamp: 1779520000000 }),
            makeItem({ hash: 'root-new', rootHash: 'root-a', seriesId: 'series-a', turnCount: 6, gameTime: '1:01:01:22:30', saveTimestamp: 1779520100000 }),
            makeItem({ hash: 'turn7-old', rootHash: 'root-a', parentHash: 'root-old', seriesId: 'series-a', turnCount: 7, gameTime: '1:01:01:23:00', saveTimestamp: 1779520200000 }),
            makeItem({ hash: 'turn7-new', rootHash: 'root-a', parentHash: 'root-old', seriesId: 'series-a', turnCount: 7, gameTime: '1:01:01:23:00', saveTimestamp: 1779520300000 }),
            makeItem({ hash: 'turn8', rootHash: 'root-a', parentHash: 'turn7-old', seriesId: 'series-a', turnCount: 8, gameTime: '1:01:01:23:10', saveTimestamp: 1779520400000 }),
            makeItem({ hash: 'other-root', rootHash: 'root-b', seriesId: 'series-b', turnCount: 1, gameTime: '1:01:01:08:30', saveTimestamp: 1779520500000 })
        ]);

        expect(trees).toHaveLength(2);
        const main = trees.find((tree) => tree.latest.rootHash === 'root-a')!;
        expect(main.count).toBe(5);
        expect(main.displayCount).toBe(3);
        expect(main.collapsedCount).toBe(2);
        expect(main.roots).toHaveLength(1);
        expect(main.latest.hash).toBe('turn8');

        const timeline = 展开对象存储进度线(main.roots);
        expect(timeline.map((item) => item.hash)).toEqual(['root-new', 'turn7-new', 'turn8']);
        expect(flattenChildren(timeline).slice(0, -1).every((item) => item.children === 1)).toBe(true);
        expect(flattenChildren(timeline).at(-1)?.children).toBe(0);
    });

    it('旧云端元数据缺根哈希时，用首回合片段区分同名开局', () => {
        const trees = 构建对象存储云存档时间树([
            makeItem({ hash: 'a1', seriesId: '', rootHash: '', openingSnippet: '晨雾压着青石小巷', turnCount: 1, saveTimestamp: 1779520000000 }),
            makeItem({ hash: 'a2', seriesId: '', rootHash: '', openingSnippet: '晨雾压着青石小巷', turnCount: 2, saveTimestamp: 1779520100000 }),
            makeItem({ hash: 'b1', seriesId: '', rootHash: '', openingSnippet: '大雪封住山门前路', turnCount: 1, saveTimestamp: 1779520200000 })
        ]);

        expect(trees).toHaveLength(2);
        expect(trees.map((tree) => tree.count).sort()).toEqual([1, 2]);
    });

    it('读取最新只在同一谱系内按回合和游戏时间选择最远进度', () => {
        const trees = 构建对象存储云存档时间树([
            makeItem({
                hash: 'turn14-late-upload',
                rootHash: 'root-a',
                seriesId: 'series-a',
                turnCount: 14,
                gameTime: '1:01:02:00:50',
                saveTimestamp: 1779523000000,
                syncedAt: '2026-05-23T07:55:00.000Z'
            }),
            makeItem({
                hash: 'turn15-earlier-upload',
                rootHash: 'root-a',
                seriesId: 'series-a',
                turnCount: 15,
                gameTime: '1:01:02:07:30',
                saveTimestamp: 1779522000000,
                syncedAt: '2026-05-23T07:50:00.000Z'
            })
        ]);

        expect(trees).toHaveLength(1);
        expect(trees[0].latest.hash).toBe('turn15-earlier-upload');
    });
});
