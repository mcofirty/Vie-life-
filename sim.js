// Moteur de simulation : une vie, année après année.

const rand = Math.random;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pick = arr => arr[Math.floor(rand() * arr.length)];
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function weighted(entries) {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  let r = rand() * total;
  for (const [k, w] of entries) { r -= Math.max(0, w); if (r <= 0) return k; }
  return entries[entries.length - 1][0];
}

// Loi normale : fonction de répartition et quantile (approximation d'Acklam).
function normCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
function normInv(p) {
  p = clamp(p, 1e-9, 1 - 1e-9);
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// --- Époques -----------------------------------------------------------------
// Les valeurs de data.js décrivent les années 2020. Pour une autre année, on les
// fait évoluer : vers le passé à partir de points d'appui par région (1900, 1950),
// vers le futur selon des tendances proches des projections de l'ONU.
const NOW_YEAR = Math.min(new Date().getFullYear(), MAX_YEAR);
const ERAS = {
  today: "Aujourd’hui",
  past: "Le passé (1900-2000)",
  future: "Le futur (2030-2100)",
  random: "Au hasard (1900-2100)",
  year: "Choisir l’année",
};
function drawYear(era, chosen) {
  if (era === "past") return MIN_YEAR + Math.floor(rand() * 101);
  if (era === "future") return 2030 + Math.floor(rand() * 71);
  if (era === "random") return MIN_YEAR + Math.floor(rand() * (MAX_YEAR - MIN_YEAR + 1));
  if (era === "year") return clamp(Math.round(+chosen || NOW_YEAR), MIN_YEAR, MAX_YEAR);
  return NOW_YEAR;
}

// Valeur d'une série décennale (1900, 1910… 2100) à une année quelconque.
function seriesAt(arr, year) {
  if (!arr) return null;
  const x = (clamp(year, MIN_YEAR, MAX_YEAR) - MIN_YEAR) / 10, i = Math.floor(x), f = x - i;
  const a = arr[i], b = arr[Math.min(i + 1, arr.length - 1)];
  if (a == null) return b;
  if (b == null) return a;
  return a + (b - a) * f;
}

// Statistiques d'un pays une année donnée : les valeurs récentes (countries.js),
// déplacées selon les séries longues du pays (passé réel, projections de l'ONU).
const countryCache = {};
function countryAt(code, year) {
  year = clamp(Math.round(year), MIN_YEAR, MAX_YEAR);
  const key = code + year;
  if (countryCache[key]) return countryCache[key];
  const c = BY_CODE[code];
  if (year === DATA_YEAR) return (countryCache[key] = { ...c, year });
  const S = COUNTRY_SERIES[code] || {};
  const ratio = (k, ref = DATA_YEAR) => { const a = seriesAt(S[k], year), b = seriesAt(S[k], ref); return a != null && b ? a / b : 1; };
  const diff = (k, ref = DATA_YEAR) => { const a = seriesAt(S[k], year), b = seriesAt(S[k], ref); return a != null && b != null ? a - b : 0; };
  const back = Math.max(0, DATA_YEAR - year), fwd = Math.max(0, year - DATA_YEAR), k = clamp(fwd / 90, 0, 1);
  const rich = c.gdp > 30000 || ["EUR", "NAM", "OCE"].includes(c.region);
  const d = diff("e0");
  const e0 = { m: clamp(c.e0.m + d, 18, 97), f: clamp(c.e0.f + d, 20, 99) };
  const imr = clamp(c.imr * ratio("u5"), 1, 320);
  let gdp = c.gdp;
  if (year <= 2020) gdp = c.gdp * ratio("gdp", 2020);
  else for (let i = 0; i < fwd; i++) gdp *= 1 + 0.01 + 0.025 * clamp(1 - gdp / 60000, 0, 1);
  gdp = Math.max(400, gdp);
  const school = year <= 2020 ? Math.max(0.1, c.school + diff("school", 2020)) : Math.max(c.school, c.school + (13.5 - c.school) * k * 0.8);
  const tert = year < DATA_YEAR ? c.tert * clamp((school / Math.max(c.school, 0.5)) ** 3, 0.002, 1) : Math.max(c.tert, c.tert + (90 - c.tert) * k * 0.6);
  return (countryCache[key] = {
    ...c, year, e0, imr, gdp: Math.round(gdp), school, tert,
    births: c.births * ratio("births"), pop: c.pop * ratio("pop"), tfr: Math.max(0.6, c.tfr + diff("tfr")),
    mmr: clamp(c.mmr * imr / c.imr, 2, 1500),
    cm: back ? Math.min(75, c.cm + back * (rich ? 0.05 : 0.25)) : c.cm * Math.exp(-fwd / 30),
    hiv: year < 1980 ? 0 : year < 2000 ? c.hiv * (year - 1980) / 20 : year > DATA_YEAR ? c.hiv * Math.exp(-fwd / 25) : c.hiv,
    agri: back ? c.agri + (100 - c.agri) * 0.45 * back / (DATA_YEAR - MIN_YEAR) : c.agri * Math.exp(-fwd / 40),
    urban: back ? Math.max(c.urban * 0.25, c.urban - back * 0.4) : c.urban + (90 - c.urban) * k * 0.5,
    net: year < 1993 ? 0 : back ? c.net * clamp((year - 1993) / (DATA_YEAR - 1993), 0, 1) ** 2 : c.net + (97 - c.net) * k,
    bank: back ? c.bank * clamp(1 - back / 140, 0.08, 1) : c.bank + (98 - c.bank) * k,
    flp: back ? c.flp * clamp(1 - back / 160, 0.35, 1) : c.flp,
    happy: clamp(c.happy + 0.45 * Math.log(gdp / c.gdp), 2.5, 8),
  });
}

// Événements historiques en cours pour un pays et une année.
function activeEvents(code, year) {
  const out = [];
  for (const ev of HISTORY) {
    const loc = ev.c && ev.c[code];
    if (!loc && !ev.world) continue;
    const p = { ...(ev.all || {}), ...(loc || {}) };
    const from = p.from ?? ev.from, to = p.to ?? ev.to;
    if (year >= from && year <= to) out.push({ ev, p, from, to });
  }
  return out;
}
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

// --- Mortalité -------------------------------------------------------------
// Âge 0 : mortalité infantile. 1–4 ans : fraction de celle-ci.
// 5 ans et plus : loi de Gompertz-Makeham dont le paramètre B est calé pour
// retrouver l'espérance de vie à la naissance du pays, du sexe et de l'année.
const MAX_AGE = 110;
const GOMPERTZ_G = 0.095;
const lifeTables = {};

function makeham(c) {
  return 0.0004 + c.hom / 100000 + (c.region === "SSA" ? 0.002 : 0);
}
function qxWith(c, sex, age, B) {
  const sexf = sex === "m" ? 1.12 : 0.88;
  if (age === 0) return clamp(c.imr / 1000 * sexf, 0, 0.5);
  if (age < 5) return clamp(c.imr / 1000 * 0.12 * sexf, 0, 0.2);
  if (age >= MAX_AGE) return 1;
  const mu = makeham(c) * (sex === "m" ? 1.3 : 0.8) + B * Math.exp(GOMPERTZ_G * (age - 30));
  return clamp(1 - Math.exp(-mu), 0, 1);
}
function e0With(c, sex, B) {
  let l = 1, e = 0;
  for (let x = 0; x <= MAX_AGE; x++) {
    const q = qxWith(c, sex, x, B);
    e += l * (1 - q / 2);
    l *= 1 - q;
  }
  return e;
}
// Table de mortalité « du moment » (par tranches de 5 ans).
function lifeTable(code, sex, year = DATA_YEAR) {
  const y = clamp(Math.round(year / 5) * 5, MIN_YEAR, MAX_YEAR);
  const key = code + sex + y;
  if (lifeTables[key]) return lifeTables[key];
  const c = countryAt(code, y);
  let lo = Math.log(1e-7), hi = Math.log(0.5);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (e0With(c, sex, Math.exp(mid)) > c.e0[sex]) lo = mid; else hi = mid;
  }
  const B = Math.exp((lo + hi) / 2);
  const qx = [], lx = [];
  let l = 1;
  for (let x = 0; x <= MAX_AGE; x++) { const q = qxWith(c, sex, x, B); qx.push(q); lx.push(l); l *= 1 - q; }
  return (lifeTables[key] = { qx, lx });
}
// Survivants d'une génération : chaque âge est vécu dans son année du calendrier.
const cohorts = {};
function cohortLx(code, sex, birthYear = DATA_YEAR) {
  const key = code + sex + birthYear;
  if (cohorts[key]) return cohorts[key];
  const lx = [];
  let l = 1;
  for (let a = 0; a <= MAX_AGE; a++) { lx.push(l); l *= 1 - lifeTable(code, sex, birthYear + a).qx[a]; }
  return (cohorts[key] = lx);
}

