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
import { saveUser, showSuccessToast } from "./utils/helpers.js";
import supabase from "./services/supabase.js";
import { initPasswordStrengthMeter } from "./components/passwordStrength.js";
import passwordToggle from "./components/passwordToggle.js";
import { initPage } from "./utils/pageInit.js";
import { t } from "./utils/i18n.js";
// Lazy-load non-critical modules for performance
let initI18n, setLanguage, applyLanguage;

// Format milliseconds as M:SS countdown string
function formatCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Show live-countdown Swal and disable login button until lockout expires
function showLockoutCountdown(until) {
  const submitBtn = document.getElementById("loginSubmitBtn");
  const lockoutMsg = document.getElementById("loginLockoutMsg");

  if (submitBtn) submitBtn.disabled = true;

  function updateMsg() {
    const remaining = until - Date.now();
    if (remaining <= 0) {
      if (submitBtn) submitBtn.disabled = false;
      if (lockoutMsg) {
        lockoutMsg.style.display = "none";
        lockoutMsg.textContent = "";
      }
      sessionStorage.removeItem("lockout_until");
      return;
    }
    const timeStr = formatCountdown(remaining);
    if (lockoutMsg) {
      lockoutMsg.style.display = "block";
      lockoutMsg.textContent = (t("auth.rateLimitText") || "Try again in {{time}}.").replace(
        "{{time}}",
        timeStr
      );
    }
  }

  updateMsg();
  const interval = setInterval(() => {
    if (Date.now() >= until) {
      clearInterval(interval);
      updateMsg();
    } else {
      updateMsg();
    }
  }, 1000);

  Swal.fire({
    icon: "warning",
    title: t("auth.rateLimitTitle") || "Temporarily Blocked",
    html: (t("auth.rateLimitText") || "Try again in {{time}}.").replace(
      "{{time}}",
      `<strong id="swalCountdown">${formatCountdown(until - Date.now())}</strong>`
    ),
    showConfirmButton: false,
    timer: Math.max(0, until - Date.now()),
    timerProgressBar: true,
    didOpen: () => {
      const swalEl = document.getElementById("swalCountdown");
      const swalInterval = setInterval(() => {
        const remaining = until - Date.now();
        if (remaining <= 0) {
          clearInterval(swalInterval);
          Swal.close();
          return;
        }
        if (swalEl) swalEl.textContent = formatCountdown(remaining);
      }, 1000);
    },
  });
}

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
    // Restore lockout countdown if page was refreshed during an active lockout
    const savedLockout = Number(sessionStorage.getItem("lockout_until") || 0);
    if (savedLockout > Date.now()) {
      showLockoutCountdown(savedLockout);
    }
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
    await showSuccessToast(t("auth.loginSuccessTitle"), 1000);
    window.location.href = "/dashboard";
  } catch (error) {
    if (error.isRateLimit) {
      const until = Date.now() + (error.retryAfterSeconds ?? 900) * 1000;
      sessionStorage.setItem("lockout_until", String(until));
      showLockoutCountdown(until);
    } else {
      await Swal.fire({
        icon: "error",
        title: t("auth.loginErrorTitle"),
        text: error.message,
      });
    }
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
      title: t("common.error"),
      text: t("auth.allFieldsRequired"),
    });
    return;
  }

  if (password !== passwordConfirm) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: t("auth.passwordMismatch"),
    });
    return;
  }

  const passwordError = rules.password(password);
  if (passwordError) {
    await Swal.fire({ icon: "error", title: t("auth.weakPasswordTitle"), text: passwordError });
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
    await showSuccessToast(t("auth.registerSuccessTitle"), 1000);
    window.location.href = "/dashboard";
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("auth.registerErrorTitle"),
      text: error.message,
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
  initPage();
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
  } catch {
    initAuthForms();
  }
});
