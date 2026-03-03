window.UI = (() => {
  const LS_KEY = "fh_lang";

  function getLang() {
    return localStorage.getItem(LS_KEY) || "ru";
  }

  function setLang(lang) {
    localStorage.setItem(LS_KEY, lang);
  }

  function getDictionary(lang) {
    return lang === "en" ? window.TRANSLATIONS_EN : window.TRANSLATIONS_RU;
  }

  function applyTranslations(lang) {
    const dict = getDictionary(lang);
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = dict[key];
      if (typeof value === "string") el.textContent = value;
    });
  }

  function t(key, lang = getLang()) {
    const dict = getDictionary(lang);
    return dict[key] ?? key;
  }

  return { getLang, setLang, applyTranslations, t };
})();
