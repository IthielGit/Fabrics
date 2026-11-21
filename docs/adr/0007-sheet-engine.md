# ADR 0007 — Moteur des feuilles : Fabrics (jsPDF), dessin 2D de Pascal pour escaliers et mobilier

- Statut : **accepté** (choix de l'utilisateur, 2026-11-21, après l'essai de 20.1a)
- Jalon : M20 (sous-lot 20.1a)
- Tranche le doublon « PDF : `jspdf` / `pdfkit` » de l'ADR 0003 et la ligne « Mise en page, feuilles,
  cartouche : à décider M20 » de `docs/capabilities.md`.

## Contexte

Deux moteurs savent dessiner un plan de niveau imprimable à partir de la scène Pascal :

- Fabrics : `src/features/building/views/` (plans, façades, coupes, planche), cotes Client / Exécution
  (`src/features/dimensioning/`), cartouche et PDF vectoriel avec `jspdf` (`src/features/export/`) ;
- Pascal : `editor/src/lib/floorplan/` (`collectSheetGeometry`, `exportSheetsToPdf`, `pdfkit`),
  nomenclatures `schedules.ts`.

Essai sur le RDC de la Villa ROOMIT (A2, 1:50), comparé à la référence de l'utilisateur :
`docs/phases/M20-engine-trial.md`. Fabrics suit les usages français (cotes en 3 chaînes, `PP`, `All.`),
affiche noms et surfaces et a façades et coupes ; il ne dessinait ni les escaliers ni le mobilier natifs
de Pascal. Pascal dessine escaliers et mobilier, mais ses cotes se chevauchent, ses repères sont à
l'américaine, les noms et surfaces manquaient et il n'a ni façades ni coupes.

## Décision

1. **Les feuilles (plans, façades, coupes, cartouche, PDF) sont dessinées par Fabrics**, en `jspdf`.
2. **Escaliers et mobilier natifs de Pascal** : Fabrics reprend leur géométrie de plan de Pascal (la
   partie « modèle » de `def.floorplan`, sans les annotations), convertie en traits du dessin de
   Fabrics. Un escalier ou un meuble se dessine donc sur la feuille comme dans l'éditeur 2D.
3. `pdfkit` et `exportSheetsToPdf` de Pascal ne sont pas utilisés par Fabrics. Ils restent dans
   `packages/pascal/` (code de Pascal, non modifié) ; aucun écran de Fabrics ne les appelle.

## Conséquences

- Une seule bibliothèque PDF côté Fabrics, une seule mise en page, un seul cartouche.
- Les nomenclatures (20.3) sont faites par Fabrics à partir des métrés ; `schedules.ts` de Pascal peut
  servir de source de données (repères des ouvertures), pas de mise en page.
- Garde : `src/` n'importe pas `exportSheetsToPdf` ni `pdfkit` (test d'architecture, à ajouter avec
  l'étape 3 de 20.1a).
