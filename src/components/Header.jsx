import { playSound } from "./audio";
import { THEMES } from "../data";
import { LANGUAGES } from "../languages";
import Logo from "./Logo";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";
import SoundToggle from "./SoundToggle";
import { isConfiguredAdmin } from "../services/authService";

export default function Header({
  page,
  setPage,
  theme,
  themeKey,
  setThemeKey,
  sound,
  setSound,
  user,
  onLogout,
  language = "",
  setLanguage,
  category,
  difficulty,
  quizLaunched,
  onRequireDashboard
}) {
  const isAdmin = user?.role === "admin" || isConfiguredAdmin(user?.username) || isConfiguredAdmin(user?.email);
  const hasAllRequirements = Boolean(quizLaunched && category && difficulty && language);

  return (
    <header className="topbar" style={{ borderColor: theme.border }}>
      <button className="brand" onClick={() => setPage(user ? (isAdmin ? "admin" : "home") : "login")} aria-label="QuizPulse Home">
        <Logo theme={theme} size={38} />
        <span className="brand-text-wrap">
          <strong>Quiz<span className="brand-pulse-text" style={{ color: theme.accent }}>Pulse</span><span className="brand-live-dot" style={{ background: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }} /></strong>
          <small>ASSESSMENT PLATFORM</small>
        </span>
      </button>

      <nav>
        {[
          ["home", "Dashboard"],
          ["play", "Assessment"],
          ["stats", "Performance"],
          ["stats", "Certificates"],
          ["about", "Overview"]
        ].map(([id, label]) => {
          const isAssessmentLocked = id === "play" && !hasAllRequirements;
          const isCertificatesLink = label === "Certificates";
          return (
            <button
              className={page === id ? "nav-link active" : "nav-link"}
              key={`${id}-${label}`}
              title={isAssessmentLocked ? "Complete requirements in Dashboard first" : label}
              onClick={() => {
                playSound("click", sound);
                if (!user && id !== "about") {
                  setPage("login");
                } else if (isAssessmentLocked) {
                  if (onRequireDashboard) {
                    onRequireDashboard("Please fill up all requirements from dashboard then click on Launch for solving the questions.");
                  } else {
                    setPage("home");
                  }
                } else {
                  setPage(id);
                }
              }}
            >
              {label}
              {isAssessmentLocked && (
                <span className="nav-lock-badge" title="Fill requirements in dashboard">🔒</span>
              )}
              {isCertificatesLink && (
                <span className="nav-lock-badge" title="Certificate unlocks after 3 streams at 65%">🎓</span>
              )}
            </button>
          );
        })}
        {isAdmin && (
          <button
            className={page === "admin" ? "nav-link admin-nav-link active" : "nav-link admin-nav-link"}
            onClick={() => {
              playSound("click", sound);
              setPage("admin");
            }}
          >
            🛡️ Admin Control
          </button>
        )}
      </nav>

      <div className="header-tools">
        {setLanguage && (
          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            sound={sound}
            align="right"
          />
        )}

        {setSound && (
          <SoundToggle sound={sound} setSound={setSound} theme={theme} />
        )}

        <ThemeSelector
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          theme={theme}
          align="right"
        />

        {user ? (
          <div className="user-profile-badge" title={`Signed in as ${user.name} (${user.email})`}>
            <span
              className="user-avatar"
              style={{ background: theme.accent }}
            >
              {user.avatar || user.name.charAt(0).toUpperCase()}
            </span>
            <span className="user-name">
              {user.name.split(" ")[0]}
              {isAdmin && <span className="header-admin-pill">ADMIN</span>}
            </span>
            <button
              className="logout-btn"
              title="Sign Out"
              onClick={() => {
                playSound("click", sound);
                onLogout();
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            className={page === "login" ? "auth-nav-button active" : "auth-nav-button"}
            style={{
              borderColor: theme.accent,
              background: theme.accent,
              color: "#fff"
            }}
            onClick={() => {
              playSound("click", sound);
              setPage("login");
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

