# M19 — Rapport : édition 2D / 3D professionnelle (lot B, gate G2)

Travail sur `main`, 2026-11-18. Lot A (interface de Pascal, A1 à A7) validé par l'utilisateur le
2026-11-18. Lot B (B1 à B5) enchaîné à la demande de l'utilisateur, **test dans le navigateur à la fin de
B5**, un commit par sous-lot.

## 1. Ce qui a été fait

| Sous-lot | Résultat | Commit |
|---|---|---|
| B1 Outils 2D | Onglet Construire de Pascal ; Pascal verrouillé en mm (surfaces en m² à 2 décimales, menu Unités masqué, nombre tapé lu en mm) ; accrochages et alignements de Pascal ; aucun outil de plan Fabrics en double | 2b21a8b |
| B2 Édition 3D | Murs, portes, fenêtres, pièces et niveaux dessinés dans Pascal lus par les métrés ; rien d'effacé quand Fabrics réécrit la scène ; critères G2 testés par les commandes de Pascal | 8aff167 |
| B3 Matériaux | Couches de mur de Pascal lues par Fabrics ; quantités par couche sans double comptage ; tableau « Couches des murs » | 9d7ef17 |
| B4 Terrain | Parcelle, emprise au sol, coefficient d'emprise, recul minimal, altitudes des niveaux ; limite de propriété de Pascal en mm | 1b84f37 |
| B5 Cas difficiles et preuves | Avertissements « épaisseur invalide » et « longueur nulle » ; 9 cas difficiles ; exemples T1 / T2 ; tests 2D → 3D et 3D → 2D ; ce rapport | ce lot |

## 2. Critères d'acceptation (G2)

| Critère | Résultat | Preuve |
|---|---|---|
| Allonger un mur de 4000 à 5000 mm en 3D l'affiche à 5000 mm sur le plan et dans les métrés | **Vérifié par les tests**, par le geste de Pascal (glisser l'extrémité, le mur raccordé suit) et par son panneau « Longueur » ; étiquettes de Pascal en mm (« 5000mm ») | `scene/edit3d.test.ts`, `pascal/millimetreUnits.test.ts` |
| Un mur de 200 mm composé de 20 + 160 + 20 mm donne ses quantités par couche, sans double comptage | **Vérifié par les tests** : 3 couches, surface nette chacune, volumes 20 / 160 / 20 mm de la surface nette, somme = volume du mur | `measurements/wallLayers.test.ts` |
| Aucune surface ni aucun volume incohérent après la pose ou la suppression d'une ouverture | **Vérifié par les tests** : porte élargie puis supprimée (nette = brute, volume plein) ; fenêtre élargie dans T2 ; ouvertures qui dépassent ou se chevauchent (union, jamais de surface négative) | `scene/edit3d.test.ts`, `scene/precision.test.ts`, `scene/hardCases.test.ts` |
| Essai dans le navigateur | **À faire par l'utilisateur** (test de fin de B5). Contrôles faits dans Chromium sans carte graphique : onglet Construire, mur tapé `5000`, niveaux en mm, mur dessiné présent dans Métrés, bloc Terrain | — |

## 3. Rapport de précision (T1, T2)

