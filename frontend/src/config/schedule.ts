/**
 * Day-phase schedule.
 *
 * Five named phases drive ambient behaviour across the site: the theme (light
 * vs dark), the category order in the nav, which hero photo plays, and which
 * accent colour is dominant. The cutoffs below define the START of each phase
 * — they're inclusive of the start hour and exclusive of the next phase's
 * start. So `morning: 6` plus `afternoon: 11` means "morning runs 06:00–10:59".
 *
 * Phase 4 of the redesign swaps `PHASE_CUTOFFS` for a value hydrated from the
 * admin dashboard so the venue staff can shift the rhythm (e.g. push the
 * evening cocktail vibe earlier in winter). Until then, this is the source of
 * truth and `useTimeOfDay` reads it directly.
 */

export type DayPhase = "morning" | "afternoon" | "golden" | "evening" | "night";

export type PhaseCutoffs = Record<DayPhase, number>;

/** Built-in defaults — used when no admin override is set. */
export const DEFAULT_PHASE_CUTOFFS: PhaseCutoffs = {
  morning: 6,    // 06:00 — opening, light coffee, food
  afternoon: 11, // 11:00 — brunch, lighter cocktails, full menu
  golden: 16,    // 16:00 — golden-hour aperitivo
  evening: 19,   // 19:00 — full bar mode, cocktails forward
  night: 23,     // 23:00 — late-night, spirits, low-key
};

const STORAGE_KEY = "homeseaside_schedule_v1";

/** Validate a parsed object is a strict ascending PhaseCutoffs in [0,23]. */
function isValidCutoffs(raw: unknown): raw is PhaseCutoffs {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  const phases: DayPhase[] = ["morning", "afternoon", "golden", "evening", "night"];
  let prev = -1;
  for (const p of phases) {
    const v = r[p];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 23) return false;
    if (v <= prev) return false;
    prev = v;
  }
  return true;
}

/** Live cutoffs (admin override if present, otherwise defaults). */
export function getCutoffs(): PhaseCutoffs {
  if (typeof window === "undefined") return DEFAULT_PHASE_CUTOFFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PHASE_CUTOFFS;
    const parsed = JSON.parse(raw);
    return isValidCutoffs(parsed) ? parsed : DEFAULT_PHASE_CUTOFFS;
  } catch {
    return DEFAULT_PHASE_CUTOFFS;
  }
}

/** Write admin cutoffs. Throws if invalid. Fires a storage event for other tabs. */
export function setCutoffs(cutoffs: PhaseCutoffs): void {
  if (!isValidCutoffs(cutoffs)) {
    throw new Error("Cutoffs must be strictly ascending hours in [0, 23].");
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cutoffs));
  // Notify same-tab listeners — storage events only fire across tabs.
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

/** Reset to defaults. */
export function resetCutoffs(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

/** Storage key — exposed for hook subscriptions. */
export const SCHEDULE_STORAGE_KEY = STORAGE_KEY;

/**
 * @deprecated Use getCutoffs() for live values. Kept for compatibility.
 * Reflects DEFAULT_PHASE_CUTOFFS — not admin overrides.
 */
export const PHASE_CUTOFFS: PhaseCutoffs = DEFAULT_PHASE_CUTOFFS;

/** Ordered list of phases in chronological order (wrapping at night→morning). */
export const PHASE_ORDER: ReadonlyArray<DayPhase> = [
  "morning",
  "afternoon",
  "golden",
  "evening",
  "night",
];

/**
 * Resolve which phase a given hour falls into. Pure function — testable, and
 * the hook calls it on a tick so it stays in sync.
 */
export function phaseForHour(hour: number, cutoffs: PhaseCutoffs = getCutoffs()): DayPhase {
  const h = ((hour % 24) + 24) % 24;
  if (h >= cutoffs.night || h < cutoffs.morning) return "night";
  if (h >= cutoffs.evening) return "evening";
  if (h >= cutoffs.golden) return "golden";
  if (h >= cutoffs.afternoon) return "afternoon";
  return "morning";
}

/** When does `phase` end (exclusive)? Used to schedule the next tick precisely. */
export function phaseEndsAt(phase: DayPhase, cutoffs: PhaseCutoffs = getCutoffs()): number {
  switch (phase) {
    case "morning":   return cutoffs.afternoon;
    case "afternoon": return cutoffs.golden;
    case "golden":    return cutoffs.evening;
    case "evening":   return cutoffs.night;
    case "night":     return cutoffs.morning + 24; // wraps past midnight
  }
}

/**
 * The visual theme each phase activates. Light by day, dark by night, with a
 * warm transition zone in golden hour. The user's manual override (via the
 * TopBar toggle, persisted to localStorage) always wins — see useTimeOfDay.
 */
export const PHASE_THEME: Record<DayPhase, "light" | "dark"> = {
  morning: "light",
  afternoon: "light",
  golden: "light",   // still light, but the accent shifts toward gold/coral
  evening: "dark",
  night: "dark",
};

/**
 * Category ordering by phase — extracted from the previous `getOrder()` in
 * CategoryNav so admin can later edit each phase's order from the dashboard
 * without touching the component.
 */
export const PHASE_CATEGORY_ORDER: Record<DayPhase, ReadonlyArray<string>> = {
  morning:   ["coffee", "food", "beer&wine", "cocktails", "spirits"],
  afternoon: ["food", "coffee", "beer&wine", "spirits", "cocktails"],
  golden:    ["cocktails", "beer&wine", "food", "coffee", "spirits"],
  evening:   ["cocktails", "spirits", "beer&wine", "food", "coffee"],
  night:     ["spirits", "cocktails", "beer&wine", "food", "coffee"],
};
