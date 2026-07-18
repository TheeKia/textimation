# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`textimation` is a single React component published to npm. It animates text with a typewriter/scramble effect: visible characters shuffle through random glyphs before settling on the target string. It animates the first time it scrolls into view, and re-animates whenever the `text` prop changes.

## Commands

Runtime is **Bun** (not Node). All scripts run through Bun.

- `bun run build` — bundle to `dist/` via bunup (ESM only, with `.d.ts`).
- `bun test` — run the unit suite (`bun:test`). Single file: `bun test test/random.test.ts`. By name: `bun test -t 'masks every visible character'`.
- `bun run test:watch` / `bun run test:coverage`
- `bun run lint` / `bun run lint:fix` — Biome check (and autofix).
- `bun run type-check` — `tsc --noEmit`. Only covers `src/` (tsconfig `include`); tests and the preview app are not type-checked by it (`test/ui` has its own tsconfig).
- `bun run dev` — start the manual preview app (see below). Defaults to `http://localhost:3041` (override with `PORT`).
- `bun run release` — version bump + commit + tag + push via bumpp. The npm publish itself happens in CI: pushing the `v*` tag triggers `.github/workflows/release.yml`, which re-runs type-check/lint/test/build and then `bun publish`. CI (`ci.yml`) runs build, type-check, lint, and tests on Linux/macOS/Windows for every push and PR.

## Architecture

### The library (`src/`)
- `index.ts` — the only public surface: re-exports `Textimation` and its types.
- `components/textimation.tsx` — the component.
- `lib/animation.ts` — the pure animation logic (no React).
- `lib/random.ts` — the random-glyph pool.
- `styles.css` — emitted as a **standalone** `dist/styles.css`; never injected into the JS bundle. Consumers opt in with `import 'textimation/styles.css'`. The CSS only defines `.textimation-correctChar` / `.textimation-incorrectChar` (overridable).

### How the animation actually works (the key thing to understand)
The component renders **once**. After the first render, the per-frame character updates **bypass React entirely** and mutate the DOM imperatively through `textRef`. React `useState` is used only for a three-phase gate — `idle` → `animating` → `finished` — where `idle` just hides the inner span (`opacity: 0`) to avoid a flash before animation starts. **Do not** rewrite the per-character updates as React state/renders; that is intentional and load-bearing for performance. When an animation starts, the effect builds **one `<span>` per character slot** and caches them in a `spans` array; each logic frame `paint()` reconciles those **same nodes in place** (`textContent` + `className`, writing only what changed). Node identity is preserved on purpose: it keeps the DOM↔buffer index mapping exact (never remove children mid-loop) and lets the `.textimation-*` opacity transition play as characters settle. Trailing characters that resolve away (shorter new text) render as **empty** spans rather than being removed.

**DOM ownership:** the animating span's React child is frozen to the mount-time text (`useRef(text).current`), so React's vDOM for that subtree never changes after hydration and React never writes into the DOM the effect mutates. While still `idle`, a small effect keeps the (invisible) frozen child's `textContent` in sync with `text` imperatively so the layout size reservation stays current.

