/**
 * Authentication and Supabase Database Synchronization Service
 * Handles user login, registration, session re-validation, and quiz score syncing.
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const API_BASE = "/api/auth";

/**
 * Check backend and Supabase connection status
 */
export async function checkDbStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(7000)
    });
    if (!res.ok) throw new Error("Server returned error");
    const data = await res.json();
    const isConn = !!data.database?.connected;
    
    // Automatically sync any offline accounts to Supabase
    if (isConn) {
      syncOfflineUsersToSupabase().catch(() => {});
    }

    return {
      connected: isConn,
      provider: data.database?.provider || "Supabase",
      host: data.database?.host,
      isConfigured: data.database?.isConfigured,
      error: data.database?.error
    };
  } catch {
    // If backend isn't reached, check direct Supabase client connection
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("users").select("id", { count: "exact", head: true }).limit(1);
        if (!error) {
          syncOfflineUsersToSupabase().catch(() => {});
          return { connected: true, provider: "Supabase (Direct)", isConfigured: true, error: null };
        }
      } catch {}
    }
    return { connected: false, error: "Cannot reach backend server" };
  }
}

/**
 * Parse all configured administrators from environment variables
 * Supports:
 *  1. Primary: VITE_ADMIN_USERNAME, VITE_ADMIN_PASSWORD, VITE_ADMIN_EMAIL
 *  2. Numbered: VITE_ADMIN_1_USERNAME, VITE_ADMIN_2_USERNAME, etc.
 *  3. Delimited list: VITE_ADMIN_ACCOUNTS="user1:pass1:email1, user2:pass2:email2"
 *  4. JSON array: VITE_ADMIN_USERS='[{"username":"...","password":"...","email":"..."}]'
 */
export function getParsedAdmins() {
  const env = import.meta.env;
  const admins = [];
  const seen = new Set();

  const add = (username, password, email, name) => {
    const u = (username || "").trim().toLowerCase();
    const p = (password || "").trim();
    const e = (email || (u ? `${u}@quizpulse.com` : "")).trim().toLowerCase();
    if (u && p && !seen.has(u)) {
      seen.add(u);
      admins.push({
        username: u,
        password: p,
        email: e,
        name: (name || "System Administrator").trim()
      });
    }
  };

  // 1. Primary VITE_ADMIN_... or ADMIN_...
  const primUser = env.VITE_ADMIN_USERNAME || env.ADMIN_USERNAME;
  const primPass = env.VITE_ADMIN_PASSWORD || env.ADMIN_PASSWORD;
  const primEmail = env.VITE_ADMIN_EMAIL || env.ADMIN_EMAIL;
  const primName = env.VITE_ADMIN_NAME || env.ADMIN_NAME;
  if (primUser && primPass) {
    add(primUser, primPass, primEmail, primName);
  }

  // 2. Numbered admins: VITE_ADMIN_1_..., VITE_ADMIN_2_..., etc. (and ADMIN_1_...)
  for (let i = 1; i <= 50; i++) {
    const u = env[`VITE_ADMIN_${i}_USERNAME`] || env[`ADMIN_${i}_USERNAME`];
    const p = env[`VITE_ADMIN_${i}_PASSWORD`] || env[`ADMIN_${i}_PASSWORD`];
    const e = env[`VITE_ADMIN_${i}_EMAIL`] || env[`ADMIN_${i}_EMAIL`];
    const n = env[`VITE_ADMIN_${i}_NAME`] || env[`ADMIN_${i}_NAME`];
    if (u && p) {
      add(u, p, e, n);
    }
  }

  // Dynamic scan for any VITE_ADMIN_<ID>_USERNAME or ADMIN_<ID>_USERNAME
  Object.keys(env).forEach((key) => {
    let match = key.match(/^VITE_ADMIN_([A-Za-z0-9_]+)_USERNAME$/);
    if (!match) match = key.match(/^ADMIN_([A-Za-z0-9_]+)_USERNAME$/);
    if (match) {
      const id = match[1];
      const u = env[key];
      const p = env[`VITE_ADMIN_${id}_PASSWORD`] || env[`ADMIN_${id}_PASSWORD`];
      const e = env[`VITE_ADMIN_${id}_EMAIL`] || env[`ADMIN_${id}_EMAIL`];
      const n = env[`VITE_ADMIN_${id}_NAME`] || env[`ADMIN_${id}_NAME`];
      if (u && p) add(u, p, e, n);
    }
  });

  // 3. VITE_ADMIN_ACCOUNTS or ADMIN_ACCOUNTS: "user1:pass1:email1, user2:pass2:email2"
  const accountsStr = env.VITE_ADMIN_ACCOUNTS || env.ADMIN_ACCOUNTS;
  if (accountsStr) {
    accountsStr.split(",").forEach((entry) => {
      const parts = entry.trim().split(":");
      if (parts.length >= 2) {
        add(parts[0], parts[1], parts[2] || "", parts[3] || "");
      }
    });
  }

  // 4. VITE_ADMIN_USERS or ADMIN_USERS JSON array
  const usersJson = env.VITE_ADMIN_USERS || env.ADMIN_USERS;
  if (usersJson) {
    try {
      const list = JSON.parse(usersJson);
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item?.username && item?.password) {
            add(item.username, item.password, item.email, item.name);
          }
        });
      }
    } catch {}
  }

  return admins;
}

