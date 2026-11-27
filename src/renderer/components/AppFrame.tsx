import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { AuthBackground } from '../features/auth/AuthBackground';
import { LoadingBrandPhotos } from './LoadingBrandBackdrop';
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
  const hasPersistentDomLoader =
    typeof document !== 'undefined' && document.getElementById('app-boot-loader') !== null;
  const showOverlay = bootOverlay !== 'hidden' && !hasPersistentDomLoader;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--ba-app-bg)]">
      {showChrome ? <TitleBar /> : null}
      <div className="relative min-h-0 flex-1">{children}</div>
      {showOverlay ? (
        <div
          className={cn(
            'app-boot-overlay absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden [-webkit-app-region:drag]',
            bootOverlay === 'hiding' && 'app-boot-overlay--hide',
          )}
          aria-busy={bootOverlay === 'visible'}
        >
          <AuthBackground />
          <LoadingBrandPhotos />
          <div className="relative z-10 [-webkit-app-region:no-drag]">
            <StartupLoader inline branded />
          </div>
        </div>
      ) : null}
    </div>
  );
}
