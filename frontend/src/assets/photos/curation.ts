/**
 * Editorial curation for album1 — sits alongside the auto-generated manifest.
 *
 * This is the SINGLE PLACE to edit if you want to swap which photos appear
 * where. Each entry tags a photo with the day-phase it best fits, the
 * subject, and an optional descriptive caption for "A Day at Home Seaside".
 *
 * The optimize-photos script never touches this file — it's hand-curated
 * and safe to edit between re-runs.
 */

import type { DayPhase } from "../../config/schedule";
import { ALBUM1_PHOTOS, type PhotoMeta } from "./album1";

export type PhotoSubject =
  | "coffee"
  | "food"
  | "drink"
  | "venue"
  | "ocean"
  | "detail"
  | "dessert";

export interface CuratedPhoto {
  /** Matches a slug in ALBUM1_PHOTOS — see album1.ts. */
  readonly slug: string;
  /** Which day-phase this shot best evokes (multiple allowed). */
  readonly phases: ReadonlyArray<DayPhase>;
  readonly subjects: ReadonlyArray<PhotoSubject>;
  /** Caption for the horizontal "A Day at Home Seaside" track. */
  readonly captionEN: string;
  readonly captionEL: string;
  /** Higher = preferred for hero/headline slots. */
  readonly priority?: number;
}

/**
 * Curated list — drives the home page hero, the horizontal journey, and the
 * background photo behind each section. Drop new entries here as photos are
 * added in future shoots.
 *
 * Slugs come from the optimize script's filename normalisation:
 *   "Home Seaside Food Session-5.jpg" → "food-session-5"
 */
export const ALBUM1_CURATION: ReadonlyArray<CuratedPhoto> = [
  // ── Morning — coffee, brunch, bright daylight ────────────────────────
  {
    slug: "food-session-30",
    phases: ["morning", "afternoon"],
    subjects: ["venue", "detail"],
    captionEN: "Morning light, fresh menu",
    captionEL: "Πρωινό φως, φρέσκο μενού",
    priority: 9,
  },
  {
    slug: "food-session-5",
    phases: ["morning"],
    subjects: ["coffee", "food"],
    captionEN: "Espresso, latte art, and what's next",
    captionEL: "Espresso, latte art, και τι ακολουθεί",
    priority: 8,
  },
  {
    slug: "food-session-10",
    phases: ["morning", "afternoon"],
    subjects: ["coffee", "food"],
    captionEN: "Slow breakfast by the window",
    captionEL: "Αργό πρωινό δίπλα στο παράθυρο",
    priority: 7,
  },
  {
    slug: "food-session-40",
    phases: ["morning"],
    subjects: ["food", "detail"],
    captionEN: "Honeycomb, walnuts, microgreens",
    captionEL: "Κηρήθρα, καρύδια, μικροφύλλα",
  },

  // ── Afternoon — brunch, juices, plated food on cream backdrops ──────
  {
    slug: "food-session-15",
    phases: ["afternoon"],
    subjects: ["food"],
    captionEN: "Toasted sandwich, embossed tile, quiet hours",
    captionEL: "Ψητό σάντουιτς, ανάγλυφο πλακάκι, ήσυχες ώρες",
  },
  {
    slug: "food-session-20",
    phases: ["afternoon"],
    subjects: ["food"],
    captionEN: "Stacked, layered, plenty",
    captionEL: "Στρώσεις και ποικιλία",
  },
  {
    slug: "food-session-25",
    phases: ["afternoon"],
    subjects: ["drink", "food"],
    captionEN: "Fresh mango, salad, and a long lunch",
    captionEL: "Φρέσκο μάνγκο, σαλάτα, και ένα μεγάλο μεσημέρι",
  },
  {
    slug: "food-session-45",
    phases: ["afternoon"],
    subjects: ["food"],
    captionEN: "Smoked salmon, garden greens",
    captionEL: "Καπνιστός σολομός, λαχανικά",
  },

  // ── Golden — desserts, sunset, mood shift ────────────────────────────
  {
    slug: "food-session-50",
    phases: ["golden"],
    subjects: ["dessert"],
    captionEN: "Sweet endings as the light turns",
    captionEL: "Γλυκό κλείσιμο όσο το φως αλλάζει",
    priority: 7,
  },
  {
    slug: "food-session-55",
    phases: ["golden"],
    subjects: ["dessert", "detail"],
    captionEN: "Chia, banana, berry — slow afternoon",
    captionEL: "Chia, μπανάνα, μούρα — αργό απόγευμα",
  },
  {
    slug: "food-session-67",
    phases: ["golden", "evening"],
    subjects: ["ocean"],
    captionEN: "The sea at golden hour",
    captionEL: "Η θάλασσα στη χρυσή ώρα",
    priority: 10,
  },
  {
    slug: "food-session-65",
    phases: ["golden", "evening"],
    subjects: ["ocean"],
    captionEN: "Pink skies, salt air",
    captionEL: "Ρόδινος ουρανός, αλμυρός αέρας",
  },

  // ── Evening — wine, pizza, darker tabletops ──────────────────────────
  {
    slug: "food-session-60",
    phases: ["evening", "night"],
    subjects: ["food", "drink"],
    captionEN: "Pizza, red wine, no rush",
    captionEL: "Πίτσα, κόκκινο κρασί, χωρίς βιασύνη",
    priority: 8,
  },
  {
    slug: "food-session-58",
    phases: ["evening"],
    subjects: ["food"],
    captionEN: "Late dinner, perfect crust",
    captionEL: "Όψιμο δείπνο, τέλεια κρούστα",
  },
  {
    slug: "food-session-70",
    phases: ["evening", "night"],
    subjects: ["venue"],
    captionEN: "Home Seaside, after dark",
    captionEL: "Home Seaside, μετά το ηλιοβασίλεμα",
    priority: 10,
  },
  {
    slug: "food-session-1",
    phases: ["evening", "night"],
    subjects: ["venue", "detail"],
    captionEN: "Glass, plant, the house bottle",
    captionEL: "Ποτήρι, φυτό, το μπουκάλι του σπιτιού",
  },
];

