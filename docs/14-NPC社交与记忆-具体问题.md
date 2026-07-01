# NPC 社交与记忆系统——具体代码级问题

## 1. models/social.ts — NPC 数据结构

### 问题 1.1：`NPC性别` 类型缺少名器部位约束
**文件**: `models/social.ts:4`
```typescript
export type NPC性别 = '男' | '女' | '男娘' | '扶她';
```
`'肉棒'` 只对男性/男娘有意义，`'小穴'`/`'屁穴'` 对女性/扶她有意义——但模型层缺少约束来防止给女性 NPC 生成肉棒名器档案。
**后果**: 运行时可能出现性别与名器部位不匹配的数据污染。

### 问题 1.2：`当前位置`/`当前地点` 双字段冗余
**文件**: `models/social.ts:181-183`
```typescript
当前位置?: string;  // NPC 当前所在的短地点名
当前地点?: string;  // 兼容别名，优先与当前位置保持一致
位置路径?: string;  // 完整地点链
```
注释说"优先与当前位置保持一致"，但没有代码层面的同步机制。写入时只写其一、读取时只读其一时，两个字段不一致。
**后果**: 地图系统读 `当前位置`、变量生成写 `当前地点` 时，NPC 位置判断出错。

### 问题 1.3：缺少 `死亡时间`/`死亡描述`/`状态` 字段
**文件**: `models/social.ts:161-287`（整个接口）
`npcDeathGuard.ts` 多处引用 `npc.死亡时间`、`npc.死亡描述`、`npc.状态`/`生死状态`/`生命状态`，但 `NPC结构` 中没有声明这些字段。
**后果**: TypeScript 编译不报错（大量使用 `any`），IDE 自动补全和类型检查失效。

### 问题 1.4：`是否处女`/`失贞档案`/`初夜` 三处重复
**文件**: `models/social.ts:273-277`
三个字段都记录同一事实，`responseCommandProcessor.ts:881-886` 同时更新三处，容易遗漏。

---

## 2. npcRetentionGuard.ts — NPC 删除保护

### 问题 2.1：`合并保留既有NPC列表` 中 insertIndex 计算有缺陷
**文件**: `utils/npcRetentionGuard.ts:117-118`
```typescript
const insertIndex = Math.max(0, Math.min(index, result.length));
result.splice(insertIndex, 0, 深拷贝(npc));
```
`index` 是 `previous` 数组中的原始索引，但 `result` 是 `next` 的深拷贝。当 `previous` 和 `next` 长度不同时，`index` 可能完全不对应该 NPC 在 `result` 中的逻辑位置。
**后果**: 恢复的 NPC 在列表中的位置可能不符合原始顺序。

### 问题 2.2：`深合并保留NPC字段` 数组字段直接替换
**文件**: `utils/npcRetentionGuard.ts:52-72`
```typescript
if (Array.isArray(next)) return 深拷贝(next);  // ← 直接替换，不合并
```
AI 返回的 NPC `记忆` 数组只有最新一条时，之前的所有记忆都会丢失。BUFF/DEBUFF/关系网同理。

### 问题 2.3：`是否占位名` 正则将空值等同于占位
**文件**: `utils/npcRetentionGuard.ts:41-47`
```typescript
if (typeof value !== 'string' || !value.trim()) return true;  // ← 空字符串被当作占位名
```
无法通过命令将字段清空为空字符串（AI 故意清空"曾用名"表示没有曾用名时无法实现）。

### 问题 2.4：`delete gameState.社交[N]` 缺少检测
**文件**: `utils/npcRetentionGuard.ts:164-201`
只检测了 `delete gameState.社交`（删除整个数组），没有检测 `delete gameState.社交[N]`（删除单条）。AI 发出 `delete gameState.社交[3]` 时静默执行，直接清空该 NPC 所有数据。

---

## 3. npcDeathGuard.ts — NPC 死亡保护

### 问题 3.1：越界索引不验证
**文件**: `utils/npcDeathGuard.ts:102-108`
```typescript
byIndex.forEach((state, index) => {
    if (!state.death) return;
    if (state.hpZero && state.hasDeathTime && state.hasDeathDesc) return;  // ← 不验证 index 范围
    state.deathCommandIndices.forEach((commandIndex) => risky.add(commandIndex));
});
```
如果 `index` 超出 `currentSocial.length`，该 NPC 根本不存在，但仍被当作"有完整证据"的死亡处理。

### 问题 3.2：`isDeath` 判断逻辑误判
**文件**: `utils/npcDeathGuard.ts:48`
```typescript
const isDeath = (死亡状态字段正则.test(field) || wholeObject) && 死亡判定词正则.test(valueText);
```
当 `wholeObject` 为 true 时，`valueText` 是整个对象的 JSON 序列化文本。如果 NPC 描述字段包含"他回忆起父亲死亡的场景"，会误判为死亡命令。

### 问题 3.3：`Number(cmd?.value) === 0` 对空字符串不安全
**文件**: `utils/npcDeathGuard.ts:47`
```typescript
const isHpZero = (field === '当前血量' && Number(cmd?.value) === 0) || ...;
```
`Number("")` 返回 `0`，将 `当前血量` 设为空字符串的命令被误判为血量归零。

---

