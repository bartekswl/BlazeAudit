import { defineConfig } from 'vite';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';

const preloadOutput = path.resolve('dist-electron/preload/index.cjs');

// Electron main runs as ESM (package.json "type": "module").
// The preload must be CommonJS because the renderer uses `sandbox: true`,
// which does not support ES module preload scripts — hence the .cjs output.
export default defineConfig(({ command }) => {
  // A stale preload must not make the main build think this dev run is ready.
  if (command === 'serve') rmSync(preloadOutput, { force: true });

  return {
  server: {
    // Transform the first-render graph while Electron's main/preload bundles
    // are starting. This avoids a second multi-second cold compile only after
    // the BrowserWindow requests the dev page.
    warmup: {
      clientFiles: [
        './src/renderer/main.tsx',
        './src/renderer/App.tsx',
        './src/renderer/index.css',
        './src/renderer/features/dashboard/DashboardScreen.tsx',
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'src/main/index.ts',
        async onstart({ startup }) {
          // Main and preload compile in separate Vite workers. Launch only
          // after this run's sandbox-compatible preload exists.
          const deadline = Date.now() + 15_000;
          while (!existsSync(preloadOutput) && Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (!existsSync(preloadOutput)) {
            throw new Error('Electron preload build did not finish before startup.');
          }
          await startup();
        },
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
        onstart({ reload }) {
          // On later preload edits, refresh the renderer without restarting
          // the Electron process. Initial startup is owned by the main build.
          reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            // Sandboxed preload scripts cannot use ESM, so force a CommonJS
            // library build. Define the entry here instead of also using the
            // plugin entry shortcut, which would create a second ESM build.
            lib: {
              entry: 'src/preload/index.ts',
              formats: ['cjs'],
              fileName: () => 'index.cjs',
            },
          },
        },
      },
    ]),
  ],
  build: {
    outDir: 'dist',
  },
  };
});
