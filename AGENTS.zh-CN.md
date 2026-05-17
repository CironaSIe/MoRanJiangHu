# MoRanJiangHu 代理协作说明（中文版）

## AGENTS 更新输出规则

- 每次更新 `AGENTS.md` 时，都要在同一回复里给用户提供中文版本或中文摘要。
- 不能只说文件改了；必须展示中文可读内容。
- `AGENTS.zh-CN.md` 必须和 `AGENTS.md` 同步维护。以后更新其中任意一个文件，都要在同一次任务里同步更新另一个文件，保证中文版不过期。

## 客户更新日志规则

- 每次有实质性更新后，都要提供一段简短的中文客户更新说明。
- 内容应适合直接转发给客户。
- 优先说明客户能感知到的收益，少写内部实现细节。

## 管理端/内部更新日志规则

- 管理端、监控页、内部运维、后台管理控制台相关变更，默认不要写入面向客户的 release notes 或公开更新日志，除非用户明确要求。
- 公开更新日志应聚焦玩家可感知的玩法、应用行为、APK、同步或客户支持变化。
- 管理端相关修复可以随版本提交和部署，但只在最终工程总结里私下说明，不写进客户可转发更新说明。

## 发布提交备份规则

- 每次发布新版本时，必须先更新版本号，再同步 release 元数据，然后才能构建、上传、部署或验证。
- 每次发布新版本时，必须先同步 release 版本，再创建一个 git commit 作为发布备份。
- 每次发布或更新 release 版本时，结束任务前必须把发布备份 commit 推送到 GitHub。
- 如果 GitHub push 失败，必须明确说明阻塞原因、本地 commit hash，以及仍需推送的分支和 remote。
- 发布备份 commit 应包含本次版本相关的源码、配置、release 元数据和客户可见文档变更。
- 不要把本地调试产物、临时浏览器 trace、生成截图、测试结果目录、日志、APK/AAB 二进制等机器本地文件放进发布备份，除非用户明确要求归档。
- 如果无法提交 release，必须说明阻塞原因，并列出仍需备份的文件。

## 发布部署覆盖规则

- 每次发布新版本，结束任务前必须验证所有公开发布入口。
- 在最终公开部署或上传前，必须把 `releasePublishedAt` 刷新为当前真实本地时间，然后重新运行 `npm run release:sync`，再构建、上传、部署或验证。展示的发布时间必须代表真正最终发布时刻，不能使用前面版本准备时的时间。
- R2 上传、Wrangler 部署、APK 下载验证、HTTPS 端点检查等外部命令必须带明确超时。如果包装命令可能在部分成功后卡住，要拆成上传、部署、验证等更小步骤，并逐一确认公开产物。
- 本机执行 Cloudflare/Wrangler 命令时，优先清空代理环境变量后再试。例如 POSIX shell 使用 `env HTTP_PROXY="" HTTPS_PROXY="" ALL_PROXY="" npm run worker:deploy`，PowerShell 使用等价方式把 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 设为空后再执行。这样可以避免 Wrangler 上传或部署命令被本地代理卡住。
- 必须检查 `release.config.json` 中的网站 URL、APK 下载 URL、更新 manifest URL，以及所有文档中列出的备份域名或指南 URL。
- 当前域名记忆：主站是 `https://msjh.bacon159.pp.ua/`；备站是 `https://msjh.bacon.de5.net/`。
- 对当前项目，每次都要确认主站 `https://msjh.bacon159.pp.ua/` 和备站 `https://msjh.bacon.de5.net/` 是否部署了与 APK/update manifest 相同的版本。
- 关键要求：部署后必须验证主站和备站都显示：
  - 与 release 匹配的正确版本号。
  - 准确的发布时间 `releasePublishedAt`。
  - 如果版本号或时间戳不正确，说明部署未完成。
- 如果 release 已上传到 R2 但网站没有部署，必须在同一发布流程里部署 Cloudflare Worker/site，或清楚说明不能部署的原因。
- 部署后必须通过 HTTPS 验证线上站点和 manifest，不能只看本地构建输出。
- 每次部署并推送 release backup 后，都要显式检查 `ypq123456789/MoRanJiangHu` 的 GitHub Actions CI，而不是 upstream 仓库。确认最新推送 commit 的 `CI` run 成功；如果失败，要拉取日志，能修则修，不能修要在结束前报告阻塞。

## 禁止自动部署规则

- 没有用户明确指令时，绝不部署。
- 只有用户明确说“部署”“发布”“上线”等含义时，才可以运行 `npm run worker:deploy`。
- 修 bug 或改代码时，只做本地构建（`npm run build`）和测试，不部署。
- 如果用户只说“修改”“修复”“改”，不要部署。
- 只有用户说“发布”“部署”“上线”时才部署。

