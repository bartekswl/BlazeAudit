# BlazeAudit — Roadmap

| | |
| --- | --- |
| **Status** | Draft (Phase 0) |
| **Last updated** | 2026-06-05 |

A phased delivery plan. Phases are sequential but boundaries are flexible.

## Phase 0 — Project setup & documentation ✅ (current)

- Git initialization and hygiene (`.gitignore`, `.gitattributes`, `.editorconfig`).
- Core docs (README, CONTRIBUTING, CHANGELOG); no license granted (all rights reserved).
- Documentation set: PRD, architecture, data model, ADRs, roadmap.
- Toolchain configuration: `package.json`, TypeScript, ESLint, Prettier.

**Exit criteria:** repo initialized, documented, and ready for development.

## Phase 1 — App shell ("hello window")

- Install dependencies (Electron, Vite, React, TypeScript, Tailwind).
- Boot a secure Electron window rendering a React app.
- Wire dev workflow (`npm run dev`) and a minimal production build.
- Establish the preload/IPC security boundary.

**Exit criteria:** `npm run dev` opens a working, styled, empty BlazeAudit window.

## Phase 2 — Data layer

- Integrate SQLite (`better-sqlite3`), schema, and migrations.
- Implement client CRUD over IPC.
- Basic client management UI (list, add, edit, delete).

**Exit criteria:** clients can be created, edited, and persisted offline.

## Phase 3 — Document model & template builder

- Implement the block/document model and validation.
- Build the visual template editor: add/remove blocks, equipment tables,
  add/remove rows and lines, reorder, toggle sections.
- Template CRUD and storage.

**Exit criteria:** a user can build and save a custom template visually.

## Phase 4 — Inspections

- Create inspections from templates, attached to clients.
- Fill-in editor with autosave; draft vs. complete status.
- Inspection history per client.

**Exit criteria:** a full inspection can be created, edited, and saved.

## Phase 5 — PDF export

- Render an inspection's document tree to a branded PDF.
- Tables, checklists, signatures, and metadata in output.

**Exit criteria:** a completed inspection exports to a clean PDF.

## Phase 6 — Packaging & distribution

- Configure electron-builder for a Windows installer (NSIS) + standalone build.
- App icon and SubraLab branding.
- Versioning and release process.

**Exit criteria:** a one-click Windows installer and a portable build are produced.

## Phase 7 — Marketing / showcase website

- Simple website: product overview, features, screenshots, contact.
- "Usual jazz" for showcasing the product and providing contact/download info.
- Lives in `website/`; deployable as a static site.

**Exit criteria:** a polished marketing site is ready to publish.

## Backlog / later

- Default fire-inspection templates shipped with the app.
- Template import/export between machines.
- Auto-update for installed app.
- Optional macOS/Linux builds.