// --- Revenus ---------------------------------------------------------------
// Distribution log-normale dont l'écart-type découle de l'indice de Gini.
function incomeAt(c, p) {
  const sigma = Math.SQRT2 * normInv((c.gini / 100 + 1) / 2);
  const mean = c.gdp * 0.6;
  const median = mean * Math.exp(-sigma * sigma / 2);
  return median * Math.exp(sigma * normInv(clamp(p, 0.005, 0.995)));
}
// --- Tirage au sort ----------------------------------------------------------
function drawCountry(mode, year = NOW_YEAR) {
  return weighted(COUNTRIES.map(c => { const x = countryAt(c.code, year); return [c.code, mode === "pop" ? x.pop : x.births]; }));
}
function birthOdds(code, mode, year = NOW_YEAR) {
  const w = c => { const x = countryAt(c.code, year); return mode === "pop" ? x.pop : x.births; };
  return Math.round(COUNTRIES.reduce((s, c) => s + w(c), 0) / w(BY_CODE[code]));
}
function drawSex() { return rand() < 0.512 ? "m" : "f"; }
function drawName(code, sex) { return pick(namesFor(code)[sex === "m" ? 0 : 1]); }

const EDU_LABEL = { none: "aucune", primaire: "école primaire", secondaire: "lycée", universite: "université" };
const EDU_Z = { none: -1.3, primaire: -0.6, secondaire: 0.3, universite: 1.3 };

// Santé moyenne observée par âge dans la simulation (sans mortalité).
const HEALTH_CURVE = [[0, 66], [18, 71.5], [30, 69.6], [40, 63], [50, 56], [60, 49], [70, 38], [80, 25.5], [90, 14], [100, 6], [MAX_AGE, 3]];
function expectedHealth(age) {
  for (let i = 1; i < HEALTH_CURVE.length; i++) {
    const [a1, h1] = HEALTH_CURVE[i];
    if (age <= a1) { const [a0, h0] = HEALTH_CURVE[i - 1]; return h0 + (h1 - h0) * (age - a0) / (a1 - a0); }
  }
  return 3;
}

const PAUSE_AGES = [5, 15, 30, 50, 70];
const PRIORITIES = {
  equilibre: "Équilibre",
  sante: "Santé",
  travail: "Études et travail",
  famille: "Famille et amis",
  plaisir: "Plaisirs",
};
// Thèmes les plus lourds, mis de côté en mode classe et signalés avec une aide.
const HEAVY_CAUSES = ["suicide", "homicide", "surdose"];
const CLASSROOM_CAUSE = { "répression politique": "conflit", "génocide": "conflit", "violences armées": "conflit", "violences politiques": "conflit", "violences de la Partition": "conflit", "mort au combat": "guerre", "mort au front": "guerre" };

