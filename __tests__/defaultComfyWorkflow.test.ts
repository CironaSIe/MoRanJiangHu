import { describe, expect, it } from 'vitest';
import { 默认ComfyUI工作流JSON, 默认NSFWComfyUI工作流JSON } from '../data/defaultComfyWorkflow';
import { 默认功能模型占位, 规范化接口设置 } from '../utils/apiConfig';

describe('默认 ComfyUI 生图配置', () => {
    it('uses the bundled z-image turbo workflow for both normal and NSFW ComfyUI images', () => {
        const workflow = JSON.parse(默认功能模型占位.ComfyUI工作流JSON);
        const nsfwWorkflow = JSON.parse(默认功能模型占位.NSFWComfyUI工作流JSON);

        expect(默认功能模型占位.文生图后端类型).toBe('comfyui');
        expect(默认功能模型占位.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
        expect(默认功能模型占位.NSFWComfyUI工作流JSON).toBe(默认NSFWComfyUI工作流JSON);
        expect(默认ComfyUI工作流JSON).toBe(默认NSFWComfyUI工作流JSON);
        expect(workflow).toEqual(nsfwWorkflow);
        expect(workflow['46'].inputs.unet_name).toBe('mPMix_NSFW_V9_fp8.safetensors');
        expect(workflow['40'].inputs.vae_name).toBe('ae.safetensors');
        expect(workflow['45'].inputs.text).toBe('__PROMPT__');
        expect(workflow['41'].inputs.width).toBe('__WIDTH__');
        expect(workflow['41'].inputs.height).toBe('__HEIGHT__');
        expect(workflow['44'].inputs.seed).toBe('__SEED__');
        expect(workflow['44'].inputs.steps).toBe('__STEPS__');
        expect(workflow['44'].inputs.cfg).toBe('__CFG__');
        expect(workflow['44'].inputs.sampler_name).toBe('__SAMPLER__');
        expect(workflow['44'].inputs.scheduler).toBe('__SCHEDULER__');
        expect(nsfwWorkflow['46'].inputs.unet_name).toBe('mPMix_NSFW_V9_fp8.safetensors');
        expect(nsfwWorkflow['40'].inputs.vae_name).toBe('ae.safetensors');
        expect(nsfwWorkflow['45'].inputs.text).toBe('__PROMPT__');
        expect(nsfwWorkflow['41'].inputs.width).toBe('__WIDTH__');
        expect(nsfwWorkflow['41'].inputs.height).toBe('__HEIGHT__');
        expect(nsfwWorkflow['44'].inputs.seed).toBe('__SEED__');
        expect(nsfwWorkflow['44'].inputs.steps).toBe('__STEPS__');
        expect(nsfwWorkflow['44'].inputs.cfg).toBe('__CFG__');
        expect(nsfwWorkflow['44'].inputs.sampler_name).toBe('__SAMPLER__');
        expect(nsfwWorkflow['44'].inputs.scheduler).toBe('__SCHEDULER__');
    });

    it('fills the default workflow when old settings have no ComfyUI workflow', () => {
        const settings = 规范化接口设置({
            功能模型占位: {
                文生图后端类型: 'openai',
                文生图模型使用模型: '',
                文生图模型API地址: '',
                文生图模型API密钥: '',
                ComfyUI工作流JSON: ''
            }
        });

        expect(settings.功能模型占位.文生图后端类型).toBe('comfyui');
        expect(settings.功能模型占位.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
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
        const settings = 规范化接口设置({
            功能模型占位: {
                文生图后端类型: 'comfyui',
                ComfyUI工作流JSON: legacyWorkflow
            }
        });

        expect(settings.功能模型占位.ComfyUI工作流JSON).toBe(默认ComfyUI工作流JSON);
    });
});
