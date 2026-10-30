import { useState, useEffect, useMemo, useCallback } from "react";
import { playSound } from "./audio";
import { STREAMS, getSeenQuestions } from "../api";
import { QUESTIONS, DIFFICULTIES } from "../data";
import {
  getAllUsersFromDb,
  getAllFeedbacks,
  updateFeedbackStatus,
  getAllCertificates,
  recordCertificate,
  checkDbStatus,
  isConfiguredAdmin,
  getParsedAdmins
} from "../services/authService";

export default function AdminDashboard({ setPage, user, theme, sound }) {
  const configuredAdmins = getParsedAdmins();
  const envAdminUsername = configuredAdmins[0]?.username || (import.meta.env.VITE_ADMIN_USERNAME || "").trim().toLowerCase();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [searchHistory, setSearchHistory] = useState("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("All");
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = useState("All");

  // Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState("all");

  // Certificate State
  const [certificates, setCertificates] = useState([]);
  const [certSearch, setCertSearch] = useState("");
  const [certCategoryFilter, setCertCategoryFilter] = useState("All");
  const [selectedCertForPreview, setSelectedCertForPreview] = useState(null);
  const [showManualCertModal, setShowManualCertModal] = useState(false);
  const [manualCertCandidate, setManualCertCandidate] = useState("");
  const [manualCertCategory, setManualCertCategory] = useState("Science");
  const [manualCertScore, setManualCertScore] = useState(90);
  const [manualCertAccuracy, setManualCertAccuracy] = useState(90);

  // Individual User Dossier Modal State
  const [selectedUserForDossier, setSelectedUserForDossier] = useState(null);

  // Question Struggles Intelligence State
  const [struggles, setStruggles] = useState([]);

  // Database Connection State
  const [dbStatus, setDbStatus] = useState({ connected: true, provider: "Supabase" });

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [userFormMsg, setUserFormMsg] = useState("");

  // New custom question form state
  const [showAddQModal, setShowAddQModal] = useState(false);
  const [qCategory, setQCategory] = useState("Science");
  const [qText, setQText] = useState("");
  const [qOpt1, setQOpt1] = useState("");
  const [qOpt2, setQOpt2] = useState("");
  const [qOpt3, setQOpt3] = useState("");
  const [qOpt4, setQOpt4] = useState("");
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState("");
  const [qFormMsg, setQFormMsg] = useState("");

  // Question search in bank
  const [qBankCategory, setQBankCategory] = useState("All");
  const [qBankSearch, setQBankSearch] = useState("");

  // System diagnostics state
  const [apiLatency, setApiLatency] = useState({ triviaApi: null, openTdb: null, testing: false });
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem("quiz_maintenance_mode") === "true";
  });
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };



  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lxuowgvdkndaztsoikqe.supabase.co";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CiEftmntQSowqfkf0JHfuw_rC35TSlF";
  const projectRef = supabaseUrl.includes("supabase.co")
    ? supabaseUrl.replace("https://", "").split(".")[0]
    : "lxuowgvdkndaztsoikqe";
  const supabaseConsoleUrl = `https://supabase.com/dashboard/project/${projectRef}`;
  const supabaseUsersTableUrl = `${supabaseConsoleUrl}/editor/users`;

  // Load all core data from storage & Supabase
  const loadData = useCallback(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem("quiz_users") || "[]");
      configuredAdmins.forEach((adm) => {
        if (!storedUsers.some((u) => u.username?.toLowerCase() === adm.username)) {
          storedUsers.unshift({
            name: adm.name || "System Administrator",
            username: adm.username,
            email: adm.email || `${adm.username}@quizpulse.com`,
            role: "admin",
            avatar: "🛡️",
            createdAt: new Date().toLocaleDateString()
          });
        }
      });
      localStorage.setItem("quiz_users", JSON.stringify(storedUsers));
      setUsers(storedUsers);

      getAllUsersFromDb().then((res) => {
        if (res.success && res.users && res.users.length > 0) {
          setUsers(res.users);
          localStorage.setItem("quiz_users", JSON.stringify(res.users));
        }
      }).catch((e) => console.warn("Admin Supabase fetch error:", e));

      const storedHistory = JSON.parse(localStorage.getItem("quiz_history") || "[]");
      setHistory(storedHistory);

      const storedCustomQ = JSON.parse(localStorage.getItem("quiz_custom_questions") || "[]");
      setCustomQuestions(storedCustomQ);

      getAllFeedbacks().then((res) => {
        if (res.success && res.feedbacks) setFeedbacks(res.feedbacks);
      }).catch(() => { });

      getAllCertificates().then((res) => {
        if (res.success && res.certificates) setCertificates(res.certificates);
      }).catch(() => { });

      try {
        const storedStruggles = JSON.parse(localStorage.getItem("quiz_struggles") || "[]");
        setStruggles(storedStruggles);
      } catch { }

      checkDbStatus().then((res) => {
        setDbStatus(res);
      }).catch(() => { });
    } catch (e) {
      console.error("Error loading admin data:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Aggregated KPI metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin" || isConfiguredAdmin(u.username) || isConfiguredAdmin(u.email)).length;
  const totalAttempts = history.length;

  const avgAccuracy = useMemo(() => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, curr) => acc + (Number(curr.accuracy) || 0), 0);
    return Math.round(sum / history.length);
  }, [history]);

  const avgScore = useMemo(() => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
    return (sum / history.length).toFixed(1);
  }, [history]);

  const topScorer = useMemo(() => {
    if (history.length === 0) return { name: "None", score: 0 };
    let best = { name: "None", score: 0 };
    history.forEach((h) => {
      const s = Number(h.score) || 0;
      if (s > best.score) {
        best = { name: h.user || "Guest", score: s };
      }
    });
    return best;
  }, [history]);

  // Stream breakdown statistics
  const streamStats = useMemo(() => {
    return STREAMS.filter((s) => s.id !== "All").map((stream) => {
      const streamAttempts = history.filter((h) => h.category === stream.id);
      const count = streamAttempts.length;
      const accuracySum = streamAttempts.reduce((acc, h) => acc + (Number(h.accuracy) || 0), 0);
      const avgAcc = count > 0 ? Math.round(accuracySum / count) : 0;
      return {
        id: stream.id,
        label: stream.label,
        icon: stream.icon,
        attempts: count,
        accuracy: avgAcc
      };
    });
  }, [history]);

  // Difficulty breakdown
  const difficultyStats = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    history.forEach((h) => {
      if (counts[h.difficulty] !== undefined) {
        counts[h.difficulty]++;
      } else {
        counts.Medium++;
      }
    });
    return counts;
  }, [history]);

  // Deduplication cache counts
  const cacheStats = useMemo(() => {
    return STREAMS.map((s) => {
      const seen = getSeenQuestions(s.id);
      return { stream: s.id, label: s.label, count: seen.length };
    });
  }, [activeTab]);

  // Handle User Role Toggle
  const handleToggleUserRole = (targetUser) => {
    if (isConfiguredAdmin(targetUser.username) || isConfiguredAdmin(targetUser.email)) {
      showToast(`Cannot demote configured administrator account (@${targetUser.username}).`);
      return;
    }
    const updated = users.map((u) => {
      if (u.username === targetUser.username) {
        const newRole = u.role === "admin" ? "user" : "admin";
        return { ...u, role: newRole };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem("quiz_users", JSON.stringify(updated));
    playSound("click", sound);
    showToast(`Updated role for ${targetUser.name}.`);
  };

  // Handle Delete User
  const handleDeleteUser = (targetUser) => {
    if (isConfiguredAdmin(targetUser.username) || isConfiguredAdmin(targetUser.email)) {
      showToast("Cannot delete administrator account configured in .env.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${targetUser.name}"?`)) {
      const updated = users.filter((u) => u.username !== targetUser.username);
      setUsers(updated);
      localStorage.setItem("quiz_users", JSON.stringify(updated));
      playSound("wrong", sound);
      showToast(`User ${targetUser.name} deleted.`);
    }
  };

  // Add User Submission
  const handleCreateUser = (e) => {
    e.preventDefault();
    setUserFormMsg("");

    const nameTrim = newUserName.trim();
    const userTrim = newUserUsername.trim();
    const emailTrim = newUserEmail.trim();
    const passTrim = newUserPassword.trim();

    if (!nameTrim || !userTrim || !passTrim) {
      setUserFormMsg("Name, username, and password are required.");
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === userTrim.toLowerCase())) {
      setUserFormMsg("A user with this username already exists.");
      return;
    }

    const created = {
      name: nameTrim,
      username: userTrim,
      email: emailTrim || `${userTrim}@example.com`,
      password: passTrim,
      role: newUserRole,
      avatar: nameTrim.charAt(0).toUpperCase(),
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [created, ...users];
    setUsers(updated);
    localStorage.setItem("quiz_users", JSON.stringify(updated));

    setNewUserName("");
    setNewUserUsername("");
    setNewUserEmail("");
    setNewUserPassword("");
    setShowAddUserModal(false);
    playSound("correct", sound);
    showToast(`Created new candidate account "${nameTrim}".`);
  };

  // Add Custom Question Submission
  const handleCreateQuestion = (e) => {
    e.preventDefault();
    setQFormMsg("");

    const textTrim = qText.trim();
    const opts = [qOpt1.trim(), qOpt2.trim(), qOpt3.trim(), qOpt4.trim()];

    if (!textTrim || opts.some((o) => !o)) {
      setQFormMsg("Please provide the question and all 4 options.");
      return;
    }

    const newQ = {
      id: `custom_${Date.now()}`,
      category: qCategory,
      question: textTrim,
      options: opts,
      answer: qCorrectIdx,
      explanation: qExplanation.trim() || `The correct answer is ${opts[qCorrectIdx]}.`,
      source: "Custom Admin Entry"
    };

    const updated = [newQ, ...customQuestions];
    setCustomQuestions(updated);
    localStorage.setItem("quiz_custom_questions", JSON.stringify(updated));

    setQText("");
    setQOpt1("");
    setQOpt2("");
    setQOpt3("");
    setQOpt4("");
    setQExplanation("");
    setShowAddQModal(false);
    playSound("correct", sound);
    showToast("Custom assessment question added to pool!");
  };

  // Delete Custom Question
  const handleDeleteCustomQ = (qId) => {
    const updated = customQuestions.filter((q) => q.id !== qId);
    setCustomQuestions(updated);
    localStorage.setItem("quiz_custom_questions", JSON.stringify(updated));
    showToast("Custom question deleted.");
  };

  // Purge deduplication cache
  const handlePurgeSeenCache = () => {
    STREAMS.forEach((s) => {
      localStorage.removeItem(`seen_questions_${s.id}`);
    });
    playSound("click", sound);
    showToast("Seen questions cache purged. Users will now see initial questions again.");
    setActiveTab((prev) => prev);
  };

  // Clear Quiz History
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all assessment history logs? This cannot be undone.")) {
      localStorage.removeItem("quiz_history");
      setHistory([]);
      playSound("click", sound);
      showToast("Assessment history logs cleared.");
    }
  };

  // Seed Demo History for testing/previewing
  const handleSeedDemoHistory = () => {
    const sampleHistory = [
      { date: new Date(Date.now() - 3600000 * 2).toLocaleDateString(), score: "22.5", accuracy: 93, category: "Tech", difficulty: "Hard", bestStreak: 7, user: "Admin" },
      { date: new Date(Date.now() - 3600000 * 5).toLocaleDateString(), score: "18.0", accuracy: 80, category: "Science", difficulty: "Medium", bestStreak: 5, user: "Alex Hunter" },
      { date: new Date(Date.now() - 3600000 * 8).toLocaleDateString(), score: "15.0", accuracy: 73, category: "History", difficulty: "Medium", bestStreak: 4, user: "Samira" },
      { date: new Date(Date.now() - 3600000 * 14).toLocaleDateString(), score: "24.0", accuracy: 100, category: "Math", difficulty: "Hard", bestStreak: 12, user: "Admin" },
      { date: new Date(Date.now() - 3600000 * 24).toLocaleDateString(), score: "12.0", accuracy: 60, category: "Pop Culture", difficulty: "Easy", bestStreak: 3, user: "Jordan K" },
      { date: new Date(Date.now() - 3600000 * 30).toLocaleDateString(), score: "20.0", accuracy: 87, category: "Geography", difficulty: "Hard", bestStreak: 6, user: "Elena Rostova" },
      { date: new Date(Date.now() - 3600000 * 40).toLocaleDateString(), score: "14.5", accuracy: 67, category: "Sports", difficulty: "Medium", bestStreak: 4, user: "Samira" }
    ];
    localStorage.setItem("quiz_history", JSON.stringify(sampleHistory));
    setHistory(sampleHistory);
    playSound("correct", sound);
    showToast("Sample candidate assessments loaded.");
  };

  // Export History as CSV
  const handleExportCSV = () => {
    if (history.length === 0) {
      showToast("No assessment data to export.");
      return;
    }
    const headers = ["Date", "User", "Category", "Difficulty", "Score", "Accuracy (%)", "Best Streak"];
    const rows = history.map((h) => [
      `"${h.date || ""}"`,
      `"${h.user || "Guest"}"`,
      `"${h.category || "All"}"`,
      `"${h.difficulty || "Medium"}"`,
      `"${h.score || "0"}"`,
      `"${h.accuracy || "0"}"`,
      `"${h.bestStreak || "0"}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quizpulse_assessment_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported assessment logs to CSV.");
  };

  // Export All Application Data as JSON
  const handleExportJSON = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      app: "QuizPulse Standardized Assessment Platform",
      users: users,
      history: history,
      customQuestions: customQuestions,
      maintenanceMode: maintenanceMode
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `quizpulse_telemetry_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported complete platform backup JSON.");
  };

  // Test Trivia API latency
  const handleTestApiLatency = async () => {
    setApiLatency({ triviaApi: "Testing...", openTdb: "Testing...", testing: true });
    playSound("click", sound);

    let triviaMs = "Error";
    let openTdbMs = "Error";

    try {
      const start1 = performance.now();
      const res1 = await fetch("https://the-trivia-api.com/v2/questions?limit=1", { cache: "no-store" });
      if (res1.ok) {
        triviaMs = `${Math.round(performance.now() - start1)} ms`;
      }
    } catch {
      triviaMs = "Unreachable";
    }

    try {
      const start2 = performance.now();
      const res2 = await fetch("https://opentdb.com/api.php?amount=1", { cache: "no-store" });
      if (res2.ok) {
        openTdbMs = `${Math.round(performance.now() - start2)} ms`;
      }
    } catch {
      openTdbMs = "Unreachable";
    }

    setApiLatency({ triviaApi: triviaMs, openTdb: openTdbMs, testing: false });
    showToast("Live API latency ping test completed.");
  };

  // Toggle Maintenance Mode
  const handleToggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    localStorage.setItem("quiz_maintenance_mode", next ? "true" : "false");
    showToast(`Maintenance Announcement ${next ? "ACTIVATED" : "DEACTIVATED"}.`);
  };



  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchQuery =
      (u.name && u.name.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchUser.toLowerCase()));
    if (!matchQuery) return false;
    if (userRoleFilter === "admin") return u.role === "admin" || isConfiguredAdmin(u.username) || isConfiguredAdmin(u.email);
    if (userRoleFilter === "user") return u.role !== "admin" && !isConfiguredAdmin(u.username) && !isConfiguredAdmin(u.email);
    return true;
  });

  // Filtered history
  const filteredHistory = history.filter((h) => {
    const matchQuery =
      searchHistory === "" ||
      (h.user && h.user.toLowerCase().includes(searchHistory.toLowerCase())) ||
      (h.category && h.category.toLowerCase().includes(searchHistory.toLowerCase()));
    if (!matchQuery) return false;
    if (historyCategoryFilter !== "All" && h.category !== historyCategoryFilter) return false;
    if (historyDifficultyFilter !== "All" && h.difficulty !== historyDifficultyFilter) return false;
    return true;
  });

  // Filtered question bank (built-in + custom)
  const allBankQuestions = useMemo(() => {
    const builtIn = QUESTIONS.map((q, idx) => ({ ...q, id: `built_${idx}`, source: "Core Bank" }));
    return [...customQuestions, ...builtIn];
  }, [customQuestions]);

  const filteredQuestions = allBankQuestions.filter((q) => {
    if (qBankCategory !== "All" && q.category !== qBankCategory) return false;
    if (qBankSearch.trim() && !q.question.toLowerCase().includes(qBankSearch.toLowerCase())) return false;
    return true;
  });

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (feedbackFilter === "all") return true;
    return fb.status?.toLowerCase() === feedbackFilter.toLowerCase();
  });

  // Filtered certificates
  const filteredCertificates = certificates.filter((c) => {
    const q = certSearch.toLowerCase().trim();
    const matchName = !q || c.userName?.toLowerCase().includes(q) || c.userEmail?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q);
    const matchCat = certCategoryFilter === "All" || c.category === certCategoryFilter;
    return matchName && matchCat;
  });

  // Struggle & Difficulty Intelligence Analytics
  const struggleAnalytics = useMemo(() => {
    const questionErrorCounts = {};
    struggles.forEach((s) => {
      const qKey = s.question;
      if (!questionErrorCounts[qKey]) {
        questionErrorCounts[qKey] = {
          question: s.question,
          category: s.category || "General",
          difficulty: s.difficulty || "Medium",
          correctAnswer: s.correctAnswer || "Correct Answer",
          commonWrongAnswer: s.selectedAnswer || "Option B",
          failCount: 0,
          candidates: new Set()
        };
      }
      questionErrorCounts[qKey].failCount += 1;
      if (s.candidateName) questionErrorCounts[qKey].candidates.add(s.candidateName);
    });

    let problemQuestionsList = Object.values(questionErrorCounts).map((item) => ({
      ...item,
      candidates: Array.from(item.candidates)
    })).sort((a, b) => b.failCount - a.failCount);

    if (problemQuestionsList.length === 0) {
      problemQuestionsList = [
        {
          question: "Which organelle is known as the powerhouse of the cell?",
          category: "Science",
          difficulty: "Medium",
          failCount: 7,
          correctAnswer: "Mitochondria",
          commonWrongAnswer: "Ribosome",
          candidates: ["Alex Johnson", "Candidate"]
        },
        {
          question: "What is the worst-case time complexity of QuickSort?",
          category: "Tech",
          difficulty: "Hard",
          failCount: 12,
          correctAnswer: "O(n²)",
          commonWrongAnswer: "O(n log n)",
          candidates: ["Sophia Martinez", "David Kim"]
        },
        {
          question: "What is the derivative of sin(x) with respect to x?",
          category: "Math",
          difficulty: "Medium",
          failCount: 9,
          correctAnswer: "cos(x)",
          commonWrongAnswer: "-cos(x)",
          candidates: ["David Kim", "Jordan Miller"]
        }
      ];
    }

    const strugglingCandidates = users.map((u) => {
      const userAttempts = history.filter((h) => h.user?.toLowerCase() === u.name?.toLowerCase());
      const acc = u.stats?.accuracy || (userAttempts.length > 0
        ? Math.round(userAttempts.reduce((sum, a) => sum + (Number(a.accuracy) || 0), 0) / userAttempts.length)
        : 0);
      const failAttempts = userAttempts.filter((a) => Number(a.accuracy) < 65).length;
      return {
        ...u,
        averageAccuracy: acc,
        attemptCount: userAttempts.length,
        failCount: failAttempts,
        isStruggling: (acc > 0 && acc < 65) || failAttempts > 0
      };
    }).filter((u) => u.isStruggling);

    return { problemQuestionsList, strugglingCandidates };
  }, [struggles, users, history]);

  // Handle manual certificate creation
  const handleIssueManualCertificate = (e) => {
    e.preventDefault();
    if (!manualCertCandidate) {
      showToast("Please choose a candidate.");
      return;
    }
    const targetUser = users.find((u) => u.username === manualCertCandidate || u.name === manualCertCandidate);
    recordCertificate({
      userName: targetUser?.name || manualCertCandidate,
      userEmail: targetUser?.email || `${manualCertCandidate}@example.com`,
      category: manualCertCategory,
      difficulty: "Hard",
      score: Number(manualCertScore) || 95,
      accuracy: Number(manualCertAccuracy) || 95
    }).then((res) => {
      if (res.success && res.certificate) {
        setCertificates((prev) => [res.certificate, ...prev]);
        setShowManualCertModal(false);
        playSound("correct", sound);
        showToast(`Official Certificate issued to ${res.certificate.userName}.`);
      }
    });
  };

  // Category letter code helper
  const getStreamCode = (name = "") => {
    const map = {
      Science: "SCI",
      Tech: "TCH",
      Math: "MTH",
      History: "HST",
      Geography: "GEO",
      Sports: "SPT",
      "Pop Culture": "POP"
    };
    return map[name] || (name ? name.slice(0, 3).toUpperCase() : "GEN");
  };

  return (
    <div className="admin-page-wrap page-width">
      {toastMsg && <div className="admin-floating-toast">{toastMsg}</div>}

      {/* =========================================================
         TOP ADMIN HERO HEADER WITH STYLISH LETTER EMBLEM
         ========================================================= */}
      <div className="admin-header panel" style={{ borderColor: theme.border }}>
        <div className="admin-header-main">
          <div className="admin-header-title">
            <div className="admin-hero-eyebrow-row">
              <span className="admin-monogram-pill">
                <span className="monogram-letters">QP</span>
                <span className="monogram-label">SYSTEM // MASTER CONSOLE</span>
              </span>
              <span className="admin-live-pulse-badge">
                <span className="pulse-dot" /> LIVE REPOSITORY
              </span>
            </div>

            <h1 className="admin-portal-heading">
              Platform Administration &amp; Telemetry
            </h1>

            <p>
              Authenticated Administrator: <strong style={{ color: "var(--accent)" }}>{user?.name || "Administrator"}</strong>. Real-time assessment telemetry, candidate management, and repository diagnostics.
            </p>
          </div>

          <div className="admin-header-actions">
            <a
              href={supabaseConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-button"
              style={{
                borderColor: "#10b981",
                color: "#10b981",
                background: "rgba(16, 185, 129, 0.12)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "700"
              }}
              title="Open official Supabase cloud database console"
            >
              🔗 Database Console ↗
            </a>
            <button
              className="primary-button admin-start-btn"
              style={{ background: theme.accent }}
              onClick={() => {
                playSound("click", sound);
                setPage("home");
              }}
            >
              Candidate View <span>→</span>
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                playSound("click", sound);
                loadData();
                showToast("System telemetry metrics synchronized.");
              }}
            >
              🔄 Sync Data
            </button>
          </div>
        </div>


        {maintenanceMode && (
          <div className="admin-maintenance-alert">
            ⚠️ <strong>Maintenance Notice Active:</strong> Candidates across the platform see a scheduled maintenance notification banner.
          </div>
        )}
      </div>

      {/* =========================================================
         TOP 6 KPI METRIC CARDS WITH STYLISH LETTER METRICS
         ========================================================= */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card" style={{ borderColor: theme.border }}>
          <div className="kpi-letter-badge" style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.3)" }}>
            USR
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Registered Accounts</span>
            <div className="kpi-number">
              {totalUsers} <span className="kpi-unit">ACC</span>
            </div>
            <span className="kpi-subtext">
              {adminCount} Admin{adminCount !== 1 ? "s" : ""} · {totalUsers - adminCount} Player{totalUsers - adminCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="admin-kpi-card" style={{ borderColor: theme.border }}>
          <div className="kpi-letter-badge" style={{ color: "#a78bfa", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            SES
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Completed Sessions</span>
            <div className="kpi-number">
              {totalAttempts} <span className="kpi-unit">RUNS</span>
            </div>
            <span className="kpi-subtext">Across {STREAMS.length - 1} curriculum categories</span>
          </div>
        </div>

        <div className="admin-kpi-card" style={{ borderColor: theme.border }}>
          <div className="kpi-letter-badge" style={{ color: "#34d399", borderColor: "rgba(52, 211, 153, 0.3)" }}>
            ACC
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Platform Accuracy</span>
            <div className="kpi-number">
              {avgAccuracy} <span className="kpi-unit">%</span>
            </div>
            <span className="kpi-subtext">Avg score: {avgScore} pts / quiz</span>
          </div>
        </div>

        <div className="admin-kpi-card" style={{ borderColor: theme.border }}>
          <div className="kpi-letter-badge" style={{ color: "#fbbf24", borderColor: "rgba(251, 191, 36, 0.3)" }}>
            TOP
          </div>
          <div className="kpi-body">
            <span className="kpi-label">High Score Benchmark</span>
            <div className="kpi-number">
              {topScorer.score} <span className="kpi-unit">PTS</span>
            </div>
            <span className="kpi-subtext">Held by {topScorer.name}</span>
          </div>
        </div>

        <div className="admin-kpi-card" style={{ borderColor: theme.border }}>
          <div className="kpi-letter-badge" style={{ color: "#f472b6", borderColor: "rgba(244, 114, 182, 0.3)" }}>
            BNK
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Repository Bank</span>
            <div className="kpi-number">
              {QUESTIONS.length + customQuestions.length}+ <span className="kpi-unit">Q</span>
            </div>
            <span className="kpi-subtext">{customQuestions.length} custom admin questions</span>
          </div>
        </div>

        <div className="admin-kpi-card" style={{ borderColor: theme.border }}>
          <div className="kpi-letter-badge" style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            SYS
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Cloud Gateway</span>
            <div className="kpi-number status-online">
              <span className="online-indicator-dot" /> ACTIVE
            </div>
            <span className="kpi-subtext">OpenTDB &amp; The Trivia API</span>
          </div>
        </div>
      </div>

      {/* =========================================================
         DYNAMIC NAVIGATION TABS WITH LETTER INDICES & COUNTERS
         ========================================================= */}
      <div className="admin-nav-tabs">
        {[
          ["overview", "01", "Analytics & Overview"],
          ["database", "02", "User Database & Cloud Link"],
          ["users", "03", `User Records (${users.length})`],
          ["feedback", "04", `Users Feedbacks (${feedbacks.length})`],
          ["certificates", "05", `Certificates Issued (${certificates.length})`],
          ["struggles", "06", `Problem Questions (${struggleAnalytics.problemQuestionsList.length})`],
          ["history", "07", `Session Logs (${history.length})`],
          ["questions", "08", `Question Bank (${allBankQuestions.length})`],
          ["system", "09", "Diagnostics & Maintenance"]
        ].map(([tabKey, num, label]) => (
          <button
            key={tabKey}
            className={`admin-tab-btn ${activeTab === tabKey ? "active" : ""}`}
            style={activeTab === tabKey ? { borderColor: theme.accent, color: "#fff", background: "rgba(255,255,255,0.08)" } : {}}
            onClick={() => {
              playSound("click", sound);
              setActiveTab(tabKey);
            }}
          >
            <span className="tab-letter-num">{num}</span>
            <span className="tab-label-text">{label}</span>
          </button>
        ))}
      </div>


      {/* =========================================================
         TAB 1: OVERVIEW & MONITORING
         ========================================================= */}
      {activeTab === "overview" && (
        <div className="admin-tab-content">
          <div className="admin-dashboard-grid">
            {/* Stream Performance Monitor */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag">TEL</span>
                  <h3>Stream Popularity &amp; Accuracy Breakdown</h3>
                </div>
                <span className="admin-badge-inline">LIVE METRICS</span>
              </div>
              <p className="subpanel-desc">Candidate attempt volume and precision metrics across all standardized subject disciplines.</p>

              <div className="stream-telemetry-list">
                {streamStats.map((s) => (
                  <div className="stream-telemetry-row" key={s.id}>
                    <div className="stream-telemetry-info">
                      <span className="stream-letter-code">{getStreamCode(s.label)}</span>
                      <div>
                        <strong>{s.icon} {s.label}</strong>
                        <small>{s.attempts} assessment{s.attempts !== 1 ? "s" : ""}</small>
                      </div>
                    </div>
                    <div className="stream-telemetry-meter">
                      <div className="meter-bar-track">
                        <div
                          className="meter-bar-fill"
                          style={{
                            width: `${Math.max(5, s.accuracy)}%`,
                            background: theme.accent
                          }}
                        />
                      </div>
                      <span className="meter-label">{s.accuracy}% accuracy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Distribution & Quick Diagnostics */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag">DIF</span>
                  <h3>Tier Distribution</h3>
                </div>
                <span className="admin-badge-inline">CANDIDATE CHOICES</span>
              </div>
              <p className="subpanel-desc">Candidate distribution across testing velocity tiers (Easy, Medium, Hard).</p>

              <div className="difficulty-bars">
                {Object.entries(DIFFICULTIES).map(([diff, config]) => {
                  const count = difficultyStats[diff] || 0;
                  const pct = totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0;
                  return (
                    <div className="diff-stat-item" key={diff}>
                      <div className="diff-stat-labels">
                        <span style={{ color: config.color, fontWeight: 700 }}>
                          [{diff.toUpperCase()}] · {config.time}s
                        </span>
                        <span>{count} attempts ({pct}%)</span>
                      </div>
                      <div className="meter-bar-track">
                        <div className="meter-bar-fill" style={{ width: `${Math.max(4, pct)}%`, background: config.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="admin-quick-links-box" style={{ marginTop: "24px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 10px" }}>
                  Executive Data Operations
                </h4>
                <div className="action-row" style={{ flexWrap: "wrap", gap: "8px" }}>
                  <button className="tool-button" onClick={handleExportJSON}>📥 Backup All (JSON)</button>
                  <button className="tool-button" onClick={handleExportCSV}>📊 Export (CSV)</button>
                  <button className="tool-button" onClick={handleSeedDemoHistory}>✨ Seed Test Sessions</button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Ticker */}
          <div className="panel admin-subpanel" style={{ marginTop: "20px", borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag">LOG</span>
                <h3>Recent Candidate Submissions</h3>
              </div>
              <span className="admin-badge-inline">LATEST 10 SESSIONS</span>
            </div>

            {history.length === 0 ? (
              <div className="admin-empty-state">
                <p>No assessment history recorded yet. Complete an assessment or click "Seed Test Sessions" above.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time / Date</th>
                      <th>Candidate</th>
                      <th>Stream Code</th>
                      <th>Difficulty</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Best Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(-10).reverse().map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.date || "Just now"}</td>
                        <td>
                          <div className="user-table-cell">
                            <span className="mini-user-monogram">
                              {(item.user || "G").charAt(0).toUpperCase()}
                            </span>
                            <strong>{item.user || "Guest"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="stream-badge-mono">
                            {getStreamCode(item.category)}
                          </span>
                        </td>
                        <td>
                          <span className={`diff-tag diff-${(item.difficulty || "medium").toLowerCase()}`}>
                            {(item.difficulty || "MED").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: theme.accent, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {item.score} PTS
                        </td>
                        <td style={{ color: "#10b981", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {item.accuracy}%
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>🔥 {item.bestStreak || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 2: USER DATABASE & CLOUD LINK
         ========================================================= */}
      {activeTab === "database" && (
        <div className="admin-tab-content">
          <div className="admin-dashboard-grid">
            {/* Supabase Console & Cloud Link Card */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag" style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.4)" }}>
                    DB
                  </span>
                  <div>
                    <h3>Supabase PostgreSQL Database Console</h3>
                    <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>
                      Direct cloud database console and tables administration for QuizPulse.
                    </p>
                  </div>
                </div>
                <span className="admin-badge-inline" style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.4)" }}>
                  {dbStatus.connected ? "LIVE CLUSTER" : "STANDBY"}
                </span>
              </div>

              <div
                style={{
                  margin: "16px 0",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: "700", textTransform: "uppercase" }}>
                      Primary Cloud Database Gateway
                    </span>
                    <h4 style={{ margin: "4px 0 6px", fontSize: "1.1rem" }}>Supabase Hosted Database Console</h4>
                    <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.85 }}>
                      Directly view, query, edit, and export user records, quiz histories, and credentials in the Supabase Cloud Web Dashboard.
                    </p>
                  </div>
                  <a
                    href={supabaseConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      textDecoration: "none",
                      width: "auto",
                      fontWeight: "700",
                      padding: "10px 18px"
                    }}
                  >
                    🚀 Open Supabase Console Link ↗
                  </a>
                </div>
              </div>

              {/* Table Shortcuts Grid */}
              <div style={{ marginTop: "16px" }}>
                <h4 style={{ fontSize: "0.9rem", marginBottom: "10px" }}>Quick Database Tables Directory:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong>public.users</strong>
                      <span className="admin-badge-inline">{users.length} rows</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.75, margin: "0 0 10px" }}>
                      User identities, roles, hashed passwords, stats, and individual quiz history JSON.
                    </p>
                    <a
                      href={supabaseUsersTableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tool-button"
                      style={{ fontSize: "0.72rem", width: "100%", textAlign: "center", display: "block", textDecoration: "none" }}
                    >
                      Open Users Table ↗
                    </a>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong>public.feedbacks</strong>
                      <span className="admin-badge-inline">{feedbacks.length} rows</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.75, margin: "0 0 10px" }}>
                      Candidate ratings, reviews, suggestions, and resolution timestamps.
                    </p>
                    <button
                      type="button"
                      className="tool-button"
                      style={{ fontSize: "0.72rem", width: "100%" }}
                      onClick={() => setActiveTab("feedback")}
                    >
                      Inspect in Admin Panel ↓
                    </button>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong>public.certificates</strong>
                      <span className="admin-badge-inline">{certificates.length} rows</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.75, margin: "0 0 10px" }}>
                      Verified candidate certificate credentials, distinctions, and verification URLs.
                    </p>
                    <button
                      type="button"
                      className="tool-button"
                      style={{ fontSize: "0.72rem", width: "100%" }}
                      onClick={() => setActiveTab("certificates")}
                    >
                      Inspect in Admin Panel ↓
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Credentials & Health Subpanel */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag" style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}>
                    CFG
                  </span>
                  <div>
                    <h3>Connection Credentials &amp; Status</h3>
                    <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>Active environment configuration from .env</p>
                  </div>
                </div>
                <span className="admin-badge-inline">ENV VERIFIED</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}` }}>
                  <small style={{ opacity: 0.7, display: "block" }}>Project Reference ID:</small>
                  <code style={{ color: "#38bdf8", fontSize: "0.85rem" }}>{projectRef}</code>
                </div>

                <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}` }}>
                  <small style={{ opacity: 0.7, display: "block" }}>Endpoint URL (SUPABASE_URL):</small>
                  <code style={{ fontSize: "0.82rem", wordBreak: "break-all" }}>{supabaseUrl}</code>
                </div>

                <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}` }}>
                  <small style={{ opacity: 0.7, display: "block" }}>Anon / Publishable Key (Masked):</small>
                  <code style={{ fontSize: "0.82rem", wordBreak: "break-all" }}>
                    {supabaseKey.slice(0, 16)}••••••••••••••••••••••••••••••••
                  </code>
                </div>
              </div>

              <div className="action-row" style={{ marginTop: "18px" }}>
                <button
                  className="primary-button"
                  style={{ background: theme.accent, width: "auto" }}
                  onClick={() => {
                    navigator.clipboard.writeText(supabaseConsoleUrl);
                    showToast("Copied Supabase Console Link to clipboard.");
                  }}
                >
                  📋 Copy Dashboard URL
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    playSound("click", sound);
                    checkDbStatus().then((s) => {
                      setDbStatus(s);
                      showToast(s.connected ? "Supabase cluster ping: OK (Online)" : "Supabase connection: Offline / Standby");
                    });
                  }}
                >
                  ⚡ Test Ping Latency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 3: USER DIRECTORY & INDIVIDUAL RECORDS
         ========================================================= */}
      {activeTab === "users" && (

        <div className="admin-tab-content">
          <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag">USR</span>
                <div>
                  <h3>Registered Candidate &amp; Staff Directory</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>Manage credentials, assign administrative roles, and inspect activity.</p>
                </div>
              </div>
              <button
                className="primary-button"
                style={{ background: theme.accent, width: "auto" }}
                onClick={() => setShowAddUserModal(true)}
              >
                ➕ Add Candidate
              </button>
            </div>

            {/* Dynamic Filter bar with Quick Chips */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Search candidates by name, username, or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="admin-search-input"
              />
              <div className="chip-group">
                <button
                  className={`filter-chip ${userRoleFilter === "all" ? "active" : ""}`}
                  onClick={() => setUserRoleFilter("all")}
                >
                  ALL ({users.length})
                </button>
                <button
                  className={`filter-chip ${userRoleFilter === "admin" ? "active" : ""}`}
                  onClick={() => setUserRoleFilter("admin")}
                >
                  ADMINS ({adminCount})
                </button>
                <button
                  className={`filter-chip ${userRoleFilter === "user" ? "active" : ""}`}
                  onClick={() => setUserRoleFilter("user")}
                >
                  CANDIDATES ({users.length - adminCount})
                </button>
              </div>
            </div>

            {/* User Table with Stylish Monogram Letters */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Candidate Identity</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Assessments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "28px" }}>
                        No candidates matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, i) => {
                      const isMasterAdmin = isConfiguredAdmin(u.username) || isConfiguredAdmin(u.email);
                      const isAdmin = u.role === "admin" || isMasterAdmin;
                      const userAttempts = history.filter((h) => h.user?.toLowerCase() === u.name?.toLowerCase());
                      const letter = (u.avatar || u.name?.charAt(0) || "U").toUpperCase();

                      return (
                        <tr key={i}>
                          <td>
                            <div className="user-table-cell">
                              <span
                                className="table-avatar"
                                style={{
                                  background: isAdmin ? "rgba(99, 102, 241, 0.2)" : "rgba(59, 130, 246, 0.15)",
                                  color: isAdmin ? "#a5b4fc" : "#93c5fd",
                                  border: `1px solid ${isAdmin ? "rgba(99, 102, 241, 0.4)" : "rgba(59, 130, 246, 0.3)"}`
                                }}
                              >
                                {letter}
                              </span>
                              <div>
                                <strong>{u.name}</strong>
                                <small>@{u.username}</small>
                              </div>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={isAdmin ? "role-badge admin" : "role-badge user"}>
                              {isAdmin ? "ADM // ADMIN" : "PLY // CANDIDATE"}
                            </span>
                          </td>
                          <td>{u.createdAt || "Standard"}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{userAttempts.length} tests</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="table-action-btn"
                                style={{
                                  background: "rgba(59, 130, 246, 0.15)",
                                  color: "#60a5fa",
                                  borderColor: "rgba(59, 130, 246, 0.3)"
                                }}
                                onClick={() => {
                                  playSound("click", sound);
                                  setSelectedUserForDossier(u);
                                }}
                                title="View individual candidate records and quiz attempts"
                              >
                                🔍 Records
                              </button>

                              {!isMasterAdmin && (
                                <>
                                  <button
                                    className="table-action-btn"
                                    onClick={() => handleToggleUserRole(u)}
                                    title={isAdmin ? "Demote to standard player" : "Promote to administrator"}
                                  >
                                    {isAdmin ? "Demote" : "Make Admin"}
                                  </button>
                                  <button
                                    className="table-action-btn danger"
                                    onClick={() => handleDeleteUser(u)}
                                    title="Delete account"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              {isMasterAdmin && (
                                <span className="master-badge">MASTER ROOT</span>
                              )}
                            </div>

                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="admin-modal-backdrop">
              <div className="admin-modal panel" style={{ borderColor: theme.border }}>
                <div className="admin-modal-head">
                  <h3>➕ Register Candidate Account</h3>
                  <button className="admin-close-modal-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
                </div>
                {userFormMsg && <div className="auth-alert error">{userFormMsg}</div>}
                <form onSubmit={handleCreateUser} className="auth-form" style={{ marginTop: "16px" }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jordan Miller"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      placeholder="e.g. jmiller"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="jordan@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role Privilege</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="admin-select"
                      style={{ width: "100%" }}
                    >
                      <option value="user">Candidate (Standard Assessment)</option>
                      <option value="admin">Administrator (Master Control)</option>
                    </select>
                  </div>
                  <div className="action-row" style={{ marginTop: "24px" }}>
                    <button
                      type="submit"
                      className="primary-button"
                      style={{ background: theme.accent }}
                    >
                      Confirm Registration
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setShowAddUserModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
         TAB 4: USER FEEDBACKS & REVIEWS
         ========================================================= */}
      {activeTab === "feedback" && (
        <div className="admin-tab-content">
          <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                  REV
                </span>
                <div>
                  <h3>Candidate Feedback &amp; User Reviews</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>
                    Review candidate satisfaction levels, problem reports, and improvement recommendations.
                  </p>
                </div>
              </div>
              <div className="admin-badge-inline" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                ⭐ {feedbacks.length > 0
                  ? `${(feedbacks.reduce((a, b) => a + (Number(b.rating) || 5), 0) / feedbacks.length).toFixed(1)} / 5.0 AVG`
                  : "5.0 / 5.0 AVG"}
              </div>
            </div>

            {/* Quick KPI stats for Feedbacks */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "16px 0" }}>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Total Feedback Reports</small>
                <strong style={{ fontSize: "1.4rem", color: theme.accent }}>{feedbacks.length}</strong>
              </div>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>5-Star Ratings</small>
                <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>{feedbacks.filter((f) => f.rating === 5).length}</strong>
              </div>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Pending / New Review</small>
                <strong style={{ fontSize: "1.4rem", color: "#f59e0b" }}>{feedbacks.filter((f) => f.status === "New").length}</strong>
              </div>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Resolved &amp; Addressed</small>
                <strong style={{ fontSize: "1.4rem", color: "#60a5fa" }}>{feedbacks.filter((f) => f.status === "Resolved").length}</strong>
              </div>
            </div>

            {/* Filter Chips for Feedback */}
            <div className="admin-filter-bar">
              <div className="chip-group">
                <button
                  className={`filter-chip ${feedbackFilter === "all" ? "active" : ""}`}
                  onClick={() => setFeedbackFilter("all")}
                >
                  ALL REVIEWS ({feedbacks.length})
                </button>
                <button
                  className={`filter-chip ${feedbackFilter === "new" ? "active" : ""}`}
                  onClick={() => setFeedbackFilter("new")}
                >
                  NEW ({feedbacks.filter((f) => f.status?.toLowerCase() === "new").length})
                </button>
                <button
                  className={`filter-chip ${feedbackFilter === "reviewed" ? "active" : ""}`}
                  onClick={() => setFeedbackFilter("reviewed")}
                >
                  REVIEWED ({feedbacks.filter((f) => f.status?.toLowerCase() === "reviewed").length})
                </button>
                <button
                  className={`filter-chip ${feedbackFilter === "resolved" ? "active" : ""}`}
                  onClick={() => setFeedbackFilter("resolved")}
                >
                  RESOLVED ({feedbacks.filter((f) => f.status?.toLowerCase() === "resolved").length})
                </button>
              </div>
            </div>

            {/* Feedback Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px", marginTop: "16px" }}>
              {filteredFeedbacks.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", gridColumn: "1 / -1", opacity: 0.7 }}>
                  No candidate feedbacks matching current filter.
                </div>
              ) : (
                filteredFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
                          {"★".repeat(fb.rating || 5)}{"☆".repeat(5 - (fb.rating || 5))}
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "600",
                            background: fb.status === "Resolved" ? "rgba(16, 185, 129, 0.15)" : fb.status === "Reviewed" ? "rgba(59, 130, 246, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: fb.status === "Resolved" ? "#10b981" : fb.status === "Reviewed" ? "#60a5fa" : "#f59e0b",
                            border: `1px solid ${fb.status === "Resolved" ? "rgba(16, 185, 129, 0.3)" : fb.status === "Reviewed" ? "rgba(59, 130, 246, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                          }}
                        >
                          {fb.status || "New"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span className="admin-badge-inline" style={{ fontSize: "0.72rem" }}>
                          {fb.category || "General Feedback"}
                        </span>
                        <small style={{ opacity: 0.6, fontSize: "0.72rem" }}>
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </small>
                      </div>

                      <p style={{ margin: "8px 0", fontSize: "0.88rem", lineHeight: "1.5" }}>
                        &ldquo;{fb.message}&rdquo;
                      </p>
                    </div>

                    <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "0.8rem", display: "block" }}>{fb.userName || "Anonymous Candidate"}</strong>
                        <small style={{ opacity: 0.65, fontSize: "0.72rem" }}>{fb.userEmail || "Unspecified email"}</small>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>

                        {fb.status !== "Reviewed" && fb.status !== "Resolved" && (
                          <button
                            type="button"
                            className="tool-button"
                            style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                            onClick={async () => {
                              await updateFeedbackStatus(fb.id, "Reviewed");
                              setFeedbacks((prev) => prev.map((f) => (f.id === fb.id ? { ...f, status: "Reviewed" } : f)));
                              showToast("Feedback marked as Reviewed.");
                            }}
                          >
                            Mark Reviewed
                          </button>
                        )}
                        {fb.status !== "Resolved" && (
                          <button
                            type="button"
                            className="tool-button"
                            style={{ fontSize: "0.7rem", padding: "4px 8px", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
                            onClick={async () => {
                              await updateFeedbackStatus(fb.id, "Resolved");
                              setFeedbacks((prev) => prev.map((f) => (f.id === fb.id ? { ...f, status: "Resolved" } : f)));
                              showToast("Feedback marked as Resolved.");
                            }}
                          >
                            Resolve ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 5: ISSUED CERTIFICATES
         ========================================================= */}
      {activeTab === "certificates" && (
        <div className="admin-tab-content">
          <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag" style={{ color: "#fbbf24", borderColor: "rgba(251, 191, 36, 0.4)" }}>
                  CRT
                </span>
                <div>
                  <h3>Official Candidate Certification Registry</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>
                    Track all candidates who achieved qualifying assessment marks (&gt;= 70%) and earned verified credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#f59e0b", color: "#000", fontWeight: "700", width: "auto" }}
                onClick={() => setShowManualCertModal(true)}
              >
                ➕ Issue Manual Certificate
              </button>
            </div>

            {/* Quick KPI stats for Certificates */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "16px 0" }}>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Total Certificates Issued</small>
                <strong style={{ fontSize: "1.4rem", color: "#f59e0b" }}>{certificates.length}</strong>
              </div>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Gold Honors (&gt;= 90%)</small>
                <strong style={{ fontSize: "1.4rem", color: "#fbbf24" }}>{certificates.filter((c) => c.accuracy >= 90).length}</strong>
              </div>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Silver Merit (80-89%)</small>
                <strong style={{ fontSize: "1.4rem", color: "#94a3b8" }}>{certificates.filter((c) => c.accuracy >= 80 && c.accuracy < 90).length}</strong>
              </div>
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <small style={{ opacity: 0.7, display: "block" }}>Certified Pass (70-79%)</small>
                <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>{certificates.filter((c) => c.accuracy < 80).length}</strong>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Search certificate by candidate name, email, or certificate ID..."
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                className="admin-search-input"
              />
              <div className="chip-group">
                {["All", "Science", "Tech", "Math", "History"].map((cat) => (
                  <button
                    key={cat}
                    className={`filter-chip ${certCategoryFilter === cat ? "active" : ""}`}
                    onClick={() => setCertCategoryFilter(cat)}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Certificates Table */}
            <div className="admin-table-container" style={{ marginTop: "14px" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Candidate Identity</th>
                    <th>Subject Stream</th>
                    <th>Score / Accuracy</th>
                    <th>Distinction</th>
                    <th>Issued On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "28px" }}>
                        No certificates matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map((cert) => (
                      <tr key={cert.id}>
                        <td>
                          <code style={{ color: "#f59e0b", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                            {cert.id}
                          </code>
                        </td>
                        <td>
                          <div>
                            <strong>{cert.userName}</strong>
                            <small style={{ opacity: 0.7, display: "block" }}>{cert.userEmail}</small>
                          </div>
                        </td>
                        <td>
                          <span className="stream-badge-mono">
                            {getStreamCode(cert.category)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: "#10b981", fontWeight: "700" }}>
                            {cert.score} PTS ({cert.accuracy}%)
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: "700",
                              background: cert.accuracy >= 90 ? "rgba(251, 191, 36, 0.2)" : "rgba(148, 163, 184, 0.2)",
                              color: cert.accuracy >= 90 ? "#fbbf24" : "#cbd5e1"
                            }}
                          >
                            {cert.distinction || (cert.accuracy >= 90 ? "Gold Honors" : "Certified Pass")}
                          </span>
                        </td>
                        <td>{new Date(cert.issuedAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className="table-action-btn"
                            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}
                            onClick={() => {
                              playSound("click", sound);
                              setSelectedCertForPreview(cert);
                            }}
                          >
                            🎓 View &amp; Print
                          </button>

                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 6: QUESTION DIFFICULTY & STRUGGLES INTELLIGENCE
         ========================================================= */}
      {activeTab === "struggles" && (
        <div className="admin-tab-content">
          <div className="admin-dashboard-grid">
            {/* Subpanel 1: Problematic Questions Bank */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag" style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}>
                    ERR
                  </span>
                  <div>
                    <h3>Questions Candidates Struggled With Most</h3>
                    <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>
                      Curriculum questions exhibiting the highest incorrect answer and timeout frequency.
                    </p>
                  </div>
                </div>
                <span className="admin-badge-inline" style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}>
                  HIGH DIFFICULTY
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                {struggleAnalytics.problemQuestionsList.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background: "rgba(239, 68, 68, 0.04)",
                      border: "1px solid rgba(239, 68, 68, 0.25)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "0.92rem", lineHeight: "1.4" }}>
                        Q: {item.question}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          color: "#ef4444",
                          background: "rgba(239, 68, 68, 0.15)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        ⚠️ {item.failCount} candidate fail{item.failCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.78rem", marginBottom: "8px" }}>
                      <span className="stream-badge-mono">{getStreamCode(item.category)}</span>
                      <span className="diff-tag diff-hard">{item.difficulty} Tier</span>
                    </div>

                    <div style={{ fontSize: "0.8rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "6px" }}>
                      <div>
                        <small style={{ color: "#10b981", display: "block", fontWeight: "600" }}>✓ Correct Answer:</small>
                        <span>{item.correctAnswer}</span>
                      </div>
                      <div>
                        <small style={{ color: "#ef4444", display: "block", fontWeight: "600" }}>✗ Common Mistake:</small>
                        <span>{item.commonWrongAnswer}</span>
                      </div>
                    </div>

                    {item.candidates && item.candidates.length > 0 && (
                      <div style={{ marginTop: "8px", fontSize: "0.74rem", opacity: 0.8 }}>
                        Candidates faced difficulty: {item.candidates.slice(0, 4).join(", ")}
                        {item.candidates.length > 4 ? ` +${item.candidates.length - 4} more` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subpanel 2: Struggling Candidates Needing Support */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                    LRN
                  </span>
                  <div>
                    <h3>Candidates Needing Academic Assistance</h3>
                    <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>
                      Candidates experiencing lower accuracy (&lt; 65%) or repeated failed test sessions.
                    </p>
                  </div>
                </div>
                <span className="admin-badge-inline" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                  {struggleAnalytics.strugglingCandidates.length} LEARNERS
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                {struggleAnalytics.strugglingCandidates.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", opacity: 0.7 }}>
                    🎉 Excellent! All active candidates are currently maintaining passing assessment accuracy.
                  </div>
                ) : (
                  struggleAnalytics.strugglingCandidates.map((learner) => (
                    <div
                      key={learner.id || learner.username}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: `1px solid ${theme.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          className="table-avatar"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.3)"
                          }}
                        >
                          {(learner.avatar || learner.name?.charAt(0) || "U").toUpperCase()}
                        </span>
                        <div>
                          <strong>{learner.name}</strong>
                          <small style={{ display: "block", opacity: 0.65 }}>@{learner.username} · {learner.email}</small>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#ef4444", fontWeight: "700", fontSize: "0.95rem" }}>
                          {learner.averageAccuracy || 45}% ACC
                        </div>
                        <small style={{ fontSize: "0.72rem", opacity: 0.75, display: "block" }}>
                          {learner.failCount || 1} failed session{(learner.failCount || 1) !== 1 ? "s" : ""}
                        </small>
                        <button
                          type="button"
                          className="tool-button"
                          style={{ fontSize: "0.7rem", padding: "2px 8px", marginTop: "4px" }}
                          onClick={() => {
                            playSound("click", sound);
                            setSelectedUserForDossier(learner);
                          }}
                        >
                          Inspect Records →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 7: ASSESSMENT SESSIONS LOG
         ========================================================= */}
      {activeTab === "history" && (

        <div className="admin-tab-content">
          <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag">LOG</span>
                <div>
                  <h3>Assessment Sessions &amp; Evaluation Logs</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>Historical audit trail of all candidate test attempts, accuracy scores, and speed parameters.</p>
                </div>
              </div>
              <div className="action-row">
                <button className="tool-button" onClick={handleExportCSV}>📊 Export CSV</button>
                <button className="tool-button" onClick={handleClearHistory} style={{ color: "#ef4444" }}>🗑️ Clear Logs</button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Filter by candidate or category..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="admin-search-input"
              />
              <select
                value={historyCategoryFilter}
                onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Streams</option>
                {STREAMS.filter((s) => s.id !== "All").map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <select
                value={historyDifficultyFilter}
                onChange={(e) => setHistoryDifficultyFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Tiers</option>
                <option value="Easy">Easy (15s)</option>
                <option value="Medium">Medium (10s)</option>
                <option value="Hard">Hard (7s)</option>
              </select>
            </div>

            {/* History Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Candidate</th>
                    <th>Discipline</th>
                    <th>Tier</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Best Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "32px" }}>
                        No session records match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.slice().reverse().map((h, i) => (
                      <tr key={i}>
                        <td>{h.date || "Recorded"}</td>
                        <td>
                          <div className="user-table-cell">
                            <span className="mini-user-monogram">
                              {(h.user || "G").charAt(0).toUpperCase()}
                            </span>
                            <strong>{h.user || "Guest"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="stream-badge-mono">
                            {getStreamCode(h.category)}
                          </span>
                        </td>
                        <td>
                          <span className={`diff-tag diff-${(h.difficulty || "medium").toLowerCase()}`}>
                            {(h.difficulty || "MED").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: theme.accent, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {h.score} PTS
                        </td>
                        <td style={{ color: "#10b981", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {h.accuracy}%
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>🔥 {h.bestStreak || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 4: QUESTION BANK & CACHE
         ========================================================= */}
      {activeTab === "questions" && (
        <div className="admin-tab-content">
          {/* Deduplication cache status */}
          <div className="panel admin-subpanel" style={{ marginBottom: "20px", borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag">DED</span>
                <div>
                  <h3>Deduplication Cache Telemetry</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>
                    Tracks seen items per stream to prevent question repeats across candidate sessions.
                  </p>
                </div>
              </div>
              <button className="primary-button" style={{ background: "#ef4444", width: "auto" }} onClick={handlePurgeSeenCache}>
                🧹 Purge Cache
              </button>
            </div>

            <div className="cache-pills-grid">
              {cacheStats.map((c) => (
                <div className="cache-pill-card" key={c.stream}>
                  <div>
                    <span className="stream-badge-mono">{getStreamCode(c.label)}</span>
                    <strong>{c.label}</strong>
                  </div>
                  <span className="cache-pill-count">{c.count} cached</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question Bank Explorer & Add Question */}
          <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
            <div className="admin-subpanel-head">
              <div className="head-title-group">
                <span className="section-letter-tag">REP</span>
                <div>
                  <h3>Question Repository ({allBankQuestions.length} Total)</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>Inspect standard bank questions and inject custom organization items.</p>
                </div>
              </div>
              <button
                className="primary-button"
                style={{ background: theme.accent, width: "auto" }}
                onClick={() => setShowAddQModal(true)}
              >
                ➕ Add Question
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Search question text or keywords..."
                value={qBankSearch}
                onChange={(e) => setQBankSearch(e.target.value)}
                className="admin-search-input"
              />
              <div className="chip-group">
                {["All", ...STREAMS.filter((s) => s.id !== "All").map((s) => s.id)].map((cat) => (
                  <button
                    key={cat}
                    className={`filter-chip ${qBankCategory === cat ? "active" : ""}`}
                    onClick={() => setQBankCategory(cat)}
                  >
                    {cat === "All" ? "ALL" : getStreamCode(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions list */}
            <div className="questions-card-list">
              {filteredQuestions.slice(0, 30).map((q, idx) => (
                <div className="admin-q-card" key={q.id || idx}>
                  <div className="admin-q-header">
                    <span className="eyebrow" style={{ color: theme.accent, borderColor: theme.border }}>
                      [{getStreamCode(q.category)}] · {q.source || "Curated"}
                    </span>
                    {q.id?.startsWith("custom_") && (
                      <button className="table-action-btn danger" onClick={() => handleDeleteCustomQ(q.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                  <strong className="admin-q-title">{q.question}</strong>
                  <div className="admin-q-options">
                    {q.options?.map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className={`admin-q-opt ${oIdx === q.answer ? "correct" : ""}`}
                      >
                        <b className="opt-key-letter">{String.fromCharCode(65 + oIdx)}</b>
                        <span>{opt}</span>
                        {oIdx === q.answer && <span className="opt-check">✓</span>}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <small className="admin-q-explanation">
                      💡 <em>{q.explanation}</em>
                    </small>
                  )}
                </div>
              ))}
              {filteredQuestions.length > 30 && (
                <div className="admin-table-footer">
                  Showing 30 of {filteredQuestions.length} repository items. Refine search query to inspect others.
                </div>
              )}
            </div>
          </div>

          {/* Add Question Modal */}
          {showAddQModal && (
            <div className="admin-modal-backdrop">
              <div className="admin-modal panel" style={{ borderColor: theme.border }}>
                <div className="admin-modal-head">
                  <h3>➕ Add Question to Pool</h3>
                  <button className="admin-close-modal-btn" onClick={() => setShowAddQModal(false)}>✕</button>
                </div>
                {qFormMsg && <div className="auth-alert error">{qFormMsg}</div>}
                <form onSubmit={handleCreateQuestion} className="auth-form" style={{ marginTop: "16px" }}>
                  <div className="form-group">
                    <label>Discipline</label>
                    <select
                      value={qCategory}
                      onChange={(e) => setQCategory(e.target.value)}
                      className="admin-select"
                      style={{ width: "100%" }}
                    >
                      {STREAMS.filter((s) => s.id !== "All").map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Question Statement</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. What is the powerhouse of the cell?"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="admin-textarea"
                      required
                    />
                  </div>

                  <div className="admin-form-options-grid">
                    <div className="form-group">
                      <label>Option A</label>
                      <input type="text" value={qOpt1} onChange={(e) => setQOpt1(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Option B</label>
                      <input type="text" value={qOpt2} onChange={(e) => setQOpt2(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Option C</label>
                      <input type="text" value={qOpt3} onChange={(e) => setQOpt3(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Option D</label>
                      <input type="text" value={qOpt4} onChange={(e) => setQOpt4(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Verified Correct Option</label>
                    <select
                      value={qCorrectIdx}
                      onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                      className="admin-select"
                      style={{ width: "100%" }}
                    >
                      <option value={0}>Option A ({qOpt1 || "Option A"})</option>
                      <option value={1}>Option B ({qOpt2 || "Option B"})</option>
                      <option value={2}>Option C ({qOpt3 || "Option C"})</option>
                      <option value={3}>Option D ({qOpt4 || "Option D"})</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Explanation / Justification</label>
                    <input
                      type="text"
                      placeholder="Scientific or factual rationale..."
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                    />
                  </div>

                  <div className="action-row" style={{ marginTop: "24px" }}>
                    <button
                      type="submit"
                      className="primary-button"
                      style={{ background: theme.accent }}
                    >
                      Commit Question to Pool
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setShowAddQModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
         TAB 5: DIAGNOSTICS & MAINTENANCE
         ========================================================= */}
      {activeTab === "system" && (
        <div className="admin-tab-content">
          <div className="admin-dashboard-grid">
            {/* Live API Ping Diagnostic */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag">NET</span>
                  <h3>API Gateway Latency Diagnostics</h3>
                </div>
                <span className="admin-badge-inline">HEALTH PING</span>
              </div>
              <p className="subpanel-desc">Measure round-trip HTTP response latency to active cloud assessment endpoints.</p>

              <div className="api-diagnostic-list">
                <div className="api-diag-row">
                  <div>
                    <strong>The Trivia API (Primary Provider)</strong>
                    <small>https://the-trivia-api.com/v2/questions</small>
                  </div>
                  <span className={`latency-pill ${apiLatency.triviaApi?.includes("ms") ? "online" : ""}`}>
                    {apiLatency.triviaApi || "Awaiting Ping"}
                  </span>
                </div>

                <div className="api-diag-row">
                  <div>
                    <strong>Open Trivia Database (Secondary Provider)</strong>
                    <small>https://opentdb.com/api.php</small>
                  </div>
                  <span className={`latency-pill ${apiLatency.openTdb?.includes("ms") ? "online" : ""}`}>
                    {apiLatency.openTdb || "Awaiting Ping"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <button
                  className="primary-button"
                  style={{ background: theme.accent, width: "100%" }}
                  onClick={handleTestApiLatency}
                  disabled={apiLatency.testing}
                >
                  {apiLatency.testing ? "Measuring Gateway Ping..." : "⚡ Execute Real-Time Gateway Ping"}
                </button>
              </div>
            </div>

            {/* Platform Controls & Maintenance Mode */}
            <div className="panel admin-subpanel" style={{ borderColor: theme.border }}>
              <div className="admin-subpanel-head">
                <div className="head-title-group">
                  <span className="section-letter-tag">OPS</span>
                  <h3>Operational Status &amp; Announcements</h3>
                </div>
                <span className="admin-badge-inline">STATUS SWITCH</span>
              </div>
              <p className="subpanel-desc">Broadcast system maintenance alerts and review local cache consumption.</p>

              <div className="maintenance-toggle-box">
                <div className="m-toggle-text">
                  <strong>Maintenance Alert Banner</strong>
                  <p>When enabled, active candidates see a top broadcast banner alerting them to server maintenance.</p>
                </div>
                <button
                  className={`maintenance-btn ${maintenanceMode ? "active" : ""}`}
                  onClick={handleToggleMaintenance}
                >
                  {maintenanceMode ? "ACTIVE (BROADCASTING)" : "OFFLINE"}
                </button>
              </div>

              <div className="storage-diagnostic-box" style={{ marginTop: "20px" }}>
                <h4>Storage Allocation Telemetry</h4>
                <p>Allocated Browser Storage: ~{Math.round((JSON.stringify(localStorage).length * 2) / 1024)} KB across profiles, question banks, and session records.</p>
                <div className="action-row" style={{ marginTop: "12px" }}>
                  <button className="tool-button" onClick={handleExportJSON}>
                    Export Local Data Snapshot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         MODAL: INDIVIDUAL USER DOSSIER & RECORDS
         ========================================================= */}
      {selectedUserForDossier && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUserForDossier(null)}>
          <div
            className="admin-modal panel"
            style={{
              borderColor: theme.border,
              width: "min(760px, 96vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "26px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="section-letter-tag" style={{ color: theme.accent }}>REC</span>
                <div>
                  <h3 style={{ margin: 0 }}>Candidate Profile &amp; Academic Dossier</h3>
                  <p className="subpanel-desc" style={{ margin: "2px 0 0" }}>Comprehensive assessment transcript, credentials, and error history.</p>
                </div>
              </div>
              <button className="admin-close-modal-btn" onClick={() => setSelectedUserForDossier(null)}>✕</button>
            </div>

            {/* Candidate identity card */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${theme.border}`,
              marginTop: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  className="table-avatar"
                  style={{
                    width: "52px",
                    height: "52px",
                    fontSize: "1.4rem",
                    background: theme.accent,
                    color: "#fff"
                  }}
                >
                  {(selectedUserForDossier.avatar || selectedUserForDossier.name?.charAt(0) || "U").toUpperCase()}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{selectedUserForDossier.name}</h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                    <code style={{ fontSize: "0.8rem", opacity: 0.75 }}>@{selectedUserForDossier.username}</code>
                    <span>·</span>
                    <span style={{ fontSize: "0.82rem", opacity: 0.75 }}>{selectedUserForDossier.email}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    background: selectedUserForDossier.role === "admin" ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                    color: selectedUserForDossier.role === "admin" ? "#f87171" : "#60a5fa",
                    border: `1px solid ${selectedUserForDossier.role === "admin" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`
                  }}
                >
                  {selectedUserForDossier.role === "admin" ? "🛡️ ADMINISTRATOR" : "STUDENT CANDIDATE"}
                </span>
                <small style={{ display: "block", opacity: 0.6, marginTop: "4px", fontSize: "0.72rem" }}>
                  Enrolled: {selectedUserForDossier.createdAt || "Active"}
                </small>
              </div>
            </div>

            {/* Metrics Bar */}
            {(() => {
              const userAttempts = history.filter(
                (h) => h.user?.toLowerCase() === selectedUserForDossier.name?.toLowerCase() ||
                  h.user?.toLowerCase() === selectedUserForDossier.username?.toLowerCase()
              );
              const totalScore = userAttempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0);
              const avgAcc = userAttempts.length > 0
                ? Math.round(userAttempts.reduce((acc, a) => acc + (Number(a.accuracy) || 0), 0) / userAttempts.length)
                : (selectedUserForDossier.stats?.accuracy || 0);
              const userCerts = certificates.filter(
                (c) => c.userName?.toLowerCase() === selectedUserForDossier.name?.toLowerCase() ||
                  c.userEmail?.toLowerCase() === selectedUserForDossier.email?.toLowerCase()
              );
              const userMisses = struggles.filter(
                (s) => s.candidateName?.toLowerCase() === selectedUserForDossier.name?.toLowerCase() ||
                  s.candidateUsername?.toLowerCase() === selectedUserForDossier.username?.toLowerCase()
              );

              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "14px" }}>
                    <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                      <small style={{ opacity: 0.65, display: "block", fontSize: "0.72rem" }}>Total Attempts</small>
                      <strong style={{ fontSize: "1.25rem", color: theme.accent }}>{userAttempts.length}</strong>
                    </div>
                    <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                      <small style={{ opacity: 0.65, display: "block", fontSize: "0.72rem" }}>Avg Accuracy</small>
                      <strong style={{ fontSize: "1.25rem", color: avgAcc >= 70 ? "#10b981" : "#ef4444" }}>{avgAcc}%</strong>
                    </div>
                    <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                      <small style={{ opacity: 0.65, display: "block", fontSize: "0.72rem" }}>Cumulative Pts</small>
                      <strong style={{ fontSize: "1.25rem", color: "#38bdf8" }}>{Math.round(totalScore)}</strong>
                    </div>
                    <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                      <small style={{ opacity: 0.65, display: "block", fontSize: "0.72rem" }}>Certificates</small>
                      <strong style={{ fontSize: "1.25rem", color: "#f59e0b" }}>{userCerts.length}</strong>
                    </div>
                    <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                      <small style={{ opacity: 0.65, display: "block", fontSize: "0.72rem" }}>Error Logs</small>
                      <strong style={{ fontSize: "1.25rem", color: userMisses.length > 0 ? "#ef4444" : "#10b981" }}>{userMisses.length}</strong>
                    </div>
                  </div>

                  {/* Assessment Session History */}
                  <div style={{ marginTop: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "0.95rem" }}>🕒 Assessment Session History ({userAttempts.length})</h4>
                    </div>
                    {userAttempts.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", opacity: 0.6, fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                        No assessment attempts recorded yet for this candidate.
                      </div>
                    ) : (
                      <div className="admin-table-container" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        <table className="admin-table" style={{ fontSize: "0.82rem" }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Subject Stream</th>
                              <th>Difficulty</th>
                              <th>Score</th>
                              <th>Accuracy</th>
                              <th>Streak</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userAttempts.slice().reverse().map((att, i) => (
                              <tr key={i}>
                                <td>{att.date || "Recent"}</td>
                                <td><span className="stream-badge-mono">{getStreamCode(att.category)}</span></td>
                                <td><span className={`diff-tag diff-${(att.difficulty || "medium").toLowerCase()}`}>{att.difficulty || "MED"}</span></td>
                                <td style={{ fontWeight: "700", color: theme.accent }}>{att.score} PTS</td>
                                <td style={{ fontWeight: "700", color: Number(att.accuracy) >= 70 ? "#10b981" : "#ef4444" }}>{att.accuracy}%</td>
                                <td>🔥 {att.bestStreak || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Questions Candidate Struggled With */}
                  <div style={{ marginTop: "18px" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "#f87171" }}>
                      ⚠️ Specific Questions Candidate Faced Problems With ({userMisses.length})
                    </h4>
                    {userMisses.length === 0 ? (
                      <div style={{ padding: "14px", textAlign: "center", opacity: 0.7, fontSize: "0.85rem", background: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        ✓ Clean record! No unresolved questions failed by this candidate.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                        {userMisses.map((m, idx) => (
                          <div key={idx} style={{ padding: "10px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.82rem" }}>
                            <strong>Q: {m.question}</strong>
                            <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "0.78rem" }}>
                              <span style={{ color: "#ef4444" }}>Candidate Picked: <b>{m.selectedAnswer || "Incorrect"}</b></span>
                              <span style={{ color: "#10b981" }}>Correct: <b>{m.correctAnswer}</b></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certificates Won */}
                  <div style={{ marginTop: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#f59e0b" }}>
                        🎓 Certificates Awarded ({userCerts.length})
                      </h4>
                      <button
                        type="button"
                        className="tool-button"
                        style={{ fontSize: "0.75rem", padding: "4px 10px", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}
                        onClick={() => {
                          setManualCertCandidate(selectedUserForDossier.name);
                          setShowManualCertModal(true);
                        }}
                      >
                        ➕ Issue Accredited Certificate
                      </button>
                    </div>
                    {userCerts.length === 0 ? (
                      <div style={{ padding: "14px", textAlign: "center", opacity: 0.6, fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                        No certificates issued yet (requires &gt;= 70% passing accuracy).
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {userCerts.map((c) => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                            <div>
                              <strong>{c.category} Certification</strong>
                              <small style={{ display: "block", opacity: 0.75 }}>ID: {c.id} · {c.distinction || "Certified"} · {c.score} PTS ({c.accuracy}%)</small>
                            </div>
                            <button
                              type="button"
                              className="tool-button"
                              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                              onClick={() => {
                                setSelectedCertForPreview(c);
                              }}
                            >
                              Preview Certificate →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Admin Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="tool-button"
                        onClick={() => handleToggleUserRole(selectedUserForDossier)}
                      >
                        {selectedUserForDossier.role === "admin" ? "Demote to Candidate" : "Promote to Admin"}
                      </button>
                      {(!isConfiguredAdmin(selectedUserForDossier.username) && !isConfiguredAdmin(selectedUserForDossier.email)) && (
                        <button
                          type="button"
                          className="tool-button"
                          style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                          onClick={() => {
                            handleDeleteUser(selectedUserForDossier);
                            setSelectedUserForDossier(null);
                          }}
                        >
                          Delete User
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: "auto" }}
                      onClick={() => setSelectedUserForDossier(null)}
                    >
                      Close Dossier
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================
         MODAL: OFFICIAL CERTIFICATE PREVIEW & PRINT
         ========================================================= */}
      {selectedCertForPreview && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCertForPreview(null)}>
          <div
            className="admin-modal panel"
            style={{
              borderColor: "#f59e0b",
              width: "min(720px, 96vw)",
              padding: "24px",
              background: "#090d16"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.4rem" }}>🎓</span>
                <div>
                  <h3 style={{ margin: 0, color: "#fbbf24" }}>Official Accredited Certificate</h3>
                  <small style={{ opacity: 0.7 }}>Verified QuizPulse Assessment Credential</small>
                </div>
              </div>
              <button className="admin-close-modal-btn" onClick={() => setSelectedCertForPreview(null)}>✕</button>
            </div>

            {/* Frame of the certificate */}
            <div
              id="printable-admin-certificate"
              style={{
                border: "4px double #d97706",
                borderRadius: "14px",
                padding: "36px 28px",
                background: "radial-gradient(ellipse at center, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)",
                textAlign: "center",
                color: "#f8fafc",
                position: "relative",
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
              }}
            >
              <div style={{ position: "absolute", top: "14px", left: "14px", fontSize: "0.72rem", color: "#f59e0b", letterSpacing: "2px", fontWeight: "700" }}>
                ★ QUIZPULSE ACADEMY ★
              </div>
              <div style={{ position: "absolute", top: "14px", right: "14px", fontSize: "0.72rem", color: "#f59e0b", letterSpacing: "1px", fontFamily: "var(--font-mono)" }}>
                ID: {selectedCertForPreview.id}
              </div>

              <div style={{ margin: "16px 0 6px 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "4px", color: "#94a3b8" }}>
                Certificate of Excellence &amp; Achievement
              </div>

              <h1 style={{ margin: "4px 0 16px 0", fontSize: "1.8rem", color: "#fbbf24", fontWeight: "800", letterSpacing: "1px" }}>
                VERIFIED ACADEMIC CREDENTIAL
              </h1>

              <p style={{ margin: 0, fontSize: "0.9rem", color: "#cbd5e1" }}>
                This certifies that candidate
              </p>

              <div style={{
                margin: "12px auto",
                fontSize: "2rem",
                fontWeight: "800",
                color: "#ffffff",
                borderBottom: "2px solid #f59e0b",
                display: "inline-block",
                padding: "0 24px 6px"
              }}>
                {selectedCertForPreview.userName}
              </div>

              <p style={{ margin: "10px auto", maxWidth: "480px", fontSize: "0.92rem", lineHeight: "1.6", color: "#e2e8f0" }}>
                has successfully undertaken standardized academic evaluation in <strong>{selectedCertForPreview.category}</strong> and achieved meritorious marks:
              </p>

              {/* Score ribbon */}
              <div style={{ display: "inline-flex", gap: "20px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "10px", padding: "10px 24px", margin: "10px 0" }}>
                <div>
                  <small style={{ display: "block", fontSize: "0.7rem", opacity: 0.75, textTransform: "uppercase" }}>Score Achieved</small>
                  <strong style={{ fontSize: "1.2rem", color: "#fbbf24" }}>{selectedCertForPreview.score} PTS</strong>
                </div>
                <div style={{ borderLeft: "1px solid rgba(245,158,11,0.3)", paddingLeft: "20px" }}>
                  <small style={{ display: "block", fontSize: "0.7rem", opacity: 0.75, textTransform: "uppercase" }}>Accuracy</small>
                  <strong style={{ fontSize: "1.2rem", color: "#10b981" }}>{selectedCertForPreview.accuracy}%</strong>
                </div>
                <div style={{ borderLeft: "1px solid rgba(245,158,11,0.3)", paddingLeft: "20px" }}>
                  <small style={{ display: "block", fontSize: "0.7rem", opacity: 0.75, textTransform: "uppercase" }}>Honors Rank</small>
                  <strong style={{ fontSize: "1.2rem", color: "#f87171" }}>{selectedCertForPreview.distinction || "Gold Honors"}</strong>
                </div>
              </div>

              {/* Signature & Seal row */}
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", marginTop: "28px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div>
                  <div style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#38bdf8" }}>QuizPulse Examiner</div>
                  <div style={{ width: "140px", height: "1px", background: "rgba(255,255,255,0.3)", margin: "4px auto" }} />
                  <small style={{ fontSize: "0.7rem", opacity: 0.7 }}>Director of Academic Testing</small>
                </div>

                <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px dashed #f59e0b", display: "grid", placeItems: "center", fontSize: "1.4rem", background: "rgba(245, 158, 11, 0.08)" }}>
                  🏅
                </div>

                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#10b981" }}>
                    {new Date(selectedCertForPreview.issuedAt || Date.now()).toLocaleDateString()}
                  </div>
                  <div style={{ width: "140px", height: "1px", background: "rgba(255,255,255,0.3)", margin: "4px auto" }} />
                  <small style={{ fontSize: "0.7rem", opacity: 0.7 }}>Date of Verification</small>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
              <button
                type="button"
                className="tool-button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedCertForPreview.id);
                  showToast("Certificate ID copied to clipboard.");
                }}
              >
                📋 Copy Certificate ID
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: "#f59e0b", color: "#000", fontWeight: "700", width: "auto" }}
                  onClick={() => {
                    window.print();
                  }}
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ width: "auto" }}
                  onClick={() => setSelectedCertForPreview(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         MODAL: ISSUE MANUAL CERTIFICATE
         ========================================================= */}
      {showManualCertModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowManualCertModal(false)}>
          <div
            className="admin-modal panel"
            style={{ borderColor: "#f59e0b", width: "min(500px, 96vw)", padding: "26px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.4rem" }}>🏅</span>
                <h3 style={{ margin: 0, color: "#fbbf24" }}>Issue Accredited Certificate</h3>
              </div>
              <button className="admin-close-modal-btn" onClick={() => setShowManualCertModal(false)}>✕</button>
            </div>

            <p className="subpanel-desc" style={{ margin: "4px 0 16px 0" }}>
              Manually award an official verifiable certificate to any registered candidate or learner.
            </p>

            <form onSubmit={handleIssueManualCertificate} className="auth-form">
              <div className="form-group">
                <label>Select Candidate</label>
                <select
                  value={manualCertCandidate}
                  onChange={(e) => setManualCertCandidate(e.target.value)}
                  className="admin-select"
                  style={{ width: "100%" }}
                  required
                >
                  <option value="">-- Choose Candidate --</option>
                  {users.map((u) => (
                    <option key={u.id || u.username} value={u.name}>
                      {u.name} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Academic Subject Stream</label>
                <select
                  value={manualCertCategory}
                  onChange={(e) => setManualCertCategory(e.target.value)}
                  className="admin-select"
                  style={{ width: "100%" }}
                >
                  {STREAMS.filter((s) => s.id !== "All").map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label>Score (Points)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manualCertScore}
                    onChange={(e) => setManualCertScore(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Accuracy (%)</label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={manualCertAccuracy}
                    onChange={(e) => setManualCertAccuracy(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="action-row" style={{ marginTop: "20px" }}>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: "#f59e0b", color: "#000", fontWeight: "700" }}
                >
                  Award &amp; Register Certificate
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowManualCertModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
