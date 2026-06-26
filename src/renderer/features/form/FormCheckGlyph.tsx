import { checkGlyphChar } from '../../../shared/form/checkGlyph';
import { cn } from '../../lib/cn';

export function FormCheckGlyph({
  checked,
  className,
}: {
  checked: boolean;
  className: string;
}) {
  return (
    <span className={cn(className, checked && 'form-check-glyph--checked')}>
      {checkGlyphChar(checked)}
    </span>
  );
}
