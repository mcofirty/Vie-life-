// Interface : accueil, tirage, déroulement de la vie, actes de naissance et de décès.

const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, html = "") => Object.assign(document.createElement(tag), attrs, html ? { innerHTML: html } : {});
const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n, d = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const PPP_TO_EUR_FR = 0.72; // 1 $ PPA ≈ 0,72 € aux prix français
const SPEEDS = [1, 2, 4, 8, 16];

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ } },
};

// ---------- Thème ----------
(function theme() {
  const saved = store.get("vie.theme", null);
  if (saved) document.documentElement.dataset.theme = saved;
  $("themeBtn").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("vie.theme", next);
  });
})();

// ---------- Compteurs ----------
(function counters() {
  const birthsPerSec = WORLD_BIRTHS_K * 1000 / 31557600;
  const deathsPerSec = 62e6 / 31557600;
  const t0 = performance.now();
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    $("birthCount").textContent = nf.format(Math.floor(s * birthsPerSec));
    $("deathCount").textContent = nf.format(Math.floor(s * deathsPerSec));
    requestAnimationFrame(tick);
  };
  tick();
})();

// ---------- Probabilités et tableau des pays ----------
function renderOdds() {
  const total = COUNTRIES.reduce((s, c) => s + c.births, 0);
  const sorted = [...COUNTRIES].sort((a, b) => b.births - a.births);
  const max = sorted[0].births / total;
  $("oddsList").innerHTML = sorted.slice(0, 10).map(c => {
    const p = c.births / total;
    return `<li><span class="flag">${c.flag}</span><span>${c.name}</span><span class="bar"><i style="width:${(p / max * 100).toFixed(1)}%"></i></span><span class="pct">${fmt(p * 100, 1)} %</span></li>`;
  }).join("");
  const rest = 1 - sorted.slice(0, 10).reduce((s, c) => s + c.births, 0) / total;
  $("oddsNote").textContent = `Sur 100 bébés tirés au sort, voici d’où ils viendraient. Les ${COUNTRIES.length - 10} autres pays de la simulation se partagent les ${fmt(rest * 100, 0)} % restants. Ensemble, les ${COUNTRIES.length} pays inclus représentent environ ${fmt(total / WORLD_BIRTHS_K * 100, 0)} % des naissances mondiales.`;
  $("countryCount").textContent = COUNTRIES.length;
  document.querySelectorAll(".countryCount2").forEach(n => n.textContent = COUNTRIES.length);

  const cols = [
    ["Pays", c => `${c.flag} ${c.name}`, c => c.name],
    ["Naissances/an", c => nf.format(c.births * 1000), c => c.births],
    ["Espérance de vie H/F", c => `${fmt(c.e0.m)} / ${fmt(c.e0.f)}`, c => (c.e0.m + c.e0.f) / 2],
    ["Mortalité infantile ‰", c => fmt(c.imr, 1), c => c.imr],
    ["PIB/hab. ($ PPA)", c => nf.format(c.gdp), c => c.gdp],
    ["Gini", c => c.gini, c => c.gini],
    ["Années d’école", c => fmt(c.school, 1), c => c.school],
    ["Supérieur %", c => c.tert, c => c.tert],
    ["Homicides /100k", c => fmt(c.hom, 1), c => c.hom],
    ["Satisfaction /10", c => fmt(c.happy, 1), c => c.happy],
  ];
  let sortCol = 1, dir = -1;
  const draw = () => {
    const rows = [...COUNTRIES].sort((a, b) => {
      const va = cols[sortCol][2](a), vb = cols[sortCol][2](b);
      return (typeof va === "string" ? va.localeCompare(vb, "fr") : va - vb) * dir;
    });
    $("countryTable").innerHTML = `<thead><tr>${cols.map((c, i) => `<th data-i="${i}">${c[0]}${i === sortCol ? (dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${c[1](r)}</td>`).join("")}</tr>`).join("")}</tbody>`;
  };
  $("countryTable").addEventListener("click", e => {
    const th = e.target.closest("th"); if (!th) return;
    const i = +th.dataset.i;
    dir = i === sortCol ? -dir : (i === 0 ? 1 : -1); sortCol = i; draw();
  });
  draw();
}

function fillRealCountry() {
  const sel = $("realCountry");
  [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "fr")).forEach(c => sel.append(el("option", { value: c.code, textContent: `${c.flag} ${c.name}` })));
  sel.value = store.get("vie.real", "") || "";
  sel.addEventListener("change", () => store.set("vie.real", sel.value));
}

// ---------- Vies antérieures ----------
function pastLives() { return store.get("vie.lives", []); }
function renderPast() {
  const lives = pastLives();
  const ul = $("pastList");
  ul.innerHTML = "";
  if (!lives.length) { ul.append(el("li", { className: "empty", textContent: "Aucune vie pour l’instant." })); $("clearPast").hidden = true; return; }
  lives.slice(0, 10).forEach((r, i) => {
    const c = BY_CODE[r.s.home];
    const li = el("li", {}, `<span>${c.flag} <b>${esc(r.s.name)}</b> · ${c.name} · ${r.s.age} an${r.s.age > 1 ? "s" : ""}<br><small class="muted">${esc(r.s.cause || "")} · vécue le ${new Date(r.date).toLocaleDateString("fr-FR")}</small></span>`);
    const b = el("button", { className: "btn ghost small", textContent: "Revoir" });
    b.addEventListener("click", () => showDeath(lives[i], true));
    li.append(b);
    ul.append(li);
  });
  $("clearPast").hidden = false;
}
$("clearPast").addEventListener("click", () => {
  if (confirm("Effacer toutes les vies gardées dans ce navigateur ? C’est définitif.")) { store.set("vie.lives", []); renderPast(); }
});

// ---------- Tirage ----------
let life = null, peers = [], running = false, speed = 1, progress = 0, secPerYear = 20, lastT = 0;
let renderedLog = 0, reviewRecord = null;

function settings() {
  return {
    mode: document.querySelector("input[name=mode]:checked").value,
    minutes: +document.querySelector("input[name=dur]:checked").value,
    real: $("realCountry").value,
  };
}

function startDraw() {
  const st = settings();
  life = new Life({ mode: st.mode });
  peers = Array.from({ length: 4 }, () => simulateWhole({ mode: st.mode }));
  showScreen("draw");
  $("birthCert").hidden = true;
  $("spinner").hidden = false;
  let n = 0;
  const total = 22;
  const spin = () => {
    const c = n < total ? pick(COUNTRIES) : life.country;
    $("spinFlag").textContent = c.flag;
    $("spinName").textContent = c.name;
    if (n++ < total) setTimeout(spin, 40 + n * n * 0.9);
    else setTimeout(showBirth, 650);
  };
  spin();
}

function showBirth() {
  const c = life.country, st = settings();
  const weights = COUNTRIES.reduce((s, x) => s + (st.mode === "pop" ? x.pop : x.births), 0);
  const odds = Math.round(weights / (st.mode === "pop" ? c.pop : c.births));
  $("bcDate").textContent = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  $("bcName").value = life.name;
  $("bcFacts").innerHTML = [
    ["Pays", `${c.flag} ${c.name}`],
    ["Sexe", life.g("Garçon", "Fille")],
    ["Probabilité", `1 chance sur ${nf.format(odds)}`],
    ["Espérance de vie", `${fmt(c.e0[life.sex])} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} bébés sur 1 000 meurent avant 1 an`],
    ["Revenu moyen", `${nf.format(c.gdp)} $ PPA par an`],
    ["École", `${fmt(c.school, 1)} années en moyenne`],
    ["Université", `${c.tert} % d’une génération`],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  $("bcFamily").textContent = `Votre famille est ${life.familyLabel()}.`;
  $("spinner").hidden = true;
  $("birthCert").hidden = false;
}

$("bornBtn").addEventListener("click", startDraw);
$("cancelDraw").addEventListener("click", () => { life = null; showScreen("home"); });
$("startLife").addEventListener("click", () => {
  const nm = $("bcName").value.trim();
  if (nm) life.name = nm;
  beginLife();
});

function showScreen(id) {
  ["home", "draw", "life"].forEach(s => $(s).hidden = s !== id);
  if (id !== "draw") window.scrollTo(0, 0);
}

// ---------- Vie ----------
function beginLife() {
  const st = settings();
  secPerYear = st.minutes * 60 / life.country.e0[life.sex];
  progress = 0; renderedLog = 0;
  life.auto = $("autoChk").checked;
  $("storyLog").innerHTML = "";
  $("lfFlag").textContent = life.country.flag;
  $("lfName").textContent = life.name;
  $("priority").value = life.priority;
  setupCompare(st.real);
  showScreen("life");
  renderLife();
  setRunning(true);
  requestAnimationFrame(loop);
}

function setRunning(on) {
  running = on;
  $("playBtn").textContent = on ? "❚❚" : "▶";
  $("playBtn").setAttribute("aria-label", on ? "Pause" : "Lecture");
}

function modalOpen() {
  return !$("decisionModal").hidden || !$("pauseModal").hidden || !$("deathModal").hidden;
}

function loop(t) {
  if (!life || $("life").hidden) { lastT = 0; return; }
  const dt = lastT ? Math.min((t - lastT) / 1000, 0.5) : 0;
  lastT = t;
  if (running && life.alive && !modalOpen()) {
    progress += dt * speed / secPerYear;
    if (progress >= 1) { progress = 0; advance(); }
  }
  $("lfYear").style.width = `${(progress * 100).toFixed(1)}%`;
  requestAnimationFrame(loop);
}

// Avance d'une année et gère ce qui doit interrompre le temps.
function advance() {
  life.step();
  renderLife();
  afterStep();
}

function afterStep() {
  if (!life.alive) { setTimeout(() => showDeath(buildRecord()), 900); return true; }
  if (life.queue.length) { showDecision(); return true; }
  if (PAUSE_AGES.includes(life.age) && !life.reflections.some(r => r.age === life.age)) { showPause(); return true; }
  return false;
}

$("playBtn").addEventListener("click", () => setRunning(!running));
SPEEDS.forEach(s => {
  const b = el("button", { textContent: `×${s}` });
  b.addEventListener("click", () => { speed = s; document.querySelectorAll("#speeds button").forEach(x => x.classList.toggle("on", x === b)); });
  if (s === 1) b.classList.add("on");
  $("speeds").append(b);
});
$("nextBtn").addEventListener("click", () => {
  if (!life || !life.alive || modalOpen()) return;
  for (let i = 0; i < 100 && life.alive; i++) {
    const before = life.highlights.length;
    life.step();
    if (afterStepCheck(before)) break;
  }
  progress = 0;
  renderLife();
  afterStep();
});
function afterStepCheck(before) {
  return !life.alive || life.queue.length || life.highlights.length > before || PAUSE_AGES.includes(life.age);
}
$("autoChk").addEventListener("change", e => { if (life) life.auto = e.target.checked; });
$("quitBtn").addEventListener("click", () => {
  setRunning(false);
  showScreen("home");
  $("resumeBtn").hidden = !(life && life.alive);
});
$("resumeBtn").addEventListener("click", () => {
  if (!life || !life.alive) return;
  showScreen("life");
  setRunning(true);
  requestAnimationFrame(loop);
});

Object.entries(PRIORITIES).forEach(([k, v]) => $("priority").append(el("option", { value: k, textContent: v })));
$("priority").addEventListener("change", e => { if (life) life.priority = e.target.value; });

const STAT_META = [
  ["health", "Santé", "#3f8f6b"],
  ["happy", "Bonheur", "#e6a532"],
  ["know", "Savoir", "#5b6fd6"],
  ["rel", "Relations", "#c8553d"],
];

function renderLife() {
  const L = life, c = L.here;
  $("lfAge").textContent = L.age;
  $("lfAge").nextElementSibling.textContent = L.age > 1 ? "ans" : "an";
  $("lfCountry").textContent = `${c.flag} ${c.name}${L.emigrated ? ` (${L.g("né", "née")} ${inCountry(BY_CODE[L.home])})` : ""}`;

  $("statBars").innerHTML = STAT_META.map(([k, label, color]) =>
    `<div class="stat"><header><span>${label}</span><span>${Math.round(L.stats[k])}</span></header><div class="meter"><i style="width:${L.stats[k]}%;background:${color}"></i></div></div>`).join("");

  const living = L.children.filter(k => k.alive).length;
  const facts = [
    ["Famille d’origine", L.familyLabel()],
    ["Études", L.schooling ? `en cours : ${EDU_LABEL[L.schooling]}` : EDU_LABEL[L.edu]],
    ["Travail", L.retired ? "à la retraite" : L.job || (L.age < 6 ? "—" : "aucun")],
  ];
  if (L.income > 0) facts.push(["Revenu", `${nf.format(Math.round(L.income / 10) * 10)} $ PPA/an<br><small class="muted">≈ ${nf.format(Math.round(L.income * PPP_TO_EUR_FR / 12 / 10) * 10)} € par mois en prix français</small>`]);
  facts.push(["Couple", L.married ? `${L.g("marié", "mariée")} à ${esc(L.partner)}` : L.marriedEver ? L.g("seul aujourd’hui", "seule aujourd’hui") : "célibataire"]);
  if (L.children.length) facts.push(["Enfants", `${living}${living !== L.children.length ? ` (sur ${L.children.length})` : ""}`]);
  facts.push(["Frères et sœurs", L.siblings || "aucun"]);
  $("situation").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");

  // Récit : on ajoute les nouvelles lignes en haut.
  const ol = $("storyLog");
  for (; renderedLog < L.log.length; renderedLog++) {
    const e = L.log[renderedLog];
    const hl = L.highlights.includes(e);
    const li = el("li", { className: `${e.kind} ${hl ? "hl" : ""}` }, `<span class="a">${e.age} an${e.age > 1 ? "s" : ""}</span><span class="t">${esc(e.text)}</span>`);
    ol.prepend(li);
  }

  renderPeers();
  renderGrid($("grid100"), L.history, L.alive ? L.age : -1, !L.alive);
  renderSurvival();
}

function peerStatus(p, age) {
  if (!p.alive && p.age <= age) return `${p.g("Mort", "Morte")} à ${p.age} an${p.age > 1 ? "s" : ""} · ${p.cause}`;
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

function renderPeers() {
  $("peers").innerHTML = peers.map(p => {
    const dead = !p.alive && p.age <= life.age;
    const c = BY_CODE[p.home];
    return `<li class="${dead ? "dead" : ""}"><span class="f">${c.flag}</span><span><b>${esc(p.name)}, ${c.name}</b><small>${esc(peerStatus(p, life.age))}</small></span></li>`;
  }).join("");
}

function happyColor(v) {
  const hue = 8 + (v / 100) * 140;
  return `hsl(${hue.toFixed(0)} 55% 52%)`;
}
function renderGrid(node, history, nowAge, ended) {
  const last = history.length - 1;
  const cells = Math.max(100, Math.ceil((last + 1) / 10) * 10);
  let html = "";
  for (let i = 0; i < cells; i++) {
    const h = history[i];
    const cls = [h ? "lived" : "", i === nowAge ? "now" : "", ended && i === last ? "end" : ""].join(" ");
    html += `<i class="${cls}" ${h ? `style="background:${happyColor(h.happy)}" title="${i} an${i > 1 ? "s" : ""} · bonheur ${h.happy}"` : ""}></i>`;
  }
  node.innerHTML = html;
}

function renderSurvival() {
  const { lx } = lifeTable(life.home, life.sex);
  const X = a => 40 + a * 2.52, Y = v => 130 - v * 118;
  const pts = lx.slice(0, 101).map((v, a) => `${X(a).toFixed(1)},${Y(v).toFixed(1)}`);
  const a = Math.min(life.age, 100);
  const share = lx[a];
  $("survival").innerHTML = `
    <line class="axis" x1="40" y1="130" x2="292" y2="130"/><line class="axis" x1="40" y1="12" x2="40" y2="130"/>
    <text class="lbl" x="35" y="16" text-anchor="end">100 %</text><text class="lbl" x="35" y="133" text-anchor="end">0</text>
    ${[0, 25, 50, 75, 100].map(t => `<text class="lbl" x="${X(t)}" y="144" text-anchor="middle">${t}</text>`).join("")}
    <polygon class="area" points="${X(0)},130 ${pts.join(" ")} ${X(100)},130"/>
    <polyline class="curve" points="${pts.join(" ")}"/>
    <circle class="marker" cx="${X(a)}" cy="${Y(share)}" r="4"/>`;
  $("survivalNote").textContent = `${fmt(share * 100, 0)} % des ${life.g("garçons", "filles")} ${life.g("nés", "nées")} la même année ${inCountry(BY_CODE[life.home])} sont encore en vie à ${a} an${a > 1 ? "s" : ""}.`;
}

function compareRows(a, b, sex) {
  return [
    ["Espérance de vie", `${fmt(a.e0[sex])} ans`, `${fmt(b.e0[sex])} ans`],
    ["Mortalité infantile", `${fmt(a.imr, 1)} ‰`, `${fmt(b.imr, 1)} ‰`],
    ["Revenu moyen", `${nf.format(a.gdp)} $`, `${nf.format(b.gdp)} $`],
    ["Années d’école", fmt(a.school, 1), fmt(b.school, 1)],
    ["Université", `${a.tert} %`, `${b.tert} %`],
    ["Homicides /100k", fmt(a.hom, 1), fmt(b.hom, 1)],
    ["Satisfaction", `${fmt(a.happy, 1)}/10`, `${fmt(b.happy, 1)}/10`],
  ];
}
function compareTable(birth, real, sex) {
  return `<thead><tr><th></th><th>${birth.flag} ${birth.name}</th><th>${real.flag} ${real.name}</th></tr></thead><tbody>${compareRows(birth, real, sex).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody>`;
}
function setupCompare(real) {
  life.real = real || null;
  $("comparePanel").hidden = !real;
  if (real) $("compare").innerHTML = compareTable(life.country, BY_CODE[real], life.sex);
}

// ---------- Décisions et pauses ----------
function showDecision() {
  const d = life.queue[0];
  $("decAge").textContent = `${life.age} ans`;
  $("decText").textContent = d.text;
  const box = $("decOptions");
  box.innerHTML = "";
  d.options.forEach((o, i) => {
    const b = el("button", { className: `btn ${i === 0 ? "primary" : "ghost"}`, textContent: o.label });
    b.addEventListener("click", () => {
      $("decisionModal").hidden = true;
      life.resolve(i);
      renderLife();
      if (life.queue.length) showDecision();
      else if (PAUSE_AGES.includes(life.age) && !life.reflections.some(r => r.age === life.age)) showPause();
    });
    box.append(b);
  });
  $("decisionModal").hidden = false;
  box.querySelector("button").focus();
}

const PAUSE_QUESTIONS = {
  5: L => `${L.name} a 5 ans. Quel est le plus ancien souvenir que vous gardez de votre propre enfance ?`,
  15: L => `${L.name} a 15 ans${L.schooling ? " et va encore à l’école" : L.job ? " et travaille déjà" : ""}. À 15 ans, quelles portes étaient ouvertes devant vous ?`,
  30: L => `${L.name} a 30 ans. Dans votre vie, qu’est-ce qui doit beaucoup au lieu où vous êtes ${L.g("né", "né·e")} ?`,
  50: L => `${L.name} a 50 ans. Si vous pouviez lui parler une minute, que lui diriez-vous ?`,
  70: L => `${L.name} a 70 ans. Qu’aimeriez-vous qu’on retienne d’une vie, la sienne ou la vôtre ?`,
};
function showPause() {
  $("pauseAge").textContent = `${life.age} ans`;
  $("pauseText").textContent = PAUSE_QUESTIONS[life.age](life);
  $("pauseInput").value = "";
  $("pauseModal").hidden = false;
  $("pauseInput").focus();
}
$("pauseGo").addEventListener("click", () => {
  life.reflections.push({ age: life.age, q: $("pauseText").textContent, a: $("pauseInput").value.trim() });
  $("pauseModal").hidden = true;
});

// ---------- Décès ----------
function buildRecord() {
  const L = life;
  return {
    id: Date.now(), date: new Date().toISOString(), s: L.summary(), real: L.real,
    highlights: L.highlights.map(h => ({ age: h.age, text: h.text })),
    history: L.history.map(h => h && { happy: h.happy }),
    reflections: L.reflections,
    peers: peers.map(p => ({ name: p.name, home: p.home, code: p.code, age: p.age, cause: p.cause, sex: p.sex, edu: p.edu, children: p.children.length, emigrated: p.emigrated })),
    message: "",
  };
}

function showDeath(rec, review = false) {
  reviewRecord = rec;
  const s = rec.s, c = BY_CODE[s.home];
  const g = (m, f) => s.sex === "m" ? m : f;
  const ageTxt = s.age === 0 ? "moins d’un an" : `${s.age} an${s.age > 1 ? "s" : ""}`;
  const e0 = c.e0[s.sex];
  $("dcDate").textContent = new Date(rec.date).toLocaleDateString("fr-FR", { dateStyle: "long" });
  $("dcTitle").textContent = `${s.name} (${ageTxt})`;
  const diff = s.age - e0;
  $("dcLine").textContent = `${g("Né", "Née")} ${inCountry(c)} ${c.flag}, ${g("mort", "morte")} à ${ageTxt}${s.emigrated ? ` ${inCountry(BY_CODE[s.code])}` : ""}. ${Math.abs(diff) < 2 ? "C’est à peu près l’espérance de vie du pays." : diff > 0 ? `${fmt(diff)} ans de plus que l’espérance de vie du pays.` : `${fmt(-diff)} ans de moins que l’espérance de vie du pays.`}`;
  const facts = [
    ["Cause du décès", s.cause],
    ["Études", EDU_LABEL[s.edu]],
    ["Travail", s.job || "aucun"],
  ];
  if (s.income > 0) facts.push(["Dernier revenu", `${nf.format(Math.round(s.income / 10) * 10)} $ PPA/an`]);
  facts.push(["Mariage", s.marriedEver ? "oui" : "non"], ["Enfants", s.children ? `${s.children}${s.childrenAlive !== s.children ? ` (dont ${s.children - s.childrenAlive} ${s.children - s.childrenAlive > 1 ? "morts" : "mort"} en bas âge)` : ""}` : "aucun"]);
  $("dcFacts").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  renderGrid($("dcGrid"), rec.history, -1, true);
  $("dcHighlights").innerHTML = rec.highlights.slice(-12).map(h => `<li><b>${h.age} ans</b> · ${esc(h.text)}</li>`).join("") || "<li>Une vie trop courte pour laisser des souvenirs écrits.</li>";
  $("dcPeers").innerHTML = rec.peers.map(p => {
    const pc = BY_CODE[p.home];
    const pg = (m, f) => p.sex === "m" ? m : f;
    return `<li><span class="f">${pc.flag}</span><span><b>${esc(p.name)}, ${pc.name}</b><small>${pg("Mort", "Morte")} à ${p.age} an${p.age > 1 ? "s" : ""} · ${esc(p.cause)} · études : ${EDU_LABEL[p.edu]}${p.children ? ` · ${p.children} enfant${p.children > 1 ? "s" : ""}` : ""}${p.emigrated ? ` · a émigré ${inCountry(BY_CODE[p.code])}` : ""}</small></span></li>`;
  }).join("");
  $("dcCompare").innerHTML = rec.real ? `<h3>Cette vie et la vôtre</h3><table class="compare">${compareTable(c, BY_CODE[rec.real], s.sex)}</table>` : "";
  const refl = rec.reflections.filter(r => r.a);
  $("dcReflections").innerHTML = refl.length ? `<h3>Vos pauses</h3>${refl.map(r => `<div class="reflection"><b>${esc(r.q)}</b>${esc(r.a)}</div>`).join("")}` : "";
  const heavy = /suicide|homicide|surdose/.test(s.cause) || rec.highlights.some(h => /mariée à \d+ ans|meurt avant ses cinq ans/.test(h.text));
  $("dcHelp").hidden = !heavy;
  $("dcName2").textContent = s.name;
  $("dcMessage").value = rec.message || "";
  $("dcMessage").readOnly = review;
  $("againBtn").textContent = review ? "Naître à nouveau" : "Une autre vie";
  if (!review) saveRecord(rec);
  $("deathModal").hidden = false;
}

function saveRecord(rec) {
  const lives = pastLives().filter(r => r.id !== rec.id);
  lives.unshift(rec);
  store.set("vie.lives", lives.slice(0, 30));
}
function closeDeath() {
  const rec = reviewRecord;
  if (rec && !$("dcMessage").readOnly) { rec.message = $("dcMessage").value.trim(); saveRecord(rec); }
  $("deathModal").hidden = true;
  life = null;
  $("resumeBtn").hidden = true;
  renderPast();
}
$("againBtn").addEventListener("click", () => { closeDeath(); startDraw(); });
$("homeBtn").addEventListener("click", () => { closeDeath(); showScreen("home"); });

// ---------- Démarrage ----------
renderOdds();
fillRealCountry();
renderPast();
