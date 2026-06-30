(function () {
  const qs = new URLSearchParams(location.search);
  let heroId = qs.get("hero") || "warden";
  let gearTier = qs.get("gear") || "common";
  let selectedPerks = new Set();

  const rarityOrder = ["common", "rare", "heroic", "epic", "legendary"];
  const gearTiers = ["common", "rare", "heroic", "epic", "legendary"];
  const statusMessages = {
    valid: "Комбинация допустима.",
    partial: "Пока всё допустимо. Можно выбрать ещё перки.",
    invalid: "Эта комбинация недопустима для выбранного уровня экипировки."
  };
  const allowedCombos = {
    common: [["common", "common"]],
    rare: [["common", "common"], ["common", "rare"]],
    heroic: [["common", "common"], ["common", "rare"], ["common", "heroic"]],
    epic: [["common", "common", "common"], ["common", "common"], ["common", "rare"], ["common", "heroic"], ["common", "epic"], ["rare", "heroic"], ["rare", "epic"]],
    legendary: [["common", "common", "common"], ["common", "common", "rare"], ["common", "common", "heroic"], ["common", "rare", "heroic"], ["common", "common", "epic"], ["common", "rare", "epic"], ["common", "common", "legendary"], ["common", "rare", "legendary"], ["heroic", "epic"], ["heroic", "legendary"], ["epic", "legendary"]]
  };

  function esc(value) { return FH.escape(value); }
  function text(value) { return FH.text(value); }
  function rarityLabel(rarity) { return text(FH.rarityMeta[rarity]?.label || rarity); }
  function selectedHero() { return FH.heroById(heroId) || FH_DATA.heroes[0]; }
  function heroPerks(hero) { return FH.heroPerkItems ? FH.heroPerkItems(hero) : FH.heroPerkIds(hero).map(FH.perkById).filter(Boolean); }
  function heroSearchText(hero) { return [text(hero.name), text(hero.faction), text(FH.heroType(hero)), text(hero.summary), hero.id].join(" ").toLowerCase(); }
  function countRarities(ids, perks) {
    return [...ids].reduce((acc, id) => {
      const perk = perks.find((item) => item.id === id) || FH.perkById(id);
      if (!perk) return acc;
      acc[perk.rarity] = (acc[perk.rarity] || 0) + 1;
      return acc;
    }, {});
  }
  function comboCounts(combo) {
    return combo.reduce((acc, rarity) => {
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {});
  }
  function countSize(counts) { return Object.values(counts).reduce((sum, value) => sum + value, 0); }
  function countsEqual(a, b) {
    return rarityOrder.every((rarity) => (a[rarity] || 0) === (b[rarity] || 0));
  }
  function countsFit(partial, full) {
    return rarityOrder.every((rarity) => (partial[rarity] || 0) <= (full[rarity] || 0));
  }
  function isPrefixValid(ids, perks, tier = gearTier) {
    const counts = countRarities(ids, perks);
    if (!countSize(counts)) return true;
    return (allowedCombos[tier] || []).some((combo) => countsFit(counts, comboCounts(combo)));
  }
  function isExactValid(ids, perks, tier = gearTier) {
    const counts = countRarities(ids, perks);
    return (allowedCombos[tier] || []).some((combo) => countsEqual(counts, comboCounts(combo)));
  }
  function comboLabel(combo) {
    const counts = comboCounts(combo);
    return rarityOrder
      .filter((rarity) => counts[rarity])
      .map((rarity) => counts[rarity] > 1 ? `${counts[rarity]}× ${rarityLabel(rarity).toLowerCase()}` : rarityLabel(rarity).toLowerCase())
      .join(" + ");
  }
  function allowedList() {
    return `<div class="perk-combo-list">${(allowedCombos[gearTier] || []).map((combo) => `<span>${esc(comboLabel(combo))}</span>`).join("")}</div>`;
  }
  function syncUrl() {
    const next = new URL(location.href);
    next.searchParams.set("hero", heroId);
    next.searchParams.set("gear", gearTier);
    history.replaceState(null, "", next);
  }
  function heroPicker(hero) {
    return `<div class="hero-picker" data-hero-picker>
      <span class="hero-picker-label">${esc("Герой")}</span>
      <button class="hero-picker-toggle" type="button" data-hero-picker-toggle aria-expanded="false">
        <span class="hero-picker-current"><span class="hero-picker-avatar image-wrap">${FH.localImage(hero.image, text(hero.name))}</span><span><strong>${esc(text(hero.name))}</strong><small>${esc(text(FH.heroType(hero)))}</small></span></span>
        <svg class="picker-chevron" aria-hidden="true" viewBox="0 0 16 16"><path d="M4.5 6.25 8 9.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </button>
      <div class="hero-picker-menu" data-hero-picker-menu hidden>
        <input class="hero-picker-search" type="search" data-hero-picker-search placeholder="${esc("Поиск героя...")}" autocomplete="off">
        <div class="hero-picker-list">
          ${FH_DATA.heroes.map((item) => `<button class="hero-picker-option${item.id === hero.id ? " is-active" : ""}" type="button" data-hero-option="${esc(item.id)}" data-search="${esc(heroSearchText(item))}"><span class="hero-picker-avatar image-wrap">${FH.localImage(item.image, text(item.name))}</span><span><strong>${esc(text(item.name))}</strong><small>${esc(text(FH.heroType(item)))}</small></span></button>`).join("")}
        </div>
      </div>
    </div>`;
  }
  function gearSelector() {
    return `<div class="gear-selector" aria-label="${esc("Уровень экипировки")}">
      <span class="hero-picker-label">${esc("Уровень экипировки")}</span>
      <div class="gear-tier-grid">${gearTiers.map((tier) => `<button class="gear-tier-btn ${esc(FH.rarityMeta[tier]?.className || "")} gear-tier-${esc(tier)} ${tier === gearTier ? "is-active" : ""}" type="button" data-gear-tier="${esc(tier)}"><span>${esc(rarityLabel(tier))}</span></button>`).join("")}</div>
    </div>`;
  }
  function optionCard(perk, perks) {
    const next = new Set(selectedPerks);
    next.has(perk.id) ? next.delete(perk.id) : next.add(perk.id);
    const active = selectedPerks.has(perk.id);
    const disabled = !active && !isPrefixValid(next, perks);
    return `<button class="build-option${active ? " is-active" : ""}" type="button" data-build-perk="${esc(perk.id)}" ${disabled ? "disabled" : ""}>
      <span class="build-option-icon image-wrap">${FH.localImage(perk.image, text(perk.name))}</span>
      <strong>${esc(text(perk.name))}</strong>
      <small class="rarity-pill ${esc(FH.rarityMeta[perk.rarity]?.className || "")}">${esc(rarityLabel(perk.rarity))}</small>
      <span>${esc(text(perk.effect || perk.description))}</span>
    </button>`;
  }
  function renderSummary(hero, perks) {
    const selected = [...selectedPerks].map((id) => perks.find((perk) => perk.id === id)).filter(Boolean);
    const exact = isExactValid(selectedPerks, perks);
    const partial = isPrefixValid(selectedPerks, perks);
    const statusKey = exact ? "valid" : (partial ? "partial" : "invalid");
    return `<aside class="build-summary">
      <div class="build-summary-hero image-wrap">${FH.localImage(hero.image, text(hero.name))}</div>
      <h2>${esc(text(hero.name))}</h2>
      <p>${esc("Подбор не сохраняется и не создаёт нагрузку на хостинг.")}</p>
      <h3>${esc("Перки")}</h3>
      <div class="mini-token-row">${selected.map((perk) => `<span>${esc(text(perk.name))}</span>`).join("") || "—"}</div>
      <p class="build-warning ${statusKey}">${esc(statusMessages[statusKey] || "")}</p>
      <h3>${esc("Допустимые комбинации")}</h3>
      ${allowedList()}
    </aside>`;
  }
  function render() {
    const root = document.getElementById("buildApp");
    if (!root) return;
    const hero = selectedHero();
    heroId = hero.id;
    const perks = heroPerks(hero);
    if (!isPrefixValid(selectedPerks, perks)) selectedPerks = new Set();
    const selectedCount = selectedPerks.size;
    root.innerHTML = `<div class="build-layout perk-builder-layout">
      <div class="build-main">
        <div class="builder-control-grid">${heroPicker(hero)}${gearSelector()}</div>
        <div class="build-perk-table-action"><button class="btn btn-primary" type="button" data-open-perk-builder>${esc("Таблица подбора")}</button></div>
        <div class="build-panel">
          <div class="section-heading split"><div><p class="eyebrow">${esc("Перки")}</p><h2>${esc("Выбери перки")}</h2></div><span class="counter-pill">${selectedCount}</span></div>
          <p class="builder-help">${esc("Недоступные варианты блокируются: подбор следует правилам комбинаций для выбранного уровня экипировки.")}</p>
          <div class="build-options perk-options">${perks.map((perk) => optionCard(perk, perks)).join("")}</div>
        </div>
      </div>
      ${renderSummary(hero, perks)}
    </div>`;
  }
  function closePickers() {
    document.querySelectorAll("[data-hero-picker]").forEach((picker) => {
      picker.classList.remove("is-open");
      picker.querySelector("[data-hero-picker-toggle]")?.setAttribute("aria-expanded", "false");
      const menu = picker.querySelector("[data-hero-picker-menu]");
      if (menu) menu.hidden = true;
    });
  }
  function filterPicker(input) {
    const picker = input.closest("[data-hero-picker]");
    const query = input.value.trim().toLowerCase();
    picker?.querySelectorAll("[data-hero-option]").forEach((option) => {
      option.hidden = query && !option.dataset.search.includes(query);
    });
  }
  function init() {
    const root = document.getElementById("buildApp");
    if (!root) return;
    if (root.dataset.buildReady === "true") {
      render();
      return;
    }
    root.dataset.buildReady = "true";
    const hero = selectedHero();
    heroId = hero.id;
    if (!gearTiers.includes(gearTier)) gearTier = "common";
    root.addEventListener("click", (event) => {
      const tableButton = event.target.closest("[data-open-perk-builder]");
      if (tableButton) {
        FH.openPerkBuilderTable?.();
        return;
      }
      const toggle = event.target.closest("[data-hero-picker-toggle]");
      if (toggle) {
        const picker = toggle.closest("[data-hero-picker]");
        const menu = picker.querySelector("[data-hero-picker-menu]");
        const open = !picker.classList.contains("is-open");
        closePickers();
        picker.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        menu.hidden = !open;
        if (open) requestAnimationFrame(() => picker.querySelector("[data-hero-picker-search]")?.focus());
        return;
      }
      const option = event.target.closest("[data-hero-option]");
      if (option) {
        heroId = option.dataset.heroOption;
        selectedPerks = new Set();
        syncUrl(); closePickers(); render();
        return;
      }
      const tier = event.target.closest("[data-gear-tier]");
      if (tier) {
        gearTier = tier.dataset.gearTier;
        const perks = heroPerks(selectedHero());
        if (!isPrefixValid(selectedPerks, perks, gearTier)) selectedPerks = new Set();
        syncUrl(); render();
        return;
      }
      const perk = event.target.closest("[data-build-perk]");
      if (perk) {
        const id = perk.dataset.buildPerk;
        selectedPerks.has(id) ? selectedPerks.delete(id) : selectedPerks.add(id);
        syncUrl(); render();
      }
    });
    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-hero-picker-search]");
      if (search) filterPicker(search);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-hero-picker]")) closePickers();
    });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  requestAnimationFrame(() => init());
  window.addEventListener("load", () => init(), { once: true });
})();
