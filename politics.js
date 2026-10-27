// Carrière politique : militer, se faire élire (conseil municipal, mairie, Parlement,
// présidence ou tête du gouvernement), être nommé ministre ; ou, sous un parti unique ou une
// dictature, monter dans l'appareil. Les lobbys (pétrole, banques, laboratoires, BTP,
// syndicats, écologistes…) courtisent d'autant plus qu'on est haut placé : dons, invitations,
// enveloppes, amendements tout faits. Les lois votées font gagner ou perdre vos entreprises ;
// les faveurs acceptées finissent parfois en scandale. Tout dépend du régime du pays.

// --- Régimes ---------------------------------------------------------------------------
// dem : élections libres · hybrid : élections, mais le pouvoir les contrôle · party : parti
// unique · auto : dictature militaire ou monarchie sans élections · colony : colonie.
// Périodes approximatives, pour les cas les plus connus ; le reste suit la région.
const REGIME_SPANS = {
  DE: [[1933, 1945, "party"]], IT: [[1922, 1945, "party"]], AT: [[1934, 1945, "auto"]], ES: [[1923, 1930, "auto"], [1939, 1977, "auto"]], PT: [[1926, 1975, "auto"]],
  GR: [[1936, 1944, "auto"], [1967, 1974, "auto"]], FR: [[1940, 1944, "auto"]], JP: [[1932, 1945, "auto"]], HU: [[1920, 1945, "hybrid"]], RS: [[1990, 2000, "hybrid"]], PL: [[1926, 1939, "auto"]],
  CL: [[1924, 1932, "auto"], [1973, 1990, "auto"]], AR: [[1930, 1932, "auto"], [1943, 1946, "auto"], [1955, 1958, "auto"], [1966, 1973, "auto"], [1976, 1983, "auto"]],
  BR: [[1930, 1945, "auto"], [1964, 1985, "auto"]], UY: [[1973, 1985, "auto"]], PY: [[1954, 1989, "auto"]], PE: [[1968, 1980, "auto"]], BO: [[1964, 1982, "auto"]],
  MX: [[1929, 2000, "hybrid"]], VE: [[1948, 1958, "auto"], [1958, 2005, "dem"], [2006, 2100, "hybrid"]], NI: [[1936, 1979, "auto"], [2007, 2100, "hybrid"]], CR: [[1949, 2100, "dem"]],
  CO: [[1958, 2100, "dem"]], DO: [[1930, 1961, "auto"]], HT: [[1957, 1986, "auto"]], CU: [[1952, 1959, "auto"], [1959, 2100, "party"]],
  KR: [[1900, 1948, "colony"], [1948, 1987, "auto"]], TW: [[1900, 1945, "colony"], [1945, 1996, "party"]], PH: [[1900, 1946, "colony"], [1972, 1986, "auto"]],
  ID: [[1900, 1949, "colony"], [1959, 1998, "auto"]], TH: [[1900, 1932, "auto"], [1933, 1992, "hybrid"], [2006, 2007, "auto"], [2014, 2019, "auto"]], MM: [[1900, 1948, "colony"], [1962, 2015, "auto"], [2021, 2100, "auto"]],
  MY: [[1900, 1957, "colony"]], SG: [[1900, 1959, "colony"]], VN: [[1900, 1954, "colony"], [1955, 2100, "party"]], LA: [[1900, 1953, "colony"], [1975, 2100, "party"]], KH: [[1900, 1953, "colony"], [1975, 1993, "party"]],
  CN: [[1949, 2100, "party"]], KP: [[1900, 1945, "colony"], [1948, 2100, "party"]], MN: [[1924, 1990, "party"]],
  IN: [[1900, 1947, "colony"], [1947, 2100, "dem"]], PK: [[1900, 1947, "colony"], [1958, 1971, "auto"], [1977, 1988, "auto"], [1999, 2008, "auto"]], BD: [[1900, 1971, "colony"], [1991, 2013, "dem"]],
  LK: [[1900, 1948, "colony"], [1948, 2100, "dem"]], NP: [[2008, 2100, "dem"]], AF: [[1900, 2004, "auto"], [2021, 2100, "auto"]], BT: [[2008, 2100, "dem"]],
  IL: [[1948, 2100, "dem"]], TN: [[1900, 1956, "colony"], [2011, 2021, "dem"]], DZ: [[1900, 1962, "colony"], [1962, 1989, "party"]], MA: [[1900, 1956, "colony"]],
  IR: [[1900, 1979, "auto"]], TR: [[1923, 1946, "party"], [1946, 1980, "dem"], [1980, 1983, "auto"], [1983, 2016, "dem"], [2016, 2100, "hybrid"]], EG: [[1953, 2011, "hybrid"], [2012, 2013, "dem"]], LB: [[1943, 2100, "dem"]],
  RU: [[1900, 1917, "auto"], [1992, 2000, "dem"], [2000, 2100, "hybrid"]], UA: [[1992, 2100, "dem"]], GE: [[2004, 2100, "dem"]], MD: [[1992, 2100, "dem"]], AM: [[2018, 2100, "dem"]],
  ZA: [[1900, 1994, "hybrid"], [1994, 2100, "dem"]], LR: [[1900, 2005, "hybrid"], [2006, 2100, "dem"]], ET: [[1900, 1974, "auto"]], GH: [[1957, 1965, "party"], [1993, 2100, "dem"]],
  SN: [[1960, 1999, "hybrid"], [2000, 2100, "dem"]], BW: [[1966, 2100, "dem"]], MU: [[1968, 2100, "dem"]], CV: [[1991, 2100, "dem"]], NA: [[1990, 2100, "dem"]], KE: [[2002, 2100, "dem"]],
  NG: [[1966, 1979, "auto"], [1983, 1998, "auto"], [1999, 2100, "dem"]], BJ: [[1991, 2100, "dem"]], ZM: [[1991, 2100, "dem"]], MW: [[1994, 2100, "dem"]],
};
for (const c of "SA AE QA KW BH OM BN SZ".split(" ")) REGIME_SPANS[c] = [[1900, 2100, "auto"]];
for (const c of "BY KZ UZ TM TJ AZ KG".split(" ")) REGIME_SPANS[c] = [[1992, 2100, "hybrid"]];
const INDEPENDENCE = { ZA: 1910, LR: 1900, ET: 1900, GH: 1957, SD: 1956, GN: 1958, ER: 1993, NA: 1990, ZW: 1980, AO: 1975, MZ: 1975, GW: 1974, CV: 1975, KE: 1963, TZ: 1961, UG: 1962, ZM: 1964, MW: 1964, BW: 1966, LS: 1966, DZ: 1962, LY: 1951, MA: 1956, TN: 1956, JO: 1946, SY: 1946, LB: 1943, IQ: 1932, KW: 1961, AE: 1971, QA: 1971, BH: 1971, IL: 1948, PS: 2100 };
function regimeAt(code, y) {
  const sp = (REGIME_SPANS[code] || []).find(s => y >= s[0] && (y < s[1] || s[1] === 2100));
  if (sp) return sp[2];
  const r = (BY_CODE[code] || {}).region;
  const ind = INDEPENDENCE[code] ?? (r === "SSA" ? 1960 : 0);
  if (y < ind) return "colony";
  if (planned(code, y)) return "party";
  if (r === "EUR" || r === "NAM" || r === "OCE") return "dem";
  if (r === "LAT") return y >= 1990 ? "dem" : "hybrid";
  if (r === "SSA") return y < 1991 ? "party" : "hybrid";
  if (r === "EAS") return code === "JP" ? "dem" : (code === "KR" || code === "MN" || code === "PH" || code === "ID" || code === "TW" || code === "TL") ? "dem" : "hybrid";
  return "hybrid";
}
const REGIME_NOTE = {
  dem: "Élections libres : on se fait élire, et on peut perdre.",
  hybrid: "Des élections ont lieu, mais le pouvoir les contrôle ; l’opposition gagne rarement.",
  party: "Parti unique : on monte en grade par la loyauté et les protections ; on peut tomber en disgrâce.",
  auto: "Pas d’élections nationales libres : les postes se donnent par nomination, aux fidèles du régime.",
  colony: "Le pays est une colonie : l’administration coloniale nomme ; d’autres militent pour l’indépendance.",
};
// Droit de vote et d'éligibilité des femmes (années approximatives).
const WOMEN_VOTE = { NZ: 1919, AU: 1902, FI: 1906, NO: 1913, DK: 1915, IS: 1915, RU: 1917, NL: 1917, DE: 1918, GB: 1918, AT: 1918, PL: 1918, IE: 1918, SE: 1919, US: 1920, CA: 1920, ES: 1931, BR: 1932, TR: 1934, PH: 1937, FR: 1945, IT: 1946, JP: 1946, IN: 1947, AR: 1947, KR: 1948, BE: 1948, CL: 1949, CN: 1949, GR: 1952, MX: 1953, CO: 1954, EG: 1956, IR: 1963, CH: 1971, PT: 1974, QA: 1999, KW: 2005, AE: 2006, SA: 2015 };
// On peut militer dès 16 ans, quel que soit son métier ; se présenter, à partir de 18 ans.
const POL_MIN_AGE = 16;
const polJoinWhy = L => L.politics ? "vous faites déjà de la politique" : L.age < POL_MIN_AGE ? `à partir de ${POL_MIN_AGE} ans` : "";
const womenCanRun = L => L.sex !== "f" || L.calYear >= (WOMEN_VOTE[L.code] ?? 1950);

// --- Postes ------------------------------------------------------------------------------
// w : poids (l'influence) · pct : rang de salaire quand le poste est à plein temps ·
// term : durée du mandat · cost : campagne, en revenus médians.
const OFFICE = [
  { w: 1, term: 0, cost: 0 },
  { w: 4, term: 6, cost: 0.1 },
  { w: 10, pct: 0.8, full: true, term: 6, cost: 0.4 },
  { w: 22, pct: 0.92, full: true, term: 5, cost: 1 },
  { w: 45, pct: 0.96, full: true },
  { w: 100, pct: 0.985, full: true, term: 5, cost: 6 },
];
const PRESIDENTIAL = "US FR BR MX AR CO CL PE VE EC BO PY UY CR PA GT HN SV NI DO KR PH ID RU UA BY KZ UZ EG IR NG KE GH SN CI CM TZ UG AO MZ ZW ZM CD ML BF NE TD GN BJ TG MG DZ TN AF";
const pair = (m, f = m) => [m, f];
function officeTitles(L, R = polRegime(L)) {
  const code = L.code;
  if (R === "party") return [pair("membre du parti"), pair("cadre local du parti", "cadre locale du parti"), pair("secrétaire du parti de la ville"), pair("membre du comité central"), pair("ministre"), pair("secrétaire général du parti", "secrétaire générale du parti")];
  if (R === "auto" || R === "colony") return [pair("notable"), pair("conseiller municipal nommé", "conseillère municipale nommée"), pair("gouverneur de province", "gouverneure de province"), pair(R === "colony" ? "membre du conseil colonial" : "membre du conseil consultatif"), pair(R === "colony" ? "conseiller du gouverneur général" : "ministre", R === "colony" ? "conseillère du gouverneur général" : "ministre"), null];
  const deputy = code === "US" ? pair("membre du Congrès") : code === "DE" ? pair("député au Bundestag", "députée au Bundestag") : code === "GB" ? pair("député (MP)", "députée (MP)") : code === "IN" ? pair("député de la Lok Sabha", "députée de la Lok Sabha") : pair("député", "députée");
  const S = polSystem(L);
  const top = code === "US" ? pair("président des États-Unis", "présidente des États-Unis") : code === "DE" || code === "AT" ? pair("chancelier", "chancelière")
    : S.sys === "coll" ? pair("conseiller fédéral", "conseillère fédérale") : code === "ES" && S.sys === "parl" ? pair("président du gouvernement", "présidente du gouvernement")
    : (code === "IT" || code === "FR") && S.sys === "parl" ? pair("président du Conseil", "présidente du Conseil")
    : S.sys === "pres" ? pair("président de la République", "présidente de la République") : pair("Premier ministre", "Première ministre");
  return [pair("militant", "militante"), pair("conseiller municipal", "conseillère municipale"), pair("maire"), deputy, code === "US" ? pair("membre du cabinet (ministre)") : pair("ministre"), top];
}
const elected = R => R === "dem" || R === "hybrid";

