import { nativeImage } from 'electron';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ort from 'onnxruntime-web/wasm';
import type { PenRead } from '../../shared/form/readContent/applyReadPages';
import type { OcrPage } from '../../shared/form/readContent/ocrTypes';

export type HandwritingRequest = {
  scanIndex: number;
  filePath: string;
  flatten?: boolean;
  ocrPage?: OcrPage;
  anchors?: Record<string, readonly [number, number]>;
  boxes: { key: string; x: number; y: number; w: number; h: number; allowed?: string }[];
  marks?: {
    key: string;
    yes: { x: number; y: number; w: number; h: number };
    no: { x: number; y: number; w: number; h: number };
  }[];
  checks?: { key: string; x: number; y: number; w: number; h: number }[];
};

const CANON_W = 1600;
const CANON_H = 2000;
const MODEL_H = 48;
const CHARSET = ['', ...Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index))];

let sessionPromise: Promise<ort.InferenceSession | null> | null = null;

function resolveModelPath(isPackaged: boolean, appPath: string): string | null {
  const candidates = isPackaged
    ? [path.join(process.resourcesPath, 'ocr', 'wormocr-9M.onnx')]
    : [
        path.join(appPath, 'resources', 'ocr', 'wormocr-9M.onnx'),
        path.join(appPath, 'data', 'ocr-smoke', 'wormocr', 'wormocr-9M', 'wormocr-9M.onnx'),
      ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveWasmDir(isPackaged: boolean, appPath: string): string {
  if (isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'onnxruntime-web', 'dist');
    if (existsSync(unpacked)) return unpacked;
  }
  return path.join(appPath, 'node_modules', 'onnxruntime-web', 'dist');
}

async function getSession(isPackaged: boolean, appPath: string): Promise<ort.InferenceSession | null> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const modelPath = resolveModelPath(isPackaged, appPath);
      if (!modelPath) return null;
      const wasmDir = resolveWasmDir(isPackaged, appPath);
      ort.env.wasm.wasmPaths = pathToFileURL(wasmDir + path.sep).href;
      ort.env.wasm.numThreads = 1;
      const bytes = readFileSync(modelPath);
      return ort.InferenceSession.create(bytes, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        intraOpNumThreads: 1,
        interOpNumThreads: 1,
      });
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

/** Read EXIF orientation tag (1..8) from JPEG APP1 header so phone photos rotate upright. */
function readJpegExifOrientation(bytes: Buffer): number {
  if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const size = bytes.readUInt16BE(offset + 2);
    if (size < 2 || offset + 2 + size > bytes.length) break;
    if (
      marker === 0xe1 &&
      size >= 14 &&
      bytes.toString('ascii', offset + 4, offset + 10) === 'Exif\0\0'
    ) {
      const tiff = offset + 10;
      const little = bytes.toString('ascii', tiff, tiff + 2) === 'II';
      const u16 = (pos: number) => (little ? bytes.readUInt16LE(pos) : bytes.readUInt16BE(pos));
      const u32 = (pos: number) => (little ? bytes.readUInt32LE(pos) : bytes.readUInt32BE(pos));
      const ifd = tiff + u32(tiff + 4);
      if (ifd + 2 <= bytes.length) {
        const entries = u16(ifd);
        for (let i = 0; i < entries; i += 1) {
          const entry = ifd + 2 + i * 12;
          if (entry + 12 > bytes.length) break;
          if (u16(entry) === 0x0112) {
            const val = u16(entry + 8);
            return val >= 1 && val <= 8 ? val : 1;
          }
        }
      }
      break;
    }
    offset += 2 + size;
  }
  return 1;
}

type GrayBuffer = { width: number; height: number; data: Uint8Array };

