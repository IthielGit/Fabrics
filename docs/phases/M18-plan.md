# M18 — Modèle BIM unifié (gate G1) : plan

- Date : 2026-11-18
- Branche : `feat/m18-bim-model` (dossier de travail séparé `Fabrics-m18`)
- Statut : **validé par l'utilisateur le 2026-11-18** : points 1 A, 2 A, **3 B**, 4 A, 5 A

### Décisions (2026-11-18)

1. Éditeur actuel : **vue calculée** de la scène (A).
2. Historique : **`Y.UndoManager` partout** (A).
3. Projets enregistrés : **script de migration de toute la base Supabase (B)**. Conditions : sauvegarde
   complète des tables `projects` et `project_versions` dans une table de secours
   (`projects_backup_m18`, `project_versions_backup_m18`) avant toute écriture ; essai à blanc qui
   compte et vérifie sans écrire ; lancement réel seulement avec l'accord explicite de l'utilisateur au
   moment de l'exécuter. Les projets **sans compte** (`LocalRepository`, dans le navigateur) ne sont pas
   atteignables par un script : ils restent convertis à l'ouverture, avec la même fonction.
4. Éléments absents de Pascal : **types de nœuds Fabrics** par `registerNode` (A).
5. Murs à plusieurs côtés : repère du mur d'origine, commentaire sur le premier segment (A).

## 1. Existant (constaté le 2026-11-18)

| Sujet | Fabrics | Pascal |
|---|---|---|
| Modèle | `FabricsDocument` (`src/types/document.ts`), 16 types d'éléments à plat, en mm | scène `@pascal-app/core` : nœuds typés (zod), en m, ids `wall_…` (`schema/base.ts`) |
| Dépendance au modèle | `editorStore` utilisé par **95 fichiers**, `FabricsDocument` / `CanvasElement` par **79** | `use-scene.ts` (zustand + zundo) |
| Annuler | `editorStore` (100 états) seul ; `Y.UndoManager` en collaboration | zundo `temporal` + `history-drafts.ts` |
| Événements | abonnements zustand | `events/bus.ts` (mitt) |
| Stockage | `projects.document` et `project_versions.document` (jsonb) ; `LocalRepository` (sans compte), `SupabaseRepository`, `ResilientRepository` | fichiers / API de son application Next.js |
| Collaboration | Yjs (`src/features/collab/yDocument.ts`, `collabBinding.ts`) | aucune (SSE simple) |
| Commentaires | ancrés sur l'id d'un élément (`comments/commentTarget.ts`) | aucun |
| Extension | — | `registerNode` (`registry/registry.ts`) : types de nœuds ajoutés sans toucher au code de Pascal |

Correspondance des types (à confirmer élément par élément dans le lot B) :

| Fabrics | Pascal | Remarque |
|---|---|---|
| niveau | `level` (dans `site` / `building`) | altitude, hauteur |
| `wall` (polyligne) | plusieurs `wall` (un par segment) | un mur Fabrics à N côtés → N murs Pascal ; table de correspondance gardée |
| `opening` (porte, fenêtre, baie) | `door`, `window` (enfants du mur) | position relative → `position` en m le long du mur |
| `room` | `zone` | contour |
| plafond, dalle implicite | `ceiling`, `slab` | |
| `roof` | `roof` / `roof-segment` | |
| `stair` | `stair` / `stair-segment` | trémie → `floor-opening` |
| `chimney` | `chimney` | |
| `platform` | `slab` surélevée | à vérifier |
| `axis` | `structural-grid` | |
| `dimension` | `construction-dimension` / `measurement` | |
| `furniture` | `item` | bibliothèque Fabrics → `item` avec référence d'objet |
| fond DXF (`line` + `groupId`, `text`) | `guide` ? | à décider (point 4) |
| `section` (trait de coupe) | — | **absent** : type ajouté par `registerNode` (point 4) |
| `text`, `rect`, `ellipse`, `image` dans un plan | — | **absents** : type « annotation » ajouté (point 4) |

## 2. Points à confirmer avant de coder

**Point 1 — Comment l'éditeur actuel travaille pendant M18 (le plus important).**
L'éditeur Konva de Fabrics sera remplacé par celui de Pascal en M19. Deux façons de le brancher sur la scène :

- **A (recommandé) : vue calculée.** La scène Pascal est le seul document enregistré, partagé et versionné.
  L'éditeur actuel lit une **vue calculée** de la scène (`FabricsDocument` produit par une fonction pure,
  jamais enregistré), et chaque geste est traduit en **modification de la scène**. Une seule source,
  peu de fichiers touchés, rien de jeté en M19. Limite : la vue est recalculée à chaque changement
  (à surveiller avec le test « 600 murs »).
