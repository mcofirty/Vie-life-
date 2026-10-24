// Moteur de simulation : une vie, année après année.

const rand = Math.random;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pick = arr => arr[Math.floor(rand() * arr.length)];
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function weighted(entries) {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  let r = rand() * total;
  for (const [k, w] of entries) { r -= Math.max(0, w); if (r <= 0) return k; }
  return entries[entries.length - 1][0];
}

// Loi normale : fonction de répartition et quantile (approximation d'Acklam).
function normCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
function normInv(p) {
  p = clamp(p, 1e-9, 1 - 1e-9);
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// --- Mortalité -------------------------------------------------------------
// Âge 0 : mortalité infantile. 1–4 ans : fraction de celle-ci.
// 5 ans et plus : loi de Gompertz-Makeham dont le paramètre B est calé pour
// retrouver l'espérance de vie à la naissance du pays et du sexe.
const MAX_AGE = 110;
const GOMPERTZ_G = 0.095;
const lifeTables = {};

function makeham(c) {
  return 0.0004 + c.hom / 100000 + (c.region === "SSA" ? 0.002 : 0);
}
function qxWith(c, sex, age, B) {
  const sexf = sex === "m" ? 1.12 : 0.88;
  if (age === 0) return clamp(c.imr / 1000 * sexf, 0, 0.5);
  if (age < 5) return clamp(c.imr / 1000 * 0.12 * sexf, 0, 0.2);
  if (age >= MAX_AGE) return 1;
  const mu = makeham(c) * (sex === "m" ? 1.3 : 0.8) + B * Math.exp(GOMPERTZ_G * (age - 30));
  return clamp(1 - Math.exp(-mu), 0, 1);
}
function e0With(c, sex, B) {
  let l = 1, e = 0;
  for (let x = 0; x <= MAX_AGE; x++) {
    const q = qxWith(c, sex, x, B);
    e += l * (1 - q / 2);
    l *= 1 - q;
  }
  return e;
}
function lifeTable(code, sex) {
  const key = code + sex;
  if (lifeTables[key]) return lifeTables[key];
  const c = BY_CODE[code];
  let lo = Math.log(1e-7), hi = Math.log(0.5);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (e0With(c, sex, Math.exp(mid)) > c.e0[sex]) lo = mid; else hi = mid;
  }
  const B = Math.exp((lo + hi) / 2);
  const qx = [], lx = [];
  let l = 1;
  for (let x = 0; x <= MAX_AGE; x++) { const q = qxWith(c, sex, x, B); qx.push(q); lx.push(l); l *= 1 - q; }
  return (lifeTables[key] = { qx, lx });
}

// --- Revenus ---------------------------------------------------------------
// Distribution log-normale dont l'écart-type découle de l'indice de Gini.
function incomeAt(c, p) {
  const sigma = Math.SQRT2 * normInv((c.gini / 100 + 1) / 2);
  const mean = c.gdp * 0.6;
  const median = mean * Math.exp(-sigma * sigma / 2);
  return median * Math.exp(sigma * normInv(clamp(p, 0.005, 0.995)));
}

// --- Tirage au sort ----------------------------------------------------------
function drawCountry(mode) {
  return weighted(COUNTRIES.map(c => [c.code, mode === "pop" ? c.pop : c.births]));
}
function drawSex() { return rand() < 0.512 ? "m" : "f"; }
function drawName(code, sex) { return pick(namesFor(code)[sex === "m" ? 0 : 1]); }

const EDU_LABEL = { none: "aucune", primaire: "école primaire", secondaire: "lycée", universite: "université" };
const EDU_Z = { none: -1.3, primaire: -0.6, secondaire: 0.3, universite: 1.3 };

const JOBS = {
  low: [["travaille aux champs", "travaille aux champs"], ["vend au marché", "vend au marché"], ["ouvrier du bâtiment", "ouvrière du bâtiment"], ["employé de maison", "employée de maison"], ["pêcheur", "pêcheuse"], ["porteur", "porteuse"]],
  mid: [["vendeur", "vendeuse"], ["chauffeur", "chauffeuse"], ["ouvrier d’usine", "ouvrière d’usine"], ["couturier", "couturière"], ["mécanicien", "mécanicienne"], ["aide-soignant", "aide-soignante"], ["cuisinier", "cuisinière"], ["agent de sécurité", "agente de sécurité"]],
  high: [["enseignant", "enseignante"], ["infirmier", "infirmière"], ["ingénieur", "ingénieure"], ["comptable", "comptable"], ["médecin", "médecin"], ["développeur", "développeuse"], ["fonctionnaire", "fonctionnaire"], ["avocat", "avocate"], ["architecte", "architecte"]],
};

