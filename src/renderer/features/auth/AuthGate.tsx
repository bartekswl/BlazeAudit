import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
} from 'react';
import type { AuthStatus } from '../../../shared/auth';
import { cn } from '../../lib/cn';
import { AppFrame } from '../../components/AppFrame';
import { AuthRefreshContext } from './authContext';
import {
  notifyAccountThemeSync,
  prepareBootTheme,
  releaseBootTheme,
} from '../../theme/ThemeProvider';

const ActivationScreen = lazy(() =>
  import('./ActivationScreen').then((module) => ({ default: module.ActivationScreen })),
);
const LoginScreen = lazy(() =>
  import('./LoginScreen').then((module) => ({ default: module.LoginScreen })),
);
const SetPasswordScreen = lazy(() =>
  import('./SetPasswordScreen').then((module) => ({ default: module.SetPasswordScreen })),
);

const UNLOCK_MS = 280;
const APP_ENTER_MS = 280;
const LOCK_MS = 320;
const BOOT_FADE_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function AuthGate() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [bootOverlay, setBootOverlay] = useState<'visible' | 'hiding' | 'hidden'>('visible');
  const [AppComponent, setAppComponent] = useState<ComponentType | null>(null);
  const [appVisible, setAppVisible] = useState(false);
  const [authOverlay, setAuthOverlay] = useState(false);
  const [authLeaving, setAuthLeaving] = useState(false);
  const [appMotion, setAppMotion] = useState<'enter' | 'exit' | null>(null);

  const finishBootReveal = useCallback(async () => {
    // Resolve light/dark under the boot overlay before revealing login/app.
    await prepareBootTheme();
    releaseBootTheme();
    // One frame so theme paints under the overlay, then fade out.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    setBootOverlay('hiding');
    await delay(BOOT_FADE_MS);
    setBootOverlay('hidden');
  }, []);

  const refresh = useCallback(
    async (options?: { animateUnlock?: boolean; animateLock?: boolean }) => {
      const next = await window.blazeaudit.auth.getStatus();

      if (options?.animateUnlock && next.phase === 'unlocked') {
        setAuthLeaving(true);
        setAppVisible(true);
        setAppMotion('enter');
        await delay(UNLOCK_MS);
        setStatus(next);
        setAuthOverlay(false);
        setAuthLeaving(false);
        await delay(APP_ENTER_MS);
        setAppMotion(null);
        return;
      }

      if (options?.animateLock && next.phase !== 'unlocked') {
        setAppMotion('exit');
        await delay(LOCK_MS);
        setAppVisible(false);
        setStatus(next);
        setAuthOverlay(true);
        setAppMotion(null);
        return;
      }

      setStatus(next);
      const unlocked = next.phase === 'unlocked';
      setAppVisible(unlocked);
      setAuthOverlay(!unlocked);
      if (unlocked) notifyAccountThemeSync();
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Load auth state and the lightweight app shell concurrently. Unlocked
      // startup needs both, so doing these sequentially only extends boot.
      const appImport = import('../../App');
      const next = await window.blazeaudit.auth.getStatus();
      if (cancelled) return;

      if (next.phase === 'unlocked') {
        const mod = await appImport;
        if (cancelled) return;
        setAppComponent(() => mod.default);
        setAppVisible(true);
        setAuthOverlay(false);
      } else {
        // Keep warming App while the user is on login/activation.
        void appImport;
        setAuthOverlay(true);
      }

      setStatus(next);
      if (cancelled) return;
      await finishBootReveal();
    })();

    return () => {
      cancelled = true;
    };
  }, [finishBootReveal]);

  const onAuthStepDone = useCallback(() => {
    void (async () => {
      const mod = await import('../../App');
      setAppComponent(() => mod.default);
      await refresh({ animateUnlock: true });
    })();
  }, [refresh]);

  const onAuthFlowStep = useCallback(() => {
    void refresh();
  }, [refresh]);

  const showApp = Boolean(status?.phase === 'unlocked' && AppComponent && appVisible);
  const showAuth = Boolean(status && authOverlay && status.phase !== 'unlocked');

  return (
    <AppFrame bootOverlay={bootOverlay}>
      <div className="relative h-full">
        {showApp && AppComponent ? (
          <div
            className={cn(
              'app-reveal-host h-full',
              appMotion === 'enter' && 'app-enter',
              appMotion === 'exit' && 'app-exit',
            )}
          >
            <AuthRefreshContext.Provider value={() => refresh({ animateLock: true })}>
              <AppComponent />
            </AuthRefreshContext.Provider>
          </div>
        ) : null}

        {showAuth && status ? (
          <div
            className={cn(
              'absolute inset-0 z-20',
              authLeaving ? 'auth-panel-exit' : undefined,
            )}
          >
            <Suspense fallback={null}>
              {status.phase === 'activation' && (
                <ActivationScreen
                  hasExistingAccounts={status.hasExistingAccounts}
                  onDone={onAuthFlowStep}
                  onBack={
                    status.hasExistingAccounts
                      ? () => {
                          void window.blazeaudit.auth.returnToLogin().then(onAuthFlowStep);
                        }
                      : undefined
                  }
                />
              )}
              {status.phase === 'set_password' && (
                <SetPasswordScreen email={status.email} onDone={onAuthStepDone} />
              )}
              {status.phase === 'login' && (
                <LoginScreen
                  email={status.email}
                  accountId={status.accountId}
                  accounts={status.accounts}
                  onDone={onAuthStepDone}
                  onFlowChange={onAuthFlowStep}
                />
              )}
            </Suspense>
          </div>
        ) : null}
      </div>
    </AppFrame>
  );
}
