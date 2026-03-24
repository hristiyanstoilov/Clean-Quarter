function showLang(lang) {
  document.getElementById("contentBg").style.display = lang === "bg" ? "block" : "none";
  document.getElementById("contentEn").style.display = lang === "en" ? "block" : "none";
  document.getElementById("btnBg").classList.toggle("active", lang === "bg");
  document.getElementById("btnEn").classList.toggle("active", lang === "en");
  document.getElementById("pageTitle").textContent =
    lang === "bg"
      ? "Условия за използване и Поверителност"
      : "Terms & Conditions and Privacy Policy";
  document.getElementById("backLabel").textContent = lang === "bg" ? "Назад" : "Back";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnBg").addEventListener("click", () => showLang("bg"));
  document.getElementById("btnEn").addEventListener("click", () => showLang("en"));

  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  if (lang === "en") showLang("en");
});