// --- Systèmes politiques -------------------------------------------------------------------
// Comment on arrive au sommet, pays par pays. sys : « pres », le chef de l'exécutif est élu au
// suffrage universel ; « parl », c'est le chef du parti (ou de la coalition) qui gagne les législatives ;
// « coll », un gouvernement collégial élu par le Parlement (Suisse). pick : l'investiture : primary
// (primaires), members (vote des adhérents), caucus (les parlementaires du parti), congress (le congrès,
// l'appareil). rounds : tours de scrutin · term, limit : durée et nombre de mandats (consec : seulement
// d'affilée) · minAge · power : ce que le chef de l'exécutif fait passer quand il a la majorité ·
// mid : des législatives en cours de mandat (Congrès hostile, cohabitation) · fptp : scrutin majoritaire à
// un tour, qui donne la majorité au premier parti (pas de coalition).
function polSystem(L) {
  const c = L.code, y = L.calYear, pres = inList(c, PRESIDENTIAL) || (c === "TR" && y >= 2014);
  const S = pres ? { sys: "pres", pick: y >= 1990 ? "members" : "congress", rounds: 2, term: 5, limit: 2, consec: false, minAge: 35, power: 0.8, mid: false }
    : { sys: "parl", pick: y >= 1990 ? "members" : "caucus", rounds: 1, term: 5, limit: Infinity, consec: false, minAge: 18, power: 0.85, mid: false };
  const set = o => Object.assign(S, o);
  if (c === "US") set({ pick: y >= 1972 ? "primary" : "congress", rounds: 1, term: 4, limit: y >= 1951 ? 2 : Infinity, power: 0.6, mid: true });
  else if (c === "FR") set(y >= 1958 ? { pick: y >= 2011 && y < 2022 ? "primary" : "members", term: y >= 2002 ? 5 : 7, limit: y >= 2008 ? 2 : Infinity, consec: true, minAge: y >= 2011 ? 18 : 23, power: 0.9, mid: y < 2002 }
    : { sys: "parl", pick: "caucus", rounds: 1, term: 5, limit: Infinity, minAge: 23, power: 0.55 });
  else if (c === "MX") set({ rounds: 1, term: 6, limit: 1, power: 0.8 });
  else if (c === "KR") set({ rounds: 1, term: 5, limit: 1, minAge: 40, power: 0.8 });
  else if (c === "PH") set({ rounds: 1, term: 6, limit: 1, power: 0.75 });
  else if (c === "BR") set({ term: y >= 1994 ? 4 : 5, limit: y >= 1997 ? 2 : 1, consec: true, power: 0.6 });
  else if (c === "AR") set({ pick: y >= 2011 ? "primary" : S.pick, term: y >= 1994 ? 4 : 6, limit: y >= 1994 ? 2 : 1, consec: true, power: 0.75 });
  else if (c === "CL") set({ pick: y >= 2013 ? "primary" : S.pick, term: 4, limit: 1, consec: true, power: 0.75 });
  else if (c === "UY") set({ pick: y >= 1999 ? "primary" : S.pick, limit: 1, consec: true, power: 0.7 });
  else if (c === "CO") set({ term: 4, limit: y >= 2005 && y < 2015 ? 2 : 1, power: 0.7 });
  else if (c === "PE") set({ limit: 1, consec: true, power: 0.6 });
  else if (c === "RU") set({ term: y >= 2012 ? 6 : 4, consec: true, power: 0.9 });
  else if (c === "GB") set({ pick: y >= 1998 ? "members" : "caucus", power: 0.9, fptp: true });
  else if (c === "DE") set({ pick: "congress", term: 4, power: 0.7 });
  else if (c === "IT") set({ pick: "congress", power: 0.6 });
  else if (c === "IN") set({ pick: "congress", power: 0.85, minAge: 25, fptp: true });
  else if (c === "JP") set({ pick: "caucus", term: 4, power: 0.8 });
  else if (c === "CA") set({ pick: "members", term: 4, fptp: true });
  else if (c === "AU" || c === "NZ") set({ pick: "caucus", term: 3, power: 0.8, fptp: c === "AU" || y < 1996 });
  else if (inList(c, "SE NO DK")) set({ term: 4, power: 0.75 });
  else if (c === "CH") set({ sys: "coll", pick: "caucus", term: 4, power: 0.4 });
  return S;
}
// Le poids des camps : parts de voix approximatives (le reste : petits partis). Un candidat du
// premier parti part avec une longueur d'avance ; celui d'un petit parti n'a presque aucune chance.
function campShares(L, R = polRegime(L)) {
  const c = L.code, y = L.calYear;
  if (R === "hybrid") return { pouvoir: 62, opposition: 26 };
  let s = { gauche: 32, centre: 18, droite: 32 };
  if (c === "US") return { gauche: 47, droite: 47 };
  if (c === "GB") s = { gauche: 37, centre: y >= 1980 ? 17 : 9, droite: 40 };
  else if (c === "DE") s = { gauche: 31, centre: 9, droite: 36 };
  else if (c === "FR") s = y >= 2017 ? { gauche: 22, centre: 25, droite: 26 } : { gauche: 30, centre: 15, droite: 30 };
  else if (c === "JP" && y >= 1955) s = { gauche: 22, centre: 14, droite: 46 };
  else if (c === "IN") s = y < 1990 ? { gauche: 44, centre: 12, droite: 12 } : y >= 2014 ? { gauche: 22, centre: 15, droite: 38 } : { gauche: 30, centre: 15, droite: 28 };
  else if (c === "ZA" && y >= 1994) s = { gauche: 58, centre: 20, droite: 8 };
  else if (inList(c, "SE NO DK")) s = { gauche: 38, centre: 16, droite: 28 };
  else if (c === "CA") s = { gauche: 17, centre: 38, droite: 34 };
  if (y >= 1980) s.eco = c === "DE" ? 9 : inList(c, "SE NO DK NL AT CH BE LU FI NZ AU") ? 7 : 4;
  return s;
}
const PICK_LABEL = { primary: "primaires", members: "vote des adhérents", caucus: "vote des parlementaires du parti", congress: "congrès du parti" };
// Tirages fixes, pour estimer les chances : le chiffre affiché ne bouge pas d'un clic à l'autre.
const NORM = (() => { let s = 20240; const u = () => (s = s * 16807 % 2147483647) / 2147483647; return Array.from({ length: 4001 }, () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u())); })();
// Le camp au pouvoir change : on note depuis quand, pour l'usure du pouvoir.
function setGov(L, side) {
  const P = L.politics;
  if (P.govSide !== side) P.govSince = L.calYear;
  P.govSide = side;
}
// Qui gagne les législatives, quand le pays change de majorité : les grands partis plus souvent.
function pickGov(L, not) {
  const sh = campShares(L), sides = Object.keys(sh).filter(s => s !== not && s !== "eco");
  let r = rand() * sides.reduce((t, s) => t + sh[s], 0);
  for (const s of sides) if ((r -= sh[s]) < 0) return s;
  return sides[0];
}
// Le principal adversaire d'un camp.
function rivalOf(L, side) {
  const sh = campShares(L);
  return Object.keys(sh).filter(s => s !== side && lean(s, side) < 1).sort((a, b) => sh[b] - sh[a])[0] || side;
}

// --- Partis -----------------------------------------------------------------------------
function partiesFor(L, R = polRegime(L)) {
  const code = L.code, y = L.calYear;
  if (R === "party") return [{ id: "parti", label: partyName(L), sub: "Le seul chemin vers le pouvoir : loyauté, réunions, protections." }, { id: "opposition", label: "La dissidence", sub: "Pétitions, samizdat, réunions secrètes : la prison guette." }];
  if (R === "auto") return [{ id: "regime", label: "Servir le régime", sub: "Les postes vont aux fidèles ; les disgrâces sont brutales." }, { id: "opposition", label: "L’opposition clandestine", sub: "Risque d’arrestation ; un rôle si le régime tombe." }];
  if (R === "colony") return [{ id: "regime", label: "L’administration coloniale", sub: "Quelques postes pour les notables du pays." }, { id: "opposition", label: "Le mouvement pour l’indépendance", sub: "Meetings, grèves, prison parfois ; un destin si le pays se libère." }];
  if (R === "hybrid") return [{ id: "pouvoir", label: "Le parti au pouvoir", sub: "Les élections se gagnent d’avance, la carrière dépend des chefs." }, { id: "opposition", label: "L’opposition", sub: "Peu de chances de gagner, des risques d’arrestation." }];
  const names = code === "US" ? { gauche: "Le Parti démocrate", droite: "Le Parti républicain" } : code === "GB" ? { gauche: "Le Parti travailliste", droite: "Le Parti conservateur", centre: "Les libéraux-démocrates" }
    : code === "DE" ? { gauche: "Le SPD (sociaux-démocrates)", droite: "La CDU (chrétiens-démocrates)", centre: "Le FDP (libéraux)", eco: "Les Verts" }
    : code === "CA" ? { gauche: "Le NPD (néo-démocrates)", centre: "Le Parti libéral", droite: "Le Parti conservateur" }
    : code === "IN" ? { gauche: "Le Parti du Congrès", droite: y >= 1980 ? "Le BJP (nationalistes hindous)" : undefined }
    : code === "JP" && y >= 1955 ? { droite: "Le PLD (libéraux-démocrates)" } : code === "ZA" && y >= 1994 ? { gauche: "L’ANC (Congrès national africain)", centre: "L’Alliance démocratique" } : {};
  const sh = campShares(L, R), weight = l => l.map(p => sh[p.id] == null ? p : { ...p, sub: `${p.sub} · ≈ ${sh[p.id]} % des voix${sh[p.id] === Math.max(...Object.values(sh)) ? ", premier parti" : ""}` });
  const list = [
    { id: "gauche", label: names.gauche || "Le grand parti de gauche", sub: "Proche des syndicats ; impôts, services publics, salaires." },
    { id: "centre", label: names.centre || "Le parti du centre", sub: "Ni l’un ni l’autre : on gouverne souvent en coalition." },
    { id: "droite", label: names.droite || "Le grand parti de droite", sub: "Proche des entreprises ; baisse des impôts, ordre, liberté d’entreprendre." },
  ];
  if (code === "US") list.splice(1, 1);
  if (y >= 1980 && code !== "US") list.push({ id: "eco", label: names.eco || "Les écologistes", sub: "Climat, nature, santé ; un petit parti qui monte." });
  list.push({ id: "ind", label: "Sans étiquette", sub: "Libre de ses votes ; personne pour vous porter aux élections nationales." });
  return weight(list);
}
function partyName(L) {
  const c = L.code;
  if (c === "CN") return "Le Parti communiste chinois";
  if (planned(c, L.calYear) && inList(c, "RU UA BY KZ UZ TM KG TJ AZ AM GE MD LT LV EE")) return "Le Parti communiste de l’Union soviétique";
  if (c === "DE") return "Le parti nazi (NSDAP)";
  if (c === "IT") return "Le Parti national fasciste";
  if (c === "TW") return "Le Kuomintang";
  if (c === "VN") return "Le Parti communiste vietnamien";
  if (c === "CU") return "Le Parti communiste de Cuba";
  if (c === "KP") return "Le Parti du travail de Corée";
  if (planned(c, L.calYear)) return "Le Parti communiste";
  return "Le parti unique";
}
const SIDE_LABEL = { gauche: "gauche", centre: "centre", droite: "droite", eco: "écologistes", ind: "sans étiquette", pouvoir: "parti au pouvoir", opposition: "opposition", parti: "parti unique", regime: "fidèle du régime" };
// Proximité d'un camp avec le camp qui porte une loi : 1 pour, -1 contre, 0 libre.
function lean(side, billSide) {
  if (side === billSide) return 1;
  if (side === "ind" || side === "centre" || billSide === "centre") return 0;
  if ((side === "gauche" && billSide === "eco") || (side === "eco" && billSide === "gauche")) return 1;
  return -1;
}

// --- Lobbys ------------------------------------------------------------------------------
// dom : domaines d'entreprises qu'ils défendent · cc : pays où ils pèsent lourd · side : camp ami ·
// people : mouvements citoyens (pas d'argent à offrir, mais des militants et des voix).
const LOBBIES = {
  oil: { label: "Pétrole et énergie", who: "les pétroliers", dom: ["Énergie", "Ressources"], cc: "US SA RU NG AE KW QA IR IQ VE NO CA GB DZ AO KZ AZ LY MX BR", side: "droite" },
  bank: { label: "Banques et finance", who: "les banques", dom: ["Finance", "Immobilier"], cc: "US GB CH LU SG HK JP FR DE NL IE", side: "droite" },
  pharma: { label: "Industrie pharmaceutique", who: "les laboratoires", dom: ["Santé"], cc: "US CH DE GB FR DK IN BE IE JP", from: 1930, side: "centre" },
  agri: { label: "Agriculture et agro-industrie", who: "les syndicats agricoles", dom: ["Agriculture"], cc: "FR IN US BR AR NZ IE NL PL ES IT CA AU", side: "droite" },
  build: { label: "BTP et promoteurs immobiliers", who: "les promoteurs", dom: ["Bâtiment", "Immobilier", "Ingénierie"], cc: "CN FR ES TR AE IN US JP KR", side: "droite" },
  industry: { label: "Automobile et industrie", who: "les industriels", dom: ["Industrie", "Transport"], cc: "DE JP US KR FR IT CN MX CZ SK GB SE ES BR IN", from: 1910, side: "droite" },
  tech: { label: "Géants du numérique", who: "les géants du numérique", dom: ["Technologie"], cc: "US CN KR IE IN IL TW JP SE FI EE", from: 1995, side: "centre" },
  arms: { label: "Armée et armement", who: "les marchands d’armes", dom: [], cc: "US RU FR GB IL CN DE IT KR TR SE IN PK EG", side: "droite" },
  media: { label: "Grands médias", who: "les patrons de presse", dom: ["Médias", "Culture"], cc: "US GB FR IT BR IN AU", from: 1920, side: "centre" },
  retail: { label: "Commerce et grande distribution", who: "les enseignes de la grande distribution", dom: ["Commerce", "Restauration", "Mode", "Tourisme", "Loisirs", "Services"], cc: "US FR DE GB MX BR", from: 1950, side: "droite" },
  unions: { label: "Syndicats de salariés", who: "les syndicats", dom: [], cc: "FR DE SE DK NO FI BE IT GB AR BR ZA KR", people: true, side: "gauche" },
  green: { label: "Associations écologistes", who: "les écologistes", dom: [], cc: "DE FR SE NL DK NO CH AT NZ CA", people: true, from: 1970, side: "eco" },
};
// Ministères, et les lobbys qui s'y pressent.
const PORTFOLIOS = [
  ["l’Économie et des Finances", ["bank", "industry", "retail"]], ["la Santé", ["pharma"]], ["l’Agriculture", ["agri"]], ["l’Industrie", ["industry", "oil"]],
  ["l’Environnement", ["green", "oil", "industry"], 1971], ["la Défense", ["arms"]], ["du Travail", ["unions", "retail"]], ["du Numérique", ["tech", "media"], 2000],
  ["la Culture et de la Communication", ["media"]], ["du Logement et des Transports", ["build", "industry"]], ["l’Énergie", ["oil", "green"], 1973],
];
const ministryOf = p => `ministre ${p.startsWith("du ") ? p : `de ${p}`}`;
// Les lobbys qui comptent dans ce pays, cette année.
function lobbiesHere(L) {
  const y = L.calYear;
  return Object.keys(LOBBIES).filter(id => y >= (LOBBIES[id].from || 0));
}
// Le poids d'un lobby ici, et pour vous : ce qu'il pèse dans le pays, et ce que votre poste lui importe.
function lobbyPower(L, id) {
  const B = LOBBIES[id], P = L.politics, R = polRegime(L);
  let w = inList(L.code, B.cc) ? 2.5 : 1;
  if (B.people && (R === "party" || R === "auto")) w *= 0.3;
  if (id === "arms" && (R === "auto" || R === "party")) w *= 2;
  if (P) {
    if (P.rank === 2 || P.rank === 1) w *= id === "build" ? 2.5 : id === "retail" ? 1.5 : 1;
    if (P.rank === 4 && P.portfolio) { const pf = PORTFOLIOS.find(x => x[0] === P.portfolio); if (pf && pf[1].includes(id)) w *= 3; }
    if (P.rank === 5) w *= 1.5;
  }
  return w;
}
const relLabel = r => r >= 50 ? "alliés" : r >= 20 ? "bien disposés" : r > -20 ? "neutres" : r > -50 ? "méfiants" : "hostiles";
// Corruption ordinaire du pays : plus forte là où l'État est pauvre et le pouvoir sans contre-pouvoirs.
function corruptionOf(L) {
  const R = polRegime(L), c = L.here;
  let x = clamp(0.75 - c.gdp / 60000, 0.05, 0.75) + (R === "hybrid" ? 0.12 : R === "party" || R === "auto" || R === "colony" ? 0.18 : 0);
  if (inList(L.code, "DK FI NO SE NZ CH NL IS SG LU")) x -= 0.15;
  return clamp(x, 0.03, 0.9);
}
// Le soutien des lobbys, de -1 (tous contre vous) à 1 (tous derrière vous).
function lobbySupport(L) {
  const P = L.politics; let s = 0, t = 0;
  for (const id of lobbiesHere(L)) { const w = lobbyPower(L, id); s += w * (P.lob[id] || 0) / 100; t += w; }
  return t ? s / t : 0;
}
const domainOf = b => BIZ_DOMAIN[b.type] || (BUSINESSES[b.type] && BUSINESSES[b.type].domain) || "Services";