- **B : réécrire l'éditeur actuel sur les nœuds Pascal.** Plus « pur », mais 95 fichiers réécrits pour
  un éditeur retiré au jalon suivant.

**Point 2 — Un seul historique annuler / rétablir (risque R4).**
- **A (recommandé) : `Y.UndoManager` partout**, seul ou à plusieurs (un document Yjs local quand on
  travaille seul). Annuler ne défait que ses propres gestes en collaboration ; l'historique zundo de
  Pascal est mis en pause (réglage prévu par Pascal, pas de modification de son code).
- B : l'historique de Pascal (zundo), Yjs ne servant qu'au transport. Annuler défairait aussi les
  gestes des autres : à éviter.

**Point 3 — Migration des projets enregistrés.**
- **A (recommandé) : à l'ouverture.** Un plan à l'ancien format est converti en mémoire quand on
  l'ouvre, puis enregistré au nouveau format ; l'ancien document est d'abord gardé comme **version
  « Avant M18 »** dans l'historique (retour arrière possible). Les anciennes versions sont converties
  quand on les affiche ou les restaure. Aucun script sur la base.
- B : script qui convertit tous les projets d'un coup dans Supabase (migration destructive, demande
  un accord spécial et une sauvegarde de la base).

**Point 4 — Éléments que Pascal n'a pas** (trait de coupe, textes / formes / images dans un plan,
fond DXF, plateformes si `slab` ne suffit pas) :
- **A (recommandé) : types de nœuds Fabrics** déclarés par `registerNode` (`fabrics-section`,
  `fabrics-annotation`, `fabrics-underlay`…), dans `src/features/scene/nodes/`. Prévu par Pascal,
  aucun fichier de Pascal modifié, tout reste dans la même scène.
- B : les ranger à côté de la scène, dans un champ à part. Deux sources : contraire à D79.

**Point 5 — Repères `M01`, `P01`, `F01` et commentaires après découpe des murs.**
Un mur Fabrics à plusieurs côtés devient plusieurs murs Pascal. Proposition : le repère reste celui
du mur d'origine (`M01`) ; la scène garde le lien « murs issus du même tracé », et un commentaire posé
sur l'ancien mur est rattaché au premier segment. Les métrés doivent rester **identiques** à la baseline.

## 3. Lots et fichiers

Chaque lot : `npm run check:all` vert, case cochée, journal, commit.

### Lot A — Branchement technique
- Alias Vite `@pascal-app/core` → `packages/pascal/packages/core`, `resolve.dedupe` (react, three, zustand)
  (ADR 0002 § 5) ; mêmes alias dans Vitest et TypeScript.
