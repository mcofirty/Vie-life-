// Racheter des parts : celles de ses propres entreprises et clubs (monter à 51 %, puis à 100 % ; une entreprise
// cotée qu'on rachète entièrement quitte la Bourse), et celles des plus grandes entreprises du monde, à chaque
// époque (US Steel et Standard Oil en 1901, General Motors et IBM au milieu du siècle, Toyota et NTT dans les
// années 1980, puis Apple, Microsoft, Nvidia, Aramco…). Leur valeur suit à peu près l'histoire (en milliards de
// dollars de 2025, approximations), avec des écarts propres à chaque vie ; après 2025, chacune trace sa route.
// Au-delà de 5 %, on siège au conseil d'administration ; au-delà de 50 %, on contrôle l'entreprise.

// v : [année, valorisation en milliards de dollars de 2025] ; 0 : faillite (les actions ne valent plus rien).
// names : le nom selon l'époque ; div : dividende annuel ; g : croissance réelle après les dernières données ; sd : volatilité.
const BIG_COMPANIES = [
  { id: "aapl", name: "Apple", code: "US", sector: "Informatique", div: 0.006, g: 0.035, sd: 0.14, v: [[1980, 7], [1991, 20], [1997, 4], [2000, 25], [2007, 230], [2012, 750], [2018, 1200], [2020, 2600], [2025, 3700]] },
  { id: "msft", name: "Microsoft", code: "US", sector: "Logiciels", div: 0.008, g: 0.035, sd: 0.12, v: [[1986, 2], [1995, 80], [1999, 900], [2002, 400], [2010, 300], [2015, 500], [2020, 1900], [2025, 3800]] },
  { id: "nvda", name: "Nvidia", code: "US", sector: "Semi-conducteurs", div: 0.0005, g: 0.04, sd: 0.25, v: [[1999, 1], [2007, 30], [2012, 10], [2016, 60], [2020, 370], [2023, 1300], [2025, 4500]] },
  { id: "goog", name: "Alphabet", names: [[2004, "Google"], [2015, "Alphabet (Google)"]], code: "US", sector: "Internet", div: 0.004, g: 0.035, sd: 0.14, v: [[2004, 35], [2007, 270], [2010, 230], [2015, 560], [2020, 1300], [2025, 3000]] },
  { id: "amzn", name: "Amazon", code: "US", sector: "Commerce en ligne", div: 0, g: 0.035, sd: 0.18, v: [[1997, 1], [1999, 50], [2001, 7], [2010, 100], [2015, 330], [2020, 1800], [2022, 900], [2025, 2300]] },
  { id: "meta", name: "Meta", names: [[2012, "Facebook"], [2021, "Meta (Facebook)"]], code: "US", sector: "Réseaux sociaux", div: 0.004, g: 0.03, sd: 0.2, v: [[2012, 80], [2016, 380], [2021, 1000], [2022, 330], [2025, 1800]] },
  { id: "avgo", name: "Broadcom", code: "US", sector: "Semi-conducteurs", div: 0.015, g: 0.035, sd: 0.18, v: [[2009, 10], [2020, 180], [2025, 1500]] },
  { id: "tsla", name: "Tesla", code: "US", sector: "Automobile électrique", div: 0, g: 0.03, sd: 0.3, v: [[2010, 2], [2019, 80], [2021, 1100], [2023, 600], [2025, 1300]] },
  { id: "brk", name: "Berkshire Hathaway", code: "US", sector: "Holding (Warren Buffett)", div: 0, g: 0.02, sd: 0.08, v: [[1965, 0.1], [1980, 1.5], [1990, 10], [2000, 120], [2010, 250], [2020, 600], [2025, 1050]] },
  { id: "2222", name: "Saudi Aramco", code: "SA", sector: "Pétrole", div: 0.05, g: -0.01, sd: 0.1, v: [[2019, 1900], [2022, 2400], [2025, 1600]] },
  { id: "tsmc", name: "TSMC", code: "TW", sector: "Semi-conducteurs", div: 0.015, g: 0.035, sd: 0.16, v: [[1994, 15], [2000, 70], [2010, 70], [2020, 550], [2025, 1200]] },
  { id: "lly", name: "Eli Lilly", code: "US", sector: "Médicaments", div: 0.01, g: 0.03, sd: 0.12, v: [[1960, 5], [2000, 100], [2020, 150], [2025, 750]] },
  { id: "jpm", name: "JPMorgan Chase", names: [[1940, "J.P. Morgan"], [2000, "JPMorgan Chase"]], code: "US", sector: "Banque", div: 0.025, g: 0.015, sd: 0.12, v: [[1940, 5], [1980, 10], [2000, 100], [2008, 150], [2025, 750]] },
  { id: "wmt", name: "Walmart", code: "US", sector: "Grande distribution", div: 0.015, g: 0.015, sd: 0.08, v: [[1970, 0.05], [1990, 50], [2000, 300], [2025, 750]] },
  { id: "tcehy", name: "Tencent", code: "CN", sector: "Internet et jeux vidéo", div: 0.006, g: 0.03, sd: 0.2, v: [[2004, 1], [2010, 40], [2018, 400], [2021, 900], [2025, 600]] },
  { id: "baba", name: "Alibaba", code: "CN", sector: "Commerce en ligne", div: 0.01, g: 0.02, sd: 0.25, v: [[2014, 230], [2020, 800], [2022, 250], [2025, 300]] },
  { id: "ssnlf", name: "Samsung Electronics", code: "KR", sector: "Électronique", div: 0.02, g: 0.02, sd: 0.15, v: [[1975, 1], [1990, 10], [2000, 50], [2010, 140], [2020, 480], [2025, 350]] },
  { id: "tm", name: "Toyota", code: "JP", sector: "Automobile", div: 0.025, g: 0.01, sd: 0.1, v: [[1960, 3], [1980, 30], [1989, 140], [2000, 200], [2007, 250], [2015, 230], [2025, 250]] },
  { id: "sony", name: "Sony", code: "JP", sector: "Électronique et divertissement", div: 0.006, g: 0.015, sd: 0.15, v: [[1958, 0.5], [1980, 10], [2000, 100], [2012, 15], [2025, 150]] },
  { id: "ntt", name: "NTT", code: "JP", sector: "Télécommunications", div: 0.02, g: 0.005, sd: 0.1, v: [[1987, 400], [1990, 200], [2000, 150], [2025, 90]] },
  { id: "lvmh", name: "LVMH", code: "FR", sector: "Luxe", div: 0.02, g: 0.02, sd: 0.14, v: [[1987, 10], [2000, 50], [2010, 75], [2017, 150], [2021, 420], [2025, 330]] },
  { id: "nesn", name: "Nestlé", code: "CH", sector: "Alimentation", div: 0.03, g: 0.01, sd: 0.07, v: [[1950, 10], [1980, 20], [2000, 100], [2010, 200], [2020, 330], [2025, 230]] },
  { id: "sie", name: "Siemens", code: "DE", sector: "Industrie", div: 0.025, g: 0.01, sd: 0.1, v: [[1900, 2], [1960, 20], [2000, 150], [2025, 180]] },
  { id: "vow", name: "Volkswagen", code: "DE", sector: "Automobile", div: 0.04, g: 0.0, sd: 0.15, v: [[1961, 2], [2000, 30], [2008, 300], [2010, 50], [2025, 55]] },
  { id: "nokia", name: "Nokia", code: "FI", sector: "Télécommunications", div: 0.03, g: 0.005, sd: 0.15, v: [[1990, 5], [2000, 300], [2007, 150], [2013, 15], [2025, 30]] },
  { id: "rel", name: "Reliance Industries", code: "IN", sector: "Pétrole, télécoms, commerce", div: 0.005, g: 0.03, sd: 0.15, v: [[1977, 0.1], [2000, 5], [2010, 70], [2025, 200]] },
  { id: "icbc", name: "ICBC (Banque industrielle et commerciale de Chine)", code: "CN", sector: "Banque", div: 0.05, g: 0.01, sd: 0.1, v: [[2006, 250], [2010, 250], [2025, 300]] },
  { id: "ptr", name: "PetroChina", code: "CN", sector: "Pétrole", div: 0.04, g: -0.01, sd: 0.15, v: [[2007, 1000], [2010, 300], [2025, 200]] },
  { id: "xom", name: "ExxonMobil", names: [[1900, "Standard Oil"], [1912, "Standard Oil of New Jersey"], [1972, "Exxon"], [1999, "ExxonMobil"]], code: "US", sector: "Pétrole", div: 0.04, g: -0.005, sd: 0.1, v: [[1900, 20], [1911, 25], [1930, 30], [1960, 80], [1980, 100], [2000, 350], [2008, 550], [2020, 200], [2025, 470]] },
  { id: "shel", name: "Shell", names: [[1907, "Royal Dutch Shell"], [2022, "Shell"]], code: "GB", sector: "Pétrole", div: 0.04, g: -0.005, sd: 0.1, v: [[1910, 10], [1960, 40], [1980, 80], [2000, 200], [2008, 250], [2025, 210]] },
  { id: "ge", name: "General Electric", code: "US", sector: "Industrie", div: 0.02, g: 0.01, sd: 0.12, v: [[1900, 3], [1929, 40], [1960, 60], [1980, 40], [2000, 800], [2008, 200], [2018, 80], [2025, 250]] },
  { id: "x", name: "US Steel", code: "US", sector: "Acier", div: 0.04, g: -0.01, sd: 0.15, v: [[1901, 50], [1929, 30], [1960, 30], [1990, 3], [2025, 10]] },
  { id: "t", name: "AT&T", code: "US", sector: "Téléphone", div: 0.05, g: 0.0, sd: 0.08, v: [[1900, 5], [1929, 50], [1960, 150], [1983, 150], [1984, 50], [2000, 150], [2025, 190]] },
  { id: "ibm", name: "IBM", code: "US", sector: "Informatique", div: 0.03, g: 0.005, sd: 0.1, v: [[1924, 1], [1960, 70], [1967, 200], [1987, 200], [2000, 300], [2013, 250], [2020, 110], [2025, 240]] },
  { id: "gm", name: "General Motors", code: "US", sector: "Automobile", div: 0.03, g: 0.0, sd: 0.15, v: [[1916, 3], [1929, 30], [1955, 140], [1970, 100], [2000, 40], [2008, 3], [2009, 0], [2010, 50], [2025, 50]] },
  { id: "ko", name: "Coca-Cola", code: "US", sector: "Boissons", div: 0.03, g: 0.01, sd: 0.07, v: [[1919, 1], [1950, 15], [1980, 15], [1998, 300], [2010, 150], [2025, 300]] },
  { id: "prr", name: "Pennsylvania Railroad", names: [[1900, "Pennsylvania Railroad"], [1968, "Penn Central"]], code: "US", sector: "Chemins de fer", div: 0.05, g: 0, sd: 0.1, v: [[1900, 20], [1929, 30], [1950, 5], [1968, 4], [1970, 0]] },
];
const BIG_BY_ID = Object.fromEntries(BIG_COMPANIES.map(c => [c.id, c]));
const coFrom = co => co.v[0][0];
const coLast = co => co.v[co.v.length - 1];
// Cotée cette année ? (une faillite sans reprise la fait disparaître)
const coListed = (co, y) => y >= coFrom(co) && !(coLast(co)[1] === 0 && y >= coLast(co)[0]);
const coName = (co, y) => { let n = co.name; for (const [from, s] of co.names || []) if (y >= from) n = s; return n; };
// Valorisation de référence (en dollars), interpolée entre les années connues.
function coBase(co, y) {
  const v = co.v;
  if (y <= v[0][0]) return v[0][1] * 1e9;
  for (let i = 1; i < v.length; i++) {
    const [y1, a1] = v[i], [y0, a0] = v[i - 1];
    if (y <= y1) {
      if (a1 === 0) return y === y1 ? 0 : a0 * 1e9 * Math.exp(Math.log(0.2) * (y - y0) / (y1 - y0));
      if (a0 === 0) return a1 * 1e9;
      return a0 * 1e9 * Math.exp(Math.log(a1 / a0) * (y - y0) / (y1 - y0));
    }
  }
  const [yl, al] = coLast(co);
  return al * 1e9 * Math.exp(co.g * (y - yl));
}

