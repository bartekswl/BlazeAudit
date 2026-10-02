import {
  normalizeSprinklerTableValue,
  sprinklerTableDef,
  type SprinklerTableId,
  type SprinklerTableValue,
} from '../../../shared/form/sprinklerTables';
import { FormReportRecordGridView } from './FormReportRecordGridView';

export function FormSprinklerTableView({
  table,
  value: rawValue,
  readOnly,
  onChange,
}: {
  table: SprinklerTableId;
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: SprinklerTableValue) => void;
}) {
  const value = normalizeSprinklerTableValue(table, rawValue);
  return (
    <FormReportRecordGridView
      columns={sprinklerTableDef(table).columns}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      panelClassName="rrg-panel rrg-panel--spr"
    />
  );
}
