# ROOMIT-R1 — R+1 de la Villa ROOMIT (deuxième cas de comparaison de M20, sous-lot 20.1b)

Référence : page 6 du dossier de l'utilisateur `Villa ROOMIT_B.pdf` (plan de niveau R+1, n° 06, A2, 1:50).
Le PDF reste chez l'utilisateur (non versionné). Plan : `docs/phases/M20-plan.md` (20.1b, tâche 1).

## Méthode du relevé (2026-11-22)

Même méthode que `fixtures/ROOMIT-RDC` : le PDF est vectoriel, les traits ont été lus avec PyMuPDF
(outil local, hors projet) et convertis en mm réels (1 pt = 17,64 mm à 1:50).

- **Même repère que le RDC** : les pages 5 et 6 ont exactement la même emprise de murs
  (14472 × 12472 mm). Origine : face extérieure du mur gauche (x = 0) et face extérieure du mur haut
  (y = 0).
- Murs : traits noirs de 1,42 pt. Murs porteurs 200 mm, cloisons 100 mm. Tous les murs se rejoignent
  sur leurs axes (Pascal détecte les pièces à partir des axes ; un mur arrêté sur une face fusionne
  deux pièces).
- Poteaux : les 20 carrés noirs pleins de 200 × 200 mm, plus le poteau d'angle du balcon (carré vide).
- Ouvertures : étiquettes `PP: l x h` et `All.`, chaînes de cotes des façades (ex. `150` / `100` = fenêtre
  1500 × 1000).
- Pièces : nu intérieur des murs, comme le RDC.

## Résultat

Surfaces recalculées par Fabrics à travers la scène Pascal : **7 pièces sur 11 identiques** au
tableau « Pièces Niveau R+1 ». Le total inclut le balcon, comme la référence (**D20-10 : A**).
Test : `src/features/scene/roomitR1.test.ts`.

| Pièce | Référence | Fabrics | Cause |
|---|---|---|---|
| BAR | 18,47 m² | 18,46 m² | 6777 × 2300 + 1520 × 1893 = 18,4645 m² : arrondi |
| SDB 2 | 4,55 m² | 4,64 m² | La référence déduit la petite cloison de la douche (100 × 912 mm). Pascal ne déduit pas une cloison dont un bout est libre. **Point à trancher par l'utilisateur.** |
| SDB 1 | 4,55 m² | 4,64 m² | Idem (100 × 913 mm) |
| Bibliothèque | 21,50 m² | 21,52 m² | Bibliothèque et Dégagement forment un seul espace ouvert, sans ligne de séparation sur la référence. La séparation de pièces (D20-8) est placée à x = 5776 mm pour garder 5,65 m² au Dégagement ; la référence arrête le couloir 19 mm avant la face du mur (8265 au lieu de 8284). |
| **Total R+1** | **144,16 m²** | **144,36 m²** | Somme des écarts ci-dessus |

## Hypothèses (à vérifier par l'utilisateur)

- Hauteur d'étage 3000 mm et dalle 120 mm, comme le RDC ; niveau R+1 à 3000 mm.
- **Fenêtre d'angle du BAR** (`All: 80`, cote `161` / `150`) : une fenêtre ne peut pas passer l'angle
  d'un mur dans Pascal ; elle est modélisée par deux fenêtres de 1400 × 1500 mm, allège 800 mm, une sur
  chaque mur, avec le montant d'angle de 200 mm.
- Portes sans étiquette : double porte Bibliothèque → Suite parentale 1400 mm (vide de 1451 mm) ;
  coulissants Dressing → SDB 3 et Dressing → Suite parentale 1200 mm (vide mesuré).
- Les coulissants de la référence (`PP: 150 x 210`, `PP: 200 x 210`) sont modélisés en portes, comme au RDC.
- L'escalier en L de la Bibliothèque est celui qui **monte du RDC** (même emprise que ROOMIT-RDC). Il est
  repris dans cet exemple pour dessiner le niveau seul ; dans le projet complet, il appartient au RDC.
- Balcon : pièce sans mur sur ses deux côtés ouverts ; garde-corps non modélisés.
- Mobilier du catalogue de Pascal placé à l'œil : 3 lits, la table de la Bibliothèque, le canapé du
  balcon, 3 WC. Pas encore : fauteuils, bureaux, lavabos, douches, baignoire, rangements.
- Toiture : pas dans cet exemple. Elle sera ajoutée avec le plan de toiture (20.1b, tâche 4).
