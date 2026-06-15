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
        <span className="ba-field-label">Password required</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as LoginPolicy)}
          className="ba-select"
        >
          {LOGIN_POLICIES.map((policy) => (
            <option key={policy.value} value={policy.value}>
              {policy.label}
            </option>
          ))}
        </select>
      </label>
      {selected && <p className="text-xs text-[var(--ba-text-muted)]">{selected.description}</p>}
      {value === 'never' && (
        <p className="text-xs text-amber-400/90">
          Anyone signed into this Windows profile can open BlazeAudit without a password.
        </p>
      )}
    </div>
  );
}
