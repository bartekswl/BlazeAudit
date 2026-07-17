export type ColorTheme = 'dark' | 'light';

export const DEFAULT_COLOR_THEME: ColorTheme = 'dark';

export const COLOR_THEME_STORAGE_KEY = 'blazeaudit:colorTheme';

export const COLOR_THEMES: { value: ColorTheme; label: string; description: string }[] = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'Default BlazeAudit look — tuned for long inspection sessions.',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Saturated ember + cyan gradients — bold like dark, less white wash.',
  },
];
