function normalizeCategory(value) {
  const category = String(value || "").trim();
  if (!category) return "";
  const normalized = category.toLowerCase();
  if (normalized === "all" || normalized === "mixed streams" || normalized === "mixed") {
    return "";
  }
  return category;
}

export function buildCertificateSummaryFromHistory(history = []) {
  const attempts = Array.isArray(history)
    ? history
        .map((entry) => ({
          ...entry,
          category: normalizeCategory(entry.category || entry.stream),
          accuracy: Number(entry.accuracy ?? entry.percent ?? 0),
          score: Number(entry.score ?? 0)
        }))
        .filter((entry) => entry.category && Number.isFinite(entry.accuracy))
    : [];

  const uniqueAttempts = [];
  const seenCategories = new Set();

  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    const attempt = attempts[index];
    if (seenCategories.has(attempt.category)) continue;

    seenCategories.add(attempt.category);
    uniqueAttempts.push(attempt);

    if (uniqueAttempts.length >= 3) break;
  }

  const overallAccuracy = uniqueAttempts.length > 0
    ? uniqueAttempts.reduce((sum, item) => sum + (Number(item.accuracy) || 0), 0) / uniqueAttempts.length
    : 0;

  const overallScore = uniqueAttempts.length > 0
    ? uniqueAttempts.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / uniqueAttempts.length
    : 0;

  const qualifies = uniqueAttempts.length >= 3 && overallAccuracy >= 55;

  return {
    totalAttempts: attempts.length,
    uniqueCategories: uniqueAttempts.map((item) => item.category),
    attempts: uniqueAttempts,
    overallAccuracy: Number(overallAccuracy.toFixed(1)),
    overallScore: Number(overallScore.toFixed(1)),
    qualifies,
    requiredCategories: 3,
    minimumAccuracy: 55,
    completionText: qualifies
      ? `Unlocked with ${uniqueAttempts.length} unique streams at ${Number(overallAccuracy.toFixed(1))}% overall.`
      : `Complete 3 different streams and reach 55% overall to unlock your certificate.`
  };
}

export function getUserCertificateRecord(user = null) {
  try {
    const list = JSON.parse(localStorage.getItem("quiz_certificates") || "[]");
    if (!Array.isArray(list) || list.length === 0) return null;

    const userEmail = (user?.email || "").trim().toLowerCase();
    const userName = (user?.name || "").trim().toLowerCase();

    const matches = list.filter((cert) => {
      const certEmail = (cert.userEmail || "").trim().toLowerCase();
      const certName = (cert.userName || "").trim().toLowerCase();
      if (userEmail && certEmail) return certEmail === userEmail;
      if (userName && certName) return certName === userName;
      return false;
    });

    return matches.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0] || null;
  } catch {
    return null;
  }
}

export function getUserCertificateStatus(user = null) {
  try {
    const stored = JSON.parse(localStorage.getItem("quiz_history") || "[]");
    const merged = [...(Array.isArray(stored) ? stored : []), ...(Array.isArray(user?.quizHistory) ? user.quizHistory : [])];
    const summary = buildCertificateSummaryFromHistory(merged);
    const certificate = getUserCertificateRecord(user);

    return {
      ...summary,
      certificate
    };
  } catch {
    return {
      totalAttempts: 0,
      uniqueCategories: [],
      attempts: [],
      overallAccuracy: 0,
      overallScore: 0,
      qualifies: false,
      requiredCategories: 3,
      completionText: "Complete 3 different streams and reach 65% overall to unlock your certificate.",
      certificate: null
    };
  }
}
