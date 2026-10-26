// Gérer son entreprise : la diriger soi-même, la mener à côté d'un emploi (deux fois plus
// de travail), ou la confier à un gérant ; salariés et climat social ; bénéfices réinvestis
// ou versés ; conseil d'administration et entrée en Bourse pour les grandes entreprises.

const BIZ_MODES = {
  full: "Vous la dirigez à plein temps",
  side: "Vous la menez à côté de votre emploi : deux fois plus de travail",
  managed: "Un gérant la dirige ; vous en êtes propriétaire",
};
const STAFF_RANGE = [[1, 9], [10, 249], [250, 4999], [5000, 200000]];
const MANAGER_TITLE = ["gérant", "directeur", "directeur général", "PDG"];
const moraleLabel = m => m >= 70 ? "excellent" : m >= 55 ? "bon" : m >= 40 ? "moyen" : m >= 25 ? "tendu" : "explosif";

Object.assign(Life.prototype, {
  // Part des bénéfices qui vous revient.
  bizShare() {
    const b = this.business;
    let s = (b.stake ?? 1) * (b.policy === "reinvest" ? 0.5 : 1);
    if (b.mode === "side") s *= 0.7;
    if (b.mode === "managed") s *= 1 - (b.manager ? b.manager.cut : 0.15);
    return s;
  },
  // L'entreprise disparaît (faillite, vente) : un emploi tenu à côté reste.
  dropBusiness() {
    this.business = null;
    if (this.jobInfo && this.jobInfo.id === "business") { this.job = null; this.jobInfo = null; this.income = 0; }
  },
  hireManager(quiet = false) {
    const b = this.business, size = b.size || 0;
    b.manager = { name: this.freshName(rand() < 0.6 ? "m" : "f"), skill: clamp(Math.round(45 + size * 6 + randn() * 12), 15, 95), cut: 0.12 + size * 0.03 };
    b.mode = "managed";
    if (this.jobInfo && this.jobInfo.id === "business") { this.job = null; this.jobInfo = null; }
    this.say(`Confie la direction de ${b.label.toLowerCase()} à ${b.manager.name}, ${MANAGER_TITLE[size]}.`, "work", !quiet);
  },
  takeBackBusiness() {
    const b = this.business;
    const salaried = this.job && !(this.jobInfo && this.jobInfo.id === "business");
    b.mode = salaried ? "side" : "full";
    if (b.manager) this.say(`Reprend la direction de ${b.label.toLowerCase()} ; ${b.manager.name} s’en va.`, "work", true);
    b.manager = null;
    if (!salaried) { this.job = `à la tête d’une ${BIZ_SIZES[b.size || 0].label} (${(b.base || b.label).toLowerCase()})`; this.jobInfo = { id: "business", sector: "serv", informal: this.here.gdp < 15000, self: true }; }
  },
  // Un emploi accepté alors qu'on dirige son entreprise : c'est vous qui choisissez.
  askBizWithJob() {
    const b = this.business;
    this.ask(`Vous avez un emploi. Et ${b.label.toLowerCase()} ?`, [
      { label: "La mener à côté", sub: "Deux fois plus de travail : santé, proches et bonheur en pâtissent ; l’entreprise grandit un peu moins vite.", autoWeight: 1, apply: () => { if (this.business) { b.mode = "side"; this.say("Garde son entreprise à côté de son nouvel emploi.", "work"); } } },
      { label: "La confier à un gérant", sub: "Il prend une part des bénéfices ; tout dépend de son talent.", autoWeight: 1, apply: () => { if (this.business) this.hireManager(); } },
    ]);
  },
  // Chaque année : charge de travail, climat social, effectifs, conseil d'administration.
  bizYear() {
    const b = this.business, size = b.size || 0;
    if (b.mode == null) { b.mode = b.managed ? "managed" : this.jobInfo && this.jobInfo.id === "business" ? "full" : this.job ? "side" : "full"; b.staff = b.staff || STAFF_RANGE[size][0]; b.morale = b.morale ?? 55; b.stake = b.stake ?? 1; b.policy = b.policy || "pay"; }
    if (b.mode === "managed" && !b.manager) this.hireManager(true);
    if (b.mode === "side" && this.job) {
      this.bump("health", -1); this.bump("rel", -1.5); this.bump("happy", -0.5);
      if (!b.sideNoted) { b.sideNoted = true; this.say("Mène de front son emploi et son entreprise : les soirées et les week-ends y passent.", "work"); }
    }
    b.morale = clamp((b.morale ?? 55) + (55 - b.morale) * 0.15 + (b.mode === "managed" && b.manager ? (b.manager.skill - 50) / 20 : 0) + randn() * 4, 0, 100);
    if (b.morale < 25 && rand() < 0.25) { this.say(size >= 2 ? "Grève dans l’entreprise : les sites sont bloqués plusieurs jours." : "Des salariés claquent la porte ; l’ambiance est mauvaise.", "work", true); b.mult *= 0.93; }
    const [lo, hi] = STAFF_RANGE[size];
    b.staff = clamp(Math.round(b.staff * Math.exp(0.03 + 0.05 * randn())), lo, hi);
    // Le conseil d'administration fait des propositions ; c'est vous qui votez.
    if (size >= 2 && rand() < 0.2 && !this.queue.some(d => d.board)) this.boardProposal();
  },
  boardProposal() {
    const b = this.business, v = b.value;
    const props = [
      ["racheter un concurrent", `Coût pris sur la trésorerie ; chances de réussite 60 %`, () => { if (rand() < 0.6) { b.mult *= 1.15; b.staff = Math.round(b.staff * 1.2); this.say("Le rachat d’un concurrent réussit : l’entreprise grossit.", "work", true); } else { b.mult *= 0.93; this.say("Le rachat d’un concurrent tourne mal ; il faut éponger les pertes.", "work", true); } }],
      ["délocaliser une partie de la production", "Moins de coûts, mais un climat social dégradé", () => { b.mult *= 1.08; b.morale -= 18; b.staff = Math.round(b.staff * 0.85); this.say("Délocalise une partie de la production ; des sites ferment.", "work", true); this.bump("happy", -2); }],
      ["investir massivement dans la recherche", "Moins de bénéfices cette année, plus de croissance ensuite", () => { b.mult *= 0.95; b.research = (b.research || 0) + 1; b.mult *= rand() < 0.5 ? 1.2 : 1; this.say("L’entreprise investit dans la recherche.", "work"); }],
      ["verser un dividende exceptionnel", `≈ ${money(v * 0.04 * (b.stake ?? 1))} pour vous`, () => { this.addMoney(v * 0.04 * (b.stake ?? 1)); b.mult *= 0.97; this.say(`Le conseil verse un dividende exceptionnel : ${money(v * 0.04 * (b.stake ?? 1))} pour vous.`, "money", true); }],
      ["augmenter les salaires de tous", "Meilleur climat social, un peu moins de bénéfices", () => { b.morale = clamp(b.morale + 20, 0, 100); b.mult *= 0.97; this.say("Le conseil augmente les salaires ; l’ambiance s’améliore.", "work"); }],
    ];
    const [what, sub, run] = pick(props);
    this.ask(`Le conseil d’administration de ${b.label.toLowerCase()} propose de ${what}. Votre vote ?`, [
      { label: "Voter pour", sub, autoWeight: 1, apply: () => { if (this.business === b) run(); } },
      { label: "Voter contre", sub: (b.stake ?? 1) < 0.5 ? "Vous êtes minoritaire, mais votre voix pèse : la proposition est retirée." : "La proposition est retirée.", autoWeight: 1, apply: () => this.say("Vote contre une proposition du conseil d’administration.", "work") },
    ]);
    this.queue[this.queue.length - 1].board = true;
  },
});

