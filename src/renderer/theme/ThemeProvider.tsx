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

function writeCachedTheme(theme: ColorTheme, accountId?: string): void {
  try {
    const key = accountId ? cacheKey(accountId) : COLOR_THEME_STORAGE_KEY;
    localStorage.setItem(key, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

function paintTheme(theme: ColorTheme): void {
  document.documentElement.dataset.theme = theme;
}

/** Call after boot overlay is fully opaque / ready to reveal. */
export function releaseBootTheme(): void {
  bootThemeHeld = false;
  if (pendingTheme) {
    paintTheme(pendingTheme);
  }
  for (const listener of bootThemeListeners) listener();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start dark for boot — never paint cached light until releaseBootTheme().
  const [theme, setThemeState] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  const [accountId, setAccountId] = useState<string | null>(null);
  const released = useRef(false);

  const applyTheme = useCallback((next: ColorTheme, activeAccountId?: string | null) => {
    setThemeState(next);
    writeCachedTheme(next, activeAccountId ?? undefined);
    pendingTheme = next;
    if (!bootThemeHeld) {
      paintTheme(next);
    }
  }, []);

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
      const cached = readCachedTheme(status.accountId);
      if (cached) applyTheme(cached, status.accountId);
    }
  }, [applyTheme]);

  useEffect(() => {
    paintTheme('dark');
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

  // Prefetch preferred theme into state/cache only — do not paint while boot held.
  useEffect(() => {
    const cached = readCachedTheme();
    if (cached) {
      pendingTheme = cached;
      setThemeState(cached);
      writeCachedTheme(cached);
    }
  }, []);

  const setTheme = useCallback(
    (next: ColorTheme) => {
      applyTheme(next, accountId ?? undefined);
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
