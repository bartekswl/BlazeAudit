# Database backup (Phase 7 on-demand)

Isolated feature for full-account export/import (`.blazebak`).

## Contents of one file

- Encrypted SQLCipher database (`blazeaudit.db`)
- Account preferences as logical JSON (`settings.payload.json`), re-sealed
  locally on import
- Assets: company logo + name-badge / ID photos (`assets/**`)
- Header field `keyXRecovery` — key X sealed to the account email so another
  machine unlocked under the **same email** can open the file and re-key the DB
  to its local key X

Auth/password wraps are **not** included. Gate: unlocked session whose email
matches the backup header.

## Remove this feature

1. Delete this folder (`src/main/backup/`).
2. Remove imports/registers from `src/main/ipc/database.ts` and `src/main/index.ts` if any.
3. Remove IPC channels + preload `database.exportBackup` / `inspectBackup` / `applyBackup`.
4. Revert Database screen Full database buttons to “Coming soon”.
5. Set `DATABASE_BACKUP_FEATURE_ENABLED` to `false` or delete `src/shared/databaseBackup.ts`.
6. Revert `requireSessionKeyX` usage if nothing else needs it (session key can stay).
