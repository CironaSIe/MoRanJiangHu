import {
    酒馆预设兼容性结构,
    酒馆预设结构,
    酒馆预设消息角色类型,
    酒馆预设顺序结构,
    酒馆预设顺序项结构,
    酒馆预设提示词结构
} from '../models/system';

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value : '');
const 读取布尔 = (value: unknown): boolean => value === true;
const 读取数值 = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return Math.floor(parsed);
    }
    return null;
};

const 深拷贝JSON对象 = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    try {
        return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
        return undefined;
    }
};

const 读取正则脚本列表 = (extensions: Record<string, unknown> | undefined): any[] => {
    const scripts = (extensions as any)?.regex_scripts;
    return Array.isArray(scripts) ? scripts.filter(item => item && typeof item === 'object') : [];
};

const 是否选项渲染脚本 = (script: any): boolean => {
    if (script?.disabled === true) return false;
    const findRegex = 读取文本(script?.findRegex).toLowerCase();
    const replaceString = 读取文本(script?.replaceString).toLowerCase();
    const scriptName = 读取文本(script?.scriptName).toLowerCase();
    const targetsOptionBlock = /<\s*(options|branches)/.test(findRegex);
    const rendersHtml = /```html|<!doctype html|<html|<style|class\s*=/.test(replaceString);
    return /data-option-text|option-link|option-list/.test(replaceString)
        || (targetsOptionBlock && rendersHtml && /选项栏|option|choice/.test(scriptName));
};

const 是否危险脚本 = (script: any): boolean => {
    const replaceString = 读取文本(script?.replaceString);
    return /<\s*script\b|javascript\s*:|window\.|document\.|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|eval\s*\(/i.test(replaceString);
};

const 是否包含HTML渲染 = (script: any): boolean => {
    const findRegex = 读取文本(script?.findRegex);
    const replaceString = 读取文本(script?.replaceString);
    return /<[a-z][\s\S]*?>/i.test(replaceString)
        || /<(?:details|summary|html|body|style|script|div|span|button|section|article)\b/i.test(findRegex);
};

const 是否安全清理脚本 = (script: any): boolean => (
    !是否选项渲染脚本(script)
    && !是否危险脚本(script)
    && !是否包含HTML渲染(script)
);

const 构建酒馆兼容性 = (extensions: Record<string, unknown> | undefined): 酒馆预设兼容性结构 | undefined => {
    const scripts = 读取正则脚本列表(extensions);
    if (scripts.length === 0) return undefined;

    const optionRenderScripts = scripts.filter(是否选项渲染脚本);
    const safeCleanupScripts = scripts.filter(是否安全清理脚本);
    const metadataOnlyScripts = scripts.filter(script => (
        !是否选项渲染脚本(script) && !是否安全清理脚本(script)
    ));
    const 说明: string[] = [
        `已保留 ${scripts.length} 个 regex_scripts 扩展。`,
        '不会执行外部 JavaScript、DOM 访问和网络能力；选项栏会转为本项目的安全回合按钮。'
    ];
    if (safeCleanupScripts.length > 0) {
        说明.push(`识别到 ${safeCleanupScripts.length} 个纯正则清理脚本，可用于安全清理标签、摘要或提示残留。`);
    }
    if (optionRenderScripts.length > 0) {
        说明.push(`识别到 ${optionRenderScripts.length} 个可安全适配的选项渲染脚本。`);
    }
    if (metadataOnlyScripts.length > 0) {
        说明.push(`有 ${metadataOnlyScripts.length} 个脚本仅保留元数据，不直接执行。`);
    }

    return {
        正则脚本总数: scripts.length,
        安全清理脚本数: safeCleanupScripts.length,
        选项渲染脚本数: optionRenderScripts.length,
        仅保留元数据脚本数: metadataOnlyScripts.length,
        跳过脚本数: metadataOnlyScripts.length,
        说明
    };
};

const 规范化角色 = (raw: unknown, systemPrompt: unknown): 酒馆预设消息角色类型 => {
    if (raw === 'system' || raw === 'user' || raw === 'assistant') return raw;
    if (systemPrompt === true) return 'system';
    return 'system';
};

const 规范化提示词 = (raw: unknown): 酒馆预设提示词结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const identifier = 读取文本(source.identifier).trim();
    if (!identifier) return null;
    const name = 读取文本(source.name || source.title).trim();
    return {
        identifier,
        ...(name ? { name } : {}),
        role: 规范化角色(source.role, source.system_prompt),
        content: 读取文本(source.content),
        system_prompt: 读取布尔(source.system_prompt)
    };
};

const 规范化顺序项 = (raw: unknown): 酒馆预设顺序项结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const identifier = 读取文本(source.identifier).trim();
    if (!identifier) return null;
    return {
        identifier,
        enabled: source.enabled !== false
    };
};

const 规范化顺序 = (raw: unknown): 酒馆预设顺序结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const characterId = 读取数值(source.character_id);
    const orderRaw = Array.isArray(source.order) ? source.order : [];
    const order = orderRaw
        .map((item) => 规范化顺序项(item))
        .filter((item): item is 酒馆预设顺序项结构 => Boolean(item));
    if (characterId === null || order.length === 0) return null;
    return {
        character_id: characterId,
        order
    };
};

export const 规范化酒馆预设 = (raw: unknown): 酒馆预设结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const promptsRaw = Array.isArray(source.prompts) ? source.prompts : [];
    const promptOrderRaw = Array.isArray(source.prompt_order) ? source.prompt_order : [];

    const prompts = promptsRaw
        .map((item) => 规范化提示词(item))
        .filter((item): item is 酒馆预设提示词结构 => Boolean(item));
    const prompt_order = promptOrderRaw
        .map((item) => 规范化顺序(item))
        .filter((item): item is 酒馆预设顺序结构 => Boolean(item));

    if (prompts.length === 0 || prompt_order.length === 0) return null;
    const extensions = 深拷贝JSON对象(source.extensions);
    const 兼容性 = 构建酒馆兼容性(extensions);
    return {
        prompts,
        prompt_order,
        ...(extensions ? { extensions } : {}),
        ...(兼容性 ? { 兼容性 } : {})
    };
};

export const 获取酒馆预设角色ID列表 = (preset: 酒馆预设结构 | null | undefined): number[] => {
    if (!preset || !Array.isArray(preset.prompt_order)) return [];
    return Array.from(new Set(preset.prompt_order.map((item) => item.character_id)));
};

export const 获取酒馆预设顺序 = (
    preset: 酒馆预设结构 | null | undefined,
    selectedCharacterId?: number | null
): 酒馆预设顺序结构 | null => {
    if (!preset || !Array.isArray(preset.prompt_order) || preset.prompt_order.length === 0) return null;
    const normalizedId = typeof selectedCharacterId === 'number' && Number.isFinite(selectedCharacterId)
        ? Math.floor(selectedCharacterId)
        : null;
    if (normalizedId !== null) {
        const matched = preset.prompt_order.find((item) => item.character_id === normalizedId);
        if (matched) return matched;
    }
    const preferredDefault = preset.prompt_order.find((item) => item.character_id === 100001);
    if (preferredDefault) return preferredDefault;
    return preset.prompt_order[0] || null;
};