// Santé moyenne observée par âge dans la simulation (sans mortalité).
const HEALTH_CURVE = [[0, 66], [18, 71.5], [30, 69.6], [40, 63], [50, 56], [60, 49], [70, 38], [80, 25.5], [90, 14], [100, 6], [MAX_AGE, 3]];
function expectedHealth(age) {
  for (let i = 1; i < HEALTH_CURVE.length; i++) {
    const [a1, h1] = HEALTH_CURVE[i];
    if (age <= a1) { const [a0, h0] = HEALTH_CURVE[i - 1]; return h0 + (h1 - h0) * (age - a0) / (a1 - a0); }
  }
  return 3;
}

const PAUSE_AGES = [5, 15, 30, 50, 70];
const PRIORITIES = {
  equilibre: "Équilibre",
  sante: "Santé",
  travail: "Études et travail",
  famille: "Famille et amis",
  plaisir: "Plaisirs",
};

class Life {
  constructor(opts = {}) {
    this.mode = opts.mode || "births";
    this.code = opts.code || drawCountry(this.mode);
    this.country = BY_CODE[this.code];
    this.home = this.code;
    this.sex = opts.sex || drawSex();
    this.name = opts.name || drawName(this.code, this.sex);
    this.auto = !!opts.auto;
    this.decile = 1 + Math.floor(rand() * 10);
    this.age = 0;
    this.alive = true;
    const c = this.country;
    this.stats = {
      health: clamp(62 + (c.e0.f - 70) * 0.8 + randn() * 8, 20, 95),
      happy: clamp(50 + (c.happy - 5.5) * 5 + randn() * 6, 10, 90),
      know: clamp(10 + randn() * 4, 2, 25),
      rel: clamp(55 + randn() * 8, 20, 90),
    };
    this.healthStart = this.stats.health;
    this.edu = "none";
    this.schooling = null; // "primaire" | "secondaire" | "universite" | null
    this.job = null;
    this.incomePct = null;
    this.income = 0;
    this.retired = false;
    this.partner = null;
    this.married = false;
    this.marriedEver = false;
    this.children = [];
    this.siblings = 0;
    this.emigrated = false;
    this.emigrationOffered = false;
    this.priority = "equilibre";
    this.log = [];
    this.highlights = [];
    this.reflections = [];
    this.queue = [];
    this.history = []; // un instantané par année
    this.cause = null;
    this.born = new Date();
    this.say(`Naît ${inCountry(c)}, dans une famille ${this.familyLabel()}.`, "birth");
    this.snapshot();
  }

  g(m, f) { return this.sex === "m" ? m : f; }
  get here() { return BY_CODE[this.code]; }
  familyLabel() {
    const d = this.decile;
    if (d <= 2) return "parmi les plus pauvres du pays";
    if (d <= 4) return "modeste";
    if (d <= 7) return "aux revenus moyens";
    if (d <= 9) return "aisée";
    return "parmi les plus riches du pays";
  }
  say(text, kind = "", highlight = false) {
    const entry = { age: this.age, text, kind };
    this.log.push(entry);
    if (highlight) this.highlights.push(entry);
    return entry;
  }
  ask(text, options) {
    this.queue.push({ text, options, age: this.age });
  }
  resolve(i) {
    const d = this.queue.shift();
    if (!d) return;
    const opt = d.options[i];
    if (opt.apply) opt.apply();
  }
  autoResolveAll() {
    while (this.queue.length) {
      const d = this.queue[0];
      const weights = d.options.map(o => o.autoWeight ?? 1);
      const i = weighted(weights.map((w, idx) => [idx, w]));
      this.resolve(i);
    }
  }
  bump(stat, v) { this.stats[stat] = clamp(this.stats[stat] + v, 0, 100); }

