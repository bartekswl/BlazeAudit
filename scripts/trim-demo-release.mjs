/**
 * After `npm run dist:demo`, electron-builder leaves win-unpacked, blockmaps,
 * builder debug YAML, etc. Keep only the demo NSIS installer (.exe).
 */
import fs from 'node:fs';
import path from 'node:path';

const releaseDir = path.resolve('release');
const DEMO_EXE_PREFIX = 'BlazeAudit Demo-Setup-';
const DEMO_EXE_SUFFIX = '.exe';

if (!fs.existsSync(releaseDir)) {
  console.log('trim-demo-release: release/ missing — nothing to trim');
  process.exit(0);
}

const entries = fs.readdirSync(releaseDir, { withFileTypes: true });
const demoExes = entries
  .filter((e) => e.isFile() && e.name.startsWith(DEMO_EXE_PREFIX) && e.name.endsWith(DEMO_EXE_SUFFIX))
  .map((e) => e.name)
  .sort();

if (demoExes.length === 0) {
  console.error('trim-demo-release: no BlazeAudit Demo-Setup-*.exe found in release/');
  process.exit(1);
}

// Keep the newest filename (semver sort is fine for patch bumps).
const keepExe = demoExes.at(-1);

for (const entry of entries) {
  const full = path.join(releaseDir, entry.name);
  if (entry.isDirectory()) {
    fs.rmSync(full, { recursive: true, force: true });
    continue;
  }
  if (entry.name === keepExe) continue;
  fs.unlinkSync(full);
}

console.log(`trim-demo-release: kept release/${keepExe}`);
