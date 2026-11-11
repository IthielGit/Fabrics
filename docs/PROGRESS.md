# Journal de progression

Tenu à jour par Claude à la fin de chaque tâche (voir `CLAUDE.md`).

## État actuel

- **Jalon en cours :** M10 — Façades, coupes et planche (M9 validé le 2026-11-11)
- **Dernière tâche terminée :** tâche 6 de M10 (export PDF des vues) ; toutes les tâches de M10 sont codées
- **Prochaine tâche :** essai de M10 par l'utilisateur dans le navigateur et retour de ses remarques, puis validation et M11
- **Hors jalon (demande de l'utilisateur) :** taille de la page modifiable dans Propriétés (largeur, hauteur, formats proposés) pour plans et visuels
- **Problèmes connus :** aucun test automatisé du rendu Konva (clics, poignées, glisser) : à contrôler à la main ; avertissement de taille de bundle au build (Konva, ~600 Ko, sans conséquence pour M1) ; voir D16 et D17 (lint = oxlint, TypeScript 7)

## Jalons

| Jalon | Statut | Validé par l'utilisateur le |
|---|---|---|
| M0 Mise en place | terminé | 2026-11-10 |
| M1 Socle de l'éditeur | terminé | 2026-11-10 |
| M2 Contenu et mise en forme | terminé | 2026-11-10 |
| M3 Mode plan et métrés | terminé | 2026-11-10 |
| M4 Export | terminé | 2026-11-10 |
| M5 Ouvertures | terminé | 2026-11-10 |
| M6 Niveaux | terminé | 2026-11-10 |
| M7 Axes et mobilier | terminé | 2026-11-10 |
| M8 Vue 3D | terminé | 2026-11-11 |
| M9 Outils de construction | terminé | 2026-11-11 |
| M10 Façades, coupes et planche | tous les lots faits, en attente de validation | |
| M11 Import et export | à faire | |
| M12 Mise en ligne | à faire | |
| M13 Comptes, sauvegarde cloud et partage | à faire | |
| M14 Collaboration temps réel | après le MVP | |

## Journal

<!-- Format d'une entrée (la plus récente en haut) :
### AAAA-MM-JJ — M1 · Outil rectangle
- Fait : …
- Fichiers : src/…, src/…
- Vérification : build ✓ lint ✓ tests ✓ — testé dans le navigateur : …
- Commit : feat: outil rectangle
-->

### 2026-11-11 — Hors jalon · J · Mise en page professionnelle des PDF
- Fait : demande de l'utilisateur (PDF « professionnels, design neutre », en s'aidant des skills `ui-ux-pro-max` et `impeccable`). Les recherches de `ui-ux-pro-max` proposaient une page web violette sans rapport : j'ai gardé seulement son principe « minimalisme / suisse » (neutre, fonctionnel, sans décor) et Helvetica, la police standard des PDF. **Cadre** fin autour de la feuille. **Cartouche** refait : à gauche la **flèche du nord** (plans et planche) et une **barre d'échelle graphique** à deux segments gradués en mm (1:50 : 2 × 1000 mm ; 1:100 : 2 × 2000 mm ; 1:20 : 2 × 500 mm), au milieu le **nom du projet** en gras et ce que montre la feuille (« Façade Nord », nom du niveau et surface des pièces pour un plan), à droite des cellules **Échelle / Date / Feuille** (intitulé en petites capitales grises, valeur dessous ; « Échelle indicative / env. 1:87 » quand le plan est ajusté à la page, car elle n'est pas garantie). **Palette neutre** : encre presque noire, gris sans teinte, plus aucun indigo. **Trois épaisseurs de trait** : sol en gras, contours normaux, cotes de niveaux en filet gris pointillé ; matière coupée en noir ; filet sous chaque titre de la planche. **Textes** : environ 7 pt sur le papier à toutes les échelles (le dessin est reconstruit à l'échelle choisie, donc les cotes de niveaux ne se chevauchent plus), titres de la planche en gras, propriétés du PDF (titre, sujet, créateur). L'écran Vues utilise la même palette et les mêmes épaisseurs.
- Fichiers : `src/features/export/{pdf,pdfLayout,cartouche}.ts` + tests, `src/features/building/views/{drawing,sheet}.ts`, `src/components/views/{ViewDrawing,ViewsScreen,ViewsPdfDialog}.tsx`, `src/components/editor/exportProject.ts`, `src/lib/date.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2128) — PDF de planche (A3) et de coupe (A4, 1:100) générés et rendus en image pour contrôle ; le PDF d'un plan (image du canevas dans le nouveau cadre) est à ouvrir dans le navigateur
- Commit : feat: mise en page professionnelle des PDF (cadre, cartouche, palette neutre, traits)

### 2026-11-11 — M10 · Tâche 6 · Export PDF des vues
- Fait : bouton **« PDF »** dans l'écran Vues, pour la vue affichée (façade, coupe ou planche). Fenêtre : nom du fichier, feuille A4 / A3, orientation (paysage si le dessin est plus large), **échelle** 1:20, 1:50, 1:100, 1:200 ou « Ajuster à la page » (l'échelle la plus grande qui tient est proposée d'emblée ; message et suggestion si elle ne tient pas, comme pour les plans). PDF **vectoriel** (pas une image) : les mm réels du dessin divisés par l'échelle donnent des mm de papier (2,50 m à 1:50 = 50 mm), faces blanches ou noires (coupes), cotes de niveaux, titres de la planche ; textes jamais plus petits que 6 pt. Même **cartouche** et même barre d'échelle de 1 m que le PDF d'un plan (nom du projet, date, échelle, et le titre de la vue). `Choice` et `ChoiceGroup` (pastilles de la fenêtre Exporter) sont devenus des composants communs.
- Fichiers : `src/features/export/pdf.ts` (`buildDrawingPdf`, `drawCartouche`), `pdf.test.ts`, `src/components/views/{ViewsPdfDialog,ViewsScreen}.tsx`, `src/components/ui/{Choice,ChoiceGroup}.tsx`, `src/components/editor/ExportDialog.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2122) — PDF à ouvrir et mesurer à la règle (hauteur d'étage de 2,50 m = 50 mm à 1:50, impression à 100 %)
- Commit : feat: M10 tâche 6, export PDF des vues

### 2026-11-11 — M10 · Tâche 5 · Planche
- Fait : format de **dessin commun** (`Drawing` : polygones, lignes, textes, en mm réels) que l'écran et le PDF de la tâche 6 dessineront tous les deux ; les façades et coupes passent maintenant par lui (même rendu qu'avant). **Onglet « Planche »** (dernier onglet de l'écran Vues) : plans de chaque niveau (sols en gris clair, murs en gris foncé, vus de dessus), les quatre façades et les coupes, **côte à côte à la même échelle**, rangés en lignes dans cet ordre, chacun sous son titre (nom du niveau, « Façade Nord », « Coupe A–A »). Les textes ont une hauteur commune ; un niveau ou une vue vide n'a pas de case. Planche vide : message.
- Limite : le plan d'un niveau montre les murs pleins (pas de symboles de portes ni de fenêtres) ; les symboles viendront avec les hachures et textures si tu le veux.
- Fichiers : `src/features/building/views/{drawing,sheet,section}.ts`, `sheet.test.ts`, `src/components/views/{ViewsScreen,ViewDrawing}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2121, dont 10 nouveaux) — rangement et lisibilité à contrôler dans le navigateur
- Commit : feat: M10 tâche 5, planche

### 2026-11-11 — M10 · Tâche 4 · Calcul et affichage de la coupe
- Fait : **calcul pur** `buildSection` : tout solide (morceau de mur, marche, cheminée, dalle, plateforme) est un contour extrudé ; le plan de coupe le traverse sur des segments (règle pair-impair, donc les trémies sont des vides) qui deviennent des faces **coupées** (noires, au premier plan) ; ses côtés restent visibles **derrière** la ligne, dans le sens du regard, en blanc à contour noir ; tout est limité à la **longueur** de la ligne. Une fenêtre coupée montre l'allège et le linteau en noir et le vide entre les deux. **Écran Vues** : un onglet « Coupe A–A » par ligne de coupe du plan (dans l'ordre des repères), à jour en direct : déplacer ou inverser la ligne met la coupe à jour ; une ligne supprimée affiche un message ; une ligne qui ne rencontre rien aussi. Même dessin et mêmes cotes de niveaux que les façades.
- Limites : les côtés intérieurs d'une trémie derrière la coupe ne sont pas dessinés ; hachures et textures plus tard (jalon ultérieur).
- Fichiers : `src/features/building/views/{section(.test),projection}.ts`, `src/components/views/{ViewsScreen,ViewDrawing}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2111, dont 10 nouveaux) — onglets et noir de la coupe à contrôler dans le navigateur
- Commit : feat: M10 tâche 4, coupes

