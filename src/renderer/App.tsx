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

import { SettingsScreen } from './features/settings/SettingsScreen';

import {

  TemplatesScreen,

  type TemplateDetailBreadcrumb,

} from './features/templates/TemplatesScreen';

import { navItems, type NavId } from './navigation';



const screens: Record<
  Exclude<NavId, 'customers' | 'templates' | 'documents' | 'database'>,
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

  settings: <SettingsScreen />,

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

    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-200">

      <TitleBar />



      <div className="flex min-h-0 flex-1">

        <Sidebar activeId={activeId} onSelect={setActiveId} />



        <main className="flex min-w-0 flex-1 flex-col">

          <div

            className={

              hasSubNav

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

            ) : activeId === 'templates' && templateBreadcrumb ? (

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">

                <button

                  type="button"

                  onClick={() => templateBackRef.current?.()}

                  className="shrink-0 font-semibold text-neutral-400 transition-colors hover:text-neutral-100"

                >

                  Templates

                </button>

                <ChevronRight className="size-3.5 shrink-0 text-neutral-600" aria-hidden />

                <span className="truncate font-semibold text-neutral-100">

                  {templateBreadcrumb.templateName}

                </span>

              </nav>

            ) : activeId === 'documents' && documentBreadcrumb ? (

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">

                <button

                  type="button"

                  onClick={() => documentBackRef.current?.()}

                  className="shrink-0 font-semibold text-neutral-400 transition-colors hover:text-neutral-100"

                >

                  Documents

                </button>

                <ChevronRight className="size-3.5 shrink-0 text-neutral-600" aria-hidden />

                <span className="truncate font-semibold text-neutral-100">

                  {documentBreadcrumb.documentTitle}

                </span>

              </nav>

            ) : (

              <h1

                className={

                  hasSubNav ? 'text-sm font-semibold text-neutral-100' : 'text-lg font-semibold text-neutral-100'

                }

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

      </div>



      <StatusBar />

    </div>

  );

}

