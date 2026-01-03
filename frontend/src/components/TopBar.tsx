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
        {/* Left Slot: Silver Theme Toggle */}
        <div className="nav-slot slot-left">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? (
              <Moon size={18} color="#C0C0C0" strokeWidth={2.5} />
            ) : (
              <Sun size={18} color="#C0C0C0" strokeWidth={2.5} />
            )}
          </button>
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
        </div>
      </div>
    </header>
  );
};

export default TopBar;
