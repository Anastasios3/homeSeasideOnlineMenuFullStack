import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { FC } from "react";
import axios from "axios";
import { Search, X, AlertTriangle } from "lucide-react";
import {
  getMeta as getSubcategoryMeta,
  SUBCATEGORIES_STORAGE_KEY,
  type MainCategoryId,
} from "../config/subcategories";
import { illustrationSrc } from "../config/siteContent";
import { useSiteContent } from "../hooks/useSiteContent";
import "../styles/MenuSection.css";
import { API_URL } from "../config/api";

type Language = "EN" | "EL";
type CategoryType = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";
type PricingType = "single" | "single_double" | "glass_bottle";

interface LocalizedField {
  en: string;
  el: string;
}

interface MenuItemData {
  _id: { $oid: string } | string;
  name: LocalizedField;
  description?: LocalizedField;
  main_category?: CategoryType;
  category: LocalizedField;
  price: number;
  pricing_type?: PricingType;
  price_secondary?: number | null;
  available: boolean;
  allergens: string[];
  image_url?: string | null;
}

const PRICING_LABELS: Record<string, Record<string, { first: string; second: string }>> = {
  single_double: { EN: { first: "S", second: "D" }, EL: { first: "Μ", second: "Δ" } },
  glass_bottle: { EN: { first: "Glass", second: "Bottle" }, EL: { first: "Ποτήρι", second: "Μπουκάλι" } },
};

interface MenuSectionProps {
  language: Language;
  activeCategory: CategoryType | null;
}


const getCategoryEN = (item: MenuItemData): string => {
  if (typeof item.category === "string") return item.category;
  return item.category?.en ?? "";
};

const getField = (
  field: LocalizedField | string | undefined,
  lang: Language
): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return lang === "EN" ? field.en : field.el;
};

const getId = (item: MenuItemData): string => {
  if (typeof item._id === "string") return item._id;
  return item._id?.$oid ?? "";
};

const formatPrice = (price: number): string => {
  return `${price.toFixed(2)}€`;
};

const getImageFullUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
};

/* ---------- Dual Price Component ---------- */
const DualPrice: FC<{ item: MenuItemData; language: Language; size?: "sm" | "lg" }> = ({ item, language, size = "sm" }) => {
  const isDual = item.pricing_type && item.pricing_type !== "single" && item.price_secondary != null;
  const labels = isDual ? PRICING_LABELS[item.pricing_type!]?.[language] : null;

  if (!isDual || !labels) {
    return (
      <span className={size === "lg" ? "item-modal__price" : "menu-item__price"}>
        {formatPrice(item.price)}
      </span>
    );
  }

  const cls = size === "lg" ? "price-dual--lg" : "price-dual--sm";

  return (
    <span className={`price-dual ${cls}`} role="text" aria-label={`${labels.first} ${formatPrice(item.price)}, ${labels.second} ${formatPrice(item.price_secondary!)}`}>
      <span className="price-dual__entry">
        <span className="price-dual__label">{labels.first}</span>
        <span className="price-dual__value">{formatPrice(item.price)}</span>
      </span>
      <span className="price-dual__sep" aria-hidden="true">/</span>
      <span className="price-dual__entry">
        <span className="price-dual__label">{labels.second}</span>
        <span className="price-dual__value">{formatPrice(item.price_secondary!)}</span>
      </span>
    </span>
  );
};

/* ---------- Skeleton loader ---------- */
const SkeletonLoader: FC = () => (
  <div className="menu-skeleton" aria-busy="true" aria-label="Loading menu">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i}>
        <div className="menu-skeleton__row">
          <div className="menu-skeleton__bar menu-skeleton__bar--name" />
          <div className="menu-skeleton__bar menu-skeleton__bar--price" />
        </div>
        <div className="menu-skeleton__bar menu-skeleton__bar--desc" />
      </div>
    ))}
  </div>
);

/* ---------- Empty state ---------- */
interface EmptyStateProps {
  language: Language;
  variant?: "none" | "search";
  query?: string;
  onClear?: () => void;
}
const EmptyState: FC<EmptyStateProps> = ({ language, variant = "none", query, onClear }) => {
  const isSearch = variant === "search";
  const { illustrations } = useSiteContent();
  return (
    <div className="menu-empty" role="status">
      <img
        src={illustrationSrc(illustrations.menuEmpty, "/illustration-vase.webp")}
        alt=""
        aria-hidden="true"
        className="menu-empty__art"
        loading="lazy"
        decoding="async"
      />
      <p className="menu-empty__text">
        {isSearch
          ? language === "EN"
            ? <>Nothing matches <em>“{query}”</em></>
            : <>Δεν βρέθηκε αποτέλεσμα για <em>«{query}»</em></>
          : language === "EN" ? "No items available" : "Δεν υπάρχουν διαθέσιμα"}
      </p>
      {isSearch && onClear && (
        <button type="button" className="menu-empty__clear" onClick={onClear}>
          {language === "EN" ? "Clear search" : "Καθαρισμός"}
        </button>
      )}
    </div>
  );
};

