import { navItems, type NavId } from '../navigation';
import { cn } from '../lib/cn';

export function Sidebar({
  activeId,
  onSelect,
}: {
  activeId: NavId;
  onSelect: (id: NavId) => void;
}) {
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

      <div className="flex items-center gap-2.5 border-t border-white/5 px-3 py-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-flame-500 to-red-600 text-sm font-semibold text-white">
          I
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-neutral-100">Inspector</div>
          <div className="truncate text-xs text-neutral-500">SubraLab</div>
        </div>
      </div>
    </nav>
  );
}
