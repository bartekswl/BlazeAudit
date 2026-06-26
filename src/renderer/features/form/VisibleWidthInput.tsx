import { type InputHTMLAttributes, useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

/** Trim text until it fits the input's rendered width (single line). */
export function clampInputToVisibleWidth(input: HTMLInputElement, value: string): string {
  const inIdrGrid = Boolean(input.closest('.idr-table'));
  const box = input.closest('.fdtl-field-box, [data-visible-width-box]') as HTMLElement | null;
  const cell = input.closest('td, th') as HTMLElement | null;

  if (inIdrGrid) {
    const inputWidth = input.clientWidth;
    // Layout not ready — do not block typing.
    if (inputWidth < 8) return value;

    let next = value;
    input.value = next;
    while (next.length > 0 && input.scrollWidth > inputWidth) {
      next = next.slice(0, -1);
      input.value = next;
    }
    return next;
  }

  const width = box?.clientWidth || cell?.clientWidth || input.clientWidth || 0;
  if (width <= 0) return value;

  const style = getComputedStyle(input);
  const inset =
    parseFloat(style.paddingLeft) +
    parseFloat(style.paddingRight) +
    parseFloat(style.borderLeftWidth) +
    parseFloat(style.borderRightWidth);
  const maxWidth = Math.floor(width - inset);
  // Too narrow to measure reliably — do not block typing.
  if (maxWidth < 8) return value;

  let next = value;
  input.value = next;
  while (next.length > 0 && input.scrollWidth > maxWidth) {
    next = next.slice(0, -1);
    input.value = next;
  }
  return next;
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