Exemples nouveaux, calculés à la main (à relire par l'utilisateur, comme HOUSE-01) :
`fixtures/T1/spec.json` (studio 6000 × 5000 mm, une pièce, une porte, une fenêtre) et
`fixtures/T2/spec.json` (séjour + chambre 9000 × 5000 mm, une cloison, deux portes, deux fenêtres).

| Contrôle | Grandeurs comparées | Écart |
|---|---|---|
| T1 et T2, plan → scène Pascal → métrés | longueurs à l'axe, surfaces brutes, ouvertures, nettes, volumes des murs ; surfaces et périmètres des pièces | **0 mm, 0,00 m², 0,000 m³** |
| T1 et T2, 2D → 3D | chaque côté de mur devient un nœud Pascal aux mêmes coordonnées, épaisseur, hauteur ; ouvertures aux mêmes largeur et hauteur, sur le bon côté ; pièces présentes | **0 mm** |
| T1 et T2, emprise au sol calculée par Pascal | 30,00 m² et 45,00 m² | **0,00 m²** |
| T1, 3D → 2D : mur est déplacé de 1000 mm avec ses coins | plan, longueur 23200 mm, 62,64 / 59,55 m², studio 30,36 m² (la pièce suit), emprise 35,00 m² | **0** |
| T2, 3D → 2D : fenêtre élargie de 1200 à 1500 mm | largeur sur le plan, ouvertures 4,59 m², nette 68,85 m², volume 13,770 m³ | **0** |

Au total, plus de 30 grandeurs comparées (`scene/precision.test.ts`, dernier test : aucun écart).
Arrondis : longueurs au mm, surfaces au centième de m², volumes au millième de m³ (règles de
`docs/02-ARCHITECTURE.md`).

## 4. Cas difficiles

| Cas | Comportement | Preuve |
|---|---|---|
| Épaisseur nulle ou mur de longueur nulle par une commande de Pascal | Refusés (« Invalid wall geometry ») | `hardCases.test.ts` |
| Mur sans épaisseur déjà dans la scène | Volume 0, avertissement « épaisseur invalide » (nouveau) | idem |
| Mur de longueur nulle | Retiré par Pascal au chargement (natif ou ancien plan), il ne comptait rien ; avertissement « longueur nulle » (nouveau) pour un document hors scène | idem |
| Murs superposés | Avertissement, longueur commune annoncée (1000 mm) | idem |
| Raccord en T jusqu'à l'axe | La part de la cloison dans le mur n'est pas comptée deux fois | idem |
| Ouverture qui dépasse, ouvertures qui se chevauchent, porte plus haute que le mur | Avertissement ; union des ouvertures ; surface limitée à la hauteur du mur ; jamais de surface négative | idem |

## 5. Limites et points ouverts

- **Toitures, escaliers et dalles natifs de Pascal** : gardés dans la scène, mais **pas encore lus par
  les métrés** (leur géométrie par segments demande une conversion dédiée). Les toitures et escaliers
  des **anciens plans** restent des nœuds Fabrics : métrés justes, mais **invisibles et non modifiables
  dans la 3D de Pascal**. À décider : sous-lot dédié en M19 ou en M21.
- **Textes anglais écrits en dur dans Pascal** (≈ 660, dont les noms par défaut « Wall 1 ») : Fabrics
  remplace ces noms par ses noms automatiques dans les métrés, mais l'arbre de la Scène de Pascal les
  montre encore. Décision de l'utilisateur toujours attendue.
- **Commande `setWallGeometry` de Pascal** : prolonger un mur dans son axe depuis un coin ajoute un mur
  « pont » superposé (double comptage, signalé par l'avertissement « murs superposés »). Le geste de
  l'interface ne le fait pas. À signaler à Pascal.
- Pascal écrit « 900mm » (sans espace) : forme de Pascal, testée par ses propres tests.
- Accrochage sur un fond DXF importé et sur le niveau de référence : « Idées ».
- Couches des toitures et dalles, terrain et couches dans les exports Excel / CSV : M21.
- Les essais dans le navigateur ont été faits sans carte graphique (rendu logiciel) et sans compte
  Supabase (collaboration, commentaires, historique non rejoués).

## 6. Vérifications

- `npm run build`, `npm run lint`, `npm test` : voir le journal (`docs/PROGRESS.md`, entrée B5).
- `npm run check:all` : voir § 7.

## 7. `npm run check:all`

Passé le 2026-11-18, à la fin de B5 :

| Étape | Résultat |
|---|---|
| Compilation des paquets de Pascal, build, lint Fabrics | ✓ |
| Tests Fabrics (167 fichiers, 3 118 tests, baseline et architecture) | ✓ |
| Tests Pascal (bun) | 19 341 réussis, 71 en échec : **résultats identiques à la référence de Pascal** (échecs propres à Windows, déjà relevés en M17) |
| Lint Pascal (Biome) | ✓ |
| Doublons de code (`jscpd`) | **non exécuté** : `jscpd` n'est pas installé sur cette machine (déjà constaté en A7) ; `check:all` s'arrête sur cette étape |

## 8. Proposition

**G2 : PASS proposé pour les trois critères chiffrés**, sous réserve du test de l'utilisateur dans le
navigateur et de sa décision sur les toitures et escaliers natifs (§ 5).
