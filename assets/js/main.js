/* global UI */
(function(){
  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function setupNav(){
    const openBtn = document.querySelector('[data-nav-open]');
    const closeBtn = document.querySelector('[data-nav-close]');
    const backdrop = document.querySelector('.backdrop');

    const close = () => document.body.classList.remove('nav-open');
    const open = () => document.body.classList.add('nav-open');

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);

    // close on escape
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') close();
    });
  }


  function setupActiveNav(){
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-link').forEach(a=>{
      const href = (a.getAttribute('href')||'').split('?')[0].toLowerCase();
      const isActive = href === path;
      a.classList.toggle('active', isActive);
    });
  }

  function setupLang(){
    function updateLangButtons(){
      const cur = UI.getLang();
      document.querySelectorAll('[data-lang]').forEach(b=>{
        b.classList.toggle('active', b.getAttribute('data-lang')===cur);
      });
    }

    UI.applyTranslations(UI.getLang());
    updateLangButtons();

    document.querySelectorAll('[data-lang]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const lang = btn.getAttribute('data-lang');
        UI.setLang(lang);
        UI.applyTranslations(lang);
        updateLangButtons();

        // let pages update any language-dependent UI
        window.dispatchEvent(new CustomEvent('fh:langchange', { detail: { lang } }));
      });
    });
  }

  onReady(()=>{
    setupNav();
    setupLang();
    setupActiveNav();

    const page = document.body.getAttribute('data-page');
    if(page === 'home' && window.HomePage) window.HomePage.mount();
    if(page === 'hero' && window.HeroPage) window.HeroPage.mount();
  });
})();
