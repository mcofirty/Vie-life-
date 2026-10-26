// Moments de vie : les petites scènes qui racontent une vie entre les grands
// événements. Chacune dépend du niveau de vie, du pays (ou de sa culture),
// de l'époque, de la ville ou de la campagne, de l'âge et de la situation.
// Écrites comme on raconte le terrain : des détails concrets, ni misérabilisme
// ni carte postale ; un enfant pauvre de Paris et un enfant aisé de Lagos ont
// chacun leurs scènes.
//
// Niveau de vie (t, palier 0 à 5) : revenu du foyer par personne (échelle racine
// carrée de la taille du foyer), en $ PPA par an — 0 survie (< 1 500, ≈ 4 $ par
// jour), 1 précarité (< 4 000), 2 modeste (< 10 000), 3 classe moyenne (< 25 000),
// 4 aisance (< 60 000), 5 grande aisance. Place dans le pays (p, de 0 à 1) :
// rang dans la distribution des revenus du pays, pour la pauvreté et la richesse
// relatives (les fins de mois à Paris, les domestiques à Lima). Les scènes de pauvreté
// (paliers 0 et 1) ne concernent jamais le quart le plus aisé du pays.
//
// Champs d'un moment :
//   id, a [âge min, max], y [année min, max], ys [années exactes],
//   t [palier min, max], p [place min, max], g [PIB/hab. du pays min, max],
//   r [régions], cc [pays, « @zone » ou « #RÉGION »], not [pays exclus],
//   cy { pays: [de, à] }, on { pays: [années exactes] }, cs { indicateur: [min, max] },
//   o (1 : pays d'origine plutôt que pays où l'on vit, pour la culture),
//   from [pays d'origine des émigrés], u (1 ville, 0 campagne), sex,
//   is (conditions : "married kids !retired", "s:agri", "j:farmer,herder", "wed:25"),
//   w (poids), odds (chance par an qu'il soit possible, pour les événements rares), once, gap (années avant de revenir, 12 par défaut), sure (raconté
//   dès que possible : dates, âges précis), kind (icône), txt (texte ou variantes),
//   fx { health, happy, know, rel, cost, gain, debt, fund (× revenu médian), herd },
//   heavy (passage difficile : replié avec « pas de scènes effrayantes », absent en
//   mode classe), hl (moment gardé), stamp (année en tête, comme l'histoire),
//   unless [moments qui l'excluent s'ils ont déjà eu lieu], set / need / after / clear
//   (fils narratifs sur plusieurs années), ask (décision).
// Textes : {a|b} s'accorde selon le sexe ; {enfant}, {parent}, {mere}, {pere},
// {fratrie}, {conjoint} donnent un prénom, {enfant:il|elle} accorde selon cette
// personne ; {pays}, {age}, {annee} ; {$0.1} = un dixième du revenu médian du pays.

const ZONES = {
  islam: "AF PK BD ID MY BN MV NE ML SN GN MR SO SD DJ KM GM SL BF TD EG YE IR IQ DZ MA SA SY JO TN PS LY AE OM KW QA BH TR UZ TJ TM KG KZ AZ AL XK",
  christian: "#NAM #LAT #OCE RU UA BY MD RO BG RS ME MK HR SI GR CY GE AM PL CZ SK HU LT LV EE DE AT CH LI FR BE NL LU GB IE IS NO SE DK FI IT ES PT MT AD MC SM GI IM FO GL PH TL KR LB CD CG AO ZA KE UG TZ RW BI ZM MW ZW GH CM MG MZ NA BW LS SZ GA GQ CF SS ST CV ET LR TG BJ SC",
  lunar: "CN TW HK MO SG VN KR",
  hindu: "IN NP MU",
  sahel: "NE ML BF TD SN MR GM",
  horn: "SO ET ER DJ KE",
  safr: "ZA LS SZ BW NA ZW ZM MW MZ",
  monsoon: "IN BD PK NP LK MM TH KH LA VN",
  rice: "IN BD NP LK MM TH KH LA VN ID PH CN MY MG JP KR",
  typhoon: "PH VN CN TW JP KR HK MO",
  quake: "JP TR IR CL MX PE EC NP ID PH IT GR NZ HT AF PK CN TW GT SV NI CR CO VU PG TO",
  drought: "NE ML BF TD SN MR SO ET KE ER DJ SD SS ZW ZM MW MZ ZA BW NA LS MG AU AF SY IR MA DZ TN",
  fire: "AU US CA GR PT ES CL",
  cold: "RU CA MN KZ FI NO SE IS GL BY",
  mega: "NG EG ID PH IN BD PK KE TH VN MX BR PE CO AR CN TR IR CD",
  gulf: "AE SA QA KW BH OM",
  laborsrc: "IN PK BD NP LK PH ID",
  remit: "PH MX SV HN GT HT JM NP TJ KG UZ BD PK IN LK LB EG MA SN ML GM LR NG GH KE ZW MD UA AM GE XK AL BA",
  remitus: "MX SV HN GT HT JM DO NI EC CO CU",
  eu: "FR DE IT ES PT BE NL LU AT IE DK SE FI GR",
  eueast: "PL CZ SK HU SI HR RO BG LT LV EE CY MT",
  euro: "FR DE IT ES PT BE NL LU AT IE FI GR",
  nordic: "NO SE DK FI IS",
  ussr: "RU UA BY MD LT LV EE KZ UZ TM KG TJ AZ AM GE",
  eastbloc: "PL CZ SK HU RO BG AL",
  hisp: "MX GT SV HN NI CR PA CU DO PR CO VE EC PE BO PY AR UY CL",
  cricket: "IN PK BD LK AF GB AU NZ ZA ZW JM TT BB GY",
  baseball: "US JP KR TW CU DO VE PR NI PA",
  tropics: "#SSA BD LK MV IN PH ID MY SG TH VN KH LA MM TL BN BR CO VE GY SR CU DO HT JM PR PA CR NI HN SV GT BZ TT BB BS",
  secular: "FR BE NL LU DE CZ EE SE NO DK FI IS GB CN JP KR VN HK TW MO CU KP AU NZ UY",
  norail: "NE TD BI RW SO LY YE GM GW SL CF MV BT MT CY IS OM KW QA BH AF SS LS",
};

const MOMENTS = [];
function scenes(theme, kind, list) { for (const m of list) MOMENTS.push({ theme, kind, ...m }); }

// --- Premiers pas (1-5 ans) ------------------------------------------------------
scenes("Premiers pas", "life", [
  { id: "natte-fratrie", a: [1, 5], t: [0, 1], is: "sibs", txt: "Dort sur une natte à même le sol, serré{|e} contre ses frères et sœurs." },
  { id: "natte-mere", a: [1, 4], t: [0, 0], is: "mother !sibs", txt: "Dort sur une natte contre sa mère, sous l’unique couverture de la maison." },
  { id: "dos-mere", a: [1, 2], r: ["SSA"], t: [0, 2], is: "mother", txt: "Passe ses journées sur le dos de sa mère, noué{|e} dans un pagne, pendant qu’elle travaille." },
  { id: "habits-aines", a: [2, 9], t: [0, 1], is: "oldsib", txt: ["Porte les vêtements de {fratrie}, reprisés jusqu’à la corde.", "Hérite des sandales trop grandes de {fratrie} ; on bourre le bout avec du tissu."] },
  { id: "jouets-fil", a: [3, 9], t: [0, 1], r: ["SSA", "SAS", "LAT"], txt: ["Fabrique ses propres jouets : une voiture en fil de fer, des roues en capsules de bouteille.", "Pousse une vieille roue de vélo avec un bâton dans la poussière, des heures durant."] },
  { id: "poupee-mais", a: [3, 8], t: [0, 1], u: 0, txt: "Fait des poupées avec des épis de maïs et des bouts de tissu." },
  { id: "moustiquaire", a: [1, 5], r: ["SSA"], g: [0, 8000], y: [2005, 2100], kind: "health", txt: "Dort sous une moustiquaire distribuée au dispensaire ; sa mère vérifie chaque soir qu’elle n’a pas de trou.", fx: { health: 1 } },
  { id: "vaccins-village", a: [1, 3], g: [0, 6000], y: [1975, 2100], u: 0, kind: "health", txt: "Reçoit ses vaccins quand l’équipe de vaccination passe au village, une fois par an.", fx: { health: 1 } },
  { id: "polio", a: [1, 5], cc: ["IN", "PK", "AF", "NG"], y: [1995, 2100], kind: "health", txt: "Reçoit les gouttes contre la polio des mains d’une volontaire, qui marque son petit doigt à l’encre violette." },
  { id: "croissance", a: [1, 5], t: [0, 0], g: [0, 5000], kind: "health", txt: "Grandit moins vite que les autres enfants : à la saison de la soudure, la nourriture manque.", fx: { health: -2 } },
  { id: "creche", a: [1, 3], t: [3, 5], g: [20000, 1e9], y: [1965, 2100], txt: ["Entre à la crèche ; les premières semaines, pleure chaque matin à la porte.", "Passe ses journées chez une assistante maternelle du quartier, avec trois autres petits."] },
  { id: "tablette", a: [2, 5], t: [3, 5], y: [2012, 2100], txt: "Regarde des dessins animés sur la tablette de ses parents, plus qu’ils ne voudraient l’avouer." },
  { id: "dessins-animes", a: [3, 6], t: [2, 5], y: [1960, 2011], txt: "Regarde ses premiers dessins animés à la télévision, assis{|e} beaucoup trop près de l’écran." },
  { id: "jouets-trop", a: [2, 7], t: [4, 5], txt: "Reçoit pour son anniversaire plus de jouets qu’il n’en faut ; certains restent dans leur carton." },
  { id: "perdu-marche", a: [3, 7], txt: "Se perd au marché ; on {le|la} retrouve trois heures plus tard, en train de manger des beignets chez une inconnue." },
  { id: "chevreau", a: [3, 8], u: 0, txt: ["Assiste à la naissance d’un chevreau et décide de lui donner le prénom de son meilleur ami.", "Passe ses journées avec les poules de la cour ; chacune a un nom."] },
  { id: "nordic-sieste", a: [1, 2], cc: ["@nordic"], y: [1950, 2100], txt: "Fait la sieste dehors dans son landau, même par −10 °C, comme presque tous les bébés du pays." },
  { id: "jp-maternelle", a: [3, 5], cc: ["JP"], y: [1960, 2100], txt: "Entre à la maternelle en uniforme, avec un chapeau jaune pour être vu{|e} des voitures." },
  { id: "fr-cantine", a: [3, 6], cc: ["FR"], y: [1960, 2100], txt: "Mange à la cantine de la maternelle : entrée, plat, fromage, dessert, comme les grands." },
  { id: "acte-naissance", a: [5, 9], t: [0, 0], r: ["SSA", "SAS"], y: [1900, 2005], once: 1, txt: "N’a pas d’acte de naissance : on {le|la} déclare des années plus tard, à une date un peu au hasard." },
  { id: "anniv-non", a: [4, 10], t: [0, 1], y: [1900, 1995], txt: "Personne ne fête les anniversaires à la maison ; la date exacte de sa naissance, d’ailleurs, on ne la sait pas bien." },
  { id: "anniv-gateau", a: [3, 10], t: [2, 4], y: [1950, 2100], txt: "Fête son anniversaire avec un gâteau de la boulangerie et des bougies qu’il faut souffler deux fois." },
  { id: "anniv-magicien", a: [4, 10], t: [5, 5], p: [0.9, 1], txt: "Fête son anniversaire avec un magicien, un château gonflable et cinquante invités qu’{il|elle} connaît à peine." },
  { id: "nounous", a: [1, 8], p: [0.92, 1], g: [0, 30000], txt: "Grandit entre une nounou, un chauffeur et une cuisinière ; ses parents rentrent tard." },
  { id: "grands-parents-cn", a: [2, 8], cc: ["CN"], u: 0, t: [0, 3], y: [1988, 2032], once: 1, hl: 1, kind: "family", is: "bothParents", txt: "Ses parents partent travailler dans les usines de la côte ; ce sont ses grands-parents qui l’élèvent au village.", fx: { rel: -3, happy: -2 }, set: "leftBehind" },
  { id: "parents-nouvel-an", a: [3, 17], need: "leftBehind", after: 1, gap: 3, kind: "family", is: "bothParents", txt: "Ses parents rentrent pour le Nouvel An : une semaine de fête, puis le train repart sans {lui|elle}.", fx: { happy: -1, rel: 1 } },
  { id: "parents-reviennent", a: [12, 20], need: "leftBehind", after: 5, clear: "leftBehind", kind: "family", is: "bothParents", txt: "Ses parents reviennent vivre au village ; on a presque désappris à vivre ensemble.", fx: { rel: 2 } },
]);

// --- Maison et confort ---------------------------------------------------------------
scenes("Maison et confort", "life", [
  { id: "toit-tole", a: [3, 75], t: [0, 1], g: [0, 15000], r: ["SSA", "SAS", "LAT", "EAS", "OCE"], gap: 20, txt: ["La pluie traverse le toit de tôle ; on place des bassines sous les fuites et on dort entre les gouttes.", "À la saison chaude, la tôle du toit transforme la maison en four ; on dort dehors sur des nattes."] },
  { id: "toit-fuit", a: [3, 75], t: [0, 1], r: ["EUR", "NAM", "MENA"], gap: 20, txt: "Le toit fuit à chaque orage ; on place des bassines et l’on dort entre les gouttes." },
  { id: "piece-unique", a: [3, 60], t: [0, 1], u: 1, g: [0, 20000], gap: 20, txt: ["Toute la famille vit dans une seule pièce ; on déplie les matelas le soir et on les empile le matin.", "Un rideau coupe l’unique pièce en deux : d’un côté on dort, de l’autre on cuisine et on reçoit."] },
  { id: "bidonville", a: [5, 60], t: [0, 1], u: 1, g: [0, 15000], y: [1950, 2100], txt: ["Vit dans un quartier construit sans permis, où les ruelles deviennent des rivières à chaque averse.", "Le quartier n’a pas d’adresse officielle ; pour recevoir une lettre, on donne le nom de la boutique d’à côté."] },
  { id: "toilettes-partagees", a: [5, 60], t: [0, 1], u: 1, g: [0, 12000], txt: "Partage les toilettes avec quarante voisins ; le matin, on fait la queue, un seau à la main." },
  { id: "maison-terre", a: [6, 70], t: [0, 1], u: 0, g: [0, 8000], txt: "Aide à refaire les murs de terre de la maison avant la saison des pluies, comme chaque année." },
  { id: "maison-dur", a: [22, 60], t: [2, 3], g: [0, 15000], once: 1, txt: "Remplace petit à petit les murs de terre par des parpaings, une rangée à chaque paie ; la maison grandit avec les années.", fx: { happy: 2 } },
  { id: "chambre-fratrie", a: [5, 17], t: [1, 3], is: "sibs", txt: "Partage sa chambre avec {fratrie} ; une ligne imaginaire coupe la pièce en deux." },
  { id: "chambre-a-soi", a: [6, 17], t: [3, 5], once: 1, txt: "A enfin une chambre à {lui|elle}, avec des posters au mur et une porte qu’on peut fermer." },
  { id: "multigen", a: [5, 70], r: ["SAS", "MENA", "SSA"], t: [0, 3], gap: 25, txt: ["Trois générations sous le même toit : grands-parents, oncles, cousins ; on n’est jamais seul{|e}, jamais au calme.", "La cour commune résonne de toute la famille élargie : on y cuisine, on s’y dispute, on s’y réconcilie."], fx: { rel: 2 } },
  { id: "residence-fermee", a: [5, 70], p: [0.85, 1], g: [0, 30000], u: 1, r: ["LAT", "SSA", "SAS", "MENA"], y: [1980, 2100], txt: "Vit dans une résidence fermée, avec gardiens et groupe électrogène, à l’abri du reste de la ville." },
  { id: "domestique-maison", a: [5, 80], p: [0.8, 1], g: [0, 30000], r: ["LAT", "SAS", "MENA", "SSA", "EAS"], txt: "À la maison, une employée prépare les repas et fait le ménage ; elle a laissé ses propres enfants au village." },
  { id: "maison-vacances", a: [5, 80], t: [5, 5], p: [0.9, 1], txt: "Passe les étés dans la maison de famille au bord de la mer : les mêmes voisins, les mêmes jeux, chaque année." },
  { id: "chauffage-eteint", a: [20, 85], p: [0, 0.18], g: [20000, 1e9], r: ["EUR", "NAM"], kind: "money", txt: "Garde le chauffage éteint jusqu’en décembre pour tenir le budget ; à la maison, on vit en pull.", fx: { health: -1 } },
  { id: "loyer-moitie", a: [22, 50], p: [0.05, 0.5], g: [30000, 1e9], u: 1, is: "renter", kind: "money", txt: "Le loyer avale presque la moitié du salaire ; le reste se compte au centime près." },
  { id: "dossier-location", a: [20, 35], cc: ["FR", "DE", "NL", "BE", "SE", "IE", "GB"], u: 1, y: [1990, 2100], is: "renter", txt: "Visite vingt appartements avant d’en obtenir un, avec un dossier épais comme un annuaire." },
  { id: "chambre-bonne", a: [18, 25], cc: ["FR"], u: 1, is: "uni", txt: "Loue une chambre de bonne de 9 m² sous les toits ; les toilettes sont sur le palier." },
  { id: "colocation", a: [19, 30], g: [20000, 1e9], u: 1, is: "single", y: [1975, 2100], txt: "Vit en colocation avec trois inconnus devenus amis ; la vaisselle est un sujet diplomatique." },
  { id: "chez-parents-30", a: [27, 33], cc: ["IT", "ES", "PT", "GR", "HR", "SK", "MT"], y: [1990, 2100], is: "single parent", txt: "Approche de la trentaine et vit encore chez ses parents, comme beaucoup de jeunes du pays : les loyers sont trop chers." },
  { id: "jp-studio", a: [18, 35], cc: ["JP"], u: 1, is: "single", txt: "Vit seul{|e} dans un studio de 20 m², à une heure de train du bureau ; le futon se replie chaque matin." },
  { id: "sg-hdb", a: [5, 80], cc: ["SG"], y: [1965, 2100], txt: "Vit dans un appartement HDB, comme près de quatre Singapouriens sur cinq ; on connaît les voisins de palier depuis vingt ans." },
  { id: "hk-petit", a: [8, 60], cc: ["HK", "MO"], t: [2, 4], txt: "Vit à quatre dans 35 m² ; ici, c’est presque grand." },
  { id: "hk-cercueil", a: [25, 85], cc: ["HK"], p: [0, 0.1], y: [1990, 2100], txt: "Loue une « maison-cercueil » : un lit dans une case, une étagère, une ampoule.", fx: { happy: -2 } },
  { id: "pret-immo-nappe", a: [28, 45], p: [0.35, 0.75], g: [20000, 1e9], is: "renter married", y: [1960, 2100], kind: "money", txt: "Calcule les mensualités d’un prêt immobilier sur un coin de nappe, un dimanche soir." },
  { id: "hlm", a: [5, 60], cc: ["FR"], u: 1, p: [0, 0.35], y: [1960, 2100], txt: "Grandit dans une tour de HLM ; l’ascenseur est en panne une semaine sur deux, mais les fenêtres donnent loin." },
  { id: "barres-beton", a: [5, 70], cc: ["@ussr", "@eastbloc"], u: 1, y: [1960, 2100], txt: "Vit dans un immeuble de cinq étages en panneaux de béton, tous pareils, où l’on connaît chaque voisin." },
  { id: "kommunalka", a: [5, 60], cc: ["RU", "UA", "BY"], u: 1, y: [1920, 1990], t: [0, 3], txt: "Vit dans un appartement communautaire : une chambre par famille, une cuisine pour cinq familles, et des disputes pour la salle de bains." },
  { id: "datcha", a: [5, 80], cc: ["RU", "UA", "BY"], y: [1950, 2100], t: [2, 4], kind: "culture", txt: "Passe l’été à la datcha : le potager, le bania, les confitures, les moustiques." },
  { id: "favela", a: [5, 60], cc: ["BR"], u: 1, p: [0, 0.3], y: [1940, 2100], txt: "Vit dans une favela accrochée à la colline ; d’en haut, la vue sur la ville est la plus belle de toutes." },
  { id: "chawl", a: [5, 60], cc: ["IN"], u: 1, t: [1, 2], txt: "Vit dans un chawl : une pièce par famille, et un long balcon commun où tout le monde se croise." },
]);

// --- Eau, lumière, énergie --------------------------------------------------------------
scenes("Eau, lumière, énergie", "life", [
  { id: "eau-puits", a: [5, 14], t: [0, 1], u: 0, g: [0, 10000], txt: ["Va chercher l’eau au puits avant l’école, un bidon jaune sur la tête.", "Marche chaque matin jusqu’à la rivière avec un seau ; l’eau pèse plus lourd que la veille."], fx: { health: -1 } },
  { id: "eau-puits-f", a: [8, 40], sex: "f", t: [0, 1], u: 0, g: [0, 10000], w: 1.5, txt: "Fait trois allers-retours au point d’eau chaque jour ; c’est le travail des femmes et des filles, dit-on.", fx: { health: -1 } },
  { id: "eau-quelques-heures", a: [6, 70], u: 1, t: [0, 2], cc: ["IN", "PK", "YE", "JO", "PS", "NG", "KE", "TZ", "BD", "NP", "LB", "IQ", "SY", "ZW", "ZM"], txt: "L’eau du robinet ne coule que quelques heures, deux jours par semaine ; on remplit tous les bidons de la maison." },
  { id: "eau-bonbonnes", a: [10, 80], u: 1, t: [2, 4], cc: ["MX", "ID", "IN", "EG", "TH", "VN", "CN", "NG"], y: [1990, 2100], txt: "Fait livrer chaque semaine des bonbonnes d’eau de 20 litres : ici, l’eau du robinet ne se boit pas." },
  { id: "lampe-petrole", a: [4, 60], t: [0, 1], u: 0, g: [0, 6000], y: [1900, 2030], txt: "La maison n’a pas l’électricité ; on fait ses devoirs à la lampe à pétrole, qui pique les yeux et noircit le plafond." },
  { id: "lampe-solaire", a: [6, 60], t: [0, 2], u: 0, r: ["SSA", "SAS"], y: [2012, 2100], g: [0, 8000], once: 1, txt: "Une petite lampe solaire remplace la lampe à pétrole ; on peut lire le soir sans tousser.", fx: { know: 1, health: 1 } },
  { id: "electricite-arrive", a: [3, 80], u: 0, g: [1500, 12000], y: [1925, 2030], once: 1, hl: 1, txt: "L’électricité arrive au village : tout le monde se réunit pour voir s’allumer la première ampoule.", fx: { happy: 3 } },
  { id: "route-goudron", a: [6, 80], u: 0, g: [2000, 14000], y: [1950, 2060], once: 1, txt: "Une route goudronnée relie enfin le village à la ville ; le trajet passe de quatre heures à une." },
  { id: "robinet-cour", a: [6, 80], u: 0, t: [1, 3], g: [2000, 16000], y: [1950, 2060], once: 1, txt: "Un robinet est installé dans la cour : fini les allers-retours au puits.", fx: { health: 1, happy: 2 } },
  { id: "bois-chauffe", a: [8, 70], u: 0, t: [0, 1], g: [0, 8000], sex: "f", txt: "Part chercher du bois de chauffe à des kilomètres, le fagot sur la tête ; la forêt recule chaque année." },
  { id: "fumee-cuisine", a: [20, 70], u: 0, t: [0, 1], g: [0, 8000], sex: "f", kind: "health", txt: "Cuisine sur un feu de bois dans une pièce sans cheminée ; la fumée fait tousser toute la famille.", fx: { health: -1 } },
  { id: "gazinière", a: [20, 70], t: [2, 3], p: [0, 0.7], g: [3000, 20000], y: [1960, 2100], once: 1, txt: "Achète une cuisinière à gaz : fini la fumée du bois dans les yeux.", fx: { health: 1 } },
  { id: "ujjwala", a: [20, 70], cc: ["IN"], t: [0, 2], u: 0, sex: "f", y: [2016, 2100], once: 1, txt: "Reçoit une bouteille de gaz grâce à un programme du gouvernement : fini le feu de bois qui pique les yeux.", fx: { health: 1 } },
  { id: "ng-generateur", a: [6, 80], cc: ["NG"], u: 1, y: [1990, 2100], txt: "Le courant public va et vient ; le soir, le quartier vit au rythme des groupes électrogènes, et tout le monde crie « Up NEPA ! » quand la lumière revient." },
  { id: "za-delestage", a: [6, 90], cc: ["ZA"], y: [2008, 2024], txt: "Délestage : le courant est coupé deux heures, plusieurs fois par jour, selon un calendrier aimanté sur le frigo." },
  { id: "pk-coupures", a: [6, 90], cc: ["PK"], y: [2007, 2018], txt: "L’été, le courant est coupé six heures par jour ; quand les ventilateurs s’arrêtent, tout le monde monte dormir sur le toit." },
  { id: "np-coupures", a: [6, 90], cc: ["NP"], y: [2006, 2016], txt: "Jusqu’à seize heures de coupure de courant par jour en hiver ; on vit avec les horaires imprimés dans le journal." },
  { id: "lb-generateur", a: [6, 90], cc: ["LB"], y: [1990, 2100], txt: "L’électricité publique ne vient que quelques heures par jour ; on paie un abonnement au générateur du quartier." },
  { id: "coupure-match", a: [6, 80], t: [1, 3], u: 1, g: [2000, 15000], not: ["NG", "ZA", "PK", "NP", "LB"], y: [1970, 2100], txt: "Une coupure de courant tombe en plein match ; tout le quartier gronde, puis sort parler dans la rue." },
  { id: "clim", a: [20, 70], t: [2, 4], r: ["SAS", "MENA", "SSA", "EAS"], y: [2000, 2100], once: 1, txt: "Achète un climatiseur ; la première nuit au frais semble irréelle.", fx: { health: 1 } },
]);

