/** Print/PDF stylesheet — mirrors `components.css` form-page + ulc-s1 rules (light theme). */
export const FORM_PAGE_PRINT_CSS = `
  html { font-size: 16px; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 10pt;
    color: #171717;
    margin: 0;
    background: #fff;
  }
  .form-page.form-page-sheet {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    overflow: hidden;
    background: #ffffff;
    color: #171717;
    --ba-text-primary: #171717;
    --ba-text-secondary: #262626;
    --ba-text-muted: #525252;
    --ba-input-bg: #ffffff;
    --ba-input-border: #d4d4d4;
    --ba-panel-border: #e5e5e5;
    --ba-table-head-bg: linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%);
    --ba-form-page-footer-border: #e5e5e5;
    --ba-form-page-footer-count: #171717;
    --ba-form-page-footer-disclaimer: #737373;
  }
  .form-page.form-page-sheet:last-child { page-break-after: auto; }
  .form-page-header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.125rem;
    flex-shrink: 0;
  }
  .form-page-header-line {
    line-height: 1.25;
    font-size: calc(0.875rem + 1pt);
    font-weight: 600;
    color: #171717;
  }
  .form-page-header-line.align-center { text-align: center; }
  .form-page-header-line.align-right { text-align: right; }
  .form-page-body {
    display: flex;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    padding: 1rem 1.25rem 0;
    flex: 1;
  }
  .form-page-content {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 0.75rem;
    overflow: hidden;
    margin-top: 1rem;
  }
  .form-page-section { flex-shrink: 0; }
  .form-page-section--ulc {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .form-page-section-elements--ulc {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .form-page-section-title {
    margin: 0 0 0.25rem;
    text-align: center;
    font-size: calc(0.8125rem + 1pt);
    font-weight: 700;
    color: #171717;
  }
  .form-element-frame {
    border-radius: 0.5rem;
    border: 1px solid #e5e5e5;
    background: rgb(0 0 0 / 0.02);
    padding: 0.625rem;
  }
  .form-element-frame--flush {
    border: none;
    background: transparent;
    padding: 0;
    border-radius: 0;
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
  }
  .form-pdf-text { font-size: 0.75rem; }
  .form-pdf-label {
    margin: 0 0 0.25rem;
    font-weight: 500;
    color: #525252;
  }
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
  .form-page-footer {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    border-top: 1px solid #e5e5e5;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    margin-top: auto;
  }
  .form-page-footer-count {
    padding: 0.25rem 0 0;
    text-align: right;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.25;
    color: #171717;
  }
  .form-page-footer-disclaimer {
    margin: 0;
    padding: 0.125rem 0 0.5rem;
    text-align: center;
    font-size: 0.625rem;
    line-height: 1.4;
    color: #737373;
  }
  .embed { display: none; }
`;

