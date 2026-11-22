# M20 · 20.8 — Étude de `ifcopenshell.draw`

Faite le 2026-11-22. Question : `ifcopenshell.draw` (IfcOpenShell 0.9.0.post1, LGPL, déjà utilisé hors
application par `tools/ifc/validate.py`) peut-il servir d'outil complémentaire aux feuilles de Fabrics ?

## Ce qui a été essayé

- Exemple **ROOMIT** (RDC et R+1 : 44 murs, 21 portes, 18 fenêtres, 23 pièces), exporté deux fois :
  - par l'export IFC de Fabrics (`export/ifc.ts`, IFC2X3) ;
  - par l'export de Pascal (`ifc-converter`, IFC4, prévu pour M22).
- Exemple de la référence anti-régression (`baseline/fabrics/example/export.ifc`).
- `ifcopenshell.draw.main` à 1:50 sur une feuille A1. Trois jeux de dessins demandés :
  - plans par niveau, avec noms et surfaces des pièces et arcs de portes ;
  - façades ;
  - coupes.

| Fichier | Plans (2 niveaux) | Façades (4) | Coupes | Durée |
|---|---|---|---|---|
| ROOMIT, export Pascal (IFC4) | oui | oui | oui | 2,3 s · 4,5 s · 2,7 s |
| ROOMIT, export Fabrics (IFC2X3) | oui | oui | oui | 1,8 s (plans et façades) |
| Exemple de référence (IFC2X3) | oui | oui | — | 0,8 s |

L'échelle est exacte : 1 m dans le modèle = 20 mm sur la feuille à 1:50 (matrice de chaque dessin).
Les murs, ouvertures et pièces tombent aux mêmes places que sur les plans de Fabrics.

## Défauts rencontrés dans la version 0.9.0.post1

1. **Plantage** dès le premier dessin avec les réglages par défaut (`AttributeError: 'SwigPyObject' object
   has no attribute 'is_a'`, calcul des « cellules »). Contournement : `cells=False`.
2. Tous les dessins (plans, façades) sont **posés au même endroit d'une seule page**, superposés : il faut
   découper le SVG, un dessin par fichier.
3. Le « ² » des surfaces est **échappé deux fois** (`m&amp;#178;`), et le nom de chaque pièce est écrit deux fois
   (nom long et nom court identiques dans nos exports).
4. Les styles sont dans une feuille CSS interne ; plusieurs visionneuses l'ignorent (tout s'affiche en noir).

## Ce que `ifcopenshell.draw` ne fait pas (par rapport aux feuilles de Fabrics)

- Pas de **cotes** (chaînes extérieures, cotes intérieures), ni de repères `PP: 900 x 2100` / `All. 1100`.
- Pas de nord, de cartouche ou de tableaux, et pas d'usages français (D20-2).
- Pas de **hachures** par matériau : matière coupée en gris uni.
- Pas d'arcs de porte avec nos exports (les portes n'ont pas de représentation de battant).
- Pas de mobilier, d'escaliers ni de toitures, faute de les avoir dans les IFC exportés.
- **Python et OpenCascade côté serveur** : pas de version pour le navigateur. Un service hébergé demanderait une
  ADR (LGPL, coût, données du client envoyées à un serveur).

## Conclusion — proposé par Claude, à valider (D20-19)

- **Moteur de feuilles : on garde Fabrics** (ADR 0007, inchangée). `ifcopenshell.draw` n'apporte ni les usages
  français, ni les cotes, ni le cartouche, et il n'est pas utilisable dans l'application.
- **Outil complémentaire hors application** : `tools/ifc/draw_plans.py`. Il dessine les plans par niveau et
  les façades d'un fichier IFC à l'échelle voulue, un SVG par dessin, avec les contournements ci-dessus.
  Usage : un **second dessin, indépendant de Fabrics**, pour contrôler un export IFC (murs, ouvertures et pièces
  à leur place) avant de l'envoyer. Ce contrôle sera utile en M22, quand l'export de Pascal remplacera celui
  de Fabrics.

```
tools/ifc/.venv/Scripts/python.exe -I tools/ifc/draw_plans.py fichier.ifc dossier_de_sortie --scale 50
```

- À revoir quand une version d'IfcOpenShell corrigera les défauts 1 et 3 (supprimer alors les contournements).
