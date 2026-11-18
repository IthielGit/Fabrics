# ADR 0002 — Organisation du dépôt avec Pascal

- Statut : **accepté**. Plan M17 validé le 2026-11-17 (point 3.2 : workspaces npm, avec repli sur une
  installation Bun séparée si les résultats de Pascal diffèrent). **Le repli a été appliqué le
  2026-11-18**, preuves ci-dessous.
- Jalon : M17

## Contexte

Pascal est un monorepo **Bun** (workspaces `apps/*`, `packages/*`, `tooling/*`, `bun.lock`, Turbo,
Biome, `bun test`, correctifs `patchedDependencies`). Fabrics est une application **npm** (Vite,
Vitest, oxlint, `package-lock.json`). Critère G0 : les tests de Pascal intégré donnent les mêmes
résultats que dans son propre dossier.

## Essai des workspaces npm (abandonné)

Une installation npm de tout Pascal a été faite et mesurée :

1. npm refuse deux « peer dependencies » contradictoires de greffons tiers (`plugin-bones` demande
   `@pascal-app/core` < 1, `plugin-bath-space` demande `zod` < 4.6) ; Bun les accepte. Contournable avec
   `legacy-peer-deps`, mais npm n'installe alors plus aucune « peer dependency » (`iwer` disparaît).
2. npm ne lit pas `bun.lock` : **163 paquets** ont été installés dans une autre version que celle de
   Pascal (exemple : Biome 2.6.8 au lieu de 2.6.5, `iwer` 2.8.0 au lieu de 2.3.0, ce qui casse son
   correctif).
3. Conséquence mesurée : `@pascal-app/viewer` passe de 3 à **6 échecs** (3 nouveaux, sur des
   comparaisons de géométrie octet par octet). Le critère G0 n'est pas tenu.

## Décision

1. **Copie à structure identique** : tout le dépôt de Pascal est copié dans `packages/pascal/` sans
   réorganisation (ses tests utilisent des chemins relatifs à sa racine, par exemple
   `apps/editor/public` dans `core/src/agent-operations/asset-views.test.ts`). Les ressources restent
   dans `packages/pascal/apps/editor/public/` (une seule copie, 26 Mo) ; en M19, Vite les servira sous
   `/pascal/` sans les dupliquer. Écart assumé avec la formulation du roadmap (« `apps/` »,
   « `public/pascal/` »).
2. **Deux installations** :
   - Pascal : `npm run install:pascal` = `bun install --frozen-lockfile` dans `packages/pascal/`. Les
     versions sont exactement celles de `bun.lock`, et Bun applique lui-même les trois correctifs
     (`three`, `three-bvh-csg`, `iwer`) : pas de `patch-package`.
   - Fabrics : `npm install` à la racine, comme avant ; aucun paquet de Pascal dans
     `node_modules/` de la racine en M17.
   - Aucun fichier de Pascal n'est modifié (`packages/pascal/FABRICS_CHANGES.md`).
3. **Versions communes** : Fabrics fige `react` / `react-dom` 19.3.1, `three` 0.187.0,
   `@react-three/fiber` 9.8.2 et leurs types, les versions de Pascal.
4. **Tests et lint** : Vitest pour Fabrics (`npm test`, `packages/pascal/**` exclu) ; `bun test` pour
   Pascal (`npm run test:pascal`, paquet par paquet, comparé à la référence
   `packages/pascal/.fabrics/known-failures-<système>.json`). Lint : oxlint pour `src/`
   (`packages/pascal/**` ignoré), Biome pour Pascal (`npm run lint:pascal`). Tout : `npm run check:all`.
5. **M18** (première importation de Pascal par `src/`) : `@pascal-app/*` sera résolu par Vite vers
   `packages/pascal/packages/*` (alias), avec `resolve.dedupe` pour n'avoir qu'une copie de React et de
   three. Point à valider au début de M18, avec une ADR si un autre montage est nécessaire.

## Conséquences

- Deux commandes d'installation (`npm install`, puis `npm run install:pascal`), écrites dans
  `docs/05-INSTALLATION.md` et la CI.
- Pas de mise à jour automatique des versions de Pascal par npm : on suit `bun.lock`.
- La CI de Pascal (`packages/pascal/.github/`) est inactive (dossier imbriqué) ; la CI de Fabrics
  (`.github/workflows/check.yml`) lance `check:all`.
- Les scripts de Pascal écrits pour Linux / macOS ne sont pas lancés sous Windows (risque R12).
- En CI (Linux), deux étapes sont nécessaires avant les tests : compiler les paquets de Pascal
  (`dist/`, sinon « Cannot find module »), et sauter les tests d'import IFC si les fichiers d'exemple
  sont absents (ils ne sont pas dans Git). Constat du 2026-11-18, corrigé dans `check.yml` et `test-pascal.mjs`.
