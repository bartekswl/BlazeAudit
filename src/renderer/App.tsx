import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import {
  CustomersScreen,
  type CustomerDetailBreadcrumb,
} from './features/customers/CustomersScreen';
import { DatabaseScreen } from './features/database/DatabaseScreen';
import { Placeholder } from './features/Placeholder';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { navItems, type NavId } from './navigation';

const screens: Record<Exclude<NavId, 'customers'>, ReactNode> = {
  dashboard: <DashboardScreen />,
  documents: (
    <Placeholder
      title="Documents"
      description="The single home for all inspections, completed and in draft."
      icon={navItems.find((i) => i.id === 'documents')!.icon}
    />
  ),
  templates: (
    <Placeholder
      title="Templates"
      description="Reusable inspection definitions built from a tree of typed blocks."
      icon={navItems.find((i) => i.id === 'templates')!.icon}
    />
  ),
  calendar: (
    <Placeholder
      title="Calendar"
      description="Upcoming and overdue inspections, driven by each document's cadence."
      icon={navItems.find((i) => i.id === 'calendar')!.icon}
    />
  ),
  database: <DatabaseScreen />,
  settings: <SettingsScreen />,
};

export default function App() {
  const [activeId, setActiveId] = useState<NavId>('dashboard');
  const activeItem = navItems.find((item) => item.id === activeId)!;
  const [customerBreadcrumb, setCustomerBreadcrumb] = useState<CustomerDetailBreadcrumb | null>(
    null,
  );
  const customerBackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (activeId !== 'customers') {
      setCustomerBreadcrumb(null);
      customerBackRef.current = null;
    }
  }, [activeId]);

  const handleCustomerDetailChange = (detail: CustomerDetailBreadcrumb | null) => {
    setCustomerBreadcrumb(detail);
    customerBackRef.current = detail?.onBack ?? null;
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-200">
      <TitleBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar activeId={activeId} onSelect={setActiveId} />

        <main className="flex min-w-0 flex-1 flex-col">
          <div
            className={
              activeId === 'customers'
                ? 'shrink-0 border-b border-white/5 px-6 py-2'
                : 'shrink-0 border-b border-white/5 px-6 py-4'
            }
          >
            {activeId === 'customers' && customerBreadcrumb ? (
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => customerBackRef.current?.()}
                  className="shrink-0 font-semibold text-neutral-400 transition-colors hover:text-neutral-100"
                >
                  Customers
                </button>
                <ChevronRight className="size-3.5 shrink-0 text-neutral-600" aria-hidden />
                <span className="truncate font-semibold text-neutral-100">
                  {customerBreadcrumb.clientName}
                </span>
              </nav>
            ) : (
              <h1
                className={
                  activeId === 'customers'
                    ? 'text-sm font-semibold text-neutral-100'
                    : 'text-lg font-semibold text-neutral-100'
                }
              >
                {activeItem.label}
              </h1>
            )}
          </div>
          <div
            className={
              activeId === 'customers'
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-3 pb-6'
                : 'min-h-0 flex-1 overflow-y-auto p-6'
            }
          >
            {activeId === 'customers' ? (
              <CustomersScreen onDetailChange={handleCustomerDetailChange} />
            ) : (
              screens[activeId]
            )}
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
