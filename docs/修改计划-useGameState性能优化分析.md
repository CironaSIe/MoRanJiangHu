# useGameState 性能优化分析

## 现状

### 数据结构
- `useGameState.ts`: 51 个 `useState`，全部平铺
- `useGame.ts`: 将 `useGameState` 的返回值 + 计算属性包装为 `state` 对象返回
- `App.tsx`: 唯一直接消费者 — `const { state, meta, setters, actions } = useGame()`

### 消费模式
- `App.tsx` 通过 `state.xxx` 读取 413 处
- 高频读取：`apiConfig`(26)、`view`(22)、`gameConfig`(17)、`showXxx`(70)
- 子组件通过 props 接收具体字段，不直接消费 `useGame()`

### 实际渲染行为
- `App.tsx` 订阅了整个 `state` 对象
- 任何 `useState` 的 `setState` 都会触发 `App.tsx` 重渲染
- `App.tsx` 重渲染会导致其所有子组件（整个游戏界面）重渲染

## 根因分析

### 问题本质
不是"51 个 useState"的问题，而是**消费侧的粒度太粗**：
- `App.tsx` 消费了整个 `state` 对象
- 任何一个字段变化（如 `loading`）都会导致整个 `App` 重渲染
- `App` 重渲染 → 所有子组件重渲染（即使子组件的 props 没变）

### React 19 的保护
- React 19 Compiler 会自动 memoizes 一些组件和值
- 但 `App.tsx` 是顶层组件，Compiler 无法完全避免其重渲染
- 子组件如果没有 `React.memo`，会跟随父组件重渲染

## 优化方案

### 方案 A：消费侧拆分（推荐）

**思路**：不改变 `useGameState` 的结构，而是在消费侧做优化。

**改动范围**：
1. `App.tsx` — 将大组件拆分为多个小的、订阅特定 state 的子组件
2. 子组件用 `React.memo` 包装，只在相关 props 变化时重渲染
3. 高频变化的 state（如 `loading`）单独传递给需要的组件

**影响范围**：
- 只改 `App.tsx` 和其子组件
- 不改 `useGameState.ts`、`useGame.ts`、hooks 层
- 不改数据流和接口

**风险评估**：低。纯 UI 层重构，不影响业务逻辑。

**工作量**：中等。需要拆分 `App.tsx` 的 JSX 结构。

### 方案 B：State 分域（不推荐）

**思路**：将 51 个 useState 按功能分组到多个 custom hooks。

**改动范围**：
1. `useGameState.ts` — 拆分为 `useGameData()`、`useUIState()`、`useConfigState()` 等
2. `useGame.ts` — 适配新的分域 hooks
3. `App.tsx` — 消费多个 hooks

**影响范围**：大。涉及核心状态管理重构。

**风险评估**：高。可能引入状态同步问题。

**工作量**：大。

### 方案 C：保持现状 + React.memo 局部优化（推荐，当前阶段）

**思路**：保持当前结构，只对高频变化且影响范围大的组件加 `React.memo`。

**改动范围**：
1. `TopBar`、`ChatList`、`RightPanel` 等高频渲染组件加 `React.memo`
2. 传递给子组件的回调函数用 `useCallback` 稳定引用

**影响范围**：极小。只改几个组件文件。

**风险评估**：极低。纯加法，不改现有逻辑。

**工作量**：小。

## 推荐方案

**当前阶段选方案 C**，理由：
1. React 19 Compiler 已自动处理大部分 memoization
2. 真正的瓶颈是 `App.tsx` 重渲染导致全树重渲染，而不是 useState 数量
3. 方案 C 改动最小、风险最低、效果最直接

**长期可考虑方案 A**：当功能继续增长，`App.tsx` 变得难以维护时再做拆分。

---

## 修改范围和影响评估（方案 C）

### 需要修改的文件

| 文件 | 改动 | 影响 |
|------|------|------|
| `components/layout/TopBar.tsx` | 加 `React.memo` | 减少 loading 变化时的重渲染 |
| `components/features/Chat/ChatList.tsx` | 加 `React.memo` + 稳定回调 | 减少非 chat 相关 state 变化时的重渲染 |
| `App.tsx` | 回调函数用 `useCallback` 包装 | 避免子组件因回调引用变化而重渲染 |

### 不需要修改的文件

| 文件 | 原因 |
|------|------|
| `hooks/useGameState.ts` | 51 个 useState 是合理的独立状态 |
| `hooks/useGame.ts` | 接口层不需要改 |
| hooks/ 下所有文件 | 业务逻辑不受影响 |
| 其他组件 | React 19 Compiler 自动优化 |

### 风险评估
- **完整性**：不影响任何业务逻辑，只优化渲染性能
- **通用**：React.memo 是标准 React 模式
- **明确**：改动仅限 UI 层，不涉及数据流
- **无副作用**：纯加法，不改现有行为
