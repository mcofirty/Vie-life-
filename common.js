// Outils partagés par la version web et l'application : formats, réglages,
// vies gardées, mémorial, liens et cartes de partage, musique douce, reprise.

const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n, d = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const ans = n => `${n} an${n > 1 ? "s" : ""}`;
const PPP_TO_EUR_FR = 0.72; // 1 $ PPA ≈ 0,72 € aux prix français
const SPEEDS = [1, 2, 4, 8, 12, 16];
const DURATIONS = { 15: "≈ 15 min", 30: "≈ 30 min", 60: "≈ 1 h", 90: "≈ 1 h 30" };
const APP_VERSION = "2.0";
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
  return [
    ["Naissances par an", nf.format(Math.round(c.births) * 1000)],
    ["Espérance de vie (H / F)", `${fmt(c.e0.m)} / ${fmt(c.e0.f)} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} ‰`],
    ["Mortalité maternelle", `${nf.format(Math.round(c.mmr))} / 100 000 naissances`],
    ["PIB par habitant", `${nf.format(c.gdp)} $ PPA`],
    ["Inégalités (Gini)", c.gini],
    ["Années d’école", fmt(c.school, 1)],
    ["Accès au supérieur", `${fmt(c.tert)} %`],
    ["Emploi agricole", `${fmt(c.agri)} %`],
    ["Enfants par femme", fmt(c.tfr, 1)],
    ["Mariage avant 18 ans", `${fmt(c.cm)} % des filles`],
    ["VIH (15-49 ans)", `${fmt(c.hiv, 1)} %`],
    ["Homicides", `${fmt(c.hom, 1)} / 100 000`],
    ["Tabac", `${fmt(c.smoke)} % des adultes`],
    ["Soins payés de sa poche", `${fmt(c.oop)} %`],
    ["Satisfaction de vie", `${fmt(c.happy, 1)} / 10`],
  ];
}

// Résumés « Famille et vie » et « Argent » pour les panneaux.
function familyRows(L) {
  const rows = [];
  L.parents.forEach(p => rows.push([p.sex === "f" ? "Mère" : "Père", `${p.name}${p.alive ? `, ${ans(p.age)}` : " †"}`]));
  const sibs = L.sibs.filter(s => s.born <= L.age);
  rows.push(["Frères et sœurs", sibs.length ? sibs.map(s => `${s.name}${s.alive ? "" : " †"}`).join(", ") : "aucun"]);
  rows.push(["Couple", L.married ? `${L.g("marié", "mariée")} à ${L.partner}` : L.marriedEver ? L.g("seul aujourd’hui", "seule aujourd’hui") : "célibataire"]);
  rows.push(["Enfants", L.children.length ? L.children.map(k => `${k.name}${k.alive ? ` (${ans(L.age - k.born)})` : " †"}`).join(", ") : "aucun"]);
  if (L.grandkids) rows.push(["Petits-enfants", String(L.grandkids)]);
  rows.push(["Projet d’enfants", KIDS_PLAN[L.wantKids]]);
  return rows;
}
function moneyRows(L) {
  const rows = [];
  rows.push(["Revenu", L.income > 0 ? `${dollars(L.income)} PPA/an · ≈ ${euroMonth(L.income)} par mois (prix français)` : "aucun"]);
  rows.push(["Épargne", dollars(L.savings)]);
  rows.push(["Dettes", L.debt > 0 ? dollars(L.debt) : "aucune"]);
  rows.push(["Logement", L.house ? "propriétaire" : "locataire ou chez la famille"]);
  rows.push(["Train de vie", SPEND[L.spend].label]);
  rows.push(["Placements", INVEST[L.invest].label]);
  return rows;
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
      edu: EDU_LABEL[s.edu] ? s.edu : "none", job: s.job ? str(s.job, 60) : null, income: num(s.income), incomePct: s.incomePct == null ? null : num(s.incomePct),
      marriedEver: !!s.marriedEver, children: Math.round(num(s.children)), childrenAlive: Math.round(num(s.childrenAlive)), grandkids: Math.round(num(s.grandkids)),
      wealth: num(s.wealth), house: !!s.house, emigrated: !!s.emigrated, stats: {}, born: "", birthDate: s.birthDate && !isNaN(new Date(s.birthDate)) ? new Date(s.birthDate).toISOString() : null,
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
    notes: (Array.isArray(r.notes) ? r.notes : []).slice(0, 50).map(n => ({ text: str(n.text, 300), date: isNaN(new Date(n.date)) ? new Date().toISOString() : new Date(n.date).toISOString() })),
    ...(r.shared ? { shared: true } : {}),
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
    peers: rec.peers, shared: true,
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
const REGION_GRADIENT = {
  SAS: ["#ff9966", "#c2185b"], EAS: ["#ff5f6d", "#6a3093"], SSA: ["#f7971e", "#8e2de2"], MENA: ["#e2b04a", "#7b4397"],
  LAT: ["#11998e", "#2d6a4f"], EUR: ["#4b6cb7", "#182848"], NAM: ["#3a7bd5", "#3a6073"],
};
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
const happyHue = v => `hsl(${(8 + v / 100 * 140).toFixed(0)} 65% 55%)`;
// kind : "birth" (avec une vie en cours) ou "death" (avec une vie gardée).
function drawCard(kind, data) {
  const W = 1080, H = 1350, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx.roundRect) ctx.roundRect = (x, y, w, h) => ctx.rect(x, y, w, h);
  const s = kind === "birth" ? data.summary() : data.s;
  const c = BY_CODE[s.home];
  const [p1, p2] = kind === "birth" ? (REGION_GRADIENT[c.region] || REGION_GRADIENT.EUR) : ["#2b2d42", "#11121c"];
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, p1); grad.addColorStop(1, p2);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
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
  ctx.fillText("Vie · Naître au hasard", 80, H - 80);
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
