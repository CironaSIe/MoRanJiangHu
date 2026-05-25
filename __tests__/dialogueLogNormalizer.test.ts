import { describe, expect, it } from 'vitest';
import { 规范化对白日志, 规范化可渲染对白日志 } from '../utils/dialogueLogNormalizer';

describe('dialogueLogNormalizer story readability cleanup', () => {
    it('removes repeated knuckle-whitening phrasing and duplicate punctuation', () => {
        const logs = 规范化对白日志([
            {
                sender: '旁白',
                text: '她握住茶壶时，指节处泛起了一丝不正常的苍白。。屋内安静下来。。'
            }
        ] as any);

        expect(logs).toHaveLength(1);
        expect(logs[0].text).toContain('手指收紧');
        expect(logs[0].text).not.toContain('指节处泛起了一丝不正常的苍白');
        expect(logs[0].text).not.toContain('。。');
    });

    it('splits very long narration into readable paragraphs', () => {
        const longText = [
            '卯时的青云仙城尚未大亮，晨雾覆在飞檐之上。',
            '云水客栈二号房内，灵气沿着阵纹缓缓流转。',
            '窗外有脚步声远远传来，却又在门前停住。',
            '桌上的残烛早已燃尽，只余淡淡安神香气。',
            '你睁开眼时，屋内陈设简单，却透出久住的痕迹。',
            '门外那人没有立刻开口，只让气息沉在风里。',
            '廊下木板被晨露浸得微凉，偶尔有远处钟声越过坊墙。',
            '这座仙城在天光亮起前显得格外空阔，连茶盏边缘的水痕都清晰可见。',
            '你能听见自己的呼吸渐渐平稳，也能察觉门外来人刻意压下的急切。',
            '案边旧册摊开在昨夜翻到的那一页，墨迹被潮气浸得略微发淡。',
            '所有细节堆在一起时，便不再像普通清晨，而像某件事即将被推到眼前。'
        ].join('');

        const logs = 规范化可渲染对白日志([{ sender: '旁白', text: longText }] as any);

        expect(logs[0].text).toContain('\n\n');
    });
});
