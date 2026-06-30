(function () {
  let modalReady = false;
  const ALL = "all";
  let activeRarities = new Set([ALL]);
  let activeTypes = new Set([ALL]);
  const rarities = [ALL, "common", "rare", "heroic", "epic", "legendary"];
  const types = [ALL, "support", "attack", "defense"];
  function esc(v) { return FH.escape(v); }
  function text(v) { return FH.text(v); }
  function perkRarity(perk) { return perk.catalogRarity || perk.pageRarity || perk.rarity || "common"; }
  function rarityLabel(rarity) { return rarity === ALL ? "Все" : text(FH.rarityMeta[rarity]?.label || rarity); }
  function typeLabel(type) { return type === ALL ? "Все" : text(FH.perkTypeLabels[type] || type); }
  function isAll(set) { return set.has(ALL) || set.size === 0; }
  function toggleSet(set, value) {
    if (value === ALL) {
      set.clear();
      set.add(ALL);
      return;
    }
    set.delete(ALL);
    set.has(value) ? set.delete(value) : set.add(value);
    if (set.size === 0) set.add(ALL);
  }
  function availabilityBox(items) {
    const names = (items || []).map(text).filter(Boolean);
    return `<button class="availability-box" type="button" data-expand-availability aria-expanded="false">
      <span class="box-label">${esc("Доступность")}</span>
      <strong class="availability-list">${esc(names.join(", ") || "—")}</strong>
    </button>`;
  }
  function ensureModal() {
    if (modalReady) return;
    const node = document.createElement("div");
    node.id = "catalogPerkModal";
    node.className = "modal item-modal";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="modal-backdrop" data-catalog-modal-close></div><article class="modal-card item-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-catalog-modal-close aria-label="Закрыть">×</button><div id="catalogPerkModalBody"></div></article>`;
    document.body.appendChild(node);
    node.addEventListener("click", (event) => {
      const box = event.target.closest("[data-expand-availability]");
      if (box) {
        box.classList.toggle("is-expanded");
        box.setAttribute("aria-expanded", String(box.classList.contains("is-expanded")));
        return;
      }
      if (event.target.closest("[data-catalog-modal-close]")) closeModal();
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
    modalReady = true;
  }
  function openModal(perk) {
    ensureModal();
    const rarity = perkRarity(perk);
    const meta = FH.rarityMeta[rarity] || FH.rarityMeta.common;
    const type = FH.perkTypeLabels[perk.perkType] || FH.perkTypeLabels.support;
    document.getElementById("catalogPerkModalBody").innerHTML = `<div class="perk-modal-tint ${esc(meta.className)}"><div class="item-modal-header">
      <p class="modal-breadcrumb">${esc("Перки")} • ${esc(text(meta.label))}</p>
      <h2>${esc(text(perk.name))}</h2>
      <div class="item-modal-badges ability-badges"><span class="ability-badge">${esc(text(meta.label))}</span><span class="ability-badge">${esc(text(type))}</span></div>
    </div>
    <div class="item-modal-layout"><span class="ability-icon is-large image-wrap">${FH.localImage(perk.image, text(perk.name))}</span><div><div class="modal-effect-block"><span>${esc("Описание")}</span><p>${esc(text(perk.description))}</p></div>${availabilityBox(perk.heroes)}<div class="modal-rating"><span>${esc("Оценка")}</span><strong>${esc(text(perk.rating))}</strong></div></div></div></div>`;
    const node = document.getElementById("catalogPerkModal");
    FH.openDialog?.(node);
  }
  function closeModal() {
    const node = document.getElementById("catalogPerkModal");
    if (!node) return;
    FH.closeDialog?.(node);
  }
  function renderCard(perk) {
    const rarity = perkRarity(perk);
    const meta = FH.rarityMeta[rarity] || FH.rarityMeta.common;
    const type = FH.perkTypeLabels[perk.perkType] || FH.perkTypeLabels.support;
    return `<article class="perk-card ability-like-card catalog-card ${meta.className}" id="${esc(perk.id)}" data-rarity="${esc(rarity)}" data-perk-id="${esc(perk.id)}" tabindex="0" role="button" aria-label="${esc("Подробнее")}: ${esc(text(perk.name))}">
      <span class="ability-card-bg image-wrap">${FH.localImage(perk.image, text(perk.name))}</span>
      <div class="ability-card-content">
        <h3>${esc(text(perk.name))}</h3>
        <div class="ability-badges"><span class="ability-badge">${esc(text(meta.label))}</span><span class="ability-badge">${esc(text(type))}</span></div>
        <p class="ability-card-desc">${esc(text(perk.description))}</p>
        <div class="ability-card-footer"><span class="ability-info-button" aria-hidden="true">i</span><span class="ability-hint-text">${esc("Нажми на меня")}</span></div>
      </div>
    </article>`;
  }
  function filterButton(attr, value, active, label) {
    return `<button class="chip ${active ? "is-active" : ""}" type="button" ${attr}="${esc(value)}" aria-pressed="${active ? "true" : "false"}">${esc(label)}</button>`;
  }
  function renderFilters() {
    const mount = document.getElementById("perkFilters");
    if (!mount) return;
    mount.innerHTML = `<div class="filter-group"><span>${esc("Уровень")}</span><div class="filter-chips">${rarities.map((rarity) => filterButton("data-perk-rarity", rarity, isAll(activeRarities) ? rarity === ALL : activeRarities.has(rarity), rarityLabel(rarity))).join("")}</div></div><div class="filter-group"><span>${esc("Тип")}</span><div class="filter-chips">${types.map((type) => filterButton("data-perk-type", type, isAll(activeTypes) ? type === ALL : activeTypes.has(type), typeLabel(type))).join("")}</div></div>`;
  }
  function filteredItems() {
    const query = document.getElementById("catalogSearch")?.value.trim().toLowerCase() || "";
    return FH.collectPerks().filter((perk) => {
      const rarity = perkRarity(perk);
      const meta = FH.rarityMeta[rarity] || FH.rarityMeta.common;
      const type = FH.perkTypeLabels[perk.perkType] || FH.perkTypeLabels.support;
      const matchesRarity = isAll(activeRarities) || activeRarities.has(rarity);
      const matchesType = isAll(activeTypes) || activeTypes.has(perk.perkType);
      const searchText = [text(perk.name), text(perk.description), text(meta.label), text(type), ...(perk.heroes || []).map(text)].join(" ").toLowerCase();
      return matchesRarity && matchesType && searchText.includes(query);
    });
  }
  function render() {
    const grid = document.getElementById("catalogGrid");
    if (!grid) return;
    renderFilters();
    const items = filteredItems();
    const order = ["defense", "attack", "support"];
    const html = order.map((typeKey) => {
      const cards = items.filter((perk) => perk.perkType === typeKey);
      return cards.length ? `<div class="ability-tier perk-type-tier perk-type-${esc(typeKey)}"><div class="ability-tier-label">${esc(typeLabel(typeKey))}</div><div class="ability-tier-cards">${cards.map(renderCard).join("")}</div></div>` : "";
    }).join("");
    grid.classList.add("catalog-ability-list");
    grid.innerHTML = html || FH.empty();
    FH.scrollToHash?.();
  }
  function initPerksCatalog() {
    const grid = document.getElementById("catalogGrid");
    if (!grid || grid.dataset.perksReady === "true") return;
    grid.dataset.perksReady = "true";
    document.getElementById("catalogSearch")?.addEventListener("input", render);
    document.getElementById("perkFilters")?.addEventListener("click", (event) => {
      const rarity = event.target.closest("[data-perk-rarity]");
      const type = event.target.closest("[data-perk-type]");
      if (rarity) toggleSet(activeRarities, rarity.dataset.perkRarity);
      if (type) toggleSet(activeTypes, type.dataset.perkType);
      if (rarity || type) render();
    });
    grid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-perk-id]");
      if (!card) return;
      const perk = FH.collectPerks().find((item) => item.id === card.dataset.perkId);
      if (perk) openModal(perk);
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-perk-id]");
      if (!card) return;
      event.preventDefault();
      const perk = FH.collectPerks().find((item) => item.id === card.dataset.perkId);
      if (perk) openModal(perk);
    });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPerksCatalog);
  else initPerksCatalog();
})();
