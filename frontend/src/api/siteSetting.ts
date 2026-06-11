import axios from "axios";
import { getAdminToken } from "../auth";
import type { DayPhase, PhaseCutoffs } from "../config/schedule";
import { API_URL } from "../config/api";


/**
 * Shape returned by GET /site_setting. All three sections are always present;
 * empty ones are returned with their default empty shape (`{}`/`[]`).
 */
export interface SiteSettingPayload {
  schedule: {
    cutoffs: PhaseCutoffs;
    categoryOrder: Record<DayPhase, string[]>;
  };
  subcategories: Record<string, SubcategoryMeta[]>; // keyed by main_category
  homepage_photos: {
    hero: PhotoSlot | null;
    /**
     * Per-phase locked hero. Each value is either a slug present in the
     * curation list, or null = "auto-pick highest-priority matching photo".
     * Five fixed slots, one per phase.
     */
    hero_picks: Record<DayPhase, string | null>;
    journey: JourneySlot[];     // legacy — superseded by `curation`
    gallery: GallerySlot[];     // legacy — superseded by `curation`
    curation: CuratedEntry[];   // unified library: bundled refs + custom uploads
  };
  /**
   * Live published site content (CMS), or null when nothing has ever been
   * published — the frontend then renders its bundled defaults. Shape is
   * owned by config/siteContent.ts; the server stores it opaquely.
   */
  site_content?: unknown | null;
  updated_at: string | null;
}

/** Subject tags carried over from the original bundled curation.ts. */
export type PhotoSubject =
  | "coffee" | "food" | "drink" | "venue"
  | "ocean" | "detail" | "dessert";

/**
 * A single photo in the unified curation feed.
 *
 *   kind: "bundled"  → `slug` points into ALBUM1_PHOTOS for image data.
 *                       Image URLs / srcset / lqip come from the bundle.
 *   kind: "custom"   → `slug` is just a stable id (e.g. an upload manifest
 *                       id). `url` + `srcset` carry the actual image data.
 *
 * `phases` drives hero rotation (highest-priority for current phase wins).
 * `position` drives the journey-strip order. `hidden: true` removes the
 * entry from the homepage without deleting it.
 */
export interface CuratedEntry {
  kind: "bundled" | "custom";
  slug: string;
  url?: string;
  srcset?: { "640": string; "1280": string; "1920": string };
  width?: number;
  height?: number;
  phases: DayPhase[];
  subjects?: PhotoSubject[];
  captionEN: string;
  captionEL: string;
  altEN?: string;
  altEL?: string;
  priority: number;
  hidden: boolean;
  position: number;
}

export interface SubcategoryMeta {
  slug: string;          // canonical English category string
  label_en: string;
  label_el: string;
  position: number;      // ascending
  hidden: boolean;
  icon: string | null;
}

export interface PhotoSlot {
  /** Largest URL — used as the default <img src>. */
  url: string;
  /** Per-width JPG URLs for the customer-side srcSet attribute. */
  srcset?: { "640": string; "1280": string; "1920": string };
  /** Intrinsic source dimensions, captured at upload time. */
  width?: number;
  height?: number;
  alt_en: string;
  alt_el: string;
}

export interface JourneySlot extends PhotoSlot {
  id: string;
  caption_en: string;
  caption_el: string;
  position: number;
}

export interface GallerySlot extends PhotoSlot {
  id: string;
  position: number;
}

export async function fetchSiteSetting(): Promise<SiteSettingPayload> {
  const res = await axios.get<SiteSettingPayload>(`${API_URL}/site_setting`);
  return res.data;
}

/**
 * PATCH a partial setting. Only the sections you include get replaced — omit
 * a section to leave it untouched server-side. Requires an admin JWT.
 */
export async function updateSiteSetting(
  partial: Partial<Pick<SiteSettingPayload, "schedule" | "subcategories" | "homepage_photos">>,
): Promise<SiteSettingPayload> {
  const token = getAdminToken();
  if (!token) throw new Error("Not authenticated");
  const res = await axios.patch<SiteSettingPayload>(
    `${API_URL}/site_setting`,
    partial,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

/* ── Site-content CMS draft lifecycle (admin-only) ─────────────────────
   Live content can only change via publish/revert; the draft endpoints
   manage the work-in-progress copy. All shapes are opaque hashes here —
   config/siteContent.ts owns the structure. */

export interface SiteContentDraftPayload {
  site_content_draft: unknown | null;
  has_previous: boolean;
  draft_saved_at: string | null;
  published_at: string | null;
}

function adminHeaders() {
  const token = getAdminToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchSiteContentDraft(): Promise<SiteContentDraftPayload> {
  const res = await axios.get<SiteContentDraftPayload>(
    `${API_URL}/site_setting/content_draft`,
    { headers: adminHeaders() },
  );
  return res.data;
}

export async function saveSiteContentDraft(content: unknown): Promise<SiteContentDraftPayload> {
  const res = await axios.put<SiteContentDraftPayload>(
    `${API_URL}/site_setting/content_draft`,
    { site_content: content },
    { headers: adminHeaders() },
  );
  return res.data;
}

export async function discardSiteContentDraft(): Promise<SiteContentDraftPayload> {
  const res = await axios.delete<SiteContentDraftPayload>(
    `${API_URL}/site_setting/content_draft`,
    { headers: adminHeaders() },
  );
  return res.data;
}

export async function publishSiteContent(): Promise<SiteSettingPayload & { has_previous: boolean }> {
  const res = await axios.post<SiteSettingPayload & { has_previous: boolean }>(
    `${API_URL}/site_setting/content/publish`,
    {},
    { headers: adminHeaders() },
  );
  return res.data;
}

export async function revertSiteContent(): Promise<SiteSettingPayload & { has_previous: boolean }> {
  const res = await axios.post<SiteSettingPayload & { has_previous: boolean }>(
    `${API_URL}/site_setting/content/revert`,
    {},
    { headers: adminHeaders() },
  );
  return res.data;
}
