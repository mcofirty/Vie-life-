# Lifelot — identité visuelle

![Lifelot](logo/lifelot-horizontal.svg)

## 1. Le logo
- **Idée** : un billet de tirage dont le vide dessine un L. C’est le « lot » de vie qu’on reçoit en naissant, sans l’avoir choisi.
- **Versions** :
  - horizontal (version principale) : `logo/lifelot-horizontal.svg` ;
  - empilé : `logo/lifelot-stacked.svg` ;
  - symbole seul : `logo/lifelot-symbol-coral.svg` ;
  - logotype seul : `logo/lifelot-wordmark.svg`.
- **Versions une couleur** :
  - horizontal : `logo/lifelot-horizontal-black.svg`, `logo/lifelot-horizontal-white.svg` ;
  - symbole : `icons/lifelot-symbol-black.svg`, `icons/lifelot-symbol-white.svg`, `icons/lifelot-symbol-mono-ff5a36.svg`.
- **Sur fond sombre** : `logo/lifelot-horizontal-on-dark.svg` et `logo/lifelot-stacked-on-dark.svg`.
- **Petites tailles** : `logo/lifelot-symbol-small.svg`, avec des encoches plus grandes et un L plus épais. À utiliser à 32 px ou moins.
- **Le L est un vrai trou** : posé sur une photo ou une couleur, le billet laisse voir le fond à travers le L.

## 2. Zone de protection
Laissez autour du logo une marge d’au moins **1 × E**. E est la largeur d’une encoche du billet, soit environ un quart de la hauteur du billet. Cette marge grandit et rétrécit avec le logo.

## 3. Tailles minimales
| Version | Écran | Impression |
|---|---|---|
| Horizontal | 96 px de large | 25 mm de large |
| Empilé | 48 px de large | 14 mm de large |
| Symbole | 16 px (fichier petites tailles) | 6 mm |

## 4. Couleurs
| Nom | HEX | RVB | CMJN (approx.) | Pantone (approx., à valider sur nuancier) |
|---|---|---|---|---|
| Corail Lifelot | `#FF5A36` | 255 90 54 | 0 65 79 0 | ≈ Warm Red C |
| Nuit | `#17142B` | 23 20 43 | 47 54 0 83 | ≈ 5255 C |
| Papier | `#FFF8F1` | 255 248 241 | 0 3 5 0 | — |

**Associations autorisées** :
- corail et nuit sur blanc ou sur papier ;
- symbole blanc sur corail (icône d’app) ;
- corail et papier sur nuit ;
- noir sur blanc ;
- blanc sur photo, sur une zone calme.

**Contrastes** :
- Corail sur nuit : 5,8:1. C’est bon pour tous les usages.
- Blanc sur corail : 3,1:1. C’est suffisant pour le logo et les gros titres, pas pour du petit texte.

## 5. Typographie
- **Logotype** : dessiné sur mesure, sans police sous licence. Le trait est monoline et rond, de 26 unités pour une hauteur d’x de 94. Ne le retapez jamais avec une police : utilisez les fichiers SVG.
- **Interface et textes** : Inter (licence libre SIL OFL). Sinon, les polices système (`-apple-system`, `system-ui`).

## 6. À ne pas faire
- Ne pas étirer ni écraser le logo.
- Ne pas le recolorer en dehors de la palette.
- Ne pas le faire pivoter.
- Ne pas ajouter d’ombre, de contour, de dégradé ni d’effet.
- Ne pas déplacer ni redimensionner les éléments d’un lockup.
- Ne pas remplir le L.
- Ne pas le poser sur un fond chargé sans cartouche.

## 7. Icônes web et app
- Favicon : `icons/favicon.ico` (16, 32 et 48 px) et `icons/lifelot-favicon.svg`.
- Icône iOS et PWA : `icons/png/lifelot-app-icon-full-180.png`, `-192.png` et `-512.png`. Le carré est plein, iOS arrondit lui-même les coins.
- Icône Android « maskable » : `icons/png/lifelot-app-icon-maskable-512.png`. Le symbole reste dans la zone de sécurité.

## 8. Présentation
`presentation/board.html` : le brief, le logo final et 6 mockups (icône d’app, site, profil social, onglet, sticker, cartes de visite). Les diapositives sont aussi exportées en PNG : `presentation/slide-01.png` à `slide-05.png`.

## Notes de livraison
- **Tests réalisés** :
  - audit SVG du skill : 100/100, sans texte vivant, sans image intégrée et sans filtre ;
  - lisibilité à 16, 32 et 64 px ;
  - versions une couleur et inversée ;
  - miroir et rotation.
- **Fichiers sources** : seulement des SVG. Il n’existe pas de PDF ni d’EPS pour l’impression, car aucun logiciel pour les produire n’était disponible.
- **À faire** : une recherche d’antériorité de la marque « Lifelot » (INPI, EUIPO) et une recherche d’images inversée avant tout dépôt. Elles n’ont pas été faites ici.
- `concepts/` contient la première série de pistes (A, B, C) et leurs itérations.
