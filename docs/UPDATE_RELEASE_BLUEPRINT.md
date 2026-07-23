# Update Release blueprint

**Trigger phrase:** `Update Release` (or `Update Release request`)

When you need to ship code changes so the **demo tester** can pull them via
the in-app **Update** tab, follow this blueprint. Do **not** hand-edit version numbers
or run git tag commands manually unless the script fails.

---

## Automated loop (default)

### One command

From the repo root, after your code changes are saved:

```powershell
npm run release:update
```

Do **not** auto-add an update message. The GitHub Release body stays empty so the
in-app Update tab shows no notes. If you want a message shown there, add it
**manually** on the GitHub Release after publish (or ask for that explicitly).

**What the script does automatically:**

1. Verifies you are on branch **`main`**
2. Reads **`package.json`** `"version"` (e.g. `0.1.1`)
3. Bumps **patch** by 1 → `0.1.2` (use flags below for minor/major)
4. Writes the new version to **`package.json`**
5. **`git add -A`** and **commits** (includes your code changes + version bump)
6. Creates tag **`v0.1.2`**
7. **`git push origin main`**
8. **`git push origin v0.1.2`**

**What happens on GitHub (automatic):**

9. **Release** workflow (`.github/workflows/release.yml`) runs on the tag
10. Builds Windows installer + `latest.yml` + `.blockmap`
11. Publishes to [GitHub Releases](https://github.com/bartekswl/BlazeAudit/releases)

**Tester (manual in app, ~3–4 min after step 8):**

12. **Update** → **Check for updates** → **Update** → **Restart & install**

---

## Version bump options

| Command | Bumps |
| --- | --- |
| `npm run release:update` | patch (`0.1.1` → `0.1.2`) |
| `npm run release:update -- --minor` | minor (`0.1.1` → `0.2.0`) |
| `npm run release:update -- --major` | major (`0.1.1` → `1.0.0`) |

---

## Release checklist

When shipping an update for the demo tester:

1. Ensure code changes are complete and the working tree reflects what should ship.
2. Run from repo root:
   ```powershell
   npm run release:update
   ```
3. Report the new version and tag URL.
4. Wait ~3–4 minutes, then the tester can use **Update** in the demo app.
5. Optional: if you want in-app update notes, edit the GitHub Release body yourself.
6. Do **not** run `dist:demo` unless bundled seed data changed (see [`DEMO_UPDATE.md`](DEMO_UPDATE.md)).

Do **not** bump `package.json` by hand or create tags manually unless the script errors.

---

## Prerequisites

| Requirement | Why |
| --- | --- |
| On **`main`** | Script refuses other branches |
| **Git** remote `origin` → GitHub | Push + Actions |
| **No existing tag** for the new version | Script aborts if `vX.Y.Z` exists |
| Tester has **demo installed** at an **older** version | Otherwise Update shows “up to date” |

---

## One-time tester setup (not part of Update Release)

Only when the tester does **not** have the app yet, or bundled **seed data** changed:

```powershell
npm run dist:demo
```

Send `release\BlazeAudit Demo-Setup-<version>.exe`. See [`DEMO_UPDATE.md`](DEMO_UPDATE.md).

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `switch to main first` | `git checkout main` |
| `tag vX.Y.Z already exists` | That version was already released; script already bumped or re-run after failed push |
| Actions failed | GitHub → Actions → open failed run → fix → new `release:update` |
| Tester sees no update | Wait for green Action; tester version must be **lower** than tagged version |
| Script commit includes wrong files | Review `git status` before running; `.gitignore` excludes `data/`, `release/`, etc. |

---

## Related

| Item | Path |
| --- | --- |
| Release script | [`scripts/release-update.mjs`](../scripts/release-update.mjs) |
| npm script | `npm run release:update` in [`package.json`](../package.json) |
| CI workflow | [`.github/workflows/release.yml`](../.github/workflows/release.yml) |
| Tester-facing notes | [`DEMO_UPDATE.md`](DEMO_UPDATE.md) |
| Updater + cache cleanup | [`src/main/update/updater.ts`](../src/main/update/updater.ts) |