function loadOrientedGray(filePath: string): GrayBuffer | null {
  if (!existsSync(filePath)) return null;
  const rawBytes = readFileSync(filePath);
  const orientation = readJpegExifOrientation(rawBytes);
  let img = nativeImage.createFromBuffer(rawBytes);
  if (img.isEmpty()) return null;
  const size0 = img.getSize();
  const maxLong = 2200;
  const longSide = Math.max(size0.width, size0.height);
  if (longSide > maxLong) {
    const sc = maxLong / longSide;
    img = img.resize({
      width: Math.max(1, Math.round(size0.width * sc)),
      height: Math.max(1, Math.round(size0.height * sc)),
      quality: 'better',
    });
  }
  const { width: w0, height: h0 } = img.getSize();
  const bgra = img.toBitmap();
  const gray0 = new Uint8Array(w0 * h0);
  for (let i = 0; i < w0 * h0; i += 1) {
    const b = bgra[i * 4] ?? 255;
    const g = bgra[i * 4 + 1] ?? 255;
    const r = bgra[i * 4 + 2] ?? 255;
    gray0[i] = (r * 77 + g * 150 + b * 29) >> 8;
  }
  if (orientation === 1) return { width: w0, height: h0, data: gray0 };
  const swap = orientation >= 5 && orientation <= 8;
  const width = swap ? h0 : w0;
  const height = swap ? w0 : h0;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < h0; y += 1) {
    for (let x = 0; x < w0; x += 1) {
      let dx = x;
      let dy = y;
      switch (orientation) {
        case 2:
          dx = w0 - 1 - x;
          break;
        case 3:
          dx = w0 - 1 - x;
          dy = h0 - 1 - y;
          break;
        case 4:
          dy = h0 - 1 - y;
          break;
        case 5:
          dx = y;
          dy = x;
          break;
        case 6:
          dx = h0 - 1 - y;
          dy = x;
          break;
        case 7:
          dx = h0 - 1 - y;
          dy = w0 - 1 - x;
          break;
        case 8:
          dx = y;
          dy = w0 - 1 - x;
          break;
      }
      out[dy * width + dx] = gray0[y * w0 + x]!;
    }
  }
  return { width, height, data: out };
}

function normToken(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function extractUniqueWords(page: OcrPage): Map<string, [number, number]> {
  const counts = new Map<string, [number, number][]>();
  for (const line of page.lines) {
    for (const word of line.words) {
      const token = normToken(word.text);
      if (token.length < 5) continue;
      if (word.x < 0.39 && word.y < 0.24) continue;
      if (/\d/.test(token) && token !== '5362019' && token !== 'section') continue;
      const cx = word.x + word.w / 2;
      const cy = word.y + word.h / 2;
      const list = counts.get(token);
      if (list) list.push([cx, cy]);
      else counts.set(token, [[cx, cy]]);
    }
  }
  const unique = new Map<string, [number, number]>();
  for (const [token, list] of counts) {
    if (list.length === 1) unique.set(token, list[0]!);
  }
  return unique;
}

/** Solve 8x8 linear system A * x = b with Gaussian elimination & partial pivoting. */
function solveLinear8(A: number[][], b: number[]): number[] | null {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    let best = Math.abs(M[col]![col]!);
    for (let row = col + 1; row < n; row += 1) {
      const val = Math.abs(M[row]![col]!);
      if (val > best) {
        best = val;
        pivot = row;
      }
    }
    if (best < 1e-11) return null;
    if (pivot !== col) {
      const tmp = M[col]!;
      M[col] = M[pivot]!;
      M[pivot] = tmp;
    }
    const diag = M[col]![col]!;
    for (let j = col; j <= n; j += 1) M[col]![j]! /= diag;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = M[row]![col]!;
      if (factor === 0) continue;
      for (let j = col; j <= n; j += 1) {
        M[row]![j]! -= factor * M[col]![j]!;
      }
    }
  }
  return M.map((row) => row[n]!);
}

