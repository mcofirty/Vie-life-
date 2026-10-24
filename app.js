// Interface : accueil, tirage, déroulement de la vie, actes de naissance et de décès,
// panneaux Famille et Argent, mémorial et vies antérieures.

const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, html = "") => Object.assign(document.createElement(tag), attrs, html ? { innerHTML: html } : {});

let toastTimer;
function toast(text) {
  const t = $("toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.hidden = true, 2800);
}

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

// ---------- Réglages ----------
const oddsYear = () => prefs.era === "year" ? prefs.year : NOW_YEAR;
function syncPrefInputs(key) {
  document.querySelectorAll(`input[data-pref="${key}"]`).forEach(i => i.checked = !!prefs[key]);
}
function initSettings() {
  $("eraChoices").innerHTML = Object.entries(ERAS).map(([k, v]) => `<label class="choice"><input type="radio" name="era" value="${k}"><span><b>${v}</b></span></label>`).join("");
  document.querySelectorAll("input[name=era]").forEach(i => {
    i.checked = i.value === prefs.era;
    i.addEventListener("change", () => { setPref("era", i.value); updateEra(); });
  });
  $("yearInput").value = prefs.year;
  $("yearInput").addEventListener("change", e => {
    const y = clamp(Math.round(+e.target.value || NOW_YEAR), MIN_YEAR, MAX_YEAR);
    e.target.value = y; setPref("year", y); updateEra();
  });
  document.querySelectorAll("input[name=mode]").forEach(i => {
    i.checked = i.value === prefs.mode;
    i.addEventListener("change", () => { setPref("mode", i.value); renderOdds(); });
  });
  $("durSeg").innerHTML = Object.entries(DURATIONS).map(([k, v]) => `<label><input type="radio" name="dur" value="${k}"${String(prefs.dur) === k ? " checked" : ""}><span>${v}</span></label>`).join("");
  document.querySelectorAll("input[name=dur]").forEach(i => i.addEventListener("change", () => setPref("dur", i.value)));
  document.querySelectorAll("input[data-pref]").forEach(i => {
    const key = i.dataset.pref;
    i.checked = !!prefs[key];
    i.addEventListener("change", () => {
      setPref(key, i.checked);
      syncPrefInputs(key);
      if (key === "music") Music.set(prefs.music && !$("life").hidden);
      if (key === "auto" && life) { life.auto = prefs.auto; $("autoChk").checked = life.auto; }
      if (key === "gentle" && life) renderStory(true);
      if (key === "classroom") toast(prefs.classroom ? "Mode classe : il s’appliquera à la prochaine vie" : "Mode classe désactivé");
    });
  });
  updateEra();
}
function updateEra() {
  $("yearField").hidden = prefs.era !== "year";
  $("eraNote").textContent = {
    today: `Vous naissez aujourd’hui, en ${NOW_YEAR}.`,
    past: "Une année tirée entre 1900 et 2000. Guerres, famines, épidémies et crises de l’histoire réelle peuvent traverser la vie.",
    future: "Une année tirée entre 2030 et 2100, selon les projections de l’ONU (espérance de vie, revenus, fécondité, école).",
    random: "Une année tirée entre 1900 et 2100.",
    year: "Les statistiques du pays évoluent ensuite année après année.",
  }[prefs.era];
  renderOdds();
}

// ---------- Probabilités et tableau des pays ----------
let sortCol = 1, sortDir = -1;
function renderOdds() {
  const year = oddsYear();
  const at = COUNTRIES.map(c => countryAt(c.code, year));
  const w = c => prefs.mode === "pop" ? c.pop : c.births;
  const total = at.reduce((s, c) => s + w(c), 0);
  const sorted = [...at].sort((a, b) => w(b) - w(a));
  const max = w(sorted[0]) / total;
  $("oddsTitle").textContent = year === NOW_YEAR ? "Si vous naissiez à l’instant" : `Si vous naissiez en ${year}`;
  $("oddsList").innerHTML = sorted.slice(0, 10).map(c => {
    const p = w(c) / total;
    return `<li><span class="flag">${c.flag}</span><span>${c.name}</span><span class="bar"><i style="width:${(p / max * 100).toFixed(1)}%"></i></span><span class="pct">${fmt(p * 100, 1)} %</span></li>`;
  }).join("");
  const rest = 1 - sorted.slice(0, 10).reduce((s, c) => s + w(c), 0) / total;
  const birthsNow = COUNTRIES.reduce((s, c) => s + c.births, 0);
  $("oddsNote").textContent = `Sur 100 bébés tirés au sort, voici d’où ils viendraient. Les ${COUNTRIES.length - 10} autres pays de la simulation se partagent les ${fmt(rest * 100, 0)} % restants. Ensemble, les ${COUNTRIES.length} pays inclus représentent environ ${fmt(birthsNow / WORLD_BIRTHS_K * 100, 0)} % des naissances mondiales d’aujourd’hui.${prefs.era === "past" || prefs.era === "future" || prefs.era === "random" ? " Les chances changent avec l’année tirée." : ""}`;
  $("countryCount").textContent = COUNTRIES.length;
  document.querySelectorAll(".countryCount2").forEach(n => n.textContent = COUNTRIES.length);
  drawTable(at, year);
}
const TABLE_COLS = [
  ["Pays", c => `${c.flag} ${c.name}`, c => c.name],
  ["Naissances/an", c => nf.format(Math.round(c.births) * 1000), c => c.births],
  ["Espérance de vie H/F", c => `${fmt(c.e0.m)} / ${fmt(c.e0.f)}`, c => (c.e0.m + c.e0.f) / 2],
  ["Mortalité infantile ‰", c => fmt(c.imr, 1), c => c.imr],
  ["Mort. maternelle /100k", c => nf.format(Math.round(c.mmr)), c => c.mmr],
  ["PIB/hab. ($ PPA)", c => nf.format(c.gdp), c => c.gdp],
  ["Gini", c => c.gini, c => c.gini],
  ["Années d’école", c => fmt(c.school, 1), c => c.school],
  ["Supérieur %", c => fmt(c.tert), c => c.tert],
  ["Agriculture %", c => fmt(c.agri), c => c.agri],
  ["Enfants/femme", c => fmt(c.tfr, 1), c => c.tfr],
  ["Mariage <18 ans %", c => fmt(c.cm), c => c.cm],
  ["VIH %", c => fmt(c.hiv, 1), c => c.hiv],
  ["Homicides /100k", c => fmt(c.hom, 1), c => c.hom],
  ["Tabac %", c => fmt(c.smoke), c => c.smoke],
  ["Soins à sa charge %", c => fmt(c.oop), c => c.oop],
  ["Satisfaction /10", c => fmt(c.happy, 1), c => c.happy],
];
let tableRows = [];
function drawTable(at = tableRows, year) {
  tableRows = at;
  const rows = [...at].sort((a, b) => {
    const va = TABLE_COLS[sortCol][2](a), vb = TABLE_COLS[sortCol][2](b);
    return (typeof va === "string" ? va.localeCompare(vb, "fr") : va - vb) * sortDir;
  });
  $("countryTable").innerHTML = `<caption>${year && year !== DATA_YEAR ? `Valeurs estimées pour ${year}` : "Valeurs vers 2023"}</caption><thead><tr>${TABLE_COLS.map((c, i) => `<th data-i="${i}">${c[0]}${i === sortCol ? (sortDir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${TABLE_COLS.map(c => `<td>${c[1](r)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
$("countryTable").addEventListener("click", e => {
  const th = e.target.closest("th"); if (!th) return;
  const i = +th.dataset.i;
  sortDir = i === sortCol ? -sortDir : (i === 0 ? 1 : -1); sortCol = i; drawTable(tableRows, oddsYear());
});

function fillRealCountry() {
  const sel = $("realCountry");
  [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "fr")).forEach(c => sel.append(el("option", { value: c.code, textContent: `${c.flag} ${c.name}` })));
  sel.value = store.get("vie.real", "") || "";
  sel.addEventListener("change", () => store.set("vie.real", sel.value));
}

// ---------- Vies antérieures et mémorial ----------
let pastShown = 10;
Object.entries(SORTS).forEach(([k, [label]]) => $("sortSel").append(el("option", { value: k, textContent: label })));
$("sortSel").value = store.get("vie.sort", "recent");
$("sortSel").addEventListener("change", () => { store.set("vie.sort", $("sortSel").value); renderPast(); });

function lifeItem(r, extra = "") {
  const c = BY_CODE[r.s.home];
  const li = el("li", {}, `<span>${c.flag} <b>${esc(r.s.name)}</b> · ${c.name} · ${ans(r.s.age)}${r.s.year ? ` · ${r.s.year}` : ""}${r.memorial ? " · <span title=\"Au mémorial\">🕯️</span>" : ""}<br><small class="muted">${esc(prefs.gentle && HEAVY_CAUSES.includes(r.s.cause) ? "cause non affichée" : r.s.cause)} · ${r.shared ? "reçue par lien" : `vécue le ${new Date(r.date).toLocaleDateString("fr-FR")}`}${extra}</small></span>`);
  const b = el("button", { className: "btn ghost small", textContent: "Revoir" });
  b.addEventListener("click", () => showDeath(pastLives().find(x => x.id === r.id) || r, r.shared ? "shared-kept" : "review"));
  li.append(b);
  return li;
}
function renderPast() {
  const lives = sortLives(pastLives().filter(r => !r.shared), $("sortSel").value);
  const ul = $("pastList");
  ul.innerHTML = "";
  $("clearPast").hidden = !lives.length;
  $("exportBtn").hidden = !pastLives().length;
  if (!lives.length) ul.append(el("li", { className: "empty", textContent: "Aucune vie pour l’instant." }));
  lives.slice(0, pastShown).forEach(r => ul.append(lifeItem(r)));
  $("moreBtn").hidden = lives.length <= pastShown;
  $("moreBtn").textContent = `Voir plus (${lives.length - pastShown})`;
  renderMemorial();
}
function renderMemorial() {
  const f = document.querySelector("input[name=memf]:checked").value;
  const lives = pastLives().filter(r => f === "shared" ? r.shared : f === "mine" ? r.memorial && !r.shared : r.memorial || r.shared);
  const ul = $("memList");
  ul.innerHTML = "";
  if (!lives.length) ul.append(el("li", { className: "empty", textContent: f === "shared" ? "Aucune vie reçue par lien." : "Personne au mémorial pour l’instant. Ouvrez une vie terminée et choisissez « Mettre au mémorial »." }));
  lives.forEach(r => ul.append(lifeItem(r, ` · ${r.candles || 0} bougie${(r.candles || 0) > 1 ? "s" : ""}${r.notes && r.notes.length ? ` · ${r.notes.length} mot${r.notes.length > 1 ? "s" : ""}` : ""}`)));
}
document.querySelectorAll("input[name=memf]").forEach(i => i.addEventListener("change", renderMemorial));
$("moreBtn").addEventListener("click", () => { pastShown += 20; renderPast(); });
$("clearPast").addEventListener("click", () => {
  if (confirm("Effacer toutes les vies gardées dans ce navigateur ? C’est définitif. Les vies du mémorial restent.")) { clearLives(); renderPast(); toast("Vies effacées. Le mémorial est gardé."); }
});
$("exportBtn").addEventListener("click", () => { exportLives(); toast("Fichier enregistré : ouvrez-le avec « Importer » sur un autre appareil"); });
$("importInput").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  try { const n = await importLives(file); renderPast(); toast(n ? `${n} vie${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}` : "Aucune nouvelle vie dans ce fichier"); }
  catch { toast("Ce fichier ne contient pas de vies lisibles"); }
});
[$("strangerBtn"), $("strangerBtn2")].forEach(b => b.addEventListener("click", () => showDeath(strangerRecord(), "stranger")));

// ---------- Tirage ----------
let life = null, peers = [], running = false, speed = 1, progress = 0, secPerYear = 20, lastT = 0;
let renderedLog = 0, logLimit = 60, reviewRecord = null, reviewMode = null;

function startDraw() {
  const cur = loadCurrent();
  if ((life && life.alive) || cur) {
    if (!confirm("Une vie est en cours. Naître à nouveau la remplace. Continuer ?")) return;
    clearCurrent();
  }
  const year = drawYear(prefs.era, prefs.year);
  life = new Life({ mode: prefs.mode, year, classroom: prefs.classroom });
  peers = Array.from({ length: 4 }, () => simulateWhole({ mode: prefs.mode, year, classroom: prefs.classroom }));
  $("resumeBtn").hidden = true;
  showScreen("draw");
  $("drawKicker").textContent = `Tirage de votre lieu de naissance · ${year}`;
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
  const c = life.country;
  const events = activeEvents(life.code, life.year).map(x => x.ev.name);
  $("bcDate").textContent = birthDateText(life);
  $("bcName").value = life.name;
  $("bcFacts").innerHTML = [
    ["Pays", `${c.flag} ${c.name}`],
    ["Année", `${life.year} · ${eraOf(life.year)}`],
    ["Sexe", life.g("Garçon", "Fille")],
    ["Probabilité", `1 chance sur ${nf.format(birthOdds(life.home, life.mode, life.year))}`],
    ["Espérance de vie", `${fmt(c.e0[life.sex])} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} bébés sur 1 000 meurent avant 1 an`],
    ["Revenu moyen", `${nf.format(c.gdp)} $ PPA par an`],
    ["École", `${fmt(c.school, 1)} années en moyenne`],
    ["Université", `${fmt(c.tert)} % d’une génération`],
    ["Parents", `${life.parents[0].name} (${life.parents[0].age} ans) et ${life.parents[1].name} (${life.parents[1].age} ans)`],
    ...(events.length ? [["Contexte", capFirst(events.join(", "))]] : []),
  ].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  $("bcFamily").textContent = `Votre famille est ${life.familyLabel()}.${life.siblings ? ` ${life.siblings > 1 ? `${life.siblings} frères et sœurs` : "Un frère ou une sœur"} vous attend${life.siblings > 1 ? "ent" : ""}.` : ""}`;
  $("birthCardBtn").hidden = prefs.classroom;
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
$("birthCardBtn").addEventListener("click", () => {
  const nm = $("bcName").value.trim();
  if (nm) life.name = nm;
  shareCard("birth", life).then(r => r === "downloaded" && toast("Image enregistrée"));
});

function showScreen(id) {
  ["home", "draw", "life"].forEach(s => $(s).hidden = s !== id);
  if (id !== "draw") window.scrollTo(0, 0);
  Music.set(id === "life" && prefs.music);
}

// ---------- Vie ----------
function beginLife(resumed = false) {
  if (!resumed) {
    life.dur = prefs.dur;
    life.auto = prefs.auto;
    life.real = $("realCountry").value || null;
    saveCurrent(life, peers);
  }
  secPerYear = +(life.dur || prefs.dur) * 60 / life.country.e0[life.sex];
  progress = 0; renderedLog = resumed ? life.log.length : 0; logLimit = 60;
  $("autoChk").checked = life.auto;
  $("lfFlag").textContent = life.country.flag;
  $("lfName").textContent = life.name;
  $("priority").value = life.priority;
  setupCompare(life.real);
  showScreen("life");
  renderLife();
  renderStory(true);
  setRunning(true);
  lastT = 0;
  requestAnimationFrame(loop);
  if (resumed && life.queue.length) showDecision();
}

function setRunning(on) {
  running = on;
  $("playBtn").textContent = on ? "❚❚" : "▶";
  $("playBtn").setAttribute("aria-label", on ? "Pause" : "Lecture");
}

function modalOpen() {
  return ["decisionModal", "pauseModal", "deathModal", "panelModal", "helpModal"].some(id => !$(id).hidden);
}

function loop(t) {
  if (!life || $("life").hidden) { lastT = 0; return; }
  const dt = lastT ? Math.min((t - lastT) / 1000, 0.5) : 0;
  lastT = t;
  if (running && life.alive && !life.queue.length && !modalOpen()) {
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
const pauseDue = () => prefs.pauses && PAUSE_AGES.includes(life.age) && !life.reflections.some(r => r.age === life.age);
function afterStep() {
  if (!life.alive) { clearCurrent(); setTimeout(() => showDeath(buildRecord(life, peers), "new"), 900); return true; }
  if (life.queue.length) { showDecision(); return true; }
  saveCurrent(life);
  if (pauseDue()) { showPause(); return true; }
  return false;
}

$("playBtn").addEventListener("click", () => setRunning(!running));
SPEEDS.forEach(s => {
  const b = el("button", { textContent: `×${s}` });
  b.addEventListener("click", () => { speed = s; document.querySelectorAll("#speeds button").forEach(x => x.classList.toggle("on", x === b)); });
  if (s === 1) b.classList.add("on");
  $("speeds").append(b);
});
// Avance vite jusqu'au prochain moment marquant (ou jusqu'à la prochaine décision).
function skip(untilDecision) {
  if (!life || !life.alive || modalOpen()) return;
  if (life.queue.length) { showDecision(); return; }
  for (let i = 0; i < 120 && life.alive; i++) {
    const before = life.highlights.length;
    life.step();
    if (!life.alive || life.queue.length || pauseDue() || (!untilDecision && life.highlights.length > before)) break;
  }
  progress = 0;
  renderLife();
  afterStep();
}
$("nextBtn").addEventListener("click", () => skip(false));
$("nextDecBtn").addEventListener("click", () => skip(true));
$("pendingBtn").addEventListener("click", showDecision);
$("autoChk").addEventListener("change", e => {
  if (!life) return;
  life.auto = e.target.checked;
  setPref("auto", life.auto); syncPrefInputs("auto");
  if (life.auto && life.queue.length) { $("decisionModal").hidden = true; life.autoResolveAll(); renderLife(); afterStep(); }
});
function quitLife() {
  setRunning(false);
  $("menu").hidden = true;
  if (life && life.alive) saveCurrent(life);
  showScreen("home");
  showResume();
}
$("quitBtn").addEventListener("click", quitLife);
function showResume() {
  const cur = life && life.alive ? { life } : loadCurrent();
  $("resumeBtn").hidden = !cur;
  if (cur) $("resumeBtn").textContent = `Reprendre : ${cur.life.country.flag} ${cur.life.name}, ${ans(cur.life.age)}`;
}
$("resumeBtn").addEventListener("click", () => {
  if (!life || !life.alive) {
    const cur = loadCurrent();
    if (!cur) { showResume(); return; }
    life = cur.life; peers = cur.peers;
  }
  beginLife(true);
});

Object.entries(PRIORITIES).forEach(([k, v]) => $("priority").append(el("option", { value: k, textContent: v })));
$("priority").addEventListener("change", e => { if (life) { life.priority = e.target.value; saveCurrent(life); } });

// Menu « ⋯ »
$("menuBtn").addEventListener("click", e => {
  e.stopPropagation();
  const open = $("menu").hidden;
  $("menu").hidden = !open;
  $("menuBtn").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", e => { if (!e.target.closest(".menu-wrap")) { $("menu").hidden = true; $("menuBtn").setAttribute("aria-expanded", "false"); } });
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || !life) return;
  const act = b.dataset.act;
  $("menu").hidden = true;
  if (act === "family" || act === "money") openPanel(act);
  if (act === "birthcard") { if (prefs.classroom) toast("Le partage est désactivé en mode classe"); else shareCard("birth", life).then(r => r === "downloaded" && toast("Image enregistrée")); }
  if (act === "help") openHelp();
  if (act === "quit") quitLife();
});
document.addEventListener("keydown", e => {
  if (e.key !== " " || $("life").hidden || modalOpen() || e.target.closest("input, textarea, select, button")) return;
  e.preventDefault(); setRunning(!running);
});

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
  $("lfCalYear").textContent = L.calYear;
  $("lfCountry").textContent = `${c.flag} ${c.name}${L.emigrated ? ` (${L.g("né", "née")} ${inCountry(BY_CODE[L.home])})` : ""}`;
  $("autoChk").checked = L.auto;
  $("pendingBtn").hidden = !(L.alive && L.queue.length && $("decisionModal").hidden);

  $("statBars").innerHTML = STAT_META.map(([k, label, color]) =>
    `<div class="stat"><header><span>${label}</span><span>${Math.round(L.stats[k])}</span></header><div class="meter"><i style="width:${L.stats[k]}%;background:${color}"></i></div></div>`).join("");

  const facts = [
    ["Famille d’origine", L.familyLabel()],
    ["Études", L.schooling ? `en cours : ${EDU_LABEL[L.schooling]}` : EDU_LABEL[L.edu]],
    ["Travail", L.retired ? "à la retraite" : L.job || (L.age < 6 ? "—" : "aucun")],
  ];
  if (L.smoker) facts.push(["Tabac", L.g("fumeur", "fumeuse")]);
  if (L.hivPos) facts.push(["VIH", L.hivTreated() ? "sous traitement" : "sans traitement"]);
  $("situation").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  $("moneyMini").innerHTML = [
    ["Revenu", L.income > 0 ? `${dollars(L.income)} PPA/an<br><small class="muted">≈ ${euroMonth(L.income)} par mois en prix français</small>` : "aucun"],
    ["Épargne", dollars(L.savings)],
    ["Dettes", L.debt > 0 ? dollars(L.debt) : "aucune"],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  const living = L.children.filter(k => k.alive).length;
  $("familyMini").innerHTML = [
    ["Parents", L.parents.map(p => `${esc(p.name)}${p.alive ? "" : " †"}`).join(" et ")],
    ["Couple", L.married ? `${L.g("marié", "mariée")} à ${esc(L.partner)}` : L.marriedEver ? L.g("seul aujourd’hui", "seule aujourd’hui") : "célibataire"],
    ["Enfants", L.children.length ? `${living}${living !== L.children.length ? ` (sur ${L.children.length})` : ""}` : "aucun"],
    ["Frères et sœurs", L.siblings || "aucun"],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");

  renderStory();
  renderWorld();
  renderPeers();
  renderGrid($("grid100"), L.history, L.alive ? L.age : -1, !L.alive);
  renderSurvival();
  if (!$("panelModal").hidden) openPanel($("panelModal").dataset.kind);
}

// Récit : les moments les plus récents en haut ; ☆ pour en garder un.
function entryHtml(e, i, isNew) {
  const hidden = e.heavy && prefs.gentle && !e.revealed;
  const text = hidden ? `<button class="reveal" data-reveal="${i}">Un moment difficile · le lire</button>` : esc(e.text);
  const help = e.heavy ? `<small class="helpline">Besoin d’en parler ? <a href="#" data-help>Numéros d’aide</a></small>` : "";
  return `<li class="${e.kind} ${e.hl ? "hl" : ""} ${isNew ? "new" : ""}"><span class="a">${ans(e.age)}<small>${e.year ?? ""}</small></span><span class="t">${text}${help}</span><button class="star" data-star="${i}" aria-pressed="${!!e.star}" title="Garder ce moment">${e.star ? "★" : "☆"}</button></li>`;
}
function renderStory(force = false) {
  const L = life, n = L.log.length;
  if (!force && n === renderedLog && $("storyLog").childElementCount) return;
  const start = Math.max(0, n - logLimit);
  let html = "";
  for (let i = n - 1; i >= start; i--) html += entryHtml(L.log[i], i, i >= renderedLog && renderedLog > 0);
  $("storyLog").innerHTML = html;
  renderedLog = n;
  $("olderBtn").hidden = start === 0;
}
$("olderBtn").addEventListener("click", () => { logLimit += 100; renderStory(true); });
$("storyLog").addEventListener("click", e => {
  const star = e.target.closest("[data-star]"), rev = e.target.closest("[data-reveal]"), help = e.target.closest("[data-help]");
  if (star) { const en = life.log[+star.dataset.star]; en.star = !en.star; renderStory(true); saveCurrent(life); }
  if (rev) { life.log[+rev.dataset.reveal].revealed = true; renderStory(true); }
  if (help) { e.preventDefault(); openHelp(); }
});

function renderWorld() {
  const L = life, c = L.here;
  const evs = activeEvents(L.code, L.calYear);
  $("worldYear").textContent = `${L.calYear} · ${c.flag} ${c.name}`;
  $("worldList").innerHTML = (evs.length ? evs.map(x => `<li class="ev">${esc(capFirst(x.ev.name))} <small>${x.from}–${x.to > NOW_YEAR ? "…" : x.to}</small></li>`).join("") : `<li class="calm">Ni guerre ni grande crise dans le pays cette année.</li>`)
    + `<li><small>Espérance de vie à la naissance : ${fmt((c.e0.m + c.e0.f) / 2)} ans · revenu moyen ${nf.format(c.gdp)} $ · ${fmt(c.tfr, 1)} enfants par femme</small></li>`;
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
  const lx = cohortLx(life.home, life.sex, life.year);
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
  $("survivalNote").textContent = `${fmt(share * 100, 0)} % des ${life.g("garçons", "filles")} ${life.g("nés", "nées")} ${inCountry(BY_CODE[life.home])} en ${life.year} sont encore en vie à ${ans(a)} (hors guerres et catastrophes).`;
}

function compareTable(birth, real, sex) {
  return `<thead><tr><th></th><th>${birth.flag} ${birth.name} (${birth.year})</th><th>${real.flag} ${real.name} (vous)</th></tr></thead><tbody>${compareRows(birth, real, sex).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody>`;
}
function setupCompare(real) {
  $("comparePanel").hidden = !real;
  if (real) $("compare").innerHTML = compareTable(life.country, BY_CODE[real], life.sex);
}

// ---------- Panneaux Famille et Argent ----------
function openPanel(kind) {
  const L = life, m = $("panelModal");
  m.dataset.kind = kind;
  const rows = r => `<dl class="facts">${r.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
  const radios = (name, obj, cur) => `<div class="choices">${Object.entries(obj).map(([k, o]) => `<label class="choice"><input type="radio" name="${name}" value="${k}"${k === cur ? " checked" : ""}><span><b>${typeof o === "string" ? o : o.label}</b>${o.note ? `<small>${o.note}</small>` : ""}</span></label>`).join("")}</div>`;
  if (kind === "family") {
    $("panelTitle").textContent = "Famille et vie";
    $("panelBody").innerHTML = rows(familyRows(L)) + `
      <h3>Des enfants ?</h3>${radios("kidsPlan", KIDS_PLAN, L.wantKids)}
      <p class="tiny muted">Là où la contraception est rare, ne pas vouloir d’enfants ne suffit pas toujours.</p>
      <div class="cta-row">
        <button class="btn small" data-do="visit" ${L.visitedAt === L.age || !L.alive ? "disabled" : ""}>Passer du temps en famille</button>
        <button class="btn small" data-do="help" ${L.helpedAt === L.age || L.savings < 1 || !L.alive ? "disabled" : ""}>Aider la famille financièrement</button>
      </div>
      <p class="tiny muted">Une fois par an. Les liens familiaux comptent pour le mariage, les enfants et la solitude du grand âge.</p>`;
  } else {
    const price = L.housePrice();
    $("panelTitle").textContent = "Dépenser et investir";
    $("panelBody").innerHTML = rows(moneyRows(L)) + (L.age < 16 && !L.job ? `<p class="notice">Encore enfant : l’argent de la famille n’est pas le vôtre. Ces choix compteront dès le premier revenu.</p>` : "") + `
      <h3>Train de vie</h3>${radios("spend", SPEND, L.spend)}
      <h3>Où placer l’épargne</h3>${radios("invest", INVEST, L.invest)}
      <div class="cta-row">
        ${L.house ? `<button class="btn small" data-do="sell">Vendre le logement (≈ ${dollars(price * 0.92)})</button>` : `<button class="btn small" data-do="buy" ${L.canBuyHouse() ? "" : "disabled"}>Acheter un logement (≈ ${dollars(price)})</button>`}
        <button class="btn small" data-do="repay" ${L.debt > 0 && L.savings > 0 ? "" : "disabled"}>Rembourser les dettes</button>
      </div>
      <p class="tiny muted">Acheter demande d’avoir mis de côté au moins un quart du prix ; le reste devient un emprunt. Montants en dollars PPA, à prix constants. Les dettes pèsent sur le bonheur et la santé ; l’épargne rassure.</p>`;
  }
  m.hidden = false;
}
$("panelBody").addEventListener("change", e => {
  const i = e.target; if (!life) return;
  if (i.name === "kidsPlan") life.wantKids = i.value;
  if (i.name === "spend") life.spend = i.value;
  if (i.name === "invest") life.invest = i.value;
  saveCurrent(life);
});
$("panelBody").addEventListener("click", e => {
  const b = e.target.closest("[data-do]"); if (!b || !life) return;
  const L = life, act = b.dataset.do;
  const ok = act === "visit" ? L.visitFamily() : act === "help" ? L.helpFamily() : act === "buy" ? L.buyHouse() : act === "sell" ? L.sellHouse() : L.repayDebt();
  if (ok) { L.snapshot(); saveCurrent(L); }
  renderLife();
});
$("panelClose").addEventListener("click", () => $("panelModal").hidden = true);
function openHelp() { $("helpText").innerHTML = HELP_HTML; $("helpModal").hidden = false; }
$("helpClose").addEventListener("click", () => $("helpModal").hidden = true);
document.addEventListener("keydown", e => { if (e.key === "Escape") { $("panelModal").hidden = true; $("helpModal").hidden = true; } });

// ---------- Décisions et pauses ----------
function showDecision() {
  const d = life.queue[0];
  if (!d) return;
  $("decAge").textContent = `${ans(life.age)} · ${life.calYear}`;
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
      else { saveCurrent(life); if (pauseDue()) showPause(); }
    });
    box.append(b);
  });
  $("decisionModal").hidden = false;
  $("pendingBtn").hidden = true;
  box.querySelector("button").focus();
}
$("decLater").addEventListener("click", () => { $("decisionModal").hidden = true; renderLife(); });

function showPause() {
  $("pauseAge").textContent = ans(life.age);
  $("pauseText").textContent = PAUSE_QUESTIONS[life.age](life);
  $("pauseInput").value = "";
  $("pauseModal").hidden = false;
  $("pauseInput").focus();
}
$("pauseGo").addEventListener("click", () => {
  life.reflections.push({ age: life.age, q: $("pauseText").textContent, a: $("pauseInput").value.trim() });
  $("pauseModal").hidden = true;
  saveCurrent(life);
});

// ---------- Décès, mémorial, vies revues ----------
// mode : "new" (vie qui vient de finir), "review" (vie gardée), "stranger" (vie au hasard),
// "shared" (reçue par lien), "shared-kept" (reçue et gardée).
function showDeath(rec, mode) {
  reviewRecord = rec; reviewMode = mode;
  const s = rec.s, c = BY_CODE[s.home];
  const ageTxt = s.age === 0 ? "moins d’un an" : ans(s.age);
  const own = mode === "new" || mode === "review";
  const hideCause = prefs.gentle && HEAVY_CAUSES.includes(s.cause);
  $("dcKind").textContent = mode === "stranger" ? "Une vie au hasard" : mode.startsWith("shared") ? "Une vie partagée" : "Acte de décès";
  $("dcDate").textContent = mode === "stranger" ? "" : new Date(rec.date).toLocaleDateString("fr-FR", { dateStyle: "long" });
  $("dcTitle").textContent = `${s.name} (${ageTxt})`;
  $("dcLine").textContent = `${lifeLine(s)} ${c.flag} ${vsLifeExpectancy(s)}`;
  const facts = [
    ["Cause du décès", hideCause ? null : s.cause],
    ["Études", EDU_LABEL[s.edu]],
    ["Travail", s.job || "aucun"],
  ];
  if (s.income > 0) facts.push(["Dernier revenu", `${dollars(s.income)} PPA/an`]);
  if (s.wealth != null) facts.push(["Patrimoine", s.wealth >= 0 ? `${dollars(s.wealth)}${s.house ? " et un logement" : ""}` : `des dettes de ${dollars(-s.wealth)}`]);
  facts.push(["Mariage", s.marriedEver ? "oui" : "non"], ["Enfants", s.children ? `${s.children}${s.childrenAlive !== s.children ? ` (dont ${s.children - s.childrenAlive} ${s.children - s.childrenAlive > 1 ? "morts" : "mort"} en bas âge)` : ""}` : "aucun"]);
  if (s.grandkids) facts.push(["Petits-enfants", s.grandkids]);
  $("dcFacts").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${v == null ? `<button class="reveal" id="showCause">Afficher</button>` : esc(v)}</dd>`).join("");
  if (hideCause) $("showCause").onclick = e => e.target.replaceWith(document.createTextNode(s.cause));
  renderGrid($("dcGrid"), rec.history, -1, true);
  const stars = rec.starred || [];
  $("dcStarred").innerHTML = stars.length ? `<h3>Moments que vous avez gardés</h3><ol class="highlights">${stars.map(h => `<li><b>${ans(h.age)}</b> · ${esc(h.text)}</li>`).join("")}</ol>` : "";
  const hl = rec.highlights.filter(h => !(prefs.gentle && h.heavy));
  $("dcHighlights").innerHTML = hl.slice(-12).map(h => `<li><b>${ans(h.age)}${h.year ? ` (${h.year})` : ""}</b> · ${esc(h.text)}</li>`).join("") || "<li>Une vie trop courte pour laisser des souvenirs écrits.</li>";
  $("dcPeers").innerHTML = rec.peers.map(p => {
    const pc = BY_CODE[p.home];
    const pg = (m, f) => p.sex === "m" ? m : f;
    return `<li><span class="f">${pc.flag}</span><span><b>${esc(p.name)}, ${pc.name}</b><small>${pg("Mort", "Morte")} à ${ans(p.age)} · ${esc(prefs.gentle && HEAVY_CAUSES.includes(p.cause) ? "cause non affichée" : p.cause)} · études : ${EDU_LABEL[p.edu]}${p.children ? ` · ${p.children} enfant${p.children > 1 ? "s" : ""}` : ""}${p.emigrated ? ` · a émigré ${inCountry(BY_CODE[p.code])}` : ""}</small></span></li>`;
  }).join("");
  $("dcCompare").innerHTML = rec.real && own ? `<h3>Cette vie et la vôtre</h3><table class="compare">${compareTable(countryAt(s.home, s.year ?? DATA_YEAR), BY_CODE[rec.real], s.sex)}</table>` : "";
  const refl = own ? (rec.reflections || []).filter(r => r.a) : [];
  $("dcReflections").innerHTML = refl.length ? `<h3>Vos pauses</h3>${refl.map(r => `<div class="reflection"><b>${esc(r.q)}</b>${esc(r.a)}</div>`).join("")}` : "";
  $("dcHelp").innerHTML = HELP_HTML;
  $("dcHelp").hidden = !isHeavy(rec);
  $("dcWords").hidden = !own;
  $("dcName2").textContent = s.name;
  $("dcMessage").value = rec.message || "";
  $("dcMessage").readOnly = mode === "review" && !!rec.message;
  renderMemorialBox();
  $("againBtn").textContent = mode === "new" ? "Une autre vie" : "Naître";
  $("memorialBtn").hidden = !own;
  $("memorialBtn").textContent = rec.memorial ? "Retirer du mémorial" : "Mettre au mémorial";
  $("keepBtn").hidden = !(mode === "stranger" || mode === "shared");
  $("keepBtn").textContent = mode === "shared" ? "Garder au mémorial" : "Garder dans mes vies";
  $("cardBtn").hidden = prefs.classroom;
  $("linkBtn").hidden = prefs.classroom || mode.startsWith("shared");
  $("deleteBtn").hidden = !(mode === "review" || mode === "shared-kept");
  if (mode === "new" && !saveRecord(rec)) toast("Stockage plein : supprimez ou exportez des vies");
  $("deathModal").hidden = false;
}
function renderMemorialBox() {
  const rec = reviewRecord, show = rec.memorial || reviewMode.startsWith("shared");
  $("dcMemorial").hidden = !show;
  if (!show) return;
  const n = rec.candles || 0;
  $("dcCandles").textContent = n ? `${"🕯️".repeat(Math.min(n, 12))} ${n} bougie${n > 1 ? "s" : ""} allumée${n > 1 ? "s" : ""}` : "Aucune bougie pour l’instant.";
  $("dcNotes").innerHTML = (rec.notes || []).map(x => `<li>${esc(x.text)} <small class="muted">· ${new Date(x.date).toLocaleDateString("fr-FR")}</small></li>`).join("");
}
function persistReview() { if (pastLives().some(r => r.id === reviewRecord.id)) saveRecord(reviewRecord); }
$("candleBtn").addEventListener("click", () => { reviewRecord.candles = (reviewRecord.candles || 0) + 1; persistReview(); renderMemorialBox(); renderPast(); });
$("noteBtn").addEventListener("click", () => {
  const t = $("noteInput").value.trim(); if (!t) return;
  reviewRecord.notes = [...(reviewRecord.notes || []), { text: t, date: new Date().toISOString() }];
  $("noteInput").value = "";
  persistReview(); renderMemorialBox(); renderPast();
});
$("memorialBtn").addEventListener("click", () => {
  const rec = reviewRecord;
  rec.message = $("dcMessage").value.trim() || rec.message;
  rec.memorial = !rec.memorial;
  saveRecord(rec);
  $("memorialBtn").textContent = rec.memorial ? "Retirer du mémorial" : "Mettre au mémorial";
  renderMemorialBox(); renderPast();
  toast(rec.memorial ? "Au mémorial : cette vie sera gardée" : "Retirée du mémorial");
});
$("keepBtn").addEventListener("click", () => {
  const rec = reviewRecord;
  if (reviewMode === "shared") { rec.memorial = true; rec.shared = true; }
  else { rec.id = Date.now(); rec.date = new Date().toISOString(); delete rec.stranger; }
  saveRecord(rec);
  reviewMode = rec.shared ? "shared-kept" : "review";
  $("keepBtn").hidden = true;
  if (reviewMode === "review") { $("memorialBtn").hidden = false; $("deleteBtn").hidden = false; }
  renderMemorialBox(); renderPast();
  toast("Vie gardée");
});
$("cardBtn").addEventListener("click", () => shareCard("death", reviewRecord).then(r => r === "downloaded" && toast("Image enregistrée")));
$("linkBtn").addEventListener("click", async () => {
  const r = await shareLink(reviewRecord);
  if (r === "copied") toast("Lien copié. Vos réponses et vos derniers mots n’y sont pas.");
});
$("deleteBtn").addEventListener("click", () => {
  if (!confirm("Supprimer cette vie ? C’est définitif.")) return;
  deleteRecord(reviewRecord.id);
  reviewMode = "deleted";
  closeDeath();
  toast("Vie supprimée");
});

function closeDeath() {
  const rec = reviewRecord;
  if (rec && (reviewMode === "new" || reviewMode === "review") && !$("dcMessage").readOnly) {
    const msg = $("dcMessage").value.trim();
    if (msg !== (rec.message || "")) { rec.message = msg; saveRecord(rec); }
  }
  $("deathModal").hidden = true;
  if (location.hash.startsWith("#vie=")) history.replaceState(null, "", location.pathname + location.search);
  if (reviewMode === "new") { life = null; Music.stop(); }
  reviewRecord = null; reviewMode = null;
  showResume();
  renderPast();
}
$("againBtn").addEventListener("click", () => { closeDeath(); startDraw(); });
$("homeBtn").addEventListener("click", () => { const wasNew = reviewMode === "new"; closeDeath(); if (wasNew) showScreen("home"); });

// ---------- Démarrage ----------
document.querySelectorAll(".appVersion").forEach(n => n.textContent = APP_VERSION);
initSettings();
fillRealCountry();
renderPast();
showResume();
sharedFromHash().then(rec => { if (rec) showDeath(rec, "shared"); });
window.addEventListener("hashchange", () => sharedFromHash().then(rec => { if (rec) showDeath(rec, "shared"); }));