// --- À table -----------------------------------------------------------------------------
scenes("À table", "life", [
  { id: "ventre-vide", a: [3, 80], t: [0, 0], p: [0, 0.6], gap: 18, txt: ["Certains soirs, on se couche le ventre vide ; on apprend à ne pas en parler.", "Mange une fois par jour, quand il y a de quoi.", "Partage une assiette de riz à quatre ; les plus petits passent en premier."], fx: { health: -1, happy: -1 } },
  { id: "soudure", a: [3, 80], t: [0, 1], p: [0, 0.6], u: 0, g: [0, 6000], gap: 18, txt: "C’est la soudure : les greniers sont vides et la récolte n’est pas mûre ; on ne mange qu’une fois par jour jusqu’à la moisson.", fx: { health: -1 } },
  { id: "saute-repas", a: [20, 60], t: [0, 1], p: [0, 0.6], is: "kids", txt: "Saute un repas pour que les enfants mangent à leur faim ; personne ne s’en aperçoit.", fx: { health: -1, rel: 1 } },
  { id: "viande-fetes", a: [4, 80], t: [1, 1], txt: "La viande, c’est pour les jours de fête ; le reste du temps, des céréales, des légumes, et ce qu’on trouve." },
  { id: "poulet-dimanche", a: [4, 80], t: [2, 2], g: [0, 15000], txt: "Le dimanche, on tue un poulet ; c’est jour de fête à la maison." },
  { id: "sachets", a: [10, 80], t: [0, 1], r: ["SAS", "SSA", "EAS", "LAT"], y: [1985, 2100], gap: 20, kind: "money", txt: ["Achète l’huile, le savon et le shampoing en petits sachets, au jour le jour : jamais assez d’argent d’un coup pour un flacon entier.", "Achète trois cigarettes, une louche d’huile, un cube de bouillon : ici, tout se vend à l’unité."] },
  { id: "cahier-boutique", a: [18, 80], t: [0, 1], kind: "money", txt: "À la fin du mois, prend à crédit chez le boutiquier du coin, qui note tout dans un cahier d’écolier." },
  { id: "supermarche", a: [6, 80], t: [3, 4], y: [1960, 2100], gap: 30, txt: ["Les courses du samedi au supermarché, le chariot plein et la liste qu’on oublie toujours.", "Le grand plein de courses du mois : deux chariots, et la voiture qui ploie à l’arrière."] },
  { id: "resto-monde", a: [18, 70], t: [4, 5], g: [25000, 1e9], y: [1985, 2100], txt: "Découvre les sushis, les currys et les tacos sans quitter sa ville ; le monde entier tient dans sa rue." },
  { id: "resto-chic", a: [25, 85], t: [5, 5], p: [0.9, 1], txt: "Dîne dans des restaurants où le menu n’affiche pas les prix." },
  { id: "jardin-potager", a: [30, 85], u: 0, t: [1, 3], txt: "Cultive un potager derrière la maison : les tomates de l’été, c’est de l’argent qu’on ne dépense pas." },
  { id: "restos-coeur", a: [18, 85], cc: ["FR"], p: [0, 0.12], y: [1986, 2100], kind: "money", txt: "Va chercher un colis aux Restos du cœur ; on y croise des visages qu’on n’aurait pas imaginés là." },
  { id: "food-bank-gb", a: [18, 85], cc: ["GB"], p: [0, 0.15], y: [2010, 2100], kind: "money", txt: "Pousse la porte d’une banque alimentaire, en espérant ne croiser personne qu’{il|elle} connaît." },
  { id: "food-bank-us", a: [18, 85], cc: ["US", "CA"], p: [0, 0.15], y: [1980, 2100], kind: "money", txt: "Fait la queue à la banque alimentaire de la paroisse, entre deux services au travail." },
  { id: "tafel", a: [18, 85], cc: ["DE", "AT"], p: [0, 0.12], y: [1993, 2100], kind: "money", txt: "Fait ses courses à la Tafel : des invendus, quelques pièces, et beaucoup de pudeur." },
  { id: "bons-alimentaires", a: [18, 85], cc: ["US"], p: [0, 0.2], y: [1964, 2100], is: "kids", kind: "money", txt: "Paie une partie des courses avec des bons alimentaires ; à la caisse, on baisse les yeux." },
  { id: "cantine-gratuite", a: [6, 15], cc: ["FR", "GB", "FI", "SE"], p: [0, 0.2], is: "school", txt: "Mange gratuitement à la cantine : c’est souvent le seul repas complet de la journée." },
  { id: "repas-ecole-in", a: [6, 13], cc: ["IN"], y: [2003, 2100], t: [0, 2], is: "school", txt: "Le repas de midi est servi à l’école publique : riz, lentilles, parfois un œuf ; pour beaucoup d’élèves, c’est la raison de venir.", fx: { health: 1 } },
  { id: "libreta", a: [6, 90], cc: ["CU"], y: [1962, 2100], txt: "Chaque mois, la libreta, le carnet de rationnement : un peu de riz, de haricots, de sucre, et la queue à la bodega." },
  { id: "kp-rations", a: [6, 90], cc: ["KP"], txt: "Les rations de l’État s’amenuisent ; on complète avec des herbes cueillies dans les collines.", fx: { health: -1 } },
]);

// Plats de famille : selon le pays d'origine, même après avoir émigré.
scenes("Plats de famille", "life", [
  { id: "plat-fr", a: [4, 90], cc: ["FR", "BE", "LU", "MC"], o: 1, gap: 25, txt: ["Le gratin de sa grand-mère, le dimanche midi, et la croûte qu’on se dispute.", "Le pot-au-feu de l’hiver, qui embaume la maison dès le matin."] },
  { id: "plat-it", a: [4, 90], cc: ["IT", "SM"], o: 1, gap: 25, txt: "Les pâtes fraîches du dimanche, roulées à la main par sa grand-mère, et la sauce qui mijote depuis l’aube." },
  { id: "plat-es", a: [4, 90], cc: ["ES", "AD"], o: 1, gap: 25, txt: ["La paella du dimanche, préparée par son père dans une poêle immense, au milieu de la cour.", "Les tapas du soir, debout au comptoir, avec la moitié du quartier."] },
  { id: "plat-pt", a: [4, 90], cc: ["PT", "CV"], o: 1, gap: 25, txt: "La morue de Noël, et les mille façons de la préparer selon la famille." },
  { id: "plat-gr", a: [4, 90], cc: ["GR", "CY"], o: 1, gap: 25, txt: "L’agneau de Pâques à la broche ; tout le village tourne autour du feu, un verre à la main." },
  { id: "plat-de", a: [4, 90], cc: ["DE", "AT", "CH", "LI"], o: 1, gap: 25, txt: "Le café et les gâteaux du dimanche après-midi chez les grands-parents, avec la nappe brodée." },
  { id: "plat-gb", a: [4, 90], cc: ["GB", "IE", "IM", "GI"], o: 1, gap: 25, txt: "Le rôti du dimanche, avec ses Yorkshire puddings et une sauce trop épaisse." },
  { id: "plat-nl", a: [4, 90], cc: ["NL"], o: 1, gap: 25, txt: "Le hareng cru du marché, qu’on avale la tête en arrière, et les frites à la mayonnaise." },
  { id: "plat-nordic", a: [4, 90], cc: ["@nordic", "FO", "GL", "EE"], o: 1, gap: 25, txt: "La cueillette des myrtilles et des champignons en forêt, à la fin de l’été ; les confitures tiennent jusqu’au printemps." },
  { id: "plat-pl", a: [4, 90], cc: ["PL", "LT", "LV"], o: 1, gap: 25, txt: "La veille de Noël, douze plats sans viande, et la carpe qui nage dans la baignoire en attendant son heure." },
  { id: "plat-ru", a: [4, 90], cc: ["RU", "UA", "BY"], o: 1, gap: 25, txt: "Le bortsch de sa grand-mère, avec une cuillère de smetana par-dessus." },
  { id: "plat-balkans", a: [4, 90], cc: ["RS", "HR", "BA", "ME", "MK", "SI", "BG", "RO", "MD"], o: 1, gap: 25, txt: "Les sarmale de l’hiver, les feuilles de chou farcies qu’on prépare par dizaines pour toute la famille." },
  { id: "plat-hu", a: [4, 90], cc: ["HU"], o: 1, gap: 25, txt: "Le goulasch qui mijote dans un chaudron, dehors, un dimanche de fête." },
  { id: "plat-cz", a: [4, 90], cc: ["CZ", "SK"], o: 1, gap: 25, txt: "Les knedlíky et la sauce du dimanche, et la bière qu’on laisse goûter aux enfants du bout des lèvres." },
  { id: "plat-al", a: [4, 90], cc: ["AL", "XK"], o: 1, gap: 25, txt: "Le byrek du matin, acheté tout chaud à la boulangerie du coin." },
  { id: "plat-tr", a: [4, 90], cc: ["TR"], o: 1, gap: 25, txt: "Le petit déjeuner du week-end : vingt petites assiettes sur la table, et du thé à volonté." },
  { id: "plat-ir", a: [4, 90], cc: ["IR"], o: 1, gap: 25, txt: "Le tahdig, la croûte de riz dorée au fond de la marmite, que tous les enfants se disputent." },
  { id: "plat-af", a: [4, 90], cc: ["AF"], o: 1, gap: 25, txt: "Le qabuli palaw des grands jours, le riz aux carottes et aux raisins secs, servi sur un immense plat." },
  { id: "plat-eg", a: [4, 90], cc: ["EG"], o: 1, gap: 25, txt: "Le koshari du coin de la rue : du riz, des lentilles, des pâtes, et tout le monde l’adore." },
  { id: "plat-maghreb", a: [4, 90], cc: ["MA", "DZ", "TN", "LY", "MR"], o: 1, gap: 25, txt: "Le couscous du vendredi, partagé dans le grand plat après la prière." },
  { id: "plat-levant", a: [4, 90], cc: ["LB", "SY", "JO", "PS", "IQ"], o: 1, gap: 25, txt: "Les mezzés du vendredi, et le pain encore chaud du four du quartier." },
  { id: "plat-golfe", a: [4, 90], cc: ["@gulf", "YE"], o: 1, gap: 25, txt: "Le riz et l’agneau partagés sur un grand plateau, assis en cercle sur le tapis." },
  { id: "plat-il", a: [4, 90], cc: ["IL"], o: 1, gap: 25, txt: "Le repas du vendredi soir : la hallah, les bougies, et toute la famille autour de la table." },
  { id: "plat-in", a: [4, 90], cc: ["IN"], o: 1, gap: 25, txt: "Le dal et les chapatis chauds, mangés avec les doigts ; sa mère ne s’assoit qu’une fois tout le monde servi." },
  { id: "plat-pk", a: [4, 90], cc: ["PK"], o: 1, gap: 25, txt: "Le biryani des mariages, servi par montagnes, et la bataille pour les morceaux de viande." },
  { id: "plat-bd", a: [4, 90], cc: ["BD"], o: 1, gap: 25, txt: "Le riz au poisson, et l’ilish des grands jours, plein d’arêtes et de souvenirs." },
  { id: "plat-np", a: [4, 90], cc: ["NP", "BT"], o: 1, gap: 25, txt: "Le dal bhat deux fois par jour : « vingt-quatre heures d’énergie », dit le dicton." },
  { id: "plat-lk", a: [4, 90], cc: ["LK", "MV"], o: 1, gap: 25, txt: "Le riz et ses currys, dix petits bols autour de l’assiette, et le sambol de noix de coco." },
  { id: "plat-cn", a: [4, 90], cc: ["CN", "TW", "HK", "MO", "SG"], o: 1, gap: 25, txt: "Les raviolis du Nouvel An, pliés en famille jusqu’à minuit ; celui qui trouve la pièce cachée aura de la chance toute l’année." },
  { id: "plat-jp", a: [4, 90], cc: ["JP"], o: 1, gap: 25, txt: "Le bento préparé chaque matin par sa mère, avec des saucisses taillées en forme de pieuvre." },
  { id: "plat-kr", a: [4, 90], cc: ["KR"], o: 1, gap: 25, txt: "Le kimjang : chaque automne, toute la famille prépare des centaines de choux de kimchi pour l’hiver." },
  { id: "plat-vn", a: [4, 90], cc: ["VN"], o: 1, gap: 25, txt: "Le phở du matin, avalé sur un petit tabouret en plastique au bord du trottoir." },
  { id: "plat-th", a: [4, 90], cc: ["TH", "LA"], o: 1, gap: 25, txt: "Le som tam pilé au mortier, si épicé que les yeux pleurent, et le riz gluant roulé entre les doigts." },
  { id: "plat-kh", a: [4, 90], cc: ["KH"], o: 1, gap: 25, txt: "Le poisson séché et le prahok, dont l’odeur fait fuir les visiteurs et revenir les exilés." },
  { id: "plat-mm", a: [4, 90], cc: ["MM"], o: 1, gap: 25, txt: "La mohinga du matin, la soupe de poisson et de nouilles achetée au coin de la rue." },
  { id: "plat-id", a: [4, 90], cc: ["ID", "MY", "BN", "TL"], o: 1, gap: 25, txt: "Le nasi goreng du soir, acheté au chariot ambulant qui annonce son passage en tapant sur un bol." },
  { id: "plat-ph", a: [4, 90], cc: ["PH"], o: 1, gap: 25, txt: "Le lechon des grandes fêtes, et le riz à chaque repas, même au petit déjeuner." },
  { id: "plat-mn", a: [4, 90], cc: ["MN"], o: 1, gap: 25, txt: "Les buuz du Nouvel An, des centaines de raviolis à la vapeur préparés en famille." },
  { id: "plat-asie-centrale", a: [4, 90], cc: ["UZ", "TJ", "KZ", "KG", "TM", "AZ"], o: 1, gap: 25, txt: "Le plov des grandes occasions, cuit par les hommes dans un chaudron immense, au petit matin." },
  { id: "plat-ge", a: [4, 90], cc: ["GE"], o: 1, gap: 25, txt: "Les festins sans fin : les toasts du tamada, et les khinkalis qu’on mange avec les doigts sans renverser le bouillon." },
  { id: "plat-am", a: [4, 90], cc: ["AM"], o: 1, gap: 25, txt: "Le lavash cuit contre les parois du four en terre, et les brochettes du dimanche." },
  { id: "plat-ng", a: [4, 90], cc: ["NG"], o: 1, gap: 25, txt: "Le riz jollof des grands jours, et les débats sans fin pour savoir qui le cuisine le mieux, du Nigeria ou du Ghana." },
  { id: "plat-gh", a: [4, 90], cc: ["GH"], o: 1, gap: 25, txt: "Le fufu pilé à deux, au rythme du pilon, et la soupe d’arachide." },
  { id: "plat-sn", a: [4, 90], cc: ["SN", "GM"], o: 1, gap: 25, txt: "Le thiéboudienne partagé autour du grand plat, chacun mangeant la part qui est devant lui." },
  { id: "plat-ml", a: [4, 90], cc: ["ML", "BF", "NE", "TD", "GN"], o: 1, gap: 25, txt: "Le tô de mil et sa sauce gombo, mangé à la main dans la calebasse commune." },
  { id: "plat-ci", a: [4, 90], cc: ["CI", "TG", "BJ"], o: 1, gap: 25, txt: "L’attiéké au poisson braisé, acheté au maquis du coin, le vendredi soir." },
  { id: "plat-cm", a: [4, 90], cc: ["CM", "GA", "GQ"], o: 1, gap: 25, txt: "Le ndolé du dimanche, et le plantain mûr qui fond dans la bouche." },
  { id: "plat-et", a: [4, 90], cc: ["ET", "ER"], o: 1, gap: 25, txt: "L’injera partagée, et le gursha : la bouchée qu’on glisse dans la bouche de ceux qu’on aime." },
  { id: "plat-eaf", a: [4, 90], cc: ["KE", "TZ", "UG", "RW", "BI"], o: 1, gap: 25, txt: "L’ugali et les sukuma wiki presque chaque jour, et la viande grillée les jours de fête." },
  { id: "plat-za", a: [4, 90], cc: ["ZA", "BW", "NA", "LS", "SZ"], o: 1, gap: 25, txt: "Le braai du week-end : la viande grillée, les voisins, la musique jusqu’à la nuit." },
  { id: "plat-nshima", a: [4, 90], cc: ["ZM", "MW", "ZW", "MZ"], o: 1, gap: 25, txt: "La bouillie de maïs épaisse à chaque repas, nshima ou sadza selon le voisin ; sans elle, on n’a pas vraiment mangé." },
  { id: "plat-congo", a: [4, 90], cc: ["CD", "CG", "AO", "CF"], o: 1, gap: 25, txt: "Le fufu de manioc et les feuilles de pondu, le plat de tous les jours." },
  { id: "plat-mg", a: [4, 90], cc: ["MG", "KM"], o: 1, gap: 25, txt: "Le riz trois fois par jour ; ici, un repas sans riz n’est pas un repas." },
  { id: "plat-so", a: [4, 90], cc: ["SO", "DJ"], o: 1, gap: 25, txt: "Le riz à la viande de chèvre, et la banane qu’on mange avec, comme le veut la tradition." },
  { id: "plat-sd", a: [4, 90], cc: ["SD", "SS"], o: 1, gap: 25, txt: "La kissra, la galette fine de sorgho, et les fèves du matin." },
  { id: "plat-mx", a: [4, 90], cc: ["MX"], o: 1, gap: 25, txt: "Les tamales de Noël, préparés à la chaîne par toutes les femmes de la famille." },
  { id: "plat-camerique", a: [4, 90], cc: ["GT", "HN", "NI", "BZ"], o: 1, gap: 25, txt: "Les tortillas de maïs à chaque repas, chaudes, dans un torchon plié." },
  { id: "plat-sv", a: [4, 90], cc: ["SV"], o: 1, gap: 25, txt: "Les pupusas du dimanche soir, au fromage et aux haricots, avec le chou mariné." },
  { id: "plat-cu", a: [4, 90], cc: ["CU", "DO", "PR", "PA", "CR"], o: 1, gap: 25, txt: "Le riz aux haricots noirs, et le cochon de lait des grandes fêtes." },
  { id: "plat-br", a: [4, 90], cc: ["BR"], o: 1, gap: 25, txt: "La feijoada du samedi, qui dure tout l’après-midi." },
  { id: "plat-ar", a: [4, 90], cc: ["AR", "UY", "PY"], o: 1, gap: 25, txt: "L’asado du dimanche : son père surveille la braise pendant des heures, et le maté passe de main en main." },
  { id: "plat-cl", a: [4, 90], cc: ["CL"], o: 1, gap: 25, txt: "Les empanadas du 18 septembre, pour la fête nationale, et les cerfs-volants dans le ciel." },
  { id: "plat-pe", a: [4, 90], cc: ["PE"], o: 1, gap: 25, txt: "Le ceviche du dimanche, le meilleur du monde selon tout le quartier." },
  { id: "plat-andes", a: [4, 90], cc: ["BO", "EC"], o: 1, gap: 25, txt: "La soupe de quinoa, et les pommes de terre séchées au gel des hauts plateaux." },
  { id: "plat-co", a: [4, 90], cc: ["CO", "VE"], o: 1, gap: 25, txt: "Les arepas du matin, chaudes, avec du fromage qui file." },
  { id: "plat-jm", a: [4, 90], cc: ["JM", "TT", "BB", "BS", "LC", "GD", "VC", "AG", "DM", "KN", "GY"], o: 1, gap: 25, txt: "Le poulet grillé lentement du dimanche, et le riz aux pois." },
  { id: "plat-ht", a: [4, 90], cc: ["HT"], o: 1, gap: 25, txt: "La soupe joumou du 1er janvier, la soupe de l’indépendance, que toutes les familles préparent." },
  { id: "plat-us", a: [4, 90], cc: ["US"], o: 1, gap: 25, txt: "Les grillades du 4 juillet dans le jardin, et les feux d’artifice qu’on regarde allongé sur le capot." },
  { id: "plat-ca", a: [4, 90], cc: ["CA"], o: 1, gap: 25, txt: "Le printemps à la cabane à sucre, et la tire d’érable qu’on enroule sur un bâton dans la neige." },
  { id: "plat-au", a: [4, 90], cc: ["AU", "NZ"], o: 1, gap: 25, txt: "Le barbecue de Noël, en plein été, sur la plage." },
  { id: "plat-pacifique", a: [4, 90], cc: ["FJ", "WS", "TO", "PG", "SB", "VU", "KI", "AS"], o: 1, gap: 25, txt: "Le four creusé dans la terre des grands jours : la viande et les tubercules cuisent des heures sous les pierres chaudes." },
]);

// --- À l'école ---------------------------------------------------------------------------
scenes("À l’école", "edu", [
  { id: "marche-ecole", a: [6, 14], u: 0, g: [0, 10000], is: "school", txt: ["Marche une heure pour aller à l’école, et une heure pour rentrer ; pieds nus jusqu’à la saison des pluies.", "Traverse la rivière à gué pour aller à l’école ; quand l’eau monte, il n’y a pas classe."] },
  { id: "classe-cent", a: [6, 13], g: [0, 6000], r: ["SSA", "SAS"], is: "primary", txt: "Cent élèves dans la classe ; on s’assoit à trois par banc et on récite en chœur." },
  { id: "ecole-arbre", a: [6, 11], u: 0, t: [0, 1], r: ["SSA"], g: [0, 4000], y: [1950, 2025], is: "primary", txt: "L’école se fait sous un grand arbre, faute de bâtiment ; quand il pleut, il n’y a pas classe." },
  { id: "uniforme", a: [6, 12], t: [0, 2], r: ["SSA", "SAS", "LAT", "EAS"], is: "school", kind: "money", txt: "La famille économise des semaines pour acheter l’uniforme de l’école et une paire de chaussures noires.", fx: { cost: 0.01 } },
  { id: "frais-renvoye", a: [7, 17], t: [0, 1], r: ["SSA"], y: [1975, 2100], is: "school", txt: "Est renvoyé{|e} de l’école une semaine : les frais du trimestre ne sont pas payés.", fx: { know: -1, happy: -2 } },
  { id: "lampadaire", a: [8, 17], t: [0, 1], u: 1, g: [0, 8000], is: "school", txt: "Révise le soir sous le seul lampadaire de la rue, avec d’autres élèves venus chercher la lumière." },
  { id: "lunettes", a: [7, 16], t: [1, 5], is: "school", once: 1, kind: "health", txt: "Porte enfin des lunettes : le tableau redevient net, et les notes remontent.", fx: { know: 2 } },
  { id: "pas-lunettes", a: [7, 16], t: [0, 0], is: "school", once: 1, txt: "Voit mal le tableau, mais personne ne pense aux lunettes ; on {le|la} croit simplement distrait{|e}.", fx: { know: -1 } },
  { id: "instit", a: [6, 16], is: "school", once: 1, txt: ["A une institutrice qui croit en {lui|elle} plus que personne ; des années plus tard, {il|elle} se souviendra de son nom.", "Un professeur {le|la} retient après la classe pour lui prêter des livres."], fx: { know: 2, happy: 1 } },
  { id: "bibli", a: [8, 18], t: [2, 5], is: "school", y: [1920, 2100], txt: "Dévore tous les livres de la bibliothèque municipale, rayon après rayon.", fx: { know: 2 } },
  { id: "recitation", a: [8, 13], is: "school", txt: "Remporte le concours de récitation de l’école ; la médaille en carton reste accrochée au mur des années.", fx: { happy: 2 } },
  { id: "ecole-privee-riche", a: [6, 17], p: [0.85, 1], g: [0, 40000], y: [1985, 2100], r: ["LAT", "SSA", "SAS", "MENA", "EAS"], is: "school", txt: "Va dans une école privée bilingue où les frais d’une année dépassent ce que gagne un ouvrier." },
  { id: "agenda-plein", a: [6, 12], t: [4, 5], is: "school", y: [1970, 2100], txt: "Piano le lundi, foot le mercredi, natation le samedi : son agenda d’enfant est plus chargé que celui de ses parents." },
  { id: "piscine", a: [5, 10], g: [15000, 1e9], y: [1950, 2100], txt: "Apprend à nager à la piscine municipale, avec une planche en mousse et beaucoup d’eau avalée." },
  { id: "nager-riviere", a: [5, 12], u: 0, txt: "Apprend à nager dans la rivière avec les autres enfants, sans maître-nageur." },
  { id: "voyage-scolaire", a: [10, 17], t: [3, 5], is: "school", y: [1960, 2100], txt: "Part en voyage scolaire à l’étranger ; revient avec un porte-clés et un premier amour." },
  { id: "rentree-baskets", a: [9, 16], p: [0, 0.2], g: [20000, 1e9], is: "school", y: [1980, 2100], txt: "À la rentrée, n’a pas les baskets de marque des autres ; on se moque, {il|elle} serre les dents.", fx: { happy: -2 } },
  { id: "covid-en-ligne", a: [6, 22], t: [3, 5], ys: [2020, 2021], is: "student", once: 1, txt: "L’école se fait en ligne pendant la pandémie, depuis sa chambre, caméra éteinte." },
  { id: "covid-perdu", a: [6, 17], t: [0, 2], ys: [2020, 2021], is: "school", once: 1, txt: "Les écoles ferment pendant la pandémie ; sans ordinateur ni internet, l’année est presque perdue.", fx: { know: -2 } },
  { id: "filles-maison", a: [7, 13], sex: "f", t: [0, 1], is: "unschooled sibs", txt: "Ses frères vont à l’école ; elle reste à la maison pour aider sa mère et garder les petits." },
  { id: "aide-champs", a: [7, 14], u: 0, t: [0, 1], is: "school", txt: "Manque l’école à la saison des récoltes pour aider aux champs ; la maîtresse a l’habitude.", fx: { know: -1 } },
  { id: "chevres", a: [6, 12], u: 0, t: [0, 1], r: ["SSA", "SAS", "MENA"], is: "unschooled", txt: "Garde les chèvres de la famille du matin au soir, avec un bâton et une fronde." },
  { id: "jp-seisme-exercice", a: [6, 15], cc: ["JP"], y: [1960, 2100], is: "school", txt: "Exercice de séisme à l’école : on se cache sous les tables, un coussin ignifugé sur la tête." },
  { id: "us-confinement", a: [6, 17], cc: ["US"], y: [2000, 2100], is: "school", heavy: 1, txt: "Fait des exercices de confinement en classe, au cas où un tireur entrerait dans l’école." },
  { id: "hagwon", a: [10, 18], cc: ["KR"], y: [1995, 2100], is: "school", txt: "Enchaîne l’école et le hagwon, les cours privés du soir ; rentre à la maison vers 23 heures.", fx: { know: 2, happy: -2 } },
  { id: "juku", a: [10, 18], cc: ["JP"], y: [1970, 2100], is: "school", t: [2, 5], txt: "Après l’école, file au juku, l’école du soir, pour préparer les examens d’entrée.", fx: { know: 2, happy: -1 } },
  { id: "cours-particuliers", a: [10, 18], cc: ["EG", "GR", "IN", "CN", "TR", "IR", "VN"], t: [2, 4], is: "school", txt: "Prend des cours particuliers presque tous les soirs ; la famille y consacre une bonne part de ses revenus.", fx: { know: 2, cost: 0.02 } },
  { id: "gaokao", a: [17, 17], cc: ["CN"], y: [1977, 2100], is: "secondary", once: 1, sure: 1, hl: 1, txt: "Passe le gaokao : deux jours d’examen qui décideront de toute sa vie, dit-on ; les parents attendent devant les grilles." },
  { id: "suneung", a: [17, 17], cc: ["KR"], y: [1994, 2100], is: "secondary", once: 1, sure: 1, hl: 1, txt: "Le jour du suneung, les avions cessent de décoller pendant l’épreuve d’anglais ; tout le pays retient son souffle." },
  { id: "bac", a: [17, 17], cc: ["FR"], y: [1950, 2100], is: "secondary", once: 1, sure: 1, txt: "Passe le bac ; toute la famille attend les résultats devant le panneau du lycée." },
  { id: "kota", a: [16, 17], cc: ["IN"], y: [1995, 2100], t: [2, 4], is: "secondary", once: 1, txt: "Part préparer les concours d’ingénieur à Kota, dans une chambre minuscule, douze heures de révision par jour.", fx: { know: 3, happy: -3 } },
  { id: "waec", a: [17, 17], cc: ["NG", "GH", "SL", "LR", "GM"], y: [1955, 2100], is: "secondary", once: 1, sure: 1, txt: "Passe le WAEC, l’examen de fin d’études de l’Afrique de l’Ouest anglophone ; les résultats tardent des mois." },
  { id: "enem", a: [17, 17], cc: ["BR"], y: [1998, 2100], is: "secondary", once: 1, sure: 1, txt: "Passe l’ENEM avec des millions d’autres lycéens ; les grilles ferment à l’heure pile, et certains arrivent en courant." },
  { id: "tr-concours", a: [17, 17], cc: ["TR"], y: [1975, 2100], is: "secondary", once: 1, sure: 1, txt: "Passe le concours national d’entrée à l’université, avec deux millions de candidats ; son rang décidera de tout." },
  { id: "jp-examens", a: [17, 17], cc: ["JP"], y: [1950, 2100], is: "secondary", once: 1, sure: 1, txt: "Passe les examens d’entrée à l’université ; sa mère a acheté un porte-bonheur au sanctuaire." },
  { id: "matura", a: [17, 17], cc: ["DE", "AT", "CH", "PL", "CZ", "SK", "HU", "IT", "HR", "SI", "RS"], y: [1950, 2100], is: "secondary", once: 1, sure: 1, txt: "Passe les épreuves de fin de lycée ; le soir, toute la classe fête le diplôme jusqu’à l’aube." },
  { id: "premier-universite", a: [18, 50], is: "firstgen", once: 1, hl: 1, sure: 1, txt: "Devient {le premier|la première} de la famille à aller à l’université ; ses parents le racontent à tout le monde.", fx: { happy: 3 } },
]);

