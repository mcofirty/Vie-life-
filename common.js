// Outils partagés par la version web et l'application : formats, réglages,
// vies gardées, mémorial, liens et cartes de partage, musique douce, reprise.

const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n, d = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const ans = n => `${n} an${n > 1 ? "s" : ""}`;
const PPP_TO_EUR_FR = 0.72; // 1 $ PPA ≈ 0,72 € aux prix français
const SPEEDS = [1, 2, 4, 8, 12, 16];
const DURATIONS = { 15: "≈ 15 min", 30: "≈ 30 min", 60: "≈ 1 h", 90: "≈ 1 h 30" };
const APP_VERSION = "2.1";
const euroMonth = ppp => `${nf.format(Math.round(ppp * PPP_TO_EUR_FR / 12 / 10) * 10)} €`;
const dollars = x => `${nf.format(Math.round(x / 10) * 10)} $`;

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  del(key) { try { localStorage.removeItem(key); } catch { /* stockage indisponible */ } },
};

// ---------- Réglages communs ----------
const PREFS_KEY = "vie.prefs";
const prefs = Object.assign({
  era: "today", year: NOW_YEAR, dur: "60", mode: "births",
  music: false, pauses: true, gentle: false, classroom: false, auto: false, haptics: true,
}, store.get(PREFS_KEY, {}));
function setPref(key, value) { prefs[key] = value; store.set(PREFS_KEY, prefs); }

function eraOf(year) {
  if (year < NOW_YEAR - 1) return "passé";
  if (year > NOW_YEAR + 1) return "futur";
  return "aujourd’hui";
}
function birthDateText(L, withTime = true) {
  const d = L.birthDate || new Date();
  return d.toLocaleString("fr-FR", withTime ? { dateStyle: "long", timeStyle: "short" } : { dateStyle: "long" });
}

// ---------- Textes partagés ----------
const PAUSE_QUESTIONS = {
  5: L => `${L.name} a 5 ans. Quel est le plus ancien souvenir que vous gardez de votre propre enfance ?`,
  15: L => `${L.name} a 15 ans${L.schooling ? " et va encore à l’école" : L.job ? " et travaille déjà" : ""}. À 15 ans, quelles portes étaient ouvertes devant vous ?`,
  30: L => `${L.name} a 30 ans. Dans votre vie, qu’est-ce qui doit beaucoup au lieu où vous êtes né·e ?`,
  50: L => `${L.name} a 50 ans. Si vous pouviez lui parler une minute, que lui diriez-vous ?`,
  70: L => `${L.name} a 70 ans. Qu’aimeriez-vous qu’on retienne d’une vie, la sienne ou la vôtre ?`,
};
const HELP_HTML = `Si ces sujets vous touchent, vous pouvez en parler : en France, appelez le <a href="tel:3114">3114</a> (gratuit, 24 h/24), le <a href="tel:119">119</a> pour l’enfance en danger, le <a href="tel:3919">3919</a> pour les violences faites aux femmes. Ailleurs : <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>.`;

function peerStatus(p, age) {
  if (!p.alive && p.age <= age) return `${p.g("Mort", "Morte")} à ${ans(p.age)} · ${p.cause}`;
  const h = p.history[Math.min(age, p.history.length - 1)];
  if (!h) return "";
  const bits = [];
  if (age < 6) bits.push("petite enfance");
  else if (h.schooling) bits.push(`à l’école (${EDU_LABEL[h.schooling]})`);
  else if (h.job) bits.push(h.job);
  else bits.push(age > 60 ? "à la maison" : "sans travail");
  if (h.married) bits.push(p.g("marié", "mariée"));
  if (h.children) bits.push(`${h.children} enfant${h.children > 1 ? "s" : ""}`);
  if (h.code !== p.home) bits.push(`vit ${inCountry(BY_CODE[h.code])}`);
  return bits.join(" · ");
}

// Comparaison : le pays de naissance (à l'année de naissance) et votre vrai pays (aujourd'hui).
function compareRows(a, b, sex) {
  return [
    ["Espérance de vie", `${fmt(a.e0[sex])} ans`, `${fmt(b.e0[sex])} ans`],
    ["Mortalité infantile", `${fmt(a.imr, 1)} ‰`, `${fmt(b.imr, 1)} ‰`],
    ["Revenu moyen", `${nf.format(a.gdp)} $`, `${nf.format(b.gdp)} $`],
    ["Années d’école", fmt(a.school, 1), fmt(b.school, 1)],
    ["Université", `${fmt(a.tert)} %`, `${fmt(b.tert)} %`],
    ["Homicides /100k", fmt(a.hom, 1), fmt(b.hom, 1)],
    ["Satisfaction", `${fmt(a.happy, 1)}/10`, `${fmt(b.happy, 1)}/10`],
  ];
}

