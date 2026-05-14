import { useEffect, useRef, useState, type FC } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, MousePointerClick, Phone, Mail, Instagram } from "lucide-react";
import HomeHero from "./HomeHero";
import HorizontalJourney from "./HorizontalJourney";
import ParallaxBlock from "./ParallaxBlock";
import FAQ from "./FAQ";
import { useDocumentMeta } from "../seo";
import "../styles/HomePage.css";
import "../styles/HomeSections.css";

interface HomePageProps {
  language: "EN" | "EL";
}

/** Single source of truth for the venue. SEO + UI both consume this. */
export const VENUE = {
  name: "Home Seaside",
  tagline: "Bar & More",
  address: "Leof. Emmanouil Kefalogianni 18, Rethymno 741 31, Greece",
  phone: "+30 2831 022782",
  email: "home_seaside_rethimno@hotmail.com",
  instagram: "https://www.instagram.com/home_seaside",
  instagramHandle: "@home_seaside",
  // Precise coordinates from Google Maps canonical place entry.
  lat: 35.3718449,
  lng: 24.4742788,
  // OpenStreetMap embed — works without an API key and isn't blocked by
  // Google's X-Frame-Options. The pin sits at the venue, with ~600m bbox.
  mapsEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=24.4712788%2C35.3698449%2C24.4772788%2C35.3738449&layer=mapnik&marker=35.3718449%2C24.4742788",
  // Canonical short link → lands on the "Home Seaside | Cocktail Bar" listing.
  mapsLink: "https://maps.app.goo.gl/Bni5sF7oQSpCuB2w8",
} as const;

const content = {
  EN: {
    heroSubtitle: "Drinks, food, and a chair by the sea, in Rethymno.",
    ctaMenu: "View Our Menu",
    journeyTitle: "A Day at Home Seaside",
    aboutTitle: "An Ordinary Day, Slowed Down",
    aboutText:
      "Home Seaside sits on the Rethymno seafront. The hour drifts here. Cappuccinos at ten. Mango juice and a long lunch at one. A glass of something cold when the sky turns pink. Made carefully, served generously, for as long as you want to stay.",
    aboutCta: "Read more about us →",
    visitTitle: "Come See Us",
    visitText:
      "We open at nine. We close when the night is done. Walk in, pick a chair, stay as long as you like. The terrace catches the breeze in summer. The window seat keeps you close to the sea any time of year.",
    visitCta: "Plan your visit →",
    hoursTitle: "Hours & Location",
    days: [
      { day: "Monday – Thursday", time: "09:00 – 00:00" },
      { day: "Friday – Saturday", time: "09:00 – 02:00" },
      { day: "Sunday", time: "10:00 – 00:00" },
    ],
    contactTitle: "Say Hello",
    followUs: "Find us on Instagram",
    openInMaps: "Open in Google Maps",
    mapHint: "Hold Ctrl (Windows) or ⌘ (Mac) and scroll to zoom the map.",
    mapClickToInteract: "Click to interact",
  },
  EL: {
    heroSubtitle: "Ποτά, φαγητό, και μια καρέκλα δίπλα στη θάλασσα, στο Ρέθυμνο.",
    ctaMenu: "Δείτε το Μενού",
    journeyTitle: "Μια μέρα στο Home Seaside",
    aboutTitle: "Μια συνηθισμένη μέρα, σε αργό ρυθμό",
    aboutText:
      "Το Home Seaside βρίσκεται στην παραλιακή του Ρεθύμνου. Η ώρα κυλά αργά εδώ. Cappuccino στις δέκα. Χυμός μάνγκο και μεσημεριανό στη μία. Ένα ποτήρι κάτι κρύο όσο ο ουρανός γίνεται ροζ. Φτιαγμένα με προσοχή, σερβιρισμένα με γενναιοδωρία, για όσο θέλεις να μείνεις.",
    aboutCta: "Διάβασε περισσότερα για εμάς →",
    visitTitle: "Έλα να μας βρεις",
    visitText:
      "Ανοίγουμε στις εννιά. Κλείνουμε όταν τελειώσει η νύχτα. Μπες, διάλεξε καρέκλα, μείνε όσο θέλεις. Η βεράντα πιάνει το αεράκι το καλοκαίρι. Το παράθυρο σε κρατάει κοντά στη θάλασσα όλο τον χρόνο.",
    visitCta: "Σχεδίασε την επίσκεψή σου →",
    hoursTitle: "Ώρες & Τοποθεσία",
    days: [
      { day: "Δευτέρα – Πέμπτη", time: "09:00 – 00:00" },
      { day: "Παρασκευή – Σάββατο", time: "09:00 – 02:00" },
      { day: "Κυριακή", time: "10:00 – 00:00" },
    ],
    contactTitle: "Πες ένα γεια",
    followUs: "Βρες μας στο Instagram",
    openInMaps: "Άνοιγμα στο Google Maps",
    mapHint: "Κράτησε Ctrl (Windows) ή ⌘ (Mac) και κάνε scroll για να μεγεθύνεις τον χάρτη.",
    mapClickToInteract: "Κάνε κλικ για αλληλεπίδραση",
  },
} as const;

