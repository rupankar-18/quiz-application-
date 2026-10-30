import { useEffect, useState, useRef, useCallback } from "react";
import { DIFFICULTIES } from "../data";
import { fetchQuizQuestions, STREAMS } from "../api";
import { playSound } from "./audio";
import Confetti from "./Confetti";
import Timer from "./Timer";
import { recordQuizResult, recordCertificate, submitUserFeedback } from "../services/authService";
import { getUserCertificateStatus } from "../services/certificateEligibility";
import { getLanguage, getUIText } from "../languages";
import Logo from "./Logo";

export default function Quiz({ category, difficulty, language = "", theme, sound, setPage, user, quizLaunched, setQuizLaunched }) {
  const hasRequirements = Boolean(quizLaunched && category && difficulty && language);
  const settings = DIFFICULTIES[difficulty] || DIFFICULTIES.Medium;
  const activeStream = STREAMS.find((s) => s.id === category) || STREAMS[0];
  const activeLang = language ? getLanguage(language) : getLanguage("en");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(hasRequirements);
  const [fetchError, setFetchError] = useState(null);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qIndex]: { correct, selected, timedOut, points } }
  const [time, setTime] = useState(settings.time);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [eliminatedMap, setEliminatedMap] = useState({}); // { [qIndex]: [optionIndex1, optionIndex2] }
  const [lifelinesUsed, setLifelinesUsed] = useState({}); // { [qIndex]: true }
  const [viewMode, setViewMode] = useState("single"); // "single" | "all"
  const [finished, setFinished] = useState(false);
  const [reviewMode, setReviewMode] = useState(false); // review all answers before finishing
  const [earnedCert, setEarnedCert] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackCat, setFeedbackCat] = useState("Question Quality");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const feedbackSectionRef = useRef(null);
  const resultsTopRef = useRef(null);

  const questionCardRefs = useRef({});
  const reviewCardRefs = useRef({});

  // When finished becomes true, scroll immediately to the very top of the page
  useEffect(() => {
    if (finished) {
      const scrollToAbsoluteTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector("main");
        if (mainEl) mainEl.scrollTop = 0;
      };

      scrollToAbsoluteTop();
      requestAnimationFrame(scrollToAbsoluteTop);
      const t1 = setTimeout(scrollToAbsoluteTop, 15);
      const t2 = setTimeout(scrollToAbsoluteTop, 60);
      const t3 = setTimeout(scrollToAbsoluteTop, 150);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [finished]);

  // When reviewMode becomes true, start from top of review
  useEffect(() => {
    if (reviewMode && !finished) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [reviewMode, finished]);

  // Function to fetch questions from online API based on selected stream, difficulty & language
  const loadQuestions = useCallback(async () => {
    if (!category || !difficulty || !language) return;
    setLoading(true);
    setFetchError(null);
    setAnswers({});
    setIndex(0);
    setScore(0);
    setStreak(0);
    setEliminatedMap({});
    setLifelinesUsed({});
    setTime(settings.time);
    setFinished(false);
    setReviewMode(false);
    setFeedbackSubmitted(false);
    setFeedbackRating(0);
    setFeedbackMsg("");
    setFeedbackCat("Question Quality");

    try {
      const fetched = await fetchQuizQuestions({
        category,
        difficulty,
        amount: 15,
        language
      });

      if (fetched && fetched.length > 0) {
        setQuestions(fetched);
      } else {
        setQuestions([]);
        setFetchError("Could not retrieve questions from the online API. Please check your internet connection and try again.");
      }
    } catch (err) {
      console.error("Failed to fetch questions from online API:", err);
      setQuestions([]);
      setFetchError("Network error: Could not reach live online quiz API. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, [category, difficulty, settings.time, language]);


  // Load questions ONLY when all requirements are fulfilled and quiz has been launched
  useEffect(() => {
    if (hasRequirements) {
      loadQuestions();
    }
  }, [loadQuestions, hasRequirements]);

  const currentQuestion = questions[index] || questions[0];
  const currentAnswer = answers[index];
  const attemptedCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && attemptedCount === questions.length;

  // Timer effect for single view mode (only ticks down on unattempted active question)
  useEffect(() => {
    if (loading || finished || currentAnswer || viewMode !== "single") return undefined;

    if (time <= 0) {
      handleTimeOut(index);
      return undefined;
    }

    const timer = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time, currentAnswer, finished, index, viewMode, loading]);

  // Reset timer when navigating to an unattempted question in single mode
  const goToQuestion = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    setIndex(targetIndex);

    if (!answers[targetIndex]) {
      setTime(settings.time);
    }

    if (viewMode === "all") {
      const cardEl = questionCardRefs.current[targetIndex];
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleTimeOut = (qIdx) => {
    if (answers[qIdx]) return;
    const targetQ = questions[qIdx];
    if (!targetQ) return;

    const penalty = settings.penalty;
    setScore((prev) => Math.max(0, prev - penalty));
    setStreak(0);
    setAnswers((prev) => ({
      ...prev,
      [qIdx]: {
        question: targetQ,
        correct: false,
        selected: null,
        timedOut: true,
        points: -penalty
      }
    }));
    playSound("wrong", sound);
  };

  const answerQuestion = (qIdx, optionIndex) => {
    if (answers[qIdx] || finished) return;

    const targetQ = questions[qIdx];
    if (!targetQ) return;

    const isCorrect = optionIndex === targetQ.answer;
    const nextStreak = isCorrect ? streak + 1 : 0;
    const points = isCorrect ? settings.points * (nextStreak >= 3 ? 1.5 : 1) : -settings.penalty;

    setStreak(nextStreak);
    setBestStreak((prev) => Math.max(prev, nextStreak));
    setScore((prev) => Math.max(0, prev + points));

    setAnswers((prev) => ({
      ...prev,
      [qIdx]: {
        question: targetQ,
        correct: isCorrect,
        selected: optionIndex,
        timedOut: false,
        points
      }
    }));

    playSound(isCorrect ? "correct" : "wrong", sound);
  };

  const applyLifeline = (qIdx) => {
    if (lifelinesUsed[qIdx] || answers[qIdx]) return;
    const targetQ = questions[qIdx];
    if (!targetQ) return;

    const wrong = targetQ.options
      .map((_, optIdx) => optIdx)
      .filter((optIdx) => optIdx !== targetQ.answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    setEliminatedMap((prev) => ({ ...prev, [qIdx]: wrong }));
    setLifelinesUsed((prev) => ({ ...prev, [qIdx]: true }));
    playSound("tick", sound);
  };

  const handleNextQuestion = () => {
    if (index + 1 < questions.length) {
      goToQuestion(index + 1);
    } else {
      const nextUnanswered = questions.findIndex((_, idx) => !answers[idx]);
      if (nextUnanswered !== -1) {
        goToQuestion(nextUnanswered);
      } else {
        // All answered — enter review mode first instead of finishing directly
        setReviewMode(true);
        playSound("tick", sound);
      }
    }
  };

  // Enter review mode when all questions are answered (button in palette)
  const handleReviewAndFinish = () => {
    const nextUnanswered = questions.findIndex((_, idx) => !answers[idx]);
    if (nextUnanswered !== -1) {
      goToQuestion(nextUnanswered);
    } else {
      setReviewMode(true);
      playSound("tick", sound);
    }
  };

  const handlePrevQuestion = () => {
    if (index > 0) {
      goToQuestion(index - 1);
    }
  };

  const jumpToNextUnanswered = () => {
    const nextUnanswered = questions.findIndex((_, idx) => !answers[idx]);
    if (nextUnanswered !== -1) {
      goToQuestion(nextUnanswered);
    }
  };

  const finishQuiz = () => {
    const correctCount = questions.reduce(
      (count, _, idx) => (answers[idx]?.correct ? count + 1 : count),
      0
    );
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const history = JSON.parse(localStorage.getItem("quiz_history") || "[]");
    history.push({
      date: new Date().toLocaleDateString(),
      score: score.toFixed(1),
      accuracy,
      category,
      difficulty,
      bestStreak,
      user: user ? user.name : "Guest"
    });
    localStorage.setItem("quiz_history", JSON.stringify(history));

    // Save to Supabase database for persistent cross-device access
    if (user && (user.id || user._id)) {
      recordQuizResult(user.id || user._id, {
        category,
        difficulty,
        score: Math.round(score),
        totalQuestions: questions.length,
        accuracy,
        correctAnswers: correctCount,
        timeTaken: settings.time - time
      }).then((res) => {
        if (res.success && res.user) {
          localStorage.setItem("quiz_active_user", JSON.stringify(res.user));
        }
      }).catch((err) => {
        console.warn("Could not sync quiz record with Supabase:", err.message);
      });
    }

    // Award the multi-stream certificate only when the user has completed 3 different streams
    // with an overall average of at least 65%.
    if (user && (user.id || user._id)) {
      const certificateStatus = getUserCertificateStatus(user);
      if (certificateStatus.qualifies) {
        recordCertificate({
          userName: user.name,
          userEmail: user.email || "",
          category: "Multi-Stream Completion",
          difficulty: "Overall",
          score: Math.round(certificateStatus.overallScore || score),
          accuracy: Math.round(certificateStatus.overallAccuracy || accuracy)
        }).then((res) => {
          if (res.success && res.certificate) {
            setEarnedCert(res.certificate);
          }
        }).catch(() => { });
      }
    }

    // Save detailed struggle questions for Admin Problem & Difficulty Analytics
    try {
      const struggles = JSON.parse(localStorage.getItem("quiz_struggles") || "[]");
      questions.forEach((q, idx) => {
        if (!answers[idx]?.correct) {
          struggles.push({
            id: `st_${Date.now()}_${idx}`,
            question: q.question,
            category: q.category || category,
            difficulty,
            correctAnswer: q.options[q.answer],
            selectedAnswer: answers[idx]?.selected !== null && answers[idx]?.selected !== undefined ? q.options[answers[idx]?.selected] : "Timed Out",
            candidateName: user ? user.name : "Candidate",
            candidateEmail: user ? user.email : "",
            timestamp: new Date().toISOString()
          });
        }
      });
      localStorage.setItem("quiz_struggles", JSON.stringify(struggles.slice(-250)));
    } catch { }

    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    setFinished(true);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };


  // Requirement Gate: Block assessment if all options have not been chosen and launched from dashboard
  if (!hasRequirements) {
    const hasLang = Boolean(language);
    const hasCat = Boolean(category);
    const hasDiff = Boolean(difficulty);
    const streamObj = STREAMS.find((s) => s.id === category);
    const langObj = hasLang ? getLanguage(language) : null;

    return (
      <section className="play page-width">
        <div
          className="panel quiz-requirement-gate"
          style={{
            borderColor: theme.border,
            boxShadow: "0 10px 30px -5px rgba(0,0,0,.25)"
          }}
        >
          <div className="gate-icon-badge">⚠️</div>
          <h2>Assessment Requirements Incomplete</h2>
          <p className="gate-lead">
            Please fill up all requirements from dashboard then click on Launch for solving the questions.
          </p>
          <div className="gate-checklist">
            <div className={`gate-item ${hasLang ? "valid" : "missing"}`}>
              <span className="gate-status-pill">{hasLang ? "✓ Configured" : "✗ Missing"}</span>
              <div className="gate-item-text">
                <strong>1. Quiz Language:</strong>
                <span>{hasLang ? `${langObj.flag} ${langObj.nativeName} (${langObj.label})` : "Please select from dashboard"}</span>
              </div>
            </div>
            <div className={`gate-item ${hasCat ? "valid" : "missing"}`}>
              <span className="gate-status-pill">{hasCat ? "✓ Configured" : "✗ Missing"}</span>
              <div className="gate-item-text">
                <strong>2. Subject Stream:</strong>
                <span>{hasCat ? `${streamObj?.icon || "📚"} ${streamObj?.label || category}` : "Please select from dashboard"}</span>
              </div>
            </div>
            <div className={`gate-item ${hasDiff ? "valid" : "missing"}`}>
              <span className="gate-status-pill">{hasDiff ? "✓ Configured" : "✗ Missing"}</span>
              <div className="gate-item-text">
                <strong>3. Difficulty Tier:</strong>
                <span>{hasDiff ? difficulty : "Please select from dashboard"}</span>
              </div>
            </div>
          </div>
          <button
            className="primary-button gate-return-btn"
            style={{ background: theme.accent, marginTop: "24px" }}
            onClick={() => {
              playSound("click", sound);
              setPage("home");
            }}
          >
            ← Return to Dashboard to Complete Requirements
          </button>
        </div>
      </section>
    );
  }

  // Loading state when questions are being fetched from API
  if (loading) {
    return (
      <section className="play page-width">
        <div
          className="panel quiz-loading-panel"
          style={{
            borderColor: theme.border,
            boxShadow: "0 10px 30px -5px rgba(0,0,0,.25)"
          }}
        >
          <div className="quiz-spinner" style={{ borderColor: theme.accent, borderTopColor: "transparent" }} />
          <span className="eyebrow" style={{ color: theme.accent, borderColor: theme.border, marginTop: "16px" }}>
            {activeLang.flag} {activeLang.nativeName} ({activeLang.label}) · {activeStream.icon} {activeStream.label}
          </span>
          <h2>
            {language !== "en"
              ? `${getUIText(language, "translatingNotice")} ${activeLang.nativeName}`
              : "Fetching Live Questions from Online API..."}
          </h2>
          <p>
            {language !== "en"
              ? `Questions are assembled and localized in real-time in ${activeLang.nativeName} (${activeLang.label}) for ${activeStream.label}.`
              : "Connecting to Cloud Trivia APIs to assemble a fresh set of 15 questions directly from the internet."}
          </p>
          <div className="loading-bar">
            <span style={{ background: theme.accent }} />
          </div>
        </div>
      </section>
    );
  }

  // ─── REVIEW MODE: Show all answers before final submission ───────────────────
  if (reviewMode && !finished) {
    const correctCount = questions.reduce(
      (count, _, idx) => (answers[idx]?.correct ? count + 1 : count),
      0
    );
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <section className="play page-width">
        <style>{`
          @keyframes reviewSlideIn {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes reviewCardIn {
            from { opacity: 0; transform: translateX(-18px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.0); }
            50%       { box-shadow: 0 0 28px 6px rgba(16,185,129,0.22); }
          }
          .review-finish-btn {
            animation: pulseGlow 2s infinite;
            transition: transform 0.15s, box-shadow 0.15s;
          }
          .review-finish-btn:hover {
            transform: scale(1.04);
          }
        `}</style>

        <div style={{ animation: "reviewSlideIn 0.45s ease" }}>
          {/* Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.12))",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: "16px",
              padding: "24px 28px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "28px" }}>📋</span>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
                  Review Your Responses
                </h2>
              </div>
              <p style={{ margin: 0, opacity: 0.75, fontSize: "0.92rem" }}>
                Double check your selected options before finalizing. When ready, click <strong>Finish Quiz &amp; See Results</strong> to calculate your final score.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#a5b4fc" }}>
                  {Object.keys(answers).length} / {questions.length}
                </div>
                <small style={{ opacity: 0.7 }}>Attempted</small>
              </div>
              <button
                className="review-finish-btn primary-button"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1rem",
                  padding: "12px 28px",
                  borderRadius: "10px",
                  width: "auto",
                  letterSpacing: "0.01em"
                }}
                onClick={() => {
                  playSound("correct", sound);
                  finishQuiz();
                }}
              >
                ✅ Finish Quiz &amp; See Results
              </button>
            </div>
          </div>

          {/* All Questions Review Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {questions.map((q, qIdx) => {
              const item = answers[qIdx];
              const isAnswered = Boolean(item);
              const isTimedOut = item?.timedOut;
              const delay = `${qIdx * 0.06}s`;

              return (
                <div
                  key={`review-${qIdx}`}
                  ref={el => (reviewCardRefs.current[qIdx] = el)}
                  style={{
                    animation: `reviewCardIn 0.4s ease ${delay} both`,
                    background: isAnswered
                      ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))"
                      : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${isAnswered ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "14px",
                    padding: "20px 22px",
                    position: "relative"
                  }}
                >
                  {/* Status badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          width: "30px", height: "30px", borderRadius: "8px",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          background: isAnswered ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.1)",
                          fontWeight: 800, fontSize: "0.85rem",
                          color: isAnswered ? "#a5b4fc" : "#94a3b8", flexShrink: 0
                        }}
                      >
                        {qIdx + 1}
                      </span>
                      <h3 style={{ margin: 0, fontSize: "0.97rem", fontWeight: 600, lineHeight: 1.4 }}>
                        {q.question}
                      </h3>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "0.78rem", fontWeight: 700, padding: "3px 10px",
                        borderRadius: "999px",
                        background: isTimedOut ? "rgba(245,158,11,0.2)" : isAnswered ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.08)",
                        color: isTimedOut ? "#f59e0b" : isAnswered ? "#a5b4fc" : "#94a3b8",
                        border: `1px solid ${isTimedOut ? "rgba(245,158,11,0.4)" : isAnswered ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.15)"}`
                      }}
                    >
                      {isTimedOut ? "⌛ Timed Out" : isAnswered ? "✓ Answered" : "Pending"}
                    </span>
                  </div>

                  {/* Options review */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = item?.selected === optIdx;
                      return (
                        <div
                          key={optIdx}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "9px 12px", borderRadius: "8px", fontSize: "0.88rem",
                            background: isSelected
                              ? "rgba(99,102,241,0.18)"
                              : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isSelected ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.07)"}`
                          }}
                        >
                          <b style={{
                            width: "22px", height: "22px", borderRadius: "6px",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.78rem",
                            background: isSelected ? "#6366f1" : "rgba(255,255,255,0.1)",
                            color: "#fff", flexShrink: 0
                          }}>
                            {String.fromCharCode(65 + optIdx)}
                          </b>
                          <span style={{ flex: 1, color: isSelected ? "#fff" : "inherit", fontWeight: isSelected ? 600 : 400 }}>
                            {opt}
                          </span>
                          {isSelected && <span style={{ color: "#a5b4fc", fontWeight: 700, fontSize: "0.82rem" }}>Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Finish Button */}
          <div style={{ textAlign: "center", margin: "32px 0 16px" }}>
            <button
              className="review-finish-btn primary-button"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.1rem",
                padding: "16px 48px",
                borderRadius: "12px",
                width: "auto",
                letterSpacing: "0.02em"
              }}
              onClick={() => {
                playSound("correct", sound);
                finishQuiz();
              }}
            >
              ✅ Finish Quiz &amp; See Results
            </button>
            <p style={{ marginTop: "10px", opacity: 0.5, fontSize: "0.83rem" }}>
              You can still go back if you missed something.
            </p>
            <button
              className="secondary-button"
              style={{ marginTop: "4px" }}
              onClick={() => {
                setReviewMode(false);
                playSound("click", sound);
              }}
            >
              ← Back to Quiz
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── RESULTS SCREEN ──────────────────────────────────────────────────────────
  if (finished) {
    const correctCount = questions.reduce(
      (count, _, idx) => (answers[idx]?.correct ? count + 1 : count),
      0
    );
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const FEEDBACK_CATEGORIES = [
      { value: "Question Quality", icon: "📝", label: "Question Quality & Accuracy" },
      { value: "Difficulty Balance", icon: "⚖️", label: "Difficulty & Timer Balance" },
      { value: "UI & UX", icon: "🎨", label: "User Interface & Experience" },
      { value: "Bug Report", icon: "🐛", label: "Issue or Bug Encountered" },
      { value: "General Suggestion", icon: "💡", label: "General Suggestion" },
    ];

    const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];
    const STAR_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

    return (
      <section
        ref={resultsTopRef}
        id="quiz-results-container"
        className="results page-width"
        style={{ paddingTop: "0px", marginTop: "0px" }}
      >
        <style>{`
          @keyframes resultFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes starPop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.45); }
            100% { transform: scale(1); }
          }
          @keyframes feedbackSlideIn {
            from { opacity: 0; transform: translateY(30px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes completionBounce {
            0%   { opacity: 0; transform: scale(0.6) translateY(20px); }
            60%  { transform: scale(1.08) translateY(-4px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes checkmarkDraw {
            from { stroke-dashoffset: 100; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes ripple {
            0%   { transform: scale(0); opacity: 0.6; }
            100% { transform: scale(3.5); opacity: 0; }
          }
          @keyframes catPillIn {
            from { opacity: 0; transform: translateX(8px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .fb-star-btn {
            background: none; border: none; cursor: pointer;
            font-size: 2rem; line-height: 1;
            transition: transform 0.15s, filter 0.15s;
            padding: 2px 4px;
          }
          .fb-star-btn:hover { transform: scale(1.3); }
          .fb-star-btn.fb-star-active { animation: starPop 0.3s ease; }
          .fb-cat-pill {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 14px; border-radius: 999px; cursor: pointer;
            font-size: 0.82rem; font-weight: 600; transition: all 0.2s;
            border: 1.5px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.05);
            animation: catPillIn 0.3s ease both;
          }
          .fb-cat-pill:hover {
            border-color: rgba(255,255,255,0.35);
            background: rgba(255,255,255,0.10);
            transform: translateY(-1px);
          }
          .fb-cat-pill.active {
            background: rgba(99,102,241,0.25);
            border-color: rgba(99,102,241,0.65);
            color: #a5b4fc;
          }
          .fb-textarea {
            width: 100%; padding: 14px 16px;
            border-radius: 12px; resize: vertical;
            background: rgba(255,255,255,0.05);
            border: 1.5px solid rgba(255,255,255,0.12);
            color: #f8fafc; font-size: 0.92rem;
            line-height: 1.6; outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            font-family: inherit;
          }
          .fb-textarea:focus {
            border-color: rgba(99,102,241,0.6);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          }
          .fb-submit-btn {
            position: relative; overflow: hidden;
            border: none; cursor: pointer;
            font-family: inherit; font-weight: 800;
            font-size: 1rem; padding: 14px 36px;
            border-radius: 12px; color: #fff;
            background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
            background-size: 200% 200%;
            animation: shimmer 3s linear infinite;
            transition: transform 0.15s, box-shadow 0.15s;
            letter-spacing: 0.02em;
          }
          .fb-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(99,102,241,0.45);
          }
          .fb-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .completion-ring {
            position: relative; display: inline-flex;
            align-items: center; justify-content: center;
          }
          .completion-ring::before {
            content: '';
            position: absolute; inset: -8px;
            border-radius: 50%; border: 2px solid rgba(16,185,129,0.5);
            animation: ripple 1.5s ease-out 0.3s 1;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>

        <Confetti />
        <div className="panel result-panel" style={{ borderColor: theme.border, animation: "resultFadeIn 0.5s ease", marginTop: "0" }}>
          {/* Brand Logo & Emblems prominently showcased at the top of results */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "18px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
              borderRadius: "22px",
              background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 70%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 10px 30px -5px rgba(0,0,0,0.5), 0 0 24px rgba(99,102,241,0.25)"
            }}>
              <Logo size={68} theme={theme} />
            </div>
          </div>

          <div className="result-icon">{accuracy >= 80 ? "★" : accuracy >= 50 ? "◆" : "○"}</div>
          <h1>{accuracy >= 80 ? getUIText(language, "congratulations") : getUIText(language, "quizCompleted")}</h1>
          <p>
            You completed <strong>{activeStream.label}</strong> ({category}) in{" "}
            <strong>{activeLang.flag} {activeLang.nativeName} ({activeLang.label})</strong> on{" "}
            <strong>{difficulty}</strong> mode.
          </p>
          <div className="result-stats">
            <div>
              <small>{getUIText(language, "score").toUpperCase()}</small>
              <strong style={{ color: theme.accent }}>{score.toFixed(1)}</strong>
            </div>
            <div>
              <small>ACCURACY</small>
              <strong style={{ color: "#10b981" }}>{accuracy}%</strong>
            </div>
            <div>
              <small>{getUIText(language, "streak").toUpperCase()}</small>
              <strong style={{ color: "#f59e0b" }}>{bestStreak}</strong>
            </div>
          </div>
          <div className="breakdown">
            <h3>{getUIText(language, "reviewAnswers")} ({correctCount}/{questions.length} {getUIText(language, "correct")})</h3>
            {questions.map((q, qIdx) => {
              const item = answers[qIdx];
              const isAnswered = Boolean(item);
              const isCorrect = item?.correct;
              const isTimedOut = item?.timedOut;

              return (
                <div
                  className={
                    !isAnswered
                      ? "answer"
                      : isCorrect
                        ? "answer correct"
                        : "answer incorrect"
                  }
                  key={`${q.question}-${qIdx}`}
                  dir={activeLang.dir}
                >
                  <strong>
                    Q{qIdx + 1}. {q.question}
                  </strong>
                  <span>
                    {!isAnswered
                      ? "Skipped / Unattempted"
                      : isCorrect
                        ? `✓ ${getUIText(language, "correct")}`
                        : isTimedOut
                          ? `⌛ ${getUIText(language, "timedOut")}`
                          : `✗ ${getUIText(language, "incorrect")}`}
                  </span>
                  <small>
                    {getUIText(language, "correct")}: <strong>{q.options[q.answer]}</strong>
                    {item && item.selected !== null && item.selected !== undefined && !isCorrect && (
                      <> (Your answer: {q.options[item.selected]})</>
                    )}
                    <br />
                    {q.explanation}
                  </small>
                </div>
              );
            })}
          </div>

          {/* Certificate Award Notification Card */}
          {(earnedCert || accuracy >= 70) && (
            <div
              style={{
                margin: "20px 0 10px",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "36px" }}>🎓</span>
                <div>
                  <strong style={{ color: "#f59e0b", fontSize: "1.05rem", display: "block" }}>
                    Official Certificate of Achievement Issued!
                  </strong>
                  <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                    You achieved {accuracy}% accuracy ({score.toFixed(1)} PTS) in {activeStream.label} and qualified for the verified certificate.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="primary-button"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#000",
                  fontWeight: "700",
                  width: "auto"
                }}
                onClick={() => {
                  playSound("click", sound);
                  setShowCertModal(true);
                }}
              >
                📜 View &amp; Print Certificate
              </button>
            </div>
          )}

          <div className="action-row" style={{ marginTop: "18px" }}>
            <button className="primary-button" onClick={loadQuestions}>
              {getUIText(language, "playAgain")} ({activeLang.nativeName})
            </button>
            <button className="secondary-button" onClick={() => setPage("home")}>
              {getUIText(language, "backToHome")}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              INLINE DYNAMIC FEEDBACK SECTION
              This replaces the old feedback modal — shown right here, in-place.
              When submitted, the completion animation appears exactly here.
          ═══════════════════════════════════════════════════════════════════ */}
          <div ref={feedbackSectionRef} style={{ marginTop: "32px" }}>
            {feedbackSubmitted ? (
              /* ─── DYNAMIC IN-PLACE COMPLETION ─────────────────────────── */
              <div
                style={{
                  animation: "completionBounce 0.65s cubic-bezier(0.34,1.56,0.64,1) both",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(6,182,212,0.08))",
                  border: "1.5px solid rgba(16,185,129,0.45)",
                  borderRadius: "20px",
                  padding: "40px 32px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Decorative shimmer bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: "linear-gradient(90deg, #10b981, #06b6d4, #6366f1, #10b981)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s linear infinite"
                }} />

                {/* Animated check circle */}
                <div className="completion-ring" style={{ marginBottom: "18px" }}>
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "36px", boxShadow: "0 0 0 8px rgba(16,185,129,0.15)"
                  }}>
                    ✅
                  </div>
                </div>

                <h3 style={{
                  margin: "0 0 8px", fontSize: "1.35rem", fontWeight: 800,
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                }}>
                  Thank You for Your Feedback!
                </h3>
                <p style={{ margin: "0 0 8px", opacity: 0.8, fontSize: "0.93rem" }}>
                  Your{" "}
                  <strong style={{ color: "#f59e0b" }}>
                    {feedbackRating > 0 ? `${feedbackRating}-star` : ""} {feedbackCat}
                  </strong>{" "}
                  evaluation has been transmitted to the Admin Dashboard for quality review.
                </p>
                <p style={{ margin: "0 0 22px", opacity: 0.55, fontSize: "0.82rem" }}>
                  We truly appreciate your time — it helps us make QuizPulse better every day. 🙌
                </p>

                {/* Animated rating display */}
                {feedbackRating > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "24px" }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{
                        fontSize: "1.5rem",
                        filter: s <= feedbackRating ? "drop-shadow(0 0 6px #f59e0b)" : "none",
                        animation: s <= feedbackRating ? `starPop 0.3s ease ${(s - 1) * 0.08}s both` : "none",
                        color: s <= feedbackRating ? "#f59e0b" : "rgba(255,255,255,0.15)"
                      }}>★</span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    className="primary-button"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      width: "auto", padding: "10px 24px", fontWeight: 700
                    }}
                    onClick={loadQuestions}
                  >
                    🔄 Play Again
                  </button>
                  <button
                    className="secondary-button"
                    style={{ padding: "10px 24px" }}
                    onClick={() => setPage("home")}
                  >
                    🏠 Return Home
                  </button>
                </div>
              </div>
            ) : (
              /* ─── DYNAMIC FEEDBACK FORM ────────────────────────────────── */
              <div
                style={{
                  animation: "feedbackSlideIn 0.5s ease both",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(139,92,246,0.06))",
                  border: "1.5px solid rgba(99,102,241,0.35)",
                  borderRadius: "20px",
                  padding: "28px 28px 24px",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Top shimmer accent line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s linear infinite"
                }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "22px", flexShrink: 0,
                    boxShadow: "0 4px 14px rgba(99,102,241,0.4)"
                  }}>💬</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                      How was your experience?
                    </h3>
                    <p style={{ margin: 0, opacity: 0.65, fontSize: "0.83rem" }}>
                      Your feedback helps us improve. Takes less than 30 seconds!
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!feedbackMsg.trim() || feedbackRating === 0) return;
                    setFeedbackSubmitting(true);
                    try {
                      await submitUserFeedback({
                        userName: user ? user.name : "Candidate",
                        userEmail: user ? user.email : "",
                        userId: user?.id || "",
                        rating: feedbackRating,
                        category: feedbackCat,
                        message: feedbackMsg.trim()
                      });
                      playSound("correct", sound);
                      setFeedbackSubmitted(true);
                      // Scroll back up to see the completion
                      feedbackSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } catch {
                      // still show completion even if API fails
                      setFeedbackSubmitted(true);
                    } finally {
                      setFeedbackSubmitting(false);
                    }
                  }}
                >
                  {/* ── Star Rating ── */}
                  <div style={{ marginBottom: "22px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.7, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Overall Rating
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`fb-star-btn${(feedbackHover || feedbackRating) >= star ? " fb-star-active" : ""}`}
                          onMouseEnter={() => setFeedbackHover(star)}
                          onMouseLeave={() => setFeedbackHover(0)}
                          onClick={() => { setFeedbackRating(star); playSound("tick", sound); }}
                          style={{
                            color: (feedbackHover || feedbackRating) >= star
                              ? (STAR_COLORS[feedbackHover || feedbackRating] || "#f59e0b")
                              : "rgba(255,255,255,0.18)",
                            filter: (feedbackHover || feedbackRating) >= star
                              ? `drop-shadow(0 0 5px ${STAR_COLORS[feedbackHover || feedbackRating] || "#f59e0b"}88)`
                              : "none"
                          }}
                          title={STAR_LABELS[star]}
                          aria-label={`Rate ${star} out of 5 stars`}
                        >
                          ★
                        </button>
                      ))}
                      {(feedbackHover || feedbackRating) > 0 && (
                        <span style={{
                          marginLeft: "10px", fontSize: "0.9rem", fontWeight: 700,
                          color: STAR_COLORS[feedbackHover || feedbackRating],
                          animation: "catPillIn 0.2s ease"
                        }}>
                          {STAR_LABELS[feedbackHover || feedbackRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Category Pills ── */}
                  <div style={{ marginBottom: "22px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.7, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Feedback Category
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {FEEDBACK_CATEGORIES.map((cat, i) => (
                        <button
                          key={cat.value}
                          type="button"
                          className={`fb-cat-pill${feedbackCat === cat.value ? " active" : ""}`}
                          style={{ animationDelay: `${i * 0.07}s` }}
                          onClick={() => { setFeedbackCat(cat.value); playSound("tick", sound); }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Message Textarea ── */}
                  <div style={{ marginBottom: "22px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.7, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Your Message
                    </div>
                    <textarea
                      className="fb-textarea"
                      rows={4}
                      placeholder="Tell us about your quiz experience, suggest improvements, or report any issues..."
                      value={feedbackMsg}
                      onChange={(e) => setFeedbackMsg(e.target.value)}
                      required
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                      <span style={{ fontSize: "0.75rem", opacity: 0.45 }}>
                        {feedbackRating === 0 ? "⚠ Please rate before submitting" : ""}
                      </span>
                      <span style={{ fontSize: "0.75rem", opacity: 0.45 }}>{feedbackMsg.length} characters</span>
                    </div>
                  </div>

                  {/* ── Submit ── */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                      type="submit"
                      className="fb-submit-btn"
                      disabled={feedbackSubmitting || !feedbackMsg.trim() || feedbackRating === 0}
                      style={{
                        background: feedbackSubmitting
                          ? "rgba(99,102,241,0.4)"
                          : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
                        backgroundSize: "200% 200%",
                        animation: feedbackSubmitting ? "none" : "shimmer 3s linear infinite"
                      }}
                    >
                      {feedbackSubmitting ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            width: "16px", height: "16px", borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            display: "inline-block",
                            animation: "spin 0.8s linear infinite"
                          }} />
                          Sending...
                        </span>
                      ) : (
                        "🚀 Submit Feedback →"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Official Certificate Modal */}
          {showCertModal && (
            <div className="admin-modal-backdrop" onClick={() => setShowCertModal(false)}>
              <div
                className="admin-modal-card certificate-modal-wrap"
                style={{
                  maxWidth: "760px",
                  background: "#0b0f19",
                  border: "2px solid #f59e0b",
                  boxShadow: "0 25px 70px rgba(0,0,0,0.8), 0 0 50px rgba(245, 158, 11, 0.25)"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="modal-close-btn" onClick={() => setShowCertModal(false)}>✕</button>
                </div>

                {/* Printable Certificate Frame */}
                <div className="certificate-frame-container" id="printable-certificate">
                  <div className="cert-inner-border">
                    <div className="cert-top-emblem">
                      <span className="cert-gold-shield">🛡️</span>
                      <span className="cert-org-name">QUIZPULSE STANDARDIZED ASSESSMENT COUNCIL</span>
                      <small className="cert-ref-code">Ref: {earnedCert?.id || `QP-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`}</small>
                    </div>

                    <h1 className="cert-main-title">CERTIFICATE OF ACHIEVEMENT</h1>
                    <p className="cert-sub-lead">This official credential certifies that</p>

                    <h2 className="cert-recipient-name">{user ? user.name : "Candidate"}</h2>

                    <p className="cert-text-body">
                      has rigorously solved and fulfilled all standardized examination requirements in the discipline of:
                    </p>

                    <div className="cert-subject-pill">
                      <span>{activeStream.icon} {activeStream.label} ({category})</span>
                      <span className="cert-difficulty-tag">Tier: {difficulty}</span>
                    </div>

                    <div className="cert-metrics-row">
                      <div className="cert-metric-box">
                        <small>ACCURACY</small>
                        <strong>{accuracy}%</strong>
                      </div>
                      <div className="cert-metric-box">
                        <small>FINAL SCORE</small>
                        <strong>{score.toFixed(1)} PTS</strong>
                      </div>
                      <div className="cert-metric-box">
                        <small>HONORS DISTINCTION</small>
                        <strong style={{ color: "#f59e0b" }}>
                          {accuracy >= 90 ? "Gold Honors" : accuracy >= 80 ? "Silver Merit" : "Certified Pass"}
                        </strong>
                      </div>
                    </div>

                    <div className="cert-footer-signature-row">
                      <div className="cert-sign-col">
                        <div className="signature-line" />
                        <span>Director of Assessment</span>
                        <small>QuizPulse Certification Board</small>
                      </div>

                      <div className="cert-seal-badge">
                        <span>★ VERIFIED ★</span>
                        <small>{new Date().toLocaleDateString()}</small>
                      </div>

                      <div className="cert-sign-col">
                        <div className="signature-line" />
                        <span>Lead Technical Evaluator</span>
                        <small>Supabase System Gateway</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="action-row" style={{ marginTop: "20px", justifyContent: "space-between" }}>
                  <button className="secondary-button" onClick={() => setShowCertModal(false)}>
                    Close
                  </button>
                  <button
                    className="primary-button"
                    style={{ background: "#f59e0b", color: "#000", fontWeight: "700", width: "auto" }}
                    onClick={() => window.print()}
                  >
                    🖨️ Print / Save Certificate PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }


  if (!currentQuestion) {
    return (
      <section className="play page-width">
        <div className="panel quiz-panel" style={{ borderColor: theme.border, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌐</div>
          <h2>Live Online API Connection Required</h2>
          <p style={{ maxWidth: "520px", margin: "12px auto", lineHeight: "1.6" }}>
            {fetchError || "Questions must be fetched from the live online API, but could not connect. Please check your internet connection and try again."}
          </p>
          <div className="action-row" style={{ justifyContent: "center", marginTop: "24px" }}>
            <button className="primary-button" onClick={loadQuestions}>
              🔄 Retry Online Fetch
            </button>
            <button className="secondary-button" onClick={() => setPage("home")}>
              ← Return to Stream Selection
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Active Quiz View with Right-Side Question Navigator Palette
  return (
    <section className="play page-width">
      <div className="play-layout">
        {/* Main Quiz Area (Single Question or Multi-Question Stream) */}
        <div className="quiz-main-area">
          {fetchError && (
            <div className="api-notice-bar">
              <span>⚠️ {fetchError}</span>
            </div>
          )}

          {viewMode === "single" ? (
            /* Single Focused Question View */
            <div className="panel quiz-panel" style={{ borderColor: theme.border }}>
              <div className="progress">
                <span
                  style={{
                    width: `${(attemptedCount / questions.length) * 100}%`,
                    background: theme.accent
                  }}
                />
              </div>

              <div className="quiz-meta">
                <span style={{ color: theme.accent }}>
                  {activeStream.icon} {currentQuestion.category || activeStream.label}
                </span>
                <span
                  className="quiz-language-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "inherit",
                    border: "1px solid rgba(255, 255, 255, 0.12)"
                  }}
                  title={`Quiz Language: ${activeLang.label}`}
                >
                  {activeLang.flag} {activeLang.nativeName}
                </span>
                <span
                  className="online-live-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    background: "rgba(16, 185, 129, 0.10)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.25)"
                  }}
                  title={currentQuestion.source || "Fetched live from online API"}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  {currentQuestion.source || "Live Online API"}
                </span>
                <small>
                  {getUIText(language, "question")} {index + 1} {getUIText(language, "of")} {questions.length}
                </small>
                {!currentAnswer ? (
                  <Timer time={time} total={settings.time} />
                ) : (
                  <span className="answered-status-pill">
                    {currentAnswer.timedOut ? `⌛ ${getUIText(language, "timedOut")}` : `✓ ${getUIText(language, "answered") || "Answered"}`}
                  </span>
                )}
              </div>

              <h2 dir={activeLang.dir} style={{ textAlign: activeLang.dir === "rtl" ? "right" : "left" }}>
                {currentQuestion.question}
              </h2>

              {/* 50:50 Lifeline Button */}
              {!currentAnswer && (
                <button
                  className="lifeline"
                  disabled={lifelinesUsed[index]}
                  onClick={() => applyLifeline(index)}
                  title="Eliminate two wrong options"
                >
                  ⚡ {lifelinesUsed[index] ? "Used" : getUIText(language, "lifeline5050")}
                </button>
              )}

              {/* Options */}
              <div className="options" dir={activeLang.dir}>
                {currentQuestion.options.map((option, optIdx) => {
                  const isEliminated = (eliminatedMap[index] || []).includes(optIdx);
                  const isSelected = currentAnswer?.selected === optIdx;

                  let optionClass = "option";
                  if (currentAnswer && isSelected) {
                    optionClass += " is-selected-neutral";
                  }

                  return (
                    <button
                      key={option}
                      className={optionClass}
                      disabled={Boolean(currentAnswer) || isEliminated}
                      onClick={() => answerQuestion(index, optIdx)}
                      style={{ textAlign: activeLang.dir === "rtl" ? "right" : "left" }}
                    >
                      <b>{String.fromCharCode(65 + optIdx)}</b>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="quiz-nav-row">
                <button
                  className="secondary-button"
                  onClick={handlePrevQuestion}
                  disabled={index === 0}
                >
                  ← Prev
                </button>

                {currentAnswer ? (
                  <button className="primary-button" onClick={handleNextQuestion}>
                    {index + 1 < questions.length
                      ? `${getUIText(language, "nextQuestion")} →`
                      : allAnswered
                        ? `${getUIText(language, "finishQuiz")} ★`
                        : "Review Unanswered →"}
                  </button>
                ) : (
                  <button className="secondary-button skip-button" onClick={handleNextQuestion}>
                    Skip for Now →
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Multi-Question List View: Allows viewing and attempting multiple questions with 1 click */
            <div className="multi-questions-list">
              <div className="multi-list-header panel" style={{ borderColor: theme.border }}>
                <div>
                  <h2>All Questions Overview ({activeStream.label})</h2>
                  <p>Click any option on any question below to attempt it in one click.</p>
                </div>
                <button
                  className="secondary-button view-mode-switch-btn"
                  onClick={() => setViewMode("single")}
                >
                  🎯 Switch to Single View
                </button>
              </div>

              {questions.map((q, qIdx) => {
                const answerRecord = answers[qIdx];
                const isEliminatedList = eliminatedMap[qIdx] || [];
                const isActive = index === qIdx;

                return (
                  <div
                    key={`${q.question}-${qIdx}`}
                    ref={(el) => (questionCardRefs.current[qIdx] = el)}
                    id={`question-card-${qIdx}`}
                    className={`panel quiz-panel multi-card ${isActive ? "active-multi-card" : ""}`}
                    style={{
                      borderColor: isActive ? theme.accent : theme.border,
                      boxShadow: isActive ? `0 0 20px ${theme.glow}` : undefined
                    }}
                    onClick={() => setIndex(qIdx)}
                  >
                    <div className="quiz-meta">
                      <span className="q-badge" style={{ background: theme.accent, color: "#fff" }}>
                        Q{qIdx + 1}
                      </span>
                      <span style={{ color: theme.accent }}>{q.category || activeStream.label}</span>
                      <div style={{ marginLeft: "auto" }}>
                        {answerRecord ? (
                          <span className="status-pill" style={{
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99, 102, 241, 0.35)"
                          }}>
                            {answerRecord.timedOut ? "⌛ Timed out" : "✓ Answered"}
                          </span>
                        ) : (
                          <span className="status-pill pill-unanswered">Pending</span>
                        )}
                      </div>
                    </div>

                    <h3>{q.question}</h3>

                    {!answerRecord && (
                      <button
                        className="lifeline"
                        disabled={lifelinesUsed[qIdx]}
                        onClick={(e) => {
                          e.stopPropagation();
                          applyLifeline(qIdx);
                        }}
                      >
                        ⚡ 50:50 {lifelinesUsed[qIdx] ? "Used" : "Lifeline"}
                      </button>
                    )}

                    <div className="options">
                      {q.options.map((option, optIdx) => {
                        const isEliminated = isEliminatedList.includes(optIdx);
                        const isSelected = answerRecord?.selected === optIdx;

                        let optionClass = "option";
                        if (answerRecord && isSelected) {
                          optionClass += " is-selected-neutral";
                        }

                        return (
                          <button
                            key={option}
                            className={optionClass}
                            disabled={Boolean(answerRecord) || isEliminated}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIndex(qIdx);
                              answerQuestion(qIdx, optIdx);
                            }}
                          >
                            <b>{String.fromCharCode(65 + optIdx)}</b>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side Corner Question Navigator (Palette) */}
        <aside
          className="panel question-navigator"
          style={{
            borderColor: theme.border,
            boxShadow: "0 8px 24px -4px rgba(0,0,0,.25)"
          }}
          aria-label="Question Navigation Palette"
        >
          <div className="navigator-header">
            <div className="nav-title-row">
              <span className="navigator-tag" style={{ color: theme.accent }}>
                {activeStream.icon} {activeStream.label.split(" ")[0]}
              </span>
              <button
                type="button"
                className="palette-fetch-new-btn"
                onClick={loadQuestions}
                title="Fetch 15 different questions from the online API"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.18)",
                  color: "#cbd5e1",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                🔄 New Set
              </button>
              <span className="count-badge">
                {attemptedCount}/{questions.length} Done
              </span>
            </div>
            <div className="navigator-score-row">
              <div>
                <small>SCORE</small>
                <strong style={{ color: theme.accent }}>{score.toFixed(1)}</strong>
              </div>
              <div>
                <small>STREAK</small>
                <strong style={{ color: "#f59e0b" }}>🔥 {streak}</strong>
              </div>
            </div>
          </div>

          {/* 1-Click Multi-Question View Switcher */}
          <button
            type="button"
            className="palette-view-toggle"
            style={{
              borderColor: viewMode === "all" ? theme.accent : "rgba(255,255,255,.16)",
              background: viewMode === "all" ? `rgba(255,255,255,.12)` : "rgba(255,255,255,.05)"
            }}
            onClick={() => setViewMode(viewMode === "single" ? "all" : "single")}
            title={viewMode === "single" ? "Show all questions on one screen" : "Switch back to single focus view"}
          >
            {viewMode === "single" ? "📑 Show All Questions (1-Click)" : "🎯 Single Question View"}
          </button>

          {/* Number of side right corner: Question numbers buttons */}
          <div className="palette-grid" role="group" aria-label="Question Numbers">
            {questions.map((_, qIdx) => {
              const answerRecord = answers[qIdx];
              const isCurrent = index === qIdx;
              const isAnswered = Boolean(answerRecord);
              const isCorrect = answerRecord?.correct;

              let btnClass = "palette-num-btn";
              if (isCurrent) btnClass += " is-current";
              if (isAnswered) {
                btnClass += " is-attempted-neutral";
              } else {
                btnClass += " is-unanswered";
              }

              return (
                <button
                  key={qIdx}
                  type="button"
                  className={btnClass}
                  style={{
                    borderColor: isCurrent ? theme.accent : undefined
                  }}
                  onClick={() => goToQuestion(qIdx)}
                  title={`Question ${qIdx + 1}: ${!isAnswered ? "Unattempted" : "Answered"}`}
                  aria-label={`Jump to Question ${qIdx + 1}`}
                >
                  <span className="q-number">{qIdx + 1}</span>
                  {isAnswered && (
                    <span className="q-icon">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-dot dot-current" style={{ background: theme.accent }} />
              <span>Current</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#818cf8" }} />
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-pending" />
              <span>Pending</span>
            </div>
          </div>

          {/* Palette Actions */}
          <div className="palette-actions">
            <button
              type="button"
              className="secondary-button new-questions-btn"
              onClick={loadQuestions}
              title="Fetch a completely new set of questions from the API for this stream"
            >
              🔄 Fetch Fresh Questions
            </button>

            {!allAnswered && (
              <button
                type="button"
                className="secondary-button next-unanswered-btn"
                onClick={jumpToNextUnanswered}
              >
                ⏭ Next Unanswered
              </button>
            )}

            <button
              type="button"
              className="primary-button finish-early-btn"
              style={{
                background: allAnswered
                  ? `linear-gradient(135deg, ${theme.accent}, #10b981)`
                  : "rgba(255,255,255,.09)",
                borderColor: allAnswered ? "transparent" : "rgba(255,255,255,.18)"
              }}
              onClick={handleReviewAndFinish}
            >
              {allAnswered ? "✅ Review & Finish ★" : "Submit Quiz"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
