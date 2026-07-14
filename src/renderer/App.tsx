import { useEffect, useRef, useState, lazy, Suspense, type ReactNode } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Sidebar } from './components/Sidebar';

import { StatusBar } from './components/StatusBar';

import { InlineLoader } from './components/LoadingOverlay';

import type { CustomerDetailBreadcrumb } from './features/customers/CustomersScreen';

import type { DocumentDetailBreadcrumb, DocumentsBootState } from './features/documents/DocumentsScreen';

import type { SettingsScrollTarget } from './features/settings/SettingsScreen';

import type { TemplateDetailBreadcrumb } from './features/templates/TemplatesScreen';

import { DocumentOutlineProvider } from './features/documents/DocumentOutlineContext';
import { DocumentOutlineRail } from './features/documents/DocumentOutline';
import { navItems, type NavId } from './navigation';
import { cn } from './lib/cn';

import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { DocumentsScreen } from './features/documents/DocumentsScreen';
import { TemplatesScreen } from './features/templates/TemplatesScreen';
const CalendarScreen = lazy(() =>
  import('./features/calendar/CalendarScreen').then((m) => ({ default: m.CalendarScreen })),
);
const NameBadgesScreen = lazy(() =>
  import('./features/nameBadges/NameBadgesScreen').then((m) => ({ default: m.NameBadgesScreen })),
);
const DatabaseScreen = lazy(() =>
  import('./features/database/DatabaseScreen').then((m) => ({ default: m.DatabaseScreen })),
);
const SettingsScreen = lazy(() =>
  import('./features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);

function ScreenLoader() {
  return <InlineLoader />;
}



const screens: Record<
  Exclude<
    NavId,
    | 'customers'
    | 'builtinTemplates'
    | 'customTemplates'
    | 'documents'
    | 'nameBadges'
    | 'calendar'
    | 'database'
    | 'settings'
  >,
  ReactNode
> = {

  dashboard: null,

};



const headerBackBtnCls =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-flame-500/30 bg-flame-500/10 px-2 py-1 text-xs text-flame-300 transition-colors hover:bg-flame-500/20';



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

    if (activeId !== 'documents') {

      setDocumentBreadcrumb(null);

      documentBackRef.current = null;

    }

    if (activeId !== 'customTemplates' && activeId !== 'builtinTemplates') {

      setTemplateBreadcrumb(null);

      templateBackRef.current = null;

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
    activeId === 'customers' ||
    activeId === 'builtinTemplates' ||
    activeId === 'customTemplates' ||
    activeId === 'documents';



  return (

    <DocumentOutlineProvider>

    <div className="ba-app-shell flex h-full min-h-0 flex-col">

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

              <div className="flex min-w-0 items-center gap-2">

                <button

                  type="button"

                  onClick={() => customerBackRef.current?.()}

                  className={headerBackBtnCls}

                >

                  <ChevronLeft className="size-3.5" aria-hidden />

                  Back

                </button>

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

              </div>

            ) : (activeId === 'builtinTemplates' || activeId === 'customTemplates') &&
              templateBreadcrumb ? (

              <div className="flex min-w-0 items-center gap-2">

                <button

                  type="button"

                  onClick={() => templateBackRef.current?.()}

                  className={headerBackBtnCls}

                >

                  <ChevronLeft className="size-3.5" aria-hidden />

                  Back

                </button>

                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">

                  <button

                    type="button"

                    onClick={() => templateBackRef.current?.()}

                    className="shrink-0 font-semibold text-[var(--ba-text-muted)] transition-colors hover:text-[var(--ba-text-primary)]"

                  >

                    {activeId === 'builtinTemplates' ? 'Built-in Templates' : 'Custom Templates'}

                  </button>

                  <ChevronRight className="size-3.5 shrink-0 text-[var(--ba-text-faint)]" aria-hidden />

                  <span className="truncate font-semibold text-[var(--ba-text-primary)]">

                    {templateBreadcrumb.templateName}

                  </span>

                </nav>

              </div>

            ) : activeId === 'documents' && documentBreadcrumb ? (

              <div className="flex min-w-0 items-center gap-2">

                <button

                  type="button"

                  onClick={() => documentBackRef.current?.()}

                  className={headerBackBtnCls}

                >

                  <ChevronLeft className="size-3.5" aria-hidden />

                  Back

                </button>

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

              </div>

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

              hasSubNav || activeId === 'calendar'

                ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-3 pb-6'

                : 'min-h-0 flex-1 overflow-y-auto p-6'

            }

          >

            <Suspense fallback={<ScreenLoader />}>

            {activeId === 'customers' ? (

              <CustomersScreen

                onDetailChange={handleCustomerDetailChange}

                onNewInspection={(clientId) => openDocuments({ openNew: true, clientId })}

                onOpenInspection={(inspectionId) => openDocuments({ inspectionId })}

              />

            ) : activeId === 'documents' ? (

              <DocumentsScreen

                boot={documentsBoot}

                onBootConsumed={() => setDocumentsBoot(null)}

                onDetailChange={handleDocumentDetailChange}

              />

            ) : activeId === 'builtinTemplates' ? (

              <TemplatesScreen
                variant="built-in"
                onDetailChange={handleTemplateDetailChange}
              />

            ) : activeId === 'customTemplates' ? (

              <TemplatesScreen
                variant="custom"
                onDetailChange={handleTemplateDetailChange}
              />

            ) : activeId === 'nameBadges' ? (

              <NameBadgesScreen />

            ) : activeId === 'calendar' ? (

              <CalendarScreen />

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
                onOpenInspection={(inspectionId) => openDocuments({ inspectionId })}
              />

            ) : (

              screens[activeId]

            )}

            </Suspense>

          </div>

        </main>

        <DocumentOutlineRail />

      </div>



      <StatusBar />

    </div>

    </DocumentOutlineProvider>

  );

}

