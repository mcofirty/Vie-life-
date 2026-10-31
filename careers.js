// Parcours et passions : filières du lycée, voie professionnelle et apprentissage,
// spécialités d'université (licence, master, doctorat, grandes écoles), centres de
// formation sportifs ; vivre d'un sport, d'un art ou de la célébrité (chant, rap,
// cinéma, télé-réalité, vidéos en ligne…). Tout dépend du pays, de l'époque, de la
// ville ou de la campagne, des moyens de la famille, du sexe et du talent.

const inList = (code, s) => s.split(" ").includes(code);
const FRANCOPHONE = "FR BE CH LU MC MA DZ TN SN CI CM ML BF NE GN TG BJ GA CG CD MG HT CA";
const FOUR_YEAR_DEGREE = "US CA CN JP KR TW PH TH ID MY VN MX BR AR CL CO PE VE EC NG GH KE SA IR TR";

// --- Lycée : filières générales selon le pays et l'époque --------------------------
function lyceeTracks(L) {
  const code = L.code, y = L.calYear;
  const T = (sci, eco, lit) => [{ id: "sci", label: sci }, { id: "eco", label: eco }, { id: "lit", label: lit }];
  if (code === "FR") {
    if (y >= 2021) return T("spécialités maths et physique-chimie", "spécialités SES et histoire-géo", "spécialités humanités, littérature et langues");
    if (y >= 1995) return T("bac S (scientifique)", "bac ES (économique et social)", "bac L (littéraire)");
    if (y >= 1968) return T("série C ou D (sciences)", "série B (économie)", "série A (lettres)");
    return T("section mathématiques élémentaires", "section sciences expérimentales", "section philosophie-lettres");
  }
  if (inList(code, "IN PK BD LK NP")) return T("stream Science", "stream Commerce", "stream Arts");
  if (inList(code, "CN TW")) return T("filière scientifique (lǐkē)", "filière scientifique, option économie", "filière littéraire (wénkē)");
  if (inList(code, "JP")) return T("orientation sciences (rikei)", "orientation lettres, option économie", "orientation lettres (bunkei)");
  if (inList(code, "KR")) return T("filière sciences (igwa)", "filière lettres, option économie", "filière lettres (mungwa)");
  if (inList(code, "GB IE")) return T("A-levels de sciences", "A-levels d’économie et de gestion", "A-levels de lettres et langues");
  if (inList(code, "DE AT")) return T("Abitur, dominante sciences", "Abitur, dominante économie", "Abitur, dominante lettres");
  if (inList(code, "IT")) return T("liceo scientifico", "istituto tecnico commerciale", "liceo classico");
  if (inList(code, "US CA")) return T("cours avancés de sciences", "cours avancés d’économie", "cours avancés de lettres et d’histoire");
  if (inList(code, "RU UA BY KZ") || L.here.region === "SSA") return T("série scientifique", "série économique", "série littéraire");
  return T("filière scientifique", "filière économique", "filière littéraire");
}

// --- Voie professionnelle ---------------------------------------------------------
function vocInfo(L) {
  const c = L.here, code = L.code, y = L.calYear;
  const V = (label, short, formal = true) => ({ label, short, formal });
  if (code === "FR") return y >= 1985 ? V("lycée professionnel (CAP, bac pro)", "bac pro") : V("lycée professionnel (CAP)", "CAP");
  if (inList(code, "DE AT")) return V("apprentissage en alternance (Ausbildung)", "apprentissage");
  if (code === "CH") return V("apprentissage en entreprise (CFC)", "CFC");
  if (inList(code, "BE LU")) return V("enseignement professionnel", "diplôme professionnel");
  if (code === "NL") return V("formation professionnelle (MBO)", "MBO");
  if (code === "IT") return V("istituto professionale", "diplôme professionnel");
  if (inList(code, "ES PT")) return V("formation professionnelle (FP)", "FP");
  if (inList(code, "GB IE")) return V(y >= 1984 ? "apprentissage (BTEC)" : "apprentissage", "apprentissage");
  if (inList(code, "US CA")) return V("lycée professionnel (vocational school)", "diplôme professionnel");
  if (code === "JP") return V("lycée technique", "lycée technique");
  if (code === "KR") return V(y >= 2010 ? "lycée professionnel (Meister)" : "lycée professionnel", "lycée professionnel");
  if (code === "CN") return V("lycée professionnel (zhōngzhuān)", "zhōngzhuān");
  if (inList(code, "RU UA BY KZ UZ") && y >= 1940 && y < 1992) return V("école professionnelle (PTU)", "PTU");
  if (inList(code, "RU UA BY KZ UZ")) return V("collège technique", "collège technique");
  if (inList(code, "IN")) return V("ITI (Industrial Training Institute)", "ITI");
  if (code === "BR" && y >= 1942) return V("formation du SENAI", "SENAI");
  if (code === "MX") return V("bachillerato technique (CONALEP)", "CONALEP");
  if (c.gdp >= 15000 || (c.school >= 8 && y >= 1960)) return V("lycée professionnel", "diplôme professionnel");
  return V("apprentissage chez un artisan", "apprentissage", false);
}
// [id, spécialité, métiers, depuis, apprentissage informel possible]
const TRADES = [
  ["elec", "Électricité", ["electrician", "technician"], 1910, false],
  ["meca", "Mécanique automobile", ["mechanic", "technician"], 1920, true],
  ["soud", "Soudure, chaudronnerie", ["welder", "factory"], 1920, true],
  ["bat", "Bâtiment (maçonnerie, menuiserie)", ["builder", "factory"], 1900, true],
  ["cuis", "Cuisine et restauration", ["cook", "waiter"], 1900, true],
  ["coif", "Coiffure et esthétique", ["hairdresser"], 1900, true],
  ["comm", "Commerce et vente", ["seller", "cashier", "sales"], 1900, true],
  ["secr", "Secrétariat, gestion", ["secretary", "clerk"], 1900, false],
  ["soin", "Aide à la personne, santé", ["carer", "nurse"], 1950, false],
  ["agri", "Agriculture et élevage", ["farmer", "herder", "farmhand"], 1900, true],
  ["cout", "Couture et mode", ["tailor", "textile"], 1900, true],
  ["num", "Systèmes numériques, réseaux", ["technician", "developer"], 1985, false],
  ["phone", "Réparation de téléphones", ["phonefix"], 2000, true],
  ["trans", "Conduite et logistique", ["trucker", "vtc", "courier", "mototaxi"], 1930, true],
  ["secu", "Métiers de la sécurité", ["guard", "police"], 1970, false],
].map(([id, label, jobs, from, informal]) => ({ id, label, jobs, from, informal }));
const TRADE_BY_ID = Object.fromEntries(TRADES.map(t => [t.id, t]));
function tradesFor(L, formal) {
  const c = L.here, y = L.calYear;
  return TRADES.filter(t => y >= t.from && (formal ? t.id !== "phone" || c.gdp < 15000 : t.informal) && !(t.id === "agri" && L.urban && c.agri < 5));
}

// --- Université : spécialités ---------------------------------------------------------
// years : durée jusqu'au premier diplôme ; sel : sélectivité ; pref : filière du lycée
// qui y prépare ; master : un master (et un doctorat) peut suivre.
const FIELDS = [
  { id: "med", label: "Médecine", short: "médecine", jobs: ["doctor"], years: 7, sel: 0.3, pref: "sci", minTert: 1 },
  { id: "sante", label: "Soins infirmiers et paramédical", short: "soins infirmiers", jobs: ["nurse", "carer"], years: 3, sel: 0.8, pref: "sci", minTert: 2, from: 1920 },
  { id: "droit", label: "Droit", short: "droit", jobs: ["lawyer", "civil", "clerk"], years: 3, sel: 0.8, pref: "lit", master: true },
  { id: "eco", label: "Économie et gestion", short: "économie et gestion", jobs: ["accountant", "banker", "sales", "clerk", "realtor"], years: 3, sel: 0.8, pref: "eco", master: true },
  { id: "inge", label: "École d’ingénieurs", short: "ingénierie", jobs: ["engineer", "technician", "researcher", "developer"], years: 5, sel: 0.45, pref: "sci", minTert: 3, doc: true },
  { id: "info", label: "Informatique", short: "informatique", jobs: ["developer", "datasci", "engineer", "technician"], years: 3, sel: 0.6, pref: "sci", master: true, from: 1970, minTert: 5 },
  { id: "sci", label: "Sciences (maths, physique, biologie)", short: "sciences", jobs: ["researcher", "teacher", "professor", "datasci", "engineer"], years: 3, sel: 0.9, pref: "sci", master: true },
  { id: "lettres", label: "Lettres, langues et sciences humaines", short: "lettres et sciences humaines", jobs: ["teacher", "journalist", "civil", "professor"], years: 3, sel: 1, pref: "lit", master: true },
  { id: "enseign", label: "Formation des enseignants", short: "enseignement", jobs: ["teacher"], years: 3, sel: 0.85, pref: "", master: true },
  { id: "archi", label: "Architecture", short: "architecture", jobs: ["architect"], years: 5, sel: 0.4, pref: "sci", minTert: 5 },
  { id: "journ", label: "Journalisme et communication", short: "journalisme", jobs: ["journalist", "sales", "creator"], years: 3, sel: 0.6, pref: "lit", master: true, from: 1920, minTert: 5 },
  { id: "arts", label: "Arts (beaux-arts, musique, théâtre, cinéma)", short: "arts", jobs: ["artist", "creator", "artteacher"], years: 3, sel: 0.5, pref: "lit", master: true, minTert: 3 },
  { id: "sport", label: "Sciences du sport (STAPS)", short: "sciences du sport", jobs: ["coach", "teacher"], years: 3, sel: 0.8, pref: "", master: true, from: 1960, minTert: 10 },
  { id: "agro", label: "Agronomie", short: "agronomie", jobs: ["engineer", "farmer", "researcher"], years: 5, sel: 0.7, pref: "sci", doc: true },
  { id: "aero", label: "École de pilotage", short: "pilotage", jobs: ["pilot"], years: 3, sel: 0.2, pref: "sci", from: 1930, minTert: 15 },
];
const FIELD_BY_ID = Object.fromEntries(FIELDS.map(f => [f.id, f]));
// Métiers réservés à une formation précise (pour qui a fait des études avec une spécialité).
const JOB_NEEDS = { doctor: ["med"], lawyer: ["droit"], architect: ["archi"], pilot: ["aero"], engineer: ["inge", "info", "sci", "agro"], datasci: ["info", "sci", "eco"], professor: ["sci", "lettres", "droit", "eco", "inge", "info", "agro", "arts", "sport"] };
function fieldsFor(L) {
  const c = L.here, y = L.calYear;
  return FIELDS.filter(f => y >= (f.from || 0) && c.tert >= (f.minTert || 0) && !(f.id === "info" && y < 1985 && c.gdp < 15000) && !(f.id === "sport" && c.gdp < 8000 && y < 2000));
}
// Grandes écoles et universités d'élite : très sélectives, elles ouvrent les meilleurs postes.
const ELITE = {
  FR: { label: "Classe prépa puis grande école", sci: "inge", eco: "eco", lit: "lettres" },
  US: { label: "Université de l’Ivy League", sci: "sci", eco: "eco", lit: "droit", fees: 2 },
  GB: { label: "Oxford ou Cambridge", sci: "sci", eco: "eco", lit: "droit" },
  CN: { label: "Université de Pékin ou Tsinghua (après le gaokao)", sci: "inge", eco: "eco", lit: "lettres", from: 1952 },
  JP: { label: "Université de Tokyo ou de Kyoto", sci: "inge", eco: "droit", lit: "lettres" },
  KR: { label: "Université « SKY » (Séoul, Korea, Yonsei)", sci: "inge", eco: "eco", lit: "droit", from: 1946 },
  IN: { label: "IIT ou IIM (concours national)", sci: "inge", eco: "eco", from: 1951 },
  CH: { label: "École polytechnique fédérale (ETH, EPFL)", sci: "inge", from: 1900 },
  RU: { label: "Université d’État de Moscou", sci: "sci", eco: "eco", lit: "lettres" },
  SG: { label: "Université nationale de Singapour", sci: "inge", eco: "eco", lit: "droit", from: 1980 },
  CA: { label: "Université McGill ou de Toronto", sci: "sci", eco: "eco", lit: "droit" },
  BR: { label: "Université de São Paulo (vestibular)", sci: "inge", eco: "eco", lit: "droit", from: 1934 },
  MA: { label: "Classe prépa puis grande école d’ingénieurs", sci: "inge", from: 1960 },
  SN: { label: "École polytechnique de Thiès", sci: "inge", from: 1973 },
};
// Frais d'études (en part du revenu médian par an) là où l'université est chère.
const TUITION = { US: [1960, 0.35], GB: [2012, 0.3], CL: [1981, 0.3], JP: [1970, 0.2], KR: [1980, 0.25], CA: [1990, 0.12], AU: [1989, 0.12], CO: [1990, 0.2], PE: [1990, 0.15], PH: [1990, 0.15] };
function universityClosed(L) {
  const y = L.calYear, code = L.code;
  if (code === "CN" && y >= 1966 && y <= 1976) return "Les universités sont fermées pendant la Révolution culturelle.";
  if (code === "KH" && y >= 1975 && y <= 1979) return "Les Khmers rouges ont fermé les écoles et les universités.";
  if (code === "IR" && y >= 1980 && y <= 1983) return "Les universités sont fermées pendant la « révolution culturelle » iranienne.";
  if (code === "AF" && L.sex === "f" && y >= 2022) return "Les talibans interdisent l’université aux femmes.";
  return "";
}
function degreeName(L, level) {
  const fr = inList(L.code, FRANCOPHONE);
  if (level === "court") {
    const y = L.calYear, code = L.code;
    if (code === "FR") return y >= 2021 ? "BTS ou BUT" : y >= 1966 ? "BTS ou DUT" : "brevet de technicien";
    if (inList(code, "US CA")) return "associate degree (community college)";
    if (inList(code, "GB IE")) return "HND";
    if (inList(code, "JP KR")) return "diplôme de junior college";
    if (code === "CN") return "diplôme de dàzhuān";
    if (inList(code, "IN PK BD")) return "diplôme polytechnique";
    return "diplôme d’études courtes";
  }
  if (level === "licence") return fr ? "licence" : "bachelor";
  if (level === "master") return L.code === "FR" && L.calYear < 2004 ? "maîtrise" : "master";
  if (level === "doctorat") return "doctorat";
  if (level === "med") return "diplôme de docteur en médecine";
  if (level === "ecole") return "diplôme d’ingénieur ou d’architecte (bac + 5)";
  return "diplôme";
}
// Le diplôme complet : « licence de droit », « diplôme d’ingénieur », « doctorat de sciences ».
function degreeFull(L, level, f) {
  if (level === "med") return degreeName(L, "med");
  if (level === "ecole") return f.id === "archi" ? "diplôme d’architecte" : f.id === "agro" ? "diplôme d’ingénieur agronome" : "diplôme d’ingénieur";
  if (f.id === "aero" && level === "licence") return "brevet de pilote de ligne";
  return `${degreeName(L, level)} ${level === "court" ? `en ${f.short}` : de(f.short)}`;
}
const poss = s => /^(licence|maîtrise)/.test(s) ? `sa ${s}` : `son ${s}`;
// « de » + le nom d'une passion : du football, de la danse, de l’écriture, des vidéos.
const deLabel = s => s.replace(/^le /, "du ").replace(/^les /, "des ").replace(/^la /, "de la ").replace(/^l’/, "de l’");
const de = s => /^[aeéèêiîoôuyh]/i.test(s) ? `d’${s}` : `de ${s}`;

