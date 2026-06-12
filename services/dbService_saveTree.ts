import type { 存档结构 } from '../types';
import { 读取存档保护状态, 读取存档摘要列表, 读取存档, 批量删除存档, 保存存档, 清理未引用图片资源, type 存档摘要结构 } from './dbService';

const 清理哈希 = (hash: string): string => hash.replace(/[^a-f0-9]/gi, '').toLowerCase();

const 哈希前缀匹配 = (hashA: string, hashB: string): boolean => {
    if (!hashA || !hashB) return false;
    const a = 清理哈希(hashA);
    const b = 清理哈希(hashB);
    return a === b || a.endsWith(b) || b.endsWith(a);
};

export const 收集存档树节点ID = async (rootId: number, allSaves: 存档摘要结构[]): Promise<number[]> => {
    const collected = new Set<number>();
    const byHash = new Map<string, 存档摘要结构>();
    const byId = new Map<number, 存档摘要结构>();
    
    allSaves.forEach((save) => {
        if (typeof save.id === 'number') byId.set(save.id, save);
        const hash = typeof save.元数据?.存档哈希 === 'string' ? save.元数据.存档哈希.trim() : '';
        if (hash) {
            byHash.set(hash, save);
            const suffix = 清理哈希(hash).slice(-8);
            if (suffix !== hash) byHash.set(suffix, save);
        }
    });

    const root = byId.get(rootId);
    if (!root) return [];

    const traverse = (node: 存档摘要结构) => {
        if (typeof node.id !== 'number' || collected.has(node.id)) return;
        collected.add(node.id);
        
        const parentHash = typeof node.元数据?.存档父节点哈希 === 'string' ? node.元数据.存档父节点哈希.trim() : '';
        if (parentHash) {
            const parent = byHash.get(parentHash);
            if (parent) traverse(parent);
        }

        const nodeHash = typeof node.元数据?.存档哈希 === 'string' ? node.元数据.存档哈希.trim() : '';
        if (!nodeHash) return;
        allSaves.forEach((child) => {
            const childParentHash = typeof child.元数据?.存档父节点哈希 === 'string' ? child.元数据.存档父节点哈希.trim() : '';
            if (!childParentHash) return;
            if (哈希前缀匹配(childParentHash, nodeHash)) traverse(child);
        });
    };

    traverse(root);
    return Array.from(collected);
};

export const 删除存档树并重新保存全量存档 = async (saveId: number): Promise<void> => {
    if (await 读取存档保护状态()) {
        throw new Error('存档保护已开启，请先在"设置-数据存储"中关闭后再删除存档树。');
    }

    const fullSave = await 读取存档(saveId);
    if (!fullSave) throw new Error('存档不存在');

    const allSaves = await 读取存档摘要列表();
    const treeIds = await 收集存档树节点ID(saveId, allSaves);
    
    if (treeIds.length === 0) throw new Error('未找到存档树节点');

    await 批量删除存档(treeIds, true);

    const cleanedSave: 存档结构 = {
        ...fullSave,
        类型: 'manual',
        元数据: {
            ...fullSave.元数据,
            存档父节点哈希: '',
            存档根节点哈希: ''
        }
    };

    await 保存存档(cleanedSave);
    await 清理未引用图片资源();
};
