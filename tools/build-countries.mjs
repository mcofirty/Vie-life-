// Construit countries.js à partir des sources téléchargées par fetch-sources.sh :
// Banque mondiale (valeurs récentes) et Our World in Data (séries longues de
// l'ONU, de Riley, du projet Maddison, de Lee-Lee et du World Happiness Report).
//   sh tools/fetch-sources.sh && node tools/build-countries.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cache = f => join(here, "cache", f);
const DATA_YEAR = 2023;
const YEARS = Array.from({ length: 21 }, (_, i) => 1900 + i * 10);
const median = a => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const round = (x, d = 0) => x == null ? null : Math.round(x * 10 ** d) / 10 ** d;

// ---------- Pays et régions ----------
const wbCountries = JSON.parse(readFileSync(cache("wb-countries.json"), "utf8"))[1]
  .filter(c => c.region.id !== "NA" && /^[A-Z]{2}$/.test(c.iso2Code) && c.iso2Code !== "JG");
const OCEANIA = new Set(["AU", "NZ", "FJ", "PG", "SB", "VU", "WS", "TO", "KI", "FM", "MH", "NR", "PW", "TV", "GU", "AS", "MP", "PF", "NC"]);
const REGION = { EAS: "EAS", ECS: "EUR", LCN: "LAT", MEA: "MENA", NAC: "NAM", SAS: "SAS", SSF: "SSA" };
// La Banque mondiale range l'Afghanistan et le Pakistan avec le Moyen-Orient ; on les garde en Asie du Sud.
const list = wbCountries.map(c => ({ iso2: c.iso2Code, iso3: c.id, region: OCEANIA.has(c.iso2Code) ? "OCE" : ["AF", "PK"].includes(c.iso2Code) ? "SAS" : REGION[c.region.id] }));
// Taïwan n'est pas dans les données de la Banque mondiale : valeurs officielles récentes (vers 2023).
list.push({ iso2: "TW", iso3: "TWN", region: "EAS", manual: true });

// ---------- Banque mondiale : valeur la plus récente ----------
function wb(ind, mode = "latest") {
  const rows = JSON.parse(readFileSync(cache(`wb-${ind}.json`), "utf8"))[1] || [];
  const by = {};
  for (const r of rows) if (r.value != null) (by[r.countryiso3code] ||= []).push([+r.date, r.value]);
  const out = {};
  for (const [k, v] of Object.entries(by)) {
    v.sort((a, b) => b[0] - a[0]);
    if (mode === "latest") out[k] = v[0][1];
    else { const last = v.filter(x => x[0] >= 2014).map(x => x[1]); out[k] = last.length ? median(last) : v[0][1]; }
  }
  return out;
}
const W = {
  pop: wb("SP.POP.TOTL"), cbr: wb("SP.DYN.CBRT.IN"), e0m: wb("SP.DYN.LE00.MA.IN"), e0f: wb("SP.DYN.LE00.FE.IN"), imr: wb("SP.DYN.IMRT.IN"),
  gdp: wb("NY.GDP.PCAP.PP.CD"), gini: wb("SI.POV.GINI"), tert: wb("SE.TER.ENRR"), hom: wb("VC.IHR.PSRC.P5"), tfr: wb("SP.DYN.TFRT.IN"),
  cm: wb("SP.M18.2024.FE.ZS"), mmr: wb("SH.STA.MMRT"), hiv: wb("SH.DYN.AIDS.ZS"), smoke: wb("SH.PRV.SMOK"), oop: wb("SH.XPD.OOPC.CH.ZS"),
  agri: wb("SL.AGR.EMPL.ZS"), ind: wb("SL.IND.EMPL.ZS"), unemp: wb("SL.UEM.TOTL.ZS"), urban: wb("SP.URB.TOTL.IN.ZS"), net: wb("IT.NET.USER.ZS"),
  infl: wb("FP.CPI.TOTL.ZG", "median"), lend: wb("FR.INR.LEND"), bank: wb("FX.OWN.TOTL.ZS"), tax: wb("GC.TAX.TOTL.GD.ZS"),
  mcap: wb("CM.MKT.LCAP.GD.ZS"), flp: wb("SL.TLF.CACT.FE.ZS"),
};

