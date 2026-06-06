# BlazeAudit — Project Status & Context (Start Here)

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living snapshot — update as the project evolves |
| **Last updated** | 2026-06-06 |
| **Current phase** | Phase 0 complete; next is Phase 1 (app shell) |

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

- **Done:** Phase 0 — git, docs, tooling config (`package.json`, TS, ESLint,
  Prettier), and the full design documentation set below. No app code yet.
- **Next:** Phase 1 — app shell: Electron + Vite + React + Tailwind, frameless
  window with custom title/status bar and the left sidebar nav shell.
- **Not started:** dependency install (`dependencies` is still empty), `src/` is
  empty, `dev`/`build` scripts are placeholders.

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

## Immediate next step

**Phase 1 — app shell.** Recommended approach: `vite-plugin-electron` to hand-build
the `main` / `preload` / `renderer` / `shared` structure; secure window
(`contextIsolation`, `nodeIntegration: false`, `sandbox`); frameless chrome + sidebar
shell; real `dev`/`build` scripts; Tailwind with a neutral theme (branding slots in
later). Branding assets are kept **local only** (`branding/` is gitignored).

## Conventions / notes

- Docs are **living drafts**; significant decisions are recorded as **ADRs**.
- Commits are made only when the user asks; default branch is `main` on
  `github.com/bartekswl/BlazeAudit` (public, proprietary).
