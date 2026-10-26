// Faire évoluer une carrière d'artiste ou de sportif : agent, projets (album, film, livre,
// exposition…), tournées, collaborations, contrats publicitaires, image sur les réseaux ;
// contrats, transferts, stages de préparation, soins, grandes compétitions (Jeux olympiques,
// Coupe du monde, Grand Chelem, Tour de France…), titres et récompenses ; palmarès et fans.

// Le projet propre à chaque discipline artistique.
const ART_PROJECT = {
  chant: ["Enregistrer un album", "un album"], rap: ["Enregistrer un album", "un album"], music: ["Enregistrer un album", "un album"], dj: ["Sortir un morceau", "un morceau"],
  dance: ["Monter un spectacle", "un spectacle"], acting: ["Tourner un film ou une série", "un film"], humour: ["Écrire un nouveau spectacle", "un spectacle"],
  write: ["Écrire un livre", "un livre"], paint: ["Préparer une exposition", "une exposition"], model: ["Faire une grande campagne", "une campagne"],
  video: ["Lancer une nouvelle série de vidéos", "une série de vidéos"], tele: ["Participer à une nouvelle émission", "une émission"],
};
const ON_TOUR = new Set(["chant", "rap", "music", "dj", "dance", "humour"]);
// Les grandes récompenses, sans marque déposée : on dit ce que c'est.
const ART_AWARD = {
  chant: ["Disque d’or", "Disque de platine", "Grand prix de la musique du pays"], rap: ["Disque d’or", "Disque de platine", "Grand prix de la musique du pays"],
  music: ["Disque d’or", "Premier prix d’un grand concours international", "Grand prix de la musique du pays"], dj: ["Numéro un des classements", "Meilleur DJ de l’année", "Tête d’affiche d’un grand festival"],
  dance: ["Prix de la meilleure chorégraphie", "Étoile d’une grande compagnie", "Grand prix de la danse"], acting: ["Prix d’interprétation", "Prix du meilleur rôle au grand festival du cinéma", "Grand prix d’interprétation du pays"],
  humour: ["Salle comble toute l’année", "Spectacle de l’année", "Grand prix de l’humour"], write: ["Best-seller", "Prix littéraire national", "Traduit dans trente langues"],
  paint: ["Exposition dans un grand musée", "Œuvre vendue aux enchères à prix record", "Grand prix des arts"], model: ["Couverture d’un grand magazine", "Égérie d’une grande marque", "Mannequin de l’année"],
  video: ["Million d’abonnés", "Créateur de l’année", "Vidéo la plus vue du pays"], tele: ["Émission la plus regardée", "Personnalité télé de l’année", "Couverture des magazines"],
};
const OLYMPIC = new Set(["run", "sprint", "swim", "gym", "judo", "wrestle", "boxe", "velo", "pingpong", "badminton", "tennis", "basket", "foot", "rugby", "hockey", "ski"]);
const WINTER = new Set(["hockey", "ski"]);
const summerGames = y => y >= 1896 && y !== 1916 && y !== 1940 && y !== 1944 && y !== 2020 && (y === 2021 || (y % 4 === 0 && y <= 2016) || (y >= 2024 && y % 4 === 0));
const winterGames = y => (y >= 1924 && y <= 1992 && y % 4 === 0 && y !== 1940 && y !== 1944) || (y >= 1994 && (y - 1994) % 4 === 0);
// Les grandes compétitions d'une année, pour un sport.
function competitionsFor(id, y) {
  const out = [];
  if (OLYMPIC.has(id) && (WINTER.has(id) ? winterGames(y) : summerGames(y)) && !(id === "tennis" && y < 1988) && !(id === "rugby" && y < 2016) && !(id === "pingpong" && y < 1988) && !(id === "badminton" && y < 1992))
    out.push({ name: `les Jeux olympiques de ${y}`, short: `JO ${y}`, medals: true, weight: 1.3 });
  if (id === "foot" && y >= 1930 && y % 4 === 2 && y !== 1942 && y !== 1946) out.push({ name: `la Coupe du monde ${y}`, short: `Coupe du monde ${y}`, medals: false, weight: 1.5 });
  if (id === "rugby" && y >= 1987 && (y - 1987) % 4 === 0) out.push({ name: `la Coupe du monde de rugby ${y}`, short: `Coupe du monde ${y}`, medals: false, weight: 1.3 });
  if (id === "cricket" && y >= 1975 && (y - 1975) % 4 === 0) out.push({ name: `la Coupe du monde de cricket ${y}`, short: `Coupe du monde ${y}`, medals: false, weight: 1.3 });
  if (id === "basket" && y >= 1950 && (y - 1950) % 4 === 0) out.push({ name: `la Coupe du monde de basket ${y}`, short: `Coupe du monde ${y}`, medals: false, weight: 1 });
  if (id === "tennis" && y >= 1900) out.push({ name: "un tournoi du Grand Chelem", short: `Grand Chelem ${y}`, medals: false, weight: 1.2, yearly: true });
  if (id === "velo" && y >= 1903 && !(y >= 1915 && y <= 1918) && !(y >= 1940 && y <= 1946)) out.push({ name: "le Tour de France", short: `Tour de France ${y}`, medals: false, weight: 1.2, yearly: true });
  if (id === "boxe") out.push({ name: "un championnat du monde", short: `Titre mondial ${y}`, medals: false, weight: 1.1, yearly: true });
  if (id === "esport" && y >= 2011) out.push({ name: "le championnat du monde d’e-sport", short: `Mondial ${y}`, medals: false, weight: 1, yearly: true });
  if (id === "run" && y >= 1970) out.push({ name: "un grand marathon international", short: `Marathon ${y}`, medals: false, weight: 0.8, yearly: true });
  return out;
}
const fmtFans = n => n >= 1e6 ? `${(Math.round(n / 1e5) / 10).toLocaleString("fr-FR")} million${n >= 2e6 ? "s" : ""}` : n >= 1000 ? `${Math.round(n / 1000).toLocaleString("fr-FR")} 000` : String(Math.round(n));

