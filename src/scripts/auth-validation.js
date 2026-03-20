// Live password validation and strength checking
import { applyPasswordChecklist } from "../utils/helpers.js";

document.addEventListener("DOMContentLoaded", function () {
  applyPasswordChecklist(document.getElementById("registerPassword"), {
    length: "pw-length",
    uppercase: "pw-uppercase",
    lowercase: "pw-lowercase",
    digit: "pw-digit",
  });
});

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modal = document.getElementById("termsModal");
  if (event.target === modal) {
    window.closeTermsModal();
  }
});

// Validate register form - check if both Terms are accepted
document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      const acceptTerms = document.getElementById("acceptTerms");
      const acceptRisk = document.getElementById("acceptRisk");

      if (!acceptTerms.checked) {
        e.preventDefault();
        Swal.fire({
          title: "Грешка",
          text: "Трябва да приемеш Общите условия и Политиката за поверителност",
          icon: "error",
          confirmButtonColor: "#28a745",
        });
        return;
      }

      if (!acceptRisk.checked) {
        e.preventDefault();
        Swal.fire({
          title: "Грешка",
          text: "Трябва да потвърдиш, че разбираш рисковете и условията на участие",
          icon: "error",
          confirmButtonColor: "#28a745",
        });
        return;
      }
    });
  }
});

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("[SW] Registered:", registration.scope);
      })
      .catch((error) => {
        console.warn("[SW] Registration failed:", error);
      });
  });
}

// Push notification permission is requested via the toggle in profile.js (handlePushToggle)
// — never request automatically on page load (browsers block permission prompts without user gesture)
