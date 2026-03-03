/* global UI, FH_HEROES */
window.HeroPage = (()=>{
  function qs(){ return new URLSearchParams(location.search); }

  function getHeroMeta(id){
    return (window.FH_HEROES || FH_HEROES).find(h => h.id === id);
  }

  function ensureDataLoaded(heroMeta){
    return new Promise((resolve, reject)=>{
      const existing = window.FH_HERO_DATA?.[heroMeta.id];
      if(existing) return resolve(existing);

      const src = heroMeta.dataFile;
      if(!src) return reject(new Error('No dataFile for hero'));

      // avoid duplicate injection
      if(document.querySelector(`script[data-hero-data="${heroMeta.id}"]`)){
        const t = setInterval(()=>{
          const d = window.FH_HERO_DATA?.[heroMeta.id];
          if(d){ clearInterval(t); clearTimeout(to); resolve(d); }
        }, 25);
        const to = setTimeout(()=>{
          clearInterval(t);
          reject(new Error(`Timeout waiting for hero data: ${heroMeta.id}`));
        }, 5000);
        return;
      }

      const s = document.createElement('script');
      s.src = src;
      // NOTE: dynamic scripts don't reliably respect "defer" the same way as in static HTML.
      // We still keep the load listener + fallback polling to guarantee the data exists.
      s.dataset.heroData = heroMeta.id;
      const done = (fn)=>{
        try{ fn(); } catch(e){ reject(e); }
      };

      const pollAfterLoad = ()=>{
        const d = window.FH_HERO_DATA?.[heroMeta.id];
        if(d) return resolve(d);

        // Some browsers execute the script slightly after load; give it a moment.
        const t = setInterval(()=>{
          const x = window.FH_HERO_DATA?.[heroMeta.id];
          if(x){ clearInterval(t); clearTimeout(to); resolve(x); }
        }, 25);

        const to = setTimeout(()=>{
          clearInterval(t);
          reject(new Error(`Hero data loaded but did not register FH_HERO_DATA['${heroMeta.id}']`));
        }, 1500);
      };

      s.onload = ()=> done(pollAfterLoad);
      s.onerror = ()=> reject(new Error(`Failed to load hero data script: ${src}`));
      document.head.appendChild(s);

      // absolute safety timeout
      setTimeout(()=>{
        if(!window.FH_HERO_DATA?.[heroMeta.id]){
          reject(new Error(`Timeout loading hero data: ${heroMeta.id}`));
        }
      }, 7000);
    });
  }

  function setText(el, value){
    if(!el) return;
    el.textContent = value;
  }

  function tLocal(obj){
    const lang = UI.getLang();
    if(!obj) return '';
    return lang === 'en' ? (obj.en ?? '') : (obj.ru ?? '');
  }

  function escapeHtml(str){
    return String(str ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }


  // === Chevron morph helper (global inside HeroPage module) ===
  function pulseChevron(el, dir){ // dir: 'up' | 'down'
    if(!el) return;
    const up = dir === 'up';

    // Persist direction (CSS transition handles smooth morph)
    el.classList.toggle('dir-up', up);
    el.classList.toggle('dir-down', !up);

    // Nudge: if the element was just inserted, transitions may not run.
    // We only force a reflow when direction actually changes.
    const next = up ? 'up' : 'down';
    if(el.__fhDir !== next){
      el.__fhDir = next;
      void el.offsetWidth;
    }
  }






// Perk type labels (easy to extend)
// Add new types here, then use `type: "<key>"` in hero data.
const PERK_TYPE_MAP = {
  offense: { ru: 'Атака', en: 'Offense' },
  defense: { ru: 'Защита', en: 'Defense' },
  support: { ru: 'Поддержка', en: 'Support' },
};

function perkTypeLabel(type){
  const lang = UI.getLang();
  const row = PERK_TYPE_MAP[type];
  if(row) return lang === 'en' ? row.en : row.ru;
  return type || '';
}

  function mountTabs(root){
    const buttons = root.querySelectorAll('.tabbtn');
    const contents = root.querySelectorAll('.tabcontent');

    function setActive(tab){
      buttons.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      contents.forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
    }

    buttons.forEach(b => b.addEventListener('click', ()=> setActive(b.dataset.tab)));
  }

  function renderMoves(root, data){
  const host = root.querySelector('[data-moves-list]');
  const lang = UI.getLang();
  if(!host) return;

  const heroId =
  data?.meta?.id ||
  data?.id ||
  data?.key ||
  data?.slug ||
  '';

  const sections = data.moves?.sections || [];
  if(!sections.length){
    host.innerHTML = `<div class="notice">${lang==='en' ? 'No move data yet.' : 'Пока нет данных по приёмам.'}</div>`;
    return;
  }

  // Поля в карточках
  const FIELD_LABELS = {
    activation: { ru: 'Активация', en: 'Activation' },
    windowactive: {ru: 'Окно активации', en: 'Input window'},
    side: { ru: 'Сторона атаки', en: 'Attack side' },
    stun: { ru: 'Оглушение', en: 'Stun' },
    special: { ru: 'Особенность', en: 'Special Ability' },
    property: { ru: 'Свойства', en: 'Properties' },
    superiorblockw: { ru: 'Надежная защита', en: 'Superior block' },
    note: { ru: 'Заметка', en: 'Note' },
  };
  // Поля в карточках (обязательно добавить и сюда)
  const FIELD_ORDER = ['activation','windowactive','side','stun','special','property','superiorblockw'];

  function labelFor(key){
    const row = FIELD_LABELS[key];
    if(row) return lang === 'en' ? row.en : row.ru;
    // fallback: pretty-print unknown keys (easy to add new fields without touching JS)
    const s = String(key||'').replace(/[_-]+/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').trim();
    if(!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function fmtStat(key, val){
    if(val === undefined || val === null || val === '') return null;
    // keep numbers as-is
    const v = typeof val === 'number' ? String(val) : String(val);
    const unit = key === 'speed' ? (lang==='en' ? 'ms' : 'мс') : '';
    return v + unit;
  }

  function statLabel(key){
    if(key === 'damage') return lang==='en' ? 'DMG' : 'Урон';
    if(key === 'stamina') return lang==='en' ? 'Stam' : 'Выносл.';
    if(key === 'speed') return lang==='en' ? 'Speed' : 'Скорость';
    return key;
  }

  host.innerHTML = '';

sections.forEach((sec, idx)=>{
  const acc = document.createElement('details');
  acc.className = 'move-acc';

  // default: все секции открыты; запоминаем состояние per-hero + per-section
  const secId = sec.id || String(idx);
  acc.setAttribute('data-sec-id', secId);

  const storeKey = `fh_moves_open:${heroId}:${secId}`;
  const saved = localStorage.getItem(storeKey);
  acc.open = (saved === null) ? true : (saved === '1');

  acc.addEventListener('toggle', () => {
    try { localStorage.setItem(storeKey, acc.open ? '1' : '0'); } catch(e) {}
    // animate chevron morph on open/close
    pulseChevron(acc.querySelector('.move-acc-chev'), acc.open ? 'up' : 'down');
  });

const sum = document.createElement('summary');
  sum.className = 'move-acc-title';
  sum.innerHTML = `<span class="move-acc-text"></span><span class="move-acc-chev">▾</span>`;
    sum.querySelector('.move-acc-text').textContent = tLocal(sec.title) || '';
  acc.appendChild(sum);
  // initial chevron direction
  pulseChevron(sum.querySelector('.move-acc-chev'), acc.open ? 'up' : 'down');

  const body = document.createElement('div');
  body.className = 'move-acc-body';

  const grid = document.createElement('div');
  grid.className = 'card-grid move-grid';

  (sec.cards || []).forEach(mv=>{
    const card = document.createElement('article');
    card.className = 'card-item move-card';
    // store raw object for modal + language rerender
    const key = `${sec.id || ''}::${mv.id || ''}::${mv.icon || ''}::${mv.damage ?? ''}::${mv.speed ?? ''}`;
    mv.__key = key;
    mv.__secId = sec.id || '';
    card.__fhData = mv;

    const top = document.createElement('div');
    top.className = 'move-top';

    const left = document.createElement('div');
    left.className = 'move-left';

    const ico = document.createElement('div');
    ico.className = 'move-ico';

    // если иконки нет — оставляем пустой блок (место сохраняется)
    if(mv.icon){
      if(typeof mv.icon === 'string' && mv.icon.includes('/')){
        const img = document.createElement('img');
        img.src = mv.icon;
        img.alt = '';
        ico.appendChild(img);
      }else{
        ico.textContent = mv.icon;
      }
    }

    left.appendChild(ico);

    const titleBox = document.createElement('div');
    titleBox.className = 'move-titlebox';

    const title = document.createElement('div');
    title.className = 'move-title';
    title.textContent = tLocal(mv.title) || '';
    titleBox.appendChild(title);

    left.appendChild(titleBox);
    top.appendChild(left);
    card.appendChild(top);

    
// fields (dynamic) + core stats
const fieldsAll = (lang === 'en' ? (mv.fields?.en || mv.props?.en) : (mv.fields?.ru || mv.props?.ru)) || {};
const keys = Object.keys(fieldsAll);

const core = [
  ['damage', mv.damage, lang==='en' ? 'Damage' : 'Урон', false],
  ['stamina', mv.stamina, lang==='en' ? 'Stamina' : 'Выносливость', false],
  ['speed', mv.speed, lang==='en' ? 'Speed' : 'Скорость', true],
].filter(([,val])=> val !== undefined && val !== null && val !== '');

const hasCore = core.length > 0;
const hasFields = keys.length > 0;

if(hasCore || hasFields){
  const box = document.createElement('div');
  box.className = 'move-fields';

  // core stats first
  core.forEach(([k,val,label,ms])=>{
    const row = document.createElement('div');
    row.className = 'move-field move-field--core';

    const lk = document.createElement('div');
    lk.className = 'move-field-k corek';
    lk.textContent = label;

    const lv = document.createElement('div');
    lv.className = 'move-field-v corev';
    lv.textContent = String(val) + (ms ? (lang==='en' ? 'ms' : 'мс') : '');

    row.appendChild(lk);
    row.appendChild(lv);
    box.appendChild(row);
  });

  // other fields
  if(hasFields){
    const ordered = [
      ...FIELD_ORDER.filter(k => keys.includes(k)),
      ...keys.filter(k => !FIELD_ORDER.includes(k)),
    ];

    ordered.forEach(k=>{
      const v = fieldsAll[k];
      if(v === undefined || v === null || v === '') return;

      const row = document.createElement('div');
      row.className = 'move-field';

      const lk = document.createElement('div');
      lk.className = 'move-field-k';
      lk.textContent = labelFor(k);

      const lv = document.createElement('div');
      lv.className = 'move-field-v';
      lv.textContent = String(v);

      row.appendChild(lk);
      row.appendChild(lv);
      box.appendChild(row);
    });
  }

  if(box.childNodes.length) card.appendChild(box);
}


// recovery (opens modal with table)
{
  const rec = document.createElement('div');
  rec.className = 'move-recovery-row';
  rec.tabIndex = 0;
  rec.dataset.card = 'recovery';
  // store reference to this move
  rec.__fhData = mv;

  const lk = document.createElement('div');
  lk.className = 'move-field-k';
  lk.textContent = lang==='en' ? 'Recovery' : 'Восстановление';

  const lv = document.createElement('div');
  lv.className = 'move-field-v move-recovery-cta';
  lv.textContent = '';

  rec.appendChild(lk);
  rec.appendChild(lv);
  card.appendChild(rec);
}
    // note (dashed, expands only this card)
    const noteText = tLocal(mv.note);
    if(noteText){
      const details = document.createElement('details');
      details.className = 'move-note';

      const s = document.createElement('summary');
      s.textContent = lang==='en' ? 'Note' : 'Заметка';

      const p = document.createElement('div');
      p.className = 'move-note-text';
      p.textContent = noteText;

      details.appendChild(s);
      details.appendChild(p);
      card.appendChild(details);
    }
    grid.appendChild(card);
  });

  body.appendChild(grid);
  acc.appendChild(body);
  host.appendChild(acc);
});

}
  
  function renderFacts(root, data){
    const box = root.querySelector('[data-facts]');
    if(!box) return;

    box.innerHTML = '';
    const items = data.quickFacts || [];

    if(!items.length){
      box.innerHTML = `<div class="notice">${UI.getLang()==='en' ? 'Add quick facts in hero data.' : 'Добавь быстрые факты в данных героя.'}</div>`;
      return;
    }

    items.forEach(row=>{
      const r = document.createElement('div');
      r.className = 'kv-row';

      // highlight a few important rows by key
      const keyTxt = tLocal(row.key);
      const low = String(keyTxt || '').toLowerCase();
      if(low.includes('здоров') || low.includes('health')) r.classList.add('qf-health');
      if(low.includes('вынослив') || low.includes('stamina')) r.classList.add('qf-stamina');
      if(low.includes('скорость бега') || low.includes('run speed')) r.classList.add('qf-run');
      // walk speed rows should share the same highlight as run speed
      if(low.includes('скорость ходьбы') || low.includes('walk speed') || low.includes('forward walk') || low.includes('side walk') || low.includes('back walk')) r.classList.add('qf-run');

      const k = document.createElement('div');
      k.className = 'k';
      k.textContent = keyTxt || '—';

      const v = document.createElement('div');
      v.className = 'v';
      v.textContent = tLocal(row.value) || '—';

      r.appendChild(k);
      r.appendChild(v);
      box.appendChild(r);
    });
  }

  function renderOverview(root, data){
    const box = root.querySelector('[data-overview]');
    if(!box) return;

    const txt = (tLocal(data.overview) || '').trim();
    if(!txt){
      box.innerHTML = '<div class="muted">—</div>';
      return;
    }

    const blocks = txt.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);

    let quote = '';
    let rest = blocks;

    if(blocks.length){
      const b0 = blocks[0];
      if(b0.startsWith('«') || b0.startsWith('"') || b0.startsWith('“')){
        quote = b0;
        rest = blocks.slice(1);
      }
    }

    const tips = [];
    const other = [];

    rest.forEach(b=>{
      const lines = b.split(/\n/).map(x=>x.trim()).filter(Boolean);
      const bulletLines = lines.filter(l=>l.startsWith('•'));
      if(bulletLines.length){
        bulletLines.forEach(l=>tips.push(l.replace(/^•\s*/,'')));
      }else{
        other.push(b);
      }
    });

    const parts = [];
    if(quote){
      parts.push(`<blockquote class="ov-quote">${escapeHtml(quote)}</blockquote>`);
    }
    if(other.length){
      parts.push(`<div class="ov-text">${other.map(escapeHtml).join('<br>')}</div>`);
    }
    if(tips.length){
      parts.push(`<div class="ov-tips-title">${UI.getLang()==='en' ? 'Tips' : 'Советы'}</div>`);
      parts.push(`<ul class="ov-tips">${tips.map(t=>`<li><span class="ov-tip-ico">✦</span><span>${escapeHtml(t)}</span></li>`).join('')}</ul>`);
    }

    box.innerHTML = parts.join('');
  }

  function renderVoiceLines(root, data){
    const tabsWrap = root.querySelector('[data-vo-tabs]');
    const panels = Array.from(root.querySelectorAll('.vo-panel'));
    if(!tabsWrap || !panels.length) return;

    const lang = UI.getLang();
    const voice = data.voiceLines || { battle: [], abilities: [], dialogs: [] };

    // tab switching (bind once)
    if(!tabsWrap.__bound){
      tabsWrap.__bound = true;
      tabsWrap.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-vo-tab]');
        if(!btn) return;
        const id = btn.getAttribute('data-vo-tab');

        tabsWrap.querySelectorAll('.vo-tab').forEach(b=>{
          b.classList.toggle('active', b === btn);
        });
        panels.forEach(p=>{
          p.classList.toggle('active', p.getAttribute('data-vo-panel') === id);
        });
      });
    }

    // single audio instance
    if(!window.__FH_VO_AUDIO){
      window.__FH_VO_AUDIO = new Audio();
      window.__FH_VO_AUDIO.preload = 'none';
    }
    const audio = window.__FH_VO_AUDIO;

    const stopAllIcons = ()=>{
      root.querySelectorAll('.vo-ico').forEach(n=>{ n.textContent='🔊'; });
    };

    const trLabel = (lang==='en') ? 'English' : 'Русский';

    const renderList = (panelId, panelEl)=>{
      const host = panelEl.querySelector('[data-vo-list]');
      if(!host) return;

      const items = voice[panelId] || [];
      if(!items.length){
        host.innerHTML = `<div class="notice">${lang==='en' ? 'No voice lines yet.' : 'Пока нет фраз.'}</div>`;
        return;
      }

      host.innerHTML = items.map((it)=>{
        const title = tLocal(it.title) || '—';
        const g = it.gender ? tLocal(it.gender) : '';
        const head = g ? `${escapeHtml(title)} <span class="vo-gender">(${escapeHtml(g)})</span>` : escapeHtml(title);

        const lines = (it.lines || []).map(line=>{
          const origLang = line.originalLang ? tLocal(line.originalLang) : (lang==='en'?'Original':'Оригинал');
          const tr = lang==='en' ? (line.translation?.en || '') : (line.translation?.ru || '');
          const orig = line.original || '';
          const audioSrc = line.audio || '';
          return `
            <div class="vo-row">
              <div class="vo-rowtext">
                <span class="vo-orig">${escapeHtml(origLang)}:</span>
                <span class="vo-origtext">"${escapeHtml(orig)}"</span>
                <span class="vo-sep">—</span>
                <span class="vo-tr">${escapeHtml(trLabel)}: "${escapeHtml(tr)}"</span>
              </div>
              <button class="vo-play" type="button" data-vo-play data-audio="${escapeHtml(audioSrc)}" aria-label="Play">
                <span class="vo-ico" aria-hidden="true">🔊</span>
              </button>
            </div>
          `;
        }).join('');

        return `
          <div class="vo-item vo-item2">
            <div class="vo-title2">${head}</div>
            <div class="vo-rows">
              ${lines || ''}
            </div>
          </div>
        `;
      }).join('');

      // bind play buttons once per host
      if(!host.__bound){
        host.__bound = true;
        host.addEventListener('click', (e)=>{
          const btn = e.target.closest('[data-vo-play]');
          if(!btn) return;

          const src = btn.getAttribute('data-audio') || '';
          const ico = btn.querySelector('.vo-ico');

          if(!src){
            if(ico){ ico.textContent = '▶'; setTimeout(()=>{ ico.textContent='🔊'; }, 600); }
            return;
          }

          // same src playing -> pause
          if(audio.src && audio.src.endsWith(src) && !audio.paused){
            audio.pause();
            stopAllIcons();
            return;
          }

          stopAllIcons();
          audio.pause();
          audio.currentTime = 0;
          audio.src = src;

          if(ico) ico.textContent = '▶';
          audio.play().catch(()=>{ stopAllIcons(); });

          audio.onended = ()=>{ stopAllIcons(); };
          audio.onpause = ()=>{ stopAllIcons(); };
        });
      }
    };

    // render all panels
    panels.forEach(panelEl=>{
      const id = panelEl.getAttribute('data-vo-panel');
      renderList(id, panelEl);
    });
  }



  function resolvePerkList(data){
    const lang = UI.getLang();
    const ids = data.perkIds || data.perksIds || null;
    if(ids && Array.isArray(ids) && window.FH_PERKS){
      return ids.map(id=> window.FH_PERKS[id]).filter(Boolean).map(p=>({
        ...p,
        name: p.name?.[lang] ?? p.name?.ru ?? '',
        desc: p.desc?.[lang] ?? p.desc?.ru ?? '',
        note: p.note?.[lang] ?? p.note?.ru ?? '',
      }));
    }
    return (lang === 'en' ? data.perks?.en : data.perks?.ru) || [];
  }

  
  
  function loadHeroDataScript(src){
    return new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = ()=>resolve();
      s.onerror = ()=>reject(new Error('Failed to load '+src));
      document.head.appendChild(s);
    });
  }

  async function ensureAllHeroDataLoaded(){
    if(window.__fhAllHeroDataPromise) return window.__fhAllHeroDataPromise;

    window.__fhAllHeroDataPromise = (async ()=>{
      const list = window.FH_HEROES || [];
      const loaded = window.FH_HERO_DATA || {};
      const tasks = [];
      for(const h of list){
        if(!h?.id || !h?.dataFile) continue;
        if(loaded[h.id]) continue;
        tasks.push(loadHeroDataScript(h.dataFile).catch(()=>{}));
      }
      await Promise.all(tasks);
      return true;
    })();

    return window.__fhAllHeroDataPromise;
  }

