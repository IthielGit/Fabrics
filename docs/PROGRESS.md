# Journal de progression

Tenu à jour par Claude à la fin de chaque tâche (voir `CLAUDE.md`).

## État actuel

- **Jalon en cours :** M1 — Socle de l'éditeur (plan présenté, en attente du feu vert)
- **Dernière tâche terminée :** M0 — validé par l'utilisateur, commit `ceb3115`
- **Prochaine tâche :** M1, après feu vert sur la liste des tâches
- **Problèmes connus :** fichiers de démo Vite restants (`src/App.css`, `src/assets/vite.svg`, `public/icons.svg`) à supprimer (voir D16 et D17 : lint = oxlint, TypeScript 7)

## Jalons

| Jalon | Statut | Validé par l'utilisateur le |
|---|---|---|
| M0 Mise en place | terminé | 2026-11-10 |
| M1 Socle de l'éditeur | à faire | |
| M2 Contenu et mise en forme | à faire | |
| M3 Mode plan et métrés | à faire | |
| M4 Export | à faire | |
| M5 Mise en ligne | à faire | |
| M6 Comptes et sauvegarde cloud | à faire | |
| M7 Collaboration temps réel | après le MVP | |

## Journal

<!-- Format d'une entrée (la plus récente en haut) :
### AAAA-MM-JJ — M1 · Outil rectangle
- Fait : …
- Fichiers : src/…, src/…
- Vérification : build ✓ lint ✓ tests ✓ — testé dans le navigateur : …
- Commit : feat: outil rectangle
-->

