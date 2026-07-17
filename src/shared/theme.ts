export type ColorTheme = 'dark' | 'light';

export const DEFAULT_COLOR_THEME: ColorTheme = 'light';

export const COLOR_THEME_STORAGE_KEY = 'blazeaudit:colorTheme';

export const COLOR_THEMES: { value: ColorTheme; label: string; description: string }[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Default — cream and safety orange, matched to the dashboard banner.',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Low-glare look tuned for long inspection sessions.',
  },
];
