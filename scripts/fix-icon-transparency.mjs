/**
 * Makes icon corners transparent (rounded squircle mask) and strips white
 * fringe from title-bar assets. Run after replacing resources/*.png.
 */
import sharp from 'sharp';
import path from 'node:path';

const ROOT = path.resolve('resources');

async function applyRoundedAlpha(inputPath, outputPath, radiusRatio = 0.22) {
  const img = sharp(inputPath).ensureAlpha();
  const { width, height } = await img.metadata();
  if (!width || !height) throw new Error(`Invalid image: ${inputPath}`);

  const r = Math.round(Math.min(width, height) * radiusRatio);
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${r}" ry="${r}" fill="white"/></svg>`,
  );

  await img
    .composite([{ input: mask, blend: 'dest-in' }])
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
    // White export fringe and checkerboard grays.
    if (r > 196 && g > 196 && b > 196) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`stripped light bg → ${path.relative(process.cwd(), outputPath)}`);
}

const appIcon = path.join(ROOT, 'app-icon.png');
const titleBarIcon = path.join(ROOT, 'titlebar-icon.png');
const appTmp = path.join(ROOT, '.app-icon-fixed.png');
const titleTmp = path.join(ROOT, '.titlebar-icon-fixed.png');

await applyRoundedAlpha(appIcon, appTmp, 0.22);
await stripLightBackground(titleBarIcon, titleTmp);
await applyRoundedAlpha(titleTmp, titleBarIcon, 0.18);

const fs = await import('node:fs/promises');
await fs.rename(appTmp, appIcon);
await fs.unlink(titleTmp).catch(() => {});

console.log('Icon transparency fix complete.');