### 2026-11-11 — M10 · Tâche 3 · Ligne de coupe
- Fait : nouveau type **`section`** (deux points absolus, repère, sens de vue `lookLeft` ; commun à tous les niveaux comme les axes ; pas de changement de version). **Outil « Ligne de coupe »** (bouton ciseaux, famille Cotation, sans raccourci) : deux clics, avec les mêmes aimantations et guides que l'axe ; le repère suit la suite A, B, C… **Dessin 2D** : trait mixte noir, une flèche à chaque bout vers le sens de vue, une bulle avec le repère au bout de chaque flèche. **Propriétés** : repère (le nom suit : « Coupe A–A »), bouton « Inverser le sens de vue », longueur en mm. Se déplace et se modifie aux sommets comme un axe ; ne tourne pas avec `Maj + R`. Le sens de vue : « à gauche » est celui de la personne qui marche du premier au deuxième point, vue de dessus. La coupe elle-même vient à la tâche 4.
- Fichiers : `src/types/document.ts`, `src/features/geometry/{sections(.test),transform,rotateSelection}.ts`, `src/features/documents/{elements,levels}.ts`, `src/features/export/bounds.ts`, `src/components/editor/{shapes/SectionShape,SectionFields,ElementNode,Toolbar,ToolHint,EditorStage,usePolylineDrawing,PolylineDraftLayer,PropertiesPanel,LayersPanel}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2101) — tracé, flèches et inversion à contrôler dans le navigateur
- Commit : feat: M10 tâche 3, ligne de coupe

### 2026-11-11 — M10 · Tâche 2 · Écran « Vues » avec les façades
- Fait : bouton **« Vues »** dans l'en-tête (projets Plan) qui ouvre un écran en lecture seule plein écran avec quatre onglets **Façade Nord / Est / Sud / Ouest** (vue de l'extérieur). Dessin en SVG : faces blanches à contour noir, ligne de sol, **cotes de niveaux** (nom et altitude du plancher en mm, `± 0 mm`, `+ 2500 mm`) en pointillé indigo. La vue suit le plan en direct (même modèle que la 3D, tous les niveaux, toit plat). Les onglets des coupes et de la planche arrivent aux tâches 4 et 5.
- Choix : dessin en SVG et non en Konva (plus léger pour une vue en lecture seule ; le PDF de la tâche 6 redessinera les mêmes faces en vectoriel).
- Fichiers : `src/stores/viewsStore.ts`, `src/components/views/{ViewsScreen,ViewDrawing}.tsx`, `src/features/building/views/labels(.test).ts`, `src/components/editor/EditorHeader.tsx`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2091) — affichage à contrôler dans le navigateur
- Commit : feat: M10 tâche 2, écran Vues avec les façades

### 2026-11-11 — M10 · Tâche 1 · Calcul des façades
- Fait : choix validés avec l'utilisateur : écran « Vues » en lecture seule ouvert par un bouton de l'en-tête (la planche en dernier onglet) ; faces blanches à contour noir (hachures, textures et toitures dans un jalon ultérieur, notés dans « Idées » et dans la roadmap) ; escaliers, cheminées et plateformes inclus. **Calcul pur** : `projectModel` projette le modèle 3D sur un plan vertical (u = droite de la personne qui regarde, v = hauteur), ne garde que les faces verticales tournées vers elle, triées de la plus lointaine à la plus proche (algorithme du peintre) ; `buildElevation` donne la façade N, S, E ou O selon le nord réglé, avec son emprise et les cotes de niveaux (altitudes des planchers). Une face vue par la tranche (moins de 0,5 mm de large) n'est pas dessinée. Pas encore d'écran : suivent les tâches 2 à 7.
- Limite connue : le tri se fait par face (milieu de la face), approximation classique du peintre ; sans conséquence pour des faces blanches à contour noir sur des murs droits.
- Fichiers : `src/features/building/views/{projection,elevation}.ts`, `elevation.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2090, dont 12 nouveaux)

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 4 sur 4 : validation)
- Fait : contrôle dans le navigateur par l'utilisateur : outil Étirer (rectangle, aperçu, distance au clavier, annulation en un pas) validé. **Étirer par zone terminé.**
- Suite possible : option A (glisser un seul mur à la poignée), notée dans « Idées ».
- Vérification : build ✓ lint ✓ tests ✓

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 3 sur 4 : distance au clavier)
- Fait : pendant le déplacement de l'outil Étirer, on peut **taper la distance en mm** (chiffres, `-` en premier pour inverser, Retour arrière pour corriger) puis `Entrée` : elle s'applique dans la direction où pointe la souris (horizontale ou verticale), arrondie au mm, avec les mêmes garde-fous (angles droits, ouvertures retirées si elles ne tiennent plus). L'aperçu affiche `1000 mm ↵`. La saisie est interceptée avant les raccourcis (Retour arrière ne supprime donc pas la sélection). Le bouton et le raccourci `S` étaient déjà faits à la tâche 2.
- Reste : tâche 4 (contrôle final dans le navigateur).
- Fichiers : `src/features/geometry/stretchZone(.test).ts` (`typedStretchDelta`), `src/components/editor/{useStretchTool.ts,StretchDraftLayer.tsx}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2078)

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 2 sur 4 : outil et aperçu)
- Fait : **outil Étirer** (`S`, famille Construction, projets Plan uniquement). On **glisse un rectangle** autour de la partie à déplacer, on **clique un point de départ**, puis on **clique le point d'arrivée** : l'aperçu montre en direct les murs, pièces, cotes et objets tels qu'ils seraient (en indigo), avec la distance en mm ; `Maj` garde l'horizontale ou la verticale ; le point suit la grille d'aimantation ; un côté en biais qui traverse la zone bloque le déplacement (message rouge). `Échap` quitte l'outil et abandonne le geste. La validation passe par `stretchZoneBy` (un seul pas d'historique, annulable ; un message si des ouvertures sont retirées). L'outil reste actif pour enchaîner.
- Reste : tâche 3 (saisie de la distance en mm au clavier) et tâche 4 (contrôle final dans le navigateur).
- Fichiers : `src/components/editor/{useStretchTool.ts,StretchDraftLayer.tsx,EditorStage.tsx,Toolbar.tsx,ToolHint.tsx,shortcuts.ts,useEditorShortcuts.ts}`, `src/stores/editorStore.ts` (`stretchZoneBy`, outil `stretch`), `src/i18n/fr.ts`, `src/features/geometry/stretchZone.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (17 pour l'étirement) — le geste à la souris est à contrôler à la main dans le navigateur

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 1 sur 4 : calcul)
- Fait : demande de l'utilisateur (option C : étirer une zone au rectangle, comme « stretch » en CAO ; l'option A, glisser un seul mur à la poignée, est gardée pour après). **Calcul pur** `stretchZone` : les sommets de murs, de pièces et de cotes dans le rectangle se déplacent, les autres restent (les murs qui traversent le bord s'allongent ou se raccourcissent) ; les objets posés dont le centre est dans la zone bougent entiers ; les ouvertures gardent leur taille et leur place réelle (elles suivent leur mur s'il est dans la zone), retirées si elles ne tiennent plus ; verrouillés ignorés. `constrainStretch` garde les angles droits (un mur horizontal qui traverse la zone interdit le déplacement vertical, et inversement ; un côté en biais qui traverse la zone bloque tout). Pas encore d'outil ni de bouton : suivent les tâches 2 (outil et aperçu), 3 (saisie en mm, bouton, raccourci `S`) et 4 (annulation en un pas).
- Fichiers : `src/features/geometry/stretchZone(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (15 nouveaux)

### 2026-11-11 — Hors jalon · I · Redimensionner une pièce en bloc
- Fait : demande de l'utilisateur (option A choisie : par la sélection, sans nouveau type dans le document). Quand la sélection contient un mur ou une pièce (par exemple une pièce préfabriquée qui vient d'être posée, ou un rectangle dessiné « Avec murs » sélectionné d'un cadre), Propriétés affiche **« Redimensionner l'ensemble »** : largeur et profondeur en mm, mesurées sur la **pièce** (face intérieure) ou, sans pièce, sur l'axe des murs. À la validation : les **murs, le sol (pièces) et les cotes s'étirent** (les murs gardent leur épaisseur) ; les **ouvertures gardent leur taille** et leur place en proportion le long de leur mur (même celles non sélectionnées, du moment que leur mur l'est) ; les **meubles, escaliers, cheminées et plateformes gardent leur taille** : un élément à moins de 250 mm d'un mur reste contre ce mur (sur chaque axe indépendamment : collé en haut mais au milieu en largeur, il glisse en proportion le long du mur ; dans un angle, il reste dans l'angle), sinon son centre garde sa place en proportion ; toujours dans la pièce (trop grand : poussé contre le début). Une ouverture qui ne tient plus sur son mur raccourci est retirée (message). Un seul pas d'historique ; minimum 500 mm ; éléments verrouillés ignorés. Les ouvertures sont placées par la fonction elle-même : `commit` accepte maintenant de sauter `reconcileOpenings` pour cette action.
- Limites : plans axés sur les axes (murs horizontaux et verticaux ; une pièce tournée par `Maj + R` convient) ; les textes, lignes et images de la sélection ne bougent pas ; la hauteur de plan, les trémies et les niveaux au-dessus se recalculent d'eux-mêmes (rien n'est stocké).
- Fichiers : `src/features/geometry/resizeBlock(.test).ts`, `src/stores/editorStore.ts`, `src/components/editor/{BlockResizeSection,PropertiesPanel}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (16 nouveaux) — à contrôler dans le navigateur
- Commit : feat: redimensionner une pièce en bloc (murs et sol s'étirent, ouvertures et meubles gardent leur taille)

### 2026-11-11 — Hors jalon · H · Réorganisation de l'écran de l'éditeur
- Fait : demande de l'utilisateur (« on dirait qu'on a juste jeté tous les outils et éléments en même temps »). **Barre d'outils par familles** (à gauche) : Sélection | Construction (mur, pièce, plateforme, escalier, cheminée) | Ouvertures (porte, fenêtre) | Cotation (cote, axe) | Dessin et texte (texte, rectangle, ellipse, ligne) | Image (importer, calibrer). Un bouton par famille montre l'outil actif ou le dernier choisi ; la petite flèche (ou un clic droit) ouvre la liste de la famille avec les noms et les raccourcis ; Échap ou un clic ailleurs la ferme. Les familles du plan n'apparaissent que dans un plan ; les raccourcis clavier ne changent pas. **Barre contextuelle en haut du plan** : le sélecteur de niveau, puis les options de l'outil en cours (mur droit, rectangle, avec murs, forme d'escalier…), qui étaient en bas au milieu. **Panneau de droite à onglets** (320 px) : Propriétés | Bibliothèque | Calques (niveaux puis calques) | Métrés ; un seul contenu à la fois au lieu de cinq panneaux empilés ; dans un visuel, seulement Propriétés et Calques. Sélectionner un élément sur le plan depuis l'onglet Bibliothèque bascule sur Propriétés (pas depuis Calques ni Métrés, où l'on sélectionne aussi). Les titres répétés par les onglets sont gardés pour les lecteurs d'écran seulement.
- Fichiers : `src/components/editor/{Toolbar,SidePanel,ToolModeBar,LevelSelector,PropertiesPanel,MeasurementsPanel,LayersPanel,LevelsPanel}.tsx`, `src/components/library/LibraryPanel.tsx`, `src/pages/EditorPage.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2042) — disposition à contrôler dans le navigateur (aucun test automatisé de l'interface)
- Commit : feat: réorganisation de l'écran de l'éditeur (outils par familles, barre contextuelle, onglets)

### 2026-11-11 — M9 · Lot E · Cheminées
- Fait : nouveau type **`chimney`** (conduit `width × depth`, `heightAboveTop`, `x, y, rotation` comme le mobilier ; pas de changement de version). **Outil Cheminée** (bouton `BrickWallFire`, sans raccourci) : un clic pose un conduit de 600 × 600 mm (dépassement 800 mm), centré et aimanté à la grille ; l'outil reste actif. **2D** : carré gris aux deux diagonales sur son niveau ; **contour fantôme** (pointillé, croix légère) sur tous les niveaux au-dessus du sien. **3D** : une boîte du plancher de son niveau jusqu'au dessus du dernier niveau affiché + le dépassement, cliquable, **sans trou dans les dalles**. **Propriétés** : nom, largeur, profondeur, dépassement, position et rotation ; redimensionnable à la poignée (mm entiers, minimum 100 mm) ; `Maj + R` la tourne sur place. Pas dans les métrés (aucune quantité prévue au jalon).
- Fichiers : `src/features/building/{chimney,chimney.test,model,types}.ts`, `src/features/documents/elements.ts`, `src/features/geometry/{transform,rotateSelection}.ts`, `src/features/export/bounds.ts`, `src/components/editor/{shapes/ChimneyShape,ChimneyFields,ChimneyUpperGhosts,ElementNode,PropertiesPanel,Toolbar,ToolHint,EditorStage,LayersPanel}`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `src/types/document.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2042, dont 12 nouveaux) — pose, fantôme et volume 3D à contrôler dans le navigateur
- Commit : feat: M9 lot E, cheminées

### 2026-11-11 — M9 · Lot D bis · Trémies
- Fait : la **trémie** d'un escalier est calculée (emprise agrandie de la marge, 50 mm par défaut ; jamais stockée) : rectangle pour un escalier droit, **polygone en L** pour un L, rectangle englobant pour un U (volées, palier et jour central). **Dalle 3D** du niveau du dessus **trouée** : la dalle d'une pièce reçoit un trou par trémie qui tient entièrement dans la pièce (forme à trous Three.js, pas de calcul booléen) ; déplacer l'escalier déplace le trou. **Plan du niveau du dessus** : contour pointillé de la trémie avec une croix par rectangle, en plus du contour fantôme de l'escalier. **Métrés** : chaque pièce a sa surface au tracé, sa trémie et sa **surface nette** (panneau Métrés, propriétés de la pièce, totaux du bâtiment) ; le CSV du tableau des pièces gagne les colonnes **« Trémie (m²) »** et **« Surface nette (m²) »**. Une pièce de 5000 × 4000 mm (20,00 m²) au-dessus d'un escalier droit de 1000 × 3500 mm : trou de 1100 × 3600 mm (3,96 m²), 20,00 m² au tracé et 16,04 m² net. **Trémie qui déborde de la pièce** (première version, pas de découpe entre polygones) : avertissement rouge (propriétés de l'escalier, métrés, contour rouge sur le plan), dalle laissée pleine, aucune surface retirée. Niveau du dessus supprimé : plus de trémie. Une trémie est attribuée à la pièce du niveau du dessus qui contient son centre ; sans pièce, il n'y a rien à percer et pas d'avertissement.
- Fichiers : `src/features/stairs/{voids,voids.test}.ts`, `src/features/building/{model,types}.ts`, `src/features/measurements/{measurements,csv}.ts`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/components/editor/{StairUpperGhosts,StairFields,MeasurementsPanel,PlanElementFields}.tsx`, `src/i18n/fr.ts`, tests `measurements.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2030, dont 14 nouveaux) — trou de la dalle 3D et croix sur le plan à contrôler dans le navigateur
- Commit : feat: M9 lot D bis, trémies

