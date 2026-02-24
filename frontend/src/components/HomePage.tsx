import { type FC } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import "../styles/HomePage.css";

interface HomePageProps {
  language: "EN" | "EL";
}

const content = {
  EN: {
    heroTagline: "Bar & More",
    heroSubtitle: "Drinks, bites, and the perfect seaside atmosphere.",
    ctaMenu: "View Our Menu",
    aboutTitle: "About Us",
    aboutText:
      "Nestled along the shoreline, Home Seaside is a place to unwind with carefully crafted cocktails, specialty coffee, and fresh bites — all with a view of the sea. Whether you're starting your morning or ending your evening, we've got a seat for you.",
    hoursTitle: "Hours & Location",
    days: [
      { day: "Monday – Thursday", time: "09:00 – 00:00" },
      { day: "Friday – Saturday", time: "09:00 – 02:00" },
      { day: "Sunday", time: "10:00 – 00:00" },
    ],
    address: "123 Seaside Avenue, Coastal Town, Greece",
    contactTitle: "Get in Touch",
    phone: "+30 210 123 4567",
    email: "hello@homeseaside.com",
  },
  EL: {
    heroTagline: "Bar & More",
    heroSubtitle: "Ποτά, σνακ, και η τέλεια παραθαλάσσια ατμόσφαιρα.",
    ctaMenu: "Δείτε το Μενού μας",
    aboutTitle: "Σχετικά με εμάς",
    aboutText:
      "Δίπλα στη θάλασσα, το Home Seaside είναι ένας χώρος χαλάρωσης με προσεκτικά φτιαγμένα κοκτέιλ, specialty καφέ και φρέσκα σνακ — όλα με θέα τη θάλασσα. Είτε ξεκινάτε το πρωινό σας είτε κλείνετε τη βραδιά σας, έχουμε μια θέση για εσάς.",
    hoursTitle: "Ώρες & Τοποθεσία",
    days: [
      { day: "Δευτέρα – Πέμπτη", time: "09:00 – 00:00" },
      { day: "Παρασκευή – Σάββατο", time: "09:00 – 02:00" },
      { day: "Κυριακή", time: "10:00 – 00:00" },
    ],
    address: "Παραλιακή Λεωφόρος 123, Παραθαλάσσια Πόλη, Ελλάδα",
    contactTitle: "Επικοινωνήστε μαζί μας",
    phone: "+30 210 123 4567",
    email: "hello@homeseaside.com",
  },
} as const;

const HomePage: FC<HomePageProps> = ({ language }) => {
  const t = content[language];

  return (
    <div className="home">
      {/* ─── Hero ─── */}
      <section className="home-hero">
        <div className="home-hero__inner">
          <h1 className="home-hero__title">Home Seaside</h1>
          <p className="home-hero__tagline">{t.heroTagline}</p>
          <p className="home-hero__subtitle">{t.heroSubtitle}</p>
          <Link to="/menu" className="home-hero__cta">
            {t.ctaMenu}
          </Link>
        </div>
      </section>

      {/* ─── About ─── */}
      <section className="home-section">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{t.aboutTitle}</h2>
          <p className="home-section__text">{t.aboutText}</p>
        </div>
      </section>

      {/* ─── Hours & Location ─── */}
      <section className="home-section home-section--alt">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{t.hoursTitle}</h2>

          <div className="home-info-grid">
            {/* Hours */}
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

            {/* Location */}
            <div className="home-info-card">
              <div className="home-info-card__icon">
                <MapPin size={20} strokeWidth={1.5} />
              </div>
              <p className="home-info-card__text">{t.address}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section className="home-section">
        <div className="home-section__inner">
          <h2 className="home-section__heading">{t.contactTitle}</h2>

          <div className="home-contact-links">
            <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="home-contact-link">
              <Phone size={16} strokeWidth={1.5} />
              <span>{t.phone}</span>
            </a>
            <a href={`mailto:${t.email}`} className="home-contact-link">
              <Mail size={16} strokeWidth={1.5} />
              <span>{t.email}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
