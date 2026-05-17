import type { GameResponse, TavernCommand, 世界数据结构, 环境信息结构, 接口设置结构, 世界书结构, 记忆系统结构 } from '../../types';
import type { 当前可用接口结构 } from '../../utils/apiConfig';
import { 获取地图生成接口配置, 获取地图自动更新接口配置, 接口配置是否可用 } from '../../utils/apiConfig';
import { 获取内置世界书槽位内容 } from '../../utils/worldbook';
import { 地图重生成系统提示词 } from '../../prompts/runtime/mapRegenerate';
import { 地图重生成COT提示词 } from '../../prompts/runtime/mapRegenerateCot';
import { 请求模型文本, 规范化文本补全消息链 } from '../../services/ai/chatCompletionClient';

export type 地图更新模式 = 'memory_regenerate' | 'auto_incremental';

export type 地图更新进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
};

export type 地图更新执行结果 = {
    ok: boolean;
    phase: 'done' | 'error' | 'skipped';
    commands: TavernCommand[];
    rawText: string;
    statusText: string;
    newLayers?: any[];
};

type 地图更新请求参数 = {
    mode: 地图更新模式;
    apiSettings: 接口设置结构;
    环境: 环境信息结构;
    世界: 世界数据结构;
    社交?: any[];
    角色?: any;
    记忆系统?: 记忆系统结构;
    worldbooks?: 世界书结构[];
    currentResponse?: GameResponse;
    stateBase?: {
        环境?: 环境信息结构;
        世界?: 世界数据结构;
        社交?: any[];
        角色?: any;
    };
    signal?: AbortSignal;
    onDelta?: (delta: string, accumulated: string) => void;
};

const 地图层级顺序 = ['寰宇', '大地点', '中地点', '小地点', '区地点', '子地点'] as const;
const 地图层级集合 = new Set<string>(地图层级顺序);

const 取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 规范化层级 = (value: unknown): string => {
    const text = 取文本(value);
    if (text === '具体地点') return '区地点';
    if (text === '室内' || text === '房间') return '子地点';
    return 地图层级集合.has(text) ? text : '区地点';
};

const 提取响应正文 = (response?: GameResponse): string => (
    (Array.isArray(response?.logs) ? response.logs : [])
        .map((log: any) => `${log?.sender || '旁白'}：${log?.text || ''}`.trim())
        .filter(Boolean)
        .join('\n')
        .trim()
);

