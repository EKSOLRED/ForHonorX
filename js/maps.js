(function () {
  const ALL = "all";
  const factionOrder = ["knights", "vikings", "samurai", "wulin"];
  const modeOrder = ["Dominion", "Duel", "Brawl", "Breach", "Skirmish", "Elimination", "Tribute", "Deathmatch"];
  const mapFactions = {
    "citadel-gate": "knights",
    "sanctuary-bridge": "samurai",
    "temple-garden": "samurai",
    "high-fort": "vikings",
    "the-shard": "knights"
  };
  const factionLabels = {
    knights: "Рыцари",
    vikings: "Викинги",
    samurai: "Самураи",
    wulin: "У Линь"
  };
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
  let activeModes = new Set([ALL]);
  let activeFactions = new Set([ALL]);

  function label(item) {
    return typeof item === "string" ? (modeLabels[item] ? FH.text(modeLabels[item]) : item) : FH.text(item);
  }

  function factionIcon(key) {
    return FH.asset(`assets/icons/factions/${key}.webp`);
  }

  function modeIcon(key) {
    if (key === ALL) return factionIcon(ALL);
    return FH.asset(`assets/modes/${key}.webp`);
  }

  function mapFaction(map) {
    return map.factionKey || mapFactions[map.id] || "knights";
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

  function textChip(text, key, selected) {
    const icon = key === ALL ? `<img class="filter-all-icon" src="${FH.escape(factionIcon(ALL))}" alt="" aria-hidden="true">` : "";
    return `<button class="filter-chip${selected ? " is-active" : ""}" type="button" data-filter-key="${FH.escape(key)}">${icon}<span>${FH.escape(text)}</span></button>`;
  }

  function iconChip(text, key, selected) {
    return `<button class="filter-chip filter-icon-chip${selected ? " is-active" : ""}" type="button" data-filter-key="${FH.escape(key)}" data-tooltip="${FH.escape(text)}" aria-label="${FH.escape(text)}">
      <img src="${FH.escape(factionIcon(key))}" alt="" aria-hidden="true">
    </button>`;
  }

  function modeIconChip(text, key, selected) {
    return `<button class="filter-chip filter-icon-chip${selected ? " is-active" : ""}" type="button" data-filter-key="${FH.escape(key)}" data-tooltip="${FH.escape(text)}" aria-label="${FH.escape(text)}">
      <img src="${FH.escape(modeIcon(key))}" alt="" aria-hidden="true">
    </button>`;
  }

  function renderFilters() {
    const modeMount = document.getElementById("mapModeFilter");
    const factionMount = document.getElementById("mapFactionFilter");
    if (factionMount) {
      factionMount.classList.add("filter-icons-only");
      factionMount.innerHTML = iconChip("Все", ALL, isAll(activeFactions)) + factionOrder.map((key) => iconChip(label(factionLabels[key]), key, !isAll(activeFactions) && activeFactions.has(key))).join("");
    }
    if (modeMount) {
      modeMount.classList.add("filter-icons-only");
      const modes = modeOrder.filter((mode) => FH_DATA.maps.some((map) => map.modes.includes(mode)));
      modeMount.innerHTML = modeIconChip("Все", ALL, isAll(activeModes)) + modes.map((mode) => modeIconChip(label(mode), mode, !isAll(activeModes) && activeModes.has(mode))).join("");
    }
  }

  function modeTags(map) {
    return map.modes.map((mode) => `<span class="pill">${FH.escape(label(mode))}</span>`).join("");
  }

  function renderMaps() {
    const grid = document.getElementById("mapsGrid");
    if (!grid) return;
    renderFilters();
    const query = document.getElementById("mapSearch")?.value.trim().toLowerCase() || "";
    const maps = FH_DATA.maps.filter((map) => {
      const fKey = mapFaction(map);
      const text = [FH.text(map.name), FH.text(map.description), label(factionLabels[fKey]), ...map.modes.map(label)].join(" ").toLowerCase();
      const modeOk = isAll(activeModes) || map.modes.some((mode) => activeModes.has(mode));
      const factionOk = isAll(activeFactions) || activeFactions.has(fKey);
      return modeOk && factionOk && text.includes(query);
    });

    grid.innerHTML = maps.length ? maps.map((map) => {
      const fKey = mapFaction(map);
      return `
        <a class="map-list-card reveal is-visible" href="map.html?id=${encodeURIComponent(map.id)}" aria-label="${FH.escape(FH.text(map.name))}">
          <div class="map-list-media image-wrap">
            ${FH.localImage(map.image, FH.text(map.name))}
            <span class="faction-badge map-faction-badge"><img src="${FH.escape(factionIcon(fKey))}" alt="${FH.escape(label(factionLabels[fKey]))}" loading="lazy"></span>
          </div>
          <div class="map-list-content">
            <div class="map-list-head">
              <span class="placeholder-note">${FH.escape(label(factionLabels[fKey]))}</span>
            </div>
            <h3>${FH.escape(FH.text(map.name))}</h3>
            <p class="card-description">${FH.escape(FH.text(map.description))}</p>
            <div class="meta-row">${modeTags(map)}</div>
          </div>
        </a>`;
    }).join("") : FH.empty();
  }

  function bindFilter(id, set) {
    document.getElementById(id)?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-key]");
      if (!button) return;
      updateSelection(set, button.dataset.filterKey);
      renderMaps();
    });
  }

  function resetFilters() {
    activeModes.clear();
    activeModes.add(ALL);
    activeFactions.clear();
    activeFactions.add(ALL);
    const search = document.getElementById("mapSearch");
    if (search) search.value = "";
    renderMaps();
  }

  function init() {
    const grid = document.getElementById("mapsGrid");
    if (!grid) return;
    if (grid.dataset.mapsReady === "true") {
      renderMaps();
      return;
    }
    grid.dataset.mapsReady = "true";
    document.getElementById("mapSearch")?.addEventListener("input", renderMaps);
    bindFilter("mapModeFilter", activeModes);
    bindFilter("mapFactionFilter", activeFactions);
    document.getElementById("mapFiltersReset")?.addEventListener("click", resetFilters);
    renderMaps();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
