import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Block } from '../../../shared/document';
import type { FormOutlineSection } from '../../../shared/form/outline';

export type DocumentOutlineRegistration = {
  title?: string;
  blocks?: Block[];
  formSections?: FormOutlineSection[];
  onNavigate?: (blockId: string) => void;
  onFormNavigate?: (sectionId: string, pageIndex: number) => void;
};

type RegistrationContextValue = {
  registration: DocumentOutlineRegistration | null;
  setRegistration: (registration: DocumentOutlineRegistration | null) => void;
};

type ExpandedContextValue = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const RegistrationContext = createContext<RegistrationContextValue | null>(null);
const ExpandedContext = createContext<ExpandedContextValue | null>(null);

export function DocumentOutlineProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<DocumentOutlineRegistration | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!registration) setExpanded(false);
  }, [registration]);

  const registrationValue = useMemo(
    () => ({ registration, setRegistration }),
    [registration],
  );

  const expandedValue = useMemo(() => ({ expanded, setExpanded }), [expanded]);

  return (
    <RegistrationContext.Provider value={registrationValue}>
      <ExpandedContext.Provider value={expandedValue}>{children}</ExpandedContext.Provider>
    </RegistrationContext.Provider>
  );
}

function useRegistrationContext() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error('DocumentOutlineProvider is required.');
  }
  return ctx;
}

function useExpandedContext() {
  const ctx = useContext(ExpandedContext);
  if (!ctx) {
    throw new Error('DocumentOutlineProvider is required.');
  }
  return ctx;
}

/** Register document blocks while an inspection or template editor is open. */
export function useRegisterDocumentOutline(
  blocks: Block[],
  onNavigate?: (blockId: string) => void,
) {
  const { setRegistration } = useRegistrationContext();
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    setRegistration({
      blocks: blocks ?? [],
      onNavigate: (blockId) => onNavigateRef.current?.(blockId),
    });

    return () => setRegistration(null);
  }, [blocks, setRegistration]);
}

/** Register form sections while a built-in form viewer or inspection editor is open. */
export function useRegisterFormOutline(
  title: string,
  formSections: FormOutlineSection[],
  onFormNavigate?: (sectionId: string, pageIndex: number) => void,
) {
  const { setRegistration } = useRegistrationContext();
  const onFormNavigateRef = useRef(onFormNavigate);
  onFormNavigateRef.current = onFormNavigate;

  useEffect(() => {
    setRegistration({
      title,
      formSections,
      onFormNavigate: (sectionId, pageIndex) =>
        onFormNavigateRef.current?.(sectionId, pageIndex),
    });

    return () => setRegistration(null);
  }, [title, formSections, setRegistration]);
}

/** Contents rail UI — registration + expand/collapse. */
export function useDocumentOutlineRail() {
  return { ...useRegistrationContext(), ...useExpandedContext() };
}

/** Contents panel width only — avoids re-rendering editors when registration changes. */
export function useContentsPanelExpanded(): boolean {
  return useExpandedContext().expanded;
}