  snapshot() {
    this.history[this.age] = {
      age: this.age, alive: this.alive, ...Object.fromEntries(Object.entries(this.stats).map(([k, v]) => [k, Math.round(v)])),
      edu: this.edu, schooling: this.schooling, job: this.job, income: Math.round(this.income),
      married: this.married, children: this.children.filter(k => k.alive).length, code: this.code,
    };
  }

  // Probabilité de mourir pendant l'année, modulée par la santé (comparée à la
  // santé moyenne à cet âge) et par la richesse.
  hazard() {
    const t = lifeTable(this.code, this.sex);
    const q = t.qx[Math.min(this.age, MAX_AGE)];
    const wealth = this.incomePct != null ? this.incomePct : (this.decile - 0.5) / 10;
    const mult = Math.exp(-(this.stats.health - this.healthStart + 66 - expectedHealth(this.age)) / 45) * (1.25 - wealth * 0.5);
    return clamp(q * mult, 0, 1);
  }

  pickCause() {
    const c = this.here, a = this.age;
    const bracket = a < 5 ? "infant" : a < 30 ? "young" : a < 65 ? "adult" : "old";
    const table = CAUSES[bracket];
    const w = { ...table.base };
    for (const [k, v] of Object.entries(table[c.region] || {})) w[k] = (w[k] || 0) + v;
    if ("homicide" in w) w.homicide = c.hom * (bracket === "young" ? 1.4 : 0.4) * this.g(1.6, 0.4);
    if ("accident de la route" in w) w["accident de la route"] *= this.g(1.4, 0.6);
    return weighted(Object.entries(w));
  }

  // Avance d'une année. Les décisions éventuelles s'ajoutent à this.queue.
  step() {
    if (!this.alive) return;
    if (rand() < this.hazard()) return this.die();
    this.age += 1;
    this.yearEvents();
    this.updateStats();
    this.snapshot();
    if (this.auto) this.autoResolveAll();
  }

  die() {
    this.alive = false;
    this.cause = this.pickCause();
    const ageTxt = this.age === 0 ? "avant son premier anniversaire" : `à ${this.age} ans`;
    this.say(`${this.g("Meurt", "Meurt")} ${ageTxt}. Cause : ${this.cause}.`, "death", true);
    this.queue = [];
    this.snapshot();
  }

