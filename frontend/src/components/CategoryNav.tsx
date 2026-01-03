import React, { useState, useEffect } from "react";
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
    icon: <Coffee size={24} />,
  },
  spirits: {
    id: "spirits",
    label: { EN: "spirits", EL: "ποτα" },
    icon: <Wine size={24} />,
  },
  cocktails: {
    id: "cocktails",
    label: { EN: "cocktails", EL: "κοκτειλ" },
    icon: <Martini size={24} />,
  },
  "beer&wine": {
    id: "beer&wine",
    label: { EN: "beer & wine", EL: "μπυρα & κρασι" },
    icon: <Beer size={24} />,
  },
  food: {
    id: "food",
    label: { EN: "food", EL: "φαγητο" },
    icon: <Utensils size={24} />,
  },
};

interface CategoryNavProps {
  currentLanguage?: Language;
}

const CategoryNav: React.FC<CategoryNavProps> = ({
  currentLanguage = "EN",
}) => {
  const [orderedKeys, setOrderedKeys] = useState<CategoryType[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(
    null
  );

  const getOrder = (): CategoryType[] => {
    const hour = new Date().getHours();

    // Morning: 06:00 - 11:59
    if (hour >= 6 && hour < 12) {
      return ["coffee", "food", "beer&wine", "cocktails", "spirits"];
    }
    // Lunch: 12:00 - 16:59
    if (hour >= 12 && hour < 17) {
      return ["food", "coffee", "beer&wine", "spirits", "cocktails"];
    }
    // Afternoon: 17:00 - 20:59
    if (hour >= 17 && hour < 21) {
      return ["cocktails", "coffee", "food", "beer&wine", "spirits"];
    }
    // Night: 21:00 - 05:59
    return ["cocktails", "spirits", "beer&wine", "food", "coffee"];
  };

  useEffect(() => {
    const order = getOrder();
    setOrderedKeys(order);
    // Set first category as active by default
    if (!activeCategory) {
      setActiveCategory(order[0]);
    }
    const interval = setInterval(() => {
      const newOrder = getOrder();
      setOrderedKeys(newOrder);
      // Update active category if the order changes and current active is not in first position
      if (activeCategory && newOrder[0] !== activeCategory) {
        setActiveCategory(newOrder[0]);
      }
    }, 60000); // Re-check every minute
    return () => clearInterval(interval);
  }, [activeCategory]);

  const handleCategoryClick = (categoryId: CategoryType) => {
    setActiveCategory(categoryId);
    console.log(`Navigating to ${categoryId}`);
    // Add your navigation logic here
  };

  return (
    <nav className="category-nav" aria-label="Menu Categories">
      <ul className="category-list">
        {orderedKeys.map((key) => {
          const cat = CATEGORIES[key];
          const isActive = activeCategory === cat.id;

          return (
            <li key={cat.id} className="category-item">
              <button
                className={`category-button ${isActive ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat.id)}
                aria-label={`View ${cat.label[currentLanguage]}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="category-icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="category-label">
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
