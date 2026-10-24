// Version application (téléphone) : onglets, feuilles, anneaux, tirage façon carte.

const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n, d = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const ans = n => `${n} an${n > 1 ? "s" : ""}`;
const PPP_TO_EUR_FR = 0.72;
const SPEEDS = [1, 2, 4, 8, 16];

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ } },
};
const prefs = {
  auto: store.get("vie.app.auto", false),
  pauses: store.get("vie.app.pauses", true),
  haptics: store.get("vie.app.haptics", true),
  theme: store.get("vie.theme", null) || "auto",
  mode: store.get("vie.app.mode", "births"),
  dur: store.get("vie.app.dur", "30"),
};
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
applyTheme(prefs.theme === "auto" ? "auto" : prefs.theme);
segmented("theme", prefs.theme, v => { prefs.theme = v; store.set("vie.theme", v === "auto" ? null : v); applyTheme(v); });
segmented("mode", prefs.mode, v => { prefs.mode = v; store.set("vie.app.mode", v); });
segmented("dur", prefs.dur, v => { prefs.dur = v; store.set("vie.app.dur", v); });

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
[["optAuto", "auto"], ["optPauses", "pauses"], ["optHaptics", "haptics"]].forEach(([id, key]) => {
  $(id).checked = prefs[key];
  $(id).addEventListener("change", e => { prefs[key] = e.target.checked; store.set(`vie.app.${key}`, prefs[key]); haptic(); });
});

// ---------- Monde ----------
function renderWorld() {
  const total = COUNTRIES.reduce((s, c) => s + c.births, 0);
  const sorted = [...COUNTRIES].sort((a, b) => b.births - a.births);
  const max = sorted[0].births / total;
  $("oddsGroup").innerHTML = sorted.slice(0, 8).map(c => {
    const p = c.births / total;
    return `<button class="cell link" data-code="${c.code}"><div class="odds-row" style="flex:1"><span class="flag">${c.flag}</span><span>${c.name}</span><span class="pct">${fmt(p * 100, 1)} %</span><span class="bar"><i style="width:${(p / max * 100).toFixed(1)}%"></i></span></div><span class="chev"></span></button>`;
  }).join("");
  $("oddsNote").textContent = `Sur 100 bébés tirés au sort, ${fmt(sorted.slice(0, 8).reduce((s, c) => s + c.births, 0) / total * 100, 0)} naîtraient dans l’un de ces 8 pays. Les ${COUNTRIES.length} pays de l’app représentent environ ${fmt(total / WORLD_BIRTHS_K * 100, 0)} % des naissances mondiales.`;
  const list = q => {
    const norm = s => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const rows = [...COUNTRIES].filter(c => !q || norm(c.name).includes(norm(q))).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    $("countryGroup").innerHTML = rows.map(c => `<button class="cell link" data-code="${c.code}"><span class="flag-cell">${c.flag}</span><span class="cell-main"><b>${c.name}</b><small>Espérance de vie ${fmt((c.e0.m + c.e0.f) / 2)} ans · ${nf.format(c.gdp)} $/hab.</small></span><span class="chev"></span></button>`).join("")
      || `<div class="cell"><span class="cell-main"><small>Aucun pays ne correspond.</small></span></div>`;
  };
  list("");
  $("search").addEventListener("input", e => list(e.target.value.trim()));
  [$("oddsGroup"), $("countryGroup")].forEach(g => g.addEventListener("click", e => {
    const b = e.target.closest("[data-code]"); if (b) { haptic(); countrySheet(BY_CODE[b.dataset.code]); }
  }));
}

