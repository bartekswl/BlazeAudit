import {
  EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS,
  normalizeEmergencyLightingInspectionRecordValue,
  type EmergencyLightingInspectionRecordValue,
} from '../../../shared/form/emergencyLightingInspectionRecord';
import { FormReportRecordGridView } from './FormReportRecordGridView';

export function FormEmergencyLightingInspectionRecordView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: EmergencyLightingInspectionRecordValue) => void;
}) {
  const value = normalizeEmergencyLightingInspectionRecordValue(rawValue);
  return (
    <FormReportRecordGridView
      columns={EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      panelClassName="rrg-panel rrg-panel--elr"
    />
  );
}
