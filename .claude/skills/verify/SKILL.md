---
name: verify
description: Verify Textimation component changes end-to-end at the package boundary (no browser needed)
---

# Verifying textimation changes

The component's surface is the npm package boundary. Unit tests only cover the
pure lib functions; to observe the component actually animating, render it
through the built package under happy-dom.

## Recipe

1. `bun run build` — the harness must exercise `dist/`, not `src/`.
2. `bun pm --cwd packages/react pack --destination <scratch>/consumer` — install the **tarball**,
   not a `file:` link to the repo. A `file:` link resolves `usehooks-ts` (a
   runtime dep) against the repo's dev React → "Invalid hook call" from two
   React copies.
3. Consumer `package.json` deps: `react`, `react-dom`,
   `@happy-dom/global-registrator`, `textimation: file:./textimation-<v>.tgz`.
4. Harness script: register happy-dom globals, then stub IntersectionObserver
   **before** importing react/textimation. Gotchas that cost time:
   - The stub's entries MUST include `intersectionRatio: 1` and the observer
     instance a `thresholds = [0]` property — usehooks-ts computes
     `entry.isIntersecting && intersectionRatio >= threshold`, so a bare
     `{ isIntersecting: true }` entry silently never intersects and the
     component sits in `idle` forever (final text visible, 0 element children
     — easy to misread as "animation finished instantly").
   - happy-dom fires rAF callbacks in near-zero-delay bursts with real
     timestamps; the ms-accumulator paces correctly anyway, so durations are
     realistic (`animationSpeed` × per-char counts of 8–20).
   - happy-dom `matchMedia('(prefers-reduced-motion: reduce)')` is `false` by
     default; override `window.matchMedia` to test the reduced-motion snap.
5. Drive: mount, sample `[aria-hidden]` span mid-animation (children count =
   code-point count, scrambled text, `textimation-*` classes), await settle,
   assert exact final `textContent`. Worth probing: text change mid-animation,
   shorter text (empty tail spans), emoji (each span holds one well-formed
   code point), `animationSpeed: 0`, empty text, duration scaling across two
   speeds, and — regression — reverting `text` mid-animation to the previously
   finished value (used to freeze mid-scramble when the guard compared against
   "last finished text" instead of the committed/rolled-back animation target).

A known-good harness shape exists in session scratch as `consumer/verify.tsx`;
recreate from this recipe if gone.
