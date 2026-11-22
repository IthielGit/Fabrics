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

Proposé le 2026-11-22, **feu vert de l'utilisateur le 2026-11-22** (D20-10 : A, D20-11 : A). Modèle : `/model opus`.
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
3. **Tableau de surfaces sur la feuille** : un tableau « Pièces Niveau R+1 » (pièce, surface) et un
   total, lus des métrés. Format de la référence (D20-3, colonne droite). Le tableau du RDC sera
   réutilisé (20.4 le place sur le gabarit final).
4. **Plan de toiture** (nouveau) : contour de la toiture à partir des pans Pascal (projection en
   plan), débord de toiture, trois chaînes de cotes extérieures, escalier d'accès au toit (même
   symbole que l'escalier du plan de niveau), **flèches « Pente x % »** (valeur lue dans le modèle,
   jamais saisie à la main). Pas de pièces ni de surfaces sur ce plan.
5. **Surfaces et périmètres de toiture** : la surface réelle de chaque pan (surface en plan × √(1 + pente²))
   est affichée sur la feuille de toiture **seulement si** l'utilisateur le demande (D20-10).
   Reprise de `roofQuantities.ts`, sans nouveau calcul.
6. **Lien au modèle** : déplacer un débord ou changer la pente dans Pascal met à jour le plan de
   toiture (cotes, flèches) sans autre action. Test automatisé.
7. **Exactitude imprimée** : à 1:50, les cotes des pages 6 et 7 se mesurent à la règle comme sur la
   référence (écart ≤ 0,1 mm, test de `printScale` étendu).
8. **Suivi** : roadmap (20.1b), `PROGRESS.md`, `docs/regression-checklist.md`, `npm run check:all`,
   `packages/pascal/FABRICS_CHANGES.md` si un fichier de Pascal est touché (règle E-001 de Pascal).

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

### Critères d'acceptation (20.1b)

- La feuille R+1 se compare à la page 6 : mêmes éléments, mêmes cotes en mm, mêmes surfaces, total 144,16 m²
  (à l'écart toléré près).
- La feuille de toiture se compare à la page 7 : même contour, mêmes chaînes de cotes, escalier d'accès,
  flèches de pente avec la valeur du modèle.
- Modifier un mur, un débord ou une pente dans Pascal met à jour les plans sans autre action.
- Imprimé à 100 % à 1:50, une cote de 4500 mm mesure 90 mm à la règle.
- Aucune longueur en m ou cm, aucun texte en anglais.
