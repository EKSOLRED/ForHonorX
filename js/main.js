(function () {
  window.FH = window.FH || {};
  FH.basePath = function () { return location.pathname.includes("/pages/") ? ".." : "."; };
  FH.pagePath = function (page) { return location.pathname.includes("/pages/") ? page : `pages/${page}`; };
  FH.asset = function (path) { return `${FH.basePath()}/${path}`; };
  FH.escape = function (value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  };
  FH.text = function (value) {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(FH.text).filter(Boolean).join(", ");
    if (typeof value === "object") return String(value.text || value.name || value.label || Object.values(value).find((item) => typeof item === "string") || "");
    return String(value);
  };
  FH.slug = function (value) { return String(value || "").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, ""); };
  FH.tags = function (items) { return items.map((item) => `<span class="tag">${FH.escape(FH.text(item))}</span>`).join(""); };
  FH.empty = function () { return `<div class="empty-state">${FH.escape("Ничего не найдено")}</div>`; };
  FH.localImage = function (path, alt = "") {
    return `<img src="${FH.asset(path)}" alt="${FH.escape(alt)}" loading="lazy" onerror="this.closest('.image-wrap, .hero-card-media, .map-card-media, .map-list-media, .mini-card, .feat-card, .perk-card, .detail-poster-image')?.classList.add('is-missing'); this.remove();">`;
  };
  const modalFocusStore = new WeakMap();
  let modalScrollY = 0;
  let previousHtmlScrollBehavior = "";

  function lockPageScroll() {
    if (document.documentElement.classList.contains("modal-scroll-locked")) return;
    modalScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior || "";
    document.documentElement.classList.add("modal-scroll-locked");
    document.body.classList.add("modal-scroll-locked");
    document.body.style.top = `-${modalScrollY}px`;
  }

  function unlockPageScroll() {
    if (!document.documentElement.classList.contains("modal-scroll-locked")) return;
    const restoreY = modalScrollY || 0;
    document.documentElement.style.scrollBehavior = "auto";
    document.documentElement.classList.remove("modal-scroll-locked");
    document.body.classList.remove("modal-scroll-locked");
    document.body.style.top = "";
    window.scrollTo({ left: 0, top: restoreY, behavior: "auto" });
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
    });
  }

  function detachModalClose(node) {
    if (!node) return null;
    const button = node.querySelector(".modal-close");
    if (!button) return null;
    if (button.parentElement !== node) node.appendChild(button);
    return button;
  }

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "details summary",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  FH.getFocusable = function (root) {
    return [...(root || document).querySelectorAll(focusableSelector)].filter((node) => {
      return !node.hasAttribute("disabled") && !node.getAttribute("aria-hidden") && node.offsetParent !== null;
    });
  };

  FH.openDialog = function (node, focusTarget) {
    if (!node) return;
    if (!modalFocusStore.has(node)) modalFocusStore.set(node, document.activeElement);
    node.classList.add("is-open");
    node.setAttribute("aria-hidden", "false");
    lockPageScroll();
    detachModalClose(node);
    const target = focusTarget || FH.getFocusable(node)[0] || node.querySelector("[role='dialog']") || node;
    if (!target.hasAttribute("tabindex") && target === node) target.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  };

  FH.closeDialog = function (node, options = {}) {
    if (!node) return;
    node.classList.remove("is-open");
    node.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.is-open")) unlockPageScroll();
    const previous = modalFocusStore.get(node);
    modalFocusStore.delete(node);
    if (options.restoreFocus !== false && previous && document.contains(previous)) {
      requestAnimationFrame(() => previous.focus({ preventScroll: true }));
    }
  };


  const perkBuilderTable = {
      title: "Таблица подбора перков",
      subtitle: "Строки внутри уровня снаряжения показывают доступные варианты сборки перков для этого уровня.",
      columns: ["Уровень снаряжения", "Вариант", "Перк 1", "Перк 2", "Перк 3", "Перк 4", "Перк 5", "Перк 6", "Перк 7"],
      groups: [
        { tier: "Обычный", rep: "0/1", rarity: "common", options: [
          { option: "Вариант 1", cells: [{ start: 1, end: 1, text: "Выберите 1" }, { start: 2, end: 2, text: "Выберите 1" }] }
        ]},
        { tier: "Редкий", rep: "1/2", rarity: "rare", options: [
          { option: "Вариант 1", cells: [{ start: 1, end: 4, text: "Выберите 2" }] }
        ]},
        { tier: "Героический", rep: "3/4", rarity: "heroic", options: [
          { option: "Вариант 1", cells: [{ start: 1, end: 4, text: "Выберите 2" }] },
          { option: "Вариант 2", cells: [{ start: 1, end: 3, text: "Выберите 1" }, { start: 5, end: 5, text: "Выберите 1" }] }
        ]},
        { tier: "Эпический", rep: "5/6", rarity: "epic", options: [
          { option: "Вариант 1", cells: [{ start: 1, end: 3, text: "Выберите 3" }] },
          { option: "Вариант 2", cells: [{ start: 1, end: 4, text: "Выберите 2" }] },
          { option: "Вариант 3", cells: [{ start: 1, end: 4, text: "Выберите 1" }, { start: 5, end: 6, text: "Выберите 1" }] }
        ]},
        { tier: "Легендарный", rep: "7/8+", rarity: "legendary", options: [
          { option: "Вариант 1", cells: [{ start: 1, end: 3, text: "Выберите 3" }] },
          { option: "Вариант 2", cells: [{ start: 1, end: 4, text: "Выберите 2" }, { start: 5, end: 7, text: "Выберите 1" }] },
          { option: "Вариант 3", cells: [{ start: 5, end: 7, text: "Выберите 2" }] }
        ]}
      ],
      notesTitle: "Пояснения",
      notes: [
        "Ячейки «Выберите №» показывают диапазон, какие перки и сколько можно активировать одновременно.",
        "{{repMark}} — уровень репутации, на котором можно получить данную экипировку."
      ]
  };

  function renderReputationMark(rep) {
    return `<span class="reputation-mark reputation-wreath-mark" aria-label="${FH.escape(rep)}"><span class="reputation-wreath reputation-wreath-left" aria-hidden="true"></span><span class="reputation-value">${FH.escape(rep)}</span><span class="reputation-wreath reputation-wreath-right" aria-hidden="true"></span></span>`;
  }

  function renderPerkBuilderEmptyCell() {
    return `<td class="perk-builder-empty">—</td>`;
  }

  function renderPerkBuilderPickCell(cell) {
    const start = Number(cell.start) || 1;
    const end = Math.max(start, Number(cell.end) || start);
    const span = Math.min(7, end) - Math.min(7, start) + 1;
    const colspan = span > 1 ? ` colspan="${span}"` : "";
    return `<td class="perk-builder-pick"${colspan}>${FH.escape(cell.text)}</td>`;
  }

  function renderPerkBuilderPerkCells(cells = []) {
    const sorted = [...cells]
      .map((cell) => ({ ...cell, start: Math.max(1, Math.min(7, Number(cell.start) || 1)), end: Math.max(1, Math.min(7, Number(cell.end) || Number(cell.start) || 1)) }))
      .sort((a, b) => a.start - b.start || a.end - b.end);
    let html = "";
    let position = 1;
    sorted.forEach((cell) => {
      if (cell.end < position) return;
      while (position < cell.start) {
        html += renderPerkBuilderEmptyCell();
        position += 1;
      }
      html += renderPerkBuilderPickCell(cell);
      position = cell.end + 1;
    });
    while (position <= 7) {
      html += renderPerkBuilderEmptyCell();
      position += 1;
    }
    return html;
  }

  function ensurePerkBuilderModal() {
    let node = document.getElementById("globalPerkBuilderModal");
    if (node) return node;
    node = document.createElement("div");
    node.id = "globalPerkBuilderModal";
    node.className = "item-modal modal is-perk-builder-modal";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="modal-backdrop" data-perk-builder-modal-close></div><article class="modal-card item-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-perk-builder-modal-close aria-label="Закрыть">×</button><div id="globalPerkBuilderModalBody"></div></article>`;
    node.addEventListener("click", (event) => {
      if (event.target.closest("[data-perk-builder-modal-close]")) FH.closeDialog?.(node);
    });
    document.body.appendChild(node);
    return node;
  }

  FH.renderPerkBuilderTable = function () {
    const data = perkBuilderTable;
    const header = data.columns.map((column, index) => `<th class="${index > 1 ? "perk-builder-perk-head" : ""}">${FH.escape(column)}</th>`).join("");
    const rows = data.groups.map((group) => {
      const rarityClass = FH.escape(FH.rarityMeta?.[group.rarity]?.className || "rarity-common");
      const optionCount = group.options.length;
      return group.options.map((option, index) => `<tr class="perk-builder-row ${rarityClass}">
        ${index === 0 ? `<td class="perk-builder-tier" rowspan="${optionCount}"><span class="perk-builder-tier-name">${FH.escape(group.tier)}</span> ${renderReputationMark(group.rep)}</td>` : ""}
        <td class="perk-builder-option">${FH.escape(option.option)}</td>
        ${renderPerkBuilderPerkCells(option.cells)}
      </tr>`).join("");
    }).join("");
    const notes = data.notes.map((note) => `<li>${FH.escape(note).replace(/\{\{repMark\}\}/g, renderReputationMark("1/2"))}</li>`).join("");
    return `<div class="item-modal-header perk-builder-modal-header"><h2>${FH.escape(data.title)}</h2></div>
      <div class="perk-builder-modal perk-builder-table-mode">
        <p class="perk-builder-intro">${FH.escape(data.subtitle)}</p>
        <div class="table-wrap perk-builder-table-wrap">
          <table class="perk-builder-select-table">
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <aside class="perk-builder-notes">
          <strong>${FH.escape(data.notesTitle)}</strong>
          <ul>${notes}</ul>
        </aside>
      </div>`;
  };

  FH.openPerkBuilderTable = function () {
    const node = ensurePerkBuilderModal();
    const body = node.querySelector("#globalPerkBuilderModalBody");
    if (body) body.innerHTML = FH.renderPerkBuilderTable();
    node.classList.add("is-perk-builder-modal");
    FH.openDialog?.(node, node.querySelector(".modal-close"));
  };


  FH.scrollToHash = function () {
    const raw = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "";
    if (!raw) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(raw);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("is-hash-target");
      window.setTimeout(() => target.classList.remove("is-hash-target"), 1600);
    });
  };

  function initModalKeyboard() {
    if (document.documentElement.dataset.modalKeyboardReady === "true") return;
    document.documentElement.dataset.modalKeyboardReady = "true";
    document.addEventListener("keydown", (event) => {
      const node = document.querySelector(".modal.is-open");
      if (!node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        FH.closeDialog(node);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = FH.getFocusable(node);
      if (!focusable.length) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  FH.factionIcon = function (key) { return FH.asset(`assets/icons/factions/${key || "all"}.webp`); };
  FH.modeLabels = {
    Dominion: "Захват территорий", Duel: "Дуэль", Brawl: "Бойня",
    Breach: "Штурм", Skirmish: "Схватка", Elimination: "Устранение",
    Tribute: "Дань", Deathmatch: "Смертельная схватка"
  };
  FH.modeLabel = function (mode) { return FH.modeLabels[mode] ? FH.text(FH.modeLabels[mode]) : String(mode); };
  FH.rarityMeta = {
    common: { label: "Обычный", className: "rarity-common" },
    rare: { label: "Редкий", className: "rarity-rare" },
    heroic: { label: "Героический", className: "rarity-heroic" },
    epic: { label: "Эпический", className: "rarity-epic" },
    legendary: { label: "Легендарный", className: "rarity-legendary" }
  };
  FH.perkTypeLabels = {
    attack: "Нападение", defense: "Защита", support: "Поддержка"
  };
  FH.byId = function (items, id) {
    return (items || []).find((item) => item.id === id) || null;
  };

  FH.featById = function (id) { return FH.byId(FH_DATA.feats, id); };
  FH.perkById = function (id) { return FH.byId(FH_DATA.perks, id); };
  FH.heroById = function (id) { return FH.byId(FH_DATA.heroes, id) || FH.byId(FH_DATA.heroCatalog, id); };
  FH.heroType = function (hero) { return hero?.type || ""; };

  FH.heroFeatRefs = function (hero) {
    if (Array.isArray(hero?.feats) && hero.feats.length) {
      return hero.feats.map((feat) => typeof feat === "string" ? { id: feat } : feat).filter(Boolean);
    }
    return (hero?.featIds || []).map((id) => ({ id }));
  };

  FH.heroFeatIds = function (hero) {
    return FH.heroFeatRefs(hero).map((feat) => feat.id || FH.slug(feat.name)).filter(Boolean);
  };

  FH.heroFeatItems = function (hero) {
    const catalog = new Map(FH.collectFeats().map((feat) => [feat.id, feat]));
    return FH.heroFeatRefs(hero).map((ref) => {
      const feat = catalog.get(ref.id);
      return feat ? { ...feat, recommendation: ref.recommendation || null } : null;
    }).filter(Boolean);
  };

  FH.heroPerkIds = function (hero) {
    if (Array.isArray(hero?.perkIds)) return hero.perkIds;
    return (hero?.perks || []).map((perk) => perk.id || FH.slug(perk.name));
  };

  FH.heroPerkRarity = function (hero, perkId) {
    return hero?.perkRarities?.[perkId]
      || (hero?.perks || []).find((perk) => perk.id === perkId)?.rarity
      || FH.perkById(perkId)?.rarity
      || "common";
  };

  FH.heroPerkItems = function (hero) {
    const catalog = new Map(FH.collectPerks().map((perk) => [perk.id, perk]));
    return FH.heroPerkIds(hero).map((id) => {
      const perk = catalog.get(id);
      if (!perk) return null;
      const heroRarity = FH.heroPerkRarity(hero, id);
      const ref = (hero?.perks || []).find((item) => item.id === id) || {};
      return {
        ...perk,
        heroRarity,
        rarity: heroRarity,
        catalogRarity: perk.catalogRarity || perk.pageRarity || perk.rarity || "common",
        recommendation: ref.recommendation || null
      };
    }).filter(Boolean);
  };

  FH.collectFeats = function () {
    const usage = new Map();
    Object.entries(window.FHX_AVAILABILITY?.feats || {}).forEach(([id, heroes]) => usage.set(id, heroes));
    if (!usage.size) {
      (FH_DATA.heroes || []).forEach((hero) => {
        FH.heroFeatIds(hero).forEach((id) => {
          if (!usage.has(id)) usage.set(id, []);
          usage.get(id).push(hero.name);
        });
      });
    }
    return (FH_DATA.feats || []).map((feat) => {
      const typeText = FH.text(feat.type).toLowerCase();
      return {
        ...feat,
        heroes: usage.get(feat.id) || [],
        kind: typeText.includes("пасс") || typeText.includes("passive") ? "passive" : "active",
        rating: feat.rating || "Временная оценка. Рекомендации будут заполнены отдельно."
      };
    });
  };

  FH.collectPerks = function () {
    const usage = new Map();
    Object.entries(window.FHX_AVAILABILITY?.perks || {}).forEach(([id, heroes]) => usage.set(id, heroes));
    if (!usage.size) {
      (FH_DATA.heroes || []).forEach((hero) => {
        FH.heroPerkIds(hero).forEach((id) => {
          if (!usage.has(id)) usage.set(id, []);
          usage.get(id).push(hero.name);
        });
      });
    }
    return (FH_DATA.perks || []).map((perk) => ({
      ...perk,
      heroes: usage.get(perk.id) || [],
      heroRarity: perk.heroRarity || perk.rarity || "common",
      catalogRarity: perk.catalogRarity || perk.pageRarity || perk.rarity || "common",
      rating: perk.rating || "Зависит от режима и стиля игры."
    }));
  };


  function initMenu() {
    const burger = document.getElementById("burger");
    const nav = document.getElementById("siteNav");
    if (!burger || !nav) return;
    function prepareMobileGroups() {
      if (!window.matchMedia("(max-width: 1160px)").matches) return;
      const groups = [...nav.querySelectorAll("[data-nav-group]")];
      const hasUserState = groups.some((group) => group.dataset.mobileTouched === "true");
      if (hasUserState) return;
      groups.forEach((group) => {
        const open = group.classList.contains("is-active");
        group.classList.toggle("is-open", open);
        group.querySelector("[data-nav-group-toggle]")?.setAttribute("aria-expanded", String(open));
      });
    }

    function toggleNavGroup(group) {
      if (!group) return;
      const open = !group.classList.contains("is-open");
      group.dataset.mobileTouched = "true";
      group.classList.toggle("is-open", open);
      group.querySelector("[data-nav-group-toggle]")?.setAttribute("aria-expanded", String(open));
    }

    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      document.body.classList.toggle("menu-open", open);
      document.documentElement.classList.toggle("menu-open", open);
      if (open) prepareMobileGroups();
    });
    function closeMenu() {
      nav.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
      document.body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
    }
    nav.addEventListener("click", (event) => {
      const mobile = window.matchMedia("(max-width: 1160px)").matches;
      const groupToggle = event.target.closest("[data-nav-group-toggle]");
      const groupMainLink = event.target.closest(".nav-link-main");
      const groupHead = event.target.closest(".nav-group-head");
      const mobileGroup = (groupToggle || groupMainLink || groupHead)?.closest?.("[data-nav-group]");
      if (mobile && mobileGroup) {
        event.preventDefault();
        event.stopPropagation();
        toggleNavGroup(mobileGroup);
        return;
      }
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (event.target.closest("#siteNav") || event.target.closest("#burger")) return;
      closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }
  function initGlobalSearch() {
    const input = document.getElementById("globalSearch");
    const results = document.getElementById("globalSearchResults");
    if (!input || !results) return;

    const aliases = {
      gb: ["guard break", "захват", "гб"],
      "гб": ["guard break", "gb", "захват"],
      oos: ["out of stamina", "без выносливости", "оос"],
      "оос": ["out of stamina", "oos", "без выносливости"],
      bash: ["толчок", "shield bash", "shoulder bash"],
      parry: ["парирование", "парри"],
      "парри": ["parry", "парирование"],
      revenge: ["месть", "антиганк"],
      "месть": ["revenge", "антиганк"],
      heal: ["лечение", "remedy", "execution"],
      "лечение": ["heal", "remedy", "добивание"]
    };

    const normalize = (value) => String(value || "").toLowerCase().replace(/ё/g, "е").trim();
    const tokenize = (value) => normalize(value).split(/\s+/).filter(Boolean);
    const expandQuery = (query) => {
      const tokens = tokenize(query);
      const expanded = new Set(tokens);
      tokens.forEach((token) => (aliases[token] || []).forEach((alias) => tokenize(alias).forEach((part) => expanded.add(part))));
      return [...expanded];
    };
    const highlight = (text, tokens) => {
      const safe = FH.escape(text);
      const main = tokens.filter((token) => token.length > 1).sort((a, b) => b.length - a.length)[0];
      if (!main) return safe;
      const pattern = new RegExp(`(${main.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      return safe.replace(pattern, "<mark>$1</mark>");
    };
    const makeIndex = () => {
      const fromFile = FH_DATA.searchIndex || [];
      if (fromFile.length) {
        return fromFile.map((item) => ({
          title: FH.text(item.title),
          type: item.type || FH.text(item.type),
          url: FH.pagePath(item.url),
          text: [FH.text(item.title), FH.text(item.type), FH.text(item.text)].join(" ")
        })).map((item) => ({ ...item, haystack: normalize(`${item.title} ${item.type} ${item.text}`) }));
      }

      const items = [];
      FH_DATA.heroes?.forEach((hero) => items.push({ title: FH.text(hero.name), type: "Персонажи", url: FH.pagePath(`hero.html?id=${encodeURIComponent(hero.id)}`), text: [FH.text(hero.name), FH.text(hero.faction), FH.text(FH.heroType(hero)), FH.text(hero.summary), ...(hero.strengths || []).map(FH.text), ...(hero.counterTips || []).map(FH.text)].join(" ") }));
      FH_DATA.maps?.forEach((map) => items.push({ title: FH.text(map.name), type: "Карты", url: FH.pagePath(`map.html?id=${encodeURIComponent(map.id)}`), text: [FH.text(map.name), FH.text(map.description), ...(map.modes || []).map(FH.modeLabel)].join(" ") }));
      FH_DATA.mechanics?.forEach((mechanic) => items.push({ title: mechanic.name, type: "Механики", url: FH.pagePath(`mechanic.html?id=${encodeURIComponent(mechanic.id)}`), text: [mechanic.name, FH.text(mechanic.short), FH.text(mechanic.description), FH.text(mechanic.example)].join(" ") }));
      FH_DATA.terminology?.forEach((term) => items.push({ title: FH.text(term.term), type: "Терминология", url: FH.pagePath("terminology.html") + `#term-${term.id || FH.slug(FH.text(term.term))}`, text: [FH.text(term.term), term.term, FH.text(term.description), FH.text(term.full)].join(" ") }));
      (window.FH_MOVE_GLOSSARY || []).forEach((item) => items.push({ title: FH.text(item.name), type: "Глоссарий", url: FH.pagePath("glossary.html") + `#${item.id}`, text: [FH.text(item.name), FH.text(item.description)].join(" ") }));
      FH.collectFeats().forEach((feat) => items.push({ title: FH.text(feat.name), type: "Способности", url: FH.pagePath("feats.html") + `#${feat.id}`, text: [FH.text(feat.name), FH.text(feat.description), feat.level, ...(feat.heroes || []).map(FH.text)].join(" ") }));
      FH.collectPerks().forEach((perk) => items.push({ title: FH.text(perk.name), type: "Перки", url: FH.pagePath("perks.html") + `#${perk.id}`, text: [FH.text(perk.name), FH.text(perk.description), FH.text(perk.effect), FH.text(FH.rarityMeta[perk.rarity]?.label), FH.text(FH.perkTypeLabels[perk.perkType]), ...(perk.heroes || []).map(FH.text)].join(" ") }));
      (FH_DATA.executions || []).forEach((execution) => items.push({ title: FH.text(execution.name), type: "Добивания", url: FH.pagePath("executions.html") + `#${execution.id}`, text: [FH.text(execution.name), FH.text(execution.description), execution.heal, execution.killTime].join(" ") }));
      items.push({ title: "Сравнение героев", type: "Сравнение", url: FH.pagePath("compare.html"), text: ["Сравнение героев", "Выбери двух героев и сравни только характеристики, способности и перки.", "compare сравнение героев"].join(" ") });
      items.push({ title: "Подбор перков", type: "Подбор перков", url: FH.pagePath("build.html"), text: ["Подбор перков", "Выбери героя и уровень экипировки, затем собери только допустимую комбинацию перков.", "подбор перков perk picker экипировка"].join(" ") });
      items.push({ title: "Патчноуты", type: "Патчноуты", url: FH.pagePath("patchnotes.html"), text: ["Патчноуты", "Полное описание изменений", "герои баланс обновления патч"].join(" ") });
      items.push({ title: "Кто держит щит проекта", type: "О нас", url: `${FH.pagePath("about.html")}#project-shield`, text: ["Кто держит щит проекта", "Помощники и источники проверки данных", ...(FH_DATA.helpers || []).flatMap((helper) => [FH.text(helper.name), FH.text(helper.role), FH.text(helper.description), FH.text(helper.contribution)])].join(" ") });
      return items.map((item) => ({ ...item, haystack: normalize(`${item.title} ${item.type} ${item.text}`) }));
    };
    let index = makeIndex();
    let activeIndex = -1;
    const render = () => {
      const query = input.value.trim();
      const directTokens = tokenize(query);
      const tokens = expandQuery(query);
      activeIndex = -1;
      if (query.length < 2) { results.hidden = true; results.innerHTML = ""; return; }
      const found = index
        .map((item) => ({ item, score: tokens.reduce((sum, token) => sum + (item.haystack.includes(token) ? (item.haystack.startsWith(token) ? 5 : 2) : 0), 0) }))
        .filter((entry) => entry.score > 0 && directTokens.every((token) => entry.item.haystack.includes(token) || Object.keys(aliases).includes(token)))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((entry) => entry.item);
      results.innerHTML = found.length ? found.map((item) => `<a class="global-result" href="${FH.escape(item.url)}"><span>${FH.escape(item.type)}</span><strong>${highlight(item.title, tokens)}</strong></a>`).join("") : `<div class="global-result is-empty">${FH.escape("Ничего не найдено")}</div>`;
      results.hidden = false;
    };
    const moveActive = (direction) => {
      const links = [...results.querySelectorAll("a")];
      if (!links.length) return;
      activeIndex = (activeIndex + direction + links.length) % links.length;
      links.forEach((link, index) => link.classList.toggle("is-active", index === activeIndex));
      links[activeIndex].scrollIntoView({ block: "nearest" });
    };
    input.addEventListener("input", render);
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); moveActive(1); }
      if (event.key === "ArrowUp") { event.preventDefault(); moveActive(-1); }
      if (event.key === "Enter") {
        const links = [...results.querySelectorAll("a")];
        const target = activeIndex >= 0 ? links[activeIndex] : links[0];
        if (target) location.href = target.href;
      }
      if (event.key === "Escape") { input.value = ""; results.hidden = true; }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && document.activeElement !== input && !event.target.closest("input, textarea, select")) {
        event.preventDefault();
        input.focus();
      }
    });
    document.addEventListener("click", (event) => { if (!event.target.closest(".global-search")) results.hidden = true; });
    render();
  }



  FH.parseVideoSources = function (raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") return [{ id: "youtube", label: "YouTube", url: raw }];
    return [raw];
  };

  function ensureVideoPlayer() {
    let modal = document.getElementById("fhVideoPlayerModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "fhVideoPlayerModal";
    modal.className = "modal video-player-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `<div class="modal-backdrop" data-video-close></div>
      <article class="video-player-shell" role="dialog" aria-modal="true" aria-label="Видеоплеер">
        <div class="video-player-topbar">
          <div class="video-source-tabs" id="fhVideoSources"></div>
          <button class="modal-close video-player-close" type="button" data-video-close aria-label="Закрыть">×</button>
        </div>
        <div class="video-player-card">
          <div class="video-player-frame" id="fhVideoFrame"></div>
        </div>
      </article>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (!event.target.closest("[data-video-close]")) return;
      FH.closeVideoPlayer();
    });
    return modal;
  }

  FH.openVideoPlayer = function (config = {}) {
    const modal = ensureVideoPlayer();
    const tabs = document.getElementById("fhVideoSources");
    const frame = document.getElementById("fhVideoFrame");
    const sources = FH.parseVideoSources(config.sources || config.url);
    if (!sources.length || !frame || !tabs) return;
    let active = 0;
    const render = () => {
      const source = sources[active] || sources[0];
      tabs.innerHTML = sources.map((item, index) => `<button class="video-source-tab${index === active ? " is-active" : ""}" type="button" data-video-source-index="${index}">${FH.escape(item.label || item.id || `Плеер ${index + 1}`)}</button>`).join("");
      frame.innerHTML = `<iframe src="${FH.escape(source.url)}" title="${FH.escape(config.title || source.label || "Видео")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    };
    tabs.onclick = (event) => {
      const button = event.target.closest("[data-video-source-index]");
      if (!button) return;
      active = Number(button.dataset.videoSourceIndex) || 0;
      render();
    };
    render();
    FH.openDialog?.(modal);
  };

  FH.closeVideoPlayer = function () {
    const modal = document.getElementById("fhVideoPlayerModal");
    const frame = document.getElementById("fhVideoFrame");
    if (frame) frame.innerHTML = "";
    FH.closeDialog?.(modal);
  };

  function initVideoCards() {
    if (document.documentElement.dataset.videoCardsReady === "true") return;
    document.documentElement.dataset.videoCardsReady = "true";
    document.addEventListener("click", (event) => {
      const card = event.target.closest("[data-video-sources]");
      if (!card) return;
      event.preventDefault();
      let sources = [];
      try { sources = JSON.parse(card.dataset.videoSources || "[]"); } catch (error) { sources = []; }
      FH.openVideoPlayer({ title: card.dataset.videoTitle || card.textContent.trim(), sources });
    });
  }
  function initPatchnotesSlider() {
    const AUTOPLAY_DELAY = 5000;

    document.querySelectorAll("[data-patchnotes-slider]").forEach((slider) => {
      if (slider.dataset.patchnotesReady === "true") return;
      slider.dataset.patchnotesReady = "true";
      const slides = [...slider.querySelectorAll("[data-patchnote-slide]")];
      const dots = [...slider.querySelectorAll("[data-patchnote-dot]")];
      if (!slides.length) return;

      let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
      let autoplayId = null;

      const show = (next) => {
        index = (next + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
        dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
      };

      const stopAutoplay = () => {
        if (!autoplayId) return;
        window.clearInterval(autoplayId);
        autoplayId = null;
      };

      const startAutoplay = () => {
        if (slides.length < 2 || autoplayId) return;
        autoplayId = window.setInterval(() => show(index + 1), AUTOPLAY_DELAY);
      };

      const showManually = (next) => {
        show(next);
        stopAutoplay();
        startAutoplay();
      };

      slider.querySelector("[data-patchnotes-prev]")?.addEventListener("click", () => showManually(index - 1));
      slider.querySelector("[data-patchnotes-next]")?.addEventListener("click", () => showManually(index + 1));
      dots.forEach((dot) => dot.addEventListener("click", () => showManually(Number(dot.dataset.patchnoteDot) || 0)));
      slider.addEventListener("mouseenter", stopAutoplay);
      slider.addEventListener("mouseleave", startAutoplay);
      slider.addEventListener("focusin", stopAutoplay);
      slider.addEventListener("focusout", startAutoplay);
      document.addEventListener("visibilitychange", () => (document.hidden ? stopAutoplay() : startAutoplay()));
      startAutoplay();
    });
  }


  function initHeaderScrollState() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initBackTop() {
    let button = document.getElementById("backTopFloating");
    if (!button) {
      button = document.createElement("button");
      button.id = "backTopFloating";
      button.className = "back-top-floating";
      button.type = "button";
      button.setAttribute("aria-label", "Наверх");
      button.innerHTML = "↑";
      document.body.appendChild(button);
    }
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    const update = () => button.classList.toggle("is-visible", window.scrollY > 260);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }
  function initReveal() {
    const nodes = [...document.querySelectorAll(".reveal")];
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) { nodes.forEach((node) => node.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
  }
  function init() {
    initModalKeyboard();
    initMenu();
    initGlobalSearch();
    initHeaderScrollState();
    initPatchnotesSlider();
    initVideoCards();
    initReveal();
    initBackTop();
    window.addEventListener("hashchange", () => FH.scrollToHash?.());
  }
  document.addEventListener("DOMContentLoaded", init);
})();
