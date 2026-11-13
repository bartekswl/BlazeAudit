import { InspectionDateField } from '../../components/InspectionDateField';
import {
  datePickerValueFromStored,
  formatMmDdYyFromIso,
  normalizeIsoDateInput,
} from '../../../shared/dates';
import { cn } from '../../lib/cn';

export type FormGridDateStoreFormat = 'iso' | 'mmddyy';

export function storedDateFromPicker(iso: string, format: FormGridDateStoreFormat): string {
  if (!iso.trim()) return '';
  if (format === 'mmddyy') return formatMmDdYyFromIso(iso);
  return normalizeIsoDateInput(iso);
}

export function FormGridDateCell({
  value,
  readOnly,
  onChange,
  storeFormat = 'iso',
  valueClassName,
  wrapClassName,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
  storeFormat?: FormGridDateStoreFormat;
  valueClassName?: string;
  wrapClassName?: string;
}) {
  if (readOnly) {
    return <span className={valueClassName}>{value || '\u00a0'}</span>;
  }

  const pickerValue = datePickerValueFromStored(value);

  return (
    <div className={cn('form-grid-date-wrap', wrapClassName)}>
      <InspectionDateField
        compact
        value={pickerValue}
        onChange={(iso) => onChange?.(storedDateFromPicker(iso, storeFormat))}
        className="form-grid-date-field"
      />
    </div>
  );
}
