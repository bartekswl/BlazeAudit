import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileDown, ImagePlus, Plus, Trash2, UserRound } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { InlineLoader, LoadingOverlay } from '../../components/LoadingOverlay';
import { cn } from '../../lib/cn';
import {
  NAME_BADGE_MAX_EMPLOYEES,
  NAME_BADGE_PER_PAGE_OPTIONS,
  paginateNameBadgeSlots,
  type NameBadge,
  type NameBadgePerPage,
  type NameBadgePrintSlot,
} from '../../../shared/nameBadges';
import { buildNameBadgesPrintHtml } from './buildNameBadgesPrintHtml';

type PhotoCache = Record<string, string | null>;

function BadgeTile({
  badge,
  photoDataUrl,
  onChange,
  onPickPhoto,
  onRemovePhoto,
  onDelete,
  canDelete,
}: {
  badge: NameBadge;
  photoDataUrl: string | null;
  onChange: (input: { name: string; title: string }) => void;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <article className="ba-panel flex min-h-[19rem] flex-col p-4">
      <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--ba-text-faint)]">
          Employee
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1 text-[var(--ba-text-faint)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Remove employee"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="mb-3 flex shrink-0 justify-center">
        <button
          type="button"
          onClick={onPickPhoto}
          onContextMenu={(event) => {
            event.preventDefault();
            if (photoDataUrl) onRemovePhoto();
          }}
          className="group relative aspect-[5/7] w-[5.25rem] shrink-0 overflow-hidden rounded-md border border-dashed border-[var(--ba-border)] bg-[var(--ba-surface-elevated)] transition-colors hover:border-flame-500/40"
          title={photoDataUrl ? 'Click to change photo · right-click to remove' : 'Add photo'}
        >
          {photoDataUrl ? (
            <img src={photoDataUrl} alt="" className="size-full object-cover object-center" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1 text-[var(--ba-text-faint)]">
              <ImagePlus className="size-5" />
              <span className="text-[10px] font-medium">Photo</span>
            </div>
          )}
        </button>
      </div>

      <div className="mt-auto space-y-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ba-text-faint)]">
            Name
          </span>
          <input
            type="text"
            value={badge.name}
            onChange={(event) => onChange({ name: event.target.value, title: badge.title })}
            placeholder="Full name"
            className="ba-input w-full text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ba-text-faint)]">
            Title
          </span>
          <input
            type="text"
            value={badge.title}
            onChange={(event) => onChange({ name: badge.name, title: event.target.value })}
            placeholder="Job title"
            className="ba-input w-full text-sm"
          />
        </label>
      </div>
    </article>
  );
}