export function isConfiguredAdmin(identifier) {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  const admins = getParsedAdmins();
  return admins.some((a) => a.username === clean || a.email === clean);
}

/**
 * Log in a user via Supabase (CANDIDATES ONLY)
 * Admin accounts are strictly barred from normal login and must use adminLogin()
 */
export async function loginUser(identifier, password) {
  const cleanId = (identifier || "").trim().toLowerCase();

  // STRICT REJECTION: Admin credentials are not accepted in normal login
  if (isConfiguredAdmin(cleanId)) {
    return {
      success: false,
      error: "Invalid username/email or password."
    };
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
      signal: AbortSignal.timeout(8000)
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.offline && isSupabaseConfigured && supabase) {
        return directSupabaseLogin(identifier, password);
      }
      return { success: false, error: data.error || "Login failed" };
    }

    if (data.user?.role === "admin" || isConfiguredAdmin(data.user?.username) || isConfiguredAdmin(data.user?.email)) {
      return {
        success: false,
        error: "Invalid username/email or password."
      };
    }

    return { success: true, user: data.user, message: data.message };
  } catch (err) {
    console.warn("Express API unreachable during login, trying direct Supabase:", err.message);
    if (isSupabaseConfigured && supabase) {
      return directSupabaseLogin(identifier, password);
    }
    return fallbackLocalLogin(identifier, password);
  }
}

/**
 * Direct Supabase fallback login if Express backend is momentarily busy
 */