// ---------- Our World in Data ----------
function owid(slug) {
  const [head, ...lines] = readFileSync(cache(`owid-${slug}.csv`), "utf8").trim().split("\n");
  const cols = head.split(",");
  const out = {};
  for (const line of lines) {
    // Les noms d'entités peuvent contenir des virgules entre guillemets.
    const m = line.match(/^(?:"[^"]*"|[^,]*),([^,]*),(\d+),(.*)$/);
    if (!m || !m[1]) continue;
    const vals = m[3].split(",").map(x => x === "" ? null : +x).filter(x => x != null && isFinite(x));
    if (!vals.length) continue;
    (out[m[1]] ||= {})[+m[2]] = vals[0];
  }
  return { out, cols };
}
const O = Object.fromEntries(["happiness-cantril-ladder", "mean-years-of-schooling-long-run", "life-expectancy", "life-expectancy-at-birth-including-the-un-projections",
  "number-of-births-per-year", "fertility-rate-with-projections", "child-mortality-around-the-world", "gdp-per-capita-maddison-project-database",
  "population", "population-with-un-projections"].map(s => [s, owid(s).out]));
const valAt = (series, y, tol = 5) => {
  if (!series) return null;
  if (series[y] != null) return series[y];
  for (let d = 1; d <= tol; d++) { if (series[y - d] != null) return series[y - d]; if (series[y + d] != null) return series[y + d]; }
  return null;
};
const latest = series => { if (!series) return null; const ys = Object.keys(series).map(Number).filter(y => y <= DATA_YEAR + 1); return ys.length ? series[Math.max(...ys)] : null; };

// ---------- Noms français, drapeaux, prépositions ----------
const dn = new Intl.DisplayNames(["fr"], { type: "region" });
const NAME_OVERRIDE = {
  IN: "Inde", NG: "Nigeria", CD: "RD Congo", CG: "Congo", US: "États-Unis", VN: "Vietnam", MM: "Myanmar", TR: "Turquie", KR: "Corée du Sud",
  KP: "Corée du Nord", PS: "Palestine", CZ: "Tchéquie", MK: "Macédoine du Nord", HK: "Hong Kong", MO: "Macao", BY: "Biélorussie", SZ: "Eswatini",
  CV: "Cap-Vert", FM: "Micronésie", TL: "Timor oriental", VC: "Saint-Vincent-et-les-Grenadines", KN: "Saint-Kitts-et-Nevis", ST: "Sao Tomé-et-Principe",
  BA: "Bosnie-Herzégovine", LC: "Sainte-Lucie", SA: "Arabie saoudite", XK: "Kosovo", CI: "Côte d’Ivoire", MF: "Saint-Martin", SX: "Sint Maarten",
  VG: "Îles Vierges britanniques", VI: "Îles Vierges des États-Unis", TC: "Îles Turques-et-Caïques", MP: "Îles Mariannes du Nord", AS: "Samoa américaines",
};
// Préposition : « en France », « au Mali », « aux États-Unis », « à Cuba ».
const IN_OVERRIDE = {
  CD: "en RD Congo", SL: "en Sierra Leone", HT: "en Haïti", OM: "à Oman", IL: "en Israël", GD: "à la Grenade", BB: "à la Barbade", DM: "à la Dominique",
  IM: "sur l’île de Man", GL: "au Groenland", PF: "en Polynésie française", NC: "en Nouvelle-Calédonie", VU: "au Vanuatu",
};
const A_SET = new Set(["CU", "MG", "MT", "SG", "MC", "CY", "MU", "BH", "LC", "SM", "KN", "VC", "TW", "HK", "MO", "PR", "NR", "ST", "AG", "TT", "DJ", "AW", "CW", "GU", "SX", "MF", "GI", "MV", "TV"]);
const PLURAL = new Set(["US", "PH", "NL", "AE", "KM", "MV", "SC", "BS", "FJ", "WS", "TO", "KI", "TV", "PW", "MH", "SB", "BM", "KY", "VG", "VI", "TC", "MP", "AS", "FO"]);
const MASC_E = new Set(["Royaume", "Mexique", "Cambodge", "Mozambique", "Zimbabwe", "Belize", "Suriname", "Groenland"]);
function prepFor(code, name) {
  if (IN_OVERRIDE[code]) return IN_OVERRIDE[code];
  if (PLURAL.has(code)) return `aux ${name}`;
  if (A_SET.has(code)) return `à ${name}`;
  const head = name.split(/[ -]/)[0];
  const bare = head.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (/^[AEIOU]/i.test(bare)) return `en ${name}`;
  if (/e$/.test(head) && !MASC_E.has(head)) return `en ${name}`;
  return `au ${name}`;
}
const flag = c => String.fromCodePoint(...[...c].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65));

