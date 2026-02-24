import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { FC } from "react";
import axios from "axios";
import { UtensilsCrossed, X, ChevronDown, AlertTriangle } from "lucide-react";
import "../styles/MenuSection.css";

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
const EmptyState: FC<{ language: Language }> = ({ language }) => (
  <div className="menu-empty" role="status">
    <div className="menu-empty__icon" aria-hidden="true">
      <UtensilsCrossed size={48} strokeWidth={1.2} />
    </div>
    <p className="menu-empty__text">
      {language === "EN" ? "No items available" : "Δεν υπάρχουν διαθέσιμα"}
    </p>
  </div>
);

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

/* ---------- Subcategory filter ---------- */
interface SubcategoryFilterProps {
  subcategories: string[];
  activeSubcategory: string | null;
  onSelect: (sub: string | null) => void;
  language: Language;
  items: MenuItemData[];
}

const SubcategoryFilter: FC<SubcategoryFilterProps> = ({
  subcategories, activeSubcategory, onSelect, language, items,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = () => setIsOpen(false);
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [isOpen]);

  const getLocalizedSubcategory = (subEN: string): string => {
    const item = items.find((i) => getCategoryEN(i) === subEN);
    if (item) return getField(item.category, language);
    return subEN;
  };

  const currentLabel = activeSubcategory
    ? getLocalizedSubcategory(activeSubcategory)
    : language === "EN" ? "All Subcategories" : "Όλες οι Υποκατηγορίες";

  if (subcategories.length <= 1) return null;

  return (
    <div className="subcategory-filter">
      <button
        className={`subcategory-filter__toggle ${isOpen ? "subcategory-filter__toggle--open" : ""}`}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="subcategory-filter__label">{currentLabel}</span>
        <ChevronDown size={16} className="subcategory-filter__chevron" />
      </button>
      {isOpen && (
        <div className="subcategory-filter__dropdown" role="listbox">
          <button
            className={`subcategory-filter__option ${!activeSubcategory ? "subcategory-filter__option--active" : ""}`}
            role="option"
            aria-selected={!activeSubcategory}
            onClick={() => { onSelect(null); setIsOpen(false); }}
          >
            {language === "EN" ? "All" : "Όλα"}
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              className={`subcategory-filter__option ${activeSubcategory === sub ? "subcategory-filter__option--active" : ""}`}
              role="option"
              aria-selected={activeSubcategory === sub}
              onClick={() => { onSelect(sub); setIsOpen(false); }}
            >
              {getLocalizedSubcategory(sub)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Main Component ---------- */
const MenuSection: FC<MenuSectionProps> = ({ language, activeCategory }) => {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  useEffect(() => {
    setActiveSubcategory(null);
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

  /** Available subcategories for the current main category */
  const subcategories = useMemo(() => {
    const cats = new Set<string>();
    for (const item of filteredItems) {
      cats.add(getCategoryEN(item));
    }
    return Array.from(cats).sort();
  }, [filteredItems]);

  /** Further filter by subcategory if selected */
  const displayItems = useMemo(() => {
    if (!activeSubcategory) return filteredItems;
    return filteredItems.filter(
      (item) => getCategoryEN(item).toLowerCase() === activeSubcategory.toLowerCase()
    );
  }, [filteredItems, activeSubcategory]);

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

  return (
    <>
      <div role="tabpanel" aria-label={activeCategory ?? "Menu"}>
        <SubcategoryFilter
          subcategories={subcategories}
          activeSubcategory={activeSubcategory}
          onSelect={setActiveSubcategory}
          language={language}
          items={items}
        />

        {Array.from(grouped.entries()).map(([category, categoryItems]) => (
          <section key={category} className="menu-category" aria-label={category}>
            <h2 className="menu-category__title">
              {getField(categoryItems[0]?.category, language)}
            </h2>
            <ul className="menu-items">
              {categoryItems.map((item) => (
                <li key={getId(item)} className="menu-item">
                  <button
                    className="menu-item__button"
                    onClick={() => handleItemClick(item)}
                    aria-label={`${getField(item.name, language)}, ${formatPrice(item.price)}${item.pricing_type && item.pricing_type !== "single" && item.price_secondary != null ? ` / ${formatPrice(item.price_secondary)}` : ""}`}
                  >
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
              ))}
            </ul>
          </section>
        ))}
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
