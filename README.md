# Vie · Naître au hasard

Simulation de vie en français, inspirée du concept de [1in8b.life](https://1in8b.life/fr/) et entièrement réécrite (code, textes et design originaux).

Vous naissez au hasard parmi les bébés de l’année (ou parmi les 8 milliards d’humains), puis vous vivez une vie entière, année après année, guidée par les statistiques réelles de 58 pays (≈ 85 % des naissances mondiales).

## Fonctionnalités

- Compteurs en direct des naissances et des décès, probabilités de naissance par pays, tableau triable des statistiques.
- Tirage animé et acte de naissance (prénom modifiable).
- Vie en temps réel (≈ 15 min, 30 min ou 1 h), pause, vitesses ×1 à ×16, bouton « Suivant » et mode automatique.
- Indicateurs santé, bonheur, savoir et relations ; une priorité par an.
- Décisions : lycée, université, mariage, émigration.
- Pauses de réflexion à 5, 15, 30, 50 et 70 ans.
- Quatre « nés à la même seconde » suivis âge par âge.
- Grille de vie, courbe de survie, comparaison avec votre vrai pays.
- Acte de décès, vies antérieures gardées dans le navigateur, thème clair/sombre.

## Modèle

- Mortalité : mortalité infantile, puis loi de Gompertz-Makeham calée par pays et par sexe sur l’espérance de vie (ONU), modulée par la santé et la richesse.
- Revenus : loi log-normale dérivée du PIB/hab. (PPA) et de l’indice de Gini ; position influencée par la famille d’origine, les études et le hasard.
- Causes de décès : profils simplifiés par région et par âge (inspirés des estimations de l’OMS).

Les valeurs sont approchées (vers 2023) : voir `data.js`.

## Lancer en local

Site statique, sans dépendance :

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
