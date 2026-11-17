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

_Aucune._ Le code de Pascal est identique au commit `7f30521`. Il est installé par Bun dans ce
dossier (`npm run install:pascal`, `bun.lock` gelé), qui applique lui-même ses correctifs (`patches/`).
Un essai d'intégration par workspaces npm a été abandonné le 2026-11-18 (ADR 0002).
