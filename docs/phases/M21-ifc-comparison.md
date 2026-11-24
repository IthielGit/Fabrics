# M21 · 21.6 — Comparaison du quantitatif avec IfcOpenShell

Fait le 2026-11-24. Décision D21-7 : comparaison avec un IFC4 produit par l'exportateur de Pascal
(`ifc-converter`), dans un test seulement (branchement dans l'application en M22), relu par
IfcOpenShell 0.9.0.

## Comment la relancer

Terminal de VS Code, à la racine du projet (environnement Python de `tools/ifc` installé, voir
`docs/05-INSTALLATION.md`) :

```bash
npm run check:ifc-quantities
```

1. `src/features/measurements/quantities/ifcExchange.test.ts` construit quatre jeux d'échange
   (HOUSE-01, HOUSE-02, plan d'exemple, grande maison) passés par la scène Pascal. Pour chacun, il
   écrit l'IFC4 de Pascal et les quantités géométriques de Fabrics (`*.quantities.json`) dans
   `tmp/ifc-exchange/`. Il vérifie que chaque mur, ouverture et pièce quantifié se retrouve dans
   l'IFC (propriété `Pascal.NodeId`).
2. `tools/ifc/compare_quantities.py` relit chaque IFC avec IfcOpenShell :
   - murs : volume du solide (ouvertures découpées), sommé par mur Fabrics, car un mur à plusieurs
     côtés donne plusieurs IfcWall ;
   - portes et fenêtres : `OverallWidth × OverallHeight` ;
   - dalles dessinées : volume du solide ;
   - pièces (IfcSpace) : surface au sol, **pour information**.

   Le script écrit `tmp/ifc-exchange/report.md`. Il échoue si une quantité validée s'écarte de plus
   de 0,1 % (D21-6, tolérance provisoire).

## Résultats du 2026-11-24

| Jeu | Murs (volume net) | Portes et fenêtres (surface) | Pièces (surface, information) |
|---|---|---|---|
| HOUSE-01 | 4 / 4 identiques (0,000 %) | 5 / 5 identiques | 4 écarts de convention |
| HOUSE-02 | 8 / 8 identiques | 11 / 11 identiques | 8 écarts de convention |
| Plan d'exemple | 10 / 10 identiques | 23 / 23 identiques | 10 écarts de convention |
| Grande maison | 18 / 21 identiques ; 3 provisoires (écart de 0,18 à 0,60 %) | 52 / 52 identiques | 21 écarts de convention |

Aucune quantité validée ne sort de la tolérance. Les IFC produits passent la validation de schéma
d'IfcOpenShell (0 erreur, contrôlé sur le plan d'exemple avec `tools/ifc/validate.py`).

## Ce que la comparaison a appris

1. **Raccord de trois murs ou plus au même point.** Le mur du garage et celui de la véranda se
   raccordent exactement à un angle du mur extérieur. Pascal coupe les solides à ce raccord. La règle
   de Fabrics (longueur à l'axe × épaisseur, D21-4) y compte deux fois une pointe d'angle :
   0,0125 m³ par raccord, de 0,18 à 0,60 % du volume de ces murs.
   **Corrigé côté statut** : ces volumes et ces faces sont maintenant « provisoires »
   (`multiWallJunction`). Ils ne sont donc jamais présentés comme fiables. Corriger la géométrie
   elle-même (couper la pointe comme Pascal) changerait les métrés existants : c'est noté dans les
   Idées.
2. **Pièces : deux contours différents.** Fabrics mesure la pièce sur son contour tracé (faces
   intérieures des murs ; Séjour de HOUSE-01 : 4250 × 4750 mm = 20,19 m²). Dans la scène, Pascal
   recalcule la zone sur l'axe des murs, avec parfois un sommet décalé (Séjour de HOUSE-01 : sommet
   à 4000 / 5050 mm). L'IfcSpace exporté reprend cette zone (21,66 m²).
   **À traiter en M22** : l'IFC exporté par Fabrics doit porter le contour et la surface de la pièce
   Fabrics. Sinon les surfaces de l'IFC ne correspondent pas aux métrés.
3. **Portes et fenêtres** : dimensions identiques partout. La hauteur limitée au mur (Fabrics) n'a pas
   été mise à l'épreuve : aucun jeu n'a d'ouverture plus haute que son mur.

## Limites

- Les dalles de niveau (implicites dans Fabrics) ne sont pas exportées par Pascal : elles ne sont pas
  comparées. Les dalles dessinées dans Pascal le sont, mais aucun des quatre jeux n'en a.
- Toitures et escaliers de Fabrics : Pascal ne les exporte qu'avec leur maillage 3D, absent d'un
  test sans affichage. Ils ne sont pas comparés.
- La tolérance de 0,1 % reste provisoire jusqu'à la revue d'un métreur (D21-6).
