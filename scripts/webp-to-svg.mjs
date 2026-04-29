#!/usr/bin/env node
/**
 * Convert raster images (webp/png/jpg/…) → pixel-art SVG.
 *
 * Each pixel becomes a <rect>. Adjacent same-colour pixels are merged into
 * larger rectangles to keep the file compact. Fully transparent pixels are
 * skipped. The output uses shape-rendering="crispEdges" so it stays sharp
 * on Retina / HiDPI displays at any scale.
 *
 * Usage:
 *   node scripts/webp-to-svg.mjs <file.webp> [out.svg]
 *   node scripts/webp-to-svg.mjs public/          # batch-convert a directory
 *
 * Flags:
 *   --current-color   replace every fill colour with currentColor so the icon
 *                     inherits its colour from the CSS `color` property.
 *                     Useful only for single-colour (or near single-colour) icons.
 *   --delete          delete the original raster file after a successful conversion
 *   --dry-run         print what would be done without writing anything
 */

import sharp from 'sharp';
import { readdir, writeFile, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')).map(a => a.slice(2)));
const positional = args.filter(a => !a.startsWith('--'));

const useCurrentColor = flags.has('current-color');
const shouldDelete    = flags.has('delete');
const dryRun          = flags.has('dry-run');

// ── Converter ─────────────────────────────────────────────────────────────────

function toHex(r, g, b, a) {
  const base = [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  return '#' + (a < 255 ? base + a.toString(16).padStart(2, '0') : base);
}

async function toPixelSvg(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  // Build colour grid; null = fully transparent
  const grid = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      return a < 10 ? null : toHex(data[i], data[i + 1], data[i + 2], a);
    }),
  );

  // Horizontal run-length encoding per row
  const runs = [];
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const color = grid[y][x];
      if (color === null) { x++; continue; }
      let w = 1;
      while (x + w < width && grid[y][x + w] === color) w++;
      runs.push({ x, y, w, h: 1, color });
      x += w;
    }
  }

  // Merge runs vertically when same x, w, color and adjacent rows
  const used = new Uint8Array(runs.length);
  const rects = [];
  for (let i = 0; i < runs.length; i++) {
    if (used[i]) continue;
    const r = { ...runs[i] };
    for (let j = i + 1; j < runs.length; j++) {
      if (used[j]) continue;
      const s = runs[j];
      if (s.color === r.color && s.x === r.x && s.w === r.w && s.y === r.y + r.h) {
        r.h++;
        used[j] = 1;
      }
    }
    rects.push(r);
  }

  const fill = useCurrentColor ? () => 'currentColor' : r => r.color;
  const rectEls = rects
    .map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill(r)}"/>`)
    .join('\n  ');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `shape-rendering="crispEdges">\n  ${rectEls}\n</svg>`
  );
}

// ── Core ──────────────────────────────────────────────────────────────────────

async function convertFile(inputPath, outputPath) {
  const label = path.basename(inputPath);

  if (dryRun) {
    console.log(`  (dry) ${label} → ${path.basename(outputPath)}`);
    return;
  }

  const svg = await toPixelSvg(inputPath);
  await writeFile(outputPath, svg, 'utf8');
  const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);

  if (shouldDelete && inputPath !== outputPath) {
    await unlink(inputPath);
    console.log(`  ✓ ${label} [${kb} kB] — original deleted`);
  } else {
    console.log(`  ✓ ${label} [${kb} kB]`);
  }
}

// ── Entry ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg = positional[0];
  if (!arg) {
    console.error(
      'Usage: node scripts/webp-to-svg.mjs <file|dir> [out.svg]\n' +
      '       [--current-color] [--delete] [--dry-run]',
    );
    process.exit(1);
  }
  if (!existsSync(arg)) {
    console.error(`Not found: ${arg}`);
    process.exit(1);
  }

  const s = await stat(arg);

  if (s.isDirectory()) {
    const RASTER_RE = /\.(webp|png|jpg|jpeg|bmp)$/i;
    const files = (await readdir(arg)).filter(f => RASTER_RE.test(f));
    if (!files.length) { console.log('No raster images found.'); return; }

    console.log(`Converting ${files.length} file(s) in ${arg}…\n`);
    let ok = 0, fail = 0;
    for (const file of files) {
      const input = path.join(arg, file);
      const output = path.join(arg, file.replace(/\.[^.]+$/, '.svg'));
      try {
        await convertFile(input, output);
        ok++;
      } catch (e) {
        console.error(`  ✗ ${file}: ${e.message}`);
        fail++;
      }
    }
    console.log(`\nDone. ${ok} succeeded${fail ? `, ${fail} failed` : ''}.`);
  } else {
    const output = positional[1] ?? arg.replace(/\.[^.]+$/, '.svg');
    await convertFile(arg, output);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