## 部署报告规则

- 每次成功部署后，必须立刻报告：
  - 版本升级：“将版本号从 X 升级到 Y”。
  - 部署时间：“部署时间是当前时间 YYYY-MM-DD HH:MM”。
- 每次部署都必须升级版本号，并在构建前把 `releasePublishedAt` 更新为真实部署时间。
- 禁止无版本号升级的热修部署：每次部署都必须递增版本号，不能用同一个版本号反复部署。
- 如果已经发生多次未升级版本号的热修部署，也要报告部署时间，并说明版本号没有升级。

## 纯文档部署规则

- 如果本次唯一有意义的变更是文档或静态指南内容，并且用户明确要求“不更新版本号也部署”，不要提升 `versionName`、`versionCode` 或 `releasePublishedAt`。
- 这个例外只适用于纯文档变更，例如 `public/cnb-comfyui-guide.html`、更新日志文案、README/AGENTS 更新，或其它不改变应用行为、APK 内容、更新清单、运行时代码的客户指南文字。
- 纯文档部署仍然要先本地构建，再清空代理变量部署网站/Worker，并通过 HTTPS 验证公开指南页已经更新；最终报告里要说明版本号因为纯文档部署而有意保持不变。
- 以后用户明确要求部署纯文档改动时，默认按这条规则执行。

## 本地文件引用规则

- 不要使用本地文件 Markdown 链接或 URL 链接。
- 只使用反引号包裹的纯文本引用，例如 `@components/layout/TopBar.tsx:195`。
- 路径统一使用 `/`，包括 Windows 路径。
- 正常 prose 解释即可；文件引用单独写成 `@...` 形式。

## 本地 UI 调试路径

当目标是 UI 验证、布局校验、移动端顶栏检查、APK/Web 一致性检查时，不要先卡在模型或 API 配置上。优先从已有存档进入真实游戏界面。

## UI 加载背景规则

- Loading、lazy-render、suspense、“卷轴展开中”、骨架屏、侧边详情占位状态都不能使用黑色或近黑背景。
- 使用浅色纸张/羊皮纸质感、暖色半透明遮罩，或当前主题的 surface。
- 这条尤其适用于右侧详情面板，以及真实数据加载前的临时框架。
- 如果 fallback 需要对比度，优先改善边框、阴影和文字颜色；不要回到黑色弹窗或黑色卡片背景。

### 首选路径：通过 UI 导入现有存档

1. 使用 `npm run build` 构建 Web 资源。
2. 用 `python -m http.server 4173 -d dist` 启动本地预览。
3. 打开 `http://127.0.0.1:4173`。
4. 如果仓库里已有可复用存档包，优先使用 `.tmp-release-assets/WuXia_Save_Data.zip`。
5. 进入存读档流程，在 `@components/features/SaveLoad/SaveLoadModal.tsx` 中通过 UI 导入 zip。
6. 加载手动或自动存档，确认应用进入 `view === 'game'`。

优先使用这条路径，因为它覆盖用户真实会触发的导入和读档流程。

### 如果首页读档入口被禁用

首页可能在 IndexedDB 已有至少一个存档前禁用读档入口。此时使用以下 workaround：

1. 首选 workaround：先把存档导入 IndexedDB，然后刷新页面，用正常读档流程进入。
2. 临时浏览器 workaround：在 Playwright 或浏览器 devtools 中临时移除首页读档/继续按钮的 disabled 状态，打开存读档弹窗，再通过 UI 导入存档包。

不要为了绕过这个状态提交产品代码变更，除非用户明确要求改产品行为。

### 兜底路径：直接向 IndexedDB 注入存档

如果 UI 导入被阻塞或太慢，可以直接向 IndexedDB 写入一个存档 payload。

已知本地数据库信息：

- 数据库名：`WuxiaGameDB`
- 存档 store：`saves`
- 设置 store：`settings`
- 图片 store：`image_assets`
- 当前 IndexedDB version 定义在 `@services/dbService.ts`

推荐流程：

1. 从 `.tmp-release-assets/WuXia_Save_Data.zip` 解出一个 save json。
2. 如果浏览器自动化不能直接读本地文件，就用临时本地端口（如 `4174`）托管解出的 json。
3. 在 page context 中打开 IndexedDB `WuxiaGameDB`，把 save object `put(...)` 到 `saves` store。
4. 刷新页面。
5. 打开读档流程，通过应用 UI 读取该存档。

这只用于本地调试和验证，不要当作产品功能。

