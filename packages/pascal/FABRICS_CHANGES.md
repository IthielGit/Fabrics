# Modifications de Fabrics dans ce dossier

Ce dossier est une copie de Pascal Editor (https://github.com/pascalorg/editor, MIT), commit
`7f30521` (« Initial Pascal Editor source »), faite le 2026-11-17 (jalon M17 de Fabrics).
La structure du dépôt d'origine est gardée telle quelle : ses tests et scripts utilisent des
chemins relatifs à sa racine (`apps/editor/public`, `packages/*`…).

Toute modification de Fabrics dans ce dossier est notée ici, la plus récente en haut.

## Non copiés

- `.git`, `node_modules`, `.next`, `.turbo`
- Réglages d'outils et d'agents : `.claude`, `.claude-plugin`, `.codex`, `.codex-plugin`, `.cursor`,
  `.cursor-plugin`, `.devcontainer`, `.vscode`, `.githooks`
- `ROADMAP_CLAUDE_PASCAL_IFCOPENSHELL_REVIT_QUALITY.md` : document de l'utilisateur, pas de Pascal ;
  intégré à `docs/03-ROADMAP.md` de Fabrics

## Copiés mais non versionnés

- `apps/ifc-converter/public/test-ifc-files/*.ifc` : tests locaux seulement (voir
  `THIRD_PARTY_NOTICES.md` à la racine de Fabrics)

## Ajoutés par Fabrics

- `FABRICS_CHANGES.md` (ce fichier)
- `.fabrics/known-failures-win32.json` : référence des tests en échec relevée dans le dossier
  d'origine, utilisée par `npm run test:pascal` (ADR 0002)

## Modifications

Le code est installé par Bun dans ce dossier (`npm run install:pascal`, `bun.lock` gelé), qui applique
lui-même ses correctifs (`patches/`). Un essai d'intégration par workspaces npm a été abandonné le
2026-11-18 (ADR 0002). Après une modification ici : `npm run build:pascal`, puis `npx vite --force`.

### 2026-11-18 — M19 B4 : limite de propriété en mm

- `packages/editor/src/components/ui/sidebar/panels/site-panel/index.tsx` : quand l'hôte impose les
  millimètres, coordonnées et périmètre de la limite de propriété en mm entiers (pas de 100 mm), surface
  à 2 décimales. Sans réglage de l'hôte : inchangé.

### 2026-11-18 — M19 B1 : unités d'affichage réglables par l'application hôte

Fabrics affiche toujours les longueurs en mm et les surfaces en m² à 2 décimales. Sans réglage de
l'hôte, Pascal se comporte exactement comme avant (mètres, 1 décimale, menu d'unités visible).

- `packages/core/src/utils/measurement-format.ts` : `configureMeasurementDisplay()` /
  `getMeasurementDisplayDefaults()` (notation métrique, décimales des surfaces, `locked`) ; valeurs par
  défaut de `formatLinearMeasurement` et `formatAreaLabel` lues à chaque appel.
- `packages/core/src/lib/floorplan/context.ts`, `packages/nodes/src/{beam,item}/floorplan.ts`,
  `packages/nodes/src/wall/contextual-dimensions.ts` : repli sur la notation de l'hôte au lieu de
  `'meters'`.
- `packages/viewer/src/ui/lib/room-area.ts` : décimales des étiquettes de pièces de l'hôte.
- `packages/editor/src/lib/floorplan/open-wall-ends.ts`,
  `packages/editor/src/components/editor/node-arrow-handles.tsx`,
  `packages/editor/src/components/ui/helpers/contextual-helper-panel.tsx` : en mm quand l'hôte
  l'impose (au lieu de « 4 cm », « 0.5m », « Grille : 0,50 m »).
- `apps/editor/components/viewer-toolbar.tsx` : sous-menu « Unités » masqué si l'hôte verrouille
  l'unité.

## M19 B7 — textes en dur de Pascal passés par Lingui

- `scripts/i18n.ts` : fournisseur de traduction `I18N_PROVIDER=file` (+ `I18N_FILE`, `I18N_MODEL`) qui lit
  `i18n/fabrics-fr.json` (traductions françaises écrites à la main) au lieu d'appeler une IA ; les entrées
  restent `fuzzy` + `Review: required`. Commande :
  `I18N_PROVIDER=file I18N_MODEL=claude-sonnet-5-5 I18N_FILE=i18n/fabrics-fr.json bun scripts/i18n.ts translate fr`.
- `i18n/fabrics-fr.json` : traductions françaises de B7 ; `i18n/literal-baseline.json` réduite.
- Les catalogues `es`, `ja`, `zh-CN` ne reçoivent pas les nouveaux textes (Fabrics est en français
  seulement) : `i18n:check` signale ces textes manquants ; `check:all` de Fabrics ne l'appelle pas.
- Zone `packages/viewer` : textes convertis par le codemod de Pascal (`glb-scene`, `perf-panel`,
  `unsupported-gpu-fallback`, `scene-loader`, `walkthrough-hud`, `floorplan-dimension-renderer`).
- Zone `packages/nodes` : `block/{panel,selection}`, `construction-dimension/panel` (libellés des listes en
  descripteurs `/* i18n */`, rendus par `i18n._(option.label)`), `measurement/{selection,tool}`,
  `spawn/panel`, `wall/move-endpoint-tool`.
- Zone `packages/editor` (lot automatique, 321 textes) : palette de commandes, panneaux matériaux et terrain,
  réglages (export, audio, scène, import), capture de vue, modules, aide du plan d'étage, etc. Les durées
  en pieds (« 8 ft ») sont affichées en mm (« 2 438 mm »). Restent 76 textes à passer à la main
  (constantes de module, gabarits à plusieurs valeurs) : voir l'étape suivante.