// Ce qu'on peut dire des études d'une personne.
function eduText(L) {
  const d = L.degree, f = d && FIELD_BY_ID[d.field], t = L.trade && TRADE_BY_ID[L.trade];
  if (L.schooling === "universite" && f) return `${d.elite ? d.elite : "université"} · ${f.short}${d.level === "master" || d.level === "doctorat" ? ` (${degreeName(L, d.level)})` : ""}`;
  if (L.schooling === "secondaire" && L.track) return L.track === "pro" && t ? `${L.vocShort || "voie pro"} · ${t.label.toLowerCase()}` : L.trackLabel ? `lycée · ${L.trackLabel}` : EDU_LABEL.secondaire;
  if (L.schooling) return EDU_LABEL[L.schooling];
  if (L.edu === "universite" && f) return d.elite && d.level !== "court" ? `${d.elite} · ${f.short}` : degreeFull(L, d.level, f);
  if (L.edu === "secondaire" && L.track === "pro" && t) return `${L.vocShort || "diplôme professionnel"} · ${t.label.toLowerCase()}`;
  if (L.edu === "secondaire" && L.trackLabel) return `lycée · ${L.trackLabel}`;
  if (t && L.edu !== "universite") return `${L.edu === "none" ? "apprentissage" : `${EDU_LABEL[L.edu]}, puis apprentissage`} · ${t.label.toLowerCase()}`;
  return EDU_LABEL[L.edu];
}