### 存读档调试相关文件

- 存读档弹窗 UI：`@components/features/SaveLoad/SaveLoadModal.tsx`
- 存读档流程：`@hooks/useGame/saveLoad/saveLoadWorkflow.ts`
- 存档协调器：`@hooks/useGame/saveCoordinator.ts`
- 基础 DB 逻辑：`@services/dbService.ts`
- ZIP 导入/导出逻辑：`@services/saveArchiveService.ts`
- 游戏视图切换状态：`@hooks/useGameState.ts`
- 主游戏接线：`@App.tsx`

## 移动端顶栏验证路径

验证移动端顶栏或 APK/Web 一致性时：

1. 使用移动端视口，例如 `390x844`。
2. 进入真实游戏存档，不要只停留在首页或新游戏向导。
3. 验证六个顶部卡片同时可见：
   - 天气
   - 环境
   - 时间
   - 位置
   - 节日
   - 历程
4. 点击每张卡片，确认详情面板会出现。
5. 最后截图留证。

当前实现的主 UI 文件是 `@components/layout/TopBar.tsx`。

## APK 验证说明

- Web 变更不会进入 Android 包，除非运行 `npm run apk:sync`。
- sync 后，使用 `cd android; .\gradlew.bat assembleRelease` 构建 release 包。
- 最终 APK 输出路径：`@android/app/build/outputs/apk/release/app-release.apk`
- 每次 APK 发布都必须先用 Android SDK `apksigner verify --verbose --print-certs` 验证本地 APK，上传后再下载公开 APK 并再次验签。需要确认包验证通过、记录启用的签名方案，并对比 release keystore 的证书 SHA-256 指纹。
- 本项目预期 release 证书 SHA-256 指纹：`0c638692591300750ccc17cb828b5223bb9a5ef333095714377a6cd5adcbe48c`。
- 如果 `adb devices` 为空，要明确说明 release 构建和本地移动 Web 验证已通过，但本机没有执行真机安装。

## 决策规则

如果任务是“确认这个 UI 可用”，且打开流程依赖外部模型配置，不要停在配置页。使用存档导入或存档注入路径进入真实游戏界面验证。

## 拍卖行物品验证规则

- 只有真实游戏物品可以进入拍卖行。
- 优先使用 AI 物品提取，不要优先写正则规则。系统现在支持用 AI 从游戏回复中智能提取并验证拍卖物品。
- AI 提取（`services/auctionItemExtractor.ts`）可以：
  - 识别市场语义，如拍卖行、牙行、黑市、寄售、流入市面等。
  - 识别稀有物品语义，如传说、绝世、极品、稀世、孤本等。
  - 提取真实物品名，并拒绝“一股浓浓的药”“温热的触感”“迅速驱散”等描述性短语。
  - 校验品质和类型组合，例如杂物不能是传说、绝世、极品。
  - 按品质估算合理价格。
- 当 AI 提取不可用或失败时，正则提取只作为 fallback。
- 使用 AI 提取时，向 `从剧情响应构建拍卖行投放参数列表` 传入 `useAIExtraction: true` 和 `aiExtractionResult`。
- 如果某回合没有有效可投放物品，不要强行生成拍卖条目。
- `allowInitialPlotSeed` 可以在游戏开局生成 2-3 个初始物品，但也要遵守品质/类型约束。

## 地图布局优化器集成

- 地图布局优化器 `utils/mapLayoutOptimizer.ts` 已完整集成到地图空间系统 `utils/mapSpatial.ts`。
- 对建筑数量大于等于 4 的 settlement 层（城镇、村庄等），优化器会自动生成：
  - 道路网布局：根据建筑数量生成 2-4 条横路和 2-4 条竖路。
  - 建筑沿道路分布在街区中。
  - 建筑占街区 65%-75% 空间，并保持合理间距。
- 优化器生成的道路会带正确 ID 和 metadata 加入地图道路列表。
- 非 settlement 层或建筑少于 4 的层继续使用原始布局逻辑。
- 该集成保持旧存档兼容。
- 所有单元测试通过（71 tests）。

## 物品生图队列规则

- 物品生图必须限制为一次只运行一个并发任务，避免压垮后端。
- 系统启动新物品生图前，应检查是否已有物品生图任务正在运行。
- 这样可以避免所有缺图物品同时提交生图的问题。

## 图片查看器关闭按钮规则

- 所有图片查看/预览弹窗都必须在图片右上角有醒目的关闭按钮。
- 关闭按钮应为红色圆形按钮（`h-12 w-12`），带白色边框和红色阴影。
- 按钮应有 hover 效果（`scale-110` 和更亮阴影）。
- 图片查看器应把图片放在右侧（`justify-end pr-8`），最大宽度 `85vw`。
- 适用于：社交弹窗角色图、装备弹窗角色立绘、图片管理弹窗，以及其他全屏图片查看器。

