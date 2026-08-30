import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Clickable table header for tickbox / choice columns (fills the whole page column). */
export function ChoiceColumnHeader({
  className,
  style,
  children,
  applyLabel,
  readOnly,
  onApply,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Tooltip / aria — e.g. "Set all rows to Yes". */
  applyLabel: string;
  readOnly?: boolean;
  onApply?: () => void;
}) {
  if (readOnly || !onApply) {
    return (
      <th className={className} style={style}>
        {children}
      </th>
    );
  }

  return (
    <th className={cn(className, 'ba-choice-col-th')} style={style}>
      <button
        type="button"
        className="ba-choice-col-th-btn"
        title={applyLabel}
        aria-label={applyLabel}
        onClick={onApply}
      >
        {children}
      </button>
    </th>
  );
}
