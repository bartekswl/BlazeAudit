import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { navItems, type NavId } from '../navigation';
import { cn } from '../lib/cn';

export function Sidebar({
  activeId,
  onSelect,
}: {
  activeId: NavId;
  onSelect: (id: NavId) => void;
}) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    void window.blazeaudit.auth.getStatus().then((status) => {
      if (status.phase === 'unlocked') setEmail(status.email);
    });
  }, []);

  const initial = email ? email[0]?.toUpperCase() : 'I';

  return (
    <nav className="flex w-52 shrink-0 flex-col border-r border-white/5 bg-neutral-950/60">
      <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pt-5 pb-3">
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
                  isActive
                    ? 'bg-flame-500/10 text-flame-400'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100',
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSelect('settings')}
            title="Settings"
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 text-left transition-colors',
              activeId === 'settings'
                ? 'text-flame-400'
                : 'hover:bg-white/5 hover:text-neutral-100',
            )}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-flame-500 to-red-600 text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-100">
                {email || 'Inspector'}
              </div>
              <div className="truncate text-xs text-neutral-500">SubraLab</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => void window.blazeaudit.auth.logOut()}
            aria-label="Close and Log Out"
            title="Close and Log Out"
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
