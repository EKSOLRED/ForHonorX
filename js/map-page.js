(function () {
  let activeMap = null;
  let tacticalMode = "defense";
  const modeLabels = {
    Dominion: "Захват территорий",
    Duel: "Дуэль",
    Brawl: "Бойня",
    Breach: "Штурм",
    Skirmish: "Схватка",
    Elimination: "Устранение",
    Tribute: "Дань",
    Deathmatch: "Смертельная схватка"
  };
  function modeLabel(mode) { return modeLabels[mode] ? FH.text(modeLabels[mode]) : mode; }
  function backIcon() { return `<svg class="back-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5M9 12h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`; }
  function setPoster(kind) {
    if (!activeMap) return;
    const img = document.getElementById("mapPoster");
    const frame = document.querySelector(".map-poster-frame");
    if (!img || !frame) return;
    const isTactical = kind !== "normal";
    const src = kind === "attack" ? activeMap.tacticalAttack : kind === "defense" ? activeMap.tacticalDefense : activeMap.image;
    frame.classList.toggle("is-tactical", isTactical);
    img.classList.add("is-fading");
    window.setTimeout(() => { img.src = FH.asset(src); img.alt = FH.text(activeMap.name); img.classList.remove("is-fading"); }, 180);
    document.querySelectorAll("[data-map-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.mapView === (isTactical ? "tactical" : "normal")));
    document.querySelectorAll("[data-tactical-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.tacticalView === kind));
  }
  function activateNormal() { document.getElementById("tacticalSubcontrols")?.classList.remove("is-visible"); setPoster("normal"); }
  function activateTactical(mode = "defense") { tacticalMode = mode; document.getElementById("tacticalSubcontrols")?.classList.add("is-visible"); setPoster(tacticalMode); }
  function defaultStrategies(map) {
    return (map.modes || []).map((mode) => ({
      title: modeLabel(mode),
      text: `${modeLabel(mode)}: держите одну безопасную ротацию, не отдавайте центр бесплатно и заранее распределяйте роли команды.`
    }));
  }
  function defaultFeatures() {
    return [
      "Одна точка обычно захватывается быстрее при численном преимуществе, поэтому не стойте втроём без причины.",
      "Крипы постепенно давят линию: их урон и контроль пространства важны для темпа команды.",
      "Узкие проходы усиливают героев с контролем зоны и быстрым peel."
    ];
  }
  function list(items) { return `<ul class="feature-list">${items.map((item) => `<li>${FH.escape(FH.text(item.text || item))}</li>`).join("")}</ul>`; }
  function renderMap() {
    const mount = document.getElementById("mapPage");
    if (!mount) return;
    const id = new URLSearchParams(location.search).get("id") || "citadel-gate";
    activeMap = FH_DATA.maps.find((item) => item.id === id);
    tacticalMode = "defense";
    if (!activeMap) { mount.innerHTML = `<section class="compact-hero"><h1>${FH.escape("Ничего не найдено")}</h1><a class="btn btn-primary detail-back" href="maps.html">${backIcon()}<span>${FH.escape("К списку карт")}</span></a></section>`; return; }
    document.title = `${FH.text(activeMap.name)} — ForHonorX`;
    const modeTags = (activeMap.modes || []).map((mode) => `<span class="pill">${FH.escape(modeLabel(mode))}</span>`).join("");
    const strategies = activeMap.strategies || defaultStrategies(activeMap);
    const features = activeMap.details || activeMap.specials || defaultFeatures();
    mount.innerHTML = `
      <a class="btn btn-ghost detail-back" href="maps.html">${backIcon()}<span>${FH.escape("К списку карт")}</span></a>
      <section class="detail-section reveal is-visible">
        <div class="map-poster-frame">
          <img id="mapPoster" src="${FH.asset(activeMap.image)}" alt="${FH.escape(FH.text(activeMap.name))}">
          <div class="map-poster-overlay">
            <p class="eyebrow">${activeMap.placeholder ? FH.escape("Временный placeholder") : FH.escape("Поля боя")}</p>
            <h1>${FH.escape(FH.text(activeMap.name))}</h1>
            <p class="lead">${FH.escape(FH.text(activeMap.description))}</p>
            <div class="map-mode-tags">${modeTags}</div>
          </div>
        </div>
        <div class="map-controls">
          <button class="btn is-active" type="button" data-map-view="normal">${FH.escape("Обычный вид")}</button>
          <button class="btn" type="button" data-map-view="tactical">${FH.escape("Тактический вид")}</button>
          <div class="tactical-subcontrols" id="tacticalSubcontrols"><button class="btn is-active" type="button" data-tactical-view="defense">${FH.escape("Оборона")}</button><button class="btn" type="button" data-tactical-view="attack">${FH.escape("Атака")}</button></div>
        </div>
      </section>
      <section class="detail-section reveal is-visible map-tabs">
        <div class="tabs-nav" role="tablist"><button class="tab-btn is-active" type="button" data-map-tab="strategies">${FH.escape("Стратегии")}</button><button class="tab-btn" type="button" data-map-tab="features">${FH.escape("Особенности")}</button></div>
        <div class="map-tab-panel is-active" data-map-tab-panel="strategies">${strategies.map((item) => `<article class="guide-block"><h3>${FH.escape(FH.text(item.title || item.mode || "Стратегия"))}</h3><p>${FH.escape(FH.text(item.text || item))}</p></article>`).join("")}</div>
        <div class="map-tab-panel" data-map-tab-panel="features">${list(features)}</div>
      </section>`;
    document.querySelector('[data-map-view="normal"]')?.addEventListener("click", activateNormal);
    document.querySelector('[data-map-view="tactical"]')?.addEventListener("click", () => activateTactical("defense"));
    document.querySelector('[data-tactical-view="defense"]')?.addEventListener("click", () => activateTactical("defense"));
    document.querySelector('[data-tactical-view="attack"]')?.addEventListener("click", () => activateTactical("attack"));
    document.querySelectorAll("[data-map-tab]").forEach((button) => button.addEventListener("click", () => {
      const key = button.dataset.mapTab;
      document.querySelectorAll("[data-map-tab]").forEach((node) => node.classList.toggle("is-active", node === button));
      document.querySelectorAll("[data-map-tab-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.mapTabPanel === key));
    }));
  }
  document.addEventListener("DOMContentLoaded", renderMap);
})();
