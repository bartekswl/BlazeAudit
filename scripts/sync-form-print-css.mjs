import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsPath = path.join(root, 'src/renderer/theme/components.css');
const outPath = path.join(root, 'src/shared/form/formPrintAppCss.generated.ts');

const raw = fs.readFileSync(componentsPath, 'utf8');

function stripDarkThemeRules(css) {
  return css.replace(/\[data-theme='dark'\][^{]+\{[^}]*\}/g, '');
}

const sheet = raw.indexOf('.form-page-sheet');
const header = raw.indexOf('.form-page-header');
const flush = raw.indexOf('.form-element-frame--flush');
const ulc = raw.indexOf('.ulc-s1-panel');
const darkUlc = raw.indexOf("[data-theme='dark'] .ulc-s1-panel");
const lightStart = raw.indexOf("[data-theme='light'] .form-page-sheet");
const lightEnd = raw.indexOf("[data-theme='dark']", lightStart);
const flushEnd = raw.indexOf('}', flush) + 1;

if ([sheet, header, flush, ulc, darkUlc].some((i) => i === -1)) {
  console.error('Could not locate form print CSS markers in components.css');
  process.exit(1);
}

let css = [
  raw.slice(sheet, lightEnd > lightStart ? lightEnd : header),
  raw.slice(header, flush),
  raw.slice(flush, flushEnd),
  raw.slice(ulc, darkUlc),
].join('\n');

css = stripDarkThemeRules(css);
css = css.replace(
  /--ulc-line:\s*1px solid rgb\(148 163 184 \/ 0\.45\)/g,
  '--ulc-line: 1px solid #64748b',
);

const out = `/** Auto-generated from components.css — run: node scripts/sync-form-print-css.mjs */
export const FORM_PRINT_APP_CSS = ${JSON.stringify(css)};
`;

fs.writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${outPath} (${css.length} chars)`);