// --- Lois et décisions ---------------------------------------------------------------------
// pro / con : lobbys gagnants et perdants si la loi passe · pub : ce que l'opinion pense de voter
// pour · side : camp qui la porte · fx : effet sur les entreprises d'un domaine (« * » : toutes).
const BILLS = [
  { t: "une taxe carbone sur les carburants", pro: ["green"], con: ["oil", "industry"], pub: -2, side: "eco", fx: { Énergie: -0.06, Ressources: -0.04, Transport: -0.04, Industrie: -0.03 }, from: 1990 },
  { t: "une baisse de l’impôt sur les sociétés", pro: ["bank", "industry", "retail", "tech"], con: ["unions"], pub: -1, side: "droite", fx: { "*": 0.04 } },
  { t: "une hausse du salaire minimum", pro: ["unions"], con: ["retail", "build"], pub: 3, side: "gauche", fx: { Commerce: -0.03, Restauration: -0.04, Services: -0.02, Tourisme: -0.02 }, from: 1920 },
  { t: "la déréglementation de la finance", pro: ["bank"], con: ["unions"], pub: -2, side: "droite", fx: { Finance: 0.08, Immobilier: 0.03 }, from: 1975 },
  { t: "le plafonnement du prix des médicaments", pro: [], con: ["pharma"], pub: 3, side: "gauche", fx: { Santé: -0.07 }, from: 1945 },
  { t: "de nouvelles subventions agricoles", pro: ["agri"], con: ["green"], pub: 1, side: "droite", fx: { Agriculture: 0.08 } },
  { t: "un grand plan d’infrastructures (routes, ponts, logements)", pro: ["build", "unions", "industry"], con: [], pub: 2, side: "centre", fx: { Bâtiment: 0.1, Ingénierie: 0.06, Immobilier: 0.04 } },
  { t: "une taxe sur les géants du numérique", pro: ["media", "retail"], con: ["tech"], pub: 2, side: "gauche", fx: { Technologie: -0.05 }, from: 2015 },
  { t: "la hausse du budget de la défense", pro: ["arms", "industry"], con: ["green"], pub: 0, side: "droite", fx: { Industrie: 0.03 } },
  { t: "une réforme des retraites (partir plus tard)", pro: ["bank"], con: ["unions"], pub: -4, side: "droite", fx: { Finance: 0.03 }, from: 1990 },
  { t: "une loi contre la concentration des médias", pro: [], con: ["media"], pub: 2, side: "gauche", fx: { Médias: -0.06 }, from: 1950 },
  { t: "une prime à la casse pour acheter une voiture neuve", pro: ["industry", "retail"], con: ["green"], pub: 1, side: "centre", fx: { Industrie: 0.06, Transport: 0.03 }, from: 1990 },
  { t: "la protection des forêts et des zones naturelles", pro: ["green"], con: ["agri", "build", "oil"], pub: 1, side: "eco", fx: { Agriculture: -0.03, Bâtiment: -0.03, Ressources: -0.06 }, from: 1970 },
  { t: "la privatisation de services publics", pro: ["bank", "build"], con: ["unions"], pub: -2, side: "droite", fx: { Finance: 0.04, Transport: 0.04, Énergie: 0.04 }, from: 1980 },
  { t: "des aides massives aux énergies renouvelables", pro: ["green"], con: ["oil"], pub: 2, side: "eco", fx: { Énergie: 0.02 }, from: 2005 },
  { t: "l’interdiction de la publicité pour le tabac et l’alcool", pro: [], con: ["media", "retail"], pub: 2, side: "gauche", fx: { Médias: -0.03, Restauration: -0.02 }, from: 1975 },
  { t: "un encadrement strict de l’intelligence artificielle", pro: ["unions", "media"], con: ["tech"], pub: 2, side: "centre", fx: { Technologie: -0.05 }, from: 2023 },
  { t: "un droit de grève plus encadré", pro: ["industry", "retail"], con: ["unions"], pub: -1, side: "droite", fx: { "*": 0.02 } },
  { t: "le remboursement intégral des soins", pro: ["unions", "pharma"], con: ["bank"], pub: 3, side: "gauche", fx: { Santé: 0.04, Finance: -0.02 }, from: 1945 },
];
// Décisions d'une mairie (ou d'un conseil municipal).
const LOCAL_BILLS = [
  { t: "un grand projet immobilier en bordure de la ville", pro: ["build"], con: ["green"], pub: 0, fx: { Bâtiment: 0.06, Immobilier: 0.05 } },
  { t: "une zone commerciale à l’entrée de la ville", pro: ["retail", "build"], con: [], pub: -1, fx: { Commerce: 0.04 }, from: 1960 },
  { t: "des pistes cyclables et un centre-ville piéton", pro: ["green"], con: ["retail"], pub: 1, fx: { Commerce: -0.02 }, from: 1975 },
  { t: "la reconversion d’une usine fermée en logements", pro: ["build", "unions"], con: [], pub: 2, fx: { Bâtiment: 0.04 } },
  { t: "un nouveau stade pour le club local", pro: ["build", "media"], con: [], pub: 1, fx: { Sport: 0.08, Bâtiment: 0.03 } },
  { t: "une hausse des impôts locaux pour rénover les écoles", pro: ["unions"], con: ["retail"], pub: -1, fx: {} },
  { t: "l’ouverture d’une usine chimique (300 emplois)", pro: ["industry", "unions"], con: ["green"], pub: 1, fx: { Industrie: 0.05 } },
  { t: "un permis de construire pour une tour de bureaux", pro: ["build", "bank"], con: [], pub: -1, fx: { Immobilier: 0.05, Bâtiment: 0.04 }, from: 1960 },
];
// Ce que la loi change pour vos entreprises (part de bénéfices en plus ou en moins).
function billFx(L, bill) {
  let gain = 0, n = 0;
  for (const b of L.businesses || []) { const e = bill.fx[domainOf(b)] ?? bill.fx["*"] ?? 0; if (e) { gain += e * b.value * (b.stake ?? 1); n++; } }
  return { gain, n };
}
function applyBill(L, bill) {
  const hit = [];
  for (const b of L.businesses || []) { const e = bill.fx[domainOf(b)] ?? bill.fx["*"] ?? 0; if (e) { b.mult *= 1 + e; hit.push(e); } }
  if (hit.length) L.say(`${capFirst(bill.t)} : ${hit.length > 1 ? "vos entreprises" : "votre entreprise"} ${hit.reduce((s, e) => s + e, 0) > 0 ? "en profite" : "en pâtit"}${hit.length > 1 ? "nt" : ""}.`, "money");
}

