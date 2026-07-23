# Built-in template build playbook

Living document — update this file **every time** we add or change a built-in template so future work follows the same pattern.

**Status:** Page-based form model (`schemaVersion: 2`) — prototype seed `form-prototype` ships with shell + demo section.

---

## Architecture

### Three layers

1. **Sources** — canonical data in DB (`clients`, `business_profile`, `inspectors`, `inspections`, `builtin_templates`).
2. **DocumentContext** — merged view at render/PDF time (`src/shared/document/context.ts`), loaded via `resolveDocumentContext()` in main.
3. **Bindings** — dot-paths like `client.name`, `template.code` used in form regions and elements.

User-entered content for built-in forms stays in `FormInspectionDocument.values` (keyed by element id). Bound fields are **not** copied into the form JSON.

### Page-first form model

Built-in templates store a **FormDefinition** (not a block tree):

```
FormDefinition
├── disclaimer          # footer line on every page
└── pages[]
    ├── regions[]       # top-to-bottom % slots (e.g. 5% code, 5% title)
    └── sections[]      # numbered blocks with compact elements
        └── elements[]  # table | checklist | text | signature | …
```

Custom templates still use block `Document` (`schemaVersion: 1`) until a later migration.

### Built-in template metadata

| Field | Role | Example |
|-------|------|---------|
| `seedId` | Stable sync key on unlock — unique among bundled seeds | `form-prototype` |
| `name` | Short admin / picker label | Form prototype |
| `code` | Reference id in header regions (`template.code`) — **not required unique** | PROTOTYPE-001 |
| `title` | Formal report title (`template.title`, line 2 on page 1) | Built-in form prototype… |
| `description` | List subtitle in Templates UI | … |
| `document` (DB column) | `FormDefinition` JSON (`schemaVersion: 2`) | `{ pages: [...] }` |

The DB column is still named `document` for compatibility; it holds form JSON for built-ins.

### Page chrome (automatic)

Every page render (UI + PDF) includes:

| Zone | Height | Content |
|------|--------|---------|
| **Body** | Regions + sections ≤ 95% of page | Your layout |
| **Footer** | Fixed ~5% | Left: `disclaimer` · Right: `Page X of Y` |

Regions use `heightPercent` of the printable body (footer excluded).

### Connections (capacity)

```
Inspection ──clientId──► Client (client.* bindings)
          ──templateKind/id──► Template metadata (template.* bindings)
          ──inspector (string)──► Inspector (inspector.*)
BusinessProfile (singleton) ── business.*
```

Form **definition** is snapshotted at inspection create (`FormInspectionDocument.form`). Template **metadata** (code, title, name) resolves live via `template_kind` + `template_id`.

---

## File map

| What | Where |
|------|--------|
| **Form element blueprint (read first for new elements)** | **`docs/FORM_ELEMENT_BLUEPRINT.md`** |
| Form types + validation | `src/shared/form/types.ts`, `validate.ts`, `layout.ts` |
| Form seeds | `src/shared/form/seeds/<seed-id>.ts` |
| Seed registry | `src/shared/document/defaults.ts` → `DEFAULT_TEMPLATE_SEEDS` |
| Binding resolver (forms) | `src/shared/form/resolveBinding.ts` |
| Context loader | `src/main/db/resolveDocumentContext.ts` |
| DB: built-in rows | `src/main/db/builtinTemplates.ts` |
| Sync on unlock | `src/main/db/seedTemplates.ts` |
| Built-in viewer UI | `src/renderer/features/form/BuiltinFormViewer.tsx`, `FormPageCanvas.tsx` |
| Inspection fill-in (form) | `src/renderer/features/documents/FormInspectionEditor.tsx` |
| **PDF export (primary — matches UI)** | `src/renderer/features/form/buildFormPrintHtml.ts` → `exportInspectionPdf.ts` |
| PDF export (fallback HTML) | `src/main/pdf/renderFormHtml.ts` |
| PDF export (legacy blocks) | `src/main/pdf/renderInspectionHtml.ts` |
| PDF router | `src/main/pdf/renderInspectionHtmlForExport.ts` |
| Composite elements | `ulcSection1`, `yesNoSummary` — see blueprint |

