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
    it('按角色合并断开的新谱系，并把重复自动节点整理成单线', () => {
        const trees = 构建对象存储云存档时间树([
            makeItem({ hash: 'root-old', seriesId: 'series-a', turnCount: 6, gameTime: '1:01:01:22:30', saveTimestamp: 1779520000000 }),
            makeItem({ hash: 'root-new', seriesId: 'series-a', turnCount: 6, gameTime: '1:01:01:22:30', saveTimestamp: 1779520100000 }),
            makeItem({ hash: 'turn7-old', parentHash: 'root-old', seriesId: 'series-a', turnCount: 7, gameTime: '1:01:01:23:00', saveTimestamp: 1779520200000 }),
            makeItem({ hash: 'turn7-new', parentHash: 'root-old', seriesId: 'series-a', turnCount: 7, gameTime: '1:01:01:23:00', saveTimestamp: 1779520300000 }),
            makeItem({ hash: 'turn8', parentHash: 'turn7-old', seriesId: 'series-a', turnCount: 8, gameTime: '1:01:01:23:10', saveTimestamp: 1779520400000 }),
            makeItem({ hash: 'turn9-split', seriesId: 'series-b', turnCount: 9, gameTime: '1:01:02:07:30', saveTimestamp: 1779520500000 }),
            makeItem({ hash: 'turn10-split', parentHash: 'turn9-split', seriesId: 'series-b', turnCount: 10, gameTime: '1:01:02:08:00', saveTimestamp: 1779520600000 })
        ]);

        expect(trees).toHaveLength(1);
        expect(trees[0].count).toBe(7);
        expect(trees[0].displayCount).toBe(5);
        expect(trees[0].collapsedCount).toBe(2);
        expect(trees[0].roots).toHaveLength(1);
        expect(trees[0].latest.hash).toBe('turn10-split');

        const timeline = 展开对象存储进度线(trees[0].roots);
        expect(timeline.map((item) => item.hash)).toEqual(['root-new', 'turn7-new', 'turn8', 'turn9-split', 'turn10-split']);
        expect(flattenChildren(timeline).slice(0, -1).every((item) => item.children === 1)).toBe(true);
        expect(flattenChildren(timeline).at(-1)?.children).toBe(0);
    });

    it('读取最新按回合和游戏时间选择最远进度，而不是最新上传时间', () => {
        const trees = 构建对象存储云存档时间树([
            makeItem({
                hash: 'turn14-late-upload',
                seriesId: 'series-a',
                turnCount: 14,
                gameTime: '1:01:02:00:50',
                saveTimestamp: 1779523000000,
                syncedAt: '2026-05-23T07:55:00.000Z'
            }),
            makeItem({
                hash: 'turn15-earlier-upload',
                seriesId: 'series-b',
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
