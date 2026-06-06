# BlazeAudit — Product Requirements Document (PRD)

| | |
| --- | --- |
| **Product** | BlazeAudit |
| **Owner** | SubraLab |
| **Status** | Draft (Phase 0) |
| **Last updated** | 2026-06-05 |

## 1. Summary

BlazeAudit is an **offline-first Windows desktop application** for fire-protection
professionals to create, manage, and export fire inspection documentation. Users
build reusable **templates**, maintain a **client/site database**, perform
**inspections** based on templates, and **export completed inspections to PDF**.

It draws inspiration from fire-forms.com but is deliberately narrower: a focused,
local tool rather than a cloud SaaS.

## 2. Goals

- Let users build and reuse fire-inspection document templates.
- Provide a visual editor to customize document structure: add/remove components,
  insert equipment tables, add/remove rows and lines, toggle sections.
- Maintain a local client database (add / edit / store).
- Create and store inspections per client, based on templates.
- Export inspections to clean, branded PDFs.
- Work fully offline, with all data stored locally.
- Ship as an easy-to-install Windows installer and a standalone build.

## 3. Non-goals (explicitly out of scope, at least initially)

- Cloud sync, multi-tenant accounts, or online collaboration.
- Mobile applications (iOS/Android).
- Payments, scheduling, dispatch, or CRM features.
- e-signature / legal signing workflows beyond a simple signature field.
- Cross-platform builds (macOS/Linux) — Windows only for v1.
- Integration with third-party fire-code databases or external APIs.

## 4. Target users

- Fire inspectors / fire-protection technicians.
- Small fire-protection companies that need consistent paperwork and PDF reports.

## 5. Core concepts

- **Template** — a reusable definition of a fire-inspection document, expressed as
  a structured tree of typed **blocks** (heading, text field, checklist, equipment
  table, signature, etc.).
- **Block** — a single editable unit within a document (see
  [`DATA_MODEL.md`](DATA_MODEL.md)).
- **Client / Site** — an entity that inspections are performed for.
- **Inspection** — an instance of a template, attached to a client, filled with
  data and exportable to PDF.

## 6. Functional requirements

### 6.1 Templates

- Create, edit, duplicate, and delete templates.
- A fixed **document header** on every template/inspection: **title**, **client**
  (a relation to the client DB; address auto-fills), **inspection date**, and
  **inspection type**.
- Visual editor for the document body:
  - Add and remove blocks/components.
  - Insert a **table** and add/remove its **rows and columns**.
  - Add/remove **checklist** lines; set **write-on lines** (`lines` block).
  - Reorder blocks.
  - Toggle/show-hide optional sections.
- Templates ship **pre-loaded** with blocks but are fully customizable.
- **Default templates** ship with the app and are seeded into the DB on first run.
- **Export/import** a template to/from a **JSON file** (for sharing/reuse).
- **JSON Schema export kit** (`schema.json` + `example.json` + prompt) so users can
  have an **external** AI/LLM convert old documents into BlazeAudit-readable JSON
  for import. The app performs no in-app OCR/AI; imports are validated against the
  schema with a review/correct step.
- Templates are versioned conceptually (editing a template does not retroactively
  change existing inspections).
- Full design: [`TEMPLATES.md`](TEMPLATES.md) and
  [`adr/0003-document-model-portability.md`](adr/0003-document-model-portability.md).

### 6.2 Clients

- Add, edit, view, and delete clients/sites.
- Store contact and site details (name, address, contact person, phone, email,
  notes).
- View a client's inspection history.

### 6.3 Inspections

- Create an inspection for a client from a template.
- Fill in fields, complete tables and checklists.
- Save drafts and revisit/edit later.
- Store an inspection date, status, and inspector name.
- Record a **cadence** (e.g. monthly/quarterly/annual/custom); the app derives the
  **next-due date** and shows **due/overdue reminders** on a dashboard at launch
  (offline). OS notifications while the app is closed are an optional later add-on.

### 6.4 PDF export

- Export a completed inspection to a branded PDF.
- Include SubraLab/company branding and inspection metadata.
- Preserve tables, checklists, and signatures in the output.
- **Embed the document JSON inside the exported PDF** so BlazeAudit can re-import
  its own PDFs losslessly (offline round-trip; see [`TEMPLATES.md`](TEMPLATES.md) §3.3).

