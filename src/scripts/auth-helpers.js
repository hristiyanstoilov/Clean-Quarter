// Authentication Page Helper Functions
import supabase from "../services/supabase.js";
import { t } from "../utils/i18n.js";

/**
 * Handle forgot password link — calls Supabase to send real reset email
 */
export async function handleForgotPassword(e) {
  e.preventDefault();
  await Swal.fire({
    title: t("auth.forgotTitle"),
    html:
      `<p>${t("auth.forgotSubtitle")}</p>` +
      `<input type="email" id="resetEmail" class="swal2-input" placeholder="${t("auth.emailPlaceholder")}">`,
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: t("auth.sendResetLink"),
    cancelButtonText: t("common.cancel"),
  }).then(async (result) => {
    if (result.isConfirmed) {
      const email = document.getElementById("resetEmail").value.trim();
      if (!email) {
        Swal.fire({
          title: t("common.error"),
          text: t("auth.emailRequired"),
          icon: "error",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      });

      if (error) {
        Swal.fire({
          title: t("common.error"),
          text: error.message,
          icon: "error",
        });
      } else {
        Swal.fire({
          title: t("auth.resetSentTitle"),
          text: t("auth.resetSentTextFull").replace("{{email}}", email),
          icon: "success",
          confirmButtonColor: "#28a745",
          timer: 3000,
          timerProgressBar: true,
        });
      }
    }
  });
}

/**
 * Close Terms and Conditions modal
 */
export function closeTermsModal() {
  document.getElementById("termsModal").style.display = "none";
}

/**
 * Accept Terms and Conditions — checks both terms and risk checkboxes
 */
export function acceptTerms() {
  document.getElementById("acceptTerms").checked = true;
  document.getElementById("acceptRisk").checked = true;
  closeTermsModal();
}

// Make functions globally available
window.handleForgotPassword = handleForgotPassword;
window.closeTermsModal = closeTermsModal;
window.acceptTerms = acceptTerms;