- `docs/adr/0004-editor-transition.md` (point 1), `docs/adr/0005-undo-history.md` (point 2).
- Test d'architecture : seul `src/features/scene/` importe `@pascal-app/core`.
- Fichiers : `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `src/features/scene/index.ts`,
  `src/architecture.test.ts`.

### Lot B — Migration et vue calculée (fonctions pures)
- `src/features/scene/migrate/fromFabrics.ts` : `FabricsDocument` → scène, un fichier par type
  (niveaux, murs, ouvertures, pièces, dalles, plafonds, toitures, escaliers, trémies, cheminées,
  plateformes, axes, cotes, coupes, mobilier, fonds DXF, annotations).
- `src/features/scene/view/toFabricsView.ts` : scène → vue `FabricsDocument` (pour l'éditeur actuel).
- `src/features/scene/units.ts` : seule conversion mm ↔ m (arrondi au mm entier).
- `src/features/scene/nodes/*` : types Fabrics (point 4).
- Tests : aller-retour au mm sur le plan d'exemple, la grande maison et chaque type ; **métrés égaux à la
  baseline M17** (`baseline/fabrics/`) au mm et au centième de m² ; HOUSE-01 et HOUSE-02 ; **les 7 cas
  d'EDGE-01** (erreur claire ou exclusion signalée, jamais un résultat faux en silence) ; scènes
  validées par les schémas zod de Pascal.

### Lot C — La scène devient le document en mémoire
- `src/features/scene/sceneStore.ts` : scène chargée dans `use-scene` de Pascal ; `editorStore` garde
  la sélection, l'outil, le zoom, et lit la vue calculée.
- `src/features/scene/commands/*` : chaque action de l'éditeur (créer, déplacer, modifier, supprimer,
  coller, verrouiller…) devient une modification de la scène.
- Événement `ModelChanged` (bus de Pascal) ; un seul historique (point 2) ; ids stables.
- Tests : créer / modifier / supprimer / annuler gardent ids et dimensions ; aucun élément fantôme ;
  tests existants de `editorStore` passés sur la nouvelle base.
- Fichiers : `src/stores/editorStore.ts` et ses actions (modifiés, pas réécrits).

### Lot D — Enregistrement, versions, duplication
- Format enregistré : `{ format: 'pascal-scene', version, scene }` dans `projects.document`
  (aucune colonne ajoutée).
- Script `scripts/migrate-plans-m18.mjs` (point 3 B) : sauvegarde dans les tables de secours, essai à
  blanc (`--dry-run`, rapport par projet : métrés avant / après), puis écriture projet par projet ; les
  projets dont les métrés diffèrent sont **laissés intacts** et listés. Migration à l'ouverture gardée
  pour les projets sans compte et comme filet pour un plan resté à l'ancien format.
- `LocalRepository`, `SupabaseRepository`, `ResilientRepository`, `createProject`, duplication,
  `versions/*` (aperçu, comparaison, restauration d'anciennes et de nouvelles versions).
- Tests : enregistrer → rouvrir identique ; ancien plan → rouvert avec les mêmes métrés ; dupliquer ;
  restaurer une version d'avant M18.

### Lot E — Collaboration et commentaires
- `collab/yDocument.ts`, `collabBinding.ts` : Yjs sur les nœuds de la scène (une entrée par nœud) ;
  présence inchangée ; `saveLeader` enregistre la scène.
- `comments/commentTarget.ts` : ancrage sur l'id du nœud ; reprise des anciens ancrages (point 5).
- Tests : deux documents Yjs qui modifient la même scène convergent ; annuler ne défait que ses gestes ;
  un commentaire suit son élément déplacé.
- Vérification dans deux navigateurs (`collab-server` local).

### Lot F — Métrés, cotes, repères ; gate G1
- Métrés, cotes Client / Exécution, repères, façades, coupes, planche, exports (PDF, CSV, XLSX, DXF,
  IFC) calculés depuis la scène (via la vue calculée en M18 ; lecture directe des nœuds en M21).
- Comparaison complète à la baseline M17 (métrés JSON, SVG, exports) ; `test:pascal` inchangé.
- `docs/phases/M18-report.md`, `docs/capabilities.md`, `docs/regression-checklist.md`, `docs/risks.md`
  (R2, R3, R4), roadmap, journal.

## 4. Tests et vérifications

- Automatiques : nouveaux tests Vitest (migration, vue, commandes, stockage, Yjs, commentaires, EDGE-01) ;
  toute la suite existante ; baseline M17 ; `npm run test:pascal` et `lint:pascal` identiques à M17.
- Dans le navigateur (par l'utilisateur, à la fin) : ouvrir un plan créé avant M18 et comparer ses
  métrés ; créer / modifier / supprimer / annuler ; deux navigateurs sur le même plan ; un commentaire
  sur un mur ; restaurer une ancienne version ; dupliquer un projet ; projets Visuel inchangés.

## 5. Risques

| Risque | Parade |
|---|---|
| Écart de métrés après conversion (arrondis m ↔ mm) | une seule fonction de conversion, aller-retour testé, baseline au mm |
| Vue recalculée trop lente sur les gros plans | recalcul limité aux nœuds changés ; test « 600 murs » |
| Pascal « répare » la scène au chargement (`loadScene`, migrations) et change des valeurs | tests sur la scène après `loadScene`, pas seulement sur la sortie de la migration |
| Cloudflare Pages construit avec `npm run build` seul : il lui faudra Bun et `build:pascal` dès que l'application importe Pascal | commande de build changée au lot C, avec l'accord de l'utilisateur, avant tout merge dans `main` |
| Taille du bundle (core de Pascal, three) | mesurée au lot A ; chargement différé de l'éditeur Plan si besoin |
| Plan enregistré au nouveau format ouvert par un onglet resté sur l'ancienne version | numéro de format refusé proprement par l'ancienne version (message, pas d'écrasement) |
| Projet partagé en cours de migration pendant une collaboration | migration faite par le seul « leader » d'enregistrement (`saveLeader`) |

## 6. Définition de terminé (G1)

- Les quatre critères G1 du roadmap sont tenus, avec preuves (tests et captures) dans `M18-report.md`.
- `npm run check:all` vert en local et sur la CI ; aucun écart avec la baseline M17 non documenté.
- Les projets Visuel et toutes les fonctions de `docs/regression-checklist.md` marchent comme avant.