### 6.5 Data & storage

- All data persisted locally in an **encrypted** SQLite database file (SQLCipher).
- No network access required for any core feature (see 6.6 for the one-time and
  periodic exceptions tied to licensing).
- Sensible default storage location; database file excluded from version control.

### 6.6 Accounts, activation & licensing

- Each user has an **account identified by email**.
- An install is authorized by a **single-use activation key** (issued by SubraLab),
  bound to a unique **instance id**; **one active instance per account**.
- **Activation is online and one-time**; the app is otherwise offline.
- A **local password login** protects access on each launch (offline).
- A **monthly opportunistic online check** validates the key/instance when a
  connection exists, enabling **remote deactivation** of unauthorized installs.
- Enforcement is **fail-open**: the app locks only on a verified revocation, never
  because the SubraLab server is unreachable or faulty.
- Full design: [`adr/0002-accounts-activation-licensing.md`](adr/0002-accounts-activation-licensing.md)
  and [`SECURITY.md`](SECURITY.md).

### 6.7 Backups & recovery

- The app produces a **single, lightweight encrypted backup file** automatically
  (every few weeks), on demand, and automatically before any lockout.
- The user copies the backup offsite manually (e.g. Google Drive); the app does
  not upload data.
- **Recovery**: SubraLab reissues a key for the same email; the app re-provisions
  the same encryption key, so the user's old backup opens on a fresh install.
- Data is recoverable by **account**, but SubraLab cannot read inspection contents
  (data never leaves the user's machine).

## 7. Non-functional requirements

- **Offline:** no required network calls for core features; only one-time
  activation and a monthly licensing check use the network.
- **Performance:** editor and PDF export responsive on typical office hardware.
- **Reliability:** local data must not be lost on crash; saves are durable; a
  backup is written automatically before any enforced lockout.
- **Security:** data encrypted at rest (SQLCipher); the encryption key is stored
  via Windows DPAPI and wrapped by the local password; secure Electron
  configuration (context isolation, no remote module, restricted preload bridge).
- **Privacy / compliance:** accounts + telemetry are personal data and must meet
  **GDPR** obligations (privacy notice, lawful basis, retention).
- **Resilience:** licensing is **fail-open** — server downtime never bricks a
  legitimate install.
- **Distribution:** one-click Windows installer + standalone/portable build.
- **Maintainability:** TypeScript, linting/formatting, documented architecture.

## 8. Companion marketing website & license server

A simple showcase website will accompany the product:

- Product overview and key features.
- Screenshots / visuals.
- Contact information.
- Download / "get in touch" call to action.

**Co-hosted with the website** is a small **license/admin server**:

- Issues and validates activation keys; deactivates instances.
- Stores accounts, keys, instances, escrowed encryption keys, and basic telemetry
  (never inspection data).
- Provides a simple **admin front end** to activate users and view account data.

Tracked separately in the roadmap; details in [`ROADMAP.md`](ROADMAP.md) and
[`SECURITY.md`](SECURITY.md).

## 9. Success criteria

- A user can: create a template → add a client → run an inspection → export a PDF,
  entirely offline.
- The app installs and runs on Windows from a single installer.
- Documentation is sufficient for a new developer to build and run the project.

## 10. Open questions

- What standard fire-inspection template(s) should ship as defaults?
- What specific branding assets (logo, colors) will SubraLab provide?
- Are there regulatory PDF formatting requirements to match?
- Which exact default templates ship with v1?
- Where will the license/admin server be hosted (own VPS, serverless, or a managed
  service such as Keygen)? Kept open behind the license-client contract.
- What exact telemetry fields are collected, and what is the data-retention period
  (input to the GDPR privacy notice)?

### Resolved

See ADR-0002 / [`SECURITY.md`](SECURITY.md):

- **Access control:** email accounts + single-use activation keys, one active
  instance per account.
- **Data-at-rest:** SQLCipher encryption with a server-escrowed per-account key.
- **Backup & recovery:** single local encrypted file + recovery via key reissue.

See ADR-0003 / [`TEMPLATES.md`](TEMPLATES.md):

- **Template portability:** yes — JSON file export/import, a JSON Schema export kit
  for external AI migration, and an embedded-JSON PDF round-trip.
