import supabase from "./supabase.js";
import logger from "./logger.js";
import { showSuccess, showError } from "../utils/helpers.js";
import { rules } from "./validation.js";

// Rate limiting: max 5 login attempts per 15 minutes per email
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(email) {
  const now = Date.now();
  const attempts = (loginAttempts.get(email) || []).filter((t) => now - t < WINDOW_MS);
  if (attempts.length >= MAX_ATTEMPTS) {
    throw new Error("Твърде много опити за вход. Опитайте отново след 15 минути.");
  }
  attempts.push(now);
  loginAttempts.set(email, attempts);
}

/**
 * Register a new user with email, password, and metadata (neighborhood)
 * @param {string} email
 * @param {string} password
 * @param {object} meta - metadata object containing 'neighborhood'
 * @returns {Promise<object>} user object
 */
export async function register(email, password, options = {}) {
  const passwordError = rules.password(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!options?.neighborhood) {
      throw new Error("Neighborhood is required");
    }

    logger.info("📝 Starting registration for:", email);

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      logger.error("❌ Auth signup error:", authError);
      throw new Error(authError.message || "Registration failed");
    }

    if (!authData?.user?.id) {
      throw new Error("No user ID returned from registration");
    }

    logger.info("✅ Auth signup successful, user ID:", authData.user.id);

    // Upsert profile - trigger may have already created it, so update with neighborhood
    const userId = authData.user.id;
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        username: email.split("@")[0],
        role: "user",
        points_balance: 0,
        neighborhood: options.neighborhood || "Studentski Grad",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      logger.error("❌ Profile creation error:", profileError);
      throw new Error(profileError.message || "Failed to create profile");
    }

    logger.info("✅ Profile created successfully");

    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    await showSuccess(
      lang === "en" ? "Registration Successful!" : "Регистрацията е успешна!",
      lang === "en" ? "Your account has been created." : "Акаунтът ти е създаден.",
      1500
    );
    return authData.user;
  } catch (error) {
    logger.error("❌ Register error:", error);
    await showError("Registration Error", error);
    throw error;
  }
}

/**
 * Login user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} user object
 */
export async function login(email, password) {
  try {
    checkRateLimit(email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    await showSuccess(
      lang === "en" ? "Login Successful!" : "Успешен вход!",
      lang === "en" ? `Welcome, ${email}` : `Добре дошъл, ${email}`,
      1500
    );
    return data.user;
  } catch (error) {
    await showError("Login Error", error);
    throw error;
  }
}

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    await showSuccess(
      lang === "en" ? "Logout Successful" : "Излезе успешно",
      lang === "en" ? "See you soon!" : "До скоро!",
      1500
    );
  } catch (error) {
    await showError("Logout Error", error);
    throw error;
  }
}

/**
 * Get the currently logged-in user
 * @returns {Promise<object|null>} user object or null if not logged in
 */
export async function getUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.error("Get user error:", error);
      return null;
    }

    return user;
  } catch (error) {
    logger.error("Get user error:", error);
    return null;
  }
}
