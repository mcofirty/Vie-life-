// Plusieurs clubs de sport : une vue d'ensemble de ses clubs, passer de l'un à l'autre, un directeur général
// pour chacun (sinon, diriger plusieurs clubs soi-même double la charge de travail), la règle de multipropriété
// (on ne contrôle pas deux clubs du même championnat), et des transferts entre ses propres clubs.

const ownedClubs = L => (L.businesses || []).map((b, i) => [b, i]).filter(([b]) => isClub(b));
// Le championnat où joue un club : la grande ligue, sinon la division de son pays.
function compKey(L, C) {
  const lg = C.div === 0 ? clubLeague(L, C) : null;
  return lg ? `${C.sport}|${lg.id}` : `${C.sport}|${C.code || L.code}|${C.div}`;
}
const compLabel = (L, C) => divLabel(L, C) + (C.div > 0 || !clubLeague(L, C) ? ` ${inCountry(countryAt(BY_CODE[C.code] ? C.code : L.code, L.calYear))}` : "");
// Un club qu'on contrôle déjà dans ce championnat (règle de multipropriété).
function controlConflict(L, key, except = null) {
  const hit = ownedClubs(L).find(([b]) => b !== except && !minority(b) && b.club && compKey(L, b.club) === key);
  return hit ? hit[0].club.name : null;
}
const MODE_LABEL = { full: "vous le dirigez", side: "vous le dirigez à côté", managed: "confié à un directeur général", investor: "actionnaire minoritaire" };

// --- La règle de multipropriété au moment d'acheter ------------------------------------------------
{
  const stake0 = askStake;
  askStake = function (L, lg, c, price) {
    const other = controlConflict(L, `${lg.sport}|${lg.id}`);
    if (!other) return stake0(L, lg, c, price);
    const st = STAKES.find(([s]) => s < 0.5);
    if (!canPay(L, price * st[0])) { L.say(`N’a pas les moyens d’entrer au capital de ${c.name}.`, "money"); return; }
    L.ask(`Vous contrôlez déjà ${other} (${lg.name}) : le règlement interdit de contrôler deux clubs du même championnat. Investir quand même dans ${c.name}, en minoritaire ?`, [
      { label: st[1], sub: `≈ ${money(price * st[0])} · ${st[2]}`, autoWeight: 1, apply: () => buyRealClub(L, lg, c, st[0], price) },
      { label: "Renoncer", autoWeight: 1, apply: () => L.say(`Renonce à investir dans ${c.name}.`, "money") },
    ]);
  };
  const buy0 = buyClub;
  buyClub = function (L, id) {
    if (!id.startsWith("lg:")) {
      const [k, d] = id.split(":"), sport = BUSINESSES[k] && BUSINESSES[k].sport, other = sport && controlConflict(L, `${sport}|${L.code}|${+d}`);
      if (other) return `Vous possédez déjà ${other} dans cette division : un propriétaire ne peut pas avoir deux clubs dans le même championnat.`;
    }
    const n = ownedClubs(L).length, r = buy0(L, id);
    const nb = (L.businesses || [])[L.businesses.length - 1];
    if (ownedClubs(L).length > n && nb && isClub(nb)) L.askClubDirection(nb);
    return r;
  };
  const real0 = buyRealClub;
  buyRealClub = function (L, lg, c, stake, price) {
    const n = ownedClubs(L).length;
    real0(L, lg, c, stake, price);
    const nb = (L.businesses || [])[L.businesses.length - 1];
    if (ownedClubs(L).length > n && nb && isClub(nb)) L.askClubDirection(nb);
  };
  const up0 = typeof raiseStake === "function" ? raiseStake : null;
  if (up0) raiseStake = function (L, i, to) {
    const b = (L.businesses || [])[+i];
    if (b && isClub(b) && minority(b) && to >= 0.5) { const other = controlConflict(L, compKey(L, L.ensureClub(b)), b); if (other) return `Vous contrôlez déjà ${other} dans ce championnat : impossible de prendre aussi la majorité de ${b.club.name}.`; }
    return up0(L, i, to);
  };
}

