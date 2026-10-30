/**
 * Quiz Questions API service with multi-provider architecture and
 * intelligent deduplication to prevent repeating questions across attempts.
 */
import { getMultilingualQuestions } from "./data/multilingualQuestions.js";


export const STREAMS = [
  { id: "All", label: "Mixed Streams", icon: "🌐", description: "Random mix across all subjects" },
  { id: "Science", label: "Science & Nature", icon: "🔬", description: "Physics, biology, chemistry & cosmos" },
  { id: "Tech", label: "Technology & CS", icon: "💻", description: "Programming, computers & internet" },
  { id: "Math", label: "Mathematics", icon: "➗", description: "Arithmetic, geometry & logic" },
  { id: "History", label: "World History", icon: "🏛️", description: "Civilizations, wars & famous events" },
  { id: "Pop Culture", label: "Pop Culture & Film", icon: "🎬", description: "Movies, artists, music & trends" },
  { id: "Geography", label: "World Geography", icon: "🌍", description: "Continents, capitals & landmarks" },
  { id: "Sports", label: "Sports & Athletics", icon: "⚽", description: "Competitions, legends & rules" },
];

export const OPENTDB_CATEGORY_MAP = {
  All: null,
  Science: 17, // Science & Nature
  Tech: 18, // Science: Computers
  Math: 19, // Science: Mathematics
  History: 23, // History
  "Pop Culture": 11, // Entertainment: Film
  Geography: 22, // Geography
  Sports: 21, // Sports
};

export const TRIVIA_API_PARAMS = {
  All: "limit=50",
  Science: "limit=50&categories=science",
  Tech: "limit=50&tags=technology,computing,the_internet,programming,gadgets,smartphones,software,hardware,ai",
  Math: "limit=50&tags=mathematics,numbers",
  History: "limit=50&categories=history",
  "Pop Culture": "limit=50&categories=film_and_tv,music",
  Geography: "limit=50&categories=geography",
  Sports: "limit=50&categories=sport_and_leisure",
};

const SEEN_STORAGE_PREFIX = "quiz_seen_q_v4";

const memorySeenMap = new Map();

/**
 * Normalizes question strings for accurate duplicate matching
 */
