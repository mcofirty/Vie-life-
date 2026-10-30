// Gérer un club de sport : fonder ou racheter un club (football, basket, rugby, hockey, baseball,
// cricket, cyclisme, e-sport), jouer les saisons (classement, montées, descentes, coupes), recruter et
// vendre des joueurs, former des jeunes, investir dans le stade et l'entraînement, choisir l'entraîneur.
// Le club a sa propre trésorerie : le propriétaire y injecte de l'argent ou s'y verse un dividende.

// rev : poids économique du sport (droits télé, billetterie, sponsors) ; n : effectif ; start : titulaires.
const CLUB_SPORTS = {
  foot: { label: "football", n: 22, start: 11, rev: 1500, weak: "US CA AU IN PK BD", from: 1900, names: ["FC", "Olympique", "Sporting", "Racing", "Athletic", "Union sportive"] },
  basket: { label: "basket", n: 14, start: 8, rev: 500, popular: "US CA ES FR LT LV RS HR SI GR TR IT AR AU CN PH DE PR", from: 1930, names: ["Basket Club", "Élan", "Étoile"] },
  rugby: { label: "rugby", n: 30, start: 15, rev: 250, popular: "NZ ZA FJ AU FR GB IE AR WS TO IT GE JP", from: 1900, names: ["Stade", "Rugby Club", "Union"] },
  hockey: { label: "hockey sur glace", n: 24, start: 12, rev: 450, popular: "CA US RU FI SE CZ SK CH LV BY DE", from: 1910, names: ["Hockey Club", "Les Loups", "Les Aigles"] },
  baseball: { label: "baseball", n: 26, start: 9, rev: 600, popular: "US JP KR TW DO CU VE MX PR PA NI", from: 1900, names: ["Les Tigres", "Les Marins", "Les Faucons"] },
  cricket: { label: "cricket", n: 18, start: 11, rev: 250, popular: "IN PK BD LK AU GB NZ ZA AF", from: 1900, names: ["Cricket Club", "Les Lions"] },
  velo: { label: "cyclisme", n: 16, start: 8, rev: 60, popular: "FR BE NL IT ES CO DK SI GB DE CH LU", from: 1903, names: ["Équipe"], team: true },
  esport: { label: "e-sport", n: 7, start: 5, rev: 40, from: 2010, net: 60, names: ["Team"], team: true },
};
const CLUB_PLACES = ["du Port", "des Collines", "de la Vallée", "du Nord", "de la Rivière", "des Remparts", "du Lac", "de la Plaine", "de l’Étoile", "des Pins", "du Phare", "des Forges"];
const TEAM_NAMES = ["Horizon", "Nova", "Zénith", "Altitude", "Phénix", "Orion", "Boréal", "Comète"];
const DIV_NAMES = {
  velo: ["circuit mondial", "circuit continental", "circuit national", "niveau amateur"],
  esport: ["ligue majeure", "ligue challenger", "ligue nationale", "ligue amateur"],
  _: ["première division", "deuxième division", "troisième division", "championnat régional"],
};
const divName = (sport, d) => (DIV_NAMES[sport] || DIV_NAMES._)[d];
const DIV_REV = [1, 0.3, 0.1, 0.03];      // ce que rapporte chaque division, en part de la première
const DIV_LEVEL = [78, 68, 58, 48];       // niveau moyen des équipes de chaque division
const INFRA = { stadium: ["Stade", ["un petit stade", "un stade moderne", "une grande enceinte", "une arène de légende"]], training: ["Centre d’entraînement", ["un terrain d’entraînement", "un centre moderne", "un centre de pointe", "un des meilleurs du monde"]], academy: ["Centre de formation", ["pas de centre de formation", "une petite école de jeunes", "un centre de formation réputé", "une académie de renommée mondiale"]] };

