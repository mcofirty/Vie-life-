// Dépenser et vivre : ce qu'on fait de son argent au fil des années (proches, voyages,
// santé, rencontres, loisirs, dons, logement, voiture, logements à louer, testament),
// le mode de vie (placements, cadeaux de mariage et d'obsèques, assurance, alimentation)
// et ce qui se fait « sans demander » chaque année. Montants en dollars PPA, affichés
// aussi en euros aux prix français.

const eur = x => `${Math.round(x * 0.72).toLocaleString("fr-FR")} €`;
const LIFESTYLE = {
  invest: { label: "Placement", note: "Acheter et garder coûte peu de frais. Acheter et vendre souvent des titres coûte des frais et, en moyenne, rapporte un peu moins, avec plus de hauts et de bas.",
    opts: { hold: ["Acheter et garder", "acheter et garder"], trade: ["Acheter et vendre des titres", "achat et vente de titres"] } },
  gifts: { label: "Mariages et obsèques", note: "Ce que vous donnez aux mariages de vos amis et aux funérailles de vos proches. Donner moins fait faire des économies, mais les liens peuvent devenir un peu moins proches.",
    opts: { generous: ["Donner généreusement", "généreusement"], half: ["Donner la moitié, selon vos moyens", "la moitié"], none: ["Être là, sans donner", "sans donner"] } },
  insurance: { label: "Assurance", note: "Une assurance plus complète coûte des primes chaque année, mais réduit beaucoup ce que vous payez pour les soins à l’hôpital, et verse une somme à votre famille si vous quittez ce monde avant 70 ans. En général, les primes versées dépassent ce qui est remboursé.",
    opts: { base: ["Couverture de base uniquement", "de base"], full: ["Prendre une assurance plus complète", "complète"] } },
  food: { label: "Alimentation", note: "Manger avec soin coûte un peu plus cher en courses, mais des maladies comme l’hypertension et le diabète surviennent moins souvent. Le restaurant et la livraison sont pratiques, mais coûtent plus cher, et ces maladies surviennent un peu plus souvent.",
    opts: { local: ["Manger comme les gens autour de vous", "comme autour de vous"], care: ["Moins de sel, plus de légumes et de céréales complètes", "avec soin"], resto: ["Souvent au restaurant ou en livraison", "restaurant et livraison"] } },
};
const LIFESTYLE_DEFAULT = { invest: "hold", gifts: "half", insurance: "base", food: "local" };
// Ce qui peut se faire chaque année « sans demander ».
const AUTO = {
  checkup: { label: "Bilan de santé complet et coach sportif", every: 1 },
  kidsMoney: { label: "Argent pour les enfants et petits-enfants", every: 1 },
  resto: { label: "Restaurant et cadeaux avec vos proches et vos amis", every: 1 },
  tripHome: { label: "Voyage dans votre pays", every: 1 },
  tripAbroad: { label: "Voyage à l’étranger", every: 2 },
  donate: { label: "Faire un don", every: 1 },
  hobby: { label: "Équipement et cours de loisirs", every: 1 },
  kidsPay: { label: "Payer pour les enfants sans demander", sub: "frais d’université · frais de mariage · demandes d’argent" },
};

const isAdultKid = (L, k) => k.alive && L.age - k.born >= 18;
const companions = L => [["friends", "Avec vos amis"], ...(L.married ? [["partner", `Avec ${L.partner}`]] : []), ["solo", "En solo"]];
const tripFx = (L, arg) => { if (arg === "friends") { L.bump("rel", 1); L.network += 0.2; } if (arg === "partner") L.bump("rel", 2); };