// --- Passions : sports, arts, célébrité -------------------------------------------------
// kind : sport | art | show. pro : métier quand on en vit. cost : 0 gratuit, 1 cours,
// 2 cher (tennis, ski). end : âge habituel de fin de carrière (sport). global : taille du
// marché pour les stars. team : sport collectif (le sport féminin y a longtemps été amateur).
const PASSIONS = {
  foot: { kind: "sport", label: "le football", pro: ["footballeur professionnel", "footballeuse professionnelle"], cost: 0, end: 34, global: 40, team: true },
  basket: { kind: "sport", label: "le basket", pro: ["basketteur professionnel", "basketteuse professionnelle"], cost: 1, end: 34, global: 35, team: true, from: 1930, cc: "US CA ES FR LT LV RS HR SI GR TR IT AR AU CN PH DE PR SN NG CM" },
  run: { kind: "sport", label: "la course de fond", pro: ["coureur de fond professionnel", "coureuse de fond professionnelle"], cost: 0, end: 36, global: 6, cc: "KE ET UG ER MA RW TZ DJ BH NO GB US FR ES JP" },
  sprint: { kind: "sport", label: "l’athlétisme", pro: ["athlète professionnel", "athlète professionnelle"], cost: 0, end: 32, global: 10, cc: "JM TT BS US GB NG CI FR CA BR CU DE" },
  baseball: { kind: "sport", label: "le baseball", pro: ["joueur de baseball professionnel", "joueuse de baseball professionnelle"], cost: 1, end: 36, global: 30, team: true, zone: "baseball", maleOnly: true },
  cricket: { kind: "sport", label: "le cricket", pro: ["joueur de cricket professionnel", "joueuse de cricket professionnelle"], cost: 0, end: 36, global: 15, team: true, zone: "cricket" },
  rugby: { kind: "sport", label: "le rugby", pro: ["joueur de rugby professionnel", "joueuse de rugby professionnelle"], cost: 0, end: 33, global: 8, team: true, cc: "NZ ZA FJ AU FR GB IE AR WS TO IT GE JP" },
  hockey: { kind: "sport", label: "le hockey sur glace", pro: ["hockeyeur professionnel", "hockeyeuse professionnelle"], cost: 2, end: 35, global: 25, team: true, cc: "CA US RU FI SE CZ SK CH LV BY DE" },
  tennis: { kind: "sport", label: "le tennis", pro: ["joueur de tennis professionnel", "joueuse de tennis professionnelle"], cost: 2, end: 33, global: 30, minGdp: 8000 },
  swim: { kind: "sport", label: "la natation", pro: ["nageur professionnel", "nageuse professionnelle"], cost: 1, end: 29, global: 6, cc: "US AU CN GB FR HU JP NL CA IT DE RU ZA" },
  gym: { kind: "sport", label: "la gymnastique", pro: ["gymnaste de haut niveau", "gymnaste de haut niveau"], cost: 1, end: 24, global: 4, cc: "RO CN RU UA BY US JP FR GB BR" },
  boxe: { kind: "sport", label: "la boxe", pro: ["boxeur professionnel", "boxeuse professionnelle"], cost: 0, end: 35, global: 20, cc: "CU MX PH US KZ UZ GB PR GH TH IE FR UA RU AR PA" },
  velo: { kind: "sport", label: "le cyclisme", pro: ["coureur cycliste professionnel", "coureuse cycliste professionnelle"], cost: 1, end: 35, global: 8, from: 1903, cc: "FR BE NL IT ES CO DK SI GB DE CH LU ER AU" },
  ski: { kind: "sport", label: "le ski", pro: ["skieur professionnel", "skieuse professionnelle"], cost: 2, end: 32, global: 6, cc: "AT CH NO FR IT SE FI US CA DE SI" },
  judo: { kind: "sport", label: "le judo", pro: ["judoka de haut niveau", "judoka de haut niveau"], cost: 1, end: 32, global: 3, from: 1950, cc: "JP FR KR BR GE MN NL RU KZ UZ AZ CN" },
  wrestle: { kind: "sport", label: "la lutte", pro: ["lutteur professionnel", "lutteuse de haut niveau"], cost: 0, end: 34, global: 4, cc: "IR TR RU GE MN IN SN US AZ KZ JP" },
  pingpong: { kind: "sport", label: "le tennis de table", pro: ["pongiste professionnel", "pongiste professionnelle"], cost: 0, end: 34, global: 4, cc: "CN JP KR DE SE TW HK FR" },
  badminton: { kind: "sport", label: "le badminton", pro: ["joueur de badminton professionnel", "joueuse de badminton professionnelle"], cost: 0, end: 32, global: 5, cc: "ID MY CN IN DK KR TH JP TW" },
  esport: { kind: "sport", label: "l’e-sport (jeux vidéo en compétition)", pro: ["joueur d’e-sport professionnel", "joueuse d’e-sport professionnelle"], cost: 1, end: 28, global: 12, from: 2010, minNet: 60 },
  chant: { kind: "art", label: "le chant", pro: ["chanteur", "chanteuse"], cost: 0, global: 25, music: true },
  rap: { kind: "art", label: "le rap", pro: ["rappeur", "rappeuse"], cost: 0, global: 25, music: true, from: 1985 },
  music: { kind: "art", label: "la musique (un instrument)", pro: ["musicien", "musicienne"], cost: 1, global: 10, music: true },
  dj: { kind: "art", label: "le mix (DJ)", pro: ["DJ", "DJ"], cost: 1, global: 15, music: true, from: 1980, minGdp: 5000 },
  dance: { kind: "art", label: "la danse", pro: ["danseur", "danseuse"], cost: 1, global: 5, music: true },
  acting: { kind: "art", label: "la comédie (théâtre, cinéma)", pro: ["acteur", "actrice"], cost: 1, global: 25 },
  humour: { kind: "art", label: "l’humour (stand-up)", pro: ["humoriste", "humoriste"], cost: 0, global: 10, from: 1950 },
  write: { kind: "art", label: "l’écriture", pro: ["écrivain", "écrivaine"], cost: 0, global: 8, minAgePro: 18 },
  paint: { kind: "art", label: "la peinture", pro: ["artiste peintre", "artiste peintre"], cost: 1, global: 6 },
  model: { kind: "art", label: "le mannequinat", pro: ["mannequin", "mannequin"], cost: 0, global: 10, from: 1950, minGdp: 4000, end: 30, look: true },
  video: { kind: "art", label: "les vidéos en ligne", pro: ["créateur de contenu", "créatrice de contenu"], cost: 0, global: 12, from: 2006, minNet: 30 },
  tele: { kind: "show", label: "la télé-réalité", pro: ["star de télé-réalité", "star de télé-réalité"], cost: 0, global: 3, hidden: true },
};
// Le style de musique d'un pays et d'une époque.
function musicStyle(L) {
  const code = L.code, y = L.calYear, home = L.home;
  const pickBy = list => { for (const [from, s] of list) if (y >= from) return s; return null; };
  const S = {
    US: [[2000, "la pop et le R&B"], [1955, "le rock et la soul"], [1920, "le jazz et le blues"], [0, "la musique populaire"]],
    FR: [[1990, "la chanson et la pop française"], [1960, "les yéyés et la chanson"], [0, "la chanson française"]],
    NG: [[2005, "l’afrobeats"], [1970, "l’afrobeat"], [1950, "le highlife"]], GH: [[2005, "l’afrobeats"], [1950, "le highlife"]],
    JM: [[1985, "le dancehall"], [1968, "le reggae"], [1960, "le ska"]], BR: [[1990, "la samba, le funk carioca et le sertanejo"], [1958, "la bossa nova et la samba"], [0, "la samba"]],
    KR: [[1996, "la K-pop"], [0, "la chanson coréenne (trot)"]], JP: [[1980, "la J-pop"], [0, "l’enka"]], IN: [[0, "les chansons de films (playback)"]],
    CO: [[2000, "le reggaeton"], [0, "la cumbia et le vallenato"]], PR: [[2000, "le reggaeton"], [0, "la salsa"]], MX: [[0, "la ranchera et les corridos"]],
    CD: [[0, "la rumba congolaise"]], CG: [[0, "la rumba congolaise"]], CI: [[2002, "le coupé-décalé"], [0, "le zouglou"]], ZA: [[2015, "l’amapiano"], [1990, "le kwaito"], [0, "le mbaqanga"]],
    ML: [[0, "la musique mandingue"]], SN: [[0, "le mbalax"]], DZ: [[0, "le raï"]], MA: [[0, "le chaâbi"]], EG: [[0, "la chanson arabe"]], AR: [[0, "le tango et le rock national"]],
    PT: [[0, "le fado"]], ES: [[0, "la pop et le flamenco"]], TR: [[0, "l’arabesk et la pop turque"]], CU: [[0, "le son et la salsa"]], GB: [[1962, "la pop et le rock"], [0, "le music-hall"]],
  };
  return pickBy(S[code] || S[home] || []) || "la musique du pays";
}
// Les grands lieux de cinéma et de télévision.
function screenIndustry(L) {
  const code = L.code, y = L.calYear;
  if (code === "US") return "Hollywood";
  if (code === "IN") return "Bollywood et les cinémas régionaux";
  if (code === "NG" && y >= 1992) return "Nollywood";
  if (code === "KR" && y >= 2000) return "les séries coréennes";
  if (inList(code, "MX BR CO VE AR") && y >= 1960) return "les telenovelas";
  if (code === "TR" && y >= 2005) return "les séries turques";
  if (code === "EG") return "le cinéma égyptien";
  if (inList(code, "FR IT GB JP CN HK DE ES")) return y >= 1960 ? "le cinéma et la télévision" : "le cinéma";
  return y >= 1960 ? "la télévision et le théâtre du pays" : "le théâtre";
}
// Débuts de la télé-réalité, pays par pays.
const TELE_FROM = { NL: 1999, SE: 1997, US: 2000, GB: 2000, DE: 2000, ES: 2000, IT: 2000, BE: 2000, FR: 2001, AU: 2001, ZA: 2001, AR: 2001, BR: 2002, MX: 2002, CA: 2003, PL: 2001, IN: 2006, NG: 2006, KR: 2009, PH: 2005, TR: 2005, CO: 2003, CL: 2003, PT: 2000, RU: 2004 };
// Académies et centres de formation : là où les jeunes talents sont formés.
function academyFor(L, id) {
  const code = L.code, y = L.calYear, c = L.here;
  if (planned(code, y)) return "une école sportive d’État";
  if (id === "foot") {
    if (inList(code, "FR ES PT NL BE DE IT GB") && y >= 1970) return "le centre de formation d’un club professionnel";
    if (inList(code, "BR AR UY CO") && y >= 1960) return "les équipes de jeunes d’un grand club";
    if (inList(code, "SN CI GH NG CM ML GN") && y >= 1995) return "une académie de football";
    return null;
  }
  if (id === "baseball" && inList(code, "DO VE") && y >= 1985) return "une académie de baseball des ligues majeures";
  if (id === "baseball" && code === "JP") return "le club de baseball d’un lycée réputé (Kōshien)";
  if ((id === "basket" || id === "foot" || id === "run" || id === "sprint" || id === "swim") && code === "US") return "une bourse sportive universitaire";
  if (id === "run" && inList(code, "KE ET") && y >= 1980) return "un camp d’entraînement en altitude";
  if (id === "cricket" && inList(code, "IN PK AU GB") && y >= 1990) return "une académie de cricket";
  if ((id === "hockey" && inList(code, "CA US")) && y >= 1950) return "une ligue junior";
  if (c.gdp >= 20000 && y >= 1975) return "un pôle espoir, en sport-études";
  return null;
}
// Les destinations des transferts (les grands championnats).
const BIG_LEAGUES = { foot: ["FR", "ES", "GB", "IT", "DE", "PT"], basket: ["US", "ES", "TR"], baseball: ["US", "JP"], rugby: ["FR", "GB", "NZ"], hockey: ["US", "CA"], cricket: [] };

function passionMeta(id) { return PASSIONS[id]; }
// Une passion est-elle possible ici et maintenant ? Renvoie true ou la raison.
function passionPossible(L, id) {
  const P = PASSIONS[id], c = L.here, y = L.calYear, code = L.code;
  if (!P || P.hidden) return "Inconnu.";
  if (P.from && y < P.from) return "N’existe pas encore à cette époque.";
  if (id === "rap" && y < (code === "US" ? 1979 : inList(code, "FR GB DE") ? 1984 : 1990)) return "Le rap n’est pas encore arrivé ici.";
  if (P.minGdp && c.gdp < P.minGdp && !L.urban) return "Presque inaccessible ici.";
  if (P.minNet && c.net < P.minNet) return "Pas assez d’internet ici.";
  if (P.maleOnly && L.sex === "f") return "Presque aucune équipe féminine.";
  if (code === "AF" && P.music && ((y >= 1996 && y <= 2001) || y >= 2021)) return "La musique est interdite par les talibans.";
  if (code === "AF" && L.sex === "f" && y >= 2021) return "Interdit aux femmes par les talibans.";
  return true;
}
// Sports pratiqués dans ce pays (le football partout).
function sportsFor(L) {
  const code = L.code;
  return Object.entries(PASSIONS).filter(([id, P]) => P.kind === "sport" && passionPossible(L, id) === true && (id === "foot" || id === "tennis" || id === "esport" || (P.cc && inList(code, P.cc)) || (P.zone && inList(code, ZONES[P.zone])))).map(([id]) => id);
}
function passionsFor(L) {
  const sports = new Set(sportsFor(L));
  return Object.keys(PASSIONS).filter(id => PASSIONS[id].kind === "sport" ? sports.has(id) : passionPossible(L, id) === true);
}
// Coût des cours, du matériel et des compétitions (part du revenu médian par an).
const PASSION_COST = [0.01, 0.06, 0.2];
// La famille (enfant) ou la personne (adulte) peut-elle payer les cours ?
function canAffordLessons(L, P) {
  if (!P.cost) return true;
  const tier = L.livingTier();
  return L.age < 18 ? tier >= P.cost + 1 : L.savings + L.netIncome() * 0.3 >= median(L.here) * PASSION_COST[P.cost];
}
const STAGE_LABEL = ["amateur", "commence à se faire un nom", "professionnel", "star"];

// Tout ce qui, dans la vie et le pays, aide ou freine une carrière.
function careerContext(L, id) {
  const P = PASSIONS[id], c = L.here, y = L.calYear, code = L.code;
  let f = 1;
  if (!L.urban) f *= c.net > 60 && y >= 2010 ? 0.85 : 0.6;
  if (P.kind === "art" && L.livingTier() >= 3) f *= 1.15;
  if (P.kind === "art" && L.livingTier() <= 1) f *= 0.8;
  if (P.kind === "sport" && planned(code, y)) f *= 1.4;
  const boost = {
    foot: "BR AR FR SN CI NG CM GH ES PT NL UY", run: "KE ET", sprint: "JM", baseball: "DO VE CU", cricket: "IN PK AU", rugby: "NZ ZA FJ",
    hockey: "CA", gym: "RO CN", boxe: "CU MX PH", chant: "KR NG US JM", rap: "US FR", acting: "US IN NG KR", video: "US KR", esport: "KR CN", velo: "FR BE CO", ski: "AT NO CH", wrestle: "IR", pingpong: "CN", badminton: "ID MY",
  };
  if (boost[id] && inList(code, boost[id])) f *= 1.4;
  if (activeEvents(code, y).some(x => (x.p.excess || 0) > 0.002)) f *= 0.5;
  return f;
}
// Le plus haut niveau atteignable : le sport féminin et certains sports sont longtemps restés amateurs.
function stageCap(L, id) {
  const P = PASSIONS[id], y = L.calYear, code = L.code, c = L.here;
  if (P.kind === "sport" && L.sex === "f" && P.team && y < (c.gdp > 25000 ? 1995 : 2015)) return [1, "Le sport féminin n’est pas professionnel ici : il faut garder un autre travail à côté."];
  if (id === "rugby" && y < 1995) return [1, "Le rugby est encore un sport amateur."];
  if (id === "tennis" && y < 1968) return [1, "Le tennis est encore réservé aux amateurs."];
  if ((id === "run" || id === "sprint" || id === "swim" || id === "gym" || id === "judo" || id === "wrestle") && y < 1982 && !planned(code, y)) return [1, "Les athlètes olympiques doivent rester amateurs à cette époque."];
  if (code === "IR" && L.sex === "f" && (id === "chant" || id === "rap") && y >= 1979) return [1, "En Iran, les femmes n’ont pas le droit de chanter seules en public."];
  return [3, ""];
}

