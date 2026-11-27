import { sanitizeReleaseNotes } from '../../shared/update';
import { installerFileName } from './rollback';

const RELEASES_URL = 'https://api.github.com/repos/bartekswl/BlazeAudit/releases?per_page=100';

export type ReleaseOffer = {
  version: string;
  notes: string | null;
};

type GitHubRelease = {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  body?: string | null;
  assets?: { name?: string }[];
};

/** True when `version` is a higher dotted version than `other`. */
export function isNewerVersion(version: string, other: string): boolean {
  const parse = (value: string) => value.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const left = parse(version);
  const right = parse(other);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const a = left[i] ?? 0;
    const b = right[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

/** Newest published release first. Skips drafts, prereleases, and tags with no installer yet. */
export function pickNewerReleases(releases: GitHubRelease[], currentVersion: string): ReleaseOffer[] {
  const offers: ReleaseOffer[] = [];
  for (const release of releases) {
    if (release.draft || release.prerelease) continue;
    const version = (release.tag_name ?? '').replace(/^v/, '');
    if (!/^\d+\.\d+\.\d+$/.test(version)) continue;
    if (!isNewerVersion(version, currentVersion)) continue;
    const fileName = installerFileName(version);
    if (!release.assets?.some((asset) => asset.name === fileName)) continue;
    offers.push({
      version,
      notes: sanitizeReleaseNotes(release.body),
    });
  }
  offers.sort((a, b) => (isNewerVersion(a.version, b.version) ? -1 : 1));
  return offers;
}

/** Releases newer than `currentVersion`, highest version first. */
export async function listNewerReleases(currentVersion: string): Promise<ReleaseOffer[]> {
  const response = await fetch(RELEASES_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'BlazeAudit',
    },
  });
  if (!response.ok) {
    throw new Error(`Could not list releases (HTTP ${response.status}).`);
  }
  const releases = (await response.json()) as unknown;
  if (!Array.isArray(releases)) {
    throw new Error('Could not list releases.');
  }
  return pickNewerReleases(releases as GitHubRelease[], currentVersion);
}
