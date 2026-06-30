(function () {
  const namesRu = {
    parry: "Парирование",
    deflect: "Дефлект",
    "dodge-attack": "Атака из уворота",
    unblockable: "Неблокируемая атака",
    "hyper-armor": "Гиперброня",
    "crushing-counter": "Сокрушительный контрудар",
    feint: "Финт",
    "soft-feint": "Софт-финт",
    revenge: "Месть",
    "stamina-pressure": "Давление по выносливости",
    "wall-splat": "Удар о стену",
    "frame-advantage": "Преимущество по кадрам"
  };

  const sections = [
    { id: "offense", title: "Наступательные действия", ids: ["guard-break", "dodge-attack", "unblockable", "hyper-armor", "crushing-counter", "feint", "soft-feint", "stamina-pressure", "wall-splat", "frame-advantage"] },
    { id: "defense", title: "Обороняющие действия", ids: ["parry", "deflect"] },
    { id: "hero-stats", title: "Характеристики героев", ids: [] },
    { id: "rage", title: "Ярость", ids: ["revenge"] },
    { id: "team-modes", title: "Механики командных режимов", ids: [] },
    { id: "map-features", title: "Особенности карт", ids: [] },
    { id: "renown", title: "Слава", ids: [] },
    { id: "duel-brawl", title: "Дуэль и Бойня", ids: [] },
    { id: "dominion", title: "Захват территорий", ids: [] },
    { id: "breach", title: "Штурм", ids: [] },
    { id: "deathmatch", title: "Бой насмерть", ids: [] }
  ];

  function esc(value) { return FH.escape(value); }
  function title(mechanic) { return (namesRu[mechanic.id] || FH.text(mechanic.name)); }
  function sectionTitle(section) { return FH.text(section.title); }
  function queryText() { return document.getElementById("mechanicsSearch")?.value.trim().toLowerCase() || ""; }
  function matchesText(value, query) { return String(value || "").toLowerCase().includes(query); }
  function sectionMatches(section, query) {
    if (!query) return true;
    return matchesText(sectionTitle(section), query) || matchesText(section.id, query);
  }
  function matchesMechanic(mechanic, query) {
    if (!query) return true;
    return [title(mechanic), FH.text(mechanic.name), FH.text(mechanic.short), FH.text(mechanic.description), FH.text(mechanic.example), mechanic.id, mechanic.category]
      .join(" ").toLowerCase().includes(query);
  }
  function mechanicCard(mechanic) {
    return `<a class="mechanic-card reveal is-visible" id="${esc(mechanic.id)}" href="mechanic.html?id=${encodeURIComponent(mechanic.id)}">
      <strong>${esc(title(mechanic))}</strong>
      <p>${esc(FH.text(mechanic.short))}</p>
    </a>`;
  }
  function ensureSectionJump() {
    let jump = document.getElementById("mechanicsSectionJump");
    if (jump) return jump;
    jump = document.createElement("div");
    jump.id = "mechanicsSectionJump";
    jump.className = "section-jump";
    jump.innerHTML = `<button class="section-jump-toggle" type="button" data-section-jump-toggle aria-expanded="false" aria-label="${esc("Разделы")}"><svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><div class="section-jump-menu" data-section-jump-menu hidden></div>`;
    document.body.appendChild(jump);
    return jump;
  }
  function updateSectionJump(activeSections) {
    const jump = ensureSectionJump();
    const menu = jump.querySelector("[data-section-jump-menu]");
    menu.innerHTML = activeSections.map((section) => `<button type="button" data-section-target="mechanics-${esc(section.id)}">${esc(sectionTitle(section))}</button>`).join("");
  }
  function renderMechanics() {
    const grid = document.getElementById("mechanicsGrid");
    if (!grid) return;
    const mechanics = FH_DATA.mechanics || [];
    const mechanicMap = new Map(mechanics.map((mechanic) => [mechanic.id, mechanic]));
    const query = queryText();
    const used = new Set();
    const activeSections = [];
    const html = sections.map((section) => {
      const sectionHit = sectionMatches(section, query);
      const baseItems = section.ids.map((id) => mechanicMap.get(id)).filter(Boolean);
      let items = sectionHit ? baseItems : baseItems.filter((mechanic) => matchesMechanic(mechanic, query));
      if (!query) {
        // В пустых разделах оставляем аккуратную заглушку, чтобы структура была видна.
      } else if (!items.length) {
        return "";
      }
      items.forEach((item) => used.add(item.id));
      const cards = items.map(mechanicCard).join("");
      const empty = !query && !cards ? `<p class="section-empty-mini">${esc("Карточки появятся позже.")}</p>` : "";
      activeSections.push(section);
      return `<section class="mechanics-section" id="mechanics-${esc(section.id)}">
        <h2>${esc(sectionTitle(section))}</h2>
        <div class="mechanics-section-grid">${cards || empty}</div>
      </section>`;
    }).join("");
    const leftovers = mechanics.filter((mechanic) => !used.has(mechanic.id) && matchesMechanic(mechanic, query));
    let extra = "";
    if (leftovers.length) {
      const other = { id: "other", title: "Прочее" };
      activeSections.push(other);
      extra = `<section class="mechanics-section" id="mechanics-other"><h2>${esc(sectionTitle(other))}</h2><div class="mechanics-section-grid">${leftovers.map(mechanicCard).join("")}</div></section>`;
    }
    grid.innerHTML = (html + extra) || FH.empty();
    updateSectionJump(activeSections);
    FH.scrollToHash?.();
  }
  function bindSectionJump() {
    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("#mechanicsSectionJump [data-section-jump-toggle]");
      if (toggle) {
        const menu = document.querySelector("#mechanicsSectionJump [data-section-jump-menu]");
        const open = menu?.hidden;
        if (menu) menu.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        return;
      }
      const item = event.target.closest("#mechanicsSectionJump [data-section-target]");
      if (item) {
        document.getElementById(item.dataset.sectionTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
        const menu = document.querySelector("#mechanicsSectionJump [data-section-jump-menu]");
        if (menu) menu.hidden = true;
        document.querySelector("#mechanicsSectionJump [data-section-jump-toggle]")?.setAttribute("aria-expanded", "false");
        return;
      }
      if (!event.target.closest("#mechanicsSectionJump")) {
        const menu = document.querySelector("#mechanicsSectionJump [data-section-jump-menu]");
        if (menu) menu.hidden = true;
      }
    });
  }
  function init() {
    if (!document.getElementById("mechanicsGrid")) return;
    document.getElementById("mechanicsSearch")?.addEventListener("input", renderMechanics);
    bindSectionJump();
    renderMechanics();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