function countrySheet(c) {
  const total = COUNTRIES.reduce((s, x) => s + x.births, 0);
  const rows = [
    ["Naissances par an", nf.format(c.births * 1000)],
    ["Chance d’y naître", `1 sur ${nf.format(Math.round(total / c.births))}`],
    ["Espérance de vie (H / F)", `${fmt(c.e0.m)} / ${fmt(c.e0.f)} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} ‰`],
    ["PIB par habitant", `${nf.format(c.gdp)} $ PPA`],
    ["Inégalités (Gini)", c.gini],
    ["Années d’école", fmt(c.school, 1)],
    ["Accès au supérieur", `${c.tert} %`],
    ["Homicides", `${fmt(c.hom, 1)} / 100 000`],
    ["Enfants par femme", fmt(c.tfr, 1)],
    ["Mariage avant 18 ans", `${c.cm} % des filles`],
    ["Satisfaction de vie", `${fmt(c.happy, 1)} / 10`],
  ];
  openSheet(`<div class="big-emoji ticket-badge">${c.flag}</div><h2 class="sheet-title">${c.name}</h2>
    <div class="group">${rows.map(([k, v]) => `<div class="cell"><span class="cell-main"><b>${k}</b></span><span class="cell-value">${v}</span></div>`).join("")}</div>`, { dismissable: true });
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
  sh.hidden = false; bd.hidden = false;
  sh.style.animation = "none"; void sh.offsetWidth; sh.style.animation = "";
}
function closeSheet() {
  const sh = $("sheet"), bd = $("sheetBackdrop");
  if (sh.hidden) return;
  sh.classList.add("closing"); bd.classList.add("backdrop-closing");
  const done = sheetOpts.onClose;
  setTimeout(() => { sh.hidden = true; bd.hidden = true; sh.classList.remove("closing"); bd.classList.remove("backdrop-closing"); }, 300);
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

// ---------- Vies antérieures ----------
const pastLives = () => store.get("vie.lives", []);
function renderLives() {
  const lives = pastLives();
  $("livesEmpty").hidden = lives.length > 0;
  $("clearGroup").hidden = !lives.length;
  $("livesGroup").hidden = !lives.length;
  $("livesGroup").innerHTML = lives.map((r, i) => {
    const c = BY_CODE[r.s.home];
    return `<button class="cell link" data-i="${i}"><span class="flag-cell">${c.flag}</span><span class="cell-main"><b>${esc(r.s.name)}</b><small>${c.name} · ${ans(r.s.age)} · ${esc(r.s.cause)}</small></span><span class="cell-value">${new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span><span class="chev"></span></button>`;
  }).join("");
}
$("livesGroup").addEventListener("click", e => {
  const b = e.target.closest("[data-i]"); if (!b) return;
  haptic(); deathSheet(pastLives()[+b.dataset.i], true);
});
$("clearPast").addEventListener("click", () => {
  openSheet(`<h2 class="sheet-title">Effacer toutes les vies ?</h2><p class="group-footer" style="text-align:center;margin:-8px 0 20px">C’est définitif.</p>
    <button class="btn-filled" style="background:var(--red)" id="confirmClear">Effacer</button><button class="btn-plain" id="cancelClear">Annuler</button>`, { dismissable: true });
  $("confirmClear").onclick = () => { store.set("vie.lives", []); closeSheet(); renderLives(); haptic(20); toast("Vies effacées"); };
  $("cancelClear").onclick = closeSheet;
});

// ---------- Tirage ----------
let life = null, peers = [], running = false, speedIdx = 0, progress = 0, secPerYear = 20, lastT = 0, rendered = 0, pane = "story", wakeLock = null;

function startDraw() {
  haptic(12);
  life = new Life({ mode: prefs.mode });
  peers = Array.from({ length: 4 }, () => simulateWhole({ mode: prefs.mode }));
  const v = $("drawView");
  v.classList.remove("landed");
  v.hidden = false; v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
  $("pass").hidden = true; $("drawActions").hidden = true;
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
  const weights = COUNTRIES.reduce((s, x) => s + (prefs.mode === "pop" ? x.pop : x.births), 0);
  const odds = Math.round(weights / (prefs.mode === "pop" ? c.pop : c.births));
  $("passFlag").textContent = c.flag;
  $("passDate").textContent = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  $("passName").value = life.name;
  $("passSub").textContent = `${life.g("Garçon", "Fille")} · ${life.g("né", "née")} ${inCountry(c)} · 1 chance sur ${nf.format(odds)}`;
  $("passGrid").innerHTML = [
    ["Espérance de vie", `${fmt(c.e0[life.sex])} ans`],
    ["Mortalité infantile", `${fmt(c.imr, 1)} ‰`],
    ["Revenu moyen", `${nf.format(c.gdp)} $`],
    ["École", `${fmt(c.school, 1)} ans`],
  ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("");
  $("passFamily").textContent = `Votre famille est ${life.familyLabel()}.`;
  $("drawView").classList.add("landed");
  pass.hidden = false; $("drawActions").hidden = false;
}

$("bornBtn").addEventListener("click", startDraw);
$("cancelDraw").addEventListener("click", () => { life = null; $("drawView").hidden = true; });
$("startLife").addEventListener("click", () => {
  const nm = $("passName").value.trim();
  if (nm) life.name = nm;
  $("drawView").hidden = true;
  beginLife();
});

// ---------- Vie ----------
// Palette d’accompagnement Lifelot pour les données (voir brand/README.md).
const STATS = [["health", "Santé", "#3CC9A0"], ["happy", "Bonheur", "#FFB23F"], ["know", "Savoir", "#7C9BFF"], ["rel", "Liens", "#FF5A36"]];
const RING_C = 2 * Math.PI * 15;
$("rings").innerHTML = STATS.map(([k, label, color]) => `<div class="ring" style="--rc:${color}"><svg viewBox="0 0 38 38"><circle class="track" cx="19" cy="19" r="15"/><circle class="prog" id="ring-${k}" cx="19" cy="19" r="15" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/></svg><div><b id="val-${k}">0</b><small>${label}</small></div></div>`).join("");

const PRIORITY_ICON = { equilibre: "balance", sante: "health", travail: "edu", famille: "friends", plaisir: "leisure" };
$("priority").innerHTML = Object.entries(PRIORITIES).map(([k, v]) => `<button data-v="${k}">${icon(PRIORITY_ICON[k], "pi")}${v}</button>`).join("");
$("priority").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !life) return;
  life.priority = b.dataset.v; haptic(); markPriority();
});
const markPriority = () => document.querySelectorAll("#priority button").forEach(b => b.classList.toggle("on", b.dataset.v === life.priority));

