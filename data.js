// Statistiques approximatives (vers 2023), arrondies à partir des données publiques
// de l'ONU (World Population Prospects), de la Banque mondiale, de l'OMS, de l'UNESCO,
// de l'ONUDC, de l'UNICEF et du World Happiness Report.
//
// Colonnes :
// code, nom, drapeau, région, naissances/an (milliers), population (millions),
// espérance de vie hommes, femmes, mortalité infantile (‰), PIB/hab. (PPA $),
// Gini, années de scolarité moyennes, accès au supérieur (%), homicides (/100 000),
// satisfaction de vie (0-10), fécondité (enfants/femme), mariage avant 18 ans (% des filles)
const COUNTRY_ROWS = [
  ["IN", "Inde", "🇮🇳", "SAS", 23000, 1430, 70, 73, 26, 9000, 33, 6.6, 31, 2.9, 4.0, 2.0, 23],
  ["CN", "Chine", "🇨🇳", "EAS", 9000, 1410, 75, 81, 5, 22000, 37, 8.1, 70, 0.5, 5.9, 1.0, 3],
  ["NG", "Nigeria", "🇳🇬", "SSA", 7800, 224, 53, 55, 70, 5800, 35, 7.2, 12, 10, 4.9, 5.1, 30],
  ["PK", "Pakistan", "🇵🇰", "SAS", 6900, 240, 65, 69, 52, 6300, 30, 4.5, 12, 4, 4.6, 3.4, 18],
  ["ID", "Indonésie", "🇮🇩", "EAS", 4500, 277, 69, 73, 17, 14000, 38, 8.6, 40, 0.4, 5.6, 2.1, 16],
  ["CD", "RD Congo", "🇨🇩", "SSA", 4300, 102, 58, 62, 62, 1300, 42, 7.1, 7, 13, 3.3, 6.1, 29],
  ["ET", "Éthiopie", "🇪🇹", "SSA", 3800, 126, 64, 68, 34, 2800, 35, 3.2, 10, 7.6, 4.1, 4.0, 40],
  ["US", "États-Unis", "🇺🇸", "NAM", 3600, 335, 75, 81, 5.4, 80000, 41, 13.6, 88, 6.4, 6.7, 1.6, 0],
  ["BD", "Bangladesh", "🇧🇩", "SAS", 3000, 172, 71, 75, 23, 8600, 32, 7.4, 23, 2.3, 4.3, 1.9, 51],
  ["BR", "Brésil", "🇧🇷", "LAT", 2500, 216, 72, 79, 13, 20000, 52, 8.3, 57, 21, 6.3, 1.6, 26],
  ["TZ", "Tanzanie", "🇹🇿", "SSA", 2300, 67, 64, 68, 33, 3000, 40, 6.4, 8, 6.5, 3.7, 4.6, 29],
  ["EG", "Égypte", "🇪🇬", "MENA", 2000, 112, 68, 73, 16, 16000, 32, 7.4, 37, 1.3, 4.2, 2.8, 17],
  ["MX", "Mexique", "🇲🇽", "LAT", 1800, 128, 72, 78, 11, 23000, 43, 9.2, 45, 25, 6.7, 1.8, 21],
  ["PH", "Philippines", "🇵🇭", "EAS", 1700, 117, 68, 74, 21, 11000, 41, 9.9, 35, 4.4, 6.0, 2.7, 15],
  ["UG", "Ouganda", "🇺🇬", "SSA", 1700, 49, 61, 66, 31, 2800, 43, 6.2, 5, 9, 4.4, 4.4, 34],
  ["AF", "Afghanistan", "🇦🇫", "SAS", 1500, 42, 60, 66, 43, 2000, 30, 2.5, 10, 6, 1.7, 4.6, 28],
  ["SD", "Soudan", "🇸🇩", "SSA", 1500, 48, 63, 68, 38, 3500, 34, 3.8, 17, 5, 4.0, 4.4, 34],
  ["KE", "Kenya", "🇰🇪", "SSA", 1500, 55, 60, 65, 30, 6000, 39, 6.7, 12, 5, 4.5, 3.3, 23],
  ["VN", "Vietnam", "🇻🇳", "EAS", 1400, 99, 70, 79, 16, 13000, 36, 8.4, 40, 1.5, 5.8, 1.9, 15],
  ["AO", "Angola", "🇦🇴", "SSA", 1300, 37, 59, 64, 46, 7000, 51, 5.4, 10, 4.8, 3.8, 5.1, 30],
  ["RU", "Russie", "🇷🇺", "EUR", 1300, 144, 66, 77, 4, 36000, 36, 12.8, 85, 6.8, 5.8, 1.4, 6],
  ["NE", "Niger", "🇳🇪", "SSA", 1200, 27, 61, 63, 61, 1500, 37, 2.1, 4, 4, 4.5, 6.7, 76],
  ["MZ", "Mozambique", "🇲🇿", "SSA", 1200, 34, 59, 65, 51, 1400, 54, 3.5, 7, 3.5, 5.2, 4.6, 53],
  ["IQ", "Irak", "🇮🇶", "MENA", 1200, 45, 69, 74, 21, 11000, 30, 7.3, 18, 9, 5.0, 3.4, 28],
  ["IR", "Iran", "🇮🇷", "MENA", 1100, 89, 72, 77, 11, 17000, 35, 10.6, 55, 2.5, 4.9, 1.7, 17],
  ["ZA", "Afrique du Sud", "🇿🇦", "SSA", 1100, 60, 60, 66, 25, 15000, 63, 11.4, 25, 42, 5.4, 2.3, 4],
  ["TR", "Turquie", "🇹🇷", "MENA", 1000, 86, 74, 80, 8, 41000, 42, 8.6, 90, 2.5, 5.0, 1.6, 15],
  ["CI", "Côte d’Ivoire", "🇨🇮", "SSA", 1000, 29, 57, 61, 52, 6500, 37, 5.3, 10, 9, 5.1, 4.3, 27],
  ["CM", "Cameroun", "🇨🇲", "SSA", 1000, 28, 60, 63, 46, 4400, 42, 6.3, 14, 1.4, 4.9, 4.4, 30],
  ["YE", "Yémen", "🇾🇪", "MENA", 1000, 34, 61, 66, 44, 2000, 37, 3.2, 10, 7, 3.6, 3.7, 32],
  ["MG", "Madagascar", "🇲🇬", "SSA", 950, 30, 63, 67, 36, 1800, 43, 5.1, 6, 2, 4.2, 3.8, 39],
  ["ML", "Mali", "🇲🇱", "SSA", 900, 23, 59, 61, 58, 2600, 36, 1.6, 5, 10, 4.2, 5.6, 54],
  ["MM", "Myanmar", "🇲🇲", "EAS", 900, 54, 64, 70, 34, 5000, 31, 6.4, 18, 3, 4.4, 2.1, 16],
  ["GH", "Ghana", "🇬🇭", "SSA", 880, 34, 62, 66, 33, 6500, 43, 7.4, 20, 2, 4.4, 3.5, 19],
  ["DZ", "Algérie", "🇩🇿", "MENA", 850, 45, 75, 78, 19, 13000, 28, 8.1, 55, 1.4, 5.3, 2.7, 4],
  ["BF", "Burkina Faso", "🇧🇫", "SSA", 760, 23, 59, 62, 51, 2500, 47, 2.1, 8, 1, 4.5, 4.7, 52],
  ["JP", "Japon", "🇯🇵", "EAS", 760, 124, 81, 87, 1.7, 46000, 33, 13.4, 65, 0.2, 6.1, 1.2, 0],
  ["TD", "Tchad", "🇹🇩", "SSA", 750, 18, 53, 56, 65, 1500, 37, 2.6, 3, 9, 4.4, 6.1, 61],
  ["SO", "Somalie", "🇸🇴", "SSA", 750, 18, 55, 59, 70, 1500, 37, 1.5, 3, 5, 4.7, 6.2, 45],
  ["DE", "Allemagne", "🇩🇪", "EUR", 690, 84, 79, 83.5, 3, 66000, 32, 14.1, 76, 0.9, 6.9, 1.4, 0],
  ["FR", "France", "🇫🇷", "EUR", 680, 68, 80, 85.7, 3.5, 58000, 31, 11.6, 70, 1.3, 6.6, 1.7, 0],
  ["GB", "Royaume-Uni", "🇬🇧", "EUR", 660, 68, 79, 83, 3.6, 55000, 33, 13.4, 70, 1.0, 6.7, 1.5, 0],
  ["MA", "Maroc", "🇲🇦", "MENA", 640, 37, 73, 77, 15, 9500, 39, 6.0, 45, 1.4, 4.9, 2.3, 14],
  ["SN", "Sénégal", "🇸🇳", "SSA", 560, 18, 67, 71, 29, 4300, 36, 3.2, 15, 0.3, 5.0, 4.3, 31],
  ["NP", "Népal", "🇳🇵", "SAS", 560, 31, 69, 72, 23, 4700, 33, 5.1, 15, 2, 5.2, 2.0, 35],
  ["SA", "Arabie saoudite", "🇸🇦", "MENA", 550, 36, 77, 80, 6, 60000, 45, 11.3, 70, 0.8, 6.5, 2.4, 3],
  ["PE", "Pérou", "🇵🇪", "LAT", 520, 34, 74, 79, 11, 15000, 40, 9.9, 70, 6, 5.8, 2.2, 14],
  ["CO", "Colombie", "🇨🇴", "LAT", 510, 52, 74, 80, 11, 20000, 52, 8.9, 55, 25, 5.7, 1.7, 23],
  ["TH", "Thaïlande", "🇹🇭", "EAS", 500, 72, 73, 80, 7, 21000, 35, 8.7, 45, 2.3, 6.0, 1.2, 20],
  ["VE", "Venezuela", "🇻🇪", "LAT", 480, 28, 69, 77, 21, 7000, 45, 10.3, 50, 20, 5.6, 2.2, 22],
  ["AR", "Argentine", "🇦🇷", "LAT", 460, 46, 74, 80, 6, 27000, 41, 11.1, 95, 4.6, 6.2, 1.9, 16],
  ["IT", "Italie", "🇮🇹", "EUR", 380, 59, 81, 85, 2.3, 55000, 35, 10.7, 65, 0.5, 6.4, 1.2, 0],
  ["CA", "Canada", "🇨🇦", "NAM", 350, 39, 80, 84, 4.4, 58000, 32, 13.8, 78, 2.3, 6.9, 1.4, 0],
  ["ES", "Espagne", "🇪🇸", "EUR", 320, 48, 81, 86, 2.6, 49000, 34, 10.6, 95, 0.6, 6.4, 1.2, 0],
  ["HT", "Haïti", "🇭🇹", "LAT", 270, 11.7, 62, 67, 47, 3000, 41, 5.6, 2, 13, 3.6, 2.8, 15],
  ["PL", "Pologne", "🇵🇱", "EUR", 270, 37, 75, 82, 4, 44000, 29, 12.6, 70, 0.7, 6.4, 1.2, 0],
  ["KR", "Corée du Sud", "🇰🇷", "EAS", 230, 51, 80, 86, 2.5, 50000, 33, 12.5, 100, 0.5, 6.0, 0.7, 0],
  ["UA", "Ukraine", "🇺🇦", "EUR", 200, 37, 64, 75, 7, 13000, 26, 11.1, 80, 4, 4.9, 1.0, 9],
];

