import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>(() => readCachedTheme() ?? DEFAULT_COLOR_THEME);
  const [accountId, setAccountId] = useState<string | null>(null);

  const applyTheme = useCallback((next: ColorTheme, activeAccountId?: string | null) => {
    setThemeState(next);
    writeCachedTheme(next, activeAccountId ?? undefined);
    document.documentElement.dataset.theme = next;
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
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    void loadAccountTheme();
  }, [loadAccountTheme]);

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

/** Reload theme when the signed-in account changes or the app unlocks. */
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
