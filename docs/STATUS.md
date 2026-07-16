# BlazeAudit — Project Status & Context (Start Here)

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living snapshot — update as the project evolves |
| **Last updated** | 2026-07-16 |
| **HEAD** | `4519740` on `main` (`github.com/bartekswl/BlazeAudit`) |
| **Schema** | SQLite `user_version` **11** (`LATEST_SCHEMA_VERSION`) |
| **Current focus** | ULC S536 built-in form polish (template · document · PDF parity) |
| **Roadmap next** | Phase 7 (encrypted backups) — not started; form work is active ahead of it |

## How to use this file

This is the **onboarding extract for a new chat/agent**. Read this first, then the
linked docs as needed. Suggested kickoff:

> Read `docs/STATUS.md` and `AGENTS.md`. For form/page work also read
> `docs/FORM_ELEMENT_BLUEPRINT.md`. Phases 0–6 are done; active work is the
> CAN/ULC-S536 built-in form. Formal roadmap next is Phase 7 (backups).

## What BlazeAudit is

An **offline-first Windows desktop app** for fire-protection professionals to build
reusable inspection **templates**, manage a **client** database, perform
**inspections**, and **export branded PDFs** — all stored locally and encrypted.
Inspired by fire-forms.com but a focused local tool, not a cloud SaaS. A companion
**marketing site + small license/admin server** accompanies the product.

## Snapshot

- **Done (roadmap):** Phases 0–6 — app shell, encrypted DB, accounts/login, custom
  block templates, inspections, PDF export/import with embedded JSON.
- **Done (beyond roadmap phases):** Built-in **CAN/ULC-S536** page-based form
  (sections through **23.3**), Contents outline rail, Calendar, Name Badges + PDF,
  startup lazy-load, window/app icon, repeatable extra form pages, 23.2 IDR
  cross-page row compaction.
- **Active:** Keep ULC form **template / document editor / PDF** consistent; density
  and layout polish on later pages (esp. 22.x / 23.x).
- **Next (roadmap):** Phase 7 — encrypted backup file + restore.
- **Not started:** license server (Phase 8), full packaging pipeline (Phase 9;
  icon asset exists), marketing site (Phase 10).

## Tech stack (ADR-0001)

Electron **v41** (pinned — native SQLCipher prebuild) + React + TypeScript +
Tailwind + Vite + electron-builder; **encrypted SQLite** via
`better-sqlite3-multiple-ciphers`; form PDF primarily via Chromium print-to-PDF
from shared React markup (`buildFormPrintHtml`); block-template PDF path also
exists. Windows-only for v1. Proprietary.

**Native module:** after `npm install`, `postinstall` → `scripts/rebuild-native.mjs`.
Do not bump Electron without a matching ABI prebuild.

## Key decisions (condensed)

- **Accounts & licensing** (ADR-0002, [`SECURITY.md`](SECURITY.md)): email accounts;
  activation keys; key X + DPAPI; SQLCipher; fail-open monthly check (stub client
  until Phase 8).
- **Document models** (ADR-0003 + form track):
  - **Custom templates:** JSON **block trees** (`src/shared/document/`).
  - **Built-in forms:** page/section/element model (`src/shared/form/`) — ULC S536.
    Template viewer, inspection editor, and PDF share one React path
    (`FormPageCanvas` → `FormElementView`). See
    [`FORM_ELEMENT_BLUEPRINT.md`](FORM_ELEMENT_BLUEPRINT.md).
- **UI/UX** ([`UX.md`](UX.md)): frameless chrome; sidebar includes Dashboard,
  Customers, Documents, Templates, **Calendar**, **Name Badges**, Database,
  Settings; Contents is a global right-edge rail for form outlines.

## Document map

| Doc | What it covers |
| --- | --- |
| [`PRD.md`](PRD.md) | Product requirements |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Process model, modules |
| [`DATA_MODEL.md`](DATA_MODEL.md) | SQLite / document sketches (may lag schema v11) |
| [`SECURITY.md`](SECURITY.md) | Activation, key model, login |
| [`TEMPLATES.md`](TEMPLATES.md) | Block template authoring / portability |
| [`FORM_ELEMENT_BLUEPRINT.md`](FORM_ELEMENT_BLUEPRINT.md) | **Required** for ULC form element work |
| [`BUILTIN_TEMPLATE_BUILD.md`](BUILTIN_TEMPLATE_BUILD.md) | Built-in template build notes |
| [`UX.md`](UX.md) | Window chrome, navigation |
| [`ROADMAP.md`](ROADMAP.md) | Phases 0–10 |
| [`adr/`](adr/) | ADRs 0001–0003 |

