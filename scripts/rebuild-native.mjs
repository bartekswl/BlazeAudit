// Ensures the encrypted-SQLite native module matches the installed Electron's
// ABI. A plain `npm install` fetches the Node-ABI binary, which Electron can't
// load — so we (re)fetch the Electron prebuild for the exact Electron version.
//
// Runs automatically via the `postinstall` script, and can be run manually:
//   node scripts/rebuild-native.mjs
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const MODULE = 'better-sqlite3-multiple-ciphers';

try {
  const electronVersion = require('electron/package.json').version;
  const moduleDir = path.dirname(require.resolve(`${MODULE}/package.json`));

  console.log(`[rebuild-native] fetching ${MODULE} prebuild for Electron ${electronVersion}`);
  execFileSync('npx', ['prebuild-install', '-r', 'electron', '-t', electronVersion], {
    cwd: moduleDir,
    stdio: 'inherit',
    shell: true,
  });
  console.log('[rebuild-native] done');
} catch (error) {
  // Non-fatal: don't break `npm install` in environments without Electron/network.
  console.warn('[rebuild-native] skipped:', error instanceof Error ? error.message : error);
}
