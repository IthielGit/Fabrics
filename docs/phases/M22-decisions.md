# M22 · 22.0 — Décisions (échanges IFC)

Feu vert de l'utilisateur pour M22 le 2026-11-24, après son essai de M21 (OK). **Toutes les
décisions ont été choisies par l'utilisateur le 2026-11-24 : option recommandée partout.**

| Décision | Retenu |
|---|---|
| D22-1 Version | **IFC4** (ce qu'écrit l'exportateur de Pascal), pas IFC4x3 |
| D22-2 Classification | **Uniclass 2015** : un code attribué automatiquement par classe (`IfcClassificationReference`) |
| D22-3 Échange avec Revit | Gate G5 vérifié dans **deux visionneuses gratuites** ; la lecture de nos classes par Revit est documentée, sans essai dans Revit |
| D22-4 Ancien export | L'export IFC2x3 de Fabrics (`src/features/export/ifc.ts`, non valide, R14) est **remplacé** par l'exportateur IFC4 de Pascal (ADR 0003) |
| D22-5 Pièces | L'`IfcSpace` porte le **contour tracé dans Fabrics** et sa surface : l'IFC et les métrés donnent les mêmes surfaces |
| D22-6 Import | Un IFC importé devient un **nouveau projet Plan**, avec son rapport d'import ; aucun projet existant n'est modifié |
| D22-7 Quantités | Les quantités standard (`Qto_*BaseQuantities`) prennent les **valeurs géométriques de M21** (règles `geo-2026.1`) |
| D22-8 IDS | Un **petit IDS** (classes, niveaux, matériaux, quantités, classification), vérifié par IfcOpenShell au gate G5 |

Les gates G3 (revue d'un professionnel) et G4 (revue d'un métreur) restent ouverts. Ils ne bloquent
pas M22.

## Ce qui existe déjà (fin de M21)

| Capacité | Où | État |
|---|---|---|
| Export IFC de Fabrics | `src/features/export/ifc.ts` | IFC2x3, murs, ouvertures, pièces et sols ; 23 erreurs de schéma sur le plan d'exemple (R14) |
| Export IFC de Pascal | `packages/pascal/packages/ifc-converter/src/export/scene-to-ifc.ts` | IFC4 : site, bâtiment, niveaux, murs (couches de matériaux), dalles, portes, fenêtres, ouvertures, pièces, toitures, escaliers, mobilier (maillage 3D), propriétés et quantités ; `GlobalId` déduit de l'identifiant du nœud |
| Import IFC de Pascal | `convertIfcToPascalWithReport` (`ifc-converter/src/index.ts`, web-ifc) | Appli séparée dans Pascal, pas branchée dans Fabrics |
| Contrôles externes | `tools/ifc/validate.py`, `compare_quantities.py`, `npm run check:ifc-quantities` | Schéma et quantités (M21) |

## Ordre des sous-lots

22.0 décisions → 22.1 classes et correspondances → 22.2 export → 22.3 identifiants stables →
22.4 import contrôlé → 22.5 contrôles et gate G5. Tout le jalon d'une traite, un commit par
sous-lot, essai de l'utilisateur à la fin (même façon de faire qu'en M21).