// Indicateurs du pays affichés à la naissance et dans les fiches pays.
function countryFacts(c) {
  const est = new Set(ESTIMATED[c.code] || []), e = k => est.has(k) ? " (estimé)" : "";
  return [
    ["Région", REGION_NAMES[c.region]],
    ["Population", `${fmt(c.pop, c.pop < 1 ? 2 : 1)} million${c.pop >= 2 ? "s" : ""}`],
    ["Naissances par an", nf.format(Math.round(c.births * 1000))],
    ["Espérance de vie (H / F)", `${fmt(c.e0.m)} / ${fmt(c.e0.f)} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} ‰`],
    ["Mortalité maternelle", `${nf.format(Math.round(c.mmr))} / 100 000 naissances${e("mmr")}`],
    ["PIB par habitant", `${nf.format(c.gdp)} $ PPA${e("gdp")}`],
    ["Inégalités (Gini)", `${fmt(c.gini, 1)}${e("gini")}`],
    ["Années d’école", `${fmt(c.school, 1)}${e("school")}`],
    ["Inscription dans le supérieur", `${fmt(c.tert)} %${e("tert")}`],
    ["Emploi agricole / industriel", `${fmt(c.agri)} % / ${fmt(c.ind)} %${e("agri")}`],
    ["Chômage", `${fmt(c.unemp, 1)} %${e("unemp")}`],
    ["Femmes sur le marché du travail", `${fmt(c.flp)} %${e("flp")}`],
    ["Population urbaine", `${fmt(c.urban)} %`],
    ["Internautes", `${fmt(c.net)} %${e("net")}`],
    ["Adultes avec un compte en banque", `${fmt(c.bank)} %${e("bank")}`],
    ["Inflation habituelle", `${fmt(c.infl, 1)} % par an${e("infl")}`],
    ["Impôts (% du PIB)", `${fmt(c.tax, 1)} %${e("tax")}`],
    ["Enfants par femme", fmt(c.tfr, 1)],
    ["Mariage avant 18 ans", `${fmt(c.cm)} % des femmes${e("cm")}`],
    ["VIH (15-49 ans)", `${fmt(c.hiv, 1)} %${e("hiv")}`],
    ["Homicides", `${fmt(c.hom, 1)} / 100 000${e("hom")}`],
    ["Tabac", `${fmt(c.smoke)} % des adultes${e("smoke")}`],
    ["Soins payés de sa poche", `${fmt(c.oop)} %${e("oop")}`],
    ["Satisfaction de vie", `${fmt(c.happy, 1)} / 10${e("happy")}`],
  ];
}

