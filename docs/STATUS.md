# BlazeAudit — Project Status & Context (Start Here)

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living snapshot — update as the project evolves |
| **Last updated** | 2026-06-06 |
| **Current phase** | Phase 1 complete (app shell); next is Phase 2 (encrypted data layer) |

## How to use this file

This is the **onboarding extract for a new chat/agent**. Read this first, then read
the linked docs as needed. Suggested kickoff prompt for a fresh chat:

> Read `docs/STATUS.md`, then the docs it links (PRD, ARCHITECTURE, DATA_MODEL,
> SECURITY, TEMPLATES, UX, ROADMAP, and the ADRs). We've finished Phase 0; continue
> from the roadmap.

## What BlazeAudit is

An **offline-first Windows desktop app** for fire-protection professionals to build
reusable inspection **templates**, manage a **client** database, perform
**inspections**, and **export branded PDFs** — all stored locally and encrypted.
Inspired by fire-forms.com but a focused local tool, not a cloud SaaS. A companion
**marketing site + small license/admin server** accompanies the product.

## Snapshot

- **Done:** Phase 0 (git, docs, tooling) **and Phase 1 — app shell**. Dependencies
  installed; `src/` scaffolded across `main`/`preload`/`renderer`/`shared`; a secure
  frameless Electron window boots a React + Tailwind v4 UI with custom title/status
  bar (working min/max/close), a config-driven left sidebar, and placeholder screens.
  `npm run dev` (Vite + Electron HMR) and `npm run build` both work.
- **Next:** Phase 2 — encrypted data layer (SQLCipher / encryption-capable
  `better-sqlite3`), schema + migrations, and client CRUD over IPC.
- **Not started:** data layer, accounts/login, document model, inspections, PDF,
  backups, license server, packaging.

## Tech stack (ADR-0001)

Electron + React + TypeScript + Tailwind + Vite + electron-builder; local storage
in **encrypted SQLite (SQLCipher)**; PDF via `@react-pdf/renderer` (Chromium
print-to-PDF fallback). Windows-only for v1. Proprietary (all rights reserved).

## Key decisions (condensed)

- **Accounts & licensing** (ADR-0002, [`SECURITY.md`](SECURITY.md)): email accounts;
  single-use admin-issued activation keys bound to one instance; one active instance
  per account; one-time online activation; per-account encryption "key X" escrowed
  server-side; local password login; SQLCipher + Windows DPAPI; single-file local
  backups + offsite by user; recovery by reissuing the key; monthly opportunistic
  check with **fail-open** remote deactivation; license transport kept pluggable.
- **Document model & portability** (ADR-0003, [`TEMPLATES.md`](TEMPLATES.md)):
  templates/inspections are JSON block-trees in the DB; fixed header (title, client
  relation, date, inspection type) + customizable body; blocks include a generalized
  `table` (add/remove rows AND columns) and a `lines` block; default templates seeded
  on first run; JSON file export/import; a **JSON Schema export kit** for external AI
  migration; **embedded-JSON PDF round-trip**; inspection **cadence + due reminders**.
- **UI/UX** ([`UX.md`](UX.md)): frameless window + custom title/status bar; entry flow
  activation -> login -> dashboard; left sidebar (Dashboard, Customers, Documents,
  Templates, Calendar, Settings); **Documents** holds all inspections; dashboard with
  time strip, stat tiles, reminders notes, recents, and a New Inspection button.

## Document map

| Doc | What it covers |
| --- | --- |
| [`PRD.md`](PRD.md) | Product requirements, scope, goals, success criteria |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Process model, modules, security posture, layout |
| [`DATA_MODEL.md`](DATA_MODEL.md) | SQLite schema, document/block model, server-side sketch |
| [`SECURITY.md`](SECURITY.md) | Activation, key model, login, backup, recovery, enforcement |
| [`TEMPLATES.md`](TEMPLATES.md) | Document/template authoring, portability, scheduling |
| [`UX.md`](UX.md) | Window chrome, navigation, dashboard layout |
| [`ROADMAP.md`](ROADMAP.md) | Phased delivery plan (Phases 0–10) |
| [`adr/`](adr/) | Decision records: 0001 stack, 0002 accounts/security, 0003 document model |

## Phase 1 notes (as built)

- **Build wiring:** `vite-plugin-electron` builds `main` (ESM) and `preload`; the
  renderer is a standard Vite React app (`index.html` → `src/renderer/main.tsx`).
  `dev` = `vite` (auto-launches Electron + HMR); `build` = `tsc --noEmit && vite build`;
  `preview` = `electron .` (runs the production build).
- **Security:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
  Because **sandboxed preload scripts cannot use ESM**, the preload is forced to a
  CommonJS `index.cjs` via `lib.formats: ['cjs']` in `vite.config.ts` (a harmless
  unused `index.mjs` is also emitted into the gitignored `dist-electron/`).
- **IPC:** allow-listed channels live in `src/shared/ipc.ts`; the preload exposes a
  typed `window.blazeaudit` bridge (window min/max/close + maximize state, app version).
- **UI:** navigation is **config-driven** (`src/renderer/navigation.ts`) so menus are
  a one-file edit. Neutral dark theme via Tailwind v4 (`@tailwindcss/vite`); flame
  accent token defined in `index.css`. Branding still deferred (`branding/` local-only).
- **Deferred:** a strict CSP (omitted so Vite HMR works; enforce later via session
  headers); the dashboard tiles/recents/reminders show placeholders until data lands.

## Immediate next step

**Phase 2 — encrypted data layer.** Integrate encryption-capable SQLite, define the
schema + migrations, and implement client CRUD over IPC with a basic client
management UI. See [`ROADMAP.md`](ROADMAP.md) and [`DATA_MODEL.md`](DATA_MODEL.md).

## Conventions / notes

- Docs are **living drafts**; significant decisions are recorded as **ADRs**.
- Commits are made only when the user asks; default branch is `main` on
  `github.com/bartekswl/BlazeAudit` (public, proprietary).
