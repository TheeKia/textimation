# Repository guidance

These instructions apply to the entire repository and to any coding agent.

## Quality bar

- Ship maintainable, production-quality code. Favor small, cohesive functions,
  clear names, explicit ownership, and minimal public APIs. Fix causes rather
  than hiding symptoms; avoid speculative abstractions and unrelated rewrites.
- Use modern TypeScript, ESM, React function components/hooks, Svelte 5 runes and attachments,
  and native platform APIs where they improve clarity or performance. Stay
  within declared runtime and peer ranges: React 18 and 19 must both work,
  so do not introduce React 19-only APIs without an intentional compatibility
  change. Do not add dependencies or upgrade them solely for novelty.
- Preserve strict typing and `noUncheckedIndexedAccess`. Prefer inference,
  narrowing, `satisfies`, and type-only imports over `any` or unchecked casts.
  React's `isolatedDeclarations` requires explicit exported function return
  types. Non-null assertions need an actual invariant, such as a bounded loop
  over arrays created with matching lengths.
- Treat accessibility, effect cleanup, StrictMode, SSR/hydration, Unicode,
  interrupted animations, and frame costs as correctness concerns. Keep DOM
  writes out of render and keep per-frame character updates outside React state.
- Add focused regression coverage for behavior changes. Do not add tests that
  merely repeat the implementation. Run relevant checks and report what was
  actually verified, including any gaps in browser coverage.
- Keep consumer docs aligned with the implementation. Update both the root
  README and `packages/react/README.md` when the React API or behavior changes;
  the latter ships with the npm package. Document limitations honestly.

## Workspace and tooling

This is a Bun workspace with one published package, `textimation` in
`packages/react`. `packages/svelte` is a private Svelte 5.29+ implementation
named `@textimation/svelte`. `packages/core` holds shared pure animation helpers
and tests; both framework builds bundle it as a development dependency.
The root and both `apps/*` playgrounds are private.

Use Bun for dependency management and running repository scripts. CI pins
Bun 1.4.0 and Node 24; Node is also required by tooling and the React package
smoke check. The root manifest declares supported runtime ranges. Install
once at the root, keep the shared `bun.lock` current, and keep dependencies in
the workspace that owns them.

| Command | Purpose |
| --- | --- |
| `bun install` | Install all workspaces; CI uses `--frozen-lockfile`. |
| `bun run dev` / `bun run dev:react` | React playground, port 3041 (`PORT` overrides it). |
| `bun run dev:svelte` | Svelte playground, port 3042 with strict port selection. |
| `bun run lint` / `bun run lint:fix` | Biome checks/autofixes plus Prettier for `.svelte`. |
| `bun run type-check` | All packages, shared tests, playgrounds, and browser fixtures; Svelte warnings fail. |
| `bun test` | Shared helper tests using `bun:test`. |
| `bun run test:browser` | Chromium lifecycle/timing tests for both packages and Svelte hydration; build first. |
| `bun run test:watch` / `bun run test:coverage` | Watch tests or collect coverage. |
| `bun run build` | Both libraries into their own `dist/` directories. |
| `bun run build:playgrounds` | Production builds of both playgrounds. |
| `bun run check:packages` | Publint, React export/SSR/CSS checks, and Svelte compilation/CSS/bundled-core checks; build first. |
| `bun run check` | Lint, types, unit tests, library and playground builds, package validation, then browser tests. |

Install the browser once with `bunx playwright install chromium`. CI uses
`--with-deps` to install system dependencies too.

Run a focused test with `bun test packages/core/test/animation.test.ts` or
`bun test -t 'masks every visible character'`.

Biome formats JS/TS/JSON/CSS with single quotes, no unnecessary semicolons, and
two-space indentation. Prettier handles `.svelte`. Shared compiler settings
live in `tsconfig.base.json` (ES2023 target, bundler resolution, strict mode).
Use Conventional Commits; see `CONTRIBUTING.md`.

## Package boundaries

- React's public surface is `packages/react/src/index.ts`: `Textimation`,
  `TextimationProps`, and `AnimationType`. Keep internal imports relative.
- `components/textimation.tsx` owns React lifecycle and DOM updates;
  `packages/core/src/animation.ts` contains pure animation/timing helpers and
  `random.ts` contains the glyph pool. Tests live in `packages/core/test`.
- `src/styles.css` builds to a standalone `dist/styles.css`. Consumers opt in
  with `import 'textimation/styles.css'`; never silently inject it into JS.
- Published React output is ESM with declarations. Keep its default
  side-effect behavior: the previous guidance records an undefined-export
  regression when marking source side-effect-free with Bun 1.4.0. Revalidate
  public exports before revisiting it; the smoke check catches broken exports.
- Playgrounds resolve workspace package names to source for live edits;
  published exports resolve to `dist/`. React uses Bun's HTML server and a
  tsconfig alias; Svelte uses Vite and TypeScript aliases.
- Svelte uses `@sveltejs/package`, declarations, and `types`/`svelte`/`default`
  export conditions. Use `.js` extensions for relative TS module imports and
  `.svelte` for components. No SvelteKit runtime is needed. The build runs
  `svelte-package`, then bunup overwrites `dist/internal/animation` with bundled
  helpers and declarations. Keep the bridge in `src/internal/animation.ts`;
  private core imports must not leak into distributed output. React bundles
  core through bunup as well. Do not duplicate the shared algorithm.

