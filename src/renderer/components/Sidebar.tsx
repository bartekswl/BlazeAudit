import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { ColorThemeToggle } from './ColorThemeToggle';
import { navItems, type NavId } from '../navigation';
import { cn } from '../lib/cn';

export function Sidebar({
  activeId,
  onSelect,
  onOpenUserProfile,
}: {
  activeId: NavId;
  onSelect: (id: NavId) => void;
  onOpenUserProfile: () => void;
}) {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    void window.blazeaudit.auth.getStatus().then((status) => {
      if (status.phase === 'unlocked') setEmail(status.email);
    });
    void window.blazeaudit.profile.getBusiness().then((profile) => {
      setBusinessName(profile.businessName);
    });
  }, []);

  const initial = email ? email[0]?.toUpperCase() : 'I';
  const subtitle = businessName.trim() || 'SubraLab';

  return (
    <nav className="ba-sidebar flex w-52 shrink-0 flex-col">
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
                className={cn('ba-nav-item', isActive && 'ba-nav-item-active')}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[var(--ba-chrome-border)] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenUserProfile}
            title="User profile settings"
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 text-left transition-colors',
              activeId === 'settings'
                ? 'text-[var(--ba-nav-active-text)]'
                : 'hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]',
            )}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-flame-400 via-flame-500 to-red-600 text-sm font-semibold text-white shadow-md shadow-flame-500/30">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--ba-text-primary)]">
                {email || 'Inspector'}
              </div>
              <div className="truncate text-xs text-[var(--ba-text-muted)]">{subtitle}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => void window.blazeaudit.auth.logOut()}
            aria-label="Close and Log Out"
            title="Close and Log Out"
            className="rounded-md p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <ColorThemeToggle className="mt-2 px-0.5" />
      </div>
    </nav>
  );
}