// --- Méthodes de la vie --------------------------------------------------------------------
const polRegime = L => regimeAt(L.code, L.calYear);
Object.assign(Life.prototype, {
  polTitle(rank = this.politics.rank) {
    const t = officeTitles(this)[rank];
    if (rank === 4 && this.politics.portfolio && t && t[0] === "ministre") return this.g(ministryOf(this.politics.portfolio), ministryOf(this.politics.portfolio));
    return t ? this.g(t[0], t[1]) : "";
  },
  polInfluence() {
    const P = this.politics;
    if (!P) return 0;
    // Au sommet, l'influence dépend aussi des pouvoirs du poste : majorité, coalition, contre-pouvoirs.
    const w = P.rank === 5 && elected(polRegime(this)) ? OFFICE[5].w * (0.6 + execPower(this) * 0.4) : OFFICE[P.rank].w;
    return Math.round(clamp(w * (0.6 + P.pop / 250), 1, 100));
  },
  joinPolitics(side) {
    const R = polRegime(this), list = partiesFor(this, R), p = list.find(x => x.id === side);
    if (!p) return null;
    this.politics = { code: this.code, regime: R, side, party: p.label, rank: 0, former: 0, pop: clamp(15 + (this.network || 0) * 3 + this.stats.know / 8 + (this.passion ? this.passion.fame / 4 : 0), 5, 60),
      loyalty: 50, funds: 0, dirt: 0, conflict: 0, lob: {}, did: {}, history: [], startAt: this.age, govSide: elected(R) ? (R === "hybrid" ? "pouvoir" : pickGov(this)) : side, govSince: this.calYear - Math.floor(rand() * 8), cycle: this.calYear % 5 };
    const P = this.politics;
    for (const id of lobbiesHere(this)) P.lob[id] = LOBBIES[id].side === side ? 15 : 0;
    this.say(side === "opposition" ? `Rejoint ${p.label.charAt(0).toLowerCase() + p.label.slice(1)}. Un engagement qui peut coûter cher.` : `S’engage en politique : ${p.label.charAt(0).toLowerCase() + p.label.slice(1)}.`, "work", true);
    this.network = (this.network || 0) + 0.5;
    return `${p.label} · ${this.polTitle(0)}`;
  },
  // Prendre un poste (élu, nommé, promu), ou en descendre.
  setOffice(rank, note) {
    const P = this.politics, prev = P.rank, O = OFFICE[rank];
    P.rank = rank;
    P.former = Math.max(P.former, rank);
    if (rank > 0) P.history.push({ y: this.calYear, t: capFirst(this.polTitle(rank)) });
    P.termEnd = O.term ? this.age + termOf(this, rank) : rank === 4 ? P.termEnd : null;
    // Quitter le sommet : là où la limite ne vaut que pour les mandats d'affilée, on pourra revenir, un mandat plus tard.
    if (prev === 5 && rank !== 5) { P.tried = P.tried || {}; P.tried[5] = this.age; if (polSystem(this).consec) P.topTerms = 0; }
    if (O.full) {
      if (this.job && !(this.jobInfo && this.jobInfo.politics)) this.say(`Quitte son emploi (${this.job}) pour son mandat.`, "work");
      if (this.retired) this.retired = false;
      this.job = this.polTitle(rank);
      this.jobInfo = { id: "politics", sector: "pub", politics: true };
      this.homemaker = false;
      if (this.firstJobAt == null) this.firstJobAt = this.age;
      this.incomePct = O.pct;
      for (const b of this.businesses || []) if (b.mode === "full" && this.focusBiz(b)) this.askBizWithJob();
      this.bizFocus = 0;
    } else if (this.jobInfo && this.jobInfo.politics) {
      this.job = null; this.jobInfo = null; this.income = 0;
      if (prev >= 2) this.say("Retrouve la vie civile ; il faudra chercher un emploi.", "work");
    }
    if (note) this.say(note, "work", true);
  },
  leaveOffice(note) {
    const P = this.politics;
    if (!P) return;
    this.setOffice(0, note);
  },
  quitPolitics(note) {
    const P = this.politics;
    if (!P) return;
    if (P.rank > 0) this.setOffice(0);
    this.polPast = { former: P.former, history: P.history, party: P.party };
    this.politics = null;
    if (note) this.say(note, "work", true);
  },
  // Une année en politique.
  politicsYear() {
    const P = this.politics;
    if (!P || !this.alive) return;
    const R = polRegime(this), a = this.age, m = median(this.here);
    if (this.code !== P.code) { this.quitPolitics("En quittant le pays, laisse derrière soi sa carrière politique."); return; }
    // Un autre emploi, la retraite : le mandat à plein temps s'arrête.
    if (OFFICE[P.rank].full && !(this.jobInfo && this.jobInfo.politics)) { P.rank = 0; P.termEnd = null; this.say("Quitte son mandat.", "work"); }
    if (P.regime !== R) this.regimeChange(P.regime, R);
    if (!this.politics) return;
    const titles = officeTitles(this, R);
    if (P.rank > 0 && !titles[P.rank]) this.leaveOffice();
    // Popularité, loyauté, trésor de campagne, relations avec les lobbys.
    P.pop = clamp(P.pop + (40 - P.pop) * 0.12 + randn() * 3 + (P.rank >= 4 ? (this.econ - 1) * 25 : 0) + (P.lob.media || 0) / 60, 0, 100);
    P.loyalty = clamp(P.loyalty + (50 - P.loyalty) * 0.05, 0, 100);
    P.funds *= 0.9;
    for (const id in P.lob) P.lob[id] = Math.round(P.lob[id] * 0.92);
    for (const id of lobbiesHere(this)) if (P.lob[id] == null) P.lob[id] = 0;
    // Indemnités : un mandat local se cumule avec un métier ; les autres sont un emploi.
    if (P.rank === 1) this.addMoney(m * 0.12);
    if (OFFICE[P.rank].full) this.incomePct = OFFICE[P.rank].pct;
    // L'alternance (démocratie) : tous les cinq ans, le pays peut changer de majorité.
    if (R === "dem" && this.calYear % 5 === P.cycle && P.rank !== 5) {
      if (rand() < 0.45) {
        setGov(this, pickGov(this, P.govSide));
        this.say(`Élections législatives : ${P.govSide === "centre" ? "le centre" : `la ${P.govSide}`} l’emporte.`, "history");
        if (P.rank === 4 && lean(P.side, P.govSide) < 1) { this.setOffice(3, "Changement de majorité : quitte le gouvernement et retrouve son siège."); P.termEnd = a + 1 + Math.floor(rand() * 4); }
      }
    }
    if (R === "hybrid") P.govSide = "pouvoir";
    if (!elected(R)) P.govSide = R === "party" ? "parti" : "regime";
    if (elected(R) && P.rank === 5) this.topYear(R);
    if (!this.politics) return;
    // Fin de mandat : se représenter ou non (c'est vous qui choisissez).
    if (elected(R) && P.termEnd != null && a >= P.termEnd && [1, 2, 3, 5].includes(P.rank)) this.askReelection();
    // Ministre : nommé par le chef du gouvernement de son camp ; remaniements.
    if (elected(R) && P.rank === 3 && (R === "hybrid" ? P.side === "pouvoir" : lean(P.side, P.govSide) === 1 && P.side !== "ind") && rand() < clamp(0.01 + P.pop / 1500 + P.loyalty / 2000 + (this.network || 0) / 500, 0, 0.08)) this.offerMinistry();
    else if (elected(R) && P.rank === 4 && rand() < 0.1) { this.setOffice(3, "Remaniement : n’est pas reconduit au gouvernement ; retrouve son siège."); P.termEnd = a + 1 + Math.floor(rand() * 4); }
    // Parti unique, régime, colonie : promotions, protections, disgrâces.
    if (!elected(R) && P.side !== "opposition") this.apparatusYear(titles);
    // Opposition sous un régime autoritaire : arrestations.
    if (P.side === "opposition" && R !== "dem" && rand() < (R === "hybrid" ? 0.04 : 0.08)) {
      this.bump("health", -6); this.bump("happy", -12); P.pop = clamp(P.pop + 4, 0, 100);
      this.say(`Arrêt${this.g("é", "ée")} pour ses activités politiques ; ${pick(["des mois en prison", "une année en prison", "des semaines d’interrogatoires"])}.`, "life", true, true);
      if (this.job && !(this.jobInfo && this.jobInfo.politics) && rand() < 0.5) this.loseJob("À sa sortie, son emploi a disparu.");
    }
    // Les lobbys viennent à vous, et les lois arrivent sur votre bureau.
    if (P.rank >= 1 && rand() < clamp(0.15 + this.polInfluence() / 80, 0, 0.9)) this.lobbyApproach();
    if (P.rank >= 1) this.billOfYear(R);
    this.scandalCheck(R);
  },
  regimeChange(old, R) {
    const P = this.politics, opp = P.side === "opposition";
    P.regime = R;
    if (opp && (elected(R) || old === "colony")) {
      P.pop = clamp(P.pop + 30, 0, 100); P.loyalty = 70;
      P.side = R === "dem" ? "centre" : R === "hybrid" ? "pouvoir" : R === "party" ? "parti" : "regime";
      P.party = (partiesFor(this, R).find(x => x.id === P.side) || {}).label || P.party;
      setGov(this, P.side);
      this.say(old === "colony" ? "L’indépendance ! Ceux qui l’ont réclamée en prison sont désormais ceux qu’on écoute." : "Le régime tombe : ceux qui l’ont combattu deviennent les figures de la liberté retrouvée.", "history", true);
      this.bump("happy", 10);
      if (!elected(R) && P.rank < 3 && rand() < 0.5) this.setOffice(3, `Entre au cœur du nouveau pouvoir : ${this.polTitle(3)}.`);
      return;
    }
    if (P.rank > 0) this.leaveOffice(elected(R) && !elected(old) ? "Le régime tombe ; les fidèles d’hier perdent leurs postes." : !elected(R) && elected(old) ? "Coup de force : les assemblées sont dissoutes, les mandats balayés." : "Le changement de régime balaie les postes.");
    if (!elected(R) && elected(old)) P.pop = clamp(P.pop - 10, 0, 100);
    const parties = partiesFor(this, R);
    if (!parties.some(x => x.id === P.side)) { P.side = parties[0].id; P.party = parties[0].label; }
    setGov(this, elected(R) ? (R === "hybrid" ? "pouvoir" : pickGov(this)) : P.side);
  },
  askReelection() {
    const P = this.politics, rank = P.rank, title = this.polTitle(rank);
    if (P.askedAt === this.age) return;
    P.askedAt = this.age;
    const S = polSystem(this), max = S.limit + (P.extraTerms || 0), limit = rank === 5 && (P.topTerms || 0) >= max;
    const ch = electionChance(this, rank, true), parl = rank === 5 && S.sys !== "pres";
    this.ask(parl ? `Fin de la législature : ${title}, vous menez votre parti aux élections. Y aller ?` : `Fin de votre mandat de ${title}. Se représenter ?`, [
      ...(limit ? [] : [{ label: parl ? "Mener la campagne" : "Se représenter", sub: `Chances ≈ ${Math.round(ch * 100)} % · campagne ≈ ${eur(campaignCost(this, rank))}`, autoWeight: 3, apply: () => { if (this.politics === P && P.rank === rank) runElection(this, rank, true); } }]),
      { label: limit ? `Passer la main (${max === 1 ? "un seul mandat" : `${max} mandats au plus`}${S.consec ? " d’affilée" : ""})` : parl ? "Passer la main à un successeur" : "Ne pas se représenter", sub: "Quitter ce poste la tête haute.", autoWeight: 1, apply: () => { if (this.politics === P && P.rank === rank) this.leaveOffice(`Ne se représente pas ; quitte son poste de ${title}.`); } },
    ]);
  },
  // Une année au sommet : législatives de mi-mandat, fronde de son propre parti.
  topYear(R) {
    const P = this.politics, S = polSystem(this), e = this.g("", "e");
    if (R === "dem" && S.sys === "pres" && S.mid && P.midAt === this.age) {
      const hold = clamp(0.3 + (P.pop - 40) / 80 + clamp((this.econ - 1) * 2, -0.2, 0.2), 0.1, 0.85);
      if (lean(P.side, P.govSide) === 1 && rand() >= hold) {
        setGov(this, rivalOf(this, P.side));
        this.say(this.code === "US" ? "Élections de mi-mandat : le Congrès bascule dans l’opposition ; chaque loi devra se négocier." : "Législatives perdues : c’est la cohabitation ; le gouvernement vient du camp adverse.", "work", true);
      } else if (lean(P.side, P.govSide) === 1) this.say(this.code === "US" ? "Élections de mi-mandat : votre camp garde le Congrès." : "Législatives : votre camp garde la majorité.", "work");
    }
    // Un chef de gouvernement tient tant que son parti le suit : impopulaire, il est renversé de l'intérieur.
    if (R === "dem" && S.sys === "parl" && P.pop < 28 && rand() < 0.15) {
      this.setOffice(3, `Lâché${e} par son parti, au plus bas dans les sondages : un rival prend la tête du parti et du gouvernement.`);
      P.termEnd = this.age + 2;
      this.bump("happy", -10);
    }
  },
  offerMinistry() {
    const P = this.politics, y = this.calYear;
    const pf = pick(PORTFOLIOS.filter(p => y >= (p[2] || 0)));
    const lob = pf[1].map(id => LOBBIES[id].who).join(", ");
    this.ask(`On vous propose de devenir ${ministryOf(pf[0])}. Accepter ?`, [
      { label: "Accepter le ministère", sub: `Bien plus d’influence ; ${lob} vont vous courtiser.`, autoWeight: 3, apply: () => { if (this.politics !== P || P.rank !== 3) return; P.portfolio = pf[0]; this.setOffice(4, `Entre au gouvernement : ${ministryOf(pf[0])}.`); this.bump("happy", 8); this.network += 1; } },
      { label: "Refuser", sub: "Garder son siège et sa liberté de vote.", autoWeight: 1, apply: () => { this.say("Refuse d’entrer au gouvernement.", "work"); P.loyalty = clamp(P.loyalty - 5, 0, 100); } },
    ]);
  },
  apparatusYear(titles) {
    const P = this.politics, a = this.age;
    const max = titles[5] ? 5 : 4;
    if (P.rank < max && P.offerAt !== a) {
      const p = P.rank === 4 ? (P.loyalty > 80 ? 0.003 + (P.patron ? 0.003 : 0) : 0)
        : clamp(0.03 + P.loyalty / 600 + (this.network || 0) / 200 + (P.patron ? 0.04 : 0) + this.stats.know / 1500 - P.rank * 0.01, 0.01, 0.2) * (P.rank === 3 ? 0.5 : 1) * (this.sex === "f" && P.rank >= 2 ? 0.6 : 1);
      if (rand() < p) {
        P.offerAt = a;
        const next = P.rank + 1;
        if (next === 4) P.portfolio = pick(PORTFOLIOS.filter(x => this.calYear >= (x[2] || 0)))[0];
        const t = this.polTitle(next);
        this.ask(`On vous propose une promotion : ${t}. Accepter ?`, [
          { label: "Accepter", sub: "Plus de pouvoir, plus d’ennemis.", autoWeight: 3, apply: () => { if (this.politics === P && P.rank === next - 1) { this.setOffice(next, `Promu${this.g("", "e")} : ${t}.`); this.bump("happy", 5); this.network += 0.5; } } },
          { label: "Décliner", sub: "Rester à l’abri des regards.", autoWeight: 1, apply: () => { P.loyalty = clamp(P.loyalty - 8, 0, 100); this.say("Décline une promotion.", "work"); } },
        ]);
      }
    }
    // La disgrâce : plus on monte, plus on tombe de haut.
    if (P.rank >= 2 && rand() < clamp(0.008 * P.rank + P.dirt * 0.012 - P.loyalty / 4000 - (P.patron ? 0.01 : 0), 0.003, 0.2)) {
      const prison = rand() < 0.3;
      const e = this.g("", "e");
      this.leaveOffice(prison ? `Tombe en disgrâce : arrêté${e}, jugé${e}, emprisonné${e}. On efface son nom des photos officielles.` : `Tombe en disgrâce : écarté${e} de tous ses postes du jour au lendemain.`);
      this.bump("happy", -15); if (prison) this.bump("health", -10);
      P.loyalty = 20; P.dirt *= 0.5; P.patron = false;
    }
  },
  // Un lobby vient frapper à la porte : ce qu'il offre dépend de votre poste et des mœurs du pays.
  lobbyApproach() {
    const P = this.politics, m = median(this.here), inf = this.polInfluence(), corr = corruptionOf(this), R = polRegime(this);
    const ids = lobbiesHere(this);
    const id = weighted(ids.map(i => [i, lobbyPower(this, i) * (1 + Math.max(0, P.lob[i] || 0) / 50)]));
    const B = LOBBIES[id], who = capFirst(B.who), lobFx = d => { P.lob[id] = clamp((P.lob[id] || 0) + d, -100, 100); };
    if (B.people) {
      this.ask(`${who} vous proposent leur soutien, si vous défendez leurs combats.`, [
        { label: "Accepter leur soutien", sub: "Des militants, des voix ; d’autres lobbys le verront d’un mauvais œil.", autoWeight: lean(P.side, B.side) > 0 ? 3 : 1, apply: () => { lobFx(15); P.pop = clamp(P.pop + 3, 0, 100); for (const o of ids) if (!LOBBIES[o].people && LOBBIES[o].side !== B.side) P.lob[o] = clamp((P.lob[o] || 0) - 4, -100, 100); this.say(`Reçoit le soutien ${deLabel(B.who)}.`, "work"); } },
        { label: "Rester à distance", autoWeight: 1, apply: () => { lobFx(-6); this.say(`Garde ses distances avec ${B.who}.`, "work"); } },
      ]);
      return;
    }
    const r = rand(), wanted = BILLS.filter(b => this.calYear >= (b.from || 0) && b.pro.includes(id));
    let kind = r < corr * 0.6 ? "bribe" : r < corr * 0.6 + 0.3 && elected(R) ? "donation" : r < 0.8 ? "perk" : "amend";
    if (kind === "amend" && !wanted.length) kind = "perk";
    const amount = m * inf * (kind === "bribe" ? 0.06 : 0.04) * (0.6 + rand() * 0.8) * (inList(this.code, B.cc) ? 1.5 : 1);
    if (kind === "bribe") {
      this.ask(`${who} demandent à vous voir en privé. Sur la table, une enveloppe : ≈ ${eur(amount)}, pour « faciliter » leurs affaires.`, [
        { label: "Prendre l’enveloppe", sub: `+${eur(amount)} · ils deviennent vos alliés · si ça se sait, c’est le scandale${corr > 0.5 ? " (ici, c’est l’usage)" : ""}`, autoWeight: corr * 2, apply: () => { this.addMoney(amount); lobFx(20); P.dirt += 1 + inf / 40; this.say(`Accepte une enveloppe ${deLabel(B.who)} (${money(amount)}).`, "money"); } },
        { label: "Refuser poliment", sub: "Ils s’en souviendront.", autoWeight: 1.5, apply: () => { lobFx(-8); this.say("Refuse une enveloppe.", "work"); } },
        { label: "Dénoncer la tentative", sub: R === "dem" ? "Popularité en hausse ; un ennemi puissant." : "Courageux ; dangereux ici.", autoWeight: 0.5, apply: () => { lobFx(-30); P.pop = clamp(P.pop + (R === "dem" ? 8 : 3), 0, 100); if (R !== "dem" && rand() < 0.3) { this.bump("health", -5); this.say("Dénonce une tentative de corruption ; quelques jours plus tard, des menaces, puis une agression.", "life", true); } else this.say("Dénonce publiquement une tentative de corruption.", "work", true); } },
      ]);
    } else if (kind === "donation") {
      this.ask(`${who} proposent de financer votre prochaine campagne : ≈ ${eur(amount)}.`, [
        { label: "Accepter le don", sub: "Votre trésor de campagne grossit ; vous leur devez quelque chose.", autoWeight: 2, apply: () => { P.funds += amount; lobFx(10); P.dirt += 0.3; this.say(`Accepte un don de campagne ${deLabel(B.who)}.`, "money"); } },
        { label: "Refuser", sub: "Rester libre.", autoWeight: 1, apply: () => { lobFx(-5); this.say("Refuse un don de campagne.", "work"); } },
      ]);
    } else if (kind === "perk") {
      const trip = pick(["un week-end dans un grand hôtel", "une partie de chasse", "un voyage d’étude tous frais payés", "des places pour la finale", "un dîner dans le meilleur restaurant de la ville"]);
      this.ask(`${who} vous invitent : ${trip}.`, [
        { label: "Accepter l’invitation", sub: "Agréable, et ça crée des liens ; certains journalistes adorent ces histoires.", autoWeight: 2, apply: () => { lobFx(8); this.bump("happy", 2); P.dirt += 0.3; this.say(`Accepte une invitation ${deLabel(B.who)} : ${trip}.`, "life"); } },
        { label: "Décliner", autoWeight: 1, apply: () => { lobFx(-4); this.say("Décline une invitation d’un lobby.", "work"); } },
      ]);
    } else {
      const bill = pick(wanted);
      this.ask(`${who} vous apportent un texte tout prêt, pour défendre ${bill.t}.`, [
        { label: "Le reprendre à votre compte", sub: "Ils vous en seront reconnaissants ; on reconnaîtra peut-être leur plume.", autoWeight: 2, apply: () => { lobFx(14); P.dirt += 0.5; this.say(`Défend un texte écrit par ${B.who} (${bill.t}).`, "work"); if (rand() < 0.4) applyBill(this, bill); } },
        { label: "Le laisser de côté", autoWeight: 1, apply: () => { lobFx(-5); this.say("Laisse de côté un texte écrit par un lobby.", "work"); } },
      ]);
    }
  },
  // Une loi (ou une décision locale) à voter, ou une réforme à porter.
  billOfYear(R) {
    const P = this.politics, rank = P.rank, y = this.calYear;
    if (!elected(R) && rank < 4) return;
    const local = rank <= 2;
    if (rand() > (rank === 1 ? 0.25 : rank === 2 ? 0.5 : 0.65)) return;
    P.recent = P.recent || [];
    let pool = (local ? LOCAL_BILLS : BILLS).filter(b => y >= (b.from || 0) && !P.recent.includes(b.t));
    if (!pool.length) pool = (local ? LOCAL_BILLS : BILLS).filter(b => y >= (b.from || 0));
    let bill = pick(pool);
    if (rank === 4 && P.portfolio) { const pf = PORTFOLIOS.find(x => x[0] === P.portfolio), rel = pool.filter(b => [...b.pro, ...b.con].some(id => pf[1].includes(id))); if (rel.length) bill = pick(rel); }
    P.recent = [bill.t, ...P.recent].slice(0, 6);
    const fx = billFx(this, bill), names = ids => ids.filter(id => y >= (LOBBIES[id].from || 0)).map(id => LOBBIES[id].who);
    const pro = names(bill.pro), con = names(bill.con), w = rank >= 4 ? 2 : local ? 1.2 : 1;
    const opinion = bill.pub >= 2 ? "l’opinion est pour" : bill.pub <= -2 ? "l’opinion est contre" : "l’opinion est partagée";
    const line = local || !bill.side ? 0 : lean(P.side, bill.side);
    const bizNote = fx.n ? ` · vos entreprises : ${fx.gain > 0 ? "+" : "−"}${eur(Math.abs(fx.gain) * 0.4)} de valeur` : "";
    const verb = rank >= 4 ? "Votre gouvernement prépare" : rank === 2 ? "Votre mairie doit trancher sur" : rank === 1 ? "Le conseil municipal vote" : "Le Parlement vote";
    const passOdds = vote => rank >= 4 ? (vote ? (rank === 5 && elected(R) ? execPower(this) : elected(R) ? 0.8 : 0.95) : 0) : local ? (rank === 2 ? (vote ? 1 : 0) : 0.5 + (vote ? 0.1 : -0.1)) : clamp(0.45 + (bill.side ? lean(P.govSide, bill.side) * 0.25 : 0) + (vote ? 0.05 : -0.05), 0.1, 0.9);
    const settle = (vote, abst) => {
      if (this.politics !== P || P.rank !== rank) return;
      if (!abst) {
        const s = vote ? 1 : -1;
        for (const id of bill.pro) if (P.lob[id] != null) P.lob[id] = clamp(P.lob[id] + s * 9 * w, -100, 100);
        for (const id of bill.con) if (P.lob[id] != null) P.lob[id] = clamp(P.lob[id] - s * 9 * w, -100, 100);
        P.pop = clamp(P.pop + s * bill.pub * w * 0.8, 0, 100);
        if (line) P.loyalty = clamp(P.loyalty + (s === line ? 4 : -8), 0, 100);
        if (vote && fx.gain > 0) { P.conflict += fx.gain > median(this.here) * 2 ? 1.5 : 0.7; }
      } else P.pop = clamp(P.pop - 1, 0, 100);
      const passed = rand() < passOdds(vote && !abst);
      if (rank === 2) this.say(`${vote ? "Dit oui à" : "Dit non à"} ${bill.t}.`.replace(" à le ", " au ").replace(" à les ", " aux "), "work");
      else this.say(`${rank >= 4 ? (vote ? "Porte" : "Enterre") : abst ? "S’abstient sur" : vote ? "Vote pour" : "Vote contre"} ${bill.t}${rank >= 4 && !vote ? "" : passed ? " ; le texte est adopté" : " ; le texte est rejeté"}.`, "work", rank >= 3);
      if (passed) applyBill(this, bill);
    };
    const partyLine = line > 0 ? " · votre parti vote pour" : line < 0 ? " · votre parti vote contre" : "";
    const who = `${pro.length ? `Pour : ${pro.join(", ")}` : "Aucun lobby pour"} · ${con.length ? `contre : ${con.join(", ")}` : "aucun lobby contre"} · ${opinion}${partyLine}${bizNote}`;
    if (rank >= 4) this.ask(`${verb} ${bill.t}. La porter ?`, [
      { label: "Porter la réforme", sub: `${who}`, autoWeight: 1 + Math.max(0, line) + (fx.gain > 0 ? 1 : 0), apply: () => settle(true, false) },
      { label: "L’enterrer", sub: "Rien ne change ; ceux qui l’attendaient seront déçus.", autoWeight: 1 + Math.max(0, -line), apply: () => settle(false, false) },
    ]);
    else this.ask(`${verb} ${bill.t}.`, [
      { label: rank === 2 ? "Dire oui" : "Voter pour", sub: who, autoWeight: 1 + Math.max(0, line) * 2 + (bill.pub > 0 ? 1 : 0), apply: () => settle(true, false) },
      { label: rank === 2 ? "Dire non" : "Voter contre", sub: `Les lobbys favorables vous en voudront${line > 0 ? " ; votre parti aussi" : ""}.`, autoWeight: 1 + Math.max(0, -line) * 2 + (bill.pub < 0 ? 1 : 0), apply: () => settle(false, false) },
      ...(rank === 2 ? [] : [{ label: "S’abstenir", sub: "Ne fâcher personne, ne convaincre personne.", autoWeight: 0.5, apply: () => settle(false, true) }]),
    ]);
  },
  // Faveurs acceptées, conflits d'intérêts : la presse, la justice, ou les rivaux.
  scandalCheck(R) {
    const P = this.politics;
    const press = R === "dem" ? 1 : R === "hybrid" ? 0.5 : 0.3;
    const risk = clamp((P.dirt * 0.02 + P.conflict * 0.025) * press * (P.transparent ? 0.6 : 1) * ((P.lob.media || 0) < -30 ? 1.5 : 1), 0, 0.5);
    if (rand() >= risk) return;
    P.scandalAt = this.age;
    const what = P.conflict > P.dirt ? "ses votes en faveur de ses propres entreprises" : "les cadeaux et l’argent reçus de lobbys";
    P.pop = clamp(P.pop - 15 - rand() * 15, 0, 100);
    this.bump("happy", -8);
    if (R !== "dem") {
      this.say(`Une affaire éclate : ${what}. ${elected(R) ? `Ses rivaux s’en servent contre ${this.g("lui", "elle")}.` : "Ses rivaux s’en servent pour régler des comptes."}`, "work", true);
      if (P.rank >= 2 && rand() < 0.4) this.leaveOffice("Perd son poste dans l’affaire.");
      P.dirt *= 0.6; P.conflict *= 0.6;
      return;
    }
    const justice = clamp(this.here.gdp / 40000, 0.3, 1), guilty = clamp(justice * (P.dirt + P.conflict) * 0.1, 0.05, 0.75);
    const verdict = resigned => {
      if (this.politics !== P) return;
      if (rand() < guilty * (resigned ? 0.8 : 1)) {
        const fine = median(this.here) * (0.5 + P.dirt * 0.4);
        this.pay(fine); P.banUntil = this.age + 5; this.bump("happy", -10);
        const jail = P.dirt > 6 && rand() < 0.5;
        if (P.rank > 0) this.leaveOffice();
        this.say(`Condamn${this.g("é", "ée")} : ${money(fine)} d’amende, cinq ans d’inéligibilité${jail ? ", et de la prison ferme" : ""}.`, "work", true);
        if (jail) { this.bump("health", -6); this.bump("rel", -6); }
      } else if (resigned || rand() < 0.5) this.say("L’enquête est classée sans suite.", "work");
      P.dirt *= 0.4; P.conflict *= 0.4;
    };
    this.ask(`Scandale : la presse révèle ${what}. Que faire ?`, [
      ...(P.rank > 0 ? [{ label: "Démissionner", sub: "Perdre son poste, sauver un peu son image ; la justice est souvent plus clémente.", autoWeight: 1, apply: () => { if (this.politics !== P) return; this.leaveOffice("Démissionne après le scandale."); P.pop = clamp(P.pop + 8, 0, 100); verdict(true); } }] : []),
      { label: "Tout nier", sub: "Garder son poste ; l’opinion jugera.", autoWeight: 1.5, apply: () => { if (this.politics !== P) return; P.pop = clamp(P.pop - 5, 0, 100); this.say("Nie tout en bloc.", "work"); verdict(false); } },
      { label: "Contre-attaquer dans les médias", sub: (P.lob.media || 0) > 20 ? "Les grands médias sont de votre côté." : "Risqué sans le soutien des grands médias.", autoWeight: 1, apply: () => { if (this.politics !== P) return; P.pop = clamp(P.pop + ((P.lob.media || 0) > 20 ? 10 : -6), 0, 100); this.say("Contre-attaque : dénonce une cabale.", "work"); verdict(false); } },
    ]);
  },
});
function campaignCost(L, rank) { return median(L.here) * OFFICE[rank].cost; }
const termOf = (L, rank) => rank === 5 ? polSystem(L).term : OFFICE[rank].term;
// Ce que le chef de l'exécutif fait passer : la majorité, la coalition, les contre-pouvoirs, le régime.
function execPower(L) {
  const P = L.politics, R = polRegime(L), S = polSystem(L);
  if (R === "hybrid") return 0.95;
  if (S.sys !== "pres") return clamp(S.power - (S.sys === "parl" && !S.fptp && (campShares(L)[P.side] || 20) < 40 ? 0.15 : 0), 0.3, 0.95);
  return clamp(S.power * (lean(P.side, P.govSide) === 1 ? 1 : 0.55), 0.2, 0.95);
}
function powerNote(L) {
  const P = L.politics, R = polRegime(L), S = polSystem(L), c = L.code, maj = lean(P.side, P.govSide) === 1;
  if (R === "hybrid") return "Les élections se gagnent d’avance et le Parlement obéit : presque tout passe ; le danger vient des rivaux du sérail.";
  if (S.sys === "coll") return "Le Conseil fédéral décide à sept, à tour de rôle à la présidence, et le peuple peut tout défaire par référendum.";
  if (S.sys === "parl") return S.fptp || (campShares(L)[P.side] || 20) >= 40 ? "Votre parti gouverne seul : les lois passent, tant que le parti vous suit. Vous pouvez dissoudre et convoquer des élections." : "Gouvernement de coalition : chaque réforme se négocie avec les partenaires. Vous pouvez dissoudre et convoquer des élections.";
  if (c === "US") return maj ? "Le Congrès est de votre côté : vos réformes passent souvent ; décrets (executive orders), veto, nominations à la Cour suprême." : "Le Congrès est à l’opposition : chaque loi se négocie et beaucoup échouent ; il reste les décrets et le veto.";
  if (c === "FR") return maj ? "Majorité présidentielle : vous fixez le cap, le gouvernement applique ; ordonnances, dissolution, référendum." : "Cohabitation : le gouvernement vient du camp adverse ; il vous reste la diplomatie, la défense et la dissolution.";
  return maj ? "Votre camp tient le Parlement : vous gouvernez, par la loi ou par décret." : "Le Parlement est à l’opposition : vos réformes s'y enlisent ; restent les décrets.";
}
// Une élection nationale. Chaque camp part de son poids dans le pays, avec un aléa (sondages trompeurs) ;
// edge : l'avance ou le retard propre au candidat. Renvoie « win », « first » (éliminé au premier tour) ou « lose ».
// mode : « parl » pour des législatives, même dans un régime présidentiel (dissolution).
function nationalVote(L, side, edge, noise, mode) {
  const S = polSystem(L), sh = campShares(L), sides = Object.keys(sh), v = {};
  sides.forEach((s, i) => { v[s] = Math.max(0.5, sh[s] + noise(i) * (2 + sh[s] * 0.08) + (s === side ? edge : 0)); });
  const sys = mode || S.sys, tot = sides.reduce((t, s) => t + v[s], 0);
  if (sys === "coll") return v[side] / tot * 100 + noise(9) * 3 > 12 ? "win" : "lose";
  if (sys === "pres") {
    const order = sides.slice().sort((a, b) => v[b] - v[a]);
    if (S.rounds === 1 || v[order[0]] > tot / 2) return order[0] === side ? "win" : "lose";
    if (order[0] !== side && order[1] !== side) return "first";
    // Second tour : les électeurs des éliminés se reportent vers le finaliste le plus proche.
    const [a, b] = order;
    let va = v[a], vb = v[b];
    order.slice(2).forEach((s, i) => { const d = lean(s, a) - lean(s, b), toA = clamp((d > 0 ? 0.7 : d < 0 ? 0.3 : 0.5) + noise(5 + i) * 0.2, 0, 1); va += v[s] * toA * 0.8; vb += v[s] * (1 - toA) * 0.8; });
    return (va > vb ? a : b) === side ? "win" : "lose";
  }
  // Scrutin majoritaire : le premier parti gouverne seul. Sinon, le premier parti du bloc le plus fort (lui et ses alliés naturels).
  if (S.fptp) return sides.slice().sort((a, b) => v[b] - v[a])[0] === side ? "win" : "lose";
  const bloc = s => sides.reduce((t, x) => t + (lean(x, s) === 1 ? v[x] : 0), 0);
  return sides.slice().sort((a, b) => bloc(b) - bloc(a) || v[b] - v[a])[0] === side ? "win" : "lose";
}
// L'avance du candidat : popularité, argent, lobbys, réseau ; et l'usure du camp au pouvoir, l'économie.
function candidateEdge(L, incumbent = false) {
  const P = L.politics, side = P.side;
  let e = (P.pop - 50) * 0.18 + lobbySupport(L) * 4 + Math.min(2, P.funds / Math.max(1, campaignCost(L, 5)) * 1.5) + Math.min(1.5, (L.network || 0) * 0.2) + (incumbent ? 1.5 : 0);
  if (P.scandalAt != null && L.age - P.scandalAt <= 3) e -= 6;
  if (L.sex === "f" && L.calYear < 1990) e -= 3;
  if (polRegime(L) === "dem") {
    const yrs = P.govSince != null ? L.calYear - P.govSince : 0, econ = clamp((L.econ - 1) * 30, -6, 6);
    e += P.govSide === side ? econ - Math.min(6, yrs * 0.6) : Math.min(4, yrs * 0.4) - econ / 2;
  }
  return e;
}
function generalChance(L, edge, mode) {
  const side = L.politics.side, n = 400;
  let w = 0;
  for (let k = 0; k < n; k++) if (nationalVote(L, side, edge, i => NORM[(k * 10 + i) % NORM.length], mode) === "win") w++;
  return clamp(w / n, 0.01, 0.97);
}
// L'investiture : être le candidat (ou le chef) de son parti. Plus le parti est grand, plus il y a de prétendants.
function nominationChance(L) {
  const P = L.politics, R = polRegime(L), S = polSystem(L);
  if (R === "hybrid") {
    if (P.side !== "pouvoir") return 0.6;
    const z = (P.loyalty - 75) / 8 + (P.patron ? 1 : 0) + (P.rank === 4 ? 1 : 0);
    return clamp(Math.exp(z) / (Math.exp(z) + 6), 0.01, 0.9);
  }
  const rivals = clamp((campShares(L)[P.side] || 5) / 10, 1, 5);
  let z = (P.pop - 50) / 15 + Math.min(1.5, (L.network || 0) * 0.15) + (P.rank === 4 || P.former >= 4 ? 0.7 : 0) + lobbySupport(L);
  if (S.pick === "primary") z += Math.min(1.5, P.funds / Math.max(1, campaignCost(L, 5)) * 1.2) + (P.lob.media || 0) / 80;
  else if (S.pick === "members") z += (P.loyalty - 50) / 30 + Math.min(0.6, P.funds / Math.max(1, campaignCost(L, 5)) * 0.5);
  else z += (P.loyalty - 50) / 15;
  if (P.scandalAt != null && L.age - P.scandalAt <= 3) z -= 1.5;
  return clamp(Math.exp(z) / (Math.exp(z) + rivals), 0.02, 0.97);
}
// Les chances au sommet : l'investiture, puis l'élection elle-même.
function topOdds(L, incumbent = false) {
  const nom = incumbent ? 1 : nominationChance(L), gen = generalChance(L, candidateEdge(L, incumbent));
  return { nom, gen, total: nom * gen };
}
function electionChance(L, rank, incumbent = false) {
  const P = L.politics, R = polRegime(L);
  if (rank === 5) return topOdds(L, incumbent).total;
  let p = [0, 0.45, 0.25, 0.15, 0][rank] + (incumbent ? 0.12 : 0);
  p += (P.pop - 40) / 170;
  p += Math.min(0.12, P.funds / Math.max(1, campaignCost(L, rank)) * 0.06);
  p += lobbySupport(L) * 0.12;
  p += Math.min(0.1, (L.network || 0) * 0.015);
  if (R === "hybrid") p += P.side === "pouvoir" ? 0.3 : -0.2;
  // L'étiquette compte : un grand parti porte ses candidats, un petit les laisse seuls.
  const sh = campShares(L)[P.side];
  if (R === "dem" && sh != null) p += (sh - 30) / (rank >= 3 ? 150 : 300);
  if (P.side === "ind") p -= rank >= 3 ? 0.12 : 0.04;
  if (L.sex === "f" && L.calYear < 1990) p -= 0.08;
  if (P.scandalAt != null && L.age - P.scandalAt <= 2) p -= 0.15;
  return clamp(p, 0.02, 0.85);
}
const NOM_LOST = { primary: "Perd la primaire de son parti", members: "Les adhérents du parti choisissent un autre candidat", caucus: "Les parlementaires du parti lui préfèrent un rival", congress: "Le congrès du parti investit un rival" };
const NOM_WON = { primary: "Remporte la primaire de son parti", members: "Désigné$ par les adhérents du parti", caucus: "Élu$ à la tête du parti par ses parlementaires", congress: "Investi$ par le congrès du parti" };
// Une élection, qui se joue l'année même : la campagne se paie d'abord sur le trésor de campagne.
function runElection(L, rank, incumbent = false) {
  const P = L.politics, cost = campaignCost(L, rank), title = L.polTitle(rank), e = L.g("", "e"), S = polSystem(L), R = polRegime(L);
  // Les lobbys amis financent, les lobbys hostiles font campagne contre vous.
  let gift = 0;
  for (const id of lobbiesHere(L)) if (!LOBBIES[id].people && (P.lob[id] || 0) >= 30) gift += median(L.here) * 0.04 * lobbyPower(L, id) * rank;
  if (gift > 0) { P.funds += gift; P.dirt += 0.1; }
  const hostile = lobbiesHere(L).filter(id => (P.lob[id] || 0) <= -40 && lobbyPower(L, id) >= 2).map(id => LOBBIES[id].who);
  const pay = part => { const c = cost * part, f = Math.min(P.funds, c); P.funds -= f; if (c > f) L.pay(c - f); };
  L.bump("health", -1); L.bump("rel", -1);
  const extra = `${gift > 0 ? ` Des lobbys amis ont financé la campagne (${money(gift)}).` : ""}${hostile.length ? ` ${capFirst(hostile.join(", "))} ont fait campagne contre ${L.g("lui", "elle")}.` : ""}`;
  let win, first = false, odds;
  if (rank === 5) {
    // Le sommet se joue en deux temps : être investi par son parti, puis gagner le pays.
    const o = topOdds(L, incumbent);
    odds = incumbent ? `chances ${Math.round(o.gen * 100)} %` : `investiture ${Math.round(o.nom * 100)} %, élection ${Math.round(o.gen * 100)} %`;
    if (!incumbent) {
      pay(0.3);
      const how = R === "hybrid" ? null : S.pick;
      if (rand() >= o.nom) {
        L.bump("happy", -5); P.pop = clamp(P.pop - 2, 0, 100);
        L.say(`${how ? NOM_LOST[how] : P.side === "pouvoir" ? "Le chef désigne un autre successeur" : "L’opposition se range derrière un autre candidat"} pour l’élection : ${title}.${extra}`, "work", true);
        return `Pas investi${e} (${odds})`;
      }
      L.say(`${how ? NOM_WON[how].replace("$", e) : P.side === "pouvoir" ? `Désigné${e} comme successeur par le pouvoir` : `Candidat${e} unique de l’opposition`} : ${S.sys === "pres" ? "en route pour l’élection" : S.sys === "coll" ? "candidat$ du parti devant l’Assemblée fédérale".replace("$", e) : "en tête de liste pour les législatives"}.`, "work", true);
      pay(0.7);
    } else pay(1);
    const r = nationalVote(L, P.side, candidateEdge(L, incumbent), () => randn());
    win = r === "win"; first = r === "first";
  } else {
    const ch = electionChance(L, rank, incumbent);
    odds = `chances ${Math.round(ch * 100)} %`;
    pay(1);
    win = rand() < ch;
  }
  if (win) {
    if (rank === 5) {
      P.topTerms = (P.topTerms || 0) + 1; setGov(L, P.side); P.cycle = L.calYear % 5;
      P.midAt = S.mid ? L.age + Math.floor(S.term / 2) : null;
    }
    if (incumbent) { P.termEnd = L.age + termOf(L, rank); P.history.push({ y: L.calYear, t: `${capFirst(title)} (réélu${e})` }); L.say(`Réélu${e} : ${title}.${extra}`, "work", true); }
    else L.setOffice(rank, `Élu${e} : ${title} !${extra}`);
    L.bump("happy", rank >= 3 ? 10 : 6); L.network += rank * 0.3; P.pop = clamp(P.pop + 5, 0, 100);
    return `Élu${e} : ${title} (${odds})`;
  }
  L.bump("happy", -6); P.pop = clamp(P.pop - 4, 0, 100);
  if (rank === 5 && S.sys !== "pres") {
    // Législatives perdues : l'adversaire gouverne ; le chef de parti garde (ou retrouve) son siège.
    setGov(L, rivalOf(L, P.side));
    if (incumbent) { L.setOffice(3, `Perd les législatives : quitte la tête du gouvernement, redevient ${L.polTitle(3)}.${extra}`); P.termEnd = L.age + termOf(L, 3); return "Battu."; }
    L.say(`Mène son parti aux législatives : c’est l’adversaire qui l’emporte.${extra}`, "work", true);
    return `Battu${e} (${odds})`;
  }
  if (incumbent) { L.leaveOffice(`Battu${e} : perd son poste de ${title}.${extra}`); return "Battu."; }
  L.say(rank === 5 ? `Candidat${e} à l’élection présidentielle, ${first ? `éliminé${e} au premier tour` : S.rounds === 2 ? `battu${e} au second tour` : `battu${e}`}.${extra}` : `Candidat${e} au poste de ${title}, ${L.g("battu", "battue")}.${extra}`, "work", true);
  return `Battu${e} (${odds})`;
}
// À quel poste peut-on se présenter, ici et maintenant.
function nextRace(L) {
  const P = L.politics, R = polRegime(L), titles = officeTitles(L, R), S = polSystem(L);
  if (!elected(R) || P.rank === 5) return null;
  const wait = r => { const t = (P.tried || {})[r], gap = r === 5 ? S.term : 3; return t != null && L.age - t < gap ? `prochaine élection dans ${gap - (L.age - t)} an${gap - (L.age - t) > 1 ? "s" : ""}` : ""; };
  if (P.rank < 3) return { rank: P.rank + 1, why: P.rank + 1 === 3 && P.side === "ind" ? "sans parti, personne ne vous investit aux élections nationales" : wait(P.rank + 1) };
  if (!titles[5]) return null;
  const why = L.age < S.minAge ? `à partir de ${S.minAge} ans` : L.age > 75 ? "trop âgé pour une campagne nationale".replace("âgé", L.g("âgé", "âgée"))
    : P.side === "ind" ? "il faut un parti" : (P.topTerms || 0) >= S.limit + (P.extraTerms || 0) && !S.consec ? "vous avez déjà fait le nombre maximal de mandats" : wait(5);
  return { rank: 5, why };
}
// Comment on arrive au sommet, ici : le texte du panneau.
function systemNote(L) {
  const P = L.politics, R = polRegime(L), S = polSystem(L), title = capFirst(L.polTitle(5)), sh = campShares(L), e = L.g("", "e");
  const how = R === "hybrid" ? `${title} : les élections se gagnent d’avance ; le pouvoir désigne son candidat`
    : S.sys === "coll" ? "Le Conseil fédéral : sept membres élus par le Parlement ; les grands partis y ont chacun leur place"
    : S.sys === "parl" ? `${title} : le chef du parti qui gagne les législatives (ou du bloc le plus fort)`
    : `${title} : élu${e} au suffrage universel${L.code === "US" ? " indirect (grands électeurs), à un tour" : S.rounds === 2 ? ", à deux tours" : ", à un tour"}`;
  const pick = R === "hybrid" ? "" : ` · investiture : ${PICK_LABEL[S.pick]}`;
  const term = ` · mandat de ${S.term} ans${S.limit === Infinity ? ", sans limite" : S.limit === 1 ? (S.consec ? ", pas deux de suite" : ", un seul") : `, ${S.limit} ${S.consec ? "d’affilée " : ""}au plus`}`;
  const top = Object.keys(sh).sort((a, b) => sh[b] - sh[a])[0];
  const mine = P && sh[P.side] != null ? ` · votre camp pèse ≈ ${sh[P.side]} % des voix${P.side === top ? " (premier parti)" : ""}` : "";
  return `${how}${pick}${term}${mine}.`;
}

