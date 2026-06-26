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
- `powerSupplyInspection` — 22.4 Power Supply Inspection (`.psi-*`)
- `emergencyPowerSupplyTest` — 22.5 Emergency Power Supply Test and Inspection (`.epst-*`)
- `annunciatorDeviceTest` — 22.6 Annunciator / Remote Trouble / Display & Control Centre (`.artu-*`)
- `sequentialDisplayTest` — 22.7 Annunciators or Sequential Displays (`.asd-*`)
- `remoteTroubleSignalUnitTest` — 22.8 Remote Trouble Signal Unit Test and Inspection (`.rtsu-*`)
- `printerTest` — 22.9 Printer Test (`.prt-*`)
- `ancillaryDeviceCircuitTest` — 22.10 Ancillary Device Circuit Test (`.adc-*`)
- `fireSignalReceivingCentreInterconnection` — 22.11 Interconnection to the Fire Signal Receiving Centre (`.fsrc-*`)
- `dataCommunicationLinkFaultTolerance` — 22.12 Operation Test Circuit Fault Tolerance (`.dclft-*`)
- `fieldDeviceTestingLegend` — 23.1 Field Device Testing - Legend and Notes (`.fdtl-*`)
- `fieldDeviceTestingNotes` — 23.1.1 Testing Notes static numbered list (`.fdtn-*`)
- `individualDeviceRecord` — 23.2 Individual Device Record landscape grid (`.idr-*`)
- `circuitFaultToleranceTestSheet` — 23.3 Circuit Fault Tolerance Test Sheet landscape grid (`.cfts-*`)

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
| ULC section height | **`minHeight`** % only | **Never** `height` + `maxHeight` on any `heightPercent` section — locks page 1 ULC and overlaps summary |
| PDF outer frame | **`2pt solid #000000`** | Print-only — same black frame on every composite panel |
| PDF inner lines | `0.5px solid #64748b` | Print-only; fixes Chromium dropped borders |
| Row dividers | Single thin line | No thick gray separator bands between rows |

### Outer frame (all composite panels)

Every built-in form panel on `.form-page-sheet` shares one thick **black** outer edge. Inner grid lines stay thin slate.

| Surface | Selector | Outer border |
|---------|----------|--------------|
| Screen (template + document) | `.form-page-sheet` sets `--form-panel-frame` | `1.5px solid #000000` |
| Applied to | `.ulc-s1-panel`, `.yns-table-wrap`, `.aff-panel`, `.def-grid`, `.def-compliance`, `.ln-panel`, `.att-table-wrap`, `.doc-panel`, `.cut-panel`, `.cur-panel`, `.vct-panel`, `.psi-panel`, `.epst-panel`, `.artu-panel`, `.asd-panel`, `.rtsu-panel`, `.prt-panel`, `.adc-panel`, `.fsrc-panel`, `.dclft-panel`, `.fdtl-panel` | via `border: var(--form-panel-frame)` |
| PDF export | `PRINT_OVERRIDES` in `buildFormPrintHtml.tsx` | `2pt solid #000000 !important` on the same selectors |

Do **not** use the thin `--*-line` variable for the outer panel perimeter — that is for inner cells only.

Inner grid lines use **single-edge borders** only (`border-right` + `border-bottom` per cell, never full `border` on adjacent cells) so shared edges do not stack to double thickness. Exceptions: deficiencies **inspect/repair split** (`.def-grid-left` `2px`) and **device/control divider** (`.def-section-divider` `2px` top).

**ULC PDF corners:** use **`box-shadow: inset 0 0 0 2pt #000`** instead of `border` on `.ulc-s1-panel` — Chromium print breaks rounded bottom corners with `border` + `overflow: hidden`.

**Rounded panel corners (`.vct-panel`, `.psi-panel`, `.epst-panel`, etc.):** composite panels need **`border-radius: 0.625rem`** + **`overflow: hidden`** on the panel root so inner tables/banners clip to the frame and corners meet the black outer edge. In PDF (`PRINT_OVERRIDES` in `buildFormPrintHtml.tsx`), add the panel to the **`2pt solid #000000` border list** and the **`overflow: hidden`** list — **both** `.psi-panel` and `.epst-panel` must be included or export corners gap and colors drift.