// Résumés « Famille et vie » et « Argent » pour les panneaux.
function familyRows(L) {
  const rows = [];
  L.parents.forEach(p => rows.push([p.sex === "f" ? "Mère" : "Père", `${p.name}${p.alive ? `, ${ans(p.age)}` : " †"}`]));
  const sibs = L.sibs.filter(s => s.born <= L.age);
  rows.push(["Frères et sœurs", sibs.length ? sibs.map(s => `${s.name}${s.alive ? "" : " †"}`).join(", ") : "aucun"]);
  rows.push(["Couple", L.married ? `${L.g("marié", "mariée")} à ${L.partner}` : L.marriedEver ? L.g("seul aujourd’hui", "seule aujourd’hui") : "célibataire"]);
  rows.push(["Enfants", L.children.length ? L.children.map(k => `${k.name}${k.adopted ? " (adopté)" : ""}${k.alive ? ` (${ans(L.age - k.born)})` : " †"}`).join(", ") : "aucun"]);
  if ((L.adoptions || []).length) rows.push(["Adoption", `dossier accepté, enfant attendu vers ${L.age + Math.max(0, L.adoptions[0].arrive - L.age)} ans`]);
  if (L.grandkids) rows.push(["Petits-enfants", String(L.grandkids)]);
  rows.push(["Projet d’enfants", KIDS_PLAN[L.wantKids]]);
  if (L.lineage) rows.push(["Lignée", `génération ${L.lineage.gen} · ${L.lineage.ancestors.map(a => a.name).join(" → ")}`]);
  return rows;
}
function moneyRows(L) {
  const rows = [];
  rows.push(["Revenu", L.income > 0 ? `${dollars(L.income)} par an · ≈ ${euroMonth(L.income)} par mois (prix français)` : "aucun"]);
  if (L.married && L.partnerInfo) rows.push([`Revenu de ${L.partner}`, L.partnerInfo.income > 0 ? `${dollars(L.partnerInfo.income)} par an` : L.partnerInfo.retired ? "à la retraite" : "au foyer"]);
  const level = L.livingStandard();
  rows.push(["Niveau de vie", `${capFirst(TIER_LABEL[L.livingTier(level)])} · ≈ ${dollars(level)} par personne et par an`]);
  rows.push(["Épargne et placements", dollars(L.savings)]);
  if (L.house) rows.push(["Logement", `${dollars(L.house.value)}${L.house.loan > 0 ? ` · reste ${dollars(L.house.loan)} à rembourser` : ""}`]);
  else rows.push(["Logement", L.urban ? "locataire, en ville" : "locataire ou chez la famille, à la campagne"]);
  if ((L.props || []).length) rows.push(["Biens immobiliers", `${L.props.length} · valeur ${dollars(L.props.reduce((x, p) => x + p.value, 0))}${L.props.some(p => p.loan > 0) ? ` · reste ${dollars(L.props.reduce((x, p) => x + p.loan, 0))} à rembourser` : ""}`]);
  for (const b of L.businesses || []) rows.push(["Entreprise", `${b.label} · valeur de votre part ≈ ${dollars(b.value * (b.stake ?? 1))}`]);
  rows.push(["Dettes", L.debt > 0 ? dollars(L.debt) : "aucune"]);
  rows.push(["Patrimoine net", `${dollars(L.netWorth())} · plus riche que ${Math.round(L.wealthPct() * 100)} % du pays`]);
  rows.push(["Compte en banque", L.bank ? "oui" : "non"]);
  if (L.retired) rows.push(["Pension", L.pension > 0 ? `${dollars(L.pension)} par an` : "aucune"]);
  return rows;
}
// Tableau de bord : l'essentiel de la situation, et ce qui demande votre attention.
function dashboardData(L) {
  const c = L.here, liquid = ["cash", "deposit", "tontine"].reduce((s, k) => s + (L.assets[k] || 0), 0);
  const invested = Math.max(0, L.savings - liquid), net = L.netWorth();
  const pi = L.married && L.partnerInfo ? L.partnerInfo.income || 0 : 0;
  const money = [
    { id: "salary", label: L.retired ? "Pension" : L.business ? "Revenu de l’entreprise" : "Salaire", value: L.income > 0 ? `${dollars(L.income)}/an` : "aucun", sub: L.income > 0 ? `≈ ${euroMonth(L.income)} par mois${pi ? ` · foyer ${dollars(L.income + pi)}` : ""}` : pi ? `foyer ${dollars(pi)}/an` : "" },
    { id: "net", label: "Patrimoine", value: dollars(net), sub: `plus riche que ${Math.round(L.wealthPct() * 100)} % du pays`, tone: net < 0 ? "bad" : "" },
    { id: "cash", label: "Disponible", value: dollars(liquid), sub: invested > 0 ? `+ ${dollars(invested)} placés` : L.debt > 0 ? `dettes ${dollars(L.debt)}` : "" , tone: liquid < 1 && L.debt > 0 ? "bad" : "" },
  ];
  const activity = !L.alive ? "—" : L.schooling ? `Études · ${eduText(L)}` : L.retired ? "À la retraite" : L.business ? L.business.label : L.job ? capFirst(L.job) : L.homemaker ? "Au foyer" : L.age < 6 ? "Petite enfance" : L.age < 15 ? "Enfant, hors de l’école" : "Sans emploi";
  const kids = L.children.filter(k => k.alive);
  const status = [
    { icon: L.schooling ? "edu" : "work", label: L.schooling ? "Études" : "Travail", value: activity },
    { icon: "couple", label: "Couple", value: L.married ? `${L.g("Marié", "Mariée")} à ${L.partner}` : L.age < 16 ? "—" : L.marriedEver ? L.g("Seul (séparé ou veuf)", "Seule (séparée ou veuve)") : L.g("Célibataire", "Célibataire") },
    { icon: "child", label: "Enfants", value: kids.length ? `${kids.length} · ${kids.map(k => `${k.name} ${L.age - k.born}`).join(", ")}` : "Aucun" },
    ...(L.passion ? [{ icon: "leisure", label: "Passion", value: L.passionLabel() }] : []),
    { icon: "home", label: "Logement", value: `${L.house ? "Propriétaire" : L.age < 23 && !L.married && L.parents.some(p => p.alive) ? "Chez les parents" : "Locataire"} · ${L.urban ? "en ville" : "à la campagne"}` },
  ];
  const todo = [];
  if (L.alive && L.queue.length) todo.push({ tone: "act", text: `Décision en attente : ${L.queue[0].text}`, act: "decision", btn: "Décider" });
  if (L.alive && L.actionsLeft > 0 && L.age >= 6) todo.push({ tone: "info", text: `${L.actionsLeft} action${L.actionsLeft > 1 ? "s" : ""} possible${L.actionsLeft > 1 ? "s" : ""} cette année`, act: "agir", btn: "Agir" });
  if (L.alive && !L.job && !L.business && !L.schooling && !L.retired && !L.homemaker && L.age >= 16) todo.push({ tone: "warn", text: "Sans emploi : chercher du travail ?", act: "agir", btn: "Chercher" });
  if (L.debt > Math.max(L.netIncome(), 1)) todo.push({ tone: "warn", text: `Dettes élevées : ${dollars(L.debt)}`, act: "money", btn: "Gérer" });
  if (L.alive && L.stats.health < 35) todo.push({ tone: "warn", text: "Santé fragile : un bilan, du sport ?", act: "agir", btn: "Agir" });
  if (L.smoker) todo.push({ tone: "warn", text: `${L.g("Fumeur", "Fumeuse")} : le risque augmente avec l’âge.`, act: "agir", btn: "Arrêter" });
  for (const x of activeEvents(L.code, L.calYear)) todo.push({ tone: "warn", text: `Le pays traverse ${x.ev.name}.` });
  return { money, status, todo };
}