// Les dépenses possibles. cost(L, arg) en $ PPA ; when(L) : true ou la raison.
const SPENDS = [
  { id: "resto", label: "Restaurant et cadeaux avec vos proches et vos amis", fx: "Relations +4 · Bonheur +2", cost: L => median(L.here) * 0.03,
    when: L => L.age < 16 ? "À partir de 16 ans." : true,
    run: L => { L.bump("rel", 4); L.bump("happy", 2); L.say(pick(["Invite les siens au restaurant et offre des cadeaux à chacun.", "Un grand repas avec la famille et les amis, à ses frais."]), "family"); } },
  { id: "realestate", label: "Investir dans l’immobilier", fx: "Choisir un bien parmi ceux à vendre, puis y vivre, le louer ou en faire une résidence secondaire · prêt possible selon le pays", cost: () => 0,
    when: L => L.age < 18 ? "À partir de 18 ans." : planned(L.code, L.calYear) ? "Interdit dans une économie planifiée." : L.estateAskedAt === L.age ? "Déjà regardé cette année." : (L.props || []).length >= 8 ? "Déjà huit biens." : !propertyOffers(L, true).length ? `Pas assez pour un apport (il faut au moins ${eur(Math.min(...propertyOffers(L, false).map(o => o.down)))}).` : true,
    run: L => { L.estateAskedAt = L.age; L.askProperty(); return "Des biens sont à vendre"; } },
  { id: "props", label: "Vos biens immobiliers", fx: L => (L.props || []).map(p => `${p.label} (${p.use === "rent" ? `loué ${eur(p.value * p.yield)} par an` : "résidence secondaire"}) : ${eur(p.value)}${p.loan > 0 ? `, reste ${eur(p.loan)}` : ""}`).join(" · ") + " · Vendre entraîne des frais d’environ 6 %",
    when: L => !(L.props || []).length ? "Pas de bien." : true,
    args: L => (L.props || []).map((p, i) => [String(i), `Vendre : ${p.label.toLowerCase()}`, -Math.max(0, p.value * 0.94 - p.loan)]),
    run: (L, arg) => { const p = L.props[+arg]; const net = Math.max(0, p.value * 0.94 - p.loan); L.props.splice(+arg, 1); L.addMoney(net); L.say(`Vend ${p.label.toLowerCase()} (${money(net)} après remboursement de l’emprunt).`, "money", true); } },
  { id: "kidsMoney", label: "Argent pour les enfants et petits-enfants", fx: "Relations +2 · Bonheur +1", note: "Choisissez qui le reçoit",
    when: L => !L.children.some(k => isAdultKid(L, k)) && !L.grandkids ? "Pas d’enfant adulte ni de petit-enfant." : true,
    args: L => [
      ...(L.children.some(k => isAdultKid(L, k)) ? [["kid", "À votre enfant adulte", median(L.here) * 0.04]] : []),
      ...(L.grandkids ? [["grand", "Aux petits-enfants", median(L.here) * 0.025]] : []),
      ...(L.children.some(k => isAdultKid(L, k)) && L.grandkids ? [["both", "Aux enfants et aux petits-enfants", median(L.here) * 0.065]] : []),
    ],
    run: (L, arg, x) => { L.bump("rel", 2); L.bump("happy", 1); L.kidsFund += x; L.say(arg === "grand" ? "Donne de l’argent aux petits-enfants." : arg === "both" ? "Aide ses enfants et ses petits-enfants." : "Donne un coup de main financier à son enfant.", "family"); } },
  { id: "tripHome", label: "Voyage dans votre pays", fx: "Bonheur +2 · Savoir un peu ↑", note: "Choisissez qui vous accompagne",
    when: L => L.age < 16 ? "À partir de 16 ans." : L.calYear < 1920 ? "Les voyages d’agrément restent rares à cette époque." : true,
    args: L => companions(L).map(([k, l]) => [k, l, median(L.here) * 0.06]),
    run: (L, arg) => { L.bump("happy", 2); L.bump("know", 0.5); tripFx(L, arg); L.say(`Voyage à travers le pays${arg === "solo" ? ", seul" + L.g("", "e") : arg === "partner" ? ` avec ${L.partner}` : " avec des amis"}.`, "move"); } },
  { id: "visitKid", label: L => { const k = L.children.find(k => isAdultKid(L, k) && k.code && k.code !== L.code); return k ? `Rendre visite à votre enfant ${inCountry(BY_CODE[k.code])}` : "Rendre visite à un enfant à l’étranger"; },
    fx: L => { const k = L.children.find(k => isAdultKid(L, k) && k.code && k.code !== L.code); return `Bonheur +6 · Plus proche de ${k ? k.name : "votre enfant"}`; }, note: "Choisissez qui vous accompagne",
    when: L => L.children.some(k => isAdultKid(L, k) && k.code && k.code !== L.code) || "Aucun enfant à l’étranger.",
    args: L => companions(L).filter(([k]) => k !== "friends").map(([k, l]) => [k, l, median(L.here) * 0.1]),
    run: (L, arg) => { const k = L.children.find(k => isAdultKid(L, k) && k.code && k.code !== L.code); L.bump("happy", 6); L.bump("rel", 3); L.say(`Rend visite à ${k.name}, ${inCountry(BY_CODE[k.code])}.`, "family", true); } },
  { id: "will", label: "Rédiger un testament", fx: "Décider à qui reviendra ce que vous laissez, et comment", cost: () => 0,
    when: L => L.age < 30 ? "Plus tard dans la vie." : L.willAt === L.age ? "Déjà fait cette année." : true,
    run: L => {
      L.willAt = L.age;
      L.ask("Votre testament : comment partager ce que vous laisserez ?", [
        { label: "Parts égales entre les enfants", autoWeight: 3, apply: () => { L.will = "egal"; L.say("Rédige son testament : parts égales entre les enfants.", "family"); } },
        { label: "Tout à un seul enfant", autoWeight: 1, apply: () => { L.will = "heritier"; L.say("Rédige son testament : tout ira à un seul enfant.", "family"); } },
        { label: "La moitié aux œuvres", autoWeight: 1, apply: () => { L.will = "oeuvres"; L.say("Rédige son testament : la moitié ira à des associations.", "family"); } },
      ]);
      return "une décision vous attend";
    } },
  { id: "treat", label: "Régaler vos amis", fx: "Relations +5", cost: L => median(L.here) * 0.025,
    when: L => L.age < 16 ? "À partir de 16 ans." : true,
    run: L => { L.bump("rel", 5); L.network += 0.2; L.say(pick(["Régale ses amis toute une soirée.", "Paie la tournée ; on s’en souviendra."]), "family"); } },
  { id: "tripAbroad", label: "Voyage à l’étranger", fx: "Bonheur +3 · Savoir un peu ↑", note: "Choisissez qui vous accompagne",
    when: L => L.age < 16 ? "À partir de 16 ans." : L.calYear < 1950 ? "Les voyages à l’étranger restent rares à cette époque." : true,
    args: L => companions(L).map(([k, l]) => [k, l, median(L.here) * 0.1]),
    run: (L, arg) => { L.bump("happy", 3); L.bump("know", 1); tripFx(L, arg); L.say(`Voyage ${inCountry(BY_CODE[pick(COUNTRIES.filter(c => c.code !== L.code && c.pop > 5)).code])}${arg === "partner" ? ` avec ${L.partner}` : arg === "friends" ? " avec des amis" : ""}.`, "move"); } },
  { id: "checkup", label: "Bilan de santé complet et coach sportif", fx: "Santé +3 · Risque de maladie chronique ↓ · Peut détecter un cancer tôt", cost: L => L.careCost() * 0.3 + median(L.here) * 0.03,
    when: L => L.calYear < 1930 ? "Pas encore d’usage à cette époque." : true,
    run: L => { L.bump("health", 3); L.checkupAt = L.age + 1; L.screenedAt = L.age; L.say("Fait un bilan de santé complet et s’entraîne avec un coach.", "health"); } },
  { id: "dating", label: "Faire des rencontres", fx: "Choisissez comment chercher · rencontre plus probable l’an prochain",
    when: L => L.age < 16 ? "Trop jeune." : L.married ? "Déjà en couple." : L.datingAt === L.age ? "Déjà cette année." : true,
    args: L => [["friends", "Sortir et demander à des amis de vous présenter quelqu’un", median(L.here) * 0.02], ["wide", "Chercher sans s’arrêter à l’écart d’âge", median(L.here) * 0.02]],
    run: (L, arg) => { L.datingAt = L.age; L.dating = { age: L.age + 1, wide: arg === "wide" }; L.say(arg === "wide" ? "Élargit ses recherches amoureuses, sans s’arrêter à l’âge." : "Sort davantage et demande à ses amis de lui présenter quelqu’un.", "family"); } },
  { id: "hobby", label: "Loisirs", fx: L => `Progresser grâce à du matériel et des cours, ou chercher un nouveau loisir · trois loisirs au plus${L.autoSpend && L.autoSpend.hobby ? " · réglé sur « Sans demander »" : ""}`,
    when: L => L.age < 6 ? "Trop jeune." : true,
    args: L => [
      ...hobbiesOf(L).map(id => [id, capFirst(PASSIONS[id].label.replace(/^(le |la |l’|les )/, "")), median(L.here) * 0.04]),
      ...(hobbiesOf(L).length < 3 ? [["new", "Chercher un nouveau loisir", median(L.here) * 0.015]] : []),
    ],
    run: (L, arg) => {
      if (arg === "new") {
        const pool = passionsFor(L).filter(id => !hobbiesOf(L).includes(id) && !PASSIONS[id].hidden);
        if (!pool.length) return "Rien de nouveau ici.";
        const id = pick(pool);
        L.hobbies = [...hobbiesOf(L), id];
        L.bump("happy", 2);
        L.say(`Se découvre un nouveau loisir : ${PASSIONS[id].label}.`, "life");
        return `Nouveau loisir : ${PASSIONS[id].label}.`;
      }
      L.bump("happy", 2);
      if (PASSIONS[arg].kind === "sport") L.bump("health", 1);
      if (L.passion && L.passion.id === arg) { L.passion.skill = clamp(L.passion.skill + 4, 0, 100); L.passion.trainAt = L.age; }
      L.say(`S’offre du matériel et des cours : ${PASSIONS[arg].label}.`, "life");
    } },
  { id: "donate", label: "Faire un don", fx: "Bonheur +4 · Relations +2", cost: L => median(L.here) * 0.05,
    when: L => L.age < 16 ? "À partir de 16 ans." : true,
    run: L => { L.bump("happy", 4); L.bump("rel", 2); L.say(pick(["Fait un don à une association.", "Donne pour l’école du quartier.", "Fait un don à son lieu de culte."]), "family"); } },
  { id: "renovate", label: "Réparations et rénovation du logement", fx: "Bonheur +6 · Valeur du logement +", cost: L => L.house ? L.house.value * 0.04 : 0,
    when: L => !L.house ? "Il faut être propriétaire." : true,
    run: (L, arg, x) => { L.bump("happy", 6); L.house.value += x * 0.8; L.say("Fait rénover son logement.", "money"); } },
  { id: "buyCar", label: "Acheter une voiture", fx: "Bonheur +3 · Liberté de déplacement · entretien chaque année", cost: L => median(L.here) * (L.here.gdp > 20000 ? 0.6 : 1.2),
    when: L => L.car ? "Vous avez déjà une voiture." : L.age < 18 ? "À partir de 18 ans." : L.calYear < 1915 ? "Les voitures sont encore un luxe rarissime." : true,
    run: (L, arg, x) => { L.car = { value: x }; L.bump("happy", 3); L.say("Achète une voiture.", "money", true); } },
  { id: "sellCar", label: "Vendre la voiture", fx: "Arrêter de conduire · plus de frais de réparation", gain: L => L.car ? L.car.value : 0,
    when: L => !L.car ? "Pas de voiture." : true,
    run: L => { L.addMoney(L.car.value); L.say(`Vend sa voiture (${money(L.car.value)}).`, "money"); L.car = null; } },
  { id: "bigger", label: "Déménager dans un logement plus grand", fx: "Bonheur +10 · Relations +3", cost: L => L.house ? L.house.value * 0.56 : 0,
    when: L => !L.house ? "Il faut être propriétaire." : true,
    run: L => { L.house.value *= 1.5; L.bump("happy", 10); L.bump("rel", 3); L.say("Déménage dans un logement plus grand.", "money", true); } },
  { id: "smaller", label: "Passer à un logement plus petit", fx: L => `Vendre le logement pour un plus petit · garder la différence · frais d’achat et de vente d’environ ${eur(L.house ? L.house.value * 0.06 : 0)}`, gain: L => L.house ? L.house.value * 0.34 : 0,
    when: L => !L.house ? "Il faut être propriétaire." : L.house.value < median(L.here) ? "Déjà un petit logement." : true,
    run: (L, arg, x) => { L.house.value *= 0.6; L.house.loan = Math.min(L.house.loan, L.house.value); L.addMoney(x); L.bump("happy", -2); L.say(`Passe à un logement plus petit et garde ${money(x)}.`, "money", true); } },
  { id: "sellHome", label: "Vendre le logement où vous vivez", fx: L => `Vous gardez le prix moins les frais et l’emprunt · Vous serez ensuite locataire`, gain: L => L.house ? Math.max(0, L.house.value * 0.94 - L.house.loan) : 0,
    when: L => !L.house ? "Pas de logement à vendre." : true,
    run: L => { L.sellHouse(); } },
];
const SPEND_BY_ID = Object.fromEntries(SPENDS.map(s => [s.id, s]));
function hobbiesOf(L) {
  const h = (L.hobbies || []).filter(id => PASSIONS[id]);
  if (L.passion && PASSIONS[L.passion.id] && !PASSIONS[L.passion.id].hidden && !h.includes(L.passion.id)) h.unshift(L.passion.id);
  return h.slice(0, 3);
}
const val = (f, L) => typeof f === "function" ? f(L) : f;

