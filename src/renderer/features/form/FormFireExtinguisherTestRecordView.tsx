import {
  FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS,
  normalizeFireExtinguisherTestRecordValue,
  type FireExtinguisherTestRecordValue,
} from '../../../shared/form/fireExtinguisherTestRecord';
import { FormReportRecordGridView } from './FormReportRecordGridView';

export function FormFireExtinguisherTestRecordView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: FireExtinguisherTestRecordValue) => void;
}) {
  const value = normalizeFireExtinguisherTestRecordValue(rawValue);
  return (
    <FormReportRecordGridView
      columns={FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      panelClassName="rrg-panel rrg-panel--fet"
    />
  );
}
