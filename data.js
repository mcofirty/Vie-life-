// Données des pays : voir countries.js (généré par tools/build-countries.mjs à partir
// de la Banque mondiale et d'Our World in Data). Ici : mise en forme, prénoms, causes
// de décès, destinations d'émigration, événements historiques.

const COUNTRIES = COUNTRY_ROWS.map(r => ({
  code: r[0], name: r[1], flag: r[2], region: r[3], in: r[4],
  births: r[5], pop: r[6], e0: { m: r[7], f: r[8] }, imr: r[9],
  gdp: r[10], gini: r[11], school: r[12], tert: r[13], hom: r[14],
  happy: r[15], tfr: r[16], cm: r[17], mmr: r[18], hiv: r[19], smoke: r[20], oop: r[21], agri: r[22],
  ind: r[23], unemp: r[24], urban: r[25], net: r[26], infl: r[27], lend: r[28], bank: r[29], tax: r[30], mcap: r[31], flp: r[32],
}));
const BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
const WORLD_BIRTHS_K = COUNTRIES.reduce((s, c) => s + c.births, 0);
const WORLD_POP_M = COUNTRIES.reduce((s, c) => s + c.pop, 0);
const REGION_NAMES = { SAS: "Asie du Sud", EAS: "Asie de l’Est et du Sud-Est", SSA: "Afrique subsaharienne", MENA: "Moyen-Orient et Afrique du Nord", LAT: "Amérique latine et Caraïbes", EUR: "Europe et Asie centrale", NAM: "Amérique du Nord", OCE: "Océanie" };

