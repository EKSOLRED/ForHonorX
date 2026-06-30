(function () {
  let modalReady = false;
  let visibleTerms = [];
  const categoryOrder = ["attack", "combat", "defense", "state", "team"];

  function esc(value) { return FH.escape(value); }
  function categoryLabel(category) { return ({ all: "Все", attack: "Атака", combat: "Бой", defense: "Защита", state: "Состояние", team: "Команда" })[category] || category; }
  function queryText() { return document.getElementById("termSearch")?.value.trim().toLowerCase() || ""; }
  function categoryMatches(category, query) {
    if (!query) return true;
    return [category, categoryLabel(category)].join(" ").toLowerCase().includes(query);
  }
  function termMatches(term, query) {
    if (!query) return true;
    const text = [FH.text(term.term), term.term, FH.text(term.description), FH.text(term.full), term.category, categoryLabel(term.category)].join(" ").toLowerCase();
    return text.includes(query);
  }
  function detailText(term) {
    return FH.text(term.full || term.description);
  }
  function ensureModal() {
    if (modalReady) return;
    const node = document.createElement("div");
    node.id = "termInfoModal";
    node.className = "modal term-info-modal";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="modal-backdrop" data-term-modal-close></div><article class="modal-card term-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-term-modal-close aria-label="Закрыть">×</button><div id="termInfoModalBody"></div></article>`;
    document.body.appendChild(node);
    node.addEventListener("click", (event) => { if (event.target.closest("[data-term-modal-close]")) closeModal(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
    modalReady = true;
  }
  function openModal(term) {
    ensureModal();
    const node = document.getElementById("termInfoModal");
    const body = document.getElementById("termInfoModalBody");
    body.innerHTML = `<div class="item-modal-header"><p class="modal-breadcrumb">${esc("Терминология")} • ${esc(categoryLabel(term.category))}</p><h2>${esc(FH.text(term.term))}</h2></div><div class="term-modal-description">${esc(detailText(term)).replace(/\n/g, "<br>")}</div>`;
    FH.openDialog?.(node);
  }
  function closeModal() {
    const node = document.getElementById("termInfoModal");
    if (!node) return;
    FH.closeDialog?.(node);
  }
  function groupedTerms() {
    const query = queryText();
    const all = FH_DATA.terminology || [];
    const categories = [...new Set([...categoryOrder, ...all.map((term) => term.category || "combat")])];
    const groups = [];
    categories.forEach((category) => {
      const baseItems = all.filter((term) => (term.category || "combat") === category);
      const items = categoryMatches(category, query) ? baseItems : baseItems.filter((term) => termMatches(term, query));
      if (items.length) groups.push({ category, items });
    });
    return groups;
  }
  function termCard(term, index) {
    return `<article class="term-card term-line-card reveal is-visible" id="term-${esc(term.id || FH.slug(FH.text(term.term)))}" data-term-index="${index}" tabindex="0" role="button" aria-label="${esc(FH.text(term.term))}">
      <strong>${esc(FH.text(term.term))}</strong><span class="term-dash">—</span><p>${esc(FH.text(term.description))}</p>
    </article>`;
  }
  function ensureSectionJump() {
    let jump = document.getElementById("termsSectionJump");
    if (jump) return jump;
    jump = document.createElement("div");
    jump.id = "termsSectionJump";
    jump.className = "section-jump";
    jump.innerHTML = `<button class="section-jump-toggle" type="button" data-section-jump-toggle aria-expanded="false" aria-label="${esc("Разделы")}"><svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><div class="section-jump-menu" data-section-jump-menu hidden></div>`;
    document.body.appendChild(jump);
    return jump;
  }
  function updateSectionJump(groups) {
    const jump = ensureSectionJump();
    const menu = jump.querySelector("[data-section-jump-menu]");
    menu.innerHTML = groups.map((group) => `<button type="button" data-section-target="terms-${esc(group.category)}">${esc(categoryLabel(group.category))}</button>`).join("");
  }
  function renderTerms() {
    const grid = document.getElementById("termsGrid");
    if (!grid) return;
    visibleTerms = [];
    const groups = groupedTerms();
    const html = groups.map((group) => {
      const cards = group.items.map((term) => {
        const index = visibleTerms.push(term) - 1;
        return termCard(term, index);
      }).join("");
      return `<section class="terms-section" id="terms-${esc(group.category)}"><h2>${esc(categoryLabel(group.category))}</h2><div class="terms-section-list">${cards}</div></section>`;
    }).join("");
    grid.innerHTML = html || FH.empty();
    updateSectionJump(groups);
    FH.scrollToHash?.();
  }
  function bindGrid() {
    const grid = document.getElementById("termsGrid");
    if (!grid) return;
    grid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-term-index]");
      if (!card) return;
      const term = visibleTerms[Number(card.dataset.termIndex)];
      if (term) openModal(term);
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-term-index]");
      if (!card) return;
      event.preventDefault();
      const term = visibleTerms[Number(card.dataset.termIndex)];
      if (term) openModal(term);
    });
  }
  function bindSectionJump() {
    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("#termsSectionJump [data-section-jump-toggle]");
      if (toggle) {
        const menu = document.querySelector("#termsSectionJump [data-section-jump-menu]");
        const open = menu?.hidden;
        if (menu) menu.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        return;
      }
      const item = event.target.closest("#termsSectionJump [data-section-target]");
      if (item) {
        document.getElementById(item.dataset.sectionTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
        const menu = document.querySelector("#termsSectionJump [data-section-jump-menu]");
        if (menu) menu.hidden = true;
        document.querySelector("#termsSectionJump [data-section-jump-toggle]")?.setAttribute("aria-expanded", "false");
        return;
      }
      if (!event.target.closest("#termsSectionJump")) {
        const menu = document.querySelector("#termsSectionJump [data-section-jump-menu]");
        if (menu) menu.hidden = true;
      }
    });
  }
  function init() {
    if (!document.getElementById("termsGrid")) return;
    document.getElementById("termSearch")?.addEventListener("input", renderTerms);
    bindGrid();
    bindSectionJump();
    renderTerms();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
