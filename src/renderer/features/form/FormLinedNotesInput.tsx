import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { LAZY_COMMIT_MS } from '../../components/LazyCommitInput';
import {
  clampLinedNotesToMaxLines,
  linedNotesLineCount,
  type LinedNotesValue,
} from '../../../shared/form/linedNotes';

export function FormLinedNotesInput({
  value,
  lineCount,
  onChange,
}: {
  value: string;
  lineCount: number;
  onChange?: (value: LinedNotesValue) => void;
}) {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const clamped = clampLinedNotesToMaxLines(local, lineCount);
    if (clamped === value) return;
    const id = window.setTimeout(() => onChangeRef.current?.(clamped), LAZY_COMMIT_MS);
    return () => window.clearTimeout(id);
  }, [local, value, lineCount]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setLocal(clampLinedNotesToMaxLines(event.target.value, lineCount));
  };

  const handleBlur = () => {
    const clamped = clampLinedNotesToMaxLines(local, lineCount);
    if (clamped !== value) onChangeRef.current?.(clamped);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (linedNotesLineCount(local) >= lineCount) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    const clamped = clampLinedNotesToMaxLines(value, lineCount);
    if (clamped !== value) onChangeRef.current?.(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clamp when row budget changes
  }, [lineCount]);

  return (
    <textarea
      className="ln-body ln-body--input"
      value={local}
      spellCheck={false}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