## 装备立绘显示规则

- 装备弹窗中的角色立绘必须使用 `object-contain`，确保完整立绘可见。
- 不要裁切角色立绘顶部或底部。
- 立绘容器应保持比例并显示完整图片。

## Discord MCP 使用说明

- Discord MCP 使用 `SaseQ/discord-mcp`。
- Discord bot token 必须保存在本地用户环境变量 `DISCORD_TOKEN` 中；绝不能写入仓库文件、脚本、commit、日志或聊天回复。
- 默认 guild/server ID 可以保存在 `DISCORD_GUILD_ID`。
- Docker 可用时的启动命令：
  `docker run -d -i --name discord-mcp --restart unless-stopped -p 8085:8085 -e SPRING_PROFILES_ACTIVE=http -e DISCORD_TOKEN -e DISCORD_GUILD_ID saseq/discord-mcp:latest`
- Docker/HTTP 模式可用时的 Codex MCP 注册命令：
  `codex mcp add discord-mcp --url http://localhost:8085/mcp`
- 当前 Windows fallback 注册使用 `%USERPROFILE%/.codex/tools/discord-mcp/discord-mcp-1.0.0.jar` 中的 release jar，走 stdio transport。注册命令在运行时从用户环境变量读取 `DISCORD_TOKEN` 和 `DISCORD_GUILD_ID`。
- 在这台机器上，Discord Gateway 访问需要本地 JVM proxy flags 指向 `127.0.0.1:10809`，包括 `socksProxyHost`，否则 token 验证可能通过但 websocket gateway 超时。
- 验证命令：
  `curl -fsS http://localhost:8085/actuator/health`
  `codex mcp list`
  `codex mcp get discord-mcp`

## 对象存储同步说明

- 用户可能会使用 hi168 的 S3 兼容对象存储做存档同步。
- 对象存储凭据只能保存在本机用户环境变量中；不要把 Access Key 或 Secret Key 写入仓库文件、提交、日志、更新说明或聊天回复。
- 本机环境变量名称：
  - `MORAN_OSS_USERNAME`
  - `MORAN_OSS_ACCESS_KEY`
  - `MORAN_OSS_SECRET_KEY`
  - `MORAN_OSS_ENDPOINT`
  - `MORAN_OSS_BUCKET`
- 当前非敏感默认值：
  - 端点：`https://s3.hi168.com`
  - 存储桶：`hi168-19275-07130td3`
- hi168 使用 S3 兼容 API，调用时使用 path-style 地址：`https://s3.hi168.com/<bucket>/<key>`。
- 应用内对象存储同步应走 `/api/object-storage-proxy` 运行时端点，使用 AWS Signature V4 签名，region 使用 `auto`，service 使用 `s3`，并复用 WebDAV 的清单、分片和增量同步语义。
- 默认存储前缀为 `MoRanJiangHu`；存档包放在 `MoRanJiangHu/saves`，分片放在 `MoRanJiangHu/chunks`，清单文件是 `MoRanJiangHu/manifest.json`。
- 本地端到端测试时，从用户环境变量读取凭据，在 `MoRanJiangHu/e2e/` 下 PUT 一个小对象，GET 回来校验内容，然后 DELETE 该测试对象。

## 2026-05-17 地图重构与同步记忆

- 原作者项目：`ypq123456789/MoRanJiangHu`。
- 用户 fork / GitHub ID：`LingYuYue1`。
- 继续本地修复前，已经先同步过原作者仓库。以后继续地图工作时，不要默认本地就是最新，先检查远程。
- 已推送到用户 fork 的 PR 分支：`codex/map-system-queue-fixes`。
- PR 标题建议/使用：`重构地图更新队列并修复地图 NPC 联动`。
- 后续本地 `main` 已快进同步到原作者最新 `origin/main`，提交位置为 `17ed36d`。

### 六层地图树方向

- 当前地图重构只使用六层地点树：`寰宇 -> 大地点 -> 中地点 -> 小地点 -> 区地点 -> 子地点`。
- 不要重新引入旧坐标地图字段：`世界.地图`、`世界.建筑`、`世界.地图建筑`、`世界.地图道路`、`世界.地图人物`。
- `具体地点` 是环境/当前位置字段，不是地图层级。如果 AI 返回 `具体地点`，应归一到 `区地点`；房间/室内类节点应归一到 `子地点`。
- 地图节点通过 `世界.地图层级` 维护，使用 `DT-xxx` ID。
- 新地图数据应基于名称、层级、父级、描述，不让 AI 生成坐标。

