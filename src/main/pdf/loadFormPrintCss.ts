import { FORM_PRINT_APP_CSS } from '../../shared/form/formPrintAppCss.generated';

/** Page shell + print tweaks — layout/CSS comes from bundled components.css extract. */
const PDF_PRINT_OVERRIDES = `
  html { font-size: 16px; }
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Arial, sans-serif;
    background: #fff;
    color: #171717;
  }
  .form-page.form-page-sheet {
    width: 8.5in;
    height: 11in;
    min-height: 11in;
    max-height: 11in;
    aspect-ratio: unset;
    page-break-after: always;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }
  .form-page.form-page-sheet:last-child { page-break-after: auto; }
  .form-page-header-line.text-center { text-align: center; }
  .form-page-header-line.text-right { text-align: right; }
  .form-page-header-line.text-left { text-align: left; }
  .form-page-content {
    margin-top: 0.65rem !important;
    gap: 0.4875rem !important;
  }
  .form-page-section-title {
    margin-bottom: 0.1625rem !important;
  }
  .form-page-section--ulc {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .form-page-section-elements--ulc {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .form-pdf-text { font-size: 0.75rem; }
  .form-pdf-label { margin: 0 0 0.25rem; font-weight: 500; color: #525252; }
  .form-pdf-value {
    margin: 0;
    border: 1px solid #d4d4d4;
    border-radius: 0.5rem;
    padding: 0.375rem 0.5rem;
    background: #fff;
    color: #171717;
    min-height: 1.4em;
  }
  .form-pdf-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left; }
  .form-pdf-table th {
    border: 1px solid #e5e5e5;
    background: linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%);
    padding: 0.25rem 0.5rem;
    font-weight: 600;
    color: #262626;
  }
  .form-pdf-table td {
    border: 1px solid #e5e5e5;
    padding: 0.125rem 0.25rem;
    vertical-align: top;
    color: #171717;
  }
  .form-pdf-table .check { text-align: center; width: 2.25rem; }
  .form-pdf-sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .form-page-sheet .ulc-s1-panel {
    box-shadow: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .form-page-sheet .ulc-s1-value {
    font-size: calc(0.6875rem + 1pt);
  }
  .form-page-sheet .ulc-s1-service-row--header .ulc-s1-cell:nth-child(1) .ulc-s1-value,
  .form-page-sheet .ulc-s1-service-row--header .ulc-s1-cell:nth-child(2) .ulc-s1-value {
    justify-content: center;
    text-align: center;
  }
  .form-page-sheet .ulc-s1-city-postal {
    align-self: stretch;
  }
  .form-page-sheet .ulc-s1-city-postal > .ulc-s1-cell {
    height: 100%;
  }

  /* Chromium printToPDF: keep flex/grid dividers visible */
  .form-page-sheet .ulc-s1-panel,
  .form-page-sheet .ulc-s1-top,
  .form-page-sheet .ulc-s1-service-row,
  .form-page-sheet .ulc-s1-system-block,
  .form-page-sheet .ulc-s1-bottom-row,
  .form-page-sheet .ulc-s1-company,
  .form-page-sheet .ulc-s1-system-types,
  .form-page-sheet .ulc-s1-system-row .ulc-s1-check,
  .form-page-sheet .ulc-s1-circuits .ulc-s1-cell,
  .form-page-sheet .ulc-s1-circuits .ulc-s1-label,
  .form-page-sheet .ulc-s1-service-row--header .ulc-s1-cell,
  .form-page-sheet .ulc-s1-bottom-row .ulc-s1-cell,
  .form-page-sheet .ulc-s1-city-postal > .ulc-s1-cell,
  .form-page-sheet .ulc-s1-bottom-row .ulc-s1-phone-fax {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .embed { display: none; }
`;

export function loadFormPrintCss(): string {
  return `${FORM_PRINT_APP_CSS}\n${PDF_PRINT_OVERRIDES}`;
}
