# 酒馆预设兼容设计

## 目标

导入外部 SillyTavern/酒馆预设时，保留核心提示词结构和常见扩展字段，并让 Izumi 这类使用 `<options>` 与 `regex_scripts` 的预设至少能生成本项目的回合选项按钮。

## 范围

- 保留 `prompts`、`prompt_order` 以外的安全元数据，尤其是 `extensions.regex_scripts`。
- 为导入后的预设生成兼容诊断，标记正则脚本数量、可安全适配的选项脚本数量，以及因包含 DOM/JS 等高风险能力而跳过的脚本数量。
- 解析常见酒馆选项块，例如 `<options>>选项一：...>选项二：...</options>`，并转成项目内的 `action_options`。
- 不执行外部预设中的任意 JavaScript，不访问 `window.parent`、DOM、网络或本地存储。

## 非目标

- 不完整模拟 SillyTavern 前端运行时。
- 不把外部 HTML/JS 原样插入游戏页面。
- 不改变现有酒馆预设消息链的核心排序逻辑。

## 关键文件

- `utils/tavernPreset.ts`
- `models/system.ts`
- `services/ai/storyResponseParser.ts`
- `components/features/Settings/TavernPresetSettings.tsx`

## 验证

- 用内置 Izumi 样本和用户提供的 `D:/下载/Izumi 0503.json` 验证导入兼容信息。
- 用解析器测试验证 `<options>` 可生成四个回合选项。
- 跑相关单测和本地构建。
