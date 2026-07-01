import type { 地图层级结构, 地点性别比例配置 } from '../models/world';
import type { 环境信息结构 } from '../models/environment';

export type 性别比例值 = 地点性别比例配置 | string | undefined;

export const 地点级比例有效 = (node: 地图层级结构 | undefined): boolean => {
  if (!node?.性别比例) return false;
  if (node.性别比例恢复回合 == null || node.性别比例恢复回合 === 0) return false;
  return true;
};

/**
 * 解析当前有效性别比例
 * 优先级链：小地点.性别比例 > 中地点.性别比例 > 大地点.性别比例 > 世界.性别比例 > 开局配置
 */
export const 解析当前有效性别比例 = (
  环境: 环境信息结构 | undefined,
  地图层级列表: 地图层级结构[] | undefined,
  世界性别比例?: 性别比例值,
  开局性别比例?: 性别比例值
): 性别比例值 => {
  if (!环境 || !地图层级列表 || 地图层级列表.length === 0) {
    return 世界性别比例 ?? 开局性别比例;
  }

  const 匹配节点 = (层级名: string, 层级类型: string): 地图层级结构 | undefined => {
    return 地图层级列表.find(
      (n) => n.层级 === 层级类型 && n.名称 === 层级名 && n.性别比例 != null
    );
  };

  const 小地点节点 = 匹配节点(环境.小地点, '小地点');
  if (地点级比例有效(小地点节点)) return 小地点节点!.性别比例;

  const 中地点节点 = 匹配节点(环境.中地点, '中地点');
  if (地点级比例有效(中地点节点)) return 中地点节点!.性别比例;

  const 大地点节点 = 匹配节点(环境.大地点, '大地点');
  if (地点级比例有效(大地点节点)) return 大地点节点!.性别比例;

  return 世界性别比例 ?? 开局性别比例;
};