// Les types d'entreprise « club » : on fonde un club, qui part en troisième division.
Object.assign(BUSINESSES, {
  club: { label: "Club de football professionnel", domain: "Sport", cost: 30, mult: 1.5, sd: 1.0, risk: 1.2, sport: "foot" },
  clubbasket: { label: "Club de basket professionnel", domain: "Sport", cost: 10, mult: 1.3, sd: 1.0, risk: 1.2, sport: "basket", from: 1946 },
  clubrugby: { label: "Club de rugby professionnel", domain: "Sport", cost: 8, mult: 1.3, sd: 1.0, risk: 1.2, sport: "rugby", from: 1995 },
  clubhockey: { label: "Club de hockey sur glace", domain: "Sport", cost: 10, mult: 1.3, sd: 1.0, risk: 1.2, sport: "hockey", from: 1917 },
  clubbaseball: { label: "Club de baseball professionnel", domain: "Sport", cost: 12, mult: 1.3, sd: 1.0, risk: 1.2, sport: "baseball", from: 1903 },
  clubcricket: { label: "Club de cricket professionnel", domain: "Sport", cost: 8, mult: 1.3, sd: 1.0, risk: 1.2, sport: "cricket", from: 1960 },
  cyclingteam: { label: "Équipe cycliste professionnelle", domain: "Sport", cost: 4, mult: 1.2, sd: 1.0, risk: 1.3, sport: "velo", from: 1920 },
  esportteam: { label: "Équipe d’e-sport", domain: "Sport", cost: 1.5, mult: 1.1, sd: 1.2, risk: 1.5, from: 2010, net: 60, sport: "esport" },
});
const isClub = b => !!(b && BUSINESSES[b.type] && BUSINESSES[b.type].sport);
// Un sport se pratique-t-il à haut niveau ici ? (popularité 1, ou 0,25 là où il est confidentiel)
function sportPop(code, sport) {
  const S = CLUB_SPORTS[sport];
  if (S.weak && inList(code, S.weak)) return 0.4;
  if (!S.popular) return 1;
  return inList(code, S.popular) ? 1 : 0.25;
}
// L'économie du sport dans le pays : ce que rapporte une saison en première division.
function clubBase(L, sport) {
  const c = L.here, S = CLUB_SPORTS[sport];
  return median(c) * S.rev * sportPop(L.code, sport) * (c.gdp > 20000 ? 1 : 0.5 + c.gdp / 40000) * L.econ;
}
// Les grands championnats sont plus relevés : pays riche et sport populaire.
const leagueLevel = (L, sport, div) => DIV_LEVEL[div] + clamp(Math.log(Math.max(L.here.gdp, 1000) / 15000) * 4, -8, 5) + (sportPop(L.code, sport) < 1 ? -4 : 2);
const wageFor = (B, r) => B * 0.012 * Math.exp((r - 70) / 9);
const playerValue = (B, p) => B * 0.08 * Math.exp((p.r - 70) / 7) * (p.a <= 22 ? 1 + Math.max(0, p.p - p.r) / 25 : p.a >= 31 ? Math.max(0.15, 1 - (p.a - 30) * 0.15) : 1);
const coachWage = (B, s) => B * 0.006 * Math.exp((s - 60) / 12);

function newPlayer(L, level, opts = {}) {
  const age = opts.age ?? clamp(Math.round(17 + rand() * 16), 16, 35);
  const r = clamp(Math.round(level + randn() * 6 + (opts.boost || 0)), 30, 97);
  const p = clamp(Math.round(age <= 21 ? r + 4 + rand() * 16 + (opts.pot || 0) : age <= 25 ? r + rand() * 6 : r), r, 99);
  const foreign = opts.code || (rand() < 0.25 ? pick(["BR", "AR", "FR", "ES", "NG", "SN", "US", "JP", "KR", "DE", "IT", "GB", "RS", "CA", "AU", "CM"]) : L.code);
  return { n: playerName(L, BY_CODE[foreign] ? foreign : L.code, opts.taken), a: age, r, p, c: foreign, y: !!opts.youth };
}
// Un nom de joueur : prénom et initiale du nom, sans doublon dans le club ni sur le marché.
function playerName(L, code, taken) {
  let n = "";
  for (let t = 0; t < 12; t++) { n = `${L.freshName("m", code)} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`; if (!taken || !taken.has(n)) break; }
  if (taken) taken.add(n);
  return n;
}
const namesIn = C => new Set([...(C.squad || []).map(p => p.n), ...(C.market ? C.market.list.map(p => p.n) : [])]);
function clubName(sport) {
  const S = CLUB_SPORTS[sport];
  return S.team ? `${pick(S.names)} ${pick(TEAM_NAMES)}` : `${pick(S.names)} ${pick(CLUB_PLACES)}`;
}
// Un club, à une division donnée : effectif, entraîneur, installations, supporters.
function newClub(L, sport, div) {
  const S = CLUB_SPORTS[sport], B = clubBase(L, sport), lvl = leagueLevel(L, sport, div);
  const taken = new Set(), squad = Array.from({ length: S.n }, () => newPlayer(L, lvl - 4, { taken }));
  return {
    sport, name: clubName(sport), div, cash: B * DIV_REV[div] * 0.35, fans: 30 + (3 - div) * 12,
    stadium: div <= 1 ? 1 : 0, training: div === 0 ? 1 : 0, academy: div <= 1 ? 1 : 0,
    coach: { n: L.freshName("m"), s: clamp(Math.round(lvl - 15 + randn() * 8), 25, 92) },
    squad, history: [], trophies: [], cont: false,
  };
}
const clubOf = b => b.club;
const strengthOf = (C) => { const S = CLUB_SPORTS[C.sport], top = C.squad.map(p => p.r).sort((x, y) => y - x).slice(0, S.start); return top.length ? top.reduce((s, x) => s + x, 0) / Math.max(S.start, top.length) * Math.min(1, top.length / S.start) : 0; };
const squadValue = (B, C) => C.squad.reduce((s, p) => s + playerValue(B, p), 0);

