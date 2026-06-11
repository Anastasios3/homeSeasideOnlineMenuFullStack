import { type FC } from "react";
import { Link, Navigate } from "react-router-dom";
import MenuSection from "./MenuSection";
import { useDocumentMeta } from "../seo";
import { useSiteContent } from "../hooks/useSiteContent";
import { pickText, type CategoryContentSlug } from "../config/siteContent";
import { ContentParagraphs } from "./ContentText";
import "../styles/CategoryLanding.css";

type Language = "EN" | "EL";
type CategorySlug = CategoryContentSlug;

interface CategoryLandingProps {
  language: Language;
  category: string;
}

/** Maps a public URL slug to the backend's main_category id. */
const SLUG_TO_MAIN: Record<CategorySlug, "coffee" | "cocktails" | "spirits" | "food"> = {
  coffee: "coffee",
  cocktails: "cocktails",
  spirits: "spirits",
  food: "food",
};

const isCategorySlug = (s: string): s is CategorySlug =>
  s === "coffee" || s === "cocktails" || s === "spirits" || s === "food";

/** Inner content — only mounts when the slug is known. Hooks live here so
 * the early-return guard in the parent doesn't violate rules-of-hooks.
 * Copy (including the per-route SEO title/description) comes from the
 * site-content CMS; defaults in config/siteContent.ts render identically
 * to the old hardcoded COPY object. */
const CategoryLandingContent: FC<{ language: Language; category: CategorySlug }> = ({
  language, category,
}) => {
  const content = useSiteContent();
  const copy = content.categories[category];

  useDocumentMeta({
    title: pickText(copy.metaTitle, language),
    description: pickText(copy.metaDescription, language),
    canonicalPath: `/menu/${category}`,
  });

  return (
    <article className="category-landing">
      <header className="category-landing__header">
        <h1 className="category-landing__title">{pickText(copy.h1, language)}</h1>
        <div className="category-landing__prose">
          <ContentParagraphs text={pickText(copy.body, language)} />
        </div>
      </header>

      <section className="category-landing__menu" aria-label={language === "EN" ? "Menu items" : "Είδη μενού"}>
        <MenuSection language={language} activeCategory={SLUG_TO_MAIN[category]} />
      </section>

      <nav className="category-landing__related" aria-label={language === "EN" ? "Related categories" : "Σχετικές κατηγορίες"}>
        {(["coffee", "cocktails", "spirits", "food"] as const)
          .filter((c) => c !== category)
          .map((c) => (
            <Link key={c} to={`/menu/${c}`}>
              {pickText(content.categories[c].h1, language)} →
            </Link>
          ))}
      </nav>
    </article>
  );
};

/** Top-level component — validates the slug, then mounts the inner content
 * (which is where the hooks live). Unknown slugs redirect to /menu, so Google
 * sees a single canonical menu URL instead of soft 404s. */
const CategoryLanding: FC<CategoryLandingProps> = ({ language, category }) => {
  if (!isCategorySlug(category)) {
    return <Navigate to="/menu" replace />;
  }
  return <CategoryLandingContent language={language} category={category} />;
};

export default CategoryLanding;