/** Helper: look up the PhotoMeta for a curated entry. */
export function metaFor(curated: CuratedPhoto): PhotoMeta | undefined {
  return ALBUM1_PHOTOS[curated.slug];
}

/**
 * Pick the highest-priority curated photo for a given phase. Falls back to
 * the first photo of that phase, then to any photo if no match exists.
 */
export function heroPhotoForPhase(phase: DayPhase): CuratedPhoto {
  const matches = ALBUM1_CURATION.filter((p) => p.phases.includes(phase));
  if (matches.length === 0) return ALBUM1_CURATION[0];
  return matches.reduce((best, p) =>
    (p.priority ?? 0) > (best.priority ?? 0) ? p : best
  , matches[0]);
}

/**
 * Return all photos for the journey in the canonical day order, regardless
 * of current time. The track tells the whole-day story, not just "now".
 */
export const JOURNEY_ORDER: ReadonlyArray<DayPhase> = [
  "morning",
  "afternoon",
  "golden",
  "evening",
];

export interface JourneyChapter {
  readonly phase: DayPhase;
  readonly titleEN: string;
  readonly titleEL: string;
  readonly photos: ReadonlyArray<CuratedPhoto>;
}

export function buildJourney(): JourneyChapter[] {
  const titles: Record<DayPhase, { en: string; el: string }> = {
    morning:   { en: "Morning",  el: "Πρωί" },
    afternoon: { en: "Noon",     el: "Μεσημέρι" },
    golden:    { en: "Sunset",   el: "Ηλιοβασίλεμα" },
    evening:   { en: "Night",    el: "Βράδυ" },
    night:     { en: "Late",     el: "Αργά" },
  };

  // First phase in a photo's phases[] wins — guarantees each photo lives in
  // exactly one chapter, so React keys stay unique across the flattened track.
  const assigned = new Set<string>();
  return JOURNEY_ORDER.map((phase) => {
    const photos = ALBUM1_CURATION.filter(
      (p) => !assigned.has(p.slug) && p.phases.includes(phase)
    ).slice(0, 4);
    photos.forEach((p) => assigned.add(p.slug));
    return {
      phase,
      titleEN: titles[phase].en,
      titleEL: titles[phase].el,
      photos,
    };
  });
}
