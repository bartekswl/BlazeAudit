# BlazeAudit — Project Status & Context (Start Here)

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living snapshot — update as the project evolves |
| **Last updated** | 2026-06-06 |
| **Current phase** | Phase 3 complete; next is Phase 4 (document model & templates) |

## How to use this file

This is the **onboarding extract for a new chat/agent**. Read this first, then read
the linked docs as needed. Suggested kickoff prompt for a fresh chat:

> Read `docs/STATUS.md`, then the docs it links (PRD, ARCHITECTURE, DATA_MODEL,
> SECURITY, TEMPLATES, UX, ROADMAP, and the ADRs). Phases 0–3 are done; continue
> with Phase 4 (document model & templates) from the roadmap.

## What BlazeAudit is

An **offline-first Windows desktop app** for fire-protection professionals to build
reusable inspection **templates**, manage a **client** database, perform
**inspections**, and **export branded PDFs** — all stored locally and encrypted.
Inspired by fire-forms.com but a focused local tool, not a cloud SaaS. A companion
**marketing site + small license/admin server** accompanies the product.

## Snapshot

- **Done:** Phases 0–3. Encrypted SQLite (SQLCipher), client CRUD, polished **Customers**
  UI (search, detail view, breadcrumb, CSV export via **Database**), and **accounts/login**:
  activation → set password → offline login; key X wrapped with **Argon2id** + **DPAPI**;
  DB unlocks only after login. Dev data in **`<project>/data/`** (gitignored).
- **Next:** Phase 4 — document model, template builder, JSON portability.
- **Not started:** inspections workflow, PDF export, backups, license server (Phase 8),
  packaging.

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
  Templates, Calendar, Database, Settings); **Documents** holds all inspections.

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

## Phase 3 notes (as built)

- **Entry flow:** `AuthGate` wraps the app — **Activate** → **Set password** → **Log in**
  → main shell. Screens in `src/renderer/features/auth/`.
- **License client:** pluggable contract in `src/main/license/`; **dev stub** accepts
  `DEV-TEST-KEY` or any `BLZ-…` key (no real server until Phase 8).
- **Multi-account (one install):** several email + key X pairs on the same Windows profile;
  each gets `accounts/<sha256(email)>/` (opaque id — email never in paths), own
  `blazeaudit.db`, auth files, clients, and settings.   `registry.json` lists accounts; login panel shows activated accounts, switch, and add-account.
  **Log out** closes the app and requires password next launch.
- **Key X:** unique per account (not per install). Each `accounts/<id>/auth/` holds its
  own wrap, DPAPI cache, and token; manifest stores a `keyXId` fingerprint so unlock
  rejects a mismatched key. Every new account gets a fresh random key X.
- **DB unlock:** `openDatabase(keyX)` only after login/set-password; `getDatabase()` throws
  when locked. Startup no longer auto-opens the DB.
- **Settings:** per account at `accounts/<id>/settings.bin` (zlib + HMAC; login policy today).
  Manifest/registry/wrap use signed `.bin` (HMAC key in DPAPI — edits outside the app are rejected).
- **DPAPI cache:** `{ keyX, epoch }` paired with `unlockEpoch` in manifest; epoch bumps on
  log out and “every launch” policy change. Stale DPAPI paste fails without password.
- **Per-account isolation:** each `accounts/<opaque-id>/` has its own signed `settings.bin`,
  `manifest.bin`, `records.mac.dpapi`, and DB — switching users on the login panel loads that
  folder only. “Every launch” never stores DPAPI; old `keyx.dpapi` cannot skip password.
- **IPC:** `window.blazeaudit.auth.*` — `getStatus`, `activate`, `setPassword`, `login`,
  `logOut`, `getSecuritySettings`, `setLoginPolicy`. Normal close respects login policy;
  **log out** sets `requirePasswordOnLaunch` and quits.
- **Login policy:** Settings (and set-password step) — require password every launch,
  week, month, year, or never. Auto-unlock uses DPAPI key X only while the policy
  allows skip; DPAPI is cleared on log out, every-launch policy, and when an interval
  expires (JSON tamper alone cannot auto-unlock without password).
- **Paths:** dev → `<project>/data/`; packaged → per-profile AppData. Under that:
  `registry.bin` + `accounts/<opaque-id>/` (signed settings, auth, DB per account).
- **Deferred:** real license server + monthly validate (Phase 8); server escrow of key X;
  backup/restore (Phase 7).

## Phase 2 notes (as built)

- **Engine:** `better-sqlite3-multiple-ciphers` (SQLCipher). Schema **v2** (structured addresses).
- **Customers + Database UI** — see git history / prior STATUS sections; still valid.
- **Dev paths:** DB + auth → `<project>/data/`; Electron runtime → `.electron-dev/`.

## Immediate next step

**Phase 4 — document model & template builder.** Block tree, template CRUD, JSON
export/import, schema kit. See [`ROADMAP.md`](ROADMAP.md) and [`TEMPLATES.md`](TEMPLATES.md).

## Conventions / notes

- Docs are **living drafts**; significant decisions are recorded as **ADRs**.
- Commits are made only when the user asks; default branch is `main` on
  `github.com/bartekswl/BlazeAudit` (public, proprietary).
- **Dev stays in the repo** — never write test/app data under the user's AppData during
  development. See `AGENTS.md` (local-only).
- **Fresh test:** delete `<project>/data/` and run `npm run dev`; activate with `DEV-TEST-KEY`.
