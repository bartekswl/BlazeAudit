import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import {
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
  type ColorTheme,
} from '../../shared/theme';

interface ThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** While true, UI stays dark so boot never flashes light theme. */
let bootThemeHeld = true;
let pendingTheme: ColorTheme | null = null;
const bootThemeListeners = new Set<() => void>();

/** Wired by ThemeProvider so AuthGate can await theme before revealing. */
let syncThemeForBoot: (() => Promise<void>) | null = null;

function cacheKey(accountId: string): string {
  return `${COLOR_THEME_STORAGE_KEY}:${accountId}`;
}

function readCachedTheme(accountId?: string): ColorTheme | null {
  try {
    const key = accountId ? cacheKey(accountId) : COLOR_THEME_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/** Prefer account cache, then last global preference. */
function resolveCachedTheme(accountId?: string | null): ColorTheme {
  if (accountId) {
    const account = readCachedTheme(accountId);
    if (account) return account;
  }
  return readCachedTheme() ?? DEFAULT_COLOR_THEME;
}

function writeCachedTheme(theme: ColorTheme, accountId?: string): void {
  try {
    // Always mirror to global so login / next boot see the last choice.
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
    if (accountId) {
      localStorage.setItem(cacheKey(accountId), theme);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function paintTheme(theme: ColorTheme): void {
  document.documentElement.dataset.theme = theme;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Crossfade the whole UI when switching themes.
 * Gradients / images don't interpolate with CSS transitions alone.
 */
function runThemeTransition(commit: () => void): void {
  const root = document.documentElement;
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<unknown> };
  };

  if (prefersReducedMotion() || typeof doc.startViewTransition !== 'function') {
    commit();
    return;
  }

  root.classList.add('ba-theme-animating');
  const transition = doc.startViewTransition(commit);
  void transition.finished
    .catch(() => undefined)
    .finally(() => {
      root.classList.remove('ba-theme-animating');
    });
}

/** Call after boot overlay is fully opaque / ready to reveal. */
export function releaseBootTheme(): void {
  bootThemeHeld = false;
  if (pendingTheme) {
    paintTheme(pendingTheme);
  }
  for (const listener of bootThemeListeners) listener();
}

/**
 * Resolve the user's preferred theme into pending state while the dark boot
 * overlay still covers the UI. Call before `releaseBootTheme()`.
 */
export async function prepareBootTheme(): Promise<void> {
  if (syncThemeForBoot) {
    await syncThemeForBoot();
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // State may be light; DOM stays dark until releaseBootTheme().
  const [theme, setThemeState] = useState<ColorTheme>(() => resolveCachedTheme());
  const [accountId, setAccountId] = useState<string | null>(null);
  const released = useRef(false);

  const applyTheme = useCallback(
    (next: ColorTheme, activeAccountId?: string | null, animated = false) => {
      writeCachedTheme(next, activeAccountId ?? undefined);
      pendingTheme = next;

      const commit = () => {
        flushSync(() => {
          setThemeState(next);
        });
        paintTheme(next);
      };

      if (bootThemeHeld) {
        setThemeState(next);
        return;
      }

      if (animated && document.documentElement.dataset.theme !== next) {
        runThemeTransition(commit);
      } else {
        commit();
      }
    },
    [],
  );

  const loadAccountTheme = useCallback(async () => {
    const status = await window.blazeaudit.auth.getStatus();
    if (status.phase === 'unlocked') {
      setAccountId(status.accountId);
      const settings = await window.blazeaudit.auth.getSecuritySettings();
      applyTheme(settings.colorTheme ?? DEFAULT_COLOR_THEME, status.accountId);
      return;
    }
    if (status.phase === 'login') {
      setAccountId(status.accountId);
      const next =
        status.colorTheme ??
        resolveCachedTheme(status.accountId);
      applyTheme(next, status.accountId);
      return;
    }
    // activation / set_password — use last global preference
    setAccountId(null);
    applyTheme(resolveCachedTheme());
  }, [applyTheme]);

  useEffect(() => {
    syncThemeForBoot = loadAccountTheme;
    return () => {
      if (syncThemeForBoot === loadAccountTheme) syncThemeForBoot = null;
    };
  }, [loadAccountTheme]);

  useEffect(() => {
    // Boot splash stays dark until prepareBootTheme + releaseBootTheme.
    paintTheme('dark');
    pendingTheme = resolveCachedTheme();
  }, []);

  useEffect(() => {
    const onRelease = () => {
      if (released.current) return;
      released.current = true;
      const next = pendingTheme ?? theme;
      paintTheme(next);
      setThemeState(next);
    };
    bootThemeListeners.add(onRelease);
    if (!bootThemeHeld) onRelease();
    return () => {
      bootThemeListeners.delete(onRelease);
    };
  }, [theme]);

  const setTheme = useCallback(
    (next: ColorTheme) => {
      applyTheme(next, accountId ?? undefined, true);
      void window.blazeaudit.auth.getStatus().then((status) => {
        if (status.phase !== 'unlocked') return;
        void window.blazeaudit.auth.setColorTheme(next);
      });
    },
    [accountId, applyTheme],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      isLight: theme === 'light',
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeAccountSync onSync={loadAccountTheme} />
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeAccountSync({ onSync }: { onSync: () => Promise<void> }) {
  useEffect(() => {
    const sync = () => void onSync();
    window.addEventListener('blazeaudit:account-theme-sync', sync);
    return () => window.removeEventListener('blazeaudit:account-theme-sync', sync);
  }, [onSync]);

  return null;
}

export function notifyAccountThemeSync(): void {
  window.dispatchEvent(new Event('blazeaudit:account-theme-sync'));
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
