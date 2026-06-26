import { renderToStaticMarkup } from 'react-dom/server';
import type { DocumentContext } from '../../../shared/document';
import type { BuiltinTemplate, FormDefinition } from '../../../shared/form';
import { FormPageCanvas } from './FormPageCanvas';
import { measureLinedNotesPdfRowHeights } from './measureLinedNotesPdfRowHeights';

/**
 * Print-only CSS appended after the app's live stylesheet. The goal is to keep
 * the EXACT same layout/components/CSS the user edits, and only reshape the page
 * sheet to true Letter size with page breaks. No layout rules here — those come
 * from the bundled app stylesheet so the PDF can never drift from the document.
 */
const PRINT_OVERRIDES = `
  @page { size: A4; margin: 0; }
  html { font-size: 16px; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .form-print-root { display: block; box-sizing: border-box; }
  .form-print-root *,
  .form-print-root *::before,
  .form-print-root *::after { box-sizing: border-box; }
  .form-print-root .form-page-sheet {
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    max-height: 297mm;
    aspect-ratio: auto;
    border: none;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
    --form-check-mark-size: 8.5pt;
    --form-check-input-size: 8.5pt;
  }
  .form-print-root .form-check-glyph--checked {
    font-size: 11.5pt !important;
    line-height: 1 !important;
  }
  .form-print-root .form-page-sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  /*
   * ULC PDF — full box on every grid cell (print only). Layout containers get no
   * partial edges; each cell carries its own complete border. Flex rules below
   * prevent clip/column bugs.
   */
  .form-print-root .ulc-s1-panel {
    --ulc-line: 1px solid #64748b !important;
    box-shadow: none !important;
    max-height: none !important;
    height: auto !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .form-print-root .ulc-s1-company { flex: 0 0 42% !important; }
  .form-print-root .ulc-s1-bottom-row {
    grid-template-columns: 42% minmax(0, 1fr) minmax(0, 1fr) 8.775rem !important;
  }
  .form-print-root .ulc-s1-circuits .ulc-s1-cell {
    grid-template-columns: 42% minmax(0, 1fr) !important;
  }

  /* Strip partial borders from row/column wrappers — cells own the lines. */
  .form-print-root .ulc-s1-panel .ulc-s1-top,
  .form-print-root .ulc-s1-panel .ulc-s1-service,
  .form-print-root .ulc-s1-panel .ulc-s1-service-row,
  .form-print-root .ulc-s1-panel .ulc-s1-system-block,
  .form-print-root .ulc-s1-panel .ulc-s1-system-types,
  .form-print-root .ulc-s1-panel .ulc-s1-circuits,
  .form-print-root .ulc-s1-panel .ulc-s1-system-row,
  .form-print-root .ulc-s1-panel .ulc-s1-bottom,
  .form-print-root .ulc-s1-panel .ulc-s1-bottom-row,
  .form-print-root .ulc-s1-panel .ulc-s1-phone-fax,
  .form-print-root .ulc-s1-panel .ulc-s1-city-postal {
    border: none !important;
  }

  /* Every cell in the ULC table — company block, data fields, stage checks,
     system-type checks, circuits header/rows, phone/fax stacks, city/postal pair. */
  .form-print-root .ulc-s1-panel .ulc-s1-company,
  .form-print-root .ulc-s1-panel .ulc-s1-cell,
  .form-print-root .ulc-s1-panel .ulc-s1-system-row .ulc-s1-check,
  .form-print-root .ulc-s1-panel .ulc-s1-circuits-title {
    border: 1px solid #64748b !important;
    box-sizing: border-box !important;
  }

  /* Label/value divider inside each data cell. */
  .form-print-root .ulc-s1-panel .ulc-s1-cell > .ulc-s1-label,
  .form-print-root .ulc-s1-panel .ulc-s1-phone-fax .ulc-s1-cell > .ulc-s1-label {
    border-bottom: 1px solid #64748b !important;
  }

  /* Circuits row: label | value split inside the cell. */
  .form-print-root .ulc-s1-panel .ulc-s1-circuits .ulc-s1-cell > .ulc-s1-label {
    border-right: 1px solid #64748b !important;
    border-bottom: none !important;
  }

  .form-print-root .form-page-content {
    overflow: visible !important;
    gap: 0.75rem !important;
    margin-top: 0.5rem !important;
  }
  .form-print-root .form-page-section {
    max-height: none !important;
    overflow: visible !important;
    flex-shrink: 0 !important;
  }
  .form-print-root .form-page-content > .form-page-section + .form-page-section {
    padding-top: 0 !important;
  }

  /* Yes/No/Summary table — match ULC panel frame + thin row lines in PDF. */
  .form-print-root .yns-table-wrap {
    --yns-line: 0.5px solid #64748b !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    margin-top: 0 !important;
  }
  .form-print-root .form-page-section:has(.yns-table-wrap) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .yns-th,
  .form-print-root .yns-td {
    border-color: #64748b !important;
  }
  .form-print-root .yns-row:not(:last-child) .yns-td {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .yns-th--summary {
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    color: #334155 !important;
  }

  /* Lined notes — Recommendations + Testing Notes */
  .form-print-root .ln-panel {
    --ln-line: 0.5px solid #64748b !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    margin-top: 0 !important;
    overflow: hidden !important;
  }
  .form-print-root .form-page-section:has(.ln-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .ln-panel--green .ln-head-bar {
    background: #1b6b2f !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .form-print-root .ln-panel--blue .ln-head-bar {
    background: #1e3a8a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .form-print-root .ln-head-bar {
    border-bottom: 0.5px solid #64748b !important;
    min-height: 0.625rem !important;
    flex-shrink: 0 !important;
  }
  .form-print-root .ln-panel {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }
  .form-print-root .ln-body-stack {
    position: relative !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    width: 100% !important;
  }
  .form-print-root .ln-body-stack--fill {
    max-height: none !important;
    align-self: stretch !important;
  }
  .form-print-root .ln-rows {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }
  .form-print-root .ln-body-stack--fill .ln-rows {
    bottom: 0 !important;
    height: 100% !important;
  }
  .form-print-root .ln-row {
    flex: 0 0 1.375rem !important;
    height: 1.375rem !important;
    border-bottom: 0.5px solid #64748b !important;
    box-sizing: border-box !important;
  }
  .form-print-root .ln-body-stack--fill .ln-row {
    flex: 1 1 0 !important;
    height: auto !important;
    min-height: 0 !important;
  }
  .form-print-root .ln-body {
    position: relative !important;
    z-index: 1 !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: 100% !important;
    white-space: pre-wrap !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    background: transparent !important;
    overflow: hidden !important;
  }
  .form-print-root .ln-body-stack:not(.ln-body-stack--measured) .ln-body {
    line-height: 1.375rem !important;
  }
  .form-print-root .ln-body-stack--measured .ln-rows {
    bottom: auto !important;
    height: auto !important;
  }
  .form-print-root .ln-body-stack--measured .ln-row {
    flex: 0 0 var(--ln-row-height) !important;
    height: var(--ln-row-height) !important;
    min-height: 0 !important;
    border-bottom: 0.5px solid #64748b !important;
    box-sizing: border-box !important;
  }
  .form-print-root .ln-body-stack--measured .ln-body {
    line-height: var(--ln-row-height) !important;
  }
  .form-print-root .form-page-content--lined-notes {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    gap: 0.5rem !important;
  }
  .form-print-root .form-page-sheet--lined-notes.form-page-sheet--fixed {
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--lined-notes.form-page-sheet--fixed .form-page-body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  .form-print-root .form-page-sheet--lined-notes.form-page-sheet--fixed .form-page-section:has(.ln-panel--green) {
    flex: 10 1 0 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--lined-notes.form-page-sheet--fixed .form-page-section:has(.ln-panel--blue) {
    flex: 18 1 0 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--lined-notes.form-page-sheet--fixed .form-page-section:has(.ln-panel) > div {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--lined-notes.form-page-sheet--fixed .form-page-section:has(.ln-panel) .form-element-frame--flush {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  /* Attendance log — 20.4 Technician Attendance Log */
  .form-print-root .att-table-wrap {
    --att-line: 0.5px solid #64748b !important;
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow: hidden !important;
    margin-top: 0 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    font-size: 7pt !important;
    line-height: 1.25 !important;
    color: #171717 !important;
    background: #ffffff !important;
  }
  .form-print-root .att-accent-bar {
    flex-shrink: 0 !important;
    min-height: 0.35rem !important;
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .att-table {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: 100% !important;
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
  }
  .form-print-root .att-th {
    padding: 0.125rem 0.2rem !important;
    font-weight: 700 !important;
    text-align: center !important;
    vertical-align: middle !important;
    border: none !important;
    border-right: 0.5px solid #64748b !important;
    border-bottom: 0.5px solid #64748b !important;
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    color: #334155 !important;
    line-height: 1.15 !important;
  }
  .form-print-root .att-th:last-child {
    border-right: none !important;
  }
  .form-print-root .att-row:not(:last-child) .att-td {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .att-td {
    vertical-align: middle !important;
    border: none !important;
    border-right: 0.5px solid #64748b !important;
    padding: 0 !important;
    height: 1% !important;
  }
  .form-print-root .att-td:last-child {
    border-right: none !important;
  }
  .form-print-root .att-cell-input,
  .form-print-root .att-cell-value {
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    min-height: 100% !important;
    padding: 0.1rem 0.2rem !important;
    box-sizing: border-box !important;
    color: #171717 !important;
    background: transparent !important;
  }
  .form-print-root .att-td--center .att-cell-input,
  .form-print-root .att-td--center .att-cell-value {
    text-align: center !important;
    justify-content: center !important;
  }
  .form-print-root .form-page-section:has(.att-table-wrap) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .form-page-content--attendance-log {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }
  .form-print-root .form-page-sheet--attendance-log.form-page-sheet--fixed {
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--attendance-log.form-page-sheet--fixed .form-page-body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  .form-print-root .form-page-sheet--attendance-log.form-page-sheet--fixed .form-page-section:has(.att-table-wrap) {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--attendance-log.form-page-sheet--fixed .form-page-section:has(.att-table-wrap) > div,
  .form-print-root .form-page-sheet--attendance-log.form-page-sheet--fixed .form-page-section:has(.att-table-wrap) .form-element-frame--flush {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--attendance-log.form-page-sheet--fixed .att-table-wrap {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  /* Documentation checklist — 21 Documentation */
  .form-print-root .doc-panel {
    --doc-line: 0.5px solid #64748b !important;
    flex: 0 0 auto !important;
    min-height: auto !important;
    max-height: none !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    margin-top: 0 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    font-size: 7pt !important;
    line-height: 1.2 !important;
    color: #171717 !important;
    background: #ffffff !important;
  }
  .form-print-root .doc-note-bar {
    background: linear-gradient(180deg, #a16207 0%, #92400e 100%) !important;
    color: #ffffff !important;
    border-top: 0.5px solid #64748b !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .doc-th,
  .form-print-root .doc-td {
    border-right: 0.5px solid #64748b !important;
    padding: 0.5pt 1.5pt !important;
  }
  .form-print-root .doc-row--notes .doc-td {
    height: auto !important;
    vertical-align: top !important;
  }
  .form-print-root .doc-row:not(:last-child) .doc-td,
  .form-print-root .doc-th {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .doc-th--yes {
    background: #1b6b2f !important;
    color: #ffffff !important;
  }
  .form-print-root .doc-th--no {
    background: #9b1c1c !important;
    color: #ffffff !important;
  }
  .form-print-root .doc-th--na {
    background: #334155 !important;
    color: #ffffff !important;
  }
  .form-print-root .doc-td {
    background: #fff7ed !important;
  }
  .form-print-root .doc-td--yes {
    background: #edf7ef !important;
  }
  .form-print-root .doc-td--no {
    background: #fdeeee !important;
  }
  .form-print-root .doc-td--na-disabled {
    background: #e2e8f0 !important;
  }
  .form-print-root .doc-table-wrap {
    flex: 0 0 auto !important;
    overflow: visible !important;
  }
  .form-print-root .doc-table {
    width: 100% !important;
    table-layout: fixed !important;
    font-size: 8pt !important;
  }
  .form-print-root .doc-ruled-stack {
    --doc-ruled-line-height: 1.15em !important;
    flex-shrink: 0 !important;
    height: calc(var(--doc-ruled-line-height) * var(--doc-ruled-line-count, 3)) !important;
    min-height: calc(var(--doc-ruled-line-height) * var(--doc-ruled-line-count, 3)) !important;
    max-height: calc(var(--doc-ruled-line-height) * var(--doc-ruled-line-count, 3)) !important;
  }
  .form-print-root .doc-ruled-body {
    height: 100% !important;
    line-height: var(--doc-ruled-line-height, 1.15em) !important;
  }
  .form-print-root .doc-ruled-line {
    flex: 0 0 var(--doc-ruled-line-height, 1.15em) !important;
    height: var(--doc-ruled-line-height, 1.15em) !important;
    border-bottom: 0.5px solid #64748b !important;
    box-sizing: border-box !important;
  }
  .form-print-root .doc-ruled-stack--annex {
    --doc-ruled-line-count: 11 !important;
    --doc-ruled-line-height: calc(1.15em * 1.3) !important;
  }
  .form-print-root .doc-ruled-stack--annex .doc-ruled-line:last-child {
    border-bottom: none !important;
  }
  .form-print-root .doc-ruled-stack--location {
    --doc-ruled-line-count: 3 !important;
  }
  .form-print-root .doc-annex-header {
    background: #1b6b2f !important;
    color: #ffffff !important;
  }
  .form-print-root .doc-annex {
    flex: 0 0 auto !important;
    border-top: none !important;
  }
  .form-print-root .doc-annex-body {
    flex: 0 0 auto !important;
  }
  .form-print-root .form-page-section:has(.doc-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .form-page-content--documentation {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  /* Control unit test record — 22 */
  .form-print-root .cut-panel {
    --cut-line: 0.5px solid #64748b !important;
    flex: 0 0 auto !important;
    min-height: auto !important;
    max-height: none !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    margin-top: 0 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    font-size: 7pt !important;
    line-height: 1.2 !important;
    color: #171717 !important;
    background: #ffffff !important;
  }
  .form-print-root .cut-ref-bar {
    background: linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%) !important;
    color: #ffffff !important;
    border-top: 0.5px solid #64748b !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .cut-info-row {
    background: linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 100%) !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .cut-info-input,
  .form-print-root .cut-info-value {
    background: #ffffff !important;
  }
  .form-print-root .cut-th,
  .form-print-root .cut-td {
    border-right: 0.5px solid #64748b !important;
    padding: 0.5pt 1.5pt !important;
  }
  .form-print-root .cut-row:not(:last-child) .cut-td,
  .form-print-root .cut-th {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .cut-th--yes {
    background: #1b6b2f !important;
    color: #ffffff !important;
  }
  .form-print-root .cut-th--no {
    background: #9b1c1c !important;
    color: #ffffff !important;
  }
  .form-print-root .cut-th--na {
    background: #334155 !important;
    color: #ffffff !important;
  }
  .form-print-root .cut-td {
    background: #f8fafc !important;
  }
  .form-print-root .cut-td--yes {
    background: #edf7ef !important;
  }
  .form-print-root .cut-td--no {
    background: #fdeeee !important;
  }
  .form-print-root .cut-td--na {
    background: #f1f5f9 !important;
  }
  .form-print-root .cut-td--f {
    background: #e2e8f0 !important;
    vertical-align: top !important;
  }
  .form-print-root .cut-td--choice-block {
    background: #171717 !important;
    padding: 0 !important;
  }
  .form-print-root .cut-version-input,
  .form-print-root .cut-version-value {
    background: #ffffff !important;
  }
  .form-print-root .cut-table-wrap {
    flex: 0 0 auto !important;
    overflow: visible !important;
  }
  .form-print-root .cut-table {
    width: 100% !important;
    table-layout: fixed !important;
    font-size: 8pt !important;
  }
  .form-print-root .form-page-section:has(.cut-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .form-page-content--control-unit-test {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  /* Control unit record — 22.2 */
  .form-print-root .cur-panel {
    --cur-line: 0.5px solid #64748b !important;
    flex: 0 0 auto !important;
    min-height: auto !important;
    max-height: none !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    margin-top: 0 !important;
    border-radius: 0.625rem !important;
    border: 2pt solid #000000 !important;
    box-shadow: none !important;
    font-size: 6.5pt !important;
    line-height: 1.15 !important;
    color: #171717 !important;
    background: #ffffff !important;
  }
  .form-print-root .cur-title-bar,
  .form-print-root .cur-ref-bar {
    background: linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%) !important;
    color: #ffffff !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .cur-info-row {
    background: linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 100%) !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .cur-info-input,
  .form-print-root .cur-info-value {
    background: #ffffff !important;
  }
  .form-print-root .cur-th,
  .form-print-root .cur-td {
    border-right: 0.5px solid #64748b !important;
    padding: 0.5pt 1.5pt !important;
  }
  .form-print-root .cur-row:not(:last-child) .cur-td,
  .form-print-root .cur-th {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .cur-th--yes {
    background: #1b6b2f !important;
    color: #ffffff !important;
  }
  .form-print-root .cur-th--no {
    background: #9b1c1c !important;
    color: #ffffff !important;
  }
  .form-print-root .cur-th--na {
    background: #334155 !important;
    color: #ffffff !important;
  }
  .form-print-root .cur-row:nth-child(even) .cur-td--letter,
  .form-print-root .cur-row:nth-child(even) .cur-td--desc {
    background: #eef2ff !important;
  }
  .form-print-root .cur-td--yes {
    background: #edf7ef !important;
  }
  .form-print-root .cur-td--no {
    background: #fdeeee !important;
  }
  .form-print-root .cur-td--na {
    background: #f1f5f9 !important;
  }
  .form-print-root .cur-td--choice-block {
    background: #171717 !important;
    padding: 0 !important;
  }
  .form-print-root .cur-time-input,
  .form-print-root .cur-time-value {
    background: #ffffff !important;
  }
  .form-print-root .cur-table-wrap {
    flex: 0 0 auto !important;
    overflow: visible !important;
  }
  .form-print-root .cur-table {
    width: 100% !important;
    table-layout: fixed !important;
    font-size: 7.5pt !important;
  }
  .form-print-root .cur-footer-note {
    border-top: 0.5px solid #64748b !important;
    color: #475569 !important;
  }
  .form-print-root .form-page-section:has(.cur-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .form-page-content--control-unit-record {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  /* Voice communication test — 22.3 */
  .form-print-root .vct-panel {
    --vct-line: 0.5px solid #64748b !important;
    flex: 0 0 auto !important;
    min-height: auto !important;
    max-height: none !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    margin-top: 0 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    font-size: 6.5pt !important;
    line-height: 1.15 !important;
    color: #171717 !important;
    background: #ffffff !important;
  }
  .form-print-root .vct-na-bar {
    background: #e2e8f0 !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .vct-ref-bar {
    background: linear-gradient(180deg, #1b6b2f 0%, #14532d 100%) !important;
    color: #ffffff !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .vct-info-row {
    background: linear-gradient(180deg, #d9e4b8 0%, #c4d4a3 100%) !important;
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .vct-info-input,
  .form-print-root .vct-info-value {
    background: #ffffff !important;
  }
  .form-print-root .vct-th,
  .form-print-root .vct-td {
    border-right: 0.5px solid #64748b !important;
    padding: 0.5pt 1.5pt !important;
  }
  .form-print-root .vct-row:not(:last-child) .vct-td,
  .form-print-root .vct-th {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .vct-th--yes {
    background: #1b6b2f !important;
    color: #ffffff !important;
  }
  .form-print-root .vct-th--no {
    background: #9b1c1c !important;
    color: #ffffff !important;
  }
  .form-print-root .vct-th--na {
    background: #334155 !important;
    color: #ffffff !important;
  }
  .form-print-root .vct-td {
    background: #edf7ef !important;
  }
  .form-print-root .vct-td--yes {
    background: #edf7ef !important;
  }
  .form-print-root .vct-td--no {
    background: #fdeeee !important;
  }
  .form-print-root .vct-td--na {
    background: #f1f5f9 !important;
  }
  .form-print-root .vct-table-wrap {
    flex: 0 0 auto !important;
    overflow: visible !important;
  }
  .form-print-root .vct-table {
    width: 100% !important;
    table-layout: fixed !important;
    font-size: 7.5pt !important;
  }

  .form-print-root .form-page-section:has(.vct-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .form-page-content--voice-communication-test {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    gap: 3pt !important;
    margin-top: 2pt !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .form-page-section:has(.vct-panel) .form-page-section-title,
  .form-print-root .form-page-sheet--voice-communication-test .form-page-section:has(.psi-panel) .form-page-section-title {
    margin-bottom: 2pt !important;
    font-size: 8.5pt !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .vct-na-bar,
  .form-print-root .form-page-sheet--voice-communication-test .vct-ref-bar,
  .form-print-root .form-page-sheet--voice-communication-test .psi-banner {
    padding: 1pt 3pt !important;
    line-height: 1.1 !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .vct-info-row,
  .form-print-root .form-page-sheet--voice-communication-test .psi-info-row {
    min-height: 0 !important;
    padding: 0.5pt 2pt !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .vct-th,
  .form-print-root .form-page-sheet--voice-communication-test .vct-td,
  .form-print-root .form-page-sheet--voice-communication-test .psi-th,
  .form-print-root .form-page-sheet--voice-communication-test .psi-td {
    padding: 0.5pt 1pt !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .vct-check-cell,
  .form-print-root .form-page-sheet--voice-communication-test .psi-check-cell {
    min-height: 0 !important;
    padding: 0.5pt !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .form-page-section:has(.psi-panel) {
    flex: 0 0 auto !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .form-page-section:has(.psi-panel) > div,
  .form-print-root
    .form-page-sheet--voice-communication-test
    .form-page-section:has(.psi-panel)
    .form-element-frame--flush {
    flex: 0 0 auto !important;
    height: auto !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .psi-panel {
    height: auto !important;
    grid-template-rows: auto auto auto !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .psi-table-wrap {
    flex: 0 0 auto !important;
    overflow: visible !important;
  }
  .form-print-root .form-page-sheet--voice-communication-test .psi-table,
  .form-print-root .form-page-sheet--voice-communication-test .psi-table thead,
  .form-print-root .form-page-sheet--voice-communication-test .psi-table tbody,
  .form-print-root .form-page-sheet--voice-communication-test .psi-table tbody tr {
    height: auto !important;
  }

  /* 22.5 only — full page slot */
  .form-print-root .form-page-content--emergency-power-supply-test {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-section--emergency-power-supply-test {
    flex: 0 1 auto !important;
    height: auto !important;
    max-height: none !important;
    min-height: 95% !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-section--emergency-power-supply-test .form-element-frame--flush {
    flex: 0 1 auto !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-panel {
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
    max-height: none !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    padding-bottom: 1pt !important;
    font-size: 7pt !important;
    line-height: 1.12 !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-table-wrap {
    flex: 0 1 auto !important;
    overflow: visible !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-table-wrap > .epst-table,
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-table--generator {
    height: auto !important;
    table-layout: fixed !important;
    font-size: 8pt !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-table-wrap > .epst-table tbody tr,
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-table--generator tbody tr {
    height: auto !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 8ch minmax(2.25rem, max-content) !important;
    column-gap: 1.5pt !important;
    align-items: center !important;
    width: 100% !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line .epst-desc-text {
    grid-column: 1 !important;
    min-width: 0 !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line .epst-field-value,
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line .epst-field-input {
    grid-column: 2 !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line .epst-field-unit {
    grid-column: 3 !important;
  }
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line--wide .epst-field-value,
  .form-print-root .form-page-sheet--emergency-power-supply-test .epst-desc-line--wide .epst-field-input {
    grid-column: 2 / 4 !important;
  }
  .form-print-root .form-page-section--emergency-power-supply-test .form-page-section-title {
    margin-bottom: 2pt !important;
    font-size: 8.5pt !important;
  }

  /* Annunciator page — 22.6 + 22.7 (layout only; colors from components.css) */
  .form-print-root .form-page-content--annunciator-device-test {
    display: grid !important;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr) !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    gap: 3pt !important;
    margin-top: 2pt !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .form-page-section:has(.artu-panel),
  .form-print-root .form-page-sheet--annunciator-device-test .form-page-section:has(.asd-panel) {
    display: flex !important;
    flex-direction: column !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .form-page-section:has(.artu-panel) .form-page-section-title,
  .form-print-root .form-page-sheet--annunciator-device-test .form-page-section:has(.asd-panel) .form-page-section-title {
    flex-shrink: 0 !important;
    margin: 0 0 1pt !important;
    padding: 0 !important;
    line-height: 1.1 !important;
    font-size: 8.5pt !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-panel,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-panel {
    --artu-line: 0.5px solid #64748b !important;
    --asd-line: 0.5px solid #64748b !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    max-height: none !important;
    width: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    margin-top: 0 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    font-size: 6.75pt !important;
    line-height: 1.1 !important;
    display: grid !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-panel {
    grid-template-rows: auto auto auto minmax(0, 1fr) !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .asd-panel {
    grid-template-rows: auto auto minmax(0, 1fr) !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-th,
  .form-print-root .form-page-sheet--annunciator-device-test .artu-td,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-th,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-td {
    border-right: 0.5px solid #64748b !important;
    padding: 0.5pt 1pt !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-row:not(:last-child) .artu-td,
  .form-print-root .form-page-sheet--annunciator-device-test .artu-th,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-row:not(:last-child) .asd-td,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-th {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-table-wrap,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-table-wrap {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-table,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-table {
    width: 100% !important;
    height: 100% !important;
    table-layout: fixed !important;
    font-size: 7.25pt !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-table tbody tr,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-table tbody tr {
    height: calc(100% / 13) !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .form-page-section:has(.artu-panel) .form-element-frame--flush,
  .form-print-root .form-page-sheet--annunciator-device-test .form-page-section:has(.asd-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: 100% !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-na-bar,
  .form-print-root .form-page-sheet--annunciator-device-test .artu-ref-bar,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-na-bar,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-ref-bar {
    padding: 0.5pt 2pt !important;
    line-height: 1.08 !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-info-row,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-info-row {
    min-height: 0 !important;
    padding: 0.5pt 2pt !important;
  }
  .form-print-root .form-page-sheet--annunciator-device-test .artu-check-cell,
  .form-print-root .form-page-sheet--annunciator-device-test .asd-check-cell {
    min-height: 0 !important;
    padding: 0.5pt !important;
  }

  /* Affirmation block — match panel frame + thin grid lines in PDF. */
  .form-print-root .aff-panel {
    --aff-line: 0.5px solid #64748b !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    margin-top: 0 !important;
  }
  .form-print-root .form-page-section:has(.aff-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .aff-title,
  .form-print-root .aff-label {
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    color: #334155 !important;
  }
  .form-print-root .aff-body {
    background: #f1f5f9 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
  }
  .form-print-root .aff-fields .aff-cell,
  .form-print-root .aff-tech-grid > .aff-cell {
    min-height: 3.5rem !important;
  }
  .form-print-root .aff-title,
  .form-print-root .aff-body {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .aff-tech-grid > .aff-cell,
  .form-print-root .aff-tech-grid > .aff-label {
    border: none !important;
  }
  .form-print-root .aff-tech-grid > .aff-cell:not(:nth-child(4n + 1)),
  .form-print-root .aff-tech-grid > .aff-label:not(:nth-child(4n + 1)) {
    border-left: 0.5px solid #64748b !important;
  }
  .form-print-root .aff-tech-grid > .aff-cell:nth-child(-n + 4) {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .aff-tech-grid > .aff-label {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .aff-tech:last-child .aff-tech-grid > .aff-label {
    border-bottom: none !important;
  }
  .form-print-root .aff-tech:not(:last-child) {
    border-bottom: none !important;
  }

  @page a4-landscape { size: A4 landscape; margin: 0; }

  .form-print-root .form-page-sheet--landscape {
    width: 297mm;
    height: 210mm;
    min-height: 210mm;
    max-height: 210mm;
    page: a4-landscape;
  }

  .form-print-root .form-page-sheet--landscape .form-page-body {
    padding: 0.625rem 0.5rem 0 !important;
  }

  /* Fixed A4 layout — stretch content toward page bottom (PDF export only). */
  .form-print-root .form-page-sheet--fixed {
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed .form-page-body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed .form-page-content {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    gap: 0.5rem !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.yns-table-wrap) {
    flex: 1 1 0 !important;
    flex-shrink: 1 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.ulc-s1-panel) {
    flex: 0 0 auto !important;
    flex-shrink: 0 !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.aff-panel) {
    flex: 0 0 auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.doc-panel) {
    flex: 0 1 auto !important;
    flex-shrink: 0 !important;
    min-height: auto !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.cut-panel) {
    flex: 0 1 auto !important;
    flex-shrink: 0 !important;
    min-height: auto !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.cur-panel) {
    flex: 0 1 auto !important;
    flex-shrink: 0 !important;
    min-height: auto !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.yns-table-wrap) > div {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.ulc-s1-panel) > div {
    flex: 0 0 auto !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.aff-panel) > div {
    flex: 0 0 auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.doc-panel) > div {
    flex: 0 1 auto !important;
    min-height: auto !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.cut-panel) > div {
    flex: 0 1 auto !important;
    min-height: auto !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.cur-panel) > div {
    flex: 0 1 auto !important;
    min-height: auto !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.ulc-s1-panel) .form-element-frame--flush {
    flex: 0 0 auto !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.aff-panel) .form-element-frame--flush {
    flex: 0 0 auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.doc-panel) .form-element-frame--flush {
    flex: 0 1 auto !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.cut-panel) .form-element-frame--flush {
    flex: 0 1 auto !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .form-page-section:has(.cur-panel) .form-element-frame--flush {
    flex: 0 1 auto !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed .form-element-frame--flush {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-panel {
    flex: 0 0 auto !important;
    flex-shrink: 0 !important;
    min-height: auto !important;
    max-height: none !important;
    height: auto !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-top {
    flex: 0 0 auto !important;
    width: 100% !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-company {
    flex: 0 0 42% !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-service {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    min-height: auto !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-system-block {
    flex: 0 0 auto !important;
    width: 100% !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-system-types {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-circuits {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-system-row {
    flex: 1 1 0 !important;
    min-height: 0 !important;
  }
  .form-print-root .form-page-sheet--fixed .ulc-s1-bottom {
    flex: 0 0 auto !important;
    flex-shrink: 0 !important;
  }
  .form-print-root .form-page-sheet--fixed .yns-table-wrap {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed .yns-table {
    height: 100% !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .yns-row {
    height: calc(100% / 7) !important;
  }
  .form-print-root .form-page-sheet--fixed:not(.form-page-sheet--landscape) .yns-td {
    vertical-align: middle !important;
  }
  .form-print-root .form-page-sheet--fixed .aff-panel {
    flex: 0 0 auto !important;
  }
  .form-print-root .form-page-sheet--fixed .aff-body {
    flex: 0 0 auto !important;
  }
  .form-print-root .form-page-sheet--fixed.form-page-sheet--landscape .form-page-section {
    flex: 1 1 auto !important;
    flex-shrink: 1 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed.form-page-sheet--landscape .form-page-section > div {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .form-print-root .form-page-sheet--fixed .def-panel {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: 100% !important;
  }
  .form-print-root .form-page-sheet--fixed .def-grid {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    grid-template-rows:
      auto
      auto
      repeat(6, minmax(1.375rem, 1fr))
      auto
      repeat(5, minmax(1.375rem, 1fr)) !important;
  }
  .form-print-root .form-page-sheet--fixed .def-data-strip {
    min-height: 100% !important;
    height: 100% !important;
  }
  .form-print-root .form-page-sheet--fixed .def-cell {
    min-height: 100% !important;
  }
  .form-print-root .form-page-sheet--fixed .def-cell-input,
  .form-print-root .form-page-sheet--fixed .def-cell-value {
    min-height: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;
  }

  .form-print-root .ulc-s1-panel,
  .form-print-root .yns-table-wrap,
  .form-print-root .aff-panel,
  .form-print-root .def-grid,
  .form-print-root .def-compliance,
  .form-print-root .ln-panel,
  .form-print-root .att-table-wrap,
  .form-print-root .doc-panel,
  .form-print-root .cut-panel,
  .form-print-root .cur-panel,
  .form-print-root .vct-panel,
  .form-print-root .psi-panel,
  .form-print-root .epst-panel,
  .form-print-root .artu-panel,
  .form-print-root .asd-panel {
    border: 2pt solid #000000 !important;
    border-radius: 0.625rem !important;
  }

  .form-print-root .ulc-s1-panel,
  .form-print-root .att-table-wrap,
  .form-print-root .doc-panel,
  .form-print-root .cut-panel,
  .form-print-root .cur-panel,
  .form-print-root .vct-panel,
  .form-print-root .psi-panel,
  .form-print-root .epst-panel,
  .form-print-root .artu-panel,
  .form-print-root .asd-panel {
    overflow: hidden !important;
  }

  .form-print-root .def-grid {
    border-radius: 0.625rem !important;
    overflow: hidden !important;
  }

  .form-print-root .def-compliance {
    background: #cfe2f3 !important;
    border-radius: 0.625rem !important;
  }

  .form-print-root .def-head-cell,
  .form-print-root .def-cell {
    border: none !important;
    border-right: 0.5px solid #64748b !important;
    border-bottom: 0.5px solid #64748b !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .form-print-root .def-head-strip--device-left .def-head-cell:last-child,
  .form-print-root .def-head-strip--control-left .def-head-cell:last-child,
  .form-print-root .def-head-strip--repair .def-head-cell:last-child,
  .form-print-root .def-data-strip--device-left .def-cell:last-child,
  .form-print-root .def-data-strip--control-left .def-cell:last-child,
  .form-print-root .def-data-strip--repair .def-cell:last-child {
    border-right: none !important;
  }
  .form-print-root .def-grid > .def-data-strip:nth-last-child(-n + 2) .def-cell {
    border-bottom: none !important;
  }
  .form-print-root .def-section-divider {
    border-top: 2px solid #171717 !important;
  }
  .form-print-root .def-meta td {
    border-color: #64748b !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .form-print-root .def-grid-left {
    border-right: 2px solid #171717 !important;
  }

  .form-print-root .def-banner--inspect {
    background: #d9ead3 !important;
  }

  .form-print-root .def-banner--repair {
    background: #fce5cd !important;
  }

  .form-print-root .def-red-bar {
    background: #cc0000 !important;
  }

  .form-print-root .form-page-meta-table td {
    background: #ffffff !important;
    border-color: #64748b !important;
  }

  .form-print-root .def-head-strip--device-left .def-head-cell,
  .form-print-root .def-head-strip--repair .def-head-cell {
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    color: #334155 !important;
  }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Collect every stylesheet the live document uses (Tailwind + theme + components). */
async function collectDocumentCss(): Promise<string> {
  const parts: string[] = [];
  const sheets = Array.from(document.styleSheets);

  for (const sheet of sheets) {
    try {
      const rules = sheet.cssRules;
      let text = '';
      for (let i = 0; i < rules.length; i += 1) {
        text += rules[i].cssText + '\n';
      }
      if (text) parts.push(text);
    } catch {
      // Cross-origin / file:// stylesheets block cssRules — fetch the source.
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href);
          parts.push(await res.text());
        } catch {
          /* skip unreadable sheet */
        }
      }
    }
  }

  return parts.join('\n');
}

export interface FormPrintInput {
  form: FormDefinition;
  values: Record<string, unknown>;
  context: DocumentContext | null;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
  title: string;
  linedNotesVisibleLines?: Record<string, number>;
  linedNotesRowHeights?: Record<string, number>;
}

/**
 * Build a fully self-contained, print-ready HTML document by rendering the SAME
 * React page components used in the editor (read-only) and embedding the SAME
 * CSS the renderer is using. This guarantees the PDF matches the document view.
 */
export async function buildFormPrintHtml({
  form,
  values,
  context,
  template,
  title,
  linedNotesVisibleLines,
  linedNotesRowHeights: linedNotesRowHeightsInput,
}: FormPrintInput): Promise<string> {
  const linedNotesRowHeights =
    linedNotesRowHeightsInput ??
    (await measureLinedNotesPdfRowHeights({
      form,
      values,
      context,
      template,
      linedNotesVisibleLines,
      printCss: PRINT_OVERRIDES,
    }));

  const pagesMarkup = form.pages
    .map((page, index) =>
      renderToStaticMarkup(
        <FormPageCanvas
          form={form}
          page={page}
          pageIndex={index}
          template={template}
          context={context}
          values={values}
          readOnly
          fixedPageLayout
          linedNotesVisibleLines={linedNotesVisibleLines}
          linedNotesRowHeights={linedNotesRowHeights}
        />,
      ),
    )
    .join('');

  const css = await collectDocumentCss();

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
  <style>${PRINT_OVERRIDES}</style>
</head>
<body>
  <div class="form-print-root">${pagesMarkup}</div>
</body>
</html>`;
}
