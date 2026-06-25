import type { 当前可用接口结构 } from './apiConfig';

const 缺标签关键词 = /缺少\s*<[^>]+>|标签完整性|标签结构|标签协议|返回内容不符合标签协议|未匹配到完整标签结构|疑似响应截断|缺少\s*logs/i;
const 假流式关键词 = /假流式|fake\s*stream|pseudo\s*stream|stream/i;
const 公益站关键词 = /公益|free|proxy|generativelanguage|gemini/i;

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 是否Gemini接口 = (apiConfig?: Partial<当前可用接口结构> | null): boolean => {
    const provider = 读取文本(apiConfig?.供应商).toLowerCase();
    const model = 读取文本(apiConfig?.model).toLowerCase();
    const baseUrl = 读取文本(apiConfig?.baseUrl).toLowerCase();
    return provider === 'gemini'
        || model.includes('gemini')
        || baseUrl.includes('generativelanguage')
        || baseUrl.includes('gemini');
};

const 是否疑似公益站假流式 = (apiConfig?: Partial<当前可用接口结构> | null): boolean => {
    const source = [
        apiConfig?.名称,
        apiConfig?.model,
        apiConfig?.baseUrl,
        apiConfig?.协议覆盖
    ].map(读取文本).join('\n');
    return 假流式关键词.test(source) || 公益站关键词.test(source);
};

export const 构建标签缺失补充提示 = (params: {
    parseErrorDetail?: string;
    apiConfig?: Partial<当前可用接口结构> | null;
}): string => {
    const detail = 读取文本(params.parseErrorDetail);
    if (!detail || !缺标签关键词.test(detail)) return detail;
    if (!是否Gemini接口(params.apiConfig) || !是否疑似公益站假流式(params.apiConfig)) return detail;
    const hint = '提示：如果是在公益站使用 Gemini，且开局或回合一直缺少 <正文>、<短期记忆> 等标签，请不要使用“假流式模型”；建议切换为真实非流式/普通 Gemini 模型，或在设置中关闭流式输出后重试。';
    return detail.includes(hint) ? detail : `${detail}\n\n${hint}`;
};
