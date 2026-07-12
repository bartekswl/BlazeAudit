import type { InputHTMLAttributes } from 'react';

/** Click the active option again to clear — standard for inspection checklist radios. */
export function formToggleRadioInputProps<T extends string>({
  choice,
  variant,
  onSelect,
  onClear,
}: {
  choice: T | null;
  variant: T;
  onSelect: () => void;
  onClear: () => void;
}): Pick<InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange' | 'onClick'> {
  return {
    checked: choice === variant,
    onClick: () => {
      if (choice === variant) onClear();
    },
    onChange: onSelect,
  };
}
