#!/usr/bin/env node
/**
 * Build-time OG image generator.
 *
 * Picks a hero venue photo from src/assets/photos/album1 (1920px JPG variant)
 * and outputs a 1200x630 cover-cropped JPEG at public/og.jpg — the canonical
 * social preview image referenced by index.html and seo.ts.
 *
 * Re-run this whenever you want a different hero photo as the social card.
 */

import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// food-session-67 — "the sea at golden hour" — best venue/atmosphere shot
// per curation.ts. Falls back to a known-good alternative if missing.
const CANDIDATES = [
  "src/assets/photos/album1/food-session-67-1920.jpg",
  "src/assets/photos/album1/food-session-70-1920.jpg",
  "src/assets/photos/album1/food-session-30-1920.jpg",
];

const source = CANDIDATES.map((p) => resolve(ROOT, p)).find((p) => existsSync(p));
if (!source) {
  console.error("✗ no source photo found for OG image. Run photos:optimize first.");
  process.exit(1);
}

const outPath = resolve(ROOT, "public", "og.jpg");

await sharp(source)
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 82, progressive: true, mozjpeg: true })
  .toFile(outPath);

console.log(`✓ wrote public/og.jpg (1200x630) from ${source.split("/").slice(-2).join("/")}`);