// --- Enfance -----------------------------------------------------------------------------
scenes("Enfance", "life", [
  { id: "foot-chiffons", a: [6, 14], t: [0, 2], txt: ["Joue au foot dans la rue avec un ballon de chiffons et de sacs plastique.", "Joue au foot pieds nus sur un terrain de terre ; les buts sont deux tongs posées par terre."] },
  { id: "foot-club", a: [6, 14], t: [2, 5], g: [8000, 1e9], txt: "S’inscrit au club de foot du quartier ; les parents crient plus fort que l’entraîneur." },
  { id: "velo", a: [5, 11], t: [1, 3], y: [1920, 2100], once: 1, txt: "Reçoit un vélo, d’occasion mais repeint : le plus beau cadeau de son enfance.", fx: { happy: 2 } },
  { id: "manguier", a: [5, 12], cc: ["@tropics"], once: 1, txt: "Tombe du manguier en voulant attraper le plus beau fruit ; un bras dans le plâtre pour six semaines.", fx: { health: -1 } },
  { id: "garde-petits", a: [7, 14], t: [0, 2], is: "youngsib", txt: "Garde {fratrie} toute la journée pendant que les parents travaillent ; a déjà des responsabilités d’adulte." },
  { id: "dispute-fratrie", a: [5, 15], t: [2, 5], y: [1975, 2100], is: "sibs", txt: "Se dispute avec {fratrie} pour la télécommande ; les parents confisquent la télévision." },
  { id: "grands-parents-ete", a: [5, 13], cc: ["FR", "IT", "ES", "PT", "BE"], y: [1950, 2100], txt: "Passe les grandes vacances chez ses grands-parents, à la campagne : les vélos, les cousins, les orages." },
  { id: "colo", a: [7, 14], cc: ["FR"], y: [1950, 2100], t: [2, 4], txt: "Part en colonie de vacances ; écrit une carte par semaine, et pleure le jour du retour." },
  { id: "camp-ete", a: [8, 15], cc: ["US", "CA"], t: [3, 5], y: [1950, 2100], txt: "Passe l’été dans un camp au bord d’un lac : canoë, feux de camp, et des chansons ridicules." },
  { id: "roadtrip", a: [6, 16], cc: ["US", "CA", "AU"], t: [3, 5], y: [1955, 2100], txt: "Traverse le pays en voiture avec la famille, à l’arrière, en comptant les plaques d’immatriculation." },
  { id: "console", a: [8, 18], t: [3, 5], y: [1985, 2100], txt: "Passe des heures sur sa console de jeux ; son record ne tient que jusqu’au dimanche suivant." },
  { id: "salle-jeux", a: [9, 17], t: [1, 3], g: [3000, 20000], y: [1995, 2015], txt: "Économise ses pièces pour jouer aux jeux vidéo dans la salle du quartier, à l’heure." },
  { id: "cinema", a: [6, 14], y: [1915, 2100], t: [1, 5], once: 1, txt: "Va au cinéma pour la première fois ; n’en dort pas de la nuit." },
  { id: "cinema-ambulant", a: [6, 14], u: 0, t: [0, 2], y: [1950, 2010], once: 1, txt: "Un cinéma ambulant tend un drap blanc sur la place du village : tout le monde vient voir le film, assis par terre." },
  { id: "radio-famille", a: [4, 15], y: [1925, 1965], t: [2, 5], once: 1, txt: "Le soir, la famille se réunit autour du poste de radio pour écouter les nouvelles et les feuilletons." },
  { id: "tele-voisins", a: [4, 15], y: [1950, 1980], t: [1, 3], once: 1, txt: "La seule télévision de la rue est chez les voisins : le soir, on s’y entasse à vingt devant l’écran." },
  { id: "travail-enfant", a: [10, 14], t: [0, 0], is: "unschooled", kind: "work", txt: "À {age} ans, travaille déjà comme un adulte, du lever au coucher du soleil." },
  { id: "feux-rouges", a: [8, 14], u: 1, t: [0, 0], r: ["LAT", "SAS", "SSA"], is: "unschooled", kind: "work", txt: "Vend des chewing-gums aux feux rouges ; apprend à lire l’humeur des conducteurs mieux que les lettres." },
  { id: "decharge", a: [8, 40], u: 1, t: [0, 0], g: [0, 10000], y: [1960, 2100], kind: "work", txt: "Trie les déchets de la décharge pour revendre le plastique et le métal ; l’odeur ne part jamais vraiment.", fx: { health: -1 } },
  { id: "zabbaleen", a: [8, 60], cc: ["EG"], u: 1, t: [0, 1], w: 0.4, kind: "work", txt: "Trie les ordures de la ville avec sa famille, comme tout le quartier des chiffonniers du Caire." },
  { id: "briqueterie", a: [8, 40], cc: ["IN", "PK", "NP", "BD"], u: 0, t: [0, 0], heavy: 1, kind: "work", txt: "Moule des briques avec ses parents dans une briqueterie, pour rembourser une dette qui ne diminue jamais.", fx: { health: -2, happy: -2 } },
  { id: "cobalt", a: [10, 40], cc: ["CD"], t: [0, 0], y: [2005, 2100], heavy: 1, kind: "work", txt: "Creuse dans une mine artisanale de cobalt, sans casque ni masque ; le minerai finira dans des batteries de téléphones.", fx: { health: -2 } },
  { id: "orpaillage", a: [10, 40], cc: ["ML", "BF", "GH", "GN", "NE", "SD", "CI"], t: [0, 1], u: 0, y: [1980, 2100], kind: "work", txt: "Part chercher de l’or sur un site d’orpaillage ; on creuse des puits étroits, et on espère.", fx: { health: -1 } },
  { id: "talibe", a: [5, 14], cc: ["SN", "ML", "GM", "GN", "MR"], sex: "m", t: [0, 0], heavy: 1, txt: "Est confié à un maître coranique ; chaque matin, il mendie dans la rue avec une boîte de conserve.", fx: { happy: -3, health: -1 } },
  { id: "restavek", a: [6, 14], cc: ["HT"], t: [0, 0], heavy: 1, txt: "Est envoyé{|e} vivre chez une famille de la ville comme restavèk : le ménage contre un toit, sans école.", fx: { happy: -4 } },
  { id: "petite-bonne", a: [8, 15], sex: "f", t: [0, 0], cc: ["MA", "BJ", "TG", "CI", "SN", "ID", "PH", "BD", "GT", "PE", "BO"], heavy: 1, kind: "work", txt: "Est placée comme petite bonne chez une famille aisée ; elle envoie son maigre salaire à ses parents.", fx: { happy: -3 } },
  { id: "naadam", a: [5, 12], cc: ["MN"], u: 0, once: 1, kind: "culture", txt: "Court la course de chevaux du Naadam, sur des kilomètres de steppe, comme les autres enfants jockeys." },
]);

// --- Adolescence -----------------------------------------------------------------------------
scenes("Adolescence", "life", [
  { id: "reseaux-nuit", a: [13, 19], t: [2, 5], y: [2012, 2100], txt: "Passe ses nuits sur les réseaux sociaux ; le matin, les yeux piquent en classe." },
  { id: "sms", a: [13, 19], t: [2, 5], y: [2000, 2011], txt: "Envoie des dizaines de SMS par jour, en abrégeant tous les mots pour économiser le forfait." },
  { id: "cassette", a: [12, 18], t: [2, 5], y: [1970, 2000], txt: "Enregistre des chansons à la radio sur une cassette, en pestant contre l’animateur qui parle par-dessus." },
  { id: "beatles", a: [12, 20], r: ["EUR", "NAM", "OCE"], t: [2, 5], y: [1963, 1970], txt: "Écoute les Beatles en boucle sur le tourne-disque familial, jusqu’à rayer le vinyle." },
  { id: "disques-os", a: [14, 25], cc: ["@ussr"], y: [1950, 1970], kind: "culture", txt: "Écoute du rock’n’roll gravé sur de vieilles radiographies, les « disques sur os », vendus sous le manteau." },
  { id: "kpop", a: [10, 22], y: [2010, 2100], t: [2, 5], r: ["EAS", "LAT", "SAS"], kind: "culture", txt: "Apprend par cœur les chorégraphies d’un groupe de K-pop, et quelques mots de coréen." },
  { id: "afrobeats", a: [12, 25], cc: ["NG", "GH", "KE", "CI", "CM", "ZA"], y: [2010, 2100], kind: "culture", txt: "Danse sur les derniers tubes d’afrobeats, ceux que le monde entier finira par écouter." },
  { id: "fela", a: [14, 30], cc: ["NG"], y: [1970, 1997], kind: "culture", txt: "Écoute Fela en boucle ; sa musique dit tout haut ce que le pays pense tout bas." },
  { id: "rai", a: [14, 25], cc: ["DZ", "MA", "TN"], y: [1985, 2100], kind: "culture", txt: "Écoute du raï sur des cassettes qui passent de main en main, le volume au minimum quand le père est là." },
  { id: "reggaeton", a: [12, 25], cc: ["@hisp"], y: [2004, 2100], kind: "culture", txt: "Danse sur du reggaeton à toutes les fêtes ; les parents trouvent les paroles scandaleuses." },
  { id: "bollywood-chansons", a: [10, 25], cc: ["IN", "PK", "BD", "NP"], y: [1950, 2100], kind: "culture", txt: "Connaît par cœur toutes les chansons du dernier film de Bollywood." },
  { id: "dispute-porte", a: [13, 17], t: [2, 5], is: "parent", txt: "Claque la porte de sa chambre ; les parents ne comprennent rien, évidemment." },
  { id: "atelier-oncle", a: [13, 17], t: [0, 1], is: "!student", kind: "work", txt: "Apprend un métier à l’atelier d’un oncle, en regardant faire plus qu’en écoutant." },
  { id: "quinceanera", a: [15, 15], sex: "f", cc: ["@hisp"], o: 1, t: [1, 5], sure: 1, once: 1, hl: 1, kind: "culture", txt: "Fête ses quinze ans : la quinceañera, la robe, la valse avec son père, et tout le quartier invité." },
  { id: "quince-simple", a: [15, 15], sex: "f", cc: ["@hisp"], o: 1, t: [0, 0], sure: 1, once: 1, kind: "culture", txt: "Pas d’argent pour une grande quinceañera ; sa mère lui coud une robe, et les voisins apportent le gâteau." },
  { id: "bar-mitsva", a: [13, 13], sex: "m", cc: ["IL"], o: 1, sure: 1, once: 1, kind: "culture", txt: "Fait sa bar-mitsva : lit la Torah devant toute la famille, la voix qui tremble." },
  { id: "bat-mitsva", a: [12, 12], sex: "f", cc: ["IL"], o: 1, sure: 1, once: 1, kind: "culture", txt: "Fait sa bat-mitsva entourée de toute la famille ; la fête dure jusqu’à minuit." },
  { id: "seijin", a: [20, 20], cc: ["JP"], o: 1, y: [1948, 2100], sure: 1, once: 1, kind: "culture", txt: "Fête le Jour de la majorité {en costume|en kimono}, avec toute sa promotion, devant la mairie." },
  { id: "novice", a: [10, 20], sex: "m", cc: ["TH", "MM", "LA", "KH"], o: 1, once: 1, kind: "culture", txt: "Passe trois mois au monastère comme novice, crâne rasé, robe safran ; sa mère en est fière.", fx: { happy: 1 } },
  { id: "permis", a: [17, 24], g: [20000, 1e9], t: [3, 5], y: [1950, 2100], once: 1, txt: ["Passe son permis de conduire du premier coup.", "Rate son permis de conduire une première fois, à cause d’un créneau ; l’obtient la seconde."] },
  { id: "job-ete", a: [15, 18], cc: ["US", "CA", "AU", "NZ", "GB"], y: [1960, 2100], t: [2, 4], kind: "work", txt: "Travaille l’été dans un fast-food pour s’acheter une voiture d’occasion.", fx: { gain: 0.02 } },
  { id: "bal-promo", a: [17, 17], cc: ["US", "CA"], y: [1950, 2100], is: "secondary", once: 1, txt: "Va au bal de fin d’année du lycée ; les photos, plus tard, feront beaucoup rire." },
  { id: "premier-salaire", a: [14, 35], is: "firstjob employee", once: 1, kind: "work", txt: "Touche son premier salaire et invite toute la famille à manger." },
  { id: "premier-salaire-mere", a: [14, 35], is: "firstjob employee mother", once: 1, kind: "work", txt: "Avec son premier salaire, achète un cadeau à sa mère ; elle le garde des années sans oser s’en servir." },
  { id: "service-militaire", a: [18, 21], sex: "m", once: 1, hl: 1, cy: { FR: [1905, 1996], DE: [1956, 2010], IT: [1900, 2004], ES: [1900, 2001], PT: [1911, 2004], BE: [1909, 1993], NL: [1900, 1996], GB: [1947, 1960], RU: [1925, 2100], UA: [1992, 2100], BY: [1992, 2100], TR: [1900, 2100], GR: [1900, 2100], CY: [1964, 2100], AT: [1955, 2100], CH: [1900, 2100], FI: [1919, 2100], NO: [1900, 2100], SE: [1901, 2010], DK: [1900, 2100], EG: [1950, 2100], IR: [1925, 2100], VN: [1960, 2100], TW: [1950, 2100], SG: [1967, 2100], AM: [1992, 2100], AZ: [1992, 2100], GE: [1992, 2100], DZ: [1969, 2100], TN: [1959, 2100], MA: [1966, 2006], PL: [1918, 2008], CZ: [1918, 2004], HU: [1900, 2004], RO: [1900, 2006], BG: [1900, 2007], RS: [1945, 2010], UZ: [1992, 2100], KZ: [1992, 2100] }, txt: "Fait son service militaire : des mois loin de chez soi, les cheveux ras, et des amitiés pour la vie.", fx: { rel: 1 } },
  { id: "service-kr", a: [19, 23], sex: "m", cc: ["KR"], y: [1950, 2009], once: 1, hl: 1, txt: "Fait près de deux ans de service militaire, comme tous les hommes du pays ; on en reparlera toute sa vie." },
  { id: "service-kr-kpop", a: [19, 23], sex: "m", cc: ["KR"], y: [2010, 2100], once: 1, hl: 1, txt: "Fait son service militaire, dix-huit mois comme tous les hommes du pays ; même les stars de la K-pop y passent." },
  { id: "service-il", a: [18, 18], cc: ["IL"], y: [1949, 2100], once: 1, sure: 1, hl: 1, txt: "Part pour le service militaire, comme presque tous les jeunes du pays, garçons et filles." },
  { id: "service-kp", a: [17, 17], sex: "m", cc: ["KP"], once: 1, sure: 1, hl: 1, txt: "Part pour un service militaire qui durera près de dix ans." },
  { id: "service-mx", a: [18, 18], sex: "m", cc: ["MX"], y: [1942, 2100], once: 1, txt: "Fait son service militaire national le samedi matin, pour obtenir la précieuse « cartilla »." },
  { id: "service-br", a: [18, 18], sex: "m", cc: ["BR"], y: [1940, 2100], once: 1, txt: "S’inscrit pour le service militaire à dix-huit ans ; comme la plupart des jeunes, il en est dispensé." },
]);

// --- Études supérieures ---------------------------------------------------------------------
scenes("Études supérieures", "edu", [
  { id: "bu", a: [18, 26], is: "uni", txt: "Découvre la bibliothèque universitaire et y passe ses soirées.", fx: { know: 2 } },
  { id: "job-etudiant", a: [18, 26], is: "uni", t: [0, 2], kind: "work", txt: "Travaille la nuit pour payer ses études ; s’endort parfois en cours." },
  { id: "pret-etudiant", a: [18, 22], cc: ["US"], y: [1980, 2100], is: "uni", once: 1, kind: "money", txt: "Signe un prêt étudiant ; la dette {le|la} suivra pendant vingt ans.", fx: { debt: 0.5 } },
  { id: "dortoir-cn", a: [18, 22], cc: ["CN"], is: "uni", once: 1, txt: "Partage une chambre à six lits superposés sur le campus ; les amitiés se nouent tard dans la nuit." },
  { id: "resto-u", a: [18, 24], cc: ["FR"], is: "uni", y: [1955, 2100], txt: "Mange au restaurant universitaire pour quelques pièces ; le plat du jour est un sujet de conversation." },
  { id: "amphi-bonde", a: [18, 24], g: [0, 25000], is: "uni", txt: "Suit les cours dans un amphithéâtre bondé, assis{|e} sur les marches, faute de place." },
  { id: "greve-profs", a: [18, 25], is: "uni", g: [0, 25000], r: ["SSA", "LAT", "MENA"], y: [1960, 2100], txt: "Les professeurs sont en grève ; l’année universitaire s’allonge de six mois." },
  { id: "bourse-etranger", a: [19, 25], is: "uni", t: [0, 2], g: [0, 20000], once: 1, txt: "Décroche une bourse pour étudier un semestre à l’étranger ; c’est son premier voyage en avion.", fx: { know: 3, happy: 4 } },
  { id: "erasmus", a: [19, 24], cc: ["@eu"], y: [1988, 2100], is: "uni", once: 1, txt: "Part un an en Erasmus ; revient avec des amis dans six pays et un autre regard sur le sien.", fx: { know: 2, happy: 3 } },
  { id: "erasmus-est", a: [19, 24], cc: ["@eueast"], y: [1998, 2100], is: "uni", once: 1, txt: "Part un an en Erasmus, à l’Ouest ; découvre que les étudiants s’y plaignent des mêmes choses.", fx: { know: 2, happy: 3 } },
  { id: "diplome-chomage", a: [22, 30], is: "degree jobless", r: ["MENA", "SSA", "SAS"], txt: "Diplômé{|e}, sans emploi, passe ses journées au café avec d’autres diplômés ; on attend un concours de la fonction publique.", fx: { happy: -3 } },
  { id: "hittiste", a: [20, 35], cc: ["DZ"], y: [1988, 2100], is: "jobless", sex: "m", txt: "Rejoint les « hittistes », ceux qui tiennent les murs du quartier faute de travail.", fx: { happy: -2 } },
  { id: "these", a: [23, 30], is: "degree s:tech,pub,serv", t: [2, 5], once: 1, w: 0.3, txt: "Commence une thèse ; personne dans la famille ne comprend vraiment le sujet.", fx: { know: 4 } },
]);

// --- Travail -------------------------------------------------------------------------------
scenes("Aux champs", "work", [
  { id: "aube-champs", a: [12, 80], is: "j:farmer,farmhand", txt: "Se lève avant l’aube pour aller aux champs ; le travail s’arrête quand la lumière tombe." },
  { id: "pluie-semis", a: [12, 80], is: "j:farmer,farmhand", g: [0, 12000], txt: "Guette le ciel avec tout le village ; quand la pluie arrive enfin, on sème le jour même." },
  { id: "bonne-recolte", a: [16, 80], is: "j:farmer,farmhand", txt: "Une récolte exceptionnelle : on rembourse les dettes de l’année et on achète des tôles neuves.", fx: { happy: 3, gain: 0.08 } },
  { id: "maigre-recolte", a: [16, 80], is: "j:farmer,farmhand", g: [0, 20000], txt: "La récolte est maigre ; il faudra serrer la ceinture jusqu’à la prochaine.", fx: { happy: -3, cost: 0.04 } },
  { id: "mousson-retard", a: [12, 80], is: "j:farmer,farmhand", cc: ["@monsoon"], txt: "La mousson est en retard ; les semis attendent, et les prêteurs se frottent les mains.", fx: { happy: -2 } },
  { id: "riz-repique", a: [12, 70], is: "j:farmer,farmhand", cc: ["@rice"], g: [0, 20000], txt: "Repique le riz à la main, les pieds dans l’eau, le dos courbé du matin au soir." },
  { id: "tracteur", a: [25, 70], is: "j:farmer", t: [2, 4], y: [1950, 2100], once: 1, txt: "Achète un tracteur d’occasion en commun avec trois voisins ; on se dispute déjà le calendrier.", fx: { cost: 0.1, happy: 2 } },
  { id: "dossiers-pac", a: [25, 75], is: "s:agri self", cc: ["@eu", "@eueast"], y: [1965, 2100], txt: "Remplit des dossiers de subventions agricoles plus épais que l’annuaire." },
  { id: "prix-lait", a: [25, 75], is: "s:agri", cc: ["FR", "DE", "IE", "NL", "BE", "DK", "PL", "AT"], y: [1985, 2100], txt: "Le prix du lait baisse encore ; l’exploitation tient grâce aux subventions et aux heures que personne ne compte.", fx: { happy: -2 } },
  { id: "moissonneuse-gps", a: [25, 75], is: "j:farmer", cc: ["US", "CA", "AU", "NZ", "AR"], y: [2005, 2100], txt: "Une moissonneuse guidée par satellite fait le travail de cent personnes ; la ferme compte trois salariés." },
  { id: "cafe-haut", a: [18, 75], is: "j:farmer,farmhand", cc: ["ET", "CO", "BR", "VN", "UG", "HN", "GT", "PE", "KE", "RW", "BI", "NI", "CR", "SV", "MX", "ID", "TZ"], txt: "Le prix du café remonte : on rachète une vache et on répare le toit.", fx: { gain: 0.05, happy: 2 } },
  { id: "cafe-bas", a: [18, 75], is: "j:farmer,farmhand", cc: ["ET", "CO", "BR", "VN", "UG", "HN", "GT", "PE", "KE", "RW", "BI", "NI", "CR", "SV", "MX", "ID", "TZ"], txt: "Le prix du café s’effondre sur les marchés mondiaux ; la récolte de l’année vaut moins que les engrais.", fx: { cost: 0.03, happy: -3 } },
  { id: "cacao-bas", a: [18, 75], is: "j:farmer,farmhand", cc: ["CI", "GH", "CM", "NG"], y: [1960, 2023], txt: "Le prix du cacao payé aux planteurs baisse encore ; le travail d’une année ne paie presque rien.", fx: { happy: -2 } },
  { id: "cacao-haut", a: [18, 75], is: "j:farmer,farmhand", cc: ["CI", "GH", "CM", "NG"], ys: [2024, 2025], once: 1, txt: "Le prix du cacao s’envole sur les marchés mondiaux ; pour une fois, une part arrive jusqu’aux planteurs.", fx: { gain: 0.05, happy: 2 } },
  { id: "elephants", a: [12, 80], is: "j:farmer,farmhand", u: 0, cc: ["KE", "TZ", "ZM", "ZW", "BW", "NA", "MZ", "LK", "IN"], txt: "Des éléphants ravagent le champ de maïs en une nuit ; on veillera désormais avec des tambours et des clôtures au piment.", fx: { happy: -2, cost: 0.03 } },
  { id: "criquets", a: [10, 80], is: "s:agri", cc: ["@sahel", "@horn", "SD", "YE", "PK"], txt: "Un nuage de criquets s’abat sur les champs ; en une après-midi, il ne reste plus rien.", fx: { happy: -4, cost: 0.05 } },
  { id: "secheresse-champs", a: [10, 80], is: "j:farmer,farmhand", cc: ["@drought"], g: [0, 20000], txt: "La sécheresse grille les champs ; le maïs ne dépasse pas les genoux.", fx: { happy: -3, cost: 0.04 } },
  { id: "terres-promoteur", a: [30, 80], is: "j:farmer", u: 0, g: [5000, 35000], y: [1985, 2100], txt: "Le voisin vend ses terres à un promoteur ; la ville avance vers le village, une rangée d’immeubles à la fois." },
  { id: "saisonnier", a: [18, 50], is: "s:agri !self", cy: { MA: [1990, 2100], RO: [2000, 2100], BG: [2007, 2100], PL: [1990, 2100], MX: [1974, 2100], GT: [2003, 2100], JM: [1966, 2100], UA: [2000, 2100], MD: [2000, 2100] }, txt: "Part chaque été faire les récoltes à l’étranger, sous contrat saisonnier ; rentre avec de quoi tenir l’hiver.", fx: { gain: 0.08, rel: -1 } },
  { id: "transhumance", a: [10, 70], is: "j:herder", cc: ["@sahel", "@horn", "MN", "AF", "KG", "TZ", "SD"], txt: "Suit le troupeau vers les pâturages de saison sèche : des semaines de marche, et des nuits sous les étoiles." },
  { id: "betes-banque", a: [16, 80], is: "j:herder,farmer", u: 0, r: ["SSA", "SAS", "MENA"], txt: "Compte ses bêtes chaque soir : c’est sa banque, son assurance et sa fierté." },
  { id: "dzud", a: [10, 80], cc: ["MN"], u: 0, ys: [2000, 2001, 2002, 2010, 2016, 2023, 2024], once: 1, txt: "Un dzud, un hiver extrême après un été sec : une grande partie du troupeau meurt de froid et de faim.", fx: { happy: -6, herd: -0.5 } },
  { id: "chalutiers", a: [16, 70], is: "j:fisher", cc: ["SN", "MR", "GM", "GN", "SL", "GH", "SO", "MG", "MZ", "LR"], y: [1980, 2100], txt: "Rentre de mer avec les filets presque vides : au large, les chalutiers industriels ont tout raclé.", fx: { happy: -2 } },
  { id: "tempete-port", a: [16, 70], is: "j:fisher", txt: "Une tempête cloue les bateaux au port pendant deux semaines ; on répare les filets en attendant." },
  { id: "peche-miraculeuse", a: [16, 70], is: "j:fisher", txt: "Une pêche miraculeuse : le bateau rentre si chargé qu’il frôle l’eau, et tout le village aide à décharger.", fx: { gain: 0.04, happy: 2 } },
]);