class Life {
  constructor(opts = {}) {
    this.mode = opts.mode || "births";
    this.year = opts.year ?? NOW_YEAR;
    this.classroom = !!opts.classroom;
    this.code = opts.code || drawCountry(this.mode, this.year);
    this.country = countryAt(this.code, this.year);
    this.home = this.code;
    this.sex = opts.sex || drawSex();
    this.name = opts.name || drawName(this.code, this.sex);
    this.auto = !!opts.auto;
    this.decile = opts.lineage ? opts.lineage.decile : 1 + Math.floor(rand() * 10);
    this.age = 0;
    this.alive = true;
    const c = this.country;
    this.stats = {
      health: clamp(62 + (c.e0.f - 70) * 0.8 + randn() * 8, 20, 95),
      happy: clamp(50 + (c.happy - 5.5) * 5 + randn() * 6, 10, 90),
      know: clamp(10 + randn() * 4, 2, 25),
      rel: clamp(55 + randn() * 8, 20, 90),
    };
    this.healthStart = this.stats.health;
    this.healthRef = this.stats.health;
    this.edu = "none";
    this.schooling = null; // "primaire" | "secondaire" | "universite" | null
    this.job = null;
    this.incomePct = null;
    this.income = 0;
    this.econ = 1;
    this.retired = false;
    this.partner = null;
    this.married = false;
    this.marriedEver = false;
    this.children = [];
    this.grandkids = 0;
    this.wantKids = "oui";
    // Famille d'origine (ou, pour un descendant, la famille de la vie précédente)
    if (opts.lineage) this.initLineage(opts.lineage);
    else this.initParents(c);
    this.initMoney();
    this.initParentDetails();
    // Santé
    this.smoker = false;
    this.smokeOffered = false;
    this.hivPos = false;
    this.hivYear = null;
    this.pendingDeath = null;
    this.emigrated = false;
    this.emigrationOffered = false;
    this.priority = "equilibre";
    this.events = {};
    this.drafted = {};
    this.log = [];
    this.highlights = [];
    this.reflections = [];
    this.queue = [];
    this.history = []; // un instantané par année
    this.cause = null;
    this.born = new Date();
    // Date de naissance dans le calendrier de la vie simulée.
    this.birthDate = this.year === NOW_YEAR ? new Date() : new Date(this.year, Math.floor(rand() * 12), 1 + Math.floor(rand() * 28), Math.floor(rand() * 24), Math.floor(rand() * 60));
    this.say(`Naît ${inCountry(c)}${this.year !== NOW_YEAR ? ` en ${this.year}` : ""}, dans une famille ${this.familyLabel()}.`, "birth");
    if (this.lineage) this.say(`Enfant de ${this.lineage.parentName}, votre vie précédente (génération ${this.lineage.gen}).`, "family", true);
    this.historyEvents(true);
    this.snapshot();
  }

  initParents(c) {
    const momAge = clamp(Math.round(17 + c.tfr * 1.5 + (c.gdp > 25000 ? 6 : 0) + randn() * 4), 15, 45);
    this.parents = [
      { role: "mère", name: this.freshName("f"), sex: "f", age: momAge, alive: true },
    ];
    this.parents.push({ role: "père", name: this.freshName("m"), sex: "m", age: momAge + clamp(Math.round(3 + randn() * 4), -3, 15), alive: true });
    this.sibs = [];
    const older = Math.min(Math.floor((momAge - 16) / 2.5), Math.floor(rand() * Math.max(0, c.tfr - 0.4) + rand() * 0.6));
    for (let i = older; i >= 1; i--) { const sx = drawSex(); this.sibs.push({ name: this.freshName(sx), sex: sx, born: -2 * i - Math.floor(rand() * 2), alive: true }); }
  }

  g(m, f) { return this.sex === "m" ? m : f; }
  // Un prénom qui n'est pas déjà porté dans la famille (si possible).
  freshName(sex, code = this.code) {
    const used = new Set([this.name, this.partner, ...(this.parents || []).map(p => p.name), ...(this.sibs || []).map(x => x.name), ...this.children.map(k => k.name), ...this.children.map(k => k.other)]);
    const pool = namesFor(code)[sex === "m" ? 0 : 1], free = pool.filter(n => !used.has(n));
    return pick(free.length ? free : pool);
  }
  get calYear() { return this.year + this.age; }
  get here() { return countryAt(this.code, this.calYear); }
  get siblings() { return this.sibs.filter(s => s.born <= this.age).length; }
  familyLabel() {
    const d = this.decile;
    if (d <= 2) return "parmi les plus pauvres du pays";
    if (d <= 4) return "modeste";
    if (d <= 7) return "aux revenus moyens";
    if (d <= 9) return "aisée";
    return "parmi les plus riches du pays";
  }
  say(text, kind = "", highlight = false, heavy = false) {
    const entry = { age: this.age, year: this.calYear, text, kind };
    if (highlight) entry.hl = true;
    if (heavy) entry.heavy = true;
    this.log.push(entry);
    if (highlight) this.highlights.push(entry);
    return entry;
  }
  ask(text, options) {
    this.queue.push({ text, options, age: this.age });
  }
  resolve(i) {
    const d = this.queue.shift();
    if (!d) return;
    const opt = d.options[i];
    if (opt.apply) opt.apply();
  }
  autoResolveAll() {
    while (this.queue.length) {
      const d = this.queue[0];
      const weights = d.options.map(o => o.autoWeight ?? 1);
      const i = weighted(weights.map((w, idx) => [idx, w]));
      this.resolve(i);
    }
  }
  bump(stat, v) { this.stats[stat] = clamp(this.stats[stat] + v, 0, 100); }

