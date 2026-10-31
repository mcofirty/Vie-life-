// Les très grandes fortunes (des centaines de millions aux dizaines de milliards) : le classement des fortunes,
// le luxe (superyacht, jet, île, château, résidences, personnel), les collections (art, chevaux de course, écurie
// automobile, grands crus, réserve naturelle), l'influence (médias, partis, rival milliardaire, OPA hostile,
// accaparer un marché, parrainer les grands événements), la philanthropie (fondation, bâtiments à son nom,
// promesse de donner la moitié), les grands projets (tour record, ville nouvelle, fusion, remède, Mars…),
// l'espace, les paris fous (ballon, abysses, Everest), les risques (enlèvement, fisc, scandales, enfants gâtés,
// faux amis, la chute), et ce qui reste : nécrologie, dynastie. Montants en dollars d'aujourd'hui.

const BN = 1e9;
const rankF = r => r === 1 ? "1re" : `${r}e`;
const fmtB = x => money(x);
// Le nombre de milliardaires dans le monde (en dollars d'aujourd'hui) et la plus grande fortune de chaque époque.
const BILLIONAIRES = [[1900, 15], [1920, 25], [1950, 40], [1970, 80], [1987, 140], [1995, 350], [2000, 470], [2008, 1100], [2015, 1800], [2021, 2750], [2025, 3000]];
const RICHEST = [[1900, 300], [1913, 400], [1929, 200], [1950, 60], [1970, 30], [1987, 40], [1995, 60], [1999, 150], [2009, 70], [2018, 160], [2021, 300], [2025, 450]];
function interpLog(tab, y, g = 0.03) {
  if (y <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (y <= tab[i][0]) { const [y0, a] = tab[i - 1], [y1, b] = tab[i]; return a * Math.exp(Math.log(b / a) * (y - y0) / (y1 - y0)); }
  const [yl, al] = tab[tab.length - 1];
  return al * Math.exp(g * (y - yl));
}
const worldRichest = y => interpLog(RICHEST, y, 0.02) * BN;
// Le poids économique d'un pays dans le monde (pour le classement national).
const _wsum = {};
function countryWeight(code, y) {
  if (!_wsum[y]) _wsum[y] = Object.keys(BY_CODE).reduce((s, k) => { const c = countryAt(k, y); return s + (c.pop || 0) * (c.gdp || 0); }, 0);
  const c = countryAt(code, y);
  return clamp((c.pop || 0) * (c.gdp || 0) / Math.max(1, _wsum[y]), 0, 0.5);
}
// Rang mondial et national, d'après une loi de Pareto, et le recordman de l'époque.
function fortuneRank(L, w = L.netWorth()) {
  const y = L.calYear, n = interpLog(BILLIONAIRES, y), top = worldRichest(y);
  if (w < BN * 0.05) return null;
  const world = w >= top ? 1 : Math.max(2, Math.round(n * (BN / w) ** 1.05));
  const nat = w >= top ? 1 : Math.max(1, Math.round(n * countryWeight(L.code, y) * 1.5 * (BN / w) ** 1.05));
  return { world, nat, top, n: Math.round(n) };
}

// --- Les catalogues ---------------------------------------------------------------------------------
// up : entretien par an (part de la valeur) ; appr : évolution de la valeur par an.
const LUXE = [
  { id: "yacht", label: "Superyacht", price: 3e8, up: 0.08, appr: -0.04, happy: 6, net: 2, from: 1930, text: "Fait construire un superyacht de cent mètres : hélistation, piscine, sous-marin de poche." },
  { id: "jet", label: "Jet privé long-courrier", price: 7e7, up: 0.1, appr: -0.06, happy: 4, net: 2, from: 1965, text: "S’offre un jet privé long-courrier : Paris, New York, Tokyo dans la même semaine." },
  { id: "island", label: "Île privée, à votre nom", price: 2e8, up: 0.03, appr: 0.02, happy: 5, net: 1, from: 1950, text: "Achète une île et lui donne son nom ; les cartes marines suivront." },
  { id: "chateau", label: "Château historique, restauré", price: 1.5e8, up: 0.03, appr: 0.02, happy: 4, net: 1, text: "Rachète un château historique en ruine et le fait restaurer pierre à pierre." },
  { id: "homes", label: "Résidences dans les grandes villes du monde", price: 4e8, up: 0.03, appr: 0.025, happy: 4, net: 2, text: "Achète des résidences à Paris, New York, Londres, Hong Kong et dans les Alpes ; chaque saison a sa maison." },
  { id: "staff", label: "Maison au complet : majordome, chefs, pilotes", price: 2e7, up: 0.6, appr: -1, happy: 3, net: 0, text: "Engage une maison complète : majordome, chefs étoilés, chauffeurs, pilotes, gouvernantes." },
  { id: "cars", label: "Collection de voitures de légende", price: 1e8, up: 0.02, appr: 0.04, happy: 3, net: 1, from: 1950, text: "Réunit une collection de voitures de légende dans un garage-musée." },
];
const ART_KINDS = [[0, "une toile de la Renaissance italienne"], [0, "un autoportrait d’un maître hollandais"], [0, "un grand paysage romantique"], [1890, "un tableau impressionniste"], [1910, "une toile cubiste"], [1950, "un grand tableau abstrait"], [1965, "une œuvre de pop art"], [1990, "une installation d’art contemporain"], [0, "une sculpture antique"]];
const HORSE_NAMES = ["Éclair de Minuit", "Roi du Vent", "Dame de Cœur", "Tonnerre d’Or", "Petite Folie", "Grand Seigneur", "Belle Étoile", "Rêve d’Ivoire", "Comète Rousse", "Sans Souci", "Prince Noir", "Brise du Nord", "Fleur de Sel", "Diable Bleu", "Ombre Légère"];
const BIG_RACES = ["le Prix de l’Arc de Triomphe", "le Derby d’Epsom", "la Melbourne Cup", "le Kentucky Derby", "la Dubai World Cup", "les Guinées"];
const SPECIES = ["rhinocéros noirs", "tigres", "condors des Andes", "orangs-outans", "éléphants", "gorilles des montagnes", "lynx", "tortues marines"];
const FX_CAUSES = [
  { id: "health", label: "la santé dans les pays pauvres (vaccins, paludisme)", unit: "enfants vaccinés ou soignés", cost: 40 },
  { id: "edu", label: "l’éducation", unit: "enfants scolarisés", cost: 400 },
  { id: "climate", label: "le climat et la nature", unit: "tonnes de CO2 évitées", cost: 30, from: 1990 },
  { id: "research", label: "la recherche médicale", unit: "chercheurs financés (années)", cost: 250000 },
  { id: "poverty", label: "la lutte contre la pauvreté", unit: "familles sorties de la misère", cost: 3000 },
  { id: "arts", label: "les arts et la culture", unit: "spectateurs accueillis", cost: 25 },
];
const BUILDINGS = [
  { id: "library", label: "une bibliothèque", name: n => `Bibliothèque ${n}`, cost: 5e7 },
  { id: "hospital", label: "une aile d’hôpital", name: n => `Aile ${n} de l’hôpital`, cost: 1.5e8 },
  { id: "museum", label: "un musée", name: n => `Musée ${n}`, cost: 4e8 },
  { id: "univ", label: "une université", name: n => `Université ${n}`, cost: 8e8 },
  { id: "opera", label: "un opéra", name: n => `Opéra ${n}`, cost: 6e8 },
  { id: "stadium", label: "un grand stade", name: n => `Stade ${n}`, cost: 1.5e9 },
];
const MEDIA = [
  { id: "paper", label: "Un grand quotidien national", price: 3e8, from: 1900, pop: 2 },
  { id: "radio", label: "Un réseau de radios", price: 2e8, from: 1925, pop: 2 },
  { id: "tv", label: "Une chaîne de télévision", price: 2.5e9, from: 1955, pop: 4 },
  { id: "web", label: "Un grand site d’information", price: 6e8, from: 2000, pop: 2 },
  { id: "social", label: "Un réseau social mondial", price: 4e10, from: 2010, pop: 6 },
];
const PROJECTS = [
  { id: "tower", label: "La plus haute tour du monde", cost: 2e9, years: 5, p: 0.85, from: 1930, asset: 1.1, ok: "La tour est inaugurée : la plus haute du monde, son nom en lettres de lumière au sommet.", ko: "Le chantier s’arrête : fissures, procès, une carcasse de béton qui défigure l’horizon." },
  { id: "airport", label: "Un aéroport international", cost: 5e9, years: 6, p: 0.8, from: 1950, asset: 1.2, ok: "Le premier avion se pose sur votre aéroport ; des millions de voyageurs suivront.", ko: "L’aéroport ouvre à moitié vide ; les compagnies boudent, les pistes rouillent." },
  { id: "city", label: "Une ville nouvelle, sortie du désert", cost: 2e10, years: 10, p: 0.6, from: 1950, asset: 1.3, ok: "La ville nouvelle accueille ses cent mille premiers habitants ; elle portera votre nom.", ko: "La ville nouvelle reste une ville fantôme : des tours vides au milieu du sable." },
  { id: "charter", label: "Une ville à charte, avec ses propres règles", cost: 1.5e10, years: 10, p: 0.4, from: 1990, asset: 1.2, ok: "La ville à charte prospère : entreprises et habitants affluent de partout.", ko: "Le pays hôte reprend la main sur la ville à charte ; l’expérience s’arrête." },
  { id: "micronation", label: "Une micronation sur une plateforme en mer", cost: 2e9, years: 4, p: 0.25, from: 1960, ok: "La micronation hisse son drapeau ; une poignée de pays la reconnaissent, le monde s’en amuse.", ko: "Les garde-côtes démantèlent la micronation ; il reste des timbres et des passeports de collection." },
  { id: "fusion", label: "Un réacteur à fusion nucléaire", cost: 1e10, years: 12, p: 0.15, from: 1990, ok: "Le réacteur produit plus d’énergie qu’il n’en consomme, des heures durant : une découverte historique.", ko: "Le réacteur à fusion ne tient jamais la réaction ; les ingénieurs promettent « dans trente ans »." },
  { id: "cure", label: "Un remède contre une grande maladie", cost: 5e9, years: 10, p: 0.3, from: 1960, ok: "Le traitement financé par votre argent guérit des millions de malades ; votre nom entre dans les manuels de médecine.", ko: "Les essais cliniques échouent l’un après l’autre ; le remède n’est pas pour cette fois." },
  { id: "supersonic", label: "Un avion de ligne supersonique", cost: 8e9, years: 8, p: 0.35, from: 1960, asset: 0.6, ok: "Votre avion supersonique relie Paris à New York en trois heures.", ko: "L’avion supersonique ne trouve pas de clients ; le prototype finit au musée." },
  { id: "sail", label: "Un défi pour la plus vieille coupe de voile", cost: 3e8, years: 3, p: 0.3, ok: "Votre bateau remporte la plus vieille coupe de voile du monde !", ko: "Votre bateau est éliminé en demi-finale de la grande coupe de voile." },
  { id: "ocean", label: "Nettoyer les océans du plastique", cost: 3e9, years: 8, p: 0.5, from: 2010, ok: "Vos navires ont retiré des millions de tonnes de plastique des océans.", ko: "Le grand projet de nettoyage des océans s’enlise : trop cher, trop vaste." },
  { id: "mars", label: "Une base habitée sur Mars", cost: 1e11, years: 15, p: 0.25, from: 2030, ok: "Les premiers humains vivent sur Mars, dans la base que vous avez financée.", ko: "La mission vers Mars est abandonnée ; il reste des plans et des rêves." },
];
const BETS = [
  { id: "balloon", label: "Le tour du monde en ballon, sans escale", cost: 1e7, risk: 0.04, from: 1980, ok: "Boucle le tour du monde en ballon, sans escale : vingt jours au-dessus des nuages.", cause: "accident de ballon au-dessus de l’océan" },
  { id: "abyss", label: "Plonger au fond de la fosse océanique la plus profonde", cost: 5e7, risk: 0.02, from: 1960, ok: "Touche le fond de la fosse la plus profonde de l’océan, à onze kilomètres sous la surface.", cause: "implosion d’un sous-marin dans les abysses" },
  { id: "everest", label: "Gravir l’Everest", cost: 1e6, risk: 0.02, from: 1953, ok: "Atteint le sommet de l’Everest au lever du soleil.", cause: "chute dans l’Himalaya" },
  { id: "pole", label: "Une expédition au pôle Sud, à ski", cost: 5e6, risk: 0.015, from: 1912, ok: "Atteint le pôle Sud à ski, après deux mois dans le blizzard.", cause: "froid extrême en Antarctique" },
  { id: "solo", label: "Le tour du monde à la voile, en solitaire", cost: 3e6, risk: 0.03, from: 1969, ok: "Boucle le tour du monde à la voile en solitaire, après des mois seul face aux vagues.", cause: "naufrage en solitaire" },
];
const SPACE_STAGES = ["un premier lancement réussi en orbite", "une capsule habitée", "une station spatiale privée", "un vol autour de la Lune", "des humains sur la Lune", "une mission vers Mars"];
const MARKETS = ["du cuivre", "du cacao", "de l’argent métal", "du café", "du nickel", "du blé"];
const NICKS = { club: "le roi du sport", shares: "le géant de la Bourse", biz: "le magnat", heir: "l’héritier", default: "le milliardaire" };

const F = L => {
  if (!L.fortune) L.fortune = { own: {}, art: [], horses: [], team: null, cellar: 0, reserve: null, media: {}, found: null, legacy: [], projects: [], stakes: [], guards: false, pledge: false, rival: null, space: null, peak: 0, ms: {}, did: {}, longevity: false, crypto: null, corner: null, haven: null, bets: [] };
  return L.fortune;
};
const surname = L => L.name;
// Les frais réguliers se paient avec l'argent disponible, jamais à crédit.
const afford = (L, x) => { if (Math.max(0, L.savings) < x) return false; L.pay(x); return true; };
const done = (L, k) => F(L).did[k] === L.age;
const mark = (L, k) => { F(L).did[k] = L.age; };
// Ce que valent les biens de grande fortune (comptés dans le patrimoine).
function fortuneAssets(L) {
  const f = L.fortune;
  if (!f) return 0;
  return Object.values(f.own).reduce((s, o) => s + o.value, 0) + f.art.reduce((s, a) => s + a.value, 0) + f.horses.reduce((s, h) => s + h.value, 0)
    + (f.team ? f.team.value : 0) + f.cellar + (f.reserve ? f.reserve.value : 0) + Object.values(f.media).reduce((s, m) => s + m.value, 0)
    + f.stakes.reduce((s, x) => s + x.value, 0) + (f.crypto ? f.crypto.cost : 0) + (f.corner ? f.corner.cost : 0);
}

Object.assign(Life.prototype, {
  // --- Chaque année ---
  fortuneYear() {
    if (!this.alive) return;
    if (this.dynastyNote) { this.say(this.dynastyNote, "family", true); this.dynastyNote = null; }
    const f = this.fortune, w = this.netWorth(), y = this.calYear;
    if (!f && w < BN) return;
    const Fx = F(this);
    Fx.peak = Math.max(Fx.peak, w);
    // Les biens : entretien, valeur.
    for (const [id, o] of Object.entries(Fx.own)) {
      const d = LUXE.find(x => x.id === id);
      if (!d) continue;
      if (!afford(this, id === "staff" ? d.price * d.up : o.value * d.up)) {
        delete Fx.own[id]; if (o.value > 0) this.addMoney(o.value * 0.7);
        this.say(`Faute de liquidités pour l’entretenir, se sépare de : ${d.label.toLowerCase()}${o.value > 0 ? ` (vendu ${money(o.value * 0.7)})` : ""}.`, "money", true); this.bump("happy", -3);
        continue;
      }
      if (id !== "staff") o.value *= Math.exp(d.appr + randn() * 0.05);
      this.bump("happy", d.happy / 6);
      this.network += d.net / 10;
    }
    if (Fx.own.staff && rand() < 0.02) { this.say("Un ancien majordome publie ses mémoires : caprices, disputes, secrets de famille. Le livre se vend très bien.", "life", true); this.bump("happy", -4); }
    for (const a of Fx.art) { a.value *= Math.exp(0.03 + randn() * 0.12); if (a.fake && !a.outed && rand() < 0.05) { a.outed = true; a.value *= 0.02; this.say(`Une expertise révèle que ${a.t} de votre collection est un faux. Il ne vaut presque plus rien.`, "money", true); this.bump("happy", -5); } }
    Fx.cellar *= Math.exp(0.05 + randn() * 0.06);
    this.horsesYear(); this.teamYear(); this.spaceYear(); this.projectsYear();
    if (Fx.reserve) {
      afford(this, Fx.reserve.value * 0.06);
      if (rand() < 0.5) { const n = 2 + Math.floor(rand() * 12); Fx.reserve.saved += n; this.say(`Dans votre réserve, ${n} jeunes ${Fx.reserve.sp} sont nés cette année (${Fx.reserve.saved} au total).`, "life"); }
      if (rand() < 0.06) { this.say(`Des braconniers s’attaquent à votre réserve ; les gardes en arrêtent une partie. Il faudra plus de surveillance.`, "life", true); Fx.reserve.saved = Math.max(0, Fx.reserve.saved - 3); afford(this, Fx.reserve.value * 0.05); }
    }
    for (const [id, m] of Object.entries(Fx.media)) {
      m.value *= Math.exp(-0.01 + randn() * 0.08);
      const P = this.politics; if (P) { P.pop = clamp(P.pop + (MEDIA.find(x => x.id === id) || { pop: 2 }).pop / 2, 0, 100); P.lob.media = (P.lob.media || 0) + 5; }
      if (rand() < 0.03) { this.say(`On vous accuse d’orienter la ligne de votre ${id === "paper" ? "journal" : id === "tv" ? "chaîne" : "média"} ; la rédaction se met en grève.`, "work", true); this.bump("happy", -3); }
    }
    for (const s of Fx.stakes) { s.value *= Math.exp(0.04 + randn() * 0.12); this.addMoney(s.value * 0.03); }
    // Fondation : chaque année, elle dépense 5 % de sa dotation.
    if (Fx.found) {
      const c = FX_CAUSES.find(x => x.id === Fx.found.cause), spend = Fx.found.endow * 0.05;
      Fx.found.endow *= 1.02; Fx.found.spent += spend;
      const units = Math.round(spend / (c.cost * Math.max(0.3, median(this.here) / 30000)) * (0.7 + rand() * 0.6));
      Fx.found.units += units;
      if (rand() < 0.4) this.say(`Votre fondation (${c.label}) : ${units.toLocaleString("fr-FR")} ${c.unit} cette année, ${Math.round(Fx.found.units).toLocaleString("fr-FR")} depuis sa création.`, "family");
      if (c.id === "research" && Fx.found.spent > 5 * BN && !Fx.found.breakthrough && rand() < 0.08) { Fx.found.breakthrough = true; this.say("Des chercheurs financés par votre fondation font une découverte majeure : un nouveau traitement sauve des vies dans le monde entier.", "family", true); this.bump("happy", 10); Fx.legacy.push(`une découverte médicale, financée par sa fondation`); }
      this.bump("happy", 1); this.bump("rel", 0.5);
    }
    // Promesse de donner la moitié : chaque année, une part de la fortune part à la fondation.
    if (Fx.pledge && w > BN) { const give = Math.max(0, this.savings) * 0.03; this.pay(give); if (Fx.found) Fx.found.endow += give; }
    if (Fx.guards && !afford(this, 5e6)) { Fx.guards = false; this.say("Faute de liquidités, renvoie sa garde rapprochée.", "family"); }
    if (Fx.longevity && !afford(this, 2e7)) { Fx.longevity = false; this.say("Faute de liquidités, quitte la clinique de longévité.", "health"); }
    if (Fx.longevity) { this.bump("health", 1.5); if (rand() < 0.1) this.say(pick(["Transfusions, cryothérapie, compléments par dizaines : sa routine de jeunesse éternelle fait sourire la presse.", "Son médecin de la longévité lui promet de vivre cent vingt ans."]), "health"); }
    if (Fx.crypto && Fx.crypto.at < this.age) this.cryptoResult();
    if (Fx.corner && Fx.corner.at < this.age) this.cornerResult();
    this.richList(w);
    this.rivalYear(w);
    this.fortuneEvents(w);
  },
  // --- Le classement des fortunes ---
  richList(w) {
    const Fx = F(this), r = fortuneRank(this, w), y = this.calYear, ms = Fx.ms;
    if (!r) { if (Fx.peak >= BN && w < 1e8 && !ms.fall) { ms.fall = y; this.say(`La chute : de ${fmtB(Fx.peak)} au sommet, il ne reste presque rien. Les amis se font rares, les créanciers non.`, "money", true); this.bump("happy", -15); } return; }
    Fx.rank = r;
    // Plusieurs paliers franchis la même année : on n'annonce que le plus haut.
    let best = null;
    const step = (k, cond, text, h = 6) => { if (cond && !ms[k]) { ms[k] = y; best = [text, h]; this.network += 1; } };
    if (ms.fall && w >= BN && !ms.comeback) { ms.comeback = y; this.say("Le grand retour : après la chute, de nouveau milliardaire. Les journaux parlent de « résurrection ».", "money", true); this.bump("happy", 12); }
    step("b1", w >= BN, `Devient milliardaire : ${fmtB(w)}. ${y < 1980 ? "Une poignée de personnes au monde en sont là." : `Parmi les ${r.n.toLocaleString("fr-FR")} milliardaires de la planète.`}`);
    step("b10", w >= 10 * BN, `Plus de dix milliards : ${rankF(r.world)} fortune mondiale.`, 6);
    step("top100", r.world <= 100, `Entre dans le classement des cent plus grandes fortunes du monde (${rankF(r.world)}).`, 6);
    step("nat1", r.nat === 1, `Devient la première fortune du pays (${this.here.name}).`, 6);
    step("b100", w >= 100 * BN, `Plus de cent milliards : un club de quelques personnes sur toute la planète.`, 8);
    step("top10", r.world <= 10, `Entre dans les dix plus grandes fortunes du monde (${rankF(r.world)}).`, 8);
    step("world1", r.world === 1, `Devient la personne la plus riche du monde (${fmtB(w)}).`, 12);
    step("history", w >= 450 * BN && w > RICHEST.reduce((m, x) => Math.max(m, x[1] * BN), 0), "La plus grande fortune de l’histoire, devant tous les magnats du passé.", 12);
    if (best) { this.say(best[0], "money", true); this.bump("happy", best[1]); }
    // La presse.
    if (w >= BN && rand() < 0.25) {
      if (!Fx.nick) {
        const clubs = (this.businesses || []).filter(b => typeof isClub === "function" && isClub(b)).length, biz = (this.businesses || []).length, sh = typeof this.sharesValue === "function" ? this.sharesValue() : 0;
        Fx.nick = clubs ? NICKS.club : sh > w * 0.4 ? NICKS.shares : biz ? `${NICKS.biz} des affaires` : this.lineage ? NICKS.heir : NICKS.default;
        Fx.nick = this.g(Fx.nick, Fx.nick.replace(/^le roi/, "la reine").replace(/^le magnat/, "la magnate").replace(/^l’héritier/, "l’héritière").replace(/^le milliardaire/, "la milliardaire").replace(/^le géant/, "la géante"));
      }
      this.say(pick([`En couverture d’un grand magazine économique : « ${capFirst(Fx.nick)} », ${rankF(r.world)} fortune mondiale.`, `Un portrait au vitriol dans la presse : « ${capFirst(Fx.nick)}, l’argent sans limites ».`, `Les classements de fortune de l’année : ${rankF(r.world)} au monde, ${rankF(r.nat)} du pays.`]), "money");
    }
    if (w >= 10 * BN && rand() < 0.2) { this.say(pick(["Invité au grand forum économique dans les Alpes : dîners avec des chefs d’État et des patrons du monde entier.", "Un dîner privé avec un président ; on parle d’investissements et de « partenariat ».", "Un gala à New York ; tout le monde veut une photo avec vous."]), "work"); this.network += 1; }
  },
  // --- Un rival milliardaire ---
  rivalYear(w) {
    const Fx = F(this);
    if (!Fx.rival && w >= BN) {
      const code = pick(["US", "FR", "GB", "DE", "CN", "IN", "JP", "BR", "MX", "RU", "SA", "KR", "IT", "ES"].filter(c => BY_CODE[c])), sx = rand() < 0.7 ? "m" : "f";
      Fx.rival = { name: `${this.freshName(sx, code)} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`, sex: sx, code, worth: w * (0.8 + rand() * 0.6), ahead: null };
      this.say(`Un rival s’impose dans les classements : ${Fx.rival.name} ${BY_CODE[code].flag}, une fortune comparable à la vôtre. La presse adore vous opposer.`, "money", true);
    }
    const R = Fx.rival;
    if (!R) return;
    R.worth *= Math.exp(0.04 + randn() * 0.18);
    const ahead = w > R.worth;
    if (R.ahead !== null && ahead !== R.ahead) { this.say(ahead ? `Vous dépassez ${R.name} dans le classement des fortunes ; ${R.sex === "m" ? "il" : "elle"} ne vous le pardonnera pas.` : `${R.name} vous dépasse dans le classement des fortunes.`, "money", true); this.bump("happy", ahead ? 4 : -4); }
    R.ahead = ahead;
    if (rand() < 0.08) {
      const biz = (this.businesses || []).filter(b => !minority(b) && b.value > 0).sort((a, b) => b.value - a.value)[0];
      if (biz && biz.value > 5e8) {
        const nm = typeof isClub === "function" && isClub(biz) ? biz.club.name : biz.label, cost = biz.value * 0.2;
        this.ask(`${R.name} lance une offensive pour prendre le contrôle de ${nm}. Que faire ?`, [
          { label: "Défendre : racheter des parts sur le marché", sub: `≈ ${money(cost)}`, autoWeight: 2, apply: () => { this.pay(cost); biz.value *= 1.05; this.say(`Repousse l’offensive de ${R.name} sur ${nm}, au prix fort.`, "money", true); } },
          { label: "Vendre au prix fort", sub: `≈ ${money(biz.value * (biz.stake ?? 1) * 1.3)} : une belle plus-value, mais ${nm} passe à l’ennemi`, autoWeight: 0.6, apply: () => { const i = this.businesses.indexOf(biz); if (i < 0 || !this.focusBiz(biz)) return; this.addMoney(biz.value * (biz.stake ?? 1) * 1.3); this.say(`Vend ${nm} à ${R.name}, avec une prime de 30 %.`, "money", true); this.dropBusiness(); this.bizFocus = 0; R.worth += biz.value; } },
        ]);
      } else if (rand() < 0.5) this.say(pick([`${R.name} vous souffle un club que vous convoitiez.`, `${R.name} se moque de vous dans une interview ; la réponse fait le tour des réseaux.`, `${R.name} fait construire un yacht plus long que le vôtre, de quelques mètres.`]), "money");
    }
  },
  // --- Des événements de grande fortune ---
  fortuneEvents(w) {
    if (w < BN || this.queue.length > 3) return;
    const Fx = F(this), m = Math.max(1e6, w * 0.0005);
    // Enlèvement, extorsion (beaucoup moins avec une garde rapprochée).
    if (!this.classroom && rand() < 0.025 * (Fx.guards ? 0.15 : 1)) {
      const kid = this.children.find(k => k.alive && k.age < 25), who = kid ? kid.name : "vous", ransom = Math.max(5e6, w * 0.002);
      this.ask(kid ? `${kid.name} a été enlevé${kid.sex === "f" ? "e" : ""}. Les ravisseurs réclament ${money(ransom)}.` : `Des maîtres chanteurs menacent de s’en prendre à vous et réclament ${money(ransom)}.`, [
        { label: "Payer", sub: money(ransom), autoWeight: 2, apply: () => { this.pay(ransom); this.say(kid ? `Paie la rançon ; ${kid.name} rentre à la maison, sous le choc.` : "Paie les maîtres chanteurs ; l’angoisse reste.", "family", true); this.bump("happy", -8); } },
        { label: "Laisser faire la police", sub: "Plus risqué", autoWeight: 1, apply: () => { if (rand() < 0.8) { this.say(`La police ${kid ? `libère ${kid.name}` : "arrête les maîtres chanteurs"}.`, "family", true); this.bump("happy", -4); } else { this.say(kid ? `L’intervention tourne mal ; ${kid.name} est blessé${kid.sex === "f" ? "e" : ""}, mais en vie.` : "Les menaces continuent des mois durant.", "family", true); this.bump("happy", -14); } } },
      ]);
      this.say(`${who === "vous" ? "Vous recevez" : "La famille reçoit"} des menaces ; il faudrait songer à une garde rapprochée.`, "family");
      return;
    }
    // Enfants gâtés, ou qui rejettent l'argent.
    const kid = this.children.find(k => k.alive && k.age >= 16 && k.age <= 35);
    if (kid && rand() < 0.08) {
      if (rand() < 0.65) this.ask(`${kid.name} dépense des fortunes : fêtes, voitures, frasques dans la presse people. Que faire ?`, [
        { label: "Couper les vivres", autoWeight: 1, apply: () => { this.say(`Coupe les vivres à ${kid.name} ; la dispute est violente.`, "family", true); this.bump("rel", -4); } },
        { label: "Laisser faire", sub: money(m * 4), autoWeight: 1, apply: () => { this.pay(m * 4); this.say(`Laisse ${kid.name} vivre sa vie de fête.`, "family"); this.bump("rel", 1); } },
        { label: "Lui confier un vrai poste dans le groupe", autoWeight: 1, apply: () => { this.say(`Confie à ${kid.name} un poste dans le groupe ; ${rand() < 0.5 ? "une révélation" : "un désastre"}.`, "family", true); } },
      ]);
      else { this.say(`${kid.name} refuse l’argent de la famille et part vivre simplement, loin des yachts et des galas.`, "family", true); this.bump("happy", -2); }
      return;
    }
    // Faux amis et vrais projets.
    if (rand() < 0.08) {
      const sum = m * (2 + rand() * 8);
      this.ask(`Un ami d’enfance revient avec un « projet en or » et vous demande ${money(sum)}.`, [
        { label: "Investir", sub: money(sum), autoWeight: 1, apply: () => { this.pay(sum); if (rand() < 0.3) { this.addMoney(sum * 3); this.say("Le projet de votre ami d’enfance marche : il vous rend trois fois la mise.", "money", true); } else this.say("Le « projet en or » s’évapore ; l’ami aussi.", "money", true); } },
        { label: "Refuser", autoWeight: 1.5, apply: () => { this.say("Refuse d’investir dans le projet d’un ami ; l’amitié n’y survit pas.", "family"); this.bump("rel", -2); } },
      ]);
      return;
    }
    // Scandale.
    if (rand() < 0.04 * (Object.keys(Fx.media).length ? 0.5 : 1)) {
      const what = pick(["des montages fiscaux révélés par une fuite de documents", "les conditions de travail chez un fournisseur", "une soirée qui a mal tourné", "un conflit d’intérêts avec un ministre", "des propos tenus en privé et enregistrés"]);
      this.ask(`Scandale : la presse révèle ${what}. Votre réaction ?`, [
        { label: "Tout nier", autoWeight: 1, apply: () => { if (rand() < 0.5) this.say("Nie tout ; l’affaire retombe.", "work", true); else { this.say("Nie tout ; de nouvelles révélations aggravent l’affaire.", "work", true); this.bump("happy", -8); if (this.politics) this.politics.pop = clamp(this.politics.pop - 12, 0, 100); } } },
        { label: "Transiger, payer, tourner la page", sub: money(m * 20), autoWeight: 1, apply: () => { this.pay(m * 20); this.say("Paie une transaction ; l’affaire est close, l’image écornée.", "work", true); this.bump("happy", -3); } },
        { label: "Reconnaître et réparer", autoWeight: 1, apply: () => { this.pay(m * 10); this.say("Reconnaît ses torts publiquement et répare ; on salue sa franchise.", "work", true); this.bump("rel", 2); } },
      ]);
    }
  },
  // --- Chevaux de course ---
  horsesYear() {
    const Fx = F(this);
    for (const h of [...Fx.horses]) {
      h.age += 1;
      if (h.age >= 2 && h.age <= 5) {
        const win = rand() < clamp((h.r - 60) / 60, 0.02, 0.6);
        if (win && h.r >= 80 && rand() < 0.4) { const race = pick(BIG_RACES); h.big = (h.big || 0) + 1; h.value *= 3; this.addMoney(h.value * 0.3); this.say(`${h.n} remporte ${race} ! Votre casaque en photo dans tous les journaux hippiques.`, "life", true); this.bump("happy", 6); Fx.legacy.push(`${race} avec ${h.n}`); }
        else if (win) { h.value *= 1.4; this.addMoney(h.value * 0.1); this.say(`${h.n} gagne une belle course.`, "life"); }
        else h.value *= 0.85;
      } else if (h.age > 5) {
        if (h.big) { this.addMoney(h.value * 0.15); if (!h.stud) { h.stud = true; this.say(`${h.n} prend sa retraite au haras : ses saillies se vendent à prix d’or.`, "life"); } }
        else { Fx.horses.splice(Fx.horses.indexOf(h), 1); this.say(`${h.n} prend sa retraite dans un pré.`, "life"); }
        if (h.age > 22) { Fx.horses.splice(Fx.horses.indexOf(h), 1); }
      }
    }
  },
  // --- L'écurie de course automobile ---
  teamYear() {
    const T = F(this).team;
    if (!T) return;
    if (!afford(this, T.budget)) { T.value *= 0.9; this.say(`Faute de budget, votre écurie ${T.name} ne prend pas le départ de la saison ; les pilotes s’en vont.`, "life", true); T.t = Math.max(20, T.t - 10); return; }
    T.t = clamp(T.t + (Math.log(T.budget / 2e8) * 6) + randn() * 4, 20, 100);
    const rank = clamp(Math.round(1 + (100 - T.t) / 9 + randn() * 1.5), 1, 10);
    T.value *= rank <= 3 ? 1.1 : 0.97;
    if (rank === 1) { T.titles = (T.titles || 0) + 1; this.say(`Votre écurie (${T.name}) remporte le championnat du monde ! Champagne sur le podium.`, "life", true); this.bump("happy", 10); F(this).legacy.push(`un titre mondial pour l’écurie ${T.name} (${this.calYear})`); }
    else this.say(`Saison de votre écurie ${T.name} : ${rankTxt(rank)} du championnat du monde des constructeurs.`, "life");
  },
  // --- Le programme spatial ---
  spaceYear() {
    const S = F(this).space;
    if (!S || S.done) return;
    if (!afford(this, S.budget)) { this.say("Faute d’argent disponible, votre programme spatial est en pause cette année.", "work"); return; }
    const p = clamp(0.55 + S.years * 0.04 - S.stage * 0.06, 0.15, 0.9);
    S.years += 1;
    if (rand() < p) {
      const what = SPACE_STAGES[S.stage];
      S.stage += 1;
      this.say(`Votre programme spatial réussit ${what} ! ${S.stage >= 5 ? "L’histoire de l’humanité retiendra votre nom." : ""}`, "work", true); this.bump("happy", 8); this.network += 2;
      F(this).legacy.push(`${what} (${this.calYear})`);
      if (S.stage >= SPACE_STAGES.length || (S.stage >= 4 && this.calYear < 2030)) S.done = true;
    } else this.say(pick(["La fusée explose quelques secondes après le décollage ; les ingénieurs parlent de « désassemblage rapide imprévu ».", "Le lancement est reporté toute l’année : moteurs, météo, autorisations.", "Un échec en orbite : la capsule est perdue."]), "work", true);
  },
  // --- Les grands projets ---
  projectsYear() {
    const Fx = F(this), stopped = [];
    for (const P of [...Fx.projects]) {
      const d = PROJECTS.find(x => x.id === P.id), part = d.cost / d.years;
      if (!afford(this, part)) { stopped.push(d.label.toLowerCase()); P.idle = (P.idle || 0) + 1; if (P.idle >= 3) { Fx.projects.splice(Fx.projects.indexOf(P), 1); this.say(`Après trois ans d’arrêt, ${d.label.toLowerCase()} est abandonné ; l’argent dépensé est perdu.`, "work", true); this.bump("happy", -5); } continue; }
      P.idle = 0; P.left -= 1;
      if (P.left > 0) { if (rand() < 0.3) this.say(`${d.label} : le chantier avance (${d.years - P.left}/${d.years} ans).`, "work"); continue; }
      Fx.projects.splice(Fx.projects.indexOf(P), 1);
      if (rand() < d.p) {
        this.say(d.ok, "work", true); this.bump("happy", 12); this.network += 3;
        Fx.legacy.push(d.label.replace(/^(Un|Une|La|Le) /, m => m.toLowerCase()));
        if (d.asset) Fx.stakes.push({ n: d.label, value: d.cost * d.asset });
      } else { this.say(d.ko, "work", true); this.bump("happy", -8); }
    }
    if (stopped.length) this.say(`Faute d’argent disponible, chantier${stopped.length > 1 ? "s" : ""} suspendu${stopped.length > 1 ? "s" : ""} cette année : ${stopped.join(", ")}.`, "work");
  },
  cryptoResult() {
    const Fx = F(this), c = Fx.crypto, r = rand();
    Fx.crypto = null;
    if (r < 0.3) { this.addMoney(c.cost * 20); this.say(`Votre cryptomonnaie s’envole : ×20. Les réseaux vous appellent « le visionnaire ».`.replace("le visionnaire", this.g("le visionnaire", "la visionnaire")), "money", true); this.bump("happy", 8); }
    else if (r < 0.7) { this.say("Votre cryptomonnaie s’effondre à zéro en une nuit.", "money", true); this.bump("happy", -6); }
    else { this.pay(c.cost * 0.5); this.say("Votre cryptomonnaie s’effondre ; des petits épargnants portent plainte, une enquête est ouverte. Amende.", "money", true); this.bump("happy", -10); }
  },
  cornerResult() {
    const Fx = F(this), c = Fx.corner, r = rand();
    Fx.corner = null;
    if (r < 0.45) { this.addMoney(c.cost * 1.8); this.say(`Vous contrôlez le marché ${c.what} : les prix s’envolent, vous revendez avec 80 % de bénéfice.`, "money", true); this.bump("happy", 6); }
    else if (r < 0.8) { this.addMoney(c.cost * 0.4); this.say(`Le marché ${c.what} se retourne contre vous : vous revendez à perte.`, "money", true); this.bump("happy", -6); }
    else { this.addMoney(c.cost * 0.6); this.say(`Les autorités enquêtent sur votre mainmise sur le marché ${c.what} : vente forcée, amende, gros titres.`, "money", true); this.bump("happy", -8); }
  },
});

// --- Les gestes ---------------------------------------------------------------------------------------
// tab : onglet ; cost : prix (null : gratuit) ; ok : true ou la raison.
function fortuneActions(L) {
  const Fx = F(L), y = L.calYear, w = L.netWorth(), cash = Math.max(0, L.savings), out = [];
  const add = (tab, id, arg, label, sub, cost = 0, okWhy = true) => {
    let ok = okWhy, why = typeof okWhy === "string" ? okWhy : "";
    if (ok === true && cost > cash) { ok = false; why = "pas assez d’argent disponible"; }
    out.push({ tab, id, arg, label, sub: cost ? `${money(cost)}${sub ? " · " + sub : ""}` : sub, ok: ok === true, why });
  };
  // Luxe.
  for (const d of LUXE) {
    if (d.from && y < d.from) continue;
    const o = Fx.own[d.id];
    if (o) add("Luxe", "sellLuxe", d.id, `Se séparer : ${d.label.toLowerCase()}`, d.id === "staff" ? "" : `revente ≈ ${money(o.value * 0.8)}`);
    else add("Luxe", "buyLuxe", d.id, d.label, `entretien ≈ ${money(d.id === "staff" ? d.price * d.up : d.price * d.up)} par an`, d.price);
  }
  add("Luxe", "longevity", 0, Fx.longevity ? "Arrêter la clinique de longévité" : "Une clinique de longévité", Fx.longevity ? "" : "≈ 20 M$ par an · santé +, un peu de moqueries", Fx.longevity ? 0 : 2e7);
  // Collections.
  add("Collections", "art", 0, "Acheter un chef-d’œuvre aux enchères", "de 10 à 450 M$ · la cote monte… sauf si c’est un faux", 0, Fx.did.art === L.age ? "déjà cette année" : cash < 1e7 ? "pas assez d’argent disponible" : true);
  if (Fx.art.length) { add("Collections", "lendArt", 0, "Prêter la collection à un grand musée", "relations et prestige", 0, done(L, "lendArt") ? "déjà cette année" : true); add("Collections", "sellArt", 0, "Vendre la collection aux enchères", `≈ ${money(Fx.art.reduce((s, a) => s + a.value, 0))}`); }
  add("Collections", "horse", 0, "Acheter un yearling (un pur-sang d’un an)", "les grandes courses, puis le haras", 3e6);
  if (!Fx.team && y >= 1950) add("Collections", "team", 0, "Fonder une écurie de course automobile", "budget de course chaque année", 3e8);
  if (Fx.team) { add("Collections", "teamBudget", Fx.team.budget >= 4e8 ? 1.5e8 : 4.5e8, Fx.team.budget >= 4e8 ? "Écurie : budget réduit" : "Écurie : budget de champion", Fx.team.budget >= 4e8 ? "150 M$ par an" : "450 M$ par an"); add("Collections", "sellTeam", 0, `Vendre l’écurie ${Fx.team.name}`, `≈ ${money(Fx.team.value)}`); }
  add("Collections", "cellar", 0, "Constituer une cave de grands crus", Fx.cellar ? `cave ≈ ${money(Fx.cellar)}` : "une valeur qui vieillit bien", 2e7);
  if (Fx.cellar > 0) add("Collections", "sellCellar", 0, "Vendre la cave", `≈ ${money(Fx.cellar)}`);
  if (!Fx.reserve) add("Collections", "reserve", 0, "Acheter une réserve naturelle (des milliers d’hectares)", "sauver une espèce menacée", 6e7);
  // Influence.
  for (const d of MEDIA) { if (y < d.from) continue; if (Fx.media[d.id]) add("Influence", "sellMedia", d.id, `Vendre : ${d.label.toLowerCase()}`, `≈ ${money(Fx.media[d.id].value)}`); else add("Influence", "buyMedia", d.id, `Racheter ${d.label.toLowerCase()}`, "popularité, image ; accusations de manipulation", d.price); }
  add("Influence", "party", 0, L.politics ? "Financer votre campagne et votre parti" : "Financer un parti et des groupes de pression", L.politics ? "popularité +, risque de scandale" : "relations +, risque de scandale", 5e7, done(L, "party") ? "déjà cette année" : true);
  add("Influence", "sponsor", 0, y >= 1960 ? "Parrainer les Jeux olympiques ou la Coupe du monde" : "Parrainer une exposition universelle", "prestige mondial", 2e8, done(L, "sponsor") ? "déjà cette année" : true);
  add("Influence", "corner", 0, `Accaparer le marché ${pick(MARKETS)}`, "un an plus tard : gros gain, perte ou enquête", Math.max(1e9, w * 0.05), Fx.corner ? "une opération est en cours" : w < 5 * BN ? "il faut une fortune de plus de 5 milliards" : true);
  if (Fx.rival) add("Influence", "hostile", 0, `OPA hostile sur le groupe de ${Fx.rival.name}`, `une chance sur deux · le groupe vaut ≈ ${money(Fx.rival.worth * 0.5)}`, Fx.rival.worth * 0.5, done(L, "hostile") ? "déjà tenté cette année" : true);
  if (y >= 2014) add("Influence", "crypto", 0, "Lancer sa propre cryptomonnaie", "un an plus tard : ×20, zéro ou enquête", 5e7, Fx.crypto ? "déjà en cours" : true);
  if (!Fx.haven) { const hv = ["MC", "CH", "AE"].filter(c => c !== L.code && BY_CODE[c] && (c !== "AE" || y >= 1990)); if (hv.length) add("Influence", "haven", hv[0], `S’exiler fiscalement ${inCountry(BY_CODE[hv[0]])}`, "moins d’impôts ; loin des siens, et mal vu au pays", 0); }
  add("Influence", "optim", 0, "Optimisation fiscale agressive", "un gain… et un risque de redressement", 0, done(L, "optim") ? "déjà cette année" : w < BN ? "réservé aux milliardaires" : true);
  // Philanthropie.
  if (!Fx.found) for (const c of FX_CAUSES.filter(c => !c.from || y >= c.from)) add("Philanthropie", "found", c.id, `Créer sa fondation : ${c.label}`, "dotation : 5 % de votre fortune", Math.max(1e7, w * 0.05));
  else add("Philanthropie", "endow", 0, "Doter la fondation", `dotation actuelle ≈ ${money(Fx.found.endow)}`, Math.max(1e7, w * 0.05));
  for (const b of BUILDINGS) if (!Fx.legacy.includes(b.name(surname(L)))) add("Philanthropie", "build", b.id, `Offrir ${b.label} à votre nom`, b.name(surname(L)), b.cost);
  if (!Fx.pledge) add("Philanthropie", "pledge", 0, "S’engager à donner la moitié de sa fortune", "3 % chaque année à votre fondation ; vos héritiers grincent des dents", 0, w < BN ? "réservé aux milliardaires" : !Fx.found ? "créez d’abord votre fondation" : true);
  // Grands projets.
  for (const d of PROJECTS) {
    if (d.from && y < d.from) continue;
    const P = Fx.projects.find(p => p.id === d.id);
    if (P) add("Projets", "stopProject", d.id, `Abandonner : ${d.label.toLowerCase()}`, `${P.left} an${P.left > 1 ? "s" : ""} de travaux restants`);
    else add("Projets", "project", d.id, d.label, `par an, ${money(d.cost)} en tout sur ${d.years} ans · chances ≈ ${Math.round(d.p * 100)} %`, d.cost / d.years);
  }
  // Espace et aventures.
  if (y >= 2021) add("Aventures", "flight", "sub", "Un vol suborbital", "quelques minutes en apesanteur", 5e5);
  if (y >= 2001) add("Aventures", "flight", "iss", "Un séjour dans une station spatiale", "dix jours en orbite", 5.5e7);
  if (y >= 2028) add("Aventures", "flight", "moon", "Un tour de la Lune", "une semaine dans l’espace lointain", 5e8);
  if (y >= 2002 && !Fx.space) add("Aventures", "space", 0, "Fonder son programme spatial", "1 milliard, puis 500 millions par an", 1e9);
  if (Fx.space && !Fx.space.done) add("Aventures", "stopSpace", 0, "Arrêter le programme spatial", `étape : ${Fx.space.stage ? SPACE_STAGES[Fx.space.stage - 1] : "premier lancement à venir"}`);
  for (const b of BETS) if (!b.from || y >= b.from) add("Aventures", "bet", b.id, b.label, Fx.bets.includes(b.id) ? "déjà accompli" : `risque réel · prestige immense`, b.cost, Fx.bets.includes(b.id) ? "déjà accompli" : L.age > 75 ? "trop âgé" : true);
  // Sécurité.
  add("Aventures", "guards", 0, Fx.guards ? "Renvoyer la garde rapprochée" : "Engager une garde rapprochée", Fx.guards ? "" : "5 M$ par an · enlèvements et menaces bien plus rares", 0);
  return out;
}
const FX_TABS = ["Fortune", "Luxe", "Collections", "Influence", "Philanthropie", "Projets", "Aventures"];
function fortuneDo(L, id, arg) {
  if (!L.alive) return null;
  const o = fortuneActions(L).find(x => x.id === id && String(x.arg) === String(arg));
  if (!o) return null;
  if (!o.ok) return `Impossible : ${o.why}.`;
  const Fx = F(L), y = L.calYear, w = L.netWorth(), cash = Math.max(0, L.savings);
  switch (id) {
    case "buyLuxe": { const d = LUXE.find(x => x.id === arg); L.pay(d.price); Fx.own[d.id] = { value: d.id === "staff" ? 0 : d.price, since: y }; L.say(d.text, "money", true); L.bump("happy", d.happy); L.network += d.net; return d.label; }
    case "sellLuxe": { const o2 = Fx.own[arg]; L.addMoney(o2.value * 0.8); delete Fx.own[arg]; L.say(`Se sépare de : ${LUXE.find(x => x.id === arg).label.toLowerCase()}.`, "money"); return `+${money(o2.value * 0.8)}`; }
    case "longevity": Fx.longevity = !Fx.longevity; L.say(Fx.longevity ? "S’inscrit dans une clinique de longévité : bilans, thérapies, régime millimétré." : "Renonce à la clinique de longévité.", "health"); return Fx.longevity ? "Clinique de longévité" : "Arrêtée";
    case "art": {
      mark(L, "art");
      const price = clamp(Math.exp(Math.log(2e7) + Math.abs(randn()) * 1.3), 1e7, 4.5e8);
      if (price > cash) return `Le chef-d’œuvre de la vente part à ${money(price)} : trop cher pour vous cette fois.`;
      const t = pick(ART_KINDS.filter(([from]) => y >= from + 5))[1];
      L.pay(price); Fx.art.push({ t, value: price, fake: rand() < 0.04, y });
      L.say(`Remporte aux enchères ${t} pour ${money(price)} ; la salle applaudit.`, "money", true); L.bump("happy", 3); return `${capFirst(t)} · ${money(price)}`;
    }
    case "lendArt": mark(L, "lendArt"); L.network += 2; L.bump("happy", 2); L.say("Prête sa collection à un grand musée : une exposition à son nom, des files d’attente sur le trottoir.", "life", true); return "Exposition à votre nom";
    case "sellArt": { const v = Fx.art.reduce((s, a) => s + a.value, 0) * (0.85 + rand() * 0.3); L.addMoney(v); Fx.art = []; L.say(`Vend sa collection aux enchères : ${money(v)}.`, "money", true); return `+${money(v)}`; }
    case "horse": { const h = { n: pick(HORSE_NAMES.filter(n => !Fx.horses.some(x => x.n === n))) || pick(HORSE_NAMES), r: clamp(Math.round(65 + randn() * 12), 30, 99), age: 1, value: 3e6 }; L.pay(3e6); Fx.horses.push(h); L.say(`Achète un yearling, ${h.n} ; l’entraîneur se dit « très confiant ».`, "life"); return h.n; }
    case "team": { const n = `${surname(L)} Racing`; L.pay(3e8); Fx.team = { name: n, t: 45, budget: 2e8, value: 3e8 }; L.say(`Fonde une écurie de course automobile : ${n}. Les premières saisons seront dures.`, "life", true); L.bump("happy", 4); return n; }
    case "teamBudget": Fx.team.budget = +arg; L.say(+arg >= 4e8 ? "Donne à son écurie un budget de champion." : "Réduit le budget de son écurie.", "life"); return `Budget : ${money(+arg)} par an`;
    case "sellTeam": { const v = Fx.team.value; L.addMoney(v); L.say(`Vend son écurie ${Fx.team.name} pour ${money(v)}.`, "money", true); Fx.team = null; return `+${money(v)}`; }
    case "cellar": L.pay(2e7); Fx.cellar += 2e7; L.say("Enrichit sa cave de grands crus : les meilleures années, les plus grands domaines.", "life"); return `Cave ≈ ${money(Fx.cellar)}`;
    case "sellCellar": { const v = Fx.cellar; L.addMoney(v); Fx.cellar = 0; L.say(`Vend sa cave aux enchères : ${money(v)}.`, "money"); return `+${money(v)}`; }
    case "reserve": { const sp = pick(SPECIES); L.pay(6e7); Fx.reserve = { value: 6e7, sp, saved: 0 }; L.say(`Achète des milliers d’hectares sauvages et en fait une réserve pour les ${sp}.`, "life", true); L.bump("happy", 5); Fx.legacy.push(`une réserve naturelle pour les ${sp}`); return "Réserve naturelle"; }
    case "buyMedia": { const d = MEDIA.find(x => x.id === arg); L.pay(d.price); Fx.media[d.id] = { value: d.price }; L.say(`Rachète ${d.label.toLowerCase()} ; la rédaction s’inquiète pour son indépendance.`, "work", true); L.network += 2; return d.label; }
    case "sellMedia": { const m = Fx.media[arg]; L.addMoney(m.value); delete Fx.media[arg]; L.say("Revend un de ses médias.", "money"); return `+${money(m.value)}`; }
    case "party": {
      mark(L, "party"); L.pay(5e7);
      if (L.politics) { L.politics.pop = clamp(L.politics.pop + 6 + rand() * 6, 0, 100); L.politics.funds = (L.politics.funds || 0) + 5e7; } else L.network += 3;
      if (rand() < 0.12) { L.say("Le financement politique fait scandale : enquête, gros titres, procès en perspective.", "work", true); L.bump("happy", -8); if (L.politics) L.politics.pop = clamp(L.politics.pop - 15, 0, 100); return "Scandale !"; }
      L.say(L.politics ? "Finance largement sa campagne : affiches partout, meetings géants. « Candidat" + L.g("", "e") + " des milliardaires », raillent les adversaires." : "Finance un parti et des groupes de pression ; les portes des ministères s’ouvrent.", "work", true);
      return L.politics ? "Popularité +" : "Relations +";
    }
    case "sponsor": mark(L, "sponsor"); L.pay(2e8); L.network += 3; L.bump("happy", 4); L.say(y >= 1960 ? "Parraine la plus grande compétition sportive du monde : votre nom dans tous les stades, devant des milliards de spectateurs." : "Parraine une exposition universelle : votre pavillon fait sensation.", "work", true); return "Prestige mondial";
    case "corner": { const cost = Math.max(1e9, w * 0.05), what = o.label.replace("Accaparer le marché ", ""); L.pay(cost); Fx.corner = { cost, what, at: L.age }; L.say(`Achète discrètement une énorme part du marché ${what}.`, "money", true); return "Résultat l’an prochain"; }
    case "hostile": {
      mark(L, "hostile"); const R = Fx.rival, cost = R.worth * 0.5;
      if (rand() < 0.5) { L.pay(cost); Fx.stakes.push({ n: `le groupe de ${R.name}`, value: cost * 1.2 }); R.worth *= 0.5; L.say(`Réussit l’OPA hostile sur le groupe de ${R.name} : la presse parle d’une humiliation historique.`, "money", true); L.bump("happy", 10); return "OPA réussie !"; }
      L.pay(cost * 0.05); L.say(`L’OPA hostile sur le groupe de ${R.name} échoue : ${R.sex === "m" ? "il" : "elle"} trouve un « chevalier blanc ». Frais d’avocats et de banques perdus.`, "money", true); L.bump("happy", -5); return "OPA ratée";
    }
    case "crypto": L.pay(5e7); Fx.crypto = { cost: 5e7, at: L.age }; L.say("Lance sa propre cryptomonnaie, à son effigie ; les réseaux s’enflamment.", "money", true); return "Résultat l’an prochain";
    case "haven": { const d = countryAt(arg, y); L.code = d.code; L.emigrated = true; L.urban = true; Fx.haven = d.code; L.bump("rel", -8); L.say(`S’exile fiscalement ${inCountry(d)} ${d.flag} ; au pays, on parle de « trahison ».`, "move", true); if (L.politics) L.politics.pop = clamp(L.politics.pop - 20, 0, 100); return `Résidence ${inCountry(d)}`; }
    case "optim": {
      mark(L, "optim"); const g = w * 0.01;
      if (rand() < 0.2) { L.pay(g * 3); L.say(`Redressement fiscal : le montage est jugé abusif. Amende de ${money(g * 3)}, et une photo peu flatteuse dans la presse.`, "money", true); L.bump("happy", -6); return "Redressement !"; }
      L.addMoney(g); L.say(`Un montage fiscal habile lui fait économiser ${money(g)}.`, "money"); return `+${money(g)}`;
    }
    case "found": { const c = FX_CAUSES.find(x => x.id === arg), e = Math.max(1e7, w * 0.05); L.pay(e); Fx.found = { cause: c.id, endow: e, spent: 0, units: 0, name: `Fondation ${surname(L)}` }; L.say(`Crée la ${Fx.found.name}, consacrée à ${c.label}, dotée de ${money(e)}.`, "family", true); L.bump("happy", 6); Fx.legacy.push(Fx.found.name); return Fx.found.name; }
    case "endow": { const e = Math.max(1e7, w * 0.05); L.pay(e); Fx.found.endow += e; L.say(`Verse ${money(e)} à sa fondation.`, "family"); L.bump("happy", 2); return `Dotation ≈ ${money(Fx.found.endow)}`; }
    case "build": { const b = BUILDINGS.find(x => x.id === arg), n = b.name(surname(L)); L.pay(b.cost); Fx.legacy.push(n); L.say(`Offre ${b.label} : « ${n} ». Une plaque, un ruban, des discours.`, "family", true); L.bump("happy", 5); L.network += 1; return n; }
    case "pledge": Fx.pledge = true; L.say("S’engage publiquement à donner la moitié de sa fortune de son vivant. Ses héritiers font la grimace.", "family", true); L.bump("happy", 6); L.bump("rel", -2); return "Promesse faite";
    case "project": { const d = PROJECTS.find(x => x.id === arg); Fx.projects.push({ id: d.id, left: d.years, since: y }); L.say(`Lance un projet hors norme : ${d.label.toLowerCase()} (${money(d.cost)} sur ${d.years} ans).`, "work", true); L.bump("happy", 3); return "Projet lancé"; }
    case "stopProject": { const P = Fx.projects.find(p => p.id === arg); Fx.projects.splice(Fx.projects.indexOf(P), 1); L.say(`Abandonne : ${PROJECTS.find(x => x.id === arg).label.toLowerCase()}. L’argent dépensé est perdu.`, "work", true); L.bump("happy", -4); return "Abandonné"; }
    case "flight": {
      const [cost, txt] = { sub: [5e5, "Un vol suborbital : quelques minutes d’apesanteur, la Terre courbe sous le hublot."], iss: [5.5e7, "Dix jours dans une station spatiale ; la Terre tourne sous ses yeux, seize levers de soleil par jour."], moon: [5e8, "Fait le tour de la Lune ; la face cachée, puis la Terre qui se lève sur l’horizon lunaire."] }[arg];
      L.pay(cost);
      if (rand() < (arg === "sub" ? 0.003 : 0.01)) { L.pendingDeath = arg === "sub" ? "accident d’un vol spatial touristique" : "accident spatial"; L.say("Au retour, la capsule perd le contact avec le sol…", "life", true); return "Le contact est perdu…"; }
      L.say(txt, "life", true); L.bump("happy", 12); F(L).legacy.push({ sub: "un vol dans l’espace", iss: "un séjour en orbite", moon: "un voyage autour de la Lune" }[arg]); return "Retour sur Terre !";
    }
    case "space": L.pay(1e9); Fx.space = { stage: 0, years: 0, budget: 5e8 }; L.say("Fonde son programme spatial : une usine de fusées, un pas de tir, mille ingénieurs.", "work", true); L.bump("happy", 6); return "Programme spatial";
    case "stopSpace": Fx.space.done = true; L.say("Arrête son programme spatial.", "work"); return "Arrêté";
    case "bet": {
      const b = BETS.find(x => x.id === arg); L.pay(b.cost);
      if (rand() < b.risk * (L.age > 60 ? 2 : 1)) { L.pendingDeath = b.cause; L.say(`${b.label} : les nouvelles ne sont pas bonnes, on est sans contact depuis des jours…`, "life", true); return "Le pari tourne mal…"; }
      Fx.bets.push(b.id); Fx.legacy.push(b.label.replace(/^(Le|La|Une|Un) /, m => m.toLowerCase())); L.say(b.ok, "life", true); L.bump("happy", 12); L.network += 1; return "Exploit accompli !";
    }
    case "guards": Fx.guards = !Fx.guards; L.say(Fx.guards ? "Engage une garde rapprochée : voitures blindées, gardes du corps, maisons sous surveillance." : "Renvoie sa garde rapprochée.", "family"); return Fx.guards ? "Garde rapprochée" : "Plus de garde";
  }
  return null;
}

// --- La feuille « Votre fortune » --------------------------------------------------------------------
function fortuneHtml(L) {
  const Fx = F(L), w = L.netWorth(), r = fortuneRank(L, w), y = L.calYear;
  const acts = fortuneActions(L);
  const pills = tab => `<div class="sp-pills">${acts.filter(a => a.tab === tab).map(a => `<button class="sp-pill" data-fx="${a.id}" data-arg="${esc(String(a.arg))}"${a.ok ? "" : " disabled"}>${esc(a.label)} <span>${esc(a.ok ? a.sub : a.why)}</span></button>`).join("")}</div>`;
  const list = (items, empty = "") => items.length ? items.map(x => `<small>${x}</small>`).join("") : (empty ? `<small>${empty}</small>` : "");
  const own = Object.entries(Fx.own).map(([id, o]) => `${esc(LUXE.find(x => x.id === id).label)}${id === "staff" ? "" : ` ≈ ${money(o.value)}`}`);
  const coll = [...Fx.art.map(a => `${esc(capFirst(a.t))} ≈ ${money(a.value)}${a.outed ? " (un faux)" : ""}`), ...Fx.horses.map(h => `${esc(h.n)}, ${h.age} an${h.age > 1 ? "s" : ""}${h.big ? ` · ${h.big} grande${h.big > 1 ? "s" : ""} course${h.big > 1 ? "s" : ""}` : ""}${h.stud ? " · au haras" : ""} ≈ ${money(h.value)}`),
    ...(Fx.team ? [`Écurie ${esc(Fx.team.name)} · ${Fx.team.titles || 0} titre${(Fx.team.titles || 0) > 1 ? "s" : ""} · budget ${money(Fx.team.budget)}/an`] : []), ...(Fx.cellar ? [`Cave de grands crus ≈ ${money(Fx.cellar)}`] : []), ...(Fx.reserve ? [`Réserve naturelle · ${Fx.reserve.saved} jeunes ${esc(Fx.reserve.sp)}`] : [])];
  const R = Fx.rival;
  return `<div class="sp">
    <p class="sp-head">Fortune</p>
    <div class="sp-card"><div class="sp-main"><b>${money(w)}${r ? ` · ${rankF(r.world)} fortune mondiale` : ""}</b>
      ${r ? `<small>${rankF(r.nat)} fortune du pays · ${r.n.toLocaleString("fr-FR")} milliardaires dans le monde en ${y} · la plus grande fortune : ≈ ${money(r.top)}</small>` : `<small>Pas encore dans les classements de fortunes (à partir de quelques dizaines de millions).</small>`}
      ${Fx.nick ? `<small>Dans la presse : « ${esc(Fx.nick)} »</small>` : ""}
      ${R ? `<small>Rival : ${esc(R.name)} ${BY_CODE[R.code] ? BY_CODE[R.code].flag : ""} ≈ ${money(R.worth)} · ${R.ahead ? "vous êtes devant" : "devant vous"}</small>` : ""}
      ${Fx.found ? `<small>${esc(Fx.found.name)} : ${esc(FX_CAUSES.find(c => c.id === Fx.found.cause).label)} · dotation ≈ ${money(Fx.found.endow)} · ${Math.round(Fx.found.units).toLocaleString("fr-FR")} ${esc(FX_CAUSES.find(c => c.id === Fx.found.cause).unit)}${Fx.pledge ? " · promesse de donner la moitié" : ""}</small>` : ""}
      ${Fx.projects.length ? `<small>Chantiers : ${Fx.projects.map(p => `${esc(PROJECTS.find(d => d.id === p.id).label.toLowerCase())} (${p.left} an${p.left > 1 ? "s" : ""})`).join(" · ")}</small>` : ""}
      ${Fx.space && !Fx.space.done ? `<small>Programme spatial : ${Fx.space.stage ? esc(SPACE_STAGES[Fx.space.stage - 1]) : "premier lancement à venir"} · ${money(Fx.space.budget)} par an</small>` : ""}
      ${Fx.legacy.length ? `<small>Ce qui restera : ${Fx.legacy.slice(-10).map(x => esc(typeof x === "string" ? x : "")).join(" · ")}</small>` : ""}</div></div>
    <p class="sp-note">Classements approximatifs, en dollars d’aujourd’hui. Chaque geste de grande fortune se fait d’ici ; ils ne comptent pas parmi les trois actions de l’année.</p>
    <p class="sp-head">Luxe</p>
    ${own.length ? `<div class="sp-card"><div class="sp-main">${list(own)}</div></div>` : ""}${pills("Luxe")}
    <p class="sp-head">Collections</p>
    ${coll.length ? `<div class="sp-card"><div class="sp-main">${list(coll)}</div></div>` : ""}${pills("Collections")}
    <p class="sp-head">Influence</p>
    ${Object.keys(Fx.media).length || Fx.stakes.length ? `<div class="sp-card"><div class="sp-main">${list([...Object.keys(Fx.media).map(id => `${esc(MEDIA.find(m => m.id === id).label)} ≈ ${money(Fx.media[id].value)}`), ...Fx.stakes.map(s => `${esc(capFirst(s.n))} ≈ ${money(s.value)}`)])}</div></div>` : ""}${pills("Influence")}
    <p class="sp-head">Philanthropie</p>${pills("Philanthropie")}
    <p class="sp-head">Projets</p>${pills("Projets")}
    <p class="sp-note">Le coût d’un grand projet se paie année après année ; sans argent, le chantier s’arrête. Le succès n’est jamais garanti.</p>
    <p class="sp-head">Aventures</p>${pills("Aventures")}
    <p class="sp-note">Les paris fous et les voyages dans l’espace comportent un vrai risque de mort.</p>
  </div>`;
}

// --- Branchements -------------------------------------------------------------------------------------
{
  const upd = Life.prototype.updateMoney, nw = Life.prototype.netWorth;
  Life.prototype.updateMoney = function () { const r = upd.apply(this, arguments); this.fortuneYear(); return r; };
  Life.prototype.netWorth = function () { return nw.call(this) + fortuneAssets(this); };
  const items = estateItems;
  estateItems = function (L) { const I = items(L), v = fortuneAssets(L); if (v > 1) I.fin.world = Math.round((I.fin.world || 0) + v); return I; };
  const rows = moneyRows;
  moneyRows = function (L) {
    const r = rows(L), w = L.netWorth(), k = L.fortune ? fortuneRank(L, w) : null;
    if (k) r.push(["Classement des fortunes", `${rankF(k.world)} au monde · ${rankF(k.nat)} du pays`]);
    const v = fortuneAssets(L); if (v > 1) r.push(["Biens de grande fortune", `luxe, collections, médias, participations · ≈ ${dollars(v)}`]);
    return r;
  };
  const click = spendClick;
  spendClick = function (L, t) {
    const b = t.closest("[data-fx]");
    if (b) return fortuneDo(L, b.dataset.fx, b.dataset.arg) || "Impossible pour l’instant.";
    return click(L, t);
  };
  // La nécrologie d'une grande fortune.
  const die = Life.prototype.die;
  Life.prototype.die = function (cause) {
    const Fx = this.fortune, w = this.netWorth();
    if (Fx && Fx.peak >= BN && this.alive) {
      const r = fortuneRank(this, w), legacy = Fx.legacy.filter(x => typeof x === "string");
      this.say(`Nécrologie : ${Fx.nick ? `« ${Fx.nick} », ` : ""}une fortune de ${money(w)}${r ? ` (${rankF(r.world)} au monde)` : ""}, ${money(Fx.peak)} au sommet.${legacy.length ? ` Il reste ${legacy.slice(-6).join(", ")}.` : ""}${Fx.found ? ` Sa fondation a aidé ${Math.round(Fx.found.units).toLocaleString("fr-FR")} ${FX_CAUSES.find(c => c.id === Fx.found.cause).unit}.` : ""}`, "life", true);
    }
    return die.call(this, cause);
  };
  // La dynastie : le nom, la fondation, les œuvres et le rival passent à la génération suivante.
  const dyn = dynastyData;
  dynastyData = function (L) {
    const d = dyn(L), Fx = L.fortune;
    if (Fx && (Fx.peak >= BN || Fx.legacy.length || (L.dynasty && L.dynasty.legacy.length))) {
      const prev = L.dynasty || { legacy: [], peak: 0, gens: 0 };
      d.fam = { legacy: [...prev.legacy, ...Fx.legacy.filter(x => typeof x === "string")].slice(-20), peak: Math.max(prev.peak, Fx.peak), gens: prev.gens + 1, found: Fx.found ? { cause: Fx.found.cause, endow: Fx.found.endow, units: Fx.found.units, name: Fx.found.name } : null, rival: Fx.rival ? Fx.rival.name : null, founder: prev.founder || L.name };
    } else if (L.dynasty) d.fam = L.dynasty;
    return d;
  };
  const clean = cleanDyn;
  cleanDyn = function (d, str, num) {
    const out = clean(d, str, num);
    if (out && d && d.fam && typeof d.fam === "object") {
      const f = d.fam, c = f.found && FX_CAUSES.find(x => x.id === f.found.cause);
      out.fam = { legacy: (Array.isArray(f.legacy) ? f.legacy : []).slice(-20).map(x => str(x, 120)), peak: Math.max(0, num(f.peak)), gens: clamp(Math.round(num(f.gens, 1)), 1, 99), founder: str(f.founder, 40), rival: f.rival ? str(f.rival, 60) : null,
        found: c ? { cause: c.id, endow: Math.max(0, num(f.found.endow)), units: Math.max(0, num(f.found.units)), name: str(f.found.name, 80) } : null };
    }
    return out;
  };
  const lin = lineageFor;
  lineageFor = function (rec, heirName, will) { const r = lin(rec, heirName, will); if (r && rec.dyn && rec.dyn.fam) r.lineage.fam = rec.dyn.fam; return r; };
  const init = Life.prototype.initLineage;
  Life.prototype.initLineage = function (l) {
    const r = init.call(this, l);
    if (l && l.fam) {
      this.dynasty = l.fam;
      const Fx = F(this);
      if (l.fam.found) Fx.found = { ...l.fam.found, spent: 0 };
      if (l.fam.rival) Fx.rival = { name: l.fam.rival.replace(/ .*/, "") + " junior", sex: "m", code: "US", worth: (l.fam.peak || BN) * 0.5, ahead: null };
      this.dynastyNote = (`Naît dans la dynastie fondée par ${l.fam.founder} (${l.fam.gens} génération${l.fam.gens > 1 ? "s" : ""} de fortune)${l.fam.found ? ` ; la famille préside la ${l.fam.found.name}` : ""}.`);
    }
    return r;
  };
}
// Tableau de bord et menu : « Votre fortune » à partir de 100 millions.
const hasFortune = L => L.alive && (L.netWorth() >= 1e8 || !!(L.fortune && L.fortune.peak >= BN));
{
  const dash = dashboardData;
  dashboardData = function (L) {
    const d = dash(L);
    if (hasFortune(L)) { const r = fortuneRank(L); d.status.push({ icon: "money", label: "Fortune", act: "fortune", cta: true, value: `${money(L.netWorth())}${r ? ` · ${rankF(r.world)} au monde` : ""} ›` }); }
    return d;
  };
}
