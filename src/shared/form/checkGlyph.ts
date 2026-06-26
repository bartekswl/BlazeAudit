export function checkGlyphChar(checked: boolean): string {
  return checked ? '☑' : '☐';
}

export function renderCheckGlyphHtml(className: string, checked: boolean): string {
  const checkedClass = checked ? ' form-check-glyph--checked' : '';
  return `<span class="${className}${checkedClass}">${checkGlyphChar(checked)}</span>`;
}
