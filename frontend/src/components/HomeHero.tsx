import { type FC, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Picture from "./Picture";
import AdminPicture from "./AdminPicture";
import { useTimeOfDay } from "../hooks/useTimeOfDay";
import { ALBUM1_PHOTOS } from "../assets/photos/album1";
import { heroPhotoForPhase } from "../assets/photos/curation";
import {
  getHomepagePhotos,
  HOMEPAGE_PHOTOS_STORAGE_KEY,
} from "../config/homepagePhotos";

interface HomeHeroProps {
  language: "EN" | "EL";
  tagline: string;
  subtitle: string;
  ctaLabel: string;
}

/**
 * Full-bleed hero with a time-aware photograph behind the chunky wordmark.
 *
 * The photo is chosen by current day-phase via curation.ts — bright
 * tile/bottle shots during the day, the venue exterior at dusk, the rocky
 * shoreline at golden hour, etc. Photo swaps fluidly when the phase
 * changes (e.g. user is still on the page at 19:00 cutoff).
 *
 * A subtle scrim layer keeps the wordmark + CTA readable regardless of
 * the underlying photo's tonal range.
 */
const HomeHero: FC<HomeHeroProps> = ({ language, tagline, subtitle, ctaLabel }) => {
  const { phase } = useTimeOfDay();
  const curated = heroPhotoForPhase(phase);
  const meta = ALBUM1_PHOTOS[curated.slug];

  // Subscribe to admin overrides — when an admin saves a new hero photo we
  // want the homepage to swap to it on the next paint, no reload needed.
  const [override, setOverride] = useState(() => getHomepagePhotos().hero);
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === HOMEPAGE_PHOTOS_STORAGE_KEY) setOverride(getHomepagePhotos().hero);
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  return (
    <section className="home-hero">
      {override ? (
        <div className="home-hero__photo">
          <AdminPicture
            slot={override}
            language={language}
            priority
            sizes="100vw"
            fit="cover"
          />
        </div>
      ) : meta && (
        <div className="home-hero__photo">
          <Picture
            photo={meta}
            alt={language === "EN" ? curated.captionEN : curated.captionEL}
            priority
            sizes="100vw"
          />
        </div>
      )}
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
