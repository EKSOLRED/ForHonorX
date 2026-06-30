(function () {
  const qs = new URLSearchParams(location.search);
  let leftId = qs.get("left") || "warden";
  let rightId = qs.get("right") || "raider";
  const numberLocale = () => "ru-RU";

  function esc(value) { return FH.escape(value); }
  function text(value) { return FH.text(value); }
  function fmt(value, digits = 2) {
    if (value === null || value === undefined || value === "") return "—";
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString(numberLocale(), { maximumFractionDigits: digits }) : String(value);
  }
  function unitSpeed() { return " м/с"; }
  function unitMs() { return " мс"; }
  function heroSearchText(hero) { return [text(hero.name), text(hero.faction), text(FH.heroType(hero)), text(hero.summary), hero.id].join(" ").toLowerCase(); }
  function statDefs() {
    return [
      { key: "type", label: "Тип", kind: "text" },
      { key: "health", label: "Здоровье", kind: "number", unit: "", digits: 0 },
      { key: "stamina", label: "Выносливость", kind: "number", unit: "", digits: 0 },
      { key: "dodgeDefenseType", label: "Тип защиты в увороте", kind: "text" },
      { key: "defaultGuardSide", label: "Стандартная сторона защиты", kind: "text" },
      { key: "offTargetEnhancedAttacks", label: "Усиленные атаки вне цели", kind: "text" },
      { key: "sprintSpeed", label: "Скорость спринта", kind: "number", unit: unitSpeed() },
      { key: "superSprintSpeed", label: "Скорость суперспринта", kind: "number", unit: unitSpeed(), optional: true },
      { key: "guardWalkSpeed.forward", label: "Ходьба вперёд", kind: "number", unit: unitSpeed() },
      { key: "guardWalkSpeed.side", label: "Ходьба в сторону", kind: "number", unit: unitSpeed() },
      { key: "guardWalkSpeed.backward", label: "Ходьба назад", kind: "number", unit: unitSpeed() },
      { key: "stanceWalkSpeed.forward", label: "Стойка вперёд", kind: "number", unit: unitSpeed(), optional: true },
      { key: "stanceWalkSpeed.side", label: "Стойка в сторону", kind: "number", unit: unitSpeed(), optional: true },
      { key: "stanceWalkSpeed.backward", label: "Стойка назад", kind: "number", unit: unitSpeed(), optional: true },
      { key: "forwardDodgeRecovery", label: "Восстановление уворота вперёд", kind: "number", unit: unitMs(), digits: 0 }
    ];
  }
  function getValue(hero, key) {
    return String(key).split(".").reduce((acc, part) => acc?.[part], hero);
  }
  function hasValue(value) {
    if (value && typeof value === "object") value = text(value);
    const text = String(value ?? "").trim();
    return text && text !== "—" && text !== "-";
  }
  function visibleStats(hero, other) {
    return statDefs().filter((stat) => !stat.optional || hasValue(getValue(hero, stat.key)) || hasValue(getValue(other, stat.key)));
  }
  function displayValue(hero, stat) {
    const value = getValue(hero, stat.key);
    if (stat.kind === "text") return esc(text(value) || "—");
    return `${esc(fmt(value, stat.digits ?? 2))}${esc(stat.unit || "")}`;
  }
  function delta(current, other, stat) {
    const a = Number(current);
    const b = Number(other);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return "";
    const value = a - b;
    const cls = value > 0 ? "delta-positive" : "delta-negative";
    const sign = value > 0 ? "+" : "";
    return ` <span class="stat-delta ${cls}">(${sign}${esc(fmt(value, stat.digits ?? 2))}${esc(stat.unit || "")})</span>`;
  }
  function heroPicker(side, hero, label) {
    return `<div class="hero-picker compare-picker" data-hero-picker data-side="${esc(side)}">
      <span class="hero-picker-label">${esc(label)}</span>
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
  function statCards(hero, other, showDelta) {
    return `<div class="compare-stats">${visibleStats(hero, other).map((stat) => {
      const value = getValue(hero, stat.key);
      const otherValue = getValue(other, stat.key);
      const sameText = stat.kind === "text" && text(value) && text(value) === text(otherValue);
      return `<div class="${sameText ? "is-shared-stat" : ""}"><span>${esc(stat.label)}</span><strong>${displayValue(hero, stat)}${showDelta && stat.kind === "number" ? delta(value, otherValue, stat) : ""}</strong></div>`;
    }).join("")}</div>`;
  }
  function tokenRow(items, otherIds) {
    return `<div class="mini-token-row compare-token-row">${items.map((item) => {
      const shared = otherIds.has(item.id);
      return `<span class="${shared ? "is-shared" : ""}">${esc(text(item.name))}</span>`;
    }).join("") || "—"}</div>`;
  }
  function heroColumn(hero, other, showDelta) {
    const feats = FH.heroFeatIds(hero).map(FH.featById).filter(Boolean);
    const perks = FH.heroPerkItems ? FH.heroPerkItems(hero) : FH.heroPerkIds(hero).map(FH.perkById).filter(Boolean);
    const otherFeatIds = new Set(FH.heroFeatIds(other));
    const otherPerkIds = new Set(FH.heroPerkIds(other));
    return `<article class="compare-card${showDelta ? " is-reference" : ""}">
      <div class="compare-portrait image-wrap">${FH.localImage(hero.image, text(hero.name))}</div>
      <h2>${esc(text(hero.name))}</h2>
      ${statCards(hero, other, showDelta)}
      <h3>${esc("Способности")}</h3>${tokenRow(feats, otherFeatIds)}
      <h3>${esc("Перки")}</h3>${tokenRow(perks, otherPerkIds)}
      <div class="compare-actions"><a class="btn btn-small" href="hero.html?id=${encodeURIComponent(hero.id)}">${esc("Профиль")}</a></div>
    </article>`;
  }
  function sharedItems(items, otherIds) {
    return items.filter((item) => otherIds.has(item.id));
  }
  function badgeList(items) {
    return `<span class="shared-badge-row">${items.map((item) => `<span class="shared-badge">${esc(text(item.name))}</span>`).join("") || `<span class="shared-badge is-empty">${esc("нет совпадений")}</span>`}</span>`;
  }
  function statVerdict(left, right) {
    const rows = visibleStats(left, right).map((stat) => {
      const lRaw = getValue(left, stat.key);
      const rRaw = getValue(right, stat.key);
      if (stat.kind === "text") {
        const l = text(lRaw);
        const r = text(rRaw);
        if (!l && !r) return "";
        if (l === r) return "";
        return `<div><span>${esc(stat.label)}</span><strong class="compare-text-diff"><span class="compare-left-value">${esc(l || "—")}</span><span aria-hidden="true">—</span><span class="compare-right-value">${esc(r || "—")}</span></strong></div>`;
      }
      const l = Number(lRaw);
      const r = Number(rRaw);
      if (!Number.isFinite(l) || !Number.isFinite(r)) return "";
      if (l === r) return "";
      const diff = l - r;
      const cls = diff > 0 ? "delta-positive" : "delta-negative";
      const word = diff > 0 ? "больше" : "меньше";
      const prefix = "На ";
      return `<div><span>${esc(stat.label)}</span><strong><span class="${cls}">${esc(prefix)}${esc(fmt(Math.abs(diff), stat.digits ?? 2))}${esc(stat.unit || "")} ${esc(word)}</span></strong></div>`;
    }).filter(Boolean);
    return rows.join("") || `<div><span>${esc("Быстрый вывод")}</span><strong>${esc("Одинаково")}</strong></div>`;
  }
  function verdict(left, right) {
    const leftFeats = FH.heroFeatIds(left).map(FH.featById).filter(Boolean);
    const leftPerks = FH.heroPerkItems ? FH.heroPerkItems(left) : FH.heroPerkIds(left).map(FH.perkById).filter(Boolean);
    const rightFeatIds = new Set(FH.heroFeatIds(right));
    const rightPerkIds = new Set(FH.heroPerkIds(right));
    const sharedFeats = sharedItems(leftFeats, rightFeatIds);
    const sharedPerks = sharedItems(leftPerks, rightPerkIds);
    return `<aside class="compare-verdict compare-verdict-rich">
      <h2>${esc("Быстрый вывод")}</h2>
      <div class="compare-verdict-grid">${statVerdict(left, right)}</div>
      <div class="shared-line"><strong>${esc("Общие способности")}</strong>${badgeList(sharedFeats)}</div>
      <div class="shared-line"><strong>${esc("Общие перки")}</strong>${badgeList(sharedPerks)}</div>
    </aside>`;
  }
  function render() {
    const root = document.getElementById("compareApp");
    if (!root) return;
    const heroes = FH_DATA.heroes || [];
    const left = FH.heroById(leftId) || heroes[0];
    const right = FH.heroById(rightId) || heroes[1] || heroes[0];
    leftId = left.id; rightId = right.id;
    root.innerHTML = `<div class="compare-controls hero-picker-controls">
      ${heroPicker("left", left, "Первый герой")}
      <div class="compare-swap-slot"><button class="btn btn-small btn-ghost compare-swap" type="button" data-swap-heroes>⇄ ${esc("Поменять")}</button></div>
      ${heroPicker("right", right, "Второй герой")}
    </div>
    <div class="compare-grid">${heroColumn(left, right, true)}${heroColumn(right, left, false)}</div>${verdict(left, right)}`;
  }
  function syncUrl() {
    const next = new URL(location.href);
    next.searchParams.set("left", leftId);
    next.searchParams.set("right", rightId);
    history.replaceState(null, "", next);
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
    const root = document.getElementById("compareApp");
    if (!root) return;
    root.addEventListener("click", (event) => {
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
        const side = option.closest("[data-hero-picker]")?.dataset.side;
        if (side === "left") leftId = option.dataset.heroOption;
        if (side === "right") rightId = option.dataset.heroOption;
        syncUrl(); closePickers(); render();
        return;
      }
      if (event.target.closest("[data-swap-heroes]")) {
        [leftId, rightId] = [rightId, leftId];
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
  document.addEventListener("DOMContentLoaded", init);
})();