// Les gestes possibles, avec leur effet.
function bizAction(L, id, arg) {
  const b = L.business;
  if (!b || !L.alive) return null;
  b.did = b.did || {};
  const once = k => { if (b.did[k] === L.age) return false; b.did[k] = L.age; return true; };
  const m = median(L.here);
  switch (id) {
    case "manager": L.hireManager(); return `${capFirst(MANAGER_TITLE[b.size || 0])} : ${b.manager.name}`;
    case "replace": { const old = b.manager.name; L.hireManager(true); L.say(`Remplace ${old} par ${b.manager.name} à la tête de l’entreprise.`, "work", true); return `Nouveau : ${b.manager.name}`; }
    case "takeback": L.takeBackBusiness(); return "Vous reprenez la direction";
    case "hire": if (!once("staff")) return "Déjà fait cette année."; b.staff = Math.round(b.staff * 1.25 + 1); b.mult *= rand() < 0.6 ? 1.1 : 0.98; b.morale = clamp(b.morale + 3, 0, 100); L.say("Embauche : l’équipe s’agrandit.", "work"); return `≈ ${b.staff.toLocaleString("fr-FR")} salariés`;
    case "fire": if (!once("staff")) return "Déjà fait cette année."; b.staff = Math.max(1, Math.round(b.staff * 0.8)); b.mult *= 1.03; b.morale = clamp(b.morale - 18, 0, 100); L.bump("happy", -2); L.say("Réduit les effectifs ; les départs pèsent sur l’ambiance.", "work", true); return `≈ ${b.staff.toLocaleString("fr-FR")} salariés`;
    case "raise": if (!once("pay")) return "Déjà fait cette année."; b.morale = clamp(b.morale + 15, 0, 100); b.mult *= 0.97; L.say("Augmente les salaires de ses employés.", "work"); return `Climat social : ${moraleLabel(b.morale)}`;
    case "policy": b.policy = arg; return arg === "reinvest" ? "Les bénéfices sont réinvestis" : "Les bénéfices vous sont versés";
    case "grow": { if (!once("grow")) return "Déjà tenté cette année."; return L.growBusiness() || "Pas assez d’argent."; }
    case "ipo": {
      if (b.listed) return null;
      const cash = b.value * 0.3 * (b.stake ?? 1);
      b.listed = true; b.stake = (b.stake ?? 1) * 0.7; L.addMoney(cash); L.network += 2;
      L.say(`${b.label} entre en Bourse ; vous vendez une partie de vos parts (${money(cash)}).`, "money", true);
      return `+${money(cash)}`;
    }
    case "sell": { const v = b.value * (b.stake ?? 1); L.addMoney(v); L.say(`Vend ${b.label.toLowerCase()} pour ${money(v)}.`, "money", true); L.dropBusiness(); return `+${money(v)}`; }
  }
  return null;
}

