# UI 组件与渲染系统机制分析

## 一、整体布局架构

### 1.1 App.tsx — 根容器与视图切换

`App.tsx`（4483 行）是整个应用的根组件，采用 **单一函数组件 + 大量 useState** 的架构模式。视图切换通过 `state.view` 状态驱动：

```
state.view === 'home'   → LandingPage（首页/登陆页）
state.view === 'new_game' → NewGameWizard / MobileNewGameWizard
state.view === 'game'   → 主游戏界面（TopBar + LeftPanel + Chat + RightPanel）
```

**关键实现：**

- 根容器 `div` 使用 `flex flex-col` 纵向排列，`h-screen w-screen` 撑满视口
- 通过 `isMobile` 状态（`window.matchMedia('(max-width: 767px)')`）判断移动端，动态切换桌面/移动组件
- 背景色 `#0e0d0b` 通过 `useEffect` 直接写入 `document.documentElement.style.backgroundColor`
- 字体通过 `<style>` 标签注入（`fontFaceStyleText`），由 `构建字体注入样式文本` 生成

### 1.2 主游戏界面布局（view === 'game'）

采用经典 **三栏布局**：

```
┌──────────────────────────────────────────────────────┐
│ TopBar（顶部信息栏，天气/环境/时间/地点/节日/历程）      │
├──────────┬────────────────────────────┬──────────────┤
│ LeftPanel│ ChatList + InputArea       │ RightPanel   │
│ (左侧栏) │ (中间聊天区)                │ (右侧栏)     │
│ 角色信息 │ 对话流 + 输入框             │ 功能按钮区   │
│ 属性/头像│                            │ 设置/背包…   │
└──────────┴────────────────────────────┴──────────────┘
```

- **LeftPanel**：桌面端 `w-[14.285714%]`（约 1/7 宽度），移动端隐藏（`hidden md:block`）
- **中间聊天区**：`flex-1` 自适应宽度，包含背景图片层 + 渐变遮罩 + ChatList + InputArea
- **RightPanel**：桌面端固定宽度，移动端由 MobileQuickMenu 替代

### 1.3 懒加载策略

所有模态框组件通过 `React.lazy()` + `创建可预加载懒组件` 包装：

```typescript
const CharacterModal = 创建可预加载懒组件('character-modal', () => import('./components/features/Character/CharacterModal'));
```

- 使用 `lazyImportWithReload` 支持版本更新后自动失效缓存
- 通过 `<React.Sense fallback={<懒加载占位 />}>` 包裹，占位 UI 为"卷轴展开中…"（避免黑屏）
- 游戏进入后通过 `requestIdleCallback` 分批预热组件（桌面 18 个，移动 17 个）

---

## 二、主题系统

### 2.1 主题定义

主题定义在 `styles/themes.ts`，共 **8 个主题**：

| 主题 ID | 名称 | 风格 |
|---------|------|------|
| `day` | 白昼清卷 | 浅色阅读（白底黑字） |
| `ink` | 墨色经典 | 黑金国风（默认暗色） |
| `azure` | 青鸾入梦 | 深绿+薄荷 |
| `ember` | 赤金残阳 | 暖橙/琥珀 |
| `jade` | 寒玉山岚 | 冷玉/灰青 |
| `violet` | 紫阙夜华 | 深紫/薰衣草 |
| `moon` | 霜月清辉 | 月蓝/冰白 |
| `crimson` | 绯霞惊鸿 | 樱绯/酒红 |
| `sand` | 朔漠旧卷 | 沙金/羊皮纸 |

每个主题定义 6 个 CSS 变量：

```typescript
'--c-ink-black'      // 背景色
'--c-ink-gray'       // 次级背景
'--c-wuxia-gold'     // 主金色
'--c-wuxia-gold-dark' // 深色金
'--c-wuxia-cyan'     // 青色
'--c-wuxia-red'      // 红色
'--c-paper-white'    // 纸白色（正文）
```

### 2.2 主题应用机制

