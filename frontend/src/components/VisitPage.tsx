import { type FC } from "react";
import { MessageSquareText, Instagram, ExternalLink } from "lucide-react";
import { useDocumentMeta } from "../seo";
import { VENUE } from "./HomePage";
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
 * Simplified TripAdvisor owl mark. Rendered monochrome in the accent color
 * so the card visually matches the other review CTAs.
 */
const TripAdvisorOwl: FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 4.5C7.305 4.5 3.5 8.305 3.5 13c0 4.695 3.805 8.5 8.5 8.5s8.5-3.805 8.5-8.5c0-4.695-3.805-8.5-8.5-8.5zm-4 11.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5zm8 0a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5z"/>
    <circle cx="8" cy="13" r="1.1" fill="white"/>
    <circle cx="16" cy="13" r="1.1" fill="white"/>
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
  useDocumentMeta({
    title: language === "EN"
      ? "Thanks for visiting — Home Seaside"
      : "Ευχαριστούμε για την επίσκεψη — Home Seaside",
    description: language === "EN"
      ? "Leave a Google review or share private feedback with the Home Seaside team."
      : "Άφησε μια αξιολόγηση στο Google ή στείλε μας ιδιωτικά τη γνώμη σου.",
    canonicalPath: "/visit",
    noindex: true,
  });

  const feedbackMailto = `mailto:${VENUE.email}?subject=${encodeURIComponent(
    language === "EN" ? "Feedback for Home Seaside" : "Γνώμη για το Home Seaside"
  )}`;

  if (language === "EN") {
    return (
      <article className="visit">
        <div className="visit__inner">
          <header className="visit__header">
            <p className="visit__eyebrow">Home Seaside · Rethymno</p>
            <h1 className="visit__title">Thanks for visiting today</h1>
            <p className="visit__lede">
              We'd love to hear how it went. Pick whichever feels right —
              every option goes directly to us.
            </p>
          </header>

          <a
            href={VENUE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="visit__instagram-cta"
          >
            <span className="visit__instagram-cta-icon">
              <Instagram size={30} strokeWidth={1.8} />
            </span>
            <span className="visit__instagram-cta-body">
              <span className="visit__instagram-cta-title">@home_seaside</span>
              <span className="visit__instagram-cta-subtitle">
                Daily stories, drinks, sunset photos — the life of the bar.
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
                <span className="visit__choice-title">Leave a Google review</span>
                <span className="visit__choice-desc">
                  Public, on our Google listing. Helps other guests find us and
                  tells our team how we're doing.
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
                <span className="visit__choice-title">Leave a TripAdvisor review</span>
                <span className="visit__choice-desc">
                  Public, on our TripAdvisor listing. Helps travellers find us
                  before they arrive.
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
                <span className="visit__choice-title">Send us private feedback</span>
                <span className="visit__choice-desc">
                  Direct to the manager. For anything you'd rather not say in
                  public — or just to drop us a note.
                </span>
              </span>
              <ExternalLink size={16} className="visit__choice-arrow" />
            </a>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="visit">
      <div className="visit__inner">
        <header className="visit__header">
          <p className="visit__eyebrow">Home Seaside · Ρέθυμνο</p>
          <h1 className="visit__title">Ευχαριστούμε για την επίσκεψη</h1>
          <p className="visit__lede">
            Θα θέλαμε πολύ να μάθουμε πώς πέρασες. Διάλεξε ό,τι σου ταιριάζει —
            κάθε επιλογή έρχεται απευθείας σε εμάς.
          </p>
        </header>

        <a
          href={VENUE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="visit__instagram-cta"
        >
          <span className="visit__instagram-cta-icon">
            <Instagram size={30} strokeWidth={1.8} />
          </span>
          <span className="visit__instagram-cta-body">
            <span className="visit__instagram-cta-title">@home_seaside</span>
            <span className="visit__instagram-cta-subtitle">
              Καθημερινές στιγμές, ποτά, ηλιοβασιλέματα — η ζωή του μπαρ.
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
              <span className="visit__choice-title">Άφησε αξιολόγηση στο Google</span>
              <span className="visit__choice-desc">
                Δημόσια, στο Google listing μας. Βοηθάει άλλους επισκέπτες να
                μας βρουν και λέει στην ομάδα μας πώς τα πάμε.
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
              <span className="visit__choice-title">Άφησε αξιολόγηση στο TripAdvisor</span>
              <span className="visit__choice-desc">
                Δημόσια, στο TripAdvisor listing μας. Βοηθάει ταξιδιώτες να μας
                βρουν πριν φτάσουν.
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
              <span className="visit__choice-title">Στείλε μας ιδιωτικά τη γνώμη σου</span>
              <span className="visit__choice-desc">
                Απευθείας στον υπεύθυνο. Για ό,τι θες να μας πεις χωρίς να
                δημοσιευτεί — ή απλά για ένα μήνυμα.
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