/** Fit homography mapping destination (canonical) -> source (photo) from >=4 correspondences. */
function fitHomographyLeastSquares(
  pairs: { sx: number; sy: number; dx: number; dy: number }[],
): Float64Array | null {
  if (pairs.length < 4) return null;
  // Normalize coordinates to [-1, 1] for numerical stability
  const normS = 1 / 1200;
  const normD = 1 / 1000;
  const AtA = Array.from({ length: 8 }, () => new Array<number>(8).fill(0));
  const Atb = new Array<number>(8).fill(0);

  const accumulate = (row: number[], rhs: number) => {
    for (let i = 0; i < 8; i += 1) {
      Atb[i]! += row[i]! * rhs;
      for (let j = i; j < 8; j += 1) {
        AtA[i]![j]! += row[i]! * row[j]!;
      }
    }
  };

  // Map (dx, dy) -> (sx, sy) directly so inverse warping needs no matrix inversion!
  for (const p of pairs) {
    const x = p.dx * normD;
    const y = p.dy * normD;
    const u = p.sx * normS;
    const v = p.sy * normS;
    accumulate([x, y, 1, 0, 0, 0, -u * x, -u * y], u);
    accumulate([0, 0, 0, x, y, 1, -v * x, -v * y], v);
  }
  for (let i = 0; i < 8; i += 1) {
    for (let j = 0; j < i; j += 1) AtA[i]![j] = AtA[j]![i]!;
  }
  const h = solveLinear8(AtA, Atb);
  if (!h) return null;
  // Denormalize: [u/normS, v/normS, 1]^T ~ H_norm * [x*normD, y*normD, 1]^T
  const invS = 1 / normS;
  return new Float64Array([
    h[0]! * normD * invS,
    h[1]! * normD * invS,
    h[2]! * invS,
    h[3]! * normD * invS,
    h[4]! * normD * invS,
    h[5]! * invS,
    h[6]! * normD,
    h[7]! * normD,
    1,
  ]);
}

function estimateHomographyRansac(
  photo: GrayBuffer,
  ocrPage: OcrPage,
  anchors: Record<string, readonly [number, number]>,
): Float64Array | null {
  const seen = extractUniqueWords(ocrPage);
  const allPairs: { sx: number; sy: number; dx: number; dy: number }[] = [];
  for (const [token, [cx, cy]] of Object.entries(anchors)) {
    const hit = seen.get(token);
    if (!hit) continue;
    allPairs.push({
      sx: hit[0] * photo.width,
      sy: hit[1] * photo.height,
      dx: cx * CANON_W,
      dy: cy * CANON_H,
    });
  }
  if (allPairs.length < 8) return null;

  let bestInliers: typeof allPairs = [];
  const thresholdSq = (photo.width * 0.008) ** 2;
  // Deterministic PRNG so runs are 100% reproducible
  let seed = 0x20261115;
  const nextRand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let iter = 0; iter < 180; iter += 1) {
    const sample: typeof allPairs = [];
    const used = new Set<number>();
    while (sample.length < 4) {
      const idx = Math.floor(nextRand() * allPairs.length);
      if (used.has(idx)) continue;
      used.add(idx);
      sample.push(allPairs[idx]!);
    }
    const H = fitHomographyLeastSquares(sample);
    if (!H) continue;
    const inliers: typeof allPairs = [];
    for (const p of allPairs) {
      const denom = H[6]! * p.dx + H[7]! * p.dy + 1;
      if (Math.abs(denom) < 1e-6) continue;
      const px = (H[0]! * p.dx + H[1]! * p.dy + H[2]!) / denom;
      const py = (H[3]! * p.dx + H[4]! * p.dy + H[5]!) / denom;
      const errSq = (px - p.sx) ** 2 + (py - p.sy) ** 2;
      if (errSq <= thresholdSq) inliers.push(p);
    }
    if (inliers.length > bestInliers.length) bestInliers = inliers;
  }
  if (bestInliers.length < 8) return null;
  return fitHomographyLeastSquares(bestInliers);
}

/** Fast box-blur illumination flatten so shadows and dark phone photos become clean ~248 white paper. */
function normalizeIllumination(gray: GrayBuffer): GrayBuffer {
  const { width: w, height: h, data } = gray;
  const radius = Math.max(20, Math.round(w / 42));
  // Integral image (summed-area table) for O(1) per-pixel local background estimation!
  const stride = w + 1;
  const integral = new Float64Array(stride * (h + 1));
  for (let y = 0; y < h; y += 1) {
    let rowSum = 0;
    const rowOff = (y + 1) * stride;
    const prevOff = y * stride;
    const srcOff = y * w;
    for (let x = 0; x < w; x += 1) {
      rowSum += data[srcOff + x]!;
      integral[rowOff + x + 1] = integral[prevOff + x + 1]! + rowSum;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h, y + radius + 1);
    const r0 = y0 * stride;
    const r1 = y1 * stride;
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w, x + radius + 1);
      const sum = integral[r1 + x1]! - integral[r0 + x1]! - integral[r1 + x0]! + integral[r0 + x0]!;
      const bg = Math.max(40, sum / ((x1 - x0) * (y1 - y0)));
      const norm = Math.round((data[y * w + x]! * 248) / bg);
      out[y * w + x] = norm > 255 ? 255 : norm < 0 ? 0 : norm;
    }
  }
  return { width: w, height: h, data: out };
}

