import type { 功能模型占位配置结构 } from '../../models/system';
import {
    构建OpenAI图片生成端点,
    规范化OpenAI图片基础地址,
    规范化OpenAI图片模型名称
} from './imageGenerationDiagnostics';

const OPENAI图片测试超时MS = 25_000;

type OpenAI图片测试结果 = {
    message: string;
    previewUrl?: string;
};

const 判断OpenAI图片测试参数错误 = (detail: string): boolean => {
    return /prompt|message|messages|required|required parameter|missing|缺少|不能为空|参数|invalid_request/i.test(detail);
};

const 判断OpenAI图片测试模型错误 = (detail: string): boolean => {
    return /invalid model|unknown model|model[^，。]*?(not|invalid|unknown|unsupported|does not exist)|模型[^，。]*?(不存在|无效|未知|不支持)|不支持[^，。]*?模型/i.test(detail);
};

const 提取测试图片预览 = (payload: any): string => {
    const candidates = [
        payload?.data?.[0],
        payload?.images?.[0],
        payload?.output?.[0],
        payload?.result,
        payload?.image,
        payload?.url,
        payload?.path
    ];

    const read = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string') {
            const text = value.trim();
            if (!text) return '';
            if (/^https?:\/\//i.test(text) || /^data:image\//i.test(text)) return text;
            if (/^[A-Za-z0-9+/=\s]+$/.test(text)) return `data:image/png;base64,${text.replace(/\s+/g, '')}`;
            return '';
        }
        if (typeof value === 'object') {
            const url = typeof value.url === 'string' ? value.url.trim() : '';
            const b64 = typeof value.b64_json === 'string'
                ? value.b64_json.trim()
                : (typeof value.base64 === 'string' ? value.base64.trim() : (typeof value.image_base64 === 'string' ? value.image_base64.trim() : ''));
            if (url) return url;
            if (b64) return `data:image/png;base64,${b64.replace(/\s+/g, '')}`;
        }
        return '';
    };

    for (const candidate of candidates) {
        const preview = read(candidate);
        if (preview) return preview;
    }
    return '';
};

export const 测试OpenAI兼容图片接口 = async (params: {
    rawBaseUrl: string;
    apiKey: string;
    model: string;
    path?: string;
    responseFormat?: 功能模型占位配置结构['文生图响应格式'];
    label: string;
    setTimeoutFn?: typeof setTimeout;
    clearTimeoutFn?: typeof clearTimeout;
}): Promise<OpenAI图片测试结果> => {
    const rawModel = (params.model || '').trim();
    const model = 规范化OpenAI图片模型名称(rawModel) || 'gpt-image-2';
    const isGptImageModel = /^(gpt-image|chatgpt-image)/i.test(model);
    const endpoint = 构建OpenAI图片生成端点(
        params.rawBaseUrl,
        isGptImageModel ? '/v1/images/generations' : params.path,
        { useRuntimeProxy: true }
    );
    if (!endpoint) throw new Error('OpenAI 兼容图片接口缺少 API 地址。');
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    if (params.apiKey) {
        headers.Authorization = `Bearer ${params.apiKey}`;
    }

    const requestBody: Record<string, unknown> = {
        model,
        prompt: '一张干净的连接测试图片，plain connection test image, no text, no watermark',
        n: 1,
        size: '1024x1024'
    };
    const isPucodingEndpoint = /pucoding\.com|\/api\/pucoding-image\//i.test(endpoint);
    if (isGptImageModel) {
        if (isPucodingEndpoint) {
            requestBody.response_format = 'b64_json';
        } else {
            requestBody.moderation = 'auto';
        }
    } else {
        requestBody.response_format = params.responseFormat || 'b64_json';
    }

    const abortController = new AbortController();
    const setTimer = params.setTimeoutFn || setTimeout;
    const clearTimer = params.clearTimeoutFn || clearTimeout;
    const timeoutId = setTimer(() => abortController.abort(), OPENAI图片测试超时MS);
    let response: Response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: abortController.signal
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(`OpenAI 兼容图片接口测试超时（${Math.round(OPENAI图片测试超时MS / 1000)} 秒）。接口地址可稍后重试；若服务端正在排队生图，测试按钮不会继续无限等待。`);
        }
        throw error;
    } finally {
        clearTimer(timeoutId);
    }

    const detail = await response.text().catch(() => '');
    const normalizedBase = 规范化OpenAI图片基础地址(params.rawBaseUrl);
    const normalizedNote = normalizedBase && normalizedBase !== params.rawBaseUrl.replace(/\/+$/, '')
        ? `已自动把网页地址识别为 API 根地址：${normalizedBase}。`
        : '';
    const modelNote = rawModel && rawModel !== model
        ? `模型名已按 ${model} 测试。`
        : `模型：${model}。`;

    if (response.ok) {
        const payload = detail ? JSON.parse(detail) : null;
        const previewUrl = 提取测试图片预览(payload);
        if (!previewUrl) {
            throw new Error(`${params.label}返回成功状态，但没有返回可显示的图片。原始响应：${detail.slice(0, 500)}`);
        }
        return {
            message: `${params.label}真实生图测试成功：${endpoint} 可访问，已返回图片预览。${normalizedNote}${modelNote}`,
            previewUrl
        };
    }

    if ((response.status === 401 || response.status === 403) && !params.apiKey) {
        return {
            message: `${params.label}地址可达，但还没有填写 API Key。${normalizedNote}已测试端点：${endpoint}。`
        };
    }

    if (response.status === 400 && (!detail || 判断OpenAI图片测试参数错误(detail)) && !判断OpenAI图片测试模型错误(detail)) {
        const authNote = params.apiKey ? 'API Key 已通过基础验证。' : '接口已返回参数校验结果。';
        return {
            message: `${params.label}连接可达，${authNote}${normalizedNote}已测试端点：${endpoint}。${modelNote}服务端拒绝了测试生图参数，请检查模型、尺寸或服务商兼容格式。`
        };
    }

    throw new Error(`HTTP ${response.status} ${detail}`.trim());
};
