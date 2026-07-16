/**
 * Ensures resources/local-activation-key.txt exists for local packaged builds.
 * CI omits this file — public GitHub Release installers cannot activate.
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const keyFile = path.resolve('resources/local-activation-key.txt');
const isCI = process.env.GITHUB_ACTIONS === 'true';

if (fs.existsSync(keyFile)) {
  console.log('sync-local-activation-key: using existing gitignored key file.');
  process.exit(0);
}

if (isCI) {
  console.log('sync-local-activation-key: CI build — no local activation key.');
  process.exit(0);
}

const key = `BLZ-LOCAL-${randomBytes(8).toString('hex')}`;
fs.mkdirSync(path.dirname(keyFile), { recursive: true });
fs.writeFileSync(keyFile, `${key}\n`, 'utf8');
console.log(`Created ${path.relative(process.cwd(), keyFile)} (gitignored).`);
console.log('Save this key — required to activate packaged installs you build locally.');
console.log(`Key: ${key}`);