Object.assign(Life.prototype, {
  // Un club qu'on vient de fonder ou de récupérer d'une ancienne sauvegarde : on le crée.
  ensureClub(b) {
    if (b.club) return b.club;
    const sport = BUSINESSES[b.type].sport;
    b.club = newClub(this, sport, b.boughtDiv ?? 2);
    b.label = b.club.name; b.base = BUSINESSES[b.type].label;
    if (b.mode == null) { b.mode = "full"; b.stake = b.stake ?? 1; b.staff = b.club.squad.length; b.morale = 55; b.policy = "pay"; }
    return b.club;
  },
  // Une saison : progression des joueurs, résultats, coupes, finances, centre de formation, offres.
  clubSeason(b) {
    const C = this.ensureClub(b), S = CLUB_SPORTS[C.sport], B = clubBase(this, C.sport), y = this.calYear, divR = DIV_REV[C.div];
    if (b.mode === "managed" && !b.manager) this.hireManager(true);
    if (b.mode === "side") { this.bump("health", -1); this.bump("rel", -1.5); }
    // Les joueurs progressent, plafonnent, déclinent, et prennent leur retraite.
    for (const p of C.squad) {
      p.a += 1;
      // Un joueur tend vers son potentiel (plus vite avec un bon centre d'entraînement), puis décline après 30 ans.
      const dev = p.a <= 21 ? (p.p - p.r) * (0.22 + C.training * 0.06) : p.a <= 26 ? (p.p - p.r) * (0.12 + C.training * 0.04) : p.a <= 30 ? 0 : -(p.a - 30) * 1.3;
      p.r = clamp(Math.round(p.r + dev + randn() * 1.5), 25, p.a <= 30 ? Math.max(p.p, 25) : 99);
    }
    const retired = C.squad.filter(p => p.a >= 34 + Math.round(rand() * 4));
    C.squad = C.squad.filter(p => !retired.includes(p));
    const star = retired.find(p => p.r >= leagueLevel(this, C.sport, C.div) + 6);
    if (star) this.say(`${star.n}, figure de ${C.name}, prend sa retraite à ${star.a} ans.`, "work");
    // Le centre de formation sort ses jeunes.
    if (C.academy > 0) {
      const k = C.academy >= 3 ? 3 : C.academy >= 2 ? 2 : 1;
      for (let i = 0; i < k; i++) {
        const lvl = leagueLevel(this, C.sport, C.div) - 22 + C.academy * 3;
        const kid = newPlayer(this, lvl, { age: 16 + Math.floor(rand() * 3), youth: true, pot: C.academy * 5 + (rand() < 0.05 * C.academy ? 18 : 0), code: this.code, taken: namesIn(C) });
        C.squad.push(kid);
        if (kid.p >= 85) this.say(`Une pépite sort du centre de formation de ${C.name} : ${kid.n}, ${kid.a} ans, promis à un grand avenir.`, "work", true);
      }
    }
    // Un effectif trop court : on complète avec des joueurs libres, sans indemnité.
    while (C.squad.length < Math.ceil(S.n * 0.8)) C.squad.push(newPlayer(this, leagueLevel(this, C.sport, C.div) - 6, { age: 26 + Math.floor(rand() * 6), taken: namesIn(C) }));
    // La saison.
    const lvl = leagueLevel(this, C.sport, C.div), str = strengthOf(C);
    const perf = str + (C.coach.s - 55) / 7 + C.training * 0.8 + (C.fans - 50) / 40 - lvl + randn() * 3.5;
    const rank = clamp(Math.round(10.5 - perf * 1.1 + randn() * 1.5), 1, 20);
    const res = { y, div: C.div, rank, notes: [] };
    let prize = 0;
    if (rank === 1) { C.trophies.push({ y, t: `Champion · ${divName(C.sport, C.div)}` }); res.notes.push(C.div === 0 ? "champion !" : "champion de sa division"); prize += B * divR * 0.15; this.bump("happy", 6); }
    if (C.div <= 1 && rand() < clamp(0.03 + (perf + (1 - C.div) * 4) / 50, 0.01, 0.4)) { C.trophies.push({ y, t: "Coupe nationale" }); res.notes.push("vainqueur de la coupe nationale"); prize += B * 0.05; this.bump("happy", 4); }
    if (C.cont) {
      prize += B * 0.15;
      if (rand() < clamp((str - 80) / 25 + (C.coach.s - 70) / 100, 0.01, 0.35)) { C.trophies.push({ y, t: "Coupe continentale" }); res.notes.push("vainqueur de la coupe continentale !"); prize += B * 0.4; this.bump("happy", 10); this.network += 1; }
      else res.notes.push("parcours en coupe continentale");
    }
    C.cont = C.div === 0 && rank <= 4;
    if (C.cont) res.notes.push("qualifié pour la coupe continentale");
    if (rank <= 3 && C.div > 0) { C.div -= 1; res.notes.push(`promu en ${divName(C.sport, C.div)}`); this.bump("happy", 5); }
    else if (rank >= 18 && C.div < 3) { C.div += 1; res.notes.push(`relégué en ${divName(C.sport, C.div)}`); this.bump("happy", -5); prize += clubExodus(this, C, B, 0.4); }
    // Les supporters suivent les résultats et le stade.
    C.fans = clamp(C.fans + (10.5 - rank) * 0.8 + C.stadium * 0.6 + (30 + (3 - C.div) * 12 - C.fans) * 0.1, 5, 100);
    // Les finances de la saison.
    const tv = B * divR, fansF = 0.5 + C.fans / 100;
    const tickets = B * 0.25 * divR * (0.6 + 0.2 * C.stadium) * fansF, sponsors = B * 0.25 * divR * fansF;
    const wages = C.squad.reduce((s, p) => s + wageFor(B, p.r), 0) + coachWage(B, C.coach.s);
    const upkeep = B * divR * 0.01 * (C.stadium + C.training + C.academy * 1.5);
    const profit = tv + tickets + sponsors + prize - wages - upkeep;
    C.cash += profit;
    res.rev = tv + tickets + sponsors + prize; res.wages = wages; res.profit = profit;
    C.history.push(res); if (C.history.length > 12) C.history.shift();
    const line = `Saison ${y} : ${C.name} termine ${rank === 1 ? "1er" : `${rank}e`} de ${divName(C.sport, res.div)}${res.notes.length ? ` · ${res.notes.join(", ")}` : ""}.`;
    this.say(line, "work", rank === 1 || res.notes.some(n => /promu|relégué|coupe/.test(n)));
    if (C.div === 0 && !b.eliteNoted) { b.eliteNoted = true; this.network += 1; }
    // Valeur du club : son économie, son effectif, sa trésorerie.
    b.value = Math.max(0, (tv + tickets + sponsors) * 1.6 + squadValue(B, C) * 0.5 + C.cash + B * divR * 0.1 * (C.stadium + C.training + C.academy));
    b.mult = profit / Math.max(1, median(this.here) * this.econ);
    b.staff = C.squad.length;
    b.years = (b.years || 0) + 1;
    // Les grands clubs viennent chercher vos meilleurs joueurs.
    const best = [...C.squad].sort((x, z) => playerValue(B, z) - playerValue(B, x))[0];
    if (best && !this.queue.some(d => d.clubOffer) && rand() < (best.r >= lvl + 8 || best.p >= 88 ? 0.45 : 0.12)) {
      const fee = playerValue(B, best) * (1.1 + rand() * 0.6), abroad = pick(["anglais", "espagnol", "italien", "allemand", "français", "américain", "japonais", "saoudien"]);
      this.ask(`Un grand club ${abroad} offre ${money(fee)} pour ${best.n} (${best.a} ans, niveau ${best.r}). Vendre ?`, [
        { label: `Vendre pour ${money(fee)}`, sub: "L’argent va dans la trésorerie du club.", autoWeight: 1.5, apply: () => { if (!C.squad.includes(best)) return; C.squad.splice(C.squad.indexOf(best), 1); C.cash += fee; this.say(`${C.name} vend ${best.n} pour ${money(fee)}.`, "money", true); } },
        { label: "Refuser et le garder", sub: "Les supporters apprécient ; le joueur un peu moins.", autoWeight: 1, apply: () => { if (!C.squad.includes(best)) return; C.fans = clamp(C.fans + 3, 0, 100); best.r = clamp(best.r - 1, 25, 99); this.say(`Refuse de vendre ${best.n}.`, "work"); } },
      ]);
      this.queue[this.queue.length - 1].clubOffer = true;
    }
    // Un trou dans la caisse : le propriétaire doit trancher.
    const floor = -B * divR * 0.35;
    if (C.cash < floor && !this.queue.some(d => d.clubDebt)) {
      const need = -C.cash;
      this.ask(`${C.name} est au bord de la faillite : ${money(need)} de dettes. Que faire ?`, [
        { label: `Renflouer le club (${money(need)})`, sub: this.savings >= need ? "Pris sur votre épargne." : "Vous n’avez pas cette somme : le reste sera emprunté.", autoWeight: this.savings >= need ? 2 : 0.5, apply: () => { this.pay(need); C.cash = 0; this.say(`Renfloue ${C.name} (${money(need)}).`, "money", true); } },
        { label: "Vendre les meilleurs joueurs", sub: "Les dettes sont épongées, l’équipe s’affaiblit.", autoWeight: 1, apply: () => { const s = [...C.squad].sort((x, z) => playerValue(B, z) - playerValue(B, x)); let got = 0; while (C.cash + got < 0 && s.length > S.start) { const p = s.shift(); got += playerValue(B, p) * 0.8; C.squad.splice(C.squad.indexOf(p), 1); } C.cash += got; this.say(`${C.name} vend ses meilleurs joueurs pour éponger ses dettes.`, "work", true); } },
        { label: "Déposer le bilan", sub: "Le club repart deux divisions plus bas, sans dettes ; les meilleurs joueurs s’en vont, les supporters ne pardonnent pas.", autoWeight: 0.5, apply: () => { C.div = Math.min(3, C.div + 2); clubExodus(this, C, B, 1); C.cash = 0; C.fans = clamp(C.fans - 20, 5, 100); C.cont = false; this.bump("happy", -8); this.say(`${C.name} dépose le bilan et repart en ${divName(C.sport, C.div)}.`, "work", true); } },
      ]);
      this.queue[this.queue.length - 1].clubDebt = true;
    }
    // Un club confié à un directeur (ou une vie en mode automatique) : il gère seul le marché.
    if (b.mode === "managed" || this.auto) this.clubAutopilot(b);
    return 0;
  },
  // Le directeur gère : il complète l'équipe si elle est trop faible, vend ce qui coûte trop.
  clubAutopilot(b) {
    const C = b.club, B = clubBase(this, C.sport), lvl = leagueLevel(this, C.sport, C.div);
    if (strengthOf(C) < lvl && C.cash > 0) {
      const m = clubMarket(this, b).filter(p => p.fee <= C.cash * 0.6).sort((x, z) => z.r - x.r)[0];
      if (m) clubBuy(this, b, m, true);
    }
    const extra = C.squad.length - CLUB_SPORTS[C.sport].n;
    if (extra > 0) for (const p of [...C.squad].sort((x, z) => x.r - z.r).slice(0, extra)) { C.squad.splice(C.squad.indexOf(p), 1); C.cash += playerValue(B, p) * 0.7; }
  },
});
// Après une relégation ou un dépôt de bilan, les joueurs trop forts pour la division s'en vont (vendus à bas prix).
function clubExodus(L, C, B, share) {
  const lvl = leagueLevel(L, C.sport, C.div);
  let got = 0; const gone = [];
  for (const p of [...C.squad]) if (p.r >= lvl + 10 && rand() < share) { C.squad.splice(C.squad.indexOf(p), 1); got += playerValue(B, p) * 0.5; gone.push(p.n); }
  if (gone.length) L.say(`Après la chute, ${gone.length > 1 ? `${gone.slice(0, 3).join(", ")}${gone.length > 3 ? " et d’autres" : ""} quittent` : `${gone[0]} quitte`} ${C.name}.`, "work");
  return got;
}
// Le marché des transferts de l'année : quelques joueurs à vendre, à la mesure de la division (et une star).
function clubMarket(L, b) {
  const C = b.club;
  if (C.market && C.market.age === L.age) return C.market.list;
  const B = clubBase(L, C.sport), lvl = leagueLevel(L, C.sport, C.div), taken = new Set(C.squad.map(p => p.n));
  const list = [
    newPlayer(L, lvl + 14, { age: 24 + Math.floor(rand() * 5), taken }), newPlayer(L, lvl + 6, { taken }), newPlayer(L, lvl + 2, { taken }), newPlayer(L, lvl - 2, { age: 18 + Math.floor(rand() * 3), pot: 8, taken }),
    newPlayer(L, lvl + 4, { age: 32 + Math.floor(rand() * 2), taken }), newPlayer(L, lvl - 6, { taken }),
  ].map(p => ({ ...p, fee: Math.round(playerValue(B, p) * (1 + rand() * 0.3)) }));
  list[4].fee = Math.round(list[4].fee * 0.3); list[4].free = true;
  C.market = { age: L.age, list };
  return list;
}
function clubBuy(L, b, m, quiet = false) {
  const C = b.club;
  if (C.cash < m.fee) return "Trésorerie insuffisante : injectez de l’argent dans le club.";
  C.cash -= m.fee;
  const { fee, free, ...p } = m;
  C.squad.push(p);
  C.market.list = C.market.list.filter(x => x !== m);
  L.say(`${C.name} recrute ${p.n} (${p.a} ans, niveau ${p.r}) pour ${money(fee)}.`, "work", !quiet && p.r >= leagueLevel(L, C.sport, C.div) + 8);
  return `${p.n} rejoint ${C.name}`;
}
// Les clubs à racheter : un par sport praticable, à chaque division.
function clubOffers(L) {
  const y = L.calYear, out = [];
  for (const [k, B] of Object.entries(BUSINESSES)) {
    if (!B.sport) continue;
    const S = CLUB_SPORTS[B.sport];
    if (y < (B.from || S.from) || (S.net && L.here.net < S.net) || sportPop(L.code, B.sport) < 0.4 && !["foot", "basket"].includes(B.sport)) continue;
    for (const div of [0, 1, 2]) {
      const base = clubBase(L, B.sport), r = base * DIV_REV[div];
      const price = r * 1.6 + base * 0.08 * Math.exp((leagueLevel(L, B.sport, div) - 74) / 6) * S.n * 0.5 + r * 0.15;
      out.push({ id: `${k}:${div}`, type: k, div, price, label: `${capFirst(S.label)} · un club de ${divName(B.sport, div)}`, sub: `≈ ${money(price)} · revenus ≈ ${money(r * 1.5)} par saison` });
    }
  }
  return out;
}
function buyClub(L, id) {
  const [k, d] = id.split(":"), o = clubOffers(L).find(x => x.id === id);
  if (!o) return null;
  if (L.savings < o.price * 0.5 || (!L.bank && L.savings < o.price)) return "Pas assez d’argent.";
  L.pay(o.price);
  const salaried = !!L.job && !(L.jobInfo && L.jobInfo.id === "business");
  const nb = { type: k, label: BUSINESSES[k].label, base: BUSINESSES[k].label, mult: 0, years: 3, value: o.price, size: 1, mode: salaried || (L.businesses || []).some(x => x.mode === "full") ? "side" : "full", staff: 20, morale: 55, stake: 1, policy: "pay", boughtDiv: +d };
  L.businesses = [...(L.businesses || []), nb];
  L.ensureClub(nb);
  if (nb.mode === "full") { L.job = `président de club (${nb.club.name})`; L.jobInfo = { id: "business", sector: "serv", self: true }; }
  L.say(`Rachète ${nb.club.name}, un club de ${CLUB_SPORTS[nb.club.sport].label} de ${divName(nb.club.sport, nb.club.div)}, pour ${money(o.price)}.`, "money", true);
  L.bump("happy", 6); L.network += 1;
  return `Vous êtes ${L.g("président", "présidente")} de ${nb.club.name}`;
}
ACTIONS.push({ id: "buyclub", cat: "pro", label: "Racheter un club de sport", desc: "Football, basket, rugby, hockey, baseball, cricket, cyclisme, e-sport : un club de première, deuxième ou troisième division, avec son effectif et ses supporters.",
  when: L => L.age < 18 ? "À partir de 18 ans." : planned(L.code, L.calYear) ? "Les clubs appartiennent à l’État dans une économie planifiée." : true,
  choices: L => clubOffers(L).map(o => ({ ...o, disabled: L.savings < o.price * 0.5 || (!L.bank && L.savings < o.price), sub: o.sub + (L.savings < o.price * 0.5 ? " · pas assez d’argent" : L.savings < o.price ? " · le reste emprunté" : "") })),
  run: (L, id) => buyClub(L, id) });