const WORLD_BIRTHS_K = 132000;
const WORLD_POP_M = 8100;

const COUNTRIES = COUNTRY_ROWS.map(r => ({
  code: r[0], name: r[1], flag: r[2], region: r[3],
  births: r[4], pop: r[5], e0: { m: r[6], f: r[7] }, imr: r[8],
  gdp: r[9], gini: r[10], school: r[11], tert: r[12], hom: r[13],
  happy: r[14], tfr: r[15], cm: r[16],
}));
const BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));

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
};
const NAME_GROUP_OF = {
  TZ: "EAF", KE: "EAF", UG: "EAF", AO: "LUSO", MZ: "LUSO",
  NE: "SAHEL", ML: "SAHEL", BF: "SAHEL", TD: "SAHEL", SN: "SAHEL",
  CI: "WAF", CM: "WAF", SO: "HORN", SD: "HORN",
  EG: "ARAB", IQ: "ARAB", YE: "ARAB", DZ: "ARAB", MA: "ARAB", SA: "ARAB",
  MX: "HISP", PE: "HISP", CO: "HISP", VE: "HISP", AR: "HISP",
  US: "ANGLO", GB: "ANGLO", CA: "ANGLO", RU: "SLAV", UA: "SLAV",
};
function namesFor(code) {
  return NAME_GROUPS[code] || NAME_GROUPS[NAME_GROUP_OF[code]] || NAME_GROUPS.ANGLO;
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
  SAS: ["SA", "US", "GB", "CA"], SSA: ["FR", "ZA", "US", "GB"], MENA: ["FR", "DE", "SA", "ES"],
  LAT: ["US", "ES", "AR", "CA"], EAS: ["JP", "KR", "US", "CA"], EUR: ["DE", "GB", "FR", "PL"], NAM: ["CA", "US"],
};

// Préposition devant le nom du pays : « en France », « au Mali », « aux États-Unis », « à Haïti ».
const PREP_AU = new Set(["NG", "PK", "BD", "BR", "MX", "KE", "VN", "NE", "MZ", "YE", "CM", "ML", "MM", "GH", "BF", "TD", "JP", "GB", "MA", "SN", "NP", "PE", "VE", "CA", "SD"]);
const PREP_AUX = new Set(["US", "PH"]);
const PREP_A = new Set(["MG", "HT"]);
function inCountry(c) {
  const p = PREP_AUX.has(c.code) ? "aux" : PREP_AU.has(c.code) ? "au" : PREP_A.has(c.code) ? "à" : "en";
  return `${p} ${c.name}`;
}
