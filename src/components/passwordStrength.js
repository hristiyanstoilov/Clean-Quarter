// Password strength meter module
// Usage: import and call initPasswordStrengthMeter() on your registration page

export function initPasswordStrengthMeter({
  passwordInputId = "registerPassword",
  strengthBarId = "registerPasswordStrength",
} = {}) {
  function wire() {
    const passwordInput = document.getElementById(passwordInputId);
    const strengthBar = document.getElementById(strengthBarId);
    if (passwordInput && strengthBar) {
      passwordInput.addEventListener("input", function (e) {
        const value = e.target.value;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        // Strength bar logic
        let percent = (score / 4) * 100;
        strengthBar.style.width = percent + "%";
        if (score === 4) {
          strengthBar.style.backgroundColor = "#28a745"; // green
        } else if (score === 3) {
          strengthBar.style.backgroundColor = "#ffc107"; // yellow
        } else {
          strengthBar.style.backgroundColor = "#dc3545"; // red
        }
      });
    }
  }
  // If called before DOMContentLoaded (e.g. at module evaluation time), wait for it.
  // If called after (e.g. inside a DOMContentLoaded handler), run immediately.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
}
