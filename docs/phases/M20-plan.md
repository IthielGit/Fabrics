# M20 — Plan des sous-lots

Décisions : `docs/phases/M20-decisions.md` (20.0, 2026-11-21).

## 20.1a — Plan de niveau lié au modèle (feuille RDC de Villa ROOMIT)

Proposé le 2026-11-21, **feu vert de l'utilisateur le 2026-11-21**. Modèle : `/model opus`.

D'après D20-5 (plans de niveau d'abord), le sous-lot 20.1 est découpé : **20.1a** plan de niveau
(RDC), **20.1b** plan de toiture et R+1, **20.1c** coupes et façades branchées sur la scène Pascal.
Le gabarit de feuille Villa ROOMIT reste en 20.4 ; en 20.1a, le plan est posé sur la feuille A2
actuelle de Fabrics.

### État des lieux

| Ce qui existe | Où | Limite |
|---|---|---|
| Plan de niveau de Fabrics (murs coupés à 1 m, symboles de portes et fenêtres, hachures), cotes Client / Exécution (3 chaînes, `PP` / `All.`), planche, façades, coupes, PDF vectoriel (jsPDF), cartouche | `src/features/building/views/`, `src/features/dimensioning/`, `src/features/export/` | Lit la scène par `scene/view/toFabricsView.ts`, qui **ignore le mobilier natif de Pascal** (objets du catalogue) |
| Plan 2D de Pascal (ce que l'on voit dans l'éditeur, mobilier compris), export PDF vectoriel (pdfkit, polices Liberation Sans intégrées), géométrie de feuille sans interface (`collectSheetGeometry`, `exportSheetsToPdf`), nomenclatures (`schedules.ts`) | `packages/pascal/packages/editor/src/lib/floorplan/` | Pas de façades ni de coupes ; cotes et repères à l'américaine ; types « fondations », « plafond », « toiture » déclarés mais non dessinés |

Garder les deux ferait **deux moteurs de dessin et deux bibliothèques PDF** (interdit sans ADR,
`docs/capabilities.md` : « Mise en page, feuilles, cartouche : à décider M20 »).

### Tâches

1. **[fait le 2026-11-21]** **Exemple ROOMIT-RDC** (`fixtures/ROOMIT-RDC/`) : le RDC de la page 5 saisi dans une scène Pascal
   en mm (murs, poteaux, portes, fenêtres, pièces, escalier, quelques meubles), et les surfaces du
   tableau « Pièces Niveau RDC » comme valeurs attendues (écart toléré à fixer avec vous : la
   référence ne dit pas si ses surfaces sont au nu brut ou fini). Les cotes en cm de la référence
   sont converties en mm. Fichiers : `fixtures/ROOMIT-RDC/scene.json`, `spec.json`, `README.md`,
   test `src/features/scene/migrate/fixtures.test.ts` (étendu).
2. **[fait le 2026-11-21 : moteur de Fabrics choisi, ADR 0007]** **Essai des deux moteurs** sur cet exemple : plan RDC à 1:50 dessiné par Fabrics et par Pascal,
   deux PDF et une capture côte à côte avec la page 5. Rapport `docs/phases/M20-engine-trial.md`,
   **vous choisissez**, puis ADR `docs/adr/0007-sheet-engine.md` et mise à jour de
   `docs/capabilities.md`. Code d'essai jeté après le choix.