async function getFeatAvailability(featId, lang){
    await ensureAllHeroDataLoaded();
    const dataAll = window.FH_HERO_DATA || {};
    const out = [];
    for(const hid in dataAll){
      const h = dataAll[hid];
      const ids = h?.featIds || h?.featsIds || [];
      if(Array.isArray(ids) && ids.includes(featId)){
        const nm = h?.meta?.name;
        if(nm && typeof nm === 'object'){
          out.push(nm[lang] || nm.ru || nm.en || hid);
        }else if(typeof nm === 'string'){
          out.push(nm);
        }else{
          out.push(hid);
        }
      }
    }
    return out;
  }

function resolveFeatList(data){
    const lang = UI.getLang();
    const ids = data.featIds || data.featsIds || null;
    if(ids && Array.isArray(ids) && window.FH_FEATS){
      return ids.map(id=> window.FH_FEATS[id]).filter(Boolean).map(f=>({
        ...f,
        name: f.name?.[lang] ?? f.name?.ru ?? '',
        desc: f.desc?.[lang] ?? f.desc?.ru ?? '',
        note: f.note?.[lang] ?? f.note?.ru ?? '',
        heroes: f.heroes?.[lang] ?? f.heroes?.ru ?? [],
        availability: getFeatAvailability(f.id, lang),
      }));
    }
    return (lang === 'en' ? data.feats?.en : data.feats?.ru) || [];
  }


  async function fhAvailAsync(featId, lang, targetEl){
    try{
      const list = await getFeatAvailability(featId, lang);
      if(!targetEl) return;
      targetEl.textContent = (list && list.length) ? list.join(', ') : (lang==='en' ? '—' : '—');
    }catch(e){}
  }