---

## Standard workflow — adding a new built-in form

Use this checklist for **each** new form. Copy the section template at the bottom into **Built templates log** when done.

### 1. Define metadata + seed file

Create `src/shared/form/seeds/<seed-id>.ts` exporting `FormDefinition` and seed id constant.

Add one entry to `DEFAULT_TEMPLATE_SEEDS` in `defaults.ts`:

```typescript
{
  seedId: 'your-stable-id',
  name: 'Short picker label',
  code: 'FORM-1',
  title: 'Full formal report title',
  description: 'One line for the templates list.',
  form: yourFormDefinition(),
}
```

### 2. Build the form page-by-page

Work **one page at a time** with the product owner:

1. Start with page shell only: `disclaimer`, header regions (`template.code`, `template.title` at agreed %).
2. Unlock app → verify **Built-in Templates** viewer + PDF proportions.
3. Add numbered sections with `heightPercent` and compact elements (table, checklist, text, signature).
4. Export PDF after each element; adjust % and CSS until it matches the reference screenshot.

**Do not** hardcode client or company names in the form JSON; use bindings (`client.*`, `business.*`, `inspector.*`) on `text` elements or `variable` regions.

### 3. Unlock / sync

Run the app and unlock the DB. `seedDefaultTemplates()` inserts or updates the row and prunes retired `seedId`s.

### 4. Verify in UI

- **Built-in Templates** — appears with code, description, page count, element count.
- Open viewer — paper-shaped page canvas with footer preview.
- **New inspection** — appears in template picker as `(Built-in)`.
- Fill-in uses the same `FormPageCanvas` as the viewer.
- **Export PDF** — matches UI proportions and footer.

### 5. Add new element types (only when needed)

**Read `docs/FORM_ELEMENT_BLUEPRINT.md` first** — it has the full checklist, design tokens, and anti-patterns.

If a page needs a shape the renderer does not support yet:

1. Extend `FormElement` in `src/shared/form/types.ts`.
2. Add validation in `validate.ts` (if needed).
3. React view in `FormElementView.tsx` + shared module + `components.css` (with dark theme).
4. Optional fallback HTML in `renderFormHtml.ts`.
5. Add empty value factory in `values.ts` if the element is fillable.
6. Verify **template · document · PDF** before moving on.

### 6. Update this doc

Append to **Built templates log** with seedId, pages, bindings used, PDF quirks, and reuse notes.

---

## Binding registry

Full list: `BINDING_PATH_LABELS` in `src/shared/document/context.ts`.

Common groups:

- **Template:** `template.code`, `template.title`, `template.name`, `template.inspectionType`
- **Client:** `client.name`, `client.contactName`, `client.phone`, `client.addressFormatted`, …
- **Inspection:** `inspection.title`, `inspection.inspector`, `inspection.inspectedAt`, …
- **Business:** `business.businessName`, `business.addressFormatted`, …
- **Inspector:** `inspector.name`, `inspector.licenseNumber` (when linked)

Region example (page 1 header):

```typescript
{
  id: 'header-code',
  heightPercent: 5,
  content: { kind: 'variable', binding: 'template.code', align: 'center' },
}
```

---

## Phased rollout