  snapshot() {
    this.history[this.age] = {
      age: this.age, year: this.calYear, alive: this.alive, ...Object.fromEntries(Object.entries(this.stats).map(([k, v]) => [k, Math.round(v)])),
      edu: this.edu, schooling: this.schooling, job: this.job, income: Math.round(this.income),
      married: this.married, children: this.children.filter(k => k.alive).length, code: this.code,
      wealth: Math.round(this.netWorth()), pct: this.incomePct == null ? null : Math.round(this.incomePct * 100) / 100,
    };
  }

  // Probabilité de mourir pendant l'année, modulée par la santé (comparée à la
  // santé moyenne à cet âge), la richesse, le tabac et le VIH.
  hazard() {
    if (this.age >= MAX_AGE) return 1;
    if (this.protected()) return 0;
    const t = lifeTable(this.code, this.sex, this.calYear);
    const q = t.qx[Math.min(this.age, MAX_AGE)];
    const wealth = this.incomePct != null ? this.incomePct : (this.decile - 0.5) / 10;
    // Écart à la santé « attendue » de cette personne (même évolution, sans les aléas).
    const expected = this.healthRef ?? expectedHealth(this.age);
    let mult = Math.exp(-(this.stats.health - expected) / 45) * (1.25 - wealth * 0.5);
    // Les tables du pays incluent déjà ses fumeurs : on répartit l'écart entre fumeurs et non-fumeurs.
    if (this.age >= 35) { const sh = this.here.smoke / 100; mult *= (this.smoker ? 1.6 : 1) / (1 + 0.6 * sh); }
    let extra = 0;
    if (this.hivPos) { if (this.hivTreated()) mult *= 1.5; else extra = 0.09; }
    return clamp(1 - (1 - clamp(q * mult, 0, 1)) * (1 - extra), 0, 1);
  }
  // Un descendant vit au moins jusqu'à la mort du parent dont on a déjà joué la vie.
  protected() { return this.protectUntil != null && this.age < this.protectUntil; }
  hivTreated() { return this.calYear >= (this.here.gdp > 25000 ? 1996 : 2005); }

  pickCause() {
    const c = this.here, a = this.age;
    const bracket = a < 5 ? "infant" : a < 30 ? "young" : a < 65 ? "adult" : "old";
    const table = CAUSES[bracket];
    const w = { ...table.base };
    for (const [k, v] of Object.entries(table[c.region] || {})) w[k] = (w[k] || 0) + v;
    if ("homicide" in w) w.homicide = c.hom * (bracket === "young" ? 1.4 : 0.4) * this.g(1.6, 0.4);
    if ("accident de la route" in w) w["accident de la route"] *= this.g(1.4, 0.6);
    if (this.smoker) { w.cancer = (w.cancer || 0) * 2; if (w["maladie respiratoire chronique"]) w["maladie respiratoire chronique"] *= 2.5; }
    if (this.hivPos && !this.hivTreated()) return "VIH/sida";
    if (this.hivPos) w["VIH/sida"] = (w["VIH/sida"] || 0) + 20;
    if (this.classroom) HEAVY_CAUSES.forEach(k => delete w[k]);
    return weighted(Object.entries(w));
  }

  // Avance d'une année. Les décisions éventuelles s'ajoutent à this.queue.
  step() {
    if (!this.alive) return;
    // Risque « ordinaire », plus celui des guerres, famines et épidémies en cours.
    const q = this.hazard();
    let extra = 0;
    const extraCauses = [];
    for (const { ev, p } of activeEvents(this.code, this.calYear)) {
      const x = (p.excess || 0) + (this.age >= 65 ? p.old || 0 : 0);
      if (x) { extra += x; extraCauses.push([ev.cause || "guerre", x]); }
      if (this.drafted[ev.id] === "front" && p.soldier) { extra += p.soldier; extraCauses.push([ev.soldierCause || ev.cause || "guerre", p.soldier]); }
    }
    extra = this.protected() ? 0 : Math.min(0.9, extra);
    const total = 1 - (1 - q) * (1 - extra);
    if (rand() < total) return this.die(rand() * total < extra ? weighted(extraCauses) : null);
    this.age += 1;
    this.actionsLeft = ACTIONS_PER_YEAR;
    this.historyEvents();
    this.familyEvents();
    this.yearEvents();
    if (this.pendingDeath && !this.protected()) return this.die(this.pendingDeath);
    this.pendingDeath = null;
    this.updateStats();
    this.updateMoney();
    this.snapshot();
    if (this.auto) this.autoResolveAll();
  }

  die(cause) {
    this.alive = false;
    cause = cause || this.pickCause();
    if (this.classroom) cause = CLASSROOM_CAUSE[cause] || cause;
    this.cause = cause;
    const ageTxt = this.age === 0 ? "avant son premier anniversaire" : `à ${this.age} ans`;
    this.say(`Meurt ${ageTxt}. Cause : ${this.cause}.`, "death", true, HEAVY_CAUSES.includes(this.cause));
    this.queue = [];
    this.snapshot();
  }

