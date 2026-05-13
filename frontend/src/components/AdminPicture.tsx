import { type FC, type CSSProperties } from "react";
import type { PhotoSlot } from "../api/siteSetting";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Resolve a possibly-relative URL (e.g. "/uploads/abc.jpg") against the
 * backend origin so it works regardless of which host the SPA is served from.
 */
function resolveUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}

interface AdminPictureProps {
  slot: PhotoSlot;
  language: "EN" | "EL";
  /** Override alt text instead of using slot.alt_en / slot.alt_el. */
  alt?: string;
  /** `sizes` attribute for responsive selection. */
  sizes?: string;
  /** Set true for the LCP image — eager loading + fetchpriority high. */
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders an admin-uploaded PhotoSlot with srcset when available. Companion
 * to the bundled <Picture> component but for the simpler manifest shape that
 * comes from the in-browser resize pipeline (3 JPG sizes, no AVIF/WebP).
 */
const AdminPicture: FC<AdminPictureProps> = ({
  slot,
  language,
  alt,
  sizes = "100vw",
  priority = false,
  fit = "cover",
  className = "",
  style,
}) => {
  const src = resolveUrl(slot.url);
  const altText = alt ?? (language === "EN" ? slot.alt_en : slot.alt_el);
  const srcSet = slot.srcset
    ? `${resolveUrl(slot.srcset["640"])} 640w, ${resolveUrl(slot.srcset["1280"])} 1280w, ${resolveUrl(slot.srcset["1920"])} 1920w`
    : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={altText}
      width={slot.width}
      height={slot.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className={className}
      style={{
        objectFit: fit,
        objectPosition: "center",
        width: "100%",
        height: "100%",
        display: "block",
        ...style,
      }}
    />
  );
};

export default AdminPicture;
