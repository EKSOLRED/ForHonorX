/* global UI, FH_HEROES, FH_FACTIONS, FH_ROLES */
window.HomePage = (()=>{
  let state = { q: '', faction: 'all', role: 'all' };

  const FACTION_ICON = {
    all: 'assets/ui/icons/all.webp',
    knights: 'assets/ui/icons/knights.webp',
    vikings: 'assets/ui/icons/vikings.webp',
    samurai: 'assets/ui/icons/samurai.webp',
    wulin: 'assets/ui/icons/wulin.webp',
    outlanders: 'assets/ui/icons/outlanders.webp'
  };

  const ROLE_ICON = {
    all: '',
    vanguard: '',
    assassin: '',
    heavy: '',
    hybrid: ''
  };

  function applyPlaceholders(root){
    (root || document).querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const key = el.getAttribute('data-i18n-placeholder');
      if(key) el.setAttribute('placeholder', UI.t(key));
    });
  }

  function byFaction(list, faction){
    if(!faction || faction === 'all') return list;
    return list.filter(h => h.faction === faction);
  }

  function byRole(list, role){
    if(!role || role === 'all') return list;
    return list.filter(h => (h.role || '').toLowerCase() === role);
  }

  function byQuery(list, q){
    const query = (q || '').trim().toLowerCase();
    if(!query) return list;
    return list.filter(h => {
      const name = UI.t(h.nameKey).toLowerCase();
      const role = UI.t(h.roleKey).toLowerCase();
      return name.includes(query) || role.includes(query) || h.id.includes(query);
    });
  }

  function filterButton({ id, titleKey }, active, iconMap, onClick){
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'fbtn' + (active ? ' active' : '');
  b.setAttribute('aria-pressed', active ? 'true' : 'false');
  b.title = UI.t(titleKey);

  const ico = document.createElement('span');
  ico.className = 'ico';

  const iconVal = iconMap[id] || '';

  // 👉 если это путь к картинке (webp/png/svg)
  if (typeof iconVal === 'string' && iconVal.includes('/')) {
    const img = document.createElement('img');
    img.src = iconVal;
    img.alt = '';
    ico.appendChild(img);
  } else {
    // 👉 иначе показываем текст/эмодзи
    ico.textContent = iconVal || '•';
  }

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = UI.t(titleKey);

  b.appendChild(ico);
  b.appendChild(label);
  b.dataset.label = label.textContent;
  b.addEventListener('click', onClick);
  return b;
}

  function renderFilters(root){
  const factionRoot = root.querySelector('[data-faction-filters]');
  const roleRoot = root.querySelector('[data-role-filters]');
  if(!factionRoot || !roleRoot) return;

  factionRoot.innerHTML = '';
  roleRoot.innerHTML = '';

  // Factions (icon-only + tooltip text)
  FH_FACTIONS.forEach(f => {
    const fb = filterButton(
      f,
      state.faction === f.id,
      FACTION_ICON,
      ()=>{
        state.faction = f.id;
        render(root);
      },
      { svg: true }
    );
    fb.classList.add('icononly');
    factionRoot.appendChild(fb);
  });

  // Roles (оставляем текст как есть)
  FH_ROLES.forEach(r => {
    roleRoot.appendChild(filterButton(
      r,
      state.role === r.id,
      ROLE_ICON,
      ()=>{
        state.role = r.id;
        render(root);
      }
    ));
  });
}

  function heroCard(hero){
  const a = document.createElement('a');
  a.className = 'hero-card';
  a.href = `hero.html?id=${encodeURIComponent(hero.id)}`;

  const img = document.createElement('div');
  img.className = 'hero-img';
  const fallback = new URL('assets/img/placeholder-hero.svg', window.location.href).toString();
  const imgUrl = hero.img ? new URL(hero.img, window.location.href).toString() : fallback;
  img.style.setProperty('--img', `url('${imgUrl}')`);

  // ✅ ИКОНКА ФРАКЦИИ (в угол карточки)
  const factionIcon = document.createElement('img');
  factionIcon.className = 'hero-faction-icon';
  factionIcon.src = FACTION_ICON[hero.faction] || '';
  factionIcon.alt = '';

  const meta = document.createElement('div');
  meta.className = 'hero-meta';

  const name = document.createElement('div');
  name.className = 'hero-name';
  name.textContent = UI.t(hero.nameKey);

  const role = document.createElement('div');
  role.className = 'hero-role';
  role.textContent = UI.t(hero.roleKey);

  meta.appendChild(name);
  meta.appendChild(role);

  a.appendChild(img);

  // 👇 ВСТАВКА ИКОНКИ В КАРТОЧКУ
  a.appendChild(factionIcon);

  a.appendChild(meta);
  return a;
}

  function renderList(root){
    const grid = root.querySelector('[data-heroes]');
    const empty = root.querySelector('[data-empty]');
    if(!grid || !empty) return;

    const total = FH_HEROES.length;
    const list = byQuery(byRole(byFaction(FH_HEROES, state.faction), state.role), state.q);
    grid.innerHTML = '';

    const countEl = root.querySelector('[data-count]');
    const totalEl = root.querySelector('[data-total]');
    if(countEl) countEl.textContent = String(list.length);
    if(totalEl) totalEl.textContent = String(total);

    if(!list.length){
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.forEach(h => grid.appendChild(heroCard(h)));
  }

  function wireSearch(root){
    const input = root.querySelector('input[data-search]');
    const clear = root.querySelector('[data-clear]');

    if(input){
      input.value = state.q;
      input.oninput = () => {
        state.q = input.value;
        if(clear) clear.style.display = state.q ? 'inline-flex' : 'none';
        renderList(root);
      };
    }

    if(clear){
      clear.style.display = state.q ? 'inline-flex' : 'none';
      clear.onclick = () => {
        state.q = '';
        if(input) input.value = '';
        clear.style.display = 'none';
        renderList(root);
      };
    }

    const reset = root.querySelector('[data-reset]');
    if(reset){
      reset.onclick = () => {
        state = { q: '', faction: 'all', role: 'all' };
        if(input) input.value = '';
        if(clear) clear.style.display = 'none';
        render(root);
      };
    }
  }

  function render(root){
    applyPlaceholders(root);
    renderFilters(root);
    wireSearch(root);
    renderList(root);
  }

  function mount(){
    // IMPORTANT:
    // data-home-root is used on multiple blocks (header + heroes section).
    // We want one common root that contains BOTH the chips/search and the heroes grid.
    const root = document.querySelector('main.content') || document;
    if(!root) return;

    render(root);
  }

  window.addEventListener('fh:langchange', ()=>{
    mount();
  });

  return { mount };
})();
