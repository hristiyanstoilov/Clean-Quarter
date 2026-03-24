// Live password validation and strength checking
import { applyPasswordChecklist } from "../utils/helpers.js";
import { isPasswordPwned } from "../utils/hibp.js";
import { t } from "../utils/i18n.js";

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
    let hibpCleared = false;

    // Reset HIBP clearance whenever the password changes — ensures every new
    // password value is checked, even if a previous value already passed.
    const passwordInput = document.getElementById("registerPassword");
    if (passwordInput) {
      passwordInput.addEventListener("input", () => {
        hibpCleared = false;
      });
    }

    registerForm.addEventListener("submit", async function (e) {
      const acceptTerms = document.getElementById("acceptTerms");
      const acceptRisk = document.getElementById("acceptRisk");

      if (!acceptTerms.checked) {
        e.preventDefault();
        Swal.fire({
          title: t("common.error"),
          text: t("auth.acceptTermsRequired"),
          icon: "error",
          confirmButtonColor: "#28a745",
        });
        return;
      }

      if (!acceptRisk.checked) {
        e.preventDefault();
        Swal.fire({
          title: t("common.error"),
          text: t("auth.acceptRiskRequired"),
          icon: "error",
          confirmButtonColor: "#28a745",
        });
        return;
      }

      // HIBP breach check — skip if already cleared (second submit after check)
      if (!hibpCleared) {
        e.preventDefault();
        const pwned = passwordInput ? await isPasswordPwned(passwordInput.value) : false;
        if (pwned) {
          Swal.fire({
            title: "Грешка",
            text: t("auth.passwordBreached"),
            icon: "warning",
            confirmButtonColor: "#28a745",
          });
          return;
        }
        hibpCleared = true;
        registerForm.requestSubmit();
      }
    });
  }
});

// Push notification permission is requested via the toggle in profile.js (handlePushToggle)
// — never request automatically on page load (browsers block permission prompts without user gesture)
// Service Worker registration is handled centrally by pwa.js via initializePWA() in main.js
