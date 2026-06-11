import { useEffect, useRef, useState, type FC } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, MousePointerClick, Phone, Mail, Instagram } from "lucide-react";
import HomeHero from "./HomeHero";
import HorizontalJourney from "./HorizontalJourney";
import ParallaxBlock from "./ParallaxBlock";
import FAQ from "./FAQ";
import { useDocumentMeta } from "../seo";
import { useSiteContent } from "../hooks/useSiteContent";
import {
  illustrationSrc,
  instagramUrl,
  mapsEmbedUrl,
  pickText,
  telHref as buildTelHref,
} from "../config/siteContent";
import { ContentParagraphs } from "./ContentText";
import "../styles/HomePage.css";
import "../styles/HomeSections.css";

interface HomePageProps {
  language: "EN" | "EL";
}

/**
 * Brand identity — deliberately NOT admin-editable. Everything else about
 * the venue (address, phone, email, Instagram, coordinates) lives in the
 * site-content CMS under `venue`; the map embed URL and Instagram link are
 * derived from those facts so they can never drift apart.
 */
export const VENUE = {
  name: "Home Seaside",
  tagline: "Bar & More",
} as const;

/** UI micro-labels — fixed chrome, not site copy. */
const labels = {
  EN: {
    ctaMenu: "View Our Menu",
    followUs: "Find us on Instagram",
    openInMaps: "Open in Google Maps",
    mapHint: "Hold Ctrl (Windows) or ⌘ (Mac) and scroll to zoom the map.",
    mapClickToInteract: "Click to interact",
  },
  EL: {
    ctaMenu: "Δείτε το Μενού",
    followUs: "Βρες μας στο Instagram",
    openInMaps: "Άνοιγμα στο Google Maps",
    mapHint: "Κράτησε Ctrl (Windows) ή ⌘ (Mac) και κάνε scroll για να μεγεθύνεις τον χάρτη.",
    mapClickToInteract: "Κάνε κλικ για αλληλεπίδραση",
  },
} as const;

