import { type FC, useEffect, useState } from "react";
import Picture from "./Picture";
import AdminPicture from "./AdminPicture";
import {
  getJourneyEntries,
  resolveImage,
} from "../config/curationRuntime";
import { HOMEPAGE_PHOTOS_STORAGE_KEY } from "../config/homepagePhotos";
import type { DayPhase } from "../config/schedule";

interface HorizontalJourneyProps {
  language: "EN" | "EL";
  titleEN?: string;
  titleEL?: string;
}

const PHASE_TITLES: Record<DayPhase, { en: string; el: string }> = {
  morning:   { en: "Morning",  el: "Πρωί" },
  afternoon: { en: "Noon",     el: "Μεσημέρι" },
  golden:    { en: "Sunset",   el: "Ηλιοβασίλεμα" },
  evening:   { en: "Night",    el: "Βράδυ" },
  night:     { en: "Late",     el: "Αργά" },
};

/**
 * "A Day at Home Seaside" — horizontally scrolling photo journey.
 *
 * Photos come from the unified server-backed curation list (falls back to
 * bundled curation when nothing is saved server-side). Chapter dividers
 * are inserted automatically the first time each phase appears in the
 * scroll order.
 *
 * Subscribes to homepage_photos storage events so admin edits propagate
 * to the homepage live, no reload.
 */
const HorizontalJourney: FC<HorizontalJourneyProps> = ({
  language,
  titleEN = "A Day at Home Seaside",
  titleEL = "Μια μέρα στο Home Seaside",
}) => {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === HOMEPAGE_PHOTOS_STORAGE_KEY) setVersion((v) => v + 1);
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);
  void version;

  const entries = getJourneyEntries();
  const seenPhases = new Set<DayPhase>();

  return (
    <section className="journey" aria-label={language === "EN" ? titleEN : titleEL}>
      <header className="journey__header">
        <h2 className="journey__title">
          {language === "EN" ? titleEN : titleEL}
        </h2>
        <p className="journey__hint" aria-hidden="true">
          {language === "EN" ? "← swipe →" : "← σύρετε →"}
        </p>
      </header>

      <div className="journey__track" role="list">
        {entries.map((entry) => {
          const resolved = resolveImage(entry);
          if (!resolved) return null;

          // First photo of each phase gets a chapter tag (auto-derived
          // from `phases[0]` so the admin never has to think about it).
          const firstPhase = entry.phases[0];
          let phaseLabel: string | null = null;
          if (firstPhase && !seenPhases.has(firstPhase)) {
            seenPhases.add(firstPhase);
            phaseLabel = language === "EN"
              ? PHASE_TITLES[firstPhase].en
              : PHASE_TITLES[firstPhase].el;
          }

          const caption = language === "EN" ? entry.captionEN : entry.captionEL;
          const orientationClass =
            resolved.kind === "bundled" ? `journey__card--${resolved.meta.orientation}` : "";

          return (
            <article
              key={`${entry.kind}-${entry.slug}`}
              className={`journey__card ${orientationClass}`}
              role="listitem"
            >
              {phaseLabel && <span className="journey__chapter-tag">{phaseLabel}</span>}
              <div className="journey__card-photo">
                {resolved.kind === "bundled" ? (
                  <Picture
                    photo={resolved.meta}
                    alt={caption}
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 78vw"
                  />
                ) : (
                  <AdminPicture
                    slot={{
                      url: resolved.url,
                      srcset: resolved.srcset,
                      width: resolved.width,
                      height: resolved.height,
                      alt_en: entry.altEN ?? entry.captionEN,
                      alt_el: entry.altEL ?? entry.captionEL,
                    }}
                    language={language}
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 78vw"
                    fit="cover"
                  />
                )}
              </div>
              <p className="journey__card-caption">{caption}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default HorizontalJourney;
