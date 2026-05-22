import { describe, expect, it } from 'vitest';
import { 校验主剧情正文最低字数, 统计正文字符数 } from '../hooks/useGame/sendWorkflow';

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

    it('正文达到最低字数时通过', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '这是一段已经达到最低长度要求的正文内容，用来确认正常回合不会被误判为失败。江风穿过长街，灯影落在青石上，行人低声交谈，新的线索也随之展开。' }
            ]
        }, 50, '<正文>...</正文>')).not.toThrow();
    });
});
