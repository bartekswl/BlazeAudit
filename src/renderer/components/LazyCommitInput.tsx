import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from 'react';

export const LAZY_COMMIT_MS = 200;

type LazyCommitInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  commitDelayMs?: number;
};

/** Local typing with debounced commit — avoids lifting every keystroke to document state. */
export function LazyCommitInput({
  value,
  onCommit,
  multiline = false,
  commitDelayMs = LAZY_COMMIT_MS,
  className,
  ...rest
}: LazyCommitInputProps) {
  const [local, setLocal] = useState(value);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const id = window.setTimeout(() => onCommitRef.current(local), commitDelayMs);
    return () => window.clearTimeout(id);
  }, [local, value, commitDelayMs]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocal(event.target.value);
  };

  const handleBlur = () => {
    if (local !== value) onCommitRef.current(local);
  };

  if (multiline) {
    return (
      <textarea
        {...rest}
        className={className}
        value={local}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }

  return (
    <input
      {...rest}
      type={rest.type ?? 'text'}
      className={className}
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
