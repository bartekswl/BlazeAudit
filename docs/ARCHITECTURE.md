# BlazeAudit — Architecture

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living draft — provisional, expect change |
| **Last updated** | 2026-06-05 |

> ⚠️ **This is a living document, not a fixed design.** Everything below is a
> starting hypothesis to guide early development. Concrete designs will be made
> incrementally, step by step, as we build. Do not treat any structure here as
> final. The only firm decision so far is the technology stack — see
> [`adr/0001-tech-stack.md`](adr/0001-tech-stack.md). Other significant changes
> should be captured as new ADRs.

This document sketches a high-level direction for BlazeAudit's architecture.

## 1. Overview

BlazeAudit is an Electron desktop application split into the standard Electron
process model, with a strict, secure boundary between the privileged Node.js
**main process** and the sandboxed **renderer** (the React UI).

```text
┌─────────────────────────────────────────────────────────────┐
│                     Electron Application                      │
│                                                              │
│  ┌────────────────────────┐      ┌────────────────────────┐ │
│  │   Main process (Node)   │      │  Renderer (React UI)    │ │
│  │                         │      │                         │ │
│  │  • App lifecycle        │      │  • Template builder     │ │
│  │  • Window management     │      │  • Client manager       │ │
│  │  • SQLite data layer     │      │  • Inspection editor    │ │
│  │  • PDF generation        │      │  • Export view          │ │
│  │  • IPC handlers          │      │  • document-model       │ │
│  └───────────┬─────────────┘      └───────────┬────────────┘ │
│              │                                  │             │
│              │      contextBridge / preload     │             │
│              └──────────────  IPC  ─────────────┘             │
│            (typed, allow-listed channels only)               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  SQLite (.db)   │  local file, user data
                 └─────────────────┘
```

## 2. Processes & responsibilities

### 2.1 Main process (`src/main`)

Runs in Node.js and owns everything privileged:

- **App lifecycle & windows** — create the main `BrowserWindow`, manage app
  events.
- **Data layer (`src/main/db`)** — encrypted SQLite (SQLCipher) access, schema and
  migrations, and query functions for clients, templates, and inspections.
- **Security (`src/main/security`)** — local credential/login handling, key-X
  management (DPAPI via `safeStorage`, password wrapping), and DB unlock.
- **License (`src/main/license`)** — the host-agnostic license client
  (`activate` / `validate` / `deactivate`), signed-response verification, the
  monthly check, and fail-open enforcement.
- **Backup (`src/main/backup`)** — produce/restore the single encrypted backup
  file (scheduled, on-demand, and pre-lockout).
- **PDF generation (`src/main/pdf`)** — render an inspection document tree to PDF.
- **IPC handlers (`src/main/ipc`)** — implement the allow-listed channels exposed
  to the renderer.

These privileged concerns are detailed in [`SECURITY.md`](SECURITY.md).

### 2.2 Preload (`src/preload`)

A small, security-critical layer using `contextBridge` to expose a **typed,
minimal API** to the renderer. The renderer never accesses Node APIs directly.

### 2.3 Renderer (`src/renderer`)

The React + TypeScript UI:

- **features/** — feature areas: `clients`, `templates`, `inspections`, `export`.
- **components/** — shared, reusable UI components (Tailwind-styled).
- **document-model/** — block type definitions, document schema, and validation
  (see [`DATA_MODEL.md`](DATA_MODEL.md)). This is shared conceptually with the
  main process via `src/shared`.

### 2.4 Shared (`src/shared`)

TypeScript types and pure helpers shared across processes (e.g. document/block
types, IPC channel contracts). No runtime Node/DOM dependencies.

## 3. The document model (core idea)

The single most important design decision: **a document is a JSON tree of typed
blocks**.

- A **template** stores the default block tree.
- An **inspection** is an instance of a block tree (cloned from a template) plus
  filled-in values.
- The **editor** manipulates the tree (add/remove/reorder blocks, add/remove table
  rows and list lines, toggle sections).
- The **PDF renderer** walks the same tree to produce output.

Because the editor, storage, and PDF export all operate on one shared structure,
features like "add an equipment table" or "remove a line" are uniform operations
on the tree rather than special cases. Block types and schema live in
[`DATA_MODEL.md`](DATA_MODEL.md).

## 4. Data flow examples

**Create an inspection and export to PDF**

1. Renderer requests templates and clients over IPC; main reads SQLite, returns
   data.
2. User picks a template + client; renderer clones the template's block tree into
   a new inspection draft.
3. User edits; renderer autosaves drafts via IPC → main writes to SQLite.
4. User exports; renderer sends the inspection id to main; main loads the tree,
   renders a PDF, and writes/returns the file.

## 5. Security posture

Following Electron security best practices:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` for the
  renderer.
- All privileged access via a minimal preload bridge over **allow-listed** IPC
  channels.
- No remote content; the renderer loads local bundled assets only.
- User data stays on the local machine; **encrypted at rest** with SQLCipher.
- Network is used only for **one-time activation** and a **monthly licensing
  check** — never for core data flows.

### 5.1 Accounts, activation, licensing & recovery

A separate concern with its own dedicated design document. In short:

- Email accounts; single-use, admin-issued activation keys bound to one instance.
- One-time online activation provisions a per-account encryption **key X**
  (escrowed server-side); daily login is an offline local password.
- Backups are single encrypted files; recovery reissues the key so old backups
  open on a fresh install.
- A monthly, **fail-open** check enables remote deactivation without ever locking
  out a user due to server faults.
- An external **license/admin server** (co-hosted with the marketing site) holds
  accounts, keys, instances, escrowed keys, and telemetry — never inspection data.

Full detail: [`SECURITY.md`](SECURITY.md) and
[`adr/0002-accounts-activation-licensing.md`](adr/0002-accounts-activation-licensing.md).

## 6. Build & packaging

- **Vite** bundles the renderer (and main/preload) for fast dev and optimized
  production output.
- **electron-builder** produces a Windows installer (NSIS) and a standalone /
  portable build. See [`ROADMAP.md`](ROADMAP.md) for phasing.

## 7. Directory layout

```text
src/
├─ main/        # Electron main process (Node)
│  ├─ db/       # encrypted SQLite (SQLCipher) schema, migrations, queries
│  ├─ security/ # login, key-X management (DPAPI), DB unlock
│  ├─ license/  # license client, signed-response checks, monthly check
│  ├─ backup/   # encrypted backup file: create / restore
│  ├─ ipc/      # IPC handlers
│  └─ pdf/      # PDF generation
├─ preload/     # contextBridge API
├─ renderer/    # React UI
│  ├─ features/ # clients, templates, inspections, export, account
│  ├─ components/
│  └─ document-model/
└─ shared/      # types shared across processes (incl. license-client contract)
```

> The **license/admin server** is a **separate** component (co-hosted with the
> marketing site), not part of this `src/` tree. See [`SECURITY.md`](SECURITY.md)
> §10 and [`ROADMAP.md`](ROADMAP.md).
