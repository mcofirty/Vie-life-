// Vérifie les moments de vie (moments.js) puis simule des vies pour mesurer le récit.
//   node tools/check-moments.mjs [nombre de vies par époque]
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = vm.createContext({ console, Intl, Math, Date, JSON, Object, Array, Set, Map, String, Number, RegExp });
for (const f of ["countries.js", "data.js", "sim.js", "economy.js", "moments.js", "careers.js", "company.js", "stardom.js", "spending.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const run = code => vm.runInContext(code, ctx);

// --- Contrôles statiques -------------------------------------------------------
const errors = run(`(() => {
  const errs = [], ids = new Set();
  const FIELDS = new Set(["theme", "kind", "id", "a", "y", "ys", "t", "p", "g", "r", "cc", "not", "cy", "on", "cs", "o", "from", "u", "sex", "is", "w", "once", "gap", "sure", "txt", "fx", "heavy", "hl", "stamp", "set", "need", "after", "clear", "ask", "unless", "odds"]);
  const FX = new Set(["health", "happy", "know", "rel", "cost", "gain", "debt", "fund", "herd"]);
  const KINDS = new Set(["life", "culture", "family", "work", "money", "health", "edu", "move", "history"]);
  const REGIONS = new Set(Object.keys(REGION_NAMES));
  const people = new Set([...Object.keys(KID_F), ...Object.keys(PARENT_F), ...Object.keys(SIB_F)]);
  const sets = new Set(), needs = new Set();
  const checkCodes = (m, list, what) => { for (const x of list) {
    if (x[0] === "@") { if (!ZONES[x.slice(1)]) errs.push(m.id + " : zone inconnue " + x); }
    else if (x[0] === "#") { if (!REGIONS.has(x.slice(1))) errs.push(m.id + " : région inconnue " + x); }
    else if (!BY_CODE[x]) errs.push(m.id + " : pays inconnu " + x + " (" + what + ")");
  } };
  for (const z of Object.values(ZONES)) for (const x of z.split(" ")) if (x[0] !== "#" && x[0] !== "@" && !BY_CODE[x]) errs.push("zone : pays inconnu " + x);
  const checkIs = (m, list) => { for (const c of list) if (!IS[c.name] && !people.has(c.name)) errs.push(m.id + " : condition inconnue " + c.name); };
  const fakeVars = { enfant: { name: "Ada", sex: "f" }, parent: { name: "Omar", sex: "m" }, mere: { name: "Ana", sex: "f" }, pere: { name: "Omar", sex: "m" }, fratrie: { name: "Lin", sex: "m" }, conjoint: { name: "Sam", sex: "f" } };
  const fake = { sex: "f", age: 30, calYear: 2000, here: BY_CODE.FR };
  for (const m of MOMENTS) {
    if (!m.id) { errs.push("moment sans id"); continue; }
    if (ids.has(m.id)) errs.push("id en double : " + m.id);
    ids.add(m.id);
    for (const k of m._keys) if (!FIELDS.has(k)) errs.push(m.id + " : champ inconnu " + k);
    if (!KINDS.has(m.kind)) errs.push(m.id + " : type inconnu " + m.kind);
    if (!m.txt && !m.ask) errs.push(m.id + " : ni texte ni décision");
    for (const k of ["a", "y", "t", "p", "g"]) if (m[k] && (m[k].length !== 2 || m[k][0] > m[k][1])) errs.push(m.id + " : intervalle " + k + " invalide");
    if (m.r) for (const r of m.r) if (!REGIONS.has(r)) errs.push(m.id + " : région inconnue " + r);
    for (const k of ["cc", "not", "from"]) if (m[k]) checkCodes(m, m[k], k);
    for (const k of ["cy", "on"]) if (m[k]) checkCodes(m, Object.keys(m[k]), k);
    if (m.fx) for (const k in m.fx) if (!FX.has(k)) errs.push(m.id + " : effet inconnu " + k);
    checkIs(m, m._is);
    if (m.unless) for (const id of m.unless) if (!MOMENTS.some(x => x.id === id)) errs.push(m.id + " : moment inconnu dans unless " + id);
    if (m.set) sets.add(m.set);
    if (m.need) needs.add(m.need);
    if (m.ask) for (const o of m.ask.opts) { checkIs(m, o._if); if (o.set) sets.add(o.set); if (o.run && !MOMENT_RUN[o.run]) errs.push(m.id + " : action inconnue " + o.run); if (o.fx) for (const k in o.fx) if (!FX.has(k)) errs.push(m.id + " : effet inconnu " + k); }
    for (const s of allTexts(m)) {
      for (const sex of ["m", "f"]) {
        const out = tellText({ ...fake, sex }, s, fakeVars);
        if (/[{}]/.test(out)) errs.push(m.id + " : marque non remplacée dans « " + out + " »");
      }
      for (const [, k] of s.matchAll(/\\{([a-z]+)[:}]/g)) if (!["pays", "age", "annee"].includes(k) && !PERSON_KEYS.includes(k)) errs.push(m.id + " : marque inconnue {" + k + "}");
      const plain = s.replace(/\\{[^}]*\\}/g, "x");
      if (/[^\\s][;:!?»]/.test(plain) || /«[^\\s]/.test(plain)) errs.push(m.id + " : espace manquante autour de la ponctuation dans « " + s + " »");
      if (/'/.test(s)) errs.push(m.id + " : apostrophe droite dans « " + s + " »");
    }
  }
  for (const n of needs) if (!sets.has(n)) errs.push("fil sans début : " + n);
  for (const s of sets) if (!needs.has(s)) errs.push("fil sans suite : " + s);
  return errs;
})()`);
if (errors.length) { console.error(errors.join("\n")); console.error(`\n${errors.length} erreur(s).`); process.exit(1); }

// --- Simulation -------------------------------------------------------------------
const N = +process.argv[2] || 300;
const stats = run(`(() => {
  const seen = {}, eras = {}, tiers = [0, 0, 0, 0, 0, 0];
  let asks = 0; const ask = Life.prototype.ask; Life.prototype.ask = function (t, o) { asks++; return ask.call(this, t, o); };
  for (const [label, year] of [["aujourd’hui", NOW_YEAR], ["1900-2000", null], ["futur", "future"]]) {
    let years = 0, entries = 0, moments = 0, lives = 0;
    asks = 0;
    for (let i = 0; i < ${N}; i++) {
      const y = year === null ? 1900 + Math.floor(Math.random() * 101) : year === "future" ? 2030 + Math.floor(Math.random() * 71) : year;
      const L = new Life({ mode: "births", year: y, auto: true });
      while (L.alive && L.age <= MAX_AGE) { L.step(); if (L.alive && L.age % 10 === 0) tiers[L.livingTier()]++; }
      years += L.age + 1; entries += L.log.length; lives++;
      for (const id in L.seen) { seen[id] = (seen[id] || 0) + 1; moments++; }
    }
    eras[label] = { "phrases par an": +(entries / years).toFixed(2), "moments par vie": +(moments / lives).toFixed(1), "décisions par vie": +(asks / lives).toFixed(1), "âge moyen au décès": +(years / lives - 1).toFixed(1) };
  }
  const never = MOMENTS.filter(m => !seen[m.id]).map(m => m.id);
  const top = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const total = tiers.reduce((s, x) => s + x, 0);
  return { eras, tiers: tiers.map((x, i) => TIER_LABEL[i] + " " + Math.round(x / total * 100) + " %"), top, never, count: MOMENTS.length };
})()`);
console.log(`${stats.count} moments, aucune erreur de structure.\n`);
console.table(stats.eras);
console.log("Paliers de niveau de vie (tous les dix ans) :", stats.tiers.join(" · "));
console.log("\nLes plus fréquents (vies où ils apparaissent) :", stats.top.map(([id, n]) => `${id} ${n}`).join(", "));
console.log(`\nJamais apparus sur ${3 * N} vies (${stats.never.length}) — souvent des pays rares ou des dates précises :\n${stats.never.join(", ")}`);