// Une saison de club remplace l'année d'entreprise ordinaire : le club garde ses gains, vous ne touchez que les dividendes.
{
  const run = Life.prototype.runBusiness;
  Life.prototype.runBusiness = function () { const b = this.business; return isClub(b) ? this.clubSeason(b) : run.call(this); };
  const one = oneBusinessHtml;
  oneBusinessHtml = function (L, i, many) {
    const b = L.business;
    if (!isClub(b)) return one(L, i, many);
    const C = L.ensureClub(b), last = C.history[C.history.length - 1];
    const inner = `<div class="sp-card"><div class="sp-main"><b>${esc(C.name)}</b><small>Club de ${esc(CLUB_SPORTS[C.sport].label)} · ${esc(divName(C.sport, C.div))}${last ? ` · ${last.rank === 1 ? "1er" : `${last.rank}e`} la saison passée` : ""} · trésorerie ${eur(C.cash)} · valeur ≈ ${eur(b.value * (b.stake ?? 1))}</small></div></div>
      <div class="sp-pills"><button class="sp-pill" data-open-club="${i}">Gérer le club <span>effectif, transferts, formation, stade</span></button><button class="sp-pill" data-biz="sell" data-bidx="${i}">Vendre le club <span>≈ ${eur(b.value * (b.stake ?? 1))}</span></button></div>`;
    return many ? `<details class="sp-more"${i === 0 ? " open" : ""}><summary><b>${esc(C.name)}</b> <small>${esc(divName(C.sport, C.div))}</small></summary>${inner}</details>` : inner;
  };
}