Object.assign(Life.prototype, {
  ensureBourse() {
    if (!this.bourse) this.bourse = { h: {}, n: {}, paid: {}, y: null, did: {} };
    return this.bourse;
  },
  // Valorisation d'une grande entreprise cette année, avec l'écart propre à cette vie.
  coCap(co) {
    const B = this.ensureBourse();
    return coBase(co, this.calYear) * Math.exp(B.n[co.id] || 0);
  },
  sharesValue() {
    const B = this.bourse;
    if (!B) return 0;
    return Object.entries(B.h).reduce((s, [id, f]) => s + (BIG_BY_ID[id] ? f * this.coCap(BIG_BY_ID[id]) : 0), 0);
  },
  // Chaque année : les cours bougent, les dividendes tombent, une faillite efface tout.
  bourseYear() {
    const B = this.bourse, y = this.calYear;
    if (!B || B.y === y) return;
    B.y = y;
    const past = y <= 2025;
    for (const co of BIG_COMPANIES) {
      if (y < coFrom(co)) continue;
      // Avant 2025, les écarts reviennent vers l'histoire connue ; ensuite, chaque entreprise trace sa route.
      B.n[co.id] = (B.n[co.id] || 0) * (past ? 0.6 : 0.97) + randn() * co.sd * (past ? 0.6 : 1);
    }
    for (const [id, f] of Object.entries(B.h)) {
      const co = BIG_BY_ID[id];
      if (!co || f <= 0) { delete B.h[id]; continue; }
      const cap = this.coCap(co), name = coName(co, y);
      if (cap <= 0 || !coListed(co, y)) {
        delete B.h[id];
        this.say(`${name} fait faillite : ses actions ne valent plus rien.`, "money", true); this.bump("happy", f >= 0.05 ? -12 : -4);
        continue;
      }
      // Faillite imprévue dans le futur, rare.
      if (!past && rand() < 0.002) { delete B.h[id]; this.say(`${name} s’effondre et fait faillite ; vos actions sont perdues.`, "money", true); this.bump("happy", -6); continue; }
      const d = f * cap * co.div;
      if (d > 1) this.addMoney(d);
      if (f >= 0.05) this.network += 0.3;
      if (f >= 0.5 && rand() < 0.15) this.say(pick([`Préside le conseil de ${name} : les journaux scrutent chacune de ses décisions.`, `${name}, qu’${this.g("il", "elle")} contrôle, ouvre de nouvelles usines et de nouveaux bureaux dans le monde.`, `À l’assemblée générale de ${name}, des milliers d’actionnaires attendent son discours.`]), "work");
    }
  },
  // Acheter des actions d'une grande entreprise : pour une somme, ou une part de l'entreprise.
  buyShares(co, frac, premium = 1) {
    const B = this.ensureBourse(), cap = this.coCap(co), cost = cap * frac * premium, y = this.calYear, name = coName(co, y);
    const before = B.h[co.id] || 0;
    this.pay(cost);
    B.h[co.id] = Math.min(1, before + frac);
    const now = B.h[co.id];
    if (now >= 0.999) this.say(`Rachète la totalité de ${name} pour ${money(cost)} : l’entreprise est retirée de la Bourse et vous appartient entièrement.`, "money", true);
    else if (now >= 0.5 && before < 0.5) { this.say(`Prend le contrôle de ${name} (${sharePct(now)}) pour ${money(cost)} : vous présidez désormais le conseil d’administration.`, "money", true); this.bump("happy", 8); this.network += 3; }
    else if (now >= 0.05 && before < 0.05) { this.say(`Devient l’un des grands actionnaires de ${name} (${sharePct(now)}) : un siège au conseil d’administration.`, "money", true); this.network += 1; }
    else this.say(`Achète des actions ${deCo(name)} pour ${money(cost)}.`, "money");
    return cost;
  },
  sellShares(co, part = 1) {
    const B = this.ensureBourse(), f = (B.h[co.id] || 0) * part, name = coName(co, this.calYear);
    if (f <= 0) return 0;
    // Vendre un gros bloc fait baisser le prix.
    const got = f * this.coCap(co) * (f >= 0.05 ? 0.9 : 0.99);
    this.addMoney(got);
    B.h[co.id] = (B.h[co.id] || 0) - f;
    if (B.h[co.id] <= 1e-12) delete B.h[co.id];
    this.say(`Vend ${part >= 1 ? "ses" : "une partie de ses"} actions ${deCo(name)} : ${money(got)}.`, "money", f >= 0.05);
    return got;
  },
});
const sharePct = f => f >= 0.0995 ? `${Math.round(f * 100)} %` : f >= 0.00995 ? `${(f * 100).toFixed(1).replace(".", ",")} %` : f >= 0.0001 ? `${(f * 100).toFixed(2).replace(".", ",")} %` : "moins de 0,01 %";
const deCo = n => /^[AEIOUYÉ]/i.test(n) ? `d’${n}` : `de ${n}`;
// Pas de Bourse dans les économies planifiées ; avant 1990, seuls les pays riches et les grandes fortunes y ont accès.
function bourseOpen(L) {
  const y = L.calYear;
  if (planned(L.code, y)) return "Pas de Bourse ni d’actions privées dans ce pays à cette époque.";
  if (!L.bank) return "Il faut un compte en banque pour acheter des actions.";
  if (L.age < 18) return "Il faut être majeur.";
  if (L.here.gdp < 15000 && y < 1990 && L.netWorth() < median(L.here) * 100) return "Les Bourses étrangères ne sont pas accessibles d’ici à cette époque.";
  return true;
}
const freeCash = L => Math.max(0, L.savings);

