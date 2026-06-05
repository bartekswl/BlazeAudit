// ESLint flat config (ESLint 9+).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // `sandbox/` is local-only scratch (incl. the learning course tooling).
    ignores: ['dist', 'dist-electron', 'release', 'out', 'node_modules', 'coverage', 'sandbox'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Ambient declaration files legitimately alias `export =` modules.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Node tooling scripts run in the Node runtime.
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
);
