import { describe, expect, it } from 'vitest';
import { 默认ComfyUI工作流JSON, 默认NSFWComfyUI工作流JSON } from '../data/defaultComfyWorkflow';
import { 构建最终图片提示词 } from '../services/ai/imageTasks';
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
    it('uses bundled Z-Image Turbo AIO workflow for normal images and keeps the NSFW workflow separate', () => {
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
        expect(默认功能模型占位.文生图预设接口路径).toBe('comfyui_prompt');
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
        expect(workflow['9'].inputs.filename_prefix).toBe('ComfyUI');
        expect(nsfwWorkflow['9'].inputs.filename_prefix).toBe('z-image/nsfw');
        expect(workflow['4'].class_type).toBe('CheckpointLoaderSimple');
        expect(workflow['4'].inputs.ckpt_name).toBe('zImageTurboBaseAIO_zImageTurboFP8AIO.safetensors');
        expect(workflow['56'].class_type).toBe('LoraLoaderModelOnly');
        expect(workflow['56'].inputs.lora_name).toBe('Mystic-XXX-ZIT-v3.safetensors');
        expect(workflow['56'].inputs.strength_model).toBe(0.5);
        expect(workflow['56'].inputs.model).toEqual(['4', 0]);
        expect(workflow['57'].class_type).toBe('ModelSamplingAuraFlow');
        expect(workflow['57'].inputs.shift).toBe(3);
        expect(workflow['57'].inputs.model).toEqual(['56', 0]);
        expect(workflow['16'].inputs.text).toBe('__PROMPT__');
        expect(workflow['40'].inputs.text).toBe('__NEGATIVE_PROMPT__');
        expect(workflow['40'].class_type).toBe('CLIPTextEncode');
        expect(workflow['53'].inputs.width).toBe('__WIDTH__ ');
        expect(workflow['53'].inputs.height).toBe('__HEIGHT__');
        expect(workflow['3'].inputs.seed).toBe(31718977384718);
        expect(workflow['3'].inputs.steps).toBe(4);
        expect(workflow['3'].inputs.cfg).toBe(1);
        expect(workflow['3'].inputs.sampler_name).toBe('euler');
        expect(workflow['3'].inputs.scheduler).toBe('simple');
        expect(JSON.stringify(workflow)).not.toContain('qwen-image-2512-Q6_K.gguf');
        expect(JSON.stringify(workflow)).not.toContain('UnetLoaderGGUF');
        expect(JSON.stringify(workflow)).not.toContain('NunchakuZImageDiTLoader');
        expect(JSON.stringify(workflow)).not.toContain('z_image_turbo_bf16.safetensors');
        expect(JSON.stringify(workflow)).not.toContain('mPMix_NSFW_V9_fp8.safetensors');
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

    it('forces ComfyUI image requests to the native /prompt route when old settings keep OpenAI image paths', () => {
        const settings = 构建ComfyUI测试设置({
            文生图后端类型: 'comfyui',
            文生图预设接口路径: 'openai_images',
            文生图接口路径模式: 'preset'
        });
        const config = 获取文生图接口配置(settings);

        expect(config?.图片后端类型).toBe('comfyui');
        expect(config?.图片预设接口路径).toBe('comfyui_prompt');
        expect(config?.图片接口路径).toBe('/prompt');
    });

    it('sanitizes stale custom OpenAI paths when the selected image backend is ComfyUI', () => {
        const settings = 构建ComfyUI测试设置({
            文生图后端类型: 'comfyui',
            文生图接口路径模式: 'custom',
            文生图接口路径: '/v1/images/generations'
        });
        const config = 获取文生图接口配置(settings);

        expect(config?.图片后端类型).toBe('comfyui');
        expect(config?.图片接口路径).toBe('/prompt');
    });

    it('adds Z-Image prompt guidance only to non-close-up ComfyUI prompts and keeps close-ups macro-scoped', () => {
        const comfyConfig = {
            图片后端类型: 'comfyui',
            词组转化输出策略: 'plain'
        } as any;
        const openAIConfig = {
            图片后端类型: 'openai',
            词组转化输出策略: 'plain'
        } as any;

        const normalComfy = 构建最终图片提示词('幽冥冰莲', comfyConfig, { 构图: '场景' });
        const normalOpenAI = 构建最终图片提示词('幽冥冰莲', openAIConfig, { 构图: '场景' });
        const nsfwCloseup = 构建最终图片提示词('私密部位特写', comfyConfig, { 构图: '部位特写' });

        expect(normalComfy.最终正向提示词).toContain('Z-Image-Turbo narrative prompt');
        expect(normalComfy.最终正向提示词).not.toContain('露骨性器、体液、性行为细节');
        expect(normalOpenAI.最终正向提示词).not.toContain('Z-Image-Turbo narrative prompt');
        expect(nsfwCloseup.最终正向提示词).not.toContain('Z-Image-Turbo narrative prompt');
        expect(nsfwCloseup.最终正向提示词).not.toContain('露骨性器、体液、性行为细节');
        expect(nsfwCloseup.最终正向提示词).toContain('macro anatomical close-up');
        expect(nsfwCloseup.最终正向提示词).toContain('target fills the frame');
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

    it('migrates Nunchaku Z-Image workflows that fail with missing quantization weight metadata', () => {
        const legacyWorkflow = JSON.stringify({
            '46': {
                inputs: { model_name: 'z_image_turbo_bf16.safetensors' },
                class_type: 'NunchakuZImageDiTLoader'
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
