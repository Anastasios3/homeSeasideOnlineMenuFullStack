import React, { useState, useEffect, useCallback } from "react";
import { Coffee, Martini, Beer, Utensils, Wine } from "lucide-react";
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
    label: { EN: "coffee & more", EL: "καφες & αλλα" },
    icon: <Coffee size={20} strokeWidth={1.8} />,
  },
  spirits: {
    id: "spirits",
    label: { EN: "spirits", EL: "ποτα" },
    icon: <Wine size={20} strokeWidth={1.8} />,
  },
  cocktails: {
    id: "cocktails",
    label: { EN: "cocktails", EL: "κοκτειλ" },
    icon: <Martini size={20} strokeWidth={1.8} />,
  },
  "beer&wine": {
    id: "beer&wine",
    label: { EN: "beer & wine", EL: "μπυρα & κρασι" },
    icon: <Beer size={20} strokeWidth={1.8} />,
  },
  food: {
    id: "food",
    label: { EN: "food", EL: "φαγητο" },
    icon: <Utensils size={20} strokeWidth={1.8} />,
  },
};

interface CategoryNavProps {
  currentLanguage?: Language;
  onCategoryChange?: (category: CategoryType) => void;
}

const getOrder = (): CategoryType[] => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12)
    return ["coffee", "food", "beer&wine", "cocktails", "spirits"];
  if (hour >= 12 && hour < 17)
    return ["food", "coffee", "beer&wine", "spirits", "cocktails"];
  if (hour >= 17 && hour < 21)
    return ["cocktails", "coffee", "food", "beer&wine", "spirits"];
  return ["cocktails", "spirits", "beer&wine", "food", "coffee"];
};

const CategoryNav: React.FC<CategoryNavProps> = ({
  currentLanguage = "EN",
  onCategoryChange,
}) => {
  const [orderedKeys, setOrderedKeys] = useState<CategoryType[]>(getOrder);
  const [activeCategory, setActiveCategory] = useState<CategoryType>(
    getOrder()[0]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newOrder = getOrder();
      setOrderedKeys(newOrder);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