/* ---------- Item Detail Modal ---------- */
interface ItemModalProps {
  item: MenuItemData;
  language: Language;
  onClose: () => void;
}

const ItemModal: FC<ItemModalProps> = ({ item, language, onClose }) => {
  const description = getField(item.description, language);
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const imageUrl = getImageFullUrl(item.image_url);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Focus trap + scroll lock (Inclusive Components pattern) */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Move focus into the dialog
    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }

      // Trap focus inside the dialog
      if (e.key === "Tab") {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="item-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        className={`item-modal ${!imageUrl ? "item-modal--no-image" : ""}`}
      >
        <button
          ref={closeRef}
          className="item-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {imageUrl && (
          <div className="item-modal__image-area">
            <img
              src={imageUrl}
              alt=""
              className="item-modal__image"
              loading="lazy"
            />
          </div>
        )}

        <div className="item-modal__body">
          {/* Category — de-emphasized, contextual label */}
          <span className="item-modal__category">
            {getField(item.category, language)}
          </span>

          {/* Name — strongest visual weight */}
          <h2 id="modal-title" className="item-modal__name">
            {getField(item.name, language)}
          </h2>

          {/* Description — secondary, supportive text */}
          {description && (
            <p className="item-modal__desc">{description}</p>
          )}

          {/* Price area — contained in a subtle card for separation */}
          <div className="item-modal__price-area">
            <DualPrice item={item} language={language} size="lg" />
          </div>

          {/* Allergens — least prominent, bottom of hierarchy */}
          {hasAllergens && (
            <div className="item-modal__allergens" role="note" aria-label={language === "EN" ? "Allergen information" : "Πληροφορίες αλλεργιογόνων"}>
              <div className="item-modal__allergens-label">
                <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
                <span>{language === "EN" ? "Allergens" : "Αλλεργιογόνα"}</span>
              </div>
              <div className="item-modal__allergen-tags">
                {item.allergens.map((a) => (
                  <span key={a} className="allergen-tag">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Subcategory chips (horizontal scroll, scroll-snap) ---------- */
interface SubcategoryChipsProps {
  subcategories: string[];
  activeSubcategory: string | null;
  onSelect: (sub: string | null) => void;
  language: Language;
  items: MenuItemData[];
  counts: Map<string, number>;
}

const SubcategoryChips: FC<SubcategoryChipsProps> = ({
  subcategories, activeSubcategory, onSelect, language, items, counts,
}) => {
  const localized = useCallback((subEN: string): string => {
    const item = items.find((i) => getCategoryEN(i) === subEN);
    const main = (item?.main_category ?? "coffee") as MainCategoryId;
    const override = getSubcategoryMeta(main, subEN);
    if (override) return language === "EN" ? override.label_en : override.label_el;
    return item ? getField(item.category, language) : subEN;
  }, [items, language]);

  if (subcategories.length <= 1) return null;

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  return (
    <nav
      className="subcategory-chips"
      aria-label={language === "EN" ? "Subcategories" : "Υποκατηγορίες"}
    >
      <div className="subcategory-chips__track">
        <button
          type="button"
          className={`subcategory-chip ${!activeSubcategory ? "subcategory-chip--active" : ""}`}
          onClick={() => onSelect(null)}
          aria-pressed={!activeSubcategory}
        >
          <span>{language === "EN" ? "All" : "Όλα"}</span>
          <span className="subcategory-chip__count">{total}</span>
        </button>
        {subcategories.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`subcategory-chip ${activeSubcategory === sub ? "subcategory-chip--active" : ""}`}
            onClick={() => onSelect(sub)}
            aria-pressed={activeSubcategory === sub}
          >
            <span>{localized(sub)}</span>
            <span className="subcategory-chip__count">{counts.get(sub) ?? 0}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

/* ---------- Search input ---------- */
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  language: Language;
}
const SearchInput: FC<SearchInputProps> = ({ value, onChange, language }) => {
  const placeholder = language === "EN" ? "Search the menu" : "Αναζήτηση μενού";
  return (
    <div className={`menu-search ${value ? "menu-search--has-value" : ""}`} role="search">
      <Search size={16} strokeWidth={2} className="menu-search__icon" aria-hidden="true" />
      <input
        type="search"
        inputMode="search"
        className="menu-search__input"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="menu-search__clear"
          onClick={() => onChange("")}
          aria-label={language === "EN" ? "Clear search" : "Καθαρισμός"}
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};

/** Case-insensitive substring match across name/desc/category in both locales. */
const matchesQuery = (item: MenuItemData, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  const haystack = [
    item.name?.en,
    item.name?.el,
    item.description?.en,
    item.description?.el,
    item.category?.en,
    item.category?.el,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
};

/* ---------- Main Component ---------- */
const MenuSection: FC<MenuSectionProps> = ({ language, activeCategory }) => {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset filters when switching main category — keeps the UX predictable.
  useEffect(() => {
    setActiveSubcategory(null);
    setSearchQuery("");
  }, [activeCategory]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get<MenuItemData[]>(`${API_URL}/menu_items`);
        setItems(res.data);
      } catch {
        setError("Could not load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  /** Filter items by main_category field */
  const filteredItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((item) => item.main_category === activeCategory);
  }, [items, activeCategory]);

  // Bump on admin subcategory edits so chips re-render with new labels/order.
  const [overridesVersion, setOverridesVersion] = useState(0);
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === SUBCATEGORIES_STORAGE_KEY) setOverridesVersion((v) => v + 1);
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  /** Available subcategories for the current main category, with counts that
      respect the current search query — chip counts reflect what the user
      would actually see if they tapped the chip. Hidden subcategories
      (admin-flagged) drop out of the chip list. Ordering follows the admin
      override position when present; new/unoverridden slugs fall back to
      alphabetic at the tail. */
  const { subcategories, subcategoryCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of filteredItems) {
      if (!matchesQuery(item, searchQuery)) continue;
      const k = getCategoryEN(item);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const slugs = Array.from(counts.keys()).filter((slug) => {
      const item = filteredItems.find((i) => getCategoryEN(i) === slug);
      const main = (item?.main_category ?? "coffee") as MainCategoryId;
      return !getSubcategoryMeta(main, slug)?.hidden;
    });
    slugs.sort((a, b) => {
      const itemA = filteredItems.find((i) => getCategoryEN(i) === a);
      const itemB = filteredItems.find((i) => getCategoryEN(i) === b);
      const mainA = (itemA?.main_category ?? "coffee") as MainCategoryId;
      const mainB = (itemB?.main_category ?? "coffee") as MainCategoryId;
      const posA = getSubcategoryMeta(mainA, a)?.position;
      const posB = getSubcategoryMeta(mainB, b)?.position;
      if (posA != null && posB != null) return posA - posB;
      if (posA != null) return -1;
      if (posB != null) return 1;
      return a.localeCompare(b);
    });
    return { subcategories: slugs, subcategoryCounts: counts };
    // overridesVersion intentionally listed so re-renders refresh ordering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, searchQuery, overridesVersion]);

  /** Further filter by subcategory + search query. Items whose subcategory
      has been admin-hidden disappear from customer view entirely. */
  const displayItems = useMemo(() => {
    return filteredItems.filter((item) => {
      if (!matchesQuery(item, searchQuery)) return false;
      const slug = getCategoryEN(item);
      const main = (item.main_category ?? "coffee") as MainCategoryId;
      if (getSubcategoryMeta(main, slug)?.hidden) return false;
      if (activeSubcategory &&
        slug.toLowerCase() !== activeSubcategory.toLowerCase()) {
        return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, activeSubcategory, searchQuery, overridesVersion]);

  /** Group items by subcategory */
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemData[]>();
    for (const item of displayItems) {
      const catEN = getCategoryEN(item);
      if (!map.has(catEN)) map.set(catEN, []);
      map.get(catEN)!.push(item);
    }
    return map;
  }, [displayItems]);

  const handleItemClick = useCallback((item: MenuItemData) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <div className="menu-empty" role="alert">
        <p className="menu-empty__text">{error}</p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return <EmptyState language={language} />;
  }

  const showSearchEmpty = displayItems.length === 0;

  return (
    <>
      <div role="tabpanel" aria-label={activeCategory ?? "Menu"}>
        <div className="menu-toolbar">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            language={language}
          />
          <SubcategoryChips
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            onSelect={setActiveSubcategory}
            language={language}
            items={items}
            counts={subcategoryCounts}
          />
        </div>

        {showSearchEmpty ? (
          <EmptyState
            language={language}
            variant="search"
            query={searchQuery}
            onClear={() => { setSearchQuery(""); setActiveSubcategory(null); }}
          />
        ) : (
          Array.from(grouped.entries()).map(([category, categoryItems]) => {
            const main = (categoryItems[0]?.main_category ?? "coffee") as MainCategoryId;
            const override = getSubcategoryMeta(main, category);
            const heading = override
              ? (language === "EN" ? override.label_en : override.label_el)
              : getField(categoryItems[0]?.category, language);
            return (
            <section key={category} className="menu-category" aria-label={category}>
              <h2 className="menu-category__title">
                {heading}
              </h2>
              <ul className="menu-items">
                {categoryItems.map((item) => {
                  const thumb = getImageFullUrl(item.image_url);
                  return (
                    <li key={getId(item)} className="menu-item">
                      <button
                        className="menu-item__button"
                        onClick={() => handleItemClick(item)}
                        aria-label={`${getField(item.name, language)}, ${formatPrice(item.price)}${item.pricing_type && item.pricing_type !== "single" && item.price_secondary != null ? ` / ${formatPrice(item.price_secondary)}` : ""}`}
                      >
                        {thumb && (
                          <span className="menu-item__thumb" aria-hidden="true">
                            <img src={thumb} alt="" loading="lazy" decoding="async" />
                          </span>
                        )}
                        <div className="menu-item__info">
                          <div className="menu-item__name">
                            {getField(item.name, language)}
                          </div>
                          {getField(item.description, language) && (
                            <div className="menu-item__desc">
                              {getField(item.description, language)}
                            </div>
                          )}
                        </div>
                        <DualPrice item={item} language={language} size="sm" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
            );
          })
        )}
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          language={language}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default MenuSection;