```typescript
export const 应用主题到根元素 = (theme: ThemePreset, root?: HTMLElement) => {
    const target = root || document.documentElement;
    Object.entries(definition.variables).forEach(([key, value]) => {
        target.style.setProperty(key, value);
    });
    target.dataset.theme = definition.id;
    target.style.colorScheme = definition.id === 'day' ? 'light' : 'dark';
};
```

- 直接操作 `document.documentElement` 的 `style` 属性
- 同时设置 `data-theme` 属性和 `colorScheme`
- 组件内通过 Tailwind 语义色（如 `bg-ink-black`, `text-wuxia-gold`）引用这些变量
- 主题持久化到 IndexedDB，启动时恢复

### 2.3 日间模式可读性

`day` 主题下所有语义色变量被替换为高对比度浅色值，确保 Tailwind 类名（`bg-ink-black`, `text-wuxia-gold` 等）自动适配。

---

## 三、移动端适配

### 3.1 移动/桌面分界

- 断点：`767px`（`window.matchMedia('(max-width: 767px)')`）
- 通过 `isMobile` 状态在运行时切换组件
- 每个功能模块都有桌面版和移动版（如 `SettingsModal` / `MobileSettingsModal`）

### 3.2 MobileSettingsModal

**文件**: `components/features/Settings/mobile/MobileSettingsModal.tsx`（307 行）

- **仅移动端可见**：`md:hidden` 控制只在小屏显示
- **全屏布局**：`fixed inset-0`，`w-full h-full`
- **Tab 导航**：横向滚动胶囊按钮（`overflow-x-auto no-scrollbar`），29 个设置分类
- **内容区**：`overflow-y-auto` + `React.Suspense` 懒加载各设置子面板
- **关闭按钮**：右上角圆形 X 按钮

### 3.3 MobileMapModal

**文件**: `components/features/Map/MobileMapModal.tsx`（54 行）

- `fixed inset-0 z-[220]` 全屏覆盖
- `md:hidden` 仅移动端
- 紧凑 header（`h-12`），`100dvh` 高度适配
- 底部安全区 padding

### 3.4 MobileQuickMenu

**文件**: `components/layout/MobileQuickMenu.tsx`（372 行）

- 底部快捷菜单栏，图标 + 文字纵向排列
- 支持 `more` 折叠展开
- 每个菜单项有 `active` 高亮状态
- 点击触发 `onMenuClick(menuId)`，由 App.tsx 的 `handleMobileMenuAction` 分发

### 3.5 TopBar 移动端适配

- 桌面端：6 个信息卡片横向排列，hover 展开 DetailCard
- 移动端：折叠为左侧浮动按钮组，点击展开详情面板
- 顶部日期/时间居中显示为竖排紧凑布局
- 全屏详情弹窗（`fullscreenDetailType`）仅桌面端可用

---

## 四、模态框系统

### 4.1 通用模式

所有模态框遵循统一模式：

```typescript
<div className="fixed inset-0 z-[N] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-ink-black/95 border border-wuxia-gold/30 rounded-xl shadow-2xl p-5">
        {/* header: 标题 + 关闭按钮 */}
        {/* content */}
    </div>
</div>
```

**层级规范（z-index）**：
- 模态框遮罩：`z-[220]` ~ `z-[300]`
- 图片查看器：`z-[300]`
- 通知 toast：`z-[10000]`
- 加载占位：`z-[260]`
- 错误边界：`z-[280]`
- 更新进度：`z-[295]`
- 更新日志：`z-[410]`

### 4.2 ModalErrorBoundary

```typescript
class ModalErrorBoundary extends React.Component { ... }
```

- 捕获子组件渲染异常
- 显示错误信息 + 关闭按钮
- 检测 `isDynamicImportFetchError`，提示用户刷新页面
- 用于包裹桌面端右侧详情面板和设置模态框

### 4.3 InAppConfirmModal

**文件**: `components/ui/InAppConfirmModal.tsx`（50 行）

- Promise 化确认弹窗：`requestConfirm(options) => Promise<boolean>`
- 支持 `danger` 模式（红色确认按钮）
- `open` 属性控制显无，`if (!open) return null` 短路渲染
- 通过 `confirmResolverRef` 桥接 Promise 与回调