function warpCanonical(photo: GrayBuffer, H: Float64Array): GrayBuffer {
  const out = new Uint8Array(CANON_W * CANON_H).fill(255);
  const sw = photo.width;
  const sh = photo.height;
  const src = photo.data;
  for (let dy = 0; dy < CANON_H; dy += 1) {
    const rowBase = dy * CANON_W;
    const h1y = H[1]! * dy + H[2]!;
    const h4y = H[4]! * dy + H[5]!;
    const h7y = H[7]! * dy + 1;
    for (let dx = 0; dx < CANON_W; dx += 1) {
      const denom = H[6]! * dx + h7y;
      const sx = (H[0]! * dx + h1y) / denom;
      const sy = (H[3]! * dx + h4y) / denom;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 + 1 >= sw || y0 + 1 >= sh) continue;
      const fx = sx - x0;
      const fy = sy - y0;
      const idx = y0 * sw + x0;
      const top = src[idx]! * (1 - fx) + src[idx + 1]! * fx;
      const bot = src[idx + sw]! * (1 - fx) + src[idx + sw + 1]! * fx;
      out[rowBase + dx] = Math.round(top * (1 - fy) + bot * fy);
    }
  }
  return normalizeIllumination({ width: CANON_W, height: CANON_H, data: out });
}

/** Fallback ruled-border crop if OCR anchors are unavailable. */
function cropToRuledBorder(photo: GrayBuffer): GrayBuffer {
  const norm = normalizeIllumination(photo);
  const { width: w, height: h, data } = norm;
  let top = 0;
  let bottom = h - 1;
  let left = 0;
  let right = w - 1;
  for (let y = 0; y < h; y += 1) {
    let dark = 0;
    for (let x = 0; x < w; x += 2) if (data[y * w + x]! < 190) dark += 1;
    if (dark / (w / 2) > 0.25) {
      top = y;
      break;
    }
  }
  for (let y = h - 1; y > top; y -= 1) {
    let dark = 0;
    for (let x = 0; x < w; x += 2) if (data[y * w + x]! < 190) dark += 1;
    if (dark / (w / 2) > 0.25) {
      bottom = y;
      break;
    }
  }
  for (let x = 0; x < w; x += 1) {
    let dark = 0;
    for (let y = top; y <= bottom; y += 2) if (data[y * w + x]! < 190) dark += 1;
    if (dark / Math.max(1, (bottom - top) / 2) > 0.15) {
      left = x;
      break;
    }
  }
  for (let x = w - 1; x > left; x -= 1) {
    let dark = 0;
    for (let y = top; y <= bottom; y += 2) if (data[y * w + x]! < 190) dark += 1;
    if (dark / Math.max(1, (bottom - top) / 2) > 0.15) {
      right = x;
      break;
    }
  }
  const cw = Math.max(16, right - left + 1);
  const ch = Math.max(16, bottom - top + 1);
  const cropped = new Uint8Array(cw * ch);
  for (let y = 0; y < ch; y += 1) {
    cropped.set(data.subarray((top + y) * w + left, (top + y) * w + left + cw), y * cw);
  }
  return { width: cw, height: ch, data: cropped };
}

function medianValue(values: Uint8Array): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < values.length; i += 1) hist[values[i]!]! += 1;
  const half = values.length >>> 1;
  let acc = 0;
  for (let v = 0; v < 256; v += 1) {
    acc += hist[v]!;
    if (acc > half) return v;
  }
  return 248;
}

