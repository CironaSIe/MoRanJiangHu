import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { 内置酒馆预设列表 } from '../data/bundledTavernPresets';
import { 规范化酒馆预设 } from '../utils/tavernPreset';

const loadBundledPreset = (fileName: string): unknown => {
    const presetPath = path.join(process.cwd(), 'public', 'tavern-presets', fileName);
    return JSON.parse(fs.readFileSync(presetPath, 'utf8'));
};

const userIzumiPresetPath = 'D:/下载/Izumi 0503.json';
const userIzumiIt = fs.existsSync(userIzumiPresetPath) ? it : it.skip;
const userIzumi0623PresetPath = 'D:/下载/Izumi 0623.json';
const userIzumi0623It = fs.existsSync(userIzumi0623PresetPath) ? it : it.skip;
const userDoublePresetPath = 'D:/下载/双人成行v10.0—青云上 (1).json';
const userDoubleIt = fs.existsSync(userDoublePresetPath) ? it : it.skip;

const loadUserIzumiPreset = (): unknown => {
    return JSON.parse(fs.readFileSync(userIzumiPresetPath, 'utf8'));
};

describe('酒馆预设兼容导入', () => {
    it('保留 Izumi 预设的 regex_scripts 扩展并区分可安全执行的清理脚本', () => {
        const normalized = 规范化酒馆预设(loadBundledPreset('izumi-0503.json'));

        expect(normalized).not.toBeNull();
        expect(normalized?.extensions?.regex_scripts).toHaveLength(26);
        expect(normalized?.兼容性?.正则脚本总数).toBe(26);
        expect(normalized?.兼容性?.安全清理脚本数).toBe(10);
        expect(normalized?.兼容性?.选项渲染脚本数).toBeGreaterThanOrEqual(1);
        expect(normalized?.兼容性?.HTML美化脚本数).toBe(11);
        expect(normalized?.兼容性?.JS交互脚本数).toBe(4);
        expect(normalized?.兼容性?.仍跳过脚本数).toBe(1);
        expect(normalized?.兼容性?.仅保留元数据脚本数).toBe(0);
        expect(normalized?.兼容性?.说明.some(item => item.includes('安全清理脚本'))).toBe(true);
        expect(normalized?.兼容性?.说明.some(item => item.includes('沙箱 iframe'))).toBe(true);
    });

    it('将 Izumi 0623 注册为允许导入的内置酒馆预设', () => {
        const entry = 内置酒馆预设列表.find(item => item.id === 'builtin_izumi_0623');

        expect(entry).toMatchObject({
            名称: 'Izumi 0623',
            path: '/tavern-presets/izumi-0623.json'
        });
        expect(规范化酒馆预设(loadBundledPreset('izumi-0623.json'))).not.toBeNull();
    });

    userIzumi0623It('用户提供的 Izumi 0623 预设兼容安全选项适配', () => {
        const normalized = 规范化酒馆预设(JSON.parse(fs.readFileSync(userIzumi0623PresetPath, 'utf8')));

        expect(normalized).not.toBeNull();
        expect(normalized?.prompts.length).toBeGreaterThan(0);
        expect(normalized?.extensions?.regex_scripts).toHaveLength(26);
        expect(normalized?.兼容性?.正则脚本总数).toBe(26);
        expect(normalized?.兼容性?.安全清理脚本数).toBe(10);
        expect(normalized?.兼容性?.选项渲染脚本数).toBe(1);
        expect(normalized?.兼容性?.HTML美化脚本数).toBe(11);
        expect(normalized?.兼容性?.JS交互脚本数).toBe(4);
        expect(normalized?.兼容性?.仍跳过脚本数).toBe(1);
        expect(normalized?.兼容性?.仅保留元数据脚本数).toBe(0);
    });

    userDoubleIt('用户提供的双人成行预设可导入并保留扩展兼容信息', () => {
        const normalized = 规范化酒馆预设(JSON.parse(fs.readFileSync(userDoublePresetPath, 'utf8')));

        expect(normalized).not.toBeNull();
        expect(normalized?.prompts.length).toBeGreaterThan(0);
        expect(normalized?.extensions?.regex_scripts).toHaveLength(41);
        expect(normalized?.兼容性?.正则脚本总数).toBe(41);
        expect(normalized?.兼容性?.选项渲染脚本数).toBeGreaterThanOrEqual(1);
        expect((normalized?.兼容性?.已分类脚本列表 || []).length).toBe(normalized?.兼容性?.正则脚本总数);
        expect(normalized?.兼容性?.说明.some(item => item.includes('HTML 美化') || item.includes('沙箱 iframe'))).toBe(true);
    });

    userIzumiIt('用户提供的 Izumi 0503 预设可识别为安全选项栏适配来源', () => {
        const normalized = 规范化酒馆预设(loadUserIzumiPreset());
        const scripts = Array.isArray(normalized?.extensions?.regex_scripts)
            ? normalized.extensions.regex_scripts as any[]
            : [];
        const optionScript = scripts.find((script) => (
            typeof script?.findRegex === 'string'
            && script.findRegex.includes('<options>')
            && typeof script?.replaceString === 'string'
            && script.replaceString.includes('data-option-text')
        ));

        expect(normalized).not.toBeNull();
        expect(normalized?.兼容性?.选项渲染脚本数).toBeGreaterThanOrEqual(1);
        expect(optionScript?.scriptName).toContain('选项栏');
    });
});
