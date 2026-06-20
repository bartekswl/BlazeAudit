import { useEffect, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function ConfirmDialog({
  title,
  icon: Icon,
  confirmLabel,
  cancelLabel = 'Cancel',
  showCancel = true,
  onCancel,
  onConfirm,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  confirmLabel: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="ba-modal-overlay fixed inset-0 z-50 grid place-items-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="ba-modal w-full max-w-md p-6"
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {Icon && (
          <div className="mb-4 flex justify-center">
            <div className="ba-empty-icon">
              <Icon className="size-7" />
            </div>
          </div>
        )}

        <h2
          id="confirm-dialog-title"
          className="text-center text-lg font-semibold text-[var(--ba-text-primary)]"
        >
          {title}
        </h2>

        <div
          id="confirm-dialog-desc"
          className="mt-4 space-y-3 text-center text-sm leading-relaxed text-[var(--ba-text-muted)]"
        >
          {children}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-[var(--ba-panel-border)] pt-4">
          {showCancel && (
            <button type="button" onClick={onCancel} className="ba-btn-ghost">
              {cancelLabel}
            </button>
          )}
          <button type="button" onClick={onConfirm} className="ba-btn-primary">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
