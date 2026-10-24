// Statistiques approximatives (vers 2023), arrondies à partir des données publiques
// de l'ONU (World Population Prospects), de la Banque mondiale, de l'OMS, de l'UNESCO,
// de l'ONUDC, de l'UNICEF et du World Happiness Report.
//
// Colonnes :
// code, nom, drapeau, région, naissances/an (milliers), population (millions),
// espérance de vie hommes, femmes, mortalité infantile (‰), PIB/hab. (PPA $),
// Gini, années de scolarité moyennes, accès au supérieur (%), homicides (/100 000),
// satisfaction de vie (0-10), fécondité (enfants/femme), mariage avant 18 ans (% des filles),
// mortalité maternelle (/100 000 naissances), VIH (% des 15-49 ans), tabac (% des adultes),
// reste à charge des soins (% des dépenses de santé), emploi agricole (% des emplois)
const COUNTRY_ROWS = [
  ["IN", "Inde", "🇮🇳", "SAS", 23000, 1430, 70, 73, 26, 9000, 33, 6.6, 31, 2.9, 4.0, 2.0, 23, 103, 0.2, 27, 50, 43],
  ["CN", "Chine", "🇨🇳", "EAS", 9000, 1410, 75, 81, 5, 22000, 37, 8.1, 70, 0.5, 5.9, 1.0, 3, 23, 0.1, 25, 35, 23],
  ["NG", "Nigeria", "🇳🇬", "SSA", 7800, 224, 53, 55, 70, 5800, 35, 7.2, 12, 10, 4.9, 5.1, 30, 1047, 1.3, 5, 75, 35],
  ["PK", "Pakistan", "🇵🇰", "SAS", 6900, 240, 65, 69, 52, 6300, 30, 4.5, 12, 4, 4.6, 3.4, 18, 154, 0.2, 20, 55, 37],
  ["ID", "Indonésie", "🇮🇩", "EAS", 4500, 277, 69, 73, 17, 14000, 38, 8.6, 40, 0.4, 5.6, 2.1, 16, 173, 0.3, 37, 30, 29],
  ["CD", "RD Congo", "🇨🇩", "SSA", 4300, 102, 58, 62, 62, 1300, 42, 7.1, 7, 13, 3.3, 6.1, 29, 547, 0.7, 13, 40, 55],
  ["ET", "Éthiopie", "🇪🇹", "SSA", 3800, 126, 64, 68, 34, 2800, 35, 3.2, 10, 7.6, 4.1, 4.0, 40, 267, 0.9, 4, 35, 63],
  ["US", "États-Unis", "🇺🇸", "NAM", 3600, 335, 75, 81, 5.4, 80000, 41, 13.6, 88, 6.4, 6.7, 1.6, 0, 21, 0.4, 23, 11, 2],
  ["BD", "Bangladesh", "🇧🇩", "SAS", 3000, 172, 71, 75, 23, 8600, 32, 7.4, 23, 2.3, 4.3, 1.9, 51, 123, 0.1, 35, 73, 37],
  ["BR", "Brésil", "🇧🇷", "LAT", 2500, 216, 72, 79, 13, 20000, 52, 8.3, 57, 21, 6.3, 1.6, 26, 72, 0.6, 13, 25, 9],
  ["TZ", "Tanzanie", "🇹🇿", "SSA", 2300, 67, 64, 68, 33, 3000, 40, 6.4, 8, 6.5, 3.7, 4.6, 29, 238, 4.5, 8, 22, 64],
  ["EG", "Égypte", "🇪🇬", "MENA", 2000, 112, 68, 73, 16, 16000, 32, 7.4, 37, 1.3, 4.2, 2.8, 17, 17, 0.1, 24, 59, 19],
  ["MX", "Mexique", "🇲🇽", "LAT", 1800, 128, 72, 78, 11, 23000, 43, 9.2, 45, 25, 6.7, 1.8, 21, 59, 0.3, 13, 41, 12],
  ["PH", "Philippines", "🇵🇭", "EAS", 1700, 117, 68, 74, 21, 11000, 41, 9.9, 35, 4.4, 6.0, 2.7, 15, 78, 0.2, 22, 45, 24],
  ["UG", "Ouganda", "🇺🇬", "SSA", 1700, 49, 61, 66, 31, 2800, 43, 6.2, 5, 9, 4.4, 4.4, 34, 284, 5.1, 10, 38, 63],
  ["AF", "Afghanistan", "🇦🇫", "SAS", 1500, 42, 60, 66, 43, 2000, 30, 2.5, 10, 6, 1.7, 4.6, 28, 620, 0.1, 20, 77, 45],
  ["SD", "Soudan", "🇸🇩", "SSA", 1500, 48, 63, 68, 38, 3500, 34, 3.8, 17, 5, 4.0, 4.4, 34, 270, 0.1, 15, 60, 40],
  ["KE", "Kenya", "🇰🇪", "SSA", 1500, 55, 60, 65, 30, 6000, 39, 6.7, 12, 5, 4.5, 3.3, 23, 530, 3.7, 11, 24, 33],
  ["VN", "Vietnam", "🇻🇳", "EAS", 1400, 99, 70, 79, 16, 13000, 36, 8.4, 40, 1.5, 5.8, 1.9, 15, 124, 0.3, 23, 40, 29],
  ["AO", "Angola", "🇦🇴", "SSA", 1300, 37, 59, 64, 46, 7000, 51, 5.4, 10, 4.8, 3.8, 5.1, 30, 222, 1.6, 10, 30, 56],
  ["RU", "Russie", "🇷🇺", "EUR", 1300, 144, 66, 77, 4, 36000, 36, 12.8, 85, 6.8, 5.8, 1.4, 6, 14, 1.2, 26, 35, 6],
  ["NE", "Niger", "🇳🇪", "SSA", 1200, 27, 61, 63, 61, 1500, 37, 2.1, 4, 4, 4.5, 6.7, 76, 441, 0.2, 9, 50, 70],
  ["MZ", "Mozambique", "🇲🇿", "SSA", 1200, 34, 59, 65, 51, 1400, 54, 3.5, 7, 3.5, 5.2, 4.6, 53, 127, 11.5, 15, 10, 70],
  ["IQ", "Irak", "🇮🇶", "MENA", 1200, 45, 69, 74, 21, 11000, 30, 7.3, 18, 9, 5.0, 3.4, 28, 76, 0.1, 21, 60, 18],
  ["IR", "Iran", "🇮🇷", "MENA", 1100, 89, 72, 77, 11, 17000, 35, 10.6, 55, 2.5, 4.9, 1.7, 17, 22, 0.1, 13, 35, 17],
  ["ZA", "Afrique du Sud", "🇿🇦", "SSA", 1100, 60, 60, 66, 25, 15000, 63, 11.4, 25, 42, 5.4, 2.3, 4, 127, 17, 20, 6, 20],
  ["TR", "Turquie", "🇹🇷", "MENA", 1000, 86, 74, 80, 8, 41000, 42, 8.6, 90, 2.5, 5.0, 1.6, 15, 17, 0.1, 30, 17, 16],
  ["CI", "Côte d’Ivoire", "🇨🇮", "SSA", 1000, 29, 57, 61, 52, 6500, 37, 5.3, 10, 9, 5.1, 4.3, 27, 480, 1.7, 10, 35, 45],
  ["CM", "Cameroun", "🇨🇲", "SSA", 1000, 28, 60, 63, 46, 4400, 42, 6.3, 14, 1.4, 4.9, 4.4, 30, 438, 2.6, 9, 70, 43],
  ["YE", "Yémen", "🇾🇪", "MENA", 1000, 34, 61, 66, 44, 2000, 37, 3.2, 10, 7, 3.6, 3.7, 32, 183, 0.1, 20, 80, 28],
  ["MG", "Madagascar", "🇲🇬", "SSA", 950, 30, 63, 67, 36, 1800, 43, 5.1, 6, 2, 4.2, 3.8, 39, 392, 0.2, 28, 25, 74],
  ["ML", "Mali", "🇲🇱", "SSA", 900, 23, 59, 61, 58, 2600, 36, 1.6, 5, 10, 4.2, 5.6, 54, 440, 0.8, 10, 35, 66],
  ["MM", "Myanmar", "🇲🇲", "EAS", 900, 54, 64, 70, 34, 5000, 31, 6.4, 18, 3, 4.4, 2.1, 16, 179, 0.8, 44, 75, 46],
  ["GH", "Ghana", "🇬🇭", "SSA", 880, 34, 62, 66, 33, 6500, 43, 7.4, 20, 2, 4.4, 3.5, 19, 263, 1.6, 4, 35, 38],
  ["DZ", "Algérie", "🇩🇿", "MENA", 850, 45, 75, 78, 19, 13000, 28, 8.1, 55, 1.4, 5.3, 2.7, 4, 78, 0.1, 21, 30, 10],
  ["BF", "Burkina Faso", "🇧🇫", "SSA", 760, 23, 59, 62, 51, 2500, 47, 2.1, 8, 1, 4.5, 4.7, 52, 264, 0.6, 14, 35, 73],
  ["JP", "Japon", "🇯🇵", "EAS", 760, 124, 81, 87, 1.7, 46000, 33, 13.4, 65, 0.2, 6.1, 1.2, 0, 4, 0.1, 20, 12, 3],
  ["TD", "Tchad", "🇹🇩", "SSA", 750, 18, 53, 56, 65, 1500, 37, 2.6, 3, 9, 4.4, 6.1, 61, 1063, 1.0, 10, 60, 72],
  ["SO", "Somalie", "🇸🇴", "SSA", 750, 18, 55, 59, 70, 1500, 37, 1.5, 3, 5, 4.7, 6.2, 45, 621, 0.1, 15, 60, 80],
  ["DE", "Allemagne", "🇩🇪", "EUR", 690, 84, 79, 83.5, 3, 66000, 32, 14.1, 76, 0.9, 6.9, 1.4, 0, 4, 0.1, 22, 12, 1],
  ["FR", "France", "🇫🇷", "EUR", 680, 68, 80, 85.7, 3.5, 58000, 31, 11.6, 70, 1.3, 6.6, 1.7, 0, 8, 0.3, 32, 9, 2],
  ["GB", "Royaume-Uni", "🇬🇧", "EUR", 660, 68, 79, 83, 3.6, 55000, 33, 13.4, 70, 1.0, 6.7, 1.5, 0, 10, 0.2, 14, 14, 1],
  ["MA", "Maroc", "🇲🇦", "MENA", 640, 37, 73, 77, 15, 9500, 39, 6.0, 45, 1.4, 4.9, 2.3, 14, 72, 0.1, 22, 50, 33],
  ["SN", "Sénégal", "🇸🇳", "SSA", 560, 18, 67, 71, 29, 4300, 36, 3.2, 15, 0.3, 5.0, 4.3, 31, 261, 0.3, 7, 50, 30],
  ["NP", "Népal", "🇳🇵", "SAS", 560, 31, 69, 72, 23, 4700, 33, 5.1, 15, 2, 5.2, 2.0, 35, 174, 0.1, 27, 55, 62],
  ["SA", "Arabie saoudite", "🇸🇦", "MENA", 550, 36, 77, 80, 6, 60000, 45, 11.3, 70, 0.8, 6.5, 2.4, 3, 16, 0.1, 15, 15, 2],
  ["PE", "Pérou", "🇵🇪", "LAT", 520, 34, 74, 79, 11, 15000, 40, 9.9, 70, 6, 5.8, 2.2, 14, 69, 0.3, 8, 30, 27],
  ["CO", "Colombie", "🇨🇴", "LAT", 510, 52, 74, 80, 11, 20000, 52, 8.9, 55, 25, 5.7, 1.7, 23, 75, 0.5, 8, 15, 15],
  ["TH", "Thaïlande", "🇹🇭", "EAS", 500, 72, 73, 80, 7, 21000, 35, 8.7, 45, 2.3, 6.0, 1.2, 20, 29, 1.1, 21, 10, 30],
  ["VE", "Venezuela", "🇻🇪", "LAT", 480, 28, 69, 77, 21, 7000, 45, 10.3, 50, 20, 5.6, 2.2, 22, 259, 0.5, 12, 45, 8],
  ["AR", "Argentine", "🇦🇷", "LAT", 460, 46, 74, 80, 6, 27000, 41, 11.1, 95, 4.6, 6.2, 1.9, 16, 45, 0.4, 22, 27, 7],
  ["IT", "Italie", "🇮🇹", "EUR", 380, 59, 81, 85, 2.3, 55000, 35, 10.7, 65, 0.5, 6.4, 1.2, 0, 5, 0.2, 23, 22, 4],
  ["CA", "Canada", "🇨🇦", "NAM", 350, 39, 80, 84, 4.4, 58000, 32, 13.8, 78, 2.3, 6.9, 1.4, 0, 11, 0.2, 12, 14, 1],
  ["ES", "Espagne", "🇪🇸", "EUR", 320, 48, 81, 86, 2.6, 49000, 34, 10.6, 95, 0.6, 6.4, 1.2, 0, 3, 0.4, 28, 21, 4],
  ["HT", "Haïti", "🇭🇹", "LAT", 270, 11.7, 62, 67, 47, 3000, 41, 5.6, 2, 13, 3.6, 2.8, 15, 350, 1.7, 10, 45, 46],
  ["PL", "Pologne", "🇵🇱", "EUR", 270, 37, 75, 82, 4, 44000, 29, 12.6, 70, 0.7, 6.4, 1.2, 0, 2, 0.1, 25, 18, 8],
  ["KR", "Corée du Sud", "🇰🇷", "EAS", 230, 51, 80, 86, 2.5, 50000, 33, 12.5, 100, 0.5, 6.0, 0.7, 0, 8, 0.1, 20, 30, 5],
  ["UA", "Ukraine", "🇺🇦", "EUR", 200, 37, 64, 75, 7, 13000, 26, 11.1, 80, 4, 4.9, 1.0, 9, 17, 1.0, 25, 50, 15],
];

