import { useState } from "react";
import TopBar from "./components/TopBar";
import CategoryNav from "./components/CategoryNav";
import "./App.css";

function App() {
  // Centralized language state - syncs TopBar and CategoryNav
  const [language, setLanguage] = useState<"EN" | "EL">("EN");

  return (
    <div className="app-container">
      {/* Semantic header contains both fixed navigation elements */}
      <header>
        {/* TopBar: Fixed at top, manages theme internally, notifies parent of language changes */}
        <TopBar onLanguageChange={setLanguage} />

        {/* CategoryNav: Fixed under TopBar (desktop) or at bottom (mobile), receives language */}
        <CategoryNav currentLanguage={language} />
      </header>

      {/* Main content area - automatically offset by fixed header/nav via CSS */}
      <main className="main-content">
        {/* Your menu components go here */}
        {/* Pass language prop to child components that need translations */}
        {/* Example: <MenuSection language={language} category="coffee" /> */}
      </main>
    </div>
  );
}

export default App;