$("lifeSeg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  haptic();
  pane = b.dataset.v;
  $("lifeSeg").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  ["story", "me", "peers", "data"].forEach(p => $(`pane-${p}`).hidden = p !== pane);
  renderLife();
});

async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => wakeLock = null); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* non disponible */ }
}

function beginLife() {
  secPerYear = +prefs.dur * 60 / life.country.e0[life.sex];
  progress = 0; rendered = 0; speedIdx = 0;
  life.auto = prefs.auto;
  life.real = store.get("vie.real", "") || null;
  $("autoChip").setAttribute("aria-pressed", String(life.auto));
  $("speedBtn").textContent = "×1";
  $("feed").innerHTML = "";
  $("lfName").textContent = `${life.country.flag} ${life.name}`;
  markPriority();
  $("lifeSeg").querySelector('[data-v="story"]').click();
  const v = $("lifeView");
  v.hidden = false; v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
  $("lifeScroll").scrollTop = 0;
  renderLife();
  setRunning(true);
  lastT = 0;
  requestAnimationFrame(loop);
}

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
  if (running && life.alive && !sheetOpen()) {
    progress += dt * SPEEDS[speedIdx] / secPerYear;
    if (progress >= 1) { progress = 0; life.step(); renderLife(); afterStep(); }
  }
  $("yearRing").style.strokeDashoffset = (326.7 * (1 - progress)).toFixed(1);
  requestAnimationFrame(loop);
}

const pauseDue = () => prefs.pauses && PAUSE_AGES.includes(life.age) && !life.reflections.some(r => r.age === life.age);
function afterStep() {
  if (!life.alive) { haptic([30, 60, 30]); setRunning(false); setTimeout(() => deathSheet(buildRecord()), 1100); return; }
  if (life.queue.length) { haptic(15); decisionSheet(); return; }
  if (pauseDue()) { haptic(10); pauseSheet(); }
}