// Le budget de l'année passée, poste par poste.
function budgetRows(L) {
  const b = L.budget;
  if (!b || !b.gross) return [];
  const pct = x => b.net > 0 ? ` (${Math.round(x / b.net * 100)} %)` : "";
  return [
    ["Revenus du ménage", dollars(b.gross)],
    ["Impôts et cotisations", `− ${dollars(b.tax)}`],
    ["Logement", `− ${dollars(b.housing)}${pct(b.housing)}`],
    ...(b.kids > 0 ? [["Enfants", `− ${dollars(b.kids)}${pct(b.kids)}`]] : []),
    ["Vie courante", `− ${dollars(b.living)}${pct(b.living)}`],
    [b.saved >= 0 ? "Mis de côté" : "Manque (dette ou épargne)", `${b.saved >= 0 ? "" : "− "}${dollars(Math.abs(b.saved))}`],
  ];
}
// Ce que contient le portefeuille, et ce qui est accessible ici et maintenant.
function portfolioRows(L) {
  return Object.keys(ASSETS).map(k => ({ id: k, label: ASSETS[k].label, note: ASSETS[k].note, value: L.assets[k] || 0, target: L.alloc[k] || 0, available: assetAvailable(L, k) }))
    .filter(r => r.available || r.value > 0);
}

// ---------- Vies gardées ----------
const LIVES_KEY = "vie.lives";
const MAX_LIVES = 100;
const pastLives = () => store.get(LIVES_KEY, []);
function saveRecord(rec) {
  const lives = pastLives().filter(r => r.id !== rec.id);
  lives.unshift(rec);
  let n = 0;
  // Les vies du mémorial sont gardées sans limite.
  return store.set(LIVES_KEY, lives.filter(r => r.memorial || n++ < MAX_LIVES));
}
function updateRecord(id, fn) {
  const lives = pastLives();
  const r = lives.find(x => x.id === id);
  if (!r) return null;
  fn(r);
  store.set(LIVES_KEY, lives);
  return r;
}
function deleteRecord(id) { store.set(LIVES_KEY, pastLives().filter(r => r.id !== id)); }
// Tout effacer : les vies du mémorial restent.
function clearLives() { store.set(LIVES_KEY, pastLives().filter(r => r.memorial)); }
const SORTS = {
  recent: ["Plus récentes", (a, b) => b.id - a.id],
  oldest: ["Plus anciennes", (a, b) => a.id - b.id],
  long: ["Vies les plus longues", (a, b) => b.s.age - a.s.age],
  short: ["Vies les plus courtes", (a, b) => a.s.age - b.s.age],
  country: ["Par pays", (a, b) => BY_CODE[a.s.home].name.localeCompare(BY_CODE[b.s.home].name, "fr")],
  year: ["Par année de naissance", (a, b) => (a.s.year ?? DATA_YEAR) - (b.s.year ?? DATA_YEAR)],
};
const sortLives = (lives, by) => [...lives].sort((SORTS[by] || SORTS.recent)[1]);

function buildRecord(L, peers) {
  const line = e => ({ age: e.age, year: e.year, text: e.text, ...(e.heavy ? { heavy: true } : {}) });
  return {
    id: Date.now(), date: new Date().toISOString(), s: L.summary(), real: L.real || null,
    highlights: L.log.filter(e => e.hl).map(line),
    starred: L.log.filter(e => e.star).map(line),
    history: L.history.map(h => h && { happy: h.happy }),
    reflections: L.reflections,
    peers: peers.map(p => ({ name: p.name, home: p.home, code: p.code, age: p.age, cause: p.cause, sex: p.sex, edu: p.edu, children: p.children.length, emigrated: p.emigrated })),
    message: "", memorial: false, candles: 0, notes: [],
    dyn: dynastyData(L),
  };
}
// Ce qu'il faut pour continuer la lignée avec un enfant.
function dynastyData(L) {
  const heirs = heirOptions(L);
  return {
    lineageId: L.lineage ? L.lineage.id : L.born.getTime(), gen: L.lineage ? L.lineage.gen : 1,
    ancestors: L.lineage ? L.lineage.ancestors : [], estate: Math.round(L.estate()), fund: Math.round(L.kidsFund || 0),
    willTo: activeWill(L), cands: willCandidates(L).map(c => ({ key: c.key, label: c.label, sub: c.sub })),
    heirs, allKids: L.children.map(k => ({ name: k.name, sex: k.sex, born: k.born, alive: k.alive })),
    pctAt: L.history.map(h => h ? h.pct : null),
  };
}
// Une vie inconnue, simulée de bout en bout (« rencontrer une vie au hasard »).
function strangerRecord() {
  const year = drawYear(prefs.era, prefs.year);
  const L = simulateWhole({ mode: "births", year, classroom: prefs.classroom });
  const others = Array.from({ length: 4 }, () => simulateWhole({ mode: "births", year, classroom: prefs.classroom }));
  const rec = buildRecord(L, others);
  rec.stranger = true;
  return rec;
}
const isHeavy = rec => HEAVY_CAUSES.includes(rec.s.cause) || (rec.highlights || []).some(h => h.heavy || /mariée à \d+ ans|meurt avant ses cinq ans/.test(h.text));
const lifeLine = s => {
  const c = BY_CODE[s.home], g = (m, f) => s.sex === "m" ? m : f;
  const ageTxt = s.age === 0 ? "moins d’un an" : ans(s.age);
  return `${g("Né", "Née")} ${inCountry(c)}${s.year && s.year !== NOW_YEAR ? ` en ${s.year}` : ""}, ${g("mort", "morte")} à ${ageTxt}${s.emigrated ? ` ${inCountry(BY_CODE[s.code])}` : ""}.`;
};
function vsLifeExpectancy(s) {
  const e0 = countryAt(s.home, s.year ?? DATA_YEAR).e0[s.sex], diff = s.age - e0;
  return Math.abs(diff) < 2 ? "C’est à peu près l’espérance de vie du pays à sa naissance."
    : diff > 0 ? `${fmt(diff)} ans de plus que l’espérance de vie du pays à sa naissance.`
    : `${fmt(-diff)} ans de moins que l’espérance de vie du pays à sa naissance.`;
}