  yearEvents() {
    const a = this.age, c = this.here, s = this.stats;

    // Petite enfance
    if (a === 1) this.say(pick(["Fait ses premiers pas.", "Commence à marcher en s’accrochant aux meubles.", "Sourit à tout le monde."]));
    if (a === 2) this.say(pick(["Dit ses premiers mots.", "Apprend le mot « non » et l’utilise beaucoup.", "Chante sans savoir les paroles."]));
    if (a >= 1 && a <= 12 && rand() < (c.tfr - 1) / 12) {
      this.siblings++;
      this.say(this.siblings === 1 ? "Un petit frère ou une petite sœur arrive." : "Encore un bébé dans la famille.");
    }
    if (a >= 1 && a <= 10 && rand() < c.imr / 250) {
      const ill = c.region === "SSA" ? pick(["le paludisme", "une forte fièvre", "une infection pulmonaire"]) : pick(["une forte fièvre", "une infection pulmonaire", "une diarrhée sévère"]);
      this.say(`Tombe ${this.g("malade", "malade")} : ${ill}. ${rand() < 0.5 ? "Guérit lentement." : "S’en remet."}`);
      this.bump("health", -3);
    }

    // École
    if (a === 6) {
      const p = clamp(c.school / 8, 0.2, 0.99) * (0.8 + 0.04 * this.decile) * (this.sex === "f" && c.cm > 30 ? 0.9 : 1);
      if (rand() < p) { this.schooling = "primaire"; this.say("Entre à l’école primaire.", "edu"); }
      else this.say(pick(["N’entre pas à l’école : il n’y en a pas assez près de chez soi.", "Reste à la maison pour aider la famille au lieu d’aller à l’école.", "L’école coûte trop cher pour la famille cette année."]), "edu", true);
    }
    if (a === 12 && this.schooling === "primaire") {
      this.edu = "primaire";
      const p = clamp((c.school - 3.5) / 7, 0.05, 0.98) * (0.75 + 0.05 * this.decile) * (0.7 + s.know / 170);
      if (rand() < p) { this.schooling = "secondaire"; this.say("Entre au collège.", "edu"); }
      else { this.schooling = null; this.say("Quitte l’école après le primaire.", "edu", true); }
    }
    if (a === 15 && this.schooling === "secondaire") {
      const poor = this.decile <= 3 && c.gdp < 15000;
      this.ask(poor ? "La famille a besoin d’argent. Continuer l’école ou commencer à travailler ?" : "Fin du collège. Que faire ensuite ?", [
        { label: "Continuer au lycée", autoWeight: poor ? 1 : 4, apply: () => { this.say("Choisit de continuer au lycée.", "edu"); if (poor) this.bump("rel", -4); } },
        { label: "Commencer à travailler", autoWeight: poor ? 2 : 0.5, apply: () => { this.schooling = null; this.say("Quitte l’école pour travailler.", "edu", true); this.startWork(); } },
      ]);
    }
    if (a === 18 && this.schooling === "secondaire") {
      this.edu = "secondaire";
      this.schooling = null;
      this.say("Termine le lycée.", "edu", true);
      const secShare = clamp((c.school - 3.5) / 7, 0.1, 1);
      const p = clamp((c.tert / 100) / secShare, 0.05, 0.95) * (0.6 + s.know / 125) * (0.8 + 0.04 * this.decile);
      this.ask("Le lycée est fini. Tenter l’université ?", [
        { label: "Tenter l’université", autoWeight: p * 3, apply: () => {
          if (rand() < clamp(p, 0.03, 0.97)) { this.schooling = "universite"; this.say("Est " + this.g("admis", "admise") + " à l’université.", "edu", true); this.bump("happy", 5); }
          else { this.say("N’obtient pas de place à l’université et commence à travailler.", "edu", true); this.bump("happy", -5); this.startWork(); }
        } },
        { label: "Travailler tout de suite", autoWeight: 1, apply: () => { this.say("Choisit de travailler tout de suite."); this.startWork(); } },
      ]);
    }
    if (a === 22 && this.schooling === "universite") {
      this.edu = "universite";
      this.schooling = null;
      this.say("Obtient son diplôme universitaire.", "edu", true);
      this.bump("happy", 6);
      this.startWork();
    }
    if (this.schooling) this.bump("know", (this.schooling === "universite" ? 6 : 5) * (0.6 + Math.log10(c.gdp) / 10));

    // Les enfants hors de l'école finissent par travailler.
    if (!this.schooling && !this.job && !this.retired && a >= 12) {
      const p = a < 15 ? clamp(0.6 - Math.log10(c.gdp) / 10, 0.05, 0.4) : 0.5;
      if (rand() < p) this.startWork();
    }

    // Mariage d'enfants
    if (this.sex === "f" && !this.married && a >= 13 && a <= 17 && rand() < c.cm / 100 / 4 * (1.3 - this.decile / 10)) {
      this.marry(true);
    }

    // Adolescence
    if (a >= 13 && a <= 17 && rand() < 0.2) this.say(pick(["Se fait un ami pour la vie.", "Tombe amoureux·se pour la première fois.", "Se dispute souvent avec ses parents.", "Découvre une musique qui ne la quittera plus.", "Passe des nuits à parler de l’avenir avec ses amis."]).replace("amoureux·se", this.g("amoureux", "amoureuse")).replace("la quittera", this.g("le quittera", "la quittera")));
    if (a >= 8 && a <= 16 && s.rel < 40 && rand() < 0.12) { this.say("Subit du harcèlement à l’école."); this.bump("happy", -8); }

    // Travail
    if (this.job && !this.retired) {
      if (rand() < 0.05 + (c.gdp < 10000 ? 0.04 : 0)) { this.say(pick(["Perd son travail.", "L’entreprise ferme ; il faut chercher autre chose.", "Une mauvaise saison ruine le travail de l’année."]), "", true); this.incomePct = clamp(this.incomePct - 0.12, 0.01, 0.99); this.bump("happy", -8); }
      else if (rand() < 0.04 + s.know / 1000) { this.say(pick(["Obtient une promotion.", "Trouve un meilleur travail.", "Son activité se développe."]), "", true); this.incomePct = clamp(this.incomePct + 0.1, 0.01, 0.99); this.bump("happy", 5); }
      if (this.priority === "travail") this.incomePct = clamp(this.incomePct + 0.01, 0.01, 0.99);
      this.income = incomeAt(c, this.incomePct);
    }
    const retireAge = c.gdp > 25000 ? 64 : c.gdp > 10000 ? 62 : 68;
    if (this.job && !this.retired && a >= retireAge && (rand() < 0.5 || s.health < 30)) {
      this.retired = true;
      this.say(c.gdp > 25000 ? "Prend sa retraite." : "Arrête de travailler ; les enfants aident désormais.", "", true);
      this.income *= c.gdp > 25000 ? 0.6 : 0.3;
    }

    // Amour et mariage
    if (!this.married && a >= 18) {
      const p = a <= 35 ? 0.13 : a <= 50 ? 0.04 : 0.01;
      if (rand() < p) {
        const sexP = this.sex === "m" ? "f" : "m";
        const nm = drawName(this.code, sexP);
        this.ask(`${this.g("Il", "Elle")} rencontre ${nm}. Se marier ?`, [
          { label: `Épouser ${nm}`, autoWeight: 3, apply: () => this.marry(false, nm) },
          { label: "Pas maintenant", autoWeight: 1, apply: () => { this.say(`Ne s’engage pas avec ${nm}.`); } },
        ]);
      }
    }
    if (this.married && rand() < 0.012 * (1.5 - s.rel / 100) * (c.gdp > 20000 ? 1.6 : 0.8)) {
      this.say(`Divorce de ${this.partner}.`, "", true);
      this.married = false; this.partner = null; this.bump("happy", -10);
    }
    if (this.married && a > 55 && rand() < 0.012 * (a - 50) / 10) {
      this.say(`${this.partner} meurt. ${this.g("Il", "Elle")} reste ${this.g("veuf", "veuve")}.`, "", true);
      this.married = false; this.partner = null; this.bump("happy", -15); this.bump("rel", -8);
    }

    // Enfants
    if (this.married && a >= 16 && a <= 44) {
      const p = clamp(c.tfr / 16, 0.03, 0.45) * (this.children.length >= Math.round(c.tfr + 1) ? 0.3 : 1);
      if (rand() < p) {
        const kidSex = drawSex();
        const kidName = drawName(this.code, kidSex);
        const kid = { name: kidName, sex: kidSex, born: a, alive: true };
        this.children.push(kid);
        this.say(`Naissance ${this.children.length === 1 ? "de son premier enfant" : "d’un enfant"} : ${kidName}.`, "family", true);
        this.bump("happy", 6); this.bump("rel", 4);
        if (rand() < c.imr * 1.4 / 1000) {
          kid.alive = false;
          this.say(`${kidName} meurt avant ses cinq ans.`, "", true);
          this.bump("happy", -20);
        }
      }
    }
    if (a >= 48 && this.children.length && rand() < 0.08) this.say(pick(["Devient grand-parent.", "Un petit-enfant naît.", "La famille s’agrandit encore."]), "family");

    // Émigration
    if (!this.emigrationOffered && !this.emigrated && a >= 20 && a <= 35 && c.gdp < 20000 && rand() < 0.035) {
      this.emigrationOffered = true;
      const dest = BY_CODE[pick(EMIGRATION[c.region] || EMIGRATION.EUR)];
      const p = clamp(0.1 + s.know / 300 + this.decile / 40, 0.05, 0.7);
      this.ask(`Une occasion de partir vivre ${inCountry(dest)} se présente. Tenter l’émigration ?`, [
        { label: `Partir ${inCountry(dest)}`, autoWeight: 1, apply: () => {
          if (rand() < p) {
            this.emigrated = true; this.code = dest.code;
            this.incomePct = clamp(0.15 + this.incomePct * 0.4, 0.05, 0.6);
            if (this.job) this.income = incomeAt(dest, this.incomePct);
            this.say(`Émigre ${inCountry(dest)} ${dest.flag}.`, "move", true);
            this.bump("rel", -12); this.bump("happy", -3);
          } else { this.say(`La tentative de départ ${inCountry(dest)} échoue.`, "", true); this.bump("happy", -6); }
        } },
        { label: "Rester", autoWeight: 2, apply: () => this.say("Décide de rester près des siens.") },
      ]);
    }

    // Santé à l'âge adulte
    if (a >= 30 && rand() < 0.02 + a / 3000) { this.say(pick(["Une grave maladie la cloue au lit plusieurs mois.", "Un accident l’oblige à s’arrêter de longues semaines.", "Les médecins découvrent un problème de cœur."]).replace("la cloue", this.g("le cloue", "la cloue")), "", true); this.bump("health", -8); }
    if (a >= 18 && rand() < 0.03) this.say(pick(["Part en voyage pour la première fois.", "Se lance dans un nouveau projet.", "Retrouve un vieil ami perdu de vue.", "Apprend à cuisiner le plat de sa grand-mère.", "Déménage dans une autre ville.", "Plante un arbre devant la maison."]));
  }

