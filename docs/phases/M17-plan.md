# M17 — Plan : audit et intégration de Pascal (gate G0)

Rédigé le 2026-11-17, branche `feat/m17-pascal`. **En attente du feu vert de l'utilisateur.**

But du jalon : **faire entrer Pascal dans le dépôt sans rien changer pour l'utilisateur.** Aucun
nouvel éditeur, aucun nouveau moteur. On copie, on fait passer les tests, on fige la référence
(baseline) et on écrit l'inventaire des capacités. Le branchement réel commence en M18.

## 1. État constaté (2026-11-17)

| Élément | Constat |
|---|---|
| Node / npm / Git | v24.16.0 / 11.13.0 / 2.55.0 : OK (Pascal demande Node ≥ 24.22.1 ou ^22.23.4 : **v24.16 est trop ancien**, voir point 3.1) |
| Bun | **absent** (Pascal exige `bun@1.4.4`) |
| Python | 3.12.10 : OK pour IfcOpenShell |
| Clone Pascal | `C:\Users\My PC\Documents\Projects\BIM Project`, commit `7f30521`, licence MIT (Pascal Group Inc.) ; jamais installé (`node_modules` absent) |
| Contenu Pascal | 9 paquets (`core`, `viewer`, `editor`, `nodes`, `ifc-converter`, `geometry-script`, `mcp`, `cli`, `ui`) + 2 outils de config ; 2 apps **Next.js 16** (`apps/editor`, `apps/ifc-converter`) ; 1 452 fichiers de test (`bun test`) ; ~80 Mo de sources dont 26 Mo de ressources (`apps/editor/public`) |
| Dépendances internes | en versions (`^1.1.5`), pas en `workspace:*` : compatibles avec les workspaces npm |
| Correctifs | `three@0.187.0`, `three-bvh-csg@0.0.18`, `iwer@2.3.0` (format bun `patchedDependencies` → à convertir pour `patch-package`) |
| `next/image` | importé dans 27 fichiers de `packages/` → alias Vite nécessaire |
| Versions partagées | React 19.3.1 et three 0.187 : **identiques** à Fabrics. TypeScript : Fabrics `~7.0.2`, Pascal `typescript6` 6.0.2 + `native-preview` → conflit possible |
| Fabrics | 151 fichiers de test, ~2 978 tests ; lint `oxlint` ; pas de `.github/` ; plans d'exemple : `examplePlan.ts`, `largeHousePlan.ts` |

## 2. Tâches et fichiers (ordre d'exécution)

Chaque lot se termine par `npm run build`, `npm run lint`, `npm test` (et `test:pascal` dès qu'il
existe), puis un commit.

**Lot 1 — Outils**
- Installer Bun 1.4.4 et mettre Node à jour (≥ 24.22.1) : commandes données à l'utilisateur.
- Fichier : `docs/05-INSTALLATION.md` (section « Outils Pascal »).