function renderFeats(root, data){
    const wrap = root.querySelector('[data-feats]');
    const lang = UI.getLang();
    const list = resolveFeatList(data) || [];

    if(!wrap) return;
    if(!list.length){
      wrap.innerHTML = `<div class="notice">${lang==='en' ? 'No feats yet.' : 'Пока нет фитов.'}</div>`;
      return;
    }

    // group by tier 1..4
    const tiers = [1,2,3,4].map(t => ({ t, items: list.filter(x => Number(x.tier)===t) }));
    wrap.innerHTML = '';
    tiers.forEach(group=>{
      if(!group.items.length) return;

      const section = document.createElement('section');
      section.className = `tier-group tier-${group.t}`;

      // Left rail label (vertical)
      const rail = document.createElement('div');
      rail.className = 'tier-rail';
      rail.innerHTML = `<span>${lang==='en' ? 'Tier' : 'Уровень'} ${group.t}</span>`;
      section.appendChild(rail);

      // Right body with cards
      const body = document.createElement('div');
      body.className = 'tier-body';

      const grid = document.createElement('div');
      grid.className = 'card-grid';

      group.items.forEach(f=>{
        const card = document.createElement('article');
        card.className = 'card-item';
                card.tabIndex = 0;
        card.dataset.card = 'feat';
        card.__fhData = f;

        const top = document.createElement('div');
        top.className = 'card-top';

        if(f.img){
          const img = document.createElement('img');
          img.className = 'card-icon';
          img.alt = '';
          img.loading = 'lazy';
          img.src = f.img;
          top.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'card-icon card-icon--ph';
          top.appendChild(ph);
        }

        const tt = document.createElement('div');
        tt.className = 'card-title';
        tt.textContent = f.name || '';
        top.appendChild(tt);

        const badges = document.createElement('div');
        badges.className = 'badges';

        if(f.type){
          const b = document.createElement('span');
          b.className = 'badge';
          b.textContent = (lang==='en'
            ? (f.type==='active' ? 'Active' : f.type==='passive' ? 'Passive' : f.type)
            : (f.type==='active' ? 'Актив' : f.type==='passive' ? 'Пассив' : f.type)
          );
          badges.appendChild(b);
        }

        if(f.unique){
          const u = document.createElement('span');
          u.className = 'badge badge-unique';
          u.textContent = lang==='en' ? 'Unique' : 'Уникальный';
          badges.appendChild(u);
        }

        // cooldown/cast/recovery (optional)
        const metaParts = [];
        if(typeof f.cooldown === 'number') metaParts.push(`${lang==='en' ? 'CD' : 'КД'}: ${f.cooldown}s`);
        if(typeof f.cast === 'number') metaParts.push(`${lang==='en' ? 'Cast' : 'Каст'}: ${f.cast}ms`);
        if(typeof f.recovery === 'number') metaParts.push(`${lang==='en' ? 'Rec' : 'Восст'}: ${f.recovery}ms`);

        card.appendChild(top);
        if(badges.childNodes.length) card.appendChild(badges);

        if(metaParts.length){
          const meta = document.createElement('div');
          meta.className = 'card-meta';
          meta.textContent = metaParts.join(' • ');
          card.appendChild(meta);
        }

        if(f.desc){
          const d = document.createElement('div');
          d.className = 'card-desc';
          d.textContent = f.desc;
          card.appendChild(d);
        }

        // small hint that it's clickable
        const hint = document.createElement('div');
        hint.className = 'card-hint';
        hint.textContent = lang==='en' ? 'Click for details' : 'Нажми для деталей';
        card.appendChild(hint);

        grid.appendChild(card);
      });

      body.appendChild(grid);
      section.appendChild(body);
      wrap.appendChild(section);
    });
  }

  function renderPerks(root, data){
    const wrap = root.querySelector('[data-perks]');
    if(!wrap) return;
    const lang = UI.getLang();
    const list = resolvePerkList(data) || [];

    if(!list.length){
      wrap.innerHTML = `<div class="notice">${lang==='en' ? 'No perks yet.' : 'Пока нет перков.'}</div>`;
      return;
    }

    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'card-grid';

    list.forEach(p=>{
      const card = document.createElement('article');
      card.className = `card-item perk-item perk-q${p.quality||1}`;
      card.tabIndex = 0;
      card.dataset.card = 'perk';
      card.__fhData = p;

      const top = document.createElement('div');
      top.className = 'card-top';

      if(p.icon){
        const img = document.createElement('img');
        img.className = 'card-icon';
        img.alt = '';
        img.loading = 'lazy';
        img.src = p.icon;
        top.appendChild(img);
      } else if(p.img){
        const img = document.createElement('img');
        img.className = 'card-icon';
        img.alt = '';
        img.loading = 'lazy';
        img.src = p.img;
        top.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'card-icon card-icon--ph';
        top.appendChild(ph);
      }

      const tt = document.createElement('div');
      tt.className = 'card-title';
      tt.textContent = p.name || '';
      top.appendChild(tt);

      card.appendChild(top);

      const badges = document.createElement('div');
      badges.className = 'badges';
if(p.type){
        const t = document.createElement('span');
        t.className = 'badge';
        t.textContent = perkTypeLabel(p.type);
        badges.appendChild(t);
      }
      if(badges.childNodes.length) card.appendChild(badges);

      if(p.desc){
        const d = document.createElement('div');
        d.className = 'card-desc';
        d.textContent = p.desc;
        card.appendChild(d);
      }

      // small hint that it's clickable
      const hint = document.createElement('div');
      hint.className = 'card-hint';
      hint.textContent = lang==='en' ? 'Click for details' : 'Нажми для деталей';
      card.appendChild(hint);

      grid.appendChild(card);
    });

    wrap.appendChild(grid);
  }

  function setupCardModal(root){
    const modal = document.getElementById('cardModal');
    const titleEl = document.getElementById('cardModalTitle');
    const kickerEl = document.getElementById('cardModalKicker');
    const bodyEl = document.getElementById('cardModalBody');
    if(!modal || !titleEl || !kickerEl || !bodyEl) return;

    let lastFocus = null;
    let current = null; // { type, key }

    function esc(s){
      return String(s ?? '')
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#39;');
    }

    function fmtAvailability(heroes, lang){
      if(!Array.isArray(heroes) || !heroes.length) return '—';
      const norm = heroes.map(x=>String(x||'').trim()).filter(Boolean);
      const hasAll = norm.some(x=>['все','all'].includes(x.toLowerCase()));
      if(hasAll) return lang==='en' ? 'All heroes' : 'Все герои';
      return norm.join(', ');
    }

    function openCard(cardType, item, opts = {}){
      const lang = UI.getLang();
      if(!opts.preserveFocus) lastFocus = document.activeElement;

      const isFeat = cardType === 'feat';

const isMove = cardType === 'move';
      const isRecovery = cardType === 'recovery';

      const kicker = isFeat
  ? `${lang==='en' ? 'Feat' : 'Фит'} • ${lang==='en' ? 'Tier' : 'Уровень'} ${item.tier ?? '—'}`
  : isMove
    ? `${lang==='en' ? 'Move' : 'Приём'}`
    : isRecovery
      ? `${lang==='en' ? 'Move' : 'Приём'} • ${(lang==='en'
          ? (item.title?.en ?? item.name ?? '')
          : (item.title?.ru ?? item.name ?? '')) || ''}`
      : `${lang==='en' ? 'Perk' : 'Перк'}`;

kickerEl.textContent = kicker;


// title
if(isRecovery){
  titleEl.textContent = lang==='en' ? 'Recovery' : 'Восстановление';
} else if(isMove){
  titleEl.textContent = (lang==='en' ? (item.title?.en ?? item.name ?? '') : (item.title?.ru ?? item.name ?? '')) || '';
} else {
  titleEl.textContent = item.name || '';
}

      const badges = [];
      if(isFeat){
        if(item.type){
          badges.push(`<span class="badge">${esc(lang==='en'
            ? (item.type==='active' ? 'Active' : item.type==='passive' ? 'Passive' : item.type)
            : (item.type==='active' ? 'Активная' : item.type==='passive' ? 'Пассивная' : item.type)
          )}</span>`);
        }
        if(item.unique){
          badges.push(`<span class="badge badge-unique">${lang==='en' ? 'Unique' : 'Уникальная'}</span>`);
        }
      } else if(isMove) {
        if(item.damage != null) badges.push(`<span class="badge">${lang==='en' ? 'DMG' : 'Урон'} ${esc(item.damage)}</span>`);
        if(item.stamina != null) badges.push(`<span class="badge">${lang==='en' ? 'Stam' : 'Выносл.'} ${esc(item.stamina)}</span>`);
        if(item.speed != null) badges.push(`<span class="badge">${lang==='en' ? 'Speed' : 'Скорость'} ${esc(item.speed)}${lang==='en' ? 'ms' : 'мс'}</span>`);
      } else {
        if(item.type){
          badges.push(`<span class="badge">${esc(lang==='en'
            ? (item.type==='defense' ? 'Defense' : item.type==='offense' ? 'Offense' : item.type)
            : (item.type==='defense' ? 'Защита' : item.type==='offense' ? 'Атака' : item.type)
          )}</span>`);
        }
        
      }

      const imgSrc = isFeat ? item.img : (isMove ? (item.img || item.icon) : (item.icon || item.img));

      current = { type: cardType, key: (isMove ? (item.__key || item.name || '') : (imgSrc || item.name || '')), __item: item };

      const rows = [];
      if(isFeat){
        if(typeof item.cooldown === 'number') rows.push({ k: lang==='en' ? 'Cooldown' : 'Кулдаун', v: `${item.cooldown}s` });
        if(typeof item.cast === 'number') rows.push({ k: lang==='en' ? 'Cast' : 'Активация', v: `${item.cast}ms` });
        if(typeof item.recovery === 'number') rows.push({ k: lang==='en' ? 'Recovery' : 'Восстановление', v: `${item.recovery}ms` });
        rows.push({ k: lang==='en' ? 'Availability' : 'Доступность', v: fmtAvailability(item.heroes, lang) });
}
if(isMove){
  const fieldsAll = (lang === 'en' ? (item.fields?.en || item.props?.en) : (item.fields?.ru || item.props?.ru)) || {};
  Object.keys(fieldsAll).forEach(k=>{
    const v = fieldsAll[k];
    if(v === undefined || v === null || v === '') return;
    // keep label as-is; user can define nice labels in data if desired
    const label = String(k||'').replace(/[_-]+/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').trim();
    const pretty = label ? (label.charAt(0).toUpperCase() + label.slice(1)) : k;
    rows.push({ k: pretty, v: String(v) });
  });
}

const metaHtml = rows.length
        ? `<div class="meta-rows">${rows.map(r=>`<div class="meta-row"><div class="k">${esc(r.k)}</div><div class="v">${esc(r.v)}</div></div>`).join('')}</div>`
        : '';

      const noteLabel = lang==='en' ? (isFeat ? 'Assessment' : 'Note') : (isFeat ? 'Оценка' : 'Заметка');
      const noteText = isMove ? ((lang==='en' ? (item.note?.en ?? '') : (item.note?.ru ?? '')) || '') : (item.note || '');


if(isRecovery){
  const cols = lang==='en'
    ? ['', 'Hit', 'Miss', 'Block', 'Superior Block']
    : ['', 'Попал', 'Промах', 'Блок', 'Супер Блок'];

  const rowNames = lang==='en'
    ? { normal: 'Normal', stance: 'Stance switch' }
    : { normal: 'Обычный', stance: 'Смена стойки' };

  const soon = lang==='en' ? 'Soon' : 'Скоро';

  const fmtMs = (v)=>{
    if(v === undefined || v === null || v === '') return soon;
    if(typeof v === 'number') return `${v}${lang==='en' ? 'ms' : 'мс'}`;
    return String(v);
  };

  const r = item.recovery || item.recoveries || null;
  const getCell = (rowKey, colKey)=>{
    const val = r?.[rowKey]?.[colKey];
    return fmtMs(val);
  };

  const tableHtml = `
    <div class="rec-modal">
      <div class="rec-modal-title">${lang==='en' ? 'Recovery' : 'Восстановление'}</div>
      <div class="muted" style="margin:0 0 10px">${lang==='en' ? 'Values are in ms.' : 'Значения в мс.'}</div>
      <div class="rec-modal-wrap">
        <table class="rec-table rec-table--modal">
          <thead>
            <tr>${cols.map((c,i)=>`<th>${i===0?'':c}</th>`).join('')}</tr>
          </thead>
          <tbody>
            <tr>
              <th>${rowNames.normal}</th>
              <td>${getCell('normal','hit')}</td>
              <td>${getCell('normal','miss')}</td>
              <td>${getCell('normal','block')}</td>
              <td>${getCell('normal','sblock')}</td>
            </tr>
            <tr>
              <th>${rowNames.stance}</th>
              <td>${getCell('stance','hit')}</td>
              <td>${getCell('stance','miss')}</td>
              <td>${getCell('stance','block')}</td>
              <td>${getCell('stance','sblock')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  bodyEl.innerHTML = tableHtml;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  const closeBtn = modal.querySelector('[data-modal-close]') || modal.querySelector('.modal-close');
  closeBtn?.focus?.();
  return;
}
      bodyEl.innerHTML = `
        <div class="modal-grid">
          <div class="modal-icon">${imgSrc ? `<img src="${esc(imgSrc)}" alt="">` : '★'}</div>
          <div>
            <div class="modal-badges">${badges.join('')}</div>
            <div class="modal-desc">${esc(item.desc || '')}</div>
            ${metaHtml}
            <div class="modal-note">
              <div class="k">${esc(noteLabel)}</div>
              <div>${esc(noteText || '—')}</div>
            </div>
          </div>
        </div>
      `;

      // If it's a feat: compute real availability based on heroes that have this featId
      if(isFeat && item && item.id){
        const kLabel = (lang==='en') ? 'Availability' : 'Доступность';
        const rows = bodyEl.querySelectorAll('.meta-row');
        let vEl = null;
        rows.forEach(r=>{
          const k = r.querySelector('.k');
          const v = r.querySelector('.v');
          if(k && v && k.textContent.trim() === kLabel) vEl = v;
        });
        if(vEl){
          vEl.textContent = '…';
          getFeatAvailability(item.id, lang).then(list=>{
            vEl.textContent = (Array.isArray(list) && list.length) ? list.join(', ') : '—';
          }).catch(()=>{ vEl.textContent = '—'; });
        }
      }

      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      const closeBtn = modal.querySelector('[data-modal-close]');
      closeBtn?.focus();
      document.body.style.overflow = 'hidden';
    }

    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      bodyEl.innerHTML = '';
      document.body.style.overflow = '';
      try{ lastFocus?.focus?.(); }catch(_){ }
      lastFocus = null;
    }

    // close handlers
    modal.addEventListener('click', (e)=>{
      const dialog = modal.querySelector('.modal-dialog');
      if(e.target === modal || (dialog && !dialog.contains(e.target))) close();
    });
    modal.querySelector('[data-modal-close]')?.addEventListener('click', close);
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    // open handlers (delegation)
    root.addEventListener('click', (e)=>{
      if(e.target.closest('.move-note')) return;
      const el = e.target.closest('[data-card]');
      if(!el) return;
      const item = el.__fhData;
      if(!item) return;
      openCard(el.dataset.card, item);
    });
    root.addEventListener('keydown', (e)=>{
      if(e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest('[data-card]');
      if(!el) return;
      e.preventDefault();
      const item = el.__fhData;
      if(!item) return;
      openCard(el.dataset.card, item);
    });


    // on language switch, if modal is open — re-render its content in the new language
    window.addEventListener('fh:langchange', ()=>{
  if(!modal.classList.contains('open') || !current) return;

  const heroId = root.dataset.heroId || 'warden';
  const data = window.FH_HERO_DATA?.[heroId];
  if(!data) return;

  const lang = UI.getLang();
  let next = null;

  if(current.type === 'feat'){
    const list = ((lang === 'en' ? data.feats?.en : data.feats?.ru) || []);
    next = list.find(x => ((x.img || x.name || '') === current.key)) || null;
  } else if(current.type === 'perk'){
    const list = ((lang === 'en' ? data.perks?.en : data.perks?.ru) || []);
    next = list.find(x => (((x.icon || x.img) || x.name || '') === current.key)) || null;
  } else if(current.type === 'move' || current.type === 'recovery'){
    const sections = data.moves?.sections || [];
    for(const s of sections){
      for(const c of (s.cards || [])){
        if((c.__key || '') === current.key){ next = c; break; }
      }
      if(next) break;
    }
  }

  if(next) openCard(current.type, next, { preserveFocus: true });
  else openCard(current.type, current.__item || {}, { preserveFocus: true });
});
  }

  



  function renderExecutions(root, data){
    const lang = UI.getLang();

    const blocks = Array.from(root.querySelectorAll('[data-exec-block]'));
    if(!blocks.length) return;

    // state per table element
    const _execState = window.__FH_EXEC_STATE || (window.__FH_EXEC_STATE = new WeakMap());
    window.__FH_EXEC_STATE = _execState;

    const toMs = (v)=>{
      if(v == null) return NaN;
      if(typeof v === 'number') return v;
      const s = String(v).trim();
      if(!s) return NaN;
      const sm = s.match(/^(\d+(?:[.,]\d+)?)\s*s$/i);
      if(sm) return Math.round(parseFloat(sm[1].replace(',','.')) * 1000);
      const mm = s.match(/^(\d+(?:[.,]\d+)?)\s*ms$/i);
      if(mm) return Math.round(parseFloat(mm[1].replace(',','.')));
      const num = Number(s.replace(',','.'));
      return Number.isFinite(num) ? Math.round(num) : NaN;
    };

    const healVal = (v)=>{
      if(v == null) return NaN;
      if(typeof v === 'number') return v;
      const s = String(v).trim();
      const m = s.match(/([+-]?\d+)/);
      return m ? Number(m[1]) : NaN;
    };

    const ragVal = (v)=>{
      const s = String(v ?? '').trim().toLowerCase();
      return (s==='да' || s==='yes' || s==='true') ? 1 : 0;
    };

    const COLS = [
      { id:'name',    ru:'Название', en:'Name', sortable:true },
      { id:'kill',    ru:'Время убийства', en:'Kill time', sortable:true, numeric:true },
      { id:'use',     ru:'Время использования', en:'Use time', sortable:true, numeric:true },
      { id:'total',   ru:'Полная длительность', en:'Total duration', sortable:true, numeric:true },
      { id:'heal',    ru:'Лечение', en:'Heal', sortable:true, numeric:true },
      { id:'ragdoll', ru:'Тряпичная кукла', en:'Ragdoll', sortable:true },
      { id:'notes',   ru:'Заметки', en:'Notes', sortable:true },
    ];
    const t = (c)=> (lang==='en' ? c.en : c.ru);

    // global Esc close for any open portal menus
    if(!window.__FH_EXEC_ESC){
      window.__FH_EXEC_ESC = true;
      document.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Escape'){
          try{ document.querySelectorAll('.hmenu.open').forEach(n=>n.remove()); }catch(e){}
        }
      });
    }

    function renderBlock(block, rows){
      const table = block.querySelector('[data-exec-table]');
      const thead = block.querySelector('[data-exec-thead]');
      const tbody = block.querySelector('[data-exec-tbody]');
      const input = block.querySelector('[data-exec-search]');
      const healBtn = block.querySelector('[data-heal-btn]');
      const healPill = block.querySelector('[data-heal-pill]');

      if(!table || !thead || !tbody) return;

      // keep placeholders correct for each block and language
      if(input){
        input.placeholder = lang === 'en' ? 'Search by name…' : 'Поиск по названию…';
      }

      const st = _execState.get(table) || { heal: new Set(), sort: { key:'name', dir:'asc' }, _ready:false, _portal:null };
      _execState.set(table, st);

      const closePortal = ()=>{
        if(!st._portal) return; // don't animate on unrelated clicks
        st._portal.remove();
        st._portal = null;
        healBtn?.classList.remove('open');
        pulseChevron(healBtn?.querySelector('.arrow'), 'down');
      };

      const q = (input?.value || '').trim().toLowerCase();

      const getVal = (r, colId)=>{
        switch(colId){
          case 'name': return String(r.name ?? '');
          case 'kill': return toMs(r.killTime);
          case 'use': return toMs(r.useTime);
          case 'total': return toMs(r.totalTime);
          case 'heal': return healVal(r.heal);
          case 'ragdoll': return ragVal(r.ragdoll);
          case 'notes': return String(r.notes ?? '');
          default: return '';
        }
      };

      const formatCell = (r, colId)=>{
        if(colId==='kill') return Number.isFinite(toMs(r.killTime)) ? String(toMs(r.killTime)) : '—';
        if(colId==='use') return Number.isFinite(toMs(r.useTime)) ? String(toMs(r.useTime)) : '—';
        if(colId==='total') return Number.isFinite(toMs(r.totalTime)) ? String(toMs(r.totalTime)) : '—';
        if(colId==='heal'){
          const hv = healVal(r.heal);
          return Number.isFinite(hv) ? (hv>0 ? `+${hv}` : String(hv)) : '—';
        }
        if(colId==='ragdoll'){
          const v = ragVal(r.ragdoll);
          return lang==='en' ? (v? 'Yes':'No') : (v? 'Да':'Нет');
        }
        if(colId==='notes') return String(r.notes ?? '—') || '—';
        if(colId==='name') return String(r.name ?? '—') || '—';
        return '—';
      };

      // one-time wiring
      if(!st._ready){
        st._ready = true;

        input?.addEventListener('input', ()=> renderBlock(block, rows));

        document.addEventListener('click', (e)=>{
          if(e.target.closest('[data-heal-filter]')) return;
          closePortal();
        });

        window.addEventListener('resize', ()=>{ if(st._portal){ closePortal(); } });
        window.addEventListener('scroll', ()=>{ if(st._portal){ closePortal(); } }, { passive:true });

        // sorting: one delegated listener per thead
        thead.addEventListener('click', (e)=>{
          const th = e.target.closest('th[data-sort]');
          if(!th) return;
          const key = th.getAttribute('data-sort');
          if(!key) return;

          if(st.sort.key === key){
            st.sort.dir = (st.sort.dir === 'asc') ? 'desc' : 'asc';
          }else{
            st.sort.key = key;
            st.sort.dir = 'asc';
          }

          // Head UI (active col + chevron) will be updated inside renderBlock()
          renderBlock(block, rows);
        });

// heal menu open
        healBtn?.addEventListener('click', (e)=>{
          e.stopPropagation();
          if(st._portal){ closePortal(); return; }
          healBtn?.classList.add('open');
          pulseChevron(healBtn?.querySelector('.arrow'), 'up');

          const btn = e.currentTarget;
          const r = btn.getBoundingClientRect();

          const menu = document.createElement('div');
          menu.className = 'hmenu open';
          menu.setAttribute('aria-hidden','false');
          menu.style.position = 'fixed';
          menu.style.left = `${Math.min(r.left, window.innerWidth - 280)}px`;
          menu.style.top = `${r.bottom + 10}px`;
          menu.style.zIndex = '9999';

          const resetLabel = lang==='en' ? 'Reset' : 'Сбросить';

          menu.innerHTML = `
            <div class="hmenu-head">
              <div class="muted" style="font-weight:700">${lang==='en'?'Filter heal':'Фильтр лечения'}</div>
              <button class="btn btn-ghost btn-sm" type="button" data-heal-reset>${resetLabel}</button>
            </div>
            <div class="hmenu-list">
              ${[20,35,50].map(v=>{
                const on = st.heal.has(String(v));
                return `<label class="hitem"><input type="checkbox" value="${v}" ${on?'checked':''}/> <span>+${v}</span></label>`;
              }).join('')}
            </div>
          `;

          document.body.appendChild(menu);
          st._portal = menu;

          menu.addEventListener('click', (ev)=> ev.stopPropagation());

          menu.querySelector('[data-heal-reset]')?.addEventListener('click', (ev)=>{
            ev.preventDefault();
            st.heal.clear();
            closePortal();
            renderBlock(block, rows);
          });

          menu.querySelectorAll('input[type="checkbox"]').forEach(inp=>{
            inp.addEventListener('change', ()=>{
              const v = inp.value;
              if(inp.checked) st.heal.add(String(v));
              else st.heal.delete(String(v));
              renderBlock(block, rows);
            });
          });
        });
      }

      // filter rows
      let filtered = rows.filter(r=>{
        if(q && !String(r.name||'').toLowerCase().includes(q)) return false;
        if(st.heal.size){
          const hv = healVal(r.heal);
          if(!st.heal.has(String(hv))) return false;
        }
        return true;
      });

      // sort
      const sortKey = st.sort.key;
      const sortCol = COLS.find(c=>c.id===sortKey);
      if(sortCol && sortCol.sortable){
        const isNum = !!sortCol.numeric;
        filtered = [...filtered].sort((a,b)=>{
          const va = getVal(a, sortKey);
          const vb = getVal(b, sortKey);
          if(isNum) return (Number(va)||0) - (Number(vb)||0);
          return String(va).localeCompare(String(vb), lang==='en'?'en':'ru', { sensitivity:'base' });
        });
        if(st.sort.dir==='desc') filtered.reverse();
      }

      // pill text
      const allLabel = lang==='en' ? 'Heal' : 'Лечение';
      const pillText = st.heal.size
        ? Array.from(st.heal).map(x=> (Number(x)>0?`+${x}`:x)).join(', ')
        : allLabel;

      // Replace button label with current selection; remove the "All/Все" pill UI.
      const labelEl = healBtn?.querySelector('[data-i18n="hero.exec.heal"]');
      if(labelEl) labelEl.textContent = pillText;
      if(healPill){
        healPill.textContent = '';
        healPill.style.display = 'none';
      }

      // header (build once per language; keep DOM stable for smooth arrow transitions)
      if(!st._headBuilt || st._headLang !== lang){
        st._headBuilt = true;
        st._headLang = lang;
        thead.innerHTML = `
          <tr class="exec-headrow">
            ${COLS.map(c=>{
              const title = t(c);
              const sortable = c.sortable;
              const isNum = !!c.numeric;
              const attrs = sortable ? `data-sort="${c.id}"` : '';
              const cls = [isNum?'num':'', sortable?'sortable':''].filter(Boolean).join(' ');
              const arrow = `<span class="arrow" aria-hidden="true">▾</span>`;
              return `<th class="${cls}" ${attrs}><span class="exec-sort">${title}${arrow}</span></th>`;
            }).join('')}
          </tr>
        `;
      }

      // update sort UI (direction + active col)
      thead.querySelectorAll('th[data-sort]').forEach(th=>{
        const key = th.getAttribute('data-sort');
        const active = (st.sort.key===key);
        th.classList.toggle('active-sort', active);
        th.classList.toggle('desc', active && st.sort.dir==='desc');
        const a = th.querySelector('.arrow');
        if(a) pulseChevron(a, (active && st.sort.dir==='desc') ? 'up' : 'down');
      });

      // body
      if(!filtered.length){
        tbody.innerHTML = `<tr><td colspan="${COLS.length}" class="muted" style="padding:14px">${lang==='en' ? 'No executions match.' : 'Ничего не найдено.'}</td></tr>`;
        return;
      }

      const parts = new Array(filtered.length);
      for(let i=0;i<filtered.length;i++){
        const r = filtered[i];
        let tds = '';
        for(let j=0;j<COLS.length;j++){
          const c = COLS[j];
          const id = c.id;
          const isNum = !!c.numeric;
          const val = formatCell(r, id);
          const cls = ((isNum ? 'num ' : '') + (id==='notes' ? 'note' : '')).trim();
          tds += '<td' + (cls ? ' class="'+cls+'"' : '') + '>' + (val || '—') + '</td>';
        }
        parts[i] = '<tr>' + tds + '</tr>';
      }
      tbody.innerHTML = parts.join('');
    }

    // pick datasets
    const heroRows = (lang === 'en' ? data.executions?.en : data.executions?.ru) || [];
    const commonSrc = data.executionsCommon || data.executions_common;
    const commonRows = (lang === 'en' ? commonSrc?.en : commonSrc?.ru) || [];

    blocks.forEach(block=>{
      const kind = block.getAttribute('data-exec-block');
      renderBlock(block, kind === 'common' ? commonRows : heroRows);
    });
  }




  // ===== Punishes (from scratch) =====
  const _punishState = new WeakMap();

  function localText(x){
    const lang = UI.getLang();
    if(x == null) return '';
    if(typeof x === 'string' || typeof x === 'number') return String(x);
    if(typeof x === 'object') return lang === 'en' ? String(x.en ?? '') : String(x.ru ?? '');
    return String(x);
  }

  function typeLabel(punishes, typeId){
    const lang = UI.getLang();
    const row = (punishes?.types || []).find(t => t.id === typeId);
    if(!row) return typeId || '';
    return lang === 'en' ? (row.en || row.id) : (row.ru || row.id);
  }

  
  function getPunishCols(punishes){
    // Guard against broken/legacy column defs (missing ids / trailing spaces / duplicates)
    const raw = Array.isArray(punishes?.columns) ? punishes.columns : [];
    const out = [];
    const seen = new Set();
    raw.forEach(c=>{
      const id = String(c?.id ?? '').trim();
      if(!id) return;
      if(seen.has(id)) return;
      seen.add(id);
      out.push({ ...c, id });
    });
    return out;
  }


  function ensureTypeMap(punishes){
    if(punishes && punishes._typeMap) return punishes._typeMap;
    const m = new Map();
    (punishes?.types || []).forEach(t => m.set(t.id, t));
    if(punishes) punishes._typeMap = m;
    return m;
  }

  function typeLabelFast(punishes, typeId){
    const lang = UI.getLang();
    const m = ensureTypeMap(punishes);
    const row = m.get(typeId);
    if(!row) return typeId || '';
    return lang === 'en' ? (row.en || row.id) : (row.ru || row.id);
  }

  function schedulePunishRender(host, punishes, st, what='body'){
    // Batch multiple UI changes into a single render *reliably*.
    // Using a microtask avoids cases where rAF can be delayed/skipped.
    if(!st) return;
    st._pendingWhat = (st._pendingWhat === 'all' || what === 'all') ? 'all' : what;
    if(st._pending) return;
    st._pending = true;

    Promise.resolve().then(()=>{
      st._pending = false;
      const w = st._pendingWhat || 'body';
      st._pendingWhat = 'body';

      if(w === 'all'){
        renderPunishHead(host, punishes, st);
        renderPunishTable(host, punishes, st);
      }else{
        renderPunishTable(host, punishes, st);
      }
    });
  }


function getPunishHost(root){
    // Keep selectors in one place — easy to tweak HTML later.
    return {
      bar: root.querySelector('[data-punishbar]'),
      btn: root.querySelector('[data-punish-filter-btn]'),
      count: root.querySelector('[data-punish-filter-count]'),
      menu: root.querySelector('[data-punish-menu]'),
      list: root.querySelector('[data-punish-type-list]'),
      reset: root.querySelector('[data-punish-reset]'),
      thead: root.querySelector('[data-punish-thead]'),
      tbody: root.querySelector('[data-punish-tbody]'),
      table: root.querySelector('[data-punish-table]'),
    };
  }

  function updatePunishCountUI(host, st){
    if(!host?.count) return;
    const lang = UI.getLang();
    const n = st.types.size;
    host.count.textContent = n === 0 ? (lang === 'en' ? 'All' : 'Все') : String(n);
  }

  function renderPunishTypeList(host, punishes, st){
    if(!host?.list) return;
    const types = punishes?.types || [];
    host.list.innerHTML = '';

    if(!types.length){
      host.list.innerHTML = `<div class="muted" style="padding:8px 10px">—</div>`;
      return;
    }

    types.forEach(t => {
      const id = t.id;
      const label = localText(t);
      const checked = st.types.has(id);

      const lab = document.createElement('label');
      lab.className = 'ptype';
      lab.innerHTML = `
        <input type="checkbox" ${checked ? 'checked' : ''} />
        <span>${label}</span>
      `;

      lab.querySelector('input').addEventListener('change', (e)=>{
        if(e.target.checked) st.types.add(id);
        else st.types.delete(id);
        updatePunishCountUI(host, st);
        schedulePunishRender(host, punishes, st, 'body');
      });

      host.list.appendChild(lab);
    });
  }

  function renderPunishHead(host, punishes, st){
    const cols = getPunishCols(punishes);
    if(!host?.thead) return;

    const lang = UI.getLang();
    const sig = cols.map(c=>c.id).join('|') + '::' + lang;

    // Build head only when language/columns change; keep DOM stable for smooth transitions
    if(!st._headSig || st._headSig !== sig){
      st._headSig = sig;

      const tr = document.createElement('tr');
      tr.innerHTML = cols.map(c => {
        const title = localText(c);
        const sortable = (c.sortable || c.id === 'type');
        const isNum = !!c.numeric;
        const attrs = sortable ? `data-sort="${c.id}"` : '';
        const cls = [isNum ? 'num' : '', sortable ? 'sortable' : ''].filter(Boolean).join(' ');
        const arrow = `<span class="arrow" aria-hidden="true">▾</span>`;
        return `<th class="${cls}" ${attrs}><span class="punish-sort">${title}${arrow}</span></th>`;
      }).join('');

      host.thead.innerHTML = '';
      host.thead.appendChild(tr);
    }

    // highlight current sort + direction
    host.thead.querySelectorAll('th[data-sort]').forEach(th => {
      const key = th.getAttribute('data-sort');
      const active = (st.sort.key === key);
      th.classList.toggle('active-sort', active);
      th.classList.toggle('desc', active && st.sort.dir === 'desc');
      const a = th.querySelector('.arrow');
      if(a) pulseChevron(a, (active && st.sort.dir === 'desc') ? 'up' : 'down');
    });
  }

  function renderPunishTable(host, punishes, st){
    if(!host?.tbody) return;

    const cols = getPunishCols(punishes);
    const rows = punishes?.rows || [];
    const lang = UI.getLang();

    const filtered = rows.filter(r => {
      if(st.types.size === 0) return true;
      return st.types.has(r.type);
    });

    const sortKey = st.sort.key;
    const sortCol = cols.find(c => c.id === sortKey);

    const getCellVal = (r, colId) => {
      if(colId === 'type') return typeLabelFast(punishes, r.type);
      const v = r[colId];
      return localText(v);
    };

    let ordered = [...filtered];
    if(sortCol && (sortCol.sortable || sortCol.id === 'type')){
      const isNum = !!sortCol.numeric;
      ordered.sort((a,b)=>{
        const va = getCellVal(a, sortKey);
        const vb = getCellVal(b, sortKey);
        if(isNum) return (Number(va)||0) - (Number(vb)||0);
        return String(va).localeCompare(String(vb), lang === 'en' ? 'en' : 'ru', { sensitivity:'base' });
      });
      if(st.sort.dir === 'desc') ordered.reverse();
    }

    host.tbody.innerHTML = '';
    if(!ordered.length){
      host.tbody.innerHTML = `<tr><td colspan="${cols.length}" class="muted" style="padding:14px">${lang==='en' ? 'No rows.' : 'Нет строк.'}</td></tr>`;
      return;
    }

    const parts = new Array(ordered.length);
    for(let i=0;i<ordered.length;i++){
      const r = ordered[i];
      let tds = '';
      for(let j=0;j<cols.length;j++){
        const c = cols[j];
        const id = c.id;
        const isNum = !!c.numeric;

        let val = '';
        if(id === 'type') val = typeLabelFast(punishes, r.type);
        else val = localText(r[id]);

        let cls = ((isNum ? 'num ' : '') + (id === 'note' ? 'note ' : '')).trim();

        // IMPORTANT:
        // Don't style the <td> itself as a badge (tables + border-collapse can create tiny gaps).
        // Keep <td> normal, and put the visual pill inside.
        if(id === 'type'){
          const typeCls = r.type ? ('ptype-' + r.type) : '';
          cls = (cls ? cls + ' ' : '') + 'ptypecell ' + typeCls;
          tds += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + (val || '—') + '</td>';
        }else{
          tds += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + (val || '—') + '</td>';
        }
      }
      parts[i] = '<tr>' + tds + '</tr>';
    }
    host.tbody.innerHTML = parts.join('');

    // keep head highlight in sync
    host.thead?.querySelectorAll('th[data-sort]')?.forEach(th => {
      const key = th.getAttribute('data-sort');
      th.classList.toggle('active-sort', st.sort.key === key);
      th.classList.toggle('desc', st.sort.key === key && st.sort.dir === 'desc');
    });
  }

  function setupPunishUI(host, punishes, st){
    if(st._ready) return;
    st._ready = true;

      // close heal menu on Esc
      if(!window.__FH_EXEC_ESC){
        window.__FH_EXEC_ESC = true;
        document.addEventListener('keydown', (ev)=>{
          if(ev.key === 'Escape'){
            try{ document.querySelectorAll('.hmenu.open').forEach(n=>n.remove()); }catch(e){}
          }
        });
      }

    // dropdown open/close
    const close = ()=>{
      host.menu?.classList.remove('open');
      host.menu?.setAttribute('aria-hidden','true');
      host.btn?.classList.remove('open');
    };

    host.btn?.addEventListener('click', (e)=>{
      e.stopPropagation();
      const open = host.menu?.classList.toggle('open');
      host.menu?.setAttribute('aria-hidden', open ? 'false' : 'true');
      host.btn?.classList.toggle('open', !!open);
    
      pulseChevron(host.btn?.querySelector('.arrow'), open ? 'up' : 'down');
});

    document.addEventListener('click', (e)=>{
      if(e.target.closest('[data-punishbar]')) return;
      close();
    });

    host.reset?.addEventListener('click', (e)=>{
      e.preventDefault();
      st.types.clear();
      updatePunishCountUI(host, st);
      renderPunishTypeList(host, punishes, st);
      schedulePunishRender(host, punishes, st, 'body');
    });

    // sorting
    host.thead?.addEventListener('click', (e)=>{
      const th = e.target.closest('th[data-sort]');
      if(!th) return;
      const key = th.getAttribute('data-sort');
      if(!key) return;

      if(st.sort.key === key){
        st.sort.dir = (st.sort.dir === 'asc') ? 'desc' : 'asc';
      }else{
        st.sort.key = key;
        st.sort.dir = 'asc';
      }

      renderPunishHead(host, punishes, st);
      schedulePunishRender(host, punishes, st, 'body');
    });
  }

  function renderPunishes(root, data){
    const host = getPunishHost(root);
    const punishes = data.punishes;
    const lang = UI.getLang();

    // Safety: WeakMap keys must be objects. If the table selector changed (layout edits),
    // recover the table element via thead/tbody to avoid "Invalid value used as weak map key".
    const punishTableKey = (host && host.table && typeof host.table === 'object')
      ? host.table
      : (host?.thead?.closest('table') || host?.tbody?.closest('table'));

    // If there is no punish table on this page, just bail out quietly.
    if(!punishTableKey) return;

    // Normalize host.table so downstream code can rely on it.
    host.table = punishTableKey;

    if(!punishes || !punishes.rows || !punishes.columns){
      // graceful empty state
      if(host?.tbody){
        host.thead.innerHTML = '';
        host.tbody.innerHTML = `<tr><td class="muted" style="padding:14px">${lang==='en' ? 'No punish data yet.' : 'Пока нет данных по наказаниям.'}</td></tr>`;
      }
      return;
    }

    const st = _punishState.get(punishTableKey) || { types: new Set(), sort: { key: 'type', dir: 'asc' }, _ready:false };
    _punishState.set(punishTableKey, st);

    setupPunishUI(host, punishes, st);
    updatePunishCountUI(host, st);
    renderPunishTypeList(host, punishes, st);
    renderPunishHead(host, punishes, st);
    schedulePunishRender(host, punishes, st, 'body');
  }

  function render(root, data){
    // header
    const meta = data.meta || {};
    const lang = UI.getLang();

    // Breadcrumb: show "Heroes — <Name>" (requested)
    const crumb = document.querySelector('[data-crumb]');
    if(crumb){
      const heroesLabel = (lang === 'en') ? 'Heroes' : 'Герои';
      const heroName = tLocal(meta.name) || 'Hero';
      crumb.textContent = `${heroesLabel} — ${heroName}`;
    }

    // Document title (keep consistent with breadcrumb)
    {
      const heroesLabel = (lang === 'en') ? 'Heroes' : 'Герои';
      const heroName = tLocal(meta.name) || 'Hero';
      document.title = `${heroesLabel} — ${heroName} — For Honor Wiki`;
    }

    const banner = root.querySelector('[data-hero-banner]');
    const rawBanner = meta.image || getHeroMeta(meta.id)?.img;
    const fallback = new URL('assets/img/placeholder-hero.svg', window.location.href).toString();
    const bannerUrl = rawBanner ? new URL(rawBanner, window.location.href).toString() : fallback;
    banner?.style.setProperty('--img', `url('${bannerUrl}')`);

    setText(root.querySelector('[data-hero-title]'), tLocal(meta.name));
    setText(root.querySelector('[data-hero-role]'), tLocal(meta.role));

    // tags
    const tags = root.querySelector('[data-hero-tags]');
    tags.innerHTML = '';
    (meta.tags || []).forEach(t=>{
      const span = document.createElement('span');
      span.className = 'badge';
      span.textContent = tLocal(t);
      tags.appendChild(span);
    });

    // overview
    renderOverview(root, data);

    // facts
    renderFacts(root, data);

    // voice lines
    renderVoiceLines(root, data);

    // moves
    renderMoves(root, data);

    // feats
    renderFeats(root, data);

    // perks
    renderPerks(root, data);

    // punishes
    renderPunishes(root, data);
    // executions
    renderExecutions(root, data);

    // perk build image depends on language
    try{ updatePerkBuildImage(); } catch(e) {}
  }

  async function mount(){
    const root = document.querySelector('[data-hero-root]');
    if(!root) return;

    mountTabs(root);

    const id = (qs().get('id') || 'warden').toLowerCase();
    const meta = getHeroMeta(id) || getHeroMeta('warden');

    // update sidebar links active state
    document.querySelectorAll('.nav-link').forEach(a=> a.classList.toggle('active', a.getAttribute('href')?.includes('hero.html')));

// keep current hero id accessible for other UI bits (e.g. perk modal)
    root.dataset.heroId = meta.id;

    // the active "Heroes • …" link should always point to the current hero
    const selfHeroLink = document.querySelector('.nav-link.active[href^="hero.html?id="]');
    if(selfHeroLink) selfHeroLink.setAttribute('href', `hero.html?id=${encodeURIComponent(meta.id)}`);

    try{
      const data = await ensureDataLoaded(meta);
      render(root, data);

      setupCardModal(root);
      try{ setupPerkBuildModal(root, data); }catch(e){}
      try{ setupMovesToggle(root, data); }catch(e){}

      window.addEventListener('fh:langchange', ()=>{
        render(root, window.FH_HERO_DATA?.[meta.id]);
        try{ setupPerkBuildModal(root, window.FH_HERO_DATA?.[meta.id]); }catch(e){}
        try{ setupMovesToggle(root, window.FH_HERO_DATA?.[meta.id]); }catch(e){}
        try{ updatePerkBuildImage(); } catch(e) {}
      });

    }catch(err){
      root.innerHTML = `<div class="card pad"><h2 style="margin:0 0 8px">${UI.getLang()==='en' ? 'Could not load hero data' : 'Не удалось загрузить данные героя'}</h2><div class="muted">${String(err.message || err)}</div></div>`;
    }
  }

  return { mount };
})();



  function setupPerkBuildModal(root, data){
    const btn = document.getElementById('perkBuildBtn');
    const modal = document.getElementById('perkBuildModal');
    const img = document.getElementById('perkBuildImg');
    const title = document.getElementById('perkBuildTitle');
    const kicker = document.getElementById('perkBuildKicker');
    const text = document.getElementById('perkBuildText');
    if(!btn || !modal || !img || !title || !kicker || !text) return;

    const lang = UI.getLang();

    // content (can be adjusted later)
    const isEn = lang==='en';
    btn.textContent = isEn ? (btn.dataset.labelEn || 'Perk build') : (btn.dataset.labelRu || 'Подбор перков');

    kicker.textContent = '';
    title.textContent = isEn ? 'Perk build' : 'Подбор перков';

    img.src = isEn ? 'assets/img/perk-build-en.jpg' : 'assets/img/perk-build-ru.jpg';

    text.innerHTML = isEn
      ? '<h3 class="perkbuild-what">WHAT IS THIS?</h3><p>This is a quick reference image for perk combinations.</p><p>Use it as a starting point and adjust for your playstyle.</p>'
      : '<h3 class="perkbuild-what">ЧТО ЭТО?</h3><p>Это шпаргалка по комбинациям перков.</p><p>Используй как основу и подгоняй под свой стиль игры.</p>';

    const close = ()=>{
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
    };

    const open = ()=>{
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
    };

    btn.onclick = open;
    modal.querySelectorAll('[data-modal-close]').forEach(el=> el.onclick = close);
    modal.addEventListener('click', (e)=>{
      if(e.target === modal) close();
    });
    window.addEventListener('keydown', (e)=>{
      if(e.key==='Escape' && modal.classList.contains('open')) close();
    });
  }

  function setupMovesToggle(root, data){
    const btn = document.getElementById('movesToggleBtn');
    const host = root.querySelector('[data-moves-list]');
    if(!btn || !host) return;

    // Bind once; on re-render/langchange just refresh label
    if(btn._fhMovesToggleBound){
      try{ btn._fhMovesToggleUpdate?.(); }catch(e){}
      return;
    }
    btn._fhMovesToggleBound = true;

    const t = (ru, en)=> (UI.getLang()==='en' ? en : ru);

    const getAccs = ()=> Array.from(host.querySelectorAll('details.move-acc'));

    const isAllOpen = ()=>{
      const accs = getAccs();
      return accs.length ? accs.every(d=>d.open) : false;
    };

    const updateLabel = ()=>{
      const allOpen = isAllOpen();
      btn.textContent = allOpen ? t('Свернуть всё','Collapse all') : t('Развернуть всё','Expand all');
      btn.classList.toggle('is-collapse', allOpen);
    };

    btn._fhMovesToggleUpdate = updateLabel;

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const accs = getAccs();
      if(!accs.length) return;

      const allOpen = accs.every(d=>d.open);
      const nextOpen = !allOpen;

      accs.forEach(d=>{
        d.open = nextOpen;
        const secId = d.getAttribute('data-sec-id');
        if(secId){
          const heroId = root.dataset.heroId || (data?.meta?.id || data?.id || '');
          try{ localStorage.setItem(`fh_moves_open:${heroId}:${secId}`, nextOpen ? '1' : '0'); }catch(e){}
        }
      });

      updateLabel();
    });

    // When user opens/closes sections manually — keep button label in sync
    host.addEventListener('toggle', (e)=>{
      const det = e.target;
      if(det && det.matches && det.matches('details.move-acc')) updateLabel();
    }, true);

    // When language changes — refresh label
    window.addEventListener('fh:langchange', updateLabel);

    updateLabel();
  }

function updatePerkBuildImage(){
  const img = document.querySelector('.perk-build-img');
  if(!img) return;

  const lang = UI.getLang();
  img.src = lang === 'en'
    ? img.dataset.imgEn
    : img.dataset.imgRu;
}

// при загрузке
updatePerkBuildImage();

// при переключении языка
window.addEventListener('fh:langchange', updatePerkBuildImage);