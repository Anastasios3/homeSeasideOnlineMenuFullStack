#!/usr/bin/env node
// Generate responsive variants (AVIF + WebP + JPG at multiple widths) for every
// JPG in an album, plus a typed TypeScript manifest. Lives at build-time only —
// outputs are committed; the script is rerun whenever raw photos change.
//
// Usage:   npm run photos:optimize
//   or:    node scripts/optimize-photos.mjs --album=album1 --limit=5
//
// Inputs come from raw-assets/<album>/ (gitignored). On a fresh checkout where
// raw originals aren't local yet, the script also accepts a fallback source
// via --src= or HS_RAW_PHOTOS_DIR env. This lets us bootstrap from the legacy
// location at frontend/src/assets/<album>/ without copying anything.

import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, "..");

// ── Config ─────────────────────────────────────────────────────────────────
const WIDTHS = [400, 800, 1280, 1920];
const FORMATS = [
  { ext: "avif", options: { quality: 55, effort: 4 } },
  { ext: "webp", options: { quality: 78, effort: 4 } },
  { ext: "jpg",  options: { quality: 82, mozjpeg: true, progressive: true } },
];
const LQIP_WIDTH = 24; // tiny blur-up preview width

// ── CLI args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const album = args.album ?? "album1";
const limit = args.limit ? Number(args.limit) : Infinity;
const force = !!args.force;

// When running from a git worktree at <repo>/.claude/worktrees/<name>/frontend,
// walk up the directory tree until we find a sibling main-repo `frontend/`
// that has the raw photos. This lets the script work in any worktree without
// requiring the caller to pass --src or to copy 200 MB of originals around.
function findMainRepoFrontend() {
  let dir = FRONTEND_ROOT;
  for (let i = 0; i < 8; i++) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    const candidate = path.join(parent, "frontend");
    if (candidate !== FRONTEND_ROOT && existsSync(candidate)) return candidate;
    dir = parent;
  }
  return null;
}
const mainRepoFrontend = findMainRepoFrontend();

const candidates = [
  args.src,
  process.env.HS_RAW_PHOTOS_DIR && path.join(process.env.HS_RAW_PHOTOS_DIR, album),
  path.join(FRONTEND_ROOT, "raw-assets", album),
  path.join(FRONTEND_ROOT, "src/assets", album),
  mainRepoFrontend && path.join(mainRepoFrontend, "raw-assets", album),
  mainRepoFrontend && path.join(mainRepoFrontend, "src/assets", album),
].filter(Boolean);

const SRC_DIR = candidates.find((p) => existsSync(p));
if (!SRC_DIR) {
  console.error(`✗ No source directory found. Looked in:\n${candidates.map((c) => "  " + c).join("\n")}`);
  process.exit(1);
}

const OUT_DIR = path.join(FRONTEND_ROOT, "src/assets/photos", album);
const MANIFEST_PATH = path.join(FRONTEND_ROOT, `src/assets/photos/${album}.ts`);

