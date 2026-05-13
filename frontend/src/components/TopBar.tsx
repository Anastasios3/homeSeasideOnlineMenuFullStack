import { useState, useEffect } from "react";
import type { FC } from "react";
import { Sun, Moon, Clock } from "lucide-react";
import { useTimeOfDay } from "../hooks/useTimeOfDay";
import "../styles/TopBar.css";

interface TopBarProps {
  onLanguageChange?: (lang: "EN" | "EL") => void;
}

const TopBar: FC<TopBarProps> = ({ onLanguageChange }) => {
  const { theme, override, setOverride } = useTimeOfDay();
  const [lang, setLang] = useState<"EN" | "EL">("EN");

  // Single source of truth: reflect the resolved theme on <html data-theme>.
  // The pre-hydration script in index.html already sets the right value, so
  // this only mutates when the user toggles or when the phase boundary fires.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    onLanguageChange?.(lang);
  }, [lang, onLanguageChange]);

  const isAuto = override === "auto";

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        {/* Theme toggle — three modes: Light / Auto / Dark. Auto follows the
            day-phase schedule. Light/Dark pin the theme via localStorage. */}
        <div className="header-slot header-slot-left">
          <div className="pill-toggle pill-toggle--three" role="radiogroup" aria-label="Theme">
            <button
              role="radio"
              aria-checked={override === "light"}
              onClick={() => setOverride("light")}
              className={`pill-toggle__option ${override === "light" ? "pill-toggle__option--active" : ""}`}
              aria-label="Light mode"
            >
              <Sun size={14} strokeWidth={2.5} />
            </button>
            <button
              role="radio"
              aria-checked={isAuto}
              onClick={() => setOverride("auto")}
              className={`pill-toggle__option ${isAuto ? "pill-toggle__option--active" : ""}`}
              aria-label={`Auto theme (follows time of day, currently ${theme})`}
              title="Follows time of day"
            >
              <Clock size={14} strokeWidth={2.5} />
            </button>
            <button
              role="radio"
              aria-checked={override === "dark"}
              onClick={() => setOverride("dark")}
              className={`pill-toggle__option ${override === "dark" ? "pill-toggle__option--active" : ""}`}
              aria-label="Dark mode"
            >
              <Moon size={14} strokeWidth={2.5} />
            </button>
            <div
              className={`pill-toggle__indicator pill-toggle__indicator--3 pill-toggle__indicator--${
                override === "light" ? "pos-1" : override === "dark" ? "pos-3" : "pos-2"
              }`}
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