| Phase | Done? | Notes |
|-------|-------|-------|
| Form types (`schemaVersion: 2`) | ✅ | `src/shared/form/` |
| DB: built-in stores `FormDefinition` | ✅ | `builtinTemplates.ts` |
| `resolveDocumentContext()` | ✅ | `src/main/db/resolveDocumentContext.ts` |
| Page shell UI | ✅ | `FormPageCanvas`, `BuiltinFormViewer` |
| Form PDF renderer | ✅ | `buildFormPrintHtml.ts` (primary); `renderFormHtml.ts` (fallback) |
| Inspection snapshot + fill-in | ✅ | `FormInspectionEditor` |
| Element blueprint doc | ✅ | `docs/FORM_ELEMENT_BLUEPRINT.md` |
| Prototype seed | ✅ | `form-prototype` — ULC 20.1 + Summary table |
| Real production form (e.g. ULC) | 🔄 | Page-by-page with owner |
| Custom templates on form model | ⬜ | Future |

---

## Decisions log

| Date | Decision |
|------|----------|
| 2026-06-06 | Split `builtin_templates` / `custom_templates`; registry for cross-type ops. |
| 2026-06-06 | Cleared all bundled seeds; build new built-ins incrementally. |
| 2026-06-06 | `code` does **not** need to be unique — internal use only. |
| 2026-06-06 | Client/business/inspector via bindings; resolve at render. |
| 2026-06-06 | ULC 536 20.1 block attempt removed — replaced by page-first form model. |
| 2026-06-06 | Page → Section → Element; % layout; auto footer (disclaimer + page X of Y). |
| 2026-06-06 | Authoring via TypeScript seeds, not in-app designer (v1). |
| 2026-06-21 | Three-surface form elements: one React view + `components.css`; PDF via `buildFormPrintHtml`. See `FORM_ELEMENT_BLUEPRINT.md`. |

---

## Built templates log

### Form prototype (`form-prototype`)

- **Code:** PROTOTYPE-001
- **Title:** Built-in form prototype — page shell
- **Added:** 2026-06-06 · **Updated:** 2026-06-21
- **Pages:** 1 — 5% `template.code`, 5% `template.title`, section 20.1 ULC header (`ulcSection1`), Summary Yes/No table (`yesNoSummary`)
- **Bindings used:** `template.code`, `template.title`; business/client via ULC bindings
- **PDF notes:** Primary export via `buildFormPrintHtml` (SSR + live CSS); panel outer frame 2pt in print overrides; section gap 0.375rem
- **Reuse notes:** Follow `docs/FORM_ELEMENT_BLUEPRINT.md` for every new composite element

### Portable Extinguishers (`portable-extinguishers`)

- **Code:** EXT-ANNUAL
- **Title:** Annual Portable Extinguishers Inspection Report
- **Added:** 2026-07-21
- **Pages:** 2 — cover (`portableExtinguisherCover`) with client/business bindings + notes; Fire Extinguisher Test Record working grid (`fireExtinguisherTestRecord`)
- **Bindings used:** `template.code`, `template.title`, `client.name`, `client.addressFormatted`, `business.*`, inspector name seed
- **PDF notes:** Primary via `buildFormPrintHtml`; `.irc-panel` / `.rrg-panel` in print frame list
- **Reuse notes:** Shared `reportRecordGrid` + `FormReportRecordGridView` for working tables

### Emergency Lighting (`emergency-lighting`)

- **Code:** EL-ANNUAL
- **Title:** Emergency Lighting Inspection Report
- **Added:** 2026-07-21
- **Pages:** 3 — cover with cert checkboxes + static test notes; comments/recommendations lined notes + Device Legend; Inspection Record grid (crossed-out paper columns omitted)
- **Bindings used:** same client/business pattern as portable extinguishers
- **PDF notes:** same panel frame treatment as extinguisher forms
- **Reuse notes:** Device legend + inspection record use shared report grid

### Template section template (copy when adding)

```markdown
### [Picker name] (`seedId`)

- **Code:** …
- **Title:** …
- **Added:** YYYY-MM-DD
- **Pages:** N — brief layout notes per page
- **Bindings used:** template.code, client.name, …
- **PDF notes:** proportions, landscape pages, …
- **Reuse notes:** patterns worth copying for the next template
```

---

## Next step

Review prototype page shell in UI + PDF with owner. Then specify real page 1 sections and % for the first production form.
