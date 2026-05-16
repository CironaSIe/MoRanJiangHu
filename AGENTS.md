# MoRanJiangHu Agent Notes

## AGENTS Update Output Rule

- Whenever `AGENTS.md` is updated, also provide the user with a Chinese version or Chinese summary in the same reply.
- Do not only report that the file changed; show the Chinese-readable content as well.
- Keep `AGENTS.zh-CN.md` synchronized with `AGENTS.md`. Whenever either file is updated, update the other file in the same task so the Chinese version stays current.

## Customer Changelog Rule

- After each meaningful update, also provide a short customer-facing changelog in Chinese.
- Keep it suitable for direct forwarding to customers.
- Prefer plain-language benefit statements over internal implementation detail.

## Release Commit Backup Rule

- Whenever publishing a new version, update the release version number first, then sync the release metadata before any build, upload, deploy, or verification step.
- Whenever publishing a new version, sync the release version first, then create a git commit as a backup before ending the task.
- Whenever publishing or updating a release version, push the release backup commit to GitHub before ending the task.
- If the GitHub push fails, clearly report the blocker, the local commit hash, and the exact branch/remote that still needs to be pushed.
- The release backup commit should include meaningful source, config, release metadata, and customer-facing documentation changes for that version.
- Do not include local debug artifacts, temporary browser traces, generated screenshots, test result folders, logs, APK/AAB binaries, or other machine-local files unless the user explicitly asks to archive them.
- If a release cannot be committed, clearly explain the blocker and list the files that still need backup.

## Release Deployment Coverage Rule

- Whenever publishing a new version, verify every public release entrypoint before ending the task.
- Before the final public deploy/upload step for a release, refresh `releasePublishedAt` to the actual current local time, then run `npm run release:sync` again before building, uploading, deploying, or verifying. The displayed release time must represent the real final publish time, not the earlier version-bump or preparation time.
- External release commands such as R2 upload, Wrangler deploy, APK download verification, and HTTPS endpoint checks must always be run with explicit timeouts. If a wrapper command can hang after partial success, split it into smaller upload/deploy/verify steps and confirm each public artifact independently instead of waiting indefinitely.
- Cloudflare/Wrangler CLI commands on this machine should be tried with proxy environment variables cleared first, for example `env HTTP_PROXY="" HTTPS_PROXY="" ALL_PROXY="" npm run worker:deploy` on POSIX shells or the PowerShell equivalent that sets `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` to empty before running the command. This avoids Wrangler upload/deploy commands hanging behind the local proxy.
- Required checks include the website URL in `release.config.json`, the APK download URL, the update manifest URL, and any documented backup domains or guide URLs that are part of the release surface.
- Current domain memory: the primary website domain is `https://msjh.bacon159.pp.ua/`; the backup website domain is `https://msjh.bacon.de5.net/`.
- For the current project, always confirm whether both the primary domain `https://msjh.bacon159.pp.ua/` and the backup domain `https://msjh.bacon.de5.net/` have been deployed with the same release version as the APK/update manifest.
- **CRITICAL**: After deployment, always verify `https://msjh.bacon159.pp.ua/` and `https://msjh.bacon.de5.net/` both show:
  - Correct version number matching the release
  - Accurate release timestamp (`releasePublishedAt`)
  - If version or timestamp is incorrect, the deployment is incomplete
- If a release is uploaded to R2 but the website was not deployed, deploy the Cloudflare Worker/site as part of the same release flow or clearly report why it could not be deployed.
- After deployment, verify the live site and manifest over HTTPS instead of assuming local build output is live.
- After every deployment and release backup push, check GitHub Actions CI for `ypq123456789/MoRanJiangHu` explicitly, not the upstream repository. Confirm the latest `CI` run for the pushed commit succeeds; if it fails, fetch the logs, fix when possible, and report the blocker before ending.

## No Auto-Deploy Rule

- **NEVER deploy without explicit user instruction.**
- Only run `npm run worker:deploy` when the user explicitly says to deploy, publish, or release.
- When fixing bugs or making changes, only build locally (`npm run build`) and test, do not deploy.
- If the user says "修改" (modify/fix), "修复" (fix), or "改" (change), do NOT deploy.
- Only deploy when the user says "发布" (publish), "部署" (deploy), or "上线" (go live).

## Deploy Report Rule

- After every successful deployment, immediately report:
  - Version bump: "将版本号从 X 升级到 Y"
  - Deploy time: "部署时间是当前时间 YYYY-MM-DD HH:MM"
