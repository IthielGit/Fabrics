# ADR 0004 — L'éditeur actuel pendant M18 : vue calculée de la scène Pascal

- Statut : **accepté** (choix de l'utilisateur, plan M18, point 1 A, 2026-11-18)
- Jalon : M18 ; prend fin en M19 (éditeur de Pascal)

## Contexte

D79 / ADR 0001 : la scène Pascal devient le seul document des projets Plan. L'éditeur Konva de Fabrics
(`editorStore`, 95 fichiers ; `FabricsDocument`, 79 fichiers) sera remplacé par les outils et la vue en
plan de Pascal en M19. Le réécrire sur les nœuds Pascal en M18 serait jeté un jalon plus tard.

## Décision

1. La scène Pascal est le **seul** document enregistré, partagé (Yjs), versionné et commenté.
2. L'éditeur actuel lit une **vue calculée** : `FabricsDocument` produit depuis la scène par une fonction
   pure (`src/features/scene/view/`), **jamais enregistrée** ni envoyée aux autres participants.
3. Chaque geste de l'éditeur est traduit en **modification de la scène** (`src/features/scene/commands/`).
   La vue est ensuite recalculée ; elle n'est jamais modifiée directement.
4. Seul `src/features/scene/` importe `@pascal-app/core` (test d'architecture). Le reste de `src/` passe
   par ce module.
5. Métrés, cotes, repères, vues et exports lisent la vue calculée en M18 (contrat : baseline M17) ;
   ils liront directement les nœuds en M21.
6. Les éléments que Pascal n'a pas (trait de coupe, annotations, fond DXF…) sont des **types de nœuds
   Fabrics** déclarés par `registerNode` (point 4 A), sans modifier le code de Pascal.

## Conséquences

- Recalcul de la vue à chaque changement : limité aux nœuds changés si le test « 600 murs » l'exige.
- La conversion scène ↔ vue est le point de risque principal (arrondis m ↔ mm) : une seule fonction de
  conversion, aller-retour testé sur tous les types et la baseline.
- En M19, la vue calculée et les commandes de traduction disparaissent avec l'éditeur Konva.

## Options écartées

- Réécrire l'éditeur Konva sur les nœuds Pascal : coût élevé, code retiré en M19.
- Garder `FabricsDocument` comme document et convertir pour Pascal : deux sources (contraire à D79).
