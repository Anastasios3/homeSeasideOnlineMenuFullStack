import React, { useState, useEffect } from "react";

const TopBar: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"EN" | "GR">("EN");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleLang = () => setLang((prev) => (prev === "EN" ? "GR" : "EN"));

  return (
    <header className="top-bar" role="banner">
      <nav className="nav-left" aria-label="Theme Toggle">
        <button
          onClick={toggleTheme}
          className="icon-btn"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </nav>

      <div className="logo-container">
        <h1 style={{ margin: 0 }}>
          {/* Using placeholder for HOME_LOGO.pdf; Replace 'src' when asset is ready */}
          <img
            src="/logo.svg"
            alt="Home Seaside - Seaside Dining Menu"
            loading="eager"
          />
        </h1>
      </div>

      <nav className="nav-right" aria-label="Language Selector">
        <button
          onClick={toggleLang}
          className="icon-btn"
          aria-label="Change language"
        >
          {lang}
        </button>
      </nav>
    </header>
  );
};

export default TopBar;
