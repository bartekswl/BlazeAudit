# ADR-0002: Accounts, activation, local data security & licensing

- **Status:** Accepted
- **Date:** 2026-06-06
- **Deciders:** SubraLab

## Context

BlazeAudit is an offline-first Windows desktop app, but SubraLab needs to:

- know **who and where** is running the product (basic activation telemetry);
- ensure only **authorized** installs can run it, with the ability to **deactivate**
  a misbehaving copy;
- protect the **client/inspection data** stored locally on each machine;
- let a user **recover their data** after a forgotten password or a move to a new
  machine, **without** SubraLab being able to read that data.

These goals pull in opposite directions (awareness/revocation want the network;
offline-first and privacy want the opposite), so a deliberate design is required.
This ADR records the high-level decisions; the detailed design lives in
[`../SECURITY.md`](../SECURITY.md).

## Decision

| Concern                | Choice                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| Identity               | **Account keyed by email**                                             |
| Authorization          | **Single-use activation key**, admin-issued, bound to one **instance id** |
| Instances per account  | **One active instance**; another requires a new admin-issued key       |
| Activation             | **One-time online**; app is otherwise fully offline                     |
| Local data-at-rest     | **SQLCipher-encrypted** SQLite (encrypted `better-sqlite3` build)       |
| Encryption key ("key X") | **Random, opaque, per-account**; **escrowed** server-side, stable      |
| Local key storage      | **Windows DPAPI** (Electron `safeStorage`) + wrapped by the daily password |
| Daily access           | **Local password login**, fully offline                                 |
| Backups                | **Single local encrypted file**, periodic + on-demand; user copies offsite |
| Recovery               | **Re-activation** re-provisions the identical key X -> old backup opens  |
| Enforcement            | **Monthly opportunistic validity check**; **fail-open** on server fault |
| License transport      | **Pluggable** behind an internal license-client contract (host TBD)     |

## Rationale

- **Email accounts + activation keys** give SubraLab a simple identity and a lever
  to authorize/deauthorize installs without a heavyweight identity provider.
- **One-time online activation** satisfies "know who/where" while preserving the
  offline-first promise: the network is touched once to plant the per-account key
  and record telemetry, then not needed for daily use.
- **Server-escrowed key X** is what makes painless recovery possible — a forgotten
  password or a new machine can be restored by reissuing a key, because the *same*
  key X is re-provisioned and the old backup decrypts. The password only locally
  wraps key X and is therefore disposable.
- **SQLCipher + DPAPI** keeps the data and key unreadable at rest; the email is
  only an identity label, never a decryption factor (an opaque key is the real
  lock).
- **Monthly check with fail-open** allows remote deactivation of abusive installs
  while guaranteeing that SubraLab server problems can never brick a paying
  customer.
- **Pluggable transport** avoids committing to a host (own VPS, serverless, or a
  managed service such as Keygen) before that decision is actually needed.

## Alternatives considered

- **Pure-offline activation keys (no server):** simplest and fully offline, but
  cannot report who/where and cannot be revoked or rate-limited — rejected because
  awareness and deactivation are explicit goals.
- **End-to-end encryption (user-held recovery only):** maximally private (SubraLab
  could never read data), but "same email -> automatic recovery" becomes impossible
  without a user-held recovery code; rejected in favor of escrowed keys for easy
  admin-driven recovery. SubraLab accepts the resulting custodial responsibility.
- **Continuous/online-required licensing:** strongest control, but breaks the
  offline-first requirement for field inspectors — rejected in favor of a monthly
  opportunistic check.
- **Managed licensing service (e.g. Keygen) vs. custom endpoint:** deferred, not
  rejected — kept open behind the license-client contract.

## Consequences

- The escrowed key store on the server becomes the **crown jewels**: it must be
  encrypted at rest with tightly controlled admin access. A breach of both a user
  backup *and* the escrow could expose that user's data.
- Accounts + telemetry are **personal data** -> **GDPR** obligations (privacy
  notice, lawful basis, retention). Tracked for the website/legal docs.
- Enforcement is **best-effort**: a user who blocks the network can run within the
  monthly window. This is an accepted trade-off (stop casual abuse, not a
  determined attacker).
- Refines ADR-0001 storage: SQLite is used via an **encryption-capable build**
  (e.g. `better-sqlite3-multiple-ciphers`) rather than plain `better-sqlite3`.
- Adds an external **license/admin server** component (co-hosted with the marketing
  site) to the product surface; see [`../ROADMAP.md`](../ROADMAP.md).
