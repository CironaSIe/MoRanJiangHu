/**
 * 预置物品图片库
 * 常见武侠物品的预生成图片 URL。
 * 优先按中文物品名完全一致命中；若玩家/AI 使用同义结构名，则先规范化到结构化物品库再命中。
 * 仍然只有已有图片 URL 的条目会返回图片，匹配不到时才触发实时生图。
 */

import { 查找结构化物品 } from './structuredItemLibrary';

export interface 预置物品图片条目 {
    名称: string;
    类型: string;
    品质: string;
    图片URL: string;
}

/**
 * 预置物品图片注册表
 * 按类别组织，每个条目包含中文名称、类型、品质和图片 URL
 */
export const 预置物品图片列表: 预置物品图片条目[] = [
    // ─── 武器：剑 ───────────────────────────────────────────────────────
    { 名称: '青钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/anfwHfVhiACNOBZd6qmmAimCbEBhaKsU.jpg' },
    { 名称: '精钢长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/j32iPkGOeFNl3oJr8bxonYXSQ8l2N4cx.jpg' },
    { 名称: '玄铁重剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/5P2oTBGW5EECcoJhL2LUitu3sDFpTBr9.jpg' },
    { 名称: '碧水长剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ifIYs9hnSpDR8u5zJOBoY1xXhUDOHIqY.jpg' },
    { 名称: '断水剑', 类型: '武器', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/G7Cq9oeHYjqFp2YLHk9MFoUcmgYhjDjY.jpg' },
    { 名称: '锈铁剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/DjMcZGuU2rmspKp3IpXjq0DUhSY0Xwu9.jpg' },

    // ─── 武器：刀 ───────────────────────────────────────────────────────
    { 名称: '柳叶刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/KDVJlPbRd93LcMjkUm9hJFPLOpW6ZKTY.jpg' },
    { 名称: '鬼头大刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/mC46XvZiLK8RnamgPSWBRpbKnNSJ07E5.jpg' },
    { 名称: '雪饮狂刀', 类型: '武器', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/qfvJ1IBsjfpJKWntpdo96r1YA6WBqai2.jpg' },

    // ─── 武器：枪/棍 ─────────────────────────────────────────────────────
    { 名称: '白蜡杆枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ndadxv5OYWEAn6XgeYr3AMfYgq7pbCh8.jpg' },
    { 名称: '霸王枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/lTDKi5qacDPG8J0XRoZRZWYLS2spx0YU.jpg' },
    { 名称: '齐眉棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ROEEhTiWnMxUx8rtgDhOjodPHppnVoXp.jpg' },

    // ─── 武器：弓/暗器 ───────────────────────────────────────────────────
    { 名称: '铁胎弓', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/WBWaul4WHTE7K7sVmaembvP47g5KHpLq.jpg' },
    { 名称: '袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/GUWkwn4Ul62GGEsxrt3BYMIqFzjzMwlM.jpg' },
    { 名称: '毒针', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/6hXwlomM9MkQY6sT6CQ3IclLbAg4NtaB.jpg' },

    // ─── 防具 ───────────────────────────────────────────────────────────
    { 名称: '玄铁护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/j2VlrpbRuaMqc3jaWsMAi2sSWdm51vGM.jpg' },
    { 名称: '锁子甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/K3uMU7S4BtrpE8c8QjX6gQCZDJt8R4NC.jpg' },
    { 名称: '软猬甲', 类型: '防具', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/J2bGu5PXEGJlLKfzmqvh0Vs8zC512kg6.jpg' },
    { 名称: '布衣', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/5mVkZibyR5io0NjGNqY0Xab0AXmMCnPm.jpg' },
    { 名称: '青衫', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6TRCDavx6hJMIJtv6PH5quRt01jFpFS0.jpg' },
    { 名称: '粗布青衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/goRMpZvKbQ5nrLtJrUSxdHHUdCoDuikL.jpg' },
    { 名称: '青色练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/m6UColjy8TnBj9w1ACV8WI9Ate51ZkXr.jpg' },
    { 名称: '粗布长裤', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/KX6TGCDWYbKkrkCoYUw4tXgcMaOUIaYW.jpg' },
    { 名称: '旧布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ZJ3TY6CzUDZTfwq26k3P3NVHUWLRv96w.jpg' },
    { 名称: '护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/NzKSIqzgUFQnB81EMT7vlE5yCPgeG9PB.jpg' },

    // ─── 消耗品：丹药 ─────────────────────────────────────────────────────
    { 名称: '辟谷丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ei2lVYGAbAyLxJJc08EdK0yqqfNA04VN.jpg' },
    { 名称: '回气丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/tm1SY5pF4FlBeTVbSdy7nwjRuHgxjY9o.jpg' },
    { 名称: '凝元丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/acRWlcv3hZsSW1tCWFvhBrZyltqrR3s6.jpg' },
    { 名称: '破境丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/8zOP8Qgkc7LumCtqtND1QmZdNOKrImkD.jpg' },
    { 名称: '大还丹', 类型: '消耗品', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/6hPKge9E3KH2A46nXCgp1dVewURDQh21.jpg' },
    { 名称: '金创药', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/FcUEKWjZJ1VJIFw27w9ZobXQDLloJKYN.jpg' },
    { 名称: '解毒散', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/WgnEMiY63n5FiXHxjGRcBMiEdve7HKSg.jpg' },
    { 名称: '续命丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/mkGjuvfp9n0ACex0wlimXeftXxe2jjyF.jpg' },

    // ─── 材料 ───────────────────────────────────────────────────────────
    { 名称: '寒铁矿', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/2H4OsQZLfbw2hKmdnxS4yJqZlYPhBbru.jpg' },
    { 名称: '千年灵芝', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/lNSm2M0jvmd3yC3abRgvy329mL2XPHvt.jpg' },
    { 名称: '蛇胆', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/lJoLpOKFavZmndME70NpPHlXhRYncHqe.jpg' },
    { 名称: '玄冰石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/FyiAukTrFPPR8baOAofPhozoV3ghT25K.jpg' },
    { 名称: '百年何首乌', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/k2hGsTFSNP6kG2gqUaoDp9GSzn5jmDh1.jpg' },
    { 名称: '铁木', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Z9RQGTvF3ahpiHttmmTbZdbxGLNmeyGY.jpg' },
    { 名称: '兽皮', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gJfdL6VfcHyqNnZsvEYpeVzzpEu9XJmX.jpg' },

    // ─── 秘籍 ───────────────────────────────────────────────────────────
    { 名称: '基础剑法残卷', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/SJm4tEOoyEVtgjU643Cy0nQZh6Yz7GYQ.jpg' },
    { 名称: '吐纳心法', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/RHvhR2B9f0A8J6n1YepmV8epTXUmQD5j.jpg' },
    { 名称: '轻身术', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/FUrCaBXhOKQJIHIkw4ArLywD0RWHgR1O.jpg' },
    { 名称: '金钟罩', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/jnCdWpeHK9RpmVYclAIUYneQYMDH9gT8.jpg' },
    { 名称: '九阳真经', 类型: '秘籍', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/TKysJeNxh2AoL22nScNsCrJ0FQNkH1QS.jpg' },

    // ─── 饰品 ───────────────────────────────────────────────────────────
    { 名称: '玉佩', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ELpsq3WkifuRaa8CMDa2rNKsHQ0hgGUs.jpg' },
    { 名称: '银簪', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/uRsUcIILzTJDSjF7kcMx76rUCrX1Kj2o.jpg' },
    { 名称: '护身符', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/YpTRFOk2irjiDLcdMfbuWPK8pnxwik5A.jpg' },
    { 名称: '夜明珠', 类型: '饰品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/tCw94QELfxWMkSDdNYHVmf70kCzRgTYM.jpg' },

    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/NDDX7rqGHchW0J0W4LOGErHaeUTTGF48.jpg' },
    { 名称: '铁剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/IdSHDh0VFJYK1T33K5CH0ikdbuDhPG3I.jpg' },
    { 名称: '钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/nu8GnRw8Ri9YXOPi9r9LLnm4YXTREYba.jpg' },
    { 名称: '钢盔甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/gd3n4rCyF2iaAqqaVtaRc9gQeK07gXAd.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/buyxtpNR7yM6if2N6I7jhaMZakCY7HY5.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/6DyWTENxzoMbws2lpXlYOGiqNzkPia6r.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/sZEP7civYKAcVerj6S8yZVjR3wNk3ytV.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/1Yq68NRxNfoaCtL6z0cv2YOPYhdXE1w0.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/cLaXqZ5YfBQTWKXUmKgUTnj3JR3LuyOh.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EtDmTdqfXgae020D2YeOm8tVYuCZqujv.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/MlUmPxjOcdUpHbwitOFu0DuFR0GpWNRy.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/lI9XAxQQ4zfEsfkDswYLrbKyRhFYdev1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/J2cwl3HUvxkmiCWNoq0SeDvTwLYoSeyc.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ZgWXdj4OXTDB75sR1WtkFTBCHeBoHRvm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/OEMIPPu4fiQFbQpZUkhTK3vLRgLN7u2p.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/hSiLkTT2XunpGaaehHdUXfjBfiemM2YD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/8GRTmPvax5CPDCtjErr1C8OxEtDVQSZe.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EX4qRZZRebc8fwmPYZwil4VSuuO8udiZ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/YxEPCyiB2PIQHYrtB5wBlT8cQQaUtpmR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/zpNOxEdeVgmi67BsundsbFD5KUhi2PLk.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/GAxDZpoJvyFmVn9XSkhqcj36KKmVNOdj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Zrd2uSU3GmrHhElUxmR0egd4jUKGYtVX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ql8jIzwDd8LlUJPoRUMhfQYBFFfmE2Dv.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/TKGudEfa9ep9eZxApplSKPFcdANX3L0y.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/xTwurdE4KKQV5dDx6CZPr20tuaVqaSqH.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/cF0A6Et1YkP3kYTf979qKZAXqH3H0L2Y.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/aHEauYiuVat4I3rm9E66gi8Yh4SilsQ5.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gMNkcFdOi95gBuBaeUykXA52VLTP3n5P.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/aKg5St7ftVJvMFdczFsST2tnZFmRarFf.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/9KrdZSXobOoGXGIv4sLPwIWNTnwdBzqE.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/T4ZykM13DcDmnCExYz1XeoPAjPvaIJjA.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/LMaSkW56334nfSXngJJsEI37Fg73kg3J.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/VLlBUNA7DodCi1yUREqxSEQY2zPxJg0t.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Tb4BplZBWwxhL5mnr6qebLTRG3soCvJB.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/0XtGh8Ls3mxRKg4E4z1SLpy1gQOUrJHU.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/73L15S2djBLmzFo0rDHrh5fmkstXmIwj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/alims2Ty95pwj3a8eCklIAY1cQueZX2T.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/7Dcec1HpDuOUE8WvFShS8pmtyYp7avDn.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EK83B6wDBPdQO5P6c2zQuNuQjNEzqVCi.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/4DsyYJIE3sM7JyFCvtRx7wMNW8ElOuXm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/LHgWeQ7VScV8hPd6M4SHMwyIXlu8ZqhQ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/6NW4QD4mPsyGOMsXqsss5Ryfyib1ljmp.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EoTuvnkBAbbsyKcO3VVSF1SUMFdDuDdP.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/LyBHD58COyp0QLQ8lto0IGQ8I6HsILmX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qI0GDGtBykQ88BT8By926CGDHuoEUUse.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢短剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qFeRvVJcm5fIZYbOpuGOBfRcI8B4C8l6.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ZT5OLiysF281uuNF76HhLjBj07jZQsWQ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢短刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/9sXp9omwoezXb5svHEbayUiNqt0GW4yX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/p4Aolmah10nEAch7GT4tocdK6fxLnaaY.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/aUgKNe7JVsqKkfdDtnwPYBKimvpshAJ0.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢矛', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Z7TXrjkpgpQIm4crGJwlPJUshirsSEhV.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢棍', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/w9JbpXcUSMAzrkKJ2KbIMtYRrovrDtb8.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢杖', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Cce6MkJDchWVRtbJb0BLe7vuyTjuzWeI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢弓', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Vs5pbMyUuUupcfNaBsWljs0rr5tfzcfF.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢弩', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/SpKNYrzJpI9PvR1UufI6WPXTLlsiUXB3.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢飞刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/7eRHa7vuUwY3JktNApMmD3JTla5Io4Vh.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/DaBWiL8WhkXl8uQsi5o4So33xfoy78J4.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2O9GwxQkiFuBAuk0jZB2YVyjU49UTAHj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢短剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/WzLAjA2YT6f2NEoAZ0aEqwqNuGGFNXoZ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xInT4NYefrobWlHo3SL4VDIYiZREsQ1X.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢短刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/F4NpPtdShGJgHjBe3ebGV5fsav674NGB.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/7efxk8Vsffcd0kZHjJUneAg6VXLkNhgv.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/jW73pjnpir2yfrGNu4XYVzvyzDeucdN9.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢矛', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/d29J27QpF74107kTppRR8lts1L0mtskt.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢棍', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/GXA0DlaNx2DgDShYegpBbZixvjltJFvn.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢杖', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/dAGQfffNmds18ixNdrOCMLAme1K580GV.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢弓', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/BK40ZfZyw8g1bxmez1AUnACeOKkOdJAl.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢弩', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/U6OJPmgwyrsDj8txyhXYWXTqhr3CLYJl.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢飞刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2eAtamaO2fgQwmhMbYgxNnL4SFAP0q4F.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/C1F9J4redbWgW574QuZndvNgxMVC0X6k.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/9QKh58z5JA9krX1MlznoAjfCCSnQGzdx.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁长剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/qQGSn9fv6UotMxx8NXYg1MK9yXJKaXNp.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁短剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Z0KK4IzSN4JniP1uBhD7wg1O35rLYpWm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/i0EsEUiEYpkexorJDncR3yS65DN8XEUO.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁短刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/z4ud1KS3It2IcGcYs4vjBp3I8TRopD2r.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁匕首', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/48tbO5LnrG9dB04rrMX9SSQboFoPf8jf.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁枪', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/QTwxdCEmut6aW1DGzWZdnD3AkeS9LY1x.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁矛', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ojJ3TycAJ2huqJKuY7olcdNpDkx45txr.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁棍', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/DefQIKVngtrc6YZIphVGLAlXg0PP3heJ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁杖', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/HoiFfbTZTB9uc4arO1TquwvFQOoH14Xr.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁弓', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/vqf1IwVwLtzQfqZ4HhPw8CllcXWhXGRR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁弩', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/153q5MChK7jPmbqYtRfMDbZqPBuNYdC7.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁飞刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/2BbddqPf3PywCkft1sBVx27owSMNQduI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁袖箭', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/TvfaUtVvZDHTVVZ245BDp93K9aGQhyiY.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/JKcSd6HO7BHVPqWAYEDmVWH4cXlYqQTu.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁长剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/IQZFOJ1qpofBNHE8EqXZTG9stYmstK48.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁短剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/aZIaTzhLpuGWYc5yKjL9gfOHAaan9KTR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/oNGPBnfmZJ7MQHxrSdSkaaeg7jenhsuD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁短刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/5XiTbeTqMPCfygalR5Xz6277rN7xR4JT.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁匕首', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/TlvWJ5BrdtAQxdnJmUcMYmSLeCvDY3rX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Mqftz9V5s9FGp8ZbYX9M4ninICgWrDc2.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁矛', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/rJMnqSuigbT5tlpmPbcz5vmJc7WZxWfy.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁棍', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/cpDHUFq4TYXWN50rQYr03H8yl1GpTp78.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁杖', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/VPaTy55VLYS9ZyX415sKlqChvD0fGYaF.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁弓', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/k8EyV7iHGLQq2rrZFhAd2j9EUFj2RGXL.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁弩', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/GIOOjFgspGALDVt7UdqeoYl7sTZorvJh.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁飞刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/qlkC306TgA3cnAzieIEWfYoBD88OsT9e.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁袖箭', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/7tK1bmzevLaZOg1JqQ1WE1fUjWdiXv2W.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/JcT0CzkyxB51kKcszwzP8gbcGYOj78S6.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金长剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/9sXHmtmZ5kiD9os9iXLYCub2Bl7tYYI0.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金短剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/C2MkO6u0dnmlV8pzN5qUN3gBXrNfpLXE.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/LXvLAXBpwqcYYlnVeY1klepSd57cjV8N.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金短刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/INTO2kk47TExXXcwDtHfUzwLSnmCMzZj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金匕首', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/7JqQKoRkHzDvyVLDcKuFwNoc97jnZtPW.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/sRNiv0dpAvFFwLBfLsYpolyzF7xiBGuR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金矛', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ckbhWYPjjDGQT1fAPFc2Big7ZyFKvENH.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金棍', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/WH66wADeSiOaCQC3PgGY7riwRGzm1XuD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金杖', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/b4COlpeLQg5B3kYmM6z8XQPZzZ8tvsNQ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金弓', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Xz7Zzgn2oXaXrKGuqBWFFXWtweeXi6aV.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金弩', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/yTogJuKl9meqISMCvIxOqPh4XnaMlVzc.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金飞刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/31gvTO7Wg6HXlgdo2iJr42YY2CGk7UB1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金袖箭', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/cK1zFDpRJ79pFoVcrzrtgoYpAlBqY6pR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/hTRJQMvdywcVUQtWUGKBXnuux6EY1d7Y.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布长衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/QHYZ4KxwjExTX8uiXE9aZ2J9GY9XifpT.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/tuoYIkKlnuUQHvMAmPEAxG9iZrGc8Uh1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/hfCSdZe6YbUfsUYDILayYdiWtwfsVJyn.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布长衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/jlZYuX1zPlwqyOEqv9L2lsrlXylpulxX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/tA4roAZqwmiAtSmu0YYpM4d0SPf7pTgp.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布长裤', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/VhVdOIbNpmhYhQjm26zdfXXLWDVDCif1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/l3gHYB7IPuuqicdpnYLfadeLEYrih4QZ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮软甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/enr2poX65MRjZbIkr5yXFsWFNCBRXiup.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护腕', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/vorYGqXpmq5MUbIZvvySt60iX5aLtXnK.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护腿', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/yec0KKHqSXU0HzWiW03oognHNlzTCCUX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护膝', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/BaEmikiro0yPVyrTUFsdbXoYCWcIAzWy.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮靴', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/OgBQMb8lCDV4RVQiEPdP2lTPhPTGpFSL.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/7epW3kWLcN4zgV8vvAVHJGduKLv23lXD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁盔甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/5g40T7ZcpQdWuHmNsofMMNQEgdTxOuUl.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qJiik0TB2nQsKEamQ7hQMxDJWx3VEAfF.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁软甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/1OIFvZhbnaQ0nW5diZegL33czCDiYIP2.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/G2c6kUHbG9EYASWqmOo9s27cymJYfs9K.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护腿', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/0w77nFn4hkm4UQGbt70Oc5GUlJRI78Yo.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护膝', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/4fDuBMq0wS9Uih0vCcdfhNqmaTy2JTZO.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁头盔', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/VA20CCG5j2wxiOJXdhpww4qGgszF6yyY.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁发冠', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/tbyoHsNlez9SYp213zpx2ymENgKjMlXS.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/WGmtRYOFDD1etpUVzlv3fsKK2cFQAdvq.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢软甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/lumfU8OYzVGlxJUrAETt2O8tiD0l7MQo.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/biecpdJqn2RSmRb2QRLHNTk1VNAQzz4m.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护腿', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/gFpIkfW82zA5hw8azbogVD9WWcGQmfIA.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护膝', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xFPsTa9uLBQvUF6eofwCDcTxj438cyeu.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢头盔', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/HMN071dj0WmZOqBaZES4YyYDQ3p84yHI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢发冠', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/QAMC5XuM4QR56fpJW91yDcSXSfAtfei1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢盔甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Hi0NiZtKBFahuLTNdrRX9uquOQrBZGAt.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/67NuyQdgiPXkTFBaZbYAIhNIrTWroKXk.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢软甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/TReitTJs2rUHncbLKOKKxANySVsTKCFD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护腕', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/vNMavZukeeTYWPpbpUvifCWeD3QzEiai.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护腿', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/k4U8V6jHsfFeuHwxnf52HaiX25F3ubMX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护膝', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/6ecKYfHfEQlEh4WGQsWBWGuYksetXB2D.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢头盔', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/OYrn5hX2mbpQ51IxLEMZEM9Hkq7vzACH.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢发冠', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/uLDkpcqPvKeSLI0bARxgmV3eQXTaIDjV.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁盔甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/qQdp1uUuuB9jo6llIkisdEJ2uKG4BNY9.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/t24CuLZsW2jSBGmS44riVBRXcQX3jLAD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁软甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/p1O4L3gQywuipKtE8C2PKi5E5YqF50ga.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护腕', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/orH7l3sqgIIpGreXJhWyFzXHxYSFKXBl.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护腿', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/biPRrf9vdx6X5u6AxXRgqq2Gf3Zjd828.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护膝', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/5DTLkIkleE9siBcj2ovs3EXLZB2Rjiof.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁头盔', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/NksiK5IMTZcrXkF3XIuxIbYi5IJgSS1N.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁发冠', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/N5Fq8lriRfGmJ277wfHVyIqPYn0fuDbX.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁盔甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Y7IUoQhcx0zPOk5G0ILKfqdsriI68B5O.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁软甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/jfhEX8FPTq6WVig5ZH3XUBs0Kmrh1dl3.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护腕', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/rJ3HVPChDTaKHKqmslvLycgMBQkcHQSa.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护腿', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/V2vC2jBwuSvlsDnLQ3z2sOFtD19tv3AQ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护膝', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/KUe6a7JaHZRkIWbHZwwRY7P0AghNq039.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁头盔', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/mMEyuOiYd82Sc0r8bEUcnm8WTHFMXxIi.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁发冠', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/mbkVPw6CEfTRuAzCzUkf0Sh3DIaKY7m3.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金盔甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/X1PDt89yCEPicD6hacsXaTmvcYTUxUMw.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/HteX4QJPQp6ZPnb17H6CrYz7fEYtC3kG.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金软甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/lVDbe6q2hp9kBw0GXhpb58at6pclKDpe.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护腕', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/QzjgU2MXzQI8bIidHuqlkhzaa1wXFYqw.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护腿', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/hnt5cVLlCLx5IV4XDBm7rn0tbwiidGr4.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护膝', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/3NfImUVojJCDbqZKYONxgQHFveeNmZE3.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金头盔', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/3JchusHjjLDfUVW62QMiNSbwIktjnQZ0.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金发冠', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/N6GDlCfDBZu60jxGlkG4pOkWElLqGWMQ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '草鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/xUfqMoVTgiDT9WZZxM7i51mhd3Ex648o.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ha3SIAC3OvaO33qEcFcbK5P01GtW9rFT.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁鞋', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/FGY6FvxTnSIIQhulOpMVkOxf5ae52kgO.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/y3iPb3TtQIK7aJa7jl5KkrnvLiBycSbp.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢鞋', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/kZUO4rjcBLjXpXwH9XrcVzXVYsY25E1p.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢靴', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/EPoKYPK1pEnmY3MZiUYmtHaHWjw9V9z3.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢鞋', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/JnAdoWaMJDuV4NhL9np1L79nLW3Jbxhw.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁靴', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/0Yyvy3NAz7E51D2Ea4d0kOrwoyLvnx2W.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁鞋', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/F9fYiFV8eZXMkfZ88dRxIXNWxTeXGmLY.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁靴', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/1cQE9ZlRG1y9ZOvGTUklEuAW7fgiYeii.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁鞋', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ZcMhPPu8Y7wALtpbwS7YH8Sj760qipDv.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金靴', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ZeMbdhuHkWin42phS4onzqKLOtxiHN7z.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金鞋', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/37eOxNJhkhbxibbBNnCiS7GJYBDmX1Ed.jpg' },
    // ─── 仙侠预设：丹药/材料/秘籍/符箓/法宝/装备 ─────────────────────────
    { 名称: '引气丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/VAoLDtKHv9epWbMlBtiCdNjY0VwpOkXy.jpg' },
    { 名称: '聚灵丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/8PgwFC7TR6PiEhdO96MizAQwIsKDWJmH.jpg' },
    { 名称: '筑基丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/jI2gpiGfDBS0ZRJuaDivj0cAJgnlVf2e.jpg' },
    { 名称: '结金丹', 类型: '消耗品', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/eDoMDvKcdDtTGMMoCMBCLTJxAEm9DybZ.jpg' },
    { 名称: '凝婴丹', 类型: '消耗品', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/MzcPaBHpLfV5GRWTeVL7KSuYENlsDHEl.jpg' },
    { 名称: '化神丹', 类型: '消耗品', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/wokzOi6F4HniA8zy1SSfyGytzvC0g3Bp.jpg' },
    { 名称: '清心丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/3NtMHTLGX6oiZ74xIFhWvKEIpBzY120S.jpg' },
    { 名称: '玉骨扇', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/IhWGwz4sCi5dtHsGESj44uIDiucmQlMr.jpg' },
    { 名称: '淬体丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/mgF2XtrFgSy1zK76q2CPcNI1g4QxRhN9.jpg' },
    { 名称: '洗髓丹', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/t0xR15o8syhETD9MRXiBgWTTpYdOjXIm.jpg' },
    { 名称: '护脉丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/tGVntob9HU28olja1uuJHfP1dspHIspq.jpg' },
    { 名称: '回灵丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/rrg2P57hhiFOpwdpdb3gYJ1cPw1yrPJi.jpg' },
    { 名称: '培元丹', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/o24tYWZF3lVAbsmg2B2vETigYzipKzyG.jpg' },
    { 名称: '下品灵石', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/sOJ2vgcKf2p9qKK231819MNRcPQPs1Bj.jpg' },
    { 名称: '中品灵石', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ee6rcAD3w191lqCHkb9odK3gP3nYm1qV.jpg' },
    { 名称: '上品灵石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/v7MghMuYGQodYSpWVQoJ3XMbBIcbx8XB.jpg' },
    { 名称: '极品灵石', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/1SLIED2PRTAUDZo9rCjFjMegyrebSXQX.jpg' },
    { 名称: '灵晶', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/26JJuicGADupZBKNXASd4S40RtbUq1p5.jpg' },
    { 名称: '赤阳石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/AQf6UuVCvRyxHRZNnKXwBAE9T5UTkLfw.jpg' },
    { 名称: '星辰砂', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/KhfVwRVaCgSkgbZrJ9DIPHUXlrYACjMW.jpg' },
    { 名称: '空冥石', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/2er3XXXR7gJmTCITMC7gplYOeiHRWJam.jpg' },
    { 名称: '雷击木', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/yjCwhCeProHH5bYAtDIBim60mAz60Cpb.jpg' },
    { 名称: '灵竹', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/TYKpS6z3vn8jAY1PhKSXFyckMDMk7vil.jpg' },
    { 名称: '月华草', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/rYllaqAxxaCqOpyuYSfp6Om96DyB4q2n.jpg' },
    { 名称: '凝露草', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Lj5G8YygJCO7ORNR8PHjGIHuGhhlSrPQ.jpg' },
    { 名称: '血参', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/hj1r2fpsQuWh6wV0AUjdKBIFL9PsCcIY.jpg' },
    { 名称: '朱果', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/LRgFzi7ie0FbgOdDEMssWpkXCmr3fxk9.jpg' },
    { 名称: '妖丹', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/qzQSsBl0IDetH5vbo81kwLnItYcUjZi1.jpg' },
    { 名称: '炼气诀', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/J9l9NqATjph5OYy6gthXYdWv02uXuLmt.jpg' },
    { 名称: '筑基心得', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/1Sp2vRWoh7OWtZ8my3VsCdhZGKCOMOv3.jpg' },
    { 名称: '御剑术', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/gtm1gnO1ZbziA5UF4OPocD7XSvQ27pEh.jpg' },
    { 名称: '小五行术', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/fYSEMh05ZxAP2e3KMgPRV11Gq97Yo6Vk.jpg' },
    { 名称: '太乙剑诀', 类型: '秘籍', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/GyXoUYmHdJdUzhsUcjsX6KyVjbVN36YN.jpg' },
    { 名称: '炼丹初解', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/GQBVjf8dpdFDrHQPxzYccYSxKwpYKDXq.jpg' },
    { 名称: '符箓入门', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/GAMaG6uobV49K1pYCp8UEVUHTNxeHnbX.jpg' },
    { 名称: '火球符', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/e4GFHlfUDDh1csxUiUCJhKesVWaEz6dU.jpg' },
    { 名称: '冰锥符', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/vJS4kc0dKgEuq03VGqvHnI2bPiyEwzXx.jpg' },
    { 名称: '雷光符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/1lwruvEUlE3R68DxIDzD2tGG8Y956nv4.jpg' },
    { 名称: '金刚符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/S6w1zdEaksbGjyDCoxaddK8gBIrzXIrY.jpg' },
    { 名称: '神行符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/fo0KJwtS6lfauRTwjioIutE2Zn6V3RPz.jpg' },
    { 名称: '隐身符', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/J6lt0aAfvXDYTZyBrzP8KE25G6SerUnl.jpg' },
    { 名称: '传音符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/H7nTJKYIZNSPi1HM20cSttBo2GDXDi7K.jpg' },
    { 名称: '传送符', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/LG3zSJCaw1WK20qUsWIIsDb2N5wNJ8Mw.jpg' },
    { 名称: '青竹飞剑', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/CweO9jJEo9sInPbcSHzG8vyXSaei9G0Y.jpg' },
    { 名称: '寒霜飞剑', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/BAn7aoYU94b8xGH9cmiTN7wXg0dgzJ1i.jpg' },
    { 名称: '紫电飞剑', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/OCZMcG17jASBu8EdvJytYGbTqlSSqaV2.jpg' },
    { 名称: '青玉葫芦', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/JMBPJd8J5vBsWKQCobH8MYFoVR3mS38V.jpg' },
    { 名称: '养魂铃', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ukAKV7aSUC7e6rhS8D6bKJtNUbfppcyQ.jpg' },
    { 名称: '镇魂铃', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/gb4uQ3ZQ115DV6m6KbgmRu57WsKfBHXn.jpg' },
    { 名称: '玄光镜', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/N6vbaaBEmQgevunLu3XMpNoDYOPIejBP.jpg' },
    { 名称: '八卦镜', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/7RcaufHINNjqlMWp8xvQL8jHXVRqaWZX.jpg' },
    { 名称: '缚妖索', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/4MeFOHJQmsatAPbuL3Xh2cFclnyYKh7l.jpg' },
    { 名称: '储物袋', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/IIvAG8BfpTNQxGnZA0NlnKj1KY9jciKI.jpg' },
    { 名称: '储物戒', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/dzJ24EcaqIBwN3K9CAnCaYuaQTNHzdnB.jpg' },
    { 名称: '灵兽袋', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Rc0uaTtxPH3IiITGFsemzWPG5qcriopO.jpg' },
    { 名称: '聚灵阵盘', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/JxKvXizSFYxnqb19ADX9BYh6R04TbHT8.jpg' },
    { 名称: '护山阵盘', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/f4CHTgebTdDzQEY2IMxInXjdC0gCMHfK.jpg' },
    { 名称: '寻灵罗盘', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/lc04TltzGifVpxTMYMwyKa0g72TaGFat.jpg' },
    { 名称: '紫铜丹炉', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/vgGCLmfAQo7XJuxJpYS4PIgeuD54c1mj.jpg' },
    { 名称: '玄铁丹炉', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/aksAt0IoWzRwM7F56HKYxdY1hwrXTOsM.jpg' },
    { 名称: '炼器锤', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/t38SAVw3Ng6C5DPhCbsyRKA9JSSukO3g.jpg' },
    { 名称: '青云法袍', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/QAhODFFb7Kd8pmgebGiTCID2WlXnahcM.jpg' },
    { 名称: '月白法袍', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/TmAtEAaSWmBe3LhfKcVSnyVBa6arp9RY.jpg' },
    { 名称: '玄纹法冠', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/aQPesc9yhrYnrE668oXLqwCAgKJq5A9S.jpg' },
    { 名称: '避尘靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/nZQEn1lLeac2UJv6QKUxISjdQRb7pYDH.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '门派令牌', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ItQBTyl86wgouTvCcaYhJcXDr0GWOHfK.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铜钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/zX6CUgDCuHPlGmCwlDwjFjOKxcXOubsS.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '秘境钥匙', 类型: '任务道具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/PJJyNmcvtGcHQCKxb4lBXECOtYfFXCgA.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '官府文牒', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/tOzbAm3hOsRFsEAH0C8lSQMVwYOFiTyE.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '宗门令牌', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/wqjYlbMNo0DisdisivvI1f3kaUV8aAId.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '智能手机', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ooIVVmheZ6SHI55JYMRZXEAmAzZKmkxT.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '洞府禁牌', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/SJDC0aqC13EpW20xndD7SYz2h1ZYnOTs.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '急救包', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/61Ij9shISjRPj65bKrEs0BkJWBAqmsEm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '录音笔', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ogYPHMxJP1W45nuEoGTECDJYfYh4ByWA.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '笔记本电脑', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/2AJVlzcL5e7NppKNnlXyiZPHS1XPE6eP.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '镖局凭证', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Db4HMKZUPVxmUcmxE11i344T2myGAGXe.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '密函', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/rk7b3UnuA8WZgNGZfHu8OUMvD13K7LHR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '传承玉符', 类型: '任务道具', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/TAcXQUHvfkgXv2WxmKlw22xI48El1YEI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防割手套', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/lJuBSDS49P8pFzccVcPirNQ82qPtoM8Y.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银行卡', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/283aeUCXst8HetqkS7ZvxgxrYAHFHXYU.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '古玉残佩', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/KzALbyaXRqtXM0h9FocLerleOKNQAlW8.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '现金信封', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/CJcBhSH4QdHoKVWVtAgBqGu45cK0eQyU.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '合同文件', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/OIltUoAkwZsb0EysIaAobwOr5fHqPYXR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '证件夹', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EUnUL1YO6hNF80HyiyUb8Ri7RJTY0mXO.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '数据U盘', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/S9y8d2NpOl5yVI2zWxza9NEdevfW73v6.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '维修工具箱', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2ZBvWH8XOgFeV0Q0tNeMCYaPd0FIHuVe.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '车钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/IYMUZUutE2tqyZp5KYQZ85Yeo24Iygwj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '电子元件包', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/EwJSL4ckEUe0lcKemFWAdKbU2R8iY7cM.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '多功能工具钳', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/jkxGoAo9K4XHKH9C3oyi2QWPmOmG8lUj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '备用电池组', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/y5nfBWYNy6YkYKHGtszjOKIGdrX9L8qK.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防身喷雾', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Czn3zDYhJVmVqzHSMAd6DELHXuC5703b.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '伸缩警棍', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/gTbqBBPIF9EVA2fIPCJLpKYd6XcMWYLz.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '轻便夹克', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/yr76LWnhngimkLGkYOEeXFHGFAwFSMQp.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '运动鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/qC7d1SnobE2mCLGFCBOnYBnzs3pYltuY.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防护口罩', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/CrEqpGiQeB7J5jrKSx6Ula8xAWIf4LIS.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '电脑维修手册', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ZYWPaq4L0G6acUsQSXtEPk1JsHrRjeuo.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '急救手册', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/82u1X9Sh4uxwxdcsbCCPC6KWHIYge48g.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '便携检测仪', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/MS4kDWZdtRk1Lzm9sGvgjX6sqTjTpF1s.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防护服', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/v0Rr4Yv2Or6mhotxviYah4mDnbXzapVy.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '异常样本盒', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zMwRJEEXkAYFPpDTwIvsjxuYjGV4l0dP.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '灵能探测器', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/cN9qYYQt1kAN4skS31U3qMwPgsZGxBRM.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银戒指', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/XCcWeEHcnozNtnWdG9gSdXmw7VYvY2HI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '灵气抑制贴', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/bQBCDg8EflvwyyQ7HQUr7d89OAiYBEeA.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '罐头包', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/xfBFAJ81HV2pS3QSZwnhNM010gIZylOI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '怀表', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/WwWNGs4tG2y4fEs1wukejIAEK35PQRB8.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '净水片', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/u6i5gVTReTXzopaof6NPXlCftHZktx1O.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '手摇电筒', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ccwxZxEV0tRn4BDq1lQhwm0ptlDOB5Yu.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '弩机组件', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/nbvqyABFda3HGgnyH5uDisC6jGTZ34Sm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '抗生素散盒', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/FSbSrfPfU7I5FGfesv7GTPare0I3wPw2.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '饮水瓶', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/UnNGj4dQ0uDoNPB7X0tCBp006CZcb3T9.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '汽油桶', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/wceQL3JpihpiZdbgNTblxzYL7DTruRD4.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '压缩饼干', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/7YK0wVz7GaFO0t1CDyHkZaOOP3kgCd0C.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '医用绷带', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/MswWJUEhh4iSFXDHcTomWrEopf3YUrF1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '止血带', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Lp5sjoyPU6d7pyNMnBrpWts6pNRZNDXx.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '过滤水壶', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/fhKmBhzgCpRXOB1oMhFiQWpF9CYDhnDW.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '干电池组', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gMjgrgMZKioyCSiIldXqNUpkpDL2Nymu.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '净水滤芯', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Y8AbadatS0UpejhYluKXloLRp4ItellI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '太阳能充电板', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/MQLoQy2ZRmh2eboOInBtKrSxZ6LLVYsm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '弹药盒', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Bo7ff9nkWsHYfIGnsdP0nfKBQUgNvlut.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '护目镜', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Y30W0Wt4dyNq96TSQGlBJgz1PTkfnuvD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防毒面具', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/4YwIArERXgfYo0DPsFLcpKOtvFM4hSMU.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '撬棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/RbIjYYhXpfBCvM5zkZawiSNqPp5E8nCc.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '战术背心', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/JblCgJAjtprxiCySY598fZY2R2YBXa9T.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '消音弩', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/3JLFrH2cEm4tMTooW0BlX9x8u1s8GJYe.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '求生手册', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/RPoN4UKHYK6KvAMtSUCj44WAVOFvQnEJ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '营地通行证', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/aS7Y1vnxES4ywsGuYNXVBPccMJXsljSi.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '无线电台', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GBGA9JfCqrE2WIxUbAf8Oc1R2EBat48i.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防水火柴', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/SF3zKZCJrBdrEMqLgOBz8JMdzvGEZTXb.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '感染检测卡', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zYfYLnVQP9jn2xZHzAKZYcMPyzaJTB1j.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '骑士长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/mCFyE6rWvboTDf7rEYgzgYtkHQR4EMBj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '冒险者短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/TBhrN3FOlXP6jDgVLOujRPLXxSsu4Mng.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '牧师钉头锤', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/gls95UIKNLfeSyFcxo27MFX0rRJs81Sm.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '橡木法杖', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/zCz0Re3jL1YthuADItMN8mM4TYOTaYn7.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '长矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/6bzR7c3eY3e5NCAb9PerQ5ZaCfN4Apnp.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '轻弩', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/21BNiH8U29ucK5QYuWyRBDt7oldi6yfn.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '猎人匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/jtyXaDNIQUeDNv2zDP5gXFSpxah2WzDi.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '战斧', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/C5HBTMs0z7T47bewi8dUi8iqMxGb1b4d.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '短弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Vx1itzpcgRuVG5VF2vpN9VcvsYbkY0XZ.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '圆盾', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ZVZDqn13gGj7YCEXsXUZ9mnp6DM7qAmc.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/uh9LFvQAVpQpfCkv0u8d9oj99ln4CZXz.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁盔', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/KLRsyvvJc1apaetoC163xKI1d2VNj47w.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '板甲胸甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/crOFjdgLbbxtndta1nfgCrwuFrBVKyVu.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '旅行干粮', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/sfFVFTrRB4Yyea7JV7bN6aVa2eH2dkvR.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '兜帽披风', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/a1hJNMFiBlZwjwg5QPXXadpUAe1gPDc9.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '治疗药水', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/lFJ46Vc6hBBiPJKyrenZXTCEo38aUUV1.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '清水水囊', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/iOltudArJoq2CEy8vhdUSUenRqRytvVb.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '法力药水', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/aVsRDHICTi3sG8FZCVZ7TnrHG4LLG2bO.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '解毒药剂', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ehMRYtu9Rgt21TpbIRx1rRjDN4tIjfwD.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '火把', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/B5N2DcduDhwB3IBi86RBMmJ4w0s1ePL7.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '火绒盒', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/XIoqCTKYW1z1YaMqg4smgfCZ5M3h8qQT.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '王国地图', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/HSpLkHWAt04gZ58LXazhBbhohZ5NCosE.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '冒险者绳索', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/mLCkWuesOBwzAhYejprtHjrBili6vXG5.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '公会徽章', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/nhZJg61R7myaz1EUerfXfXYWQ4iJnHYG.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '指南针', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/5ghsZ2FnDPfHgBgtXEzBTbDPtUvrWAyI.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '护佑圣徽', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/LYcfEZHbKsm2BAWJwvBGccyaiTLPB1Qs.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魔晶吊坠', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zBB6OF8yefYAgFQFFRWekaiitDXiBPdS.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁矿石', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/e1zLbA3lRpMRa3Ap9buDzvxuCkoi8784.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '家族纹章戒指', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/z6MRTLurX8EzHppeO8frEoB0lBc9hXVh.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '秘银矿石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/7QfEjrV57lheC9ZPYuYTJNMwlYfswGcw.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魔晶', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/FylNG7AZq1JjfRyHw7tdAa027WFXMNhl.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '龙鳞', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/A0Kb8pzcwS4qr616nc6vW9uEDKgEcf57.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '狼皮', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Cr3lfoCY0bszPZq9kTiFGshF9ew5X2zM.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '初级魔法书', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/GcV0mvbeajgS1yjvaTj5thqbpDJeYabl.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银叶草', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/MAwkkxETUrHRPDD81tEAUMYcYY2cFuEG.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '火球术卷轴', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/yqpKshWJ6kyJDh8zMPDf1Epde1igyg9j.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '治疗祷文', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qcIzgth9xeEI3V5yp6LTiMdeBE4Xsqf8.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '委托羊皮卷', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/x5lIsRAxevZWQIy2Kc69JYDZ1GCLThD5.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '炼金笔记', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/NwFdksr8vaXL4m79Cwx4SDV36md78QLC.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '地牢钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/8S9wrSQJkcap0SkYXikD9egXVNA70yg5.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '冒险者执照', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/sPFPpgrxw3stY07d7npKcWQgsh3RnYvg.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铜币袋', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/u7Gl4OfLUjFiWoxdjQofGiD08sxrJYem.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银币袋', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6hvsihBMqeochVn9iiSatgKdozHaiyBj.jpg' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '金币袋', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/OEzADJ3R3bmF6VARtdUxldxB4Snbdw6D.jpg' },
    // ─── 杂物/通用 ─────────────────────────────────────────────────────
    { 名称: '火折子', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nh2APKGa5993PpJ7v988qL3IV32LYlo7.jpg' },
    { 名称: '绳索', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/n23MSCC4ZXtXniqh0XuwwvPcDdOZYUI2.jpg' },
    { 名称: '地图', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/CFhBrTFr68PRy4gw2zJnTLZavSqw5KrA.jpg' },
    { 名称: '银两', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/7tTSVxkMEM5GZkcYEl2TEJalFjSSxPyU.jpg' },
];

/**
 * 按物品名称精确匹配预置图片（唯一匹配方式）
 */
export const 精确匹配预置图片 = (itemName: string): 预置物品图片条目 | null => {
    if (!itemName) return null;
    return 预置物品图片列表.find(entry => entry.名称 === itemName) || null;
};

const 规范化预置图名称 = (value: string): string => (
    String(value || '').trim().replace(/[·•・\s_\-—]+/g, '').replace(/青钢/g, '钢')
);

export const 匹配结构化预置图片 = (itemName: string): 预置物品图片条目 | null => {
    if (!itemName) return null;
    const exact = 精确匹配预置图片(itemName);
    if (exact) return exact;
    if (itemName !== itemName.trim()) return null;
    const structured = 查找结构化物品(itemName);
    const normalized = 规范化预置图名称(structured?.名称 || itemName);
    return 预置物品图片列表.find(entry => 规范化预置图名称(entry.名称) === normalized) || null;
};

/**
 * 获取物品的预置图片 URL（仅精确名称匹配）
 */
export const 获取预置物品图片URL = (
    itemName: string,
    _itemType?: string,
    _itemQuality?: string
): string | null => {
    const hit = 匹配结构化预置图片(itemName);
    return hit ? hit.图片URL : null;
};