// --- Les gestes du président -------------------------------------------------------------------
function clubAction(L, i, id, arg) {
  const b = (L.businesses || [])[+i];
  if (!isClub(b) || !L.alive) return null;
  const C = L.ensureClub(b), B = clubBase(L, C.sport), m = median(L.here), divR = DIV_REV[C.div];
  C.did = C.did || {};
  const once = k => { if (C.did[k] === L.age) return false; C.did[k] = L.age; return true; };
  switch (id) {
    case "buy": { const p = clubMarket(L, b)[+arg]; return p ? clubBuy(L, b, p) : null; }
    case "sell": {
      const p = C.squad[+arg]; if (!p) return null;
      if (C.squad.length <= CLUB_SPORTS[C.sport].start) return "Effectif trop court pour vendre.";
      const fee = playerValue(B, p) * (0.85 + rand() * 0.3);
      C.squad.splice(+arg, 1); C.cash += fee;
      L.say(`${C.name} vend ${p.n} (${p.a} ans, niveau ${p.r}) pour ${money(fee)}.`, "money", p.r >= leagueLevel(L, C.sport, C.div) + 8);
      return `${p.n} vendu · +${eur(fee)}`;
    }
    case "infra": {
      const k = arg, lv = C[k] || 0; if (lv >= 3) return "Déjà au maximum.";
      const cost = B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][lv] * (k === "academy" ? 0.5 : 1);
      if (C.cash < cost) return "Trésorerie insuffisante : injectez de l’argent dans le club.";
      if (!once(`infra:${k}`)) return "Déjà fait cette année.";
      C.cash -= cost; C[k] = lv + 1; if (k === "stadium") C.fans = clamp(C.fans + 4, 0, 100);
      L.say(`${C.name} investit : ${INFRA[k][1][C[k]]} (${money(cost)}).`, "work", true);
      return `${INFRA[k][0]} : niveau ${C[k]}`;
    }
    case "coach": {
      const cands = coachCandidates(L, b), c = cands[+arg]; if (!c) return null;
      if (!once("coach")) return "Un seul changement d’entraîneur par an.";
      if (C.cash < c.fee) return "Trésorerie insuffisante.";
      const old = C.coach.n; C.cash -= c.fee; C.coach = { n: c.n, s: c.s };
      L.say(`${C.name} remplace ${old} par ${c.n} au poste d’entraîneur.`, "work", true);
      return `Entraîneur : ${c.n} (${c.s}/100)`;
    }
    case "inject": {
      const x = m * Math.max(1, B * divR * 0.1 / m) * (+arg || 1);
      if (L.savings < x) return "Pas assez d’épargne.";
      L.pay(x); C.cash += x; L.say(`Injecte ${money(x)} dans ${C.name}.`, "money");
      return `+${eur(x)} dans la caisse du club`;
    }
    case "dividend": {
      if (C.cash <= 0) return "Le club n’a pas d’argent à verser.";
      if (!once("dividend")) return "Une fois par an.";
      const x = C.cash * 0.5 * (b.stake ?? 1); C.cash -= C.cash * 0.5; L.addMoney(x); C.fans = clamp(C.fans - 3, 0, 100);
      L.say(`Se verse un dividende de ${C.name} (${money(x)}) ; les supporters grincent des dents.`, "money");
      return `+${eur(x)}`;
    }
    case "promote": { const p = C.squad[+arg]; if (!p) return null; if (!once(`pro:${p.n}`)) return "Déjà fait."; p.r = clamp(p.r + 2, 25, 99); p.pro = true; L.say(`Lance ${p.n}, ${p.a} ans, en équipe première.`, "work"); return `${p.n} en équipe première`; }
    case "fans": {
      const cost = B * divR * 0.04; if (C.cash < cost) return "Trésorerie insuffisante.";
      if (!once("fans")) return "Une fois par an.";
      C.cash -= cost; C.fans = clamp(C.fans + 6, 0, 100); L.say(`${C.name} baisse le prix des places et soigne ses supporters.`, "work");
      return `Supporters ${Math.round(C.fans)}/100`;
    }
  }
  return null;
}
function coachCandidates(L, b) {
  const C = b.club, B = clubBase(L, C.sport), lvl = leagueLevel(L, C.sport, C.div);
  if (C.coachList && C.coachList.age === L.age) return C.coachList.list;
  const list = [lvl - 12, lvl - 2, lvl + 10].map(t => { const s = clamp(Math.round(t + randn() * 5), 25, 97); return { n: L.freshName("m", pick([L.code, L.code, "IT", "ES", "PT", "DE", "AR", "FR", "GB"])), s, fee: coachWage(B, s) * 0.5 }; });
  C.coachList = { age: L.age, list };
  return list;
}

