# ADR 0001 — La scène Pascal, source de vérité des projets Plan

- Statut : **accepté** (décision D79 de l'utilisateur, 2026-11-17 ; ADR écrite en M17)
- Mise en œuvre : M18 (migration), M19 à M23 (vues, quantités, IFC, DQE)

## Contexte

Fabrics stocke un plan dans `FabricsDocument` (`src/types/document.ts`) : des éléments à plat
(murs en polyligne, pièces, ouvertures relatives à leur mur…) en **millimètres**. Pascal stocke un
bâtiment dans une **scène** (`@pascal-app/core`) : un graphe de nœuds typés (niveaux, murs, dalles,
portes, fenêtres, toitures, escaliers, objets…) en **mètres**, validés par des schémas zod, avec
un historique, des commandes et un registre de types (règles E-001 à E-018 de Pascal).

Garder les deux modèles actifs obligerait à les synchroniser en permanence : chaque métré, chaque
vue et chaque export pourrait diverger de l'autre. Le roadmap interdit deux implémentations actives.

## Décision

1. Pour un projet **Plan**, la scène Pascal est le **seul** modèle enregistré et modifié. Vues 2D,
   3D, nomenclatures, métrés, cotes Client / Exécution, repères `M01` / `P01` / `F01`, IFC et DQE
   en **dérivent** par des fonctions pures.
2. Les projets **Visuel** gardent `FabricsDocument` (Pascal ne les concerne pas).
3. Unités : la scène reste en **mètres** (format de Pascal, rien n'est réécrit). La conversion se fait
   **uniquement à l'affichage et à la saisie** (fonctions de `src/features/units/`) : l'utilisateur ne
   voit jamais de mètres (longueurs en mm entiers, surfaces en m², volumes en m³).
4. Identifiants : ceux de la scène Pascal (générateur de Pascal), stables à travers annuler,
   collaboration, versions et commentaires.
5. Les plans existants sont convertis en scène Pascal par une migration pure et testée (M18), comparée
   à la baseline M17 (`baseline/fabrics/`) au mm et au centième de m² près.

## Conséquences

- M17 ne change rien à l'application : `FabricsDocument` reste le modèle des plans jusqu'à M18.
- Les métrés existants (`src/features/measurements/`) devront lire la scène (M18) : les tests et la
  baseline M17 servent de contrat.
- Les conversions mm ↔ m sont un point de risque (arrondis) : elles passent par une seule fonction
  testée, et la baseline vérifie l'aller-retour.
- Collaboration (Yjs), versions et commentaires sont rebranchés sur les nœuds de la scène (M18).

## Options écartées

- **Garder `FabricsDocument` et convertir vers Pascal à la volée** pour la 3D et l'IFC : deux sources,
  divergences certaines.
- **Convertir la scène Pascal en mm** : il faudrait réécrire Pascal, et perdre la compatibilité de ses
  tests, de ses scènes et de son MCP.
