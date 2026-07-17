import { COLOR_THEMES, type ColorTheme } from '../../../shared/theme';
import { useTheme } from '../../theme/ThemeProvider';

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const selected = COLOR_THEMES.find((entry) => entry.value === theme);

  return (
    <section className="ba-panel p-5">
      <h3 className="ba-section-title">Appearance</h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ba-text-muted)]">
        Choose the color theme for BlazeAudit. Dark is tuned for field work; light uses the
        same flame and warm stone palette with clearer borders.
      </p>
      <div className="mt-4 space-y-2">
        <label className="block">
          <span className="ba-field-label">Color theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ColorTheme)}
            className="ba-select"
          >
            {COLOR_THEMES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        {selected && <p className="text-xs text-[var(--ba-text-muted)]">{selected.description}</p>}
      </div>
    </section>
  );
}