// Ce que la page affiche pour chaque dépense : titre, effets, prix, choix, possible ou non.
function spendOptions(L) {
  return SPENDS.map(s => {
    let why = s.when(L);
    if (why === true && (L.spentAt || {})[s.id] === L.age && s.id !== "props") why = "Déjà fait cette année.";
    const args = s.args ? s.args(L) : null;
    const cost = s.cost ? s.cost(L) : 0, gain = s.gain ? s.gain(L) : 0;
    const afford = x => x <= 0 || L.savings >= x;
    if (why === true && !args && !afford(cost)) why = "Pas assez d’argent.";
    return {
      id: s.id, label: val(s.label, L), fx: val(s.fx, L), note: s.note || "", ok: why === true, why: why === true ? "" : why,
      cost, gain, args: args && args.map(([id, label, x]) => ({ id, label, cost: x, ok: afford(x) })),
    };
  });
}
function spendDo(L, id, arg) {
  const s = SPEND_BY_ID[id];
  if (!s || !L.alive || s.when(L) !== true) return null;
  L.spentAt = L.spentAt || {};
  if (L.spentAt[id] === L.age && id !== "props") return null;
  let x = s.cost ? s.cost(L) : 0;
  if (s.args) { const a = s.args(L).find(a => a[0] === arg); if (!a) return null; x = a[2]; }
  if (s.gain) x = s.gain(L);
  if (!s.gain && x > 0) { if (L.savings < x) return null; L.withdraw(x); }
  L.spentAt[id] = L.age;
  const out = s.run(L, arg, Math.abs(x));
  L.snapshot();
  return typeof out === "string" ? out : s.gain || x < 0 ? `+${eur(Math.abs(x))}` : x > 0 ? `−${eur(x)}` : "C’est fait.";
}