// La feuille « Club » : saison, effectif, transferts, formation, investissements.
function clubHtml(L, i = 0) {
  const b = (L.businesses || [])[+i];
  if (!isClub(b)) return `<p class="sp-note">Pas de club.</p>`;
  const C = L.ensureClub(b), S = CLUB_SPORTS[C.sport], B = clubBase(L, C.sport), lvl = leagueLevel(L, C.sport, C.div), str = strengthOf(C), divR = DIV_REV[C.div];
  const last = C.history[C.history.length - 1], pill = (id, arg, label, sub, dis = false) => `<button class="sp-pill" data-club="${id}" data-cidx="${i}" data-arg="${arg}"${dis ? " disabled" : ""}>${esc(label)}${sub ? ` <span>${esc(sub)}</span>` : ""}</button>`;
  const pl = p => `${esc(p.n)} ${BY_CODE[p.c] ? BY_CODE[p.c].flag : ""} · ${p.a} ans · niveau ${p.r}${p.p > p.r + 2 ? ` (potentiel ${p.p})` : ""}`;
  const squad = [...C.squad].map((p, k) => [p, k]).sort((x, z) => z[0].r - x[0].r);
  const youth = squad.filter(([p]) => p.a <= 20);
  const verdict = str >= lvl + 4 ? "de quoi jouer le haut du tableau" : str >= lvl - 2 ? "une équipe de milieu de tableau" : "une équipe qui risque de descendre";
  return `<div class="sp">
    <p class="sp-head">Saison</p>
    <div class="sp-card"><div class="sp-main"><b>${esc(C.name)} · ${esc(divName(C.sport, C.div))}</b>
      <small>Club de ${esc(S.label)} · force de l’équipe ${Math.round(str)} (niveau de la division ≈ ${Math.round(lvl)}) : ${verdict}${C.cont ? " · qualifié pour la coupe continentale" : ""}</small>
      <small>Entraîneur : ${esc(C.coach.n)} (${C.coach.s}/100) · supporters ${Math.round(C.fans)}/100 · trésorerie ${eur(C.cash)} · valeur ≈ ${eur(b.value * (b.stake ?? 1))}</small>
      ${last ? `<small>Saison ${last.y} : ${last.rank === 1 ? "1er" : `${last.rank}e`} de ${esc(divName(C.sport, last.div))} · recettes ${eur(last.rev)}, salaires ${eur(last.wages)}, ${last.profit >= 0 ? `bénéfice ${eur(last.profit)}` : `perte ${eur(-last.profit)}`}</small>` : `<small>Première saison à venir : le classement tombe à la fin de l’année.</small>`}
      ${C.trophies.length ? `<small>Palmarès : ${C.trophies.slice(-8).map(t => `${esc(t.t)} (${t.y})`).join(" · ")}</small>` : ""}</div></div>
    ${C.history.length > 1 ? `<p class="sp-note">Dernières saisons : ${C.history.slice(-6).map(h => `${h.y} ${h.rank === 1 ? "1er" : `${h.rank}e`} (${["D1", "D2", "D3", "R"][h.div]})`).join(" · ")}</p>` : ""}
    <div class="sp-pills">${pill("inject", 1, "Injecter de l’argent", `≈ ${eur(median(L.here) * Math.max(1, B * divR * 0.1 / median(L.here)))} de votre épargne`)}${pill("dividend", 0, "Se verser un dividende", C.cash > 0 ? `≈ ${eur(C.cash * 0.5 * (b.stake ?? 1))} · supporters −` : "caisse vide", C.cash <= 0)}${pill("fans", 0, "Soigner les supporters", `places moins chères · ≈ ${eur(B * divR * 0.04)}`)}</div>
    <p class="sp-note">Les 3 premiers montent, les 3 derniers descendent ; le champion de première division et les 4 premiers jouent la coupe continentale. Le club garde ses gains dans sa trésorerie : vous touchez seulement ce que vous vous versez.</p>
    <p class="sp-head">Effectif</p>
    <p class="sp-note" style="margin-top:0">${C.squad.length} joueurs · ${S.start} titulaires comptent pour la force de l’équipe · masse salariale ≈ ${eur(C.squad.reduce((s, p) => s + wageFor(B, p.r), 0))} par saison.</p>
    <div class="sp-pills">${squad.map(([p, k]) => pill("sell", k, `${p.n} · ${p.a} ans · ${p.r}${p.p > p.r + 2 ? ` → ${p.p}` : ""}`, `vendre ≈ ${eur(playerValue(B, p))}`, C.squad.length <= S.start)).join("")}</div>
    <p class="sp-head">Transferts</p>
    <p class="sp-note" style="margin-top:0">Le marché de l’année. Les indemnités sont payées par la trésorerie du club (${eur(C.cash)}) ; si elle ne suffit pas, injectez de l’argent (onglet « Saison »).</p>
    <div class="sp-pills">${clubMarket(L, b).map((p, k) => pill("buy", k, pl(p), `${p.free ? "en fin de contrat · " : ""}${eur(p.fee)} · salaire ≈ ${eur(wageFor(B, p.r))}/saison${C.cash < p.fee ? " · caisse du club insuffisante" : ""}`, C.cash < p.fee)).join("") || `<span class="sp-note">Marché vide jusqu’à l’an prochain.</span>`}</div>
    <p class="sp-head">Formation</p>
    <p class="sp-note" style="margin-top:0">${capFirst(INFRA.academy[1][C.academy])}. ${C.academy ? `Chaque saison, ${C.academy >= 3 ? 3 : C.academy >= 2 ? 2 : 1} jeune${C.academy >= 2 ? "s" : ""} sort${C.academy >= 2 ? "ent" : ""} du centre ; les meilleurs deviennent des pépites qu’on garde ou qu’on vend très cher.` : "Sans centre, pas de jeunes formés au club."}</p>
    <div class="sp-pills">${C.academy < 3 ? pill("infra", "academy", `Développer le centre de formation`, `≈ ${eur(B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][C.academy] * 0.5)} · niveau ${C.academy + 1}${C.cash < B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][C.academy] * 0.5 ? " · caisse du club insuffisante" : ""}`, C.cash < B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][C.academy] * 0.5) : ""}${youth.map(([p, k]) => pill("promote", k, `Lancer ${p.n} (${p.a} ans, ${p.r} → ${p.p})`, "en équipe première : niveau +2")).join("")}</div>
    <p class="sp-head">Investir</p>
    <div class="sp-pills">${["stadium", "training"].map(k => C[k] < 3 ? pill("infra", k, `${INFRA[k][0]} : ${INFRA[k][1][C[k] + 1]}`, `≈ ${eur(B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][C[k]])}${k === "stadium" ? " · billetterie et supporters +" : " · progression des joueurs et force +"}${C.cash < B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][C[k]] ? " · caisse du club insuffisante" : ""}`, C.cash < B * Math.max(divR, 0.1) * [0.3, 0.6, 1.2][C[k]]) : `<span class="sp-note">${INFRA[k][0]} : ${INFRA[k][1][3]}.</span>`).join("")}</div>
    <p class="sp-note">Entraîneurs libres : un seul changement par an.</p>
    <div class="sp-pills">${coachCandidates(L, b).map((c, k) => pill("coach", k, `Engager ${c.n}`, `${c.s}/100 · indemnité ≈ ${eur(c.fee)}${C.cash < c.fee ? " · caisse du club insuffisante" : ""}`, C.cash < c.fee)).join("")}</div>
  </div>`;
}
const CLUB_TABS = { order: ["Saison", "Effectif", "Transferts", "Formation", "Investir"], of: h => ["Saison", "Effectif", "Transferts", "Formation", "Investir"].includes(h) ? h : null };
const firstClubIdx = L => (L.businesses || []).findIndex(isClub);