- Every deployment MUST bump the version number and update `releasePublishedAt` to the actual deploy time before building.
- **No hotfix deploys allowed**: every deploy must increment the version number. Never deploy with the same version number as the previous deploy.
- If multiple hotfixes are deployed without a version bump, still report the deploy time and note that the version was not bumped.

## Local File Reference Rules

- Do not use local-file Markdown or URL links.
- Only use pure references inside single backticks, for example `@components/layout/TopBar.tsx:195`.
- Use `/` in paths, including Windows paths.
- Write explanations in normal prose; keep file refs standalone.

## Local UI Debug Path

When the target is UI verification, layout validation, mobile top-bar checks, or APK/web consistency checks, do not block on model or API configuration first. Prefer entering a real in-game view from an existing save.

## UI Loading Background Rule

- Loading, lazy-render, suspense, "卷轴展开中", skeleton, and side-panel placeholder states must not use black or near-black backgrounds.
- Use light paper/parchment surfaces, translucent warm overlays, or the current theme surface instead.
- This rule applies especially to right-side detail panels and any temporary frame shown before real data arrives.
- If a fallback needs contrast, improve borders, shadows, and text color; do not return to a black modal/card background.

### Preferred Path: Import Existing Save Through UI

1. Build web assets with `npm run build`.
2. Start a local preview with `python -m http.server 4173 -d dist`.
3. Open `http://127.0.0.1:4173`.
4. If the repo already contains a reusable save package, prefer `.tmp-release-assets/WuXia_Save_Data.zip`.
5. Enter the save/load flow and import the zip through the UI in `@components/features/SaveLoad/SaveLoadModal.tsx`.
6. Load a manual or auto save and confirm the app reaches `view === 'game'`.

Use this path first because it exercises the same import and load flow the user can actually trigger.

### If The Home Load Entry Is Disabled

The home page may disable the load entry until IndexedDB already has at least one save. In that case, use one of these workarounds:

1. Preferred workaround:
Import a save into IndexedDB first, then reload and use the normal load flow.

2. Temporary browser-only workaround:
In Playwright or browser devtools, temporarily remove the disabled state from the home-page load or resume button, open the save/load modal, then import the save package through the UI.

Do not commit code changes just to bypass this state unless the user explicitly asks for a product change.

### Fallback Path: Direct Save Injection Into IndexedDB

If UI import is blocked or too slow, directly write one save payload into IndexedDB.

Known local database details:

- Database name: `WuxiaGameDB`
- Save store: `saves`
- Settings store: `settings`
- Image store: `image_assets`
- Current IndexedDB version is defined in `@services/dbService.ts`

Recommended flow:

1. Extract one save json from `.tmp-release-assets/WuXia_Save_Data.zip`.
2. If browser automation cannot read local files directly, serve the extracted json on a temporary local port such as `4174`.
3. In page context, open IndexedDB `WuxiaGameDB` and `put(...)` the save object into the `saves` store.
4. Reload the page.
5. Open the load flow and read that save through the app UI.

This is only for local debugging and verification. Do not treat it as a product feature.

### Files Relevant To Save/Load Debugging

- Save/load modal UI: `@components/features/SaveLoad/SaveLoadModal.tsx`
- Save-load workflow: `@hooks/useGame/saveLoad/saveLoadWorkflow.ts`
- Save coordinator: `@hooks/useGame/saveCoordinator.ts`
- Base DB logic: `@services/dbService.ts`
- ZIP import/export logic: `@services/saveArchiveService.ts`
- Game view switch state: `@hooks/useGameState.ts`
- Main game wiring: `@App.tsx`

## Mobile Top-Bar Verification Path

When verifying the mobile top bar or APK/web consistency:

1. Use a mobile viewport such as `390x844`.
2. Reach a real in-game save, not only the landing page or new-game wizard.
3. Verify all six top cards are visible at once:
   - weather
   - environment
   - time
   - location
   - festival
   - journey
4. Click each card and confirm its detail panel appears.
5. Capture a final screenshot for evidence.

For the current implementation, the main UI file is `@components/layout/TopBar.tsx`.

## APK Validation Notes

- Web changes do not enter the Android package until `npm run apk:sync` has been run.
- After sync, build the release package with `cd android; .\\gradlew.bat assembleRelease`.
- Final APK output path: `@android/app/build/outputs/apk/release/app-release.apk`
- Every APK release must be verified with Android SDK `apksigner verify --verbose --print-certs` before upload and again after downloading the public APK. Confirm the package verifies, record the active signature scheme, and compare the certificate SHA-256 fingerprint with the release keystore.
- For this project, the expected release certificate SHA-256 fingerprint is `0c638692591300750ccc17cb828b5223bb9a5ef333095714377a6cd5adcbe48c`.
- If `adb devices` is empty, be explicit that release build and local mobile-web validation passed, but real-device install was not executed on this machine.

