// Password visibility toggle for registration and login
// Usage: import and call passwordToggle({ inputId, toggleBtnId, eyeIconId })

export default function passwordToggle({ inputId, toggleBtnId, eyeIconId }) {
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = document.getElementById(toggleBtnId);
  const eyeIcon = document.getElementById(eyeIconId);
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", function () {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        if (eyeIcon) eyeIcon.textContent = "🙈";
      } else {
        passwordInput.type = "password";
        if (eyeIcon) eyeIcon.textContent = "👁️";
      }
    });
  }
}
