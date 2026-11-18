# M17 — Rapport : audit et intégration de Pascal (gate G0)

Branche `feat/m17-pascal` (dossier de travail `C:\Users\My PC\Documents\ChatGPT\Fabrics-m17`),
2026-11-17 → 2026-11-18. Plan : `docs/phases/M17-plan.md` (validé le 2026-11-17).

## 1. Ce qui a été fait

| Tâche du roadmap | Résultat | Preuve |
|---|---|---|
| Outils | Node 24.16 → **26.13.1** (Pascal refusait 24.16), **Bun 1.4.4** installé, Python 3.12.10, Git 2.55, npm 11.20 | `docs/05-INSTALLATION.md` (section Outils Pascal) |
| Pascal tel quel dans son dossier | `bun install` (845 paquets) ; `bun run test` : **19 394 réussis, 71 échecs (Windows), 8 ignorés** ; `bun run build` : voir § 5 | `docs/phases/M17-pascal-baseline.md`, `packages/pascal/.fabrics/known-failures-win32.json` |
| Baseline Fabrics | 24 fichiers de référence (métrés JSON, tableaux Client / Exécution, CSV, CSV à plat, XLSX, IFC, planches SVG sans cotes / Client / Exécution) pour le plan d'exemple et la grande maison ; fixtures HOUSE-01, HOUSE-02, EDGE-01 avec calcul à la main | `baseline/fabrics/`, `src/baseline/fabricsBaseline.test.tsx`, `fixtures/*/spec.json` |
| Registre et non-régression | ~60 capacités (état, preuve, action, propriétaire) ; critères M0 → M16 et fonctions natives de Pascal | `docs/capabilities.md`, `docs/regression-checklist.md` |
| Carte des écrans (D80) | Chaque page, panneau et geste de Fabrics a une destination (Pascal, Pascal + panneau, Fabrics à part) | `docs/screen-map.md` |
| ADR | 0001 source de vérité (scène Pascal, m ↔ mm à l'affichage) ; 0002 organisation du dépôt ; 0003 doublons (dont **Lingui**, choix de l'utilisateur) | `docs/adr/` |
| Copie de Pascal | Tout le dépôt dans `packages/pascal/`, **structure et code inchangés** ; installé par Bun (`npm run install:pascal`, `bun.lock` gelé, correctifs appliqués par Bun) ; alias Vite `next/image` ; exclusion de Vitest et d'oxlint | `packages/pascal/FABRICS_CHANGES.md`, `vite.config.ts`, `src/pascal/NextImageShim.tsx` |
| Scripts et CI | `install:pascal`, `test:pascal` (comparé à la référence), `lint:pascal` (Biome), `check:duplicates` (jscpd, accord de l'utilisateur, seuil 1,2 % pour 1,05 % mesuré), `check:all` ; GitHub Actions | `scripts/`, `package.json`, `.github/workflows/check.yml` |
| Test d'architecture | `src/` n'importe Pascal que par `@pascal-app/*` ; liste des modules retirés (vide en M17) | `src/architecture.test.ts` |
| IfcOpenShell | 0.9.0.post1 en environnement Python séparé ; script de contrôle ; IFC d'exemple de Pascal : 0 erreur ; **IFC de Fabrics : 23 erreurs** (§ 4) | `tools/ifc/validate.py` |
| Licences | Pascal MIT ; polices OFL ; médias CC BY 4.0 ; IfcOpenShell LGPL hors application ; **objets 3D, textures, sons, HDRI sans licence indiquée** ; IFC d'exemple exclus de Git | `THIRD_PARTY_NOTICES.md`, `.gitignore` |
| Risques | 11 risques du roadmap + 4 constatés | `docs/risks.md` |

## 2. Critères d'acceptation (G0)

| Critère | Résultat |
|---|---|
| `npm install`, `npm run build`, `npm run lint`, `npm test`, `npm run test:pascal` passent | voir § 3 (`check:all`) |
| Résultats de Pascal identiques à ceux de son propre dossier | **Oui, paquet par paquet** : 19 394 réussis, 71 échecs, 8 ignorés dans les deux cas ; mêmes noms de tests en échec. Lint Biome identique (171 avertissements, 16 informations, 0 erreur). |
| Application en ligne identique ; aucun nouvel éditeur ni moteur | Oui : `src/` n'importe rien de Pascal ; seuls ajouts côté application : un alias Vite inutilisé et un composant `NextImageShim` non importé. La branche n'est pas mergée dans `main` (déploiement) avant ton accord. |
| Chaque capacité a un état, une preuve et une action ; aucune API inventée | Oui : chaque ligne Pascal cite un fichier lu (inventaire du 2026-11-17) |

## 3. Vérification complète

Étapes de `npm run check:all`, lancées une à une le 2026-11-18 (la commande complète dépasse la limite
de 10 minutes d'une commande dans Claude Code ; elle reste la commande de référence, et celle de la CI) :

| Étape | Résultat |
|---|---|
| `npm run build` | ✅ |
| `npm run lint` (oxlint, `src/`) | ✅ 0 erreur |
| `npm test` (Vitest : 153 fichiers, **2 995 tests**, dont baseline et architecture) | ✅ au 2ᵉ passage complet. Le test chronométré « 600 murs en moins de 200 ms » a échoué deux fois quand toute la suite tournait (296 et 409 ms), puis il est passé ; seul, il passe 3 fois sur 3. Instabilité déjà connue (`docs/PROGRESS.md`, « Problèmes connus ») |
| `npm run test:pascal` | ✅ **19 394 réussis, 71 échecs, 8 ignorés : résultats identiques à la référence**, paquet par paquet |
| `npm run lint:pascal` (Biome) | ✅ 0 erreur, 171 avertissements, 16 informations : identique au dossier d'origine |
| `npm run check:duplicates` (jscpd) | ✅ 1,05 % de code dupliqué dans `src/` (seuil 1,2 %) |

## 4. Constats et limites

1. **Installation par workspaces npm abandonnée** (ADR 0002) : npm ne lit pas `bun.lock` (163 paquets
   dans d'autres versions), refuse deux « peer dependencies » de greffons tiers, et ne les installe
   plus avec `legacy-peer-deps`. Mesuré : `@pascal-app/viewer` passait de 3 à 6 échecs. Repli prévu
   dans le plan appliqué : installation Bun séparée. Écart avec la formulation du roadmap (« workspaces
   npm », `patch-package`, `apps/`, `public/pascal/`) : documenté dans l'ADR 0002.
2. **71 échecs de Pascal sous Windows** dans son propre dossier (`cli` 14, `editor` 19, `mcp` 19,
   `core` 6, `scripts` 8, `viewer` 3, application 2) ; aucun dans `nodes` (modèle du bâtiment) ni
   `ifc-converter`. La CI Linux donnera la référence Linux.
3. **Tests de `core` sensibles à la charge** : deux tests qui parcourent toutes les sources échouent si
   la machine est occupée (vu une fois pendant un build en parallèle), et passent seuls. `check:all`
   lance les étapes l'une après l'autre.
4. **Export IFC actuel de Fabrics non strictement valide** (IfcOpenShell : une porte ou une fenêtre
   partage son `IfcLocalPlacement` avec son `IfcOpeningElement`, interdit en IFC2X3). Non corrigé : la
   baseline fige l'état actuel ; traité en M22 (risque R14).
5. **Licences à vérifier** avant toute diffusion : 145 objets 3D, ~300 textures, sons, HDRI, polices de
   l'application Pascal, greffons GitHub de son application (`THIRD_PARTY_NOTICES.md`).
6. **Catalogue Lingui `fr`** : présent (3 963 messages) mais **non traduit** ; traduction en M19 lot A
   avec le passage de `fr.ts` dans Lingui.
7. **Ressources de Pascal** (26 Mo) laissées dans `packages/pascal/apps/editor/public/` (leurs tests les
   lisent là) ; servies sous `/pascal/` en M19.
8. **Dossier partagé** : le dossier principal a été basculé sur `main` par une autre session pendant le
   jalon ; le travail M17 a été déplacé intact dans un dossier de travail Git séparé.
9. **Sécurité npm** : `npm audit` signale 4 alertes élevées (`picomatch`) déjà présentes dans Fabrics, et
   2 de plus apportées par jscpd (outil de développement seulement).

## 5. Points ouverts

- `bun run build` de Pascal : **fait le 2026-11-18 sur la copie dans Fabrics** (`packages/pascal`, code
  identique au dossier d'origine, à la demande de l'utilisateur) : **9 tâches sur 9 réussies** en 5 min 11 s
  (`core`, `viewer`, `nodes`, `mcp`, `ifc-converter`, `geometry-script`, `cli`, et les deux applications
  Next.js). Les fichiers produits (`dist/`, `.next/`) ne sont pas versionnés.
- Relecture par l'utilisateur des calculs à la main de HOUSE-01, HOUSE-02 et EDGE-01.
- ~~Premier passage de la CI GitHub (Linux) : relever `known-failures-linux.json`.~~ **Fait** (§ 8) :
  CI verte sur Linux ; pas de fichier de référence Linux, donc tout échec y est bloquant.

## 6. Suite (M18)

Branchement de `src/` sur `@pascal-app/core` (alias Vite et `dedupe`, ADR 0002 § 5), migration des
plans vers la scène Pascal comparée à la baseline M17.

## 7. Gate G0

**PASS** : proposé par Claude, **validé par l'utilisateur le 2026-11-18**.

- Les trois critères G0 sont remplis (§ 2), avec preuves chiffrées (§ 3).
- Aucun écart avec la référence de Pascal ; aucune modification du code de Pascal ; aucune fonction de
  Fabrics touchée (`src/` inchangé hors test d'architecture, test de baseline et composant `NextImageShim`
  non utilisé).
- Réserves, sans effet sur le verdict : test chronométré « 600 murs » instable sous charge (connu) ;
  référence Linux à relever au premier passage de la CI ; calculs à la main des fixtures à relire.
- Merge dans `main` (qui déclenche le déploiement) : seulement après l'accord de l'utilisateur.

## 8. CI GitHub (Linux) : correctifs après le premier passage

Le premier passage de la CI (`check.yml`, Ubuntu) a échoué en deux temps ; corrigé en trois commits
(`f5dc4e4`, `edcefca`, `a89a7f0`) :

1. **929 échecs** : les paquets de Pascal n'étaient pas compilés (`Cannot find module
   '@pascal-app/core/building'`). Correctif : étape « Construire les paquets de Pascal » (turbo build)
   avant `check:all`. Ajout du diagnostic des échecs dans `scripts/test-pascal.mjs` (`f5dc4e4`).
2. **23 échecs** : les tests d'import IFC de `ifc-converter` lisent des fichiers IFC d'exemple, absents
   de Git (licences non vérifiées, `CLAUDE.md`). Correctif : sans ces fichiers, le script saute les
   **6** fichiers de tests qui les lisent, et l'écrit dans le journal ; avec les fichiers, rien ne change
   (107 tests) (`a89a7f0`).

Résultat : **`check-all` vert sur Linux** (run `a89a7f0`, 6 min 25 s). Lecture pour la référence Linux :
aucun échec (la CI n'a pas de fichier `known-failures-linux.json` ; tout échec y est bloquant).

Limite : sur la CI, les 6 fichiers d'import IFC ne tournent pas. Ils restent couverts sur le poste de
développement, où les fichiers d'exemple sont présents.