// --- Les parts de ses propres entreprises et clubs -----------------------------------------------
// Monter à la majorité (51 %), puis tout racheter (100 %). Une entreprise cotée : une offre publique d'achat, plus chère.
function stakeTargets(L, b) {
  const s = b.stake ?? 1, prem = b.listed ? 1.25 : 1.1, out = [];
  if (s < 0.5) out.push({ to: 0.51, label: "Prendre la majorité (51 %)" });
  if (s < 0.999) out.push({ to: 1, label: b.listed ? "Racheter toutes les actions (100 %)" : "Racheter toutes les parts (100 %)" });
  return out.map(o => { const cost = b.value * (o.to - s) * prem; return { ...o, cost, ok: canPay(L, cost), sub: `≈ ${eur(cost)}${b.listed && o.to >= 1 ? " · offre publique d’achat, puis retrait de la Bourse" : ""}` }; });
}
function stakePills(L, b, i) {
  const list = stakeTargets(L, b);
  if (!list.length) return "";
  return `<p class="sp-head">Capital</p><div class="sp-pills">${list.map(o => `<button class="sp-pill" data-stake="${o.to}" data-bidx="${i}"${o.ok ? "" : " disabled"}>${esc(o.label)} <span>${esc(o.ok ? o.sub : o.sub + " · pas assez d’argent")}</span></button>`).join("")}</div>
    <p class="sp-note">Vous détenez ${Math.round((b.stake ?? 1) * 100)} % des parts. Les autres actionnaires vendent avec une prime (10 %, ou 25 % pour une entreprise cotée) ; il faut pouvoir payer la moitié comptant, le reste emprunté.</p>`;
}
function raiseStake(L, i, to) {
  const b = (L.businesses || [])[+i];
  if (!b || !L.alive) return null;
  const o = stakeTargets(L, b).find(x => Math.abs(x.to - to) < 1e-6);
  if (!o) return null;
  if (!o.ok) return "Pas assez d’argent.";
  const was = b.stake ?? 1, name = isClub(b) ? L.ensureClub(b).name : b.label;
  L.pay(o.cost); b.stake = o.to;
  if (was < 0.5 && b.mode === "investor") b.mode = !!L.job && !(L.jobInfo && L.jobInfo.id === "business") ? "side" : (L.businesses || []).some(x => x !== b && x.mode === "full") ? "side" : "full";
  if (o.to >= 1 && b.listed) { b.listed = false; L.say(`Lance une offre publique d’achat sur ${name} : ${money(o.cost)}. L’entreprise quitte la Bourse ; elle est à vous, entièrement.`, "money", true); }
  else L.say(o.to >= 1 ? `Rachète les parts des autres actionnaires de ${name} pour ${money(o.cost)} : ${isClub(b) ? "le club" : "l’entreprise"} est à vous, à 100 %.` : `Prend la majorité de ${name} (51 %) pour ${money(o.cost)}.`, "money", true);
  L.network += 1; L.bump("happy", 3);
  return o.to >= 1 ? "100 % des parts" : "Majorité : 51 %";
}

