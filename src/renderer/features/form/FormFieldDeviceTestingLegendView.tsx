import { Fragment } from 'react';
import {
  FDTL_SENSITIVITY_METHOD_LABEL,
  FDTL_SENSITIVITY_RANGE_LABEL,
  FDTL_TABLE_ITEMS,
  fdtlDataRowZebraIndexes,
  normalizeFieldDeviceTestingLegendValue,
  setFdtlDeviceField,
  type FieldDeviceTestingLegendValue,
  type FdtlDeviceEntry,
  type FdtlTableItem,
} from '../../../shared/form/fieldDeviceTestingLegend';
import { cn } from '../../lib/cn';
import { VisibleWidthInput } from './VisibleWidthInput';

function FieldCell({
  value,
  editing,
  onChange,
}: {
  value: string;
  editing: boolean;
  onChange?: (next: string) => void;
}) {
  if (!editing) {
    return (
      <div className="fdtl-field-box">
        <span className="fdtl-field-value">{value.trim() ? value : '\u00a0'}</span>
      </div>
    );
  }

  return (
    <div className="fdtl-field-box" data-visible-width-box>
      <VisibleWidthInput
        className="fdtl-field-input"
        value={value}
        onChange={(next) => onChange?.(next)}
      />
    </div>
  );
}

function TypeModelCells({
  entry,
  editing,
  deviceId,
  onFieldChange,
}: {
  entry: FdtlDeviceEntry;
  editing: boolean;
  deviceId: string;
  onFieldChange: (deviceId: string, field: keyof FdtlDeviceEntry, next: string) => void;
}) {
  return (
    <>
      <td className="fdtl-td fdtl-td--type">
        <FieldCell
          value={entry.type}
          editing={editing}
          onChange={(next) => onFieldChange(deviceId, 'type', next)}
        />
      </td>
      <td className="fdtl-td fdtl-td--model">
        <FieldCell
          value={entry.modelNumber}
          editing={editing}
          onChange={(next) => onFieldChange(deviceId, 'modelNumber', next)}
        />
      </td>
    </>
  );
}

function SimpleRow({
  item,
  entry,
  zebra,
  editing,
  onFieldChange,
}: {
  item: Extract<FdtlTableItem, { kind: 'simple' }>;
  entry: FdtlDeviceEntry;
  zebra: number;
  editing: boolean;
  onFieldChange: (deviceId: string, field: keyof FdtlDeviceEntry, next: string) => void;
}) {
  return (
    <tr className={cn('fdtl-row', zebra % 2 === 0 ? 'fdtl-row--yellow' : 'fdtl-row--white')}>
      <td className="fdtl-td fdtl-td--device">{item.device}</td>
      <td className="fdtl-td fdtl-td--desc">{item.description}</td>
      <TypeModelCells
        entry={entry}
        editing={editing}
        deviceId={item.id}
        onFieldChange={onFieldChange}
      />
    </tr>
  );
}

function SmokeSubRow({
  label,
  value,
  zebra,
  editing,
  deviceId,
  field,
  onFieldChange,
}: {
  label: string;
  value: string;
  zebra: number;
  editing: boolean;
  deviceId: string;
  field: 'sensitivityTestMethod' | 'manufacturerSensitivityRange';
  onFieldChange: (deviceId: string, field: keyof FdtlDeviceEntry, next: string) => void;
}) {
  return (
    <tr className={cn('fdtl-row fdtl-row--sub', zebra % 2 === 0 ? 'fdtl-row--yellow' : 'fdtl-row--white')}>
      <td className="fdtl-td fdtl-td--desc fdtl-td--sub">
        <div className="fdtl-sub-field">
          <span className="fdtl-sub-label">{label}</span>
          <div className="fdtl-sub-input">
            <FieldCell
              value={value}
              editing={editing}
              onChange={(next) => onFieldChange(deviceId, field, next)}
            />
          </div>
        </div>
      </td>
      <td className="fdtl-td fdtl-td--type fdtl-td--blocked" aria-hidden="true" />
      <td className="fdtl-td fdtl-td--model fdtl-td--blocked" aria-hidden="true" />
    </tr>
  );
}

