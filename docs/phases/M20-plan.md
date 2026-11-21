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
5. **Exactitude imprimée** : test qui lit le PDF produit : à 1:50, 1000 mm = 20,0 mm sur la feuille
   (écart ≤ 0,1 mm) ; impression à 100 % par vous.
6. Suivi : roadmap, `PROGRESS.md`, `docs/regression-checklist.md`, `npm run check:all`.

### Critères d'acceptation (20.1a)

- La feuille RDC de l'exemple se compare à la page 5 : mêmes éléments dessinés, mêmes cotes (en mm),
  mêmes surfaces de pièces (à l'écart toléré près)
- Modifier un mur met à jour le plan, ses cotes et les surfaces sans autre action
- Imprimée à 100 % à 1:50, une cote de 4500 mm mesure 90 mm à la règle
- Aucune longueur en m ni en cm, aucun texte en anglais