### 4.4 ReleaseNotesModal

**文件**: `components/ui/ReleaseNotesModal.tsx`（247 行）

- 双栏布局：左侧最新版本 + 右侧历史版本
- 支持"今日不再弹出"（localStorage 存储日期键）
- 集成 APK 下载 / GitHub 跳转
- 使用 `releaseInfo` 渲染版本号和发布时间

---

## 五、通知系统

### 5.1 Toast 通知（右下角）

**状态管理**: `hooks/useGame.ts` 中的 `右下角提示列表`

```typescript
type 右下角提示结构 = {
    id: string;
    title: string;
    message: string;
    tone?: 'info' | 'success' | 'error';
    previewUrl?: string;  // 可选预览图
};
```

**推送机制**:
- `推送右下角提示(toast)` — 添加 toast，最多保留 4 个（`.slice(-4)`）
- 自动关闭：`setTimeout(4200ms)` 后自动移除
- `关闭右下角提示(toastId)` — 手动关闭

**渲染位置**: `App.tsx:3418-3458`

```typescript
<div className="fixed right-4 bottom-16 md:bottom-14 z-[10000] flex flex-col gap-2 pointer-events-none">
    {meta.notifications.map((toast) => (
        <div className={`pointer-events-auto w-[280px] rounded-xl border px-4 py-3 backdrop-blur-md
            ${toast.tone === 'success' ? 'border-emerald-600/50 bg-emerald-950/85 text-emerald-100'
              : toast.tone === 'error' ? 'border-red-600/50 bg-red-950/85 text-red-100'
              : 'border-sky-600/50 bg-sky-950/85 text-sky-100'}`}>
            {/* 可选预览图 + 标题 + 消息 + 关闭按钮 */}
        </div>
    ))}
</div>
```

### 5.2 顶部固定通知条

用于系统级提示（如迁移进度），位于 `fixed left-1/2 top-4 z-[10020]`：

- `旧图迁移提示条` — 本地图片图床迁移进度
- `旧存档谱系迁移提示条` — 旧存档格式转换进度

### 5.3 使用场景

通知系统广泛用于操作反馈：
- 物品兑换成功/失败
- 寄售成交/失败
- 存档保存/读取结果
- 运行报错（90 秒冷却去重）
- 小说分解异常

---

## 六、图片查看器

### 6.1 实现方式

图片查看器**不是独立组件**，而是各模态框内部的状态驱动 UI：

```typescript
const [imageViewer, setImageViewer] = useState<{ src: string; alt: string } | null>(null);
const [imageViewerZoom, setImageViewerZoom] = useState(1);
```

使用 `createPortal` 挂载到 `document.body`：

```typescript
{imageViewer && createPortal(
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-end p-4 pr-8 animate-fadeIn">
        ...
    </div>,
    document.body
)}
```

### 6.2 关闭按钮设计

关闭按钮固定在右上角，遵循 AGENTS.md 中的设计规则：

```typescript
<button className="fixed right-5 top-5 z-[330] flex h-12 w-12 items-center justify-center rounded-full
    border-2 border-white bg-red-600/95 text-white
    shadow-[0_0_24px_rgba(220,38,38,1)] backdrop-blur-md
    transition-all hover:scale-110 hover:bg-red-500 hover:shadow-[0_0_32px_rgba(220,38,38,1)]">
    <svg strokeWidth={2.5} className="w-7 h-7">...</svg>
</button>
```

**关键特征**：
- 红色圆形按钮（`h-12 w-12`），白色边框
- 红色发光阴影（`shadow-[0_0_24px_rgba(220,38,38,1)]`）
- hover 放大 + 更亮阴影
- 图片靠右对齐（`justify-end pr-8`），最大宽度 `85vw`
- 点击遮罩背景也可关闭（`onClick={关闭图片查看器}`）
- 支持缩放控制（+/- 按钮 + 百分比重置）

### 6.3 使用场景