const 限长文本 = (value: unknown, maxLength: number): string => {
    const text = 取文本(value);
    if (!text || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
};

const 构建回忆库地图线索 = (memory?: Partial<记忆系统结构> | null): string => {
    const archives = Array.isArray(memory?.回忆档案) ? memory!.回忆档案 : [];
    const archiveText = archives
        .slice(-120)
        .map((item: any, index: number) => {
            const round = Number(item?.回合) || index + 1;
            const title = 取文本(item?.名称) || `回忆${round}`;
            const time = 取文本(item?.记录时间) || 取文本(item?.时间戳);
            const summary = 限长文本(item?.概括, 600);
            const body = 限长文本(item?.原文, 1800);
            return [
                `【${title}｜回合 ${round}${time ? `｜${time}` : ''}】`,
                summary ? `概括：${summary}` : '',
                body ? `原文：${body}` : ''
            ].filter(Boolean).join('\n');
        })
        .filter(Boolean)
        .join('\n\n');
    const longText = (Array.isArray(memory?.长期记忆) ? memory!.长期记忆 : [])
        .map((item) => 限长文本(item, 900))
        .filter(Boolean)
        .join('\n');
    const midText = (Array.isArray(memory?.中期记忆) ? memory!.中期记忆 : [])
        .slice(-80)
        .map((item) => 限长文本(item, 700))
        .filter(Boolean)
        .join('\n');
    const shortText = (Array.isArray(memory?.短期记忆) ? memory!.短期记忆 : [])
        .slice(-80)
        .map((item) => 限长文本(item, 500))
        .filter(Boolean)
        .join('\n');
    const immediateText = (Array.isArray(memory?.即时记忆) ? memory!.即时记忆 : [])
        .slice(-40)
        .map((item) => 限长文本(item, 900))
        .filter(Boolean)
        .join('\n');

    return [
        archiveText ? `【回忆档案】\n${archiveText}` : '',
        longText ? `【长期记忆】\n${longText}` : '',
        midText ? `【中期记忆】\n${midText}` : '',
        shortText ? `【短期记忆】\n${shortText}` : '',
        immediateText ? `【近期即时记忆】\n${immediateText}` : ''
    ].filter(Boolean).join('\n\n').trim();
};

export const 构建地图更新用户提示词 = (params: {
    mode: 地图更新模式;
    环境?: any;
    世界?: any;
    社交?: any[];
    角色?: any;
    记忆系统?: 记忆系统结构;
    currentResponse?: GameResponse;
}): string => {
    const env = params.环境 || {};
    const world = params.世界 || {};
    const layers = Array.isArray(world?.地图层级) ? world.地图层级 : [];
    const currentLocation = [env?.大地点, env?.中地点, env?.小地点, env?.具体地点].map(取文本).filter(Boolean).join(' > ');
    const existingLayerInfo = layers.length > 0
        ? JSON.stringify(layers.map((layer: any) => ({
            ID: 取文本(layer?.ID),
            名称: 取文本(layer?.名称),
            层级: 取文本(layer?.层级),
            父级ID: 取文本(layer?.父级ID),
            描述: 取文本(layer?.描述)
        })), null, 2)
        : '[]';
    const socialText = (Array.isArray(params.社交) ? params.社交 : [])
        .slice(0, 30)
        .map((npc: any) => {
            const name = 取文本(npc?.姓名) || 取文本(npc?.名称);
            if (!name) return '';
            const locationPath = 取文本(npc?.位置路径) || 取文本(npc?.当前位置);
            const present = npc?.是否在场 === true ? '在场' : '不在场';
            return `- ${name}｜${present}${locationPath ? `｜位置：${locationPath}` : ''}`;
        })
        .filter(Boolean)
        .join('\n') || '暂无';
    const body = 提取响应正文(params.currentResponse) || '暂无';
    const currentName = 取文本(params.角色?.姓名) || '主角';

    if (params.mode === 'memory_regenerate') {
        const memoryText = 构建回忆库地图线索(params.记忆系统);
        return [
            '你正在执行【旧存档地图适配】任务。旧存档里的旧地图坐标字段已经被清理，请只根据回忆库和当前状态重建新版六层地图树。',
            '',
            `当前地点：${currentLocation || '未知'}`,
            `当前主角：${currentName}`,
            `当前人物：\n${socialText}`,
            '',
            '【已有地图层级数据（如有，请全部保留并整合进新树）】',
            existingLayerInfo,
            '',
            '【回忆库内容】',
            memoryText || '暂无可用回忆。',
            '',
            '请从回忆库中提取所有可长期抵达或反复出现的地点，并重建完整地点层级树。要求：',
            '1. 根节点必须是 层级:"寰宇" 名称:"诸天万界"。',
            '2. 地图层级只能是：寰宇、大地点、中地点、小地点、区地点、子地点。',
            '3. 大地点=世界/大陆/秘境大世界；中地点=大洲/区域；小地点=城镇/山门/村庄；区地点=建筑/地标/街区；子地点=房间/院落/室内空间。',
            '4. 必须保留已有地图层级中的所有地点；回忆库中出现的明确地点尽量补全父子关系。',
            '5. 不要生成坐标、道路、建筑列表、地图人物等旧字段。',
            '6. 只输出 JSON，格式为 {"地点树":[{"名称":"...","层级":"...","父级ID":"父级名称或ID","描述":"..."}]}，不要输出命令。'
        ].join('\n');
    }

    return [
        '你正在执行正文后的【地图自动更新】任务。只维护地图层级，不写正文，不维护世界事件、NPC后台行动、势力、规划或社交档案。',
        '',
        `当前地点：${currentLocation || '未知'}`,
        `当前主角：${currentName}`,
        '',
        '【本回合正文】',
        body,
        '',
        '【当前人物位置线索】',
        socialText,
        '',
        '【已有地图层级】',
        existingLayerInfo,
        '',
        '【自动更新规则】',
        '1. 只在本回合正文明确确认了新的可长期抵达地点、建筑、地标、房间、秘境、区域或新世界时，才输出新增地图命令。',
        '2. 若已有地图层级中已经存在同名地点，不要重复 push。',
        '3. 地图层级只能是：寰宇、大地点、中地点、小地点、区地点、子地点。',
        '4. 区地点=建筑/地标；子地点=建筑内房间。环境.具体地点不是层级名。',
        '5. 父级ID优先填写已有节点 ID；若只能确定父级名称，也可以填写父级名称，系统会自动解析。',
        '6. 禁止输出旧地图坐标字段：世界.地图、世界.建筑、世界.地图建筑、世界.地图道路、世界.地图人物。',
        '7. 若无新增或修复需求，<命令> 输出“无”。',
        '',
        '【输出格式】',
        '<thinking>简短审计是否有新地点</thinking>',
        '<说明>- 写明新增/跳过原因</说明>',
        '<命令>',
        'push 世界.地图层级 = {"名称":"悦来客栈","层级":"区地点","父级ID":"DT-004","描述":"洛阳城内可住宿与打探消息的客栈"}',
        '</命令>'
    ].join('\n');
};

const 创建地图接口缺失结果 = (): 地图更新执行结果 => ({
    ok: false,
    phase: 'skipped',
    commands: [],
    rawText: '',
    statusText: '地图生成接口未配置可用模型'
});

const 解析JSON块 = (rawText: string): any => {
    let text = (rawText || '').trim();
    const thinkEnd = text.lastIndexOf('</思考>');
    if (thinkEnd >= 0) text = text.slice(thinkEnd + '</思考>'.length).trim();
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlock) text = codeBlock[1].trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        text = text.slice(firstBrace, lastBrace + 1);
    }
    return JSON.parse(text);
};

