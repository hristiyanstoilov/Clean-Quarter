// Authentication Page Helper Functions
import supabase from "../services/supabase.js";

/**
 * Handle forgot password link — calls Supabase to send real reset email
 */
export async function handleForgotPassword(e) {
  e.preventDefault();
  await Swal.fire({
    title: "Забравена парола",
    html:
      "<p>Въведи своя имейл адрес и ще изпратим линк за възстановяване.</p>" +
      '<input type="email" id="resetEmail" class="swal2-input" placeholder="your@email.com">',
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Изпрати линк",
    cancelButtonText: "Отмяна",
  }).then(async (result) => {
    if (result.isConfirmed) {
      const email = document.getElementById("resetEmail").value.trim();
      if (!email) {
        Swal.fire({
          title: "Грешка",
          text: "Моля, въведи имейл адрес",
          icon: "error",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      });

      if (error) {
        Swal.fire({
          title: "Грешка",
          text: error.message || "Неуспешно изпращане. Опитайте отново.",
          icon: "error",
        });
      } else {
        Swal.fire({
          title: "Имейлът е изпратен",
          text: `Линк за възстановяване беше изпратен на ${email}`,
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
