import { useLayoutEffect, type RefObject } from 'react';

const FLOOR_HEIGHT_VAR = '--form-page-floor-height';

/** Keeps screen page sheet height at last full layout when template lines are removed. */
export function useFormPageSheetFloorLock(
  sheetRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  hasRemovals: boolean,
  resetKey: unknown,
): void {
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !enabled) return;

    const captureFullHeight = () => {
      sheet.style.setProperty(FLOOR_HEIGHT_VAR, `${sheet.getBoundingClientRect().height}px`);
    };

    const syncFloorLock = () => {
      if (hasRemovals) {
        const floor = sheet.style.getPropertyValue(FLOOR_HEIGHT_VAR).trim();
        if (floor) {
          sheet.dataset.formPageFloorLocked = '';
        } else {
          delete sheet.dataset.formPageFloorLocked;
        }
      } else {
        delete sheet.dataset.formPageFloorLocked;
        captureFullHeight();
      }
    };

    syncFloorLock();

    if (hasRemovals) return;

    const observer = new ResizeObserver(() => {
      if (!sheet.dataset.formPageFloorLocked) captureFullHeight();
    });
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [enabled, hasRemovals, resetKey, sheetRef]);
}