**Lot 2 — Pascal tel quel, dans son dossier** (rien n'est modifié dans le clone)
- `bun install`, `bun run test`, `bun run build` dans le clone ; résultats notés.
- Fichier : `docs/phases/M17-pascal-baseline.md` (commit, versions, nombre de tests, durées, échecs).

**Lot 3 — Baseline Fabrics** (avant toute copie)
- Script `scripts/baseline/` (Vitest, sans navigateur) qui produit à partir de `examplePlan.ts`
  et `largeHousePlan.ts` : métrés Client et Exécution (JSON), dessins SVG (façades, coupes, plans
  cotés Client / Exécution), exports CSV, XLSX (contenu XML décompressé) et IFC.
- Dossier `baseline/fabrics/` (versionné) + test `baseline.test.ts` qui compare et échoue à
  tout écart.
- Fixtures `fixtures/HOUSE-01`, `HOUSE-02`, `EDGE-01` : `spec.json` avec calcul à la main
  (voir point 3.6).

**Lot 4 — Registre et liste de non-régression**
- `docs/capabilities.md` : matrice complète (UI, vues 2D / 3D, moteur, objets, édition, annuler,
  stockage, IFC, API, MCP, IA, quantités, exports), une ligne par capacité, avec preuve (fichier,
  test ou écran) dans les deux projets. Aucune API inventée : chaque ligne Pascal cite un fichier.
- `docs/regression-checklist.md` : chaque critère d'acceptation de M0 à M16 + chaque fonction
  native de Pascal, avec sa vérification (test automatique ou geste dans le navigateur).

**Lot 5 — Décisions (ADR)**
- `docs/adr/0001-source-of-truth.md` (scène Pascal, D79, en mètres, affichage mm).
- `docs/adr/0002-monorepo.md` (workspaces npm, tests Pascal sous bun, lint, TypeScript).
- `docs/adr/0003-doublons.md` : décision pour chaque doublon (voir point 3.4).

**Lot 6 — Copie de Pascal**
- `packages/pascal/<paquet>/` (les 9 paquets + `tooling`), `apps/pascal-editor/`,
  `apps/pascal-ifc-converter/`, `public/pascal/` (ressources), `patches/` (format `patch-package`),
  `packages/pascal/FABRICS_CHANGES.md`, et les fichiers de règles de Pascal (`AGENTS.md`,
  `DECISIONS.md`, `CONTRIBUTING.md`, `biome.jsonc`, `lingui.config.ts`, `i18n/`, `wiki/`) sous
  `packages/pascal/`.
- `package.json` racine : `workspaces`, `overrides` alignés sur Pascal, `postinstall: patch-package`.
- `vite.config.ts` : alias `next/image` → petit composant `<img>` (`src/pascal/nextImageShim.tsx`).
- Catalogue Lingui `fr` (extraction des messages ; traduction progressive, signalée dans le rapport).
- Exclusions : `.git`, `node_modules`, `.next`, les dossiers d'agents (`.claude`, `.cursor`,
  `.codex`…), les IFC d'exemple restent hors du build (tests locaux seulement).

