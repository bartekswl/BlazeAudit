# Form element blueprint — template · document · PDF

**Point the agent here** whenever we add or change a built-in form page element (ULC-style panels, summary tables, similar composite blocks).

Goal: **one look, one layout, three surfaces** — built-in template viewer, inspection document editor, and PDF export must always match.

---

## Golden rule

> **One React component + one CSS source.**  
> Template (read-only), document (editable), and PDF (read-only SSR) all render through `FormPageCanvas` → `FormElementView` → your view component.

| Surface | How it renders |
|---------|----------------|
| **Template** | `BuiltinFormViewer` → `FormPageCanvas` (`readOnly`) |
| **Document** | `FormInspectionEditor` → `FormPageCanvas` (editable) |
| **PDF export** | `buildFormPrintHtml()` → `renderToStaticMarkup(<FormPageCanvas readOnly />)` + live CSS + tiny print overrides |

Do **not** hand-maintain a parallel PDF layout unless you are only adding a **fallback** path in `renderFormHtml.ts` (used when prebuilt HTML is not passed). The primary export path is renderer-built HTML.

---

## When to add a dedicated element type

| Use a **dedicated** `FormElement` kind | Use a **generic** element |
|----------------------------------------|---------------------------|
| Custom grid / panel layout (ULC 20.1 header) | Single bound text line |
| Styled multi-column table (Yes / No / Summary) | Simple checklist (Pass/Fail) |
| Domain-specific bindings + normalization | Generic table with columns |
| Non-trivial PDF border/print behaviour | Signature block |

**Reference implementations:**

- `ulcSection1` — composite inspection header panel (`.ulc-s1-*`)
- `yesNoSummary` — Yes / No / Summary checklist table (`.yns-*`)
- `affirmation` — Affirmation paragraph + technician signature grid (`.aff-*`)
- `deficiencies` — Split inspection/repair deficiencies table (`.def-*`)
- `recommendations` — 20.3 lined table with green header bar (`.ln-panel--green`)
- `testingNotes` — Technician's testing notes with blue header bar (`.ln-panel--blue`)
- `attendanceLog` — 20.4 Technician Attendance Log grid (`.att-*`)

---

## Visual design system (form page)

All composite elements on a letter page share the same “form panel” language:

| Token | Value | Notes |
|-------|-------|-------|
| Inner cell line | `1px solid rgb(148 163 184 / 0.45)` | CSS var: `--ulc-line` / `--yns-line` / `--aff-line` / `--def-line` / `--ln-line` / `--att-line` |
| **Outer panel frame** | **`1.5px solid #000000`** | CSS var: `--form-panel-frame` on `.form-page-sheet` — applies to **all** composite panels |
| Panel radius | `0.625rem` | Rounded outer frame |
| Panel shadow | **none** on `.form-page-sheet` panels | Avoid gray/blue bands between stacked panels |
| Label header bg | `linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%)` | Text `#334155` — not black |
| Body text | `var(--ba-text-primary)` | Never hardcode `#171717` without dark pair |
| Page top → code | `padding-top: 1.75rem` on `.form-page-body` | Space above template code line |
| Section gap | `1.5rem` on `.form-page-content` | **Even** gap between all stacked panels |
| Section title → panel | `margin-bottom: 0.75rem` on `.form-page-section-title` | e.g. “20.1 …” heading → ULC panel |
| ULC section height | **`minHeight`** % | Never `maxHeight` — prevents PDF overlap |
| PDF outer frame | **`2pt solid #000000`** | Print-only — same black frame on every composite panel |
| PDF inner lines | `0.5px solid #64748b` | Print-only; fixes Chromium dropped borders |
| Row dividers | Single thin line | No thick gray separator bands between rows |

### Outer frame (all composite panels)

Every built-in form panel on `.form-page-sheet` shares one thick **black** outer edge. Inner grid lines stay thin slate.

| Surface | Selector | Outer border |
|---------|----------|--------------|
| Screen (template + document) | `.form-page-sheet` sets `--form-panel-frame` | `1.5px solid #000000` |
| Applied to | `.ulc-s1-panel`, `.yns-table-wrap`, `.aff-panel`, `.def-grid`, `.def-compliance`, `.ln-panel`, `.att-table-wrap` | via `border: var(--form-panel-frame)` |
| PDF export | `PRINT_OVERRIDES` in `buildFormPrintHtml.tsx` | `2pt solid #000000 !important` on the same selectors |

Do **not** use the thin `--*-line` variable for the outer panel perimeter — that is for inner cells only.