- SocialModal — NPC 头像/立绘预览
- ImageManagerModal — 图片管理
- EquipmentModal — 装备/角色立绘
- InventoryModal — 物品图片

---

## 七、存档/读档 UI

### 7.1 SaveLoadModal 概览

**文件**: `components/features/SaveLoad/SaveLoadModal.tsx`（1219 行）

- 全屏模态框 `fixed inset-0 bg-black/90 backdrop-blur-sm z-[300]`
- 两种模式：`mode: 'save' | 'load'`
- 桌面端最大宽度 `1280px`，移动端全屏

### 7.2 存档列表架构

存档以**时间树**形式组织：

```
系列A（角色名）
├── 起点存档
│   ├── 子节点1
│   │   └── 子节点1.1
│   └── 子节点2
系列B（角色名）
└── ...
```

- 通过 `存档系列ID` / `存档根节点哈希` 分组
- 父子关系由 `存档父节点哈希` 链接
- 支持手动快照和自动快照混合显示

### 7.3 导入流程

1. 点击"导入存档"按钮 → 触发隐藏 `<input type="file">` 的 click
2. 选择 `.zip` 或 `.json` 文件
3. 确认弹窗（`requestConfirm`）
4. ZIP 文件 → `解析ZIP存档文件(file)` 解析
5. JSON 文件 → `parseJsonWithRepair(fileText)` 带自动修复解析
6. `dbService.导入存档数据(payload, { 覆盖现有: false })` 写入 IndexedDB
7. 显示导入结果（新增 N 条，跳过 M 条）
8. 刷新存档列表

### 7.4 导出流程

1. **导出全部**：`导出ZIP存档文件()` → 生成 Blob → `downloadArchiveBlob(blob, fileName)`
2. **导出单个**：先 `读取完整存档(save)` → `导出ZIP存档文件({ saves: [fullSave] })`
3. 下载方式：
   - 原生环境（Capacitor）：`Filesystem.writeFile` 写入设备文档目录
   - Web 环境：创建 `<a>` 标签 + `ObjectURL` 触发下载
4. ObjectURL 通过 `创建并记录ObjectURL` / `延迟释放并记录ObjectURL` 管理生命周期（30 秒后释放）

### 7.5 云端转换

- `handleConvertLocalToCloudPlay` — 上传本地存档到云端（TG 图床或对象存储），然后切换为云端游玩模式
- 转换后自动关闭模态框并加载存档

### 7.6 存档保护

- `saveProtectionEnabled` 状态控制是否允许删除
- 保护开启时：删除按钮隐藏，显示提示条
- 批量删除整棵时间树时有二次确认警告（防止删除中间节点导致后续节点不可用）

### 7.7 摘要懒加载

- 列表初始化只加载摘要（轻量）
- 可见范围内缺少摘要的旧存档通过 `补全存档摘要(id)` 逐个补全
- 移动端分页加载（pageSize=24），Web 端一次加载 80 条
- 补全间隔：移动端 700ms/个，Web 端 120ms/个（避免阻塞 UI）

---

## 八、关键设计模式总结

| 模式 | 实现 | 用途 |
|------|------|------|
| 视图切换 | `state.view` 条件渲染 | home / new_game / game |
| 移动适配 | `isMobile` + 组件对（X / MobileX） | 响应式 |
| 懒加载 | `React.lazy()` + `React.Suspense` | 减少首屏体积 |
| 错误边界 | `ModalErrorBoundary` (Class Component) | 隔离模态框崩溃 |
| 确认弹窗 | Promise 桥接（`requestConfirm`） | 异步用户确认 |
| Toast 通知 | `pushNotification` + 状态数组 | 操作反馈 |
| 主题系统 | CSS 变量 + `data-theme` | 多主题切换 |
| 图片预览 | `createPortal` + 局部状态 | 全屏图片查看 |
| 字体注入 | `<style>` 标签动态生成 | 自定义字体 |
| ObjectURL 生命周期 | `创建并记录ObjectURL` + 延迟释放 | 防止内存泄漏 |
