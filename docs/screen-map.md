# Carte des écrans (D80, M17)

Pour chaque écran et geste de Fabrics : l'écran de Pascal qui le remplace, ou le panneau à
reconstruire dedans (M19 lot A). **Aucune fonction de Fabrics sans destination.** Relevé du
2026-11-17 sur Pascal `7f30521` ; chemins Pascal relatifs à `packages/pascal/`, abrégés :
`app/` = `apps/editor/app/`, `ed/` = `packages/editor/src/components/`.

Destination :
- **Pascal** : l'écran ou le geste de Pascal le fait déjà ; on le reprend tel quel (D81).
- **Pascal + panneau** : écran de Pascal, avec un panneau ou une option de Fabrics reconstruite dedans.
- **Fabrics à part** : reste un écran propre à Fabrics, habillé dans le style de Pascal.

La colonne « Vérif. » renvoie à `docs/regression-checklist.md` ; elle est cochée en M19 quand la
fonction marche dans le nouvel écran.

## 1. Pages (routes)

| Fabrics (route, fichier) | Fonction | Destination | Écran Pascal | Vérif. |
|---|---|---|---|---|
| `/` `HomePage.tsx` | Liste des projets, recherche, créer Plan / Visuel / exemple, renommer, dupliquer, supprimer, miniatures, « Partagés avec moi » | Pascal + panneau | `app/page.tsx` (« Projects ») + cartes « Partagés avec moi », création Visuel, exemples, recherche | M1, M11 bis D, M11 quater B, M14 B |
| `/p/:id` `EditorPage.tsx` / `ProjectPage.tsx` (Plan) | Éditeur de plan | Pascal + panneau | `app/project/[id]/page.tsx` → `ed/editor/editor-layout-v2.tsx` | M3 → M16 |
| `/p/:id` (Visuel) | Éditeur d'affiches (Konva) | Fabrics à part | — (habillé style Pascal) | M1, M2, M4 |
| `/bienvenue` `IntroPage.tsx` | Page d'introduction animée (GSAP, Lenis) | Fabrics à part | — (gardée, D80 : route conservée) | M13 (ajout hors jalon) |
| `/connexion` `LoginPage.tsx`, `ResetPasswordPage.tsx` | E-mail + mot de passe, Google, mot de passe oublié | Pascal + panneau | `app/login/page.tsx` (mise en page) branché sur Supabase Auth | M13 |
| `/s/:token` `SharePage.tsx` / `SharedProjectPage.tsx` | Lien de partage en lecture seule (plan, 3D, planche) | Pascal + panneau | `app/embed/[id]/page.tsx` (vue intégrée) + vérification du jeton Supabase | M13 |
| `/i/:token` `InvitePage.tsx` | Accepter une invitation | Fabrics à part | — | M14 B |
| `VersionPreviewPage.tsx` | Aperçu d'une version en lecture seule | Pascal + panneau | Mode `previewScene` / `isVersionPreviewMode` de l'éditeur Pascal + bandeau Fabrics | M15 C |
| — | Réglages de l'application | Pascal | `app/settings/page.tsx` (+ réglage « couper les sons », D81) | D81 |
| — | Import d'une scène | Pascal + panneau | `app/import/page.tsx` + imports Fabrics (DXF, IFC en M22) | M11 |
| — | Configuration d'un serveur auto-hébergé | — (non repris) | `app/setup/page.tsx` : propre à l'hébergement de Pascal, inutile avec Supabase | — |

## 2. Éditeur de plan — cadre

