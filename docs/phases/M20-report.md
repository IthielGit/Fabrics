# M20 — Rapport de fin de jalon (gate G3)

Rédigé le 2026-11-23, à la fin de 20.9. Sous-lots 20.0 à 20.8 faits du 2026-11-21 au 2026-11-22
(détail : `docs/phases/M20-plan.md`, décisions : `docs/phases/M20-decisions.md`).

## Critères du gate G3

| Critère | Preuve automatique | Reste à faire |
|---|---|---|
| Imprimées à 100 %, les cotes sont justes à 1:50, 1:100 et 1:200 | Le PDF produit est relu, et chaque trait est à sa place à ≤ 0,1 mm : `export/printScale.test.ts` (RDC 1:50), `export/printScaleR1.test.ts` (R+1 et toiture à 1:50, 1:100, 1:200), `export/sheetTemplate.test.ts` (feuille A2 au gabarit), `export/vectorOutput.test.ts` (police intégrée, SVG) | **Impression à 100 % et mesure à la règle par l'utilisateur** (liste de contrôle A1-A3) |
| Une hauteur d'étage de 2500 mm mesure 50 mm sur une façade à 1:50 | `scene/roomitViews.test.ts` (façade de ROOMIT relue dans le PDF) | Mesure à la règle (A3) |
| Modifier un mur met à jour plans, coupes, façades et nomenclatures | `sheets/gateG3.test.ts` (nouveau) : un mur de ROOMIT déplacé de 500 mm dans la scène Pascal. Sont modifiés : le plan et le plafond du RDC, la coupe A–A, les façades nord et sud, les nomenclatures et la planche. Le R+1, son plafond et la toiture restent identiques. Avant cela : `scene/modelLink.test.ts` (20.1a), `scene/roofModelLink.test.ts` (20.1b) | Essai dans le navigateur |
| Aucun conflit d'annotations critique | `scene/roomitAnnotations.test.ts` : aucun texte n'en recouvre un autre à sa taille imprimée, sur les plans de ROOMIT (Client, Exécution, toiture) | Contrôle visuel (B9). Défaut mineur connu : sur le R+1, le repère `PP: 900 x 2100` de la Chambre 3 touche un poteau. La détection ne compare que les textes entre eux, pas les textes et les traits |
| Revue d'un professionnel du bâtiment réussie | — | **À faire** avec `docs/phases/M20-review-checklist.md`. **Le gate G3 reste ouvert tant que cette revue n'est pas faite** |

## Ce que M20 a livré

- **20.1** Vues liées au modèle Pascal : plans de niveau RDC et R+1, plan de toiture, façades et coupes avec les
  toitures de Pascal, exemple ROOMIT (RDC, R+1, toiture) comme cas de comparaison.
- **20.2** Annotations : conflits corrigés à la taille imprimée, textes tournés centrés, axes, légende des hachures.
- **20.3** Nomenclatures (menuiseries, pièces) et plan de plafond.
- **20.4** Gabarit de feuille de la référence : colonne de droite, rose des vents, cartouche avec statut, A4 à A1.
- **20.5** Styles graphiques : épaisseurs ISO selon l'échelle, catégories et visibilité, masques sous les noms
  de pièces.
- **20.6** PDF avec Liberation Sans intégrée ; export SVG à l'échelle, en calques.
- **20.7** Révisions : jeu de feuilles numéroté et enregistré avec le plan (donc dans chaque version), comparé
  au précédent dans l'aperçu d'une version.
- **20.8** `ifcopenshell.draw` étudié : pas de moteur de feuilles, outil de contrôle des IFC
  (`tools/ifc/draw_plans.py`).
- **20.9** Test du gate G3, liste de contrôle de la revue, ce rapport.

## Décisions proposées par Claude, à valider par l'utilisateur

| N° | Sujet | Proposition |
|---|---|---|
| D20-16 | Styles graphiques | Épaisseurs ISO selon l'échelle, 9 catégories et les hachures, masques sous les noms de pièces |
| D20-17 | Sorties vectorielles | Liberation Sans intégrée au PDF ; SVG = le dessin seul à l'échelle, en calques |
| D20-18 | Révisions | Jeu recalculé depuis chaque version (aucun PDF stocké), un indice par jeu, comparaison par empreinte |
| D20-19 | `ifcopenshell.draw` | Outil de contrôle hors application, pas de moteur de feuilles |

## Vérifications

- `npm run build`, `npm run lint`, `npm test` : réussis (206 fichiers de test et plus, 3300 tests et plus ;
  la référence anti-régression a été mise à jour une fois, en 20.5, pour les masques).
- `npm run check:all` (2026-11-23) :
  - compilation de Pascal, build, lint et tests de Fabrics réussis ;
  - tests de Pascal : 74 échecs contre 71 dans la référence Windows. Les 3 de plus sont des **dépassements du
    délai de 5 s** sur ce poste (15 s, 44 s et 6 s). Relancés avec un délai de 120 s, ils réussissent tous les
    trois. Le code de Pascal n'a pas changé depuis M19.
  - `check:all` s'arrête donc à cette étape sous Windows : lint de Pascal et doublons non relancés. La CI Linux
    reste la référence.

## Limites connues (reportées)

- Détails à 1:20 et 1:10 : pas de vue de détail (échelles disponibles, sans dessin dédié).
- Façades et coupes sans catégories de visibilité. Le réglage de visibilité est commun à toutes les vues et
  n'est pas enregistré.
- Le SVG n'a pas de cartouche. Le PDF des métrés reste en Helvetica.
- Une ancienne version est redessinée avec le code actuel. Il n'y a pas de tableau des indices sur la feuille.
- La détection des conflits ne compare pas les textes aux traits (exemple : le repère contre un poteau).
- Fondations, réseaux et structure : seulement dessinés (D20-8).
