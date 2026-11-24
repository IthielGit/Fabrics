# M21 — Rapport de fin de jalon (gate G4)

Rédigé le 2026-11-24, à la fin de 21.8. Sous-lots 21.0 à 21.7 faits du 2026-11-23 au 2026-11-24.
Décisions : `docs/phases/M21-decisions.md`. Comparaison IFC : `docs/phases/M21-ifc-comparison.md`.
L'utilisateur a demandé tout M21 d'une traite, avec un essai dans le navigateur à la fin.

## Critères du gate G4

| Critère | Preuve automatique | Reste à faire |
|---|---|---|
| Mur 5000 × 3000 × 200 mm avec une ouverture 900 × 2100 mm : brut 15,00 m², ouverture 1,89 m², net 13,11 m², volume net 2,622 m³ | `quantities/gateG4.test.ts`, dans les deux familles (géométrie et métré), sur un plan passé par la scène Pascal | Essai dans le navigateur |
| Deux ouvertures qui se chevauchent : déduction de leur **union** | `gateG4.test.ts` : 2,70 m² déduits, pas 3,24 m² ; la trace le dit (« union »), l'avertissement « ouvertures qui se chevauchent » est levé | — |
| Ouverture qui dépasse du mur : seule la partie dans le mur est déduite, l'élément est signalé | `gateG4.test.ts`. **En hauteur** : seule la partie dans le mur est déduite (statut provisoire, contrôle « plus haute que le mur »). **En longueur** : l'ouverture est rejetée, rien n'est déduit (statut « données manquantes », avertissement « hors du mur ») | Contradiction tranchée le 2026-11-24 : option A (voir plus bas) |
| Écart de ±1 mm au plus sur les longueurs, moins de 0,1 % sur les quantités simples | `gateG4.test.ts` (HOUSE-01 élément par élément, totaux de HOUSE-02) ; écart réel 0 sur toutes les fixtures. IfcOpenShell : 0,000 % sur les murs et ouvertures de HOUSE-01, HOUSE-02 et du plan d'exemple | **Tolérances à confirmer par un métreur** (D21-6) |
| 100 % des fixtures passent | HOUSE-01 (pièces, murs, volumes, dalle), HOUSE-02 (deux niveaux, trémie, dalles découpées, volumes) et EDGE-01 (6 cas sur 7) : `scene/migrate/fixtures.test.ts`. Le 7ᵉ cas d'EDGE-01 (`ifc-nested-placements`) relève de l'import IFC : M22 | — |
| Chaque quantité exportée montre ses sources et sa règle | `gateG4.test.ts` : chaque ligne du tableau « Quantitatif » de HOUSE-01 et HOUSE-02 a ses sources, sa règle, sa version, sa formule et son statut ; tableau présent dans le CSV, l'Excel et le PDF Exécution (baseline) | Ouvrir un export dans le navigateur |

### Contradiction tranchée : option A (choix de l'utilisateur, 2026-11-24)

Le fonctionnement ci-dessous est gardé et le critère G4 de `docs/03-ROADMAP.md` a été précisé
(hauteur : partie contenue déduite ; longueur : rejet). La décision 1 d'EDGE-01 reste inchangée.

- Le roadmap dit, critère G4 : « Ouverture qui dépasse du mur : seule la partie dans le mur est
  déduite, l'élément est signalé ».
- La décision 1 d'EDGE-01 (`docs/phases/M17-fixtures-review.md`, 2026-11-18) dit : « window-off-wall :
  **rejet** avec message clair, jamais de déplacement silencieux, aucune surface déduite ».

Appliqué : la décision d'EDGE-01 pour une ouverture qui dépasse **en longueur**, car elle est plus
récente et plus précise. Pour une ouverture qui dépasse **en hauteur**, seule la partie dans le mur
est déduite. Dans les deux cas, l'élément est signalé et sa quantité n'est pas « validée ».
Deux options :

- **A (recommandée)** garder ce fonctionnement et préciser le texte du critère dans la roadmap ;
- **B** déduire aussi la partie contenue d'une ouverture qui dépasse en longueur (il faut alors revoir
  la décision 1 d'EDGE-01).

## Ce que M21 a livré

- **21.0** Décisions D21-1 à D21-8 (option recommandée partout).
- **21.1** Deux familles de quantités (`src/features/measurements/quantities/`) : géométriques et de
  métré, avec valeur exacte, éléments sources et niveau.
- **21.2** Règles versionnées (`fr-2026.1`) ; seuils de déduction réglables par catégorie, 0 m² par
  défaut (panneau Métrés, « Règles de métré ») ; enduits, peinture, tableaux, revêtements de sol,
  plafonds, plinthes ; dalles de Pascal et dalle de niveau.
- **21.3** Traçabilité : sources, dimensions, formule, déductions, règle et version ; tableau
  « Quantitatif » dans les exports Exécution et dans le panneau Métrés (détail au clic).
- **21.4** Statut de chaque quantité (validé, provisoire, non pris en charge, données manquantes) et
  synthèse : un quantitatif incomplet est annoncé comme tel.
- **21.5** Recalcul ciblé : seules les quantités des éléments touchés sont refaites ; le résultat
  est identique à un recalcul complet (testé).
- **21.6** Comparaison avec IfcOpenShell (`npm run check:ifc-quantities`).
- **21.7** Contrôles qualité : géométrie incohérente, propriétés manquantes, unités douteuses.
- **21.8** Test du gate G4, liste de non-régression, ce rapport.

## Défauts trouvés et corrigés pendant le jalon

- Plinthes : une porte du niveau du dessous, à la même place en plan, était déduite de la pièce du
  dessus (trouvé par les tests du recalcul ciblé, 21.5).
- Raccord de trois murs ou plus : la règle à l'axe compte deux fois une pointe d'angle, jusqu'à
  0,6 % du volume du mur (trouvé par la comparaison IfcOpenShell, 21.6). Ces quantités sont
  maintenant « provisoires » ; corriger la géométrie est noté dans les Idées.

## Limites connues

- Pièces dans l'IFC : l'IfcSpace de Pascal reprend la zone recalculée sur l'axe des murs (5 à 20 %
  plus grande que la surface au tracé). À traiter en M22.
- Les tableaux de métrés existants affichent toujours les m³ à 2 décimales. Seul le tableau
  « Quantitatif » suit D21-6 (3 décimales).
- Les toitures et escaliers ne sont pas comparés à l'IFC : Pascal ne les exporte qu'avec leur
  maillage 3D.
- Quelques cloisons des plans d'exemple n'ont pas de matériau : le contrôle « mur sans matériau » les
  signale (Idées).
- Les seuils, les tolérances et les règles « avant-métré à la française » restent à faire valider
  par un métreur.

## Essai dans le navigateur (à faire par l'utilisateur)

Liste dans le message de fin de jalon et dans `docs/regression-checklist.md` (M21).