3. **[fait le 2026-11-21 ; étiquettes, repères et cotes intérieures selon D20-9, rendu accepté par l'utilisateur le 2026-11-22]** **Plan de niveau complet avec le moteur choisi**, tout lu dans la scène Pascal : murs coupés
   hachurés, poteaux pleins, portes (battant et arc), fenêtres, escalier, mobilier, nom et surface
   de chaque pièce (venus des métrés), repères `PP: 90 x 210` et `All. 1100`, 3 chaînes de cotes
   extérieures et cotes intérieures (Exécution), le tout en mm. Fichiers prévus (moteur Fabrics) :
   `scene/view/toFabricsView.ts` (mobilier natif), `building/views/drawing.ts`,
   `dimensioning/executionDimensions.ts`, `dimensioning/planMarks.ts` ; ou (moteur Pascal) un module
   `src/features/sheets/` qui ajoute les cotes et repères de Fabrics à la géométrie de Pascal,
   `packages/pascal/FABRICS_CHANGES.md`.
4. **[fait le 2026-11-22 : `src/features/scene/modelLink.test.ts`, cloison SDB_G de ROOMIT-RDC avancée
   de 500 mm dans Pascal : cote SDB 1475 → 975 mm, SDB 6,47 → 4,28 m², Séjour 36,18 → 38,37 m² ;
   aucun code à changer]** **Lien au modèle** : changer un mur dans Pascal met le plan à jour (test : mur de 4000 à 5000 mm,
   la cote et la surface de la pièce suivent) ; aucune donnée de plan enregistrée à part.
5. **[test fait le 2026-11-22 : `src/features/export/printScale.test.ts` ; impression par l'utilisateur à faire]** **Exactitude imprimée** : test qui lit le PDF produit : à 1:50, 1000 mm = 20,0 mm sur la feuille
   (écart ≤ 0,1 mm) ; impression à 100 % par vous.
6. Suivi : roadmap, `PROGRESS.md`, `docs/regression-checklist.md`, `npm run check:all`.

### Critères d'acceptation (20.1a)

- La feuille RDC de l'exemple se compare à la page 5 : mêmes éléments dessinés, mêmes cotes (en mm),
  mêmes surfaces de pièces (à l'écart toléré près)
- Modifier un mur met à jour le plan, ses cotes et les surfaces sans autre action
- Imprimée à 100 % à 1:50, une cote de 4500 mm mesure 90 mm à la règle
- Aucune longueur en m ni en cm, aucun texte en anglais

## 20.1b — Plan de niveau R+1 et plan de toiture (feuilles 06 et 07 de Villa ROOMIT)

Proposé le 2026-11-22, **feu vert de l'utilisateur le 2026-11-22** (D20-10 : A, D20-11 : A). **Fait le 2026-11-22** (essai final dans le navigateur à la fin de M20). Modèle : `/model opus`.
Référence : `Villa ROOMIT_B.pdf`, pages 6 (plan de niveau R+1, n° 06) et 7 (plan de toiture, n° 07), A2 1:50.
Les cotes de la référence sont en cm : elles deviennent des mm (450 cm = 4500 mm).

### Ce que montre la référence

- **Page 6, R+1** : 11 pièces (BAR, Dressing, Chambre 3, SDB 2, SDB 1, Chambre 2, Balcon, Suite
  parentale, SDB 3, Bibliothèque, Dégagement), leurs surfaces, et un total « Niveau R+1 » de **144,16 m²**.
  La somme des 11 lignes donne 144,17 m² (arrondi). **Le total inclut le balcon (18,63 m²).**
  Escalier vers le R+1 dans la bibliothèque ; cotes extérieures sur trois côtés ; repères `PP`, `All.`.
- **Page 7, toiture** : contour de la toiture avec un débord (double trait), trois chaînes de cotes,
  un escalier d'accès au toit (marches dessinées, côté est), et deux flèches « Pente 1 % » indiquant
  le sens d'écoulement. Le plan de toiture ne contient ni pièces ni surfaces.

### Ce qui existe déjà

| Ce qui existe | Où | Limite pour 20.1b |
|---|---|---|
| Plan de niveau complet (murs hachurés, portes, fenêtres, mobilier, noms et surfaces, cotes, repères) et sélection de niveau | `src/features/building/views/`, `src/features/dimensioning/`, `src/features/scene/view/toFabricsView.ts` | Déjà fait en 20.1a pour le RDC ; à vérifier sur un deuxième niveau |
| Toitures natives de Pascal, lues dans les métrés (pente, surface réelle, faîtages, arêtiers) | `src/features/scene/roofQuantities.ts`, `view/pascalQuantities.ts`, `migrate/roofStairNodes.ts` (B6) | Les métrés les lisent ; **le dessin en plan de toiture n'existe pas** |
| Escalier natif de Pascal dans les plans de niveau | 20.1a étape 3 (ADR 0007) | Escalier d'accès au toit : à vérifier (escalier de toit ou simple élément) |
| Symboles de pente et flèches | — | **À créer** |

### Tâches

1. **[fait le 2026-11-22 : 7 pièces sur 11 identiques, total 144,36 m² pour 144,16 ; SDB 1 et 2 +0,09 m² (cloison de douche non déduite par Pascal, à trancher), BAR −0,01 (arrondi), Bibliothèque +0,02 ; toiture reportée à la tâche 4]** **Exemple ROOMIT-R1** (`fixtures/ROOMIT-R1/`) : scène Pascal du R+1 saisie au mm (murs, poteaux,
   portes, fenêtres, escalier, pièces, mobilier, balcon, toiture avec ses pentes), sur le modèle de
   `fixtures/ROOMIT-RDC`. Valeurs attendues : les 11 surfaces de la page 6 et le total 144,16 m².
   Test : `src/features/scene/roomitR1.test.ts` (sur le modèle de `roomit.test.ts`).
2. **[fait le 2026-11-22 : onglet « Plan de niveau … » par niveau dans l'écran Vues (PDF d'un niveau seul) ; escalier du RDC dessiné sur le R+1 ; scène à deux niveaux `fixtureBuildingScene`, test `scene/roomitBuilding.test.ts`]** **Plan de niveau R+1** : même chaîne que le RDC (20.1a). Sélection du niveau R+1 dans la vue
   de la feuille. Contrôle : mêmes éléments, mêmes cotes, mêmes repères que la page 6.
3. **[fait le 2026-11-22 : `building/views/areaTable.ts`, à droite du plan dans l'onglet « Plan de niveau … » et son PDF ; total dans un second tableau « Total Niveau R+1 »]** **Tableau de surfaces sur la feuille** : un tableau « Pièces Niveau R+1 » (pièce, surface) et un
   total, lus des métrés. Format de la référence (D20-3, colonne droite). Le tableau du RDC sera
   réutilisé (20.4 le place sur le gabarit final).
4. **[4a fait le 2026-11-22 : toiture native de Pascal (4 pans à 1 %, débord 300 mm) et escalier d'accès sur le balcon ajoutés à ROOMIT-R1 (`roofs`, `stairs`), tests dans `scene/roomitBuilding.test.ts` ; 4b fait le 2026-11-22 : onglet « Plan de toiture … » de l'écran Vues, contour réuni des pans en double trait (bord de 100 mm), une flèche « Pente x % » par sens de pente lue dans les pans, escalier d'accès (`building/views/roofPlan.ts`, `scene/view/roofPlanData.ts`) ; 4c fait le 2026-11-22 : chaînes extérieures (une chaîne qui suit les redents + la cote d'ensemble, de chaque côté, `dimensioning/roofChains.ts`), identiques à la page 7 ; cotes intérieures de la page 7 (450 · 758, 510 · 698 · 279, 1021…) non reprises ; à régler à la tâche 5 : les débords des pans se chevauchent aux jonctions (surfaces à prendre sur la réunion des pans, pas sur leur somme)]** **Plan de toiture** (nouveau) : contour de la toiture à partir des pans Pascal (projection en
   plan), débord de toiture, trois chaînes de cotes extérieures, escalier d'accès au toit (même
   symbole que l'escalier du plan de niveau), **flèches « Pente x % »** (valeur lue dans le modèle,
   jamais saisie à la main). Pas de pièces ni de surfaces sur ce plan.
5. **[fait le 2026-11-22 : case « Afficher les surfaces de toiture » dans l'onglet Plan de toiture ; tableau `roofAreaTable` (pans, surface réelle, surface en plan, égouts, périmètre) lu dans les métrés ; métrés d'une toiture de plusieurs pans comptés sur la réunion des pans, D20-15 : A, `scene/roofUnion.ts`]** **Surfaces et périmètres de toiture** : la surface réelle de chaque pan (surface en plan × √(1 + pente²))
   est affichée sur la feuille de toiture **seulement si** l'utilisateur le demande (D20-10).
   Reprise de `roofQuantities.ts`, sans nouveau calcul.
6. **[fait le 2026-11-22 : `scene/roofModelLink.test.ts` : pente 1 → 2 % (flèches), débord 300 → 400 mm (cote d'ensemble 15072 → 15272 mm, surface en plan), rien d'enregistré hors de la scène ; aucun code à changer]** **Lien au modèle** : déplacer un débord ou changer la pente dans Pascal met à jour le plan de
   toiture (cotes, flèches) sans autre action. Test automatisé.
7. **[fait le 2026-11-22 : `export/printScaleR1.test.ts` (lecture du PDF : tous les traits du R+1 et de la toiture à ≤ 0,1 mm à 1:50 ; toiture aussi à 1:100 sur A3 et 1:200 sur A4) ; aide commune `export/printedPdf.ts`]** **Exactitude imprimée** : à 1:50, les cotes des pages 6 et 7 se mesurent à la règle comme sur la
   référence (écart ≤ 0,1 mm, test de `printScale` étendu).
8. **[fait le 2026-11-22 ; `check:all` et essai dans le navigateur reportés à la fin de M20, demande de l'utilisateur]** **Suivi** : roadmap (20.1b), `PROGRESS.md`, `docs/regression-checklist.md`, `npm run check:all`,
   `packages/pascal/FABRICS_CHANGES.md` si un fichier de Pascal est touché (règle E-001 de Pascal).

### Constats avant la tâche 4 (2026-11-22)

- **Relevé de la page 7** (même méthode que les pages 5 et 6) : la toiture est le contour du R+1
  **sans le balcon**, agrandi d'un **débord de 300 mm** de tous les côtés (largeur 14472 + 2 × 300 =
  15072 mm, cote `1507`). Le double trait est un bord de 100 mm d'épaisseur (acrotère ou rive).
  L'escalier d'accès est posé **sur le balcon** : droit, environ 2340 mm de large, 14 marches sur
  6390 mm, du bas du balcon jusqu'au bord de la toiture. Deux flèches « Pente 1 % » : une vers
  l'ouest (partie sud du toit), une vers le nord (partie nord).
- **Pente lisible** : oui, `pitch` des pans de Pascal (degrés, 0 à 75°). 1 % = 0,573°.
- **Pente faible** : les métrés de Pascal (`roofQuantities`) acceptent 0,573° sans erreur
  (surface réelle = surface en plan × 1,00005). Mais **la toiture de Fabrics refuse un toit en pente
  sous 1°** (`MIN_PITCH`) : à 1 %, elle n'existe qu'en toiture plate, sans pente.
- **Contour en L à redents** : un pan de Pascal est un rectangle ; il faut 4 pans réunis dans une
  toiture. Fabrics ne sait aujourd'hui lire qu'une toiture d'un seul pan (`roofFromPascal`) : ses
  façades et coupes ne verraient pas cette toiture (à traiter en 20.1c).
- Décision : **D20-13 : A** (ci-dessous).

### Points à vérifier avant de coder (inconnus pour l'instant)

- La pente d'un toit Pascal est-elle un champ lisible (pente en degrés, `pitch` dans `roofQuantities`) ?
  Si oui, « Pente 1 % » se calcule à partir de lui. Si non, à modéliser avant le dessin.
- Le toit de la référence est presque plat (1 %) : vérifier que les toitures Pascal supportent une
  pente aussi faible sans erreur de maillage ni de métré.
- Escalier d'accès au toit : escalier natif de Pascal (D20-11 : A). Vérifier comment le poser au niveau du toit.
- Lecture des cotes : les cotes intermédiaires de la page 6 (172, 230, 506…) doivent se retrouver
  exactement dans la scène ROOMIT-R1 ; un écart de 1 cm sera noté dans le rapport.

### Décisions (retenues le 2026-11-22 : D20-10 A, D20-11 A, détail dans `M20-decisions.md`)

- **D20-10 · Balcon et surfaces de toiture**
  - **A (retenue)** : le total du niveau reprend la référence (balcon inclus, 144,16 m²) et les
    surfaces de toiture ne sont affichées que sur demande.
  - B : total « surface habitable » sans balcon (cohérent avec la surface habitable de Fabrics, M11 quinquies),
    balcon listé à part.
- **D20-11 · Escalier d'accès au toit**
  - **A (retenue)** : escalier natif de Pascal, dessiné avec le même symbole que l'escalier du niveau.
  - B : simple symbole de plan, sans géométrie 3D.

- **D20-13 · Modèle de la toiture à 1 % — retenu : A (2026-11-22)**
  - **A (retenue)** : toiture **native de Pascal**, 4 pans « un pan » de 1 % (0,573°), débord
    300 mm. Partie nord pente vers le nord, partie sud vers l'ouest. Le plan de toiture dessine le
    contour, les cotes et une flèche par sens de pente, tout lu dans les pans. La 3D de Pascal montre la
    vraie pente. Les façades et coupes de Fabrics la liront en 20.1c.
  - B : **toiture plate** de Fabrics (toiture-terrasse) avec un réglage « pente d'écoulement » (%) et
    son sens, gardé dans le modèle. Façades et coupes la voient tout de suite, la 3D reste plate.
    Il faut ajouter ce réglage au modèle.

### Critères d'acceptation (20.1b)

- La feuille R+1 se compare à la page 6 : mêmes éléments, mêmes cotes en mm, mêmes surfaces, total 144,16 m²
  (à l'écart toléré près).
- La feuille de toiture se compare à la page 7 : même contour, mêmes chaînes de cotes, escalier d'accès,
  flèches de pente avec la valeur du modèle.
- Modifier un mur, un débord ou une pente dans Pascal met à jour les plans sans autre action.
- Imprimé à 100 % à 1:50, une cote de 4500 mm mesure 90 mm à la règle.
- Aucune longueur en m ou cm, aucun texte en anglais.

## 20.1c — Coupes et façades branchées sur la scène Pascal

Fait le 2026-11-22 (demande de l'utilisateur : tout M20, essai dans le navigateur à la fin).

- **Constat** : les façades, coupes et la planche de Fabrics lisent déjà la scène (M18, `toFabricsView`).
  Il manquait les toitures de Pascal que Fabrics ne sait pas reprendre (plusieurs pans, pente sous 1°) :
  invisibles en façade et en coupe, et les pièces dessous recevaient un toit plat automatique.
- **Fait** : `scene/view/nativeRoofs.ts` dérive un élément de toiture par pan (`nativeRoofs` de la vue :
  jamais enregistré, jamais compté dans les métrés, qui gardent les quantités de Pascal). Le modèle du
  bâtiment les construit (`computeRoof` accepte toute pente > 0 pour elles) et elles couvrent leurs pièces.
- Coupe : une seule cote « Faîtage » pour des faîtages à moins de 300 mm l'un de l'autre (pans voisins).
- Tests : `scene/roomitViews.test.ts` (façade sud et coupe A–A de ROOMIT avec la toiture ; critère G3 :
  étage de 2500 mm = 50,0 mm sur une façade imprimée à 1:50, PDF relu).
- Limite : les escaliers de Pascal que Fabrics ne sait pas reprendre (hélicoïdaux…) ne sont pas dessinés en
  coupe ; détails (1:20, 1:10) : pas de vue de détail, noté pour 20.9.

## 20.2 — Annotations

Fait le 2026-11-22. Déjà en place avant 20.2 : cotes chaînées (M10 ter, `facadeChains`), repères des
baies `PP` / `All.` et noms + surfaces des pièces (D20-9), nord (cartouche, `planMarks`), cotes du plan
de toiture (20.1b).

- **Conflits d'annotations** (critère G3) : `dimensioning/conflicts.ts` détecte deux textes qui se
  recouvrent **à leur taille imprimée** (`export/printedText.ts` : 7 pt, 10 pt en gras). Sur ROOMIT,
  4 conflits trouvés, tous corrigés :
  - nom de pièce contre chiffre d'une cote intérieure : le nom (gras) était imprimé 1,4 fois plus grand
    que prévu par le placement ; il est maintenant dessiné à cette taille et placé en conséquence
    (`LABEL_TITLE_EM`, `layout.ts`) ;
  - chiffre contre chiffre : un chiffre qui touche un chiffre déjà placé prend un autre rang
    (`annotationGraphics.ts`).
- **Défaut du PDF corrigé** : jsPDF décalait les textes tournés centrés (cotes verticales) d'une
  demi-longueur ; le centrage est fait par Fabrics (`pdf.ts`).
- **Axes** du quadrillage porteur sur les feuilles de l'écran Vues : trait mixte, bulles et repères
  (`dimensioning/axes.ts`, `sheetPlanOverlay`). L'éditeur, l'export d'image et le DXF les dessinaient déjà.
- **Légende des hachures** sous le tableau des surfaces du plan de niveau (`building/views/legend.ts`).
- Tests : `dimensioning/conflicts.test.ts`, `scene/roomitAnnotations.test.ts` (0 conflit : RDC et R+1 en
  Client et Exécution, plan de toiture, à 1:50), `dimensioning/axes.test.ts`, `building/views/legend.test.ts`.
- Limites : un texte qui recouvre un trait (repère sur un mur) n'est pas compté comme conflit critique ;
  symboles de plan (flèche de montée d'escalier, repères de coupe sur le plan) non ajoutés.

## 20.3 — Nomenclatures et plans dérivés

Fait le 2026-11-22.

- **Onglet « Nomenclatures »** de l'écran Vues (`building/views/schedule.ts`) : nomenclature des
  menuiseries (une ligne par type identique : genre et style, L x H, allège, quantité, repères `P01`…,
  niveaux) et nomenclature des pièces (niveau, surface, hauteur sous plafond, faux plafond). Tout vient des
  métrés (repères compris) ; PDF comme les autres vues.
- **Onglet « Plan de plafond … »** par niveau (`dimensioning/ceilingPlan.ts`) : murs du niveau, nom de
  chaque pièce, « HSP 2880 » et « Faux plafond », sans mobilier ni escalier.
- Plan de toiture : fait en 20.1b.
- Tests : `scene/roomitSchedules.test.ts` (ROOMIT : 9 fenêtres 1500 x 1000 allège 1100 sur une ligne,
  « RDC, R+1 » ; 23 pièces ; « HSP 2880 » sur les 11 pièces du R+1 ; aucun conflit de texte).
- Limites : pas de nomenclature des murs ni des équipements ; le plan de plafond ne dessine pas de
  calepinage ni de luminaires (pas dans le modèle).

## 20.4 — Feuilles

Fait le 2026-11-22 (D20-3 : A, gabarit de Villa ROOMIT).

- **Gabarit « colonne »** pour tous les PDF de l'écran Vues (`export/pdfLayout.ts`, `export/pdf.ts`) :
  cadre, colonne de droite (13 % de la largeur, entre 50 et 90 mm) avec le **type de plan** souligné
  (« PLAN DE NIVEAU »…), la **rose des vents** orientée selon le nord du projet, les **tableaux** de la
  feuille (surfaces, légende, surfaces de toiture) à l'échelle du plan, l'échelle graphique, la note sur les
  baies, et le **cartouche** : projet, émetteur, titre, puis N° de plan / Indice, Date / Statut,
  Échelle / Format. Le gabarit « bande » (M10) reste pour les exports de l'éditeur.
- Formats **A4, A3, A2, A1**, portrait ou paysage ; **A2 paysage par défaut**.
- Fenêtre « Exporter en PDF » : saisie de l'émetteur, du n° de plan, de l'indice et du **statut** (Esquisse,
  APS, APD, PC, DCE, EXE), gardés pendant la session (`viewsStore.sheetInfo`) ; à garder par version en 20.7.
- Le plan de niveau et le plan de toiture posent leurs tableaux dans la colonne (`parts` de la vue) ;
  à l'écran, ils restent à droite du plan.
- Tests : `export/sheetTemplate.test.ts` (mise en page, cellules du cartouche, feuille R+1 de ROOMIT relue
  dans le PDF : tous les traits à ≤ 0,1 mm, textes du cartouche et de la colonne).
- Limites : pas de logo d'émetteur ; renseignements du cartouche non enregistrés dans le projet (20.7).

## 20.5 — Styles graphiques

Fait le 2026-11-22. Choix proposés par Claude, validé le 2026-11-23 (D20-16).

- **Épaisseurs imprimées selon l'échelle** (`building/views/graphicStyles.ts`, `lineWeights`), série ISO 128,
  une seule table pour tous les PDF de l'écran Vues :
  | Échelle | Coupé | Vu | Filet | Hachure | Sol |
  |---|---|---|---|---|---|
  | 1:50 et plus grand (1:20, 1:10) | 0,5 | 0,25 | 0,13 | 0,1 | 0,7 |
  | 1:100 | 0,35 | 0,18 | 0,13 | 0,08 | 0,5 |
  | 1:200 et plus petit | 0,25 | 0,13 | 0,1 | 0,07 | 0,35 |
  « Ajuster à la page » prend la tranche la plus proche. L'écran garde ses épaisseurs en pixels, dans les mêmes rapports.
- **Éléments coupés et vus** : murs et poteaux coupés en trait « coupé » (noir plein ou hachuré), menuiseries,
  mobilier et escaliers en trait « vu », éléments au-dessus de la coupe en pointillé fin (inchangé, maintenant
  imprimé selon la table).
- **Catégories (calques)** sur chaque trait, fond et texte des plans : murs, poteaux, portes et fenêtres,
  escaliers, mobilier, pièces, cotes, repères, axes ; les hachures se masquent à part. Sols et découpes des
  ouvertures restent toujours.
- **Visibilité** : cases « Visibilité » au-dessus des plans de niveau, de plafond, de toiture et de la planche ;
  ce qui est décoché disparaît à l'écran **et** dans le PDF (`applyVisibility`). Réglage gardé pendant la session.
- **Masques** : fond blanc sous les noms et surfaces des pièces, qui cache le mobilier dessous (écran et PDF).
  Pas de masque sous les repères de portes et fenêtres : posés contre les murs, ils mordraient sur leur trait.
- Tests : `building/views/graphicStyles.test.ts` (table, catégories du plan R+1 de ROOMIT, visibilité de
  chaque catégorie, hachures, masques, épaisseurs relues dans le PDF à 1:50 et 1:100).
- Limites : façades et coupes sans catégories ni cases « Visibilité » ;
  réglage de visibilité commun à toutes les vues, non enregistré dans le projet ; calques des fichiers
  vectoriels (groupes par catégorie) avec l'export SVG de 20.6.

## 20.6 — PDF et SVG à l'échelle

Fait le 2026-11-22. Choix proposés par Claude, validé le 2026-11-23 (D20-17).

- **Polices intégrées au PDF** (`export/pdfFonts.ts`) : **Liberation Sans** normal et gras (SIL OFL 1.1, fichiers
  livrés avec Pascal, notice déjà dans `THIRD_PARTY_NOTICES.md`), intégrée en sous-ensemble (environ +27 Ko
  sur la feuille R+1). Mêmes chasses qu'Helvetica et Arial : mises en page et détection des conflits
  inchangées. Le PDF ne déclare plus que les polices employées (`putOnlyUsedFonts`). Si les fichiers ne se
  chargent pas, la feuille garde Helvetica. Les notes en italique s'écrivent en romain (pas de fichier italique).
- **Export SVG** (`export/svg.ts`, bouton « Exporter en SVG » de la fenêtre d'export) : le **dessin seul, à
  l'échelle choisie** (taille du papier en mm : 1:50 → 1000 mm = 20 mm), sans cadre ni cartouche, avec les
  épaisseurs de la table de 20.5, les tailles de texte imprimées et les masques du PDF. **Calques par
  catégorie** (Murs, Cotes, Mobilier…, « Fond » pour le reste), lus comme calques par Inkscape.
- Les PDF de feuilles restent vectoriels (jsPDF) ; leur exactitude à 1:50, 1:100 et 1:200 est vérifiée
  depuis 20.1b (`printScale*.test.ts`, `sheetTemplate.test.ts`), et l'est encore avec la police intégrée.
- Tests : `export/vectorOutput.test.ts` (SVG à 1:50, 1:100, 1:200 : taille du papier, chaque trait à sa
  place à 0,01 mm, épaisseurs ; calques ; PDF : Liberation Sans seule police, intégrée ; repli Helvetica).
- Limites : SVG sans cartouche (la feuille complète est le PDF) ; police non intégrée dans le SVG
  (Liberation Sans, Arial ou Helvetica du poste) ; PDF des métrés (M12) inchangé, en Helvetica.

## 20.7 — Révisions

Fait le 2026-11-22. Choix proposés par Claude, validé le 2026-11-23 (D20-18).

- **Jeu de feuilles** (`features/sheets/sheetSet.ts`) : toutes les feuilles du projet dans l'ordre d'un dossier
  de plans (plans de niveau du plus bas au plus haut, toitures, plafonds, façades N, E, S, O, coupes,
  nomenclatures, planche), **numérotées automatiquement** 01, 02… ; un n° saisi à l'export (« 06 ») l'emporte
  et est gardé pour cette feuille.
- **Figé par version** : les renseignements du jeu (émetteur, indice, statut, n° saisis) sont enregistrés
  **avec le plan** (`PlanSettings.sheets`, dans la scène Pascal), donc dans chaque version de M15. Le jeu
  d'une version se **recalcule depuis son document** (scène = seule source de vérité, D79) : aucun PDF stocké.
- **Comparaison avec le jeu précédent** : l'aperçu d'une version (Historique → une version) affiche
  « Jeu de feuilles · indice B · APD · 2 feuilles modifiées », et la liste des feuilles nouvelles, modifiées
  ou supprimées, avec l'ancien n° s'il a changé. Une feuille est « modifiée » si son dessin change (empreinte
  du dessin au dixième de mm, dessiné toujours de la même façon : 1:100, cotes Exécution).
- Les builders des vues sont sortis de l'écran Vues dans `features/sheets/sheetViews.ts` (fonction pure
  `sheetView`), utilisée par l'écran et par la comparaison : même dessin, mêmes numéros.
- La fenêtre d'export lit et enregistre ces renseignements dans le projet (avant : gardés pendant la session).
- Tests : `features/sheets/sheetSet.test.ts` (numérotation de ROOMIT, n° saisi, renseignements gardés par la
  scène, empreintes stables, pièce renommée au R+1 → plan, plafond R+1 et nomenclatures modifiés, RDC et
  façades identiques ; coupe ajoutée ; n° changé ; feuilles supprimées).
- Limites : le dessin d'une ancienne version est refait avec le code actuel (une évolution du dessin de
  Fabrics change l'aspect d'une ancienne feuille, pas ses données) ; pas de tableau des indices sur la feuille
  (un seul indice courant par jeu) ; la comparaison dit quelle feuille a changé, pas où sur la feuille.

## 20.8 — Étude de `ifcopenshell.draw`

Faite le 2026-11-22. Rapport : `docs/phases/M20-ifcopenshell-draw.md` (D20-19, proposé par Claude, validé le 2026-11-23).

- Essai sur ROOMIT exporté par Fabrics (IFC2X3) et par Pascal (IFC4), et sur l'exemple de référence :
  plans, façades et coupes à 1:50, échelle exacte, en 1 à 5 s.
- Quatre défauts d'IfcOpenShell 0.9.0.post1 :
  - plantage par défaut ;
  - dessins superposés sur une page ;
  - « m² » échappé deux fois ;
  - styles en CSS ignorés par plusieurs visionneuses.
- Il ne fait pas de cotes, de repères, de cartouche, d'usages français ni de hachures, et il exige Python et
  OpenCascade côté serveur.
- Conclusion : le moteur de feuilles reste Fabrics (ADR 0007). Nouvel outil complémentaire hors application
  `tools/ifc/draw_plans.py` : un second dessin indépendant pour contrôler un export IFC (utile en M22).

## 20.9 — Vérification et gate G3

Fait le 2026-11-23, sauf l'essai dans le navigateur avec l'utilisateur et la revue d'un professionnel.

- Test `features/sheets/gateG3.test.ts` : un mur de ROOMIT déplacé dans la scène Pascal met à jour le plan
  et le plafond du RDC, la coupe, les façades, les nomenclatures et la planche. Le R+1 et la toiture ne
  changent pas.
- Liste de contrôle pour la revue d'un professionnel : `docs/phases/M20-review-checklist.md`.
- Rapport de fin de jalon : `docs/phases/M20-report.md` (critères G3, décisions à valider D20-16 à D20-19,
  limites, résultat de `check:all`).
- **Gate G3 ouvert** jusqu'à l'impression à 100 % par l'utilisateur et la revue d'un professionnel.
