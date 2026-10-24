# Vie · Naître au hasard

Simulation de vie en français, inspirée du concept de [1in8b.life](https://1in8b.life/fr/) et entièrement réécrite (code, textes et design originaux).

Vous naissez au hasard parmi les bébés de l’année (ou parmi les 8 milliards d’humains), puis vous vivez une vie entière, année après année, guidée par les statistiques réelles de 58 pays (≈ 85 % des naissances mondiales).

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

## Lancer en local

Site statique, sans dépendance :

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