// --- Les gestes de l'année (panneau « Dépenser et investir ») --------------------------------
function polOptions(L) {
  const P = L.politics, out = [];
  const add = (id, label, sub, ok = true, why = "") => out.push({ id, label, sub, ok: ok && (P ? (P.did || {})[id] !== L.age : true), why: P && (P.did || {})[id] === L.age ? "déjà cette année" : why });
  if (!P) return out;
  const R = polRegime(L), m = median(L.here), a = L.age, inf = L.polInfluence();
  const race = nextRace(L);
  if (race) {
    const cost = campaignCost(L, race.rank), title = L.polTitle(race.rank), S = polSystem(L);
    const banned = P.banUntil != null && a < P.banUntil;
    // Au sommet, deux étapes : l'investiture par le parti, puis l'élection.
    const o = race.rank === 5 ? topOdds(L) : null, chances = o ? `Investiture (${R === "hybrid" ? (P.side === "pouvoir" ? "le chef choisit" : "l’opposition s’unit") : PICK_LABEL[S.pick]}) ≈ ${Math.round(o.nom * 100)} % · puis ${S.sys === "pres" ? "élection" : S.sys === "coll" ? "vote du Parlement" : "législatives"} ≈ ${Math.round(o.gen * 100)} % · au total ≈ ${Math.max(1, Math.round(o.total * 100))} %` : `Chances ≈ ${Math.round(electionChance(L, race.rank) * 100)} %`;
    add("run", race.rank === 5 && S.sys === "parl" ? `Briguer la tête du parti et mener les législatives pour devenir ${title}` : race.rank === 5 && S.sys === "coll" ? `Briguer un siège : ${title}` : `Se présenter : ${title}`, `${chances} · campagne ≈ ${eur(cost)}${P.funds > 0 ? ` (trésor : ${eur(P.funds)})` : ""}${OFFICE[race.rank].full && !OFFICE[P.rank].full && L.job ? " · à plein temps : vous quittez votre emploi" : ""}`,
      !race.why && !banned && L.age >= 18 && P.funds + Math.max(0, L.savings) >= cost && womenCanRun(L), banned ? `inéligible jusqu’à ${P.banUntil} ans` : L.age < 18 ? "candidat à partir de 18 ans".replace("candidat", L.g("candidat", "candidate")) : !womenCanRun(L) ? "les femmes ne peuvent pas encore être élues ici : militer, c’est aussi réclamer ce droit" : race.why || "pas assez d’argent pour la campagne");
  }
  if (elected(R)) {
    add("field", "Aller sur le terrain", "Marchés, porte-à-porte, réunions publiques · popularité +3 à +7 · fatigue");
    add("funds", "Organiser un dîner de levée de fonds", `≈ ${eur(m * (0.2 + inf / 25))} pour votre trésor de campagne · les donateurs attendront un retour`);
    if (L.calYear >= 1925) add("media", L.calYear >= 1950 ? "Passer à la télévision" : "Parler à la radio", "Popularité : tout dépend de votre prestation");
    if (P.side !== "ind" && P.side !== "opposition") add("line", "Suivre la ligne du parti", "Loyauté +8 ; utile pour être investi et nommé ministre");
    if (R === "dem" && P.rank >= 1) add("transp", "Publier son patrimoine et ses rendez-vous avec les lobbys", "Popularité +4, moins de risques de scandale ; les lobbys apprécient moins", !P.transparent, "déjà fait");
    if (R === "dem") add("switch", "Changer de parti", "Popularité −4, loyauté remise à zéro ; un ministre quitte le gouvernement");
  } else if (P.side !== "opposition") {
    add("loyal", R === "party" ? "Montrer sa loyauté au parti" : "Montrer sa fidélité au régime", "Loyauté +10 : promotions plus probables, disgrâce moins probable");
    add("patron", "Cultiver un protecteur haut placé", `Cadeaux et services ≈ ${eur(m * 0.2)} · promotions plus faciles, un parapluie en cas d’ennui`, !P.patron && L.savings >= m * 0.2, P.patron ? "vous avez déjà un protecteur" : "pas assez d’argent");
  } else {
    add("field", R === "colony" ? "Organiser un meeting pour l’indépendance" : "Distribuer des tracts, réunir des opposants", "Popularité +, mais la police surveille");
  }
  // Les pouvoirs du sommet, selon le pays.
  if (P.rank === 5 && elected(R)) {
    const S = polSystem(L);
    if (S.sys === "pres" || R === "hybrid") add("decree", L.code === "US" ? "Signer un décret présidentiel (executive order)" : L.code === "FR" ? "Légiférer par ordonnances" : "Gouverner par décret", `Sans passer par le Parlement : vos alliés applaudissent${R === "dem" ? ", mais un juge peut l’annuler" : ""}`);
    if (R === "dem" && (S.sys === "parl" || (L.code === "FR" && S.sys === "pres"))) {
      const ch = generalChance(L, candidateEdge(L, true), "parl");
      add("dissolve", S.sys === "pres" ? "Dissoudre l’Assemblée nationale" : "Provoquer des élections anticipées", `Victoire ≈ ${Math.round(ch * 100)} % : ${S.sys === "pres" ? "une majorité pour gouverner ; sinon, la cohabitation" : "un nouveau mandat ; sinon, l’opposition gouverne"}`);
    }
    // Un mandat de plus : au dernier mandat permis, là où la Constitution se révise (pas aux États-Unis).
    if (S.sys === "pres" && L.code !== "US" && S.limit !== Infinity && (P.topTerms || 0) >= S.limit + (P.extraTerms || 0))
      add("constitution", "Réviser la Constitution pour un mandat de plus", R === "dem" ? `Référendum ≈ ${Math.round(clamp(P.pop / 140, 0.05, 0.6) * 100)} % · popularité −6 : on parle de dérive` : "Le Parlement vote ce qu’on lui demande ; les opposants protestent");
  }
  if (P.rank >= 2 && (L.businesses || []).length) add("favor", "Faire passer une mesure favorable à vos entreprises", "Bénéfices +6 à +12 % · conflit d’intérêts : gros risque de scandale");
  add("quit", "Quitter la vie politique", P.rank > 0 ? `Vous laissez votre poste de ${L.polTitle()}.` : "Rendre sa carte.");
  return out;
}
function polAction(L, id, arg) {
  const P = L.politics;
  if (!L.alive) return null;
  if (id === "bizlobby") return bizLobby(L, +arg || 0);
  if (id === "enter") { const why = polJoinWhy(L); return why ? `Impossible : ${why}.` : L.joinPolitics(arg); }
  if (!P) return null;
  if (id === "meet" || id === "snub" || id === "join") return lobbyAction(L, id, arg);
  const o = polOptions(L).find(x => x.id === id);
  if (!o || !o.ok) return o ? `Impossible : ${o.why}.` : null;
  P.did = P.did || {}; P.did[id] = L.age;
  const R = polRegime(L), m = median(L.here), inf = L.polInfluence();
  switch (id) {
    case "run": { const race = nextRace(L); P.tried = P.tried || {}; P.tried[race.rank] = L.age; return runElection(L, race.rank); }
    case "field": { const d = (3 + rand() * 4) * (1 - P.pop / 120); P.pop = clamp(P.pop + d, 0, 100); L.bump("health", -1); L.bump("rel", -1); L.network += 0.2; L.say(R === "colony" || P.side === "opposition" && !elected(R) ? "Réunit des militants en secret, distribue des tracts." : pick(["Fait les marchés et serre des centaines de mains.", "Fait du porte-à-porte tout le week-end.", "Tient une réunion publique dans une salle comble."]), "work"); if (P.side === "opposition" && R !== "dem" && rand() < 0.15) { L.bump("happy", -6); L.say("La police disperse la réunion ; quelques nuits au poste.", "life", true); } return `Popularité +${Math.round(d)}`; }
    case "funds": { const x = m * (0.2 + inf / 25); P.funds += x; for (const k of ["bank", "retail", "build"]) if (P.lob[k] != null) P.lob[k] = clamp(P.lob[k] + 3, -100, 100); P.dirt += 0.05; L.say("Organise un dîner de levée de fonds avec de riches donateurs.", "work"); return `Trésor de campagne +${eur(x)}`; }
    case "media": { let d = randn() * 6 + 2 + (P.lob.media || 0) / 25; if (d > 0) d *= 1 - P.pop / 120; P.pop = clamp(P.pop + d, 0, 100); L.say(d > 0 ? "Passe à la télévision ; la prestation est remarquée." : "Passe à la télévision ; une phrase malheureuse tourne en boucle.", "work", Math.abs(d) > 8); return d > 0 ? `Popularité +${Math.round(d)}` : `Popularité ${Math.round(d)}`; }
    case "line": P.loyalty = clamp(P.loyalty + 8, 0, 100); L.say("Vote comme le parti le demande, défend ses positions sur les plateaux.", "work"); return "Loyauté +8";
    case "loyal": P.loyalty = clamp(P.loyalty + 10, 0, 100); L.say(R === "party" ? "Assiste à toutes les réunions, récite les slogans, dénonce les tièdes." : "Multiplie les marques de fidélité au régime.", "work"); return "Loyauté +10";
    case "patron": L.pay(m * 0.2); P.patron = true; L.network += 1; L.say("Se trouve un protecteur haut placé, à force de cadeaux et de services.", "work"); return "Un protecteur veille sur vous.";
    case "transp": P.transparent = true; P.pop = clamp(P.pop + 4, 0, 100); for (const k in P.lob) if (!LOBBIES[k].people) P.lob[k] = clamp(P.lob[k] - 5, -100, 100); L.say("Publie son patrimoine et la liste de ses rendez-vous avec les lobbys.", "work", true); return "Popularité +4";
    case "switch": {
      const others = partiesFor(L).filter(p => p.id !== P.side);
      const p = others.find(x => x.id === arg) || pick(others);
      P.side = p.id; P.party = p.label; P.loyalty = 30; P.pop = clamp(P.pop - 4, 0, 100);
      if (P.rank === 4) { L.setOffice(3); P.termEnd = L.age + 2; }
      L.say(`Change de parti : ${p.label.charAt(0).toLowerCase() + p.label.slice(1)}.`, "work", true); return `Nouveau parti : ${p.label}`;
    }
    case "favor": {
      const g = 0.06 + rand() * 0.06;
      for (const b of L.businesses || []) b.mult *= 1 + g;
      P.conflict += 2; P.dirt += 1;
      L.say("Fait passer en douce une mesure taillée pour ses propres entreprises.", "money"); return `Bénéfices +${Math.round(g * 100)} %`;
    }
    case "decree": {
      for (const k in P.lob) if (LOBBIES[k].side === P.side || (P.side === "pouvoir" && !LOBBIES[k].people)) P.lob[k] = clamp(P.lob[k] + 8, -100, 100);
      const d = randn() * 3 - (R === "dem" ? 1 : 0);
      P.pop = clamp(P.pop + d, 0, 100);
      if (R === "dem" && rand() < 0.25) { L.say(`Signe un décret ; ${L.code === "US" ? "la Cour suprême" : L.code === "FR" ? "le Conseil d’État" : "la justice"} le suspend.`, "work", true); return "Décret annulé par les juges"; }
      L.say("Gouverne par décret, sans passer par le Parlement.", "work", true); return `Vos alliés applaudissent · popularité ${d >= 0 ? "+" : ""}${Math.round(d)}`;
    }
    case "dissolve": {
      const S = polSystem(L), pres = S.sys === "pres", e = L.g("", "e");
      const won = nationalVote(L, P.side, candidateEdge(L, true), () => randn(), "parl") === "win";
      L.bump("health", -1);
      if (won) {
        setGov(L, P.side); P.pop = clamp(P.pop + 3, 0, 100);
        if (!pres) P.termEnd = L.age + S.term;
        L.say(pres ? "Dissout l’Assemblée : les électeurs lui donnent une majorité." : "Pari gagné : les élections anticipées lui donnent un nouveau mandat.", "work", true);
        return pres ? "Majorité retrouvée" : "Nouveau mandat";
      }
      setGov(L, rivalOf(L, P.side)); P.pop = clamp(P.pop - 5, 0, 100);
      if (pres) { L.say("Dissout l’Assemblée et perd : c’est la cohabitation.", "work", true); return "Cohabitation"; }
      L.setOffice(3, `Pari perdu : les élections anticipées portent l’opposition au pouvoir ; redevient ${L.polTitle(3)}.`); P.termEnd = L.age + termOf(L, 3);
      return `Battu${e} aux élections anticipées`;
    }
    case "constitution": {
      if (R === "dem") {
        P.pop = clamp(P.pop - 6, 0, 100);
        if (rand() >= clamp(P.pop / 140, 0.05, 0.6)) { L.say("Le référendum pour un mandat de plus est rejeté.", "work", true); return "Référendum perdu"; }
      } else P.pop = clamp(P.pop - 3, 0, 100);
      P.extraTerms = (P.extraTerms || 0) + 1;
      L.say(R === "dem" ? "Le référendum passe : la Constitution l’autorise à briguer un mandat de plus." : "Fait réviser la Constitution pour rester au pouvoir.", "work", true);
      return "Un mandat de plus possible";
    }
    case "quit": L.quitPolitics("Quitte la vie politique."); return "Fin de la carrière politique.";
  }
  return null;
}
// Recevoir un lobby, le tenir à distance, ou aller travailler pour lui (après un mandat).
function lobbyAction(L, id, lob) {
  const P = L.politics, B = LOBBIES[lob];
  if (!B || P.lob[lob] == null) return null;
  P.did = P.did || {};
  const key = `${id}:${lob}`;
  if (P.did[key] === L.age) return "Déjà cette année.";
  if (id === "join") {
    if (!(P.former >= 3 && P.rank <= 1 && P.lob[lob] >= 25 && !L.retired)) return "Impossible pour l’instant.";
    P.did[key] = L.age;
    if (L.job) L.say(`Quitte son emploi (${L.job}).`, "work");
    L.job = `conseiller en affaires publiques (${B.label.toLowerCase()})`.replace("conseiller", L.g("conseiller", "conseillère"));
    L.jobInfo = { id: "lobbyist", sector: "serv" }; L.homemaker = false;
    L.incomePct = clamp(0.88 + P.former * 0.02, 0.5, 0.99); P.dirt += 0.5;
    L.say(`Passe de l’autre côté : met son carnet d’adresses au service ${deLabel(B.who)}.`, "work", true);
    return `Nouveau métier : ${L.job}`;
  }
  P.did[key] = L.age;
  const inf = L.polInfluence();
  if (id === "meet") {
    P.lob[lob] = clamp(P.lob[lob] + 8 + inf / 10, -100, 100);
    if (!B.people && elected(polRegime(L))) { const x = median(L.here) * inf * 0.01; P.funds += x; P.dirt += 0.05; }
    L.say(`Reçoit ${B.who}${B.people ? "" : ", qui plaident leur cause"}.`, "work");
    return `${B.label} : ${relLabel(P.lob[lob])}`;
  }
  P.lob[lob] = clamp(P.lob[lob] - 12, -100, 100);
  if (!B.people && lobbyPower(L, lob) >= 2) P.pop = clamp(P.pop + 1, 0, 100);
  L.say(`Refuse de recevoir ${B.who}.`, "work");
  return `${B.label} : ${relLabel(P.lob[lob])}`;
}
// Le chef d'entreprise fait, lui aussi, du lobbying : financer le lobby de son secteur.
function bizLobby(L, i) {
  const b = (L.businesses || [])[i];
  if (!b || (b.size || 0) < 1) return null;
  if (b.lobbyAt === L.age) return "Déjà cette année.";
  const m = median(L.here), cost = m * (0.3 + (b.size || 0) * 0.6);
  if (L.savings < cost) return "Pas assez d’argent.";
  b.lobbyAt = L.age; L.pay(cost);
  const P = L.politics, R = polRegime(L);
  const p = clamp(0.35 + (b.size || 0) * 0.1 + (L.network || 0) * 0.02 + corruptionOf(L) * 0.2, 0.1, 0.8);
  if (P) { P.conflict += 1; }
  if (rand() < p) {
    const g = 0.04 + rand() * 0.06 + (b.size || 0) * 0.01;
    b.mult *= 1 + g;
    L.say(`Finance le lobby de son secteur (${domainOf(b).toLowerCase()}) : une règle sur mesure passe (${b.label.toLowerCase()}).`, "money", true);
    return `Bénéfices +${Math.round(g * 100)} %`;
  }
  if (rand() < (R === "dem" ? 0.15 : 0.05)) { b.mult *= 0.95; L.say("Le lobbying de son entreprise fait scandale ; l’image de la marque en souffre.", "money", true); return "Scandale : bénéfices −5 %"; }
  L.say("Finance le lobby de son secteur, sans résultat cette année.", "money");
  return "Sans résultat.";
}

