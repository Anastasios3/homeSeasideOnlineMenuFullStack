import React, { useState, useEffect } from "react";
import { Coffee, Martini, Beer, Utensils, Wine } from "lucide-react";
import "../styles/CategoryNav.css";

type CategoryType = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";

interface CategoryConfig {
  id: CategoryType;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  coffee: { id: "coffee", label: "coffee & more", icon: <Coffee size={24} /> },
  spirits: { id: "spirits", label: "spirits", icon: <Wine size={24} /> },
  cocktails: {
    id: "cocktails",
    label: "cocktails",
    icon: <Martini size={24} />,
  },
  "beer&wine": {
    id: "beer&wine",
    label: "beer&wine",
    icon: <Beer size={24} />,
  },
  food: { id: "food", label: "food", icon: <Utensils size={24} /> },
};

const CategoryNav: React.FC = () => {
  const [orderedKeys, setOrderedKeys] = useState<CategoryType[]>([]);

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
    setOrderedKeys(getOrder());
    const interval = setInterval(() => setOrderedKeys(getOrder()), 60000); // Re-check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="category-nav" aria-label="Menu Categories">
      <ul className="category-list">
        {orderedKeys.map((key) => {
          const cat = CATEGORIES[key];
          return (
            <li key={cat.id} className="category-item">
              <button
                className="category-button"
                onClick={() => console.log(`Navigating to ${cat.label}`)}
                aria-label={`View ${cat.label}`}
              >
                <span className="category-icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="category-label">{cat.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryNav;
