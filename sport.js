// Une carrière de sportif, en détail : un vrai club (les grands championnats de leagues.js, sinon un club
// du pays), un poste, des saisons avec leurs statistiques (buts, points, essais, guichets, victoires
// d'étape…), le temps de jeu, le contrat et la valeur sur le marché, les offres de vrais clubs, la
// sélection nationale ; pour les sports individuels, le classement mondial, les tournois, le bilan des
// combats et les records personnels. Récompenses de la saison, tentation du dopage, et ce qui reste
// d'une carrière : maillot retiré, panthéon de son sport, match d'adieu.

// Les sports qui se jouent en club ; les autres se jouent seul, au classement mondial.
const CLUB_CAREER = new Set(["foot", "basket", "rugby", "hockey", "baseball", "cricket", "velo", "esport"]);
// Postes, et ce qu'on y fait en une saison. g : matchs (jours de course pour le cyclisme).
// st : [libellé, valeur par match d'un joueur de niveau 80 dans un club de son niveau, format]
// (n : total de la saison ; pm : moyenne par match ; avg : moyenne au bâton ; pct : arrêts ; kda).
// top : la récompense du meilleur de la saison à ce poste.
const POSITIONS = {
  foot: { g: 38, list: [
    { m: "gardien", f: "gardienne", w: 1, st: [["matchs sans encaisser de but", 0.3, "n"]], top: "Meilleur gardien" },
    { m: "défenseur", f: "défenseuse", w: 3, st: [["buts", 0.04, "n"], ["passes décisives", 0.05, "n"]] },
    { m: "milieu de terrain", f: "milieu de terrain", w: 3, st: [["buts", 0.12, "n"], ["passes décisives", 0.2, "n"]], top: "Meilleur passeur" },
    { m: "attaquant", f: "attaquante", w: 3, st: [["buts", 0.45, "n"], ["passes décisives", 0.15, "n"]], top: "Meilleur buteur" },
  ] },
  basket: { g: 70, list: [
    { m: "meneur", f: "meneuse", w: 1, st: [["points par match", 11, "pm"], ["passes par match", 5.5, "pm"]], top: "Meilleur passeur" },
    { m: "arrière", f: "arrière", w: 1, st: [["points par match", 13, "pm"], ["passes par match", 3, "pm"]], top: "Meilleur marqueur" },
    { m: "ailier", f: "ailière", w: 1, st: [["points par match", 12, "pm"], ["rebonds par match", 5, "pm"]], top: "Meilleur marqueur" },
    { m: "pivot", f: "pivot", w: 1, st: [["points par match", 10, "pm"], ["rebonds par match", 8, "pm"]], top: "Meilleur rebondeur" },
  ] },
  rugby: { g: 26, list: [
    { m: "pilier", f: "pilière", w: 1, st: [["plaquages", 7, "n"], ["essais", 0.04, "n"]] },
    { m: "troisième ligne", f: "troisième ligne", w: 1, st: [["plaquages", 10, "n"], ["essais", 0.12, "n"]] },
    { m: "demi d’ouverture", f: "demie d’ouverture", w: 1, st: [["points", 7, "n"], ["essais", 0.08, "n"]], top: "Meilleur réalisateur" },
    { m: "ailier", f: "ailière", w: 1, st: [["essais", 0.4, "n"], ["mètres parcourus", 45, "n"]], top: "Meilleur marqueur d’essais" },
  ] },
  hockey: { g: 70, list: [
    { m: "gardien", f: "gardienne", w: 1, st: [["arrêts", 0.905, "pct"]], top: "Meilleur gardien" },
    { m: "défenseur", f: "défenseuse", w: 2, st: [["buts", 0.06, "n"], ["passes", 0.25, "n"]] },
    { m: "attaquant", f: "attaquante", w: 3, st: [["buts", 0.25, "n"], ["passes", 0.3, "n"]], top: "Meilleur buteur" },
  ] },
  baseball: { g: 140, list: [
    { m: "lanceur", f: "lanceuse", w: 1, g: 30, st: [["victoires", 0.38, "n"], ["retraits sur prises", 5.5, "n"]], top: "Meilleur lanceur" },
    { m: "frappeur", f: "frappeuse", w: 1, st: [["coups de circuit", 0.1, "n"], ["moyenne au bâton", 0.255, "avg"]], top: "Meilleur frappeur" },
  ] },
  cricket: { g: 14, list: [
    { m: "batteur", f: "batteuse", w: 2, st: [["points (runs)", 30, "n"]], top: "Meilleur batteur" },
    { m: "lanceur", f: "lanceuse", w: 2, st: [["guichets", 1.2, "n"]], top: "Meilleur lanceur" },
    { m: "joueur polyvalent", f: "joueuse polyvalente", w: 1, st: [["points (runs)", 16, "n"], ["guichets", 0.6, "n"]] },
  ] },
  velo: { g: 65, list: [
    { m: "sprinteur", f: "sprinteuse", w: 1, st: [["victoires", 0.04, "n"]], top: "Meilleur sprinteur" },
    { m: "grimpeur", f: "grimpeuse", w: 1, st: [["victoires", 0.018, "n"]], top: "Meilleur grimpeur" },
    { m: "rouleur", f: "rouleuse", w: 1, st: [["victoires", 0.022, "n"]] },
    { m: "équipier", f: "équipière", w: 2, st: [["victoires", 0.005, "n"]] },
  ] },
  esport: { g: 36, list: ["haut", "jungle", "milieu", "tireur", "soutien"].map(r => ({ m: `joueur au poste ${r}`, f: `joueuse au poste ${r}`, w: 1, st: [["KDA (éliminations et aides par mort)", 3, "kda"]] })) },
};
// Les grandes nations de chaque sport (première ligne : favorites ; seconde : solides).
const NATIONS = {
  foot: ["BR AR FR DE ES IT GB NL PT", "UY BE HR CO MX US JP SN MA NG DK CH"], basket: ["US", "ES FR RS AR LT GR AU CA DE SI"],
  rugby: ["NZ ZA", "FR IE GB AU AR"], hockey: ["CA RU", "SE FI US CZ SK CH"], cricket: ["AU IN", "GB PK NZ ZA LK"], baseball: ["US JP", "KR CU DO VE TW"],
};
// Le pays qu'on représente : celui de sa naissance, même après un transfert à l'étranger.
const sportNation = L => L.home || L.code;
const sing = k => k.split(" ").map(w => w === "sans" ? w : w.replace(/s(\)?)$/, "$1")).join(" ");
const nationTier = (sport, code) => { const N = NATIONS[sport]; return !N ? 2 : inList(code, N[0]) ? 0 : inList(code, N[1]) ? 1 : 2; };
// Sports individuels : ce que mesure la saison.
const SOLO = {
  tennis: { w: "tournois remportés", w1: "tournoi remporté", rate: 1.2 }, boxe: { fights: true },
  judo: { w: "médailles internationales", w1: "médaille internationale", rate: 1 }, wrestle: { w: "médailles internationales", w1: "médaille internationale", rate: 1 },
  run: { w: "courses internationales gagnées", w1: "course internationale gagnée", rate: 0.8, time: "marathon" }, sprint: { w: "meetings internationaux gagnés", w1: "meeting international gagné", rate: 1.2, time: "100 m" },
  swim: { w: "courses internationales gagnées", w1: "course internationale gagnée", rate: 1.2, time: "100 m nage libre" }, gym: { w: "médailles internationales", w1: "médaille internationale", rate: 1 },
  ski: { w: "victoires en coupe du monde", w1: "victoire en coupe du monde", rate: 1.2 }, pingpong: { w: "tournois internationaux remportés", w1: "tournoi international remporté", rate: 1 }, badminton: { w: "tournois internationaux remportés", w1: "tournoi international remporté", rate: 1 },
};
// Meilleur temps selon le niveau : le niveau 99, c'est le record du monde.
function bestTime(kind, skill, f) {
  const s = clamp(skill, 30, 100);
  if (kind === "100 m") { const t = (f ? 10.49 : 9.58) + (99 - s) * (f ? 0.03 : 0.027); return [t, `${t.toFixed(2).replace(".", ",")} s`]; }
  if (kind === "100 m nage libre") { const t = (f ? 51.7 : 46.4) + (99 - s) * 0.13; return [t, `${t.toFixed(2).replace(".", ",")} s`]; }
  const m = (f ? 129 : 121) + (99 - s) * 0.55, h = Math.floor(m / 60), mm = Math.round(m % 60);
  return [m, `${h} h ${String(mm).padStart(2, "0")}`];
}
const fmtStat = (v, f) => f === "avg" ? `.${String(Math.round(clamp(v, 0, 0.999) * 1000)).padStart(3, "0")}` : f === "pct" ? `${(clamp(v, 0, 0.999) * 100).toFixed(1).replace(".", ",")} %` : f === "n" ? String(Math.round(v)) : v.toFixed(1).replace(".", ",");
const ROLE_LABEL = { starter: "titulaire", rotation: "dans la rotation", bench: "remplaçant", reserve: "peu utilisé" };