scenes("Économie informelle", "work", [
  { id: "marche-4h", a: [12, 75], is: "j:market", txt: "Arrive au marché à quatre heures du matin pour avoir une bonne place ; repart quand les lampes s’allument." },
  { id: "saisie-mairie", a: [16, 75], is: "j:market", u: 1, txt: "Les agents de la mairie saisissent la marchandise des vendeurs de rue ; il faudra tout racheter à crédit.", fx: { happy: -3, cost: 0.03 } },
  { id: "chef-marche", a: [16, 75], is: "j:market", txt: "Paie chaque jour quelques pièces au « chef » du marché pour garder son emplacement." },
  { id: "cliente-fidele", a: [20, 75], is: "j:market,seller,tailor,hairdresser", txt: "Une cliente fidèle depuis dix ans vient avec sa fille ; on se connaît, on se fait crédit.", fx: { rel: 1 } },
  { id: "beignets-ecole", a: [16, 75], is: "j:market", r: ["SSA"], sex: "f", txt: "Vend des beignets et de la bouillie devant l’école ; les enfants l’appellent « tantie ».", fx: { rel: 1 } },
  { id: "domestique-chambre", a: [14, 70], is: "j:domestic", txt: "Travaille six jours sur sept chez une famille aisée et dort dans une petite chambre au fond de la cour." },
  { id: "domestique-enfants", a: [20, 60], is: "j:domestic kids", txt: "Élève les enfants des autres pendant que les siens grandissent chez leur grand-mère.", fx: { rel: -2 } },
  { id: "porteur-charge", a: [14, 60], is: "j:porter", txt: "Porte des sacs de quatre-vingts kilos sur le dos, du marché aux camions ; le soir, les épaules brûlent.", fx: { health: -1 } },
  { id: "porteur-himalaya", a: [16, 55], is: "j:porter", cc: ["NP"], txt: "Porte les sacs des randonneurs sur les sentiers de l’Himalaya ; les pourboires valent plus que le salaire." },
  { id: "couture-fetes", a: [16, 75], is: "j:tailor", txt: "Avant les fêtes, coud des tenues de cérémonie jusqu’à tard dans la nuit, sous une ampoule nue." },
  { id: "moto-frayeur", a: [16, 65], is: "j:mototaxi", txt: "Évite de justesse un camion à l’heure de pointe ; reprend la route, les mains qui tremblent." },
  { id: "moto-police", a: [16, 65], is: "j:mototaxi", txt: "Un policier arrête sa moto ; sans « petit billet », elle part à la fourrière.", fx: { cost: 0.01, happy: -1 } },
  { id: "boda", a: [16, 65], is: "j:mototaxi", cc: ["UG", "KE", "TZ", "RW"], txt: "Attend les clients au carrefour avec les autres boda-boda ; chacun a son surnom, ses habitués, et son autocollant sur le garde-boue." },
  { id: "okada", a: [16, 65], is: "j:mototaxi", cc: ["NG"], txt: "Faufile son okada entre les voitures arrêtées ; les clients pressés paient double." },
  { id: "zemidjan", a: [16, 65], is: "j:mototaxi", cc: ["BJ", "TG"], txt: "Conduit un zémidjan en chemise jaune ; on {le|la} hèle d’un sifflement au bord de la route." },
  { id: "reparateur", a: [16, 65], is: "j:phonefix", txt: "Répare des téléphones dans une échoppe grande comme une armoire ; tout le quartier lui confie ses écrans fêlés." },
  { id: "journalier", a: [16, 60], is: "jobless", u: 1, g: [0, 25000], r: ["LAT", "SAS", "MENA", "SSA"], txt: "Attend chaque matin au carrefour des journaliers, en espérant qu’une camionnette s’arrête pour {lui|elle}." },
  { id: "petits-boulots", a: [18, 60], is: "jobless", g: [0, 20000], txt: "Sans emploi, enchaîne les petits boulots à la journée : décharger des sacs, porter des briques, aider aux récoltes." },
]);

scenes("Usines et chantiers", "work", [
  { id: "confection", a: [14, 50], is: "j:textile,factory", cc: ["BD", "KH", "VN", "MM", "PK", "LK", "IN", "ET"], y: [1980, 2100], txt: "Coud à la chaîne, douze heures par jour, des vêtements pour des marques qu’{il|elle} ne pourra jamais s’offrir." },
  { id: "dortoir-usine", a: [16, 40], is: "j:factory,textile", cc: ["CN"], y: [1990, 2025], txt: "Travaille dans une usine d’électronique de la côte et dort au dortoir de l’entreprise, à huit par chambre." },
  { id: "maquiladora", a: [16, 50], is: "j:factory,textile", cc: ["MX"], y: [1970, 2100], txt: "Travaille dans une maquiladora près de la frontière, à assembler des pièces qui partiront aux États-Unis." },
  { id: "sirene", a: [16, 65], is: "s:ind", y: [1900, 1990], txt: "La sirène de l’usine rythme les journées de toute la ville ; on règle sa montre sur elle." },
  { id: "greve-usine", a: [18, 65], is: "s:ind employee", y: [1905, 2100], txt: "Grève à l’usine : trois semaines sans salaire, des soupes collectives, puis une petite augmentation.", fx: { rel: 2, happy: -1 } },
  { id: "robots", a: [25, 65], is: "s:ind", g: [20000, 1e9], y: [1985, 2100], txt: "Les robots arrivent sur la chaîne ; à la cantine, on se demande qui restera." },
  { id: "delocalisation", a: [30, 64], is: "s:ind", g: [20000, 1e9], r: ["EUR", "NAM"], y: [1975, 2015], txt: "Des rumeurs de délocalisation courent dans les ateliers ; certaines machines sont déjà parties en Asie.", fx: { happy: -2 } },
  { id: "echafaudage", a: [16, 60], is: "j:builder", g: [0, 25000], txt: "Monte sur des échafaudages en bambou, sans harnais, à trente mètres du sol." },
  { id: "chantier-tours", a: [18, 60], is: "j:builder", u: 1, txt: "Construit des immeubles où {il|elle} ne pourra jamais habiter." },
  { id: "mine-poumons", a: [16, 60], is: "j:miner", txt: "Descend chaque jour au fond de la mine ; la poussière s’installe dans les poumons.", fx: { health: -1 } },
  { id: "foyer-mineurs", a: [18, 55], is: "j:miner", cc: ["ZA", "LS", "MZ", "SZ", "BW"], y: [1910, 2010], txt: "Vit dans un foyer de mineurs, loin de sa famille, onze mois par an ; on rentre au pays à Noël." },
  { id: "mecanicien-debrouille", a: [18, 70], is: "j:mechanic", g: [0, 15000], txt: "Fait rouler des voitures que leurs constructeurs ont oubliées depuis longtemps ; ici, rien ne se jette." },
  { id: "electricien-orage", a: [18, 65], is: "j:electrician", g: [0, 12000], txt: "Rebranche les fils du quartier après chaque orage ; tout le monde a son numéro." },
  { id: "soudeur", a: [18, 65], is: "j:welder,technician", txt: "Finit ses journées les yeux rouges et les mains noires ; le travail est bien fait, et ça se voit." },
]);

scenes("Bureaux et services", "work", [
  { id: "pourboires", a: [16, 65], is: "j:waiter", cc: ["US", "CA"], txt: "Vit des pourboires plus que du salaire ; un mauvais soir, on rentre presque les mains vides." },
  { id: "coup-de-feu", a: [16, 65], is: "j:cook", txt: "Passe ses soirées dans une cuisine à 40 °C, en plein coup de feu ; le service fini, on mange debout." },
  { id: "gardien-nuit", a: [18, 70], is: "j:guard", g: [0, 25000], txt: "Veille toute la nuit devant une villa, sur une chaise en plastique, une lampe torche à la main." },
  { id: "routier", a: [20, 65], is: "j:trucker", txt: "Avale des milliers de kilomètres ; sa cabine est sa deuxième maison, avec la photo des siens scotchée au pare-soleil." },
  { id: "frontiere-camions", a: [20, 65], is: "j:trucker", r: ["SSA"], y: [1980, 2100], txt: "Attend trois jours à la frontière avec sa cargaison, dans une file de camions qui s’étire sur des kilomètres." },
  { id: "caisse", a: [16, 65], is: "j:cashier", txt: "Passe des milliers d’articles par jour devant le scanner ; le dos proteste dès le jeudi." },
  { id: "salon-coiffure", a: [18, 70], is: "j:hairdresser", txt: "Tient un petit salon où l’on vient autant pour parler que pour se faire coiffer ; on y sait tout du quartier." },
  { id: "tampons", a: [20, 65], is: "j:clerk,civil", txt: "Passe ses journées entre tampons et formulaires, au troisième étage d’un bâtiment administratif." },
  { id: "centre-appels-us", a: [18, 45], is: "j:callcenter", cc: ["PH", "IN"], y: [1998, 2100], txt: "Travaille de nuit au centre d’appels, aux heures des clients américains ; dort le jour, rideaux fermés." },
  { id: "centre-appels-fr", a: [18, 45], is: "j:callcenter", cc: ["MA", "TN", "SN", "CI", "MU", "MG"], y: [2000, 2100], txt: "Répond à des clients français depuis un centre d’appels ; on lui a attribué un prénom de là-bas." },
  { id: "objectifs", a: [22, 60], is: "j:sales,realtor", txt: "Court après les objectifs du trimestre ; le téléphone ne s’éteint jamais vraiment." },
  { id: "livreur-pluie", a: [17, 50], is: "j:courier", txt: "Pédale sous la pluie pour livrer des repas ; l’application décide de tout, même des pauses." },
  { id: "note-chauffeur", a: [20, 60], is: "j:vtc", txt: "Surveille sa note de chauffeur : en dessous de 4,6, l’application risque de {le|la} désactiver." },
  { id: "tour-verre", a: [24, 60], is: "j:banker", txt: "Travaille tard dans une tour de verre ; le bonus de fin d’année fait oublier les week-ends perdus.", fx: { rel: -1 } },
  { id: "premiere-plaidoirie", a: [24, 40], is: "j:lawyer", once: 1, txt: "Plaide sa première affaire ; ses mains tremblent sous la robe, sa voix non." },
  { id: "enquete-sensible", a: [24, 65], is: "j:journalist", g: [0, 40000], txt: "Enquête sur un sujet sensible ; on lui conseille amicalement de laisser tomber.", fx: { happy: -1 } },
  { id: "decalage", a: [25, 60], is: "j:pilot", txt: "Fait trois fois le tour du monde en un mois ; le décalage horaire devient un mode de vie." },
  { id: "viral", a: [16, 45], is: "j:creator", txt: "Une de ses vidéos devient virale ; le lendemain, il faut tout recommencer.", fx: { happy: 2 } },
  { id: "expo-cafe", a: [18, 80], is: "j:artist", txt: "Expose ses œuvres dans un café du quartier ; on en vend une, c’est une fête.", fx: { happy: 3 } },
  { id: "nomikai", a: [22, 60], is: "employee", cc: ["JP", "KR"], y: [1960, 2100], txt: "Boit avec ses collègues après le travail, chaque vendredi ; refuser serait mal vu.", fx: { health: -1, rel: 1 } },
  { id: "dernier-train", a: [22, 60], is: "employee", cc: ["JP"], u: 1, y: [1995, 2100], txt: "Rate le dernier train et dort dans un café manga, entre deux étagères de bandes dessinées." },
  { id: "neuf-neuf-six", a: [22, 45], is: "s:tech,serv employee", cc: ["CN"], y: [2012, 2100], txt: "Travaille « 996 » : de 9 heures à 21 heures, six jours sur sept.", fx: { health: -1, rel: -1 } },
  { id: "teletravail", a: [22, 64], is: "s:tech,serv employee", t: [3, 5], y: [2020, 2100], txt: "Travaille depuis la cuisine plusieurs jours par semaine ; le chat assiste à toutes les réunions." },
  { id: "collegues-famille", a: [20, 64], is: "employee", once: 1, txt: "Ses collègues deviennent une seconde famille ; on fête les naissances et on pleure les départs ensemble.", fx: { rel: 2 } },
  { id: "chef-toxique", a: [20, 64], is: "employee", txt: "Un nouveau chef rend chaque journée plus longue ; le dimanche soir a un goût amer.", fx: { happy: -3 } },
  { id: "conges-1936", a: [18, 64], cc: ["FR"], ys: [1936, 1937, 1938], is: "employee", once: 1, hl: 1, txt: "Prend ses premiers congés payés : deux semaines, un train, et la mer pour la première fois." },
  { id: "cinq-semaines", a: [20, 64], cc: ["FR", "SE", "DK", "NO", "FI", "DE", "AT", "ES"], y: [1982, 2100], is: "employee", txt: "Part cinq semaines en congé, comme chaque année ; ailleurs, beaucoup n’en reviendraient pas." },
  { id: "manif-retraites", a: [20, 64], cc: ["FR"], ys: [1995, 2003, 2010, 2019, 2023], is: "working", txt: "Manifeste contre la réforme des retraites, dans un cortège qui s’étire sur des kilomètres." },
  { id: "assurance-emploi", a: [25, 64], cc: ["US"], y: [1960, 2100], is: "employee", kind: "health", txt: "Garde un emploi qui ne lui plaît plus, pour ne pas perdre l’assurance santé de la famille.", fx: { happy: -2 } },
  { id: "deux-emplois", a: [22, 60], cc: ["US"], p: [0, 0.25], is: "working kids", txt: "Cumule deux emplois ; ne voit plus les enfants qu’endormis.", fx: { rel: -2, health: -1 } },
  { id: "salaire-retard", a: [22, 64], is: "s:pub", g: [0, 12000], txt: "Le salaire des fonctionnaires arrive avec trois mois de retard ; on vit à crédit en attendant.", fx: { happy: -2 } },
]);

scenes("Service public", "work", [
  { id: "classe-70", a: [20, 65], is: "j:teacher", g: [0, 6000], txt: "Enseigne à soixante-dix élèves avec une craie et un tableau fendu ; certains marchent deux heures pour venir." },
  { id: "copies", a: [22, 65], is: "j:teacher,professor", txt: "Corrige des copies jusqu’à minuit, un stylo rouge dans chaque main." },
  { id: "ancien-eleve", a: [35, 80], is: "j:teacher", once: 1, txt: "Un ancien élève revient lui dire merci ; il est devenu médecin.", fx: { happy: 3 } },
  { id: "hopital-manque", a: [22, 65], is: "j:nurse,doctor,carer", g: [0, 15000], txt: "À l’hôpital, il manque des gants, des médicaments, et les collègues partis travailler à l’étranger." },
  { id: "offre-hopital", a: [22, 45], is: "j:nurse", cc: ["PH", "IN", "NG", "GH", "ZW", "KE"], y: [1990, 2100], once: 1, txt: "Reçoit une offre d’un hôpital britannique ; la moitié de sa promotion est déjà partie." },
  { id: "garde-nuit", a: [22, 65], is: "j:nurse,doctor", txt: "Enchaîne les gardes de nuit ; le café de 4 heures du matin a un goût de victoire.", fx: { health: -1 } },
  { id: "urgences-couloir", a: [22, 65], is: "j:nurse,doctor,carer", g: [30000, 1e9], y: [2000, 2100], txt: "Les urgences débordent ; on soigne des patients sur des brancards, dans les couloirs." },
  { id: "dispensaire-brousse", a: [26, 65], is: "j:doctor", g: [0, 10000], txt: "Une semaine par mois, consulte dans un dispensaire de brousse ; on fait la queue depuis l’aube." },
  { id: "toilettes-matin", a: [20, 64], is: "j:carer", g: [20000, 1e9], txt: "Fait la toilette de douze personnes âgées chaque matin, en courant d’une chambre à l’autre ; certaines ne reçoivent pas d’autre visite.", fx: { rel: 1 } },
  { id: "carrefour-sifflet", a: [20, 60], is: "j:police", g: [0, 15000], txt: "Règle la circulation à un carrefour sans feux, sous le soleil, en sifflant à s’en faire mal." },
  { id: "mission-soldat", a: [18, 50], is: "j:soldier", txt: "Part en mission loin de chez soi pendant six mois ; les appels du dimanche sont courts.", fx: { rel: -1 } },
  { id: "poste-fonctionnaire", a: [22, 40], is: "j:civil", g: [0, 25000], once: 1, txt: "Obtient un poste de fonctionnaire : un salaire modeste, mais sûr jusqu’à la retraite ; on {le|la} félicite comme pour un mariage.", fx: { happy: 3 } },
]);

scenes("Sciences et technique", "work", [
  { id: "paye-dollars", a: [22, 55], is: "s:tech", g: [0, 30000], y: [2012, 2100], txt: "Travaille à distance pour une entreprise à l’autre bout du monde, payé{|e} en dollars ; les réunions sont à minuit.", fx: { gain: 0.05 } },
  { id: "nuits-courtes", a: [22, 60], is: "s:tech", txt: "Livre un projet après des semaines de nuits courtes ; personne ne remarque, sauf quand ça casse." },
  { id: "premier-article", a: [25, 40], is: "j:researcher,professor", once: 1, txt: "Publie son premier article scientifique ; ses parents l’encadrent sans le comprendre.", fx: { happy: 3, know: 2 } },
  { id: "pont-natal", a: [30, 60], is: "j:engineer", once: 1, txt: "Conçoit un pont dans sa région natale ; y passe en voiture, chaque fois, un peu plus lentement." },
  { id: "ia-rapports", a: [22, 65], is: "s:tech,serv working", t: [3, 5], y: [2026, 2100], txt: "Travaille avec une intelligence artificielle qui écrit la moitié de ses rapports ; reste à savoir quelle moitié." },
]);

scenes("À son compte", "work", [
  { id: "horaires-patron", a: [18, 75], is: "business", txt: "Ouvre la boutique à 6 heures, la ferme à 22 heures : c’est ça, être son propre patron." },
  { id: "client-mauvais-payeur", a: [18, 75], is: "business", txt: "Un gros client ne paie pas ; la trésorerie vacille tout l’hiver.", fx: { happy: -3 } },
  { id: "premier-salarie", a: [20, 75], is: "business", once: 1, txt: "Embauche son premier salarié ; découvre ce que c’est que de payer quelqu’un avant soi.", fx: { happy: 2 } },
  { id: "enveloppes", a: [20, 75], is: "business", g: [0, 20000], txt: "Chaque inspecteur qui passe repart avec une enveloppe ; c’est compté dans les frais.", fx: { cost: 0.02 } },
  { id: "renta", a: [18, 75], is: "business", cc: ["SV", "HN", "GT"], y: [1995, 2100], heavy: 1, txt: "Les maras exigent la « renta » chaque semaine pour laisser la boutique ouverte.", fx: { happy: -4, cost: 0.03 } },
]);

scenes("Au foyer", "family", [
  { id: "foyer-tourner", a: [18, 70], is: "homemaker", txt: "Fait tourner la maison : les courses, les repas, les enfants, les comptes ; personne n’appelle ça un travail." },
  { id: "carnet-comptes", a: [18, 70], is: "homemaker", t: [0, 2], kind: "money", txt: "Tient les comptes du foyer dans un carnet, au centime près." },
  { id: "reprendre-travail", a: [30, 55], is: "homemaker", g: [15000, 1e9], y: [1965, 2100], txt: "Pense à reprendre un travail, maintenant que les enfants ont grandi." },
]);

// --- Trajets ---------------------------------------------------------------------------------
scenes("Trajets", "life", [
  { id: "embouteillages", a: [18, 65], u: 1, cc: ["@mega"], y: [1980, 2100], is: "working !s:agri", txt: "Passe deux heures par jour dans les embouteillages ; on apprend à dormir assis, à manger debout, à attendre." },
  { id: "metro-bonde", a: [16, 65], u: 1, cc: ["JP", "CN", "KR", "FR", "GB", "US", "RU", "IN", "BR", "MX", "DE", "ES", "IT", "EG", "TR", "SG", "HK", "TW"], y: [1950, 2100], is: "working !s:agri", txt: "Prend le métro bondé chaque matin, collé{|e} contre des inconnus qui lisent par-dessus son épaule." },
  { id: "danfo", a: [14, 70], cc: ["NG"], u: 1, txt: "Monte chaque matin dans un danfo jaune bondé ; le receveur crie les arrêts par la portière ouverte." },
  { id: "matatu", a: [14, 70], cc: ["KE"], u: 1, y: [1960, 2100], txt: "Prend un matatu peint de toutes les couleurs, musique à fond ; le chauffeur conduit comme s’il était en retard." },
  { id: "jeepney", a: [10, 70], cc: ["PH"], y: [1950, 2100], txt: "Prend le jeepney ; on fait passer sa pièce de main en main jusqu’au chauffeur." },
  { id: "rickshaw", a: [10, 70], cc: ["IN", "BD", "PK", "LK", "TH", "KH", "LA", "NP"], u: 1, y: [1960, 2100], txt: "Négocie le prix du rickshaw avant de monter, comme chaque fois ; c’est presque un sport." },
  { id: "trotro", a: [10, 70], cc: ["GH"], txt: "Monte dans un tro-tro bondé, entre un sac de riz et une cage à poules." },
  { id: "car-rapide", a: [10, 70], cc: ["SN"], u: 1, txt: "Prend un car rapide bleu et jaune, couvert d’inscriptions protectrices ; l’apprenti tape sur la carrosserie à chaque arrêt." },
  { id: "taxi-brousse", a: [10, 80], cc: ["MG", "ML", "NE", "BF", "TD", "CM", "CI", "GN", "BJ", "TG", "CF", "CG"], txt: "Voyage en taxi-brousse, quatorze dans une voiture prévue pour sept ; on part quand c’est plein." },
  { id: "marchroutka", a: [10, 80], cc: ["RU", "UA", "BY", "KZ", "KG", "UZ", "GE", "AM", "AZ", "MD"], y: [1990, 2100], txt: "Prend la marchroutka ; on fait passer l’argent du trajet de main en main jusqu’au chauffeur." },
  { id: "combi", a: [10, 80], cc: ["PE", "BO", "EC", "CO", "AR", "VE", "GT", "MX"], u: 1, txt: "Saute dans un combi qui ralentit à peine ; le rabatteur crie la destination par la fenêtre." },
  { id: "dolmus", a: [10, 80], cc: ["TR"], u: 1, txt: "Prend le dolmuş, qui part quand il est plein et s’arrête où l’on veut." },
  { id: "velo-partout", a: [6, 85], cc: ["NL", "DK"], y: [1930, 2100], txt: "Fait tout à vélo, par tous les temps ; la pluie n’est pas une excuse." },
  { id: "shinkansen", a: [8, 80], cc: ["JP"], y: [1965, 2100], t: [2, 5], once: 1, txt: "Prend le Shinkansen pour la première fois ; le paysage défile, le café ne tremble pas." },
  { id: "train-nouvel-an", a: [16, 50], cc: ["CN"], y: [1985, 2030], is: "j:factory,builder,textile,domestic,courier,cook,waiter", kind: "move", txt: "Prend le train du Nouvel An : trente heures debout pour rentrer au village, des sacs de cadeaux entre les jambes." },
  { id: "chuseok", a: [10, 80], cc: ["KR"], y: [1970, 2100], kind: "culture", txt: "Rentre au village pour Chuseok, dans des bouchons de dix heures ; on salue les ancêtres et on mange des songpyeon." },
  { id: "moto-famille", a: [20, 50], cc: ["VN", "ID", "TH", "KH", "IN", "MY", "LA", "TW"], t: [2, 3], y: [1990, 2100], once: 1, txt: "Achète une moto à crédit : désormais, toute la famille tient dessus, à quatre, avec les courses." },
  { id: "premiere-voiture", a: [20, 60], t: [3, 4], g: [0, 35000], y: [1950, 2100], once: 1, txt: "La famille s’offre sa première voiture, d’occasion ; on part le dimanche, juste pour rouler.", fx: { happy: 3 } },
  { id: "voiture-electrique", a: [25, 75], t: [4, 5], y: [2030, 2100], once: 1, txt: "Achète une voiture électrique ; on la branche le soir, comme un téléphone." },
  { id: "premier-train", a: [5, 40], once: 1, t: [0, 2], not: ["@norail", "#OCE"], txt: "Prend le train pour la première fois ; colle son front à la vitre pendant tout le trajet." },
  { id: "premier-avion", a: [5, 60], once: 1, y: [1960, 2100], t: [3, 5], txt: "Prend l’avion pour la première fois ; serre l’accoudoir au décollage, puis ne quitte plus le hublot des yeux." },
]);