$("playBtn").addEventListener("click", () => { haptic(); setRunning(!running); });
$("speedBtn").addEventListener("click", () => { haptic(); speedIdx = (speedIdx + 1) % SPEEDS.length; $("speedBtn").textContent = `×${SPEEDS[speedIdx]}`; });
$("nextBtn").addEventListener("click", () => {
  if (!life || !life.alive || sheetOpen()) return;
  haptic();
  for (let i = 0; i < 100 && life.alive; i++) {
    const before = life.highlights.length;
    life.step();
    if (!life.alive || life.queue.length || life.highlights.length > before || pauseDue()) break;
  }
  progress = 0;
  renderLife();
  afterStep();
});
$("autoChip").addEventListener("click", () => {
  if (!life) return;
  life.auto = !life.auto; haptic();
  $("autoChip").setAttribute("aria-pressed", String(life.auto));
  toast(life.auto ? "Mode automatique activé" : "Vous décidez à nouveau");
});
$("quitBtn").addEventListener("click", () => {
  haptic();
  setRunning(false);
  $("lifeView").hidden = true;
  $("resumeGroup").hidden = !(life && life.alive);
  if (life && life.alive) $("resumeSub").textContent = `${life.country.flag} ${life.name}, ${ans(life.age)}`;
});
$("resumeBtn").addEventListener("click", () => {
  if (!life || !life.alive) return;
  haptic();
  const v = $("lifeView");
  v.hidden = false; v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
  setRunning(true); lastT = 0; requestAnimationFrame(loop);
});

const KIND_ICON = { birth: "birth", edu: "edu", work: "work", family: "family", move: "move", death: "death" };

function renderLife() {
  const L = life, c = L.here;
  $("lfAge").textContent = L.age;
  $("lfAgeUnit").textContent = L.age > 1 ? "ans" : "an";
  $("lfCountry").textContent = L.emigrated ? `vit ${inCountry(c)} · ${L.g("né", "née")} ${inCountry(BY_CODE[L.home])}` : `${inCountry(c).replace(/^./, m => m.toUpperCase())}`;
  STATS.forEach(([k]) => {
    const v = Math.round(L.stats[k]);
    $(`ring-${k}`).style.strokeDashoffset = (RING_C * (1 - v / 100)).toFixed(2);
    $(`val-${k}`).textContent = v;
  });
  const h = L.stats.happy / 100;
  $("lifeHero").style.setProperty("--glow", (0.15 + h * 0.6).toFixed(2));

  const feed = $("feed");
  for (; rendered < L.log.length; rendered++) {
    const e = L.log[rendered];
    const li = document.createElement("li");
    li.className = `${e.kind} ${L.highlights.includes(e) ? "hl" : ""}`;
    li.innerHTML = `<span class="dot">${icon(KIND_ICON[e.kind] || "dot")}</span><div class="body"><small>${ans(e.age)}</small><p>${esc(e.text)}</p></div>`;
    feed.prepend(li);
  }

  if (pane === "me") renderSituation();
  if (pane === "peers") renderPeers();
  if (pane === "data") renderData();
}

function renderSituation() {
  const L = life, living = L.children.filter(k => k.alive).length;
  const rows = [
    ["home", "Famille d’origine", L.familyLabel()],
    ["edu", "Études", L.schooling ? `en cours · ${EDU_LABEL[L.schooling]}` : EDU_LABEL[L.edu]],
    ["work", "Travail", L.retired ? "à la retraite" : L.job || (L.age < 6 ? "—" : "aucun")],
  ];
  if (L.income > 0) rows.push(["money", "Revenu", `${nf.format(Math.round(L.income / 10) * 10)} $/an`, `≈ ${nf.format(Math.round(L.income * PPP_TO_EUR_FR / 12 / 10) * 10)} € par mois en prix français`]);
  rows.push(["couple", "Couple", L.married ? `${L.g("marié", "mariée")} à ${L.partner}` : L.marriedEver ? L.g("seul", "seule") : "célibataire"]);
  if (L.children.length) rows.push(["child", "Enfants", living === L.children.length ? String(living) : `${living} sur ${L.children.length}`]);
  rows.push(["friends", "Frères et sœurs", L.siblings ? String(L.siblings) : "aucun"]);
  $("situation").innerHTML = rows.map(([i, k, v, sub]) => `<div class="cell"><span class="row-icon">${icon(i)}</span><span class="cell-main"><b>${k}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="cell-value">${esc(v)}</span></div>`).join("");
}