/** Extract clean handwriting crop from a cell, or null when the cell is empty. */
function prepareCellCrop(
  flat: GrayBuffer,
  box: { x: number; y: number; w: number; h: number },
): GrayBuffer | null {
  const W = flat.width;
  const H = flat.height;
  const x0 = Math.max(0, Math.floor(box.x * W));
  const y0 = Math.max(0, Math.floor(box.y * H));
  const x1 = Math.min(W, Math.ceil((box.x + box.w) * W));
  const y1 = Math.min(H, Math.ceil((box.y + box.h) * H));
  const cw = x1 - x0;
  const ch = y1 - y0;
  if (cw < 12 || ch < 8) return null;

  const cell = new Uint8Array(cw * ch);
  for (let r = 0; r < ch; r += 1) {
    cell.set(flat.data.subarray((y0 + r) * W + x0, (y0 + r) * W + x0 + cw), r * cw);
  }

  // Erase horizontal rules near top/bottom while preserving vertical strokes crossing them
  for (let r = 0; r < ch; r += 1) {
    if (r >= ch * 0.28 && r <= ch * 0.72) continue;
    let dark = 0;
    for (let c = 0; c < cw; c += 1) if (cell[r * cw + c]! < 200) dark += 1;
    if (dark / cw > 0.35) {
      const ref = r < ch / 2 ? Math.min(ch - 1, r + 4) : Math.max(0, r - 4);
      for (let c = 0; c < cw; c += 1) {
        if (cell[ref * cw + c]! > 185) cell[r * cw + c] = 248;
      }
    }
  }
  // Erase vertical rules near far left/right while preserving horizontal strokes crossing them
  for (let c = 0; c < cw; c += 1) {
    if (c >= cw * 0.06 && c <= cw * 0.94) continue;
    let dark = 0;
    for (let r = 0; r < ch; r += 1) if (cell[r * cw + c]! < 200) dark += 1;
    if (dark / ch > 0.7) {
      const ref = c < cw / 2 ? Math.min(cw - 1, c + 4) : Math.max(0, c - 4);
      for (let r = 0; r < ch; r += 1) {
        if (cell[r * cw + ref]! > 185) cell[r * cw + c] = 248;
      }
    }
  }

  // Connected-component ink gate (8-connected BFS) so blank cells never reach ONNX!
  const paper = medianValue(cell);
  const cutoff = paper * 0.76;
  const visited = new Uint8Array(cw * ch);
  const queue = new Int32Array(cw * ch);
  let blobs = 0;
  let areaSum = 0;
  let minX = cw;
  let maxX = -1;
  let minY = ch;
  let maxY = -1;

  for (let r = 2; r < ch - 2; r += 1) {
    for (let c = 2; c < cw - 2; c += 1) {
      const start = r * cw + c;
      if (visited[start] || cell[start]! >= cutoff) continue;
      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      visited[start] = 1;
      let bx0 = c;
      let bx1 = c;
      let by0 = r;
      let by1 = r;
      while (head < tail) {
        const cur = queue[head++]!;
        const cy = Math.floor(cur / cw);
        const cx = cur - cy * cw;
        if (cx < bx0) bx0 = cx;
        if (cx > bx1) bx1 = cx;
        if (cy < by0) by0 = cy;
        if (cy > by1) by1 = cy;
        for (let dy = -1; dy <= 1; dy += 1) {
          const ny = cy + dy;
          if (ny < 2 || ny >= ch - 2) continue;
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = cx + dx;
            if (nx < 2 || nx >= cw - 2) continue;
            const nIdx = ny * cw + nx;
            if (!visited[nIdx] && cell[nIdx]! < cutoff) {
              visited[nIdx] = 1;
              queue[tail++] = nIdx;
            }
          }
        }
      }
      const area = tail;
      const bw = bx1 - bx0 + 1;
      const bh = by1 - by0 + 1;
      if (area < 14) continue;
      if (bh <= 4 && bw > cw * 0.25) continue;
      if (bw <= 4 && bh > ch * 0.72) continue;
      blobs += 1;
      areaSum += area;
      if (bx0 < minX) minX = bx0;
      if (bx1 > maxX) maxX = bx1;
      if (by0 < minY) minY = by0;
      if (by1 > maxY) maxY = by1;
    }
  }

  // A single digit (notification count, a short project number) is one small blob.
  if (blobs === 0 || areaSum < 36) return null;
  const spanW = maxX - minX + 1;
  const spanH = maxY - minY + 1;
  if (spanH < Math.max(6, Math.floor(ch * 0.16)) || spanW < 7) return null;

  const subX0 = Math.max(0, minX - 14);
  const subX1 = Math.min(cw, maxX + 1 + 22);
  const padY = Math.max(5, Math.round(spanH * 0.25));
  const subY0 = Math.max(0, minY - padY);
  const subY1 = Math.min(ch, maxY + 1 + padY);
  const subW = subX1 - subX0;
  const subH = subY1 - subY0;

  const padTop = 4;
  const padLeft = 10;
  const padRight = 18;
  const outW = subW + padLeft + padRight;
  const outH = subH + padTop * 2;
  const out = new Uint8Array(outW * outH).fill(paper);
  for (let r = 0; r < subH; r += 1) {
    out.set(
      cell.subarray((subY0 + r) * cw + subX0, (subY0 + r) * cw + subX1),
      (padTop + r) * outW + padLeft,
    );
  }
  return { width: outW, height: outH, data: out };
}