Object.assign(Life.prototype, {
  // Combien de gens vous suivent : la notoriété, le pays, le marché.
  fansCount() {
    const P = this.passion;
    if (!P || P.fame < 3) return 0;
    const M = PASSIONS[P.id], pop = this.here.pop * 1e6;
    return Math.round(pop * 0.00005 * (P.fame / 10) ** 2.4 * (1 + M.global / 20) * (this.calYear >= 2008 ? 1.6 : 1));
  },
  // Chaque année : contrat qui se termine, agent, grandes compétitions, récompenses.
  stardomYear() {
    const P = this.passion;
    if (!P || !this.alive) return;
    const M = PASSIONS[P.id], y = this.calYear, a = this.age;
    P.titles = P.titles || [];
    if (P.boostUntil != null && a > P.boostUntil) { P.boost = 1; P.boostUntil = null; this.say("Son contrat arrive à son terme ; il faudra le renégocier.", "work"); }
    if (P.agent && P.stage >= 1) P.fame = clamp(P.fame + 1 + P.agent.skill / 100, 0, 100);
    // Sport : les grandes compétitions de l'année.
    if (M.kind === "sport" && P.stage >= 2 && P.injuredAt !== a) {
      for (const comp of competitionsFor(P.id, y)) {
        const prep = P.prepAt === a ? 1.3 : 1;
        const pick = clamp((P.skill - 68) / 30 * prep * (comp.yearly ? 0.8 : 1), 0, 0.95);
        if (rand() > pick) continue;
        const win = clamp(((P.skill - 82) / 22 + P.fame / 500) * prep * (comp.yearly ? 0.6 : 1), 0.01, 0.45);
        const r = rand();
        if (comp.medals && r < win) this.addTitle(`Médaille d’or aux ${comp.name.replace("les ", "")}`, 18, `Médaille d’or aux ${comp.name.replace("les ", "")} ! L’hymne, le podium, le pays entier qui pleure avec ${this.g("lui", "elle")}.`);
        else if (comp.medals && r < win * 2.5) this.addTitle(`Médaille ${r < win * 1.7 ? "d’argent" : "de bronze"} aux ${comp.name.replace("les ", "")}`, 9, `Monte sur le podium : ${r < win * 1.7 ? "argent" : "bronze"} aux ${comp.name.replace("les ", "")}.`);
        else if (!comp.medals && r < win) this.addTitle(`Vainqueur : ${comp.short}`, 16, `Remporte ${comp.name} ! Son nom entre dans l’histoire de son sport.`);
        else this.say(`Participe à ${comp.name}, sans gagner ; une expérience inoubliable.`, "work", true);
        P.fame = clamp(P.fame + 1.5 * comp.weight, 0, 100);
      }
      // Le championnat du pays, pour les sports d'équipe et les autres.
      if (rand() < clamp(0.06 + (P.skill - 80) / 120, 0.02, 0.3)) this.addTitle(`${this.g("Champion", "Championne")} du pays (${y})`, 6, M.team ? "Son équipe remporte le championnat du pays." : `Devient ${this.g("champion", "championne")} du pays.`);
    }
    // Arts : une grande récompense, plus probable l'année d'un succès.
    if (M.kind !== "sport" && P.stage >= 2 && rand() < (P.hitAt === a ? 0.35 : 0.03) * (0.5 + P.skill / 100)) {
      const list = ART_AWARD[P.id] || ["Grand prix"], t = P.fame > 75 ? list[2] : P.fame > 55 ? list[1] : list[0];
      this.addTitle(`${t} (${y})`, 10, `Reçoit une grande récompense : ${t.toLowerCase()}.`);
    }
  },
  addTitle(title, fame, text) {
    const P = this.passion;
    P.titles = P.titles || [];
    P.titles.push({ y: this.calYear, t: title });
    P.fame = clamp(P.fame + fame, 0, 100);
    this.say(text, "work", true);
    this.bump("happy", Math.min(10, fame / 2));
    if (P.stage === 2 && P.fame >= 80) { P.stage = 3; this.say(starLine(this, P.id), "work", true); }
  },
});
// Les effets d'un agent et d'un contrat sur les revenus et les chances.
{
  const pay = Life.prototype.careerPay, year = Life.prototype.passionYear, ctx = careerContext;
  Life.prototype.careerPay = function () {
    pay.call(this);
    const P = this.passion;
    if (P) this.starMult = (this.starMult || 1) * (P.boost || 1) * (P.agent ? 1 - P.agent.cut : 1) * (P.stage >= 2 && P.agent ? 1.25 : 1);
  };
  Life.prototype.passionYear = function () { year.call(this); this.stardomYear(); };
  careerContext = function (L, id) { const P = L.passion; return ctx(L, id) * (P && P.agent ? 1 + P.agent.skill / 200 : 1); };
}