// ── Helpers ────────────────────────────────────────────────────────────────
const slugify = (name) =>
  name
    .replace(/\.(jpe?g|png|webp|tiff?)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    // strip the redundant "home-seaside-" prefix from the shoot filenames
    .replace(/^home-seaside-/, "");

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`);

// ── Process one file ───────────────────────────────────────────────────────
async function processFile(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const slug = slugify(filename);
  const input = sharp(srcPath, { failOn: "none" });
  const meta = await input.metadata();

  const aspectRatio = meta.width && meta.height ? meta.width / meta.height : 1;
  const isPortrait = aspectRatio < 0.95;
  const isLandscape = aspectRatio > 1.05;

  const variants = {};
  let totalOut = 0;

  for (const width of WIDTHS) {
    if (meta.width && width > meta.width) continue; // never upscale
    for (const fmt of FORMATS) {
      const outPath = path.join(OUT_DIR, `${slug}-${width}.${fmt.ext}`);
      if (!force && existsSync(outPath)) {
        const s = await stat(outPath);
        totalOut += s.size;
        variants[`${width}.${fmt.ext}`] = { path: outPath, size: s.size };
        continue;
      }
      const pipeline = sharp(srcPath, { failOn: "none" }).resize({ width, withoutEnlargement: true });
      const out =
        fmt.ext === "avif" ? pipeline.avif(fmt.options) :
        fmt.ext === "webp" ? pipeline.webp(fmt.options) :
        pipeline.jpeg(fmt.options);
      const buf = await out.toBuffer();
      await writeFile(outPath, buf);
      totalOut += buf.length;
      variants[`${width}.${fmt.ext}`] = { path: outPath, size: buf.length };
    }
  }

  // Tiny base64 LQIP (blur-up placeholder) — 24px wide WebP
  const lqipBuf = await sharp(srcPath, { failOn: "none" })
    .resize({ width: LQIP_WIDTH, withoutEnlargement: true })
    .webp({ quality: 30 })
    .toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

  // Dominant color, for the placeholder background
  const { dominant } = await sharp(srcPath, { failOn: "none" }).stats();
  const dominantHex =
    "#" +
    [dominant.r, dominant.g, dominant.b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("");

  return {
    slug,
    sourceFilename: filename,
    width: meta.width,
    height: meta.height,
    aspectRatio: Number(aspectRatio.toFixed(4)),
    orientation: isPortrait ? "portrait" : isLandscape ? "landscape" : "square",
    lqip,
    dominantHex,
    totalOutBytes: totalOut,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const entries = (await readdir(SRC_DIR))
    .filter((n) => /\.(jpe?g|png)$/i.test(n))
    .sort((a, b) => {
      // Natural sort: "Session-2" before "Session-10"
      const na = parseInt(a.match(/(\d+)(?=\D*$)/)?.[1] ?? "0", 10);
      const nb = parseInt(b.match(/(\d+)(?=\D*$)/)?.[1] ?? "0", 10);
      return na - nb || a.localeCompare(b);
    });

  const work = entries.slice(0, limit);
  console.log(`◆ Source:  ${SRC_DIR}`);
  console.log(`◆ Output:  ${OUT_DIR}`);
  console.log(`◆ Files:   ${work.length} of ${entries.length}${limit !== Infinity ? ` (--limit=${limit})` : ""}`);
  console.log(`◆ Widths:  ${WIDTHS.join(", ")}px × formats ${FORMATS.map((f) => f.ext).join(", ")}`);
  console.log();

  const results = [];
  let processed = 0;
  for (const filename of work) {
    const t0 = Date.now();
    try {
      const result = await processFile(filename);
      results.push(result);
      processed++;
      const ms = Date.now() - t0;
      console.log(
        `  ${String(processed).padStart(3, " ")}/${work.length}  ${result.slug.padEnd(28)}  ${result.orientation.padEnd(9)}  ${fmtSize(result.totalOutBytes).padStart(10)}  ${ms}ms`
      );
    } catch (err) {
      console.error(`  ✗ ${filename}: ${err.message}`);
    }
  }

  const totalBytes = results.reduce((s, r) => s + r.totalOutBytes, 0);
  console.log();
  console.log(`◆ Total output: ${fmtSize(totalBytes)} across ${results.length} photos`);

  await writeManifest(results);
  console.log(`◆ Manifest: ${path.relative(FRONTEND_ROOT, MANIFEST_PATH)}`);
}

async function writeManifest(results) {
  const albumName = album;
  const header = `// AUTO-GENERATED by scripts/optimize-photos.mjs — do not edit by hand.
// Re-run with: npm run photos:optimize
//
// Each photo has WebP/AVIF/JPG at widths ${WIDTHS.join("/")}px. Import the
// PhotoMeta record and pass it to <Picture /> — it builds the <picture>
// markup with the right srcset, sizes, and a blur-up placeholder.

export interface PhotoMeta {
  readonly slug: string;
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly orientation: "portrait" | "landscape" | "square";
  readonly lqip: string;          // base64 blur-up placeholder
  readonly dominantHex: string;   // average colour for the bg before LQIP loads
  readonly src: {
    readonly avif: Record<number, string>;
    readonly webp: Record<number, string>;
    readonly jpg:  Record<number, string>;
  };
}
`;

  const widthsLit = `[${WIDTHS.join(", ")}]`;

  const entries = results.map((r) => {
    const buildSrcMap = (ext) => {
      const lines = WIDTHS
        .map((w) => {
          const rel = `./${albumName}/${r.slug}-${w}.${ext}`;
          // skip if upscale skipped (file won't exist)
          if (r.width && w > r.width) return null;
          return `      ${w}: new URL("${rel}", import.meta.url).href,`;
        })
        .filter(Boolean)
        .join("\n");
      return `{\n${lines}\n    }`;
    };

    return `  "${r.slug}": {
    slug: "${r.slug}",
    width: ${r.width},
    height: ${r.height},
    aspectRatio: ${r.aspectRatio},
    orientation: "${r.orientation}",
    lqip: "${r.lqip}",
    dominantHex: "${r.dominantHex}",
    src: {
      avif: ${buildSrcMap("avif")},
      webp: ${buildSrcMap("webp")},
      jpg:  ${buildSrcMap("jpg")},
    },
  },`;
  });

  const body = `
export const PHOTO_WIDTHS = ${widthsLit} as const;

export const ${albumName.toUpperCase()}_PHOTOS: Record<string, PhotoMeta> = {
${entries.join("\n")}
};

export const ${albumName.toUpperCase()}_PHOTO_LIST: ReadonlyArray<PhotoMeta> = Object.values(${albumName.toUpperCase()}_PHOTOS);
`;

  await writeFile(MANIFEST_PATH, header + body, "utf8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
