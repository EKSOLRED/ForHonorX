(function () {
  let currentHelpers = [];
  let modalReady = false;

  function esc(value) { return FH.escape(value); }
  function text(value) { return FH.text(value); }
  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || name.slice(0, 2).toUpperCase();
  }
  function avatar(helper, name) {
    return helper.avatar
      ? `<div class="helper-avatar contributor-avatar has-image"><img src="${FH.asset(helper.avatar)}" alt="${esc(name)}"></div>`
      : `<div class="helper-avatar contributor-avatar">${esc(initials(name))}</div>`;
  }
  function socialLink(link) {
    const label = String(link.label || link.id || "").trim();
    const isDiscord = /discord/i.test(label) || /discord/i.test(String(link.url || ""));
    if (isDiscord) {
      return `<a class="social-icon contributor-discord-icon" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label || "Discord")}" data-tooltip="${esc(label || "Discord")}">
        <svg class="social-svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false"><path d="M55.91 25.549c-3.028-1.405-6.199-2.378-9.442-2.919-0.433 0.793-0.864 1.621-1.225 2.451-3.459-0.54-7.027-0.54-10.488 0-0.36-0.83-0.757-1.658-1.225-2.451-3.279 0.54-6.451 1.55-9.478 2.919-5.946 8.865-7.568 17.479-6.776 25.984v0c3.495 2.595 7.424 4.542 11.605 5.839 0.937-1.261 1.767-2.595 2.487-4.001-1.37-0.504-2.667-1.117-3.929-1.874 0.324-0.253 0.65-0.47 0.973-0.721 7.351 3.459 15.858 3.459 23.172 0 0.324 0.253 0.648 0.504 0.973 0.721-1.261 0.721-2.558 1.37-3.929 1.874 0.721 1.405 1.55 2.739 2.487 4.001 4.181-1.261 8.108-3.244 11.605-5.803v0c0.937-9.911-1.621-18.453-6.811-26.020zM32.413 46.307c-2.271 0-4.145-2.054-4.145-4.577s1.802-4.577 4.109-4.577 4.181 2.054 4.145 4.577-1.838 4.577-4.109 4.577zM47.621 46.307c-2.271 0-4.109-2.054-4.109-4.577s1.802-4.577 4.109-4.577 4.145 2.054 4.109 4.577-1.802 4.577-4.109 4.577z"></path></svg>
      </a>`;
    }
    return `<a class="btn btn-small" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(label || link.url)}</a>`;
  }
  function socials(helper) {
    return (helper.links || helper.socials || []).map(socialLink).join("");
  }
  function ensureModal() {
    if (modalReady) return;
    const node = document.createElement("div");
    node.id = "aboutHelperModal";
    node.className = "modal contributor-modal";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="modal-backdrop" data-about-helper-modal-close></div><article class="modal-card contributor-modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-about-helper-modal-close aria-label="Закрыть">×</button><div id="aboutHelperModalBody"></div></article>`;
    document.body.appendChild(node);
    node.addEventListener("click", (event) => {
      if (event.target.closest("[data-about-helper-modal-close]")) FH.closeDialog?.(node);
    });
    modalReady = true;
  }
  function openHelper(helper) {
    ensureModal();
    const name = text(helper.name);
    const body = document.getElementById("aboutHelperModalBody");
    body.innerHTML = `<div class="contributor-modal-head">${avatar(helper, name)}<div><p class="eyebrow">${esc(text(helper.type))}</p><h2>${esc(name)}</h2></div></div><div class="modal-effect-block"><span>${esc("Описание")}</span><p>${esc(text(helper.description))}</p></div>${helper.contribution ? `<div class="modal-effect-block"><span>${esc("Вклад")}</span><p>${esc(text(helper.contribution))}</p></div>` : ""}${socials(helper) ? `<div class="contributor-socials modal-socials">${socials(helper)}</div>` : ""}`;
    FH.openDialog?.(document.getElementById("aboutHelperModal"));
  }
  function openFromHash() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id || id === "project-shield") return;
    const index = currentHelpers.findIndex((helper) => helper.id === id);
    if (index < 0) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      openHelper(currentHelpers[index]);
    });
  }
  function renderHelpers() {
    const grid = document.getElementById("helpersGrid");
    if (!grid) return;
    currentHelpers = FH_DATA.helpers || [];
    grid.innerHTML = currentHelpers.map((helper, index) => {
      const name = text(helper.name);
      return `<article class="helper-card about-helper-link contributor-card project-shield-card reveal is-visible" id="${esc(helper.id)}" tabindex="0" role="button" data-helper-index="${index}" aria-label="${esc(name)}">${avatar(helper, name)}<div class="contributor-main"><p class="eyebrow">${esc(text(helper.type))}</p><h3>${esc(name)}</h3></div></article>`;
    }).join("");
    openFromHash();
  }
  document.addEventListener("DOMContentLoaded", () => {
    renderHelpers();
    const grid = document.getElementById("helpersGrid");
    grid?.addEventListener("click", (event) => {
      const card = event.target.closest("[data-helper-index]");
      if (!card) return;
      const helper = currentHelpers[Number(card.dataset.helperIndex)];
      if (helper) openHelper(helper);
    });
    grid?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-helper-index]");
      if (!card) return;
      event.preventDefault();
      const helper = currentHelpers[Number(card.dataset.helperIndex)];
      if (helper) openHelper(helper);
    });
  });
  window.addEventListener("hashchange", openFromHash);
})();
