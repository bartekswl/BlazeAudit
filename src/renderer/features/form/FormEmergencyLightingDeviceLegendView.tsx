import {
  EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS,
  normalizeEmergencyLightingDeviceLegendValue,
  type EmergencyLightingDeviceLegendValue,
} from '../../../shared/form/emergencyLightingDeviceLegend';
import { FormReportRecordGridView } from './FormReportRecordGridView';

export function FormEmergencyLightingDeviceLegendView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: EmergencyLightingDeviceLegendValue) => void;
}) {
  const value = normalizeEmergencyLightingDeviceLegendValue(rawValue);
  return (
    <FormReportRecordGridView
      columns={EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      panelClassName="rrg-panel rrg-panel--eld"
    />
  );
}
