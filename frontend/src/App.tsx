import { useState, useCallback, useEffect, type FC, type FormEvent } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import TopBar from "./components/TopBar";
import CategoryNav from "./components/CategoryNav";
import MenuSection from "./components/MenuSection";
import AdminPanel from "./components/AdminPanel";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import CategoryLanding from "./components/CategoryLanding";
import VisitPage from "./components/VisitPage";
import { Lock, ArrowLeft, Instagram } from "lucide-react";
import { useDocumentMeta } from "./seo";
import "./App.css";

type CategoryType = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";

import { getAdminToken, setAdminToken, clearAdminToken } from "./auth";
import { loadScheduleFromServer } from "./config/schedule";
import { loadSubcategoriesFromServer } from "./config/subcategories";
import { loadHomepagePhotosFromServer } from "./config/homepagePhotos";
import { instagramUrl, loadSiteContentFromServer } from "./config/siteContent";
import { useSiteContent } from "./hooks/useSiteContent";
import { API_URL } from "./config/api";


/* ============================================================
   Footer
   ============================================================ */
const Footer: FC<{ page?: "home" | "menu" | "admin" }> = ({ page = "home" }) => {
  const { venue } = useSiteContent();
  return (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <span className="site-footer__brand">Home Seaside · Rethymno</span>
      <div className="site-footer__right">
        <Link to="/about" className="site-footer__admin-link">About</Link>
        <span className="site-footer__sep">·</span>
        <Link to="/menu" className="site-footer__admin-link">Menu</Link>
        <span className="site-footer__sep">·</span>
        <a
          href={instagramUrl(venue.instagramHandle)}
          target="_blank"
          rel="noopener noreferrer"
          className="site-footer__admin-link"
          aria-label="Home Seaside on Instagram"
        >
          <Instagram size={12} />
          {venue.instagramHandle}
        </a>
        <span className="site-footer__sep">·</span>
        {page === "admin" ? (
          <Link to="/" className="site-footer__admin-link">
            <ArrowLeft size={12} />
            Back to Home
          </Link>
        ) : (
          <Link to="/admin" className="site-footer__admin-link">
            Admin
          </Link>
        )}
        <span className="site-footer__sep">·</span>
        <span className="site-footer__credit">Development by LogiQo Labs</span>
      </div>
    </div>
  </footer>
  );
};

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

  useDocumentMeta({
    title: language === "EN"
      ? "Menu — Home Seaside Bar & More, Rethymno"
      : "Μενού — Home Seaside Bar & More, Ρέθυμνο",
    description: language === "EN"
      ? "Full menu at Home Seaside in Rethymno — specialty coffee, advanced cocktails, an extensive rum selection, cold beers, quality wines, and comfort food."
      : "Πλήρες μενού στο Home Seaside στο Ρέθυμνο — specialty καφές, εξελιγμένα cocktails, μεγάλη συλλογή ρουμιού, μπύρες, ποιοτικά κρασιά και comfort φαγητό.",
    canonicalPath: "/menu",
  });

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
  // null = still verifying, false = no/invalid token, true = authenticated.
  const [authenticated, setAuthenticated] = useState<boolean | null>(() =>
    getAdminToken() ? null : false
  );

  useDocumentMeta({
    title: "Admin — Home Seaside",
    description: "Internal admin panel for Home Seaside Bar & More.",
    canonicalPath: "/admin",
    noindex: true,
  });

  // On mount, verify existing token with the backend (only when we have one).
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    axios
      .get(`${API_URL}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setAuthenticated(true))
      .catch(() => {
        clearAdminToken();
        setAuthenticated(false);
      });
  }, []);

  if (authenticated === null) return null;

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

/* ============================================================
   Content-page wrappers — pulls language state from a wrapper
   so AboutPage/CategoryLanding/VisitPage can stay stateless.
   ============================================================ */
function AboutPageWrapper() {
  const [language, setLanguage] = useState<"EN" | "EL">("EN");
  return (
    <div className="app-container">
      <header>
        <TopBar onLanguageChange={setLanguage} />
      </header>
      <main className="main-content">
        <AboutPage language={language} />
      </main>
      <Footer page="home" />
    </div>
  );
}

function CategoryLandingWrapper() {
  const { category } = useParams<{ category: string }>();
  const [language, setLanguage] = useState<"EN" | "EL">("EN");
  return (
    <div className="app-container">
      <header>
        <TopBar onLanguageChange={setLanguage} />
      </header>
      <main className="main-content">
        <CategoryLanding language={language} category={category ?? ""} />
      </main>
      <Footer page="menu" />
    </div>
  );
}

function VisitPageWrapper() {
  const [language, setLanguage] = useState<"EN" | "EL">("EN");
  return (
    <div className="app-container">
      <header>
        <TopBar onLanguageChange={setLanguage} />
      </header>
      <main className="main-content">
        <VisitPage language={language} />
      </main>
      <Footer page="home" />
    </div>
  );
}

function App() {
  // Hydrate cached schedule + subcategory overrides from the server once at
  // app boot. Subsequent changes flow through StorageEvent + in-memory cache.
  useEffect(() => {
    loadScheduleFromServer();
    loadSubcategoriesFromServer();
    loadHomepagePhotosFromServer();
    loadSiteContentFromServer();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePageWrapper />} />
        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/menu/:category" element={<CategoryLandingWrapper />} />
        <Route path="/about" element={<AboutPageWrapper />} />
        <Route path="/visit" element={<VisitPageWrapper />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