// ---------- Valeurs actuelles ----------
const estimated = {};
const TW = { pop: 23.4e6, births: 135, e0m: 77.7, e0f: 84.2, imr: 4, gdp: 73000, gini: 34, tert: 85, hom: 0.8, tfr: 0.9, cm: 0, mmr: 10, hiv: 0.1, smoke: 13,
  oop: 35, agri: 4.5, ind: 36, unemp: 3.5, urban: 80, net: 93, infl: 1.5, lend: 2.6, bank: 95, tax: 13, mcap: 200, flp: 51 };
const rows = list.map(c => {
  const k = c.iso3, w = f => c.manual ? TW[f] : W[f][k];
  const pop = w("pop");
  const birthsOwid = valAt(O["number-of-births-per-year"][k], DATA_YEAR, 1);
  const births = c.manual ? TW.births : birthsOwid != null ? birthsOwid / 1000 : (W.cbr[k] != null && pop ? W.cbr[k] * pop / 1e6 : null);
  return {
    ...c, pop: pop != null ? pop / 1e6 : null, births, e0m: w("e0m"), e0f: w("e0f"), imr: w("imr"), gdp: w("gdp"), gini: w("gini"),
    school: latest(O["mean-years-of-schooling-long-run"][k]), tert: w("tert"), hom: w("hom"), happy: latest(O["happiness-cantril-ladder"][k]),
    tfr: w("tfr"), cm: w("cm"), mmr: w("mmr"), hiv: w("hiv"), smoke: w("smoke"), oop: w("oop"), agri: w("agri"), ind: w("ind"),
    unemp: w("unemp"), urban: w("urban"), net: w("net"), infl: w("infl"), lend: w("lend"), bank: w("bank"), tax: w("tax"), mcap: w("mcap"), flp: w("flp"),
  };
}).filter(r => r.pop && r.pop > 0.01);