### 地图渲染与 NPC 修复

- 已修复大地点/大洲地图路径点越界问题，路径点会被限制在地图框内。
- 已修复 NPC 与地图地点联动：城镇/建筑层显示粉色 NPC 标记；建筑/房间卡片显示在场 NPC 列表。
- NPC 地点匹配优先使用精确位置路径。
- 相关文件包括：`utils/mapSpatial.ts`、`utils/mapNpcLocation.ts`、`components/features/Map/RegionMap.tsx`、`components/features/Map/GridMapScene.tsx`、`components/features/Map/LocationBrowser.tsx`。

### 地图更新工作流拆分

- 地图更新必须从世界演变中拆分出来。
- 世界演变不应继续负责写入地图更新。
- 自动地图更新作为正文结束后的独立后台队列阶段运行。
- 队列顺序应为：`文章优化 -> 变量生成 -> 动态世界 -> 规划分析 -> 地图更新 -> 最终落盘`。
- 地图更新阶段排在最终应用命令之前的最后一位。
- 用户开启地图自动更新独立 API 时，自动地图更新使用独立 API/模型。
- 未开启独立地图更新 API 时，自动地图更新跟随主剧情 API/模型。
- 手动 `解析地图` 和正文后的自动地图更新保持分离。
- 手动地图解析使用“地图生成”API 配置。
- 自动地图更新使用“地图自动更新”API 选择逻辑。
- 自动模式只解析并应用指向 `世界.地图层级` 的命令。

### 地图更新拆分涉及文件

- `hooks/useGame/mapUpdateWorkflow.ts`：手动地图重生成和自动增量地图更新共用工作流。
- `utils/apiConfig.ts`：新增/使用地图自动更新接口解析。
- `models/system.ts`：新增地图自动更新独立模型字段。
- `components/features/Settings/MapModelSettings.tsx`：新增 `正文后自动地图更新` 设置区。
- `hooks/useGame/sendWorkflow.ts`：在规划分析后、最终落盘前新增独立 `地图更新` 队列阶段。
- `hooks/useGame.ts`：补充地图更新进度类型和透传。
- `components/features/Chat/InputArea.tsx`：新增队列 UI 阶段 `地图更新`，并显示在最后。

### 本次验证记录

- Windows PowerShell 可能因为 `npm.ps1` 执行策略导致 `npm run build` 失败；使用 `npm.cmd run build`。
- 接入地图更新队列后，`npm.cmd run build` 已通过。
- 构建会因为项目执行 `release:sync` 修改 `data/releaseInfo.ts` 和 `public/release-info.json`，如果任务不是发布，不要把这些生成文件混进 PR。
- 已用本地 Vite preview 在桌面端和手机局域网访问测试。手机访问时 preview 需要使用 `--host 0.0.0.0`，然后手机打开电脑局域网 IP。

## 2026-05-17 在线心跳周期性卡顿修复

- 用户反馈 PC 和手机端都会周期性卡顿/冻结，包括切换页面和停留在任意页面时。
- 主要可疑原因定位在 `services/onlinePresence.ts`：在线心跳每 25-30 秒发送一次，并且每次都会调用 `读取本地图片资源统计`。
- `读取本地图片资源统计` 会扫描 IndexedDB 里的存档、设置和图片资源；当存档或图片较多时，会造成周期性主线程卡顿。
- 修复已在分支 `codex/fix-presence-heartbeat-stutter`、提交 `67273b8` 中完成：
  - 在线心跳不再携带完整本地图片资源统计；
  - 仅保留轻量的图片迁移状态 `获取本地图片图床迁移状态`；
  - 心跳 payload 改为同步轻量构建；
  - WebSocket 心跳已连接时跳过备用 HTTP 心跳，避免双路重复心跳。
- PR 分支已推送到用户 fork：`LingYuYue1/MoRanJiangHu`，分支 `codex/fix-presence-heartbeat-stutter`。
- PR 创建链接：`https://github.com/LingYuYue1/MoRanJiangHu/pull/new/codex/fix-presence-heartbeat-stutter`。
- PR 标题建议：`修复在线心跳导致的周期性卡顿`。
- 验证：`npm.cmd run build` 已通过。
- 构建再次触发 `release:sync` 修改 release 元数据；已恢复 `data/releaseInfo.ts` 和 `public/release-info.json`，未混入本次 PR。
- 如果合并后仍有卡顿，下一批优先排查：启动图片缓存预热、旧图迁移、图片兜底预取、页面切换时的存档列表扫描。
