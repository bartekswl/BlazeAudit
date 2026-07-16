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
import { navItems, type NavId } from './navigation';
import { cn } from './lib/cn';

import { DashboardScreen } from './features/dashboard/DashboardScreen';

// Dashboard is the only screen eager-loaded, since it's what renders first.
// Everything else — especially Documents/Templates, which drag in the whole
// form-editor stack — is split into separate chunks.
const loadCustomersScreen = () => import('./features/customers/CustomersScreen');
const loadDocumentsScreen = () => import('./features/documents/DocumentsScreen');
const loadTemplatesScreen = () => import('./features/templates/TemplatesScreen');
const loadCalendarScreen = () => import('./features/calendar/CalendarScreen');
const loadNameBadgesScreen = () => import('./features/nameBadges/NameBadgesScreen');
const loadDatabaseScreen = () => import('./features/database/DatabaseScreen');
const loadUpdateScreen = () => import('./features/update/UpdateScreen');
const loadSettingsScreen = () => import('./features/settings/SettingsScreen');
const loadSupportScreen = () => import('./features/support/SupportScreen');

const CustomersScreen = lazy(() =>
  loadCustomersScreen().then((m) => ({ default: m.CustomersScreen })),
);
const DocumentsScreen = lazy(() =>
  loadDocumentsScreen().then((m) => ({ default: m.DocumentsScreen })),
);
const DocumentOutlineRail = lazy(() =>
  import('./features/documents/DocumentOutline').then((m) => ({
    default: m.DocumentOutlineRail,
  })),
);
const TemplatesScreen = lazy(() =>
  loadTemplatesScreen().then((m) => ({ default: m.TemplatesScreen })),
);
const CalendarScreen = lazy(() =>
  loadCalendarScreen().then((m) => ({ default: m.CalendarScreen })),
);
const NameBadgesScreen = lazy(() =>
  loadNameBadgesScreen().then((m) => ({ default: m.NameBadgesScreen })),
);
const DatabaseScreen = lazy(() =>
  loadDatabaseScreen().then((m) => ({ default: m.DatabaseScreen })),
);
const UpdateScreen = lazy(() =>
  loadUpdateScreen().then((m) => ({ default: m.UpdateScreen })),
);
const SettingsScreen = lazy(() =>
  loadSettingsScreen().then((m) => ({ default: m.SettingsScreen })),
);
const SupportScreen = lazy(() =>
  loadSupportScreen().then((m) => ({ default: m.SupportScreen })),
);

const backgroundLoaders = [
  loadDocumentsScreen,
  loadCustomersScreen,
  loadCalendarScreen,
  loadNameBadgesScreen,
  loadDatabaseScreen,
  loadUpdateScreen,
  loadSettingsScreen,
  loadSupportScreen,
  () => import('./features/documents/NewInspectionDialog'),
  loadTemplatesScreen,
  () => import('./features/documents/InspectionEditor'),
];

function waitForIdle(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 1_000 });
    } else {
      globalThis.setTimeout(resolve, 100);
    }
  });
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
    | 'update'
    | 'settings'
    | 'support'
  >,
  ReactNode
> = {
  dashboard: null,
};



const headerBackBtnCls =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-flame-500/30 bg-flame-500/10 px-2 py-1 text-xs text-flame-300 transition-colors hover:bg-flame-500/20';

const screenModuleFallback = <InlineLoader label="Loading screen…" />;


export default function App() {
  const [activeId, setActiveId] = useState<NavId>('dashboard');

  useEffect(() => {
    let cancelled = false;
    const start = window.setTimeout(() => {
      void (async () => {
        for (const load of backgroundLoaders) {
          await waitForIdle();
          if (cancelled) return;
          try {
            await load();
          } catch {
            // A selected screen can retry its own dynamic import.
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, []);

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

            {activeId === 'customers' ? (

              <Suspense fallback={screenModuleFallback}>
                <CustomersScreen
                  onDetailChange={handleCustomerDetailChange}
                  onNewInspection={(clientId) => openDocuments({ openNew: true, clientId })}
                  onOpenInspection={(inspectionId) => openDocuments({ inspectionId })}
                />
              </Suspense>

            ) : activeId === 'documents' ? (

              <Suspense fallback={screenModuleFallback}>
                <DocumentsScreen
                  boot={documentsBoot}
                  onBootConsumed={() => setDocumentsBoot(null)}
                  onDetailChange={handleDocumentDetailChange}
                />
              </Suspense>

            ) : activeId === 'builtinTemplates' ? (

              <Suspense fallback={screenModuleFallback}>
                <TemplatesScreen
                  variant="built-in"
                  onDetailChange={handleTemplateDetailChange}
                />
              </Suspense>

            ) : activeId === 'customTemplates' ? (

              <Suspense fallback={screenModuleFallback}>
                <TemplatesScreen
                  variant="custom"
                  onDetailChange={handleTemplateDetailChange}
                />
              </Suspense>

            ) : activeId === 'nameBadges' ? (

              <Suspense fallback={screenModuleFallback}>
                <NameBadgesScreen />
              </Suspense>

            ) : activeId === 'calendar' ? (

              <Suspense fallback={screenModuleFallback}>
                <CalendarScreen />
              </Suspense>

            ) : activeId === 'database' ? (

              <Suspense fallback={screenModuleFallback}>
                <DatabaseScreen

                  onInspectionImported={(inspectionId) => openDocuments({ inspectionId })}

                />
              </Suspense>

            ) : activeId === 'update' ? (

              <Suspense fallback={screenModuleFallback}>
                <UpdateScreen />
              </Suspense>

            ) : activeId === 'settings' ? (

              <Suspense fallback={screenModuleFallback}>
                <SettingsScreen

                  scrollTo={settingsBoot?.scrollTo ?? null}

                  onScrollConsumed={() => setSettingsBoot(null)}

                />
              </Suspense>

            ) : activeId === 'support' ? (

              <Suspense fallback={screenModuleFallback}>
                <SupportScreen />
              </Suspense>

            ) : activeId === 'dashboard' ? (

              <DashboardScreen
                onOpenInspection={(inspectionId) => openDocuments({ inspectionId })}
              />

            ) : (

              screens[activeId]

            )}

          </div>

        </main>

        {activeId === 'documents' ||
        activeId === 'builtinTemplates' ||
        activeId === 'customTemplates' ? (
          <Suspense fallback={null}>
            <DocumentOutlineRail />
          </Suspense>
        ) : null}

      </div>



      <StatusBar />

    </div>

    </DocumentOutlineProvider>

  );

}