// PIB manquant : la dernière valeur du projet Maddison (en $ de 2011), mise à l'échelle des prix récents.
for (const r of rows) if (r.gdp == null) {
  const m = latest(O["gdp-per-capita-maddison-project-database"][r.iso3]);
  if (m) { r.gdp = m * 1.35; (estimated[r.iso2] ||= []).push("gdp"); }
}
// Valeurs manquantes : médiane de la région (et signalées comme estimées).
const FIELDS = ["births", "e0m", "e0f", "imr", "gdp", "gini", "school", "tert", "hom", "happy", "tfr", "cm", "mmr", "hiv", "smoke", "oop", "agri", "ind", "unemp", "urban", "net", "infl", "lend", "bank", "tax", "flp"];
for (const f of FIELDS) {
  const byRegion = {};
  for (const r of rows) if (r[f] != null) (byRegion[r.region] ||= []).push(r[f]);
  const all = rows.map(r => r[f]);
  for (const r of rows) if (r[f] == null) {
    // Pour les pays riches sans données, le mariage d'enfants et le VIH sont quasi nuls.
    if ((f === "cm" || f === "hiv") && r.gdp > 30000) r[f] = f === "cm" ? 0 : 0.1;
    else if (f === "births" && r.pop) r[f] = r.pop * 1000 * 12 / 1000;
    else r[f] = median(byRegion[r.region] || all) ?? median(all);
    (estimated[r.iso2] ||= []).push(f);
  }
}
// Le bonheur manquant suit mieux le revenu que la région.
for (const r of rows) if ((estimated[r.iso2] || []).includes("happy")) r.happy = Math.max(3, Math.min(7.5, 2.3 + 0.38 * Math.log(r.gdp / 1000) * 1.6));

