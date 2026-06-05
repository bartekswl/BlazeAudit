# BlazeAudit — Architecture

| | |
| --- | --- |
| **Status** | Draft (Phase 0) |
| **Last updated** | 2026-06-05 |

This document describes the high-level architecture of BlazeAudit. For the
underlying technology decision, see
[`adr/0001-tech-stack.md`](adr/0001-tech-stack.md).

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
- **Data layer (`src/main/db`)** — SQLite access via `better-sqlite3`, schema and
  migrations, and query functions for clients, templates, and inspections.
- **PDF generation (`src/main/pdf`)** — render an inspection document tree to PDF.
- **IPC handlers (`src/main/ipc`)** — implement the allow-listed channels exposed
  to the renderer.

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
- User data stays on the local machine; no network calls in core flows.

## 6. Build & packaging

- **Vite** bundles the renderer (and main/preload) for fast dev and optimized
  production output.
- **electron-builder** produces a Windows installer (NSIS) and a standalone /
  portable build. See [`ROADMAP.md`](ROADMAP.md) for phasing.

## 7. Directory layout

```text
src/
├─ main/        # Electron main process (Node)
│  ├─ db/       # SQLite schema, migrations, queries
│  ├─ ipc/      # IPC handlers
│  └─ pdf/      # PDF generation
├─ preload/     # contextBridge API
├─ renderer/    # React UI
│  ├─ features/ # clients, templates, inspections, export
│  ├─ components/
│  └─ document-model/
└─ shared/      # types shared across processes
```
