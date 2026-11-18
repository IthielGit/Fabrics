# Notices des composants tiers

Fabrics réutilise du code et des contenus open source (décision D77). Ce fichier liste leurs
licences. **À revoir avant toute diffusion commerciale** : les lignes marquées « à vérifier » ne
sont pas encore confirmées.

Relevé du 2026-11-17 (M17), à partir du clone de Pascal Editor au commit `7f30521`.

## Pascal Editor — `packages/pascal/`

- Code : **MIT**, © 2026 Pascal Group Inc. Texte complet : `packages/pascal/LICENSE` (et un `LICENSE`
  dans chaque paquet : cli, core, editor, geometry-script, ifc-converter, mcp, nodes, viewer).
- Modifications faites par Fabrics : `packages/pascal/FABRICS_CHANGES.md`.

### Contenus inclus dans Pascal

| Contenu | Emplacement | Licence | État |
|---|---|---|---|
| Polices du PDF : GeistMono, Liberation Sans | `packages/pascal/packages/editor/src/lib/floorplan/pdf-fonts/` | SIL OFL 1.1 (fichiers `LICENSE-*.txt` présents) | Confirmé |
| Médias de démonstration (MP4, GIF) | `packages/pascal/docs/media/next-demo/` | CC BY 4.0 (`LICENSE.md`) | Confirmé, attribution requise |
| Polices de l'application : Plus Jakarta Sans, Geist (`public/fonts`, `app/fonts`) | `packages/pascal/apps/editor/` | OFL 1.1 en amont | **À vérifier** (aucun fichier de licence dans le dépôt) |
| 145 objets 3D (GLB) et vignettes | `packages/pascal/apps/editor/public/items/` | Non indiquée | **À vérifier** avant toute diffusion |
| ~300 textures de matériaux (KTX2, WebP, JPG) | `packages/pascal/apps/editor/public/material/` | Non indiquée | **À vérifier** |
| Ciel HDRI `venice_sunset_1k.hdr` | `packages/pascal/apps/editor/public/hdri/` | Probablement CC0 (Poly Haven) | **À vérifier** |
| Sons (38 MP3) | `packages/pascal/apps/editor/public/audios/sfx/` | Non indiquée | **À vérifier** |
| Icônes (WebP, SVG) | `packages/pascal/apps/editor/public/icons/` | Non indiquée (certaines générées par IA selon `icons/fittings/README.md`) | **À vérifier** |
| Fichiers IFC d'exemple | `packages/pascal/apps/ifc-converter/public/test-ifc-files/` | Variable ; `01-duplex.ifc` (NIBS) a des conditions **contradictoires** (CC BY 4.0 / CC BY-ND 3.0) | **Tests locaux seulement**, exclus de Git (`.gitignore`), jamais redistribués |

### Greffons tiers de l'application Pascal

`packages/pascal/apps/editor` installe des greffons depuis GitHub, épinglés par commit (mint,
plugin-bones, plugin-environment, bath-space, landscape, pool, streetscape, trees, webxr).

Vérifié le 2026-11-18 (M19 A5) dans leur `package.json` : **tous sous licence MIT**.

| Greffon | Dans Fabrics | Services externes appelés (seulement quand on l'utilise) |
|---|---|---|
| `@pascal-app/plugin-trees` (arbres) | Oui (A5) | — |
| `@pascal-app/plugin-environment` (sol, eau, ciel) | Oui (A5) | Décodeur Draco de Google (`gstatic.com`) pour certains modèles |
| `@pascal-app/plugin-bones` (ossature, non installé par défaut) | Oui (A5) | Un modèle 3D sur le stockage Supabase de Pascal |
| `@pascal-app/plugin-pool` (piscine) | Oui (A5) | Icônes `api.iconify.design` |
| `@pascal-app/plugin-landscape` (paysage) | Oui (A5) | — (modèles inclus dans le greffon) |
| `@pascal-app/plugin-bath-space` (salle de bain) | Oui (A5) | Liens vers des fiches de fabricants (simples liens) |
| `@pascal-app/plugin-streetscape` (rues) | Oui (A5) | Fonds de carte CARTO (`basemaps.cartocdn.com`) |
| `@webxr/plugin` (réalité virtuelle) | Prévu en A6 | — |
| `@mint/pascal-plugin` (génération d'objets 3D) | **Non** : essayé puis retiré à la demande de l'utilisateur (2026-11-18) | `api.mint.gg` |

Le moteur de Pascal charge aussi les objets de son catalogue depuis son CDN (`editor.pascal.app`,
adresse par défaut de `configureViewer`) et les décodeurs Draco / Basis depuis `gstatic.com` et
`cdn.jsdelivr.net`.

## Outils hors application

| Outil | Licence | Usage |
|---|---|---|
| IfcOpenShell 0.9.0.post1 (Python) | **LGPL-3.0** | Contrôle des fichiers IFC (`tools/ifc/`), dans un environnement Python séparé. Ni inclus ni distribué avec l'application. Un service hébergé exigerait une ADR. |
| Bun 1.4.4 | MIT | Lancement des tests de Pascal (développement seulement) |

## Dépendances npm

Les dépendances de Fabrics (`package.json`) et de Pascal (`packages/pascal/**/package.json`) gardent
leurs propres licences, consultables dans `node_modules/<paquet>/LICENSE`. Points à examiner avant
une diffusion commerciale : `web-ifc` (WASM, MPL-2.0), `manifold-3d` (WASM, Apache-2.0),
`gsap` (licence GreenSock « no charge »).