function SmokeRows({
  item,
  entry,
  zebra,
  editing,
  onFieldChange,
}: {
  item: Extract<FdtlTableItem, { kind: 'smoke' }>;
  entry: FdtlDeviceEntry;
  zebra: number;
  editing: boolean;
  onFieldChange: (deviceId: string, field: keyof FdtlDeviceEntry, next: string) => void;
}) {
  const rowCls = zebra % 2 === 0 ? 'fdtl-row--yellow' : 'fdtl-row--white';
  return (
    <Fragment key={item.id}>
      <tr className={cn('fdtl-row fdtl-row--smoke-main', rowCls)}>
        <td className="fdtl-td fdtl-td--device" rowSpan={3}>
          {item.device}
        </td>
        <td className="fdtl-td fdtl-td--desc">{item.description}</td>
        <TypeModelCells
          entry={entry}
          editing={editing}
          deviceId={item.id}
          onFieldChange={onFieldChange}
        />
      </tr>
      <SmokeSubRow
        label={FDTL_SENSITIVITY_METHOD_LABEL}
        value={entry.sensitivityTestMethod}
        zebra={zebra}
        editing={editing}
        deviceId={item.id}
        field="sensitivityTestMethod"
        onFieldChange={onFieldChange}
      />
      <SmokeSubRow
        label={FDTL_SENSITIVITY_RANGE_LABEL}
        value={entry.manufacturerSensitivityRange}
        zebra={zebra}
        editing={editing}
        deviceId={item.id}
        field="manufacturerSensitivityRange"
        onFieldChange={onFieldChange}
      />
    </Fragment>
  );
}

export function FormFieldDeviceTestingLegendView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: FieldDeviceTestingLegendValue) => void;
}) {
  const value = normalizeFieldDeviceTestingLegendValue(rawValue);
  const zebraMap = fdtlDataRowZebraIndexes();
  const editing = !readOnly && Boolean(onChange);

  const onFieldChange = (deviceId: string, field: keyof FdtlDeviceEntry, next: string) => {
    if (!onChange) return;
    onChange(setFdtlDeviceField(value, deviceId, field, next));
  };

  return (
    <div className="fdtl-panel">
      <div className="fdtl-table-wrap">
        <table className="fdtl-table">
          <colgroup>
            <col className="fdtl-col fdtl-col--device" />
            <col className="fdtl-col fdtl-col--desc" />
            <col className="fdtl-col fdtl-col--type" />
            <col className="fdtl-col fdtl-col--model" />
          </colgroup>
          <thead>
            <tr>
              <th className="fdtl-th fdtl-th--device">Device</th>
              <th className="fdtl-th fdtl-th--desc">Description</th>
              <th className="fdtl-th fdtl-th--type">Type</th>
              <th className="fdtl-th fdtl-th--model">Model Number</th>
            </tr>
          </thead>
          <tbody>
            {FDTL_TABLE_ITEMS.map((item) => {
              if (item.kind === 'section') {
                return (
                  <tr key={item.id} className="fdtl-row fdtl-row--section">
                    <td className="fdtl-td fdtl-td--section" colSpan={4}>
                      {item.title}
                    </td>
                  </tr>
                );
              }

              const entry = value.devices[item.id] ?? {
                type: '',
                modelNumber: '',
                sensitivityTestMethod: '',
                manufacturerSensitivityRange: '',
              };
              const zebra = zebraMap.get(item.id) ?? 0;

              if (item.kind === 'smoke') {
                return (
                  <SmokeRows
                    key={item.id}
                    item={item}
                    entry={entry}
                    zebra={zebra}
                    editing={editing}
                    onFieldChange={onFieldChange}
                  />
                );
              }
              return (
                <SimpleRow
                  key={item.id}
                  item={item}
                  entry={entry}
                  zebra={zebra}
                  editing={editing}
                  onFieldChange={onFieldChange}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
