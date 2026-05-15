import { describe, expect, it } from 'vitest';
import { 默认ComfyUI工作流JSON, 默认NSFWComfyUI工作流JSON } from '../data/defaultComfyWorkflow';
import { 默认功能模型占位, 获取NSFW文生图接口配置, 获取文生图接口配置, 获取场景文生图接口配置, 规范化接口设置 } from '../utils/apiConfig';

const 构建ComfyUI测试设置 = (功能模型占位: Record<string, unknown> = {}) => 规范化接口设置({
    activeConfigId: 'test-main',
    configs: [{
        id: 'test-main',
        名称: '测试主接口',
        供应商: 'openai_compatible',
        协议覆盖: 'auto',
        baseUrl: 'https://example.com/v1',
        apiKey: 'test-key',
        model: 'test-chat-model',
        createdAt: 1,
        updatedAt: 1
    }],
    功能模型占位: {
        文生图功能启用: true,
        文生图后端类型: 'comfyui',
        文生图模型API地址: 'http://127.0.0.1:8188',
        ...功能模型占位
    }
});

describe('默认 ComfyUI 生图配置', () => {
    it('uses separate bundled z-image turbo workflows for normal and NSFW ComfyUI images', () => {
        const workflow = JSON.parse(默认ComfyUI工作流JSON);
        const nsfwWorkflow = JSON.parse(默认NSFWComfyUI工作流JSON);
        const settings = 构建ComfyUI测试设置({
            NSFW生图独立接口启用: true,
            NSFW生图后端类型: 'comfyui',
            NSFW生图模型API地址: 'http://127.0.0.1:8188'
        });
        const sharedConfig = 获取文生图接口配置(settings);
        const nsfwConfig = 获取NSFW文生图接口配置(settings);

        expect(默认功能模型占位.文生图后端类型).toBe('comfyui');
        expect(默认功能模型占位.使用默认ComfyUI工作流).toBe(true);
        expect(默认功能模型占位.使用默认场景ComfyUI工作流).toBe(true);
        expect(默认功能模型占位.使用默认NSFWComfyUI工作流).toBe(true);
        expect(默认功能模型占位.ComfyUI工作流JSON).toBe('');
        expect(默认功能模型占位.场景ComfyUI工作流JSON).toBe('');
        expect(默认功能模型占位.NSFWComfyUI工作流JSON).toBe('');
        expect(sharedConfig?.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
        expect(nsfwConfig?.ComfyUI工作流JSON).toBe(默认NSFWComfyUI工作流JSON);
        expect(默认ComfyUI工作流JSON).not.toBe(默认NSFWComfyUI工作流JSON);
        expect(workflow).not.toEqual(nsfwWorkflow);
        expect(workflow['46'].class_type).toBe('NunchakuZImageDiTLoader');
        expect(workflow['46'].inputs.model_name).toBe('z_image_turbo_bf16.safetensors');
        expect(workflow['40'].inputs.vae_name).toBe('ae.safetensors');
        expect(workflow['45'].inputs.text).toBe('__PROMPT__');
        expect(workflow['54'].inputs.text).toBe('__NEGATIVE_PROMPT__');
        expect(workflow['41'].inputs.width).toBe('__WIDTH__');
        expect(workflow['41'].inputs.height).toBe('__HEIGHT__');
        expect(workflow['44'].inputs.seed).toBe('__SEED__');
        expect(workflow['44'].inputs.steps).toBe('__STEPS__');
        expect(workflow['44'].inputs.cfg).toBe('__CFG__');
        expect(workflow['44'].inputs.sampler_name).toBe('__SAMPLER__');
        expect(workflow['44'].inputs.scheduler).toBe('__SCHEDULER__');
        expect(JSON.stringify(workflow)).not.toContain('qwen-image-2512-Q6_K.gguf');
        expect(JSON.stringify(workflow)).not.toContain('UnetLoaderGGUF');
        expect(nsfwWorkflow['46'].inputs.unet_name).toBe('mPMix_NSFW_V9_fp8.safetensors');
        expect(nsfwWorkflow['47'].inputs.model).toEqual(['53', 0]);
        expect(nsfwWorkflow['53'].class_type).toBe('LoraLoaderModelOnly');
        expect(nsfwWorkflow['53'].inputs.lora_name).toBe('Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors');
        expect(nsfwWorkflow['40'].inputs.vae_name).toBe('ae.safetensors');
        expect(nsfwWorkflow['45'].inputs.text).toBe('__PROMPT__');
        expect(nsfwWorkflow['54'].inputs.text).toBe('__NEGATIVE_PROMPT__');
        expect(nsfwWorkflow['41'].inputs.width).toBe('__WIDTH__');
        expect(nsfwWorkflow['41'].inputs.height).toBe('__HEIGHT__');
        expect(nsfwWorkflow['44'].inputs.seed).toBe('__SEED__');
        expect(nsfwWorkflow['44'].inputs.steps).toBe('__STEPS__');
        expect(nsfwWorkflow['44'].inputs.cfg).toBe('__CFG__');
        expect(nsfwWorkflow['44'].inputs.sampler_name).toBe('__SAMPLER__');
        expect(nsfwWorkflow['44'].inputs.scheduler).toBe('__SCHEDULER__');
        expect(JSON.stringify(nsfwWorkflow)).not.toContain('qwen-image-2512-Q6_K.gguf');
        expect(JSON.stringify(nsfwWorkflow)).not.toContain('UnetLoaderGGUF');
    });

    it('fills the default workflow when old settings have no ComfyUI workflow', () => {
        const settings = 构建ComfyUI测试设置({
            文生图模型使用模型: '',
            文生图模型API密钥: '',
            ComfyUI工作流JSON: ''
        });

        expect(settings.功能模型占位.文生图后端类型).toBe('comfyui');
        expect(settings.功能模型占位.使用默认ComfyUI工作流).toBe(true);
        expect(settings.功能模型占位.ComfyUI工作流JSON).toBe('');
        expect(获取文生图接口配置(settings)?.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
    });

    it('migrates legacy normal workflows to the current shared z-image turbo workflow', () => {
        const legacyWorkflow = JSON.stringify({
            '39': {
                inputs: { clip_name: 'qwen_3_4b.safetensors' },
                class_type: 'CLIPLoader'
            },
            '42': {
                inputs: { conditioning: ['45', 0] },
                class_type: 'ConditioningZeroOut'
            },
            '44': {
                inputs: { model: ['47', 0] },
                class_type: 'KSampler'
            },
            '46': {
                inputs: { unet_name: 'mPMix_NSFW_V9_fp8.safetensors' },
                class_type: 'UNETLoader'
            },
            '49': {
                inputs: { unet_name: 'qwen-image-2512-Q6_K.gguf' },
                class_type: 'UnetLoaderGGUF'
            }
        });
        const settings = 构建ComfyUI测试设置({
            ComfyUI工作流JSON: legacyWorkflow
        });

        expect(settings.功能模型占位.使用默认ComfyUI工作流).toBe(true);
        expect(settings.功能模型占位.ComfyUI工作流JSON).toBe('');
        expect(获取文生图接口配置(settings)?.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
    });

    it('migrates legacy NSFW and scene workflows that still reference the removed Qwen GGUF model', () => {
        const legacyWorkflow = JSON.stringify({
            '49': {
                inputs: { unet_name: 'qwen-image-2512-Q6_K.gguf' },
                class_type: 'UnetLoaderGGUF'
            }
        });
        const settings = 构建ComfyUI测试设置({
            ComfyUI工作流JSON: 默认ComfyUI工作流JSON,
            场景生图独立接口启用: true,
            场景生图后端类型: 'comfyui',
            场景生图模型API地址: 'http://127.0.0.1:8188',
            场景ComfyUI工作流JSON: legacyWorkflow,
            NSFW生图独立接口启用: true,
            NSFW生图后端类型: 'comfyui',
            NSFW生图模型API地址: 'http://127.0.0.1:8188',
            NSFWComfyUI工作流JSON: legacyWorkflow
        });

        expect(settings.功能模型占位.使用默认场景ComfyUI工作流).toBe(true);
        expect(settings.功能模型占位.使用默认NSFWComfyUI工作流).toBe(true);
        expect(settings.功能模型占位.场景ComfyUI工作流JSON).toBe('');
        expect(settings.功能模型占位.NSFWComfyUI工作流JSON).toBe('');
        expect(获取场景文生图接口配置(settings)?.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
        expect(获取NSFW文生图接口配置(settings)?.ComfyUI工作流JSON).toBe(默认NSFWComfyUI工作流JSON);
        expect(settings.功能模型占位.场景ComfyUI工作流JSON).not.toContain('qwen-image-2512-Q6_K.gguf');
        expect(settings.功能模型占位.NSFWComfyUI工作流JSON).not.toContain('qwen-image-2512-Q6_K.gguf');
    });
});