| Fabrics (composant) | Fonction | Destination | Écran Pascal | Vérif. |
|---|---|---|---|---|
| `EditorHeader.tsx`, `SaveIndicator.tsx` | Titre éditable, annuler / rétablir, 3D, Vues, Exporter, état d'enregistrement | Pascal + panneau | barre de l'éditeur Pascal (`editor-layout-v2.tsx`) + bouton Exporter et état d'enregistrement Fabrics | M1, M15 bis A |
| `Toolbar.tsx`, `ToolModeBar.tsx`, `ToolHint.tsx` | Rail d'outils, familles, modes (mur droit, rectangle…), consignes | Pascal | `ed/ui/sidebar/icon-rail.tsx`, `ed/ui/action-menu/structure-tools.tsx`, `ed/ui/controls/tool-options-panel.tsx`, `ed/ui/helpers/*` | M3, M9, M11 quater A/D, M15 bis B |
| `SidePanel.tsx` (onglets en rail) | Panneau de droite | Pascal + panneau | `ed/ui/sidebar/app-sidebar.tsx`, `tab-bar.tsx`, `panels/*` ; onglets Fabrics ajoutés (`use-plugin-panels.tsx`) | M15 bis D |
| `PropertiesPanel.tsx`, `*Fields.tsx`, `MultiSelectionFields.tsx`, `WallLockSection.tsx`, `MaterialField.tsx` | Propriétés, sélection multiple, verrou des murs, matériaux | Pascal + panneau | `ed/ui/panels/parametric-inspector.tsx`, `multi-parametric-inspector.tsx`, `multi-selection-panel.tsx`, `ed/ui/controls/material-picker.tsx` ; ajouter verrou de mur, style d'ouverture Fabrics, « Visible en » des cotes | M2, M5, M10 bis, hors jalon 2026-11-16 |
| `LayersPanel.tsx` | Calques : renommer, masquer, verrouiller, réordonner | Pascal | arbre de la scène de la barre latérale (`ed/ui/sidebar/*`, nœuds) | M2 |
| `LevelsPanel.tsx`, `LevelSelector.tsx` (retiré en A7), `PlanContextBar.tsx` (retiré en A7) | Niveaux, niveau actif, transparence dessous / dessus | Pascal + panneau | gestion des niveaux de Pascal (empilés / éclatés / seuls, D81) + interrupteurs de transparence | M6, M11 bis C, M15 bis A |
| `DimensioningSelector.tsx` | Cotation Aucune / Client / Exécution | Pascal + panneau | option ajoutée à la barre de vue (`ed/editor/views/view-bar.tsx`) | M10 ter B |
| `ZoomControls.tsx`, `MiniMap.tsx`, `CompassWidget.tsx`, barre d'état | Zoom, plein écran, échelle d'impression, nord, mini-carte | Pascal + panneau | navigation Pascal (caméra, `fit-scene-framing.ts`) + échelle d'impression et nord Fabrics | M11 ter, M15 bis C |
| `LiveMetresBar.tsx` (retiré en A7 ; onglet Métrés de Pascal) | Métrés en direct (pièces, surface, murs) | Pascal + panneau | carte flottante type `quick-measurement-card.tsx` alimentée par les métrés Fabrics | M15 bis D |
| `PlanSignals.tsx`, `PlanCheckBadge.tsx`, `MetresWarningList.tsx` | Points à vérifier, signaux en haut à droite | Pascal + panneau | aide contextuelle (`ed/ui/helpers/contextual-helper-panel.tsx`) + liste Fabrics | M10 ter G3, M11 bis H, M11 quater J |
| `ShortcutsDialog.tsx` (`?`) | Liste des raccourcis | Pascal | palette de commandes `ed/ui/command-palette/` + aide de Pascal | M11 quater E |
| `EmptyPlanCard.tsx` (retiré en A7 ; Pascal n'a pas de parcours guidé, voir PROGRESS) | Premier pas dans un plan vide | Pascal | parcours de découverte de Pascal (D81) | M11 quater C |
| `Notice.tsx` | Confirmations temporaires | Pascal | notifications de Pascal | — |

## 3. Éditeur de plan — dessin et gestes

| Fabrics | Fonction | Destination | Pascal | Vérif. |
|---|---|---|---|---|
| `EditorStage.tsx` (Konva), `PlanGrid.tsx`, `ScrollBars.tsx` | Plan 2D, grille, défilement, Espace + glisser, molette, pincement (tablette) | Pascal | `ed/editor/floorplan-panel.tsx`, `grid.tsx` | M1, M3, M11 quater I |
| `SelectionTransformer.tsx`, `VertexHandles.tsx`, `StretchDraftLayer.tsx` | Sélection, déplacer, sommets, Étirer, glisser un mur | Pascal | `selection-manager.tsx`, `room-handles-2d.tsx`, `wall-move-side-handles.tsx`, `wall-pull-grip.tsx` | M1, M3, M11 bis B |
| `AlignmentGuides.tsx`, aimantation | Guides, accroches (fond DXF, niveau de référence) | Pascal + panneau | guides d'alignement, modes d'accrochage visibles (E-004) + accroches Fabrics | M2, M11 bis A/C |
| `PolylineDraftLayer.tsx` | Tracé de mur / pièce, longueur au clavier | Pascal | outils `wall`, `zone`, `dimension-drive.ts` | M3, hors jalon 2026-11-16 |
| `OpeningPreviewLayer.tsx` | Pose des portes, fenêtres, baies | Pascal + panneau | outils `door`, `window` + styles Fabrics manquants | M5, M10 bis A |
| `CutPreviewLayer.tsx` | Couper un mur ici | Pascal + panneau | à ajouter (action de nœud `node-action-menu.tsx`) | M11 quinquies A |
| `join-walls`, Joindre | Joindre des murs | Pascal | `join-walls-pill.tsx` | M11 bis B, H |
| `FurnitureGhost.tsx`, `LibraryPanel.tsx`, `SymbolPreview.tsx` | Bibliothèque (392 objets, préfabriqués, bibliothèque personnelle) | Pascal + panneau | `ed/ui/sidebar/panels/items-panel`, `ed/ui/item-catalog` + catalogue et symboles 2D Fabrics | M7, M9 B, M11 bis F |
| `StairGhost.tsx`, `StairUpperGhosts.tsx`, `ChimneyUpperGhosts.tsx` | Escaliers, trémies, cheminées, fantômes sur l'étage | Pascal | outils `stair`, `chimney`, `slab-hole-highlights.tsx` | M9 D/E |
| `RoomLabelsLayer.tsx` | Étiquettes de pièces (nom + surface en m²) | Pascal + panneau | `room-labels.tsx` (unités Fabrics) | M3 |
| `AutoDimensionsLayer.tsx`, `PlanMarksLayer.tsx` | Cotes automatiques Client / Exécution, flèche du nord, repère de niveau | Pascal + panneau | couche ajoutée au plan Pascal (`floorplan-dimension-renderer.tsx` en lecture seule) | M10 ter B, M11 bis F |
| `CalibrateDialog.tsx`, `CalibrationDraftLayer.tsx` | Calibrer une image | Pascal + panneau | fond de plan (`use-floorplan-background-placement.ts`) + calibrage Fabrics | M3 |
| `ImportDxfDialog.tsx` | Import DXF en fond | Pascal + panneau | fonds `guide` / `scan` + import Fabrics | M11 |
| `TextEditorOverlay.tsx` | Texte (Visuel) | Fabrics à part | — | M2 |
| `SurfaceHighlightLayer.tsx` | Zone manquante surlignée | Pascal + panneau | `room-highlight.tsx` | M10 ter G3 |

## 4. Vues, 3D, exports

| Fabrics | Fonction | Destination | Pascal | Vérif. |
|---|---|---|---|---|
| `Viewer3DPanel.tsx`, `OrientationCube.tsx` (retirés en A7) | Vue 3D à côté du plan, cube, capture PNG | Pascal | `@pascal-app/viewer` (WebGPU, effets, navigation, D81), `views/view-bar.tsx`, capture `snapshot-capture.ts` | M8 |
| `ViewsScreen.tsx`, `ViewDrawing.tsx`, `ViewsPdfDialog.tsx` | Façades, coupes, planche, PDF | Pascal + panneau | vue « Vues » ajoutée (`ed/editor/views/plugins-view.tsx`) ; dessins Fabrics | M10, M10 bis |
| `ExportDialog.tsx` | PNG, JPG, PDF, CSV, XLSX, DXF, glTF, IFC ; version Client / Exécution ; contrôle avant export | Pascal + panneau | `ed/editor/export-manager.tsx` (GLB, USDZ, STL, OBJ, IFC, PDF) + formats et contrôles Fabrics | M4, M10 ter, M11 |
| `MeasurementsPanel.tsx` | Métrés Client / Exécution, plafonds, toitures, avertissements | Pascal + panneau | onglet ajouté à la barre latérale ; `zone/quantities-panel.tsx` pour la pièce sélectionnée | M3 → M11 quinquies |

## 5. Collaboration et compte

| Fabrics | Fonction | Destination | Pascal | Vérif. |
|---|---|---|---|---|
| `ShareDialog.tsx`, `ShareItem.tsx`, `InviteSection.tsx` | Lien de partage, invitations, membres | Pascal + panneau | boîte de dialogue reconstruite dans le style Pascal | M13, M14 B |
| `PresenceAvatars.tsx`, `PresenceLayer.tsx`, `CollabIndicator.tsx` | Curseurs, sélections, avatars | Pascal + panneau | couche ajoutée au plan et à la 3D Pascal | M14 E |
| `HistoryPanel.tsx`, `HistorySessionItem.tsx`, `VersionBanner.tsx`, `VersionNameInput.tsx`, `ChangesLayer.tsx` | Historique, versions nommées, aperçu, différences, restaurer | Pascal + panneau | onglet ajouté + `previewScene` de Pascal | M15 |
| `CommentsPanel.tsx`, `CommentPinsLayer.tsx`, `CommentThreadView.tsx`, `CommentComposerOverlay.tsx`, `CommentReplyBox.tsx` | Commentaires ancrés | Pascal + panneau | onglet ajouté + épingles sur le plan et en 3D (`point-ask` comme modèle d'épingles) | M16 |
| `ReadOnlyViewer.tsx`, `ReadOnlySidePanel.tsx` | Page d'un membre lecteur | Pascal + panneau | éditeur Pascal en lecture seule + onglets Fabrics | M15 C, M16 D |
| `home/AccountButton.tsx`, `UserAvatar.tsx` | Compte, déconnexion | Pascal + panneau | menu de compte de l'accueil Pascal | M13 |
| `home/ImportLocalDialog.tsx`, `LeaveDialog.tsx`, `DeleteDialog.tsx`, `RenameDialog.tsx`, `NewDesignDialog.tsx` | Importer les projets locaux, quitter, supprimer, renommer, nouveau Visuel | Pascal + panneau | boîtes de dialogue Pascal (`delete-confirmation-dialog.tsx`, primitives) | M1, M13, M14 |

## 6. Composants de base

| Fabrics `src/components/ui/` | Destination | Pascal |
|---|---|---|
| `Button`, `Modal`, `Menu`, `TextField`, `NumberField`, `ColorField`, `CheckboxField`, `Choice`, `ChoiceGroup` | Pascal (doublon D80, retrait en M19) | `ed/ui/primitives/*` (dialog, sheet, slider…), `ed/ui/controls/*` (`metric-control`, `segmented-control`, `select-control`, `toggle-control`) ; les champs de longueur restent en mm |

## Lacunes relevées

- Pascal n'a pas d'équivalent pour : cotation Client / Exécution, façades et coupes dessinées,
  métrés Client / Exécution, partage Supabase, invitations, versions, commentaires, présence, DXF,
  CSV / XLSX, projets Visuel. Ils deviennent des panneaux ou des écrans « Fabrics à part ».
- L'écran `app/setup/page.tsx` de Pascal n'est pas repris (hébergement propre à Pascal).
- Tous les textes de Pascal passent en français (catalogue Lingui `fr` vide aujourd'hui : 3 963
  messages à traduire en M19).
