import { useState, useEffect } from "react";
import type { FC } from "react";
import { Sun, Moon } from "lucide-react";
import "../styles/TopBar.css";

interface TopBarProps {
  onLanguageChange?: (lang: "EN" | "EL") => void;
}

const TopBar: FC<TopBarProps> = ({ onLanguageChange }) => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [lang, setLang] = useState<"EN" | "EL">("EN");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Notify parent component of language change
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  }, [lang, onLanguageChange]);

  const handleLanguageChange = (newLang: "EN" | "EL") => {
    setLang(newLang);
  };

  return (
    <header className="site-header" role="banner">
      <div className="header-inner-container">
        {/* Left Slot: Theme Toggle Pill */}
        <div className="nav-slot slot-left">
          <div className="theme-pill">
            <button
              onClick={() => setTheme("light")}
              className={`theme-option ${theme === "light" ? "active" : ""}`}
              aria-label="Switch to light mode"
            >
              <Sun size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`theme-option ${theme === "dark" ? "active" : ""}`}
              aria-label="Switch to dark mode"
            >
              <Moon size={16} strokeWidth={2.5} />
            </button>
            <div className={`theme-slider ${theme}`} />
          </div>
        </div>

        {/* Center Slot: Brand Identity */}
        <div className="logo-center-container">
          <img
            src={theme === "light" ? "/Logo_light.svg" : "/Logo_Dark.svg"}
            alt="Home Seaside Bar & More"
            className="brand-logo"
            loading="eager"
          />
        </div>

        {/* Right Slot: Language Selector */}
        <div className="nav-slot slot-right">
          <div className="lang-pill">
            <button
              onClick={() => handleLanguageChange("EN")}
              className={`lang-option ${lang === "EN" ? "active" : ""}`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange("EL")}
              className={`lang-option ${lang === "EL" ? "active" : ""}`}
            >
              EL
            </button>
            <div className={`lang-slider ${lang.toLowerCase()}`} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
