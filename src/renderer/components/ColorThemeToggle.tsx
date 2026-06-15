import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/cn';
import { useTheme } from '../theme/ThemeProvider';

export function ColorThemeToggle({
  className,
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { setTheme, isLight } = useTheme();

  return (
    <div className={cn('flex items-center justify-between gap-1.5', className)}>
      {showLabel && (
        <div className="flex min-w-0 items-center gap-1">
          {isLight ? (
            <Sun className="size-2.5 shrink-0 text-flame-500" aria-hidden />
          ) : (
            <Moon className="size-2.5 shrink-0 text-neutral-400" aria-hidden />
          )}
          <span className="py-0.5 text-[10px] leading-[1.35] text-[var(--ba-text-muted)]">
            Light Mode
          </span>
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        onClick={() => setTheme(isLight ? 'dark' : 'light')}
        className={cn(
          'relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors',
          isLight ? 'bg-flame-500' : 'bg-neutral-600',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-2.5 rounded-full bg-white shadow-sm transition-transform',
            isLight ? 'translate-x-[11px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
