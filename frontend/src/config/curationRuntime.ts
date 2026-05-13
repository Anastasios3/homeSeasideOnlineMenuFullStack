/**
 * Server-aware curation runtime.
 *
 * Reads the unified curation list from `homepage_photos.curation` (server,
 * mirrored to localStorage). Falls back to the bundled ALBUM1_CURATION when
 * the server list is empty or missing — so a brand-new install with no
 * SiteSetting document yet still shows the original homepage.
 *
 * Public API:
 *   getCuration()                  — full active list (hidden filtered out, sorted by position)
 *   getHeroEntryForPhase(phase)    — highest-priority entry whose `phases[]` contains `phase`
 *   getJourneyEntries()            — visible entries in position order, for the journey strip
 *   resolveImage(entry)            — uniform image-data accessor: returns either bundled PhotoMeta
 *                                    or a custom-photo descriptor with url + srcset
 *
 * All consumers should subscribe to `HOMEPAGE_PHOTOS_STORAGE_KEY` storage
 * events to react to admin changes live.
 */

import { ALBUM1_PHOTOS, type PhotoMeta } from "../assets/photos/album1";
import { ALBUM1_CURATION } from "../assets/photos/curation";
import { getHomepagePhotos } from "./homepagePhotos";
import type { CuratedEntry } from "../api/siteSetting";
import type { DayPhase } from "./schedule";

/** Bundled fallback — used when no server-side curation exists yet. */
function bundledFallback(): CuratedEntry[] {
  return ALBUM1_CURATION.map((c, i) => ({
    kind: "bundled" as const,
    slug: c.slug,
    phases: [...c.phases],
    subjects: [...c.subjects],
    captionEN: c.captionEN,
    captionEL: c.captionEL,
    altEN: c.captionEN,
    altEL: c.captionEL,
    priority: c.priority ?? 0,
    hidden: false,
    position: i,
  }));
}

export function getCuration(): CuratedEntry[] {
  const stored = getHomepagePhotos().curation;
  const source = stored.length > 0 ? stored : bundledFallback();
  return source
    .filter((e) => !e.hidden)
    .sort((a, b) => a.position - b.position);
}

/** All entries including hidden ones — used by the admin editor. */
export function getCurationAll(): CuratedEntry[] {
  const stored = getHomepagePhotos().curation;
  const source = stored.length > 0 ? stored : bundledFallback();
  return [...source].sort((a, b) => a.position - b.position);
}

/**
 * Hero rotation. Picks the highest-priority entry whose `phases` includes
 * the current day-phase. If nothing matches, falls back to the first
 * visible entry (so the hero never goes blank).
 */
export function getHeroEntryForPhase(phase: DayPhase): CuratedEntry | null {
  const list = getCuration();
  if (list.length === 0) return null;
  const matches = list.filter((e) => e.phases.includes(phase));
  if (matches.length === 0) return list[0];
  return matches.reduce(
    (best, e) => (e.priority > best.priority ? e : best),
    matches[0],
  );
}

/**
 * Journey-strip entries in position order. The strip simply scrolls through
 * everything visible — chapter dividers used to come from explicit phase
 * groups, but we now derive them on the fly from `phases[0]` per entry so
 * the admin doesn't have to think about it.
 */
export function getJourneyEntries(): CuratedEntry[] {
  return getCuration();
}

/** Bundled-photo descriptor — `meta` is non-null for bundled entries. */
export interface ResolvedBundled {
  kind: "bundled";
  meta: PhotoMeta;
  entry: CuratedEntry;
}

/** Custom-upload descriptor — direct URL + optional srcset from the upload. */
export interface ResolvedCustom {
  kind: "custom";
  url: string;
  srcset?: { "640": string; "1280": string; "1920": string };
  width?: number;
  height?: number;
  entry: CuratedEntry;
}

export type ResolvedPhoto = ResolvedBundled | ResolvedCustom | null;

/**
 * Uniform image-data accessor. Returns null for bundled entries whose slug
 * isn't in ALBUM1_PHOTOS (e.g. if the admin re-orders something that was
 * since removed from the bundle) — callers should fallback or skip render.
 */
export function resolveImage(entry: CuratedEntry): ResolvedPhoto {
  if (entry.kind === "bundled") {
    const meta = ALBUM1_PHOTOS[entry.slug];
    return meta ? { kind: "bundled", meta, entry } : null;
  }
  if (!entry.url) return null;
  return {
    kind: "custom",
    url: entry.url,
    srcset: entry.srcset,
    width: entry.width,
    height: entry.height,
    entry,
  };
}
