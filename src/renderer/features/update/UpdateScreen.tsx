import { RefreshCw } from 'lucide-react';

export function UpdateScreen() {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-white/5 text-neutral-500">
        <RefreshCw className="size-6" />
      </div>
      <h2 className="text-base font-semibold text-neutral-100">Updates</h2>
      <p className="max-w-sm text-sm text-neutral-400">
        Checking for and installing app updates will live here. This section is a placeholder for
        now.
      </p>
    </div>
  );
}
