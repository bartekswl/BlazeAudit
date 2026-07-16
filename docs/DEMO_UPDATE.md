# Demo tester — install & update process

Step-by-step for shipping changes to someone running the **BlazeAudit Demo** installer
and pulling them in via the in-app **Update** tab.

## How updates work (short)

- The app **does not** go online on its own. Nothing checks GitHub until the tester opens
  **Update** and clicks **Check for updates**.
- **Check** compares the installed version (from `package.json` at build time) to
  `latest.yml` on GitHub Releases.
- **Update** downloads changed blocks of the installer (blockmap diff when possible),
  then **Restart & install** runs that installer and relaunches the app.
- **User data** (`%APPDATA%\BlazeAudit\data`) is untouched.
- After a successful restart, the updater **cache folder is deleted** so old installer
  files do not pile up (`%LOCALAPPDATA%\blazeaudit-updater\`).

---

## One-time setup (developer → tester)

**Developer** (in this repo, on your machine):

```powershell
npm run dist:demo
```

Send the tester:

`release\BlazeAudit Demo-Setup-<version>.exe`

(e.g. `BlazeAudit Demo-Setup-0.1.0.exe`)

**Tester:** run the `.exe`, install once. Login is pre-provisioned:

- Email: `jackpps@mail.com`
- Password: `password` (auto-unlock; no prompt with default demo policy)

They only need a **new** demo installer if bundled seed data changes (clients/docs in
the seed DB), not for normal UI/code fixes.

---

## Every code change you want the tester to see (Update tab)

### Automated (preferred)

```powershell
npm run release:update -- "What you changed"
```

See **[`UPDATE_RELEASE_BLUEPRINT.md`](UPDATE_RELEASE_BLUEPRINT.md)** — one command bumps
version, commits, tags, pushes, and triggers GitHub Actions. Tester can **Update** ~3–4
minutes later.

### Manual (only if the script fails)

Do this **in order** after your changes are ready.

### 1. Raise the app version number

Open **`package.json`**. Change the `"version"` field to a **higher** number than
what the tester currently has installed.

Example — tester on `0.1.1`, you ship `0.1.2`:

```json
"version": "0.1.2"
```

Save and commit this with your code changes. If the version is not higher, Update
will say “You’re on the latest version.”

### 2. Push to GitHub

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

### 3. Tag that version (this publishes the build Update reads)

The tag must match the version in `package.json` (with a `v` prefix):

```powershell
git tag v0.1.2
git push origin v0.1.2
```

This starts the **Release** GitHub Action (`.github/workflows/release.yml`). It
builds the Windows installer and uploads to GitHub Releases:

- `BlazeAudit-Setup-<version>.exe`
- `BlazeAudit-Setup-<version>.exe.blockmap`
- `latest.yml`

Wait until the Action finishes (~3–4 minutes). Check: GitHub → **Actions** → green
check, or **Releases** → new tag with those assets.

### 4. Tester pulls the update in the app

1. Open **Update** in the sidebar.
2. Click **Check for updates** (first time going online).
3. When **Update available — v0.1.2** appears → click **Update** → confirm.
4. Wait for the progress bar to reach 100%.
5. Click **Restart & install**.
6. App closes, installs, reopens on the new version with your changes.

---

## Quick checklist (developer)

| Step | Action |
| --- | --- |
| 1 | Change code |
| 2 | Edit `"version"` in `package.json` (must increase) |
| 3 | `git commit` + `git push origin main` |
| 4 | `git tag vX.Y.Z` + `git push origin vX.Y.Z` |
| 5 | Wait for GitHub Action to finish |
| 6 | Tell tester to use **Update** → Check → Update → Restart |

---

## What the tester does *not* do

- Does **not** run `npm`, `git`, or any dev commands.
- Does **not** reinstall unless you send a **new demo installer** (seed/bundled data
  change only).
- Does **not** need to delete cache manually — the app clears `%LOCALAPPDATA%\blazeaudit-updater\`
  on startup after an update.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| “You’re on the latest version” | Version in `package.json` not bumped, or tag not pushed, or Action still running |
| “Updates only available in installed app” | Running `npm run dev` — use the packaged demo `.exe` |
| Update fails / error | Check GitHub Release has `latest.yml` + `.exe` + `.blockmap` for that tag |
| Tester has very old demo build | Install a demo `.exe` whose version is **below** the tagged release, then Update |

---

## Related files

| File | Role |
| --- | --- |
| [`package.json`](../package.json) | `"version"` — must increase each ship |
| [`.github/workflows/release.yml`](../.github/workflows/release.yml) | Builds & uploads on `v*` tag push |
| [`electron-builder.yml`](../electron-builder.yml) | Production installer + GitHub publish config |
| [`electron-builder.demo.yml`](../electron-builder.demo.yml) | Demo installer + bundled seed |
| [`scripts/build-demo-seed.mjs`](../scripts/build-demo-seed.mjs) | Rebuild seed DB from dev `data/` |
| [`src/main/update/updater.ts`](../src/main/update/updater.ts) | Update IPC, cache cleanup |
| [`src/main/demo/provisionDemo.ts`](../src/main/demo/provisionDemo.ts) | First-run demo account setup |
