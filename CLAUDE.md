# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`textimation` is a single React component published to npm. It animates text with a typewriter/scramble effect: visible characters shuffle through random glyphs before settling on the target string. It animates the first time it scrolls into view, and re-animates whenever the `text` prop changes.

## Commands

Runtime is **Bun** (not Node). All scripts run through Bun.

- `bun run build` — bundle to `dist/` via bunup (ESM only, with `.d.ts`).
- `bun test` — run the unit suite (`bun:test`). Single file: `bun test test/random.test.ts`. By name: `bun test -t 'masks every visible character'`.
- `bun run test:watch` / `bun run test:coverage`
- `bun run lint` / `bun run lint:fix` — Biome check (and autofix).
- `bun run type-check` — `tsc --noEmit`.
- `bun run dev` — start the manual preview app (see below). Defaults to `http://localhost:3041` (override with `PORT`).
- `bun run release` — version bump + commit + tag + push via bumpp.

## Architecture

### The library (`src/`)
- `index.ts` — the only public surface: re-exports `Textimation` and its types.
- `components/textimation.tsx` — the component.
- `lib/animation.ts` — the pure animation logic (no React).
- `lib/random.ts` — the random-glyph pool.
- `styles.css` — emitted as a **standalone** `dist/styles.css`; never injected into the JS bundle. Consumers opt in with `import 'textimation/styles.css'`. The CSS only defines `.textimation-correctChar` / `.textimation-incorrectChar` (overridable).

### How the animation actually works (the key thing to understand)
The component renders **once**. After the first render, the per-frame character updates **bypass React entirely** and mutate the DOM imperatively through `textRef`. React `useState` is used only for a three-phase gate — `idle` → `animating` → `finished` — where `idle` just hides the inner span (`opacity: 0`) to avoid a flash before animation starts. **Do not** rewrite the per-character updates as React state/renders; that is intentional and load-bearing for performance. When an animation starts, `animate()` builds **one `<span>` per character index** and caches them in a `spans` array; every frame `paint()` reconciles those **same nodes in place** (`textContent` + `className`, writing only what changed), scheduling itself with `setTimeout(animationSpeed)`. Node identity is preserved on purpose: it keeps the DOM↔buffer index mapping exact (never remove children mid-loop) and lets the `.textimation-*` opacity transition play as characters settle. Trailing characters that resolve away (shorter new text) render as **empty** spans rather than being removed.

The tuning props (`animationSpeed`, `keepCorrectChars`, `type`) are read through a `liveProps` ref rather than the effect deps, so changing them mid-animation doesn't tear the running loop down (the effect only re-runs on `text`/scroll-in). For accessibility the animating span is `aria-hidden`; a visually-hidden sibling span carries the real `text` so screen readers never read the scramble.

The animation is driven by a **frame-count array** from `lib/animation.ts`, one entry per character index:
- `getAnimationCount(text, oldText, keepCorrectChars, type)` returns how many scramble frames each index has left. Sentinel values: `-1` = locked/leave untouched (used for already-correct chars when `keepCorrectChars` is set), `0` = resolve to the target char this frame, `>0` = keep scrambling. `'incremental'` settles left-to-right by scaling the count by index; `'random'` (default) gives every char a similar duration.
- `getInitialTextArray(text)` masks every visible char with **U+00A0 (non-breaking space)** so the element reserves its final size up front and avoids layout shift; real spaces/tabs/newlines (`PRESERVE_CHARS`) are kept and revealed immediately.
- `updateText(current, counts, target)` advances the display array one frame in place per the sentinels above.

`animate()` decrements each non-`-1` count by one per frame; the moment every count is `<= 0` (all characters settled) it snaps to the final `text`, sets `textContent`, and transitions to `finished` — there is no idle trailing frame. Re-animation triggers from the `useEffect` whenever `text` changes (guarded against re-running for the same text via `previousTextRef`, which is set only at finish). `useIntersectionObserver` (from `usehooks-ts`) gates the first run on scroll-into-view.

### Path alias
`@/*` maps to `src/*` (tsconfig). Imports inside `src/` use `@/lib/...`, `@/types`, etc.

## Testing
Tests cover the **pure functions only** (`lib/animation.ts`, `lib/random.ts`) — the component's imperative DOM behavior is validated manually in the dev preview app, not in `bun:test`. When changing `textimation.tsx`, verify visually with `bun run dev`.

The preview app lives in `test/ui/` as a separate Bun workspace (`textimation-test-ui`). It serves `index.html` via `Bun.serve` with hot reload and imports the component directly from `../../src`, so library edits show up live.

## Conventions
- Biome enforces formatting and lint: **single quotes, no semicolons, 2-space indent**. Run `bun run lint:fix` before committing.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) — see `CONTRIBUTING.md`.
- `tsconfig` is strict with `isolatedDeclarations` and `noUncheckedIndexedAccess`; exported functions need explicit return types, and indexed access is `T | undefined` (hence the `!` assertions in `animation.ts`).
