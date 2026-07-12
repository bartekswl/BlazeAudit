export function StartupLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="boot-loader" role="status" aria-live="polite">
      <div className="boot-loader-spinner" aria-hidden="true" />
      <span className="boot-loader-label">{label}</span>
    </div>
  );
}