Inner grid lines use **single-edge borders** only (`border-right` + `border-bottom` per cell, never full `border` on adjacent cells) so shared edges do not stack to double thickness. Exceptions: deficiencies **inspect/repair split** (`.def-grid-left` `2px`) and **device/control divider** (`.def-section-divider` `2px` top).

**ULC PDF corners:** use **`box-shadow: inset 0 0 0 2pt #000`** instead of `border` on `.ulc-s1-panel` — Chromium print breaks rounded bottom corners with `border` + `overflow: hidden`.

### Affirmation block (`.aff-*`) — defaults

When building or editing the **affirmation** element, apply these without being asked again:

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** — same black edge as all form panels (see above) |
| Gray body (long text) | **Center text vertically and horizontally** — `.aff-body { display: flex; align-items: center; justify-content: center; text-align: center; }` |
| Body padding | Comfortable padding above/below paragraph (`~0.625rem` vertical) |
| Technician field rows | **2× standard cell height** (`--aff-field-row-height: 3.5rem`) for white input rows only; label bars stay compact |
| Column widths | Technician **narrow**, ID **medium-narrow**, Date **wide**, Signature flexible — tune via grid `fr` / `minmax` on `.aff-fields` / `.aff-labels` |
| Field cell alignment | ID + Date values **centered** vertically and horizontally in their cells; inspector select / name has **left padding** (`~0.875rem`); first-column label bars match |
| Page count in text | Inline with normal single spaces — **not** a wide fill-in box |
| Inspector names | Dropdown from Settings → Inspectors; ID auto-filled from license/certificate number (read-only) |
| Dates | Default to inspection date; editable via `InspectionDateField` |
| Signature cells | **No** company-name placeholder overlay |

### Deficiencies block (`.def-*`) — defaults

When building or editing the **deficiencies** element (page 2, landscape), apply these without being asked again:

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.def-grid` and `.def-compliance` |
| Panel frame | **`border-radius: 0.625rem`** + `overflow: hidden` on `.def-grid` — same rounded panel language as `.yns-table-wrap` / `.aff-panel` |
| Compliance footer | Same **`0.625rem`** radius on `.def-compliance` (blue box) |
| Layout | **Single CSS grid** (`.def-grid`) — left/right cells share one row so header rows stay level across the split |
| Right-side headers | **Two** repair column-header rows — one above device rows, one above control rows (never an empty peach placeholder) |
| Banner rows | **`min-height: 2rem`** — green (inspect) + peach (repair) instruction text |
| Column header rows | **`min-height: 1.75rem`** — multi-line labels must not clip |
| Item # column | **`7%`** (`--def-col-item`) |
| ULC 536 column | **`18%`** (`--def-col-ulc`) — narrower; extra width to Deficiency |
| Section divider | **`2px solid #171717`** between device block and control block (`.def-section-divider`) |
| Compliance text → fields | **Tight gap** — `margin-bottom: 0.125rem` on `.def-compliance-text` |
| Date fields | Same label + control structure as Printed Name / Signature; date boxes **`1.625rem × 1.25rem`**, aligned with signature input row |

### Lined notes tables (`.ln-*`) — defaults

Page 3 portrait — **20.3 Recommendations** (`recommendations`) and **Technician's Testing Notes** (`testingNotes`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.ln-panel` |
| Panel frame | **`border-radius: 0.625rem`** + `overflow: hidden`; **`display: flex`** column, **`flex: 1`** on page 3 |
| Header bar | Solid strip only — **green** `#1b6b2f` (recommendations), **blue** `#1e3a8a` (testing notes); `min-height: 0.625rem` |
| Body | **Single** `.ln-body` text; **`.ln-row`** divs with `border-bottom` (PDF-safe); editor clamps to **visible row count** (no scroll past last line) |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) in template + document viewport — same visual size as other portrait pages; **never** content-hug height |
| Panel split | Recommendations **10** : Testing notes **18** flex-grow — fills body between `codeNameMeta` header and page footer |
| Section titles | In `.form-page-section-title` above each panel — not inside the colored bar |
| Page header | **`codeNameMeta`** — same Code–Name + building table as page 2 |
| Value shape | `string` (legacy `string[]` rows joined with `\n` on read) |

### Attendance log table (`.att-*`) — defaults

