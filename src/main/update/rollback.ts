import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { UpdateStatus } from '../../shared/update';

const GITHUB_OWNER = 'bartekswl';
const GITHUB_REPO = 'BlazeAudit';
const INSTALLER_NAME = 'BlazeAudit-Setup';

export function rollbackInstallerUrl(version: string): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${version}/${INSTALLER_NAME}-${version}.exe`;
}

export function rollbackInstallerPath(cacheDir: string, version: string): string {
  return path.join(cacheDir, `${INSTALLER_NAME}-${version}.exe`);
}

type ProgressHandler = (status: Extract<UpdateStatus, { phase: 'downloading' }>) => void;

export async function downloadRollbackInstaller(
  version: string,
  cacheDir: string,
  onProgress: ProgressHandler,
): Promise<string> {
  await mkdir(cacheDir, { recursive: true });
  const dest = rollbackInstallerPath(cacheDir, version);
  const url = rollbackInstallerUrl(version);

  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Could not download v${version} (HTTP ${response.status}).`);
  }
  if (!response.body) {
    throw new Error(`Could not download v${version} (empty response).`);
  }

  const total = Number(response.headers.get('content-length') ?? 0);
  let transferred = 0;

  const reader = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
  reader.on('data', (chunk: Buffer | string) => {
    transferred += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
    const percent = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0;
    onProgress({
      phase: 'downloading',
      version,
      percent,
      transferred,
      total,
      bytesPerSecond: 0,
    });
  });

  await pipeline(reader, createWriteStream(dest));
  onProgress({
    phase: 'downloading',
    version,
    percent: 100,
    transferred: total || transferred,
    total: total || transferred,
    bytesPerSecond: 0,
  });

  return dest;
}

export function spawnSilentInstall(installerPath: string): void {
  if (process.platform !== 'win32') {
    throw new Error('Rollback install is supported on Windows only.');
  }
  spawn(installerPath, ['/S', '--force-run'], { detached: true, stdio: 'ignore' }).unref();
}
