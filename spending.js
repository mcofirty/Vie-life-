// Dépenser et vivre : ce qu'on fait de son argent au fil des années (proches, voyages,
// santé, rencontres, loisirs, dons, logement, voiture, logements à louer, testament),
// le mode de vie (placements, cadeaux de mariage et d'obsèques, assurance, alimentation)
// et ce qui se fait « sans demander » chaque année. Montants en dollars PPA, affichés
// aussi en euros aux prix français.

const eur = x => Math.abs(x * 0.72) >= 1e6 ? compactMoney(x * 0.72, "€") : `${Math.round(x * 0.72).toLocaleString("fr-FR")} €`;
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
    when: L => L.age < 18 ? "À partir de 18 ans." : planned(L.code, L.calYear) ? "Interdit dans une économie planifiée." : !propertyOffers(L, true).length ? `Pas assez pour un apport (il faut au moins ${eur(Math.min(...propertyOffers(L, false).map(o => o.down)))}).` : true,
    run: L => { L.askProperty(); return "Des biens sont à vendre"; } },
  { id: "props", label: "Vos biens immobiliers", fx: L => (L.props || []).map(p => `${p.label} (${p.use === "rent" ? `loué ${eur(p.value * p.yield)} par an` : p.use === "share" ? "part de propriété" : "résidence secondaire"}) : ${eur(p.value)}${p.loan > 0 ? `, reste ${eur(p.loan)}` : ""}`).join(" · ") + " · Vendre entraîne des frais d’environ 6 %",
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
    if (why === true && (L.spentAt || {})[s.id] === L.age && s.id !== "props" && s.id !== "realestate") why = "Déjà fait cette année.";
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
  if (L.spentAt[id] === L.age && id !== "props" && id !== "realestate") return null;
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
    this.adoptionYear();
    // Sans argent devant soi (ou avec de lourdes dettes), ces dépenses de mode de vie sont suspendues.
    const ls = this.lifeStyle(), m = median(this.here), poor = (this.savings < m * 0.1 && this.netIncome() < m * 0.6) || this.debt > Math.max(this.netIncome(), m) * 0.5;
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
        if (ask) this.ask(`${text} (${eur(x)} aux prix français)`, [{ label: `Payer ${eur(x)}`, sub: this.savings < x ? "Plus que votre épargne : le reste sera emprunté." : "", autoWeight: this.savings >= x ? 2 : 0.1, apply: pay }, { label: "Non", autoWeight: 1, apply: refuse }]);
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
  { id: "chambre", label: "Chambre de bonne sous les toits", size: 0.2, yield: 0.06, happy: 0, urban: true },
  { id: "studio", label: "Studio en centre-ville", size: 0.45, yield: 0.055, happy: 1, urban: true },
  { id: "campagne", label: "Maison de campagne", size: 0.7, yield: 0.03, happy: 3 },
  { id: "appart", label: "Appartement familial", size: 0.9, yield: 0.045, happy: 2 },
  { id: "maison", label: "Maison avec jardin", size: 1.2, yield: 0.04, happy: 3 },
  { id: "montagne", label: "Chalet à la montagne", size: 1.3, yield: 0.035, happy: 4, minGdp: 15000 },
  { id: "mer", label: "Maison au bord de la mer", size: 1.6, yield: 0.035, happy: 4 },
  { id: "loft", label: "Grand loft en ville", size: 2.2, yield: 0.04, happy: 3, urban: true },
  { id: "immeuble", label: "Petit immeuble de rapport (4 logements)", size: 3.2, yield: 0.06, happy: 0, rentOnly: true },
  { id: "villa", label: "Villa de standing avec piscine", size: 4.5, yield: 0.03, happy: 5 },
  { id: "penthouse", label: "Penthouse avec vue sur la ville", size: 8, yield: 0.03, happy: 5 },
  { id: "immeuble2", label: "Immeuble de 20 logements", size: 12, yield: 0.055, happy: 0, rentOnly: true },
  { id: "hotelpart", label: "Hôtel particulier en centre-ville", size: 15, yield: 0.025, happy: 6 },
  { id: "chateau", label: "Château avec son parc", size: 25, yield: 0.02, happy: 7 },
  { id: "residence", label: "Résidence étudiante", size: 30, yield: 0.06, happy: 0, rentOnly: true },
  { id: "bureaux", label: "Immeuble de bureaux", size: 60, yield: 0.055, happy: 0, rentOnly: true },
  { id: "ile", label: "Villa sur une île privée", size: 90, yield: 0.02, happy: 9 },
  { id: "galerie", label: "Centre commercial", size: 150, yield: 0.06, happy: 0, rentOnly: true },
  { id: "tour", label: "Tour de bureaux dans un quartier d’affaires", size: 400, yield: 0.05, happy: 0, rentOnly: true },
];
// Les biens à vendre, choisis selon votre patrimoine : du plus modeste au plus luxueux que vous puissiez acheter.
function propertyOffers(L, affordableOnly) {
  const c = L.here, base = L.housePrice() / (L.urban ? 1.2 : 0.75), d = L.houseDeal(), y = L.calYear;
  const rich = c.gdp > 25000, canBorrow = d.canBorrow, rate = L.mortgageRate(), r = clamp(rate, 0.005, 0.2);
  const annuity = (1 - (1 + r) ** -25) / r;
  const deal = (t, noise) => {
    const price = base * t.size * noise;
    // Emprunt : au plus ce que les revenus (et le loyer du bien, s'il se loue) permettent de rembourser.
    const capacity = Math.max(0, L.netIncome() * 0.4 + price * t.yield * 0.6);
    const maxLoan = canBorrow ? Math.min(price * (rich ? 0.8 : 0.7), capacity * annuity) : 0;
    const loan = maxLoan, down = price - loan, payment = loan ? loan * r / (1 - (1 + r) ** -25) : 0;
    return { ...t, price, down, loan, rate: r, payment, ok: L.savings >= down + price * 0.04 };
  };
  if (!L.estateOffers || L.estateOffers.age !== L.age || L.estateOffers.n !== (L.props || []).length + (L.house ? 1 : 0)) {
    const pool = PROPERTY_TYPES.filter(t => (!t.minGdp || c.gdp >= t.minGdp) && (!t.urban || L.urban || t.size >= 2) && y >= 1900);
    const all = pool.map(t => deal(t, 0.85 + rand() * 0.3)).sort((a, b) => a.price - b.price);
    const can = all.filter(o => o.ok);
    // Six offres : les plus chères que vous pouvez acheter, quelques-unes au milieu, et des plus modestes.
    const pickIdx = new Set();
    if (can.length) { [can.length - 1, can.length - 2, Math.floor(can.length * 0.66), Math.floor(can.length / 2), Math.floor(can.length / 3), 0].forEach(i => { if (i >= 0) pickIdx.add(can[i].id); }); }
    // Et un ou deux biens hors de portée, pour voir ce qui vient ensuite.
    all.filter(o => !o.ok).slice(0, 1).forEach(o => pickIdx.add(o.id));
    L.estateOffers = { age: L.age, n: (L.props || []).length + (L.house ? 1 : 0), list: all.filter(o => pickIdx.has(o.id)).map(o => ({ type: o.id, noise: o.price / (base * o.size) })) };
  }
  return L.estateOffers.list.map(o => deal(PROPERTY_TYPES.find(x => x.id === o.type), o.noise)).filter(o => !affordableOnly || o.ok).sort((a, b) => b.price - a.price);
}
Object.assign(Life.prototype, {
  askProperty() {
    const offers = propertyOffers(this, false);
    if (!offers.some(o => o.ok)) return;
    this.ask(`Des biens sont à vendre, à la mesure de votre patrimoine (${money(Math.max(0, this.netWorth()))}). Lequel acheter ?`, [
      ...offers.map(o => ({
        label: `${o.label} · ${money(o.price)}`,
        sub: `≈ ${eur(o.price)} aux prix français · ${o.loan ? `apport ${eur(o.down)}, emprunt ${eur(o.loan)} sur 25 ans (${eur(o.payment)} par an)` : "payé comptant"} · frais de notaire ≈ ${eur(o.price * 0.04)} · loyer possible ≈ ${eur(o.price * o.yield)} par an`,
        ...(o.ok ? {} : { label: `${o.label} · ${money(o.price)} · hors de portée`, sub: `Il faudrait ${eur(o.down + o.price * 0.04)} d’apport et de frais ; vous avez ${eur(Math.max(0, this.savings))}.` }),
        autoWeight: o.ok ? 1 : 0, apply: () => o.ok ? this.askUse(o) : this.say(`Rêve devant ${o.label.toLowerCase()}, encore hors de portée.`, "money"),
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
      if (p.use === "share") continue; // une part de la maison familiale : elle prend de la valeur, sans loyer ni entretien
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

// --- Testament : à qui laisser son héritage ------------------------------------------
function willCandidates(L) {
  const out = [], g = (m, f, sex) => sex === "m" ? m : f;
  for (const k of L.children) if (k.alive) out.push({ key: `kid:${k.name}`, label: k.name, sub: `${k.adopted ? g("fils adopté", "fille adoptée", k.sex) : g("fils", "fille", k.sex)}, ${L.age - k.born} an${L.age - k.born > 1 ? "s" : ""}` });
  if (L.married && L.partner) out.push({ key: "partner", label: L.partner, sub: L.sex === "m" ? "épouse" : "époux" });
  for (const s of L.sibs) if (s.alive && s.born <= L.age) out.push({ key: `sib:${s.name}`, label: s.name, sub: g("frère", "sœur", s.sex) });
  for (const p of L.parents) if (p.alive) out.push({ key: `parent:${p.name}`, label: p.name, sub: g("père", "mère", p.sex) });
  if (L.grandkids) out.push({ key: "grand", label: "Les petits-enfants", sub: String(L.grandkids) });
  out.push({ key: "friends", label: "Vos amis proches", sub: "" }, { key: "charity", label: "Des associations", sub: "" });
  return out;
}
const willDefault = L => L.children.filter(k => k.alive).map(k => `kid:${k.name}`);
// Les bénéficiaires du testament encore en vie (par défaut : vos enfants).
function activeWill(L) {
  const ok = new Set(willCandidates(L).map(c => c.key));
  return (L.willTo ?? willDefault(L)).filter(k => ok.has(k));
}
// Don fait de son vivant à un enfant dont on joue la vie : sa part du testament, prise sur tout
// le patrimoine (épargne, maison, biens immobiliers, parts des entreprises), après droits. Les dettes
// restent à l'aïeul : on ne transmet que la part du patrimoine qui n'est pas due.
function donationFor(L, kid) {
  const keys = activeWill(L), key = `kid:${kid.name}`, inWill = keys.includes(key);
  const c = countryAt(kid.code || L.code, L.calYear), taxRate = c.gdp > 30000 ? 0.15 : 0.05;
  const eq = {
    cash: Math.max(0, L.savings),
    house: L.house ? Math.max(0, L.house.value - L.house.loan) : 0,
    props: (L.props || []).reduce((s, p) => s + Math.max(0, p.value - p.loan), 0),
    biz: (L.businesses || []).reduce((s, b) => s + b.value * (b.stake ?? 1), 0),
  };
  const gross = eq.cash + eq.house + eq.props + eq.biz, net = gross - (L.debt || 0);
  const frac = inWill && gross > 0 ? clamp(net / gross, 0, 1) / keys.length : 0;
  const value = gross * frac;
  return { inWill, frac, taxRate, eq, share: value, gross: value, net: value * (1 - taxRate), tax: value * taxRate };
}
// Qui partage l'héritage, vu par l'enfant qui hérite : « Lina (votre sœur) », « Paul (votre oncle) »…
function heirRelation(L, kid, key) {
  const [type, name] = key.split(/:(.*)/s), g = (sex, m, f) => sex === "m" ? m : f;
  if (type === "kid") {
    const c = L.children.find(x => x.name === name) || { sex: "f" };
    const half = c.other && kid.other && c.other !== kid.other;
    return `${name} (${half ? g(c.sex, "votre demi-frère", "votre demi-sœur") : g(c.sex, "votre frère", "votre sœur")}${c.adopted ? g(c.sex, ", adopté", ", adoptée") : ""})`;
  }
  if (type === "partner") return `${L.partner} (${L.partner === kid.other ? g(L.sex === "m" ? "f" : "m", "votre père", "votre mère") : g(L.sex === "m" ? "f" : "m", "votre beau-père", "votre belle-mère")})`;
  if (type === "sib") { const x = L.sibs.find(v => v.name === name) || {}; return `${name} (${g(x.sex, "votre oncle", "votre tante")})`; }
  if (type === "parent") { const x = L.parents.find(v => v.name === name) || {}; return `${name} (${g(x.sex, "votre grand-père", "votre grand-mère")})`; }
  if (type === "grand") return `les petits-enfants ${de(L.name)} (vos neveux et nièces)`;
  if (type === "friends") return `des amis proches ${de(L.name)}`;
  if (type === "charity") return "des associations";
  return name || key;
}
// La transmission elle-même : la même fraction de chaque bien passe de l'aïeul à l'enfant.
function giveToHeir(L, K, kid) {
  const g = donationFor(L, kid);
  if (!g.inWill) { K.say(`${L.name} ne vous a pas prévu dans son testament : pas de patrimoine à recevoir.`, "money"); return g; }
  if (g.frac <= 0) { K.say(`${L.name} n’a pas de patrimoine à transmettre : ses dettes dépassent ce qu’${L.g("il", "elle")} possède.`, "money"); return g; }
  const fr = g.frac, keep = 1 - fr, rec = fr * (1 - g.taxRate), parts = [], shared = [];
  K.props = K.props || []; K.businesses = K.businesses || [];
  const fin = {};
  for (const [k, v] of Object.entries(L.assets || {})) { const x = v * fr; if (x > 1) { fin[k] = x; L.assets[k] = v - x; } }
  const got = K.receiveFinance(fin, 1 - g.taxRate);
  if (got.total > 1) parts.push(`${money(got.total)} de placements (${got.labels})`);
  if (L.house && L.house.value > 0) {
    const h = L.house;
    const item = { type: "share", label: `Part de la maison ${de(L.name)}`, use: "share", value: h.value * rec, loan: h.loan * rec, rate: h.rate, payment: h.payment * rec, yield: 0, happy: 0 };
    K.props.push(item);
    shared.push({ kind: "house", ref: item, whole: h.value, wholeLoan: h.loan, wholePay: h.payment });
    h.value *= keep; h.loan *= keep; h.payment *= keep;
    parts.push(fr >= 0.999 ? "la maison familiale (l’aïeul y vit toujours)" : `${Math.round(fr * 100)} % de la maison familiale`);
  }
  for (const p of [...(L.props || [])]) {
    const item = { ...p, value: p.value * rec, loan: p.loan * rec, payment: (p.payment || 0) * rec };
    K.props.push(item);
    shared.push({ kind: "prop", ref: item, whole: p.value, wholeLoan: p.loan, wholePay: p.payment || 0 });
    if (fr >= 0.999) L.props.splice(L.props.indexOf(p), 1); else { p.value *= keep; p.loan *= keep; p.payment = (p.payment || 0) * keep; }
  }
  if ((L.props || []).length || g.eq.props > 0) parts.push(fr >= 0.999 ? "ses biens immobiliers" : `${Math.round(fr * 100)} % de ses biens immobiliers`);
  for (const b of [...(L.businesses || [])]) {
    // L'enfant devient actionnaire ; un gérant dirige sa part.
    const clone = { ...b, stake: (b.stake ?? 1) * rec, mode: "managed", manager: b.manager ? { ...b.manager } : null, did: {}, sideNoted: false };
    K.businesses.push(clone);
    shared.push({ kind: "biz", ref: clone, wholeStake: b.stake ?? 1 });
    if (fr >= 0.999) { if (L.focusBiz(b)) L.dropBusiness(); L.bizFocus = 0; } else b.stake = (b.stake ?? 1) * keep;
    parts.push(fr >= 0.999 ? `l’entreprise « ${b.label} »` : `${Math.round(fr * 100)} % de l’entreprise « ${b.label} »`);
  }
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}` : parts[0] || "rien";
  L.say(`Transmet de son vivant à ${kid.name} sa part du patrimoine : ${list} (${money(g.tax)} de droits).`, "money", true);
  K.say(`Reçoit ${de(L.name)}, de son vivant, sa part du patrimoine (≈ ${money(g.net)}) : ${list}.`, "money", true);
  K.bump("happy", 3);
  // Un héritage partagé : pour chaque bien détenu à plusieurs, c'est à vous de choisir.
  if (fr < 0.999 && shared.length) {
    const others = [`${L.name} (${L.sex === "m" ? "votre père" : "votre mère"})`, ...activeWill(L).filter(k => k !== `kid:${kid.name}`).map(k => heirRelation(L, kid, k))];
    const join = l => l.length > 1 ? `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}` : l[0];
    const co = join(others), coNames = join(others.map(x => x.replace(/ \(.*\)$/, "")));
    for (const it of shared) K.askSharedAsset(it, co, L.name, coNames);
  }
  return g;
}
// --- L'héritage à la mort : les biens eux-mêmes, pas seulement leur valeur ----------------
// Le patrimoine bien par bien : placements (par classe), maison, biens immobiliers, entreprises, dettes.
function estateItems(L) {
  return {
    fin: Object.fromEntries(Object.entries(L.assets || {}).filter(([, v]) => v > 1).map(([k, v]) => [k, Math.round(v)])),
    house: L.house && L.house.value > 0 ? { value: L.house.value, loan: L.house.loan || 0, rate: L.house.rate || 0, payment: L.house.payment || 0, built: !!L.house.built } : null,
    props: (L.props || []).map(p => ({ ...p })),
    biz: (L.businesses || []).map(b => JSON.parse(JSON.stringify(b))),
    debt: L.debt || 0,
  };
}
const itemsGross = I => Object.values(I.fin || {}).reduce((s, v) => s + v, 0) + (I.house ? Math.max(0, I.house.value - I.house.loan) : 0)
  + (I.props || []).reduce((s, p) => s + Math.max(0, p.value - p.loan), 0) + (I.biz || []).reduce((s, b) => s + (b.value || 0) * (b.stake ?? 1), 0);
// La part de chaque bien qui revient à un enfant (w : sa part du testament). Les droits de succession et
// sa part des dettes se règlent ensuite en argent ; si les dettes dépassent tout, il n'y a rien à hériter.
function bequestFor(rec, heirName, w, keys) {
  const d = rec.dyn, I = d.items, kid = d.heirs.find(h => h.name === heirName), c = countryAt(kid.code, kid.year);
  const gross = itemsGross(I), scale = gross > (I.debt || 0) ? 1 : 0;
  const label = k => { const [t, nm] = k.split(/:(.*)/s), x = (d.allKids || []).find(v => v.name === nm), cand = (d.cands || []).find(v => v.key === k);
    return t === "kid" ? `${nm} (${x && x.sex === "m" ? "votre frère" : "votre sœur"})` : cand ? `${cand.label}${cand.sub ? ` (${cand.sub})` : ""}` : k; };
  const others = keys ? keys.filter(k => k !== `kid:${heirName}`) : d.heirs.filter(h => h.name !== heirName).map(h => `kid:${h.name}`);
  return { items: I, frac: w * scale, tax: c.gdp > 30000 ? 0.15 : 0.05, from: rec.s.name, sex: rec.s.sex, co: others.map(label) };
}
// En quelques mots : « la maison familiale, 2 biens immobiliers, 50 % de « Banque », des placements ».
function bequestParts(B) {
  if (!B || !(B.frac > 0)) return [];
  const I = B.items, sole = B.frac >= 0.999, pct = `${Math.round(B.frac * 100)} %`, out = [];
  if (I.house && I.house.value > 0) out.push(sole ? "la maison familiale" : `${pct} de la maison familiale`);
  if ((I.props || []).length) out.push(`${sole ? "" : `${pct} de `}${I.props.length > 1 ? `${I.props.length} biens immobiliers` : `« ${I.props[0].label} »`}`);
  for (const b of I.biz || []) out.push(`${sole && (b.stake ?? 1) >= 0.999 ? "l’entreprise" : `${Math.round(B.frac * (b.stake ?? 1) * 100)} % de l’entreprise`} « ${b.label} »`);
  const fk = Object.keys(I.fin || {}).filter(k => I.fin[k] * B.frac > 1);
  if (fk.length) out.push(`des placements (${fk.map(k => ASSETS[k].label.toLowerCase()).join(", ")})`);
  return out;
}
const andList = l => l.length > 1 ? `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}` : l[0] || "";

Object.assign(Life.prototype, {
  // Des placements reçus : chaque classe reste ce qu'elle est (actions, obligations, or…), et la
  // répartition visée s'y ajuste, pour que le rééquilibrage de l'année ne les revende pas.
  receiveFinance(fin, rec) {
    let total = 0; const got = [];
    const viaBank = ["deposit", "bonds", "stocks", "world", "rental"];
    if (!this.bank && Object.entries(fin || {}).some(([k, v]) => viaBank.includes(k) && v * rec > 1)) this.openBank(true);
    for (const [k, v] of Object.entries(fin || {})) {
      const x = v * rec;
      if (!(x > 1) || !ASSETS[k]) continue;
      // Ce qui n'existe pas ici (bétail en ville, tontine ailleurs…) est vendu et placé en liquide ou en épargne.
      const key = assetAvailable(this, k) ? k : this.bank ? "deposit" : "cash";
      this.assets[key] = (this.assets[key] || 0) + x; total += x; got.push(ASSETS[key].label.toLowerCase());
    }
    if (total > 1) this.allocFromHoldings();
    return { total, labels: [...new Set(got)].join(", ") };
  },
  // La répartition visée devient celle du portefeuille détenu.
  allocFromHoldings() {
    const held = Object.entries(this.assets).filter(([k, v]) => v > 1 && k !== "livestock" && assetAvailable(this, k)), sum = held.reduce((s, [, v]) => s + v, 0);
    if (sum > 0) this.alloc = Object.fromEntries(held.map(([k, v]) => [k, Math.max(1, Math.round(v / sum * 100))]));
  },
  // L'héritage d'une vie précédente, bien par bien ; pour chaque bien, c'est vous qui décidez ensuite.
  receiveBequest(B) {
    const I = B.items, from = B.from, rec = B.frac, sole = B.frac >= 0.999, pct = Math.round(B.frac * 100);
    if (!(rec > 0)) { this.say(`${from} ne vous a rien laissé : ${itemsGross(I) > (I.debt || 0) ? "vous n’étiez pas sur son testament" : "ses dettes dépassaient ce qu’" + (B.sex === "m" ? "il" : "elle") + " possédait"}.`, "money"); return; }
    this.props = this.props || []; this.businesses = this.businesses || [];
    const parts = [], shared = [], solo = [];
    const fin = this.receiveFinance(I.fin, rec);
    if (fin.total > 1) parts.push(`${money(fin.total)} de placements (${fin.labels})`);
    if (I.house && I.house.value > 0) {
      const h = I.house;
      const item = { type: sole ? "famille" : "share", label: sole ? `Maison ${de(from)}` : `Part de la maison ${de(from)}`, use: sole ? "second" : "share", value: h.value * rec, loan: h.loan * rec, rate: h.rate, payment: h.payment * rec, yield: 0, happy: sole ? 3 : 0 };
      this.props.push(item);
      if (sole) solo.push(() => this.askInheritedHouse(item, from)); else shared.push({ kind: "house", ref: item, whole: h.value, wholeLoan: h.loan, wholePay: h.payment });
      parts.push(sole ? "la maison familiale" : `${pct} % de la maison familiale`);
    }
    for (const p of I.props || []) {
      const item = { ...p, value: p.value * rec, loan: p.loan * rec, payment: (p.payment || 0) * rec };
      if (!sole) shared.push({ kind: "prop", ref: item, whole: p.value, wholeLoan: p.loan, wholePay: p.payment || 0 });
      this.props.push(item);
    }
    if ((I.props || []).length) parts.push(`${sole ? "" : `${pct} % de `}${I.props.length > 1 ? `${I.props.length} biens immobiliers` : `« ${I.props[0].label} »`}`);
    for (const b of I.biz || []) {
      // L'héritier devient actionnaire ; un gérant dirige en attendant sa décision.
      const clone = { ...JSON.parse(JSON.stringify(b)), stake: (b.stake ?? 1) * rec, mode: "managed", did: {}, sideNoted: false, inheritedAt: this.age };
      this.businesses.push(clone);
      if (sole) solo.push(() => this.askInheritedBiz(clone, from)); else shared.push({ kind: "biz", ref: clone, wholeStake: b.stake ?? 1 });
      parts.push(`${sole && (b.stake ?? 1) >= 0.999 ? "l’entreprise" : `${Math.round(clone.stake * 100)} % de l’entreprise`} « ${b.label} »`);
    }
    // Les droits de succession et la part des dettes se paient en argent, d'abord sur les placements reçus.
    const total = itemsGross(I) * rec, dues = total * B.tax + (I.debt || 0) * rec, debtBefore = this.debt;
    // Prélevés en proportion sur chaque placement : le portefeuille garde sa composition.
    const liquid = Object.entries(this.assets).filter(([k]) => k !== "livestock").reduce((s, [, v]) => s + v, 0), ratio = liquid > 0 ? Math.min(1, dues / liquid) : 0;
    for (const k in this.assets) if (k !== "livestock") this.assets[k] *= 1 - ratio;
    if (dues > liquid) this.withdraw(dues - liquid);
    if (fin.total > 1) this.allocFromHoldings();
    const borrowed = this.debt - debtBefore;
    this.say(`Hérite ${de(from)} (≈ ${money(total)}) : ${andList(parts) || "presque rien"}. ${money(dues)} de droits de succession${I.debt > 0 ? " et de dettes" : ""} à régler${borrowed > 1 ? `, dont ${money(borrowed)} empruntés faute de liquidités` : ""}.`, "money", true);
    this.bump("happy", 2);
    for (const f of solo) f();
    if (shared.length) {
      const co = andList(B.co || []), coNames = andList((B.co || []).map(x => x.replace(/ \(.*\)$/, "")));
      for (const it of shared) this.askSharedAsset(it, co || "les autres héritiers", from, coNames || "les autres héritiers");
    }
  },
  // La maison de famille, reçue en entier : y vivre, la garder, la louer ou la vendre.
  askInheritedHouse(item, from) {
    const gone = () => !(this.props || []).includes(item), eq = Math.max(0, item.value * 0.94 - item.loan);
    this.ask(`Vous héritez de la maison ${de(from)} (≈ ${money(item.value)}${item.loan > 0 ? `, reste ${money(item.loan)} d’emprunt` : ""}). Qu’en faire ?`, [
      ...(this.house ? [] : [{ label: "Y habiter", sub: "Plus de loyer à payer : la maison de famille devient la vôtre.", autoWeight: 3, apply: () => {
        if (gone() || this.house) return;
        this.props.splice(this.props.indexOf(item), 1);
        this.house = { value: item.value, loan: item.loan, rate: item.rate || 0, payment: item.payment || 0 };
        this.say(`S’installe dans la maison ${de(from)}.`, "money", true); this.bump("happy", 4);
      } }]),
      { label: "La garder comme résidence secondaire", sub: "Les souvenirs, les vacances en famille ; un peu d’entretien.", autoWeight: 1, apply: () => { if (!gone()) this.say(`Garde la maison ${de(from)} comme résidence secondaire.`, "money"); } },
      { label: "La louer", sub: `≈ ${money(item.value * 0.045)} de loyers par an`, autoWeight: 1, apply: () => { if (gone()) return; item.use = "rent"; item.yield = 0.045; item.happy = 0; this.say(`Met en location la maison ${de(from)}.`, "money"); } },
      { label: "La vendre", sub: `≈ ${money(eq)} une fois l’emprunt remboursé et les frais payés`, autoWeight: 0.7, apply: () => { if (gone()) return; this.props.splice(this.props.indexOf(item), 1); this.addMoney(eq); this.say(`Vend la maison ${de(from)} (${money(eq)}).`, "money", true); } },
    ]);
  },
  // Une entreprise reçue : la garder avec un gérant, la diriger soi-même, ou la vendre.
  askInheritedBiz(b, from) {
    const gone = () => !(this.businesses || []).includes(b), v = (b.value || 0) * (b.stake ?? 1);
    const sz = BIZ_SIZES[b.size || 0] ? BIZ_SIZES[b.size || 0].label : "entreprise";
    this.ask(`Vous héritez de l’entreprise ${de(from)} : « ${b.label} » (${sz}${(b.stake ?? 1) < 0.999 ? `, ${Math.round((b.stake ?? 1) * 100)} % des parts` : ""}, valeur ≈ ${money(v)}). Qu’en faire ?`, [
      { label: "La garder, avec un gérant", sub: "Vous touchez votre part des bénéfices ; tout dépend du talent du gérant.", autoWeight: 2, apply: () => { if (!gone()) this.say(`Garde « ${b.label} », confiée à un gérant.`, "money"); } },
      { label: "La diriger vous-même", sub: this.job ? "À côté de votre emploi : deux fois plus de travail." : "Elle devient votre métier.", autoWeight: 1, apply: () => { if (gone() || !this.focusBiz(b)) return; this.takeBackBusiness(); this.bizFocus = 0; this.say(`Reprend la direction de « ${b.label} », l’entreprise ${de(from)}.`, "work", true); } },
      { label: "La vendre", sub: `≈ ${money(v)}`, autoWeight: 0.7, apply: () => { if (gone() || !this.focusBiz(b)) return; this.dropBusiness(); this.bizFocus = 0; this.addMoney(v); this.say(`Vend « ${b.label} » (${money(v)}).`, "money", true); } },
    ]);
  },
  // Un bien reçu en partage : garder sa part, racheter celles des autres, y habiter, le louer, ou vendre sa part.
  askSharedAsset(it, co, from, coNames = co) {
    const r = it.ref, biz = it.kind === "biz";
    const mine = biz ? r.value * r.stake : r.value - r.loan;
    const total = biz ? r.value * it.wholeStake : it.whole - it.wholeLoan;
    const cost = Math.max(0, total - mine), sell = mine * 0.9, pct = Math.round(mine / Math.max(total, 1) * 100);
    const can = this.savings >= cost * 0.3 && (this.bank || this.savings >= cost);
    const name = biz ? `l’entreprise « ${r.label} »` : it.kind === "house" ? `la maison ${de(from)}` : `« ${r.label} »`;
    const gone = () => biz ? !(this.businesses || []).includes(r) : !(this.props || []).includes(r);
    const buy = then => {
      if (gone()) return;
      if (!can) { this.say(`N’a pas les moyens de racheter les parts de ${name}.`, "money"); return; }
      this.pay(cost);
      if (biz) r.stake = it.wholeStake; else { r.value = it.whole; r.loan = it.wholeLoan; r.payment = it.wholePay; }
      then();
    };
    const opts = [
      { label: "Garder ma part", sub: biz ? "Rester actionnaire : un gérant dirige, vous touchez votre part des bénéfices." : `Rester copropriétaire avec ${co}.`, autoWeight: 2, apply: () => { if (!gone()) this.say(`Garde sa part de ${name}, avec ${coNames}.`, "money"); } },
      { label: "Racheter les parts des autres", sub: `≈ ${money(cost)}${this.savings < cost ? ", en partie emprunté" : ""}${can ? "" : " · pas assez d’argent"} · ${biz ? "l’entreprise est à vous" : "le bien est à vous"}`, autoWeight: can ? 1 : 0, apply: () => buy(() => {
        if (it.kind === "house") { r.use = "second"; r.happy = 3; r.label = `Maison ${de(from)}`; }
        else if (!biz) r.label = r.label.replace(/^Part de /, "");
        this.say(`Rachète les parts de ${coNames} : ${name} est désormais entièrement à ${this.g("lui", "elle")}.`, "money", true);
      }) },
    ];
    if (it.kind === "house" && !this.house) opts.push({ label: "Racheter et y habiter", sub: `≈ ${money(cost)} · la maison de famille devient la vôtre`, autoWeight: can ? 0.5 : 0, apply: () => buy(() => {
      this.props.splice(this.props.indexOf(r), 1);
      this.house = { value: it.whole, loan: it.wholeLoan, rate: r.rate || 0, payment: it.wholePay };
      this.say(`Rachète les parts de ${coNames} et s’installe dans la maison ${de(from)}.`, "money", true); this.bump("happy", 4);
    }) });
    if (!biz && r.use !== "rent") opts.push({ label: "Louer le bien et partager les loyers", sub: `≈ ${money(mine * 0.045)} par an pour vous`, autoWeight: 0.7, apply: () => { if (gone()) return; r.use = "rent"; r.yield = 0.045; this.say(`Avec ${coNames}, met en location ${name} et partage les loyers.`, "money"); } });
    opts.push({ label: "Vendre ma part", sub: `≈ ${money(sell)} (une part se vend un peu moins cher qu’un bien entier)`, autoWeight: 1, apply: () => {
      if (gone()) return;
      if (biz) { if (this.focusBiz(r)) this.dropBusiness(); this.bizFocus = 0; } else this.props.splice(this.props.indexOf(r), 1);
      this.addMoney(sell); this.say(`Vend sa part de ${name} (${money(sell)}).`, "money", true);
    } });
    this.ask(`Héritage partagé : vous détenez ${pct} % de ${name}, avec ${co}. Que faire ?`, opts);
  },
});

// --- Adoption ----------------------------------------------------------------------------
// N'importe quel âge, des deux côtés : un enfant de 0 à 17 ans, un adulte de tout âge. Le prix et l'attente
// baissent avec l'âge de l'enfant (les nouveau-nés sont les plus demandés) ; l'adoption internationale coûte
// bien plus cher. Seule règle d'âge : au moins 15 ans d'écart ; au-delà de 45 ans d'écart, l'agrément se fait rare.
const ADOPT_GAP = 15;
function adoptPlan(L, id) {
  const m = median(L.here), [kind, a, b] = id.split(":");
  const ages = kind === "nat" ? (a === "pair" ? [3, 6] : [+a]) : [+b], origin = kind === "int" ? a : null;
  const young = Math.min(...ages), gap = L.age - young, baby = young <= 1;
  // Plus l'enfant est jeune, plus c'est cher : frais de dossier, d'agence, de voyage pour l'étranger.
  const perKid = age => m * (kind === "int" ? 0.25 + 1.1 * (1 - age / 17) ** 2 : 0.02 + 0.4 * (1 - age / 17) ** 2);
  const p = clamp((kind === "int" ? 0.55 : 0.7) + (L.married ? 0.1 : -0.1) + Math.min(0.2, young / 50) - (baby ? 0.1 : 0) + (L.livingTier() >= 3 ? 0.05 : 0)
    - Math.max(0, gap - 45) / 40, 0.05, 0.92);
  const wait = young <= 1 ? (kind === "int" ? 3 : 2) : young <= 5 ? (kind === "int" ? 2 : 1) : 1;
  return { ages, origin, p, gap, cost: ages.reduce((s, x) => s + perKid(x), 0), wait };
}
function adoptChoices(L) {
  const out = [], add = (id, label) => {
    const x = adoptPlan(L, id), tooClose = x.gap < ADOPT_GAP;
    out.push({ id, label, sub: tooClose ? `il faut au moins ${ADOPT_GAP} ans d’écart avec l’enfant` : `≈ ${eur(x.cost)} de frais · attente ≈ ${x.wait} an${x.wait > 1 ? "s" : ""} · chances d’agrément ${Math.round(x.p * 100)} %${L.married ? "" : " (célibataire)"}${L.savings < x.cost ? " · pas assez d’argent" : ""}`, disabled: tooClose || L.savings < x.cost });
  };
  const ageLabel = a => a === 0 ? "un nouveau-né" : a === 1 ? "un bébé d’un an" : `un enfant de ${a} ans`;
  for (let a = 0; a <= 17; a++) add(`nat:${a}`, `Adopter ${ageLabel(a)} du pays`);
  add("nat:pair", "Adopter deux frères et sœurs (3 et 6 ans)");
  if (L.calYear >= 1950 && !planned(L.code, L.calYear)) {
    const poorer = COUNTRIES.filter(c => c.code !== L.code && c.pop > 3 && countryAt(c.code, L.calYear).gdp < L.here.gdp * 0.6).sort((a, b) => countryAt(b.code, L.calYear).births - countryAt(a.code, L.calYear).births).slice(0, 3);
    for (const c of poorer) for (const age of [0, 3, 6, 10, 14]) add(`int:${c.code}:${age}`, `Adopter ${ageLabel(age)} ${inCountry(c)}`);
  }
  return out;
}
ACTIONS.push({ id: "adopt", cat: "perso", label: "Adopter un enfant", desc: "À tout âge, un enfant de 0 à 17 ans, du pays ou d’ailleurs : plus il est jeune, plus c’est cher et long. Un dossier d’agrément, une attente, puis un enfant confié.",
  when: L => L.age < 18 ? "À partir de 18 ans." : L.calYear < 1920 ? "L’adoption n’est pas encore encadrée à cette époque." : (L.adoptions || []).length ? "Un dossier est déjà en cours." : L.children.filter(k => k.alive).length >= 6 ? "Votre famille est déjà nombreuse." : true,
  choices: L => adoptChoices(L),
  run: (L, id) => {
    const x = adoptPlan(L, id);
    if (x.gap < ADOPT_GAP) return `Il faut au moins ${ADOPT_GAP} ans d’écart avec l’enfant.`;
    if (L.savings < x.cost) return "Pas assez d’argent pour les frais.";
    L.pay(x.cost);
    const where = x.origin ? ` ${inCountry(BY_CODE[x.origin])}` : "";
    if (rand() < x.p) {
      const wait = x.wait + (rand() < 0.4 ? 1 : 0);
      L.adoptions = [...(L.adoptions || []), { arrive: L.age + wait, ages: x.ages, origin: x.origin }];
      L.say(`Dépose un dossier d’adoption${where} : l’agrément est accordé, l’attente commence.`, "family", true);
      return `Agrément accordé · attente ≈ ${wait} an${wait > 1 ? "s" : ""}.`;
    }
    L.say(`Le dossier d’adoption${where} est refusé : l’agrément n’est pas accordé.`, "family", true);
    L.bump("happy", -6);
    return "Agrément refusé.";
  } });
Object.assign(Life.prototype, {
  // L'enfant attendu arrive : c'est vous qui décidez de l'accueillir.
  adoptionYear() {
    const due = (this.adoptions || []).find(a => this.age >= a.arrive);
    if (!due || this.queue.some(d => d.adopt)) return;
    const kids = [];
    for (const a of due.ages) {
      const sx = drawSex();
      let name = this.freshName(sx);
      for (let t = 0; t < 8 && kids.some(k => k.name === name); t++) name = this.freshName(sx);
      kids.push({ name, sex: sx, age: a });
    }
    const many = kids.length > 1, desc = many ? `${kids.map(k => k.name).join(" et ")}, ${kids.map(k => k.age).join(" et ")} ans` : `${kids[0].name}, ${kids[0].age} an${kids[0].age > 1 ? "s" : ""}`;
    const done = () => { this.adoptions = (this.adoptions || []).filter(a => a !== due); };
    this.ask(`L’adoption aboutit : ${desc}${due.origin ? `, ${many ? "nés" : "né"} ${inCountry(BY_CODE[due.origin])}` : ""}. Accueillir ${many ? "ces enfants" : "cet enfant"} ?`, [
      { label: "Accueillir", autoWeight: 3, apply: () => {
        done();
        for (const k of kids) this.children.push({ name: k.name, sex: k.sex, born: this.age - k.age, alive: true, other: this.partner, code: this.code, adopted: true, origin: due.origin || this.code, adoptAge: k.age });
        this.say(`${many ? `${kids[0].name} et ${kids[1].name} rejoignent` : `${kids[0].name} rejoint`} la famille, ${many ? "adoptés" : kids[0].sex === "m" ? "adopté" : "adoptée"}.`, "family", true);
        this.bump("happy", 8); this.bump("rel", 5);
      } },
      { label: "Renoncer", sub: "Le dossier est clos.", autoWeight: 0.3, apply: () => { done(); this.say("Renonce à l’adoption.", "family"); } },
    ]);
    this.queue[this.queue.length - 1].adopt = true;
  },
});

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
    ${(() => { const cands = willCandidates(L), w = new Set(activeWill(L)), nw = w.size, nwth = Math.max(0, L.netWorth());
      return `<p class="sp-head">Testament</p>
    <p class="sp-note" style="margin-top:0">À qui laisser votre héritage ? Choisissez les personnes : il est partagé à parts égales entre elles.</p>
    <div class="sp-pills">${cands.map(c => `<button class="sp-pill${w.has(c.key) ? " on" : ""}" data-will-to="${esc(c.key)}">${esc(c.label)} <span>${esc(c.sub)}${w.has(c.key) && nw && nwth ? ` · ≈ ${eur(nwth / nw)}` : ""}</span></button>`).join("")}</div>
    <p class="sp-note">S’applique à votre mort, et quand vous passez à la vie d’un descendant : il reçoit alors sa part de votre vivant, prise sur tout votre patrimoine (épargne, maison, biens, parts d’entreprises). Sans choix, vos enfants se partagent tout (avant droits de succession).</p>`; })()}
    <p class="sp-head">Faire fructifier votre épargne</p>
    <div class="sp-pills">${assets.map(k => `<button class="sp-pill${(L.alloc[k] || 0) > 0 ? " on" : ""}" data-asset-toggle="${k}">${ASSETS[k].label} <span>· ${ASSET_RETURNS[k]}</span></button>`).join("")}</div>
    <p class="sp-note">Appuyez pour ajouter un placement à votre épargne ou l’en retirer ; la répartition se règle plus bas. Rendements réels, inflation déduite.</p>
  </div>`;
}
// Un clic dans la page : renvoie un message court, ou null.
function spendClick(L, t) {
  const car = t.closest("[data-car]");
  if (car) return careerAction(L, car.dataset.car) || "Impossible pour l’instant.";
  const bz = t.closest("[data-biz]");
  if (bz) return bizAction(L, bz.dataset.biz, bz.dataset.arg, bz.dataset.bidx) || "Impossible pour l’instant.";
  const wl = t.closest("[data-will-to]");
  if (wl) {
    const cur = new Set(activeWill(L)), k = wl.dataset.willTo;
    if (cur.has(k)) cur.delete(k); else cur.add(k);
    L.willTo = [...cur];
    const names = willCandidates(L).filter(c => cur.has(c.key)).map(c => c.label);
    return names.length ? `Testament : ${names.join(", ")}` : "Testament : personne (vos enfants hériteront)";
  }
  const sp = t.closest("[data-sp]"), lsb = t.closest("[data-ls]"), au = t.closest("[data-auto]"), as = t.closest("[data-asset-toggle]");
  if (sp) return spendDo(L, sp.dataset.sp, sp.dataset.arg) || "Impossible pour l’instant.";
  if (lsb) { L.lifeStyle()[lsb.dataset.ls] = lsb.dataset.v; return `${LIFESTYLE[lsb.dataset.ls].label} : ${LIFESTYLE[lsb.dataset.ls].opts[lsb.dataset.v][1]}`; }
  if (au) { L.autoSpend = L.autoSpend || {}; const k = au.dataset.auto; L.autoSpend[k] = !L.autoSpend[k]; return `${AUTO[k].label} : ${L.autoSpend[k] ? "activé" : "désactivé"}`; }
  if (as) { const k = as.dataset.assetToggle; if ((L.alloc[k] || 0) > 0) L.alloc[k] = 0; else L.alloc[k] = 20; L.rebalance(); return `${ASSETS[k].label} : ${(L.alloc[k] || 0) > 0 ? "ajouté" : "retiré"}`; }
  return null;
}