// --- Méthodes ajoutées à Life ---------------------------------------------------------
Object.assign(Life.prototype, {
  ensureTalent() {
    if (!this.talent) this.talent = { sport: randn(), art: randn(), look: randn() };
    return this.talent;
  },
  talentFor(id) {
    const t = this.ensureTalent(), P = PASSIONS[id];
    return P.look ? t.look : P.kind === "sport" ? t.sport : P.kind === "show" ? (this.stats.rel - 55) / 15 : t.art;
  },

  // Fin du collège (15 ans) : filière générale, voie professionnelle, sport-études ou travail.
  askHighSchool() {
    const c = this.here, poor = this.decile <= 3 && c.gdp < 15000, voc = vocInfo(this), P = this.passion;
    const tracks = lyceeTracks(this), know = this.stats.know;
    const opts = tracks.map(t => ({
      label: `Lycée général · ${t.label}`,
      autoWeight: (poor ? 1 : 4) / 3 * (t.id === "sci" ? 0.6 + know / 80 : t.id === "eco" ? 1 : 0.9),
      apply: () => { this.track = t.id; this.trackLabel = t.label; this.say(`Entre au lycée : ${t.label}.`, "edu"); if (poor) this.bump("rel", -4); },
    }));
    const vocWeight = inList(this.code, "DE AT CH NL") ? 4 : voc.formal ? 1.5 : 1;
    opts.push({
      label: voc.formal ? `Voie professionnelle · ${voc.label}` : `Quitter l’école pour un ${voc.label}`, autoWeight: vocWeight,
      apply: () => {
        this.track = "pro"; this.vocShort = voc.short;
        if (!voc.formal) { this.schooling = null; this.edu = "primaire"; }
        this.askTrade(voc);
      },
    });
    if (P && P.school && PASSIONS[P.id].kind === "sport") opts.unshift({
      label: `Sport-études, avec ${P.school}`, autoWeight: 5,
      apply: () => { this.track = "eco"; this.trackLabel = "sport-études"; this.say(`Entre en sport-études : les cours le matin, l’entraînement l’après-midi.`, "edu", true); },
    });
    opts.push({ label: "Commencer à travailler", autoWeight: poor ? 2 : 0.5, apply: () => { this.schooling = null; this.say("Quitte l’école pour travailler.", "edu", true); this.startWork(); } });
    this.ask(poor ? "La famille a besoin d’argent. Continuer l’école, apprendre un métier ou commencer à travailler ?" : "Fin du collège. Quelle voie choisir ?", opts);
  },
  askTrade(voc) {
    const list = tradesFor(this, voc.formal), c = this.here;
    const opts = list.map(t => ({
      label: t.label, autoWeight: jobsFor({ here: c, edu: "secondaire", calYear: this.calYear, age: 20, urban: this.urban, sex: this.sex, stats: this.stats }).filter(o => t.jobs.includes(o.job.id)).reduce((s, o) => s + o.weight, 0.2),
      apply: () => {
        this.trade = t.id;
        if (voc.formal) this.say(`Entre en ${voc.label}, spécialité ${t.label.toLowerCase()}.`, "edu", true);
        else { this.apprenticeUntil = this.age + 3; this.say(`Entre en apprentissage chez un artisan : ${t.label.toLowerCase()}. On apprend en regardant, en balayant l’atelier, puis en faisant.`, "edu", true); }
      },
    }));
    this.ask(voc.formal ? `${capFirst(voc.label)} : quelle spécialité ?` : "Chez quel artisan entrer en apprentissage ?", opts);
  },
  // Les enfants qui ont quitté l'école peuvent apprendre un métier chez un artisan.
  offerApprenticeship() {
    const voc = { label: "apprentissage chez un artisan", short: "apprentissage", formal: false };
    const list = tradesFor(this, false);
    if (!list.length) return;
    const t = pick(list);
    this.ask(`Un artisan du quartier cherche un apprenti (${t.label.toLowerCase()}). Entrer en apprentissage ?`, [
      { label: "Entrer en apprentissage", autoWeight: 2, apply: () => { this.track = "pro"; this.vocShort = voc.short; this.trade = t.id; this.apprenticeUntil = this.age + 3; this.say(`Entre en apprentissage : ${t.label.toLowerCase()}. On apprend en regardant, en balayant l’atelier, puis en faisant.`, "edu", true); } },
      { label: "Travailler tout de suite", autoWeight: 1, apply: () => this.startWork() },
    ]);
  },
  // Fin de l'apprentissage chez un artisan.
  apprenticeYear() {
    if (this.apprenticeUntil == null || this.age < this.apprenticeUntil) return;
    this.apprenticeUntil = null;
    const t = TRADE_BY_ID[this.trade];
    this.say(`Termine son apprentissage (${t.label.toLowerCase()}).`, "edu", true);
    this.bump("know", 3);
    if (!this.job && !this.business) this.startWork();
  },

  // Fin du lycée (18 ans) : choisir une spécialité, des études courtes ou le travail.
  askHigher(retry = false) {
    const c = this.here, s = this.stats, closed = universityClosed(this);
    const secShare = clamp((c.school - 3.5) / 7, 0.1, 1);
    const p = clamp((c.tert / 100) / secShare, 0.02, 0.95) * (0.6 + s.know / 125) * (0.8 + 0.04 * this.decile);
    const work = { label: "Travailler tout de suite", autoWeight: 1, apply: () => { this.say("Choisit de travailler tout de suite."); this.startWork(); } };
    if (closed) { this.say(closed, "edu", true); this.ask("Le lycée est fini, mais l’université est fermée. Que faire ?", [work]); return; }
    const tried = retry && this.uniTried ? this.uniTried.ids : [];
    const pro = this.track === "pro", track = this.track;
    const chance = f => clamp(p * f.sel * (pro ? 0.45 : 1) * (f.pref && track && f.pref !== track && track !== "pro" ? 0.55 : 1) * (f.id === "med" && track === "sci" ? 1.4 : 1), 0.01, 0.97);
    let fields = fieldsFor(this);
    fields = fields.filter(f => !tried.includes(f.id)).sort((a, b) => (b.pref === track) - (a.pref === track) || chance(b) - chance(a)).slice(0, 8);
    const opts = [];
    const el = ELITE[this.code];
    if (el && !pro && !tried.includes("elite") && this.calYear >= (el.from || 1900) && el[track || "sci"]) {
      const f = FIELD_BY_ID[el[track || "sci"]], pe = clamp(p * 0.1 * (0.4 + s.know / 70) * (this.decile >= 8 ? 1.4 : 1), 0.01, 0.6);
      opts.push({ label: `${el.label} · ${f.short} · chances ${Math.round(pe * 100)} %`, autoWeight: pe * 3, apply: () => this.enterUni(f, pe, el.label) });
    }
    for (const f of fields) {
      const pc = chance(f);
      opts.push({ label: `${f.label} · chances ${Math.round(pc * 100)} %`, autoWeight: pc * 3 / fields.length * (f.pref === track ? 2 : 1) * (f.id === "aero" ? 0.3 : 1), apply: () => this.enterUni(f, pc) });
    }
    if (c.tert >= 8 && !tried.includes("court")) {
      const pc = clamp(p * 1.4 * (pro ? 1.2 : 1), 0.05, 0.97), f = pro && this.trade ? shortFieldFor(this.trade) : FIELD_BY_ID.eco;
      opts.push({ label: `Études courtes (${degreeName(this, "court")}, 2 ans) · chances ${Math.round(pc * 100)} %`, autoWeight: pc * (pro ? 2 : 0.4), apply: () => this.enterUni(f, pc, null, true) });
    }
    opts.push({ label: "Réessayer l’an prochain", sub: "Une année de césure : petits boulots, révisions, et une nouvelle chance.", autoWeight: 0.3, apply: () => { this.gapYear = this.age + 1; this.say("Prend une année de césure pour retenter sa chance.", "edu"); } });
    opts.push(work);
    if (retry) { this.ask("Pas de place cette fois. Que faire ?", opts); return; }
    this.ask(pro ? "La formation professionnelle est finie. Travailler, ou continuer les études ?" : "Le lycée est fini. Quelles études choisir ?", opts);
  },
  enterUni(f, p, elite = null, short = false) {
    if (rand() < p) {
      this.schooling = "universite";
      this.degree = { field: f.id, level: short ? "court" : f.id === "med" ? "med" : f.years >= 5 ? "ecole" : "licence", elite: elite || null };
      const years = short ? 2 : f.id === "med" ? 7 : f.years >= 5 ? 5 : inList(this.code, FOUR_YEAR_DEGREE) ? 4 : 3;
      this.studyEnd = this.age + years;
      this.say(elite ? `Réussit le concours : ${elite} (${f.short}).` : short ? `Commence des études courtes (${degreeName(this, "court")}) en ${f.short}.` : `Est ${this.g("admis", "admise")} en ${f.short}${f.id === "med" ? ` : ${years} ans d’études au moins` : ""}.`, "edu", true);
      this.bump("happy", elite ? 8 : 5);
      if (elite) this.network += 2;
      return;
    }
    // Recalé : c'est vous qui choisissez la suite (autre filière, année de césure, travail).
    if (!this.uniTried || this.uniTried.age !== this.age) this.uniTried = { age: this.age, ids: [] };
    this.uniTried.ids.push(elite ? "elite" : short ? "court" : f.id);
    this.say(elite ? "Échoue au concours." : `N’obtient pas de place en ${short ? "études courtes" : f.short}.`, "edu", true);
    this.bump("happy", -3);
    this.askHigher(true);
  },
  // Chaque année d'université : frais, fin de licence, master, doctorat.
  studiesYear() {
    const d = this.degree;
    if (this.schooling !== "universite" || !d || this.adultStudy) return;
    // Une décision perdue (vie reprise après fermeture de la page) : on termine.
    if (this.studyEnd == null) { if (!this.queue.length) this.studyEnd = this.age; else return; }
    const tu = TUITION[this.code];
    if (tu && this.calYear >= tu[0] && !this.adultStudy) {
      const fee = median(this.here) * tu[1] * (d.elite && ELITE[this.code] && ELITE[this.code].fees || 1) * (this.decile <= 3 ? 0.5 : 1);
      if (this.decile >= 9) { if (!this.feesNoted) { this.feesNoted = true; this.say(`Les parents paient les frais d’université (${money(fee)} par an).`, "money"); } }
      else { this.debt += fee; if (!this.feesNoted) { this.feesNoted = true; this.say(`Emprunte pour payer l’université : ${money(fee)} par an de prêt étudiant.`, "money", true); } }
    }
    if (this.age < this.studyEnd) return;
    const f = FIELD_BY_ID[d.field], c = this.here;
    const finish = text => {
      this.edu = "universite"; this.schooling = null; this.studyEnd = null; this.adultStudy = null;
      this.say(text, "edu", true); this.bump("happy", 6);
      this.startWork();
    };
    if (d.level === "licence" && f.master && (c.tert >= 8 || c.gdp >= 10000)) {
      this.studyEnd = null;
      const lic = degreeFull(this, "licence", f);
      this.ask(`${capFirst(lic)} en poche. Continuer en ${degreeName(this, "master")} ?`, [
        { label: `Continuer en ${degreeName(this, "master")} (2 ans)`, autoWeight: 0.6 + this.stats.know / 100 + this.decile / 20, apply: () => { d.level = "master"; this.studyEnd = this.age + 2; this.say(`Obtient ${poss(lic)} et continue en ${degreeName(this, "master")}.`, "edu", true); } },
        { label: "Entrer dans la vie active", autoWeight: 1, apply: () => finish(`Obtient ${poss(lic)}.`) },
      ]);
      return;
    }
    if ((d.level === "master" && f.master) || (d.level === "ecole" && f.doc)) {
      if (!d.docAsked && this.stats.know >= 45 && c.tert >= 15) {
        d.docAsked = true;
        this.studyEnd = null;
        const got = degreeFull(this, d.level, f);
        this.ask(`${capFirst(got)} : c’est fait. Se lancer dans un doctorat (3 ans de recherche) ?`, [
          { label: "Faire un doctorat", autoWeight: 0.25 + this.stats.know / 300, apply: () => { d.level = "doctorat"; this.studyEnd = this.age + 3; this.say(`Obtient ${poss(got)} et commence un doctorat.`, "edu", true); } },
          { label: "Chercher du travail", autoWeight: 1, apply: () => finish(`Obtient ${poss(got)}.`) },
        ]);
        return;
      }
    }
    const what = d.level === "doctorat" ? `Soutient sa thèse : ${degreeFull(this, "doctorat", f)}.` : d.level === "med" ? "Devient docteur en médecine, après des années de gardes à l’hôpital." : `Obtient ${poss(degreeFull(this, d.level, f))}.`;
    if (d.level === "doctorat") this.bump("know", 6);
    finish(what);
  },
  // Bonus de salaire : diplôme plus élevé, grande école, métier dans sa spécialité.
  degreeZ(j) {
    const d = this.degree;
    let z = 0;
    if (d && this.edu === "universite") {
      z += d.level === "master" || d.level === "ecole" ? 0.25 : d.level === "doctorat" || d.level === "med" ? 0.35 : d.level === "court" ? -0.25 : 0;
      if (d.elite) z += 0.5;
      if (j && FIELD_BY_ID[d.field] && FIELD_BY_ID[d.field].jobs.includes(j.id)) z += 0.2;
    }
    if (j && this.trade && TRADE_BY_ID[this.trade] && TRADE_BY_ID[this.trade].jobs.includes(j.id)) z += 0.25;
    return z;
  },

  // --- Passions ---
  startPassion(id, school = null, quiet = false) {
    const P = PASSIONS[id];
    this.passion = { id, skill: clamp(15 + this.talentFor(id) * 8 + (this.age > 25 ? 5 : 0), 2, 50), fame: 0, stage: 0, since: this.age, school, years: 0 };
    if (!quiet) this.say(this.age < 14 ? `Se passionne pour ${P.label}.` : `Se lance sérieusement dans ${P.label}.`, "life", true);
    return this.passion;
  },
  passionLabel() {
    const P = this.passion;
    if (!P) return "";
    const M = PASSIONS[P.id];
    return `${capFirst(M.label)} · ${P.stage >= 2 || this.isCareer() ? this.g(M.pro[0], M.pro[1]) : STAGE_LABEL[P.stage]}${P.fame >= 10 ? ` · notoriété ${Math.round(P.fame)}/100` : ""}`;
  },
  isCareer() { return !!(this.jobInfo && this.jobInfo.career); },
  // Vivre de sa passion : la passion devient le métier.
  becomeCareer(quiet = false) {
    const P = this.passion;
    if (!P || this.business) return false;
    const M = PASSIONS[P.id];
    this.job = this.g(M.pro[0], M.pro[1]);
    this.jobInfo = { id: `career:${P.id}`, sector: "serv", informal: P.stage < 2, self: true, career: true };
    this.homemaker = false;
    if (this.firstJobAt == null) this.firstJobAt = this.age;
    this.careerPay();
    if (!quiet) this.say(P.stage >= 2 ? `Vit désormais ${deLabel(M.label)} : ${this.job}.` : `Essaie de vivre ${deLabel(M.label)}, ${M.kind === "sport" ? "de petites primes en contrats amateurs" : "de petits cachets en petits contrats"}.`, "work", true);
    return true;
  },
  // Revenu d'une carrière : une poignée de stars, beaucoup de petits revenus.
  careerPay() {
    const P = this.passion, M = PASSIONS[P.id], c = this.here;
    const u = clamp(P.skill / 100, 0, 1), fame = P.fame / 100;
    let pct = P.stage <= 1 ? 0.04 + 0.3 * u * (0.5 + fame) : P.stage === 2 ? 0.4 + 0.45 * clamp(fame * 1.3, 0, 1) : 0.97 + 0.025 * fame;
    let mult = 1;
    if (P.stage === 3) mult = 1 + ((clamp(P.fame, 70, 100) - 70) / 30) ** 2 * M.global * clamp(c.gdp / 40000, 0.15, 1.5);
    if (M.kind === "sport" && this.sex === "f" && M.team) { pct *= 0.75; mult = 1 + (mult - 1) * 0.15; }
    if (planned(this.code, this.calYear)) { pct = Math.min(pct, 0.85); mult = 1; }
    this.incomePct = clamp(pct, 0.01, 0.995);
    this.starMult = mult;
  },
  // Une année de passion : progrès, percées, blessures, notoriété, fin de carrière.
  passionYear() {
    const P = this.passion;
    if (!P || !this.alive) return;
    const M = PASSIONS[P.id], a = this.age, c = this.here, t = this.talentFor(P.id);
    P.years += 1;
    // Progrès : talent, entraînement, cours, structure de formation, priorité de l'année.
    // Le niveau tend vers un plafond fixé surtout par le talent ; le reste aide à s'en approcher.
    let ceil = 45 + 18 * t + (P.school ? 10 : 0) + (canAffordLessons(this, M) ? 5 : 0) + (P.trainAt === a ? 4 : 0) + (this.priority === "plaisir" || this.priority === "travail" ? 3 : 0);
    if (this.schooling === "universite" && this.degree && this.degree.field === "arts" && M.kind === "art") ceil += 6;
    if (M.kind === "sport" && a > 29) ceil -= (a - 29) * 2.5;
    if (a < 12) ceil *= 0.75;
    if (M.kind !== "sport" && a > 65) ceil -= (a - 65);
    P.skill = clamp(P.skill + (clamp(ceil, 5, 100) - P.skill) * 0.2 + randn() * 2, 0, 100);
    if (M.cost && a >= 18 && canAffordLessons(this, M)) this.pay(median(c) * PASSION_COST[M.cost] * (P.stage >= 2 ? 0.3 : 1));
    if (P.years % 3 === 1 && P.stage === 0 && rand() < 0.5) this.say(practiceLine(this, P.id), "life");
    // Blessures (sport).
    if (M.kind === "sport" && a >= 12 && rand() < (P.stage >= 2 ? 0.06 : 0.025) * (P.careAt === a ? 0.5 : 1) * (P.campAt === a ? 1.4 : 1)) {
      P.injuredAt = a;
      P.skill = clamp(P.skill - 10 - rand() * 15, 0, 100); this.bump("health", -4); this.bump("happy", -4);
      this.say(pick(["Une grave blessure au genou l’éloigne des terrains pendant des mois.", "Se blesse à l’entraînement ; la rééducation est longue.", "Une blessure à l’épaule casse sa saison."]).replace("des terrains", M.team ? "des terrains" : "de la compétition"), "health", true);
    }
    // Le centre de formation garde les meilleurs, renvoie les autres.
    if (P.school && M.kind === "sport" && P.stage < 2 && a >= 14 && P.skill < 55 + (a - 14) * 3 && rand() < 0.35) {
      this.say(`${capFirst(P.school)} ne ${this.g("le", "la")} garde pas. Le rêve s’éloigne, sans s’éteindre.`, "life", true);
      P.school = null; this.bump("happy", -8);
    }
    // Une interdiction (musique sous les talibans…) met fin à la passion.
    const banned = passionPossible(this, P.id);
    if (P.id !== "tele" && banned !== true && /interdit/i.test(banned)) {
      this.say(`${banned} ${capFirst(M.label)}, c’est fini${P.stage >= 1 ? " ; la carrière s’arrête du jour au lendemain" : ""}.`, "life", true);
      if (this.isCareer()) this.loseJob("Il faut trouver un autre moyen de vivre.");
      this.passion = null; this.bump("happy", -10);
      return;
    }
    const [cap, capWhy] = stageCap(this, P.id), ctx = careerContext(this, P.id);
    const proMin = M.kind === "sport" ? 16 : M.look ? 15 : M.minAgePro || 16;
    // Percées : de l'amateur à la scène, de la scène au métier, du métier à la gloire.
    if (P.stage === 0 && a >= proMin && P.skill >= 55 && rand() < 0.03 * ctx * (1 + (P.skill - 55) / 30) * (P.school ? 1.5 : 1)) {
      P.stage = 1; P.fame = Math.max(P.fame, 5 + rand() * 10);
      this.say(breakLine(this, P.id, 1), "work", true); this.bump("happy", 6);
      this.offerCareer();
    } else if (P.stage === 1 && cap >= 2 && P.skill >= 68 && rand() < 0.015 * ctx * (1 + (P.skill - 68) / 20) * (P.school ? 2 : 1) + P.fame / 1500) {
      P.stage = 2; P.fame = Math.max(P.fame, 20 + rand() * 15);
      this.say(breakLine(this, P.id, 2), "work", true); this.bump("happy", 8);
      if (!this.isCareer()) this.offerCareer(); else this.careerPay();
    } else if (P.stage === 1 && cap < 2 && !P.capNoted && P.skill >= 68) { P.capNoted = true; this.say(capWhy, "work"); }
    // Notoriété.
    if (P.stage >= 1) {
      // La gloire tient surtout à quelques coups de chance : un tube, un rôle, une saison, une vidéo.
      let df = P.id === "tele" ? randn() * 4 - 12 : P.stage === 1 ? randn() * 3 + (P.skill - 70) / 15 - 1 : randn() * 4 + (P.skill - 75) / 12 - 1.5;
      if (M.kind === "sport" && a > M.end - 3) df -= 4;
      const hit = (P.id === "video" || P.id === "rap" || P.id === "humour") && c.net >= 30 ? 0.025 : 0.012;
      if (P.id !== "tele" && rand() < hit * ctx * (P.stage >= 2 ? 1.3 : 0.7)) { df += 15 + rand() * 25; this.say(pick(c.net >= 30 && this.calYear >= 2008 ? viralLines(this) : hitLines(this, P.id)), "work", true); this.bump("happy", 6); }
      P.fame = clamp(P.fame + df, 0, P.stage === 1 ? 45 : 100);
      if (P.stage === 2 && P.fame >= 80 && cap >= 3) { P.stage = 3; this.say(starLine(this, P.id), "work", true); this.bump("happy", 10); this.network += 2; }
      else if (P.stage === 3 && P.fame < 55) { P.stage = 2; this.say(pick(["Le succès s’éloigne ; on la reconnaît moins dans la rue.", "Les projecteurs se tournent vers d’autres.", "Les années de gloire passent ; il reste le métier."]).replace("la reconnaît", this.g("le reconnaît", "la reconnaît")), "work", true); this.bump("happy", -4); }
      if (P.stage === 3) { if (rand() < 0.08) this.say(pick(starLife(this)), "work"); this.bump("rel", -0.5); }
    }
    // Transfert vers un grand championnat (sport).
    if (M.kind === "sport" && P.stage >= 2 && !P.transferAsked && !P.club && P.skill >= 78 && a <= 30 && BIG_LEAGUES[P.id]) {
      const dests = BIG_LEAGUES[P.id].filter(x => x !== this.code && countryAt(x, this.calYear).gdp > c.gdp * 1.3);
      if (dests.length && rand() < 0.3) {
        P.transferAsked = true;
        const d = countryAt(pick(dests), this.calYear);
        this.ask(`Un club ${inCountry(d)} veut ${this.g("le", "la")} recruter. Partir ?`, [
          { label: `Partir ${inCountry(d)}`, autoWeight: 4, apply: () => this.transferTo(d) },
          { label: "Rester au pays", autoWeight: 1, apply: () => { this.say("Refuse un transfert pour rester au pays.", "work"); this.bump("rel", 3); } },
        ]);
      }
    }
    // Fin de carrière sportive.
    if (M.kind === "sport" && M.end && a >= M.end - 2 + Math.round(P.skill / 50) && (P.stage >= 1 || a >= M.end + 6) && !P.ended && P.endAskedAt !== a) {
      P.endAskedAt = a;
      this.ask(`À ${a} ans, le corps fatigue (${M.label}). Mettre fin à la carrière ?`, [
        { label: "Arrêter", autoWeight: 2, apply: () => { if (this.passion === P) this.endSportCareer(); } },
        { label: "Continuer encore une saison", sub: "Le niveau baisse, les blessures guettent.", autoWeight: 1, apply: () => { P.skill = clamp(P.skill - 4, 0, 100); this.say("Repart pour une saison de plus.", "work"); } },
      ]);
      return;
    }
    if (M.look && a >= M.end && P.stage >= 1 && !P.ended) { P.ended = true; this.say("Les agences cherchent des visages plus jeunes : fin du mannequinat.", "work", true); if (this.isCareer()) this.loseJob("Doit trouver un autre métier."); this.passion = null; return; }
    // La célébrité de télé-réalité s'éteint vite.
    if (P.id === "tele" && P.fame < 12) {
      this.say("Plus personne ne l’invite sur les plateaux ; la célébrité est passée.", "work", true);
      if (this.isCareer()) this.loseJob("Il faut retrouver un métier.");
      this.passion = null;
      if (c.net >= 40 && this.calYear >= 2010) this.ask("Continuer sur les réseaux sociaux, avec ceux qui vous suivent encore ?", [
        { label: "Oui, devenir créateur de contenu".replace("créateur", this.g("créateur", "créatrice")), autoWeight: 1, apply: () => { this.passion = { id: "video", skill: 40, fame: 10, stage: 1, since: a, school: null, years: 0 }; this.say("Continue sur les réseaux sociaux.", "work"); } },
        { label: "Non, tourner la page", autoWeight: 1, apply: () => this.say("Tourne la page de la télévision.", "work") },
      ]);
      return;
    }
    // Vivre de peu, longtemps : faut-il continuer à y croire ?
    if (this.isCareer() && P.stage === 1 && a >= 25 && P.years % 3 === 0 && rand() < 0.6) {
      this.ask(`Les fins de mois sont dures avec ${M.label}. Continuer à y croire ?`, [
        { label: "Continuer à y croire", autoWeight: 1 + t * 0.4, apply: () => { this.say(`S’accroche à son rêve : ${M.label}.`, "work"); this.bump("happy", -2); } },
        { label: "Trouver un emploi stable, et garder ça à côté", autoWeight: 1.4, apply: () => { this.loseJob(`Range ses rêves (${M.label}) dans un coin et cherche un emploi stable.`); P.wantsCareer = false; this.startWork(); } },
      ]);
    }
    // Une carrière interrompue (licenciement, crise) reprend tant qu'on a un nom.
    if (P.stage >= 1 && !this.job && !this.business && !this.schooling && !this.retired && a >= 18 && !this.queue.length && P.wantsCareer) this.becomeCareer(true);
    if (this.isCareer()) this.careerPay();
  },
  offerCareer() {
    const P = this.passion, M = PASSIONS[P.id];
    if (this.isCareer() || this.retired) return;
    if (this.age < 18 && P.stage < 2) return;
    const free = !this.job && !this.business && this.schooling !== "universite";
    const parents = this.livingTier() <= 2 && this.parents.some(p => p.alive) && this.age < 30 ? " Ses parents auraient préféré un métier sûr." : "";
    this.ask(`${capFirst(M.label)} commence à rapporter un peu.${parents} En faire son métier ?`, [
      { label: free ? `Vivre ${deLabel(M.label)}` : `Tout quitter pour ${M.label}`, autoWeight: P.stage >= 2 ? 4 : free ? 1.5 : 0.6, apply: () => {
        P.wantsCareer = true;
        if (this.passion !== P || this.isCareer()) return;
        if (this.schooling === "universite") { this.schooling = null; this.studyEnd = null; this.say("Arrête ses études pour se consacrer à sa carrière.", "edu", true); }
        if (this.job && !this.isCareer()) this.say(`Quitte son emploi (${this.job}).`, "work");
        this.becomeCareer();
      } },
      { label: "Garder ça à côté", autoWeight: 1, apply: () => this.say(`Garde ${M.label} pour les soirs et les week-ends.`) },
    ]);
  },
  transferTo(d) {
    const P = this.passion;
    this.emigrated = true; this.code = d.code; this.urban = true;
    this.bank = this.bank || rand() < d.bank / 100;
    this.say(`Signe dans un club ${inCountry(d)} ${d.flag} : un autre pays, d’autres salaires.`, "move", true);
    this.bump("rel", -8);
    P.fame = clamp(P.fame + 10, 0, 100);
    P.wantsCareer = true;
    this.becomeCareer(true);
  },
  endSportCareer() {
    const P = this.passion, M = PASSIONS[P.id], wasPro = P.stage >= 2;
    P.ended = true;
    this.say(wasPro ? `Met fin à sa carrière de ${this.g(M.pro[0], M.pro[1])}, à ${this.age} ans.` : `Arrête la compétition (${M.label}).`, "work", true);
    this.bump("happy", wasPro ? -6 : -2);
    if (this.isCareer()) { this.job = null; this.jobInfo = null; this.income = 0; this.starMult = 1; }
    const fame = P.fame;
    this.passion = null;
    if (!wasPro || this.retired) return;
    const opts = [
      { label: this.g("Devenir entraîneur", "Devenir entraîneuse"), autoWeight: 2, apply: () => { this.takeJob(JOB_BY_ID.coach); this.incomePct = clamp(this.incomePct + fame / 400, 0.01, 0.99); this.computeIncome(); this.say(`Devient ${this.job}.`, "work", true); } },
    ];
    if (fame >= 50 && this.calYear >= 1960) opts.push({ label: this.g("Consultant à la télévision", "Consultante à la télévision"), autoWeight: 2, apply: () => { this.job = this.g("consultant sportif à la télévision", "consultante sportive à la télévision"); this.jobInfo = { id: "consultant", sector: "serv", informal: false, self: true }; this.incomePct = clamp(0.75 + fame / 500, 0.01, 0.98); this.computeIncome(); this.say(`Devient ${this.job}.`, "work", true); } });
    if (this.edu === "secondaire" && this.here.tert >= 5) opts.push({ label: "Reprendre des études", autoWeight: 0.6, apply: () => { this.schooling = "universite"; this.adultStudy = this.age + 3; this.degree = { field: "sport", level: "licence", elite: null }; this.say("Reprend des études, en sciences du sport.", "edu", true); } });
    if (fame >= 35 && P.club) opts.push({ label: `Directeur sportif à ${P.club.name}`.replace("Directeur", this.g("Directeur", "Directrice")), sub: "Recruter, construire l’équipe : le club que vous connaissez par cœur.", autoWeight: 1, apply: () => { this.job = this.g(`directeur sportif (${P.club.name})`, `directrice sportive (${P.club.name})`); this.jobInfo = { id: "sportdir", sector: "serv", informal: false, self: false }; this.incomePct = clamp(0.8 + fame / 600, 0.01, 0.98); this.computeIncome(); this.say(`Devient ${this.job}.`, "work", true); } });
    if (fame >= 25) opts.push({ label: this.g("Devenir agent de joueurs", "Devenir agente de joueurs"), sub: "Un carnet d’adresses, des commissions sur les transferts.", autoWeight: 0.8, apply: () => { this.job = this.g("agent de sportifs", "agente de sportifs"); this.jobInfo = { id: "sportagent", sector: "serv", informal: false, self: true }; this.incomePct = clamp(0.6 + fame / 300 + rand() * 0.15, 0.01, 0.98); this.computeIncome(); this.say(`Devient ${this.job} : ses anciens coéquipiers lui confient leurs contrats.`, "work", true); } });
    opts.push({ label: "Changer complètement de vie", autoWeight: 1, apply: () => this.startWork() });
    this.ask("La carrière sportive est finie. Et maintenant ?", opts);
  },
  // L'enfance : un talent se remarque, on propose un club, des cours, une académie.
  childhoodPassion() {
    const a = this.age;
    if (a < 6 || a > 14 || this.passion || this.passionOffered) return;
    const t = this.ensureTalent();
    const sport = t.sport >= t.art;
    const z = sport ? t.sport : t.art;
    if (z < 0.8 || rand() > 0.12 + (z - 0.8) * 0.1) return;
    let id;
    if (sport) {
      const list = sportsFor(this);
      if (!list.length) return;
      id = weighted(list.map(x => [x, x === "foot" ? (this.sex === "m" ? 6 : 2) : x === "esport" || x === "tennis" ? 0.5 : 2]));
    } else {
      const list = ["chant", "music", "dance", "acting", "paint", "write", "rap"].filter(x => passionPossible(this, x) === true && (x !== "rap" || a >= 11));
      if (!list.length) return;
      id = pick(list);
    }
    if (!id) return;
    this.passionOffered = true;
    const M = PASSIONS[id], cost = canAffordLessons(this, M);
    const where = M.kind === "sport" ? (cost ? "s’inscrire au club" : "jouer avec ce qu’on a") : cost ? "prendre des cours" : "continuer seul, sans professeur";
    this.say(talentLine(this, id), "life", true);
    this.ask(`${this.name} est très ${this.g("doué", "douée")} pour ${M.label}. ${capFirst(where)} ?`, [
      { label: capFirst(where), autoWeight: 4, apply: () => this.startPassion(id) },
      { label: "Laisser ça de côté", autoWeight: 1, apply: () => this.say(`Laisse ${M.label} de côté.`) },
    ]);
  },
  // Un recruteur repère un jeune sportif : centre de formation, académie, école d'État.
  academyOffer() {
    const P = this.passion;
    if (!P || P.school || P.academyAsked || PASSIONS[P.id].kind !== "sport" || this.age < 12 || this.age > 16 || P.skill < 45) return;
    const ac = academyFor(this, P.id);
    if (!ac || rand() > 0.25 + (P.skill - 45) / 60) return;
    P.academyAsked = true;
    const far = !this.urban || this.decile <= 4 ? " Il faudra partir loin de la famille." : "";
    this.ask(`Un recruteur ${this.g("le", "la")} remarque : ${ac} ${this.g("le", "la")} veut.${far} Accepter ?`, [
      { label: `Intégrer ${ac}`, autoWeight: 4, apply: () => { P.school = ac; this.say(`Entre dans ${ac}. Entraînement tous les jours, école aménagée.`, "life", true); this.bump("happy", 6); if (far) this.bump("rel", -4); } },
      { label: "Rester à la maison et à l’école", autoWeight: 1, apply: () => this.say("Préfère rester près des siens et de l’école.") },
    ]);
  },
  // Les castings de télé-réalité.
  teleAvailable() {
    const c = this.here, y = this.calYear, from = TELE_FROM[this.code] ?? (c.gdp >= 8000 && c.net >= 20 ? 2006 : c.net >= 40 ? 2012 : 9999);
    if (y < from) return y < 1997 ? "La télé-réalité n’existe pas encore." : "Pas encore de télé-réalité dans ce pays.";
    if (planned(this.code, y) || this.code === "KP") return "Pas de télé-réalité ici.";
    return true;
  },
  joinTele() {
    if (this.passion && this.passion.stage >= 1 && this.passion.id !== "tele") this.say(`Laisse ${PASSIONS[this.passion.id].label} pour la télévision.`);
    this.passion = { id: "tele", skill: 30 + this.stats.rel / 3, fame: 30 + rand() * 40, stage: 2, since: this.age, school: null, years: 0, wantsCareer: true };
    if (this.job && !this.isCareer()) this.say(`Quitte son emploi (${this.job}).`, "work");
    this.becomeCareer(true);
    this.say(pick([`Entre dans la maison de la télé-réalité. Des caméras partout, des millions de spectateurs.`, `Participe à une émission de télé-réalité ; dès la première semaine, le pays ne parle que d’${this.g("lui", "elle")}.`]), "work", true);
    this.bump("happy", 4); this.bump("rel", -4);
  },
});
function shortFieldFor(trade) {
  return FIELD_BY_ID[{ elec: "inge", meca: "inge", soud: "inge", bat: "archi", num: "info", soin: "sante", comm: "eco", secr: "eco", agri: "agro", cuis: "eco", coif: "eco", cout: "arts", trans: "eco", secu: "droit", phone: "info" }[trade] || "eco"];
}

