/**
 * Day-phase schedule.
 *
 * Five named phases drive ambient behaviour across the site: the theme,
 * category order in the nav, the hero photo, the dominant accent colour.
 * Cutoffs define the START of each phase (inclusive). So `morning: 6` plus
 * `afternoon: 11` means morning runs 06:00–10:59.
 *
 * The schedule lives on the server (SiteSetting singleton) and is hydrated
 * into an in-memory cache + localStorage at app boot. localStorage is the
 * fast path on subsequent loads (no flash of defaults) and the StorageEvent
 * fanout for cross-tab updates. Admin edits PATCH the API; on success the
 * cache and localStorage are updated and a storage event is broadcast.
 */

import { fetchSiteSetting, updateSiteSetting } from "../api/siteSetting";

export type DayPhase = "morning" | "afternoon" | "golden" | "evening" | "night";

export type PhaseCutoffs = Record<DayPhase, number>;

export type PhaseCategoryOrder = Record<DayPhase, string[]>;

export interface DaySchedule {
  cutoffs: PhaseCutoffs;
  categoryOrder: PhaseCategoryOrder;
}

/** Built-in defaults — used when no admin override is set. */
export const DEFAULT_PHASE_CUTOFFS: PhaseCutoffs = {
  morning: 6,
  afternoon: 11,
  golden: 16,
  evening: 19,
  night: 23,
};

export const DEFAULT_PHASE_CATEGORY_ORDER: PhaseCategoryOrder = {
  morning:   ["coffee", "food", "beer&wine", "cocktails", "spirits"],
  afternoon: ["food", "coffee", "beer&wine", "spirits", "cocktails"],
  golden:    ["cocktails", "beer&wine", "food", "coffee", "spirits"],
  evening:   ["cocktails", "spirits", "beer&wine", "food", "coffee"],
  night:     ["spirits", "cocktails", "beer&wine", "food", "coffee"],
};

export const DEFAULT_SCHEDULE: DaySchedule = {
  cutoffs: DEFAULT_PHASE_CUTOFFS,
  categoryOrder: DEFAULT_PHASE_CATEGORY_ORDER,
};

const STORAGE_KEY = "homeseaside_schedule_v2";

const PHASES: DayPhase[] = ["morning", "afternoon", "golden", "evening", "night"];

function isValidCutoffs(raw: unknown): raw is PhaseCutoffs {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  let prev = -1;
  for (const p of PHASES) {
    const v = r[p];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 23) return false;
    if (v <= prev) return false;
    prev = v;
  }
  return true;
}

function isValidCategoryOrder(raw: unknown): raw is PhaseCategoryOrder {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  for (const p of PHASES) {
    const arr = r[p];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (!arr.every((x) => typeof x === "string")) return false;
  }
  return true;
}

function readFromStorage(): DaySchedule | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !isValidCutoffs((parsed as DaySchedule).cutoffs) ||
      !isValidCategoryOrder((parsed as DaySchedule).categoryOrder)
    ) {
      return null;
    }
    return parsed as DaySchedule;
  } catch {
    return null;
  }
}

// In-memory cache. Hydrated synchronously from localStorage on first load
// (so initial paint is correct), then asynchronously refreshed from the
// server by `loadScheduleFromServer()` at app boot.
let cache: DaySchedule = readFromStorage() ?? DEFAULT_SCHEDULE;

function writeToStorageAndBroadcast(next: DaySchedule): void {
  if (typeof window === "undefined") return;
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function deepCopyOrder(o: PhaseCategoryOrder): PhaseCategoryOrder {
  return {
    morning: [...o.morning],
    afternoon: [...o.afternoon],
    golden: [...o.golden],
    evening: [...o.evening],
    night: [...o.night],
  };
}

/** Live cutoffs (server-hydrated cache, falling back to defaults). */
export function getCutoffs(): PhaseCutoffs {
  return { ...cache.cutoffs };
}

/** Live category order for a phase. */
export function getCategoryOrder(phase: DayPhase): string[] {
  return [...(cache.categoryOrder[phase] ?? DEFAULT_PHASE_CATEGORY_ORDER[phase])];
}

/** Full live schedule snapshot. */
export function getSchedule(): DaySchedule {
  return { cutoffs: { ...cache.cutoffs }, categoryOrder: deepCopyOrder(cache.categoryOrder) };
}

/**
 * Hydrate the cache from the server. Called once at app boot from App.tsx.
 * Silent on failure — we keep using whatever's already in cache.
 */
export async function loadScheduleFromServer(): Promise<void> {
  try {
    const payload = await fetchSiteSetting();
    const next: DaySchedule = {
      cutoffs: isValidCutoffs(payload.schedule?.cutoffs)
        ? payload.schedule.cutoffs
        : DEFAULT_PHASE_CUTOFFS,
      categoryOrder: isValidCategoryOrder(payload.schedule?.categoryOrder)
        ? payload.schedule.categoryOrder
        : DEFAULT_PHASE_CATEGORY_ORDER,
    };
    writeToStorageAndBroadcast(next);
  } catch {
    // Stay on cached/default values silently.
  }
}

/**
 * Persist the schedule to the server. Requires admin auth. On success the
 * cache and localStorage are updated and a storage event is broadcast.
 */
export async function saveSchedule(next: DaySchedule): Promise<void> {
  if (!isValidCutoffs(next.cutoffs)) {
    throw new Error("Cutoffs must be strictly ascending hours in [0, 23].");
  }
  if (!isValidCategoryOrder(next.categoryOrder)) {
    throw new Error("Each phase must have a non-empty list of category ids.");
  }
  await updateSiteSetting({
    schedule: { cutoffs: next.cutoffs, categoryOrder: next.categoryOrder },
  });
  writeToStorageAndBroadcast(next);
}

/** Reset to built-in defaults (server + local). */
export async function resetSchedule(): Promise<void> {
  await saveSchedule(DEFAULT_SCHEDULE);
}

/** Storage key — exposed for hook subscriptions. */
export const SCHEDULE_STORAGE_KEY = STORAGE_KEY;

/** Ordered list of phases in chronological order. */
export const PHASE_ORDER: ReadonlyArray<DayPhase> = PHASES;

/** Pure: which phase does an hour fall into? */
export function phaseForHour(hour: number, cutoffs: PhaseCutoffs = getCutoffs()): DayPhase {
  const h = ((hour % 24) + 24) % 24;
  if (h >= cutoffs.night || h < cutoffs.morning) return "night";
  if (h >= cutoffs.evening) return "evening";
  if (h >= cutoffs.golden) return "golden";
  if (h >= cutoffs.afternoon) return "afternoon";
  return "morning";
}

/** When does `phase` end (exclusive)? */
export function phaseEndsAt(phase: DayPhase, cutoffs: PhaseCutoffs = getCutoffs()): number {
  switch (phase) {
    case "morning":   return cutoffs.afternoon;
    case "afternoon": return cutoffs.golden;
    case "golden":    return cutoffs.evening;
    case "evening":   return cutoffs.night;
    case "night":     return cutoffs.morning + 24;
  }
}

/**
 * Visual theme each phase activates. The user's TopBar override always wins.
 */
export const PHASE_THEME: Record<DayPhase, "light" | "dark"> = {
  morning: "light",
  afternoon: "light",
  golden: "light",
  evening: "dark",
  night: "dark",
};
