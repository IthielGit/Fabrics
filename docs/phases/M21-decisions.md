# M21 · 21.0 — Décisions (quantitatif automatique et traçabilité)

Proposé le 2026-11-23, feu vert de l'utilisateur pour M21 le 2026-11-23. **Toutes les décisions ont
été choisies par l'utilisateur le 2026-11-23 : option A (recommandée) partout.**

| Décision | Retenu |
|---|---|
| D21-1 Convention | Usages français (avant-métré à la française) |
| D21-2 Seuils de déduction | Réglables par catégorie, 0 m² par défaut (tout déduit) jusqu'à l'avis d'un métreur |
| D21-3 Tableaux | Quantité séparée « tableaux » (pourtour × épaisseur du mur) |
| D21-4 Murs | Longueur à l'axe, faces sur les faces, raccords comptés une fois (inchangé) |
| D21-5 Catégories | Toute la scène, éléments natifs de Pascal compris ; fondations et réseaux « non pris en charge » |
| D21-6 Tolérances | ±1 mm, < 0,1 %, provisoires jusqu'à la revue d'un métreur ; m² à 2 décimales, m³ à 3 |
| D21-7 Comparaison IFC | IFC4 de l'exportateur de Pascal, dans un test, relu par IfcOpenShell |
| D21-8 Traçabilité | Panneau Métrés (détail d'une quantité) et exports CSV / XLSX |

Le gate G3 de M20 reste ouvert tant que la revue d'un professionnel n'est pas
faite (`docs/phases/M20-review-checklist.md`). Cela ne bloque pas M21.

## Ce qui existe déjà (fin de M20)

| Quantité | Règle actuelle | Où |
|---|---|---|
| Longueur d'un mur | à l'axe | `measurements/measurements.ts` |
| Surface murale brute et nette | une face, longueur × hauteur ; **toutes** les ouvertures sont déduites, par **union** (pas de double déduction quand deux ouvertures se chevauchent) | idem |
| Faces des murs | longueur mesurée sur les deux faces, onglets compris, sans la part cachée par un mur en T | idem |
| Volume d'un mur | longueur × épaisseur × hauteur, ouvertures déduites, raccord en T compté une seule fois | idem, `wallJunctions.test.ts` |
| Couches d'un mur | surface = surface nette à l'axe ; volume réparti selon l'épaisseur de chaque couche | `measurements/wallLayers.ts` |
| Pièces | surface et périmètre du contour tracé ; surface habitable (hauteur ≥ 1800 mm) | `measurements.ts`, `habitableArea.ts` |
| Ouvertures | largeur × hauteur, limitée à la hauteur du mur ; fenêtre hors du mur rejetée (EDGE-01) | `measurements.ts` |
| Toitures, plafonds, escaliers, cheminées, plateformes | surfaces et nombres de base | `roofMeasurements`, `tables.ts` |

Ce qui manque : distinguer quantités **géométriques** (la forme exacte) et quantités **de métré**
(selon une convention), règles **versionnées**, **traçabilité**, **statut** de chaque quantité,
recalcul ciblé, comparaison IFC, contrôles qualité. Les dalles, toitures et escaliers dessinés
directement dans Pascal ne sont pas encore dans les métrés.

---

## D21-1 · Convention de métré de référence

| Option | Effet |
|---|---|
| **A (recommandée)** Usages français (avant-métré à la française), comme les plans (D20-2) | Une seule culture technique pour les plans et les métrés ; vocabulaire « brut / net / vide / tableau ». |
| B Aucune convention : quantités géométriques seulement | Plus simple, mais un métreur devra retraiter chaque quantité. |

## D21-2 · Seuils de déduction des vides (ouvertures) — quantités de métré

Les quantités **géométriques** déduisent toujours toutes les ouvertures (règle actuelle). La
question ne porte que sur les quantités **de métré**.

| Option | Effet |
|---|---|
| **A (recommandée)** Seuil réglable par catégorie (maçonnerie, enduits, peinture, revêtements), **0 m² par défaut** (tout est déduit) jusqu'à ce qu'un métreur donne les valeurs | Aucun chiffre inventé ; chaque quantité indique le seuil appliqué ; les seuils changent sans toucher au code. |
| B Seuils « usages courants » proposés par Claude, marqués provisoires | Plus proche d'un métré réel tout de suite, mais valeurs non vérifiées. |
| C Pas de seuil, jamais | Simple ; ne suit pas les usages de métré. |

## D21-3 · Tableaux (embrasures) des ouvertures

| Option | Effet |
|---|---|
| **A (recommandée)** Quantité séparée « tableaux » (pourtour de l'ouverture × épaisseur du mur) pour enduits et peinture | Visible et traçable ; on décide plus tard s'il s'ajoute à la surface nette. |
| B Pas de tableaux en M21 | Noté dans les idées. |

## D21-4 · Longueur des murs et angles

| Option | Effet |
|---|---|
| **A (recommandée)** Garder la règle actuelle : longueur à l'axe, faces mesurées sur les faces, raccords comptés une fois | Aucun chiffre existant ne change (anti-régression). |
| B Longueur au nu extérieur | Change les métrés existants et les fixtures. |

## D21-5 · Catégories couvertes en M21

| Option | Effet |
|---|---|
| **A (recommandée)** Tout ce que contient la scène : murs et couches, ouvertures, pièces (sols, plafonds, plinthes), dalles, toitures, escaliers, poteaux, y compris ceux dessinés dans Pascal ; fondations et réseaux en statut « non pris en charge » (D20-8) | Quantitatif complet du modèle ; rien d'oublié en silence. |
| B Gros œuvre seulement (murs, dalles, ouvertures) | Plus rapide ; le reste en « non pris en charge ». |

## D21-6 · Tolérances et arrondis

| Option | Effet |
|---|---|
| **A (recommandée)** ±1 mm sur les longueurs, moins de 0,1 % sur les quantités simples (valeurs de la roadmap), **provisoires** jusqu'à la revue d'un métreur ; calcul sans arrondi, affichage m² à 2 décimales et m³ à 3 décimales | Conforme au gate G4 et aux règles numériques de l'architecture. |

## D21-7 · Comparaison IFC (21.6)

L'export IFC actuel de Fabrics (IFC2X3, non strictement valide) sera remplacé par celui de Pascal
(IFC4) en M22 (ADR 0003).

| Option | Effet |
|---|---|
| **A (recommandée)** Comparer avec un IFC4 produit par l'exportateur de Pascal (`ifc-converter`), dans un test seulement (pas encore dans l'interface), quantités relues par IfcOpenShell (`tools/ifc/`) | Le travail sert encore en M22 ; pas d'effort sur un export voué à disparaître. |
| B Comparer avec l'export IFC actuel de Fabrics | Plus rapide, mais jeté en M22. |
| C Reporter la comparaison en M22 | M21 se termine sans ce point. |

## D21-8 · Où voir la traçabilité

| Option | Effet |
|---|---|
| **A (recommandée)** Dans le panneau Métrés (cliquer une quantité ouvre son détail : éléments sources, dimensions, formule, déductions, règle et version, statut) **et** dans les exports CSV / XLSX (colonnes dédiées) | Répond au critère G4 « chaque quantité exportée montre ses sources et sa règle ». |
| B Exports seulement | Moins de travail d'interface. |