// --- Textes ---------------------------------------------------------------------------
function talentLine(L, id) {
  const g = (m, f) => L.g(m, f), M = PASSIONS[id], poor = L.livingTier() <= 1;
  const T = {
    foot: poor ? "Joue au football pieds nus avec un ballon de chiffons ; les grands le veulent dans leur équipe." : "Au football, dribble déjà tous les enfants de son âge.",
    chant: "Chante si juste que les voisins se taisent pour écouter.",
    rap: "Écrit des textes dans un cahier et les rappe dans la cour.",
    music: "Joue à l’oreille toutes les mélodies qu’{il|elle} entend.",
    dance: "Danse à chaque fête ; les adultes font cercle autour.",
    acting: "Imite tout le monde, fait rire toute la famille, monte des spectacles.",
    paint: "Dessine partout, sur les cahiers, les murs, le sable.",
    write: "Remplit des cahiers entiers d’histoires inventées.",
    run: "Court chaque jour des kilomètres pour aller à l’école, et arrive toujours {le|la} premi{er|ère}.",
  };
  const txt = T[id] || `Se montre très ${g("doué", "douée")} pour ${M.label}.`;
  return txt.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, m, f) => g(m, f)).replace("le veulent", g("le veulent", "la veulent"));
}
function practiceLine(L, id) {
  const M = PASSIONS[id], g = (m, f) => L.g(m, f);
  const style = M.music ? musicStyle(L) : "";
  const T = {
    foot: ["Passe tous ses après-midi à taper dans un ballon.", "Joue au football jusqu’à la nuit tombée."],
    chant: [`Chante ${style} à chaque occasion : mariages, fêtes, église ou mosquée du quartier.`, "Répète des heures, une brosse à cheveux en guise de micro."],
    rap: ["Écrit des textes la nuit et les enregistre sur son téléphone.", "Participe à des battles de rap dans le quartier."],
    music: [`Répète ${style} des heures chaque jour.`, "Joue dans un petit groupe avec des amis."],
    dance: ["Répète ses chorégraphies devant le miroir.", "Danse dans un groupe du quartier."],
    acting: ["Joue dans une troupe de théâtre amateur.", "Enchaîne les castings sans réponse."],
    video: ["Publie des vidéos chaque semaine ; quelques centaines de vues.", "Passe ses soirées à monter des vidéos."],
    esport: ["S’entraîne des heures chaque soir en ligne.", "Grimpe dans le classement en ligne."],
    write: ["Écrit chaque soir, et envoie des manuscrits qui reviennent refusés.", "Remplit des carnets entiers."],
  };
  return pick(T[id] || [`S’entraîne sans relâche : ${M.label}.`, `Consacre tout son temps libre à ${M.label}.`]).replace("{il|elle}", g("il", "elle"));
}
function breakLine(L, id, stage) {
  const M = PASSIONS[id], g = (m, f) => L.g(m, f), ind = screenIndustry(L), style = M.music ? musicStyle(L) : "";
  if (stage === 1) {
    if (M.kind === "sport") return pick([`Est ${g("repéré", "repérée")} par un club : premiers matchs en équipe première.`, "Remporte un championnat régional ; on commence à parler de son talent.", "Signe un premier contrat, modeste."]);
    const T = {
      chant: `Gagne un concours de chant ; les premiers cachets arrivent (${style}).`, rap: "Sort un premier morceau ; il tourne dans tout le quartier, puis dans la ville.",
      music: "Commence à jouer dans les bars et les mariages, payé au cachet.", dj: "Mixe dans ses premières soirées, payé au cachet.", dance: "Décroche ses premiers contrats de danse (clips, spectacles).",
      acting: `Décroche un petit rôle (${ind}).`, humour: "Monte sur scène dans un café-théâtre ; la salle rit.", write: "Un premier texte est publié.", paint: "Expose pour la première fois ; deux toiles sont vendues.",
      model: "Une agence de mannequins la remarque dans la rue.", video: "Ses vidéos dépassent les cent mille vues.",
    };
    return (T[id] || "Commence à se faire un nom.").replace("la remarque", g("le remarque", "la remarque"));
  }
  if (M.kind === "sport") return pick(["Signe son premier contrat professionnel.", "Passe professionnel : le sport devient un métier."]);
  const T = {
    chant: `Signe avec une maison de disques (${style}).`, rap: "Signe un contrat avec un label ; le premier album sort.", music: "Entre dans un orchestre réputé, ou part en tournée.", dj: "Devient résident d’un grand club.",
    dance: "Est engagé{|e} dans une grande compagnie.", acting: `Obtient un premier grand rôle (${ind}).`, humour: "Son spectacle remplit les salles ; la télévision l’invite.",
    write: "Publie un roman chez un vrai éditeur ; il se vend bien.", paint: "Une galerie le représente ; ses œuvres se vendent.", model: "Défile pour de grandes marques.", video: "Ses vidéos rapportent assez pour en vivre.",
  };
  return (T[id] || "En fait son métier.").replace("{|e}", g("", "e")).replace("le représente", g("le représente", "la représente"));
}
function starLine(L, id) {
  const M = PASSIONS[id], g = (m, f) => L.g(m, f), ind = screenIndustry(L);
  if (M.kind === "sport") return pick([`Devient une star de son sport ; sélection en équipe nationale.`, "Est élu{|e} meilleur{|e} {joueur|joueuse} de la saison ; son nom est sur tous les maillots."]).replace(/\{\|e\}/g, g("", "e")).replace("{joueur|joueuse}", g("joueur", "joueuse"));
  const T = {
    chant: "Son album est numéro un ; ses chansons passent partout.", rap: "Son album est disque de platine ; ses textes sont sur toutes les lèvres.",
    acting: `Devient une star (${ind}) ; son visage est sur les affiches.`, tele: "Devient une star de la télé-réalité : magazines, plateaux, publicités.", video: "Des millions d’abonnés ; les marques se l’arrachent.",
    write: "Son livre devient un best-seller, traduit dans plusieurs langues.", humour: "Son spectacle remplit les plus grandes salles du pays.",
  };
  return T[id] || `Devient célèbre : ${M.label}.`;
}
function viralLines(L) {
  return ["Une de ses vidéos fait le tour du pays en une nuit.", "Un passage à la télévision change tout : on la reconnaît dans la rue.".replace("la reconnaît", L.g("le reconnaît", "la reconnaît")), "Un morceau, une scène, une phrase deviennent un phénomène sur les réseaux."];
}
function hitLines(L, id) {
  const M = PASSIONS[id];
  if (M.kind === "sport") return ["Marque le but de la saison ; le pays entier en parle.", "Remporte une grande compétition ; son nom fait la une des journaux."];
  return ["Un succès inattendu : tout le monde en parle.", `Passe à la radio, puis à la télévision ; on commence à ${L.g("le", "la")} reconnaître.`];
}
function starLife(L) {
  return ["Les photographes l’attendent devant chez soi.", "Signe un gros contrat publicitaire.", "Ne peut plus faire ses courses sans qu’on lui demande une photo.", "Les rumeurs de la presse people blessent la famille.", "Donne un concert de charité dans sa ville natale."];
}