// Prénoms courants (sélection) par pays ou groupe de pays.
const NAME_GROUPS = {
  IN: [["Aarav", "Rohan", "Arjun", "Vikram", "Rahul", "Imran"], ["Priya", "Ananya", "Kavya", "Fatima", "Sunita", "Meera"]],
  PK: [["Ahmed", "Bilal", "Hassan", "Usman"], ["Ayesha", "Fatima", "Zainab", "Hira"]],
  BD: [["Rahim", "Sabbir", "Tanvir", "Arif"], ["Nusrat", "Sadia", "Taslima", "Rupa"]],
  AF: [["Ahmad", "Farid", "Najib", "Wahid"], ["Mariam", "Zahra", "Fereshta", "Laila"]],
  NP: [["Bikash", "Suman", "Prakash", "Ramesh"], ["Sita", "Anjali", "Puja", "Sarita"]],
  CN: [["Wei", "Hao", "Jun", "Lei", "Yang"], ["Mei", "Xin", "Li Na", "Fang", "Yu"]],
  JP: [["Haruto", "Ren", "Sōta", "Yūto"], ["Yui", "Hina", "Sakura", "Aoi"]],
  KR: [["Min-jun", "Seo-jun", "Ji-ho", "Do-yun"], ["Seo-yeon", "Ji-woo", "Ha-yoon", "Min-seo"]],
  ID: [["Budi", "Agus", "Rizky", "Dimas"], ["Siti", "Dewi", "Putri", "Ayu"]],
  PH: [["Juan", "Mark", "José", "Angelo"], ["Maria", "Angel", "Jasmine", "Kristine"]],
  VN: [["Minh", "Huy", "Nam", "Tuấn"], ["Linh", "Lan", "Hương", "Mai"]],
  TH: [["Somchai", "Anan", "Nattapong", "Krit"], ["Ploy", "Nok", "Kanya", "Mali"]],
  MM: [["Aung", "Min Thu", "Kyaw", "Zaw"], ["Thandar", "Su Su", "Hnin", "Aye"]],
  NG: [["Chinedu", "Emeka", "Musa", "Tunde", "Ibrahim"], ["Ngozi", "Aisha", "Funmilayo", "Chioma", "Hauwa"]],
  CD: [["Jean-Paul", "Patrick", "Mbuyi", "Ilunga"], ["Grâce", "Esther", "Mwamini", "Nsimba"]],
  ET: [["Abebe", "Dawit", "Tesfaye", "Yonas"], ["Selam", "Hiwot", "Meron", "Tigist"]],
  EAF: [["Baraka", "Juma", "Otieno", "Mwangi"], ["Neema", "Amani", "Wanjiru", "Achieng"]],
  LUSO: [["João", "Manuel", "António", "Celso"], ["Ana", "Esperança", "Joana", "Luísa"]],
  SAHEL: [["Moussa", "Amadou", "Oumar", "Ibrahim", "Mamadou"], ["Aminata", "Fatoumata", "Mariam", "Aïssata", "Awa"]],
  WAF: [["Kouassi", "Yao", "Serge", "Franck"], ["Adjoua", "Aya", "Christelle", "Mireille"]],
  GH: [["Kwame", "Kofi", "Kwabena", "Yaw"], ["Ama", "Akosua", "Abena", "Efua"]],
  MG: [["Rivo", "Hery", "Tiana", "Fara"], ["Voahangy", "Lalaina", "Fanja", "Haingo"]],
  HORN: [["Mohamed", "Abdi", "Hassan", "Omar"], ["Hodan", "Amina", "Fadumo", "Halima"]],
  ZA: [["Thabo", "Sipho", "Lwazi", "Johan"], ["Lerato", "Nomsa", "Thandiwe", "Zanele"]],
  ARAB: [["Mohamed", "Youssef", "Omar", "Karim", "Ali"], ["Fatima", "Mariam", "Nour", "Salma", "Yasmine"]],
  IR: [["Amir", "Reza", "Mehdi", "Ali"], ["Zahra", "Fatemeh", "Maryam", "Narges"]],
  TR: [["Yusuf", "Emir", "Mehmet", "Mustafa"], ["Zeynep", "Elif", "Ayşe", "Defne"]],
  BR: [["Miguel", "Arthur", "Gabriel", "Lucas"], ["Helena", "Alice", "Laura", "Ana Clara"]],
  HISP: [["Santiago", "Mateo", "José", "Luis"], ["Sofía", "Valentina", "María", "Camila"]],
  HT: [["Jean", "Wilson", "Pierre", "Jacques"], ["Marie", "Nadège", "Roseline", "Fabienne"]],
  FR: [["Gabriel", "Léo", "Raphaël", "Louis"], ["Jade", "Louise", "Emma", "Alice"]],
  DE: [["Noah", "Paul", "Leon", "Felix"], ["Emilia", "Mia", "Hannah", "Lina"]],
  ANGLO: [["Oliver", "Liam", "James", "Noah"], ["Olivia", "Emma", "Amelia", "Ava"]],
  IT: [["Leonardo", "Francesco", "Tommaso", "Lorenzo"], ["Sofia", "Aurora", "Giulia", "Ginevra"]],
  ES: [["Hugo", "Martín", "Lucas", "Mateo"], ["Lucía", "Sofía", "Martina", "Paula"]],
  SLAV: [["Aleksandr", "Dmitri", "Maksim", "Ivan"], ["Anastasia", "Sofia", "Maria", "Daria"]],
  PL: [["Jakub", "Antoni", "Jan", "Szymon"], ["Zuzanna", "Julia", "Zofia", "Hanna"]],
  NILE: [["Deng", "Garang", "Majok", "Akol"], ["Nyandeng", "Achol", "Abuk", "Ayen"]],
  WAFEN: [["Mohamed", "Abu", "Emmanuel", "Joseph", "Alhaji"], ["Fatmata", "Mariama", "Aminata", "Hawa", "Isatu"]],
  CASIA: [["Arslan", "Timur", "Rustam", "Daniyar", "Alisher"], ["Aigerim", "Madina", "Dilnoza", "Aruzhan", "Zarina"]],
  CAUC: [["Davit", "Giorgi", "Aram", "Levan", "Tigran"], ["Nino", "Ani", "Mariam", "Tamar", "Lilit"]],
  WSLAV: [["Jakub", "Tomáš", "Jan", "Lukáš"], ["Tereza", "Eliška", "Anna", "Natálie"]],
  BALK: [["Luka", "Stefan", "Marko", "Nikola", "Ivan"], ["Ana", "Milica", "Sara", "Elena", "Mia"]],
  ALB: [["Ardit", "Arben", "Enea", "Dren"], ["Ariana", "Elira", "Jona", "Era"]],
  RO: [["Andrei", "David", "Alexandru", "Ștefan"], ["Maria", "Elena", "Ioana", "Sofia"]],
  HU: [["Bence", "Máté", "Levente", "Dominik"], ["Hanna", "Anna", "Jázmin", "Zoé"]],
  GR: [["Giorgos", "Dimitris", "Nikos", "Kostas"], ["Maria", "Eleni", "Katerina", "Sofia"]],
  NL: [["Daan", "Sem", "Lucas", "Finn"], ["Emma", "Julia", "Tess", "Sophie"]],
  NORD: [["Lucas", "William", "Oskar", "Elias", "Mikael"], ["Alice", "Maja", "Ella", "Saga", "Aino"]],
  BALT: [["Jonas", "Mantas", "Kristaps", "Martin"], ["Emilija", "Sofija", "Anna", "Laura"]],
  PACIFIC: [["Sione", "Tevita", "Joseph", "John", "Josaia"], ["Mele", "Ana", "Mary", "Losana", "Grace"]],
  LK: [["Kasun", "Nuwan", "Tharindu", "Dilshan"], ["Nimali", "Sanduni", "Ishara", "Tharushi"]],
  MN: [["Bat-Erdene", "Temuulen", "Ganbaatar", "Tömör"], ["Anu", "Solongo", "Enkhjin", "Nomin"]],
  MALAY: [["Muhammad", "Ahmad", "Amir", "Hafiz"], ["Nur", "Aisyah", "Siti", "Aina"]],
  KH: [["Dara", "Sokha", "Vibol", "Rithy"], ["Sreymom", "Bopha", "Chanthou", "Sophea"]],
  IL: [["David", "Noam", "Ariel", "Yosef"], ["Noa", "Tamar", "Maya", "Yael"]],
  CARIB: [["Andre", "Jermaine", "Kevin", "Marlon"], ["Shanice", "Tanisha", "Kimberly", "Alicia"]],
};
const NAME_GROUP_OF = {
  TZ: "EAF", KE: "EAF", UG: "EAF", RW: "EAF", BI: "EAF", SS: "NILE", AO: "LUSO", MZ: "LUSO", CV: "LUSO", GW: "LUSO", ST: "LUSO", TL: "LUSO", PT: "LUSO",
  NE: "SAHEL", ML: "SAHEL", BF: "SAHEL", TD: "SAHEL", SN: "SAHEL", GN: "SAHEL", MR: "SAHEL",
  CI: "WAF", CM: "WAF", BJ: "WAF", TG: "WAF", GA: "WAF", CG: "WAF", CF: "WAF", GQ: "HISP",
  LR: "WAFEN", SL: "WAFEN", GM: "WAFEN", ZM: "ZA", MW: "ZA", ZW: "ZA", BW: "ZA", NA: "ZA", LS: "ZA", SZ: "ZA", ER: "ET",
  SO: "HORN", SD: "HORN", DJ: "HORN",
  EG: "ARAB", IQ: "ARAB", YE: "ARAB", DZ: "ARAB", MA: "ARAB", SA: "ARAB", TN: "ARAB", LY: "ARAB", JO: "ARAB", SY: "ARAB", LB: "ARAB", PS: "ARAB",
  KW: "ARAB", QA: "ARAB", AE: "ARAB", BH: "ARAB", OM: "ARAB", KM: "ARAB", MV: "ARAB", TJ: "IR",
  KZ: "CASIA", UZ: "CASIA", TM: "CASIA", KG: "CASIA", AZ: "CASIA", AM: "CAUC", GE: "CAUC",
  RU: "SLAV", UA: "SLAV", BY: "SLAV", CZ: "WSLAV", SK: "WSLAV", RS: "BALK", HR: "BALK", BA: "BALK", ME: "BALK", MK: "BALK", SI: "BALK", BG: "BALK",
  AL: "ALB", XK: "ALB", RO: "RO", MD: "RO", HU: "HU", GR: "GR", CY: "GR", SM: "IT", AD: "ES",
  AT: "DE", CH: "DE", LI: "DE", LU: "FR", BE: "FR", MC: "FR", NL: "NL", SE: "NORD", NO: "NORD", DK: "NORD", FI: "NORD", IS: "NORD", FO: "NORD", GL: "NORD",
  LT: "BALT", LV: "BALT", EE: "BALT",
  US: "ANGLO", GB: "ANGLO", CA: "ANGLO", AU: "ANGLO", NZ: "ANGLO", IE: "ANGLO", IM: "ANGLO", GI: "ANGLO", BM: "ANGLO",
  JM: "CARIB", TT: "CARIB", BB: "CARIB", BS: "CARIB", BZ: "CARIB", GY: "CARIB", LC: "CARIB", VC: "CARIB", GD: "CARIB", AG: "CARIB", DM: "CARIB", KN: "CARIB",
  KY: "CARIB", VG: "CARIB", VI: "CARIB", TC: "CARIB", SX: "CARIB", CW: "CARIB", AW: "CARIB",
  PG: "PACIFIC", FJ: "PACIFIC", SB: "PACIFIC", VU: "PACIFIC", WS: "PACIFIC", TO: "PACIFIC", KI: "PACIFIC", FM: "PACIFIC", MH: "PACIFIC",
  NR: "PACIFIC", PW: "PACIFIC", TV: "PACIFIC", GU: "PACIFIC", AS: "PACIFIC", MP: "PACIFIC", PF: "FR", NC: "FR", MF: "FR",
  MX: "HISP", PE: "HISP", CO: "HISP", VE: "HISP", AR: "HISP", CL: "HISP", EC: "HISP", BO: "HISP", PY: "HISP", UY: "HISP", GT: "HISP", HN: "HISP",
  SV: "HISP", NI: "HISP", CR: "HISP", PA: "HISP", CU: "HISP", DO: "HISP", PR: "HISP", SR: "NL",
  LK: "LK", BT: "NP", MN: "MN", HK: "CN", MO: "CN", TW: "CN", SG: "CN", KP: "KR", MY: "MALAY", BN: "MALAY", LA: "TH", KH: "KH", IL: "IL",
};
// Langue la plus probable, à défaut, d'après la région.
const NAME_GROUP_OF_REGION = { SAS: "IN", EAS: "ID", SSA: "WAF", MENA: "ARAB", LAT: "HISP", EUR: "ANGLO", NAM: "ANGLO", OCE: "PACIFIC" };
function namesFor(code) {
  return NAME_GROUPS[code] || NAME_GROUPS[NAME_GROUP_OF[code]] || NAME_GROUPS[NAME_GROUP_OF_REGION[BY_CODE[code].region]] || NAME_GROUPS.ANGLO;
}

