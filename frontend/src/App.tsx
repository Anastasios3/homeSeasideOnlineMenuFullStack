import { useState, useCallback, useEffect, type FC, type FormEvent } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import TopBar from "./components/TopBar";
import CategoryNav from "./components/CategoryNav";
import MenuSection from "./components/MenuSection";
import AdminPanel from "./components/AdminPanel";
import HomePage from "./components/HomePage";
import { Lock, ArrowLeft } from "lucide-react";
import "./App.css";

type CategoryType = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "homeseaside_admin_token";

/** Read / write / clear the JWT from sessionStorage */
export const getAdminToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);
const setAdminToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token);
const clearAdminToken = () => sessionStorage.removeItem(TOKEN_KEY);

/* ============================================================
   Footer
   ============================================================ */
const Footer: FC<{ page?: "home" | "menu" | "admin" }> = ({ page = "home" }) => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <span className="site-footer__brand">
        Home Seaside
      </span>
      <div className="site-footer__right">
        {page === "home" && (
          <Link to="/admin" className="site-footer__admin-link">
            Admin
          </Link>
        )}
        {page === "menu" && (
          <Link to="/admin" className="site-footer__admin-link">
            Admin
          </Link>
        )}
        {page === "admin" && (
          <Link to="/" className="site-footer__admin-link">
            <ArrowLeft size={12} />
            Back to Home
          </Link>
        )}
        <span className="site-footer__sep">·</span>
        <span className="site-footer__credit">
          Development by LogiQo Labs
        </span>
      </div>
    </div>
  </footer>
);

/* ============================================================
   Admin Login Gate — authenticates against backend
   ============================================================ */
const AdminGate: FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"EN" | "EL">("EN");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/admin/login`, {
        username: "admin",
        password,
      });
      setAdminToken(res.data.token);
      onAuth();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setError(language === "EN" ? "Too many attempts. Try again later." : "Πάρα πολλές προσπάθειες. Δοκιμάστε αργότερα.");
      } else {
        setError(language === "EN" ? "Incorrect password" : "Λάθος κωδικός");
      }
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container admin-layout">
      <header>
        <TopBar onLanguageChange={setLanguage} />
      </header>
      <main className="main-content">
        <div className="admin-gate">
          <div className="admin-gate__card">
            <Lock size={32} strokeWidth={1.5} style={{ color: "var(--text-tertiary)", marginBottom: "var(--sp-5)" }} />
            <h1 className="admin-gate__title">
              {language === "EN" ? "Admin Access" : "Πρόσβαση Διαχειριστή"}
            </h1>
            <p className="admin-gate__subtitle">
              {language === "EN"
                ? "Enter the password to access the admin panel"
                : "Εισάγετε τον κωδικό για πρόσβαση στο πάνελ διαχείρισης"}
            </p>
            <form className="admin-gate__form" onSubmit={handleSubmit}>
              <input
                type="password"
                className="form-input"
                placeholder={language === "EN" ? "Password" : "Κωδικός"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoFocus
                disabled={loading}
              />
              {error && (
                <span className="admin-gate__error">{error}</span>
              )}
              <button
                type="submit"
                className="btn btn--primary"
                style={{ width: "100%", padding: "var(--sp-4)" }}
                disabled={loading}
              >
                {loading
                  ? (language === "EN" ? "Signing in..." : "Σύνδεση...")
                  : (language === "EN" ? "Enter" : "Είσοδος")}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer page="admin" />
    </div>
  );
};

/* ============================================================
   Home Page (landing)
   ============================================================ */
function HomePageWrapper() {
  const [language, setLanguage] = useState<"EN" | "EL">("EN");

  return (
    <div className="app-container">
      <header>
        <TopBar onLanguageChange={setLanguage} />
      </header>
      <main>
        <HomePage language={language} />
      </main>
      <Footer page="home" />
    </div>
  );
}

/* ============================================================
   Customer Menu Page
   ============================================================ */
function CustomerMenu() {
  const [language, setLanguage] = useState<"EN" | "EL">("EN");
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);

  const handleCategoryChange = useCallback((cat: CategoryType) => {
    setActiveCategory(cat);
  }, []);

  return (
    <div className="app-container">
      <header>
        <TopBar onLanguageChange={setLanguage} />
        <CategoryNav
          currentLanguage={language}
          onCategoryChange={handleCategoryChange}
        />
      </header>
      <main className="main-content">
        <MenuSection language={language} activeCategory={activeCategory} />
      </main>
      <Footer page="menu" />
    </div>
  );
}

/* ============================================================
   Admin Page (with server-side auth)
   ============================================================ */
function AdminPage() {
  const [language, setLanguage] = useState<"EN" | "EL">("EN");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // On mount, verify existing token with the backend
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setChecking(false);
      return;
    }
    axios
      .get(`${API_URL}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setAuthenticated(true))
      .catch(() => clearAdminToken())
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (!authenticated) {
    return <AdminGate onAuth={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app-container admin-layout">
      <header>
        <TopBar onLanguageChange={setLanguage} />
      </header>
      <main className="main-content">
        <AdminPanel language={language} />
      </main>
      <Footer page="admin" />
    </div>
  );
}

/* ============================================================
   App Router
   ============================================================ */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePageWrapper />} />
        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
