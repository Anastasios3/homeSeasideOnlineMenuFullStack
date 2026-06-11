import { type FC } from "react";
import { Link } from "react-router-dom";
import { ALBUM1_PHOTOS } from "../assets/photos/album1";
import { useDocumentMeta } from "../seo";
import Picture from "./Picture";
import AdminPicture from "./AdminPicture";
import { useSiteContent } from "../hooks/useSiteContent";
import { pickText, type ContentPhotoRef } from "../config/siteContent";
import { ContentParagraphs } from "./ContentText";
import "../styles/AboutPage.css";

interface AboutPageProps {
  language: "EN" | "EL";
}

/** Can this ref actually produce an image? Mirrors the old `photo &&`
 *  guard — a chapter without a resolvable photo renders text-only. */
const photoResolvable = (ref: ContentPhotoRef): boolean =>
  ref.kind === "custom" ? !!ref.url : !!ALBUM1_PHOTOS[ref.slug];

/**
 * Render a CMS photo ref. Bundled slugs go through the full <Picture>
 * pipeline (AVIF/WebP/JPG + blur-up). Custom uploads render through
 * AdminPicture inside an .hs-picture box so the page's aspect-ratio CSS
 * (.about__hero / .about__chapter-photo) applies to both kinds equally.
 */
const ContentPhoto: FC<{
  photoRef: ContentPhotoRef;
  alt: string;
  language: "EN" | "EL";
  sizes: string;
}> = ({ photoRef, alt, language, sizes }) => {
  if (photoRef.kind === "bundled") {
    const meta = ALBUM1_PHOTOS[photoRef.slug];
    if (!meta) return null;
    return <Picture photo={meta} alt={alt} sizes={sizes} />;
  }
  return (
    <div className="hs-picture is-loaded">
      <AdminPicture
        slot={{
          url: photoRef.url,
          srcset: photoRef.srcset,
          width: photoRef.width,
          height: photoRef.height,
          alt_en: alt,
          alt_el: alt,
        }}
        language={language}
        alt={alt}
        sizes={sizes}
      />
    </div>
  );
};

/**
 * /about — photo-led storytelling. The hero anchors the page in the
 * seafront, then alternating photo+text chapters carry the visitor through
 * a day at Home Seaside. All copy and photos come from the site-content
 * CMS (admin can edit text, swap photos, and add/remove/reorder chapters);
 * the defaults in config/siteContent.ts reproduce the original page
 * exactly. Plain-text paragraphs hold the E-E-A-T weight and the repeated
 * entity name; the photos do the rest of the talking.
 */
const AboutPage: FC<AboutPageProps> = ({ language }) => {
  const content = useSiteContent();
  const about = content.about;

  useDocumentMeta({
    title: language === "EN"
      ? "About Home Seaside · Seafront café & bar in Rethymno"
      : "Σχετικά με το Home Seaside · Παραθαλάσσιο café & bar στο Ρέθυμνο",
    description: language === "EN"
      ? "The story behind Home Seaside Bar & More in Rethymno, Crete. A seafront café and cocktail bar known for specialty coffee, an extensive rum selection, and comfort food."
      : "Η ιστορία πίσω από το Home Seaside Bar & More στο Ρέθυμνο της Κρήτης. Παραθαλάσσιο café και cocktail bar γνωστό για specialty καφέ, μεγάλη συλλογή ρουμιού και comfort φαγητό.",
    canonicalPath: "/about",
  });

  return (
    <article className="about">
      <header className="about__header">
        <p className="about__eyebrow">{pickText(about.eyebrow, language)}</p>
        <h1 className="about__title">{pickText(about.title, language)}</h1>
        <p className="about__lede">{pickText(about.lede, language)}</p>
      </header>

      {photoResolvable(about.heroPhoto) && (
        <figure className="about__hero">
          <ContentPhoto
            photoRef={about.heroPhoto}
            alt={pickText(about.heroAlt, language)}
            language={language}
            sizes="(min-width: 1200px) 1100px, 100vw"
          />
        </figure>
      )}

      <section className="about__story">
        {about.chapters.map((chapter, idx) => (
          <div
            key={chapter.id}
            className={`about__chapter about__chapter--${idx % 2 === 0 ? "left" : "right"}`}
          >
            {photoResolvable(chapter.photo) && (
              <figure className="about__chapter-photo">
                <ContentPhoto
                  photoRef={chapter.photo}
                  alt={pickText(chapter.photoAlt, language)}
                  language={language}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </figure>
            )}
            <div className="about__chapter-text">
              <h2>{pickText(chapter.title, language)}</h2>
              <ContentParagraphs text={pickText(chapter.body, language)} linkify />
            </div>
          </div>
        ))}
      </section>

      <nav className="about__related" aria-label={language === "EN" ? "Related menu pages" : "Σχετικές σελίδες μενού"}>
        {language === "EN" ? (
          <>
            <Link to="/menu/coffee">Specialty coffee →</Link>
            <Link to="/menu/cocktails">Cocktails →</Link>
            <Link to="/menu/spirits">Rum &amp; spirits →</Link>
            <Link to="/menu/food">Comfort food →</Link>
          </>
        ) : (
          <>
            <Link to="/menu/coffee">Specialty καφές →</Link>
            <Link to="/menu/cocktails">Cocktails →</Link>
            <Link to="/menu/spirits">Ρούμι &amp; spirits →</Link>
            <Link to="/menu/food">Comfort φαγητό →</Link>
          </>
        )}
      </nav>
    </article>
  );
};

export default AboutPage;
