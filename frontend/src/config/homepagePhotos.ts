/**
 * Homepage photo overrides — the admin layer on top of bundled defaults.
 *
 * Three slot collections:
 *   - hero    — single optional photo (null = use bundled default)
 *   - journey — list of 16 morning→night photos with captions
 *   - gallery — variable-length list of supporting photos
 *
 * The Picture component reads the optional `srcset` manifest to wire
 * `<source srcSet=...>` and falls back to plain `<img src>` if absent.
 *
 * Backed by SiteSetting.homepage_photos. Mirrored to localStorage; storage
 * events broadcast updates to any open homepage tab.
 */

import { fetchSiteSetting, updateSiteSetting, type JourneySlot, type GallerySlot, type PhotoSlot } from "../api/siteSetting";

export interface HomepagePhotosOverrides {
  hero: PhotoSlot | null;
  journey: JourneySlot[];
  gallery: GallerySlot[];
}

export const EMPTY_HOMEPAGE_PHOTOS: HomepagePhotosOverrides = {
  hero: null,
  journey: [],
  gallery: [],
};

const STORAGE_KEY = "homeseaside_homepage_photos_v1";
export const HOMEPAGE_PHOTOS_STORAGE_KEY = STORAGE_KEY;

function isPhotoSlot(x: unknown): x is PhotoSlot {
  return !!x && typeof x === "object"
    && typeof (x as PhotoSlot).url === "string"
    && typeof (x as PhotoSlot).alt_en === "string"
    && typeof (x as PhotoSlot).alt_el === "string";
}

function normalize(raw: unknown): HomepagePhotosOverrides {
  const out: HomepagePhotosOverrides = { ...EMPTY_HOMEPAGE_PHOTOS };
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  if (isPhotoSlot(r.hero)) out.hero = r.hero;
  if (Array.isArray(r.journey)) {
    out.journey = r.journey
      .filter((x): x is JourneySlot =>
        isPhotoSlot(x) && typeof (x as JourneySlot).id === "string")
      .map((x, i) => ({
        ...x,
        position: typeof x.position === "number" ? x.position : i,
        caption_en: typeof x.caption_en === "string" ? x.caption_en : "",
        caption_el: typeof x.caption_el === "string" ? x.caption_el : "",
      }))
      .sort((a, b) => a.position - b.position);
  }
  if (Array.isArray(r.gallery)) {
    out.gallery = r.gallery
      .filter((x): x is GallerySlot =>
        isPhotoSlot(x) && typeof (x as GallerySlot).id === "string")
      .map((x, i) => ({
        ...x,
        position: typeof x.position === "number" ? x.position : i,
      }))
      .sort((a, b) => a.position - b.position);
  }
  return out;
}

function readFromStorage(): HomepagePhotosOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

let cache: HomepagePhotosOverrides = readFromStorage() ?? { ...EMPTY_HOMEPAGE_PHOTOS };

function writeToStorageAndBroadcast(next: HomepagePhotosOverrides): void {
  if (typeof window === "undefined") return;
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function getHomepagePhotos(): HomepagePhotosOverrides {
  return JSON.parse(JSON.stringify(cache)) as HomepagePhotosOverrides;
}

export async function loadHomepagePhotosFromServer(): Promise<void> {
  try {
    const payload = await fetchSiteSetting();
    writeToStorageAndBroadcast(normalize(payload.homepage_photos ?? EMPTY_HOMEPAGE_PHOTOS));
  } catch {
    // Stay on cached/empty silently.
  }
}

export async function saveHomepagePhotos(next: HomepagePhotosOverrides): Promise<void> {
  await updateSiteSetting({ homepage_photos: next });
  writeToStorageAndBroadcast(next);
}