  // Guerres, crises et épidémies que traverse le pays cette année.
  historyEvents(atBirth = false) {
    const active = activeEvents(this.code, this.calYear);
    this.econ = 1;
    this.emigBoost = 1;
    for (const { ev, p, from } of active) {
      if (!this.events[ev.id]) {
        this.events[ev.id] = true;
        const txt = atBirth ? `Naît pendant ${ev.name}.` : this.calYear === from ? ev.text : `Le pays traverse ${ev.name}.`;
        this.say(`${this.calYear} · ${txt}`, "history", true);
      }
      if (atBirth) continue;
      if (p.econ) this.econ *= p.econ;
      if (ev.happy) this.bump("happy", ev.happy * (this.age < 5 ? 0.3 : 1));
      if (ev.school && this.schooling) this.bump("know", ev.school * 10);
      if (ev.emigrate) this.emigBoost = ev.emigrate;
      if (ev.jobLoss && this.job && !this.retired && !this.business && rand() < ev.jobLoss) {
        this.loseJob(`Perd son travail à cause de ${ev.name}.`);
        this.bump("happy", -6);
      }
      if (p.draft && this.sex === "m" && this.age >= 18 && this.age <= 40 && !this.drafted[ev.id] && rand() < p.draft) {
        this.drafted[ev.id] = "pending";
        this.ask(`${capFirst(ev.name)} : ${this.name} est mobilisé. Que faire ?`, [
          { label: "Partir au front", autoWeight: 5, apply: () => { this.drafted[ev.id] = "front"; this.say(`Est mobilisé et part au front (${ev.name}).`, "history", true); this.bump("happy", -6); this.bump("rel", -4); } },
          { label: "Tenter d’y échapper", autoWeight: 1, apply: () => {
            if (rand() < 0.35) { this.drafted[ev.id] = "escaped"; this.say("Parvient à échapper à la mobilisation.", "history", true); this.bump("rel", -3); }
            else { this.drafted[ev.id] = "front"; this.say("Est rattrapé et envoyé au front.", "history", true); this.bump("happy", -10); }
          } },
        ]);
      }
    }
    // Retour du front quand la guerre est finie.
    for (const [id, st] of Object.entries(this.drafted)) {
      if (st === "front" && !active.some(x => x.ev.id === id)) {
        this.drafted[id] = "back";
        this.say(`Rentre de ${HISTORY.find(e => e.id === id).name}. Rien n’est plus tout à fait comme avant.`, "history", true);
        this.bump("happy", -4); this.bump("health", -3);
      }
    }
  }

  // Parents, frères et sœurs, petits-enfants.
  familyEvents() {
    const a = this.age, c = this.here;
    for (const p of this.parents) {
      if (!p.alive) continue;
      p.age += 1;
      // Le parent dont on a joué la vie meurt exactement comme dans cette vie-là.
      const dies = p.previous ? a >= p.deathAt : rand() < lifeTable(this.home, p.sex, this.calYear).qx[Math.min(p.age, MAX_AGE)];
      if (dies) {
        p.alive = false;
        const young = a < 18;
        this.say(`${p.sex === "f" ? "Sa mère" : "Son père"}, ${p.name}, meurt à ${p.age} ans${p.previous ? ` (${p.cause}) : c’était votre vie précédente` : ""}.`, "family", true, young);
        this.bump("happy", young ? -16 : -10); if (young) this.bump("rel", -5);
        this.inheritFrom(p);
      }
    }
    if (a >= 1 && a <= 14 && this.parents[0].alive && this.parents[0].age < 44 && rand() < (c.tfr - 1) / 12) {
      const sx = drawSex(), sib = { name: this.freshName(sx, this.home), sex: sx, born: a, alive: true };
      this.sibs.push(sib);
      this.say(`${sx === "m" ? "Un petit frère" : "Une petite sœur"} arrive : ${sib.name}.`, "family");
      if (rand() < c.imr * 1.2 / 1000) { sib.alive = false; this.say(`${sib.name} meurt bébé.`, "family", true, true); this.bump("happy", -8); }
    }
    const grown = this.children.filter(k => k.alive && a - k.born >= 20).length;
    if (grown && rand() < 0.1 * grown * clamp(c.tfr / 2.5, 0.3, 1.5)) {
      this.grandkids++;
      this.say(this.grandkids === 1 ? "Devient grand-parent." : pick(["Un petit-enfant naît.", "La famille s’agrandit encore."]), "family", this.grandkids === 1);
      this.bump("happy", 3); this.bump("rel", 2);
    }
    for (const k of this.children) if (k.alive && a - k.born === 20 && rand() < 0.6) this.say(`${k.name} quitte la maison.`, "family");
  }