// --- Argent au quotidien -------------------------------------------------------------------
scenes("Argent au quotidien", "money", [
  { id: "compter-pieces", a: [18, 85], t: [0, 0], gap: 20, txt: ["Compte chaque pièce avant d’aller au marché ; tout se calcule, même le sel.", "Noue ses quelques billets dans un coin de son pagne ou de sa poche intérieure ; ils doivent tenir jusqu’à la fin de la semaine."] },
  { id: "journee-malade", a: [18, 70], t: [0, 1], is: "working", txt: "Une journée de maladie, c’est une journée sans revenu ; on va travailler avec la fièvre.", fx: { health: -1 } },
  { id: "chaussures-mois", a: [10, 70], t: [1, 1], txt: "Économise des mois pour une paire de chaussures neuves, qu’on cire chaque dimanche." },
  { id: "bipe", a: [12, 70], t: [0, 2], g: [0, 15000], y: [2002, 2016], txt: "Fait durer le crédit du téléphone : on « bipe » pour que l’autre rappelle." },
  { id: "recharge-voisin", a: [12, 70], t: [0, 1], u: 0, r: ["SSA"], y: [2008, 2100], txt: "Recharge son téléphone chez le voisin qui a un panneau solaire, contre quelques pièces." },
  { id: "second-bus", a: [18, 65], t: [1, 2], u: 1, is: "working", txt: "Marche une heure plutôt que de prendre le second bus : c’est autant de gagné pour le dîner." },
  { id: "boite-fer", a: [20, 75], t: [2, 2], txt: "Met de côté chaque mois un peu d’argent dans une boîte en fer, pour les jours difficiles." },
  { id: "frigo-credit", a: [20, 60], t: [2, 3], y: [1960, 2100], once: 1, txt: "Achète un réfrigérateur à crédit, en vingt-quatre mensualités ; l’eau fraîche en plein été, quel luxe.", fx: { happy: 2 } },
  { id: "meubles-credit", a: [22, 50], t: [2, 3], once: 1, txt: "Achète un canapé et une armoire à crédit ; on fait le tour de la maison pour les montrer aux voisins." },
  { id: "peser-depenses", a: [25, 65], t: [3, 3], is: "kids", txt: "Pèse chaque grande dépense : les études des enfants d’abord, le reste ensuite." },
  { id: "vacances-hotel", a: [20, 75], t: [3, 4], y: [1965, 2100], txt: "Passe une semaine de vacances à l’hôtel, avec piscine ; on en parle toute l’année.", fx: { happy: 3 } },
  { id: "vacances-etranger", a: [20, 80], t: [4, 5], y: [1965, 2100], is: "!retired", txt: "Part en vacances à l’étranger ; le retour au travail est rude.", fx: { happy: 3 } },
  { id: "voyage-retraite", a: [60, 90], t: [4, 5], y: [1975, 2100], is: "retired", txt: "Voyage à l’étranger avec des amis retraités ; envoie à la famille la photo de chaque repas.", fx: { happy: 3 } },
  { id: "change-voiture", a: [30, 75], t: [4, 5], y: [1960, 2100], txt: "Change de voiture ; l’ancienne n’avait que six ans." },
  { id: "renovation", a: [30, 75], t: [4, 5], is: "owner", txt: "Rénove la maison de fond en comble ; six mois de poussière, puis la fierté." },
  { id: "classe-affaires", a: [30, 85], t: [5, 5], p: [0.95, 1], y: [1975, 2100], txt: "Voyage en classe affaires ; l’avion n’a plus rien d’une aventure." },
  { id: "club-prive", a: [35, 85], t: [5, 5], p: [0.97, 1], y: [1950, 2100], txt: "Fréquente un club privé où l’on parle affaires entre deux parties de golf." },
  { id: "oeuvres-art", a: [40, 90], t: [5, 5], p: [0.98, 1], txt: "Achète des œuvres d’art, d’abord pour le plaisir, ensuite pour le placement." },
  { id: "conseiller", a: [40, 90], t: [5, 5], p: [0.95, 1], g: [25000, 1e9], txt: "Un conseiller en gestion de patrimoine l’appelle par son prénom." },
  { id: "don-ecole", a: [50, 95], t: [5, 5], p: [0.98, 1], once: 1, txt: "Fait un don important à son ancienne école ; une salle porte désormais son nom.", fx: { happy: 2, cost: 0.5 } },
  { id: "fin-mois", a: [20, 75], p: [0, 0.2], g: [20000, 1e9], txt: "Les fins de mois commencent le 15 ; on surveille le compte comme le lait sur le feu.", fx: { happy: -2 } },
  { id: "dentiste-cher", a: [25, 85], p: [0, 0.3], g: [20000, 1e9], kind: "health", txt: "Renonce au dentiste, trop cher ; on mâche de l’autre côté.", fx: { health: -1 } },
  { id: "pas-vacances", a: [25, 60], p: [0, 0.2], g: [20000, 1e9], is: "kids", txt: "Pas de vacances cette année encore ; les enfants racontent celles des autres à la rentrée.", fx: { happy: -1 } },
  { id: "usurier", a: [20, 70], t: [0, 1], u: 0, is: "nobank", txt: "Emprunte à l’usurier du village pour acheter des semences, à un taux qui fait peur.", fx: { debt: 0.08 } },
  { id: "tontine-femmes", a: [20, 70], sex: "f", t: [0, 3], r: ["SSA"], txt: "Cotise à la tontine des femmes du quartier : chaque mois, l’une d’elles reçoit la cagnotte, et c’est une fête.", fx: { rel: 2 } },
  { id: "committee", a: [20, 70], t: [1, 3], cc: ["PK", "IN", "BD"], txt: "Participe à un « committee » entre voisines : chaque mois, une famille reçoit le pot commun.", fx: { rel: 1 } },
  { id: "microcredit", a: [20, 60], sex: "f", t: [0, 2], cc: ["BD", "IN", "BO", "PE", "KE", "UG", "PH", "KH", "MX", "NI"], y: [1983, 2100], once: 1, txt: "Obtient un microcrédit pour acheter une machine à coudre ; le remboursement se fait chaque semaine, devant tout le groupe.", fx: { debt: 0.05, happy: 2 } },
  { id: "argent-telephone", a: [16, 85], cc: ["KE", "TZ", "UG", "RW", "GH", "ZM", "ZW", "MZ", "SN", "CI"], y: [2009, 2100], once: 1, txt: "Reçoit de l’argent sur son téléphone pour la première fois : plus besoin de cacher les billets sous le matelas." },
  { id: "qr-cn", a: [10, 95], cc: ["CN"], y: [2015, 2100], once: 1, txt: "Paie le marchand de légumes en scannant un QR code ; même les musiciens de rue en ont un." },
  { id: "upi", a: [14, 95], cc: ["IN"], y: [2018, 2100], once: 1, txt: "Paie son thé au coin de la rue d’un scan de téléphone ; le vendeur a son QR code collé sur la marmite." },
  { id: "pix", a: [14, 95], cc: ["BR"], y: [2021, 2100], once: 1, txt: "Tout se paie par Pix, même le vendeur de noix de coco sur la plage." },
  { id: "euro", a: [8, 105], cc: ["@euro"], ys: [2002], once: 1, sure: 1, hl: 1, stamp: 1, txt: "Les premiers euros dans le porte-monnaie ; pendant des années, on reconvertira les prix de tête." },
  { id: "euro-tard", a: [8, 105], on: { SI: [2007], CY: [2008], MT: [2008], SK: [2009], EE: [2011], LV: [2014], LT: [2015], HR: [2023] }, once: 1, sure: 1, stamp: 1, txt: "Le pays passe à l’euro ; on reconvertit les prix de tête pendant des mois." },
  { id: "decimal-gb", a: [10, 105], on: { GB: [1971] }, once: 1, sure: 1, stamp: 1, txt: "La livre passe au système décimal ; les anciens comptent encore en shillings." },
  { id: "dollars-ar", a: [20, 85], cc: ["AR"], y: [1975, 2100], t: [2, 5], txt: "Dès que le salaire tombe, l’échange contre des dollars ; les prix, eux, changent chaque semaine." },
  { id: "liasses-ve", a: [12, 95], cc: ["VE"], y: [2016, 2020], txt: "On paie le pain avec une liasse de billets ; au marché, certains pèsent l’argent au lieu de le compter." },
  { id: "billet-zw", a: [10, 95], cc: ["ZW"], ys: [2008], once: 1, txt: "Un billet de cent mille milliards de dollars zimbabwéens ne suffit plus pour acheter le pain." },
  { id: "banques-lb", a: [20, 95], cc: ["LB"], y: [2019, 2025], is: "saver", once: 1, txt: "Les banques bloquent les dépôts ; l’épargne de toute une vie est là, sur l’écran, et inaccessible.", fx: { happy: -5 } },
  { id: "prix-tr", a: [18, 95], cc: ["TR"], y: [2018, 2024], txt: "Le prix du pain double en un an ; on fait ses courses dès le jour de paie, avant que tout augmente." },
  { id: "rial", a: [18, 95], cc: ["IR"], y: [2012, 2100], txt: "Le rial perd encore de sa valeur ; on parle des prix en dollars et des voyages au conditionnel." },
  { id: "loterie", a: [18, 90], w: 0.3, odds: 0.3, once: 1, txt: "Gagne une petite somme à la loterie ; invite tout le monde, et il ne reste presque rien.", fx: { happy: 3, gain: 0.03 } },
  { id: "vol-telephone", a: [14, 75], u: 1, y: [2005, 2100], t: [1, 5], once: 1, txt: "Se fait voler son téléphone dans le bus ; c’est tout un carnet d’adresses qui part avec.", fx: { happy: -2, cost: 0.01 } },
]);

// --- Migrations et argent envoyé ------------------------------------------------------------------
scenes("Migrations", "move", [
  { id: "mandat-oncle", a: [8, 85], cc: ["@remit"], g: [0, 20000], t: [0, 2], is: "native", txt: "Un oncle parti travailler à l’étranger envoie de l’argent : de quoi payer l’école des petits cette année.", fx: { gain: 0.03, rel: 1 } },
  { id: "mandat-usa", a: [8, 85], cc: ["@remitus"], t: [0, 2], y: [1980, 2100], is: "native", txt: "Le mandat d’un cousin installé aux États-Unis arrive à l’agence du village ; on fait la queue pour le retirer.", fx: { gain: 0.03 } },
  { id: "balikbayan", a: [5, 85], cc: ["PH"], y: [1980, 2100], is: "native", txt: "La caisse « balikbayan » d’une tante partie à l’étranger arrive enfin : du chocolat, des savons, des vêtements trop grands.", fx: { happy: 2 } },
  { id: "camp-travailleurs", a: [18, 60], is: "emigrant", cc: ["@gulf"], from: ["@laborsrc", "EG", "ET", "KE", "UG", "SD"], txt: "Dort dans un camp de travailleurs aux portes de la ville, à douze par chambre ; le bus de l’aube part à 5 heures.", fx: { health: -1 } },
  { id: "passeport-garde", a: [18, 60], is: "emigrant", cc: ["@gulf"], from: ["@laborsrc", "EG", "ET", "KE", "UG", "SD"], once: 1, txt: "L’employeur garde son passeport ; changer de travail sans son accord est impossible.", fx: { happy: -3 } },
  { id: "chantier-45", a: [18, 60], is: "emigrant", cc: ["@gulf"], from: ["@laborsrc", "EG", "SD"], txt: "Travaille sur un chantier sous 45 °C ; à midi, la pause obligatoire semble toujours trop courte.", fx: { health: -1 } },
  { id: "envoie-tout", a: [18, 65], is: "emigrant", from: ["#SSA", "#SAS", "#LAT", "@laborsrc"], g: [15000, 1e9], txt: "Envoie presque tout son salaire à la famille restée au pays ; garde de quoi manger et téléphoner.", fx: { rel: 2 } },
  { id: "titre-sejour", a: [18, 75], is: "emigrant", g: [25000, 1e9], txt: "Fait la queue des heures pour renouveler son titre de séjour ; il manque toujours un papier.", fx: { happy: -2 } },
  { id: "diplome-ignore", a: [22, 60], is: "emigrant degree", g: [25000, 1e9], once: 1, txt: "Son diplôme n’est pas reconnu ici ; en attendant, travaille la nuit dans un entrepôt.", fx: { happy: -3 } },
  { id: "epicerie-pays", a: [18, 95], is: "emigrant", txt: "Retrouve, dans une épicerie du quartier, les épices et les sons de son enfance ; reste longtemps entre les rayons.", fx: { happy: 2 } },
  { id: "nom-repete", a: [18, 65], is: "emigrant", g: [25000, 1e9], txt: "On lui fait répéter son nom trois fois à chaque entretien d’embauche ; certains le changent sur leur CV.", fx: { happy: -2 } },
  { id: "vacances-au-pays", a: [20, 75], is: "emigrant", from: ["#SSA", "#SAS", "#LAT", "#MENA", "#EAS"], txt: "Rentre au pays pour les vacances, les valises pleines de cadeaux ; là-bas, on {le|la} croit riche.", fx: { rel: 3, cost: 0.05 } },
  { id: "enfants-traduisent", a: [30, 75], is: "emigrant kids", txt: "Les enfants parlent la langue du pays mieux que {lui|elle} ; parfois, ce sont eux qui traduisent chez le médecin." },
  { id: "video-mere", a: [18, 70], is: "emigrant mother", y: [2010, 2100], txt: "Appelle sa mère en vidéo chaque dimanche, malgré le décalage horaire ; elle montre la cuisine, le jardin, les voisins.", fx: { rel: 2 } },
  { id: "enterrement-loin", a: [25, 85], is: "emigrant", w: 0.5, once: 1, txt: "Ne peut pas rentrer pour l’enterrement d’un proche ; les papiers ne le permettent pas.", fx: { happy: -4 } },
  { id: "entre-deux", a: [40, 95], is: "emigrant", once: 1, txt: "Se sent étranger{|ère} ici comme là-bas ; chez soi, désormais, c’est un peu entre les deux." },
  { id: "village-natal", a: [65, 95], is: "emigrant", once: 1, txt: "Retourne voir son village natal ; ne reconnaît presque rien, sauf l’odeur." },
  // Fils narratifs : un parent part, un enfant part.
  { id: "mere-part", a: [2, 12], cy: { PH: [1975, 2100], ID: [1980, 2100], LK: [1980, 2100], MD: [1995, 2100], UA: [1995, 2100], RO: [1995, 2100] }, t: [0, 2], is: "mother native", once: 1, hl: 1, kind: "family", txt: "Sa mère, {mere}, part travailler à l’étranger comme aide à domicile ; on se parle au téléphone le dimanche.", fx: { rel: -2, happy: -3 }, set: "parentAbroad" },
  { id: "pere-part", a: [2, 14], cy: { IN: [1975, 2100], NP: [1990, 2100], BD: [1976, 2100], PK: [1975, 2100], LK: [1976, 2100], PH: [1975, 2100], EG: [1975, 2100] }, t: [0, 2], is: "father native", once: 1, hl: 1, kind: "family", txt: "Son père, {pere}, part travailler sur les chantiers du Golfe ; il ne rentrera que tous les deux ans.", fx: { rel: -2, happy: -2 }, set: "parentAbroad" },
  { id: "parent-colis", a: [3, 17], need: "parentAbroad", gap: 3, kind: "family", txt: "Un colis arrive de l’étranger, envoyé par {parent} : des vêtements neufs, du chocolat, et une lettre qu’on relit dix fois.", fx: { happy: 2 } },
  { id: "parent-retour", a: [6, 25], need: "parentAbroad", after: 4, clear: "parentAbroad", hl: 1, kind: "family", txt: "{parent} rentre pour de bon, après des années à l’étranger ; il faut réapprendre à vivre ensemble.", fx: { rel: 2 } },
  { id: "enfant-part", a: [40, 75], g: [0, 20000], is: "grown native", once: 1, hl: 1, txt: "{enfant} part travailler à l’étranger ; la maison est plus silencieuse.", fx: { happy: -2, rel: -1 }, set: "kidAbroad" },
  { id: "enfant-envoie", a: [41, 95], need: "kidAbroad", after: 1, gap: 3, kind: "money", txt: "{enfant} envoie de l’argent chaque mois depuis l’étranger ; on refait le toit et on paie les médicaments.", fx: { gain: 0.06, happy: 1 } },
  { id: "enfant-visite", a: [42, 100], need: "kidAbroad", after: 2, gap: 4, kind: "family", txt: "{enfant} rentre pour quelques semaines, avec des cadeaux et un accent nouveau ; les voisins défilent.", fx: { happy: 3, rel: 2 } },
  { id: "enfant-video", a: [45, 100], need: "kidAbroad", after: 1, y: [2012, 2100], gap: 5, kind: "family", txt: "Voit grandir ses petits-enfants à l’écran, à l’autre bout du monde ; c’est {enfant} qui tient le téléphone.", fx: { rel: 1 } },
]);

// --- Santé et soins ---------------------------------------------------------------------------------
scenes("Santé et soins", "health", [
  { id: "dispensaire-loin", a: [3, 85], u: 0, g: [0, 6000], txt: "Le dispensaire le plus proche est à trois heures de marche ; on n’y va que quand c’est grave." },
  { id: "guerisseur", a: [3, 85], u: 0, t: [0, 1], r: ["SSA", "LAT", "SAS"], txt: "Consulte un guérisseur, faute de médecin : des herbes, des prières, et beaucoup d’attention.", fx: { happy: 1 } },
  { id: "medicaments-unite", a: [15, 85], t: [0, 1], r: ["SSA"], txt: "Achète ses médicaments à l’unité, au marché, sans ordonnance ni notice." },
  { id: "paludisme", a: [5, 85], r: ["SSA"], g: [0, 12000], txt: "Fait une crise de paludisme ; une semaine de fièvre, de frissons et de rêves étranges.", fx: { health: -2 } },
  { id: "dengue", a: [5, 85], once: 1, cc: ["BR", "MX", "CO", "PE", "PH", "ID", "VN", "TH", "MY", "IN", "BD", "LK", "PK", "NI", "HN", "DO", "PR", "SG"], y: [1980, 2100], txt: "Attrape la dengue ; quinze jours cloué{|e} au lit, les os en miettes.", fx: { health: -2 } },
  { id: "pollution", a: [3, 90], u: 1, cy: { IN: [1990, 2100], PK: [1995, 2100], BD: [1995, 2100], NP: [2000, 2100], CN: [1995, 2020], EG: [1990, 2100], NG: [2000, 2100], IR: [2000, 2100] }, txt: "Les jours de pollution, on ne voit plus le bout de la rue ; les enfants toussent tout l’hiver.", fx: { health: -1 } },
  { id: "chaleur-48", a: [3, 95], cc: ["IN", "PK", "IQ", "KW", "SA", "AE", "OM", "QA", "BH", "IR", "EG", "SD", "ML", "NE", "TD"], y: [1990, 2100], t: [0, 2], gap: 15, txt: ["Une vague de chaleur à 48 °C : on dort sur le toit, on mouille les draps, on attend la nuit.", "La chaleur ne retombe plus la nuit ; on dort par terre, sur le carrelage, la porte ouverte.", "Le thermomètre dépasse 45 °C une semaine entière ; les chantiers s’arrêtent à midi, les marchés ouvrent à l’aube."], fx: { health: -1 } },
  { id: "canicule-2003", a: [10, 105], on: { FR: [2003] }, once: 1, txt: "La canicule de l’été 2003 : on ferme les volets, on rend visite aux voisins âgés, on écoute le décompte à la radio." },
  { id: "cataracte", a: [60, 100], t: [2, 5], y: [1985, 2100], once: 1, txt: "Se fait opérer de la cataracte : le monde redevient net et lumineux, comme repeint.", fx: { happy: 3 } },
  { id: "cataracte-non", a: [60, 100], t: [0, 1], g: [0, 10000], once: 1, txt: "Perd peu à peu la vue ; l’opération de la cataracte existe, mais en ville, et trop chère.", fx: { happy: -3, health: -1 } },
  { id: "camp-yeux", a: [55, 95], cc: ["IN", "NP"], t: [0, 2], y: [1990, 2100], once: 1, txt: "Se fait opérer de la cataracte gratuitement lors d’un camp médical ; le lendemain, découvre les rides de ses enfants.", fx: { happy: 4 } },
  { id: "facture-urgences", a: [20, 85], cc: ["US"], p: [0, 0.5], y: [1970, 2100], once: 1, txt: "Un passage aux urgences, et une facture qui arrive trois semaines plus tard, de quoi s’asseoir.", fx: { cost: 0.15, happy: -3 } },
  { id: "prise-en-charge", a: [40, 95], cc: ["FR", "DE", "BE", "AT", "NL", "LU", "SE", "NO", "DK", "FI", "JP", "KR", "TW", "CA", "GB", "ES", "IT"], y: [1950, 2100], once: 1, txt: "Une opération lourde, presque entièrement prise en charge ; {il|elle} pense à ceux qui, ailleurs, n’ont pas cette chance." },
  { id: "liste-attente", a: [55, 95], cc: ["GB", "CA", "IE", "NZ"], y: [1990, 2100], once: 1, txt: "Attend huit mois une opération de la hanche ; marche avec une canne en attendant.", fx: { health: -1, happy: -1 } },
  { id: "genoux", a: [60, 100], gap: 20, txt: ["Ses genoux lui rappellent chaque escalier ; on rit, on soupire, on monte quand même.", "Le dos se rappelle à {lui|elle} chaque matin ; il faut cinq minutes pour se mettre en route."] },
  { id: "arracheur", a: [25, 85], t: [0, 1], g: [0, 10000], txt: "Se fait arracher une dent par un arracheur ambulant, au marché ; c’est moins cher que le dentiste.", fx: { health: -1 } },
  { id: "periode-sombre", a: [18, 90], is: "sad", heavy: 1, txt: "Traverse une période sombre ; il faut des mois pour retrouver le goût des choses.", fx: { happy: -2 } },
  { id: "parler-quelqu-un", a: [18, 85], is: "sad", g: [25000, 1e9], y: [1980, 2100], t: [3, 5], txt: "Commence à voir quelqu’un pour parler ; ce n’est pas magique, mais ça aide.", fx: { happy: 3 } },
  { id: "tai-chi", a: [55, 100], cc: ["CN", "TW", "HK", "SG"], txt: "Fait du tai-chi au parc chaque matin, au milieu d’autres retraités, dans un silence de cathédrale.", fx: { health: 1 } },
  { id: "gym-radio", a: [6, 100], cc: ["JP"], y: [1930, 2100], txt: "Fait la gymnastique radio du matin, sur la même musique depuis l’enfance.", fx: { health: 1 } },
  { id: "yoga", a: [25, 85], t: [3, 5], y: [1980, 2100], once: 1, txt: "S’initie au yoga ; les articulations protestent, le sommeil s’améliore.", fx: { health: 1 } },
]);

// --- Couple et mariage ---------------------------------------------------------------------------
scenes("Couple et mariage", "family", [
  { id: "bon-parti", a: [19, 28], cc: ["IN", "PK", "BD", "NP", "AF", "LK"], o: 1, is: "single", txt: "Ses parents cherchent un bon parti ; les photos et les horoscopes circulent entre les familles." },
  { id: "site-matrimonial", a: [22, 32], cc: ["IN"], o: 1, y: [2005, 2100], is: "single", t: [2, 5], txt: "Ses parents publient son profil sur un site de mariages arrangés : diplômes, taille, famille, horoscope." },
  { id: "marche-mariages", a: [27, 36], cc: ["CN"], y: [2005, 2100], u: 1, is: "single", txt: "Ses parents affichent sa fiche au « marché aux mariages » du parc, le dimanche : âge, salaire, signe astral." },
  { id: "appartement-fiancee", a: [25, 35], cc: ["CN"], y: [2005, 2100], sex: "m", is: "single", txt: "La famille de sa fiancée attend un appartement ; ses parents vident leur épargne pour l’apport." },
  { id: "applis", a: [20, 45], g: [15000, 1e9], y: [2013, 2100], is: "alone", txt: "Tente les applications de rencontre : beaucoup de discussions, peu de rendez-vous, un fou rire ou deux." },
  { id: "bal-village", a: [17, 25], y: [1900, 1970], u: 0, r: ["EUR", "NAM", "LAT"], is: "single", txt: "Va au bal du village le samedi ; les mères surveillent depuis les chaises alignées le long du mur." },
  // Les noces, l'année qui suit le mariage.
  { id: "noce-in", a: [16, 50], is: "newlywed", cc: ["IN", "NP"], o: 1, t: [2, 5], sure: 1, txt: "Le mariage a duré trois jours : huit cents invités, des danses, des larmes, et des dettes pour des années.", fx: { cost: 0.1 } },
  { id: "noce-in-simple", a: [14, 50], is: "newlywed", cc: ["IN", "NP", "BD"], o: 1, t: [0, 1], sure: 1, txt: "Un mariage simple au village ; la famille a emprunté pour nourrir les invités.", fx: { debt: 0.05 } },
  { id: "noce-pk", a: [16, 50], is: "newlywed", cc: ["PK", "BD", "AF"], o: 1, t: [2, 5], sure: 1, txt: "Le mehndi, le baraat, le walima : trois jours de fête, de henné et de cuisine." },
  { id: "noce-ng", a: [18, 50], is: "newlywed", cc: ["NG", "GH", "CM"], o: 1, t: [1, 5], sure: 1, txt: "Le mariage traditionnel, puis le mariage à l’église : deux fêtes, deux tenues assorties, deux fois plus d’invités." },
  { id: "lobola", a: [18, 50], is: "newlywed", cc: ["ZA", "LS", "SZ", "ZW", "BW", "NA"], o: 1, sure: 1, txt: "Les deux familles ont négocié la lobola pendant des heures, avant de faire la fête toute la nuit." },
  { id: "dot-vaches", a: [16, 50], is: "newlywed", cc: ["KE", "TZ", "UG", "SS", "RW", "BI", "ET"], o: 1, sure: 1, txt: "Les familles se sont accordées sur la dot : tant de vaches, ou leur équivalent ; les oncles ont mené la négociation." },
  { id: "noce-mairie", a: [18, 60], is: "newlywed", cc: ["FR", "BE", "LU", "CH"], o: 1, sure: 1, txt: "Mariage à la mairie, puis repas et danse jusqu’à l’aube ; l’oncle a fait le même discours qu’à chaque mariage." },
  { id: "noce-us", a: [20, 60], is: "newlywed", cc: ["US"], t: [3, 5], sure: 1, txt: "Un grand mariage, avec photographe et traiteur ; il faudra des années pour en rembourser le prix.", fx: { cost: 0.15 } },
  { id: "noce-jp", a: [20, 60], is: "newlywed", cc: ["JP"], y: [1960, 2100], sure: 1, txt: "Cérémonie shintoïste le matin, robe blanche l’après-midi, discours millimétrés le soir." },
  { id: "noce-kr", a: [20, 60], is: "newlywed", cc: ["KR"], y: [1985, 2100], sure: 1, txt: "Le mariage a duré une heure dans une salle louée ; le couple suivant attendait déjà dans le couloir." },
  { id: "noce-urss", a: [18, 60], is: "newlywed", cc: ["@ussr"], y: [1950, 2100], sure: 1, txt: "Mariage au bureau d’état civil, photos devant le monument aux morts, et toasts jusqu’à l’aube." },
  { id: "noce-henne", a: [17, 60], is: "newlywed", cc: ["MA", "DZ", "TN", "LY", "EG", "JO", "LB", "SY", "IQ", "PS"], o: 1, sure: 1, txt: "La soirée du henné la veille, puis la grande fête : trois robes, des youyous, et tout le quartier." },
  { id: "noce-hisp", a: [18, 60], is: "newlywed", cc: ["@hisp"], o: 1, sure: 1, txt: "Un mariage avec orchestre et cousins venus de partout ; on a dansé jusqu’à ce que les chaussures lâchent." },
  { id: "noce-br", a: [18, 60], is: "newlywed", cc: ["BR"], o: 1, sure: 1, txt: "Mariage à l’église, puis la fête : samba, brigadeiros, et des cousins qui dansent jusqu’au matin." },
  { id: "noce-modeste", a: [16, 60], is: "newlywed", t: [0, 1], w: 0.4, txt: "Une noce simple : un repas partagé dans la cour, les voisins qui chantent, et des bancs empruntés à l’école." },
  { id: "noce-grande", a: [18, 60], is: "newlywed", t: [2, 5], w: 0.4, txt: "La noce réunit les deux familles ; on danse jusqu’au matin, et les tantes comparent déjà les menus." },
  { id: "noce-rouge", a: [20, 60], is: "newlywed", cc: ["CN", "TW", "HK", "SG", "VN"], o: 1, sure: 1, txt: "Le mariage en rouge, les enveloppes d’argent des invités, et le banquet de dix plats." },
  { id: "noce-simple", a: [22, 60], is: "newlywed", g: [25000, 1e9], t: [2, 4], w: 0.6, txt: "Un mariage simple, à la mairie, avec vingt amis ; l’argent ira plutôt dans le logement." },
  { id: "noce-people", a: [20, 60], is: "newlywed", p: [0.97, 1], t: [5, 5], sure: 1, txt: "Le mariage a rassemblé mille invités et fait la une d’un magazine people." },
  { id: "disputes-argent", a: [20, 70], is: "married", p: [0, 0.3], txt: "Les disputes d’argent reviennent à chaque fin de mois, avec toujours les mêmes mots.", fx: { rel: -1 } },
  { id: "dimanche-a-deux", a: [20, 90], is: "married", gap: 20, txt: ["Un dimanche sans rien faire, à deux ; le bonheur tient parfois à ça.", "Une dispute sur un détail, puis un fou rire au milieu ; c’est aussi ça, vivre à deux."], fx: { happy: 1, rel: 1 } },
  { id: "noces-10", a: [25, 80], is: "married wed:10", sure: 1, once: 1, txt: "Dix ans de mariage avec {conjoint} ; on ressort les photos, on rit des coupes de cheveux." },
  { id: "noces-25", a: [40, 95], is: "married wed:25", sure: 1, once: 1, txt: "Noces d’argent : vingt-cinq ans avec {conjoint}, et un dîner où l’on se dit des choses qu’on ne dit jamais.", fx: { happy: 2 } },
  { id: "noces-50", a: [65, 110], is: "married wed:50", sure: 1, once: 1, hl: 1, txt: "Noces d’or : cinquante ans avec {conjoint}, toute la famille réunie autour d’eux.", fx: { happy: 4, rel: 3 } },
  { id: "apres-divorce", a: [20, 85], is: "divorced", once: 1, txt: "Apprend à vivre seul{|e} après le divorce ; les dimanches sont longs, puis un peu moins.", fx: { happy: -1 } },
  { id: "garde-alternee", a: [25, 60], is: "divorced kids", g: [20000, 1e9], y: [1990, 2100], once: 1, txt: "Les enfants vivent une semaine chez chacun ; le sac de voyage ne se défait plus." },
  { id: "deux-assiettes", a: [40, 110], is: "widowed", once: 1, txt: "Met encore deux assiettes sur la table, par habitude ; range la seconde sans rien dire.", fx: { happy: -1 } },
  { id: "voisins-marmite", a: [40, 110], is: "widowed", r: ["MENA", "SSA", "SAS", "LAT"], once: 1, txt: "Les voisins passent chaque soir, une marmite à la main ; personne ne {le|la} laisse seul{|e}.", fx: { rel: 2 } },
  { id: "groupe-veufs", a: [50, 110], is: "widowed", g: [25000, 1e9], y: [1980, 2100], once: 1, txt: "Rejoint un groupe de parole de veufs et de veuves ; on y rit plus qu’on ne l’aurait cru.", fx: { happy: 2, rel: 2 } },
]);

