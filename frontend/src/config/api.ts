/**
 * Single source of truth for the backend API base URL.
 *
 * Reads `VITE_API_URL` from Vite env. In production we want this set
 * explicitly; in development it falls back to localhost. If you spot a
 * production build hitting `http://localhost:3000`, the hosting platform
 * forgot to set the env var — bail loudly via the console warning.
 *
 * Returned URLs never end with a slash so callers can do
 * `${API_URL}/some/path` without worrying about double slashes.
 */
const RAW: string | undefined = import.meta.env.VITE_API_URL;
const FALLBACK = "http://localhost:3000";

if (typeof window !== "undefined" && import.meta.env.PROD && !RAW) {
  // Don't crash the SPA — but make it impossible to miss in devtools.
  console.error(
    "[config/api] VITE_API_URL is unset in a production build. " +
      "Set it on the hosting platform (Cloudflare Pages / Vercel / etc.) " +
      "and redeploy. Falling back to %s for now.",
    FALLBACK,
  );
}

export const API_URL: string = (RAW || FALLBACK).replace(/\/+$/, "");

/** Convenience for endpoints — `apiUrl("/menu_items")` → `${API_URL}/menu_items`. */
export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Resolve a possibly-relative URL (e.g. "/uploads/abc.jpg") against the API
 * origin. Already-absolute URLs (S3 or CDN) pass through unchanged.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}
