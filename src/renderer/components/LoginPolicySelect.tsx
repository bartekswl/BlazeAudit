import { LOGIN_POLICIES, type LoginPolicy } from '../../shared/loginPolicy';

export function LoginPolicySelect({
  value,
  onChange,
}: {
  value: LoginPolicy;
  onChange: (policy: LoginPolicy) => void;
}) {
  const selected = LOGIN_POLICIES.find((p) => p.value === value);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-neutral-400">
          Password required
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as LoginPolicy)}
          className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:border-flame-500"
        >
          {LOGIN_POLICIES.map((policy) => (
            <option key={policy.value} value={policy.value}>
              {policy.label}
            </option>
          ))}
        </select>
      </label>
      {selected && <p className="text-xs text-neutral-500">{selected.description}</p>}
      {value === 'never' && (
        <p className="text-xs text-amber-400/90">
          Anyone signed into this Windows profile can open BlazeAudit without a password.
        </p>
      )}
    </div>
  );
}
