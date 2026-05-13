# raw-assets/

Source-of-truth media — high-resolution originals that **never** enter the bundle.

## Layout

```
raw-assets/
  album1/          # photo shoot #1 — Home Seaside Food Session
    Home Seaside Food Session-1.jpg
    ...
  album2/          # future shoots
  LOGO/            # logo source files (vector + raster)
  VISUALS/         # illustration source files
```

Everything inside `raw-assets/album*/` is gitignored — these are big and re-derivable.
Vector source files (`LOGO/`, `VISUALS/`) are small and can be committed.

## Build pipeline

The originals here are consumed by [`scripts/optimize-photos.mjs`](../scripts/optimize-photos.mjs),
which writes responsive variants (AVIF + WebP + JPG at 400 / 800 / 1280 / 1920 widths)
into [`src/assets/photos/`](../src/assets/photos/). Those output files **are** committed.

Run the pipeline:

```bash
npm run photos:optimize
```

## Why this layout

- `src/` is bundled by Vite. Anything in `src/assets/album*/` raw is a footgun — a single
  4 MB JPG accidentally imported anywhere balloons the bundle.
- `raw-assets/` lives outside `src/`, so Vite never touches it. The script is the only
  consumer.
- Originals stay reproducible — re-shoot, drop into `raw-assets/album1/`, re-run the
  script, commit the new outputs.

## Where to get the originals

These files are not in git. Sources live in the project's shared storage (cloud /
photographer's deliverable). To bootstrap a fresh checkout, copy them into the
matching `raw-assets/album*/` folder.