## React animation invariants

React renders for props, observer updates, and the `idle` → `animating` →
`finished` phase state. Character frames mutate the DOM through `textRef`;
they do not trigger React renders.

- The inner span's React child is frozen to mount-time text. Effects own its
  contents after hydration. While idle it has `opacity: 0`, and an effect
  updates its text and display buffer to reserve the current target's layout
  space without retaining stale slots. The scramble
  does not guarantee stable width for proportional fonts or wide glyphs.
- Each animation creates one span per slot and caches those nodes. `paint()`
  changes only differing `textContent`/`className` values. Keep nodes stable
  within a run: resolved-away tail slots become empty spans until completion,
  when the container is replaced with the final plain text.
- `requestAnimationFrame` accumulates elapsed time. Each tick absorbs at most
  250ms; `computeSteps` caps logic work at 10 steps and the remainder at one
  interval. Finite speeds below 1ms use 1ms; non-finite speeds use 50ms.
  Paint at most once per tick and
  skip DOM work when no step is due. The first logic frame runs synchronously;
  cleanup cancels the scheduled frame. Background-tab catch-up is bounded.
- `animationSpeed` is read live on each tick. `type` and `keepCorrectChars` are
  read at animation start. Changing tuning props alone does not replay a
  completed animation or tear down a running one.
- The start gate is `isIntersecting || state === 'animating'`. A settled
  offscreen instance defers new text until intersection; a running instance
  continues when scrolled away and can restart for new text. Re-entering with
  the same completed target does not replay it.
- `committedTextRef` records the running/completed target. Cleanup rolls it
  back to `null` for an unfinished run so StrictMode and interrupted text
  reversions restart correctly. Keep this separate from the display buffer.
- The display buffer tracks what slots actually show, including mid-scramble
  characters and `undefined` for resolved-away tails. Locks compare this
  buffer with the new target, never with a previously completed target.
- Index by code point (`Array.from` and Unicode regexes), not UTF-16 code unit.
  Grapheme clusters such as ZWJ emoji still split; that is a known limitation.
- `getInitialTextArray` masks visible characters with U+00A0, preserves spaces,
  tabs, and newlines, and normalizes other whitespace to spaces.
  `getAnimationCount` covers the longer of target and display. Counts of `-1`
  lock a slot; `0` or `1` settle on the next `advanceFrame`; larger counts
  decrement and scramble. `advanceFrame` mutates buffers and returns the
  number still unsettled, eliminating an extra completion scan/frame.
- Keep the visual span `aria-hidden` and the current target in a separate
  visually hidden span. Check reduced motion at animation start and finish
  immediately when requested. This still waits for the start gate.
- Custom `Comp` wrappers must forward the observer ref, children, style, and
  className to a DOM element that can contain spans. Keep the wrapper type
  stable during a run; use a new React `key` when intentionally remounting.

## Svelte lifecycle

`Textimation.svelte` uses `$props` and a DOM attachment (requires Svelte 5.29+).
The visual span's template child is frozen for hydration; the attachment owns
subsequent DOM updates. A nested `$effect` tracks only text and visibility;
`untrack` keeps tuning props from restarting the animation. Speed is read each
frame; strategy and locking are sampled at animation start. Attachment cleanup
cancels frames and disconnects the observer, including on wrapper replacement.

Use native `class` or the `className` alias. `Comp` accepts only the documented
HTML tags, not component constructors. Missing IntersectionObserver snaps to
final text. The Svelte playground changes tuning props on the live instance;
only replay and wrapper replacement remount the animation. The package-level
`dev` script also starts this source playground; do not use a bare
`svelte-package --watch` to overwrite the bundled helper bridge in `dist/`.

## Verification

The unit suite covers shared pure helpers. Package smoke checks verify React
exports/static SSR/CSS and Svelte client/server compilation/CSS/private-import
isolation. Playwright tests in `tests/browser` exercise built output from both
frameworks with native intersection and deterministic animation frames,
including Svelte SSR hydration and React idle-buffer/cleanup regressions. Keep browser test filenames as `*.e2e.ts` so Bun does not load
them as unit tests. Use the playgrounds to verify visual behavior beyond
these focused lifecycle and timing tests.

For component changes, run the React playground in a browser and check initial
intersection, rapid text changes/reversion, shorter and empty targets, both
animation types, keeping correct characters, whitespace/emoji, reduced motion,
and unmount cleanup under StrictMode. Add focused automated lifecycle coverage
when changing these behaviors. The playground deliberately remounts its main
preview when speed, type, keep-correct, or wrapper controls change, so those
controls alone do not verify live prop changes on a mounted instance.

Run `bun run check` before handing off code changes. CI checks Linux, macOS,
and Windows. Keep changes scoped and distinguish automated checks from manual
browser verification in the handoff.

## Releases

`bun run release` invokes bumpp using `bump.config.ts`: it bumps only the React
manifest, refreshes the lockfile, commits all changes, tags `v<version>`, and
pushes. Run it only for an explicitly requested release with a clean tree.
Do not bump workspace versions recursively.

The `v*` release workflow validates both frameworks and publishes only
`packages/react` with `bun publish`. Keep core private and bundled. Keep Svelte
private until its package name/version and separate release workflow are ready.