  startWork() {
    if (this.job) return;
    const c = this.here;
    const z = 0.45 * normInv((this.decile - 0.5) / 10) + 0.4 * EDU_Z[this.edu] + 0.25 * (this.stats.know - 50) / 25 + 0.6 * randn();
    this.incomePct = clamp(normCdf(z / 0.95), 0.01, 0.99);
    const tier = this.edu === "universite" ? "high" : this.edu === "secondaire" && this.incomePct > 0.25 ? "mid" : c.gdp > 25000 && this.age >= 16 ? "mid" : "low";
    const job = pick(JOBS[tier]);
    this.job = this.g(job[0], job[1]);
    this.income = incomeAt(c, this.incomePct);
    const verb = /^(travaille|vend)/.test(this.job) ? this.job : `devient ${this.job}`;
    this.say(`${this.age < 15 ? "Encore enfant, " + verb : verb.charAt(0).toUpperCase() + verb.slice(1)}.`, "work", true);
  }

  marry(child, nm) {
    const sexP = this.sex === "m" ? "f" : "m";
    this.partner = nm || drawName(this.code, sexP);
    this.married = true; this.marriedEver = true;
    if (child) {
      this.say(`Est mariée à ${this.age} ans à ${this.partner}, un homme bien plus âgé.`, "", true);
      if (this.schooling) { this.schooling = null; this.say("Doit quitter l’école."); }
      this.bump("happy", -10);
    } else {
      this.say(`Épouse ${this.partner}.`, "family", true);
      this.bump("happy", 8); this.bump("rel", 6);
    }
  }