// --- Être parent -------------------------------------------------------------------------------
scenes("Être parent", "family", [
  { id: "nuits-blanches", a: [16, 50], is: "baby", txt: "Les nuits blanches des premiers mois : on apprend à dormir par tranches de deux heures.", fx: { health: -1 } },
  { id: "bebe-pagne", a: [15, 45], sex: "f", is: "baby", r: ["SSA"], u: 0, txt: "Porte {enfant} sur le dos, noué{enfant:|e} dans un pagne, pendant les travaux des champs." },
  { id: "conge-pere", a: [20, 55], sex: "m", is: "baby employee", cc: ["@nordic"], y: [1995, 2100], txt: "Prend plusieurs mois de congé parental payé, comme la plupart des pères du pays.", fx: { rel: 3, happy: 2 } },
  { id: "conge-us", a: [18, 45], sex: "f", is: "baby employee", cc: ["US"], y: [1950, 2100], txt: "Retourne au travail trois semaines après l’accouchement : le congé maternité n’est pas payé.", fx: { health: -1, happy: -2 } },
  { id: "creche-attente", a: [20, 45], is: "baby", cc: ["FR", "DE", "JP"], u: 1, y: [1980, 2100], txt: "Inscrit {enfant} en crèche dès la grossesse ; on attend toujours une place." },
  { id: "nounou", a: [25, 50], is: "baby", t: [4, 5], g: [0, 30000], txt: "Engage une nounou pour s’occuper de {enfant} ; elle chante des berceuses de son village." },
  { id: "premier-jour-ecole", a: [20, 60], is: "kidstart", t: [1, 5], once: 1, sure: 1, txt: "Premier jour d’école pour {enfant} : un cartable trop grand, quelques larmes, puis un sourire." },
  { id: "histoire-soir", a: [20, 60], is: "toddler", txt: "Raconte une histoire à {enfant} chaque soir ; c’est le meilleur moment de la journée.", fx: { rel: 2 } },
  { id: "apprendre-velo", a: [22, 60], is: "schoolkid", t: [1, 5], once: 1, txt: "Apprend à {enfant} à faire du vélo, en courant derrière, la main sur la selle, puis sans la main.", fx: { happy: 2 } },
  { id: "fievre-nuit", a: [18, 55], is: "toddler", txt: "{enfant} a de la fièvre toute la nuit ; on se relaie au bord du lit jusqu’au matin." },
  { id: "prix-ecole", a: [25, 65], is: "schoolkid", txt: "{enfant} remporte un prix à l’école ; la photo trône désormais sur le buffet.", fx: { happy: 2 } },
  { id: "monosyllabes", a: [28, 70], is: "teenkid", txt: "{enfant} ne parle plus que par monosyllabes : l’adolescence est arrivée.", fx: { happy: -1 } },
  { id: "ado-telephone", a: [28, 70], is: "teenkid", y: [2012, 2100], t: [2, 5], txt: "{enfant} passe ses nuits sur son téléphone ; les négociations sur l’heure du coucher reprennent." },
  { id: "ado-travailler", a: [28, 70], is: "teenkid", t: [0, 1], g: [0, 15000], txt: "{enfant} veut arrêter l’école pour travailler et aider la famille ; longue discussion, tard le soir.", fx: { happy: -1 } },
  { id: "ecole-recolte", a: [25, 70], is: "schoolkid j:farmer,farmhand", t: [0, 2], g: [0, 12000], kind: "money", txt: "Vend une partie de la récolte pour payer l’école de {enfant}.", fx: { cost: 0.03, fund: 0.03 } },
  { id: "ecole-privee", a: [25, 65], is: "schoolkid", t: [4, 5], kind: "money", txt: "Inscrit {enfant} dans une école privée ; les frais coûtent presque un salaire.", fx: { cost: 0.1, fund: 0.1 } },
  { id: "cours-du-soir", a: [30, 65], is: "teenkid", cc: ["KR", "CN", "JP", "IN", "EG", "GR", "TR", "VN", "HK", "TW", "SG"], t: [2, 5], kind: "money", txt: "Paie des cours particuliers à {enfant} presque tous les soirs ; c’est le premier poste de dépense de la famille.", fx: { cost: 0.06, fund: 0.06 } },
  { id: "enfant-diplome", a: [38, 85], is: "grown", once: 1, t: [2, 5], txt: "{enfant} obtient son diplôme ; dans la salle, c’est {lui|elle} qui pleure le plus.", fx: { happy: 4 } },
  { id: "enfant-mariage", a: [38, 90], is: "grown", once: 1, txt: "{enfant} se marie ; on danse jusqu’au matin, et on se trouve soudain vieux.", fx: { happy: 3, rel: 2 } },
  { id: "enfant-ville", a: [38, 90], is: "grown", u: 0, once: 1, txt: "{enfant} part vivre en ville ; les appels du dimanche deviennent sacrés.", fx: { rel: -1 } },
  { id: "enfant-emploi", a: [36, 85], is: "grown", once: 1, txt: "{enfant} trouve son premier emploi et invite la famille au restaurant ; les rôles commencent à s’inverser." },
  { id: "enfant-unique", a: [22, 40], cc: ["CN"], u: 1, y: [1980, 2015], is: "married nokids", once: 1, txt: "Comme tous les couples de la ville, n’aura droit qu’à un enfant : c’est la loi." },
  { id: "mercredis", a: [50, 90], is: "grandkids", g: [20000, 1e9], txt: "Garde ses petits-enfants le mercredi ; la maison redevient bruyante, puis silencieuse le soir.", fx: { happy: 2, rel: 2 } },
  { id: "eleve-petits", a: [45, 90], is: "grandkids", u: 0, g: [0, 20000], txt: "Élève ses petits-enfants pendant que leurs parents travaillent en ville ; c’est une seconde vie de parent.", fx: { rel: 2, health: -1 } },
]);

// --- Parents qui vieillissent ---------------------------------------------------------------------
scenes("Parents qui vieillissent", "family", [
  { id: "parent-sous-toit", a: [30, 75], is: "oldParent", r: ["SAS", "EAS", "MENA", "SSA", "LAT"], txt: "Accueille {parent} sous son toit : ici, on ne laisse pas ses parents vieillir seuls.", fx: { rel: 2 } },
  { id: "appel-parent", a: [22, 65], is: "parent", g: [15000, 1e9], txt: "Appelle {parent} chaque dimanche ; on parle de la météo, et c’est très bien comme ça.", fx: { rel: 1 } },
  { id: "parent-hopital", a: [35, 80], is: "oldParent", txt: "Rend visite à {parent} à l’hôpital ; pour la première fois, les rôles s’inversent." },
  { id: "parent-smartphone", a: [20, 55], is: "parent", y: [2012, 2100], t: [2, 5], txt: "Apprend à {parent} à se servir d’un smartphone ; la même question revient chaque semaine." },
  { id: "parent-histoire", a: [30, 75], is: "oldParent", txt: "{parent} raconte pour la centième fois la même histoire ; cette fois, {il|elle} l’enregistre." },
]);

// --- Croyances et fêtes (selon le pays d'origine) ------------------------------------------------------
scenes("Croyances et fêtes", "culture", [
  { id: "aid", a: [3, 95], cc: ["@islam"], o: 1, txt: ["L’Aïd : des vêtements neufs, les visites chez les oncles, et quelques pièces glissées dans la main des enfants.", "Les soirées du ramadan : on rompt le jeûne en famille, puis on sort tard dans les rues illuminées."] },
  { id: "premier-ramadan", a: [10, 14], cc: ["@islam"], o: 1, once: 1, txt: "Jeûne pour la première fois tout le mois du ramadan ; la fierté l’emporte sur la faim." },
  { id: "tabaski", a: [20, 85], cc: ["SN", "ML", "NE", "BF", "GN", "MR", "GM", "CI", "CM", "TD"], o: 1, t: [1, 4], txt: "Pour la Tabaski, la famille achète un mouton ; son prix fait la conversation de tout le quartier.", fx: { cost: 0.03 } },
  { id: "hajj", a: [40, 85], cc: ["@islam"], o: 1, t: [2, 5], y: [1950, 2100], once: 1, hl: 1, txt: "Fait le pèlerinage à La Mecque, l’argent de toute une vie ; au retour, on l’appelle avec respect.", fx: { cost: 0.4, happy: 6 } },
  { id: "noel-modeste", a: [3, 12], cc: ["@christian"], o: 1, t: [0, 1], txt: "À Noël, une orange, des bonbons et un vêtement neuf : c’est la fête des grands jours." },
  { id: "noel-cadeaux", a: [3, 12], cc: ["@christian"], o: 1, t: [3, 5], y: [1950, 2100], txt: "À Noël, le sapin croule sous les cadeaux ; le plus beau jouet reste le carton d’emballage." },
  { id: "reveillon-24", a: [5, 95], cc: ["@hisp", "BR", "PH"], o: 1, txt: "Le réveillon de Noël dure toute la nuit du 24 ; les enfants s’endorment sous la table." },
  { id: "noel-septembre", a: [5, 95], cc: ["PH"], o: 1, txt: "Les chants de Noël commencent dès septembre ; ici, les fêtes durent quatre mois." },
  { id: "messe-minuit", a: [6, 95], cc: ["PL", "IT", "IE", "ES", "PT", "MX", "PH", "HR", "SK", "LT", "MT"], o: 1, txt: "Va à la messe de minuit avec toute la famille, en luttant contre le sommeil." },
  { id: "noel-7-janvier", a: [5, 95], cc: ["RU", "UA", "BY", "RS", "GE", "ET", "MK", "ME", "MD", "ER"], o: 1, txt: "Fête Noël le 7 janvier, après le jeûne ; la table se couvre de plats qu’on n’a pas vus depuis un an." },
  { id: "nouvel-an-urss", a: [4, 95], cc: ["@ussr"], o: 1, y: [1950, 2100], txt: "Le Nouvel An, la plus grande fête de l’année : le sapin, les mandarines, la salade Olivier, et le discours de minuit à la télévision." },
  { id: "paques-bougie", a: [5, 95], cc: ["GR", "CY", "RO", "BG", "RS"], o: 1, txt: "À Pâques, les cloches sonnent à minuit ; on rentre de l’église en protégeant sa bougie du vent." },
  { id: "nouvel-an-lunaire", a: [3, 95], cc: ["@lunar"], o: 1, txt: ["Le Nouvel An lunaire : les enveloppes rouges, les pétards, et la famille au complet.", "Pour le Nouvel An, on nettoie la maison de fond en comble pour chasser la malchance."] },
  { id: "tet", a: [3, 95], cc: ["VN"], o: 1, txt: "Pour le Têt, on achète un pêcher en fleur et on prépare les gâteaux de riz gluant dans des feuilles de bananier." },
  { id: "tsagaan-sar", a: [3, 95], cc: ["MN"], o: 1, txt: "Pour Tsagaan Sar, on salue les aînés les bras tendus, puis on mange jusqu’à ne plus pouvoir bouger." },
  { id: "qingming", a: [8, 95], cc: ["CN", "TW", "HK", "SG", "MO"], o: 1, txt: "Au Qingming, balaie la tombe des ancêtres et brûle pour eux des billets de papier." },
  { id: "diwali", a: [3, 95], cc: ["@hindu"], o: 1, txt: ["Diwali : des lampes à huile sur chaque marche, des pétards jusqu’à minuit, et des douceurs échangées entre voisins.", "Holi : tout le quartier se couvre de poudres de couleur ; même les grands-parents s’y mettent."] },
  { id: "kumbh", a: [30, 85], cc: ["IN"], o: 1, once: 1, txt: "Se baigne dans le Gange lors de la Kumbh Mela, au milieu de dizaines de millions de pèlerins.", fx: { happy: 3 } },
  { id: "norouz", a: [3, 95], cc: ["IR", "AF", "TJ", "UZ", "KZ", "KG", "AZ", "TM"], o: 1, txt: "Pour Norouz, on dresse la table des sept symboles et on saute par-dessus les feux, la veille du printemps." },
  { id: "nouvel-an-eau", a: [4, 85], cc: ["TH", "LA", "KH", "MM"], o: 1, txt: "Pour le Nouvel An d’avril, toute la ville s’arrose dans les rues, en riant, pendant trois jours." },
  { id: "muertos", a: [4, 95], cc: ["MX"], o: 1, txt: "Prépare l’autel des morts : des œillets d’Inde orange, les photos des disparus, le pain des morts et leur plat préféré." },
  { id: "carnaval-br", a: [8, 80], cc: ["BR"], txt: "Défile au carnaval avec son école de samba ; des mois de répétitions pour une seule nuit." },
  { id: "carnaval-tt", a: [10, 70], cc: ["TT"], txt: "Passe la nuit du carnaval à danser derrière les steelbands, couvert{|e} de peinture et de boue." },
  { id: "guadalupe", a: [10, 85], cc: ["MX"], once: 1, txt: "Marche jusqu’à la basilique de Guadalupe, le 12 décembre, au milieu de millions de pèlerins." },
  { id: "compostelle", a: [30, 75], cc: ["@eu"], t: [3, 5], y: [1985, 2100], once: 1, txt: "Marche jusqu’à Saint-Jacques-de-Compostelle ; ne sait plus très bien si c’est pour Dieu, pour soi ou pour les ampoules." },
  { id: "magal", a: [10, 85], cc: ["SN"], o: 1, once: 1, txt: "Part au Grand Magal de Touba avec des millions de pèlerins ; la ville sainte déborde jusque dans les champs." },
  { id: "timkat", a: [5, 90], cc: ["ET", "ER"], o: 1, txt: "Pour Timkat, suit la procession des prêtres en tenues brodées, sous des parasols de toutes les couleurs." },
  { id: "hatsumode", a: [5, 95], cc: ["JP"], o: 1, txt: "Au Nouvel An, va prier au sanctuaire et tire un papier de bonne aventure ; s’il est mauvais, on le noue à une branche." },
  { id: "obon", a: [5, 95], cc: ["JP"], o: 1, txt: "Pour l’O-Bon, la famille rentre au pays des grands-parents accueillir l’esprit des ancêtres et danser le bon-odori." },
  { id: "shabbat", a: [5, 95], cc: ["IL"], o: 1, txt: "Le vendredi soir, le shabbat : les bougies, la hallah, et le téléphone qu’on éteint." },
  { id: "famadihana", a: [10, 90], cc: ["MG"], o: 1, txt: "Participe au famadihana : on sort les ancêtres de leur tombeau pour les envelopper d’un linceul neuf, en dansant." },
  { id: "funerailles-gh", a: [18, 90], cc: ["GH"], o: 1, txt: "Les funérailles d’un oncle durent tout un week-end, avec tenues assorties et orchestre ; la famille s’endette pour bien faire.", fx: { cost: 0.03, rel: 2 } },
  { id: "umuganda", a: [18, 70], cc: ["RW"], y: [2009, 2100], txt: "Participe à l’umuganda, le dernier samedi du mois : tout le pays nettoie, plante et répare ensemble." },
  { id: "harambee", a: [18, 85], cc: ["KE"], y: [1963, 2100], txt: "Donne au harambee du village : chacun met ce qu’il peut pour envoyer un enfant à l’université.", fx: { rel: 2, cost: 0.01 } },
  { id: "thanksgiving", a: [5, 95], cc: ["US"], o: 1, txt: "Le dîner de Thanksgiving : la dinde, la tarte à la citrouille, et l’oncle qui parle politique." },
  { id: "lieu-culte", a: [8, 95], w: 0.5, not: ["@secular"], gap: 30, txt: ["Va chaque semaine au lieu de culte ; on y prie, on y chante, on y prend des nouvelles de tout le monde.", "Le jour de prière, la rue entière se met en habits de fête ; on y va autant pour les voisins que pour le ciel."], fx: { rel: 1 } },
]);

// --- Loisirs et sport ------------------------------------------------------------------------------
scenes("Loisirs et sport", "culture", [
  { id: "cricket-ruelle", a: [6, 16], cc: ["@cricket"], txt: "Joue au cricket dans la ruelle, un bidon en guise de guichet ; les fenêtres des voisins en font les frais." },
  { id: "baseball", a: [6, 16], cc: ["@baseball"], txt: "Joue au base-ball avec un gant trop grand, en rêvant des ligues majeures." },
  { id: "koshien", a: [15, 17], cc: ["JP"], is: "secondary", once: 1, w: 0.4, txt: "L’équipe de base-ball du lycée se qualifie pour le tournoi de Kōshien ; tout le quartier suit les matchs à la télévision." },
  { id: "basket-poteau", a: [8, 30], cc: ["PH"], txt: "Joue au basket pieds nus, sur un panneau cloué à un poteau électrique, comme tout le quartier." },
  { id: "patinoire-cour", a: [6, 14], cc: ["CA"], y: [1920, 2100], txt: "Joue au hockey sur la patinoire que son père arrose chaque soir dans la cour." },
  { id: "course-collines", a: [10, 25], cc: ["KE", "ET"], u: 0, txt: "Court chaque matin dans les collines, à deux mille mètres d’altitude ; au village, plusieurs champions sont partis de là." },
  { id: "rugby", a: [8, 25], cc: ["NZ", "FJ", "WS", "TO", "ZA"], sex: "m", txt: "Joue au rugby dès qu’il tient debout ; le dimanche, tout le village vient voir le match." },
  { id: "lutte", a: [10, 30], cc: ["MN", "IR", "TR", "GE", "AZ", "SN"], sex: "m", txt: "S’entraîne à la lutte avec les garçons du quartier ; les anciens commentent chaque prise." },
  { id: "match-quartier", a: [8, 95], y: [1960, 2100], t: [1, 5], gap: 20, txt: ["Regarde le match de l’équipe nationale avec tout le quartier ; on crie, on pleure, on refait le match jusqu’à minuit.", "Une finale perdue aux tirs au but ; tout le monde rentre en silence, sauf l’oncle qui sait comment il aurait fallu tirer."], fx: { rel: 1 } },
  { id: "match-cafe", a: [10, 95], y: [1960, 2100], t: [0, 1], gap: 20, txt: "Regarde le match sur la télévision du café, qui fait payer l’entrée quelques pièces.", fx: { rel: 1 } },
  { id: "bollywood-salle", a: [10, 85], cc: ["IN", "NP"], y: [1950, 2100], txt: "Pleure devant un film de Bollywood au cinéma du quartier, avec toute la salle ; on chante pendant les chansons." },
  { id: "nollywood", a: [10, 85], cc: ["NG", "GH", "CM", "KE"], y: [1995, 2100], txt: "Regarde des films de Nollywood en boucle ; les intrigues sont folles, et on adore ça." },
  { id: "telenovela", a: [8, 95], cc: ["@hisp", "BR"], y: [1965, 2100], txt: "Toute la famille suit la telenovela du soir ; personne ne parle pendant l’épisode." },
  { id: "series-coreennes", a: [12, 85], cc: ["KR", "JP", "CN", "PH", "VN", "TH", "ID", "MY", "TW"], y: [2003, 2100], txt: "Regarde des séries coréennes jusqu’à deux heures du matin, « juste un dernier épisode »." },
  { id: "karaoke", a: [16, 85], cc: ["JP", "KR", "PH", "VN", "CN", "TW", "TH", "HK", "SG"], y: [1980, 2100], txt: "Chante au karaoké jusqu’à l’aube ; personne ne se souvient de qui a choisi la dernière chanson." },
  { id: "milonga", a: [25, 90], cc: ["AR", "UY"], u: 1, txt: "Danse le tango dans une milonga le jeudi soir ; on ne s’y parle pas, on s’y comprend." },
  { id: "sauna", a: [6, 100], cc: ["FI", "EE"], txt: "Le sauna du samedi, puis un plongeon dans le lac glacé ; on en ressort neuf." },
  { id: "cafe-the", a: [18, 95], cc: ["TR", "IR", "AF", "PK", "MA", "EG", "IQ"], sex: "m", txt: "Passe ses soirées au café, entre le thé et les parties de jacquet." },
  { id: "guitare", a: [12, 60], odds: 0.3, once: 1, txt: "Passe des mois à apprendre la guitare ; ne connaît que trois accords, mais les joue avec cœur.", fx: { happy: 2 } },
  { id: "chien", a: [8, 80], t: [2, 5], g: [10000, 1e9], odds: 0.5, once: 1, txt: "Adopte un chien, qui devient en une semaine le roi de la maison.", fx: { happy: 3 } },
  { id: "mer-premiere-fois", a: [5, 45], t: [0, 2], once: 1, unless: ["premier-avion", "vacances-etranger", "vacances-hotel", "colo", "roadtrip", "maison-vacances", "grands-parents-ete", "voyage-scolaire", "plat-au"], txt: "Voit la mer pour la première fois ; reste longtemps sans rien dire, les pieds dans l’eau.", fx: { happy: 3 } },
  { id: "neige-premiere-fois", a: [10, 60], cc: ["@tropics"], t: [3, 5], once: 1, w: 0.4, txt: "Voit la neige pour la première fois, en voyage ; en ramasse une poignée pour vérifier qu’elle est froide." },
  { id: "nuit-cousins", a: [8, 25], txt: "Une nuit d’été inoubliable avec les cousins, à parler jusqu’à l’aube sous les étoiles.", fx: { happy: 2, rel: 1 } },
  { id: "danse-noce", a: [16, 80], gap: 20, txt: ["Danse toute la nuit au mariage d’un cousin ; le lendemain, les jambes s’en souviennent.", "Retrouve au mariage d’une cousine toute la famille éparpillée ; on se promet de se revoir plus souvent."], fx: { happy: 2 } },
  { id: "roman", a: [15, 95], t: [2, 5], y: [1920, 2100], once: 1, txt: "Lit un roman qui change sa façon de voir le monde ; le relira trois fois.", fx: { know: 1 } },
  { id: "concert", a: [15, 50], t: [3, 5], y: [1960, 2100], u: 1, once: 1, txt: "Va à son premier grand concert ; garde le billet dans un tiroir pendant des décennies." },
  { id: "jardinage", a: [40, 95], t: [2, 5], is: "owner", once: 1, txt: "Se découvre une passion pour le jardinage ; parle à ses tomates quand personne ne regarde." },
  { id: "peche-dimanche", a: [30, 90], u: 0, txt: "Va pêcher le dimanche matin, plus pour le silence que pour les poissons." },
]);