// --- Les clubs ---------------------------------------------------------------------------
// Une ligue d'élite pour ce sport et ce pays (le cyclisme et l'e-sport européen jouent dans un circuit mondial).
const sportLeague = (L, sport, code) => typeof homeLeague === "function" ? homeLeague(sport, code, L.calYear) : null;
// Le niveau d'un championnat national quand le pays n'a pas de grande ligue.
const plainLevel = (L, sport, code, div) => CLUB_SPORTS[sport] ? genericLevel(L, sport, code, div) : 70 - 10 * div;
function clubRecord(L, sport, lg, c, div = 0) {
  return { name: c.name, code: c.code, r: c.r, lg: lg ? lg.id : null, div, since: L.age, until: L.age + 2 + Math.floor(rand() * 3), apps: 0 };
}
function plainClub(L, sport, code, div) {
  return { name: clubName(sport), code, r: Math.round(plainLevel(L, sport, code, div) + randn() * 3), lg: null, div, since: L.age, until: L.age + 2 + Math.floor(rand() * 3), apps: 0 };
}
const clubLg = club => club && club.lg ? REAL_LEAGUE_BY_ID[club.lg] : null;
const clubWhere = (L, club) => { const lg = clubLg(club); return lg ? lg.name : `${divName(L.passion ? L.passion.id : "foot", club.div)} ${inCountry(countryAt(BY_CODE[club.code] ? club.code : L.code, L.calYear))}`; };
const flagOf = code => BY_CODE[code] ? BY_CODE[code].flag : "";
// Les clubs qui voudraient de vous : à votre niveau (un peu au-dessus si l'on a un nom), au pays et dans les grands championnats.
function clubSuitors(L, n = 3, abroad = true) {
  const P = L.passion, sport = P.id, y = L.calYear, s = P.skill + P.fame / 25, cur = P.club ? P.club.name : "";
  const home = sportLeague(L, sport, L.code), out = [];
  const lgs = REAL_LEAGUES.filter(l => l.sport === sport && y >= l.from && (l === home || (abroad && P.stage >= 2 && P.skill >= 72)));
  for (const lg of lgs) for (const c of lg.clubs) {
    if (c.name === cur || c.r > s + 3) continue;
    const w = (lg === home ? 3 : 1) * Math.sqrt(lg.rev / 20) * Math.exp(-Math.abs(c.r - Math.min(s - 1, 90)) / 4) * (BY_CODE[c.code] ? 1 : 0);
    if (w < 0.02) continue;
    if (w > 0) out.push({ w, lg, c });
  }
  const picked = [];
  while (picked.length < n && out.length) {
    const i = weighted(out.map((o, k) => [k, o.w]));
    const o = out.splice(i, 1)[0];
    if (!picked.some(p => p.name === o.c.name)) picked.push(clubRecord(L, sport, o.lg, o.c));
  }
  // Pas de grande ligue au pays : les meilleurs clubs du championnat national.
  if (!home && picked.length < n) {
    const lvl = plainLevel(L, sport, L.code, 0);
    if (s >= lvl - 12) for (let k = picked.length; k < Math.min(n, 2); k++) picked.push(plainClub(L, sport, L.code, 0));
  }
  return picked;
}
// Ce que vaut un joueur sur le marché.
function marketValue(L) {
  const P = L.passion, club = P.club;
  if (!club || P.stage < 1) return 0;
  const lg = clubLg(club);
  const B0 = lg ? realRevenue(lg, club.r, L.calYear) / 1.55 : CLUB_SPORTS[P.id] ? genericBase(L, P.id, BY_CODE[club.code] ? club.code : L.code) : median(L.here) * 200;
  const lvl0 = lg ? leagueAvg(lg) : plainLevel(L, P.id, club.code, 0);
  return playerValue(B0, lvl0, { a: L.age, r: P.skill, p: P.skill + (L.age <= 22 ? 8 : 0) }) * (1 + P.fame / 200);
}
// La place dans l'équipe : selon le niveau par rapport au club.
function roleIn(P, a) {
  const d = P.skill - P.club.r + (P.roleAt === a ? 4 : 0);
  return d >= -2 ? "starter" : d >= -6 ? "rotation" : d >= -11 ? "bench" : "reserve";
}

