import supabase from "../services/supabase.js";
import { initI18n, applyLanguage, t } from "../utils/i18n.js";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://cleanquarter.netlify.app";

document.addEventListener("DOMContentLoaded", async () => {
  await initI18n(false);
  applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");

  document.getElementById("forgotPasswordForm").addEventListener("submit", handleForgotPassword);
});

async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const btn = e.target.querySelector("button[type=submit]");

  if (!email) return;

  btn.disabled = true;
  btn.textContent = "...";

  // Always show success — never reveal if email exists (security best practice)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/reset-password`,
  });

  await Swal.fire({
    icon: "success",
    title: t("auth.resetSentTitle") || "Изпратено!",
    text:
      t("auth.resetSentText") || "Ако имейлът съществува, ще получиш линк за нулиране на паролата.",
    confirmButtonColor: "#28a745",
  });

  window.location.href = "/";
}
