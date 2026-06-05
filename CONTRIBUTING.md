# Contributing to BlazeAudit

BlazeAudit is a proprietary SubraLab project. This guide documents the
development workflow and conventions so the codebase stays consistent and
maintainable.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (v20+) and npm
- Git
- Windows 10/11 (primary target platform)

## Getting set up

```bash
git clone <repo-url>
cd BlazeAudit
npm install
npm run dev
```

## Branching model

We use a lightweight trunk-based flow:

- `main` — always releasable.
- `feat/<short-name>` — new features.
- `fix/<short-name>` — bug fixes.
- `chore/<short-name>` — tooling, docs, maintenance.

Open a pull request into `main`. Keep PRs small and focused.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <description>

[optional body]
[optional footer]
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`,
`ci`, `perf`.

Examples:

- `feat(templates): add equipment-table block`
- `fix(pdf): correct page-break in long inspections`
- `docs(architecture): document IPC boundaries`

## Code style

- **Language:** TypeScript everywhere (strict mode).
- **Formatting:** Prettier (run `npm run format`).
- **Linting:** ESLint (run `npm run lint`). CI will fail on lint errors.
- **Naming:** descriptive names; avoid abbreviations. Components in
  `PascalCase`, functions/variables in `camelCase`, files in `kebab-case`
  (except React components, which match the component name).
- **No narrating comments.** Comments explain *why*, not *what*.

## Architecture Decision Records (ADRs)

Significant technical decisions are recorded in [`docs/adr/`](docs/adr/). When
making a decision that affects architecture, add a new ADR (copy the format of
[`docs/adr/0001-tech-stack.md`](docs/adr/0001-tech-stack.md)).

## Documentation

Keep documentation current with code changes:

- Update [`CHANGELOG.md`](CHANGELOG.md) under `[Unreleased]`.
- Update relevant files in [`docs/`](docs/) when behavior or schema changes.

## Definition of done

A change is "done" when:

1. It builds and runs (`npm run dev`).
2. Lint and format pass (`npm run lint && npm run format`).
3. Documentation and changelog are updated.
4. The PR description explains the change and how to test it.