  updateStats() {
    const a = this.age, c = this.here, s = this.stats, pr = this.priority;
    // Santé
    if (a < 18) this.bump("health", (78 - s.health) * 0.08);
    else if (a > 30) this.bump("health", -(a < 60 ? 0.25 : a < 75 ? 0.6 : 1.0));
    if (this.incomePct != null && this.incomePct < 0.2) this.bump("health", -0.5);
    if (pr === "sante") this.bump("health", 1.8);
    if (pr === "plaisir") this.bump("health", -0.8);
    // Savoir
    if (!this.schooling) this.bump("know", pr === "travail" ? 1.2 : a > 60 ? -0.3 : 0.2);
    // Relations
    this.bump("rel", (pr === "famille" ? 2.5 : 0) + (this.married ? 0.6 : -0.3) + (pr === "travail" ? -0.8 : 0) + (a > 70 ? -0.6 : 0));
    // Bonheur : tend vers une cible
    const incP = this.incomePct != null ? this.incomePct : (this.decile - 0.5) / 10;
    const target = 48 + (c.happy - 5.5) * 6 + (incP - 0.5) * 18 + (s.rel - 50) * 0.3 + (s.health - 60) * 0.2 + (pr === "plaisir" ? 6 : 0);
    this.bump("happy", (target - s.happy) * 0.22 + randn() * 2);
  }

  summary() {
    const living = this.children.filter(k => k.alive).length;
    return {
      name: this.name, sex: this.sex, home: this.home, code: this.code, age: this.age, alive: this.alive, cause: this.cause,
      edu: this.edu, job: this.job, income: Math.round(this.income), incomePct: this.incomePct,
      marriedEver: this.marriedEver, children: this.children.length, childrenAlive: living,
      emigrated: this.emigrated, stats: { ...this.stats }, born: this.born.toISOString(),
    };
  }
}

// Simule une vie entière automatiquement (pour les « nés à la même seconde »).
function simulateWhole(opts) {
  const life = new Life({ ...opts, auto: true });
  while (life.alive && life.age < MAX_AGE) life.step();
  return life;
}
