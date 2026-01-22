// Main entry point for the application
import "./assets/style.css";
import { login, register } from "./services/auth.js";
import { initializePWA } from "./services/pwa.js";
import { initDemoMode, getDemoUser } from "./utils/demoMode.js";
import { initI18n, setLanguage, applyLanguage } from "./utils/i18n.js";

// Handle demo login - MUST BE DEFINED EARLY AND ASSIGNED TO WINDOW
function handleDemoLogin(e) {
  if (e) e.preventDefault();
  console.log("🎮 Demo Login clicked");

  // Run async operations without blocking
  (async () => {
    try {
      console.log("📝 Initializing demo data...");
      initDemoMode();
      console.log("✅ Demo data initialized");

      const demoUser = getDemoUser();
      console.log("👤 Demo user:", demoUser);

      if (demoUser && demoUser.id) {
        localStorage.setItem("user", JSON.stringify(demoUser));
        console.log("✅ User saved");

        // Use simple alert first, then navigate
        if (typeof Swal !== "undefined") {
          await Swal.fire({
            icon: "success",
            title: "🎮 Demo Mode Active",
            text: `Welcome ${demoUser.username}!`,
            timer: 1500,
          });
        } else {
          alert(`🎮 Welcome to Demo Mode, ${demoUser.username}!`);
        }

        window.location.href = "./src/pages/dashboard.html";
      } else {
        throw new Error("Demo user not found");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      if (typeof Swal !== "undefined") {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  })();
}

// CRITICAL: Make globally available for onclick
window.handleDemoLogin = handleDemoLogin;

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("📄 DOM Ready, starting initialization...");

    // Initialize PWA FIRST
    console.log("🚀 Initializing PWA...");
    await initializePWA();
    console.log("✅ PWA initialized");

    // Initialize architecture
    console.log("🏗️ Initializing application architecture...");
    await initializeArchitecture();

    // Initialize i18n
    console.log("🌐 Loading translations...");
    await initI18n(true); // Real-time enabled for login form
    console.log("✅ Translations loaded");

    // Apply language to page
    const savedLanguage = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    console.log("🌍 Applying startup language:", savedLanguage);
    applyLanguage(savedLanguage);
    console.log("✅ Language applied at startup:", savedLanguage);

    // Setup language selector event
    const langSelector = document.getElementById("languageSelector");
    console.log("🔧 Language selector found:", !!langSelector);
    if (langSelector) {
      langSelector.value = savedLanguage;
      langSelector.addEventListener("change", (e) => {
        console.log("🌍 Language selector changed to:", e.target.value);
        setLanguage(e.target.value);
      });
      console.log("✅ Language selector event listener added");
    }

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem("user"));

    if (!currentUser) {
      initAuthForms();
    } else {
      window.location.href = "./src/pages/dashboard.html";
    }
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
});

// Initialize auth forms
function initAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const user = await login(email, password);
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "./src/pages/dashboard.html";
  } catch (error) {
    console.error("Login failed:", error);
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
      text: "Все полета са задължителни!",
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

  if (password.length < 6) {
    await Swal.fire({
      icon: "error",
      title: "Слаба парола",
      text: "Паролата трябва да има минимум 6 символа!",
    });
    return;
  }

  try {
    const user = await register(email, password, { neighborhood });
    localStorage.setItem("user", JSON.stringify(user));

    console.log("User registered successfully:", email);

    window.location.href = "./src/pages/dashboard.html";
  } catch (error) {
    console.error("Registration failed:", error);

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
    index: "./src/pages/index.html",
    dashboard: "./src/pages/dashboard.html",
    "create-campaign": "./src/pages/create-campaign.html",
    detail: "./src/pages/campaign-detail.html",
    profile: "./src/pages/profile.html",
    admin: "./src/pages/admin.html",
    rewards: "./src/pages/rewards.html",
  };
  window.location.href = pages[pageName] || "./";
}

window.navigateTo = loadPage;
