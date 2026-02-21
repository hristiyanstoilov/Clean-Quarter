// Authentication Page Helper Functions

/**
 * Handle forgot password link
 */
export function handleForgotPassword(e) {
  e.preventDefault();
  Swal.fire({
    title: "Забравена парола",
    html:
      "<p>Въведи своя имейл адрес и ще изпратим линк за восстановление.</p>" +
      '<input type="email" id="resetEmail" class="swal2-input" placeholder="your@email.com">',
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Изпрати линк",
    cancelButtonText: "Отмяна",
  }).then((result) => {
    if (result.isConfirmed) {
      const email = document.getElementById("resetEmail").value;
      if (email) {
        Swal.fire({
          title: "Проверка на имейла",
          text: `Линк за восстановление е изпратен на ${email}`,
          icon: "success",
          confirmButtonColor: "#28a745",
          timer: 1500,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          title: "Грешка",
          text: "Моля, въведи имейл адрес",
          icon: "error",
        });
      }
    }
  });
}

/**
 * Show Terms and Conditions modal
 */
export function showTermsModal(e) {
  e.preventDefault();
  updateTermsLanguage();
  document.getElementById("termsModal").style.display = "block";
}

/**
 * Update terms modal content based on current language
 */
function updateTermsLanguage() {
  const currentLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const bgContent = document.getElementById("termsContentBg");
  const enContent = document.getElementById("termsContentEn");
  const title = document.getElementById("termsModalTitle");
  const closeBtn = document.getElementById("termsCloseBtn");
  const acceptBtn = document.getElementById("termsAcceptBtn");

  if (currentLang === "en") {
    bgContent.style.display = "none";
    enContent.style.display = "block";
    title.innerHTML = "📋 Terms & Conditions and Privacy Policy";
    closeBtn.innerHTML = "✕ Close";
    acceptBtn.innerHTML = "✓ Accept";
  } else {
    bgContent.style.display = "block";
    enContent.style.display = "none";
    title.innerHTML = "📋 Условия за използване и Поверителност";
    closeBtn.innerHTML = "✕ Затвори";
    acceptBtn.innerHTML = "✓ Приемам";
  }
}

/**
 * Close Terms and Conditions modal
 */
export function closeTermsModal() {
  document.getElementById("termsModal").style.display = "none";
}

/**
 * Accept Terms and Conditions
 */
export function acceptTerms() {
  document.getElementById("acceptTerms").checked = true;
  closeTermsModal();
}

// Make functions globally available
window.handleForgotPassword = handleForgotPassword;
window.showTermsModal = showTermsModal;
window.closeTermsModal = closeTermsModal;
window.acceptTerms = acceptTerms;