### 2026-11-11 — M9 · Lot D · Escaliers entre niveaux
- Fait : nouveau type **`stair`** (droit, en L, en U ; `x, y, rotation` comme le mobilier ; marches, paliers et trémie calculés, jamais stockés ; pas de changement de version). **Calcul** (`src/features/stairs/`, fonctions pures) : hauteur à monter = altitude du niveau du dessus − altitude du niveau de départ ; contremarches n = plus petit entier avec hauteur ≤ 180 mm ; girons = n − 1 ; giron = longueur des volées ÷ girons (≥ 250 mm) ; longueur nécessaire = (n − 1) × 250 mm. 2 700 mm donnent 15 contremarches de 180 mm, 14 girons, 3500 mm ; 2 880 mm donnent 16 contremarches. **Outil Escalier** (bouton `Footprints`, sans raccourci) : choix Droit / En L / En U dans la barre de modes, aperçu fantôme, clic = pose centrée avec des longueurs qui suffisent ; **refusée sur le dernier niveau** (message). **Propriétés** : forme (les longueurs sont recalculées au changement), emmarchement, longueurs des volées, jour central (U), Retourner (L et U), marge de trémie, et les marches calculées. **2D** : volées avec lignes de marche, palier, flèche de montée ; **en rouge** avec « Trop court : 3500 mm nécessaires » ou « Aucun niveau au-dessus » (niveau du dessus supprimé : l'escalier reste, sans marches ni trémie). Contour en fantôme (pointillé) sur le niveau du dessus. **3D** : une marche pleine par giron (+ le palier, qui compte pour une marche), cliquable. **Métrés** : tableau « Escaliers » (contremarches, hauteur de contremarche, girons) dans le panneau, et dans le CSV (forme, emmarchement, contremarches, hauteur, girons, giron, remarque). Un escalier ne se redimensionne pas à la poignée (déplacement et rotation seulement ; `Maj + R` le tourne autour du centre de son emprise). Dupliquer un niveau ne copie pas ses escaliers (seuls les murs sont copiés, comme avant).
- Choix : pour que « changer la hauteur d'étage » recalcule les marches, **changer la hauteur d'un niveau remonte ou descend d'autant les niveaux au-dessus** quand ils étaient empilés dessus (le niveau du dessus démarrait exactement à altitude + hauteur) ; un niveau dont l'altitude a été réglée à la main n'est pas déplacé. Un escalier en U a une trémie rectangulaire (volées, palier et jour central).
- Fichiers : `src/features/stairs/{stairs,placement}.ts` + tests, `src/features/building/{stairSteps,model,types}.ts`, `src/features/documents/{elements,levels,properties}.ts`, `src/features/geometry/{transform,rotateSelection}.ts`, `src/features/export/bounds.ts`, `src/features/measurements/{measurements,csv}.ts`, `src/components/editor/{shapes/StairShape,StairFields,StairGhost,StairUpperGhosts,ElementNode,PropertiesPanel,Toolbar,ToolModeBar,ToolHint,EditorStage,LayersPanel,SelectionTransformer,MeasurementsPanel}`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `src/types/document.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2016, dont 41 nouveaux) — pose, rouge, fantôme et marches 3D à contrôler dans le navigateur
- Commit : feat: M9 lot D, escaliers entre niveaux

### 2026-11-11 — M9 · Lot C · Plateformes
- Fait : nouveau type d'élément **`platform`** (polygone à points absolus, `elevation` = hauteur du dessus par rapport au plancher du niveau, `thickness` = épaisseur sous le dessus ; **pas de changement de version** du document). **Outil Plateforme** (bouton `Layers2` dans la barre d'outils des plans, sans raccourci clavier) avec les modes « Polygone » et « Rectangle » (2 clics) de la barre de modes ; mêmes aimantations et guides que la pièce ; les sommets se déplacent comme ceux d'une pièce. Dessin 2D : aplat sable, contour brun et étiquette de hauteur **`+450 mm`** au centre. Propriétés : nom, **hauteur du dessus** (défaut 450 mm), **épaisseur** (défaut = hauteur du dessus, estrade pleine ; jamais plus grande : une saisie plus grande est ramenée à la hauteur, et une estrade pleine suit sa hauteur quand on la change), surface, périmètre et volume. **3D** : prisme extrudé du dessus (`niveau + hauteur`) vers le bas sur son épaisseur, matière sable ; jamais sous le plancher. **Métrés** : tableau « Plateformes » dans le panneau (surface m², volume m³ = surface × épaisseur), totaux par niveau et pour le bâtiment ; **CSV** : tableau « Plateformes » (niveau, nom, surface m², hauteur du dessus mm, épaisseur mm, volume m³) avec une ligne de totaux ; la plateforme n'entre pas dans la surface des pièces. Une plateforme de 4000 × 3000 mm à 450 mm donne 12,00 m² et 5,40 m³. Elle tourne avec `Maj + R`. Unités : mm, m², m³ (nouveaux helpers `formatVolume` et `mm3ToM3`).
- Choix : dupliquer un niveau ne copie pas les plateformes (seuls les murs et leurs ouvertures sont copiés, comme avant) ; l'aimantation des autres tracés tient compte des sommets des plateformes.
- Fichiers : `src/types/document.ts`, `src/features/documents/elements.ts`, `src/features/geometry/{transform,snapping,rotateSelection}.ts`, `src/features/export/bounds.ts`, `src/features/measurements/{measurements,csv}.ts`, `src/features/units/format.ts`, `src/features/building/{model,types}.ts`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/components/editor/{shapes/PlatformShape,PlatformFields,ElementNode,PropertiesPanel,Toolbar,LayersPanel,ToolModeBar,ToolHint,EditorStage,usePolylineDrawing,PolylineDraftLayer,MeasurementsPanel,VertexHandles}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, tests `src/features/measurements/platform.test.ts` et `src/features/building/platform.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1975, dont 16 nouveaux) — tracé, étiquette et 3D à contrôler dans le navigateur
- Commit : feat: M9 lot C, plateformes

### 2026-11-11 — M9 · Lot B · Pièces préfabriquées et Maj + R étendu
- Fait : catégorie **« Pièces préfabriquées »** dans la Bibliothèque (7 pièces : chambre 3500 × 3200 mm, salle de bain 2500 × 2200, WC 1500 × 1500, cuisine 3600 × 3000, séjour 5000 × 4000, bureau 3000 × 3000, garage 3200 × 6000 ; dimensions = face intérieure). Chacune est **dessinée de zéro** (clean room) à partir d'objets du catalogue et se pose comme un ensemble : une pièce étiquetée, **un seul mur fermé** de 200 mm, des portes et fenêtres rattachées à ce mur (portes ouvertes vers l'intérieur, baie pour le garage) et le mobilier, avec **aperçu fantôme** (mur compris) sous le curseur, vignette avec le mur, clic ou glisser-déposer. La pose se fait en **un seul pas d'historique** (un « annuler » retire tout) ; les éléments restent ensuite **indépendants** et gardent leurs ouvertures. Elles ne fusionnent pas avec les murs voisins. **`Maj + R`** : toute la sélection tourne de 90° autour du centre de son emprise commune (murs, pièces, cotes : leurs points ; mobilier, rectangles, images, ellipses : rotation et position) ; les ouvertures suivent leur mur (une rotation du mur ne les déplace plus ni ne les supprime : `reconcileOpenings` reconnaît un mouvement rigide) ; les axes, éléments verrouillés, textes et lignes ne tournent pas. Escaliers, cheminées et plateformes seront ajoutés au quart de tour avec leurs lots.
- Limite : les meubles de la pièce sont placés à la main sans vérification de passage ; le test contrôle seulement qu'ils restent dans la pièce et que les ouvertures tiennent dans leur mur.
- Fichiers : `src/features/library/catalog/{prefabs,sets,define,index}.ts`, `src/features/library/{placeSet,types}.ts`, `src/features/geometry/rotateSelection(.test).ts`, `src/features/documents/wallOpenings.ts`, `src/features/library/{prefabs.test,testBrands,catalogGlobal.test}.ts`, `src/components/library/{LibraryPanel,SymbolPreview}.tsx`, `src/components/editor/{EditorStage,FurnitureGhost,useEditorShortcuts}`, `src/i18n/{fr,libraryTexts}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1959, dont 17 nouveaux) — aperçu fantôme, vignettes et rotation à contrôler dans le navigateur
- Commit : feat: M9 lot B, pièces préfabriquées et Maj + R étendu

### 2026-11-11 — M9 · Lot A · Murs et pièces
- Fait : une **barre de modes** apparaît en bas du canevas (pas de bouton de plus dans la barre d'outils). **Outil Mur** : « Polyligne » (comme avant) ou « Mur droit » (clic de début, clic de fin : le mur est créé). **Outil Pièce** : « Polygone » ou « Rectangle » (clic sur un coin, clic sur le coin opposé), avec une case **« Avec murs »** : le rectangle tracé est la face intérieure, et la pièce plus **un seul mur fermé** (axe décalé d'une demi-épaisseur) sont créés en **un seul pas d'historique** (une pièce de 4000 × 3000 mm avec un mur de 200 mm donne 12,00 m² et un axe de 4200 × 3200 mm). Aperçu en direct du rectangle avec largeur, hauteur et surface ; le mur épais est prévisualisé avec l'option. Mêmes aimantations qu'avant, sauf pour le rectangle (pas de direction contrainte, pour ne pas obtenir un rectangle aplati : un clic qui donnerait une surface nulle est ignoré). Changer de mode abandonne le tracé en cours. Maj + survol (pièce automatique) reste disponible dans les deux modes de l'outil Pièce.
- Fichiers : `src/features/documents/construction(.test).ts`, `src/components/editor/{ToolModeBar,usePolylineDrawing,PolylineDraftLayer,ToolHint}`, `src/stores/editorStore.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1942, dont 6 nouveaux) — tracé à la souris à contrôler dans le navigateur
- Commit : feat: M9 lot A, mur droit, pièce rectangle et pièce avec murs

