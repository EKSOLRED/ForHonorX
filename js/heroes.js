(function () {
  const ALL = "all";
  const factionOrder = ["knights", "vikings", "samurai", "wulin", "outlanders"];
  const classOrder = ["vanguard", "heavy", "assassin", "hybrid"];
  let activeFactions = new Set([ALL]);
  let activeClasses = new Set([ALL]);

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "").trim();
  }

  function factionKey(faction) {
    const text = slug(FH.text(faction));
    if (text.includes("knight") || text.includes("рыцар")) return "knights";
    if (text.includes("viking") || text.includes("викинг")) return "vikings";
    if (text.includes("samurai") || text.includes("самура")) return "samurai";
    if (text.includes("wulin") || text.includes("улинь")) return "wulin";
    if (text.includes("outlander") || text.includes("изго") || text.includes("чужезем")) return "outlanders";
    return text || ALL;
  }

  function classKey(clazz) {
    const text = slug(FH.text(clazz));
    if (text.includes("vanguard") || text.includes("авангард")) return "vanguard";
    if (text.includes("heavy") || text.includes("защит") || text.includes("тяж")) return "heavy";
    if (text.includes("assassin") || text.includes("убий")) return "assassin";
    if (text.includes("hybrid") || text.includes("гибрид")) return "hybrid";
    return text || ALL;
  }

  function factionIcon(key) {
    return FH.asset(`assets/icons/factions/${key}.webp`);
  }

  function heroItems() {
    // Страница списка героев использует короткий каталог, а не тяжёлые базы всех героев.
    return (FH_DATA.heroes && FH_DATA.heroes.length ? FH_DATA.heroes : FH_DATA.heroCatalog) || [];
  }

  function updateHeroCountStat(count) {
    const node = document.getElementById("heroCountStat");
    if (!node) return;
    const label = "Персонажей";
    node.innerHTML = `<span>${FH.escape(label)}:</span><strong>${FH.escape(count)}</strong>`;
  }

  function classIcon(key) {
    if (key === ALL) return factionIcon(ALL);
    const iconMap = {
      vanguard: "hybrid",
      heavy: "vanguard",
      hybrid: "heavy",
      assassin: "assassin"
    };
    return FH.asset(`assets/icons/hero-types/${iconMap[key] || key}.png`);
  }

  function isAll(set) {
    return set.has(ALL) || set.size === 0;
  }

  function updateSelection(set, key) {
    if (key === ALL) {
      set.clear();
      set.add(ALL);
      return;
    }
    set.delete(ALL);
    set.has(key) ? set.delete(key) : set.add(key);
    if (set.size === 0) set.add(ALL);
  }

  function textChip(label, key, selected) {
    const icon = key === ALL ? `<img class="filter-all-icon" src="${FH.escape(factionIcon(ALL))}" alt="" aria-hidden="true">` : "";
    return `<button class="filter-chip${selected ? " is-active" : ""}" type="button" data-filter-key="${FH.escape(key)}">${icon}<span>${FH.escape(label)}</span></button>`;
  }

  function iconChip(label, key, selected) {
    return `<button class="filter-chip filter-icon-chip${selected ? " is-active" : ""}" type="button" data-filter-key="${FH.escape(key)}" data-tooltip="${FH.escape(label)}" aria-label="${FH.escape(label)}">
      <img src="${FH.escape(factionIcon(key))}" alt="" aria-hidden="true">
    </button>`;
  }

  function typeIconChip(label, key, selected) {
    return `<button class="filter-chip filter-icon-chip${selected ? " is-active" : ""}" type="button" data-filter-key="${FH.escape(key)}" data-tooltip="${FH.escape(label)}" aria-label="${FH.escape(label)}">
      <img src="${FH.escape(classIcon(key))}" alt="" aria-hidden="true">
    </button>`;
  }

  function renderFactionFilter(containerId, items, activeSet) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.classList.add("filter-icons-only");
    container.innerHTML = iconChip("Все", ALL, isAll(activeSet)) + items.map((item) => {
      const selected = !isAll(activeSet) && activeSet.has(item.key);
      return iconChip(FH.text(item.label), item.key, selected);
    }).join("");
  }

  function renderClassFilter(containerId, items, activeSet) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.classList.add("filter-icons-only");
    container.innerHTML = typeIconChip("Все", ALL, isAll(activeSet)) + items.map((item) => {
      const selected = !isAll(activeSet) && activeSet.has(item.key);
      return typeIconChip(FH.text(item.label), item.key, selected);
    }).join("");
  }

  function renderFilters() {
    const factionMap = new Map();
    heroItems().forEach((hero) => factionMap.set(factionKey(hero.faction), hero.faction));
    const factions = factionOrder.filter((key) => factionMap.has(key)).map((key) => ({ key, label: factionMap.get(key) }));

    const classMap = new Map();
    heroItems().forEach((hero) => classMap.set(classKey(FH.heroType(hero)), FH.heroType(hero)));
    const classes = classOrder.filter((key) => classMap.has(key)).map((key) => ({ key, label: classMap.get(key) }));

    renderFactionFilter("heroFactionFilter", factions, activeFactions);
    renderClassFilter("heroClassFilter", classes, activeClasses);
  }

  function resetFilters() {
    activeFactions.clear();
    activeFactions.add(ALL);
    activeClasses.clear();
    activeClasses.add(ALL);
    const search = document.getElementById("heroSearch");
    if (search) search.value = "";
    renderHeroes();
  }

  function renderHeroes() {
    const grid = document.getElementById("heroesGrid");
    if (!grid) return;
    renderFilters();
    const query = document.getElementById("heroSearch")?.value.trim().toLowerCase() || "";
    const heroes = heroItems().filter((hero) => {
      const text = [FH.text(hero.name), FH.text(hero.faction), FH.text(FH.heroType(hero)), FH.text(hero.summary)].join(" ").toLowerCase();
      const factionOk = isAll(activeFactions) || activeFactions.has(factionKey(hero.faction));
      const classOk = isAll(activeClasses) || activeClasses.has(classKey(FH.heroType(hero)));
      return factionOk && classOk && text.includes(query);
    });

    updateHeroCountStat(heroItems().length);
    grid.innerHTML = heroes.length ? heroes.map((hero) => {
      const fKey = factionKey(hero.faction);
      return `
        <article class="hero-card-wrap">
          <a class="hero-card hero-card-compact reveal is-visible" href="hero.html?id=${encodeURIComponent(hero.id)}" aria-label="${FH.escape(FH.text(hero.name))}">
            <span class="faction-badge"><img src="${FH.escape(factionIcon(fKey))}" alt="${FH.escape(FH.text(hero.faction))}" loading="lazy"></span>
            <span class="hero-type-tag hero-type-tag-top">${FH.escape(FH.text(FH.heroType(hero)))}</span>
            <div class="hero-card-media image-wrap">${FH.localImage(hero.image || hero.banner, FH.text(hero.name))}</div>
            <div class="hero-card-nameplate"><h3>${FH.escape(FH.text(hero.name))}</h3></div>
          </a>
        </article>`;
    }).join("") : FH.empty();
  }

  function bindFilter(containerId, set) {
    document.getElementById(containerId)?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-key]");
      if (!button) return;
      updateSelection(set, button.dataset.filterKey);
      renderHeroes();
    });
  }

  function init() {
    const grid = document.getElementById("heroesGrid");
    if (!grid) return;
    if (grid.dataset.heroesReady === "true") {
      renderHeroes();
      return;
    }
    grid.dataset.heroesReady = "true";
    document.getElementById("heroSearch")?.addEventListener("input", renderHeroes);
    bindFilter("heroFactionFilter", activeFactions);
    bindFilter("heroClassFilter", activeClasses);
    document.getElementById('heroFiltersReset')?.addEventListener('click', resetFilters);
    renderHeroes();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  requestAnimationFrame(() => init());
  window.addEventListener("load", () => init(), { once: true });
})();
