import { BookOpen, Bug, ExternalLink, LifeBuoy, Lightbulb, Mail, Sparkles } from 'lucide-react';
import { SUPPORT } from '../../../shared/support';

function SupportLink({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-lg border border-[var(--ba-panel-border)] bg-[var(--ba-hover-bg)] px-4 py-3 text-left transition-colors hover:border-flame-500/35 hover:bg-flame-500/[0.08]"
    >
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--ba-panel-border)] bg-[var(--ba-input-bg)] text-flame-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--ba-text-primary)]">
          {label}
          <ExternalLink className="size-3 text-[var(--ba-text-faint)]" />
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--ba-text-muted)]">{description}</p>
      </div>
    </button>
  );
}

export function SupportScreen() {
  const open = (url: string) => {
    void window.blazeaudit.app.openExternal(url);
  };

  const contactMailto = `mailto:${SUPPORT.contactEmail}?subject=${encodeURIComponent('BlazeAudit support')}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="ba-panel-hero p-6">
        <div className="flex items-start gap-4">
          <div className="ba-empty-icon shrink-0">
            <LifeBuoy className="size-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--ba-text-primary)]">Support</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ba-text-muted)]">
              Contact SubraLab, request features, report issues, or read the documentation.
            </p>
          </div>
        </div>
      </section>

      <section className="ba-panel p-5">
        <h3 className="ba-section-title">About</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ba-text-muted)]">
          BlazeAudit is created by{' '}
          <span className="font-medium text-[var(--ba-text-secondary)]">{SUPPORT.createdBy}</span>
          . Offline fire-inspection documentation for the field — templates, clients,
          inspections, and PDF export.
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--ba-text-muted)]">
              Contact
            </span>
            <div className="flex gap-2">
              <input
                readOnly
                value={SUPPORT.contactEmail}
                className="min-w-0 flex-1 rounded-lg border border-[var(--ba-panel-border)] bg-[var(--ba-input-bg)] px-3 py-2 text-sm text-[var(--ba-text-secondary)]"
              />
              <button
                type="button"
                className="ba-btn-primary shrink-0"
                onClick={() => open(contactMailto)}
              >
                <Mail className="size-4" />
                Send email
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ba-text-faint)]">
              Opens your mail app with a new message to SubraLab.
            </p>
          </label>

          <SupportLink
            icon={Bug}
            label="Report a bug"
            description="Open GitHub to describe what went wrong."
            onClick={() => open(SUPPORT.reportBugUrl)}
          />

          <SupportLink
            icon={BookOpen}
            label="Documentation"
            description="Project overview, setup, and docs on GitHub."
            onClick={() => open(SUPPORT.docsUrl)}
          />
        </div>
      </section>

      <section className="ba-panel p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-flame-500/25 bg-flame-500/10 text-flame-500">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="ba-section-title">Request a feature</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ba-text-muted)]">
              SubraLab can build <span className="font-medium text-[var(--ba-text-secondary)]">custom features</span>{' '}
              for your workflow — forms, reports, integrations, branding, and more. Tell us what
              you need; we&apos;ll confirm scope, timeline, and details upon request.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ba-text-muted)]">
              Whether it&apos;s a small improvement or a larger custom module, reach out and we&apos;ll
              follow up with options that fit your team.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SupportLink
            icon={Lightbulb}
            label="Request a feature"
            description="Email SubraLab with your idea — custom work and details available on request."
            onClick={() => open(SUPPORT.featureRequestMailto)}
          />
        </div>
      </section>
    </div>
  );
}