### 2026-11-11 — Hors jalon · G · Style des cotes
- Fait : demande de l'utilisateur (image d'un plan coté). Les cotes se rapprochent de ce style : trait **noir**, **chiffres plus petits** posés juste au-dessus de la ligne, **lignes d'attache fines qui ne touchent pas l'objet** (un petit écart au départ, un dépassement au bout), traits obliques à 45° un peu plus longs. Le texte d'une cote **verticale se lit de bas en haut** (-90°), quel que soit le sens de la mesure. Les valeurs gardent leur unité (règle du projet) mais **l'unité « mm » est plus petite et grise** que le chiffre, et elle est **masquée quand la cote fait moins de 90 px à l'écran** (le chiffre reste) : moins d'encombrement. Largeur du texte estimée (≈ 0,56 × la taille de police par caractère), donc le centrage est approximatif.
- Fichiers : `src/features/geometry/dimension(.test).ts`, `src/components/editor/shapes/DimensionShape.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (1936) — rendu à contrôler à l'écran
- Commit : feat: style des cotes (texte, lignes d'attache)

### 2026-11-11 — Hors jalon · F · Cotes aimantées aux ouvertures
- Fait : demande de l'utilisateur (la cote doit tenir compte des fenêtres, portes et autres ouvertures, avec l'aimantation). Avec l'outil **Cote**, et quand on **glisse l'extrémité d'une cote**, le curseur s'aimante aux **deux jambages** (bords) et au **milieu** de chaque porte, fenêtre ou baie visible, sur l'axe du mur et sur ses deux faces (9 points par ouverture). Repère **turquoise** ; priorité : ouverture, sommet, axe, alignement, grille. On peut ainsi coter la largeur d'une ouverture, ou un trumeau (angle du mur → bord de l'ouverture). Les points d'ouverture servent aussi de repères aux guides d'alignement. Alt désactive les guides comme avant. Ouvertures masquées, ou dont le mur est masqué ou absent : ignorées.
- Limite : seuls les outils Cote (et ses poignées) utilisent ces points ; murs, pièces et axes inchangés.
- Fichiers : `src/features/geometry/snapping(.test).ts` (`collectOpeningSnapPoints`, `openingPoints`), `src/components/editor/{usePolylineDrawing,VertexHandles,PolylineDraftLayer}`
- Vérification : build ✓ lint ✓ tests ✓ (1936 au total, dont 4 nouveaux) — aimantation à contrôler à l'écran
- Commit : feat: cotes aimantées aux ouvertures

### 2026-11-11 — Hors jalon · C · Navigation sur le plan de travail
- Fait : demande de l'utilisateur (aucun moyen de naviguer à part Espace + glisser). **Clic molette maintenu** : déplace la vue, quel que soit l'outil, même au-dessus d'un élément (un clic molette ou droit ne sélectionne plus ni ne déplace d'élément : `Konva.dragButtons = [0]`). **Molette** : un cran de souris zoome vers le curseur (comme avant) ; **glissement à deux doigts** sur un pavé tactile (petits défilements en pixels, ou horizontal) déplace la vue ; **pincement** et **Ctrl + molette** zooment en continu ; **Maj + molette** déplace horizontalement. **Barres de défilement** (horizontale en bas, verticale à droite) : la plage couvre la page avec une demi-fenêtre de marge de chaque côté ; on glisse le curseur ou on clique sur la piste. **Mini-carte** en bas à droite : la page, les éléments du niveau actif (jusqu'à 2 000) et un cadre pour la zone visible ; un clic ou un glissement déplace la vue ; bouton « carte » dans la barre de zoom pour l'afficher ou la masquer (choix mémorisé dans le navigateur, affichée par défaut). Espace + glisser est conservé.
- Limite connue : la distinction souris / pavé tactile est une estimation (un défilement vertical de moins de 40 px sans Maj est pris pour un pavé tactile) ; une souris à molette très fine pourrait déplacer la vue au lieu de zoomer. Ctrl + molette zoome toujours.
- Fichiers : `src/features/geometry/navigation(.test).ts`, `src/components/editor/{ScrollBars,MiniMap,usePanDrag,EditorStage,ZoomControls,useElementInteractions}`, `src/stores/minimapStore.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1932 au total, dont 18 nouveaux) — clic molette, barres et mini-carte à contrôler dans le navigateur
- Commit : feat: navigation (clic molette, pavé tactile, barres de défilement, mini-carte)

### 2026-11-11 — Hors jalon · B · Guides d'alignement dans les plans
- Fait : demande de l'utilisateur. **Pendant le tracé** d'un mur, d'une pièce, d'une cote ou d'un axe, et **quand on glisse un sommet**, le curseur s'aligne en x et en y (à 8 px près) sur les sommets des autres éléments, et un **guide en pointillé rose** traverse la page (le même affichage que les guides de M2). Les deux coordonnées s'alignent indépendamment (un croisement de deux guides est possible) ; la coordonnée alignée n'est plus arrondie à la grille, l'autre l'est. Sur une direction horizontale ou verticale (alignement doux, Maj), seule la coordonnée libre s'aligne ; sur une diagonale à 45°, aucun guide. Priorité : sommet, axe de construction, axe de mur, alignement doux, **guides**, grille. **Repères** : mur et axe s'alignent sur les points d'axe des murs, pièces et cotes ; pièce et cote aussi sur les angles des faces de murs (pour tracer une pièce à l'aplomb d'un coin intérieur) ; en plus, les points déjà posés du tracé en cours et les autres sommets du même élément quand on glisse un sommet. **Alt** désactive les guides avec l'alignement. Les guides s'effacent en quittant l'outil et à la fin d'un glissement.
- Rappel : le déplacement d'un élément entier avait déjà ses guides (M2, bords et centres des boîtes) ; je ne l'ai pas modifié.
- Fichiers : `src/features/geometry/snapping(.test).ts` (`alignTargets`, `collectAlignTargets`, guides), `src/components/editor/{usePolylineDrawing,VertexHandles,PolylineDraftLayer}`
- Vérification : build ✓ lint ✓ tests ✓ (1914 au total, dont 10 nouveaux) — guides à contrôler à l'écran
- Commit : feat: guides d'alignement pendant le tracé et le glissement de sommets

### 2026-11-11 — Hors jalon · E · Pièce automatique (Maj + survol)
- Fait : demande de l'utilisateur. Avec l'outil Pièce, **Maj maintenu** (aucun point posé) et le curseur dans une zone fermée par des murs : la zone s'affiche en vert avec sa surface ; **un clic crée la pièce** sur les **faces intérieures** des murs (4 murs d'axes 4 000 × 3 000 mm et de 200 mm : 10,64 m²). Si la zone n'est pas fermée (mur manquant, trouée, extérieur) ou si le curseur est dans l'épaisseur d'un mur, un message « Zone non fermée par les murs » suit le curseur et un clic ne crée rien. L'aperçu suit aussi l'appui et le relâchement de Maj sans bouger la souris ; Maj en cours de tracé garde son rôle (angles de 45°). **Calcul** (`createRegionFinder`) : les faces de tous les murs du niveau actif sont découpées à chaque croisement pour former un graphe plan, les bouts qui ne ferment rien sont élagués, chaque zone fermée est un cycle ; on prend le plus petit cycle qui contient le point. Gère murs séparés ou tracés d'un seul trait, angles obliques, murs d'épaisseurs différentes, murs de refend, îlots fermés dans une grande pièce, murs superposés. Le graphe est préparé une fois par état du plan (900 murs : moins d'une seconde), puis chaque survol est instantané. Les portes et fenêtres ne coupent pas la zone (le mur reste continu).
- Limite : une zone qui contient un îlot fermé (un caisson, une pièce dans une grande pièce) est renvoyée avec le contour extérieur seulement, l'îlot n'est pas retiré de la surface.
- Fichiers : `src/features/geometry/regions(.test).ts`, `src/components/editor/{usePolylineDrawing,PolylineDraftLayer}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1904 au total, dont 14 nouveaux) — aperçu et clic à contrôler dans le navigateur
- Commit : feat: pièce automatique sur une zone fermée par des murs (Maj + survol)

### 2026-11-11 — Hors jalon · D · Liaison des murs
- Fait : demande de l'utilisateur (murs qui se superposent au lieu de se lier). **Aimantation sur l'axe d'un mur existant** (outil Mur et glissement d'un sommet de mur) : un point posé sur un mur, dans son épaisseur, ou près de lui est ramené sur son axe, ce qui donne des jonctions en T et des murs qui partagent le même axe ; repère orange ; priorité : sommet, axe de construction, **axe de mur**, alignement, grille ; Maj (45°) et Alt (désactive) inchangés. Pas pour la pièce ni la cote, qui suivent les faces. **Raccords d'angle** : des murs séparés qui se terminent au même point avaient un coin extérieur creux (bouts droits) ; un polygone de la couleur du mur comble désormais ce creux (angles droits, obliques, murs d'épaisseurs différentes ; angle très aigu coupé en biseau). Rien aux jonctions en T / X, aux prolongements, aux extrémités libres ni aux contours fermés (déjà en onglet). Affichage seulement : le document n'est pas modifié (pas de migration), la 3D garde son propre raccord.
- Fichiers : `src/features/geometry/{snapping,wallJoins}(.test).ts`, `src/components/editor/shapes/{WallShape.tsx,WallJoinsContext.ts}`, `src/components/editor/{EditorStage,usePolylineDrawing,VertexHandles,PolylineDraftLayer}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1890 au total, dont 16 nouveaux) — aimantation et raccords à contrôler à l'écran
- Commit : feat: liaison des murs (aimantation sur l'axe, raccords d'angle)

