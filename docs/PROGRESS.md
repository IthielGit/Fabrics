# Journal de progression

Tenu à jour par Claude à la fin de chaque tâche (voir `CLAUDE.md`).

## État actuel

- **Jalon en cours :** M5 — Ouvertures (feu vert donné le 2026-11-10 ; choix par défaut acceptés)
- **Dernière tâche terminée :** M5 · tâche 5 — glisser une ouverture le long de son mur
- **Prochaine tâche :** M5 · tâche 6 — propriétés des ouvertures (largeur, hauteur, allège, type, sens)
- **Problèmes connus :** aucun test automatisé du rendu Konva (clics, poignées, glisser) : à contrôler à la main ; avertissement de taille de bundle au build (Konva, ~600 Ko, sans conséquence pour M1) ; voir D16 et D17 (lint = oxlint, TypeScript 7)

## Jalons

| Jalon | Statut | Validé par l'utilisateur le |
|---|---|---|
| M0 Mise en place | terminé | 2026-11-10 |
| M1 Socle de l'éditeur | terminé | 2026-11-10 |
| M2 Contenu et mise en forme | terminé | 2026-11-10 |
| M3 Mode plan et métrés | terminé | 2026-11-10 |
| M4 Export | terminé | 2026-11-10 |
| M5 Ouvertures | à faire | |
| M6 Niveaux | à faire | |
| M7 Axes et mobilier | à faire | |
| M8 Vue 3D | à faire | |
| M9 Façades, coupes et planche | à faire | |
| M10 Import et export | à faire | |
| M11 Mise en ligne | à faire | |
| M12 Comptes, sauvegarde cloud et partage | à faire | |
| M13 Collaboration temps réel | après le MVP | |

## Journal

<!-- Format d'une entrée (la plus récente en haut) :
### AAAA-MM-JJ — M1 · Outil rectangle
- Fait : …
- Fichiers : src/…, src/…
- Vérification : build ✓ lint ✓ tests ✓ — testé dans le navigateur : …
- Commit : feat: outil rectangle
-->

### 2026-11-10 — Unités « Métrique architectural » (consigne transversale)
- Fait : tout le plan s'affiche et se saisit comme dans Revit (métrique) : **longueurs en mm entiers** (`3500 mm`, `200 mm`), surfaces en m² (`12,40 m²`). Appliqué à : cotes, aperçu des murs et des ouvertures, panneau Métrés (épaisseur comprise), propriétés d'un mur / cote, réglages du plan (épaisseur, hauteur, grille en mm : 50 / 100 / 200 / 500 / 1000), barre d'échelle du PDF (`1000 mm`), export CSV (longueurs en mm, surfaces en m²), fenêtre de calibrage. Un nombre saisi sans unité vaut des mm ; `m` et `cm` restent acceptés si écrits. Les helpers `mmToM`, `mmToCm` et `formatCentimeters` sont supprimés. Règle ajoutée dans `CLAUDE.md` et `docs/02-ARCHITECTURE.md` pour toutes les prochaines tâches. Les projets déjà enregistrés ne changent pas (le stockage était déjà en mm).
- Reste à noter : les commentaires de code et la roadmap citent encore des valeurs en m / cm (ex. « 0,90 × 2,10 m ») ; les futures tâches M5 (Porte/Fenêtre) afficheront des mm.
- Fichiers : `src/features/units/format(.test).ts`, `src/features/measurements/{csv,measurements.test}.ts`, `src/components/editor/{MeasurementsPanel,PlanElementFields,PlanSettingsSection,CalibrateDialog}.tsx`, `src/i18n/fr.ts`, `src/features/export/pdf.test.ts`, `CLAUDE.md`, `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (422) — à contrôler dans le navigateur
- Commit : feat: unités Métrique architectural (mm, m²)

### 2026-11-10 — M5 · Glisser une ouverture
- Fait : avec l'outil Sélection, on saisit une ouverture et on la fait coulisser le long de son mur ; elle suit le curseur en gardant l'écart de la saisie, arrondie à 1 cm, s'arrête aux extrémités du segment et contre les ouvertures voisines. Un glissement = un seul état d'historique (annuler la remet où elle était). Une ouverture ne quitte pas son segment (ni son mur). Une ouverture ne se déplace jamais d'elle-même : le déplacement générique (glisser, flèches) l'ignore ; sa place vient de son mur. Au glissement d'un mur entier, l'ouverture suit à l'enregistrement (suivi en direct et copie : tâche 7).
- Fichiers : `src/features/geometry/openingPlacement(.test).ts` (`pointerOffset`, `slideOpening`), `src/features/geometry/transform(.test).ts`, `src/components/editor/shapes/OpeningShape.tsx`, `src/components/editor/useElementInteractions.ts`
- Vérification : build ✓ lint ✓ tests ✓ (434 au total, dont 11 sur le glissement) — à contrôler dans le navigateur
- Commit : feat: glisser une ouverture le long de son mur

### 2026-11-10 — M5 · Outils Porte et Fenêtre
- Fait : deux outils dans la barre (projets Plan uniquement) : Porte (`B`, 0,90 × 2,10 m) et Fenêtre (`F`, 1,20 × 1,00 m, allège 0,90 m). Au survol d'un mur : aperçu de l'ouverture et distances libres jusqu'aux deux bouts du segment ; clic = pose (l'ouverture posée devient la sélection, l'outil reste actif pour en poser d'autres ; `Échap` pour quitter). La porte s'ouvre du côté du mur où se trouve le curseur. Position arrondie à 1 cm, bornée sur le segment, décalée si elle chevauche une voisine. Aperçu en rouge et message si la pose est impossible (pas assez de place, ouverture plus haute que le mur) ou si on clique hors d'un mur. Murs masqués ou verrouillés ignorés. La baie n'a pas d'outil : ce sera un réglage de la fenêtre (tâche 6). Rappel des commandes en bas de l'écran.
- Fichiers : `src/features/geometry/openingPlacement(.test).ts`, `src/features/documents/elements.ts` (`createOpeningElement`, `OPENING_DEFAULTS`), `src/components/editor/{useOpeningTool,OpeningPreviewLayer,EditorStage,Toolbar,ToolHint,shortcuts,useEditorShortcuts}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (422 au total, dont 12 sur la pose) — à contrôler dans le navigateur
- Commit : feat: outils porte et fenêtre

