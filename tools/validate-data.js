#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const heroRoot = path.join(root, "js/data/heroes");
const mapRoot = path.join(root, "js/data/maps");
const heroPartOrder = ["base.js", "moves.js", "executions.js", "punishments.js", "feats.js", "perks.js", "guide.js", "voice.js", "register.js"];

function jsFilesFromDirectories(rootDir, partOrder) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir)
    .filter((name) => fs.statSync(path.join(rootDir, name)).isDirectory())
    .filter((name) => name !== "templates")
    .sort()
    .flatMap((name) => partOrder.map((file) => `js/data/heroes/${name}/${file}`));
}

function jsFilesFromFolder(rootDir, prefix) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => `${prefix}/${file}`);
}

const scripts = [
  "js/data/core.js",
  "js/data/search-index.js",
  "js/data/availability.js",
  "js/data/executions.js",
  "js/data/feats.js",
  "js/data/perks.js",
  "js/data/heroes.js",
  "js/data/hero-parts.js",
  ...jsFilesFromDirectories(heroRoot, heroPartOrder),
  "js/data/heroes-catalog.js",
  "js/data/maps.js",
  ...jsFilesFromFolder(mapRoot, "js/data/maps"),
  "js/data/mechanics.js",
  "js/data/terminology.js",
  "js/data/helpers.js",
  "js/data/move-glossary.js",
  "js/data/tierlists.js",
  "js/data/index.js"
];

