import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { TitleBar } from './TitleBar';
import { StartupLoader } from './StartupLoader';

type BootOverlayPhase = 'visible' | 'hiding' | 'hidden';

/**
 * Boot (visible): full-window spinner only — no title bar.
 * Hiding: title bar + app are already mounted underneath; overlay fades out.
 * Hidden: normal chrome.
 */
export function AppFrame({
  children,
  bootOverlay = 'hidden',
}: {
  children?: ReactNode;
  bootOverlay?: BootOverlayPhase;
}) {
  const showChrome = bootOverlay !== 'visible';
  const showOverlay = bootOverlay !== 'hidden';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0a]">
      {showChrome ? <TitleBar /> : null}
      <div className="relative min-h-0 flex-1">{children}</div>
      {showOverlay ? (
        <div
          className={cn(
            'app-boot-overlay absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] [-webkit-app-region:drag]',
            bootOverlay === 'hiding' && 'app-boot-overlay--hide',
          )}
          aria-busy={bootOverlay === 'visible'}
        >
          <div className="[-webkit-app-region:no-drag]">
            <StartupLoader inline />
          </div>
        </div>
      ) : null}
    </div>
  );
}
