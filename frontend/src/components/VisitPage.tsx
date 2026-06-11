import { type FC } from "react";
import { MessageSquareText, Instagram, ExternalLink } from "lucide-react";
import { useDocumentMeta } from "../seo";
import { useSiteContent } from "../hooks/useSiteContent";
import { instagramUrl, pickText } from "../config/siteContent";
import "../styles/VisitPage.css";

interface VisitPageProps {
  language: "EN" | "EL";
}

/**
 * Official multi-color Google "G" mark, inlined to avoid pulling in a
 * brand-asset package. Paths are Google's canonical SVG.
 */
const GoogleG: FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

/**
 * Simplified TripAdvisor owl mark — solid head circle in the brand green
 * (#00AF87) with two large white eyes, dark pupils, small highlights, and
 * a triangular beak. More immediately recognizable than a flat monochrome
 * silhouette. The `color: currentColor` paths inherit the brand green from
 * the .visit__choice--tripadvisor .visit__choice-icon container.
 */
const TripAdvisorOwl: FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    {/* Outer head circle */}
    <circle cx="24" cy="24" r="22" fill="currentColor" />
    {/* Left eye — white sclera */}
    <circle cx="15.5" cy="22" r="6.5" fill="#fff" />
    {/* Right eye — white sclera */}
    <circle cx="32.5" cy="22" r="6.5" fill="#fff" />
    {/* Left pupil */}
    <circle cx="15.5" cy="22" r="2.6" fill="#0f172a" />
    {/* Right pupil — slightly offset shape suggesting the TA "pin" inside the right eye */}
    <circle cx="32.5" cy="22" r="2.6" fill="#0f172a" />
    {/* Left pupil highlight */}
    <circle cx="14.4" cy="20.8" r="0.9" fill="#fff" />
    {/* Right pupil highlight */}
    <circle cx="31.4" cy="20.8" r="0.9" fill="#fff" />
    {/* Beak — small inverted triangle between eyes */}
    <path d="M24 27 L21.5 30.5 L26.5 30.5 Z" fill="currentColor" stroke="#0f172a" strokeWidth="0.6" />
  </svg>
);

/**
 * Replace this with the exact write-review URL from your GBP dashboard.
 *
 * How to get it: Google Business Profile → "Get more reviews" → copy short link.
 * Looks like https://g.page/r/<XXXX>/review (note the /review at the end —
 * that's what opens the review form directly instead of the listing page).
 *
 * Until that's filled in, the button uses the public maps listing as a fallback.
 */
const GBP_REVIEW_URL = "https://maps.app.goo.gl/Bni5sF7oQSpCuB2w8";

const TRIPADVISOR_REVIEW_URL = "https://www.tripadvisor.com/Restaurant_Review-g189421-d8155251-Reviews-Home_Seaside_Cocktail_Bar-Rethymnon_Rethymnon_Prefecture_Crete.html";

/**
 * /visit — the page our QR codes (on tables and receipts) point to.
 * Header, Instagram CTA, and the three choice blocks read from the
 * site-content CMS; review URLs and the noindex meta stay fixed.
 *
 * Compliance note: this page does NOT pre-filter customers by experience
 * before showing the review CTA. Google explicitly forbids "review gating"
 * (asking "did you have a good experience?" before directing to a public
 * review) and has been known to remove gated reviews. Instead we present
 * both CTAs — public review and private feedback — side by side, equal weight,
 * so the customer chooses what suits them. This is the only review-funnel
 * pattern that's compliant with Google's guidelines.
 *
 * The page is also noindex'd. It's a transactional landing page reached via
 * QR; it shouldn't compete with /about or the homepage in search.
 */
const VisitPage: FC<VisitPageProps> = ({ language }) => {
  const content = useSiteContent();
  const visit = content.visit;
  const venue = content.venue;

  useDocumentMeta({
    title: language === "EN"
      ? "Thanks for visiting · Home Seaside"
      : "Ευχαριστούμε για την επίσκεψη · Home Seaside",
    description: language === "EN"
      ? "Leave a Google review or share private feedback with the Home Seaside team."
      : "Άφησε μια αξιολόγηση στο Google ή στείλε μας ιδιωτικά τη γνώμη σου.",
    canonicalPath: "/visit",
    noindex: true,
  });

  const feedbackMailto = `mailto:${venue.email}?subject=${encodeURIComponent(
    language === "EN" ? "Feedback for Home Seaside" : "Γνώμη για το Home Seaside"
  )}`;

  return (
    <article className="visit">
      <div className="visit__inner">
        <header className="visit__header">
          <p className="visit__eyebrow">{pickText(visit.eyebrow, language)}</p>
          <h1 className="visit__title">{pickText(visit.title, language)}</h1>
          <p className="visit__lede">{pickText(visit.lede, language)}</p>
        </header>

        <a
          href={instagramUrl(venue.instagramHandle)}
          target="_blank"
          rel="noopener noreferrer"
          className="visit__instagram-cta"
        >
          <span className="visit__instagram-cta-icon">
            <Instagram size={30} strokeWidth={1.8} />
          </span>
          <span className="visit__instagram-cta-body">
            <span className="visit__instagram-cta-title">{venue.instagramHandle}</span>
            <span className="visit__instagram-cta-subtitle">
              {pickText(visit.instagramSubtitle, language)}
            </span>
          </span>
          <ExternalLink size={16} className="visit__instagram-cta-arrow" />
        </a>

        <div className="visit__choices">
          <a
            className="visit__choice visit__choice--public"
            href={GBP_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="visit__choice-icon">
              <GoogleG size={28} />
            </span>
            <span className="visit__choice-body">
              <span className="visit__choice-title">{pickText(visit.choices.google.title, language)}</span>
              <span className="visit__choice-desc">
                {pickText(visit.choices.google.description, language)}
              </span>
            </span>
            <ExternalLink size={16} className="visit__choice-arrow" />
          </a>

          <a
            className="visit__choice visit__choice--tripadvisor"
            href={TRIPADVISOR_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="visit__choice-icon">
              <TripAdvisorOwl size={28} />
            </span>
            <span className="visit__choice-body">
              <span className="visit__choice-title">{pickText(visit.choices.tripadvisor.title, language)}</span>
              <span className="visit__choice-desc">
                {pickText(visit.choices.tripadvisor.description, language)}
              </span>
            </span>
            <ExternalLink size={16} className="visit__choice-arrow" />
          </a>

          <a
            className="visit__choice visit__choice--private"
            href={feedbackMailto}
          >
            <span className="visit__choice-icon">
              <MessageSquareText size={28} strokeWidth={1.8} />
            </span>
            <span className="visit__choice-body">
              <span className="visit__choice-title">{pickText(visit.choices.private.title, language)}</span>
              <span className="visit__choice-desc">
                {pickText(visit.choices.private.description, language)}
              </span>
            </span>
            <ExternalLink size={16} className="visit__choice-arrow" />
          </a>
        </div>
      </div>
    </article>
  );
};

export default VisitPage;