**Lot 7 — Scripts et intégration continue**
- `package.json` : `test:pascal` (bun test des paquets), `lint:pascal` (Biome sur
  `packages/pascal`), `check:all` (build, lint, Vitest, `test:pascal`, `lint:pascal`, baseline,
  test d'architecture, doublons).
- `scripts/check-all.mjs`, `src/architecture.test.ts` (Fabrics n'importe pas les modules retirés ;
  `src/` n'importe Pascal que par les exports publics des paquets).
- `.github/workflows/check.yml` (à chaque push).

**Lot 8 — IfcOpenShell**
- Environnement Python isolé `tools/ifc/.venv` (non versionné), `tools/ifc/requirements.txt`,
  `tools/ifc/validate.py` (ouvre un IFC, liste les entités, vérifie le schéma).
- Essai sur l'IFC exporté par Fabrics (baseline) et sur un IFC d'exemple de Pascal ; version et
  API notées dans le rapport.

**Lot 9 — Licences, risques, rapport**
- `THIRD_PARTY_NOTICES.md` (Pascal MIT, polices OFL, médias CC BY 4.0, IfcOpenShell LGPL, autres
  dépendances relevées).
- `docs/risks.md` (reprend le tableau du roadmap + risques constatés ici).
- `docs/phases/M17-report.md`, cases du roadmap, `docs/PROGRESS.md`, gate **PASS / FAIL**.

## 3. Points à confirmer avant de commencer

1. **Mise à jour de Node** : Pascal refuse Node 24.16 (`engines` ≥ 24.22.1). Je propose d'installer
   la dernière Node 24 LTS. Sinon : forcer avec `engine-strict=false` (risqué).
2. **Workspaces npm + `bun test`** (ADR 0002) : une seule installation `npm install` à la racine ;
   les tests de Pascal tournent avec `bun test` sur ces `node_modules`. Si les résultats diffèrent
   de ceux obtenus dans le dossier de Pascal (critère G0), repli : installation bun séparée dans
   `packages/pascal` (deux installations, plus lourd).
3. **Deux linters, deux périmètres** : je propose oxlint pour `src/`, Biome pour
   `packages/pascal/` (règles E-001 de Pascal). Ce n'est pas un doublon actif sur le même code ;
   l'unification se décidera plus tard.
4. **Doublons** (ADR 0003, rien n'est retiré en M17 puisque l'application doit rester identique) :

   | Doublon | Proposition | Retrait de l'autre |
   |---|---|---|
   | `jspdf` / `pdfkit` | décider en M20 après comparaison des plans PDF ; jspdf reste en attendant | M20 |
   | oxlint / Biome | périmètres séparés (point 3) | — |
   | `crypto.randomUUID()` / `nanoid` | nœuds de la scène : générateur de Pascal (identifiants préfixés `wall_…`) ; le reste de Fabrics : `randomUUID` | règle écrite dans `CLAUDE.md` |
   | Export IFC Fabrics / `ifc-converter` | `ifc-converter` garde le rôle ; l'export Fabrics reste jusqu'à ce qu'il fasse aussi bien (comparaison M22) | M22 |
   | Vue 3D Fabrics / `viewer` Pascal | `viewer` Pascal garde le rôle | M19 |

5. **Apps Next.js** : copiées pour les tests et la référence, **pas déployées** et pas intégrées à
   l'application Vite. Elles alourdissent l'installation (Next 16).
6. **Fixtures HOUSE-01 / HOUSE-02 / EDGE-01** : le roadmap demande un calcul à la main
   indépendant. Je l'écris (géométrie inventée selon le roadmap) et tu le vérifies ; le total DQE
   reste vide jusqu'à M23 (aucun prix inventé).
7. **TypeScript** : Fabrics garde TS 7 pour `src/`, chaque paquet Pascal garde sa version. En cas de
   conflit à l'installation, je m'arrête et je te propose deux options.

## 4. Tests prévus

- Fabrics : les ~2 978 tests actuels, inchangés + `baseline.test.ts` + `architecture.test.ts`.
- Pascal : `npm run test:pascal` = même nombre de tests et mêmes résultats que dans son dossier.
- Build de production : taille du bundle Fabrics comparée avant / après (doit rester proche :
  rien de Pascal n'est importé par `src/` en M17).
- IfcOpenShell : `validate.py` sur l'IFC de la baseline.

## 5. Risques propres à M17

| Risque | Parade |
|---|---|
| Conflits de versions à l'installation (TypeScript, types React) | `overrides` alignés ; arrêt et deux options si blocage |
| `bun test` se comporte autrement dans un workspace npm | comparaison chiffrée au lot 2 ; repli : installation séparée |
| Scripts Pascal écrits pour Linux / macOS (`lsof`, `rm -rf`, `[ -n "$CI" ]`) | ne pas les lancer sous Windows ; utiliser Git Bash ; noter les scripts non portables |
| Dépôt plus lourd (~80 Mo) | exclusions du lot 6 ; ressources dans `public/pascal/` seulement |
| Le site en ligne change sans le vouloir | build comparé ; Cloudflare Pages déploie `main` : la branche n'est mergée qu'au gate PASS |

## 6. Définition de terminé (G0)

- `npm install`, `npm run build`, `npm run lint`, `npm test` et `npm run test:pascal` passent ;
  résultats de Pascal identiques à ceux de son propre dossier.
- L'application en ligne reste identique pour l'utilisateur ; aucun nouvel éditeur ni moteur.
- Chaque capacité de la matrice a un état, une preuve et une action ; aucune API inventée.
- Baseline versionnée, `check:all` vert, `M17-report.md` écrit, gate PASS déclaré.
