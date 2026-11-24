# M22 · 22.1 — Classes IFC et correspondances

Fait le 2026-11-24. Décisions : `docs/phases/M22-decisions.md`. Table dans le code :
`src/features/ifc/classes.ts`, vérifiée par `classes.test.ts` sur HOUSE-01, HOUSE-02, le plan
d'exemple et la grande maison (l'exportateur de Pascal écrit bien ces classes).

## Élément Fabrics → nœud Pascal → classe IFC4

| Fabrics | Nœud Pascal | Classe IFC4 | Uniclass 2015 | Quantités (D22-7) | Revit (attendu, non essayé) |
|---|---|---|---|---|---|
| Terrain | `site` | `IfcSite` | — | — | Informations du projet |
| Bâtiment | `building` | `IfcBuilding` | — | — | Informations du projet |
| Niveau | `level` | `IfcBuildingStorey` | — | `Qto_BuildingStoreyBaseQuantities` (Pascal) | Niveaux |
| Mur (un `IfcWall` par côté) | `wall` | `IfcWall` | EF_25_10 Walls | `Qto_WallBaseQuantities` | Murs |
| Porte | `door` | `IfcDoor` (+ `IfcOpeningElement`) | EF_25_30 Doors and windows | `Qto_DoorBaseQuantities` | Portes |
| Fenêtre, baie | `window` | `IfcWindow` (+ `IfcOpeningElement`) | EF_25_30 Doors and windows | `Qto_WindowBaseQuantities` | Fenêtres |
| Pièce (contour tracé, D22-5) | `zone` | `IfcSpace` | — | `Qto_SpaceBaseQuantities` | Pièces (espaces) |
| Dalle dessinée, dalle de niveau | `slab` | `IfcSlab` | EF_30_20 Floors | `Qto_SlabBaseQuantities` | Sols |
| Toiture | `roof` | `IfcRoof` et un `IfcSlab` (ROOF) par pan | EF_30_10 Roofs | — | Toits |
| Escalier | `stair` | `IfcStair`, `IfcStairFlight`, palier en `IfcSlab` | EF_35_10 Stairs | — | Escaliers |
| Mobilier, équipement | `item` | `IfcFurnishingElement` | — | — | Mobilier |
| Plateforme | `fabrics:platform` | `IfcBuildingElementProxy` | — | — | Modèles génériques |

Non exportés (annotations et repères) : cotes, repères de coupe, trames, séparations de pièces.

## Ce qu'il faut savoir

- **Géométrie.** Murs, portes, fenêtres, pièces et dalles sont recalculés depuis la scène. Toitures,
  escaliers, mobilier et plateformes reprennent la forme 3D affichée : l'export depuis l'application
  les contient, un export sans vue 3D (test) les signale comme « sans géométrie ».
- **Uniclass 2015.** Codes de la table EF (éléments). Les pièces n'ont pas de code : la table SL
  demande l'usage de la pièce, que Fabrics ne connaît pas. Codes à faire relire par un praticien BIM.
- **Revit (D22-3).** Colonne indicative : catégories de la table de correspondance IFC par défaut de
  Revit. L'échange n'est pas essayé dans Revit ; le gate G5 se vérifie dans deux visionneuses gratuites.
- **Identifiants.** Chaque produit IFC a un `GlobalId` tiré de l'identifiant du nœud (22.3) ; la
  propriété `Pascal.NodeId` le relie à la scène et `Fabrics.ElementId` à l'élément Fabrics (22.2).

## Changement dans Pascal

L'exportateur reçoit les ajouts de Fabrics (propriétés, quantités, classification) et dit quelle classe
et quel `GlobalId` il a écrits pour chaque nœud : `packages/pascal/FABRICS_CHANGES.md`, section M22.
