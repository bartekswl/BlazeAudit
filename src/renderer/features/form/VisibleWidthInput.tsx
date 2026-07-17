import { type InputHTMLAttributes, useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

const INPUT_CLIENT_WIDTH_CLAMP_SELECTOR = [
  '.idr-table',
  '.cfts-table',
  '.cur-table',
  '.vct-table',
  '.epst-table',
  '.cur-info-row',
  '.vct-info-row',
  '.epst-info-row',
  '.cut-info-row',
  '.psi-info-row',
  '.artu-info-row',
  '.asd-info-row',
  '.rtsu-info-row',
  '.prt-info-row',
  '.cut-version-field',
  '.aff-cell',
  '.epst-field-input',
  '.def-grid',
  '.def-compliance-field',
  '.att-table',
  '.yns-table-wrap',
  '.doc-table-wrap',
  '.ulc-s1-panel',
  '.adc-table',
  '[data-visible-width-fill]',
].join(', ');

function usesInputClientWidthClamp(input: HTMLInputElement): boolean {
  return Boolean(input.closest(INPUT_CLIENT_WIDTH_CLAMP_SELECTOR));
}

let measureCanvas: HTMLCanvasElement | null = null;

/** Measure rendered text width — input.scrollWidth is not reliable for overflow. */
function measureInputTextWidth(input: HTMLInputElement, text: string): number {
  if (!text) return 0;
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return 0;
  const style = getComputedStyle(input);
  ctx.font = style.font;
  return ctx.measureText(text).width;
}

/** Trim text until it fits the input element's rendered width (single line). */
function clampToInputClientWidth(input: HTMLInputElement, value: string): string {
  const style = getComputedStyle(input);
  const inset =
    parseFloat(style.paddingLeft) +
    parseFloat(style.paddingRight) +
    parseFloat(style.borderLeftWidth) +
    parseFloat(style.borderRightWidth);
  const maxWidth = Math.floor(input.clientWidth - inset);
  // Layout not ready — do not block typing.
  if (maxWidth < 8) return value;

  let next = value;
  while (next.length > 0 && measureInputTextWidth(input, next) > maxWidth) {
    next = next.slice(0, -1);
  }
  return next;
}

/** Trim text until it fits the input's rendered width (single line). */
export function clampInputToVisibleWidth(input: HTMLInputElement, value: string): string {
  if (usesInputClientWidthClamp(input)) {
    return clampToInputClientWidth(input, value);
  }

  const box = input.closest('.fdtl-field-box, [data-visible-width-box]') as HTMLElement | null;
  if (box) {
    if (box.clientWidth < 8) return value;
    return clampToInputClientWidth(input, value);
  }

  // Default: measure the input itself, not a wider table cell.
  return clampToInputClientWidth(input, value);
}

export function VisibleWidthInput({
  className,
  value,
  onChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Trim external / persisted values that overflow — never while the user is typing.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const clamped = clampInputToVisibleWidth(el, value);
    if (clamped !== value) onChangeRef.current(clamped);
  }, [value]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      if (document.activeElement === el) return;
      const current = el.value;
      const clamped = clampInputToVisibleWidth(el, current);
      if (clamped !== current) onChangeRef.current(clamped);
    };

    const observer = new ResizeObserver(sync);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => observer.disconnect();
  }, []);

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      className={cn(className)}
      value={value}
      spellCheck={false}
      onChange={(e) => onChange(clampInputToVisibleWidth(e.currentTarget, e.target.value))}
      onBlur={(e) => {
        const clamped = clampInputToVisibleWidth(e.currentTarget, e.target.value);
        if (clamped !== value) onChange(clamped);
        rest.onBlur?.(e);
      }}
      onPaste={(e) => {
        e.preventDefault();
        const el = e.currentTarget;
        const paste = e.clipboardData.getData('text');
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const merged = el.value.slice(0, start) + paste + el.value.slice(end);
        onChange(clampInputToVisibleWidth(el, merged));
      }}
    />
  );
}
