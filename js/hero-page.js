(function () {
  let tableId = 0;
  let modalReady = false;
  let activeHero = null;
  let activeMoves = [];
  let activeFeats = [];
  let activePerks = [];

  const moveIconAliases = {
    "Special.webp": "bulwark-counter",
    "Bash.png": "bash",
    "Unblockable.webp": "unblockable",
    "HyperArmor.webp": "hyper-armor",
    "Parry.webp": "parry",
    "SoftFint.webp": "soft-feint",
    "WallThrow.webp": "wall-throw",
    "SuperiorBlock.webp": "superior-block",
    "FullBlock.webp": "full-block",
    "Undodge.webp": "undodgeable",
    "Undodge.png": "undodgeable",
    "Bleed.png": "bleed",
    "Falling.webp": "falling",
    "SoulGain.png": "soul-gain",
    "LoseSouls.png": "lose-souls",
    "Stuns.svg": "stun",
    "ExsanguisLaceratrix.webp": "exsanguis-laceratrix",
    "Enhanced.webp": "enhanced",
    "Deflect.png": "deflect",
    "Trap.png": "trap"
  };
  function moveIconMeta(icon) {
    const id = moveIconAliases[icon] || String(icon || "").replace(/\.(webp|png|svg)$/i, "").toLowerCase();
    return (window.FH_MOVE_GLOSSARY || []).find((item) => item.id === id) || { id, icon, name: id, description: "" };
  }

  const voiceTranslationMap = {
    "Ad mortem inimicus!": "К смерти, враг!",
    "Incredibilis!": "Невероятно!",
    "Tenebris!": "Тьма!"
  };

  function esc(value) { return FH.escape(value); }
  function text(value) { return FH.text(value); }
  function numberValue(value) {
    const match = String(value ?? "").replace(",", ".").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }
  function fieldLabel(ru) { return ru; }
  const heroColumnLabels = { name: "Название", killTime: "Время до лечения", actionTime: "Длительность (Добивающий)", fullDuration: "Длительность (Жертва)", heal: "Лечение", ragdoll: "Эффект тряпичной куклы", availability: "Доступность", description: "Описание", situation: "Тип наказания", punish: "Инструкция", damage: "Урон", stamina: "Выносливость", comment: "Комментарий", combo: "Комбинация", type: "Тип", properties: "Свойства", level: "Уровень", effect: "Описание", original: "Оригинал", translation: "Перевод", context: "Контекст" };

  function tierListRank(heroId, listId) {
    const list = (FH_DATA.tierLists || []).find((item) => item.id === listId);
    if (!list) return null;
    const row = (list.rows || []).find((tier) => (tier.heroes || []).includes(heroId));
    if (!row) return null;
    return { mode: list.mode, label: row.label, color: row.color || "#6c5c4e" };
  }


  function tierRankDescription(label) {
    const key = String(label || "").trim().toUpperCase();
    const ru = { "S+": "Слишком сильный", S: "Очень сильный", A: "Сильный", B: "Средний", C: "Слабый", D: "Очень слабый" };
    return ru[key] || key || "—";
  }

  function heroTierRanks(heroId) {
    return [
      { id: "pro-4v4", short: "4x4" },
      { id: "pro-2v2", short: "2x2" },
      { id: "pro-1v1", short: "1x1" }
    ].map((entry) => ({ ...entry, rank: tierListRank(heroId, entry.id) }));
  }

  function renderHeroTierRanks(heroId) {
    return `<div class="hero-tier-ranks" aria-label="${esc("Тир листы")}">${heroTierRanks(heroId).map((entry) => {
      const rank = entry.rank;
      const label = rank ? text(rank.label) : "—";
      const color = rank ? rank.color : "#8e806e";
      const tooltip = rank ? tierRankDescription(label) : "—";
      return `<a class="hero-tier-rank fx-tooltip-source" href="tierlists.html#${esc(entry.id)}" style="--rank-color:${esc(color)}" aria-label="${esc(tooltip)}"><span class="hero-tier-mode">${esc(entry.short)}</span><strong>${esc(label)}</strong><span class="fx-tooltip hero-rank-tooltip" role="tooltip">${esc(tooltip)}</span></a>`;
    }).join("")}</div>`;
  }
  function textList(items) {
    const list = (items || []).map((item) => text(item)).filter(Boolean);
    return list.length ? `<ul class="insight-list">${list.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : FH.empty();
  }
  function renderHeroDescription(hero) {
    const summary = text(hero.uniqueDescription || hero.description || hero.summary);
    if (!summary) return "";
    return `<article class="hero-identity-summary">
      <p class="eyebrow">${esc(fieldLabel("Кратко о персонаже"))}</p>
      <p>${esc(summary)}</p>
    </article>`;
  }
  function fmtNumber(value, digits = 2) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    const locale = "ru-RU";
    return num.toLocaleString(locale, { maximumFractionDigits: digits });
  }
  function speedValue(value) {
    const unit = "м/с";
    return `${fmtNumber(value)} ${unit}`;
  }
  function msValue(value) {
    const unit = "мс";
    return `${fmtNumber(value, 0)} ${unit}`;
  }
  function backIcon() {
    return `<svg class="back-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5M9 12h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  }
  function verifiedBadge(textKey = "contributorsPage.confirmedBy", sourceIds = null) {
    const allHelpers = FH_DATA.helpers || [];
    const selected = Array.isArray(sourceIds) && sourceIds.length
      ? sourceIds.map((id) => allHelpers.find((helper) => helper.id === id)).filter(Boolean)
      : allHelpers.filter((helper) => helper.verified).slice(0, 3);
    if (!selected.length) return "";
    const sourceLabels = { "contributorsPage.confirmedBy": "Подтверждено профессиональными игроками", "contributorsPage.verified": "Подтверждают игровые советы", "contributorsPage.support": "Помогают проекту" };
    const prefix = esc(sourceLabels[textKey] || textKey);
    const links = selected.map((helper) => `<a href="${FH.pagePath("about.html")}#${esc(helper.id)}">${esc(text(helper.name))}</a>`).join('<span aria-hidden="true"> · </span>');
    return `<span class="verified-source" tabindex="0" aria-label="${prefix}">
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="m12 3 2.35 5.1 5.58.66-4.12 3.8 1.1 5.48L12 15.27 7.09 18.04l1.1-5.48-4.12-3.8 5.58-.66L12 3Z"></path></svg>
      <span class="verified-tooltip" role="tooltip"><strong>${prefix}</strong><span>${links}</span></span>
    </span>`;
  }
  function insightTitle(title) {
    return `<h3 class="insight-title"><span>${esc(title)}</span>${verifiedBadge()}</h3>`;
  }
  function recommendedBadge(recommendation) {
    const sources = recommendation?.sourceIds || recommendation?.sources || recommendation?.reviewerIds || null;
    return verifiedBadge("Рекомендовано профессионалами", sources);
  }
  function recommendationFromItem(item) {
    const rec = item?.recommendation;
    return rec?.enabled ? rec : null;
  }
  function statCard(labelText, value, extra = "") {
    return `<div class="stat-card ${extra}"><span>${esc(labelText)}</span><strong>${esc(value)}</strong></div>`;
  }
  function statCardIf(labelText, value, extra = "") {
    return isFilledStat(value) ? statCard(labelText, value, extra) : "";
  }
  function genderTags(hero) {
    const items = (hero.gender || []).map((item) => text(item)).filter(Boolean);
    if (!items.length) return "";
    return `<div class="hero-gender-tags" aria-label="${esc("Гендер")}">${items.map((item) => `<span>${esc(item)}</span>`).join("")}</div>`;
  }
  function statCardWalk(hero) {
    const walk = hero.guardWalkSpeed || {};
    if (![walk.forward, walk.side, walk.backward].some(isFilledStat)) return "";
    return `<div class="stat-card stat-card-wide">
      <span>${esc(fieldLabel("Скорость ходьбы в оборонительном режиме"))}</span>
      <div class="stat-subgrid">
        <div><small>${esc(fieldLabel("Вперёд"))}</small><strong>${esc(isFilledStat(walk.forward) ? speedValue(walk.forward) : "—")}</strong></div>
        <div><small>${esc(fieldLabel("В сторону"))}</small><strong>${esc(isFilledStat(walk.side) ? speedValue(walk.side) : "—")}</strong></div>
        <div><small>${esc(fieldLabel("Назад"))}</small><strong>${esc(isFilledStat(walk.backward) ? speedValue(walk.backward) : "—")}</strong></div>
      </div>
    </div>`;
  }
  function statCardStanceWalk(hero) {
    const walk = hero.stanceWalkSpeed || {};
    if (![walk.forward, walk.side, walk.backward].some(isFilledStat)) return "";
    return `<div class="stat-card stat-card-wide">
      <span>${esc(fieldLabel("Скорость ходьбы в стойке"))}</span>
      <div class="stat-subgrid">
        <div><small>${esc(fieldLabel("Вперёд"))}</small><strong>${esc(isFilledStat(walk.forward) ? speedValue(walk.forward) : "—")}</strong></div>
        <div><small>${esc(fieldLabel("В сторону"))}</small><strong>${esc(isFilledStat(walk.side) ? speedValue(walk.side) : "—")}</strong></div>
        <div><small>${esc(fieldLabel("Назад"))}</small><strong>${esc(isFilledStat(walk.backward) ? speedValue(walk.backward) : "—")}</strong></div>
      </div>
    </div>`;
  }
  function overviewStats(hero) {
    const items = [
      [fieldLabel("Тип"), text(FH.heroType(hero))],
      [fieldLabel("Здоровье"), fmtNumber(hero.health, 0)],
      [fieldLabel("Выносливость"), fmtNumber(hero.stamina, 0)],
      [fieldLabel("Тип защиты в увороте"), text(hero.dodgeDefenseType)],
      [fieldLabel("Стандартная сторона защиты"), text(hero.defaultGuardSide)],
      [fieldLabel("Усиленные атаки вне цели"), text(hero.offTargetEnhancedAttacks)],
      [fieldLabel("Скорость спринта"), isFilledStat(hero.sprintSpeed) ? speedValue(hero.sprintSpeed) : ""]
    ];
    if (isFilledStat(hero.superSprintSpeed)) items.push([fieldLabel("Скорость суперспринта"), speedValue(hero.superSprintSpeed)]);
    return `${items.map(([label, value]) => statCardIf(label, value)).join("")}${statCardWalk(hero)}${statCardStanceWalk(hero)}${statCardIf(fieldLabel("Восстановление после уворота вперёд"), isFilledStat(hero.forwardDodgeRecovery) ? msValue(hero.forwardDodgeRecovery) : "", "stat-card-wide")}`;
  }
  function moveIcon(move) {
    const moveText = `${text(move.type)} ${text(move.properties)} ${text(move.name)}`.toLowerCase();
    if (moveText.includes("unblock") || moveText.includes("неблок")) return "Unblockable.webp";
    if (moveText.includes("hyper") || moveText.includes("armor") || moveText.includes("брон")) return "HyperArmor.webp";
    if (moveText.includes("parry") || moveText.includes("парир") || moveText.includes("counter") || moveText.includes("контр")) return "Parry.webp";
    if (moveText.includes("soft") || moveText.includes("софт")) return "SoftFint.webp";
    if (moveText.includes("wall") || moveText.includes("стен")) return "WallThrow.webp";
    if (moveText.includes("block") || moveText.includes("блок")) return "SuperiorBlock.webp";
    return "Special.webp";
  }
  function isFilledStat(value) {
    const text = String(value ?? "").trim();
    return text && text !== "—" && text !== "-";
  }
  function statField(labelText, value, extraClass = "") {
    if (!isFilledStat(value)) return "";
    return `<div class="ability-stat ${extraClass}"><span>${esc(labelText)}</span><strong>${esc(value)}</strong></div>`;
  }
  function featKindLabel(feat) {
    return feat.kind === "passive" ? "Пассивная" : "Активная";
  }
  function featKindClass(feat) {
    return feat?.kind === "passive" ? "is-passive" : "is-active";
  }
  const punishmentTypes = [
    { value: "Light Parry", label: "Парирование лёгкой атаки" },
    { value: "Heavy Parry", label: "Парирование тяжёлой атаки" },
    { value: "Guard Break", label: "Пробитие защиты" },
    { value: "Wall Throw", label: "Бросок в стену" },
    { value: "OOS Parry", label: "Парирование без выносливости" },
    { value: "OOS Throw", label: "Бросок без выносливости" },
    { value: "Revenge Auto Parry", label: "Автопарирование яростью" },
    { value: "Opponent Out-of-Lock", label: "Противник вне захвата цели" },
    { value: "OOS + Out-of-Lock", label: "Без выносливости + вне захвата цели" },
    { value: "Deflect/Superior Block Dodge", label: "Дефлект/Надежная защита в увороте" },
    { value: "Others", label: "Другое" }
  ];
  function normalizePunishmentType(value) {
    const raw = String(value || "").trim();
    if (raw === "Other Punishes" || raw === "Other Punish" || raw === "Other") return "Others";
    return raw;
  }
  function situationLabel(value) {
    if (value && typeof value === "object") return text(value);
    const raw = normalizePunishmentType(value);
    const found = punishmentTypes.find((item) => item.value.toLowerCase() === raw.toLowerCase());
    if (found) return found.label;
    return raw;
  }
  function punishmentSituationFilterValues() {
    return punishmentTypes.map((item) => ({
      value: item.label,
      label: item.label
    }));
  }
  function videoSources() {
    return [
      { id: "youtube", label: "YouTube", url: "https://www.youtube.com/embed/B0WG3KKQwI0" },
      { id: "rutube", label: "RuTube", url: "https://rutube.ru/play/embed/00000000000000000000000000000000" }
    ];
  }
  function videoCard(video) {
    const title = text(video.title || video.name || video.label || "Видео");
    const sources = Array.isArray(video.sources) && video.sources.length ? video.sources : videoSources();
    return `<button class="guide-video-card" type="button" data-video-title="${esc(title)}" data-video-sources='${esc(JSON.stringify(sources))}'>
      <span class="guide-video-thumb"><span>▶</span></span>
      <strong>${esc(title)}</strong>
    </button>`;
  }
  function filterHeader(label, key, values, attrPrefix) {
    return `<th class="th-filter" data-key="${esc(key)}">
      <button class="th-filter-btn" type="button" data-${attrPrefix}-toggle>
        <span>${label}</span>
        <svg class="heal-filter-arrow" aria-hidden="true" viewBox="0 0 16 16" focusable="false">
          <path d="M4.5 6.25 8 9.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>
      <div class="heal-filter-menu" hidden>
        <button class="heal-filter-reset" type="button" data-${attrPrefix}-reset>${esc(fieldLabel("Сбросить"))}</button>
        ${values.map((value) => `<label class="heal-filter-option"><input type="checkbox" value="${esc(value.value)}" data-${attrPrefix}-choice> <span>${esc(value.label)}</span></label>`).join("")}
      </div>
    </th>`;
  }
  function sortableHeader(column, options = {}, filterValues = {}) {
    const label = esc(heroColumnLabels[column.key] || column.key);
    if (options.voiceTranslationToggle && column.key === "translation") {
      return `<th>${label}</th>`;
    }
    if (options.healFilter && column.key === "heal") {
      return filterHeader(label, "heal", filterValues.heal || [], "heal");
    }
    if (options.situationFilter && column.key === "situation") {
      return filterHeader(label, "situation", filterValues.situation || [], "situation");
    }
    return `<th><button class="th-sort" type="button" data-sort-index="${column.index}" data-sort-type="${column.type || "text"}">${label}<span class="sort-arrow-one" aria-hidden="true"></span></button></th>`;
  }
  function voiceTranslation(rowData) {
    const original = String(rowData.original || "");
    const mapped = voiceTranslationMap[original] || "";
    const raw = rowData.translation;
    return String(text(raw) || mapped || "");
  }

  function voiceLineAudio(line) {
    return line?.audio || line?.audioUrl || "";
  }
  function voiceSets(hero) {
    const data = hero?.voice;
    if (Array.isArray(data)) {
      return [{
        id: "default",
        name: hero?.name || "Озвучка",
        language: "Оригинал",
        lines: data
      }];
    }
    if (data && Array.isArray(data.sets)) return data.sets;
    if (data && Array.isArray(data.variants)) return data.variants;
    return [];
  }
  function voiceOriginalMarkup(line) {
    const original = line?.original;
    if (original && typeof original === "object") {
      const script = original.text || original.script || original.native || "";
      const romanization = original.romanization || original.transcription || original.translit || "";
      const cyrillic = original.cyrillic || "";
      return `<div class="voice-original"><strong>${esc(text(script) || script)}</strong>${romanization ? `<span>${esc(text(romanization) || romanization)}</span>` : ""}${cyrillic ? `<span>${esc(text(cyrillic) || cyrillic)}</span>` : ""}</div>`;
    }
    return `<div class="voice-original"><strong>${esc(original || "—")}</strong></div>`;
  }
  function voiceLineNote(line) {
    return text(line?.note || line?.addition || line?.context);
  }
  function voiceLineSection(line) {
    return text(line?.section) || fieldLabel("Фразы");
  }
  function voiceLineSituation(line) {
    return text(line?.situation || line?.contextTitle || line?.situationText);
  }
  function voiceLineGender(line) {
    return text(line?.gender);
  }
  function voiceLineSignature(line) {
    return [voiceLineSection(line), voiceLineSituation(line)].join("::");
  }
  function groupVoiceLines(lines) {
    const group = { name: "", situations: [], lines: [] };
    (lines || []).forEach((line) => {
      group.lines.push(line);
      const situationName = voiceLineSituation(line);
      const key = situationName || "__default__";
      let situation = group.situations.find((item) => item.key === key);
      if (!situation) {
        situation = { key, name: situationName, lines: [] };
        group.situations.push(situation);
      }
      situation.lines.push(line);
    });
    return group.lines.length ? [group] : [];
  }
  function renderVoiceLine(line, options = {}) {
    const translation = voiceTranslation(line);
    const audio = voiceLineAudio(line);
    const gender = options.showGender ? voiceLineGender(line) : "";
    const note = voiceLineNote(line);
    return `<article class="voice-line-card">
      <div class="voice-line-main">
        <div class="voice-original-block">${voiceOriginalMarkup(line)}</div>
        <div class="voice-meaning-block">
          <div class="voice-translation-row">${gender ? `<span class="voice-gender-tag">${esc(gender)}</span>` : ""}<p class="voice-translation-text">${esc(translation)}</p></div>
          ${note ? `<p class="voice-context-text">${esc(note)}</p>` : ""}
        </div>
      </div>
      <button class="voice-play-btn" type="button" data-voice-audio="${esc(audio)}" ${audio ? "" : "disabled"} aria-label="${esc(fieldLabel("Воспроизвести фразу"))}">
        <span aria-hidden="true">▶</span>
      </button>
    </article>`;
  }
  function renderVoiceSection(section) {
    const sectionGenders = [...new Set(section.lines.map(voiceLineGender).filter(Boolean))];
    const showGender = sectionGenders.length > 1;
    return `<div class="voice-group">
      ${section.name ? `<h4>${esc(section.name)}</h4>` : ""}
      ${section.situations.map((situation) => `<div class="voice-situation-group">
        ${situation.name ? `<div class="voice-situation-title">${esc(situation.name)}</div>` : ""}
        <div class="voice-lines">${situation.lines.map((line) => renderVoiceLine(line, { showGender })).join("")}</div>
      </div>`).join("")}
    </div>`;
  }
  function renderVoice(hero) {
    const sets = voiceSets(hero);
    if (!sets.length) return FH.empty();
    const hasTabs = sets.length > 1;
    const nav = hasTabs ? `<div class="voice-subtabs" role="tablist">${sets.map((set, index) => `<button class="voice-subtab${index === 0 ? " is-active" : ""}" type="button" data-voice-tab="${esc(set.id || `voice-${index}`)}" role="tab">${esc(text(set.name))}</button>`).join("")}</div>` : "";
    const panels = sets.map((set, index) => {
      const groups = groupVoiceLines(set.lines || []);
      return `<section class="voice-subpanel${index === 0 ? " is-active" : ""}" data-voice-panel="${esc(set.id || `voice-${index}`)}">
        <div class="voice-set-header">
          <h3>${esc(text(set.name))}</h3>
          ${set.language ? `<span>${esc(text(set.language))}</span>` : ""}
        </div>
        <div class="voice-groups">${groups.map(renderVoiceSection).join("")}</div>
      </section>`;
    }).join("");
    return `<div class="voice-section">${nav}${panels}</div>`;
  }
  function table(columns, rows, options = {}) {
    const id = `fhTable${++tableId}`;
    const prepared = columns.map((column, index) => ({ ...column, index }));
    const filterValues = {
      heal: options.healFilter
        ? [...new Set([20, 35, 50, ...rows.map((row) => numberValue(row.heal)).filter(Boolean)])].sort((a, b) => a - b).map((value) => ({ value: String(value), label: `+${value}` }))
        : [],
      situation: options.situationFilter
        ? punishmentSituationFilterValues()
        : []
    };
    const body = rows.map((rowData) => {
      const searchText = prepared.map((column) => {
        if (options.voiceTranslationToggle && column.key === "translation") {
          return voiceTranslation(rowData);
        }
        const raw = rowData[column.key] ?? "";
        return column.key === "situation" ? situationLabel(raw) : (column.asText ? text(raw) : raw);
      }).join(" ").toLowerCase();
      const cells = prepared.map((column) => {
        if (options.voiceTranslationToggle && column.key === "translation") {
          return `<td class="voice-translation">${esc(voiceTranslation(rowData))}</td>`;
        }
        const raw = rowData[column.key] ?? "";
        const display = column.key === "situation" ? situationLabel(raw) : (column.asText ? text(raw) : raw);
        const sort = column.sortValue ? column.sortValue(rowData, display) : (column.type === "number" ? numberValue(display) : String(display).toLowerCase());
        const attrs = [];
        if (column.key === "heal") attrs.push(`data-heal-value="${esc(String(numberValue(display)))}"`);
        if (column.key === "situation") attrs.push(`data-situation-value="${esc(String(display))}"`);
        return `<td data-sort="${esc(sort)}"${attrs.length ? " " + attrs.join(" ") : ""}>${esc(display)}</td>`;
      }).join("");
      return `<tr data-table-row data-search="${esc(searchText)}">${cells}</tr>`;
    }).join("");
    const hasFilters = options.healFilter || options.situationFilter;
    const tableClass = `sortable-table${options.healFilter ? " execution-table" : ""}${options.situationFilter ? " punishment-table" : ""}${options.voiceTranslationToggle ? " voice-table" : ""}`;
    const colgroup = hasFilters ? `<colgroup>${prepared.map(() => `<col>`).join("")}</colgroup>` : "";
    const emptyRow = hasFilters ? `<tr class="table-empty-row" hidden><td colspan="${prepared.length}">${esc("Ничего не найдено")}</td></tr>` : "";
    const search = options.search ? `<label class="table-search-box"><span>${esc("Поиск")}</span><input type="search" data-table-search placeholder="${esc(fieldLabel("Название, ситуация, урон..."))}" autocomplete="off"></label>` : "";
    return `<div class="table-block">${search}<div class="table-wrap"><table class="${tableClass}" id="${id}">${colgroup}<thead><tr>${prepared.map((column) => sortableHeader(column, options, filterValues)).join("")}</tr></thead><tbody>${body}${emptyRow}</tbody></table></div></div>`;
  }
  function ensureModal() {
    if (modalReady) return;
    const node = document.createElement("div");
    node.id = "heroInfoModal";
    node.className = "modal item-modal";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="modal-backdrop" data-hero-modal-close></div><article class="modal-card item-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-hero-modal-close aria-label="Закрыть">×</button><div id="heroInfoModalBody"></div></article>`;
    document.body.appendChild(node);
    node.addEventListener("click", (event) => {
      const availability = event.target.closest("[data-expand-availability]");
      if (availability) {
        availability.classList.toggle("is-expanded");
        availability.setAttribute("aria-expanded", String(availability.classList.contains("is-expanded")));
        return;
      }
      if (event.target.closest("[data-hero-modal-close]")) closeModal();
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
    modalReady = true;
  }
  function openModal(html) {
    ensureModal();
    const node = document.getElementById("heroInfoModal");
    const body = document.getElementById("heroInfoModalBody");
    node.classList.toggle("is-perk-builder-modal", html.includes("perk-builder-table-mode"));
    body.innerHTML = html;
    FH.openDialog?.(node);
  }
  function closeModal() {
    const node = document.getElementById("heroInfoModal");
    if (!node) return;
    FH.closeDialog?.(node);
  }
  function activateTab(root, key, updateUrl = false) {
    const button = root.querySelector(`[data-tab="${CSS.escape(key)}"]`) || root.querySelector("[data-tab]");
    if (!button) return;
    const nextKey = button.dataset.tab;
    root.dataset.activeTab = nextKey;
    root.querySelectorAll("[data-tab]").forEach((node) => node.classList.toggle("is-active", node === button));
    root.querySelectorAll("[data-tab-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.tabPanel === nextKey));
    if (updateUrl) {
      const url = new URL(location.href);
      url.hash = nextKey;
      history.replaceState(null, "", url);
    }
  }
  function initTabs(root) {
    const available = new Set([...root.querySelectorAll("[data-tab]")].map((button) => button.dataset.tab));
    const initial = available.has(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
    activateTab(root, initial, false);
    root.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => activateTab(root, button.dataset.tab, true));
    });
    window.addEventListener("hashchange", () => {
      const key = location.hash.slice(1);
      if (available.has(key)) activateTab(root, key, false);
    }, { once: false });
  }
  function updateLastVisibleRow(tableEl) {
    const rows = [...tableEl.tBodies[0].rows].filter((row) => !row.classList.contains("table-empty-row") && !row.classList.contains("execution-empty-row"));
    rows.forEach((row) => row.classList.remove("is-last-visible-row"));
    const last = rows.filter((row) => !row.hidden).at(-1);
    if (last) last.classList.add("is-last-visible-row");
  }
  function applyTableFilters(tableEl) {
    const healSelected = new Set([...tableEl.querySelectorAll("[data-heal-choice]:checked")].map((item) => item.value));
    const situationSelected = new Set([...tableEl.querySelectorAll("[data-situation-choice]:checked")].map((item) => item.value));
    const query = tableEl.closest(".table-block")?.querySelector("[data-table-search]")?.value.trim().toLowerCase() || "";
    let visible = 0;
    [...tableEl.tBodies[0].rows].forEach((row) => {
      if (row.classList.contains("table-empty-row") || row.classList.contains("execution-empty-row")) return;
      const healCell = row.querySelector("td[data-heal-value]");
      const situationCell = row.querySelector("td[data-situation-value]");
      const healOk = !healSelected.size || healSelected.has(healCell?.dataset.healValue || "");
      const situationOk = !situationSelected.size || situationSelected.has(situationCell?.dataset.situationValue || "");
      const searchOk = !query || (row.dataset.search || row.textContent || "").toLowerCase().includes(query);
      row.hidden = !(healOk && situationOk && searchOk);
      if (!row.hidden) visible += 1;
    });
    const empty = tableEl.querySelector(".table-empty-row, .execution-empty-row");
    if (empty) empty.hidden = visible !== 0;
    tableEl.querySelectorAll(".th-filter").forEach((th) => {
      const key = th.dataset.key;
      const selected = key === "heal" ? healSelected : situationSelected;
      th.classList.toggle("has-selected", selected.size > 0);
    });
    updateLastVisibleRow(tableEl);
  }
  function clearFloatingFilterMenu(menu) {
    menu.classList.remove("is-floating-filter");
    menu.style.removeProperty("--fh-filter-left");
    menu.style.removeProperty("--fh-filter-top");
    menu.style.removeProperty("--fh-filter-max-height");
    menu.style.removeProperty("--fh-filter-shift-x");
  }
  function placeFloatingFilterMenu(button, menu) {
    if (!button || !menu) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = Math.min(420, Math.max(220, menu.offsetWidth || 260));
    const half = menuWidth / 2;
    const padding = 14;
    let left = rect.left + rect.width / 2;
    left = Math.max(padding + half, Math.min(window.innerWidth - padding - half, left));
    const top = Math.min(window.innerHeight - 80, Math.max(74, rect.bottom + 10));
    menu.classList.add("is-floating-filter");
    menu.style.setProperty("--fh-filter-left", `${left}px`);
    menu.style.setProperty("--fh-filter-top", `${top}px`);
    menu.style.setProperty("--fh-filter-max-height", `${Math.max(160, window.innerHeight - top - 18)}px`);
  }
  function ensurePunishmentPortal() {
    let portal = document.getElementById("punishmentFilterPortal");
    if (portal) return portal;
    portal = document.createElement("div");
    portal.id = "punishmentFilterPortal";
    portal.className = "punishment-filter-portal heal-filter-menu is-floating-filter";
    portal.hidden = true;
    document.body.appendChild(portal);
    return portal;
  }
  function closePunishmentPortal() {
    const portal = document.getElementById("punishmentFilterPortal");
    if (!portal) return;
    portal.hidden = true;
    const table = portal.dataset.tableId ? document.getElementById(portal.dataset.tableId) : null;
    table?.querySelector(".th-filter.is-open")?.classList.remove("is-open");
    portal.removeAttribute("data-table-id");
    portal.removeAttribute("data-source-key");
  }
  function openPunishmentPortal(button, tableEl, sourceMenu) {
    if (!button || !tableEl || !sourceMenu) return;
    const portal = ensurePunishmentPortal();
    const options = [...sourceMenu.querySelectorAll("[data-situation-choice]")].map((input) => ({
      value: input.value,
      label: input.closest("label")?.querySelector("span")?.textContent?.trim() || input.value,
      checked: input.checked
    }));
    portal.dataset.tableId = tableEl.id;
    portal.innerHTML = `<button class="heal-filter-reset" type="button" data-situation-portal-reset>${esc(fieldLabel("Сбросить"))}</button>${options.map((item) => `<label class="heal-filter-option"><input type="checkbox" value="${esc(item.value)}" data-situation-portal-choice${item.checked ? " checked" : ""}> <span>${esc(item.label)}</span></label>`).join("")}`;
    const rect = button.getBoundingClientRect();
    const portalWidth = Math.min(420, Math.max(280, Math.round(rect.width + 140)));
    const padding = 12;
    let viewportLeft = rect.left + rect.width / 2;
    viewportLeft = Math.max(padding + portalWidth / 2, Math.min(window.innerWidth - padding - portalWidth / 2, viewportLeft));
    const viewportTop = Math.max(72, rect.bottom + 10);
    const left = viewportLeft + window.scrollX;
    const top = viewportTop + window.scrollY;
    const maxHeight = Math.max(180, window.innerHeight - viewportTop - 18);
    portal.style.setProperty("--fh-filter-left", `${left}px`);
    portal.style.setProperty("--fh-filter-top", `${top}px`);
    portal.style.setProperty("--fh-filter-max-height", `${maxHeight}px`);
    portal.style.setProperty("--fh-filter-width", `${portalWidth}px`);
    portal.hidden = false;
  }
  function closeHealMenus(root, exceptMenu) {
    if (!exceptMenu) closePunishmentPortal();
    root.querySelectorAll(".heal-filter-menu").forEach((menu) => {
      if (menu !== exceptMenu) {
        menu.hidden = true;
        menu.closest(".th-filter")?.classList.remove("is-open");
        clearFloatingFilterMenu(menu);
      }
    });
  }
  function initSortableTables(root) {
    if (root.dataset.sortableTablesBound === "true") return;
    root.dataset.sortableTablesBound = "true";
    root.addEventListener("click", (event) => {
      const filterToggle = event.target.closest("[data-heal-toggle], [data-situation-toggle]");
      if (filterToggle) {
        event.stopPropagation();
        const th = filterToggle.closest("th");
        const menu = th?.querySelector(".heal-filter-menu");
        const tableEl = filterToggle.closest("table");
        const isPunishmentSituation = filterToggle.hasAttribute("data-situation-toggle") && tableEl?.classList.contains("punishment-table");
        if (isPunishmentSituation) {
          const portal = ensurePunishmentPortal();
          const open = portal.hidden || portal.dataset.tableId !== tableEl.id;
          closeHealMenus(root, null);
          if (open && menu) {
            menu.hidden = true;
            th.classList.add("is-open");
            openPunishmentPortal(filterToggle, tableEl, menu);
          } else {
            th?.classList.remove("is-open");
            closePunishmentPortal();
          }
          return;
        }
        closeHealMenus(root, menu);
        if (menu) {
          const open = menu.hidden;
          menu.hidden = !open;
          th.classList.toggle("is-open", open);
          if (open) placeFloatingFilterMenu(filterToggle, menu);
          else clearFloatingFilterMenu(menu);
        }
        return;
      }

      const filterReset = event.target.closest("[data-heal-reset], [data-situation-reset]");
      if (filterReset) {
        event.stopPropagation();
        const tableEl = filterReset.closest("table");
        const selector = filterReset.hasAttribute("data-heal-reset") ? "[data-heal-choice]" : "[data-situation-choice]";
        tableEl.querySelectorAll(selector).forEach((input) => { input.checked = false; });
        applyTableFilters(tableEl);
        return;
      }

      const filterChoice = event.target.closest("[data-heal-choice], [data-situation-choice]");
      if (filterChoice) {
        event.stopPropagation();
        const tableEl = filterChoice.closest("table");
        applyTableFilters(tableEl);
        return;
      }

      const sortButton = event.target.closest(".th-sort");
      if (!sortButton) return;
      const tableEl = sortButton.closest("table");
      const tbody = tableEl.tBodies[0];
      const index = Number(sortButton.dataset.sortIndex);
      const type = sortButton.dataset.sortType;
      const dir = sortButton.dataset.dir === "asc" ? "desc" : "asc";
      tableEl.querySelectorAll(".th-sort").forEach((button) => {
        button.dataset.dir = "";
        button.closest("th")?.classList.remove("is-active-sort");
        button.querySelector(".sort-arrow-one")?.classList.remove("is-asc", "is-desc");
      });
      tableEl.querySelectorAll("td, th").forEach((cell) => cell.classList.remove("is-active-sort"));
      sortButton.dataset.dir = dir;
      sortButton.closest("th")?.classList.add("is-active-sort");
      sortButton.querySelector(".sort-arrow-one")?.classList.add(dir === "asc" ? "is-asc" : "is-desc");
      const rows = [...tbody.rows].filter((row) => !row.classList.contains("table-empty-row") && !row.classList.contains("execution-empty-row")).sort((a, b) => {
        const av = a.cells[index]?.dataset.sort || a.cells[index]?.textContent || "";
        const bv = b.cells[index]?.dataset.sort || b.cells[index]?.textContent || "";
        const result = type === "number" ? Number(av) - Number(bv) : String(av).localeCompare(String(bv), "ru-RU", { numeric: true, sensitivity: "base" });
        return dir === "asc" ? result : -result;
      });
      const empty = tbody.querySelector(".table-empty-row, .execution-empty-row");
      rows.forEach((row) => { row.cells[index]?.classList.add("is-active-sort"); tbody.appendChild(row); });
      if (empty) tbody.appendChild(empty);
      applyTableFilters(tableEl);
    });
    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-table-search]");
      if (!search) return;
      const tableEl = search.closest(".table-block")?.querySelector("table");
      if (tableEl) applyTableFilters(tableEl);
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("#punishmentFilterPortal")) return;
      if (!event.target.closest(".th-filter")) closeHealMenus(root, null);
    });
    document.addEventListener("click", (event) => {
      const portal = document.getElementById("punishmentFilterPortal");
      if (!portal || portal.hidden) return;
      if (event.target.closest("#punishmentFilterPortal")) {
        event.stopPropagation();
        const tableEl = portal.dataset.tableId ? document.getElementById(portal.dataset.tableId) : null;
        if (!tableEl) return;
        const reset = event.target.closest("[data-situation-portal-reset]");
        const choice = event.target.closest("[data-situation-portal-choice]");
        if (reset) {
          tableEl.querySelectorAll("[data-situation-choice]").forEach((input) => { input.checked = false; });
          portal.querySelectorAll("[data-situation-portal-choice]").forEach((input) => { input.checked = false; });
          applyTableFilters(tableEl);
          return;
        }
        if (choice) {
          const original = [...tableEl.querySelectorAll("[data-situation-choice]")].find((input) => input.value === choice.value);
          if (original) original.checked = choice.checked;
          applyTableFilters(tableEl);
          return;
        }
        return;
      }
      if (!event.target.closest("[data-situation-toggle]")) closePunishmentPortal();
    });
    window.addEventListener("resize", closePunishmentPortal);
    window.addEventListener("resize", () => closeHealMenus(root, null));
    root.querySelectorAll(".sortable-table").forEach((tableEl) => applyTableFilters(tableEl));
  }
  function moveFieldLabel(field) {
    return text(field?.label);
  }

  function moveRecoveryFieldMeta(label) {
    const raw = String(label || "").trim();
    const key = raw.toLowerCase().replace(/ё/g, "е");
    const english = key.match(/^(hit|miss|block|superior block) recovery (base|guardswap)$/i);
    if (english) {
      return {
        stateKey: english[2].toLowerCase(),
        columnKey: english[1].toLowerCase() === "superior block" ? "superior" : english[1].toLowerCase()
      };
    }

    const russian = key.match(/^(восстановление|смена защиты) после (попадания|промаха|блока|надежной защиты)$/i);
    if (!russian) return null;

    const stateKey = russian[1] === "смена защиты" ? "guardswap" : "base";
    const columnMap = {
      "попадания": "hit",
      "промаха": "miss",
      "блока": "block",
      "надежной защиты": "superior"
    };
    return { stateKey, columnKey: columnMap[russian[2]] };
  }

  function extractMoveRecovery(fields) {
    const recoveryMap = {
      base: {
        state: "Восстановление",
        hit: "",
        miss: "",
        block: "",
        superior: ""
      },
      guardswap: {
        state: "Смена защиты",
        hit: "",
        miss: "",
        block: "",
        superior: ""
      }
    };
    const keptFields = [];
    let hasRecovery = false;

    fields.forEach((field) => {
      const meta = moveRecoveryFieldMeta(moveFieldLabel(field));
      if (!meta) {
        keptFields.push(field);
        return;
      }

      recoveryMap[meta.stateKey][meta.columnKey] = field.value || "";
      hasRecovery = true;
    });

    if (!hasRecovery) return { fields: keptFields, recovery: null };

    const rows = [recoveryMap.base, recoveryMap.guardswap].filter((row) => {
      return [row.hit, row.miss, row.block, row.superior].some((value) => String(text(value)).trim() !== "");
    });

    if (!rows.length) return { fields: keptFields, recovery: null };

    return {
      fields: keptFields,
      recovery: {
        title: "Восстановление",
        note: "",
        rows
      }
    };
  }

  function normalizedMove(move, index) {
    const groups = [
      "Базовые",
      "Толчок",
      "Финишеры"
    ];
    const damage = move.damage ?? (index === 0 ? 12 : index === 1 ? 14 : 24);
    const stamina = move.stamina ?? (index === 0 ? 9 : index === 1 ? 12 : 18);
    let fields = Array.isArray(move.fields) && move.fields.length ? move.fields : [
      { label: "Урон", value: damage, tone: "danger" },
      { label: "Выносливость", value: stamina, tone: "success" },
      { label: "Скорость", value: move.speed || (index === 0 ? "500 ms" : "700 ms"), tone: "info" },
      { label: "Активация", value: move.combo },
      { label: "Сторона атаки", value: move.side || (index === 0 ? "Верх" : "Бок") },
      { label: "Хитстан", value: move.hitstun || "Лёгкий" },
      { label: "Особенность", value: move.properties }
    ].filter((field) => field.value !== undefined && field.value !== null && String(text(field.value)).trim() !== "");
    const recoveryExtraction = extractMoveRecovery(fields);
    fields = recoveryExtraction.fields;
    return {
      ...move,
      group: move.group || groups[Math.min(index, groups.length - 1)],
      fields,
      recovery: move.recovery || recoveryExtraction.recovery || null,
      icons: Array.isArray(move.icons) ? move.icons.filter(Boolean) : [],
      note: move.note || move.description || ""
    };
  }
  function renderRecoveryModal(move) {
    const r = move?.recovery;
    const title = r?.title || "Восстановление";
    const note = r ? text(r.note) : "";
    const soon = "Скоро";
    const cell = (value) => {
      const valueText = String(text(value) || "").trim();
      return esc(valueText || soon);
    };
    const body = r && Array.isArray(r.rows) && r.rows.length
      ? `<div class="table-wrap compact-table"><table><thead><tr><th></th><th>${fieldLabel("После попадания")}</th><th>${fieldLabel("После промаха")}</th><th>${fieldLabel("После блока")}</th><th>${fieldLabel("Надёжная защита")}</th></tr></thead><tbody>${r.rows.map(row => `<tr><td><strong>${esc(text(row.state))}</strong></td><td>${cell(row.hit)}</td><td>${cell(row.miss)}</td><td>${cell(row.block)}</td><td>${cell(row.superior)}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="empty-state move-recovery-soon">${esc(soon)}</p>`;
    openModal(`<div class="item-modal-header"><p class="modal-breadcrumb">${esc("Приёмы")} • ${esc(text(move.name))}</p><h2>${esc(text(title))}</h2></div>${note ? `<p>${esc(note)}</p>` : ""}${body}`);
  }
  function moveIconGrid(move) {
    const icons = (Array.isArray(move.icons) ? move.icons : []).filter(Boolean);
    return `<span class="move-icon-grid">${icons.map((icon, index) => {
      const meta = moveIconMeta(icon);
      const label = text(meta.name);
      return `<button class="move-icon-link" type="button" style="--icon-index:${index}" data-move-type-icon="${esc(icon)}" data-tooltip="${esc(label)}" aria-label="${esc(label)}"><img src="${FH.asset(`assets/icons/moves/${icon}`)}" alt=""></button>`;
    }).join("")}</span>`;
  }

  function renderMoveTypeModal(meta) {
    const name = text(meta?.name) || "Тип приёма";
    const description = text(meta?.description) || "Описание этого типа приёма пока не добавлено.";
    const icon = meta?.icon || "Special.webp";
    openModal(`<div class="item-modal-header"><p class="modal-breadcrumb">${esc("Глоссарий")} • ${esc("Тип приёма")}</p><h2>${esc(name)}</h2></div><div class="move-type-modal"><span class="move-type-modal-icon"><img src="${FH.asset(`assets/icons/moves/${icon}`)}" alt=""></span><p>${esc(description)}</p></div>`);
  }
  function moveLabelText(field) {
    return String(moveFieldLabel(field) || "").trim();
  }

  function moveLabelKey(field) {
    return moveLabelText(field).toLowerCase().replace(/ё/g, "е");
  }

  function moveStatType(field) {
    const key = moveLabelKey(field);
    if (key === "урон" || key === "damage") return "damage";
    if (key === "урон кровотечением" || key === "кровотечение" || key === "bleed damage" || key === "bleed") return "bleed";
    if (key === "скорость" || key === "speed") return "speed";
    if (key === "выносливость" || key === "stamina") return "stamina";
    return "";
  }

  function moveDetailLabel(field) {
    const label = moveLabelText(field);
    const key = label.toLowerCase().replace(/ё/g, "е");
    if (key === "хитстан" || key === "hitstun" || key === "оглушение") return "Оглушение";
    if (key === "особенности") return "Особенность";
    return label;
  }

  function splitMoveStatValue(value, type) {
    const raw = String(text(value) || "").trim();
    const match = raw.match(/^([+-]?\d+(?:[.,]\d+)?)(?:\s*(.*))?$/);
    const fallbackUnits = { damage: "ед.", bleed: "ед.", speed: "мс", stamina: "ед." };
    if (!match) return { number: raw || "—", unit: "" };
    const number = match[1];
    const unit = String(match[2] || "").trim() || fallbackUnits[type] || "";
    return { number, unit };
  }

  function renderMoveStat(field, type) {
    const value = splitMoveStatValue(field?.value, type);
    const labels = { damage: "Урон", bleed: "Урон кровотечением", speed: "Скорость", stamina: "Выносливость" };
    return `<div class="move-stat move-stat-${esc(type)}"><span class="move-stat-label">${esc(labels[type] || moveDetailLabel(field))}</span><strong class="move-stat-value"><span class="move-stat-number">${esc(value.number)}</span>${value.unit ? `<span class="move-stat-unit">${esc(value.unit)}</span>` : ""}</strong></div>`;
  }

  function moveCapitalizeFirst(value) {
    const valueText = String(text(value) || "").trim();
    if (!valueText) return "";
    return valueText.charAt(0).toUpperCase() + valueText.slice(1);
  }

  function normalizeMoveActivation(value) {
    let valueText = String(text(value) || "").trim();
    const isJuren = String(activeHero?.id || "").toLowerCase() === "juren" || String(text(activeHero?.name) || "").toLowerCase().includes("цзюйжэнь");
    if (isJuren) {
      valueText = valueText
        .replace(/(^|[\s+>,/()])Тап(?=$|[\s+>,/()])/g, "$1Быстрое нажатие")
        .replace(/(^|[\s+>,/()])тап(?=$|[\s+>,/()])/g, "$1быстрое нажатие")
        .replace(/(^|[\s+>,/()])Tap(?=$|[\s+>,/()])/g, "$1Быстрое нажатие")
        .replace(/(^|[\s+>,/()])tap(?=$|[\s+>,/()])/g, "$1быстрое нажатие")
        .replace(/(^|[\s+>,/()])Холд(?=$|[\s+>,/()])/g, "$1Удержание")
        .replace(/(^|[\s+>,/()])холд(?=$|[\s+>,/()])/g, "$1удержание")
        .replace(/(^|[\s+>,/()])Hold(?=$|[\s+>,/()])/g, "$1Удержание")
        .replace(/(^|[\s+>,/()])hold(?=$|[\s+>,/()])/g, "$1удержание");
    }
    return moveCapitalizeFirst(valueText);
  }

  function normalizeMoveSide(value) {
    const valueText = String(text(value) || "").trim();
    const key = valueText.toLowerCase().replace(/ё/g, "е");
    const map = {
      "бок": "Слева/Справа",
      "боковая": "Слева/Справа",
      "боковой": "Слева/Справа",
      "лево": "Слева",
      "левый": "Слева",
      "левая": "Слева",
      "право": "Справа",
      "правый": "Справа",
      "правая": "Справа"
    };
    return map[key] || valueText;
  }

  function moveHitstunLevel(value) {
    const key = String(text(value) || "").trim().toLowerCase().replace(/ё/g, "е");
    if (!key) return 0;
    if (key.includes("тяж") || key.includes("heavy")) return 3;
    if (key.includes("сред") || key.includes("medium")) return 2;
    if (key.includes("лег") || key.includes("light")) return 1;
    return 0;
  }

  function renderMoveHitstun(value) {
    const level = moveHitstunLevel(value);
    const label = String(text(value) || "").trim();
    if (!level) return `<span class="move-detail-empty">—</span>`;
    return `<span class="move-hitstun-dots" aria-label="${esc(label)}" title="${esc(label)}">${[1, 2, 3].map((dot) => `<span class="move-hitstun-dot${dot <= level ? " is-active" : ""}" aria-hidden="true"></span>`).join("")}</span>`;
  }

  function renderMoveFeature(value) {
    let valueText = String(text(value) || "").trim();
    if (!valueText || valueText === "—" || valueText === "-") return `<span class="move-detail-empty">—</span>`;
    if (valueText.toLowerCase() === "unenhanced") valueText = "Улучшенный";
    return `<span class="move-feature-badge">${esc(valueText)}</span>`;
  }

  function renderMoveDetailValue(field) {
    const label = moveDetailLabel(field).toLowerCase().replace(/ё/g, "е");
    if (label === "оглушение") return renderMoveHitstun(field.value);
    if (label === "особенность") return renderMoveFeature(field.value);
    let value = String(text(field.value) || "").trim();
    if (label === "активация") value = normalizeMoveActivation(value);
    if (label === "сторона атаки") value = normalizeMoveSide(value);
    return value ? esc(value) : `<span class="move-detail-empty">—</span>`;
  }

  function moveCommentText(move) {
    return String(text(move?.note) || text(move?.comment) || text(move?.description) || "").trim();
  }

  function hasMoveComment(move) {
    return moveCommentText(move) !== "";
  }

  function renderMoveCommentModal(move) {
    const comment = moveCommentText(move) || "Комментарий для этого приёма пока не добавлен.";
    openModal(`<div class="item-modal-header"><p class="modal-breadcrumb">${esc("Приёмы")} • ${esc(text(move.name))}</p><h2>${esc("Комментарий")}</h2></div><p class="move-comment-modal-text">${esc(comment)}</p>`);
  }

  function renderMoveCard(move, index) {
    const fields = Array.isArray(move.fields) ? move.fields : [];
    const stats = {
      damage: fields.find((field) => moveStatType(field) === "damage"),
      bleed: fields.find((field) => moveStatType(field) === "bleed"),
      speed: fields.find((field) => moveStatType(field) === "speed"),
      stamina: fields.find((field) => moveStatType(field) === "stamina")
    };
    const details = fields.filter((field) => !moveStatType(field));
    const commentAvailable = hasMoveComment(move);
    return `<article class="move-frame-card move-card-v2" data-move-index="${index}">
      <div class="move-frame-head move-card-v2-head">
        <h3>${esc(text(move.name))}</h3>
        ${moveIconGrid(move)}
      </div>
      <div class="move-card-v2-body">
        <div class="move-stat-panel" aria-label="${esc("Основные показатели")}">
          ${renderMoveStat(stats.damage || { label: "Урон", value: "—" }, "damage")}
          ${renderMoveStat(stats.speed || { label: "Скорость", value: "—" }, "speed")}
          ${renderMoveStat(stats.stamina || { label: "Выносливость", value: "—" }, "stamina")}
          ${stats.bleed ? renderMoveStat(stats.bleed, "bleed") : ""}
        </div>
        <div class="move-detail-table-wrap">
          <div class="move-detail-list" role="list" aria-label="${esc("Дополнительные параметры приёма")}">
            ${details.length ? details.map((field) => `<div class="move-detail-row" role="listitem"><span class="move-detail-label">${esc(moveDetailLabel(field))}</span><span class="move-detail-value">${renderMoveDetailValue(field)}</span></div>`).join("") : `<div class="move-detail-row" role="listitem"><span class="move-detail-label">${esc("Детали")}</span><span class="move-detail-value"><span class="move-detail-empty">—</span></span></div>`}
          </div>
        </div>
      </div>
      <div class="move-card-actions" aria-label="${esc("Действия приёма")}">
        <button class="move-card-action" type="button" data-recovery-index="${index}">${esc("Восстановление")}</button>
        <span class="move-action-separator" aria-hidden="true"></span>
        <button class="move-card-action${commentAvailable ? "" : " is-disabled"}" type="button" data-comment-index="${index}"${commentAvailable ? "" : " disabled aria-disabled='true'"}>${esc("Комментарий")}</button>
      </div>
    </article>`;
  }

  function heroMoveItems(hero) {
    const moves = hero?.moves || [];
    if (Array.isArray(moves)) return moves;
    return Object.values(moves).flatMap((group) => Array.isArray(group) ? group : []);
  }
  function commonExecutionItems(hero) {
    const executions = hero?.executions || {};
    if (Array.isArray(executions.common) && executions.common.length) return executions.common;
    const ids = executions.commonIds || executions.commonExecutionIds || [];
    return ids.map((id) => (FH_DATA.executions || []).find((item) => item.id === id)).filter(Boolean);
  }
  function renderMoves(hero) {
    const moves = heroMoveItems(hero).map(normalizedMove);
    const groups = new Map();
    moves.forEach((move, index) => {
      const key = text(move.group);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ move, index });
    });
    return `<div class="move-accordions">${[...groups.entries()].map(([group, items], i) => `<details class="move-accordion" ${i === 0 ? "open" : ""}><summary>${esc(group)}</summary><div class="move-accordion-grid">${items.map(({ move, index }) => renderMoveCard(move, index)).join("")}</div></details>`).join("")}</div>`;
  }
  function heroFeatItems(hero) {
    if (FH.heroFeatItems) return FH.heroFeatItems(hero);
    const catalog = new Map(FH.collectFeats().map((feat) => [feat.id, feat]));
    return FH.heroFeatIds(hero).map((id) => catalog.get(id)).filter(Boolean);
  }
  function renderItemStats(item) {
    const fields = [
      ["Откат", item.cooldown],
      ["Активация", item.cast],
      ["Восстановление", item.recovery]
    ].filter(([, value]) => isFilledStat(value));
    return fields.length ? `<div class="ability-card-stats">${fields.map(([label, value]) => statField(label, value)).join("")}</div>` : "";
  }
  function renderModalStats(item) {
    const fields = [
      ["Откат", item.cooldown],
      ["Активация", item.cast],
      ["Восстановление", item.recovery]
    ].filter(([, value]) => isFilledStat(value));
    return fields.length ? `<div class="modal-stat-tiles">${fields.map(([label, value]) => `<div class="modal-stat-tile"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div>` : "";
  }
  function itemEffectBlock(textValue) {
    return `<div class="modal-effect-block"><span>${esc("Описание")}</span><p>${esc(text(textValue))}</p></div>`;
  }
  function perkRarity(perk, place = "hero") {
    return place === "catalog"
      ? (perk.catalogRarity || perk.pageRarity || perk.rarity || "common")
      : (perk.heroRarity || perk.rarity || perk.catalogRarity || "common");
  }
  function renderFeatCard(feat, recommendation = null) {
    const unique = (feat.heroes || []).length <= 1;
    return `<article class="feat-card ability-like-card ${unique ? "is-unique-card" : ""}" data-feat-id="${esc(feat.id)}" tabindex="0" role="button" aria-label="${esc("Подробнее")}: ${esc(text(feat.name))}">
      <span class="ability-card-bg image-wrap">${FH.localImage(feat.image, text(feat.name))}</span>
      ${recommendation ? `<span class="ability-card-recommend">${recommendedBadge(recommendation)}</span>` : ""}
      <div class="ability-card-content">
        <h3>${esc(text(feat.name))}</h3>
        <div class="ability-badges"><span class="ability-badge ${featKindClass(feat)}">${esc(featKindLabel(feat))}</span>${unique ? `<span class="ability-badge is-unique">${esc("Уникальная")}</span>` : ""}</div>
        <p class="ability-card-desc">${esc(text(feat.description))}</p>
        ${renderItemStats(feat)}
        <div class="ability-card-footer"><span class="ability-info-button" aria-hidden="true">i</span><span class="ability-hint-text">${esc("Нажми на меня")}</span></div>
      </div>
    </article>`;
  }
  function renderFeats(hero) {
    const feats = heroFeatItems(hero).slice(0, 12);
    return [1,2,3,4].map((tier) => {
      const start = (tier - 1) * 3;
      const items = feats.slice(start, start + 3);
      if (!items.length) return "";
      return `<div class="ability-tier"><div class="ability-tier-label">${esc("Уровень")} ${tier}</div><div class="ability-tier-cards">${items.map((feat) => renderFeatCard(feat, recommendationFromItem(feat))).join("")}</div></div>`;
    }).join("") || FH.empty();
  }
  function heroPerkItems(hero) {
    const selected = FH.heroPerkItems ? FH.heroPerkItems(hero) : [];
    if (selected.length) return selected;
    const all = FH.collectPerks();
    return all.slice(0, 6);
  }
  function renderPerkCard(perk, recommendation = null) {
    const rarity = perkRarity(perk, "hero");
    const meta = FH.rarityMeta[rarity] || FH.rarityMeta.common;
    const type = FH.perkTypeLabels[perk.perkType] || FH.perkTypeLabels.support;
    return `<article class="perk-card ability-like-card ${meta.className}" data-rarity="${esc(rarity)}" data-perk-id="${esc(perk.id)}" tabindex="0" role="button" aria-label="${esc("Подробнее")}: ${esc(text(perk.name))}">
      <span class="ability-card-bg image-wrap">${FH.localImage(perk.image, text(perk.name))}</span>
      ${recommendation ? `<span class="ability-card-recommend">${recommendedBadge(recommendation)}</span>` : ""}
      <div class="ability-card-content">
        <h3>${esc(text(perk.name))}</h3>
        <div class="ability-badges"><span class="ability-badge">${esc(text(meta.label))}</span><span class="ability-badge">${esc(text(type))}</span></div>
        <p class="ability-card-desc">${esc(text(perk.description))}</p>
        <div class="ability-card-footer"><span class="ability-info-button" aria-hidden="true">i</span><span class="ability-hint-text">${esc("Нажми на меня")}</span></div>
      </div>
    </article>`;
  }
  function renderPerks(hero) {
    const perks = heroPerkItems(hero);
    return `<div class="perk-panel-head"><button class="btn btn-primary" type="button" data-open-perk-builder>${esc("Таблица подбора")}</button></div><div class="perk-card-grid">${perks.map((perk) => renderPerkCard(perk, recommendationFromItem(perk))).join("")}</div>`;
  }
  function availabilityBox(items) {
    const names = (items || []).map(text).filter(Boolean);
    return `<button class="availability-box" type="button" data-expand-availability aria-expanded="false">
      <span class="box-label">${esc("Доступность")}</span>
      <strong class="availability-list">${esc(names.join(", ") || "—")}</strong>
    </button>`;
  }
  function modalRating(value) {
    return `<div class="modal-rating"><span>${esc("Оценка")}</span><strong>${esc(text(value))}</strong></div>`;
  }
  function renderFeatModal(feat) {
    const unique = (feat.heroes || []).length <= 1;
    openModal(`<div class="item-modal-header">
      <p class="modal-breadcrumb">${esc("Способности")} • ${esc("Уровень")} ${esc(feat.level)}</p>
      <h2>${esc(text(feat.name))}</h2>
      <div class="item-modal-badges ability-badges"><span class="ability-badge ${featKindClass(feat)}">${esc(featKindLabel(feat))}</span>${unique ? `<span class="ability-badge is-unique">${esc("Уникальная")}</span>` : ""}</div>
    </div>
    <div class="item-modal-layout"><span class="ability-icon is-large image-wrap">${FH.localImage(feat.image, text(feat.name))}</span><div>${itemEffectBlock(feat.description)}${renderModalStats(feat)}${availabilityBox(feat.heroes)}${modalRating(feat.rating)}</div></div>`);
  }
  function renderPerkModal(perk) {
    const rarity = perkRarity(perk, "hero");
    const meta = FH.rarityMeta[rarity] || FH.rarityMeta.common;
    const type = FH.perkTypeLabels[perk.perkType] || FH.perkTypeLabels.support;
    openModal(`<div class="perk-modal-tint ${esc(meta.className)}"><div class="item-modal-header">
      <p class="modal-breadcrumb">${esc("Перки")} • ${esc(text(meta.label))}</p>
      <h2>${esc(text(perk.name))}</h2>
      <div class="item-modal-badges ability-badges"><span class="ability-badge">${esc(text(meta.label))}</span><span class="ability-badge">${esc(text(type))}</span></div>
    </div>
    <div class="item-modal-layout"><span class="ability-icon is-large image-wrap">${FH.localImage(perk.image, text(perk.name))}</span><div>${itemEffectBlock(perk.description)}${availabilityBox(perk.heroes)}${modalRating(perk.rating)}</div></div></div>`);
  }
  function renderPerkBuilderModal() {
    FH.openPerkBuilderTable?.();
  }
  function renderGuide(hero) {
    const name = text(hero.name);
    const features = hero.guide?.features || [
      `${name}: держи дистанцию и не отдавай инициативу без причины.`,
      "Следи за выносливостью: сильный вход без ресурса превращается в подарок сопернику."
    ];
    const tricks = hero.guide?.tricks || [
      "Чередуй быстрые входы и паузы, чтобы ломать тайминг парирования.",
      "Проверяй реакцию врага короткими безопасными действиями перед риском."
    ];
    const secrets = hero.guide?.secrets || [
      "После удачного чтения не всегда нужен максимум урона: иногда позиция важнее."
    ];
    const videos = hero.guide?.videos || [
      { title: `${name}: основы`, description: "Короткий видео-гайд по базовому плану игры.", sources: videoSources() },
      { title: `${name}: продвинутые ситуации`, description: "Разбор давления, наказаний и позиционирования.", sources: videoSources() }
    ];
    return `<div class="guide-panel">
      <article class="guide-block"><h3>${esc(fieldLabel("Особенности персонажа"))}</h3>${textList(features)}</article>
      <article class="guide-block"><h3>${esc(fieldLabel("Гайды"))}</h3>${textList(tricks)}</article>
      <article class="guide-block"><h3>${esc(fieldLabel("Секретные фишки"))}</h3>${textList(secrets)}</article>
      <div class="guide-video-grid">
        ${videos.map(videoCard).join("")}
      </div>
    </div>`;
  }

  function bindHeroInteractions(root) {
    if (root.dataset.heroInteractionsBound === "true") return;
    root.dataset.heroInteractionsBound = "true";
    root.addEventListener("click", (event) => {
      const moveTypeButton = event.target.closest("[data-move-type-icon]");
      if (moveTypeButton) {
        renderMoveTypeModal(moveIconMeta(moveTypeButton.dataset.moveTypeIcon));
        return;
      }
      const rec = event.target.closest("[data-recovery-index]");
      if (rec) {
        const move = activeMoves[Number(rec.dataset.recoveryIndex)];
        if (move) renderRecoveryModal(move);
        return;
      }
      const commentButton = event.target.closest("[data-comment-index]");
      if (commentButton) {
        if (commentButton.disabled || commentButton.getAttribute("aria-disabled") === "true") return;
        const move = activeMoves[Number(commentButton.dataset.commentIndex)];
        if (move) renderMoveCommentModal(move);
        return;
      }
      const featCard = event.target.closest("[data-feat-id]");
      if (featCard) {
        const feat = activeFeats.find((f) => f.id === featCard.dataset.featId);
        if (feat) renderFeatModal(feat);
        return;
      }
      const perkCard = event.target.closest("[data-perk-id]");
      if (perkCard) {
        const perk = activePerks.find((p) => p.id === perkCard.dataset.perkId);
        if (perk) renderPerkModal(perk);
        return;
      }
      const voiceTab = event.target.closest("[data-voice-tab]");
      if (voiceTab) {
        const section = voiceTab.closest(".voice-section");
        const id = voiceTab.dataset.voiceTab;
        section?.querySelectorAll("[data-voice-tab]").forEach((btn) => btn.classList.toggle("is-active", btn === voiceTab));
        section?.querySelectorAll("[data-voice-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.voicePanel === id));
        return;
      }
      const voiceButton = event.target.closest("[data-voice-audio]");
      if (voiceButton) {
        const url = voiceButton.dataset.voiceAudio;
        if (!url) return;
        const resetVoiceButton = (button) => {
          if (!button) return;
          button.classList.remove("is-playing");
          const icon = button.querySelector("span");
          if (icon) icon.textContent = "▶";
          button.setAttribute("aria-label", fieldLabel("Воспроизвести фразу"));
        };
        if (window.FH_ACTIVE_VOICE_AUDIO) {
          window.FH_ACTIVE_VOICE_AUDIO.pause();
          window.FH_ACTIVE_VOICE_AUDIO.currentTime = 0;
        }
        if (window.FH_ACTIVE_VOICE_BUTTON === voiceButton && voiceButton.classList.contains("is-playing")) {
          resetVoiceButton(voiceButton);
          window.FH_ACTIVE_VOICE_AUDIO = null;
          window.FH_ACTIVE_VOICE_BUTTON = null;
          return;
        }
        resetVoiceButton(window.FH_ACTIVE_VOICE_BUTTON);
        window.FH_ACTIVE_VOICE_AUDIO = new Audio(url);
        window.FH_ACTIVE_VOICE_BUTTON = voiceButton;
        voiceButton.classList.add("is-playing");
        const icon = voiceButton.querySelector("span");
        if (icon) icon.textContent = "❚❚";
        voiceButton.setAttribute("aria-label", fieldLabel("Остановить фразу"));
        window.FH_ACTIVE_VOICE_AUDIO.addEventListener("ended", () => {
          resetVoiceButton(voiceButton);
          window.FH_ACTIVE_VOICE_AUDIO = null;
          window.FH_ACTIVE_VOICE_BUTTON = null;
        }, { once: true });
        window.FH_ACTIVE_VOICE_AUDIO.play().catch(() => {
          resetVoiceButton(voiceButton);
          window.FH_ACTIVE_VOICE_AUDIO = null;
          window.FH_ACTIVE_VOICE_BUTTON = null;
        });
        return;
      }
      if (event.target.closest("[data-open-perk-builder]")) renderPerkBuilderModal();
    });
    root.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-feat-id], [data-perk-id]");
      if (!card) return;
      event.preventDefault();
      card.click();
    });
  }
  function renderHero() {
    const mount = document.getElementById("heroPage");
    if (!mount) return;
    tableId = 0;
    const id = new URLSearchParams(location.search).get("id") || "warden";
    const hero = FH_DATA.heroes.find((item) => item.id === id);
    if (!hero) {
      mount.innerHTML = `<section class="compact-hero"><h1>${esc("Ничего не найдено")}</h1><a class="btn btn-primary detail-back" href="heroes.html">${backIcon()}<span>${esc("К списку героев")}</span></a></section>`;
      return;
    }
    activeHero = hero;
    activeMoves = heroMoveItems(hero).map(normalizedMove);
    activeFeats = heroFeatItems(hero);
    activePerks = heroPerkItems(hero);
    document.title = `${text(hero.name)} — ForHonorX`;
        const executionColumns = FH_EXECUTIONS_TABLE.columns();
    const punishColumns = [
      { key: "situation", asText: true }, { key: "punish", asText: true }, { key: "damage", type: "number" }, { key: "stamina", type: "number" }, { key: "comment", asText: true }
    ];
    const tabs = [
      { key: "overview", label: "Основная информация" }, { key: "moves", label: "Приёмы" }, { key: "executions", label: "Добивания" },
      { key: "punishments", label: "Наказание" }, { key: "feats", label: "Способности" }, { key: "perks", label: "Перки" }, { key: "guide", label: fieldLabel("Гайд") }, { key: "voice", label: "Озвучка" }
    ];
    const bannerUrl = FH.asset(hero.banner || hero.image);
    mount.innerHTML = `
      <a class="btn btn-ghost detail-back" href="heroes.html">${backIcon()}<span>${esc("К списку героев")}</span></a>
      <section class="detail-poster hero-detail-poster reveal is-visible" data-watermark="${esc(text(hero.name))}" style="--detail-bg: url('${esc(bannerUrl)}')">
        <img class="detail-poster-bg" src="${esc(bannerUrl)}" alt="" aria-hidden="true" onerror="this.closest('.detail-poster')?.classList.add('is-missing'); this.remove();">
        <div class="detail-poster-content"><div class="detail-poster-text"><p class="eyebrow">${esc(text(hero.faction))} · ${esc(text(FH.heroType(hero)))}</p><h1>${esc(text(hero.name))}</h1><div class="hero-poster-actions"><a class="btn btn-small btn-primary" href="compare.html?left=${encodeURIComponent(hero.id)}">${esc("Сравнить")}</a><a class="btn btn-small btn-primary" href="build.html?hero=${encodeURIComponent(hero.id)}">${esc("Подбор перков")}</a><a class="btn btn-small btn-primary" href="tierlists.html">${esc("Тир листы")}</a></div>${genderTags(hero)}</div></div>
        ${renderHeroTierRanks(hero.id)}
      </section>
      <section class="detail-section hero-tabs reveal is-visible">
        <div class="tabs-nav" role="tablist">${tabs.map((tab, index) => `<button class="tab-btn${index === 0 ? " is-active" : ""}" type="button" data-tab="${tab.key}" role="tab">${esc(tab.label)}</button>`).join("")}</div>
        <div class="tab-panel is-active" data-tab-panel="overview"><h2>${esc("Основная информация")}</h2><div class="hero-overview-layout">${renderHeroDescription(hero)}<aside class="hero-stats-panel"><div class="stat-grid hero-stat-list">${overviewStats(hero)}</div></aside><div class="hero-advice-panel"><div class="insight-grid"><article>${insightTitle("Сильные стороны")}${textList(hero.strengths)}</article><article>${insightTitle("Слабые стороны")}${textList(hero.weaknesses)}</article><article>${insightTitle("Советы новичку")}${textList(hero.beginnerTips)}</article><article>${insightTitle("Как играть против")}${textList(hero.counterTips)}</article></div></div></div></div>
        <div class="tab-panel" data-tab-panel="moves"><h2>${esc("Приёмы")}</h2>${renderMoves(hero)}</div>
        <div class="tab-panel" data-tab-panel="executions"><h2>${esc("Уникальные добивания")}</h2>${FH_EXECUTIONS_TABLE.render(hero.executions.unique, { search: true })}<h2>${esc("Общие добивания")}</h2>${FH_EXECUTIONS_TABLE.render(commonExecutionItems(hero), { search: true })}</div>
        <div class="tab-panel" data-tab-panel="punishments"><h2>${esc("Наказание")}</h2>${table(punishColumns, hero.punishments, { situationFilter: true, search: true })}</div>
        <div class="tab-panel" data-tab-panel="feats"><h2>${esc("Способности")}</h2>${renderFeats(hero)}</div>
        <div class="tab-panel" data-tab-panel="perks"><h2>${esc("Перки")}</h2>${renderPerks(hero)}</div>
        <div class="tab-panel" data-tab-panel="guide"><h2>${esc(fieldLabel("Гайд"))}</h2>${renderGuide(hero)}</div>
        <div class="tab-panel" data-tab-panel="voice"><h2>${esc("Озвучка")}</h2>${renderVoice(hero)}</div>
      </section>`;
    initTabs(mount);
    initSortableTables(mount);
    mount.querySelectorAll(".sortable-table").forEach((tableEl) => applyTableFilters(tableEl));
    bindHeroInteractions(mount);
    FH.scrollToHash?.();
  }
  document.addEventListener("DOMContentLoaded", renderHero);
})();
