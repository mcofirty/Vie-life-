// Gérer un club de sport : fonder ou racheter un club (football, basket, rugby, hockey, baseball,
// cricket, cyclisme, e-sport), jouer les saisons (classement, montées, descentes, coupes), recruter et
// vendre des joueurs, former des jeunes, investir dans le stade et l'entraînement, choisir l'entraîneur.
// Le club a sa propre trésorerie : le propriétaire y injecte de l'argent ou s'y verse un dividende.
// Les vrais clubs des grands championnats (leagues.js) se rachètent ou s'achètent en partie, dans n'importe
// quel pays ; leurs saisons se jouent contre les vrais adversaires, avec la compétition continentale.

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
// L'économie du sport dans un pays : ce que rapporte une saison en première division (hors grands championnats).
function genericBase(L, sport, code = L.code) {
  const c = countryAt(code, L.calYear), S = CLUB_SPORTS[sport];
  return median(c) * S.rev * sportPop(code, sport) * (c.gdp > 20000 ? 1 : 0.5 + c.gdp / 40000) * (code === L.code ? L.econ : 1);
}
// Les championnats sont plus relevés dans les pays riches où le sport est populaire.
const genericLevel = (L, sport, code, div) => DIV_LEVEL[div] + clamp(Math.log(Math.max(countryAt(code, L.calYear).gdp, 1000) / 15000) * 4, -8, 5) + (sportPop(code, sport) < 1 ? -4 : 2);
// La grande ligue d'un club : celle où il joue, sinon celle de son pays (le Canada joue en NHL, l'Europe de l'e-sport en LEC…).
function homeLeague(sport, code, y) {
  const ok = l => l.sport === sport && y >= l.from;
  return REAL_LEAGUES.find(l => ok(l) && !l.world && l.code === code) || REAL_LEAGUES.find(l => ok(l) && !l.world && l.clubs.some(c => c.code === code))
    || (sport === "velo" ? REAL_LEAGUES.find(l => ok(l) && l.id === "wt") : null)
    || (sport === "esport" && BY_CODE[code] && BY_CODE[code].region === "EUR" ? REAL_LEAGUES.find(l => ok(l) && l.id === "lec") : null) || null;
}
const clubLeague = (L, C) => { const lg = C.league ? REAL_LEAGUE_BY_ID[C.league] : homeLeague(C.sport, C.code || L.code, L.calYear); return lg && L.calYear >= lg.from ? lg : null; };
// Recettes d'une grande ligue : moyenne du championnat, plus pour les clubs prestigieux, selon l'économie du pays.
const leagueGrowth = (lg, y) => clamp(countryAt(lg.code, y).gdp / countryAt(lg.code, 2025).gdp, 0.1, 3);
const realRevenue = (lg, prestige, y) => lg.rev * 1e6 * Math.exp((prestige - leagueAvg(lg)) / 7) * leagueGrowth(lg, y);
// La base d'un club (ce que rapporte une saison d'élite, divisée par 1,55) et le niveau de son élite.
function clubB0(L, C) { const lg = clubLeague(L, C); return lg ? realRevenue(lg, C.prestige ?? leagueAvg(lg), L.calYear) / 1.55 : genericBase(L, C.sport, C.code || L.code); }
function divLevel(L, C, div = C.div) { const lg = clubLeague(L, C); return lg ? leagueAvg(lg) - 10 * div : genericLevel(L, C.sport, C.code || L.code, div); }
const divLabel = (L, C, div = C.div) => { const lg = clubLeague(L, C); return div === 0 && lg ? lg.name : divName(C.sport, div); };
const ofDiv = (L, C, div = C.div) => { const lg = clubLeague(L, C); return div === 0 && lg && lg.of ? lg.of : `de ${divLabel(L, C, div)}`; };
// Salaires et valeurs : par rapport à l'élite du pays du club (un joueur fort coûte cher, même en division inférieure).
const ageF = p => p.a <= 22 ? 1 + Math.max(0, p.p - p.r) / 25 : p.a >= 31 ? Math.max(0.15, 1 - (p.a - 30) * 0.15) : 1;
const wageFor = (B0, lvl0, r) => B0 * 0.04 * Math.exp((r - lvl0) / 9);
const playerValue = (B0, lvl0, p) => B0 * 0.12 * Math.exp((p.r - lvl0) / 7) * ageF(p);
const coachWage = (B, s) => B * 0.006 * Math.exp((s - 60) / 12);