Object.assign(Life.prototype, {
  sportPosition() {
    const P = this.passion, D = POSITIONS[P.id];
    if (!D) return null;
    if (P.pos == null || !D.list[P.pos]) P.pos = weighted(D.list.map((x, i) => [i, x.w]));
    return D.list[P.pos];
  },
  // Rejoindre un club : au pays, ou à l'étranger (le cyclisme et l'e-sport se courent sans déménager).
  joinClub(club, fee = 0, quiet = false) {
    const P = this.passion, old = P.club;
    P.club = club; P.clubs = P.clubs || [];
    if (!P.clubs.includes(club.name)) P.clubs.push(club.name);
    const lg = clubLg(club), where = lg ? ` (${lg.name})` : "";
    if (club.code !== this.code && BY_CODE[club.code] && P.id !== "velo" && !(lg && lg.world)) {
      const d = countryAt(club.code, this.calYear);
      this.emigrated = true; this.code = d.code; this.urban = true;
      this.bank = this.bank || rand() < d.bank / 100;
      this.bump("rel", -6);
      if (!quiet) this.say(`Part ${inCountry(d)} ${d.flag} : signe à ${club.name}${where}${fee > 0 ? `, transfert de ${money(fee)}` : ""}.`, "move", true);
    } else if (!quiet) this.say(`${old ? "Quitte " + old.name + " et signe" : "Signe"} à ${club.name}${where}${fee > 0 ? `, transfert de ${money(fee)}` : ""} ; contrat jusqu’à ${club.until} ans.`, "work", true);
    if (lg && lg.rev >= 100 && (!old || !clubLg(old) || clubLg(old).rev < 100)) P.fame = clamp(P.fame + 6, 0, 100);
    if (club.div === 0 && P.stage === 1 && stageCap(this, P.id)[0] >= 2 && (lg || P.skill >= 68)) {
      P.stage = 2; P.fame = Math.max(P.fame, 20);
      this.say(`Premier contrat professionnel, à ${club.name}.`, "work", true); this.bump("happy", 6);
    }
    P.wantsCareer = true;
    if (!this.isCareer() && P.stage >= 2 && !this.retired) this.becomeCareer(true);
    if (this.isCareer()) this.careerPay();
  },
  // Choisir parmi des offres de clubs.
  askOffers(offers, text, stay = null) {
    const P = this.passion;
    const opts = offers.map(o => {
      const lg = clubLg(o), fee = P.club && this.age < P.club.until ? marketValue(this) : 0;
      return { label: `Signer à ${o.name} ${flagOf(o.code)}`, sub: `${lg ? lg.name : clubWhere(this, o)} · niveau du club ${o.r}/100 · contrat jusqu’à ${o.until} ans${o.code !== this.code && P.id !== "velo" && !(lg && lg.world) ? " · il faut partir à l’étranger" : ""}`,
        autoWeight: 1 + Math.max(0, o.r - (P.club ? P.club.r : 60)) / 3 + (lg ? lg.rev / 200 : 0), apply: () => { if (this.passion === P && !P.ended) this.joinClub(o, fee); } };
    });
    if (stay) opts.push(stay);
    this.ask(text, opts);
  },
  // Avant la saison : un club, la sélection nationale, la tentation du dopage, une suspension.
  sportPreseason() {
    const P = this.passion;
    if (!P || P.ended || PASSIONS[P.id].kind !== "sport" || this.age < 15) return;
    const a = this.age, y = this.calYear, M = PASSIONS[P.id];
    if (CLUB_CAREER.has(P.id) && P.stage >= 1 && !P.club && a >= 16) {
      const offers = P.stage >= 2 ? clubSuitors(this, 3, false) : [];
      if (offers.length) this.askOffers(offers, `Des clubs ${this.g("le", "la")} veulent. Où signer ?`);
      else { P.club = plainClub(this, P.id, this.code, P.stage >= 2 ? 1 : 2); P.clubs = [P.club.name]; this.say(`Signe à ${P.club.name}, en ${divName(P.id, P.club.div)}.`, "work"); }
    }
    // Trop fort pour son club : de plus grands clubs se manifestent.
    if (P.club && P.upAskedAt !== a && (P.club.div > 0 && P.stage >= 2 || P.skill >= P.club.r + 6) && rand() < 0.7) {
      P.upAskedAt = a;
      const offers = clubSuitors(this, 3, P.stage >= 2).filter(o => o.r > P.club.r || o.div < P.club.div);
      if (!offers.length && P.club.div > 0) offers.push(plainClub(this, P.id, this.code, P.club.div - 1));
      if (offers.length) this.askOffers(offers, "De plus grands clubs ont remarqué vos saisons. Monter d’un cran ?", { label: `Rester à ${P.club.name}`, autoWeight: 0.5, apply: () => this.say(`Reste fidèle à ${P.club.name}.`, "work") });
    }
    // La sélection nationale.
    P.natAt = null;
    if (M.team && P.stage >= 2 && P.injuredAt !== a && !(P.bannedUntil >= a)) {
      const tier = nationTier(P.id, sportNation(this)), thr = [86, 80, 72][tier] - (this.here.pop < 5 ? 4 : 0);
      if (P.skill + randn() * 2.5 >= thr) {
        P.natAt = a; P.caps = P.caps || 0;
        if (!P.capFirst) { P.capFirst = y; this.say(`Première sélection en équipe nationale ${flagOf(sportNation(this))} : l’hymne, le maillot du pays, la famille en larmes devant la télévision.`, "work", true); this.bump("happy", 8); P.fame = clamp(P.fame + 5, 0, 100); }
      }
    }
    // Le dopage : une offre qu'on peut refuser.
    if (P.stage >= 2 && y >= 1960 && !P.dopeAsked && !P.doped && P.skill < 90 && rand() < 0.035) {
      P.dopeAsked = true;
      this.ask("Un médecin glisse qu’il existe des produits « pour récupérer plus vite ». Interdits, presque indétectables, dit-il. Accepter ?", [
        { label: "Refuser", sub: "Rester propre, quoi qu’il en coûte.", autoWeight: 6, apply: () => { this.say("Refuse les produits interdits qu’on lui propose.", "work"); this.bump("happy", 1); } },
        { label: "Accepter", sub: "Niveau +6… tant qu’on ne se fait pas prendre : suspension, titres retirés, honte.", autoWeight: 0.3, apply: () => { P.doped = true; P.skill = clamp(P.skill + 6, 0, 100); this.say("Accepte, en secret, des produits interdits.", "health"); this.bump("health", -3); } },
      ]);
    }
    if (P.doped && y >= 1968 && rand() < 0.18) {
      P.doped = false; P.bannedUntil = a + 1; P.skill = clamp(P.skill - 6, 0, 100); P.fame = clamp(P.fame - 25, 0, 100);
      const lost = (P.titles || []).pop();
      this.say(`Contrôle positif. Suspendu deux ans${lost ? `, ${lost.t.toLowerCase()} lui est retiré` : ""} ; son nom fait la une, pour de mauvaises raisons.`, "work", true);
      this.bump("happy", -15); this.bump("rel", -6);
    }
  },
  // Après la saison : statistiques, classement du club, coupes, récompenses, contrat.
  sportSeason() {
    const P = this.passion;
    if (!P || P.ended || PASSIONS[P.id].kind !== "sport" || P.stage < 1 || this.age < 15) return;
    const a = this.age, y = this.calYear, M = PASSIONS[P.id];
    P.seasons = P.seasons || []; P.tot = P.tot || {};
    if (P.bannedUntil >= a) { P.seasons.push({ y, club: P.club ? P.club.name : "", txt: "suspendu" }); return; }
    const hurt = P.injuredAt === a ? 0.3 + rand() * 0.4 : 1;
    if (CLUB_CAREER.has(P.id) && P.club) this.clubSportSeason(hurt);
    else if (SOLO[P.id]) this.soloSeason(hurt);
    if (P.seasons.length > 40) P.seasons.splice(0, P.seasons.length - 40);
    // Fin de contrat : prolonger, ou partir.
    if (P.club && a >= P.club.until && P.contractAskedAt !== a && !(M.end && a >= M.end + 4)) {
      P.contractAskedAt = a;
      const role = roleIn(P, a), keep = role === "starter" || role === "rotation" || rand() < 0.4;
      const offers = clubSuitors(this, 3, true).filter(o => o.name !== P.club.name);
      const stay = keep ? { label: `Prolonger à ${P.club.name}`, sub: role === "starter" ? "Le club tient à vous : un contrat mieux payé." : "Un nouveau contrat, aux mêmes conditions.", autoWeight: 2 + (a - P.club.since) / 4,
        apply: () => { if (this.passion !== P) return; P.club.until = a + 2 + Math.floor(rand() * 3); if (role === "starter") { P.boost = Math.max(P.boost || 1, 1.2); P.boostUntil = P.club.until; } this.say(`Prolonge à ${P.club.name} jusqu’à ${P.club.until} ans.`, "work"); this.careerPay(); } } : null;
      if (offers.length) this.askOffers(offers, `Votre contrat à ${P.club.name} se termine. ${keep ? "Le club propose de prolonger ; d’autres clubs vous font une offre." : "Le club ne vous garde pas. Des offres arrivent."}`, stay);
      else if (stay) stay.apply();
      else { const c = plainClub(this, P.id, this.code, Math.min(3, P.club.div + 1)); this.say(`${P.club.name} ne ${this.g("le", "la")} garde pas ; repart plus bas.`, "work", true); this.joinClub(c, 0, true); }
    }
  },
  clubSportSeason(hurt) {
    const P = this.passion, club = P.club, a = this.age, y = this.calYear, lg = clubLg(club), pos = this.sportPosition(), D = POSITIONS[P.id];
    const role = roleIn(P, a), share = { starter: 0.85 + rand() * 0.15, rotation: 0.55 + rand() * 0.2, bench: 0.25 + rand() * 0.2, reserve: 0.05 + rand() * 0.15 }[role] * hurt;
    const G = Math.round((pos.g || D.g) * share);
    const q = clamp(Math.exp((P.skill - 80) / 14 + (P.skill - club.r) / 15 + (P.mindAt === a ? 0.08 : 0)), 0.15, 1.6) * (0.85 + rand() * 0.3);
    const stats = pos.st.map(([k, per, f]) => {
      const v = f === "n" ? per * q * G : f === "avg" ? per + (q - 1) * 0.05 + randn() * 0.012 : f === "pct" ? per + (q - 1) * 0.015 + randn() * 0.004 : per * (f === "kda" ? 0.6 + 0.4 * q : q);
      if (f === "n") P.tot[k] = (P.tot[k] || 0) + Math.round(v);
      return [k, v, f];
    });
    const note = clamp(6.3 + clamp(P.skill - club.r, -20, 14) / 6 + (q - 1) * 1.1 + (P.mindAt === a ? 0.3 : 0) + randn() * 0.4, 4, 9.6);
    const games = P.id === "velo" ? "jours de course" : "matchs";
    P.tot[games] = (P.tot[games] || 0) + G; club.apps = (club.apps || 0) + G;
    // Le classement du club : contre les vrais clubs du championnat, sinon un championnat de 16.
    const mine = club.r + (role === "starter" ? (P.skill - club.r) / 8 : 0) + randn() * 2.5;
    const others = P.id === "velo" ? [] : lg ? lg.clubs.filter(c => c.name !== club.name).map(c => c.r + randn() * 2.5) : Array.from({ length: 15 }, () => plainLevel(this, P.id, club.code, club.div) + randn() * 4);
    const rank = others.length ? 1 + others.filter(r => r > mine).length : 0, champ = rank === 1 && G > 0;
    const shown = stats.filter(([, v, f]) => f !== "n" || Math.round(v) > 0).map(([k, v, f]) => `${fmtStat(v, f)} ${f === "n" && Math.round(v) === 1 ? sing(k) : k}`);
    P.seasons.push({ y, club: club.name, g: G, role, txt: shown.join(" · "), note: Math.round(note * 10) / 10, rank, n: others.length + 1 });
    const champName = lg ? lg.name : divName(P.id, club.div);
    if (champ) this.addTitle(`${this.g("Champion", "Championne")} : ${champName} ${y} (${club.name})`, lg ? 8 : 3, `${club.name} remporte ${lg ? "la " + lg.name : `le championnat (${divName(P.id, club.div)})`} ; ${G} ${P.id === "velo" ? "jours de course" : "matchs"} joués, ${shown.join(", ") || "et un vestiaire en fête"}.`);
    else if (G > 0 && rank) this.say(`Saison ${y} à ${club.name} : ${G} ${P.id === "velo" ? "jours de course" : "matchs"} (${ROLE_LABEL[role]})${shown.length ? `, ${shown.join(", ")}` : ""} ; ${rankTxt(rank)} du championnat · note ${String(Math.round(note * 10) / 10).replace(".", ",")}.`, "work");
    else if (G > 0) this.say(`Saison ${y} avec ${club.name} : ${G} jours de course${shown.length ? `, ${shown.join(", ")}` : ""}.`, "work");
    else this.say(`Saison ${y} : presque jamais sur ${P.id === "velo" ? "les routes" : "le terrain"}.`, "work");
    // La coupe nationale (football) et la compétition continentale des vrais championnats.
    if (P.id === "foot" && G > 5 && rand() < (rank && rank <= 4 ? 0.18 : 0.04)) this.addTitle(`Coupe nationale ${y} (${club.name})`, 3, `${club.name} remporte la coupe nationale.`);
    if (lg && lg.cont && G > 5 && P.id !== "esport" && contOpen(lg.cont, y) && rank && rank <= (lg.spots || 0) + 1 && lg.cont !== "velo-tdf") {
      const C = { name: club.name, code: club.code, sport: P.id, league: lg.id, trophies: [], contName: REAL_CONTS[lg.cont] }, res = { notes: [] };
      clubContinental(this, C, mine, res, 0);
      if (C.trophies.length) this.addTitle(`${C.trophies[0].t} ${y} (${club.name})`, 10, `Avec ${club.name}, ${res.notes[0] || "remporte la coupe continentale"}`);
      else if (res.notes.length) this.say(`${club.name} : ${res.notes.join(" ; ")}.`, "work");
    }
    // Les récompenses de la saison.
    const lgName = lg ? lg.name : capFirst(divName(P.id, club.div));
    if (G > 10 && note >= 8.2 && rand() < 0.45) this.addTitle(`Meilleur${this.g("", "e")} ${this.g("joueur", "joueuse")} : ${lgName} ${y}`, 6, `Élu${this.g("", "e")} meilleur${this.g("", "e")} ${this.g("joueur", "joueuse")} de la saison (${lgName}).`);
    else if (pos.top && G > 10 && q >= 1.5 && rand() < 0.4) this.addTitle(`${pos.top} : ${lgName} ${y}`, 4, `Termine la saison avec le titre de ${pos.top.toLowerCase()} (${lgName}).`);
    if (a <= 21 && G > 10 && note >= 7.3 && !P.youngAward && rand() < 0.45) { P.youngAward = true; this.addTitle(`Meilleur${this.g("", "e")} jeune : ${lgName} ${y}`, 4, "Élu meilleur jeune de la saison.".replace("Élu meilleur", this.g("Élu meilleur", "Élue meilleure"))); }
    if (P.skill >= 92 && P.fame >= 70 && note >= 8 && P.id !== "velo" && rand() < 0.3) this.addTitle(`Meilleur${this.g("", "e")} ${this.g("joueur", "joueuse")} du monde ${y}`, 12, `Élu${this.g("", "e")} meilleur${this.g("", "e")} ${this.g("joueur", "joueuse")} du monde ! Les journalistes du monde entier ont voté.`);
    P.fame = clamp(P.fame + (note - 6.8) * 1.2, 0, 100);
    if (role === "reserve" && !P.benchNoted) { P.benchNoted = true; this.say(`Ne joue presque pas à ${club.name} ; il faudrait demander du temps de jeu, ou partir.`, "work"); this.bump("happy", -3); }
    // En sélection.
    if (P.natAt === a) {
      const caps = Math.max(1, Math.round((P.id === "foot" ? 8 : P.id === "rugby" ? 9 : 6) * hurt * (0.7 + rand() * 0.5)));
      P.caps += caps;
      const k = pos.st.find(([, , f]) => f === "n");
      if (k && P.id !== "cricket") { const n = Math.round(k[1] * q * caps * 0.8); if (n > 0) P.capStat = [k[0], (P.capStat ? P.capStat[1] : 0) + n]; }
      if (P.caps >= 50 && !P.captain && P.fame >= 55) { P.captain = true; this.say(`Devient ${this.g("capitaine", "capitaine")} de l’équipe nationale.`, "work", true); this.bump("happy", 5); }
      if (P.caps >= 100 && !P.century) { P.century = true; this.addTitle("100 sélections en équipe nationale", 5, "Cent sélections en équipe nationale : une soirée d’hommage avant le match."); }
    }
  },
  soloSeason(hurt) {
    const P = this.passion, a = this.age, y = this.calYear, S = SOLO[P.id], f = this.sex === "f";
    const s = P.skill - (P.stage < 2 ? 8 : 0) + (P.mindAt === a ? 1.5 : 0) + randn() * 1.5;
    const rank = Math.max(1, Math.round(Math.exp((97 - s) / 6.5) * Math.exp(randn() * 0.2) / hurt));
    P.bestRank = Math.min(P.bestRank || 9999, rank);
    const bits = [`${rank === 1 ? "numéro 1" : rankTxt(rank)} mondial${f ? "e" : ""}`];
    if (S.fights) {
      const n = Math.max(0, Math.round((2 + rand() * 2) * hurt)), pw = clamp(0.55 + (P.skill - 70) / 50, 0.2, 0.97);
      let w = 0, ko = 0; for (let i = 0; i < n; i++) if (rand() < pw) { w++; if (rand() < 0.5) ko++; }
      P.rec = P.rec || { w: 0, l: 0, ko: 0 }; P.rec.w += w; P.rec.l += n - w; P.rec.ko += ko;
      bits.push(`${n} combat${n > 1 ? "s" : ""}, ${w} victoire${w > 1 ? "s" : ""}${ko ? ` dont ${ko} avant la limite` : ""}`);
      if (n && w === n && rank <= 5 && rand() < 0.3) this.addTitle(`Ceinture mondiale ${y}`, 10, `Remporte une ceinture de ${this.g("champion", "championne")} du monde !`);
    } else {
      const lam = clamp(S.rate * Math.exp((s - 86) / 5), 0, 9) * hurt;
      let wins = 0; for (let L0 = Math.exp(-lam), p = 1; ; wins++) { p *= rand(); if (p < L0) break; }
      P.tot[S.w] = (P.tot[S.w] || 0) + wins;
      if (wins) bits.push(`${wins} ${wins > 1 ? S.w : S.w1}`);
      if (P.id === "tennis") { const m = Math.round((45 + rand() * 25) * hurt), pw = clamp(0.35 + (90 - rank) / 130, 0.2, 0.92), w = Math.round(m * pw); bits.push(`${w} victoires, ${m - w} défaites`); }
    }
    if (S.time) {
      const [t, txt] = bestTime(S.time, s, f);
      if (!P.pb || t < P.pb[0]) { const first = !P.pb; P.pb = [t, txt, y]; bits.push(`record personnel en ${S.time} : ${txt}`); if (!first && rank <= 3) P.fame = clamp(P.fame + 2, 0, 100); }
      if (P.skill >= 97.5 && !P.wr && rand() < 0.35) { P.wr = true; this.addTitle(`Record du monde du ${S.time} (${y})`, 15, `Bat le record du monde du ${S.time} : ${txt} ! Le stade se lève, le chrono s’affiche sur tous les écrans du monde.`); }
    }
    P.seasons.push({ y, club: "", txt: bits.join(" · "), rank });
    this.say(`Saison ${y} : ${bits.join(", ")}.`, "work");
    if (rank === 1 && !P.wasNumberOne) { P.wasNumberOne = true; this.addTitle(`Numéro 1 mondial${f ? "e" : ""} (${y})`, 12, `Devient numéro 1 mondial${f ? "e" : ""} de ${PASSIONS[P.id].label.replace(/^(le |la |l’)/, "")}.`); }
    P.fame = clamp(P.fame + (rank <= 10 ? 2 : rank <= 50 ? 0.5 : -0.5), 0, 100);
  },
  // Ce qui reste d'une carrière.
  sportLegacy(P) {
    const M = PASSIONS[P.id], titles = (P.titles || []).length, m = median(this.here);
    if (P.club && P.club.apps >= 200 && a0(P) >= 8 && P.fame >= 50) this.say(`${P.club.name} retire son numéro : plus personne ne portera ce maillot.`, "work", true);
    if (P.fame >= 60 && P.stage >= 2) { const gain = m * P.fame / 20; this.addMoney(gain); this.say(`Match d’adieu à guichets fermés : ${money(gain)} de recettes, une ovation qui dure de longues minutes.`, "work", true); this.bump("happy", 5); }
    if (titles >= 6 || P.fame >= 88 || P.wr || P.wasNumberOne) { this.hallOfFame = M.label; this.say(`Entre au panthéon ${deLabel(M.label)} : son nom rejoint ceux des légendes.`, "work", true); this.bump("happy", 6); }
    this.sportCareer = { id: P.id, titles, caps: P.caps || 0, clubs: P.clubs || [], tot: P.tot || {}, bestRank: P.bestRank || null, rec: P.rec || null };
  },
});
const a0 = P => P.club ? (P.seasons || []).filter(s => s.club === P.club.name).length : 0;