// Les clics dans la feuille « Club ».
{
  const click = spendClick;
  spendClick = function (L, t) {
    const c = t.closest("[data-club]");
    if (c) return clubAction(L, c.dataset.cidx, c.dataset.club, c.dataset.arg) || "Impossible pour l’instant.";
    return click(L, t);
  };
}
// Le tableau de bord : une carte « Club » dès qu'on en possède un.
{
  const dash = dashboardData;
  dashboardData = function (L) {
    const d = dash(L), i = firstClubIdx(L);
    if (i >= 0 && L.alive) { const C = L.ensureClub(L.businesses[i]), last = C.history[C.history.length - 1]; d.status.push({ icon: "leisure", label: "Club", act: `club:${i}`, cta: true, value: `${C.name} · ${divName(C.sport, C.div)}${last ? `, ${last.rank === 1 ? "1er" : `${last.rank}e`}` : ""} ›` }); }
    return d;
  };
}
// « Gérer le club » depuis la fiche de l'entreprise : ouvre la feuille du club (site et app).
if (typeof document !== "undefined") document.addEventListener("click", e => {
  const o = e.target.closest("[data-open-club]");
  if (!o || typeof life === "undefined" || !life) return;
  e.stopPropagation();
  const kind = `club:${o.dataset.openClub}`;
  if (typeof panelSheet === "function") panelSheet(kind); else openPanel(kind);
}, true);
// Fonder un club : seulement les sports qui se pratiquent vraiment ici.
{
  const choices = businessChoices;
  businessChoices = function (L) { return choices(L).filter(o => { const s = BUSINESSES[o.id] && BUSINESSES[o.id].sport; return !s || sportPop(L.code, s) >= 0.4 || s === "foot" || s === "basket"; }); };
}