// Nettoie une vie venue d'ailleurs (fichier importé ou lien partagé).
function cleanRecord(r) {
  if (!r || typeof r !== "object" || !r.s || !BY_CODE[r.s.home]) return null;
  const str = (x, n = 300) => String(x ?? "").slice(0, n);
  const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
  const code = x => BY_CODE[x] ? x : r.s.home;
  const s = r.s;
  const line = h => h && ({ age: clamp(Math.round(num(h.age)), 0, 120), year: h.year == null ? undefined : Math.round(num(h.year)), text: str(h.text), ...(h.heavy ? { heavy: true } : {}) });
  return {
    id: Math.round(num(r.id, Date.now())), date: isNaN(new Date(r.date)) ? new Date().toISOString() : new Date(r.date).toISOString(),
    s: {
      name: str(s.name, 40), sex: s.sex === "m" ? "m" : "f", home: s.home, code: code(s.code), age: clamp(Math.round(num(s.age)), 0, 120),
      year: clamp(Math.round(num(s.year, DATA_YEAR)), MIN_YEAR, MAX_YEAR), alive: false, cause: str(s.cause, 80),
      edu: EDU_LABEL[s.edu] ? s.edu : "none", eduText: s.eduText ? str(s.eduText, 120) : null, passion: s.passion ? str(s.passion, 120) : null, job: s.job ? str(s.job, 60) : null, income: num(s.income), incomePct: s.incomePct == null ? null : num(s.incomePct),
      marriedEver: !!s.marriedEver, children: Math.round(num(s.children)), childrenAlive: Math.round(num(s.childrenAlive)), grandkids: Math.round(num(s.grandkids)),
      wealth: num(s.wealth), house: !!s.house, business: s.business ? str(s.business, 200) : null, gen: clamp(Math.round(num(s.gen, 1)), 1, 99), emigrated: !!s.emigrated, stats: {}, born: "", birthDate: s.birthDate && !isNaN(new Date(s.birthDate)) ? new Date(s.birthDate).toISOString() : null,
    },
    real: BY_CODE[r.real] ? r.real : null,
    highlights: (Array.isArray(r.highlights) ? r.highlights : []).slice(0, 200).map(line).filter(Boolean),
    starred: (Array.isArray(r.starred) ? r.starred : []).slice(0, 200).map(line).filter(Boolean),
    history: (Array.isArray(r.history) ? r.history : []).slice(0, 121).map(h => h && { happy: clamp(Math.round(num(h.happy, 50)), 0, 100) }),
    reflections: (Array.isArray(r.reflections) ? r.reflections : []).slice(0, 10).map(x => ({ age: Math.round(num(x.age)), q: str(x.q), a: str(x.a, 500) })),
    peers: (Array.isArray(r.peers) ? r.peers : []).slice(0, 4).filter(p => p && BY_CODE[p.home]).map(p => ({
      name: str(p.name, 40), home: p.home, code: BY_CODE[p.code] ? p.code : p.home, age: clamp(Math.round(num(p.age)), 0, 120), cause: str(p.cause, 80),
      sex: p.sex === "m" ? "m" : "f", edu: EDU_LABEL[p.edu] ? p.edu : "none", children: Math.round(num(p.children)), emigrated: !!p.emigrated,
    })),
    message: str(r.message, 500), memorial: !!r.memorial, candles: Math.round(num(r.candles)),
    dyn: cleanDyn(r.dyn, str, num),
    notes: (Array.isArray(r.notes) ? r.notes : []).slice(0, 50).map(n => ({ text: str(n.text, 300), date: isNaN(new Date(n.date)) ? new Date().toISOString() : new Date(n.date).toISOString() })),
    ...(r.shared ? { shared: true } : {}),
  };
}