// --- Actions ---------------------------------------------------------------------------
ACTIONS.push(
  { id: "passion", cat: "perso", label: "Se lancer dans une passion", desc: "Sport, musique, rap, chant, théâtre, danse, écriture, vidéos… selon le pays, l’époque et vos moyens.",
    when: L => L.age < 6 ? "Trop jeune." : L.passion ? `Déjà une passion : ${PASSIONS[L.passion.id].label}.` : L.age > 70 ? "Après 70 ans, seulement pour le plaisir." : true,
    choices: L => passionsFor(L).map(id => {
      const M = PASSIONS[id], t = L.talentFor(id), ok = canAffordLessons(L, M);
      const apt = L.age < 8 ? "" : t > 1 ? " · dispositions excellentes" : t > 0.3 ? " · bonnes dispositions" : t > -0.5 ? " · dispositions moyennes" : " · peu de dispositions";
      const ac = M.kind === "sport" ? academyFor(L, id) : null;
      return { id, label: capFirst(M.label), sub: `${M.cost ? (ok ? `cours et matériel ≈ ${money(median(L.here) * PASSION_COST[M.cost])} par an` : "cours trop chers : il faudra apprendre seul") : "presque gratuit"}${apt}${ac ? ` · ${ac} possible` : ""}` };
    }),
    run: (L, id) => { if (passionPossible(L, id) !== true) return null; L.startPassion(id); return `Passion : ${PASSIONS[id].label}.`; } },
  { id: "practice", cat: "perso", label: "S’entraîner, travailler son art", desc: "Progresser vite dans sa passion, au prix d’un peu de temps avec les proches.",
    when: L => !L.passion ? "Pas encore de passion." : L.passion.trainAt === L.age ? "Déjà cette année." : true,
    run: L => { const P = L.passion; P.trainAt = L.age; P.skill = clamp(P.skill + 3 + L.talentFor(P.id) * 1.5, 0, 100); L.bump("rel", -1); if (PASSIONS[P.id].kind === "sport") L.bump("health", 2); else L.bump("happy", 1); L.say(practiceLine(L, P.id), "life"); return `Niveau ${Math.round(P.skill)}/100.`; } },
  { id: "breakout", cat: "pro", label: "Tenter de percer", desc: L => L.passion ? (PASSIONS[L.passion.id].kind === "sport" ? "Passer un essai dans un club, une compétition, un recruteur." : "Audition, casting, concours, premier morceau, manuscrit envoyé…") : "Faire de sa passion un métier.",
    when: L => !L.passion ? "Il faut une passion." : L.passion.stage >= 2 ? "C’est déjà votre métier." : L.age < 14 ? "Trop jeune." : L.passion.triedAt === L.age ? "Déjà tenté cette année." : true,
    run: L => {
      const P = L.passion, M = PASSIONS[P.id], [cap, why] = stageCap(L, P.id);
      P.triedAt = L.age;
      const target = P.stage === 0 ? 1 : 2;
      if (target > cap) { L.say(why, "work"); return "Impossible ici, pour l’instant."; }
      const p = clamp((target === 1 ? (P.skill - 45) / 45 + 0.08 : (P.skill - 62) / 60 + 0.04) * careerContext(L, P.id) + L.network * 0.02, 0.02, 0.45);
      if (rand() < p) { P.stage = target; P.fame = Math.max(P.fame, target === 1 ? 8 : 22); L.say(breakLine(L, P.id, target), "work", true); L.bump("happy", 6); L.offerCareer(); return "Ça marche !"; }
      L.say(pick([`Tente sa chance (${M.label}) ; on lui répond « pas cette fois ».`, "Une audition de plus, une porte de plus qui se ferme.", "Passe un essai, sans être retenu{|e}."]).replace("{|e}", L.g("", "e")), "work");
      L.bump("happy", -2); return `Refus (chances ${Math.round(p * 100)} %).`;
    } },
  { id: "liveart", cat: "pro", label: "Vivre de sa passion", desc: "En faire son métier : des revenus incertains, parfois énormes.",
    when: L => !L.passion ? "Il faut une passion." : L.passion.stage < 1 ? "Il faut d’abord se faire un nom (« Tenter de percer »)." : L.isCareer() ? "C’est déjà votre métier." : L.age < 16 ? "Trop jeune." : L.retired ? "À la retraite." : L.business ? "Vous dirigez une entreprise." : true,
    run: L => { L.passion.wantsCareer = true; if (L.schooling === "universite") { L.schooling = null; L.studyEnd = null; L.say("Arrête ses études pour se consacrer à sa carrière.", "edu", true); } if (L.job) L.say(`Quitte son emploi (${L.job}).`, "work"); L.becomeCareer(); return `${capFirst(L.job)}.`; } },
  { id: "tele", cat: "pro", label: "Passer un casting de télé-réalité", desc: "La célébrité vite, et souvent pour peu de temps.",
    when: L => L.age < 18 || L.age > 40 ? "Entre 18 et 40 ans." : L.classroom ? "Pas en mode classe." : L.passion && L.passion.id === "tele" ? "Vous êtes déjà à la télévision." : L.teleAt === L.age ? "Déjà tenté cette année." : L.teleAvailable(),
    run: L => {
      L.teleAt = L.age;
      const p = clamp(0.08 + L.stats.rel / 600 + (L.urban ? 0.04 : 0) + (L.age < 30 ? 0.05 : 0) + L.ensureTalent().look * 0.04, 0.03, 0.35);
      if (rand() < p) {
        L.ask("La production vous retient pour une émission de télé-réalité. Y aller ?", [
          { label: "Y aller", autoWeight: 3, apply: () => L.joinTele() },
          { label: "Finalement, non", autoWeight: 1, apply: () => L.say("Renonce à la télé-réalité au dernier moment.") },
        ]);
        return "Retenu·e au casting !".replace("Retenu·e", L.g("Retenu", "Retenue"));
      }
      L.say("Passe un casting de télé-réalité ; pas de rappel.", "work"); return `Pas retenu·e (chances ${Math.round(p * 100)} %).`.replace("retenu·e", L.g("retenu", "retenue"));
    } },
  { id: "dropart", cat: "perso", label: "Abandonner sa passion", desc: L => L.passion ? `Arrêter ${PASSIONS[L.passion.id].label}.` : "Arrêter sa passion.",
    when: L => !L.passion ? "Pas de passion." : true,
    run: L => { const M = PASSIONS[L.passion.id]; if (L.isCareer()) L.loseJob(`Met fin à sa carrière (${M.label}).`); else L.say(`Arrête ${M.label}.`); L.passion = null; L.starMult = 1; return "Passion arrêtée."; } },
);