// ---------- Séries longues (1900 → 2100, tous les 10 ans) ----------
const series = {};
const pick = (slug, k) => O[slug][k];
for (const r of rows) {
  const k = r.iso3;
  const e0 = YEARS.map(y => y >= 1950 ? valAt(pick("life-expectancy-at-birth-including-the-un-projections", k), y) : valAt(pick("life-expectancy", k), y, 6));
  const u5 = YEARS.map(y => y >= 1950 && y <= DATA_YEAR ? valAt(pick("child-mortality-around-the-world", k), y) : null);
  const births = YEARS.map(y => y >= 1950 ? valAt(pick("number-of-births-per-year", k), y) : null);
  const pop = YEARS.map(y => y >= 1950 ? valAt(pick("population-with-un-projections", k), y) : valAt(pick("population", k), y, 5));
  const tfr = YEARS.map(y => y >= 1950 ? valAt(pick("fertility-rate-with-projections", k), y) : null);
  const gdp = YEARS.map(y => y <= 2020 ? valAt(pick("gdp-per-capita-maddison-project-database", k), y, 3) : null);
  const school = YEARS.map(y => y <= 2020 ? valAt(pick("mean-years-of-schooling-long-run", k), y, 5) : null);
  series[r.iso2] = { e0, u5, births, pop, tfr, gdp, school };
}
// Trous : on reprend l'évolution médiane de la région (rapport à 1950 ou à 2020).
function fillRatio(key, anchorIdx, mult = true) {
  const regionRatios = {};
  for (const r of rows) {
    const s = series[r.iso2][key], a = s[anchorIdx];
    if (a == null) continue;
    s.forEach((v, i) => { if (v != null) ((regionRatios[r.region] ||= {})[i] ||= []).push(mult ? v / a : v - a); });
  }
  for (const r of rows) {
    const s = series[r.iso2][key];
    let a = s[anchorIdx];
    if (a == null) continue;
    s.forEach((v, i) => {
      if (v != null) return;
      const all = Object.values(regionRatios).flatMap(x => x[i] || []);
      const m = median((regionRatios[r.region] || {})[i] || []) ?? median(all);
      if (m != null) s[i] = mult ? a * m : a + m;
    });
  }
}
const i1950 = YEARS.indexOf(1950), i2020 = YEARS.indexOf(2020);
for (const r of rows) {
  const s = series[r.iso2];
  // Ancrages manquants : on part des valeurs actuelles.
  if (s.gdp[i2020] == null) s.gdp[i2020] = r.gdp;
  if (s.school[i2020] == null) s.school[i2020] = r.school;
  if (s.e0[i1950] == null) s.e0[i1950] = Math.max(30, (r.e0m + r.e0f) / 2 - 25);
  if (s.tfr[i1950] == null) s.tfr[i1950] = Math.max(r.tfr + 2, 5);
  if (s.pop[i1950] == null) s.pop[i1950] = r.pop * 1e6 * 0.35;
  if (s.births[i1950] == null) s.births[i1950] = r.births * 1000 * 0.6;
}
fillRatio("e0", i1950, false); fillRatio("pop", i1950); fillRatio("births", i1950); fillRatio("tfr", i1950, false);
fillRatio("gdp", i2020); fillRatio("school", i2020, false);
// Mortalité des moins de 5 ans avant 1950 et après 2023 : relation observée avec l'espérance de vie.
const pairs = rows.flatMap(r => [1950, 1960].map(y => { const i = YEARS.indexOf(y), s = series[r.iso2]; return s.u5[i] && s.e0[i] ? [s.e0[i], Math.log(s.u5[i])] : null; })).filter(Boolean);
const mx = pairs.reduce((a, p) => a + p[0], 0) / pairs.length, my = pairs.reduce((a, p) => a + p[1], 0) / pairs.length;
const slope = pairs.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pairs.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
for (const r of rows) {
  const s = series[r.iso2];
  const iLast = YEARS.indexOf(2020);
  if (s.u5[i1950] == null) s.u5[i1950] = Math.exp(my + slope * (s.e0[i1950] - mx));
  for (let i = 0; i < i1950; i++) if (s.u5[i] == null && s.e0[i] != null) s.u5[i] = Math.min(50, s.u5[i1950] * Math.exp(slope * (s.e0[i] - s.e0[i1950])));
  for (let i = iLast + 1; i < YEARS.length; i++) if (s.e0[i] != null && s.u5[iLast] != null) s.u5[i] = Math.max(0.2, s.u5[iLast] * Math.exp(slope * (s.e0[i] - s.e0[iLast])));
  // TFR avant 1950 : au moins le niveau de 1950, plus haut là où la transition avait commencé tôt.
  for (let i = 0; i < i1950; i++) if (s.tfr[i] == null) s.tfr[i] = Math.max(s.tfr[i1950], r.region === "EUR" || r.region === "NAM" || r.region === "OCE" ? 3.8 - i * 0.2 : s.tfr[i1950]);
  // Creux ponctuels (guerres, famines, épidémies) : on les lisse, car la simulation
  // les ajoute elle-même année par année (voir HISTORY dans data.js).
  for (let i = 1; i < YEARS.indexOf(1980); i++) {
    const e = s.e0, u = s.u5;
    if (e[i] != null && e[i - 1] != null && e[i + 1] != null && e[i] < (e[i - 1] + e[i + 1]) / 2 - 2) e[i] = (e[i - 1] + e[i + 1]) / 2;
    if (u[i] != null && u[i - 1] != null && u[i + 1] != null && u[i] > (u[i - 1] + u[i + 1]) / 2 * 1.15) u[i] = (u[i - 1] + u[i + 1]) / 2;
  }
  // Avant 1950, l'espérance de vie ne descend pas sous 22 ans (moyennes de long terme).
  for (let i = 0; i < i1950; i++) if (s.e0[i] != null) s.e0[i] = Math.max(22, s.e0[i]);
  // Interpolation des derniers trous.
  for (const key of Object.keys(s)) {
    const a = s[key];
    for (let i = 0; i < a.length; i++) if (a[i] == null) {
      let j = i - 1; while (j >= 0 && a[j] == null) j--;
      let l = i + 1; while (l < a.length && a[l] == null) l++;
      if (j >= 0 && l < a.length) a[i] = a[j] + (a[l] - a[j]) * (i - j) / (l - j);
      else if (j >= 0 || l < a.length) a[i] = a[j >= 0 ? j : l];
    }
  }
}