function cleanDyn(d, str, num) {
  if (!d || typeof d !== "object") return null;
  const kid = k => k && ({ name: str(k.name, 40), sex: k.sex === "m" ? "m" : "f", born: Math.round(num(k.born)), alive: k.alive !== false });
  const anc = a => a && BY_CODE[a.home] && ({ name: str(a.name, 40), sex: a.sex === "m" ? "m" : "f", home: a.home, year: Math.round(num(a.year, DATA_YEAR)), age: Math.round(num(a.age)), cause: str(a.cause, 80), wealth: num(a.wealth) });
  return {
    willTo: (Array.isArray(d.willTo) ? d.willTo : []).slice(0, 30).map(x => str(x, 60)),
    cands: (Array.isArray(d.cands) ? d.cands : []).slice(0, 30).filter(c => c && c.key).map(c => ({ key: str(c.key, 60), label: str(c.label, 60), sub: str(c.sub, 40) })),
    lineageId: Math.round(num(d.lineageId)), gen: clamp(Math.round(num(d.gen, 1)), 1, 99), estate: Math.max(0, num(d.estate)), fund: Math.max(0, num(d.fund)),
    ancestors: (Array.isArray(d.ancestors) ? d.ancestors : []).slice(0, 99).map(anc).filter(Boolean),
    heirs: (Array.isArray(d.heirs) ? d.heirs : []).slice(0, 20).filter(h => h && BY_CODE[h.code]).map(h => ({ ...kid(h), age: Math.round(num(h.age)), year: clamp(Math.round(num(h.year)), MIN_YEAR, MAX_YEAR), code: h.code, other: h.other ? str(h.other, 40) : null })),
    allKids: (Array.isArray(d.allKids) ? d.allKids : []).slice(0, 30).map(kid).filter(Boolean),
    pctAt: (Array.isArray(d.pctAt) ? d.pctAt : []).slice(0, 121).map(x => x == null ? null : clamp(num(x, 0.4), 0, 1)),
  };
}

// Transférer ses vies : un fichier à garder, puis à ouvrir sur un autre appareil.
function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function exportLives() {
  const data = { app: "vie", version: 1, exported: new Date().toISOString(), lives: pastLives() };
  downloadBlob(new Blob([JSON.stringify(data)], { type: "application/json" }), `vies-${new Date().toISOString().slice(0, 10)}.json`);
}
async function importLives(file) {
  const data = JSON.parse(await file.text());
  const incoming = (Array.isArray(data) ? data : data.lives || []).map(cleanRecord).filter(Boolean);
  const lives = pastLives(), ids = new Set(lives.map(r => r.id));
  const fresh = incoming.filter(r => !ids.has(r.id));
  store.set(LIVES_KEY, [...fresh, ...lives].sort((a, b) => b.id - a.id));
  return fresh.length;
}

