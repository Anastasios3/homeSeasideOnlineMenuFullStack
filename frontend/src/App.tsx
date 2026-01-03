import React from "react";
import TopBar from "./components/TopBar";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <TopBar />
      <main id="main-content">
        <article>
          <section>
            <h2
              style={{
                textAlign: "center",
                marginTop: "2rem",
                color: "var(--color-accent-red)",
              }}
            >
              Welcome to Home Seaside
            </h2>
            {/* Menu items will load here */}
          </section>
        </article>
      </main>
    </div>
  );
};

export default App;