**Editable field frames:** white inputs use **`--form-field-frame: 1px solid rgb(148 163 184 / 0.55)`** on `.form-page-sheet` — apply to every fill-in (info rows, measure fields, spec strip, inline table fields) in template, document, and PDF so empty fields stay visible on white backgrounds.

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
| Row height | See [Fixed-row grid tables](#fixed-row-grid-tables) — `--att-row-count: 28` on panel; tbody rows fill remaining height evenly |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) in template + document viewport |
| Section title | **20.4 Technician Attendance Log** in `.form-page-section-title` above the table |
| Value shape | `{ rows: AttendanceLogRow[] }` — always normalized to 28 rows |

### Fixed-row grid tables

Tables with a **fixed number of empty/fillable rows** (attendance log, ancillary device circuit test, etc.) must render **exactly** that many rows on **template**, **document**, and **PDF**. Never add filler rows in JSX/CSS for spacing; never clip rows because of `overflow: hidden`.

| Rule | Detail |
|------|--------|
| **Row count constant** | Export `*_ROW_COUNT` from `src/shared/form/<name>.ts` (single source of truth) |
| **Normalize** | `normalize*()` always returns exactly `ROW_COUNT` rows — pad with empty rows, ignore extras beyond the count |
| **React view** | Map `normalize*(value).rows` — do **not** slice, append, or synthesize rows in the component |
| **Fallback HTML** | `*Html.ts` uses the same `ROW_COUNT`, `normalize*`, and column widths |
| **CSS variable** | Set `--*-row-count: ROW_COUNT` on the panel/wrap via inline `style` |
| **Row height** | Export `*_BODY_ROW_HEIGHT` from shared module; set `--*-body-row-height` on panel via inline style for **screen**. **PDF:** see per-element rules — `.att-*` uses flex-fill on a locked A4 page; `.adc-*` also flex-fills but only inside `.form-page-sheet--ancillary-device-circuit-test.form-page-sheet--fixed` (see below). Do **not** apply generic page-fill stretch outside those scoped print blocks |
| **Column widths** | Shared column config with inline `width:%` on `<col>` / `<th>` so PDF Chromium matches document (class-only widths can drift) |
| **`data-row-count`** | Set on `<table data-row-count={ROW_COUNT}>` for keyboard bounds |
| **Enter key** | Use `handleFixedRowGridTextInputKeyDown` — Enter moves to the same column on the next row; **blocked on the last row** |
| **PDF print** | Mirror row/column rules in scoped `PRINT_OVERRIDES`; include explicit col widths |

Reference: `.att-*` (28 rows), `.adc-*` (48 rows).

### Ancillary device circuit test (`.adc-*`) — defaults

Page 12 portrait — **22.10 Ancillary Device Circuit Test** (`ancillaryDeviceCircuitTest`).

**Source files**

| Layer | Path |
|-------|------|
| Types + constants + normalize | `src/shared/form/ancillaryDeviceCircuitTest.ts` |
| Fallback HTML | `src/shared/form/ancillaryDeviceCircuitTestHtml.ts` |
| React view | `src/renderer/features/form/FormAncillaryDeviceCircuitTestView.tsx` |
| Screen CSS | `src/renderer/theme/components.css` (`.adc-*`, `.form-page-sheet--ancillary-device-circuit-test`) |
| PDF overrides | `src/renderer/features/form/buildFormPrintHtml.tsx` (`PRINT_OVERRIDES`, scoped to `.form-page-sheet--ancillary-device-circuit-test`) |
| Keyboard | `src/renderer/features/form/formGridTableKeyboard.ts` (`handleFixedRowGridTextInputKeyDown`) |
| Page classes | `FormPageCanvas.tsx` → `form-page-sheet--ancillary-device-circuit-test`, `form-page-content--ancillary-device-circuit-test` |

**Layout summary**

| Surface | Page tile | Table height | Row count |
|---------|-----------|--------------|-----------|
| Template / document | **Content-hugging** — `aspect-ratio: auto`, `height: auto`, `overflow: visible` on sheet + body (same pattern as 22.5 EPST). **Never** lock page 12 to A4 aspect-ratio or `overflow: hidden` — 48 rows are taller than one screen tile and the bottom row will clip | Fixed `--adc-body-row-height` (`1.0625rem`) on every tbody row | Exactly **48** `<tr>` in DOM always |
| PDF export | Fixed **A4** sheet (`297mm`, `overflow: hidden`) via `form-page-sheet--fixed` | **Flex-fill** into remaining body after meta header + section title; table `height: 100%`; tbody `tr`/`td` `height: 1%` splits space among **exactly 48 rows** | Same 48 rows — no filler, no clip |

| Area | Rule |
|------|------|
| Title | **22.10 Ancillary Device Circuit Test** in `.form-page-section-title` above panel (not inside table) |
| Outer frame | **`--form-panel-frame`** on `.adc-panel`; PDF also `2pt solid #000` via global `.form-print-root .adc-panel` border block |
| Table | **6 columns** (`ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS`), **48 fixed rows**; 2-row grouped header (`rowSpan` / `colSpan`) |
| Column ratios | Identify 40% · FACU 5% · Other 15% · Yes 8% · No 8% · Method 24% — inline `width:%` on `<col>` **and** explicit `.adc-col--*` widths in PDF `PRINT_OVERRIDES` |
| Header colors | Identify + operation group: slate gradient · Powered-by group + FACU: purple · Other: orange · Yes: green · No: red · Method: black |
| Footnotes | `.adc-footnotes` below table **inside** panel — `ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_FACU` (`* FACU …`) + `ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_NOTE`; `flex-shrink: 0` in PDF |
| Text inputs | Plain `<input class="adc-cell-input">` on Identify, Other, Method — **not** `VisibleWidthInput` (layout bugs). `handleFixedRowGridTextInputKeyDown` on Enter; blocked on row 48 |
| Check cells | Full-cell `<label class="adc-check-cell">` + radio for Yes/No; `FormCheckGlyph` when read-only |
| Value shape | `{ rows: AncillaryDeviceCircuitRow[] }` — `normalizeAncillaryDeviceCircuitTestValue()` always returns **48** rows |
| Constants | `ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT`, `ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT`, `ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS` |
| `data-row-count` | `<table data-row-count={48}>` for keyboard bounds |

**Screen CSS (template + document)**

| Rule | Detail |
|------|------|
| Panel | `.adc-panel` — flex column, **`overflow: hidden`** + **`box-sizing: border-box`** + `border-radius: 0.625rem` (clips inner grid to frame corners — same as `.epst-panel` / `.doc-panel`); `--adc-body-row-height` via inline style |
| Table wrap | `.adc-table-wrap` — `overflow: hidden`, `width: 100%` (grid flush with panel frame) |
| Row height | `tbody tr`, `.adc-td`, `.adc-check-cell` use `var(--adc-body-row-height)` |
| Grid lines | Every `.adc-row .adc-td` has `border-bottom` (including row 48) so verticals meet footnote divider; last column `border-right: none` (panel frame = right edge) |
| Section / frame | `.form-page-section:has(.adc-panel)` — no `flex-1` stretch on panel; `FormElementView` flush frame **without** `flex-1` |
| Page sheet | `.form-page-sheet--ancillary-device-circuit-test` — `aspect-ratio: auto`, `height: auto`, `overflow: visible` (override default A4 tile) |

**PDF CSS (`PRINT_OVERRIDES` — copy this pattern, do not improvise)**

Scoped under `.form-print-root .form-page-sheet--ancillary-device-circuit-test`:

1. **Flex chain** (only when `.form-page-sheet--fixed`): body → content → section → frame → `.adc-panel` → `.adc-table-wrap` all `flex: 1 1 auto; min-height: 0`.
2. **Panel** — `overflow: hidden`, `box-sizing: border-box`, `--adc-line: 0.5px solid #64748b`.
3. **Table** — `height: 100%`, `table-layout: fixed`, `border-collapse: collapse`.
4. **Body rows** — `tbody tr` and `.adc-td` → `height: 1%` (valid here because DOM has exactly 48 `<tr>`; splits remaining height after thead).
5. **Check cells** — `min-height: 0`, `height: 100%`. **Never** set `min-height: 1.125rem` on `.adc-check-cell` in print (inflates rows → clips row 48 / footnotes).
6. **Thead** — `height: auto`, compact padding; **font-size 7.25pt** (larger than body).
7. **Body cells** — table `font-size: 6.25pt`.
8. **Footnotes** — `flex-shrink: 0`, `border-top`, **font-size 7pt** (FACU + Note lines).
9. **Borders** — `border-right` on all cells except `:last-child`; `border-bottom` on all `.adc-th` and `.adc-row .adc-td`; `box-sizing: border-box`.
10. **Global print frame** — include `.adc-panel` in the shared `2pt` border + `overflow: hidden` panel list at bottom of `PRINT_OVERRIDES`.

**Typography**

| Part | Screen | PDF |
|------|--------|-----|
| Panel base | `calc(0.5625rem + 0.5pt)` | 6pt |
| Body table | inherits + 0.5pt on `.adc-table` | 6.25pt on `.adc-table` |
| Column headings | inherits | **7.25pt** on `.adc-table thead .adc-th` |
| Footnotes (`* FACU …`, Note) | `calc(1em - 0.5pt)` | **7pt** on `.adc-footnotes` |

**Do NOT (22.10 — learned the hard way)**

| Anti-pattern | Why |
|--------------|-----|
| A4 `aspect-ratio: 210/297` + `overflow: hidden` on page 12 screen tile | Clips row 48 |
| `flex: 1` / `height: 100%` on `.adc-panel` in **screen** CSS | Unpredictable stretch |
| `VisibleWidthInput` on grid cells | Typing/clamping bugs at zero width |
| `useFixedRowGridTableHeights` or measured row-height JS | Collapsed rows / wrong PDF |
| Fixed pt row height in PDF without flex-fill | Content taller than A4 → half row clipped, footnotes missing |
| Duplicate/conflicting print rules for `.adc-check-cell` | e.g. `min-height: 1.125rem` overriding `height: 1%` |
| `:not(:last-child)` only on row bottom borders | Vertical grid lines do not meet footnote bar |
| `overflow: visible` on `.adc-panel` (screen) | Rounded corners gap — inner grid sticks past frame; use **`overflow: hidden`** on panel only (page sheet stays `overflow: visible`) |
| `overflow: visible` on `.adc-table-wrap` in PDF | Frame/grid misalignment at panel edges |
| Section N/A grey-out (`opacity`, `*-disabled` strips, `disabled={sectionNotApplicable}` on inputs) | Panel becomes unreadable — use VCT section-N/A pattern instead |
| Extra `<tr>` filler rows in JSX/CSS | Breaks row-count parity and keyboard bounds |

**Verification checklist**

- [ ] Template: all 48 rows visible, footnotes below, no clipped bottom row
- [ ] Document: editable inputs rows 1–48; Enter blocked on row 48
- [ ] PDF: all 48 rows + both footnotes on one A4 page; closed outer frame; headings and footnotes readable
- [ ] Column widths match across template, document, PDF (40/5/15/8/8/24)

### Fire signal receiving centre interconnection (`.fsrc-*`) — defaults

Page 13 portrait — **22.11 Interconnection to the Fire Signal Receiving Centre** (`fireSignalReceivingCentreInterconnection`).

| Area | Rule |
|------|------|
| Title | **22.11 Interconnection to the Fire Signal Receiving Centre** in `.form-page-section-title` above panel |
| Page offset | Single table on page — **`padding-top: 2rem`** on `.form-page-content--fsrc-interconnection` (screen); **`14.85mm`** in PDF (`PRINT_OVERRIDES`) so content sits lower on the sheet |
| Outer frame | **`--form-panel-frame`** on `.fsrc-panel`; **`overflow: hidden`** + `border-radius: 0.625rem` |
| N/A bar | Light blue (`#cfe2f3`) — section N/A checkbox |
| Section N/A | Same as [Section N/A bar](#section-na-bar-vct--fsrc--and-similar-checklist-panels) — rows C–F/H auto-fill N/A; **no grey-out** |
| Reference bar | Dark blue gradient — complete 22.11 for each transmitter |
| Info rows | Light blue strip — Communicator Location, Circuit Disconnect Means Location, Circuit Panel/Breaker Identification |
| Table | Rows A–H; A/B = Yes/No only (N/A column blocked blue); C–F/H = Yes/No/N/A; G = Company/Address/Telephone fill-ins + merged choice block |
| Footer note | Editorial note on item A below table inside panel |
| Page tile | **A4 portrait** (`aspect-ratio: 210/297`) |
| Value shape | `{ sectionNotApplicable, communicatorLocation, circuitDisconnectMeansLocation, circuitPanelBreakerIdentification, checklist, recordFields }` |

### Data communication link fault tolerance (`.dclft-*`) — defaults

Page 14 portrait — **22.12 Operation Test Circuit Fault Tolerance** (`dataCommunicationLinkFaultTolerance`).

| Area | Rule |
|------|------|
| Title | **22.12 Operation Test Circuit Fault Tolerance** in `.form-page-section-title` above stack |
| Layout | **Two stacked panels** in `.dclft-stack` — primary DCL block + additional DCL block (`gap: 1.25rem` screen, `6pt` PDF) |
| Outer frame | **`--form-panel-frame`** on each `.dclft-panel`; **`overflow: hidden`** + `border-radius: 0.625rem` |
| N/A bar | Light blue — primary: *no DCL circuits*; additional: *no **additional** DCL circuits* |
| Section N/A | [Section N/A bar](#section-na-bar-vct--fsrc--and-similar-checklist-panels) — all rows A–F auto-fill N/A; **no grey-out** |
| Reference bar | Dark blue gradient — refer to Section 12 DCL operation tests and 23.3 |
| Info rows | Control Unit or Transponder Location / Identification, DCL Circuit Identification |
| Table | Rows A–F — full Yes / No / N/A on every row |
| Page tile | **A4 portrait** (`aspect-ratio: 210/297`); natural height (no page-fill stretch) |
| Value shape | `{ primary: DclftBlock, additional: DclftBlock }` — each block has `sectionNotApplicable`, three info fields, `checklist` |

### Field device testing legend (`.fdtl-*`) — defaults

Page 15 portrait — **23 Field Device Records** + **23.1 Field Device Testing - Legend and Notes** (`fieldDeviceTestingLegend`).

| Area | Rule |
|------|------|
| Titles | **23** ↔ **23.1**: tight (≈0 margin). **23.1** ↔ **table**: normal (`margin-bottom` on 23.1 title — `0.5rem` screen / `2pt` PDF) |
| **Fill-in fields** | Plain `<input class="fdtl-field-input">` in document mode (same pattern as `.adc-cell-input`) — CSS `overflow:hidden` + `white-space:nowrap` clips overflow; **do not** use `VisibleWidthInput` in full-width grid cells (`scrollWidth` lies) |
| **Empty fields** | Framed **`fdtl-field-box`** (border on box); text/value **`z-index: 1`** inside — descenders not clipped (`line-height: 1.2`, vertical padding) |
| **PDF fill-ins** | Border on `.fdtl-field-box`; text inside with `line-height: 1.15` |
| **PDF Description column** | **`padding-left: 4pt`** on `.fdtl-td--desc` / `.fdtl-th--desc` — must come **after** generic `.fdtl-td { padding: 0 }` in print overrides |
| Outer frame | **`--form-panel-frame`** on `.fdtl-panel`; **`overflow: hidden`** + `border-radius: 0.625rem` |
| Column widths | `colgroup` — Device `4.5rem`; Type/Model **`13%`** each; Description fills remainder. **`table-layout: fixed`**. |
| Column headers | Dark blue gradient — Device / Description / Type / Model Number |
| Section headers | Dark blue full-width rows (7 device categories) |
| Data rows | Yellow / white zebra; Device column bold centered |
| Smoke rows (S, PS, DS, MC) | `rowspan="3"` on Device; sub-rows for sensitivity lines; **blocked** grey Type/Model on sub-rows |
| Smoke sub-rows | `.fdtl-sub-field` grid: `auto minmax(0,1fr)` — label fixed width, fill-in takes remaining Description space |
| Typography | Bump **`font-size` only** when adjusting legibility — do **not** change column widths, cell padding, or row heights in the same pass |
| Page tile | **A4 portrait**; PDF **flex-fill** (`table height:100%`, `tbody tr height:1%`) so all rows fit one page |
| Value shape | `{ devices: Record<id, { type, modelNumber, sensitivityTestMethod, manufacturerSensitivityRange }> }` |

**Do NOT on `.fdtl-*`**

| Anti-pattern | Why |
|--------------|-----|
| **`VisibleWidthInput` on `.fdtl-*` grid cells** | `scrollWidth` on full-width table inputs rejects every keystroke — use plain `<input>` |
| `minmax(…, 1fr)` min on sensitivity grid that grows with content | Sensitivity fill-in pushes row width |
| Flex/auto width on Type/Model cells | Breaks fixed grid; fields “move” at end of text |
| Increasing font + padding/columns together | Shifts row count / PDF fit |

### Field device testing notes (`.fdtn-*`) — defaults

Page **16** — **23.1.1 Testing Notes** (`fieldDeviceTestingNotes`).

| Area | Rule |
|------|------|
| Content | Section **`heading`** = title; element = intro line + **22-item** ordered list — **no** tables, fields, or panel frame |
| Layout | Plain prose on white; `.fdtn-list` uses `list-style: decimal` |
| Surfaces | Same static copy in template, document, and PDF — **no** stored value / `onChange` |
| Page tile | **Always A4 portrait** (`aspect-ratio: 210/297`) — not content-hug height |
| Typography | `calc(0.5625rem + 2pt)` screen; **`7.75pt`** PDF; **`#000000`** on **`#ffffff`** |
| PDF layout | Title **centered**; body **`padding-top: 10mm`**; title **`margin-bottom: 10pt` + `padding-bottom: 8pt`**; list **`space-between` + `gap: 10pt`** |
| Value shape | `{}` (empty — content lives in `fieldDeviceTestingNotes.ts`) |

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

### Power supply inspection (`.psi-*`) — defaults

Page 8 portrait — **22.4 Power Supply Inspection** (`powerSupplyInspection`), stacked below 22.3.

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.psi-panel` |
| Panel frame | **`border-radius: 0.625rem`** + **`overflow: hidden`** |
| Banner | Black — `(Reference 9.1) Complete section for each power supply` |
| Info rows | Olive-gold strip — field location + identification (`VisibleWidthInput` with **`--form-field-frame`**) |
| Table | Rows A–H with Yes / No / N/A; olive/tan alternating rows |
| Layout | Section **`height: auto`** — table ends at row H (no stretch filler below) |
| PDF colors | **From `components.css` only** — do **not** add global `.form-print-root .psi-*` background rules in `PRINT_OVERRIDES` (breaks other pages / prints wrong reds) |
| PDF layout | **Scoped** to `.form-page-sheet--voice-communication-test` only — `height: auto`, no stretch below row H |
| PDF frame | Include `.psi-panel` in **`2pt` border** + **`overflow: hidden`** lists in `buildFormPrintHtml.tsx` |

### Emergency power supply test (`.epst-*`) — defaults

Page 9 portrait — **22.5 Emergency Power Supply Test and Inspection** (`emergencyPowerSupplyTest`).

| Area | Rule |
|------|------|
| Outer frame | **`--form-panel-frame`** on `.epst-panel` |
| Panel frame | **`border-radius: 0.625rem`** + **`overflow: hidden`** |
| Spec strip | Grey `#e2e8f0` — provided-by / battery type / capacity / NBC time |
| Battery capacity | **8ch** white field + `AH` — show framed field in **template (read-only) and document**, not plain text |
| Measure rows C–E | Label + **8ch** field + unit (VDC / mA / A) in one desc cell; **`display: grid`** columns `1fr 8ch 2.25rem` so VDC/mA/A align; olive merged block for Yes/No/N/A |
| Rows M, P, Q, S | Inline fill + unit in desc cell; olive block (no checkboxes) |
| Row R | Normal Yes / No / N/A |
| Section height | **`minHeight` only** (no `maxHeight`) on page 9 — all rows A–S + generator A–C must render |
| PDF colors | **From `components.css` only** — same as screen; never duplicate cell backgrounds in global `PRINT_OVERRIDES` |
| PDF layout | **Scoped** to `.form-page-sheet--emergency-power-supply-test` — `height: auto`, `overflow: visible` on section |
| PDF frame | Include `.epst-panel` in PDF border/overflow lists; **layout-only** print rules (e.g. `epst-desc-line` grid) scoped to page 9 sheet class |
| Value shape | See `emergencyPowerSupplyTest.ts` |

### Annunciator device test (`.artu-*`) — defaults

| Area | Rule |
|------|------|
| Page | **10** — top half of fixed A4 (`grid-template-rows: 1fr 1fr` on `.form-page-content--annunciator-device-test`) |
| Title | **Outside** panel — `.form-page-section-title` (same font as 22.5) |
| N/A bar | Grey strip + section N/A **checkbox** (no duplicate glyph in edit mode) |
| Checklist | Yes / No / N/A rows A–M — **`type="radio"`** per row, full-cell `<label class="artu-check-cell">`, **no** visible `☐`/`☑` beside the radio in edit mode |
| Read-only / PDF glyph | `FormCheckGlyph` / `renderCheckGlyphHtml` — class `form-check-glyph--checked` when ticked |
| Value shape | `{ sectionNotApplicable, fieldLocation, identification, checklist }` |

### Sequential display test (`.asd-*`) — defaults

| Area | Rule |
|------|------|
| Page | **10** — bottom half of fixed A4 |
| Title | **Outside** panel — `.form-page-section-title` |
| Header strip | Olive block: ref lines + location/ID (white labels) |
| Checklist | Same radio / full-cell pattern as `.artu-*`; zebra rows via `.asd-row--alt` |
| Panel grid | **`auto auto minmax(0, 1fr)`** — na bar, header strip, table (not four `auto` rows) |
| Value shape | `{ sectionNotApplicable, fieldLocation, identification, checklist }` |

### Remote trouble signal unit test (`.rtsu-*`) — defaults

| Area | Rule |
|------|------|
| Page | **11** — stacked sections with default `1.5rem` gap; panels at natural height (no page fill) |
| Theme | Green N/A bar, dark-green ref strip, olive info rows (white labels) |
| Checklist | Rows A–D — radio full-cell pattern; **auto row height** (base `.rtsu-check-cell` min-height) |
| Panel grid | Default flex column — na bar, header strip, table wrap |
| Value shape | `{ sectionNotApplicable, fieldLocation, identification, checklist }` |

### Printer test (`.prt-*`) — defaults

| Area | Rule |
|------|------|
| Page | **11** — second stacked section below 22.8 |
| Theme | Light-blue N/A bar, dark-blue ref strip, medium-blue info rows |
| Checklist | Rows A–B — radio full-cell pattern; **auto row height** |
| Panel grid | Default flex column |
| Value shape | `{ sectionNotApplicable, fieldLocation, identification, checklist }` |

### Checklist table typography

Yes / No / N/A checklist tables (`.doc-table`, `.cut-table`, `.cur-table`, `.vct-table`, `.psi-table`, `.epst-table`, `.artu-table`, `.asd-table`, `.rtsu-table`, `.prt-table`) share one typography rule so template, document, and PDF stay aligned.

| Surface | Panel chrome (legend, bars, info rows) | Checklist table |
|---------|------------------------------------------|-----------------|
| **Screen** | Panel base `font-size` (may differ by page density) | `font-size: calc(1em + 1pt)` on the `<table>` only |
| **PDF** | `7pt` (`.doc-panel`, `.cut-panel`, `.vct-panel`) or `6.5pt` (`.cur-panel` compact) | Panel print size **+ 1pt** on the table (`8pt`, `8pt`, `8pt`, `7.5pt`) |
| **Check marks** | — | Fixed size via `--form-check-mark-size` / `--form-check-input-size` on `.form-page-sheet` — same for `.doc-check`, `.cut-check`, `.cur-check`, `.vct-check`, `.psi-check`, `.epst-check`, `.artu-check`, `.asd-check`, `.yns-check` and their `*-check-input` radios (do **not** use `1em` / table-relative sizing) |
| **PDF checked glyph** | — | Read-only ticks use `form-check-glyph--checked` (`FormCheckGlyph` / `renderCheckGlyphHtml`) — print rule bumps **checked** glyph to `11.5pt`; unchecked stays `8.5pt`; radio/checkbox **input** size unchanged |

**Editable Yes/No/N/A cells:** one control only — `<label class="…-check-cell">` wrapping a **`type="radio"`** (or section N/A `checkbox`) with `sr-only` label. **Never** stack a native input and a visible `☐`/`☑` character in the same cell.

### Section N/A bar (`.vct-*`, `.fsrc-*`, and similar checklist panels)

Forms with a top **“(This Section is Not Applicable)”** checkbox (22.3, 22.8, 22.9, 22.11, 22.12, etc.) must follow the **22.3 Voice Communication Test** pattern — **not** the grey-out/disable overlay pattern.

| Rule | Detail |
|------|--------|
| **No grey-out** | **Never** apply `opacity`, `pointer-events: none`, or `*-header-strip--disabled` / `*-table-wrap--disabled` when section N/A is checked — panel stays full colour and readable |
| **Check on section N/A** | `set*SectionNotApplicable(value, true)` sets every row that **supports N/A** to `choice: 'na'`; rows without an N/A column (e.g. 22.11 A/B) keep `choice: null` |
| **Uncheck section N/A** | Clears **all** checklist row choices to `null` |
| **Edit a checklist row** | `set*Choice()` sets `sectionNotApplicable: false` (unchecks section N/A) |
| **Info / fill-in rows** | Stay editable in document mode — do **not** pass `disabled={sectionNotApplicable}` to inputs |
| **Reference** | `voiceCommunicationTest.ts` + `FormVoiceCommunicationTestView.tsx` |

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
.psi-check,
.epst-check,
.artu-check,
.asd-check,
.yns-check {
  font-size: var(--form-check-mark-size);
}
.doc-check-input,
.cut-check-input,
.cur-check-input,
.vct-check-input,
.psi-check-input,
.epst-check-input,
.artu-check-input,
.asd-check-input,
.yns-check-input {
  width: var(--form-check-input-size);
  height: var(--form-check-input-size);
}

/* PDF only — larger tick inside same box */
.form-print-root .form-check-glyph--checked {
  font-size: 11.5pt !important;
}
```

### Visible-width text inputs

Single-line fill-in fields inside a fixed-width cell must **not accept characters that overflow the visible box**. Use `VisibleWidthInput` (`src/renderer/features/form/VisibleWidthInput.tsx`), which clamps input on type, paste, mount, and resize by comparing `scrollWidth` to `clientWidth`.

| CSS | Rule |
|-----|------|
| `white-space: nowrap` | Prevent wrapping past the cell edge |
| `overflow: hidden` | Clip any overflow visually |
| Fixed `width` / `max-width` | When the blueprint box is a fixed size (e.g. `.cut-version-input`, `.cur-time-input`) |

Reference implementations: `.cut-info-input`, `.cut-version-input`, `.cur-info-input`, `.cur-time-input`, `.vct-info-input`. **Not** `.fdtl-field-input` — grid cells use plain `<input>` (see `.fdtl-*`).

**`.fdtl-*` Type/Model/sensitivity cells:** plain `<input>` inside `.fdtl-field-box` — `VisibleWidthInput` breaks editing in full-width table cells.

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

The form page uses **dynamic reference width**: at scale `1` the sheet fills the column. When the Contents rail opens, the whole page **zooms out uniformly** via CSS `zoom`. **Page 1** portrait sheets hug content height; **pages 3–9** (`form-page-sheet--lined-notes`, `--attendance-log`, `--documentation`, `--control-unit-test`, `--control-unit-record`, `--voice-communication-test`, `--emergency-power-supply-test`) and **page 2** landscape always keep fixed **A4** aspect ratio. PDF export is unaffected.

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
- [ ] **Fixed-row grids:** if table has `*_ROW_COUNT`, follow [Fixed-row grid tables](#fixed-row-grid-tables) (normalize, CSS var, col widths, `data-row-count`, Enter bounds)

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
  - **22.4 / 22.5:** layout only, **scoped** to `.form-page-sheet--voice-communication-test` / `--emergency-power-supply-test` — **never** global `.form-print-root .psi-*` / `.epst-*` cell background colors (live CSS owns colors)
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
| PDF (primary) | `src/renderer/features/form/buildFormPrintHtml.tsx` |
| PDF (export IPC) | `src/main/pdf/exportInspectionPdf.ts` |
| PDF (fallback HTML) | `src/main/pdf/renderFormHtml.ts` |
| Seeds | `src/shared/form/seeds/*.ts`, registry in `src/shared/document/defaults.ts` |

---

## Anti-patterns (learned the hard way)

| Don’t | Do instead |
|-------|------------|
| Maintain separate PDF HTML/CSS copied from React | SSR `FormPageCanvas` + live `components.css` |
| Use `maxHeight` on ULC-only sections | Use `minHeight` only on **every** `heightPercent` section (`FormPageCanvas`) |
| Global `.form-print-root .psi-*` / `.epst-*` colors in `PRINT_OVERRIDES` | Colors in `components.css`; print adds **page-scoped layout** only |
| Unscoped `.form-page-section:has(.psi-panel)` print flex/height | Scope to `.form-page-sheet--voice-communication-test` or `--emergency-power-supply-test` |
| Stack `box-shadow` on adjacent panels | `box-shadow: none` on `.form-page-sheet` panels |
| Add section `heading` duplicating table headers | Let the table header row speak for itself |
| Thick gray `<tr>` separator bands | `.row:not(:last-child) td { border-bottom: var(--line) }` |
| Stack `border` + `outline` + `inset box-shadow` on same edge in PDF | One owner per edge; print overrides only where Chromium drops lines |
| Hardcode light colors without dark pair | Always add `[data-theme='dark']` rules |
| Tiny radio/checkbox hit target only | Full-cell `<label class="…-check-cell">` in editable mode |
| Checkbox + visible `☐`/`☑` in same editable cell | Radio (or section N/A checkbox) only — glyph via `FormCheckGlyph` in read-only/PDF |

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
| 2026-06-26 | Page 22 landscape: `.cfts-*` (23.3) circuit fault tolerance sheet — grouped header, 11 rows, P/F/Dash. |
| 2026-06-26 | Pages 17–21: duplicate `.idr-*` (23.2) landscape sheets; Contents shows one row with `Page 17-21`. |
| 2026-06-26 | Page 17 landscape: `.idr-*` (23.2) Individual Device Record — 12 columns, **19 rows**, Yes/X/Dash legend. |
| 2026-06-25 | `.fdtl-*`: `VisibleWidthInput` required; title spacing 23↔23.1 vs 23.1↔table; PDF fields fill cell. |
| 2026-06-25 | `.fdtl-*` blueprint: fixed-width fill-ins, empty-field frames, Type/Model 13%, font-only tweaks. |
| 2026-06-25 | Page 15: `.fdtl-*` (23.1) field device legend table — 7 sections, smoke-detector sub-rows, yellow/white zebra. |
| 2026-06-25 | Page 14: `.dclft-*` (22.12) dual stacked DCL circuit fault tolerance panels — rows A–F, independent section N/A per block. |
| 2026-06-25 | Section N/A blueprint: no grey-out on checklist panels (VCT pattern); 22.11 `.fsrc-*` fixed to match. |
| 2026-06-25 | Page 13: `.fsrc-*` (22.11) FSRC interconnection checklist — light-blue headers, rows A–H, top page padding on single-table page. |
| 2026-06-25 | **22.10 `.adc-*` blueprint expanded** — screen vs PDF layout, flex-fill print rules, border/grid, typography, anti-patterns, file map, verification checklist. |
| 2026-06-25 | Fixed-row grid tables blueprint: row-count parity (template/document/PDF), col widths, Enter bounds; `.att-*` row height; `.adc-*` PDF flex-fill exception documented. |
| 2026-06-25 | Page 12: `.adc-*` (22.10) full-page grid — 48 rows, purple/orange/green/red headers, footnotes. |
| 2026-06-25 | Page 11: `.rtsu-*` (22.8) + `.prt-*` (22.9) stacked at natural height; green/blue themes; no page-fill scaling. |
| 2026-06-25 | Page 10: `.artu-*` (22.6) + `.asd-*` (22.7) on fixed A4 50/50; radio full-cell checklist; `FormCheckGlyph` + PDF `form-check-glyph--checked` at 11.5pt. |
| 2026-06-21 | Control unit test element (`.cut-*`): 22.1 inspection table, row F firmware/software fields, A4 page 6. |
| 2026-06-21 | Documentation element (`.doc-*`): 21.1 Yes/No/N/A checklist, annex section, A4 page 5. |
| 2026-06-21 | Attendance log element (`.att-*`): 7×28 grid, slate theme, A4-locked page 4. |
| 2026-06-21 | Page 3 A4-locked tile (`form-page-sheet--lined-notes`); panels flex-fill body 10:18. |
| 2026-06-21 | Deficiencies element (`.def-*`): rounded grid panel, dual repair header rows, column widths, compliance footer alignment. |
| 2026-06-21 | Affirmation element (`.aff-*`): centered gray body text, inspector dropdowns, page spacing tokens, technician row heights. |
| 2026-06-21 | Initial blueprint from ULC 20.1 + Yes/No/Summary table work (three-surface PDF architecture, panel styling, spacing, dark theme, full-cell clicks). |
