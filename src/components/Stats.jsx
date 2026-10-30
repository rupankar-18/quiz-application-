import { useState, useEffect } from "react";
import { getUserCertificateStatus } from "../services/certificateEligibility";

export default function Stats({ theme, setPage, user, quizLaunched }) {
  const [activeUser, setActiveUser] = useState(user);
  const [history, setHistory] = useState(() => {
    const local = JSON.parse(localStorage.getItem("quiz_history") || "[]");
    if (local.length > 0) return local.reverse();
    if (user?.quizHistory && user.quizHistory.length > 0) {
      return [...user.quizHistory].map((h) => ({
        date: new Date(h.date).toLocaleDateString(),
        score: h.score,
        accuracy: h.accuracy,
        category: h.category,
        difficulty: h.difficulty,
        bestStreak: h.bestStreak || 0,
        user: user.name
      })).reverse();
    }
    return [];
  });

  useEffect(() => {
    setActiveUser(user);
  }, [user]);

  const clearHistory = () => {
    localStorage.removeItem("quiz_history");
    localStorage.removeItem("quiz_active_user");
    setHistory([]);
    if (user) {
      const refreshedUser = { ...user, quizHistory: [] };
      setActiveUser(refreshedUser);
      localStorage.setItem("quiz_active_user", JSON.stringify(refreshedUser));
    } else {
      setActiveUser(null);
    }
  };
  const certificateStatus = getUserCertificateStatus(activeUser);
  const certificate = certificateStatus.certificate;
  const isEligibleForCertificate = Boolean(certificateStatus.qualifies);

  const handleDownloadCertificate = () => {
    if (!isEligibleForCertificate) return;

    const html = `
      <html>
        <head><title>QuizPulse Certificate</title>
          <style>
            body { font-family: Arial, sans-serif; background: #0b1220; color: #f4f4f5; padding: 40px; }
            .card { border: 2px solid #f59e0b; border-radius: 18px; background: linear-gradient(135deg, #0b1220, #111827); padding: 32px; max-width: 860px; margin: 0 auto; text-align: center; }
            .badge { letter-spacing: 4px; font-size: 12px; opacity: 0.8; }
            h1 { color: #fbbf24; margin: 16px 0 8px; }
            h2 { font-size: 2.4rem; margin-bottom: 12px; }
            p { line-height: 1.7; }
            .pill { display: inline-block; border: 1px solid rgba(245,158,11,0.6); border-radius: 999px; padding: 8px 14px; margin: 10px 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">QUIZPULSE</div>
            <h1>Certificate of Multi-Stream Achievement</h1>
            <p>This certifies that</p>
            <h2>${user ? user.name : "Candidate"}</h2>
            <p>successfully completed ${certificateStatus.uniqueCategories.length} different assessment streams and achieved an overall average accuracy of <strong>${certificateStatus.overallAccuracy}%</strong>.</p>
            <div>
              ${certificateStatus.uniqueCategories.map((stream) => `<span class="pill">${stream}</span>`).join("")}
            </div>
            <p>Certificate ID: ${certificate.id} · Issued: ${new Date(certificate.issuedAt).toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(user ? user.name : "quizpulse-candidate").replace(/\s+/g, "-").toLowerCase()}-certificate.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page-width">
      <div className="panel stats-panel" style={{ borderColor: theme.border }}>
        <div className="section-heading">
          <div>
            <h1>Performance history</h1>
            <p>
              {user
                ? `Saved scores, streaks, and accuracy metrics for ${user.name}.`
                : "Your saved scores and accuracy metrics."}
            </p>
          </div>
          {history.length > 0 && <button className="clear-button" onClick={clearHistory}>Clear history</button>}
        </div>

        <div
          className="panel"
          style={{
            background: isEligibleForCertificate ? "linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(16, 185, 129, 0.08))" : "rgba(148, 163, 184, 0.06)",
            border: `1px solid ${isEligibleForCertificate ? "rgba(245, 158, 11, 0.45)" : theme.border}`,
            borderRadius: "14px",
            padding: "18px 20px",
            marginBottom: "24px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", fontSize: "1.1rem" }}>
                {isEligibleForCertificate ? "🎓 Certificate unlocked" : "📜 Certificate requirement"}
              </strong>
              <span style={{ opacity: 0.8 }}>
                {isEligibleForCertificate
                  ? `Your certificate is ready for ${certificateStatus.uniqueCategories.join(", ")} with ${certificateStatus.overallAccuracy}% overall accuracy.`
                  : `Progress: ${certificateStatus.uniqueCategories.length}/${certificateStatus.requiredCategories} distinct streams completed. Overall accuracy: ${certificateStatus.overallAccuracy}% / 55%`}
              </span>
            </div>
            {isEligibleForCertificate ? (
              <button
                className="primary-button"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", fontWeight: 700 }}
                onClick={handleDownloadCertificate}
              >
                Download Certificate
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="secondary-button"
                  onClick={() => setPage(quizLaunched ? "play" : "home")}
                >
                  Try Again
                </button>
                <button
                  className="clear-button"
                  onClick={clearHistory}
                >
                  Clear Progress
                </button>
              </div>
            )}
          </div>
        </div>

        {isEligibleForCertificate ? (
          <div
            id="printable-user-certificate"
            style={{
              background: "linear-gradient(135deg, #0b1220, #111827)",
              border: "2px solid rgba(245, 158, 11, 0.8)",
              borderRadius: "18px",
              padding: "28px",
              marginBottom: "28px",
              boxShadow: "0 30px 70px rgba(0,0,0,0.28)"
            }}
          >
            <div style={{ textAlign: "center", border: "1px solid rgba(245, 158, 11, 0.5)", borderRadius: "12px", padding: "18px" }}>
              <div style={{ fontSize: "0.75rem", letterSpacing: "0.24rem", opacity: 0.8 }}>QUIZPULSE</div>
              <h2 style={{ margin: "12px 0 8px", fontSize: "2rem", color: "#fbbf24" }}>Certificate of Multi-Stream Achievement</h2>
              <p style={{ margin: "0 0 10px", opacity: 0.8 }}>This certifies that</p>
              <h3 style={{ margin: 0, fontSize: "2.2rem" }}>{user ? user.name : "Candidate"}</h3>
              <p style={{ margin: "18px 0 12px", lineHeight: 1.7 }}>
                successfully completed {certificateStatus.uniqueCategories.length} different assessment streams and achieved an overall average accuracy of <strong>{certificateStatus.overallAccuracy}%</strong>.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                {certificateStatus.uniqueCategories.map((stream) => (
                  <span
                    key={stream}
                    style={{
                      border: "1px solid rgba(245, 158, 11, 0.6)",
                      borderRadius: "999px",
                      padding: "8px 12px",
                      fontSize: "0.85rem"
                    }}
                  >
                    {stream}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: "22px", opacity: 0.8, fontSize: "0.82rem" }}>
                Certificate ID: {(certificate?.id) || `QP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`} · Issued: {new Date((certificate?.issuedAt) || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="panel"
            style={{
              border: "1px solid rgba(148, 163, 184, 0.4)",
              borderRadius: "14px",
              padding: "22px 20px",
              textAlign: "center",
              background: "rgba(148, 163, 184, 0.05)"
            }}
          >
            <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>📚</div>
            <h3 style={{ margin: "0 0 8px" }}>Try again for your certificate</h3>
            <p style={{ margin: "0 0 18px", opacity: 0.8 }}>
              You need 3 different streams with an average of at least 55% to unlock the certificate.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              <button className="secondary-button" onClick={() => setPage(quizLaunched ? "play" : "home")}>Try another chance</button>
              <button className="clear-button" onClick={clearHistory}>Clear progress</button>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="empty">
            <strong>Ready when you are.</strong>
            <p>Complete your dashboard setup to launch your first assessment.</p>
            <button
              className="primary-button"
              style={{ background: theme.accent }}
              onClick={() => setPage(quizLaunched ? "play" : "home")}
            >
              {quizLaunched ? "Resume Assessment" : "Launch from Dashboard"}
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <div className="history-item" key={`${item.date}-${index}`}>
                <div>
                  <strong>{item.category} quiz <small>({item.difficulty})</small></strong>
                  <span>
                    {item.user && <em style={{ fontStyle: "normal", color: theme.accent }}>{item.user} · </em>}
                    Played {item.date} · Best streak {item.bestStreak}
                  </span>
                </div>
                <div>
                  <strong style={{ color: theme.accent }}>{item.score} pts</strong>
                  <span style={{ color: "#10b981" }}>{item.accuracy}% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

