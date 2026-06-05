# ADR-0001: Technology stack

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** SubraLab

## Context

BlazeAudit must be an **offline-first desktop application** for Windows that:

- stores fire-inspection templates, clients, and inspections locally;
- provides a modern, responsive, component-based editor for documents;
- exports inspections to PDF;
- ships as an easy-to-install installer and a standalone build.

We need to choose the desktop shell, UI framework, styling, local storage,
build/packaging tooling, and PDF approach.

## Decision

| Concern        | Choice                              |
| -------------- | ----------------------------------- |
| Desktop shell  | **Electron**                        |
| UI framework   | **React + TypeScript**              |
| Styling        | **Tailwind CSS**                    |
| Build/bundler  | **Vite**                            |
| Packaging      | **electron-builder** (Windows/NSIS) |
| Local storage  | **SQLite via `better-sqlite3`**     |
| PDF export     | **`@react-pdf/renderer`** (primary) |
| Lint/format    | **ESLint + Prettier**               |

## Rationale

- **Electron** — proven offline desktop runtime, fits "install or standalone,
  easily run" and Windows targeting; reuses web UI skills.
- **React + TypeScript** — the app is fundamentally a structured document/form
  builder; React's component model maps cleanly onto the block-based document
  model, and TypeScript gives safety for document schemas and IPC contracts.
- **Tailwind CSS** — fast path to a clean, modern, responsive UI.
- **Vite** — fast dev server and optimized builds; good Electron integration.
- **electron-builder** — produces Windows installers (NSIS) and portable builds
  with minimal config.
- **SQLite (`better-sqlite3`)** — true offline, file-based, synchronous and fast;
  no server process; ideal for local relational data (clients, templates,
  inspections).
- **`@react-pdf/renderer`** — render PDFs from the same React/tree paradigm; if it
  proves limiting for complex layouts, Chromium print-to-PDF is the fallback.

## Alternatives considered

- **Tauri** instead of Electron — smaller binaries and lower memory, but a Rust
  backend and a less mature ecosystem for our team; Electron's maturity and
  familiarity win for v1.
- **Plain files (JSON) instead of SQLite** — simpler, but querying client and
  inspection history and keeping data consistent is cleaner with SQLite.
- **Chromium print-to-PDF as primary** — very flexible, but heavier and harder to
  template precisely; kept as a fallback.
- **Redux for state** — more boilerplate than needed; lightweight state (Zustand)
  or React Query will be chosen during Phase 1–2 as needs become concrete.

## Consequences

- We accept Electron's larger bundle size in exchange for development speed and
  ecosystem maturity.
- `better-sqlite3` is a native module; packaging must handle native rebuilds for
  the target Electron version (handled by electron-builder).
- The shared **document/block model** becomes the backbone of the app; editor,
  storage, and PDF all depend on it (see [`../DATA_MODEL.md`](../DATA_MODEL.md)).
