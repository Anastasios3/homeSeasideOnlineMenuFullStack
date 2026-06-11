import { useState, type FC } from "react";
import { ChevronDown } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import { pickText } from "../config/siteContent";
import { ContentParagraphs } from "./ContentText";
import "../styles/FAQ.css";

interface FAQProps {
  language: "EN" | "EL";
  className?: string;
}

/**
 * Plain-text FAQ on the homepage. Content comes from the site-content CMS
 * (admin can add/remove/reorder questions); defaults live in
 * config/siteContent.ts. Important: we deliberately do NOT emit FAQPage
 * JSON-LD — Google restricted FAQ rich results to government and healthcare
 * sites in August 2023, so a commercial FAQPage schema is at best ignored
 * and at worst flagged as schema spam. The plain HTML version still earns
 * AI Overviews citations and on-page topical authority.
 */
const FAQ: FC<FAQProps> = ({ language, className = "" }) => {
  const content = useSiteContent();
  const items = content.faq.items;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`home-faq ${className}`.trim()} aria-label={language === "EN" ? "Frequently asked questions" : "Συχνές ερωτήσεις"}>
      <div className="home-faq__inner">
        <h2 className="home-faq__heading">
          {pickText(content.faq.title, language)}
        </h2>
        <ul className="home-faq__list">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <li key={item.id} className={`home-faq__item ${isOpen ? "home-faq__item--open" : ""}`}>
                <button
                  type="button"
                  className="home-faq__question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{pickText(item.question, language)}</span>
                  <ChevronDown size={18} strokeWidth={2} className="home-faq__chevron" />
                </button>
                <div className="home-faq__answer" hidden={!isOpen}>
                  <ContentParagraphs text={pickText(item.answer, language)} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