export const ULC_SECTION1_PRINT_CSS = `
  .ulc-s1-panel {
    --ulc-line: 1px solid rgb(148 163 184 / 0.45);
    --ulc-label-bg: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%);
    --ulc-label-bg-muted: #f1f5f9;
    --ulc-stage-bg: #f8fafc;
    --ulc-head-bg: linear-gradient(180deg, #475569 0%, #334155 100%);
    --ulc-accent: linear-gradient(90deg, #38bdf8 0%, #2563eb 100%);
    display: flex;
    flex-direction: column;
    height: auto;
    max-height: 100%;
    min-height: 0;
    flex: 1;
    border: var(--ulc-line);
    border-radius: 0.625rem;
    box-shadow:
      0 1px 2px rgb(15 23 42 / 0.04),
      0 6px 16px rgb(15 23 42 / 0.06);
    overflow: hidden;
    font-size: 0.6875rem;
    line-height: 1.15;
    color: #171717;
    background: rgb(255 255 255 / 0.98);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ulc-s1-top {
    display: flex;
    border-bottom: var(--ulc-line);
    flex: 0 0 auto;
    min-height: 0;
  }
  .ulc-s1-company {
    flex: 0 0 42%;
    display: flex;
    flex-direction: column;
    border-right: var(--ulc-line);
  }
  .ulc-s1-company-inner {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.25rem 0.25rem 0.375rem;
    min-height: 0;
  }
  .ulc-s1-logo {
    flex: 0 0 38%;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    padding: 0.25rem;
    min-height: 0;
  }
  .ulc-s1-logo-img {
    max-width: 100%;
    max-height: 3.125rem;
    object-fit: contain;
  }
  .ulc-s1-logo-placeholder {
    color: #64748b;
    font-style: italic;
    font-weight: 400;
    font-size: inherit;
    text-align: center;
    line-height: 1.3;
  }
  .ulc-s1-company-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: center;
    min-width: 0;
    padding: 0.125rem 0.25rem 0.125rem 0.625rem;
    font-size: inherit;
    line-height: 1.3;
  }
  .ulc-s1-company-placeholder { color: #64748b; font-style: italic; }
  .ulc-s1-company-name { font-weight: 700; margin-bottom: 0.125rem; }
  .ulc-s1-company-details .ulc-s1-company-name,
  .ulc-s1-company-details .ulc-s1-company-line { color: #171717; }
  .form-page-sheet .ulc-s1-value { color: #171717; }
  .form-page-sheet .ulc-s1-service-row--header .ulc-s1-cell:nth-child(1) .ulc-s1-value,
  .form-page-sheet .ulc-s1-service-row--header .ulc-s1-cell:nth-child(2) .ulc-s1-value {
    justify-content: center;
    text-align: center;
  }
  .ulc-s1-company-line + .ulc-s1-company-line { margin-top: 0.0625rem; }
  .ulc-s1-service {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ulc-s1-service-row {
    display: flex;
    border-bottom: var(--ulc-line);
  }
  .ulc-s1-service-row--header {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ulc-s1-service-row--header .ulc-s1-cell {
    border-right: var(--ulc-line);
  }
  .ulc-s1-service-row--header .ulc-s1-cell:last-child {
    border-right: none;
  }
  .ulc-s1-service-row--stage {
    background: var(--ulc-stage-bg);
    padding: 0.0625rem 0.25rem;
    gap: 0.375rem;
    align-items: center;
    font-weight: 600;
    min-height: 1rem;
  }
  .ulc-s1-system-block {
    display: flex;
    align-items: stretch;
    border-bottom: var(--ulc-line);
    flex: 0 0 auto;
    min-height: 0;
  }
  .ulc-s1-system-types {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: var(--ulc-line);
    min-width: 0;
    align-self: stretch;
    min-height: 0;
  }
  .ulc-s1-system-row {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    border-bottom: var(--ulc-line);
    min-height: 0;
  }
  .ulc-s1-system-row:last-child { border-bottom: none; }
  .ulc-s1-system-row--alt { background: var(--ulc-label-bg-muted); }
  .ulc-s1-system-row .ulc-s1-check {
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: stretch;
    min-height: 100%;
    padding: 0.125rem 0.375rem;
    border-right: var(--ulc-line);
    font-weight: 600;
  }
  .ulc-s1-system-row .ulc-s1-check:last-child { border-right: none; }
  .ulc-s1-circuits {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    align-self: stretch;
  }
  .ulc-s1-circuits-title {
    background: var(--ulc-head-bg);
    color: #f8fafc;
    font-weight: 700;
    text-align: center;
    padding: 0.125rem 0.25rem;
    border-bottom: var(--ulc-line);
    font-size: inherit;
    line-height: 1.15;
    letter-spacing: 0.02em;
  }
  .ulc-s1-circuits .ulc-s1-cell {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: 42% minmax(0, 1fr);
    border-bottom: var(--ulc-line);
    min-height: 1rem;
  }
  .ulc-s1-circuits .ulc-s1-cell:last-child { border-bottom: none; }
  .ulc-s1-circuits .ulc-s1-label {
    display: flex;
    align-items: center;
    border-right: var(--ulc-line);
    border-bottom: none;
    background: var(--ulc-label-bg-muted);
  }
  .ulc-s1-circuits .ulc-s1-value {
    display: flex;
    align-items: center;
    border-bottom: none;
    min-height: 0;
  }
  .ulc-s1-cell {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .ulc-s1-label {
    background: var(--ulc-label-bg);
    font-weight: 700;
    padding: 0.0625rem 0.25rem;
    border-bottom: var(--ulc-line);
    font-size: inherit;
    line-height: 1.1;
    display: flex;
    align-items: center;
    min-height: 1rem;
    color: #334155;
  }
  .ulc-s1-value {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 0.0625rem 0.25rem;
    min-height: 1rem;
    background: #fff;
  }
  .ulc-s1-value--inline {
    flex: 1;
    border-bottom: var(--ulc-line);
    min-width: 2rem;
    padding: 0 0.1875rem;
    min-height: 1.125rem;
  }
  .ulc-s1-check {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }
  .ulc-s1-check--other {
    flex: 1;
    min-width: 0;
  }
  .ulc-s1-check-box {
    font-size: inherit;
    line-height: 1;
  }
  .ulc-s1-phone-fax {
    display: grid;
    grid-template-rows: minmax(2.25rem, 1fr) minmax(1.25rem, 1fr);
    min-width: 0;
    min-height: 0;
    height: 100%;
  }
  .ulc-s1-phone-fax .ulc-s1-cell {
    border-bottom: var(--ulc-line);
    min-height: 0;
  }
  .ulc-s1-phone-fax .ulc-s1-cell:last-child { border-bottom: none; }
  .ulc-s1-phone-value { min-height: 2.25rem; }
  .ulc-s1-bottom { flex-shrink: 0; }
  .ulc-s1-bottom-row {
    display: grid;
    grid-template-columns: 42% minmax(0, 1fr) minmax(0, 1fr) 8.775rem;
    align-items: stretch;
    border-bottom: var(--ulc-line);
  }
  .ulc-s1-bottom-row:last-child { border-bottom: none; }
  .ulc-s1-bottom-row--3col > :nth-child(1) { grid-column: 1; }
  .ulc-s1-bottom-row--3col > :nth-child(2) { grid-column: 2 / 4; }
  .ulc-s1-bottom-row--3col > :nth-child(1).ulc-s1-cell,
  .ulc-s1-bottom-row--3col > .ulc-s1-city-postal { border-right: var(--ulc-line); }
  .ulc-s1-bottom-row--3col > :nth-child(2).ulc-s1-cell { border-right: var(--ulc-line); }
  .ulc-s1-bottom-row--3col > :nth-child(3) { grid-column: 4; }
  .ulc-s1-city-postal {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.85fr);
    min-width: 0;
    min-height: 0;
    border-right: var(--ulc-line);
  }
  .ulc-s1-city-postal > .ulc-s1-cell {
    border-right: var(--ulc-line);
    min-height: 0;
  }
  .ulc-s1-city-postal > .ulc-s1-cell:last-child { border-right: none; }
  .ulc-s1-bottom-row .ulc-s1-cell { border-right: var(--ulc-line); }
  .ulc-s1-bottom-row .ulc-s1-phone-fax {
    border-right: none;
    border-left: var(--ulc-line);
    width: 100%;
    min-width: 0;
  }
`;
