(function () {
  let modalReady = false;
  const ALL = "all";
  let activeLevels = new Set([ALL]);
  let activeKinds = new Set([ALL]);
  const levels = [ALL, "1", "2", "3", "4"];
  const kinds = [ALL, "active", "passive"];
  function esc(v) { return FH.escape(v); }
  function text(v) { return FH.text(v); }
  function featKindLabel(feat) { return feat.kind === "passive" ? "Пассивная" : "Активная"; }
  function featKindClass(feat) { return feat?.kind === "passive" ? "is-passive" : "is-active"; }
  function kindLabel(kind) { return kind === ALL ? "Все" : (kind === "passive" ? "Пассивная" : "Активная"); }
  function levelLabel(level) { return level === ALL ? "Все" : `${"Уровень"} ${level}`; }
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
  function filled(value) {
    const text = String(value ?? "").trim();
    return text && text !== "—" && text !== "-";
  }
  function stats(feat, className = "ability-card-stats") {
    const rows = [
      ["Откат", feat.cooldown],
      ["Активация", feat.cast],
      ["Восстановление", feat.recovery]
    ].filter(([, value]) => filled(value));
    return rows.length ? `<div class="${className}">${rows.map(([label, value]) => `<div class="${className === "modal-stat-tiles" ? "modal-stat-tile" : "ability-stat"}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div>` : "";
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
    node.id = "catalogFeatModal";
    node.className = "modal item-modal";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="modal-backdrop" data-catalog-modal-close></div><article class="modal-card item-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-catalog-modal-close aria-label="Закрыть">×</button><div id="catalogFeatModalBody"></div></article>`;
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
  function openModal(feat) {
    ensureModal();
    const unique = (feat.heroes || []).length <= 1;
    document.getElementById("catalogFeatModalBody").innerHTML = `<div class="item-modal-header">
      <p class="modal-breadcrumb">${esc("Способности")} • ${esc("Уровень")} ${esc(feat.level)}</p>
      <h2>${esc(text(feat.name))}</h2>
      <div class="item-modal-badges ability-badges"><span class="ability-badge ${featKindClass(feat)}">${esc(featKindLabel(feat))}</span>${unique ? `<span class="ability-badge is-unique">${esc("Уникальная")}</span>` : ""}</div>
    </div>
    <div class="item-modal-layout"><span class="ability-icon is-large image-wrap">${FH.localImage(feat.image, text(feat.name))}</span><div><div class="modal-effect-block"><span>${esc("Описание")}</span><p>${esc(text(feat.description))}</p></div>${stats(feat, "modal-stat-tiles")}${availabilityBox(feat.heroes)}<div class="modal-rating"><span>${esc("Оценка")}</span><strong>${esc(text(feat.rating))}</strong></div></div></div>`;
    const node = document.getElementById("catalogFeatModal");
    FH.openDialog?.(node);
  }
  function closeModal() {
    const node = document.getElementById("catalogFeatModal");
    if (!node) return;
    FH.closeDialog?.(node);
  }
  function renderCard(feat) {
    const unique = (feat.heroes || []).length <= 1;
    return `<article class="feat-card ability-like-card catalog-card ${unique ? "is-unique-card" : ""}" id="${esc(feat.id)}" data-feat-id="${esc(feat.id)}" tabindex="0" role="button" aria-label="${esc("Подробнее")}: ${esc(text(feat.name))}">
      <span class="ability-card-bg image-wrap">${FH.localImage(feat.image, text(feat.name))}</span>
      <div class="ability-card-content">
        <h3>${esc(text(feat.name))}</h3>
        <div class="ability-badges"><span class="ability-badge ${featKindClass(feat)}">${esc(featKindLabel(feat))}</span>${unique ? `<span class="ability-badge is-unique">${esc("Уникальная")}</span>` : ""}</div>
        <p class="ability-card-desc">${esc(text(feat.description))}</p>
        ${stats(feat)}
        <div class="ability-card-footer"><span class="ability-info-button" aria-hidden="true">i</span><span class="ability-hint-text">${esc("Нажми на меня")}</span></div>
      </div>
    </article>`;
  }
  function filterButton(attr, value, active, label) {
    return `<button class="chip ${active ? "is-active" : ""}" type="button" ${attr}="${esc(value)}" aria-pressed="${active ? "true" : "false"}">${esc(label)}</button>`;
  }
  function renderFilters() {
    const mount = document.getElementById("featKindFilters");
    if (!mount) return;
    mount.innerHTML = `<div class="filter-group"><span>${esc("Уровень")}</span><div class="filter-chips">${levels.map((level) => filterButton("data-feat-level", level, isAll(activeLevels) ? level === ALL : activeLevels.has(level), levelLabel(level))).join("")}</div></div><div class="filter-group"><span>${esc("Тип")}</span><div class="filter-chips">${kinds.map((kind) => filterButton("data-feat-kind", kind, isAll(activeKinds) ? kind === ALL : activeKinds.has(kind), kindLabel(kind))).join("")}</div></div>`;
  }
  function filteredItems() {
    const query = document.getElementById("catalogSearch")?.value.trim().toLowerCase() || "";
    return FH.collectFeats().filter((feat) => {
      const matchesLevel = isAll(activeLevels) || activeLevels.has(String(feat.level));
      const matchesKind = isAll(activeKinds) || activeKinds.has(feat.kind);
      const searchText = [text(feat.name), text(feat.description), feat.level, featKindLabel(feat), ...(feat.heroes || []).map(text)].join(" ").toLowerCase();
      return matchesLevel && matchesKind && searchText.includes(query);
    });
  }
  function render() {
    const grid = document.getElementById("catalogGrid");
    if (!grid) return;
    renderFilters();
    const items = filteredItems();
    const html = [1,2,3,4].map((tier) => {
      const cards = items.filter((feat) => String(feat.level) === String(tier));
      return cards.length ? `<div class="ability-tier"><div class="ability-tier-label">${esc("Уровень")} ${tier}</div><div class="ability-tier-cards">${cards.map(renderCard).join("")}</div></div>` : "";
    }).join("");
    grid.classList.add("catalog-ability-list");
    grid.innerHTML = html || FH.empty();
    FH.scrollToHash?.();
  }
  function initFeatsCatalog() {
    const grid = document.getElementById("catalogGrid");
    if (!grid || grid.dataset.featsReady === "true") return;
    grid.dataset.featsReady = "true";
    document.getElementById("catalogSearch")?.addEventListener("input", render);
    document.getElementById("featKindFilters")?.addEventListener("click", (event) => {
      const level = event.target.closest("[data-feat-level]");
      const kind = event.target.closest("[data-feat-kind]");
      if (level) toggleSet(activeLevels, level.dataset.featLevel);
      if (kind) toggleSet(activeKinds, kind.dataset.featKind);
      if (level || kind) render();
    });
    grid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-feat-id]");
      if (!card) return;
      const feat = FH.collectFeats().find((item) => item.id === card.dataset.featId);
      if (feat) openModal(feat);
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-feat-id]");
      if (!card) return;
      event.preventDefault();
      const feat = FH.collectFeats().find((item) => item.id === card.dataset.featId);
      if (feat) openModal(feat);
    });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initFeatsCatalog);
  else initFeatsCatalog();
  requestAnimationFrame(() => initFeatsCatalog());
  window.addEventListener("load", () => initFeatsCatalog(), { once: true });
})();