async function directSupabaseLogin(identifier, password) {
  try {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (isConfiguredAdmin(cleanId)) {
      return {
        success: false,
        error: "Invalid username/email or password."
      };
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
      .limit(1);

    if (error || !users || users.length === 0) {
      return fallbackLocalLogin(identifier, password);
    }

    const u = users[0];

    // Reject admin role in direct Supabase normal login
    if (u.role === "admin" || isConfiguredAdmin(u.username) || isConfiguredAdmin(u.email)) {
      return {
        success: false,
        error: "Invalid username/email or password."
      };
    }

    // Check password
    if (u.password !== cleanPass && !u.password.startsWith("$2")) {
      return { success: false, error: "Invalid username/email or password." };
    }

    const safeUser = {
      id: u.id,
      _id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role || "user",
      avatar: u.avatar || (u.name ? u.name.charAt(0).toUpperCase() : "U"),
      stats: u.stats || {},
      quizHistory: u.quiz_history || u.quizHistory || []
    };

    return { success: true, user: safeUser, message: "Login successful (Supabase direct)" };
  } catch {
    return fallbackLocalLogin(identifier, password);
  }
}

/**
 * Register a new user in Supabase
 */
export async function registerUser(name, identifierOrData, password) {
  let cleanName = (name || "").trim();
  let cleanPassword = (password || "").trim();
  let cleanUsername = "";
  let cleanEmail = "";

  if (typeof identifierOrData === "object" && identifierOrData !== null) {
    cleanUsername = (identifierOrData.username || "").trim().toLowerCase();
    cleanEmail = (identifierOrData.email || "").trim().toLowerCase();
  } else {
    const cleanId = (identifierOrData || "").trim();
    const isEmail = cleanId.includes("@");
    cleanUsername = (isEmail ? cleanId.split("@")[0] : cleanId).toLowerCase();
    cleanEmail = (isEmail ? cleanId : `${cleanUsername}@quizpulse.com`).toLowerCase();
  }

  // 1. Try registering via Express backend API first
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword
      }),
      signal: AbortSignal.timeout(9000)
    });

    const data = await res.json();

    if (res.ok && data.user) {
      return { success: true, user: data.user, message: data.message, isOffline: false };
    }

    if (!data.offline) {
      return { success: false, error: data.error || "Registration failed" };
    }
  } catch (err) {
    console.warn("Backend API not reachable, inserting directly into Supabase:", err.message);
  }

  // 2. Direct Supabase insertion fallback (Guarantees user is stored in Supabase!)
  if (isSupabaseConfigured && supabase) {
    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .or(`username.ilike.${cleanUsername},email.ilike.${cleanEmail}`)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "An account with this username or email already exists." };
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert({
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
          role: "user",
          avatar: cleanName.charAt(0).toUpperCase() || "U",
          stats: { gamesPlayed: 0, highScore: 0, totalScore: 0, totalQuestions: 0, correctAnswers: 0, accuracy: 0, streak: 0 },
          quiz_history: []
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      console.log("✅ User registered directly in Supabase:", inserted.username);
      const safe = {
        id: inserted.id,
        _id: inserted.id,
        name: inserted.name,
        username: inserted.username,
        email: inserted.email,
        role: inserted.role,
        avatar: inserted.avatar,
        stats: inserted.stats,
        quizHistory: inserted.quiz_history || []
      };

      return { success: true, user: safe, isOffline: false };
    } catch (sbErr) {
      console.error("Direct Supabase registration error:", sbErr.message);
      return { success: false, error: "Supabase registration error: " + sbErr.message };
    }
  }

  // 3. Fallback to localStorage only if Supabase is completely unconfigured
  const localResult = fallbackLocalRegister(cleanName, { username: cleanUsername, email: cleanEmail }, cleanPassword);
  return { ...localResult, isOffline: true };
}


/**
 * Re-authenticate / fetch latest user data from Supabase
 */
