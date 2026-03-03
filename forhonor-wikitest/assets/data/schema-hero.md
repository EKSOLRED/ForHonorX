# Hero data schema (FH_HERO_DATA)

Этот файл — «контракт» между данными героя и `assets/js/pages/hero.js`.

## Где лежит
- Реестр героев: `assets/data/heroes.js`
- Данные конкретного героя: `assets/data/heroes/<id>.js`

Каждый файл героя должен добавить запись в глобальный объект:

```js
window.FH_HERO_DATA = window.FH_HERO_DATA || {};
window.FH_HERO_DATA["<id>"] = { /* ... */ };
```

## Минимально обязательные поля
> Если поле отсутствует, страница покажет заглушку/сообщение, но не должна падать.

- `id: string` — совпадает с `heroes.js`.
- `name: { ru: string, en: string }` — имя героя.
- `role: { ru: string, en: string }` — роль.
- `tags?: string[] | { ru: string[], en: string[] }` — теги под названием.
- `banner?: string` — путь к картинке баннера (если нет — используется placeholder).

## Overview (вкладка «Главное»)
- `facts?: Array<{ k:{ru,en} | string, v:{ru,en} | string }>`
- `overview?: Array<{ title?:{ru,en}, text:{ru,en} }>`

## Moves (вкладка «Приёмы»)
- `moves?: {
  sections: Array<{
    title: {ru,en},
    items: Array<{
      name: {ru,en},
      input?: string,
      stats?: Record<string,string>,
      note?: {ru,en} | string,
      link?: string
    }>
  }>
}`

## Feats / Perks (вкладка «Способности»)
- `feats?: Array<{
  tier: 1|2|3|4,
  items: Array<{ name:{ru,en}, desc:{ru,en}, icon?:string, meta?:string }>
}>`
- `perks?: Array<{
  type?: 'offense'|'defense'|'support'|string,
  items: Array<{ name:{ru,en}, desc:{ru,en}, icon?:string }>
}>`

## Punishes (вкладка «Наказания»)
- `punishes?: {
  columns?: Array<{ key:string, title:{ru,en} }>,
  rows?: Array<Record<string, any> & { type?: string | string[] }>,
  types?: Array<{ id:string, title:{ru,en} }>
}`

## Executions (вкладка «Добивания»)
- `executions?: {
  hero?: Array<{ name:{ru,en}, heal?: boolean, dmg?: string, time?: string, video?: string }>,
  common?: Array<{ name:{ru,en}, heal?: boolean, dmg?: string, time?: string, video?: string }>
}`

## Voice (озвучка)
- `voice?: {
  battle?: Array<{ text:{ru,en}, audio?:string }>,
  abilities?: Array<{ text:{ru,en}, audio?:string }>,
  dialogs?: Array<{ text:{ru,en}, audio?:string }>
}`

---

### Совет
Если добавляешь новое поле — **сначала** добавь его в данные Warden, проверь отрисовку, и только потом копируй в других героев.
