import { useState, useEffect } from "react";
import type { FC } from "react";
import { Sun, Moon } from "lucide-react";
import "../styles/TopBar.css";

const TopBar: FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [lang, setLang] = useState<"EN" | "EL">("EN");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  return (
    <header className="site-header" role="banner">
      <div className="header-inner-container">
        {/* Left: Centered Silver Theme Toggle */}
        <nav
          className="header-nav section-left"
          aria-label="Appearance settings"
        >
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? (
              <Moon size={22} color="#C0C0C0" strokeWidth={2} />
            ) : (
              <Sun size={22} color="#C0C0C0" strokeWidth={2} />
            )}
          </button>
        </nav>

        {/* Center: Brand Logo */}
        <div className="header-logo-container">
          <img
            src={theme === "light" ? "/Logo_light.svg" : "/Logo_Dark.svg"}
            alt="Home Seaside Bar & More"
            className="brand-logo"
            loading="eager"
          />
        </div>

        {/* Right: Language Pill Toggle */}
        <nav
          className="header-nav section-right"
          aria-label="Language selection"
        >
          <div className="lang-pill">
            <button
              onClick={() => setLang("EN")}
              className={`lang-option ${lang === "EN" ? "active" : ""}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("EL")}
              className={`lang-option ${lang === "EL" ? "active" : ""}`}
            >
              EL
            </button>
            <div className={`lang-slider ${lang.toLowerCase()}`} />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TopBar;