export async function fetchCurrentUser(userId, identifier) {
  if (!userId && !identifier) return { success: false, error: "No user identifier provided" };

  try {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (identifier) params.append("identifier", identifier);

    const res = await fetch(`${API_BASE}/me?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "x-user-id": userId } : {})
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || "User session invalid" };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Record a completed quiz attempt into Supabase
 */
export async function recordQuizResult(userId, quizAttempt) {
  if (!userId) return { success: false, error: "No user ID" };

  try {
    const res = await fetch(`${API_BASE}/quiz-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, quizAttempt }),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      return { success: false, error: "Failed to record quiz in Supabase" };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch (err) {
    console.warn("Could not save quiz attempt to Supabase:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sync offline users created in localStorage into Supabase
 */
export async function syncOfflineUsersToSupabase() {
  try {
    const raw = localStorage.getItem("quiz_users");
    if (!raw) return { synced: 0 };
    const localUsers = JSON.parse(raw);
    if (!Array.isArray(localUsers) || localUsers.length === 0) return { synced: 0 };

    // 1. Try backend sync endpoint first
    try {
      const res = await fetch(`${API_BASE}/sync-offline-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: localUsers }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.synced > 0) {
          console.log(`✅ Synced ${data.synced} offline account(s) to Supabase.`);
        }
        return data;
      }
    } catch {}

    // 2. Direct Supabase sync fallback
    if (isSupabaseConfigured && supabase) {
      let count = 0;
      for (const u of localUsers) {
        if (!u.username || isConfiguredAdmin(u.username) || isConfiguredAdmin(u.email)) continue;
        const { data: exists } = await supabase.from("users").select("id").eq("username", u.username).limit(1);
        if (!exists || exists.length === 0) {
          await supabase.from("users").insert({
            name: u.name || u.username,
            username: u.username,
            email: u.email || `${u.username}@quizpulse.com`,
            password: u.password || "user1234",
            role: u.role || "user",
            avatar: u.avatar || (u.name ? u.name.charAt(0).toUpperCase() : "U"),
            stats: u.stats || {},
            quiz_history: u.quizHistory || []
          });
          count++;
        }
      }
      if (count > 0) {
        console.log(`✅ Direct synced ${count} offline account(s) to Supabase.`);
      }
      return { synced: count };
    }

    return { synced: 0 };
  } catch (err) {
    return { synced: 0, error: err.message };
  }
}

// Keep backward compatibility alias
export const syncOfflineUsersToMongoDB = syncOfflineUsersToSupabase;

/**
 * Fetch all registered users from Supabase (for Admin Dashboard)
 */
export async function getAllUsersFromDb() {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, users: data.users || [] };
    }
  } catch {}

  // Direct Supabase fallback
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (!error && data) {
        return {
          success: true,
          users: data.map((u) => ({
            ...u,
            quizHistory: u.quiz_history || u.quizHistory || []
          }))
        };
      }
    } catch {}
  }

  // Fallback to local storage
  const local = JSON.parse(localStorage.getItem("quiz_users") || "[]");
  return { success: false, users: local, isFallback: true };
}


// -------------------------------------------------------------
// Resilient Local Storage Fallbacks (When server is offline or launching)
// -------------------------------------------------------------

function fallbackLocalLogin(identifier, password) {
  const users = JSON.parse(localStorage.getItem("quiz_users") || "[]");
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  // STRICT REJECTION: Admin credentials must never be accepted in normal login
  if (isConfiguredAdmin(cleanId)) {
    return {
      success: false,
      error: "Invalid username/email or password."
    };
  }

  const found = users.find(
    (u) =>
      (u.username?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId) &&
      u.password === cleanPass
  );

  if (found) {
    if (found.role === "admin" || isConfiguredAdmin(found.username) || isConfiguredAdmin(found.email)) {
      return {
        success: false,
        error: "Administrator accounts cannot log in through normal candidate login. Please use the dedicated Admin Login portal (/admin-login)."
      };
    }
    const safeUser = { ...found };
    delete safeUser.password;
    return { success: true, user: safeUser, isOffline: true };
  }

  return { success: false, error: "Invalid username/email or password (Offline Mode)." };
}

function fallbackLocalRegister(name, identifierOrData, password) {
  const users = JSON.parse(localStorage.getItem("quiz_users") || "[]");
  const cleanName = (name || "").trim();

  let username = "";
  let email = "";

  if (typeof identifierOrData === "object" && identifierOrData !== null) {
    username = (identifierOrData.username || "").trim().toLowerCase();
    email = (identifierOrData.email || "").trim().toLowerCase();
    if (!email && username) email = `${username}@quizpulse.com`;
    if (!username && email) username = email.split("@")[0].toLowerCase();
  } else {
    const cleanId = (identifierOrData || "").trim();
    const isEmail = cleanId.includes("@");
    username = (isEmail ? cleanId.split("@")[0] : cleanId).toLowerCase();
    email = (isEmail ? cleanId : `${cleanId}@quizpulse.com`).toLowerCase();
  }

  if (isConfiguredAdmin(username) || isConfiguredAdmin(email)) {
    return { success: false, error: "This username or email is reserved for administrators." };
  }

  const existing = users.find(
    (u) => u.username?.toLowerCase() === username || u.email?.toLowerCase() === email
  );

  if (existing) {
    return { success: false, error: "An account with this username or email already exists." };
  }

  const newUser = {
    id: `local_${Date.now()}`,
    name: cleanName,
    username,
    email,
    password,
    role: "user",
    avatar: cleanName.charAt(0).toUpperCase() || "U",
    stats: { gamesPlayed: 0, highScore: 0, totalScore: 0, accuracy: 0 },
    quizHistory: [],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem("quiz_users", JSON.stringify(users));

  const safe = { ...newUser };
  delete safe.password;
  return { success: true, user: safe, isOffline: true };
}

// -------------------------------------------------------------
// Admin Authentication (Strictly Validated Against .env Configuration)
// -------------------------------------------------------------

export const getEnvAdminConfig = () => {
  const admins = getParsedAdmins();
  if (admins.length > 0) {
    return {
      email: admins[0].email,
      username: admins[0].username,
      password: admins[0].password
    };
  }
  return {
    email: "",
    username: "",
    password: ""
  };
};

/**
 * Authenticate Administrator using Email, Username, and Password registered in .env (Case-Insensitive)
 */
export async function adminLogin(email, username, password) {
  const admins = getParsedAdmins();

  const rawEmail = (email || "").trim();
  const rawUser = (username || "").trim();
  const cleanPassword = (password || "").trim();

  if ((!rawEmail && !rawUser) || !cleanPassword) {
    return { success: false, error: "Please enter your Admin Username (or Email) and Password." };
  }

  if (admins.length === 0) {
    return {
      success: false,
      error: "No administrator accounts are configured in .env file (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD)."
    };
  }

  const cleanUsername = rawUser ? rawUser.toLowerCase() : "";
  const cleanEmail = rawEmail ? rawEmail.toLowerCase() : "";

  // 1. Try Express backend endpoint
  try {
    const res = await fetch(`${API_BASE}/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPassword
      }),
      signal: AbortSignal.timeout(6000)
    });

    const data = await res.json();
    if (res.ok && data.user) {
      return { success: true, user: data.user, message: data.message };
    }
    if (!data.offline && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn("Backend admin-login route unreachable, using direct verification:", err.message);
  }

  // 2. Direct verification against .env and FETCH from Supabase (client-side fallback)
  const matchedAdmin = admins.find((a) => {
    const userMatches = !cleanUsername || cleanUsername === a.username || (a.email && cleanUsername === a.email);
    const emailMatches = !cleanEmail || (a.email && cleanEmail === a.email) || cleanEmail === a.username;
    return (cleanUsername || cleanEmail) && userMatches && emailMatches && cleanPassword === a.password;
  });

  if (matchedAdmin) {
    const effectiveUser = matchedAdmin.username;
    const effectiveEmail = matchedAdmin.email || `${effectiveUser}@quizpulse.com`;
    const effectiveName = matchedAdmin.name || "System Administrator";

    // Direct Supabase database lookup: FETCH the real admin record from Supabase!
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbAdmin } = await supabase
          .from("users")
          .select("*")
          .or(`username.ilike.${effectiveUser},email.ilike.${effectiveEmail}`)
          .limit(1)
          .maybeSingle();

        if (dbAdmin) {
          return {
            success: true,
            user: {
              id: dbAdmin.id,
              _id: dbAdmin.id,
              name: dbAdmin.name || effectiveName,
              username: dbAdmin.username,
              email: dbAdmin.email,
              role: "admin",
              avatar: dbAdmin.avatar || "🛡️",
              stats: dbAdmin.stats || { gamesPlayed: 0, highScore: 0, accuracy: 100 },
              quizHistory: dbAdmin.quiz_history || [],
              lastLoginAt: new Date().toISOString()
            },
            message: "Admin authenticated and fetched from Supabase."
          };
        }
      } catch (err) {
        console.warn("Direct Supabase admin query warning:", err.message);
      }
    }

    const adminUser = {
      id: "admin_" + (effectiveUser || "master"),
      _id: "admin_" + (effectiveUser || "master"),
      name: effectiveName,
      username: effectiveUser,
      email: effectiveEmail,
      role: "admin",
      avatar: "🛡️",
      stats: { gamesPlayed: 0, highScore: 0, accuracy: 100 },
      lastLoginAt: new Date().toISOString()
    };
    return { success: true, user: adminUser, message: "Admin authenticated via .env verified credentials." };
  }

  return {
    success: false,
    error: "Access Denied: Provided credentials do not match any authorized ADMIN account in .env."
  };
}

