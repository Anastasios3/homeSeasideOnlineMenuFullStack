/**
 * Site-wide SEO constants + per-route metadata hook.
 *
 * Single source of truth so each page just declares its own title + description
 * and the hook handles all the wiring (title, meta description, canonical,
 * hreflang alternates, OG, Twitter).
 *
 * VITE_SITE_URL lets you override the canonical origin per environment without
 * recompiling — defaults to the production domain.
 */

import { useEffect } from "react";

export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL ?? "https://home-seaside.gr"
).replace(/\/+$/, "");

/** Default OG image — overridden per-page if a more specific photo fits. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.jpg`;

/** Strong-typed list of indexable routes — drives sitemap generation. */
export const INDEXABLE_ROUTES: ReadonlyArray<string> = [
  "/",
  "/menu",
  "/menu/coffee",
  "/menu/cocktails",
  "/menu/spirits",
  "/menu/food",
  "/about",
];

interface DocumentMetaOptions {
  /** Full <title> tag content. Keep ≤ 60 chars. */
  title: string;
  /** Meta description. Keep 120–160 chars. */
  description: string;
  /** Absolute or relative canonical path (defaults to current pathname). */
  canonicalPath?: string;
  /** Override the OG image URL — absolute or site-relative. */
  image?: string;
  /** Tell crawlers to skip this page. /admin and /visit do this. */
  noindex?: boolean;
}

const setOrCreateMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setOrCreateLink = (rel: string, href: string, hreflang?: string) => {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const removeMatching = (selector: string) => {
  document.head.querySelectorAll(selector).forEach((el) => el.remove());
};

/**
 * Apply per-route metadata. Call this from the page component on mount.
 *
 * Why this exists: React Router doesn't rewrite <head>. Without it every
 * route shares the static <title> from index.html — terrible for SEO.
 */
export function useDocumentMeta({
  title,
  description,
  canonicalPath,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
}: DocumentMetaOptions): void {
  useEffect(() => {
    const path = canonicalPath ?? window.location.pathname;
    const canonical = `${SITE_URL}${path}`;
    const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

    // Title + description
    document.title = title;
    setOrCreateMeta('meta[name="description"]', "name", "description", description);
    setOrCreateMeta('meta[name="title"]', "name", "title", title);

    // Robots
    setOrCreateMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noindex ? "noindex,nofollow" : "index,follow"
    );

    // Canonical
    setOrCreateLink("canonical", canonical);

    // Hreflang alternates (EN, EL, x-default).
    // Site is bilingual but currently single-URL — we use ?lang= as the
    // discriminator so search engines can serve language-correct results.
    setOrCreateLink("alternate", `${canonical}?lang=en`, "en");
    setOrCreateLink("alternate", `${canonical}?lang=el`, "el");
    setOrCreateLink("alternate", canonical, "x-default");

    // Open Graph
    setOrCreateMeta('meta[property="og:title"]', "property", "og:title", title);
    setOrCreateMeta('meta[property="og:description"]', "property", "og:description", description);
    setOrCreateMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setOrCreateMeta('meta[property="og:image"]', "property", "og:image", fullImage);

    // Twitter
    setOrCreateMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setOrCreateMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setOrCreateMeta('meta[name="twitter:image"]', "name", "twitter:image", fullImage);
  }, [title, description, canonicalPath, image, noindex]);
}

/**
 * Strip per-route hreflang/canonical when leaving a route — avoids stale
 * links bleeding into the next route's <head>. Currently the hook overwrites
 * the same nodes on each mount so this isn't strictly needed, but exposing
 * it for future use.
 */
export function clearPerRouteMeta(): void {
  removeMatching('link[rel="alternate"][hreflang]');
}
