# M18 — Rapport : modèle BIM unifié (gate G1)

Branche `feat/m18-scene` (dossier de travail `C:\Users\My PC\Documents\ChatGPT\Fabrics-m18`), 2026-11-18.
Plan : `docs/phases/M18-plan.md` (validé le 2026-11-18, décisions 1 A, 2 A, 3 B, 4 A, 5 A, puis pièces de
Pascal et EDGE-01 dans M18).

## 1. Ce qui a été fait

| Lot | Résultat | Commit |
|---|---|---|
| A | `@pascal-app/core` lu par `src/features/scene/` (alias Vite, TypeScript, `build:pascal`), ADR 0004 et 0005, test d'architecture | 45d12a8 |
| B | Conversion plan Fabrics ↔ scène Pascal (tous les types d'éléments), vue calculée pour l'éditeur, nœuds propres à Fabrics, ADR 0006 (pièces) | 0136eba |
| C | La scène est le document de l'éditeur (`SceneBinding`, `Y.Doc`), un seul historique `Y.UndoManager`, événement « modèle changé » | fd6fb8b |
| D | Enregistrement par la scène (format `pascal-scene`, version 5), versions, duplication, script de conversion de la base `npm run migrate:plans` | f65e4d2 |
| E | Collaboration sur la scène partagée, commentaires ancrés sur les nœuds | 35042dd |
| F | Métrés lus à travers la scène (baseline identique), EDGE-01 corrigé | ce lot |

## 2. Critères d'acceptation (G1)

| Critère | Résultat | Preuve |
|---|---|---|
| Un plan d'avant M18 se rouvre avec les mêmes métrés | **Vérifié par les tests** : baseline M17 identique à travers la scène (28 tests : métrés, Client / Exécution, CSV, XLSX, IFC, SVG, repères `M01` / `P01` / `F01`) ; HOUSE-01 et HOUSE-02 conformes aux calculs à la main | `baseline/fabricsBaseline.test.tsx`, `scene/migrate/fixtures.test.ts`, `bulkMigration.test.ts` |
| Créer, modifier, supprimer puis annuler garde identifiants et dimensions ; aucun élément fantôme | **Vérifié par les tests** | `sceneBinding.test.ts`, `roundTrip.test.ts` |
| Deux navigateurs modifient le même plan ; un commentaire reste attaché | **Tests automatiques OK** (deux éditeurs simulés, épingle qui suit son mur) ; **essai à deux vrais navigateurs : fait par l'utilisateur** (lot E, « validé ») | `commentAnchors.test.ts`, `editorStore.scene.test.ts` |
| Changer de vue ne modifie pas le document ; scénarios natifs de Pascal | **Vérifié** : la vue est calculée, jamais réécrite ; tests de Pascal comparés à la référence (aucun écart propre à M18) | `viewOfScene`, `npm run test:pascal` |

## 3. Écarts de métré voulus (EDGE-01)

| Cas | Avant | Maintenant |
|---|---|---|
| Fenêtre qui dépasse de son mur | 1,62 m² déduits | 0 m² déduit, avertissement conservé |
| Deux ouvertures qui se chevauchent | 3,24 m² | **2,70 m²** (union) |
| Mur de hauteur nulle | aucun avertissement | avertissement « hauteur nulle » (non bloquant) |

Aucun plan de la baseline M17 n'est touché ; seuls changent les plans qui contiennent déjà ces erreurs.

## 4. Limites et points ouverts

- **Conversion de la base** : prête et testée (essai à blanc, sauvegarde exigée, métrés comparés avant / après), **pas encore lancée** : à faire à la mise en ligne, avec l'accord de l'utilisateur.
- **Cloudflare Pages** : la commande de build doit changer (Bun + `build:pascal`) avant tout merge dans `main`.
- **Taille** : le fichier principal passe de 1,6 à 2,7 Mo ; chargement à part de l'éditeur de plans prévu en M19.
- **Tests de Pascal** : les échecs sous Windows (72 au total, 71 de référence) et des délais dépassés quand l'ordinateur est chargé ; relancés seuls, ils passent.
- **Version 5** : une ancienne version de l'application refuse proprement un plan converti ; ne pas ouvrir de vrais plans avec la branche avant la mise en ligne.
- Volumes des murs et dalles découpées : M21 ; coordonnées IFC absolues : M22.

## 5. Mise en ligne (avec l'accord de l'utilisateur, dans cet ordre)

1. `supabase/m18-backup.sql` (copies de sauvegarde).
2. `npm run migrate:plans` (essai à blanc), lecture du rapport, puis `npm run migrate:plans -- --apply`.
3. Commande de build de Cloudflare Pages.
4. Merge dans `main`.

## 6. Proposition

**G1 : PASS**, sous réserve de la décision de l'utilisateur.
