(function () {
  function renderGlossary() {
    const grid = document.getElementById("moveGlossaryGrid");
    if (!grid) return;
    grid.innerHTML = (window.FH_MOVE_GLOSSARY || []).map((item) => `<article class="glossary-card reveal is-visible" id="${FH.escape(item.id)}"><span class="glossary-icon"><img src="${FH.asset(`assets/icons/moves/${item.icon}`)}" alt=""></span><div><h2>${FH.escape(FH.text(item.name))}</h2><p>${FH.escape(FH.text(item.description))}</p></div></article>`).join("") || FH.empty();
    FH.scrollToHash?.();
  }
  document.addEventListener("DOMContentLoaded", renderGlossary);
})();
