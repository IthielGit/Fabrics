# ROOMIT-RDC — RDC de la Villa ROOMIT (premier cas de comparaison de M20)

Référence : page 5 du dossier de l'utilisateur `Villa ROOMIT_B.pdf` (plan de niveau RDC, A2, 1:50).
Le PDF reste chez l'utilisateur (non versionné). Décision : `docs/phases/M20-decisions.md` (D20-5).

## Méthode du relevé (2026-11-21)

Le PDF est vectoriel. Les traits ont été lus avec PyMuPDF (outil local, hors projet) et convertis en
mm réels : 1 pt = 25,4 / 72 × 50 = 17,64 mm à 1:50. Contrôle de l'échelle : les poteaux mesurent
200 × 200 mm et l'écart entre poteaux redonne les cotes de la référence (450, 1447…).

- Murs : traits noirs de 1,42 pt (contours des murs coupés). Murs porteurs 200 mm, cloisons 100 mm.
- Ouvertures : vides entre les traits de murs, largeur prise sur les étiquettes `PP: l x h` des portes
  et sur les chaînes de cotes des fenêtres (le vide mesuré est environ 50 mm plus large, à cause des
  tableaux), allège sur les étiquettes `All.`.
- Pièces : nu intérieur des murs, bande des poteaux comprise.
- Origine : face extérieure du mur gauche (x = 0) et face extérieure du mur haut du cellier (y = 0).

## Résultat

Surfaces recalculées par Fabrics, à travers la scène Pascal : **9 pièces sur 12 identiques** au tableau
de la référence. Écarts (test `src/features/scene/roomit.test.ts`) :

| Pièce | Référence | Fabrics | Cause |
|---|---|---|---|
| Séjour | 35,97 m² | 36,18 m² | Passage ouvert de 2 m vers le Dégagement, sans mur (tireté bleu : poutre). Il est modélisé par une **séparation de pièces** de Pascal (comme dans Revit), sans épaisseur, au milieu de la poutre. La référence arrête les deux pièces aux faces de la poutre (bande de 200 mm exclue). |
| Dégagement | 28,64 m² | 28,84 m² | Idem |
| SDB | 6,48 m² | 6,47 m² | 1475 × 4389 mm = 6,474 m² au relevé ; écart non expliqué |

**Choix de l'utilisateur (2026-11-21) : A**, la séparation reste au milieu de la poutre (règle de Revit) ; les +0,20 m² de Séjour et Dégagement sont acceptés. Dans les projets, chaque passage ouvert entre deux pièces demande une séparation de pièces.

Sans la séparation, Pascal voit le Séjour et le Dégagement comme un seul espace : le Séjour prenait
65,25 m² et Fabrics signalait le chevauchement des deux pièces.

## Hypothèses (à vérifier par l'utilisateur)

- Hauteur d'étage 3000 mm (coupe : niveaux 0 et 300), dalle 120 mm (coupe : « Dalle en BA ép. 12 cm »).
- Fenêtre du cellier : 600 × 600, allège 1500 (non indiquées sur la référence ; reprises de la fenêtre
  de la SDB).
- Porte du cellier : 800 mm (non étiquetée ; vide de 850 mm).
- Porte de la SDB depuis la Chambre 1 : coulissante sur la référence, modélisée en porte de 900 mm.
- Porte de la Salle de prière : coulissante de 1000 mm, modélisée en porte.
- Murs en brique (référence : « Mur de remplissage en Brique ») : hachurés sur le plan. 25 poteaux de
  Pascal (`columns`, 200 × 200 mm) aux positions relevées, posés sur les murs (le poteau isolé du
  Séjour compris).
- Escalier en L (`stairs`) et 4 objets du catalogue de Pascal (`items` : lit, table, canapé, WC), placés
  à l'œil d'après la référence. Pas encore : marches balancées, garde-corps et marches du Chalet.
