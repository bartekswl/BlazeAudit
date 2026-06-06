# BlazeAudit — Roadmap

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living draft — phases & scope will shift |
| **Last updated** | 2026-06-05 |

A phased delivery plan. Phases are sequential but boundaries are flexible.

## Phase 0 — Project setup & documentation ✅ (current)

- Git initialization and hygiene (`.gitignore`, `.gitattributes`, `.editorconfig`).
- Core docs (README, CONTRIBUTING, CHANGELOG); no license granted (all rights reserved).
- Documentation set: PRD, architecture, data model, security design, template/
  document design, UI/UX design, ADRs, roadmap.
- Toolchain configuration: `package.json`, TypeScript, ESLint, Prettier.

**Exit criteria:** repo initialized, documented, and ready for development.

## Phase 1 — App shell ("hello window")

- Install dependencies (Electron, Vite, React, TypeScript, Tailwind).
- Boot a secure Electron window rendering a React app.
- **Frameless window** with a custom **title/status bar** (minimize/maximize/close,
  draggable) and the **left sidebar** navigation shell (Dashboard, Customers,
  Documents, Templates, Calendar, Settings; avatar + name at the bottom).
- Wire dev workflow (`npm run dev`) and a minimal production build.
- Establish the preload/IPC security boundary.
- See [`UX.md`](UX.md).

**Exit criteria:** `npm run dev` opens a working, styled BlazeAudit window with the
frameless chrome and sidebar shell in place.

> The **dashboard content** (time strip, stat tiles, reminders, recents, New
> Inspection) fills in as the underlying data lands (Phases 2/5); the shell and
> layout come first here.

## Phase 2 — Data layer (encrypted)

- Integrate **encrypted SQLite** (SQLCipher / encryption-capable `better-sqlite3`
  build), schema, and migrations.
- Implement client CRUD over IPC.
- Basic client management UI (list, add, edit, delete).

**Exit criteria:** clients can be created, edited, and persisted offline in an
encrypted database.

## Phase 3 — Accounts, local security & login

- Local **password login** (Argon2id) and **key-X** management (Windows DPAPI via
  `safeStorage`, password wrapping) to unlock the encrypted DB.
- **Activation flow**: enter key, one-time online activation, store signed token +
  key X; single-use key + instance id handling.
- See [`SECURITY.md`](SECURITY.md) and [`ADR-0002`](adr/0002-accounts-activation-licensing.md).

**Exit criteria:** the app activates once online, then an offline local login
unlocks the encrypted database.

## Phase 4 — Document model & template builder

- Implement the block/document model and validation, including the fixed
  **document header** (title, client relation, date, inspection type).
- Build the visual template editor: add/remove blocks, **tables** (add/remove rows
  **and columns**), **checklists**, **write-on lines**, reorder, toggle sections.
- Template CRUD and storage; **seed default templates** on first run.
- **Portability**: JSON template **export/import**, the **JSON Schema export kit**
  (`schema.json` + `example.json` + prompt), and schema-validated import.
- See [`TEMPLATES.md`](TEMPLATES.md) and [`ADR-0003`](adr/0003-document-model-portability.md).

**Exit criteria:** a user can build, save, export/import, and seed default
templates visually.

## Phase 5 — Inspections

- Create inspections from templates, attached to clients.
- Fill-in editor with autosave; draft vs. complete status.
- Inspection history per client.
- **Cadence + next-due date** and a **due/overdue reminders dashboard** at launch.

**Exit criteria:** a full inspection can be created, edited, saved, and surfaces
when the next one is due.

## Phase 6 — PDF export

- Render an inspection's document tree to a branded PDF.
- Tables, checklists, signatures, and metadata in output.
- **Embed the document JSON in the PDF** for a lossless re-import round-trip.

**Exit criteria:** a completed inspection exports to a clean PDF, and a
BlazeAudit-exported PDF can be re-imported losslessly.

## Phase 7 — Backups & recovery

- Produce a **single encrypted backup file**: scheduled (every few weeks),
  on-demand, and automatically before any lockout.
- Restore flow; recovery via key reissue on a fresh activated install.

**Exit criteria:** a user can back up to one file and restore it on a fresh,
re-activated install.

## Phase 8 — License server & admin panel

- Small server **co-hosted with the marketing site**: `activate` / `validate` /
  `deactivate` with **signed** responses; escrowed key store; accounts, keys,
  instances, and basic telemetry.
- **Admin front end**: issue/activate keys, deactivate instances, view account data.
- Wire the app's **monthly check + fail-open** enforcement against it.
- **GDPR**: privacy notice, lawful basis, and data-retention policy.

**Exit criteria:** SubraLab can issue/deactivate keys and see who/where; the app
enforces the monthly check while remaining fail-open. (The license client can be
stubbed in earlier phases.)

## Phase 9 — Packaging & distribution

- Configure electron-builder for a Windows installer (NSIS) + standalone build.
- App icon and SubraLab branding.
- Versioning and release process.

**Exit criteria:** a one-click Windows installer and a portable build are produced.

## Phase 10 — Marketing / showcase website

- Simple website: product overview, features, screenshots, contact.
- "Usual jazz" for showcasing the product and providing contact/download info.
- Lives in `website/`; deployable as a static site (hosts the Phase 8 server).

**Exit criteria:** a polished marketing site is ready to publish.

## Backlog / later

- Default fire-inspection templates shipped with the app.
- Template import/export between machines.
- Auto-update for installed app.
- Optional macOS/Linux builds.