/**
 * Register / Provision Administrator Account using credentials registered in .env
 */
export async function adminRegister(email, username, password, name = "Administrator") {
  const admins = getParsedAdmins();

  const rawEmail = (email || "").trim();
  const rawUser = (username || "").trim();
  const cleanPassword = (password || "").trim();

  const cleanEmail = (rawEmail || "").toLowerCase();
  const cleanUsername = (rawUser || "").toLowerCase();

  if ((!rawEmail && !rawUser) || !cleanPassword) {
    return { success: false, error: "Admin Username (or Email) and Password are required." };
  }

  if (admins.length === 0) {
    return {
      success: false,
      error: "No administrator accounts are configured in .env file."
    };
  }

  // Verify against .env configuration (case-insensitive)
  const matchedAdmin = admins.find((a) => {
    return cleanUsername === a.username && (!a.email || cleanEmail === a.email) && cleanPassword === a.password;
  });

  if (!matchedAdmin) {
    return {
      success: false,
      error: "Authorization Error: You can only register as an admin using authorized credentials defined in your project's .env file."
    };
  }

  const effectiveUser = matchedAdmin.username;
  const effectiveEmail = matchedAdmin.email || cleanEmail;
  const effectiveName = name || matchedAdmin.name || "System Administrator";

  // 1. Try Express backend admin registration
  try {
    const res = await fetch(`${API_BASE}/admin-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: effectiveName, email: effectiveEmail, username: effectiveUser, password: cleanPassword }),
      signal: AbortSignal.timeout(7000)
    });

    const data = await res.json();
    if (res.ok && data.user) {
      return { success: true, user: data.user, message: data.message };
    }
  } catch (err) {
    console.warn("Backend admin-register offline, creating local/Supabase admin directly:", err.message);
  }

  // 2. Direct Supabase provisioning fallback
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existing } = await supabase.from("users").select("*").eq("username", effectiveUser).maybeSingle();
      if (existing) {
        await supabase.from("users").update({ role: "admin", last_login_at: new Date().toISOString() }).eq("id", existing.id);
        return { success: true, user: { ...existing, role: "admin" } };
      }

      const { data: created, error: insErr } = await supabase.from("users").insert([{
        name: effectiveName,
        username: effectiveUser,
        email: effectiveEmail,
        password: cleanPassword,
        role: "admin",
        avatar: "🛡️",
        stats: { gamesPlayed: 0, highScore: 0, accuracy: 100 }
      }]).select().single();

      if (!insErr && created) {
        return { success: true, user: created };
      }
    } catch {}
  }

  // 3. Fallback admin user object
  const adminUser = {
    id: "admin_" + effectiveUser,
    name: effectiveName,
    username: effectiveUser,
    email: effectiveEmail,
    role: "admin",
    avatar: "🛡️",
    stats: { gamesPlayed: 0, highScore: 0, accuracy: 100 },
    createdAt: new Date().toISOString()
  };

  return { success: true, user: adminUser, message: "Admin account provisioned successfully." };
}

// -------------------------------------------------------------
// Feedback & Reviews Service
// -------------------------------------------------------------

export async function submitUserFeedback(feedbackData) {
  const newFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userName: feedbackData.userName || "Anonymous Candidate",
    userEmail: feedbackData.userEmail || "",
    userId: feedbackData.userId || "",
    rating: Number(feedbackData.rating) || 5,
    category: feedbackData.category || "General Feedback",
    message: feedbackData.message || "",
    status: "New", // "New" | "Reviewed" | "Resolved"
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  try {
    const list = JSON.parse(localStorage.getItem("quiz_feedbacks") || "[]");
    list.unshift(newFeedback);
    localStorage.setItem("quiz_feedbacks", JSON.stringify(list));
  } catch {}

  // Save to backend
  try {
    await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFeedback),
      signal: AbortSignal.timeout(4000)
    });
  } catch {}

  return { success: true, feedback: newFeedback };
}

export async function getAllFeedbacks() {
  // Try Backend
  try {
    const res = await fetch(`${API_BASE}/feedbacks`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.feedbacks && data.feedbacks.length > 0) {
        return { success: true, feedbacks: data.feedbacks };
      }
    }
  } catch {}

  // Fallback to localStorage + default realistic reviews
  const local = JSON.parse(localStorage.getItem("quiz_feedbacks") || "null");
  if (local && local.length > 0) {
    return { success: true, feedbacks: local };
  }

  const defaultFeedbacks = [
    {
      id: "fb_sample_1",
      userName: "Alex Johnson",
      userEmail: "alex.j@example.com",
      rating: 5,
      category: "Assessment Quality",
      message: "The real-time questions in the Computer Science stream were very comprehensive! Timer was well-balanced.",
      status: "Reviewed",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: "fb_sample_2",
      userName: "Sophia Martinez",
      userEmail: "sophia.m@example.com",
      rating: 4,
      category: "UI & Experience",
      message: "Love the dark mode aesthetic and instant feedback explanations. Would love to see more Science topics.",
      status: "New",
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: "fb_sample_3",
      userName: "David Kim",
      userEmail: "david.k@example.com",
      rating: 3,
      category: "Difficulty Balance",
      message: "Hard mode in Mathematics questions had a couple of very complex integral equations for a 30s timer.",
      status: "New",
      createdAt: new Date(Date.now() - 3600000 * 40).toISOString()
    }
  ];

  localStorage.setItem("quiz_feedbacks", JSON.stringify(defaultFeedbacks));
  return { success: true, feedbacks: defaultFeedbacks };
}

export async function updateFeedbackStatus(id, status) {
  try {
    const list = JSON.parse(localStorage.getItem("quiz_feedbacks") || "[]");
    const updated = list.map((f) => (f.id === id ? { ...f, status } : f));
    localStorage.setItem("quiz_feedbacks", JSON.stringify(updated));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Certificates Management Service
// -------------------------------------------------------------

export async function recordCertificate(certData) {
  const newCert = {
    id: certData.id || `QP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    userName: certData.userName || "Certified Candidate",
    userEmail: certData.userEmail || "",
    category: certData.category || "General Knowledge",
    difficulty: certData.difficulty || "Medium",
    score: certData.score || 0,
    accuracy: certData.accuracy || 75,
    distinction: certData.accuracy >= 90 ? "Gold Honors" : certData.accuracy >= 80 ? "Silver Merit" : "Certified Pass",
    issuedAt: new Date().toISOString(),
    verificationUrl: `https://quizpulse.assessment/verify/${certData.id || "sample"}`
  };

  try {
    const list = JSON.parse(localStorage.getItem("quiz_certificates") || "[]");
    const duplicate = list.find((c) => {
      const sameName = c.userName === newCert.userName || c.userEmail === newCert.userEmail;
      const sameCategory = c.category === newCert.category;
      const sameAccuracy = c.accuracy === newCert.accuracy;
      return sameName && sameCategory && sameAccuracy;
    });

    if (duplicate) {
      return { success: true, certificate: duplicate };
    }

    list.unshift(newCert);
    localStorage.setItem("quiz_certificates", JSON.stringify(list));
  } catch {}

  return { success: true, certificate: newCert };
}

export async function getAllCertificates() {
  const local = JSON.parse(localStorage.getItem("quiz_certificates") || "null");
  if (local && local.length > 0) {
    return { success: true, certificates: local };
  }

  // Derive initial certificates from user history with accuracy >= 70%
  const history = JSON.parse(localStorage.getItem("quiz_history") || "[]");
  const derived = [];

  history.forEach((h, idx) => {
    if (Number(h.accuracy) >= 70) {
      derived.push({
        id: `QP-CERT-2026-${1000 + idx}`,
        userName: h.user || "Alex Smith",
        userEmail: `${(h.user || "candidate").toLowerCase().replace(/\s+/g, "")}@example.com`,
        category: h.category || "Science",
        difficulty: h.difficulty || "Medium",
        score: Number(h.score) || 85,
        accuracy: Number(h.accuracy) || 85,
        distinction: Number(h.accuracy) >= 90 ? "Gold Honors" : Number(h.accuracy) >= 80 ? "Silver Merit" : "Certified Pass",
        issuedAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString()
      });
    }
  });

  if (derived.length === 0) {
    derived.push({
      id: "QP-CERT-2026-9810",
      userName: "Alex Smith",
      userEmail: "alex@quizpulse.com",
      category: "Tech",
      difficulty: "Hard",
      score: 120,
      accuracy: 93,
      distinction: "Gold Honors",
      issuedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    });
  }

  localStorage.setItem("quiz_certificates", JSON.stringify(derived));
  return { success: true, certificates: derived };
}
