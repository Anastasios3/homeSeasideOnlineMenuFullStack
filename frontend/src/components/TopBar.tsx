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
    onLanguageChange?.(lang);
  }, [lang, onLanguageChange]);

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        {/* Theme toggle */}
        <div className="header-slot header-slot-left">
          <div className="pill-toggle" role="radiogroup" aria-label="Theme">
            <button
              role="radio"
              aria-checked={theme === "light"}
              onClick={() => setTheme("light")}
              className={`pill-toggle__option ${theme === "light" ? "pill-toggle__option--active" : ""}`}
              aria-label="Light mode"
            >
              <Sun size={14} strokeWidth={2.5} />
            </button>
            <button
              role="radio"
              aria-checked={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={`pill-toggle__option ${theme === "dark" ? "pill-toggle__option--active" : ""}`}
              aria-label="Dark mode"
            >
              <Moon size={14} strokeWidth={2.5} />
            </button>
            <div
              className={`pill-toggle__indicator ${theme === "dark" ? "pill-toggle__indicator--right" : ""}`}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="header-logo-wrap">
          <img
            src={theme === "light" ? "/Logo_light.svg" : "/Logo_Dark.svg"}
            alt="Home Seaside Bar & More"
            className="header-logo"
            loading="eager"
          />
        </div>

        {/* Language selector */}
        <div className="header-slot header-slot-right">
          <div className="pill-toggle" role="radiogroup" aria-label="Language">
            <button
              role="radio"
              aria-checked={lang === "EN"}
              onClick={() => setLang("EN")}
              className={`pill-toggle__option ${lang === "EN" ? "pill-toggle__option--active" : ""}`}
            >
              EN
            </button>
            <button
              role="radio"
              aria-checked={lang === "EL"}
              onClick={() => setLang("EL")}
              className={`pill-toggle__option ${lang === "EL" ? "pill-toggle__option--active" : ""}`}
            >
              EL
            </button>
            <div
              className={`pill-toggle__indicator ${lang === "EL" ? "pill-toggle__indicator--right" : ""}`}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
