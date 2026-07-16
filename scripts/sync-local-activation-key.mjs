/**
 * Ensures resources/local-activation-key.txt exists for local packaged builds.
 * CI omits this file — public GitHub Release installers cannot activate.
 */
import { randomInt } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const keyFile = path.resolve('resources/local-activation-key.txt');
const isCI = process.env.GITHUB_ACTIONS === 'true';

/** Short, easy-to-type words (no digits or ambiguous characters). */
const WORDS = [
  'amber', 'apple', 'atlas', 'beach', 'birch', 'blaze', 'bloom', 'brook',
  'cedar', 'cloud', 'coral', 'creek', 'daisy', 'delta', 'ember', 'frost',
  'glade', 'harbor', 'hazel', 'ivory', 'jade', 'lakes', 'lemon', 'maple',
  'meadow', 'misty', 'north', 'ocean', 'olive', 'pearl', 'pine', 'plum',
  'river', 'robin', 'sage', 'shore', 'silver', 'spark', 'stone', 'storm',
  'sunny', 'tidal', 'trail', 'violet', 'willow', 'winds',
];

function pickWord(exclude) {
  let word = WORDS[randomInt(WORDS.length)];
  while (word === exclude) {
    word = WORDS[randomInt(WORDS.length)];
  }
  return word;
}

function createActivationKey() {
  const first = pickWord();
  const second = pickWord(first);
  return `BLZ-${first}-${second}`;
}

if (fs.existsSync(keyFile)) {
  console.log('sync-local-activation-key: using existing gitignored key file.');
  process.exit(0);
}

if (isCI) {
  console.log('sync-local-activation-key: CI build — no local activation key.');
  process.exit(0);
}

const key = createActivationKey();
fs.mkdirSync(path.dirname(keyFile), { recursive: true });
fs.writeFileSync(keyFile, `${key}\n`, 'utf8');
console.log(`Created ${path.relative(process.cwd(), keyFile)} (gitignored).`);
console.log('Save this key — required to activate packaged installs you build locally.');
console.log(`Key: ${key}`);