export const 解析地图重生成节点 = (rawText: string): any[] => {
    const parsed = 解析JSON块(rawText);
    return Array.isArray(parsed?.地点树) ? parsed.地点树 : [];
};

export const 构建地图层级替换结果 = (
    rawNodes: any[],
    currentWorld?: any
): any[] => {
    const existingLayers = Array.isArray(currentWorld?.地图层级) ? currentWorld.地图层级 : [];
    const oldNameToId = new Map<string, string>();
    existingLayers.forEach((layer: any) => {
        const name = 取文本(layer?.名称);
        const id = 取文本(layer?.ID);
        if (name && /^DT-\d+/i.test(id)) oldNameToId.set(name, id);
    });
    const normalizedNodes = (Array.isArray(rawNodes) ? rawNodes : [])
        .map((node) => ({
            名称: 取文本(node?.名称),
            层级: 规范化层级(node?.层级),
            父级ID: 取文本(node?.父级ID),
            描述: 取文本(node?.描述)
        }))
        .filter((node) => node.名称);
    if (!normalizedNodes.some((node) => node.层级 === '寰宇')) {
        normalizedNodes.unshift({ 名称: '诸天万界', 层级: '寰宇', 父级ID: '', 描述: '诸天万界交汇之地' });
    }

    let seq = 0;
    const nextId = (): string => {
        seq += 1;
        return `DT-${String(seq).padStart(3, '0')}`;
    };
    const nameToId = new Map<string, string>();
    normalizedNodes.forEach((node) => {
        if (!nameToId.has(node.名称)) nameToId.set(node.名称, oldNameToId.get(node.名称) || nextId());
    });

    return normalizedNodes.map((node) => ({
        ID: nameToId.get(node.名称) || nextId(),
        名称: node.名称,
        层级: node.层级,
        父级ID: node.父级ID ? (nameToId.get(node.父级ID) || oldNameToId.get(node.父级ID) || node.父级ID) : '',
        描述: node.描述,
        归属: { 大地点: '', 中地点: '', 小地点: '' }
    }));
};

const 提取命令块 = (rawText: string): string => {
    const source = (rawText || '').trim();
    const withoutThinking = source
        .replace(/<\s*thinking\s*>[\s\S]*?<\s*\/\s*thinking\s*>/gi, '')
        .replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, '')
        .trim();
    const match = withoutThinking.match(/<\s*命令\s*>([\s\S]*?)(?:<\s*\/\s*命令\s*>|$)/i);
    return (match?.[1] || withoutThinking).trim();
};

const 解析命令值 = (text: string): any => {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        }
        return trimmed;
    }
};

