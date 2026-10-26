// Version application (téléphone) : onglets, feuilles, anneaux, tirage façon carte.

const $ = id => document.getElementById(id);
const haptic = (ms = 8) => { if (prefs.haptics && navigator.vibrate) navigator.vibrate(ms); };

let toastTimer;
function toast(text) {
  const t = $("toast");
  t.textContent = text; t.hidden = false;
  t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.hidden = true, 2600);
}

// Icônes au trait Lifelot (24 × 24, trait 2, bouts ronds) — même esprit monoline que le logotype.
const ICON_PATHS = {
  ticket: '<path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/><path d="M10 9v6h4"/>',
  birth: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M17.7 6.3l-2.5 2.5M8.8 15.2l-2.5 2.5"/>',
  edu: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
  family: '<path d="M12 20s-7-4.4-8.6-8.6C2.2 8.2 4.3 5 7.5 5c1.9 0 3.4 1 4.5 2.6C13.1 6 14.6 5 16.5 5c3.2 0 5.3 3.2 4.1 6.4C19 15.6 12 20 12 20z"/>',
  move: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  death: '<path d="M12 3c2 2.4 3 4.1 3 5.8a3 3 0 0 1-6 0C9 7.1 10 5.4 12 3z"/><path d="M9.5 13.5h5V21h-5z"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  balance: '<path d="M12 4v16M8 20h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
  health: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  leisure: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
  friends: '<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 6.5-3"/>',
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/>',
  couple: '<circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/>',
  child: '<circle cx="12" cy="8" r="3.5"/><path d="M6 20a6 6 0 0 1 12 0"/>',
};
const icon = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.dot}</svg>`;

// ---------- Contrôles segmentés ----------
function segmented(name, value, onChange) {
  const seg = document.querySelector(`.segmented[data-name="${name}"]`);
  const set = v => seg.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  set(value);
  seg.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    set(b.dataset.v); haptic(); onChange(b.dataset.v);
  });
}

// ---------- Thème ----------
function applyTheme(v) {
  if (v === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = v;
}
const savedTheme = store.get("vie.theme", null) || "auto";
applyTheme(savedTheme);
segmented("theme", savedTheme, v => { store.set("vie.theme", v === "auto" ? null : v); applyTheme(v); });
segmented("mode", prefs.mode, v => setPref("mode", v));
segmented("dur", String(prefs.dur), v => setPref("dur", v));

// ---------- Époque ----------
(function era() {
  const sel = $("eraSel"), ysel = $("yearSel");
  Object.entries(ERAS).forEach(([k, v]) => sel.add(new Option(v, k)));
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) ysel.add(new Option(String(y), String(y)));
  const show = () => {
    sel.value = prefs.era; ysel.value = String(prefs.year);
    $("eraLabel").textContent = ERAS[prefs.era].replace(/ \(.*\)/, "");
    $("yearLabel").textContent = prefs.year;
    $("yearCell").hidden = prefs.era !== "year";
    $("eraNote").textContent = {
      today: `Vous naissez aujourd’hui, en ${NOW_YEAR}.`,
      past: "Une année entre 1900 et 2000 : guerres, famines, épidémies et crises réelles peuvent traverser la vie.",
      future: "Une année entre 2030 et 2100, selon les projections de l’ONU.",
      random: "Une année entre 1900 et 2100.",
      year: "Les statistiques du pays évoluent ensuite année après année.",
    }[prefs.era];
  };
  show();
  sel.addEventListener("change", () => { setPref("era", sel.value); haptic(); show(); });
  ysel.addEventListener("change", () => { setPref("year", +ysel.value); haptic(); show(); });
})();

// ---------- Onglets : barre de verre flottante ----------
const PAGES = ["tab-live", "tab-world", "tab-lives", "tab-settings"];
const tabbar = $("tabbar"), lens = $("tabLens"), tabs = [...tabbar.querySelectorAll("button")];
const activeTab = () => tabs.find(t => t.classList.contains("on"));

function placeLens(btn = activeTab(), x) {
  if (!lens || !btn) return;
  lens.style.width = `${btn.offsetWidth}px`;
  lens.style.transform = `translateX(${x ?? btn.offsetLeft}px)`;
}
function selectTab(btn) {
  const id = btn.dataset.tab;
  if (!$(id).hidden) { $(id).scrollTo({ top: 0, behavior: "smooth" }); placeLens(btn); return; }
  haptic();
  PAGES.forEach(p => $(p).hidden = p !== id);
  tabs.forEach(t => { t.classList.toggle("on", t === btn); t.setAttribute("aria-selected", String(t === btn)); });
  placeLens(btn);
  setMini(false);
  if (id === "tab-lives") renderLives();
}
function setMini(on) {
  if (tabbar.classList.contains("mini") === on) return;
  tabbar.classList.add("resizing");
  tabbar.classList.toggle("mini", on);
}
tabbar.addEventListener("transitionend", e => {
  if (e.target === tabbar && e.propertyName === "width") { tabbar.classList.remove("resizing"); placeLens(); }
});

// Toucher, appuyer, glisser : la pastille grossit sous le doigt et suit le geste.
let drag = null;
const tabAt = x => tabs.reduce((best, t) => {
  const c = t.offsetLeft + t.offsetWidth / 2;
  return Math.abs(c - x) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - x) ? t : best;
}, tabs[0]);
tabbar.addEventListener("pointerdown", e => {
  if (tabbar.classList.contains("mini")) { setMini(false); haptic(); return; }
  const r = tabbar.getBoundingClientRect();
  drag = { x0: e.clientX, left: r.left, moved: false, start: e.target.closest("button") };
  tabbar.setPointerCapture(e.pointerId);
  tabbar.classList.add("pressing");
  tabs.forEach(t => t.classList.toggle("hover", t === drag.start));
});
tabbar.addEventListener("pointermove", e => {
  if (!drag) return;
  if (!drag.moved && Math.abs(e.clientX - drag.x0) < 6) return;
  drag.moved = true;
  tabbar.classList.add("dragging");
  const w = lens.offsetWidth, x = Math.max(4, Math.min(tabbar.clientWidth - w - 4, e.clientX - drag.left - w / 2));
  lens.style.transform = `translateX(${x}px)`;
  const over = tabAt(x + w / 2);
  if (!over.classList.contains("hover")) { tabs.forEach(t => t.classList.toggle("hover", t === over)); haptic(4); }
});
function endDrag(e, cancel) {
  if (!drag) return;
  const target = drag.moved ? tabAt(e.clientX - drag.left) : drag.start;
  drag = null;
  tabbar.classList.remove("pressing", "dragging");
  tabs.forEach(t => t.classList.remove("hover"));
  if (!cancel && target) selectTab(target); else placeLens();
}
tabbar.addEventListener("pointerup", e => endDrag(e, false));
tabbar.addEventListener("pointercancel", e => endDrag(e, true));
// Clavier : Entrée / Espace sur un onglet.
tabbar.addEventListener("click", e => { if (e.detail === 0) { const b = e.target.closest("button"); if (b) selectTab(b); } });
window.addEventListener("resize", () => placeLens());
requestAnimationFrame(() => placeLens());

// Défilement : grand titre dans la barre du haut, barre d'onglets réduite en descendant.
PAGES.forEach(p => {
  let last = 0;
  $(p).addEventListener("scroll", e => {
    const y = e.target.scrollTop;
    e.target.classList.toggle("scrolled", y > 36);
    if (y > last + 8 && y > 120) setMini(true);
    else if (y < last - 8 || y < 40) setMini(false);
    last = y;
  }, { passive: true });
});

// ---------- Compteurs ----------
(function counters() {
  const bps = WORLD_BIRTHS_K * 1000 / 31557600, dps = 62e6 / 31557600, t0 = performance.now();
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    $("birthCount").textContent = nf.format(Math.floor(s * bps));
    $("deathCount").textContent = nf.format(Math.floor(s * dps));
    requestAnimationFrame(tick);
  };
  tick();
})();

// ---------- Vrai pays ----------
(function realCountry() {
  const sel = $("realCountry");
  [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "fr")).forEach(c => sel.add(new Option(`${c.flag} ${c.name}`, c.code)));
  const show = () => { const c = BY_CODE[sel.value]; $("realLabel").textContent = c ? `${c.flag} ${c.name}` : "Aucun"; };
  sel.value = store.get("vie.real", "") || "";
  show();
  sel.addEventListener("change", () => { store.set("vie.real", sel.value); show(); });
})();

// ---------- Réglages ----------
[["optAuto", "auto"], ["optPauses", "pauses"], ["optHaptics", "haptics"], ["optMusic", "music"], ["optGentle", "gentle"], ["optClassroom", "classroom"]].forEach(([id, key]) => {
  $(id).checked = !!prefs[key];
  $(id).addEventListener("change", e => {
    setPref(key, e.target.checked); haptic();
    if (key === "classroom") toast(prefs.classroom ? "S’appliquera à la prochaine vie" : "Mode classe désactivé");
  });
});
$("appVersion").textContent = APP_VERSION;
$("notesBtn").addEventListener("click", () => openSheet(`<h2 class="sheet-title">Notes de version</h2>
  <div class="group"><div class="cell column"><b>Version ${APP_VERSION}</b><small style="color:var(--label-2)">Récits de vie : plus de 700 moments qui racontent le quotidien selon le niveau de vie (de la survie à la grande aisance), le pays et sa culture, l’époque, la ville ou la campagne et l’âge. Fêtes, plats de famille, école et examens, métiers, trajets, argent, migrations, santé, noces, histoire vécue en direct, climat. Fils narratifs sur plusieurs années et petites décisions (prêter à un cousin, tontine, partir en ville ou dans le Golfe). Niveau de vie affiché dans l’argent et l’acte de naissance.</small></div>
  <div class="cell column"><b>Version 2.0</b><small style="color:var(--label-2)">Naître dans le passé (1900-2000), aujourd’hui ou dans le futur (jusqu’en 2100). Événements historiques réels : guerres, famines, épidémies, crises. Famille (parents, frères et sœurs, enfants, petits-enfants) et argent (train de vie, épargne, placements, logement, dettes). Nouvelles décisions : soins, tabac, poste loin des siens, mobilisation. Mortalité maternelle, VIH, emploi agricole. Mode automatique, musique douce, pas de scènes effrayantes, mode classe. Moments gardés ☆, décision en attente, prochaine décision. Mémorial (bougies, mots), cartes et liens de partage, transfert des vies, reprise d’une vie après fermeture. Vitesse ×12, durée 1 h 30.</small></div>
  <div class="cell column"><b>Version 1.0</b><small style="color:var(--label-2)">Première version de l’application.</small></div></div>`, { dismissable: true }));
$("privacyBtn").addEventListener("click", () => openSheet(`<h2 class="sheet-title">Confidentialité</h2>
  <p class="group-footer" style="margin:0 4px 16px;font-size:15px">Pas de compte, pas de publicité, pas de mesure d’audience. Vos vies, vos réponses et vos réglages restent sur cet appareil. Un lien de partage contient la vie elle-même, sans vos réponses aux pauses ni vos derniers mots : rien n’est envoyé à un serveur.</p>`, { dismissable: true }));

// ---------- Monde ----------
function renderWorld() {
  const total = COUNTRIES.reduce((s, c) => s + c.births, 0);
  const sorted = [...COUNTRIES].sort((a, b) => b.births - a.births);
  const max = sorted[0].births / total;
  $("oddsGroup").innerHTML = sorted.slice(0, 8).map(c => {
    const p = c.births / total;
    return `<button class="cell link" data-code="${c.code}"><div class="odds-row" style="flex:1"><span class="flag">${c.flag}</span><span>${c.name}</span><span class="pct">${fmt(p * 100, 1)} %</span><span class="bar"><i style="width:${(p / max * 100).toFixed(1)}%"></i></span></div><span class="chev"></span></button>`;
  }).join("");
  $("oddsNote").textContent = `Sur 100 bébés tirés au sort aujourd’hui, ${fmt(sorted.slice(0, 8).reduce((s, c) => s + c.births, 0) / total * 100, 0)} naîtraient dans l’un de ces 8 pays. Les ${COUNTRIES.length} pays de l’app représentent environ ${fmt(total / WORLD_BIRTHS_K * 100, 0)} % des naissances mondiales.`;
  const list = q => {
    const norm = s => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const rows = [...COUNTRIES].filter(c => !q || norm(c.name).includes(norm(q))).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    $("countryGroup").innerHTML = rows.map(c => `<button class="cell link" data-code="${c.code}"><span class="flag-cell">${c.flag}</span><span class="cell-main"><b>${c.name}</b><small>Espérance de vie ${fmt((c.e0.m + c.e0.f) / 2)} ans · ${nf.format(c.gdp)} $/hab.</small></span><span class="chev"></span></button>`).join("")
      || `<div class="cell"><span class="cell-main"><small>Aucun pays ne correspond.</small></span></div>`;
  };
  list("");
  $("search").addEventListener("input", e => list(e.target.value.trim()));
  [$("oddsGroup"), $("countryGroup")].forEach(g => g.addEventListener("click", e => {
    const b = e.target.closest("[data-code]"); if (b) { haptic(); countrySheet(b.dataset.code); }
  }));
}

function countrySheet(code, year = DATA_YEAR) {
  const c = countryAt(code, year);
  const years = [1900, 1950, 1980, DATA_YEAR, 2050, 2100];
  const rows = [["Chance d’y naître", `1 sur ${nf.format(birthOdds(code, "births", year))}`], ...countryFacts(c)];
  openSheet(`<div class="big-emoji ticket-badge">${c.flag}</div><h2 class="sheet-title">${c.name}</h2>
    <div class="segmented" data-name="cyear" style="margin-bottom:16px">${years.map(y => `<button data-v="${y}" class="${y === year ? "on" : ""}">${y === DATA_YEAR ? "Auj." : y}</button>`).join("")}</div>
    <div class="group">${rows.map(([k, v]) => `<div class="cell"><span class="cell-main"><b>${k}</b></span><span class="cell-value">${v}</span></div>`).join("")}</div>
    <p class="group-footer">${year === DATA_YEAR ? "Valeurs vers 2023." : `Valeurs estimées pour ${year} : des ordres de grandeur.`}</p>`, { dismissable: true });
  $("sheetBody").querySelector("[data-name=cyear]").addEventListener("click", e => {
    const b = e.target.closest("button"); if (b) { haptic(); countrySheet(code, +b.dataset.v); }
  });
}

// ---------- Feuilles ----------
let sheetOpts = {};
function openSheet(html, opts = {}) {
  sheetOpts = opts;
  $("sheetBody").innerHTML = html;
  $("sheetBody").scrollTop = 0;
  const sh = $("sheet"), bd = $("sheetBackdrop");
  sh.classList.remove("closing"); bd.classList.remove("backdrop-closing");
  sh.style.transform = "";
  const wasOpen = !sh.hidden;
  sh.hidden = false; bd.hidden = false;
  if (!wasOpen) { sh.style.animation = "none"; void sh.offsetWidth; sh.style.animation = ""; }
}
function closeSheet() {
  const sh = $("sheet"), bd = $("sheetBackdrop");
  if (sh.hidden) return;
  sh.classList.add("closing"); bd.classList.add("backdrop-closing");
  const done = sheetOpts.onClose;
  setTimeout(() => { if (sh.classList.contains("closing")) { sh.hidden = true; bd.hidden = true; sh.classList.remove("closing"); bd.classList.remove("backdrop-closing"); } }, 300);
  sheetOpts = {};
  if (done) done();
}
const sheetOpen = () => !$("sheet").hidden && !$("sheet").classList.contains("closing");
$("sheetBackdrop").addEventListener("click", () => { if (sheetOpts.dismissable) closeSheet(); });
// Glisser vers le bas pour fermer.
(function swipe() {
  let y0 = null, dy = 0;
  const sh = $("sheet");
  sh.addEventListener("touchstart", e => { if (sheetOpts.dismissable && $("sheetBody").scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  sh.addEventListener("touchmove", e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener("touchend", () => { if (y0 == null) return; y0 = null; sh.style.transform = ""; if (dy > 110) closeSheet(); });
})();

// ---------- Vies antérieures et mémorial ----------
let livesTab = "mine", livesShown = 15;
Object.entries(SORTS).forEach(([k, [label]]) => $("sortSel").add(new Option(label, k)));
$("sortSel").value = store.get("vie.sort", "recent");
$("sortSel").addEventListener("change", () => { store.set("vie.sort", $("sortSel").value); renderLives(); });
segmented("livesTab", livesTab, v => { livesTab = v; livesShown = 15; renderLives(); });

function renderLives() {
  const all = pastLives();
  const lives = sortLives(all.filter(r => livesTab === "mine" ? !r.shared : livesTab === "memorial" ? r.memorial || r.shared : r.shared), $("sortSel").value);
  $("sortLabel").textContent = SORTS[$("sortSel").value][0];
  $("livesEmpty").hidden = lives.length > 0;
  $("livesEmpty").querySelector("h3").textContent = livesTab === "mine" ? "Aucune vie pour l’instant" : livesTab === "memorial" ? "Personne au mémorial" : "Aucune vie reçue";
  $("livesEmpty").querySelector("p").textContent = livesTab === "mine" ? "Les vies que vous vivez jusqu’au bout apparaîtront ici." : livesTab === "memorial" ? "Ouvrez une vie terminée et mettez-la au mémorial : elle sera gardée, même si vous effacez les autres." : "Les vies ouvertes depuis un lien de partage apparaîtront ici.";
  $("clearGroup").hidden = !all.some(r => !r.memorial);
  $("exportBtn").hidden = !all.length;
  $("livesGroup").hidden = !lives.length;
  $("sortGroup").hidden = lives.length < 2;
  $("moreGroup").hidden = lives.length <= livesShown;
  $("livesGroup").innerHTML = lives.slice(0, livesShown).map(r => {
    const c = BY_CODE[r.s.home];
    const cause = prefs.gentle && HEAVY_CAUSES.includes(r.s.cause) ? "cause non affichée" : r.s.cause;
    const sub = livesTab === "mine" ? `${c.name} · ${ans(r.s.age)}${r.s.year ? ` · ${r.s.year}` : ""}${r.s.gen > 1 ? ` · génération ${r.s.gen}` : ""} · ${esc(cause)}` : `${c.name} · ${ans(r.s.age)} · ${r.candles || 0} bougie${(r.candles || 0) > 1 ? "s" : ""}${r.notes && r.notes.length ? ` · ${r.notes.length} mot${r.notes.length > 1 ? "s" : ""}` : ""}`;
    return `<button class="cell link" data-id="${r.id}"><span class="flag-cell">${c.flag}</span><span class="cell-main"><b>${esc(r.s.name)}${r.memorial ? ` <span class="inline-ico">${icon("death")}</span>` : ""}</b><small>${sub}</small></span><span class="cell-value">${r.shared ? "reçue" : new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span><span class="chev"></span></button>`;
  }).join("");
}
$("moreBtn").addEventListener("click", () => { livesShown += 30; haptic(); renderLives(); });
$("livesGroup").addEventListener("click", e => {
  const b = e.target.closest("[data-id]"); if (!b) return;
  const r = pastLives().find(x => x.id === +b.dataset.id); if (!r) return;
  haptic(); deathSheet(r, r.shared ? "shared-kept" : "review");
});
$("clearPast").addEventListener("click", () => {
  openSheet(`<h2 class="sheet-title">Effacer toutes les vies ?</h2><p class="group-footer" style="text-align:center;margin:-8px 0 20px">C’est définitif. Les vies du mémorial restent.</p>
    <button class="btn-filled" style="background:var(--red)" id="confirmClear">Effacer</button><button class="btn-plain" id="cancelClear">Annuler</button>`, { dismissable: true });
  $("confirmClear").onclick = () => { clearLives(); closeSheet(); renderLives(); haptic(20); toast("Vies effacées"); };
  $("cancelClear").onclick = closeSheet;
});
$("exportBtn").addEventListener("click", () => { haptic(); exportLives(); toast("Fichier enregistré"); });
$("importInput").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  try { const n = await importLives(file); renderLives(); toast(n ? `${n} vie${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}` : "Aucune nouvelle vie"); }
  catch { toast("Fichier illisible"); }
});
[$("strangerBtn"), $("strangerBtn2")].forEach(b => b.addEventListener("click", () => { haptic(12); deathSheet(strangerRecord(), "stranger"); }));

// ---------- Tirage ----------
let life = null, peers = [], running = false, speedIdx = 0, progress = 0, secPerYear = 20, lastT = 0, rendered = 0, pane = "story", wakeLock = null, feedLimit = 60;

function startDraw(confirmed = false) {
  if (!confirmed && ((life && life.alive) || loadCurrent())) {
    openSheet(`<h2 class="sheet-title">Une vie est en cours</h2><p class="group-footer" style="text-align:center;margin:-8px 0 20px">Naître à nouveau la remplace.</p>
      <button class="btn-filled" id="confirmNew">Naître quand même</button><button class="btn-plain" id="cancelNew">Annuler</button>`, { dismissable: true });
    $("confirmNew").onclick = () => { closeSheet(); setTimeout(() => startDraw(true), 320); };
    $("cancelNew").onclick = closeSheet;
    return;
  }
  clearCurrent();
  $("resumeGroup").hidden = true;
  haptic(12);
  const year = drawYear(prefs.era, prefs.year);
  life = new Life({ mode: prefs.mode, year, classroom: prefs.classroom });
  peers = Array.from({ length: 4 }, () => simulateWhole({ mode: prefs.mode, year, classroom: prefs.classroom }));
  const v = $("drawView");
  v.classList.remove("landed");
  v.hidden = false; v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
  $("drawKicker").textContent = `Tirage de votre lieu de naissance · ${year}`;
  $("pass").hidden = true; $("drawActions").hidden = true; $("passDetails").hidden = true;
  const globe = $("globe");
  globe.classList.add("spin"); globe.classList.remove("land");
  let n = 0;
  const total = 24;
  const spin = () => {
    const c = n < total ? pick(COUNTRIES) : life.country;
    $("spinFlag").textContent = c.flag;
    $("spinName").textContent = c.name;
    if (n < total) haptic(3);
    if (n++ < total) setTimeout(spin, 45 + n * n * 0.85);
    else { globe.classList.remove("spin"); globe.classList.add("land"); haptic(25); setTimeout(showPass, 700); }
  };
  spin();
}

function showPass() {
  const c = life.country;
  const pass = $("pass");
  $("passFlag").textContent = c.flag;
  $("passDate").textContent = birthDateText(life);
  $("passName").value = life.name;
  $("passSub").textContent = `${life.g("Garçon", "Fille")} · ${life.g("né", "née")} ${inCountry(c)} en ${life.year} · 1 chance sur ${nf.format(birthOdds(life.home, life.mode, life.year))}`;
  $("passGrid").innerHTML = [
    ["Espérance de vie", `${fmt(c.e0[life.sex])} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} ‰`],
    ["Revenu moyen", `${nf.format(c.gdp)} $`],
    ["École", `${fmt(c.school, 1)} ans`],
  ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("");
  const d = birthDetails(life);
  $("passFamily").textContent = d.story;
  const grp = (title, rows) => `<p class="group-header">${title}</p><div class="group">${rows.map(([k, v]) => `<div class="cell"><span class="cell-main"><b>${esc(k)}</b><small>${esc(v)}</small></span></div>`).join("")}</div>`;
  $("passDetails").innerHTML = grp("Votre famille", d.family) + grp("Votre foyer", d.home) + grp("Là où vous naissez", d.place) + grp("Ce que disent les statistiques", d.odds);
  $("passDetails").hidden = false;
  $("drawView").classList.add("landed");
  $("passCard").hidden = prefs.classroom;
  pass.hidden = false; $("drawActions").hidden = false;
}

$("bornBtn").addEventListener("click", () => startDraw());
$("passCard").addEventListener("click", () => {
  const nm = $("passName").value.trim();
  if (nm) life.name = nm;
  haptic(); shareCard("birth", life).then(r => r === "downloaded" && toast("Image enregistrée"));
});
$("cancelDraw").addEventListener("click", () => { life = null; $("drawView").hidden = true; });
$("startLife").addEventListener("click", () => {
  const nm = $("passName").value.trim();
  if (nm) life.name = nm;
  $("drawView").hidden = true;
  beginLife();
});

// ---------- Vie ----------
// Palette d’accompagnement Lifelot pour les données (voir brand/README.md).
const STATS = [["health", "Santé", "var(--mint)"], ["happy", "Bonheur", "var(--amber)"], ["know", "Savoir", "var(--sky)"], ["rel", "Liens", "var(--coral)"]];
const RING_C = 2 * Math.PI * 15;
$("rings").innerHTML = STATS.map(([k, label, color]) => `<div class="ring" style="--rc:${color}"><svg viewBox="0 0 38 38"><circle class="track" cx="19" cy="19" r="15"/><circle class="prog" id="ring-${k}" cx="19" cy="19" r="15" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/></svg><div><b id="val-${k}">0</b><small>${label}</small></div></div>`).join("");

const PRIORITY_ICON = { equilibre: "balance", sante: "health", travail: "edu", famille: "friends", plaisir: "leisure" };
$("priority").innerHTML = Object.entries(PRIORITIES).map(([k, v]) => `<button data-v="${k}">${icon(PRIORITY_ICON[k], "pi")}${v}</button>`).join("");
$("priority").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !life) return;
  life.priority = b.dataset.v; haptic(); markPriority(); saveCurrent(life);
});
const markPriority = () => document.querySelectorAll("#priority button").forEach(b => b.classList.toggle("on", b.dataset.v === life.priority));

$("lifeSeg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  haptic();
  pane = b.dataset.v;
  $("lifeSeg").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  ["story", "act", "me", "peers", "data"].forEach(p => $(`pane-${p}`).hidden = p !== pane);
  renderLife();
});

async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => wakeLock = null); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* non disponible */ }
}

function beginLife(resumed = false) {
  if (!resumed) {
    life.dur = prefs.dur;
    life.auto = prefs.auto;
    life.real = store.get("vie.real", "") || null;
    saveCurrent(life, peers);
  }
  secPerYear = +(life.dur || prefs.dur) * 60 / life.country.e0[life.sex];
  progress = 0; rendered = 0; speedIdx = 0; feedLimit = 60;
  $("autoChip").setAttribute("aria-pressed", String(life.auto));
  $("speedBtn").textContent = "×1";
  $("feed").innerHTML = "";
  $("lfName").textContent = `${life.country.flag} ${life.name}`;
  markPriority();
  $("lifeSeg").querySelector('[data-v="story"]').click();
  const v = $("lifeView");
  v.hidden = false; v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
  $("lifeScroll").scrollTop = 0;
  Music.set(prefs.music);
  renderLife();
  setRunning(true);
  lastT = 0;
  requestAnimationFrame(loop);
  if (resumed && life.queue.length) decisionSheet();
}

// Quand l'anneau de l'âge sort de l'écran, l'en-tête se resserre : âge, année et barre de l'année y restent.
new IntersectionObserver(([e]) => $("lifeView").querySelector(".life-top").classList.toggle("compact", !e.isIntersecting), { root: $("lifeScroll"), threshold: 0.15 }).observe($("lifeHero"));

function setRunning(on) {
  running = on;
  $("playIcon").innerHTML = on ? '<path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z"/>' : '<path d="M8 5v14l11-7z"/>';
  $("playBtn").setAttribute("aria-label", on ? "Pause" : "Lecture");
  keepAwake(on);
}

function loop(t) {
  if (!life || $("lifeView").hidden) { lastT = 0; return; }
  const dt = lastT ? Math.min((t - lastT) / 1000, 0.5) : 0;
  lastT = t;
  if (running && life.alive && !life.queue.length && !sheetOpen()) {
    progress += dt * SPEEDS[speedIdx] / secPerYear;
    if (progress >= 1) { progress = 0; life.step(); renderLife(); afterStep(); }
  }
  $("yearRing").style.strokeDashoffset = (326.7 * (1 - progress)).toFixed(1);
  $("topYear").style.transform = `scaleX(${progress.toFixed(4)})`;
  requestAnimationFrame(loop);
}

const pauseDue = () => prefs.pauses && PAUSE_AGES.includes(life.age) && !life.reflections.some(r => r.age === life.age);
function afterStep() {
  if (!life.alive) { haptic([30, 60, 30]); setRunning(false); clearCurrent(); setTimeout(() => deathSheet(buildRecord(life, peers), "new"), 1100); return; }
  if (life.queue.length) { haptic(15); decisionSheet(); return; }
  saveCurrent(life);
  if (pauseDue()) { haptic(10); pauseSheet(); }
}

$("playBtn").addEventListener("click", () => { haptic(); setRunning(!running); });
$("speedBtn").addEventListener("click", () => { haptic(); speedIdx = (speedIdx + 1) % SPEEDS.length; $("speedBtn").textContent = `×${SPEEDS[speedIdx]}`; });
function skip(untilDecision) {
  if (!life || !life.alive || sheetOpen()) return;
  if (life.queue.length) { decisionSheet(); return; }
  haptic();
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
$("pendingBtn").addEventListener("click", () => { haptic(); decisionSheet(); });
$("autoChip").addEventListener("click", () => {
  if (!life) return;
  life.auto = !life.auto; haptic();
  setPref("auto", life.auto); $("optAuto").checked = life.auto;
  $("autoChip").setAttribute("aria-pressed", String(life.auto));
  if (life.auto && life.queue.length) { life.autoResolveAll(); renderLife(); afterStep(); }
  toast(life.auto ? "Mode automatique : il suffit de regarder" : "Vous décidez à nouveau");
});
function quitLife() {
  haptic();
  setRunning(false);
  if (life && life.alive) saveCurrent(life);
  $("lifeView").hidden = true;
  Music.stop();
  showResume();
}
$("quitBtn").addEventListener("click", quitLife);
function showResume() {
  const cur = life && life.alive ? { life } : loadCurrent();
  $("resumeGroup").hidden = !cur;
  if (cur) $("resumeSub").textContent = `${cur.life.country.flag} ${cur.life.name}, ${ans(cur.life.age)} · ${cur.life.calYear}`;
  const paused = pausedLives().filter(p => !cur || p.id !== cur.life.born.getTime());
  $("pausedGroup").hidden = !paused.length;
  $("pausedGroup").innerHTML = `<p class="group-header">Vies en pause</p><div class="group">${paused.map(p => `<button class="cell link" data-resume-home="${p.id}"><span class="flag-cell">${p.flag}</span><span class="cell-main"><b>${esc(p.name)}</b><small>${ans(p.age)} · ${p.year}</small></span><span class="chev"></span></button>`).join("")}</div>`;
}
$("pausedGroup").addEventListener("click", e => {
  const b = e.target.closest("[data-resume-home]"); if (!b) return;
  haptic();
  if (!life || !life.alive) { const cur = loadCurrent(); if (cur) { life = cur.life; peers = cur.peers; } }
  const r = resumePaused(+b.dataset.resumeHome, life, peers);
  if (!r) { showResume(); return; }
  life = r.life; peers = r.peers;
  saveCurrent(life, peers);
  $("lifeView").hidden = true;
  beginLife(true);
});
$("resumeBtn").addEventListener("click", () => {
  if (!life || !life.alive) {
    const cur = loadCurrent();
    if (!cur) { showResume(); return; }
    life = cur.life; peers = cur.peers;
  }
  haptic();
  const v = $("lifeView");
  if (!v.hidden) return;
  beginLife(true);
});

// Menu « ⋯ »
$("menuBtn").addEventListener("click", () => {
  if (!life) return;
  haptic();
  const sw = (key, label) => `<label class="cell"><span class="cell-main"><b>${label}</b></span><input type="checkbox" class="switch" data-pref="${key}"${prefs[key] ? " checked" : ""}></label>`;
  const btn = (act, label, sub = "") => `<button class="cell link" data-act="${act}"><span class="cell-main"><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="chev"></span></button>`;
  openSheet(`<h2 class="sheet-title">${esc(life.name)}, ${ans(life.age)}</h2>
    <div class="group menu-list">${btn("family", "Famille et vie")}${btn("money", "Dépenser et investir")}${btn("politics", "Politique", life.politics ? "" : "Ouvert à tous, quel que soit le métier")}${btn("nextdec", "Aller à la prochaine décision")}</div>
    <div class="group menu-list">${sw("music", "Musique douce")}${sw("pauses", "Pauses de réflexion")}${sw("gentle", "Pas de scènes effrayantes")}</div>
    <div class="group menu-list">${prefs.classroom ? "" : btn("birthcard", "Carte de naissance", "Une image à partager")}${btn("help", "Besoin d’aide")}${btn("quit", "Quitter", "La vie est gardée : vous pourrez la reprendre")}</div>`, { dismissable: true });
});
$("sheetBody").addEventListener("change", e => {
  const key = e.target.dataset.pref; if (!key) return;
  setPref(key, e.target.checked); haptic();
  const opt = { music: "optMusic", pauses: "optPauses", gentle: "optGentle" }[key];
  if (opt) $(opt).checked = e.target.checked;
  if (key === "music") Music.set(prefs.music && !$("lifeView").hidden);
  if (key === "gentle" && life) { rendered = 0; $("feed").innerHTML = ""; renderLife(); }
});
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || !life) return;
  const act = b.dataset.act;
  haptic();
  if (act === "family" || act === "money" || act === "politics") panelSheet(act);
  if (act === "nextdec") { closeSheet(); setTimeout(() => skip(true), 320); }
  if (act === "birthcard") shareCard("birth", life).then(r => r === "downloaded" && toast("Image enregistrée"));
  if (act === "help") helpSheet();
  if (act === "quit") { closeSheet(); quitLife(); }
});
function helpSheet() {
  openSheet(`<h2 class="sheet-title">Besoin d’aide</h2><p class="help-note" style="margin-top:0">${HELP_HTML}</p>`, { dismissable: true });
}

const KIND_ICON = { birth: "birth", edu: "edu", work: "work", family: "family", move: "move", death: "death", history: "ticket", money: "money", health: "health", life: "home", culture: "leisure" };

function renderLife() {
  const L = life, c = L.here;
  $("lfAge").textContent = L.age;
  $("lfAgeUnit").textContent = `${L.age > 1 ? "ans" : "an"} · ${L.calYear}`;
  $("lfMini").textContent = `${L.age} ${L.age > 1 ? "ans" : "an"} · ${L.calYear}`;
  $("lfCountry").textContent = L.emigrated ? `vit ${inCountry(c)} · ${L.g("né", "née")} ${inCountry(BY_CODE[L.home])}` : `${inCountry(c).replace(/^./, m => m.toUpperCase())}`;
  $("pendingBtn").hidden = !(L.alive && L.queue.length && !sheetOpen());
  $("autoChip").setAttribute("aria-pressed", String(L.auto));
  STATS.forEach(([k]) => {
    const v = Math.round(L.stats[k]);
    $(`ring-${k}`).style.strokeDashoffset = (RING_C * (1 - v / 100)).toFixed(2);
    $(`val-${k}`).textContent = v;
  });
  const h = L.stats.happy / 100;
  $("lifeHero").style.setProperty("--glow", (0.15 + h * 0.6).toFixed(2));

  renderDash();
  renderFeed();
  if (pane === "act") renderActions();
  if (pane === "me") renderSituation();
  if (pane === "peers") renderPeers();
  if (pane === "data") renderData();
}

// Récit : touchez ☆ pour garder un moment.
function feedItem(e, i) {
  const hidden = e.heavy && prefs.gentle && !e.revealed;
  const li = document.createElement("li");
  li.className = `${e.kind} ${e.hl ? "hl" : ""}`;
  li.dataset.i = i;
  li.innerHTML = `<span class="dot">${icon(KIND_ICON[e.kind] || "dot")}</span><div class="body"><small>${ans(e.age)}${e.year ? ` <span class="yr">· ${e.year}</span>` : ""}</small><p>${hidden ? `<button class="reveal" data-reveal="${i}">Un moment difficile · le lire</button>` : esc(e.text)}</p>${e.heavy ? `<a href="#" class="helpline" data-help>Besoin d’en parler ? Numéros d’aide</a>` : ""}</div><button class="star" data-star="${i}" aria-pressed="${!!e.star}" aria-label="Garder ce moment">${e.star ? "★" : "☆"}</button>`;
  return li;
}
function renderFeed() {
  const L = life, feed = $("feed");
  if (rendered === 0) {
    feed.innerHTML = "";
    const start = Math.max(0, L.log.length - feedLimit);
    for (let i = start; i < L.log.length; i++) feed.prepend(feedItem(L.log[i], i));
    if (start > 0) { const more = document.createElement("li"); more.className = "older"; more.innerHTML = `<button class="btn-plain" data-older>Afficher les moments plus anciens</button>`; feed.append(more); }
    rendered = L.log.length;
    return;
  }
  for (; rendered < L.log.length; rendered++) feed.prepend(feedItem(L.log[rendered], rendered));
}
$("feed").addEventListener("click", e => {
  const star = e.target.closest("[data-star]"), rev = e.target.closest("[data-reveal]"), help = e.target.closest("[data-help]"), older = e.target.closest("[data-older]");
  if (star) { const en = life.log[+star.dataset.star]; en.star = !en.star; haptic(); star.textContent = en.star ? "★" : "☆"; star.setAttribute("aria-pressed", String(en.star)); saveCurrent(life); if (en.star) toast("Moment gardé"); }
  if (rev) { const i = +rev.dataset.reveal; life.log[i].revealed = true; rev.closest("li").replaceWith(feedItem(life.log[i], i)); }
  if (help) { e.preventDefault(); helpSheet(); }
  if (older) { feedLimit += 100; rendered = 0; renderFeed(); }
});

const rowsHtml = rows => rows.map(([k, v, sub]) => `<div class="cell"><span class="cell-main"><b>${k}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="cell-value">${esc(v)}</span></div>`).join("");
function renderSituation() {
  const L = life;
  const rows = [
    ["home", "Famille d’origine", L.familyLabel()],
    ["edu", "Études", L.schooling ? `en cours · ${eduText(L)}` : eduText(L)],
    ["work", "Travail", L.retired ? "à la retraite" : L.job || (L.homemaker ? "au foyer" : L.age < 6 ? "—" : "sans emploi")],
    ...(L.passion ? [["leisure", "Passion", L.passionLabel()]] : []),
    ["home", "Lieu de vie", L.urban ? "en ville" : "à la campagne"],
  ];
  if (L.lineage) rows.push(["family", "Lignée", `génération ${L.lineage.gen}`]);
  if (L.smoker) rows.push(["health", "Tabac", L.g("fumeur", "fumeuse")]);
  if (L.hivPos) rows.push(["health", "VIH", L.hivTreated() ? "sous traitement" : "sans traitement"]);
  $("situation").innerHTML = rows.map(([i, k, v, sub]) => `<div class="cell"><span class="row-icon">${icon(i)}</span><span class="cell-main"><b>${k}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="cell-value">${esc(v)}</span></div>`).join("");
  $("moneyMini").innerHTML = rowsHtml([
    ["Revenu", L.income > 0 ? `${dollars(L.income)}/an` : "aucun", L.income > 0 ? `≈ ${euroMonth(L.income)} par mois en prix français` : ""],
    ["Épargne", dollars(L.savings)],
    ...(L.house ? [["Logement", dollars(L.house.value), L.house.loan > 0 ? `emprunt : ${dollars(L.house.loan)}` : ""]] : []),
    ["Dettes", L.debt > 0 ? dollars(L.debt) : "aucune"],
    ["Patrimoine", dollars(L.netWorth()), `plus riche que ${Math.round(L.wealthPct() * 100)} % du pays`],
  ]);
  $("polMini").innerHTML = rowsHtml(polMiniRows(L));
  const living = L.children.filter(k => k.alive).length;
  $("familyMini").innerHTML = rowsHtml([
    ["Parents", L.parents.map(p => `${p.name}${p.alive ? "" : " †"}`).join(" et ")],
    ["Couple", L.married ? `${L.g("marié", "mariée")} à ${L.partner}` : L.marriedEver ? L.g("seul", "seule") : "célibataire"],
    ["Enfants", L.children.length ? (living === L.children.length ? String(living) : `${living} sur ${L.children.length}`) : "aucun"],
    ["Frères et sœurs", L.siblings ? String(L.siblings) : "aucun"],
  ]);
}

// ---------- Feuilles Famille et Argent ----------
function panelSheet(kind) {
  const L = life;
  const choice = (name, obj, cur) => `<div class="group">${Object.entries(obj).map(([k, o]) => `<button class="cell link choice-cell" data-choice="${name}" data-v="${k}"><span class="tick">${k === cur ? "✓" : ""}</span><span class="cell-main"><b>${typeof o === "string" ? o : o.label}</b>${o.note ? `<small>${o.note}</small>` : ""}</span></button>`).join("")}</div>`;
  if (kind === "politics") {
    openSheet(`<h2 class="sheet-title">Politique</h2>${L.alive ? politicsHtml(L, true) : ""}`, { dismissable: true, onClose: renderLife });
  } else if (kind === "family") {
    openSheet(`<h2 class="sheet-title">Famille et vie</h2>
      <div class="group">${rowsHtml(familyRows(L))}</div>
      <p class="group-header">Des enfants ?</p>${choice("kids", KIDS_PLAN, L.wantKids)}
      <p class="group-footer">Là où la contraception est rare, ne pas vouloir d’enfants ne suffit pas toujours.</p>
      <div class="btn-row" style="margin-top:20px">
        <button class="btn-gray" data-do="visit" ${L.visitedAt === L.age ? "disabled" : ""}>Voir la famille</button>
        <button class="btn-gray" data-do="help" ${L.helpedAt === L.age || L.savings < 1 ? "disabled" : ""}>Aider financièrement</button>
      </div>
      <p class="group-footer">Une fois par an. Les liens comptent pour le mariage, les enfants et la solitude du grand âge.</p>
      ${descendantsHtml(L)}`, { dismissable: true, onClose: renderLife });
    $("sheetBody").querySelectorAll("[data-play],[data-resume]").forEach(b => b.addEventListener("click", () => {
      const play = b.dataset.play != null, kid = play && L.children[+b.dataset.play];
      if (play && !confirm(`Jouer la vie de ${kid.name} ? La vie de ${L.name} est mise en pause : vous pourrez la reprendre.${(g => g.net > 0 ? ` ${kid.name} recevra tout de suite ≈ ${eur(g.net)} de votre patrimoine.` : "")(donationFor(L, kid))}`)) return;
      haptic(15);
      setRunning(false);
      const r = play ? playDescendant(L, peers, +b.dataset.play, prefs.classroom) : resumePaused(+b.dataset.resume, L, peers);
      if (!r) return;
      life = r.life; peers = r.peers;
      closeSheet();
      setTimeout(() => { if (play) beginLife(); else { saveCurrent(life, peers); beginLife(true); } toast(play ? `Vous jouez désormais ${life.name}` : `Retour à la vie de ${life.name}`); }, 320);
    }));
  } else {
    const d = L.houseDeal(), port = portfolioRows(L), alloc = L.validAlloc(), budget = budgetRows(L);
    openSheet(`<h2 class="sheet-title">Dépenser et investir</h2>
      <div class="group">${rowsHtml(moneyRows(L).map(([k, v]) => [k, v.split(" · ")[0], v.split(" · ")[1]]))}</div>
      ${L.age < 16 && !L.job ? `<p class="group-footer">Encore enfant : ces choix compteront dès le premier revenu.</p>` : ""}
      ${budget.length ? `<p class="group-header">Budget de l’année</p><div class="group">${rowsHtml(budget)}</div>` : ""}
      ${L.alive && L.passion ? careerHtml(L) : ""}
      ${L.alive ? politicsHtml(L) : ""}
      ${L.alive && L.business ? businessHtml(L) : ""}
      ${L.alive && L.age >= 6 ? spendHtml(L) : ""}
      <p class="group-header">Train de vie</p>${choice("spend", SPEND, L.spend)}
      <p class="group-header">Placements · répartition visée</p>
      <div class="group">${port.map(r => `<div class="cell column"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-weight:600">${r.label}</b><span style="color:var(--label-2)">${dollars(r.value)}</span></div><small style="color:var(--label-2);font-size:13px">${r.available ? r.note : "Plus accessible : vendu au prochain rééquilibrage."}</small>${r.available ? `<div class="slider-row"><input type="range" min="0" max="100" step="5" value="${r.target}" data-asset="${r.id}"><output>${Math.round(alloc[r.id] || 0)} %</output></div>` : ""}</div>`).join("")}</div>
      <p class="group-footer">${L.bank ? "Rééquilibré chaque année. Rendements réels (après inflation) ; krachs et hyperinflations suivent l’histoire." : "Sans compte en banque : liquide, or, bétail ou tontine seulement. Ouvrez un compte depuis « Agir »."}</p>
      <p class="group-header">Logement</p>
      <div class="group"><div class="cell column"><span>${L.house ? `${L.house.built ? "Maison construite soi-même" : "Propriétaire"} : ${dollars(L.house.value)}${L.house.loan > 0 ? `, reste ${dollars(L.house.loan)} (${dollars(L.house.payment)} par an, taux réel ${fmt(L.house.rate * 100, 1)} %)` : ""}.` : `Un logement ${L.urban ? "en ville" : "à la campagne"} : environ ${dollars(d.price)}. ${d.canBorrow ? `Apport ${dollars(d.down)}, emprunt ${dollars(d.loan)} sur 25 ans à ${fmt(d.rate * 100, 1)} %, soit ${dollars(d.payment)} par an.` : "Pas de crédit accessible : il faut payer comptant."} ${d.why}`}</span></div></div>
      <div class="btn-row" style="margin-top:14px">
        ${L.house ? `<button class="btn-gray" data-do="sell">Vendre le logement</button>` : `<button class="btn-gray" data-do="buy" ${d.ok ? "" : "disabled"}>Acheter</button>`}
        <button class="btn-gray" data-do="repay" ${(L.debt > 0 || (L.house && L.house.loan > 0)) && L.savings > 0 ? "" : "disabled"}>Rembourser</button>
      </div>
      <p class="group-footer">Dollars PPA à prix constants. Les dettes pèsent sur le bonheur et la santé.</p>`, { dismissable: true, onClose: renderLife });
    $("sheetBody").querySelectorAll("[data-asset]").forEach(i => i.addEventListener("input", () => {
      L.alloc[i.dataset.asset] = +i.value;
      L.rebalance();
      const al = L.validAlloc();
      $("sheetBody").querySelectorAll("[data-asset]").forEach(x => x.nextElementSibling.textContent = `${Math.round(al[x.dataset.asset] || 0)} %`);
      saveCurrent(L);
    }));
  }
  // Dépenses, mode de vie, « sans demander » (spending.js).
  $("sheetBody").querySelectorAll(".sp").forEach(sp => sp.addEventListener("click", e => {
    const msg = spendClick(L, e.target);
    if (!msg) return;
    haptic(12); saveCurrent(L); toast(msg);
    if (L.queue.length) { closeSheet(); setTimeout(decisionSheet, 320); return; }
    const scroller = [$("sheetBody"), $("sheetBody").parentElement].find(x => x && x.scrollTop > 0) || $("sheetBody");
    const open = [...$("sheetBody").querySelectorAll("details")].map(d => d.open), top = scroller.scrollTop;
    panelSheet(kind);
    $("sheetBody").querySelectorAll("details").forEach((d, i) => { if (open[i]) d.open = true; });
    scroller.scrollTop = top;
  }));
  $("sheetBody").querySelectorAll("[data-choice]").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.v, name = b.dataset.choice;
    if (name === "kids") L.wantKids = v;
    if (name === "spend") L.spend = v;
    haptic(); saveCurrent(L); panelSheet(kind);
  }));
  $("sheetBody").querySelectorAll("[data-do]").forEach(b => b.addEventListener("click", () => {
    const act = b.dataset.do;
    const ok = act === "visit" ? L.visitFamily() : act === "help" ? L.helpFamily() : act === "buy" ? L.buyHouse() : act === "sell" ? L.sellHouse() : L.repayDebt();
    if (ok) { haptic(15); L.snapshot(); saveCurrent(L); toast({ visit: "Du temps avec les siens", help: "Famille aidée", buy: "Logement acheté", sell: "Logement vendu", repay: "Dettes remboursées" }[act]); }
    panelSheet(kind);
  }));
}

// ---------- Tableau de bord ----------
function renderDash() {
  const d = dashboardData(life);
  $("dash").innerHTML = `<div class="dash-money">${d.money.map(m => `<button class="tile ${m.tone || ""}" data-dash="money"><small>${m.label}</small><b>${esc(m.value)}</b>${m.sub ? `<span>${esc(m.sub)}</span>` : ""}</button>`).join("")}</div>
    <div class="dash-status">${d.status.map(s => `<div class="stat-card"><small>${icon(s.icon)}${s.label}</small><b>${esc(s.value)}</b></div>`).join("")}</div>
    ${d.todo.length ? `<div class="dash-todo">${d.todo.map(t => `<div class="todo ${t.tone}"><span>${esc(t.text)}</span>${t.act ? `<button data-dash="${t.act}">${t.btn}</button>` : ""}</div>`).join("")}</div>` : ""}`;
}
$("dash").addEventListener("click", e => {
  const b = e.target.closest("[data-dash]"); if (!b || !life) return;
  haptic();
  const a = b.dataset.dash;
  if (a === "decision") decisionSheet();
  if (a === "money") panelSheet("money");
  if (a === "agir") { $("lifeSeg").querySelector('[data-v="act"]').click(); $("lifeSeg").scrollIntoView({ behavior: "smooth", block: "start" }); }
});

// ---------- Agir ----------
let actCat = "pro";
segmented("actcat", actCat, v => { actCat = v; renderActions(); });
function renderActions() {
  const L = life;
  const acts = L.alive ? L.availableActions().filter(a => a.cat === actCat) : [];
  $("actLeft").textContent = `Agir cette année · ${L.actionsLeft} action${L.actionsLeft > 1 ? "s" : ""} sur ${ACTIONS_PER_YEAR}`;
  $("actList").innerHTML = acts.filter(a => a.ok).map(a => `<button class="cell link" data-act-id="${a.id}"><span class="cell-main"><b>${esc(a.label)}</b><small>${esc(a.desc)}</small></span><span class="chev"></span></button>`).join("")
    || `<div class="cell"><span class="cell-main"><small>${L.actionsLeft ? "Rien de possible pour l’instant." : "Plus d’actions cette année : laissez passer le temps."}</small></span></div>`;
  $("actOff").innerHTML = acts.filter(a => !a.ok).map(a => `<div class="cell"><span class="cell-main"><b style="color:var(--label-2)">${esc(a.label)}</b><small>${esc(a.why)}</small></span></div>`).join("") || `<div class="cell"><span class="cell-main"><small>Tout est possible.</small></span></div>`;
}
$("actList").addEventListener("click", e => {
  const b = e.target.closest("[data-act-id]"); if (!b || !life) return;
  const a = life.availableActions().find(x => x.id === b.dataset.actId);
  if (!a || !a.ok) return;
  haptic();
  if (!a.hasChoices) return runAction(a.id);
  const list = life.actionChoices(a.id);
  openSheet(`<h2 class="sheet-title">${esc(a.label)}</h2><p class="group-footer" style="margin:-8px 4px 16px;text-align:center">${esc(a.desc)}</p>
    <div class="group">${list.map(o => `<button class="cell link" data-choice-id="${esc(o.id)}" ${o.disabled ? "disabled" : ""}><span class="cell-main"><b>${esc(o.label)}</b><small>${esc(o.sub)}</small></span><span class="chev"></span></button>`).join("") || `<div class="cell"><span class="cell-main"><small>Rien à proposer pour l’instant.</small></span></div>`}</div>`, { dismissable: true });
  $("sheetBody").querySelectorAll("[data-choice-id]").forEach(c => c.addEventListener("click", () => { closeSheet(); setTimeout(() => runAction(a.id, c.dataset.choiceId), 320); }));
});
function runAction(id, arg) {
  const res = life.doAction(id, arg);
  if (res) { haptic(12); toast(res); }
  saveCurrent(life);
  renderLife();
  if (life.alive && life.queue.length) decisionSheet();
}

function renderPeers() {
  $("peers").innerHTML = peers.map(p => {
    const dead = !p.alive && p.age <= life.age, c = BY_CODE[p.home];
    return `<div class="cell peer ${dead ? "dead" : ""}"><span class="flag-cell">${c.flag}</span><span class="cell-main"><b>${esc(p.name)}${dead ? " †" : ""}</b><small>${c.name} · ${esc(peerStatus(p, life.age))}</small></span></div>`;
  }).join("");
}

// Grille de vie aux couleurs Lifelot : plus l’année est heureuse, plus la case est corail.
function happyColor(v) { return `color-mix(in srgb, var(--coral) ${Math.round(25 + v * 0.75)}%, #BDBAC6)`; }
function renderGrid(node, history, nowAge, ended) {
  const last = history.length - 1, cells = Math.max(100, Math.ceil((last + 1) / 10) * 10);
  let html = "";
  for (let i = 0; i < cells; i++) {
    const h = history[i];
    html += `<i class="${i === nowAge ? "now" : ""} ${ended && i === last ? "end" : ""}"${h ? ` style="background:${happyColor(h.happy)}"` : ""}></i>`;
  }
  node.innerHTML = html;
}
function renderData() {
  const L = life, c = L.here;
  const evs = activeEvents(L.code, L.calYear);
  $("worldHeader").textContent = `Le monde autour · ${L.calYear}`;
  $("world").innerHTML = (evs.length ? evs.map(x => `<div class="cell"><span class="cell-main"><b class="world-ev">${esc(capFirst(x.ev.name))}</b><small>${x.from}–${x.to > NOW_YEAR ? "…" : x.to}</small></span></div>`).join("") : `<div class="cell"><span class="cell-main"><b>Ni guerre ni grande crise cette année</b></span></div>`)
    + `<div class="cell"><span class="cell-main"><small>${c.flag} ${c.name} · espérance de vie ${fmt((c.e0.m + c.e0.f) / 2)} ans · revenu moyen ${nf.format(c.gdp)} $ · ${fmt(c.tfr, 1)} enfants par femme</small></span></div>`;
  renderGrid($("grid100"), L.history, L.alive ? L.age : -1, !L.alive);
  const lx = cohortLx(L.home, L.sex, L.year);
  const X = a => 34 + a * 2.6, Y = v => 128 - v * 116;
  const pts = lx.slice(0, 101).map((v, a) => `${X(a).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const a = Math.min(L.age, 100);
  $("survival").innerHTML = `<line class="axis" x1="34" y1="128" x2="294" y2="128"/>
    <text class="lbl" x="30" y="16" text-anchor="end">100 %</text><text class="lbl" x="30" y="131" text-anchor="end">0</text>
    ${[0, 25, 50, 75, 100].map(t => `<text class="lbl" x="${X(t)}" y="144" text-anchor="middle">${t}</text>`).join("")}
    <polygon class="area" points="${X(0)},128 ${pts} ${X(100)},128"/><polyline class="curve" points="${pts}"/>
    <circle class="marker" cx="${X(a)}" cy="${Y(lx[a])}" r="6"/>`;
  $("survivalNote").textContent = `${fmt(lx[a] * 100, 0)} % des ${L.g("garçons", "filles")} ${L.g("nés", "nées")} ${inCountry(BY_CODE[L.home])} en ${L.year} sont encore en vie à ${ans(a)} (hors guerres et catastrophes).`;
  $("compareWrap").hidden = !L.real;
  if (L.real) $("compare").innerHTML = compareCells(L.country, BY_CODE[L.real], L.sex);
}

function compareCells(a, b, sex) {
  return `<div class="cell"><div class="cmp-row cmp-head" style="flex:1"><b></b><span>${a.flag} ${a.year ?? ""}</span><span>${b.flag} Vous</span></div></div>` +
    compareRows(a, b, sex).map(r => `<div class="cell"><div class="cmp-row" style="flex:1"><b style="font-weight:400">${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span></div></div>`).join("");
}

// ---------- Décisions et pauses ----------
function decisionSheet() {
  const d = life.queue[0];
  if (!d) return;
  openSheet(`<p class="sheet-kicker">Une décision · ${ans(life.age)} · ${life.calYear}</p><h2 class="sheet-title">${esc(d.text)}</h2>
    ${d.options.map((o, i) => `<button class="${i === 0 ? "btn-filled" : "btn-gray"}${o.sub ? " has-sub" : ""}" data-i="${i}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</button>`).join("")}
    <button class="btn-plain" id="decLater">Plus tard</button>`, { onClose: renderLife });
  $("pendingBtn").hidden = true;
  $("sheetBody").querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => {
    haptic(12);
    life.resolve(+b.dataset.i);
    closeSheet();
    setTimeout(() => { if (life.queue.length) decisionSheet(); else { saveCurrent(life); if (pauseDue()) pauseSheet(); } }, 320);
  }));
  $("decLater").addEventListener("click", () => { haptic(); closeSheet(); toast("Le temps reste arrêté jusqu’à votre décision"); });
}

function pauseSheet() {
  const q = PAUSE_QUESTIONS[life.age](life);
  openSheet(`<p class="sheet-kicker">Une pause · ${ans(life.age)}</p><h2 class="sheet-title">${esc(q)}</h2>
    <textarea id="pauseInput" rows="3" placeholder="Une ligne, si vous voulez…"></textarea>
    <button class="btn-filled" id="pauseGo">Continuer</button>`);
  $("pauseGo").addEventListener("click", () => {
    life.reflections.push({ age: life.age, q, a: $("pauseInput").value.trim() });
    haptic(); closeSheet(); saveCurrent(life);
  });
}

// ---------- Décès, mémorial ----------
// mode : "new", "review", "stranger", "shared" (reçue par lien), "shared-kept".
function deathSheet(rec, mode) {
  const s = rec.s, c = BY_CODE[s.home];
  const g = (m, f) => s.sex === "m" ? m : f;
  const own = mode === "new" || mode === "review";
  const lost = s.children - s.childrenAlive;
  const kids = s.children ? `${s.children}${lost ? ` (${lost} mort${lost > 1 ? "s" : ""} en bas âge)` : ""}` : "aucun";
  const hideCause = prefs.gentle && HEAVY_CAUSES.includes(s.cause);
  const facts = [["Cause", hideCause ? "non affichée" : s.cause], ["Études", s.eduText || EDU_LABEL[s.edu]], ["Travail", s.job || "aucun"], ...(s.passion ? [["Passion", s.passion]] : []), ["Mariage", s.marriedEver ? "oui" : "non"], ["Enfants", kids]];
  if (s.grandkids) facts.push(["Petits-enfants", String(s.grandkids)]);
  if (s.business) facts.push(["Entreprise", s.business]);
  const dyn = rec.dyn, heirs = own && dyn && dyn.heirs ? dyn.heirs : [];
  if (dyn && (dyn.gen > 1 || dyn.ancestors.length)) facts.push(["Lignée", `génération ${dyn.gen}`]);
  if (s.income > 0) facts.splice(3, 0, ["Dernier revenu", `${dollars(s.income)}/an`]);
  if (s.wealth != null) facts.splice(4, 0, ["Patrimoine", s.wealth >= 0 ? `${dollars(s.wealth)}${s.house ? " + logement" : ""}` : `dettes : ${dollars(-s.wealth)}`]);
  const refl = own ? (rec.reflections || []).filter(r => r.a) : [];
  const stars = rec.starred || [];
  const hl = rec.highlights.filter(h => !(prefs.gentle && h.heavy));
  const memorialShown = rec.memorial || mode.startsWith("shared");
  const n = rec.candles || 0;
  const kicker = mode === "stranger" ? "Une vie au hasard" : mode.startsWith("shared") ? "Une vie partagée" : `Acte de décès · ${new Date(rec.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}`;

  openSheet(`
    <div class="memorial ticket">
      <div class="candle"></div>
      <h2>${esc(s.name)}</h2>
      <p class="years">${c.flag} ${g("Né", "Née")} ${inCountry(c)}${s.year ? ` en ${s.year}` : ""} · ${s.age === 0 ? "moins d’un an" : ans(s.age)}${s.emigrated ? ` · ${g("mort", "morte")} ${inCountry(BY_CODE[s.code])}` : ""}</p>
      <p>${vsLifeExpectancy(s)}</p>
      <div class="grid100" id="memGrid"></div>
      ${memorialShown ? `<p class="candles" style="color:#fff;opacity:.85">${n ? `${n} bougie${n > 1 ? "s" : ""} allumée${n > 1 ? "s" : ""}` : "Aucune bougie pour l’instant"}</p>` : ""}
    </div>
    ${memorialShown ? `<div class="btn-row"><button class="btn-tinted" id="candleBtn">Allumer une bougie</button><button class="btn-gray" id="noteFocus">Laisser un mot</button></div>
      ${(rec.notes || []).length ? `<div class="group" style="margin-top:12px">${rec.notes.map(x => `<div class="cell column"><span>${esc(x.text)}</span><small style="color:var(--label-2)">${new Date(x.date).toLocaleDateString("fr-FR")}</small></div>`).join("")}</div>` : ""}
      <div class="note-input"><input id="noteInput" maxlength="300" placeholder="Un mot pour ${esc(s.name)}…"><button id="noteBtn">Laisser</button></div>` : ""}
    <p class="group-header">${kicker}</p>
    <div class="group">${facts.map(([k, v]) => `<div class="cell"><span class="cell-main"><b>${k}</b></span><span class="cell-value">${esc(v)}</span></div>`).join("")}</div>
    ${stars.length ? `<p class="group-header">Moments que vous avez gardés</p><div class="group">${stars.map(h => `<div class="cell"><span class="cell-value" style="min-width:52px;max-width:none">${ans(h.age)}</span><span class="cell-main"><b>★ ${esc(h.text)}</b></span></div>`).join("")}</div>` : ""}
    <p class="group-header">Moments marquants</p>
    <div class="group">${(hl.slice(-10).map(h => `<div class="cell"><span class="cell-value" style="min-width:52px;max-width:none">${ans(h.age)}</span><span class="cell-main"><b>${esc(h.text)}</b>${h.year ? `<small>${h.year}</small>` : ""}</span></div>`).join("")) || `<div class="cell"><span class="cell-main"><small>Une vie trop courte pour laisser des souvenirs écrits.</small></span></div>`}</div>
    <p class="group-header">Les quatre autres bébés</p>
    <div class="group">${rec.peers.map(p => { const pc = BY_CODE[p.home]; const pg = (m, f) => p.sex === "m" ? m : f; return `<div class="cell"><span class="flag-cell">${pc.flag}</span><span class="cell-main"><b>${esc(p.name)}, ${pc.name}</b><small>${pg("Mort", "Morte")} à ${ans(p.age)} · ${esc(prefs.gentle && HEAVY_CAUSES.includes(p.cause) ? "cause non affichée" : p.cause)} · ${EDU_LABEL[p.edu]}${p.children ? ` · ${p.children} enfant${p.children > 1 ? "s" : ""}` : ""}${p.emigrated ? ` · ${inCountry(BY_CODE[p.code])}` : ""}</small></span></div>`; }).join("")}</div>
    ${rec.real && own ? `<p class="group-header">Cette vie et la vôtre</p><div class="group">${compareCells(countryAt(s.home, s.year ?? DATA_YEAR), BY_CODE[rec.real], s.sex)}</div>` : ""}
    ${dyn && dyn.ancestors.length ? `<p class="group-header">Lignée</p><div class="group">${[...dyn.ancestors, { name: s.name, home: s.home, year: s.year, age: s.age }].map((a, i) => `<div class="cell"><span class="flag-cell">${BY_CODE[a.home].flag}</span><span class="cell-main"><b>${esc(a.name)}</b><small>Génération ${i + 1} · ${a.year} · ${ans(a.age)}</small></span></div>`).join("")}</div>` : ""}
    ${refl.length ? `<p class="group-header">Vos pauses</p><div class="group">${refl.map(r => `<div class="cell column"><small style="color:var(--label-2);font-size:13px">${esc(r.q)}</small><span>${esc(r.a)}</span></div>`).join("")}</div>` : ""}
    ${own ? `<p class="group-header">Quelques mots pour ${esc(s.name)}</p>
    <textarea id="lastWords" rows="2" placeholder="Ce que vous auriez voulu lui dire…" ${mode === "review" && rec.message ? "readonly" : ""}>${esc(rec.message || "")}</textarea>` : ""}
    ${isHeavy(rec) ? `<p class="help-note">${HELP_HTML}</p>` : ""}
    <div style="margin-top:20px">
      ${heirs.length ? `<button class="btn-filled" id="lineageBtn">${heirs.length === 1 ? `Continuer avec ${esc(heirs[0].name)}` : "Continuer la lignée"}</button>` : ""}
      ${mode === "new" ? `<button class="${heirs.length ? "btn-gray" : "btn-filled"}" id="againBtn">Une autre vie</button>` : ""}
      ${mode === "stranger" ? `<button class="btn-filled" id="keepBtn">Garder dans mes vies</button>` : ""}
      ${mode === "shared" ? `<button class="btn-filled" id="keepBtn">Garder au mémorial</button>` : ""}
      ${own ? `<button class="btn-gray" id="memorialBtn">${rec.memorial ? "Retirer du mémorial" : "Mettre au mémorial"}</button>` : ""}
      ${prefs.classroom ? "" : `<div class="btn-row"><button class="btn-gray" id="cardBtn">Carte à partager</button>${mode.startsWith("shared") ? "" : `<button class="btn-gray" id="linkBtn">Lien de partage</button>`}</div>`}
      ${mode === "review" || mode === "shared-kept" ? `<button class="btn-plain" id="deleteBtn" style="color:var(--red)">Supprimer cette vie</button>` : ""}
      <button class="btn-plain" id="doneBtn">${mode === "new" ? "Terminer" : "Fermer"}</button>
    </div>`, { dismissable: mode !== "new" });
  renderGrid($("memGrid"), rec.history, -1, true);
  if (mode === "new" && !saveRecord(rec)) toast("Stockage plein : supprimez ou transférez des vies");
  const known = () => pastLives().some(r => r.id === rec.id);
  const keepWords = () => { const w = $("lastWords"); if (w && !w.readOnly && w.value.trim() !== (rec.message || "")) { rec.message = w.value.trim(); if (known()) saveRecord(rec); } };
  const reopen = () => { keepWords(); deathSheet(rec, mode); };
  const on = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  on("candleBtn", () => { haptic(15); rec.candles = (rec.candles || 0) + 1; if (known()) saveRecord(rec); reopen(); });
  on("noteFocus", () => $("noteInput").focus());
  on("noteBtn", () => { const t = $("noteInput").value.trim(); if (!t) return; rec.notes = [...(rec.notes || []), { text: t, date: new Date().toISOString() }]; if (known()) saveRecord(rec); haptic(); reopen(); });
  on("memorialBtn", () => { keepWords(); rec.memorial = !rec.memorial; saveRecord(rec); haptic(15); toast(rec.memorial ? "Au mémorial" : "Retirée du mémorial"); deathSheet(rec, mode); });
  on("keepBtn", () => {
    if (mode === "shared") { rec.memorial = true; rec.shared = true; }
    else { rec.id = Date.now(); rec.date = new Date().toISOString(); delete rec.stranger; }
    saveRecord(rec); haptic(15); toast("Vie gardée");
    deathSheet(rec, mode === "shared" ? "shared-kept" : "review");
  });
  on("lineageBtn", () => { keepWords(); heirSheet(rec, mode); });
  on("cardBtn", () => shareCard("death", rec).then(r => r === "downloaded" && toast("Image enregistrée")));
  on("linkBtn", async () => { const r = await shareLink(rec); if (r === "copied") toast("Lien copié (sans vos réponses ni vos mots)"); });
  on("deleteBtn", () => { deleteRecord(rec.id); closeSheet(); renderLives(); toast("Vie supprimée"); });
  const finish = () => {
    keepWords();
    closeSheet(); life = null; keepAwake(false); Music.stop();
    $("lifeView").hidden = true; $("resumeGroup").hidden = true;
    renderLives();
  };
  if (mode === "new") {
    on("againBtn", () => { finish(); setTimeout(() => startDraw(true), 320); });
    on("doneBtn", () => { finish(); toast("Vie gardée dans l’onglet Vies"); });
  } else {
    sheetOpts.onClose = () => { keepWords(); renderLives(); if (location.hash.startsWith("#vie=")) history.replaceState(null, "", location.pathname + location.search); };
    on("doneBtn", closeSheet);
  }
}

// ---------- Descendance ----------
function heirSheet(rec, mode, heir = rec.dyn.heirs[0].name, will = null, start = "now") {
  const d = rec.dyn, wo = heirWillOptions(d);
  will = will || wo.sel;
  const opts = lineageFor(rec, heir, will);
  openSheet(`<h2 class="sheet-title">Continuer la lignée</h2>
    <p class="group-footer" style="margin:-8px 4px 16px;text-align:center">${esc(rec.s.name)} laisse ${dollars(d.estate)}. Continuez avec l’enfant choisi, là où en est sa vie ou depuis sa naissance.</p>
    <p class="group-header">Avec quel enfant ?</p>
    <div class="group">${d.heirs.map(h => `<button class="cell link choice-cell" data-heir="${esc(h.name)}"><span class="tick">${h.name === heir ? "✓" : ""}</span><span class="flag-cell">${BY_CODE[h.code].flag}</span><span class="cell-main"><b>${esc(h.name)}</b><small>${h.sex === "m" ? "Fils" : "Fille"} · né${h.sex === "m" ? "" : "e"} en ${h.year} · ${h.age} ans à la mort de ${esc(rec.s.name)}</small></span></button>`).join("")}</div>
    <p class="group-header">Comment continuer ?</p>
    <div class="group">
      <button class="cell link choice-cell" data-start="now"><span class="tick">${start === "now" ? "✓" : ""}</span><span class="cell-main"><b>Reprendre sa vie là où elle en est</b><small>À ${opts.lineage.parent.deathAt} ans, en ${opts.year + opts.lineage.parent.deathAt} ; son enfance s’est déroulée sans vous.</small></span></button>
      <button class="cell link choice-cell" data-start="birth"><span class="tick">${start === "birth" ? "✓" : ""}</span><span class="cell-main"><b>Revivre depuis sa naissance</b><small>Votre vie précédente mourra dans la sienne, au même âge.</small></span></button>
    </div>
    <p class="group-header">Le testament</p>
    <p class="group-footer" style="margin:-4px 4px 8px">À qui laisser l’héritage ? Il est partagé à parts égales entre les personnes cochées.</p>
    <div class="group">${wo.cands.map(c => `<button class="cell link choice-cell" data-will="${esc(c.key)}"><span class="tick">${will.includes(c.key) ? "✓" : ""}</span><span class="cell-main"><b>${esc(c.label)}</b>${c.sub ? `<small>${esc(c.sub)}</small>` : ""}</span></button>`).join("")}</div>
    <p class="group-footer">${esc(heir)} héritera d’environ ${dollars(opts.lineage.estate)} à ${opts.lineage.parent.deathAt} ans. Génération ${opts.lineage.gen}.</p>
    <button class="btn-filled" id="heirGo" style="margin-top:16px">${start === "now" ? `Reprendre la vie de ${esc(heir)}` : "Vivre sa vie"}</button>
    <button class="btn-plain" id="heirBack">Retour</button>`, { dismissable: false });
  $("sheetBody").querySelectorAll("[data-heir]").forEach(b => b.onclick = () => { haptic(); heirSheet(rec, mode, b.dataset.heir, will, start); });
  $("sheetBody").querySelectorAll("[data-start]").forEach(b => b.onclick = () => { haptic(); heirSheet(rec, mode, heir, will, b.dataset.start); });
  $("sheetBody").querySelectorAll("[data-will]").forEach(b => b.onclick = () => { haptic(); heirSheet(rec, mode, heir, will.includes(b.dataset.will) ? will.filter(k => k !== b.dataset.will) : [...will, b.dataset.will], start); });
  $("heirBack").onclick = () => deathSheet(rec, mode);
  $("heirGo").onclick = () => {
    haptic(20);
    closeSheet(); keepAwake(false); Music.stop();
    $("lifeView").hidden = true; $("resumeGroup").hidden = true;
    clearCurrent();
    life = new Life({ ...opts, classroom: prefs.classroom });
    peers = Array.from({ length: 4 }, () => simulateWhole({ mode: "births", year: opts.year, classroom: prefs.classroom }));
    renderLives();
    if (start === "now") { fastForwardHeir(life); setTimeout(() => beginLife(), 320); return; }
    const v = $("drawView");
    v.hidden = false; v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
    $("drawKicker").textContent = `La lignée continue · génération ${opts.lineage.gen}`;
    renderLives();
    showPass();
  };
}

// ---------- Démarrage ----------
renderWorld();
renderLives();
showResume();
sharedFromHash().then(rec => { if (rec) deathSheet(rec, "shared"); });
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
