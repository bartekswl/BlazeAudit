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

type DocumentOutlineContextValue = {
  registration: DocumentOutlineRegistration | null;
  setRegistration: (registration: DocumentOutlineRegistration | null) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const DocumentOutlineContext = createContext<DocumentOutlineContextValue | null>(null);

export function DocumentOutlineProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<DocumentOutlineRegistration | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!registration) setExpanded(false);
  }, [registration]);

  const value = useMemo(
    () => ({ registration, setRegistration, expanded, setExpanded }),
    [registration, expanded],
  );

  return (
    <DocumentOutlineContext.Provider value={value}>{children}</DocumentOutlineContext.Provider>
  );
}

function useDocumentOutlineContext() {
  const ctx = useContext(DocumentOutlineContext);
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
  const { setRegistration } = useDocumentOutlineContext();
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
  const { setRegistration } = useDocumentOutlineContext();
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

export function useDocumentOutlineRail() {
  return useDocumentOutlineContext();
}