### 2026-11-11 — Hors jalon · A · Alignement doux du tracé (murs, pièces, cotes, axes)
- Fait : demande de l'utilisateur (tracés pas droits : chaque point s'aimantait seul sur la grille, donc un mur pouvait finir décalé d'un cran). **Sans Maj**, un point à moins de 12 px de l'horizontale ou de la verticale du point précédent, et à moins de 5° de cette direction, est ramené exactement dessus ; la grille ne s'applique alors que **le long** de la ligne. Priorité : sommet, axe, alignement, grille ; Maj (45°) reste prioritaire ; **Alt** désactive l'alignement. Actif aussi quand on glisse un sommet d'un mur, d'une pièce ou d'une cote (voisin = point précédent). Rappels en bas de l'écran mis à jour.
- Reste de la demande (3 tâches) : B guides d'alignement dans les plans (lignes pointillées pendant le tracé), C navigation (clic molette, deux doigts, barres de défilement, mini-carte).
- Fichiers : `src/features/geometry/snapping(.test).ts` (`softAlign`), `src/components/editor/{usePolylineDrawing.ts,VertexHandles.tsx}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1874 au total, dont 9 nouveaux) — tracé à la souris à contrôler dans le navigateur
- Commit : feat: alignement doux horizontal et vertical du tracé

### 2026-11-11 — M8 · Correctifs après essai dans le navigateur
- Fait : essai réel dans Edge (même moteur que Chrome) avec un plan de test. **Cadrage de la 3D** : la caméra tient compte de la largeur du panneau (étroit et haut), le bâtiment n'est plus coupé à l'ouverture. **Traits en pointillé** retirés : les arêtes dessinées sur chaque morceau de mur se superposaient aux jonctions et aux coins ; l'allège et le linteau pénètrent de 1 mm dans les trumeaux voisins (invisible) pour supprimer les coutures. **Changer le type d'une ouverture** (Propriétés > Type) : une ouverture qui a encore la taille par défaut de son type prend celle du nouveau (fenêtre 1200 × 1000 devenue porte → 900 × 2100, au sol ; porte → fenêtre 1200 × 1000, allège 900 ; baie 2400 × 2150) ; une taille modifiée à la main est gardée, et l'ancienne taille aussi si la nouvelle ne tient pas (mur trop bas, pas de place à côté d'une voisine). Vérifié en réel : la fenêtre à 900 mm d'allège est un trou à la bonne hauteur, la porte descend au sol, un clic sur un mur en 3D le sélectionne sur le plan.
- Fichiers : `src/components/viewer3d/Viewer3DScene.tsx`, `src/features/building/wallPieces.ts`, `src/features/geometry/openingEdit(.test).ts`, `src/components/editor/OpeningFields.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (1865 au total) — contrôle visuel du changement de type à refaire dans le navigateur
- Commit : fix: cadrage 3D, coutures des murs, taille par défaut au changement de type d'ouverture

