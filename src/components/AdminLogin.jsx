import { useState } from "react";
import { playSound } from "./audio";
import { adminLogin, getParsedAdmins } from "../services/authService";
import Logo from "./Logo";
import ThemeSelector from "./ThemeSelector";

export default function AdminLogin({ setPage, onLogin, theme, themeKey, setThemeKey, sound }) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const allAdmins = getParsedAdmins();
  const matchedAdminByEmail = allAdmins.find(
    (a) => a.email && a.email.toLowerCase() === adminEmail.trim().toLowerCase()
  );
  const matchedAdminByUser = allAdmins.find(
    (a) => a.username && a.username.toLowerCase() === adminUsername.trim().toLowerCase()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = adminEmail.trim();
    const cleanUsername = adminUsername.trim();
    const cleanPass = adminPassword.trim();

    if (!cleanUsername && !cleanEmail) {
      setError("Please enter your Admin Username or Registered Admin Email.");
      playSound("wrong", sound);
      return;
    }

    if (!cleanPass) {
      setError("Please enter your Admin Master Password registered in .env.");
      playSound("wrong", sound);
      return;
    }

    setLoading(true);

    try {
      const result = await adminLogin(cleanEmail, cleanUsername, cleanPass);

      if (!result.success) {
        setError(result.error || "Authentication failed. Please verify credentials in .env.");
        playSound("wrong", sound);
        setLoading(false);
        return;
      }

      setSuccess(`🛡️ Authorized! Welcome to Admin Command Center (@${result.user.username}). Opening portal...`);
      playSound("correct", sound);

      setTimeout(() => {
        onLogin(result.user, true);
        setPage("admin");
      }, 700);
    } catch (err) {
      setError("Admin gateway connection error: " + err.message);
      playSound("wrong", sound);
      setLoading(false);
    }
  };

  return (
    <section className="page-width auth-page admin-login-wrapper">
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
        className="panel auth-panel admin-auth-panel"
        style={{
          borderColor: "rgba(245, 158, 11, 0.4)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45), 0 0 35px rgba(245, 158, 11, 0.15)"
        }}
      >
        <div className="auth-header">
          {/* Logo & Shield Badge */}
          <div style={{ margin: "4px auto 14px", display: "flex", justifyContent: "center", position: "relative" }}>
            <Logo size={52} theme={theme} />
            <span
              style={{
                position: "absolute",
                bottom: "-6px",
                right: "calc(50% - 38px)",
                background: "#f59e0b",
                color: "#000",
                fontSize: "14px",
                fontWeight: "900",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)"
              }}
              title="Admin Mode"
            >
              🛡️
            </span>
          </div>

          <span
            className="eyebrow"
            style={{
              color: "#f59e0b",
              borderColor: "rgba(245, 158, 11, 0.35)",
              background: "rgba(245, 158, 11, 0.08)"
            }}
          >
            RESTRICTED ACCESS · SYSTEM ADMINISTRATOR
          </span>

          <h1 style={{ color: "#fff" }}>
            Admin Portal
          </h1>
          <p>
            Enter your administrator Email, Username, and Password to access the full admin panel.
          </p>

          {/* Security Notice */}
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              fontSize: "0.78rem",
              lineHeight: "1.4",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#f59e0b"
            }}
          >
            <span>
              🔒 <strong>Protected Gateway:</strong> Access is strictly restricted to administrator credentials configured
            </span>
          </div>
        </div>

        {error && <div className="auth-alert error" role="alert">{error}</div>}
        {success && <div className="auth-alert success" role="status">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Admin Username */}
          <div className="form-group">
            <div className="label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="admin-username" style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
                <span>🛡️ Admin Username</span>
              </label>
              {matchedAdminByUser && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  ✓ .env Match (@{matchedAdminByUser.username})
                </span>
              )}
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                id="admin-username"
                type="text"
                className="has-left-icon"
                placeholder="e.g. RUPANKAR"
                value={adminUsername}
                onChange={(e) => {
                  setAdminUsername(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="username"
                disabled={loading}
                style={{ paddingRight: adminUsername ? "38px" : "14px" }}
              />
              {adminUsername && !loading && (
                <button
                  type="button"
                  className="auth-input-clear-btn"
                  onClick={() => setAdminUsername("")}
                  title="Clear username"
                  aria-label="Clear username"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Admin Email */}
          <div className="form-group admin-email-section-wrapper">
            <div className="label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="admin-email" style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
                <span>✉️ Admin Email Address</span>
              </label>
              {matchedAdminByEmail ? (
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  🛡️ .env Verified (@{matchedAdminByEmail.username})
                </span>
              ) : adminEmail.trim().length > 3 && adminEmail.includes("@") ? (
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="This email is not listed in your configured .env admin accounts"
                >
                  ⚠️ Not in .env
                </span>
              ) : null}
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input
                id="admin-email"
                type="email"
                className="has-left-icon"
                placeholder="e.g. alex@gmail.com"
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="email"
                disabled={loading}
                style={{ paddingRight: adminEmail ? "38px" : "14px" }}
              />
              {adminEmail && !loading && (
                <button
                  type="button"
                  className="auth-input-clear-btn"
                  onClick={() => setAdminEmail("")}
                  title="Clear email"
                  aria-label="Clear email"
                >
                  ✕
                </button>
              )}
            </div>
            <span style={{ fontSize: "0.73rem", opacity: 0.65, marginTop: "4px", display: "block" }}>
              💡 Enter either your Admin Username or Registered Admin Email (or both).
            </span>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="admin-password">Admin Password</label>
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="password-input-wrap">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-button login-submit-btn"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#000",
              fontWeight: "700",
              opacity: loading ? 0.75 : 1,
              cursor: loading ? "wait" : "pointer"
            }}
          >
            {loading ? "Verifying .env Credentials..." : "Authorize & Open Admin Panel (/admin)"}{" "}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="auth-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
          <button
            type="button"
            className="secondary-button"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => {
              playSound("click", sound);
              setPage("login");
            }}
          >
            ← Return to Candidate Login
          </button>
        </div>
      </div>
    </section>
  );
}
