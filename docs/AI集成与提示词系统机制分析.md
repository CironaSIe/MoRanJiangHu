# AI 集成与提示词系统机制分析

## 目录

1. [API 调用链路](#1-api-调用链路)
2. [提示词构建](#2-提示词构建)
3. [DeepSeek/GPT/Gemini 兼容性](#3-deepseekgptgemini-兼容性)
4. [文章优化](#4-文章优化)
5. [变量生成](#5-变量生成)
6. [规划分析](#6-规划分析)
7. [世界演变](#7-世界演变)
8. [地图更新](#8-地图更新)
9. [叙事平静值](#9-叙事平静值)
10. [性别比例演变](#10-性别比例演变)

---

## 1. API 调用链路

### 1.1 完整流程概览

```
用户输入 → sendWorkflow → systemPromptBuilder → mainStoryRequest → storyTasks → chatCompletionClient → 外部 API → 流式响应 → 解析 → 队列阶段
```

### 1.2 数据流图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         执行主剧情发送工作流                                   │
│                     (hooks/useGame/sendWorkflow.ts:1025)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ① 剧情回忆检索 (可选)                                                       │
│     └→ recallWorkflow → storyTasks.generateMemoryRecall                      │
│         → chatCompletionClient.requestModelText                               │
│                                                                             │
│  ② 构建系统提示词                                                             │
│     └→ systemPromptBuilder() → 返回 contextPieces                            │
│                                                                             │
│  ③ 构建消息链                                                                │
│     └→ mainStoryRequest() → 返回 orderedMessages[]                           │
│                                                                             │
│  ④ 主剧情 AI 请求                                                            │
│     └→ text.generateStoryResponse() → chatCompletionClient.requestModelText   │
│         → 流式 SSE 解析 → 标签协议解析 → GameResponse                        │
│                                                                             │
│  ⑤ 后台队列处理                                                               │
│     ├→ 文章优化 (bodyPolish)                                                  │
│     ├→ 变量生成 (variableModelWorkflow)                                       │
│     ├→ 动态世界 (worldEvolutionWorkflow)                                      │
│     ├→ 规划分析 (planningUpdateWorkflow)                                      │
│     └→ 地图更新 (mapUpdateWorkflow)                                           │
│                                                                             │
│  ⑥ 最终落盘 → 自动存档                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 关键文件与行号

| 阶段 | 文件 | 行号 | 说明 |
|------|------|------|------|
| 入口 | `hooks/useGame/sendWorkflow.ts` | 1025 | `执行主剧情发送工作流` 函数签名 |
| 系统提示词构建 | `hooks/useGame/systemPromptBuilder.ts` | 335 | `构建系统提示词` 函数 |
| 消息链组装 | `hooks/useGame/mainStoryRequest.ts` | 113 | `构建主剧情请求参数` 函数 |
| AI 任务封装 | `services/ai/storyTasks.ts` | 全文 | 各独立阶段的 AI 调用封装 |
| HTTP 请求层 | `services/ai/chatCompletionClient.ts` | 全文 | `请求模型文本` 核心函数 |
| 流式解析 | `services/ai/chatCompletionClient.ts` | 898-1013 | SSE 文本处理器 |

### 1.4 chatCompletionClient 核心机制

**文件**: `services/ai/chatCompletionClient.ts`

核心函数 `请求模型文本` 的执行流程：

1. **消息链规范化** (`规范化文本补全消息链`, 行 80-114)
   - 合并连续同角色消息
   - 保留/剥离 system 角色
   - 处理 prefix 标记

2. **模型兼容修正** (行 527-671)
   - `应用DeepSeek消息兼容修正` — DeepSeek 不支持尾部 assistant 消息，需移除或转换
   - `应用GLM消息兼容修正` — GLM 类似限制
   - `应用Claude兼容末尾User修正` — Claude 系列末尾必须是 user

3. **上下文完整性校验** (行 394-484)
   - 注入随机校验标记 `[CTXCHK:xxxxxx]`
   - 响应中检测标记是否存在
   - 不存在则警告可能存在上下文截断

4. **流式响应解析** (行 898-1072)
   - SSE 帧解析
   - 增量提取器支持 reasoning_content
   - XHR 流式回退（旧浏览器）
   - 原生 Capacitor 流（移动端）

5. **重试机制** (行 752-788)
   - 指数退避 + 随机抖动
   - 可重试状态码: 408/409/425/429/500/502/503/504
   - 流式连接中断自动重试

---

## 2. 提示词构建

### 2.1 systemPromptBuilder 组装流程

**文件**: `hooks/useGame/systemPromptBuilder.ts:335`

```
构建系统提示词 返回结构:
├─ systemPrompt: string (未直接使用，改为 contextPieces)
├─ shortMemoryContext: string (短期记忆文本)
├─ runtimePromptStates: Record<string, 运行时提示词状态>
└─ contextPieces: 系统提示词上下文片段
    ├─ AI角色声明
    ├─ worldPrompt (世界观)
    ├─ 地图建筑状态
    ├─ 同人设定摘要
    ├─ 境界体系提示词
    ├─ otherPrompts (叙事/规则提示词)
    ├─ 难度设置提示词
    ├─ 叙事人称提示词
    ├─ 字数设置提示词
    ├─ COT提示词
    ├─ 格式提示词
    ├─ 输出协议提示词
    ├─ 字数要求提示词
    ├─ 免责声明输出提示词
    ├─ 离场NPC档案
    ├─ 长期记忆
    ├─ 中期记忆
    ├─ 在场NPC档案
    ├─ 剧情安排
    ├─ 女主剧情规划状态
    ├─ 世界状态
    ├─ 环境状态
    ├─ 角色状态
    ├─ 战斗状态
    ├─ 门派状态
    ├─ 任务状态
    ├─ 约定状态
    └─ 叙事状态 (叙事平静值)
```

### 2.2 提示词注入顺序

**文件**: `hooks/useGame/mainStoryRequest.ts:219-331`

消息链按以下顺序排列（非酒馆模式）：

```
1. system: AI角色声明
2. system: 世界观提示词
3. system: 地图与空间锚点
4. system: 同人设定摘要
5. system: 境界体系提示词
6. system: 以下为不在场角色 (离场NPC档案)
7. system: 叙事/规则提示词
8. system: 难度设置提示词
9. system: 叙事人称提示词
10. system: 字数要求提示词
11. system: 长期记忆
12. system: 中期记忆
13. system: 剧情安排
14. system: 小说分解注入
15. system: 以下为在场角色 (在场NPC档案)
16. system: 女主剧情规划
17. system: 世界
18. system: 当前环境
19. system: 用户角色数据
20. system: 战斗
21. system: 玩家门派
22. system: 任务列表
23. system: 约定列表
24. system: 短期记忆
25. system: 即时剧情回顾 (历史对话)
26. system: 剧情风格助手消息
27. system: 真实世界模式消息 (可选)
28. system: DeepSeek兼容模式 (可选)
29. system: GLM兼容模式 (可选)
30. system: 繁体中文输出要求 (可选)
31. user: 额外要求提示词
32. user: 免责声明输出要求
33. system: 输出格式提示词
34. system: COT提示词
35. user: 本回合硬性字数要求
36. assistant: 最新用户输入 (GPT模式除外)
37. user: 本回合用户输入 / 开始任务
38. assistant: COT伪装历史消息 (可选)
39. assistant: DeepSeek锁格式Prefix "<thinking>\n" (可选)
40. assistant: GLM锁格式Prefix (可选)
```

### 2.3 Prompt Pool 体系

**文件**: `hooks/useGame/promptRuntime.ts:638`

运行时提示词池构建 (`构建运行时提示词池`):

- **核心提示词** (prompts/core/): 世界观、数据格式、剧情规则等
- **COT 提示词** (prompts/core/cot.ts): 思维链模板，按模式选择
  - 普通版、同人版、女主规划版、NTL女主规划版等
- **运行时提示词** (prompts/runtime/): 协议指令、格式约束、角色身份
- **世界书注入** (utils/worldbook.ts): 按作用域注入
- **内置提示词** (utils/builtinPrompts.ts): 槽位系统

**提示词过滤规则**:
- 修炼体系关闭时移除: `core_realm`, `stat_kungfu`, `stat_cultivation`
- 饱腹口渴系统关闭时移除含关键词的行
- 世界演变分流时剥离 COT 中的世界命令
- 主剧情剥离: `core_story`, `core_heroine_plan`, `stat_world_evo`

---

## 3. DeepSeek/GPT/Gemini 兼容性

### 3.1 消息模式

**文件**: `hooks/useGame/mainStoryRequest.ts:130-137`

系统支持 5 种消息模式:

| 模式 | 标识 | GPT模式 | 特殊处理 |
|------|------|---------|----------|
| Gemini模式 | `Gemini模式` | false | 默认模式 |
| GPT兼容 | `GPT` | true | 用户输入在正确位置 |
| DeepSeek标准 | `DeepSeek标准` | true | 兼容提示词 |
| DeepSeek锁格式 | `DeepSeek锁格式` | true | + Prefix能力探测 |
| GLM标准/锁格式 | `GLM标准`/`GLM锁格式` | true | GLM特殊修正 |

### 3.2 DeepSeek 兼容策略

**文件**: `prompts/runtime/deepseekMode.ts`

- **DeepSeek标准**: 注入兼容提示词，要求严格遵守输出协议
- **DeepSeek锁格式**: 更高优先级锁定输出协议，不允许漂移格式

**文件**: `services/ai/chatCompletionClient.ts:527-596`

DeepSeek 消息修正:
1. 移除尾部非 prefix assistant 消息
2. 首条非 system 的 assistant 转为 user
3. 合并 assistant-before-only-user 模式
4. 确保末尾为 user 角色（prefix assistant 除外）

### 3.3 Gemini 特殊处理

**文件**: `services/ai/chatCompletionClient.ts:364-377`

- 检测 Gemini 接口地址
- 构建 Gemini Interactions 端点
- 支持 reasoning 模型（reasoning_content 字段）

### 3.4 协议请求头

**文件**: `services/ai/chatCompletionClient.ts:179-189`

- 标准: `Authorization: Bearer <key>`
- 小米 MiMo: `api-key: <key>`

---

## 4. 文章优化

### 4.1 bodyPolish 流程

**文件**: `hooks/useGame/bodyPolish.ts:373`

```
执行正文润色 流程:
├─ 检查文章优化是否已开启
├─ 获取文章优化接口配置 (独立API或复用主剧情)
├─ 构建润色提示词:
│   ├─ 基础提示词 (用户自定义或默认)
│   ├─ 格式协议 (从 core_format 提取)
│   ├─ 情绪守卫 (write_emotion_guard)
│   ├─ 动态同步约束 (叙事人称/字数/动作/玩家输入/括号)
│   ├─ 文章优化上下文 (时间/地点/在场角色/章节)
│   ├─ 输出结构硬约束 (thinking + 正文)
│   └─ COT 提示词 (核心_文章优化思维链)
├─ 第一次润色请求
│   └─ 检测协议确认污染 → 自动重试
├─ 对白标签丢失检测 → 自动重试
├─ 字数评估:
│   ├─ 正常模式: 不低于原文 75%
│   └─ 扩写模式: 达到目标字数
│       ├─ 二次扩写
│       └─ 抗截断续写 (半成品续写)
├─ 净化角色对白行
└─ 返回优化后 GameResponse
```

### 4.2 独立 API 配置

**文件**: `utils/apiConfig.ts` → `获取文章优化接口配置`

- 支持独立 API 地址、Key、模型
- 支持非流式输出配置
- 支持自定义提示词 (`功能模型占位.文章优化提示词`)

### 4.3 协议确认污染检测

**文件**: `hooks/useGame/bodyPolish.ts:86-115`

检测模型是否陷入"好的，将以 `<正文>` 标签输出"的复读循环：
- 确认句重复 ≥ 2 次 → 污染
- 确认句 ≥ 1 次但正文 < 20 字 + 协议标签提及 ≥ 3 → 污染

---

## 5. 变量生成

### 5.1 variableModelWorkflow 流程

**文件**: `hooks/useGame/variableModelWorkflow.ts:612`

```
执行变量模型校准工作流:
├─ 检查变量校准功能是否已启用
├─ 获取变量计算接口配置
├─ 构建状态 JSON (角色/环境/世界/社交/战斗/门派/任务/约定)
├─ 构建审计提示词:
│   ├─ 正文对白人物审计
│   ├─ 社交档案完整性审计
│   ├─ 主角私密档案审计
│   ├─ 环境天气审计
│   ├─ 变量路径登记提示
│   ├─ 女性姓名候选提示
│   └─ 模板姓名黑名单提示
├─ 构建变量规则上下文 (变量相关规则提示词)
├─ 调用 AI → generateVariableCalibrationUpdate
├─ 解析响应 → 提取 <说明> 和 <命令> 块
├─ 校验并规整结果:
│   ├─ 路径合法性检查 (白名单)
│   ├─ 变量命令登记校验
│   ├─ 去重
│   ├─ 女性姓名黑名单检查
│   ├─ 模板姓名黑名单检查
│   ├─ 主角名≠社交名检查
│   ├─ NPC 改名检查
│   ├─ NPC 删除检查
│   ├─ 任务奖励占位检查
│   └─ NPC 死亡判定检查
└─ 校验失败 → 自动重试一次
```

### 5.2 variableCalibration 自动校准

**文件**: `hooks/useGame/variableCalibration.ts:52`

不依赖 AI 的纯本地数值校准:
- 当前值夹取到 [0, 最大值] 范围
- 七部位血量校准
- 精力/内力/饱腹/口渴校准
- 门派状态同步
- 剧情状态规范化

### 5.3 变量路径白名单

**文件**: `hooks/useGame/variableModelWorkflow.ts:71-80`

```
允许根路径:
- gameState.角色
- gameState.环境
- gameState.世界
- gameState.社交
- gameState.战斗
- gameState.玩家门派
- gameState.任务列表
- gameState.约定列表
```

---

## 6. 规划分析

### 6.1 planningUpdateWorkflow 流程

**文件**: `hooks/useGame/planningUpdateWorkflow.ts:222`

```
创建规划更新工作流 → 后台执行统一规划分析:
├─ 检查是否已有规划分析在进行
├─ 获取规划分析接口配置
├─ 提取当前正文 (本回合 + 最近 3 回合)
├─ 提取当前规划文本
├─ 构建审计焦点:
│   ├─ 剧情规划时间触发原因
│   ├─ 剧情正文命中原因
│   ├─ 女主规划时间触发原因
│   └─ 女主正文命中原因
├─ 构建世界书注入 (story_plan / heroine_plan 作用域)
├─ 构建小说拆分注入
├─ 构建性别比例约束摘要
├─ 序列化载荷 (剧情/规划/世界/社交/环境)
├─ 调用 AI → generatePlanningAnalysis
├─ 过滤补丁命令:
│   ├─ 剧情补丁 (剧情/gameState.剧情)
│   ├─ 剧情规划补丁
│   └─ 女主规划补丁
├─ 检查 shouldApply 是否过期
├─ 应用补丁命令 → applyStateCommand
├─ 同步小说分解时间校准
└─ 写入状态 + 触发自动存档
```

### 6.2 切章判断

规划分析 AI 通过分析以下因素判断是否切章：
- 当前章节任务完成状态
- 原著推进状态
- 当前待解问题
- 切章条件命中
- 正文内容与下一章进入条件的匹配度

---

## 7. 世界演变

### 7.1 worldEvolutionWorkflow 流程

**文件**: `hooks/useGame/worldEvolutionWorkflow.ts:174`

```
执行世界演变更新工作流:
├─ 收集动态世界线索 + 到期摘要
├─ 叙事平静值高时追加远处事件线索
├─ 获取世界演变接口配置
├─ 去重签名检查 (避免重复执行相同任务)
├─ 规范化世界状态/剧情状态/环境
├─ 构建世界演变上下文文本:
│   ├─ 世界观提示词
│   ├─ 世界演变提示词 (stat_world_evo)
│   ├─ 环境/世界/剧情数据
│   ├─ 短期记忆
│   ├─ 历史剧本 (最近 6 回合)
│   ├─ 当前回合正文/规划/命令
│   └─ 动态线索 + 到期摘要
├─ 构建世界书注入 (world_evolution 作用域)
├─ 构建小说拆分注入
├─ 构建 COT 提示词 (世界演变思考协议)
├─ 调用 AI → generateWorldEvolutionUpdate
├─ 解析响应 → 提取 <说明> 和 <命令>
├─ 规范化命令列表
├─ 应用命令 → processResponseCommands
├─ 整理客户可见世界大事
├─ 写入世界事件列表
└─ 追加系统消息到历史
```

### 7.2 世界演变 COT 协议

**文件**: `prompts/runtime/worldEvolutionCot.ts`

16 步思考协议:
- Step0: 范围确认
- Step1: 更新必要性审计
- Step2: 时间门槛审计
- Step3: 章节滑窗联动
- Step4: 活跃 NPC 推进与条数维护 (常态 7 条)
- Step5: 世界事件推进与并发维护 (常态 5 条)
- Step6: 世界镜头与史册维护清理
- Step7: 地图、建筑与地点联动
- Step8: 环境层联动审计
- Step8.5: 性别比例演变审计 (可选)
- Step8.6: 地点级性别比例审计 (可选)
- Step9: 候选命令预演
- Step10: 迁移、清理与顺序复核
- Step11: 证据强度与一致性复核
- Step12: 输出说明成型
- Step13: 输出结构复核
- Step14: 命令落地预检
- Step15: 命令落地

---

## 8. 地图更新

### 8.1 mapUpdateWorkflow 流程

**文件**: `hooks/useGame/mapUpdateWorkflow.ts:10`

两种模式:

| 模式 | 标识 | 用途 |
|------|------|------|
| 回忆库重建 | `memory_regenerate` | 旧存档适配，全量重建 |
| 增量更新 | `auto_incremental` | 正文后自动增量更新 |

### 8.2 增量更新流程

```
生成地图更新 (auto_incremental):
├─ 获取地图自动更新接口配置
├─ 构建用户提示词:
│   ├─ 当前地点链
│   ├─ 本回合正文
│   ├─ 当前人物位置线索
│   ├─ 已有地图层级
│   ├─ 已知势力版图
│   └─ 自动更新规则 (9条)
├─ 构建系统提示词 (builtin_map_regenerate_system_prompt)
├─ 构建 COT 提示词 (builtin_map_regenerate_cot)
├─ 调用 AI → chatCompletionClient.requestModelText
├─ 解析命令块:
│   ├─ 提取 <命令> 标签
│   ├─ 解析 push/set/delete 命令
│   ├─ 去重 (已有名称跳过)
│   └─ 父级ID解析
└─ 返回 TavernCommand[]
```

### 8.3 回忆库重建流程

```
生成地图更新 (memory_regenerate):
├─ 获取地图生成接口配置
├─ 构建回忆库线索:
│   ├─ 回忆档案 (最近 120 条)
│   ├─ 长期记忆
│   ├─ 中期记忆 (最近 80 条)
│   ├─ 短期记忆 (最近 80 条)
│   └─ 即时记忆 (最近 40 条)
├─ 构建用户提示词 (JSON 格式输出)
├─ 调用 AI → 返回 {"地点树":[...]}
├─ 解析 JSON → 规范化层级
├─ 分配 DT-xxx ID
├─ 返回 newLayers[]
└→ App.tsx 清除旧坐标字段 → 写入新 世界.地图层级
```

### 8.4 六层地图树

**文件**: `hooks/useGame/mapUpdateWorkflow.ts:49`

```
寰宇 → 大地点 → 中地点 → 小地点 → 区地点 → 子地点
```

---

## 9. 叙事平静值

### 9.1 计数器机制

**文件**: `hooks/useGame/sendWorkflow.ts:993-1023`

```typescript
// 计算本回合目标计数
const 计算本回合目标计数 = (tags, 当前计数, config) => {
    const 上限 = config.上限 ?? 32;
    const 无标签增量 = config.无标签增量 ?? 2;
    const 延续增量 = config.延续增量 ?? 1;
    
    if (tags.length === 0) return Math.min(当前计数 + 无标签增量, 上限);
    
    const candidates = tags.map(t => {
        if (t.prefix === '介入' || t.prefix === '退出' || t.prefix === '结束') return 0;
        return Math.min(当前计数 + 延续增量, 上限);
    });
    return Math.min(...candidates);
};
```

**规则**:
- 无 `<情节事件>` 标签: 计数 +2 (平静值上升)
- 有 `介入`/`退出`/`结束`: 计数归零 (事件打断平静)
- 有 `延续`: 计数 +1 (缓慢上升)
- 上限: 32

### 9.2 文本注入

**文件**: `hooks/useGame/systemPromptBuilder.ts:782-804`

```typescript
const 构建叙事状态文本 = (payload) => {
    if (!config.启用) return '';
    if (计数 < config.最低触发阈值 ?? 12) return '';
    
    const text = 计算当前阈值文本(计数, config);
    const parts = [];
    
    if (活跃事件) parts.push(`当前：${活跃事件}（仍在进行）`);
    if (text) parts.push(text);
    
    if (计数 >= 计算远处联动阈值(config)) {
        // 追加远处事件线索
        const 远处线索 = [...待执行事件, ...进行中事件]
            .filter(e => e.主角参与度 <= 0.2).slice(0, 2);
        if (远处线索.length > 0) {
            parts.push('远处动向：' + 远处线索.map(...).join('；'));
        }
    }
    return parts.join('\n');
};
```

**注入位置**: 系统提示词的 `叙事状态` 槽位

---

## 10. 性别比例演变

### 10.1 Step8.5: 世界级性别比例审计

**文件**: `prompts/runtime/worldEvolutionCot.ts:108-163`

**两种合法模式**:

#### 模式 A: 一次性极大事件（世界机制改变）

必要条件（全部满足）:
1. 正文已明确坐实一个改写世界机制本身的极大事件
2. 因果链完整：原因→机制→结果
3. 是已发生事实，不是"可能"/"即将"/"据说"

复核清单:
- 世界的性别决定/生育/转化机制发生了根本性改变
- 不是大规模集体性转

#### 模式 B: 渐进式世界级变化

必要条件（全部满足）:
1. 正文已明确坐实新法术体系/新力量体系/世界规则改变
2. 该体系改写了世界的性别机制
3. 世界机制改变已启动，人口结构正在悄悄持续变化

更新节奏：逐步更新，非常规回合不提及则保持原值

#### 绝对不触发的情况（硬约束）:

- 个体角色性转
- 大规模集体性转（世界机制未变）
- 模糊的氛围描写
- 暗示性表述
- 普通瘟疫/普通天灾
- "神秘力量"等模糊词
- 易容/伪装
- 普通回合的日常叙事
- 无因果漂移

### 10.2 Step8.6: 地点级性别比例审计

**文件**: `prompts/runtime/worldEvolutionCot.ts:147-163`

触发条件（全部满足）:
1. 正文已明确坐实影响该地点的性别变化事件
2. 事件已发生
3. 该地点可对应到 大地点/中地点/小地点

更新方式:
```
set 世界.地图层级[i].性别比例 = {男,女,男娘,扶她}
set 世界.地图层级[i].性别比例恢复回合 = -1 | >0
set 世界.地图层级[i].性别比例变更原因 = "事件摘要"
```

### 10.3 启用条件

**文件**: `hooks/useGame/worldEvolutionWorkflow.ts:321`

```typescript
const genderEvolutionEnabled = 
    (deps.开局配置?.modeRuntimeProfile?.性别比例演变预设 
        ?? worldRuntimeGameConfig.性别比例自动演变 
        ?? false) === true;
```

需要通过 COT 选项注入到世界演变思考协议中。

---

## 附录：关键文件索引

| 模块 | 文件路径 | 核心函数 |
|------|----------|----------|
| 工作流入口 | `hooks/useGame/sendWorkflow.ts` | `执行主剧情发送工作流` |
| 系统提示词 | `hooks/useGame/systemPromptBuilder.ts` | `构建系统提示词` |
| 消息链 | `hooks/useGame/mainStoryRequest.ts` | `构建主剧情请求参数` |
| 运行时提示词 | `hooks/useGame/promptRuntime.ts` | `构建运行时提示词池` |
| AI 任务 | `services/ai/storyTasks.ts` | 各 generateXxx 函数 |
| HTTP 客户端 | `services/ai/chatCompletionClient.ts` | `请求模型文本` |
| 文章优化 | `hooks/useGame/bodyPolish.ts` | `执行正文润色` |
| 变量生成 | `hooks/useGame/variableModelWorkflow.ts` | `执行变量模型校准工作流` |
| 变量校准 | `hooks/useGame/variableCalibration.ts` | `执行变量自动校准` |
| 规划分析 | `hooks/useGame/planningUpdateWorkflow.ts` | `创建规划更新工作流` |
| 世界演变 | `hooks/useGame/worldEvolutionWorkflow.ts` | `执行世界演变更新工作流` |
| 地图更新 | `hooks/useGame/mapUpdateWorkflow.ts` | `生成地图更新` |
| DeepSeek模式 | `prompts/runtime/deepseekMode.ts` | `获取DeepSeek主剧情兼容提示词` |
| 世界演变COT | `prompts/runtime/worldEvolutionCot.ts` | `构建世界演变COT提示词` |
| 核心数据定义 | `prompts/core/data.ts` | `核心_数据格式` |