export function NameBadgesScreen() {
  const [badges, setBadges] = useState<NameBadge[]>([]);
  const [photos, setPhotos] = useState<PhotoCache>({});
  const [loading, setLoading] = useState(true);
  const [badgesPerPage, setBadgesPerPage] = useState<NameBadgePerPage>(4);
  const [exporting, setExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NameBadge | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const loadPhotos = useCallback(async (items: NameBadge[]) => {
    const entries = await Promise.all(
      items.map(async (badge) => {
        if (!badge.hasPhoto) return [badge.id, null] as const;
        const dataUrl = await window.blazeaudit.nameBadges.getPhoto(badge.id);
        return [badge.id, dataUrl] as const;
      }),
    );
    setPhotos(Object.fromEntries(entries));
  }, []);

  const refresh = useCallback(async () => {
    const [items, business, logo] = await Promise.all([
      window.blazeaudit.nameBadges.list(),
      window.blazeaudit.profile.getBusiness(),
      window.blazeaudit.profile.getLogo(),
    ]);
    setBadges(items);
    setBusinessName(business.businessName);
    setLogoDataUrl(logo);
    await loadPhotos(items);
  }, [loadPhotos]);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (loading || badges.length > 0) return;
    void window.blazeaudit.nameBadges.create({ name: '', title: '' }).then((created) => {
      setBadges([created]);
      setPhotos({ [created.id]: null });
    });
  }, [loading, badges.length]);

  const handleAdd = async () => {
    if (badges.length >= NAME_BADGE_MAX_EMPLOYEES) {
      setAddError(`You can add up to ${NAME_BADGE_MAX_EMPLOYEES} employees.`);
      return;
    }
    setAddError(null);
    try {
      const created = await window.blazeaudit.nameBadges.create({ name: '', title: '' });
      setBadges((current) => [...current, created]);
      setPhotos((current) => ({ ...current, [created.id]: null }));
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Could not add employee.');
    }
  };

  const atEmployeeLimit = badges.length >= NAME_BADGE_MAX_EMPLOYEES;

  const displayBadges = badges.length > 0 ? badges : null;

  const handleChange = async (id: string, input: { name: string; title: string }) => {
    setBadges((current) =>
      current.map((badge) =>
        badge.id === id ? { ...badge, name: input.name, title: input.title } : badge,
      ),
    );
    const updated = await window.blazeaudit.nameBadges.update(id, input);
    setBadges((current) => current.map((badge) => (badge.id === id ? updated : badge)));
  };

  const handlePickPhoto = async (id: string) => {
    const updated = await window.blazeaudit.nameBadges.pickPhoto(id);
    setBadges((current) => current.map((badge) => (badge.id === id ? updated : badge)));
    const dataUrl = updated.hasPhoto ? await window.blazeaudit.nameBadges.getPhoto(id) : null;
    setPhotos((current) => ({ ...current, [id]: dataUrl }));
  };

  const handleRemovePhoto = async (id: string) => {
    const updated = await window.blazeaudit.nameBadges.removePhoto(id);
    setBadges((current) => current.map((badge) => (badge.id === id ? updated : badge)));
    setPhotos((current) => ({ ...current, [id]: null }));
  };

  const handleDelete = async (id: string) => {
    await window.blazeaudit.nameBadges.remove(id);
    setBadges((current) => current.filter((badge) => badge.id !== id));
    setPhotos((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setDeleteTarget(null);
  };

  const printSlots: NameBadgePrintSlot[] = useMemo(
    () =>
      badges.map((badge) => ({
        id: badge.id,
        name: badge.name,
        title: badge.title,
        photoDataUrl: photos[badge.id] ?? null,
      })),
    [badges, photos],
  );

  const pageCount = useMemo(
    () => paginateNameBadgeSlots(printSlots, badgesPerPage).length,
    [printSlots, badgesPerPage],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const pages = paginateNameBadgeSlots(printSlots, badgesPerPage);
      const html = buildNameBadgesPrintHtml({
        businessName,
        logoDataUrl,
        badgesPerPage,
        pages,
      });
      const filename = businessName.trim()
        ? `${businessName.trim()}-name-badges`
        : 'name-badges';
      await window.blazeaudit.nameBadges.exportPdf(html, filename);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <InlineLoader label="Loading name badges…" />;
  }

  return (
    <div className="space-y-5">
      {exporting ? <LoadingOverlay label="Generating PDF…" /> : null}
      <section className="ba-panel flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--ba-text-primary)]">Print settings</h2>
          <p className="mt-1 text-sm text-[var(--ba-text-muted)]">
            Badges export at ID-card size ({pageCount} page{pageCount === 1 ? '' : 's'}). Employees
            are used once before repeating to fill a page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--ba-text-muted)]">
              Badges per page
            </span>
            <select
              value={badgesPerPage}
              onChange={(event) => setBadgesPerPage(Number(event.target.value) as NameBadgePerPage)}
              className="ba-input min-w-[7rem]"
            >
              {NAME_BADGE_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className={cn(
              'ba-btn ba-btn--primary ml-8 inline-flex items-center gap-2 self-center',
              exporting && 'opacity-60',
            )}
          >
            <FileDown className="size-4" />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-flame-400" />
            <h2 className="text-base font-semibold text-[var(--ba-text-primary)]">Employees</h2>
            <span className="text-xs text-[var(--ba-text-muted)]">
              {badges.length}/{NAME_BADGE_MAX_EMPLOYEES}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={atEmployeeLimit}
            className={cn(
              'ba-btn ba-btn--secondary inline-flex items-center gap-2',
              atEmployeeLimit && 'cursor-not-allowed opacity-50',
            )}
          >
            <Plus className="size-4" />
            Add employee
          </button>
        </div>

        {addError ? (
          <p className="mb-3 text-sm text-red-400">{addError}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(displayBadges ?? []).map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              photoDataUrl={photos[badge.id] ?? null}
              onChange={(input) => void handleChange(badge.id, input)}
              onPickPhoto={() => void handlePickPhoto(badge.id)}
              onRemovePhoto={() => void handleRemovePhoto(badge.id)}
              onDelete={() => setDeleteTarget(badge)}
              canDelete={badges.length > 1}
            />
          ))}
        </div>
      </section>

      {deleteTarget && (
        <ConfirmDialog
          title="Remove employee?"
          icon={Trash2}
          confirmLabel="Remove"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete(deleteTarget.id)}
        >
          Remove <strong>{deleteTarget.name.trim() || 'this employee'}</strong> from name badges?
        </ConfirmDialog>
      )}
    </div>
  );
}