function peerStatus(p, age) {
  if (!p.alive && p.age <= age) return `${p.g("Mort", "Morte")} à ${ans(p.age)} · ${p.cause}`;
  const h = p.history[Math.min(age, p.history.length - 1)];
  if (!h) return "";
  const bits = [];
  if (age < 6) bits.push("petite enfance");
  else if (h.schooling) bits.push(`à l’école · ${EDU_LABEL[h.schooling]}`);
  else if (h.job) bits.push(h.job);
  else bits.push(age > 60 ? "à la maison" : "sans travail");
  if (h.married) bits.push(p.g("marié", "mariée"));
  if (h.children) bits.push(`${h.children} enfant${h.children > 1 ? "s" : ""}`);
  if (h.code !== p.home) bits.push(`vit ${inCountry(BY_CODE[h.code])}`);
  return bits.join(" · ");
}
function renderPeers() {
  $("peers").innerHTML = peers.map(p => {
    const dead = !p.alive && p.age <= life.age, c = BY_CODE[p.home];
    return `<div class="cell peer ${dead ? "dead" : ""}"><span class="flag-cell">${c.flag}</span><span class="cell-main"><b>${esc(p.name)}${dead ? " †" : ""}</b><small>${c.name} · ${esc(peerStatus(p, life.age))}</small></span></div>`;
  }).join("");
}

