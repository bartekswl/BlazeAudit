import { useEffect, useState } from 'react';

export function StatusBar() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    void window.blazeaudit.app.getVersion().then(setVersion);
  }, []);

  return (
    <footer className="ba-statusbar flex h-7 shrink-0 items-center justify-between px-3 text-xs text-[var(--ba-text-muted)]">
      <span>BlazeAudit{version ? ` v${version}` : ''}</span>
      <span>© {new Date().getFullYear()} BlazeAudit · SubraLab</span>
      <span
        title="Powered by SubraLab"
        className="cursor-default transition-colors hover:text-flame-500"
      >
        SubraLab
      </span>
    </footer>
  );
}