function resizeBilinearToTensor(crop: GrayBuffer): { tensor: Float32Array; width: number } {
  let dstW = Math.max(8, Math.round(crop.width * (MODEL_H / crop.height)));
  if (dstW % 4 !== 0) dstW += 4 - (dstW % 4);
  dstW = Math.min(1600, dstW);
  const out = new Float32Array(MODEL_H * dstW);
  const sw = crop.width;
  const sh = crop.height;
  const src = crop.data;
  for (let dy = 0; dy < MODEL_H; dy += 1) {
    const sy = Math.min(sh - 1, Math.max(0, (dy + 0.5) * (sh / MODEL_H) - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let dx = 0; dx < dstW; dx += 1) {
      const sx = Math.min(sw - 1, Math.max(0, (dx + 0.5) * (sw / dstW) - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const top = src[y0 * sw + x0]! * (1 - fx) + src[y0 * sw + x1]! * fx;
      const bot = src[y1 * sw + x0]! * (1 - fx) + src[y1 * sw + x1]! * fx;
      const val = top * (1 - fy) + bot * fy;
      out[dy * dstW + dx] = (val / 255 - 0.5) / 0.5;
    }
  }
  return { tensor: out, width: dstW };
}

function decodeCtcGreedy(
  data: Float32Array,
  dims: readonly number[],
  allowed?: string,
): { text: string; confidence: number } {
  const frames = dims[0] === 1 ? (dims[1] ?? 0) : (dims[0] ?? 0);
  const classes = dims[dims.length - 1] ?? 96;
  const allowedSet = allowed ? new Set(Array.from(allowed)) : null;
  const chars: string[] = [];
  const confs: number[] = [];
  let prev = -1;
  for (let t = 0; t < frames; t += 1) {
    const base = t * classes;
    let rowMax = data[base] ?? -1e9;
    for (let c = 1; c < classes; c += 1) {
      const v = data[base + c] ?? -1e9;
      if (v > rowMax) rowMax = v;
    }
    let expSum = 0;
    let best = 0;
    let bestVal = data[base] ?? -1e9;
    for (let c = 0; c < classes; c += 1) {
      const v = data[base + c] ?? -1e9;
      expSum += Math.exp(v - rowMax);
      if (c > 0 && (!allowedSet || allowedSet.has(CHARSET[c] ?? '')) && v > bestVal) {
        bestVal = v;
        best = c;
      }
    }
    const prob = expSum > 0 ? Math.exp(bestVal - rowMax) / expSum : 0;
    if (best !== 0 && best !== prev) {
      chars.push(CHARSET[best] ?? '');
      confs.push(prob);
    } else if (best !== 0 && best === prev && confs.length > 0) {
      confs[confs.length - 1] = Math.max(confs[confs.length - 1]!, prob);
    }
    prev = best;
  }
  const confidence = confs.length > 0 ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
  return { text: chars.join('').trim(), confidence };
}

function inkRatio(flat: GrayBuffer, box: { x: number; y: number; w: number; h: number }): number {
  const W = flat.width;
  const H = flat.height;
  const x0 = Math.max(0, Math.floor(box.x * W));
  const y0 = Math.max(0, Math.floor(box.y * H));
  const x1 = Math.min(W, Math.ceil((box.x + box.w) * W));
  const y1 = Math.min(H, Math.ceil((box.y + box.h) * H));
  if (x1 <= x0 || y1 <= y0) return 0;
  let dark = 0;
  let total = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      total += 1;
      if (flat.data[y * W + x]! < 178) dark += 1;
    }
  }
  return total > 0 ? dark / total : 0;
}

function isInnerSquareChecked(flat: GrayBuffer, box: { x: number; y: number; w: number; h: number }): boolean {
  const W = flat.width;
  const H = flat.height;
  const x0 = Math.max(0, Math.floor((box.x + box.w * 0.38) * W));
  const y0 = Math.max(0, Math.floor((box.y + box.h * 0.38) * H));
  const x1 = Math.min(W, Math.max(x0 + 1, Math.ceil((box.x + box.w * 0.62) * W)));
  const y1 = Math.min(H, Math.max(y0 + 1, Math.ceil((box.y + box.h * 0.62) * H)));
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      sum += flat.data[y * W + x]!;
      count += 1;
    }
  }
  return count > 0 && sum / count < 145;
}

