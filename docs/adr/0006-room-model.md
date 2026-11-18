# ADR 0006 — Pièces : modèle de Pascal (contour à l'axe des murs, sol intérieur calculé)

- Statut : **accepté** (choix de l'utilisateur, 2026-11-18, pendant le lot B de M18)
- Jalon : M18

## Contexte

Au chargement d'une scène (`setScene`), Pascal reprend toute pièce (`zone`) qui occupe l'essentiel
d'un espace fermé par des murs : son contour est remplacé par celui de l'axe des murs, et elle devient
une pièce liée à ses murs (`spaceRole: 'room'`, `autoFromWalls`, `boundaryWallIds`). Aucun réglage de
la pièce ne l'empêche (`core/src/utils/room-zone-migration.ts`, `lib/structure-kernel.ts`,
`lib/room-zone-adoption.ts` ; tests `structure-kernel.test.ts`, `use-scene-room-migration.test.ts`).
Fabrics, lui, mesurait le contour tracé, en général sur la face intérieure des murs.

Options présentées à l'utilisateur : garder le modèle de Fabrics (réglage `roomBoundary: false` sur les
murs, qui coupe la détection des pièces de Pascal) ou adopter celui de Pascal.

## Décision

1. **Modèle de Pascal.** Une pièce fermée par des murs a pour contour l'axe de ses murs ; elle suit les
   murs quand ils bougent.
2. Les métrés de Fabrics mesurent son **sol intérieur** : contour moins l'emprise de ses murs, calculé
   par Pascal (`roomClearPolygon`, `src/features/scene/view/roomClearFloor.ts`).
3. Une pièce qui n'est pas fermée par des murs garde le contour tracé.
4. Toute scène passe par le chargement de Pascal (`src/features/scene/settle.ts`) avant d'être lue.

## Preuves (2026-11-18)

- Plan d'exemple et grande maison : 31 pièces sur 31 avec la même surface, le même périmètre et les
  mêmes dimensions ; baseline M17 complète identique par ce chemin (métrés, tableaux, CSV, XLSX, IFC,
  planches SVG) ; HOUSE-01 et HOUSE-02 identiques.
- Pascal n'ajoute aucun nœud au chargement de ces plans (ni pièce, ni dalle, ni plafond).

## Conséquences

- Une pièce tracée sur une **partie** d'un espace fermé (au moins la moitié) est reprise sur tout
  l'espace : sa surface change. La migration de la base (plan M18, point 3 B) compare les métrés avant
  et après pour chaque projet et laisse intact, en le signalant, tout projet dont les métrés changent.
- Les plateformes ne sont pas des dalles Pascal (une dalle porte les murs et remonte les portes posées
  dessus) : nœud Fabrics `fabrics:platform` jusqu'à M19.
