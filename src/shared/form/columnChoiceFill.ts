/**
 * When a tickbox column header is clicked, advance the whole column together.
 * If every cell already matches, cycle from that value; otherwise start from empty.
 */
export function nextUniformCycledChoice<T>(
  values: ReadonlyArray<T | null | undefined>,
  cycle: (current: T | null) => T | null,
): T | null {
  if (values.length === 0) return cycle(null);
  const first = (values[0] ?? null) as T | null;
  const uniform = values.every((value) => (value ?? null) === first);
  return cycle(uniform ? first : null);
}

/**
 * Yes / No / N/A header click: set every row to that option, or clear if already all set.
 */
export function nextRadioColumnChoice<T>(
  values: ReadonlyArray<T | null | undefined>,
  variant: T,
): T | null {
  if (values.length === 0) return variant;
  const allVariant = values.every((value) => value === variant);
  return allVariant ? null : variant;
}

/** Checkbox column header: check all, or uncheck if already all checked. */
export function nextCheckboxColumnValue(values: ReadonlyArray<boolean>): boolean {
  if (values.length === 0) return true;
  return !values.every(Boolean);
}
