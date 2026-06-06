import { useState, type ReactNode } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { Placeholder } from './features/Placeholder';
import { navItems, type NavId } from './navigation';

const screens: Record<NavId, ReactNode> = {
  dashboard: <DashboardScreen />,
  customers: <CustomersScreen />,
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
  settings: (
    <Placeholder
      title="Settings"
      description="App preferences, account, backup, and licensing."
      icon={navItems.find((i) => i.id === 'settings')!.icon}
    />
  ),
};

export default function App() {
  const [activeId, setActiveId] = useState<NavId>('dashboard');
  const activeItem = navItems.find((item) => item.id === activeId)!;

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-200">
      <TitleBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar activeId={activeId} onSelect={setActiveId} />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/5 px-6 py-4">
            <h1 className="text-lg font-semibold text-neutral-100">{activeItem.label}</h1>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{screens[activeId]}</div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