const HomePage: FC<HomePageProps> = ({ language }) => {
  const t = content[language];
  const telHref = `tel:${VENUE.phone.replace(/\s/g, "")}`;

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
        subtitle={t.heroSubtitle}
        ctaLabel={t.ctaMenu}
      />

      {/* ─── A Day at Home Seaside (horizontal photo journey) ─── */}
      <HorizontalJourney
        language={language}
        titleEN={content.EN.journeyTitle}
        titleEL={content.EL.journeyTitle}
      />

      {/* ─── About — centaur illustration on the left, copy right ─── */}
      <ParallaxBlock
        illustration="/illustration-centaur.webp"
        illustrationAlt=""
        side="left"
        tint="none"
        className="home-textured-bg"
      >
        <h2>{t.aboutTitle}</h2>
        <p>{t.aboutText}</p>
        <Link to="/about" className="home-section-cta">
          {t.aboutCta}
        </Link>
      </ParallaxBlock>

      {/* ─── Hours & Location with embedded map ─── */}
      <section className="home-section home-section--alt home-textured-bg">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{t.hoursTitle}</h2>

          <div className="home-info-grid">
            <div className="home-info-card">
              <div className="home-info-card__icon">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <ul className="home-hours">
                {t.days.map((d) => (
                  <li key={d.day} className="home-hours__row">
                    <span className="home-hours__day">{d.day}</span>
                    <span className="home-hours__time">{d.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-info-card">
              <div className="home-info-card__icon">
                <MapPin size={20} strokeWidth={1.5} />
              </div>
              <p className="home-info-card__text">
                <a href={VENUE.mapsLink} target="_blank" rel="noopener noreferrer" className="home-address-link">
                  {VENUE.address}
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
              src={VENUE.mapsEmbed}
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
            href={VENUE.mapsLink}
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
        illustration="/illustration-vase.webp"
        illustrationAlt=""
        side="right"
        tint="none"
        className="home-textured-bg"
      >
        <h2>{t.visitTitle}</h2>
        <p>{t.visitText}</p>
        <Link to="/visit" className="home-section-cta">
          {t.visitCta}
        </Link>
      </ParallaxBlock>

      {/* ─── FAQ — plain HTML, no schema. Helps AI Overviews + on-page authority. ─── */}
      <FAQ language={language} className="home-textured-bg" />

      {/* ─── Contact ─── */}
      <section className="home-section home-textured-bg">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{t.contactTitle}</h2>

          <div className="home-contact-links">
            <a href={telHref} className="home-contact-link">
              <Phone size={16} strokeWidth={1.5} />
              <span>{VENUE.phone}</span>
            </a>
            <a href={`mailto:${VENUE.email}`} className="home-contact-link">
              <Mail size={16} strokeWidth={1.5} />
              <span>{VENUE.email}</span>
            </a>
            <a
              href={VENUE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="home-contact-link"
              aria-label={t.followUs}
            >
              <Instagram size={16} strokeWidth={1.5} />
              <span>{VENUE.instagramHandle}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