// Un directeur général par club : pas deux fois le même nom.
{
  const hire = Life.prototype.hireManager;
  Life.prototype.hireManager = function (quiet = false) {
    const used = new Set((this.businesses || []).filter(x => x !== this.business && x.manager).map(x => x.manager.name));
    if (!used.size) return hire.call(this, quiet);
    const fresh = this.freshName;
    this.freshName = function (sex, code) { let n; for (let t = 0; t < 8; t++) { n = fresh.call(this, sex, code); if (!used.has(n)) break; } return n; };
    try { return hire.call(this, quiet); } finally { delete this.freshName; }
  };
}

Object.assign(Life.prototype, {
  // Un nouveau club alors qu'on en dirige déjà : le mener soi-même, ou le confier à un directeur général.
  askClubDirection(b) {
    if (minority(b) || ownedClubs(this).filter(([x]) => !minority(x)).length < 2 || b.mode !== "side") return;
    const name = this.ensureClub(b).name;
    this.ask(`Vous dirigez déjà un club. Et ${name} ?`, [
      { label: "Le confier à un directeur général", sub: "Il gère l’effectif et le marché ; vous gardez la main sur les grandes décisions.", autoWeight: 2, apply: () => { if (this.focusBiz(b)) this.hireManager(); this.bizFocus = 0; } },
      { label: "Le diriger moi-même, à côté", sub: "Deux fois plus de travail : santé, proches et bonheur en pâtissent.", autoWeight: 1, apply: () => this.say(`Dirige aussi ${name}, en plus du reste.`, "work") },
    ]);
  },
});

// Un club promu dans un championnat où vous contrôlez déjà un autre club : il faut céder le contrôle de l'un des deux.
{
  const upd = Life.prototype.updateMoney;
  Life.prototype.updateMoney = function () {
    const r = upd.apply(this, arguments);
    if (!this.alive) return r;
    const seen = {};
    for (const [b] of ownedClubs(this)) {
      if (minority(b) || !b.club) continue;
      const k = compKey(this, b.club);
      if (!seen[k]) { seen[k] = b; continue; }
      const a = seen[k], A = a.club, B = b.club;
      if (this.queue.some(q => q.multiclub === k)) continue;
      const sellAll = x => { const v = x.value * (x.stake ?? 1); if (!this.focusBiz(x)) return; this.addMoney(v); this.say(`Vend ${x.club.name} pour ${money(v)}, pour respecter le règlement.`, "money", true); this.dropBusiness(); this.bizFocus = 0; };
      const keep25 = x => { const v = x.value * ((x.stake ?? 1) - 0.25); this.addMoney(v); x.stake = 0.25; x.mode = "investor"; x.manager = null; this.say(`Cède le contrôle de ${x.club.name} : ne garde que 25 % des parts (${money(v)}).`, "money", true); };
      this.ask(`${B.name} et ${A.name} jouent désormais tous deux en ${divLabel(this, B)}. Le règlement interdit de contrôler deux clubs du même championnat : que faire ?`, [
        { label: `Ne garder que 25 % de ${B.name}`, sub: `Vous touchez ≈ ${money(b.value * ((b.stake ?? 1) - 0.25))}.`, autoWeight: 2, apply: () => { if (this.businesses.includes(b)) keep25(b); } },
        { label: `Ne garder que 25 % de ${A.name}`, sub: `Vous touchez ≈ ${money(a.value * ((a.stake ?? 1) - 0.25))}.`, autoWeight: 1, apply: () => { if (this.businesses.includes(a)) keep25(a); } },
        { label: `Vendre ${B.name}`, sub: `≈ ${money(b.value * (b.stake ?? 1))}`, autoWeight: 0.5, apply: () => { if (this.businesses.includes(b)) sellAll(b); } },
      ]);
      this.queue[this.queue.length - 1].multiclub = k;
    }
    return r;
  };
}

