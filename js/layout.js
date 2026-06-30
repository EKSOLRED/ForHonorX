(function () {
  function inPages() { return location.pathname.includes('/pages/'); }
  function page(path) { return inPages() ? path : `pages/${path}`; }
  function home() { return inPages() ? '../index.html' : 'index.html'; }
  function isActive(files) {
    const current = location.pathname.split('/').pop() || 'index.html';
    return files.includes(current);
  }
  function navClass(files, extra = '') {
    return `${extra}${isActive(files) ? ' is-active' : ''}`.trim();
  }
  function renderHeader() {
    const mount = document.getElementById('siteHeader');
    if (!mount) return;
    const heroFiles = ['heroes.html', 'hero.html', 'feats.html', 'perks.html', 'executions.html', 'compare.html', 'build.html', 'tierlists.html'];
    const terminologyFiles = ['terminology.html', 'glossary.html'];
    const patchnotesFiles = ['patchnotes.html'];
    mount.innerHTML = `<header class="site-header" id="top">
      <a class="brand brand-text-logo" href="${home()}" aria-label="For Honor X">For Honor X</a>
      <button class="burger" id="burger" aria-label="Открыть меню" aria-expanded="false"><span></span><span></span><span></span></button>
      <nav class="site-nav" id="siteNav" aria-label="Основная навигация">
        <a class="${navClass(['index.html'], 'nav-link')}" href="${home()}">Главная</a>
        <div class="nav-group${isActive(heroFiles) ? ' is-active' : ''}" data-nav-group>
          <div class="nav-group-head">
            <a class="${navClass(heroFiles, 'nav-link nav-link-main')}" href="${page('heroes.html')}">Персонажи</a>
            <button class="nav-group-toggle" type="button" data-nav-group-toggle aria-expanded="false" aria-label="Открыть подраздел"><span class="nav-toggle-chevron" aria-hidden="true"></span></button>
          </div>
          <div class="nav-submenu">
            <a class="${navClass(['heroes.html', 'hero.html'], 'nav-sub-link')}" href="${page('heroes.html')}">Персонажи</a>
            <a class="${navClass(['compare.html'], 'nav-sub-link')}" href="${page('compare.html')}">Сравнение</a>
            <a class="${navClass(['build.html'], 'nav-sub-link')}" href="${page('build.html')}">Подбор перков</a>
            <a class="${navClass(['feats.html'], 'nav-sub-link')}" href="${page('feats.html')}">Способности</a>
            <a class="${navClass(['perks.html'], 'nav-sub-link')}" href="${page('perks.html')}">Перки</a>
            <a class="${navClass(['executions.html'], 'nav-sub-link')}" href="${page('executions.html')}">Добивания</a>
            <a class="${navClass(['tierlists.html'], 'nav-sub-link')}" href="${page('tierlists.html')}">Тир листы</a>
          </div>
        </div>
        <a class="${navClass(['maps.html', 'map.html'], 'nav-link')}" href="${page('maps.html')}">Карты</a>
        <a class="${navClass(['mechanics.html'], 'nav-link')}" href="${page('mechanics.html')}">Механики</a>
        <div class="nav-group${isActive(terminologyFiles) ? ' is-active' : ''}" data-nav-group>
          <div class="nav-group-head">
            <a class="${navClass(terminologyFiles, 'nav-link nav-link-main')}" href="${page('terminology.html')}">Терминология</a>
            <button class="nav-group-toggle" type="button" data-nav-group-toggle aria-expanded="false" aria-label="Открыть подраздел"><span class="nav-toggle-chevron" aria-hidden="true"></span></button>
          </div>
          <div class="nav-submenu">
            <a class="${navClass(['terminology.html'], 'nav-sub-link')}" href="${page('terminology.html')}">Терминология</a>
            <a class="${navClass(['glossary.html'], 'nav-sub-link')}" href="${page('glossary.html')}">Глоссарий</a>
          </div>
        </div>
        <a class="${navClass(patchnotesFiles, 'nav-link')}" href="${page('patchnotes.html')}">Патчноуты</a>
        <a class="${navClass(['about.html'], 'nav-link')}" href="${page('about.html')}">О нас</a>
      </nav>
      <div class="global-search" role="search">
        <input id="globalSearch" type="search" autocomplete="off" placeholder="Поиск по сайту" aria-label="Поиск по сайту">
        <div class="global-results" id="globalSearchResults" hidden></div>
      </div>
    </header>`;
  }
  function renderFooter() {
    const mount = document.getElementById('siteFooter');
    if (!mount) return;
    mount.innerHTML = `<footer class="site-footer"><div><strong>For Honor X</strong><p>Локальный справочник по For Honor без backend, сборщиков и лишней пыли на клинке.</p></div></footer>`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
  });
})();