Page 4 portrait — **20.4 Technician Attendance Log** (`attendanceLog`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.att-table-wrap` |
| Panel frame | **`border-radius: 0.625rem`** + `overflow: hidden`; **`display: flex`** column, **`flex: 1`** on page 4 |
| Accent bar | Slate gradient header strip (same as `.yns-th--summary`) — **not** blueprint red/black |
| Table | **7 columns**, **28 fixed rows**; `table-layout: fixed`; column widths in `ATTENDANCE_LOG_COLUMNS` |
| Row height | `tbody tr` use `height: 1%` so rows share remaining body evenly |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) in template + document viewport |
| Section title | **20.4 Technician Attendance Log** in `.form-page-section-title` above the table |
| Value shape | `{ rows: AttendanceLogRow[] }` — always normalized to 28 rows |

### ULC 20.1 panel (`.ulc-s1-*`) — defaults

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** — black edge; inner cells use `--ulc-line` only |

### Yes / No / Summary table (`.yns-*`) — defaults

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** — black edge; inner cells use `--yns-line` only |

### Dark theme (required)

Every new composite element **must** include a `[data-theme='dark']` block in `components.css` for:

- panel background and `--*-line` border color  
- label/header gradients and text  
- cell tint backgrounds (Yes green / No red columns, etc.)  
- fill-in underlines and input text  

Template viewer and document editor both respect `data-theme` on `<html>`. PDF export forces `data-theme="light"`.

### Spacing between stacked panels

```css
.form-page-body {
  padding: 1.75rem 1.25rem 0; /* top → template code */
}
.form-page-content {
  gap: 1.5rem; /* even spacing between ULC, Summary, Affirmation, … */
}
.form-page-section-title {
  margin-bottom: 0.75rem; /* “20.1 …” → first panel */
}
.form-page-content > .form-page-section + .form-page-section {
  padding-top: 0;
}
.form-page-sheet .ulc-s1-panel,
.form-page-sheet .yns-table-wrap,
.form-page-sheet .aff-panel,
.form-page-sheet .def-grid,
.form-page-sheet .def-compliance,
.form-page-sheet .ln-panel,
.form-page-sheet .att-table-wrap {
  box-shadow: none;
  outline: none;
  border: var(--form-panel-frame);
}
```

Do not add a **section heading** above a table that already has its own column headers (e.g. don’t show “Summary” above a Yes/No/Summary table).

When changing page spacing, update **both** `components.css` and `PRINT_OVERRIDES` in `buildFormPrintHtml.tsx` so PDF stays in sync. **PDF export uses half the on-screen section gap** (`0.75rem` print vs `1.5rem` screen) to fit the letter page.

### Viewport scaling (template + document editor)

The form page uses **dynamic reference width**: at scale `1` the sheet fills the column. When the Contents rail opens, the whole page **zooms out uniformly** via CSS `zoom`. **Page 1** portrait sheets hug content height; **page 3** (`form-page-sheet--lined-notes`), **page 4** (`form-page-sheet--attendance-log`), and **page 2** landscape always keep fixed **A4** aspect ratio. PDF export is unaffected.

---

## Implementation checklist (copy per element)

Use this list every time. Check off in the PR / session notes.

### 1. Schema & values

- [ ] Extend `FormElement` union in `src/shared/form/types.ts`
- [ ] Add value type(s) + item config types if needed
- [ ] `src/shared/form/<name>.ts` — `empty*`, `normalize*`, setters, optional seed item constants
- [ ] `initialValueForElement()` in `src/shared/form/values.ts`
- [ ] Export from `src/shared/form/index.ts`

### 2. React view (single source of truth)

- [ ] `src/renderer/features/form/Form<Name>View.tsx`
- [ ] Support `readOnly` (template + PDF) and editable mode (document)
- [ ] Wire in `FormElementView.tsx` (`case` + `flushFrame` if full-bleed panel)
- [ ] **Editable UX:** make whole click targets (e.g. full Yes/No cell = `<label>` + `cursor: pointer`)

### 3. CSS (structure + theme)

- [ ] Add prefixed rules to `src/renderer/theme/components.css` (e.g. `.yns-*`, `.ulc-s1-*`)
- [ ] Scope print-color-adjust on `.form-page-sheet .your-panel *` if colors must survive PDF
- [ ] Add **`[data-theme='dark']`** overrides for every hardcoded light color
- [ ] No `box-shadow` on panels inside `.form-page-sheet`

### 4. PDF

- [ ] Primary path: **no change needed** if view + CSS are correct — `buildFormPrintHtml` picks up live CSS
- [ ] Add **minimal** rules to `PRINT_OVERRIDES` in `src/renderer/features/form/buildFormPrintHtml.tsx` only for:
  - Letter page sizing (already global)
  - Chromium border dropout (solid lines, `print-color-adjust: exact`)
  - Section stacking / gap if PDF still overlaps
  - Bold outer frame (`2pt`) if panel border prints too light
- [ ] Optional fallback: `src/shared/form/<name>Html.ts` + case in `src/main/pdf/renderFormHtml.ts`

### 5. Seed & sync

- [ ] Add element to seed in `src/shared/form/seeds/<seed-id>.ts`
- [ ] Keep page % budget ≤ 95% body (+ 5% footer)
- [ ] Unlock app to sync built-in template row
- [ ] Verify **all three surfaces** after each change

### 6. Verify (mandatory)

- [ ] Built-in template viewer — layout, dark theme, read-only values/bindings  
- [ ] New/open inspection — fill-in works, autosave, full-cell clicks  
- [ ] Export PDF — same spacing, borders, colors; no overlap between sections  
- [ ] Toggle dark theme in Settings — no broken backgrounds or invisible text  

---

## File map (current)

| Layer | Path |
|-------|------|
| Types | `src/shared/form/types.ts` |
| Values | `src/shared/form/values.ts` |
| ULC logic | `src/shared/form/ulcSection1.ts`, `ulcSection1Html.ts` |
| Summary logic | `src/shared/form/yesNoSummary.ts`, `yesNoSummaryHtml.ts` |
| Affirmation logic | `src/shared/form/affirmation.ts`, `affirmationHtml.ts` |
| React views | `src/renderer/features/form/FormUlcSection1View.tsx`, `FormYesNoSummaryView.tsx`, `FormAffirmationView.tsx` |
| Element router | `src/renderer/features/form/FormElementView.tsx` |
| Page shell | `src/renderer/features/form/FormPageCanvas.tsx` |
| Template viewer | `src/renderer/features/form/BuiltinFormViewer.tsx` |
| Document editor | `src/renderer/features/documents/FormInspectionEditor.tsx` |
| Styles | `src/renderer/theme/components.css` |
| PDF (primary) | `src/renderer/features/form/buildFormPrintHtml.ts` |
| PDF (export IPC) | `src/main/pdf/exportInspectionPdf.ts` |
| PDF (fallback HTML) | `src/main/pdf/renderFormHtml.ts` |
| Seeds | `src/shared/form/seeds/*.ts`, registry in `src/shared/document/defaults.ts` |

---

## Anti-patterns (learned the hard way)

| Don’t | Do instead |
|-------|------------|
| Maintain separate PDF HTML/CSS copied from React | SSR `FormPageCanvas` + live `components.css` |
| Use `maxHeight` on ULC-only sections | Use `minHeight` so content pushes the next section down |
| Stack `box-shadow` on adjacent panels | `box-shadow: none` on `.form-page-sheet` panels |
| Add section `heading` duplicating table headers | Let the table header row speak for itself |
| Thick gray `<tr>` separator bands | `.row:not(:last-child) td { border-bottom: var(--line) }` |
| Stack `border` + `outline` + `inset box-shadow` on same edge in PDF | One owner per edge; print overrides only where Chromium drops lines |
| Hardcode light colors without dark pair | Always add `[data-theme='dark']` rules |
| Tiny radio/checkbox hit target only | Full-cell `<label class="…-check-cell">` in editable mode |

---

## Agent prompt (paste at start of session)

```
Read docs/FORM_ELEMENT_BLUEPRINT.md and docs/BUILTIN_TEMPLATE_BUILD.md.

We are adding/changing a built-in form element. Follow the blueprint:
- One React view for template, document, and PDF (via buildFormPrintHtml).
- CSS in components.css with dark theme.
- Match existing panel style (rounded frame, slate borders, no shadow between panels).
- Verify template viewer, document editor, and PDF export all match.
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-21 | Attendance log element (`.att-*`): 7×28 grid, slate theme, A4-locked page 4. |
| 2026-06-21 | Page 3 A4-locked tile (`form-page-sheet--lined-notes`); panels flex-fill body 10:18. |
| 2026-06-21 | Deficiencies element (`.def-*`): rounded grid panel, dual repair header rows, column widths, compliance footer alignment. |
| 2026-06-21 | Affirmation element (`.aff-*`): centered gray body text, inspector dropdowns, page spacing tokens, technician row heights. |
| 2026-06-21 | Initial blueprint from ULC 20.1 + Yes/No/Summary table work (three-surface PDF architecture, panel styling, spacing, dark theme, full-cell clicks). |