// Brancher la saison sur l'année, la paye sur le club, la fin de carrière sur l'héritage.
{
  const year = Life.prototype.passionYear, pay = Life.prototype.careerPay, end = Life.prototype.endSportCareer;
  Life.prototype.passionYear = function () {
    this.sportPreseason();
    year.call(this);
    this.sportSeason();
  };
  Life.prototype.careerPay = function () {
    pay.call(this);
    const P = this.passion;
    if (!P || !P.club || P.stage < 2) return;
    const lg = clubLg(P.club), role = roleIn(P, this.age);
    const f = clamp(Math.exp((P.club.r - 80) / 9), 0.5, 3) * { starter: 1, rotation: 0.85, bench: 0.7, reserve: 0.55 }[role] * (lg ? (lg.rev >= 150 ? 1.6 : lg.rev >= 40 ? 1.2 : 1) : 0.9);
    this.starMult = (this.starMult || 1) * f;
  };
  Life.prototype.endSportCareer = function () {
    const P = this.passion;
    if (P && PASSIONS[P.id].kind === "sport") this.sportLegacy(P);
    end.call(this);
  };
}

// --- Actions et page de carrière ----------------------------------------------------------
{
  const opts0 = careerOptions, act0 = careerAction;
  careerOptions = function (L) {
    const list = opts0(L), P = L.passion;
    if (!P || PASSIONS[P.id].kind !== "sport") return list;
    const a = L.age, m = median(L.here), done = k => (P.did || {})[k] === a;
    const add = (id, label, sub, ok = true, why = "") => list.push({ id, label, sub, ok: ok && !done(id), why: done(id) ? "déjà cette année" : why });
    if (P.club && P.stage >= 1) {
      const role = roleIn(P, a);
      if (role !== "starter") add("playtime", "Demander plus de temps de jeu", `Vous êtes ${ROLE_LABEL[role]} : l’entraîneur peut vous faire confiance… ou vous mettre de côté`);
      const t = list.find(o => o.id === "transfer");
      if (t) t.sub = "De vrais clubs, à votre niveau : au pays ou dans un grand championnat étranger";
    }
    if (P.stage >= 1) add("mental", "Travailler avec un préparateur mental", `Meilleure saison, sang-froid dans les grands rendez-vous · ≈ ${eur(m * 0.05)}`, L.savings >= m * 0.05, "pas assez d’argent");
    if (P.doped) add("clean", "Arrêter les produits interdits", "Le niveau baisse un peu ; le risque disparaît");
    return list;
  };
  careerAction = function (L, id, arg) {
    const P = L.passion;
    if (!P || PASSIONS[P.id].kind !== "sport" || !["playtime", "mental", "clean", "transfer", "contract"].includes(id) || (id === "transfer" && !P.club)) return act0(L, id, arg);
    const o = careerOptions(L).find(x => x.id === id), a = L.age, m = median(L.here);
    if (!o || !o.ok) return o ? `Impossible : ${o.why}.` : null;
    if (id === "contract") { const r = act0(L, id, arg); if (P.club && P.boostUntil === a + 3) P.club.until = Math.max(P.club.until, a + 3); return r; }
    P.did = P.did || {}; P.did[id] = a;
    switch (id) {
      case "playtime": {
        if (rand() < clamp(0.35 + (P.skill - P.club.r + 6) / 20, 0.1, 0.8)) { P.roleAt = a; L.say(`Obtient la confiance de l’entraîneur à ${P.club.name} : plus de temps de jeu cette saison.`, "work"); L.careerPay(); return "Plus de temps de jeu cette saison."; }
        L.bump("happy", -3); L.say(`Demande plus de temps de jeu ; l’entraîneur ne change rien, l’ambiance se tend.`, "work");
        return "Refusé : il faudra peut-être partir.";
      }
      case "mental": L.pay(m * 0.05); P.mindAt = a; L.bump("happy", 2); L.say("Travaille avec un préparateur mental : visualisation, respiration, routine d’avant-match.", "work"); return "Meilleure saison et sang-froid cette année.";
      case "clean": P.doped = false; P.skill = clamp(P.skill - 3, 0, 100); L.bump("happy", 2); L.say("Arrête les produits interdits ; un poids de moins sur la conscience.", "health"); return "Niveau −3, plus de risque.";
      case "transfer": {
        const offers = clubSuitors(L, 3, true);
        if (!offers.length) { L.say("Demande un transfert ; aucun club ne fait d’offre.", "work"); return "Pas d’offre."; }
        L.askOffers(offers, `Votre agent sonde le marché : ${offers.length} club${offers.length > 1 ? "s" : ""} intéressé${offers.length > 1 ? "s" : ""}. Où signer ?`, { label: `Rester à ${P.club.name}`, autoWeight: 0.5, apply: () => L.say(`Reste finalement à ${P.club.name}.`, "work") });
        return `${offers.length} offre${offers.length > 1 ? "s" : ""} !`;
      }
    }
    return null;
  };
}
// Le bloc « club, saison, sélection, palmarès » de la page de carrière.
function sportHtml(L) {
  const P = L.passion;
  if (!P || PASSIONS[P.id].kind !== "sport" || P.stage < 1) return "";
  const a = L.age, lines = [], pos = POSITIONS[P.id] && P.pos != null ? POSITIONS[P.id].list[P.pos] : null, v = marketValue(L);
  let head = "";
  if (P.club) {
    head = `${esc(P.club.name)} ${flagOf(P.club.code)} · ${esc(clubWhere(L, P.club))}`;
    lines.push(`${pos ? esc(capFirst(L.g(pos.m, pos.f))) + " · " : ""}${ROLE_LABEL[roleIn(P, a)]} · niveau du club ${P.club.r}/100 · contrat jusqu’à ${P.club.until} ans${v ? ` · valeur ≈ ${eur(v)}` : ""}`);
  } else if (SOLO[P.id]) head = `Classement mondial${P.seasons && P.seasons.length && P.seasons[P.seasons.length - 1].rank ? ` : ${rankTxt(P.seasons[P.seasons.length - 1].rank)}` : ""}${P.bestRank ? ` · meilleur : ${rankTxt(P.bestRank)}` : ""}`;
  const tot = Object.entries(P.tot || {}).filter(([k, n]) => n > 0);
  if (tot.length) lines.push(`Carrière : ${tot.map(([k, n]) => `${n.toLocaleString("fr-FR")} ${n === 1 && SOLO[P.id] && SOLO[P.id].w === k ? SOLO[P.id].w1 : k}`).join(" · ")}`);
  if (P.rec) lines.push(`Bilan : ${P.rec.w} victoires, ${P.rec.l} défaites, ${P.rec.ko} avant la limite`);
  if (P.pb) lines.push(`Record personnel : ${P.pb[1]} (${P.pb[2]})${P.wr ? " · record du monde" : ""}`);
  if (P.caps) lines.push(`Équipe nationale ${flagOf(sportNation(L))} : ${P.caps} sélection${P.caps > 1 ? "s" : ""}${P.capStat ? `, ${P.capStat[1]} ${P.capStat[0]}` : ""}${P.captain ? " · capitaine" : ""}${P.natAt === a ? " · sélectionné".replace("né", L.g("né", "née")) + " cette année" : ""}`);
  else if (CLUB_CAREER.has(P.id) && P.stage >= 2 && PASSIONS[P.id].team) lines.push(`Équipe nationale : pas encore appelé${L.g("", "e")} (il faut un niveau d’environ ${[86, 80, 72][nationTier(P.id, sportNation(L))]})`);
  if (P.bannedUntil >= a) lines.push(`Suspendu${L.g("", "e")} jusqu’à ${P.bannedUntil + 1} ans`);
  if (P.clubs && P.clubs.length > 1) lines.push(`Clubs : ${P.clubs.map(esc).join(" → ")}`);
  const seasons = (P.seasons || []).slice(-6).reverse();
  return `<div class="sp-card"><div class="sp-main">${head ? `<b>${head}</b>` : ""}${lines.map(x => `<small>${x}</small>`).join("")}
    ${seasons.length ? `<small><b>Dernières saisons</b></small>${seasons.map(s => `<small>${s.y}${s.club ? ` · ${esc(s.club)}` : ""}${s.g != null ? ` · ${s.g} ${P.id === "velo" ? "j." : "m."}` : ""}${s.txt ? ` · ${esc(s.txt)}` : ""}${s.note ? ` · note ${String(s.note).replace(".", ",")}` : ""}${s.rank && s.n > 1 ? ` · ${rankTxt(s.rank)}/${s.n}` : ""}</small>`).join("")}` : ""}</div></div>`;
}
