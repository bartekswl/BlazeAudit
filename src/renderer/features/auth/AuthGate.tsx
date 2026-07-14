import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import type { AuthStatus } from '../../../shared/auth';
import { cn } from '../../lib/cn';
import { BootShell } from '../../components/BootShell';
import { TitleBar } from '../../components/TitleBar';
import { ActivationScreen } from './ActivationScreen';
import { AuthRefreshContext } from './authContext';
import { notifyAccountThemeSync } from '../../theme/ThemeProvider';
import { LoginScreen } from './LoginScreen';
import { SetPasswordScreen } from './SetPasswordScreen';

const UNLOCK_MS = 420;
const APP_ENTER_MS = 420;
const LOCK_MS = 480;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function AppFrame({ children, loading = false }: { children?: ReactNode; loading?: boolean }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
      <TitleBar />
      <div className="relative min-h-0 flex-1">
        <BootShell loading={loading}>{children}</BootShell>
      </div>
    </div>
  );
}

export function AuthGate() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [booting, setBooting] = useState(true);
  const [AppComponent, setAppComponent] = useState<ComponentType | null>(null);
  const [appVisible, setAppVisible] = useState(false);
  const [authOverlay, setAuthOverlay] = useState(false);
  const [authLeaving, setAuthLeaving] = useState(false);
  const [appMotion, setAppMotion] = useState<'enter' | 'exit' | null>(null);

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
    const appPromise = import('../../App');

    void (async () => {
      const next = await window.blazeaudit.auth.getStatus();
      if (cancelled) return;

      setStatus(next);

      if (next.phase === 'unlocked') {
        const mod = await appPromise;
        if (cancelled) return;
        setAppComponent(() => mod.default);
        setAppVisible(true);
        setAuthOverlay(false);
        notifyAccountThemeSync();
      } else {
        setAuthOverlay(true);
      }

      setBooting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  if (booting || !status) {
    return <AppFrame loading />;
  }

  if (status.phase === 'unlocked' && AppComponent && appVisible) {
    return (
      <AppFrame>
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
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      {authOverlay && status.phase !== 'unlocked' && (
        <div
          className={cn(
            'absolute inset-0 z-20 bg-neutral-950',
            authLeaving ? 'auth-panel-exit' : 'auth-panel-enter',
          )}
        >
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
        </div>
      )}
    </AppFrame>
  );
}
