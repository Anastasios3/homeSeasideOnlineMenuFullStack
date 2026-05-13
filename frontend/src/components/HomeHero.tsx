import { type FC, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Picture from "./Picture";
import AdminPicture from "./AdminPicture";
import { useTimeOfDay } from "../hooks/useTimeOfDay";
import {
  getHeroEntryForPhase,
  resolveImage,
} from "../config/curationRuntime";
import { HOMEPAGE_PHOTOS_STORAGE_KEY } from "../config/homepagePhotos";

interface HomeHeroProps {
  language: "EN" | "EL";
  tagline: string;
  subtitle: string;
  ctaLabel: string;
}

/**
 * Full-bleed hero with a time-aware photograph behind the chunky wordmark.
 *
 * The photo comes from `getHeroEntryForPhase(currentPhase)` which applies
 * the unified resolution order:
 *   1. Admin's locked `hero_picks[phase]` slug (Hero Override tab)
 *   2. Highest-priority visible curation entry whose phases include the phase
 *   3. First visible entry — so the hero never goes blank
 *
 * Subscribes to homepage_photos storage events so any admin edit takes
 * effect on the next paint without a reload.
 */
const HomeHero: FC<HomeHeroProps> = ({ language, tagline, subtitle, ctaLabel }) => {
  const { phase } = useTimeOfDay();

  // Re-read the cached overrides + curation on any admin save.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === HOMEPAGE_PHOTOS_STORAGE_KEY) setVersion((v) => v + 1);
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);
  void version; // dep marker — re-evaluates the getters below on bump

  const curated = getHeroEntryForPhase(phase);
  const resolved = curated ? resolveImage(curated) : null;

  return (
    <section className="home-hero">
      {resolved?.kind === "bundled" ? (
        <div className="home-hero__photo">
          <Picture
            photo={resolved.meta}
            alt={
              language === "EN"
                ? resolved.entry.altEN ?? resolved.entry.captionEN
                : resolved.entry.altEL ?? resolved.entry.captionEL
            }
            priority
            sizes="100vw"
          />
        </div>
      ) : resolved?.kind === "custom" ? (
        <div className="home-hero__photo">
          <AdminPicture
            slot={{
              url: resolved.url,
              srcset: resolved.srcset,
              width: resolved.width,
              height: resolved.height,
              alt_en: resolved.entry.altEN ?? resolved.entry.captionEN,
              alt_el: resolved.entry.altEL ?? resolved.entry.captionEL,
            }}
            language={language}
            priority
            sizes="100vw"
            fit="cover"
          />
        </div>
      ) : null}
      <div className="home-hero__scrim" aria-hidden="true" />

      <div className="home-hero__inner">
        <img
          src="/wordmark.svg"
          alt="Home Seaside"
          className="home-hero__wordmark"
          width="220"
          height="260"
        />
        <p className="home-hero__tagline">{tagline}</p>
        <p className="home-hero__subtitle">{subtitle}</p>
        <Link to="/menu" className="home-hero__cta">
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
};

export default HomeHero;
