import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTimeOfDay } from "../hooks/useTimeOfDay";
import { getCategoryOrder, SCHEDULE_STORAGE_KEY } from "../config/schedule";
import {
  CoffeeIcon,
  CocktailIcon,
  WineIcon,
  SpiritsIcon,
  FoodIcon,
} from "./CategoryIcons";
import "../styles/CategoryNav.css";

type CategoryType = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";
type Language = "EN" | "EL";

interface CategoryConfig {
  id: CategoryType;
  label: { EN: string; EL: string };
  icon: React.ReactNode;
}

const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  coffee: {
    id: "coffee",
    label: { EN: "coffee & more", EL: "καφές & άλλα" },
    icon: <CoffeeIcon size={22} />,
  },
  spirits: {
    id: "spirits",
    label: { EN: "spirits", EL: "ποτά" },
    icon: <SpiritsIcon size={22} />,
  },
  cocktails: {
    id: "cocktails",
    label: { EN: "cocktails", EL: "κοκτέιλ" },
    icon: <CocktailIcon size={22} />,
  },
  "beer&wine": {
    id: "beer&wine",
    label: { EN: "beer & wine", EL: "μπύρα & κρασί" },
    icon: <WineIcon size={22} />,
  },
  food: {
    id: "food",
    label: { EN: "food", EL: "φαγητό" },
    icon: <FoodIcon size={22} />,
  },
};

interface CategoryNavProps {
  currentLanguage?: Language;
  onCategoryChange?: (category: CategoryType) => void;
}

const CategoryNav: React.FC<CategoryNavProps> = ({
  currentLanguage = "EN",
  onCategoryChange,
}) => {
  const { phase } = useTimeOfDay();
  // Bump version on every schedule storage event so admins can reorder
  // categories per phase and customers see it on the next paint.
  const [scheduleVersion, setScheduleVersion] = useState(0);
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === SCHEDULE_STORAGE_KEY) setScheduleVersion((v) => v + 1);
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);
  const orderedKeys = useMemo<CategoryType[]>(
    () => getCategoryOrder(phase) as CategoryType[],
    [phase, scheduleVersion]
  );
  const [activeCategory, setActiveCategory] = useState<CategoryType>(
    orderedKeys[0]
  );

  const handleClick = useCallback(
    (id: CategoryType) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );

  // Notify parent of initial category
  useEffect(() => {
    onCategoryChange?.(activeCategory);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <nav className="category-nav" aria-label="Menu categories">
      <ul className="category-list" role="tablist">
        {orderedKeys.map((key) => {
          const cat = CATEGORIES[key];
          const isActive = activeCategory === cat.id;
          return (
            <li key={cat.id} className="category-item" role="presentation">
              <button
                role="tab"
                aria-selected={isActive}
                className={`category-btn ${isActive ? "category-btn--active" : ""}`}
                onClick={() => handleClick(cat.id)}
              >
                <span className="category-btn__icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="category-btn__label">
                  {cat.label[currentLanguage]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryNav;