// Profils simplifiés des causes de décès par grande région et tranche d'âge
// (inspirés des estimations sanitaires mondiales de l'OMS). Poids relatifs.
const CAUSES = {
  infant: {
    base: { "complications à la naissance": 45, "infection respiratoire": 18, "maladie diarrhéique": 12, "malformation congénitale": 12, "méningite ou septicémie": 8 },
    SSA: { "paludisme": 22, "malnutrition": 8 },
    SAS: { "malnutrition": 6 },
  },
  young: {
    base: { "accident de la route": 30, "noyade": 6, "maladie infectieuse": 10, "cancer": 8, "suicide": 10, "homicide": 0 },
    SSA: { "VIH/sida": 18, "paludisme": 10, "tuberculose": 8 },
    SAS: { "tuberculose": 8 },
    LAT: {},
    EUR: { "surdose": 6 },
    NAM: { "surdose": 14 },
  },
  adult: {
    base: { "maladie cardiaque": 26, "cancer": 22, "AVC": 12, "accident de la route": 6, "cirrhose du foie": 5, "diabète": 5, "suicide": 4, "homicide": 0 },
    SSA: { "VIH/sida": 14, "tuberculose": 8, "paludisme": 4 },
    SAS: { "tuberculose": 6, "maladie respiratoire chronique": 6 },
    EAS: { "maladie respiratoire chronique": 5 },
    EUR: {}, NAM: { "surdose": 4 },
  },
  old: {
    base: { "maladie cardiaque": 30, "AVC": 16, "cancer": 18, "maladie respiratoire chronique": 8, "maladie d’Alzheimer": 8, "pneumonie": 7, "diabète": 5, "maladie rénale": 4, "s’est éteint·e de vieillesse": 4 },
    SSA: { "infection": 6 },
    SAS: { "maladie respiratoire chronique": 6 },
    EAS: { "AVC": 8 },
  },
};

// Pays de destination possibles pour l'émigration, par région d'origine.
const EMIGRATION = {
  SAS: ["AE", "SA", "US", "GB", "CA", "QA", "KW", "AU"], SSA: ["FR", "ZA", "US", "GB", "IT", "BE", "CA", "DE"],
  MENA: ["FR", "DE", "SA", "AE", "ES", "IT", "QA", "TR"], LAT: ["US", "ES", "AR", "CL", "CA", "IT"],
  EAS: ["JP", "KR", "US", "CA", "AU", "SG", "TW"], EUR: ["DE", "GB", "FR", "US", "CH", "NL", "SE", "CA"],
  NAM: ["CA", "US", "GB", "AU"], OCE: ["AU", "NZ", "US"],
};

// --- Époques ----------------------------------------------------------------
const MIN_YEAR = 1900, MAX_YEAR = 2100;

