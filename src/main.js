// Handle demo login - for Demo Mode button
let initDemoMode, getDemoUser;
async function handleDemoLogin(e) {
  if (e) e.preventDefault();
  try {
    if (!initDemoMode || !getDemoUser) {
      const demoMode = await import("./utils/demoMode.js");
      initDemoMode = demoMode.initDemoMode;
      getDemoUser = demoMode.getDemoUser;
    }
    // Get current language before login
    let lang = "bg";
    try {
      lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    } catch {}
    // Set language in localStorage for dashboard and all pages
    localStorage.setItem("CLEAN_QUARTER_LANGUAGE", lang);
    initDemoMode();
    const demoUser = getDemoUser();
    if (demoUser && demoUser.id) {
      localStorage.setItem("user", JSON.stringify(demoUser));
      if (typeof Swal !== "undefined") {
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title:
            lang === "en"
              ? `🎮 Demo Mode Active — Welcome ${demoUser.username}!`
              : `🎮 Демо режим — Добре дошъл, ${demoUser.username}!`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        alert(
          lang === "en"
            ? `🎮 Welcome to Demo Mode, ${demoUser.username}!`
            : `🎮 Добре дошъл в демо режим, ${demoUser.username}!`
        );
      }
      window.location.href = "/dashboard";
    } else {
      throw new Error(lang === "en" ? "Demo user not found" : "Демо потребителят не е намерен");
    }
  } catch (error) {
    let lang = "bg";
    try {
      lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    } catch {}
    if (typeof Swal !== "undefined") {
      await Swal.fire({
        icon: "error",
        title: lang === "en" ? "Error" : "Грешка",
        text: error.message,
      });
    } else {
      alert((lang === "en" ? "Error: " : "Грешка: ") + error.message);
    }
  }
}
// Make globally available for onclick
window.handleDemoLogin = handleDemoLogin;
// Main entry point for the application
import "./assets/style.css";
import { login, register } from "./services/auth.js";
import { rules } from "./services/validation.js";
import { saveUser } from "./utils/helpers.js";
import supabase from "./services/supabase.js";
import { initPasswordStrengthMeter } from "./components/passwordStrength.js";
import passwordToggle from "./components/passwordToggle.js";
// Lazy-load non-critical modules for performance
let initializePWA, initI18n, setLanguage, applyLanguage;

// Initialize auth forms
function initAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    passwordToggle({
      inputId: "loginPassword",
      toggleBtnId: "toggleLoginPassword",
      eyeIconId: "loginPasswordEye",
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
    // Initialize password strength meter for registration
    initPasswordStrengthMeter();
    // Initialize password visibility toggle for registration
    passwordToggle({
      inputId: "registerPassword",
      toggleBtnId: "toggleRegisterPassword",
      eyeIconId: "registerPasswordEye",
    });
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const user = await login(email, password);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, username, neighborhood")
      .eq("id", user.id)
      .single();
    saveUser({
      ...user,
      role: profile?.role,
      username: profile?.username,
      neighborhood: profile?.neighborhood,
    });
    window.location.href = "/dashboard";
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Login Error",
      text: error.message,
    });
  }
}

// Handle register form submission
async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById("registerEmail")?.value;
  const password = document.getElementById("registerPassword")?.value;
  const passwordConfirm = document.getElementById("registerPasswordConfirm")?.value;
  const neighborhood = document.getElementById("registerNeighborhood")?.value;

  if (!email || !password || !passwordConfirm || !neighborhood) {
    await Swal.fire({
      icon: "error",
      title: "Грешка",
      text: "Всички полета са задължителни!",
    });
    return;
  }

  if (password !== passwordConfirm) {
    await Swal.fire({
      icon: "error",
      title: "Грешка",
      text: "Паролите не съвпадат!",
    });
    return;
  }

  const passwordError = rules.password(password);
  if (passwordError) {
    await Swal.fire({ icon: "error", title: "Слаба парола", text: passwordError });
    return;
  }

  try {
    const user = await register(email, password, { neighborhood });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, username, neighborhood")
      .eq("id", user.id)
      .single();
    saveUser({
      ...user,
      role: profile?.role,
      username: profile?.username,
      neighborhood: profile?.neighborhood,
    });

    window.location.href = "/dashboard";
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Регистрацията неуспешна",
      text: error.message || "Възникна грешка.",
    });
  }
}

// Navigation function
function loadPage(pageName) {
  const pages = {
    index: "/",
    dashboard: "/dashboard",
    "create-campaign": "/create-campaign",
    detail: "/campaign",
    profile: "/profile",
    admin: "/admin",
    rewards: "/rewards",
  };
  window.location.href = pages[pageName] || "/";
}

window.navigateTo = loadPage;

// Ensure auth forms, i18n, and language selector are initialized on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Lazy-load i18n module if not already loaded
    if (!initI18n || !setLanguage || !applyLanguage) {
      const i18n = await import("./utils/i18n.js");
      initI18n = i18n.initI18n;
      setLanguage = i18n.setLanguage;
      applyLanguage = i18n.applyLanguage;
    }
    await initI18n(true); // Enable real-time switching
    const savedLanguage = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    applyLanguage(savedLanguage);
    // Setup language selector event
    const langSelector = document.getElementById("languageSelector");
    if (langSelector) {
      langSelector.value = savedLanguage;
      langSelector.addEventListener("change", (e) => {
        setLanguage(e.target.value);
      });
    }
    // Init forms
    initAuthForms();
  } catch (error) {
    initAuthForms();
  }
});