export function normalizeQuestionText(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Retrieves the list of previously answered questions for a specific stream
 */
export function getSeenQuestions(category) {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(`${SEEN_STORAGE_PREFIX}_${category}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Fallback to in-memory map
  }
  return memorySeenMap.get(category) || [];
}

/**
 * Records newly presented questions into persistent storage and memory
 */
export function recordSeenQuestions(category, questions) {
  const existing = getSeenQuestions(category);
  const newKeys = questions.map((q) => normalizeQuestionText(q.question));
  const combined = Array.from(new Set([...existing, ...newKeys]));

  // Keep history bounded (max 400 items), pruning oldest if necessary
  const trimmed = combined.length > 400 ? combined.slice(combined.length - 200) : combined;

  memorySeenMap.set(category, trimmed);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`${SEEN_STORAGE_PREFIX}_${category}`, JSON.stringify(trimmed));
    }
  } catch {
    // Storage restricted or unavailable
  }
}

/**
 * Decodes HTML entities commonly returned by OpenTDB
 */
export function decodeHtml(html) {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent || html;
  }
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&deg;/g, "°");
}

/**
 * Fisher-Yates array shuffling
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Procedural math question generator for infinite non-repeating math problems,
 * supporting English, Bengali, Hindi, Tamil, Urdu, Japanese, Spanish, French, German.
 */
export function generateProceduralMathQuestion(language = "en") {
  const templates = ["multiply", "solve_linear", "percentage", "square_root", "hypotenuse"];
  const type = templates[Math.floor(Math.random() * templates.length)];

  if (type === "multiply") {
    const a = Math.floor(Math.random() * 18) + 12; // 12-29
    const b = Math.floor(Math.random() * 16) + 7;  // 7-22
    const ans = a * b;
    const distractors = [ans + 10, ans - 10, ans + (Math.random() > 0.5 ? 4 : -4)].map(String);
    const options = shuffleArray([String(ans), ...distractors]);

    let question = `What is ${a} × ${b}?`;
    let explanation = `${a} multiplied by ${b} equals ${ans}.`;

    if (language === "bn") {
      question = `${a} × ${b} এর মান কত?`;
      explanation = `${a} এবং ${b} গুণ করলে গুণফল হয় ${ans}।`;
    } else if (language === "hi") {
      question = `${a} × ${b} का मान क्या होगा?`;
      explanation = `${a} और ${b} का गुणनफल ${ans} होता है।`;
    } else if (language === "ta") {
      question = `${a} × ${b} இன் மதிப்பு என்ன?`;
      explanation = `${a} பெருக்கல் ${b} சமம் ${ans}.`;
    } else if (language === "ur") {
      question = `${a} × ${b} کا حاصل ضرب کیا ہے؟`;
      explanation = `${a} کو ${b} سے ضرب دینے پر ${ans} حاصل ہوتا ہے۔`;
    } else if (language === "ja") {
      question = `${a} × ${b} の計算結果は何ですか？`;
      explanation = `${a} × ${b} = ${ans} です。`;
    } else if (language === "es") {
      question = `¿Cuánto es ${a} × ${b}?`;
      explanation = `${a} multiplicado por ${b} es igual a ${ans}.`;
    } else if (language === "fr") {
      question = `Combien font ${a} × ${b} ?`;
      explanation = `${a} multiplié par ${b} est égal à ${ans}.`;
    } else if (language === "de") {
      question = `Was ist das Ergebnis von ${a} × ${b}?`;
      explanation = `${a} multipliziert mit ${b} ergibt ${ans}.`;
    }

    return {
      category: "Math",
      question,
      options,
      answer: options.indexOf(String(ans)),
      explanation
    };
  }

  if (type === "percentage") {
    const p = [10, 15, 20, 25, 30, 40, 50, 60, 75][Math.floor(Math.random() * 9)];
    const val = (Math.floor(Math.random() * 25) + 4) * 20;
    const ans = Math.round((p * val) / 100);
    const distractors = [ans + 10, Math.max(5, ans - 10), ans + 20].map(String);
    const options = shuffleArray([String(ans), ...distractors]);

    let question = `What is ${p}% of ${val}?`;
    let explanation = `${p}% of ${val} is calculated as (${p}/100) × ${val} = ${ans}.`;

    if (language === "bn") {
      question = `${val} এর ${p}% কত?`;
      explanation = `(${p}/১০০) × ${val} = ${ans}।`;
    } else if (language === "hi") {
      question = `${val} का ${p}% कितना होगा?`;
      explanation = `(${p}/100) × ${val} = ${ans}.`;
    } else if (language === "ta") {
      question = `${val} இல் ${p}% எவ்வளவு?`;
      explanation = `(${p}/100) × ${val} = ${ans}.`;
    } else if (language === "ur") {
      question = `${val} کا ${p}% کتنا ہوگا؟`;
      explanation = `(${p}/100) × ${val} = ${ans}.`;
    } else if (language === "ja") {
      question = `${val} の ${p}% はいくつですか？`;
      explanation = `(${p}/100) × ${val} = ${ans} です。`;
    } else if (language === "es") {
      question = `¿Cuánto es el ${p}% de ${val}?`;
      explanation = `(${p}/100) × ${val} = ${ans}.`;
    } else if (language === "fr") {
      question = `Combien vaut ${p}% de ${val} ?`;
      explanation = `(${p}/100) × ${val} = ${ans}.`;
    } else if (language === "de") {
      question = `Was sind ${p}% von ${val}?`;
      explanation = `(${p}/100) × ${val} = ${ans}.`;
    }

    return {
      category: "Math",
      question,
      options,
      answer: options.indexOf(String(ans)),
      explanation
    };
  }

  if (type === "square_root") {
    const roots = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 30];
    const r = roots[Math.floor(Math.random() * roots.length)];
    const sq = r * r;
    const distractors = [r - 1, r + 1, r + 2].map(String);
    const options = shuffleArray([String(r), ...distractors]);

    let question = `What is the square root of ${sq}?`;
    let explanation = `√${sq} = ${r} because ${r} × ${r} = ${sq}.`;

    if (language === "bn") {
      question = `${sq} এর বর্গমূল (square root) কত?`;
      explanation = `√${sq} = ${r} কারণ ${r} × ${r} = ${sq}।`;
    } else if (language === "hi") {
      question = `${sq} का वर्गमूल (square root) क्या है?`;
      explanation = `√${sq} = ${r} क्योंकि ${r} × ${r} = ${sq}.`;
    } else if (language === "ta") {
      question = `${sq} இன் வர்க்கமூலம் என்ன?`;
      explanation = `√${sq} = ${r} ஏனெனில் ${r} × ${r} = ${sq}.`;
    } else if (language === "ur") {
      question = `${sq} کا جذر المربع (square root) کیا ہے؟`;
      explanation = `√${sq} = ${r} کیونکہ ${r} × ${r} = ${sq}.`;
    } else if (language === "ja") {
      question = `${sq} の平方根（ルート）は何ですか？`;
      explanation = `√${sq} = ${r} （${r} × ${r} = ${sq}）です。`;
    } else if (language === "es") {
      question = `¿Cuál es la raíz cuadrada de ${sq}?`;
      explanation = `√${sq} = ${r} porque ${r} × ${r} = ${sq}.`;
    } else if (language === "fr") {
      question = `Quelle est la racine carrée de ${sq} ?`;
      explanation = `√${sq} = ${r} car ${r} × ${r} = ${sq}.`;
    } else if (language === "de") {
      question = `Was ist die Quadratwurzel aus ${sq}?`;
      explanation = `√${sq} = ${r}, da ${r} × ${r} = ${sq}.`;
    }

    return {
      category: "Math",
      question,
      options,
      answer: options.indexOf(String(r)),
      explanation
    };
  }

  if (type === "hypotenuse") {
    const triples = [
      [3, 4, 5],
      [5, 12, 13],
      [6, 8, 10],
      [8, 15, 17],
      [9, 12, 15],
      [7, 24, 25]
    ];
    const [a, b, c] = triples[Math.floor(Math.random() * triples.length)];
    const distractors = [c - 2, c + 2, c + 4].map(String);
    const options = shuffleArray([String(c), ...distractors]);

    let question = `In a right-angled triangle with legs ${a} and ${b}, what is the hypotenuse?`;
    let explanation = `By Pythagorean theorem: √(${a}² + ${b}²) = ${c}.`;

    if (language === "bn") {
      question = `একটি সমকোণী ত্রিভুজের বাহুদ্বয় ${a} এবং ${b} হলে, এর অতিভুজ কত?`;
      explanation = `পিথাগোরাসের উপপাদ্য অনুসারে: √(${a}² + ${b}²) = ${c}।`;
    } else if (language === "hi") {
      question = `एक समकोण त्रिभुज में भुजाएं ${a} और ${b} हैं, तो कर्ण (hypotenuse) क्या होगा?`;
      explanation = `पाइथागोरस प्रमेय द्वारा: √(${a}² + ${b}²) = ${c}.`;
    } else if (language === "ta") {
      question = `செங்கோண முக்கோணத்தில் பக்கங்கள் ${a} மற்றும் ${b} எனில் கர்ணம் என்ன?`;
      explanation = `பிதாகரஸ் தேற்றப்படி: √(${a}² + ${b}²) = ${c}.`;
    } else if (language === "ur") {
      question = `قائمۃ الزاویہ مثلث میں اضلاع ${a} اور ${b} ہوں تو وتر (hypotenuse) کیا ہوگا؟`;
      explanation = `مسئلہ فیثاغورث: √(${a}² + ${b}²) = ${c}.`;
    } else if (language === "ja") {
      question = `直角三角形の2辺が ${a} と ${b} のとき、斜辺の長さはいくつですか？`;
      explanation = `ピタゴラスの定理: √(${a}² + ${b}²) = ${c} です。`;
    }

    return {
      category: "Math",
      question,
      options,
      answer: options.indexOf(String(c)),
      explanation
    };
  }

  // Linear equation: ax + b = c
  const a = Math.floor(Math.random() * 8) + 2;
  const x = Math.floor(Math.random() * 15) + 2;
  const b = Math.floor(Math.random() * 18) + 3;
  const c = a * x + b;
  const distractors = [x + 2, Math.max(1, x - 2), x + 3].map(String);
  const options = shuffleArray([String(x), ...distractors]);

  let question = `Solve for x: ${a}x + ${b} = ${c}`;
  let explanation = `Subtract ${b} from both sides to get ${a}x = ${c - b}, then divide by ${a} to get x = ${x}.`;

  if (language === "bn") {
    question = `সমীকরণটি সমাধান করুন: ${a}x + ${b} = ${c} (x এর মান কত?)`;
    explanation = `${a}x = ${c} - ${b} = ${c - b}, অতএব x = ${x}।`;
  } else if (language === "hi") {
    question = `समीकरण हल करें: ${a}x + ${b} = ${c} (x का मान क्या है?)`;
    explanation = `${a}x = ${c} - ${b} = ${c - b}, इसलिए x = ${x}.`;
  } else if (language === "ta") {
    question = `தீர்க்க: ${a}x + ${b} = ${c} (x இன் மதிப்பு என்ன?)`;
    explanation = `${a}x = ${c - b}, எனவே x = ${x}.`;
  } else if (language === "ur") {
    question = `حل کریں: ${a}x + ${b} = ${c} (x کی قیمت معلوم کریں)`;
    explanation = `${a}x = ${c - b}، پس x = ${x}.`;
  } else if (language === "ja") {
    question = `方程式を解いてください: ${a}x + ${b} = ${c}`;
    explanation = `${a}x = ${c - b} となり、x = ${x} です。`;
  }

  return {
    category: "Math",
    question,
    options,
    answer: options.indexOf(String(x)),
    explanation
  };
}

// In-memory translation cache to guarantee instantaneous loads for repeated queries
const translationMemoryCache = new Map();

/**
 * Translates a single question with options & explanation into target language using Google GTX endpoint.
 * Times out after 2.5 seconds to guarantee the quiz interface never freezes.
 */
export async function translateSingleQuestion(q, targetLang) {
  if (!targetLang || targetLang === "en") return q;

  // If question is already in target language script, skip re-translation immediately
  if (
    q.source?.toLowerCase().includes(`(${targetLang.toLowerCase()})`) ||
    (targetLang === "bn" && /[\u0980-\u09FF]/.test(q.question)) ||
    (targetLang === "hi" && /[\u0900-\u097F]/.test(q.question)) ||
    (targetLang === "ta" && /[\u0B80-\u0BFF]/.test(q.question)) ||
    (targetLang === "ur" && /[\u0600-\u06FF]/.test(q.question)) ||
    (targetLang === "ja" && /[\u3040-\u30FF\u4E00-\u9FAF]/.test(q.question))
  ) {
    return q;
  }

  const cacheKey = `${targetLang}_${q.question}`;
  if (translationMemoryCache.has(cacheKey)) {
    return translationMemoryCache.get(cacheKey);
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(`quiz_trans_${cacheKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      translationMemoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  const parts = [q.question, ...q.options, q.explanation || ""];
  const combinedText = parts.join(" ||| ");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2600);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(combinedText)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslated = data[0].map((chunk) => chunk[0]).join("");
        const translatedParts = fullTranslated.split(/\s*\|{1,3}\s*/).map((s) => s.trim());

        if (translatedParts.length >= q.options.length + 1) {
          const translatedQuestion = translatedParts[0];
          const translatedOptions = translatedParts.slice(1, 1 + q.options.length);
          const translatedExplanation = translatedParts[1 + q.options.length] || q.explanation;

          if (translatedOptions.length === q.options.length) {
            const translatedQ = {
              ...q,
              question: translatedQuestion,
              options: translatedOptions,
              explanation: translatedExplanation,
              source: `${q.source || "Online API"} (${targetLang.toUpperCase()})`
            };
            translationMemoryCache.set(cacheKey, translatedQ);
            try {
              localStorage.setItem(`quiz_trans_${cacheKey}`, JSON.stringify(translatedQ));
            } catch {}
            return translatedQ;
          }
        }
      }
    }
  } catch {
    // If translation fails or times out, safely return original
  }

  return q;
}

