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
    { 名称: '精钢长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMOEdvS0EtQy1uLWxmblota2dSMVEybzlSNzhiMUFBSlhEMnNiVlg1UVZNQVNPMGNFcFZKQUFRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjo4NTkzOTgsInQiOjE3NzkwNDEyNDg2NzcsIm1pZCI6MzA1Nn0.yHGzzlPWvDGjuLyYpHPpLfFREVUATc3ZGYbWvnp_y1A.png' },
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
    { 名称: '玄铁护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOT21vS1dKUkV4MVdYaTh6VkZqQ3ZjLXdDVmNIZEFBSVNFR3NiVlg1UVZFbVFUelZ3SzNVR0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5oqk55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjAyNjUsInQiOjE3NzkwNjI5MzMwMzcsIm1pZCI6MzM4Nn0.noB_8ppQKhbmGvYpMAIDfgfKs_Ic3bA9jLNstDbLrwI.png' },
    { 名称: '锁子甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GfEnaQi5AGKSuorV2GwOZWXJepM9JHwb.png' },
    { 名称: '软猬甲', 类型: '防具', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/q8baHJP4UTg6KwfZT4j9RTr0hpCDNX1L.png' },
    { 名称: '布衣', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nmOqWbgYbQJ6B1tDdKTKZG88K7rtH83O.png' },
    { 名称: '青衫', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/V80OIatPzWKYvVTlKGy5SkTOhEFcCYXX.png' },
    { 名称: '粗布青衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nmOqWbgYbQJ6B1tDdKTKZG88K7rtH83O.png' },
    { 名称: '青色练功服', 类型: '防具', 品质: '凡品', 图片URL: '/assets/item-presets/青色练功服.png' },
    { 名称: '粗布长裤', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMOW1vS1ZBSnlsSmc1Um1BS0NMWFNjLU11dkF4V0FBSndEMnNiVlg1UVZIa3Rfbm95WjItNkFRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi57KX5biD6ZW_6KOkLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMzUyMTk1LCJ0IjoxNzc5MDYxNzYyNTY5LCJtaWQiOjMwNjJ9.ziBNoQbC90pTktB1eRzmht83w-H3mUMAKDNQi0owjDM.png' },
    { 名称: '旧布鞋', 类型: '防具', 品质: '凡品', 图片URL: '/assets/item-presets/旧布鞋.png' },
    { 名称: '护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/McIGnhhGKjpaL556ERyKIitHiF7SjxO6.png' },

    // ─── 消耗品：丹药 ─────────────────────────────────────────────────────
    { 名称: '辟谷丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMX21vS1ZBX05qUEpBM29taDFsckxtXzQ1NE95VUFBSjBEMnNiVlg1UVZFUW5STnhwMU5IRUFRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi6L6f6LC35Li5LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMDU4ODY4LCJ0IjoxNzc5MDYxNzc1MzkwLCJtaWQiOjMwNzB9.7QRH_qgyPqaF92oR9oPDAE0iLEF1vQRC3A7YY5ClSNM.png' },
    { 名称: '回气丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMX0dvS1ZBdklQMklOLUtBdUU1VVhXOXJPQ0JRMkFBSnpEMnNiVlg1UVZJTFc3ZWdqa3BpY0FRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi5Zue5rCU5Li5LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjo5MDg3MTgsInQiOjE3NzkwNjE3NzIwODcsIm1pZCI6MzA2OH0.bZft93pZluelxSUsPbZY4ANtCMcSdTBv437Xb_Y2cZ8.png' },
    { 名称: '凝元丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNQUFGcUNsUVNORi1lUi00T1paOU1VSmQyck44Q1pRQUNkUTlyRzFWLVVGVDRSNFczZ3BRNEVRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6IuWHneWFg-S4uS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6OTkwNjkzLCJ0IjoxNzc5MDYxNzc5MDIzLCJtaWQiOjMwNzJ9.xXLtlGMxkdJFU71vSmksWhn_H33S4z8YVzJcHxf6kHA.png' },
    { 名称: '破境丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNQW1vS1ZCYm52bXRHMTBhYTQ3QXVEa2p6dXIzZkFBSjJEMnNiVlg1UVZBeUt1dGlxdUdpc0FRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi56C05aKD5Li5LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMjgyNjI0LCJ0IjoxNzc5MDYxNzgyNTA2LCJtaWQiOjMwNzR9.VCBFpyEvJK69UXIe5uXluMhttdAGk5uNntRfRM8RyW4.png' },
    { 名称: '大还丹', 类型: '消耗品', 品质: '绝世', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOdEdvS1c4UXpVUFVHUFdkUG1TMGVCY2xFOFhpZUFBSlRFR3NiVlg1UVZHclpyNGJlQUFIMWJ3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWkp-i_mOS4uS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzM5MDExLCJ0IjoxNzc5MDYzNzQ5MDQ5LCJtaWQiOjM1MDh9.cKjM-akJAlVCM--agbBbkH7RfWKW3lYxXVytSUN7VVI.png' },
    { 名称: '金创药', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMLW1vS1ZBaFkxazRNTkh2eWFrRWktM3UwNHAxT0FBSnlEMnNiVlg1UVZMNnY0TEV1OWhvbkFRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi6YeR5Yib6I2vLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMzMxNDk2LCJ0IjoxNzc5MDYxNzY4OTUzLCJtaWQiOjMwNjZ9.08Pv89cBO7TLKUBAQz4SeCXOMWOhe3-i68KXPOm4fGM.png' },
    { 名称: '解毒散', 类型: '消耗品', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOcG1vS1cxZ2JNZ3hxTU5oZ3VjbFRZc1JMc3daM0FBSk1FR3NiVlg1UVZIbFYyUm1kWGRockFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6Kej5q-S5pWjLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjAwNDksInQiOjE3NzkwNjM2NDA3ODYsIm1pZCI6MzQ5NH0.jGFHiXzlH0WT0_A7rMrCrBTN8R_2gmngnNfzalYbEGI.png' },
    { 名称: '续命丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNQm1vS1ZCM0xJdnIwYVZqRks5NVJKRXlnR1pfR0FBSjREMnNiVlg1UVZFa0thNDJIN0dpVkFRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi57ut5ZG95Li5LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMTQwNjQyLCJ0IjoxNzc5MDYxNzg5NjcwLCJtaWQiOjMwNzh9.ixBk8N4PRj4wlNMaYeiyTPiEakZf5AshNdvhc_gV_SM.png' },

    // ─── 材料 ───────────────────────────────────────────────────────────
    { 名称: '寒铁矿', 类型: '材料', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOcUdvS1cxMHJrdDBOSXFkeG1YNWRzOUh5YzVYcEFBSk5FR3NiVlg1UVZLM29PLXRKa19xZ0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB55-_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozODQ5NjcsInQiOjE3NzkwNjM2NDYxMzMsIm1pZCI6MzQ5Nn0.BKXKkk1faIKEuPQ7DJarGWUEb_a5EFNYwReOoQRb2xg.png' },
    { 名称: '千年灵芝', 类型: '材料', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOcW1vS1cyVk0xNkFUd0xjczQ1WldqaW9rVTRFUkFBSk9FR3NiVlg1UVZBUTNIVV9McUt2bUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5Y2D5bm054G16IqdLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzk2MjYsInQiOjE3NzkwNjM2NTM2OTMsIm1pZCI6MzQ5OH0.cnRTaPuHwWOK769QYMKoXJSACWlmzNUJdj6vhb-lId4.png' },
    { 名称: '蛇胆', 类型: '材料', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlObkdvS1d1YklvRTJTVy1ycm1lb0dYYlVkRF9FaEFBSkdFR3NiVlg1UVZFS2dqcFlQYjhnLUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6JuH6IOGLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjU0NjAsInQiOjE3NzkwNjM1MjY1ODAsIm1pZCI6MzQ4NH0.rddiODnfMJhtHF9DPFhB9FuvDhvoEVnhj1bLvg-EV-w.png' },
    { 名称: '玄冰石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zVQpnWlzqC1rVEvT3YSMFqXomZPcOZ6h.png' },
    { 名称: '百年何首乌', 类型: '材料', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlObW1vS1d1RXE0UEc3dUxZTXE3OGk2NENsVVZKVUFBSkZFR3NiVlg1UVZOaEJKU21sbE9aTkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55m-5bm05L2V6aaW5LmMLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzk4MzMsInQiOjE3NzkwNjM1MjE0MzMsIm1pZCI6MzQ4Mn0.WjlBbq82Z0HgJKs-LveJuvtLT9fDJrOq6QA9dg5WtGc.png' },
    { 名称: '铁木', 类型: '材料', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNQ0dvS1ZDY0pQSDVJLTlDUDI1MjRna1FCYldlZkFBSjVEMnNiVlg1UVZDWGVpYXVhdkVLY0FRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5pyoLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxNTIxMTg5LCJ0IjoxNzc5MDYxNzk5ODAzLCJtaWQiOjMwODB9.EneDtVYZLpyR5M-yXkd3W-V3eLMASmJYudZOWL1GyHE.png' },
    { 名称: '兽皮', 类型: '材料', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlObG1vS1d0UTNFZmNyc0w5WWFaS0ozU2NuLXRDUkFBSkRFR3NiVlg1UVZMNEZvQk5kbnY4SEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5YW955quLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzk4NDIsInQiOjE3NzkwNjM1MDkxNzAsIm1pZCI6MzQ3OH0.NVKvSvusMto45FKh2P3veZf3sx8E_upUPYIm51bpcZQ.png' },

    // ─── 秘籍 ───────────────────────────────────────────────────────────
    { 名称: '基础剑法残卷', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOckdvS1cydGR0LUhoNUIwd0Jhd3pxNlBGZDZPVEFBSlBFR3NiVlg1UVZOM2RtLUh0X2c5bEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5Z-656GA5YmR5rOV5q6L5Y23LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyMzA0NzksInQiOjE3NzkwNjM2NjAzMTgsIm1pZCI6MzUwMH0.pvHREJTGUavFlKMcIVKMOTxrwfQ0KNTXJKSygp-W8qk.png' },
    { 名称: '吐纳心法', 类型: '秘籍', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOcm1vS1czSHpaUnJTZW1CNUpaSlo1UUFCX2Q4SlFRQUNVQkJyRzFWLVVGUVBYUjhUX1ZLcEx3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWQkOe6s-W_g-azlS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MjQ5NTY1LCJ0IjoxNzc5MDYzNjY1NTY5LCJtaWQiOjM1MDJ9.vvDH9et_e7CP6F_kSZi5-y_QCaO9Ak79dw_LXWW5J8M.png' },
    { 名称: '轻身术', 类型: '秘籍', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOc0dvS1czZkY2VEZmMHItakVWZWVCSVNQV1FBQmFRQUNVUkJyRzFWLVVGVEZQVFFjam9GT25RRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6Iui9u-i6q-acry5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MjU0NTE4LCJ0IjoxNzc5MDYzNjcxMzcyLCJtaWQiOjM1MDR9.tgT0kMDdEd6kttfj_G52KPBIrS3vhD_uUzV1VZtGPmU.png' },
    { 名称: '金钟罩', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/tGZioa16KLGSYlEo6wWkuajp3qSglP3R.png' },
    { 名称: '九阳真经', 类型: '秘籍', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/3qY5LZxAOcecBXu4CyvfouSOPVwPwt58.png' },

    // ─── 饰品 ───────────────────────────────────────────────────────────
    { 名称: '玉佩', 类型: '饰品', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOZ0dvS1dXcGJEQmlGTkR4WHlDYTktMGJXby1FT0FBSTFFR3NiVlg1UVZNdkt2TUtYMmR1VkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546J5L2pLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDQ3OTksInQiOjE3NzkwNjMxNDYzODIsIm1pZCI6MzQ1Nn0.g-FcRGNKLzaxqSW6x1yTXSEY4sOoy5T703DUgGBeJOI.png' },
    { 名称: '银簪', 类型: '饰品', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOZ21vS1dYQzNRZG9UQzJIWEMwaWM2MXNRSy1hNUFBSTJFR3NiVlg1UVZJa3UtVVdVNEtxWkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZO257CqLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTEwMDcsInQiOjE3NzkwNjMxNTI0NTMsIm1pZCI6MzQ1OH0.FV62I2Ztvx7yDB8JghwMJL4IPLgYAb3BEExeLs-E9qM.png' },
    { 名称: '护身符', 类型: '饰品', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOc21vS1czeUxuM05uakRZS1dfZW9ZcE13UFRHZUFBSlNFR3NiVlg1UVZDUE42YzRkaVcwa0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5oqk6Lqr56ymLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzg4NjcsInQiOjE3NzkwNjM2NzY3NTQsIm1pZCI6MzUwNn0.7K1F6bR8tYmKCAzq5TYlTlXfUpk3mDs_iFx1O881Y1k.png' },
    { 名称: '夜明珠', 类型: '饰品', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOcEdvS1d3QUJZZ0dPdkM0RG9hRklvemtQWEptbXVRQUNTaEJyRzFWLVVGUS15eG1TRjl4R0RRRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWknOaYjuePoC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzQ3ODAyLCJ0IjoxNzc5MDYzNTUyODg1LCJtaWQiOjM0OTJ9.tb8LynaJm6twObJcs4Y_OC-xw_OzkFP8dhfNNOoFO1o.png' },

    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMZkdvS0FBSHhKeTJBUXdrNno4TGRXbW82bmgzYWxRQUNHQTlyRzFWLVVGUWhTZjkySnFOaWtnRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuacqOWJkS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI3NTk0LCJ0IjoxNzc5MDQwNTU0NTc3LCJtaWQiOjI5NDJ9.zPgWlwCOlCBKl2orVprK7ttEewlJhyPBcq03GCE6pmM.png' },
    { 名称: '铁剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMdG1vS0FySDNwbjU5cWM2YmF1ekJOYk9odjNLLUFBSTdEMnNiVlg1UVZKYk9JQmYwdy1URkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjY2MzEsInQiOjE3NzkwNDA5NDYzNTAsIm1pZCI6Mjk5OH0.D-ET771qhv7WyIIwpb5es_9duTgDpZ0gmZkrS5uNwQM.png' },
    { 名称: '钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMZW1vS0FBSFZjR2N6UmhGQjZNRThMY1daUHlKYzN3QUNGdzlyRzFWLVVGVFRSLXpqR1FteHd3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumSouWJkS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzE5Nzg0LCJ0IjoxNzc5MDQxMDc4ODg1LCJtaWQiOjMwMjZ9.7RTwOuBQhpq7NLhoeSu3OeVikoRfKTkXX-CC8Zasjyk.png' },
    { 名称: '钢盔甲', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMLUdvS1ZBWE5rcVlmNGYxUWoydi1ZUFBkM2pwUUFBSnhEMnNiVlg1UVZQU2lNNkJxWnNtV0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi55uU55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjQzOTYsInQiOjE3NzkwNjE3NjUzMTcsIm1pZCI6MzA2NH0.-Eoz46hRF4qXTgn7I2XoKATrGBxa1hpWMv19IonRYjw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMZ0dvS0FTNFAwOXBzR2twT3p2WlZxNjZYS29WaEFBSVpEMnNiVlg1UVZJejFmNUNtZEJHZ0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzIwMjIsInQiOjE3NzkwNDA1NTg4NzIsIm1pZCI6Mjk0NH0.F9MsYyXtSO7UHPLQop04YCcjL5uobFIsX92vtmj-VG8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMZ21vS0FVQTdxLXFES0JMV09VMy0zOG1YTWhaTkFBSWJEMnNiVlg1UVZJeXVtQ3gtWF9VdUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjk1NTgsInQiOjE3NzkwNDA1NzY4OTMsIm1pZCI6Mjk0Nn0.MzC6u_RJ7JPjdGa0vfAw3Xbo2a3KCrt7HlEbck1bbQ0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMaEdvS0FWdXhxeVpqN2lfRWxkUDlxMHluMmZ4M0FBSWNEMnNiVlg1UVZDMkx1VDdCRVlYSEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzExNjksInQiOjE3NzkwNDA2MDQyMTAsIm1pZCI6Mjk0OH0.MtUsZOgnpzmyf8VKL4Krjz8fd38F1Y6MdfApBJbs2lo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMaG1vS0FZQy03VUt2LUFpdUZUNkZiVEE0RmxYVkFBSWREMnNiVlg1UVZNdlB2WW1NSGFucUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo55-t5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjk2NjEsInQiOjE3NzkwNDA2NDEzMzMsIm1pZCI6Mjk1MH0.5lRJGN_Df7c9cFX5gfTO5Kloj5wZaeMm621jEVA4PV0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMaUdvS0FZaVhScWItUFhGS3lzVHl2ejRTcW9ROEFBSWVEMnNiVlg1UVZLeWxtUGc4ajFYcEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5YyV6aaWLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzI0NzksInQiOjE3NzkwNDA2NDg5ODQsIm1pZCI6Mjk1Mn0.AkhtScX8GhPusysmKFyZGWiD9J__mGlaTf5EtPSXXSQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMaW1vS0FhRzlfSDc5anNSVklVUkQ0b19NUFFhLUFBSWdEMnNiVlg1UVZNWUZPRnpDVDcyYUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjk3NDIsInQiOjE3NzkwNDA2NzM0MzQsIm1pZCI6Mjk1NH0.friWEPo8Z7bQdQc5SqniaxzmMf2g0lCMfroCw-2JpTU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMakdvS0FhZ2V4dGY4eGMxNktTZExFaDByVFJUcEFBSWhEMnNiVlg1UVZMOXlMdm1SaTJCdEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo55-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzA1NzAsInQiOjE3NzkwNDA2ODEzMzksIm1pZCI6Mjk1Nn0.3BykPDe8uzQnG8ZmMD_vOJRNtP7nrRsKpDR0EsoC55M.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMam1vS0FiQjhoeTU2R1VEWDFweTlsZHlQZm55ekFBSWlEMnNiVlg1UVZMWjVLRVVzcGNiNkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzQwOTksInQiOjE3NzkwNDA2ODg2NzIsIm1pZCI6Mjk1OH0.uNGEbstokbu8OYEQq1xkvZ28SVTHq3pQ8EnbovUQpyA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMa0dvS0FiWlJ1SVR4RGtzU1FucjJIazlnVmN3VUFBSWpEMnNiVlg1UVZFRmNnU1BvZ0pwa0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzA2MTMsInQiOjE3NzkwNDA2OTUwMjgsIm1pZCI6Mjk2MH0.Yjy-5T-gafVCTP_SJNY4RnrSLh692uDDLnvT93O3UOk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMa21vS0FjYkxGVjhwY3JTN2ZjQXFYNDM0aVhqTkFBSWxEMnNiVlg1UVZQeW54VDlGeGZKYkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzc1MTgsInQiOjE3NzkwNDA3MTEyNzQsIm1pZCI6Mjk2Mn0.AuEp9_w08IbEsgMrGhn-GdgT5YW9Z75REuX5c-QabXI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMbEdvS0FkbnBnTkFNT3VTclVScURlQ2VaMk9hc0FBSW1EMnNiVlg1UVZGVVJJYnN2Mmd0VkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo5bypLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzIzOTMsInQiOjE3NzkwNDA3MjkzODgsIm1pZCI6Mjk2NH0.rcaRf1MJKjRVs7SunnatmD3o9Lgh7dI4TIhz0H-EED0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMbG1vS0FlRjFOdDJ3aV93cUxMeG9CYlVRUDZEMEFBSW5EMnNiVlg1UVZFVWR0cHdIYlJkcEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo6aOe5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzQ4NjgsInQiOjE3NzkwNDA3MzgwMzAsIm1pZCI6Mjk2Nn0.c9lA0pG8kGSj4OKimLvnk8yRfUjXtfwSmtBGU8r7DxM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMbUdvS0FlMjlYNUY3Q3M4RURnaDh5eXpkdFhWOEFBSW9EMnNiVlg1UVZMa0VlVUJOUGFpVkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5pyo6KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzQ4MTYsInQiOjE3NzkwNDA3NDk4NzgsIm1pZCI6Mjk2OH0.hpW_rkbbFGLtPnxuiYCaeto5VjVv_sI-AOSurVzKr6c.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMbW1vS0FmZzdleVc0bWpua1FtUHBIc2JERlZRTkFBSXBEMnNiVlg1UVZBNklEeWFwY3NTbUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzA3NDUsInQiOjE3NzkwNDA3NjA4NDcsIm1pZCI6Mjk3MH0.avS2F7CUEsCxZIpEAkqzUylsfI63HO0w1Jj7f3bI_w0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMbkdvS0FnLUVFTUcyTnBXby1kLWZCdHJvRFJxYUFBSXFEMnNiVlg1UVZCQ1FJcEs4bVhRVEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u56ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzEyNTksInQiOjE3NzkwNDA3ODM2MDgsIm1pZCI6Mjk3Mn0.GsITti6_U0dLHJ5NcphEDpI0D8UIwotxfclX4WxXGMQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMbm1vS0FoWVFlS0x0TjZtdW1LamxsN3Jjejc1Z0FBSXJEMnNiVlg1UVZQR3ZmMUxVeXl0eUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u555-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzIyMTEsInQiOjE3NzkwNDA3OTA2NTIsIm1pZCI6Mjk3NH0.VssY7l80Rjy2YL19LWFMtajGQ8QpmgPhg9C349iIV4M.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMb0dvS0FoM3M5em9zYXJVWlFacm00a1JKME1aZEFBSXNEMnNiVlg1UVZCdGJSMzRFQnVzQkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzAyNzcsInQiOjE3NzkwNDA3OTc1NjIsIm1pZCI6Mjk3Nn0.E8ron9DGZ9wxAkXfeK0fIAKOzdo8ymU1QOlrz19fDM8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMb21vS0FpUmVGLTVaSWJVdkR1OS13SzJYTEg0ZUFBSXREMnNiVlg1UVZNZ2lGNjMyWTZIaUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u555-t5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzE2OTYsInQiOjE3NzkwNDA4MDQ1NzcsIm1pZCI6Mjk3OH0.GRywcfrEVaZox0nbIcAAdLV0ATmDJ4LFb9mfQjBApaI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMcEdvS0FqSEw5LXB5RlIxdW1aVW5uWTlTWnZSS0FBSXZEMnNiVlg1UVZPOEo1NERLa1ZGbUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55YyV6aaWLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzMwODEsInQiOjE3NzkwNDA4MTgwMDMsIm1pZCI6Mjk4MH0.NLiqSvK_3KVtXO9vVd4dbAP4xgl5mgDTNG54hP3XZv0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMcG1vS0FrR09yLWlMTkZQNlZJWTR2anE0emZnQ0FBSXdEMnNiVlg1UVZPdVVEYVVOQ0E0U0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjg2NDcsInQiOjE3NzkwNDA4MzQxNDcsIm1pZCI6Mjk4Mn0.DCb1Ay5BA-FuEFInK-8n_OhDJhN7BxoL-Tbn0TeDjp0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMcUdvS0FrNV9QRU1fcFdxNFhxeHN1NjdXdVFPVkFBSXhEMnNiVlg1UVZDeDNkMElIdWUzbkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u555-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzA0MjQsInQiOjE3NzkwNDA4NDY4MzgsIm1pZCI6Mjk4NH0.8f-q1OEaNUBfPBmMIVSQYKwQJQEzK11Lx7AodIYxpRQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMcW1vS0FscVRfTWRNS1JJWkJYTndwY0l6NlJUdUFBSXlEMnNiVlg1UVZLM0o3Q18xaHZjR0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzAwNTksInQiOjE3NzkwNDA4NTg3MjksIm1pZCI6Mjk4Nn0.BaeOuMh6ItY5w0xq-_yBEJUo57Vjtcp5-xi4szoP0uU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMckdvS0FtVVVWdFhWcEplcDItYkxLR2YzRDJRNkFBSXpEMnNiVlg1UVZMVXVWbDFPdGZDWEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzAyMzEsInQiOjE3NzkwNDA4Njk4OTgsIm1pZCI6Mjk4OH0.sM_z5fkgdN1tQLk8K6_Qzch4Nos5KVYA8F7bCT2IvWY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMcm1vS0FuUTdCdDMxc1BkWWI5S1M5QnJlOGJ3WkFBSTBEMnNiVlg1UVZHYUhLY1NWWEJsbkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDA4NjEsInQiOjE3NzkwNDA4ODUxNDQsIm1pZCI6Mjk5MH0.7-yFBgLcIGmZRe6WUbq4yVyMHf5HSleCNVJsaVO5GWA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMc0dvS0FvdkxLRTh1bTJ1WkNrWkhFV3MyZVJ1aEFBSTREMnNiVlg1UVZORjVlNUtuOFJQTUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u55bypLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDQ0NjIsInQiOjE3NzkwNDA5MDc3OTAsIm1pZCI6Mjk5Mn0.tDNvafmmllz0yhk9sjRN2BvGH7S2IVyzIm-KU4Y8oqo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMc21vS0FwaElxSUd3d1ZNVTE3NjlXM0xBZ080QUF6a1BheHRWZmxCVXl0X1I5bUI2R1lRQkFBTUNBQU40QUFNN0JBIiwiZSI6InBuZyIsIm4iOiLnq7npo57liIAucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjMzMjMxOSwidCI6MTc3OTA0MDkyMDc5OCwibWlkIjoyOTk0fQ.ISHSBeaMTjaGpI5ZJXle6IHt96DUQJf2AjQEUIVpwLw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMdEdvS0FxaFlCQlZYVDNTWUtpT2I2b0VnSUJ1eUFBSTZEMnNiVlg1UVZGUXM1cXAwMWU5SEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi56u56KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzI4OTYsInQiOjE3NzkwNDA5MzYzNTgsIm1pZCI6Mjk5Nn0.0eAkdY5TXXjNqPT1LnvDfM-88g8SBU3cSoPx6qBj-Ig.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMdUdvS0FyM0IzZ2xNNEhnNUJJdUgwMFVEWjNYcUFBSThEMnNiVlg1UVZCM0Vvc1JuVlJXckFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjU4MTAsInQiOjE3NzkwNDA5NTc2NDQsIm1pZCI6MzAwMH0.eIGe6r_A4B7SN4SNOL4X-bw9RjjvlotluqHCgV5tqds.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMdW1vS0FzaGhUWGVMUksxRzhPaGJBdk5KYXktNUFBSTlEMnNiVlg1UVZNN3hwQ3RWSnBibEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjc1MzAsInQiOjE3NzkwNDA5Njg3MTUsIm1pZCI6MzAwMn0.hp_4ljUZds5gEVPqfUmRT43Ia2mGmaCt98mq0qD_quQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMdkdvS0F0TE9ad1l2M2FOWUIzQ0VOUm45ck5MMUFBSS1EMnNiVlg1UVZLTnFpdmFoT2ZfbEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjc3MTAsInQiOjE3NzkwNDA5Nzg5ODYsIm1pZCI6MzAwNH0.Auy732HNMHfSq3MUid5j3BfHvRMBSv6r5q3-TRx2ms0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMdm1vS0F0eUdWZUFBQVJVUjJMSmhyVUR5Vlg3bHVRQUNQdzlyRzFWLVVGVE00UzQ0YUczZnBRRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumTgeefreWIgC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI3NDQ0LCJ0IjoxNzc5MDQwOTg4OTA1LCJtaWQiOjMwMDZ9.k3QlgDD9MfaazZPsOpiXIHZ1qV0xpo-XWt2BzGE5Igw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMd0dvS0F1WWFMc05lbDhsVXkzVHJBQUZiX3MwWTVnQUNRQTlyRzFWLVVGVDVJZEt5M25HbWVBRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumTgeWMlemmli5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzM0ODc0LCJ0IjoxNzc5MDQwOTk4ODIyLCJtaWQiOjMwMDh9.BjqhAFLg3C_sr-VqcYmPYEoT1zDSKJspRUVL9qVNVXk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMd21vS0F1LTZHWFd0MHRmNF8zd1M3RFdiYkh5ZUFBSkJEMnNiVlg1UVZJX09NS1hiTXVMdEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTcwMDIsInQiOjE3NzkwNDEwMDc5MTAsIm1pZCI6MzAxMH0.4A8NkY5uSrzJppTlPpnSPgHFxcWCDjIWcMRxJApPlGQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMeEdvS0F2akJHcXVndkZ2MDdqYkd1Q2QyUzZjZkFBSkNEMnNiVlg1UVZEajNrVjVldlhUZUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB55-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTU4MTksInQiOjE3NzkwNDEwMTY1NDQsIm1pZCI6MzAxMn0.c2eX79JMba8V9cV9tklzbyUDQNuE0T6WXPYEz70ABEU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMeG1vS0F3SGJPOUl5ejFFVWYzcTJOc1otVVRXbUFBSkREMnNiVlg1UVZOTXQtYUIwTWlQWkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjg1MDMsInQiOjE3NzkwNDEwMjU2MDcsIm1pZCI6MzAxNH0.w5jehBFpt0yPpahzjYJeYu_Oxii5pV7rB9Dz7IH10vQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMeUdvS0F3dDhPVG5YdEJLRElKQV9vU0JXUlQxaUFBSkVEMnNiVlg1UVZBOUpkMG1nRlFBQmt3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumTgeadli5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzIyODc1LCJ0IjoxNzc5MDQxMDM1ODEwLCJtaWQiOjMwMTZ9.epW9faWNKI1kX3f0IAwR0GN5dQ9m09VTMglPQsphXZo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMeW1vS0F4U2s5WGRWZUhZcEl3Njcyclk4Vmp0YUFBSkZEMnNiVlg1UVZOaHpVVGZaQ1pjMUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzAwOTgsInQiOjE3NzkwNDEwNDQ2NzIsIm1pZCI6MzAxOH0.jnYPalhPt_ZjKXghaxUug6rYq9o8r0AyF7rVrKioAE8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMekdvS0F4M3QtdjRBQVlBMGZCUVI3QXNud3ZpNnVnQUNSZzlyRzFWLVVGUjFhXzQ5WnZ2MHBnRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumTgeW8qS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI1NjM1LCJ0IjoxNzc5MDQxMDUzNDAwLCJtaWQiOjMwMjB9.y9V-qZNz523TAcQSbkX9bQF1Fb9Tw3bTVDa7-ucIEE8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMem1vS0F5WW5vZFBsbzg0eWhnUnV3OFZUYUxWLUFBSkhEMnNiVlg1UVZLR241WHRkdHVjakFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB6aOe5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzE0NzMsInQiOjE3NzkwNDEwNjMwNzIsIm1pZCI6MzAyMn0.rXeaA1yR8c3aBJj8UhaQm4GOq-YH-M2Kv8yn4gQ2WmM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMMEdvS0F6QURIU3BkNnZyb05aNHZldlQ4cUZCckFBSklEMnNiVlg1UVZOdUE2QW5ZNVR1UEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB6KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjUyMzUsInQiOjE3NzkwNDEwNzI3NDYsIm1pZCI6MzAyNH0.4t2kmJOU_JK_nqLQslqvoJJxLhTXBfgf-19eyNgwuaQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMMUdvS0EwQ3dMNkR2WDhHTW1YRk9fNV81blp3NEFBSkpEMnNiVlg1UVZCbDlfWTItUVdsMEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTkxMTMsInQiOjE3NzkwNDEwODkxOTAsIm1pZCI6MzAyOH0.ulmzOSUznhaUBrf33uz-4CrFn9eyHdIExGYPLnKVRxM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢短剑', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMMW1vS0EwcWxxM3VpaEV2aE5RLXpnbGhBS2praUFBSktEMnNiVlg1UVZQbVFBODJSdEdvNkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjAzODYsInQiOjE3NzkwNDEwOTkyMTksIm1pZCI6MzAzMH0.8SVhOv285zD0wOYaLFo2q8zf4a_5xQV8iWI8p-Sf-oY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢刀', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMMkdvS0ExVHBYbUhaNlQ0YWFTWEptdV9rR2o5WUFBSkxEMnNiVlg1UVZLaXVJZ0FCZnhydE5nRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumSouWIgC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzE5Nzk5LCJ0IjoxNzc5MDQxMTA5MjQ4LCJtaWQiOjMwMzJ9.wuDJocrAYkT13U4AMiRzGi51ItQnzusa5aJ-C9468e4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢短刀', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMMm1vS0ExOV8yUXJ2a1UydExEbGxiR055N2g0ekFBSk1EMnNiVlg1UVZKSDBhSzlmd1BMc0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi55-t5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjExNzgsInQiOjE3NzkwNDExMTk1MDUsIm1pZCI6MzAzNH0.iFkYTG0XngAr4etzGYvd5drfdY4ztIAprMp-rFB7hTM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMM0dvS0EycTkxd2FqUWtmTlhrZjFIY0NFOHpzOEFBSk5EMnNiVlg1UVZNajZvalM1ekZRS0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5YyV6aaWLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjM1OTYsInQiOjE3NzkwNDExMzA4MTcsIm1pZCI6MzAzNn0.BheBRC8atJJQsYtd61dmLoPJSh0_pBSKwqf9sHX5U2g.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢枪', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMM21vS0EzVGluLTJqS3J5TmQ4U29KRFBPNjdnSEFBSk9EMnNiVlg1UVZDTnFJM1FPZ2hja0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjE2NjEsInQiOjE3NzkwNDExNDEzMDYsIm1pZCI6MzAzOH0.yTEnt9O0W9uD_csXd4E9mxashMxUVA-KxqJkXFxcZl4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢矛', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMNEdvS0EzOHdkZ1AzQlhLV3hPbHJCbEYxaFpKRUFBSlBEMnNiVlg1UVZOTTEtTy1LQUFHd1JBRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumSouefmy5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzE0MTY4LCJ0IjoxNzc5MDQxMTUxNjYyLCJtaWQiOjMwNDB9.YVYReuf3lczjj-bxgdNz9GDzPeWvo4tHAE3QfMUiPh0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢棍', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMNG1vS0E0a1FnVTVlTGYyQU53aHl0UjlxWjZkVkFBSlFEMnNiVlg1UVZMSnd4VlltUHh2SEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjI5MzMsInQiOjE3NzkwNDExNjE5MjUsIm1pZCI6MzA0Mn0.a9PjxuWpMb732_ei8rIJDl_Gb3xy-OpGL1rMqx686Is.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢杖', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMNUdvS0E1T3VENUEtQ2ZqOHF3UElnNkd0OTFDakFBSlJEMnNiVlg1UVZMQkk4c0E4ME9PaEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjQ3NjUsInQiOjE3NzkwNDExNzIxNjMsIm1pZCI6MzA0NH0.4QWdV9Buu73kvITK29F7ckebp78nIXqLWXJXAQlZqx8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢弓', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMNW1vS0E1NUhZYmlKWW5tbkZORkd0VzNkemFoZUFBSlNEMnNiVlg1UVZHNEk1aWtaaXZmR0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjgzMTcsInQiOjE3NzkwNDExODI2NjksIm1pZCI6MzA0Nn0.VbYRcJc4sHJ9JcxzrqkFXNt1y9si9joziww5yWQV72Q.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢弩', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMNkdvS0E2bENUYXZrQnlBbUJQT3Atdmg5Q1ItSEFBSlREMnNiVlg1UVZJMEtFWlVuWUNMc0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5bypLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjMwODUsInQiOjE3NzkwNDExOTM3OTIsIm1pZCI6MzA0OH0.HMa0zdCFt5VT5ukAnMcuISAm9-16jK15rzSrOqtMD6U.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢飞刀', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMNm1vS0E3Y0lONFlSdXJ2YVZxT1Y0NnJCRVdrWEFBSlVEMnNiVlg1UVZKTFNkenFtbTgyakFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi6aOe5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjI1NTAsInQiOjE3NzkwNDEyMDc5MDEsIm1pZCI6MzA1MH0.B9ryYY3XZcezmlpRGKAViAybDatOFLwR59jlsOqU1H8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMN0dvS0E4SWpCZWRxQ0M3dHZXOW00LXVqZE5tMEFBSlZEMnNiVlg1UVZMZFpxbExFdmdZaUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi6KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjQ2ODgsInQiOjE3NzkwNDEyMTg3MTUsIm1pZCI6MzA1Mn0.s74At3WkQEeouAqU-AmBAMi8n1gNxM86fzmtsdmBlmg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMN21vS0E4NFk1aXpQNXV3VGdGenhnX3pIOUdZNEFBSldEMnNiVlg1UVZLNExENC1vNV9mN0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjMwMTksInQiOjE3NzkwNDEyMzEyMjEsIm1pZCI6MzA1NH0.-fc5v6fZxqo3EbqwLMBHSb5iEDgIlAV_Y8cixf5so9k.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢短剑', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlMOG1vS0EtMzI4R2V3UlZKaFZEVG92TjRwVnVsT0FBSllEMnNiVlg1UVZQZ0pZaGhfbHE2d0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjAyODYsInQiOjE3NzkwNjE3Mzk1ODYsIm1pZCI6MzA2MH0.KUVLyOkxz51bvlrcOTq0ACaGxxJvdR31F0ngIxEyp2k.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢刀', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNRG1vS1ZQcjB1UUpZZ0tyYm1SLU9iX04tTHVYQ0FBSjhEMnNiVlg1UVZBekVzcXZvZ05WVEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjA1MjIsInQiOjE3NzkwNjIwMTA5MjksIm1pZCI6MzA4Nn0.w5UDl10ArfIPlKnll5jDYWDJ-GjqTxhL8BbhAjcsIUk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢短刀', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNRUdvS1ZQODl4V05Wb2tpdWZoZGp6VHpKcDdlR0FBSjlEMnNiVlg1UVZGMmZqN0ZYcGF0aEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi55-t5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjU1NDQsInQiOjE3NzkwNjIwMTYyMTksIm1pZCI6MzA4OH0.vpfGAUobo9-TihU6GqWJINa1Jd8hdMvEG7pm1KicAQw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNRW1vS1ZRVUFBZlNCOWhGckZMb3hNaG1lR0RkR2J3QUNmZzlyRzFWLVVGUm1SRks2aFpuM2NRRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IueyvumSouWMlemmli5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI3Njk5LCJ0IjoxNzc5MDYyMDIyMjE4LCJtaWQiOjMwOTB9.zfjRbprFwFsp-tljcXxK5-U-rHv8KvACWms3wwfyg-4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢枪', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNRkdvS1ZRdmNrQ2RucXJydkNBclNVRzY0ZkVySEFBSl9EMnNiVlg1UVZNTHhqTXc2TE5UVUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjIyNDEsInQiOjE3NzkwNjIwMjczODEsIm1pZCI6MzA5Mn0.kua8VYsS_sYUviqUlPpTr2-m20hjFhX-hja0GO3njv0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢矛', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNRm1vS1ZSQk1zM3BSNEhaZGw0VFVCaTJXQm1uekFBS0FEMnNiVlg1UVZPeXQ0VWxDRjJDS0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi55-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTkxMzAsInQiOjE3NzkwNjIwMzI3MTEsIm1pZCI6MzA5NH0.8d8kB7our4nE2AHamxqortrBAoNsN4xPG9unNOaN3zU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢棍', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNR0dvS1ZSYXA2VmM1a01fczhLQ2tDWXZGU0ZTVEFBS0JEMnNiVlg1UVZIQ0hVM2ZPcDRMWEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjU2MTEsInQiOjE3NzkwNjIwMzgzMzYsIm1pZCI6MzA5Nn0.35ikV-nYzRvVQo1OcEFDrKCbpWUWRfuwIMFappbDNdQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢杖', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNR21vS1ZSdWVUeFZwQ3dPN3JmMXIwSHFmMGgtaEFBS0NEMnNiVlg1UVZHdHJ2Y0JZMUt4MEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjU2OTgsInQiOjE3NzkwNjIwNDM3NzIsIm1pZCI6MzA5OH0.cx0m7HfokxqK0nu-Y9CK9nUg8VCBU7kw7lPGmYLLhqg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢弓', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNSEdvS1ZTQjRDaEt3WS1KbC1xWS12Wk00Wjd0Q0FBS0REMnNiVlg1UVZDallsNVlZcnh6SEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzI0MzYsInQiOjE3NzkwNjIwNDkwMzEsIm1pZCI6MzEwMH0.CCnXSfAQvFwiLI-7jf3Y6mynWsQ-kvGxSNt3Fq5c4Io.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢弩', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNSG1vS1ZTYjFXbXZjaHVvdTZNbkZ4RS1QQzJ4a0FBS0VEMnNiVlg1UVZQemtrWGtPUUpvRUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5bypLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzE1MzYsInQiOjE3NzkwNjIwNTQ1MjcsIm1pZCI6MzEwMn0.8L2iR69q_d6oRSXGtULYJmw9UC5MDRDyIGS2TlLbZpM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢飞刀', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNSUdvS1ZTdGx3clozc0NCTHdLQ0NTTk40WjVFWEFBS0ZEMnNiVlg1UVZQRmxHaGtsUXdwUUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi6aOe5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjQ5MzgsInQiOjE3NzkwNjIwNjAxMzMsIm1pZCI6MzEwNH0.i-Ja6pRDd8pETcLShSTMsRpmJnFg3r2fhwj5kA5sxt0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNSW1vS1ZUbXB5RW5TQzhDcllyOHFfVkxUSzI3YkFBS0dEMnNiVlg1UVZNVXY0LXhsSlJSTUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi6KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjczMTQsInQiOjE3NzkwNjIwNzM4MjYsIm1pZCI6MzEwNn0.Qj_V0hAnuQepzOph1jarKKWJsh9sTT_RgiO4Z1ahdvA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁剑', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNSkdvS1ZVQXFWcFZHbEY2ZWdzbkFXamUtS09BTEFBS0hEMnNiVlg1UVZDVjNPOFRzN1NuZ0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjA4NDAsInQiOjE3NzkwNjIwODA2MzcsIm1pZCI6MzEwOH0.INV1TJIev13c9LV7dsW07ZhjD1IKIe0H0Nd4Zi7x5ew.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁长剑', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNSm1vS1ZVYWpaVkg5Z0JLQ1h2WEh6YWFyM1I4SkFBS0lEMnNiVlg1UVZLMm1ndFowN1BWa0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjIwMzQsInQiOjE3NzkwNjIwODY5NzEsIm1pZCI6MzExMH0.UF-jH6LMRWJ7m-dVZr--MQVKIf_c2bh1VhEmipUpvrc.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁短剑', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNS0dvS1ZVeXNkdEFkUHVlZkZheXZQSmJxcUZ3d0FBS0pEMnNiVlg1UVZQTmJVOXZ2SktRQkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjA2MjEsInQiOjE3NzkwNjIwOTIzOTMsIm1pZCI6MzExMn0.fgsroZE0RUF4AluDeyRRfK8YK7MyyjNWotsGMPVPY_A.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁刀', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNS21vS1ZWSE9qTmhpNDh5RTZMcVQ2Z0tCNFFmS0FBS0tEMnNiVlg1UVZCckNmV0lxUTRraUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTg2NDMsInQiOjE3NzkwNjIwOTc3MDQsIm1pZCI6MzExNH0.QUJwynZLmAVqDSeNnfMPwrde_sPzTBmDFOYm7Wp44o4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁短刀', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNTEdvS1ZWY0Z6ODh3TzNPLW5EakNTZ2RkajBVdEFBS0xEMnNiVlg1UVZIN2htTU5iQjhEQ0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB55-t5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTgyNDgsInQiOjE3NzkwNjIxMDM0NjIsIm1pZCI6MzExNn0.AHzhsHF9m6K8ot9R5MQ5BTf2BpWuj-T3u2Q12X5bc9E.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁匕首', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNTG1vS1ZWeUhJZEtIZUR2b3kxRDVYSnVQV3N1akFBS01EMnNiVlg1UVZJOUZXOEFidll0V0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5YyV6aaWLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjA3NjUsInQiOjE3NzkwNjIxMDg4NTYsIm1pZCI6MzExOH0.fmLSWO4BVMtBhQ0uYi3_cTE3Mj7MMulygVQtg9Zbk9I.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁枪', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNTUdvS1ZXSHRfTGRQSWJvV2plbGg3WWVvdGVlakFBS05EMnNiVlg1UVZFMEhzWFJnZE92cEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTY0NTYsInQiOjE3NzkwNjIxMTM4NzksIm1pZCI6MzEyMH0.HDvEyAuCkLGUShI-XAMv7UJNc_OJ_KgBtkRA6rQlO1Q.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁矛', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNTW1vS1ZXYnFVWjJRQk1hejMwRFBMcUtwTUxXVEFBS09EMnNiVlg1UVZOb3MtX0czMWtzVkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB55-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTMzMzgsInQiOjE3NzkwNjIxMTkxMTEsIm1pZCI6MzEyMn0.uBH12jCVsdlS2ZTda-A1fqA0O4WyYRRQ6a_8OHiCDps.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁棍', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNTkdvS1ZXc0FBZFU2elR1bXdhVFhYTUVGNzdnVEdnQUNqdzlyRzFWLVVGUXlxVW5Bb3RIUzZnRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWvkumTgeajjS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzIwMDYyLCJ0IjoxNzc5MDYyMTI0MjgzLCJtaWQiOjMxMjR9.M5l6X7qowRsGX4NzCk1rtRvm6BE2pCVNednHlJfN4NM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁杖', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNTm1vS1ZYWkpuMVRCdzE2eVNYWVpCZ1dfejJPVUFBS1FEMnNiVlg1UVZISjZGMWVkWTJObEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjAwMzQsInQiOjE3NzkwNjIxMzQzOTUsIm1pZCI6MzEyNn0.auXZMCjUC1YObz8TCjFVv1kAqA9p5_o_N--3XpXkVT4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁弓', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNT0dvS1ZYdS03aU9qa3FWU1BHN2FhUzg4OVk1ZkFBS1JEMnNiVlg1UVZNbUM5U0x2aEplRUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzE3NTUsInQiOjE3NzkwNjIxNDAyNjcsIm1pZCI6MzEyOH0.bDw0hp5ch_pT5h8PNyk6SXRNfNPnLbip0U5pWiM7_yI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁弩', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNT21vS1ZZRlIwUWRwLVZFQzM5T0hGdHNsQUFIZWJBQUNrZzlyRzFWLVVGVEtfZTdFZDhOTUNRRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWvkumTgeW8qS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI3MjE3LCJ0IjoxNzc5MDYyMTQ2MDI3LCJtaWQiOjMxMzB9.LDkmxpGnK58Od5i_Y5nJGhToIvnhSExTnqg6dOSTAkg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁飞刀', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNUEdvS1ZZZndOY0tQUm9pN2JYV0E5X293RHpEc0FBS1REMnNiVlg1UVZPMmZONkJEWjUxM0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB6aOe5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTg1OTYsInQiOjE3NzkwNjIxNTIyMDUsIm1pZCI6MzEzMn0.YjEpOpWS-CmxqggVX2kcKzLvyJ7d9Numvo0Kw-jZfSY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁袖箭', 类型: '武器', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNUG1vS1ZZMlV4ckVSS1V2REVvZWZIbmgxTEFiZkFBS1VEMnNiVlg1UVZEeVgtOEFBQVZpdDdBRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWvkumTgeiilueurS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI1MjgyLCJ0IjoxNzc5MDYyMTU3NTY1LCJtaWQiOjMxMzR9.hBDWFgmAC8_sTywW7Th0GX7iVMDyXm7hgCwERhOyV7Y.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁剑', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNUUdvS1ZaS2VTXy1EZ1RFNnZKaldpSHpleW53NUFBS1ZEMnNiVlg1UVZPNUNWSzd2NW5DY0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTU5NTksInQiOjE3NzkwNjIxNjI3NjQsIm1pZCI6MzEzNn0.ZmkePmg3EXGst2f9H-K6mbsXwV5YPpkVOtGdGhPPrew.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁长剑', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNUW1vS1ZaZThxTFdWOXFYN19pWl8tZUNOdUM3T0FBS1dEMnNiVlg1UVZET2w1WnE2NHNWRkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTUyNjAsInQiOjE3NzkwNjIxNjgxNjgsIm1pZCI6MzEzOH0.t_qjutIiHrnsh9rWmfTce4irPKjJuzPaHqVaICKgHhE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁短剑', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNUkdvS1ZaeDJlVHJpYmJBVE51Y0MwVGRHZGQ1dEFBS1hEMnNiVlg1UVZBZTg2dVNMN1Y5YkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTQ4MDksInQiOjE3NzkwNjIxNzMwODgsIm1pZCI6MzE0MH0.8w0kAj8Po2bo4H6LCPM1xPUZSfHcDskAp6Anb-UWn2A.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁刀', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNUm1vS1ZhSDVuYUdSRDdveEVYeEc0akxvRHVBSEFBS1lEMnNiVlg1UVZCYmlWRmZNNkVUYkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTQwMTAsInQiOjE3NzkwNjIxNzgyNjQsIm1pZCI6MzE0Mn0.TYpIL57_JuDgrmrphFGqeGL_ldaZ4l5KKYWbnnA3pbY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁短刀', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNU0dvS1ZhYkVwX3htZmVsT3VlWnI3S3BlQXRSN0FBS1pEMnNiVlg1UVZPalhPZmVzRnA1OUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB55-t5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTYyNDAsInQiOjE3NzkwNjIxODMzNDYsIm1pZCI6MzE0NH0.0naDOlqg6RSMTHZGYH4FHJFUlXe3wcBMu3y8Z8oTEmU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁匕首', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNU21vS1ZiSkxqdm40VXI3UmJ0MjMwb2hqUXczZEFBS2FEMnNiVlg1UVZQaEREOEJLeVE2bEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5YyV6aaWLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTUyMjEsInQiOjE3NzkwNjIxOTUwOTQsIm1pZCI6MzE0Nn0.VcZo9MctjsJ6NLJVG3uyVA7uHb69171ManlorOyYILk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁枪', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNVEdvS1Ziald6MEFMZWlvM09XQjlYQVBwdkZiZkFBS2JEMnNiVlg1UVZOZWMxOU9raDNmOEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTE5NjQsInQiOjE3NzkwNjIyMDA4MTksIm1pZCI6MzE0OH0.hD5f9-x4AzMnFU7dkh9f9mzezlv66cA-c9T7pnlu7NM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁矛', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNVG1vS1ZiN1E3OFI1R1dmdVV3U3BaUDFiY0wyT0FBS2NEMnNiVlg1UVZPbjRLZndzYUw0eUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB55-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMDk5MTQsInQiOjE3NzkwNjIyMDY1MjQsIm1pZCI6MzE1MH0.C96FyVAiPa460GIr7X1QtPhM5le11dF_98LpKytYl0s.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁棍', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNVUdvS1ZjU3BrSm9DS2VzWHBqcjBYR0hYeFdhakFBS2REMnNiVlg1UVZPMXpiM3hQMlROOUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTU2OTUsInQiOjE3NzkwNjIyMTI5MzgsIm1pZCI6MzE1Mn0.oiK1XrCGNeqi1kbrQUurJfbesvf3Q-4fn9TaA6OJJo4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁杖', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNVW1vS1Zjb3JXSG5JOGdwZ2RyY0RwbFlLckRCMkFBS2VEMnNiVlg1UVZQcUVodHR5S19XLUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjEwNTcsInQiOjE3NzkwNjIyMTgzNDAsIm1pZCI6MzE1NH0.Zm7d7muUBdBcvhc22iR-YoY9gTk0Xu_ubTJ_Ybeb75o.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁弓', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNVkdvS1ZjLVNjaDJyV0ZuOW1Fb3lOUG1NUzRSTEFBS2ZEMnNiVlg1UVZHb0FBUVJubkpsVjFBRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IueOhOmTgeW8ky5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI3OTAzLCJ0IjoxNzc5MDYyMjIzNTEwLCJtaWQiOjMxNTZ9.K1HqWe4Q6f2xBlDjdhUrQo-T2wbXD2s_nvRXuyrGiIw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁弩', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNVm1vS1ZkVTNaU2dhOV9BX0FrM0RCdzdkRmNLcUFBS2dEMnNiVlg1UVZCTExmcXhEaGs3dEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5bypLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjYzODEsInQiOjE3NzkwNjIyMjk0MTEsIm1pZCI6MzE1OH0.i1LCyxaHpJ38_ytlzxmAxZS_LNgCs5v-g286DTjZBEs.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁飞刀', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNV0dvS1ZkcGdndjRzV19VRGdldVdJRXRBZ3VfaEFBS2hEMnNiVlg1UVZGRTRFcEJvM3BWa0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB6aOe5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTQ5MTAsInQiOjE3NzkwNjIyMzQ4NjQsIm1pZCI6MzE2MH0.8li8APx4S0OSIx-ALnVPs65LzD83hEEQnrH9jrxiXIs.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁袖箭', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNV21vS1ZlQlBUdGhWeGwtdDQ0ZEItelBwLWpPYUFBS2lEMnNiVlg1UVZBTU5fZzZXTV9pTkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB6KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTgxOTgsInQiOjE3NzkwNjIyNDAzNjcsIm1pZCI6MzE2Mn0.qkbOSHiqqjdVQ3V_cS3EEItVmxUwBZixvqvvtTxOeSo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金剑', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNWEdvS1ZlWE1yU1FHVkVDY1RpcndXOFoydktQYUFBS2pEMnNiVlg1UVZOTHFOWWhUbWU1Z0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTAxNTcsInQiOjE3NzkwNjIyNDYwOTgsIm1pZCI6MzE2NH0.33iv9_lOqBKDm6TTM4RDIz0nYZkJ1eEFH_MPdI98Fxc.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金长剑', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNWG1vS1ZmRHEzVTRUUGZSZWsxNXZMcUo3ODVRb0FBS2tEMnNiVlg1UVZKZWVrNU5IZmgzSkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR6ZW_5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTEwMTgsInQiOjE3NzkwNjIyNTY5MTMsIm1pZCI6MzE2Nn0.QQe9S1AbtrMv87qI8e3hSsiWjfy8k47DnWUL09xkvFk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金短剑', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNWUdvS1ZmWTB3MGcyX055TEl2eXBnVkhVd3FqYUFBS2xEMnNiVlg1UVZEeU5kZWVwbWNSVUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR55-t5YmRLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMDg4NTAsInQiOjE3NzkwNjIyNjI2NjMsIm1pZCI6MzE2OH0.NmKX6hUnf0A4PilpdLDlLVW91w_qxQMu_VwAiqRpCDM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金刀', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNWW1vS1ZmdklISlBRRWFkRkZHRG4yLVJoX3E4UUFBS21EMnNiVlg1UVZGOUg1WmFrWlgwM0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5YiALnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTIxNzQsInQiOjE3NzkwNjIyNjc3MzUsIm1pZCI6MzE3MH0.drHWLflzJvHItHj0AGLOeaECcWppQ0ZaKOlHdtY_chM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金短刀', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNWkdvS1ZnQUJFX1hHNDZ4eVV4TEdHNnRHVURsOHNnQUNwdzlyRzFWLVVGUXFrbGRDUGZDSGR3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuS5jOmHkeefreWIgC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzE0NTk3LCJ0IjoxNzc5MDYyMjcyNjkyLCJtaWQiOjMxNzJ9.CYueM7-2JzvR2Oc3bTfo9is5vajzt_7UZ3EnISKdu-4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金匕首', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNWm1vS1ZnVURVanlITFlVb29ra2VhMnIzNTZQR0FBS29EMnNiVlg1UVZBS3daY1RaLWdaQUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5YyV6aaWLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTYyMjcsInQiOjE3NzkwNjIyNzgwMDksIm1pZCI6MzE3NH0.b8bCXRr5T08ZmZiDBQWdquXkJmlzSKUQc97W9ItbuL4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金枪', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNYUdvS1ZnNXYxTF9RdEFwX3NxSlpndk5DSTIyZ0FBS3BEMnNiVlg1UVZHWUNMYmpkbWotTkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5p6qLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTMwNTEsInQiOjE3NzkwNjIyODY1NjgsIm1pZCI6MzE3Nn0.ida2-C9cVjO_Xdr1zWyCjUotjw_kh1Eh3x3nDZuNdpI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金矛', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNYW1vS1ZoUUY0WlE4dm14cDU3SzNjaEZKbFBMdEFBS3FEMnNiVlg1UVZJSzZXNFJ6UkVQQkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR55-bLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMDgwNTAsInQiOjE3NzkwNjIyOTI2MjEsIm1pZCI6MzE3OH0.wO3DtkofMjUiF-0YYTXuJbuvKH8edo4X-kARfgVauIs.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金棍', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNYkdvS1Zobi02YldKNU1makR1ODhPcUQ3eU9FWEFBS3JEMnNiVlg1UVZISTk0Z2xLeVczdEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5qONLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTM5MDEsInQiOjE3NzkwNjIyOTc3NjIsIm1pZCI6MzE4MH0.sKoknXg--JC0oWIXQLQKMuI4QAJZfxrPLpjFDR1dv7o.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金杖', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNYm1vS1ZoNFdNUWdhX19UeE0wWVU0aGFhejB5MEFBS3NEMnNiVlg1UVZIU3gtY3ZvMEp0eEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5p2WLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTUyOTcsInQiOjE3NzkwNjIzMDMwMzQsIm1pZCI6MzE4Mn0.nwp_ZlAHh91xIElWXFIGEI2iMsrA80N2IzZvwgv9P-s.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金弓', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNY0dvS1ZpU3RoZjdLSWVldTFnenBjZnM4Uk45YUFBS3REMnNiVlg1UVZHQjc1WHJ4NnEteEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5byTLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjU5ODcsInQiOjE3NzkwNjIzMDg2MjMsIm1pZCI6MzE4NH0.z_o2zZBBaozNfibl0R0Ft-7vMM_WGRxRuKC9qAtG7UU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金弩', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNY21vS1ZpeWpDeUk1MVZwYnFPeUl3LWlZNnQtVEFBS3VEMnNiVlg1UVZJejZKUWlNaS1qUkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5bypLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMTc5NzEsInQiOjE3NzkwNjIzMTcyOTgsIm1pZCI6MzE4Nn0.YO_FvgZx1INMczqkEeUwoQOZ4G3zusH7Rt30jZhG-Sw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金飞刀', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNZEdvS1ZqUDZodEt0dlBrUUFBRVV3c2dTUExhSmZBQUNydzlyRzFWLVVGU0QxS0l5MTNIdVp3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuS5jOmHkemjnuWIgC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzE1NTUxLCJ0IjoxNzc5MDYyMzIzNzc2LCJtaWQiOjMxODh9.8nYiOsyHCOGcDTwlQiMGN2cpChcNGpiLcqjC5GH84UM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金袖箭', 类型: '武器', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNZG1vS1ZqaWo3NndQX2g2VG5tb09LYlBzRWIzQkFBS3dEMnNiVlg1UVZCM0VvZUQxcktkZ0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR6KKW566tLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMjA5NDMsInQiOjE3NzkwNjIzMjg3MzQsIm1pZCI6MzE5MH0.dZEVvTSojzEJZSR8c84yvbX_pBYdssa6XE9t33jNy74.png' },
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
    { 名称: '粗布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNaW1vS1Zua2d5Q3FwRTduLVRtX3lQZ1pic2FPMUFBSzZEMnNiVlg1UVZOZlBaVWtmWTE3WUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57KX5biD6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozOTE0NzEsInQiOjE3NzkwNjIzOTQxMjUsIm1pZCI6MzIxMH0.slf-lBxj1Z5RrtpPE2rOlAJi-s70XBObXCBjvo0Ug_8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布长衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNam1vS1ZvaFM0dU5rNE9pQm9jaGhqYUJjZnQ4dUFBSzhEMnNiVlg1UVZBU19vTmFwVEx0ZkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57KX5biD6ZW_6KGrLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzEwNjYsInQiOjE3NzkwNjI0MDkyNTIsIm1pZCI6MzIxNH0.uMH1euxvA3T3PorsIMJTYLJWdqdNZ3ag2cFUEe2w4w4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNa0dvS1ZvNFZNTk5SdFUxNS1rZExXSnl5RTBaNUFBSzlEMnNiVlg1UVZIYWNZSTVfSk5XWUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57KX5biD57uD5Yqf5pyNLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjgwMTQsInQiOjE3NzkwNjI0MTUyNDIsIm1pZCI6MzIxNn0.vjg0zCZwTxnPO4xKg2Hgc3DP13V0cOLHvTgSSmdVJjg.png' },
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
    { 名称: '布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNcEdvS1ZzaGNNNGVreWNLUzZudkliZjBxcDlva0FBTEhEMnNiVlg1UVZFNUd5SWhGZzg2dkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5biD6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozODMwODEsInQiOjE3NzkwNjI0NzMwNTEsIm1pZCI6MzIzNn0.m2U3IrvCZGCHckAdqwOV0sWRUpndKeRWv9qc0aiPlAk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布长衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNcUdvS1Z0VW52VlhLeVdISzNEdGVqdzF4TWtVTUFBTEpEMnNiVlg1UVZGek5kWmJpNjdKS0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5biD6ZW_6KGrLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozODI1NTAsInQiOjE3NzkwNjI0ODYyNTgsIm1pZCI6MzI0MH0.tZP54l6X4NE1znEm2vc1dxRh6ZHaXf0p5jKjBBRg6q8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNcW1vS1Z0d1NzeUhtYlU0RmlrSzVhYW5PMjVPd0FBTEtEMnNiVlg1UVZHXzM5WTdCNTZwcEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5biD57uD5Yqf5pyNLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzk2MTMsInQiOjE3NzkwNjI0OTI0MjUsIm1pZCI6MzI0Mn0.CBUdPayUk6D9ZYznRa8QBhlQI95D8rZN1VvCMaz4g5o.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布长裤', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNckdvS1Z1Rk96MVJRMVNUbHVrRG1FMVVyOEpGcEFBTExEMnNiVlg1UVZOdGluNl9HdW9sSkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5biD6ZW_6KOkLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozOTM1NzEsInQiOjE3NzkwNjI0OTc1OTksIm1pZCI6MzI0NH0.vW3vIcxIHWP8jn-EEIItjjWix7Y4lmcjIB7hVlu5XK0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNc0dvS1Z1LWJ1U0tLVFY3SE5ZU2NBcUtCY19aM0FBTE5EMnNiVlg1UVZNM1oyTWlSUHpLQkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu5oqk55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDgwODksInQiOjE3NzkwNjI1MTIyMTQsIm1pZCI6MzI0OH0.1-y_WiiyjA52bo3auYrAfBN-tPl8GSAaZaiAHZWEQQA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮软甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNc21vS1Z2WDZ1U3hIZHVpVWFWY19OUTVRQm1UYkFBTE9EMnNiVlg1UVZOSkI3dGYzZ0R5ckFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu6L2v55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDk5MjMsInQiOjE3NzkwNjI1MTc0NjQsIm1pZCI6MzI1MH0.JhAZivO-eovP4iTtGGGEknoNKyLVdjCs1ErNX6jZ938.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护腕', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNdEdvS1Z2c1M5SGd3NGJYa2VncEZvVU16c0JuNEFBTFBEMnNiVlg1UVZCN01TTHRRdzRmbkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu5oqk6IWVLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTU2NzQsInQiOjE3NzkwNjI1MjM1NzQsIm1pZCI6MzI1Mn0.zIEEiTfI2PwZIStKAVkfS0w8hZeku4CauePvjE1jKNA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护腿', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNdG1vS1Z3RXFzQTFUNWNlRVVXNlBweXE4dF9iRUFBTFFEMnNiVlg1UVZDLV9Fd2F5VGJtQ0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDY2MzksInQiOjE3NzkwNjI1MzAwMzUsIm1pZCI6MzI1NH0.iBIlghrPWXeIT6frfgG8FbHsvrixxcy8E99xZ7pqv00.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护膝', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNdUdvS1Z3ZE5tTDlGOGM1QXRDMHo0bi05RnRMQkFBTFJEMnNiVlg1UVZNU25XRVJZVU9xcEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTU5MTIsInQiOjE3NzkwNjI1MzU3OTQsIm1pZCI6MzI1Nn0.zHMXDE4Ijq5OSQQIFFow9xMOHO87vua4Jk9JO15ZpzM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮靴', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNdm1vS1Z4aV9ETmNHb3FjWnJoVEN3X1hZREhmN0FBTFVEMnNiVlg1UVZHczFWVERYdVI1NEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu6Z20LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTU3MTIsInQiOjE3NzkwNjI1NTMyNTYsIm1pZCI6MzI2Mn0.TX4YnvswCD7h_2gId2QSGHrvGSvbH6GjsAZVchXtgAc.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNd0dvS1Z4NzRQYUdwNWYzSjU4TGduMEE2dExVTUFBTFZEMnNiVlg1UVZEOEVaRXRVSG1UMkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi55qu6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjA5MzEsInQiOjE3NzkwNjI1NTkwMzEsIm1pZCI6MzI2NH0.36z0uJw80nyEE986GE6jdkK6Z97IRby3GTpuwXUx8bA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁盔甲', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNeW1vS1Z6OENJMzZudzI0ak9naHJJdndnRVFOZEFBTGFEMnNiVlg1UVZHb2UzNzRvRy1rU0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB55uU55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTk3MTIsInQiOjE3NzkwNjI1OTE5MzUsIm1pZCI6MzI3NH0.Mt_18fJJBGd7_OQKYR6Q_IRyDQfGo9XVfspULd-FLKI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护甲', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNekdvS1YwUWxRZjBsR1gyckxsZEV3bDZoVGpNc0FBTGJEMnNiVlg1UVZISVQ4WG9LbEJGekFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5oqk55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjAxNjMsInQiOjE3NzkwNjI1OTcyMTMsIm1pZCI6MzI3Nn0.6FQipHdkwxJNQOoQ2OPtb0vJNm6EMWCtY-YWSB7oYMw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁软甲', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNem1vS1YwbzEtd1hadkh5WFNwbnBpb3NYb0JXMEFBTGNEMnNiVlg1UVZEOGNDWnhZZzM4LUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB6L2v55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjc1MDQsInQiOjE3NzkwNjI2MDI3NzgsIm1pZCI6MzI3OH0.1FgMD2Xn55KOQsMg_Nk8CcglIfuDvRT6cTbTMzsxkTI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNMEdvS1YwOVl1M3FTc3ZDSVhSLUNyNFdWdHhnUUFBTGREMnNiVlg1UVZQQ04ybVprZ21oZEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5oqk6IWVLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDU5MTYsInQiOjE3NzkwNjI2MDgyNTcsIm1pZCI6MzI4MH0.10HSimAYCjDfOyBOeuPlk80a7Q5eHYS-ctPb-eh2HzI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护腿', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNMG1vS1YxWTlSaXRsdkZyVUp4YW5nekctVmYzMkFBTGVEMnNiVlg1UVZNWGt3M1I2am85UEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTA4MjUsInQiOjE3NzkwNjI2MTQzNzIsIm1pZCI6MzI4Mn0.is1xYFEmbf7CtLk9Vk0gNV1Fnb_VLike4EQqWgzn5pY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护膝', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNMUdvS1YxejVnZG41TEJGZTRtbHJoYmFZcDBzeEFBTGZEMnNiVlg1UVZNMnZ1V0FvTnlSeEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTQ3NzgsInQiOjE3NzkwNjI2MjA4NzMsIm1pZCI6MzI4NH0.8QENHn_quCw2ds6GZha9Vcm9zb60WoYPLOOD5_nFCn0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁头盔', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNMW1vS1YyVkhFRkxDWWZqNjVCWHBKOU1vamUydkFBTGdEMnNiVlg1UVZCRjlWb3NXQTZpSUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5aS055uULnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDkyODMsInQiOjE3NzkwNjI2Mjk3ODgsIm1pZCI6MzI4Nn0.2gX39C9zkgq_btMek8V24B5y5OJBK0qDnAxI7BLO-zQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁发冠', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNMkdvS1YydHc5YjdxLTZYYlhjUndDN1RRRUZEZUFBTGhEMnNiVlg1UVZHWFM2aE0xdWlUNkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB5Y-R5YagLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTk4NzUsInQiOjE3NzkwNjI2MzU1NTIsIm1pZCI6MzI4OH0.0Va_ZVb6XeFFEREgyXC5r8Jg_R-6DzPLt96xBqdoWow.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护甲', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNNW1vS1Y1TDBUeFRYUkNjMVhwSk9rLVo3NW1oMkFBTG9EMnNiVlg1UVZCTTl0S2VteTVQUkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5oqk55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTk3NDksInQiOjE3NzkwNjI2NzUxNTUsIm1pZCI6MzMwMn0.b64CwD0t8JVATc6rty4feqvtw_wi9zjXqhH9pWL_rHU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢软甲', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNNkdvS1Y1anAyLVBuemR1TGY5T0FGaGU3SWl3SUFBTHBEMnNiVlg1UVZQTFlycHJRWTE1akFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi6L2v55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjM2MDgsInQiOjE3NzkwNjI2ODEyMDMsIm1pZCI6MzMwNH0.VXudLzF7ncOd_xzwHv2P9J00ctzkteWUrp68RSfoPow.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNNm1vS1Y2SXAxS0ZMOUMwQ01BQUJKNmJ4Q01fTDhnQUM2ZzlyRzFWLVVGVDQ5akN5NDBhT0lBRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IumSouaKpOiFlS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzM3MzA1LCJ0IjoxNzc5MDYyNjkwNTAwLCJtaWQiOjMzMDZ9.kuURtAoa-UYDhZv3FRr87NzCHheDcjEMzw7IRXvNE60.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护腿', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNN0dvS1Y2ZFVTei1LcVZUWEQ0NVpOQXV2bGUzX0FBTHJEMnNiVlg1UVZEdzA3XzRFMUpVNUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDIzNjIsInQiOjE3NzkwNjI2OTU4NTYsIm1pZCI6MzMwOH0.wbiXaHKIB4CjdFFGsl2WOFUpC7MQPg1ythrrjSyPzNY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护膝', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNN21vS1Y2eHItZHpzLWdUTWpZNHBYOExxa2k4T0FBTHNEMnNiVlg1UVZHMHUxSTBXWG85VUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDU3MzksInQiOjE3NzkwNjI3MDEyMTQsIm1pZCI6MzMxMH0.XbhNihJy-XdVAYNsjBDLCJq0klhadXwh1qtgRjNr558.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢头盔', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNOEdvS1Y3SlNxNjF2WFB1THI3OFVFQnpxNk1HTkFBTHREMnNiVlg1UVZKR1g1SVhLQ3ZIOEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5aS055uULnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTA4OTUsInQiOjE3NzkwNjI3MDY3MTksIm1pZCI6MzMxMn0.Z9jGkGn0GjnNLAhb7ZJkWGJhWWIgkA8QiuUk70W-LSQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢发冠', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNOG1vS1Y3ZHJqclRjeDJfc2drLUtYcldzaGVGekFBTHVEMnNiVlg1UVZMemxnUzZVSTJDM0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi5Y-R5YagLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjIwNDgsInQiOjE3NzkwNjI3MTIxOTYsIm1pZCI6MzMxNH0.dKj1mlK3KuihH4ACkxsrKzienwDxEHV8zVXx24R7Zpg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢盔甲', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOQUFGcUNsZmxlRC05RHhLb0JGV2pyVjdvbmRsdmNRQUM5UTlyRzFWLVVGUk1WalNydWJPUXhRRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IueyvumSoueblOeUsi5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzUzNjI3LCJ0IjoxNzc5MDYyNzU3Mzg3LCJtaWQiOjMzMjh9.yshCzHWmg0aZJZzD-8kE7n8aTEFGXJ6Z6xRnQPGMI_U.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护甲', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOQW1vS1YtcTNmQUFCYy1ZSGpITWV2YURZaTN4bjN3QUM5ZzlyRzFWLVVGUlR4ZkxOZ3lFbV9RRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IueyvumSouaKpOeUsi5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzQ0MTMxLCJ0IjoxNzc5MDYyNzYyNzQyLCJtaWQiOjMzMzB9.BAWprf0nAHi7zzR2uWZPZaJ0ksrv4eFBh8L1qZeyi1A.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢软甲', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOQkdvS1ZfQWtKRFRKaFFBQjBBeDcxb1JuVzUxdmpBQUM5dzlyRzFWLVVGUmFOWVJ5bHRHV1B3RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IueyvumSoui9r-eUsi5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzQ3NTE2LCJ0IjoxNzc5MDYyNzY5MTU5LCJtaWQiOjMzMzJ9.laiUMe22OTnhG7T-_v_WcPsVn-lpT0PrzZFg1spG_kE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护腕', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOQm1vS1ZfYXY2dzR2Vl9jdnRfeWI5M1RPQUFGOW13QUMtQTlyRzFWLVVGVFZVRW5WaXFjM3BnRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IueyvumSouaKpOiFlS5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzI0NTQ4LCJ0IjoxNzc5MDYyNzc0Njg2LCJtaWQiOjMzMzR9.PzRs5UGt3d7_jWVzF_CZLMaN5EZFVJ9IiNWyhYed-QE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护腿', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOQ0dvS1ZfdWNIR1JRekx2cW5ENFd5LWZDNktVQ0FBTDVEMnNiVlg1UVZMZUhKcUVIZ0U4UkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDEzNDksInQiOjE3NzkwNjI3Nzk4NTEsIm1pZCI6MzMzNn0.OoLVaAFIW5ApqRF7f6_rcjcf5j7Hoi4g31XR52sBsUU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护膝', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOQ21vS1dBRU9tc2NfWHJ6VzZxd0VqZlVRUHlXYkFBTDZEMnNiVlg1UVZFWVRpZExrdHg4ZEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzUyODksInQiOjE3NzkwNjI3ODU2ODQsIm1pZCI6MzMzOH0.DZNJh_gRx75i01sc22HHYZb9NBpnNbh-avQ3dOAUDhk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢头盔', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOREdvS1dBYVpUU3Z1VzkyeVkwLVZkMVlXc3hySEFBTDdEMnNiVlg1UVZLQ0JoRmd4ai1uWUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5aS055uULnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozMzU4MjYsInQiOjE3NzkwNjI3OTEyNDcsIm1pZCI6MzM0MH0.5OG9udJjkzka4Z4axnZx8qP35PuV4YEwEJ8W2QvVy38.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢发冠', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlORG1vS1dBenhoYnhKM01CdDBoWTRISzdKZjZ1YUFBTDhEMnNiVlg1UVZHRWRhZHNZbGNIbEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi5Y-R5YagLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDI4NDcsInQiOjE3NzkwNjI3OTcyNDMsIm1pZCI6MzM0Mn0.qScVirxLtVCb_TYL0eTMfaL3LYs_pk-6Q43PKhZjfcM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁盔甲', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOSEdvS1dEY1FlZVBRNS1XclU0akcwdzc4UnZyNkFBSURFR3NiVlg1UVZLN1QyYXlrLU94U0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB55uU55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTYzMjgsInQiOjE3NzkwNjI4NDAzMjQsIm1pZCI6MzM1Nn0.X-1taBiIfVzt8v3VnhBoj6JkZetGlAntw0HviPBXfs4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护甲', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOSG1vS1dEME5lUFBEcE4zNkd3djFiaWltS01YTkFBSUVFR3NiVlg1UVZQQ2JvemtvUmU3R0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5oqk55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTI3MTgsInQiOjE3NzkwNjI4NDU5NjksIm1pZCI6MzM1OH0.XWHKGIezllcaMLTpSFFRxYq12ml_v3jBoP2PT2iwExk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁软甲', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOSUdvS1dFT3dEWlF1amlXbXZ2UFNDY01fZkhSQUFBSUZFR3NiVlg1UVZDS2tGNkpoNDBBSUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB6L2v55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTAzMjMsInQiOjE3NzkwNjI4NTIwODEsIm1pZCI6MzM2MH0.TGUzCWWobhSnDrfFgyGKDLkknnG9HzzTp_yOOfNIu4E.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护腕', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOSW1vS1dFbXRsYW8tNDdxVFN5Wk95aWdmVmtHd0FBSUdFR3NiVlg1UVZCSk01QmJ2UUJlOEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5oqk6IWVLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDU2NDEsInQiOjE3NzkwNjI4NTczOTUsIm1pZCI6MzM2Mn0.QjolGapkYMb33F7qvzOJk7XnjZWaPfyTZs5FolpVNkw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护腿', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOSkdvS1dFNGFUZklEVDRIT09fUTdKVFFaMDgxR0FBSUhFR3NiVlg1UVZBS1pVLTAyampfS0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDQ4NjcsInQiOjE3NzkwNjI4NjI5MjEsIm1pZCI6MzM2NH0.FRhuVCbxAAqse7ifNq9RCz44KKCGJXupFWTrVplmAbQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护膝', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOSm1vS1dGalVyaXliUzEtRjBrWVpvTlBVMnhULUFBSUlFR3NiVlg1UVZHaW5ORGFJSWpSMEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDY4NzEsInQiOjE3NzkwNjI4NzIzODUsIm1pZCI6MzM2Nn0.xTGoUg8EMOHe4mezf819UAZdlU0mCia37paKlSDiXK0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁头盔', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOS0dvS1dGM2IyZ1FEc2gwY19tZ2VLWGNTQWFlS0FBSUpFR3NiVlg1UVZFRjlwR3daT0x6NEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5aS055uULnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDg5MjcsInQiOjE3NzkwNjI4NzgwMDAsIm1pZCI6MzM2OH0.WfEprCsN4J8XaQY69GpIvQqNbjVZpHWbWitjT5mAsH8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁发冠', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOS21vS1dHTzN1QV9yQ2NtZnhCM1JMWlEwMXpQOUFBSUtFR3NiVlg1UVZFOFFjRmRfeXo4dUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB5Y-R5YagLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjIzNjIsInQiOjE3NzkwNjI4ODM3ODgsIm1pZCI6MzM3MH0.N5gnnoeYSZiAcCEbE4337VvUzXblQAmF4MpYiTw52tA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁盔甲', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOT0dvS1dJc3AtemliVlRTdElyY2RWUEx6T05qeEFBSVJFR3NiVlg1UVZINGhhMENsck45WEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB55uU55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjQ1NzUsInQiOjE3NzkwNjI5MjQxNzQsIm1pZCI6MzM4NH0.826AZR3ifJQiDJE9qxuCyN6A8Qro84-P3qte02xlOuY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁软甲', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOUEdvS1dKdnFPV3FlYWxXT2pZcDBEU2tLT2g4M0FBSVRFR3NiVlg1UVZBZlQ2T042ZXpoUkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB6L2v55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjA1NTYsInQiOjE3NzkwNjI5Mzk5MTQsIm1pZCI6MzM4OH0.g3xkFQBgWgqN5LDDGkQ8lU34qzbDK4nDcsIEpHl6gBA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护腕', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOUG1vS1dLRUxtRzU3SVJ4YzJoemxsNVIzQVFkZUFBSVVFR3NiVlg1UVZPaXV5Y202RVdHS0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5oqk6IWVLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNDE1NzEsInQiOjE3NzkwNjI5NDU3NDYsIm1pZCI6MzM5MH0.VkDHSq-cFOMG258MRlLfWxiK4t4uwSiTU6cWC1ZJ854.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护腿', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOUUdvS1dLalp5YTZHc3hhTXZlTmZrYXlrUVhQeUFBSVZFR3NiVlg1UVZLbjZZS0VMaDNrZkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTA5MzMsInQiOjE3NzkwNjI5NTI2NDcsIm1pZCI6MzM5Mn0.D_ccJJg7TytH-A1Rk2MQoNsC5c4fdFtQpd9vzdjHlak.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护膝', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOUW1vS1dLMmhTWGNqTUR5bnB4am1BU3VGXzlLTkFBSVdFR3NiVlg1UVZQWDQxZld4Rm80OUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTQxMDgsInQiOjE3NzkwNjI5NTgyMzUsIm1pZCI6MzM5NH0.MHE_986bnVrWQPQJAJaQemucDLKrQYXZDnbzwif0_qc.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁头盔', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOUkdvS1dMT3B1RVN5TDJNSTR2ZWtHQlU5TmlSRkFBSVhFR3NiVlg1UVZKc1NsMm1OdGNHeEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5aS055uULnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTEzNjIsInQiOjE3NzkwNjI5NjM0NjUsIm1pZCI6MzM5Nn0.s-zys642jNBn5onwk7FMkH3O1tYsQsQAxsYGY_lMYYo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁发冠', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOUm1vS1dMa3RzNVdoeE1DVkMyaXR1T1FYODhnNEFBSVlFR3NiVlg1UVZKN2lTa2dCMVhvVUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB5Y-R5YagLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjEwNDMsInQiOjE3NzkwNjI5NzAwOTQsIm1pZCI6MzM5OH0.AHxGXM4fowaqbo3CsS8Xhy32-r-VdWSh2ZuoTJhh42g.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金盔甲', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOVkdvS1dPU3RZejU4U0dhU3dVbHFvRm03UFZrNEFBSWZFR3NiVlg1UVZHblA2OGVFT1ZHN0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR55uU55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzY4ODMsInQiOjE3NzkwNjMwMTMwMjcsIm1pZCI6MzQxMn0.j6MglRzC0VlHu5022YxxjFqRwbetg804N7UMJVL3IZQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOVm1vS1dPbEJHNzdPcmVlM1o2ZDB6dkowZjkzT0FBSWdFR3NiVlg1UVZGUVl1LVZ2bmp6U0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5oqk55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzczNzYsInQiOjE3NzkwNjMwMTgyNjEsIm1pZCI6MzQxNH0.7G_Ruvq0XLTadiMOr2uNH9Q65GiFibqokiSLDtVywTI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金软甲', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOV0dvS1dPLW1fZzVoUXZRdFJnTzduZW1Nb21TVEFBSWhFR3NiVlg1UVZQY2w3bWJHQXNwaEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR6L2v55SyLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzg1ODMsInQiOjE3NzkwNjMwMjM3OTYsIm1pZCI6MzQxNn0.3661fxwqaD_lzn603PQieLLLeyXVurB8o5fhIUvB4OQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护腕', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOa0dvS1dzTXhXZ2dJb3lBZHVPSlFQSkZabVllM0FBSkFFR3NiVlg1UVZCV0xwTnp3WGZNUUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5oqk6IWVLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNzU1MTAsInQiOjE3NzkwNjM0OTIxMTAsIm1pZCI6MzQ3Mn0._PJF2VkrnzmJl0fT11nUjk9OEifxJer9dB1UiB-mDns.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护腿', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOWEdvS1dQcHo2ZWVKSTZubGdGQ29YT2tsQnNRWUFBSWpFR3NiVlg1UVZNdE9pOXhzU1RCWUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5oqk6IW_LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjkwNTgsInQiOjE3NzkwNjMwMzQ3NjMsIm1pZCI6MzQyMH0.8g-dLoz83PEvAwDSi_ajrCp6givBBKL471OrvRAq4kA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护膝', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOWG1vS1dRQUJEa1VGVTNfTEF5Ymwza3hzaE9VYXR3QUNKQkJyRzFWLVVGUUFBUU5BYjktWDg5TUJBQU1DQUFONEFBTTdCQSIsImUiOiJwbmciLCJuIjoi5LmM6YeR5oqk6IadLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjk1MzcsInQiOjE3NzkwNjMwNDA4MzcsIm1pZCI6MzQyMn0.7y2AZUeNldzyhPKNCXavXAWWMDX-MjVHXz9uqoL2j3U.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金头盔', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOWUdvS1dRVklFcnIxcGFiZlRacFNlNFByRU9FbUFBSWxFR3NiVlg1UVZMcHYteUhrLUhsX0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5aS055uULnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjIyMDYsInQiOjE3NzkwNjMwNDYyMjksIm1pZCI6MzQyNH0.CvDz4vHiCi1l1D2YSirikjgPuigsqe7mllLFZeSStBo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金发冠', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOWW1vS1dROF9nQlljeGlLaUxjQ0JKSUhHWTFZRUFBSW1FR3NiVlg1UVZHMTQycThGN05LSUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR5Y-R5YagLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjU1MzYsInQiOjE3NzkwNjMwNTYwOTgsIm1pZCI6MzQyNn0.vbZEboAu8dMvsRYe6A_oWFDc0Sq9SGkdJaihIvz80NM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '草鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOam1vS1drX05zdTRSZ0ZjeXMxUXZQYVQ4V1pUV0FBSS1FR3NiVlg1UVZDOWhBQUdvWGFYTHFnRUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuiNiemeiy5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6Mzg1OTI2LCJ0IjoxNzc5MDYzMzc1Nzk3LCJtaWQiOjM0NzB9.JvgWaksTELK98hHxEdG2TUUpu0Vx142Kas3Kybe-Cc0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁靴', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOMG1vS1hSSHNvMGdpaXc3cXhSbnhDdDhNT1BrMUFBSmpFR3NiVlg1UVZFQ0d1dmVwZVRVckFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB6Z20LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjE3NjAsInQiOjE3NzkwNjQwODE3NjQsIm1pZCI6MzUzOH0.5B9A5_BcrOcBCzT6LjSOXgORaCE-3wOruQKlMEjNMdk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁鞋', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOMUdvS1hSWU9KeUJKd2daS2tncV9ZLUozZHo2bEFBSmtFR3NiVlg1UVZCcHhpX1MxUUpsN0FRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZOB6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjQwMDIsInQiOjE3NzkwNjQwODcwMTMsIm1pZCI6MzU0MH0.MFXuUaJmlrGmvjA4dZkBmEZ984XtHDkWpo9pAqydrTU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢靴', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOMW1vS1hSeWh6Y3M0OWJkR3pkeEZKSWZXYVpyYUFBSmxFR3NiVlg1UVZDaVVIdTEyQ0EyUUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi6Z20LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTYxNTUsInQiOjE3NzkwNjQwOTMyMDUsIm1pZCI6MzU0Mn0.iqmH93niwRUowMfkDR03K1i2CafQX6XBm-BV_OIR2eQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢鞋', 类型: '防具', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOMkdvS1hTS0NXVXIyUXJhcWNNSk1HVEVaejdHZkFBSm1FR3NiVlg1UVZPSVV0bUJBZzVWeUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZKi6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTI4MjcsInQiOjE3NzkwNjQwOTg5MTUsIm1pZCI6MzU0NH0.ETMQsPLbWlTZ333cr_-qE8ObjE0xeCpLznZhIsmjb6s.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢靴', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOMm1vS1hTZFlhdDhsRnY0NXZEYmU4SW9XakRUWUFBSm5FR3NiVlg1UVZENmlkV05EWDJJaEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi6Z20LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTAzNDYsInQiOjE3NzkwNjQxMDQxODgsIm1pZCI6MzU0Nn0.KmPlkqdgAqBB4r3f7vDw5-A3a5s4Yv13g7JbIdd1Cko.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢鞋', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOM0dvS1hTMGs0ajVBN1IxbTI3cVZ0d2R5QVVMV0FBSm9FR3NiVlg1UVZMZjVLdGZnYzN0aEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57K-6ZKi6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTg2NDUsInQiOjE3NzkwNjQxMTAxNDEsIm1pZCI6MzU0OH0.yt8YvwAtOpYrr_r4-A2S8Bf-V6U1ik0rojq-1Qa14r8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁靴', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOM21vS1hUT0VTWW1HaXVJZlpsb0R3VFVlTjNsM0FBSnBFR3NiVlg1UVZDWmdvWmtBQVUwcm93RUFBd0lBQTNnQUF6c0UiLCJlIjoicG5nIiwibiI6IuWvkumTgemdtC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MzYyNTA2LCJ0IjoxNzc5MDY0MTE1ODQ4LCJtaWQiOjM1NTB9.B9zOWWPK5a1Rtidd85P8Up1B4siTmd2_Yc0_cwok7GM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁鞋', 类型: '防具', 品质: '上品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlONEdvS1hUbEh3UzRROWxPRlNpVUl4WDZmLTBjeUFBSnFFR3NiVlg1UVZBODlDRldKQWYtREFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5a-S6ZOB6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNjg5NjIsInQiOjE3NzkwNjQxMjE0NzgsIm1pZCI6MzU1Mn0.Fpje2lg_i2D0XHsUk5hE6esZikb0qoBzeNrex-_pEwE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁靴', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlONG1vS1hUN3dfOUQtVzVFMjRFQlc2Ty13R2tkUUFBSnJFR3NiVlg1UVZGa09xUnNYYWF5SkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB6Z20LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTY3ODUsInQiOjE3NzkwNjQxMzk2NjIsIm1pZCI6MzU1Nn0.0NMP10HYVboe4R2C5Hgg2m5z5eoSiHbVRRq7RocDcSA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁鞋', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlONW1vS1hWQWNyN0h0SGNCTUJQUl9CTTY3bWZWTUFBSnNFR3NiVlg1UVZQVl9VN19XbWdjRUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi546E6ZOB6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTcxNTAsInQiOjE3NzkwNjQxNDUxODIsIm1pZCI6MzU1OH0.9WpqC_fcKgAKvY2-gds0JLqd9wqsTup3R89NElTkvw0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金靴', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlONkdvS1hWZDIySXVPSlY2MUV3bzZZQWN0R2Q0Z0FBSnRFR3NiVlg1UVZHZVJ4Z2dIZTFCcUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR6Z20LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozODEyMTEsInQiOjE3NzkwNjQxNTE1NDUsIm1pZCI6MzU2MH0.SfmBLwV-74ZVM6WOlgMgkK9TP5Op7RgGxZ_ZZSpPdGg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金鞋', 类型: '防具', 品质: '极品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlONm1vS1hWejVGbkw4b0Jmd05kX191WlZ1SlFHT0FBSnVFR3NiVlg1UVZDQWdqbGVWc1hhVEFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5LmM6YeR6Z6LLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozODEyMTQsInQiOjE3NzkwNjQxNTcyODQsIm1pZCI6MzU2Mn0.hKWEzXih3CVw8uGvrF4B9-NfAAsiwsFLcvFYJXG1v2o.png' },
    // ─── 杂物/通用 ─────────────────────────────────────────────────────
    { 名称: '火折子', 类型: '杂物', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlNREdvS1ZDNG5Lc0NjMHN3X0YzWHNLREZOcmpINkFBSjdEMnNiVlg1UVZMN2o0RmNvZ2l0aUFRQURBZ0FEZVFBRE93USIsImUiOiJwbmciLCJuIjoi54Gr5oqY5a2QLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMTM2MDU2LCJ0IjoxNzc5MDYxODA3MzA1LCJtaWQiOjMwODR9.MOKPGZYV8oz4ZI3fe82zNAokFpEKA_0ZhYkeNv5Jb5A.png' },
    { 名称: '绳索', 类型: '杂物', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOaUdvS1dZQ2wxVkIzUDZqZF85TE03RW1FQlFqWkFBSTVFR3NiVlg1UVZHU2E5VlZ6NERqQkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi57uz57SiLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozODAxNzUsInQiOjE3NzkwNjMxNjg5ODIsIm1pZCI6MzQ2NH0.8r39yoizFySl9J47HNeT2oMAwmUn0scYzRsbmA3tN4o.png' },
    { 名称: '地图', 类型: '杂物', 品质: '良品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOaW1vS1dZeWZIU2FqMjdheDgtVFU3Qzk3WkNDZEFBSTZFR3NiVlg1UVZHMDdZcVBjcnBWdkFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi5Zyw5Zu-LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyNzI3NzYsInQiOjE3NzkwNjMxODA5NDQsIm1pZCI6MzQ2Nn0.nsHO00HhjSnzYQ12EiRN65wP7AagqK06oSycUYTT4mg.png' },
    { 名称: '银两', 类型: '杂物', 品质: '凡品', 图片URL: 'https://image.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUlOakdvS1daS3FkbVpBYjI2Z0wwTkFxYXYxMGtpNUFBSTdFR3NiVlg1UVZHOWF0dUZCbWJiNUFRQURBZ0FEZUFBRE93USIsImUiOiJwbmciLCJuIjoi6ZO25LikLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjozNTQxNTEsInQiOjE3NzkwNjMxODY4NDcsIm1pZCI6MzQ2OH0.zOins-0H0y1mZl4wyaYnwEb12pdzF_bEUNP7j8dYK6Q.png' },
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
