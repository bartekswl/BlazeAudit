import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AuthStatus } from '../../../shared/auth';
import { cn } from '../../lib/cn';
import { TitleBar } from '../../components/TitleBar';
import { ActivationScreen } from './ActivationScreen';
import { AuthRefreshContext } from './authContext';
import { notifyAccountThemeSync } from '../../theme/ThemeProvider';
import { LoginScreen } from './LoginScreen';
import { SetPasswordScreen } from './SetPasswordScreen';

const UNLOCK_MS = 920;
const APP_ENTER_MS = 1100;
const LOCK_MS = 720;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
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
    void (async () => {
      const next = await window.blazeaudit.auth.getStatus();
      setStatus(next);
      if (next.phase === 'unlocked') {
        setAppVisible(true);
        setAuthOverlay(false);
        setAppMotion('enter');
        notifyAccountThemeSync();
        await delay(APP_ENTER_MS);
        setAppMotion(null);
      } else {
        setAuthOverlay(true);
      }
    })();
  }, []);

  const onAuthStepDone = useCallback(() => {
    void refresh({ animateUnlock: true });
  }, [refresh]);

  const onAuthFlowStep = useCallback(() => {
    void refresh();
  }, [refresh]);

  if (!status) {
    return (
      <div className="flex h-screen flex-col bg-neutral-950">
        <TitleBar />
        <div className="grid flex-1 place-items-center text-sm text-neutral-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-neutral-950">
      {appVisible && (
        <div
          className={cn(
            'app-reveal-host h-full',
            appMotion === 'enter' && 'app-enter',
            appMotion === 'exit' && 'app-exit',
          )}
        >
          <AuthRefreshContext.Provider value={() => refresh({ animateLock: true })}>
            {children}
          </AuthRefreshContext.Provider>
        </div>
      )}

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
    </div>
  );
}
