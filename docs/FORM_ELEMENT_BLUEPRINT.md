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
- `documentation` — 21 Documentation Yes/No/N/A checklist (`.doc-*`)
- `controlUnitTest` — 22 Control Unit or Transponder Test Record (`.cut-*`)
- `controlUnitRecord` — 22.2 Control Unit or Transponder Record (`.cur-*`)
- `voiceCommunicationTest` — 22.3 Voice Communication Test (`.vct-*`)

---

## Visual design system (form page)

All composite elements on a letter page share the same “form panel” language:

| Token | Value | Notes |
|-------|-------|-------|
| Inner cell line | `1px solid rgb(148 163 184 / 0.45)` | CSS var: `--ulc-line` / `--yns-line` / `--aff-line` / `--def-line` / `--ln-line` / `--att-line` / `--doc-line` / `--cut-line` |
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
| Applied to | `.ulc-s1-panel`, `.yns-table-wrap`, `.aff-panel`, `.def-grid`, `.def-compliance`, `.ln-panel`, `.att-table-wrap`, `.doc-panel`, `.cut-panel`, `.cur-panel`, `.vct-panel` | via `border: var(--form-panel-frame)` |
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

### Documentation checklist (`.doc-*`) — defaults

Page 5 portrait — **21 Documentation** (`documentation`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.doc-panel` |
| Legend | Yes (green), No (red), NA (slate) — above the table |
| Note bar | Brown gradient — `(Note: Reference Section 7 Documentation)` |
| Table | Rows A–J with Yes / No / N/A; disabled N/A cells are solid dark (no checkbox) |
| Row G | Inline fill-in for smoke-control **Measure** before NRCC reference |
| Row I | Group header + indented sub-items **i–viii** |
| Row J | Location/media notes — **3 ruled lines** (no Yes/No/N/A) |
| Annex | Green **ANNEX TABLE OF CONTENTS** header + flex-fill body |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) |
| Table font | Checklist table — see [Checklist table typography](#checklist-table-typography) |
| Value shape | `{ checklist, locationNotes, annexContents }` |

### Control unit test record (`.cut-*`) — defaults

Page 6 portrait — **22 Control Unit or Transponder Test Record** (`controlUnitTest`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.cut-panel` |
| Legend | Yes (green), No (red), NA (slate) — above the table |
| Reference bar | Blue gradient — `(Reference Clause 8.2) Complete section for each control unit or transponder.` |
| Info rows | Lavender strip — field location + identification fill-ins |
| Table | Rows A–J with Yes / No / N/A |
| Row F | Firmware + program software Date/Revision/Version fields; merged black Y/N/NA block |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) |
| Table font | Checklist table — see [Checklist table typography](#checklist-table-typography) |
| Value shape | `{ fieldLocation, identification, checklist, firmware, software }` |

### Control unit record (`.cur-*`) — defaults

Page 7 portrait — **22.2 Control Unit or Transponder Record** (`controlUnitRecord`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.cur-panel` |
| Title bar | Blue gradient — `22.2 Control Unit or Transponder Record` |
| Reference bar | Blue gradient — `(See 8.3) Complete section for each control unit or transponder.` |
| Info rows | Lavender strip — field location + identification fill-ins |
| Table | Rows A–EE with Yes / No / N/A; alternating row tint |
| Row J | Inline **Time:** fill-in after description |
| Row Q | Inline **Time:** fill-in; merged black Yes/No block (N/A only) |
| Footer note | Editorial correction note below the table |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) |
| Table font | Checklist table — see [Checklist table typography](#checklist-table-typography) |
| Value shape | `{ fieldLocation, identification, checklist }` — checklist entries may include `time` on rows J and Q |

### Voice communication test (`.vct-*`) — defaults

Page 8 portrait — **22.3 Voice Communication Test** (`voiceCommunicationTest`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.vct-panel` |
| Title | Centered bold — `22.3 Voice Communication Test` |
| N/A bar | Grey strip — “There are no Voice Communication capabilities…” + section N/A checkbox |
| Reference bar | Dark green — `(Reference Subsection 8.5)` |
| Info rows | Olive-green strip — Location + Identification fill-ins (`VisibleWidthInput`) |
| Table | Rows A–Q with Yes / No / N/A; light-green row tint |
| Section N/A | When checked, sets **every checklist row to N/A** (no grey-out / disable); unchecking clears all row choices; editing any row unchecks section N/A |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) |
| Table font | Checklist table — see [Checklist table typography](#checklist-table-typography) |
| Value shape | `{ sectionNotApplicable, fieldLocation, identification, checklist }` |

### Checklist table typography

Yes / No / N/A checklist tables (`.doc-table`, `.cut-table`, `.cur-table`, `.vct-table`) share one typography rule so template, document, and PDF stay aligned.

| Surface | Panel chrome (legend, bars, info rows) | Checklist table |
|---------|------------------------------------------|-----------------|
| **Screen** | Panel base `font-size` (may differ by page density) | `font-size: calc(1em + 1pt)` on the `<table>` only |
| **PDF** | `7pt` (`.doc-panel`, `.cut-panel`, `.vct-panel`) or `6.5pt` (`.cur-panel` compact) | Panel print size **+ 1pt** on the table (`8pt`, `8pt`, `8pt`, `7.5pt`) |
| **Check marks** | — | Fixed size via `--form-check-mark-size` / `--form-check-input-size` on `.form-page-sheet` — same for `.doc-check`, `.cut-check`, `.cur-check`, `.vct-check`, `.yns-check` and their `*-check-input` radios (do **not** use `1em` / table-relative sizing) |

**Layout rule:** when changing table font size, do **not** change column widths, cell padding, or row min-heights — only the table `font-size` (and matching print override in `buildFormPrintHtml.tsx`).

```css
/* Example — apply on the table element, not the whole panel */
.doc-table,
.cut-table,
.cur-table,
.vct-table {
  font-size: calc(1em + 1pt);
}

/* Check marks — fixed size on .form-page-sheet, not table-relative */
.doc-check,
.cut-check,
.cur-check,
.vct-check,
.yns-check {
  font-size: var(--form-check-mark-size);
}
.doc-check-input,
.cut-check-input,
.cur-check-input,
.vct-check-input,
.yns-check-input {
  width: var(--form-check-input-size);
  height: var(--form-check-input-size);
}
```

### Visible-width text inputs

Single-line fill-in fields inside a fixed-width cell must **not accept characters that overflow the visible box**. Use `VisibleWidthInput` (`src/renderer/features/form/VisibleWidthInput.tsx`), which clamps input on type, paste, mount, and resize by comparing `scrollWidth` to `clientWidth`.

| CSS | Rule |
|-----|------|
| `white-space: nowrap` | Prevent wrapping past the cell edge |
| `overflow: hidden` | Clip any overflow visually |
| Fixed `width` / `max-width` | When the blueprint box is a fixed size (e.g. `.cut-version-input`, `.cur-time-input`) |

Reference implementations: `.cut-info-input`, `.cut-version-input`, `.cur-info-input`, `.cur-time-input`, `.vct-info-input`.

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
.form-page-sheet .att-table-wrap,
.form-page-sheet .doc-panel,
.form-page-sheet .cut-panel,
.form-page-sheet .cur-panel,
.form-page-sheet .vct-panel {
  box-shadow: none;
  outline: none;
  border: var(--form-panel-frame);
}
```

Do not add a **section heading** above a table that already has its own column headers (e.g. don’t show “Summary” above a Yes/No/Summary table).

When changing page spacing, update **both** `components.css` and `PRINT_OVERRIDES` in `buildFormPrintHtml.tsx` so PDF stays in sync. **PDF export uses half the on-screen section gap** (`0.75rem` print vs `1.5rem` screen) to fit the letter page.

### Viewport scaling (template + document editor)

The form page uses **dynamic reference width**: at scale `1` the sheet fills the column. When the Contents rail opens, the whole page **zooms out uniformly** via CSS `zoom`. **Page 1** portrait sheets hug content height; **pages 3–8** (`form-page-sheet--lined-notes`, `--attendance-log`, `--documentation`, `--control-unit-test`, `--control-unit-record`, `--voice-communication-test`) and **page 2** landscape always keep fixed **A4** aspect ratio. PDF export is unaffected.

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
| 2026-06-21 | Control unit test element (`.cut-*`): 22.1 inspection table, row F firmware/software fields, A4 page 6. |
| 2026-06-21 | Documentation element (`.doc-*`): 21.1 Yes/No/N/A checklist, annex section, A4 page 5. |
| 2026-06-21 | Attendance log element (`.att-*`): 7×28 grid, slate theme, A4-locked page 4. |
| 2026-06-21 | Page 3 A4-locked tile (`form-page-sheet--lined-notes`); panels flex-fill body 10:18. |
| 2026-06-21 | Deficiencies element (`.def-*`): rounded grid panel, dual repair header rows, column widths, compliance footer alignment. |
| 2026-06-21 | Affirmation element (`.aff-*`): centered gray body text, inspector dropdowns, page spacing tokens, technician row heights. |
| 2026-06-21 | Initial blueprint from ULC 20.1 + Yes/No/Summary table work (three-surface PDF architecture, panel styling, spacing, dark theme, full-cell clicks). |