  yearEvents() {
    const a = this.age, c = this.here, s = this.stats;

    // Petite enfance
    if (a === 1) this.say(pick(["Fait ses premiers pas.", "Commence à marcher en s’accrochant aux meubles.", "Sourit à tout le monde."]));
    if (a === 2) this.say(pick(["Dit ses premiers mots.", "Apprend le mot « non » et l’utilise beaucoup.", "Chante sans savoir les paroles."]));
    if (a >= 1 && a <= 10) this.healthRef -= 3 * Math.min(1, c.imr / 250);
    if (a >= 1 && a <= 10 && rand() < c.imr / 250) {
      const ill = c.region === "SSA" ? pick(["le paludisme", "une forte fièvre", "une infection pulmonaire"]) : pick(["une forte fièvre", "une infection pulmonaire", "une diarrhée sévère"]);
      this.say(`Tombe malade : ${ill}. ${rand() < 0.5 ? "Guérit lentement." : "S’en remet."}`);
      this.bump("health", -3);
    }

    // École
    if (a === 6) {
      const p = clamp(c.school / 8, 0.03, 0.99) * (0.8 + 0.04 * this.decile) * (this.sex === "f" && c.cm > 30 ? 0.9 : 1);
      if (rand() < p) { this.schooling = "primaire"; this.say("Entre à l’école primaire.", "edu"); }
      else this.say(pick(["N’entre pas à l’école : il n’y en a pas assez près de chez soi.", "Reste à la maison pour aider la famille au lieu d’aller à l’école.", "L’école coûte trop cher pour la famille cette année."]), "edu", true);
    }
    if (a === 12 && this.schooling === "primaire") {
      this.edu = "primaire";
      const p = clamp((c.school - 3.5) / 7, 0.03, 0.98) * (0.75 + 0.05 * this.decile) * (0.7 + s.know / 170);
      if (rand() < p) { this.schooling = "secondaire"; this.say("Entre au collège.", "edu"); }
      else { this.schooling = null; this.say("Quitte l’école après le primaire.", "edu", true); }
    }
    if (a === 15 && this.schooling === "secondaire") {
      const poor = this.decile <= 3 && c.gdp < 15000;
      this.ask(poor ? "La famille a besoin d’argent. Continuer l’école ou commencer à travailler ?" : "Fin du collège. Que faire ensuite ?", [
        { label: "Continuer au lycée", autoWeight: poor ? 1 : 4, apply: () => { this.say("Choisit de continuer au lycée.", "edu"); if (poor) this.bump("rel", -4); } },
        { label: "Commencer à travailler", autoWeight: poor ? 2 : 0.5, apply: () => { this.schooling = null; this.say("Quitte l’école pour travailler.", "edu", true); this.startWork(); } },
      ]);
    }
    if (a === 18 && this.schooling === "secondaire") {
      this.edu = "secondaire";
      this.schooling = null;
      this.say("Termine le lycée.", "edu", true);
      const secShare = clamp((c.school - 3.5) / 7, 0.1, 1);
      const p = clamp((c.tert / 100) / secShare, 0.02, 0.95) * (0.6 + s.know / 125) * (0.8 + 0.04 * this.decile);
      this.ask("Le lycée est fini. Tenter l’université ?", [
        { label: "Tenter l’université", autoWeight: p * 3, apply: () => {
          if (rand() < clamp(p, 0.02, 0.97)) { this.schooling = "universite"; this.say("Est " + this.g("admis", "admise") + " à l’université.", "edu", true); this.bump("happy", 5); }
          else { this.say("N’obtient pas de place à l’université et commence à travailler.", "edu", true); this.bump("happy", -5); this.startWork(); }
        } },
        { label: "Travailler tout de suite", autoWeight: 1, apply: () => { this.say("Choisit de travailler tout de suite."); this.startWork(); } },
      ]);
    }
    // Études reprises à l'âge adulte.
    if (this.adultStudy && a >= this.adultStudy && this.schooling === "universite") {
      this.edu = "universite"; this.schooling = null; this.adultStudy = null;
      this.say("Obtient son diplôme universitaire, des années après le lycée.", "edu", true);
      this.bump("happy", 6); this.bump("know", 4);
    }
    if (a === 22 && this.schooling === "universite" && !this.adultStudy) {
      this.edu = "universite";
      this.schooling = null;
      this.say("Obtient son diplôme universitaire.", "edu", true);
      this.bump("happy", 6);
      this.startWork();
    }
    if (this.schooling) this.bump("know", (this.schooling === "universite" ? 6 : 5) * (0.6 + Math.log10(c.gdp) / 10));

    // Les enfants hors de l'école finissent par travailler ; les chômeurs retrouvent
    // un emploi plus ou moins vite selon le chômage du pays.
    if (!this.schooling && !this.job && !this.business && !this.retired && !this.homemaker && !this.queue.length && a >= 12) {
      const p = a < 15 ? clamp(0.6 - Math.log10(c.gdp) / 10, 0.05, 0.4) : clamp(0.6 - c.unemp / 40, 0.15, 0.7);
      if (rand() < p) this.startWork();
    }

    // Mariage d'enfants
    if (!this.classroom && this.sex === "f" && !this.married && a >= 13 && a <= 17 && rand() < c.cm / 100 / 4 * (1.3 - this.decile / 10)) {
      this.marry(true);
    }

    // Adolescence
    if (a >= 13 && a <= 17 && rand() < 0.2) this.say(pick(["Se fait un ami pour la vie.", "Tombe amoureux·se pour la première fois.", "Se dispute souvent avec ses parents.", "Découvre une musique qui ne la quittera plus.", "Passe des nuits à parler de l’avenir avec ses amis."]).replace("amoureux·se", this.g("amoureux", "amoureuse")).replace("la quittera", this.g("le quittera", "la quittera")));
    if (!this.classroom && a >= 8 && a <= 16 && s.rel < 40 && rand() < 0.12) { this.say("Subit du harcèlement à l’école.", "", false, true); this.bump("happy", -8); }

    // Tabac
    if (!this.smoker && !this.smokeOffered && a >= 14 && a <= 20 && rand() < c.smoke / 100 * 0.5) {
      this.smokeOffered = true;
      this.ask("Des amis lui tendent une cigarette. Essayer ?", [
        { label: "Essayer", autoWeight: c.smoke / 100 * this.g(1.7, 0.5) * 2, apply: () => { this.smoker = true; this.say("Commence à fumer.", "health", true); } },
        { label: "Refuser", autoWeight: 1, apply: () => this.say("Refuse la cigarette.") },
      ]);
    }
    if (this.smoker && a >= 30 && a % 6 === 0) {
      this.ask("Fumer devient une habitude coûteuse. Essayer d’arrêter ?", [
        { label: "Essayer d’arrêter", autoWeight: 1, apply: () => {
          if (rand() < 0.4) { this.smoker = false; this.say("Arrête de fumer.", "health", true); this.bump("health", 3); }
          else this.say("Essaie d’arrêter de fumer, sans y parvenir.", "health");
        } },
        { label: "Continuer", autoWeight: 1.5, apply: () => {} },
      ]);
    }

    // VIH
    if (!this.hivPos && a >= 15 && a <= 49 && rand() < c.hiv / 100 * 0.07 * (this.married ? 0.8 : 1.2)) {
      this.hivPos = true; this.hivYear = this.calYear;
      this.say(`Apprend être ${this.g("porteur", "porteuse")} du VIH.${this.hivTreated() ? " Un traitement existe et lui est proposé." : " Aucun traitement n’est disponible."}`, "health", true);
      this.bump("happy", -10);
    }

    // Travail
    if (this.job && !this.retired && !this.business) {
      const self = this.jobInfo && this.jobInfo.self;
      if (rand() < (self ? 0.03 : 0.02 + c.unemp / 250) + (c.gdp < 10000 ? 0.02 : 0)) {
        if (self) { this.say("Une mauvaise saison ruine le travail de l’année.", "work", true); this.incomePct = clamp(this.incomePct - 0.08, 0.01, 0.99); }
        else this.loseJob(pick(["Perd son travail.", "L’entreprise ferme ; il faut chercher autre chose.", "Est licencié·e."]).replace("licencié·e", this.g("licencié", "licenciée")));
        this.bump("happy", -8);
      }
      else if (rand() < 0.04 + s.know / 1000) { this.say(pick(["Obtient une promotion.", "Prend du galon.", "Son activité se développe."]), "work", true); this.incomePct = clamp(this.incomePct + 0.06, 0.01, 0.99); this.bump("happy", 5); }
      if (this.priority === "travail" && this.job) this.incomePct = clamp(this.incomePct + 0.01, 0.01, 0.99);
    }
    if (this.job && !this.retired && !this.business) {
      if (a >= 22 && a <= 55 && rand() < 0.03) {
        this.ask("On lui propose un poste mieux payé, loin de ses proches. Accepter ?", [
          { label: "Accepter le poste", autoWeight: 1.5, apply: () => { this.incomePct = clamp(this.incomePct + 0.12, 0.01, 0.99); this.income = incomeAt(this.here, this.incomePct) * this.econ; this.say("Accepte un poste mieux payé dans une autre ville.", "work", true); this.bump("rel", -6); this.bump("happy", 2); } },
          { label: "Rester près des siens", autoWeight: 1, apply: () => { this.say("Refuse un poste mieux payé pour rester près des siens."); this.bump("rel", 3); } },
        ]);
      }
    }
    this.computeIncome();
    if ((this.job || this.business) && !this.retired && a >= this.retireAge() && (rand() < 0.5 || s.health < 30)) this.retire();

    // Amour et mariage
    if (!this.married && a >= 18) {
      const p = a <= 35 ? 0.13 : a <= 50 ? 0.04 : 0.01;
      if (rand() < p) {
        const sexP = this.sex === "m" ? "f" : "m";
        const nm = this.freshName(sexP);
        this.ask(`${this.g("Il", "Elle")} rencontre ${nm}. Se marier ?`, [
          { label: `Épouser ${nm}`, autoWeight: 3, apply: () => this.marry(false, nm) },
          { label: "Pas maintenant", autoWeight: 1, apply: () => { this.say(`Ne s’engage pas avec ${nm}.`); } },
        ]);
      }
    }
    if (this.married && rand() < 0.012 * (1.5 - s.rel / 100) * (c.gdp > 20000 ? 1.6 : 0.8) * (this.calYear < 1970 ? 0.3 : 1)) this.divorce();
    if (this.married && a > 55 && rand() < 0.012 * (a - 50) / 10) {
      this.say(`${this.partner} meurt. ${this.g("Il", "Elle")} reste ${this.g("veuf", "veuve")}.`, "family", true);
      this.married = false; this.partner = null; this.partnerInfo = null; this.homemaker = false; this.bump("happy", -15); this.bump("rel", -8);
    }

    // Enfants
    if (this.married && a >= 16 && a <= 44) {
      const plan = this.wantKids === "oui" ? 1 : this.wantKids === "plusTard" ? 0.25 : clamp(0.05 + (c.tfr - 1.5) * 0.08, 0.05, 0.5);
      const p = clamp(c.tfr / 16, 0.03, 0.45) * (this.children.length >= Math.round(c.tfr + 1) ? 0.3 : 1) * plan;
      if (rand() < p) this.haveChild();
    }

    // Émigration
    if (!this.emigrationOffered && !this.emigrated && a >= 20 && a <= 35 && (c.gdp < 20000 || this.emigBoost > 1) && rand() < 0.035 * this.emigBoost) {
      this.emigrationOffered = true;
      const dest = countryAt(pick(EMIGRATION[c.region] || EMIGRATION.EUR), this.calYear);
      const p = clamp(0.1 + s.know / 300 + this.decile / 40, 0.05, 0.7);
      this.ask(`Une occasion de partir vivre ${inCountry(dest)} se présente. Tenter l’émigration ?`, [
        { label: `Partir ${inCountry(dest)}`, autoWeight: 1, apply: () => {
          if (rand() < p) this.moveTo(dest);
          else { this.say(`La tentative de départ ${inCountry(dest)} échoue.`, "move", true); this.bump("happy", -6); }
        } },
        { label: "Rester", autoWeight: 2, apply: () => this.say("Décide de rester près des siens.") },
      ]);
    }

    // Santé à l'âge adulte : une maladie grave, et la question des soins.
    if (a >= 30 && rand() < (0.02 + a / 3000) * (this.checkupAt === a ? 0.6 : 1)) {
      this.say(pick(["Une grave maladie la cloue au lit plusieurs mois.", "Un accident l’oblige à s’arrêter de longues semaines.", "Les médecins découvrent un problème de cœur."]).replace("la cloue", this.g("le cloue", "la cloue")), "health", true);
      this.bump("health", -8);
      const cost = this.careCost();
      const afford = this.savings + this.netIncome() * 0.5 >= cost;
      this.ask(`Des soins sont possibles. Ils coûtent environ ${money(cost)}${afford ? "" : ", plus que ce que la famille peut payer"}. Que faire ?`, [
        { label: "Se faire soigner", autoWeight: afford ? 6 : 1.2, apply: () => {
          this.pay(cost);
          const ok = rand() < clamp(0.45 + Math.log10(this.here.gdp) / 10, 0.5, 0.95);
          if (cost > 1) this.say(`Paie ${money(cost)} de soins.`, "money");
          this.bump("health", ok ? 5 : 2);
          this.say(ok ? "Se fait soigner et se rétablit bien." : "Se fait soigner ; la guérison est lente.", "health");
        } },
        { label: "Se soigner à la maison", autoWeight: 1, apply: () => { this.bump("health", -2); this.say("Se soigne comme on peut à la maison.", "health"); } },
      ]);
    }
    if (a >= 18 && rand() < 0.03) this.say(pick(["Part en voyage pour la première fois.", "Se lance dans un nouveau projet.", "Retrouve un vieil ami perdu de vue.", "Apprend à cuisiner le plat de sa grand-mère.", "Déménage dans une autre ville.", "Plante un arbre devant la maison."]));
  }

