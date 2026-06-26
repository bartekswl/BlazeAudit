import { type InputHTMLAttributes, useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

/** Trim text until it fits the input's rendered width (single line). */
export function clampInputToVisibleWidth(input: HTMLInputElement, value: string): string {
  const width = input.clientWidth > 0 ? input.clientWidth : input.closest('td')?.clientWidth ?? 0;
  if (width <= 0) return value;

  let next = value;
  input.value = next;
  while (next.length > 0 && input.scrollWidth > width) {
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

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clamped = clampInputToVisibleWidth(el, value);
    if (clamped !== value) onChangeRef.current(clamped);
  }, [value]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const current = el.value;
      const clamped = clampInputToVisibleWidth(el, current);
      if (clamped !== current) onChangeRef.current(clamped);
    };

    const observer = new ResizeObserver(sync);
    observer.observe(el);
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
    />
  );
}