### 2026-11-10 — M5 · Dessin des ouvertures
- Fait : composant `OpeningShape` : le mur est « découpé » par un rectangle de la couleur du fond de page, puis le symbole est tracé dessus, orienté selon le segment du mur. **Porte** : deux montants, battant ouvert à 90° et arc d'ouverture (charnière à gauche ou à droite, ouverture de l'un ou l'autre côté du mur). **Fenêtre** : cadre et deux traits de vitrage. **Baie** : deux montants seulement. Surbrillance quand l'ouverture est sélectionnée ; clic pour la sélectionner. Pas de poignées de redimensionnement pour une ouverture (sa position dépend de son mur). Les ouvertures ne sont pas encore créables (tâche 4) ni déplaçables (tâche 5).
- Décision : la découpe utilise la couleur du fond de page plutôt qu'un vrai trou, pour ne pas découper le mur en morceaux (ce qui casserait les angles en onglet). Conséquence : sur une image de fond (calque), la découpe la masque localement.
- Fichiers : `src/features/geometry/openingSymbol(.test).ts`, `src/components/editor/shapes/OpeningShape.tsx`, `ElementNode.tsx`, `SelectionTransformer.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (409 au total, dont 12 sur le dessin des symboles) — rendu à l'écran à contrôler après la tâche 4 (on ne peut pas encore poser d'ouverture)
- Commit : feat: dessin des portes, fenêtres et baies

### 2026-11-10 — M5 · Calculs des ouvertures
- Fait : fonctions pures pour placer une ouverture sur son mur : segment d'un mur (longueur, direction, normale), position réelle d'une ouverture (centre, extrémités, angle), **bornage** de la position (reste sur le segment, ne chevauche pas une voisine, se toucher est permis ; `null` s'il n'y a pas de place), distances libres jusqu'aux bouts du segment, contrôle de hauteur (allège + hauteur ≤ hauteur du mur), surface, recherche du mur sous le curseur (dans l'épaisseur + tolérance, le plus proche gagne), **replacement** d'une ouverture quand son mur change (sommet déplacé, ajouté ou retiré ; `null` si elle ne tient plus). Rien de visible à l'écran pour l'instant.
- Fichiers : `src/features/geometry/openings(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (397 au total, dont 29 nouveaux)
- Commit : feat: calculs de position des ouvertures

### 2026-11-10 — M5 · Modèle des ouvertures et migration
- Fait : type `OpeningElement` (porte, fenêtre, baie ; accroché à un mur par `wallId`, `segmentIndex`, `offset`) ajouté au modèle ; document en **version 2** ; `migrateDocument` / `migrateProject` (v1 → v2 sans changement des éléments, version inconnue ou plus récente refusée) appliqués à la lecture d'un projet dans `LocalRepository`. Pas encore visible à l'écran : les ouvertures ne sont ni dessinées ni créées (tâches 3 et 4).
- Fichiers : `src/types/document.ts`, `src/features/documents/migrations(.test).ts`, `createProject.ts`, `src/features/persistence/{LocalRepository(.test),collectAssetIds}.ts`, `src/components/editor/{ElementNode,LayersPanel}.tsx`, `src/features/export/bounds.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (368 au total, dont « un projet v1 s'ouvre sans perte »)
- Commit : feat: modèle des ouvertures et migration du document

### 2026-11-10 — M4 · Export (PNG, JPG, PDF, CSV)
- Fait : bouton « Exporter » dans l'en-tête de l'éditeur → fenêtre avec format (PNG, JPG, PDF ; CSV pour un plan), nom du fichier, résolution (×0,5 / ×1 / ×2 / ×3, avec la taille en pixels ; les tailles au-dessus de 8 192 px par côté ou 16,7 millions de pixels sont grisées), feuille A4 / A3, orientation, échelle 1:20 / 1:50 / 1:100 / 1:200 ou « Ajuster à la page ». Image sans sélection, poignées, guides ni grille, taille exacte en pixels (échelle de la scène réglée au pixel près). Zone exportée : page entière d'un Visuel ; emprise du contenu visible + 500 mm pour un plan (plan vide : export refusé avec un message). PDF d'un Visuel centré avec marges de 10 mm, ou pleine page pour un A4 / A3 sur la même feuille. PDF de plan : taille papier = taille réelle ÷ échelle, bande de 20 mm en bas avec barre d'échelle de 1 m et cartouche (nom, échelle, date, surface des pièces) ; si le plan ne tient pas : avertissement + échelle qui tient + export bloqué tant qu'on ne change pas. `jspdf` chargé à la demande (n'alourdit pas l'ouverture de l'éditeur). Pour un plan, la vue est ramenée à 100 % pendant la capture (traits fins de même épaisseur quel que soit le zoom), puis remise.
- Fichiers : src/features/export/{limits,bounds,pdfLayout,pdf,fileName}.ts (+ tests), src/components/editor/{exportStage,exportProject}.ts, ExportDialog.tsx, EditorHeader.tsx, src/lib/dataUrl.ts, src/i18n/fr.ts
- Vérification : build ✓ lint ✓ tests ✓ (357 au total) — rendu réel et mesure à la règle à contrôler dans le navigateur
- Commit : feat: fenêtre Exporter (PNG, JPG, PDF, CSV)

### 2026-11-10 — M3 · Ajout et retrait de sommets (correctif demandé)
- Fait : sur un mur ou une pièce sélectionné, un petit point « + » apparaît au milieu de chaque côté (pour une pièce, y compris le côté de fermeture) ; un clic ajoute un sommet à cet endroit (la forme ne change pas, on le glisse ensuite) ; un double-clic sur un sommet le retire (minimum 2 sommets pour un mur, 3 pour une pièce ; une cote reste à 2). Un geste = un pas d'annulation. Rappel affiché dans Propriétés.
- Fichiers : src/features/geometry/transform.ts (+ tests), src/components/editor/VertexHandles.tsx, PlanElementFields.tsx, src/i18n/fr.ts
- Vérification : build ✓ lint ✓ tests ✓ (319 au total) — clics et double-clics à contrôler dans le navigateur
- Commit : feat: ajout et retrait de sommets

### 2026-11-10 — M3 · Panneau Métrés et export CSV
- Fait : panneau « Métrés » (projets de type Plan uniquement), mis à jour en temps réel : tableau des pièces (nom, surface, périmètre), tableau des murs (nom, longueur, épaisseur, surface murale), totaux, mention « Surfaces mesurées sur le contour tracé » ; cliquer une ligne sélectionne l'élément sur le plan ; bouton « Exporter en CSV » (désactivé s'il n'y a rien à exporter) : fichier `<nom du projet>-metres.csv` (séparateur `;`, décimales à virgule, UTF-8 avec BOM, accents conservés ; caractères interdits dans un nom de fichier retirés). Aucun calcul dans les composants : tout vient de `features/measurements` et `features/units`.
- Fichiers : `src/components/editor/MeasurementsPanel.tsx`, `src/features/measurements/csv.ts` (`csvFileName`), `src/lib/download.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (308 au total) — ouverture du CSV dans Excel / LibreOffice à contrôler
- Commit : feat: panneau métrés et export CSV

### 2026-11-10 — M3 · Outil Calibrer
- Fait : outil Calibrer (pas de raccourci) : un clic pose le point A sur une image importée (sinon un message demande de cliquer sur une image), un second clic pose le point B, puis une fenêtre demande la distance réelle (`3,50 m`, `350 cm`, `3500 mm` ; sans unité = mètres ; message d'erreur si la saisie est invalide). L'image est mise à l'échelle autour du point A (facteur = distance réelle ÷ distance mesurée) ; un seul état d'historique, annulable. `Échap` annule. Aucune aimantation sur ce tracé (pour ne pas fausser la mesure). Ajout d'un rappel des commandes en bas de l'écran pour les outils Mur, Pièce, Cote et Calibrer. Correction : un tracé de mur, de pièce ou de cote abandonné en changeant d'outil ne réapparaît plus au retour sur l'outil.
- Fichiers : `src/features/geometry/calibration(.test).ts`, `src/components/editor/{useCalibrationTool,CalibrateDialog,CalibrationDraftLayer,ToolHint,EditorStage,usePolylineDrawing}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (303 au total, dont « une image calibrée sur 3,50 m donne 3,50 m ± 1 cm entre les deux mêmes points ») — à contrôler dans le navigateur avec une vraie image
- Commit : feat: outil calibrer pour les images de plan

### 2026-11-10 — M3 · Édition des sommets et propriétés du plan
- Fait : quand un mur, une pièce ou une cote est seul sélectionné, des poignées apparaissent sur chaque sommet : on les glisse pour modifier la forme (aimantation aux sommets, angles de faces et grille ; `Maj` contraint la direction depuis le sommet voisin) ; le métré se met à jour en direct et un geste complet ne forme qu'un seul état d'historique (nouvelles actions `beginLiveEdit` / `liveReplaceElements` / `endLiveEdit`). Panneau Propriétés pour les éléments de plan : nom, épaisseur et hauteur du mur (en cm), « afficher le nom et la surface » pour une pièce, décalage d'une cote, couleur (une pièce garde un remplissage translucide), opacité, et un cadre « Mesures » (surface et périmètre d'une pièce avec la mention « Surface mesurée sur le contour tracé », longueur et surface murale d'un mur, longueur d'une cote). Rotation et position ne sont plus proposées pour ces éléments (points absolus, décision D6).
- Fichiers : `src/components/editor/{VertexHandles,PlanElementFields,PropertiesPanel,EditorStage}`, `src/components/ui/TextField.tsx`, `src/features/geometry/transform(.test).ts` (`getVertices`, `moveVertex`), `src/features/documents/properties(.test).ts`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (292 au total) — glisser des sommets à contrôler dans le navigateur
- Commit : feat: édition des sommets et propriétés des éléments de plan

### 2026-11-10 — M3 · Outil Cote
- Fait : outil Cote (`D`) : deux clics (le second valide la cote), aimantation comme pour les murs (sommets, angles de faces, grille, `Maj`), longueur affichée en direct pendant le tracé. Rendu d'une cote : ligne décalée (50 cm par défaut), lignes d'attache, traits obliques aux extrémités, longueur en mètres (`3,50 m`) centrée au-dessus de la ligne, toujours lisible (jamais à l'envers). Murs, pièces et cotes sont maintenant des groupes Konva : leur surbrillance et leur étiquette suivent l'élément quand on le déplace ; les gestionnaires de clic lisent l'élément du document (`currentTarget`) et non la forme cliquée à l'intérieur. Le décalage de la cote se règle dans Propriétés (tâche 9).
- Fichiers : `src/features/geometry/dimension(.test).ts`, `src/components/editor/shapes/{DimensionShape,WallShape,RoomShape}.tsx`, `ElementNode.tsx`, `useElementInteractions.ts`, `EditorStage.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (277 au total) — à contrôler dans le navigateur
- Commit : feat: outil cote

### 2026-11-10 — M3 · Outil Pièce
- Fait : outil Pièce (`P`) : polygone fermé, mêmes commandes que le mur (clic, `Maj`, double-clic ou `Entrée`, `Échap`, `Retour arrière`) ; un clic sur le premier point ferme le polygone ; aimantation aux sommets des murs et aux angles de leurs faces (donc on peut tracer une pièce le long des faces intérieures) ; la pièce est remplie (couleur semi-transparente) avec une étiquette au centre : **nom + surface au tracé** (`12,00 m²`), à la taille de 25 cm sur le plan (10 px minimum à l'écran). Le nom se change par double-clic dans « Calques » (champ « Nom » dans Propriétés : tâche 9).
- Fichiers : `src/components/editor/shapes/RoomShape.tsx`, `ElementNode.tsx`, `EditorStage.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (267 au total) — à contrôler dans le navigateur ; pendant le déplacement d'une pièce, l'étiquette rejoint la pièce à la fin du geste
- Commit : feat: outil pièce avec étiquette de surface

### 2026-11-10 — M3 · Outil Mur
- Fait : outil Mur (`W`) : un clic par point, `Maj` = direction à 0/45/90°…, double-clic ou `Entrée` pour terminer, `Échap` pour annuler le tracé (un second `Échap` quitte l'outil), `Retour arrière` pour retirer le dernier point ; le mur créé prend l'épaisseur et la hauteur par défaut du plan ; l'outil reste actif pour enchaîner plusieurs murs. Aperçu en direct : épaisseur du mur, points, repère d'aimantation coloré (vert = sommet, gris = grille, bleu = angle contraint) et **longueur du segment en cours** (`3,50 m`). Les points s'aimantent aux sommets, aux angles des faces de murs et à la grille. Rendu des murs (axe fermé si le tracé revient à son départ). Les éléments de plan (points absolus) se déplacent, se dupliquent, se collent et se déplacent aux flèches en décalant leurs points (`translateElement`), position `x, y` toujours à 0 ; pas de poignées de redimensionnement pour eux (leurs sommets s'éditeront à la tâche 9).
- Fichiers : `src/components/editor/{usePolylineDrawing,PolylineDraftLayer,EditorStage,SelectionTransformer,useElementInteractions,ElementNode}`, `src/components/editor/shapes/WallShape.tsx`, `src/features/geometry/{transform,walls}`, `src/features/documents/elements.ts`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (267 au total) — le tracé à la souris est à contrôler dans le navigateur
- Commit : feat: outil mur avec aimantation et longueur en direct

### 2026-11-10 — M3 · Grille, barre d'état et réglages du plan
- Fait : grille d'un plan (traits tous les 10 cm par défaut, un peu plus marqués à chaque mètre ; quand le zoom est faible, un trait sur 2, 5, 10… pour ne pas noircir l'écran ; dessinée en un seul tracé pour rester fluide) ; barre d'état « Zoom 100 % · Impression 1:50 » (un visuel affiche seulement le zoom) ; réglages du plan dans « Propriétés » quand rien n'est sélectionné : échelle d'impression (1:20, 1:50, 1:100, 1:200), taille de grille (5, 10, 20, 50 cm, 1 m), aimantation sur la grille, épaisseur et hauteur de mur par défaut (en cm). Chaque réglage est annulable.
- Fichiers : `src/features/geometry/grid(.test).ts`, `src/components/editor/{PlanGrid,PlanSettingsSection,ZoomControls,PropertiesPanel,EditorStage}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (261 au total) — l'affichage de la grille est à contrôler dans le navigateur
- Commit : feat: grille, barre d'état et réglages du plan

### 2026-11-10 — M3 · Outils réservés aux plans
- Fait : outils Mur (`W`), Pièce (`P`), Cote (`D`) et Calibrer dans la barre d'outils, visibles uniquement dans un projet de type Plan (séparés des outils communs) ; le store refuse aussi ces outils dans un Visuel (raccourcis compris) ; création des éléments mur, pièce et cote (`createWallElement`, `createRoomElement`, `createDimensionElement`). Les outils ne dessinent pas encore : leur comportement arrive dans les tâches suivantes.
- Fichiers : `src/components/editor/{Toolbar,shortcuts,useEditorShortcuts}`, `src/stores/editorStore.ts`, `src/features/documents/elements.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (249 au total)
- Commit : feat: outils de plan dans la barre d'outils

### 2026-11-10 — M3 · Métrés et CSV
- Fait : `computeMeasurements` (surface et périmètre de chaque pièce ; longueur, épaisseur, hauteur et surface murale de chaque mur — une face, sans déduction d'ouvertures ; totaux) ; `measurementsToCsv` (séparateur `;`, décimales à virgule, UTF-8 avec BOM, fins de ligne CRLF, deux tableaux avec leurs totaux, intitulés fournis par `fr.ts`) ; protection contre l'injection de formule dans un tableur (un nom de calque commençant par `=`, `+`, `-` ou `@` reçoit une apostrophe).
- Fichiers : `src/features/measurements/{measurements,csv}.ts`, `measurements.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (245 au total)
- Commit : feat: calcul des métrés et export CSV

### 2026-11-10 — M3 · Géométrie pure
- Fait : `polygon.ts` (liste de points ↔ coordonnées à plat, longueur d'une polyligne, aire par la formule du lacet — identique dans les deux sens —, périmètre, centroïde pondéré par l'aire) ; `walls.ts` (les deux faces d'un mur avec angles en onglet, axe fermé reconnu, angles très aigus coupés ; intersection de segments ; angles des faces et croisements de faces entre murs différents, ce qui donne les angles intérieurs d'une pièce) ; `snapping.ts` (contrainte à 0/45/90°… par projection du curseur, aimantation dans l'ordre sommet → grille → contrainte, collecte des sommets du plan). Tests de la doc réalisés : rectangle 4 × 3 m = 12,00 m² et 14,00 m, polygone en L, sens inverse, mur en 3 segments ; et 4 murs de 20 cm autour d'axes 4 × 3 m donnent un intérieur de 10,64 m².
- Fichiers : `src/features/geometry/{polygon,walls,snapping}(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (226 au total)
- Commit : feat: géométrie des polygones, des murs et aimantation des points

### 2026-11-10 — M3 · Unités
- Fait : conversions mm ↔ m ↔ cm, surfaces mm² → m², formatage à la française (`3,50 m`, `12,40 m²`, jamais `-0,00`), épaisseur en cm, et lecture d'une longueur saisie (`3,50 m`, `350 cm`, `3500mm`, sans unité = mètres) pour le calibrage.
- Fichiers : `src/features/units/format(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (172 au total)
- Commit : feat: unités et formatage des longueurs et surfaces

### 2026-11-10 — M2 · Miniatures des projets
- Fait : à chaque sauvegarde automatique, une miniature PNG (320 px maximum) de la page est générée à partir de la scène du canevas, sans les poignées de sélection ni les guides, puis enregistrée avec le projet et affichée sur la carte du projet à l'accueil (l'icône reste affichée pour un projet jamais modifié). Si la capture échoue, l'ancienne miniature est conservée et l'enregistrement n'est pas bloqué.
- Fichiers : `src/features/export/thumbnail(.test).ts`, `src/components/editor/{thumbnail,useAutosave,EditorStage}`, `src/components/home/ProjectCard.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (160 au total) — la capture réelle n'est pas testable automatiquement : à contrôler à l'accueil
- Commit : feat: miniatures des projets

### 2026-11-10 — M2 · Guides d'alignement et aimantation
- Fait : pendant le déplacement d'un ou plusieurs éléments, la sélection s'aimante sur les bords et les centres des autres éléments visibles et de la page (tolérance 8 px à l'écran, quel que soit le zoom) ; des traits roses pointillés montrent les alignements trouvés ; `Alt` enfoncée désactive l'aimantation. Valable dans les deux modes (visuel et plan). Calcul pur et testé dans `features/geometry/guides.ts`.
- Fichiers : `src/features/geometry/{guides,box}(.test).ts`, `src/components/editor/{AlignmentGuides,useElementInteractions,EditorStage}`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (156 au total) — comportement du glisser à contrôler dans le navigateur
- Commit : feat: guides d'alignement et aimantation

### 2026-11-10 — M2 · Copier / coller, tout sélectionner, flèches
- Fait : `Ctrl+C` / `Ctrl+V` (le presse-papiers interne survit au changement de projet : on peut copier dans un projet, retourner à l'accueil, en ouvrir un autre et coller ; chaque collage décale un peu plus les copies) ; `Ctrl+A` (tout sélectionner, sans les éléments verrouillés ni masqués) ; flèches pour déplacer la sélection de 1 unité (Maj : 10), sans bouger les éléments verrouillés ; les appuis rapprochés (moins de 0,6 s) ne forment qu'un état d'historique. Coller un élément de visuel (px) dans un plan (mm) est refusé avec un message (unités incompatibles).
- Fichiers : `src/features/documents/clipboard(.test).ts`, `src/stores/editorStore.ts`, `src/components/editor/{shortcuts,useEditorShortcuts}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (144 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: copier-coller, tout sélectionner et déplacement aux flèches

### 2026-11-10 — M2 · Panneau Calques
- Fait : panneau « Calques » sous les propriétés : liste dans l'ordre d'affichage (le dessus en haut), clic = sélection (Maj = ajouter / retirer), synchronisée avec le canevas ; renommer par double-clic ; masquer / afficher ; verrouiller / déverrouiller ; réordonner par glisser-déposer natif (trait indicateur) et par boutons Monter / Descendre. Un élément verrouillé ne réagit plus à la souris sur le canevas (ni sélection, ni déplacement, ni poignées) mais reste sélectionnable depuis la liste ; un élément masqué disparaît du canevas. Chaque action = un état d'historique ; un ordre inchangé n'en crée pas.
- Fichiers : `src/components/editor/LayersPanel.tsx`, `src/features/documents/layers(.test).ts`, `src/stores/editorStore.ts` (`reorderElement`, `stepElementOrder`), `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (129 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: panneau calques

### 2026-11-10 — M2 · Panneau Propriétés
- Fait : colonne de droite « Propriétés ». Un élément sélectionné : X, Y, largeur, hauteur, rotation, opacité (en %), épaisseur de contour, arrondi (rectangle), remplissage et contour (avec « Aucun »), police (6 polices système), taille, gras, italique, alignement (texte), flèche (ligne) — selon le type. Plusieurs éléments : opacité commune. Les champs sont en unités du document (px, ou mm sur un plan) ; virgule ou point acceptés, ↑ ↓ pour ajuster (Maj = ×10). Chaque modification valide un seul état d'historique (à la sortie du champ, ou à la fermeture du sélecteur de couleur). Une ellipse s'affiche par son coin haut-gauche et sa taille.
- Fichiers : `src/components/editor/PropertiesPanel.tsx`, `src/components/ui/{NumberField,ColorField}.tsx`, `src/features/documents/properties(.test).ts`, `src/lib/numberFormat(.test).ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (116 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: panneau propriétés

### 2026-11-10 — M2 · Import d'image
- Fait : import par le bouton de la barre d'outils (plusieurs fichiers possibles) et par glisser-déposer d'un fichier sur le canevas (l'image se place là où on la dépose). Formats PNG, JPEG, WebP, GIF ; 20 Mo maximum ; un fichier refusé affiche un message en français (bandeau qui se ferme seul) sans bloquer les autres. L'image est stockée via `putAsset`, ajoutée au projet (taille : au plus la moitié de la page, proportions conservées, jamais agrandie sur un visuel) et affichée ; un cadre gris la remplace pendant le chargement, rouge si le fichier est introuvable.
- Fichiers : `src/features/documents/images(.test).ts`, `src/components/editor/{importImages,useAssetImage,Notice,Toolbar,EditorStage}`, `src/components/editor/shapes/ImageShape.tsx`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (97 au total) — import réel d'un fichier à contrôler dans le navigateur
- Commit : feat: import d'images

### 2026-11-10 — M2 · Outil Texte
- Fait : outil Texte (`T`) : un clic pose un texte (« Votre texte ») et ouvre la saisie ; double-clic sur un texte pour le modifier. La zone de saisie est superposée au texte (même position, taille, police, rotation). La saisie est validée à la sortie du champ ou avec `Ctrl+Entrée` ; `Échap` abandonne. Un seul état d'historique par modification, donc annuler restaure exactement l'ancien contenu ; un texte vidé est supprimé (et l'annulation le ramène). Un texte ne se redimensionne qu'en largeur. Les 6 polices système (option A) sont définies dans `features/documents/fonts.ts` ; le choix de police arrive avec le panneau Propriétés.
- Fichiers : `src/components/editor/{TextEditorOverlay,EditorStage,SelectionTransformer,Toolbar,ElementNode,useElementInteractions}`, `src/components/editor/shapes/TextShape.tsx`, `src/features/documents/{fonts,elements}(.test).ts`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (89 au total, dont annuler un texte modifié)
- Commit : feat: outil texte avec édition au double-clic

### 2026-11-10 — M2 · Outil Ligne
- Fait : outil Ligne (`L`) au glisser, ou au clic (ligne horizontale de taille par défaut) ; rendu en ligne ou en flèche selon `arrowEnd` (le réglage arrive avec le panneau Propriétés) ; zone de clic élargie pour les lignes fines ; le redimensionnement étire les points de la ligne ; transformateur : retournement désactivé et taille minimale qui ne bloque plus les lignes horizontales.
- Fichiers : `src/components/editor/shapes/LineShape.tsx`, `ElementNode.tsx`, `EditorStage.tsx`, `SelectionTransformer.tsx`, `Toolbar.tsx`, `shortcuts(.test).ts`, `src/features/documents/elements.ts`, `src/features/geometry/transform(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (81 au total)
- Commit : feat: outil ligne

### 2026-11-10 — M1 · Sauvegarde automatique, indicateur et titre éditable
- Fait : sauvegarde automatique 1 seconde après la dernière modification (regroupe les modifications rapprochées), immédiate à la fermeture de l'onglet / changement de page / sortie de l'éditeur ; indicateur « Enregistrement… / Enregistré / Erreur d'enregistrement » ; en-tête avec retour à l'accueil, titre éditable (Entrée valide, Échap annule, un nom vide est refusé), boutons Annuler / Rétablir. Pas de faux « Enregistré » si le projet change pendant l'écriture.
- Fichiers : `src/features/persistence/autosave(.test).ts`, `src/components/editor/{useAutosave,SaveIndicator,EditorHeader}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (79 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: sauvegarde automatique, indicateur et titre éditable

### 2026-11-10 — M1 · Supprimer, dupliquer, annuler / rétablir
- Fait : raccourcis `Suppr` / `Retour arrière` (supprime toute la sélection), `Ctrl+D` (duplique, copie décalée et sélectionnée), `Ctrl+Z` (annuler), `Ctrl+Maj+Z` (rétablir) ; `Cmd` accepté comme `Ctrl` sur Mac ; comportements par défaut du navigateur bloqués (favori, retour arrière). Correspondance touche → action en fonction pure testée.
- Fichiers : `src/components/editor/{shortcuts(.test).ts,useEditorShortcuts.ts}`
- Vérification : build ✓ lint ✓ tests ✓ (71 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: raccourcis supprimer, dupliquer, annuler, rétablir

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
- Fait : `createProjectsStore(repo)` (dépôt injecté, donc testable) et `useProjectsStore` ; actions rafraîchir, créer Visuel / Plan (renvoient l'identifiant), renommer, dupliquer (suffixe « (copie) »), supprimer. `repository.ts` : point unique de choix du dépôt (local ; Supabase en M12).
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
| D14 | Branche git | `git init -b main`. | Le déploiement automatique de M11 suit `main`. |
| D15 | Méthode | Un jalon à la fois, feu vert avant chaque jalon, même si un plan d'ensemble a été présenté. | Règle 1 de `CLAUDE.md`. |
| D16 | Outil de lint | `npm run lint` = **oxlint** (fourni par le gabarit Vite actuel), pas ESLint. | Le gabarit officiel l'utilise ; la commande reste `npm run lint`, comme dans `CLAUDE.md`. |
| D17 | Versions | Dernières versions stables à l'installation : React 19, Vite 8, TypeScript 7, Tailwind v4. `react-konva` (M1) devra être en version 19. | Règle « dernière version stable » de `docs/02-ARCHITECTURE.md`. |
| D18 | Dossier `features/documents/` | Ajouté pour la création et la duplication de projets (logique pure testée). | Ces fonctions n'entrent dans aucun dossier prévu par `docs/02-ARCHITECTURE.md`. |
| D19 | Collage entre visuel et plan | Refusé avec un message (unités px et mm incompatibles). | La roadmap ne le précise pas ; une conversion automatique n'aurait pas de sens. |
| D20 | Polices (M2) | 6 polices système uniquement (Arial, Georgia, Times New Roman, Courier New, Verdana, Trebuchet MS), sans dépendance. | Choix de l'utilisateur (option A). |
| D21 | Éléments masqués et métrés | Les murs et pièces masqués sont comptés dans les métrés. | Masquer ne change que l'affichage ; le métré décrit la géométrie du document. |
| D22 | Contrainte d'angle (Maj) | Le point est la projection du curseur sur la direction autorisée (multiples de 45°), pas un point à la même distance. | Le point reste aligné avec le curseur : plus naturel, et exact sur les axes. |
| D23 | Aimantation sur les faces de murs | On s'aimante aussi aux croisements des faces de murs différents (angles intérieurs). | Quatre murs séparés n'ont pas de sommet à leur angle intérieur : sans cela le critère 10,64 m² serait inatteignable. |
| D24 | Phase « Bâtiment » | Ouvertures (M5), niveaux (M6), axes et mobilier (M7), 3D (M8), façades / coupes / planche (M9), import-export DXF / glTF et partage (M10) ajoutés **après le MVP** ; collaboration renumérotée M13 ; IA reportée. Dépendances 3D et DXF à confirmer au début de leur jalon. | Demande de l'utilisateur (capture d'un outil de bâtiment, 2026-11-10) ; le MVP reste inchangé pour être mis en ligne d'abord. |
| D25 | Ordre des jalons | La phase « Bâtiment » passe **avant** la mise en ligne et les comptes : M5 Ouvertures, M6 Niveaux, M7 Axes et mobilier, M8 3D, M9 Façades et coupes, M10 Import et export, M11 Mise en ligne, M12 Comptes, cloud et partage (fin du MVP), M13 Collaboration. Le partage par lien passe en M12 car il a besoin de Supabase. Remplace l'ordre de D24. | Demande de l'utilisateur (2026-11-10). |

## Idées (hors jalon en cours)

<!-- Demandes de l'utilisateur ou idées de Claude à prioriser plus tard. -->
- Recherche de projets sur l'accueil (prévue dans la maquette de `docs/01-PRODUIT.md`, mais absente de la liste de tâches de M1).
- Grille et aimantation sur grille pour les Visuels (réglage en px dans le document).
- Calcul automatique de la surface intérieure d'une pièce (déduction de l'épaisseur des murs).
- Assistant IA « Demander quelque chose » : reporté à la demande de l'utilisateur (après M13, à rediscuter).
