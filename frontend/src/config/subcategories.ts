/**
 * Subcategory metadata overrides — the admin layer on top of the auto-derived
 * subcategory list from MenuItem.category strings.
 *
 * The "slug" of a subcategory is its canonical English `category` value as
 * stored on MenuItem. This is immutable from the admin panel — renaming the
 * label_en here doesn't touch the items' category field. Both the customer
 * menu and the admin filter chips read the labels and ordering from here,
 * falling back to the slug if no override is present.
 *
 * Backed by SiteSetting.subcategories on the server, mirrored to localStorage
 * for fast first paint, and broadcast via a custom storage event so any open
 * MenuSection re-renders when the admin saves.
 */

import { fetchSiteSetting, updateSiteSetting, type SubcategoryMeta } from "../api/siteSetting";

export type MainCategoryId = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";

export const MAIN_CATEGORIES: MainCategoryId[] = [
  "coffee", "cocktails", "beer&wine", "food", "spirits",
];

export type SubcategoryOverrides = Record<MainCategoryId, SubcategoryMeta[]>;

export const EMPTY_OVERRIDES: SubcategoryOverrides = {
  coffee: [], spirits: [], cocktails: [], "beer&wine": [], food: [],
};

const STORAGE_KEY = "homeseaside_subcategories_v4";
export const SUBCATEGORIES_STORAGE_KEY = STORAGE_KEY;

function isValidOverrides(raw: unknown): raw is SubcategoryOverrides {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  for (const mc of MAIN_CATEGORIES) {
    const arr = r[mc];
    if (arr !== undefined && !Array.isArray(arr)) return false;
  }
  return true;
}

function normalize(raw: unknown): SubcategoryOverrides {
  if (!isValidOverrides(raw)) return { ...EMPTY_OVERRIDES };
  const out: SubcategoryOverrides = { ...EMPTY_OVERRIDES };
  for (const mc of MAIN_CATEGORIES) {
    const arr = (raw as Record<string, unknown>)[mc];
    if (Array.isArray(arr)) {
      out[mc] = arr
        .filter((x): x is SubcategoryMeta =>
          typeof x === "object" && x !== null && typeof (x as { slug: unknown }).slug === "string",
        )
        .map((x, i) => ({
          slug: x.slug,
          label_en: typeof x.label_en === "string" ? x.label_en : x.slug,
          label_el: typeof x.label_el === "string" ? x.label_el : x.slug,
          position: typeof x.position === "number" ? x.position : i,
          hidden: x.hidden === true,
          icon: typeof x.icon === "string" ? x.icon : null,
        }));
    }
  }
  return out;
}

function readFromStorage(): SubcategoryOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

let cache: SubcategoryOverrides = readFromStorage() ?? { ...EMPTY_OVERRIDES };

function writeToStorageAndBroadcast(next: SubcategoryOverrides): void {
  if (typeof window === "undefined") return;
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

/** Live overrides snapshot. */
export function getOverrides(): SubcategoryOverrides {
  return JSON.parse(JSON.stringify(cache)) as SubcategoryOverrides;
}

/** Get override metadata for a specific (main_category, slug) pair, or null. */
export function getMeta(main: MainCategoryId, slug: string): SubcategoryMeta | null {
  const arr = cache[main];
  if (!arr) return null;
  return arr.find((x) => x.slug === slug) ?? null;
}

/** Hydrate cache from server. */
export async function loadSubcategoriesFromServer(): Promise<void> {
  try {
    const payload = await fetchSiteSetting();
    const next = normalize(payload.subcategories ?? {});
    writeToStorageAndBroadcast(next);
  } catch {
    // Stay on cached/empty silently.
  }
}

/** Save full overrides hash to server + cache. Admin auth required. */
export async function saveSubcategoryOverrides(next: SubcategoryOverrides): Promise<void> {
  // Server-side stores as plain hash keyed by main_category.
  await updateSiteSetting({ subcategories: next });
  writeToStorageAndBroadcast(next);
}

/**
 * Merge auto-derived slugs (from current MenuItem.category values) with the
 * stored overrides. Returns a full editable list per main_category that
 * includes any new subcategory the admin hasn't customised yet.
 */
export function mergeDerivedWithOverrides(
  derived: Record<MainCategoryId, { slug: string; label_en: string; label_el: string }[]>,
): SubcategoryOverrides {
  const out: SubcategoryOverrides = { ...EMPTY_OVERRIDES };
  for (const mc of MAIN_CATEGORIES) {
    const derivedForMain = derived[mc] ?? [];
    const overrides = cache[mc] ?? [];
    const overrideBySlug = new Map(overrides.map((o) => [o.slug, o]));
    const merged: SubcategoryMeta[] = [];
    // Existing overrides first, in their saved position order.
    for (const o of overrides) {
      if (derivedForMain.some((d) => d.slug === o.slug)) merged.push(o);
    }
    // New slugs (present in items but not in overrides) appended at the end.
    for (const d of derivedForMain) {
      if (!overrideBySlug.has(d.slug)) {
        merged.push({
          slug: d.slug,
          label_en: d.label_en,
          label_el: d.label_el,
          position: merged.length,
          hidden: false,
          icon: null,
        });
      }
    }
    // Renumber positions so they're 0..N-1 contiguous.
    out[mc] = merged.map((m, i) => ({ ...m, position: i }));
  }
  return out;
}
