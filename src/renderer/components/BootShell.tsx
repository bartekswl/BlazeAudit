import type { ReactNode } from 'react';
import { StartupLoader } from './StartupLoader';

/** Boot loading overlay — TitleBar lives in AuthGate so it never remounts. */
export function BootShell({
  loading = false,
  children,
}: {
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      {children}
      {loading ? (
        <div className="absolute inset-0 z-50 flex flex-col bg-neutral-950">
          <StartupLoader />
        </div>
      ) : null}
    </>
  );
}