// ---------- Lien de partage ----------
// Une vie tient dans l'adresse elle-même : rien n'est envoyé à un serveur.
// On ne partage ni vos réponses aux pauses ni vos derniers mots.
function shareable(rec) {
  return {
    id: rec.id, date: rec.date, s: rec.s, highlights: rec.highlights.slice(-14), history: rec.history,
    peers: rec.peers, shared: true, dyn: rec.dyn ? { gen: rec.dyn.gen, ancestors: rec.dyn.ancestors } : null,
  };
}
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
async function pipeBytes(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
async function encodeShare(rec) {
  const raw = new TextEncoder().encode(JSON.stringify(shareable(rec)));
  if (typeof CompressionStream !== "undefined") return "z" + b64url(await pipeBytes(raw, new CompressionStream("deflate-raw")));
  return "j" + b64url(raw);
}
async function decodeShare(str) {
  try {
    let bytes = unb64url(str.slice(1));
    if (str[0] === "z") bytes = await pipeBytes(bytes, new DecompressionStream("deflate-raw"));
    return cleanRecord(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}
async function shareLink(rec) {
  const url = `${location.origin}${location.pathname}#vie=${await encodeShare(rec)}`;
  const text = `${rec.s.name} : ${lifeLine(rec.s)}`;
  if (navigator.share) { try { await navigator.share({ title: "Une vie", text, url }); return "shared"; } catch (e) { if (e.name === "AbortError") return "cancel"; } }
  try { await navigator.clipboard.writeText(url); return "copied"; } catch { prompt("Copiez ce lien :", url); return "shown"; }
}
async function sharedFromHash() {
  const m = location.hash.match(/^#vie=([\w-]+)$/);
  if (!m) return null;
  return decodeShare(m[1]);
}

// ---------- Cartes à partager (image) ----------
function wrapText(ctx, text, x, y, maxW, lh, maxLines = 4) {
  const words = String(text).split(" ");
  let line = "", n = 0;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, y); y += lh; line = w;
      if (++n >= maxLines - 1) { line = words.slice(words.indexOf(w)).join(" "); if (ctx.measureText(line).width > maxW) { while (ctx.measureText(line + "…").width > maxW) line = line.slice(0, -1); line += "…"; } break; }
    } else line = t;
  }
  ctx.fillText(line, x, y);
  return y + lh;
}
const happyHue = v => `rgba(255, 90, 54, ${(0.25 + v / 100 * 0.75).toFixed(2)})`;
// kind : "birth" (avec une vie en cours) ou "death" (avec une vie gardée).
function drawCard(kind, data) {
  const W = 1080, H = 1350, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx.roundRect) ctx.roundRect = (x, y, w, h) => ctx.rect(x, y, w, h);
  const s = kind === "birth" ? data.summary() : data.s;
  const c = BY_CODE[s.home];
  // Couleurs Lifelot : corail pour une naissance, nuit pour une vie terminée.
  ctx.fillStyle = kind === "birth" ? "#FF5A36" : "#17142B";
  ctx.fillRect(0, 0, W, H);
  const font = (w, px) => `${w} ${px}px Inter, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = font(600, 34);
  ctx.fillText(kind === "birth" ? "ACTE DE NAISSANCE" : "ACTE DE DÉCÈS", 80, 120);
  ctx.textAlign = "right";
  ctx.fillText(kind === "birth" ? birthDateText(data, false) : new Date(data.date).toLocaleDateString("fr-FR", { dateStyle: "long" }), W - 80, 120);
  ctx.textAlign = "left";
  ctx.font = font(400, 170);
  ctx.fillText(c.flag, 70, 330);
  ctx.fillStyle = "#fff";
  ctx.font = font(800, 96);
  wrapText(ctx, s.name, 80, 480, W - 160, 104, 2);
  ctx.font = font(500, 42);
  ctx.fillStyle = "rgba(255,255,255,.9)";
  let y;
  if (kind === "birth") {
    const L = data, at = L.country;
    y = wrapText(ctx, `${L.g("Garçon", "Fille")} ${L.g("né", "née")} ${inCountry(c)} en ${L.year} · 1 chance sur ${nf.format(birthOdds(L.home, L.mode, L.year))}`, 80, 580, W - 160, 56, 3) + 30;
    const facts = [["Espérance de vie", `${fmt(at.e0[L.sex])} ans`], ["Mortalité infantile", `${fmt(at.imr, 1)} ‰`], ["Revenu moyen", `${nf.format(at.gdp)} $`], ["École", `${fmt(at.school, 1)} ans`]];
    facts.forEach(([k, v], i) => {
      const x = 80 + (i % 2) * 470, yy = y + Math.floor(i / 2) * 170;
      ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.roundRect(x, yy, 440, 140, 28); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = font(500, 32); ctx.fillText(k, x + 32, yy + 52);
      ctx.fillStyle = "#fff"; ctx.font = font(700, 52); ctx.fillText(v, x + 32, yy + 112);
    });
    ctx.font = font(500, 40); ctx.fillStyle = "rgba(255,255,255,.9)";
    wrapText(ctx, `Sa famille est ${L.familyLabel()}.`, 80, y + 400, W - 160, 52, 2);
  } else {
    y = wrapText(ctx, lifeLine(s), 80, 580, W - 160, 56, 3);
    ctx.font = font(400, 36); ctx.fillStyle = "rgba(255,255,255,.75)";
    y = wrapText(ctx, `Cause : ${prefs.gentle && HEAVY_CAUSES.includes(s.cause) ? "non précisée" : s.cause}. ${vsLifeExpectancy(s)}`, 80, y + 10, W - 160, 48, 3) + 20;
    // Grille de vie : une case par année, couleur du bonheur.
    const cells = Math.max(100, Math.ceil(data.history.length / 10) * 10), size = 74, gap = 9.5;
    for (let i = 0; i < cells; i++) {
      const h = data.history[i], x = 80 + (i % 10) * (size + gap), yy = y + Math.floor(i / 10) * (size * 0.42 + gap);
      ctx.fillStyle = h ? happyHue(h.happy) : "rgba(255,255,255,.1)";
      ctx.beginPath(); ctx.roundRect(x, yy, size, size * 0.42, 8); ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.font = font(600, 34);
  ctx.fillText("Lifelot · Naître au hasard", 80, H - 80);
  ctx.textAlign = "right";
  ctx.font = font(400, 30);
  ctx.fillText("Une simulation, pas un destin", W - 80, H - 80);
  return cv;
}
async function shareCard(kind, data) {
  const cv = drawCard(kind, data);
  const blob = await new Promise(r => cv.toBlob(r, "image/png"));
  const name = kind === "birth" ? `naissance-${data.name}.png` : `vie-${data.s.name}.png`;
  const file = new File([blob], name.replace(/[^\w.-]+/g, "_"), { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Une vie" }); return "shared"; } catch (e) { if (e.name === "AbortError") return "cancel"; }
  }
  downloadBlob(blob, file.name);
  return "downloaded";
}

// ---------- Musique douce (générée, sans fichier) ----------
const Music = {
  ctx: null, out: null, timer: null, on: false,
  start() {
    if (this.on) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = this.ctx || new AC();
    this.ctx.resume();
    const ctx = this.ctx;
    this.out = ctx.createGain();
    this.out.gain.setValueAtTime(0, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3);
    // Un écho léger pour adoucir.
    const delay = ctx.createDelay(), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    delay.delayTime.value = 0.42; fb.gain.value = 0.38; lp.type = "lowpass"; lp.frequency.value = 1800;
    this.out.connect(lp); lp.connect(ctx.destination); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(ctx.destination);
    this.on = true;
    const scale = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25];
    const roots = [[0, 2, 4], [1, 3, 5], [2, 4, 6], [0, 3, 5]];
    let n = 0;
    const play = () => {
      if (!this.on) return;
      const t = ctx.currentTime, chord = roots[n++ % roots.length];
      chord.forEach((i, k) => this.note(scale[i] / 2, t + k * 0.08, 6, 0.05));
      if (Math.random() < 0.7) this.note(pick(scale) * (Math.random() < 0.5 ? 1 : 2), t + 1 + Math.random() * 2, 3, 0.03, "sine");
    };
    play();
    this.timer = setInterval(play, 4500);
  },
  note(freq, t, dur, vol, type = "triangle") {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out);
    o.start(t); o.stop(t + dur + 0.1);
  },
  stop() {
    if (!this.on) return;
    this.on = false;
    clearInterval(this.timer);
    const out = this.out, t = this.ctx.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(out.gain.value, t);
    out.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => out.disconnect(), 1500);
  },
  set(on) { if (on) this.start(); else this.stop(); },
};

// ---------- Reprendre une vie inachevée ----------
const CURRENT_KEY = "vie.current", PEERS_KEY = "vie.current.peers";
function saveCurrent(L, peers) {
  if (!L || !L.alive) return;
  if (peers) store.set(PEERS_KEY, peers.map(serializeLife));
  store.set(CURRENT_KEY, { life: serializeLife(L), saved: Date.now() });
}
function loadCurrent() {
  const o = store.get(CURRENT_KEY, null), p = store.get(PEERS_KEY, null);
  if (!o || !o.life || !p) return null;
  try { return { life: reviveLife(o.life), peers: p.map(reviveLife) }; } catch { return null; }
}
function clearCurrent() { store.del(CURRENT_KEY); store.del(PEERS_KEY); }
// Vies en pause : on joue un descendant, puis on peut revenir à n'importe laquelle.
const PAUSED_KEY = "vie.paused";
function pausedLives() { return store.get(PAUSED_KEY, []).filter(x => x && x.life); }
function pauseLife(L, peers) {
  if (!L || !L.alive) return;
  const list = pausedLives().filter(x => x.id !== L.born.getTime());
  list.unshift({ id: L.born.getTime(), name: L.name, flag: countryAt(L.code, L.calYear).flag, age: L.age, year: L.calYear, life: serializeLife(L), peers: (peers || []).map(serializeLife), saved: Date.now() });
  store.set(PAUSED_KEY, list.slice(0, 6));
}
// Reprend une vie en pause ; la vie en cours (s'il y en a une) est mise en pause à son tour.
function resumePaused(id, current, currentPeers) {
  const list = pausedLives(), item = list.find(x => x.id === id);
  if (!item) return null;
  store.set(PAUSED_KEY, list.filter(x => x.id !== id));
  if (current && current.alive && current.born.getTime() !== id) pauseLife(current, currentPeers);
  try { return { life: reviveLife(item.life), peers: (item.peers || []).map(reviveLife) }; } catch { return null; }
}
// Testament au moment de la mort : les personnes proposées, et celles cochées au départ.
function heirWillOptions(d) {
  const cands = d.cands && d.cands.length ? d.cands : d.heirs.map(h => ({ key: `kid:${h.name}`, label: h.name, sub: h.sex === "m" ? "fils" : "fille" }));
  const sel = d.willTo && d.willTo.length ? d.willTo : willDefaultKeys(d);
  return { cands, sel };
}
// Les enfants qu'on peut jouer, et les vies en pause (pour les panneaux Famille).
function descendantsHtml(L) {
  const kids = L.children.map((k, i) => ({ k, i })).filter(x => x.k.alive);
  const paused = pausedLives().filter(x => x.id !== L.born.getTime());
  if (!kids.length && !paused.length) return "";
  return `<div class="sp"><p class="sp-head">Jouer un descendant</p>
    ${kids.map(({ k, i }) => { const gf = donationFor(L, k); return `<div class="sp-card"><div class="sp-main"><b>${esc(k.name)}</b><small>${k.adopted ? (k.sex === "m" ? "Fils adopté" : "Fille adoptée") : k.sex === "m" ? "Fils" : "Fille"} · ${ans(L.age - k.born)} · ${countryAt(k.code || L.home, L.calYear).flag} ${countryAt(k.code || L.home, L.calYear).name}${gf.net > 0 ? ` · recevra ≈ ${eur(gf.net)} de votre patrimoine` : ""}</small></div><button class="sp-buy" data-play="${i}">Jouer sa vie</button></div>`; }).join("") || `<p class="sp-note">Pas encore d’enfant.</p>`}
    <p class="sp-note">La vie de ${esc(L.name)} est mise en pause, sans mourir : vous pourrez la reprendre depuis l’accueil ou ici. L’enfant reçoit tout de suite sa part de votre patrimoine, selon votre testament.</p>
    ${paused.length ? `<p class="sp-head">Vies en pause</p>${paused.map(p => `<div class="sp-card"><div class="sp-main"><b>${p.flag} ${esc(p.name)}</b><small>${ans(p.age)} · ${p.year}</small></div><button class="sp-buy" data-resume="${p.id}">Reprendre</button></div>`).join("")}` : ""}
  </div>`;
}
// Jouer un enfant : la vie en cours est mise en pause.
function playDescendant(L, peers, kidIndex, classroom) {
  const kid = L.children[kidIndex];
  if (!kid || !kid.alive) return null;
  // Le patrimoine de l'aïeul passe à l'enfant tout de suite : sa part du testament, de son vivant.
  const gift = donationFor(L, kid);
  if (gift.gross > 0) {
    L.withdraw(gift.gross);
    L.say(`Transmet ${money(gift.gross)} à ${kid.name} de son vivant (${money(gift.tax)} de droits).`, "money", true);
  }
  pauseLife(L, peers);
  const K = descendantLife(L, kid, classroom, gift);
  const year = K.year;
  return { life: K, peers: Array.from({ length: 4 }, () => simulateWhole({ mode: "births", year, classroom })) };
}