/** Read pen inside the given boxes using a single-threaded local ONNX CTC model (no Python/PyTorch). */
export async function readHandwriting(
  pages: HandwritingRequest[],
  env?: { isPackaged: boolean; appPath: string },
): Promise<PenRead[]> {
  if (pages.length === 0) return [];
  let isPackaged = env?.isPackaged ?? false;
  let appPath = env?.appPath ?? process.cwd();
  if (!env) {
    const { app } = await import('electron');
    isPackaged = app.isPackaged;
    appPath = app.getAppPath();
  }

  const session = await getSession(isPackaged, appPath);
  const reads: PenRead[] = [];

  for (const page of pages) {
    const raw = loadOrientedGray(page.filePath);
    if (!raw) continue;

    let flat: GrayBuffer;
    const homography =
      page.ocrPage && page.anchors ? estimateHomographyRansac(raw, page.ocrPage, page.anchors) : null;
    if (homography) {
      flat = warpCanonical(raw, homography);
    } else if (page.flatten) {
      flat = cropToRuledBorder(raw);
    } else {
      flat = normalizeIllumination(raw);
    }

    for (const check of page.checks ?? []) {
      reads.push({
        scanIndex: page.scanIndex,
        key: check.key,
        text: isInnerSquareChecked(flat, check) ? 'yes' : '',
      });
    }

    for (const mark of page.marks ?? []) {
      const yesInk = inkRatio(flat, mark.yes);
      const noInk = inkRatio(flat, mark.no);
      let choice = '';
      if (yesInk > 0.05 && yesInk > noInk * 1.45) choice = 'yes';
      else if (noInk > 0.05 && noInk > yesInk * 1.45) choice = 'no';
      reads.push({ scanIndex: page.scanIndex, key: mark.key, text: choice });
    }

    if (!session) continue;

    for (const box of page.boxes) {
      const crop = prepareCellCrop(flat, box);
      if (!crop) {
        reads.push({ scanIndex: page.scanIndex, key: box.key, text: '' });
        continue;
      }
      const { tensor, width } = resizeBilinearToTensor(crop);
      const input = new ort.Tensor('float32', tensor, [1, 1, MODEL_H, width]);
      const outputs = await session.run({ image: input });
      const first = Object.values(outputs)[0];
      const decoded = first
        ? decodeCtcGreedy(first.data as Float32Array, first.dims, box.allowed)
        : { text: '', confidence: 0 };
      reads.push({
        scanIndex: page.scanIndex,
        key: box.key,
        text: decoded.confidence >= 0.36 ? decoded.text : '',
      });
    }
  }

  return reads;
}
