import type { 小说分解创意工坊条目 } from '../services/workshopNovelDecomposition';

export type 内置小说分解创意工坊条目 = 小说分解创意工坊条目 & {
    source: 'builtin';
    downloadUrl: string;
};

// 用户贡献审核后可以把对应 ZIP 固化到 public/assets/workshop/novel-decomposition/
// 并在这里登记；运行时创意工坊会把内置模块和云端模块合并展示。
export const 内置小说分解创意工坊模块: 内置小说分解创意工坊条目[] = [];
