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
- Visual editor for the document structure:
  - Add and remove blocks/components.
  - Insert an **equipment table** and add/remove its rows.
  - Add/remove lines within list/checklist blocks.
  - Reorder blocks.
  - Toggle/show-hide optional sections.
- Templates are versioned conceptually (editing a template does not retroactively
  change existing inspections).

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

### 6.4 PDF export

- Export a completed inspection to a branded PDF.
- Include SubraLab/company branding and inspection metadata.
- Preserve tables, checklists, and signatures in the output.

### 6.5 Data & storage

- All data persisted locally (SQLite database file).
- No network access required for any core feature.
- Sensible default storage location; database file excluded from version control.

## 7. Non-functional requirements

- **Offline:** zero required network calls for core features.
- **Performance:** editor and PDF export responsive on typical office hardware.
- **Reliability:** local data must not be lost on crash; saves are durable.
- **Security:** local-only data; secure Electron configuration (context isolation,
  no remote module, restricted preload bridge).
- **Distribution:** one-click Windows installer + standalone/portable build.
- **Maintainability:** TypeScript, linting/formatting, documented architecture.

## 8. Companion marketing website

A simple showcase website will accompany the product:

- Product overview and key features.
- Screenshots / visuals.
- Contact information.
- Download / "get in touch" call to action.

Tracked separately in the roadmap; details in [`ROADMAP.md`](ROADMAP.md).

## 9. Success criteria

- A user can: create a template → add a client → run an inspection → export a PDF,
  entirely offline.
- The app installs and runs on Windows from a single installer.
- Documentation is sufficient for a new developer to build and run the project.

## 10. Open questions

- What standard fire-inspection template(s) should ship as defaults?
- What specific branding assets (logo, colors) will SubraLab provide?
- Are there regulatory PDF formatting requirements to match?
- Should templates be importable/exportable as files for sharing between machines?
