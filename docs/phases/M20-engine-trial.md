# M20 · 20.1a étape 2 — Essai des deux moteurs de dessin (plan RDC de la Villa ROOMIT)

Fait le 2026-11-21. Même scène Pascal pour les deux moteurs : exemple `fixtures/ROOMIT-RDC` + un
escalier en L approximatif. A2 paysage, 1:50. Fichiers produits (non versionnés, dossier `tmp/`) :

- `tmp/m20-trial/out/fabrics-RDC.pdf` : moteur de Fabrics (`building/views`, cotes `dimensioning`, jsPDF)
- `tmp/m20-trial/out/pascal-RDC.pdf` : moteur de feuilles de Pascal (`collectSheetGeometry`,
  `exportSheetsToPdf`, pdfkit), réglages par défaut d'un document, unités mm
- `tmp/m20-trial/out/comparaison-RDC.png` et `.pdf` : référence (page 5), Fabrics, Pascal côte à côte

## Comparaison avec la référence

| Point | Référence | Fabrics | Pascal |
|---|---|---|---|
| Échelle 1:50 exacte sur A2 | oui | oui (placement calculé en mm de papier) | oui (fenêtre en pouces, même résultat) |
| Murs coupés | trait fort, hachures | noir plein | gris-bleu plein |
| Poteaux | noirs pleins | absents (compris dans les murs de l'exemple) | absents (idem) |
| Portes : battant et arc | oui | oui | oui (arc en tirets) |
| Fenêtres | cadre et vitrage | oui | oui |
| Repères de baies | `PP: 90 x 210`, `All. 110` | `P01 900 / 2100`, `F01 … All. 1100` (usages français, M10 ter) | bulles `D101`, `W101` (usage américain) |
| Cotes extérieures | 3 chaînes par façade | 3 chaînes par façade, lisibles | nombreuses chaînes qui se chevauchent |
| Cotes intérieures | une par pièce | une par pièce | nombreuses, superposées |
| Noms et surfaces des pièces | nom + surface | nom + surface + sol, hauteur sous plafond, dalle (plus chargé) | **absents** |
| Escalier | dessiné, flèche de montée | **absent** | dessiné (bloc noir), note en anglais `11 R @ 176 · T 188 · CLR W` |
| Mobilier | oui | **ne lit pas le mobilier du catalogue de Pascal** | sait le dessiner (non testé : catalogue en ligne) |
| Tableau des surfaces sur la feuille | oui | non (prévu en 20.3 et 20.4) | nomenclatures de Pascal (`schedules.ts`), à l'américaine |
| Cartouche | colonne droite | bande en bas (gabarit ROOMIT en 20.4) | aucun dans l'essai (la feuille le fournit) |
| Façades, coupes | — | **oui** (planche, M10) | **non** |
| Police | — | Helvetica | Liberation Sans et Geist Mono intégrées |

## Recommandation

**Moteur de Fabrics pour les feuilles** (plans, façades, coupes, cotes, cartouche, PDF jsPDF), et
**reprise du dessin 2D de Pascal pour ce que Fabrics ne sait pas dessiner** : escaliers et mobilier
natifs de Pascal. Leur géométrie de plan (`def.floorplan`, partie « modèle », sans les annotations
américaines) est convertie en traits du dessin de Fabrics. Ainsi :

- une seule bibliothèque PDF et une seule mise en page (pas de doublon, `docs/capabilities.md`) ;
- les usages français déjà validés en M10 ter (cotes au nu brut, `PP`, `All.`) sont gardés ;
- un escalier ou un meuble posé dans Pascal apparaît comme dans l'éditeur 2D.

À faire ensuite dans 20.1a (étape 3), avec ce choix : escaliers et mobilier de Pascal, murs hachurés
et poteaux, étiquettes de pièces allégées comme la référence (nom + surface sur la feuille), repères
`PP: 900 x 2100` et `All. 1100` en mm.

Autre option : le moteur de Pascal pour les plans de niveau. Il faudrait refaire en français ses
repères et ses cotes, désencombrer les chaînes, ajouter noms et surfaces, et garder quand même Fabrics
pour façades et coupes : deux moteurs et deux bibliothèques PDF (pdfkit et jsPDF).

**Choix de l'utilisateur : à venir.** Après le choix : ADR `docs/adr/0007-sheet-engine.md`, mise à
jour de `docs/capabilities.md`, suppression du code d'essai (`tmp/m20-trial/`,
`packages/pascal/packages/editor/fabrics-trial.tmp.ts`).