// La page « Votre carrière politique », et l'influence de vos entreprises.
// full : le panneau « Politique » (s'engager, ou mener sa carrière) ; sinon, seulement l'influence des entreprises.
function politicsHtml(L, full = false) {
  const P = full ? L.politics : null, bigBiz = (L.businesses || []).map((b, i) => [b, i]).filter(([b]) => (b.size || 0) >= 1);
  if (!full && !bigBiz.length) return "";
  const bar = v => `<span class="sp-bar"><i style="width:${clamp(v, 0, 100)}%"></i></span>`;
  let html = `<div class="sp">`;
  if (full && !P) {
    const R = polRegime(L), why = polJoinWhy(L);
    html += `<p class="sp-head">S’engager en politique</p>
    <p class="sp-note" style="margin-top:0">${esc(REGIME_NOTE[R])} Ouvert à tous, quel que soit votre métier : on milite à côté de son travail, de ses études ou de sa retraite. Seuls les mandats à plein temps (maire, député, ministre…) remplacent l’emploi, et c’est vous qui décidez de vous présenter, dès 18 ans.${elected(R) && !womenCanRun(L) ? " Les femmes ne peuvent pas encore être élues ici : on peut militer quand même, et réclamer ce droit." : ""} Ne compte pas parmi les trois actions de l’année.</p>
    <div class="sp-pills">${partiesFor(L, R).map(p => `<button class="sp-pill" data-pol="enter" data-arg="${p.id}"${why ? " disabled" : ""}>Rejoindre : ${esc(p.label.charAt(0).toLowerCase() + p.label.slice(1))} <span>${esc(why || p.sub)}</span></button>`).join("")}</div>`;
  }
  if (P) {
    const R = polRegime(L), inf = L.polInfluence(), opts = polOptions(L), titles = officeTitles(L, R);
    const gov = R === "dem" ? ` · majorité : ${SIDE_LABEL[P.govSide]}${lean(P.side, P.govSide) === 1 && P.side !== "ind" ? " (votre camp)" : ""}` : "";
    html += `<p class="sp-head">Votre carrière politique</p>
    <div class="sp-card"><div class="sp-main"><b>${esc(capFirst(P.rank > 0 ? L.polTitle() : titles[0] ? L.g(titles[0][0], titles[0][1]) : ""))} · ${esc(P.party)}</b>
      <small>Popularité ${Math.round(P.pop)}/100 ${bar(P.pop)} · influence ${inf}/100 ${bar(inf)} · loyauté ${Math.round(P.loyalty)}/100</small>
      <small>${esc(REGIME_NOTE[R])}${gov}${P.termEnd != null && P.rank > 0 ? ` · mandat jusqu’à ${P.termEnd} ans` : ""}${P.funds >= 1 ? ` · trésor de campagne ≈ ${eur(P.funds)}` : ""}${P.banUntil != null && L.age < P.banUntil ? ` · inéligible jusqu’à ${P.banUntil} ans` : ""}</small>
      ${elected(R) && titles[5] ? `<small>${esc(systemNote(L))}</small>` : ""}
      ${P.rank === 5 && elected(R) ? `<small>Vos pouvoirs : ${esc(powerNote(L))}</small>` : ""}
      ${P.history.length ? `<small>Parcours : ${P.history.slice(-6).map(h => `${esc(h.t)} (${h.y})`).join(" · ")}</small>` : ""}</div></div>
    <div class="sp-pills">${opts.filter(o => o.id !== "switch").map(o => `<button class="sp-pill" data-pol="${o.id}"${o.ok ? "" : " disabled"}>${esc(o.label)} <span>${esc(o.ok ? o.sub : o.why)}</span></button>`).join("")}</div>
    ${(sw => sw ? `<details class="sp-more"><summary>Changer de parti <small>${esc(sw.ok ? sw.sub : sw.why)}</small></summary><div class="sp-pills">${partiesFor(L).filter(p => p.id !== P.side).map(p => `<button class="sp-pill" data-pol="switch" data-arg="${p.id}"${sw.ok ? "" : " disabled"}>Rejoindre : ${esc(p.label.charAt(0).toLowerCase() + p.label.slice(1))} <span>${esc(p.sub)}</span></button>`).join("")}</div></details>` : "")(opts.find(o => o.id === "switch"))}
    <p class="sp-head">Les lobbys</p>
    <p class="sp-note" style="margin-top:0">Plus votre poste est haut, plus ils vous courtisent : un maire intéresse les promoteurs, un ministre les lobbys de son ministère, un chef de gouvernement tout le monde. Leur soutien finance vos campagnes ; leur hostilité vous coûte des voix.</p>
    <div class="sp-pills">${lobbiesHere(L).sort((x, y) => lobbyPower(L, y) - lobbyPower(L, x)).map(id => { const B = LOBBIES[id], r = P.lob[id] || 0, w = lobbyPower(L, id), done = (P.did || {})[`meet:${id}`] === L.age;
      return `<button class="sp-pill" data-pol="meet" data-arg="${id}"${done ? " disabled" : ""}>Recevoir : ${esc(B.label)} <span>${relLabel(r)} (${r > 0 ? "+" : ""}${Math.round(r)}) · poids ${w >= 5 ? "énorme" : w >= 2.5 ? "fort" : w >= 1 ? "moyen" : "faible"} pour vous${B.dom.length ? ` · défend : ${B.dom.slice(0, 3).join(", ").toLowerCase()}` : ""}</span></button>`; }).join("")}</div>
    <details class="sp-more"><summary>Tenir un lobby à distance${P.former >= 3 && P.rank <= 1 ? ", ou travailler pour lui" : ""}</summary><div class="sp-pills">${lobbiesHere(L).map(id => `<button class="sp-pill" data-pol="snub" data-arg="${id}">Refuser de recevoir : ${esc(LOBBIES[id].label)} <span>relation −12</span></button>${P.former >= 3 && P.rank <= 1 && (P.lob[id] || 0) >= 25 && !L.retired ? `<button class="sp-pill" data-pol="join" data-arg="${id}">Travailler pour eux : ${esc(LOBBIES[id].label)} <span>Un salaire très confortable ; on parlera de pantouflage</span></button>` : ""}`).join("")}</div></details>
    <p class="sp-note">Chaque geste, une fois par an. Les élections de fin de mandat, les nominations, les lois à voter et les offres des lobbys arrivent d’elles-mêmes, comme des décisions. Enveloppes, cadeaux et votes pour vos propres entreprises finissent parfois en scandale, d’autant plus vite que la presse est libre.</p>`;
  }
  if (bigBiz.length) {
    const m = median(L.here);
    html += `<p class="sp-head">L’influence de vos entreprises</p>
    <div class="sp-pills">${bigBiz.map(([b, i]) => `<button class="sp-pill" data-pol="bizlobby" data-arg="${i}"${b.lobbyAt === L.age || L.savings < m * (0.3 + (b.size || 0) * 0.6) ? " disabled" : ""}>Financer le lobby de son secteur : ${esc(b.label)} <span>${b.lobbyAt === L.age ? "déjà cette année" : `≈ ${eur(m * (0.3 + (b.size || 0) * 0.6))} · une règle sur mesure, bénéfices en hausse${P ? " · conflit d’intérêts pour un élu" : ""}`}</span></button>`).join("")}</div>
    <p class="sp-note">Une PME ou plus peut financer le lobby de son domaine (${esc([...new Set(bigBiz.map(([b]) => domainOf(b).toLowerCase()))].join(", "))}) : plus l’entreprise est grande, plus elle pèse.</p>`;
  }
  return html + `</div>`;
}

