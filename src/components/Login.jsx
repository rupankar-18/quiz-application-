import { useState, useEffect } from "react";
import { playSound } from "./audio";
import { loginUser, registerUser, checkDbStatus, isConfiguredAdmin } from "../services/authService";
import Logo from "./Logo";
import ThemeSelector from "./ThemeSelector";

export default function Login({ setPage, onLogin, onLogout, theme, themeKey, setThemeKey, sound, setSound, user }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState({ connected: false, checked: false });

  useEffect(() => {
    let mounted = true;
    checkDbStatus().then((status) => {
      if (mounted) {
        setDbStatus({ ...status, checked: true });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedPassword = password.trim();

    if (!trimmedPassword || trimmedPassword.length < 4) {
      setError("Password must be at least 4 characters long.");
      playSound("wrong", sound);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const trimmedName = name.trim();
        const trimmedUser = signupUsername.trim().toLowerCase();
        const trimmedEmail = signupEmail.trim().toLowerCase();

        if (!trimmedName) {
          setError("Please enter your full name.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        if (!trimmedUser) {
          setError("Please choose a username.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
          setError("Please enter a valid email address (e.g. candidate@example.com).");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        if (isConfiguredAdmin(trimmedUser) || isConfiguredAdmin(trimmedEmail)) {
          setError("This username or email is reserved for administrators and cannot be registered in normal user signup.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        const result = await registerUser(
          trimmedName,
          { username: trimmedUser, email: trimmedEmail },
          trimmedPassword
        );

        if (!result.success) {
          setError(result.error || "Failed to create account.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        if (result.isOffline) {
          setSuccess("⚠️ Stored in local fallback: Supabase is offline or unconfigured. Logging you in...");
        } else {
          setSuccess("🎉 Account created & stored in Supabase! Logging you in...");
        }
        playSound("correct", sound);

        setTimeout(() => {
          onLogin(result.user, rememberMe);
          setPage("home");
        }, 750);
      } else {
        const trimmedIdentifier = emailOrUser.trim();
        if (!trimmedIdentifier) {
          setError("Please enter your username or email.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        const lowerId = trimmedIdentifier.toLowerCase();

        // STRICT CHECK: Reject administrator credentials from normal candidate login
        // Behaves like invalid credentials so no admin presence is disclosed
        if (isConfiguredAdmin(lowerId)) {
          setError("Invalid username/email or password.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        // Sign-in / Re-login mode (Candidates only)
        const result = await loginUser(trimmedIdentifier, trimmedPassword);

        if (!result.success) {
          setError(result.error || "Invalid username/email or password.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        const authenticatedUser = result.user;

        // Ensure no admin account can sign in through normal candidate login
        if (authenticatedUser.role === "admin") {
          setError("Invalid username/email or password.");
          playSound("wrong", sound);
          setLoading(false);
          return;
        }

        setSuccess(
          result.isOffline
            ? `Welcome back, ${authenticatedUser.name}! (Offline Session)`
            : `Welcome back, ${authenticatedUser.name}! (Authenticated via Supabase)`
        );
        playSound("correct", sound);

        setTimeout(() => {
          onLogin(authenticatedUser, rememberMe);
          setPage("home");
        }, 550);
      }
    } catch (err) {
      setError("Connection error: " + err.message);
      playSound("wrong", sound);
      setLoading(false);
    }
  };

  // Active Logged In View
  if (user) {
    const envAdminUser = import.meta.env.VITE_ADMIN_USERNAME ? import.meta.env.VITE_ADMIN_USERNAME.trim().toLowerCase() : "";
    const isAdmin = user.role === "admin" || (envAdminUser && user.username?.toLowerCase() === envAdminUser);
    const gamesPlayed = user.stats?.gamesPlayed || user.quizHistory?.length || 0;
    const highScore = user.stats?.highScore || 0;

    return (
      <section className="page-width auth-page">
        <div
          className="panel auth-panel"
          style={{
            borderColor: theme.border,
            boxShadow: `0 24px 60px rgba(0,0,0,.35), 0 0 40px ${theme.glow}`
          }}
        >
          <div className="auth-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "10px" }}>
              <span className="eyebrow" style={{ color: theme.accent, borderColor: theme.border }}>
                {isAdmin ? "🛡️ Administrator Profile" : "Active Profile"}
              </span>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  background: dbStatus.connected ? "rgba(16, 185, 129, 0.15)" : "rgba(234, 179, 8, 0.15)",
                  color: dbStatus.connected ? "#10b981" : "#eab308",
                  border: `1px solid ${dbStatus.connected ? "rgba(16, 185, 129, 0.3)" : "rgba(234, 179, 8, 0.3)"}`
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: dbStatus.connected ? "#10b981" : "#eab308",
                    display: "inline-block"
                  }}
                />
                <span>{dbStatus.connected ? "Supabase Live" : "Supabase Standby"}</span>
              </div>
            </div>

            <div
              className="auth-avatar"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, #ec4899)`,
                marginTop: "10px"
              }}
            >
              {user.avatar || user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h1>Welcome, {user.name}!</h1>
            <p>
              Signed in as <strong>{user.email || `@${user.username}`}</strong>{" "}
              {isAdmin && <span className="admin-badge-inline">ADMIN</span>}
            </p>

            {/* Quick Stats Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                width: "100%",
                marginTop: "16px",
                padding: "12px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${theme.border}`
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.75, display: "block" }}>Games Played</span>
                <strong style={{ fontSize: "1.2rem", color: theme.accent }}>{gamesPlayed}</strong>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.75, display: "block" }}>High Score</span>
                <strong style={{ fontSize: "1.2rem", color: "#10b981" }}>{highScore}</strong>
              </div>
            </div>
          </div>

          <div className="action-row" style={{ marginTop: "24px", justifyContent: "center", flexWrap: "wrap", gap: "10px" }}>
            {isAdmin && (
              <button
                className="primary-button admin-hero-btn"
                style={{ background: theme.accent }}
                onClick={() => setPage("admin")}
              >
                🛡️ Open Admin Portal <span>→</span>
              </button>
            )}
            <button
              className={isAdmin ? "secondary-button" : "primary-button"}
              style={!isAdmin ? { background: theme.accent } : {}}
              onClick={() => setPage("home")}
            >
              Start Assessment <span>→</span>
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                playSound("click", sound);
                onLogout();
              }}
            >
              Switch Account
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Sign In / Sign Up Form View
  return (
    <section className="page-width auth-page">
      {/* Standalone Theme Bar for Login View */}
      <div className="login-standalone-tools">
        {setThemeKey && (
          <ThemeSelector
            themeKey={themeKey}
            setThemeKey={setThemeKey}
            theme={theme}
            align="right"
          />
        )}
      </div>

      <div
        className="panel auth-panel"
        style={{
          borderColor: theme.border,
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.25)"
        }}
      >
        <div className="auth-header">
          {/* Brand Logo & Title */}
          <div style={{ margin: "4px auto 14px", display: "flex", justifyContent: "center" }}>
            <Logo size={52} theme={theme} />
          </div>

          <span className="eyebrow" style={{ color: theme.accent, borderColor: theme.border }}>
            Standardized Assessment System
          </span>

          <h1>{isSignUp ? "Create Candidate Account" : "Sign In to QuizPulse"}</h1>
          <p>
            {isSignUp
              ? "Register your candidate profile to configure and launch real-time assessments."
              : "Enter your credentials to access your testing dashboard and performance records."}
          </p>

          {/* Segmented Auth Mode Switcher */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignUp}
              className={`auth-tab-btn ${!isSignUp ? "active" : ""}`}
              style={!isSignUp ? { background: theme.accent, color: "#ffffff" } : {}}
              onClick={() => {
                setIsSignUp(false);
                setError("");
                setSuccess("");
              }}
            >
              🔐 Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignUp}
              className={`auth-tab-btn ${isSignUp ? "active" : ""}`}
              style={isSignUp ? { background: theme.accent, color: "#ffffff" } : {}}
              onClick={() => {
                setIsSignUp(true);
                setError("");
                setSuccess("");
              }}
            >
              📝 Create Account
            </button>
          </div>

          {/* Supabase Live Status Indicator */}
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                background: dbStatus.connected ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: dbStatus.connected ? "#10b981" : "#f87171",
                border: `1px solid ${dbStatus.connected ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
              }}
              title={dbStatus.connected ? "Connected to Supabase PostgreSQL Database" : (dbStatus.error || "Supabase database offline or credentials unconfigured")}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: dbStatus.connected ? "#10b981" : "#ef4444",
                  display: "inline-block",
                  boxShadow: dbStatus.connected ? "0 0 6px #10b981" : "0 0 6px #ef4444"
                }}
              />
              <span>
                {dbStatus.connected
                  ? "Supabase: Online"
                  : "Supabase: Standby (Local Fallback Ready)"}
              </span>
            </div>

            {!dbStatus.connected && dbStatus.checked && (
              <div
                style={{
                  margin: "10px auto 0",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  color: "#3b82f6",
                  fontSize: "0.72rem",
                  maxWidth: "380px",
                  textAlign: "center",
                  lineHeight: "1.4"
                }}
              >
                ⚡ Supabase database mode active. Configure <code>SUPABASE_URL</code> & <code>SUPABASE_KEY</code> in <code>.env</code>. Local fallback active!
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="auth-alert error" role="alert">
            <div>{error}</div>
          </div>
        )}
        {success && <div className="auth-alert success" role="status">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isSignUp ? (
            <>
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="auth-name">Full Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="auth-name"
                    type="text"
                    className="has-left-icon"
                    placeholder="e.g. Alex Smith"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError("");
                    }}
                    autoComplete="name"
                    disabled={loading}
                    required
                  />
                  {name && !loading && (
                    <button
                      type="button"
                      className="auth-input-clear-btn"
                      onClick={() => setName("")}
                      title="Clear name"
                      aria-label="Clear name"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="form-group">
                <div className="label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="auth-username">Username</label>
                  {signupUsername.trim() && isConfiguredAdmin(signupUsername.trim()) && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        fontWeight: "600"
                      }}
                    >
                      ⚠️ Reserved for Admin
                    </span>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">@</span>
                  <input
                    id="auth-username"
                    type="text"
                    className="has-left-icon"
                    placeholder="Choose a username (e.g. alex24)"
                    value={signupUsername}
                    onChange={(e) => {
                      setSignupUsername(e.target.value);
                      if (error) setError("");
                    }}
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                  {signupUsername && !loading && (
                    <button
                      type="button"
                      className="auth-input-clear-btn"
                      onClick={() => setSignupUsername("")}
                      title="Clear username"
                      aria-label="Clear username"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <div className="label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="auth-email">Email Address</label>
                  {signupEmail.trim() ? (
                    isConfiguredAdmin(signupEmail.trim()) ? (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          fontWeight: "600"
                        }}
                      >
                        ⚠️ Reserved for Admin
                      </span>
                    ) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim()) ? (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          fontWeight: "600"
                        }}
                      >
                        ✓ Valid Email
                      </span>
                    ) : signupEmail.trim().length > 3 ? (
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        Format: name@domain.com
                      </span>
                    ) : null
                  ) : null}
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">✉️</span>
                  <input
                    id="auth-email"
                    type="email"
                    className="has-left-icon"
                    placeholder="e.g. alex@example.com"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      if (error) setError("");
                    }}
                    autoComplete="email"
                    disabled={loading}
                    style={{ paddingRight: signupEmail ? "38px" : "14px" }}
                    required
                  />
                  {signupEmail && !loading && (
                    <button
                      type="button"
                      className="auth-input-clear-btn"
                      onClick={() => setSignupEmail("")}
                      title="Clear email"
                      aria-label="Clear email"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="auth-identifier">Username or Email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="auth-identifier"
                  type="text"
                  className="has-left-icon"
                  placeholder="Enter username or email (e.g. alex)"
                  value={emailOrUser}
                  onChange={(e) => {
                    setEmailOrUser(e.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="username"
                  disabled={loading}
                  style={{ paddingRight: emailOrUser ? "38px" : "14px" }}
                  required
                />
                {emailOrUser && !loading && (
                  <button
                    type="button"
                    className="auth-input-clear-btn"
                    onClick={() => setEmailOrUser("")}
                    title="Clear identifier"
                    aria-label="Clear identifier"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="auth-password">Password</label>
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="has-left-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={loading}
                style={{ paddingRight: "38px" }}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            className="primary-button login-submit-btn"
            disabled={loading}
            style={{
              background: theme.accent,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? "wait" : "pointer"
            }}
          >
            {loading ? "Authenticating..." : isSignUp ? "Create Account & Continue" : "Sign In to Dashboard"}{" "}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="auth-footer">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="switch-mode-btn"
                style={{ color: theme.accent }}
                disabled={loading}
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New candidate?{" "}
              <button
                type="button"
                className="switch-mode-btn"
                style={{ color: theme.accent }}
                disabled={loading}
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                  setSuccess("");
                }}
              >
                Create Account
              </button>
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
