import express from "express";
import bcrypt from "bcryptjs";
import User, { toSafeUserObject } from "../models/User.js";
import { getDBStatus, ensureDBConnected, isSupabaseConfigured } from "../config/supabase.js";

/**
 * Parse all configured administrators from environment variables
 * Supports:
 *  1. Primary: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL
 *  2. Numbered: ADMIN_1_USERNAME, ADMIN_2_USERNAME, ADMIN_3_USERNAME, etc.
 *  3. Delimited list: ADMIN_ACCOUNTS="user1:pass1:email1, user2:pass2:email2"
 *  4. JSON array: ADMIN_USERS='[{"username":"...","password":"...","email":"..."}]'
 */
export function getParsedAdmins(env = process.env) {
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

  // 1. Primary ADMIN_...
  if (env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
    add(env.ADMIN_USERNAME, env.ADMIN_PASSWORD, env.ADMIN_EMAIL, env.ADMIN_NAME);
  }

  // 2. Numbered admins: ADMIN_1_..., ADMIN_2_..., etc.
  for (let i = 1; i <= 50; i++) {
    const u = env[`ADMIN_${i}_USERNAME`];
    const p = env[`ADMIN_${i}_PASSWORD`];
    const e = env[`ADMIN_${i}_EMAIL`];
    const n = env[`ADMIN_${i}_NAME`];
    if (u && p) {
      add(u, p, e, n);
    }
  }

  // Dynamic scan for any ADMIN_<ID>_USERNAME
  Object.keys(env).forEach((key) => {
    const match = key.match(/^ADMIN_([A-Za-z0-9_]+)_USERNAME$/);
    if (match) {
      const id = match[1];
      const u = env[key];
      const p = env[`ADMIN_${id}_PASSWORD`];
      const e = env[`ADMIN_${id}_EMAIL`];
      const n = env[`ADMIN_${id}_NAME`];
      if (u && p) add(u, p, e, n);
    }
  });

  // 3. ADMIN_ACCOUNTS="user:pass:email, user2:pass2:email2"
  if (env.ADMIN_ACCOUNTS) {
    env.ADMIN_ACCOUNTS.split(",").forEach((entry) => {
      const parts = entry.trim().split(":");
      if (parts.length >= 2) {
        add(parts[0], parts[1], parts[2] || "", parts[3] || "");
      }
    });
  }

  // 4. ADMIN_USERS JSON array
  if (env.ADMIN_USERS) {
    try {
      const list = JSON.parse(env.ADMIN_USERS);
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

export function isConfiguredAdmin(identifier, env = process.env) {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  const admins = getParsedAdmins(env);
  return admins.some((a) => a.username === clean || a.email === clean);
}

const router = express.Router();

/**
 * Health check & Supabase status
 */
router.get("/status", async (req, res) => {
  let dbStatus = getDBStatus();
  if (isSupabaseConfigured() && !dbStatus.connected) {
    await ensureDBConnected();
    dbStatus = getDBStatus();
  }
  return res.json({
    status: "online",
    serverTime: new Date().toISOString(),
    database: dbStatus,
  });
});

/**
 * Register a new user in Supabase
 */
router.post("/register", async (req, res) => {
  try {
    const { name, identifier, username: inputUsername, email: inputEmail, password } = req.body;

    const trimmedName = (name || "").trim();
    const trimmedPassword = (password || "").trim();

    let username = (inputUsername || "").trim().toLowerCase();
    let email = (inputEmail || "").trim().toLowerCase();

    if (!username && !email && identifier) {
      const trimmedId = identifier.trim();
      const isEmail = trimmedId.includes("@");
      username = (isEmail ? trimmedId.split("@")[0] : trimmedId).toLowerCase();
      email = (isEmail ? trimmedId : `${trimmedId}@quizpulse.com`).toLowerCase();
    } else if (!username && email) {
      email = `${username}@quizpulse.com`.toLowerCase();
    } else if (!username && email) {
      username = email.split("@")[0].toLowerCase();
    }

    if (!trimmedName || !username || !trimmedPassword) {
      return res.status(400).json({ error: "Full Name, Username, and Password are required." });
    }

    if (trimmedPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters." });
    }

    // Check reserved administrator names from .env
    if (isConfiguredAdmin(username) || isConfiguredAdmin(email)) {
      return res.status(400).json({ error: "This username/email is reserved for administrator accounts." });
    }

    // Check Supabase connectivity
    const isConnected = await ensureDBConnected();
    const dbStatus = getDBStatus();
    if (!isConnected) {
      return res.status(503).json({
        error: "Supabase database is currently not connected. Stored in local fallback.",
        offline: true,
        dbError: dbStatus.error
      });
    }

    // Check if user already exists in Supabase
    const existing = await User.findOne({ username, email });
    if (existing) {
      return res.status(409).json({ error: "An account with this username or email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

    const newUser = await User.create({
      name: trimmedName,
      username,
      email,
      password: hashedPassword,
      role: "user",
      avatar: trimmedName.charAt(0).toUpperCase() || "U"
    });

    console.log(`👤 New user registered in Supabase: @${newUser.username} (${newUser.email})`);

    return res.status(201).json({
      message: "User registered successfully in Supabase",
      user: toSafeUserObject(newUser),
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error during registration: " + err.message });
  }
});

/**
 * Login user & authenticate against Supabase (CANDIDATES ONLY)
 * Admin credentials are strictly rejected here and must use /api/auth/admin-login
 */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const trimmedId = (identifier || "").trim().toLowerCase();
    const trimmedPassword = (password || "").trim();

    if (!trimmedId || !trimmedPassword) {
      return res.status(400).json({ error: "Please enter your username/email and password." });
    }

    // STRICT CHECK: Prohibit administrator credentials from normal candidate login
    // Behaves identically to invalid credentials so no admin info is leaked
    if (isConfiguredAdmin(trimmedId)) {
      return res.status(401).json({
        error: "Invalid username/email or password."
      });
    }

    const isConnected = await ensureDBConnected();
    const dbStatus = getDBStatus();
    if (!isConnected) {
      return res.status(503).json({
        error: "Supabase service is currently offline. Falling back to local storage.",
        offline: true,
        dbError: dbStatus.error
      });
    }

    // Regular user login: Look up by username or email in Supabase
    const user = await User.findOne({ username: trimmedId, email: trimmedId });

    if (!user) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    // STRICT CHECK: Forbid accounts with admin role or admin usernames from normal candidate login
    if (
      user.role === "admin" ||
      isConfiguredAdmin(user.username) ||
      isConfiguredAdmin(user.email)
    ) {
      return res.status(401).json({
        error: "Invalid username/email or password."
      });
    }

    // Verify password (supports bcrypt hash or legacy plain string)
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(trimmedPassword, user.password);
    } else {
      isMatch = user.password === trimmedPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    await User.updateLastLogin(user.id);
    console.log(`🔑 Candidate authenticated via Supabase: @${user.username} (${user.email})`);

    return res.json({
      message: "Login successful",
      user: toSafeUserObject(user)
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login: " + err.message });
  }
});

/**
 * Fetch current user from Supabase (for session refresh)
 */
router.get("/me", async (req, res) => {
  try {
    const isConnected = await ensureDBConnected();
    if (!isConnected) {
      return res.status(503).json({ error: "Supabase database offline", offline: true });
    }

    const userId = req.headers["x-user-id"] || req.query.userId;
    const identifier = req.query.identifier;

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (identifier) {
      const clean = identifier.trim().toLowerCase();
      user = await User.findOne({ username: clean, email: clean });
    }

    if (!user) {
      return res.status(404).json({ error: "User session not found in Supabase." });
    }

    return res.json({
      message: "User session valid",
      user: toSafeUserObject(user)
    });
  } catch (err) {
    console.error("Fetch me error:", err);
    return res.status(500).json({ error: "Error fetching user data: " + err.message });
  }
});

/**
 * Record completed quiz attempt & sync user stats into Supabase
 */
router.post("/quiz-result", async (req, res) => {
  try {
    const isConnected = await ensureDBConnected();
    if (!isConnected) {
      return res.status(503).json({ error: "Supabase database offline", offline: true });
    }

    const { userId, quizAttempt } = req.body;
    if (!userId || !quizAttempt) {
      return res.status(400).json({ error: "User ID and quiz result data required." });
    }

    const updatedUser = await User.recordQuizAttempt(userId, quizAttempt);
    console.log(`📊 Quiz recorded in Supabase for user @${updatedUser.username}: score=${quizAttempt.score}`);

    return res.json({
      message: "Quiz result recorded successfully in Supabase",
      user: toSafeUserObject(updatedUser)
    });
  } catch (err) {
    console.error("Record quiz error:", err);
    return res.status(500).json({ error: "Error recording quiz result: " + err.message });
  }
});

/**
 * Fetch all users (for Admin Dashboard) from Supabase
 */
router.get("/users", async (req, res) => {
  try {
    const isConnected = await ensureDBConnected();
    const dbStatus = getDBStatus();
    if (!isConnected) {
      return res.json({ count: 0, users: [], offline: true, error: dbStatus.error });
    }

    const users = await User.findAll();
    return res.json({
      count: users.length,
      users: users.map(toSafeUserObject)
    });
  } catch (err) {
    console.error("Fetch all users error:", err);
    return res.json({ count: 0, users: [], error: err.message });
  }
});

/**
 * Sync offline users created locally into Supabase
 */
router.post("/sync-offline-users", async (req, res) => {
  try {
    const isReady = await ensureDBConnected();
    if (!isReady) {
      return res.status(503).json({ error: "Supabase is offline", offline: true });
    }

    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.json({ synced: 0, message: "No offline users to sync" });
    }

    let syncedCount = 0;
    for (const u of users) {
      const cleanUsername = (u.username || "").trim().toLowerCase();
      const cleanEmail = (u.email || `${cleanUsername}@quizpulse.com`).trim().toLowerCase();

      if (!cleanUsername) continue;
      if (isConfiguredAdmin(cleanUsername) || isConfiguredAdmin(cleanEmail)) continue;

      const existing = await User.findOne({ username: cleanUsername, email: cleanEmail });

      if (!existing) {
        let passwordToStore = u.password || "user1234";
        if (!passwordToStore.startsWith("$2a$") && !passwordToStore.startsWith("$2b$")) {
          const salt = await bcrypt.genSalt(10);
          passwordToStore = await bcrypt.hash(passwordToStore, salt);
        }

        await User.create({
          name: u.name || cleanUsername,
          username: cleanUsername,
          email: cleanEmail,
          password: passwordToStore,
          role: u.role || "user",
          avatar: u.avatar || (u.name ? u.name.charAt(0).toUpperCase() : "U"),
          stats: u.stats || {},
          quizHistory: u.quizHistory || []
        });

        syncedCount++;
        console.log(`🔄 Synced local user into Supabase: @${cleanUsername}`);
      }
    }

    return res.json({
      success: true,
      synced: syncedCount,
      message: `Successfully synced ${syncedCount} user(s) into Supabase`
    });
  } catch (err) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Sync failed: " + err.message });
  }
});

/**
 * Dedicated Admin Login Route (Validated against .env)
 */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const rawUser = (username || "").trim();
    const rawEmail = (email || "").trim();
    const cleanPass = (password || "").trim();

    if ((!rawUser && !rawEmail) || !cleanPass) {
      return res.status(400).json({ error: "Admin Username (or Email) and Password are required." });
    }

    const admins = getParsedAdmins();
    if (admins.length === 0) {
      return res.status(500).json({ error: "No administrator accounts are configured in .env." });
    }

    // Case-insensitive normalization (handles admiN, ADmin, ADMIN, etc.)
    const cleanUser = rawUser ? rawUser.toLowerCase() : "";
    const cleanEmail = rawEmail ? rawEmail.toLowerCase() : "";

    // Match against any configured admin account in .env
    const matchedAdmin = admins.find((a) => {
      const userMatches = !cleanUser || cleanUser === a.username || (a.email && cleanUser === a.email);
      const emailMatches = !cleanEmail || (a.email && cleanEmail === a.email) || cleanEmail === a.username;
      return (cleanUser || cleanEmail) && userMatches && emailMatches && cleanPass === a.password;
    });

    if (!matchedAdmin) {
      return res.status(401).json({
        error: "Unauthorized: Provided credentials do not match any authorized ADMIN account in .env."
      });
    }

    const envUser = matchedAdmin.username;
    const envEmail = matchedAdmin.email;
    const envName = matchedAdmin.name || "System Administrator";

    // Always FETCH the real admin record from Supabase database case-insensitively
    const isConnected = await ensureDBConnected();
    if (isConnected) {
      try {
        let adminUser = await User.findOne({ username: envUser });
        if (!adminUser && envEmail) {
          adminUser = await User.findOne({ email: envEmail });
        }
        if (!adminUser && cleanUser) {
          adminUser = await User.findOne({ username: cleanUser });
        }
        if (!adminUser && cleanEmail) {
          adminUser = await User.findOne({ email: cleanEmail });
        }

        if (!adminUser) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(cleanPass, salt);
          adminUser = await User.create({
            name: envName,
            username: envUser,
            email: envEmail || `${envUser}@quizpulse.com`,
            password: hashedPassword,
            role: "admin",
            avatar: "🛡️"
          });
        } else {
          await User.updateLastLogin(adminUser.id);
        }

        return res.json({
          message: "Admin authentication successful",
          user: toSafeUserObject(adminUser)
        });
      } catch (e) {
        console.warn("Supabase admin query error:", e.message);
      }
    }

    return res.json({
      message: "Admin authentication successful (Verified against .env)",
      user: {
        id: "admin_" + envUser,
        name: envName,
        username: envUser,
        email: envEmail || `${envUser}@quizpulse.com`,
        role: "admin",
        avatar: "🛡️",
        stats: { gamesPlayed: 0, highScore: 0, accuracy: 100 }
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Server error during admin login: " + err.message });
  }
});

/**
 * Dedicated Admin Register / Provision Route (Validated against .env)
 */
router.post("/admin-register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const cleanName = (name || "System Administrator").trim();

    if (!cleanEmail || !cleanUser || !cleanPass) {
      return res.status(400).json({ error: "Admin Email, Username, and Password are all required." });
    }

    const admins = getParsedAdmins();
    if (admins.length === 0) {
      return res.status(500).json({ error: "No administrator accounts are configured in .env." });
    }

    const matchedAdmin = admins.find((a) => {
      const userMatches = cleanUser === a.username;
      const emailMatches = !a.email || cleanEmail === a.email;
      return userMatches && emailMatches && cleanPass === a.password;
    });

    if (!matchedAdmin) {
      return res.status(403).json({
        error: "Access Denied: Admin registration requires credentials matching an authorized ADMIN account in .env."
      });
    }

    const envUser = matchedAdmin.username;
    const envEmail = matchedAdmin.email || cleanEmail;
    const effectiveName = cleanName || matchedAdmin.name || "System Administrator";

    const isConnected = await ensureDBConnected();
    if (isConnected) {
      try {
        let adminUser = await User.findOne({ username: envUser, email: envEmail });
        if (!adminUser) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(cleanPass, salt);
          adminUser = await User.create({
            name: effectiveName,
            username: envUser,
            email: envEmail,
            password: hashedPassword,
            role: "admin",
            avatar: "🛡️"
          });
        }
        return res.json({
          message: "Admin registered & provisioned in Supabase",
          user: toSafeUserObject(adminUser)
        });
      } catch (e) {
        console.warn("Supabase admin provision notice:", e.message);
      }
    }

    return res.json({
      message: "Admin registered successfully (Verified against .env)",
      user: {
        id: "admin_" + envUser,
        name: effectiveName,
        username: envUser,
        email: envEmail,
        role: "admin",
        avatar: "🛡️"
      }
    });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ error: "Server error during admin registration: " + err.message });
  }
});

// In-memory feedback store fallback
let inMemoryFeedbacks = [];

router.post("/feedback", (req, res) => {
  const fb = {
    id: `fb_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  inMemoryFeedbacks.unshift(fb);
  return res.json({ success: true, feedback: fb });
});

router.get("/feedbacks", (req, res) => {
  return res.json({ feedbacks: inMemoryFeedbacks });
});

export default router;

