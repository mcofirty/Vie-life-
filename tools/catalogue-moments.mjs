// Écrit docs/moments-de-vie.md : la bible des récits et le catalogue de tous les
// moments de vie, avec leurs conditions en clair.
//   node tools/catalogue-moments.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = vm.createContext({ console, Intl, Math, Date, JSON, Object, Array, Set, Map, String, Number, RegExp });
for (const f of ["countries.js", "data.js", "sim.js", "economy.js", "moments.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const { MOMENTS, BY_CODE, REGION_NAMES, TIER_LABEL, TIER_CUTS, JOB_BY_ID, SECTOR_LABEL } = vm.runInContext("({ MOMENTS, BY_CODE, REGION_NAMES, TIER_LABEL, TIER_CUTS, JOB_BY_ID, SECTOR_LABEL })", ctx);

const ZONE_LABEL = {
  islam: "pays à majorité musulmane", christian: "pays de tradition chrétienne", lunar: "pays du Nouvel An lunaire", hindu: "pays de tradition hindoue",
  sahel: "Sahel", horn: "Corne de l’Afrique", safr: "Afrique australe", monsoon: "pays de la mousson", rice: "pays du riz", typhoon: "pays des typhons",
  quake: "pays sismiques", drought: "pays exposés à la sécheresse", fire: "pays des grands incendies", cold: "pays aux hivers extrêmes",
  mega: "pays aux mégapoles embouteillées", gulf: "pays du Golfe", laborsrc: "pays d’où l’on part travailler dans le Golfe",
  remit: "pays qui vivent en partie de l’argent des émigrés", remitus: "pays d’émigration vers les États-Unis", eu: "Europe de l’Ouest (UE)",
  eueast: "Europe centrale et orientale (UE)", euro: "zone euro de 2002", nordic: "pays nordiques", ussr: "ex-URSS", eastbloc: "ex-bloc de l’Est",
  hisp: "Amérique hispanique", cricket: "pays du cricket", baseball: "pays du base-ball", tropics: "pays tropicaux", secular: "pays très sécularisés",
  norail: "pays sans train de voyageurs",
};
const IS_LABEL = {
  married: "en couple", single: "jamais marié·e", alone: "pas en couple", newlywed: "au mariage", divorced: "après un divorce", widowed: "après un veuvage",
  bothParents: "ses deux parents vivants", firstjob: "premier emploi", nokids: "sans enfant", grandkids: "grand-parent", student: "en études",
  school: "à l’école", primary: "à l’école primaire", secondary: "au collège ou au lycée", uni: "à l’université", unschooled: "enfant hors de l’école",
  degree: "diplômé·e de l’université", firstgen: "premier·ère de la famille à l’université", working: "au travail", employee: "salarié·e",
  jobless: "sans emploi", homemaker: "au foyer", retired: "à la retraite", business: "à la tête d’une entreprise", self: "à son compte",
  emigrant: "émigré·e", native: "dans son pays natal", owner: "propriétaire", renter: "locataire", nobank: "sans compte en banque",
  saver: "avec de l’épargne", sad: "malheureux·se", lonely: "isolé·e", pension: "avec une pension", nopension: "sans vraie pension",
  herd: "avec du bétail", richland: "pays riche", kids: "un enfant mineur", baby: "un bébé", toddler: "un enfant de 3 à 5 ans",
  schoolkid: "un enfant de 6 à 12 ans", teenkid: "un adolescent", grown: "un enfant adulte", kidstart: "un enfant de 6 ans",
  mother: "sa mère vivante", father: "son père vivant", parent: "un parent vivant", oldParent: "un parent de 75 ans ou plus",
  sibs: "un frère ou une sœur", youngsib: "un petit frère ou une petite sœur", oldsib: "un grand frère ou une grande sœur",
};
const FX_LABEL = { health: "santé", happy: "bonheur", know: "savoir", rel: "liens", cost: "dépense", gain: "rentrée", debt: "dette", fund: "études des enfants", herd: "troupeau" };
const KIND_LABEL = { life: "vie quotidienne", culture: "culture et fêtes", family: "famille", work: "travail", money: "argent", health: "santé", edu: "école", move: "migrations", history: "histoire" };

const num = x => String(x).replace(".", ",");
const span = ([a, b], unit = "") => a === b ? `${a}${unit}` : `${a}–${b}${unit}`;
const countries = list => {
  const out = [];
  for (const x of list) {
    if (x[0] === "@") out.push(ZONE_LABEL[x.slice(1)] || x);
    else if (x[0] === "#") out.push(REGION_NAMES[x.slice(1)]);
    else out.push(BY_CODE[x] ? BY_CODE[x].name : x);
  }
  return out.join(", ");
};
const tier = ([a, b]) => a === b ? TIER_LABEL[a] : `${TIER_LABEL[a]} à ${TIER_LABEL[b]}`;
const place = ([a, b]) => a <= 0 ? `les ${Math.round(b * 100)} % les plus modestes du pays` : b >= 1 ? `les ${Math.round((1 - a) * 100)} % les plus aisés du pays` : `entre ${Math.round(a * 100)} et ${Math.round(b * 100)} % du pays`;
const gdp = ([a, b]) => a <= 0 ? `pays au revenu moyen sous ${b.toLocaleString("fr-FR")} $` : b >= 1e8 ? `pays au revenu moyen au-dessus de ${a.toLocaleString("fr-FR")} $` : `pays au revenu moyen entre ${a.toLocaleString("fr-FR")} et ${b.toLocaleString("fr-FR")} $`;
const cond = c => {
  let label;
  if (c.name === "s") label = "secteur : " + c.arg.map(s => SECTOR_LABEL[s]).join(" ou ");
  else if (c.name === "j") label = "métier : " + c.arg.map(j => JOB_BY_ID[j] ? JOB_BY_ID[j].m : j).join(", ");
  else if (c.name === "wed") label = `${c.arg[0]} ans de mariage`;
  else label = IS_LABEL[c.name] || c.name;
  return c.neg ? `pas ${label}` : label;
};
const effects = fx => !fx ? "" : Object.entries(fx).map(([k, v]) => ["cost", "gain", "debt", "fund"].includes(k) ? `${FX_LABEL[k]} ${num(v)} × revenu médian` : k === "herd" ? `${FX_LABEL[k]} ${Math.round(v * 100)} %` : `${FX_LABEL[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}`).join(", ");
const readable = s => s
  .replace(/\{\$([\d.]+)\}/g, (_, x) => `‹${num(x)} × revenu médian›`)
  .replace(/\{(?:([a-z]+):)?([^{}|]*)\|([^{}]*)\}/g, (_, who, m, f) => m === "" ? `(${f})` : `${m}/${f}`)
  .replace(/\{([a-z]+)\}/g, (_, k) => `‹${k === "age" ? "âge" : k === "annee" ? "année" : k}›`);

function conditions(m) {
  const out = [];
  if (m.a) out.push(m.a[0] === m.a[1] ? `à ${m.a[0]} ans` : `${span(m.a)} ans`);
  if (m.y) out.push(m.y[1] >= 2100 ? `à partir de ${m.y[0]}` : m.y[0] <= 1900 ? `jusqu’en ${m.y[1]}` : `de ${m.y[0]} à ${m.y[1]}`);
  if (m.ys) out.push(`en ${m.ys.join(", ")}`);
  if (m.t) out.push(`niveau de vie : ${tier(m.t)}`);
  if (m.p) out.push(place(m.p));
  if (m.g) out.push(gdp(m.g));
  if (m.r) out.push(m.r.map(r => REGION_NAMES[r]).join(", "));
  if (m.cc) out.push(countries(m.cc) + (m.o ? " (pays d’origine)" : ""));
  if (m.not) out.push(`sauf ${countries(m.not)}`);
  if (m.cy) out.push(Object.entries(m.cy).map(([c, [a, b]]) => `${BY_CODE[c].name} ${b >= 2100 ? `dès ${a}` : `${a}–${b}`}`).join(", "));
  if (m.on) out.push(Object.entries(m.on).map(([c, ys]) => `${BY_CODE[c].name} ${ys.join(", ")}`).join(", "));
  if (m.cs) out.push(Object.entries(m.cs).map(([k, [a]]) => k === "hom" ? `au moins ${a} homicides pour 100 000 habitants` : k).join(", "));
  if (m.from) out.push(`émigré·e venu·e de : ${countries(m.from)}`);
  if (m.u != null) out.push(m.u ? "en ville" : "à la campagne");
  if (m.sex) out.push(m.sex === "f" ? "femmes" : "hommes");
  if (m._is.length) out.push(m._is.map(cond).join(", "));
  if (m.need) out.push(`suite du fil « ${m.need} »${m.after > 1 ? ` (au moins ${m.after} ans après)` : ""}`);
  if (m.set) out.push(`ouvre le fil « ${m.set} »`);
  if (m.unless) out.push(`sauf après : ${m.unless.join(", ")}`);
  if (m.odds) out.push(`rare (${Math.round(m.odds * 100)} % des années)`);
  if (m.once) out.push("une fois dans la vie");
  if (m.sure) out.push("raconté dès que possible");
  if (m.heavy) out.push("passage difficile");
  return out.join(" · ");
}

const themes = [];
for (const m of MOMENTS) { let t = themes.find(x => x.name === m.theme); if (!t) themes.push(t = { name: m.theme, list: [] }); t.list.push(m); }
const variants = MOMENTS.reduce((s, m) => s + (m.ask ? 1 : Array.isArray(m.txt) ? m.txt.length : 1), 0);
const asks = MOMENTS.filter(m => m.ask).length, threads = new Set(MOMENTS.filter(m => m.need).map(m => m.need)).size;
const specific = MOMENTS.filter(m => m.cc || m.cy || m.on || m.r || m.from).length;

let md = `# Moments de vie — bible et catalogue

> Généré par \`node tools/catalogue-moments.mjs\` à partir de \`moments.js\`. Ne pas modifier à la main : modifier \`moments.js\`, puis relancer le script (et \`node tools/check-moments.mjs\` pour vérifier).

**${MOMENTS.length} moments**, ${variants} textes au total, ${specific} propres à un pays, une culture ou une région, ${asks} petites décisions et ${threads} fils narratifs.

## La bible

Entre deux grands événements (une naissance, un mariage, une guerre), une vie est faite de scènes ordinaires. Ces scènes changent d’un bout à l’autre du monde et de l’échelle des revenus. Elles disent mieux que les chiffres ce que veut dire naître ici plutôt que là. Le récit en tire environ une ou deux par an.

### Ce qui décide d’une scène

1. **Le niveau de vie**, en six paliers. C’est le revenu du foyer par personne (échelle racine carrée de la taille du foyer), en dollars à parité de pouvoir d’achat. Pour un enfant, c’est celui de sa famille.
${TIER_LABEL.map((l, i) => `   - **${l}** : ${i === 0 ? `moins de ${TIER_CUTS[0].toLocaleString("fr-FR")} $ par an (≈ 4 $ par jour)` : i === TIER_LABEL.length - 1 ? `plus de ${TIER_CUTS[i - 1].toLocaleString("fr-FR")} $` : `de ${TIER_CUTS[i - 1].toLocaleString("fr-FR")} à ${TIER_CUTS[i].toLocaleString("fr-FR")} $`}`).join("\n")}
2. **La place dans le pays.** On peut vivre mieux qu’un ouvrier de Dacca et faire la queue aux Restos du cœur à Paris. La pauvreté relative a ses propres scènes : les fins de mois, le chauffage éteint, les baskets de marque. La richesse dans un pays pauvre aussi : les domestiques, la résidence fermée, l’école privée bilingue. À l’inverse, les scènes de pauvreté (paliers survie et précarité) ne concernent jamais le quart le plus aisé du pays.
3. **Le pays et sa culture** : les plats de famille, les fêtes, les transports (danfo, matatu, jeepney, marchroutka), les examens (gaokao, suneung, bac, WAEC, ENEM), le service militaire, les risques naturels, les institutions. Les fêtes et les plats suivent le pays d’origine : un émigré garde son Aïd ou son Têt.
4. **L’époque** : la radio, la télévision en noir et blanc, le téléphone qu’on attend des mois, le premier portable, le smartphone, le paiement par téléphone (M-Pesa, QR codes, UPI, Pix), l’intelligence artificielle. Et l’histoire vécue en direct : la Lune, la chute du Mur, les indépendances, le premier vote des femmes, les Coupes du monde, les Jeux olympiques, l’euro.
5. **La ville ou la campagne**, **l’âge**, et **la situation** : école, métier (agriculteur, vendeuse au marché, ouvrière du textile, chauffeur VTC, infirmière…), couple, enfants, parents qui vieillissent, retraite, émigration.

### Le ton

- Des phrases courtes, au présent, sans sujet, comme le reste du récit : « Repique le riz à la main, les pieds dans l’eau. »
- Le détail concret plutôt que l’adjectif : un bidon jaune, un cahier d’écolier chez le boutiquier, la carpe dans la baignoire.
- Ni misérabilisme ni carte postale. La pauvreté a aussi ses joies (le poulet du dimanche, la tontine qui tombe), la richesse ses angles morts (l’employée qui a laissé ses enfants au village).
- Les chiffres seulement quand ils parlent : 48 °C, cent élèves dans la classe, trente heures debout dans le train du Nouvel An.
- Le futur suit les projections (réchauffement, vieillissement, technologies qui se diffusent), sans événements inventés.
- Les passages les plus durs (travail forcé, violences, dépression) sont marqués : repliés avec « pas de scènes effrayantes », absents en mode classe.

### Comment le récit les choisit

Chaque année, le moteur retient les moments possibles : âge, époque, pays, palier, place, situation, et délai depuis la dernière fois (15 ans par défaut). Il raconte d’abord ceux qui ne peuvent pas attendre : une date (la finale de 1998), un âge précis (les quinze ans, les cent ans), un mariage. Viennent ensuite les suites des fils narratifs, puis un ou deux autres, tirés au sort, en préférant ce qui est propre au pays. Les petites décisions passent par les décisions habituelles du jeu ; en mode automatique, elles sont prises au hasard selon des penchants réalistes.

Les fils narratifs courent sur plusieurs années : un parent qui part travailler à l’étranger puis revient, des grands-parents qui élèvent l’enfant pendant que les parents sont à l’usine, un enfant émigré qui envoie de l’argent, un prêt à un cousin remboursé ou perdu, une tontine.

## Catalogue

`;
md += themes.map(t => `- [${t.name}](#${t.name.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-")}) (${t.list.length})`).join("\n") + "\n\n";
for (const t of themes) {
  md += `### ${t.name}\n\n`;
  for (const m of t.list) {
    md += `- **${m.id}** _(${KIND_LABEL[m.kind]})_ — ${conditions(m) || "toutes les vies"}\n`;
    if (m.ask) {
      md += `  - Décision : « ${readable(m.ask.q)} »\n`;
      for (const o of m.ask.opts) {
        const why = o._if.length ? ` _(si ${o._if.map(cond).join(", ")})_` : "";
        const res = o.out ? o.out.map(x => `${Math.round(x.p * 100)} % : « ${readable(x.txt)} »${x.fx ? ` (${effects(x.fx)})` : ""}`).join(" ; ") : `« ${readable(o.txt)} »${o.fx ? ` (${effects(o.fx)})` : ""}`;
        md += `    - ${readable(o.label)}${why} → ${res}${o.set ? ` · ouvre le fil « ${o.set} »` : ""}\n`;
      }
    } else {
      for (const s of [m.txt].flat()) md += `  - « ${readable(s)} »\n`;
      if (m.fx) md += `  - Effets : ${effects(m.fx)}\n`;
    }
  }
  md += "\n";
}
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "moments-de-vie.md"), md);
console.log(`docs/moments-de-vie.md : ${MOMENTS.length} moments, ${themes.length} thèmes.`);
