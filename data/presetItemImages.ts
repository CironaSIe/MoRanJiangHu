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
    { 名称: '青钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/MzHlups3ymlkKKeKdsWNYPR6BXM55aLG.png' },
    { 名称: '精钢长剑', 类型: '武器', 品质: '良品', 图片URL: '/assets/item-presets/精钢长剑.png' },
    { 名称: '玄铁重剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/K2u7JlSJ2cahQCc3LwLslzVZpwQON28X.png' },
    { 名称: '碧水长剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/pDU6R0jYBwoFonwiEWV7Td5yLvwiPvGL.png' },
    { 名称: '断水剑', 类型: '武器', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/Y7vrdCBQy3oXeCnAgpHAdmdKZdyBDkfb.png' },
    { 名称: '锈铁剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/yZ6uz1DZqqt9x6CHmaneEdz60HmfRiyK.png' },

    // ─── 武器：刀 ───────────────────────────────────────────────────────
    { 名称: '柳叶刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/tMnXdMYUMBBZeiHPublznmeAHcB5Vqpu.png' },
    { 名称: '鬼头大刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/VffFYXVytB85MgZVxGpxqG2OL1ELKs4M.png' },
    { 名称: '雪饮狂刀', 类型: '武器', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/kKuGlRSNUKKMwacsJU0hlVJ6vxsjr99u.png' },

    // ─── 武器：枪/棍 ─────────────────────────────────────────────────────
    { 名称: '白蜡杆枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/SEhCFGFjS0MxTtgOc2TC1c3bNJIcX6Hz.png' },
    { 名称: '霸王枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/7ScPOQHPG7GvvaW4fsPFgPsqZOcC0HXL.png' },
    { 名称: '齐眉棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Ds6c88DpSCFv6YCZ54AhzwEhMyEJDB7Z.png' },

    // ─── 武器：弓/暗器 ───────────────────────────────────────────────────
    { 名称: '铁胎弓', 类型: '武器', 品质: '上品', 图片URL: '/assets/item-presets/铁胎弓.png' },
    { 名称: '袖箭', 类型: '武器', 品质: '良品', 图片URL: '/assets/item-presets/袖箭.png' },
    { 名称: '毒针', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/kn7jmenB71jYbHGxGKtyJGBXPbKe995X.png' },

    // ─── 防具 ───────────────────────────────────────────────────────────
    { 名称: '玄铁护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/6uz6Vm3SB1lxpOA5eg1DIFvyXjBURID7.png' },
    { 名称: '锁子甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GfEnaQi5AGKSuorV2GwOZWXJepM9JHwb.png' },
    { 名称: '软猬甲', 类型: '防具', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/q8baHJP4UTg6KwfZT4j9RTr0hpCDNX1L.png' },
    { 名称: '布衣', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nmOqWbgYbQJ6B1tDdKTKZG88K7rtH83O.png' },
    { 名称: '青衫', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/V80OIatPzWKYvVTlKGy5SkTOhEFcCYXX.png' },
    { 名称: '粗布青衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nmOqWbgYbQJ6B1tDdKTKZG88K7rtH83O.png' },
    { 名称: '青色练功服', 类型: '防具', 品质: '凡品', 图片URL: '/assets/item-presets/青色练功服.png' },
    { 名称: '粗布长裤', 类型: '防具', 品质: '凡品', 图片URL: '/assets/item-presets/粗布长裤.png' },
    { 名称: '旧布鞋', 类型: '防具', 品质: '凡品', 图片URL: '/assets/item-presets/旧布鞋.png' },
    { 名称: '护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/McIGnhhGKjpaL556ERyKIitHiF7SjxO6.png' },

    // ─── 消耗品：丹药 ─────────────────────────────────────────────────────
    { 名称: '辟谷丹', 类型: '消耗品', 品质: '凡品', 图片URL: '/assets/item-presets/辟谷丹.png' },
    { 名称: '回气丹', 类型: '消耗品', 品质: '凡品', 图片URL: '/assets/item-presets/回气丹.png' },
    { 名称: '凝元丹', 类型: '消耗品', 品质: '良品', 图片URL: '/assets/item-presets/凝元丹.png' },
    { 名称: '破境丹', 类型: '消耗品', 品质: '极品', 图片URL: '/assets/item-presets/破境丹.png' },
    { 名称: '大还丹', 类型: '消耗品', 品质: '绝世', 图片URL: '/assets/item-presets/大还丹.png' },
    { 名称: '金创药', 类型: '消耗品', 品质: '凡品', 图片URL: '/assets/item-presets/金创药.png' },
    { 名称: '解毒散', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Zwo9UBKCOXQEXhMYJgIFJlIu8n2yMOUW.png' },
    { 名称: '续命丹', 类型: '消耗品', 品质: '极品', 图片URL: '/assets/item-presets/续命丹.png' },

    // ─── 材料 ───────────────────────────────────────────────────────────
    { 名称: '寒铁矿', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/TOgNZN7bV4C7fvdU6TluCC195pJpYt3q.png' },
    { 名称: '千年灵芝', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/lEAi7saRU194nJhXMgGh2eNu2lWfC9ON.png' },
    { 名称: '蛇胆', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/3h7OVJn3Q3cGDvGZOgMKpIpyL9LQaX1O.png' },
    { 名称: '玄冰石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zVQpnWlzqC1rVEvT3YSMFqXomZPcOZ6h.png' },
    { 名称: '百年何首乌', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zLD5mhqjYIevOV0yUhyv8lSQJY4iw0ON.png' },
    { 名称: '铁木', 类型: '材料', 品质: '良品', 图片URL: '/assets/item-presets/铁木.png' },
    { 名称: '兽皮', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/kO7wB6nxMYMwmzGUhNZ6bU3XxYYi5ftP.png' },

    // ─── 秘籍 ───────────────────────────────────────────────────────────
    { 名称: '基础剑法残卷', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/QCyv1lNTGPCA8H2yhf5cio5Vs4QS5FoP.png' },
    { 名称: '吐纳心法', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/DLLb2X2Qu2ggSjojFjR7K6IMufkd6Zt7.png' },
    { 名称: '轻身术', 类型: '秘籍', 品质: '良品', 图片URL: '/assets/item-presets/轻身术.png' },
    { 名称: '金钟罩', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/tGZioa16KLGSYlEo6wWkuajp3qSglP3R.png' },
    { 名称: '九阳真经', 类型: '秘籍', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/3qY5LZxAOcecBXu4CyvfouSOPVwPwt58.png' },

    // ─── 饰品 ───────────────────────────────────────────────────────────
    { 名称: '玉佩', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/eRfvCpV0NGfqeWZeqiEshLXT7oxGTQ06.png' },
    { 名称: '银簪', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6A9iHGQYZurZlZkR4b7JX8sUkd9ucXYT.png' },
    { 名称: '护身符', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/qJ2nP8G4fcFujBJlvyZzoAVry4ad7y1P.png' },
    { 名称: '夜明珠', 类型: '饰品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/nmIrpHhUvnjPJr5J4jIhT3ShJTkZWwu5.png' },

    // ─── 杂物/通用 ─────────────────────────────────────────────────────
    { 名称: '火折子', 类型: '杂物', 品质: '凡品', 图片URL: '/assets/item-presets/火折子.png' },
    { 名称: '绳索', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/vBfKG4VE7Jw6LkZ7AHUu3YEsPceZ7ymX.png' },
    { 名称: '地图', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xXxlhJoQsC8wKx9It2VIS9OrtTZNVji4.png' },
    { 名称: '银两', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/OY0RTftUarov5iTMKdWDuLKcue7aX5Z1.png' },
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
