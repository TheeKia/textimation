# @textimation/core

Private, framework-independent animation helpers shared by React and Svelte.
The source exports timing math, frame advancement, initial masking, count
initialization, and `AnimationType`. Unit tests live in `test/`.

Both framework packages bundle this workspace into their own output and
resolve its types into declarations. It is a development dependency, not a
package consumers install. Keep it free of framework and DOM dependencies.

From the repository root:

```bash
bun test packages/core/test
bun run --cwd packages/core type-check
```