// --- Méthodes ajoutées à Life -------------------------------------------------------------
Object.assign(Life.prototype, {
  lifeStyle() { return (this.lifestyle = { ...LIFESTYLE_DEFAULT, ...(this.lifestyle || {}) }); },
  // Maladies chroniques plus ou moins fréquentes selon l'alimentation.
  illnessMult() { const f = this.lifeStyle().food; return f === "care" ? 0.75 : f === "resto" ? 1.2 : 1; },
  // Chaque année : coûts et effets du mode de vie, voiture, loisirs, enfants, dépenses automatiques.
  lifestyleYear() {
    if (!this.alive || this.age < 18) return;
    this.propertiesYear();
    const ls = this.lifeStyle(), m = median(this.here), poor = this.savings < m * 0.1 && this.netIncome() < m * 0.6;
    if (!poor) {
      if (ls.gifts === "generous") { this.pay(m * 0.04); this.bump("rel", 1); }
      else if (ls.gifts === "half") { this.pay(m * 0.02); this.bump("rel", 0.3); }
      if (ls.food === "care") { this.pay(m * 0.02); this.bump("health", 0.3); }
      if (ls.food === "resto") { this.pay(m * 0.04); this.bump("happy", 1); this.bump("health", -0.2); }
      if (ls.insurance === "full") this.pay(this.rawCareCost() * 0.4 + m * 0.015 * (1 + this.age / 40));
    }
    if (ls.gifts === "none") this.bump("rel", -0.7);
    // La voiture perd de la valeur et coûte son entretien.
    if (this.car) { this.car.value *= 0.88; this.pay(m * 0.05); }
    // Les loisirs rendent heureux.
    const h = hobbiesOf(this).length;
    if (h) this.bump("happy", 0.6 * h);
    this.kidsYear();
    // « Sans demander » : seulement si l'épargne dépasse trois fois le coût.
    const auto = this.autoSpend || {};
    for (const [k, a] of Object.entries(AUTO)) {
      if (!auto[k] || !a.every) continue;
      if (a.every > 1 && auto[k + "At"] != null && this.age - auto[k + "At"] < a.every) continue;
      const s = SPEND_BY_ID[k], opt = spendOptions(this).find(o => o.id === k);
      if (!opt || (!opt.ok && opt.why !== "Pas assez d’argent.") || s.when(this) !== true) continue;
      const arg = opt.args ? (opt.args.find(x => x.id !== "new") || opt.args[0]).id : null;
      const cost = opt.args ? opt.args.find(x => x.id === arg).cost : opt.cost;
      if (this.savings < cost * 3) continue;
      if (spendDo(this, k, arg)) auto[k + "At"] = this.age;
    }
  },
  rawCareCost() { return median(this.here) * this.here.oop / 100; },
  // Les grandes dépenses des enfants : université, mariage, demandes d'argent.
  kidsYear() {
    const m = median(this.here), ask = !(this.autoSpend && this.autoSpend.kidsPay);
    for (const k of this.children) {
      if (!k.alive) continue;
      const age = this.age - k.born;
      const events = [];
      if (age === 18 && this.here.tert >= 8 && !k.uni) events.push(["uni", `${k.name} entre à l’université. Payer ses frais d’études ?`, m * 0.25, `Paie les frais d’université de ${k.name}.`, () => { k.uni = true; this.kidsFund += m * 0.25; this.bump("rel", 2); }]);
      if (age >= 22 && age <= 35 && !k.wed && rand() < 0.07) { k.wed = true; events.push(["wed", `${k.name} se marie. Participer aux frais du mariage ?`, m * 0.15, `Participe aux frais du mariage de ${k.name}.`, () => { this.bump("rel", 3); this.bump("happy", 3); }]); }
      if (age >= 20 && rand() < 0.04) events.push(["ask", `${k.name} vous demande de l’argent pour ${pick(["un projet", "payer des dettes", "un apport pour un logement", "lancer une affaire"])}. Donner ?`, m * 0.1, `Donne de l’argent à ${k.name}.`, () => { this.bump("rel", 2); this.kidsFund += m * 0.05; }]);
      for (const [id, text, x, said, fx] of events) {
        const pay = () => { this.pay(x); this.say(said, "family"); fx(); };
        const refuse = () => { this.say(`Ne peut pas, ou ne veut pas, payer pour ${k.name} cette fois.`, "family"); if (id !== "uni") this.bump("rel", -1); };
        if (ask) this.ask(`${text} (${eur(x)} aux prix français)`, [{ label: `Payer ${eur(x)}`, autoWeight: 2, apply: pay }, { label: "Non", autoWeight: 1, apply: refuse }]);
        else if (this.savings >= x * 3) pay();
      }
    }
  },
});
// L'assurance complète réduit le coût des soins ; elle verse une somme à la famille en cas de décès avant 70 ans.
{
  const careCost = Life.prototype.careCost, die = Life.prototype.die, hazard = Life.prototype.hazard;
  Life.prototype.careCost = function () { return careCost.call(this) * (this.lifestyle && this.lifestyle.insurance === "full" ? 0.3 : 1); };
  Life.prototype.die = function (cause) {
    die.call(this, cause);
    if (this.lifestyle && this.lifestyle.insurance === "full" && this.age >= 18 && this.age < 70) {
      const x = median(this.here) * 5;
      this.addMoney(x);
      this.log.splice(this.log.length - 1, 0, { age: this.age, year: this.calYear, text: `L’assurance verse ${money(x)} à la famille.`, kind: "money" });
    }
  };
  // Un bilan récent fait détecter certaines maladies à temps.
  Life.prototype.hazard = function () { return hazard.call(this) * (this.screenedAt != null && this.age - this.screenedAt <= 1 ? 0.93 : 1); };
}