const WORLD_BIRTHS_K = 132000;
const WORLD_POP_M = 8100;

const COUNTRIES = COUNTRY_ROWS.map(r => ({
  code: r[0], name: r[1], flag: r[2], region: r[3],
  births: r[4], pop: r[5], e0: { m: r[6], f: r[7] }, imr: r[8],
  gdp: r[9], gini: r[10], school: r[11], tert: r[12], hom: r[13],
  happy: r[14], tfr: r[15], cm: r[16],
  mmr: r[17], hiv: r[18], smoke: r[19], oop: r[20], agri: r[21],
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

// --- Époques ----------------------------------------------------------------
// Points d'appui grossiers par grande région, pour remonter le temps (1900, 1950)
// à partir des valeurs actuelles. Inspirés des séries longues de l'ONU, de
// Our World in Data et du projet Maddison ; ce sont des ordres de grandeur.
const DATA_YEAR = 2023;
const MIN_YEAR = 1900, MAX_YEAR = 2100;
const E0_ANCHORS = { EUR: [46, 64], NAM: [49, 68], LAT: [29, 51], EAS: [28, 44], SAS: [24, 37], SSA: [25, 37], MENA: [28, 42] };
const E0_OVERRIDE = { JP: [44, 60], RU: [32, 57], UA: [36, 58], US: [48, 68], CA: [50, 69], AR: [40, 61], KR: [26, 43], CN: [26, 43], SA: [27, 40] };
// Croissance annuelle moyenne du PIB par habitant : 1900-1950, 1950-2023.
const GROWTH = { EUR: [0.012, 0.025], NAM: [0.016, 0.02], LAT: [0.015, 0.017], EAS: [0.006, 0.03], SAS: [0.0, 0.028], SSA: [0.008, 0.01], MENA: [0.008, 0.02] };
const GROWTH_OVERRIDE = { CN: [0, 0.055], KR: [0.005, 0.06], JP: [0.015, 0.035], TH: [0.006, 0.04], VN: [0.004, 0.035], VE: [0.03, 0.0], CD: [0.008, -0.008], HT: [0.005, 0.0] };
// Enfants par femme en 1900 et 1950.
const TFR_ANCHORS = { EUR: [3.8, 2.7], NAM: [3.6, 3.3], LAT: [6.2, 5.9], EAS: [5.8, 5.6], SAS: [6, 6], SSA: [6.4, 6.5], MENA: [6.8, 6.8] };
// Évolution des naissances : taux annuel moyen (passé) et (futur) par région.
const BIRTH_TREND = { SSA: [0.025, 0.006], SAS: [0.012, -0.008], MENA: [0.012, -0.005], LAT: [0.006, -0.01], EAS: [-0.01, -0.014], EUR: [-0.008, -0.005], NAM: [-0.002, -0.002] };

// --- Événements historiques ----------------------------------------------------
// Guerres, famines, épidémies et crises qui ont touché les pays de la simulation.
// excess : probabilité de décès supplémentaire par an (toute la population) ;
// old : supplément pour les 65 ans et plus ; draft : part des hommes de 18 à 40 ans
// mobilisés ; soldier : risque annuel supplémentaire pour eux ; econ : effet sur
// les revenus ; happy : effet annuel sur le bonheur. Valeurs approchées.
// Un événement touche les pays listés dans c (ou tous si world) ; « all » donne
// les valeurs communes, complétées pays par pays.
const HISTORY = [
  { id: "ww1", from: 1914, to: 1918, name: "la Première Guerre mondiale", text: "La Première Guerre mondiale éclate.", cause: "guerre", soldierCause: "mort au front",
    c: { FR: { excess: 0.002, draft: 0.6, soldier: 0.04 }, DE: { excess: 0.003, draft: 0.6, soldier: 0.035 }, GB: { excess: 0.001, draft: 0.45, soldier: 0.025 }, IT: { excess: 0.002, draft: 0.5, soldier: 0.03 },
      RU: { excess: 0.004, draft: 0.4, soldier: 0.03 }, UA: { excess: 0.004, draft: 0.4, soldier: 0.03 }, PL: { excess: 0.004, draft: 0.3, soldier: 0.03 }, TR: { excess: 0.02, draft: 0.4, soldier: 0.05 },
      CA: { draft: 0.3, soldier: 0.02 }, US: { from: 1917, draft: 0.2, soldier: 0.01 } }, happy: -3 },
  { id: "flu", from: 1918, to: 1920, name: "la grippe espagnole", text: "La grippe espagnole fait le tour du monde.", cause: "grippe espagnole", world: true, all: { excess: 0.008 },
    c: { IN: { excess: 0.025 }, BD: { excess: 0.025 }, PK: { excess: 0.025 }, ID: { excess: 0.015 }, IR: { excess: 0.03 } }, happy: -2 },
  { id: "rusciv", from: 1917, to: 1922, name: "la guerre civile russe", text: "Révolution, puis guerre civile : le pays se déchire.", cause: "guerre civile", c: { RU: { excess: 0.012, draft: 0.2, soldier: 0.03 }, UA: { excess: 0.015, draft: 0.2, soldier: 0.03 } }, happy: -5 },
  { id: "mexrev", from: 1910, to: 1920, name: "la révolution mexicaine", text: "La révolution mexicaine embrase le pays.", cause: "guerre civile", c: { MX: { excess: 0.006, draft: 0.15, soldier: 0.02 } }, happy: -3 },
  { id: "crash", from: 1929, to: 1934, name: "la Grande Dépression", text: "La Grande Dépression : les usines ferment, le chômage explose.", c: { US: {}, CA: {}, DE: {}, GB: {}, FR: {}, AR: {}, BR: {}, MX: {}, PL: {}, IT: {}, ES: {}, JP: {} }, all: { econ: 0.75 }, jobLoss: 0.12, happy: -4 },
  { id: "holodomor", from: 1932, to: 1933, name: "la grande famine", text: "Une famine organisée ravage les campagnes.", cause: "famine", c: { UA: { excess: 0.06 }, RU: { excess: 0.006 } }, happy: -10 },
  { id: "spain", from: 1936, to: 1939, name: "la guerre d’Espagne", text: "La guerre civile éclate en Espagne.", cause: "guerre civile", c: { ES: { excess: 0.004, draft: 0.4, soldier: 0.03 } }, happy: -6 },
  { id: "sinojap", from: 1937, to: 1945, name: "la guerre sino-japonaise", text: "Le Japon envahit la Chine : des années de guerre commencent.", cause: "guerre", c: { CN: { excess: 0.006, draft: 0.15, soldier: 0.04 } }, happy: -5 },
  { id: "ww2", from: 1939, to: 1945, name: "la Seconde Guerre mondiale", text: "La Seconde Guerre mondiale commence.", cause: "guerre", soldierCause: "mort au combat",
    c: { PL: { excess: 0.028, draft: 0.2, soldier: 0.04 }, UA: { from: 1941, excess: 0.03, draft: 0.5, soldier: 0.07 }, RU: { from: 1941, excess: 0.015, draft: 0.6, soldier: 0.08 }, DE: { excess: 0.006, draft: 0.65, soldier: 0.06 },
      FR: { excess: 0.002, draft: 0.35, soldier: 0.015 }, GB: { excess: 0.001, draft: 0.45, soldier: 0.012 }, IT: { from: 1940, excess: 0.003, draft: 0.45, soldier: 0.02 }, JP: { from: 1941, excess: 0.007, draft: 0.55, soldier: 0.05 },
      US: { from: 1941, draft: 0.4, soldier: 0.008 }, CA: { draft: 0.35, soldier: 0.008 }, PH: { from: 1941, excess: 0.012 }, ID: { from: 1942, excess: 0.012 }, MM: { from: 1942, excess: 0.008 }, KR: { from: 1941, excess: 0.003, draft: 0.1, soldier: 0.02 },
      VN: { from: 1944, excess: 0.02 }, ES: { excess: 0.0005 } }, happy: -6 },
  { id: "bengal", from: 1943, to: 1944, name: "la famine du Bengale", text: "La famine du Bengale : le riz manque, les prix flambent.", cause: "famine", c: { BD: { excess: 0.05 }, IN: { excess: 0.002 } }, happy: -10 },
  { id: "partition", from: 1947, to: 1948, name: "la Partition", text: "La Partition de l’Inde jette des millions de personnes sur les routes.", cause: "violences de la Partition", c: { IN: { excess: 0.001 }, PK: { excess: 0.004 }, BD: { excess: 0.002 } }, happy: -5 },
  { id: "chinaciv", from: 1946, to: 1949, name: "la guerre civile chinoise", text: "La guerre civile reprend en Chine.", cause: "guerre civile", c: { CN: { excess: 0.003, draft: 0.1, soldier: 0.03 } }, happy: -4 },
  { id: "indochine", from: 1946, to: 1954, name: "la guerre d’Indochine", text: "La guerre d’Indochine commence.", cause: "guerre", c: { VN: { excess: 0.003, draft: 0.15, soldier: 0.02 } }, happy: -4 },
  { id: "korea", from: 1950, to: 1953, name: "la guerre de Corée", text: "La guerre de Corée éclate.", cause: "guerre", c: { KR: { excess: 0.02, draft: 0.5, soldier: 0.04 } }, happy: -8 },
  { id: "algeria", from: 1954, to: 1962, name: "la guerre d’Algérie", text: "La guerre d’Algérie commence.", cause: "guerre", c: { DZ: { excess: 0.005, draft: 0.1, soldier: 0.02 }, FR: { draft: 0.25, soldier: 0.002 } }, happy: -4 },
  { id: "vietnam", from: 1955, to: 1975, name: "la guerre du Vietnam", text: "Le pays est coupé en deux ; la guerre s’installe.", cause: "guerre", c: { VN: { excess: 0.004, draft: 0.4, soldier: 0.02 }, US: { from: 1965, to: 1973, draft: 0.08, soldier: 0.005 } }, happy: -5 },
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
  { id: "ussr", from: 1991, to: 1998, name: "l’effondrement de l’URSS", text: "L’URSS s’effondre : salaires impayés, épargne envolée.", c: { RU: { excess: 0.003 }, UA: { excess: 0.003 } }, all: { econ: 0.6 }, jobLoss: 0.1, cause: "maladie cardiaque", happy: -6 },
  { id: "somalia", from: 1991, to: 2012, name: "la guerre civile somalienne", text: "L’État s’effondre et la guerre civile commence.", cause: "guerre civile", c: { SO: { excess: 0.004 } }, happy: -5 },
  { id: "algciv", from: 1991, to: 2002, name: "la décennie noire", text: "La « décennie noire » commence en Algérie.", cause: "violences politiques", c: { DZ: { excess: 0.0008 } }, happy: -4 },
  { id: "congo", from: 1996, to: 2003, name: "les guerres du Congo", text: "La guerre ravage l’est du pays.", cause: "guerre", c: { CD: { excess: 0.012 } }, happy: -6 },
  { id: "asia97", from: 1997, to: 1998, name: "la crise financière asiatique", text: "La crise financière asiatique fait chuter la monnaie.", c: { ID: {}, TH: {}, KR: {} }, all: { econ: 0.8 }, jobLoss: 0.08, happy: -3 },
  { id: "darfur", from: 2003, to: 2008, name: "la guerre du Darfour", text: "La guerre du Darfour éclate.", cause: "guerre", c: { SD: { excess: 0.003 } }, happy: -5 },
  { id: "iraq", from: 2003, to: 2011, name: "la guerre d’Irak", text: "Le pays est envahi ; des années de violence suivent.", cause: "guerre", c: { IQ: { excess: 0.002 } }, happy: -5 },
  { id: "gfc", from: 2008, to: 2010, name: "la Grande Récession", text: "La crise financière de 2008 frappe l’économie.", c: { US: {}, GB: {}, ES: {}, IT: {}, FR: {}, DE: {}, CA: {}, JP: {}, MX: {}, PL: {} }, all: { econ: 0.92 }, jobLoss: 0.05, happy: -2 },
  { id: "haiti", from: 2010, to: 2010, name: "le séisme", text: "Un séisme dévaste Port-au-Prince.", cause: "séisme", c: { HT: { excess: 0.02 } }, happy: -8 },
  { id: "venez", from: 2014, to: 2024, name: "la crise vénézuélienne", text: "L’économie s’effondre ; beaucoup partent.", c: { VE: { excess: 0.001 } }, all: { econ: 0.6 }, jobLoss: 0.06, happy: -5, emigrate: 3 },
  { id: "yemen", from: 2015, to: 2024, name: "la guerre au Yémen", text: "La guerre éclate au Yémen.", cause: "guerre", c: { YE: { excess: 0.004 } }, happy: -6 },
  { id: "covid", from: 2020, to: 2021, name: "la pandémie de Covid-19", text: "La pandémie de Covid-19 : confinements, écoles fermées.", cause: "Covid-19", world: true, all: { excess: 0.0002, old: 0.008 }, happy: -2 },
  { id: "myanmar", from: 2021, to: 2025, name: "la guerre civile birmane", text: "Un coup d’État plonge le pays dans la guerre civile.", cause: "guerre civile", c: { MM: { excess: 0.001 } }, happy: -5 },
  { id: "ukraine", from: 2022, to: 2025, name: "la guerre en Ukraine", text: "La Russie envahit l’Ukraine.", cause: "guerre", soldierCause: "mort au front", c: { UA: { excess: 0.003, draft: 0.15, soldier: 0.04 }, RU: { draft: 0.03, soldier: 0.06 } }, happy: -6 },
  { id: "sudan", from: 2023, to: 2025, name: "la guerre au Soudan", text: "La guerre éclate entre l’armée et les paramilitaires.", cause: "guerre", c: { SD: { excess: 0.004 } }, happy: -6 },
  // Projections : le climat se réchauffe (scénarios du GIEC), sans événements inventés.
  { id: "heat", from: 2035, to: 2100, name: "le réchauffement", text: "Les étés deviennent plus chauds qu’autrefois ; les canicules se multiplient.", cause: "coup de chaleur",
    c: { IN: { old: 0.002 }, PK: { old: 0.002 }, BD: { old: 0.002 }, NG: { old: 0.001 }, NE: { old: 0.002 }, ML: { old: 0.002 }, TD: { old: 0.002 }, SD: { old: 0.002 }, IQ: { old: 0.002 }, SA: { old: 0.001 }, EG: { old: 0.001 }, YE: { old: 0.001 } }, happy: -0.5 },
];

// Préposition devant le nom du pays : « en France », « au Mali », « aux États-Unis », « à Haïti ».
const PREP_AU = new Set(["NG", "PK", "BD", "BR", "MX", "KE", "VN", "NE", "MZ", "YE", "CM", "ML", "MM", "GH", "BF", "TD", "JP", "GB", "MA", "SN", "NP", "PE", "VE", "CA", "SD"]);
const PREP_AUX = new Set(["US", "PH"]);
const PREP_A = new Set(["MG", "HT"]);
function inCountry(c) {
  const p = PREP_AUX.has(c.code) ? "aux" : PREP_AU.has(c.code) ? "au" : PREP_A.has(c.code) ? "à" : "en";
  return `${p} ${c.name}`;
}