// --- Événements historiques ----------------------------------------------------
// Guerres, famines, épidémies et crises qui ont touché les pays de la simulation.
// excess : probabilité de décès supplémentaire par an (toute la population) ;
// old : supplément pour les 65 ans et plus ; draft : part des hommes de 18 à 40 ans
// mobilisés ; soldier : risque annuel supplémentaire pour eux ; econ : effet sur
// les revenus ; infl : inflation annuelle (%) qui ronge l'argent liquide et l'épargne ;
// happy : effet annuel sur le bonheur. Valeurs approchées.
// Un événement touche les pays listés dans c (ou tous si world) ; « all » donne
// les valeurs communes, complétées pays par pays.
const HISTORY = [
  { id: "ww1", from: 1914, to: 1918, name: "la Première Guerre mondiale", text: "La Première Guerre mondiale éclate.", cause: "guerre", soldierCause: "mort au front",
    c: { AT: { excess: 0.003, draft: 0.55, soldier: 0.03 }, HU: { excess: 0.003, draft: 0.55, soldier: 0.03 }, CZ: { draft: 0.4, soldier: 0.03 }, SK: { draft: 0.4, soldier: 0.03 }, HR: { draft: 0.4, soldier: 0.03 }, SI: { draft: 0.4, soldier: 0.03 }, BA: { draft: 0.4, soldier: 0.03 }, BE: { excess: 0.002, draft: 0.2, soldier: 0.02 }, RS: { excess: 0.03, draft: 0.5, soldier: 0.05 }, RO: { from: 1916, excess: 0.01, draft: 0.4, soldier: 0.03 }, BG: { from: 1915, draft: 0.4, soldier: 0.02 }, AU: { draft: 0.3, soldier: 0.015 }, NZ: { draft: 0.3, soldier: 0.015 }, PT: { from: 1916, draft: 0.1, soldier: 0.01 }, GR: { from: 1917, draft: 0.2, soldier: 0.01 }, BY: { excess: 0.004, draft: 0.4, soldier: 0.03 }, LT: { excess: 0.003 }, LV: { excess: 0.003 }, FR: { excess: 0.002, draft: 0.6, soldier: 0.04 }, DE: { excess: 0.003, draft: 0.6, soldier: 0.035 }, GB: { excess: 0.001, draft: 0.45, soldier: 0.025 }, IT: { excess: 0.002, draft: 0.5, soldier: 0.03 },
      RU: { excess: 0.004, draft: 0.4, soldier: 0.03 }, UA: { excess: 0.004, draft: 0.4, soldier: 0.03 }, PL: { excess: 0.004, draft: 0.3, soldier: 0.03 }, TR: { excess: 0.02, draft: 0.4, soldier: 0.05 },
      CA: { draft: 0.3, soldier: 0.02 }, US: { from: 1917, draft: 0.2, soldier: 0.01 } }, happy: -3 },
  { id: "flu", from: 1918, to: 1920, name: "la grippe espagnole", text: "La grippe espagnole fait le tour du monde.", cause: "grippe espagnole", world: true, all: { excess: 0.008 },
    c: { IN: { excess: 0.025 }, BD: { excess: 0.025 }, PK: { excess: 0.025 }, ID: { excess: 0.015 }, IR: { excess: 0.03 } }, happy: -2 },
  { id: "rusciv", from: 1917, to: 1922, name: "la guerre civile russe", text: "Révolution, puis guerre civile : le pays se déchire.", cause: "guerre civile", c: { RU: { excess: 0.012, draft: 0.2, soldier: 0.03 }, UA: { excess: 0.015, draft: 0.2, soldier: 0.03 } }, happy: -5 },
  { id: "mexrev", from: 1910, to: 1920, name: "la révolution mexicaine", text: "La révolution mexicaine embrase le pays.", cause: "guerre civile", c: { MX: { excess: 0.006, draft: 0.15, soldier: 0.02 } }, happy: -3 },
  { id: "crash", from: 1929, to: 1934, name: "la Grande Dépression", text: "La Grande Dépression : les usines ferment, le chômage explose.", c: { AU: {}, NZ: {}, NL: {}, BE: {}, AT: {}, CL: {}, UY: {}, SE: {}, DK: {}, NO: {}, CU: {}, US: {}, CA: {}, DE: {}, GB: {}, FR: {}, AR: {}, BR: {}, MX: {}, PL: {}, IT: {}, ES: {}, JP: {} }, all: { econ: 0.75 }, jobLoss: 0.12, happy: -4 },
  { id: "holodomor", from: 1932, to: 1933, name: "la grande famine", text: "Une famine organisée ravage les campagnes.", cause: "famine", c: { UA: { excess: 0.06 }, RU: { excess: 0.006 } }, happy: -10 },
  { id: "spain", from: 1936, to: 1939, name: "la guerre d’Espagne", text: "La guerre civile éclate en Espagne.", cause: "guerre civile", c: { ES: { excess: 0.004, draft: 0.4, soldier: 0.03 } }, happy: -6 },
  { id: "sinojap", from: 1937, to: 1945, name: "la guerre sino-japonaise", text: "Le Japon envahit la Chine : des années de guerre commencent.", cause: "guerre", c: { CN: { excess: 0.006, draft: 0.15, soldier: 0.04 } }, happy: -5 },
  { id: "ww2", from: 1939, to: 1945, name: "la Seconde Guerre mondiale", text: "La Seconde Guerre mondiale commence.", cause: "guerre", soldierCause: "mort au combat",
    c: { NL: { from: 1940, excess: 0.004 }, BE: { from: 1940, excess: 0.002, draft: 0.1, soldier: 0.01 }, LU: { from: 1940, excess: 0.002 }, GR: { from: 1940, excess: 0.012 }, RS: { from: 1941, excess: 0.015 }, BA: { from: 1941, excess: 0.015 }, HR: { from: 1941, excess: 0.012 }, ME: { from: 1941, excess: 0.012 }, SI: { from: 1941, excess: 0.01 }, MK: { from: 1941, excess: 0.008 }, CZ: { excess: 0.004 }, SK: { excess: 0.002 }, HU: { from: 1941, excess: 0.006, draft: 0.3, soldier: 0.03 }, RO: { from: 1941, excess: 0.004, draft: 0.4, soldier: 0.03 }, BG: { from: 1941, excess: 0.001 }, LT: { from: 1940, excess: 0.015 }, LV: { from: 1940, excess: 0.015 }, EE: { from: 1940, excess: 0.012 }, BY: { from: 1941, excess: 0.04, draft: 0.3, soldier: 0.06 }, AT: { excess: 0.004, draft: 0.6, soldier: 0.05 }, NO: { from: 1940, excess: 0.001 }, DK: { from: 1940, excess: 0.0005 }, FI: { excess: 0.002, draft: 0.5, soldier: 0.02 }, AU: { draft: 0.35, soldier: 0.01 }, NZ: { draft: 0.4, soldier: 0.012 }, IN: { draft: 0.02, soldier: 0.01 }, MY: { from: 1941, excess: 0.01 }, SG: { from: 1942, excess: 0.01 }, HK: { from: 1941, excess: 0.01 }, TH: { from: 1941, excess: 0.001 }, PG: { from: 1942, excess: 0.005 }, KP: { from: 1941, excess: 0.003, draft: 0.1, soldier: 0.02 }, TW: { from: 1941, excess: 0.002 }, TL: { from: 1942, excess: 0.02 }, PL: { excess: 0.028, draft: 0.2, soldier: 0.04 }, UA: { from: 1941, excess: 0.03, draft: 0.5, soldier: 0.07 }, RU: { from: 1941, excess: 0.015, draft: 0.6, soldier: 0.08 }, DE: { excess: 0.006, draft: 0.65, soldier: 0.06 },
      FR: { excess: 0.002, draft: 0.35, soldier: 0.015 }, GB: { excess: 0.001, draft: 0.45, soldier: 0.012 }, IT: { from: 1940, excess: 0.003, draft: 0.45, soldier: 0.02 }, JP: { from: 1941, excess: 0.007, draft: 0.55, soldier: 0.05 },
      US: { from: 1941, draft: 0.4, soldier: 0.008 }, CA: { draft: 0.35, soldier: 0.008 }, PH: { from: 1941, excess: 0.012 }, ID: { from: 1942, excess: 0.012 }, MM: { from: 1942, excess: 0.008 }, KR: { from: 1941, excess: 0.003, draft: 0.1, soldier: 0.02 },
      VN: { from: 1944, excess: 0.02 }, ES: { excess: 0.0005 } }, happy: -6 },
  { id: "bengal", from: 1943, to: 1944, name: "la famine du Bengale", text: "La famine du Bengale : le riz manque, les prix flambent.", cause: "famine", c: { BD: { excess: 0.05 }, IN: { excess: 0.002 } }, happy: -10 },
  { id: "partition", from: 1947, to: 1948, name: "la Partition", text: "La Partition de l’Inde jette des millions de personnes sur les routes.", cause: "violences de la Partition", c: { IN: { excess: 0.001 }, PK: { excess: 0.004 }, BD: { excess: 0.002 } }, happy: -5 },
  { id: "chinaciv", from: 1946, to: 1949, name: "la guerre civile chinoise", text: "La guerre civile reprend en Chine.", cause: "guerre civile", c: { CN: { excess: 0.003, draft: 0.1, soldier: 0.03 } }, happy: -4 },
  { id: "indochine", from: 1946, to: 1954, name: "la guerre d’Indochine", text: "La guerre d’Indochine commence.", cause: "guerre", c: { VN: { excess: 0.003, draft: 0.15, soldier: 0.02 } }, happy: -4 },
  { id: "korea", from: 1950, to: 1953, name: "la guerre de Corée", text: "La guerre de Corée éclate.", cause: "guerre", c: { KP: { excess: 0.03, draft: 0.5, soldier: 0.05 }, KR: { excess: 0.02, draft: 0.5, soldier: 0.04 } }, happy: -8 },
  { id: "algeria", from: 1954, to: 1962, name: "la guerre d’Algérie", text: "La guerre d’Algérie commence.", cause: "guerre", c: { DZ: { excess: 0.005, draft: 0.1, soldier: 0.02 }, FR: { draft: 0.25, soldier: 0.002 } }, happy: -4 },
  { id: "vietnam", from: 1955, to: 1975, name: "la guerre du Vietnam", text: "Le pays est coupé en deux ; la guerre s’installe.", cause: "guerre", c: { KH: { from: 1965, to: 1973, excess: 0.002 }, LA: { from: 1964, to: 1973, excess: 0.002 }, VN: { excess: 0.004, draft: 0.4, soldier: 0.02 }, US: { from: 1965, to: 1973, draft: 0.08, soldier: 0.005 } }, happy: -5 },
  { id: "leap", from: 1959, to: 1961, name: "la grande famine chinoise", text: "Le « Grand Bond en avant » tourne à la famine.", cause: "famine", c: { CN: { excess: 0.014 } }, happy: -10 },
  { id: "cultrev", from: 1966, to: 1976, name: "la Révolution culturelle", text: "La Révolution culturelle commence : écoles fermées, familles séparées.", cause: "violences politiques", c: { CN: { excess: 0.0005 } }, school: -0.3, happy: -3 },
  { id: "biafra", from: 1967, to: 1970, name: "la guerre du Biafra", text: "La guerre du Biafra éclate.", cause: "guerre", c: { NG: { excess: 0.005, draft: 0.05, soldier: 0.03 } }, happy: -6 },
  { id: "bdwar", from: 1971, to: 1971, name: "la guerre de libération", text: "La guerre d’indépendance du Bangladesh.", cause: "guerre", c: { BD: { excess: 0.01 } }, happy: -8 },
  { id: "apartheid", from: 1948, to: 1994, name: "l’apartheid", text: "Le régime de l’apartheid organise la ségrégation.", c: { ZA: {} }, happy: -2 },
  { id: "angola", from: 1975, to: 2002, name: "la guerre civile angolaise", text: "La guerre civile s’installe en Angola.", cause: "guerre civile", c: { AO: { excess: 0.003, draft: 0.2, soldier: 0.01 } }, happy: -4 },
  { id: "mozamb", from: 1977, to: 1992, name: "la guerre civile du Mozambique", text: "La guerre civile s’installe au Mozambique.", cause: "guerre civile", c: { MZ: { excess: 0.005 } }, happy: -4 },
  { id: "afghan", from: 1979, to: 2021, name: "les guerres d’Afghanistan", text: "L’invasion soviétique ouvre des décennies de guerre.", cause: "guerre", c: { AF: { excess: 0.004, draft: 0.1, soldier: 0.02 } }, happy: -4 },
  { id: "iraniraq", from: 1980, to: 1988, name: "la guerre Iran-Irak", text: "La guerre entre l’Iran et l’Irak éclate.", cause: "guerre", c: { IR: { excess: 0.001, draft: 0.4, soldier: 0.015 }, IQ: { excess: 0.002, draft: 0.4, soldier: 0.02 } }, happy: -5 },
  { id: "ethfam", from: 1983, to: 1985, name: "la famine en Éthiopie", text: "Sécheresse et guerre : la famine frappe l’Éthiopie.", cause: "famine", c: { ET: { excess: 0.006 } }, happy: -8 },
  { id: "ussr", from: 1991, to: 1998, infl: 300, name: "l’effondrement de l’URSS", text: "L’URSS s’effondre : salaires impayés, épargne envolée.", c: { BY: { excess: 0.002 }, KZ: { excess: 0.002 }, UZ: {}, KG: {}, TJ: { excess: 0.004 }, TM: {}, AZ: { excess: 0.001 }, AM: { excess: 0.001 }, GE: { excess: 0.002 }, MD: {}, LT: {}, LV: {}, EE: {}, RU: { excess: 0.003 }, UA: { excess: 0.003 } }, all: { econ: 0.6 }, jobLoss: 0.1, cause: "maladie cardiaque", happy: -6 },
  { id: "somalia", from: 1991, to: 2012, name: "la guerre civile somalienne", text: "L’État s’effondre et la guerre civile commence.", cause: "guerre civile", c: { SO: { excess: 0.004 } }, happy: -5 },
  { id: "algciv", from: 1991, to: 2002, name: "la décennie noire", text: "La « décennie noire » commence en Algérie.", cause: "violences politiques", c: { DZ: { excess: 0.0008 } }, happy: -4 },
  { id: "congo", from: 1996, to: 2003, name: "les guerres du Congo", text: "La guerre ravage l’est du pays.", cause: "guerre", c: { CD: { excess: 0.012 } }, happy: -6 },
  { id: "asia97", from: 1997, to: 1998, name: "la crise financière asiatique", text: "La crise financière asiatique fait chuter la monnaie.", c: { MY: {}, PH: {}, ID: {}, TH: {}, KR: {} }, all: { econ: 0.8 }, jobLoss: 0.08, happy: -3 },
  { id: "darfur", from: 2003, to: 2008, name: "la guerre du Darfour", text: "La guerre du Darfour éclate.", cause: "guerre", c: { SD: { excess: 0.003 } }, happy: -5 },
  { id: "iraq", from: 2003, to: 2011, name: "la guerre d’Irak", text: "Le pays est envahi ; des années de violence suivent.", cause: "guerre", c: { IQ: { excess: 0.002 } }, happy: -5 },
  { id: "gfc", from: 2008, to: 2010, name: "la Grande Récession", text: "La crise financière de 2008 frappe l’économie.", c: { IE: {}, PT: {}, GR: {}, IS: {}, LV: {}, LT: {}, EE: {}, HU: {}, AT: {}, NL: {}, BE: {}, SE: {}, DK: {}, FI: {}, AU: {}, NZ: {}, KR: {}, US: {}, GB: {}, ES: {}, IT: {}, FR: {}, DE: {}, CA: {}, JP: {}, MX: {}, PL: {} }, all: { econ: 0.92 }, jobLoss: 0.05, happy: -2 },
  { id: "haiti", from: 2010, to: 2010, name: "le séisme", text: "Un séisme dévaste Port-au-Prince.", cause: "séisme", c: { HT: { excess: 0.02 } }, happy: -8 },
  { id: "venez", from: 2014, to: 2024, name: "la crise vénézuélienne", text: "L’économie s’effondre ; beaucoup partent.", c: { VE: { excess: 0.001 } }, all: { econ: 0.6, infl: 400 }, jobLoss: 0.06, happy: -5, emigrate: 3 },
  { id: "yemen", from: 2015, to: 2024, name: "la guerre au Yémen", text: "La guerre éclate au Yémen.", cause: "guerre", c: { YE: { excess: 0.004 } }, happy: -6 },
  { id: "covid", from: 2020, to: 2021, name: "la pandémie de Covid-19", text: "La pandémie de Covid-19 : confinements, écoles fermées.", cause: "Covid-19", world: true, all: { excess: 0.0002, old: 0.008 }, happy: -2 },
  { id: "myanmar", from: 2021, to: 2025, name: "la guerre civile birmane", text: "Un coup d’État plonge le pays dans la guerre civile.", cause: "guerre civile", c: { MM: { excess: 0.001 } }, happy: -5 },
  { id: "ukraine", from: 2022, to: 2025, name: "la guerre en Ukraine", text: "La Russie envahit l’Ukraine.", cause: "guerre", soldierCause: "mort au front", c: { UA: { excess: 0.003, draft: 0.15, soldier: 0.04 }, RU: { draft: 0.03, soldier: 0.06 } }, happy: -6 },
  { id: "sudan", from: 2023, to: 2025, name: "la guerre au Soudan", text: "La guerre éclate entre l’armée et les paramilitaires.", cause: "guerre", c: { SD: { excess: 0.004 } }, happy: -6 },
  { id: "finciv", from: 1918, to: 1918, name: "la guerre civile finlandaise", text: "La guerre civile éclate en Finlande.", cause: "guerre civile", c: { FI: { excess: 0.01 } }, happy: -6 },
  { id: "volga", from: 1921, to: 1922, name: "la famine de 1921", text: "Après la guerre civile, la famine frappe la Volga et l’Ukraine.", cause: "famine", c: { RU: { excess: 0.02 }, UA: { excess: 0.015 }, KZ: { excess: 0.02 } }, happy: -8 },
  { id: "weimar", from: 1922, to: 1923, name: "l’hyperinflation allemande", text: "Hyperinflation : la monnaie ne vaut plus rien, l’épargne est anéantie.", c: { DE: {}, AT: { from: 1921, to: 1922 } }, all: { econ: 0.75, infl: 100000 }, jobLoss: 0.08, happy: -6 },
  { id: "kazfam", from: 1930, to: 1933, name: "la famine kazakhe", text: "La collectivisation forcée provoque une famine dans les steppes.", cause: "famine", c: { KZ: { excess: 0.08 } }, happy: -10 },
  { id: "chaco", from: 1932, to: 1935, name: "la guerre du Chaco", text: "La guerre du Chaco oppose la Bolivie et le Paraguay.", cause: "guerre", c: { BO: { draft: 0.3, soldier: 0.03 }, PY: { draft: 0.3, soldier: 0.02 } }, happy: -4 },
  { id: "purges", from: 1937, to: 1938, name: "la Grande Terreur", text: "Les purges staliniennes : arrestations, déportations.", cause: "répression politique", c: { RU: { excess: 0.003 }, UA: { excess: 0.003 }, BY: { excess: 0.003 }, GE: { excess: 0.002 } }, happy: -5 },
  { id: "hung45", from: 1945, to: 1946, name: "l’hyperinflation hongroise", text: "Record mondial d’hyperinflation : les prix doublent chaque jour.", c: { HU: {} }, all: { econ: 0.6, infl: 1000000 }, happy: -6 },
  { id: "greekciv", from: 1946, to: 1949, name: "la guerre civile grecque", text: "La guerre civile éclate en Grèce.", cause: "guerre civile", c: { GR: { excess: 0.003, draft: 0.2, soldier: 0.01 } }, happy: -5 },
  { id: "war48", from: 1948, to: 1949, name: "la guerre de 1948", text: "Guerre de 1948 : des centaines de milliers de Palestiniens sont déplacés.", cause: "guerre", c: { IL: { draft: 0.3, soldier: 0.01 }, PS: { excess: 0.005 }, JO: {}, EG: { draft: 0.02, soldier: 0.01 } }, happy: -6 },
  { id: "indep_id", from: 1945, to: 1949, name: "la guerre d’indépendance indonésienne", text: "La guerre d’indépendance contre les Pays-Bas.", cause: "guerre", c: { ID: { excess: 0.002 } }, happy: -3 },
  { id: "violencia", from: 1948, to: 1958, name: "la Violencia", text: "La « Violencia » ensanglante les campagnes colombiennes.", cause: "violences politiques", c: { CO: { excess: 0.002 } }, happy: -4 },
  { id: "congo60", from: 1960, to: 1965, name: "la crise congolaise", text: "Indépendance, sécessions et guerre civile.", cause: "guerre civile", c: { CD: { excess: 0.002 } }, happy: -5 },
  { id: "id65", from: 1965, to: 1966, name: "les massacres de 1965", text: "Après une tentative de coup d’État, des violences politiques de masse.", cause: "violences politiques", c: { ID: { excess: 0.002 } }, happy: -5 },
  { id: "sahel", from: 1972, to: 1974, name: "la grande sécheresse du Sahel", text: "La sécheresse détruit les récoltes et les troupeaux.", cause: "famine", c: { NE: { excess: 0.004 }, ML: { excess: 0.004 }, TD: { excess: 0.004 }, BF: { excess: 0.003 }, MR: { excess: 0.004 }, ET: { excess: 0.004 } }, happy: -6 },
  { id: "bdfam", from: 1974, to: 1974, name: "la famine de 1974", text: "Inondations et famine au Bangladesh.", cause: "famine", c: { BD: { excess: 0.01 } }, happy: -8 },
  { id: "chile", from: 1973, to: 1990, name: "la dictature militaire", text: "Coup d’État : une dictature militaire prend le pouvoir.", cause: "répression politique", c: { CL: { excess: 0.0001 }, AR: { from: 1976, to: 1983, excess: 0.0002 }, UY: { to: 1985 } }, happy: -3 },
  { id: "khmer", from: 1975, to: 1979, name: "le régime khmer rouge", text: "Les Khmers rouges prennent le pouvoir : villes vidées, travaux forcés.", cause: "violences politiques", c: { KH: { excess: 0.06 } }, happy: -12 },
  { id: "lebanon", from: 1975, to: 1990, name: "la guerre du Liban", text: "La guerre civile éclate au Liban.", cause: "guerre civile", c: { LB: { excess: 0.003 } }, happy: -5 },
  { id: "eritrea", from: 1961, to: 1991, name: "la guerre d’indépendance de l’Érythrée", text: "La lutte pour l’indépendance de l’Érythrée.", cause: "guerre", c: { ER: { excess: 0.003, draft: 0.2, soldier: 0.02 }, ET: { from: 1974, excess: 0.002 } }, happy: -4 },
  { id: "ugandaw", from: 1971, to: 1986, name: "les années de dictature et de guerre", text: "Dictature puis guerre civile en Ouganda.", cause: "violences politiques", c: { UG: { excess: 0.003 } }, happy: -5 },
  { id: "centram", from: 1979, to: 1992, name: "les guerres d’Amérique centrale", text: "Guerre civile et violences politiques.", cause: "guerre civile", c: { SV: { excess: 0.004 }, NI: { from: 1978, to: 1990, excess: 0.003 }, GT: { from: 1960, to: 1996, excess: 0.002 } }, happy: -5 },
  { id: "srilanka", from: 1983, to: 2009, name: "la guerre civile srilankaise", text: "La guerre civile éclate au Sri Lanka.", cause: "guerre civile", c: { LK: { excess: 0.0008 } }, happy: -3 },
  { id: "latinhyper", from: 1985, to: 1994, name: "l’hyperinflation", text: "Hyperinflation : les prix s’envolent, l’épargne fond.", c: { BO: { to: 1986 }, BR: { from: 1986 }, PE: { from: 1988, to: 1991 }, AR: { from: 1989, to: 1990 }, NI: { from: 1987, to: 1991 } }, all: { econ: 0.85, infl: 2000 }, jobLoss: 0.06, happy: -5 },
  { id: "chernobyl", from: 1986, to: 1986, name: "la catastrophe de Tchernobyl", text: "Explosion à la centrale de Tchernobyl : des villages sont évacués.", c: { UA: {}, BY: {} }, happy: -2 },
  { id: "liberia", from: 1989, to: 2003, name: "les guerres civiles du Liberia", text: "La guerre civile éclate au Liberia.", cause: "guerre civile", c: { LR: { excess: 0.008 }, SL: { from: 1991, to: 2002, excess: 0.005 } }, happy: -7 },
  { id: "kuwait", from: 1990, to: 1991, name: "la guerre du Golfe", text: "L’Irak envahit le Koweït ; une coalition intervient.", cause: "guerre", c: { KW: { excess: 0.001 }, IQ: { excess: 0.002, draft: 0.3, soldier: 0.02 } }, happy: -5 },
  { id: "cuba91", from: 1991, to: 1995, name: "la « période spéciale »", text: "Sans l’aide soviétique, l’économie cubaine s’effondre : pénuries partout.", c: { CU: {} }, all: { econ: 0.65 }, happy: -5 },
  { id: "yugo", from: 1991, to: 1995, name: "les guerres de Yougoslavie", text: "La Yougoslavie éclate ; la guerre commence.", cause: "guerre", c: { BA: { from: 1992, excess: 0.008, draft: 0.3, soldier: 0.02 }, HR: { excess: 0.001, draft: 0.3, soldier: 0.01 }, RS: { excess: 0.0005, infl: 1000000, econ: 0.5 }, ME: { infl: 1000000, econ: 0.5 }, XK: { from: 1998, to: 1999, excess: 0.005 } }, happy: -7 },
  { id: "rwanda", from: 1994, to: 1994, name: "le génocide contre les Tutsi", text: "Le génocide contre les Tutsi : en cent jours, des centaines de milliers de morts.", cause: "génocide", c: { RW: { excess: 0.1 } }, happy: -15 },
  { id: "burundi", from: 1993, to: 2005, name: "la guerre civile burundaise", text: "La guerre civile éclate au Burundi.", cause: "guerre civile", c: { BI: { excess: 0.003 } }, happy: -5 },
  { id: "nkfam", from: 1994, to: 1998, name: "la grande famine nord-coréenne", text: "La famine frappe la Corée du Nord.", cause: "famine", c: { KP: { excess: 0.01 } }, happy: -10 },
  { id: "erieth", from: 1998, to: 2000, name: "la guerre Érythrée-Éthiopie", text: "La guerre éclate entre l’Érythrée et l’Éthiopie.", cause: "guerre", c: { ER: { draft: 0.4, soldier: 0.02 }, ET: { draft: 0.05, soldier: 0.02 } }, happy: -4 },
  { id: "arg01", from: 2001, to: 2002, name: "la crise argentine", text: "Le pays fait défaut ; les comptes en banque sont gelés (« corralito »).", c: { AR: {} }, all: { econ: 0.75, infl: 40 }, jobLoss: 0.1, happy: -6 },
  { id: "tsunami", from: 2004, to: 2004, name: "le tsunami de l’océan Indien", text: "Un tsunami ravage les côtes de l’océan Indien.", cause: "tsunami", c: { LK: { excess: 0.002 }, ID: { excess: 0.0007 }, TH: { excess: 0.0001 }, MV: { excess: 0.0003 } }, happy: -4 },
  { id: "zimb", from: 2007, to: 2009, name: "l’hyperinflation zimbabwéenne", text: "Hyperinflation : un billet de cent mille milliards de dollars.", c: { ZW: {} }, all: { econ: 0.5, infl: 1000000 }, jobLoss: 0.1, happy: -6 },
  { id: "greece", from: 2010, to: 2016, name: "la crise de la dette grecque", text: "La crise de la dette : salaires et retraites coupés.", c: { GR: {}, CY: { from: 2012, to: 2014 } }, all: { econ: 0.78 }, jobLoss: 0.08, happy: -4 },
  { id: "syria", from: 2011, to: 2024, name: "la guerre en Syrie", text: "La révolte devient guerre civile ; des millions de personnes fuient.", cause: "guerre", c: { SY: { excess: 0.006, draft: 0.2, soldier: 0.03, econ: 0.4 } }, happy: -8, emigrate: 4 },
  { id: "libya", from: 2011, to: 2020, name: "la guerre en Libye", text: "La guerre civile éclate en Libye.", cause: "guerre civile", c: { LY: { excess: 0.001 } }, happy: -5 },
  { id: "ssudan", from: 2013, to: 2020, name: "la guerre civile sud-soudanaise", text: "Deux ans après l’indépendance, la guerre civile éclate.", cause: "guerre civile", c: { SS: { excess: 0.006 }, CF: { to: 2016, excess: 0.004 } }, happy: -7 },
  { id: "ebola", from: 2014, to: 2015, name: "l’épidémie d’Ebola", text: "L’épidémie d’Ebola frappe l’Afrique de l’Ouest.", cause: "Ebola", c: { GN: { excess: 0.0002 }, LR: { excess: 0.0007 }, SL: { excess: 0.0005 } }, happy: -3 },
  { id: "isis", from: 2014, to: 2017, name: "la guerre contre l’État islamique", text: "L’État islamique s’empare d’une partie du pays.", cause: "guerre", c: { IQ: { excess: 0.002 }, SY: {} }, happy: -5 },
  { id: "sahelwar", from: 2012, to: 2025, name: "les violences armées au Sahel", text: "Des groupes armés s’étendent dans le Sahel.", cause: "violences armées", c: { ML: { excess: 0.0006 }, BF: { from: 2015, excess: 0.0008 }, NE: { from: 2015, excess: 0.0004 }, NG: { from: 2009, excess: 0.0003 } }, happy: -3 },
  { id: "somfam", from: 2011, to: 2011, name: "la famine de 2011", text: "Sécheresse et guerre : la famine frappe la Somalie.", cause: "famine", c: { SO: { excess: 0.02 } }, happy: -10 },
  { id: "turkinfl", from: 2018, to: 2024, name: "la crise de la livre turque", text: "La livre s’effondre ; l’inflation dépasse 50 %.", c: { TR: { infl: 45 }, AR: { infl: 90, econ: 0.9 }, IR: { infl: 40, econ: 0.85 }, LB: { from: 2019, infl: 150, econ: 0.6 }, EG: { from: 2022, infl: 30 }, NG: { from: 2023, infl: 25 } }, happy: -3 },
  { id: "tigray", from: 2020, to: 2022, name: "la guerre du Tigré", text: "La guerre éclate dans la région du Tigré.", cause: "guerre", c: { ET: { excess: 0.003 } }, happy: -5 },
  { id: "haitigangs", from: 2021, to: 2025, name: "la crise des gangs", text: "Les gangs prennent le contrôle de Port-au-Prince.", cause: "violences armées", c: { HT: { excess: 0.0006 } }, happy: -5 },
  { id: "gaza", from: 2023, to: 2025, name: "la guerre à Gaza", text: "La guerre ravage la bande de Gaza.", cause: "guerre", c: { PS: { excess: 0.02 }, IL: { excess: 0.0002, draft: 0.1, soldier: 0.003 } }, happy: -10 },
  // Projections : le climat se réchauffe (scénarios du GIEC), sans événements inventés.
  { id: "heat", from: 2035, to: 2100, name: "le réchauffement", text: "Les étés deviennent plus chauds qu’autrefois ; les canicules se multiplient.", cause: "coup de chaleur",
    c: { IN: { old: 0.002 }, PK: { old: 0.002 }, BD: { old: 0.002 }, NG: { old: 0.001 }, NE: { old: 0.002 }, ML: { old: 0.002 }, TD: { old: 0.002 }, SD: { old: 0.002 }, IQ: { old: 0.002 }, SA: { old: 0.001 }, EG: { old: 0.001 }, YE: { old: 0.001 } }, happy: -0.5 },
];

// Préposition devant le nom du pays : « en France », « au Mali », « aux États-Unis », « à Cuba ».
function inCountry(c) { return c.in; }
