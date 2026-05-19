import type { 游戏设置结构 } from '../types';
import { 规范化游戏设置 } from './gameSettings';

export const 繁体输出指令 = [
    '【繁體中文輸出要求】',
    '目前已開啟繁體模式。這是最高優先級輸出規則：所有本次由 AI 新生成、會顯示給玩家或寫入存檔的中文內容，必須使用繁體中文。',
    '正文、旁白、角色對白、判定文字、回憶摘要、規劃說明、世界更新、地圖描述、物品/地點/NPC 的新描述都必須用繁體中文。',
    '若任務提示、上下文或使用者輸入含有簡體中文，輸出時必須自然轉寫為繁體中文；不要照抄簡體句子。',
    '保留既有專有名詞、英文、數字、JSON 鍵名、標籤名、命令路徑與程式式欄位名稱，不要因繁體化破壞格式或命令解析。',
    '如果必須輸出命令或 JSON，只轉換其中面向玩家閱讀的中文值，不轉換鍵名、路徑、標籤或協議字段。'
].join('\n');

export const 繁体模式已启用 = (config?: Partial<游戏设置结构> | null): boolean => (
    规范化游戏设置(config).启用繁体模式 === true
);

export const 获取繁体输出指令 = (config?: Partial<游戏设置结构> | null): string => (
    繁体模式已启用(config) ? 繁体输出指令 : ''
);

export const 追加繁体输出指令 = (
    content: string,
    config?: Partial<游戏设置结构> | null
): string => {
    const directive = 获取繁体输出指令(config);
    return [content, directive]
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .join('\n\n');
};

export const 包装繁体任务提示 = (
    content: string,
    config?: Partial<游戏设置结构> | null
): string => {
    const directive = 获取繁体输出指令(config);
    const source = typeof content === 'string' ? content.trim() : '';
    if (!directive) return source;
    return [
        source,
        '【最终输出语言硬约束】',
        directive,
        '请立刻执行以上繁體中文輸出要求。除标签名、JSON 键名、命令路径和协议字段外，本次新生成中文不得使用简体字。'
    ].filter(Boolean).join('\n\n');
};
