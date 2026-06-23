import { useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
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
  useEffect(() => {
    const clamped = clampLinedNotesToMaxLines(value, lineCount);
    if (clamped !== value) onChange?.(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clamp when row budget changes
  }, [lineCount]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(clampLinedNotesToMaxLines(event.target.value, lineCount));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (linedNotesLineCount(value) >= lineCount) {
      event.preventDefault();
    }
  };

  return (
    <textarea
      className="ln-body ln-body--input"
      value={value}
      spellCheck={false}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}
