(function () {
  const namesRu = { parry: "Парирование", deflect: "Дефлект", "dodge-attack": "Атака из уворота", unblockable: "Неблокируемая атака", "hyper-armor": "Гиперброня", "crushing-counter": "Сокрушительный контрудар", feint: "Финт", "soft-feint": "Софт-финт", revenge: "Месть", "stamina-pressure": "Давление по выносливости", "wall-splat": "Удар о стену", "frame-advantage": "Преимущество по кадрам" };
  function title(mechanic) { return (namesRu[mechanic.id] || FH.text(mechanic.name)); }
  function backIcon() { return `<svg class="back-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5M9 12h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`; }
  function videoSources(mechanic) { return [{ id: "youtube", label: "YouTube", url: mechanic.video }, { id: "rutube", label: "RuTube", url: "https://rutube.ru/play/embed/00000000000000000000000000000000" }]; }
  function render() {
    const root = document.getElementById("mechanicPage");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id") || "parry";
    const mechanic = FH_DATA.mechanics.find((item) => item.id === id);
    if (!mechanic) { root.innerHTML = `<section class="compact-hero"><h1>${FH.escape("Ничего не найдено")}</h1><a class="btn btn-primary detail-back" href="mechanics.html">${backIcon()}<span>${FH.escape("Механики")}</span></a></section>`; return; }
    document.title = `${title(mechanic)} — ForHonorX`;
    const howTitle = "Как это работает";
    root.innerHTML = `<a class="btn btn-ghost detail-back" href="mechanics.html">${backIcon()}<span>${FH.escape("Механики")}</span></a>
      <section class="detail-section reveal is-visible mechanic-detail-grid mechanic-detail-clean">
        <article class="mechanic-modal-block"><h3>${FH.escape("Описание")}</h3><p>${FH.escape(FH.text(mechanic.description))}</p></article>
        <article class="mechanic-modal-block"><h3>${FH.escape(howTitle)}</h3><p>${FH.escape(FH.text(mechanic.example))}</p></article>
        <button class="guide-video-card mechanic-video-card" type="button" data-video-title="${FH.escape(title(mechanic))}" data-video-sources='${FH.escape(JSON.stringify(videoSources(mechanic)))}'><span class="guide-video-thumb"><span>▶</span></span><strong>${FH.escape(title(mechanic))}</strong></button>
      </section>`;
  }
  document.addEventListener("DOMContentLoaded", render);
})();
