# ADR 0005 — Un seul historique annuler / rétablir : `Y.UndoManager`

- Statut : **accepté** (choix de l'utilisateur, plan M18, point 2 A, 2026-11-18)
- Jalon : M18 ; risque R4

## Contexte

Avant M18, Fabrics a deux historiques : celui d'`editorStore` (100 états) quand on travaille seul, et
`Y.UndoManager` en collaboration. Pascal en a un troisième : zundo (`temporal`) dans `use-scene.ts`.
Le roadmap interdit deux historiques actifs.

## Décision

1. **`Y.UndoManager` est le seul historique**, seul ou à plusieurs. Quand on travaille seul, la scène
   vit aussi dans un document Yjs local (non relié à un serveur).
2. Un geste = une étape d'annulation (regroupement par transaction Yjs, origine locale).
3. En collaboration, annuler ne défait que **ses propres** gestes.
4. L'historique zundo de Pascal est **mis en pause** pour la scène de Fabrics (API `temporal.pause()`
   de zundo), sans modifier le code de Pascal. L'historique d'`editorStore` est retiré.

## Conséquences

- Les tests d'annulation existants (`editorStore.test.ts`, `editorStore.collab.test.ts`) sont repris sur
  le nouvel historique : mêmes gestes, mêmes résultats.
- M19 (éditeur de Pascal) devra brancher ses commandes sur ce même historique, pas sur zundo.

## Options écartées

- zundo de Pascal comme historique, Yjs pour le transport : annuler défairait les gestes des autres.
- Deux historiques selon le mode (situation d'avant M18) : interdit (R4).
