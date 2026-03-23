import supabase from "./supabase.js";
import logger from "./logger.js";
import { showSuccess } from "../utils/helpers.js";
import { rules } from "./validation.js";

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
    // Server-side rate limit check (fail-open: if RPC errors, allow login)
    try {
      const { data: rateData } = await supabase.rpc("check_login_rate_limit", {
        p_email: email,
      });
      if (rateData && !rateData.allowed) {
        const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
        const err = new Error(
          lang === "en"
            ? "Too many login attempts. Please try again in 15 minutes."
            : "Твърде много опити за вход. Опитайте отново след 15 минути."
        );
        err.isRateLimit = true;
        throw err;
      }
    } catch (rateLimitError) {
      // Re-throw only if it's our own rate limit error, not an RPC failure
      if (rateLimitError.isRateLimit === true) {
        throw rateLimitError;
      }
      logger.warn("Rate limit RPC unavailable, proceeding with login:", rateLimitError.message);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed attempt server-side (fire-and-forget, does not block login flow)
      supabase
        .rpc("record_login_attempt", { p_email: email })
        .catch((e) => logger.warn("Failed to record login attempt:", e.message));
      throw error;
    }

    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    await showSuccess(
      lang === "en" ? "Login Successful!" : "Успешен вход!",
      lang === "en" ? `Welcome, ${email}` : `Добре дошъл, ${email}`,
      1500
    );
    return data.user;
  } catch (error) {
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