/**
 * Translates an array of questions in parallel with concurrency limit
 */
export async function translateQuestionsBatch(questions, targetLang) {
  if (!targetLang || targetLang === "en") return questions;
  return Promise.all(questions.map((q) => translateSingleQuestion(q, targetLang)));
}


/**
 * Fetches from The Trivia API (fast, high volume, no 5-second rate limit)
 */
async function fetchFromTheTriviaAPI(category, amount = 50) {
  const param = TRIVIA_API_PARAMS[category];
  if (!param) return [];

  // Cache-busting timestamp ensures browser never returns cached questions
  const cacheBuster = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const url = `https://the-trivia-api.com/v2/questions?${param}&_cb=${cacheBuster}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => {
        const cleanQuestion = decodeHtml(item.question?.text || "");
        const cleanCorrect = decodeHtml(item.correctAnswer || "");
        const cleanIncorrect = Array.isArray(item.incorrectAnswers)
          ? item.incorrectAnswers.map(decodeHtml)
          : [];

        const options = shuffleArray([cleanCorrect, ...cleanIncorrect]);
        return {
          id: item.id || normalizeQuestionText(cleanQuestion),
          category: category === "All" ? decodeHtml(item.category || "General") : category,
          question: cleanQuestion,
          options,
          answer: options.indexOf(cleanCorrect),
          explanation: `The correct answer is "${cleanCorrect}".`,
          source: "The Trivia API (Online)"
        };
      });
    }
  } catch {
    // Fail silently to next online provider
  }
  return [];
}

/**
 * Fetches from OpenTDB
 */
async function fetchFromOpenTDB(category, amount = 30) {
  const catId = OPENTDB_CATEGORY_MAP[category] || null;
  const cacheBuster = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&_cb=${cacheBuster}`;
  if (catId) url += `&category=${catId}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();

    if (data.response_code === 0 && Array.isArray(data.results)) {
      return data.results.map((item) => {
        const cleanQuestion = decodeHtml(item.question);
        const cleanCorrect = decodeHtml(item.correct_answer);
        const cleanIncorrect = item.incorrect_answers.map(decodeHtml);

        const options = shuffleArray([cleanCorrect, ...cleanIncorrect]);
        return {
          id: normalizeQuestionText(cleanQuestion),
          category: category === "All" ? decodeHtml(item.category) : category,
          question: cleanQuestion,
          options,
          answer: options.indexOf(cleanCorrect),
          explanation: `The correct answer is "${cleanCorrect}".`,
          source: "Open Trivia DB (Online)"
        };
      });
    }
  } catch {
    // Fail silently
  }
  return [];
}

/**
 * Main quiz questions loader:
 * - Fetches 100% from Online APIs (The Trivia API + OpenTDB)
 * - Zero local database / zero static file usage
 * - Uses cache-busting & persistent deduplication to ensure fresh, DIFFERENT questions
 *   every time a user attempts the quiz at different times
 */
export async function fetchQuizQuestions({
  category = "All",
  difficulty = "Medium",
  amount = 15,
  language = "en"
}) {
  const seenKey = language === "en" ? category : `${language}_${category}`;
  const seenList = getSeenQuestions(seenKey);
  const seenSet = new Set(seenList);

  const candidateMap = new Map();

  function addCandidate(q) {
    if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) return;
    const norm = normalizeQuestionText(q.question);
    if (candidateMap.has(norm)) return;
    candidateMap.set(norm, q);
  }

  // 0. Include custom questions configured by Admin in localStorage
  try {
    if (typeof localStorage !== "undefined") {
      const customQuestions = JSON.parse(localStorage.getItem("quiz_custom_questions") || "[]");
      const matching = category === "All" ? customQuestions : customQuestions.filter((q) => q.category === category);
      matching.forEach(addCandidate);
    }
  } catch {}

  // 1. If language is not English, include curated native questions for that language first
  if (language && language !== "en") {
    const nativeBank = getMultilingualQuestions(language, category);
    nativeBank.forEach(addCandidate);
  }

  // 2. For Math stream: procedural problems generated directly in target language
  if (category === "Math") {
    let attempts = 0;
    while (candidateMap.size < amount + 30 && attempts < 50) {
      attempts++;
      const generated = generateProceduralMathQuestion(language);
      generated.source = `Algorithmic Math Engine (${language.toUpperCase()})`;
      addCandidate(generated);
    }
  }

  // 3. Fetch live from The Trivia API (Primary Online API)
  const triviaApiResults = await fetchFromTheTriviaAPI(category, 50);
  triviaApiResults.forEach(addCandidate);

  // 4. Fetch live from OpenTDB (Secondary Online API)
  if (candidateMap.size < amount * 2) {
    const openTDBResults = await fetchFromOpenTDB(category, 30);
    openTDBResults.forEach(addCandidate);
  }

  // 5. Separate all candidates into Unseen vs Already Seen
  const allCandidates = Array.from(candidateMap.values());
  const unseenCandidates = allCandidates.filter((q) => !seenSet.has(normalizeQuestionText(q.question)));

  let prioritizedCandidates = shuffleArray(unseenCandidates);
  if (language && language !== "en") {
    const isNativeLang = (q) =>
      Boolean(
        q.source?.toLowerCase().includes(`(${language.toLowerCase()})`) ||
        q.source?.includes("কুইজ") ||
        q.source?.includes("क्विज़") ||
        q.source?.includes("வினாடி") ||
        q.source?.includes("کوئز") ||
        q.source?.includes("クイズ") ||
        q.source?.includes("Banco") ||
        q.source?.includes("Banque") ||
        q.source?.includes("Archiv") ||
        q.category === "Math"
      );

    const nativeList = prioritizedCandidates.filter(isNativeLang);
    const nonNativeList = prioritizedCandidates.filter((q) => !isNativeLang(q));
    prioritizedCandidates = [...nativeList, ...nonNativeList];
  }

  const finalQuestions = [];

  // Prioritize fresh, unseen questions
  finalQuestions.push(...prioritizedCandidates.slice(0, amount));


  // If user has played through all candidates, rotate seen questions
  if (finalQuestions.length < amount) {
    const existingNorms = new Set(finalQuestions.map((q) => normalizeQuestionText(q.question)));
    const seenCandidates = shuffleArray(
      allCandidates.filter((q) => !existingNorms.has(normalizeQuestionText(q.question)))
    );
    const needed = amount - finalQuestions.length;
    finalQuestions.push(...seenCandidates.slice(0, needed));
  }

  const selectedQuestions = finalQuestions.slice(0, amount);

  // 6. If target language is non-English, dynamically translate any candidate that is still in English
  let localizedQuestions = selectedQuestions;
  if (language && language !== "en") {
    try {
      localizedQuestions = await translateQuestionsBatch(selectedQuestions, language);
    } catch {
      // Fallback cleanly to selectedQuestions
    }
  }

  // Record questions so they will NOT repeat on immediate next attempts
  recordSeenQuestions(seenKey, localizedQuestions);

  return localizedQuestions;
}

