# Vie · Naître au hasard

Simulation de vie en français, inspirée du concept de [1in8b.life](https://1in8b.life/fr/) et entièrement réécrite (code, textes et design originaux).

Vous naissez au hasard parmi les bébés de l’année (ou parmi les 8 milliards d’humains), puis vous vivez une vie entière, année après année, guidée par les statistiques réelles de tous les pays et territoires du monde (216), de 1900 à 2100.

## Nouveautés (version 3)

- **Tous les pays du monde** : 216 pays et territoires, avec 33 indicateurs chacun (naissances, espérance de vie par sexe, mortalité infantile et maternelle, PIB, Gini, école, université, emploi agricole et industriel, chômage, femmes au travail, urbanisation, internet, compte bancaire, inflation, taux d’intérêt, impôts, Bourse, VIH, tabac, homicides, bonheur…). Les données sont générées depuis la Banque mondiale et Our World in Data par `tools/` ; les valeurs manquantes sont estimées d’après la région et signalées.
- **Passé réel et projections** : séries longues par pays tous les 10 ans (espérance de vie, mortalité des enfants, naissances, population, fécondité, PIB, années d’école) de 1900 aux projections de l’ONU pour 2100. Près de 90 événements historiques, dont des hyperinflations qui ruinent l’épargne.
- **Agir sur sa vie** : trois actions par an, professionnelles (chercher un emploi parmi les 50 métiers qui existent ici et à cette époque, changer de métier, augmentation, heures sup, formation, reprendre des études, créer ou vendre une entreprise, partir travailler à l’étranger, ouvrir un compte, retraite anticipée) ou personnelles (amour, enfant, divorce, sport, bilan de santé, arrêter de fumer, voyager, amis, bénévolat, langues, déménager, financer les études des enfants…). Chaque action dit pourquoi elle est impossible quand elle l’est.
- **Argent réaliste** : revenus du ménage (avec ceux du conjoint), impôts selon le pays et l’époque, loyer ville/campagne ou emprunt immobilier (apport, taux réel, mensualités), enfants, train de vie, épargne. Placements selon l’accès réel (compte bancaire, économies planifiées, époque) : liquide, épargne, tontine, obligations, actions du pays, fonds mondial, immobilier locatif, or, bétail, cryptos ; rendements réels avec les krachs historiques ; rééquilibrage annuel ; retraite selon le pays ; héritage ; entreprise (faillites, rachats) ; patrimoine comparé au reste du pays.
- **Descendance** : à la mort, choix d’un testament (parts égales, tout à un enfant, moitié aux œuvres) et d’un enfant pour continuer. L’enfant revit depuis sa naissance ; la vie précédente meurt dans la sienne au même âge et de la même cause, et l’héritage arrive à ce moment-là. Lignée sur plusieurs générations.

## Fonctionnalités

- **Quand naître** : aujourd’hui, dans le passé (1900-2000), dans le futur (2030-2100), au hasard, ou une année choisie. Les statistiques du pays évoluent ensuite année après année.
- **Événements historiques réels** : guerres mondiales, guerres civiles, famines, grippe espagnole, Covid-19, Grande Dépression, crises financières… avec mobilisation possible des hommes de 18 à 40 ans. Le futur suit les projections de l’ONU (et le réchauffement), sans événements inventés.
- Compteurs en direct, probabilités de naissance par pays et par année, tableau triable de 17 indicateurs.
- Tirage animé, acte de naissance (prénom modifiable, date, parents, contexte) et **carte image à partager**.
- Vie en temps réel (≈ 15 min, 30 min, 1 h ou 1 h 30), pause, vitesses ×1 à ×16 (dont ×12), « Suivant », « Prochaine décision », **décision en attente** (« Plus tard »), mode automatique.
- Indicateurs santé, bonheur, savoir et relations ; une priorité par an.
- **Décisions** : lycée, université, mariage, émigration, soins (selon leur coût réel), tabac, poste mieux payé loin des siens, mobilisation.
- **Famille et vie** : parents (qui vieillissent), frères et sœurs, conjoint, enfants, petits-enfants, projet d’enfants, temps en famille, aide financière.
- **Dépenser et investir** : train de vie, épargne, placements (liquide, épargne, Bourse, immobilier), achat d’un logement, dettes et intérêts ; revenus en $ PPA et en € (prix français).
- Mortalité maternelle, VIH (avec ou sans traitement selon l’époque), emploi agricole.
- Récit avec **moments gardés ☆**, affichage des moments plus anciens, panneau « Le monde autour ».
- Pauses de réflexion à 5, 15, 30, 50 et 70 ans ; derniers mots à la fin.
- Quatre « nés à la même seconde », la même année, suivis âge par âge.
- Grille de vie, courbe de survie de la génération, comparaison avec votre vrai pays.
- **Mémorial** : vies gardées pour longtemps, bougies, mots ; « Rencontrer une vie au hasard ».
- **Partage** : lien qui contient la vie elle-même (sans vos réponses ni vos derniers mots, rien n’est envoyé à un serveur) et carte image.
- **Vies antérieures** : tri, « Voir plus », transfert (export/import d’un fichier), suppression ; « Tout effacer » garde le mémorial.
- **Reprise** d’une vie inachevée, même après avoir fermé la page.
- Réglages : musique douce (générée), pauses, **pas de scènes effrayantes** (passages durs repliés), **mode classe** (thèmes les plus lourds mis de côté, partage désactivé), thème clair/sombre. Numéros d’aide à chaque événement difficile.

Non repris de 1in8b.life : les 14 langues (l’app reste en français), les 172 pays (58 ici, ≈ 85 % des naissances), l’API et le mémorial public partagé entre utilisateurs (il faudrait un serveur ; ici le partage passe par des liens).

## Version application (téléphone)

Le dossier `app/` contient une version pensée pour le téléphone, au style iOS : grands titres, barre d’onglets floutée (Vivre, Monde, Vies, Réglages), listes groupées, anneaux pour les indicateurs, carte de naissance façon « pass », feuilles qui glissent du bas (fermeture d’un geste vers le bas), vibrations, écran maintenu allumé pendant la vie, thème clair/sombre.

C’est une PWA : ouverte dans Safari, « Partager → Sur l’écran d’accueil » l’installe comme une app, et elle fonctionne hors ligne. Elle partage le moteur (`sim.js`), les données (`data.js`), les outils communs (`common.js`), les réglages et les vies gardées avec la version web.

## Modèle

- Mortalité : mortalité infantile, puis loi de Gompertz-Makeham calée par pays et par sexe sur l’espérance de vie (ONU), modulée par la santé et la richesse.
- Revenus : loi log-normale dérivée du PIB/hab. (PPA) et de l’indice de Gini ; position influencée par la famille d’origine, les études et le hasard.
- Causes de décès : profils simplifiés par région et par âge (inspirés des estimations de l’OMS).

- Époques : points d’appui par région en 1900 et 1950 (ONU, Our World in Data, projet Maddison), projections vers 2100 ; tables de mortalité recalculées tous les 5 ans.

Les valeurs sont approchées (vers 2023 ; ordres de grandeur pour le passé et le futur) : voir `data.js`.

## Données

```sh
sh tools/fetch-sources.sh      # télécharge les sources dans tools/cache/
node tools/build-countries.mjs # écrit countries.js
```

## Lancer en local

Site statique, sans dépendance :

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
