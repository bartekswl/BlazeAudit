# ADR-0003: Document model & data portability

- **Status:** Accepted
- **Date:** 2026-06-06
- **Deciders:** SubraLab

## Context

BlazeAudit templates and inspections are **JSON block-trees stored inside the
encrypted database**, not human-readable files on disk. We need to confirm this is
the right model and decide how users:

- ship and reuse **default templates**;
- move templates/documents **between machines**;
- bring in **old/legacy data** without retyping it by hand;

all while keeping the app **offline-first** and free of per-use cost.

## Decision

- **Templates and inspections remain JSON block-trees stored in the DB.** They are
  not stored as loose files. (Reaffirms the [`DATA_MODEL.md`](../DATA_MODEL.md)
  document model.)
- **Generalized block model**: a single `table` block supports add/remove of both
  **rows and columns** (replacing the narrower `equipmentTable`), and a `lines`
  block provides "empty lines to write on". Plus a fixed **document header**
  (title, client relation, date, inspection type).
- **Default templates** are bundled with the app and **seeded into the DB on first
  run**.
- **Data portability** is provided via three offline mechanisms:
  1. **Template export/import to file** (JSON).
  2. A **JSON Schema export kit** (`schema.json` + `example.json` + a prompt
     README) the user can hand to an **external** AI/LLM to convert old PDFs into
     BlazeAudit-readable JSON, then import.
  3. **Embedded-JSON PDF round-trip**: every exported PDF embeds the document's
     JSON so BlazeAudit can re-import its own PDFs losslessly.
- **No OCR/AI/PDF-parsing of arbitrary documents inside the app.** Any AI
  extraction happens externally, at the user's discretion and cost.
- **Imports are validated** against the schema, with clear errors / a review step.

## Rationale

- DB storage keeps templates, clients, and inspections in one transactional,
  queryable, encrypted store — no loose files to lose or desync.
- A single generalized `table` and a `lines` block cover real fire-inspection
  paperwork (equipment grids, write-on areas) without special-casing.
- Exporting a **schema kit** lets users leverage any AI model they choose for
  one-off legacy migration, while the app itself stays offline and cost-free.
- **Embedded-JSON PDFs** give perfect round-tripping of BlazeAudit's own output
  with zero OCR.
- Keeping AI/OCR out of the app avoids ongoing API cost, internet dependence, and
  sending client data to third parties (GDPR).

## Alternatives considered

- **In-app OCR/AI import of arbitrary PDFs:** rejected for the app — unreliable on
  tables/handwriting, adds cost/internet/GDPR burden. Pushed outside via the schema
  kit.
- **Templates as loose JSON files on disk:** rejected as the primary store —
  weaker consistency and querying; file export/import is offered instead.
- **CSV/Excel import:** still possible later if legacy data turns out to be
  structured; not committed now.

## Consequences

- The app must publish and **version a JSON Schema** for the document model and
  keep it in sync as block types evolve (`schemaVersion` drives migration).
- The PDF exporter must embed (and the importer extract) the document JSON.
- Import requires robust **validation + a review/correct path** for imperfect
  external JSON.
- Detailed design lives in [`../TEMPLATES.md`](../TEMPLATES.md); schema shapes in
  [`../DATA_MODEL.md`](../DATA_MODEL.md).
