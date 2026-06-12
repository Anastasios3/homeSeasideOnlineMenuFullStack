/**
 * Fixed-position banner shown while the admin is previewing a draft.
 * Only visible when the preview localStorage key is set — invisible to
 * regular visitors, who never have that key.
 */
import { useEffect, useState } from "react";
import type { FC } from "react";
import { Eye, X } from "lucide-react";
import {
  isContentPreviewActive,
  exitContentPreview,
  refreshSiteContentFromStorage,
  SITE_CONTENT_PREVIEW_KEY,
  SITE_CONTENT_STORAGE_KEY,
} from "../config/siteContent";

const PreviewBanner: FC = () => {
  const [active, setActive] = useState(() => isContentPreviewActive());

  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === SITE_CONTENT_PREVIEW_KEY || e.key === SITE_CONTENT_STORAGE_KEY) {
        refreshSiteContentFromStorage();
        setActive(isContentPreviewActive());
      }
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--sp-4)",
        padding: "var(--sp-3) var(--sp-6)",
        background: "var(--accent-primary)",
        color: "var(--text-on-accent)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--fw-medium)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <Eye size={15} />
        Viewing draft preview — visitors see the published site
      </span>
      <button
        type="button"
        onClick={() => {
          exitContentPreview();
          setActive(false);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          background: "rgba(0,0,0,0.15)",
          border: "none",
          borderRadius: "var(--radius-md)",
          padding: "var(--sp-2) var(--sp-3)",
          color: "inherit",
          cursor: "pointer",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-semibold)",
        }}
        aria-label="Exit preview mode"
      >
        <X size={13} /> Exit preview
      </button>
    </div>
  );
};

export default PreviewBanner;