const HomePage: FC<HomePageProps> = ({ language }) => {
  const content = useSiteContent();
  const home = content.home;
  const venue = content.venue;
  const t = labels[language];
  const telHref = buildTelHref(venue.phone);

  // ─── Map scroll-jacking fix ─────────────────────────────────────────────
  // The OSM iframe captures the mouse wheel and zooms when users are simply
  // trying to scroll the page. We solve this with two layers:
  //   1. A click-to-interact overlay — the iframe is non-interactive until
  //      the user explicitly clicks the map. Eliminates accidental zoom.
  //   2. A wheel listener — even once interactive, plain scroll is forwarded
  //      to the page; only Ctrl/⌘ + wheel reaches the iframe for zoom.
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInteractive, setMapInteractive] = useState(false);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, behavior: "auto" });
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  useDocumentMeta({
    title: language === "EN"
      ? "Home Seaside · Seaside bar, specialty coffee & rum in Rethymno"
      : "Home Seaside · Παραθαλάσσιο μπαρ, καφές & ρούμι στο Ρέθυμνο",
    description: language === "EN"
      ? "A seafront café and cocktail bar in Rethymno, Crete. Specialty coffee, an extensive rum selection, advanced cocktails, comfort food. Open from morning to late night."
      : "Παραθαλάσσιο café-bar στο Ρέθυμνο της Κρήτης. Specialty καφές, μεγάλη συλλογή από ρούμι, εξελιγμένα cocktails και comfort φαγητό. Από το πρωί μέχρι αργά το βράδυ.",
    canonicalPath: "/",
  });

  return (
    <div className="home">
      {/* ─── Hero with time-aware photo + wordmark ─── */}
      <HomeHero
        language={language}
        tagline={VENUE.tagline}
        subtitle={pickText(home.heroSubtitle, language)}
        ctaLabel={t.ctaMenu}
      />

      {/* ─── A Day at Home Seaside (horizontal photo journey) ─── */}
      <HorizontalJourney
        language={language}
        titleEN={home.journeyTitle.en}
        titleEL={home.journeyTitle.el}
      />

      {/* ─── About — centaur illustration on the left, copy right ─── */}
      <ParallaxBlock
        illustration={illustrationSrc(content.illustrations.homeAbout, "/illustration-centaur.webp")}
        illustrationAlt=""
        side="left"
        tint="none"
        className="home-textured-bg"
      >
        <h2>{pickText(home.about.title, language)}</h2>
        <ContentParagraphs text={pickText(home.about.body, language)} />
        <Link to="/about" className="home-section-cta">
          {pickText(home.about.ctaLabel, language)}
        </Link>
      </ParallaxBlock>

      {/* ─── Hours & Location with embedded map ─── */}
      <section className="home-section home-section--alt home-textured-bg">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{pickText(home.hours.title, language)}</h2>

          <div className="home-info-grid">
            <div className="home-info-card">
              <div className="home-info-card__icon">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <ul className="home-hours">
                {home.hours.rows.map((row) => (
                  <li key={row.id} className="home-hours__row">
                    <span className="home-hours__day">{pickText(row.day, language)}</span>
                    <span className="home-hours__time">{row.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-info-card">
              <div className="home-info-card__icon">
                <MapPin size={20} strokeWidth={1.5} />
              </div>
              <p className="home-info-card__text">
                <a href={venue.mapsLink} target="_blank" rel="noopener noreferrer" className="home-address-link">
                  {venue.address}
                </a>
              </p>
            </div>
          </div>

          <div
            ref={mapRef}
            className={`home-map ${mapInteractive ? "home-map--interactive" : ""}`}
          >
            <iframe
              title="Home Seaside location map"
              src={mapsEmbedUrl(venue.lat, venue.lng)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {!mapInteractive && (
              <button
                type="button"
                className="home-map__overlay"
                onClick={() => setMapInteractive(true)}
                aria-label={t.mapClickToInteract}
              >
                <span className="home-map__overlay-pill">
                  <MousePointerClick size={14} strokeWidth={2} />
                  {t.mapClickToInteract}
                </span>
              </button>
            )}
          </div>
          <p className="home-map__hint">{t.mapHint}</p>
          <a
            href={venue.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="home-map__open"
          >
            <MapPin size={14} strokeWidth={2} />
            {t.openInMaps}
          </a>
        </div>
      </section>

      {/* ─── Vase illustration as a "come visit" divider ─── */}
      <ParallaxBlock
        illustration={illustrationSrc(content.illustrations.homeVisit, "/illustration-vase.webp")}
        illustrationAlt=""
        side="right"
        tint="none"
        className="home-textured-bg"
      >
        <h2>{pickText(home.visit.title, language)}</h2>
        <ContentParagraphs text={pickText(home.visit.body, language)} />
        <Link to="/visit" className="home-section-cta">
          {pickText(home.visit.ctaLabel, language)}
        </Link>
      </ParallaxBlock>

      {/* ─── FAQ — plain HTML, no schema. Helps AI Overviews + on-page authority. ─── */}
      <FAQ language={language} className="home-textured-bg" />

      {/* ─── Contact ─── */}
      <section className="home-section home-textured-bg">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{pickText(home.contactTitle, language)}</h2>

          <div className="home-contact-links">
            <a href={telHref} className="home-contact-link">
              <Phone size={16} strokeWidth={1.5} />
              <span>{venue.phone}</span>
            </a>
            <a href={`mailto:${venue.email}`} className="home-contact-link">
              <Mail size={16} strokeWidth={1.5} />
              <span>{venue.email}</span>
            </a>
            <a
              href={instagramUrl(venue.instagramHandle)}
              target="_blank"
              rel="noopener noreferrer"
              className="home-contact-link"
              aria-label={t.followUs}
            >
              <Instagram size={16} strokeWidth={1.5} />
              <span>{venue.instagramHandle}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
