// Économie d'une vie : métiers, revenus du ménage, impôts, logement, épargne et
// placements, retraite, entreprise, héritage ; actions personnelles et
// professionnelles ; descendance. Montants en dollars PPA, à prix constants.

const money = x => compactMoney(x, "$");
const EDU_RANK = { none: 0, primaire: 1, secondaire: 2, universite: 3 };
const median = c => incomeAt(c, 0.5);
// Position dans la distribution des revenus d'un pays (inverse d'incomeAt).
function incomePctOf(c, x) {
  const sigma = Math.SQRT2 * normInv((c.gini / 100 + 1) / 2);
  return clamp(normCdf(Math.log(Math.max(x, 1) / median(c)) / sigma), 0.005, 0.995);
}
// Bruit déterministe par année : les marchés sont les mêmes pour toutes les vies.
function yearNoise(year, salt) {
  let h = (year * 2654435761 + salt * 40503) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  const u1 = ((h ^ (h >>> 16)) >>> 0) / 4294967296 || 1e-9;
  h = Math.imul(h ^ 0x9e3779b9, 2246822507) >>> 0;
  const u2 = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// --- Métiers -------------------------------------------------------------------
// [id, masculin, féminin, secteur, diplôme minimal (0-3, ou [avant, année, après]),
//  de, à, position basse et haute dans la distribution des revenus, options]
const JOB_ROWS = [
  ["farmer", "agriculteur", "agricultrice", "agri", 0, 1900, 2100, 0.05, 0.55, { self: true, informal: true }],
  ["farmhand", "ouvrier agricole", "ouvrière agricole", "agri", 0, 1900, 2100, 0.02, 0.25, { informal: true }],
  ["herder", "éleveur", "éleveuse", "agri", 0, 1900, 2100, 0.05, 0.5, { self: true, informal: true, w: 0.7 }],
  ["fisher", "pêcheur", "pêcheuse", "agri", 0, 1900, 2100, 0.05, 0.4, { self: true, informal: true, risk: 1, w: 0.4 }],
  ["market", "vendeur au marché", "vendeuse au marché", "informal", 0, 1900, 2100, 0.03, 0.4, { self: true, informal: true }],
  ["domestic", "employé de maison", "employée de maison", "informal", 0, 1900, 2100, 0.02, 0.2, { informal: true }],
  ["porter", "porteur", "porteuse", "informal", 0, 1900, 2100, 0.02, 0.15, { informal: true, risk: 1 }],
  ["tailor", "couturier", "couturière", "informal", 1, 1900, 2100, 0.1, 0.5, { self: true, informal: true }],
  ["mototaxi", "conducteur de taxi-moto", "conductrice de taxi-moto", "informal", 1, 1990, 2100, 0.1, 0.45, { self: true, informal: true, risk: 1, w: 0.8 }],
  ["phonefix", "réparateur de téléphones", "réparatrice de téléphones", "informal", 1, 2000, 2100, 0.15, 0.5, { self: true, informal: true, w: 0.6 }],
  ["miner", "mineur", "mineuse", "ind", 0, 1900, 2100, 0.2, 0.6, { risk: 2, w: 0.35 }],
  ["builder", "ouvrier du bâtiment", "ouvrière du bâtiment", "ind", 0, 1900, 2100, 0.1, 0.5, { risk: 1 }],
  ["textile", "ouvrier du textile", "ouvrière du textile", "ind", 0, 1900, 2100, 0.08, 0.35, {}],
  ["factory", "ouvrier d’usine", "ouvrière d’usine", "ind", 1, 1900, 2100, 0.15, 0.55, {}],
  ["welder", "soudeur", "soudeuse", "ind", 2, 1920, 2100, 0.3, 0.65, { risk: 1, w: 0.6 }],
  ["electrician", "électricien", "électricienne", "ind", 2, 1910, 2100, 0.35, 0.72, {}],
  ["mechanic", "mécanicien", "mécanicienne", "ind", 2, 1910, 2100, 0.28, 0.66, {}],
  ["technician", "technicien de maintenance", "technicienne de maintenance", "ind", 2, 1950, 2100, 0.4, 0.78, {}],
  ["seller", "vendeur", "vendeuse", "serv", 1, 1900, 2100, 0.15, 0.5, {}],
  ["waiter", "serveur", "serveuse", "serv", 1, 1900, 2100, 0.1, 0.4, {}],
  ["cook", "cuisinier", "cuisinière", "serv", 1, 1900, 2100, 0.15, 0.55, {}],
  ["guard", "agent de sécurité", "agente de sécurité", "serv", 1, 1900, 2100, 0.15, 0.45, {}],
  ["trucker", "chauffeur routier", "chauffeuse routière", "serv", 1, 1920, 2100, 0.3, 0.62, { risk: 1 }],
  ["cashier", "caissier", "caissière", "serv", 1, 1950, 2100, 0.15, 0.4, {}],
  ["hairdresser", "coiffeur", "coiffeuse", "serv", 1, 1900, 2100, 0.15, 0.5, { self: true }],
  ["secretary", "secrétaire", "secrétaire", "serv", 2, 1900, 2005, 0.3, 0.6, {}],
  ["clerk", "employé de bureau", "employée de bureau", "serv", 2, 1900, 2100, 0.35, 0.66, {}],
  ["callcenter", "téléconseiller", "téléconseillère", "serv", 2, 1990, 2100, 0.25, 0.5, {}],
  ["sales", "commercial", "commerciale", "serv", 2, 1920, 2100, 0.4, 0.88, {}],
  ["realtor", "agent immobilier", "agente immobilière", "serv", 2, 1950, 2100, 0.3, 0.88, { self: true, w: 0.5 }],
  ["courier", "livreur à vélo", "livreuse à vélo", "serv", 1, 2014, 2100, 0.1, 0.35, { gig: true, risk: 1, w: 0.6 }],
  ["vtc", "chauffeur VTC", "chauffeuse VTC", "serv", 1, 2012, 2100, 0.15, 0.42, { gig: true, w: 0.6 }],
  ["accountant", "comptable", "comptable", "serv", 3, 1900, 2100, 0.5, 0.86, {}],
  ["banker", "cadre de banque", "cadre de banque", "serv", 3, 1900, 2100, 0.65, 0.98, { w: 0.5 }],
  ["journalist", "journaliste", "journaliste", "serv", 3, 1900, 2100, 0.4, 0.82, { w: 0.3 }],
  ["lawyer", "avocat", "avocate", "serv", 3, 1900, 2100, 0.7, 0.99, { minAge: 24, w: 0.4 }],
  ["pilot", "pilote de ligne", "pilote de ligne", "serv", 3, 1930, 2100, 0.85, 0.99, { minAge: 23, w: 0.08 }],
  ["creator", "créateur de contenu", "créatrice de contenu", "serv", 1, 2008, 2100, 0.03, 0.99, { self: true, gig: true, w: 0.08 }],
  ["artist", "artiste", "artiste", "serv", 0, 1900, 2100, 0.03, 0.9, { self: true, w: 0.15 }],
  ["soldier", "soldat", "soldate", "pub", 1, 1900, 2100, 0.25, 0.55, { risk: 2, w: 0.6 }],
  ["police", "policier", "policière", "pub", 2, 1900, 2100, 0.35, 0.66, { risk: 1 }],
  ["carer", "aide-soignant", "aide-soignante", "pub", 2, 1950, 2100, 0.25, 0.5, {}],
  ["nurse", "infirmier", "infirmière", "pub", [2, 1985, 3], 1900, 2100, 0.45, 0.76, {}],
  ["teacher", "instituteur", "institutrice", "pub", [2, 1970, 3], 1900, 2100, 0.45, 0.76, {}],
  ["civil", "fonctionnaire", "fonctionnaire", "pub", 2, 1900, 2100, 0.45, 0.8, {}],
  ["doctor", "médecin", "médecin", "pub", 3, 1900, 2100, 0.85, 0.99, { minAge: 25, w: 0.5 }],
  ["professor", "enseignant-chercheur", "enseignante-chercheuse", "pub", 3, 1900, 2100, 0.72, 0.95, { minAge: 26, w: 0.3 }],
  ["engineer", "ingénieur", "ingénieure", "tech", 3, 1900, 2100, 0.7, 0.96, {}],
  ["architect", "architecte", "architecte", "tech", 3, 1900, 2100, 0.6, 0.95, { w: 0.3 }],
  ["developer", "développeur", "développeuse", "tech", [3, 2000, 2], 1975, 2100, 0.6, 0.97, {}],
  ["datasci", "data scientist", "data scientist", "tech", 3, 2012, 2100, 0.8, 0.99, { w: 0.3 }],
  ["researcher", "chercheur", "chercheuse", "tech", 3, 1900, 2100, 0.65, 0.95, { minAge: 25, w: 0.3 }],
];
const JOBS_LIST = JOB_ROWS.map(([id, m, f, sector, edu, from, to, lo, hi, o]) => ({ id, m, f, sector, edu, from, to, lo, hi, ...o }));
const JOB_BY_ID = Object.fromEntries(JOBS_LIST.map(j => [j.id, j]));
const SECTOR_LABEL = { agri: "agriculture", informal: "secteur informel", ind: "industrie", serv: "services", pub: "secteur public", tech: "technique et sciences" };
// Métiers encore très marqués par le sexe (ordre de grandeur des statistiques d'emploi).
const MALE_LEANING = new Set(["soldier", "miner", "builder", "trucker", "mechanic", "welder", "electrician", "fisher", "porter", "mototaxi", "pilot", "police", "engineer"]);
const FEMALE_LEANING = new Set(["domestic", "tailor", "carer", "nurse", "teacher", "secretary", "hairdresser", "textile", "cashier"]);
const genderFit = (j, sex) => !sex ? 1 : sex === "f" ? (MALE_LEANING.has(j.id) ? 0.25 : FEMALE_LEANING.has(j.id) ? 1.6 : 1) : (FEMALE_LEANING.has(j.id) ? 0.35 : MALE_LEANING.has(j.id) ? 1.3 : 1);
const jobEdu = (j, year) => Array.isArray(j.edu) ? (year < j.edu[1] ? j.edu[0] : j.edu[2]) : j.edu;
// Poids de chaque secteur dans l'emploi d'un pays une année donnée.
function sectorWeight(c, sector) {
  const serv = Math.max(5, 100 - c.agri - c.ind);
  switch (sector) {
    case "agri": return c.agri;
    case "ind": return c.ind;
    case "serv": return serv * 0.55;
    case "pub": return clamp(c.tax, 3, 40) * 0.7;
    case "tech": return clamp(c.gdp / 30000, 0.05, 2) * (1.5 + c.net / 40);
    case "informal": return c.gdp < 30000 ? (100 - c.bank) * 0.35 : 1;
  }
  return 1;
}
// Les métiers accessibles à cette personne, ici et maintenant.
function jobsFor(L) {
  const c = L.here, y = L.calYear, rank = EDU_RANK[L.edu];
  const sectors = {};
  for (const j of JOBS_LIST) if (y >= j.from && y <= j.to) sectors[j.sector] = (sectors[j.sector] || 0) + 1;
  // Spécialité d'université et métier appris (careers.js) : ils ouvrent ou ferment des portes.
  const field = L.degree && L.edu === "universite" ? FIELD_BY_ID[L.degree.field] : null, short = field && L.degree.level === "court";
  const trade = L.trade ? TRADE_BY_ID[L.trade] : null, learned = j => !!trade && trade.jobs.includes(j.id);
  return JOBS_LIST.filter(j => y >= j.from && y <= j.to && jobEdu(j, y) <= rank + (learned(j) ? 1 : 0) && L.age >= (j.minAge || (jobEdu(j, y) <= 1 ? 10 : 16)) && !(j.sector === "agri" && L.urban && c.agri < 5)
      && !(field && JOB_NEEDS[j.id] && !JOB_NEEDS[j.id].includes(field.id)) && !(short && ["doctor", "lawyer", "professor", "researcher"].includes(j.id)))
    .map(j => ({ job: j, weight: sectorWeight(c, j.sector) / sectors[j.sector] * (j.w ?? 1) * genderFit(j, L.sex) * (jobEdu(j, y) === rank ? 1.6 : 1) * (j.sector === "agri" && L.urban ? 0.3 : 1) * (field && field.jobs.includes(j.id) ? 6 : 1) * (learned(j) ? 5 : 1) }))
    .filter(x => x.weight > 0.05);
}
const jobLabel = (j, sex) => sex === "m" ? j.m : j.f;
function hireChance(L, j) {
  const c = L.here, extra = EDU_RANK[L.edu] - jobEdu(j, L.calYear);
  return clamp(0.8 - c.unemp / 35 + (L.stats.know - 50) / 180 + extra * 0.06 - (j.lo > 0.6 ? 0.2 : 0) - (j.hi > 0.95 ? 0.15 : 0) + (L.network || 0) * 0.05, 0.05, 0.95);
}

// Avantages et inconvénients d'un métier, pour choisir entre des offres.
const JOB_NOTES = {
  doctor: ["métier respecté", "longues gardes de nuit"], nurse: ["utile, demandé partout", "horaires de nuit et week-ends"], carer: ["utile, demandé partout", "physiquement épuisant"],
  teacher: ["vacances scolaires", "classes chargées"], professor: ["liberté de recherche", "postes rares"], civil: ["sécurité de l’emploi", "travail routinier"],
  lawyer: ["prestige", "semaines de 60 heures"], banker: ["primes", "pression et longues journées"], accountant: ["horaires réguliers", "travail répétitif"],
  engineer: ["métier recherché", ""], developer: ["télétravail possible", "les technologies changent vite"], datasci: ["métier recherché", ""], researcher: ["passionnant", "contrats courts au début"],
  journalist: ["métier passionnant", "précarité des débuts"], pilot: ["voyages", "absences, décalage horaire"], architect: ["métier créatif", "dépend des chantiers"],
  callcenter: ["facile à décrocher", "travail répétitif, clients énervés"], cashier: ["facile à décrocher", "debout toute la journée"], waiter: ["pourboires", "horaires du soir"],
  cook: ["métier qui voyage bien", "horaires du soir, chaleur"], guard: ["facile à décrocher", "nuits blanches"], trucker: ["autonomie", "loin de chez soi des jours entiers"],
  soldier: ["logé, nourri", "danger en cas de guerre"], police: ["sécurité de l’emploi", "danger, horaires décalés"], miner: ["mieux payé que les champs", "poussière, accidents"],
  builder: ["toujours du travail", "travail physique, accidents"], farmer: ["on travaille chez soi", "tout dépend de la pluie et des prix"], farmhand: ["pas besoin de diplôme", "journées sous le soleil, payé à la journée"],
  herder: ["le bétail est une épargne", "sécheresses"], fisher: ["indépendance", "mer dangereuse, prises incertaines"], market: ["on est son propre patron", "revenus au jour le jour"],
  domestic: ["logé chez l’employeur", "dépendance au patron, peu de droits"], porter: ["pas besoin de diplôme", "épuisant"], textile: ["salaire régulier", "cadences et heures sup"],
  factory: ["salaire régulier", "travail à la chaîne"], courier: ["horaires libres", "payé à la course, sans protection"], vtc: ["horaires libres", "la voiture coûte cher"],
  creator: ["liberté totale", "revenus très incertains"], artist: ["liberté", "revenus très incertains"], seller: ["contact avec les clients", "salaire modeste"], sales: ["primes à la vente", "objectifs à tenir"],
  realtor: ["commissions", "revenus irréguliers"], hairdresser: ["métier de contact", "debout toute la journée"], tailor: ["travail à domicile possible", "concurrence des vêtements d’usine"],
  technician: ["compétences recherchées", "astreintes"], electrician: ["toujours du travail", "risque électrique"], mechanic: ["métier concret", "mains dans le cambouis"],
  welder: ["bien payé pour un métier manuel", "fumées et brûlures"], secretary: ["horaires réguliers", "peu d’évolution"], clerk: ["horaires réguliers", "travail de bureau répétitif"],
  artteacher: ["vivre de sa passion", "peu d’heures, plusieurs employeurs"],
  mototaxi: ["démarrage rapide", "accidents fréquents"], phonefix: ["métier d’avenir dans le quartier", "petites marges"], coach: ["passion du sport", "horaires du soir et week-ends"],
};
function jobTraits(L, j, pay) {
  const c = L.here, ratio = pay / median(c), pros = [], cons = [];
  if (ratio >= 2.5) pros.push("très bien payé"); else if (ratio >= 1.3) pros.push("bien payé"); else if (ratio < 0.6) cons.push("mal payé");
  const field = L.degree && L.edu === "universite" && FIELD_BY_ID[L.degree.field], trade = L.trade && TRADE_BY_ID[L.trade];
  if (field && field.jobs.includes(j.id)) pros.push("dans votre spécialité");
  if (trade && trade.jobs.includes(j.id)) pros.push("le métier que vous avez appris");
  const [pro, con] = JOB_NOTES[j.id] || [];
  if (pro) pros.push(pro);
  if (j.sector === "pub" && !pros.includes("sécurité de l’emploi")) pros.push("emploi stable");
  if (j.informal) cons.push("sans contrat ni retraite");
  else if (j.self) cons.push("revenus irréguliers");
  if (j.risk >= 2 && !/accident|danger/.test(con || "")) cons.push("dangereux pour la santé");
  if (con) cons.push(con);
  if (j.hi >= 0.95 && ratio < 2.5) pros.push("belles perspectives");
  return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
}
const euroMonthly = x => compactMoney(x * 0.72 / 12, "€");

// --- Placements --------------------------------------------------------------
const ASSETS = {
  cash: { label: "Liquide", note: "Disponible, mais l’inflation le ronge chaque année." },
  deposit: { label: "Compte d’épargne", note: "Sûr ; suit à peu près l’inflation, sauf en cas d’hyperinflation." },
  tontine: { label: "Tontine", note: "Épargne collective entre proches ; un tour arrive parfois tard, ou jamais." },
  bonds: { label: "Obligations d’État", note: "Un peu plus que l’épargne ; souffre quand l’inflation surprend." },
  stocks: { label: "Actions du pays", note: "Rapporte le plus sur la durée, avec des krachs." },
  world: { label: "Fonds indiciel mondial", note: "Actions du monde entier, frais faibles, risque réparti." },
  rental: { label: "Immobilier locatif", note: "Loyers et valeur du bien ; dépend des crises immobilières." },
  gold: { label: "Or", note: "Valeur refuge, sans rendement : de longues années à la baisse." },
  livestock: { label: "Bétail", note: "L’épargne des campagnes ; une sécheresse peut tout emporter." },
  crypto: { label: "Cryptomonnaies", note: "Extrêmement volatil : des années à +300 % et à −70 %." },
};
// Régimes où il n'y avait ni Bourse ni placements privés.
const PLANNED = {
  RU: [1917, 1991], UA: [1917, 1991], BY: [1917, 1991], KZ: [1920, 1991], UZ: [1920, 1991], TM: [1920, 1991], KG: [1920, 1991], TJ: [1920, 1991],
  AZ: [1920, 1991], AM: [1920, 1991], GE: [1920, 1991], MD: [1940, 1991], LT: [1940, 1991], LV: [1940, 1991], EE: [1940, 1991],
  PL: [1948, 1990], CZ: [1948, 1990], SK: [1948, 1990], HU: [1948, 1990], RO: [1948, 1990], BG: [1946, 1990], AL: [1946, 1991],
  RS: [1945, 1990], HR: [1945, 1990], BA: [1945, 1990], SI: [1945, 1990], MK: [1945, 1990], ME: [1945, 1990], XK: [1945, 1990],
  CN: [1949, 1990], VN: [1975, 2000], LA: [1975, 2010], KH: [1975, 1993], MN: [1924, 1991], CU: [1960, 2100], KP: [1948, 2100], ET: [1975, 1991],
};
const planned = (code, y) => PLANNED[code] && y >= PLANNED[code][0] && y < PLANNED[code][1];
function assetAvailable(L, k) {
  const c = L.here, y = L.calYear, rich = c.gdp >= 25000;
  switch (k) {
    case "cash": case "gold": return true;
    case "deposit": return !!L.bank;
    case "tontine": return ["SSA", "SAS", "EAS"].includes(c.region) && c.gdp < 20000;
    case "bonds": return !!L.bank && (rich || y >= 1990) && !planned(L.code, y);
    case "stocks": return !!L.bank && c.mcap >= 10 && (rich ? true : y >= 1990) && !planned(L.code, y);
    case "world": return !!L.bank && y >= 1976 && (rich || y >= 2010) && !planned(L.code, y);
    case "rental": return !!L.bank && !planned(L.code, y);
    case "livestock": return !L.urban && c.agri >= 10;
    case "crypto": return y >= 2013 && c.net >= 15;
  }
  return false;
}
// Rendement mondial des actions (réel) : années connues, sinon tirage stable par année.
const MARKET_YEARS = {
  1907: -0.3, 1917: -0.3, 1920: -0.18, 1929: -0.12, 1930: -0.25, 1931: -0.4, 1932: -0.05, 1933: 0.5, 1935: 0.4, 1937: -0.33, 1940: -0.12, 1941: -0.2,
  1946: -0.18, 1954: 0.5, 1966: -0.13, 1969: -0.14, 1973: -0.22, 1974: -0.36, 1975: 0.3, 1977: -0.13, 1981: -0.12, 1985: 0.26, 1987: 0.01, 1995: 0.33,
  1997: 0.28, 2000: -0.12, 2001: -0.14, 2002: -0.22, 2003: 0.27, 2008: -0.4, 2009: 0.3, 2011: -0.08, 2013: 0.25, 2018: -0.11, 2019: 0.24, 2020: 0.13,
  2021: 0.18, 2022: -0.25, 2023: 0.18, 2024: 0.15,
};
const marketReturn = y => MARKET_YEARS[y] ?? clamp(0.055 + 0.15 * yearNoise(y, 1), -0.45, 0.55);
const GOLD_YEARS = { 1974: 0.6, 1979: 1.0, 1980: 0.1, 1981: -0.35, 1997: -0.22, 2011: 0.08, 2013: -0.3, 2020: 0.22, 2024: 0.25 };
const goldReturn = y => GOLD_YEARS[y] ?? (y >= 1972 && y <= 1980 ? 0.25 : y >= 1981 && y <= 2000 ? -0.06 : y >= 2002 && y <= 2012 ? 0.13 : 0.005 + 0.12 * yearNoise(y, 2));
const CRYPTO_YEARS = { 2013: 4, 2014: -0.6, 2015: 0.3, 2016: 1.2, 2017: 12, 2018: -0.75, 2019: 0.9, 2020: 3, 2021: 0.6, 2022: -0.65, 2023: 1.5, 2024: 1.2 };
const cryptoReturn = y => CRYPTO_YEARS[y] ?? clamp(0.08 + 0.75 * yearNoise(y, 3), -0.8, 3);
const HOUSING_CRASH = { US: [2007, 2011], ES: [2008, 2013], IE: [2008, 2012], GB: [2008, 2009], JP: [1991, 2005], GR: [2010, 2016], CN: [2022, 2025], DK: [2008, 2012], NL: [2009, 2013] };
const housingReturn = (code, y) => (HOUSING_CRASH[code] && y >= HOUSING_CRASH[code][0] && y <= HOUSING_CRASH[code][1] ? -0.08 : 0.01) + 0.05 * yearNoise(y, 10 + code.charCodeAt(0));

// Inflation d'une année : niveau habituel du pays, plus les crises.
function inflationAt(L) {
  const c = L.here, y = L.calYear;
  let pi = y < 1914 ? 0.01 : y < 1960 ? 0.03 : clamp(c.infl, -2, 60) / 100;
  for (const { p } of activeEvents(L.code, y)) if (p.infl) pi += p.infl / 100;
  return pi + 0.01 * randn() * (1 + pi);
}
function assetReturns(L) {
  const c = L.here, y = L.calYear, pi = inflationAt(L), base = y < 1960 ? 0.03 : clamp(c.infl, -2, 60) / 100;
  const real = nominal => (1 + nominal) / (1 + pi) - 1;
  const poor = c.gdp < 10000, hyper = pi > 0.5;
  const g = marketReturn(y);
  return {
    cash: real(0),
    deposit: real(base > 0.2 ? base * 0.7 : base + 0.004),
    tontine: rand() < 0.04 ? -0.5 : real(base * 0.5),
    bonds: rand() < (c.gdp < 8000 ? 0.012 : 0.002) ? -0.5 : real(base + 0.015 + (poor ? 0.04 : c.gdp < 25000 ? 0.02 : 0)) + 0.04 * randn(),
    stocks: 0.8 * g + 0.012 + (poor ? 0.01 : 0) + (poor ? 0.22 : 0.1) * randn() - (hyper ? 0.25 : 0),
    world: g - 0.003,
    rental: housingReturn(L.code, y) + 0.03 - (hyper ? 0.1 : 0),
    gold: goldReturn(y),
    livestock: rand() < (["SSA", "SAS"].includes(c.region) ? 0.05 : 0.02) ? -0.4 : 0.05 + 0.1 * randn(),
    crypto: cryptoReturn(y),
    _pi: pi,
  };
}

// --- Train de vie et projet d'enfants -----------------------------------------------
const SPEND = {
  frugal: { label: "Économe", rate: 0.78, happy: -3, note: "On met de côté, on se prive un peu." },
  normal: { label: "Raisonnable", rate: 0.92, happy: 0, note: "On vit bien, on épargne un peu." },
  large: { label: "Dépensier", rate: 1.08, happy: 4, note: "On profite, quitte à s’endetter." },
};
const KIDS_PLAN = { demander: "Me demander à chaque fois", oui: "En vouloir (sans me demander)", plusTard: "Plus tard", non: "Ne pas en vouloir" };
const ACTIONS_PER_YEAR = 3;

// --- Entreprises -------------------------------------------------------------
const BUSINESSES = {
  shop: { label: "Petit commerce", cost: 0.6, mult: 1.0, sd: 0.5, risk: 1 },
  workshop: { label: "Atelier d’artisan", cost: 0.8, mult: 1.1, sd: 0.5, risk: 1 },
  restaurant: { label: "Restaurant", cost: 1.5, mult: 1.3, sd: 0.7, risk: 1.5 },
  farm: { label: "Exploitation agricole", cost: 1.2, mult: 0.9, sd: 0.5, risk: 1, rural: true },
  transport: { label: "Entreprise de transport", cost: 1.0, mult: 1.1, sd: 0.5, risk: 1.1, from: 1920 },
  building: { label: "Entreprise du bâtiment", cost: 2.0, mult: 1.6, sd: 0.7, risk: 1.2, edu: 1 },
  micro: { label: "Microentreprise (microcrédit)", cost: 0.15, mult: 0.6, sd: 0.4, risk: 1, from: 1983, maxGdp: 15000, loan: true },
  startup: { label: "Start-up technologique", cost: 2.0, mult: 0.6, sd: 1.3, risk: 2, from: 1995, edu: 2, net: 30 },
};

// Domaine de chaque entreprise (pour s'y retrouver quand on en crée plusieurs).
const BIZ_DOMAIN = { shop: "Commerce", workshop: "Artisanat", restaurant: "Restauration", farm: "Agriculture", transport: "Transport", building: "Bâtiment", micro: "Commerce", startup: "Technologie" };
Life.prototype.focusBiz = function (b) { const i = (this.businesses || []).indexOf(b); if (i < 0) return false; this.bizFocus = i; return true; };

// Tailles d'entreprise : chacune s'atteint quand l'activité le permet, en investissant.
const BIZ_SIZES = [
  { label: "petite entreprise" },
  { label: "PME", at: 4, cost: 2, ask: "Embaucher et ouvrir de nouveaux sites", verb: "Embaucher et ouvrir de nouveaux sites",
    say: "L’entreprise grandit : des dizaines de salariés, plusieurs sites. C’est désormais une PME.", fail: "Tente d’agrandir l’entreprise ; les nouveaux sites perdent de l’argent." },
  { label: "grande entreprise", at: 20, cost: 12, ask: "Lever des fonds et s’implanter dans tout le pays", verb: "Lever des fonds, s’implanter partout",
    say: "Des milliers de salariés, des sites dans tout le pays : une grande entreprise.", fail: "La levée de fonds échoue ; l’expansion dans le pays est abandonnée." },
  { label: "multinationale", at: 100, cost: 60, ask: "S’implanter à l’étranger et devenir une multinationale", verb: "Ouvrir des filiales à l’étranger",
    say: "Des filiales sur plusieurs continents : l’entreprise devient une multinationale.", fail: "L’implantation à l’étranger tourne mal ; il faut fermer les filiales." },
];

// --- Méthodes ajoutées à Life ---------------------------------------------------
Object.defineProperty(Life.prototype, "savings", {
  get() { return Object.values(this.assets || {}).reduce((s, v) => s + v, 0); },
  configurable: true,
});
// Plusieurs entreprises : « business » désigne celle dont on s'occupe en ce moment (bizFocus) ;
// la liste complète est « businesses ». Les anciennes sauvegardes (une seule entreprise) y entrent d'elles-mêmes.
Object.defineProperty(Life.prototype, "business", {
  get() { const l = this.businesses; return l && l.length ? l[Math.min(this.bizFocus || 0, l.length - 1)] : null; },
  set(v) {
    if (!this.businesses) this.businesses = [];
    const i = Math.min(this.bizFocus || 0, this.businesses.length - 1);
    if (v == null) { if (this.businesses.length) this.businesses.splice(i, 1); this.bizFocus = 0; }
    else if (!this.businesses.includes(v)) { if (this.businesses.length) this.businesses[i] = v; else this.businesses.push(v); }
  },
  configurable: true,
});
Object.assign(Life.prototype, {
  initMoney() {
    this.assets = { cash: 0 };
    this.alloc = { cash: 100 };
    this.debt = 0;
    this.house = null;
    this.spend = "normal";
    this.bank = false;
    this.bankLatent = rand(); // compte en banque dès que l'accès du pays (et du milieu) le permet
    this.urban = rand() < this.country.urban / 100;
    this.businesses = [];
    this.bizFocus = 0;
    this.pension = 0;
    this.partnerInfo = null;
    this.budget = null;
    this.actionsLeft = ACTIONS_PER_YEAR;
    this.network = 0;
    this.langs = 0;
    this.kidsFund = 0;
  },
  netIncome() { return this.budget ? this.budget.net : this.income; },
  netWorth() {
    const h = this.house ? this.house.value - this.house.loan : 0;
    const b = (this.businesses || []).reduce((s, x) => s + x.value * (x.stake ?? 1), 0);
    return this.savings + h + b - this.debt;
  },
  // Patrimoine comparé au reste du pays (patrimoine médian ≈ 2 à 4 années de revenu médian).
  wealthPct() {
    const c = this.here, w = this.netWorth(), med = median(c) * (c.gdp > 25000 ? 3.5 : c.gdp > 8000 ? 2 : 1);
    if (w <= 0) return clamp(0.08 + w / (med * 20), 0.01, 0.1);
    return clamp(normCdf(Math.log(w / med) / 1.4), 0.01, 0.999);
  },
  // Ajoute ou retire de l'argent : la dette d'abord, puis les placements.
  addMoney(x) {
    if (x >= 0) {
      if (this.debt > 0) { const r = Math.min(x, this.debt); this.debt -= r; x -= r; }
      this.invest(x);
    } else this.withdraw(-x);
  },
  invest(x) {
    if (x <= 0) return;
    const alloc = this.validAlloc();
    for (const [k, w] of Object.entries(alloc)) this.assets[k] = (this.assets[k] || 0) + x * w / 100;
  },
  withdraw(x) {
    const order = ["cash", "deposit", "tontine", "bonds", "world", "stocks", "gold", "crypto", "livestock", "rental"];
    for (const k of order) {
      if (x <= 0) break;
      const take = Math.min(this.assets[k] || 0, x);
      this.assets[k] = (this.assets[k] || 0) - take; x -= take;
    }
    if (x > 0) this.debt += x;
  },
  pay(x) { this.withdraw(x); },
  // Répartition souhaitée, réduite aux placements accessibles.
  validAlloc() {
    const out = {};
    let total = 0;
    for (const [k, w] of Object.entries(this.alloc)) if (w > 0 && assetAvailable(this, k)) { out[k] = w; total += w; }
    if (!total) return this.bank ? { deposit: 100 } : { cash: 100 };
    for (const k in out) out[k] = out[k] * 100 / total;
    return out;
  },
  setAlloc(alloc) { this.alloc = Object.fromEntries(Object.entries(alloc).filter(([, v]) => v > 0)); },
  rebalance() {
    const liquid = Object.entries(this.assets).filter(([k]) => k !== "livestock").reduce((s, [, v]) => s + v, 0);
    const keep = { livestock: this.assets.livestock || 0 };
    this.assets = keep;
    this.invest(liquid);
  },
  careCost() { return median(this.here) * this.here.oop / 100; },

  // Impôt payé sur un revenu : faible dans l'informel et avant les grands impôts sur le revenu.
  taxRate(pct, informal) {
    const c = this.here, y = this.calYear;
    if (informal && c.gdp < 25000) return 0.02;
    const era = y < 1914 ? 0.15 : y < 1945 ? 0.5 : 1;
    return clamp(c.tax / 100 * (0.3 + 1.4 * pct) * era * (c.gdp < 5000 ? 0.6 : 1), 0, 0.5);
  },
  // Revenu de l'année : salaire, entreprise ou retraite (et aides des enfants).
  computeIncome() {
    const c = this.here;
    // L'entreprise (dirigée, menée à côté d'un emploi, ou confiée à un gérant) : votre part des bénéfices.
    // Chaque entreprise vit son année ; vous touchez votre part de chacune.
    let biz = 0;
    for (const b of [...(this.businesses || [])]) {
      if (!this.focusBiz(b)) continue;
      const inc = this.runBusiness();
      if (this.focusBiz(b)) biz += inc * this.bizShare();
    }
    this.bizFocus = 0;
    const salaried = this.job && !(this.jobInfo && this.jobInfo.id === "business");
    if (this.retired) {
      const kids = this.children.filter(k => k.alive && this.age - k.born >= 20).length;
      const help = c.gdp < 15000 ? kids * median(c) * 0.12 : 0;
      this.income = this.pension + help + biz;
    } else if (salaried) {
      // Les stars gagnent bien plus que le haut de l'échelle des salaires.
      this.income = incomeAt(c, this.incomePct) * this.econ * (this.jobInfo && this.jobInfo.career ? this.starMult || 1 : 1) + biz;
    } else if (this.business) {
      this.income = biz;
      this.incomePct = incomePctOf(c, this.income);
    } else this.income = biz;
    // Revenu du conjoint.
    const pi = this.partnerInfo;
    if (this.married && pi) {
      pi.age += 1;
      if (pi.works && pi.age >= this.retireAge() + 1) { pi.works = false; pi.retired = true; pi.pension = incomeAt(c, pi.pct) * this.pensionRate(false); }
      pi.income = pi.works ? incomeAt(c, pi.pct) * this.econ : pi.retired ? pi.pension || 0 : 0;
    }
  },
  // Une année d'entreprise : croissance, faillite, offres de rachat (jamais vendue sans votre accord).
  runBusiness() {
    const c = this.here, b = this.business, size = b.size || 0;
    // Qui dirige compte : vous (votre savoir), ou le gérant (son expérience). Le climat social aussi.
    const lead = b.mode === "managed" && b.manager ? b.manager.skill : this.stats.know;
    b.mult *= Math.exp(0.02 + (lead - 50) / 1500 + ((b.morale ?? 50) - 50) / 1500 + (b.policy === "reinvest" ? 0.02 : 0) + (b.mode === "side" ? -0.01 : 0) + (0.15 - size * 0.02) * randn());
    this.bizYear();
    const income = median(c) * b.mult * this.econ;
    b.value = Math.max(0, income * (2.5 + size * 3));
    b.years += 1;
    const fail = (b.years === 1 ? 0.18 : b.years === 2 ? 0.13 : b.years <= 4 ? 0.08 : 0.04) * BUSINESSES[b.type].risk / this.econ * [1, 0.6, 0.3, 0.15][size];
    // L'année où on la reçoit en héritage, l'entreprise ne disparaît pas avant que vous ayez décidé de son sort.
    if (b.inheritedAt !== this.age && rand() < fail) {
      this.say(`${b.label} fait faillite.`, "work", true);
      this.bump("happy", -10);
      this.dropBusiness();
      return 0;
    }
    // Une offre de rachat : c'est vous qui décidez.
    if (b.years >= 3 && !this.queue.some(d => d.buyout) && rand() < (b.type === "startup" ? 0.03 : 0.012) * (1 + size)) {
      const offer = b.type === "startup" && size === 0 ? median(c) * (60 + rand() * 300) : b.value * (1.1 + rand() * 0.6);
      this.ask(`Un acheteur propose ${money(offer)} pour racheter ${b.label.toLowerCase()}. Vendre ?`, [
        { label: `Vendre pour ${money(offer)}`, sub: `≈ ${euroMonthly(offer * 12)} aux prix français · vous ne dirigez plus l’entreprise`, autoWeight: 1, apply: () => {
          if (!this.focusBiz(b)) return;
          this.say(`Vend ${b.label.toLowerCase()} pour ${money(offer)} !`, "money", true);
          this.addMoney(offer); this.bump("happy", 10);
          this.dropBusiness();
        } },
        { label: "Refuser et garder l’entreprise", autoWeight: 1.5, apply: () => this.say("Refuse une offre de rachat."), sub: "Vous gardez la main, et les risques." },
      ]);
      this.queue[this.queue.length - 1].buyout = true;
    }
    // Quand l'entreprise marche très bien, elle peut changer de taille.
    if (size < 3 && b.mult >= BIZ_SIZES[size + 1].at && b.growAskedAt !== this.age && (b.growAskedAt == null || this.age - b.growAskedAt >= 3) && !this.retired) {
      b.growAskedAt = this.age;
      this.askGrowth();
    }
    return income;
  },
  // Faire grandir l'entreprise : investir, avec une chance de réussir.
  growthOption() {
    const b = this.business, size = b.size || 0, next = BIZ_SIZES[size + 1], c = this.here;
    if (!next) return null;
    const cost = median(c) * next.cost, p = clamp(0.2 + (b.mult / next.at - 1) * 0.3 + (this.stats.know - 50) / 200 + (this.network || 0) * 0.02 - (size === 2 && c.gdp < 8000 ? 0.15 : 0), 0.05, 0.75);
    return { next, cost, p, can: this.savings >= cost * 0.3 && (this.bank || this.savings >= cost) };
  },
  growBusiness() {
    const o = this.growthOption();
    if (!o || !o.can) return null;
    const b = this.business;
    this.pay(o.cost);
    if (rand() < o.p) {
      b.size = (b.size || 0) + 1; b.mult *= 1.8;
      b.base = b.base || BUSINESSES[b.type].label;
      b.label = `${b.base} · ${o.next.label}`;
      if (this.jobInfo && this.jobInfo.id === "business") this.job = `à la tête d’une ${o.next.label} (${b.base.toLowerCase()})`;
      // Lever des fonds et grandir : on cède une part du capital ; les effectifs suivent.
      if (b.size >= 2) b.stake = (b.stake ?? 1) * (b.size === 2 ? 0.75 : 0.8);
      b.staff = Math.max(b.staff || 1, Math.round(STAFF_RANGE[b.size][0] * (1.2 + rand())));
      this.say(o.next.say, "work", true); this.bump("happy", 8); this.network += 1;
      return `${capFirst(o.next.label)} !`;
    }
    this.say(o.next.fail, "work", true); this.bump("happy", -5);
    return "L’expansion échoue.";
  },
  askGrowth() {
    const o = this.growthOption(), b = this.business;
    if (!o) return;
    this.ask(`${this.business.label} marche très bien. ${o.next.ask} ?`, [
      { label: o.next.verb, sub: `Investir ≈ ${money(o.cost)}${this.savings < o.cost ? ", en partie emprunté" : ""} · chances de réussir ${Math.round(o.p * 100)} %${o.can ? "" : " · pas assez d’argent pour l’apport"}`, autoWeight: o.can ? 1.5 : 0, apply: () => { if (!this.focusBiz(b)) return; if (!this.growBusiness()) this.say("N’a pas les moyens d’investir pour grandir.", "work"); } },
      { label: "Garder la taille actuelle", sub: "Moins de risques, moins de croissance.", autoWeight: 1, apply: () => this.say("Choisit de garder son entreprise à taille humaine.", "work") },
    ]);
  },
  retireAge() {
    const c = this.here, y = this.calYear;
    if (c.gdp > 25000) return y < 1980 ? 65 : y > 2030 ? 66 : 63;
    if (c.gdp > 10000) return 60;
    return 70;
  },
  // Part du dernier salaire versée à la retraite.
  pensionRate(informal) {
    const c = this.here, y = this.calYear;
    let r = c.gdp > 30000 ? 0.55 : c.gdp > 15000 ? 0.4 : c.gdp > 6000 ? 0.25 : 0.1;
    if (planned(this.code, y)) r = 0.4;
    if (y < 1935) r *= 0.2; else if (y < 1950) r *= 0.5;
    return informal ? r * 0.25 : r;
  },
  retire(early = false) {
    if (this.retired) return false;
    const informal = this.business ? true : !!(this.jobInfo && this.jobInfo.informal);
    const last = this.income;
    this.pension = last * this.pensionRate(informal) * (early ? 0.75 : 1);
    // L'entreprise est gardée : un gérant la dirige et elle verse des dividendes. On ne la vend que si vous le décidez.
    for (const b of this.businesses || []) if (b.mode !== "managed" && this.focusBiz(b)) this.hireManager(true);
    this.bizFocus = 0;
    this.retired = true; this.job = null; this.jobInfo = null;
    this.income = this.pension;
    this.say(this.pension > median(this.here) * 0.3 ? `Prend sa retraite : ${money(this.pension)} par an.` : "Arrête de travailler ; il faudra vivre de l’épargne et de l’aide des enfants.", "work", true);
    return true;
  },

  // --- Travail ---
  // Position de salaire qu'obtiendrait cette personne dans ce métier.
  jobPct(j) {
    const z = 0.45 * normInv((this.decile - 0.5) / 10) + 0.4 * EDU_Z[this.edu] + this.degreeZ(j) + 0.25 * (this.stats.know - 50) / 25 + 0.6 * randn();
    const u = clamp(normCdf(z / 0.95), 0.02, 0.98);
    return clamp(j.lo + (j.hi - j.lo) * u, 0.01, 0.99);
  },
  takeJob(j, pct = null) {
    this.incomePct = pct ?? this.jobPct(j);
    this.job = jobLabel(j, this.sex);
    this.jobInfo = { id: j.id, sector: j.sector, informal: !!j.informal, self: !!j.self, risk: j.risk || 0 };
    this.homemaker = false;
    if (this.firstJobAt == null) this.firstJobAt = this.age;
    this.computeIncome();
  },
  // Premier emploi, ou retour à l'emploi : plusieurs offres, tirées selon l'économie
  // du pays, avec leur salaire, leurs avantages et leurs inconvénients.
  // opts : migrant (on repart plus bas à l'étranger), prefer (métiers favorisés), city.
  startWork(opts = {}) {
    if (this.job || this.business || this.queue.some(d => d.offers || d.home)) return;
    const c = this.here;
    // Dans bien des pays et des époques, une femme mariée restait au foyer : c'est vous qui choisissez.
    if (!opts.homeAsked && this.sex === "f" && this.married && this.age >= 18 && rand() > clamp(c.flp / 65, 0.15, 1)) {
      this.ask("Ici et à cette époque, la plupart des femmes mariées restent au foyer. Chercher du travail ?", [
        { label: "Chercher du travail", sub: "Il faudra parfois aller contre l’avis de la famille.", autoWeight: clamp(c.flp / 65, 0.15, 1), apply: () => this.startWork({ ...opts, homeAsked: true }) },
        { label: "Rester au foyer", sub: "S’occuper de la maison et des enfants.", autoWeight: 1, apply: () => { this.homemaker = true; this.say("Reste au foyer pour s’occuper de la maison et des enfants.", "work", true); } },
      ]);
      this.queue[this.queue.length - 1].home = true;
      return;
    }
    const z = 0.45 * normInv((this.decile - 0.5) / 10) + 0.4 * EDU_Z[this.edu] + this.degreeZ(null) + 0.25 * (this.stats.know - 50) / 25 + 0.6 * randn();
    const target = clamp(normCdf(z / 0.95), 0.02, 0.98);
    const prefer = opts.prefer || [];
    const options = jobsFor(this).filter(o => !opts.city || o.job.sector !== "agri")
      .map(o => ({ job: o.job, w: o.weight * Math.exp(-((((o.job.lo + o.job.hi) / 2 - target) / 0.3) ** 2)) * (prefer.includes(o.job.id) ? 5 : 1) * (opts.migrant && o.job.hi >= 0.6 ? 0.25 : 1) }));
    if (!options.length) return;
    const n = this.age < 15 ? 2 : EDU_RANK[this.edu] >= 2 ? 4 : 3, picked = [];
    while (picked.length < n && options.length) picked.push(options.splice(weighted(options.map((o, i) => [i, o.w])), 1)[0].job);
    const m = median(c);
    const offers = picked.map(j => {
      let pct = this.jobPct(j);
      if (opts.migrant) pct = clamp(pct * 0.7 + this.langs * 0.02, 0.03, 0.9);
      const pay = incomeAt(c, pct) * this.econ;
      return { j, pct, pay, ...jobTraits(this, j, pay) };
    }).sort((a, b) => b.pay - a.pay);
    const start = o => {
      this.takeJob(o.j, o.pct);
      const verb = /^(vend)/.test(this.job) ? this.job : `devient ${this.job}`;
      this.say(opts.migrant ? `Trouve du travail : ${this.job}.` : opts.city ? `Trouve du travail en ville : ${this.job}.` : `${this.age < 15 ? "Encore enfant, " + verb : capFirst(verb)}.`, "work", true);
    };
    if (offers.length === 1) return start(offers[0]);
    const text = this.age < 15 ? "Il faut aider la famille. Quel travail prendre ?"
      : opts.migrant ? `Nouvelle vie ${inCountry(c)} : quel travail accepter ?`
      : this.firstJobAt == null ? (EDU_RANK[this.edu] >= 2 ? "Fin des études : plusieurs offres d’emploi se présentent. Laquelle choisir ?" : "Premier emploi : quelles offres se présentent ?")
      : "Des offres d’emploi se présentent. Laquelle accepter ?";
    const choices = offers.map(o => ({
      label: `${capFirst(jobLabel(o.j, this.sex))} · ${money(o.pay)} par an`,
      sub: [`≈ ${euroMonthly(o.pay)} par mois aux prix français`, o.pros.length ? `+ ${o.pros.join(", ")}` : "", o.cons.length ? `− ${o.cons.join(", ")}` : ""].filter(Boolean).join(" · "),
      autoWeight: o.pay / m + 0.3 + (o.j.sector === "pub" ? 0.3 : 0),
      apply: () => start(o),
    }));
    // Créer son entreprise dans sa spécialité, plutôt que d'être salarié.
    const spec = this.age >= 18 && !opts.migrant ? businessChoices(this).find(o => o.spec && (this.bank || this.savings >= median(c) * BUSINESSES[o.id].cost)) : null;
    if (spec) choices.push({ label: `Créer votre entreprise : ${BUSINESSES[spec.id].label.toLowerCase()}`, sub: `${spec.sub.replace(" · pas assez d’épargne", ", emprunté")} · + votre propre patron, dans votre spécialité · − beaucoup d’entreprises échouent dans les cinq ans`, autoWeight: 0.15, apply: () => startBusiness(this, spec.id) });
    if (this.age >= 15) choices.push({ label: "Refuser et continuer à chercher", sub: "Rien cette année ; d’autres offres viendront peut-être.", autoWeight: 0.1, apply: () => this.say("Refuse les offres et continue à chercher.", "work") });
    this.ask(text, choices);
    this.queue[this.queue.length - 1].offers = true;
  },
  loseJob(text) {
    this.say(text, "work", true);
    this.job = null; this.jobInfo = null; this.income = 0;
  },

  // --- Couple et enfants ---
  initPartner(forced) {
    const c = this.here, partnerMale = this.sex === "f";
    const pct = clamp((this.incomePct ?? (this.decile - 0.5) / 10) * 0.6 + rand() * 0.4 + (forced ? 0.1 : 0), 0.02, 0.98);
    const works = partnerMale ? rand() < 0.9 : rand() < clamp(c.flp / 65, 0.15, 1);
    this.partnerInfo = { pct, works, age: this.age + (partnerMale ? 3 : -2) + Math.round(randn() * 3) + (forced ? 12 : 0), income: 0 };
  },
  divorce() {
    if (!this.married) return false;
    this.say(`Divorce de ${this.partner}.`, "family", true);
    // Partage du patrimoine du couple.
    for (const k in this.assets) this.assets[k] *= 0.6;
    if (this.house) { this.addMoney(Math.max(0, this.house.value - this.house.loan) * 0.5 - this.house.value * 0.05); this.house = null; this.say("Le logement est vendu et partagé.", "money"); }
    this.married = false; this.partner = null; this.partnerInfo = null; this.homemaker = false; this.bump("happy", -10);
    this.divorcedAt = this.age;
    return true;
  },
  haveChild() {
    const c = this.here, a = this.age;
    const kidSex = drawSex();
    const kid = { name: this.freshName(kidSex), sex: kidSex, born: a, alive: true, other: this.partner, code: this.code };
    this.children.push(kid);
    this.say(`Naissance ${this.children.length === 1 ? "de son premier enfant" : "d’un enfant"} : ${kid.name}.`, "family", true);
    this.bump("happy", 6); this.bump("rel", 4);
    if (this.sex === "f") {
      const wealth = this.incomePct != null ? this.incomePct : this.decile / 10;
      if (rand() < c.mmr / 100000 * (1.4 - wealth * 0.8)) this.pendingDeath = "complications de grossesse";
    }
    if (rand() < c.imr * 1.4 / 1000) {
      kid.alive = false;
      this.say(`${kid.name} meurt avant ses cinq ans.`, "family", true, true);
      this.bump("happy", -20);
    }
    return kid;
  },
  moveTo(dest) {
    this.emigrated = true; this.code = dest.code;
    // Une entreprise laissée au pays reste à vous : un gérant la dirige ; la vendre reste votre choix.
    for (const b of this.businesses || []) if (b.mode !== "managed" && this.focusBiz(b)) this.hireManager(true);
    this.bizFocus = 0;
    this.job = null; this.jobInfo = null;
    this.bank = this.bank || rand() < dest.bank / 100;
    this.urban = true;
    this.say(`Émigre ${inCountry(dest)} ${dest.flag}.`, "move", true);
    this.bump("rel", -12); this.bump("happy", -3);
    // On repart souvent plus bas dans l'échelle, puis on remonte.
    this.startWork({ migrant: true });
  },
  // Héritage des parents (hors lignée) : selon l'aisance de la famille d'origine.
  inheritFrom(p) {
    if (p.paused) return; // un parent dont la vie est en pause : il a déjà transmis sa part de son vivant
    const c = this.here;
    let amount = 0;
    if (p.previous && p.bequest) { this.receiveBequest(p.bequest); return; }
    if (p.previous) amount = p.estate || 0;
    else if (this.parents.every(x => !x.alive)) {
      const mult = this.decile >= 10 ? 8 : this.decile >= 8 ? 4 : this.decile >= 6 ? 1.5 : this.decile >= 4 ? 0.4 : 0;
      const heirs = 1 + this.sibs.filter(s => s.alive && s.born <= this.age).length;
      amount = incomeAt(c, (this.decile - 0.5) / 10) * mult * (0.5 + rand()) / heirs;
    }
    if (amount > median(c) * 0.05) {
      this.addMoney(amount);
      this.say(`Hérite de ${money(amount)}.`, "money", true);
    }
  },

  // --- Budget de l'année ---
  updateMoney() {
    const c = this.here, y = this.calYear;
    // Rendements des placements, dettes et emprunt immobilier.
    const r = assetReturns(this), before = this.savings;
    // Acheter et vendre souvent des titres : des frais, et un peu plus de hauts et de bas.
    if (this.lifestyle && this.lifestyle.invest === "trade") for (const k of ["stocks", "world", "crypto"]) r[k] += -0.015 + 0.05 * randn();
    let gain = 0;
    for (const k in this.assets) { const d = this.assets[k] * Math.max(-0.95, r[k] ?? 0); this.assets[k] += d; gain += d; }
    if (before > median(c) * 0.5) {
      if (r._pi > 0.5 && (this.assets.cash || 0) + (this.assets.deposit || 0) > before * 0.3) this.say(`L’inflation (${Math.round(r._pi * 100)} % sur l’année) fait fondre l’épargne.`, "money", true);
      else if (gain / before < -0.15) this.say(`Mauvaise année pour ses placements : ${Math.round(gain / before * 100)} %.`, "money", true);
      else if (gain / before > 0.3) this.say(`Très bonne année pour ses placements : +${Math.round(gain / before * 100)} %.`, "money");
    }
    const debtRate = clamp(((c.lend || 12) - clamp(c.infl, -2, 60)) / 100 + 0.04, 0.03, 0.35);
    // Pendant un plan de surendettement, les intérêts sont gelés.
    if (this.debt > 0 && !(this.debtPlanUntil > this.age)) this.debt *= 1 + debtRate;
    if (this.house) {
      this.house.value *= 1 + housingReturn(this.code, y) - (r._pi > 0.5 ? 0.05 : 0);
      if (this.house.loan > 0) {
        const interest = this.house.loan * this.house.rate;
        this.house.loan = Math.max(0, this.house.loan + interest - this.house.payment);
      }
    }
    if (this.age >= 16 && !this.bank && this.bankLatent < c.bank / 100 * (this.urban ? 1.15 : 0.85) * (0.7 + this.decile * 0.06)) this.openBank(true);
    // À la campagne, dans les pays pauvres, on construit souvent sa maison soi-même.
    if (!this.house && !this.urban && c.gdp < 15000 && this.age >= 22 && this.age <= 45 && (this.buildAskedAt == null || this.age - this.buildAskedAt >= 5) && rand() < 0.12) {
      this.buildAskedAt = this.age;
      const value = median(c) * 1.5, cost = Math.min(this.savings, value * 0.4);
      this.ask(`Construire sa maison, avec l’aide de la famille ? Il faudrait y mettre ${money(cost)}.`, [
        { label: "Construire", sub: "Plus de loyer à payer ; une maison à soi.", autoWeight: 3, apply: () => { if (this.house) return; this.withdraw(cost); this.house = { value, loan: 0, rate: 0, payment: 0, built: true }; this.say("Construit sa maison, avec l’aide de la famille.", "money", true); this.bump("happy", 4); } },
        { label: "Pas maintenant", autoWeight: 1, apply: () => this.say("Remet à plus tard la construction de sa maison.", "money") },
      ]);
    }
    // Quand un achat devient possible, la question se pose (en mode auto, on achète souvent).
    if (!this.house && this.age >= 25 && this.age <= 60 && this.houseAskedAt !== this.age && (this.houseAskedAt == null || this.age - this.houseAskedAt >= 5) && this.canBuyHouse()) {
      this.houseAskedAt = this.age;
      const d = this.houseDeal();
      this.ask(`Un logement est à vendre : ${money(d.price)}${d.loan ? `, avec ${money(d.down)} d’apport et un emprunt de ${money(d.loan)} (${money(d.payment)} par an pendant 25 ans)` : ""}. Acheter ?`, [
        { label: "Acheter", autoWeight: 3, apply: () => this.buyHouse() },
        { label: "Rester locataire", autoWeight: 1, apply: () => this.say("Préfère rester locataire.", "money") },
      ]);
    }

    // Revenus du ménage, impôts.
    const informal = this.business ? true : !!(this.jobInfo && this.jobInfo.informal);
    const own = this.income, pi = this.married && this.partnerInfo ? this.partnerInfo : null;
    const partner = pi ? pi.income || 0 : 0;
    const tax = own * this.taxRate(this.incomePct ?? 0.3, informal || this.retired && c.gdp < 10000) + partner * this.taxRate(pi ? pi.pct : 0.3, c.agri > 40);
    const net = own + partner - tax;
    if (net <= 0 && !this.house) { this.budget = { gross: own + partner, own, partner, tax, net: 0, housing: 0, kids: 0, living: 0, saved: 0 }; this.rebalance(); return; }
    // Logement : loyer (ville plus chère que la campagne) ou emprunt et entretien.
    const m = median(c), size = { frugal: 0.8, normal: 1, large: 1.4 }[this.spend];
    let housing;
    if (this.house) housing = (this.house.loan > 0 ? this.house.payment : 0) + this.house.value * 0.01;
    else if (this.age < 23 && !this.married && this.parents.some(p => p.alive)) housing = net * 0.05;
    else housing = Math.min(m * (this.urban ? 0.3 : 0.12) * size, net * 0.45);
    const kidsN = this.children.filter(k => k.alive && this.age - k.born < 18).length;
    const kids = net * Math.min(0.25, kidsN * 0.07);
    const free = net - housing - kids;
    let living = Math.max(free * SPEND[this.spend].rate, Math.min(free, incomeAt(c, 0.1) * 0.6));
    if (this.spend !== "large") living = Math.min(living, Math.max(free, 0));
    // Les créanciers se font payer : avec des dettes, une part du budget part en remboursements
    // (intérêts et un dixième du capital), sans descendre sous le minimum pour vivre.
    if (this.debt > 0 && free > 0) {
      const floor = Math.min(free, Math.max(free * 0.55, incomeAt(c, 0.1) * 0.5));
      const service = this.debt * ((this.debtPlanUntil > this.age ? 0 : debtRate) + 0.1);
      const before = living;
      living = Math.max(floor, Math.min(living, free - service));
      if (living < before && !this.debtServiceNoted) { this.debtServiceNoted = true; this.say("Une bonne part de chaque salaire part dans le remboursement des dettes.", "money"); }
    }
    if (this.debt === 0) this.debtServiceNoted = false;
    // À la retraite, on puise dans l'épargne.
    if (this.retired) living += this.savings * 0.05;
    const saved = net - housing - kids - living;
    this.budget = { gross: own + partner, own, partner, tax, net, housing, kids, living, saved };
    this.addMoney(saved);
    this.rebalance();
    if (this.debt > Math.max(net, m) * 3 && !this.debtWarned) { this.debtWarned = true; this.say("Les dettes s’accumulent ; chaque mois devient une lutte.", "money", true); }
    if (this.debt === 0) this.debtWarned = false;
    // Surendettement : on peut demander un plan (effacement d'une partie des dettes, intérets gelés).
    if (this.debt > Math.max(net, m) * 3 && !(this.debtPlanUntil > this.age) && (this.debtAskedAt == null || this.age - this.debtAskedAt >= 4) && !this.queue.some(d => d.debtPlan)) {
      this.debtAskedAt = this.age;
      const rich = c.gdp > 20000 && y >= 1985, cut = rich ? 0.4 : 0.25;
      this.ask(`Les dettes atteignent ${money(this.debt)}. ${rich ? "Déposer un dossier de surendettement ?" : "Négocier avec les créanciers ?"}`, [
        { label: rich ? "Déposer un dossier" : "Négocier", sub: `Environ ${Math.round(cut * 100)} % des dettes effacés, intérêts gelés sept ans ; plus de crédit pendant ce temps.`, autoWeight: 4, apply: () => {
          const x = this.debt * cut; this.debt -= x; this.debtPlanUntil = this.age + 7; this.bump("happy", -3);
          this.say(rich ? `Un plan de surendettement efface ${money(x)} de dettes et gèle les intérêts.` : `Négocie avec ses créanciers : ${money(x)} de dettes effacés, le reste à rembourser sans intérêts.`, "money", true);
        } },
        { label: "Continuer à rembourser seul", sub: "Les intérêts continuent de courir.", autoWeight: 1, apply: () => this.say("Choisit de rembourser ses dettes seul.", "money") },
      ]);
      this.queue[this.queue.length - 1].debtPlan = true;
    }
    // Surendettement : la banque saisit le logement.
    if (this.house && this.debt > Math.max(net, m) * 4) {
      const equity = this.house.value * 0.85 - this.house.loan;
      this.house = null;
      this.addMoney(equity);
      this.say("Surendettement : la banque saisit le logement.", "money", true);
      this.bump("happy", -10);
    }
  },
  openBank(auto = false) {
    if (this.bank) return false;
    this.bank = true;
    if (Object.keys(this.alloc).length === 1 && this.alloc.cash) this.alloc = { deposit: 80, cash: 20 };
    this.say(auto ? "Ouvre son premier compte en banque." : "Ouvre un compte en banque.", "money");
    return true;
  },

  // --- Logement ---
  housePrice() {
    // Prix d'un logement en années de revenu médian (plus cher en ville et dans les pays riches).
    const c = this.here, pti = clamp(2.5 + c.urban / 40 + (c.gdp > 30000 ? 1 : 0), 2.5, 6);
    return median(c) * pti * (this.urban ? 1.2 : 0.75);
  },
  mortgageRate() {
    const c = this.here;
    return clamp(((c.lend || 10) - clamp(c.infl, -2, 60)) / 100 + 0.015, 0.01, 0.15);
  },
  // Conditions d'achat : apport, emprunt possible, mensualités supportables.
  houseDeal() {
    const price = this.housePrice(), c = this.here, y = this.calYear;
    const canBorrow = this.bank && (c.gdp > 8000 || y >= 2000) && !planned(this.code, y) && this.income > 0;
    const down = canBorrow ? price * (c.gdp > 25000 ? 0.15 : 0.3) : price;
    const loan = canBorrow ? price - down : 0, rate = this.mortgageRate(), n = 25;
    const payment = loan ? loan * rate / (1 - (1 + rate) ** -n) : 0;
    const affordable = !loan || payment <= Math.max(this.netIncome(), 1) * 0.4;
    return { price, down, loan, rate, payment, canBorrow, ok: this.age >= 18 && !this.house && this.savings >= down && affordable, why: this.house ? "Déjà propriétaire." : this.age < 18 ? "Trop jeune." : this.savings < down ? `Il faut ${money(down)} d’apport.` : !affordable ? "Les mensualités dépasseraient 40 % des revenus." : "" };
  },
  canBuyHouse() { return this.alive && this.houseDeal().ok; },
  buyHouse() {
    const d = this.houseDeal();
    if (!d.ok) return false;
    this.withdraw(d.down);
    this.house = { value: d.price, loan: d.loan, rate: d.rate, payment: d.payment };
    this.say(d.loan ? `Achète un logement (${money(d.price)}), avec un emprunt de ${money(d.loan)} sur 25 ans.` : `Achète un logement (${money(d.price)}).`, "money", true);
    this.bump("happy", 5);
    return true;
  },
  sellHouse() {
    if (!this.house) return false;
    const net = this.house.value * 0.94 - this.house.loan;
    this.house = null;
    this.addMoney(net);
    this.say(`Vend son logement (${money(net)} après remboursement de l’emprunt).`, "money", true);
    return true;
  },
  repayDebt() {
    const liquid = this.savings;
    const x = Math.min(liquid, this.debt + (this.house ? this.house.loan : 0));
    if (x <= 0) return false;
    this.withdraw(x);
    let left = x;
    const d = Math.min(left, this.debt); this.debt -= d; left -= d;
    if (left > 0 && this.house) { this.house.loan = Math.max(0, this.house.loan - left); if (!this.house.loan) this.house.payment = 0; }
    this.say(`Rembourse ${money(x)} de dettes.`, "money");
    return true;
  },
  helpFamily() {
    if (this.helpedAt === this.age) return false;
    const gift = Math.max(this.savings * 0.15, 0);
    if (gift < 1) return false;
    this.helpedAt = this.age;
    this.withdraw(gift);
    this.bump("rel", 6); this.bump("happy", 2);
    this.say(`Aide sa famille (${money(gift)}).`, "family");
    return true;
  },
  visitFamily() {
    if (this.visitedAt === this.age) return false;
    this.visitedAt = this.age;
    this.bump("rel", 3); this.bump("happy", 1);
    this.say(pick(["Passe du temps avec les siens.", "Rend visite à la famille.", "Organise un grand repas de famille."]), "family");
    return true;
  },

  // --- Actions de l'année ---
  availableActions() {
    return ACTIONS.map(a => {
      let why = a.when(this);
      if (why === true && this.actionsLeft <= 0) why = "Plus d’actions possibles cette année.";
      return { id: a.id, cat: a.cat, label: a.label, desc: typeof a.desc === "function" ? a.desc(this) : a.desc, ok: why === true, why: why === true ? "" : why || "", hasChoices: !!a.choices };
    });
  },
  actionChoices(id) {
    const a = ACTIONS.find(x => x.id === id);
    return a && a.choices ? a.choices(this) : [];
  },
  doAction(id, arg) {
    const a = ACTIONS.find(x => x.id === id);
    if (!a || !this.alive || a.when(this) !== true || this.actionsLeft <= 0) return null;
    this.actionsLeft -= 1;
    const text = a.run(this, arg);
    this.snapshot();
    return text;
  },

  // --- Descendance ---
  estate() { return Math.max(0, this.netWorth()); },
  initLineage(lin) {
    this.lineage = { id: lin.id, gen: lin.gen, ancestors: lin.ancestors, parentName: lin.parent.name };
    const p = lin.parent;
    this.parents = [{ role: p.sex === "f" ? "mère" : "père", name: p.name, sex: p.sex, age: p.ageAtBirth, alive: true, previous: true, deathAt: p.deathAt, cause: p.cause, estate: lin.estate, bequest: lin.bequest || null, job: p.job || null, edu: p.edu || null }];
    if (lin.other) {
      const sx = p.sex === "f" ? "m" : "f";
      this.parents.push({ role: sx === "f" ? "mère" : "père", name: lin.other, sex: sx, age: Math.max(16, p.ageAtBirth + (sx === "m" ? 3 : -2)), alive: true });
    }
    if (p.sex === "m") this.parents.reverse();
    this.sibs = lin.siblings.map(s => ({ ...s }));
    this.protectUntil = p.deathAt;
    this.stats.know = clamp(this.stats.know + lin.knowBonus, 2, 40);
    this.kidsFundStart = lin.fund || 0;
  },
});

// --- La famille et le lieu de naissance --------------------------------------------
Object.assign(Life.prototype, {
  // Études et métier des parents, selon le pays, leur époque et l'aisance de la famille.
  initParentDetails() {
    const c = this.country, pct = (this.decile - 0.5) / 10;
    for (const p of this.parents) {
      if (p.edu == null) {
        const young = countryAt(this.code, this.year - p.age + 15);
        const years = young.school * (1 + 0.3 * normInv(clamp(pct, 0.05, 0.95)) + 0.25 * randn());
        p.edu = years < 2.5 ? "none" : years < 7 ? "primaire" : years < 12 || rand() > young.tert / 60 ? "secondaire" : "universite";
      }
      if (p.job === undefined || (p.job === null && !p.previous)) {
        const works = p.sex === "m" ? rand() < 0.93 : rand() < clamp(c.flp / 65, 0.15, 1);
        p.job = null;
        if (works) {
          const ctx = { here: c, calYear: this.year, edu: p.edu, age: p.age, urban: this.urban, jobInfo: null, sex: p.sex };
          const options = jobsFor(ctx);
          if (options.length) {
            const target = clamp(pct + 0.12 * randn(), 0.02, 0.98);
            const j = weighted(options.map(o => [o.job, o.weight * Math.exp(-((((o.job.lo + o.job.hi) / 2 - target) / 0.3) ** 2))]));
            p.job = jobLabel(j, p.sex);
            p.pct = clamp(j.lo + (j.hi - j.lo) * clamp(0.5 + 0.25 * randn(), 0, 1), 0.01, 0.99);
          }
        } else p.home = p.sex === "f";
      }
    }
  },
  householdIncome() {
    const c = this.country;
    return this.parents.filter(p => p.job).reduce((s, p) => s + incomeAt(c, p.pct ?? (this.decile - 0.5) / 10), 0);
  },
  housingAtBirth() {
    const c = this.country, d = this.decile;
    if (!this.urban) return c.gdp < 6000 ? (d <= 5 ? "une maison de terre au toit de tôle ou de chaume" : "une maison en dur, au village") : d >= 8 ? "une grande maison" : "une maison familiale";
    if (c.gdp < 12000 && d <= 3) return "un quartier informel, en bordure de la ville";
    if (d >= 9) return "une grande maison dans un beau quartier";
    if (d >= 6) return "un appartement confortable";
    return "un petit logement";
  },
});
const EDU_SHORT = { none: "sans école", primaire: "école primaire", secondaire: "lycée", universite: "université" };
// Tout ce qu'on peut dire d'une naissance : famille, foyer, lieu, statistiques.
function birthDetails(L) {
  const c = L.country, y = L.year, inc = L.householdIncome(), level = L.livingStandard();
  const parentLine = p => `${p.name}, ${ans(p.age)} · ${p.job || (p.home ? "au foyer" : "sans emploi")}${p.edu ? ` · ${EDU_SHORT[p.edu]}` : ""}${p.previous ? " · votre vie précédente" : ""}`;
  const sibs = L.sibs.filter(s => s.born < 0);
  const family = [
    ...L.parents.map(p => [p.sex === "f" ? "Mère" : "Père", parentLine(p)]),
    ["Frères et sœurs", sibs.length ? sibs.map(s => `${s.name} (${ans(-s.born)})`).join(", ") : "aucun pour l’instant"],
    ["Milieu", `famille ${L.familyLabel()}`],
  ];
  if (L.lineage) family.push(["Lignée", `génération ${L.lineage.gen} : ${L.lineage.ancestors.map(a => a.name).join(" → ")}`]);
  const home = [
    ["Lieu", L.urban ? "en ville" : "à la campagne"],
    ["Logement", L.housingAtBirth()],
    ["Revenu du foyer", inc > 0 ? `≈ ${money(inc)} par an · ≈ ${(Math.round(inc * 0.72 / 12 / 10) * 10).toLocaleString("fr-FR")} € par mois aux prix français` : "presque aucun revenu monétaire"],
    ["Niveau de vie", `${capFirst(TIER_LABEL[L.livingTier(level)])} · ≈ ${money(level)} par personne et par an`],
    ["Compte en banque", c.bank >= 70 ? "courant dans le pays" : c.bank >= 30 ? "un adulte sur deux environ" : "rare"],
  ];
  const events = activeEvents(L.code, y).map(x => x.ev.name);
  const place = [
    ["Région du monde", REGION_NAMES[c.region]],
    ["Population", `${(Math.round(c.pop * 10) / 10).toLocaleString("fr-FR")} millions · ${Math.round(c.urban)} % en ville`],
    ["Enfants par femme", c.tfr.toLocaleString("fr-FR", { maximumFractionDigits: 1 })],
    ["Travail", `${Math.round(c.agri)} % dans l’agriculture · ${Math.round(c.ind)} % dans l’industrie · chômage ${c.unemp.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`],
    ["École", `${c.school.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} années en moyenne · ${Math.round(c.tert)} % vont dans le supérieur`],
    ...(y >= 1995 ? [["Internet", `${Math.round(c.net)} % des habitants`]] : []),
    ["Homicides", `${c.hom.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} pour 100 000 habitants par an`],
    ["Satisfaction de vie", `${c.happy.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 10`],
    ...(events.length ? [["En ce moment", capFirst(events.join(", "))]] : []),
  ];
  const lx = cohortLx(L.home, L.sex, y), pc = x => `${Math.round(x * 100)} %`;
  const odds = [
    ["Fêter ses 5 ans", pc(lx[5])],
    ["Atteindre 65 ans", pc(lx[65])],
    ["Entrer à l’université", pc(clamp(c.tert / 100 * (0.5 + L.decile / 15), 0.002, 0.95))],
    ...(L.sex === "f" && c.cm >= 1 ? [["Être mariée avant 18 ans", pc(clamp(c.cm / 100 * (1.3 - L.decile / 10), 0, 0.95))]] : []),
    ["Partir vivre à l’étranger", c.gdp < 20000 ? "possible, si l’occasion se présente" : "rare"],
  ];
  // Un récit en quelques phrases.
  const [m, f] = [L.parents.find(p => p.sex === "f"), L.parents.find(p => p.sex === "m")];
  const who = p => p ? `${p.sex === "f" ? "votre mère" : "votre père"}, ${p.name} (${ans(p.age)}), ${p.job ? (/^(vend |travaille )/.test(p.job) ? p.job : `est ${p.job}`) : p.home ? "s’occupe du foyer" : "cherche du travail"}` : "";
  const story = `Vous naissez ${L.urban ? "en ville" : "à la campagne"}, ${inCountry(c)}, dans ${L.housingAtBirth()}. ${capFirst([who(m), who(f)].filter(Boolean).join(" ; "))}. `
    + (inc > 0 ? `Le foyer gagne environ ${money(inc)} par an. ` : "")
    + (sibs.length ? `${sibs.length > 1 ? `${sibs.length} frères et sœurs` : sibs[0].sex === "m" ? "Un grand frère" : "Une grande sœur"} vous attend${sibs.length > 1 ? "ent" : ""} : ${sibs.map(s => s.name).join(", ")}.` : "Vous êtes le premier enfant.");
  return { story, family, home: home.filter(r => r[1]), place, odds };
}

// Ce qu'une vie laisse en mourant, et comment reprendre la lignée avec un enfant.
// will : "egal" (parts égales), "heritier" (tout à l'enfant choisi), "oeuvres" (moitié aux œuvres).
function heirOptions(L) {
  return L.children.filter(k => k.alive).map(k => ({ name: k.name, sex: k.sex, born: k.born, age: L.age - k.born, year: L.year + k.born, code: k.code || L.home, other: k.other }));
}
// Les bénéficiaires du testament à la mort : une liste de personnes (les clés « kid:Prénom », « partner »…).
// Les anciennes sauvegardes gardent « egal », « heritier » ou « oeuvres ».
const willDefaultKeys = d => d.heirs.map(h => `kid:${h.name}`);
function lineageFor(rec, heirName, will) {
  const d = rec.dyn, kid = d.heirs.find(h => h.name === heirName);
  if (!kid) return null;
  const n = d.heirs.length, c = countryAt(kid.code, kid.year);
  const taxed = d.estate * (1 - (c.gdp > 30000 ? 0.15 : 0.05));
  const keys = Array.isArray(will) && will.length ? will : null;
  const share = keys ? (keys.includes(`kid:${heirName}`) ? taxed / keys.length : 0)
    : will === "heritier" ? taxed : will === "oeuvres" ? taxed / 2 / n : taxed / n;
  const pct = d.pctAt[kid.born] ?? 0.4;
  // Les biens eux-mêmes (placements, maison, immobilier, entreprises), dans la même proportion que la part du testament.
  const w = keys ? (keys.includes(`kid:${heirName}`) ? 1 / keys.length : 0) : will === "heritier" ? 1 : will === "oeuvres" ? 0.5 / n : 1 / n;
  const bequest = d.items ? bequestFor(rec, heirName, w, keys) : null;
  return {
    mode: "births", year: kid.year, code: kid.code, sex: kid.sex, name: kid.name,
    lineage: {
      id: d.lineageId, gen: d.gen + 1, ancestors: [...d.ancestors, { name: rec.s.name, sex: rec.s.sex, home: rec.s.home, year: rec.s.year, age: rec.s.age, cause: rec.s.cause, wealth: rec.s.wealth }],
      decile: clamp(Math.round(pct * 10 + 0.5) + (d.estate > median(c) * 10 ? 1 : 0), 1, 10),
      parent: { name: rec.s.name, sex: rec.s.sex, ageAtBirth: kid.born, deathAt: rec.s.age - kid.born, cause: rec.s.cause, job: rec.s.job, edu: rec.s.edu },
      other: kid.other, estate: share, bequest, knowBonus: (rec.s.edu === "universite" ? 5 : rec.s.edu === "secondaire" ? 2 : 0) + Math.min(6, d.fund / median(c) * 2),
      siblings: d.allKids.filter(k => k.name !== kid.name).map(k => ({ name: k.name, sex: k.sex, born: k.born - kid.born, alive: k.alive })),
      fund: d.fund,
    },
  };
}

// Reprendre la vie d'un descendant là où elle en est : son enfance se déroule
// d'elle-même jusqu'à la mort du parent dont on vient de jouer la vie.
function fastForwardHeir(L) {
  const until = L.protectUntil || 0, wasAuto = L.auto;
  L.auto = true;
  // La dernière année (celle de l'héritage) n'est pas décidée d'office : ses choix vous reviennent.
  while (L.alive && L.age < until) { L.auto = L.age < until - 1; L.step(); if (L.auto) L.autoResolveAll(); }
  L.auto = wasAuto;
  L.actionsLeft = ACTIONS_PER_YEAR;
  if (L.alive) L.say(`Vous reprenez la vie de ${L.name}, à ${L.age} ans.`, "family", true);
  return L;
}

// Jouer un enfant sans mettre fin à la vie en cours : celle-ci est mise en pause.
// La vie de l'enfant se déroule d'elle-même jusqu'à son âge d'aujourd'hui.
function descendantLife(L, kid, classroom = false, gift = null) {
  if (!kid || !kid.alive) return null;
  const kidAge = L.age - kid.born, year = L.year + kid.born, code = kid.code || L.home, c = countryAt(code, year);
  const h = L.history[kid.born], pct = h && h.pct != null ? h.pct : (L.decile - 0.5) / 10;
  const lineage = {
    id: L.lineage ? L.lineage.id : L.born.getTime(), gen: (L.lineage ? L.lineage.gen : 1) + 1,
    ancestors: [...(L.lineage ? L.lineage.ancestors : []), { name: L.name, sex: L.sex, home: L.home, year: L.year, age: L.age, cause: "en vie", wealth: Math.round(L.netWorth()) }],
    decile: clamp(Math.round(pct * 10 + 0.5), 1, 10),
    parent: { name: L.name, sex: L.sex, ageAtBirth: kid.born, deathAt: null, cause: null, job: L.job, edu: L.edu },
    other: kid.other, estate: 0, knowBonus: (L.edu === "universite" ? 5 : L.edu === "secondaire" ? 2 : 0) + Math.min(6, (L.kidsFund || 0) / median(c) * 2),
    siblings: L.children.filter(k => k !== kid).map(k => ({ name: k.name, sex: k.sex, born: k.born - kid.born, alive: k.alive })), fund: L.kidsFund || 0,
  };
  const K = new Life({ mode: "births", year, code, sex: kid.sex, name: kid.name, lineage, classroom });
  // Le parent est vivant, sa vie est en pause : dans la vie de l'enfant, il vieillit normalement.
  for (const p of K.parents) if (p.previous) { p.previous = false; p.paused = true; delete p.deathAt; }
  K.protectUntil = kidAge;
  K.wantKids = "demander";
  fastForwardHeir(K);
  // Un enfant adopté : le récit le dit à l'âge de l'adoption.
  if (kid.adopted) {
    const at = kid.adoptAge ?? 0, e = { age: at, year: K.year + at, kind: "family", text: `Est ${K.g("adopté", "adoptée")} par ${L.name}${kid.origin && kid.origin !== code ? `, après être ${K.g("né", "née")} ${inCountry(BY_CODE[kid.origin])}` : ""}.`, hl: true };
    let i = K.log.findIndex(x => x.age > at); if (i < 0) i = K.log.length;
    K.log.splice(i, 0, e);
  }
  return K;
}

// --- Actions personnelles et professionnelles -------------------------------------
const adult = L => L.age >= 18 || "Réservé aux adultes.";
const working = L => !!L.job || !!L.business;
const ACTIONS = [
  // Travail
  { id: "job", cat: "pro", label: "Chercher un emploi", desc: "Voir les offres du moment, selon l’économie du pays et vos diplômes.",
    when: L => L.age < 14 ? "Trop jeune." : L.schooling ? "Encore à l’école." : L.retired ? "À la retraite." : L.job && !(L.jobInfo && L.jobInfo.id === "business") ? "Vous avez déjà un travail." : true,
    choices: L => offersFor(L, 4), run: (L, id) => applyJob(L, id) },
  { id: "switch", cat: "pro", label: "Changer de métier", desc: "Postuler ailleurs : plus de salaire, ou un autre secteur.",
    when: L => !L.job || (L.jobInfo && L.jobInfo.id === "business") ? "Il faut d’abord un emploi." : L.retired ? "À la retraite." : true,
    choices: L => offersFor(L, 5), run: (L, id) => applyJob(L, id) },
  { id: "raise", cat: "pro", label: "Demander une augmentation", desc: "Réussit plus souvent avec du savoir et de l’ancienneté.",
    when: L => !L.job || L.business ? "Il faut un emploi salarié." : L.jobInfo && L.jobInfo.self ? "Vous êtes à votre compte." : L.raisedAt === L.age ? "Déjà demandé cette année." : true,
    run: L => {
      L.raisedAt = L.age;
      const p = clamp(0.2 + L.stats.know / 250 + (L.priority === "travail" ? 0.1 : 0) - L.here.unemp / 100, 0.05, 0.7);
      if (rand() < p) { L.incomePct = clamp(L.incomePct + 0.05, 0.01, 0.99); L.computeIncome(); L.bump("happy", 3); L.say("Obtient une augmentation.", "work", true); return "Augmentation obtenue."; }
      L.bump("happy", -2);
      if (rand() < 0.05) { L.loseJob("La demande d’augmentation tourne mal : licenciement."); return "Licenciement."; }
      L.say("Demande une augmentation ; c’est non.", "work"); return "Refusée.";
    } },
  { id: "overtime", cat: "pro", label: "Faire des heures supplémentaires", desc: "Plus d’argent cette année, au prix de la santé et des proches.",
    when: L => !working(L) ? "Il faut un travail." : true,
    run: L => { const x = L.income * 0.15; L.addMoney(x * 0.8); L.bump("health", -2); L.bump("rel", -2); L.say(`Enchaîne les heures supplémentaires (+${money(x)}).`, "work"); return `+${money(x)} avant impôts.`; } },
  { id: "training", cat: "pro", label: "Suivre une formation", desc: L => `Cours du soir ou formation professionnelle (≈ ${money(median(L.here) * 0.1)}). Plus de savoir, de meilleures offres.`,
    when: L => L.age < 16 || L.age > 64 ? "Entre 16 et 64 ans." : L.calYear < 1945 ? "Rare à cette époque." : true,
    run: L => { L.pay(median(L.here) * 0.1); L.bump("know", 6); L.network += 0.5; L.say("Suit une formation professionnelle.", "edu"); return "Savoir +6."; } },
  { id: "study", cat: "pro", label: "Reprendre des études", desc: "Trois ans d’université, avec moins de revenus pendant ce temps.",
    when: L => L.edu !== "secondaire" ? (L.edu === "universite" ? "Déjà diplômé·e." : "Il faut le niveau lycée.") : L.age > 45 ? "Après 45 ans, c’est très rare." : L.schooling ? "Déjà en études." : L.here.tert < 3 ? "Presque pas d’université ici." : true,
    run: L => {
      const p = clamp(L.here.tert / 100 * 1.5 + L.stats.know / 200, 0.05, 0.9);
      if (rand() > p) { L.say("Tente de reprendre des études, sans obtenir de place.", "edu"); return "Pas de place."; }
      L.schooling = "universite"; L.adultStudy = L.age + 3; L.say("Reprend des études à l’université.", "edu", true);
      if (L.job) { L.incomePct = clamp(L.incomePct * 0.6, 0.01, 0.99); L.computeIncome(); }
      return "Inscription réussie.";
    } },
  { id: "business", cat: "pro", label: "Créer une entreprise", desc: "Commerce, atelier, ferme, start-up… Beaucoup échouent dans les cinq ans ; certaines réussissent très bien.",
    when: L => L.age < 18 || L.age > 70 ? "Entre 18 et 70 ans." : L.retired ? "À la retraite." : planned(L.code, L.calYear) ? "Interdit dans une économie planifiée." : true,
    choices: L => businessChoices(L), run: (L, id) => startBusiness(L, id) },
  { id: "sellbiz", cat: "pro", label: "Vendre une entreprise", desc: "Récupérer la valeur d’une de vos entreprises.",
    when: L => !L.business ? "Pas d’entreprise." : true,
    choices: L => (L.businesses || []).map((b, i) => ({ id: String(i), label: b.label, sub: `Valeur de votre part ≈ ${money(b.value * (b.stake ?? 1))}` })),
    run: (L, i) => { const b = L.businesses[+i]; if (!b || !L.focusBiz(b)) return null; const v = b.value * (b.stake ?? 1); L.addMoney(v); L.say(`Vend ${b.label.toLowerCase()} pour ${money(v)}.`, "money", true); L.dropBusiness(); return `+${money(v)}.`; } },
  { id: "abroad", cat: "pro", label: "Partir travailler à l’étranger", desc: "Les chances dépendent de l’époque, du passeport, des diplômes et des langues.",
    when: L => L.age < 18 || L.age > 55 ? "Entre 18 et 55 ans." : planned(L.code, L.calYear) && L.calYear > 1930 ? "Les frontières sont fermées." : true,
    choices: L => destinations(L), run: (L, code) => tryEmigrate(L, code) },
  { id: "bank", cat: "pro", label: "Ouvrir un compte en banque", desc: "Indispensable pour épargner à l’abri, placer, emprunter.",
    when: L => L.bank ? "Déjà un compte." : L.age < 16 ? "À partir de 16 ans." : true,
    run: L => { if (rand() < clamp(L.here.bank / 100 + 0.3, 0.2, 0.98)) { L.openBank(); return "Compte ouvert."; } L.say("Aucune banque n’accepte d’ouvrir un compte (trop loin, pas de papiers).", "money"); return "Refusé."; } },
  { id: "retire", cat: "pro", label: "Prendre sa retraite", desc: L => `Plus tôt que l’âge habituel (${L.retireAge()} ans), la pension est réduite d’un quart.${L.business ? " Votre entreprise sera confiée à un gérant ; vous la gardez." : ""}`,
    when: L => !working(L) ? "Il faut travailler." : L.age < 55 ? "À partir de 55 ans." : true,
    run: L => { L.retire(L.age < L.retireAge()); return "Retraite."; } },
  // Vie personnelle
  { id: "love", cat: "perso", label: "Chercher l’amour", desc: "Sortir, rencontrer, se faire présenter.",
    when: L => L.age < 16 ? "Trop jeune." : L.married ? "Déjà en couple." : true,
    run: L => {
      if (rand() < clamp(0.25 + L.stats.rel / 200 + (L.age < 40 ? 0.15 : 0), 0.1, 0.8)) {
        const nm = L.freshName(L.sex === "m" ? "f" : "m");
        L.ask(`${L.g("Il", "Elle")} rencontre ${nm}. Se marier ?`, [
          { label: `Épouser ${nm}`, autoWeight: 3, apply: () => L.marry(false, nm) },
          { label: "Pas maintenant", autoWeight: 1, apply: () => L.say(`Ne s’engage pas avec ${nm}.`) },
        ]);
        return `Rencontre avec ${nm}.`;
      }
      L.say("Cherche l’amour, sans rencontre marquante cette année.", "family"); return "Pas de rencontre.";
    } },
  { id: "child", cat: "perso", label: "Avoir un enfant", desc: "Essayer d’agrandir la famille.",
    when: L => !L.married ? "Il faut être en couple." : (L.sex === "f" ? L.age : (L.partnerInfo ? L.partnerInfo.age : L.age)) > 44 || L.age < 16 ? "Plus en âge d’avoir un enfant." : true,
    run: L => { if (rand() < 0.55) { const k = L.haveChild(); return `Naissance de ${k.name}.`; } L.say("Essaie d’avoir un enfant ; pas cette année.", "family"); return "Pas cette année."; } },
  { id: "divorce", cat: "perso", label: "Divorcer", desc: "Partager le patrimoine et repartir seul·e.",
    when: L => !L.married ? "Pas marié·e." : L.calYear < 1920 && L.here.region !== "NAM" ? "Le divorce est presque impossible à cette époque." : true,
    run: L => { L.divorce(); return "Divorce."; } },
  { id: "sport", cat: "perso", label: "Faire du sport", desc: "Santé +3, et un peu de bonheur.",
    when: L => L.age < 6 ? "Trop jeune." : L.sport === L.age ? "Déjà cette année." : true,
    run: L => { L.sport = L.age; L.bump("health", 3); L.bump("happy", 1); L.say(pick(["Se met à courir chaque matin.", "S’inscrit dans un club de sport.", "Marche de longues heures chaque semaine."]), "health"); return "Santé +3."; } },
  { id: "doctor", cat: "perso", label: "Faire un bilan de santé", desc: L => `Dépister tôt (≈ ${money(L.careCost() * 0.3)}). Moins de risques de maladie grave cette année.`,
    when: L => L.checkupAt === L.age ? "Déjà fait cette année." : L.calYear < 1930 ? "Pas encore d’usage à cette époque." : true,
    run: L => { L.pay(L.careCost() * 0.3); L.checkupAt = L.age + 1; L.bump("health", 2); L.say("Fait un bilan de santé complet.", "health"); return "Santé +2."; } },
  { id: "quit", cat: "perso", label: "Arrêter de fumer", desc: "Difficile, mais le risque baisse vite.",
    when: L => !L.smoker ? "Vous ne fumez pas." : true,
    run: L => { if (rand() < 0.35) { L.smoker = false; L.bump("health", 3); L.say("Arrête de fumer.", "health", true); return "Arrêt réussi."; } L.say("Essaie d’arrêter de fumer, sans y parvenir.", "health"); return "Rechute."; } },
  { id: "travel", cat: "perso", label: "Voyager", desc: L => `Découvrir d’autres pays (≈ ${money(median(L.here) * 0.1)}).`,
    when: L => L.age < 16 ? "À partir de 16 ans." : L.calYear < 1950 ? "Les voyages restent rares à cette époque." : true,
    run: L => { L.pay(median(L.here) * 0.1); L.bump("happy", 5); L.bump("know", 1); L.say(`Voyage ${inCountry(BY_CODE[pick(COUNTRIES.filter(c => c.code !== L.code && c.pop > 5)).code])}.`, "move"); return "Bonheur +5."; } },
  { id: "friends", cat: "perso", label: "Voir ses amis", desc: "Relations +3.",
    when: () => true, run: L => { L.bump("rel", 3); L.bump("happy", 1); L.network += 0.2; L.say(pick(["Passe une soirée avec ses amis.", "Retrouve de vieux amis.", "Organise une fête."]), "family"); return "Relations +3."; } },
  { id: "volunteer", cat: "perso", label: "Faire du bénévolat", desc: "Aider les autres : relations et bonheur.",
    when: L => L.age < 12 ? "Trop jeune." : true,
    run: L => { L.bump("rel", 3); L.bump("happy", 2); L.network += 0.3; L.say("Donne de son temps à une association.", "family"); return "Relations +3."; } },
  { id: "language", cat: "perso", label: "Apprendre une langue", desc: "Savoir +2 ; plus de chances de travailler à l’étranger.",
    when: L => L.age < 8 || L.age > 75 ? "Entre 8 et 75 ans." : L.langs >= 3 ? "Déjà trois langues." : true,
    run: L => { L.langs += 1; L.bump("know", 2); L.say("Apprend une nouvelle langue.", "edu"); return "Savoir +2."; } },
  { id: "move", cat: "perso", label: "Déménager", desc: L => L.urban ? "S’installer à la campagne : la vie coûte moins cher, les emplois sont plus rares." : "Partir en ville : plus d’emplois, des loyers plus chers.",
    when: L => L.age < 16 ? "À partir de 16 ans." : true,
    run: L => {
      L.urban = !L.urban; L.bump("rel", -2);
      if (L.house) L.sellHouse();
      L.say(L.urban ? "Part s’installer en ville." : "Quitte la ville pour la campagne.", "move", true);
      if (L.urban && L.job && L.jobInfo && L.jobInfo.sector === "agri") L.loseJob("Laisse les champs derrière soi.");
      return L.urban ? "En ville." : "À la campagne.";
    } },
  { id: "kidsfund", cat: "perso", label: "Financer les études des enfants", desc: L => `Mettre de côté pour eux (≈ ${money(median(L.here) * 0.3)}). Un enfant qui reprend la lignée partira avec plus de savoir.`,
    when: L => !L.children.some(k => k.alive && L.age - k.born < 25) ? "Pas d’enfant de moins de 25 ans." : L.savings < median(L.here) * 0.3 ? "Pas assez d’épargne." : true,
    run: L => { const x = median(L.here) * 0.3; L.withdraw(x); L.kidsFund += x; L.say("Met de l’argent de côté pour les études des enfants.", "family"); return `${money(L.kidsFund)} au total.`; } },
  { id: "faith", cat: "perso", label: "Méditer, prier", desc: "Un peu de paix intérieure.",
    when: L => L.age < 10 ? "Trop jeune." : true, run: L => { L.bump("happy", 2); L.say(pick(["Trouve la paix dans la prière.", "Prend l’habitude de méditer.", "Se rend chaque semaine au lieu de culte."])); return "Bonheur +2."; } },
];

function offersFor(L, n) {
  if (L.offers && L.offers.age === L.age) return L.offers.list;
  const options = jobsFor(L).filter(o => !L.jobInfo || o.job.id !== L.jobInfo.id);
  const picked = [];
  for (let i = 0; i < n && options.length; i++) {
    const j = weighted(options.map((o, k) => [k, o.weight]));
    picked.push(options.splice(j, 1)[0].job);
  }
  const c = L.here;
  const list = picked.sort((a, b) => b.hi - a.hi).map(j => ({
    id: j.id, label: capFirst(jobLabel(j, L.sex)),
    sub: (t => `${SECTOR_LABEL[j.sector]} · ${money(incomeAt(c, j.lo) * L.econ)} à ${money(incomeAt(c, j.hi) * L.econ)} par an · chances ${Math.round(hireChance(L, j) * 100)} %${t.pros.length ? ` · + ${t.pros.join(", ")}` : ""}${t.cons.length ? ` · − ${t.cons.join(", ")}` : ""}`)(jobTraits(L, j, incomeAt(c, (j.lo + j.hi) / 2) * L.econ)),
  }));
  L.offers = { age: L.age, list };
  return list;
}
function applyJob(L, id) {
  const j = JOB_BY_ID[id];
  if (!j) return null;
  L.offers = { age: L.age, list: (L.offers ? L.offers.list : []).filter(o => o.id !== id) };
  if (rand() < hireChance(L, j)) {
    const before = L.job;
    const full = (L.businesses || []).find(b => b.mode === "full");
    L.takeJob(j);
    L.say(before && !full ? `Change de métier : devient ${L.job}.` : `Est ${L.g("embauché", "embauchée")} : ${L.job}.`, "work", true);
    if (full && L.focusBiz(full)) L.askBizWithJob();
    L.bump("happy", 3);
    return `Embauche : ${L.job}.`;
  }
  L.say(`Postule comme ${jobLabel(j, L.sex)}, sans être retenu·e.`.replace("retenu·e", L.g("retenu", "retenue")), "work");
  return "Candidature refusée.";
}
function businessChoices(L) {
  const c = L.here, y = L.calYear, m = median(c);
  return Object.entries(BUSINESSES).filter(([, b]) => (!b.from || y >= b.from) && (!b.to || y <= b.to) && (!b.maxGdp || c.gdp < b.maxGdp) && (!b.minGdp || c.gdp >= b.minGdp) && (!b.urban || L.urban) && (!b.bank || L.bank) && (!b.edu || EDU_RANK[L.edu] >= b.edu) && (!b.net || c.net >= b.net) && (!b.rural || !L.urban) && (!b.field && !b.trade || specialtyBusiness(L, b)))
    .map(([k, b]) => {
      const cost = m * b.cost;
      const can = b.loan ? true : L.savings >= cost * 0.5 && (L.bank || L.savings >= cost);
      const dom = BIZ_DOMAIN[k] || b.domain || "Services";
      return { id: k, label: b.label + (b.field || b.trade ? " · votre spécialité" : ""), spec: !!(b.field || b.trade), dom, cost, sub: `${dom} · mise de départ ≈ ${money(cost)}${b.loan ? " (prêtée)" : L.savings < cost ? ", le reste emprunté" : ""}${can ? "" : " · pas assez d’épargne"}`, disabled: !can };
    }).sort((a, b) => b.spec - a.spec || a.dom.localeCompare(b.dom, "fr") || a.cost - b.cost);
}
function startBusiness(L, k) {
  const b = BUSINESSES[k], c = L.here;
  if (!b) return null;
  const cost = median(c) * b.cost;
  if (b.loan) L.debt += cost; else L.pay(cost);
  // Dans sa spécialité, on part avec un avantage : on connaît le métier.
  const mult = b.mult * Math.exp(b.sd * randn() - b.sd * b.sd / 2 + (L.stats.know - 50) / 200 + (b.field || b.trade ? 0.2 : 0));
  // Avec un emploi, l'entreprise se monte à côté : deux fois plus de travail.
  // Avec déjà une entreprise dirigée à plein temps, c'est vous qui choisissez qui dirige la nouvelle.
  const salaried = !!L.job && !(L.jobInfo && L.jobInfo.id === "business");
  const other = (L.businesses || []).find(x => x.mode === "full");
  const side = salaried || !!other;
  const nb = { type: k, label: b.label, base: b.label, mult, years: 0, value: cost, size: 0, mode: side ? "side" : "full", staff: 1 + Math.floor(rand() * 3), morale: 55, stake: 1, policy: "pay" };
  L.businesses = [...(L.businesses || []), nb];
  L.bizFocus = L.businesses.length - 1;
  if (!side) {
    L.job = `à la tête d’une entreprise (${b.label.toLowerCase()})`;
    L.jobInfo = { id: "business", sector: "serv", informal: c.gdp < 15000, self: true };
  }
  L.say(salaried ? `Crée son entreprise à côté de son emploi : ${b.label.toLowerCase()}. Les soirées et les week-ends y passeront.` : other ? `Crée une ${L.businesses.length}e entreprise : ${b.label.toLowerCase()}.` : `Crée son entreprise : ${b.label.toLowerCase()}.`, "work", true);
  if (other && !salaried) L.ask(`Qui dirige votre ${b.label.toLowerCase()} ?`, [
    { label: "Vous, en plus de l’autre", sub: "Deux fois plus de travail : santé, proches et bonheur en pâtissent.", autoWeight: 1, apply: () => { if (L.focusBiz(nb)) nb.mode = "side"; L.bizFocus = 0; } },
    { label: "Un gérant", sub: "Il prend une part des bénéfices ; tout dépend de son talent.", autoWeight: 1.5, apply: () => { if (L.focusBiz(nb)) L.hireManager(); L.bizFocus = 0; } },
  ]);
  L.bizFocus = 0;
  return `Entreprise créée (${money(cost)}).`;
}
function destinations(L) {
  const c = L.here, y = L.calYear;
  const pool = new Set((EMIGRATION[c.region] || EMIGRATION.EUR).filter(x => x !== L.code));
  COUNTRIES.filter(x => x.region === c.region && x.code !== L.code && x.pop > 2).sort((a, b) => countryAt(b.code, y).gdp - countryAt(a.code, y).gdp).slice(0, 3).forEach(x => pool.add(x.code));
  return [...pool].slice(0, 7).map(code => {
    const d = countryAt(code, y);
    const p = emigrationChance(L, d);
    return { id: code, label: `${d.flag} ${d.name}`, sub: `Revenu moyen ${money(d.gdp)} · chances ${Math.round(p * 100)} %` };
  });
}
function emigrationChance(L, d) {
  const c = L.here, y = L.calYear;
  let p = y < 1914 ? 0.6 : y < 1945 ? 0.2 : y < 1990 ? 0.3 : 0.25;
  if (c.region === "EUR" && d.region === "EUR" && y >= 1995 && c.gdp > 15000 && d.gdp > 15000) p = 0.9;
  if (c.gdp > 25000) p *= 2;
  p *= 1 + EDU_RANK[L.edu] * 0.25 + L.langs * 0.15;
  if (planned(L.code, y)) p *= 0.1;
  return clamp(p, 0.02, 0.95);
}
function tryEmigrate(L, code) {
  const d = countryAt(code, L.calYear);
  L.pay(median(L.here) * 0.3);
  if (rand() < emigrationChance(L, d)) { L.moveTo(d); return `Installation ${inCountry(d)}.`; }
  L.say(`Tente de partir ${inCountry(d)}, sans obtenir de visa.`, "move", true);
  L.bump("happy", -4);
  return "Visa refusé.";
}