// --- Branchements ------------------------------------------------------------------------------
{
  const year = Life.prototype.passionYear, retire = Life.prototype.retire;
  Life.prototype.passionYear = function () { year.call(this); this.politicsYear(); };
  // La retraite met fin aux mandats à plein temps (on peut rester conseiller municipal).
  Life.prototype.retire = function (early) {
    const P = this.politics, ok = retire.call(this, early);
    if (ok && P && OFFICE[P.rank].full) { P.rank = 0; P.termEnd = null; this.say("Quitte la vie publique en même temps que le travail.", "work"); }
    return ok;
  };
  const click = spendClick;
  spendClick = function (L, t) {
    const pol = t.closest("[data-pol]");
    if (pol) return polAction(L, pol.dataset.pol, pol.dataset.arg) || "Impossible pour l’instant.";
    return click(L, t);
  };
  const raise = ACTIONS.find(a => a.id === "raise"), when = raise.when;
  raise.when = L => L.jobInfo && L.jobInfo.politics ? "Votre indemnité est fixée par la loi." : when(L);
}
ACTIONS.push({ id: "politics", cat: "pro", label: "S’engager en politique",
  desc: L => `Quel que soit votre métier, sans compter parmi les actions de l’année. ${REGIME_NOTE[polRegime(L)]} Ensuite, tout se joue dans le panneau « Politique ».`,
  when: L => { const why = polJoinWhy(L); return why ? capFirst(why) + "." : true; },
  choices: L => partiesFor(L), run: (L, id) => L.joinPolitics(id) });
