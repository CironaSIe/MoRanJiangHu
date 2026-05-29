import { describe, expect, it } from 'vitest';
import { 检测NPC死亡判定风险命令 } from '../hooks/useGame/variableModelWorkflow';
import type { GameResponse, TavernCommand } from '../types';

const social = [
    { 姓名: '韩小霜', 当前血量: 31, 状态: '重伤' }
];

describe('NPC death judgement guard', () => {
    it('rejects death status when HP zero, explicit story death, and cause are missing', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].关系状态', value: '已故' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social, {
            logs: [{ sender: '旁白', text: '韩小霜倒在地上，气息微弱。' }]
        } as unknown as GameResponse)).toEqual([
            '韩小霜 缺少当前血量归零、正文明确死亡、明确死因'
        ]);
    });

    it('rejects death status when no explicit cause is provided', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social, {
            logs: [{ sender: '旁白', text: '韩小霜已经死亡，众人沉默地站在原地。' }]
        } as unknown as GameResponse)).toEqual([
            '韩小霜 缺少明确死因'
        ]);
    });

    it('accepts death status only when HP zero, story death, and cause are all present', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' },
            { action: 'set', key: '社交[0].死因', value: '被尸群咬伤感染后失血休克' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social, {
            logs: [{ sender: '旁白', text: '韩小霜被尸群咬伤感染后失血休克，最终死亡。' }]
        } as unknown as GameResponse)).toEqual([]);
    });

    it('does not treat erotic exaggeration as a death fact', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' },
            { action: 'set', key: '社交[0].死因', value: '欢好时喊了一句要死了' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social, {
            logs: [{ sender: '韩小霜', text: '她抱紧你，喘息着喊了一句“要死了”，但神色分明仍清醒。' }]
        } as unknown as GameResponse)).toEqual([
            '韩小霜 缺少正文明确死亡、明确死因'
        ]);
    });

    it('accepts irreversible annihilation wording as explicit death and cause', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social, {
            logs: [{ sender: '旁白', text: '韩小霜被你一掌打到陨落，肉身灰飞烟灭，神魂俱灭。' }]
        } as unknown as GameResponse)).toEqual([]);
    });
});
