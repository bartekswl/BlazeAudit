import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';

// Electron main runs as ESM (package.json "type": "module").
// The preload must be CommonJS because the renderer uses `sandbox: true`,
// which does not support ES module preload scripts — hence the .cjs output.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              // Native module can't be bundled — keep it external so it's
              // require()'d from node_modules at runtime.
              external: ['better-sqlite3-multiple-ciphers', '@node-rs/argon2'],
              output: { format: 'es', entryFileNames: 'index.js' },
            },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart({ reload }) {
          reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            // Sandboxed preload scripts cannot use ESM, so force a CommonJS
            // build. vite-plugin-electron derives format from package.json
            // ("type": "module" => ESM), so we override via lib.formats here.
            lib: {
              entry: 'src/preload/index.ts',
              formats: ['cjs'],
              fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
            },
          },
        },
      },
    ]),
  ],
  build: {
    outDir: 'dist',
  },
});