export const 解析地图自动更新命令 = (rawText: string, currentWorld?: any): TavernCommand[] => {
    const block = 提取命令块(rawText);
    if (!block || /^无$/i.test(block.trim())) return [];
    const existingLayers = Array.isArray(currentWorld?.地图层级) ? currentWorld.地图层级 : [];
    const existingNames = new Set(existingLayers.map((layer: any) => 取文本(layer?.名称)).filter(Boolean));
    const idByName = new Map(existingLayers.map((layer: any) => [取文本(layer?.名称), 取文本(layer?.ID)] as const).filter(([name]) => Boolean(name)));
    const result: TavernCommand[] = [];
    block.split(/\n+/).forEach((line) => {
        const trimmed = line.trim().replace(/^[\-*]\s*/, '');
        if (!trimmed || /^无$/i.test(trimmed)) return;
        const match = trimmed.match(/^(push|set|add|delete)\s+(.+?)(?:\s*=\s*([\s\S]+))?$/i);
        if (!match) return;
        const action = match[1].toLowerCase() as TavernCommand['action'];
        const key = (match[2] || '').trim();
        if (!/^世界\.地图层级(?:$|\s|\[|\.)/.test(key) && !/^gameState\.世界\.地图层级(?:$|\s|\[|\.)/.test(key)) return;
        if (action !== 'push' && action !== 'set' && action !== 'delete') return;
        const value = action === 'delete' ? undefined : 解析命令值(match[3] || '');
        if (action === 'push') {
            if (!value || typeof value !== 'object' || Array.isArray(value)) return;
            const name = 取文本((value as any).名称);
            if (!name || existingNames.has(name)) return;
            const parent = 取文本((value as any).父级ID);
            result.push({
                action,
                key: '世界.地图层级',
                value: {
                    名称: name,
                    层级: 规范化层级((value as any).层级),
                    父级ID: parent ? (idByName.get(parent) || parent) : '',
                    描述: 取文本((value as any).描述)
                }
            });
            return;
        }
        result.push({ action, key, value } as TavernCommand);
    });
    return result;
};

export const 生成地图更新 = async (
    params: 地图更新请求参数
): Promise<地图更新执行结果> => {
    const api = params.mode === 'auto_incremental'
        ? 获取地图自动更新接口配置(params.apiSettings)
        : 获取地图生成接口配置(params.apiSettings);
    if (!接口配置是否可用(api)) return 创建地图接口缺失结果();

    const env = params.stateBase?.环境 || params.环境;
    const world = params.stateBase?.世界 || params.世界;
    const social = params.stateBase?.社交 || params.社交 || [];
    const role = params.stateBase?.角色 || params.角色;
    const userPrompt = 构建地图更新用户提示词({
        mode: params.mode,
        环境: env,
        世界: world,
        社交: social,
        角色: role,
        记忆系统: params.记忆系统,
        currentResponse: params.currentResponse
    });
    const cotPrompt = 获取内置世界书槽位内容({
        books: params.worldbooks,
        slotId: 'builtin_map_regenerate_cot',
        fallback: 地图重生成COT提示词
    });
    const systemPrompt = 获取内置世界书槽位内容({
        books: params.worldbooks,
        slotId: 'builtin_map_regenerate_system_prompt',
        fallback: 地图重生成系统提示词
    });

    const messages = 规范化文本补全消息链([
        { role: 'system', content: cotPrompt },
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ], { 保留System: true, 合并同角色: false });
    const rawText = await 请求模型文本(api as 当前可用接口结构, messages, {
        temperature: params.mode === 'auto_incremental' ? 0.35 : 0.7,
        signal: params.signal,
        streamOptions: params.onDelta
            ? {
                stream: true,
                onDelta: params.onDelta
            }
            : undefined,
        errorDetailLimit: Number.POSITIVE_INFINITY
    });

    if (params.mode === 'memory_regenerate') {
        const rawNodes = 解析地图重生成节点(rawText);
        const newLayers = 构建地图层级替换结果(rawNodes, world);
        return {
            ok: true,
            phase: newLayers.length > 0 ? 'done' : 'skipped',
            commands: [],
            rawText,
            statusText: newLayers.length > 0 ? `地图解析完成：已生成 ${newLayers.length} 个地点节点` : '地图解析完成：未生成有效节点',
            newLayers
        };
    }

    const commands = 解析地图自动更新命令(rawText, world);
    return {
        ok: true,
        phase: commands.length > 0 ? 'done' : 'skipped',
        commands,
        rawText,
        statusText: commands.length > 0 ? `地图更新完成：新增 ${commands.length} 条地图命令` : '地图更新检查完成：本回合无需更新'
    };
};