// --- Transferts entre ses propres clubs ------------------------------------------------------------
function intraTargets(L, i) {
  const b = L.businesses[+i], C = b.club;
  return ownedClubs(L).filter(([x, j]) => j !== +i && !minority(x) && x.club && x.club.sport === C.sport);
}
{
  const act0 = clubAction;
  clubAction = function (L, i, id, arg) {
    if (id !== "intra") return act0(L, i, id, arg);
    const b = (L.businesses || [])[+i];
    if (!isClub(b) || minority(b) || !L.alive) return null;
    const C = L.ensureClub(b), [k, j] = String(arg).split(":").map(Number), p = C.squad[k], d = L.businesses[j];
    if (!p || !d || !isClub(d) || minority(d)) return null;
    const D = L.ensureClub(d);
    if (C.squad.length <= CLUB_SPORTS[C.sport].start) return "Effectif trop court pour se séparer d’un joueur.";
    const fee = playerValue(clubB0(L, C), divLevel(L, C, 0), p);
    if (D.cash < fee) return `Caisse de ${D.name} insuffisante (${eur(D.cash)}) : injectez-y de l’argent.`;
    C.squad.splice(k, 1); D.squad.push(p); D.cash -= fee; C.cash += fee;
    L.say(`${p.n} passe de ${C.name} à ${D.name}, un autre de vos clubs (${money(fee)}).`, "work", p.r >= divLevel(L, D) + 6);
    return `${p.n} rejoint ${D.name}`;
  };
}

// --- La vue d'ensemble « Vos clubs » ---------------------------------------------------------------
function clubsOverviewHtml(L) {
  const list = ownedClubs(L);
  if (!list.length) return `<p class="sp-note">Pas de club.</p>`;
  const total = list.reduce((s, [b]) => s + b.value * (b.stake ?? 1), 0), trophies = list.reduce((s, [b]) => s + ((b.club && b.club.trophies) || []).length, 0);
  const selfRun = list.filter(([b]) => b.mode === "full" || b.mode === "side").length;
  const cards = list.map(([b, i]) => {
    const C = L.ensureClub(b), last = C.history[C.history.length - 1], ctrl = !minority(b);
    const btn = (attr, label, sub = "") => `<button class="sp-pill" ${attr}>${esc(label)}${sub ? ` <span>${esc(sub)}</span>` : ""}</button>`;
    const pills = [btn(`data-open-club="${i}"`, ctrl ? "Gérer le club" : "Voir le club", "saison, effectif, transferts")];
    if (ctrl && b.mode !== "managed") pills.push(btn(`data-biz="manager" data-bidx="${i}"`, "Confier à un directeur général", "moins de travail pour vous"));
    if (ctrl && b.mode === "managed") pills.push(btn(`data-biz="takeback" data-bidx="${i}"`, "Reprendre la direction", b.manager ? `${b.manager.name} s’en va` : ""));
    return `<div class="sp-card"><div class="sp-main"><b>${esc(C.name)} ${BY_CODE[C.code] ? BY_CODE[C.code].flag : ""}</b>
      <small>${esc(capFirst(CLUB_SPORTS[C.sport].label))} · ${esc(compLabel(L, C))}${last ? ` · ${rankTxt(last.rank)} la saison passée` : ""}${C.trophies.length ? ` · ${C.trophies.length} trophée${C.trophies.length > 1 ? "s" : ""}` : ""}</small>
      <small>${MODE_LABEL[b.mode] || ""}${b.mode === "managed" && b.manager ? ` (${esc(b.manager.name)}, talent ${b.manager.skill}/100)` : ""} · ${minority(b) || (b.stake ?? 1) < 1 ? `${Math.round((b.stake ?? 1) * 100)} % des parts · ` : ""}trésorerie ${eur(C.cash)} · votre part ≈ ${eur(b.value * (b.stake ?? 1))}</small></div></div>
      <div class="sp-pills">${pills.join("")}</div>`;
  }).join("");
  return `<div class="sp">
    <p class="sp-head">Vos ${list.length} clubs · vos parts ≈ ${eur(total)}${trophies ? ` · ${trophies} trophée${trophies > 1 ? "s" : ""}` : ""}</p>
    ${cards}
    <p class="sp-note">${selfRun >= 2 ? `Vous dirigez vous-même ${selfRun} clubs : la charge de travail pèse sur la santé et les proches. Un directeur général vous en libère. ` : ""}Un propriétaire ne peut pas contrôler deux clubs du même championnat ; on peut y être actionnaire minoritaire. Entre vos clubs d’un même sport, les joueurs peuvent passer de l’un à l’autre (onglet « Effectif »). Racheter un autre club : « Agir » › « Racheter un club de sport ».</p>
  </div>`;
}