// Reprendre des études : choisir sa spécialité.
{
  const study = ACTIONS.find(a => a.id === "study");
  study.desc = "Choisir une spécialité ; trois ans d’université, avec moins de revenus pendant ce temps.";
  study.choices = L => fieldsFor(L).filter(f => f.years <= 5 && f.id !== "aero").map(f => ({ id: f.id, label: f.label, sub: `${f.id === "med" ? "7 ans" : `${Math.min(f.years, 3)} ans`} · ${f.jobs.slice(0, 3).map(j => jobLabel(JOB_BY_ID[j], L.sex)).join(", ")}` }));
  const run = study.run;
  study.run = (L, id) => {
    const f = FIELD_BY_ID[id] || FIELD_BY_ID.eco;
    const out = run(L);
    if (L.schooling === "universite") { L.degree = { field: f.id, level: f.id === "med" ? "med" : "licence", elite: null }; if (f.id === "med") L.adultStudy = L.age + 7; L.say(`Spécialité : ${f.short}.`, "edu"); }
    return out;
  };
}
// Le métier de reconversion des sportifs, et le professeur de musique ou de dessin.
JOBS_LIST.push(
  { id: "coach", m: "entraîneur sportif", f: "entraîneuse sportive", sector: "serv", edu: 1, from: 1900, to: 2100, lo: 0.3, hi: 0.75, w: 0.25 },
  { id: "artteacher", m: "professeur de musique ou de dessin", f: "professeure de musique ou de dessin", sector: "serv", edu: 2, from: 1900, to: 2100, lo: 0.3, hi: 0.65, w: 0.2 },
);
JOB_BY_ID.coach = JOBS_LIST[JOBS_LIST.length - 2];
JOB_BY_ID.artteacher = JOBS_LIST[JOBS_LIST.length - 1];