  marry(child, nm) {
    const sexP = this.sex === "m" ? "f" : "m";
    this.partner = nm || this.freshName(sexP);
    this.married = true; this.marriedEver = true;
    this.initPartner(child);
    if (child) {
      this.say(`Est mariée à ${this.age} ans à ${this.partner}, un homme bien plus âgé.`, "family", true, true);
      if (this.schooling) { this.schooling = null; this.say("Doit quitter l’école."); }
      this.bump("happy", -10);
    } else {
      this.say(`Épouse ${this.partner}.`, "family", true);
      this.bump("happy", 8); this.bump("rel", 6);
    }
  }

  updateStats() {
    const a = this.age, c = this.here, s = this.stats, pr = this.priority;
    // Santé (healthRef suit la même pente, plus la part moyenne des maladies)
    if (a < 18) { this.bump("health", (78 - s.health) * 0.08); this.healthRef += (78 - this.healthRef) * 0.08; }
    else if (a > 30) { const d = a < 60 ? 0.25 : a < 75 ? 0.6 : 1.0; this.bump("health", -d); this.healthRef = clamp(this.healthRef - d - 0.15 - 0.4 * c.smoke / 100 - 0.1, 0, 100); }
    if (this.incomePct != null && this.incomePct < 0.2) this.bump("health", -0.5);
    if (pr === "sante") this.bump("health", 1.8);
    if (pr === "plaisir") this.bump("health", -0.8);
    if (this.smoker) this.bump("health", -0.4);
    if (this.debt > Math.max(this.income, 1)) this.bump("health", -0.3);
    if (this.sport === a) this.bump("health", 0.5);
    // Savoir
    if (!this.schooling) this.bump("know", pr === "travail" ? 1.2 : a > 60 ? -0.3 : 0.2);
    // Relations
    this.bump("rel", (pr === "famille" ? 2.5 : 0) + (this.married ? 0.6 : -0.3) + (pr === "travail" ? -0.8 : 0) + (a > 70 ? -0.6 : 0));
    // Bonheur : tend vers une cible
    const incP = this.incomePct != null ? this.incomePct : (this.decile - 0.5) / 10;
    const ref = incomeAt(c, 0.5);
    const target = 48 + (c.happy - 5.5) * 6 + (incP - 0.5) * 18 + (s.rel - 50) * 0.3 + (s.health - 60) * 0.2 + (pr === "plaisir" ? 6 : 0)
      + (a >= 18 && this.income > 0 ? SPEND[this.spend].happy : 0) + 4 * Math.tanh(this.savings / (ref * 3)) - 8 * Math.tanh(this.debt / (this.income + ref)) + (this.house ? 3 : 0);
    this.bump("happy", (target - s.happy) * 0.22 + randn() * 2);
  }

