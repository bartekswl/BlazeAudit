# BlazeAudit — Project Status & Context (Start Here)

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living snapshot — update as the project evolves |
| **Last updated** | 2026-06-06 |
| **Current phase** | Phase 2 complete (encrypted data layer + clients); next is Phase 3 (accounts/login) |

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

- **Done:** Phases 0–1 (tooling + app shell) **and Phase 2 — encrypted data layer**.
  Encrypted SQLite via `better-sqlite3-multiple-ciphers` (SQLCipher), a migration
  runner (`user_version`), the `clients` + `app_meta` tables, client CRUD over IPC,
  and a working Customers screen (list/add/edit/delete). DB lives encrypted at
  `userData/data/blazeaudit.db`; verified encrypted-at-rest + wrong-key rejection.
- **Next:** Phase 3 — accounts, local password login (Argon2id), key-X management
  (DPAPI/`safeStorage` + password wrapping), and the one-time online activation flow.
- **Not started:** accounts/login, document model, inspections, PDF, backups,
  license server, packaging.

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

## Phase 2 notes (as built)

- **Engine:** `better-sqlite3-multiple-ciphers` (drop-in `better-sqlite3` with
  SQLCipher). Native module — kept **external** in the main Vite build and loaded from
  `node_modules` at runtime. Types aliased via `src/types/better-sqlite3-multiple-ciphers.d.ts`.
- **Native rebuild:** Electron is **pinned to v41** because that's the newest line with a
  published prebuilt binary for the module (Electron 42 / ABI 146 had none, and there's no
  C++ toolchain to compile). `scripts/rebuild-native.mjs` (run via `postinstall`) fetches the
  Electron-ABI prebuild after any `npm install`; manual: `npm run rebuild:native`.
- **Key handling (Phase 2 bridge):** a random 256-bit key is generated on first run and
  protected by **Windows DPAPI** (`safeStorage`), stored at `userData/data/db.key`. The DB
  opens via `PRAGMA cipher='sqlcipher'` + raw key. Phase 3 layers password-wrapping + server
  escrow onto this same key (it becomes "key X"). Verified: plaintext absent from the file,
  wrong key rejected.
- **Layout:** `src/main/db/` = `key` (DPAPI), `connection` (open/unlock + PRAGMAs),
  `migrations` (`user_version` runner; v1 = `clients` + `app_meta`), `clients` (CRUD repo,
  snake_case↔camelCase mapping), `index` (init/orchestrate). IPC in `src/main/ipc/clients.ts`;
  preload exposes `window.blazeaudit.clients.*`; UI in `features/customers/CustomersScreen.tsx`.
- **Deferred:** `templates`/`inspections` tables (added in their phases via new migrations);
  dashboard still shows placeholder counts until Phase 5.

## Immediate next step

**Phase 3 — accounts, local security & login.** Local password login (Argon2id), key-X
management (DPAPI + password wrapping) to unlock the DB, and the one-time online activation
flow. See [`ROADMAP.md`](ROADMAP.md), [`SECURITY.md`](SECURITY.md), and
[`adr/0002-accounts-activation-licensing.md`](adr/0002-accounts-activation-licensing.md).

## Conventions / notes

- Docs are **living drafts**; significant decisions are recorded as **ADRs**.
- Commits are made only when the user asks; default branch is `main` on
  `github.com/bartekswl/BlazeAudit` (public, proprietary).