// --- Immobilier : biens à vendre, pour y vivre, les louer ou en résidence secondaire ----
// size : prix en part d'un logement moyen ; yield : loyer brut par an ; happy : bonheur d'une résidence secondaire.
const PROPERTY_TYPES = [
  { id: "studio", label: "Studio en centre-ville", size: 0.45, yield: 0.055, happy: 1, urban: true },
  { id: "appart", label: "Appartement familial", size: 0.9, yield: 0.045, happy: 2 },
  { id: "maison", label: "Maison avec jardin", size: 1.2, yield: 0.04, happy: 3 },
  { id: "campagne", label: "Maison de campagne", size: 0.7, yield: 0.03, happy: 3 },
  { id: "mer", label: "Maison au bord de la mer", size: 1.6, yield: 0.035, happy: 4 },
  { id: "montagne", label: "Chalet à la montagne", size: 1.3, yield: 0.035, happy: 4, minGdp: 15000 },
  { id: "immeuble", label: "Petit immeuble de rapport (4 logements)", size: 3.2, yield: 0.06, happy: 0, rentOnly: true },
  { id: "villa", label: "Villa de standing", size: 4.5, yield: 0.03, happy: 5, minTier: 4 },
];
function propertyOffers(L, affordableOnly) {
  const c = L.here, base = L.housePrice() / (L.urban ? 1.2 : 0.75), d = L.houseDeal();
  if (!L.estateOffers || L.estateOffers.age !== L.age) {
    const pool = PROPERTY_TYPES.filter(t => (!t.minGdp || c.gdp >= t.minGdp) && (!t.minTier || L.livingTier() >= t.minTier));
    const picked = [];
    while (picked.length < 4 && pool.length) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    L.estateOffers = { age: L.age, list: picked.map(t => ({ type: t.id, noise: 0.85 + rand() * 0.3 })) };
  }
  const rich = c.gdp > 25000, canBorrow = d.canBorrow, rate = L.mortgageRate();
  return L.estateOffers.list.map(o => {
    const t = PROPERTY_TYPES.find(x => x.id === o.type), price = base * t.size * o.noise;
    const down = canBorrow ? price * (rich ? 0.2 : 0.3) : price, loan = price - down;
    const payment = loan ? loan * rate / (1 - (1 + rate) ** -25) : 0;
    return { ...t, price, down, loan, rate, payment, ok: L.savings >= down + price * 0.04 };
  }).filter(o => !affordableOnly || o.ok);
}
Object.assign(Life.prototype, {
  askProperty() {
    const offers = propertyOffers(this, true);
    if (!offers.length) return;
    this.ask("Des biens sont à vendre. Lequel acheter ?", [
      ...offers.map(o => ({
        label: `${o.label} · ${money(o.price)}`,
        sub: `≈ ${eur(o.price)} aux prix français · ${o.loan ? `apport ${eur(o.down)}, emprunt ${eur(o.loan)} sur 25 ans (${eur(o.payment)} par an)` : "payé comptant"} · frais de notaire ≈ ${eur(o.price * 0.04)} · loyer possible ≈ ${eur(o.price * o.yield)} par an`,
        autoWeight: 1, apply: () => this.askUse(o),
      })),
      { label: "Rien pour l’instant", autoWeight: 1, apply: () => this.say("Visite des biens à vendre, sans acheter.", "money") },
    ]);
  },
  askUse(o) {
    const opts = [];
    if (!o.rentOnly) opts.push({ label: "Y vivre", sub: this.house ? "Votre logement actuel sera mis en location." : "Vous devenez propriétaire de votre logement.", autoWeight: this.house ? 0.5 : 3, apply: () => this.buyProperty(o, "live") });
    opts.push({ label: "Le louer", sub: `≈ ${eur(o.price * o.yield)} de loyer par an, moins l’entretien, les impôts et les mois sans locataire`, autoWeight: 2, apply: () => this.buyProperty(o, "rent") });
    if (!o.rentOnly) opts.push({ label: "En faire une résidence secondaire", sub: `Bonheur +${o.happy} chaque année · entretien ≈ ${eur(o.price * 0.015)} par an`, autoWeight: 1, apply: () => this.buyProperty(o, "second") });
    this.ask(`${o.label} : qu’en faire ?`, opts);
  },
  buyProperty(o, use) {
    if (this.savings < o.down + o.price * 0.04) { this.say("L’achat tombe à l’eau : pas assez d’apport.", "money"); return; }
    this.withdraw(o.down + o.price * 0.04);
    const asset = { type: o.id, label: o.label, value: o.price, loan: o.loan, rate: o.rate, payment: o.payment, yield: o.yield, happy: o.happy };
    this.props = this.props || [];
    if (use === "live") {
      if (this.house) this.props.push({ type: "ancien", label: "Ancien logement", value: this.house.value, loan: this.house.loan, rate: this.house.rate, payment: this.house.payment, yield: 0.045, happy: 0, use: "rent" });
      this.house = { value: o.price, loan: o.loan, rate: o.rate, payment: o.payment };
      this.say(`Achète ${o.label.toLowerCase()} pour y vivre (${money(o.price)}).`, "money", true);
      this.bump("happy", 5);
    } else {
      this.props.push({ ...asset, use });
      this.say(use === "rent" ? `Achète ${o.label.toLowerCase()} pour le louer (${money(o.price)}).` : `Achète ${o.label.toLowerCase()} comme résidence secondaire (${money(o.price)}).`, "money", true);
      this.bump("happy", use === "second" ? 4 : 2);
    }
  },
  // Chaque année : valeur des biens, emprunts, loyers, entretien.
  propertiesYear() {
    if (!this.props || !this.props.length) return;
    let cash = 0;
    for (const p of this.props) {
      p.value *= 1 + housingReturn(this.code, this.calYear);
      if (p.loan > 0) { p.loan = Math.max(0, p.loan * (1 + p.rate) - p.payment); cash -= p.payment; }
      if (p.use === "rent") cash += p.value * p.yield * (rand() < 0.12 ? 0.6 : 1) * 0.8 - p.value * 0.01;
      else { cash -= p.value * 0.015; this.bump("happy", p.happy / 2); }
    }
    this.addMoney(cash);
  },
});
{
  const netWorth = Life.prototype.netWorth;
  Life.prototype.netWorth = function () { return netWorth.call(this) + (this.props || []).reduce((s, p) => s + p.value - p.loan, 0); };
}