function newPlayer(L, level, opts = {}) {
  const age = opts.age ?? clamp(Math.round(17 + rand() * 16), 16, 35);
  const r = clamp(Math.round(level + randn() * 6 + (opts.boost || 0)), 30, 97);
  const p = clamp(Math.round(age <= 21 ? r + 4 + rand() * 16 + (opts.pot || 0) : age <= 25 ? r + rand() * 6 : r), r, 99);
  const home = opts.home && BY_CODE[opts.home] ? opts.home : L.code;
  const foreign = opts.code || (rand() < 0.3 ? pick(["BR", "AR", "FR", "ES", "NG", "SN", "US", "JP", "KR", "DE", "IT", "GB", "RS", "CA", "AU", "CM"]) : home);
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
// Un club, à une division donnée : effectif, entraîneur, installations, supporters. real : un vrai club ({ lg, club }).
function newClub(L, sport, div, real = null) {
  const S = CLUB_SPORTS[sport], code = real ? real.club.code : L.code;
  const C = { sport, code, name: real ? real.club.name : clubName(sport), div, league: real ? real.lg.id : null, real: !!real, history: [], trophies: [], cont: false };
  const lvl = real ? real.club.r : divLevel(L, C, div);
  C.prestige = real ? real.club.r : divLevel(L, C, 0) - 10;
  const B0 = clubB0(L, C), taken = new Set();
  C.squad = Array.from({ length: S.n }, () => newPlayer(L, lvl - 4, { taken, home: code }));
  Object.assign(C, { cash: B0 * DIV_REV[div] * 0.35, fans: real ? clamp(45 + (real.club.r - leagueAvg(real.lg)) * 4, 30, 98) : 30 + (3 - div) * 12,
    stadium: real ? 2 : div <= 1 ? 1 : 0, training: real ? 2 : div === 0 ? 1 : 0, academy: real ? 2 : div <= 1 ? 1 : 0,
    coach: { n: L.freshName("m", BY_CODE[code] ? code : L.code), s: clamp(Math.round(lvl - 15 + randn() * 8), 25, 95) } });
  if (real) {
    const bonus = (C.coach.s - 55) / 7 + C.training * 0.8 + (C.fans - 50) / 40, shift = Math.round(real.club.r - bonus - strengthOf(C));
    for (const p of C.squad) { p.r = clamp(p.r + shift, 30, 97); p.p = Math.max(p.r, clamp(p.p + shift, 30, 99)); }
  }
  return C;
}
const clubOf = b => b.club;
const strengthOf = (C) => { const S = CLUB_SPORTS[C.sport], top = C.squad.map(p => p.r).sort((x, y) => y - x).slice(0, S.start); return top.length ? top.reduce((s, x) => s + x, 0) / Math.max(S.start, top.length) * Math.min(1, top.length / S.start) : 0; };
// La force réelle : l'effectif, plus l'entraîneur, le centre d'entraînement et les supporters.
const effStrength = C => strengthOf(C) + (C.coach.s - 55) / 7 + C.training * 0.8 + (C.fans - 50) / 40;
const squadValue = (B0, lvl0, C) => C.squad.reduce((s, p) => s + playerValue(B0, lvl0, p), 0);
const minority = b => (b.stake ?? 1) < 0.5;
const rankTxt = r => r === 1 ? "1er" : `${r}e`;

Object.assign(Life.prototype, {
  // Un club qu'on vient de fonder ou de récupérer d'une ancienne sauvegarde : on le crée.
  ensureClub(b) {
    if (b.club) { const C = b.club; if (!C.code) C.code = this.code; if (C.prestige == null) C.prestige = divLevel(this, C, 0) - 10; return C; }
    const sport = BUSINESSES[b.type].sport;
    b.club = newClub(this, sport, b.boughtDiv ?? 2);
    b.label = b.club.name; b.base = BUSINESSES[b.type].label;
    if (b.mode == null) { b.mode = "full"; b.stake = b.stake ?? 1; b.staff = b.club.squad.length; b.morale = 55; b.policy = "pay"; }
    return b.club;
  },
  // Une saison : progression des joueurs, résultats (contre les vrais clubs dans une grande ligue), coupes, finances, offres.
  clubSeason(b) {
    const C = this.ensureClub(b), S = CLUB_SPORTS[C.sport], y = this.calYear;
    if (minority(b)) { b.mode = "investor"; b.manager = null; }
    else if (b.mode === "investor") b.mode = "managed";
    if (b.mode === "managed" && !b.manager) this.hireManager(true);
    if (b.mode === "side") { this.bump("health", -1); this.bump("rel", -1.5); }
    // Les joueurs progressent, plafonnent, déclinent, et prennent leur retraite.
    for (const p of C.squad) {
      p.a += 1;
      // Un joueur tend vers son potentiel (plus vite avec un bon centre d'entraînement), puis décline après 30 ans.
      const dev = p.a <= 21 ? (p.p - p.r) * (0.22 + C.training * 0.06) : p.a <= 26 ? (p.p - p.r) * (0.12 + C.training * 0.04) : p.a <= 30 ? 0 : -(p.a - 30) * 1.3;
      p.r = clamp(Math.round(p.r + dev + randn() * 1.5), 25, p.a <= 30 ? Math.max(p.p, 25) : 99);
    }
    const lvl = divLevel(this, C), retired = C.squad.filter(p => p.a >= 34 + Math.round(rand() * 4));
    C.squad = C.squad.filter(p => !retired.includes(p));
    const star = retired.find(p => p.r >= lvl + 6);
    if (star) this.say(`${star.n}, figure de ${C.name}, prend sa retraite à ${star.a} ans.`, "work");
    // Le centre de formation sort ses jeunes.
    if (C.academy > 0) {
      const k = C.academy >= 3 ? 3 : C.academy >= 2 ? 2 : 1;
      for (let i = 0; i < k; i++) {
        const kid = newPlayer(this, lvl - 22 + C.academy * 3, { age: 16 + Math.floor(rand() * 3), youth: true, pot: C.academy * 5 + (rand() < 0.05 * C.academy ? 18 : 0), code: BY_CODE[C.code] ? C.code : this.code, taken: namesIn(C) });
        C.squad.push(kid);
        if (kid.p >= lvl + 8) this.say(`Une pépite sort du centre de formation de ${C.name} : ${kid.n}, ${kid.a} ans, promis à un grand avenir.`, "work", true);
      }
    }
    // Un effectif trop court : on complète avec des joueurs libres, sans indemnité.
    while (C.squad.length < Math.ceil(S.n * 0.8)) C.squad.push(newPlayer(this, lvl - 6, { age: 26 + Math.floor(rand() * 6), taken: namesIn(C), home: C.code }));
    // La saison.
    const lg = clubLeague(this, C), str = strengthOf(C), divR = DIV_REV[C.div], startDiv = C.div;
    // Un seul classement par championnat et par saison : si vous y possédez plusieurs clubs, ils jouent la même saison.
    const T = this.leagueTables = this.leagueTables || {};
    for (const k in T) if (T[k].y !== y) delete T[k];
    const tkey = C.div === 0 && lg ? `${lg.id}:${y}` : null;
    if (tkey && !T[tkey]) {
      const s = Object.fromEntries(lg.clubs.map(x => [x.name, x.r + randn() * 3.5]));
      for (const x of this.businesses || []) if (isClub(x) && x.club && x.club.div === 0 && clubLeague(this, x.club) === lg) s[x.club.name] = effStrength(x.club) + randn() * 3.5;
      T[tkey] = { y, s };
    }
    const mine = tkey && T[tkey].s[C.name] != null ? T[tkey].s[C.name] : effStrength(C) + randn() * 3.5;
    const res = { y, div: C.div, notes: [] };
    let rank, size = 20, rel = 3, champ = null, podium = [];
    if (C.div === 0 && lg) {
      // Contre les vrais clubs du championnat (un club venu d'en bas prend la place du plus faible).
      const ts = T[tkey].s;
      let rivals = lg.clubs.filter(x => x.name !== C.name).map(x => ({ name: x.name, s: ts[x.name] }));
      for (const x of this.businesses || []) if (isClub(x) && x.club && x.club !== C && x.club.div === 0 && clubLeague(this, x.club) === lg && !rivals.some(r => r.name === x.club.name)) rivals.push({ name: x.club.name, s: ts[x.club.name] ?? effStrength(x.club), own: !lg.clubs.some(c => c.name === x.club.name) });
      rivals.sort((x, z) => z.s - x.s);
      // Autant de clubs que dans le vrai championnat : les clubs promus prennent la place des plus faibles.
      while (rivals.length >= lg.clubs.length) { const k = rivals.map(r => !r.own && !(this.businesses || []).some(x => isClub(x) && x.club && x.club.name === r.name)).lastIndexOf(true); rivals.splice(k >= 0 ? k : rivals.length - 1, 1); }
      const table = [...rivals, { name: C.name, s: mine, me: true }].sort((x, z) => z.s - x.s);
      rank = table.findIndex(x => x.me) + 1; size = table.length; rel = lg.rel;
      champ = table[0].me ? null : table[0].name; podium = table.slice(0, 3).map(x => x.me ? C.name : x.name);
    } else {
      rank = clamp(Math.round(10.5 - (mine - lvl) * 1.1 + randn() * 1.5), 1, 20);
    }
    res.rank = rank; res.size = size; res.podium = podium;
    const B0 = clubB0(this, C), lvl0 = divLevel(this, C, 0);
    let prize = 0;
    if (rank === 1) { C.trophies.push({ y, t: `Champion · ${divLabel(this, C)}` }); res.notes.push(C.div === 0 ? "champion !" : "champion de sa division"); prize += B0 * divR * 0.15; this.bump("happy", 6); }
    else if (champ) res.notes.push(`titre pour ${champ}`);
    const hasCup = !["velo", "esport"].includes(C.sport) && !(lg && lg.rel === 0);
    if (hasCup && C.div <= 1 && rand() < clamp(0.03 + (mine - lvl + (1 - C.div) * 4) / 50, 0.01, 0.4)) { C.trophies.push({ y, t: "Coupe nationale" }); res.notes.push("vainqueur de la coupe nationale"); prize += B0 * 0.05; this.bump("happy", 4); }
    // La compétition continentale, contre les meilleurs clubs des autres grandes ligues.
    if (C.cont) prize += clubContinental(this, C, mine, res, B0);
    const contName = lg && lg.cont && contOpen(lg.cont, y) ? REAL_CONTS[lg.cont] : !lg ? "la coupe continentale" : null;
    const spots = lg && lg.cont ? lg.spots : 4;
    C.cont = C.div === 0 && !!contName && rank <= spots;
    C.contName = contName;
    if (C.cont && spots < 99) res.notes.push(`qualifié pour ${contName}`);
    if (rank <= 3 && C.div > 0) { C.div -= 1; res.notes.push(`promu en ${divLabel(this, C)}`); this.bump("happy", 5); }
    else if (rel > 0 && rank > size - rel && C.div < 3) { C.div += 1; res.notes.push(`relégué en ${divLabel(this, C)}`); this.bump("happy", -5); prize += clubExodus(this, C, B0, lvl0, 0.4); }
    // Les supporters suivent les résultats et le stade ; le prestige suit l'équipe.
    const topShare = (rank - 1) / Math.max(1, size - 1);
    C.fans = clamp(C.fans + (0.5 - topShare) * 16 + C.stadium * 0.6 + (30 + (3 - C.div) * 12 - C.fans) * 0.1, 5, 100);
    C.prestige += (str - C.prestige) * 0.08 + (rank === 1 ? 0.6 : 0);
    // Les finances de la saison (division de départ).
    const fansF = 0.5 + C.fans / 100, tv = B0 * divR;
    const tickets = B0 * 0.25 * divR * (0.6 + 0.2 * C.stadium) * fansF, sponsors = B0 * 0.25 * divR * fansF;
    const wages = C.squad.reduce((s2, p) => s2 + wageFor(B0, lvl0, p.r), 0) + coachWage(B0, C.coach.s);
    const upkeep = B0 * divR * 0.01 * (C.stadium + C.training + C.academy * 1.5) + (tv + tickets + sponsors) * 0.2;
    const profit = tv + tickets + sponsors + prize - wages - upkeep;
    C.cash += profit;
    res.rev = tv + tickets + sponsors + prize; res.wages = wages; res.costs = upkeep; res.profit = profit; res.div = startDiv;
    C.history.push(res); if (C.history.length > 12) C.history.shift();
    this.say(`Saison ${y} : ${C.name} termine ${rankTxt(rank)} ${ofDiv(this, C, startDiv)}${res.notes.length ? ` · ${res.notes.join(", ")}` : ""}.`, "work", rank === 1 || res.notes.some(n => /promu|relégué|vainqueur|remporte|finale/.test(n)));
    if (C.div === 0 && !b.eliteNoted) { b.eliteNoted = true; this.network += 1; }
    // Investisseur minoritaire : un dividende chaque saison bénéficiaire.
    if (minority(b) && profit > 0) { const d = profit * 0.2; C.cash -= d; this.addMoney(d * (b.stake ?? 1)); }
    // Valeur du club : ses recettes (au prix du marché de sa ligue), son effectif, sa trésorerie.
    const lgNow = clubLeague(this, C);
    b.value = Math.max(0, (tv + tickets + sponsors) * (lgNow && C.div === 0 ? lgNow.x : 1.6) + squadValue(B0, lvl0, C) * 0.2 + C.cash);
    b.mult = profit / Math.max(1, median(this.here) * this.econ);
    b.staff = C.squad.length;
    b.years = (b.years || 0) + 1;
    // Les grands clubs viennent chercher vos meilleurs joueurs (le propriétaire majoritaire décide).
    const best = [...C.squad].sort((x, z) => playerValue(B0, lvl0, z) - playerValue(B0, lvl0, x))[0];
    if (best && !minority(b) && !this.queue.some(d => d.clubOffer) && rand() < (best.r >= lvl + 8 || best.p >= lvl0 + 6 ? 0.4 : 0.1)) {
      const buyer = pickBuyer(this, C, best), fee = playerValue(B0, lvl0, best) * (1.1 + rand() * 0.6);
      this.ask(`${buyer} offre ${money(fee)} pour ${best.n} (${best.a} ans, niveau ${best.r}). Vendre ?`, [
        { label: `Vendre pour ${money(fee)}`, sub: "L’argent va dans la trésorerie du club.", autoWeight: 1.5, apply: () => { if (!C.squad.includes(best)) return; C.squad.splice(C.squad.indexOf(best), 1); C.cash += fee; this.say(`${C.name} vend ${best.n} à ${buyer} pour ${money(fee)}.`, "money", true); } },
        { label: "Refuser et le garder", sub: "Les supporters apprécient ; le joueur un peu moins.", autoWeight: 1, apply: () => { if (!C.squad.includes(best)) return; C.fans = clamp(C.fans + 3, 0, 100); best.r = clamp(best.r - 1, 25, 99); this.say(`Refuse de vendre ${best.n} à ${buyer}.`, "work"); } },
      ]);
      this.queue[this.queue.length - 1].clubOffer = true;
    }
    // Un trou dans la caisse : le propriétaire majoritaire doit trancher (un minoritaire voit le majoritaire renflouer).
    const floor = -B0 * DIV_REV[C.div] * 0.35;
    if (C.cash < floor && minority(b)) { C.cash = 0; this.say(`Le propriétaire majoritaire renfloue ${C.name} ; vos parts sont diluées.`, "money"); b.stake = (b.stake ?? 1) * 0.85; }
    else if (C.cash < floor && !this.queue.some(d => d.clubDebt)) {
      const need = -C.cash;
      this.ask(`${C.name} est au bord de la faillite : ${money(need)} de dettes. Que faire ?`, [
        { label: `Renflouer le club (${money(need)})`, sub: this.savings >= need ? "Pris sur votre épargne." : "Vous n’avez pas cette somme : le reste sera emprunté.", autoWeight: this.savings >= need ? 2 : 0.5, apply: () => { this.pay(need); C.cash = 0; this.say(`Renfloue ${C.name} (${money(need)}).`, "money", true); } },
        { label: "Vendre les meilleurs joueurs", sub: "Les dettes sont épongées, l’équipe s’affaiblit.", autoWeight: 1, apply: () => { const s2 = [...C.squad].sort((x, z) => playerValue(B0, lvl0, z) - playerValue(B0, lvl0, x)); let got = 0; while (C.cash + got < 0 && s2.length > S.start) { const p = s2.shift(); got += playerValue(B0, lvl0, p) * 0.8; C.squad.splice(C.squad.indexOf(p), 1); } C.cash += got; this.say(`${C.name} vend ses meilleurs joueurs pour éponger ses dettes.`, "work", true); } },
        { label: "Déposer le bilan", sub: "Le club repart deux divisions plus bas, sans dettes ; les meilleurs joueurs s’en vont, les supporters ne pardonnent pas.", autoWeight: 0.5, apply: () => { C.div = Math.min(3, C.div + 2); clubExodus(this, C, B0, lvl0, 1); C.cash = 0; C.fans = clamp(C.fans - 20, 5, 100); C.cont = false; this.bump("happy", -8); this.say(`${C.name} dépose le bilan et repart en ${divLabel(this, C)}.`, "work", true); } },
      ]);
      this.queue[this.queue.length - 1].clubDebt = true;
    }
    // Un club confié à un directeur, géré par un majoritaire, ou une vie en mode automatique : le marché se gère seul.
    if (b.mode === "managed" || b.mode === "investor" || this.auto) this.clubAutopilot(b);
    return 0;
  },
  // Le directeur gère : il complète l'équipe si elle est trop faible, vend ce qui coûte trop.
  clubAutopilot(b) {
    const C = b.club, B0 = clubB0(this, C), lvl0 = divLevel(this, C, 0), lvl = divLevel(this, C);
    if (strengthOf(C) < lvl && C.cash > 0) {
      const m = clubMarket(this, b).filter(p => p.fee <= C.cash * 0.6).sort((x, z) => z.r - x.r)[0];
      if (m) clubBuy(this, b, m, true);
    }
    const extra = C.squad.length - CLUB_SPORTS[C.sport].n;
    if (extra > 0) for (const p of [...C.squad].sort((x, z) => x.r - z.r).slice(0, extra)) { C.squad.splice(C.squad.indexOf(p), 1); C.cash += playerValue(B0, lvl0, p) * 0.7; }
  },
});
// Les compétitions continentales n'existent qu'à certaines époques.
const CONT_YEARS = { "foot-eu": [1955, 9999], "basket-eu": [1958, 9999], "rugby-eu": [1995, 9999], "hockey-eu": [2014, 9999], "baseball-as": [2005, 9999], "cricket-t20": [2009, 2014], "velo-tdf": [1903, 9999], "esport-w": [2011, 9999] };
const contOpen = (id, y) => { const r = CONT_YEARS[id]; return !r || (y >= r[0] && y <= r[1]); };
// La compétition continentale : des tours à élimination directe contre les qualifiés des autres grandes ligues.
function clubContinental(L, C, mine, res, B0) {
  const lg = clubLeague(L, C), y = L.calYear, name = C.contName || "la coupe continentale";
  let pool = lg && lg.cont ? REAL_LEAGUES.filter(l => l.cont === lg.cont && y >= l.from).flatMap(l => l.clubs.slice(0, l.spots).map(c => ({ ...c, from: l.name }))).filter(c => c.name !== C.name) : [];
  if (!pool.length) pool = Array.from({ length: 16 }, () => ({ name: "un grand club étranger", r: divLevel(L, C, 0) + 4 + randn() * 4 }));
  pool.sort((x, z) => z.r - x.r);
  const rounds = lg && lg.cont === "velo-tdf" ? ["la course"] : ["les huitièmes de finale", "les quarts de finale", "les demi-finales", "la finale"];
  let prize = B0 * 0.1;
  if (rounds.length === 1) {
    const best = pool[0], win = mine + randn() * 4 > best.r + 2 + randn() * 4;
    if (win) { C.trophies.push({ y, t: capFirst(name.replace(/^(le |la |l’)/, "")) }); res.notes.push(`remporte ${name} !`); prize += B0 * 0.4; L.bump("happy", 10); L.network += 1; }
    else res.notes.push(`${name} revient à ${best.name}`);
    return prize;
  }
  for (let i = 0; i < rounds.length; i++) {
    const strong = pool.slice(0, Math.max(2, Math.ceil(pool.length / (2 ** (rounds.length - 1 - i)) / 2)));
    const opp = pick(strong.length ? strong : pool);
    if (mine + randn() * 4 > opp.r + randn() * 4) { prize += B0 * 0.04; continue; }
    res.notes.push(i === rounds.length - 1 ? `finaliste ${deLabel(name)}, battu par ${opp.name}` : `éliminé ${deLabel(name)} en ${rounds[i].replace(/^les |^la /, "")} par ${opp.name}`);
    return prize;
  }
  const fin = pick(pool.slice(0, 4));
  C.trophies.push({ y, t: capFirst(name.replace(/^(le |la |l’)/, "")) });
  res.notes.push(`remporte ${name}${fin ? ` en battant ${fin.name} en finale` : ""} !`);
  L.bump("happy", 10); L.network += 1;
  return prize + B0 * 0.4;
}
// Qui vient acheter : un vrai grand club plus fort que le vôtre (sinon un grand club étranger).
function pickBuyer(L, C, p) {
  const pool = REAL_LEAGUES.filter(l => l.sport === C.sport && L.calYear >= l.from).flatMap(l => l.clubs.slice(0, 4)).filter(c => c.name !== C.name && c.r >= p.r - 4);
  return pool.length ? pick(pool).name : "Un grand club étranger";
}
// Après une relégation ou un dépôt de bilan, les joueurs trop forts pour la division s'en vont (vendus à bas prix).
function clubExodus(L, C, B0, lvl0, share) {
  const lvl = divLevel(L, C);
  let got = 0; const gone = [];
  for (const p of [...C.squad]) if (p.r >= lvl + 10 && rand() < share) { C.squad.splice(C.squad.indexOf(p), 1); got += playerValue(B0, lvl0, p) * 0.5; gone.push(p.n); }
  if (gone.length) L.say(`Après la chute, ${gone.length > 1 ? `${gone.slice(0, 3).join(", ")}${gone.length > 3 ? " et d’autres" : ""} quittent` : `${gone[0]} quitte`} ${C.name}.`, "work");
  return got;
}
// Le marché des transferts de l'année : quelques joueurs à vendre, à la mesure de la division (et une star).
function clubMarket(L, b) {
  const C = b.club;
  if (C.market && C.market.age === L.age) return C.market.list;
  const B0 = clubB0(L, C), lvl0 = divLevel(L, C, 0), lvl = divLevel(L, C), taken = new Set(C.squad.map(p => p.n)), home = C.code;
  const list = [
    newPlayer(L, lvl + 14, { age: 24 + Math.floor(rand() * 5), taken, home }), newPlayer(L, lvl + 6, { taken, home }), newPlayer(L, lvl + 2, { taken, home }), newPlayer(L, lvl - 2, { age: 18 + Math.floor(rand() * 3), pot: 8, taken, home }),
    newPlayer(L, lvl + 4, { age: 32 + Math.floor(rand() * 2), taken, home }), newPlayer(L, lvl - 6, { taken, home }),
  ].map(p => ({ ...p, fee: Math.round(playerValue(B0, lvl0, p) * (1 + rand() * 0.3)) }));
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
  L.say(`${C.name} recrute ${p.n} (${p.a} ans, niveau ${p.r}) pour ${money(fee)}.`, "work", !quiet && p.r >= divLevel(L, C) + 8);
  return `${p.n} rejoint ${C.name}`;
}

// --- Racheter un club, ou y investir, dans n'importe quel pays -----------------------------------
const clubType = sport => Object.keys(BUSINESSES).find(k => BUSINESSES[k].sport === sport);
const realPrice = (lg, club, y) => realRevenue(lg, club.r, y) * lg.x;
const STAKES = [[1, "Racheter le club (100 %)", "Vous décidez de tout."], [0.51, "Prendre la majorité (51 %)", "Vous décidez de tout, avec d’autres actionnaires."], [0.25, "Investir : 25 % des parts", "Actionnaire minoritaire : un dividende chaque saison bénéficiaire, sans gérer le club."]];
const canPay = (L, x) => L.savings >= x * 0.5 && (L.bank || L.savings >= x);
// Les choix : les grandes ligues de chaque sport (vrais clubs, tous pays), et des clubs plus modestes du pays.
function clubOffers(L) {
  const y = L.calYear, out = [];
  for (const lg of REAL_LEAGUES) {
    if (y < lg.from) continue;
    const prices = lg.clubs.map(c => realPrice(lg, c, y)), lo = Math.min(...prices), hi = Math.max(...prices);
    const cont = lg.cont && contOpen(lg.cont, y) ? `qualifie pour ${REAL_CONTS[lg.cont]}` : "pas de compétition continentale";
    out.push({ id: `lg:${lg.id}`, label: `${capFirst(CLUB_SPORTS[lg.sport].label)} · ${lg.name} (${lg.where})`, sub: `${lg.clubs.length} clubs · de ${money(lo)} à ${money(hi)} pour 100 % (25 % dès ${money(lo * 0.25)}) · ${cont}`, cheapest: lo * 0.25 });
  }
  for (const [k, B] of Object.entries(BUSINESSES)) {
    if (!B.sport) continue;
    const S = CLUB_SPORTS[B.sport];
    if (y < (B.from || S.from) || (S.net && L.here.net < S.net) || sportPop(L.code, B.sport) < 0.4 && !["foot", "basket"].includes(B.sport)) continue;
    const big = homeLeague(B.sport, L.code, y);
    for (const div of big ? [1, 2] : [0, 1, 2]) {
      const C = { sport: B.sport, code: L.code }, base = genericBase(L, B.sport), r = base * DIV_REV[div];
      const price = r * 1.6 + base * 0.12 * Math.exp((divLevel(L, C, div) - divLevel(L, C, 0)) / 7) * S.n * 0.2 + r * 0.15;
      out.push({ id: `${k}:${div}`, type: k, div, price, cheapest: price, label: `${capFirst(S.label)} · un club de ${divName(B.sport, div)} ${inCountry(L.here)}`, sub: `≈ ${money(price)} · revenus ≈ ${money(r * 1.5)} par saison${big && div === 1 ? ` · 3 montées par an vers ${big.name}` : ""}` });
    }
  }
  return out;
}
// Choisir le club d'une grande ligue, puis la part à prendre.
function askRealClub(L, lgId) {
  const lg = REAL_LEAGUE_BY_ID[lgId], y = L.calYear;
  const owned = new Set((L.businesses || []).filter(isClub).map(b => b.club && b.club.name));
  const list = lg.clubs.map(c => ({ c, price: realPrice(lg, c, y) })).filter(o => !owned.has(o.c.name) && canPay(L, o.price * 0.25));
  if (!list.length) { const lo = Math.min(...lg.clubs.map(c => realPrice(lg, c, y))); return `Aucun club (${lg.name}) n’est à votre portée : il faut au moins ≈ ${money(lo * 0.25 * 0.5)} pour 25 % du moins cher.`; }
  L.ask(`${lg.name} (${lg.where}) : quel club ?${list.length < lg.clubs.length ? ` (${list.length} sur ${lg.clubs.length} à votre portée)` : ""}`, [
    ...list.map(({ c, price }) => ({ label: `${c.name} ${BY_CODE[c.code] ? BY_CODE[c.code].flag : ""}`, sub: `≈ ${money(price)} pour 100 % · niveau ${c.r}${c.code !== lg.code ? ` · ${inCountry(BY_CODE[c.code])}` : ""}`, autoWeight: 1, apply: () => askStake(L, lg, c, price) })),
    { label: "Renoncer", autoWeight: 0.2, apply: () => L.say(`Renonce à investir dans un club (${lg.name}).`, "money") },
  ]);
  return `${lg.name} : choisissez le club.`;
}
function askStake(L, lg, c, price) {
  const opts = STAKES.filter(([st]) => canPay(L, price * st)).map(([st, label, sub]) => ({ label, sub: `≈ ${money(price * st)} · ${sub}`, autoWeight: st, apply: () => buyRealClub(L, lg, c, st, price) }));
  if (!opts.length) { L.say(`N’a pas les moyens d’entrer au capital de ${c.name}.`, "money"); return; }
  L.ask(`${c.name} : quelle part du club ?`, [...opts, { label: "Renoncer", autoWeight: 0.2, apply: () => L.say(`Renonce à investir dans ${c.name}.`, "money") }]);
}
function newClubBusiness(L, sport, stake, extra = {}) {
  const k = clubType(sport), salaried = !!L.job && !(L.jobInfo && L.jobInfo.id === "business");
  return { type: k, label: BUSINESSES[k].label, base: BUSINESSES[k].label, mult: 0, years: 3, value: 0, size: 1, staff: 20, morale: 55, stake, policy: "pay",
    mode: stake < 0.5 ? "investor" : salaried || (L.businesses || []).some(x => x.mode === "full") ? "side" : "full", ...extra };
}
function buyRealClub(L, lg, c, stake, price) {
  if ((L.businesses || []).some(b => isClub(b) && b.club && b.club.name === c.name)) return;
  if (!canPay(L, price * stake)) { L.say(`N’a pas les moyens d’entrer au capital de ${c.name}.`, "money"); return; }
  L.pay(price * stake);
  const nb = newClubBusiness(L, lg.sport, stake, { value: price });
  nb.club = newClub(L, lg.sport, 0, { lg, club: c });
  nb.label = c.name;
  L.businesses = [...(L.businesses || []), nb];
  if (nb.mode === "full") { L.job = `${L.g("président", "présidente")} de club (${c.name})`; L.jobInfo = { id: "business", sector: "serv", self: true }; }
  const where = c.code !== L.code ? ` ${inCountry(BY_CODE[c.code])}` : "";
  L.say(stake >= 1 ? `Rachète ${c.name}${where} (${lg.name}) pour ${money(price)}.` : `Prend ${Math.round(stake * 100)} % de ${c.name}${where} (${lg.name}) pour ${money(price * stake)}.`, "money", true);
  L.bump("happy", stake >= 0.5 ? 6 : 3); L.network += stake >= 0.5 ? 1.5 : 0.5;
}
function buyClub(L, id) {
  if (id.startsWith("lg:")) return askRealClub(L, id.slice(3));
  const [k, d] = id.split(":"), o = clubOffers(L).find(x => x.id === id);
  if (!o) return null;
  if (!canPay(L, o.price)) return "Pas assez d’argent.";
  L.pay(o.price);
  const nb = newClubBusiness(L, BUSINESSES[k].sport, 1, { value: o.price, boughtDiv: +d });
  L.businesses = [...(L.businesses || []), nb];
  L.ensureClub(nb);
  if (nb.mode === "full") { L.job = `${L.g("président", "présidente")} de club (${nb.club.name})`; L.jobInfo = { id: "business", sector: "serv", self: true }; }
  L.say(`Rachète ${nb.club.name}, un club de ${CLUB_SPORTS[nb.club.sport].label} de ${divName(nb.club.sport, nb.club.div)}, pour ${money(o.price)}.`, "money", true);
  L.bump("happy", 6); L.network += 1;
  return `Vous êtes ${L.g("président", "présidente")} de ${nb.club.name}`;
}
ACTIONS.push({ id: "buyclub", cat: "pro", label: "Racheter un club de sport", desc: "Les vrais clubs des grands championnats, dans n’importe quel pays (football, basket, rugby, hockey, baseball, cricket, cyclisme, e-sport) : le racheter, en prendre la majorité ou y investir 25 %. Ou un club plus modeste du pays.",
  when: L => L.age < 18 ? "À partir de 18 ans." : planned(L.code, L.calYear) ? "Les clubs appartiennent à l’État dans une économie planifiée." : true,
  choices: L => clubOffers(L).map(o => ({ ...o, disabled: !canPay(L, o.cheapest), sub: o.sub + (!canPay(L, o.cheapest) ? " · pas assez d’argent" : "") })),
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
    const inner = `<div class="sp-card"><div class="sp-main"><b>${esc(C.name)} ${BY_CODE[C.code] ? BY_CODE[C.code].flag : ""}</b><small>Club de ${esc(CLUB_SPORTS[C.sport].label)} · ${esc(divLabel(L, C))}${last ? ` · ${rankTxt(last.rank)} la saison passée` : ""} · ${minority(b) ? `vous détenez ${Math.round((b.stake ?? 1) * 100)} % · ` : ""}trésorerie ${eur(C.cash)} · votre part ≈ ${eur(b.value * (b.stake ?? 1))}</small></div></div>
      <div class="sp-pills"><button class="sp-pill" data-open-club="${i}">${minority(b) ? "Voir le club" : "Gérer le club"} <span>${minority(b) ? "saison, effectif, résultats" : "effectif, transferts, formation, stade"}</span></button><button class="sp-pill" data-biz="sell" data-bidx="${i}">${minority(b) ? "Vendre vos parts" : "Vendre le club"} <span>≈ ${eur(b.value * (b.stake ?? 1))}</span></button></div>`;
    return many ? `<details class="sp-more"${i === 0 ? " open" : ""}><summary><b>${esc(C.name)}</b> <small>${esc(divLabel(L, C))}</small></summary>${inner}</details>` : inner;
  };
}

// --- Les gestes du président -------------------------------------------------------------------
function clubAction(L, i, id, arg) {
  const b = (L.businesses || [])[+i];
  if (!isClub(b) || !L.alive) return null;
  const C = L.ensureClub(b), B = clubB0(L, C), lvl0 = divLevel(L, C, 0), m = median(L.here), divR = DIV_REV[C.div];
  C.did = C.did || {};
  const once = k => { if (C.did[k] === L.age) return false; C.did[k] = L.age; return true; };
  if (minority(b) && id !== "upstake") return "Vous êtes actionnaire minoritaire : c’est le propriétaire majoritaire qui décide.";
  switch (id) {
    case "upstake": {
      const add = 0.51 - (b.stake ?? 1), cost = b.value * add * 1.1;
      if (add <= 0) return null;
      if (!canPay(L, cost)) return "Pas assez d’argent pour prendre la majorité.";
      L.pay(cost); b.stake = 0.51; b.mode = !!L.job && !(L.jobInfo && L.jobInfo.id === "business") ? "side" : "full";
      L.say(`Prend la majorité de ${C.name} (51 %) pour ${money(cost)}.`, "money", true); L.network += 1;
      return `Vous dirigez ${C.name}`;
    }
    case "buy": { const p = clubMarket(L, b)[+arg]; return p ? clubBuy(L, b, p) : null; }
    case "sell": {
      const p = C.squad[+arg]; if (!p) return null;
      if (C.squad.length <= CLUB_SPORTS[C.sport].start) return "Effectif trop court pour vendre.";
      const fee = playerValue(B, lvl0, p) * (0.85 + rand() * 0.3), buyer = pickBuyer(L, C, p);
      C.squad.splice(+arg, 1); C.cash += fee;
      L.say(`${C.name} vend ${p.n} (${p.a} ans, niveau ${p.r}) à ${buyer} pour ${money(fee)}.`.replace(" à Un grand", " à un grand"), "money", p.r >= divLevel(L, C) + 8);
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
  const C = b.club, B = clubB0(L, C), lvl = divLevel(L, C);
  if (C.coachList && C.coachList.age === L.age) return C.coachList.list;
  const list = [lvl - 12, lvl - 2, lvl + 10].map(t => { const s = clamp(Math.round(t + randn() * 5), 25, 97); return { n: L.freshName("m", pick([BY_CODE[C.code] ? C.code : L.code, L.code, "IT", "ES", "PT", "DE", "AR", "FR", "GB"])), s, fee: coachWage(B, s) * 0.5 }; });
  C.coachList = { age: L.age, list };
  return list;
}

// La feuille « Club » : saison, effectif, transferts, formation, investissements.
function clubHtml(L, i = 0) {
  const b = (L.businesses || [])[+i];
  if (!isClub(b)) return `<p class="sp-note">Pas de club.</p>`;
  const C = L.ensureClub(b), S = CLUB_SPORTS[C.sport], B = clubB0(L, C), lvl0 = divLevel(L, C, 0), lvl = divLevel(L, C), str = strengthOf(C), divR = DIV_REV[C.div], ro = minority(b), lg = clubLeague(L, C);
  const last = C.history[C.history.length - 1], pill = (id, arg, label, sub, dis = false) => `<button class="sp-pill" data-club="${id}" data-cidx="${i}" data-arg="${arg}"${dis || ro ? " disabled" : ""}>${esc(label)}${sub ? ` <span>${esc(ro ? "réservé au propriétaire majoritaire" : sub)}</span>` : ""}</button>`;
  const pl = p => `${esc(p.n)} ${BY_CODE[p.c] ? BY_CODE[p.c].flag : ""} · ${p.a} ans · niveau ${p.r}${p.p > p.r + 2 ? ` (potentiel ${p.p})` : ""}`;
  const squad = [...C.squad].map((p, k) => [p, k]).sort((x, z) => z[0].r - x[0].r);
  const youth = squad.filter(([p]) => p.a <= 20);
  // Le pronostic : contre les vrais adversaires dans une grande ligue, sinon face au niveau de la division.
  const eff = effStrength(C), size = C.div === 0 && lg ? lg.clubs.length : 20;
  const guess = C.div === 0 && lg ? 1 + lg.clubs.filter(x => x.name !== C.name && x.r > eff).length : clamp(Math.round(10.5 - (eff - lvl) * 1.1), 1, 20);
  const verdict = guess === 1 ? "favori pour le titre" : guess <= 4 ? `pronostic : ${rankTxt(guess)} (haut de tableau)` : guess <= size * 0.6 ? `pronostic : ${rankTxt(guess)} (milieu de tableau)` : `pronostic : ${rankTxt(guess)} (risque de ${lg && lg.rel === 0 ? "finir en bas" : "descendre"})`;
  return `<div class="sp">
    <p class="sp-head">Saison</p>
    <div class="sp-card"><div class="sp-main"><b>${esc(C.name)} ${BY_CODE[C.code] ? BY_CODE[C.code].flag : ""} · ${esc(divLabel(L, C))}</b>
      <small>Club de ${esc(S.label)}${C.code !== L.code && BY_CODE[C.code] ? ` ${esc(inCountry(BY_CODE[C.code]))}` : ""} · force ${Math.round(eff)} (effectif ${Math.round(str)}, avec l’entraîneur, le centre et les supporters ; niveau ${C.div === 0 && lg ? "moyen du championnat" : "de la division"} ≈ ${Math.round(lvl)}) · ${verdict}${C.cont ? ` · qualifié pour ${esc(C.contName || "la coupe continentale")}` : ""}${ro ? ` · vous détenez ${Math.round((b.stake ?? 1) * 100)} % des parts` : ""}</small>
      <small>Entraîneur : ${esc(C.coach.n)} (${C.coach.s}/100) · supporters ${Math.round(C.fans)}/100 · trésorerie ${eur(C.cash)} · valeur ≈ ${eur(b.value * (b.stake ?? 1))}</small>
      ${last ? `<small>Saison ${last.y} : ${rankTxt(last.rank)} sur ${last.size || 20} ${esc(ofDiv(L, C, last.div))}${last.podium && last.podium.length ? ` · podium : ${esc(last.podium.join(", "))}` : ""} · recettes ${eur(last.rev)}, salaires ${eur(last.wages)}, frais ${eur(last.costs || 0)}, ${last.profit >= 0 ? `bénéfice ${eur(last.profit)}` : `perte ${eur(-last.profit)}`}</small>` : `<small>Première saison à venir : le classement tombe à la fin de l’année.</small>`}
      ${C.trophies.length ? `<small>Palmarès : ${C.trophies.slice(-8).map(t => `${esc(t.t)} (${t.y})`).join(" · ")}</small>` : ""}</div></div>
    ${C.history.length > 1 ? `<p class="sp-note">Dernières saisons : ${C.history.slice(-6).map(h => `${h.y} ${rankTxt(h.rank)} (${["D1", "D2", "D3", "R"][h.div]})`).join(" · ")}</p>` : ""}
    ${ro ? `<p class="sp-note">Actionnaire minoritaire : le propriétaire majoritaire gère le club ; vous touchez 20 % des bénéfices de chaque saison, au prorata de vos parts.</p>` : ""}${typeof stakePills === "function" ? stakePills(L, b, i) : ""}
    <div class="sp-pills">${pill("inject", 1, "Injecter de l’argent", `≈ ${eur(median(L.here) * Math.max(1, B * divR * 0.1 / median(L.here)))} de votre épargne`)}${pill("dividend", 0, "Se verser un dividende", C.cash > 0 ? `≈ ${eur(C.cash * 0.5 * (b.stake ?? 1))} · supporters −` : "caisse vide", C.cash <= 0)}${pill("fans", 0, "Soigner les supporters", `places moins chères · ≈ ${eur(B * divR * 0.04)}`)}</div>
    <p class="sp-note">${C.div === 0 && lg ? `${lg.name} : ${lg.clubs.length} clubs, ${lg.rel ? `${lg.rel} relégué${lg.rel > 1 ? "s" : ""} par saison` : "ligue fermée, sans relégation"}${lg.cont && contOpen(lg.cont, L.calYear) ? ` ; les ${lg.spots >= 99 ? "équipes" : `${lg.spots} premiers`} jouent ${REAL_CONTS[lg.cont]}` : " ; pas de compétition continentale"}.` : "Les 3 premiers montent, les 3 derniers descendent."} Le club garde ses gains dans sa trésorerie : vous touchez seulement ce que vous vous versez.</p>
    <p class="sp-head">Effectif</p>
    <p class="sp-note" style="margin-top:0">${C.squad.length} joueurs · ${S.start} titulaires comptent pour la force de l’équipe · masse salariale ≈ ${eur(C.squad.reduce((s2, p) => s2 + wageFor(B, lvl0, p.r), 0))} par saison.</p>
    <div class="sp-pills">${squad.map(([p, k]) => pill("sell", k, `${p.n} · ${p.a} ans · ${p.r}${p.p > p.r + 2 ? ` → ${p.p}` : ""}`, `vendre ≈ ${eur(playerValue(B, lvl0, p))}`, C.squad.length <= S.start)).join("")}</div>
    <p class="sp-head">Transferts</p>
    <p class="sp-note" style="margin-top:0">Le marché de l’année. Les indemnités sont payées par la trésorerie du club (${eur(C.cash)}) ; si elle ne suffit pas, injectez de l’argent (onglet « Saison »).</p>
    <div class="sp-pills">${clubMarket(L, b).map((p, k) => pill("buy", k, pl(p), `${p.free ? "en fin de contrat · " : ""}${eur(p.fee)} · salaire ≈ ${eur(wageFor(B, lvl0, p.r))}/saison${C.cash < p.fee ? " · caisse du club insuffisante" : ""}`, C.cash < p.fee)).join("") || `<span class="sp-note">Marché vide jusqu’à l’an prochain.</span>`}</div>
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
    if (i >= 0 && L.alive) { const C = L.ensureClub(L.businesses[i]), last = C.history[C.history.length - 1]; d.status.push({ icon: "leisure", label: "Club", act: `club:${i}`, cta: true, value: `${C.name} · ${divLabel(L, C)}${last ? `, ${rankTxt(last.rank)}` : ""} ›` }); }
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