// --- L'histoire vécue en direct ------------------------------------------------------------------
scenes("L’histoire en direct", "history", [
  { id: "lune", a: [5, 105], ys: [1969], t: [2, 5], once: 1, sure: 1, hl: 1, stamp: 1, txt: "Regarde, sur un écran qui grésille, des hommes marcher sur la Lune." },
  { id: "lune-radio", a: [8, 105], ys: [1969], t: [0, 1], once: 1, sure: 1, stamp: 1, txt: "Entend à la radio que des hommes ont marché sur la Lune ; certains, autour de {lui|elle}, n’y croient pas." },
  { id: "gagarine", a: [6, 105], ys: [1961], cc: ["@ussr"], once: 1, sure: 1, stamp: 1, txt: "Gagarine est le premier homme dans l’espace ; on s’embrasse dans les rues, on est fiers." },
  { id: "mur-berlin", a: [6, 105], ys: [1989], cc: ["DE"], once: 1, sure: 1, hl: 1, stamp: 1, txt: "Le Mur de Berlin tombe : des inconnus s’embrassent sur les gravats, et l’on pleure devant la télévision." },
  { id: "fin-regime", a: [10, 105], ys: [1989, 1990], cc: ["PL", "HU", "RO", "BG", "AL"], once: 1, sure: 1, stamp: 1, txt: "Le régime tombe ; on découvre la liberté de parler, les magasins pleins, et bientôt le chômage." },
  { id: "velours", a: [10, 105], ys: [1989], cc: ["CZ", "SK"], once: 1, sure: 1, stamp: 1, txt: "La révolution de Velours : sur les places, des centaines de milliers de gens agitent leurs clés." },
  { id: "cz-sk", a: [8, 105], ys: [1993], cc: ["CZ", "SK"], once: 1, sure: 1, stamp: 1, txt: "La Tchécoslovaquie se sépare en deux pays, sans un coup de feu ; il faudra passer une frontière pour voir ses cousins." },
  { id: "fin-urss", a: [10, 105], ys: [1991], cc: ["RU"], once: 1, sure: 1, hl: 1, stamp: 1, txt: "L’URSS disparaît ; en quelques mois, l’épargne, les certitudes et le pays d’hier s’évaporent." },
  { id: "independance-91", a: [8, 105], on: { UA: [1991], BY: [1991], KZ: [1991], UZ: [1991], TM: [1991], KG: [1991], TJ: [1991], AZ: [1991], AM: [1991], GE: [1991], MD: [1991], LT: [1990], LV: [1991], EE: [1991], SI: [1991], HR: [1991], MK: [1991], BA: [1992], ME: [2006], XK: [2008] }, once: 1, sure: 1, hl: 1, stamp: 1, txt: "Le pays proclame son indépendance ; on chante un nouvel hymne, et l’on ne sait pas encore ce que demain coûtera." },
  { id: "solidarnosc", a: [16, 105], ys: [1980], cc: ["PL"], once: 1, sure: 1, stamp: 1, txt: "Les grèves des chantiers navals de Gdańsk : Solidarność est née, et tout le pays parle de l’avenir à voix basse." },
  { id: "oeillets", a: [10, 105], ys: [1974], cc: ["PT"], once: 1, sure: 1, stamp: 1, txt: "La révolution des Œillets : les soldats ont des fleurs au bout du fusil, et la dictature tombe sans bataille." },
  { id: "franco", a: [10, 105], ys: [1975], cc: ["ES"], once: 1, sure: 1, stamp: 1, txt: "Franco est mort ; le pays retient son souffle, puis apprend la démocratie." },
  { id: "mandela-libre", a: [8, 105], ys: [1990], cc: ["ZA"], once: 1, sure: 1, stamp: 1, txt: "Nelson Mandela sort de prison, le poing levé ; la télévision passe les images en boucle." },
  { id: "vote-1994", a: [18, 110], ys: [1994], cc: ["ZA"], once: 1, sure: 1, hl: 1, stamp: 1, txt: "Vote à la première élection libre du pays, dans une file qui serpente sur des kilomètres ; personne ne s’en plaint." },
  { id: "vote-inde", a: [21, 25], cc: ["IN"], y: [1952, 2100], once: 1, txt: "Vote pour la première fois, dans la plus grande élection du monde ; montre fièrement son doigt marqué à l’encre." },
  { id: "vote-femmes", a: [21, 110], sex: "f", on: { US: [1920], GB: [1918], DE: [1919], ES: [1933], BR: [1933], FR: [1945], IT: [1946], JP: [1946], AR: [1951], MX: [1955], CH: [1971], KW: [2006], SA: [2015] }, once: 1, sure: 1, hl: 1, stamp: 1, txt: "Vote pour la première fois : les femmes du pays viennent d’obtenir le droit de vote." },
  { id: "independance", a: [5, 110], on: { IN: [1947], PK: [1947], LK: [1948], MM: [1948], ID: [1949], LY: [1951], MA: [1956], TN: [1956], SD: [1956], GH: [1957], MY: [1957], GN: [1958], SN: [1960], ML: [1960], NE: [1960], BF: [1960], CI: [1960], TG: [1960], BJ: [1960], CM: [1960], TD: [1960], CF: [1960], CG: [1960], GA: [1960], MG: [1960], MR: [1960], CD: [1960], NG: [1960], SO: [1960], CY: [1960], TZ: [1961], SL: [1961], DZ: [1962], UG: [1962], RW: [1962], BI: [1962], JM: [1962], TT: [1962], KE: [1963], MW: [1964], ZM: [1964], MT: [1964], GM: [1965], SG: [1965], BW: [1966], LS: [1966], GY: [1966], BB: [1966], MU: [1968], SZ: [1968], GQ: [1968], FJ: [1970], BD: [1971], BS: [1973], GW: [1974], MZ: [1975], AO: [1975], CV: [1975], ST: [1975], KM: [1975], PG: [1975], SR: [1975], DJ: [1977], SB: [1978], ZW: [1980], VU: [1980], NA: [1990], ER: [1993], TL: [2002], SS: [2011], VN: [1945], PH: [1946], JO: [1946], SY: [1946], LB: [1943], IL: [1948], KR: [1945] }, once: 1, sure: 1, hl: 1, stamp: 1, txt: "L’indépendance est proclamée : on danse dans les rues, on apprend un nouvel hymne, on hisse un nouveau drapeau." },
  { id: "onze-septembre", a: [6, 105], ys: [2001], cc: ["US"], once: 1, sure: 1, stamp: 1, txt: "Le 11 septembre : toute sa vie, {il|elle} se souviendra de l’endroit où {il|elle} se trouvait en voyant les tours tomber." },
  { id: "fukushima", a: [5, 105], ys: [2011], cc: ["JP"], once: 1, sure: 1, stamp: 1, txt: "Le 11 mars, la terre tremble, la mer monte, et la centrale de Fukushima s’emballe ; le pays entier retient son souffle." },
  { id: "brexit", a: [18, 105], ys: [2016], cc: ["GB"], once: 1, sure: 1, stamp: 1, txt: "Le référendum sur le Brexit coupe le pays, et parfois les familles, en deux." },
  { id: "revolution-tn", a: [10, 105], ys: [2011], cc: ["TN"], once: 1, sure: 1, stamp: 1, txt: "La révolution : le président s’enfuit, et le pays découvre en même temps la liberté et l’incertitude." },
  { id: "tahrir", a: [12, 105], ys: [2011], cc: ["EG"], once: 1, sure: 1, stamp: 1, txt: "Dix-huit jours place Tahrir : le pays entier regarde, chante, espère." },
  { id: "iran-1979", a: [10, 105], ys: [1979], cc: ["IR"], once: 1, sure: 1, stamp: 1, txt: "La révolution renverse le chah ; la vie quotidienne, les tenues, la musique, tout change en quelques mois." },
  { id: "chili-1988", a: [18, 105], ys: [1988], cc: ["CL"], once: 1, sure: 1, stamp: 1, txt: "Vote au référendum qui met fin à la dictature ; quand le « non » l’emporte, des inconnus s’embrassent dans les rues." },
  { id: "reformes-cn", a: [16, 105], ys: [1979, 1980, 1981, 1982], cc: ["CN"], u: 0, once: 1, stamp: 1, txt: "Les réformes arrivent au village : on peut de nouveau vendre au marché ce qu’on a cultivé en plus." },
  { id: "doi-moi", a: [16, 105], ys: [1986, 1987, 1988], cc: ["VN"], once: 1, stamp: 1, txt: "Le Đổi Mới, le « renouveau » : les petits commerces rouvrent, la moto remplace le vélo, tout s’accélère." },
  { id: "seisme-1985", a: [5, 105], ys: [1985], cc: ["MX"], once: 1, sure: 1, stamp: 1, txt: "Le grand séisme de Mexico : des voisins fouillent les décombres à mains nues pendant des jours." },
  { id: "maracanazo", a: [5, 105], on: { UY: [1950] }, once: 1, sure: 1, stamp: 1, txt: "Le « Maracanazo » : l’Uruguay bat le Brésil chez lui et devient champion du monde ; le pays ne dort pas." },
  { id: "berne-1954", a: [5, 105], on: { DE: [1954] }, once: 1, sure: 1, stamp: 1, txt: "Le « miracle de Berne » : l’Allemagne de l’Ouest est championne du monde de football, neuf ans après la guerre." },
  { id: "pele-1958", a: [5, 105], on: { BR: [1958] }, once: 1, sure: 1, stamp: 1, txt: "Pelé a dix-sept ans et le Brésil devient champion du monde ; on écoute la finale collé{|e} au poste de radio." },
  { id: "wembley-1966", a: [5, 105], on: { GB: [1966] }, once: 1, sure: 1, stamp: 1, txt: "Wembley : l’Angleterre est championne du monde de football ; on en parlera pendant des décennies." },
  { id: "bresil-1970", a: [5, 105], on: { BR: [1970] }, once: 1, sure: 1, stamp: 1, txt: "Pelé, Jairzinho, Rivelino : le Brésil champion du monde pour la troisième fois, et les premières images en couleur." },
  { id: "maradona-1986", a: [5, 105], on: { AR: [1986] }, once: 1, sure: 1, stamp: 1, txt: "Maradona, la « main de Dieu » puis le but du siècle : l’Argentine championne du monde, le pays en transe." },
  { id: "france-1998", a: [5, 105], on: { FR: [1998] }, once: 1, sure: 1, hl: 1, stamp: 1, txt: "Zidane marque deux fois de la tête : la France est championne du monde, et un million de personnes chantent sur les Champs-Élysées." },
  { id: "espagne-2010", a: [5, 105], on: { ES: [2010] }, once: 1, sure: 1, stamp: 1, txt: "Iniesta marque en prolongation : l’Espagne est championne du monde, et le pays entier descend dans la rue." },
  { id: "allemagne-2014", a: [5, 105], on: { DE: [2014] }, once: 1, sure: 1, stamp: 1, txt: "L’Allemagne championne du monde au Brésil, après une demi-finale gagnée 7 à 1 contre le pays hôte." },
  { id: "messi-2022", a: [5, 105], on: { AR: [2022] }, once: 1, sure: 1, hl: 1, stamp: 1, txt: "Messi soulève enfin la Coupe du monde ; à Buenos Aires, l’Obélisque disparaît sous la foule." },
  { id: "champions-monde", a: [5, 105], on: { UY: [1930], IT: [1934, 1938, 1982, 2006], BR: [1962, 1994, 2002], DE: [1974, 1990], AR: [1978], FR: [2018] }, gap: 1, sure: 1, stamp: 1, txt: "Le pays est champion du monde de football : on klaxonne, on chante, on dort peu." },
  { id: "championnes-monde", a: [5, 105], on: { US: [1991, 1999, 2015, 2019], NO: [1995], DE: [2003, 2007], JP: [2011], ES: [2023] }, gap: 1, sure: 1, stamp: 1, txt: "L’équipe féminine est championne du monde de football ; des petites filles collent des posters dans leur chambre." },
  { id: "vuvuzelas", a: [5, 105], on: { ZA: [2010] }, once: 1, sure: 1, stamp: 1, txt: "La Coupe du monde se joue en Afrique pour la première fois ; les vuvuzelas résonnent dans tout le pays." },
  { id: "jeux-olympiques", a: [6, 105], on: { GB: [1948, 2012], FI: [1952], AU: [1956, 2000, 2032], IT: [1960], JP: [1964, 2021], MX: [1968], DE: [1972], CA: [1976], RU: [1980], US: [1984, 1996, 2028], KR: [1988], ES: [1992], GR: [2004], CN: [2008], BR: [2016], FR: [1924, 2024] }, gap: 1, sure: 1, stamp: 1, txt: "Les Jeux olympiques se tiennent dans le pays ; on suit les épreuves avec une fierté qu’on ne se connaissait pas." },
]);

// --- Nature et climat ----------------------------------------------------------------------------
scenes("Nature et climat", "life", [
  { id: "inondation-mousson", a: [3, 95], cc: ["BD", "IN", "PK", "NP", "MM"], t: [0, 2], txt: "La mousson inonde la maison ; l’eau monte jusqu’aux genoux, on sauve ce qu’on peut sur les étagères.", fx: { cost: 0.03, happy: -2 } },
  { id: "typhon", a: [3, 95], cc: ["@typhoon"], txt: "Un typhon passe sur la région ; on scotche les fenêtres et on attend dans le noir que le vent se calme.", fx: { happy: -1 } },
  { id: "toit-arrache", a: [3, 95], cc: ["PH", "VN", "BD", "MM", "MG", "MZ", "HT", "HN", "NI", "CU", "DO", "FJ", "VU", "TO"], t: [0, 2], txt: "Le cyclone arrache le toit de la maison ; on reconstruit avec les voisins, tôle après tôle.", fx: { cost: 0.05, happy: -3 } },
  { id: "ouragan-evacuation", a: [5, 95], cc: ["US"], t: [3, 5], txt: "Un ouragan force à évacuer ; on revient trouver la maison abîmée, et un long formulaire d’assurance.", fx: { happy: -2 } },
  { id: "seisme-nuit", a: [3, 100], cc: ["@quake"], gap: 18, txt: ["La terre tremble pendant la nuit ; tout le quartier dort dehors pendant une semaine.", "Une secousse fait tomber la vaisselle des étagères ; pendant des jours, on sursaute au moindre grondement."], fx: { happy: -2 } },
  { id: "puits-sec", a: [3, 95], cc: ["@drought"], g: [0, 15000], txt: "La sécheresse s’installe ; le puits s’assèche, et il faut marcher deux fois plus loin pour l’eau.", fx: { happy: -2, health: -1 } },
  { id: "secheresse-troupeau", a: [10, 85], cc: ["@sahel", "@horn", "@safr"], u: 0, g: [0, 15000], is: "j:herder,farmer", txt: "La sécheresse emporte une partie du troupeau ; on vend les bêtes qui restent avant qu’elles maigrissent.", fx: { happy: -3, herd: -0.3 } },
  { id: "incendies", a: [5, 100], cc: ["@fire"], y: [1990, 2100], txt: "Les incendies approchent ; pendant des jours, la fumée cache le soleil et les cendres tombent sur les voitures.", fx: { health: -1 } },
  { id: "grand-froid", a: [5, 100], cc: ["@cold"], txt: "Un hiver à −35 °C : la voiture ne démarre plus, et l’on dort avec deux bonnets." },
  { id: "smog-yourtes", a: [3, 95], cc: ["MN"], u: 1, y: [2000, 2100], txt: "En hiver, la fumée des poêles des quartiers de yourtes noie la capitale dans un brouillard âcre.", fx: { health: -1 } },
  { id: "ecole-neige", a: [5, 14], g: [20000, 1e9], r: ["EUR", "NAM"], y: [1900, 2040], is: "school", txt: "L’école ferme pour cause de neige : bataille de boules de neige, puis chocolat chaud." },
  { id: "volcan", a: [5, 100], cc: ["ID", "PH", "GT", "EC", "IS", "IT"], w: 0.3, txt: "Le volcan gronde ; une fine cendre grise recouvre les toits pendant une semaine." },
  { id: "chaleur-records", a: [5, 105], y: [2035, 2100], gap: 15, txt: ["Une nouvelle vague de chaleur bat les records ; on vit la nuit, on dort le jour.", "L’été s’étire jusqu’en octobre ; les anciens disent que ce n’était pas comme ça avant.", "Une alerte canicule de plus ; on garde les volets clos et l’on prend des nouvelles des voisins âgés."], fx: { health: -1 } },
  { id: "hivers-autrefois", a: [50, 105], r: ["EUR", "NAM", "EAS"], g: [15000, 1e9], y: [2045, 2100], txt: "Raconte aux enfants les hivers de neige d’autrefois ; ils écoutent comme on écoute un conte." },
  { id: "mer-monte", a: [10, 105], cc: ["KI", "MH", "MV", "BD", "FM"], y: [2040, 2100], txt: "La mer gagne du terrain chaque année ; il faut surélever la maison, puis déplacer le village.", fx: { happy: -2 } },
  { id: "moussons-folles", a: [10, 105], cc: ["@monsoon"], y: [2040, 2100], txt: "Les moussons sont devenues imprévisibles : un mois de déluge, puis plus rien." },
]);

// --- Insécurité -----------------------------------------------------------------------------------
scenes("Insécurité", "life", [
  { id: "coups-de-feu", a: [8, 85], u: 1, cs: { hom: [20, 1e9] }, heavy: 1, txt: "Entend des coups de feu la nuit ; on ne sort plus après la tombée du jour.", fx: { happy: -2 } },
  { id: "fusillades", a: [6, 70], cc: ["BR"], u: 1, p: [0, 0.35], y: [1985, 2100], heavy: 1, txt: "Les fusillades entre police et trafiquants obligent toute la famille à s’allonger dans le couloir, loin des fenêtres.", fx: { happy: -3 } },
  { id: "disparitions", a: [12, 85], cc: ["MX"], y: [2007, 2100], heavy: 1, txt: "Dans la région, des gens disparaissent ; on évite certaines routes et on prévient quand on est arrivé.", fx: { happy: -2 } },
  { id: "barbeles", a: [5, 90], cc: ["ZA"], t: [3, 5], u: 1, txt: "La maison est entourée de barbelés, de barreaux et d’une alarme reliée à une société de sécurité." },
  { id: "braquage", a: [16, 75], u: 1, cs: { hom: [10, 1e9] }, heavy: 1, txt: "Se fait braquer en rentrant du travail ; ce n’était que de l’argent, se répète-t-{il|elle}.", fx: { happy: -4, cost: 0.01 } },
  { id: "pere-alcool", a: [5, 15], is: "father", w: 0.25, heavy: 1, txt: "Les soirs où son père a bu, la maison retient son souffle.", fx: { happy: -3 } },
  { id: "barrage-police", a: [16, 85], g: [0, 20000], r: ["SSA", "MENA", "SAS"], txt: "Sur la route, un barrage de police ; on tend ses papiers, avec un billet plié dedans.", fx: { cost: 0.005 } },
]);

// --- Technologies ---------------------------------------------------------------------------------
scenes("Technologies", "life", [
  { id: "poste-radio", a: [16, 85], y: [1925, 1965], t: [2, 5], once: 1, txt: "Achète un poste de radio ; le soir, toute la maisonnée se réunit autour pour écouter les nouvelles et les chansons." },
  { id: "transistor", a: [8, 85], y: [1960, 2005], t: [0, 2], g: [0, 8000], once: 1, txt: "Un transistor à piles entre dans la maison : les nouvelles et la musique arrivent jusqu’au village." },
  { id: "tele-noir-blanc", a: [5, 85], y: [1952, 1978], t: [3, 5], g: [3000, 25000], once: 1, txt: "La première télévision arrive à la maison, en noir et blanc ; les voisins viennent regarder les émissions du soir." },
  { id: "tele-couleur", a: [5, 85], y: [1970, 1992], t: [3, 5], g: [0, 35000], once: 1, txt: "La télévision en couleur arrive au salon ; on redécouvre les maillots des équipes de foot." },
  { id: "tele-batterie", a: [5, 85], y: [1985, 2015], t: [1, 2], u: 0, g: [0, 10000], once: 1, txt: "Une télévision arrive à la maison, branchée sur une batterie de voiture ; tout le voisinage vient voir le feuilleton." },
  { id: "telephone-fixe", a: [10, 85], y: [1955, 1995], t: [3, 5], g: [4000, 30000], once: 1, txt: "Le téléphone est enfin installé à la maison, après des mois d’attente ; on parle fort, comme si la distance l’exigeait." },
  { id: "machine-laver", a: [20, 75], y: [1955, 2005], t: [3, 5], g: [4000, 28000], once: 1, txt: "Une machine à laver entre dans la maison ; ce sont des heures gagnées chaque semaine, surtout pour les femmes." },
  { id: "ordinateur", a: [8, 75], y: [1984, 2005], t: [3, 5], once: 1, txt: "Un ordinateur arrive à la maison ; on se dispute pour y jouer, et personne ne sait vraiment s’en servir." },
  { id: "modem", a: [10, 75], y: [1995, 2008], t: [3, 5], once: 1, txt: "Se connecte à internet pour la première fois ; le modem grince, une page met une minute à s’afficher, c’est magique." },
  { id: "cybercafe", a: [12, 45], y: [1998, 2012], t: [1, 3], g: [0, 25000], once: 1, txt: "Découvre internet dans un cybercafé, payé à l’heure ; y ouvre sa première adresse électronique." },
  { id: "portable", a: [14, 80], y: [1996, 2011], t: [2, 5], once: 1, txt: "Achète son premier téléphone portable ; il sert surtout à envoyer des SMS et à jouer au serpent." },
  { id: "portable-occasion", a: [14, 80], y: [2003, 2016], t: [0, 1], once: 1, txt: "Achète un téléphone portable d’occasion ; c’est le premier de toute la famille, et chacun vient l’emprunter.", fx: { rel: 1 } },
  { id: "smartphone", a: [12, 85], y: [2010, 2100], t: [1, 5], once: 1, txt: "Achète son premier smartphone ; le monde entier tient désormais dans sa poche." },
  { id: "reseau-social", a: [14, 60], y: [2006, 2100], t: [1, 5], once: 1, txt: "Ouvre un compte sur un réseau social ; retrouve des camarades d’école perdus de vue." },
  { id: "ia-questions", a: [10, 75], y: [2024, 2100], t: [2, 5], once: 1, txt: "Pose ses questions à une intelligence artificielle, comme on consultait autrefois l’encyclopédie." },
  { id: "teleconsultation", a: [30, 100], u: 0, y: [2030, 2100], t: [1, 4], once: 1, kind: "health", txt: "Consulte un médecin par vidéo, depuis le village ; l’infirmière tient la tablette." },
]);

// --- Vieillesse ------------------------------------------------------------------------------------
scenes("Vieillesse", "life", [
  { id: "dominos", a: [60, 105], cc: ["CU", "DO", "PR", "VE", "PA", "CO"], txt: "Joue aux dominos sur le trottoir avec les anciens du quartier ; les pièces claquent sur la table jusqu’à la nuit." },
  { id: "mah-jong", a: [55, 105], cc: ["CN", "HK", "TW", "SG", "MO"], txt: "Joue au mah-jong tous les après-midi ; le bruit des tuiles est la musique de sa retraite." },
  { id: "echecs-parc", a: [55, 105], cc: ["RU", "UA", "AM", "GE", "BY"], txt: "Joue aux échecs dans le parc avec d’autres retraités ; les spectateurs donnent des conseils que personne n’a demandés." },
  { id: "petanque", a: [55, 105], cc: ["FR", "MC"], txt: "Joue à la pétanque sur la place du village ; on mesure au mètre ruban et on se dispute pour un centimètre." },
  { id: "trictrac", a: [55, 105], cc: ["TR", "GR", "CY", "LB", "SY", "IR"], txt: "Joue au trictrac au café, chaque après-midi, contre le même adversaire depuis trente ans." },
  { id: "palabres", a: [60, 105], r: ["SSA"], u: 0, txt: "On vient lui demander conseil sous l’arbre à palabres ; ici, l’âge donne la parole.", fx: { happy: 2, rel: 1 } },
  { id: "baduk", a: [60, 105], cc: ["KR"], sex: "m", txt: "Joue au baduk dans le parc avec d’autres grands-pères, en commentant l’actualité." },
  { id: "danse-place", a: [55, 90], cc: ["CN"], y: [1995, 2100], u: 1, txt: "Danse le soir sur la place du quartier avec d’autres retraités, au son d’une enceinte portable ; les voisins se plaignent, eux s’en moquent.", fx: { health: 1, happy: 2, rel: 1 } },
  { id: "pension-reguliere", a: [62, 105], is: "pension", once: 1, txt: "La pension tombe chaque mois, modeste mais régulière ; c’est une paix qu’on n’a pas toujours eue." },
  { id: "sans-pension", a: [65, 105], is: "nopension", t: [0, 2], txt: "Sans pension, continue de travailler aussi longtemps que le dos le permet." },
  { id: "aide-des-enfants", a: [65, 105], is: "nopension grown", g: [0, 20000], txt: "Vit de l’aide de ses enfants ; on n’en parle pas, c’est comme ça que ça marche ici.", fx: { rel: 1 } },
  { id: "beignets-porte", a: [65, 95], is: "nopension", t: [0, 1], sex: "f", txt: "Vend quelques beignets devant la porte pour avoir de quoi acheter ses médicaments." },
  { id: "cartons", a: [68, 95], cc: ["KR"], p: [0, 0.3], y: [1995, 2100], txt: "Ramasse des cartons dans les rues avec une charrette, pour compléter une pension trop maigre.", fx: { health: -1 } },
  { id: "petit-boulot-jp", a: [66, 80], cc: ["JP"], is: "retired", txt: "Retraité{|e}, reprend un petit travail : guider les piétons devant un chantier, casque sur la tête et bâton lumineux à la main." },
  { id: "hiver-au-sud", a: [62, 90], is: "retired", t: [3, 5], cc: ["DE", "GB", "NL", "BE", "SE", "NO", "DK", "FI", "CA", "US", "IE", "CH", "AT"], y: [1975, 2100], txt: "Passe ses hivers au soleil, dans le sud, avec d’autres retraités du nord ; on y joue aux cartes en short en janvier." },
  { id: "croisiere", a: [62, 90], is: "retired", t: [4, 5], y: [1980, 2100], once: 1, txt: "Part en croisière avec d’autres retraités ; garde le menu du dîner du capitaine." },
  { id: "lecture-benevole", a: [62, 85], is: "retired", g: [15000, 1e9], txt: "Donne des cours de lecture bénévoles aux enfants du quartier ; c’est le meilleur moment de sa semaine.", fx: { happy: 2, rel: 2 } },
  { id: "comment-c-etait", a: [60, 110], is: "grandkids", gap: 20, txt: ["Raconte à ses petits-enfants comment c’était, avant ; ils ont du mal à {le|la} croire.", "Apprend à ses petits-enfants une chanson de sa jeunesse ; ils la chantent de travers, c’est parfait."] },
  { id: "appels-video", a: [60, 105], is: "grandkids", y: [2012, 2100], t: [2, 5], once: 1, txt: "Apprend à faire des appels vidéo pour voir ses petits-enfants ; tient la tablette trop près du visage." },
  { id: "enterrements", a: [78, 110], gap: 15, txt: ["Les enterrements des amis se succèdent ; on raye des noms dans le carnet d’adresses.", "Fait partie des derniers de sa génération dans le quartier ; on {le|la} salue avec une sorte de respect étonné."], fx: { happy: -1, rel: -1 } },
  { id: "jours-longs", a: [75, 110], g: [25000, 1e9], is: "lonely", txt: "Les journées sont longues ; le téléphone sonne rarement, mais la boulangère connaît son prénom.", fx: { happy: -2 } },
  { id: "aide-domicile", a: [80, 110], g: [25000, 1e9], once: 1, txt: "Une aide à domicile passe chaque matin ; c’est la visite qu’{il|elle} attend le plus." },
  { id: "enfants-relais", a: [80, 110], is: "grown", g: [0, 25000], txt: "Ses enfants se relaient pour s’occuper de {lui|elle} ; la maison ne désemplit pas.", fx: { rel: 2 } },
  { id: "testament", a: [70, 100], t: [3, 5], once: 1, kind: "money", txt: "Rédige son testament chez le notaire ; en ressort étrangement léger{|ère}." },
  { id: "quatre-vingt-dix", a: [90, 90], once: 1, sure: 1, txt: "Fête ses quatre-vingt-dix ans ; on chante, on pleure un peu, on ressort les vieilles photos.", fx: { happy: 2, rel: 2 } },
  { id: "cent-ans", a: [100, 100], once: 1, sure: 1, hl: 1, txt: "Fête ses cent ans ; le maire vient en personne, et les plus jeunes de la famille soufflent les bougies." },
  { id: "cent-ans-jp", a: [100, 100], cc: ["JP"], y: [1963, 2100], once: 1, sure: 1, txt: "Reçoit, pour ses cent ans, une coupe en argent offerte par le gouvernement, comme tous les centenaires du pays." },
]);

