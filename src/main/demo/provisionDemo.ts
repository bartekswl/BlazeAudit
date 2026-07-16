import { app } from 'electron';
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { accountIdFromEmail } from '../../shared/accountId';
import { DEMO_EMAIL, DEMO_KEY_X, DEMO_PASSWORD } from '../../shared/demo';
import { setActiveAccountId } from '../auth/context';
import { wrapKeyWithPassword } from '../auth/crypto';
import { createInstanceId } from '../auth/instance';
import { keyXFingerprint } from '../auth/keyX';
import { registerAccount, hasAnyAccount } from '../auth/registry';
import { ensureAccountRecordSecret } from '../auth/recordSecret';
import { ensureProfileRecordSecret } from '../auth/profileSecret';
import {
  storeActivationToken,
  storeDpapiKeyX,
  storePasswordWrap,
  writeManifest,
} from '../auth/store';
import { issueDevActivationToken } from '../auth/token';
import { clearAuthStatusCache } from '../auth/statusCache';
import { setLoginPolicy as persistLoginPolicy } from '../settings/store';
import { accountDir } from '../db/paths';
import { demoResourcesDir, isDemoBuild } from './isDemoBuild';

function copyDirIfExists(from: string, to: string): void {
  if (!existsSync(from)) return;
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

/** First launch of the demo installer: copy bundled DB/assets and provision auth locally. */
export async function provisionDemoIfNeeded(): Promise<void> {
  if (!app.isPackaged || !isDemoBuild() || hasAnyAccount()) return;

  const seedDb = path.join(demoResourcesDir(), 'blazeaudit.db');
  if (!existsSync(seedDb)) {
    console.warn('[demo] Seed database missing — skipping demo provisioning.');
    return;
  }

  const email = DEMO_EMAIL.trim().toLowerCase();
  const accountId = accountIdFromEmail(email);
  setActiveAccountId(accountId);

  ensureProfileRecordSecret();

  const destDir = accountDir(accountId);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(seedDb, path.join(destDir, 'blazeaudit.db'));
  copyDirIfExists(path.join(demoResourcesDir(), 'assets'), path.join(destDir, 'assets'));

  registerAccount(email);
  ensureAccountRecordSecret();

  const instanceId = createInstanceId();
  const token = issueDevActivationToken({
    email,
    instanceId,
    issuedAt: new Date().toISOString(),
  });

  const wrap = await wrapKeyWithPassword(DEMO_KEY_X, DEMO_PASSWORD);
  storePasswordWrap(wrap);
  storeActivationToken(token);

  writeManifest({
    version: 1,
    email,
    instanceId,
    activatedAt: new Date().toISOString(),
    passwordSet: true,
    keyXId: keyXFingerprint(DEMO_KEY_X),
    unlockEpoch: 1,
    lastUnlockAt: new Date().toISOString(),
  });

  persistLoginPolicy('never');
  storeDpapiKeyX(DEMO_KEY_X, 1);
  clearAuthStatusCache();

  console.log(`[demo] Provisioned tester account (${email}) with bundled data.`);
}