// La page « Votre entreprise ».
function businessHtml(L) {
  const b = L.business;
  if (!b) return "";
  if (b.mode == null) L.bizYear();
  const size = b.size || 0, g = L.business && L.growthOption(), profit = median(L.here) * b.mult * L.econ;
  const btn = (id, label, sub = "", arg = "", dis = false) => `<button class="sp-pill${arg && b.policy === arg ? " on" : ""}" data-biz="${id}"${arg ? ` data-arg="${arg}"` : ""}${dis ? " disabled" : ""}>${esc(label)}${sub ? ` <span>${esc(sub)}</span>` : ""}</button>`;
  const canIpo = size >= 2 && !b.listed && L.here.mcap >= 10 && !planned(L.code, L.calYear);
  return `<div class="sp">
    <p class="sp-head">Votre entreprise</p>
    <div class="sp-card"><div class="sp-main"><b>${esc(b.label)}</b>
      <small>${capFirst(BIZ_SIZES[size].label)} · ≈ ${b.staff.toLocaleString("fr-FR")} salarié${b.staff > 1 ? "s" : ""} · climat social ${moraleLabel(b.morale)} · bénéfice ≈ ${eur(profit)} par an · valeur ≈ ${eur(b.value)}${(b.stake ?? 1) < 1 ? ` · vous détenez ${Math.round(b.stake * 100)} % des parts` : ""}${b.listed ? " · cotée en Bourse" : ""}</small>
      <small>${BIZ_MODES[b.mode]}${b.manager ? ` · ${MANAGER_TITLE[size]} : ${esc(b.manager.name)} (talent ${b.manager.skill}/100, ${Math.round(b.manager.cut * 100)} % des bénéfices)` : ""}</small></div></div>
    <p class="sp-head">Direction</p>
    <div class="sp-pills">${b.mode === "managed" ? btn("replace", `Remplacer ${b.manager ? b.manager.name : "le gérant"}`) + (L.retired ? "" : btn("takeback", "Reprendre la direction", L.job && !(L.jobInfo && L.jobInfo.id === "business") ? "à côté de votre emploi" : "")) : btn("manager", `Recruter un ${MANAGER_TITLE[size]}`, "vous êtes libéré, il prend une part")}</div>
    ${size >= 2 ? `<p class="sp-note">Conseil d’administration : ${size === 3 ? 9 : 7} membres, que vous présidez${(b.stake ?? 1) < 0.5 ? " sans majorité" : ""}. Il vous soumet ses propositions au fil des années.</p>` : ""}
    <p class="sp-head">Salariés</p>
    <div class="sp-pills">${btn("hire", "Embaucher", "+25 %")}${btn("fire", "Réduire les effectifs", "−20 %, ambiance")}${btn("raise", "Augmenter les salaires", "ambiance +")}</div>
    <p class="sp-head">Bénéfices</p>
    <div class="sp-pills">${btn("policy", "Vous les verser", "", "pay")}${btn("policy", "Les réinvestir", "croissance +, revenu ÷2", "reinvest")}</div>
    <p class="sp-head">Grandir</p>
    <div class="sp-pills">${g ? btn("grow", `Devenir une ${g.next.label}`, `≈ ${eur(g.cost)} · chances ${Math.round(g.p * 100)} %`, "", !g.can) : `<span class="sp-note">C’est une multinationale.</span>`}${canIpo ? btn("ipo", "Entrer en Bourse", `vendre 30 % de vos parts ≈ ${eur(b.value * 0.3 * (b.stake ?? 1))}`) : ""}${btn("sell", "Vendre l’entreprise", `≈ ${eur(b.value * (b.stake ?? 1))}`)}</div>
    <p class="sp-note">Mener l’entreprise à côté d’un emploi double la charge de travail : santé, proches et bonheur en pâtissent. Un gérant libère du temps mais prend sa part, et tout dépend de son talent.</p>
  </div>`;
}
