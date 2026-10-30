import { useState, useEffect } from "react";
import { DIFFICULTIES } from "../data";
import { STREAMS } from "../api";
import { playSound } from "./audio";
import { LANGUAGES, getLanguage, getUIText } from "../languages";

export default function Home({
  setPage,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  language = "",
  setLanguage,
  theme,
  sound,
  user,
  quizLaunched,
  setQuizLaunched,
  launchErrorNotice,
  setLaunchErrorNotice
}) {
  const [localError, setLocalError] = useState("");
  const [highlightMissing, setHighlightMissing] = useState(false);

  const hasLanguage = Boolean(language);
  const hasCategory = Boolean(category);
  const hasDifficulty = Boolean(difficulty);
  const hasAllRequirements = hasLanguage && hasCategory && hasDifficulty;
  const selectedCount = [hasLanguage, hasCategory, hasDifficulty].filter(Boolean).length;

  const activeStream = STREAMS.find((s) => s.id === category) || null;
  const activeLang = hasLanguage ? getLanguage(language) : getLanguage("en");

  const effectiveError = launchErrorNotice || localError;

  // Clear highlight when all requirements become satisfied
  useEffect(() => {
    if (hasAllRequirements) {
      setLocalError("");
      if (setLaunchErrorNotice) setLaunchErrorNotice("");
      setHighlightMissing(false);
    }
  }, [hasAllRequirements, setLaunchErrorNotice]);

  const handleLaunchAssessment = () => {
    if (!hasAllRequirements) {
      const missing = [];
      if (!hasLanguage) missing.push("Quiz Language");
      if (!hasCategory) missing.push("Subject Stream");
      if (!hasDifficulty) missing.push("Difficulty Tier");

      const msg = `Please fill up all requirements from dashboard then click on Launch for solving the questions. (Missing: ${missing.join(", ")})`;
      setLocalError(msg);
      if (setLaunchErrorNotice) setLaunchErrorNotice(msg);
      setHighlightMissing(true);
      playSound("wrong", sound);

      // Smooth scroll to the first missing requirement section
      const targetId = !hasLanguage
        ? "setup-language-section"
        : !hasCategory
        ? "setup-stream-section"
        : "setup-difficulty-section";

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLocalError("");
    if (setLaunchErrorNotice) setLaunchErrorNotice("");
    setHighlightMissing(false);
    if (setQuizLaunched) setQuizLaunched(true);
    playSound("correct", sound);
    setPage("play");
  };

  return (
    <section className="home page-width">
      <div className="hero">
        <span className="eyebrow" style={{ color: theme.accent, borderColor: theme.border }}>
          {user ? `Active Candidate: ${user.name}` : "Standardized Assessment Platform"}
        </span>
        <h1>
          Comprehensive Knowledge Evaluation.<br />
          <em style={{ color: theme.accent, fontStyle: "normal" }}>
            {hasLanguage ? `Interactive challenges in ${activeLang.nativeName}.` : "Configure all parameters to begin."}
          </em>
        </h1>
        <p>
          {user
            ? `Welcome, ${user.name.split(" ")[0]}. Please select all 3 assessment parameters below (Language, Stream & Difficulty) then launch your evaluation.`
            : "Select your testing language, subject discipline, and time constraints below. All requirements must be completed from the dashboard before launching."}
        </p>
      </div>

      {/* ================= VALIDATION ERROR NOTICE BANNER ================= */}
      {effectiveError && (
        <div className="dashboard-validation-alert" role="alert">
          <div className="alert-icon-wrap">
            <span className="alert-icon">⚠️</span>
          </div>
          <div className="alert-content">
            <strong className="alert-title">Assessment Setup Incomplete</strong>
            <p className="alert-text">{effectiveError}</p>
            <div className="alert-missing-tags">
              {!hasLanguage && <span className="missing-tag">🌐 1. Select Language</span>}
              {!hasCategory && <span className="missing-tag">📚 2. Select Subject Stream</span>}
              {!hasDifficulty && <span className="missing-tag">🎯 3. Select Difficulty Tier</span>}
            </div>
          </div>
        </div>
      )}

      <div
        className="panel setup"
        style={{
          borderColor: theme.border,
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.2)"
        }}
      >
        {/* ================= 1. LANGUAGE SELECTION SECTION ================= */}
        <div
          id="setup-language-section"
          className={`setup-step-container ${highlightMissing && !hasLanguage ? "missing-requirement-pulse" : ""}`}
        >
          <div className="setup-section-header">
            <label>
              🌐 1. {getUIText(language || "en", "selectLanguage")}
            </label>
            {hasLanguage ? (
              <span className="active-stream-pill language-pill status-ready" style={{ borderColor: theme.accent, color: theme.accent }}>
                ✓ {activeLang.flag} {activeLang.nativeName} ({activeLang.label})
              </span>
            ) : (
              <span className="active-stream-pill status-required">
                ⚠️ Required: Select a language
              </span>
            )}
          </div>

          <div className="language-grid" role="radiogroup" aria-label="Select quiz language">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`language-card ${isSelected ? "selected" : ""}`}
                  style={
                    isSelected
                      ? {
                          borderColor: theme.accent,
                          background: "rgba(255, 255, 255, .08)"
                        }
                      : {}
                  }
                  key={lang.code}
                  onClick={() => {
                    playSound("click", sound);
                    if (setLanguage) setLanguage(lang.code);
                    setLocalError("");
                    if (setLaunchErrorNotice) setLaunchErrorNotice("");
                  }}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <div className="language-text">
                    <div className="language-native-row">
                      <strong className="language-native">{lang.nativeName}</strong>
                      {isSelected && <span className="language-check-badge" style={{ color: theme.accent }}>✓</span>}
                    </div>
                    <small className="language-sub">{lang.label} · {lang.region}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 2. STREAM SELECTION SECTION ================= */}
        <div
          id="setup-stream-section"
          className={`setup-step-container ${highlightMissing && !hasCategory ? "missing-requirement-pulse" : ""}`}
          style={{ marginTop: "32px" }}
        >
          <div className="setup-section-header">
            <label>
              📚 2. {getUIText(language || "en", "selectStream")}
            </label>
            {hasCategory && activeStream ? (
              <span className="active-stream-pill status-ready" style={{ borderColor: theme.accent, color: theme.accent }}>
                ✓ Active: {activeStream.icon} {activeStream.label}
              </span>
            ) : (
              <span className="active-stream-pill status-required">
                ⚠️ Required: Select a subject stream
              </span>
            )}
          </div>

          <div className="stream-grid">
            {STREAMS.map((item) => {
              const isSelected = category === item.id;
              return (
                <button
                  type="button"
                  className={`stream-card ${isSelected ? "selected" : ""}`}
                  style={
                    isSelected
                      ? {
                          borderColor: theme.accent,
                          background: "rgba(255, 255, 255, .08)"
                        }
                      : {}
                  }
                  key={item.id}
                  onClick={() => {
                    playSound("click", sound);
                    setCategory(item.id);
                    setLocalError("");
                    if (setLaunchErrorNotice) setLaunchErrorNotice("");
                  }}
                >
                  <span className="stream-icon">{item.icon}</span>
                  <div className="stream-text">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 3. DIFFICULTY SELECTION SECTION ================= */}
        <div
          id="setup-difficulty-section"
          className={`setup-step-container ${highlightMissing && !hasDifficulty ? "missing-requirement-pulse" : ""}`}
          style={{ marginTop: "32px" }}
        >
          <div className="setup-section-header">
            <label>
              🎯 3. {getUIText(language || "en", "setDifficulty")}
            </label>
            {hasDifficulty ? (
              <span className="active-stream-pill status-ready" style={{ borderColor: DIFFICULTIES[difficulty]?.color || theme.accent, color: DIFFICULTIES[difficulty]?.color || theme.accent }}>
                ✓ Selected: {difficulty}
              </span>
            ) : (
              <span className="active-stream-pill status-required">
                ⚠️ Required: Select difficulty
              </span>
            )}
          </div>

          <div className="difficulty-grid">
            {Object.entries(DIFFICULTIES).map(([key, value]) => {
              const isSelected = difficulty === key;
              return (
                <button
                  type="button"
                  className={isSelected ? "difficulty selected" : "difficulty"}
                  style={
                    isSelected
                      ? { borderColor: value.color, background: `${value.color}15` }
                      : {}
                  }
                  key={key}
                  onClick={() => {
                    playSound("click", sound);
                    setDifficulty(key);
                    setLocalError("");
                    if (setLaunchErrorNotice) setLaunchErrorNotice("");
                  }}
                >
                  <div className="difficulty-header-row">
                    <span className="difficulty-status-dot" style={{ background: value.color }} />
                    <strong style={{ color: value.color }}>{key}</strong>
                  </div>
                  <span>{value.time}s per question</span>
                  <small>+{value.points} pts correct / -{value.penalty} pts</small>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= REQUIREMENTS READINESS STATUS BAR ================= */}
        <div className="readiness-status-bar" style={{ borderColor: theme.border }}>
          <div className="readiness-header">
            <span className="readiness-title">📋 Assessment Launch Requirements:</span>
            <span className={`readiness-badge ${hasAllRequirements ? "ready" : "pending"}`}>
              {hasAllRequirements ? "✓ All Requirements Complete" : `${selectedCount} of 3 Selected`}
            </span>
          </div>
          <div className="readiness-items-grid">
            <div className={`readiness-item ${hasLanguage ? "complete" : "incomplete"}`}>
              <span className="readiness-dot">{hasLanguage ? "✓" : "○"}</span>
              <div className="readiness-info">
                <small>1. Language</small>
                <strong>{hasLanguage ? `${activeLang.flag} ${activeLang.nativeName}` : "Not Selected"}</strong>
              </div>
            </div>
            <div className={`readiness-item ${hasCategory ? "complete" : "incomplete"}`}>
              <span className="readiness-dot">{hasCategory ? "✓" : "○"}</span>
              <div className="readiness-info">
                <small>2. Stream</small>
                <strong>{hasCategory && activeStream ? `${activeStream.icon} ${activeStream.label}` : "Not Selected"}</strong>
              </div>
            </div>
            <div className={`readiness-item ${hasDifficulty ? "complete" : "incomplete"}`}>
              <span className="readiness-dot">{hasDifficulty ? "✓" : "○"}</span>
              <div className="readiness-info">
                <small>3. Difficulty</small>
                <strong>{hasDifficulty ? difficulty : "Not Selected"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ================= LAUNCH ACTION ================= */}
        <button
          id="launch-assessment-btn"
          className={`primary-button launch-quiz-btn ${hasAllRequirements ? "ready-to-launch" : "requirements-pending"}`}
          style={{
            background: hasAllRequirements ? theme.accent : "rgba(255, 255, 255, 0.07)",
            borderColor: hasAllRequirements ? "transparent" : "rgba(255, 255, 255, 0.16)",
            color: hasAllRequirements ? "#ffffff" : "#94a3b8",
            marginTop: "24px"
          }}
          onClick={handleLaunchAssessment}
        >
          {hasAllRequirements ? (
            <>
              <span>🚀 {getUIText(language || "en", "launchQuiz")}: {activeLang.flag} {activeLang.nativeName} ({activeStream.label} · {difficulty})</span>
              <span className="launch-arrow">→</span>
            </>
          ) : (
            <>
              <span>🔒 Launch Assessment (Fill Up All Requirements Above)</span>
              <span className="launch-arrow">→</span>
            </>
          )}
        </button>
      </div>

      <div className="features">
        {[
          ["01", "Native Multi-Language Support", `Verified questions in ${activeLang.nativeName} (${activeLang.label}) and 8 global languages.`],
          ["02", "Continuous Dynamic Stream", "Non-repeating evaluation bank fetched and deduplicated in real-time."],
          ["03", "Diagnostic Palette Navigator", "Interactive matrix allowing direct navigation and multi-question review."],
          ["04", "Standardized Metric Scoring", "Accuracy percentage, streak calculation, and granular explanations."]
        ].map(([number, title, description]) => (
          <div className="feature" key={title}>
            <b>{number}</b>
            <strong>{title}</strong>
            <span>{description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