## Active work notes (2026-07) — ULC form & modules

### Built-in form (CAN/ULC-S536)

- Seeded as a **builtin** template; fill-in via `FormInspectionEditor`.
- Surfaces: `BuiltinFormViewer` / `FormInspectionEditor` / `buildFormPrintHtml.tsx`
  all go through `FormPageCanvas`.
- Shared logic under `src/shared/form/`; UI under `src/renderer/features/form/`;
  CSS mostly `src/renderer/theme/components.css` (print overrides in
  `buildFormPrintHtml.tsx`).
- Page meta headers: CFAA / branding logos with rem sizing aligned editor ↔ PDF.
- **Contents rail:** outline for Built-in + Custom Templates and Documents; duplicate
  repeatable labels merge to ranges (e.g. `Page x–y`) via `outline.ts`.

### Repeatable / extra pages (documents)

| Kind | Pages | Module |
| --- | --- | --- |
| Individual Device Record | **23.2** (min **3** pages) | `individualDeviceRecordPages.ts` |
| Power supply pair | **22.4 + 22.5** | `repeatableFormPages.ts` (`powerSupplies`) |
| Annunciator pair | **22.6 + 22.7** | `annunciatorPair` |
| Deficiencies | **20.2** | `deficiencies` |
| Ancillary device circuit | **22.10** | `ancillaryDeviceCircuitTest` |

Controls on `FormPageCanvas` (`pageExtraControls`); add/remove in document editor only
(MIN pages enforced).

### 23.2 Individual Device Record (hot)

- **`INDIVIDUAL_DEVICE_RECORD_ROW_COUNT = 22`** (was 19); shared constant for
  template / editor / PDF.
- Column/header polish: Measurement (singular), Alarm title wrapping, L/R padding on
  Alarm / Annunciator / Supervised; PDF extra top pad on Measurement header.
- **Cross-page row migration** (`migrateIndividualDeviceRecordRows.ts`):
  - Runs on document **open** (editor) and **load** (`inspections.ts` parse path).
  - Flattens all IDR pages → compact stream (max **1** blank between filled rows) →
    refill pages of 22 → **drop trailing empty IDR pages** above `MIN_PAGES` (3).
  - Idempotent; marks editor dirty when it changes so Save persists.
- Import helper: `scripts/import-idr.mjs` (app must be stopped).

### Other recent modules

- **Calendar** — month grid (`features/calendar/`).
- **Name Badges** — CRUD + PDF sheet (`features/nameBadges/`, schema v11
  `name_badges` table).
- **Startup** — auth shell first; lazy `App` + per-screen lazy imports; avoid
  heavy form/PDF modules until needed.
- **App icon** — `resources/app-icon.png`; set on `BrowserWindow` +
  `app.setAppUserModelId` in `src/main/index.ts`.

### Form conventions (do not break)

1. Read **`docs/FORM_ELEMENT_BLUEPRINT.md`** before adding/changing page elements.
2. Prefer one view component + shared CSS; avoid a parallel PDF-only layout.
3. Dev data only under project: `data/`, `.electron-dev/` (never user AppData in dev).
4. PowerShell: do not chain with `&&`.
5. Commit / push only when the user asks.

## Phase notes (as built) — short

| Phase | Status | Notes |
| --- | --- | --- |
| 0–1 | ✅ | Shell, frameless chrome, sidebar |
| 2 | ✅ | SQLCipher; clients; structured addresses |
| 3 | ✅ | Activate → password → login; multi-account; DPAPI; Settings login policy |
| 4 | ✅ | Block templates; builtin vs custom tables; seed lifecycle |
| 5 | ✅ | Inspections, cadence, dashboard reminders |
| 6 | ✅ | PDF export + embedded JSON re-import |
| 7+ | ❌ | Backups, license server, packaging, marketing |

**Dev paths:** DB/auth → `<project>/data/`; Electron userData → `.electron-dev/`.
Fresh test: delete `data/`, `npm run dev`, activate with `DEV-TEST-KEY`.

**IPC areas:** `auth.*`, `clients.*`, `templates.*`, `inspections.*`, `pdf` /
form print, `nameBadges.*`, settings/business profile, etc.

## Immediate next step

Continue **ULC form polish** unless the user switches to **Phase 7 backups**.
When touching 23.2 / repeatable pages, preserve compaction + min-page rules above.

## Conventions

- Docs are living drafts; significant decisions → **ADRs**.
- Keep this file current at the end of a work session.
- `branding/` and `sandbox/` are **gitignored** — never commit.
- Learning course (optional, local): `sandbox/learning/` — see `AGENTS.md`.
