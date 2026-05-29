import { describe, expect, it } from 'vitest';
import { NPC是否死亡 } from '../components/features/Social/SocialModal';

describe('social death display guard', () => {
    it('does not hide or gray out a portrait only because a debuff text mentions death', () => {
        const npc = {
            姓名: '林婉儿',
            当前血量: 80,
            最大血量: 100,
            DEBUFF: [
                {
                    名称: '死亡',
                    描述: '见证死亡和绝望的废墟后心神动摇。',
                    效果: '受到恐惧影响，但角色仍然存活。'
                }
            ]
        };

        expect(NPC是否死亡(npc as any)).toBe(false);
    });

    it('still treats zero health as death', () => {
        expect(NPC是否死亡({ 当前血量: 0, 最大血量: 100 } as any)).toBe(true);
    });

    it('still respects explicit life-state fields', () => {
        expect(NPC是否死亡({ 状态: '死亡', 当前血量: 100, 最大血量: 100 } as any)).toBe(true);
    });
});