// --- Les actions de carrière -----------------------------------------------------------------
function careerOptions(L) {
  const P = L.passion;
  if (!P) return [];
  const M = PASSIONS[P.id], a = L.age, m = median(L.here), y = L.calYear, sport = M.kind === "sport", done = k => (P.did || {})[k] === a;
  const opts = [];
  const add = (id, label, sub, ok = true, why = "") => opts.push({ id, label, sub, ok: ok && !done(id), why: done(id) ? "déjà cette année" : why });
  if (P.stage >= 1) add(P.agent ? "agentOff" : "agent", P.agent ? `Se séparer de ${P.agent.name}, votre agent` : "Prendre un agent", P.agent ? "Il prend sa part et vous ouvre des portes" : "Plus d’opportunités et de meilleurs contrats ; il prend 10 à 20 % de vos revenus");
  add("coach", sport ? "Stage de préparation intensif" : "Cours avec un grand maître", `Niveau +4 à +7 · ≈ ${eur(m * (sport ? 0.08 : 0.06))}${sport ? " · un peu plus de risques de blessure" : ""}`, L.savings >= m * 0.06, "pas assez d’argent");
  if (sport) {
    add("recovery", "Kiné, nutrition, sommeil", `Moitié moins de risques de blessure cette année · santé +2 · ≈ ${eur(m * 0.04)}`, L.savings >= m * 0.04, "pas assez d’argent");
    if (P.stage >= 2) {
      const comps = competitionsFor(P.id, y), next = comps.length ? comps.map(c => c.short).join(", ") : (() => { for (let k = 1; k <= 4; k++) { const c = competitionsFor(P.id, y + k).filter(c => !c.yearly); if (c.length) return `${c[0].short} (dans ${k} an${k > 1 ? "s" : ""})`; } return "aucune en vue"; })();
      add("prep", "Préparer la grande compétition", `Cette année : ${next}`, comps.length > 0, "pas de grande compétition cette année");
      add("contract", "Renégocier son contrat", P.boost > 1 ? `Contrat en cours : revenus ×${(Math.round(P.boost * 10) / 10).toLocaleString("fr-FR")} jusqu’à ${P.boostUntil} ans` : "Augmenter son salaire pour trois ans ; plus facile avec un agent et des titres");
      if (BIG_LEAGUES[P.id] !== undefined) add("transfer", "Demander un transfert", "Un club plus riche, au pays ou dans un grand championnat étranger", P.skill >= 70, "niveau insuffisant");
    }
  } else {
    const [label, what] = ART_PROJECT[P.id] || ["Lancer un projet", "un projet"];
    add("project", label, `Un succès fait grimper la notoriété et les revenus ; un échec la fait baisser · ≈ ${eur(m * 0.1 * (1 + P.stage))}`, L.savings >= m * 0.1 * (1 + P.stage) || P.stage >= 2, "pas assez d’argent");
    if (ON_TOUR.has(P.id) && P.stage >= 1) add("tour", "Partir en tournée", "Revenus et notoriété ; fatigue, et loin des proches");
    if (P.stage >= 1) add("collab", "Collaborer avec une star", "Une chance de se faire connaître d’un tout autre public", P.fame < 90, "c’est vous, la star");
    if (P.stage >= 2) add("reinvent", "Se réinventer", "Changer de style : le public peut suivre… ou pas");
  }
  if (P.fame >= 35) add("sponsor", "Signer un contrat publicitaire", `≈ ${eur(m * P.fame / 25)} ; on vous verra sur les affiches`);
  if (y >= 2008 && P.stage >= 1) add("social", "Soigner son image sur les réseaux", "Notoriété +, mais du temps et des critiques");
  if (P.fame >= 50) add("charity", "Créer sa fondation, un gala de charité", "Relations et bonheur ; une belle image");
  if (P.fame >= 40 && a >= 40) add("memoirs", "Écrire ses mémoires", `Un livre qui se vend ≈ ${eur(m * P.fame / 15)}`, !P.memoirs, "déjà écrites");
  if (P.stage >= 2 && a >= 35) add("teach", sport ? "Transmettre : stages pour jeunes" : "Donner des masterclass", "Revenus, bonheur, et une relève");
  return opts;
}
function careerAction(L, id, arg) {
  const P = L.passion;
  if (!P || !L.alive) return null;
  const M = PASSIONS[P.id], a = L.age, m = median(L.here), y = L.calYear, sport = M.kind === "sport";
  const o = careerOptions(L).find(x => x.id === id);
  if (!o || !o.ok) return o ? `Impossible : ${o.why}.` : null;
  P.did = P.did || {}; P.did[id] = a;
  const t = L.talentFor(P.id);
  switch (id) {
    case "agent": {
      P.agent = { name: L.freshName(rand() < 0.6 ? "m" : "f"), cut: Math.round((0.1 + rand() * 0.1) * 100) / 100, skill: clamp(Math.round(40 + P.fame / 3 + randn() * 15), 10, 95) };
      L.careerPay(); L.say(`Signe avec un agent, ${P.agent.name} : ${Math.round(P.agent.cut * 100)} % de ses revenus contre ses contacts.`, "work", true);
      return `Agent : ${P.agent.name} (talent ${P.agent.skill}/100)`;
    }
    case "agentOff": { const n = P.agent.name; P.agent = null; L.careerPay(); L.say(`Se sépare de ${n}, son agent.`, "work"); return "Plus d’agent."; }
    case "coach": L.pay(m * (sport ? 0.08 : 0.06)); P.skill = clamp(P.skill + 4 + rand() * 3 + t, 0, 100); if (sport) P.campAt = a; L.say(sport ? "Part en stage de préparation intensif." : "Travaille des semaines avec un grand maître.", "work"); return `Niveau ${Math.round(P.skill)}/100`;
    case "recovery": L.pay(m * 0.04); P.careAt = a; L.bump("health", 2); L.say("Prend soin de son corps : kiné, nutrition, sommeil.", "health"); return "Risques de blessure divisés par deux cette année.";
    case "prep": P.prepAt = a; P.skill = clamp(P.skill + 2, 0, 100); L.say("Se prépare des mois durant pour la grande compétition.", "work"); return "Meilleures chances cette année.";
    case "contract": {
      const p = clamp(0.25 + (P.skill - 70) / 60 + (P.titles || []).length * 0.05 + (P.agent ? P.agent.skill / 250 : 0), 0.05, 0.85);
      if (rand() < p) { P.boost = Math.round((1.2 + rand() * 0.5 + (P.agent ? 0.2 : 0)) * 10) / 10; P.boostUntil = a + 3; L.careerPay(); L.say(`Signe un nouveau contrat, bien mieux payé (×${P.boost.toLocaleString("fr-FR")}).`, "work", true); return `Contrat ×${P.boost.toLocaleString("fr-FR")} pour 3 ans`; }
      L.bump("happy", -3); L.say("La renégociation échoue ; l’ambiance se tend avec le club.", "work"); return `Refusé (chances ${Math.round(p * 100)} %)`;
    }
    case "transfer": {
      const abroad = (BIG_LEAGUES[P.id] || []).filter(x => x !== L.code && countryAt(x, y).gdp > L.here.gdp * 1.1);
      const p = clamp((P.skill - 65) / 35 + P.fame / 300 + (P.agent ? 0.1 : 0), 0.05, 0.8);
      if (rand() >= p) { L.say("Demande un transfert ; aucun club ne fait d’offre suffisante.", "work"); return `Pas d’offre (chances ${Math.round(p * 100)} %)`; }
      if (abroad.length && rand() < 0.6) {
        const d = countryAt(pick(abroad), y);
        L.ask(`Un grand club ${inCountry(d)} fait une offre. Partir ?`, [
          { label: `Partir ${inCountry(d)}`, sub: "Un autre pays, d’autres salaires, loin des siens.", autoWeight: 3, apply: () => L.transferTo(d) },
          { label: "Rester au pays", autoWeight: 1, apply: () => L.say("Refuse l’offre étrangère.", "work") },
        ]);
        return "Une offre arrive !";
      }
      P.boost = Math.max(P.boost || 1, 1.3); P.boostUntil = a + 3; P.fame = clamp(P.fame + 5, 0, 100); L.careerPay();
      L.say("Rejoint un plus grand club du pays.", "work", true); return "Transfert dans un grand club du pays.";
    }
    case "project": {
      const cost = m * 0.1 * (1 + P.stage);
      if (P.stage < 2) L.pay(cost);
      const [, what] = ART_PROJECT[P.id] || ["", "un projet"];
      const q = P.skill + randn() * 15 + P.fame / 5 + (P.agent ? 5 : 0) + t * 4;
      if (q > 88) {
        const gain = m * (1 + P.fame / 8) * (1 + M.global / 20); P.fame = clamp(P.fame + 15, 0, 100); P.hitAt = a; L.addMoney(gain); L.bump("happy", 8);
        L.say(`Sort ${what} : un immense succès (${money(gain)} de recettes).`, "work", true);
        if (P.stage === 0) P.stage = 1;
        return `Un triomphe ! +${eur(gain)}`;
      }
      if (q > 68) { const gain = m * (0.3 + P.fame / 30); P.fame = clamp(P.fame + 6, 0, 100); L.addMoney(gain); L.bump("happy", 3); L.say(`Sort ${what} : un joli succès.`, "work", true); if (P.stage === 0 && rand() < 0.4) P.stage = 1; return `Succès · +${eur(gain)}`; }
      P.fame = clamp(P.fame - 5, 0, 100); L.bump("happy", -4); L.say(`Sort ${what} : un échec, la critique est dure.`, "work", true); return "Échec.";
    }
    case "tour": { const gain = m * (0.4 + P.fame / 15); L.addMoney(gain); P.fame = clamp(P.fame + 3, 0, 100); L.bump("health", -3); L.bump("rel", -3); L.say(`Part en tournée : des dizaines de dates, ${money(gain)} de recettes.`, "work", true); return `+${eur(gain)}`; }
    case "collab": {
      if (rand() < 0.4 + P.skill / 300) { P.fame = clamp(P.fame + 10 + rand() * 10, 0, 100); L.say("Une collaboration avec une star : un tout nouveau public la découvre.".replace("la découvre", L.g("le découvre", "la découvre")), "work", true); return "Collaboration réussie !"; }
      L.say("La collaboration avec une star ne se fait pas.", "work"); return "Ça ne se fait pas.";
    }
    case "reinvent": { const d = randn() * 12; P.fame = clamp(P.fame + d, 0, 100); P.skill = clamp(P.skill + 2, 0, 100); L.say(d > 0 ? "Change de style : le public suit, et en redemande." : "Change de style : une partie du public décroche.", "work", true); return d > 0 ? "Le public suit." : "Le public décroche."; }
    case "sponsor": { const gain = m * P.fame / 25; L.addMoney(gain); if (rand() < 0.08) { P.fame = clamp(P.fame - 8, 0, 100); L.say(`Signe un contrat publicitaire (${money(gain)}) ; la marque fait polémique, l’image en souffre.`, "work", true); } else L.say(`Signe un contrat publicitaire : ${money(gain)}.`, "money", true); return `+${eur(gain)}`; }
    case "social": { const d = 2 + rand() * 6; P.fame = clamp(P.fame + d, 0, 100); L.bump("happy", rand() < 0.3 ? -2 : 0); L.say("Soigne son image sur les réseaux : vidéos, coulisses, réponses aux fans.", "work"); return `Notoriété +${Math.round(d)}`; }
    case "charity": L.pay(m * 0.05); L.bump("rel", 4); L.bump("happy", 3); P.fame = clamp(P.fame + 2, 0, 100); L.say("Crée sa fondation et organise un gala de charité.", "family", true); return "Relations +4, bonheur +3";
    case "memoirs": { P.memoirs = true; const gain = m * P.fame / 15; L.addMoney(gain); L.bump("happy", 4); L.say(`Publie ses mémoires ; le livre se vend bien (${money(gain)}).`, "work", true); return `+${eur(gain)}`; }
    case "teach": { const gain = m * 0.3; L.addMoney(gain); L.bump("happy", 3); L.bump("rel", 2); L.say(sport ? "Encadre des stages pour les jeunes ; la relève écoute chacun de ses conseils." : "Donne des masterclass ; des jeunes viennent de loin pour y assister.", "work"); return `+${eur(gain)}`; }
  }
  return null;
}

