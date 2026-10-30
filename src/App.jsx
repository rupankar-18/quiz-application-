import { useState, useEffect } from "react";
import "./App.css";
import { THEMES } from "./data";
import About from "./components/About";
import Header from "./components/Header";
import Home from "./components/Home";
import Quiz from "./components/Quiz";
import Stats from "./components/Stats";
import Login from "./components/Login";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

import { fetchCurrentUser, isConfiguredAdmin } from "./services/authService";

const getInitialPageFromUrl = () => {
  try {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
    const saved = localStorage.getItem("quiz_active_user");
    const u = saved ? JSON.parse(saved) : null;
    const userIsAdmin = u?.role === "admin" || isConfiguredAdmin(u?.username) || isConfiguredAdmin(u?.email);

    if (path === "/admin") {
      return userIsAdmin ? "admin" : "admin-login";
    }
    if (path === "/admin-login" || path === "/admin/login") {
      return userIsAdmin ? "admin" : "admin-login";
    }
    if (path === "/play" || path === "/quiz") return "play";
    if (path === "/stats") return "stats";
    if (path === "/about") return "about";
    if (path === "/login") return "login";

    if (u) {
      return userIsAdmin ? "admin" : "home";
    }
    return "login";
  } catch {
    return "login";
  }
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("quiz_active_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState(getInitialPageFromUrl);

  const isAdmin = user?.role === "admin" || isConfiguredAdmin(user?.username) || isConfiguredAdmin(user?.email);

  // Synchronize browser URL bar with current page state for /admin and all routes
  useEffect(() => {
    try {
      const pathMap = {
        home: "/",
        play: "/play",
        stats: "/stats",
        about: "/about",
        login: "/login",
        "admin-login": "/admin",
        admin: "/admin"
      };
      const targetPath = pathMap[page] || "/";
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page }, "", targetPath);
      }
    } catch {}
  }, [page]);

  // Support browser Back & Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
      if (path === "/admin" || path === "/admin-login" || path === "/admin/login") {
        setPage(isAdmin ? "admin" : "admin-login");
      } else if (path === "/play") setPage("play");
      else if (path === "/stats") setPage("stats");
      else if (path === "/about") setPage("about");
      else if (path === "/login") setPage("login");
      else setPage(user ? "home" : "login");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isAdmin, user]);

  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("quiz_selected_language") || "";
    } catch {
      return "";
    }
  });

  const [quizLaunched, setQuizLaunched] = useState(false);
  const [launchErrorNotice, setLaunchErrorNotice] = useState("");

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    if (launchErrorNotice) setLaunchErrorNotice("");
    try {
      localStorage.setItem("quiz_selected_language", lang);
    } catch {}
  };

  const handleRequireDashboard = (customMsg) => {
    setLaunchErrorNotice(
      customMsg || "Please fill up all requirements from dashboard then click on Launch for solving the questions."
    );
    setPage("home");
  };

  const [themeKey, setThemeKey] = useState(() => {
    try {
      const saved = localStorage.getItem("quiz_theme_key");
      return saved && THEMES[saved] ? saved : "slate";
    } catch {
      return "slate";
    }
  });

  const handleSetThemeKey = (key) => {
    setThemeKey(key);
    try {
      localStorage.setItem("quiz_theme_key", key);
    } catch {}
  };

  const [sound, setSound] = useState(true);
  const [maintenanceBanner, setMaintenanceBanner] = useState(() => {
    return localStorage.getItem("quiz_maintenance_mode") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setMaintenanceBanner(localStorage.getItem("quiz_maintenance_mode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogin = (userData, remember = true) => {
    setUser(userData);
    if (remember) {
      localStorage.setItem("quiz_active_user", JSON.stringify(userData));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("quiz_active_user");
    setQuizLaunched(false);
    setCategory("");
    setDifficulty("");
    setPage("login");
  };

  const theme = THEMES[themeKey] || THEMES.slate;
  const isLight = Boolean(theme.isLight);

  return (
    <div
      className={`app ${isLight ? "light-mode" : "dark-mode"}`}
      style={{
        background: theme.background,
        color: isLight ? "#0f172a" : "#f8fafc",
        "--accent": theme.accent,
        "--glow": theme.glow,
        "--card-bg": theme.cardBg,
        "--border-color": theme.border
      }}
    >
      {maintenanceBanner && page !== "admin" && (
        <div className="global-maintenance-banner">
          <span>⚠️ <strong>System Notice:</strong> Scheduled maintenance in progress. Assessment services remain operational.</span>
        </div>
      )}
      {/* Hide navigation bar on the login & admin-login pages */}
      {page !== "login" && page !== "admin-login" && (
        <Header
          page={page}
          setPage={setPage}
          theme={theme}
          themeKey={themeKey}
          setThemeKey={handleSetThemeKey}
          sound={sound}
          setSound={setSound}
          user={user}
          onLogout={handleLogout}
          language={language}
          setLanguage={handleSetLanguage}
          category={category}
          difficulty={difficulty}
          quizLaunched={quizLaunched}
          onRequireDashboard={handleRequireDashboard}
        />
      )}
      <main>
        {page === "home" && (
          <Home
            setPage={setPage}
            category={category}
            setCategory={setCategory}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            language={language}
            setLanguage={handleSetLanguage}
            theme={theme}
            sound={sound}
            user={user}
            quizLaunched={quizLaunched}
            setQuizLaunched={setQuizLaunched}
            launchErrorNotice={launchErrorNotice}
            setLaunchErrorNotice={setLaunchErrorNotice}
          />
        )}
        {page === "play" && (
          <Quiz
            category={category}
            difficulty={difficulty}
            language={language}
            theme={theme}
            sound={sound}
            setPage={setPage}
            user={user}
            quizLaunched={quizLaunched}
            setQuizLaunched={setQuizLaunched}
          />
        )}
        {page === "stats" && <Stats theme={theme} setPage={setPage} user={user} quizLaunched={quizLaunched} />}
        {page === "about" && <About theme={theme} />}

        {/* Dedicated Admin Portal Route */}
        {page === "admin" && (
          isAdmin ? (
            <AdminDashboard
              setPage={setPage}
              user={user}
              theme={theme}
              sound={sound}
            />
          ) : (
            <AdminLogin
              setPage={setPage}
              onLogin={handleLogin}
              theme={theme}
              themeKey={themeKey}
              setThemeKey={handleSetThemeKey}
              sound={sound}
            />
          )
        )}

        {/* Dedicated Admin Login Route */}
        {page === "admin-login" && (
          <AdminLogin
            setPage={setPage}
            onLogin={handleLogin}
            theme={theme}
            themeKey={themeKey}
            setThemeKey={handleSetThemeKey}
            sound={sound}
          />
        )}

        {page === "login" && (
          <Login
            setPage={setPage}
            onLogin={handleLogin}
            onLogout={handleLogout}
            theme={theme}
            themeKey={themeKey}
            setThemeKey={handleSetThemeKey}
            sound={sound}
            setSound={setSound}
            user={user}
          />
        )}
      </main>
    </div>
  );
}