// Grille de vie aux couleurs Lifelot : plus l’année est heureuse, plus la case est corail.
function happyColor(v) { return `color-mix(in srgb, #FF5A36 ${Math.round(25 + v * 0.75)}%, #B9B4C9)`; }
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
  renderGrid($("grid100"), life.history, life.alive ? life.age : -1, !life.alive);
  const { lx } = lifeTable(life.home, life.sex);
  const X = a => 34 + a * 2.6, Y = v => 128 - v * 116;
  const pts = lx.slice(0, 101).map((v, a) => `${X(a).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const a = Math.min(life.age, 100);
  $("survival").innerHTML = `<line class="axis" x1="34" y1="128" x2="294" y2="128"/>
    <text class="lbl" x="30" y="16" text-anchor="end">100 %</text><text class="lbl" x="30" y="131" text-anchor="end">0</text>
    ${[0, 25, 50, 75, 100].map(t => `<text class="lbl" x="${X(t)}" y="144" text-anchor="middle">${t}</text>`).join("")}
    <polygon class="area" points="${X(0)},128 ${pts} ${X(100)},128"/><polyline class="curve" points="${pts}"/>
    <circle class="marker" cx="${X(a)}" cy="${Y(lx[a])}" r="6"/>`;
  $("survivalNote").textContent = `${fmt(lx[a] * 100, 0)} % des ${life.g("garçons", "filles")} ${life.g("nés", "nées")} la même année ${inCountry(BY_CODE[life.home])} sont encore en vie à ${ans(a)}.`;
  $("compareWrap").hidden = !life.real;
  if (life.real) $("compare").innerHTML = compareCells(life.country, BY_CODE[life.real], life.sex);
}

function compareCells(a, b, sex) {
  const rows = [
    ["Espérance de vie", `${fmt(a.e0[sex])} ans`, `${fmt(b.e0[sex])} ans`],
    ["Mortalité infantile", `${fmt(a.imr, 1)} ‰`, `${fmt(b.imr, 1)} ‰`],
    ["Revenu moyen", `${nf.format(a.gdp)} $`, `${nf.format(b.gdp)} $`],
    ["Années d’école", fmt(a.school, 1), fmt(b.school, 1)],
    ["Université", `${a.tert} %`, `${b.tert} %`],
    ["Satisfaction", `${fmt(a.happy, 1)}`, `${fmt(b.happy, 1)}`],
  ];
  return `<div class="cell"><div class="cmp-row cmp-head" style="flex:1"><b></b><span>${a.flag} ${a.name}</span><span>${b.flag} Vous</span></div></div>` +
    rows.map(r => `<div class="cell"><div class="cmp-row" style="flex:1"><b style="font-weight:400">${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span></div></div>`).join("");
}

// ---------- Décisions et pauses ----------
function decisionSheet() {
  const d = life.queue[0];
  openSheet(`<p class="sheet-kicker">Une décision · ${ans(life.age)}</p><h2 class="sheet-title">${esc(d.text)}</h2>
    ${d.options.map((o, i) => `<button class="${i === 0 ? "btn-filled" : "btn-gray"}" data-i="${i}">${esc(o.label)}</button>`).join("")}`);
  $("sheetBody").querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => {
    haptic(12);
    life.resolve(+b.dataset.i);
    closeSheet();
    renderLife();
    setTimeout(() => { if (life.queue.length) decisionSheet(); else if (pauseDue()) pauseSheet(); }, 320);
  }));
}

const PAUSE_QUESTIONS = {
  5: L => `${L.name} a 5 ans. Quel est le plus ancien souvenir de votre propre enfance ?`,
  15: L => `${L.name} a 15 ans${L.schooling ? " et va encore à l’école" : L.job ? " et travaille déjà" : ""}. À 15 ans, quelles portes étaient ouvertes devant vous ?`,
  30: L => `${L.name} a 30 ans. Qu’est-ce que votre vie doit au lieu où vous êtes ${L.g("né", "né·e")} ?`,
  50: L => `${L.name} a 50 ans. Si vous pouviez lui parler une minute, que lui diriez-vous ?`,
  70: L => `${L.name} a 70 ans. Qu’aimeriez-vous qu’on retienne d’une vie, la sienne ou la vôtre ?`,
};
function pauseSheet() {
  const q = PAUSE_QUESTIONS[life.age](life);
  openSheet(`<p class="sheet-kicker">Une pause · ${ans(life.age)}</p><h2 class="sheet-title">${esc(q)}</h2>
    <textarea id="pauseInput" rows="3" placeholder="Une ligne, si vous voulez…"></textarea>
    <button class="btn-filled" id="pauseGo">Continuer</button>`);
  $("pauseGo").addEventListener("click", () => {
    life.reflections.push({ age: life.age, q, a: $("pauseInput").value.trim() });
    haptic(); closeSheet();
  });
}

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
function saveRecord(rec) {
  const lives = pastLives().filter(r => r.id !== rec.id);
  lives.unshift(rec);
  store.set("vie.lives", lives.slice(0, 30));
}

function deathSheet(rec, review = false) {
  const s = rec.s, c = BY_CODE[s.home];
  const g = (m, f) => s.sex === "m" ? m : f;
  const ageTxt = s.age === 0 ? "moins d’un an" : ans(s.age);
  const diff = s.age - c.e0[s.sex];
  const vsE0 = Math.abs(diff) < 2 ? "Environ l’espérance de vie du pays." : diff > 0 ? `${fmt(diff)} ans de plus que l’espérance de vie du pays.` : `${fmt(-diff)} ans de moins que l’espérance de vie du pays.`;
  const lost = s.children - s.childrenAlive;
  const kids = s.children ? `${s.children}${lost ? ` (${lost} mort${lost > 1 ? "s" : ""} en bas âge)` : ""}` : "aucun";
  const facts = [["Cause", s.cause], ["Études", EDU_LABEL[s.edu]], ["Travail", s.job || "aucun"], ["Mariage", s.marriedEver ? "oui" : "non"], ["Enfants", kids]];
  if (s.income > 0) facts.splice(3, 0, ["Dernier revenu", `${nf.format(Math.round(s.income / 10) * 10)} $/an`]);
  const refl = (rec.reflections || []).filter(r => r.a);
  const heavy = /suicide|homicide|surdose/.test(s.cause) || rec.highlights.some(h => /mariée à \d+ ans|meurt avant ses cinq ans/.test(h.text));

  openSheet(`
    <div class="memorial ticket">
      <div class="candle"></div>
      <h2>${esc(s.name)}</h2>
      <p class="years">${c.flag} ${g("Né", "Née")} ${inCountry(c)} · ${ageTxt}${s.emigrated ? ` · ${g("mort", "morte")} ${inCountry(BY_CODE[s.code])}` : ""}</p>
      <p>${vsE0}</p>
      <div class="grid100" id="memGrid"></div>
    </div>
    <p class="group-header">Acte de décès · ${new Date(rec.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
    <div class="group">${facts.map(([k, v]) => `<div class="cell"><span class="cell-main"><b>${k}</b></span><span class="cell-value">${esc(v)}</span></div>`).join("")}</div>
    <p class="group-header">Moments marquants</p>
    <div class="group">${(rec.highlights.slice(-10).map(h => `<div class="cell"><span class="cell-value" style="min-width:52px;max-width:none">${ans(h.age)}</span><span class="cell-main"><b>${esc(h.text)}</b></span></div>`).join("")) || `<div class="cell"><span class="cell-main"><small>Une vie trop courte pour laisser des souvenirs écrits.</small></span></div>`}</div>
    <p class="group-header">Les quatre autres bébés</p>
    <div class="group">${rec.peers.map(p => { const pc = BY_CODE[p.home]; const pg = (m, f) => p.sex === "m" ? m : f; return `<div class="cell"><span class="flag-cell">${pc.flag}</span><span class="cell-main"><b>${esc(p.name)}, ${pc.name}</b><small>${pg("Mort", "Morte")} à ${ans(p.age)} · ${esc(p.cause)} · ${EDU_LABEL[p.edu]}${p.children ? ` · ${p.children} enfant${p.children > 1 ? "s" : ""}` : ""}${p.emigrated ? ` · ${inCountry(BY_CODE[p.code])}` : ""}</small></span></div>`; }).join("")}</div>
    ${rec.real ? `<p class="group-header">Cette vie et la vôtre</p><div class="group">${compareCells(c, BY_CODE[rec.real], s.sex)}</div>` : ""}
    ${refl.length ? `<p class="group-header">Vos pauses</p><div class="group">${refl.map(r => `<div class="cell column"><small style="color:var(--label-2);font-size:13px">${esc(r.q)}</small><span>${esc(r.a)}</span></div>`).join("")}</div>` : ""}
    <p class="group-header">Quelques mots pour ${esc(s.name)}</p>
    <textarea id="lastWords" rows="2" placeholder="Ce que vous auriez voulu lui dire…" ${review ? "readonly" : ""}>${esc(rec.message || "")}</textarea>
    ${heavy ? `<p class="help-note">Si ces sujets vous touchent, vous pouvez en parler : en France, appelez le <a href="tel:3114">3114</a>, gratuit, 24 h/24. Ailleurs : <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>.</p>` : ""}
    <div style="margin-top:20px">
      ${review ? `<button class="btn-gray" id="closeDeath">Fermer</button>` : `<button class="btn-filled" id="againBtn">Une autre vie</button><button class="btn-plain" id="doneBtn">Terminer</button>`}
    </div>`, { dismissable: review });
  renderGrid($("memGrid"), rec.history, -1, true);
  if (review) { $("closeDeath").onclick = closeSheet; return; }
  saveRecord(rec);
  const finish = () => {
    rec.message = $("lastWords").value.trim(); saveRecord(rec);
    closeSheet(); life = null; keepAwake(false);
    $("lifeView").hidden = true; $("resumeGroup").hidden = true;
    renderLives();
  };
  $("againBtn").onclick = () => { finish(); setTimeout(startDraw, 320); };
  $("doneBtn").onclick = () => { finish(); toast("Vie gardée dans l’onglet Vies"); };
}

// ---------- Démarrage ----------
renderWorld();
renderLives();
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
