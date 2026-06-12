# PR 信息

## 分支对比

- **源分支**: `upload/main`（CironaSIe/MoRanJiangHu）@ `503de11`
- **目标分支**: `origin/main`（ypq123456789/MoRanJiangHu）
- **提交数**: 6 个

## 提交列表

| 提交 | 说明 |
|------|------|
| `126792f` | **改进流式超时处理** — 正常解析失败后强制抢救已有草稿（跳过标签完整性检查），避免无效重算 |
| `6205344` | **修复自动修复按钮** — 移除 loading 拦截 + 按钮 loading + disabled 反馈 |
| `2cec606` | **添加连续回档确认弹窗和 NPC 生图失败通知** |
| `6054b44` | **修复 toast 层级、parseRepairBusy 异常兜底、移除松弛抢救** |
| `9e878c4` | **NPC 生图增加装备衣着读取；取消中止信号传播到队列后处理阶段** |
| `503de11` | **新增存档树删除重建功能 + 修复导出函数名** |

## 改动文件统计

- **33 个文件变更**（+321 / -265）
- 新增文件：
  - `services/dbService_saveTree.ts` — 存档树节点收集与树删除重建逻辑
- 删除文件：
  - `public/sounds/turn-notify.mp3` — 移除旧音效资源
- 主要修改范围：
  - `components/features/Chat/InputArea.tsx` — 队列 UI / 中止信号传播
  - `components/features/SaveLoad/SaveLoadModal.tsx` — manual 存档新增"更多操作"菜单，支持删除存档树并重建
  - `services/dbService.ts` — 导出新模块方法
  - `components/features/Social/ImageManagerModal.tsx` — NPC 生图增加装备衣着读取
  - `hooks/useGame/sendWorkflow.ts` — 取消中止信号传播到队列后处理阶段
  - `hooks/useGame/npcContext.ts` / `responseCommandProcessor.ts` — NPC 上下文优化
  - `utils/turnNotificationSound.ts` — 音效通知优化
  - `release.config.json` / `data/releaseInfo.ts` / `public/release-info.json` — 版本号同步

## 修复的问题

1. **流式超时处理改进** — 正常解析失败后不再无效重算，直接抢救已有的草稿，跳过标签完整性检查
2. **自动修复按钮状态修复** — 移除 loading 拦截，添加按钮 loading 和 disabled 反馈
3. **连续回档确认** — 添加回档二次确认弹窗，防止误操作
4. **NPC 生图增强** — 读取装备衣着信息作为生图参考
5. **中止信号隔离** — 取消中止信号传播到队列后处理阶段，避免副作用
6. **toast 层级修复** — 修复 toast 显示的层级问题
7. **存档树删除重建** — 新增删除整个存档树（所有分支和历史版本）并重新保存为全量存档的能力
8. **导出函数名修正** — `dbService_saveTree.ts` 中 `保存游戏` → `保存存档`（与实际函数名匹配）
9. **音效资源清理** — 移除旧的 turn-notify.mp3，避免空文件
