/**
 * Rebuild Windows desktop/taskbar icon with clean transparent rounded corners.
 * Generates resources/app-icon.png (+ titlebar) and resources/app-icon.ico
 * (multi-size ICO — avoids white square corners from PNG→ICO conversion).
 *
 * Usage: npm run icons:fix
 */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import path from 'node:path';
import { mkdir, rename, unlink, writeFile, copyFile } from 'node:fs/promises';

const ROOT = path.resolve('resources');
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function applyRoundedAlpha(inputPath, outputPath, radiusRatio = 0.22) {
  const base = sharp(inputPath).ensureAlpha();
  const { width, height } = await base.metadata();
  if (!width || !height) throw new Error(`Invalid image: ${inputPath}`);

  const r = Math.round(Math.min(width, height) * radiusRatio);
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${r}" ry="${r}" fill="white"/></svg>`,
  );

  const { data, info } = await base
    .composite([{ input: mask, blend: 'dest-in' }])
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Fully clear RGB on transparent pixels (Windows ICO often shows white if RGB remains).
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    } else if (data[i + 3] < 16) {
      // Crush near-transparent fringe so Explorer doesn't composite as white.
      data[i + 3] = 0;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`rounded alpha → ${path.relative(process.cwd(), outputPath)}`);
}

async function stripLightBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 196 && g > 196 && b > 196) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else if (data[i + 3] === 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`stripped light bg → ${path.relative(process.cwd(), outputPath)}`);
}

async function buildIco(pngPath, icoPath) {
  const tmpDir = path.join(ROOT, '.ico-sizes');
  await mkdir(tmpDir, { recursive: true });
  const sizeFiles = [];

  for (const size of ICO_SIZES) {
    const out = path.join(tmpDir, `${size}.png`);
    await sharp(pngPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .png()
      .toFile(out);
    sizeFiles.push(out);
  }

  const ico = await pngToIco(sizeFiles);
  await writeFile(icoPath, ico);
  console.log(`windows ico → ${path.relative(process.cwd(), icoPath)} (${ICO_SIZES.join(', ')})`);

  for (const f of sizeFiles) await unlink(f).catch(() => {});
  await unlink(tmpDir).catch(() => {});
}

const appIcon = path.join(ROOT, 'app-icon.png');
const titleBarIcon = path.join(ROOT, 'titlebar-icon.png');
const appIco = path.join(ROOT, 'app-icon.ico');
const appTmp = path.join(ROOT, '.app-icon-fixed.png');
const titleTmp = path.join(ROOT, '.titlebar-icon-fixed.png');

await applyRoundedAlpha(appIcon, appTmp, 0.22);
await stripLightBackground(titleBarIcon, titleTmp);
await applyRoundedAlpha(titleTmp, titleBarIcon, 0.18);
await rename(appTmp, appIcon);
await unlink(titleTmp).catch(() => {});
await buildIco(appIcon, appIco);

// Keep renderer titlebar asset in sync when present.
const rendererTitle = path.resolve('src/renderer/assets/titlebar-icon.png');
const rendererApp = path.resolve('src/renderer/assets/app-icon.png');
await copyFile(titleBarIcon, rendererTitle).catch(() => {});
await copyFile(appIcon, rendererApp).catch(() => {});

console.log('Icon transparency + Windows ICO complete.');
