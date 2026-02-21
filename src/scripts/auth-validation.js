// Live password validation and strength checking

document.addEventListener("DOMContentLoaded", function () {
  // Live password checklist for registration
  const passwordInput = document.getElementById("registerPassword");
  const pwLength = document.getElementById("pw-length");
  const pwUppercase = document.getElementById("pw-uppercase");
  const pwLowercase = document.getElementById("pw-lowercase");
  const pwDigit = document.getElementById("pw-digit");

  if (passwordInput) {
    passwordInput.addEventListener("input", function (e) {
      const value = e.target.value;

      // Length
      if (value.length >= 8) {
        pwLength.classList.remove("text-danger");
        pwLength.classList.add("text-success");
      } else {
        pwLength.classList.remove("text-success");
        pwLength.classList.add("text-danger");
      }

      // Uppercase
      if (/[A-Z]/.test(value)) {
        pwUppercase.classList.remove("text-danger");
        pwUppercase.classList.add("text-success");
      } else {
        pwUppercase.classList.remove("text-success");
        pwUppercase.classList.add("text-danger");
      }

      // Lowercase
      if (/[a-z]/.test(value)) {
        pwLowercase.classList.remove("text-danger");
        pwLowercase.classList.add("text-success");
      } else {
        pwLowercase.classList.remove("text-success");
        pwLowercase.classList.add("text-danger");
      }

      // Digit
      if (/[0-9]/.test(value)) {
        pwDigit.classList.remove("text-danger");
        pwDigit.classList.add("text-success");
      } else {
        pwDigit.classList.remove("text-success");
        pwDigit.classList.add("text-danger");
      }
    });
  }
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
      .register("/public/service-worker.js")
      .then((registration) => {})
      .catch((error) => {});
  });
}

// Request notification permission (for push notifications)
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}
