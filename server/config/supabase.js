import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config({ path: join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";


let isConnected = false;
let connectionError = null;
let lastCheckTime = 0;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("your-project-id") &&
    !supabaseKey.includes("your-supabase")
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

/**
 * Test connectivity to Supabase
 */
export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    isConnected = false;
    connectionError = "Supabase credentials (SUPABASE_URL & SUPABASE_KEY) are missing or default in .env";
    return false;
  }

  try {
    const client = supabase;
    if (!client) {
      isConnected = false;
      connectionError = "Supabase client not initialized";
      return false;
    }

    // Ping the users table
    const { error } = await client.from("users").select("id", { count: "exact", head: true }).limit(1);

    if (error) {
      isConnected = false;
      connectionError = error.message;
      if (error.code === "PGRST205" || error.message.includes("relation \"public.users\" does not exist")) {
        connectionError = "Table 'users' does not exist yet. Please run supabase-schema.sql in your Supabase SQL Editor.";
      }
      console.warn(`⚠️ Supabase Check Warning: ${connectionError}`);
      return false;
    }

    isConnected = true;
    connectionError = null;
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message || "Failed to reach Supabase";
    console.error("⚠️ Supabase Ping Error:", connectionError);
    return false;
  }
};

export const ensureDBConnected = async () => {
  const now = Date.now();
  // Cache check result for 15 seconds to avoid spamming API on rapid requests
  if (isConnected && now - lastCheckTime < 15000) {
    return true;
  }
  lastCheckTime = now;
  return await checkSupabaseConnection();
};

export const getDBStatus = () => {
  return {
    connected: isConnected,
    provider: "Supabase (PostgreSQL)",
    host: supabaseUrl ? new URL(supabaseUrl).hostname : null,
    isConfigured: isSupabaseConfigured(),
    error: connectionError,
  };
};
