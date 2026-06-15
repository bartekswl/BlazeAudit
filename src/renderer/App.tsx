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

import {

  DocumentsScreen,

  type DocumentDetailBreadcrumb,

  type DocumentsBootState,

} from './features/documents/DocumentsScreen';

import { Placeholder } from './features/Placeholder';

import { SettingsScreen, type SettingsScrollTarget } from './features/settings/SettingsScreen';

import {

  TemplatesScreen,

  type TemplateDetailBreadcrumb,

} from './features/templates/TemplatesScreen';

import { DocumentOutlineProvider } from './features/documents/DocumentOutlineContext';
import { DocumentOutlineRail } from './features/documents/DocumentOutline';
import { navItems, type NavId } from './navigation';
import { cn } from './lib/cn';



const screens: Record<
  Exclude<NavId, 'customers' | 'templates' | 'documents' | 'database' | 'settings'>,
  ReactNode
> = {

  dashboard: null,

  calendar: (

    <Placeholder

      title="Calendar"

      description="Upcoming and overdue inspections, driven by each document's cadence."

      icon={navItems.find((i) => i.id === 'calendar')!.icon}

    />

  ),

};



export default function App() {
  const [activeId, setActiveId] = useState<NavId>('dashboard');

  const activeItem = navItems.find((item) => item.id === activeId)!;

  const [customerBreadcrumb, setCustomerBreadcrumb] = useState<CustomerDetailBreadcrumb | null>(

    null,

  );

  const [templateBreadcrumb, setTemplateBreadcrumb] = useState<TemplateDetailBreadcrumb | null>(

    null,

  );

  const [documentBreadcrumb, setDocumentBreadcrumb] = useState<DocumentDetailBreadcrumb | null>(

    null,

  );

  const [documentsBoot, setDocumentsBoot] = useState<DocumentsBootState | null>(null);

  const [settingsBoot, setSettingsBoot] = useState<{ scrollTo?: SettingsScrollTarget } | null>(
    null,
  );

  const customerBackRef = useRef<(() => void) | null>(null);

  const templateBackRef = useRef<(() => void) | null>(null);

  const documentBackRef = useRef<(() => void) | null>(null);



  useEffect(() => {

    if (activeId !== 'customers') {

      setCustomerBreadcrumb(null);

      customerBackRef.current = null;

    }

    if (activeId !== 'templates') {

      setTemplateBreadcrumb(null);

      templateBackRef.current = null;

    }

    if (activeId !== 'documents') {

      setDocumentBreadcrumb(null);

      documentBackRef.current = null;

    }

  }, [activeId]);



  const openDocuments = (boot: DocumentsBootState) => {

    setDocumentsBoot(boot);

    setActiveId('documents');

  };



  const openSettings = (boot?: { scrollTo?: SettingsScrollTarget }) => {

    setSettingsBoot(boot ?? null);

    setActiveId('settings');

  };



  const handleCustomerDetailChange = (detail: CustomerDetailBreadcrumb | null) => {

    setCustomerBreadcrumb(detail);

    customerBackRef.current = detail?.onBack ?? null;

  };



  const handleTemplateDetailChange = (detail: TemplateDetailBreadcrumb | null) => {

    setTemplateBreadcrumb(detail);

    templateBackRef.current = detail?.onBack ?? null;

  };



  const handleDocumentDetailChange = (detail: DocumentDetailBreadcrumb | null) => {

    setDocumentBreadcrumb(detail);

    documentBackRef.current = detail?.onBack ?? null;

  };



  const hasSubNav =

    activeId === 'customers' || activeId === 'templates' || activeId === 'documents';



  return (

    <DocumentOutlineProvider>

    <div className="ba-app-shell flex h-screen flex-col">

      <TitleBar />



      <div className="flex min-h-0 flex-1">

        <Sidebar
          activeId={activeId}
          onSelect={setActiveId}
          onOpenUserProfile={() => openSettings({ scrollTo: 'user-profile' })}
        />



        <main className="flex min-w-0 flex-1 flex-col">

          <div

            className={cn(
              'ba-main-header',
              hasSubNav ? 'shrink-0 px-6 py-2' : 'shrink-0 px-6 py-4',
            )}

          >

            {activeId === 'customers' && customerBreadcrumb ? (

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">

                <button

                  type="button"

                  onClick={() => customerBackRef.current?.()}

                  className="shrink-0 font-semibold text-[var(--ba-text-muted)] transition-colors hover:text-[var(--ba-text-primary)]"

                >

                  Customers

                </button>

                <ChevronRight className="size-3.5 shrink-0 text-[var(--ba-text-faint)]" aria-hidden />

                <span className="truncate font-semibold text-[var(--ba-text-primary)]">

                  {customerBreadcrumb.clientName}

                </span>

              </nav>

            ) : activeId === 'templates' && templateBreadcrumb ? (

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">

                <button

                  type="button"

                  onClick={() => templateBackRef.current?.()}

                  className="shrink-0 font-semibold text-[var(--ba-text-muted)] transition-colors hover:text-[var(--ba-text-primary)]"

                >

                  Templates

                </button>

                <ChevronRight className="size-3.5 shrink-0 text-[var(--ba-text-faint)]" aria-hidden />

                <span className="truncate font-semibold text-[var(--ba-text-primary)]">

                  {templateBreadcrumb.templateName}

                </span>

              </nav>

            ) : activeId === 'documents' && documentBreadcrumb ? (

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">

                <button

                  type="button"

                  onClick={() => documentBackRef.current?.()}

                  className="shrink-0 font-semibold text-[var(--ba-text-muted)] transition-colors hover:text-[var(--ba-text-primary)]"

                >

                  Documents

                </button>

                <ChevronRight className="size-3.5 shrink-0 text-[var(--ba-text-faint)]" aria-hidden />

                <span className="truncate font-semibold text-[var(--ba-text-primary)]">

                  {documentBreadcrumb.documentTitle}

                </span>

              </nav>

            ) : (

              <h1

                className={cn(
                  'font-semibold text-[var(--ba-text-primary)]',
                  hasSubNav ? 'text-sm' : 'text-lg',
                )}

              >

                {activeItem.label}

              </h1>

            )}

          </div>

          <div

            className={

              hasSubNav

                ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-3 pb-6'

                : 'min-h-0 flex-1 overflow-y-auto p-6'

            }

          >

            {activeId === 'customers' ? (

              <CustomersScreen

                onDetailChange={handleCustomerDetailChange}

                onNewInspection={(clientId) => openDocuments({ openNew: true, clientId })}

                onOpenInspection={(inspectionId) => openDocuments({ inspectionId })}

              />

            ) : activeId === 'templates' ? (

              <TemplatesScreen onDetailChange={handleTemplateDetailChange} />

            ) : activeId === 'documents' ? (

              <DocumentsScreen

                boot={documentsBoot}

                onBootConsumed={() => setDocumentsBoot(null)}

                onDetailChange={handleDocumentDetailChange}

              />

            ) : activeId === 'database' ? (

              <DatabaseScreen

                onInspectionImported={(inspectionId) => openDocuments({ inspectionId })}

              />

            ) : activeId === 'settings' ? (

              <SettingsScreen

                scrollTo={settingsBoot?.scrollTo ?? null}

                onScrollConsumed={() => setSettingsBoot(null)}

              />

            ) : activeId === 'dashboard' ? (

              <DashboardScreen

                onNewInspection={() => openDocuments({ openNew: true })}

                onOpenInspection={(inspectionId) => openDocuments({ inspectionId })}

              />

            ) : (

              screens[activeId]

            )}

          </div>

        </main>

        <DocumentOutlineRail />

      </div>



      <StatusBar />

    </div>

    </DocumentOutlineProvider>

  );

}