## Decision Rule

If the task is "confirm this UI works" and the opening flow depends on external model configuration, do not stop at the config screen. Use the save-import or save-injection path above to reach the real in-game interface and validate there.


## Auction House Item Validation Rule

- Only real game items should enter the auction house.
- **Prefer AI-based item extraction over regex patterns**: The system now supports using AI to intelligently extract and validate auction items from game responses.
- AI extraction (`services/auctionItemExtractor.ts`) can:
  - Identify market semantics (拍卖行/牙行/黑市/寄售/流入市面 etc.)
  - Identify rare item semantics (传说/绝世/极品/稀世/孤本 etc.)
  - Extract real item names and reject descriptive phrases like "一股浓浓的药", "温热的触感", "迅速驱散"
  - Validate quality-type combinations (e.g., 杂物 cannot be 传说/绝世/极品)
  - Estimate reasonable prices based on quality
- The regex-based extraction remains as a fallback when AI extraction is not available or fails.
- To use AI extraction, pass `useAIExtraction: true` and `aiExtractionResult` to `从剧情响应构建拍卖行投放参数列表`.
- If a turn has no valid items to dispatch, do not force-generate auction entries.
- The `allowInitialPlotSeed` parameter can generate 2-3 initial items at game start, but should respect quality-type constraints.


## Map Layout Optimizer Integration

- The map layout optimizer (`utils/mapLayoutOptimizer.ts`) is now fully integrated into the map spatial system (`utils/mapSpatial.ts`).
- For settlement layers (城镇/村庄/etc.) with 4 or more buildings, the optimizer automatically generates:
  - Road grid layout (2-4 horizontal + 2-4 vertical roads based on building count)
  - Buildings distributed along roads in blocks
  - Buildings occupy 65-75% of block space with proper spacing
- Roads generated by the optimizer are added to the map road list with proper IDs and metadata.
- Non-settlement layers or layers with fewer than 4 buildings use the original layout logic.
- The integration maintains backward compatibility with existing saves.
- All unit tests pass (71 tests).


## Item Image Generation Queue Rule

- Item image generation should be limited to one concurrent task at a time to avoid overwhelming the backend.
- The system should check if there are already running item image generation tasks before starting a new one.
- This prevents the issue where all items without icons are submitted for generation simultaneously.


## Image Viewer Close Button Rule

- All image viewer/preview modals must have a prominent close button in the top-right corner of the image.
- Close button should be a red circular button (h-12 w-12) with white border and red shadow.
- Button should have hover effects (scale-110, brighter shadow).
- Image viewer should position images to the right (justify-end pr-8) with max-width of 85vw.
- This applies to: Social modal character images, Equipment modal character portraits, Image manager modal, and any other full-screen image viewers.

## Equipment Portrait Display Rule

- Character portraits in equipment modal must use `object-contain` instead of `object-cover` to ensure the full portrait is visible.
- Do not crop character portraits at the top or bottom.
- The portrait container should maintain aspect ratio and show the complete image.

## Discord MCP Usage Notes

- Discord MCP uses `SaseQ/discord-mcp`.
- The Discord bot token must stay in the local user environment variable `DISCORD_TOKEN`; never write the token into repository files, scripts, commits, logs, or chat responses.
- The default guild/server ID may be stored in `DISCORD_GUILD_ID`.
- Docker startup when Docker is available:
  `docker run -d -i --name discord-mcp --restart unless-stopped -p 8085:8085 -e SPRING_PROFILES_ACTIVE=http -e DISCORD_TOKEN -e DISCORD_GUILD_ID saseq/discord-mcp:latest`
- HTTP Codex MCP registration when Docker/HTTP mode is available:
  `codex mcp add discord-mcp --url http://localhost:8085/mcp`
- Current Windows fallback registration uses the release jar in `%USERPROFILE%/.codex/tools/discord-mcp/discord-mcp-1.0.0.jar` with stdio transport. The registered command reads `DISCORD_TOKEN` and `DISCORD_GUILD_ID` from user environment variables at runtime.
- On this machine, Discord Gateway access needs the local JVM proxy flags for `127.0.0.1:10809`, including `socksProxyHost`, otherwise token verification may pass but the websocket gateway can time out.
- Verify:
  `curl -fsS http://localhost:8085/actuator/health`
  `codex mcp list`
  `codex mcp get discord-mcp`