  summary() {
    const living = this.children.filter(k => k.alive).length;
    return {
      name: this.name, sex: this.sex, home: this.home, code: this.code, age: this.age, year: this.year, alive: this.alive, cause: this.cause,
      edu: this.edu, job: this.job, income: Math.round(this.income), incomePct: this.incomePct,
      marriedEver: this.marriedEver, children: this.children.length, childrenAlive: living, grandkids: this.grandkids,
      wealth: Math.round(this.netWorth()), house: !!this.house, business: this.business ? this.business.label : null,
      gen: this.lineage ? this.lineage.gen : 1,
      emigrated: this.emigrated, stats: { ...this.stats }, born: this.born.toISOString(), birthDate: this.birthDate.toISOString(), classroom: this.classroom,
    };
  }
}

// Simule une vie entière automatiquement (pour les « nés à la même seconde »).
function simulateWhole(opts) {
  const life = new Life({ ...opts, auto: true });
  while (life.alive && life.age <= MAX_AGE) life.step();
  return life;
}

// Sauvegarde et reprise d'une vie (les décisions en attente ne se gardent pas).
function serializeLife(L) {
  const o = { ...L };
  delete o.country; delete o.highlights;
  o.queue = [];
  return o;
}
function reviveLife(o) {
  o = { ...o };
  // Anciennes sauvegardes : épargne unique et logement booléen.
  if (!o.assets) { o.assets = { cash: o.savings || 0 }; o.alloc = { cash: 100 }; }
  delete o.savings;
  if (typeof o.invest === "string") delete o.invest;
  if (o.house === true) o.house = { value: 0, loan: 0, rate: 0, payment: 0 };
  const L = Object.assign(Object.create(Life.prototype), o);
  if (L.actionsLeft == null) L.actionsLeft = ACTIONS_PER_YEAR;
  L.born = new Date(o.born);
  L.birthDate = new Date(o.birthDate || o.born);
  L.queue = [];
  L.country = countryAt(L.home, L.year);
  L.highlights = L.log.filter(e => e.hl);
  return L;
}