**Frame scheduling** is `requestAnimationFrame`-driven with a millisecond accumulator (not `setTimeout`): each rAF tick clamps the frame delta to `MAX_FRAME_DELTA_MS` (250ms — bounds catch-up after jank/hidden tabs), reads `animationSpeed` live from `liveProps`, and converts the accumulated time into logic steps via `computeSteps` (capped at `MAX_STEPS_PER_TICK`, remainder clamped to one interval so speed drops can't burst). It paints **at most once per tick** and does zero DOM work on ticks with no step due. The first logic frame runs synchronously at start so there is no blank frame; the loop pauses for free in hidden tabs. Cleanup is `cancelAnimationFrame`.

The tuning props (`animationSpeed`, `keepCorrectChars`, `type`) are read through a `liveProps` ref rather than the effect deps, so changing them mid-animation doesn't tear the running loop down (the effect only re-runs on `text`/scroll-in). For accessibility the animating span is `aria-hidden`; a visually-hidden sibling span carries the real `text` so screen readers never read the scramble. If `prefers-reduced-motion: reduce` is set (checked at each animation start), the scramble is skipped and the component snaps straight to `finished`.

**Unicode:** all indexing is by **code point**, not UTF-16 code unit — the component splits with `Array.from(text)` and passes pre-split arrays into the lib, so surrogate-pair emoji animate as single slots (multi-code-point grapheme clusters like ZWJ sequences still split; known limitation). The mask regexes in `getInitialTextArray` carry the `u` flag for the same reason — without it each surrogate half matches `\S` separately.

The animation is driven by a **frame-count array** from `lib/animation.ts`, one entry per code-point slot:
- `getAnimationCount(targetChars, currentChars, firstRun, keepCorrectChars, type)` takes pre-split code-point arrays and returns how many scramble frames each slot has left. `currentChars` is the **display buffer — what's actually on screen right now** (finished text, NBSP mask on first run, or a mid-scramble mix after an interruption); locks compare against it, never against a past target, so a slot only locks when the visible char is already correct, and slot count always covers every visible span. Sentinel values: `-1` = locked/leave untouched (used for already-correct chars when `keepCorrectChars` is set), `0` = resolve to the target char this frame, `>0` = keep scrambling. `'incremental'` settles left-to-right by scaling the count by index; `'random'` (default) gives every char a similar duration.
- `getInitialTextArray(text)` masks every visible char with **U+00A0 (non-breaking space)** so the element reserves its final size up front and avoids layout shift; real spaces/tabs/newlines (`PRESERVE_CHARS`) are kept and revealed immediately.
- `advanceFrame(display, counts, targetChars)` advances the display buffer one frame in place — a slot that reaches `0` snaps to its target (or `undefined` past a shorter target) and locks to `-1`; higher counts decrement and scramble — and returns the number of still-unsettled slots. `0` means the animation finished **this** frame (no O(n) `every()` scan, no trailing frame): the loop then snaps `textContent` to the final `text` and transitions to `finished`.
- `computeSteps(accumulatedMs, speedMs)` is the pure rAF timing math described above.

Re-animation triggers from the `useEffect` whenever `text` changes, guarded by `committedTextRef` — the target of the animation currently running or finished. It is set at animation **start** and rolled back to `null` by the effect cleanup if that run was torn down before finishing. This rollback is load-bearing: it makes StrictMode's double-effect restart cleanly, and it fixes the freeze where reverting `text` mid-animation to the previously finished value would match a naive "last finished text" guard and never restart, stranding the DOM mid-scramble. `useIntersectionObserver` (from `usehooks-ts`) gates the first run on scroll-into-view. The display buffer is `(string | undefined)[]` — `undefined` marks resolved-away tail slots.

### Path alias
`@/*` maps to `src/*` (tsconfig). Imports inside `src/` use `@/lib/...`, `@/types`, etc.

## Testing
Tests cover the **pure functions only** (`lib/animation.ts`, `lib/random.ts`) — the component's imperative DOM behavior is validated manually in the dev preview app, not in `bun:test`. When changing `textimation.tsx`, verify visually with `bun run dev`.

The preview app lives in `test/ui/` as a separate Bun workspace (`textimation-test-ui`). It serves `index.html` via `Bun.serve` with hot reload and imports the component directly from `../../src`, so library edits show up live.

## Conventions
- Biome enforces formatting and lint: **single quotes, no semicolons, 2-space indent**. Run `bun run lint:fix` before committing.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) — see `CONTRIBUTING.md`.
- `tsconfig` is strict with `isolatedDeclarations` and `noUncheckedIndexedAccess`; exported functions need explicit return types, and indexed access is `T | undefined` (hence the `!` assertions in `animation.ts`).