// --- Petites décisions -----------------------------------------------------------------------------
// Des choix ordinaires, dont certains se dénouent des années plus tard.
scenes("Petites décisions", "family", [
  { id: "d-pret-cousin", a: [25, 65], t: [2, 5], is: "native", gap: 15, kind: "money", ask: {
    q: "Un cousin demande {$0.15} pour lancer son commerce. Lui prêter ?",
    opts: [
      { label: "Prêter l’argent", w: 1.2, txt: "Prête {$0.15} à un cousin pour son commerce.", fx: { cost: 0.15, rel: 2 }, set: "pretCousin" },
      { label: "Refuser", w: 1, txt: "Refuse de prêter de l’argent au cousin ; le repas de famille suivant est un peu froid.", fx: { rel: -2 } },
    ] } },
  { id: "pret-rembourse", a: [27, 100], need: "pretCousin", after: 2, clear: "pretCousin", w: 1.2, kind: "money", txt: "Le cousin rembourse le prêt, avec un cadeau en plus : le commerce a marché.", fx: { gain: 0.17, happy: 2, rel: 2 } },
  { id: "pret-perdu", a: [27, 100], need: "pretCousin", after: 2, clear: "pretCousin", kind: "money", txt: "L’argent prêté au cousin ne reviendra pas ; on n’en parle plus aux repas de famille.", fx: { rel: -2, happy: -2 } },
  { id: "d-recolte", a: [18, 75], t: [0, 1], is: "j:farmer,farmhand,herder", u: 0, gap: 10, kind: "money", ask: {
    q: "La récolte est mauvaise. Comment tenir jusqu’à la prochaine ?",
    opts: [
      { label: "Vendre des bêtes", if: "herd", w: 2, txt: "Vend une partie des bêtes pour tenir jusqu’à la récolte.", fx: { herd: -0.4, happy: -2 } },
      { label: "Emprunter à l’usurier", w: 1, txt: "Emprunte à l’usurier du village, à un taux qui fait peur.", fx: { debt: 0.12, happy: -1 } },
      { label: "Se serrer la ceinture", w: 1.5, txt: "Toute la famille se serre la ceinture jusqu’à la récolte : un repas par jour.", fx: { health: -3, happy: -2 } },
    ] } },
  { id: "d-frais-ecole", a: [22, 65], t: [0, 1], is: "schoolkid", g: [0, 15000], gap: 6, kind: "money", ask: {
    q: "Les frais de scolarité de {enfant} tombent : {$0.06}. Payer ?",
    opts: [
      { label: "Payer, quitte à se priver", w: 3, txt: "Paie l’école de {enfant}, quitte à se priver.", fx: { cost: 0.06, fund: 0.06, happy: -1 } },
      { label: "Garder {enfant} à la maison", w: 1, txt: "{enfant} reste à la maison cette année, pour aider.", fx: { rel: -2, happy: -2 } },
    ] } },
  { id: "d-parent-age", a: [30, 75], is: "oldParent", once: 1, ask: {
    q: "{parent} ne peut plus vivre {parent:seul|seule}. Que faire ?",
    opts: [
      { label: "L’accueillir chez soi", w: 3, txt: "Accueille {parent} à la maison ; les journées sont plus pleines, et plus lourdes.", fx: { rel: 4, happy: -1, health: -1, cost: 0.03 } },
      { label: "Une maison de retraite", if: "richland", w: 1, txt: "Installe {parent} dans une maison de retraite ; s’y rend chaque dimanche.", fx: { cost: 0.3, rel: -1 } },
      { label: "Payer une aide à domicile", if: "richland", w: 1, txt: "Engage une aide à domicile pour {parent}, et appelle chaque soir.", fx: { cost: 0.15 } },
      { label: "Demander aux voisins de passer", if: "!richland", w: 1, txt: "Laisse {parent} chez {parent:lui|elle} ; une voisine passe chaque jour.", fx: { rel: -2 } },
    ] } },
  { id: "d-pot-de-vin", a: [18, 75], g: [0, 25000], gap: 12, kind: "money", ask: {
    q: "Au guichet, un fonctionnaire laisse entendre qu’un « petit cadeau » accélérerait le dossier. Payer ?",
    opts: [
      { label: "Glisser un billet", w: 2, txt: "Glisse un billet dans le dossier ; le tampon arrive dans l’heure.", fx: { cost: 0.01, happy: -1 } },
      { label: "Refuser", w: 1, out: [
        { p: 0.5, txt: "Refuse de payer ; le dossier dort trois mois de plus dans un tiroir.", fx: { happy: -2 } },
        { p: 0.5, txt: "Refuse de payer ; un autre guichetier traite le dossier, sans rien demander.", fx: { happy: 2 } },
      ] },
    ] } },
  { id: "d-mariage-fratrie", a: [20, 60], cc: ["IN", "PK", "BD", "NP"], o: 1, t: [0, 3], is: "sibs", once: 1, ask: {
    q: "La famille marie {fratrie} ; on attend sa part de la dépense : {$0.15}. Participer ?",
    opts: [
      { label: "Participer", w: 3, txt: "Participe aux frais du mariage de {fratrie} ; la fête est belle, le compte est vide.", fx: { cost: 0.15, rel: 4, happy: 1 } },
      { label: "Refuser", w: 1, txt: "Refuse de payer pour le mariage de {fratrie} ; la famille ne l’oubliera pas de sitôt.", fx: { rel: -5 } },
    ] } },
  { id: "d-tontine", a: [20, 70], t: [0, 3], r: ["SSA"], gap: 10, kind: "money", ask: {
    q: "Les voisines proposent d’entrer dans une tontine : {$0.1} à verser, et la cagnotte quand viendra son tour. Entrer ?",
    opts: [
      { label: "Entrer dans la tontine", w: 2, txt: "Entre dans la tontine du quartier.", fx: { cost: 0.1, rel: 2 }, set: "tontine" },
      { label: "Garder son argent", w: 1, txt: "Préfère garder son argent sous la main." },
    ] } },
  { id: "tontine-tour", a: [21, 100], need: "tontine", after: 1, clear: "tontine", w: 6, kind: "money", txt: "Son tour de tontine arrive : la cagnotte entière, d’un coup ; on rembourse une dette et on achète une chèvre.", fx: { gain: 0.11, happy: 3 } },
  { id: "tontine-envolee", a: [21, 100], need: "tontine", after: 1, clear: "tontine", kind: "money", txt: "La trésorière de la tontine disparaît avec la caisse ; tout le quartier est en colère.", fx: { happy: -4, rel: -1 } },
  { id: "d-golfe", a: [20, 40], sex: "m", cc: ["IN", "PK", "BD", "NP", "LK", "PH"], t: [0, 2], is: "native !student", once: 1, kind: "move", ask: {
    q: "Un recruteur propose un contrat sur un chantier du Golfe, contre {$0.4} de frais d’agence. Partir ?",
    opts: [
      { label: "Signer le contrat", w: 1.2, run: "gulf", txt: "Signe un contrat pour un chantier du Golfe ; emprunte les frais d’agence à la famille." },
      { label: "Rester au pays", w: 1, txt: "Refuse le contrat du Golfe et reste près des siens." },
    ] } },
  { id: "d-exode", a: [16, 30], u: 0, g: [0, 25000], is: "renter alone native !student", once: 1, kind: "move", ask: {
    q: "Un cousin propose de {le|la} loger en ville le temps de trouver du travail. Partir ?",
    opts: [
      { label: "Partir en ville", w: 1.5, run: "city", txt: "Quitte le village pour la ville, un sac sur l’épaule, et dort sur le canapé d’un cousin." },
      { label: "Rester au village", w: 1, txt: "Reste au village ; la ville attendra." },
    ] } },
  { id: "d-usine-cote", a: [16, 28], cc: ["CN"], u: 0, y: [1985, 2025], is: "renter native !student", once: 1, kind: "move", ask: {
    q: "Une usine de la côte embauche des jeunes du village. Partir y travailler ?",
    opts: [
      { label: "Partir à l’usine", w: 2, run: "factory", txt: "Part travailler dans une usine de la côte, avec trois amis du village." },
      { label: "Rester", w: 1, txt: "Reste au village, près des parents." },
    ] } },
  { id: "d-vacances", a: [25, 60], t: [2, 3], is: "kids", gap: 12, kind: "money", ask: {
    q: "Un peu d’argent est de côté. Partir en vacances avec les enfants, ou garder cette épargne ?",
    opts: [
      { label: "Partir en vacances", w: 1.5, txt: "Part une semaine en vacances avec les enfants ; on en parlera longtemps.", fx: { cost: 0.06, happy: 4, rel: 3 } },
      { label: "Garder l’épargne", w: 1, txt: "Garde l’argent de côté ; les vacances, ce sera pour plus tard." },
    ] } },
  { id: "d-chiot", a: [25, 60], t: [1, 5], is: "schoolkid", once: 1, ask: {
    q: "Un chiot errant a suivi {enfant} jusqu’à la maison. Le garder ?",
    opts: [
      { label: "Le garder", w: 2, txt: "Le chiot reste ; {enfant} lui trouve un nom ridicule que tout le monde adopte.", fx: { happy: 3, rel: 1, cost: 0.005 } },
      { label: "Refuser", w: 1, txt: "Le chiot repart ; {enfant} boude toute la semaine.", fx: { happy: -1 } },
    ] } },
]);

// --- Moteur -------------------------------------------------------------------------------------
const TIER_CUTS = [1500, 4000, 10000, 25000, 60000];
const TIER_LABEL = ["survie", "précarité", "modeste", "classe moyenne", "aisance", "grande aisance"];
const MOMENT_GAP = 15;

// Pays d'une liste : codes, zones (« @zone ») ou régions entières (« #RÉGION »).
function expandCodes(list) {
  const out = new Set();
  for (const x of list) {
    if (x[0] === "@") expandCodes(ZONES[x.slice(1)].split(" ")).forEach(c => out.add(c));
    else if (x[0] === "#") COUNTRIES.filter(c => c.region === x.slice(1)).forEach(c => out.add(c.code));
    else out.add(x);
  }
  return out;
}

// Les personnes qu'un moment peut nommer, et les conditions qui les choisissent.
const KID_F = { kids: a => a < 18, baby: a => a <= 2, toddler: a => a >= 3 && a <= 5, schoolkid: a => a >= 6 && a <= 12, teenkid: a => a >= 13 && a <= 17, grown: a => a >= 18, kidstart: a => a === 6 };
const PARENT_F = { mother: p => p.sex === "f", father: p => p.sex === "m", parent: () => true, oldParent: p => p.age >= 75 };
const SIB_F = { sibs: () => true, youngsib: (s, L) => s.born > 0 && L.age - s.born < 10, oldsib: s => s.born < 0 };
const PERSON_KEYS = ["enfant", "parent", "mere", "pere", "fratrie", "conjoint"];
const jobOf = L => L.jobInfo && !L.retired ? L.jobInfo : null;
const IS = {
  married: L => L.married,
  single: L => !L.married && !L.marriedEver,
  alone: L => !L.married,
  newlywed: L => L.married && !L.marriedForced && L.marriedAt != null && L.age - L.marriedAt <= 1 && L.weddingAt !== L.marriedAt,
  divorced: L => !L.married && L.divorcedAt != null && L.age - L.divorcedAt <= 2,
  widowed: L => !L.married && L.widowedAt != null && L.age - L.widowedAt <= 3,
  bothParents: L => L.parents.filter(p => p.alive).length >= 2,
  firstjob: L => L.firstJobAt != null && L.age - L.firstJobAt <= 1,
  nokids: L => !L.children.some(k => k.alive),
  grandkids: L => L.grandkids > 0,
  student: L => !!L.schooling,
  school: L => L.schooling === "primaire" || L.schooling === "secondaire",
  primary: L => L.schooling === "primaire",
  secondary: L => L.schooling === "secondaire",
  uni: L => L.schooling === "universite",
  unschooled: L => L.age >= 6 && L.age < 18 && !L.schooling,
  degree: L => L.edu === "universite",
  firstgen: L => (L.schooling === "universite" || L.edu === "universite") && L.parents.every(p => !p.edu || EDU_RANK[p.edu] <= 1),
  working: L => (!!L.job || !!L.business) && !L.retired,
  employee: L => !!L.job && !L.business && !L.retired && !(L.jobInfo && L.jobInfo.self),
  jobless: L => L.age >= 18 && !L.job && !L.business && !L.retired && !L.homemaker && !L.schooling,
  homemaker: L => !!L.homemaker && !L.job,
  retired: L => L.retired,
  business: L => !!L.business,
  self: L => !!(jobOf(L) && jobOf(L).self),
  emigrant: L => L.emigrated,
  native: L => !L.emigrated,
  owner: L => !!L.house,
  renter: L => !L.house,
  nobank: L => !L.bank,
  saver: L => L.savings > median(L.here),
  sad: L => L.stats.happy < 30,
  lonely: L => L.stats.rel < 35,
  pension: L => L.retired && L.pension >= median(L.here) * 0.3,
  nopension: L => L.age >= 65 && (!L.retired || L.pension < median(L.here) * 0.3),
  herd: L => (L.assets.livestock || 0) > 0,
  richland: L => L.here.gdp > 25000,
  s: (L, arg) => !!(jobOf(L) && arg.includes(jobOf(L).sector)),
  j: (L, arg) => !!(jobOf(L) && arg.includes(jobOf(L).id)),
  wed: (L, arg) => L.married && !L.marriedForced && L.marriedAt != null && L.age - L.marriedAt === +arg[0],
};
function parseIs(s) {
  return (s || "").split(/\s+/).filter(Boolean).map(tok => {
    const neg = tok[0] === "!", body = neg ? tok.slice(1) : tok, i = body.indexOf(":");
    return { neg, name: i < 0 ? body : body.slice(0, i), arg: i < 0 ? null : body.slice(i + 1).split(",") };
  });
}
const allTexts = m => [m.txt, m.ask && m.ask.q, ...(m.ask ? m.ask.opts.flatMap(o => [o.label, o.txt, ...(o.out || []).map(x => x.txt)]) : [])].flat().filter(Boolean);

// Préparation unique : pays dépliés, conditions lues, personnes nommées. Tous les
// moments prennent la même forme (mêmes champs, dans le même ordre), ce qui rend
// leur lecture bien plus rapide à chaque année simulée.
const MOMENT_FIELDS = ["theme", "kind", "id", "a", "y", "ys", "t", "p", "g", "r", "cc", "not", "cy", "on", "cs", "o", "from", "u", "sex", "is", "w", "odds", "once", "gap", "sure", "txt", "fx", "heavy", "hl", "stamp", "set", "need", "after", "clear", "ask", "unless"];
MOMENTS.forEach((raw, i) => {
  const m = {};
  for (const k of MOMENT_FIELDS) m[k] = raw[k] ?? null;
  m._keys = Object.keys(raw);
  m._cc = m.cc ? expandCodes(m.cc) : null;
  m._not = m.not ? expandCodes(m.not) : null;
  m._from = m.from ? expandCodes(m.from) : null;
  m._is = parseIs(m.is);
  m._wedding = m._is.some(c => c.name === "newlywed" && !c.neg);
  const txt = allTexts(m).join(" ");
  m._uses = PERSON_KEYS.filter(k => new RegExp(`\\{${k}[}:]`).test(txt));
  if (m.ask) m.ask.opts.forEach(o => { o._if = parseIs(o.if); });
  MOMENTS[i] = m;
});

// Choisit les personnes du moment ; faux si les conditions ne sont pas réunies.
function castPeople(L, m, vars) {
  let kidF = null, parentF = null, sibF = null;
  for (const c of m._is) {
    const kf = KID_F[c.name], pf = PARENT_F[c.name], sf = SIB_F[c.name];
    if (kf) {
      const any = L.children.some(k => k.alive && kf(L.age - k.born));
      if (c.neg) { if (any) return false; } else { const prev = kidF; kidF = prev ? a => prev(a) && kf(a) : kf; }
    } else if (pf) {
      const any = L.parents.some(p => p.alive && pf(p));
      if (c.neg) { if (any) return false; } else { const prev = parentF; parentF = prev ? p => prev(p) && pf(p) : pf; }
    } else if (sf) {
      const any = L.sibs.some(s => s.alive && s.born <= L.age && sf(s, L));
      if (c.neg) { if (any) return false; } else { const prev = sibF; sibF = prev ? (s, l) => prev(s, l) && sf(s, l) : sf; }
    } else if (!IS[c.name]) {
      return false;
    } else if (!!IS[c.name](L, c.arg) === c.neg) return false;
  }
  const uses = k => m._uses.includes(k);
  if (kidF || uses("enfant")) {
    if (!vars.enfant) {
      const list = L.children.filter(k => k.alive && (!kidF || kidF(L.age - k.born)));
      if (!list.length) return false;
      const k = pick(list); vars.enfant = { name: k.name, sex: k.sex };
    }
  }
  if (parentF || uses("parent") || uses("mere") || uses("pere")) {
    if (!vars.parent) {
      const f = uses("mere") ? p => p.sex === "f" : uses("pere") ? p => p.sex === "m" : () => true;
      const list = L.parents.filter(p => p.alive && f(p) && (!parentF || parentF(p)));
      if (!list.length) return false;
      const p = pick(list); vars.parent = { name: p.name, sex: p.sex };
    }
    if (uses("mere") && vars.parent.sex !== "f") return false;
    if (uses("pere") && vars.parent.sex !== "m") return false;
    vars.mere = vars.pere = vars.parent;
  }
  if (sibF || uses("fratrie")) {
    if (!vars.fratrie) {
      const list = L.sibs.filter(s => s.alive && s.born <= L.age && (!sibF || sibF(s, L)));
      if (!list.length) return false;
      const s = pick(list); vars.fratrie = { name: s.name, sex: s.sex };
    }
  }
  if (uses("conjoint")) {
    if (!L.married) return false;
    vars.conjoint = { name: L.partner, sex: L.sex === "m" ? "f" : "m" };
  }
  return true;
}
// Les personnes d'un fil narratif sont-elles toujours là ?
function stillHere(L, vars) {
  if (vars.enfant && !L.children.some(k => k.alive && k.name === vars.enfant.name)) return false;
  if (vars.parent && !L.parents.some(p => p.alive && p.name === vars.parent.name)) return false;
  if (vars.fratrie && !L.sibs.some(s => s.alive && s.name === vars.fratrie.name)) return false;
  return true;
}

// Les personnes d'un moment, ou null s'il ne peut pas arriver cette année.
function momentFits(L, m, X) {
  const a = L.age, y = X.year;
  if (m.heavy && L.classroom) return null;
  if (m.odds && rand() > m.odds) return null;
  if (m.a && (a < m.a[0] || a > m.a[1])) return null;
  if (m.y && (y < m.y[0] || y > m.y[1])) return null;
  if (m.ys && !m.ys.includes(y)) return null;
  if (m.sex && m.sex !== L.sex) return null;
  if (m.u != null && !!m.u !== !!L.urban) return null;
  if (m.t && (X.tier < m.t[0] || X.tier > m.t[1])) return null;
  if (m.p && (X.p < m.p[0] || X.p > m.p[1])) return null;
  if (!m.p && m.t && m.t[1] <= 1 && X.p > 0.75) return null;
  if (m.g && (X.gdp < m.g[0] || X.gdp > m.g[1])) return null;
  const code = m.o ? L.home : L.code;
  if (m.r && !m.r.includes(BY_CODE[code].region)) return null;
  if (m._cc && !m._cc.has(code)) return null;
  if (m._not && m._not.has(code)) return null;
  if (m._from && (!L.emigrated || !m._from.has(L.home))) return null;
  if (m.cy) { const span = m.cy[code]; if (!span || y < span[0] || y > span[1]) return null; }
  if (m.on) { const ys = m.on[code]; if (!ys || !ys.includes(y)) return null; }
  if (m.cs) for (const k in m.cs) { const v = X.c[k]; if (v < m.cs[k][0] || v > m.cs[k][1]) return null; }
  if (m.unless && m.unless.some(id => L.seen[id] != null)) return null;
  const seen = L.seen[m.id];
  if (seen != null && (m.once || a - seen < (m.gap ?? MOMENT_GAP))) return null;
  let vars = {};
  if (m.need) {
    const f = L.flags[m.need];
    if (!f || a - f.at < (m.after ?? 1)) return null;
    if (!stillHere(L, f.vars)) { delete L.flags[m.need]; return null; }
    vars = { ...f.vars };
  }
  return castPeople(L, m, vars) ? vars : null;
}
// Les moments possibles dans ce pays (et pour ce pays d'origine), à cet âge :
// calculés une fois, puis gardés.
const momentsByPlace = {};
function momentsHere(L) {
  const key = L.code + L.home;
  if (!momentsByPlace[key]) {
    const here = MOMENTS.filter(m => {
      const code = m.o ? L.home : L.code;
      return (!m.r || m.r.includes(BY_CODE[code].region)) && (!m._cc || m._cc.has(code)) && (!m._not || !m._not.has(code))
        && (!m.cy || m.cy[code]) && (!m.on || m.on[code]) && (!m._from || (L.code !== L.home && m._from.has(L.home)));
    });
    momentsByPlace[key] = Array.from({ length: MAX_AGE + 1 }, (_, a) => here.filter(m => !m.a || (a >= m.a[0] && a <= m.a[1])));
  }
  return momentsByPlace[key][Math.min(L.age, MAX_AGE)];
}
const momentWeight = m => (m.w ?? 1) * (m._cc || m.cy || m.on ? 2.5 : m.r ? 1.5 : 1) * (m.t || m.p ? 1.2 : 1) * (m.need ? 3 : 1);

// Remplace les marques d'un texte : accords, prénoms, sommes.
function tellText(L, s, vars) {
  return s.replace(/\{([^{}]*)\}/g, (_, k) => {
    if (k[0] === "$") return money(median(L.here) * parseFloat(k.slice(1)));
    if (k === "pays") return inCountry(L.here);
    if (k === "age") return String(L.age);
    if (k === "annee") return String(L.calYear);
    const i = k.indexOf(":"), who = i < 0 ? null : k.slice(0, i), rest = i < 0 ? k : k.slice(i + 1);
    if (rest.includes("|")) {
      const [masc, fem] = rest.split("|");
      return (who ? vars[who] && vars[who].sex : L.sex) === "f" ? fem : masc;
    }
    return vars[k] ? vars[k].name : k;
  });
}

// Partir vivre en ville (exode rural), et y trouver un premier travail.
function moveToCity(L, prefer = []) {
  L.urban = true;
  if (L.job && L.jobInfo && L.jobInfo.sector === "agri") L.loseJob("Laisse les champs derrière soi.");
  if (L.job || L.business || L.age < 15) return;
  L.startWork({ city: true, prefer });
}
// Les décisions qui changent la vie elle-même.
const MOMENT_RUN = {
  city: L => moveToCity(L),
  factory: L => moveToCity(L, ["factory", "textile", "builder"]),
  // Un contrat de chantier dans le Golfe, frais d'agence empruntés.
  gulf(L) {
    L.debt += median(L.here) * 0.4;
    L.moveTo(countryAt(pick(["AE", "SA", "QA", "KW", "OM", "BH"]), L.calYear));
  },
};

Object.assign(Life.prototype, {
  // Un enfant, ou un jeune adulte encore à la charge de ses parents.
  dependent() {
    return this.age < 18 || (this.age < 25 && !this.married && !this.job && !this.business && !this.retired && this.parents.some(p => p.alive));
  },
  // Niveau de vie : revenu du foyer par personne (échelle racine carrée), en $ PPA par an.
  livingStandard() {
    const c = this.here;
    if (this.dependent()) {
      const sibs = this.sibs.filter(s => s.alive && s.born <= this.age && this.age - s.born < 18).length;
      const earners = Math.min(2, this.parents.filter(p => p.alive && p.job).length);
      return incomeAt(c, (this.decile - 0.5) / 10) * (0.7 + 0.5 * earners) / Math.sqrt(3 + sibs);
    }
    const kids = this.children.filter(k => k.alive && this.age - k.born < 18).length;
    const net = this.budget ? this.budget.net : this.income;
    return (Math.max(net, incomeAt(c, 0.02) * 0.5) + 0.04 * Math.max(0, this.netWorth())) / Math.sqrt(1 + (this.married ? 1 : 0) + kids);
  },
  livingTier(x = this.livingStandard()) { return TIER_CUTS.filter(t => x >= t).length; },
  // Rang dans le pays (0 à 1).
  livingPlace(x = this.livingStandard()) {
    return this.dependent() ? (this.decile - 0.5) / 10 : incomePctOf(this.here, x * 1.25);
  },

  momentContext() {
    this.seen = this.seen || {};
    this.flags = this.flags || {};
    const x = this.livingStandard(), c = this.here;
    return { c, gdp: c.gdp, year: this.calYear, tier: this.livingTier(x), p: this.livingPlace(x) };
  },
  // Les moments de l'année : ceux qui ne peuvent pas attendre (une date, un âge,
  // la suite d'une histoire), puis un ou deux autres, tirés au sort.
  lifeMoments() {
    if (!this.alive) return;
    const X = this.momentContext(), pool = [];
    for (const m of momentsHere(this)) { const vars = momentFits(this, m, X); if (vars) pool.push([m, vars]); }
    const told = pool.filter(([m]) => m.sure);
    // Un fil narratif avance une année sur deux ou trois, par une seule de ses suites.
    const threads = {};
    for (const e of pool) if (e[0].need && !e[0].sure) (threads[e[0].need] = threads[e[0].need] || []).push(e);
    for (const list of Object.values(threads)) if (rand() < 0.4) told.push(list[weighted(list.map(([m], i) => [i, m.w ?? 1]))]);
    let rest = pool.filter(e => !told.includes(e) && !e[0].sure && !e[0].need);
    let n = Math.min((rand() < 0.75 ? 1 : 0) + (rand() < 0.2 ? 1 : 0), 3 - told.length);
    while (n-- > 0 && rest.length) {
      const e = rest[weighted(rest.map(([m], i) => [i, momentWeight(m)]))];
      told.push(e);
      rest = rest.filter(([m]) => m.theme !== e[0].theme && !(m.ask && e[0].ask));
    }
    let asked = false;
    for (const [m, vars] of told) {
      if ((m.ask && asked) || (m.need && !this.flags[m.need])) continue;
      if (m.ask) asked = true;
      this.tellMoment(m, vars);
    }
  },
  // Les noces, racontées juste après le mariage.
  wedding() {
    if (!this.alive || this.marriedForced) return;
    const X = this.momentContext(), list = [];
    for (const m of momentsHere(this)) if (m._wedding) { const vars = momentFits(this, m, X); if (vars) list.push([m, vars]); }
    if (list.length) this.tellMoment(...list[weighted(list.map(([m], i) => [i, momentWeight(m)]))]);
  },
  tellMoment(m, vars) {
    this.seen[m.id] = this.age;
    if (m._wedding) this.weddingAt = this.marriedAt;
    if (m.clear) delete this.flags[m.clear];
    const say = (txt, fx, set) => {
      if (txt) { const t = tellText(this, Array.isArray(txt) ? pick(txt) : txt, vars); this.say(m.stamp ? `${this.calYear} · ${t}` : t, m.kind, !!m.hl, !!m.heavy); }
      this.momentEffects(fx);
      if (set) this.flags[set] = { at: this.age, vars };
    };
    if (!m.ask) return say(m.txt, m.fx, m.set);
    const opts = m.ask.opts.filter(o => o._if.every(c => !!IS[c.name](this, c.arg) !== c.neg));
    this.ask(tellText(this, m.ask.q, vars), opts.map(o => ({
      label: tellText(this, o.label, vars), autoWeight: o.w ?? 1,
      apply: () => {
        const r = o.out ? weighted(o.out.map(x => [x, x.p])) : o;
        say(r.txt, r.fx, o.set);
        if (o.run) MOMENT_RUN[o.run](this);
      },
    })));
  },
  momentEffects(fx) {
    if (!fx) return;
    const med = median(this.here);
    for (const s of ["health", "happy", "know", "rel"]) if (fx[s]) this.bump(s, fx[s]);
    if (fx.cost) this.pay(med * fx.cost);
    if (fx.gain) this.addMoney(med * fx.gain);
    if (fx.debt) this.debt += med * fx.debt;
    if (fx.fund) this.kidsFund = (this.kidsFund || 0) + med * fx.fund;
    if (fx.herd && this.assets.livestock) this.assets.livestock *= Math.max(0, 1 + fx.herd);
  },
});
