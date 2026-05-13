import { type FC, useMemo } from "react";
import Picture from "./Picture";
import { ALBUM1_PHOTOS } from "../assets/photos/album1";
import { buildJourney } from "../assets/photos/curation";

interface HorizontalJourneyProps {
  language: "EN" | "EL";
  titleEN?: string;
  titleEL?: string;
}

/**
 * "A Day at Home Seaside" — horizontally scrolling photo journey grouped
 * into chapters by day-phase. On mobile and tablet it's a native
 * touch-swipe carousel with scroll-snap. On desktop the track scrolls
 * horizontally with normal mouse-wheel and trackpad gestures.
 *
 * Photo selection comes from curation.ts so swapping or re-ordering the
 * journey is one file to edit — no component changes.
 */
const HorizontalJourney: FC<HorizontalJourneyProps> = ({
  language,
  titleEN = "A Day at Home Seaside",
  titleEL = "Μια μέρα στο Home Seaside",
}) => {
  const chapters = useMemo(() => buildJourney(), []);

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
        {chapters.map((chapter) =>
          chapter.photos.map((curated, idx) => {
            const meta = ALBUM1_PHOTOS[curated.slug];
            if (!meta) return null;
            const caption = language === "EN" ? curated.captionEN : curated.captionEL;
            // Label the FIRST card of each chapter, regardless of overall position.
            const phaseLabel =
              idx === 0
                ? language === "EN"
                  ? chapter.titleEN
                  : chapter.titleEL
                : null;

            return (
              <article
                key={`${chapter.phase}-${curated.slug}`}
                className={`journey__card journey__card--${meta.orientation}`}
                role="listitem"
              >
                {phaseLabel && (
                  <span className="journey__chapter-tag">{phaseLabel}</span>
                )}
                <div className="journey__card-photo">
                  <Picture
                    photo={meta}
                    alt={caption}
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 78vw"
                  />
                </div>
                <p className="journey__card-caption">{caption}</p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default HorizontalJourney;
