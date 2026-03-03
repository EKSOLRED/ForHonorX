// Global hero list used on the Home page.
// Добавлять нового героя проще всего здесь: добавь объект и (опционально) файл данных в assets/data/heroes/<id>.js
window.FH_HEROES = [
  {
    id: 'warden',
    faction: 'knights',
    role: 'vanguard',
    roleKey: 'heroes.warden.role',
    nameKey: 'heroes.warden.name',
    img: 'heroes/warden/img/warden home.webp',
    dataFile: 'assets/data/heroes/warden.js'
  },
  {
    id: 'raider',
    faction: 'vikings',
    role: 'vanguard',
    roleKey: 'heroes.raider.role',
    nameKey: 'heroes.raider.name',
    img: 'assets/img/placeholder-hero.svg',
    dataFile: 'assets/data/heroes/raider.js'
  },
  {
    id: 'kensei',
    faction: 'samurai',
    role: 'vanguard',
    roleKey: 'heroes.kensei.role',
    nameKey: 'heroes.kensei.name',
    img: 'assets/img/placeholder-hero.svg',
    dataFile: 'assets/data/heroes/kensei.js'
  },
  {
    id: 'tiandi',
    faction: 'wulin',
    role: 'vanguard',
    roleKey: 'heroes.tiandi.role',
    nameKey: 'heroes.tiandi.name',
    img: 'assets/img/placeholder-hero.svg',
    dataFile: 'assets/data/heroes/tiandi.js'
  },
  {
    id: 'pirate',
    faction: 'outlanders',
    role: 'hybrid',
    roleKey: 'heroes.pirate.role',
    nameKey: 'heroes.pirate.name',
    img: 'assets/img/placeholder-hero.svg',
    dataFile: 'assets/data/heroes/pirate.js'
  }
];

window.FH_FACTIONS = [
  { id: 'all', titleKey: 'home.filters.all' },
  { id: 'knights', titleKey: 'factions.knights' },
  { id: 'vikings', titleKey: 'factions.vikings' },
  { id: 'samurai', titleKey: 'factions.samurai' },
  { id: 'wulin', titleKey: 'factions.wulin' },
  { id: 'outlanders', titleKey: 'factions.outlanders' }
];

// Roles for Home filters.
window.FH_ROLES = [
  { id: 'all', titleKey: 'home.filters.all' },
  { id: 'vanguard', titleKey: 'roles.vanguard' },
  { id: 'assassin', titleKey: 'roles.assassin' },
  { id: 'heavy', titleKey: 'roles.heavy' },
  { id: 'hybrid', titleKey: 'roles.hybrid' }
];
