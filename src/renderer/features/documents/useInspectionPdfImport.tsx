import { useCallback, useState, type ReactNode } from 'react';
import { FileText, Users } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

type PendingPdfImport =
  | {
      step: 'replace';
      filePath: string;
      clientName: string;
      documentTitle: string;
      needsNewClient: boolean;
      hasClientSnapshot: boolean;
    }
  | {
      step: 'new-client';
      filePath: string;
      clientName: string;
      documentTitle: string;
      hasClientSnapshot: boolean;
      replaceExisting: boolean;
    };

/**
 * Shared Documents / Database PDF import: inspect → replace warn →
 * create-customer warn → confirm.
 */
export function useInspectionPdfImport(options: {
  onImported: (result: { inspectionId: string; filePath: string }) => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const { onImported, onError } = options;
  const [importingPdf, setImportingPdf] = useState(false);
  const [pending, setPending] = useState<PendingPdfImport | null>(null);

  const finishPdfImport = useCallback(
    async (filePath: string, replaceExisting: boolean) => {
      setImportingPdf(true);
      try {
        const result = await window.blazeaudit.inspections.confirmPdfImport(filePath, {
          replaceExisting,
        });
        if (result.imported) {
          await onImported(result);
        }
      } catch (e) {
        onError(e instanceof Error ? e.message : 'PDF import failed.');
      } finally {
        setImportingPdf(false);
        setPending(null);
      }
    },
    [onError, onImported],
  );

  const startPdfImport = useCallback(async () => {
    try {
      const preview = await window.blazeaudit.inspections.inspectPdfImport();
      if (preview.canceled) return;

      if (preview.documentAlreadyExists) {
        setPending({
          step: 'replace',
          filePath: preview.filePath,
          clientName: preview.clientName,
          documentTitle: preview.documentTitle,
          needsNewClient: preview.needsNewClient,
          hasClientSnapshot: preview.hasClientSnapshot,
        });
        return;
      }

      if (preview.needsNewClient) {
        setPending({
          step: 'new-client',
          filePath: preview.filePath,
          clientName: preview.clientName,
          documentTitle: preview.documentTitle,
          hasClientSnapshot: preview.hasClientSnapshot,
          replaceExisting: false,
        });
        return;
      }

      await finishPdfImport(preview.filePath, false);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'PDF import failed.');
    }
  }, [finishPdfImport, onError]);

  const proceedAfterReplace = useCallback(() => {
    if (!pending || pending.step !== 'replace') return;
    const next = pending;
    setPending(null);
    if (next.needsNewClient) {
      setPending({
        step: 'new-client',
        filePath: next.filePath,
        clientName: next.clientName,
        documentTitle: next.documentTitle,
        hasClientSnapshot: next.hasClientSnapshot,
        replaceExisting: true,
      });
      return;
    }
    void finishPdfImport(next.filePath, true);
  }, [finishPdfImport, pending]);

  const pdfImportDialogs: ReactNode = (
    <>
      {pending?.step === 'replace' && (
        <ConfirmDialog
          title="Replace existing document?"
          icon={FileText}
          confirmLabel="Replace"
          onCancel={() => setPending(null)}
          onConfirm={proceedAfterReplace}
        >
          <p>
            Document{' '}
            <span className="font-medium text-[var(--ba-text-primary)]">
              {pending.documentTitle}
            </span>{' '}
            already exists for{' '}
            <span className="font-medium text-[var(--ba-text-primary)]">
              {pending.clientName}
            </span>
            .
          </p>
          <p>Do you want to replace it? Only the uploaded version will be kept.</p>
        </ConfirmDialog>
      )}

      {pending?.step === 'new-client' && (
        <ConfirmDialog
          title={
            pending.hasClientSnapshot ? 'Create customer profile?' : 'Cannot create customer'
          }
          icon={Users}
          confirmLabel={pending.hasClientSnapshot ? 'Create & import' : 'OK'}
          showCancel={pending.hasClientSnapshot}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (!pending.hasClientSnapshot) {
              setPending(null);
              return;
            }
            void finishPdfImport(pending.filePath, pending.replaceExisting);
          }}
        >
          {pending.hasClientSnapshot ? (
            <>
              <p>
                Customer{' '}
                <span className="font-medium text-[var(--ba-text-primary)]">
                  {pending.clientName}
                </span>{' '}
                is not in this database. Importing will create their profile and add document{' '}
                <span className="font-medium text-[var(--ba-text-primary)]">
                  {pending.documentTitle}
                </span>
                .
              </p>
              <p>Continue?</p>
            </>
          ) : (
            <p>
              Customer{' '}
              <span className="font-medium text-[var(--ba-text-primary)]">
                {pending.clientName}
              </span>{' '}
              is missing and this PDF has no client snapshot. Create the customer first, or
              re-export from a newer BlazeAudit.
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  );

  return { startPdfImport, importingPdf, pdfImportDialogs };
}