// S'engager ne coûte pas d'action de l'année : c'est un choix de vie, ouvert à tous.
{
  const avail = Life.prototype.availableActions, doA = Life.prototype.doAction;
  Life.prototype.availableActions = function () {
    return avail.call(this).map(a => a.id === "politics" && !a.ok && this.actionsLeft <= 0 && !polJoinWhy(this) ? { ...a, ok: true, why: "" } : a);
  };
  Life.prototype.doAction = function (id, arg) {
    if (id !== "politics") return doA.call(this, id, arg);
    const left = this.actionsLeft;
    this.actionsLeft = Math.max(1, left);
    const r = doA.call(this, id, arg);
    this.actionsLeft = left;
    return r;
  };
}
// Le résumé du panneau « Situation » : [libellé, valeur, précision].
function polMiniRows(L) {
  const P = L.politics;
  if (!P) return [["Engagement", "aucun", L.age >= POL_MIN_AGE ? "Ouvert à tous, quel que soit le métier" : `Possible dès ${POL_MIN_AGE} ans`]];
  return [["Poste", capFirst(P.rank > 0 ? L.polTitle() : L.g(officeTitles(L)[0][0], officeTitles(L)[0][1])), P.party], ["Popularité", `${Math.round(P.pop)}/100`, `influence ${L.polInfluence()}/100`]];
}
