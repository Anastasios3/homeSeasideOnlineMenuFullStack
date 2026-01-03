import React, { useState, useEffect } from "react";
import type { FC } from "react"; // Type-only import for project compliance

const TopBar: FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [lang, setLang] = useState<"EN" | "EL">("EN");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  return (
    <header className="site-header" role="banner">
      {/* Left Section: Settings/Theme Toggle */}
      <nav className="header-nav section-left" aria-label="Appearance settings">
        <button
          onClick={toggleTheme}
          className="settings-btn"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {/* Gear icon from reference image */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </nav>

      {/* Center Section: Dynamic Logo */}
      <div className="header-logo-container">
        <img
          src={theme === "light" ? "/Logo_light.svg" : "/Logo_Dark.svg"}
          alt="Home Seaside Bar & More"
          className="brand-logo"
          loading="eager"
        />
      </div>

      {/* Right Section: Language Pill Toggle */}
      <nav className="header-nav section-right" aria-label="Language selection">
        <div className="lang-pill">
          <button
            onClick={() => setLang("EN")}
            className={`lang-option ${lang === "EN" ? "active" : ""}`}
          >
            EN
          </button>
          <span className="lang-divider">/</span>
          <button
            onClick={() => setLang("EL")}
            className={`lang-option ${lang === "EL" ? "active" : ""}`}
          >
            EL
          </button>
        </div>
      </nav>
    </header>
  );
};

export default TopBar;