// --- La feuille d'un club : passer d'un club à l'autre, direction, transferts internes -------------
{
  const html0 = clubHtml;
  clubHtml = function (L, i = 0) {
    if (i === "all") return clubsOverviewHtml(L);
    let h = html0(L, i);
    const list = ownedClubs(L), b = (L.businesses || [])[+i];
    if (!b || !isClub(b) || list.length < 2) return h;
    const C = b.club, others = list.filter(([, j]) => j !== +i);
    const sw = `<div class="sp-pills">${others.map(([x, j]) => `<button class="sp-pill" data-open-club="${j}">${esc(x.club ? x.club.name : x.label)} <span>${esc(x.club ? capFirst(CLUB_SPORTS[x.club.sport].label) : "")}</span></button>`).join("")}<button class="sp-pill" data-open-club="all">Tous vos clubs <span>vue d’ensemble</span></button></div>`;
    const dir = minority(b) ? "" : `<div class="sp-pills">${b.mode === "managed" ? `<button class="sp-pill" data-biz="takeback" data-bidx="${i}">Reprendre la direction <span>${esc(b.manager ? `${b.manager.name}, directeur général, s’en va` : "")}</span></button>` : `<button class="sp-pill" data-biz="manager" data-bidx="${i}">Confier à un directeur général <span>il gère l’effectif et le marché</span></button>`}</div>`;
    h = h.replace(`<p class="sp-head">Saison</p>`, `<p class="sp-head">Saison</p>${sw}${dir}`);
    const dests = minority(b) ? [] : intraTargets(L, i);
    if (dests.length) {
      const best = [...C.squad].map((p, k) => [p, k]).sort((x, z) => z[0].r - x[0].r).slice(0, 6), fee = p => playerValue(clubB0(L, C), divLevel(L, C, 0), p);
      const pills = best.flatMap(([p, k]) => dests.map(([d, j]) => `<button class="sp-pill" data-club="intra" data-cidx="${i}" data-arg="${k}:${j}"${d.club.cash < fee(p) ? " disabled" : ""}>${esc(`${p.n} (${p.r}) → ${d.club.name}`)} <span>${esc(`≈ ${eur(fee(p))} payés par ${d.club.name}${d.club.cash < fee(p) ? " · caisse insuffisante" : ""}`)}</span></button>`)).join("");
      h = h.replace(`<p class="sp-head">Transferts</p>`, `<p class="sp-note">Entre vos clubs : un joueur peut rejoindre un autre de vos clubs, au prix du marché.</p><div class="sp-pills">${pills}</div><p class="sp-head">Transferts</p>`);
    }
    return h;
  };
}

// --- Tableau de bord et menu ------------------------------------------------------------------------
{
  const dash = dashboardData;
  dashboardData = function (L) {
    const d = dash(L), list = ownedClubs(L);
    if (list.length >= 2 && L.alive) {
      const s = d.status.find(x => x.label === "Club");
      const bits = list.slice(0, 3).map(([b]) => { const C = L.ensureClub(b), last = C.history[C.history.length - 1]; return `${C.name}${last ? ` (${rankTxt(last.rank)})` : ""}`; });
      const card = { icon: "leisure", label: "Clubs", act: "club:all", cta: true, value: `${list.length} clubs · ${bits.join(", ")}${list.length > 3 ? "…" : ""} ›` };
      if (s) Object.assign(s, card); else d.status.push(card);
    }
    return d;
  };
}
// L'entrée de menu « Votre club » ouvre la vue d'ensemble quand on en a plusieurs.
const clubMenuKind = L => ownedClubs(L).length >= 2 ? "club:all" : `club:${firstClubIdx(L)}`;
