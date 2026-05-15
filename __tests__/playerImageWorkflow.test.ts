import { describe, expect, it, vi } from 'vitest';
import { 创建主角图片工作流 } from '../hooks/useGame/playerImageWorkflow';

const 创建依赖 = (执行生图: ReturnType<typeof vi.fn>) => ({
    获取角色: () => ({ 姓名: '刀哥', 头像图片URL: '' }),
    设置角色: vi.fn(),
    规范化角色物品容器映射: (value: any) => value,
    执行自动存档: vi.fn(),
    获取历史记录: () => [],
    推送右下角提示: vi.fn(),
    加载NPC生图工作流: vi.fn(async () => ({ 执行NPC生图工作流: 执行生图 })),
    apiConfig: {},
    获取文生图接口配置: vi.fn(),
    获取生图词组转化器接口配置: vi.fn(),
    获取生图画师串预设: vi.fn(),
    获取当前PNG画风预设: vi.fn(),
    读取主角角色锚点: () => null,
    提取主角角色锚点: vi.fn(async () => null),
    自动角色锚点已启用: () => false,
    获取词组转化器预设提示词: vi.fn(),
    接口配置是否可用: vi.fn(),
    读取文生图功能配置: () => ({ 总开关: true }),
    主角生图进行中集合: new Set<string>(),
    提取主角生图基础数据: (character: any) => character,
    创建NPC生图任务: (params: any) => params,
    生成NPC生图记录ID: () => 'record-1',
    追加NPC生图任务: vi.fn(),
    更新NPC生图任务: vi.fn(),
    构建文生图额外要求: (extra?: string) => extra || ''
});

describe('playerImageWorkflow', () => {
    it('keeps manual player image failures handled by toast instead of leaking a rejection', async () => {
        const 执行生图 = vi.fn(async () => {
            throw new Error('ComfyUI 后端在线，但浏览器直连失败');
        });
        const deps = 创建依赖(执行生图);
        const workflow = 创建主角图片工作流(deps as any);

        await expect(workflow.generatePlayerImageManually({ 构图: '头像' })).resolves.toBeUndefined();
        expect(deps.推送右下角提示).toHaveBeenCalledWith(expect.objectContaining({
            title: '主角生图失败',
            tone: 'error'
        }));
    });

    it('cools down automatic avatar补全 after an image backend failure', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const 执行生图 = vi.fn(async () => {
            throw new Error('ComfyUI 后端在线，但浏览器直连失败');
        });
        const workflow = 创建主角图片工作流(创建依赖(执行生图) as any);

        await workflow.ensurePlayerAvatarEachTurn({ 姓名: '刀哥', 头像图片URL: '' } as any);
        await workflow.ensurePlayerAvatarEachTurn({ 姓名: '刀哥', 头像图片URL: '' } as any);

        expect(执行生图).toHaveBeenCalledTimes(1);
        warnSpy.mockRestore();
    });
});