// --- Page « Dépenser et investir » (commune aux deux versions) -------------------------
const ASSET_RETURNS = {
  cash: "rien, et l’inflation le ronge", deposit: "1 à 1,5 % par an, inflation déduite", tontine: "un peu, si chacun paie son tour", bonds: "environ 2 % en moyenne, faibles variations",
  stocks: "environ 5 % en moyenne, fortes variations", world: "environ 5 % en moyenne, risque réparti", rental: "loyers et valeur du bien, environ 4 %", gold: "rien en moyenne, de longues années à la baisse",
  livestock: "le croît du troupeau, si la sécheresse épargne", crypto: "extrêmement variable : +300 % ou −70 % en un an",
};
function spendHtml(L) {
  const opts = spendOptions(L), ls = L.lifeStyle(), auto = L.autoSpend || {};
  const price = (x, gain) => x === 0 && !gain ? `<span class="sp-price"><b>Gratuit</b></span>` : `<span class="sp-price"><b>${gain ? "+" : ""}${eur(x)}</b><small>aux prix français</small></span>`;
  const card = o => `<div class="sp-card${o.ok ? "" : " off"}">
      <div class="sp-main"><b>${esc(o.label)}</b><small>${esc([o.fx, o.args ? o.note : "", o.ok ? "" : o.why].filter(Boolean).join(" · "))}</small>
      ${o.args && o.ok ? `<div class="sp-pills">${o.args.map(a => `<button class="sp-pill" data-sp="${o.id}" data-arg="${esc(a.id)}" ${a.ok ? "" : "disabled"}>${esc(a.label)} <span>${a.cost < 0 ? "+" : ""}${eur(Math.abs(a.cost))}</span></button>`).join("")}</div>` : ""}</div>
      ${o.args ? "" : o.ok ? `<button class="sp-buy" data-sp="${o.id}">${price(o.gain || o.cost, !!o.gain)}</button>` : price(o.gain || o.cost, !!o.gain)}
    </div>`;
  const now = opts.filter(o => o.ok), later = opts.filter(o => !o.ok && !/^(Pas de |Il faut être|Pas d’enfant|Aucun enfant|Pas de voiture|Vous avez déjà)/.test(o.why));
  const first = now.slice(0, 6), more = [...now.slice(6), ...later];
  const lsSummary = Object.entries(LIFESTYLE).map(([k, g]) => `${g.label} : ${g.opts[ls[k]][1]}`).join(" · ")
    + (Object.keys(AUTO).some(k => auto[k]) ? ` · sans demander : ${Object.keys(AUTO).filter(k => auto[k]).map(k => AUTO[k].label).join(", ")}` : "");
  const autoSub = k => { const a = AUTO[k]; if (a.sub) return a.sub; const at = auto[k + "At"]; return `${a.every > 1 ? "tous les deux ans" : "chaque année"}${at != null ? ` · dernière fois à ${at} ans` : ""}`; };
  const assets = Object.keys(ASSETS).filter(k => assetAvailable(L, k));
  return `<div class="sp">
    <p class="sp-head">À faire maintenant</p>
    ${first.map(card).join("") || `<p class="sp-note">Rien à dépenser pour l’instant.</p>`}
    ${more.length ? `<details class="sp-more"><summary>Voir plus (${more.length})</summary>${more.map(card).join("")}</details>` : ""}
    <details class="sp-more sp-life"><summary><b>Mode de vie</b> <small>${esc(lsSummary)}</small></summary>
      ${Object.entries(LIFESTYLE).map(([k, g]) => `<p class="sp-head">${g.label}</p><div class="sp-pills">${Object.entries(g.opts).map(([v, [label]]) => `<button class="sp-pill${ls[k] === v ? " on" : ""}" data-ls="${k}" data-v="${v}">${esc(label)}</button>`).join("")}</div><p class="sp-note">${g.note}</p>`).join("")}
      <p class="sp-head">Sans demander</p>
      <div class="sp-pills">${Object.keys(AUTO).map(k => `<button class="sp-pill${auto[k] ? " on" : ""}" data-auto="${k}">${esc(AUTO[k].label)} <span>· ${esc(k === "kidsMoney" && L.children.some(c => isAdultKid(L, c)) ? `${autoSub(k)} · à votre enfant adulte` : k === "hobby" && hobbiesOf(L).length ? `${autoSub(k)} · ${PASSIONS[hobbiesOf(L)[0]].label.replace(/^(le |la |l’|les )/, "")}` : k === "tripHome" || k === "tripAbroad" ? `${autoSub(k)} · avec vos amis` : autoSub(k))}</span></button>`).join("")}</div>
      <p class="sp-note">Une fois activé, chaque réglage s’applique de lui-même le moment venu ; ce qui coûte de l’argent, seulement si votre épargne dépasse trois fois le coût. Appuyez de nouveau pour désactiver. Sans « Payer pour les enfants sans demander », chaque frais d’université, de mariage ou demande d’argent d’un enfant vous est posé comme une question.</p>
    </details>
    <p class="sp-head">Faire fructifier votre épargne</p>
    <div class="sp-pills">${assets.map(k => `<button class="sp-pill${(L.alloc[k] || 0) > 0 ? " on" : ""}" data-asset-toggle="${k}">${ASSETS[k].label} <span>· ${ASSET_RETURNS[k]}</span></button>`).join("")}</div>
    <p class="sp-note">Appuyez pour ajouter un placement à votre épargne ou l’en retirer ; la répartition se règle plus bas. Rendements réels, inflation déduite.</p>
  </div>`;
}
// Un clic dans la page : renvoie un message court, ou null.
function spendClick(L, t) {
  const bz = t.closest("[data-biz]");
  if (bz) return bizAction(L, bz.dataset.biz, bz.dataset.arg) || "Impossible pour l’instant.";
  const sp = t.closest("[data-sp]"), lsb = t.closest("[data-ls]"), au = t.closest("[data-auto]"), as = t.closest("[data-asset-toggle]");
  if (sp) return spendDo(L, sp.dataset.sp, sp.dataset.arg) || "Impossible pour l’instant.";
  if (lsb) { L.lifeStyle()[lsb.dataset.ls] = lsb.dataset.v; return `${LIFESTYLE[lsb.dataset.ls].label} : ${LIFESTYLE[lsb.dataset.ls].opts[lsb.dataset.v][1]}`; }
  if (au) { L.autoSpend = L.autoSpend || {}; const k = au.dataset.auto; L.autoSpend[k] = !L.autoSpend[k]; return `${AUTO[k].label} : ${L.autoSpend[k] ? "activé" : "désactivé"}`; }
  if (as) { const k = as.dataset.assetToggle; if ((L.alloc[k] || 0) > 0) L.alloc[k] = 0; else L.alloc[k] = 20; L.rebalance(); return `${ASSETS[k].label} : ${(L.alloc[k] || 0) > 0 ? "ajouté" : "retiré"}`; }
  return null;
}