// --- Page « Grandes entreprises du monde » -------------------------------------------------------
function bourseHtml(L) {
  if (L.age < 16) return "";
  const open = bourseOpen(L), y = L.calYear, B = L.ensureBourse(), cash = freeCash(L);
  const list = BIG_COMPANIES.filter(co => coListed(co, y)).map(co => ({ co, cap: L.coCap(co) })).filter(x => x.cap > 0).sort((a, b) => b.cap - a.cap);
  const mine = list.filter(x => B.h[x.co.id] > 0);
  const card = ({ co, cap }) => {
    const f = B.h[co.id] || 0, name = coName(co, y), done = B.did[co.id] === L.age, doneCeo = B.did[co.id + ":ceo"] === L.age;
    const btn = (act, arg, label, sub, ok = true) => `<button class="sp-pill" data-bourse="${act}" data-co="${co.id}" data-arg="${arg}"${ok && open === true ? "" : " disabled"}>${esc(label)} <span>${esc(sub)}</span></button>`;
    const pills = [];
    for (const share of [0.1, 0.5]) { const x = cash * share; if (x >= median(L.here) * 0.05 && f + x / cap < 0.05) pills.push(btn("buy", share, `Investir ${Math.round(share * 100)} % de votre épargne`, `≈ ${eur(x)} · ${sharePct(x / cap)} de l’entreprise`)); }
    if (f < 0.01) pills.push(btn("pct", 0.01, "Acheter 1 % de l’entreprise", `≈ ${eur(cap * 0.0105)}`, canPay(L, cap * 0.0105)));
    if (f < 0.05) pills.push(btn("pct", 0.05 - f, "Monter à 5 %", `siège au conseil · ≈ ${eur(cap * (0.05 - f) * 1.1)}`, canPay(L, cap * (0.05 - f) * 1.1)));
    if (f < 0.5) pills.push(btn("pct", 0.51 - f, "Prendre le contrôle (51 %)", `offre publique d’achat · ≈ ${eur(cap * (0.51 - f) * 1.3)}`, canPay(L, cap * (0.51 - f) * 1.3)));
    else if (f < 0.999) pills.push(btn("pct", 1 - f, "Tout racheter (100 %)", `retrait de la Bourse · ≈ ${eur(cap * (1 - f) * 1.3)}`, canPay(L, cap * (1 - f) * 1.3)));
    if (f >= 0.5) {
      pills.push(btn("special", 0, "Dividende exceptionnel", done ? "déjà cette année" : `≈ ${eur(cap * 0.03 * f)} pour vous · la valeur baisse un peu`, !done));
      pills.push(btn("ceo", 0, "Nommer un nouveau PDG", doneCeo ? "déjà cette année" : "un pari : la valeur peut monter… ou baisser", !doneCeo));
    }
    if (f > 0) { pills.push(btn("sell", 0.5, "Vendre la moitié", `≈ ${eur(f * cap * 0.5 * (f >= 0.05 ? 0.9 : 0.99))}`)); pills.push(btn("sell", 1, "Tout vendre", `≈ ${eur(f * cap * (f >= 0.05 ? 0.9 : 0.99))}`)); }
    const status = f >= 0.999 ? "à vous à 100 %" : f >= 0.5 ? `vous la contrôlez (${sharePct(f)})` : f >= 0.05 ? `grand actionnaire (${sharePct(f)}), siège au conseil` : f > 0 ? `vous détenez ${sharePct(f)}` : "";
    return `<div class="sp-card"><div class="sp-main"><b>${esc(name)} ${BY_CODE[co.code] ? BY_CODE[co.code].flag : ""}</b><small>${esc(co.sector)} · valeur ≈ ${eur(cap)}${co.div ? ` · dividende ≈ ${(co.div * 100).toFixed(1).replace(".", ",")} % par an` : " · pas de dividende"}</small>${f > 0 ? `<small><b>${esc(status)}</b> · votre part ≈ ${eur(f * cap)}</small>` : ""}</div></div>
      <div class="sp-pills">${pills.join("")}</div>`;
  };
  const rest = list.filter(x => !(B.h[x.co.id] > 0));
  const total = L.sharesValue();
  return `<div class="sp">
    <p class="sp-head">Grandes entreprises du monde${total > 0 ? ` · vos actions ≈ ${eur(total)}` : ""}</p>
    ${open === true ? "" : `<p class="sp-note">${esc(open)}</p>`}
    ${mine.map(card).join("")}
    ${rest.length ? `<details class="sp-more"${mine.length ? "" : " open"}><summary><b>Les ${Math.min(rest.length, 12)} plus grandes cotées en ${y}</b> <small>acheter des actions, entrer au conseil, prendre le contrôle</small></summary>${rest.slice(0, 12).map(card).join("")}</details>` : ""}
    <p class="sp-note">Valeurs approximatives, en dollars d’aujourd’hui ; les cours suivent à peu près l’histoire, avec leurs krachs et leurs faillites. Au-delà de 5 %, un siège au conseil d’administration ; au-delà de 50 %, vous contrôlez l’entreprise. Les grosses opérations se paient avec une prime ; vendre un gros bloc fait baisser le prix.</p>
  </div>`;
}
function bourseAction(L, act, id, arg) {
  const co = BIG_BY_ID[id], B = L.ensureBourse(), y = L.calYear;
  if (!co || !L.alive || !coListed(co, y)) return null;
  const open = bourseOpen(L);
  if (open !== true && act !== "sell") return open;
  const cap = L.coCap(co), f = B.h[co.id] || 0, name = coName(co, y);
  switch (act) {
    case "buy": {
      const x = freeCash(L) * +arg; if (x <= 1) return "Pas d’épargne disponible.";
      if (f + x / cap >= 0.05) return "Pour une part aussi grosse, passez par « Monter à 5 % » ou « Prendre le contrôle ».";
      L.buyShares(co, x / cap); return `Acheté : ${sharePct(x / cap)} ${deCo(name)}`;
    }
    case "pct": {
      const add = Math.min(+arg, 1 - f), prem = f + add >= 0.5 ? 1.3 : f + add >= 0.05 ? 1.1 : 1.05, cost = cap * add * prem;
      if (add <= 0) return null;
      if (!canPay(L, cost)) return "Pas assez d’argent (il faut pouvoir payer la moitié comptant).";
      L.buyShares(co, add, prem); return `Vous détenez ${sharePct(B.h[co.id])} ${deCo(name)}`;
    }
    case "sell": { const got = L.sellShares(co, +arg); return got ? `+${eur(got)}` : null; }
    case "special": {
      if (f < 0.5 || B.did[co.id] === L.age) return null;
      B.did[co.id] = L.age; const x = cap * 0.03 * f; L.addMoney(x); B.n[co.id] = (B.n[co.id] || 0) - 0.04;
      L.say(`Fait voter un dividende exceptionnel chez ${name} : ${money(x)} pour ${L.g("lui", "elle")}.`, "money", true); return `+${eur(x)}`;
    }
    case "ceo": {
      if (f < 0.5 || B.did[co.id + ":ceo"] === L.age) return null;
      B.did[co.id + ":ceo"] = L.age; const d = randn() * 0.15 + 0.02; B.n[co.id] = (B.n[co.id] || 0) + d;
      L.say(d > 0 ? `Nomme un nouveau PDG à la tête de ${name} ; la Bourse applaudit.` : `Nomme un nouveau PDG à la tête de ${name} ; les marchés doutent, l’action recule.`, "work", true);
      return d > 0 ? `Valeur +${Math.round(d * 100)} %` : `Valeur ${Math.round(d * 100)} %`;
    }
  }
  return null;
}