// ---------- Écriture ----------
const nameOf = r => NAME_OVERRIDE[r.iso2] || dn.of(r.iso2);
const out = rows.sort((a, b) => b.births - a.births).map(r => {
  const name = nameOf(r);
  return [r.iso2, name, flag(r.iso2), r.region, prepFor(r.iso2, name), round(r.births, r.births < 10 ? 2 : 0), round(r.pop, r.pop < 1 ? 3 : 1),
    round(r.e0m, 1), round(r.e0f, 1), round(r.imr, 1), round(r.gdp, -2) || round(r.gdp), round(r.gini, 1), round(r.school, 1), round(Math.min(r.tert, 100)), round(r.hom, 1),
    round(r.happy, 1), round(r.tfr, 2), round(r.cm, 1), round(r.mmr), round(r.hiv, 1), round(r.smoke, 1), round(r.oop), round(r.agri, 1), round(r.ind, 1),
    round(r.unemp, 1), round(r.urban), round(r.net), round(Math.min(r.infl, 300), 1), round(r.lend, 1), round(r.bank), round(r.tax, 1), round(r.mcap ?? 0), round(r.flp)];
});
const ser = Object.fromEntries(rows.map(r => {
  const s = series[r.iso2], d = { e0: 1, u5: 2, births: -2, pop: -3, tfr: 2, gdp: -1, school: 1 };
  return [r.iso2, Object.fromEntries(Object.entries(s).map(([k, a]) => [k, a.map(v => v == null ? null : k === "births" ? Math.round(v / 1000) : k === "pop" ? Math.round(v / 1000) : round(v, d[k] > 0 ? d[k] : 0))]))];
}));
const js = `// Généré par tools/build-countries.mjs — ne pas modifier à la main.
// Sources : Banque mondiale (WDI, valeurs les plus récentes, vers ${DATA_YEAR}) ; Our World in Data :
// ONU World Population Prospects 2024 (naissances, population, espérance de vie, fécondité,
// mortalité des moins de 5 ans, projections jusqu'en 2100), Riley et Zijdeman (espérance de vie
// avant 1950), projet Maddison (PIB par habitant), Lee et Lee (années d'école), World Happiness Report.
//
// Colonnes : code, nom, drapeau, région, préposition + nom, naissances/an (milliers), population (millions),
// espérance de vie hommes, femmes, mortalité infantile (‰), PIB/hab. (PPA $), Gini, années d'école (15-64 ans),
// inscription dans le supérieur (%), homicides (/100 000), satisfaction de vie (0-10), fécondité,
// mariage avant 18 ans (% des femmes de 20-24 ans), mortalité maternelle (/100 000), VIH (% des 15-49 ans),
// tabac (% des adultes), reste à charge des soins (%), emploi agricole (%), emploi industriel (%), chômage (%),
// population urbaine (%), internautes (%), inflation (médiane 2014-2023, %), taux des crédits (%),
// adultes ayant un compte (%), recettes fiscales (% du PIB), capitalisation boursière (% du PIB),
// participation des femmes au marché du travail (%).
const DATA_YEAR = ${DATA_YEAR};
const COUNTRY_ROWS = [
${out.map(r => "  " + JSON.stringify(r)).join(",\n")},
];
// Valeurs absentes des sources, remplacées par la médiane de la région.
const ESTIMATED = ${JSON.stringify(Object.fromEntries(Object.entries(estimated).filter(([k]) => out.some(r => r[0] === k))))};
// Séries tous les 10 ans de 1900 à 2100 : espérance de vie, mortalité des moins de 5 ans (%),
// naissances (milliers), population (milliers), fécondité, PIB/hab. (Maddison), années d'école.
const SERIES_YEARS = ${JSON.stringify(YEARS)};
const COUNTRY_SERIES = {
${Object.entries(ser).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join(",\n")},
};
`;
writeFileSync(join(here, "..", "countries.js"), js);
console.log(`${out.length} pays, ${(js.length / 1024).toFixed(0)} Ko, pente u5/e0 ${slope.toFixed(3)}`);
console.log("Estimés :", Object.entries(estimated).length, "pays ont au moins une valeur estimée");
