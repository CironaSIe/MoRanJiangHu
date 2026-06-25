# Tavern Preset Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve core Tavern preset extensions and safely adapt common option-rendering scripts into in-game action options.

**Architecture:** Keep prompt ordering unchanged. Extend preset normalization to preserve extension metadata and compatibility diagnostics, then extend story parsing to recognize aliased option tags and Izumi-style option payloads.

**Tech Stack:** TypeScript, React, Vitest, Vite.

---

### Task 1: Preserve Tavern Extensions

**Files:**
- Modify: `models/system.ts`
- Modify: `utils/tavernPreset.ts`
- Test: `__tests__/tavernPresetCompat.test.ts`

- [ ] Write a failing test that normalizes the Izumi preset and expects `extensions.regex_scripts` plus compatibility diagnostics to remain available.
- [ ] Run `npm.cmd run test:run -- __tests__/tavernPresetCompat.test.ts` and confirm the test fails because extensions are missing.
- [ ] Extend the preset model with optional `extensions` and `兼容性` fields.
- [ ] Update `规范化酒馆预设` to deep-clone safe JSON-like extension data and summarize regex script compatibility.
- [ ] Re-run the test and confirm it passes.

### Task 2: Parse Izumi-Style Options

**Files:**
- Modify: `services/ai/storyResponseParser.ts`
- Test: `__tests__/storyResponseParser.test.ts`

- [ ] Add a failing test where `<options>>选项一：...>选项二：...>选项三：...>选项四：...</options>` produces four `action_options`.
- [ ] Run `npm.cmd run test:run -- __tests__/storyResponseParser.test.ts -t options` and confirm the new case fails.
- [ ] Teach tag extraction to recognize canonical tag aliases and teach action option parsing to split Izumi-style `>选项X：` payloads.
- [ ] Re-run the targeted parser test and confirm it passes.

### Task 3: Surface Compatibility Diagnostics

**Files:**
- Modify: `components/features/Settings/TavernPresetSettings.tsx`
- Test: `npm.cmd run build`

- [ ] Display a compact compatibility note in the Tavern preset settings when regex scripts are preserved or skipped.
- [ ] Keep wording user-facing and avoid exposing raw script contents.
- [ ] Run the build to confirm TypeScript and React compile.

### Task 4: Verify With User Izumi File

**Files:**
- Read-only sample: `D:/下载/Izumi 0503.json`

- [ ] Run a small Node/Vitest-backed check against the user-provided file.
- [ ] Confirm it reports preserved regex scripts and option-rendering scripts.
- [ ] Confirm the parser converts Izumi option text into four action options.