// --- Branchements : l'année, le patrimoine, l'héritage, la page, les clics -------------------------
{
  const upd = Life.prototype.updateMoney, nw = Life.prototype.netWorth;
  Life.prototype.updateMoney = function () { const r = upd.apply(this, arguments); this.bourseYear(); return r; };
  Life.prototype.netWorth = function () { return nw.call(this) + this.sharesValue(); };
  // À la mort, les actions sont vendues et rejoignent les placements transmis.
  const items = estateItems;
  estateItems = function (L) {
    const I = items(L), v = L.sharesValue();
    if (v > 1) I.fin.world = Math.round((I.fin.world || 0) + v);
    return I;
  };
  const rows = moneyRows;
  moneyRows = function (L) {
    const r = rows(L), B = L.bourse;
    if (B) for (const [id, f] of Object.entries(B.h)) { const co = BIG_BY_ID[id]; if (co) r.push(["Actions", `${coName(co, L.calYear)} · ${sharePct(f)} ≈ ${dollars(f * L.coCap(co))}`]); }
    return r;
  };
  const sp = spendHtml;
  spendHtml = function (L) { return sp.apply(this, arguments) + (L.alive ? bourseHtml(L) : ""); };
  const one = oneBusinessHtml;
  oneBusinessHtml = function (L, i, many) {
    const html = one(L, i, many), b = L.business, pills = b ? stakePills(L, b, i) : "";
    if (!pills) return html;
    return many ? html.replace(/<\/details>$/, `${pills}</details>`) : html + pills;
  };
  const click = spendClick;
  spendClick = function (L, t) {
    const s = t.closest("[data-stake]");
    if (s) return raiseStake(L, s.dataset.bidx, +s.dataset.stake) || "Impossible pour l’instant.";
    const bo = t.closest("[data-bourse]");
    if (bo) return bourseAction(L, bo.dataset.bourse, bo.dataset.co, bo.dataset.arg) || "Impossible pour l’instant.";
    return click(L, t);
  };
}
