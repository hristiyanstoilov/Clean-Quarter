import supabase from "../services/supabase.js";
import { initI18n, applyLanguage, t } from "../utils/i18n.js";
import { rules } from "../services/validation.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initI18n(false);
  applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");

  // Supabase inserts the recovery token into the URL hash.
  // onAuthStateChange fires PASSWORD_RECOVERY when the token is valid.
  // Race: resolve immediately on the event, or fall back to 3s timeout.
  const recoveryConfirmed = await new Promise((resolve) => {
    let settled = false;
    let sub = null;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        sub?.unsubscribe();
        resolve(false);
      }
    }, 3000);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !settled) {
        settled = true;
        clearTimeout(timeout);
        sub?.unsubscribe();
        resolve(true);
      }
    });
    sub = data.subscription;
  });

  if (recoveryConfirmed === false) {
    // No valid recovery token — send user back to login
    await Swal.fire({
      icon: "warning",
      title: t("auth.resetInvalidTitle") || "Невалиден линк",
      text: t("auth.resetInvalidText") || "Линкът е изтекъл или е вече използван. Поискай нов.",
      confirmButtonColor: "#dc3545",
    });
    window.location.href = "/";
    return;
  }

  document.getElementById("resetPasswordForm").addEventListener("submit", handleResetPassword);
});

async function handleResetPassword(e) {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const btn = e.target.querySelector("button[type=submit]");

  // Passwords must match
  if (newPassword !== confirmPassword) {
    await Swal.fire({
      icon: "error",
      title: t("common.error") || "Грешка",
      text: t("auth.passwordMismatch") || "Паролите не съвпадат.",
      confirmButtonColor: "#dc3545",
    });
    return;
  }

  // Strength validation (reuse existing rules)
  const strengthErrors = [
    rules.minLength(newPassword),
    rules.hasUppercase(newPassword),
    rules.hasLowercase(newPassword),
    rules.hasDigit(newPassword),
  ].filter(Boolean);

  if (strengthErrors.length) {
    await Swal.fire({
      icon: "error",
      title: t("common.error") || "Грешка",
      text: strengthErrors[0],
      confirmButtonColor: "#dc3545",
    });
    return;
  }

  btn.disabled = true;
  btn.textContent = "...";

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    btn.disabled = false;
    btn.setAttribute("data-i18n", "auth.resetPasswordButton");
    btn.textContent = t("auth.resetPasswordButton") || "Смени паролата";
    await Swal.fire({
      icon: "error",
      title: t("common.error") || "Грешка",
      text: error.message,
      confirmButtonColor: "#dc3545",
    });
    return;
  }

  await Swal.fire({
    icon: "success",
    title: t("auth.resetSuccessTitle") || "Готово!",
    text: t("auth.resetSuccessText") || "Паролата е сменена успешно. Вече можеш да влезеш.",
    confirmButtonColor: "#28a745",
  });

  window.location.href = "/";
}
