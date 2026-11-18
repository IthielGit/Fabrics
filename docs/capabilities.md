# Registre des capacités (Fabrics + Pascal)

Registre unique du mécanisme anti-duplication (`docs/03-ROADMAP.md`) : **une capacité = un seul
module propriétaire**. À consulter avant de coder ; une capacité nouvelle s'inscrit ici avant d'être
codée. Rempli en M17 (2026-11-17) à partir du code de Fabrics et de Pascal (commit `7f30521`).

**Lecture des colonnes**
- **État** : état de la capacité **dans Pascal** (ce qu'on peut réutiliser) : EXISTANT, PARTIEL, ABSENT.
- **Action** : Réutiliser / Étendre / Remplacer (exceptionnel, ADR) / Garder Fabrics (Pascal n'a rien
  d'équivalent : le module Fabrics reste propriétaire et sera branché sur la scène Pascal).
- **Propriétaire** (dernière colonne) : le module qui fait foi **à la fin de la phase**. Jusqu'à la
  bascule indiquée, le module Fabrics actuel reste actif (M17 ne change rien pour l'utilisateur).
- Chemins Pascal relatifs à `packages/pascal/` ; chemins Fabrics relatifs à la racine.

## 1. Modèle, édition, historique

| Capacité | Fabrics | Pascal | État | Preuve | Action | Justification | Non-régression | Propriétaire |
|---|---|---|---|---|---|---|---|---|
| Modèle des plans | `src/types/document.ts` (`FabricsDocument`, mm) | `packages/core/src/schema/types.ts` (`AnyNode`, zod), `schema/nodes/*.ts` (m) | EXISTANT | schémas zod, `nodes/src/index.test.ts` | Réutiliser (M18) | ADR 0001 (D79) : scène Pascal = source de vérité | baseline M17, `documents/migrations.test.ts` | Pascal `core` |
| Modèle des Visuels | `FabricsDocument` (px) | — | ABSENT | — | Garder Fabrics | Pascal ne fait pas d'affiches | `stores/editorStore.test.ts` | Fabrics |
| Identifiants | `crypto.randomUUID()` | `core/src/schema/base.ts` (`generateId(prefix)`, nanoid, `wall_…`) | EXISTANT | `base.ts` | Réutiliser pour les nœuds | ADR 0003 | — | Pascal (nœuds) / Fabrics (reste) |
| Migrations / anciens fichiers | `src/features/documents/migrations.ts` | `core/src/utils/scene-migrations.ts`, `load-migration.ts` (E-003) | EXISTANT | `frozen-floor-gate.test.ts`, `floor-plate-corpus.test.ts` | Réutiliser + Étendre (M18 : migration Fabrics → scène) | Les deux restent : Fabrics pour l'import des anciens plans, Pascal pour les scènes | `migrations.test.ts`, baseline | Pascal + migration Fabrics |
| Store d'édition | `src/stores/editorStore.ts` (zustand) | `core/src/store/use-scene.ts` (zustand) | EXISTANT | `use-scene.ts` | Réutiliser (M18) | Une seule source | `editorStore.test.ts` | Pascal `core` |
| Annuler / rétablir | `editorStore` (100 états) ; `Y.UndoManager` en collaboration | zundo `temporal` dans `use-scene.ts`, `history-drafts.ts` | EXISTANT | `use-scene.ts` | Étendre (ADR M18 : un seul historique avec Yjs) | Deux historiques interdits (R4) | `editorStore.test.ts`, `editorStore.collab.test.ts` | à décider en M18 |
| Commandes / opérations | actions du store | `core/src/commands/structure/*`, `core/src/agent-operations/*` | PARTIEL | dossiers cités | Réutiliser | Opérations sémantiques réutilisables par l'IA (M25) | — | Pascal `core` |
| Événements « modèle changé » | abonnements zustand | `core/src/events/bus.ts` (mitt) | EXISTANT | `bus.ts` | Réutiliser (M18, `ModelChanged`) | — | — | Pascal `core` |
| Niveaux | `Level` (mm), `src/features/documents/levels.ts` | `LevelNode`, `services/level-height.ts` (E-011) | EXISTANT | `level.ts`, wiki `vertical-model.md` | Réutiliser | — | `documents/levels.test.ts` | Pascal |
| Murs | `WallElement` (polyligne) | `wall` (`nodes/src/wall/`), types de murs `schema/wall-type.ts` | EXISTANT | dossiers cités | Réutiliser | Plus riche (couches, types) | `geometry/walls.test.ts`, baseline | Pascal |
| Ouvertures (portes, fenêtres, baies, 16 styles) | `OpeningElement`, `src/features/openings/styles.ts` | `door`, `window` (`nodes/src/door`, `window`) | PARTIEL | dossiers cités | Étendre (styles Fabrics manquants : galandage, garage, va-et-vient…, à vérifier en M19) | Garder les styles validés par l'utilisateur | `openings/styles.test.ts`, `openingSymbolStyles.test.ts` | Pascal étendu |
| Pièces | `RoomElement` | `zone` (E-012, pièces « room-first ») | EXISTANT | `nodes/src/zone/`, `src/features/scene/view/roomClearFloor.ts` | Réutiliser (M18, ADR 0006 : contour à l'axe des murs, sol intérieur par `roomClearPolygon`) | Modèle de Pascal adopté par l'utilisateur le 2026-11-18 | `measurements.test.ts`, baseline par la scène, `scene/migrate/pascalLoad.test.ts` | Pascal |
| Dalles, plafonds, faux plafonds | dalles calculées, `falseCeiling` | `slab`, `ceiling` | EXISTANT | `nodes/src/slab`, `ceiling` | Réutiliser | — | `measurements.test.ts` (plafonds) | Pascal |
| Toitures | `RoofElement` (4 formes), `src/features/building/roof.ts` | `roof`, `roof-segment`, `dormer`, `skylight`, `gutter`… | EXISTANT | `nodes/src/roof*` | Réutiliser ; vérifier formules (M19) | Pascal plus complet (lucarnes, fenêtres de toit) | `building/roof.test.ts` (valeurs de référence) | Pascal |
| Escaliers et trémies | `StairElement`, `src/features/stairs/` | `stair`, `stair-segment`, `floor-opening`, `fit_stair` | EXISTANT | `nodes/src/stair/` | Réutiliser ; garder règles de calcul Fabrics comme contrôle (M19) | Règles de contremarches validées | `stairs/stairs.test.ts`, `voids.test.ts` | Pascal |
| Cheminées | `ChimneyElement` | `chimney` | EXISTANT | `nodes/src/chimney` | Réutiliser | — | `building/chimney.test.ts` | Pascal |
| Plateformes | `PlatformElement` | `slab` surélevée / mezzanine (`create_mezzanine`) | PARTIEL | `src/features/scene/nodes/fabricsNodes.ts` | M18 : nœud Fabrics `fabrics:platform` (une dalle Pascal porte les murs et remonte les portes) ; Pascal en M19 | Constaté sur la grande maison (portes +150 mm) | `measurements/platform.test.ts`, baseline par la scène | Fabrics (nœud de scène) |
| Axes de construction | `AxisElement`, `geometry/axes.ts` | `structural-grid` | PARTIEL | `nodes/src/structural-grid` | Étendre (étiquettes A/B, 1/2) | — | `geometry/axes.test.ts` | Pascal étendu |
| Cotes manuelles | `DimensionElement` | `construction-dimension`, `measurement` | EXISTANT | `nodes/src/construction-dimension` | Réutiliser + champ « Visible en » | — | `dimensioning/visibility.test.ts` | Pascal étendu |
| Lignes de coupe | `SectionLineElement` | `section-group.tsx` (viewer) | PARTIEL | `viewer/src/...section-group.tsx` | Étendre (M20) | — | `geometry/sections.test.ts` | à décider M20 |
| Mobilier et bibliothèque (392 objets 2D) | `src/features/library/` | `item` + 145 GLB, `procedural-item`, `cabinet` | EXISTANT | `apps/editor/public/items/`, `core/src/procedural-items` | Étendre : catalogue Fabrics (symboles 2D) + objets 3D Pascal | Licences des GLB à vérifier (`THIRD_PARTY_NOTICES.md`) | `library/*.test.ts` | Pascal + catalogue Fabrics |
| Pièces préfabriquées | `library/prefabs` | `create_from_template`, `furnish_room` | PARTIEL | outils MCP | Garder Fabrics, branché sur la scène | — | `library/prefabs.test.ts` | Fabrics |
| Fonds DXF importés | `LineElement` + `groupId` | `guide`, `scan` | PARTIEL | `src/features/scene/nodes/fabricsNodes.ts` | M18 : nœud Fabrics `fabrics:annotation` (traits vectoriels ; `guide` = image) | `guide` n'est qu'une image | `export/dxfImport.test.ts`, `scene/migrate/roundTrip.test.ts` | Fabrics (nœud de scène) |
| Matériaux, couches | `src/features/building/materials.ts` | `core/src/material-library.ts`, `node-slots/*`, `schema/assembly.ts` (15 rôles de couches) | EXISTANT | fichiers cités | Réutiliser | Couches d'ouvrage nécessaires aux métrés par lot (M21) | `building/materials.test.ts` | Pascal |
| Terrain et implantation | — | `schema/terrain.ts`, `nodes/src/site/*`, mode `terrain-sculpt` | EXISTANT | fichiers cités | Réutiliser (M19) | — | tests Pascal | Pascal |
| MEP (gaines, tuyaux) | — | `duct-*`, `pipe-*`, `hvac-equipment` | EXISTANT | `nodes/src/` | Réutiliser sans amélioration | Hors périmètre (roadmap « Plus tard ») | tests Pascal | Pascal |

## 2. Vues et interface

| Capacité | Fabrics | Pascal | État | Preuve | Action | Justification | Non-régression | Propriétaire |
|---|---|---|---|---|---|---|---|---|
| Interface générale (accueil, éditeur, en-tête, rail d'outils, panneaux, réglages, aide) | `src/pages/`, `src/components/editor/` | `apps/editor/app/*`, `packages/editor/src/components/` (Radix, cmdk) | EXISTANT | dossiers cités | Réutiliser (M19 lot A) ; fonctions de Fabrics reconstruites dedans | D80 : l'interface vient de Pascal ; destinations dans `docs/screen-map.md` | `regression-checklist.md` en entier | Pascal |
| Composants de base (boutons, champs, fenêtres) | `src/components/ui/` | `packages/editor/src/components/ui/primitives`, `controls` | EXISTANT | dossiers cités | Réutiliser (M19 lot A) | D80, ADR 0003 | — | Pascal |
| Effets, sons, navigation de Pascal | — | `viewer` (post-traitement TSL, HDRI, `sfx`, `xr`, `first-person`) | EXISTANT | dossiers cités | Réutiliser tels quels (M19 lot A) | D81 | comparaison côte à côte avec Pascal seul | Pascal |
| Éditeur des Visuels | `src/components/editor/` (Konva) | — | ABSENT | — | Garder Fabrics, habillé style Pascal | D80 | critères M1, M2, M4 | Fabrics |
| Plan 2D éditable | Konva (`src/components/editor/`) | `editor/src/components/editor/floorplan-panel.tsx` (SVG), `editor-2d/*` | EXISTANT | fichiers cités | Remplacer par Pascal en M19 (D80) ; couches Fabrics (cotation, épingles, présence) ajoutées | D80 : l'éditeur vient de Pascal | liste M0–M16 « Nav. » | Pascal + couches Fabrics |
| Plan 2D en lecture seule | page de partage | `viewer/ui` `FloorplanPreview` | EXISTANT | `viewer/src/ui/floorplan/floorplan-preview.tsx` | Réutiliser (M19) | — | `sharing/shareLogic.test.ts` | Pascal |
| Aimantation, guides | `geometry/snapping.ts`, `guides.ts` | `core/src/services/snap.ts`, `alignment.ts` (E-004) | EXISTANT | fichiers cités | Réutiliser + Étendre (fond DXF, niveau de référence) | — | `geometry/snapping.test.ts`, `backgroundSnap.test.ts` | Pascal étendu |
| Saisie précise (longueur au clavier) | `geometry/typedLength.ts` | `editor/src/lib/floorplan/dimension-drive.ts` | EXISTANT | fichier cité | Réutiliser, vérifier en mm | — | `typedLength.test.ts` | Pascal |
| Vue 3D | `src/components/viewer3d/` (R3F, WebGL) | `@pascal-app/viewer` (WebGPU, repli WebGL) | EXISTANT | `viewer/src/components/viewer/index.tsx` | Remplacer par Pascal en **M19** (ADR 0003) | Moteur plus complet | critères M8 | Pascal `viewer` |
| Façades, coupes, planche | `src/features/building/views/` (SVG, PDF vectoriel) | `section-group.tsx` (3D) ; pas de façades 2D | PARTIEL | — | Garder Fabrics, branché sur la scène (M18), étendu en M20 | Pascal n'a pas de façades/coupes dessinées | baseline SVG, `views/*.test.ts` | Fabrics |
| Cotation Client / Exécution, repères M01/P01/F01 | `src/features/dimensioning/`, `measurements/references.ts` | — | ABSENT | — | Garder Fabrics, branché sur la scène (M18) | Fonction propre à Fabrics, validée | baseline, `dimensioning/*.test.ts` | Fabrics |
| Noms automatiques | `src/features/naming/autoNames.ts` | — | ABSENT | — | Garder Fabrics | — | `autoNames.test.ts` | Fabrics |
| Mise en page, feuilles, cartouche | `export/cartouche.ts`, `pdfLayout.ts` | `editor/src/lib/floorplan/sheet-export.ts`, nomenclatures `schedules.ts` | PARTIEL | fichiers cités | Étendre en M20 (feuilles numérotées, révisions) | — | `export/cartouche.test.ts` | à décider M20 |
| Textes d'interface (i18n) | `src/i18n/fr.ts` | Lingui 6.12, `editor/src/i18n/locales/fr/messages.po` (3 963 messages, **non traduits**) | PARTIEL | `lingui.config.ts` | Étendre : traduire le catalogue `fr`, y verser `fr.ts` (M19) | Doublon tranché : Lingui (choix de l'utilisateur, 2026-11-18, ADR 0003) | `i18n:check` de Pascal | Lingui |
| Unités d'affichage | `src/features/units/` (mm, m², m³) | `core/src/utils/measurement-format.ts` (m, ft) | PARTIEL | fichier cité | Garder Fabrics pour tout affichage | Règle « Métrique architectural » | `units/format.test.ts` | Fabrics |

## 3. Quantités, documents, échanges

| Capacité | Fabrics | Pascal | État | Preuve | Action | Justification | Non-régression | Propriétaire |
|---|---|---|---|---|---|---|---|---|
| Métrés (surfaces, longueurs, volumes, brut / net) | `src/features/measurements/` | `core/src/lib/zone-quantities.ts` (par pièce) | PARTIEL | fichier cité | Garder Fabrics, branché sur la scène (M18), étendu en M21 | Métrés Client / Exécution validés | baseline JSON, HOUSE-01 | Fabrics |
| Nomenclatures (portes, fenêtres, pièces) | tableaux des métrés | `editor/src/lib/floorplan/schedules.ts` | PARTIEL | fichier cité | Étendre en M20 (une seule implémentation à choisir) | Doublon à trancher en M20 | baseline tables | à décider M20 |
| Contrôles du plan (manques, chevauchements) | `measurements/warnings.ts`, `roomCoverage.ts` | `validate_design`, `validate_scene`, `verify_scene`, `check_collisions` | PARTIEL | outils MCP | Étendre (M21, M24) | — | `warnings.test.ts` | à décider M21 |
| Traçabilité des métrés | — | — | ABSENT | — | Ajouter (M21) | — | — | Fabrics (nouveau) |
| Bibliothèque de prix, DQE | — | — | ABSENT | — | Ajouter (M23) | Aucun prix inventé | — | Fabrics (nouveau) |
| Export CSV / XLSX des métrés | `measurements/csv.ts`, `export/metresXlsx.ts` | — | ABSENT | — | Garder Fabrics | — | baseline CSV / XLSX | Fabrics |
| Export PDF | `jspdf` (`export/pdf.ts`, `metresPdf.ts`) | `pdfkit` (`floorplan-pdfkit-document.ts`) | EXISTANT | fichiers cités | Décider en M20 (ADR 0003) | Doublon | `export/pdf*.test.ts` | à décider M20 |
| Export PNG / JPG | Konva | — | ABSENT | — | Garder Fabrics | — | `export/limits.test.ts` | Fabrics |
| Export DXF / import DXF | `export/dxf*.ts` | — | ABSENT | — | Garder Fabrics, branché sur la scène | — | `export/dxf*.test.ts` | Fabrics |
| Export IFC | `export/ifc.ts` (IFC2X3, **non strictement valide**, R14) | `ifc-converter/src/export/scene-to-ifc.ts` (IFC4, sans web-ifc) | EXISTANT | fichiers cités | Remplacer par Pascal en **M22** (ADR 0003) | Pascal plus complet (matériaux, quantités, propriétés) | baseline IFC, `tools/ifc/validate.py` | Pascal `ifc-converter` |
| Import IFC | — | `convertIfcToPascal` (web-ifc 0.0.78), app séparée | EXISTANT | `ifc-converter/src/index.ts` | Réutiliser (M22) dans Fabrics | — | tests Pascal | Pascal `ifc-converter` |
| Contrôle IFC externe | `tools/ifc/validate.py` (IfcOpenShell, M17) | — | ABSENT | — | Garder (outil hors application) | LGPL, hors application | — | Fabrics `tools/ifc` |
| Export 3D | glTF (`export/gltf.ts`) | GLB, USDZ, STL, OBJ, 3MF (`editor/src/lib/*-export.ts`) | EXISTANT | fichiers cités | Remplacer par Pascal en M19 avec la vue 3D | Doublon glTF | `export/gltf.test.ts` | Pascal |

## 4. Stockage, collaboration, comptes

| Capacité | Fabrics | Pascal | État | Preuve | Action | Justification | Non-régression | Propriétaire |
|---|---|---|---|---|---|---|---|---|
| Stockage des projets | `src/features/persistence/` (IndexedDB, Supabase) | `useAutoSave`, `onLoad` / `onSave` ; SQLite côté serveur (MCP) | EXISTANT | `editor/src/hooks/use-auto-save.ts` | Garder Fabrics (Supabase), branché via `onLoad` / `onSave` | D75 : Fabrics garde Supabase | `persistence/*.test.ts` | Fabrics |
| Comptes, partage, membres | `src/features/auth`, `sharing` | — | ABSENT | — | Garder Fabrics | — | `sharing/*.test.ts`, `check:security` | Fabrics |
| Collaboration temps réel | Yjs + `collab-server/` | SSE simple (`apps/editor/app/api/scenes/[id]/events`) | PARTIEL | fichier cité | Garder Fabrics, sur les nœuds Pascal (M18) | CRDT absent de Pascal | `collab/*.test.ts` | Fabrics |
| Historique de versions | `src/features/versions/` | `SceneMeta.version`, `saveMode` draft/checkpoint | PARTIEL | MCP `set_checkpoint` | Garder Fabrics | — | `versions/*.test.ts` | Fabrics |
| Commentaires ancrés | `src/features/comments/` | — | ABSENT | — | Garder Fabrics, ancrés sur les nœuds (M18) | — | `comments/*.test.ts` | Fabrics |

## 5. API, MCP, IA

| Capacité | Fabrics | Pascal | État | Preuve | Action | Justification | Non-régression | Propriétaire |
|---|---|---|---|---|---|---|---|---|
| Serveur MCP | — | `packages/mcp/src/server.ts`, `tools/index.ts` (~80 outils) | EXISTANT | fichiers cités | Réutiliser (M25) | — | tests Pascal | Pascal `mcp` |
| CLI | — | `packages/cli/src/bin/pascal.ts` | EXISTANT | fichier cité | Réutiliser tel quel (non intégré à l'application) | — | tests Pascal | Pascal `cli` |
| Calcul sur copie détachée de la scène | — | `@pascal-app/core/runtime` (E-018) | EXISTANT | `core/src/runtime/*` | Réutiliser (M25 : aperçu avant accord) | — | `fixture-parity.test.ts` | Pascal |
| Assistant IA (chat) | — | contrats seulement (`editor/src/lib/plugin-chat.ts`, `point-ask/*`) ; service hébergé absent | PARTIEL | fichiers cités | Étendre : écrire l'orchestration (M25) | Le service de Pascal n'est pas public | — | Fabrics (nouveau) sur contrats Pascal |
| Services hébergés de Pascal (site, médias) | — | `hosted-services.ts` | PARTIEL | fichier cité | Ne pas utiliser sans ADR | Service externe, coût, compte | — | — |

## 6. Outillage

| Capacité | Fabrics | Pascal | État | Preuve | Action | Justification | Non-régression | Propriétaire |
|---|---|---|---|---|---|---|---|---|
| Tests | Vitest (`npm test`) | `bun test` par paquet | EXISTANT | `package.json` | Les deux, périmètres séparés (ADR 0002) | Tests de Pascal inchangés | `check:all` | les deux |
| Lint | oxlint (`src/`) | Biome (`biome.jsonc`) | EXISTANT | fichiers cités | Les deux, périmètres séparés (ADR 0003) | — | `check:all` | les deux |
| Test d'architecture | `src/architecture.test.ts` (M17) | `core/src/architecture.test.ts`, Biome `noRestrictedImports` | EXISTANT | fichiers cités | Réutiliser le principe | — | `check:all` | les deux |
| Intégration continue | — | `.github/workflows/ci.yml` (inactif ici : dossier imbriqué) | EXISTANT | fichier cité | Nouveau workflow à la racine de Fabrics (M17) | — | — | Fabrics |
