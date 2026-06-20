import { useEffect, useRef, useState } from 'react';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ColorThemeToggle } from './ColorThemeToggle';
import { ConfirmDialog } from './ConfirmDialog';
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
  const prevActiveId = useRef(activeId);
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logOutOpen, setLogOutOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    void window.blazeaudit.auth.getStatus().then((status) => {
      if (status.phase === 'unlocked') setEmail(status.email);
    });
    void window.blazeaudit.profile.getBusiness().then((profile) => {
      setBusinessName(profile.businessName);
    });
    void window.blazeaudit.profile.getLogo().then(setLogoDataUrl);
  }, []);

  useEffect(() => {
    if (prevActiveId.current === 'settings' && activeId !== 'settings') {
      void window.blazeaudit.profile.getBusiness().then((profile) => {
        setBusinessName(profile.businessName);
      });
      void window.blazeaudit.profile.getLogo().then(setLogoDataUrl);
    }
    prevActiveId.current = activeId;
  }, [activeId]);

  const initial = email ? email[0]?.toUpperCase() : 'I';
  const subtitle = businessName.trim() || 'Business name not set';

  const handleLogOut = () => setLogOutOpen(true);

  const confirmLogOut = () => {
    setLogOutOpen(false);
    void window.blazeaudit.auth.logOut();
  };

  return (
    <>
      <nav
        className={cn(
          'ba-sidebar flex shrink-0 flex-col overflow-hidden transition-[width] duration-[400ms] ease-in-out',
          expanded ? 'w-52' : 'w-[3.25rem]',
        )}
        aria-label="Main menu"
        aria-expanded={expanded}
      >
        <div
          className={cn(
            'flex shrink-0',
            expanded ? 'justify-end px-2 pt-3 pb-1' : 'justify-center px-1 pt-3 pb-1',
          )}
        >
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-md p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
            aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
            title={expanded ? 'Collapse menu' : 'Expand menu'}
          >
            {expanded ? (
              <PanelLeftClose className="size-4" aria-hidden />
            ) : (
              <PanelLeftOpen className="size-4" aria-hidden />
            )}
          </button>
        </div>

        <ul
          className={cn(
            'flex-1 space-y-1.5 overflow-y-auto pb-3',
            expanded ? 'px-3' : 'px-1.5',
          )}
        >
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={expanded ? undefined : item.label}
                  className={cn(
                    'ba-nav-item',
                    isActive && 'ba-nav-item-active',
                    !expanded && 'justify-center px-0',
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {expanded ? (
                    <span className="truncate">{item.label}</span>
                  ) : (
                    <span className="sr-only">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            'border-t border-[var(--ba-chrome-border)]',
            expanded ? 'px-3 py-3' : 'px-1.5 py-3',
          )}
        >
          {expanded ? (
            <>
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
                  <UserAvatar logoDataUrl={logoDataUrl} initial={initial} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--ba-text-primary)]">
                      {email || 'Inspector'}
                    </div>
                    <div
                      className={cn(
                        'truncate text-xs',
                        businessName.trim()
                          ? 'text-[var(--ba-text-muted)]'
                          : 'text-[var(--ba-text-faint)]',
                      )}
                    >
                      {subtitle}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleLogOut}
                  aria-label="Close and Log Out"
                  title="Close and Log Out"
                  className="rounded-md p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
              <ColorThemeToggle className="mt-2 px-0.5" />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenUserProfile}
                title="User profile settings"
                className={cn(
                  'rounded-lg p-0.5 transition-colors',
                  activeId === 'settings'
                    ? 'text-[var(--ba-nav-active-text)]'
                    : 'hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]',
                )}
              >
                <UserAvatar logoDataUrl={logoDataUrl} initial={initial} />
                <span className="sr-only">User profile settings</span>
              </button>
              <button
                type="button"
                onClick={handleLogOut}
                aria-label="Close and Log Out"
                title="Close and Log Out"
                className="rounded-md p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
              >
                <LogOut className="size-4" />
              </button>
              <ColorThemeToggle showLabel={false} className="justify-center" />
            </div>
          )}
        </div>
      </nav>

      {logOutOpen && (
        <ConfirmDialog
          title="Close and log out?"
          icon={LogOut}
          confirmLabel="Log out and close"
          onCancel={() => setLogOutOpen(false)}
          onConfirm={confirmLogOut}
        >
          <p>BlazeAudit will close and your current session will end.</p>
          <p>You will need your password the next time you open the app.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

function UserAvatar({ logoDataUrl, initial }: { logoDataUrl: string | null; initial: string }) {
  if (logoDataUrl) {
    return (
      <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--ba-chrome-border)] bg-white p-0.5">
        <img src={logoDataUrl} alt="" className="size-full scale-[1.35] rounded-full object-contain" />
      </div>
    );
  }

  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-flame-400 via-flame-500 to-red-600 text-sm font-semibold text-white shadow-md shadow-flame-500/30">
      {initial}
    </div>
  );
}
