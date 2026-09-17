# Contributing to textimation

Thank you for your interest in contributing to our project! This guide will help you get started with the development process.

## Development Setup

### Prerequisites

- Bun 1.4.0 (also used in CI)
- Node.js 24.11+ within Node 24 to match CI, for tooling and the React package
  smoke check. The manifest also supports `^22.18.0 || ^24.11.0 || >=26.0.0`.

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/textimation.git`
3. Navigate to the project directory: `cd textimation`
4. Install dependencies: `bun install`
5. Start development: `bun run dev:react` or `bun run dev:svelte`

### Development Mode

The root is a private Bun workspace. Install dependencies at the root and commit
the shared `bun.lock` whenever manifests change. Libraries live in `packages/*`;
private development apps live in `apps/*`. Each workspace declares its own
runtime, peer, and development dependencies.

- `bun run dev` / `bun run dev:react`: React preview at http://localhost:3041.
- `bun run dev:svelte`: Svelte preview at http://localhost:3042.
- `bun run build`: build both libraries.
- `bun run check:packages`: validate built packages with publint and the React
  public-export, static SSR, and CSS smoke check. Run `bun run build` first.
- `bun run build:playgrounds`: build both preview apps for production.
- `bun run type-check`: check both libraries and both playgrounds.
- `bun run test`: run unit tests (currently React's pure animation helpers).
- `bun run check`: lint, type-check, unit tests, library and playground builds,
  then package validation. It does not start the development servers.

Both previews resolve their library's package name to local source for immediate
updates. Published package exports point to build output. The React package is
still named `textimation`; consumer imports are unchanged. The Svelte starter is
private and does not animate yet.

Shared compiler options live in `tsconfig.base.json`, with framework settings in
each workspace. Biome handles JS/TS/JSON/CSS; Prettier handles `.svelte` formatting,
and `svelte-check` checks Svelte diagnostics and accessibility warnings.

## Development Workflow

1. Create a new branch: `git switch -c feature/your-feature-name`
2. Start development mode: `bun run dev`
3. Make your changes and test them live in the preview app
4. Check and fix code style and formatting issues: `bun run lint:fix`
5. Run the full verification: `bun run check`
6. Commit your changes using the conventions below
7. Push your branch to your fork
8. Open a pull request

## Code Quality and Verification

Read [AGENTS.md](./AGENTS.md) for architecture, implementation invariants, and
the repository's quality standards. Prefer modern TypeScript and native APIs,
React function components/hooks, and Svelte 5 runes while preserving declared
runtime and peer compatibility. Keep changes focused, types precise, effects
cleaned up, and accessibility intact. New dependencies and abstractions should
solve a concrete problem.

Add regression coverage for changed behavior. The current unit tests exercise
pure animation and timing helpers; package validation checks exports, static
server rendering, and CSS resolution. Neither verifies hydration or browser
lifecycle behavior. For React component changes, check the playground under
StrictMode, including rapid text changes, shorter/empty targets, scroll entry,
reduced motion, whitespace/emoji, and unmount cleanup. The main preview remounts
when tuning controls change, so test live prop changes separately when relevant.

Keep the root README and `packages/react/README.md` in sync for consumer-facing
changes. Document Svelte's current scaffold status until animation exists.
Before opening a PR, run `bun run check` and state which browser checks were
performed. CI runs verification on Linux, macOS, and Windows.

## Releases

`bun run release` uses the installed bumpp configuration to bump only
`packages/react/package.json`, refresh the root lockfile, commit, tag `v<version>`,
and push. Start from a clean working tree because the release commit includes
all changes. CI validates both frameworks, then publishes from `packages/react`.
The root, playgrounds, and unfinished Svelte package are never published.
Do not use recursive version bumps: package versions are independent.

When Svelte is ready for npm, choose its public name and version and add a
separate release tag pattern and publish job before removing `private`.

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit messages:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code changes that neither fix bugs nor add features
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependencies, etc.

## Pull Request Guidelines

1. Update documentation if needed
2. Ensure all tests pass
3. Address any feedback from code reviews
4. Once approved, your PR will be merged

## Code of Conduct

Please be respectful and constructive in all interactions within our community.

## Questions?

If you have any questions, please [open an issue](https://github.com/TheeKia/textimation/issues/new) for discussion.

Thank you for contributing to textimation!
