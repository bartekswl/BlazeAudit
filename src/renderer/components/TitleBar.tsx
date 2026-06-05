import { useEffect, useState, type ReactNode } from 'react';
import { Flame, Minus, Square, Copy, X } from 'lucide-react';
import { cn } from '../lib/cn';

function ControlButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-10 w-12 items-center justify-center text-neutral-400 transition-colors',
        danger ? 'hover:bg-red-600 hover:text-white' : 'hover:bg-white/10 hover:text-neutral-100',
      )}
    >
      {children}
    </button>
  );
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    void window.blazeaudit.window.isMaximized().then(setIsMaximized);
    return window.blazeaudit.window.onMaximizeChange(setIsMaximized);
  }, []);

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-white/5 bg-neutral-950 [-webkit-app-region:drag]">
      <div className="flex items-center gap-2 px-3">
        <Flame className="size-4 text-flame-500" />
        <span className="text-sm font-semibold tracking-wide text-neutral-100">BlazeAudit</span>
      </div>

      <div className="flex [-webkit-app-region:no-drag]">
        <ControlButton label="Minimize" onClick={() => window.blazeaudit.window.minimize()}>
          <Minus className="size-4" />
        </ControlButton>
        <ControlButton
          label={isMaximized ? 'Restore' : 'Maximize'}
          onClick={() => window.blazeaudit.window.toggleMaximize()}
        >
          {isMaximized ? <Copy className="size-3.5" /> : <Square className="size-3.5" />}
        </ControlButton>
        <ControlButton label="Close" danger onClick={() => window.blazeaudit.window.close()}>
          <X className="size-4" />
        </ControlButton>
      </div>
    </header>
  );
}