// --- Entreprises dans sa spécialité (études ou métier appris) -------------------------
Object.assign(BUSINESSES, {
  clinic: { label: "Cabinet médical, puis clinique privée", cost: 2.5, mult: 2.4, sd: 0.4, risk: 0.6, field: ["med"] },
  nursing: { label: "Cabinet infirmier, maison de retraite", cost: 1.2, mult: 1.4, sd: 0.4, risk: 0.7, field: ["sante"] },
  lawfirm: { label: "Cabinet d’avocats", cost: 1.0, mult: 2.0, sd: 0.5, risk: 0.7, field: ["droit"] },
  consulting: { label: "Cabinet de conseil", cost: 0.8, mult: 1.8, sd: 0.6, risk: 0.9, field: ["eco"] },
  engineering: { label: "Bureau d’études et d’ingénierie", cost: 1.5, mult: 1.9, sd: 0.5, risk: 0.8, field: ["inge", "sci"] },
  software: { label: "Éditeur de logiciels", cost: 1.0, mult: 1.2, sd: 1.1, risk: 1.4, field: ["info"], from: 1975 },
  biotech: { label: "Laboratoire, biotechnologies", cost: 3.0, mult: 1.0, sd: 1.2, risk: 1.6, field: ["sci", "med"], from: 1980 },
  archi: { label: "Agence d’architecture", cost: 0.8, mult: 1.6, sd: 0.5, risk: 0.9, field: ["archi"] },
  media: { label: "Agence de communication, média", cost: 0.8, mult: 1.3, sd: 0.8, risk: 1.2, field: ["journ"] },
  studio: { label: "Studio de création (design, musique, cinéma)", cost: 0.7, mult: 1.0, sd: 0.9, risk: 1.3, field: ["arts"] },
  school: { label: "École privée, soutien scolaire", cost: 1.0, mult: 1.3, sd: 0.4, risk: 0.8, field: ["enseign", "lettres"] },
  publishing: { label: "Maison d’édition, école de langues", cost: 0.7, mult: 1.1, sd: 0.6, risk: 1.0, field: ["lettres"] },
  gym: { label: "Salle de sport", cost: 1.0, mult: 1.2, sd: 0.5, risk: 1.0, field: ["sport"] },
  agrobiz: { label: "Entreprise agroalimentaire", cost: 2.0, mult: 1.5, sd: 0.6, risk: 1.0, field: ["agro"] },
  airline: { label: "Compagnie aérienne régionale", cost: 8.0, mult: 3.0, sd: 0.9, risk: 1.6, field: ["aero"], from: 1950 },
  electric: { label: "Entreprise d’électricité", cost: 0.5, mult: 1.3, sd: 0.4, risk: 0.8, trade: ["elec"] },
  garage: { label: "Garage automobile", cost: 0.7, mult: 1.3, sd: 0.4, risk: 0.9, trade: ["meca", "soud"] },
  salon: { label: "Salon de coiffure et d’esthétique", cost: 0.5, mult: 1.1, sd: 0.4, risk: 0.9, trade: ["coif"] },
  bistro: { label: "Restaurant, traiteur", cost: 1.0, mult: 1.3, sd: 0.6, risk: 1.2, trade: ["cuis"] },
  couture: { label: "Atelier de couture, marque de vêtements", cost: 0.4, mult: 1.0, sd: 0.6, risk: 1.0, trade: ["cout"] },
  itshop: { label: "Société de services informatiques", cost: 0.6, mult: 1.3, sd: 0.6, risk: 1.0, trade: ["num", "phone"], from: 1985 },
  carehome: { label: "Service d’aide à domicile", cost: 0.5, mult: 1.1, sd: 0.4, risk: 0.8, trade: ["soin"] },
  logistics: { label: "Entreprise de transport et de livraison", cost: 1.0, mult: 1.2, sd: 0.5, risk: 1.1, trade: ["trans"] },
  security: { label: "Société de sécurité", cost: 0.6, mult: 1.2, sd: 0.4, risk: 0.9, trade: ["secu"] },
  shop2: { label: "Commerce de détail", cost: 0.6, mult: 1.1, sd: 0.5, risk: 1.0, trade: ["comm", "secr"] },
  builder2: { label: "Entreprise de bâtiment", cost: 1.0, mult: 1.4, sd: 0.6, risk: 1.1, trade: ["bat"] },
  farm2: { label: "Exploitation agricole et élevage", cost: 0.8, mult: 1.0, sd: 0.5, risk: 1.0, trade: ["agri"] },
});
// Une entreprise de sa spécialité : selon le diplôme ou le métier appris.
function specialtyBusiness(L, b) {
  return (b.field && L.degree && L.edu === "universite" && b.field.includes(L.degree.field)) || (b.trade && L.trade && b.trade.includes(L.trade));
}
ACTIONS.push({ id: "growbiz", cat: "pro", label: "Développer une entreprise", desc: "Faire grandir une de vos entreprises, jusqu’à la multinationale.",
  when: L => !L.business ? "Pas d’entreprise." : !(L.businesses || []).some(b => (b.size || 0) < 3) ? "Ce sont déjà des multinationales." : true,
  choices: L => (L.businesses || []).map((b, i) => { L.bizFocus = i; const o = L.growthOption(); L.bizFocus = 0; return o && { id: String(i), label: b.label, sub: `Devenir une ${o.next.label} : investir ≈ ${money(o.cost)}, chances ${Math.round(o.p * 100)} %${b.grewAt === L.age ? " · déjà tenté cette année" : !o.can ? " · pas assez d’argent" : ""}`, disabled: b.grewAt === L.age || !o.can }; }).filter(Boolean),
  run: (L, i) => { const b = L.businesses[+i]; if (!b || !L.focusBiz(b)) return null; b.grewAt = L.age; const r = L.growBusiness(); L.bizFocus = 0; return r; } });