### 2026-11-11 — M8 · Panneau 3D, caméra, cube d'orientation, étage ouvert, sélection, capture
- Fait : bouton « cube » dans l'en-tête de l'éditeur (projets Plan seulement) qui ouvre / ferme le **panneau 3D** à droite du plan ; il se **redimensionne** en glissant son bord gauche (mini 280 px, il laisse toujours 640 px au plan et aux panneaux). **Scène** (`@react-three/fiber`) : murs découpés par leurs ouvertures (boîtes aux arêtes marquées), dalles sous les pièces, toit plat, sol quadrillé ; Three.js est **chargé à la première ouverture** seulement (fichier à part, l'éditeur démarre aussi vite). **Caméra orbitale** (clic gauche : tourner, molette : zoom, clic droit : déplacer), cadrage automatique sur le bâtiment à l'ouverture, bouton « Recentrer ». **Cube d'orientation** en haut à droite : faces N, E, S, O, Haut, Bas, tournées selon le **nord réglé** ; un clic sur une face recadre la vue de ce côté. **Étage ouvert** : case à cocher, affiche seulement jusqu'au niveau actif, sans toit. **Sélection** : un clic sur un mur en 3D le sélectionne sur le plan (et passe au niveau du mur) ; les murs sélectionnés sur le plan sont surlignés en 3D ; un glissement de caméra n'est pas pris pour un clic. **Capture PNG** (bouton appareil photo) : `<nom du projet> 3D.png`, sans le cube. **Fluidité** : le modèle est recalculé au plus une fois par image, la scène ne se redessine que quand quelque chose change (`frameloop="demand"`), une seule géométrie de boîte partagée par tous les murs, géométries de dalles gardées tant que le contour ne change pas. Si WebGL n'est pas disponible, un message remplace la vue sans bloquer l'éditeur.
- Fichiers : `src/components/viewer3d/{Viewer3DPanel,Viewer3DScene,OrientationCube,Viewer3DErrorBoundary,useBuildingModel}`, `src/stores/viewer3dStore.ts`, `src/features/building/{panelWidth(.test),model.test}.ts`, `src/components/editor/EditorHeader.tsx`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`, `docs/03-ROADMAP.md`
- Vérification : build ✓ lint ✓ tests ✓ (1858 au total, dont un test « 3 niveaux, 600 murs et ouvertures calculés en moins de 200 ms ») — géométrie des dalles et orientation des murs contrôlées par calcul ; **rendu, caméra, cube, clic sur un mur, capture et fluidité à contrôler dans le navigateur** (aucun test automatisé du rendu 3D)
- Commit : feat: vue 3D (panneau, caméra, cube, sélection, capture)

### 2026-11-10 — M8 · Réglage du nord et migration v4
- Fait : champ **« Nord (sens horaire depuis le haut) »** en degrés dans « Réglages du plan » (visible quand rien n'est sélectionné, projets Plan uniquement ; modifiable avec ↑ ↓, pas de 15°, Maj = ×10 ; annulable). `plan.northAngle` : 0 = le nord est en haut du plan (comme à l'écran depuis toujours) ; la valeur saisie est ramenée à 0–359 (`-90` → 270, `370` → 10). **Document en version 4** : migration v3 → v4 qui donne `northAngle = 0` à un plan (une valeur déjà présente est gardée) ; un Visuel change seulement de version ; les projets enregistrés avant s'ouvrent sans perte. Helper `cardinalDirection` (direction du plan vers N / E / S / O selon le nord) prêt pour le cube d'orientation.
- Fichiers : `src/types/document.ts`, `src/features/documents/{migrations,createProject}(.test).ts`, `src/features/building/north(.test).ts`, `src/features/persistence/LocalRepository.test.ts`, `src/components/editor/PlanSettingsSection.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (1848 au total, dont 14 nouveaux : migration v3 → v4, nord conservé, angles, directions cardinales) — champ à contrôler dans le navigateur
- Commit : feat: réglage du nord et migration du document en version 4

### 2026-11-10 — M8 · Dépendances 3D et modèle 3D (fonctions pures)
- Fait : installation de `three` 0.187, `@react-three/fiber` 9.8 (compatible React 19.3) et `@react-three/drei` 10.7, plus `@types/three` (dev), avec l'accord de l'utilisateur. **Modèle 3D neutre, sans Three.js** : `buildBuildingModel(doc, { upToLevelId? })` renvoie les morceaux de mur, les dalles / toits et l'emprise. Repère : x = x du plan, y = hauteur, z = y du plan, en mm. **Murs** : une boîte par segment ; une ouverture coupe le segment en trumeaux (pleine hauteur), allège (sous la fenêtre) et linteau (au-dessus), sans calcul booléen ; les angles intérieurs et les tracés fermés sont prolongés d'une demi-épaisseur pour boucher les coins ; une ouverture plus haute que le mur est coupée à sa hauteur. **Dalles** : sous chaque pièce, dessus à l'altitude du niveau, épaisseur du niveau vers le bas. **Toit plat** : sur les pièces du dernier niveau, seulement quand tous les niveaux sont affichés (pas de toit en vue « étage ouvert »). Éléments masqués ignorés ; un élément sans niveau est rattaché au premier niveau ; un Visuel donne un modèle vide. Chaque mur se construit séparément (`buildWallPieces`) : le panneau 3D pourra ne recalculer que les murs modifiés.
- Choix : les angles non droits sont bouchés par simple prolongement (léger dépassement possible à l'extérieur), pas par un onglet exact.
- Fichiers : `src/features/building/{types,wallPieces,model,model.test}.ts`, `package.json`, `docs/{03-ROADMAP,PROGRESS}.md`
- Vérification : build ✓ lint ✓ tests ✓ (1834 au total, dont 24 nouveaux : fenêtre de 1 200 × 1 000 mm à 900 mm d'allège = trou à la bonne hauteur, porte, angles, niveaux, étage ouvert, toit, emprise). Rien de visible à l'écran pour l'instant.
- Commit : feat: modèle 3D du bâtiment (fonctions pures)

### 2026-11-10 — M7 · Lot D · Séjour, salle à manger, chambre, rangements
- Fait : **fiches du catalogue complet générées** depuis `docs/06-BIBLIOTHEQUE.md` (392 objets : id, catégorie, taille, tailles rapides, mode de redimensionnement, miroir, pointillé, nominal, zone ; noms français et mots-clés dans `src/i18n/libraryTexts.ts`) ; limites min / max déduites (de la moitié au double, élargies aux tailles rapides ; `fixed` = une taille ; `length` = profondeur gardée) ; les éléments « au-dessus du plan de coupe » sont dessinés en pointillé, les zones en pointillé long. **Catégories ouvertes** dans le panneau : séjour et salon (29), salle à manger (18), chambre (23), rangements et entrée (16) = 86 objets. **Gabarits** : caissons (plein, plateau, tiroirs, portes, compartiments, ouvert, croix), bandeau mural, tables (rectangulaire, ronde, ovale), ronds, sièges (chaise, avec accoudoirs, fauteuil, à oreilles, fauteuil de bureau, banc), canapés droit et en L (angle ou méridienne, asymétriques : « Retourner » actif), lits (simple/double, superposé, bébé), piano droit et à queue, tapis, poêle, cheminée, plante, paravent.
- Fichiers : `src/features/library/{primitives,catalog/{specs,define,draws,index},templates/*}.ts`, `src/i18n/{libraryTexts,fr}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (862 au total : contrôles sur chaque objet — dessin dans sa boîte à toutes les tailles, avec et sans retournement)
- Commit : feat: catalogue séjour, salle à manger, chambre, rangements

### 2026-11-10 — M7 · Lot E · Cuisine, salle de bain, buanderie
- Fait : trois catégories ouvertes : **cuisine** (44 objets), **salle de bain et sanitaires** (34), **buanderie et technique domestique** (14). Gabarits : meubles de cuisine (bas, tiroirs, haut en pointillé, angle en L asymétrique, colonne), éviers (1 ou 2 bacs, égouttoir à gauche), plaques (gaz 4/5 feux, induction), cuisinière, appareils (réfrigérateurs, congélateur coffre, lave-vaisselle, cave à vin, micro-ondes, four, hotte en pointillé, lave-linge, sèche-linge, colonne, chaudière, adoucisseur, VMC), îlot, bar, péninsule, desserte ; **cuisines complètes d'un seul bloc** (kitchenette, linéaire, parallèle, en L, en L avec îlot, en U, américaine, américaine en L, américaine avec îlot-bar) : rangées de meubles le long des murs avec évier, plaque, réfrigérateur et lave-vaisselle placés proportionnellement (les cuisines en L et américaines se retournent) ; sanitaires (WC au sol / suspendu / enfant, urinoir, bidet, lavabos, meuble vasque, douches carrée / quart de rond / italienne / PMR, baignoires rectangulaire / d'angle / îlot / sabot, bain à remous, sauna, hammam, sèche-serviettes, WC PMR avec barres, barre d'appui, siège de douche, cabine de sanitaires avec débattement de porte). Correction : en mode « longueur », une taille rapide ne change plus la profondeur.
- Fichiers : `src/features/library/templates/{appliance,kitchen,bathroom}.ts`, `catalog/{draws,index,define}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1138 au total : mêmes contrôles sur chacun des 178 objets ouverts)
- Commit : feat: catalogue cuisine, salle de bain, buanderie

### 2026-11-10 — M7 · Lot F · Escaliers, circulation verticale, bureau
- Fait : deux catégories ouvertes : **escaliers et circulation verticale** (16) et **bureau et travail** (22). **Escaliers** : le nombre de marches est calculé depuis la longueur (`stairSteps` : giron ≈ 250 mm, au moins 3) ; escalier droit, quart tournant, demi-tournant, en L, en U (palier), hélicoïdal (noyau, marches en rayons, flèche en arc), échelle de meunier, rampes (rives, chevrons, flèche), ascenseurs et plateforme élévatrice (cabine, croix, seuil), escalier mécanique, gaine et trémie en zone de référence ; flèche de montée et virage dessinés ; les escaliers tournants se retournent. **Bureau** : postes avec écran et clavier (simple, direction, double, d'angle en L retournable), sièges, tables de réunion, banque d'accueil, caissons, armoire, étagère, casiers, tableau blanc (pointillé), imprimante / photocopieur, baie informatique, cabine isolée, coin détente, plante.
- Fichiers : `src/features/library/templates/{stairs,office}.ts`, `catalog/{draws,index}.ts`, `library.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1252 au total, dont le nombre de marches d'un escalier de 2 800 mm = 11)
- Commit : feat: catalogue escaliers et bureau

### 2026-11-10 — M7 · Lot G · Électricité, chauffage-ventilation-plomberie, sécurité et accessibilité
- Fait : trois catégories ouvertes : **électricité et éclairage** (24), **chauffage, ventilation, plomberie** (18), **sécurité et accessibilité** (14). **Symboles conventionnels** (non à l'échelle, taille de repérage fixe) : prises (simple, double, de sol, réseau, TV, USB), interrupteurs (simple, va-et-vient, variateur, poussoir), points lumineux, détecteur de fumée, thermostat, sonnette, interphone, borne de recharge, caméra ; sécurité : extincteur, dévidoir, déclencheur d'alarme, sortie de secours, éclairage de sécurité, défibrillateur, pharmacie, point de rassemblement, repère coupe-feu, pictogramme d'accessibilité, flèche d'évacuation. **Luminaires** à leur vraie taille (plafonnier, suspension, lustre, spot, applique, rail de spots). **Chauffage** : radiateurs (panneaux, colonne, convecteur, de sol), collecteur, climatisation (unité murale en pointillé, cassette, extérieure), pompe à chaleur, bouche de ventilation, conduit de cheminée, siphon, point d'eau, compteur, descente pluviale, panneau solaire, regard. **Zones de référence** en pointillé : cercle de manœuvre PMR (Ø 1 500), espace d'usage PMR, débattement de porte.
- Fichiers : `src/features/library/templates/tech.ts`, `catalog/{draws,index}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1423 au total)
- Commit : feat: catalogue électricité, chauffage, sécurité

### 2026-11-10 — M7 · Lot H · Extérieur et jardin, véhicules et stationnement
- Fait : deux catégories ouvertes : **extérieur et jardin** (41) et **véhicules et stationnement** (16). Extérieur : arbres feuillus, arbustes, conifère (étoile), palmier, haie, massif de fleurs, potager, pelouse / gravier / dallage (zones), bassin, piscines (rectangulaire, ronde, en L retournable), spa, mobilier de jardin, bain de soleil, parasol (pointillé), barbecue, cuisine d'été, pergola, tonnelle, abri de voiture (pointillé), abri de jardin, serre, composteur, bac à sable, citerne et fosse enterrées (zones), local poubelles, trampoline, balançoire, clôture. Véhicules (silhouettes génériques, sans marque, face avant vers le bas) : voitures, camionnette, camion, autocar, moto, scooter, vélo, vélo cargo, arceaux ; places de stationnement (standard, PMR avec pictogramme, en créneau) et quai de chargement en zones.
- Fichiers : `src/features/library/templates/{outdoor,vehicles}.ts`, `primitives.ts` (`translatePrimitives`), `catalog/{draws,index}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1594 au total)
- Commit : feat: catalogue extérieur et véhicules

### 2026-11-10 — M7 · Lot I · Commerce et bars, santé et enseignement, loisirs et sport
- Fait : trois catégories ouvertes : **commerce et restauration** (31, bars compris), **santé et enseignement** (16), **loisirs et sport** (16) ; les 392 objets du catalogue sont désormais tous proposés. **Bars** : comptoirs droit, en L, en U, courbe (arc d'ellipse) et rond (service au centre), avec bord de service en pointillé ; arrière-bar, poste de service, meuble bar, chariot, bar d'intérieur avec arrière-bar, bar de jardin, bar de piscine (îlot et tabourets), table haute avec tabourets. Commerce : caisse, gondole, vitrine, portant, cabine d'essayage avec débattement, tables et banquettes de restaurant, buffet, plan de travail et piano de cuisson professionnels, chambre froide, estrade, régie, banc d'église, fauteuil de coiffeur. Santé : lit médicalisé, tables d'examen et de massage, brancard, fauteuil roulant, fauteuil de soins, pèse-personne ; enseignement : pupitres, bureau d'enseignant, tableau, paillasse et hotte de laboratoire, rayonnage. Loisirs : tennis de table, billard, baby-foot, appareils de sport, tapis de yoga, fauteuils de cinéma, aquarium, panier d'animal, machine d'atelier, terrains (basket, tennis, football à 5, pétanque) en zones. Correction : le billard passe en proportions verrouillées (sa taille « fixe » contredisait sa taille rapide 1100 × 2200).
- Fichiers : `src/features/library/templates/venue.ts`, `catalog/{draws,index,specs}.ts`, `docs/06-BIBLIOTHEQUE.md`
- Vérification : build ✓ lint ✓ tests ✓ (1783 au total)
- Commit : feat: catalogue commerce, bars, santé, loisirs

### 2026-11-10 — M7 · Lot J · Ensembles, récents et favoris, liste du mobilier (CSV), tests globaux
- Fait : **24 ensembles** prêts à poser (table + 4 / 6 / 8 chaises, table ronde + 6, salons, chambres, poste de travail, salle de réunion, cuisines linéaire / en L / avec îlot / américaines / en U, salles de bain et d'eau, sanitaire PMR, salon de jardin, 3 places de parking, coins bars) : chaque ensemble est une liste d'objets placés et tournés (les chaises tournent le dos à la table), avec son aperçu, sa vignette dans la catégorie « Ensembles » et son **aperçu fantôme** ; poser un ensemble crée tous ses objets **en un seul pas d'historique** (annuler les retire tous), sur le niveau actif, ils deviennent la sélection et restent indépendants. **Récents** (12 derniers objets ou ensembles posés) et **Favoris** (étoile sur chaque vignette) : mémorisés dans le navigateur (localStorage, tolérant aux erreurs), jamais dans le projet. **CSV** : tableau « Mobilier et équipements » (catégorie, nom, largeur, profondeur en mm, nombre, regroupé par objet et par taille), puis deux tableaux à part pour les symboles conventionnels et les zones de référence ; le mobilier n'entre dans aucun métré (surfaces, longueurs). Les emprises annoncées dans `docs/06-BIBLIOTHEQUE.md` sont remplacées par celles calculées. Roadmap M7 : bibliothèque, panneau et liste du mobilier cochés.
- Fichiers : `src/features/library/{catalog/sets,placeSet,prefs,furnitureList,catalogGlobal.test}.ts`, `src/components/library/{LibraryPanel,SymbolPreview,useLibraryPrefs,furnitureRows}`, `src/components/editor/{EditorStage,FurnitureGhost,exportProject,MeasurementsPanel}`, `src/features/measurements/csv.ts`, `src/stores/editorStore.ts` (`addElements`), `src/i18n/{fr,libraryTexts}.ts`, `docs/{03-ROADMAP,06-BIBLIOTHEQUE}.md`
- Vérification : build ✓ lint ✓ tests ✓ (1806 au total : 392 objets comptés par catégorie, aucune marque, ensembles, récents / favoris, CSV)
- Commit : feat: ensembles, récents et favoris, liste du mobilier

### 2026-11-10 — M7 · Lot C · Panneau Bibliothèque
- Fait : panneau « Bibliothèque » complet : **recherche** sans accents ni casse (« lave vaisselle » trouve « Lave-vaisselle »), sur le nom, les mots-clés et la catégorie, tous les mots devant être trouvés, résultats classés (début du nom, nom, mot-clé, catégorie) ; **catégories** en pastilles avec le nombre d'objets (« Tous » + une par catégorie remplie) ; **vignettes** (aperçu SVG, nom, dimensions en mm). **Pose** : clic sur une vignette puis clic sur le plan (l'outil reste actif, Échap pour quitter) ou **glisser-déposer** de la vignette sur le plan ; **aperçu fantôme** translucide à taille réelle sous le curseur, aimanté à la grille. Bouton **« Retourner »** dans Propriétés pour les objets asymétriques (`mirrorable`), tailles courantes en puces (lot B). Aucun objet du catalogue de test n'est asymétrique : le bouton apparaîtra avec les premiers objets asymétriques (lot D).
- Fichiers : `src/features/library/{placement,search}(.test).ts`, `catalog/index.ts`, `src/components/library/{LibraryPanel,symbolText,dragType}`, `src/components/editor/{FurnitureGhost,FurnitureFields,EditorStage}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (613 au total) — glisser-déposer et aperçu fantôme à contrôler dans le navigateur
- Commit : feat: panneau bibliothèque (recherche, catégories, glisser-déposer)

### 2026-11-10 — M7 · Lot B · Infrastructure de la bibliothèque
- Fait : le **socle** de la bibliothèque d'objets (`docs/06-BIBLIOTHEQUE.md`). **Données** : chaque objet est décrit par un `SymbolDef` (id, catégorie, taille par défaut, tailles rapides, limites min / max, mode de redimensionnement `free` / `ratio` / `length` / `fixed`, hauteur 3D) et une fonction pure `draw(largeur, profondeur)` qui renvoie des **primitives** (rectangle, cercle, ellipse, ligne, polygone, arc) en mm. **Rendu** : le même dessin s'affiche sur le canevas (`FurnitureShape`, Konva) et en aperçu (`SymbolPreview`, SVG) ; une table de styles unique (contour, détail, pointillé « au-dessus », zone, aplat) donne les traits (épaisseur en mm sur le plan, 1 px minimum à l'écran). **Élément `furniture`** (`symbol`, `width`, `depth`, `mirrored?`) : se pose, se déplace, se pivote et se redimensionne comme un rectangle ; le redimensionnement est ramené aux règles de l'objet (`resizeSymbol` : mode, limites, mm entiers) — les poignées du transformateur suivent le mode (taille fixe : aucune ; proportions : coins ; longueur : côtés). Retournement gauche / droite prêt (`mirrorPrimitives`, deux retournements = l'original), sans bouton pour l'instant. Un objet inconnu (projet plus récent) s'affiche en cadre pointillé rouge. **Pose** : panneau « Bibliothèque » (liste simple) → clic sur un objet → clic sur le plan, centré sur le curseur et aimanté à la grille ; l'outil reste actif, `Échap` quitte. Propriétés : nom, largeur, profondeur (selon le mode), tailles courantes, X, Y, rotation, opacité. **3 objets de test** : Lit 160 × 200 (`bed-queen`), Canapé 3 places (`sofa-3`), Table ronde 4 personnes (`table-round-4`), avec leurs gabarits `bed`, `sofa` et `table`. Pas de changement de version du document (nouveau type d'élément, aucun ancien projet touché).
- Hors lot (prévu au lot C) : catégories, recherche, glisser-déposer, aperçu fantôme sous le curseur, bouton « Retourner », récents / favoris.
- Fichiers : `src/types/document.ts` (`FurnitureElement`), `src/features/library/{types,primitives,style,resize,drawing}(.test).ts`, `src/features/library/templates/{bed,sofa,table}.ts`, `src/features/library/catalog/{index,bedroom,living,dining}.ts`, `src/features/documents/{elements,properties}.ts`, `src/features/geometry/transform.ts`, `src/features/export/bounds(.test).ts`, `src/stores/editorStore(.test).ts`, `src/components/library/{LibraryPanel,SymbolPreview}.tsx`, `src/components/editor/{shapes/FurnitureShape,FurnitureFields,ElementNode,EditorStage,SelectionTransformer,PropertiesPanel,LayersPanel,ToolHint}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (603 au total, dont 33 nouveaux : primitives, redimensionnement, contrôles sur chaque objet du catalogue — dessin dans sa boîte à toutes les tailles, avec et sans retournement —, noms français, emprise, store) — rendu et interactions à contrôler dans le navigateur
- Commit : feat: socle de la bibliothèque d'objets

### 2026-11-10 — M7 · Lot A · Axes de construction
- Fait : outil **Axe** (`A`, projets Plan uniquement) : deux clics, `Maj` = angle droit, `Échap` = annuler. L'axe se dessine en trait mixte entre deux **bulles** portant le repère. **Numérotation automatique** : un axe plutôt horizontal reçoit une lettre (A, B… Z, AA…), un axe plutôt vertical un nombre (1, 2…), à la suite de la plus grande étiquette de son sens (un axe parallèle à « A, B » reçoit « C ») ; le repère se modifie dans Propriétés (4 caractères au plus). Les axes sont **communs à tous les niveaux** (jamais de `levelId`, ni à la création, ni au collage) : visibles et sélectionnables sur chaque niveau, conservés quand on supprime un niveau, absents de la copie d'un niveau. **Aimantation** : un point posé près d'un axe est ramené sur sa ligne (repère rouge), et sur le croisement de deux axes (sommet) ; la ligne d'un axe passe avant la grille, et la direction contrainte par `Maj` passe avant l'axe. Les extrémités d'un axe se déplacent à la poignée (avec aimantation), l'axe entier se déplace ; l'emprise exportée comprend les bulles. Un axe n'entre dans aucun métré.
- Choix : axes horizontaux = lettres, axes verticaux = nombres (convention courante des plans) ; la numérotation continue après la plus grande étiquette, elle ne réutilise pas un trou (A, C → D).
- Fichiers : `src/types/document.ts` (`AxisElement`), `src/features/geometry/{axes,snapping,transform}(.test).ts`, `src/features/documents/{elements,levels}.ts`, `src/features/export/bounds(.test).ts`, `src/stores/editorStore(.test).ts`, `src/components/editor/{shapes/AxisShape,ElementNode,Toolbar,ToolHint,shortcuts,useEditorShortcuts,EditorStage,usePolylineDrawing,PolylineDraftLayer,VertexHandles,PlanElementFields,PropertiesPanel,LayersPanel}`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (570 au total, dont 35 nouveaux sur les axes) — rendu et interactions à contrôler dans le navigateur
- Commit : feat: axes de construction

### 2026-11-10 — M6 · Niveaux
- Fait : un plan contient plusieurs **niveaux** (rez-de-chaussée par défaut). Panneau « Niveaux » : ajouter, renommer (double-clic), monter / descendre, dupliquer (les murs et leurs ouvertures sont copiés, pas les pièces), supprimer avec confirmation (annulable), altitude et hauteur d'étage du niveau actif. **Sélecteur de niveau** en haut du canevas, avec un interrupteur pour le niveau du dessous en **transparence** (référence : non sélectionnable, sans aimantation, absent des exports). On ne dessine, ne sélectionne, ne liste (calques) et n'aimante que sur le niveau actif ; un nouveau mur prend la hauteur d'étage. **Métrés** : tableaux du niveau actif, tableau « Bâtiment » (une ligne par niveau + total = somme des niveaux) ; **CSV** avec colonne « Niveau » et tableau des totaux par niveau et du bâtiment. Les exports PNG / JPG / PDF portent sur le niveau affiché. **Migration v2 → v3** : un plan reçoit un « Rez-de-chaussée » qui porte tous ses éléments (hauteur = ancienne hauteur de mur par défaut).
- Fichiers : `src/types/document.ts`, `src/features/documents/{levels,migrations,createProject}(.test).ts`, `src/features/measurements/{measurements,csv}.ts`, `src/stores/editorStore(.test).ts`, `src/components/editor/{LevelSelector,LevelsPanel,EditorStage,MeasurementsPanel,LayersPanel,ExportDialog,exportProject,exportStage,thumbnail,usePolylineDrawing,useOpeningTool,useCalibrationTool,useElementInteractions,importImages,PlanSettingsSection}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (535 au total, dont 32 nouveaux sur les niveaux, la migration et le CSV) — rendu et interactions (sélecteur, transparence, clic sur un mur de référence) à contrôler dans le navigateur
- Commit : feat: niveaux (étages) du plan

### 2026-11-10 — Unités « Métrique architectural » (consigne transversale)
- Fait : tout le plan s'affiche et se saisit comme dans Revit (métrique) : **longueurs en mm entiers** (`3500 mm`, `200 mm`), surfaces en m² (`12,40 m²`). Appliqué à : cotes, aperçu des murs et des ouvertures, panneau Métrés (épaisseur comprise), propriétés d'un mur / cote, réglages du plan (épaisseur, hauteur, grille en mm : 50 / 100 / 200 / 500 / 1000), barre d'échelle du PDF (`1000 mm`), export CSV (longueurs en mm, surfaces en m²), fenêtre de calibrage. Un nombre saisi sans unité vaut des mm ; `m` et `cm` restent acceptés si écrits. Les helpers `mmToM`, `mmToCm` et `formatCentimeters` sont supprimés. Règle ajoutée dans `CLAUDE.md` et `docs/02-ARCHITECTURE.md` pour toutes les prochaines tâches. Les projets déjà enregistrés ne changent pas (le stockage était déjà en mm).
- Reste à noter : les commentaires de code et la roadmap citent encore des valeurs en m / cm (ex. « 0,90 × 2,10 m ») ; les futures tâches M5 (Porte/Fenêtre) afficheront des mm.
- Fichiers : `src/features/units/format(.test).ts`, `src/features/measurements/{csv,measurements.test}.ts`, `src/components/editor/{MeasurementsPanel,PlanElementFields,PlanSettingsSection,CalibrateDialog}.tsx`, `src/i18n/fr.ts`, `src/features/export/pdf.test.ts`, `CLAUDE.md`, `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (422) — à contrôler dans le navigateur
- Commit : feat: unités Métrique architectural (mm, m²)

### 2026-11-10 — M5 · Export et calques
- Fait : **zone exportée** : l'emprise d'un plan inclut le dessin complet des ouvertures, battant et arc d'une porte compris (ils dépassent de l'épaisseur du mur) ; une ouverture masquée, ou dont le mur est masqué ou absent, ne compte pas. **Calques** : les ouvertures sont listées avec leur icône, et se renomment, se masquent et se verrouillent comme les autres éléments. **Ordre d'affichage** : une ouverture est toujours dessinée juste au-dessus de son mur, même si on l'a descendue sous lui dans les calques (sinon la découpe du mur serait cachée) ; la liste des calques, elle, garde l'ordre choisi. **Masquer un mur masque ses ouvertures.**
- Fichiers : `src/features/export/bounds(.test).ts` (`openingBounds`), `src/features/documents/layers(.test).ts` (`drawOrder`), `src/components/editor/{EditorStage,shapes/OpeningShape}.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (503 au total, dont 12 sur la zone exportée et l'ordre de dessin) — export PNG / PDF d'un plan avec porte à contrôler dans le navigateur
- Commit : feat: ouvertures dans l'export et l'ordre d'affichage

### 2026-11-10 — M5 · Métrés et CSV des ouvertures
- Fait : les métrés calculent la **surface murale nette** (brute moins les ouvertures du mur, jamais négative) : un mur de 4,00 × 2,50 m avec une porte de 0,90 × 2,10 m donne 10,00 m² brut, 1,89 m² d'ouvertures, 8,11 m² net. Une ouverture plus haute que ce qui reste au-dessus de son allège est comptée à la hauteur du mur ; une ouverture sans mur est ignorée. Le panneau Métrés affiche pour les murs : longueur, surface brute et nette (l'épaisseur n'y est plus, elle reste dans Propriétés et dans le CSV), puis un tableau des ouvertures (nom, dimensions, surface ; cliquer une ligne sélectionne l'ouverture) avec le total et le nombre de portes, fenêtres et baies. Propriétés d'un mur : surface brute, ouvertures et surface nette. CSV : colonnes brute / ouvertures / nette pour les murs, et un tableau des ouvertures (type, mur, largeur, hauteur, allège, surface) suivi du nombre de portes, fenêtres et baies, présent seulement s'il y a des ouvertures.
- Fichiers : `src/features/measurements/{measurements,csv}(.test).ts`, `src/components/editor/{MeasurementsPanel,PlanElementFields}.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (491 au total, dont 13 sur les ouvertures dans les métrés et le CSV) — ouverture du CSV dans Excel / LibreOffice à contrôler
- Commit : feat: métrés et CSV des ouvertures

### 2026-11-10 — M5 · Liens entre murs et ouvertures
- Fait : **supprimer un mur supprime ses ouvertures** (un seul état d'historique). **Dupliquer, copier ou coller un mur emmène ses ouvertures**, rattachées à la copie du mur ; une ouverture seule ne se duplique ni ne se colle (rien n'est ajouté à l'historique). **Déplacer un mur** : ses ouvertures le suivent, aussi en direct pendant le glissement. **Modifier la forme d'un mur** (glisser, ajouter ou retirer un sommet) : les ouvertures restent là où elles étaient (projetées sur le segment le plus proche, au bon segment si on ajoute un sommet), se décalent pour ne pas se chevaucher, et sont supprimées si elles ne tiennent plus ; pendant un glissement de sommet, le calcul repart du début du geste, donc une ouverture écartée un instant revient quand le mur se rallonge. Annuler restaure le mur et ses ouvertures d'un coup.
- Fichiers : `src/features/documents/wallOpenings(.test).ts`, `elements.ts` (`cloneElements`), `src/stores/editorStore(.test).ts`, `src/components/editor/useElementInteractions.ts`
- Vérification : build ✓ lint ✓ tests ✓ (478 au total, dont 29 sur ces liens) — à contrôler dans le navigateur
- Commit : feat: ouvertures liées à leur mur

### 2026-11-10 — M5 · Propriétés des ouvertures
- Fait : panneau Propriétés d'une ouverture : nom, type (porte / fenêtre / baie), largeur, hauteur, allège (fenêtre et baie), boutons « Charnière de l'autre côté » et « Ouvrir de l'autre côté » (portes), opacité, surface. Les changements de taille sont vérifiés : refusés avec un message si l'ouverture dépasserait la hauteur du mur ou ne tiendrait plus sur son segment (le centre se décale au besoin pour ne pas chevaucher une voisine) ; le champ reprend alors sa valeur. Passer en porte ou baie remet l'allège à 0 ; passer en fenêtre donne l'allège par défaut (0,90 m), réduite si elle dépasserait le mur. Taille minimale 100 mm.
- Fichiers : `src/features/geometry/openingEdit(.test).ts`, `src/components/editor/{OpeningFields,PropertiesPanel}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (449 au total, dont 15 sur les modifications) — à contrôler dans le navigateur
- Commit : feat: propriétés des ouvertures

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
- Fait : `createProjectsStore(repo)` (dépôt injecté, donc testable) et `useProjectsStore` ; actions rafraîchir, créer Visuel / Plan (renvoient l'identifiant), renommer, dupliquer (suffixe « (copie) »), supprimer. `repository.ts` : point unique de choix du dépôt (local ; Supabase en M13).
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
| D14 | Branche git | `git init -b main`. | Le déploiement automatique de M12 suit `main`. |
| D15 | Méthode | Un jalon à la fois, feu vert avant chaque jalon, même si un plan d'ensemble a été présenté. | Règle 1 de `CLAUDE.md`. |
| D16 | Outil de lint | `npm run lint` = **oxlint** (fourni par le gabarit Vite actuel), pas ESLint. | Le gabarit officiel l'utilise ; la commande reste `npm run lint`, comme dans `CLAUDE.md`. |
| D17 | Versions | Dernières versions stables à l'installation : React 19, Vite 8, TypeScript 7, Tailwind v4. `react-konva` (M1) devra être en version 19. | Règle « dernière version stable » de `docs/02-ARCHITECTURE.md`. |
| D18 | Dossier `features/documents/` | Ajouté pour la création et la duplication de projets (logique pure testée). | Ces fonctions n'entrent dans aucun dossier prévu par `docs/02-ARCHITECTURE.md`. |
| D19 | Collage entre visuel et plan | Refusé avec un message (unités px et mm incompatibles). | La roadmap ne le précise pas ; une conversion automatique n'aurait pas de sens. |
| D20 | Polices (M2) | 6 polices système uniquement (Arial, Georgia, Times New Roman, Courier New, Verdana, Trebuchet MS), sans dépendance. | Choix de l'utilisateur (option A). |
| D21 | Éléments masqués et métrés | Les murs et pièces masqués sont comptés dans les métrés. | Masquer ne change que l'affichage ; le métré décrit la géométrie du document. |
| D22 | Contrainte d'angle (Maj) | Le point est la projection du curseur sur la direction autorisée (multiples de 45°), pas un point à la même distance. | Le point reste aligné avec le curseur : plus naturel, et exact sur les axes. |
| D23 | Aimantation sur les faces de murs | On s'aimante aussi aux croisements des faces de murs différents (angles intérieurs). | Quatre murs séparés n'ont pas de sommet à leur angle intérieur : sans cela le critère 10,64 m² serait inatteignable. |
| D24 | Phase « Bâtiment » | Ouvertures (M5), niveaux (M6), axes et mobilier (M7), 3D (M8), façades / coupes / planche (M10), import-export DXF / glTF et partage (M11) ajoutés **après le MVP** ; collaboration renumérotée M14 ; IA reportée. Dépendances 3D et DXF à confirmer au début de leur jalon. | Demande de l'utilisateur (capture d'un outil de bâtiment, 2026-11-10) ; le MVP reste inchangé pour être mis en ligne d'abord. |
| D25 | Ordre des jalons | La phase « Bâtiment » passe **avant** la mise en ligne et les comptes : M5 Ouvertures, M6 Niveaux, M7 Axes et mobilier, M8 3D, M10 Façades et coupes, M11 Import et export, M12 Mise en ligne, M13 Comptes, cloud et partage (fin du MVP), M14 Collaboration. Le partage par lien passe en M13 car il a besoin de Supabase. Remplace l'ordre de D24. | Demande de l'utilisateur (2026-11-10). |

### 2026-11-10 — Bibliothèque d'objets

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D26 | Bibliothèque d'objets (M7) | Pas d'import des familles Revit (`.rfa`, format fermé, licences Autodesk et fabricants). Bibliothèque **propre à Fabrics**, dessinée en « clean room » (règle ajoutée dans `CLAUDE.md`) et **riche** (nombreuses catégories, voir M7). Un import de symboles SVG / DXF par l'utilisateur reste une idée pour plus tard. | Demande de l'utilisateur (2026-11-10) ; licences ; un plan 2D n'a besoin que d'un symbole et de dimensions. À réaliser en M7, après M6. |
| D30 | Catalogue de M7 | Spécifié à l'avance dans `docs/06-BIBLIOTHEQUE.md` : 392 objets en 17 catégories + 24 ensembles (cuisines complètes américaine / en L / en U et bars ajoutés à la demande de l'utilisateur), gabarits de dessin, format de données, tests, 10 lots (A à J). Symboles décrits par des **données** (`features/library/`, fonctions pures) et non par des composants Konva écrits un à un ; `FurnitureElement` gagne `mirrored?`. `docs/02-ARCHITECTURE.md` mis à jour en conséquence (il remplace la mention `components/editor/symbols/`). | Demande de l'utilisateur (2026-11-10) : préparer M7 pour n'avoir plus qu'à exécuter ; un catalogue de cette taille n'est maintenable qu'avec des gabarits testables. |

### 2026-11-10 — Niveaux (M6)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D27 | Hauteur des murs | La hauteur d'un nouveau mur est celle du **niveau actif** (défaut 2 700 mm). Le réglage « Hauteur des murs » disparaît des réglages du plan ; `defaultWallHeight` reste dans le modèle pour les anciens projets (sert de hauteur au rez-de-chaussée migré). | Roadmap M6 : « les nouveaux murs prennent la hauteur d'étage par défaut » ; évite deux réglages concurrents. |
| D28 | Ordre et altitudes | Niveaux triés par altitude. Monter / descendre un niveau recalcule les altitudes à partir du plus bas ; modifier une altitude retrie la liste. | L'ordre réordonné et les altitudes doivent rester cohérents (3D en M8). |
| D29 | Niveau actif et référence | Niveau actif et interrupteur « niveau inférieur » sont des états d'interface (hors historique et hors document). | Changer d'étage n'est pas une modification du plan. |
| D30 | Éléments sans niveau | Un élément sans `levelId` est commun à tous les niveaux (axes de M7) et n'entre dans les métrés d'aucun niveau. | Évite le double comptage ; totaux = somme des niveaux. |
| D31 | Exports d'un plan | PNG, JPG et PDF portent sur le niveau affiché ; le CSV couvre tout le bâtiment. | La roadmap ne précise que le CSV ; une planche multi-niveaux arrive en M10. |

## Idées (hors jalon en cours)

<!-- Demandes de l'utilisateur ou idées de Claude à prioriser plus tard. -->
- Hachures et textures dans les façades et coupes : jalon à prévoir après M10 (demande de l'utilisateur le 2026-11-11 ; M10 = faces blanches, contour noir).
- Toitures (versants, débords) en 3D, façades et coupes : jalon à prévoir après M10 (demande de l'utilisateur le 2026-11-11 ; M10 garde le toit plat).
- ~~Redimensionner une pièce préfabriquée d'un bloc~~ : fait (hors jalon I, option A).
- Glisser un seul mur à la poignée (option A) : poignée au milieu d'un segment droit, le mur se déplace perpendiculairement, les voisins s'allongent et la pièce suit ; réutilise `stretchZone` (demande de l'utilisateur le 2026-11-11, après l'option C).
- Recherche de projets sur l'accueil (prévue dans la maquette de `docs/01-PRODUIT.md`, mais absente de la liste de tâches de M1).
- Grille et aimantation sur grille pour les Visuels (réglage en px dans le document).
- Calcul automatique de la surface intérieure d'une pièce (déduction de l'épaisseur des murs).
- Aimantation des murs et des sommets sur ceux du niveau de référence (aligner un étage sur celui du dessous) : utile après M6, pas dans le jalon.
- ~~Pivoter un objet de 90° au clavier~~ : fait, `Maj + R` (décidé par l'utilisateur).
- Assistant IA « Demander quelque chose » : reporté à la demande de l'utilisateur (après M14, à rediscuter).
- Bibliothèque (voir `docs/06-BIBLIOTHEQUE.md`, section 10), hors M7 : pose des objets contre un mur (aimantation), hauteurs 3D des objets (M8), import de symboles SVG / DXF par l'utilisateur, bibliothèque personnelle (ensembles enregistrés), niveau de détail « détaillé », étiquettes de cote automatiques, variantes de style, annotations de plan (flèche du nord, repère de niveau).