// La page « Votre carrière ».
function careerHtml(L) {
  const P = L.passion;
  if (!P) return "";
  const M = PASSIONS[P.id], sport = M.kind === "sport", fans = L.fansCount(), titles = P.titles || [];
  const bar = (v, max = 100) => `<span class="sp-bar"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></span>`;
  const window = sport && M.end ? (L.age < M.end - 8 ? "encore loin du sommet" : L.age < M.end - 3 ? "au sommet de sa carrière" : "en fin de carrière") : "";
  const opts = careerOptions(L);
  return `<div class="sp">
    <p class="sp-head">Votre carrière</p>
    <div class="sp-card"><div class="sp-main"><b>${esc(capFirst(M.label))} · ${esc(P.stage >= 2 || L.isCareer() ? L.g(M.pro[0], M.pro[1]) : STAGE_LABEL[P.stage])}</b>
      <small>Niveau ${Math.round(P.skill)}/100 ${bar(P.skill)} · notoriété ${Math.round(P.fame)}/100 ${bar(P.fame)}${fans ? ` · ≈ ${fmtFans(fans)} ${L.calYear >= 2008 ? "abonnés" : "fans"}` : ""}${window ? ` · ${window}` : ""}</small>
      <small>${P.agent ? `Agent : ${esc(P.agent.name)} (talent ${P.agent.skill}/100, ${Math.round(P.agent.cut * 100)} %)` : "Pas d’agent"}${P.boost > 1 ? ` · contrat ×${P.boost.toLocaleString("fr-FR")} jusqu’à ${P.boostUntil} ans` : ""}${P.school ? ` · ${esc(P.school)}` : ""}${L.isCareer() ? (L.income > 0 ? ` · revenu ≈ ${eur(L.income)} par an` : " · revenus comptés à la fin de l’année") : " · pas encore votre métier"}</small>
      ${titles.length ? `<small>Palmarès : ${titles.slice(-8).map(x => esc(x.t)).join(" · ")}${titles.length > 8 ? ` · et ${titles.length - 8} autres` : ""}</small>` : ""}</div></div>
    <div class="sp-pills">${opts.map(o => `<button class="sp-pill" data-car="${o.id}"${o.ok ? "" : " disabled"}>${esc(o.label)} <span>${esc(o.ok ? o.sub : o.why)}</span></button>`).join("")}</div>
    <p class="sp-note">Chaque geste, une fois par an. ${sport ? "Les grandes compétitions (Jeux olympiques, Coupe du monde, Grand Chelem, Tour de France…) se jouent d’elles-mêmes quand votre niveau vous y qualifie." : "Les grandes récompenses arrivent plus souvent l’année d’un succès."}</p>
  </div>`;
}
