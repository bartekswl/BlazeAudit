<div align="center">

# BlazeAudit

**Offline fire-inspection documentation, built for the field.**

A desktop application by [SubraLab](#) for creating, managing, and exporting
fire inspection documents — fully offline.

[Overview](#overview) ·
[Features](#features) ·
[Tech Stack](#tech-stack) ·
[Getting Started](#getting-started) ·
[Project Structure](#project-structure) ·
[Documentation](#documentation)

</div>

---

## Overview

BlazeAudit is a Windows desktop application that lets fire-protection
professionals build reusable **inspection templates**, maintain a **client
database**, carry out **inspections** against those templates, and **export the
results to PDF** — all without an internet connection.

It is inspired by tools such as fire-forms.com, but intentionally scoped to a
focused, offline-first workflow rather than a full SaaS platform.

> **Status:** Phase 0 — project setup & documentation. The application is not yet
> implemented. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Features

Planned capabilities (see [`docs/PRD.md`](docs/PRD.md) for the full spec):

- **Template library** — store and version reusable fire-inspection document
  templates.
- **Visual template/inspection editor** — add or remove components, insert
  equipment tables, add/remove rows and lines, and toggle sections on the fly.
- **Client database** — add, edit, and store the clients/sites you inspect.
- **Inspections** — create inspections per client from a template, fill them in,
  and keep a history.
- **PDF export** — produce clean, branded inspection reports.
- **Fully offline** — all data stored locally; no account or server required.
- **Easy distribution** — ships as a Windows installer and a standalone build.

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Desktop shell    | Electron                                    |
| UI               | React + TypeScript                          |
| Styling          | Tailwind CSS                                |
| Build / bundling | Vite + electron-builder                     |
| Local storage    | SQLite (`better-sqlite3`)                   |
| PDF export       | `@react-pdf/renderer` (or Chromium print)   |
| Tooling          | ESLint + Prettier                           |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/adr/0001-tech-stack.md`](docs/adr/0001-tech-stack.md) for the rationale.

## Getting Started

> Dependencies are not installed yet (Phase 0). These instructions describe the
> intended workflow once Phase 1 begins.

### Prerequisites

- [Node.js](https://nodejs.org/) LTS (v20+)
- npm (bundled with Node.js)
- Windows 10/11

### Install & run

```bash
npm install      # install dependencies
npm run dev      # start the app in development
```

### Build a distributable

```bash
npm run build    # produce a Windows installer + standalone build in /release
```

## Project Structure

```text
BlazeAudit/
├─ docs/            # Project documentation (PRD, architecture, data model, ADRs)
├─ src/             # Application source (added in Phase 1)
│  ├─ main/         # Electron main process (Node): db, ipc, pdf
│  ├─ preload/      # Secure contextBridge API
│  ├─ renderer/     # React UI (features, components, document-model)
│  └─ shared/       # Types shared across processes
├─ resources/       # Icons & SubraLab branding
├─ website/         # Marketing/showcase site (added later)
└─ <config files>   # package.json, tsconfig, eslint, prettier, etc.
```

## Documentation

| Document                                             | Purpose                                   |
| ---------------------------------------------------- | ----------------------------------------- |
| [`docs/PRD.md`](docs/PRD.md)                         | Product requirements, scope & non-goals   |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)       | System architecture & key decisions       |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)           | Database schema & document/block model     |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)                 | Phased delivery plan                       |
| [`docs/adr/`](docs/adr/)                             | Architecture Decision Records             |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                 | Development workflow & conventions        |
| [`CHANGELOG.md`](CHANGELOG.md)                       | Notable changes per release               |

## License

Proprietary © 2026 SubraLab. All rights reserved. See [`LICENSE`](LICENSE).