## 4. npcImageStateWorkflow.ts — NPC 生图工作流

### 问题 4.1：`标准化社交列表` 可能改变 NPC 顺序
**文件**: `hooks/useGame/npcImageStateWorkflow.ts:413`
```typescript
const normalizedList = deps.规范化社交列表(result.nextList, { 合并同名: false });
```
规范化步骤可能重新排列 NPC 顺序，导致基于索引的操作匹配到错误的 NPC。代码做了前后对比日志但只记录不修复。

### 问题 4.2：`写入NPC香闺秘档部位记录` 合并逻辑缺陷
**文件**: `hooks/useGame/npcImageStateWorkflow.ts:629-640`
```typescript
const nextRecord = { ...record, id: ..., 部位: part, 构图: '部位特写' as const };
const nextPartResult = 标准化香闺秘档部位结果({
    ...(currentSecretArchive?.[part] || {}),  // ← 旧记录
    ...nextRecord                              // ← 新记录覆盖
}, part);
```
如果旧记录有 `图片URL` 而新记录没有（生图失败），旧 URL 被保留。但如果标准化函数因为"pending 且无图片地址"被丢弃，整个部位档案变为空——即使之前有成功图片。

### 问题 4.3：`删除NPC图片记录` 缺少立绘/背景回退
**文件**: `hooks/useGame/npcImageStateWorkflow.ts:798-807`
```typescript
已选立绘图片ID: currentSelectedPortraitImageId === imageId ? undefined : currentSelectedPortraitImageId,
已选背景图片ID: currentSelectedBackgroundImageId === imageId ? undefined : currentSelectedBackgroundImageId,
```
删除已选立绘/背景图片时直接设为 `undefined`，不回退到历史中合适的图片。

### 问题 4.4：`创建NPC生图任务` 缺少并发控制
**文件**: `hooks/useGame/npcImageStateWorkflow.ts:709-746`
没有检查是否已有同类任务在运行、没有并发数限制、没有去重逻辑。多个 NPC 同时触发生图时大量 API 请求并发。

### 问题 4.5：`追加NPC生图任务` 队列无去重
**文件**: `hooks/useGame/npcImageStateWorkflow.ts:748-750`
```typescript
const 追加NPC生图任务 = (task) => {
    deps.设置NPC生图任务队列((prev) => [task, ...(Array.isArray(prev) ? prev : [])].slice(0, 100));
};
```
同一个 NPC 的同一部位可能被重复加入队列，浪费 API 调用。

---

## 5. memoryUtils.ts — 记忆工具

### 问题 5.1：即时记忆溢出时短期摘要丢失
**文件**: `hooks/useGame/memoryUtils.ts:417-422`
```typescript
while (next.即时记忆.length > immediateLimit) {
    const shifted = next.即时记忆.shift();
    if (!shifted) continue;
    const { 短期摘要 } = 拆分即时与短期(shifted);
    if (短期摘要) next.短期记忆.push(短期摘要);  // ← 没有短期摘要时整条丢失
}
```
不含 `<<SHORT_TERM_SYNC>>` 分隔符的即时记忆在溢出时被静默丢弃。

### 问题 5.2：`应用记忆压缩结果` splice 索引可能错位
**文件**: `hooks/useGame/memoryUtils.ts:298`
```typescript
sourceList.splice(safeStartIndex, Math.max(1, safeEndIndex - safeStartIndex + 1));
```
任务中的索引基于旧的记忆列表计算，但执行前列表已变化（新增或删除），索引对不上。

### 问题 5.3：`生成记忆摘要` 不是真正的摘要
**文件**: `hooks/useGame/memoryUtils.ts:310-317`
```typescript
export const 生成记忆摘要 = (batch, source) => {
    const preview = filtered.slice(0, 3).join('；');
    return `${source}汇总(${filtered.length}): ${first} -> ${last}｜要点: ${preview}`.slice(0, 300);
};
```
只是拼接首条、末条和前 3 条内容截断到 300 字符，不是真正的摘要/总结。长期记忆质量低。

### 问题 5.4：`规范化记忆系统` 即时记忆与回忆档案可能不一致
**文件**: `hooks/useGame/memoryUtils.ts:39-68`
如果 `raw` 同时包含 `即时记忆` 和 `回忆档案`，它们可能不一致（即时记忆 50 条但回忆档案 30 条），代码不检测不修复。

### 问题 5.5：`构建即时记忆条目` AI 可能注入分隔符
**文件**: `hooks/useGame/memoryUtils.ts:332-350`
如果 AI 在 `log.text` 中自行插入了 `<<SHORT_TERM_SYNC>>` 分隔符，`拆分即时与短期` 会错误地将日志文本拆分。

---

## 汇总

| 严重度 | 数量 | 关键问题 |
|--------|------|----------|
| 🔴 高 | 2 | delete 单条社交无检测、生图无并发控制 |
| 🟡 中 | 7 | 数组字段替换丢数据、insertIndex 缺陷、死亡误判、部位档案丢失、队列无去重、记忆溢出丢失、splice 错位 |
| 🟢 低 | 8 | 双字段冗余、类型缺失、占位名过宽、越界不验证、空字符串误判、顺序改变、摘要质量差、分隔符注入 |