const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const script of scripts) {
  const fullPath = path.join(root, script);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Файл не найден: ${script}`);
  }
  vm.runInContext(fs.readFileSync(fullPath, "utf8"), sandbox, { filename: script });
}

const data = sandbox.FH_DATA;
const errors = [];
const warnings = [];

function hasText(value) {
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value && typeof value === "object" && Object.values(value).some((item) => typeof item === "string" && item.trim()));
}

function textKey(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") return Object.values(value).filter((item) => typeof item === "string").join("|").trim();
  return String(value ?? "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueValues(values, label) {
  const seen = new Set();
  for (const value of values || []) {
    const key = textKey(value);
    if (!key) continue;
    if (seen.has(key)) errors.push(`${label}: дубль "${key}"`);
    seen.add(key);
  }
}

function uniqueIds(items, label) {
  const seen = new Set();
  for (const item of items || []) {
    if (!item.id) errors.push(`${label}: отсутствует id`);
    if (item.id && seen.has(item.id)) errors.push(`${label}: дублирующийся id "${item.id}"`);
    if (item.id) seen.add(item.id);
  }
}

function exists(relativePath, label) {
  if (!relativePath) {
    errors.push(`${label}: путь не указан`);
    return;
  }
  const normalizedPath = String(relativePath).replace(/^\.\//, "").replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!fs.existsSync(path.join(root, normalizedPath))) errors.push(`${label}: файл не найден: ${relativePath}`);
}

uniqueIds(data.heroes, "heroes");
uniqueIds(data.heroCatalog, "heroCatalog");
uniqueIds(data.maps, "maps");
uniqueIds(data.mechanics, "mechanics");
uniqueIds(data.feats, "feats");
uniqueIds(data.perks, "perks");
uniqueIds(data.executions, "executions");
uniqueIds(data.helpers, "helpers");
uniqueIds(data.glossary, "glossary");

const featIds = new Set(data.feats.map((feat) => feat.id));
const perkIds = new Set(data.perks.map((perk) => perk.id));
const executionIds = new Set(data.executions.map((execution) => execution.id));

for (const hero of data.heroes) {
  if (!hasText(hero.name)) errors.push(`hero ${hero.id}: нет имени`);
  if (!hasText(hero.faction)) errors.push(`hero ${hero.id}: нет фракции`);
  if (!hasText(hero.type)) errors.push(`hero ${hero.id}: нет класса`);
  if (!hasText(hero.summary)) warnings.push(`hero ${hero.id}: нет краткого описания`);
  if (!hasText(hero.dodgeDefenseType)) errors.push(`hero ${hero.id}: нет dodgeDefenseType`);
  if (!hasText(hero.defaultGuardSide)) errors.push(`hero ${hero.id}: нет defaultGuardSide`);
  if (hero.sprintSpeed == null) errors.push(`hero ${hero.id}: нет sprintSpeed`);
  if (!hero.guardWalkSpeed || hero.guardWalkSpeed.forward == null || hero.guardWalkSpeed.side == null || hero.guardWalkSpeed.backward == null) {
    errors.push(`hero ${hero.id}: неполный guardWalkSpeed`);
  }
  if (hero.forwardDodgeRecovery == null) errors.push(`hero ${hero.id}: нет forwardDodgeRecovery`);

  const heroFeatRefs = Array.isArray(hero.feats) ? hero.feats : (hero.featIds || []).map((id) => ({ id }));
  const heroPerkRefs = Array.isArray(hero.perks) ? hero.perks : (hero.perkIds || []).map((id) => ({ id }));
  const heroFeatIds = heroFeatRefs.map((item) => item.id).filter(Boolean);
  const heroPerkIds = heroPerkRefs.map((item) => item.id).filter(Boolean);

  if (!heroFeatIds.length) errors.push(`hero ${hero.id}: нет способностей`);
  if (!heroPerkIds.length) errors.push(`hero ${hero.id}: нет перков`);

  for (const perk of heroPerkRefs) {
    if (perk.rarity && !["common", "rare", "heroic", "epic", "legendary"].includes(perk.rarity)) {
      errors.push(`hero ${hero.id}: некорректная редкость "${perk.rarity}" у перка "${perk.id}"`);
    }
  }

  uniqueValues(heroFeatIds, `hero ${hero.id} feats`);
  uniqueValues(heroPerkIds, `hero ${hero.id} perks`);
  uniqueValues(asArray(hero.executions?.unique).map((item) => textKey(item.name)), `hero ${hero.id} unique executions`);
  uniqueValues(asArray(hero.punishments).map((item) => [item.situation, item.punish, item.damage, item.input].map(textKey).join("|")), `hero ${hero.id} punishments`);
  uniqueValues(asArray(hero.voice).map((item) => item.original), `hero ${hero.id} voice lines`);

  for (const id of asArray(hero.executions?.commonIds)) if (!executionIds.has(id)) errors.push(`hero ${hero.id}: неизвестное общее добивание "${id}"`);
  for (const execution of asArray(hero.executions?.common)) if (!executionIds.has(execution.id)) errors.push(`hero ${hero.id}: неизвестное общее добивание "${execution.id}"`);
  for (const id of heroFeatIds) if (!featIds.has(id)) errors.push(`hero ${hero.id}: неизвестная способность "${id}"`);
  for (const id of heroPerkIds) if (!perkIds.has(id)) errors.push(`hero ${hero.id}: неизвестный перк "${id}"`);

  exists(hero.image, `hero ${hero.id} image`);
  exists(hero.banner, `hero ${hero.id} banner`);
}

for (const map of data.maps) {
  if (!hasText(map.name)) errors.push(`map ${map.id}: нет имени`);
  exists(map.image, `map ${map.id} image`);
  if (map.tacticalDefense) exists(map.tacticalDefense, `map ${map.id} tacticalDefense`);
  if (map.tacticalAttack) exists(map.tacticalAttack, `map ${map.id} tacticalAttack`);
}

for (const feat of data.feats) {
  if (!hasText(feat.name)) errors.push(`feat ${feat.id}: нет имени`);
  if (!hasText(feat.description)) errors.push(`feat ${feat.id}: нет описания`);
  exists(feat.image, `feat ${feat.id} image`);
}

for (const perk of data.perks) {
  if (!hasText(perk.name)) errors.push(`perk ${perk.id}: нет имени`);
  if (!hasText(perk.description)) errors.push(`perk ${perk.id}: нет описания`);
  exists(perk.image, `perk ${perk.id} image`);
}

if (warnings.length) {
  console.log("Предупреждения:");
  warnings.forEach((item) => console.log(`- ${item}`));
}

if (errors.length) {
  console.error("Проверка данных не пройдена:");
  errors.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Проверка данных пройдена: ${data.heroes.length} героев, ${data.heroCatalog.length} карточек каталога, ${data.feats.length} способностей, ${data.perks.length} перков, ${data.executions.length} добиваний, ${data.maps.length} карт.`);
