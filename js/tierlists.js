(function () {
  const STORAGE_KEY = "fh-tierlist-custom-v1";
  const BG_KEY = "fh-tierlist-bg-v1";
  const POOL_KEY = "fh-tierlist-pool-order-v1";
  const TITLE_KEY = "fh-tierlist-title-v1";
  const defaultBg = "#15110e";
  const defaultRows = [
    { label: "S", color: "#c94f4f", heroes: [] },
    { label: "A", color: "#d99d45", heroes: [] },
    { label: "B", color: "#82c77e", heroes: [] },
    { label: "C", color: "#6f8193", heroes: [] },
    { label: "D", color: "#6c5c4e", heroes: [] },
    { label: "E", color: "#4f5964", heroes: [] },
    { label: "F", color: "#3f3832", heroes: [] }
  ];

  const uid = () => `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const esc = (value) => FH.escape(value);
  const text = (value) => FH.text(value);
  const heroes = () => FH_DATA.heroCatalog || FH_DATA.heroes || [];
  const heroById = (id) => heroes().find((hero) => hero.id === id) || null;

  function helperById(id) {
    return (FH_DATA.helpers || []).find((helper) => helper.id === id) || null;
  }

  function listCreators(list) {
    const ids = list.sourceIds || list.creatorIds || list.creators || ["dishonor"];
    return ids.map((id) => typeof id === "string" ? helperById(id) : id).filter(Boolean);
  }

  function proCreatorBadge(list) {
    const creators = listCreators(list);
    if (!creators.length) return "";
    const prefix = "Тир лист составлен";
    const names = creators.map((item) => text(item.name)).join(" · ");
    const links = creators.map((item) => `<a href="${FH.pagePath("about.html")}#${esc(item.id)}">${esc(text(item.name))}</a>`).join('<span aria-hidden="true"> · </span>');
    return `<span class="verified-source tierlist-source tierlist-source-star" tabindex="0" aria-label="${esc(prefix)}: ${esc(names)}">
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="m12 3 2.35 5.1 5.58.66-4.12 3.8 1.1 5.48L12 15.27 7.09 18.04l1.1-5.48-4.12-3.8 5.58-.66L12 3Z"></path></svg>
      <span class="verified-tooltip" role="tooltip"><strong>${esc(prefix)}</strong><span>${links}</span></span>
    </span>`;
  }

  let customRows = loadRows();
  let customBg = localStorage.getItem(BG_KEY) || defaultBg;
  let customTitle = localStorage.getItem(TITLE_KEY) || "";
  let poolOrder = loadPoolOrder();
  let dragHeroId = null;
  let touchHeroId = null;
  let touchMoved = false;

  function normalizeRows(rows) {
    return (rows || []).map((row, index) => ({
      id: row.id || uid(),
      label: String(row.label || defaultRows[index]?.label || "Tier"),
      color: row.color || defaultRows[index]?.color || "#6c5c4e",
      heroes: Array.isArray(row.heroes) ? [...new Set(row.heroes.filter(Boolean))] : []
    }));
  }

  function loadRows() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved) && saved.length) return normalizeRows(saved);
    } catch (error) {}
    return normalizeRows(defaultRows);
  }

  function saveRows() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRows));
    localStorage.setItem(BG_KEY, customBg);
    localStorage.setItem(TITLE_KEY, customTitle);
  }

  function allHeroIds() {
    return heroes().map((hero) => hero.id).filter(Boolean);
  }

  function normalizePoolOrder(ids) {
    const all = allHeroIds();
    const known = new Set(all);
    const cleaned = (Array.isArray(ids) ? ids : []).filter((id) => known.has(id));
    const merged = [...cleaned, ...all.filter((id) => !cleaned.includes(id))];
    return [...new Set(merged)];
  }

  function loadPoolOrder() {
    try {
      return normalizePoolOrder(JSON.parse(localStorage.getItem(POOL_KEY) || "null"));
    } catch (error) {
      return normalizePoolOrder([]);
    }
  }

  function savePoolOrder() {
    poolOrder = normalizePoolOrder(poolOrder);
    localStorage.setItem(POOL_KEY, JSON.stringify(poolOrder));
  }

  function iconButton(className, attr, label, icon) {
    return `<button class="tier-icon-btn fx-tooltip-source ${className}" type="button" ${attr} aria-label="${esc(label)}"><span aria-hidden="true">${icon}</span><span class="fx-tooltip" role="tooltip">${esc(label)}</span></button>`;
  }

  function heroToken(hero, options = {}) {
    if (!hero) return "";
    const draggable = options.draggable ? "true" : "false";
    const image = FH.localImage(hero.image || hero.banner, text(hero.name)).replace("<img ", "<img draggable=\"false\" ");
    return `<button class="tier-hero-token" type="button" draggable="${draggable}" data-hero-id="${esc(hero.id)}" title="${esc(text(hero.name))}" aria-label="${esc(text(hero.name))}">
      ${image}
    </button>`;
  }

  function renderRows(rows, options = {}) {
    const editable = Boolean(options.editable);
    const locked = Boolean(options.locked);
    return `<div class="tier-table${locked ? " tier-table-locked" : ""}" style="--tier-table-bg:${esc(options.background || defaultBg)};">
      ${rows.map((row, index) => {
        const rowId = row.id || `fixed-${index}`;
        const label = editable ? esc(row.label) : esc(text(row.label));
        const tokens = (row.heroes || []).map((id) => heroToken(heroById(id), { draggable: editable })).join("");
        const empty = editable && !tokens ? `<span class="tier-drop-empty">${esc("Перетащи героев сюда")}</span>` : "";
        const tools = editable ? `<div class="tier-row-tools">
          ${iconButton("is-settings", `data-row-settings=\"${esc(rowId)}\"`, "Настройки строки", "⚙")}
          ${iconButton("", `data-row-clear=\"${esc(rowId)}\"`, "Очистить строку", "🧽")}
          ${iconButton("", `data-row-move-up=\"${esc(rowId)}\"`, "Переместить выше", "↑")}
          ${iconButton("", `data-row-move-down=\"${esc(rowId)}\"`, "Переместить ниже", "↓")}
          ${iconButton("is-danger", `data-row-delete=\"${esc(rowId)}\"`, "Удалить строку", "🗑")}
        </div>` : `<div class="tier-row-tools tier-row-tools-locked" aria-hidden="true"></div>`;
        return `<div class="tier-table-row${locked ? " is-locked" : ""}" data-row-id="${esc(rowId)}">
          <div class="tier-label-cell" style="--tier-label-color:${esc(row.color || "#6c5c4e")};" ${editable ? `contenteditable="true" spellcheck="false" data-row-label="${esc(rowId)}" aria-label="${esc("Название")}"` : ""}>${label}</div>
          <div class="tier-dropzone" data-tier-dropzone="${esc(rowId)}">${tokens}${empty}</div>
          ${tools}
        </div>`;
      }).join("")}
    </div>`;
  }

  function renderProfessional() {
    const mount = document.getElementById("professionalTierlists");
    if (!mount) return;
    const lists = FH_DATA.tierLists || [];
    mount.innerHTML = lists.map((list) => `<article class="tierlist-card" id="${esc(list.id)}">
      <div class="tierlist-card-head">
        <div class="tierlist-title-line">
          <h2>${esc(text(list.title))}</h2>
          ${proCreatorBadge(list)}
        </div>
        <button class="btn btn-primary btn-small" type="button" data-download-pro="${esc(list.id)}">${esc("Скачать изображение")}</button>
      </div>
      ${renderRows(list.rows || [], { locked: true, mode: list.mode, background: list.background })}
    </article>`).join("") || FH.empty();
  }

  function usedHeroIds() {
    return new Set(customRows.flatMap((row) => row.heroes || []));
  }

  function renderCustom() {
    const mount = document.getElementById("customTierlist");
    if (!mount) return;
    poolOrder = normalizePoolOrder(poolOrder);
    const used = usedHeroIds();
    const pool = poolOrder.map((id) => heroById(id)).filter((hero) => hero && !used.has(hero.id));
    mount.innerHTML = `<label class="tier-custom-title"><span>${esc("Название тир листа")}</span><input type="text" value="${esc(customTitle)}" data-custom-tier-title placeholder="${esc("Например: Мой тир лист 4x4")}"></label>
    <div class="tier-editor-actions">
      <button class="btn btn-primary" type="button" data-download-custom>${esc("Скачать изображение")}</button>
      <button class="btn btn-ghost" type="button" data-reset-custom>${esc("Сбросить")}</button>
      <label class="btn btn-ghost tier-bg-button"><span>${esc("Поменять фон таблицы")}</span><input type="color" value="${esc(customBg)}" data-table-bg aria-label="${esc("Поменять фон таблицы")}"></label>
    </div>
    <div id="customTierTableWrap">${renderRows(customRows, { editable: true, background: customBg })}</div>
    <div class="tier-hero-pool" data-tier-pool>${pool.map((hero) => heroToken(hero, { draggable: true })).join("")}</div>`;
  }

  function setActiveTab(key) {
    document.querySelectorAll("[data-tier-tab]").forEach((button) => {
      const active = button.dataset.tierTab === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-tier-panel]").forEach((panel) => {
      const active = panel.dataset.tierPanel === key;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  }

  function removeHeroEverywhere(heroId) {
    customRows.forEach((row) => { row.heroes = (row.heroes || []).filter((id) => id !== heroId); });
  }

  function insertNear(list, heroId, nearId, after) {
    const cleaned = list.filter((id) => id !== heroId);
    const index = nearId ? cleaned.indexOf(nearId) : -1;
    if (index < 0) cleaned.push(heroId);
    else cleaned.splice(index + (after ? 1 : 0), 0, heroId);
    return [...new Set(cleaned)];
  }

  function getPlacementFromTarget(target, clientX, heroId = dragHeroId) {
    const token = target?.closest?.(".tier-hero-token");
    if (!token || token.dataset.heroId === heroId) return { nearId: null, after: false };
    const rect = token.getBoundingClientRect();
    const after = clientX > rect.left + rect.width / 2;
    return { nearId: token.dataset.heroId, after };
  }

  function clearDropPreview() {
    document.querySelectorAll(".tier-drop-placeholder").forEach((node) => node.remove());
  }

  function updateDropPreview(target, clientX, heroId = dragHeroId || touchHeroId) {
    const zone = target?.closest?.("[data-tier-dropzone], [data-tier-pool]");
    if (!zone || !heroId) return;
    let placeholder = document.querySelector(".tier-drop-placeholder");
    if (!placeholder) {
      placeholder = document.createElement("span");
      placeholder.className = "tier-drop-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
    }
    const token = target?.closest?.(".tier-hero-token");
    if (token && token.dataset.heroId !== heroId && zone.contains(token)) {
      const rect = token.getBoundingClientRect();
      const after = clientX > rect.left + rect.width / 2;
      token.insertAdjacentElement(after ? "afterend" : "beforebegin", placeholder);
    } else {
      zone.appendChild(placeholder);
    }
  }

  function getPlacement(event) {
    return getPlacementFromTarget(event.target, event.clientX, dragHeroId);
  }

  function moveHeroToRow(heroId, rowId, placement = {}) {
    if (!heroId || !heroById(heroId)) return;
    removeHeroEverywhere(heroId);
    const row = customRows.find((item) => item.id === rowId);
    if (row) row.heroes = insertNear(row.heroes || [], heroId, placement.nearId, placement.after);
    saveRows();
    renderCustom();
  }

  function moveHeroToPool(heroId, placement = {}) {
    if (!heroId || !heroById(heroId)) return;
    removeHeroEverywhere(heroId);
    poolOrder = insertNear(poolOrder, heroId, placement.nearId, placement.after);
    saveRows();
    savePoolOrder();
    renderCustom();
  }

  function newRow() {
    return { id: uid(), label: "Новый", color: "#6c5c4e", heroes: [] };
  }

  function mutateRow(rowId, action) {
    const index = customRows.findIndex((row) => row.id === rowId);
    if (index < 0) return;
    if (action === "above") customRows.splice(index, 0, newRow());
    if (action === "below") customRows.splice(index + 1, 0, newRow());
    if (action === "clear") customRows[index].heroes = [];
    if (action === "delete" && customRows.length > 1) customRows.splice(index, 1);
    if (action === "up" && index > 0) [customRows[index - 1], customRows[index]] = [customRows[index], customRows[index - 1]];
    if (action === "down" && index < customRows.length - 1) [customRows[index], customRows[index + 1]] = [customRows[index + 1], customRows[index]];
    saveRows();
    renderCustom();
  }

  function resetCustom() {
    customRows = normalizeRows(defaultRows);
    customBg = defaultBg;
    customTitle = "";
    poolOrder = normalizePoolOrder([]);
    saveRows();
    savePoolOrder();
    renderCustom();
  }

  function listForDownload(id) {
    if (id === "custom") {
      const fallback = "Мой тир лист";
      const title = customTitle.trim() || fallback;
      return { id: "custom-tierlist", title, background: customBg, rows: customRows };
    }
    return (FH_DATA.tierLists || []).find((list) => list.id === id) || null;
  }

  function openModal(content, className = "") {
    const old = document.getElementById("tierModal");
    old?.remove();
    const modal = document.createElement("div");
    modal.id = "tierModal";
    modal.className = `modal tier-editor-modal ${className}`.trim();
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `<div class="modal-backdrop" data-tier-modal-close></div><div class="modal-card tier-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-tier-modal-close aria-label="Закрыть">×</button>${content}</div>`;
    document.body.appendChild(modal);
    FH.openDialog(modal, modal.querySelector(".modal-close"));
  }

  function closeModal() {
    const modal = document.getElementById("tierModal");
    if (!modal) return;
    FH.closeDialog(modal, { restoreFocus: false });
    modal.remove();
  }

  function openRowSettings(rowId) {
    const row = customRows.find((item) => item.id === rowId);
    if (!row) return;
    openModal(`<div class="item-modal-header"><p class="modal-breadcrumb">${esc("Настройки строки")}</p><h2 data-modal-row-title="${esc(rowId)}">${esc(row.label)}</h2></div>
      <div class="tier-settings-form">
        <label class="tier-settings-label"><span>${esc("Название")}</span><input type="text" value="${esc(row.label)}" data-modal-row-label="${esc(rowId)}"></label>
        <div class="tier-settings-color-line">
          <span>${esc("Цвет строки")}</span>
          <input class="tier-color-square" type="color" value="${esc(row.color || "#6c5c4e")}" data-modal-row-color="${esc(rowId)}" title="${esc("Цвет строки")}" aria-label="${esc("Цвет строки")}">
          <button class="btn btn-ghost btn-small" type="button" data-row-add-above="${esc(rowId)}">${esc("Добавить строку выше")}</button>
          <button class="btn btn-ghost btn-small" type="button" data-row-add-below="${esc(rowId)}">${esc("Добавить строку ниже")}</button>
        </div>
      </div>`);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function wrapText(ctx, text, maxWidth) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) line = next;
      else {
        if (line) lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function drawHeroPortrait(ctx, img, x, y, width, height) {
    const baseScale = Math.max(width / img.width, height / img.height);
    const zoom = 2.42;
    const scale = baseScale * zoom;
    const sw = Math.min(img.width, width / scale);
    const sh = Math.min(img.height, height / scale);
    const sx = Math.max(0, Math.min(img.width - sw, (img.width - sw) * 0.5));
    const sy = Math.max(0, Math.min(img.height - sh, img.height * 0.035));
    ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
  }

  async function createTierImage(list) {
    if (!list) return null;
    const rows = normalizeRows((list.rows || []).map((row) => ({ ...row, label: text(row.label) })));
    const width = 1500;
    const padding = 28;
    const titleHeight = 78;
    const labelWidth = 126;
    const watermarkWidth = 170;
    const gap = 10;
    const icon = 104;
    const tableWidth = width - padding * 2;
    const heroAreaWidth = tableWidth - labelWidth - watermarkWidth;
    const iconsPerLine = Math.max(1, Math.floor((heroAreaWidth - gap) / (icon + gap)));
    const heights = rows.map((row) => {
      const lines = Math.max(1, Math.ceil((row.heroes || []).length / iconsPerLine));
      return Math.max(104, lines * (icon + gap) + gap);
    });
    const tableHeight = heights.reduce((sum, item) => sum + item, 0);
    const height = titleHeight + tableHeight + padding;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = list.background || customBg || defaultBg;
    ctx.fillRect(0, 0, width, height);
    const imageTitle = String(list.id || "").startsWith("pro-") ? text(list.mode || list.title) : text(list.title);
    ctx.fillStyle = "#f5ead8";
    ctx.font = "900 46px Segoe UI, Arial, sans-serif";
    ctx.fillText(imageTitle, padding, 58);

    const tableX = padding;
    const tableY = titleHeight;
    const watermarkX = tableX + labelWidth + heroAreaWidth;
    ctx.fillStyle = "rgba(0, 0, 0, .22)";
    ctx.fillRect(watermarkX, tableY, watermarkWidth, tableHeight);
    const imageCache = new Map();
    let y = tableY;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const rowHeight = heights[rowIndex];
      ctx.fillStyle = row.color || "#6c5c4e";
      ctx.fillRect(tableX, y, labelWidth, rowHeight);
      ctx.fillStyle = "#140f0c";
      ctx.font = "900 18px Segoe UI, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelLines = wrapText(ctx, row.label, labelWidth - 20).slice(0, 3);
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText(line, tableX + labelWidth / 2, y + rowHeight / 2 + (lineIndex - (labelLines.length - 1) / 2) * 20);
      });
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(255, 228, 184, .08)";
      ctx.fillRect(tableX + labelWidth, y, heroAreaWidth, rowHeight);

      for (let index = 0; index < (row.heroes || []).length; index += 1) {
        const hero = heroById(row.heroes[index]);
        if (!hero) continue;
        const col = index % iconsPerLine;
        const line = Math.floor(index / iconsPerLine);
        const x = tableX + labelWidth + gap + col * (icon + gap);
        const iy = y + gap + line * (icon + gap);
        const src = FH.asset(hero.image || hero.banner);
        if (!imageCache.has(src)) imageCache.set(src, await loadImage(src));
        const img = imageCache.get(src);
        roundedRect(ctx, x, iy, icon, icon, 16);
        ctx.save();
        ctx.clip();
        if (img) drawHeroPortrait(ctx, img, x, iy, icon, icon);
        else {
          ctx.fillStyle = "#2b2119";
          ctx.fillRect(x, iy, icon, icon);
        }
        ctx.restore();
        ctx.strokeStyle = "rgba(255, 207, 119, .34)";
        ctx.lineWidth = 2;
        roundedRect(ctx, x, iy, icon, icon, 16);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255, 228, 184, .18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, y, labelWidth + heroAreaWidth, rowHeight);
      y += rowHeight;
    }

    ctx.save();
    ctx.translate(watermarkX + watermarkWidth / 2, tableY + tableHeight / 2);
    ctx.fillStyle = "rgba(217, 157, 69, .22)";
    ctx.beginPath();
    ctx.arc(0, -22, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 207, 119, .45)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 207, 119, .92)";
    ctx.font = "900 44px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("X", 0, -20);
    ctx.fillStyle = "rgba(245, 234, 216, .86)";
    ctx.font = "900 24px Segoe UI, Arial, sans-serif";
    ctx.fillText("ForHonorX", 0, 42);
    ctx.restore();

    const safeName = String(imageTitle || "tier-list").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "");
    return { dataUrl: canvas.toDataURL("image/png"), fileName: `${safeName || "tier-list"}.png`, width, height };
  }

  async function previewTierImage(list) {
    const image = await createTierImage(list);
    if (!image) return;
    openModal(`<div class="item-modal-header"><p class="modal-breadcrumb">${esc("Предпросмотр")}</p><h2>${esc("Скачать изображение")}</h2></div>
      <div class="tier-image-preview"><img src="${image.dataUrl}" width="${esc(image.width)}" height="${esc(image.height)}" alt="${esc("Предпросмотр")}"></div>
      <div class="tier-preview-actions"><a class="btn btn-primary" href="${image.dataUrl}" download="${esc(image.fileName)}">${esc("Скачать изображение")}</a></div>`, "tier-preview-modal");
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-tier-modal-close]")) closeModal();

      const tab = event.target.closest("[data-tier-tab]");
      if (tab) setActiveTab(tab.dataset.tierTab);

      const proDownload = event.target.closest("[data-download-pro]");
      if (proDownload) previewTierImage(listForDownload(proDownload.dataset.downloadPro));

      if (event.target.closest("[data-download-custom]")) previewTierImage(listForDownload("custom"));
      if (event.target.closest("[data-reset-custom]")) resetCustom();

      const settings = event.target.closest("[data-row-settings]");
      const above = event.target.closest("[data-row-add-above]");
      const below = event.target.closest("[data-row-add-below]");
      const clear = event.target.closest("[data-row-clear]");
      const del = event.target.closest("[data-row-delete]");
      const up = event.target.closest("[data-row-move-up]");
      const down = event.target.closest("[data-row-move-down]");
      if (settings) openRowSettings(settings.dataset.rowSettings);
      if (above) { mutateRow(above.dataset.rowAddAbove, "above"); closeModal(); }
      if (below) { mutateRow(below.dataset.rowAddBelow, "below"); closeModal(); }
      if (clear) mutateRow(clear.dataset.rowClear, "clear");
      if (del) mutateRow(del.dataset.rowDelete, "delete");
      if (up) mutateRow(up.dataset.rowMoveUp, "up");
      if (down) mutateRow(down.dataset.rowMoveDown, "down");
    });

    document.addEventListener("input", (event) => {
      const label = event.target.closest("[data-row-label]");
      if (label) {
        const row = customRows.find((item) => item.id === label.dataset.rowLabel);
        if (row) {
          row.label = label.textContent.trim() || "Название";
          saveRows();
        }
      }
      const modalLabel = event.target.closest("[data-modal-row-label]");
      if (modalLabel) {
        const row = customRows.find((item) => item.id === modalLabel.dataset.modalRowLabel);
        if (row) {
          row.label = modalLabel.value.trim() || "Название";
          saveRows();
          const title = document.querySelector(`[data-modal-row-title="${CSS.escape(row.id)}"]`);
          if (title) title.textContent = row.label;
          const cell = document.querySelector(`[data-row-label="${CSS.escape(row.id)}"]`);
          if (cell) cell.textContent = row.label;
        }
      }
      const modalColor = event.target.closest("[data-modal-row-color]");
      if (modalColor) {
        const row = customRows.find((item) => item.id === modalColor.dataset.modalRowColor);
        if (row) {
          row.color = modalColor.value;
          saveRows();
          const cell = document.querySelector(`[data-row-label="${CSS.escape(row.id)}"]`);
          if (cell) cell.style.setProperty("--tier-label-color", row.color);
        }
      }
      const customTitleInput = event.target.closest("[data-custom-tier-title]");
      if (customTitleInput) {
        customTitle = customTitleInput.value;
        saveRows();
      }
      const bg = event.target.closest("[data-table-bg]");
      if (bg) {
        customBg = bg.value;
        saveRows();
        const table = document.querySelector("#customTierTableWrap .tier-table");
        if (table) table.style.setProperty("--tier-table-bg", customBg);
      }
    });

    document.addEventListener("keydown", (event) => {
      const label = event.target.closest("[data-row-label]");
      if (label && event.key === "Enter") {
        event.preventDefault();
        label.blur();
      }
    });

    document.addEventListener("dragstart", (event) => {
      if (event.target.closest(".tier-table-locked .tier-hero-token, .tier-table-locked .tier-hero-token img")) {
        event.preventDefault();
        return;
      }
      const token = event.target.closest(".tier-hero-token[draggable='true']");
      if (!token) return;
      dragHeroId = token.dataset.heroId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dragHeroId);
      const rect = token.getBoundingClientRect();
      const ghost = token.cloneNode(true);
      ghost.className = "tier-hero-token tier-drag-ghost";
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.position = "fixed";
      ghost.style.left = "-10000px";
      ghost.style.top = "-10000px";
      ghost.style.pointerEvents = "none";
      ghost.style.transform = "none";
      ghost.style.opacity = "1";
      ghost.style.overflow = "hidden";
      document.body.appendChild(ghost);
      try { event.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2); } catch (error) {}
      window.setTimeout(() => ghost.remove(), 120);
      token.classList.add("is-dragging");
    });

    document.addEventListener("dragend", (event) => {
      const token = event.target.closest(".tier-hero-token");
      token?.classList.remove("is-dragging");
      document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
      clearDropPreview();
      dragHeroId = null;
    });

    document.addEventListener("dragover", (event) => {
      const zone = event.target.closest("[data-tier-dropzone], [data-tier-pool]");
      if (!zone) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
      zone.classList.add("is-drop-target");
      updateDropPreview(event.target, event.clientX, dragHeroId);
    });

    document.addEventListener("dragleave", (event) => {
      const zone = event.target.closest("[data-tier-dropzone], [data-tier-pool]");
      if (zone && !zone.contains(event.relatedTarget)) {
        zone.classList.remove("is-drop-target");
        clearDropPreview();
      }
    });

    document.addEventListener("drop", (event) => {
      const targetRow = event.target.closest("[data-tier-dropzone]");
      const pool = event.target.closest("[data-tier-pool]");
      if (!targetRow && !pool) return;
      event.preventDefault();
      const heroId = event.dataTransfer.getData("text/plain") || dragHeroId;
      const placement = getPlacement(event);
      if (targetRow) moveHeroToRow(heroId, targetRow.dataset.tierDropzone, placement);
      if (pool) moveHeroToPool(heroId, placement);
      document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
      clearDropPreview();
    });

    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      const token = event.target.closest(".tier-hero-token[draggable='true']");
      if (!token) return;
      touchHeroId = token.dataset.heroId;
      touchMoved = false;
      token.classList.add("is-dragging");
      token.setPointerCapture?.(event.pointerId);
    }, { passive: true });

    document.addEventListener("pointermove", (event) => {
      if (!touchHeroId || event.pointerType === "mouse") return;
      touchMoved = true;
      event.preventDefault();
      const target = document.elementFromPoint(event.clientX, event.clientY);
      document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
      target?.closest?.("[data-tier-dropzone], [data-tier-pool]")?.classList.add("is-drop-target");
      clearDropPreview();
      updateDropPreview(target, event.clientX, touchHeroId);
    }, { passive: false });

    document.addEventListener("pointerup", (event) => {
      if (!touchHeroId || event.pointerType === "mouse") return;
      const heroId = touchHeroId;
      document.querySelectorAll(".tier-hero-token.is-dragging").forEach((node) => node.classList.remove("is-dragging"));
      document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
      clearDropPreview();
      touchHeroId = null;
      if (!touchMoved) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const targetRow = target?.closest?.("[data-tier-dropzone]");
      const pool = target?.closest?.("[data-tier-pool]");
      const placement = getPlacementFromTarget(target, event.clientX, heroId);
      if (targetRow) moveHeroToRow(heroId, targetRow.dataset.tierDropzone, placement);
      else if (pool) moveHeroToPool(heroId, placement);
    }, { passive: true });

    document.addEventListener("pointercancel", () => {
      touchHeroId = null;
      touchMoved = false;
      document.querySelectorAll(".tier-hero-token.is-dragging").forEach((node) => node.classList.remove("is-dragging"));
      document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
      clearDropPreview();
    });
  }

  function render() {
    poolOrder = normalizePoolOrder(poolOrder);
    renderProfessional();
    renderCustom();
  }

  function init() {
    if (!document.querySelector(".tierlists-page")) return;
    render();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
