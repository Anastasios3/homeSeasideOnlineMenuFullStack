import { useEffect, useMemo, useState } from "react";
import {
  getSiteContent,
  refreshSiteContentFromStorage,
  SITE_CONTENT_PREVIEW_KEY,
  SITE_CONTENT_STORAGE_KEY,
  type SiteContent,
} from "../config/siteContent";

/**
 * Reactive site content. Re-renders when the live content changes (boot
 * hydration, admin publish/revert) or preview mode toggles — both same-tab
 * (synthetic StorageEvent broadcast) and cross-tab (native storage events).
 *
 * Unlike the older config modules, this refreshes the module cache from
 * localStorage before re-rendering, so OTHER tabs of the same browser pick
 * up changes too — that's what makes draft preview work in a second tab.
 */
export function useSiteContent(): SiteContent {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === SITE_CONTENT_STORAGE_KEY || e.key === SITE_CONTENT_PREVIEW_KEY) {
        refreshSiteContentFromStorage();
        setVersion((v) => v + 1);
      }
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getSiteContent(), [version]);
}
