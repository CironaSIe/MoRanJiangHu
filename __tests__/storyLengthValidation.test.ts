import { describe, expect, it } from 'vitest';
import { 校验主剧情正文最低字数, 获取主剧情正文不足信息, 统计正文字符数 } from '../hooks/useGame/sendWorkflow';
import { 评估润色长度结果 } from '../hooks/useGame/bodyPolish';

describe('主剧情正文字数校验', () => {
    it('统计正文日志的可见字符数', () => {
        expect(统计正文字符数({
            logs: [
                { sender: '旁白', text: '  江风渐起。 ' },
                { sender: '苏清寒', text: '继续。' }
            ]
        })).toBe(8);
    });

    it('正文低于设置字数时抛出解析错误，交给自动重试或恢复流程处理', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '太短了。' }
            ]
        }, 50, '<正文>太短了。</正文>')).toThrow(/正文过短/);
    });

    it('正文低于设置字数时返回可供文章优化接管的不足信息', () => {
        expect(获取主剧情正文不足信息({
            logs: [
                { sender: '旁白', text: '大纲可用。' }
            ]
        }, 80)).toMatchObject({
            actual: 5,
            required: 80
        });
    });

    it('正文达到最低字数时通过', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '这是一段已经达到最低长度要求的正文内容，用来确认正常回合不会被误判为失败。江风穿过长街，灯影落在青石上，行人低声交谈，新的线索也随之展开。' }
            ]
        }, 50, '<正文>...</正文>')).not.toThrow();
    });

    it('文章优化不能把正常正文明显压缩成大纲', () => {
        expect(评估润色长度结果({
            sourceLength: 400,
            polishedLength: 220,
            requiredLength: 300
        })).toMatchObject({ ok: false });
    });

    it('短正文交给文章优化扩写时必须达到字数目标', () => {
        expect(评估润色长度结果({
            sourceLength: 120,
            polishedLength: 180,
            requiredLength: 300,
            allowExpansionForLength: true
        })).toMatchObject({ ok: false });

        expect(评估润色长度结果({
            sourceLength: 120,
            polishedLength: 320,
            requiredLength: 300,
            allowExpansionForLength: true
        })).toMatchObject({ ok: true });
    });
});
