/**
 * Automated "Update Release" — bump version, commit, tag, push.
 * Triggers GitHub Actions Release workflow; demo testers can then use Update tab.
 *
 * Usage:
 *   npm run release:update
 *   npm run release:update -- --minor
 *   npm run release:update -- --major
 *
 * Do not pass a changelog string — GitHub Release body stays empty unless you
 * add notes manually on the release (shown in the in-app Update tab only then).
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const PACKAGE_JSON = path.join(ROOT, 'package.json');

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
}

function runOut(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function parseArgs(argv) {
  let bump = 'patch';
  for (const arg of argv) {
    if (arg === '--minor') bump = 'minor';
    else if (arg === '--major') bump = 'major';
    else if (arg === '--patch') bump = 'patch';
    else if (!arg.startsWith('-')) {
      console.warn(
        `release-update: ignoring "${arg}" — do not auto-add update notes. ` +
          'Add a message manually on the GitHub Release if you want one shown in-app.',
      );
    }
  }
  return { bump };
}

function bumpSemver(version, kind) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/.exec(version);
  if (!match) throw new Error(`Invalid semver in package.json: ${version}`);
  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);
  if (kind === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (kind === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
  if (typeof pkg.version !== 'string') throw new Error('package.json missing "version".');
  return pkg;
}

function writeVersion(version) {
  const pkg = readVersion();
  pkg.version = version;
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function tagExists(tag) {
  try {
    runOut(`git rev-parse --verify refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}

const { bump } = parseArgs(process.argv.slice(2));

try {
  const branch = runOut('git rev-parse --abbrev-ref HEAD');
  if (branch !== 'main') {
    console.error(`release-update: switch to main first (currently on "${branch}").`);
    process.exit(1);
  }

  const pkg = readVersion();
  const oldVersion = pkg.version;
  const newVersion = bumpSemver(oldVersion, bump);
  const tag = `v${newVersion}`;

  if (tagExists(tag)) {
    console.error(`release-update: tag ${tag} already exists.`);
    process.exit(1);
  }

  console.log(`\nrelease-update: ${oldVersion} → ${newVersion} (${bump})\n`);

  writeVersion(newVersion);
  run('git add package.json');

  const dirty = runOut('git status --porcelain').length > 0;
  if (dirty) {
    run('git add -A');
  }

  const stillDirty = runOut('git status --porcelain').length > 0;
  const commitMsg = `Release ${tag}.`;

  if (stillDirty) {
    const msgFile = path.join(tmpdir(), `blazeaudit-release-${Date.now()}.txt`);
    writeFileSync(msgFile, commitMsg, 'utf8');
    try {
      run(`git commit -F "${msgFile}"`);
    } finally {
      unlinkSync(msgFile);
    }
  } else {
    console.log('release-update: nothing to commit (version already matches working tree).');
  }

  run(`git tag ${tag}`);
  run('git push origin main');
  run(`git push origin ${tag}`);

  console.log('\n✓ Update release pushed.');
  console.log(`  Tag: ${tag}`);
  console.log('  GitHub Actions will build and publish in ~3–4 minutes.');
  console.log(`  Release: https://github.com/bartekswl/BlazeAudit/releases/tag/${tag}`);
  console.log('  Update notes: none (add manually on the GitHub Release if wanted).\n');
  console.log('Tester: Update tab → Check for updates → Update → Restart & install.\n');

  try {
    const runs = runOut('gh run list --workflow=release.yml --limit 1 --json url,status -q ".[0]"');
    if (runs) console.log(`  Actions: ${runs}\n`);
  } catch {
    /* gh optional */
  }
} catch (err) {
  console.error('\nrelease-update failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
