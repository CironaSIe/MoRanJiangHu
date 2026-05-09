import type { 接口设置结构, 物品生图结果 } from '../../types';
import type { 游戏物品 } from '../../models/item';
import type { 当前可用接口结构 } from '../../utils/apiConfig';
import { 获取文生图接口配置, 接口配置是否可用 } from '../../utils/apiConfig';
import { 合并物品图片档案 } from '../../utils/itemImage';
import { generateImageByPrompt, persistImageAssetLocally } from './image';

type 物品生图来源位置 = '背包' | '拍卖行';

export interface 物品图标生成选项 {
    source?: 'auto' | 'manual' | 'retry';
    sourceLocation?: 物品生图来源位置;
    force?: boolean;
    size?: string;
    imageApi?: 当前可用接口结构 | null;
}

export interface 物品图标生成结果 {
    nextItem: 游戏物品;
    imageRecord: 物品生图结果;
    prompt: string;
    imageApi: 当前可用接口结构;
}

const 读取文本 = (value: unknown, fallback = '') => (
    typeof value === 'string' ? value.trim() : fallback
);

export const 构建物品视觉描述 = (item: any): string => [
    item?.名称 ? `名称：${item.名称}` : '',
    item?.类型 ? `类型：${item.类型}` : '',
    item?.品质 ? `品质：${item.品质}` : '',
    item?.描述 ? `描述：${item.描述}` : '',
    Array.isArray(item?.词条列表) && item.词条列表.length > 0
        ? `词条：${item.词条列表.map((entry: any) => [entry?.名称, entry?.属性, entry?.数值].filter(Boolean).join(' ')).filter(Boolean).join('；')}`
        : '',
    item?.来源描述 ? `来源：${item.来源描述}` : '',
    item?.关联事件 ? `关联事件：${item.关联事件}` : '',
].filter(Boolean).join('\n');

const 获取渲染风格要求 = (style: string): string => {
    switch (style) {
        case '写实道具':
            return 'realistic fantasy prop render, tactile material detail, premium equipment icon';
        case '像素图标':
            return 'high-end pixel art item icon, crisp silhouette, readable at small size';
        case '3D渲染':
            return 'stylized 3D game item render, centered product lighting, soft shadow';
        case '国风插画':
        default:
            return 'Chinese wuxia illustration style, ink wash texture, refined golden rim light';
    }
};

export const 构建物品图提示词 = (
    item: any,
    options?: { 画风?: string; 渲染风格?: string; 来源位置?: 物品生图来源位置 }
): string => {
    const style = options?.画风 || '国风';
    const renderStyle = options?.渲染风格 || '国风插画';
    return [
        '单个武侠/仙侠游戏物品图标资产，主体居中，占画面约75%，深墨黑渐变背景，淡宣纸纹理，暗金边缘光，柔和投影，清晰轮廓，高级游戏道具 UI 图标，不要文字，不要水印，不要人物。',
        获取渲染风格要求(renderStyle),
        `物品名称：${item?.名称 || '无名物品'}`,
        `类型与品质：${item?.品质 || '凡品'} ${item?.类型 || '杂物'}`,
        `默认画风：${style}`,
        options?.来源位置 ? `来源位置：${options.来源位置}` : '',
        item?.视觉描述 ? `视觉描述：${item.视觉描述}` : '',
        item?.描述 ? `物品描述：${item.描述}` : '',
        Array.isArray(item?.视觉标签) && item.视觉标签.length > 0 ? `视觉标签：${item.视觉标签.join('，')}` : '',
    ].filter(Boolean).join('\n');
};

export const 生成物品图标 = async (
    item: 游戏物品,
    apiConfig: 接口设置结构,
    options?: 物品图标生成选项
): Promise<物品图标生成结果> => {
    const imageApi = options?.imageApi || 获取文生图接口配置(apiConfig);
    if (!接口配置是否可用(imageApi)) {
        throw new Error('请先在设置的“文生图”中配置可用接口，再生成物品图。');
    }

    const feature = apiConfig?.功能模型占位;
    const style = feature?.自动物品生图画风 || '国风';
    const renderStyle = feature?.自动物品生图渲染风格 || '国风插画';
    const size = 读取文本(options?.size || feature?.自动物品生图分辨率, '1024x1024') || '1024x1024';
    const sourceLocation = options?.sourceLocation || '背包';
    const enrichedItem: 游戏物品 = {
        ...(item as any),
        视觉描述: 读取文本((item as any)?.视觉描述) || 构建物品视觉描述(item),
    };
    const prompt = 构建物品图提示词(enrichedItem, {
        画风: style,
        渲染风格: renderStyle,
        来源位置: sourceLocation
    });
    const rawResult = await generateImageByPrompt(prompt, imageApi, undefined, {
        构图: '头像',
        尺寸: size,
        附加正向提示词: 'single object, item icon, centered composition, dark wuxia UI background, clean silhouette',
        附加负面提示词: 'person, human, face, hand, text, watermark, logo, white background, cluttered background',
    });
    const localResult = await persistImageAssetLocally(rawResult);
    const imageRecord: 物品生图结果 = {
        id: `item_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        图片URL: localResult.图片URL,
        本地路径: localResult.本地路径,
        生图词组: prompt,
        最终正向提示词: localResult.最终正向提示词,
        最终负向提示词: localResult.最终负向提示词,
        原始描述: JSON.stringify(enrichedItem, null, 2),
        使用模型: imageApi.model || imageApi.图片后端类型 || 'image-model',
        生成时间: Date.now(),
        构图: '物品图标',
        画风: style as 物品生图结果['画风'],
        渲染风格: renderStyle as 物品生图结果['渲染风格'],
        尺寸: size,
        状态: 'success',
        来源: 'generated',
    };
    const nextItem: 游戏物品 = {
        ...(enrichedItem as any),
        视觉描述来源: (enrichedItem as any).视觉描述来源 || '规则生成',
        图片档案: 合并物品图片档案(enrichedItem, imageRecord),
    };

    return { nextItem, imageRecord, prompt, imageApi };
};
