# Contributing to textimation

Thank you for your interest in contributing to our project! This guide will help you get started with the development process.

## Development Setup

### Prerequisites

- Bun 1.4.0 (also used in CI)
- Node.js 24.11+ (24 LTS is used in CI) for Svelte/Vite and release tooling

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/TheeKia/textimation.git`
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
- `bun run check:packages`: validate built package exports with publint.
- `bun run build:playgrounds`: build both preview apps for production.
- `bun run type-check`: check both libraries and both playgrounds.
- `bun run test`: run unit tests (currently React's pure animation helpers).
- `bun run check`: run all of the above checks plus lint.

Both previews resolve their library's package name to local source for immediate
updates. Published package exports point to build output. The React package is
still named `textimation`; consumer imports are unchanged. The Svelte starter is
private and does not animate yet.

Shared compiler options live in `tsconfig.base.json`, with framework settings in
each workspace. Biome handles JS/TS/JSON/CSS; Prettier handles `.svelte` formatting,
and `svelte-check` checks Svelte diagnostics and accessibility warnings.

## Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Start development mode: `bun run dev`
3. Make your changes and test them live in the preview app
4. Check and fix code style and formatting issues: `bun run lint:fix`
5. Run the full verification: `bun run check`
6. Commit your changes using the conventions below
7. Push your branch to your fork
8. Open a pull request

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
