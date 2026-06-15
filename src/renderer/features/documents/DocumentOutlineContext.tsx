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

export type DocumentOutlineRegistration = {
  blocks: Block[];
  onNavigate?: (blockId: string) => void;
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

export function useDocumentOutlineRail() {
  return useDocumentOutlineContext();
}
