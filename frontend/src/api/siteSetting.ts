import axios from "axios";
import { getAdminToken } from "../auth";
import type { DayPhase, PhaseCutoffs } from "../config/schedule";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
    journey: JourneySlot[];
    gallery: GallerySlot[];
  };
  updated_at: string | null;
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
