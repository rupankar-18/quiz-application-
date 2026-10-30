import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { checkSupabaseConnection, getDBStatus, isSupabaseConfigured } from "./config/supabase.js";
import authRoutes, { getParsedAdmins } from "./routes/authRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root of vite-project or current folder
dotenv.config({ path: join(__dirname, "../.env") });
dotenv.config({ path: join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-user-id", "Authorization"]
}));
app.use(express.json());

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes); // allows /api/status, /api/users directly

// Seed all configured admin accounts in Supabase strictly from .env
const seedAdminAccount = async () => {
  try {
    const admins = getParsedAdmins(process.env);

    if (admins.length === 0) {
      console.log("ℹ️ No admin accounts configured in .env (ADMIN_USERNAME & ADMIN_PASSWORD).");
      return;
    }

    for (const adm of admins) {
      const existingAdmin = await User.findOne({ username: adm.username, email: adm.email });

      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adm.password, salt);

        await User.create({
          name: adm.name || "System Administrator",
          username: adm.username,
          email: adm.email || `${adm.username}@quizpulse.com`,
          password: hashedPassword,
          role: "admin",
          avatar: "🛡️"
        });
        console.log(`🛡️ .env Admin account (@${adm.username}) initialized in Supabase.`);
      } else {
        console.log(`🛡️ .env Admin account (@${adm.username}) verified in Supabase.`);
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not seed admin account in Supabase:", err.message);
  }
};

// Start server
const startServer = () => {
  console.log("🚀 Initializing QuizPulse Supabase Backend Server...");
  
  app.listen(PORT, async () => {
    console.log(`🌐 QuizPulse API Server running at http://localhost:${PORT}`);
    
    if (isSupabaseConfigured()) {
      try {
        const connected = await checkSupabaseConnection();
        console.log(`📡 Supabase Status: ${connected ? "ONLINE (Connected)" : "STANDBY / OFFLINE (Check .env or SQL schema)"}`);
        if (connected) {
          await seedAdminAccount();
        }
      } catch (err) {
        console.warn("⚠️ Supabase check notice:", err.message);
      }
    } else {
      console.warn("⚠️ Supabase credentials not yet configured in .env. Running in offline fallback mode.");
    }
  });
};

startServer();
