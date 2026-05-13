import { type FC } from "react";
import { Clock, MapPin, Phone, Mail, Instagram } from "lucide-react";
import HomeHero from "./HomeHero";
import HorizontalJourney from "./HorizontalJourney";
import ParallaxBlock from "./ParallaxBlock";
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
    heroSubtitle: "Drinks, bites, and the perfect seaside atmosphere — in the heart of Rethymno.",
    ctaMenu: "View Our Menu",
    journeyTitle: "A Day at Home Seaside",
    aboutTitle: "An Ordinary Day, Slowed Down",
    aboutText:
      "Tucked along the seafront in Rethymno, Home Seaside is a place to lose track of the hour. Cappuccinos at ten, mango juice and a long lunch at one, a glass of something cold as the sky turns pink. Carefully made, generously served — for as long as you'd like to stay.",
    visitTitle: "Come See Us",
    visitText:
      "We open at nine and stay until the night feels finished. Walk in, find a chair, take your time.",
    hoursTitle: "Hours & Location",
    days: [
      { day: "Monday – Thursday", time: "09:00 – 00:00" },
      { day: "Friday – Saturday", time: "09:00 – 02:00" },
      { day: "Sunday", time: "10:00 – 00:00" },
    ],
    contactTitle: "Get in Touch",
    followUs: "Follow us on Instagram",
    openInMaps: "Open in Google Maps",
  },
  EL: {
    heroSubtitle: "Ποτά, μεζέδες, και η τέλεια παραθαλάσσια ατμόσφαιρα — στην καρδιά του Ρεθύμνου.",
    ctaMenu: "Δείτε το Μενού",
    journeyTitle: "Μια μέρα στο Home Seaside",
    aboutTitle: "Μια συνηθισμένη μέρα, σε αργό ρυθμό",
    aboutText:
      "Στην παραλιακή του Ρεθύμνου, το Home Seaside είναι ένας χώρος για να ξεχάσεις την ώρα. Cappuccino στις δέκα, χυμός μάνγκο και μεσημεριανό στη μία, ένα ποτήρι κάτι κρύο όσο ο ουρανός γίνεται ροζ. Φτιαγμένα με προσοχή, σερβιρισμένα με γενναιοδωρία — για όσο θέλεις να μείνεις.",
    visitTitle: "Έλα να μας βρεις",
    visitText:
      "Ανοίγουμε στις εννιά και μένουμε όσο νιώθει η νύχτα. Μπες, κάθισε, πάρε τον χρόνο σου.",
    hoursTitle: "Ώρες & Τοποθεσία",
    days: [
      { day: "Δευτέρα – Πέμπτη", time: "09:00 – 00:00" },
      { day: "Παρασκευή – Σάββατο", time: "09:00 – 02:00" },
      { day: "Κυριακή", time: "10:00 – 00:00" },
    ],
    contactTitle: "Επικοινωνία",
    followUs: "Ακολουθήστε μας στο Instagram",
    openInMaps: "Άνοιγμα στο Google Maps",
  },
} as const;

const HomePage: FC<HomePageProps> = ({ language }) => {
  const t = content[language];
  const telHref = `tel:${VENUE.phone.replace(/\s/g, "")}`;

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
        tint="cream"
      >
        <h2>{t.aboutTitle}</h2>
        <p>{t.aboutText}</p>
      </ParallaxBlock>

      {/* ─── Hours & Location with embedded map ─── */}
      <section className="home-section home-section--alt">
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

          <div className="home-map">
            <iframe
              title="Home Seaside location map"
              src={VENUE.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
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
        tint="pink"
      >
        <h2>{t.visitTitle}</h2>
        <p>{t.visitText}</p>
      </ParallaxBlock>

      {/* ─── Contact ─── */}
      <section className="home-section">
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
