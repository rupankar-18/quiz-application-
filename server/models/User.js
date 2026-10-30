import { supabase } from "../config/supabase.js";

/**
 * Normalizes a row from the Supabase `users` table into standard QuizPulse User object.
 */
export const toSafeUserObject = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role || "user",
    avatar: user.avatar || user.name?.charAt(0).toUpperCase() || "U",
    stats: user.stats || {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      streak: 0,
      lastPlayedAt: null
    },
    quizHistory: user.quiz_history || [],
    lastLoginAt: user.last_login_at || user.updated_at || user.created_at,
    createdAt: user.created_at
  };
};

export const User = {
  /**
   * Find a user by either username or email
   */
  async findOne({ username, email } = {}) {
    if (!supabase) return null;

    let query = supabase.from("users").select("*");

    if (username && email) {
      query = query.or(`username.ilike.${username.trim()},email.ilike.${email.trim()}`);
    } else if (username) {
      query = query.ilike("username", username.trim());
    } else if (email) {
      query = query.ilike("email", email.trim());
    } else {
      return null;
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.warn("User.findOne error:", error.message);
      return null;
    }
    return data;
  },

  /**
   * Find a user by ID
   */
  async findById(id) {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.warn("User.findById error:", error.message);
      return null;
    }
    return data;
  },

  /**
   * Create a new user
   */
  async create({ name, username, email, password, role = "user", avatar = "", stats = {}, quizHistory = [] }) {
    if (!supabase) throw new Error("Supabase client is not connected");

    const defaultStats = {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      streak: 0,
      lastPlayedAt: null,
      ...stats
    };

    const payload = {
      name,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      avatar: avatar || name.charAt(0).toUpperCase() || "U",
      stats: defaultStats,
      quiz_history: quizHistory,
      last_login_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from("users").insert([payload]).select().single();
    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Update user last login
   */
  async updateLastLogin(id) {
    if (!supabase || !id) return null;
    const { data, error } = await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Update last login error:", error.message);
      return null;
    }
    return data;
  },

  /**
   * Record a completed quiz attempt and update user cumulative stats
   */
  async recordQuizAttempt(userId, quizAttempt) {
    if (!supabase || !userId) throw new Error("Supabase is not initialized or invalid userId");

    const existingUser = await this.findById(userId);
    if (!existingUser) throw new Error("User not found");

    const currentStats = existingUser.stats || {};
    const currentHistory = Array.isArray(existingUser.quiz_history) ? existingUser.quiz_history : [];

    const newAttempt = {
      category: quizAttempt.category || "Mixed",
      difficulty: quizAttempt.difficulty || "Medium",
      score: quizAttempt.score || 0,
      totalQuestions: quizAttempt.totalQuestions || 10,
      accuracy: quizAttempt.accuracy || 0,
      timeTaken: quizAttempt.timeTaken || 0,
      date: new Date().toISOString()
    };

    const gamesPlayed = (currentStats.gamesPlayed || 0) + 1;
    const highScore = Math.max(currentStats.highScore || 0, quizAttempt.score || 0);
    const totalScore = (currentStats.totalScore || 0) + (quizAttempt.score || 0);
    const totalQuestions = (currentStats.totalQuestions || 0) + (quizAttempt.totalQuestions || 10);
    const correctAnswers = (currentStats.correctAnswers || 0) + (quizAttempt.correctAnswers || Math.round((quizAttempt.score || 0) / 100));
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const updatedStats = {
      ...currentStats,
      gamesPlayed,
      highScore,
      totalScore,
      totalQuestions,
      correctAnswers,
      accuracy,
      lastPlayedAt: new Date().toISOString()
    };

    const updatedHistory = [newAttempt, ...currentHistory];

    const { data, error } = await supabase
      .from("users")
      .update({
        stats: updatedStats,
        quiz_history: updatedHistory
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch all users (for Admin Dashboard)
   */
  async findAll() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("last_login_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.warn("User.findAll error:", error.message);
      return [];
    }
    return data || [];
  }
};

export default User;
