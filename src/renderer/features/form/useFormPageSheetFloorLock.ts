import { useLayoutEffect, useRef, type RefObject } from 'react';

const FLOOR_HEIGHT_VAR = '--form-page-floor-height';

type Floor = { width: number; height: number };

/**
 * After the sheet has settled, keep that height. Removing checklist lines must
 * not shrink the white page (including when the removed lines are on this page
 * or the shrink comes from layout above it).
 */
export function useFormPageSheetFloorLock(
  sheetRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  hasRemovals: boolean,
  resetKey: unknown,
): void {
  const floorRef = useRef<Floor | null>(null);
  const settledRef = useRef(false);

  useLayoutEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      settledRef.current = true;
    }, 600);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !enabled) return;

    const apply = (px: number) => {
      const rounded = `${Math.round(px)}px`;
      sheet.style.setProperty(FLOOR_HEIGHT_VAR, rounded);
      sheet.style.setProperty('min-height', rounded, 'important');
      sheet.dataset.formPageFloorLocked = '';
    };

    const sync = (fromRemoval: boolean) => {
      const width = sheet.offsetWidth;
      const height = sheet.offsetHeight;
      if (width < 2 || height < 2) return;

      const prev = floorRef.current;
      const locked = sheet.dataset.formPageFloorLocked !== undefined;

      if (!prev) {
        floorRef.current = { width, height };
        if (fromRemoval) apply(height);
        return;
      }

      const widthChanged = Math.abs(width - prev.width) > 1;
      if (widthChanged) {
        const scaled = prev.height * (width / prev.width);
        const next = fromRemoval || locked ? scaled : Math.max(scaled, height);
        floorRef.current = { width, height: next };
        if (fromRemoval || locked) apply(next);
        return;
      }

      if (fromRemoval) {
        apply(prev.height);
        return;
      }

      if (!settledRef.current) {
        floorRef.current = { width, height };
        return;
      }

      if (height > prev.height + 1) {
        floorRef.current = { width, height };
        if (locked) apply(height);
        return;
      }

      if (height < prev.height - 4) apply(prev.height);
    };

    sync(hasRemovals);

    const observer = new ResizeObserver(() => sync(false));
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [enabled, hasRemovals, resetKey, sheetRef]);
}