### 2026-11-10 — M1 · Sélection et transformation
- Fait : sélection par clic, Maj + clic (ajouter / retirer), rectangle de sélection (Maj = ajouter) ; clic dans le vide = désélection ; `Transformer` Konva (redimensionner, pivoter avec aimantation à 45°, taille minimale) ; déplacement d'un ou plusieurs éléments ensemble ; chaque geste ne crée qu'un seul état d'historique. Logique pure `applyNodeTransform` testée (l'échelle Konva est « cuite » dans les dimensions).
- Fichiers : `src/components/editor/{SelectionTransformer,useElementInteractions,EditorStage}`, `src/features/geometry/transform(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (61 au total) — contrôle dans le navigateur à faire par l'utilisateur (le comportement des poignées et du glisser n'est pas testable automatiquement)
- Commit : feat: sélection et transformation des éléments

### 2026-11-10 — M1 · Barre d'outils et tracé de formes
- Fait : barre d'outils (Sélection, Rectangle, Ellipse) ; tracé au glisser, ou au simple clic (forme de taille par défaut centrée sur le clic : 200 px, ou 1 m sur un plan) ; aperçu pointillé pendant le tracé ; retour automatique à l'outil Sélection ; affichage des rectangles et ellipses ; raccourcis `V`, `R`, `O`, `Échap`, `Ctrl+0`. Les éléments ne sont pas encore sélectionnables (tâche suivante).
- Fichiers : `src/components/editor/{Toolbar,ElementNode,EditorStage,useEditorShortcuts}`, `src/components/editor/shapes/*`, `src/features/geometry/box(.test).ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (55 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: barre d'outils et tracé de rectangles et ellipses

### 2026-11-10 — M1 · Canevas, zoom et déplacement
- Fait : page de l'éditeur (charge le projet depuis le dépôt, gère « introuvable » et erreur) ; `Stage` Konva plein écran avec la page et son fond ; zoom molette vers le curseur ; déplacement de la vue avec Espace + glisser ; « Ajuster à l'écran » (bouton, et automatique à l'ouverture) ; affichage du zoom. Logique pure : `features/geometry/viewport.ts` (zoom vers un point, ajustement, conversion écran → document) et `features/units/scale.ts` (0,2 px/mm pour les plans).
- Fichiers : `src/pages/EditorPage.tsx`, `src/components/editor/{EditorStage,ZoomControls,useContainerSize,isTypingTarget}`, `src/features/geometry/viewport(.test).ts`, `src/features/units/scale.ts`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (49 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: canevas avec zoom et déplacement de la vue

### 2026-11-10 — M1 · Page d'accueil
- Fait : liste des projets (nom, type, date relative en français), « Nouveau visuel » (fenêtre de choix du format avec aperçu des proportions), « Nouveau plan », menu ⋯ (renommer, dupliquer, supprimer avec confirmation), état vide utile, chargement et erreur. Composants `ui/` : Button, Modal, Menu. Textes dans `fr.ts`.
- Fichiers : `src/pages/HomePage.tsx`, `src/components/home/*`, `src/components/ui/*`, `src/lib/relativeTime.ts` (+ test), `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (39 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: page d'accueil et gestion des projets

### 2026-11-10 — M1 · Store des projets
- Fait : `createProjectsStore(repo)` (dépôt injecté, donc testable) et `useProjectsStore` ; actions rafraîchir, créer Visuel / Plan (renvoient l'identifiant), renommer, dupliquer (suffixe « (copie) »), supprimer. `repository.ts` : point unique de choix du dépôt (local ; Supabase en M6).
- Fichiers : `src/stores/projectsStore.ts`, `projectsStore.test.ts`, `src/features/persistence/repository.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (34 au total)
- Commit : feat: store des projets

### 2026-11-10 — M1 · Store de l'éditeur
- Fait : `editorStore` (document, sélection, outil, zoom/position, historique de 100 états, état de sauvegarde, compteur `revision` pour déclencher la sauvegarde) ; actions ajouter / remplacer / modifier / supprimer / dupliquer, annuler / rétablir. Un appel = un seul état d'historique (le geste complet de Konva est validé à la fin, pas à chaque mouvement). Création des rectangles et ellipses dans `features/documents/elements.ts`.
- Fichiers : `src/stores/editorStore.ts`, `editorStore.test.ts`, `src/features/documents/elements.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (28 au total : annuler 3 / rétablir 3, suppression multiple, limite de 100, immutabilité)
- Commit : feat: store de l'éditeur avec historique

### 2026-11-10 — M1 · Fabrique de projets
- Fait : `createDesignProject` (5 formats), `createPlanProject` (20 × 15 m, 1:50, grille 10 cm), `duplicateProject` (copie indépendante, mêmes `assetId`).
- Fichiers : `src/features/documents/createProject.ts`, `createProject.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (15 au total)
- Commit : feat: création et duplication de projets

### 2026-11-10 — M1 · Dépôt local (IndexedDB)
- Fait : interface `ProjectRepository`, `LocalRepository` (clés `project:`, `meta:`, `asset:`), nettoyage des images non référencées à la suppression d'un projet, URLs d'images mises en cache et libérées.
- Fichiers : `src/features/persistence/{types,collectAssetIds,LocalRepository}.ts`, `LocalRepository.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (8 tests, `idb-keyval` simulé)
- Commit : feat: dépôt local IndexedDB

### 2026-11-10 — M1 · Retrait de la démo et dépendances
- Fait : suppression de `src/App.css`, `src/assets/vite.svg`, `public/icons.svg` ; installation de `konva`, `react-konva` (19), `zustand`, `idb-keyval`, `lucide-react`, `clsx`, `vitest` ; script `npm test`.
- Vérification : build ✓ lint ✓ (pas encore de test)
- Commit : chore: retrait de la démo Vite et dépendances du jalon M1

### 2026-11-10 — M0 · Mise en place
- Fait : projet Vite (React 19 + TypeScript) à la racine ; Tailwind v4 (`@tailwindcss/vite`) ;
  `react-router` avec les routes `/` et `/p/:projectId` (+ page « introuvable ») ;
  arborescence de `docs/02-ARCHITECTURE.md` (`.gitkeep` dans les dossiers vides) ;
  `src/i18n/fr.ts` ; `src/types/document.ts` (copie exacte du modèle) ; favicon original ;
  `lang="fr"` et titre « Fabrics » ; `"strict": true` ajouté dans `tsconfig.app.json` ;
  `.env.local` ajouté explicitement dans `.gitignore` ; `git init -b main`.
- Fichiers : `package.json`, `vite.config.ts`, `index.html`, `tsconfig.app.json`, `.gitignore`,
  `public/favicon.svg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`,
  `src/pages/HomePage.tsx`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`,
  `src/types/document.ts`.
- Vérification : build ✓ lint ✓ (tests : pas avant M1) — serveur de dev : `/` et `/p/test`
  répondent 200, CSS Tailwind servi. Contrôle visuel dans le navigateur à faire par
  l'utilisateur.
- Commit : à proposer (`chore: mise en place du projet (M0)`)

## Décisions prises

<!-- Toute décision qui s'écarte des docs ou les précise, avec la raison. -->

### 2026-11-10 — Résolution des points flous de la lecture initiale

Docs mises à jour : `CLAUDE.md`, `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md`,
`docs/03-ROADMAP.md`.

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D1 | Surface des pièces | Surface **au tracé** (polygone dessiné). Aimantation aussi sur les angles des faces de murs. Mention dans le panneau Métrés. | Calcul simple et vérifiable ; l'utilisateur obtient la surface intérieure en traçant sur les faces. |
| D2 | Échelle à l'écran | Barre d'état « Zoom 100 % · Impression 1:50 », jamais d'échelle « écran ». | Une échelle écran dépend du moniteur et serait fausse. |
| D3 | Zone exportée d'un plan | Emprise des éléments visibles + 500 mm ; la page 20 × 15 m reste une zone de travail. Marges de 10 mm et bande cartouche de 20 mm. | Le plan par défaut ne tient sur aucune feuille à 1:50. |
| D4 | Plafond d'export | 8 192 px par côté et 16 777 216 px au total ; options trop grandes grisées, dpi du PDF réduit si besoin. | Limites sûres des canvas navigateur. |
| D5 | PDF d'un Visuel | Centré avec marges de 10 mm ; pleine page si même format A4 / A3. Formats A4 = 2480 × 3508 px, A3 = 3508 × 4961 px (300 dpi). | La conversion px → mm n'était pas définie. |
| D6 | Points des éléments de plan | Coordonnées absolues, `x = y = 0`, `rotation = 0`, Transformer en déplacement seul. | Évite les ambiguïtés entre rotation, échelle et métrés. |
| D7 | `DimensionElement.points` | Reste un tuple de 4 nombres. | Copie exacte du modèle exigée. |
| D8 | Grille d'un Visuel | Repoussée (voir Idées). | Aucun réglage prévu dans le modèle. |
| D9 | Images partagées | Même `assetId` à la duplication et au collage ; suppression d'un projet = suppression des seules images qui ne sont plus référencées. | Éviter de casser un projet dupliqué. |
| D10 | Réordonner les calques | Glisser-déposer HTML5 natif + boutons Monter / Descendre. | Aucune nouvelle dépendance. |
| D11 | Tests du dépôt local | `idb-keyval` simulé avec `vi.mock`. | Aucune nouvelle dépendance. |
| D12 | `npm test` en M0 | Exigé seulement à partir de M1. | Le script n'existe qu'en M1. |
| D13 | Nom du paquet | `fabrics` dans `package.json`. | npm refuse les majuscules (dossier `Fabrics`). |
| D14 | Branche git | `git init -b main`. | Le déploiement automatique de M5 suit `main`. |
| D15 | Méthode | Un jalon à la fois, feu vert avant chaque jalon, même si un plan d'ensemble a été présenté. | Règle 1 de `CLAUDE.md`. |
| D16 | Outil de lint | `npm run lint` = **oxlint** (fourni par le gabarit Vite actuel), pas ESLint. | Le gabarit officiel l'utilise ; la commande reste `npm run lint`, comme dans `CLAUDE.md`. |
| D17 | Versions | Dernières versions stables à l'installation : React 19, Vite 8, TypeScript 7, Tailwind v4. `react-konva` (M1) devra être en version 19. | Règle « dernière version stable » de `docs/02-ARCHITECTURE.md`. |
| D18 | Dossier `features/documents/` | Ajouté pour la création et la duplication de projets (logique pure testée). | Ces fonctions n'entrent dans aucun dossier prévu par `docs/02-ARCHITECTURE.md`. |

## Idées (hors jalon en cours)

<!-- Demandes de l'utilisateur ou idées de Claude à prioriser plus tard. -->
- Recherche de projets sur l'accueil (prévue dans la maquette de `docs/01-PRODUIT.md`, mais absente de la liste de tâches de M1).
- Grille et aimantation sur grille pour les Visuels (réglage en px dans le document).
- Calcul automatique de la surface intérieure d'une pièce (déduction de l'épaisseur des murs).
